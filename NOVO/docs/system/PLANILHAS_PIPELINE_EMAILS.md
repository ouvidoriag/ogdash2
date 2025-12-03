# 📊 Documentação: Planilhas, Pipeline e Sistema de Emails

Este documento explica detalhadamente como funcionam as **planilhas**, o **pipeline de processamento** e o **sistema de envio de emails** no Dashboard de Ouvidoria.

---

## 📋 ÍNDICE

1. [Planilhas (Google Sheets)](#1-planilhas-google-sheets)
2. [Pipeline de Processamento](#2-pipeline-de-processamento)
3. [Sistema de Emails](#3-sistema-de-emails)
4. [Fluxo Completo End-to-End](#4-fluxo-completo-end-to-end)
5. [Configuração e Setup](#5-configuração-e-setup)

---

## 1. PLANILHAS (GOOGLE SHEETS)

### 1.1 Visão Geral

O sistema utiliza **Google Sheets** como fonte principal de dados brutos. As planilhas são processadas pelo pipeline Python e depois sincronizadas com o banco de dados MongoDB.

### 1.2 Estrutura das Planilhas

#### **Planilha Bruta** (`FOLDER_ID_BRUTA`)
- **Localização**: Google Drive (pasta específica)
- **ID da Pasta**: `1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5`
- **Função**: Recebe os dados brutos diretamente do sistema de origem
- **Processo**: O pipeline Python busca automaticamente a **última planilha** da pasta (mais recente por data de modificação)

#### **Planilha Tratada** (`PLANILHA_TRATADA_ID`)
- **ID**: `1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g`
- **Função**: Recebe os dados processados e normalizados pelo pipeline
- **Processo**: Após tratamento, os dados são escritos nesta planilha e depois importados para o MongoDB

### 1.3 Integração com Google Sheets API

#### **Autenticação**
O sistema usa **Service Account** do Google Cloud Platform para autenticação:

```javascript
// Localização das credenciais
CAMINHO_CREDENCIAIS = ".github/workflows/credentials.json"
```

**Scopes necessários:**
- `https://www.googleapis.com/auth/drive` - Acesso ao Google Drive
- `https://www.googleapis.com/auth/spreadsheets` - Acesso ao Google Sheets

#### **Processo de Leitura**

1. **Buscar última planilha bruta:**
   ```python
   # Pipeline Python busca a planilha mais recente na pasta
   def get_latest_spreadsheet_df(folder_id, gspread_client, drive_svc):
       # Lista arquivos da pasta ordenados por data de modificação
       # Retorna a planilha mais recente
   ```

2. **Ler dados do Google Sheets:**
   ```javascript
   // Script Node.js lê a planilha tratada
   async function readGoogleSheet(sheets, spreadsheetId, range = null)
   ```

### 1.4 Scripts de Importação

#### **updateFromGoogleSheets.js**
- **Localização**: `NOVO/scripts/data/updateFromGoogleSheets.js`
- **Função**: Importa dados diretamente de uma planilha do Google Sheets para o MongoDB
- **Uso**: `npm run update:sheets` ou `node scripts/data/updateFromGoogleSheets.js`

**Processo:**
1. Autentica usando credenciais do Service Account
2. Lê dados da planilha especificada em `GOOGLE_SHEET_ID`
3. Normaliza campos principais (datas, protocolos, etc.)
4. Verifica quais protocolos já existem no banco
5. Atualiza registros existentes ou insere novos

**Variáveis de ambiente necessárias:**
```env
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_ID=seu_id_da_planilha
GOOGLE_SHEET_RANGE=Dados!A1:Z1000  # Opcional
```

---

## 2. PIPELINE DE PROCESSAMENTO

### 2.1 Visão Geral

O **Pipeline Python** é responsável por processar os dados brutos da planilha, normalizar, limpar e estruturar antes de salvar no banco de dados.

### 2.2 Arquitetura do Pipeline

#### **Arquivo Principal**
- **Localização**: `Pipeline/main.py`
- **Linguagem**: Python 3
- **Dependências**: `pandas`, `gspread`, `google-auth`, `unicodedata`, etc.

#### **Fluxo de Execução**

```
1. AUTENTICAÇÃO GOOGLE
   └──> Carrega credenciais do Service Account
   └──> Inicializa clientes do Google Drive e Sheets

2. LEITURA DA PLANILHA BRUTA
   └──> Busca última planilha na pasta do Google Drive
   └──> Converte para DataFrame do Pandas

3. NORMALIZAÇÃO
   └──> Normaliza nomes de colunas (remove acentos, espaços)
   └──> Padroniza protocolo (uppercase, trim)
   └──> Limpa e valida dados

4. TRATAMENTO DE DADOS
   └──> Normaliza datas (vários formatos → YYYY-MM-DD)
   └──> Canoniza textos (remove acentos, lowercase)
   └──> Mapeia órgãos e secretarias
   └──> Valida e corrige campos obrigatórios

5. IDENTIFICAÇÃO DE NOVOS PROTOCOLOS
   └──> Compara com planilha tratada existente
   └──> Identifica protocolos novos vs. existentes

6. ESCRITA NA PLANILHA TRATADA
   └──> Atualiza protocolos existentes
   └──> Adiciona novos protocolos
   └──> Mantém histórico e logs

7. SALVAMENTO NO BANCO (Node.js)
   └──> Lê planilha tratada atualizada
   └──> Salva no MongoDB via Mongoose/Prisma
```

### 2.3 Funções Principais do Pipeline

#### **Normalização de Colunas**
```python
def normalizar_nome_coluna(col: str) -> str:
    # Remove acentos, converte para lowercase
    # Substitui caracteres especiais por underscore
    # Remove underscores duplicados
```

#### **Tratamento de Datas**
```python
def _normalizar_data(dt_str):
    # Converte vários formatos de data para YYYY-MM-DD
    # Trata: DD/MM/YYYY, YYYY-MM-DD, timestamps, etc.
```

#### **Canonização de Texto**
```python
def _canon_txt(v) -> str:
    # Remove acentos
    # Converte para lowercase
    # Limpa espaços extras
```

#### **Mapeamento de Órgãos**
```python
def mapear_orgao_exato(celula_tema):
    # Mapeia temas para órgãos responsáveis
    # Remove duplicatas
    # Normaliza nomes
```

### 2.4 Execução do Pipeline

#### **Via Script Node.js (Recomendado)**
```bash
npm run pipeline
```

O script `NOVO/scripts/data/runPipeline.js`:
1. Prepara credenciais para o Python
2. Executa `main.py`
3. Lê a planilha tratada atualizada
4. Salva no MongoDB

#### **Diretamente via Python**
```bash
cd Pipeline
python main.py
```

**Requisitos:**
- Python 3 instalado
- Dependências: `pip install -r Pipeline/requirements.txt`

### 2.5 Logs e Monitoramento

O pipeline gera logs detalhados:
- **Arquivo de log**: `pipeline_tratamento.log`
- **Console**: Output formatado com emojis e status
- **Banners de seção**: Organizam o log por etapas

**Exemplo de log:**
```
================== 1) CONFIGURAÇÃO GOOGLE DRIVE/SHEETS ==================
✅ Autenticação Google OK.

================== 2) LEITURA DA PLANILHA BRUTA ==================
📂 Última planilha encontrada: dados_brutos_2024.xlsx
✅ Planilha bruta importada com sucesso: (1500, 45)
```

---

## 3. SISTEMA DE EMAILS

### 3.1 Visão Geral

O sistema de emails automatiza o envio de notificações para secretarias sobre prazos de vencimento de demandas da Ouvidoria.

### 3.2 Tipos de Notificações

#### **1. Notificação de 15 Dias**
- **Quando**: 15 dias antes do vencimento
- **Template**: `getTemplate15Dias()`
- **Finalidade**: Aviso preventivo
- **Prioridade**: Média (verde)

#### **2. Notificação de Vencimento**
- **Quando**: No dia exato do vencimento
- **Template**: `getTemplateVencimento()`
- **Finalidade**: Aviso crítico
- **Prioridade**: Alta (amarelo/laranja)

#### **3. Notificação de 30 Dias Vencido**
- **Quando**: 30 dias após o vencimento
- **Template**: `getTemplate30Dias()`
- **Finalidade**: Aviso de atraso
- **Prioridade**: Alta (amarelo)

#### **4. Notificação de 60 Dias Vencido**
- **Quando**: 60 dias após o vencimento
- **Template**: `getTemplate60Dias()`
- **Finalidade**: Aviso de extrapolação
- **Prioridade**: Crítica (vermelho)

#### **5. Consolidação Geral**
- **Quando**: Protocolos vencidos a partir de 30 dias
- **Template**: `getTemplateConsolidacaoGeral()`
- **Finalidade**: Resumo consolidado
- **Prioridade**: Média

#### **6. Resumo Diário para Ouvidoria**
- **Quando**: Diariamente às 8h
- **Template**: `getTemplateResumoOuvidoriaGeral()`
- **Finalidade**: Resumo executivo para a Ouvidoria
- **Destinatário**: Ouvidoria Geral

### 3.3 Cálculo de Prazos

#### **Tipos de Manifestação e Prazos**

| Tipo | Prazo Padrão |
|------|--------------|
| **SIC** (Serviço de Informação ao Cidadão) | **20 dias** |
| **Pedido de Informação** | **20 dias** |
| **Ouvidoria** (reclamação, sugestão, denúncia, elogio) | **30 dias** |

#### **Cálculo de Vencimento**
```javascript
function calcularDataVencimento(dataCriacao, prazo) {
    const data = new Date(dataCriacao + 'T00:00:00');
    data.setDate(data.getDate() + prazo);
    return data.toISOString().slice(0, 10); // YYYY-MM-DD
}
```

#### **Cálculo de Dias Restantes**
```javascript
function calcularDiasRestantes(dataVencimento, hoje) {
    const diff = vencimento - hoje;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
```

### 3.4 Arquitetura do Sistema de Emails

#### **Estrutura de Arquivos**

```
NOVO/src/services/email-notifications/
├── emailConfig.js          # Configuração e templates de emails
├── gmailService.js         # Integração com Gmail API
├── notificationService.js  # Lógica de notificações
└── scheduler.js            # Agendamento automático
```

#### **Componentes Principais**

**1. gmailService.js**
- Autenticação OAuth 2.0 com Gmail API
- Função `sendEmail()` para envio
- Gerenciamento de tokens
- Validação de autorização

**2. emailConfig.js**
- Mapeamento de secretarias → emails
- Funções de templates HTML/texto
- Configuração de remetente
- Busca de emails no banco de dados

**3. notificationService.js**
- Lógica de identificação de protocolos vencendo
- Agrupamento por secretaria
- Envio em lote
- Registro de notificações enviadas

**4. vencimentos.cron.js**
- Agendamento automático (diariamente às 8h)
- Execução das verificações
- Integração com o sistema de notificações

### 3.5 Processo de Envio

#### **Fluxo de Execução**

```
1. VERIFICAÇÃO DE VENCIMENTOS
   └──> Busca protocolos não concluídos
   └──> Calcula data de vencimento para cada um
   └──> Identifica protocolos vencendo em 15 dias, hoje, 30 dias, 60 dias

2. AGREGAÇÃO POR SECRETARIA
   └──> Agrupa protocolos por secretaria responsável
   └──> Busca email(s) da secretaria no banco de dados

3. PREVENÇÃO DE DUPLICATAS
   └──> Verifica se já foi notificado (tabela NotificacaoEmail)
   └──> Evita envios duplicados do mesmo tipo

4. GERAÇÃO DE TEMPLATES
   └──> Cria HTML e texto plano do email
   └──> Personaliza com dados da secretaria
   └──> Inclui tabela de protocolos

5. ENVIO VIA GMAIL API
   └──> Autentica com OAuth 2.0
   └──> Envia email para cada secretaria
   └──> Obtém messageId para rastreamento

6. REGISTRO NO BANCO
   └──> Salva cada notificação em NotificacaoEmail
   └──> Armazena: protocolo, secretaria, tipo, messageId, status
```

### 3.6 Configuração de Emails

#### **Mapeamento de Secretarias**

O sistema busca emails em duas fontes (em ordem):

**1. Banco de Dados** (`SecretariaInfo`)
```javascript
// Busca dinâmica no banco
await prisma.secretariaInfo.findFirst({
    where: { name: { contains: secretaria } }
});
```

**2. Mapeamento Estático** (`emailConfig.js`)
```javascript
export const SECRETARIAS_EMAILS = {
    'Secretaria Municipal de Saúde': 'smsdc@duquedecaxias.rj.gov.br',
    'Secretaria Municipal de Educação': 'ouvidoriasme@smeduquedecaxias.rj.gov.br',
    // ... mais secretarias
};
```

#### **Fallback**
Se não encontrar email:
- Usa `EMAIL_PADRAO = 'ouvidoria@duquedecaxias.rj.gov.br'`

### 3.7 Templates de Email

Todos os templates incluem:
- **HTML**: Versão formatada com estilos CSS inline
- **Texto plano**: Versão simplificada para clientes que não suportam HTML
- **Tabela de protocolos**: Lista formatada dos protocolos envolvidos
- **Informações contextuais**: Datas, prazos, dias restantes
- **CTA (Call to Action)**: Link para o sistema de Ouvidoria

**Exemplo de estrutura:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Estilos CSS inline */
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Cabeçalho com logo/título -->
        </div>
        <div class="content">
            <!-- Alerta principal -->
            <!-- Informações da secretaria -->
            <!-- Tabela de protocolos -->
            <!-- CTA -->
        </div>
        <div class="footer">
            <!-- Rodapé com informações legais -->
        </div>
    </div>
</body>
</html>
```

### 3.8 Automação (Cron Jobs)

#### **Agendamento Automático**

O sistema executa automaticamente **diariamente às 8h da manhã**:

```javascript
// vencimentos.cron.js
cron.schedule('0 8 * * *', async () => {
    // Verifica vencimentos e envia emails
});
```

#### **Processos Executados**

1. **Verificação de 15 dias**
2. **Verificação de vencimento (hoje)**
3. **Verificação de 30 dias vencido**
4. **Verificação de 60 dias vencido**
5. **Envio de resumo para Ouvidoria Geral**

### 3.9 Execução Manual

#### **Via API**

```bash
# Executar todas as notificações
POST /api/notifications/execute
{
    "tipo": "todas"
}

# Executar tipo específico
POST /api/notifications/execute
{
    "tipo": "15_dias" | "vencimento" | "30_dias" | "60_dias"
}
```

#### **Via Controller**

```bash
# Enviar selecionados
POST /api/notificacoes/enviar-selecionados
{
    "tipo": "hoje",
    "secretarias": ["Secretaria A", "Secretaria B"]
}
```

### 3.10 Rastreamento e Histórico

#### **Tabela NotificacaoEmail**

Cada email enviado é registrado:

```prisma
model NotificacaoEmail {
    id               String   @id @default(auto()) @map("_id") @db.ObjectId
    protocolo        String?
    secretaria       String?
    emailSecretaria  String?
    tipoNotificacao  String?  // "15_dias", "vencimento", "30_dias", "60_dias"
    dataVencimento   String?
    diasRestantes    Int?
    messageId        String?  // ID do Gmail para rastreamento
    status           String?  // "enviado", "erro"
    mensagemErro     String?
    dataEnvio        DateTime @default(now())
}
```

#### **Endpoints de Consulta**

```bash
# Histórico de notificações
GET /api/notifications/history?limit=50&offset=0

# Estatísticas
GET /api/notifications/stats?periodo=30

# Buscar vencimentos
GET /api/notificacoes/vencimentos?tipo=hoje
```

### 3.11 Autenticação Gmail API

#### **Configuração OAuth 2.0**

**Arquivos necessários:**
- `gmail-credentials.json` - Credenciais OAuth 2.0 (Client ID/Secret)
- `gmail-token.json` - Token de acesso (gerado após autorização)

**Processo de autorização:**
1. Obter URL de autorização: `GET /api/notifications/auth/url`
2. Acessar URL no navegador
3. Fazer login e autorizar
4. Copiar código da URL de retorno
5. Enviar código: `POST /api/notifications/auth/callback`
6. Token salvo automaticamente em `gmail-token.json`

**Verificar status:**
```bash
GET /api/notifications/auth/status
```

---

## 4. FLUXO COMPLETO END-TO-END

### 4.1 Fluxo de Dados Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE DRIVE/SHEETS                      │
│                                                             │
│  [Planilha Bruta] ────────┐                                │
│  (Última da pasta)         │                                │
│                            ▼                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ (Leitura)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE PYTHON                          │
│                                                             │
│  1. Autenticação Google                                     │
│  2. Leitura planilha bruta                                  │
│  3. Normalização de colunas                                 │
│  4. Tratamento de dados                                     │
│     - Datas → YYYY-MM-DD                                    │
│     - Textos canonizados                                    │
│     - Órgãos mapeados                                       │
│  5. Comparação com planilha tratada                         │
│  6. Identificação novos vs. existentes                      │
│  7. Escrita na planilha tratada                             │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ (Escrita)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              PLANILHA TRATADA (GOOGLE SHEETS)               │
│                                                             │
│  [Dados Normalizados e Estruturados]                        │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ (Leitura)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│            SCRIPT NODE.JS (runPipeline.js)                  │
│                                                             │
│  1. Executa pipeline Python                                 │
│  2. Lê planilha tratada atualizada                          │
│  3. Normaliza para schema MongoDB                           │
│  4. Salva no banco                                          │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ (Salvamento)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB ATLAS                            │
│                                                             │
│  Collection: records                                        │
│  - Protocolos                                               │
│  - Datas normalizadas                                       │
│  - Órgãos e secretarias                                     │
│  - Status e categorias                                      │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ (Leitura para notificações)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              SISTEMA DE NOTIFICAÇÕES                        │
│                                                             │
│  1. Cron diário (8h)                                        │
│  2. Busca protocolos vencendo                               │
│  3. Calcula prazos                                          │
│  4. Agrupa por secretaria                                   │
│  5. Gera templates                                          │
│  6. Envia via Gmail API                                     │
│  7. Registra no banco                                       │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ (Envio)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    EMAILS ENVIADOS                          │
│                                                             │
│  Secretarias recebem notificações:                          │
│  - 15 dias antes                                            │
│  - Dia do vencimento                                        │
│  - 30 dias após                                             │
│  - 60 dias após                                             │
│                                                             │
│  Ouvidoria recebe resumo diário                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Timing e Frequência

| Processo | Frequência | Horário |
|----------|-----------|---------|
| **Pipeline** | Manual ou agendado | - |
| **Importação Google Sheets** | Manual | - |
| **Notificações de Email** | Diário | 08:00 (horário de Brasília) |
| **Resumo Ouvidoria** | Diário | 08:00 (junto com notificações) |

---

## 5. CONFIGURAÇÃO E SETUP

### 5.1 Variáveis de Ambiente

#### **Google Sheets**
```env
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_ID=1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g
GOOGLE_SHEET_RANGE=Dados!A1:Z1000  # Opcional
GOOGLE_FOLDER_BRUTA=1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5
```

#### **Gmail/Email**
```env
EMAIL_REMETENTE=ouvidoria@duquedecaxias.rj.gov.br
NOME_REMETENTE=Ouvidoria Geral de Duque de Caxias
EMAIL_PADRAO_SECRETARIAS=ouvidoria@duquedecaxias.rj.gov.br
EMAIL_OUVIDORIA_GERAL=ouvgeral.gestao@gmail.com
```

#### **Pipeline**
```env
SKIP_PYTHON=false  # true para pular execução do Python
```

### 5.2 Arquivos de Credenciais

#### **Google Service Account**
- **Localização**: `.github/workflows/credentials.json` (Base64)
- **Formato**: JSON codificado em Base64
- **Permissões**: Google Drive + Google Sheets API

#### **Gmail OAuth 2.0**
- **gmail-credentials.json**: Client ID/Secret do OAuth
- **gmail-token.json**: Token de acesso (gerado após autorização)

**⚠️ IMPORTANTE**: Esses arquivos devem estar no `.gitignore`!

### 5.3 Comandos Úteis

#### **Executar Pipeline Completo**
```bash
npm run pipeline
```

#### **Importar do Google Sheets**
```bash
npm run update:sheets
```

#### **Autorizar Gmail**
```bash
npm run gmail:auth
```

#### **Testar Email**
```bash
GET http://localhost:3000/api/notifications/test?email=teste@example.com
```

#### **Verificar Status de Autorização**
```bash
GET http://localhost:3000/api/notifications/auth/status
```

### 5.4 Troubleshooting

#### **Pipeline não encontra planilha bruta**
- Verificar `GOOGLE_FOLDER_BRUTA` no `.env`
- Verificar se Service Account tem acesso à pasta
- Verificar se há planilhas na pasta

#### **Emails não estão sendo enviados**
- Verificar autorização Gmail: `GET /api/notifications/auth/status`
- Verificar logs do servidor
- Verificar se cron está rodando
- Verificar se há protocolos vencendo

#### **Planilha não atualiza no banco**
- Verificar se pipeline executou com sucesso
- Verificar logs do pipeline (`pipeline_tratamento.log`)
- Verificar conexão com MongoDB
- Verificar variáveis de ambiente

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- [Setup Google Sheets](./setup/GOOGLE_SHEETS_SETUP.md)
- [Setup Pipeline](./setup/PIPELINE_SETUP.md)
- [Setup Gmail](./setup/SETUP_GMAIL.md)
- [README Sistema de Emails](../services/email-notifications/README.md)
- [README Cron](../cron/README.md)

---

**Última atualização**: Dezembro 2024  
**Mantido por**: CÉREBRO X-3

