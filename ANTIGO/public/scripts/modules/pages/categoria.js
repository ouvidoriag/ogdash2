/**
 * Página: Categoria
 * Carregamento simplificado usando utilitários comuns
 * Inclui gráfico de barras e heatmap
 */

/**
 * Carregar página de Categoria
 */
async function loadCategoria(forceRefresh = false) {
  return window.pageUtils?.loadPage({
    pageId: 'page-categoria',
    cacheKey: 'loadCategoria',
    dataLoader: window.pageUtils.createParallelDataLoader([
      { endpoint: '/api/aggregate/count-by?field=Categoria', fallback: [] },
      { endpoint: '/api/aggregate/heatmap?dim=Categoria', fallback: { labels: [], rows: [] } }
    ]),
    renderer: async ([data, heatmapData]) => {
      // Gráfico de barras
      const labels = data.slice(0, 15).map(x => x.key || 'Não informado');
      const values = data.slice(0, 15).map(x => x.count || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartCategoria', labels, values, '#f472b6', {
        label: 'Categoria',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas do gráfico
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartCategoria',
          '/api/aggregate/count-by?field=Categoria',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.key || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.count || 0),
            color: '#f472b6',
            options: { label: 'Categoria', showDataLabels: true, anchor: 'start' }
          })
        );
      }
      
      // Heatmap
      if (heatmapData && (heatmapData.labels || []).length > 0) {
        if (window.data?.buildHeatmap) {
          window.data.buildHeatmap('heatmapCategoria', heatmapData.labels || [], heatmapData.rows || []);
        } else if (window.buildHeatmap) {
          window.buildHeatmap('heatmapCategoria', heatmapData.labels || [], heatmapData.rows || []);
        }
      }
    },
    forceRefresh
  });
}

// Exportar
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  window.data.loadCategoria = loadCategoria;
  window.loadCategoria = loadCategoria;
}

