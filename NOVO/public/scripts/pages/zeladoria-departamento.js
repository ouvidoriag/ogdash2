/**
 * Página: Zeladoria - Por Departamento
 */

async function loadZeladoriaDepartamento() {
  const page = document.getElementById('page-zeladoria-departamento');
  if (!page || page.style.display === 'none') return;
  
  try {
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=departamento', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (data.length > 0) {
      const labels = data.map(d => d.key);
      const values = data.map(d => d.count);
      await window.chartFactory?.createBarChart('zeladoria-departamento-chart', labels, values, {
        horizontal: true,
        colorIndex: 2
      });
    }
  } catch (error) {
    window.Logger?.error('Erro ao carregar Departamento Zeladoria:', error);
  }
}

window.loadZeladoriaDepartamento = loadZeladoriaDepartamento;

