# 🗺️ Mapeamento Completo e Organizado do Sistema

**Versão:** 3.0.0  
**Data:** 2025-11-27  
**Status:** ✅ Sistema Completo e Funcional

---

## 📁 Estrutura de Diretórios Completa

```
Dashboard/
│
├── 📂 NOVO/                          # ⭐ SISTEMA ATUAL (TUDO AQUI)
│   │
│   ├── 📂 src/                       # 🔧 BACKEND
│   │   ├── server.js                  # 🚀 Servidor Express principal
│   │   │
│   │   ├── 📂 api/                    # 🌐 API REST
│   │   │   ├── 📂 controllers/        # 🎮 Controladores (19 arquivos)
│   │   │   │   ├── aggregateController.js      # Agregações
│   │   │   │   ├── aiController.js               # IA/Chat
│   │   │   │   ├── cacheController.js            # Cache
│   │   │   │   ├── chatController.js             # Chat Cora
│   │   │   │   ├── colabController.js            # Colab
│   │   │   │   ├── complaintsController.js       # Reclamações
│   │   │   │   ├── dashboardController.js        # Dashboard
│   │   │   │   ├── distinctController.js        # Valores distintos
│   │   │   │   ├── filterController.js           # Filtros
│   │   │   │   ├── geographicController.js       # Geografia
│   │   │   │   ├── notificationController.js    # Notificações
│   │   │   │   ├── recordsController.js         # Registros
│   │   │   │   ├── slaController.js             # SLA
│   │   │   │   ├── statsController.js           # Estatísticas
│   │   │   │   ├── summaryController.js        # Resumo
│   │   │   │   ├── unitController.js            # Unidades
│   │   │   │   ├── utilsController.js           # Utilitários
│   │   │   │   ├── vencimentoController.js     # Vencimentos
│   │   │   │   └── zeladoriaController.js       # Zeladoria
│   │   │   │
│   │   │   └── 📂 routes/             # 🛣️ Rotas (11 arquivos)
│   │   │       ├── index.js           # Rotas principais
│   │   │       ├── aggregate.js       # /api/aggregate/*
│   │   │       ├── ai.js              # /api/ai/*
│   │   │       ├── cache.js           # /api/cache/*
│   │   │       ├── chat.js            # /api/chat/*
│   │   │       ├── colab.js           # /api/colab/*
│   │   │       ├── data.js            # /api/data/*
│   │   │       ├── geographic.js      # /api/geographic/*
│   │   │       ├── notifications.js   # /api/notifications/*
│   │   │       ├── stats.js           # /api/stats/*
│   │   │       └── zeladoria.js       # /api/zeladoria/*
│   │   │
│   │   ├── 📂 config/                 # ⚙️ Configurações
│   │   │   ├── cache.js               # Configuração de cache
│   │   │   └── database.js            # Configuração do banco
│   │   │
│   │   ├── 📂 cron/                   # ⏰ Tarefas Agendadas
│   │   │   ├── vencimentos.cron.js    # Cron de vencimentos
│   │   │   └── README.md              # Documentação cron
│   │   │
│   │   ├── 📂 services/               # 🔌 Serviços
│   │   │   └── 📂 email-notifications/
│   │   │       ├── emailConfig.js     # Configuração de email
│   │   │       ├── gmailService.js    # Serviço Gmail
│   │   │       ├── notificationService.js  # Serviço de notificações
│   │   │       ├── scheduler.js       # Agendador
│   │   │       └── README.md          # Documentação
│   │   │
│   │   └── 📂 utils/                  # 🛠️ Utilitários Backend
│   │       ├── cacheBuilder.js         # Construtor de cache
│   │       ├── cacheManager.js        # Gerenciador de cache
│   │       ├── dateUtils.js           # Utilitários de data
│   │       ├── dbCache.js             # Cache do banco
│   │       ├── districtMapper.js      # Mapeador de distritos
│   │       ├── fieldMapper.js        # Mapeador de campos
│   │       ├── geminiHelper.js       # Helper Gemini AI
│   │       ├── queryOptimizer.js     # Otimizador de queries
│   │       └── responseHelper.js     # Helper de respostas
│   │
│   ├── 📂 public/                     # 🎨 FRONTEND
│   │   ├── index.html                  # HTML principal (Ouvidoria)
│   │   ├── zeladoria.html              # HTML Zeladoria
│   │   ├── test-pages.html            # Página de testes
│   │   ├── dc-logo.png                # Logo
│   │   ├── sw.js                      # Service Worker
│   │   │
│   │   └── 📂 scripts/                # 📜 JavaScript Frontend
│   │       ├── main.js                # 🎯 Script principal (SPA)
│   │       ├── zeladoria-main.js      # Script principal Zeladoria
│   │       ├── test-all-pages.js      # Teste de páginas
│   │       │
│   │       ├── 📂 core/               # 🔧 Core do Sistema
│   │       │   ├── config.js          # Configuração global
│   │       │   ├── dataLoader.js      # Carregador de dados
│   │       │   ├── global-store.js   # Store global
│   │       │   ├── chart-factory.js  # Factory de gráficos
│   │       │   ├── chart-communication.js  # Comunicação entre gráficos
│   │       │   ├── chart-legend.js   # Legenda de gráficos
│   │       │   └── advanced-charts.js # Gráficos avançados (Plotly)
│   │       │
│   │       ├── 📂 pages/              # 📄 Páginas (34 arquivos)
│   │       │   │
│   │       │   ├── 🏛️ OUVIDORIA (23 páginas)
│   │       │   │   ├── overview.js           # Visão Geral
│   │       │   │   ├── orgao-mes.js          # Por Órgão e Mês
│   │       │   │   ├── tempo-medio.js        # Tempo Médio
│   │       │   │   ├── vencimento.js         # Vencimento
│   │       │   │   ├── tema.js               # Por Tema
│   │       │   │   ├── assunto.js             # Por Assunto
│   │       │   │   ├── cadastrante.js         # Por Cadastrante
│   │       │   │   ├── reclamacoes.js         # Reclamações
│   │       │   │   ├── projecao-2026.js       # Projeção 2026
│   │       │   │   ├── canal.js               # Canal
│   │       │   │   ├── secretaria.js          # Secretaria
│   │       │   │   ├── secretarias-distritos.js  # Secretarias e Distritos
│   │       │   │   ├── tipo.js                # Tipo
│   │       │   │   ├── status.js              # Status
│   │       │   │   ├── categoria.js           # Categoria
│   │       │   │   ├── setor.js               # Setor
│   │       │   │   ├── responsavel.js         # Responsável
│   │       │   │   ├── prioridade.js          # Prioridade
│   │       │   │   ├── bairro.js              # Bairro
│   │       │   │   ├── uac.js                 # UAC
│   │       │   │   ├── unidades-saude.js     # Unidades de Saúde
│   │       │   │   ├── unit.js                # Unidade (dinâmico)
│   │       │   │   └── cora-chat.js           # Chat Cora
│   │       │   │
│   │       │   └── 🏗️ ZELADORIA (11 páginas)
│   │       │       ├── zeladoria-overview.js      # Visão Geral
│   │       │       ├── zeladoria-status.js         # Por Status
│   │       │       ├── zeladoria-categoria.js      # Por Categoria
│   │       │       ├── zeladoria-departamento.js   # Por Departamento
│   │       │       ├── zeladoria-bairro.js         # Por Bairro
│   │       │       ├── zeladoria-responsavel.js    # Por Responsável
│   │       │       ├── zeladoria-canal.js           # Por Canal
│   │       │       ├── zeladoria-tempo.js          # Tempo
│   │       │       ├── zeladoria-mensal.js         # Mensal
│   │       │       ├── zeladoria-geografica.js     # Geográfica
│   │       │       └── zeladoria-colab.js          # Colab
│   │       │
│   │       ├── 📂 modules/            # 📦 Módulos
│   │       │   └── data-tables.js     # Tabelas de dados
│   │       │
│   │       └── 📂 utils/              # 🛠️ Utilitários Frontend
│   │           ├── logger.js          # Logger
│   │           ├── dateUtils.js      # Utilitários de data
│   │           ├── timerManager.js    # Gerenciador de timers
│   │           ├── lazy-libraries.js  # Carregamento lazy
│   │           └── generate-unit-pages.js  # Gerador de páginas
│   │
│   ├── 📂 scripts/                    # 🔧 Scripts de Manutenção
│   │   │
│   │   ├── 🚀 PRINCIPAIS
│   │   │   ├── runPipeline.js        # Pipeline completo
│   │   │   ├── setup.js               # Setup do sistema
│   │   │   ├── setup-python.js        # Setup Python
│   │   │   ├── updateFromGoogleSheets.js  # Atualização Google Sheets
│   │   │   └── updateFromExcel.js    # Atualização Excel
│   │   │
│   │   ├── 🧪 TESTES
│   │   │   ├── test-all-pages.js     # Testa todas as páginas
│   │   │   ├── run-page-tests.js      # Executa testes
│   │   │   ├── testGoogleSheets.js   # Testa Google Sheets
│   │   │   ├── testGeminiKeys.js     # Testa chaves Gemini
│   │   │   └── TESTE_PAGINAS_README.md  # Documentação testes
│   │   │
│   │   ├── 📧 EMAIL
│   │   │   ├── autorizar-gmail.js     # Autorização Gmail
│   │   │   ├── enviar-email-real.js   # Envia email real
│   │   │   ├── enviar-email-saude.js  # Envia email saúde
│   │   │   └── enviar-resumo-ouvidoria-hoje.js  # Resumo diário
│   │   │
│   │   ├── 🔍 VERIFICAÇÃO
│   │   │   ├── validateUnidadesSaude.js  # Valida unidades
│   │   │   ├── checkPrazoMais200.js     # Verifica prazos
│   │   │   ├── checkZeladoria.js        # Verifica Zeladoria
│   │   │   ├── infoDatabase.js          # Info do banco
│   │   │   └── normalizeFields.js      # Normaliza campos
│   │   │
│   │   ├── 💾 DADOS
│   │   │   ├── importZeladoria.js       # Importa Zeladoria
│   │   │   └── limpar-arquivos-antigos.js  # Limpeza
│   │   │
│   │   └── 🛠️ SERVIDOR
│   │       ├── restart-server.bat      # Restart + Prisma (Windows)
│   │       └── restart-server.ps1      # Restart + Prisma (Windows)
│   │
│   ├── 📂 prisma/                     # 🗄️ ORM e Schema
│   │   └── schema.prisma              # Schema do banco de dados
│   │
│   ├── 📂 data/                       # 📊 Dados Estáticos
│   │   ├── secretarias-distritos.json # Secretarias e distritos
│   │   └── unidades-saude.json        # Unidades de saúde
│   │
│   ├── 📂 db-data/                    # 💾 Cache Persistente
│   │   └── (cache files)
│   │
│   ├── 📜 SCRIPTS DE SERVIDOR (Raiz)
│   │   ├── restart.sh                 # Restart (Linux)
│   │   ├── restart.ps1                # Restart (Windows)
│   │   ├── stop.sh                    # Stop (Linux)
│   │   ├── stop.ps1                   # Stop (Windows)
│   │   ├── start.sh                   # Start (Linux)
│   │   ├── start-background.sh        # Start background (Linux)
│   │   └── status.sh                  # Status (Linux)
│   │
│   ├── 📄 CONFIGURAÇÃO
│   │   ├── package.json               # Dependências e scripts
│   │   ├── .env                       # Variáveis de ambiente
│   │   ├── .gitignore                 # Arquivos ignorados
│   │   └── google-credentials.json   # Credenciais Google
│   │
│   └── 📚 DOCUMENTAÇÃO
│       ├── README.md                  # (raiz) Documentação principal
│       ├── GOOGLE_SHEETS_SETUP.md     # Setup Google Sheets
│       ├── PIPELINE_SETUP.md          # Setup Pipeline
│       ├── SETUP_GMAIL.md             # Setup Gmail
│       ├── TROUBLESHOOTING_GMAIL.md   # Troubleshooting Gmail
│       ├── TESTE_EMAIL.md             # Teste de email
│       ├── RELATORIO_TESTE_CHAVES_GEMINI.md  # Relatório Gemini
│       ├── LIMPEZA_ARQUIVOS.md        # Guia de limpeza
│       ├── MAPEAMENTO_SISTEMA.md      # Mapeamento básico
│       ├── MAPEAMENTO_COMPLETO_SISTEMA.md  # Este arquivo
│       ├── ANALISE_SCRIPTS_SERVIDOR.md  # Análise scripts
│       ├── VERIFICACAO_PAGINAS_COMPLETA.md  # Verificação páginas
│       └── RESUMO_ORGANIZACAO.md      # Resumo organização
│
├── 📂 Pipeline/                       # 🐍 PIPELINE PYTHON
│   ├── main.py                        # Script principal
│   ├── requirements.txt               # Dependências Python
│   └── rodar_pipeline.yml             # GitHub Actions
│
├── 📂 ANTIGO/                         # 📦 Código Antigo (Referência)
│   └── (código da versão anterior)
│
└── 📄 ROOT
    ├── README.md                      # Documentação principal
    └── package.json                   # Scripts root
```

---

## 🎯 Componentes Principais

### 1. Backend (`src/`)

#### Servidor (`server.js`)
- **Framework:** Express.js
- **Middlewares:** compression, cors, morgan
- **Porta:** 3000 (configurável via `.env`)
- **Health Check:** `/api/health`

#### APIs (`src/api/`)

**19 Controllers:**
1. `aggregateController` - Agregações complexas
2. `aiController` - Inteligência Artificial
3. `cacheController` - Gerenciamento de cache
4. `chatController` - Chat Cora
5. `colabController` - Integração Colab
6. `complaintsController` - Reclamações e denúncias
7. `dashboardController` - Dashboard principal
8. `distinctController` - Valores distintos
9. `filterController` - Sistema de filtros
10. `geographicController` - Dados geográficos
11. `notificationController` - Notificações
12. `recordsController` - CRUD de registros
13. `slaController` - Cálculos de SLA
14. `statsController` - Estatísticas
15. `summaryController` - Resumo/KPIs
16. `unitController` - Unidades de saúde
17. `utilsController` - Utilitários
18. `vencimentoController` - Vencimentos
19. `zeladoriaController` - Zeladoria

**11 Rotas:**
- `/api/aggregate/*` - Agregações
- `/api/stats/*` - Estatísticas
- `/api/data/*` - Dados gerais
- `/api/cache/*` - Cache
- `/api/chat/*` - Chat
- `/api/ai/*` - IA
- `/api/colab/*` - Colab
- `/api/geographic/*` - Geografia
- `/api/notifications/*` - Notificações
- `/api/zeladoria/*` - Zeladoria
- `/api/*` - Rotas gerais

### 2. Frontend (`public/`)

#### Core (`scripts/core/`)
- `config.js` - Configuração global
- `dataLoader.js` - Carregamento unificado de dados
- `global-store.js` - Store global (estado)
- `chart-factory.js` - Factory de gráficos Chart.js
- `chart-communication.js` - Sistema de comunicação entre gráficos
- `chart-legend.js` - Legenda de gráficos
- `advanced-charts.js` - Gráficos avançados (Plotly.js)

#### Páginas (`scripts/pages/`)
- **34 páginas** implementadas
- Cada página tem função `load{Nome}`
- Integração com `dataLoader` e `chartFactory`

### 3. Banco de Dados (`prisma/`)

#### Schema (`schema.prisma`)
- `Record` - Registros de ouvidoria
- `Zeladoria` - Registros de zeladoria
- `ChatMessage` - Mensagens do chat
- `AggregationCache` - Cache de agregações

### 4. Pipeline Python (`Pipeline/`)

- `main.py` - Processa planilhas brutas
- Lê do Google Drive
- Processa e normaliza
- Atualiza planilha tratada

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                    GOOGLE DRIVE                         │
│              (Planilha Bruta)                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PIPELINE PYTHON                             │
│              (main.py)                                   │
│  • Lê planilha bruta                                     │
│  • Processa e normaliza                                  │
│  • Aplica _tratar_full                                   │
│  • Identifica novos protocolos                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              GOOGLE SHEETS                               │
│         (Planilha Tratada)                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         NODE.JS (updateFromGoogleSheets.js)             │
│  • Lê planilha tratada                                   │
│  • Compara com banco                                     │
│  • Atualiza apenas mudanças                              │
│  • Insere novos registros                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MONGODB ATLAS                               │
│         (Banco de Dados)                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         EXPRESS API (src/api/)                          │
│  • Rotas REST                                            │
│  • Cache híbrido                                         │
│  • Otimizações                                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         FRONTEND (public/scripts/)                       │
│  • SPA Vanilla JS                                        │
│  • Gráficos interativos                                  │
│  • Filtros globais                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Estatísticas do Sistema

### Arquivos
- **Backend:** 19 controllers + 11 routes + 9 utils = 39 arquivos
- **Frontend:** 7 core + 34 pages + 5 utils = 46 arquivos
- **Scripts:** 23 arquivos
- **Total:** ~108 arquivos principais

### Páginas
- **Ouvidoria:** 23 páginas
- **Zeladoria:** 11 páginas
- **Total:** 34 páginas

### APIs
- **Endpoints:** ~58 rotas
- **Controllers:** 19
- **Módulos:** 11

---

## 🎨 Padrões e Convenções

### Nomenclatura
- **Controllers:** `{nome}Controller.js`
- **Routes:** `{nome}.js`
- **Pages:** `{nome}.js` ou `zeladoria-{nome}.js`
- **Functions:** `load{Nome}` para páginas

### Estrutura de Páginas
```javascript
// Padrão de página
async function loadNome() {
  // 1. Carregar dados
  const data = await window.dataLoader.load('/api/endpoint');
  
  // 2. Renderizar gráficos
  await window.chartFactory.createChart(...);
  
  // 3. Configurar eventos
  // ...
}

// Exportar globalmente
window.loadNome = loadNome;
```

### Estrutura de Controllers
```javascript
// Padrão de controller
export async function getNome(req, res) {
  try {
    const data = await prisma.model.findMany(...);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 🔧 Scripts NPM

### Principais
- `npm start` - Inicia servidor
- `npm run pipeline` - Executa pipeline completo
- `npm run setup:python` - Setup Python
- `npm run clean:old` - Limpa arquivos antigos

### Dados
- `npm run update:sheets` - Atualiza do Google Sheets
- `npm run update:excel` - Atualiza do Excel
- `npm run import:zeladoria` - Importa Zeladoria

### Banco
- `npm run prisma:generate` - Gera cliente Prisma
- `npm run prisma:studio` - Abre Prisma Studio
- `npm run db:analyze` - Analisa estrutura

### Testes
- `npm run test:sheets` - Testa Google Sheets
- `npm test` - Executa testes

### Email
- `npm run gmail:auth` - Autoriza Gmail
- `npm run email:real` - Envia email real
- `npm run email:saude` - Envia email saúde

---

## 📝 Variáveis de Ambiente

```env
# Banco de Dados
MONGODB_ATLAS_URL=mongodb+srv://...
DATABASE_URL=mongodb+srv://...

# Servidor
PORT=3000

# Google
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_ID=...
GOOGLE_FOLDER_BRUTA=...

# Gemini AI
GEMINI_API_KEY_1=...
GEMINI_API_KEY_2=...
GEMINI_API_KEY_3=...

# Gmail
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
```

---

## ✅ Checklist de Funcionalidades

- [x] Dashboard principal
- [x] 34 páginas de análise
- [x] Sistema de filtros interligados
- [x] Cache híbrido (memória + banco + arquivo)
- [x] Pipeline Python completo
- [x] Integração Google Sheets
- [x] Sistema de emails automáticos
- [x] Chat com IA (Gemini)
- [x] Zeladoria completa
- [x] Testes automatizados
- [x] Documentação completa

---

## 🚀 Como Usar

### Iniciar Sistema
```bash
cd NOVO
npm install
npm start
```

### Executar Pipeline
```bash
npm run pipeline
```

### Limpar Arquivos Antigos
```bash
npm run clean:old
```

### Verificar Páginas
```bash
# Abrir no navegador
http://localhost:3000/test-pages.html
```

---

## 📚 Documentação Adicional

- `README.md` - Documentação principal
- `MAPEAMENTO_SISTEMA.md` - Mapeamento básico
- `LIMPEZA_ARQUIVOS.md` - Guia de limpeza
- `ANALISE_SCRIPTS_SERVIDOR.md` - Análise scripts
- `VERIFICACAO_PAGINAS_COMPLETA.md` - Verificação páginas

---

**Sistema Completo e Organizado! ✅**

