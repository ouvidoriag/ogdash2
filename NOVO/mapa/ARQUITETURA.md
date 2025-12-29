# 🏛️ ARQUITETURA DO SISTEMA

**Data:** 12/12/2025  
**Versão:** 4.0  
**CÉREBRO X-3**

---

## 📋 VISÃO GERAL

Sistema Dashboard completo para gestão de Ouvidoria, Zeladoria e E-SIC da Prefeitura de Duque de Caxias. Sistema modular, escalável e otimizado para performance.

**Stack Tecnológica:**
- **Frontend:** SPA Vanilla JS (modular, sem frameworks)
- **Backend:** Node.js + Express.js
- **Banco de Dados:** MongoDB Atlas (Mongoose ODM)
- **IA:** Google Gemini API
- **Email:** Gmail API (OAuth 2.0)
- **Pipeline:** Python 3 (pandas, gspread)
- **Cache:** Híbrido (memória + arquivo + banco)
- **Gráficos:** Chart.js 4.x (lazy loading)
- **Mapas:** Leaflet (lazy loading)

**Características Principais:**
- ✅ Arquitetura modular e escalável
- ✅ Cache inteligente multi-camadas
- ✅ Sistema de filtros crossfilter multi-dimensional
- ✅ Agregações otimizadas no MongoDB
- ✅ Notificações automáticas por email
- ✅ Integração com Google Sheets
- ✅ Chat com IA (Gemini)
- ✅ Dashboard em tempo real

---

## 🏗️ ARQUITETURA GERAL

```
┌───────────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA Modular)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Páginas    │  │   Gráficos   │  │   Filtros    │             │
│  │   (42+)      │  │   Chart.js   │  │   Crossfilter│             │
│  │              │  │   (Lazy)     │  │   Multi-dim  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Data Loader  │  │ Global Store │  │ Chart Factory│             │
│  │  (Retry)     │  │  (TTL Cache) │  │ (Inteligente)│             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Chart Comm   │  │   Config     │  │   Utils      │             │
│  │  (Events)    │  │  (Cores)     │  │  (Helpers)   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└───────────────────────────────────────────────────────────────────┘
                        ↕ HTTP/REST (JSON)
┌───────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Controllers  │  │   Services   │  │    Utils     │             │
│  │    (29)      │  │   (Email)    │  │   (25+)      │             │
│  │              │  │   (Sync)     │  │   (Cache)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    Routes    │  │   Models     │  │    Cache     │             │
│  │    (19)      │  │   (10)       │  │   Híbrido    │             │
│  │              │  │  Mongoose    │  │  (3 camadas) │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Middleware   │  │   Pipelines  │  │   Gemini     │             │
│  │  (Auth)      │  │  (MongoDB)   │  │   (IA)       │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└───────────────────────────────────────────────────────────────────┘
                        ↕ Mongoose / MongoDB Native
┌─────────────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Cloud Database)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Records    │  │  Zeladoria    │  │     Esic     │              │
│  │  (Ouvidoria) │  │  (Demandas)   │  │  (Pedidos)   │              │
│  │              │  │              │  │              │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Notificacoes │  │   Cache      │  │   Users      │               │
│  │   (Emails)   │  │  (Aggreg)    │  │  (Auth)      │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                        ↕ Google APIs
┌─────────────────────────────────────────────────────────────────────┐
│              SERVIÇOS EXTERNOS                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Google Sheets│  │  Gmail API   │  │ Gemini API   │             │
│  │  (Fonte)     │  │  (Emails)    │  │   (IA Chat)  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                        ↕ Python Pipeline
┌─────────────────────────────────────────────────────────────────────┐
│              PIPELINE PYTHON                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Leitura    │  │ Normalização │  │   Escrita    │             │
│  │  (Sheets)    │  │  (Dados)     │  │  (Sheets)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO DE DADOS

### 1. Carregamento de Página

```
Usuário → Clica em página
  ↓
main.js → loadSection(page)
  ↓
page.js → loadPageName()
  ↓
dataLoader.load(endpoint)
  ↓
Verifica cache (dataStore)
  ↓
[Cache Hit] → Retorna dados
[Cache Miss] → Fetch API
  ↓
Backend → Controller → Model → MongoDB
  ↓
Resposta → dataStore.set() → Retorna dados
  ↓
chartFactory.createChart() → Renderiza gráfico
```

### 2. Aplicação de Filtros

```
Usuário → Clica em gráfico/item
  ↓
crossfilterOverview.setFilter(field, value)
  ↓
chartCommunication.filters.apply()
  ↓
eventBus.emit('filter:applied')
  ↓
Todas as páginas escutam → loadPageName(true)
  ↓
dataLoader.load(endpoint, { filters })
  ↓
Backend → /api/filter/aggregated
  ↓
Retorna dados filtrados
  ↓
Gráficos atualizados
```

---

## 🎯 PRINCÍPIOS ARQUITETURAIS

### 1. **Modularidade**
- Cada página é um módulo independente
- Sistemas globais reutilizáveis
- Controllers especializados

### 2. **Separação de Responsabilidades**
- Frontend: Visualização e interação
- Backend: Lógica e dados
- Models: Estrutura de dados

### 3. **Cache Inteligente**
- TTLs por tipo de dado
- Cache híbrido (memória + arquivo + banco)
- Invalidação automática

### 4. **Performance**
- Lazy loading de bibliotecas
- Agregações no banco
- Limite de pontos em gráficos
- Concorrência controlada

### 5. **Escalabilidade**
- MongoDB Atlas (cloud)
- Cache distribuído
- Agregações otimizadas

---

## 🔐 SEGURANÇA

- Autenticação por sessão
- Middleware de autenticação
- Validação de filtros
- Sanitização de inputs

---

## 📊 MONITORAMENTO E LOGS

### Sistema de Logs
- **Logger estruturado:** `utils/logger.js`
- **Níveis:** INFO, WARN, ERROR, DEBUG
- **Formato:** Timestamp + Nível + Mensagem
- **Destinos:** Console + Arquivo (`logs/error.log`)

### Métricas
- **Performance:** Tempo de resposta por endpoint
- **Cache:** Hit rate, miss rate, TTL stats
- **Erros:** Tracking de erros por tipo
- **Uso:** Requisições por rota, usuários ativos

### Health Checks
- **Database:** Conexão MongoDB
- **APIs:** Status Google APIs
- **Cache:** Status do cache híbrido
- **Services:** Status dos serviços (email, sync)

---

## 🚀 DEPLOY E INFRAESTRUTURA

### Ambientes

**Produção:**
- **Backend:** Render.com (Node.js)
- **Banco:** MongoDB Atlas (Cloud)
- **Frontend:** Servido pelo backend (Express static)
- **Pipeline:** GitHub Actions (agendado)

**Desenvolvimento:**
- **Backend:** Local (Node.js)
- **Banco:** MongoDB Atlas (mesmo cluster)
- **Frontend:** Servido pelo backend local

### Variáveis de Ambiente

```env
# Database
MONGODB_ATLAS_URL=mongodb+srv://...

# Google APIs
GOOGLE_CREDENTIALS_FILE=.github/workflows/credentials.json
GOOGLE_SHEET_ID=1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g
GOOGLE_FOLDER_BRUTA=1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5

# Email
EMAIL_REMETENTE=ouvidoria@duquedecaxias.rj.gov.br
NOME_REMETENTE=Ouvidoria Geral de Duque de Caxias
EMAIL_OUVIDORIA_GERAL=ouvgeral.gestao@gmail.com

# Gemini
GEMINI_API_KEY_1=...
GEMINI_API_KEY_2=...

# Server
PORT=3000
NODE_ENV=production
```

### Serviços Externos

- **MongoDB Atlas:** Banco de dados principal
- **Gmail API:** Envio de emails (OAuth 2.0)
- **Google Sheets API:** Leitura/escrita de planilhas
- **Gemini API:** Chat com IA
- **Render.com:** Hosting do backend

---

## 📈 ESTATÍSTICAS DO SISTEMA

### Backend
- **Rotas:** 19 módulos de rotas
- **Controllers:** 29 controllers especializados
- **Models:** 10 modelos Mongoose
- **Services:** 3 serviços principais (Email, Data Sync, Change Streams)
- **Utils:** 25+ utilitários
- **Pipelines:** 8 pipelines MongoDB modulares

### Frontend
- **Páginas:** 42+ páginas
  - Ouvidoria: 20 páginas
  - Zeladoria: 14 páginas
  - E-SIC: 8 páginas
  - Central: 1+ páginas
- **Sistemas Globais:** 8+ sistemas core
- **Módulos:** Módulos auxiliares
- **Gráficos:** Chart.js com lazy loading

### Dados
- **Collections:** 10 collections MongoDB
- **Índices:** 30+ índices otimizados
- **Cache:** Sistema híbrido (3 camadas)
- **Agregações:** Pipelines otimizados

### Integrações
- **Google Sheets:** Leitura/escrita automática
- **Gmail API:** Envio de emails automatizado
- **Gemini API:** Chat com IA
- **Colab API:** Integração com sistema Colab

---

## 🔧 COMPONENTES PRINCIPAIS

### Frontend Core
1. **ChartFactory** - Criação padronizada de gráficos
2. **DataLoader** - Carregamento inteligente com retry
3. **GlobalStore** - Cache global com TTL
4. **Crossfilter** - Filtros multi-dimensionais
5. **Chart Communication** - Comunicação entre gráficos
6. **Config** - Configurações centralizadas
7. **Cache Config** - TTLs centralizados

### Backend Core
1. **Controllers** - Lógica de negócio
2. **Routes** - Endpoints da API
3. **Models** - Schemas Mongoose
4. **Services** - Serviços especializados
5. **Utils** - Utilitários reutilizáveis
6. **Pipelines** - Agregações MongoDB
7. **Cache** - Sistema de cache híbrido

### Utils Backend (Principais)
- `logger.js` - Sistema de logs
- `dateUtils.js` - Normalização de datas
- `fieldMapper.js` - Mapeamento de campos
- `dbAggregations.js` - Agregações MongoDB
- `queryOptimizer.js` - Otimização de queries
- `smartCache.js` - Cache inteligente
- `cacheManager.js` - Gerenciamento de cache
- `validateFilters.js` - Validação de filtros
- `geminiHelper.js` - Integração Gemini
- `responseHelper.js` - Helpers de resposta
- `dataFormatter.js` - Formatação de dados
- `cursorPagination.js` - Paginação cursor-based
- `compositeFilters.js` - Filtros compostos
- `normalizeLowercase.js` - Normalização lowercase
- `districtMapper.js` - Mapeamento de distritos
- `pipelines/` - Pipelines modulares MongoDB

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Sincronização de Dados
```
Google Sheets (Bruta)
  ↓ Pipeline Python
Google Sheets (Tratada)
  ↓ Script Node.js
MongoDB Atlas
  ↓ Change Streams
Cache Invalidação
```

### 2. Notificações por Email
```
Cron Job (8h diário)
  ↓ Identifica Vencimentos
Agrupa por Secretaria
  ↓ Verifica Duplicidade
Envia via Gmail API
  ↓ Registra Histórico
MongoDB (NotificacaoEmail)
```

### 3. Chat com IA
```
Usuário → Mensagem
  ↓
Backend → Gemini API
  ↓
Contexto Indexado
  ↓
Resposta Gerada
  ↓
Salva no MongoDB
```

---

## ✅ CHECKUP ARQUITETURAL

### ✅ Arquitetura
- [x] Arquitetura modular implementada
- [x] Separação de responsabilidades clara
- [x] Padrões consistentes
- [x] Documentação completa

### ✅ Performance
- [x] Cache híbrido funcionando
- [x] Agregações otimizadas
- [x] Lazy loading implementado
- [x] Retry automático
- [x] Timeouts adaptativos

### ✅ Escalabilidade
- [x] MongoDB Atlas (cloud)
- [x] Cache distribuído
- [x] Agregações no banco
- [x] Paginação cursor-based
- [x] Concorrência controlada

### ✅ Segurança
- [x] Autenticação por sessão
- [x] Middleware de autenticação
- [x] Validação de filtros
- [x] Sanitização de inputs
- [x] OAuth 2.0 para APIs

### ✅ Monitoramento
- [x] Logs estruturados
- [x] Métricas de performance
- [x] Cache stats
- [x] Error tracking
- [x] Health checks

### ✅ Integrações
- [x] Google Sheets funcionando
- [x] Gmail API funcionando
- [x] Gemini API funcionando
- [x] Colab API funcionando

---

## 📊 DETALHAMENTO DE COMPONENTES

### Sistema de Cache (8 Sistemas)

#### Frontend
1. **Global Store (Memória)**: Cache em memória JavaScript
2. **LocalStorage**: Persistência para dados estáticos (TTL >= 10 min)
3. **Filter Cache**: Cache de resultados filtrados
4. **HTTP Cache**: Cache do navegador (via headers)

#### Backend
5. **Memória (Node.js)**: Cache em memória do servidor
6. **AggregationCache (MongoDB)**: Cache persistente no banco
7. **Smart Cache**: Cache baseado em filtros (chave dinâmica)
8. **HTTP Cache Headers**: Cache do navegador/CDN

**TTLs Centralizados:**
- **Estáticos:** 30 minutos (distritos, secretarias)
- **Semi-estáticos:** 10 minutos (agregações por mês)
- **Dinâmicos:** 5 segundos (dashboard-data, summary)

### Sistema de Notificações por Email

**Componentes:**
- `gmailService.js`: Autenticação OAuth 2.0, envio de emails
- `emailConfig.js`: Templates HTML/texto, mapeamento de secretarias
- `notificationService.js`: Lógica de geração e envio
- `scheduler.js`: Agendamento diário (8h)

**Tipos de Notificações:**
- 15 dias antes do vencimento (alerta preventivo)
- No dia do vencimento (alerta crítico)
- 30 dias após vencimento (alerta de atraso)
- 60 dias após vencimento (alerta de extrapolação)
- Resumo diário para Ouvidoria Geral

**Prevenção de Duplicatas:**
- Índice único: `{ protocolo: 1, tipoNotificacao: 1 }`
- Verificação antes de enviar
- Registro em `notificacoes_email`

### Integração com Google Sheets

**Fonte de Dados:**
- **Planilha Bruta:** Pasta Google Drive (ID: `1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5`)
- **Planilha Tratada:** ID `1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g`

**Fluxo:**
```
1. Pipeline Python lê planilha bruta
2. Normaliza e trata dados
3. Escreve na planilha tratada
4. Script Node.js lê planilha tratada
5. Importa para MongoDB (upsert por protocolo)
```

**Autenticação:**
- Service Account: `config/google-credentials.json`
- Scopes: `drive`, `spreadsheets`

### Sistema de IA e Chat

**Integração com Gemini:**
- Rotação de chaves API (múltiplas chaves)
- Gerenciamento de quota
- Contexto dos dados do sistema

**Endpoints:**
- `POST /api/chat/message`: Enviar mensagem
- `GET /api/chat/messages`: Listar mensagens
- `POST /api/chat/reindex`: Reindexar dados para IA

**Contexto Incluído:**
- Total de manifestações
- Distribuição por status, tema, órgão
- Vencimentos
- KPIs principais

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- **[BACKEND.md](./BACKEND.md)** - Detalhes completos do backend
- **[FRONTEND.md](./FRONTEND.md)** - Detalhes completos do frontend
- **[PIPELINE.md](./PIPELINE.md)** - Pipeline Python completo
- **[EMAILS.md](./EMAILS.md)** - Sistema de emails
- **[DADOS.md](./DADOS.md)** - Modelos e estrutura de dados
- **[DOC.md](./DOC.md)** - Índice da documentação técnica (13 documentos organizados em 5 categorias)

---

**Última Atualização:** 12/12/2025  
**Consolidado de:** DOCUMENTACAO_COMPLETA_SISTEMA.md

