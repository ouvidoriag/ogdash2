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
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartResponsavel', labels, values, {
      horizontal: true,
      colorIndex: 7,
      label: 'Manifestações',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankResponsavel');
    if (rankEl) {
      rankEl.innerHTML = top20.map((item, idx) => `
        <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-violet-300">${item.key || item._id || 'N/A'}</span>
          <span class="font-bold text-cyan-300">${(item.count || 0).toLocaleString('pt-BR')}</span>
        </li>
      `).join('');
    }
    
    // Atualizar KPIs
    updateResponsavelKPIs(data);
    
    if (window.Logger) {
      window.Logger.success('👥 loadResponsavel: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Responsavel:', error);
    }
  }
}

/**
 * Atualizar KPIs da página Responsável
 */
function updateResponsavelKPIs(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return;
  }
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const responsaveisUnicos = data.length;
  const mediaResponsavel = responsaveisUnicos > 0 ? Math.round(total / responsaveisUnicos) : 0;
  const responsavelMaisAtivo = data.length > 0 ? (data[0].key || data[0]._id || 'N/A') : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalResponsavel');
  const kpiUnicos = document.getElementById('kpiResponsaveisUnicos');
  const kpiMedia = document.getElementById('kpiMediaResponsavel');
  const kpiMaisAtivo = document.getElementById('kpiResponsavelMaisAtivo');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicos) kpiUnicos.textContent = responsaveisUnicos.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaResponsavel.toLocaleString('pt-BR');
  if (kpiMaisAtivo) {
    kpiMaisAtivo.textContent = responsavelMaisAtivo.length > 20 ? responsavelMaisAtivo.substring(0, 20) + '...' : responsavelMaisAtivo;
    kpiMaisAtivo.title = responsavelMaisAtivo; // Tooltip com nome completo
  }
}

window.loadResponsavel = loadResponsavel;

