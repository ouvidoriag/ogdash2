# 🔧 SISTEMAS GLOBAIS - Documentação Completa

**Data**: 03/12/2025  
**Versão**: 2.0  
**CÉREBRO X-3**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Sistemas Principais](#sistemas-principais)
3. [Integração entre Sistemas](#integração-entre-sistemas)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Boas Práticas](#boas-práticas)

---

## 🎯 VISÃO GERAL

O sistema possui **8 sistemas globais principais** que fornecem funcionalidades compartilhadas para todas as páginas e componentes do dashboard.

### Lista Completa

1. **`window.dataLoader`** - Carregamento de dados com cache e controle de concorrência
2. **`window.dataStore`** - Repositório central de dados com cache persistente
3. **`window.chartFactory`** - Fábrica de gráficos padronizados (Chart.js)
4. **`window.chartCommunication`** - Sistema de comunicação entre gráficos e filtros globais
5. **`window.advancedCharts`** - Gráficos avançados com Plotly.js
6. **`window.config`** - Configurações globais centralizadas
7. **`window.chartLegend`** - Sistema de legendas interativas
8. **`window.Logger`** - Sistema de logging estruturado

---

## 🔧 SISTEMAS PRINCIPAIS

### 1. **dataLoader** - `window.dataLoader`

**Arquivo**: `public/scripts/core/dataLoader.js`  
**Descrição**: Sistema unificado de carregamento de dados com cache, deduplicação, controle de concorrência e retry automático.

#### Funcionalidades

- ✅ **Controle de Concorrência**: Máximo de 6 requisições simultâneas
- ✅ **Timeouts Adaptativos**: Timeouts diferentes por tipo de endpoint
- ✅ **Retry com Backoff**: Retry automático com backoff exponencial
- ✅ **Deduplicação**: Evita requisições duplicadas
- ✅ **Integração com dataStore**: Usa cache do dataStore quando disponível
- ✅ **Fallback**: Retorna valores fallback em caso de erro

#### API Principal

```javascript
window.dataLoader.load(endpoint, options)
```

#### Parâmetros

- `endpoint` (string): URL do endpoint
- `options` (object):
  - `fallback` (any): Valor a retornar em caso de erro
  - `timeout` (number): Timeout em ms (null = adaptativo)
  - `retries` (number): Número de tentativas (padrão: 1)
  - `useDataStore` (boolean): Usar cache do dataStore (padrão: true)
  - `priority` (string): 'high', 'normal', 'low' (padrão: 'normal')
  - `ttl` (number): TTL em ms para cache
  - `deepCopy` (boolean): Fazer deep copy dos dados (padrão: true)

#### Timeouts Adaptativos

```javascript
'/api/summary': 10000,        // 10s - rápido
'/api/distinct': 10000,       // 10s - rápido
'/api/health': 5000,          // 5s - muito rápido
'/api/dashboard-data': 90000, // 90s - muito pesado
'/api/aggregate': 60000,      // 60s - médio/pesado
'/api/stats': 60000,          // 60s - pesado
'/api/sla': 90000,            // 90s - muito pesado
default: 30000                // 30s - padrão
```

#### Exemplo de Uso

```javascript
// Carregamento simples
const data = await window.dataLoader.load('/api/dashboard-data');

// Com opções customizadas
const data = await window.dataLoader.load('/api/summary', {
  timeout: 15000,
  retries: 2,
  fallback: [],
  priority: 'high'
});
```

---

### 2. **dataStore** - `window.dataStore`

**Arquivo**: `public/scripts/core/global-store.js`  
**Descrição**: Repositório central de dados com cache em memória e localStorage, sistema de listeners e TTL configurável.

#### Funcionalidades

- ✅ **Cache em Memória**: Cache rápido em Map
- ✅ **Cache Persistente**: localStorage para sobreviver a recarregamentos
- ✅ **TTL Configurável**: TTLs diferentes por tipo de endpoint
- ✅ **Sistema de Listeners**: Notificação quando dados mudam
- ✅ **Deep Copy**: Proteção contra mutação acidental
- ✅ **Invalidação**: Sistema de invalidação de cache

#### API Principal

```javascript
// Obter dados
window.dataStore.get(key, ttl)

// Armazenar dados
window.dataStore.set(key, data, ttl)

// Limpar cache
window.dataStore.clear(key)

// Invalidar cache
window.dataStore.invalidate(keys)

// Inscrever-se em mudanças
window.dataStore.subscribe(key, callback)

// Estatísticas
window.dataStore.getStats()
```

#### TTLs Configurados

```javascript
static: 30 * 60 * 1000,              // 30 minutos
'/api/distritos': 30 * 60 * 1000,    // 30 minutos
'/api/unit/*': 30 * 60 * 1000,       // 30 minutos
semiStatic: 10 * 60 * 1000,          // 10 minutos
'/api/aggregate/by-month': 10 * 60 * 1000, // 10 minutos
dynamic: 5000,                        // 5 segundos
'/api/dashboard-data': 5000,          // 5 segundos
'/api/summary': 5000                  // 5 segundos
```

#### Exemplo de Uso

```javascript
// Obter dados (com cache automático)
const data = window.dataStore.get('/api/dashboard-data', 5000);

// Armazenar dados
window.dataStore.set('/api/dashboard-data', data, 5000);

// Inscrever-se em mudanças
window.dataStore.subscribe('/api/dashboard-data', (newData) => {
  console.log('Dados atualizados:', newData);
});

// Invalidar cache
window.dataStore.invalidate(['/api/dashboard-data', '/api/summary']);
```

---

### 3. **chartFactory** - `window.chartFactory`

**Arquivo**: `public/scripts/core/chart-factory.js`  
**Descrição**: Fábrica de gráficos padronizados usando Chart.js com configurações centralizadas, paleta de cores e suporte a modo claro/escuro.

#### Funcionalidades

- ✅ **Gráficos Padronizados**: Bar, Line, Doughnut, Pie, etc.
- ✅ **Paleta de Cores**: Paleta centralizada com suporte a modo claro/escuro
- ✅ **Lazy Loading**: Carrega Chart.js sob demanda
- ✅ **Destruição Segura**: Previne memory leaks
- ✅ **Atualização Reativa**: Atualização automática via dataStore
- ✅ **Tooltips Customizados**: Tooltips padronizados

#### API Principal

```javascript
// Criar gráfico de barras
window.chartFactory.createBarChart(canvasId, labels, values, options)

// Criar gráfico de linha
window.chartFactory.createLineChart(canvasId, labels, values, options)

// Criar gráfico de rosca
window.chartFactory.createDoughnutChart(canvasId, labels, values, options)

// Atualizar gráfico
window.chartFactory.updateChart(chartId, newData)

// Destruir gráfico
window.chartFactory.destroyChartSafely(chartId)

// Destruir múltiplos gráficos
window.chartFactory.destroyCharts(chartIds)
```

#### Exemplo de Uso

```javascript
// Criar gráfico de barras
const chart = window.chartFactory.createBarChart('chartStatus', 
  ['Aberto', 'Em Andamento', 'Concluído'],
  [100, 50, 200],
  {
    title: 'Status das Manifestações',
    colors: ['#22d3ee', '#a78bfa', '#34d399']
  }
);

// Atualizar gráfico
window.chartFactory.updateChart('chartStatus', {
  labels: ['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'],
  values: [100, 50, 200, 10]
});

// Destruir gráfico
window.chartFactory.destroyChartSafely('chartStatus');
```

---

### 4. **chartCommunication** - `window.chartCommunication`

**Arquivo**: `public/scripts/core/chart-communication.js`  
**Descrição**: Sistema de comunicação entre gráficos, filtros globais e atualização reativa de componentes.

#### Funcionalidades

- ✅ **Event Bus**: Sistema de eventos global
- ✅ **Filtros Globais**: Sistema de filtros compartilhados
- ✅ **Atualização Reativa**: Gráficos atualizam automaticamente
- ✅ **Auto-Connect**: Conexão automática de páginas
- ✅ **Mapeamento de Campos**: Mapeamento automático de campos
- ✅ **Feedback Visual**: Feedback visual de interações

#### API Principal

```javascript
// Aplicar filtro
window.chartCommunication.applyFilter(field, value, operation)

// Escutar eventos
window.chartCommunication.on(event, callback)

// Emitir evento
window.chartCommunication.emit(event, data)

// Obter filtros ativos
window.chartCommunication.filters.filters

// Limpar filtros
window.chartCommunication.filters.clear()

// Criar listener de filtro para página
window.chartCommunication.createPageFilterListener(pageId, reloadFunction)
```

#### Eventos Disponíveis

- `filter:added` - Filtro adicionado
- `filter:removed` - Filtro removido
- `filter:cleared` - Filtros limpos
- `filter:changed` - Filtros mudaram
- `chart:click` - Clique em gráfico
- `chart:update` - Gráfico atualizado

#### Exemplo de Uso

```javascript
// Aplicar filtro
window.chartCommunication.applyFilter('Status', 'Aberto', 'equals');

// Escutar mudanças de filtro
window.chartCommunication.on('filter:changed', (filters) => {
  console.log('Filtros ativos:', filters);
  // Recarregar dados
  loadData();
});

// Obter filtros ativos
const activeFilters = window.chartCommunication.filters.filters;
```

---

### 5. **advancedCharts** - `window.advancedCharts`

**Arquivo**: `public/scripts/core/advanced-charts.js`  
**Descrição**: Gráficos avançados usando Plotly.js (Sankey, TreeMap, Mapas Geográficos, Heatmaps).

#### Funcionalidades

- ✅ **Lazy Loading**: Carrega Plotly.js sob demanda
- ✅ **Sankey Charts**: Diagramas de fluxo
- ✅ **TreeMap Charts**: Mapas de árvore
- ✅ **Mapas Geográficos**: Mapas interativos
- ✅ **Heatmaps**: Mapas de calor

#### API Principal

```javascript
// Carregar Plotly.js
await window.advancedCharts.ensurePlotly()

// Criar gráfico Sankey
window.advancedCharts.loadSankeyChart(containerId, data)

// Criar TreeMap
window.advancedCharts.loadTreeMapChart(containerId, data)

// Criar mapa geográfico
window.advancedCharts.loadGeographicMap(containerId, data)

// Criar heatmap
window.advancedCharts.buildHeatmap(containerId, data)
```

#### Exemplo de Uso

```javascript
// Criar gráfico Sankey
await window.advancedCharts.loadSankeyChart('sankeyChart', {
  nodes: [...],
  links: [...]
});

// Criar mapa geográfico
await window.advancedCharts.loadGeographicMap('geoMap', {
  locations: [...],
  values: [...]
});
```

---

### 6. **config** - `window.config`

**Arquivo**: `public/scripts/core/config.js`  
**Descrição**: Configurações globais centralizadas (nomes de campos, endpoints, cores, formatos).

#### Funcionalidades

- ✅ **Nomes de Campos**: Mapeamento de nomes de campos
- ✅ **Endpoints**: Endpoints centralizados
- ✅ **Cores**: Paleta de cores e mapeamento por tipo
- ✅ **Formatos**: Configurações de formato (data, número, etc.)
- ✅ **Performance**: Configurações de performance

#### API Principal

```javascript
// Obter label de campo
window.config.getFieldLabel(field)

// Construir endpoint
window.config.buildEndpoint(endpoint, params)

// Verificar modo claro
window.config.isLightMode()

// Obter cor por tipo de manifestação
window.config.getColorByTipoManifestacao(tipo)
```

#### Estrutura

```javascript
window.config = {
  FIELD_NAMES: {...},        // Nomes de campos
  FIELD_LABELS: {...},       // Labels de campos
  API_ENDPOINTS: {...},      // Endpoints
  CHART_CONFIG: {...},       // Configurações de gráficos
  FORMAT_CONFIG: {...},      // Configurações de formato
  PERFORMANCE_CONFIG: {...}  // Configurações de performance
}
```

#### Exemplo de Uso

```javascript
// Obter label de campo
const label = window.config.getFieldLabel('Status'); // 'Status'

// Construir endpoint
const url = window.config.buildEndpoint('/api/aggregate/count-by', {
  field: 'Status',
  servidor: 'Servidor1'
});

// Obter cor por tipo
const color = window.config.getColorByTipoManifestacao('reclamação');
```

---

### 7. **chartLegend** - `window.chartLegend`

**Arquivo**: `public/scripts/core/chart-legend.js`  
**Descrição**: Sistema de legendas interativas para gráficos (marcar/desmarcar datasets).

#### Funcionalidades

- ✅ **Legendas Interativas**: Marcar/desmarcar datasets
- ✅ **Controles**: Botões "Marcar Todos" / "Desmarcar Todos"
- ✅ **Atualização Automática**: Gráfico atualiza automaticamente
- ✅ **Suporte a Múltiplos Tipos**: Bar, Line, Doughnut, etc.

#### API Principal

```javascript
// Criar legenda interativa
window.chartLegend.createInteractiveLegend(chartId, containerId, datasets, options)

// Criar legenda para doughnut
window.chartLegend.createDoughnutLegend(chartId, containerId, labels, values, colors, options)
```

#### Exemplo de Uso

```javascript
// Criar legenda interativa
const legend = window.chartLegend.createInteractiveLegend(
  'chartStatus',
  'legendStatus',
  chart.data.datasets
);

// Obter visibilidade
const visibility = legend.getVisibility();

// Definir visibilidade
legend.setVisibility('Aberto', false);
```

---

### 8. **Logger** - `window.Logger`

**Arquivo**: `public/scripts/utils/logger.js`  
**Descrição**: Sistema de logging estruturado com níveis (debug, info, warn, error, success).

#### Funcionalidades

- ✅ **Níveis de Log**: debug, info, warn, error, success
- ✅ **Formatação**: Formatação automática de mensagens
- ✅ **Timestamps**: Timestamps automáticos
- ✅ **Cores**: Cores diferentes por nível (no console)

#### API Principal

```javascript
// Debug
window.Logger.debug(message, data)

// Info
window.Logger.info(message, data)

// Warning
window.Logger.warn(message, data)

// Error
window.Logger.error(message, data)

// Success
window.Logger.success(message, data)
```

#### Exemplo de Uso

```javascript
// Debug
window.Logger.debug('Carregando dados...', { endpoint: '/api/dashboard-data' });

// Info
window.Logger.info('Dados carregados', { count: 100 });

// Warning
window.Logger.warn('Cache expirado', { key: '/api/dashboard-data' });

// Error
window.Logger.error('Erro ao carregar dados', { error: error.message });

// Success
window.Logger.success('Dados carregados com sucesso');
```

---

## 🔗 INTEGRAÇÃO ENTRE SISTEMAS

### Fluxo Típico

```
1. Página chama dataLoader.load()
   ↓
2. dataLoader verifica dataStore (cache)
   ↓
3. Se não em cache, faz requisição HTTP
   ↓
4. dataLoader salva em dataStore
   ↓
5. Página usa chartFactory para criar gráficos
   ↓
6. Gráficos se conectam ao chartCommunication
   ↓
7. chartCommunication gerencia filtros globais
   ↓
8. Filtros atualizam dataStore
   ↓
9. dataStore notifica listeners
   ↓
10. Gráficos atualizam automaticamente
```

### Exemplo Completo

```javascript
// 1. Carregar dados
const data = await window.dataLoader.load('/api/dashboard-data', {
  useDataStore: true,
  ttl: 5000
});

// 2. Criar gráfico
const chart = window.chartFactory.createBarChart('chartStatus',
  data.manifestationsByStatus.map(s => s.status),
  data.manifestationsByStatus.map(s => s.count)
);

// 3. Conectar ao sistema de filtros
window.chartCommunication.on('filter:changed', (filters) => {
  // Recarregar dados quando filtros mudarem
  loadData();
});

// 4. Aplicar filtro ao clicar no gráfico
chart.on('click', (event) => {
  const status = data.manifestationsByStatus[event.dataIndex].status;
  window.chartCommunication.applyFilter('Status', status, 'equals');
});
```

---

## 📚 EXEMPLOS DE USO

### Exemplo 1: Carregamento com Cache

```javascript
async function loadDashboardData() {
  // Usar dataLoader com cache automático
  const data = await window.dataLoader.load('/api/dashboard-data', {
    useDataStore: true,
    ttl: 5000,
    fallback: { total: 0, byStatus: [] }
  });
  
  // Renderizar gráficos
  renderCharts(data);
}
```

### Exemplo 2: Filtros Globais

```javascript
// Aplicar filtro
window.chartCommunication.applyFilter('Status', 'Aberto', 'equals');

// Escutar mudanças
window.chartCommunication.on('filter:changed', async (filters) => {
  // Recarregar dados com filtros
  const data = await window.dataLoader.load('/api/filter', {
    method: 'POST',
    body: JSON.stringify({ filters })
  });
  
  // Atualizar gráficos
  updateCharts(data);
});
```

### Exemplo 3: Gráfico Reativo

```javascript
// Criar gráfico
const chart = window.chartFactory.createBarChart('chartStatus', labels, values);

// Inscrever-se em mudanças de dados
window.dataStore.subscribe('/api/dashboard-data', (newData) => {
  // Atualizar gráfico automaticamente
  window.chartFactory.updateChart('chartStatus', {
    labels: newData.manifestationsByStatus.map(s => s.status),
    values: newData.manifestationsByStatus.map(s => s.count)
  });
});
```

---

## ✅ BOAS PRÁTICAS

### 1. Sempre Use dataLoader

❌ **Errado**:
```javascript
const response = await fetch('/api/dashboard-data');
const data = await response.json();
```

✅ **Correto**:
```javascript
const data = await window.dataLoader.load('/api/dashboard-data');
```

### 2. Use dataStore para Cache

❌ **Errado**:
```javascript
let cachedData = null;
if (!cachedData) {
  cachedData = await fetch('/api/dashboard-data').then(r => r.json());
}
```

✅ **Correto**:
```javascript
const data = await window.dataLoader.load('/api/dashboard-data', {
  useDataStore: true,
  ttl: 5000
});
```

### 3. Sempre Destrua Gráficos

❌ **Errado**:
```javascript
// Criar gráfico sem destruir anterior
window.chartFactory.createBarChart('chart', labels, values);
```

✅ **Correto**:
```javascript
// Destruir gráfico anterior
window.chartFactory.destroyChartSafely('chart');
// Criar novo gráfico
window.chartFactory.createBarChart('chart', labels, values);
```

### 4. Use Logger para Debug

❌ **Errado**:
```javascript
console.log('Dados carregados:', data);
```

✅ **Correto**:
```javascript
window.Logger.debug('Dados carregados', { count: data.length });
```

### 5. Conecte Gráficos ao Sistema de Filtros

❌ **Errado**:
```javascript
// Gráfico isolado, não reage a filtros
const chart = window.chartFactory.createBarChart('chart', labels, values);
```

✅ **Correto**:
```javascript
// Gráfico conectado ao sistema de filtros
const chart = window.chartFactory.createBarChart('chart', labels, values);
window.chartCommunication.on('filter:changed', () => {
  updateChart(chart);
});
```

---

## 📊 ESTATÍSTICAS

- **Total de Sistemas Globais**: 8
- **Arquivos Core**: 7
- **Linhas de Código**: ~5000+
- **Páginas que Usam**: 37
- **Endpoints Integrados**: 100+

---

## 🔄 ATUALIZAÇÕES

**Última Atualização**: 03/12/2025  
**Versão**: 2.0  
**Migração**: Prisma → Mongoose (completa)

---

**CÉREBRO X-3**  
**Status**: ✅ **DOCUMENTAÇÃO COMPLETA E ATUALIZADA**

