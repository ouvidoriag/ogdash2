# ========================================================
# =================== PARTE 1: ITENS 1-6 =================
# ========================================================

import os
import pandas as pd
import unicodedata
import re
import requests
import json
import gspread
import numpy as np
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
    level=logging.INFO,
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
# 1) CONFIGURAÇÃO GOOGLE DRIVE / SHEETS
# ========================================================
_BANNER("1) CONFIGURAÇÃO GOOGLE DRIVE/SHEETS")

CAMINHO_CREDENCIAIS = "./credentials.json"

PASTA_BRUTA_ID = "1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5"
PASTA_TRATADA_ID = "10mW1LPrjsGRPYSWLMAF7tKgQbufLgDie"
NOME_PLANILHA_TRATADA = "Dashboard_Duque_de_Caxias_Ouvidoria_Duque_de_Caxias_Tabela"

SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets"
]

try:
    creds = Credentials.from_service_account_file(CAMINHO_CREDENCIAIS, scopes=SCOPES)
    drive_service = build("drive", "v3", credentials=creds)
    gc = gspread.authorize(creds)
    print("✅ Autenticação Google OK.")
    logging.info("Autenticação Google OK")
except Exception as e:
    logging.exception("Falha na autenticação Google. Verifique CAMINHO_CREDENCIAIS.")
    raise

# ========================================================
# 2) LEITURA — ÚLTIMA PLANILHA BRUTA DO DRIVE
# ========================================================
_BANNER("2) LEITURA DA PLANILHA BRUTA (GOOGLE DRIVE)")

query = f"'{PASTA_BRUTA_ID}' in parents and mimeType='application/vnd.google-apps.spreadsheet'"

try:
    arquivos = drive_service.files().list(
        q=query, spaces="drive",
        fields="files(id, name, createdTime)",
        orderBy="createdTime desc", pageSize=1
    ).execute().get("files", [])
except Exception as e:
    logging.exception("Erro ao listar arquivos no Drive.")
    raise

if not arquivos:
    raise FileNotFoundError(f"Nenhuma planilha na pasta {PASTA_BRUTA_ID}.")
sheet_id = arquivos[0]["id"]
print(f"📂 Última planilha encontrada: {arquivos[0]['name']}")
logging.info(f"Última planilha encontrada: {arquivos[0]['name']} ({sheet_id})")

try:
    sh = gc.open_by_key(sheet_id)
    df = pd.DataFrame(sh.sheet1.get_all_records())
    print(f"✅ Planilha bruta importada com sucesso: {df.shape}")
    logging.info(f"Planilha bruta importada com sucesso: {df.shape}")
except Exception as e:
    logging.exception("Erro ao abrir planilha por key com gspread.")
    raise

# ========================================================
# 3) NORMALIZAÇÃO DE NOMES DE COLUNA
# ========================================================
_BANNER("3) NORMALIZAÇÃO DE NOMES DE COLUNA")

def normalizar_nome_coluna(col: str) -> str:
    if col is None:
        return ""
    col = unicodedata.normalize("NFKD", str(col)).encode("ASCII", "ignore").decode("utf-8")
    col = col.lower()
    col = re.sub(r"[^a-z0-9]+", "_", col)
    return re.sub(r"_+", "_", col).strip("_")

df.columns = [normalizar_nome_coluna(c) for c in df.columns]
print("✅ Cabeçalhos normalizados:", list(df.columns))
logging.info(f"Cabeçalhos normalizados: {list(df.columns)}")

# ========================================================
# 4) FUNÇÕES AUXILIARES (codificação / datas / post em lotes)
# ========================================================
_BANNER("4) AUXILIARES (codificação, datas, lotes)")

def _canon_txt(x):
    if x is None: return ""
    s = str(x)
    if s == "": return s
    s = s.replace("\u00A0", " ").replace("&nbsp;", " ")
    s = re.sub(r"[\u2000-\u200A\u202F\u205F\u3000]", " ", s)
    s = re.sub(r"[\u200B-\u200D\u2060\uFEFF]", "", s)

    def _try_fix(t, enc):
        try: return t.encode(enc).decode("utf-8")
        except: return t

    if ("Ã" in s) or ("Â" in s) or ("�" in s):
        cand = max([s, _try_fix(s, "latin-1"), _try_fix(s, "cp1252")],
                   key=lambda txt: (-(txt.count("Ã")+txt.count("Â")+txt.count("�")),
                                    sum(ch in "áéíóúâêôãõàçÁÉÍÓÚÂÊÔÃÕÀÇ" for ch in txt)))
        s = cand

    s = re.sub(r"Sa\?\?de", "Saúde", s, flags=re.IGNORECASE)
    s = re.sub(r"Sa[\ufffd�]de", "Saúde", s, flags=re.IGNORECASE)

    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def _canon_responsavel_series(series: pd.Series) -> pd.Series:
    base = pd.Series(series, dtype="object").apply(_canon_txt)
    patt_ouvidoria_saude = r"(?i)^ouvidoria setorial da sa(?:u|Ãº|\\u00fa|\?\?|[\ufffd�])?de$"
    return base.str.strip().replace({
        patt_ouvidoria_saude: "Ouvidoria Setorial da Saúde",
        r"(?i)^cidad(?:\u00e3|ã)o$": "Cidadão",
    }, regex=True)

def _to_ddmmaa_text(series: pd.Series) -> pd.Series:
    EXCEL_BASE = pd.Timestamp("1899-12-30")
    def _one(v):
        if pd.isna(v): return None
        if isinstance(v, (pd.Timestamp, np.datetime64)):
            dt = pd.to_datetime(v, errors="coerce")
            return dt.strftime("%d/%m/%y") if pd.notna(dt) else None
        s = str(v).strip()
        if s == "": return None
        s2 = s.replace("T", " ").replace("Z", "")
        s2 = re.sub(r"([+-]\d{2}:?\d{2}|[+-]\d{2}| UTC)$", "", s2).strip()
        if re.match(r"^\d{4}-\d{2}-\d{2}", s2):
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                dt = pd.to_datetime(s2, errors="coerce", dayfirst=False)
            return dt.strftime("%d/%m/%y") if pd.notna(dt) else s
        if re.fullmatch(r"\d{5,6}(\.\d+)?", s2):
            try: return (EXCEL_BASE + pd.to_timedelta(float(s2), "D")).strftime("%d/%m/%y")
            except: pass
        if re.fullmatch(r"\d{13}", s2):
            dt = pd.to_datetime(int(s2), unit="ms", errors="coerce")
            return dt.strftime("%d/%m/%y") if pd.notna(dt) else s
        if re.fullmatch(r"\d{10}(\.\d+)?", s2):
            dt = pd.to_datetime(float(s2), unit="s", errors="coerce")
            return dt.strftime("%d/%m/%y") if pd.notna(dt) else s
        for fmt in ["%d/%m/%Y %H:%M:%S","%d/%m/%Y %H:%M","%d/%m/%Y",
                    "%d/%m/%y %H:%M:%S","%d/%m/%y %H:%M","%d/%m/%y",
                    "%Y-%m-%d %H:%M:%S","%Y-%m-%d %H:%M","%Y-%m-%d"]:
            try: return pd.to_datetime(s2, format=fmt).strftime("%d/%m/%y")
            except: pass
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            dt = pd.to_datetime(s2, dayfirst=True, errors="coerce")
        return dt.strftime("%d/%m/%y") if pd.notna(dt) else s
    return series.apply(_one).astype("object")

def _conclusao_strict(series: pd.Series) -> pd.Series:
    s = pd.Series(series, dtype="object").astype(str).str.strip()
    s_cf = s.str.casefold()
    invalid = {"não informado","na","n/a","n\\a","nan","null","none","","-","--",
               "outro","outros","nat","sem informação","sem informacao"}
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
            out.loc[good_idx] = dt.loc[good_idx].dt.strftime("%d/%m/%y")
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
        for fmt in ["%d/%m/%Y %H:%M:%S","%d/%m/%Y %H:%M","%d/%m/%Y",
                    "%d/%m/%y %H:%M:%S","%d/%m/%y %H:%M","%d/%m/%y",
                    "%Y-%m-%d %H:%M:%S","%Y-%m-%d %H:%M","%Y-%m-%d"]:
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
    s = "".join(ch for ch in unicodedata.normalize("NFD", s) if unicodedata.category(ch) != "Mn")
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

# ========================================================
# 4.5) CRIAÇÃO DO DF_UPSERT
# ========================================================
df_upsert = df.copy()
df_upsert["protocolo"] = df_upsert["protocolo"].astype(str).str.strip()

# =============================================
# 5) COLETA DE PROTOCOLOS EXISTENTES NA PLANILHA TRATADA
# =============================================
_BANNER("5) COLETA DE PROTOCOLOS EXISTENTES NA PLANILHA TRATADA")

# Abre a planilha tratada (já no fluxo local)
try:
    planilha_tratada = gc.open_by_key("1GB1Bf9p81X4MpR1TFoO2T55lnSr2wfJeKrU5LnuOFlk")
    aba_tratada = planilha_tratada.sheet1
    df_tratada = pd.DataFrame(aba_tratada.get_all_records())
    df_tratada["protocolo"] = df_tratada["protocolo"].astype(str).str.strip()
    protocolos_existentes = set(df_tratada["protocolo"].tolist())
    print(f"🔑 Protocolos já na planilha tratada: {len(protocolos_existentes)}")
    logging.info(f"Protocolos já na planilha tratada: {len(protocolos_existentes)}")
except Exception as e:
    print(f"⚠️ Não foi possível carregar a planilha tratada: {e}")
    logging.warning(f"Não foi possível carregar a planilha tratada: {e}")
    df_tratada = pd.DataFrame()
    protocolos_existentes = set()

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

def _tratar_full(df_in: pd.DataFrame) -> pd.DataFrame:
    df_loc = df_in.copy()

    # 7.1 Tema/Assunto — mantém 'não se aplica' → 'Assédio'
    if "tema" in df_loc.columns and "assunto" in df_loc.columns:
        tema_tmp = df_loc["tema"].astype(str).str.strip().str.casefold()
        assunto_tmp = df_loc["assunto"].astype(str).str.strip().str.casefold()
        valores_assunto = ["outro", "outros", "na", "n/a", "n\\a", ""]
        cond_42 = (tema_tmp == "não se aplica") & (assunto_tmp.isin(valores_assunto))
        if int(cond_42.sum()):
            df_loc.loc[cond_42, "assunto"] = "Assédio"
        cond_41 = (tema_tmp == "não se aplica")
        if int(cond_41.sum()):
            df_loc.loc[cond_41, "tema"] = "Assédio"

    # 7.2 Data da conclusão → texto "DD/MM/AA" ou "Não concluído"
    if "data_da_conclusao" in df_loc.columns:
        df_loc["data_da_conclusao"] = _conclusao_strict(df_loc["data_da_conclusao"])
        df_loc["data_da_conclusao"] = df_loc["data_da_conclusao"].apply(
            lambda x: x if pd.notna(x) and str(x).strip().lower() not in ["na", "nan", "n/a", ""] else "Não concluído"
        )

    # 7.3 Unidades de saúde (capitaliza e trata “sem informação”)
    for col in df_loc.columns:
        if "unidade" in col and "saude" in col:
            df_loc[col] = (
                df_loc[col].astype(str).str.strip().str.lower()
                .replace("sem informação", "Não é uma Unidade de Saúde")
                .str.capitalize()
            )

    # 7.4 Órgãos por tema — MATCH EXATO, fallback apenas se TEMA vazio
    import unicodedata as _ud, re as _re
    def _norm(s):
        if pd.isna(s): return ""
        s = str(s).strip().lower()
        s = _ud.normalize("NFD", s)
        s = "".join(ch for ch in s if _ud.category(ch) != "Mn")
        return _re.sub(r"\s+", " ", s)

    def _div_temas(v, seps=(",", ";", "|", "/")):
        if pd.isna(v): return []
        t = str(v)
        for s in seps: t = t.replace(s, ",")
        partes = [p.strip() for p in t.split(",") if p.strip()]
        return partes if partes else [str(v).strip()]

    map_tema_para_orgao = {
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
    map_tema_para_orgao = {k: _canon_txt(v) for k, v in map_tema_para_orgao.items()}
    map_exact = { _norm(k): v for k, v in map_tema_para_orgao.items() }

    def mapear_orgao_exato(celula_tema):
        orgs = []
        for t in _div_temas(celula_tema):
            t_norm = _norm(t)
            if not t_norm:
                continue
            if t_norm in map_exact:
                orgs.append(map_exact[t_norm])
        return " | ".join(dict.fromkeys(o.strip() for o in orgs if o and str(o).strip())) or None

    if "tema" in df_loc.columns:
        df_loc["orgaos"] = df_loc["tema"].apply(mapear_orgao_exato)

        def _canon_orgaos(cell):
            if cell is None or str(cell).strip() == "":
                return cell
            partes = [p.strip() for p in str(cell).split("|")]
            partes = [_canon_txt(p) for p in partes if p]
            return " | ".join(dict.fromkeys(partes))

        df_loc["orgaos"] = df_loc["orgaos"].apply(_canon_orgaos)

        mask_tema_vazio = df_loc["tema"].isna() | (df_loc["tema"].astype(str).str.strip() == "")
        mask_org_vazio  = df_loc["orgaos"].isna() | (df_loc["orgaos"].astype(str).str.strip() == "")
        df_loc.loc[mask_tema_vazio & mask_org_vazio, "orgaos"] = "Secretaria Municipal de Comunicação e Relações Públicas"

    # 7.5 Padronização 'servidor' (dicionário completo)
    dicionario_servidor = {
        "Camila do Lago Marins": "Camila Marins",
        "Camila Marins": "Camila Marins",
        "Dhayane Cristina Pinho de Almeida": "Dhayane Cristina Pinho de Almeida",
        "Dhayane Pinho": "Dhayane Cristina Pinho de Almeida",
        "Joana Darc Salles Ferreira": "Joana Darc Salles Ferreira",
        "Joana Salles": "Joana Darc Salles Ferreira",
        "Lucia Helena Tinoco Pacehco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia Helena Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia  Helena Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lúcia  Helena Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lúcia Helena Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia Helenba Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Rafaella Marques Gomes Santos": "Rafaella Marques Gomes Santos",
        "Roilene Pereira da Silva": "Rosilene Pereira da Silva",
        "Rosilene Pereira da Silva": "Rosilene Pereira da Silva",
        "Stephanie dos Santos Silva": "Stephanie dos Santos Silva",
        "Stephanie Santos": "Stephanie dos Santos Silva",
        "Stéphanie Santos": "Stephanie dos Santos Silva",
        "Stéphaniesantos": "Stephanie dos Santos Silva",
        "Stpehanie Santos": "Stephanie dos Santos Silva",
        "Anne Beatriz da Silva": "Anne Beatriz da Silva Rodrigues",
        "Bruna Maria ( Coordenadora)": "Cidadão",
        "Isabel": "Cidadão",
        "Gabriela da Silva Rozi": "Cidadão",
        "Lana Carolina Mesquita de Andrade": "Cidadão",
        "Lívia Cavalcante": "Lívia Kathleen Cavalcante Patriota Leite",
        "Lívia Kathleen Cavalcante Patriota Leite": "Lívia Kathleen Cavalcante Patriota Leite",
        "Lucia Helena": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia Helena Tinoco": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia Helena Tinoco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia Helen Tinoco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia Helan Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia Helena  Tinoco Pacheco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Lucia Helena Tinoco Pachewco Varella": "Lúcia Helena Tinoco Pacheco Varella",
        "Mery": "Cidadão",
        "Ouvidoria Geral (Adm)": "Cidadão",
        "Rafaella Marques": "Rafaella Marques Gomes Santos",
        "Ronaldo de Oliveira Brandão": "Cidadão",
        "Séphanie Santos": "Stephanie dos Santos Silva",
        "Shirley Santana": "Cidadão",
        "Stépanie Santos": "Stephanie dos Santos Silva",
        "Stéphanie  Santos": "Stephanie dos Santos Silva",
        "Stéphanie Santos": "Stephanie dos Santos Silva",
        "Stephanie dos Santos": "Stephanie dos Santos Silva",
        "Stéphanie Santoa": "Stephanie dos Santos Silva",
        "Stephanie Santos": "Stephanie dos Santos Silva",
        "Stephanie dos Santos": "Stephanie dos Santos Silva",
        "Stephanie Santos": "Stephanie dos Santos Silva",
        "Thamires Manhães": "Cidadão"
    }
    if "servidor" in df_loc.columns:
        _orig = df_loc["servidor"].astype(str).str.strip()
        df_loc["servidor"] = _orig.map(dicionario_servidor).fillna(_orig)

    # 7.6 Responsável (normalização)
    if "responsavel" in df_loc.columns:
        df_loc["responsavel"] = _canon_responsavel_series(df_loc["responsavel"])

    # 7.7 Datas e tipos
    if "data_da_criacao" in df_loc.columns:
        df_loc["data_da_criacao"] = _to_ddmmaa_text(df_loc["data_da_criacao"]).astype(str)
    if "status_demanda" in df_loc.columns:
        df_loc["status_demanda"] = df_loc["status_demanda"].astype(str)
    if "data_da_conclusao" in df_loc.columns:
        df_loc["data_da_conclusao"] = _conclusao_strict(df_loc["data_da_conclusao"])

    # 7.8 Regra de ouro: se CONCLUÍDA => 'prazo_restante' = 'Demanda Concluída'
    if "status_demanda" in df_loc.columns and "prazo_restante" in df_loc.columns:
        mask_conc = df_loc["status_demanda"].map(_is_concluida)
        df_loc.loc[mask_conc, "prazo_restante"] = "Demanda Concluída"

    return df_loc


# ========================================================
# 8) ATUALIZAÇÃO NA PLANILHA TRATADA — APENAS NOVOS (CORRIGIDO)
# ========================================================
_BANNER("8) ATUALIZAÇÃO NA PLANILHA TRATADA — APENAS NOVOS")

try:
    import gspread
    from google.oauth2.service_account import Credentials

    if 'client' not in globals():
        scope = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]
        creds = Credentials.from_service_account_file("credentials.json", scopes=scope)
        client = gspread.authorize(creds)
except Exception as e:
    raise SystemExit(f"❌ Não foi possível autenticar o client do Google Sheets: {e}")

# ----------------------------------------------------------
# ABRE A PLANILHA TRATADA NO GOOGLE SHEETS
# ----------------------------------------------------------
try:
    planilha_tratada = client.open_by_key("1GB1Bf9p81X4MpR1TFoO2T55lnSr2wfJeKrU5LnuOFlk")
    aba_tratada = planilha_tratada.sheet1
except Exception as e:
    raise SystemExit(f"❌ Não foi possível abrir a planilha tratada: {e}")

# ----------------------------------------------------------
# CONVERTE A PLANILHA EXISTENTE EM DATAFRAME
# ----------------------------------------------------------
df_tratada = pd.DataFrame(aba_tratada.get_all_records())
df_tratada.columns = df_tratada.columns.str.strip().str.lower()

# Padroniza a coluna protocolo
if "protocolo" in df_tratada.columns:
    df_tratada["protocolo"] = df_tratada["protocolo"].astype(str).str.strip()
    protocolos_existentes = set(df_tratada["protocolo"])
else:
    protocolos_existentes = set()
    logging.warning("⚠️ Coluna 'protocolo' não encontrada na planilha tratada!")

# ----------------------------------------------------------
# FILTRA APENAS OS PROTOCOLOS NOVOS
# ----------------------------------------------------------
df_send = df_upsert[~df_upsert["protocolo"].isin(protocolos_existentes)].copy()

# --- Garantir tratamento consistente em toda a base antes do envio ---
# Aplica o tratamento full (item 7) ao df_upsert e/ou somente aos novos (df_send)
# Recomendo aplicar em df_upsert para consistência global:
try:
    df_upsert = _tratar_full(df_upsert)
except Exception as e:
    logging.exception("Falha ao aplicar _tratar_full em df_upsert: %s", e)

# Agora (se você preferir aplicar apenas aos novos), aplique também a df_send:
df_send = df_upsert[~df_upsert["protocolo"].isin(protocolos_existentes)].copy()
# reforço: df_send já vem tratado, mas garanta:
df_send = _tratar_full(df_send)

print(f"📦 Atualizando planilha tratada: {len(df_send)} linhas | "
      f"{(len(df_send) + 500 - 1) // 500} lotes")
logging.info(f"Atualizando planilha tratada: {len(df_send)} linhas | "
             f"{(len(df_send) + 500 - 1) // 500} lotes")

# ----------------------------------------------------------
# 🔧 TRATAMENTO CRÍTICO — DATA DA CONCLUSÃO
# ----------------------------------------------------------
# Função para padronizar datas e preencher "Não concluído" se inválida
def tratar_data_conclusao(x):
    if pd.isna(x) or str(x).strip().lower() in ["", "nan", "na", "n/a", "none"]:
        return "Não concluído"
    try:
        return pd.to_datetime(x, errors="coerce").strftime("%d/%m/%Y")
    except Exception:
        return "Não concluído"

if "data_da_conclusao" in df_send.columns:
    df_send["data_da_conclusao"] = df_send["data_da_conclusao"].apply(tratar_data_conclusao)
else:
    logging.warning("⚠️ Coluna 'data_da_conclusao' não está presente em df_send!")

# ----------------------------------------------------------
# PADRONIZA OUTRAS DATAS (DD/MM/AAAA)
# ----------------------------------------------------------
def tratar_data_generica(x):
    try:
        if pd.isna(x) or str(x).strip().lower() in ["", "nan", "na", "n/a"]:
            return ""
        return pd.to_datetime(x, errors="coerce").strftime("%d/%m/%Y")
    except Exception:
        return ""

for col in ["data_da_criacao"]:
    if col in df_send.columns:
        df_send[col] = df_send[col].apply(tratar_data_generica)

# ----------------------------------------------------------
# CHECAGEM DE SANIDADE — UNIDADE_CADASTRO
# ----------------------------------------------------------
if "unidade_cadastro" in df_send.columns:
    nulos_uc = int(df_send["unidade_cadastro"].isna().sum())
    print(f"🧪 Checagem (NOVOS): unidade_cadastro presente | nulos={nulos_uc}")
    logging.info(f"Checagem (NOVOS): unidade_cadastro presente | nulos={nulos_uc}")
else:
    print("⚠️ Aviso: unidade_cadastro não está em df_send (verifique colunas)")
    logging.warning("unidade_cadastro não está em df_send (verifique colunas)")

# ----------------------------------------------------------
# ENVIO EM LOTES PARA EVITAR LIMITE DE REQUISIÇÕES
# ----------------------------------------------------------
lote = 500
total_lotes = (len(df_send) + lote - 1) // lote
print(f"📦 Envio — APENAS NOVOS: {len(df_send)} linhas | {total_lotes} lotes")
logging.info(f"Envio — APENAS NOVOS: {len(df_send)} linhas | {total_lotes} lotes")

for i in range(0, len(df_send), lote):
    chunk = df_send.iloc[i:i+lote].copy()   # já foi tratado por _tratar_full

    # Garante que todos os vazios ou NaN em 'data_da_conclusao' sejam marcados como 'Não concluída'
    if "data_da_conclusao" in chunk.columns:
        chunk["data_da_conclusao"] = (
            chunk["data_da_conclusao"]
            .astype(str)
            .str.strip()
            .replace(["nan", "NaT", "", "None"], "Não concluída")
        )
    # Garantir que não existam valores nulos em outras colunas -> substitui por ""
    chunk = chunk.fillna("")   # OK: "Não concluído" é string, não é NaN, não será sobrescrito
    values = [chunk.columns.tolist()] + chunk.values.tolist()  # inclui cabeçalho
    first_idx = i + 1
    last_idx = min(i + lote, len(df_send))
    protos_preview = list(chunk.get("protocolo", []))[:3]
    print(f"   • Enviando {first_idx}-{last_idx} (prévia protocolos: {protos_preview})")
    logging.info(f"Enviando {first_idx}-{last_idx} (prévia protocolos: {protos_preview})")

    try:
        # Envia o bloco inteiro com batch_update, logo após o último registro
        cell_range = f"A{len(df_tratada) + 2 + i}"
        aba_tratada.update(cell_range, values)
    except Exception as e:
        logging.exception(f"Erro ao enviar lote {first_idx}-{last_idx} para planilha tratada: {e}")
        print(f"❌ Erro ao enviar lote {first_idx}-{last_idx}: {e}")

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
# 9.2) Correção pontual servidor (Raphael)
# ========================================================
if "protocolo" in df.columns and "servidor" in df.columns:
    protos_raphael = (
        df.loc[df["servidor"].astype(str).str.strip() == "Raphael Pereira de Mello", "protocolo"]
          .astype(str).str.strip().unique().tolist()
    )
    if protos_raphael:
        df_fix = pd.DataFrame({
            "protocolo": protos_raphael,
            "servidor": "Raphael Pereira de Mello"
        })
        _patch_grouped_force(df_fix, "protocolo", "servidor", aba_tratada)
    else:
        logging.info("Nenhum protocolo local com 'Raphael Pereira de Mello' encontrado.")

# ========================================================
# 10) DELTAS HISTÓRICOS (status_demanda, data_da_conclusao, tempo_de_resolucao_em_dias)
# ========================================================
_BANNER("10) DELTAS HISTÓRICOS")

# Compara colunas *_OLD para atualização seletiva
delta_status = df[df["status_demanda"] != df.get("status_demanda_OLD", df["status_demanda"])]
delta_conc   = df[df["data_da_conclusao"] != df.get("data_da_conclusao_OLD", df["data_da_conclusao"])]
delta_tempo  = df[df["tempo_de_resolucao_em_dias"] != df.get("tempo_de_resolucao_em_dias_OLD", df["tempo_de_resolucao_em_dias"])]

logging.info(f"Delta STATUS: {len(delta_status)} linhas")
logging.info(f"Delta DATA_CONCLUSAO: {len(delta_conc)} linhas")
logging.info(f"Delta TEMPO_DE_RESOLUCAO: {len(delta_tempo)} linhas")

_patch_grouped_force(delta_status, "protocolo", "status_demanda", aba_tratada)
_patch_grouped_force(delta_conc, "protocolo", "data_da_conclusao", aba_tratada)
_patch_grouped_force(delta_tempo, "protocolo", "tempo_de_resolucao_em_dias", aba_tratada)

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
