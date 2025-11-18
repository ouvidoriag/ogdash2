/**
 * Página: Zeladoria - Tempo de Resolução
 */

async function loadZeladoriaTempo() {
  const page = document.getElementById('page-zeladoria-tempo');
  if (!page || page.style.display === 'none') return;
  
  try {
    const stats = await window.dataLoader?.load('/api/zeladoria/stats', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || {};
    
    // Criar gráfico simples mostrando tempo médio
    const labels = ['Tempo Médio de Resolução'];
    const values = [stats.tempoMedioResolucao || 0];
    
    await window.chartFactory?.createBarChart('zeladoria-tempo-chart', labels, values, {
      colorIndex: 6
    });
    
    // Adicionar informação adicional
    const canvas = document.getElementById('zeladoria-tempo-chart');
    if (canvas && canvas.parentElement) {
      const info = document.createElement('div');
      info.className = 'mt-4 text-center text-slate-400';
      info.innerHTML = `
        <p class="text-lg">Tempo médio: <span class="text-cyan-300 font-bold">${stats.tempoMedioResolucao || 0} dias</span></p>
        <p class="text-sm mt-2">Total de ocorrências fechadas: ${stats.fechados || 0}</p>
      `;
      canvas.parentElement.appendChild(info);
    }
  } catch (error) {
    window.Logger?.error('Erro ao carregar Tempo Zeladoria:', error);
  }
}

window.loadZeladoriaTempo = loadZeladoriaTempo;

