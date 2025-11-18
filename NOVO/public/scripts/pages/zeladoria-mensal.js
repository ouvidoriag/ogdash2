/**
 * Página: Zeladoria - Análise Mensal
 */

async function loadZeladoriaMensal() {
  const page = document.getElementById('page-zeladoria-mensal');
  if (!page || page.style.display === 'none') return;
  
  try {
    const data = await window.dataLoader?.load('/api/zeladoria/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (data.length > 0) {
      const labels = data.map(d => {
        const [year, month] = d.month.split('-');
        return `${month}/${year}`;
      });
      const values = data.map(d => d.count);
      await window.chartFactory?.createLineChart('zeladoria-mensal-chart', labels, values, {
        colorIndex: 0
      });
    }
  } catch (error) {
    window.Logger?.error('Erro ao carregar Mensal Zeladoria:', error);
  }
}

window.loadZeladoriaMensal = loadZeladoriaMensal;

