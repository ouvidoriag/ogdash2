/**
 * Página: Setor (Unidade de Cadastro)
 * 
 * Recriada com estrutura otimizada
 */

async function loadSetor() {
  if (window.Logger) {
    window.Logger.debug('🏢 loadSetor: Iniciando');
  }
  
  const page = document.getElementById('page-setor');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Setor', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartSetor', labels, values, {
      horizontal: true,
      colorIndex: 1,
      label: 'Manifestações',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankSetor');
    if (rankEl) {
      rankEl.innerHTML = top20.map((item, idx) => `
        <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-emerald-300">${item.key || item._id || 'N/A'}</span>
          <span class="font-bold text-cyan-300">${(item.count || 0).toLocaleString('pt-BR')}</span>
        </li>
      `).join('');
    }
    
    // Atualizar KPIs
    updateSetorKPIs(data);
    
    if (window.Logger) {
      window.Logger.success('🏢 loadSetor: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Setor:', error);
    }
  }
}

/**
 * Atualizar KPIs da página Setor
 */
function updateSetorKPIs(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return;
  }
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const setoresUnicos = data.length;
  const mediaSetor = setoresUnicos > 0 ? Math.round(total / setoresUnicos) : 0;
  const setorMaisAtivo = data.length > 0 ? (data[0].key || data[0]._id || 'N/A') : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalSetor');
  const kpiUnicos = document.getElementById('kpiSetoresUnicos');
  const kpiMedia = document.getElementById('kpiMediaSetor');
  const kpiMaisAtivo = document.getElementById('kpiSetorMaisAtivo');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicos) kpiUnicos.textContent = setoresUnicos.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaSetor.toLocaleString('pt-BR');
  if (kpiMaisAtivo) {
    kpiMaisAtivo.textContent = setorMaisAtivo.length > 20 ? setorMaisAtivo.substring(0, 20) + '...' : setorMaisAtivo;
    kpiMaisAtivo.title = setorMaisAtivo; // Tooltip com nome completo
  }
}

window.loadSetor = loadSetor;

