/**
 * Página: Bairro
 * Carregamento simplificado usando utilitários comuns
 * Inclui gráfico de barras e heatmap
 */

/**
 * Carregar página de Bairro
 */
async function loadBairro(forceRefresh = false) {
  return window.pageUtils?.loadPage({
    pageId: 'page-bairro',
    cacheKey: 'loadBairro',
    dataLoader: window.pageUtils.createParallelDataLoader([
      { endpoint: '/api/aggregate/count-by?field=Bairro', fallback: [] },
      { endpoint: '/api/aggregate/heatmap?dim=Bairro', fallback: { labels: [], rows: [] } }
    ]),
    renderer: async ([data, heatmapData]) => {
      // Gráfico de barras
      const labels = data.slice(0, 15).map(x => x.key || 'Não informado');
      const values = data.slice(0, 15).map(x => x.count || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartBairro', labels, values, '#f59e0b', {
        label: 'Bairro',
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas do gráfico
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartBairro',
          '/api/aggregate/count-by?field=Bairro',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.key || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.count || 0),
            color: '#f59e0b',
            options: { label: 'Bairro', anchor: 'start' }
          })
        );
      }
      
      // Heatmap
      if (heatmapData && (heatmapData.labels || []).length > 0) {
        if (window.data?.buildHeatmap) {
          window.data.buildHeatmap('heatmapBairro', heatmapData.labels || [], heatmapData.rows || []);
        } else if (window.buildHeatmap) {
          window.buildHeatmap('heatmapBairro', heatmapData.labels || [], heatmapData.rows || []);
        }
      }
    },
    forceRefresh
  });
}

// Exportar
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  window.data.loadBairro = loadBairro;
  window.loadBairro = loadBairro;
}

