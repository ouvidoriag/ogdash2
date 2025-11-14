/**
 * Página: Por Assunto
 * Carregamento simplificado usando utilitários comuns
 * Inclui gráfico de barras e heatmap
 */

/**
 * Carregar página de Assunto
 */
async function loadAssunto() {
  return window.pageUtils?.loadPage({
    pageId: 'page-assunto',
    cacheKey: 'loadAssunto',
    dataLoader: window.pageUtils.createParallelDataLoader([
      { endpoint: '/api/aggregate/by-subject', fallback: [] },
      { endpoint: '/api/aggregate/heatmap?dim=Assunto', fallback: { labels: [], rows: [] } }
    ]),
    renderer: async ([data, heatmapData]) => {
      // Gráfico de barras
      const labels = data.slice(0, 15).map(x => x.assunto || 'Não informado');
      const values = data.slice(0, 15).map(x => x.quantidade || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartAssunto', labels, values, '#a78bfa', {
        label: 'Assunto',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas do gráfico
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartAssunto',
          '/api/aggregate/by-subject',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.assunto || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.quantidade || 0),
            color: '#a78bfa',
            options: { label: 'Assunto', showDataLabels: true, anchor: 'start' }
          })
        );
      }
      
      // Heatmap
      if (heatmapData && (heatmapData.labels || []).length > 0) {
        if (window.data?.buildHeatmap) {
          window.data.buildHeatmap('heatmapAssunto', heatmapData.labels || [], heatmapData.rows || []);
        } else if (window.buildHeatmap) {
          window.buildHeatmap('heatmapAssunto', heatmapData.labels || [], heatmapData.rows || []);
        }
      }
    }
  });
}

// Exportar
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  window.data.loadAssunto = loadAssunto;
  window.loadAssunto = loadAssunto;
}

