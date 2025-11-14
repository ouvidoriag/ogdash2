/**
 * Página: Responsáveis
 * 
 * Recriada com estrutura otimizada
 */

async function loadResponsavel() {
  if (window.Logger) {
    window.Logger.debug('👥 loadResponsavel: Iniciando');
  }
  
  const page = document.getElementById('page-responsavel');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Responsavel', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top10 = data.slice(0, 10);
    const labels = top10.map(x => x.key || x._id || 'N/A');
    const values = top10.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartResponsavel', labels, values, {
      horizontal: true,
      colorIndex: 7,
      label: 'Manifestações',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankResponsavel');
    if (rankEl) {
      rankEl.innerHTML = top10.map((item, idx) => `
        <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-violet-300">${item.key || item._id || 'N/A'}</span>
          <span class="font-bold text-cyan-300">${(item.count || 0).toLocaleString('pt-BR')}</span>
        </li>
      `).join('');
    }
    
    if (window.Logger) {
      window.Logger.success('👥 loadResponsavel: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Responsavel:', error);
    }
  }
}

window.loadResponsavel = loadResponsavel;

