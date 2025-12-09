/**
 * Página: Canais
 * 
 * Recriada com estrutura otimizada
 */

let filtroMesCanal = '';

async function loadCanal(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('📡 loadCanal: Iniciando');
  }
  
  const page = document.getElementById('page-canal');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Coletar filtros de mês
    const filtrosMes = window.MonthFilterHelper?.coletarFiltrosMes?.('filtroMesCanal') || [];
    
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
          originalUrl: '/api/aggregate/count-by?field=Canal'
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
            const canalMap = new Map();
            filteredData.forEach(record => {
              const canal = record.canal || record.data?.canal || 'N/A';
              if (canal && canal !== 'N/A') {
                canalMap.set(canal, (canalMap.get(canal) || 0) + 1);
              }
            });
            
            data = Array.from(canalMap.entries())
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
      data = await window.dataLoader?.load('/api/aggregate/count-by?field=Canal', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [];
    }
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createDoughnutChart('chartCanal', labels, values, {
      type: 'doughnut',
      field: 'Canal', // Campo para cores consistentes
      onClick: false,
      legendContainer: 'legendCanal'
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankCanal');
    if (rankEl) {
      rankEl.innerHTML = top20.map((item, idx) => `
        <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-emerald-300">${item.key || item._id || 'N/A'}</span>
          <span class="font-bold text-cyan-300">${(item.count || 0).toLocaleString('pt-BR')}</span>
        </li>
      `).join('');
    }
    
    // Atualizar KPIs
    updateCanalKPIs(data);
    
    if (window.Logger) {
      window.Logger.success('📡 loadCanal: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Canal:', error);
    }
  }
}

/**
 * Atualizar KPIs da página Canal
 */
function updateCanalKPIs(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return;
  }
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const canaisUnicos = data.length;
  const mediaCanal = canaisUnicos > 0 ? Math.round(total / canaisUnicos) : 0;
  const canalMaisUsado = data.length > 0 ? (data[0].key || data[0]._id || 'N/A') : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalCanal');
  const kpiUnicos = document.getElementById('kpiCanaisUnicos');
  const kpiMedia = document.getElementById('kpiMediaCanal');
  const kpiMaisUsado = document.getElementById('kpiCanalMaisUsado');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicos) kpiUnicos.textContent = canaisUnicos.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaCanal.toLocaleString('pt-BR');
  if (kpiMaisUsado) {
    kpiMaisUsado.textContent = canalMaisUsado.length > 20 ? canalMaisUsado.substring(0, 20) + '...' : canalMaisUsado;
    kpiMaisUsado.title = canalMaisUsado; // Tooltip com nome completo
  }
}

// Exportar função imediatamente
window.loadCanal = loadCanal;

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-canal', loadCanal, 500);
}

// Inicializar filtro por mês
function initCanalPage() {
  if (window.MonthFilterHelper && window.MonthFilterHelper.inicializarFiltroMes) {
    window.MonthFilterHelper.inicializarFiltroMes({
      selectId: 'filtroMesCanal',
      endpoint: '/api/aggregate/by-month',
      mesSelecionado: filtroMesCanal,
      onChange: async (novoMes) => {
        filtroMesCanal = novoMes;
        await loadCanal(true);
      }
    });
  } else {
    setTimeout(initCanalPage, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCanalPage);
} else {
  initCanalPage();
}

