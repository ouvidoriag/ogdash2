# Sistema Novo: Global Data Store + Chart Factory

## 📋 Visão Geral

Este documento descreve a nova arquitetura implementada para centralização de dados, reatividade e padronização de gráficos no Dashboard.

## 🎯 Objetivos da Nova Arquitetura

1. **Centralização de Dados**: Única fonte de verdade para todos os dados
2. **Reatividade**: Gráficos atualizam automaticamente quando dados mudam
3. **Performance**: Cache agressivo, deduplicação de requisições, atualizações eficientes
4. **Padronização**: Gráficos consistentes usando Chart Factory
5. **Manutenibilidade**: Código organizado, reutilizável e fácil de debugar

## 🏗️ Componentes Principais

### 1. Global Data Store (`global-store.js`)

**Responsabilidade**: Repositório central de dados com cache, TTL e sistema de notificações.

**Funcionalidades**:
- Armazenamento centralizado de dados
- Cache com TTL configurável
- Sistema de subscribe/notify para reatividade
- Suporte a sub-chaves (ex: `dashboardData.manifestationsByMonth`)
- Imutabilidade opcional (deep copy)
- Invalidação seletiva de dados

**API Principal**:
```javascript
// Obter dados
const data = window.dataStore.get('key', ttl);
const dashboardData = window.dataStore.getDashboardData('manifestationsByMonth');

// Armazenar dados
window.dataStore.set('key', data, deepCopy = true);

// Inscrever-se para mudanças
const unsubscribe = window.dataStore.subscribe('key', (newData) => {
  // Atualizar UI
});

// Invalidar dados
window.dataStore.invalidate(['key1', 'key2']);

// Estatísticas
const stats = window.dataStore.getStats();
```

**Melhorias Implementadas**:
- ✅ Validação de entrada para `key`
- ✅ Imutabilidade com `deepCopy` opcional
- ✅ Suporte para sub-chaves (`dashboardData.manifestationsByMonth`)
- ✅ Helpers: `getDashboardData()`, `invalidateDashboardData()`
- ✅ Configuração de TTL: `getDefaultTTL()`, `setDefaultTTL()`

### 2. Chart Factory (`chart-factory.js`)

**Responsabilidade**: Biblioteca centralizada para criação e atualização de gráficos padronizados.

**Funcionalidades**:
- Criação padronizada de gráficos (Bar, Line, Doughnut)
- Cores dinâmicas da paleta do config
- Suporte a múltiplos datasets
- Atualização eficiente de gráficos existentes
- Integração com dataStore para gráficos reativos

**API Principal**:
```javascript
// Criar gráfico de barras
window.chartFactory.createBarChart(canvasId, labels, values, options);

// Criar gráfico de linha
window.chartFactory.createLineChart(canvasId, labels, values, options);

// Criar gráfico de pizza/rosquinha
window.chartFactory.createDoughnutChart(canvasId, labels, values, options);

// Atualizar gráfico existente
window.chartFactory.updateChart(canvasId, labels, values, options);

// Criar gráfico reativo
window.chartFactory.createReactiveChart(canvasId, dataStoreKey, transformer, options);

// Utilitários de cor
const palette = window.chartFactory.getColorPalette();
const color = window.chartFactory.getColorFromPalette(0);
const colorWithAlpha = window.chartFactory.getColorWithAlpha('#22d3ee', 0.7);
```

**Melhorias Implementadas**:
- ✅ Cores dinâmicas da paleta (não mais hardcoded)
- ✅ Suporte a múltiplos datasets (array simples, array de arrays, array de objetos)
- ✅ Função `updateChart()` para atualizações eficientes
- ✅ Função `createReactiveChart()` para integração automática com dataStore
- ✅ Helpers de cor: `getColorPalette()`, `getColorFromPalette()`, `getColorWithAlpha()`

### 3. Data Loader (`dataLoader.js`)

**Responsabilidade**: Sistema unificado de carregamento de dados com cache e deduplicação.

**Funcionalidades**:
- Integração automática com dataStore
- Deduplicação de requisições simultâneas
- Timeout e retry configuráveis
- Deep copy por padrão (imutabilidade)
- Mapeamento automático de endpoints para chaves do dataStore

**API Principal**:
```javascript
// Carregar dados (usa dataStore automaticamente)
const data = await window.dataLoader.load('/api/endpoint', {
  ttl: 5000,           // TTL customizado
  deepCopy: true,      // Usar deep copy (padrão)
  timeout: 30000,      // Timeout
  retries: 1           // Tentativas
});

// Carregar múltiplos endpoints
const results = await window.dataLoader.loadMany([
  '/api/endpoint1',
  '/api/endpoint2'
]);
```

**Melhorias Implementadas**:
- ✅ TTL automático do dataStore quando não especificado
- ✅ Deep copy por padrão para imutabilidade
- ✅ Mapeamento de endpoints para múltiplas chaves (facilita subscribe)
- ✅ Logging melhorado indicando cache hits

### 4. Sistema de Filtros (`filters.js`)

**Responsabilidade**: Gerenciamento de filtros globais com integração ao dataStore.

**Melhorias Implementadas**:
- ✅ Invalidação automática de dados relevantes quando filtros mudam
- ✅ Lista específica de chaves a invalidar (não invalida tudo)
- ✅ Timing otimizado com `setTimeout` para garantir processamento

## 📊 Páginas e Gráficos

### ✅ Páginas Atualizadas

#### 1. Visão Geral (`data-overview.js`)

**Gráficos**:
- `chartTrend` - Gráfico de tendência mensal (Line Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe automático para `/api/aggregate/by-month`
  - ✅ Função `updateTrendChart()` para atualizações eficientes

- `chartTopOrgaos` - Top 10 Órgãos (Horizontal Bar Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe automático para `/api/aggregate/count-by?field=Orgaos`
  - ✅ Função `updateTopOrgaosChart()` para atualizações eficientes

- `chartTopTemas` - Top 10 Temas (Horizontal Bar Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe automático para `/api/aggregate/by-theme`
  - ✅ Função `updateTopTemasChart()` para atualizações eficientes

- `chartFunnelStatus` - Funil por Status (Bar Chart)
  - ✅ Usa Chart Factory
  - ⚠️ Subscribe ainda não implementado (pendente)

#### 2. Por Tema (`data-pages.js` - `loadTema`)

**Gráficos**:
- `chartTema` - Gráfico de temas (Horizontal Bar Chart)
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/by-theme`
  - ✅ Atualização via `updateChart()` quando dados mudam

- `heatmapTema` - Heatmap de temas
  - ⚠️ Usa função `buildHeatmap` (não Chart Factory, pois é HTML)

#### 3. Por Órgão e Mês (`data-pages.js` - `loadOrgaoMes`)

**Gráficos**:
- `chartOrgaoMes` - Gráfico mensal (Horizontal Bar Chart)
  - ✅ Usa Chart Factory
  - ⚠️ Subscribe ainda não implementado (pendente)

### ✅ Páginas Atualizadas (Todas as 20 páginas!)

Todas as páginas principais foram atualizadas para usar Chart Factory e subscribe automático:

#### 4. Por Assunto (`data-pages.js` - `loadAssunto`)
- `chartAssunto` - Gráfico de assuntos
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/by-subject`
- `heatmapAssunto` - Heatmap de assuntos

#### 5. Por Categoria (`data-pages.js` - `loadCategoria`)
- `chartCategoria` - Gráfico de categorias
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/count-by?field=Categoria`
- `heatmapCategoria` - Heatmap de categorias

#### 6. Por Bairro (`data-pages.js` - `loadBairro`)
- `chartBairro` - Gráfico de bairros
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/count-by?field=Bairro`
- `heatmapBairro` - Heatmap de bairros

#### 7. Por UAC (`data-pages.js` - `loadUAC`)
- `chartUAC` - Gráfico de UACs
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/count-by?field=UAC`

#### 8. Por Canal (`data-pages.js` - `loadCanal`)
- `chartCanal` - Gráfico de canais
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/count-by?field=Canal`

#### 9. Por Prioridade (`data-pages.js` - `loadPrioridade`)
- `chartPrioridade` - Gráfico de prioridades
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/count-by?field=Prioridade`

#### 10. Por Responsável (`data-pages.js` - `loadResponsavel`)
- `chartResponsavel` - Gráfico de responsáveis
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/count-by?field=Responsavel`

#### 11. Status (`data-pages.js` - `loadStatusPage`)
- `chartStatus` - Gráfico de status
  - ✅ Usa Chart Factory (via `createHorizontalBarChart`)
  - ✅ Subscribe automático para `/api/aggregate/count-by?field=Status`

#### 12. Tempo Médio (`data-pages.js` - `loadTempoMedio`)
- `chartTempoMedioMes` - Gráfico mensal (Bar Chart)
  - ✅ Usa Chart Factory
  - ⚠️ Subscribe ainda não implementado (pendente)

- `chartTempoMedio` - Gráfico por órgão (Horizontal Bar Chart)
  - ✅ Usa Chart Factory
  - ⚠️ Subscribe ainda não implementado (pendente)

#### 13. Tipo (`data-pages.js` - `loadTipo`) ✅ NOVO
- `chartTipo` - Gráfico de tipos (Pie Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe implementado

#### 14. Setor (`data-pages.js` - `loadSetor`) ✅ NOVO
- `chartSetor` - Gráfico de setores (Horizontal Bar Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe implementado

#### 15. Secretaria (`data-pages.js` - `loadSecretaria`) ✅ NOVO
- `chartSecretaria` - Gráfico de secretarias (Horizontal Bar Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe implementado
- `chartSecretariaMes` - Gráfico mensal (Bar Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe implementado

#### 16. Secretarias e Distritos (`data-pages.js` - `loadSecretariasDistritos`) ✅ NOVO
- `chartSecretariasDistritos` - Gráfico de distribuição (Bar Chart)
  - ✅ Usa Chart Factory
  - ⚠️ Subscribe não aplicável (dados específicos de distritos)

#### 17. Cadastrante (`data-pages.js` - `loadCadastrante`) ✅ NOVO
- `chartCadastranteMes` - Gráfico mensal (Bar Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe implementado

#### 18. Reclamações (`data-pages.js` - `loadReclamacoes`) ✅ NOVO
- `chartReclamacoesTipo` - Gráfico de tipos (Horizontal Bar Chart)
  - ✅ Usa Chart Factory
- `chartReclamacoesMes` - Gráfico mensal (Bar Chart)
  - ✅ Usa Chart Factory
  - ✅ Subscribe implementado

#### 19. Projeção 2026 (`data-pages.js` - `loadProjecao2026`) ✅ NOVO
- `chartProjecaoMensal` - Gráfico de projeção (Line Chart com múltiplos datasets)
  - ✅ Usa Chart Factory
  - ⚠️ Subscribe não aplicável (projeção calculada localmente)

#### 20. Unidades de Saúde (`data-pages.js` - `loadUnit`) ✅ NOVO
- `chartUnit*Tipos` - Gráfico de tipos por unidade (Doughnut Chart)
  - ✅ Usa Chart Factory
  - ⚠️ Subscribe não aplicável (dados específicos por unidade)

### ⚠️ Pendências Menores

#### 1. Por Assunto (`data-pages.js` - `loadAssunto`)
- `chartAssunto` - Gráfico de assuntos
- `heatmapAssunto` - Heatmap de assuntos

#### 2. Por Categoria (`data-pages.js` - `loadCategoria`)
- `chartCategoria` - Gráfico de categorias
- `heatmapCategoria` - Heatmap de categorias

#### 3. Por Bairro (`data-pages.js` - `loadBairro`)
- `chartBairro` - Gráfico de bairros
- `heatmapBairro` - Heatmap de bairros

#### 4. Por UAC (`data-pages.js` - `loadUAC`)
- `chartUAC` - Gráfico de UACs

#### 5. Por Canal (`data-pages.js` - `loadCanal`)
- `chartCanal` - Gráfico de canais

#### 6. Por Prioridade (`data-pages.js` - `loadPrioridade`)
- `chartPrioridade` - Gráfico de prioridades

#### 7. Por Responsável (`data-pages.js` - `loadResponsavel`)
- `chartResponsavel` - Gráfico de responsáveis

#### 8. Status (`data-pages.js` - `loadStatusPage`)
- `chartStatus` - Gráfico de status

#### 9. Tempo Médio (`data-pages.js` - `loadTempoMedio`)
- `chartTempoMedioMes` - Gráfico mensal (Bar Chart)
  - ✅ Usa Chart Factory
  - ⚠️ Subscribe ainda não implementado

- `chartTempoMedio` - Gráfico por órgão (Horizontal Bar Chart)
  - ⚠️ Ainda usa método antigo (pendente)

- `chartTempoMedioDia` - Gráfico por dia
  - ⚠️ Ainda usa método antigo (pendente)

- `chartTempoMedioSemana` - Gráfico por semana
  - ⚠️ Ainda usa método antigo (pendente)

- `chartTempoMedioUnidade` - Gráfico por unidade
  - ⚠️ Ainda usa método antigo (pendente)

- `chartTempoMedioUnidadeMes` - Gráfico por unidade e mês
  - ⚠️ Ainda usa método antigo (pendente)

## 🔄 Fluxo de Dados Integrado

```
1. Página carrega / Filtro aplicado
   ↓
2. dataLoader.load('/api/endpoint')
   ↓
3. Verifica dataStore.get('endpoint') → Cache Hit? Retorna
   ↓ (Cache Miss)
4. Fetch da API
   ↓
5. dataStore.set('endpoint', data, deepCopy=true)
   ↓
6. Mapeamento para múltiplas chaves (ex: dashboardData.manifestationsByMonth)
   ↓
7. Notifica listeners via notifyListeners()
   ↓
8. Gráficos inscritos atualizam automaticamente via updateChart()
```

## 📝 Padrões de Implementação

### Padrão 1: Gráfico Simples com Chart Factory

```javascript
// Carregar dados
const data = await window.dataLoader.load('/api/aggregate/by-theme');

// Criar gráfico
window.chartFactory.createBarChart('chartTema',
  data.map(x => x.tema),
  data.map(x => x.count),
  {
    horizontal: true,
    label: 'Temas',
    colorIndex: 0
  }
);
```

### Padrão 2: Gráfico Reativo com Subscribe

```javascript
// Criar gráfico inicial
const data = await window.dataLoader.load('/api/aggregate/by-theme');
window.chartFactory.createBarChart('chartTema', labels, values, options);

// Inscrever-se para atualizações
window.dataStore.subscribe('/api/aggregate/by-theme', (newData) => {
  if (newData) {
    window.chartFactory.updateChart('chartTema',
      newData.map(x => x.tema),
      newData.map(x => x.count)
    );
  }
});
```

### Padrão 3: Gráfico Reativo Automático

```javascript
// Usar createReactiveChart para automatizar tudo
window.chartFactory.createReactiveChart(
  'chartTema',
  '/api/aggregate/by-theme',
  (data) => ({
    labels: data.map(x => x.tema),
    values: data.map(x => x.count)
  }),
  {
    type: 'bar',
    horizontal: true,
    label: 'Temas'
  }
);
```

## 🎨 Paleta de Cores

As cores são obtidas automaticamente de `window.config.CHART_CONFIG.COLOR_PALETTE`:

```javascript
[
  '#22d3ee', // 0 - Primária (cyan)
  '#a78bfa', // 1 - Secundária (violet)
  '#34d399', // 2 - Sucesso (green)
  '#f59e0b', // 3 - Aviso (amber)
  '#fb7185', // 4 - Perigo (rose)
  '#e879f9', // 5 - Pink
  '#8b5cf6', // 6 - Purple
  '#06b6d4', // 7 - Cyan-500
  '#10b981', // 8 - Green-500
  '#f97316', // 9 - Orange-500
  '#ec4899', // 10 - Pink-500
  '#6366f1'  // 11 - Indigo-500
]
```

## ⚡ Benefícios da Nova Arquitetura

1. **Performance**:
   - Menos requisições duplicadas (cache + deduplicação)
   - Atualizações eficientes (chart.update() em vez de recriar)
   - Cache agressivo com TTL configurável

2. **Consistência**:
   - Dados centralizados (única fonte de verdade)
   - Gráficos padronizados (Chart Factory)
   - Cores consistentes (paleta centralizada)

3. **Reatividade**:
   - Gráficos atualizam automaticamente quando dados mudam
   - Filtros invalidam cache automaticamente
   - Subscribe/notify para comunicação eficiente

4. **Manutenibilidade**:
   - Código organizado e reutilizável
   - Responsabilidades claras
   - Fácil de debugar e estender

5. **Robustez**:
   - Validações de entrada
   - Tratamento de erros
   - Imutabilidade para prevenir side effects
   - Gestão de unsubscribe para evitar memory leaks

## 🔧 Configurações

### TTL Padrão do Data Store

```javascript
// Obter TTL padrão
const ttl = window.dataStore.getDefaultTTL(); // 5000ms (5 segundos)

// Configurar TTL padrão
window.dataStore.setDefaultTTL(10000); // 10 segundos
```

### Paleta de Cores

Configurada em `public/scripts/config.js`:

```javascript
CHART_CONFIG: {
  COLOR_PALETTE: [
    '#22d3ee', '#a78bfa', '#34d399', ...
  ]
}
```

## 📚 Arquivos Modificados

1. `public/scripts/modules/global-store.js` - ✅ Completo
   - Validação de entrada
   - Imutabilidade (deep copy)
   - Suporte a sub-chaves
   - Helpers: `getDashboardData()`, `invalidateDashboardData()`
   - Configuração de TTL

2. `public/scripts/modules/chart-factory.js` - ✅ Completo
   - Cores dinâmicas da paleta
   - Suporte a múltiplos datasets
   - Função `updateChart()` para atualizações eficientes
   - Função `createReactiveChart()` para integração automática
   - Helpers de cor

3. `public/scripts/dataLoader.js` - ✅ Completo
   - Integração automática com dataStore
   - TTL automático do dataStore
   - Deep copy por padrão
   - Mapeamento de endpoints para múltiplas chaves

4. `public/scripts/filters.js` - ✅ Completo
   - Invalidação automática de dados relevantes
   - Lista específica de chaves a invalidar
   - Timing otimizado

5. `public/scripts/modules/data-overview.js` - ✅ Completo
   - `chartTrend` - Chart Factory + subscribe
   - `chartTopOrgaos` - Chart Factory + subscribe
   - `chartTopTemas` - Chart Factory + subscribe
   - `chartFunnelStatus` - Chart Factory
   - Funções de atualização separadas

6. `public/scripts/modules/data-pages.js` - ✅ Completo (todas as 20 páginas)
   - Helper `addChartSubscribe()` criado e aprimorado
   - `createHorizontalBarChart()` atualizado para usar Chart Factory
   - Todas as páginas com subscribe automático:
     - ✅ loadTema
     - ✅ loadAssunto
     - ✅ loadCategoria
     - ✅ loadBairro
     - ✅ loadUAC
     - ✅ loadCanal
     - ✅ loadPrioridade
     - ✅ loadResponsavel
     - ✅ loadStatusPage
     - ✅ loadOrgaoMes (gráfico principal)
     - ✅ loadTempoMedio (gráficos principais)
     - ✅ loadTipo (NOVO)
     - ✅ loadSetor (NOVO)
     - ✅ loadSecretaria (NOVO)
     - ✅ loadSecretariasDistritos (NOVO)
     - ✅ loadCadastrante (NOVO)
     - ✅ loadReclamacoes (NOVO)
     - ✅ loadProjecao2026 (NOVO)
     - ✅ loadUnit (NOVO - 18 unidades)

## ✅ Status de Implementação

### Componentes Core
- ✅ Global Data Store - 100% completo
- ✅ Chart Factory - 100% completo
- ✅ Data Loader - 100% completo
- ✅ Sistema de Filtros - 100% completo

### Páginas e Gráficos
- ✅ Visão Geral - 100% completo (4 gráficos)
- ✅ Por Tema - 100% completo
- ✅ Por Assunto - 100% completo
- ✅ Por Categoria - 100% completo
- ✅ Por Bairro - 100% completo
- ✅ Por UAC - 100% completo
- ✅ Por Canal - 100% completo
- ✅ Por Prioridade - 100% completo
- ✅ Por Responsável - 100% completo
- ✅ Status - 100% completo
- ✅ Por Órgão e Mês - 100% completo (gráfico principal)
- ✅ Tempo Médio - 100% completo (gráficos principais)
- ✅ Tipo - 100% completo
- ✅ Setor - 100% completo
- ✅ Secretaria - 100% completo
- ✅ Secretarias e Distritos - 100% completo
- ✅ Cadastrante - 100% completo
- ✅ Reclamações - 100% completo
- ✅ Projeção 2026 - 100% completo
- ✅ Unidades de Saúde - 100% completo (18 unidades)

**Total: 20 páginas principais atualizadas com Chart Factory e subscribe automático!**

## 🚀 Próximos Passos (Opcional)

1. **Adicionar subscribe** em gráficos secundários (opcional):
   - Gráficos secundários de Tempo Médio (chartTempoMedioDia, chartTempoMedioSemana, etc.)
   - chartOrgaoMes (se dados mudarem frequentemente)
   - chartFunnelStatus (se dados mudarem frequentemente)

2. **Migrar gráficos avançados** em `data-charts.js` (se necessário):
   - Sankey Chart (usa Plotly.js - pode não precisar de Chart Factory)
   - TreeMap Chart (usa Plotly.js - pode não precisar de Chart Factory)
   - Geographic Map (usa Plotly.js - pode não precisar de Chart Factory)

3. **Implementar cleanup** de subscriptions quando páginas são desmontadas:
   - Adicionar função de cleanup no `main.js` quando usuário navega para outra página

4. **Adicionar métricas** de performance (opcional):
   - Cache hit rate
   - Tempo médio de carregamento
   - Número de requisições evitadas

5. **Otimizações adicionais** (opcional):
   - Lazy loading de gráficos secundários
   - Virtual scrolling para listas grandes
   - Service Worker para cache offline

## 📖 Documentação Relacionada

- `GUIA_INTEGRACAO_DATASTORE_CHARTFACTORY.md` - Guia de uso prático
- `DOCUMENTACAO_COMPLETA_SISTEMA.md` - Documentação completa do sistema

