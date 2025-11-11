import os
import pandas as pd
import unicodedata
import re
import requests
import json
import gspread
import numpy as np
import base64 
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import warnings
from urllib.parse import quote
import hashlib
from gspread_dataframe import set_with_dataframe
import logging
from typing import List, Dict

# ----------------------------
# Logging (arquivo + console)
# ----------------------------
logging.basicConfig(
    level=logging.INFO, # Pode mudar para logging.DEBUG para mais detalhes durante a depuração.
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler("pipeline_tratamento.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

# --------------------------------------------------------
# Utilitário de banner de seção (para logs/prints)
# --------------------------------------------------------
def _BANNER(titulo):
    print("\n" + "="*18 + f" {titulo} " + "="*18)
    logging.info(titulo)

def _SUB(titulo):
    print("— " + titulo)
    logging.info(titulo)

# ========================================================
# 1) CONFIGURAÇÃO GOOGLE DRIVE / SHEETS (REMOVIDA LIMPEZA AGRESSIVA)
# ========================================================

_BANNER("1) CONFIGURAÇÃO GOOGLE DRIVE/SHEETS")

# ----------------------------
# AUTENTICAÇÃO ÚNICA (usar apenas uma vez)
# ----------------------------
CAMINHO_CREDENCIAIS = ".github/workflows/credentials.json"
SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets"
]

try:
    logging.info(f"Tentando ler string Base64 do arquivo: '{CAMINHO_CREDENCIAIS}'")
    with open(CAMINHO_CREDENCIAIS, "r", encoding="utf-8") as file:
        encoded_json_string = file.read().strip() # Lê e remove espaços/newlines

    # Decodifica de Base64 para bytes, depois para string UTF-8
    decoded_json_bytes = base64.b64decode(encoded_json_string)
    decoded_json_str = decoded_json_bytes.decode('utf-8')
    
    # --- CORREÇÃO AQUI: A linha de limpeza agressiva 'clean_json_str = re.sub(...)' FOI REMOVIDA. ---
    # Agora passamos a string JSON decodificada diretamente para json.loads.
    service_account_info = json.loads(decoded_json_str)
    
    logging.info("✅ Arquivo de credenciais Base64 lido e JSON decodificado com sucesso (limpeza agressiva removida).")
    
    creds = Credentials.from_service_account_info(service_account_info, scopes=SCOPES)
    drive_service = build("drive", "v3", credentials=creds)
    gc = gspread.authorize(creds)
    client = gc
    logging.info("✅ Autenticação Google OK")
    print("✅ Autenticação Google OK.")
except FileNotFoundError:
    logging.critical(f"❌ Falha na autenticação Google: Arquivo de credenciais não encontrado em '{CAMINHO_CREDENCIAIS}'. Verifique o caminho e a criação do arquivo no workflow.", exc_info=True)
    raise SystemExit("Erro crítico: Arquivo de credenciais não encontrado. O pipeline será encerrado.")
except base64.binascii.Error as e:
    logging.critical(f"❌ Falha na autenticação Google: Erro ao decodificar a string Base64. Conteúdo inválido no secret? Erro: {e}. O pipeline será encerrado.", exc_info=True)
    raise SystemExit("Erro crítico: Conteúdo Base64 inválido no arquivo de credenciais.")
except json.JSONDecodeError as e:
    logging.critical(f"❌ Falha na autenticação Google: Erro ao decodificar JSON da string Base64 decodificada. Conteúdo inválido. Erro: {e}. O pipeline será encerrado.", exc_info=True)
    # Se este erro ainda ocorrer, o problema está na string JSON decodificada antes de qualquer limpeza.
    # O log do YML (com xxd -p) será crucial para ver o que o Base64 produziu.
    raise SystemExit("Erro crítico: Conteúdo JSON inválido na string Base64 decodificada.")
except Exception as e:
    logging.critical(f"❌ Falha na autenticação Google. Erro inesperado: {e}. O pipeline será encerrado.", exc_info=True)
    raise SystemExit("Erro crítico: Falha inesperada na autenticação Google. O pipeline será encerrado.")

# ========================================================
# 2) LEITURA DA PLANILHA BRUTA (GOOGLE DRIVE - DINÂMICO) - MANTIDO COM MELHORIAS DE TRY/EXCEPT
# ========================================================
_BANNER("2) LEITURA DA PLANILHA BRUTA (GOOGLE DRIVE - DINÂMICO)")

# --- Função helper para obter a última planilha da pasta bruta ---
def get_latest_spreadsheet_df(folder_id: str, gspread_client, drive_svc) -> (str, str, pd.DataFrame):
    try:
        res = drive_svc.files().list(
            q=f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
            orderBy="modifiedTime desc",
            pageSize=1,
            fields="files(id, name, modifiedTime)"
        ).execute()
        files = res.get("files", [])
        if not files:
            logging.critical(
                f"❌ Nenhuma planilha bruta encontrada na pasta do Google Drive com ID: '{folder_id}'. O pipeline será encerrado.",
                exc_info=True
            )
            raise SystemExit("Erro crítico: Nenhuma planilha bruta encontrada.")
        latest = files[0]
        fid, fname = latest["id"], latest["name"]

        # Abre a planilha pelo id (key) e pega a primeira aba
        sh = gspread_client.open_by_key(fid)
        aba = sh.sheet1

        # Lê os valores brutos (tudo como string) — PRESERVA exatamente a forma que está no Sheets
        raw_vals = aba.get_all_values()  # lista de listas: [header_row, row1, row2, ...]
        if not raw_vals or len(raw_vals) < 1:
            logging.critical(f"❌ A planilha '{fname}' está vazia (get_all_values retornou vazio).")
            raise SystemExit("Erro crítico: planilha bruta vazia.")

        header = raw_vals[0]
        rows = raw_vals[1:]

        # Monta DataFrame PRESERVANDO strings (sem coercão de tipos).
        # Isto garante que valores como "1", "1.0", "Não há dados", "01/01/2023" sejam mantidos tal como estão.
        dfb = pd.DataFrame(rows, columns=header)

        # Retorna id, nome e DataFrame (sem conversões automáticas)
        return fid, fname, dfb

    except Exception as e:
        logging.critical(f"❌ Erro ao obter a última planilha da pasta bruta '{folder_id}': {e}. O pipeline será encerrado.", exc_info=True)
        raise SystemExit("Erro crítico: Falha ao carregar planilha bruta.")

# --- Uso ---
FOLDER_ID_BRUTA = "1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5"  # Mantenha seu ID de pasta aqui
try:
    latest_file_id, latest_file_name, df_bruta = get_latest_spreadsheet_df(FOLDER_ID_BRUTA, gc, drive_service)

    # --- Garantir normalização consistente IMEDIATAMENTE após leitura da planilha bruta ---
    # Observação: aqui aplicamos uma normalização local de cabeçalhos (snake_case) sem depender
    # da função normalizar_nome_coluna() que é definida mais adiante no script.
    def _normalizar_cols_local(cols):
        out = []
        for col in cols:
            if col is None:
                out.append("")
                continue
            c = unicodedata.normalize("NFKD", str(col)).encode("ASCII", "ignore").decode("utf-8")
            c = c.lower()
            c = re.sub(r"[^a-z0-9]+", "_", c)
            c = re.sub(r"_+", "_", c).strip("_")
            out.append(c)
        return out

    # aplica normalização nos nomes de coluna e cria df normalizado
    df_bruta.columns = _normalizar_cols_local(df_bruta.columns.tolist())
    df = df_bruta.copy()  # DataFrame principal a ser usado no pipeline

    # Normalizar coluna 'protocolo' (strip + upper) na bruta desde já
    if "protocolo" in df_bruta.columns:
        df_bruta["protocolo"] = df_bruta["protocolo"].astype(str).str.strip().str.upper()
        df["protocolo"] = df_bruta["protocolo"]
    else:
        # Garante a existência da coluna 'protocolo' (vazia por ora) para evitar key errors posteriores
        df_bruta["protocolo"] = pd.Series([""] * len(df_bruta))
        df["protocolo"] = df_bruta["protocolo"]

    logging.info("Normalização inicial aplicada em df_bruta (colunas e protocolo).")
    print(f"📂 Última planilha encontrada: {latest_file_name} ({latest_file_id})")
    logging.info(f"Última planilha encontrada: {latest_file_name} ({latest_file_id})")
    print(f"✅ Planilha bruta importada com sucesso: {df_bruta.shape}")
    logging.info(f"Planilha bruta importada com sucesso: {df_bruta.shape}")

except SystemExit:  # Captura o SystemExit da função helper para não logar novamente
    raise
except Exception as e:
    logging.critical(f"❌ Erro ao processar a planilha bruta principal. Verifique o FOLDER_ID_BRUTA e permissões. Erro: {e}. O pipeline será encerrado.", exc_info=True)
    raise SystemExit("Erro crítico: Falha no processamento da planilha bruta.")

# ========================================================
# 3) NORMALIZAÇÃO DE NOMES DE COLUNA - MANTIDO COM MELHORIAS DE TRY/EXCEPT
# ========================================================
_BANNER("3) NORMALIZAÇÃO DE NOMES DE COLUNA")

# Função normalizar_nome_coluna já estava bem definida.
def normalizar_nome_coluna(col: str) -> str:
    if col is None:
        return ""
    col = unicodedata.normalize("NFKD", str(col)).encode("ASCII", "ignore").decode("utf-8")
    col = col.lower()
    col = re.sub(r"[^a-z0-9]+", "_", col)
    return re.sub(r"_+", "_", col).strip("_")

try:
    df.columns = [normalizar_nome_coluna(c) for c in df.columns]
    print("✅ Cabeçalhos normalizados:", list(df.columns))
    logging.info(f"Cabeçalhos normalizados: {list(df.columns)}")

    # Padroniza a coluna 'protocolo' consistentemente (strip + upper)
    def normalize_protocolo_col(df_local: pd.DataFrame, col: str = "protocolo") -> pd.DataFrame:
        if col in df_local.columns:
            df_local[col] = df_local[col].astype(str).str.strip().str.upper()
        else:
            logging.warning(f"⚠️ Coluna '{col}' não encontrada após normalização de protocolo!")
        return df_local

    df = normalize_protocolo_col(df, "protocolo")
    logging.info("Coluna 'protocolo' padronizada.")
except Exception as e:
    logging.critical(f"❌ Erro na normalização de nomes de coluna ou padronização de protocolo. Erro: {e}. O pipeline será encerrado.", exc_info=True)
    raise SystemExit("Erro crítico: Falha na normalização de dados.")

# ========================================================
# 4) FUNÇÕES AUXILIARES (codificação / datas / post em lotes) - MANTIDO
# ========================================================
_BANNER("4) AUXILIARES (codificação, datas, lotes)")

def _clean_whitespace(v) -> str:
    """NOVA FUNÇÃO: Limpa apenas espaços extras (início, fim e múltiplos)
       mas PRESERVA acentuação e capitalização."""
    if v is None:
        return ""
    s = str(v).strip()
    s = re.sub(r"\s+", " ", s)
    return s

def _canon_txt(v) -> str:
    """
    Função de canonização de texto: converte para string, remove acentos,
    converte para minúsculas e limpa espaços.
    """
    if v is None: return ""
    s = unicodedata.normalize("NFKD", str(v))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    s = re.sub(r"\s+", " ", s)
    return s

def _canon_txt_preserve_case(v) -> str:
    """
    NOVA VERSÃO: Canoniza texto (remove acentos, limpa espaços),
    mas PRESERVA a capitalização original.
    """
    if v is None:
        return ""
    s = unicodedata.normalize("NFKD", str(v))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    return s

def _to_proper_case_pt(text: str) -> str:
    """
    Converte uma string para o formato 'Title Case' apropriado para o português.
    """
    if not isinstance(text, str) or not text.strip(): return text
    conectivos = ['de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o', 'em']
    palavras = text.lower().split()
    palavras_capitalizadas = []
    for i, palavra in enumerate(palavras):
        if i == 0 or palavra not in conectivos:
            palavras_capitalizadas.append(palavra.capitalize())
        else:
            palavras_capitalizadas.append(palavra)
    return ' '.join(palavras_capitalizadas)

def _to_ddmmaa_text(series: pd.Series) -> pd.Series:
    EXCEL_BASE = pd.Timestamp("1899-12-30")
    def _one(v):
        if pd.isna(v): return None
        if isinstance(v, (pd.Timestamp, np.datetime64)):
            dt = pd.to_datetime(v, errors="coerce")
            return dt.strftime("%d/%m/%Y") if pd.notna(dt) else None
        s = str(v).strip()
        if s == "": return None
        s2 = s.replace("T", " ").replace("Z", "")
        s2 = re.sub(r"([+-]\d{2}:?\d{2}|[+-]\d{2}| UTC)$", "", s2).strip()
        if re.match(r"^\d{4}-\d{2}-\d{2}", s2):
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                dt = pd.to_datetime(s2, errors="coerce", dayfirst=False)
            return dt.strftime("%d/%m/%Y") if pd.notna(dt) else s
        if re.fullmatch(r"\d{5,6}(\.\d+)?", s2):
            try: return (EXCEL_BASE + pd.to_timedelta(float(s2), "D")).strftime("%d/%m/%Y")
            except: pass
        if re.fullmatch(r"\d{13}", s2):
            dt = pd.to_datetime(int(s2), unit="ms", errors="coerce")
            return dt.strftime("%d/%m/%Y") if pd.notna(dt) else s
        if re.fullmatch(r"\d{10}(\.\d+)?", s2):
            dt = pd.to_datetime(float(s2), unit="s", errors="coerce")
            return dt.strftime("%d/%m/%Y") if pd.notna(dt) else s
        for fmt in ["%d/%m/%Y %H:%M:%S","%d/%m/%Y %H:%M","%d/%m/%Y", "%d/%m/%y %H:%M:%S","%d/%m/%y %H:%M","%d/%m/%y", "%Y-%m-%d %H:%M:%S","%Y-%m-%d %H:%M","%Y-%m-%d"]:
            try: return pd.to_datetime(s2, format=fmt).strftime("%d/%m/%Y")
            except: pass
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            dt = pd.to_datetime(s2, dayfirst=True, errors="coerce")
        return dt.strftime("%d/%m/%Y") if pd.notna(dt) else s
    return series.apply(_one).astype("object")

def _conclusao_strict(series: pd.Series) -> pd.Series:
    s = pd.Series(series, dtype="object").astype(str).str.strip()
    s_cf = s.str.casefold()
    invalid = {"não informado","na","n/a","n\\a","nan","null","none","","-","--", "outro","outros","nat","sem informação","sem informacao"}
    out = s.copy()
    mask_invalid = s_cf.isin(invalid)
    out.loc[mask_invalid] = "Não concluído"
    rest_idx = out.index[~mask_invalid]
    if len(rest_idx) > 0:
        s_rest = s.loc[rest_idx]
        s_norm = s_rest.str.replace("T"," ").str.replace("Z","", regex=False)
        s_norm = s_norm.str.replace(r"([+-]\d{2}:?\d{2}|[+-]\d{2}| UTC)$","", regex=True).str.strip()
        iso_mask = s_norm.str.match(r"^\d{4}-\d{2}-\d{2}")
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            dt = pd.Series(pd.NaT, index=rest_idx, dtype="datetime64[ns]")
            iso_idx = iso_mask[iso_mask].index
            if len(iso_idx) > 0:
                dt.loc[iso_idx] = pd.to_datetime(s_rest.loc[iso_idx], errors="coerce", dayfirst=False)
            non_iso_idx = iso_mask[~iso_mask].index
            if len(non_iso_idx) > 0:
                dt.loc[non_iso_idx] = pd.to_datetime(s_rest.loc[non_iso_idx], errors="coerce", dayfirst=True)
        good_idx = dt.index[dt.notna()]
        if len(good_idx) > 0:
            out.loc[good_idx] = dt.loc[good_idx].dt.strftime("%d/%m/%Y")
    return out

def _parse_dt_cmp(series: pd.Series) -> pd.Series:
    EXCEL_BASE = pd.Timestamp("1899-12-30")
    def _one(v):
        if pd.isna(v): return pd.NaT
        s = str(v).strip()
        if s == "": return pd.NaT
        s2 = s.replace("T"," ").replace("Z","")
        s2 = re.sub(r"([+-]\d{2}:?\d{2}|[+-]\d{2}| UTC)$","",s2).strip()
        if re.fullmatch(r"\d{5,6}(\.\d+)?", s2):
            try: return EXCEL_BASE + pd.to_timedelta(float(s2), "D")
            except: return pd.NaT
        if re.fullmatch(r"\d{13}", s2):
            return pd.to_datetime(int(s2), unit="ms", errors="coerce")
        if re.fullmatch(r"\d{10}(\.\d+)?", s2):
            return pd.to_datetime(float(s2), unit="s", errors="coerce")
        for fmt in ["%d/%m/%Y %H:%M:%S","%d/%m/%Y %H:%M","%d/%m/%Y", "%d/%m/%y %H:%M:%S","%d/%m/%y %H:%M","%d/%m/%y", "%Y-%m-%d %H:%M:%S","%Y-%m-%d %H:%M","%Y-%m-%d"]:
            try: return pd.to_datetime(s2, format=fmt)
            except: pass
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            return pd.to_datetime(s2, dayfirst=True, errors="coerce")
    return series.apply(_one)

def _is_nao_ha_dados(v) -> bool:
    if v is None: return False
    s = str(v).strip()
    if s == "": return False
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"\s+", " ", s).strip().casefold()
    return s == "nao ha dados"

def _is_concluida(v) -> bool:
    if pd.isna(v): return False
    s = str(v).strip()
    if s == "": return False
    s = "".join(ch for ch in unicodedata.normalize("NFD", s) if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^A-Za-z]+", " ", s).strip().casefold()
    return s == "concluida"

def _looks_like_demanda_concluida(v) -> bool:
    if pd.isna(v): return False
    s = str(v).strip()
    if s == "": return False
    s = unicodedata.normalize("NFD", s)
    s = s.replace("�", "i").replace("?", "i")
    s = re.sub(r"i{2,}", "i", s, flags=re.IGNORECASE)
    s = re.sub(r"[^A-Za-z]+", " ", s).strip().casefold()
    return s == "demanda concluida"

def _canon_prazo_restante(v):
    if pd.isna(v): return v
    if isinstance(v, (int, float)) and not pd.isna(v):
        return v
    s = _canon_txt(v)
    if s == "": return s
    s_clean = s.strip()
    if _looks_like_demanda_concluida(s_clean):
        return "Demanda Concluída"
    return s_clean

# --- LÓGICA DE MAPEAMENTO DE ÓRGÃOS MOVIDA PARA CÁ (ESCOPO GLOBAL) ---

def _norm_tema(s):
    if pd.isna(s): return ""
    s = str(s).strip().lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", s)

def _div_temas(v, seps=(",", ";", "|", "/")):
    if pd.isna(v): return []
    t = str(v)
    for s in seps: t = t.replace(s, ",")
    partes = [p.strip() for p in t.split(",") if p.strip()]
    return partes if partes else [str(v).strip()]

MAP_TEMA_PARA_ORGAO = {
    "Administração Pública":"Secretaria de Administração","Agricultura":"Secretaria de Obras e Agricultura",
    "Assistência Social e Direitos Humanos":"Secretaria de Assistência Social e Direitos Humanos",
    "Assuntos Jurídicos":"Procuradoria Geral","Comunicação Social":"Secretaria de Comunicação Social e Relações Públicas",
    "Controle Governamental":"Secretaria de Controle Interno","Criança, Adolescente e Idoso":"Secretaria de Assistência Social e Direitos Humanos",
    "Cultura e Turismo":"Secretaria de Cultura e Turismo","Defesa Civil":"Secretaria de Defesa Civil",
    "Direitos à Pessoa com Deficiência":"Secretaria de Assistência Social e Direitos Humanos",
    "Direitos e Vantagens do Servidor":"Secretaria de Administração","Educação":"Secretaria de Educação",
    "Empresas e Legalizações":"Secretaria de Fazenda","Esporte e Lazer":"Secretaria de Esporte e Lazer",
    "Fiscalização e tributos":"Secretaria de Fazenda","Fiscalização Urbana, Regularização e Registro de Imóveis":"Secretaria de Urbanismo e Habitação",
    "FUNDEC":"FUNDEC","Governança":"Secretaria de Governo","Governo Municipal e Enterro Gratuito":"Secretaria de Governo",
    "Habitação":"Secretaria de Urbanismo e Habitação","Inclusão e Acessibilidade":"Secretaria de Gestão, Inclusão e Mulher",
    "Meio Ambiente":"Secretaria de Meio Ambiente",
    "Meio Ambiente (Poluição Sonora, Árvores, Licenças e Fiscalizações Ambientais e etc.)":"Secretaria de Meio Ambiente",
    "Assédio":"Secretaria de Comunicação Social e Relações Públicas","Obras Públicas":"Secretaria de Obras e Agricultura",
    "Obras, Limpeza Urbana e Braço de Luz":"Secretaria de Obras e Agricultura","Proteção Animal":"Secretaria de Proteção Animal",
    "Saúde":"Secretaria de Saúde","Segurança Pública":"Secretaria de Segurança Pública",
    "Segurança, Sinalização e Multas":"Secretaria de Segurança Pública",
    "Trabalho, Emprego e Renda":"Secretaria de Trabalho, Emprego e Renda",
    "Transportes e Serviços Públicos":"Secretaria de Transportes e Serviços Públicos",
    "Transportes, Serviços Públicos e Troca de Lâmpadas":"Secretaria de Transportes e Serviços Públicos",
    "Urbanismo":"Secretaria de Urbanismo e Habitação",
    "Vetores e Zoonoses (Combate à Dengue, Controle de Pragas, Criação Irregular de Animais e etc.)":"Secretaria de Saúde",
    "Vigilância Sanitária":"Secretaria de Saúde",
    "Obras":"Secretaria de Obras e Agricultura","Trabalho":"Secretaria de Trabalho, Emprego e Renda",
    "Segurança":"Secretaria de Segurança Pública","Serviços Públicos e Troca de Lâmpadas":"Secretaria de Transportes e Serviços Públicos",
    "Árvores":"Secretaria de Meio Ambiente","Controle de Pragas":"Secretaria de Saúde","Criação Irregular de Animais":"Secretaria de Saúde",
    "Adolescente e Idoso":"Secretaria de Assistência Social e Direitos Humanos","Criança":"Secretaria de Assistência Social e Direitos Humanos",
    "Emprego e Renda":"Secretaria de Trabalho, Emprego e Renda","Fiscalização Urbana":"Secretaria de Urbanismo e Habitação",
    "Regularização e Registro de Imóveis":"Secretaria de Urbanismo e Habitação","Limpeza Urbana e Braço de Luz":"Secretaria de Obras e Agricultura",
    "Meio Ambiente (Poluição Sonora)":"Secretaria de Meio Ambiente","Licenças e Fiscalizações Ambientais e etc.":"Secretaria de Meio Ambiente",
    "Vetores e Zoonoses (Combate à Dengue)":"Secretaria de Saúde",
    "Criação Irregular de Animais e etc.)":"Secretaria de Saúde","Licenças e Fiscalizações Ambientais e etc.)":"Secretaria de Meio Ambiente",
    "Meio Ambiente (Poluição Sonora":"Secretaria de Meio Ambiente","Não se aplica":"Secretaria de Comunicação Social e Relações Públicas",
    "Sinalização e Multas":"Secretaria de Segurança Pública","Transportes":"Secretaria de Transportes e Serviços Públicos",
    "Vetores e Zoonoses (Combate à Dengue":"Secretaria de Saúde",
}
MAP_EXACT_ORGAOS = { _norm_tema(k): v for k, v in MAP_TEMA_PARA_ORGAO.items() }

def mapear_orgao_exato(celula_tema):
    orgs = []
    tema_as_str = str(celula_tema) if pd.notna(celula_tema) else ""
    for t in _div_temas(tema_as_str):
        t_norm = _norm_tema(t)
        if t_norm and t_norm in MAP_EXACT_ORGAOS:
            orgs.append(MAP_EXACT_ORGAOS[t_norm])
    return " | ".join(dict.fromkeys(o.strip() for o in orgs if o and str(o).strip())) or None
    
# ============================================= 
# 5) COLETA DE PROTOCOLOS EXISTENTES NA PLANILHA TRATADA - MANTIDO (com ajuste de logging)
# =============================================
_BANNER("5) COLETA DE PROTOCOLOS EXISTENTES NA PLANILHA TRATADA")

try:
    # ---------- CONSTANTES / IDs ----------
    # Defina PLANILHA_TRATADA_ID no topo do arquivo ou altere aqui diretamente:
    PLANILHA_TRATADA_ID = "1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g"  # <-- coloque aqui o ID CORRETO da planilha tratada fixa

    # ---------- ABRE A PLANILHA TRATADA (única fonte) ----------
    planilha_tratada_gs = gc.open_by_key(PLANILHA_TRATADA_ID)  # Renomeado para evitar conflito com df_tratada
    aba_tratada = planilha_tratada_gs.sheet1
    logging.info(f"Planilha tratada '{PLANILHA_TRATADA_ID}' aberta.")

    # === Normalizar colunas e padronizar protocolo na planilha tratada (snapshot) ===
    _vals = aba_tratada.get_all_values()
    if _vals and len(_vals) > 0:
        _hdr = _vals[0]
        df_tratada = pd.DataFrame(_vals[1:], columns=_hdr)
    else:
        df_tratada = pd.DataFrame(columns=[])
    # usa a função normalizar_nome_coluna definida no Item 3 do script
    df_tratada.columns = [normalizar_nome_coluna(c) for c in df_tratada.columns]

    # Padroniza a coluna 'protocolo' na tratada (strip + upper)
    if "protocolo" in df_tratada.columns:
        df_tratada["protocolo"] = df_tratada["protocolo"].astype(str).str.strip().str.upper()
    else:
        # Garante existência para operações posteriores
        df_tratada["protocolo"] = pd.Series([""] * len(df_tratada))

    logging.info("Normalização aplicada em df_tratada (colunas e protocolo).")

    # Também aplica normalize_protocolo_col caso queira (mantive sua função por compatibilidade)
    df_tratada = normalize_protocolo_col(df_tratada, "protocolo")

    # Constrói o conjunto de protocolos existentes (normalizado)
    protocolos_existentes_set = set([str(x).strip().upper() for x in df_tratada["protocolo"].tolist() if str(x).strip() != ""])

    # ---------- LÊ A ÚLTIMA PLANILHA BRUTA (reutiliza FOLDER_ID_BRUTA e helper) ----------
    # IMPORTANTE: get_latest_spreadsheet_df deve existir (Item 2)
    if 'FOLDER_ID_BRUTA' in globals():
        folder_id = FOLDER_ID_BRUTA
    else:
        folder_id = "1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5"  # fallback se não definido acima

    latest_file_id, latest_file_name, df_bruta = get_latest_spreadsheet_df(folder_id, gc, drive_service)

    # Normaliza colunas e protocolo da bruta
    df_bruta.columns = [normalizar_nome_coluna(c) for c in df_bruta.columns]
    df_bruta = normalize_protocolo_col(df_bruta, "protocolo")

    # === Cria 'protocolo_final' com fallback (protocolo existente ou protocolo_simulado) ===
    # Normaliza protocolo atual na bruta
    df_bruta["protocolo"] = df_bruta.get("protocolo", pd.Series([""] * len(df_bruta))).astype(str).str.strip().str.upper()

    # ---------- GERAÇÃO DE PROTOCOLO SIMULADO (robusto) ----------
       # ---------- GERAÇÃO DE PROTOCOLO SIMULADO (robusto) ----------
    def _criar_protocolo_simulado(row) -> str:
        """
        Gera um protocolo simulado com prefixo 'S' a partir de uma combinação
        de campos candidatos (data_da_criacao, assunto, descricao, conteudo, manifestacao, mensagem).
        Retorna string vazia se não houver dados suficientes.
        """
        candidate_fields = ["data_da_criacao", "assunto", "descricao", "conteudo", "manifestacao", "mensagem"]
        parts = []
        for f in candidate_fields:
            v = ""
            try:
                # pd.Series e dict têm .get; garantimos acesso seguro
                if hasattr(row, "get"):
                    v = row.get(f, "")
                else:
                    # tenta acessar por label/index quando possível (ex.: pd.Series)
                    v = row[f] if f in getattr(row, "index", []) else ""
            except Exception:
                try:
                    v = row[f]
                except Exception:
                    v = ""
            if pd.notna(v) and str(v).strip() != "":
                parts.append(str(v).strip())
        key = "|".join(parts)
        if not key:
            return ""
        # prefixo 'S' para diferenciar dos protocolos 'C...'
        return "S" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:18].upper()

    def _choose_protocolo_final(p: str, row) -> str:
        r"""
        Retorna protocolo 'p' se estiver no padrão C\d+, senão gera protocolo simulado.
        """
        p = str(p or "").strip().upper()
        if re.match(r"^C\d+$", p):
            return p
        simulated = _criar_protocolo_simulado(row)
        return simulated if simulated else p

    # Usa a função robusta para criar protocolo_final
    df_bruta["protocolo_final"] = df_bruta.apply(lambda r: _choose_protocolo_final(r.get("protocolo", ""), r), axis=1)
    df_bruta["protocolo_final"] = df_bruta["protocolo_final"].astype(str).str.strip().str.upper()

    # Marca novos protocolos comparando protocolo_final com o conjunto da tratada
    df_bruta["eh_novo"] = ~df_bruta["protocolo_final"].isin(protocolos_existentes_set)

    # Prepara lista de novos (usando protocolo_final para consistência)
    novos_protos = df_bruta.loc[df_bruta["eh_novo"], "protocolo_final"].tolist()

    print(f"🔑 Protocolos já na planilha tratada: {len(protocolos_existentes_set)}")
    print(f"🆕 Protocolos detectados como novos: {len(novos_protos)}")
    logging.info(f"Protocolos já na planilha tratada: {len(protocolos_existentes_set)}")
    logging.info(f"Protocolos detectados como novos: {novos_protos[:50]}")

    # Log dos existentes que não serão enviados (baseado em protocolo_final)
    nao_enviados = df_bruta.loc[~df_bruta["eh_novo"], "protocolo_final"].tolist()
    print(f"⚠️ Protocolos existentes que não serão enviados (não novos): {len(nao_enviados)}")
    logging.info(f"Protocolos existentes que não serão enviados: {nao_enviados[:50]}")

    # Verificação final
    if df_bruta.empty:
        raise Exception("A planilha bruta mais recente está vazia ou não pôde ser lida.")

    # Substitui df pelo df_bruta "oficial" para manter compatibilidade posterior
    # (mantemos também a coluna 'protocolo_final' para uso nas etapas seguintes)
    df = df_bruta.copy()

except Exception as e:
    print(f"⚠️ Erro ao carregar planilhas: {e}")
    logging.warning(f"Erro ao carregar planilhas: {e}")
    df_tratada = pd.DataFrame()
    protocolos_existentes_set = set()
    df = pd.DataFrame()
    df["eh_novo"] = True
    novos_protos = []
    nao_enviados = []
    
# ========================================================
# 6) LIMPEZA BÁSICA + RECORTE PARA NOVOS POR PROTOCOLO
# ========================================================
print("🧹 Limpando e identificando novos protocolos...")

# --- Garantias de normalização do DataFrame atual (df) ---
# Normaliza nomes de coluna no df (caso não tenha sido feito antes)
if not df.empty:
    df.columns = [normalizar_nome_coluna(c) for c in df.columns]

# Garante que a planilha tratada tem a lista de protocolos normalizada (fallback caso não exista)
if 'df_tratada' in globals() and not df_tratada.empty and "protocolo" in df_tratada.columns:
    df_tratada_protocolos = [str(x).strip().upper() for x in df_tratada["protocolo"].tolist() if str(x).strip() != ""]
else:
    df_tratada_protocolos = []

# --- Prepara a coluna 'protocolo' no df usando 'protocolo_final' quando disponível ---
def _normalize_protocol_row(r):
    # prioridade: protocolo_final (quando presente), senão protocolo, senão ""
    pf = r.get("protocolo_final", "")
    p  = r.get("protocolo", "")
    chosen = pf if pd.notna(pf) and str(pf).strip() != "" else p
    return str(chosen).strip().upper()

# Se df estiver vazio, mantém as variáveis para frente
if df.empty:
    df["protocolo"] = ""
else:
    # Cria/normaliza a coluna protocolo definitiva a ser usada para comparação
    df["protocolo"] = df.apply(_normalize_protocol_row, axis=1)

# --- Marca novos comparando com os protocolos da planilha tratada ---
if df_tratada_protocolos:
    df["eh_novo"] = ~df["protocolo"].isin(df_tratada_protocolos)
else:
    # Se não temos referência de tratados (planilha tratada vazia ou sem coluna protocolo),
    # assume tudo como novo (mas loga um warning)
    logging.warning("df_tratada_protocolos vazio — assumindo todos os registros como novos.")
    df["eh_novo"] = True

novos = df[df["eh_novo"] == True].copy()
existentes = df[df["eh_novo"] == False].copy()

print(f"🆕 Novos protocolos: {len(novos)}")
print(f"🔄 Protocolos existentes: {len(existentes)}")
logging.info(f"Novos protocolos: {len(novos)}, Existentes: {len(existentes)}")

# ========================================================
# 7) TRATAMENTOS E ATUALIZAÇÃO DE DADOS (somente NOVOS)
# ========================================================
_BANNER("7) TRATAMENTOS (somente NOVOS)")

# Seleciona apenas os protocolos novos identificados no Item 5
df_novos = df[df["eh_novo"] == True].copy()

if df_novos.empty:
    logging.info("Nenhum protocolo novo para tratamento.")
else:
    logging.info(f"Aplicando tratamentos em {len(df_novos)} protocolos novos. Shape inicial: {df_novos.shape}")

def _tratar_full(df_in: pd.DataFrame) -> pd.DataFrame:
    df_loc = df_in.copy()
    logging.debug(f"Iniciando _tratar_full com DataFrame de shape: {df_loc.shape}")

    # 7.1 Tema/Assunto — mantém 'não se aplica' → 'Assédio'
    try:
        if "tema" in df_loc.columns and "assunto" in df_loc.columns:
            tema_tmp = df_loc["tema"].astype(str).str.strip().str.casefold()
            assunto_tmp = df_loc["assunto"].astype(str).str.strip().str.casefold()
            valores_assunto = ["outro", "outros", "na", "n/a", "n\\a", ""]
            cond_42 = (tema_tmp == "não se aplica") & (assunto_tmp.isin(valores_assunto))
            if int(cond_42.sum()):
                df_loc.loc[cond_42, "assunto"] = "Assédio"
                logging.info(f"Tratamento 7.1 (Assunto) aplicado a {int(cond_42.sum())} linhas.")
            cond_41 = (tema_tmp == "não se aplica")
            if int(cond_41.sum()):
                df_loc.loc[cond_41, "tema"] = "Assédio"
                logging.info(f"Tratamento 7.1 (Tema) aplicado a {int(cond_41.sum())} linhas.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.1 (Tema/Assunto): {e}", exc_info=True)

    # 7.2 Data da conclusão → texto "DD/MM/AA" ou "Não concluído"
    try:
        if "data_da_conclusao" in df_loc.columns:
            df_loc["data_da_conclusao"] = _conclusao_strict(df_loc["data_da_conclusao"])
            df_loc["data_da_conclusao"] = df_loc["data_da_conclusao"].apply(
                lambda x: x if pd.notna(x) and str(x).strip().lower() not in ["na", "nan", "n/a", ""] else "Não concluído"
            )
            logging.info("Tratamento 7.2 (Data da Conclusão) aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.2 (Data da Conclusão): {e}", exc_info=True)

    # 7.3 Unidades de Cadastro e Saúde - LÓGICA CORRIGIDA
    try:
        # Trata a coluna 'unidade_cadastro'
        if 'unidade_cadastro' in df_loc.columns:
            # Aplica a limpeza de espaços e a capitalização inteligente
            df_loc['unidade_cadastro'] = df_loc['unidade_cadastro'].astype(str).apply(_clean_whitespace).apply(_to_proper_case_pt)

        # Trata colunas que contêm 'unidade_saude' (mantém a lógica original)
        for col in [c for c in df_loc.columns if "unidade_saude" in c]:
            df_loc[col] = (
                df_loc[col].astype(str).str.strip().str.lower()
                .replace("sem informação", "Não é uma Unidade de Saúde")
                .str.capitalize()
            )
        logging.info("Tratamento 7.3 (Unidades de Cadastro e Saúde) aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.3: {e}", exc_info=True)

    # 7.3.1 Tratamentos adicionais para unidade_cadastro
    
    try:
        if "unidade_cadastro" in df_loc.columns:
            # 1) Upas: Upa - Beira Mar -> UAC - UPA Beira Mar (robusto)
            mask_upa_beira = df_loc["unidade_cadastro"].astype(str).str.replace(r"\s+", " ", regex=True).str.strip().str.lower().eq("upa - beira mar")
            if mask_upa_beira.any():
                df_loc.loc[mask_upa_beira, "unidade_cadastro"] = "UAC - UPA Beira Mar"
                logging.info(f"Tratamento 7.3.1: Substituído 'Upa - Beira Mar' em {mask_upa_beira.sum()} linhas.")

            # 2) Mapeamento de temas -> Ouvidoria responsável (para quando unidade_cadastro é 'Ouvidoria Setorial' genérico)
            MAP_TEMA_PARA_OUVIDORIA = {
                "administração pública": "Ouvidoria Geral",
                "agricultura": "Ouvidoria Setorial de Obras",
                "assistência social e direitos humanos": "Ouvidoria Setorial da Assistência Social",
                "assuntos jurídicos": "Ouvidoria Geral",
                "comunicação social": "Ouvidoria Geral",
                "controle governamental": "Ouvidoria Geral",
                "criança, adolescente e idoso": "Ouvidoria Setorial da Assistência Social",
                "cultura e turismo": "Ouvidoria Geral",
                "defesa civil": "Ouvidoria Geral",
                "direitos à pessoa com deficiência": "Ouvidoria Setorial da Assistência Social",
                "direitos e vantagens do servidor": "Ouvidoria Geral",
                "educação": "Ouvidoria Setorial de Educação",
                "empresas e legalizações": "Ouvidoria Setorial da Fazenda",
                "esporte e lazer": "Ouvidoria Geral",
                "fiscalização e tributos": "Ouvidoria Setorial da Fazenda",
                "fiscalização urbana, regularização e registro de imóveis": "Ouvidoria Setorial de Urbanismo",
                "fundec": "Ouvidoria Setorial da FUNDEC",
                "governança": "Ouvidoria Geral",
                "governo municipal e enterro gratuito": "Ouvidoria Geral",
                "habitação": "Ouvidoria Setorial de Urbanismo",
                "inclusão e acessibilidade": "Ouvidoria Geral",
                "meio ambiente": "Ouvidoria Setorial de Meio Ambiente",
                "meio ambiente (poluição sonora, árvores, licenças e fiscalizações ambientais e etc.)": "Ouvidoria Setorial de Meio Ambiente",
                "assédio": "Ouvidoria Geral",
                "obras públicas": "Ouvidoria Setorial de Obras",
                "obras, limpeza urbana e braço de luz": "Ouvidoria Setorial de Obras",
                "proteção animal": "Ouvidoria Geral",
                "saúde": "Ouvidoria Setorial da Saúde",
                "segurança pública": "Ouvidoria Geral de Segurança Pública",
                "segurança, sinalização e multas": "Ouvidoria Geral de Segurança Pública",
                "trabalho, emprego e renda": "Ouvidoria Geral",
                "transportes e serviços públicos": "Ouvidoria Geral",
                "transportes, serviços públicos e troca de lâmpadas": "Ouvidoria Geral",
                "urbanismo": "Ouvidoria Setorial de Urbanismo",
                "vetores e zoonoses (combate à dengue, controle de pragas, criação irregular de animais e etc.)": "Secretaria de Saúde",
                "vigilância sanitária": "Ouvidoria Setorial da Saúde",
                "obras": "Ouvidoria Setorial de Obras",
                "trabalho": "Ouvidoria Geral",
                "segurança": "Ouvidoria Setorial de Segurança Pública",
                "serviços públicos e troca de lâmpadas": "Ouvidoria Geral",
                "árvores": "Ouvidoria Setorial de Meio Ambiente",
                "controle de pragas": "Ouvidoria Setorial da Saúde",
                "criação irregular de animais": "Ouvidoria Setorial da Saúde",
                "adolescente e idoso": "Ouvidoria Setorial da Assistência Social",
                "criança": "Ouvidoria Setorial da Assistência Social",
                "emprego e renda": "Ouvidoria Geral",
                "fiscalização urbana": "Ouvidoria Setorial de Urbanismo",
                "regularização e registro de imóveis": "Ouvidoria Setorial de Urbanismo",
                "limpeza urbana e braço de luz": "Ouvidoria Setorial de Obras",
                "meio ambiente (poluição sonora)": "Ouvidoria Setorial de Meio Ambiente",
                "licenças e fiscalizações ambientais e etc.": "Ouvidoria Setorial de Meio Ambiente",
                "vetores e zoonoses (combate à dengue)": "Ouvidoria Setorial da Saúde",
                "sinalização e multas": "Ouvidoria Setorial de Segurança Pública",
                "transportes": "Ouvidoria Geral",
                # mantenha o dicionário estendido conforme necessário...
            }
            # normalizado (sem acento, lower, sem espaços extras)
            MAP_TEMA_OUVID_NORM = { _norm_tema(k): v for k, v in MAP_TEMA_PARA_OUVIDORIA.items() }

            def map_tema_para_ouvidoria(tema_val):
                if pd.isna(tema_val) or str(tema_val).strip() == "":
                    return "Ouvidoria Geral"
                # pega a primeira correspondência possível considerando divisores
                partes = _div_temas(tema_val)
                for p in partes:
                    pn = _norm_tema(p)
                    if pn in MAP_TEMA_OUVID_NORM:
                        return MAP_TEMA_OUVID_NORM[pn]
                # fallback
                return "Ouvidoria Geral"

            # 2a) Detecta linhas onde unidade_cadastro é "Ouvidoria Setorial" genérico
            mask_ouvidoria_setorial = df_loc["unidade_cadastro"].astype(str).str.match(r"(?i)^\s*ouvidoria\s+setorial\s*$", na=False)
            n_mask = mask_ouvidoria_setorial.sum()
            if n_mask:
                # atribui a ouvidoria com base no tema
                df_loc.loc[mask_ouvidoria_setorial, "unidade_cadastro"] = df_loc.loc[mask_ouvidoria_setorial, "tema"].apply(map_tema_para_ouvidoria)
                logging.info(f"Tratamento 7.3.1: 'Ouvidoria Setorial' mapeada por tema em {n_mask} linhas.")

            # 2b) Também trata variações contendo 'ouvidoria setorial' em texto (ex.: 'Ouvidoria Setorial de Saúde')
            mask_ouvidoria_setorial_like = df_loc["unidade_cadastro"].astype(str).str.contains(r"(?i)\bouvidoria\s+setorial\b", na=False)
            # para quem tem 'ouvidoria setorial' + mais detalhes, normalizamos para o termo mapeado por tema
            mask_override = mask_ouvidoria_setorial_like & ~mask_ouvidoria_setorial
            if mask_override.any():
                df_loc.loc[mask_override, "unidade_cadastro"] = df_loc.loc[mask_override, "tema"].apply(map_tema_para_ouvidoria)
                logging.info(f"Tratamento 7.3.1: Variantes contendo 'ouvidoria setorial' normalizadas por tema em {mask_override.sum()} linhas.")

            # 3) Padronizar 'ouvidoria geral' (qualquer variante) -> 'Ouvidoria Geral'
            mask_ouvidoria_geral = df_loc["unidade_cadastro"].astype(str).str.match(r"(?i)^\s*ouvidoria\s+geral\s*$", na=False)
            if mask_ouvidoria_geral.any():
                df_loc.loc[mask_ouvidoria_geral, "unidade_cadastro"] = "Ouvidoria Geral"
                logging.info(f"Tratamento 7.3.1: Padronizado 'Ouvidoria Geral' em {mask_ouvidoria_geral.sum()} linhas.")

            # 4) Limpeza final: aplica _clean_whitespace e formatação leve
            df_loc["unidade_cadastro"] = df_loc["unidade_cadastro"].astype(str).apply(_clean_whitespace)
            # Mantemos nomes de Ouvidoria em Title Case/Proper Case quando possível
            df_loc["unidade_cadastro"] = df_loc["unidade_cadastro"].apply(lambda x: _to_proper_case_pt(x) if "ouvidoria" not in str(x).lower() and "uac - upa" not in str(x).lower() else x)

    except Exception as e:
        logging.error(f"Erro no tratamento 7.3.1 (unidade_cadastro extra): {e}", exc_info=True)
        
    # 7.4 Órgãos por tema — LÓGICA SIMPLIFICADA E CORRIGIDA
    try:
        # Passo A: Cria a coluna 'orgaos' chamando a função global
        if "tema" in df_loc.columns:
            df_loc["tema"] = df_loc["tema"].astype(str)
            df_loc["orgaos"] = df_loc["tema"].apply(mapear_orgao_exato)
        else:
            df_loc["orgaos"] = None
        
        # Passo B: Aplica o fallback para valores nulos/vazios
        fallback_value = "Secretaria Municipal de Comunicação e Relações Públicas"
        df_loc["orgaos"].fillna(fallback_value, inplace=True)
        # Garante que strings que são apenas espaços em branco também recebam o fallback
        df_loc.loc[df_loc["orgaos"].str.strip() == '', "orgaos"] = fallback_value
        
        # Passo C: Executa a sequência de limpeza e capitalização
        df_loc["orgaos"] = df_loc["orgaos"].apply(_clean_whitespace).astype(str)
        df_loc["orgaos"] = df_loc["orgaos"].apply(_to_proper_case_pt)
        logging.info("Tratamento 7.4 (Limpeza e Capitalização com Acentos) aplicado a 'orgaos'.")

    except Exception as e:
        logging.error(f"Erro no tratamento 7.4 (Órgãos por tema): {e}", exc_info=True)

    # 7.5 Padronização 'servidor' (dicionário completo)
    try:
        if "servidor" in df_loc.columns:
            dicionario_servidor = {
                "Camila do Lago Marins": "Camila Marins", "Camila Marins": "Camila Marins",
                "Dhayane Cristina Pinho de Almeida": "Dhayane Cristina Pinho de Almeida", "Dhayane Pinho": "Dhayane Cristina Pinho de Almeida",
                "Joana Darc Salles Ferreira": "Joana Darc Salles Ferreira", "Joana Salles": "Joana Darc Salles Ferreira",
                "Lucia Helena Tinoco Pacehco Varella": "Lúcia Helena Tinoco Pacheco Varella", "Lucia Helena Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
                "Lucia  Helena Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella", "Lúcia  Helena Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
                "Lúcia Helena Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella", "Lucia Helenba Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
                "Rafaella Marques Gomes Santos": "Rafaella Marques Gomes Santos",
                "Roilene Pereira da Silva": "Rosilene Pereira da Silva", "Rosilene Pereira da Silva": "Rosilene Pereira da Silva",
                "Stephanie dos Santos Silva": "Stephanie dos Santos Silva", "Stephanie Santos": "Stephanie dos Santos Silva",
                "Stéphanie Santos": "Stephanie dos Santos Silva", "Stéphaniesantos": "Stephanie dos Santos Silva",
                "Stpehanie Santos": "Stephanie dos Santos Silva",
                "Anne Beatriz da Silva": "Anne Beatriz da Silva Rodrigues", "Bruna Maria ( Coordenadora)": "Cidadão",
                "Isabel": "Cidadão", "Gabriela da Silva Rozi": "Cidadão", "Lana Carolina Mesquita de Andrade": "Cidadão",
                "Lívia Cavalcante": "Lívia Kathleen Cavalcante Patriota Leite", "Lívia Kathleen Cavalcante Patriota Leite": "Lívia Kathleen Cavalcante Patriota Leite",
                "Lucia Helena": "Lúcia Helena Tinoco Pacheco Varella", "Lucia Helena Tinoco": "Lúcia Helena Tinoco Pacheco Varella",
                "Lucia Helena Tinoco Varella": "Lúcia Helena Tinoco Pacheco Varella", "Lucia Helen Tinoco Varella": "Lúcia Helena Tinoco Pacheco Varella",
                "Lucia Helan Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella", "Lucia Helena  Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
                "Lucia Helena Tinoco Pachewco Varella": "Lúcia Helena Tinoco Pacheco Varella",
                "Mery": "Cidadão", "Ouvidoria Geral (Adm)": "Cidadão", "Rafaella Marques": "Rafaella Marques Gomes Santos",
                "Ronaldo de Oliveira Brandão": "Cidadão", "Séphanie Santos": "Stephanie dos Santos Silva",
                "Shirley Santana": "Cidadão", "Stépanie Santos": "Stephanie dos Santos Silva",
                "Stéphanie  Santos": "Stephanie dos Santos Silva", "Stéphanie Santos": "Stephanie dos Santos Silva",
                "Stephanie dos Santos": "Stephanie dos Santos Silva", "Stéphanie Santoa": "Stephanie dos Santos Silva",
                "Stephanie Santos": "Stephanie dos Santos Silva", "Stephanie dos Santos": "Stephanie dos Santos Silva",
                "Stephanie Santos": "Stephanie dos Santos Silva", "Stéphanie dos Santos Silva": "Stephanie dos Santos Silva", "Thamires Manhães": "Cidadão",
                "Alexsandra de Castro Freire": "Cidadão"
            }
            _orig = df_loc["servidor"].astype(str).str.strip()
            df_loc["servidor"] = _orig.map(dicionario_servidor).fillna(_orig)
            logging.info("Tratamento 7.5 (Padronização 'servidor') aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.5 (Padronização 'servidor'): {e}", exc_info=True)

    # 7.6 Responsavel - LÓGICA CORRIGIDA E UNIFICADA
    try:
        if "responsavel" in df_loc.columns:
            df_loc["responsavel"] = df_loc["responsavel"].astype(str).apply(_clean_whitespace)
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(r"^\s*ouvidoria\s+geral\s*$", "Ouvidoria Geral", regex=True, case=False)
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(r"^\s*ouvidoria\s+setorial\s+de\s+obras\s*$", "Ouvidoria Setorial de Obras", regex=True, case=False)
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(r"^\s*ouvidoria\s+setorial\s+da\s+sa(u|ú)de\s*$", "Ouvidoria Setorial da Saúde", regex=True, case=False)
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(r"^\s*cidadao\s*$", "Cidadão", regex=True, case=False)
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(r"^\s*(Sim|True)\s*$", "Cidadão", regex=True, case=False)
            df_loc.loc[df_loc["responsavel"].str.strip() == '', "responsavel"] = "Não Informado"
            logging.info("Tratamento 7.6 (Unificado para 'responsavel') aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.6 (Responsavel): {e}", exc_info=True)

    # ------------------------------------------------------------
    # 7.6.1 Mapeamento de 'responsavel' -> Ouvidoria (aplica somente em df_novos)
    # ------------------------------------------------------------
    try:
        if "responsavel" in df_loc.columns:
            map_responsavel_para_ouvidoria = {
                "1ª Residência de Obras": "Ouvidoria Setorial de Obras",
                "2ª Residência de Obras A": "Ouvidoria Setorial de Obras",
                "2ª Residência de Obras B": "Ouvidoria Setorial de Obras",
                "3ª Residência de Obras": "Ouvidoria Setorial de Obras",
                "Aitana de Jesus Santos": "Ouvidoria Setorial de Obras",
                "Amanda Fernandes de Oliveira": "Ouvidoria Setorial de Obras",
                "Ana Paula Cassiano de Oliveira": "Ouvidoria Setorial de Obras",
                "Brenda Rhaianny Machado Lima": "Ouvidoria Setorial de Urbanismo",
                "Departamento de Fiscalização (Meio Ambiente)": "Ouvidoria Setorial de Meio Ambiente",
                "GPE": "Ouvidoria Setorial de Obras",
                "Guilherme Gomes": "Ouvidoria Setorial de Obras",
                "Jessica Cristina Soares Trajano da Rocha": "Ouvidoria Setorial de Obras",
                "Ouvidoria Geral (ADM)": "Ouvidoria Geral",
                "Priscila Tavares Salcedo": "Ouvidoria Setorial de Obras",
                "Secretaria Municipal de Obras": "Ouvidoria Setorial de Obras",
                "Secretaria Municipal de Segurança Pública": "Ouvidoria Setorial de Segurança Pública",
                "Secretaria Municipal de Transportes e Serviços Públicos": "Ouvidoria Geral",
                "Superintendência de Limpeza Urbana": "Ouvidoria Setorial de Obras",
                "Thayná Cristina Dias de Souza": "Ouvidoria Setorial de Obras",
            }

            # Normaliza chaves para lookup tolerante (remove acentos, lower, trim)
            _map_resp_norm = { _canon_txt(k): v for k, v in map_responsavel_para_ouvidoria.items() }

            def _map_responsavel_to_ouvidoria(valor):
                if pd.isna(valor) or str(valor).strip() == "":
                    return valor
                key = _canon_txt(str(valor))
                return _map_resp_norm.get(key, valor)  # mantém original caso não exista no dicionário

            # Aplicação e logging de QA
            before_vals = df_loc["responsavel"].astype(str).copy()
            df_loc["responsavel"] = df_loc["responsavel"].astype(str).apply(_map_responsavel_to_ouvidoria)
            changed_mask = before_vals != df_loc["responsavel"].astype(str)
            changed_count = int(changed_mask.sum())
            logging.info(f"Tratamento 7.6.1: Mapeamento de 'responsavel' aplicado. {changed_count} linhas alteradas.")
    except Exception as e:
        logging.error(f"Erro no mapeamento 7.6.1 da coluna 'responsavel': {e}", exc_info=True)

    # 7.7 Datas e tipos
    try:
        if "data_da_criacao" in df_loc.columns:
            df_loc["data_da_criacao"] = _parse_dt_cmp(df_loc["data_da_criacao"]) # <-- Retorna objeto de data
            logging.info("Tratamento 7.7 (data_da_criacao para objeto datetime) aplicado.")
        if "status_demanda" in df_loc.columns:
            df_loc["status_demanda"] = df_loc["status_demanda"].astype(str)
            logging.info("Tratamento 7.7 (status_demanda) tipo aplicado.")
        if "data_da_conclusao" in df_loc.columns:
            df_loc["data_da_conclusao"] = _conclusao_strict(df_loc["data_da_conclusao"])
            logging.info("Tratamento 7.7 (data_da_conclusao) strict aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.7 (Datas e Tipos): {e}", exc_info=True)

    # 7.8 Regra de ouro: se CONCLUÍDA => 'prazo_restante' = 'Demanda Concluída'
    try:
        if "status_demanda" in df_loc.columns and "prazo_restante" in df_loc.columns:
            mask_conc = df_loc["status_demanda"].map(_is_concluida)
            if mask_conc.any():
                df_loc.loc[mask_conc, "prazo_restante"] = "Demanda Concluída"
                logging.info(f"Tratamento 7.8 (prazo_restante p/ concluída) aplicado para {mask_conc.sum()} linhas.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.8 (Prazo Restante): {e}", exc_info=True)

    # 7.9 Padronização da coluna 'canal'
    try:
        if "canal" in df_loc.columns:
            df_loc["canal"] = df_loc["canal"].astype(str)
            df_loc["canal"] = df_loc["canal"].str.replace(r"^\s*(Colab Gov|Portal Cidadão|Fala.BR)\s*$", "Aplicativo Colab", regex=True, case=False)
            logging.info("Tratamento 7.9 (Padronização de 'canal') aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento de 'canal': {e}", exc_info=True)

    # =======================================================================
    # 7.10 Limpeza de "Não há dados" para tempo_de_resolucao_em_dias (REFATORADO)
    # =======================================================================
    try:
        if "tempo_de_resolucao_em_dias" in df_loc.columns:
            raw = df_loc["tempo_de_resolucao_em_dias"]
            invalid_tokens = {"nan", "none", "na", "n/a", "não há dados", "nao ha dados", ""}
            mask_invalid = raw.astype(str).str.strip().str.lower().isin(invalid_tokens)
            df_loc["tempo_de_resolucao_em_dias"] = raw.where(~mask_invalid, pd.NA).astype(object)
            logging.info("Tratamento 7.10 (preservação de 'tempo_de_resolucao_em_dias' tal como na bruta) aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.10 (tempo_de_resolucao_em_dias): {e}", exc_info=True)


    # finalização / retorno da função (GARANTE retorno mesmo sem exceção)
    logging.debug(f"Finalizando _tratar_full. Shape final: {df_loc.shape}")
    return df_loc

# Aplica o tratamento aos novos protocolos
try:
    if not df_novos.empty:
        df_novos = _tratar_full(df_novos)
        logging.info(f"Tratamento full aplicado a {len(df_novos)} protocolos novos.")
    else:
        logging.info("df_novos está vazio, pulando _tratar_full.")
except Exception as e:
    logging.critical(f"Erro CRÍTICO ao aplicar _tratar_full em df_novos: {e}", exc_info=True)
    # Dependendo da severidade, você pode querer levantar a exceção ou parar o pipeline.
    raise

# QA pós _tratar_full global para df_novos
if not df_novos.empty:
    for col in ['orgaos', 'responsavel', 'status_demanda', 'data_da_conclusao']:
        if col in df_novos.columns:
            empty_count = df_novos[col].astype(str).str.strip().isin(['', 'nan', 'none', 'n/a', 'não informado']).sum()
            if empty_count > 0:
                logging.warning(
                    f"QA Pós-Tratamento (df_novos): Coluna '{col}' contém {empty_count} valores vazios/inválidos/não informados. "
                    f"Exemplos: {df_novos.loc[df_novos[col].astype(str).str.strip().isin(['', 'nan', 'none', 'n/a', 'não informado']), col].unique()[:5].tolist()}"
                )

            # Verificação de tipos para garantir que são strings
            if not pd.api.types.is_string_dtype(df_novos[col]):
                logging.error(
                    f"QA Pós-Tratamento (df_novos): Coluna '{col}' não é do tipo string após tratamento. Tipo atual: {df_novos[col].dtype}. Convertendo para string."
                )
                df_novos[col] = df_novos[col].astype(str)

# ========================================================
# 8) ATUALIZAÇÃO NA PLANILHA TRATADA — APENAS NOVOS (VERSÃO CORRIGIDA E INTEGRADA)
# ========================================================
_BANNER("8) ATUALIZAÇÃO NA PLANILHA TRATADA — APENAS NOVOS")

# ----------------------------------------------------------
# GARANTE QUE df_bruta EXISTE E TEM A COLUNA 'protocolo'
# ----------------------------------------------------------
try:
    if 'df_bruta' not in globals() or df_bruta.empty:
        raise SystemExit("❌ df_bruta não está definido ou está vazio. Carregue a base bruta antes do Item 8.")
    logging.info(f"df_bruta presente e com shape: {df_bruta.shape}")

    df_bruta.columns = [normalizar_nome_coluna(c) for c in df_bruta.columns]  # Garante que está normalizado
    df_bruta = normalize_protocolo_col(df_bruta, "protocolo")  # Garante que protocolo está padronizado
    logging.debug("Colunas e protocolos de df_bruta normalizados.")
except Exception as e:
    logging.critical(f"Erro na checagem inicial de df_bruta no Item 8: {e}", exc_info=True)
    raise

# ----------------------------------------------------------
# CARREGA PLANILHA TRATADA E OBTÉM PROTOCOLOS EXISTENTES
# ----------------------------------------------------------
try:
    if 'client' not in globals() or client is None:
        raise SystemExit("❌ Cliente gspread não autenticado. Verifique Item 1.")

    PLANILHA_TRATADA_ID = "1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g"
    planilha_tratada_gs = client.open_by_key(PLANILHA_TRATADA_ID)
    aba_tratada = planilha_tratada_gs.sheet1
    logging.info(f"Planilha tratada '{PLANILHA_TRATADA_ID}' aberta.")

    # Cache inicial seguro: tentativa de ler todas as linhas (pode falhar em sheets muito grandes)
    try:
        _aba_cache_all = aba_tratada.get_all_values()  # lista de listas (pode ser None/[] em caso de sheet vazia)
    except Exception:
        _aba_cache_all = None

except Exception as e:
    logging.critical(f"Erro ao abrir a planilha tratada ou autenticar no Item 8: {e}", exc_info=True)
    raise

try:
    df_tratada_existente = pd.DataFrame(aba_tratada.get_all_records())
    df_tratada_existente.columns = [normalizar_nome_coluna(c) for c in df_tratada_existente.columns]
    logging.info(f"df_tratada_existente carregado com shape: {df_tratada_existente.shape}")

    protocolos_existentes_set_final = set()
    if "protocolo" in df_tratada_existente.columns:
        df_tratada_existente["protocolo"] = df_tratada_existente["protocolo"].astype(str).str.strip().str.upper()
        protocolos_existentes_set_final = set(df_tratada_existente["protocolo"])
        logging.debug(f"Set de protocolos existentes criado com {len(protocolos_existentes_set_final)} itens.")
    else:
        logging.warning("Coluna 'protocolo' não encontrada em df_tratada_existente. Não será possível identificar protocolos existentes.")

    cols_alvo_tratada = list(df_tratada_existente.columns)
    if not cols_alvo_tratada:  # Se a planilha tratada estiver completamente vazia (sem cabeçalho)
        if 'df_novos' in globals() and not df_novos.empty:
            cols_alvo_tratada = list(df_novos.columns)
            logging.info("Planilha tratada vazia, usando colunas de df_novos como referência para o schema.")
        elif not df_bruta.empty:
            cols_alvo_tratada = [normalizar_nome_coluna(c) for c in df_bruta.columns]
            logging.info("Planilha tratada vazia e df_novos vazio, usando colunas de df_bruta como referência.")
        else:
            logging.error("Não foi possível determinar o schema da planilha tratada.")
            raise ValueError("Não foi possível determinar o schema da planilha tratada.")
    logging.debug(f"Colunas alvo da planilha tratada: {cols_alvo_tratada}")

except Exception as e:
    logging.critical(f"Erro ao processar df_tratada_existente ou definir schema alvo no Item 8: {e}", exc_info=True)
    raise

# ----------------------------------------------------------
# IDENTIFICA E PREPARA NOVOS PROTOCOLOS PARA ENVIO
# ----------------------------------------------------------
try:
    # A variável df_novos, contendo apenas os novos protocolos já tratados, vem da Seção 7.
    if 'df_novos' not in globals() or df_novos.empty:
        logging.info("Nenhum protocolo novo detectado para envio.")
        print("🧹 Nenhum protocolo novo para enviar.")
        df_send = pd.DataFrame()  # Cria um df_send vazio para que o script continue sem erros
    else:
        logging.info(f"Detectados {len(df_novos)} protocolos novos para processar e enviar. Shape: {df_novos.shape}")
        print(f"🧹 Novos protocolos a enviar: {len(df_novos)}")

        # === A) Normalizar df_novos antes do reindex (garante nomes e protocolo) ===
        # Normaliza nomes de coluna no df_novos para o mesmo padrão (snake_case)
        df_novos.columns = [normalizar_nome_coluna(c) for c in df_novos.columns]

        # Se existe protocolo_final (criado anteriormente), prioriza-o; senão usa 'protocolo'
        if "protocolo_final" in df_novos.columns:
            df_novos["protocolo"] = df_novos["protocolo_final"].astype(str).str.strip().str.upper()
        elif "protocolo" in df_novos.columns:
            df_novos["protocolo"] = df_novos["protocolo"].astype(str).str.strip().str.upper()
        else:
            df_novos["protocolo"] = pd.Series([""] * len(df_novos))

        # Assegura que todas as colunas alvo existam em df_novos (para reindex)
        for c in cols_alvo_tratada:
            if c not in df_novos.columns:
                df_novos[c] = ""

        # Alinha as colunas do df_novos com as da planilha tratada, preenchendo com "" as que faltarem.
        df_send = df_novos.reindex(columns=cols_alvo_tratada, fill_value="")
        logging.info(f"df_send alinhado com as colunas da planilha alvo. Shape final: {df_send.shape}")

except Exception as e:
    logging.critical(f"Erro na preparação final de df_send no Item 8: {e}", exc_info=True)
    raise

# --------------------------------------------------------------------------
# PREPARAÇÃO FINAL DAS DATAS ANTES DO ENVIO (LÓGICA SEGURA INTEGRADA)
# --------------------------------------------------------------------------
if not df_send.empty:
    _SUB("Serializando datas e limpando nulos para o envio...")

    colunas_de_data = ["data_da_criacao", "data_da_conclusao"]
    for coluna in colunas_de_data:
        if coluna in df_send.columns:
            # Converte para datetime (erros viram NaT) e depois para string DD/MM/AAAA
            df_send[coluna] = pd.to_datetime(df_send[coluna], errors='coerce').dt.strftime('%d/%m/%Y')
            logging.info(f"Coluna '{coluna}' convertida para texto DD/MM/AAAA.")

    # --- B) QA PRE-APPEND: checagem de somas e contagens antes de enviar ===
    def soma_tempo_serie_safe(df_local, col="tempo_de_resolucao_em_dias"):
        if col not in df_local.columns:
            return 0.0
        return float(pd.to_numeric(df_local[col], errors="coerce").sum(min_count=1) or 0.0)

    soma_bruta_total = soma_tempo_serie_safe(df_bruta)
    soma_tratada_atual = soma_tempo_serie_safe(df_tratada_existente)
    soma_a_enviar = soma_tempo_serie_safe(df_send)

    count_c_bruta = df_bruta["protocolo"].astype(str).str.match(r"^C\d+$").sum() if "protocolo" in df_bruta.columns else 0
    count_c_tratada = df_tratada_existente["protocolo"].astype(str).str.match(r"^C\d+$").sum() if "protocolo" in df_tratada_existente.columns else 0
    count_c_send = df_send["protocolo"].astype(str).str.match(r"^C\d+$").sum() if "protocolo" in df_send.columns else 0

    logging.info(f"QA PRE-APPEND: soma_bruta={soma_bruta_total}, soma_tratada_antes={soma_tratada_atual}, soma_a_enviar={soma_a_enviar}")
    logging.info(f"QA PRE-APPEND: count_C_bruta={count_c_bruta}, count_C_tratada={count_c_tratada}, count_C_send={count_c_send}")

    # Se houver discrepância grande entre bruta e tratada+envio, emitir WARNING
    if abs((soma_tratada_atual + soma_a_enviar) - soma_bruta_total) > 1:
        logging.warning("QA PRE-APPEND: Diferença significativa detectada entre bruta e tratada+envio. Verifique mapeamento de colunas (ex.: tempo_de_resolucao_em_dias).")

    # Substitui todos os tipos de nulos restantes (NaT, None, NaN) por uma string vazia
    # Observação: mantemos a versão original df_send para QA; abaixo criaremos a versão para append.
    # Não sobrescrevemos a coluna numérica 'tempo_de_resolucao_em_dias' até depois da dedupe final.
    logging.info("Preparação de dados finalizada (datas serializadas).")

# --------------------------------------------------------------------------

# ----------------------------------------------------------
# CHECAGEM DE SANIDADE — UNIDADE_CADASTRO (em df_send já tratado)
# ----------------------------------------------------------
if not df_send.empty and "unidade_cadastro" in df_send.columns:
    nulos_uc = int(df_send["unidade_cadastro"].astype(str).str.strip().isin(['', 'nan', 'none', 'n/a', 'não informado', 'None']).sum())
    print(f"🧪 Checagem (NOVOS - PRONTOS PARA ENVIO): unidade_cadastro presente | vazios={nulos_uc}")
    logging.info(f"Checagem (NOVOS - PRONTOS PARA ENVIO): unidade_cadastro presente | vazios={nulos_uc}")
    if nulos_uc > 0:
        logging.warning(f"QA Pré-Envio: 'unidade_cadastro' contém {nulos_uc} valores vazios/inválidos em df_send.")
else:
    if df_send.empty:
        logging.info("Checagem 'unidade_cadastro' pulada pois não há novos protocolos para enviar.")
    else:
        print("⚠️ Aviso: unidade_cadastro não está no DataFrame final a ser enviado.")
        logging.warning("unidade_cadastro não está em df_send. Verifique a consistência do schema.")

# ----------------------------------------------------------
# ENVIO EM LOTES
# ----------------------------------------------------------
if df_send.empty:
    logging.info("Nenhum protocolo para enviar, pulando envio em lotes.")
    print("📦 Nenhum protocolo para enviar.")
else:
    # === C) Dedup final: recarregar protocolos atuais diretamente da aba_tratada e remover linhas duplicadas de df_send ===
    try:
        # --- cache: tenta usar header cache se disponível para localizar índice do 'protocolo' ---
        header_row = None
        if _aba_cache_all and len(_aba_cache_all) > 0:
            header_row = _aba_cache_all[0]
        else:
            try:
                header_row = aba_tratada.row_values(1)
            except Exception:
                header_row = None

        protocolo_col_idx = None
        if header_row:
            for idx, h in enumerate(header_row):
                if isinstance(h, str) and re.sub(r"[^a-z0-9]+", "_", h.lower()).strip("_") == "protocolo":
                    protocolo_col_idx = idx + 1
                    break

        # se não encontrou, assume primeira coluna (1) como fallback
        if protocolo_col_idx is None:
            protocolo_col_idx = 1
            logging.warning("Não foi possível localizar coluna 'protocolo' por nome no cabeçalho. Usando coluna 1 como fallback.")

        # agora pega os valores dessa coluna inteira (apenas essa coluna) -- mais barato que get_all_values()
        try:
            sheet_protocols_raw = aba_tratada.col_values(protocolo_col_idx)
        except Exception:
            # fallback: tenta usar cache completo se disponível
            if _aba_cache_all and len(_aba_cache_all) > 0:
                sheet_protocols_raw = [row[protocolo_col_idx - 1] if len(row) >= protocolo_col_idx else "" for row in _aba_cache_all]
            else:
                sheet_protocols_raw = []

        # remove o cabeçalho (primeira linha) se ele estiver presente
        if sheet_protocols_raw and len(sheet_protocols_raw) > 0:
            sheet_protocols = [str(x).strip().upper() for x in sheet_protocols_raw[1:] if str(x).strip() != ""]
        else:
            sheet_protocols = []

        sheet_protocols_set = set(sheet_protocols)

        if "protocolo" in df_send.columns:
            df_send["__protocolo_upper"] = df_send["protocolo"].astype(str).str.strip().str.upper()
            before_dedupe = len(df_send)
            df_send = df_send.loc[~df_send["__protocolo_upper"].isin(sheet_protocols_set)].copy()
            after_dedupe = len(df_send)
            logging.info(f"Dedup final: removidos {before_dedupe - after_dedupe} linhas já presentes na sheet tratada.")
            df_send.drop(columns=["__protocolo_upper"], inplace=True, errors="ignore")
        else:
            logging.warning("Dedup final: coluna 'protocolo' não encontrada em df_send; não foi possível dedupe por protocolo.")
    except Exception as e:
        logging.exception(f"Erro ao executar dedupe final contra aba_tratada: {e}")

    # Garante que todos os valores nulos (exceto os de data que já são None) virem strings vazias
    # Criamos uma cópia para append para NÃO poluir df_send (assim mantemos as versões numéricas para QA)
    df_send_for_append = df_send.copy()
    # Convertendo colunas de data já formatadas e substituindo NaNs por ''
    df_send_for_append = df_send_for_append.fillna('')

    lote = 500
    total_lotes = (len(df_send_for_append) + lote - 1) // lote
    print(f"📦 Envio — APENAS NOVOS (FINAL): {len(df_send_for_append)} linhas | {total_lotes} lotes")
    logging.info(f"Envio — APENAS NOVOS (FINAL): {len(df_send_for_append)} linhas | {total_lotes} lotes")

    # Se temos cache e ele indicou sheet vazia, podemos usar isso; senão, consulta mínima
    try:
        if _aba_cache_all is not None:
            sheet_is_empty = (len(_aba_cache_all) == 0) or (len(_aba_cache_all) == 1 and (not any(_aba_cache_all[0])))
        else:
            # apenas se realmente necessário, lê o mínimo
            sheet_vals = aba_tratada.get_all_values()
            sheet_is_empty = (len(sheet_vals) == 0) or (len(sheet_vals) == 1 and (not any(sheet_vals[0])))
    except Exception:
        # fallback conservador
        sheet_is_empty = False

    for i in range(0, len(df_send_for_append), lote):
        chunk = df_send_for_append.iloc[i:i+lote].copy()
        rows = chunk.values.tolist()
        first_idx = i + 1
        last_idx = min(i + lote, len(df_send_for_append))
        protos_preview = list(chunk.get("protocolo", []))[:3]
        logging.debug(f"Processando lote {first_idx}-{last_idx}. Prévia protocolos: {protos_preview}")
        print(f"   • Enviando {first_idx}-{last_idx} (prévia protocolos: {protos_preview})")

        try:
            # value_input_option='USER_ENTERED' é crucial para o Google Sheets interpretar as datas corretamente
            if sheet_is_empty:
                header = chunk.columns.tolist()
                aba_tratada.append_rows([header] + rows, value_input_option='USER_ENTERED')
                logging.info(f"Lote {first_idx}-{last_idx} enviado com cabeçalho.")
                sheet_is_empty = False  # Garante que o cabeçalho não seja adicionado novamente
            else:
                aba_tratada.append_rows(rows, value_input_option='USER_ENTERED')
                logging.info(f"Lote {first_idx}-{last_idx} enviado (sem cabeçalho).")
        except Exception as e:
            logging.exception(f"Erro CRÍTICO ao enviar lote {first_idx}-{last_idx}: {e}")
            print(f"❌ Erro ao enviar lote {first_idx}-{last_idx}: {e}")
            try:
                failed = chunk[["protocolo"]].copy()
            except Exception:
                failed = pd.DataFrame(chunk)  # fallback
            timestamp = pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")
            failed.to_csv(f"failed_append_{first_idx}_{last_idx}_{timestamp}.csv", index=False, encoding="utf-8-sig")

    # === D) Logs extras / verificação pós-append ===
    logging.info(f"Envio finalizado. Total de linhas enviadas (estimado): {len(df_send_for_append)}")
    try:
        # Recontagem pós-append — tenta reutilizar protocolo_col_idx caso exista, senão tenta detectar
        protocolo_col_idx_post = None
        header_row_cache = None
        if _aba_cache_all and len(_aba_cache_all) > 0:
            header_row_cache = _aba_cache_all[0]
        else:
            try:
                header_row_cache = aba_tratada.row_values(1)
            except Exception:
                header_row_cache = None

        if header_row_cache:
            for idx, h in enumerate(header_row_cache):
                if isinstance(h, str) and re.sub(r"[^a-z0-9]+", "_", h.lower()).strip("_") == "protocolo":
                    protocolo_col_idx_post = idx + 1
                    break

        if protocolo_col_idx_post is None:
            protocolo_col_idx_post = 1

        try:
            atualizada_protocols_raw = aba_tratada.col_values(protocolo_col_idx_post)
        except Exception:
            # fallback ao cache (se houver)
            if _aba_cache_all and len(_aba_cache_all) > 0:
                atualizada_protocols_raw = [row[protocolo_col_idx_post - 1] if len(row) >= protocolo_col_idx_post else "" for row in _aba_cache_all]
            else:
                atualizada_protocols_raw = []

        atualizada_protocols = [str(x).strip().upper() for x in atualizada_protocols_raw[1:] if str(x).strip() != ""] if atualizada_protocols_raw else []
        logging.info(f"Após append, total protocolos na sheet (col {protocolo_col_idx_post}) = {len(atualizada_protocols)}")
    except Exception as e:
        logging.warning(f"Não foi possível validar contagem pós-append: {e}")

print("✅ Atualização da planilha tratada concluída com sucesso.")
logging.info("✅ Atualização da planilha tratada concluída com sucesso.")

# ========================================================
# 9) PATCH / ATUALIZAÇÃO DE STATUS E DELTA HISTÓRICO (CORRIGIDO)
# ========================================================
_BANNER("9) PATCH / ATUALIZAÇÃO DE STATUS E DELTA HISTÓRICO (CORRIGIDO)")

import time

# --------------------------------------------------------
# 🔧 Helper principal de padronização de status e datas
# --------------------------------------------------------
def _prepare_status(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    # 1️⃣ Padroniza status_demanda (nova regra institucional)
    if "status_demanda" in df.columns:
        df["status_demanda"] = df["status_demanda"].apply(
            lambda v: "Concluído" if _is_concluida(v)
            else "Em atendimento" if (v and str(v).strip() != "")
            else v
        )

    # 2️⃣ Padroniza prazo_restante
    if "prazo_restante" in df.columns:
        df["prazo_restante"] = df["prazo_restante"].apply(_canon_prazo_restante)

    # 3️⃣ Padroniza data_da_conclusao — tratamento definitivo
    if "data_da_conclusao" in df.columns:
        def _tratar_data_conclusao(x):
            """Converte datas válidas e substitui inválidas/vazias por 'Não concluído'"""
            if pd.isna(x) or str(x).strip().lower() in ["", "nan", "na", "n/a", "none"]:
                return "Não concluído"
            try:
                dt = pd.to_datetime(x, errors="coerce")
                if pd.isna(dt):
                    return "Não concluído"
                return dt.strftime("%d/%m/%Y")
            except Exception:
                return "Não concluído"

        df["data_da_conclusao"] = df["data_da_conclusao"].apply(_tratar_data_conclusao)

    # 4️⃣ Limpeza de "Não há dados"
      # Não alteraremos o token "Não há dados" para preservar o valor original da bruta.
    # Caso deseje célula vazia na planilha tratada, isso será feito apenas no momento do envio.
    logging.info("Pulando limpeza automática de 'Não há dados' para tempo_de_resolucao_em_dias (preservação).")

    return df


# --------------------------------------------------------
# Fallback de envio de lotes (log)
# --------------------------------------------------------
def _post_lotes(df: pd.DataFrame, msg: str, cols: list):
    logging.warning(f"Fallback acionado ({msg}) para {len(df)} linhas. Colunas: {cols}")

# Antes de criar/usar os deltas, aplique o prepare em todo df (ou pelo menos nos deltas)
df = _prepare_status(df)  # garante que coluna principal esteja padronizada

# Em seguida crie os deltas com base no df já padronizado:
delta_status = df[df["status_demanda"] != df.get("status_demanda_OLD", df["status_demanda"])]
delta_conc = df[df["data_da_conclusao"] != df.get("data_da_conclusao_OLD", df["data_da_conclusao"])]
delta_tempo = df[df["tempo_de_resolucao_em_dias"] != df.get("tempo_de_resolucao_em_dias_OLD", df["tempo_de_resolucao_em_dias"])]

# --------------------------------------------------------
# PATCH principal — atualização de células no Google Sheets
# --------------------------------------------------------
def _patch_grouped_force(df: pd.DataFrame, key_col: str, value_col: str, sheet=None):
    if df.empty:
        logging.info("Delta vazio. Nada a atualizar.")
        return

    batch_size = 50

    # Aplica padronizações completas
    df = _prepare_status(df)
    df[key_col] = df[key_col].astype(str).str.strip()

    # EXCEÇÃO: não forçar astype(str) globalmente para tempo_de_resolucao_em_dias
    if value_col != "tempo_de_resolucao_em_dias":
        df[value_col] = df[value_col].astype(str).str.strip()
    else:
        df[value_col] = df[value_col].astype(object)
        logging.info("Preparando patch: exceção aplicada para 'tempo_de_resolucao_em_dias'.")

    # 🔒 Corrige 'data_da_conclusao' pós-stringificação
    if value_col == "data_da_conclusao":
        df[value_col] = df[value_col].apply(
            lambda x: "Não concluído" if str(x).strip().lower() in ["", "nan", "na", "n/a", "none", "nat"] else x
        )

    if sheet is None:
        _post_lotes(df, f"{value_col} (fallback)", [key_col, value_col])
        return

    # Tenta localizar colunas no Sheets
    try:
        key_list = sheet.col_values(1)
    except Exception as e:
        logging.error(f"Erro ao obter protocolos da planilha: {e}")
        _post_lotes(df, f"{value_col} (fallback)", [key_col, value_col])
        return

    try:
        col_idx = sheet.find(value_col).col
    except Exception:
        logging.warning(f"Coluna '{value_col}' não encontrada. Usando coluna 2 como fallback.")
        col_idx = 2

    # --- PREPARA LISTA DE ATUALIZAÇÃO ---
    to_update = []
    for _, row in df.iterrows():
        key = row[key_col]
        value = row.get(f"{value_col}_trat", row[value_col])
        if key in key_list:
            row_idx = key_list.index(key) + 1
            to_update.append((row_idx, col_idx, value))
        else:
            logging.warning(f"Protocolo '{key}' não encontrado na planilha.")

   # --- ATUALIZAÇÃO EM BATCH ---
    total_updated = 0
    for i in range(0, len(to_update), batch_size):
        batch = to_update[i:i + batch_size]
        if not batch:
            continue

        cleaned_batch = []
        for r in batch:
            value = r[2]

            if value_col == "tempo_de_resolucao_em_dias":
                if pd.isna(value) or str(value).strip() == "":
                    value_out = ""
                else:
                    try:
                        vnum = float(value)
                        if vnum.is_integer():
                            value_out = str(int(vnum))
                        else:
                            value_out = str(vnum)
                    except Exception:
                        # mantém o formato exato da bruta
                        value_out = str(value).strip()
            else:
                # comportamento normal para outras colunas
                if pd.isna(value) or str(value).strip() == "":
                    value_out = "Não concluído" if value_col == "data_da_conclusao" else ""
                else:
                    value_out = str(value).strip()

            cleaned_batch.append((r[0], r[1], value_out))

        range_rows = [r[0] for r in cleaned_batch]
        values = [[r[2]] for r in cleaned_batch]

        try:
            import gspread.utils
            start_row = min(range_rows)
            end_row = max(range_rows)
            range_str = (
                f"{gspread.utils.rowcol_to_a1(start_row, col_idx)}:"
                f"{gspread.utils.rowcol_to_a1(end_row, col_idx)}"
            )
            sheet.update(range_str, values)
            total_updated += len(cleaned_batch)
        except Exception as e:
            logging.error(f"Erro no batch update: {e}")
            _post_lotes(
                pd.DataFrame([(r[0], r[2]) for r in cleaned_batch], columns=[key_col, value_col]),
                f"{value_col} (fallback)",
                [key_col, value_col],
            )

    logging.info(f"✅ Status atualizado em batch: {total_updated}/{len(df)} linhas.")
    if total_updated == 0:
        logging.info("Nenhuma linha atualizada diretamente. Enviando via _post_lotes como fallback.")
        _post_lotes(df, f"{value_col} (fallback)", [key_col, value_col])

# ========================================================
# 10) DELTAS HISTÓRICOS (status_demanda, data_da_conclusao, tempo_de_resolucao_em_dias, prazo_restante)
# ========================================================

_BANNER("10) DELTAS HISTÓRICOS (ajustado — sincroniza 4 colunas de exceção)")

# --- Alinha colunas do df_send ao schema da tratada ---
try:
    cols_tratada = list(df_tratada.columns)
    if 'df_send' not in globals():
        df_send = pd.DataFrame(columns=cols_tratada)
    df_send_aligned = df_send.reindex(columns=cols_tratada, fill_value="")
    df_full = pd.concat([df_tratada, df_send_aligned], ignore_index=True, sort=False)
except Exception as e:
    logging.warning(f"Falha ao concatenar bases tratada + novos: {e}")
    df_full = df_send.copy()

# --- Garantia de colunas OLD para histórico ---
EXCEPTION_COLS = ["status_demanda", "data_da_conclusao", "tempo_de_resolucao_em_dias", "prazo_restante"]
for col in EXCEPTION_COLS:
    old_col = f"{col}_OLD"
    if old_col not in df_full.columns:
        df_full[old_col] = df_full.get(col, "").fillna("")

# --- Prepara lookup da BRUTA por protocolo (última ocorrência)
# Normaliza e garante colunas na bruta
for c in EXCEPTION_COLS:
    if c not in df_bruta.columns:
        df_bruta[c] = pd.NA

df_bruta['protocolo'] = df_bruta.get('protocolo', pd.Series([''] * len(df_bruta))).astype(str).str.strip().str.upper()
df_full['protocolo']   = df_full.get('protocolo', pd.Series([''] * len(df_full))).astype(str).str.strip().str.upper()

# Criar lookup: mantém última ocorrência se houver duplicatas
df_bruta_lookup = df_bruta.set_index('protocolo', drop=False).loc[:, EXCEPTION_COLS].copy()
df_bruta_lookup = df_bruta_lookup[~df_bruta_lookup.index.duplicated(keep='last')]

# helper: considera valor "presente" quando não vazio/nulo/token inválido
_invalid_tokens_str = {"", "nan", "none", "na", "n/a", "não há dados", "não ha dados", "não informado", "nao informado", "null"}
def _bruta_has_value(v):
    if pd.isna(v):
        return False
    s = str(v).strip()
    if s == "":
        return False
    return s.lower() not in _invalid_tokens_str

# Normalizações vindas da bruta (aplicar conversões por coluna)
#  - data_da_conclusao: aplicar _conclusao_strict para formatar DD/MM/AAAA ou 'Não concluído'
#  - tempo_de_resolucao_em_dias: converter vírgula -> ponto e para numérico
#  - status_demanda: normalizar para 'CONCLUÍDA' / 'EM ANDAMENTO' quando possível
#  - prazo_restante: aplicar _canon_prazo_restante e regra de 'Demanda Concluída' quando status for concluída
try:
    # prepara colunas temporárias com versões normalizadas vindas da bruta
    bruta_norm = pd.DataFrame(index=df_bruta_lookup.index)

    # data_da_conclusao
    if "data_da_conclusao" in df_bruta_lookup.columns:
        try:
            bruta_norm["data_da_conclusao"] = _conclusao_strict(df_bruta_lookup["data_da_conclusao"]).astype(object)
        except Exception:
            # fallback genérico
            bruta_norm["data_da_conclusao"] = _to_ddmmaa_text(df_bruta_lookup["data_da_conclusao"])

      # --- Normalizações vindas da bruta (AJUSTE: preservar valor original) ---
    if "tempo_de_resolucao_em_dias" in df_bruta_lookup.columns:
    raw_series = df_bruta_lookup["tempo_de_resolucao_em_dias"]
    mask_invalid = raw_series.astype(str).str.strip().str.lower().isin(_invalid_tokens_str)

    # Preserva exato: usa a representação textual original; se for número, formata sem alterar a aparência
    def _as_raw_text(v):
        if pd.isna(v):
            return pd.NA
        if isinstance(v, str):
            return v.strip()
        try:
            fv = float(v)
            if fv.is_integer():
                return str(int(fv))
            else:
                # evita notação científica e zeros desnecessários
                text = format(fv, "f")
                text = text.rstrip("0").rstrip(".") if "." in text else text
                return text
        except Exception:
            return str(v)

    preserved = raw_series.where(~mask_invalid, pd.NA)
    bruta_norm["tempo_de_resolucao_em_dias"] = (
        preserved.apply(lambda x: _as_raw_text(x) if pd.notna(x) else pd.NA).astype(object)
    )
        logging.info("Preservando 'tempo_de_resolucao_em_dias' a partir da bruta (sem coerção numérica).")

    # status_demanda
    if "status_demanda" in df_bruta_lookup.columns:
        s_status = df_bruta_lookup["status_demanda"].astype(str).str.strip()
        def _map_status_bruta(x):
            if not _bruta_has_value(x):
                return pd.NA
            if _is_concluida(x):
                return "CONCLUÍDA"
            # se contém alguma palavra, mantemos e marcamos EM ANDAMENTO
            return "EM ANDAMENTO" if str(x).strip() != "" else pd.NA
        bruta_norm["status_demanda"] = s_status.apply(_map_status_bruta)

    # prazo_restante
    if "prazo_restante" in df_bruta_lookup.columns:
        s_pr = df_bruta_lookup["prazo_restante"].astype(str)
        # aplica canonização parcial
        bruta_norm["prazo_restante"] = s_pr.apply(lambda x: _canon_prazo_restante(x) if _bruta_has_value(x) else pd.NA)

except Exception as e:
    logging.exception(f"Erro ao normalizar campos de exceção vindos da bruta: {e}")
    bruta_norm = pd.DataFrame(index=df_bruta_lookup.index)

# --- Agora: sincroniza os valores da BRUTA para o df_full (somente quando a bruta tem valor não-vazio)
# Mantemos valores existentes na tratada quando bruta não tem valor
if not bruta_norm.empty:
    # iterar por protocolos presentes em df_full que também existam na bruta_lookup
    protocolo_to_rows = {}
    for i, p in enumerate(df_full['protocolo'].astype(str)):
        protocolo_to_rows.setdefault(str(p).strip().upper(), []).append(i)

    applied_counts = {c:0 for c in EXCEPTION_COLS}

    for proto, rows_idx in protocolo_to_rows.items():
        if proto in bruta_norm.index:
            row_vals = bruta_norm.loc[proto]
            for col in EXCEPTION_COLS:
                try:
                    val = row_vals.get(col, pd.NA) if proto in bruta_norm.index else pd.NA
                    if pd.isna(val):
                        continue  # nada a sobrescrever
                    # Especial: se for data_da_conclusao e for 'Não concluído' ou string, já vem formatado por _conclusao_strict
                    # Para prazo_restante: se status_concluida set 'Demanda Concluída' — mas respeitamos bruta em primeiro lugar
                    for ridx in rows_idx:
                        # apply conversion just before assignment for safety
                        if col == "data_da_conclusao":
                            # val já deveria estar em DD/MM/AAAA ou 'Não concluído'
                            assign_val = val
                        elif col == "tempo_de_resolucao_em_dias":
                            # armazena número (float) — manter tipo coerente
                            assign_val = val
                        elif col == "status_demanda":
                            assign_val = val
                        elif col == "prazo_restante":
                            assign_val = val
                        else:
                            assign_val = val
                        df_full.at[ridx, col] = assign_val
                        applied_counts[col] += 1
                except Exception as e:
                    logging.debug(f"Não foi possível sincronizar protocolo {proto} coluna {col}: {e}")

    logging.info(f"Sincronização a partir da bruta aplicada. Contagens por coluna: {applied_counts}")
else:
    logging.info("Nenhum valor normalizado encontrado na bruta para sincronização.")

# --- Reaplica regras derivadas (ex.: se status == CONCLUÍDA então prazo_restante='Demanda Concluída') ---
try:
    if "status_demanda" in df_full.columns and "prazo_restante" in df_full.columns:
        mask_conc = df_full["status_demanda"].map(_is_concluida)
        if mask_conc.any():
            df_full.loc[mask_conc, "prazo_restante"] = "Demanda Concluída"
            logging.info(f"Regra pós-sincronização aplicada: prazo_restante setado para 'Demanda Concluída' em {mask_conc.sum()} linhas.")
except Exception as e:
    logging.debug(f"Erro ao aplicar regra pós-sincronização para prazo_restante: {e}")

# --- Atualiza as colunas *_OLD (garante comparação correta): já criadas acima ---

# --- Função delta robusta (com fillna e casting a str) ---
def _delta_df(df_full_local: pd.DataFrame, col: str) -> pd.DataFrame:
    old_col = f"{col}_OLD"
    left = df_full_local.get(col, "").fillna("").astype(str)
    right = df_full_local.get(old_col, "").fillna("").astype(str)
    return df_full_local[left != right].copy()

# --- Calcula deltas específicos (apenas uma vez e sem sobrescritas) ---
delta_status = _delta_df(df_full, "status_demanda")
delta_conc   = _delta_df(df_full, "data_da_conclusao")
delta_tempo  = _delta_df(df_full, "tempo_de_resolucao_em_dias")
delta_prazo  = _delta_df(df_full, "prazo_restante")

# --- Logs e verificações ---
logging.info(f"Delta STATUS: {len(delta_status)} linhas alteradas/novas")
logging.info(f"Delta DATA_CONCLUSAO: {len(delta_conc)} linhas alteradas/novas")
logging.info(f"Delta TEMPO_DE_RESOLUCAO: {len(delta_tempo)} linhas alteradas/novas")
logging.info(f"Delta PRAZO_RESTANTE: {len(delta_prazo)} linhas alteradas/novas")

print(f"📊 Deltas calculados com sucesso:")
print(f"   • STATUS: {len(delta_status)}")
print(f"   • DATA_CONCLUSAO: {len(delta_conc)}")
print(f"   • TEMPO_DE_RESOLUCAO: {len(delta_tempo)}")
print(f"   • PRAZO_RESTANTE: {len(delta_prazo)}")

# --- Opcional: aplicar patches na aba_tratada (se disponível)
try:
    if 'aba_tratada' in globals() and aba_tratada is not None:
        # Para cada delta chama o patch grouped (usa coluna 'protocolo' como chave)
        if not delta_status.empty:
            _patch_grouped_force(delta_status, key_col="protocolo", value_col="status_demanda", sheet=aba_tratada)
        if not delta_conc.empty:
            _patch_grouped_force(delta_conc, key_col="protocolo", value_col="data_da_conclusao", sheet=aba_tratada)
        if not delta_tempo.empty:
            _patch_grouped_force(delta_tempo, key_col="protocolo", value_col="tempo_de_resolucao_em_dias", sheet=aba_tratada)
        if not delta_prazo.empty:
            _patch_grouped_force(delta_prazo, key_col="protocolo", value_col="prazo_restante", sheet=aba_tratada)
    else:
        logging.info("aba_tratada não disponível — deltas calculados mas não aplicados diretamente (fallback).")
except Exception as e:
    logging.exception(f"Erro ao aplicar patches das deltas na aba_tratada: {e}")

# --- Logs finais do item 10 ---
logging.info("Item 10 finalizado: sincronização das 4 colunas de exceção concluída.")

# ========================================================
# 11) QA & SUMÁRIO FINAL
# ========================================================
_BANNER("11) QA & SUMÁRIO FINAL")

# --- Protocolos novos / existentes ---
if "eh_novo" in df.columns:
    novos_protos = df.loc[df["eh_novo"] == True, "protocolo"].astype(str).str.strip()
    print(f"🔹 Protocolos novos: {len(novos_protos)}")
    logging.info(f"Protocolos novos: {len(novos_protos)}")
else:
    novos_protos = pd.Series([], dtype=str)
    logging.info("Coluna 'eh_novo' ausente — nenhum protocolo novo identificado.")

# --- QA de colunas críticas ---
qa_cols = ["status_demanda", "data_da_conclusao", "tempo_de_resolucao_em_dias"]
for col in qa_cols:
    if col in df.columns:
        nulos = df[col].isna().sum()
        print(f"🔹 {col} vazio: {nulos} linhas")
        logging.info(f"QA: {col} vazio: {nulos} linhas")
    else:
        logging.info(f"Coluna '{col}' ausente.")

# --- Sumário final ---
print("✅ QA concluído. Sumário final:")
logging.info("QA concluído. Sumário final:")
print(f"  • Protocolos totais na planilha: {len(df)}")
print(f"  • Protocolos novos identificados: {len(novos_protos)}")
for col in qa_cols:
    nulos = df[col].isna().sum() if col in df.columns else 0
    print(f"  • {col} vazio: {nulos}")

# ========================================================
# 12) FINALIZAÇÃO
# ========================================================

# --- Sanity checks finais (colocar antes do _BANNER("12) PIPELINE FINALIZADO")) ---
try:
    bruta_rows = len(df_bruta) if 'df_bruta' in globals() and isinstance(df_bruta, pd.DataFrame) else 0
    bruta_cols = list(df_bruta.columns)[:20] if 'df_bruta' in globals() and isinstance(df_bruta, pd.DataFrame) and not df_bruta.empty else []
except Exception:
    bruta_rows, bruta_cols = 0, []

try:
    tratada_rows = len(df_tratada) if 'df_tratada' in globals() and isinstance(df_tratada, pd.DataFrame) else 0
    tratada_cols = list(df_tratada.columns)[:20] if 'df_tratada' in globals() and isinstance(df_tratada, pd.DataFrame) and not df_tratada.empty else []
except Exception:
    tratada_rows, tratada_cols = 0, []

novos_cnt = int(df_bruta['eh_novo'].sum()) if 'df_bruta' in globals() and 'eh_novo' in df_bruta.columns else 0
df_send_cnt = len(df_send) if 'df_send' in globals() and isinstance(df_send, pd.DataFrame) else 0

logging.info(f"Sanity: df_bruta rows={bruta_rows} cols={bruta_cols}")
logging.info(f"Sanity: df_tratada rows={tratada_rows} cols={tratada_cols}")
logging.info(f"Sanity: novos detectados={novos_cnt} | df_send (preparados para envio)={df_send_cnt}")
print(f"Sanity checks — bruta:{bruta_rows} rows, tratada:{tratada_rows} rows, novos:{novos_cnt}, to_send:{df_send_cnt}")

# opcional: numero real de linhas na sheet (pode ser custoso em tempo)
try:
    if 'aba_tratada' in globals():
        total_sheet_rows = len(aba_tratada.get_all_values())
        logging.info(f"Sanity: aba_tratada (sheet) rows={total_sheet_rows}")
except Exception as e:
    logging.warning(f"Não foi possível obter aba_tratada.get_all_values(): {e}")

_BANNER("12) PIPELINE FINALIZADO")

print("🎯 Pipeline executado com sucesso!")
logging.info("Pipeline executado com sucesso")

print("Fluxo: GoogleSheets (bruto) → Python (tratamento) → GoogleSheets (tratado) → LookerStudio")

# --- Resumo de atualizações completas ---
for col in qa_cols:
    if col in df.columns:
        atualizadas = len(df[df[col].notna()])
        print(f"  • {col} atualizadas: {atualizadas} linhas")
        logging.info(f"{col} atualizadas: {atualizadas} linhas")
