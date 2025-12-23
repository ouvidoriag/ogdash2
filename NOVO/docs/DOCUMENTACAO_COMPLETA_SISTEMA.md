# 📚 DOCUMENTAÇÃO COMPLETA DO SISTEMA

**Sistema Dashboard de Ouvidoria, Zeladoria e E-SIC**  
**Prefeitura de Duque de Caxias**  
**CÉREBRO X-3**

**Data:** Dezembro 2025  
**Versão:** 3.0

---

## 📋 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Banco de Dados](#3-banco-de-dados)
4. [Pipeline de Processamento](#4-pipeline-de-processamento)
5. [Backend (API)](#5-backend-api)
6. [Frontend (Dashboard)](#6-frontend-dashboard)
7. [Sistema de Gráficos](#7-sistema-de-gráficos)
8. [Sistema de Filtros](#8-sistema-de-filtros)
9. [Sistema de Cache](#9-sistema-de-cache)
10. [Sistema de Notificações por Email](#10-sistema-de-notificações-por-email)
11. [Integração com Google Sheets](#11-integração-com-google-sheets)
12. [Sistema de IA e Chat](#12-sistema-de-ia-e-chat)
13. [Fluxos de Dados](#13-fluxos-de-dados)

---

## 1. VISÃO GERAL

### 1.1 O que é o Sistema?

Sistema completo de **Dashboard Analytics** para gerenciamento e análise de dados da Ouvidoria Municipal, Zeladoria e E-SIC da Prefeitura de Duque de Caxias.

### 1.2 Principais Funcionalidades

- ✅ **Dashboard Analytics**: Visualização de KPIs, gráficos e análises consolidadas
- ✅ **Filtros Inteligentes**: Sistema crossfilter multi-dimensional
- ✅ **Notificações Automáticas**: Alertas por email de vencimentos e prazos
- ✅ **Integração de Dados**: Sincronização automática com Google Sheets
- ✅ **IA e Chat**: Assistente inteligente com contexto dos dados
- ✅ **Cache Híbrido**: Otimização de performance com múltiplas camadas de cache

### 1.3 Stack Tecnológica

**Backend:**
- Node.js + Express.js
- MongoDB Atlas (Mongoose + Native Driver)
- Python (Pipeline de processamento)

**Frontend:**
- SPA Vanilla JavaScript (ES Modules)
- Chart.js (gráficos)
- Leaflet (mapas)

**Integrações:**
- Google Sheets API
- Gmail API (OAuth 2.0)
- Google Gemini API

---

## 2. ARQUITETURA DO SISTEMA

### 2.1 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Páginas    │  │   Gráficos   │  │   Filtros    │     │
│  │   (47)       │  │   Chart.js   │  │ Crossfilter  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Data Loader  │  │ Global Store │  │ Chart Factory │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                        ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Controllers  │  │   Services   │  │    Utils      │     │
│  │    (29)      │  │   (Email)    │  │   (29)        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Routes    │  │   Models     │  │    Cache      │     │
│  │    (19)      │  │    (10)      │  │   Híbrido     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                        ↕ Mongoose / Native Driver
┌─────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Cloud)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Records    │  │  Zeladoria    │  │     Esic      │     │
│  │  (Ouvidoria) │  │               │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ChatMessage  │  │ Notificacao   │  │ Aggregation   │     │
│  │              │  │    Email     │  │    Cache      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                        ↕ Google APIs
┌─────────────────────────────────────────────────────────────┐
│              INTEGRAÇÕES EXTERNAS                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Google Sheets│  │  Gmail API   │  │ Gemini API    │     │
│  │  (Fonte)     │  │  (Emails)     │  │  (IA/Chat)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Princípios Arquiteturais

1. **Modularidade**: Cada componente é independente e reutilizável
2. **Separação de Responsabilidades**: Frontend, Backend e Dados bem separados
3. **Cache Inteligente**: Múltiplas camadas de cache com TTLs otimizados
4. **Performance**: Agregações no banco, lazy loading, concorrência controlada
5. **Escalabilidade**: MongoDB Atlas, cache distribuído, arquitetura stateless

---

## 3. BANCO DE DADOS

### 3.1 MongoDB Atlas

**Tipo:** Cloud Database (MongoDB Atlas)  
**Conexão:** Connection String via `MONGODB_ATLAS_URL`  
**ODM:** Mongoose (schema, validação)  
**Driver Nativo:** MongoDB Native Driver (agregações pesadas)

### 3.2 Collections Principais

#### 3.2.1 Collection: `records` (Ouvidoria)

**Model:** `Record.model.js`  
**Schema Principal:**

```javascript
{
  // Identificação
  protocolo: String (único, indexado),
  
  // Datas
  dataDaCriacao: String,
  dataCriacaoIso: String (YYYY-MM-DD, indexado),
  dataDaConclusao: String,
  dataConclusaoIso: String (YYYY-MM-DD, indexado),
  
  // Status e Prioridade
  statusDemanda: String (indexado),
  status: String (indexado),
  prioridade: String (indexado),
  prazoRestante: String,
  tempoDeResolucaoEmDias: String,
  
  // Classificação
  tipoDeManifestacao: String (indexado),
  tema: String (indexado),
  assunto: String (indexado),
  canal: String (indexado),
  
  // Localização
  endereco: String,
  bairro: String,
  
  // Responsáveis
  orgaos: String (indexado),
  unidadeCadastro: String (indexado),
  unidadeSaude: String (indexado),
  servidor: String (indexado),
  responsavel: String (indexado),
  
  // Metadados
  verificado: String,
  data: Mixed (JSON completo da planilha)
}
```

**Índices:**

- **Simples:** protocolo (único), statusDemanda, tipoDeManifestacao, tema, assunto, canal, orgaos, dataCriacaoIso, dataConclusaoIso
- **Compostos:**
  - `{ dataCriacaoIso: 1, status: 1 }`
  - `{ dataCriacaoIso: 1, tema: 1 }`
  - `{ dataCriacaoIso: 1, orgaos: 1 }`
  - `{ tema: 1, orgaos: 1 }`
  - `{ status: 1, tema: 1 }`
  - `{ servidor: 1, dataCriacaoIso: 1, status: 1 }`
  - `{ orgaos: 1, status: 1, dataCriacaoIso: 1 }`

**Campos Lowercase (Otimização):**
- `temaLowercase`, `assuntoLowercase`, `canalLowercase`, `orgaosLowercase`
- Usados para filtros "contains" case-insensitive

#### 3.2.2 Collection: `zeladoria`

**Model:** `Zeladoria.model.js`  
**Schema:** Similar ao Record, adaptado para dados de Zeladoria

#### 3.2.3 Collection: `esic`

**Model:** `Esic.model.js`  
**Schema:** Adaptado para dados do E-SIC (Sistema Eletrônico de Informações ao Cidadão)

#### 3.2.4 Collection: `chat_messages`

**Model:** `ChatMessage.model.js`  
**Schema:**
```javascript
{
  text: String,
  sender: String ('user' | 'cora'),
  createdAt: Date (indexado)
}
```

#### 3.2.5 Collection: `notificacoes_email`

**Model:** `NotificacaoEmail.model.js`  
**Schema:**
```javascript
{
  protocolo: String (indexado),
  secretaria: String (indexado),
  emailSecretaria: String,
  tipoNotificacao: String ('15_dias' | 'vencimento' | '30_dias_vencido' | '60_dias_vencido' | 'resumo_geral'),
  dataVencimento: String (YYYY-MM-DD, indexado),
  diasRestantes: Number,
  enviadoEm: Date (indexado),
  status: String ('enviado' | 'erro' | 'pendente'),
  mensagemErro: String,
  messageId: String (ID Gmail)
}
```

**Índice Composto Único:** `{ protocolo: 1, tipoNotificacao: 1 }` (evita duplicatas)

#### 3.2.6 Collection: `aggregation_cache`

**Model:** `AggregationCache.model.js`  
**Schema:**
```javascript
{
  key: String (único),
  data: Mixed (JSON com dados agregados),
  expiresAt: Date (indexado),
  createdAt: Date,
  updatedAt: Date
}
```

**Uso:** Cache de agregações pré-computadas no banco de dados

### 3.3 Normalização de Dados

#### 3.3.1 Campos Normalizados

Todos os dados são normalizados antes de serem salvos no banco:

- **Datas:** Convertidas para formato ISO (`YYYY-MM-DD`)
- **Textos:** Canonizados (lowercase, sem acentos) para campos de busca
- **Protocolos:** Uppercase, trim
- **Nomes de Colunas:** Normalizados (lowercase, underscore)

#### 3.3.2 Mapeamento de Campos

**Campos da Planilha → Campos do Banco:**

| Planilha | Banco | Tipo |
|----------|-------|------|
| `protocolo` | `protocolo` | String (único) |
| `data_da_criacao` | `dataCriacaoIso` | String (ISO) |
| `data_da_conclusao` | `dataConclusaoIso` | String (ISO) |
| `status_demanda` | `statusDemanda` | String |
| `tipo_de_manifestacao` | `tipoDeManifestacao` | String |
| `orgaos` | `orgaos` | String |
| `unidade_cadastro` | `unidadeCadastro` | String |

### 3.4 Agregações MongoDB

O sistema usa **pipelines de agregação** para queries complexas:

**Exemplo: Overview Pipeline**

```javascript
[
  { $match: { /* filtros */ } },
  { $facet: {
    total: [{ $count: "count" }],
    porStatus: [
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ],
    porTema: [
      { $group: { _id: "$tema", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ],
    // ... mais agregações
  }}
]
```

**Otimizações:**
- Uso de `$match` no início (reduz documentos processados)
- Índices compostos para queries frequentes
- `$facet` para múltiplas agregações em uma única query

---

## 4. PIPELINE DE PROCESSAMENTO

### 4.1 Visão Geral

**Localização:** `Pipeline/main.py`  
**Linguagem:** Python 3  
**Bibliotecas:** pandas, gspread, google-auth, unicodedata

### 4.2 Fluxo do Pipeline

```
1. Autenticação Google API
   ↓
2. Leitura da Planilha Bruta (Google Drive)
   ↓
3. Normalização de Cabeçalhos
   ↓
4. Tratamento de Dados
   - Limpeza de espaços
   - Normalização de datas
   - Canonização de textos
   - Validação de campos
   ↓
5. Escrita na Planilha Tratada
   ↓
6. Logs detalhados (pipeline_tratamento.log)
```

### 4.3 Etapas de Tratamento

#### 4.3.1 Normalização de Cabeçalhos

- Remove acentos
- Converte para lowercase
- Substitui espaços por underscore
- Remove caracteres especiais

**Exemplo:**
- `"Data da Criação"` → `"data_da_criacao"`
- `"Tipo de Manifestação"` → `"tipo_de_manifestacao"`

#### 4.3.2 Tratamento de Datas

- Converte datas Excel para formato ISO (`YYYY-MM-DD`)
- Valida datas inválidas
- Trata múltiplos formatos de entrada

#### 4.3.3 Canonização de Textos

- Remove acentos (normalização Unicode)
- Converte para lowercase
- Remove espaços extras
- Preserva estrutura para exibição

#### 4.3.4 Validação de Campos

- Protocolos obrigatórios
- Datas válidas
- Órgãos mapeados
- Correção automática de erros comuns

### 4.4 Execução do Pipeline

**Via Node.js:**
```bash
npm run pipeline
# ou
node scripts/data/runPipeline.js
```

**Script:** `NOVO/scripts/data/runPipeline.js`

**Fluxo:**
1. Executa `Pipeline/main.py` via subprocess
2. Aguarda conclusão
3. Lê planilha tratada
4. Importa para MongoDB

---

## 5. BACKEND (API)

### 5.1 Estrutura do Backend

```
NOVO/src/
├── server.js              # Servidor principal
├── api/
│   ├── controllers/       # 29 controllers
│   ├── routes/            # 19 rotas
│   └── middleware/        # Middleware de autenticação
├── models/                # 10 models Mongoose
├── services/              # Serviços (email, cache, etc)
├── utils/                 # 29 utilitários
└── config/                # Configurações
```

### 5.2 Servidor Principal

**Arquivo:** `src/server.js`

**Funcionalidades:**
- Inicialização do Express
- Conexão MongoDB (Mongoose)
- Configuração de middlewares
- Registro de rotas
- Inicialização de serviços (cache, Gemini, schedulers)
- Graceful shutdown

**Middlewares Globais:**
- CORS
- Compression
- JSON parser
- Session (express-session)
- Morgan (logging)
- Cache headers por endpoint

### 5.3 Controllers Principais

#### 5.3.1 Dashboard Controller

**Arquivo:** `src/api/controllers/dashboardController.js`  
**Endpoint:** `GET /api/dashboard-data`

**Funcionalidade:**
- Retorna dados consolidados para o dashboard
- Usa agregações MongoDB otimizadas
- Cache inteligente com TTL

#### 5.3.2 Aggregate Controller

**Arquivo:** `src/api/controllers/aggregateController.js`  
**Endpoints:**
- `GET /api/aggregate/count-by?field=Status`
- `GET /api/aggregate/by-theme`
- `GET /api/aggregate/by-month`
- etc.

**Funcionalidade:**
- Agregações por campo
- Suporte a filtros
- Cache de 1 hora

#### 5.3.3 Filter Controller

**Arquivo:** `src/api/controllers/filterController.js`  
**Endpoint:** `POST /api/filter/aggregated`

**Funcionalidade:**
- Aplica filtros multi-dimensionais
- Retorna dados agregados filtrados
- Suporte a filtros compostos

#### 5.3.4 Chat Controller

**Arquivo:** `src/api/controllers/chatController.js`  
**Endpoints:**
- `POST /api/chat/message`
- `GET /api/chat/messages`
- `POST /api/chat/reindex`

**Funcionalidade:**
- Integração com Gemini AI
- Contexto dos dados do sistema
- Reindexação de dados para IA

#### 5.3.5 Notificações Controller

**Arquivo:** `src/api/controllers/notificacoesController.js`  
**Endpoints:**
- `GET /api/notificacoes/vencimentos`
- `POST /api/notificacoes/enviar-selecionados`

**Funcionalidade:**
- Lista demandas vencidas
- Envia notificações por email

### 5.4 Sistema de Cache (Backend)

#### 5.4.1 Cache Híbrido

O backend usa **8 sistemas de cache**:

1. **Memória (Node.js)**: Cache em memória para dados frequentes
2. **Banco de Dados (AggregationCache)**: Cache persistente de agregações
3. **Smart Cache**: Cache baseado em filtros (chave dinâmica)
4. **HTTP Cache Headers**: Cache do navegador/CDN
5. **TTL Centralizado**: Configuração única de TTLs (`cache-ttls.js`)

#### 5.4.2 TTLs por Tipo

**Configuração:** `src/config/cache-ttls.js`

```javascript
{
  STATIC: 30 * 60,        // 30 minutos
  SEMI_STATIC: 10 * 60,   // 10 minutos
  DYNAMIC: 5,             // 5 segundos
  ENDPOINTS: {
    '/api/distritos': 30 * 60,
    '/api/aggregate/by-month': 10 * 60,
    '/api/dashboard-data': 5,
    '/api/summary': 5
  }
}
```

#### 5.4.3 Invalidação de Cache

**ChangeStream Watcher:**
- Monitora mudanças no MongoDB
- Invalida cache automaticamente quando dados mudam
- Implementado em `src/services/changeStreamWatcher.js`

### 5.5 Agregações Otimizadas

**Arquivo:** `src/utils/dbAggregations.js`

**Funções Principais:**
- `buildOverviewPipeline(filters)`: Pipeline para dados de overview
- `executeAggregation(getMongoClient, pipeline)`: Executa agregação
- `formatOverviewData(facetResult)`: Formata resultado

**Otimizações:**
- `$match` no início (reduz documentos)
- Índices compostos para queries frequentes
- `$facet` para múltiplas agregações
- Cache de resultados

---

## 6. FRONTEND (DASHBOARD)

### 6.1 Estrutura do Frontend

```
NOVO/public/
├── index.html              # Página principal (SPA)
├── scripts/
│   ├── main.js             # Roteador principal
│   ├── core/               # Sistemas globais
│   │   ├── chart-factory.js
│   │   ├── dataLoader.js
│   │   ├── global-store.js
│   │   ├── filter-cache.js
│   │   └── ...
│   ├── pages/              # 47 páginas
│   │   ├── ouvidoria/
│   │   ├── zeladoria/
│   │   ├── esic/
│   │   └── central/
│   └── modules/            # Módulos reutilizáveis
└── styles/                  # CSS
```

### 6.2 SPA (Single Page Application)

**Arquivo:** `public/index.html`

**Funcionalidade:**
- Roteamento client-side
- Carregamento dinâmico de páginas
- Navegação sem reload

**Roteador:** `public/scripts/main.js`

```javascript
// Carregar página
loadSection('ouvidoria-overview');

// Navegação
navigateTo('zeladoria-mensal');
```

### 6.3 Sistemas Globais (Core)

#### 6.3.1 Data Loader

**Arquivo:** `public/scripts/core/dataLoader.js`

**Funcionalidade:**
- Carregamento unificado de dados
- Retry automático com backoff exponencial
- Timeouts adaptativos por endpoint
- Controle de concorrência (máx 6 requisições simultâneas)
- Deduplicação de requisições

**Uso:**
```javascript
const data = await window.dataLoader.load('/api/dashboard-data', {
  useDataStore: true,
  ttl: 5000,
  fallback: {}
});
```

#### 6.3.2 Global Store

**Arquivo:** `public/scripts/core/global-store.js`

**Funcionalidade:**
- Cache único do frontend
- TTL por chave
- Persistência em localStorage (dados estáticos)
- Sistema de listeners (reatividade)
- Deep copy inteligente

**Uso:**
```javascript
// Salvar
window.dataStore.set('dashboardData', data, true);

// Ler
const data = window.dataStore.get('dashboardData', 5000);

// Escutar mudanças
const unsubscribe = window.dataStore.subscribe('dashboardData', (data) => {
  // Atualizar gráficos
});
```

#### 6.3.3 Chart Factory

**Arquivo:** `public/scripts/core/chart-factory.js`

**Funcionalidade:**
- Criação padronizada de gráficos Chart.js
- Paleta de cores inteligente
- Suporte a múltiplos tipos (bar, pie, line, doughnut)
- Modo claro/escuro
- Otimização de performance

**Uso:**
```javascript
await window.chartFactory.createBarChart('canvasId', labels, values, {
  horizontal: false,
  colorIndex: 0,
  label: 'Manifestações'
});
```

### 6.4 Páginas do Dashboard

**Total:** 47 páginas organizadas por módulo

**Módulos:**
- **Ouvidoria:** Overview, por tema, por status, vencimentos, etc.
- **Zeladoria:** Mensal, tempo médio, por bairro, etc.
- **E-SIC:** Overview, por status, etc.
- **Central:** Dashboard consolidado dos 4 sistemas

**Estrutura de uma Página:**

```javascript
// public/scripts/pages/ouvidoria/overview.js

async function loadOverview(forceRefresh = false) {
  // 1. Carregar dados
  const data = await window.dataLoader.load('/api/dashboard-data', {
    useDataStore: !forceRefresh
  });
  
  // 2. Renderizar KPIs
  renderKPIs(data);
  
  // 3. Criar gráficos
  await createCharts(data);
  
  // 4. Configurar filtros
  setupFilters();
}
```

---

## 7. SISTEMA DE GRÁFICOS

### 7.1 Chart Factory

**Arquivo:** `public/scripts/core/chart-factory.js`

### 7.2 Tipos de Gráficos Suportados

#### 7.2.1 Gráfico de Barras

```javascript
await window.chartFactory.createBarChart(canvasId, labels, values, {
  horizontal: false,  // true = horizontal, false = vertical
  colorIndex: 0,
  label: 'Manifestações'
});
```

#### 7.2.2 Gráfico de Pizza

```javascript
await window.chartFactory.createPieChart(canvasId, labels, values, {
  colorIndex: 1,
  showPercentages: true
});
```

#### 7.2.3 Gráfico de Linha

```javascript
await window.chartFactory.createLineChart(canvasId, labels, values, {
  colorIndex: 3,
  fill: true
});
```

#### 7.2.4 Gráfico de Rosca

```javascript
await window.chartFactory.createDoughnutChart(canvasId, labels, values, {
  colorIndex: 2
});
```

### 7.3 Sistema de Cores Inteligente

**Detecção Automática:**
- **Status:** Verde (concluído), Vermelho (vencido), Amarelo (pendente)
- **Tipo:** Verde (elogio), Laranja (reclamação), Vermelho (denúncia)
- **Canal:** Cyan (online), Azul (email), Verde (presencial)

**Paleta Padrão:**
- 20 cores pré-definidas
- Gradientes automáticos
- Modo claro/escuro

### 7.4 Otimizações de Performance

- **Limite de Pontos:** Máximo 50 pontos por gráfico (agregação automática)
- **Lazy Loading:** Chart.js carregado apenas quando necessário
- **Destruição:** Gráficos antigos são destruídos antes de criar novos
- **Animações:** Desabilitadas para grandes datasets

### 7.5 Gráficos Avançados

**Arquivo:** `public/scripts/core/advanced-charts.js`

**Tipos:**
- **Sankey:** Fluxo de dados entre temas e órgãos
- **TreeMap:** Hierarquia de temas
- **Mapa Geográfico:** Distribuição por bairro (Leaflet)

**Biblioteca:** Plotly.js (carregada dinamicamente)

---

## 8. SISTEMA DE FILTROS

### 8.1 Crossfilter

**Arquivo:** `public/scripts/core/filter-cache.js`

**Funcionalidade:**
- Filtros multi-dimensionais
- Sincronização entre gráficos
- Cache de filtros aplicados

### 8.2 Aplicação de Filtros

**Fluxo:**
```
Usuário clica em gráfico
  ↓
chartCommunication.filters.apply(field, value)
  ↓
eventBus.emit('filter:applied', { field, value })
  ↓
Todas as páginas escutam
  ↓
loadPageName(true) // forceRefresh = true
  ↓
dataLoader.load(endpoint, { filters })
  ↓
Backend aplica filtros na agregação
  ↓
Gráficos atualizados
```

### 8.3 Filtros Compostos

**Suporte a:**
- Múltiplos campos simultaneamente
- Operadores: `equals`, `contains`, `in`, `range`
- Combinação AND/OR

**Exemplo:**
```javascript
{
  status: 'Aberto',
  tema: { $contains: 'Iluminação' },
  dataCriacaoIso: { $gte: '2025-01-01', $lte: '2025-12-31' }
}
```

### 8.4 Cache de Filtros

**Arquivo:** `public/scripts/core/filter-cache.js`

**Funcionalidade:**
- Cache de resultados filtrados
- TTL por tipo de filtro
- Invalidação automática quando dados mudam

---

## 9. SISTEMA DE CACHE

### 9.1 Cache Híbrido (8 Sistemas)

#### 9.1.1 Frontend

1. **Global Store (Memória)**: Cache em memória JavaScript
2. **LocalStorage**: Persistência para dados estáticos (TTL >= 10 min)
3. **Filter Cache**: Cache de resultados filtrados
4. **HTTP Cache**: Cache do navegador (via headers)

#### 9.1.2 Backend

5. **Memória (Node.js)**: Cache em memória do servidor
6. **AggregationCache (MongoDB)**: Cache persistente no banco
7. **Smart Cache**: Cache baseado em filtros (chave dinâmica)
8. **HTTP Cache Headers**: Cache do navegador/CDN

### 9.2 TTLs Centralizados

**Frontend:** `public/scripts/core/cache-config.js`  
**Backend:** `src/config/cache-ttls.js`

**Sincronização:** Ambos usam os mesmos valores

**TTLs por Tipo:**
- **Estáticos:** 30 minutos (distritos, secretarias)
- **Semi-estáticos:** 10 minutos (agregações por mês)
- **Dinâmicos:** 5 segundos (dashboard-data, summary)

### 9.3 Invalidação de Cache

**Automática:**
- ChangeStream Watcher monitora MongoDB
- Invalida cache quando dados mudam

**Manual:**
```javascript
// Frontend
window.dataStore.clear('dashboardData');

// Backend
await invalidateCache('overview:*');
```

---

## 10. SISTEMA DE NOTIFICAÇÕES POR EMAIL

### 10.1 Arquitetura

**Localização:** `src/services/email-notifications/`

**Componentes:**
- `gmailService.js`: Autenticação OAuth 2.0, envio de emails
- `emailConfig.js`: Templates HTML/texto, mapeamento de secretarias
- `notificationService.js`: Lógica de geração e envio
- `scheduler.js`: Agendamento diário (8h)

### 10.2 Tipos de Notificações

#### 10.2.1 15 Dias Antes do Vencimento

**Template:** `getTemplate15Dias()`  
**Quando:** 15 dias antes do prazo  
**Conteúdo:** Alerta preventivo com lista de protocolos

#### 10.2.2 No Dia do Vencimento

**Template:** `getTemplateVencimento()`  
**Quando:** No dia do vencimento  
**Conteúdo:** Alerta crítico

#### 10.2.3 30 Dias Após Vencimento

**Template:** `getTemplate30Dias()`  
**Quando:** 30 dias após vencimento  
**Conteúdo:** Alerta de atraso

#### 10.2.4 60 Dias Após Vencimento

**Template:** `getTemplate60Dias()`  
**Quando:** 60 dias após vencimento  
**Conteúdo:** Alerta de extrapolação

#### 10.2.5 Resumo Diário (Ouvidoria Geral)

**Template:** `getTemplateResumoOuvidoriaGeral()`  
**Quando:** Diariamente às 8h  
**Conteúdo:** Resumo consolidado de todos os vencimentos

### 10.3 Cálculo de Prazos

**Função:** `getPrazoPorTipo(tipoDeManifestacao)`

**Regras:**
- **E-SIC / Pedido de Informação:** 20 dias
- **Outros:** 30 dias

**Cálculo:**
```javascript
dataVencimento = dataCriacao + prazo
diasRestantes = dataVencimento - hoje
```

### 10.4 Agendamento

**Arquivo:** `src/services/email-notifications/scheduler.js`

**Configuração:**
- **Horário:** 8h (horário oficial Brasília)
- **Frequência:** Diária
- **Execução:** Sequencial (15 dias → vencimento → 30 dias → 60 dias → resumo)

**Cron Job:** `src/cron/vencimentos.cron.js`

### 10.5 Prevenção de Duplicatas

**Mecanismo:**
- Índice único: `{ protocolo: 1, tipoNotificacao: 1 }`
- Verificação antes de enviar
- Registro em `notificacoes_email`

### 10.6 Templates de Email

**Formato:**
- **HTML:** CSS inline, responsivo
- **Texto Plano:** Fallback
- **CTA:** Links para sistema de Ouvidoria

**Exemplo:**
```html
<h2>Alerta de Vencimento - 15 Dias</h2>
<p>Prezado(a) responsável,</p>
<p>Os seguintes protocolos vencem em 15 dias:</p>
<ul>
  <li>Protocolo: XXX | Tema: YYY | Prazo: 15 dias</li>
</ul>
<a href="[LINK_SISTEMA]">Acessar Sistema</a>
```

---

## 11. INTEGRAÇÃO COM GOOGLE SHEETS

### 11.1 Fonte de Dados

**Planilha Bruta:**
- **Pasta Google Drive:** ID `1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5`
- **Pipeline Python** busca a planilha mais recente nesta pasta

**Planilha Tratada:**
- **ID:** `1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g`
- **Pipeline Python** escreve dados normalizados aqui
- **Node.js** lê desta planilha e importa para MongoDB

### 11.2 Autenticação

**Service Account:**
- **Arquivo:** `config/google-credentials.json`
- **Scopes:** `drive`, `spreadsheets`

### 11.3 Sincronização

**Script:** `NOVO/scripts/data/updateFromGoogleSheets.js`

**Fluxo:**
```
1. Autenticar Google API
2. Ler planilha tratada
3. Normalizar dados
4. Importar para MongoDB (upsert por protocolo)
5. Log de resultados
```

**Execução:**
```bash
npm run update:sheets
# ou
node scripts/data/updateFromGoogleSheets.js
```

### 11.4 Scheduler Automático

**Arquivo:** `src/services/data-sync/scheduler.js`

**Configuração:**
- **Horário:** 10h (horário oficial Brasília)
- **Frequência:** Diária
- **Ação:** Executa pipeline Python + importação MongoDB

---

## 12. SISTEMA DE IA E CHAT

### 12.1 Integração com Gemini

**Arquivo:** `src/utils/geminiHelper.js`

**Funcionalidade:**
- Rotação de chaves API (múltiplas chaves)
- Gerenciamento de quota
- Contexto dos dados do sistema

### 12.2 Chat Controller

**Arquivo:** `src/api/controllers/chatController.js`

**Endpoints:**
- `POST /api/chat/message`: Enviar mensagem
- `GET /api/chat/messages`: Listar mensagens
- `POST /api/chat/reindex`: Reindexar dados para IA

### 12.3 Reindexação

**Funcionalidade:**
- Extrai dados do MongoDB
- Formata para contexto da IA
- Envia para Gemini (embeddings)

**Execução:**
```bash
POST /api/chat/reindex
```

### 12.4 Contexto dos Dados

**Informações Incluídas:**
- Total de manifestações
- Distribuição por status
- Distribuição por tema
- Distribuição por órgão
- Vencimentos
- KPIs principais

---

## 13. FLUXOS DE DADOS

### 13.1 Fluxo Completo: Planilha → Dashboard

```
1. Planilha Bruta (Google Drive)
   ↓
2. Pipeline Python (normalização)
   ↓
3. Planilha Tratada (Google Sheets)
   ↓
4. Script Node.js (importação)
   ↓
5. MongoDB Atlas (records collection)
   ↓
6. Backend API (agregações)
   ↓
7. Frontend (dataLoader)
   ↓
8. Global Store (cache)
   ↓
9. Chart Factory (renderização)
   ↓
10. Dashboard (visualização)
```

### 13.2 Fluxo: Aplicação de Filtros

```
1. Usuário clica em gráfico
   ↓
2. chartCommunication.filters.apply()
   ↓
3. eventBus.emit('filter:applied')
   ↓
4. Páginas escutam evento
   ↓
5. loadPageName(true) // forceRefresh
   ↓
6. dataLoader.load(endpoint, { filters })
   ↓
7. Backend: /api/filter/aggregated
   ↓
8. Controller aplica filtros na agregação
   ↓
9. MongoDB: $match com filtros
   ↓
10. Retorna dados filtrados
   ↓
11. Frontend atualiza gráficos
```

### 13.3 Fluxo: Notificações por Email

```
1. Scheduler (8h diário)
   ↓
2. notificationService.executarTodasNotificacoes()
   ↓
3. Busca demandas vencidas (MongoDB)
   ↓
4. Calcula prazos e dias restantes
   ↓
5. Agrupa por secretaria
   ↓
6. Verifica duplicatas (notificacoes_email)
   ↓
7. Gera template HTML
   ↓
8. gmailService.sendEmail()
   ↓
9. Registra em notificacoes_email
   ↓
10. Log de resultados
```

### 13.4 Fluxo: Cache

```
1. Requisição Frontend
   ↓
2. dataLoader.load(endpoint)
   ↓
3. Verifica Global Store (cache)
   ↓
4. [Cache Hit] → Retorna dados
   ↓
5. [Cache Miss] → Fetch API
   ↓
6. Backend: Verifica cache (memória/banco)
   ↓
7. [Cache Hit] → Retorna dados
   ↓
8. [Cache Miss] → Query MongoDB
   ↓
9. Salva em cache (múltiplas camadas)
   ↓
10. Retorna dados
   ↓
11. Frontend salva em Global Store
   ↓
12. Retorna dados
```

---

## 📊 RESUMO TÉCNICO

### Tecnologias Principais

- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Frontend:** Vanilla JavaScript, Chart.js, Leaflet
- **Pipeline:** Python, pandas, gspread
- **Integrações:** Google Sheets API, Gmail API, Gemini API

### Performance

- **Cache Híbrido:** 8 sistemas de cache
- **Agregações:** Otimizadas no MongoDB
- **Lazy Loading:** Bibliotecas grandes carregadas sob demanda
- **Concorrência:** Controlada (máx 6 requisições simultâneas)

### Escalabilidade

- **MongoDB Atlas:** Cloud database escalável
- **Cache Distribuído:** Múltiplas camadas
- **Arquitetura Stateless:** Fácil escalar horizontalmente

### Segurança

- **Autenticação:** Sessão (express-session)
- **Validação:** Filtros sanitizados
- **HTTPS:** Obrigatório em produção
- **Credenciais:** Armazenadas em variáveis de ambiente

---

## 📝 CONCLUSÃO

Este sistema é uma solução completa e robusta para gerenciamento e análise de dados da Ouvidoria Municipal, com:

- ✅ Arquitetura modular e escalável
- ✅ Performance otimizada com cache híbrido
- ✅ Integração completa com Google Sheets
- ✅ Notificações automáticas por email
- ✅ Dashboard interativo com filtros inteligentes
- ✅ IA integrada para assistência

**CÉREBRO X-3**  
**Sistema de Ouvidoria - Prefeitura de Duque de Caxias**  
**Última atualização:** Dezembro 2025



