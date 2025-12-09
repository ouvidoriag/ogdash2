/**
 * Página: Responsáveis
 * 
 * Recriada com estrutura otimizada
 */

// Usar helper global
const coletarFiltrosMes = window.MonthFilterHelper?.coletarFiltrosMes || (() => []);
const inicializarFiltroMes = window.MonthFilterHelper?.inicializarFiltroMes || (() => {});

let filtroMesResponsavel = '';

async function loadResponsavel() {
  if (window.Logger) {
    window.Logger.debug('👥 loadResponsavel: Iniciando');
  }
  
  const page = document.getElementById('page-responsavel');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Coletar filtros de mês
    const filtrosMes = coletarFiltrosMes('filtroMesResponsavel');
    
    // Combinar com filtros globais
    let activeFilters = filtrosMes;
    if (window.chartCommunication) {
      const globalFilters = window.chartCommunication.filters?.filters || [];
      activeFilters = [...globalFilters, ...filtrosMes];
    }
    
    // Aplicar filtros se houver
    let data = [];
    if (activeFilters.length > 0) {
      try {
        const filterRequest = {
          filters: activeFilters,
          originalUrl: '/api/aggregate/count-by?field=Responsavel'
        };
        
        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(filterRequest)
        });
        
        if (response.ok) {
          const filteredData = await response.json();
          const responsavelMap = new Map();
          filteredData.forEach(record => {
            const responsavel = record.responsavel || record.data?.responsavel || 'N/A';
            responsavelMap.set(responsavel, (responsavelMap.get(responsavel) || 0) + 1);
          });
          
          data = Array.from(responsavelMap.entries())
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count);
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.warn('Erro ao aplicar filtros, carregando sem filtros:', error);
        }
      }
    }
    
    // Se não aplicou filtros, carregar normalmente
    if (data.length === 0) {
      data = await window.dataLoader?.load('/api/aggregate/count-by?field=Responsavel', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [];
    }
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartResponsavel', labels, values, {
      horizontal: true,
      colorIndex: 7,
      label: 'Manifestações',
      onClick: false
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

// Exportar função imediatamente
window.loadResponsavel = loadResponsavel;

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-responsavel', loadResponsavel, 500);
}

// Inicializar filtro por mês
function initResponsavelPage() {
  if (window.MonthFilterHelper && window.MonthFilterHelper.inicializarFiltroMes) {
    window.MonthFilterHelper.inicializarFiltroMes({
      selectId: 'filtroMesResponsavel',
      endpoint: '/api/aggregate/by-month',
      mesSelecionado: filtroMesResponsavel,
      onChange: async (novoMes) => {
        filtroMesResponsavel = novoMes;
        await loadResponsavel();
      }
    });
  } else {
    setTimeout(initResponsavelPage, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResponsavelPage);
} else {
  initResponsavelPage();
}

