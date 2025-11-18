/**
 * Página: Zeladoria - Por Categoria
 */

async function loadZeladoriaCategoria() {
  const page = document.getElementById('page-zeladoria-categoria');
  if (!page || page.style.display === 'none') return;
  
  try {
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=categoria', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (data.length > 0) {
      const labels = data.map(d => d.key);
      const values = data.map(d => d.count);
      await window.chartFactory?.createBarChart('zeladoria-categoria-chart', labels, values, {
        horizontal: true,
        colorIndex: 1
      });
    }
  } catch (error) {
    window.Logger?.error('Erro ao carregar Categoria Zeladoria:', error);
  }
}

window.loadZeladoriaCategoria = loadZeladoriaCategoria;

