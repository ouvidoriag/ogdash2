/**
 * Página: Responsáveis
 * Carregamento simplificado usando utilitários comuns
 */

/**
 * Carregar página de Responsável
 */
async function loadResponsavel() {
  return window.pageUtils?.loadPage({
    pageId: 'page-responsavel',
    cacheKey: 'loadResponsavel',
    dataLoader: window.pageUtils.createDataLoader('/api/aggregate/count-by?field=Responsavel', []),
    renderer: async (data) => {
      const labels = data.slice(0, 15).map(x => x.key || 'Não informado');
      const values = data.slice(0, 15).map(x => x.count || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartResponsavel', labels, values, '#06b6d4', {
        label: 'Responsável',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartResponsavel',
          '/api/aggregate/count-by?field=Responsavel',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.key || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.count || 0),
            color: '#06b6d4',
            options: { label: 'Responsável', showDataLabels: true, anchor: 'start' }
          })
        );
      }
    }
  });
}

// Exportar
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  window.data.loadResponsavel = loadResponsavel;
  window.loadResponsavel = loadResponsavel;
}

