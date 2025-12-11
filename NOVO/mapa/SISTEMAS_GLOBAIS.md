# 🟦 SISTEMAS GLOBAIS - Core

**Localização:** `NOVO/public/scripts/core/`  
**Data:** 11/12/2025  
**CÉREBRO X-3**

---

## 📋 ÍNDICE

1. [Chart Factory](#chart-factory)
2. [Data Loader](#data-loader)
3. [Global Store](#global-store)
4. [Chart Communication](#chart-communication)
5. [Crossfilter Overview](#crossfilter-overview)
6. [Config](#config)
7. [Cache Config](#cache-config)
8. [Outros Utilitários](#outros-utilitários)

---

## 🎨 CHART FACTORY

**Arquivo:** `core/chart-factory.js`  
**Função:** Biblioteca abstrata para criação de gráficos padronizados

### O que faz:
- Cria gráficos Chart.js de forma padronizada
- Gerencia paleta de cores inteligente
- Detecta categoria automaticamente (Status, Tipo, Canal, etc.)
- Suporta modo claro/escuro
- Otimiza performance (limite de pontos, animações)

### Como usar:
```javascript
// Criar gráfico de barras
const chart = await window.chartFactory.createBarChart(
  'canvasId', 
  labels, 
  values, 
  {
    horizontal: false,
    colorIndex: 0,
    label: 'Manifestações'
  }
);

// Criar gráfico de pizza
const pieChart = await window.chartFactory.createPieChart(
  'canvasId',
  labels,
  values,
  { colorIndex: 1 }
);
```

### Tipos de gráficos suportados:
- `createBarChart` - Barras verticais/horizontais
- `createPieChart` - Pizza/Donut
- `createLineChart` - Linha
- `createDoughnutChart` - Rosca
- `destroyCharts` - Destruir gráficos

### Cores inteligentes:
- Detecta automaticamente tipo de dado (Status, Tipo, Canal, etc.)
- Aplica cores semânticas (verde=concluído, vermelho=vencido, etc.)
- Suporta modo claro/escuro

---

## 📡 DATA LOADER

**Arquivo:** `core/dataLoader.js` (TypeScript)  
**Função:** Sistema global de carregamento de dados unificado

### O que faz:
- Carrega dados de APIs com retry automático
- Controla concorrência (máx 6 requisições simultâneas)
- Timeouts adaptativos por tipo de endpoint
- Deduplicação de requisições
- Integração com cache (dataStore)

### Como usar:
```javascript
// Carregar dados simples
const data = await window.dataLoader.load('/api/summary', {
  useDataStore: true,
  ttl: 5000,
  retries: 2
});

// Com fallback
const data = await window.dataLoader.load('/api/data', {
  fallback: [],
  timeout: 30000
});
```

### Recursos:
- **Retry com backoff exponencial:** Tenta novamente em caso de falha
- **Timeouts adaptativos:** Endpoints pesados têm timeout maior
- **Deduplicação:** Evita requisições duplicadas simultâneas
- **Concorrência:** Controla número máximo de requisições paralelas

### Timeouts por endpoint:
- `/api/summary`: 10s
- `/api/dashboard-data`: 90s
- `/api/aggregate`: 60s
- Padrão: 30s

---

## 💾 GLOBAL STORE

**Arquivo:** `core/global-store.js` (TypeScript)  
**Função:** Repositório central de dados (única fonte de verdade)

### O que faz:
- Armazena dados em memória com TTL
- Persistência em localStorage
- Sistema de listeners para mudanças
- Deep copy automático
- Proteção contra objetos Chart.js

### Como usar:
```javascript
// Salvar dados
window.dataStore.set('dashboardData', data, 5000);

// Obter dados (com TTL)
const data = window.dataStore.get('dashboardData', 5000);

// Invalidar cache
window.dataStore.invalidate('dashboardData');

// Listener de mudanças
window.dataStore.on('dashboardData', (newData) => {
  console.log('Dados atualizados:', newData);
});
```

### TTLs configurados:
- **Estáticos:** 30 minutos (distritos, unidades)
- **Semi-estáticos:** 10 minutos (agregações mensais)
- **Dinâmicos:** 5 segundos (dashboard-data, summary)

---

## 🔄 CHART COMMUNICATION

**Arquivo:** `core/chart-communication.js` + módulos TypeScript  
**Função:** Sistema de comunicação entre gráficos e filtros

### Módulos:
1. **event-bus.ts:** Sistema de eventos global
2. **global-filters.ts:** Sistema de filtros globais
3. **chart-registry.ts:** Registro de gráficos
4. **auto-connect.ts:** Auto-conexão de páginas

### O que faz:
- Permite gráficos se comunicarem entre si
- Sistema de filtros global multi-dimensional
- Registro automático de gráficos
- Auto-conexão de páginas ao sistema

### Como usar:
```javascript
// Aplicar filtro
window.chartCommunication.filters.apply('Status', 'Aberto', 'chartId');

// Limpar filtros
window.chartCommunication.filters.clear();

// Registrar gráfico
window.chartRegistry.register('chartId', {
  field: 'Status',
  type: 'bar'
});

// Escutar eventos
window.eventBus.on('filter:applied', (data) => {
  console.log('Filtro aplicado:', data);
});
```

### Eventos disponíveis:
- `filter:applied` - Filtro aplicado
- `filter:removed` - Filtro removido
- `filter:cleared` - Todos os filtros limpos
- `charts:update-requested` - Atualização de gráficos solicitada

---

## 🎯 CROSSFILTER OVERVIEW

**Arquivo:** `core/crossfilter-overview.js`  
**Função:** Sistema de filtros inteligentes multi-dimensionais (estilo Power BI)

### O que faz:
- Múltiplos filtros simultâneos (Status + Tema + Órgão + etc.)
- Clique esquerdo = aplica filtro
- Clique direito = limpa TODOS os filtros
- Banner visual mostra filtros ativos
- Todos os gráficos reagem bidirecionalmente

### Como usar:
```javascript
// Aplicar filtro
window.crossfilterOverview.setStatusFilter('Aberto');
window.crossfilterOverview.setTemaFilter('Saúde');
window.crossfilterOverview.setOrgaosFilter('Secretaria de Saúde');

// Limpar todos
window.crossfilterOverview.clearAllFilters();

// Listener de mudanças
window.crossfilterOverview.onFilterChange(() => {
  // Recarregar dados quando filtros mudarem
  loadData();
});
```

### Filtros disponíveis:
- `setStatusFilter(status)`
- `setTemaFilter(tema)`
- `setOrgaosFilter(orgaos)`
- `setTipoFilter(tipo)`
- `setCanalFilter(canal)`
- `setPrioridadeFilter(prioridade)`
- `setUnidadeFilter(unidade)`
- `setBairroFilter(bairro)`

---

## ⚙️ CONFIG

**Arquivo:** `core/config.js`  
**Função:** Configuração centralizada do sistema

### O que contém:
- **FIELD_NAMES:** Nomes de campos padronizados
- **FIELD_LABELS:** Labels amigáveis
- **API_ENDPOINTS:** Endpoints da API
- **CHART_CONFIG:** Configurações de gráficos
  - Paletas de cores
  - Cores por tipo de manifestação
  - Cores por status
  - Cores por canal
  - Cores por prioridade
- **FORMAT_CONFIG:** Formatação (datas, números)
- **PERFORMANCE_CONFIG:** Configurações de performance

### Como usar:
```javascript
// Obter label de campo
const label = window.config.getFieldLabel('Status'); // "Status"

// Obter cor por tipo
const color = window.config.getColorByTipoManifestacao('Reclamação'); // "#f97316"

// Obter cor por status
const color = window.config.getColorByStatus('Aberto'); // "#3b82f6"

// Construir endpoint
const url = window.config.buildEndpoint('/api/aggregate/count-by', {
  field: 'Status'
});
```

---

## 🗄️ CACHE CONFIG

**Arquivo:** `core/cache-config.js`  
**Função:** Configuração centralizada de TTLs (Time To Live)

### O que faz:
- Define TTLs para todos os endpoints
- Única fonte de verdade para cache
- Usado por dataLoader e dataStore

### TTLs configurados:
```javascript
{
  STATIC: 30 * 60 * 1000,        // 30 minutos
  SEMI_STATIC: 10 * 60 * 1000,   // 10 minutos
  DYNAMIC: 5000,                 // 5 segundos
  
  ENDPOINTS: {
    '/api/distritos': 30 * 60 * 1000,
    '/api/unit/*': 30 * 60 * 1000,
    '/api/aggregate/by-month': 10 * 60 * 1000,
    '/api/dashboard-data': 5000,
    '/api/summary': 5000
  }
}
```

### Como usar:
```javascript
// Obter TTL para endpoint
const ttl = window.cacheConfig.getTTL('/api/summary'); // 5000

// Obter TTL padrão
const defaultTTL = window.cacheConfig.getDefaultTTL(); // 5000
```

---

## 🛠️ OUTROS UTILITÁRIOS

### **advanced-charts.js**
Gráficos avançados e visualizações complexas

### **chart-legend.js**
Sistema de legendas para gráficos

### **month-filter-helper.js**
Helper para filtros de mês

### **lazy-libraries.js**
Carregamento lazy de bibliotecas grandes (Chart.js, Leaflet)

---

## 🔗 DEPENDÊNCIAS ENTRE SISTEMAS

```
main.js
  └── Carrega todos os sistemas globais
  
chart-factory.js
  └── Usa: config.js (cores)
  
dataLoader.js
  └── Usa: cache-config.js (TTLs)
  └── Usa: global-store.js (cache)
  
global-store.js
  └── Usa: cache-config.js (TTLs)
  
chart-communication.js
  └── Integra: event-bus, global-filters, chart-registry, auto-connect
  
crossfilter-overview.js
  └── Usa: chart-communication (filtros)
  └── Usa: dataLoader (carregar dados)
```

---

## ✅ CHECKUP DOS SISTEMAS GLOBAIS

### ✅ Chart Factory
- [x] Funcional
- [x] Suporta todos os tipos de gráficos
- [x] Cores inteligentes implementadas
- [x] Modo claro/escuro suportado

### ✅ Data Loader
- [x] Funcional
- [x] Retry implementado
- [x] Timeouts adaptativos
- [x] Deduplicação funcionando

### ✅ Global Store
- [x] Funcional
- [x] TTL implementado
- [x] Persistência em localStorage
- [x] Listeners funcionando

### ✅ Chart Communication
- [x] Funcional
- [x] Módulos TypeScript migrados
- [x] Event bus funcionando
- [x] Filtros globais funcionando

### ✅ Crossfilter Overview
- [x] Funcional
- [x] Filtros multi-dimensionais
- [x] Banner visual implementado
- [x] Integração com gráficos

### ✅ Config
- [x] Funcional
- [x] Todas as cores mapeadas
- [x] Endpoints definidos
- [x] Formatação configurada

### ✅ Cache Config
- [x] Funcional
- [x] TTLs centralizados
- [x] Integração com dataLoader e dataStore

---

**Última Atualização:** 11/12/2025

