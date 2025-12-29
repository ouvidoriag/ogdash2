# 🔄 PIPELINE - Processamento de Dados

**Localização:** `Pipeline/`  
**Data:** 12/12/2025  
**CÉREBRO X-3**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Estrutura do Pipeline](#estrutura-do-pipeline)
3. [Fluxo de Processamento](#fluxo-de-processamento)
4. [Configuração](#configuração)
5. [Normalização](#normalização)
6. [Integração com MongoDB](#integração-com-mongodb)

---

## 🎯 VISÃO GERAL

O Pipeline Python processa dados brutos do Google Sheets, normaliza e trata os dados, e os escreve em uma planilha tratada que é posteriormente sincronizada com o MongoDB Atlas.

**Stack:**
- **Linguagem:** Python 3
- **Bibliotecas:** pandas, gspread, google-auth, googleapiclient
- **Fonte:** Google Sheets (pasta bruta)
- **Destino:** Google Sheets (planilha tratada) → MongoDB Atlas

---

## 🏗️ ESTRUTURA DO PIPELINE

```
Pipeline/
├── main.py                 # Script principal
├── requirements.txt        # Dependências Python
├── rodar_pipeline.yml     # Workflow GitHub Actions
└── utils/
    ├── __init__.py
    ├── normalizacao.py    # Funções de normalização
    └── README.md
```

---

## 🔄 FLUXO DE PROCESSAMENTO

### 1. **Autenticação Google**
- Lê credenciais de `.github/workflows/credentials.json`
- Decodifica Base64 para JSON
- Autentica com Google Drive e Sheets API
- Scopes: `drive`, `spreadsheets`

### 2. **Leitura da Planilha Bruta**
- Busca última planilha na pasta do Google Drive
- Pasta ID: `1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5`
- Ordena por `modifiedTime desc`
- Lê dados da primeira aba

### 3. **Normalização de Colunas**
- Normaliza nomes de colunas (remove acentos, lowercase, underscore)
- Padroniza coluna `protocolo` (strip + upper)
- Usa funções de `utils/normalizacao.py`

### 4. **Tratamento Completo**
- Aplica função `_tratar_full()` aos dados
- Normaliza datas para ISO (`dataCriacaoIso`, `dataConclusaoIso`)
- Canoniza textos (lowercase, sem acento)
- Padroniza campos: `statusDemanda`, `tipoDeManifestacao`, `tema`, `assunto`, `categoria`, `secretaria`, `bairro`
- Valida campos obrigatórios
- Corrige inconsistências

### 5. **Identificação de Novos Protocolos**
- Compara protocolos da planilha bruta com a tratada
- Identifica protocolos novos para inserir
- Mantém protocolos existentes

### 6. **Escrita na Planilha Tratada**
- Planilha ID: `1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g`
- Envia dados em lotes (chunks)
- Sanitiza valores (datas, números, strings)
- Usa `value_input_option='USER_ENTERED'` para datas

### 7. **PATCH de Atualizações**
- Atualiza status de demandas alteradas
- Atualiza datas de conclusão alteradas
- Atualiza tempo de resolução alterado
- Agrupa atualizações por protocolo

### 8. **Logs e Monitoramento**
- Logs detalhados em `pipeline_tratamento.log`
- Banners de seção para organização
- Tratamento de erros robusto
- Validações em cada etapa

---

## ⚙️ CONFIGURAÇÃO

### Variáveis de Ambiente

```env
GOOGLE_CREDENTIALS_FILE=.github/workflows/credentials.json
GOOGLE_SHEET_ID=1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g
GOOGLE_FOLDER_BRUTA=1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5
```

### Credenciais

- **Localização:** `.github/workflows/credentials.json`
- **Formato:** Base64 encoded JSON
- **Tipo:** Service Account
- **Scopes:** `drive`, `spreadsheets`

---

## 🔧 NORMALIZAÇÃO

### Funções de Normalização (`utils/normalizacao.py`)

1. **normalizar_nome_coluna(col)**
   - Remove acentos
   - Converte para lowercase
   - Substitui caracteres especiais por underscore
   - Remove underscores duplicados

2. **_clean_whitespace(text)**
   - Remove espaços extras
   - Normaliza quebras de linha

3. **_canon_txt(text)**
   - Remove acentos
   - Converte para lowercase
   - Remove caracteres especiais

4. **_canon_txt_preserve_case(text)**
   - Mesmo que `_canon_txt` mas preserva maiúsculas/minúsculas

### Campos Normalizados

- **protocolo:** Uppercase, strip
- **datas:** Formato ISO (YYYY-MM-DD)
- **textos:** Lowercase, sem acento
- **statusDemanda:** Valores padronizados
- **secretaria:** Nomes canonizados
- **bairro:** Nomes canonizados

---

## 🔗 INTEGRAÇÃO COM MONGODB

### Sincronização Node.js

Após o pipeline escrever na planilha tratada, o sistema Node.js:

1. Lê dados da planilha tratada via `updateFromGoogleSheets.js`
2. Normaliza dados conforme schema Mongoose
3. Insere/atualiza no MongoDB Atlas
4. Usa collection `records`

### Script de Sincronização

**Localização:** `NOVO/scripts/data/updateFromGoogleSheets.js`

**Função:**
- Conecta ao Google Sheets
- Lê dados da planilha tratada
- Valida dados
- Insere/atualiza no MongoDB

---

## 📊 PROCESSAMENTO DE DADOS

### Tratamento de Datas

- **Entrada:** Vários formatos (DD/MM/YYYY, YYYY-MM-DD, etc.)
- **Saída:** ISO (YYYY-MM-DD)
- **Validação:** Verifica datas válidas
- **Fallback:** "Não concluído" para datas inválidas

### Tratamento de Protocolos

- **Padronização:** Uppercase, strip
- **Validação:** Verifica formato
- **Unicidade:** Garante protocolos únicos

### Tratamento de Textos

- **Canonização:** Lowercase, sem acento
- **Limpeza:** Remove espaços extras
- **Normalização:** Padroniza valores

---

## 🚨 TRATAMENTO DE ERROS

### Erros Críticos

- **Arquivo de credenciais não encontrado:** SystemExit
- **Falha na autenticação:** SystemExit
- **Planilha bruta não encontrada:** SystemExit
- **Erro na normalização:** SystemExit

### Erros Recuperáveis

- **Erro ao enviar lote:** Log + continuação
- **Erro ao atualizar célula:** Log + continuação
- **Valor inválido:** Log + valor padrão

### Logs

- **Arquivo:** `pipeline_tratamento.log`
- **Formato:** `%(asctime)s | %(levelname)s | %(message)s`
- **Nível:** INFO (DEBUG disponível)

---

## 🔄 AUTOMAÇÃO

### GitHub Actions

**Arquivo:** `Pipeline/rodar_pipeline.yml`

**Trigger:**
- Manual (workflow_dispatch)
- Agendado (cron)

**Passos:**
1. Setup Python
2. Instalar dependências
3. Executar pipeline
4. Upload de logs

### Execução Manual

```bash
cd Pipeline
python main.py
```

---

## ✅ CHECKUP DO PIPELINE

### ✅ Autenticação
- [x] Credenciais configuradas
- [x] Autenticação funcionando
- [x] Scopes corretos

### ✅ Leitura
- [x] Leitura da planilha bruta funcionando
- [x] Identificação da última planilha funcionando

### ✅ Normalização
- [x] Normalização de colunas funcionando
- [x] Normalização de dados funcionando
- [x] Validação funcionando

### ✅ Escrita
- [x] Escrita na planilha tratada funcionando
- [x] PATCH de atualizações funcionando
- [x] Sanitização funcionando

### ✅ Integração
- [x] Sincronização com MongoDB funcionando
- [x] Script Node.js funcionando

---

**Última Atualização:** 12/12/2025

