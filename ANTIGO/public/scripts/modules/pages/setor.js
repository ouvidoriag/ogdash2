/**
 * Página: Unidade de Cadastro (Setor)
 * Carregamento simplificado usando utilitários comuns
 */

/**
 * Carregar página de Setor
 */
async function loadSetor() {
  return window.pageUtils?.loadPage({
    pageId: 'page-setor',
    cacheKey: 'loadSetor',
    dataLoader: window.pageUtils.createDataLoader('/api/aggregate/count-by?field=UnidadeCadastro', []),
    renderer: async (data) => {
      const labels = data.slice(0, 15).map(x => x.key || 'Não informado');
      const values = data.slice(0, 15).map(x => x.count || 0);
      
      await window.chartHelpers.createHorizontalBarChart('chartSetor', labels, values, '#34d399', {
        label: 'Unidade de Cadastro',
        showDataLabels: true,
        anchor: 'start'
      });
      
      // Subscribe para atualizações automáticas
      if (window.dataStore) {
        window.chartHelpers.addChartSubscribe(
          'chartSetor',
          '/api/aggregate/count-by?field=UnidadeCadastro',
          (newData) => ({
            labels: newData.slice(0, 15).map(x => x.key || 'Não informado'),
            values: newData.slice(0, 15).map(x => x.count || 0),
            color: '#34d399',
            options: { label: 'Unidade de Cadastro', showDataLabels: true, anchor: 'start' }
          })
        );
      }
    }
  });
}

// Exportar
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  window.data.loadSetor = loadSetor;
  window.loadSetor = loadSetor;
}

