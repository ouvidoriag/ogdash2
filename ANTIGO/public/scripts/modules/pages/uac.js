/**
 * Página: UAC (Unidade de Atendimento ao Cidadão)
 * Carregamento simplificado usando utilitários comuns
 */

/**
 * Carregar página de UAC
 */
async function loadUAC(forceRefresh = false) {
  return window.pageUtils?.loadPage({
    pageId: 'page-uac',
    cacheKey: 'loadUAC',
    dataLoader: window.pageUtils.createDataLoader('/api/aggregate/count-by?field=UAC', []),
    renderer: async (data) => {
      const labels = data.slice(0, 15).map(x => x.key || 'Não informado');
      const values = data.slice(0, 15).map(x => x.count || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartUAC', labels, values, '#8b5cf6', {
        label: 'UAC',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartUAC',
          '/api/aggregate/count-by?field=UAC',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.key || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.count || 0),
            color: '#8b5cf6',
            options: { label: 'UAC', showDataLabels: true, anchor: 'start' }
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
  window.data.loadUAC = loadUAC;
  window.loadUAC = loadUAC;
}

