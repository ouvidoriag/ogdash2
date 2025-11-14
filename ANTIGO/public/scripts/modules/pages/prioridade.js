/**
 * Página: Prioridades
 * Carregamento simplificado usando utilitários comuns
 */

/**
 * Carregar página de Prioridade
 */
async function loadPrioridade(forceRefresh = false) {
  return window.pageUtils?.loadPage({
    pageId: 'page-prioridade',
    cacheKey: 'loadPrioridade',
    dataLoader: window.pageUtils.createDataLoader('/api/aggregate/count-by?field=Prioridade', []),
    renderer: async (data) => {
      const labels = data.slice(0, 15).map(x => x.key || 'Não informado');
      const values = data.slice(0, 15).map(x => x.count || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartPrioridade', labels, values, '#f59e0b', {
        label: 'Prioridade',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartPrioridade',
          '/api/aggregate/count-by?field=Prioridade',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.key || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.count || 0),
            color: '#f59e0b',
            options: { label: 'Prioridade', showDataLabels: true, anchor: 'start' }
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
  window.data.loadPrioridade = loadPrioridade;
  window.loadPrioridade = loadPrioridade;
}

