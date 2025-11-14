/**
 * Página: Canais
 * 
 * Recriada com estrutura otimizada
 */

async function loadCanal(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('📡 loadCanal: Iniciando');
  }
  
  const page = document.getElementById('page-canal');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Canal', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top10 = data.slice(0, 10);
    const labels = top10.map(x => x.key || x._id || 'N/A');
    const values = top10.map(x => x.count || 0);
    
    await window.chartFactory?.createDoughnutChart('chartCanal', labels, values, {
      type: 'doughnut',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankCanal');
    if (rankEl) {
      rankEl.innerHTML = top10.map((item, idx) => `
        <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-emerald-300">${item.key || item._id || 'N/A'}</span>
          <span class="font-bold text-cyan-300">${(item.count || 0).toLocaleString('pt-BR')}</span>
        </li>
      `).join('');
    }
    
    if (window.Logger) {
      window.Logger.success('📡 loadCanal: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Canal:', error);
    }
  }
}

window.loadCanal = loadCanal;

