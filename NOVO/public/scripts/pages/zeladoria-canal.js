/**
 * Página: Zeladoria - Por Canal
 */

async function loadZeladoriaCanal() {
  const page = document.getElementById('page-zeladoria-canal');
  if (!page || page.style.display === 'none') return;
  
  try {
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=canal', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (data.length > 0) {
      const labels = data.map(d => d.key);
      const values = data.map(d => d.count);
      await window.chartFactory?.createDoughnutChart('zeladoria-canal-chart', labels, values, {
        onClick: true,
        colorIndex: 5
      });
    }
  } catch (error) {
    window.Logger?.error('Erro ao carregar Canal Zeladoria:', error);
  }
}

window.loadZeladoriaCanal = loadZeladoriaCanal;

