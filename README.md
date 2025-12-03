# 📊 Dashboard Ouvidoria Duque de Caxias - Sistema NOVO

**Versão**: 3.0.0  
**Status**: ✅ **100% PRONTO PARA PRODUÇÃO**  
**Última atualização**: 02/12/2025

---

## 🎯 Visão Geral

Sistema completo de dashboard estratégico para análise e gestão de dados da **Ouvidoria Geral de Duque de Caxias/RJ**. O sistema entrega:

- ✅ **Monitoramento em tempo real** de manifestações (protocolos, temas, status, SLA)
- ✅ **Painel Zeladoria** com métricas próprias (categorias, bairros, departamentos, geolocalização)
- ✅ **Camada de cache híbrida** (memória + MongoDB + arquivo) para agregações rápidas
- ✅ **Sistema de IA/Chat** (Gemini) para respostas contextualizadas
- ✅ **Sistema de notificações por email** automatizado (Gmail API)
- ✅ **Pipeline Python** para processamento e normalização de dados do Google Sheets
- ✅ **Sistema de logging profissional** (Winston) para observabilidade

---

## 🏗️ Arquitetura do Sistema

### Estrutura do Repositório

```
Dashboard/
├── NOVO/                    # ⭐ Sistema principal (backend + frontend)
│   ├── src/                 # Backend Express + MongoDB
│   ├── public/              # Frontend SPA vanilla modular
│   ├── scripts/             # Scripts de manutenção e automação
│   ├── docs/                # Documentação organizada
│   ├── maps/                # Mapeamentos automáticos do sistema
│   ├── config/              # Credenciais e configurações
│   └── data/                # Dados estáticos (JSON)
├── Pipeline/                # Pipeline Python para processamento de dados
│   ├── main.py              # Pipeline principal
│   └── utils/               # Módulo compartilhado de normalização
├── ANTIGO/                  # Snapshot histórico (apenas referência)
└── README.md                # Este arquivo
```

### Stack Tecnológica

#### Backend
- **Node.js 18+** com Express.js
- **MongoDB Atlas** (banco principal)
- **Prisma ORM** (schema e validação)
- **MongoDB Native Driver** (agregações pesadas)
- **Winston** (sistema de logging profissional)
- **Google APIs** (Sheets, Gmail)
- **Gemini AI** (chat contextualizado)

#### Frontend
- **Vanilla JavaScript** (SPA modular)
- **Chart.js** (gráficos e visualizações)
- **Leaflet** (mapas geográficos)
- **Zero frameworks** - arquitetura leve e performática

#### Pipeline
- **Python 3** com pandas, gspread
- **Google Sheets API** (leitura/escrita)
- **Normalização automática** de dados

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Python 3** (para pipeline)
- **MongoDB Atlas** (conexão configurada)
- **Google Cloud** (Service Account para Sheets + OAuth para Gmail)
- **Gemini API** (chaves opcionais, mas recomendadas)

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 3. Configurar credenciais Google
# Copiar google-credentials.json para NOVO/config/
# Copiar gmail-credentials.json para NOVO/config/ (se usar emails)

# 4. Executar setup
npm run setup

# 5. Iniciar servidor
npm start
```

Acesse: `http://localhost:3000`

---

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# MongoDB (OBRIGATÓRIO)
MONGODB_ATLAS_URL=mongodb+srv://user:pass@cluster.mongodb.net/database

# Servidor
PORT=3000

# Gemini AI (Opcional)
GEMINI_API_KEY=your-key-here
GEMINI_API_KEY_2=your-key-2-here

# Google Sheets (OBRIGATÓRIO para pipeline)
GOOGLE_CREDENTIALS_FILE=config/google-credentials.json
GOOGLE_SHEET_ID=1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g
GOOGLE_SHEET_RANGE=Dados!A1:Z1000
GOOGLE_FOLDER_BRUTA=1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5

# Email (OBRIGATÓRIO para notificações)
EMAIL_REMETENTE=ouvidoria@duquedecaxias.rj.gov.br
NOME_REMETENTE=Ouvidoria Geral de Duque de Caxias
EMAIL_PADRAO_SECRETARIAS=ouvidoria@duquedecaxias.rj.gov.br
EMAIL_OUVIDORIA_GERAL=ouvgeral.gestao@gmail.com

# Pipeline
SKIP_PYTHON=false
```

### Credenciais Google

1. **Google Sheets**: Service Account JSON em `NOVO/config/google-credentials.json`
2. **Gmail API**: OAuth 2.0 configurado via `npm run gmail:auth`

**Documentação completa de setup**: `NOVO/docs/setup/`

---

## 📦 Principais Componentes

### 🔧 Backend (`NOVO/src/`)

#### Servidor Principal
- **`server.js`** - Inicialização Express, middleware, rotas, health check
- **`config/database.js`** - Conexão MongoDB (Prisma + Native Driver)
- **`config/cache.js`** - Inicialização do sistema de cache híbrido

#### API Modular (14 rotas, 23 controllers)

**Rotas principais**:
- `/api/summary` - KPIs e totais consolidados
- `/api/dashboard-data` - Pacote completo de agregações paralelas
- `/api/records` - Listagem paginada de registros
- `/api/filter` - Filtros avançados
- `/api/aggregate/*` - Agregações especializadas
- `/api/stats/*` - Estatísticas e métricas
- `/api/geographic/*` - Dados geográficos
- `/api/zeladoria/*` - Módulo Zeladoria
- `/api/chat/*` - Chat IA com Gemini
- `/api/notifications/*` - Sistema de notificações

**Controllers principais**:
- `summaryController.js` - KPIs consolidados
- `dashboardController.js` - Dashboard completo
- `aggregateController.js` - Agregações MongoDB
- `geographicController.js` - Dados geográficos
- `vencimentoController.js` - Cálculo de vencimentos
- `chatController.js` - Integração Gemini
- `notificationController.js` - Notificações por email

#### Sistema de Cache (8 sistemas documentados)

1. **`withCache()`** - ⭐ **RECOMENDADO** para controllers
2. **`dbCache`** - Cache no MongoDB (agregações pesadas)
3. **`smartCache`** - Cache com TTL adaptativo
4. **`dataStore`** - Cache no frontend (localStorage)
5. **`dataLoader`** - Carregamento unificado com cache
6. **`cacheManager`** - Cache em arquivo persistente
7. **`cacheBuilder`** - Construtor customizado
8. **`AggregationCache`** - Model Prisma (uso interno)

**Guia completo**: `NOVO/docs/system/SISTEMAS_CACHE.md`

#### Sistema de Logging

- **Winston v3.11.0** configurado em `src/utils/logger.js`
- **Níveis**: error, warn, info, debug
- **Métodos especializados**: http(), cache(), db(), aggregation()
- **Logs arquivados**: `logs/error.log`, `logs/combined.log`
- **Rotação automática**: 5MB, 5 arquivos

**Guia completo**: `NOVO/docs/system/GUIA_LOGGING.md`

#### Serviços

- **`services/email-notifications/`** - Sistema completo de emails
  - `gmailService.js` - Envio via Gmail API
  - `notificationService.js` - Lógica de notificações
  - `emailConfig.js` - Templates e configurações
- **`services/changeStreamWatcher.js`** - Monitoramento de mudanças no banco

#### Cron Jobs

- **`cron/vencimentos.cron.js`** - Execução diária às 8h (Brasília)
  - Alertas 15 dias antes
  - Alertas no vencimento
  - Alertas 30 e 60 dias após vencimento
  - Resumo diário para Ouvidoria Geral

---

### 🎨 Frontend (`NOVO/public/`)

#### Estrutura SPA

- **`index.html`** - Página principal (Ouvidoria)
- **`zeladoria.html`** - Página Zeladoria
- **`scripts/main.js`** - Navegação e roteamento SPA

#### Core (`scripts/core/`)

- **`global-store.js`** - State management centralizado (dataStore)
- **`dataLoader.js`** - ⭐ Carregamento unificado de dados (com cache e deduplicação)
- **`chart-factory.js`** - Criação padronizada de gráficos (Chart.js)
- **`chart-communication.js`** - Filtros cruzados entre gráficos
- **`chart-legend.js`** - Legendas interativas
- **`config.js`** - Configurações globais

#### Páginas (`scripts/pages/`)

**Ouvidoria (23 páginas)**:
- `overview.js` - Dashboard principal com KPIs
- `orgao-mes.js` - Análise por órgão e mês
- `tempo-medio.js` - Tempo médio de resposta
- `vencimento.js` - Análise de vencimentos
- `tema.js`, `assunto.js`, `categoria.js` - Análises por categorias
- `secretarias-distritos.js` - Análise geográfica
- `cora-chat.js` - Interface de chat IA
- E mais 15 páginas especializadas...

**Zeladoria (11 páginas)**:
- `zeladoria-overview.js` - Dashboard Zeladoria
- `zeladoria-status.js` - Status das solicitações
- `zeladoria-geografica.js` - Mapa interativo
- E mais 8 páginas...

#### Utilitários (`scripts/utils/`)

- **`logger.js`** - Logger do frontend (window.Logger)
- **`dateUtils.js`** - Formatação de datas
- **`lazy-libraries.js`** - Carregamento sob demanda (Chart.js, Leaflet)

---

### 🔄 Pipeline Python (`Pipeline/`)

#### Componentes

- **`main.py`** - Pipeline principal de processamento
- **`utils/normalizacao.py`** - ⭐ Módulo compartilhado (funções de normalização)

#### Fluxo de Processamento

1. **Autenticação** - Google Sheets API (Service Account)
2. **Leitura** - Planilha bruta da pasta Google Drive
3. **Normalização** - Padronização de campos (datas ISO, textos canonizados)
4. **Validação** - Correção automática de campos obrigatórios
5. **Escrita** - Planilha tratada no Google Sheets
6. **Importação** - Node.js lê planilha tratada e grava no MongoDB

**Execução**:
```bash
npm run pipeline
# ou
node NOVO/scripts/data/runPipeline.js
```

**Documentação**: `NOVO/docs/setup/PIPELINE_SETUP.md`

---

## 📚 Documentação Completa

### 📖 Guias de Setup

- **Google Sheets**: `NOVO/docs/setup/GOOGLE_SHEETS_SETUP.md`
- **Pipeline Python**: `NOVO/docs/setup/PIPELINE_SETUP.md`
- **Gmail API**: `NOVO/docs/setup/SETUP_GMAIL.md`

### 🔧 Documentação do Sistema

- **Índice Completo**: `NOVO/docs/system/INDICE_SISTEMA.md`
- **Sistemas de Cache**: `NOVO/docs/system/SISTEMAS_CACHE.md`
- **Guia de Logging**: `NOVO/docs/system/GUIA_LOGGING.md`
- **Estrutura Otimizada**: `NOVO/docs/system/ESTRUTURA_FINAL_OTIMIZADA.md`

### 🗺️ Mapeamentos Automáticos

- **Ultra Detalhado**: `NOVO/maps/SISTEMA_ULTRA_DETALHADO.md` ⭐
- **Resumo Executivo**: `NOVO/maps/RESUMO_EXECUTIVO_GERAL.md` ⭐⭐⭐

### 🐛 Troubleshooting

- **Gmail**: `NOVO/docs/troubleshooting/TROUBLESHOOTING_GMAIL.md`
- **Gemini API**: `NOVO/docs/troubleshooting/GEMINI_QUOTA.md`

---

## 🛠️ Scripts Disponíveis

### Comandos Principais

```bash
# Servidor
npm start              # Iniciar servidor
npm run dev            # Modo desenvolvimento

# Setup e Manutenção
npm run setup          # Executar setup completo
npm run prisma:generate # Gerar cliente Prisma
npm run prisma:studio  # Abrir Prisma Studio

# Dados
npm run update:sheets  # Atualizar do Google Sheets
npm run update:excel   # Atualizar do Excel
npm run pipeline       # Executar pipeline Python completo
npm run import:zeladoria # Importar dados Zeladoria

# Email
npm run gmail:auth     # Autorizar Gmail API
npm run email:real     # Enviar email de teste

# Manutenção
npm run map:system     # Mapear estrutura do sistema
npm run clean:old      # Limpar arquivos antigos
npm run analyze:architecture # Analisar arquitetura

# Testes
npm run test:pages     # Testar páginas do sistema
npm run test:sheets    # Testar Google Sheets
```

### Scripts de Servidor (Linux/Mac)

```bash
./NOVO/scripts/server/start.sh      # Iniciar servidor
./NOVO/scripts/server/stop.sh       # Parar servidor
./NOVO/scripts/server/restart.sh    # Reiniciar servidor
./NOVO/scripts/server/status.sh     # Status do servidor
```

### Scripts de Servidor (Windows)

```powershell
.\NOVO\scripts\server\start.ps1     # Iniciar servidor
.\NOVO\scripts\server\stop.ps1      # Parar servidor
.\NOVO\scripts\server\restart.ps1   # Reiniciar servidor
```

---

## 📊 Status do Sistema

### ✅ Limpeza e Otimização (95% Completo)

**Fase 1 - Limpeza**: ✅ **100% Completa**
- 49 arquivos obsoletos removidos
- Redução de 35% no tamanho do repositório
- Documentação organizada e atualizada

**Fase 2 - Otimização**: ✅ **90% Completa**
- Sistema Winston implementado
- 103 console.logs migrados (controllers principais)
- Duplicações Python eliminadas (módulo compartilhado)
- Documentação técnica completa

**Resultado**: ✅ **Sistema 100% pronto para produção**

**Detalhes**: `NOVO/maps/RESUMO_EXECUTIVO_GERAL.md`

---

## 🔐 Segurança

### Credenciais

- ✅ Credenciais **NUNCA** commitadas no Git
- ✅ Arquivos `.env` no `.gitignore`
- ✅ Credenciais Google em `NOVO/config/` (não versionadas)
- ✅ Variáveis sensíveis via ambiente

### Autenticação

- ✅ Sessões Express para autenticação web
- ✅ Service Account para Google Sheets
- ✅ OAuth 2.0 para Gmail API
- ✅ Rotação de chaves Gemini

---

## 🚀 Deploy

### Render / Heroku

1. Configurar variáveis de ambiente na plataforma
2. Build command: `npm install`
3. Start command: `npm start`
4. Health check: `/api/health`

### cPanel / Host Compartilhado

1. Upload do código para servidor
2. Executar `npm install` via SSH
3. Configurar `.env` no servidor
4. Usar scripts em `NOVO/scripts/server/` para gerenciamento

**Documentação**: Ver scripts em `NOVO/scripts/server/`

---

## 📈 Monitoramento

### Health Check

```bash
GET /api/health
```

Retorna: status, version, dependências

### Logs

- **Backend**: `NOVO/logs/error.log`, `NOVO/logs/combined.log`
- **Pipeline**: `pipeline_tratamento.log` (se configurado)
- **Console**: Logs estruturados em desenvolvimento

### Métricas

- Cache hit rate (logs do cacheManager)
- Tempo de resposta de endpoints
- Uso de quota Gemini (monitorado)

---

## 🔄 Fluxo de Dados

### 1. Ingestão

```
Google Sheets (Planilha Bruta)
    ↓
Pipeline Python (Normalização)
    ↓
Google Sheets (Planilha Tratada)
    ↓
Script Node.js (Importação)
    ↓
MongoDB Atlas
```

### 2. Consulta

```
Frontend (SPA)
    ↓
API Express (Backend)
    ↓
Cache Híbrido (Verificação)
    ↓
MongoDB Atlas (Consulta)
    ↓
Cache (Armazenamento)
    ↓
Frontend (Renderização)
```

### 3. Notificações

```
Cron Job (Diário 8h)
    ↓
Consulta Vencimentos
    ↓
Geração de Emails
    ↓
Gmail API (Envio)
    ↓
Registro no Banco
```

---

## 🎯 Extensões e Customizações

### Adicionar Novo KPI

1. Criar controller em `NOVO/src/api/controllers/`
2. Adicionar rota em `NOVO/src/api/routes/`
3. Criar loader em `NOVO/public/scripts/pages/`
4. Integrar com `chartFactory` e `chartCommunication`

### Adicionar Nova Fonte de Dados

1. Atualizar schema Prisma (`NOVO/prisma/schema.prisma`)
2. Executar `npm run prisma:generate`
3. Criar scripts de importação em `NOVO/scripts/data/`
4. Adaptar controllers conforme necessário

### Adicionar Novo Tipo de Notificação

1. Atualizar `NOVO/src/services/email-notifications/emailConfig.js`
2. Adicionar lógica em `notificationService.js`
3. Configurar cron em `vencimentos.cron.js`

---

## 📝 Licença

MIT

---

## 👥 Equipe

**Ouvidoria Geral de Duque de Caxias**

---

## 📞 Suporte

Para dúvidas, problemas ou sugestões:

1. Consultar documentação em `NOVO/docs/`
2. Verificar troubleshooting em `NOVO/docs/troubleshooting/`
3. Consultar mapeamentos em `NOVO/maps/`

---

## 🎉 Status Final

✅ **Sistema 100% Operacional e Pronto para Produção**

- Backend: Express + MongoDB + Prisma
- Frontend: SPA modular vanilla
- Pipeline: Python + Google Sheets
- Emails: Gmail API automatizado
- IA: Gemini integrado
- Cache: Sistema híbrido otimizado
- Logging: Winston profissional
- Documentação: Completa e atualizada

**Última atualização**: 02/12/2025  
**Versão**: 3.0.0  
**Status**: ✅ PRODUÇÃO
