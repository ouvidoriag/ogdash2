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

# As importações de 'googleapiclient.discovery', 'google.oauth2.service_account',
# 'gspread', 'pandas', 'logging' já estão no topo do arquivo.
# Não precisam ser repetidas aqui.

# --- Função helper para obter a última planilha da pasta bruta ---
# Esta função já estava bem definida.
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
            logging.critical(f"❌ Nenhuma planilha bruta encontrada na pasta do Google Drive com ID: '{folder_id}'. O pipeline será encerrado.", exc_info=True)
            raise SystemExit("Erro crítico: Nenhuma planilha bruta encontrada.")
        latest = files[0]
        fid, fname = latest["id"], latest["name"]
        sh = gspread_client.open_by_key(fid)
        aba = sh.sheet1
        dfb = pd.DataFrame(aba.get_all_records())
        return fid, fname, dfb
    except Exception as e:
        logging.critical(f"❌ Erro ao obter a última planilha da pasta bruta '{folder_id}': {e}. O pipeline será encerrado.", exc_info=True)
        raise SystemExit("Erro crítico: Falha ao carregar planilha bruta.")


# --- Uso ---
FOLDER_ID_BRUTA = "1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5" # Mantenha seu ID de pasta aqui
try:
    latest_file_id, latest_file_name, df_bruta = get_latest_spreadsheet_df(FOLDER_ID_BRUTA, gc, drive_service)
    df = df_bruta.copy()

    print(f"📂 Última planilha encontrada: {latest_file_name} ({latest_file_id})")
    logging.info(f"Última planilha encontrada: {latest_file_name} ({latest_file_id})")
    print(f"✅ Planilha bruta importada com sucesso: {df_bruta.shape}")
    logging.info(f"Planilha bruta importada com sucesso: {df_bruta.shape}")
except SystemExit: # Captura o SystemExit da função helper para não logar novamente
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
    if v is None:
        return ""
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
    if not isinstance(text, str) or not text.strip():
        return text
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
    PLANILHA_TRATADA_ID = "1SmO5yTD5B6fN_gT-7m1wosP_sbzmtd0agTC-LNCnX9Y"  # <-- coloque aqui o ID CORRETO da planilha tratada fixa

    # ---------- ABRE A PLANILHA TRATADA (única fonte) ----------
    planilha_tratada_gs = gc.open_by_key(PLANILHA_TRATADA_ID) # Renomeado para evitar conflito com df_tratada
    aba_tratada = planilha_tratada_gs.sheet1
    logging.info(f"Planilha tratada '{PLANILHA_TRATADA_ID}' aberta.")

    df_tratada = pd.DataFrame(aba_tratada.get_all_records())
    df_tratada.columns = [normalizar_nome_coluna(c) for c in df_tratada.columns]

    df_tratada = normalize_protocolo_col(df_tratada, "protocolo")
    protocolos_existentes_set = set(df_tratada["protocolo"].astype(str).tolist())

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

    # Marca novos protocolos (comparação com o conjunto da tratada)
    df_bruta["eh_novo"] = ~df_bruta["protocolo"].isin(protocolos_existentes_set)
    novos_protos = df_bruta.loc[df_bruta["eh_novo"], "protocolo"].tolist()

    print(f"🔑 Protocolos já na planilha tratada: {len(protocolos_existentes_set)}")
    print(f"🆕 Protocolos detectados como novos: {len(novos_protos)}")
    logging.info(f"Protocolos já na planilha tratada: {len(protocolos_existentes_set)}")
    logging.info(f"Protocolos detectados como novos: {novos_protos[:50]}")

    # Log dos existentes que não serão enviados
    nao_enviados = df_bruta.loc[~df_bruta["eh_novo"], "protocolo"].tolist()
    print(f"⚠️ Protocolos existentes que não serão enviados (não novos): {len(nao_enviados)}")
    logging.info(f"Protocolos existentes que não serão enviados: {nao_enviados[:50]}")

    # Verificação final
    if df_bruta.empty:
        raise Exception("A planilha bruta mais recente está vazia ou não pôde ser lida.")

    # Substitui df pelo df_bruta "oficial" para manter compatibilidade posterior
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

# ======================================================================= #
# ========= INÍCIO DO BLOCO TEMPORÁRIO DE BACKFILL - INSIRA AQUI ========= #
# ======================================================================= #

# ===================================================================================
# 5.5) BACKFILL TEMPORÁRIO DE 'orgaos' (REMOVER APÓS 1ª EXECUÇÃO)
# ===================================================================================
_BANNER("5.5) BACKFILL TEMPORÁRIO DE 'responsavel' (REMOVER DEPOIS)")
print(" Executando backfill para padronizar TODA a coluna 'responsavel'...")
logging.info("INICIANDO: Backfill temporário da coluna 'responsavel'.")

try:
    _SUB("Carregando base tratada histórica para 'responsavel'...")
    df_tratada_hist = pd.DataFrame(aba_tratada.get_all_records())
    df_tratada_hist.columns = [normalizar_nome_coluna(c) for c in df_tratada_hist.columns]
    
    if 'protocolo' not in df_tratada_hist.columns or 'responsavel' not in df_tratada_hist.columns:
        raise ValueError("Colunas 'protocolo' ou 'responsavel' não encontradas na planilha tratada.")

    _SUB("Aplicando a nova lógica de padronização a todos os dados históricos...")
    
    # Cria uma nova coluna com os valores corrigidos, aplicando a MESMA lógica do novo Item 7.6
    df_tratada_hist['responsavel_corrigido'] = df_tratada_hist['responsavel'].astype(str).apply(_clean_whitespace)
    df_tratada_hist['responsavel_corrigido'] = df_tratada_hist['responsavel_corrigido'].str.replace(
        r"^\s*ouvidoria\s+geral\s*$", "Ouvidoria Geral", regex=True, case=False
    )
    df_tratada_hist['responsavel_corrigido'] = df_tratada_hist['responsavel_corrigido'].str.replace(
        r"^\s*ouvidoria\s+setorial\s+de\s+obras\s*$", "Ouvidoria Setorial de Obras", regex=True, case=False
    )
    df_tratada_hist['responsavel_corrigido'] = df_tratada_hist['responsavel_corrigido'].str.replace(
        r"^\s*ouvidoria\s+setorial\s+da\s+sa(u|ú)de\s*$", "Ouvidoria Setorial da Saúde", regex=True, case=False
    )
    df_tratada_hist['responsavel_corrigido'] = df_tratada_hist['responsavel_corrigido'].str.replace(
        r"^\s*cidadao\s*$", "Cidadão", regex=True, case=False
    )
    df_tratada_hist['responsavel_corrigido'] = df_tratada_hist['responsavel_corrigido'].str.replace(
        r"^\s*(Sim|True)\s*$", "Cidadão", regex=True, case=False
    )
    df_tratada_hist.loc[df_tratada_hist["responsavel_corrigido"].str.strip() == '', "responsavel_corrigido"] = "Não Informado"

    _SUB("Identificando e atualizando as divergências...")
    df_para_atualizar = df_tratada_hist[df_tratada_hist['responsavel'] != df_tratada_hist['responsavel_corrigido']]
    
    if not df_para_atualizar.empty:
        print(f" Encontradas {len(df_para_atualizar)} linhas em 'responsavel' para corrigir.")
        TARGET_COL_INDEX = df_tratada_hist.columns.get_loc('responsavel') + 1
        protocolos_na_sheet = aba_tratada.col_values(1)
        protocolo_para_linha = {proto: i + 1 for i, proto in enumerate(protocolos_na_sheet)}
        
        cells_to_update = [
            gspread.Cell(row=protocolo_para_linha[row['protocolo']], col=TARGET_COL_INDEX, value=str(row['responsavel_corrigido']))
            for _, row in df_para_atualizar.iterrows() if row['protocolo'] in protocolo_para_linha
        ]
        
        if cells_to_update:
            aba_tratada.update_cells(cells_to_update, value_input_option='USER_ENTERED')
            print(f"✅ Backfill da coluna 'responsavel' concluído. {len(cells_to_update)} células foram corrigidas.")
    else:
        print("✅ Nenhuma divergência histórica encontrada na coluna 'responsavel'.")

except Exception as e:
    print(f"❌ Erro crítico durante o backfill de 'responsavel': {e}")


# ======================================================================= #
# =================== FIM DO BLOCO TEMPORÁRIO DE BACKFILL ================= #
# ======================================================================= #

# ========================================================
# 6) LIMPEZA BÁSICA + RECORTE PARA NOVOS POR PROTOCOLO
# ========================================================
print("🧹 Limpando e identificando novos protocolos...")
df_tratada_protocolos = df_tratada["protocolo"].astype(str).str.strip().tolist()
df["protocolo"] = df["protocolo"].astype(str).str.strip()

df["eh_novo"] = ~df["protocolo"].isin(df_tratada_protocolos)
novos = df[df["eh_novo"] == True]
existentes = df[df["eh_novo"] == False]

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

    # 7.3 Unidades de saúde (capitaliza e trata “sem informação”)
    try:
        for col in df_loc.columns:
            if "unidade" in col and "saude" in col:
                linhas_alteradas = (df_loc[col].astype(str).str.strip().str.lower() == "sem informação").sum()
                df_loc[col] = (
                    df_loc[col].astype(str).str.strip().str.lower()
                    .replace("sem informação", "Não é uma Unidade de Saúde")
                    .str.capitalize()
                )
                if linhas_alteradas > 0:
                    logging.info(f"Tratamento 7.3 (Unidades de Saúde) aplicado na coluna '{col}' para {linhas_alteradas} linhas.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.3 (Unidades de Saúde): {e}", exc_info=True)

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
                "Stephanie Santos": "Stephanie dos Santos Silva", "Thamires Manhães": "Cidadão"
            }
            _orig = df_loc["servidor"].astype(str).str.strip()
            df_loc["servidor"] = _orig.map(dicionario_servidor).fillna(_orig)
            logging.info("Tratamento 7.5 (Padronização 'servidor') aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.5 (Padronização 'servidor'): {e}", exc_info=True)

     # 7.6 Responsavel - LÓGICA CORRIGIDA E UNIFICADA
    try:
        if "responsavel" in df_loc.columns:
            # Garante que a coluna é string e limpa espaços extras
            df_loc["responsavel"] = df_loc["responsavel"].astype(str).apply(_clean_whitespace)

            # Aplica padronizações robustas com regex (case-insensitive)
            # Corrige "Ouvidoria Geral" (com ou sem acento, maiúsculo ou minúsculo)
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(
                r"^\s*ouvidoria\s+geral\s*$", "Ouvidoria Geral", regex=True, case=False
            )
            # Corrige "Ouvidoria Setorial de Obras"
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(
                r"^\s*ouvidoria\s+setorial\s+de\s+obras\s*$", "Ouvidoria Setorial de Obras", regex=True, case=False
            )
            # Corrige "Ouvidoria Setorial da Saude" (com ou sem 'ú')
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(
                r"^\s*ouvidoria\s+setorial\s+da\s+sa(u|ú)de\s*$", "Ouvidoria Setorial da Saúde", regex=True, case=False
            )
            # Corrige "Cidadao" (com ou sem 'ã')
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(
                r"^\s*cidadao\s*$", "Cidadão", regex=True, case=False
            )
            # Corrige "Sim" ou "True"
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(
                r"^\s*(Sim|True)\s*$", "Cidadão", regex=True, case=False
            )
            
            # Trata valores vazios como "Não Informado"
            df_loc.loc[df_loc["responsavel"].str.strip() == '', "responsavel"] = "Não Informado"

            logging.info("Tratamento 7.6 (Unificado para 'responsavel') aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.6 (Responsavel): {e}", exc_info=True)

    # 7.7 Datas e tipos
    try:
        if "data_da_criacao" in df_loc.columns:
            df_loc["data_da_criacao"] = _to_ddmmaa_text(df_loc["data_da_criacao"]).astype(str)
            logging.info("Tratamento 7.7 (data_da_criacao) aplicado.")
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

    # 7.9 Padronização adicional para 'responsavel' (Ouvidorias)
    try:
        if "responsavel" in df_loc.columns:
            df_loc["responsavel"] = df_loc["responsavel"].astype(str)
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(
                r"^\s*ouvidoria\s+geral\s*$", "Ouvidoria Geral", regex=True, case=False
            )
            df_loc["responsavel"] = df_loc["responsavel"].str.replace(
                r"^\s*ouvidoria\s+setorial\s+de\s+obras\s*$", "Ouvidoria Setorial de Obras", regex=True, case=False
            )
            logging.info("Tratamento 7.9 (Padronização de Ouvidorias em 'responsavel') aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.9 (Padronização de Ouvidorias): {e}", exc_info=True)

    # 7.10 Padronização da coluna 'canal'
    try:
        if "canal" in df_loc.columns:
            df_loc["canal"] = df_loc["canal"].astype(str)
            df_loc["canal"] = df_loc["canal"].str.replace(
                r"^\s*(Colab Gov|Portal Cidadão)\s*$", "Aplicativo Colab", regex=True, case=False
            )
            logging.info("Tratamento 7.10 (Padronização de 'canal') aplicado.")
    except Exception as e:
        logging.error(f"Erro no tratamento 7.10 (Padronização de 'canal'): {e}", exc_info=True)

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
                logging.warning(f"QA Pós-Tratamento (df_novos): Coluna '{col}' contém {empty_count} valores vazios/inválidos/não informados. Exemplos: {df_novos.loc[df_novos[col].astype(str).str.strip().isin(['', 'nan', 'none', 'n/a', 'não informado']), col].unique()[:5].tolist()}")
            
            # Verificação de tipos para garantir que são strings
            if not pd.api.types.is_string_dtype(df_novos[col]):
                logging.error(f"QA Pós-Tratamento (df_novos): Coluna '{col}' não é do tipo string após tratamento. Tipo atual: {df_novos[col].dtype}. Convertendo para string.")
                df_novos[col] = df_novos[col].astype(str)
                
# ========================================================
# 8) ATUALIZAÇÃO NA PLANILHA TRATADA — APENAS NOVOS
# ========================================================
_BANNER("8) ATUALIZAÇÃO NA PLANILHA TRATADA — APENAS NOVOS")

# ----------------------------------------------------------
# GARANTE QUE df_bruta EXISTE E TEM A COLUNA 'protocolo'
# ----------------------------------------------------------
try:
    if 'df_bruta' not in globals() or df_bruta.empty:
        raise SystemExit("❌ df_bruta não está definido ou está vazio. Carregue a base bruta antes do Item 8.")
    logging.info(f"df_bruta presente e com shape: {df_bruta.shape}")

    df_bruta.columns = [normalizar_nome_coluna(c) for c in df_bruta.columns] # Garante que está normalizado
    df_bruta = normalize_protocolo_col(df_bruta, "protocolo") # Garante que protocolo está padronizado
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

    PLANILHA_TRATADA_ID = "1SmO5yTD5B6fN_gT-7m1wosP_sbzmtd0agTC-LNCnX9Y"
    planilha_tratada_gs = client.open_by_key(PLANILHA_TRATADA_ID)
    aba_tratada = planilha_tratada_gs.sheet1
    logging.info(f"Planilha tratada '{PLANILHA_TRATADA_ID}' aberta.")
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
    if df_tratada_existente.empty:
        if 'df_novos' in globals() and not df_novos.empty:
            cols_alvo_tratada = list(df_novos.columns)
            logging.info("Planilha tratada vazia, usando colunas de df_novos como referência para o schema.")
        elif not df_bruta.empty:
            cols_alvo_tratada = list(df_bruta.columns)
            logging.info("Planilha tratada vazia e df_novos vazio, usando colunas de df_bruta como referência para o schema.")
        else:
            logging.error("Não foi possível determinar o schema da planilha tratada. df_tratada_existente, df_novos e df_bruta estão vazios.")
            raise ValueError("Não foi possível determinar o schema da planilha tratada.")
    logging.debug(f"Colunas alvo da planilha tratada: {cols_alvo_tratada}")

except Exception as e:
    logging.critical(f"Erro ao processar df_tratada_existente ou definir schema alvo no Item 8: {e}", exc_info=True)
    raise

# ----------------------------------------------------------
# IDENTIFICA E PREPARA NOVOS PROTOCOLOS PARA ENVIO
# ----------------------------------------------------------

try:
    novos_protocolos_a_enviar = set(df_bruta["protocolo"]) - protocolos_existentes_set_final
    df_send_bruto = df_bruta[df_bruta["protocolo"].isin(novos_protocolos_a_enviar)].copy()

    if df_send_bruto.empty:
        logging.info("Nenhum protocolo novo detectado para envio. df_send será um DataFrame vazio.")
        print("🧹 Nenhum protocolo novo para enviar.")
        df_send = pd.DataFrame(columns=cols_alvo_tratada) # Define df_send vazio com colunas corretas
    else:
        logging.info(f"Detectados {len(df_send_bruto)} protocolos novos para processar e enviar. Shape inicial: {df_send_bruto.shape}")
        print(f"🧹 Novos protocolos a enviar: {len(df_send_bruto)}")

        # APLICA TODOS OS TRATAMENTOS DE _tratar_full AQUI!
        df_send = _tratar_full(df_send_bruto.copy())
        logging.info(f"Função _tratar_full aplicada a df_send_bruto. Shape após tratamento: {df_send.shape}")

        # Remove colunas auxiliares que não devem ser escritas no Google Sheets
        cols_to_drop = []
        if "eh_novo" in df_send.columns:
            cols_to_drop.append("eh_novo")
        # Adicione aqui outras colunas auxiliares
        # if "alguma_coluna_temp" in df_send.columns: cols_to_drop.append("alguma_coluna_temp")

        if cols_to_drop:
            df_send = df_send.drop(columns=cols_to_drop)
            logging.info(f"Colunas auxiliares removidas de df_send: {cols_to_drop}. Novo shape: {df_send.shape}")

        # Garante que o df_send tem as colunas corretas e na ordem certa
        df_send_final = df_send.reindex(columns=cols_alvo_tratada, fill_value="")
        logging.info(f"df_send reindexado para alinhar com colunas alvo. Shape final: {df_send_final.shape}")

        # QA: Verifica se alguma coluna do df_send_final contém valores inesperados antes do envio
        for col_qa in ['orgaos', 'responsavel', 'status_demanda', 'data_da_conclusao']:
            if col_qa in df_send_final.columns:
                unexpected_values = df_send_final[col_qa].astype(str).str.contains(r'(?i)^(sim|nao|true|false|\?{2,}|nan|none)$')
                if unexpected_values.any():
                    logging.error(f"QA Pré-Envio (df_send): Coluna '{col_qa}' contém valores inesperados em {unexpected_values.sum()} linhas. Exemplos: {df_send_final.loc[unexpected_values, col_qa].unique()[:5].tolist()}",
                                  extra={'data': df_send_final.loc[unexpected_values, ['protocolo', col_qa]].to_dict(orient='records')[:5]})
                    # Considerar um raise SystemExit aqui se a qualidade do dado for crítica

        # Garante que todas as colunas sejam strings para evitar problemas de tipo no GSpread
        for col in df_send_final.columns:
            df_send_final[col] = df_send_final[col].astype(str)
        logging.info("Todas as colunas de df_send_final convertidas para string.")

        df_send = df_send_final.copy() # Atribui o DataFrame final preparado para df_send

except Exception as e:
    logging.critical(f"Erro na preparação final de df_send no Item 8: {e}", exc_info=True)
    raise

# ----------------------------------------------------------
# TRATAMENTO CRÍTICO — DATA DA CONCLUSÃO (APÓS _tratar_full)
# e PADRONIZA OUTRAS DATAS
#
# Com a aplicação de _tratar_full acima, estas funções devem ser menos necessárias.
# Elas são mantidas como um último ajuste de formato para DD/MM/YYYY se _tratar_full
# retornar DD/MM/YY e o GSheet esperar o ano com 4 dígitos.
# ----------------------------------------------------------
def tratar_data_conclusao_item8(x):
    if pd.isna(x) or str(x).strip().lower() in ["", "nan", "na", "n/a", "none", "não concluído"]:
        return "Não concluído"
    try:
        dt = pd.to_datetime(x, errors="coerce", dayfirst=True)
        if pd.notna(dt):
            return dt.strftime("%d/%m/%Y")
        else:
            return "Não concluído"
    except Exception:
        return "Não concluído"

if not df_send.empty and "data_da_conclusao" in df_send.columns:
    df_send["data_da_conclusao"] = df_send["data_da_conclusao"].apply(tratar_data_conclusao_item8)
    logging.debug("Re-aplicado tratamento de 'data_da_conclusao' para garantir formato DD/MM/YYYY.")

def tratar_data_generica_item8_final(x):
    """
    Tratamento final robusto para garantir o formato DD/MM/AAAA para o Sheets,
    lidando com valores que já são strings ou formatos de 2 dígitos.
    """
    s = str(x).strip()
    if s.lower() in ["", "nan", "na", "n/a", "none"]:
        return ""

    # Verifica se já está no formato DD/MM/AAAA. Se sim, mantém como string.
    if re.fullmatch(r"\d{2}/\d{2}/\d{4}", s):
        return s
    
    # 1. Tenta o parsing flexível (mais comum)
    try:
        dt = pd.to_datetime(s, errors="coerce", dayfirst=True)
        if pd.notna(dt):
            return dt.strftime("%d/%m/%Y")
        
        # 2. Se falhou, tenta explicitamente formatos de 2 dígitos que podem ter escapado (DD/MM/AA)
        if re.fullmatch(r"\d{2}/\d{2}/\d{2}", s):
            dt_y = pd.to_datetime(s, format="%d/%m/%y", errors="coerce")
            if pd.notna(dt_y):
                return dt_y.strftime("%d/%m/%Y")
        
        # 3. Tenta formatos ISO (YYYY-MM-DD)
        if re.match(r"^\d{4}-\d{2}-\d{2}", s):
            dt_iso = pd.to_datetime(s, errors="coerce", dayfirst=False)
            if pd.notna(dt_iso):
                return dt_iso.strftime("%d/%m/%Y")
            
        return "" # Se tudo falhou
            
    except Exception:
        return "" # Em caso de erro de parsing

for col in ["data_da_criacao"]:
    if not df_send.empty and col in df_send.columns:
        # Aplica a função de tratamento final (com ano de 4 dígitos)
        df_send[col] = df_send[col].apply(tratar_data_generica_item8_final)
        
        # GARANTE que a coluna FINAL é string (DD/MM/AAAA) para envio sem erro de tipo.
        df_send[col] = df_send[col].astype(str)
        logging.debug(f"Re-aplicado tratamento FINAL de '{col}' para garantir formato DD/MM/AAAA (String).")


# ----------------------------------------------------------
# CHECAGEM DE SANIDADE — UNIDADE_CADASTRO (em df_send já tratado)
# ----------------------------------------------------------
if not df_send.empty and "unidade_cadastro" in df_send.columns:
    nulos_uc = int(df_send["unidade_cadastro"].astype(str).str.strip().isin(['', 'nan', 'none', 'n/a', 'não informado']).sum())
    print(f"🧪 Checagem (NOVOS - PRONTOS PARA ENVIO): unidade_cadastro presente | vazios={nulos_uc}")
    logging.info(f"Checagem (NOVOS - PRONTOS PARA ENVIO): unidade_cadastro presente | vazios={nulos_uc}")
    if nulos_uc > 0:
        logging.warning(f"QA Pré-Envio: 'unidade_cadastro' contém {nulos_uc} valores vazios/inválidos em df_send. Exemplos: {df_send.loc[df_send['unidade_cadastro'].astype(str).str.strip().isin(['', 'nan', 'none', 'n/a', 'não informado']), 'unidade_cadastro'].unique()[:5].tolist()}")
else:
    print("⚠️ Aviso: unidade_cadastro não está em df_send ou df_send está vazio.")
    logging.warning("unidade_cadastro não está em df_send ou df_send está vazio. Verifique a consistência do schema.")

# ----------------------------------------------------------
# ENVIO EM LOTES
# ----------------------------------------------------------
if df_send.empty:
    logging.info("Nenhum protocolo para enviar, pulando envio em lotes.")
    print("📦 Nenhum protocolo para enviar.")
else:
    lote = 500
    total_lotes = (len(df_send) + lote - 1) // lote
    print(f"📦 Envio — APENAS NOVOS (FINAL): {len(df_send)} linhas | {total_lotes} lotes")
    logging.info(f"Envio — APENAS NOVOS (FINAL): {len(df_send)} linhas | {total_lotes} lotes")

    existing_values = aba_tratada.get_all_values()
    sheet_is_empty = len(existing_values) == 0

    for i in range(0, len(df_send), lote):
        chunk = df_send.iloc[i:i+lote].copy()
        rows = chunk.values.tolist()
        first_idx = i + 1
        last_idx = min(i + lote, len(df_send))
        protos_preview = list(chunk.get("protocolo", []))[:3]
        logging.debug(f"Processando lote {first_idx}-{last_idx}. Prévia protocolos: {protos_preview}")
        print(f"   • Enviando {first_idx}-{last_idx} (prévia protocolos: {protos_preview})")

        try:
            if sheet_is_empty:
                header = chunk.columns.tolist()
                aba_tratada.append_rows([header] + rows)
                logging.info(f"Lote {first_idx}-{last_idx} enviado com cabeçalho.")
                sheet_is_empty = False
            else:
                aba_tratada.append_rows(rows)
                logging.info(f"Lote {first_idx}-{last_idx} enviado (sem cabeçalho).")
        except Exception as e:
            logging.exception(f"Erro CRÍTICO ao enviar lote {first_idx}-{last_idx}: {e}")
            print(f"❌ Erro ao enviar lote {first_idx}-{last_idx}: {e}")
            failed = chunk[["protocolo"]].copy()
            timestamp = pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")
            failed.to_csv(f"failed_append_{first_idx}_{last_idx}_{timestamp}.csv", index=False, encoding="utf-8-sig")
            # Dependendo da severidade, você pode querer parar o pipeline aqui.

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

    # 1️⃣ Padroniza status_demanda
    if "status_demanda" in df.columns:
        df["status_demanda"] = df["status_demanda"].apply(
            lambda v: "CONCLUÍDA" if _is_concluida(v)
            else "EM ANDAMENTO" if (v and str(v).strip() != "")
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
    for col in ["tempo_de_resolucao_em_dias"]:
        if col in df.columns:
            df[col] = df[col].replace("Não há dados", "")

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
delta_conc   = df[df["data_da_conclusao"] != df.get("data_da_conclusao_OLD", df["data_da_conclusao"])]
delta_tempo  = df[df["tempo_de_resolucao_em_dias"] != df.get("tempo_de_resolucao_em_dias_OLD", df["tempo_de_resolucao_em_dias"])]

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
    df[value_col] = df[value_col].astype(str).str.strip()

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
            if pd.isna(value) or str(value).strip() == "":
                value = "Não concluído" if value_col == "data_da_conclusao" else ""
            value = str(value).strip()
            cleaned_batch.append((r[0], r[1], value))

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
# 9.1) Delta TEMPO_RESOLUCAO local (0 → 1)
# ========================================================
if "tempo_de_resolucao_em_dias" in df.columns:
    s_local = df["tempo_de_resolucao_em_dias"].astype("object")

    def _fix_zero_keep_text(v):
        if pd.isna(v):
            return v
        sv = str(v).strip()
        try:
            num = pd.to_numeric(sv, errors="coerce")
            if pd.notna(num) and float(num) == 0.0:
                return "1"
        except Exception:
            pass
        return sv

    df["tempo_de_resolucao_em_dias"] = s_local.map(_fix_zero_keep_text)

# ========================================================
# 10) DELTAS HISTÓRICOS (status_demanda, data_da_conclusao, tempo_de_resolucao_em_dias)
# ========================================================

_BANNER("10) DELTAS HISTÓRICOS (ajustado para novos protocolos)")

# --- Alinha colunas do df_send ao schema da tratada ---
try:
    cols_tratada = list(df_tratada.columns)
    # df_send pode não existir (caso nenhum novo); garante variável
    if 'df_send' not in globals():
        df_send = pd.DataFrame(columns=cols_tratada)
    df_send_aligned = df_send.reindex(columns=cols_tratada, fill_value="")
    df_full = pd.concat([df_tratada, df_send_aligned], ignore_index=True, sort=False)
except Exception as e:
    logging.warning(f"Falha ao concatenar bases tratada + novos: {e}")
    # fallback simples: tenta usar df_send como fonte
    df_full = df_send.copy()

# --- Garante existência das colunas *_OLD para comparações de histórico ---
for col in ["status_demanda", "data_da_conclusao", "tempo_de_resolucao_em_dias"]:
    old_col = f"{col}_OLD"
    if old_col not in df_full.columns:
        # copia o valor atual para coluna OLD (se não existir), normalizando nulos
        df_full[old_col] = df_full.get(col, "").fillna("")

# --- Função delta robusta (com fillna e casting a str) ---
def _delta_df(df_full_local: pd.DataFrame, col: str) -> pd.DataFrame:
    old_col = f"{col}_OLD"
    if old_col in df_full_local.columns:
        left = df_full_local.get(col, "").fillna("").astype(str)
        right = df_full_local.get(old_col, "").fillna("").astype(str)
        return df_full_local[left != right].copy()
    else:
        # se não há coluna OLD, considera apenas os recém marcados como 'eh_novo'
        return df_full_local[df_full_local.get("eh_novo", False) == True].copy()

# --- Calcula deltas específicos (apenas uma vez e sem sobrescritas) ---
delta_status = _delta_df(df_full, "status_demanda")
delta_conc   = _delta_df(df_full, "data_da_conclusao")
delta_tempo  = _delta_df(df_full, "tempo_de_resolucao_em_dias")

# --- Logs e verificações ---
logging.info(f"Delta STATUS: {len(delta_status)} linhas alteradas/novas")
logging.info(f"Delta DATA_CONCLUSAO: {len(delta_conc)} linhas alteradas/novas")
logging.info(f"Delta TEMPO_DE_RESOLUCAO: {len(delta_tempo)} linhas alteradas/novas")

print(f"📊 Deltas calculados com sucesso:")
print(f"   • STATUS: {len(delta_status)}")
print(f"   • DATA_CONCLUSAO: {len(delta_conc)}")
print(f"   • TEMPO_DE_RESOLUCAO: {len(delta_tempo)}")

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
