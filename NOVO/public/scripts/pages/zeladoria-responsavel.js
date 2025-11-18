/**
 * Página: Zeladoria - Por Responsável
 */

async function loadZeladoriaResponsavel() {
  const page = document.getElementById('page-zeladoria-responsavel');
  if (!page || page.style.display === 'none') return;
  
  try {
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=responsavel', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (data.length > 0) {
      const labels = data.slice(0, 15).map(d => d.key);
      const values = data.slice(0, 15).map(d => d.count);
      await window.chartFactory?.createBarChart('zeladoria-responsavel-chart', labels, values, {
        horizontal: true,
        colorIndex: 4
      });
    }
  } catch (error) {
    window.Logger?.error('Erro ao carregar Responsável Zeladoria:', error);
  }
}

window.loadZeladoriaResponsavel = loadZeladoriaResponsavel;

