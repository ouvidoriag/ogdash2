# ----------------------------
# Logging (adicionado, não remove prints)
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

CAMINHO_CREDENCIAIS = "/home/niltonjunio/meuprojeto/ouvidoria-tratamento-dados.json"

# Pasta da planilha bruta (entrada)
PASTA_BRUTA_ID = "1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5"
# Pasta da planilha tratada (saída)
PASTA_TRATADA_ID = "10mW1LPrjsGRPYSWLMAF7tKgQbufLgDie"
# Nome da planilha tratada (mesmo nome da bruta)
NOME_PLANILHA_TRATADA = "Dashboard_Duque_de_Caxias_Ouvidoria_Duque_de_Caxias_Tabela"

SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets"
]

# Autenticação - tentarei falhar claramente se não encontrar credenciais
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

# Abrir com gspread (mantém seu fluxo original)
try:
    sh = gc.open_by_key(sheet_id)
    # usa sheet1 como no seu script original
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
    # função original preservada, com levemente mais segura contra None
    if col is None:
        return ""
    col = unicodedata.normalize("NFKD", str(col)).encode("ASCII", "ignore").decode("utf-8")
    col = col.lower()
    col = re.sub(r"[^a-z0-9]+", "_", col)
    return re.sub(r"_+", "_", col).strip("_")

# aplica conforme original
df.columns = [normalizar_nome_coluna(c) for c in df.columns]
print("✅ Cabeçalhos normalizados:", list(df.columns))
logging.info(f"Cabeçalhos normalizados: {list(df.columns)}")

# ========================================================
# 4) FUNÇÕES AUXILIARES (codificação / datas / post em lotes)
# ========================================================
_BANNER("5) AUXILIARES (codificação, datas, lotes)")

# --- _canon_txt (mantido integralmente) ---
def _canon_txt(x):
    if x is None:
        return ""
    s = str(x)
    if s == "":
        return s
    s = s.replace("\u00A0", " ").replace("&nbsp;", " ")
    s = re.sub(r"[\u2000-\u200A\u202F\u205F\u3000]", " ", s)
    s = re.sub(r"[\u200B-\u200D\u2060\uFEFF]", "", s)

    def _try_fix(t, enc):
        try:    return t.encode(enc).decode("utf-8")
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

# --- _canon_responsavel_series (mantido) ---
def _canon_responsavel_series(series: pd.Series) -> pd.Series:
    base = pd.Series(series, dtype="object").apply(_canon_txt)
    patt_ouvidoria_saude = r"(?i)^ouvidoria setorial da sa(?:u|Ãº|\\u00fa|\?\?|[\ufffd�])?de$"
    return base.str.strip().replace({
        patt_ouvidoria_saude: "Ouvidoria Setorial da Saúde",
        r"(?i)^cidad(?:\u00e3|ã)o$": "Cidadão",
    }, regex=True)

# --- _to_ddmmaa_text (mantido) ---
def _to_ddmmaa_text(series: pd.Series) -> pd.Series:
    EXCEL_BASE = pd.Timestamp("1899-12-30")
    def _one(v):
        if pd.isna(v):
            return None
        if isinstance(v, (pd.Timestamp, np.datetime64)):
            dt = pd.to_datetime(v, errors="coerce")
            return dt.strftime("%d/%m/%y") if pd.notna(dt) else None
        s = str(v).strip()
        if s == "":
            return None
        # normaliza separadores e sufixos
        s2 = s.replace("T", " ").replace("Z", "")
        s2 = re.sub(r"([+-]\d{2}:?\d{2}|[+-]\d{2}| UTC)$", "", s2).strip()

        # 1) ISO (YYYY-MM-DD...) -> força dayfirst=False (cobre milissegundos)
        if re.match(r"^\d{4}-\d{2}-\d{2}", s2):
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                dt = pd.to_datetime(s2, errors="coerce", dayfirst=False)
            return dt.strftime("%d/%m/%y") if pd.notna(dt) else s

        # 2) Excel serial
        if re.fullmatch(r"\d{5,6}(\.\d+)?", s2):
            try:
                return (EXCEL_BASE + pd.to_timedelta(float(s2), "D")).strftime("%d/%m/%y")
            except:
                pass

        # 3) epoch ms
        if re.fullmatch(r"\d{13}", s2):
            dt = pd.to_datetime(int(s2), unit="ms", errors="coerce")
            return dt.strftime("%d/%m/%y") if pd.notna(dt) else s

        # 4) epoch s
        if re.fullmatch(r"\d{10}(\.\d+)?", s2):
            dt = pd.to_datetime(float(s2), unit="s", errors="coerce")
            return dt.strftime("%d/%m/%y") if pd.notna(dt) else s

        # 5) formatos explícitos (mantidos)
        for fmt in [
            "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y",
            "%d/%m/%y %H:%M:%S", "%d/%m/%y %H:%M", "%d/%m/%y",
            "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"
        ]:
            try:
                return pd.to_datetime(s2, format=fmt).strftime("%d/%m/%y")
            except:
                pass

        # 6) fallback BR (dia primeiro)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            dt = pd.to_datetime(s2, dayfirst=True, errors="coerce")
        return dt.strftime("%d/%m/%y") if pd.notna(dt) else s
    return series.apply(_one).astype("object")

# --- _conclusao_strict (mantido) ---
def _conclusao_strict(series: pd.Series) -> pd.Series:
    s = pd.Series(series, dtype="object").astype(str).str.strip()
    s_cf = s.str.casefold()
    invalid = {
        "não informado","na","n/a","n\\a","nan","null","none","","-","--",
        "outro","outros","nat","sem informação","sem informacao"
    }
    out = s.copy()
    mask_invalid = s_cf.isin(invalid)
    out.loc[mask_invalid] = "Não concluído"

    rest_idx = out.index[~mask_invalid]
    if len(rest_idx) > 0:
        s_rest = s.loc[rest_idx]
        # normaliza separadores/sufixos para checar prefixo ISO
        s_norm = s_rest.str.replace("T", " ").str.replace("Z", "", regex=False)
        s_norm = s_norm.str.replace(r"([+-]\d{2}:?\d{2}|[+-]\d{2}| UTC)$", "", regex=True).str.strip()
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

# --- _parse_dt_cmp (mantido) ---
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

# <<< NOVO HELPER: detectar "Não há dados" >>>
def _is_nao_ha_dados(v) -> bool:
    if v is None:
        return False
    s = str(v).strip()
    if s == "":
        return False
    # remove acentos e normaliza
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"\s+", " ", s).strip().casefold()
    return s == "nao ha dados"
# >>> FIM NOVO HELPER

# <<< PATCH: helper p/ detectar 'Concluída'
def _is_concluida(v) -> bool:
    if pd.isna(v):
        return False
    s = str(v).strip()
    if s == "":
        return False
    s = "".join(ch for ch in unicodedata.normalize("NFD", s) if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^A-Za-z]+", " ", s).strip().casefold()
    return s == "concluida"
# >>> PATCH

# Helpers p/ 'Demanda Concluída'
def _looks_like_demanda_concluida(v) -> bool:
    if pd.isna(v):
        return False
    s = str(v).strip()
    if s == "":
        return False
    s = "".join(ch for ch in unicodedata.normalize("NFD", s) if unicodedata.category(ch) != "Mn")
    s = s.replace("�", "i").replace("?", "i")
    s = re.sub(r"i{2,}", "i", s, flags=re.IGNORECASE)
    s = re.sub(r"[^A-Za-z]+", " ", s).strip().casefold()
    return s == "demanda concluida"

def _canon_prazo_restante(v):
    if pd.isna(v):
        return v
    if isinstance(v, (int, float)) and not pd.isna(v):
        return v
    s = _canon_txt(v)
    if s == "":
        return s
    s_clean = s.strip()
    if _looks_like_demanda_concluida(s_clean):
        return "Demanda Concluída"
    return s_clean

def _post_lotes(df_send: pd.DataFrame, titulo: str, cols_allowed, prefer: str = "return=minimal", lote: int = 500):
    if df_send.empty:
        print(f"📦 {titulo}: 0 linhas (skip).")
        logging.info(f"{titulo}: 0 linhas (skip).")
        return
    df_send = df_send[[c for c in df_send.columns if c in cols_allowed]].copy()
    if "protocolo" in df_send.columns:
        df_send["protocolo"] = df_send["protocolo"].astype(str).str.strip()
    total_lotes = (len(df_send) + lote - 1) // lote
    print(f"📦 {titulo}: {len(df_send)} linhas | {total_lotes} lotes")
    logging.info(f"{titulo}: {len(df_send)} linhas | {total_lotes} lotes")
    for i in range(0, len(df_send), lote):
        chunk = df_send.iloc[i:i+lote].replace({np.nan: None})
        payload = chunk.to_dict(orient="records")
        data_utf8 = json.dumps(payload, ensure_ascii=False)
        first_idx = i + 1
        last_idx  = min(i + lote, len(df_send))
        protos_preview = list(chunk.get("protocolo", []))[:3]
        print(f"   • Enviando {first_idx}-{last_idx} (prévia protocolos: {protos_preview})")
        logging.info(f"Enviando {first_idx}-{last_idx} (prévia protocolos: {protos_preview})")
        # requests POST com timeout e tratamento de exceção
        try:
            r = requests.post(url_upsert, headers={**headers, "Prefer": prefer}, data=data_utf8.encode("utf-8"), timeout=30)
        except requests.RequestException as e:
            logging.exception(f"Erro ao enviar lote {first_idx}-{last_idx}")
            print(f"       Resposta: Erro na requisição: {e}")
            continue
        print(f"     → Lote {i//lote + 1}/{total_lotes} | status {r.status_code}")
        logging.info(f"Lote {i//lote + 1}/{total_lotes} status {r.status_code}")
        if r.status_code not in (200, 201):
            print("       Resposta:", (r.text or "")[:400])
            logging.warning(f"Resposta não-200/201 no post_lotes: {r.status_code} - {r.text[:400]}")

# Payload permitido
colunas_existentes = [
    "protocolo","data_da_criacao","status_demanda","prazo_restante",
    "data_da_conclusao","tempo_de_resolucao_em_dias","prioridade",
    "tipo_de_manifestacao","tema","assunto","canal","endereco",
    "unidade_cadastro","unidade_saude","status","servidor","responsavel",
    "orgaos","verificado"
]

# ========================================================
# 5) COLETA DE CHAVES EXISTENTES NO SERVIDOR (protocolo)
# ========================================================
_BANNER("6) COLETA DE PROTOCOLOS EXISTENTES NO SERVIDOR")

def _fetch_all_protocols(step: int = 1000) -> set:
    protos, offset = set(), 0
    while True:
        hdrs = headers.copy()
        hdrs.update({"Range-Unit": "items", "Range": f"{offset}-{offset+step-1}"})
        try:
            r = requests.get(url_get, headers=hdrs, params={"select": "protocolo"}, timeout=30)
        except requests.RequestException as e:
            logging.exception("Falha na requisição de protocolos ao servidor")
            raise SystemExit(f"❌ Falha ao paginar protocolos (erro de requisição): {e}")
        if r.status_code not in (200, 206):
            raise SystemExit(f"❌ Falha ao paginar protocolos ({r.status_code}): {r.text[:200]}")
        chunk = r.json() or []
        if not chunk:
            break
        for row in chunk:
            p = str(row.get("protocolo") or "").strip()
            if p:
                protos.add(p)
        offset += len(chunk)
    return protos

# fetch protocolos (mantido)
protocolos_server = _fetch_all_protocols()
print(f"🔑 Protocolos já no servidor: {len(protocolos_server)}")
logging.info(f"Protocolos já no servidor: {len(protocolos_server)}")

# ========================================================
# 6) LIMPEZA BÁSICA (texto) + RECORTE PARA NOVOS por PROTOCOLO
# ========================================================
_BANNER("6) LIMPEZA BÁSICA + RECORTE POR PROTOCOLO")

if "protocolo" not in df.columns:
    raise KeyError("Falta a coluna obrigatória: protocolo")

# padroniza protocolo e filtra
df["protocolo"] = df["protocolo"].astype(str).str.strip()
df = df[df["protocolo"].ne("")].copy()

mask_novos = ~df["protocolo"].isin(protocolos_server)
df_novos = df[mask_novos].copy()

print(f"🆕 Linhas novas (protocolo ainda não existente no servidor): {len(df_novos)}")
logging.info(f"Linhas novas: {len(df_novos)}")

# ========================================================
# 7) TRATAMENTOS — APLICADOS SOMENTE AOS NOVOS
# ========================================================
_BANNER("8) TRATAMENTOS (somente NOVOS)")

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
    # aplica canonização dos valores de retorno (mantém lógica original)
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

    # 7.5 Padronização 'servidor' (dicionário mantido integralmente)
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

    # 7.6 Responsável (normalização) - mantido
    if "responsavel" in df_loc.columns:
        df_loc["responsavel"] = _canon_responsavel_series(df_loc["responsavel"])

    # 7.7 Datas e tipos - mantidos
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
    elif "prazo_restante" in df_loc.columns:
        mask_dc = df_loc["prazo_restante"].map(_looks_like_demanda_concluida)
        df_loc.loc[mask_dc, "prazo_restante"] = "Demanda Concluída"

    # 7.9 tempo_de_resolucao_em_dias: "Não há dados" -> "" (vazio)
    if "tempo_de_resolucao_em_dias" in df_loc.columns:
        s = df_loc["tempo_de_resolucao_em_dias"].astype("object")
        def _blank_nao_ha_dados(v):
            if _is_nao_ha_dados(v):
                return ""   # linha vazia (texto vazio)
            return v
        df_loc["tempo_de_resolucao_em_dias"] = s.map(_blank_nao_ha_dados)

    # 7.9 (não altera mais nada aqui — sincronização geral ficará no item 10.3)
    return df_loc[[c for c in colunas_existentes if c in df_loc.columns]].copy()

# cria SEMPRE o df_upsert (mesmo vazio) e faz sanity pass
df_upsert = _tratar_full(df_novos)

if "data_da_criacao" in df_upsert.columns:
    df_upsert["data_da_criacao"] = _to_ddmmaa_text(df_upsert["data_da_criacao"]).astype(str).str.strip()
if "data_da_conclusao" in df_upsert.columns:
    df_upsert["data_da_conclusao"] = _conclusao_strict(df_upsert["data_da_conclusao"]).astype(str).str.strip()

print(f"🔎 Pré-envio (novos) — colunas: {list(df_upsert.columns)} | linhas: {len(df_upsert)}")
logging.info(f"Pré-envio (novos) — colunas: {list(df_upsert.columns)} | linhas: {len(df_upsert)}")

# ========================================================
# 8) UPSERT — APENAS NOVOS (por PROTOCOLO)
# ========================================================
_BANNER("9) UPSERT — APENAS NOVOS")

if 'df_upsert' not in globals():
    raise SystemExit("❌ df_upsert não encontrado. Gere-o com _tratar_full(df_novos) antes do item 9.")

df_novos_filtrado = df_upsert[~df_upsert["protocolo"].astype(str).str.strip().isin(protocolos_server)].copy()
print(f"🆕 Linhas realmente novas após filtro: {len(df_novos_filtrado)}")
logging.info(f"Linhas realmente novas após filtro: {len(df_novos_filtrado)}")

if df_novos_filtrado.empty:
    print("✅ Nenhum registro novo para enviar.")
    logging.info("Nenhum registro novo para enviar.")
else:
    post_url = f"{url_upsert}?on_conflict=protocolo"
    # Prefer 'return-minimal' (sem merge automático): só insere novos; conflito vira erro (esperado não ocorrer pelo filtro).
    post_headers = {**headers, "Prefer": "return=minimal"}

    cols_ok = [c for c in df_novos_filtrado.columns if c in colunas_existentes]
    df_send = df_novos_filtrado[cols_ok].copy()

    # LOG de sanidade para unidade_cadastro (somente novos)
    if "unidade_cadastro" in df_send.columns:
        nulos_uc = int(df_send["unidade_cadastro"].isna().sum())
        print(f"🧪 Checagem (NOVOS): unidade_cadastro presente | nulos={nulos_uc}")
        logging.info(f"Checagem (NOVOS): unidade_cadastro presente | nulos={nulos_uc}")
    else:
        print("⚠️ Aviso: unidade_cadastro não está em df_send (verifique colunas_existentes).")
        logging.warning("unidade_cadastro não está em df_send (verifique colunas_existentes).")

    lote = 500
    total_lotes = (len(df_send) + lote - 1) // lote
    print(f"📦 UPSERT — APENAS NOVOS: {len(df_send)} linhas | {total_lotes} lotes")
    logging.info(f"UPSERT — APENAS NOVOS: {len(df_send)} linhas | {total_lotes} lotes")

    for i in range(0, len(df_send), lote):
        chunk = df_send.iloc[i:i+lote].replace({np.nan: None})
        payload = json.dumps(chunk.to_dict(orient="records"), ensure_ascii=False).encode("utf-8")

        first_idx = i + 1
        last_idx = min(i + lote, len(df_send))
        protos_preview = list(chunk.get("protocolo", []))[:3]

        print(f"   • Enviando {first_idx}-{last_idx} (prévia protocolos: {protos_preview})")
        logging.info(f"Enviando {first_idx}-{last_idx} (prévia protocolos: {protos_preview})")

        try:
            r = requests.post(post_url, headers=post_headers, data=payload, timeout=30)
        except requests.RequestException as e:
            logging.exception(f"Erro ao enviar lote {first_idx}-{last_idx} (UPSERT)")
            print(f"       ❌ Erro na requisição: {e}")
            continue

        print(f"     → Lote {i//lote + 1}/{total_lotes} | status {r.status_code}")
        logging.info(f"Lote {i//lote + 1}/{total_lotes} | status {r.status_code}")

        if r.status_code not in (200, 201, 204):
            print("       ❌ Erro:", (r.text or "")[:400])
            logging.warning(f"Erro no upsert lote {i//lote + 1}: {r.status_code} - {r.text[:400]}")
            protos_errados = list(chunk.get("protocolo", []))
            print(f"       Protocolos neste lote com erro: {protos_errados}")
            logging.info(f"Protocolos com erro: {protos_errados}")

# ========================================================
# 9) DELTAS HISTÓRICOS — status_demanda e data_da_conclusao
# ========================================================
_BANNER("10) DELTAS HISTÓRICOS (status_demanda & data_da_conclusao)")

# ==== BLOQUEIO: nunca PATCH em unidade_cadastro ====
_COLUNAS_PATCH_PROIBIDAS = {"unidade_cadastro"}
# ===================================================

def _buscar_cols_por_protocolos(protos_series: pd.Series, cols, tam_lote: int = 300) -> dict:
    protos = protos_series.dropna().astype(str).str.strip().unique().tolist()
    resultado = {}
    if not protos: return resultado
    sel = "protocolo," + ",".join(cols)
    for i in range(0, len(protos), tam_lote):
        lote = protos[i:i+tam_lote]
        in_list = ",".join([f'"{p.replace("\"", "\'")}"' for p in lote])
        params = {"select": sel, "protocolo": f"in.({in_list})"}
        try:
            r = requests.get(url_get, headers=headers, params=params, timeout=30)
        except requests.RequestException:
            logging.exception("Falha ao buscar cols por protocolos")
            continue
        if r.status_code in (200, 206):
            for row in r.json():
                p = str(row.get("protocolo")).strip()
                resultado[p] = {c: row.get(c) for c in cols}
        else:
            print(f"⚠️ Falha ao buscar {cols} -> {r.status_code}: {r.text[:200]}")
            logging.warning(f"Falha ao buscar {cols} -> {r.status_code}: {r.text[:200]}")
    return resultado

def _patch_grouped_force(df_send: pd.DataFrame, key_col: str, value_col: str, batch_keys: int = 400):
    # BLOQUEIO explícito para evitar tocar unidade_cadastro
    if value_col in _COLUNAS_PATCH_PROIBIDAS:
        print(f"⛔ PATCH bloqueado para coluna: {value_col} (política: não alterar unidade_cadastro)")
        logging.warning(f"PATCH bloqueado para coluna: {value_col}")
        return

    if df_send.empty:
        print(f"📦 DELTA(force) {value_col}: 0 linhas (skip).")
        logging.info(f"DELTA(force) {value_col}: 0 linhas (skip).")
        return
    df_send = df_send[[key_col, value_col]].dropna(subset=[key_col, value_col]).copy()
    total = len(df_send)
    grupos = df_send.groupby(value_col)
    print(f"📦 DELTA(force) {value_col}: {total} linhas | {len(grupos)} grupos")
    logging.info(f"DELTA(force) {value_col}: {total} linhas | {len(grupos)} grupos")

    for val, g in grupos:
        protos = g[key_col].astype(str).str.strip().unique().tolist()
        payload = json.dumps({value_col: val}, ensure_ascii=False).encode("utf-8")
        for i in range(0, len(protos), batch_keys):
            bloco = protos[i:i+batch_keys]
            quoted_list = ",".join([f'"{p.replace("\"","\'")}"' for p in bloco])
            qs = f'{quote(key_col)}=in.({quoted_list})'
            print(f"   • PATCH {value_col}='{val}' | protos {i+1}-{i+len(bloco)} de {len(protos)}")
            logging.info(f"PATCH {value_col}='{val}' | protos {i+1}-{i+len(bloco)} de {len(protos)}")
            try:
                r = requests.patch(f"{url_upsert}?{qs}", headers=headers, data=payload, timeout=30)
            except requests.RequestException:
                logging.exception("Erro no PATCH agrupado")
                print("       Resposta: Erro na requisição PATCH")
                continue
            print(f"     → status {r.status_code} (itens {len(bloco)})")
            logging.info(f"Status PATCH: {r.status_code} (itens {len(bloco)})")
            if r.status_code not in (200, 204):
                print("       Resposta:", r.text[:300])
                logging.warning(f"PATCH retornou {r.status_code}: {r.text[:300]}")

server_map = _buscar_cols_por_protocolos(df["protocolo"], ["status_demanda","data_da_conclusao"], 300)

# Delta STATUS
loc_status = df[["protocolo","status_demanda"]].copy()
loc_status["local_norm"]  = pd.Series(loc_status["status_demanda"], dtype="object").astype(str).str.strip()
loc_status["server_norm"] = loc_status["protocolo"].map(lambda p: _canon_txt((server_map.get(p, {}) or {}).get("status_demanda", "")))
mask_st_changed = loc_status["local_norm"].fillna("") != loc_status["server_norm"].fillna("")
df_status_delta = loc_status.loc[mask_st_changed, ["protocolo"]].copy()
df_status_delta["status_demanda"] = loc_status.loc[mask_st_changed, "local_norm"].values
print(f"🔁 Delta STATUS: {len(df_status_delta)} linhas para atualizar.")
logging.info(f"Delta STATUS: {len(df_status_delta)} linhas para atualizar.")

# Delta DATA DA CONCLUSÃO
loc_dc = df[["protocolo","data_da_conclusao"]].copy()
loc_dc["local_norm"]  = _conclusao_strict(loc_dc["data_da_conclusao"]).astype(str).str.strip()
srv_raw_dc = pd.Series([ (server_map.get(p, {}) or {}).get("data_da_conclusao", None) for p in df["protocolo"] ])
srv_norm_dc = _conclusao_strict(srv_raw_dc).astype(str).str.strip()
loc_dc["server_norm"] = srv_norm_dc.values
mask_dc_changed = loc_dc["local_norm"].fillna("") != loc_dc["server_norm"].fillna("")
df_conc_delta = loc_dc.loc[mask_dc_changed, ["protocolo"]].copy()
df_conc_delta["data_da_conclusao"] = loc_dc.loc[mask_dc_changed, "local_norm"].values
print(f"🔁 Delta DATA_CONCLUSAO: {len(df_conc_delta)} linhas para atualizar.")
logging.info(f"Delta DATA_CONCLUSAO: {len(df_conc_delta)} linhas para atualizar.")

if not df_conc_delta.empty:
    df_conc_delta["data_da_conclusao"] = (
        _conclusao_strict(df_conc_delta["data_da_conclusao"])
        .astype(str).str.strip()
    )

_patch_grouped_force(df_status_delta, "protocolo", "status_demanda")
_patch_grouped_force(df_conc_delta,   "protocolo", "data_da_conclusao")

# ========================================================
# 9.1) DELTA HISTÓRICO — prazo_restante (respeita base bruta)
# ========================================================
_BANNER("9.1) DELTA HISTÓRICO (prazo_restante — respeitar base bruta)")

server_prz_map = _buscar_cols_por_protocolos(df["protocolo"], ["prazo_restante"], 300)

loc_prz = df[["protocolo","prazo_restante"]].copy()
loc_prz["local_norm"] = loc_prz["prazo_restante"].map(_canon_prazo_restante)

if "status_demanda" in df.columns:
    mask_conc_local = df["status_demanda"].map(_is_concluida)
    loc_prz.loc[mask_conc_local, "local_norm"] = "Demanda Concluída"

loc_prz["local_is_dc"] = loc_prz["local_norm"].map(_looks_like_demanda_concluida)
loc_prz["server_raw"] = loc_prz["protocolo"].map(lambda p: (server_prz_map.get(str(p).strip(), {}) or {}).get("prazo_restante", ""))
loc_prz["server_is_dc"] = loc_prz["server_raw"].map(_looks_like_demanda_concluida)

df_delta_fix_grafia = loc_prz.loc[
    loc_prz["server_is_dc"] & (loc_prz["server_raw"].astype(str).str.strip() != "Demanda Concluída"),
    ["protocolo"]
].copy()
df_delta_fix_grafia["prazo_restante"] = "Demanda Concluída"

df_delta_from_base = loc_prz.loc[
    loc_prz["local_is_dc"] & (~loc_prz["server_is_dc"]),
    ["protocolo"]
].copy()
df_delta_from_base["prazo_restante"] = "Demanda Concluída"

df_prazo_delta = pd.concat([df_delta_fix_grafia, df_delta_from_base], ignore_index=True).drop_duplicates("protocolo")
print(f"🔁 Delta PRAZO_RESTANTE (histórico): {len(df_prazo_delta)} linhas para atualizar.")
logging.info(f"Delta PRAZO_RESTANTE: {len(df_prazo_delta)} linhas para atualizar.")
if not df_prazo_delta.empty:
    _patch_grouped_force(df_prazo_delta, "protocolo", "prazo_restante")

# ========================================================
# 9.3) DELTA HISTÓRICO — tempo_de_resolucao_em_dias (sincroniza com a planilha; 0 -> 1)
# ========================================================
_BANNER("9.3) DELTA HISTÓRICO (tempo_de_resolucao_em_dias — sincroniza local; 0→1)")

if "tempo_de_resolucao_em_dias" in df.columns:
    server_tmp_map = _buscar_cols_por_protocolos(df["protocolo"], ["tempo_de_resolucao_em_dias"], 300)

    s_local = df["tempo_de_resolucao_em_dias"].astype("object")

    # <<< SUBSTITUÍDA pela versão pedida >>>
    def _fix_zero_keep_text(v):
        if pd.isna(v):
            return v
        sv = str(v).strip()

        # 1) "Não há dados" -> vazio
        if _is_nao_ha_dados(sv):
            return ""   # texto vazio, evita drop por NA no patch

        # 2) 0 -> 1 (mantém sua regra)
        try:
            num = pd.to_numeric(sv, errors="coerce")
            if pd.notna(num) and float(num) == 0.0:
                return "1"
        except:
            pass

        # 3) mantém como está em qualquer outro caso
        return sv
    # >>> FIM SUBSTITUIÇÃO

    s_local_fixed = s_local.map(_fix_zero_keep_text)

    s_server = df["protocolo"].astype(str).str.strip().map(
        lambda p: _canon_txt((server_tmp_map.get(p, {}) or {}).get("tempo_de_resolucao_em_dias", ""))
    ).astype("object").str.strip()

    mask_change = (s_local_fixed.fillna("") != s_server.fillna(""))

    if mask_change.any():
        df_tmp_delta = pd.DataFrame({
            "protocolo": df.loc[mask_change, "protocolo"].astype(str).str.strip(),
            "tempo_de_resolucao_em_dias": s_local_fixed.loc[mask_change].values
        })
        print(f"🔁 Delta TEMPO_RESOLUCAO (sincroniza): {len(df_tmp_delta)} linhas para atualizar.")
        logging.info(f"Delta TEMPO_RESOLUCAO: {len(df_tmp_delta)} linhas para atualizar.")
        _patch_grouped_force(df_tmp_delta, "protocolo", "tempo_de_resolucao_em_dias")
    else:
        print("🔁 Delta TEMPO_RESOLUCAO: nada a atualizar (já igual ao local).")
        logging.info("Delta TEMPO_RESOLUCAO: nada a atualizar (já igual ao local).")
else:
    print("🔁 Delta TEMPO_RESOLUCAO: coluna ausente na planilha local.")
    logging.info("Delta TEMPO_RESOLUCAO: coluna ausente na planilha local.")

# ========================================================
# 9.3B) LIMPEZA NO SERVIDOR — "Não há dados" -> "" (vazio)
# ========================================================
_BANNER("9.3B) LIMPEZA NO SERVIDOR (tempo_de_resolucao_em_dias)")

def _cleanup_nao_ha_dados_server():
    alvo = "Não há dados"

    # 1) Contagem rápida do que ainda existe no servidor
    hdrs = headers.copy()
    hdrs.update({"Range-Unit": "items", "Range": "0-0", "Prefer": "count=exact"})
    params_count = {"select": "protocolo", "tempo_de_resolucao_em_dias": f"eq.{alvo}"}
    try:
        r_count = requests.get(url_get, headers=hdrs, params=params_count, timeout=30)
    except requests.RequestException:
        logging.exception("Falha na contagem de 'Não há dados' no servidor.")
        print("⚠️ Falha ao contar 'Não há dados' no servidor (erro de requisição).")
        return

    if r_count.status_code not in (200, 206):
        print(f"⚠️ Falha ao contar 'Não há dados' no servidor: {r_count.status_code} {r_count.text[:200]}")
        logging.warning(f"Falha ao contar 'Não há dados' no servidor: {r_count.status_code}")
        return

    try:
        total = int(r_count.headers.get("content-range", "0/0").split("/")[-1])
    except:
        total = 0

    if total == 0:
        print("ℹ️ Nada para limpar no servidor (0 ocorrências de 'Não há dados').")
        logging.info("Nada para limpar no servidor (0 ocorrências de 'Não há dados').")
        return

    print(f"🧹 Encontradas {total} ocorrências no servidor com 'Não há dados'. Aplicando PATCH...")
    logging.info(f"Encontradas {total} ocorrências no servidor com 'Não há dados'.")

    # 2) PATCH em lote no servidor: troca para texto vazio
    payload = json.dumps({"tempo_de_resolucao_em_dias": ""}, ensure_ascii=False).encode("utf-8")
    params_patch = {"tempo_de_resolucao_em_dias": f"eq.{alvo}"}
    try:
        r_patch = requests.patch(url_upsert, headers=headers, params=params_patch, data=payload, timeout=30)
    except requests.RequestException:
        logging.exception("Erro ao aplicar PATCH de limpeza 'Não há dados' no servidor.")
        print("❌ Erro ao aplicar PATCH (requisição).")
        return

    if r_patch.status_code in (200, 204):
        print("✅ PATCH aplicado no servidor: 'Não há dados' -> '' (vazio).")
        logging.info("PATCH aplicado no servidor: 'Não há dados' -> '' (vazio).")
    else:
        print(f"❌ Erro ao aplicar PATCH: {r_patch.status_code} {r_patch.text[:300]}")
        logging.warning(f"Erro ao aplicar PATCH: {r_patch.status_code} {r_patch.text[:300]}")

_cleanup_nao_ha_dados_server()

# ========================================================
# 9.X) CORREÇÃO PONTUAL — servidor (Raphael)
# ========================================================
_BANNER("10.X) CORREÇÃO PONTUAL — servidor (Raphael)")

try:
    if "protocolo" in df.columns and "servidor" in df.columns:
        # Protocolos que na planilha local estão com o nome correto
        protos_raphael = (
            df.loc[df["servidor"].astype(str).str.strip().eq("Raphael Pereira de Mello"), "protocolo"]
              .astype(str).str.strip().unique().tolist()
        )

        if protos_raphael:
            df_fix = pd.DataFrame({
                "protocolo": protos_raphael,
                "servidor": "Raphael Pereira de Mello"
            })
            _patch_grouped_force(df_fix, "protocolo", "servidor")
        else:
            print("ℹ️ Nenhum protocolo local com 'Raphael Pereira de Mello' encontrado para corrigir.")
            logging.info("Nenhum protocolo local com 'Raphael Pereira de Mello' encontrado para corrigir.")
    else:
        print("ℹ️ Colunas 'protocolo' e/ou 'servidor' ausentes no DF local.")
        logging.info("Colunas 'protocolo' e/ou 'servidor' ausentes no DF local.")
except Exception as e:
    # mantido pass silencioso anterior, mas agora logamos
    logging.exception("Erro durante correção pontual (Raphael).")

# ========================================================
# 10) EXPORTAÇÃO INCREMENTAL — GOOGLE DRIVE (PLANILHA TRATADA)
# ========================================================
_BANNER("10) EXPORTAÇÃO INCREMENTAL PARA GOOGLE DRIVE (PLANILHA TRATADA)")

# --- Cria referência da base tratada final (necessário para integração incremental)
df_tratado = df.copy()

query_tratada = f"'{PASTA_TRATADA_ID}' in parents and name='{NOME_PLANILHA_TRATADA}' and mimeType='application/vnd.google-apps.spreadsheet'"
arquivos_tratados = drive_service.files().list(
    q=query_tratada, spaces="drive",
    fields="files(id, name, createdTime)"
).execute().get("files", [])

if arquivos_tratados:
    sheet_tratada_id = arquivos_tratados[0]["id"]
    print(f"📄 Planilha tratada existente encontrada: {NOME_PLANILHA_TRATADA} (ID: {sheet_tratada_id})")
    sh_tratada = gc.open_by_key(sheet_tratada_id)
    try:
        df_existente = pd.DataFrame(sh_tratada.sheet1.get_all_records())
        df_existente.columns = [normalizar_nome_coluna(c) for c in df_existente.columns]
        print(f"📊 Base tratada existente carregada: {df_existente.shape}")
    except Exception as e:
        print("⚠️ Erro ao ler planilha tratada existente, criando DataFrame vazio:", e)
        df_existente = pd.DataFrame(columns=df_tratado.columns)
else:
    print(f"🆕 Nenhuma planilha tratada encontrada; uma nova será criada.")
    df_existente = pd.DataFrame(columns=df_tratado.columns)
    sheet_tratada_id = None

# ========================================================
# 10.1) DETECÇÃO DE NOVOS REGISTROS
# ========================================================
if "protocolo" not in df_tratado.columns:
    raise KeyError("A coluna 'protocolo' é obrigatória para sincronização incremental.")

df_tratado["protocolo"] = df_tratado["protocolo"].astype(str).str.strip()
df_existente["protocolo"] = df_existente.get("protocolo", pd.Series(dtype="object")).astype(str).str.strip()

protocolos_existentes = set(df_existente["protocolo"].dropna().tolist())
df_novos = df_tratado[~df_tratado["protocolo"].isin(protocolos_existentes)].copy()
print(f"➕ Novos protocolos detectados: {len(df_novos)}")

# ========================================================
# 10.2) MERGE (HISTÓRICO + NOVOS)
# ========================================================
if not df_existente.empty:
    df_combinado = pd.concat([df_existente, df_novos], ignore_index=True)
    df_combinado.drop_duplicates(subset=["protocolo"], keep="last", inplace=True)
else:
    df_combinado = df_tratado.copy()

print(f"📈 Total final de registros após merge: {len(df_combinado)}")

# ========================================================
# 10.3) EXPORTAÇÃO FINAL PARA GOOGLE SHEETS
# ========================================================
if sheet_tratada_id:
    sh_tratada = gc.open_by_key(sheet_tratada_id)
    ws = sh_tratada.sheet1
    ws.clear()
else:
    file_metadata = {
        "name": NOME_PLANILHA_TRATADA,
        "mimeType": "application/vnd.google-apps.spreadsheet",
        "parents": [PASTA_TRATADA_ID]
    }
    nova_planilha = drive_service.files().create(body=file_metadata, fields="id").execute()
    sheet_tratada_id = nova_planilha["id"]
    sh_tratada = gc.open_by_key(sheet_tratada_id)
    ws = sh_tratada.sheet1

set_with_dataframe(ws, df_combinado)
print("✅ Base tratada atualizada de forma incremental com sucesso!")
print(f"📎 Link direto: https://docs.google.com/spreadsheets/d/{sheet_tratada_id}/edit")

_BANNER("11) PIPELINE FINALIZADO")
print("🎯 Fluxo concluído:")
print("GoogleDrive (Bruto) → PythonAnywhere (Tratamento) → GoogleDrive (Tratado Incremental) → Looker Studio")

# ========================================================
# 11) QA & SUMÁRIO FINAL
# ========================================================

_BANNER("11) QA & SUMÁRIO FINAL")

def _count_where_chunked(protos: list, chunk_size: int = 300) -> int:
    total_null = 0
    for i in range(0, len(protos), chunk_size):
        lote = protos[i:i+chunk_size]
        quoted_list = ",".join([f'"{p.replace("\"","\'")}"' for p in lote])

        hdrs = headers.copy()
        hdrs.update({"Range-Unit":"items", "Range":"0-0", "Prefer":"count=exact"})
        params = {"select":"protocolo", "protocolo": f"in.({quoted_list})", "orgaos": "is.null"}

        try:
            r = requests.get(url_upsert, headers=hdrs, params=params, timeout=30)
        except requests.RequestException:
            logging.exception("Falha no QA chunk (requisição)")
            print(f"⚠️ QA chunk {i//chunk_size+1}: erro na requisição")
            continue

        if r.status_code in (200, 206):
            try:
                total_null += int(r.headers.get("content-range","0/0").split("/")[-1])
            except:
                pass
        else:
            print(f"⚠️ QA chunk {i//chunk_size+1}: {r.status_code} {r.text[:150]}")
            logging.warning(f"QA chunk {i//chunk_size+1}: {r.status_code} {r.text[:150]}")
    return total_null

if not df_upsert.empty:
    novos_protos = df_upsert["protocolo"].astype(str).str.strip().unique().tolist()
    vazios_novos = _count_where_chunked(novos_protos, chunk_size=300)
    print(f"🔎 QA (NOVOS): 'orgaos' NULL = {vazios_novos}")
    logging.info(f"QA (NOVOS): 'orgaos' NULL = {vazios_novos}")
else:
    print("ℹ️ QA (NOVOS): não havia linhas novas para inserir.")
    logging.info("QA (NOVOS): não havia linhas novas para inserir.")

# ========================================================
# 12) FINALIZAÇÃO
# ========================================================
_BANNER("6) PIPELINE FINALIZADO")

print("🎯 Pipeline executado com sucesso!")
logging.info("Pipeline executado com sucesso")
print("Fluxo: GoogleDrive (bruto) → PythonAnywhere (tratamento) → GoogleDrive (tratado) → LookerStudio")