/**
 * Página: Tipos de Manifestação
 * Carregamento simplificado usando utilitários comuns
 */

/**
 * Carregar página de Tipos
 */
async function loadTipo() {
  return window.pageUtils?.loadPage({
    pageId: 'page-tipo',
    cacheKey: 'loadTipo',
    dataLoader: window.pageUtils.createDataLoader('/api/aggregate/count-by?field=Tipo', []),
    renderer: async (data) => {
      const labels = data.slice(0, 15).map(x => x.key || 'Não informado');
      const values = data.slice(0, 15).map(x => x.count || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartTipo', labels, values, '#22d3ee', {
        label: 'Tipo',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartTipo',
          '/api/aggregate/count-by?field=Tipo',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.key || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.count || 0),
            color: '#22d3ee',
            options: { label: 'Tipo', showDataLabels: true, anchor: 'start' }
          })
        );
      }
    }
  });
}

// Exportar
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  window.data.loadTipo = loadTipo;
  window.loadTipo = loadTipo;
}

