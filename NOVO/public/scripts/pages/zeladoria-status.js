/**
 * Página: Zeladoria - Por Status
 */

async function loadZeladoriaStatus() {
  const page = document.getElementById('page-zeladoria-status');
  if (!page || page.style.display === 'none') return;
  
  try {
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=status', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (data.length > 0) {
      const labels = data.map(d => d.key);
      const values = data.map(d => d.count);
      await window.chartFactory?.createDoughnutChart('zeladoria-status-chart', labels, values, {
        onClick: true,
        colorIndex: 0
      });
    }
  } catch (error) {
    window.Logger?.error('Erro ao carregar Status Zeladoria:', error);
  }
}

window.loadZeladoriaStatus = loadZeladoriaStatus;

