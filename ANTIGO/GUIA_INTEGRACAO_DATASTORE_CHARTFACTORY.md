-# Guia de Integração: Global Data Store + Chart Factory

## 📋 Visão Geral

Este guia demonstra como usar o **Global Data Store** e o **Chart Factory** de forma integrada para criar gráficos reativos e performáticos.

## 🎯 Fluxo de Dados Integrado

```
1. dataLoader.load('/api/endpoint')
   ↓
2. Verifica dataStore.get('endpoint') → Cache Hit? Retorna
   ↓ (Cache Miss)
3. Fetch da API
   ↓
4. dataStore.set('endpoint', data, deepCopy=true)
   ↓
5. Notifica listeners via notifyListeners()
   ↓
6. Gráficos inscritos atualizam automaticamente
```

## 🚀 Exemplos Práticos

### Exemplo 1: Gráfico Simples com Chart Factory

```javascript
// Carregar dados
const monthlyData = await window.dataLoader.load('/api/aggregate/by-month');

// Criar gráfico com Chart Factory
window.chartFactory.createLineChart('chartTrend',
  monthlyData.map(x => x.month),
  monthlyData.map(x => x.count),
  {
    label: 'Manifestações por Mês',
    colorIndex: 0, // Usa cor primária da paleta
    gradient: { from: '#06b6d4', to: '#22d3ee' }
  }
);
```

### Exemplo 2: Gráfico Reativo com Subscribe

```javascript
// Criar gráfico inicial
const monthlyData = await window.dataLoader.load('/api/aggregate/by-month');
window.chartFactory.createLineChart('chartTrend',
  monthlyData.map(x => x.month),
  monthlyData.map(x => x.count),
  { label: 'Manifestações por Mês' }
);

// Inscrever-se para atualizações automáticas
window.dataStore.subscribe('/api/aggregate/by-month', (newData) => {
  if (newData) {
    // Atualizar gráfico sem recriar
    window.chartFactory.updateChart('chartTrend',
      newData.map(x => x.month),
      newData.map(x => x.count)
    );
  }
});
```

### Exemplo 3: Gráfico Reativo Automático (Recomendado)

```javascript
// Usar createReactiveChart para automatizar tudo
window.chartFactory.createReactiveChart(
  'chartTrend',
  '/api/aggregate/by-month',
  (data) => ({
    labels: data.map(x => x.month),
    values: data.map(x => x.count)
  }),
  {
    type: 'line',
    label: 'Manifestações por Mês',
    colorIndex: 0
  }
);
```

### Exemplo 4: Múltiplos Datasets

```javascript
// Gráfico com múltiplas séries
const data = await window.dataLoader.load('/api/dashboard-data');

window.chartFactory.createLineChart('chartComparison',
  data.months,
  [
    { label: 'Concluído', data: data.completed },
    { label: 'Pendente', data: data.pending }
  ],
  {
    label: 'Comparação de Status'
  }
);
```

### Exemplo 5: Integração com Filtros

```javascript
// Quando filtro é aplicado
function applyFilter(field, value) {
  // Invalidar dados relevantes
  window.dataStore.invalidate([
    '/api/dashboard-data',
    '/api/aggregate/by-month',
    '/api/aggregate/by-theme'
  ]);
  
  // Recarregar dados (os gráficos reativos atualizarão automaticamente)
  setTimeout(() => {
    window.reloadAllData();
  }, 150);
}
```

## 🔧 API Reference

### Global Data Store

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

// Limpar tudo
window.dataStore.clear();

// Estatísticas
const stats = window.dataStore.getStats();
```

### Chart Factory

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

### Data Loader

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

## 📝 Opções do Chart Factory

### Opções Comuns

```javascript
{
  label: 'Nome do Dataset',
  colorIndex: 0,              // Índice da cor na paleta
  backgroundColor: '#22d3ee', // Cor customizada
  borderColor: '#06b6d4',     // Cor da borda
  horizontal: true,           // Para barras horizontais
  gradient: {                 // Para gráficos de linha
    from: '#06b6d4',
    to: '#22d3ee'
  },
  onClick: (event, elements, chart) => {
    // Handler de clique
  },
  chartOptions: {             // Opções do Chart.js
    // ...
  }
}
```

## 🎨 Paleta de Cores

As cores são obtidas automaticamente de `window.config.CHART_CONFIG.COLOR_PALETTE`:

```javascript
// Paleta padrão
[
  '#22d3ee', // 0 - Primária (cyan)
  '#a78bfa', // 1 - Secundária (violet)
  '#34d399', // 2 - Sucesso (green)
  '#f59e0b', // 3 - Aviso (amber)
  '#fb7185', // 4 - Perigo (rose)
  // ...
]
```

## 🔄 Migração de Código Antigo

### Antes (Código Antigo)

```javascript
// Buscar dados
const response = await fetch('/api/aggregate/by-month');
const data = await response.json();

// Criar gráfico manualmente
const ctx = document.getElementById('chartTrend').getContext('2d');
window.chartTrend = new Chart(ctx, {
  type: 'line',
  data: {
    labels: data.map(x => x.month),
    datasets: [{
      label: 'Manifestações',
      data: data.map(x => x.count),
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34,211,238,0.35)'
    }]
  },
  options: { /* ... */ }
});
```

### Depois (Código Novo)

```javascript
// Buscar dados (com cache automático)
const data = await window.dataLoader.load('/api/aggregate/by-month');

// Criar gráfico com Chart Factory
window.chartFactory.createLineChart('chartTrend',
  data.map(x => x.month),
  data.map(x => x.count),
  {
    label: 'Manifestações',
    colorIndex: 0 // Usa cor primária automaticamente
  }
);
```

### Ou com Reatividade Automática

```javascript
// Criar gráfico reativo (atualiza automaticamente)
window.chartFactory.createReactiveChart(
  'chartTrend',
  '/api/aggregate/by-month',
  (data) => ({
    labels: data.map(x => x.month),
    values: data.map(x => x.count)
  }),
  {
    type: 'line',
    label: 'Manifestações'
  }
);
```

## ⚡ Boas Práticas

1. **Sempre use dataLoader**: Nunca faça `fetch` direto, use `window.dataLoader.load()`
2. **Use createReactiveChart**: Para gráficos que precisam atualizar automaticamente
3. **Invalidar cache quando necessário**: Use `dataStore.invalidate()` ao aplicar filtros
4. **Limpar subscriptions**: Armazene `unsubscribe` e chame quando componente for removido
5. **Use colorIndex**: Prefira `colorIndex` em vez de cores hardcoded
6. **Deep copy por padrão**: Mantenha `deepCopy: true` para imutabilidade

## 🐛 Troubleshooting

### Gráfico não atualiza

- Verifique se o gráfico está inscrito: `window.dataStore.getStats()`
- Confirme que os dados estão sendo armazenados: `window.dataStore.get('key')`
- Verifique se `notifyListeners` está sendo chamado

### Cores não aparecem

- Verifique se `window.config.CHART_CONFIG.COLOR_PALETTE` está definido
- Use `window.chartFactory.getColorPalette()` para ver a paleta

### Performance lenta

- Verifique TTL do cache: `window.dataStore.getDefaultTTL()`
- Use `updateChart()` em vez de recriar gráficos
- Verifique se há múltiplas subscriptions para a mesma chave

## 📚 Referências

- `public/scripts/modules/global-store.js` - Implementação do Data Store
- `public/scripts/modules/chart-factory.js` - Implementação do Chart Factory
- `public/scripts/dataLoader.js` - Implementação do Data Loader
- `public/scripts/config.js` - Configurações centralizadas

