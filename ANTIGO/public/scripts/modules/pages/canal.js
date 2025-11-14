/**
 * Página: Canais
 * Carregamento simplificado usando utilitários comuns
 */

/**
 * Carregar página de Canal
 */
async function loadCanal(forceRefresh = false) {
  return window.pageUtils?.loadPage({
    pageId: 'page-canal',
    cacheKey: 'loadCanal',
    dataLoader: window.pageUtils.createDataLoader('/api/aggregate/count-by?field=Canal', []),
    renderer: async (data) => {
      const labels = data.slice(0, 15).map(x => x.key || 'Não informado');
      const values = data.slice(0, 15).map(x => x.count || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartCanal', labels, values, '#e879f9', {
        label: 'Canal',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartCanal',
          '/api/aggregate/count-by?field=Canal',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.key || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.count || 0),
            color: '#e879f9',
            options: { label: 'Canal', showDataLabels: true, anchor: 'start' }
          })
        );
      }
    },
    forceRefresh
  });
}

// Exportar
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  window.data.loadCanal = loadCanal;
  window.loadCanal = loadCanal;
}

