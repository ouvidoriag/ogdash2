/**
 * Página: Prioridades
 * 
 * Recriada com estrutura otimizada
 */

let filtroMesPrioridade = '';

async function loadPrioridade(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('⚡ loadPrioridade: Iniciando');
  }
  
  const page = document.getElementById('page-prioridade');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Coletar filtros de mês
    const filtrosMes = window.MonthFilterHelper?.coletarFiltrosMes?.('filtroMesPrioridade') || [];
    
    // Combinar com filtros globais
    let activeFilters = filtrosMes;
    if (window.chartCommunication) {
      const globalFilters = window.chartCommunication.filters?.filters || [];
      activeFilters = [...globalFilters, ...filtrosMes];
    }
    
    // Aplicar filtros se houver
    let data = [];
    let filtrosAplicados = false;
    
    if (activeFilters.length > 0) {
      filtrosAplicados = true;
      try {
        const filterRequest = {
          filters: activeFilters,
          originalUrl: '/api/aggregate/count-by?field=Prioridade'
        };
        
        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(filterRequest)
        });
        
        if (response.ok) {
          const filteredData = await response.json();
          if (Array.isArray(filteredData) && filteredData.length > 0) {
            const prioridadeMap = new Map();
            filteredData.forEach(record => {
              const prioridade = record.prioridade || record.data?.prioridade || 'N/A';
              if (prioridade && prioridade !== 'N/A') {
                prioridadeMap.set(prioridade, (prioridadeMap.get(prioridade) || 0) + 1);
              }
            });
            
            data = Array.from(prioridadeMap.entries())
              .map(([key, count]) => ({ key, count }))
              .sort((a, b) => b.count - a.count);
          }
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.warn('Erro ao aplicar filtros, carregando sem filtros:', error);
        }
        filtrosAplicados = false;
      }
    }
    
    // Se não aplicou filtros ou deu erro, carregar normalmente
    if (!filtrosAplicados || data.length === 0) {
      data = await window.dataLoader?.load('/api/aggregate/count-by?field=Prioridade', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [];
    }
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createDoughnutChart('chartPrioridade', labels, values, {
      type: 'doughnut',
      field: 'Prioridade', // Campo para cores consistentes
      onClick: false,
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

// Exportar função imediatamente
window.loadPrioridade = loadPrioridade;

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-prioridade', loadPrioridade, 500);
}

// Inicializar filtro por mês
function initPrioridadePage() {
  if (window.MonthFilterHelper && window.MonthFilterHelper.inicializarFiltroMes) {
    window.MonthFilterHelper.inicializarFiltroMes({
      selectId: 'filtroMesPrioridade',
      endpoint: '/api/aggregate/by-month',
      mesSelecionado: filtroMesPrioridade,
      onChange: async (novoMes) => {
        filtroMesPrioridade = novoMes;
        await loadPrioridade(true);
      }
    });
  } else {
    setTimeout(initPrioridadePage, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrioridadePage);
} else {
  initPrioridadePage();
}

