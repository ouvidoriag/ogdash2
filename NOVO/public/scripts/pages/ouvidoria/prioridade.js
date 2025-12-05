/**
 * Página: Prioridades
 * 
 * Recriada com estrutura otimizada
 */

async function loadPrioridade(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('⚡ loadPrioridade: Iniciando');
  }
  
  const page = document.getElementById('page-prioridade');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Prioridade', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createDoughnutChart('chartPrioridade', labels, values, {
      type: 'doughnut',
      field: 'Prioridade', // Campo para cores consistentes
      onClick: false, // FILTROS DE CLIQUE DESABILITADOS
      legendContainer: 'legendPrioridade'
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankPrioridade');
    if (rankEl) {
      rankEl.innerHTML = top20.map((item, idx) => `
        <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-rose-300">${item.key || item._id || 'N/A'}</span>
          <span class="font-bold text-cyan-300">${(item.count || 0).toLocaleString('pt-BR')}</span>
        </li>
      `).join('');
    }
    
    // Atualizar KPIs
    updatePrioridadeKPIs(data);
    
    if (window.Logger) {
      window.Logger.success('⚡ loadPrioridade: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Prioridade:', error);
    }
  }
}

/**
 * Atualizar KPIs da página Prioridade
 */
function updatePrioridadeKPIs(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return;
  }
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const prioridadesUnicas = data.length;
  const mediaPrioridade = prioridadesUnicas > 0 ? Math.round(total / prioridadesUnicas) : 0;
  const prioridadeMaisComum = data.length > 0 ? (data[0].key || data[0]._id || 'N/A') : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalPrioridade');
  const kpiUnicas = document.getElementById('kpiPrioridadesUnicas');
  const kpiMedia = document.getElementById('kpiMediaPrioridade');
  const kpiMaisComum = document.getElementById('kpiPrioridadeMaisComum');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicas) kpiUnicas.textContent = prioridadesUnicas.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaPrioridade.toLocaleString('pt-BR');
  if (kpiMaisComum) {
    kpiMaisComum.textContent = prioridadeMaisComum.length > 20 ? prioridadeMaisComum.substring(0, 20) + '...' : prioridadeMaisComum;
    kpiMaisComum.title = prioridadeMaisComum; // Tooltip com nome completo
  }
}

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-prioridade', loadPrioridade, 500);
}

window.loadPrioridade = loadPrioridade;

