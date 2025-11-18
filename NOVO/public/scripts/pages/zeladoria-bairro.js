/**
 * Página: Zeladoria - Por Bairro
 */

async function loadZeladoriaBairro() {
  const page = document.getElementById('page-zeladoria-bairro');
  if (!page || page.style.display === 'none') return;
  
  try {
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=bairro', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (data.length > 0) {
      const labels = data.slice(0, 20).map(d => d.key);
      const values = data.slice(0, 20).map(d => d.count);
      await window.chartFactory?.createBarChart('zeladoria-bairro-chart', labels, values, {
        horizontal: true,
        colorIndex: 3
      });
    }
  } catch (error) {
    window.Logger?.error('Erro ao carregar Bairro Zeladoria:', error);
  }
}

window.loadZeladoriaBairro = loadZeladoriaBairro;

