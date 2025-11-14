/**
 * Página: Por Tema
 * Carregamento simplificado usando utilitários comuns
 * Inclui gráfico de barras e heatmap
 */

/**
 * Carregar página de Tema
 */
async function loadTema() {
  return window.pageUtils?.loadPage({
    pageId: 'page-tema',
    cacheKey: 'loadTema',
    dataLoader: window.pageUtils.createParallelDataLoader([
      { endpoint: '/api/aggregate/by-theme', fallback: [] },
      { endpoint: '/api/aggregate/heatmap?dim=Tema', fallback: { labels: [], rows: [] } }
    ]),
    renderer: async ([data, heatmapData]) => {
      // Gráfico de barras
      const labels = data.slice(0, 15).map(x => x.tema || 'Não informado');
      const values = data.slice(0, 15).map(x => x.quantidade || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartTema', labels, values, '#22d3ee', {
        label: 'Tema',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas do gráfico
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartTema',
          '/api/aggregate/by-theme',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.tema || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.quantidade || 0),
            color: '#22d3ee',
            options: { label: 'Tema', showDataLabels: true, anchor: 'start' }
          })
        );
      }
      
      // Heatmap
      if (heatmapData && (heatmapData.labels || []).length > 0) {
        if (window.data?.buildHeatmap) {
          window.data.buildHeatmap('heatmapTema', heatmapData.labels || [], heatmapData.rows || []);
        } else if (window.buildHeatmap) {
          window.buildHeatmap('heatmapTema', heatmapData.labels || [], heatmapData.rows || []);
        }
      }
    }
  });
}

// Exportar
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  window.data.loadTema = loadTema;
  window.loadTema = loadTema;
}

