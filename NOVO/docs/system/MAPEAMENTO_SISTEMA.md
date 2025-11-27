# 🗺️ Mapeamento Completo do Sistema

## 📁 Estrutura de Diretórios

```
Dashboard/
├── NOVO/                          # ⭐ Sistema Atual (TUDO AQUI)
│   ├── src/                       # Backend
│   │   ├── server.js              # Servidor Express principal
│   │   ├── api/                   # APIs REST
│   │   │   ├── controllers/       # Controladores (19 arquivos)
│   │   │   └── routes/            # Rotas (11 arquivos)
│   │   ├── config/                # Configurações
│   │   ├── cron/                  # Tarefas agendadas
│   │   ├── services/               # Serviços (email, etc)
│   │   └── utils/                 # Utilitários
│   ├── public/                    # Frontend
│   │   ├── index.html             # HTML principal
│   │   ├── zeladoria.html         # HTML Zeladoria
│   │   └── scripts/               # JavaScript
│   │       ├── core/              # Core do sistema
│   │       ├── pages/             # Páginas (34 arquivos)
│   │       └── utils/             # Utilitários frontend
│   ├── scripts/                   # Scripts de manutenção
│   ├── prisma/                    # ORM e schema
│   ├── data/                      # Dados estáticos
│   └── *.md                       # Documentação
├── Pipeline/                      # Pipeline Python
│   ├── main.py                    # Script principal
│   └── requirements.txt           # Dependências Python
├── ANTIGO/                        # ⚠️ Código antigo (referência)
└── *.md                           # Documentação raiz (algumas obsoletas)
```

## 🎯 Componentes Principais

### 1. Backend (`NOVO/src/`)

#### Servidor (`server.js`)
- Express server
- Middlewares: compression, cors, morgan
- Servir arquivos estáticos
- Health check `/api/health`

#### APIs (`src/api/`)

**Controllers (19 arquivos):**
- `aggregateController.js` - Agregações
- `aiController.js` - IA/Chat
- `cacheController.js` - Cache
- `chatController.js` - Chat Cora
- `colabController.js` - Colab
- `complaintsController.js` - Reclamações
- `dashboardController.js` - Dashboard principal
- `distinctController.js` - Valores distintos
- `filterController.js` - Filtros
- `geographicController.js` - Geografia
- `notificationController.js` - Notificações
- `recordsController.js` - Registros
- `slaController.js` - SLA
- `statsController.js` - Estatísticas
- `summaryController.js` - Resumo
- `unitController.js` - Unidades
- `utilsController.js` - Utilitários
- `vencimentoController.js` - Vencimentos
- `zeladoriaController.js` - Zeladoria

**Routes (11 arquivos):**
- `index.js` - Rotas principais
- `aggregate.js` - Agregações
- `ai.js` - IA
- `cache.js` - Cache
- `chat.js` - Chat
- `colab.js` - Colab
- `data.js` - Dados
- `geographic.js` - Geografia
- `notifications.js` - Notificações
- `stats.js` - Estatísticas
- `zeladoria.js` - Zeladoria

#### Utilitários (`src/utils/`)
- `cacheBuilder.js` - Construtor de cache
- `cacheManager.js` - Gerenciador de cache
- `dateUtils.js` - Utilitários de data
- `dbCache.js` - Cache do banco
- `districtMapper.js` - Mapeador de distritos
- `fieldMapper.js` - Mapeador de campos
- `geminiHelper.js` - Helper Gemini AI
- `queryOptimizer.js` - Otimizador de queries
- `responseHelper.js` - Helper de respostas

#### Serviços (`src/services/`)
- `email-notifications/` - Sistema de emails
  - `emailConfig.js` - Configuração
  - `gmailService.js` - Serviço Gmail
  - `notificationService.js` - Serviço de notificações
  - `scheduler.js` - Agendador

#### Cron (`src/cron/`)
- `vencimentos.cron.js` - Tarefa de vencimentos

### 2. Frontend (`NOVO/public/`)

#### Core (`scripts/core/`)
- `advanced-charts.js` - Gráficos avançados
- `chart-communication.js` - Comunicação entre gráficos
- `chart-factory.js` - Factory de gráficos
- `chart-legend.js` - Legenda de gráficos
- `config.js` - Configuração global
- `dataLoader.js` - Carregador de dados
- `global-store.js` - Store global

#### Páginas (`scripts/pages/` - 34 arquivos)

**Ouvidoria:**
- `overview.js` - Visão Geral
- `orgao-mes.js` - Por Órgão e Mês
- `tempo-medio.js` - Tempo Médio
- `vencimento.js` - Vencimento
- `tema.js` - Por Tema
- `assunto.js` - Por Assunto
- `cadastrante.js` - Por Cadastrante
- `reclamacoes.js` - Reclamações
- `projecao-2026.js` - Projeção 2026
- `canal.js` - Canal
- `secretaria.js` - Secretaria
- `secretarias-distritos.js` - Secretarias e Distritos
- `tipo.js` - Tipo
- `status.js` - Status
- `categoria.js` - Categoria
- `setor.js` - Setor
- `responsavel.js` - Responsável
- `prioridade.js` - Prioridade
- `bairro.js` - Bairro
- `uac.js` - UAC
- `unidades-saude.js` - Unidades de Saúde
- `unit.js` - Unidade
- `cora-chat.js` - Chat Cora

**Zeladoria:**
- `zeladoria-overview.js` - Visão Geral
- `zeladoria-status.js` - Por Status
- `zeladoria-categoria.js` - Por Categoria
- `zeladoria-departamento.js` - Por Departamento
- `zeladoria-bairro.js` - Por Bairro
- `zeladoria-responsavel.js` - Por Responsável
- `zeladoria-canal.js` - Por Canal
- `zeladoria-tempo.js` - Tempo
- `zeladoria-mensal.js` - Mensal
- `zeladoria-geografica.js` - Geográfica
- `zeladoria-colab.js` - Colab

#### Utilitários Frontend (`scripts/utils/`)
- `dateUtils.js` - Utilitários de data
- `generate-unit-pages.js` - Gerador de páginas
- `lazy-libraries.js` - Carregamento lazy
- `logger.js` - Logger
- `timerManager.js` - Gerenciador de timers

### 3. Scripts (`NOVO/scripts/`)

**Principais:**
- `runPipeline.js` - Pipeline completo
- `setup-python.js` - Setup Python
- `setup.js` - Setup do sistema
- `updateFromGoogleSheets.js` - Atualização Google Sheets
- `updateFromExcel.js` - Atualização Excel
- `importZeladoria.js` - Importação Zeladoria

**Testes:**
- `test-all-pages.js` - Testa todas as páginas
- `run-page-tests.js` - Executa testes
- `testGoogleSheets.js` - Testa Google Sheets
- `testGeminiKeys.js` - Testa chaves Gemini

**Email:**
- `enviar-email-real.js` - Envia email real
- `enviar-email-saude.js` - Envia email saúde
- `enviar-resumo-ouvidoria-hoje.js` - Resumo diário
- `autorizar-gmail.js` - Autorização Gmail

**Utilitários:**
- `validateUnidadesSaude.js` - Valida unidades
- `checkPrazoMais200.js` - Verifica prazos
- `checkZeladoria.js` - Verifica Zeladoria
- `normalizeFields.js` - Normaliza campos
- `infoDatabase.js` - Info do banco
- `limpar-arquivos-antigos.js` - Limpeza

### 4. Pipeline Python (`Pipeline/`)

- `main.py` - Script principal
  - Lê planilha bruta do Google Drive
  - Processa e normaliza dados
  - Adiciona novos protocolos à planilha tratada
- `requirements.txt` - Dependências
- `rodar_pipeline.yml` - GitHub Actions

### 5. Dados (`NOVO/data/`)

- `secretarias-distritos.json` - Secretarias e distritos
- `unidades-saude.json` - Unidades de saúde

### 6. Prisma (`NOVO/prisma/`)

- `schema.prisma` - Schema do banco
  - `Record` - Registros de ouvidoria
  - `Zeladoria` - Registros de zeladoria
  - `ChatMessage` - Mensagens do chat
  - `AggregationCache` - Cache de agregações

## 🔄 Fluxo de Dados

```
Google Drive (Planilha Bruta)
    ↓
Pipeline Python (main.py)
    ↓
Google Sheets (Planilha Tratada)
    ↓
Node.js (updateFromGoogleSheets.js)
    ↓
MongoDB Atlas
    ↓
API REST (Express)
    ↓
Frontend (Vanilla JS)
    ↓
Usuário
```

## 📊 APIs Principais

### Dados
- `GET /api/summary` - Resumo geral
- `GET /api/data` - Dados filtrados
- `GET /api/stats` - Estatísticas
- `GET /api/aggregate` - Agregações

### Filtros
- `GET /api/filters` - Valores para filtros
- `GET /api/distinct` - Valores distintos

### Específicos
- `GET /api/vencimento` - Vencimentos
- `GET /api/zeladoria/*` - Zeladoria
- `GET /api/geographic/*` - Geografia
- `GET /api/chat` - Chat
- `GET /api/ai` - IA

## 🎨 Frontend - Páginas

### Ouvidoria (23 páginas)
1. Visão Geral
2. Por Órgão e Mês
3. Tempo Médio
4. Vencimento
5. Por Tema
6. Por Assunto
7. Por Cadastrante
8. Reclamações
9. Projeção 2026
10-23. Páginas secundárias

### Zeladoria (11 páginas)
1. Visão Geral
2-11. Análises específicas

## 🔧 Comandos NPM

```bash
npm start              # Inicia servidor
npm run dev            # Modo desenvolvimento
npm run pipeline       # Executa pipeline completo
npm run setup:python   # Setup Python
npm run clean:old      # Limpa arquivos antigos
npm run update:sheets  # Atualiza do Google Sheets
```

## 📝 Documentação

### Atual (Manter)
- `README.md` - Documentação principal
- `NOVO/GOOGLE_SHEETS_SETUP.md` - Setup Google Sheets
- `NOVO/PIPELINE_SETUP.md` - Setup Pipeline
- `NOVO/SETUP_GMAIL.md` - Setup Gmail
- `NOVO/LIMPEZA_ARQUIVOS.md` - Limpeza
- `NOVO/MAPEAMENTO_SISTEMA.md` - Este arquivo

### Antiga (Pode remover)
- Ver `LIMPEZA_ARQUIVOS.md`

## 🔐 Variáveis de Ambiente

```env
# Banco de Dados
MONGODB_ATLAS_URL=
DATABASE_URL=

# Servidor
PORT=3000

# Google
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_ID=
GOOGLE_FOLDER_BRUTA=

# Gemini AI
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=

# Gmail
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
```

## ✅ Checklist de Funcionalidades

- [x] Dashboard principal
- [x] 34 páginas de análise
- [x] Sistema de filtros interligados
- [x] Cache híbrido
- [x] Pipeline Python
- [x] Integração Google Sheets
- [x] Sistema de emails
- [x] Chat com IA
- [x] Zeladoria
- [x] Testes automatizados

