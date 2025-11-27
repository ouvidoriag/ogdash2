/**
 * Página: UAC (Unidade de Atendimento ao Cidadão)
 * 
 * Recriada com estrutura otimizada
 */

async function loadUAC(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('🏛️ loadUAC: Iniciando');
  }
  
  const page = document.getElementById('page-uac');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=UAC', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartUAC', labels, values, {
      horizontal: true,
      colorIndex: 6,
      label: 'Manifestações',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankUAC');
    if (rankEl) {
      rankEl.innerHTML = top20.map((item, idx) => `
        <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-cyan-300">${item.key || item._id || 'N/A'}</span>
          <span class="font-bold text-violet-300">${(item.count || 0).toLocaleString('pt-BR')}</span>
        </li>
      `).join('');
    }
    
    // Atualizar KPIs
    updateUACKPIs(data);
    
    if (window.Logger) {
      window.Logger.success('🏛️ loadUAC: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar UAC:', error);
    }
  }
}

/**
 * Atualizar KPIs da página UAC
 */
function updateUACKPIs(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return;
  }
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const uacsUnicas = data.length;
  const mediaUAC = uacsUnicas > 0 ? Math.round(total / uacsUnicas) : 0;
  const uacMaisAtiva = data.length > 0 ? (data[0].key || data[0]._id || 'N/A') : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalUAC');
  const kpiUnicas = document.getElementById('kpiUACsUnicas');
  const kpiMedia = document.getElementById('kpiMediaUAC');
  const kpiMaisAtiva = document.getElementById('kpiUACMaisAtiva');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicas) kpiUnicas.textContent = uacsUnicas.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaUAC.toLocaleString('pt-BR');
  if (kpiMaisAtiva) {
    kpiMaisAtiva.textContent = uacMaisAtiva.length > 20 ? uacMaisAtiva.substring(0, 20) + '...' : uacMaisAtiva;
    kpiMaisAtiva.title = uacMaisAtiva; // Tooltip com nome completo
  }
}

window.loadUAC = loadUAC;

