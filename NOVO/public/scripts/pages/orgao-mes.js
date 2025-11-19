/**
 * Página: Por Órgão e Mês
 * Análise de manifestações por órgão e período mensal
 * 
 * Recriada com estrutura otimizada
 */

async function loadOrgaoMes(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('🏢 loadOrgaoMes: Iniciando');
  }
  
  const page = document.getElementById('page-orgao-mes');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Verificar se há filtros ativos
    const activeFilters = window.chartCommunication?.filters?.filters || [];
    const hasFilters = activeFilters.length > 0;
    
    if (window.Logger) {
      window.Logger.debug(`🏢 loadOrgaoMes: ${activeFilters.length} filtro(s) ativo(s)`, activeFilters);
    }
    
    let dataOrgaos = [];
    let dataMensal = [];
    
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'chartOrgaoMes'
      ]);
    }
    
    if (hasFilters) {
      // Se houver filtros, carregar dados filtrados e agregar localmente
      const filteredData = await window.dataLoader?.load('/api/filter', {
        useDataStore: false, // Não cachear dados filtrados
        ttl: 0
      }) || [];
      
      // Validar dados filtrados
      if (!Array.isArray(filteredData)) {
        if (window.Logger) {
          window.Logger.warn('🏢 loadOrgaoMes: Dados filtrados não são um array', filteredData);
        }
        filteredData = [];
      }
      
      if (window.Logger) {
        window.Logger.debug(`🏢 loadOrgaoMes: Dados filtrados recebidos`, { count: filteredData.length });
      }
      
      // Agregar órgãos dos dados filtrados
      const orgaoMap = new Map();
      const mesMap = new Map();
      
      filteredData.forEach(record => {
        // Extrair órgão
        const orgao = record.orgaos || record.data?.orgaos || 'Não informado';
        orgaoMap.set(orgao, (orgaoMap.get(orgao) || 0) + 1);
        
        // Extrair mês
        const dataCriacao = record.dataCriacao || record.data?.dataCriacao || record.data?.Data || '';
        if (dataCriacao) {
          const date = new Date(dataCriacao);
          if (!isNaN(date.getTime())) {
            const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            mesMap.set(ym, (mesMap.get(ym) || 0) + 1);
          }
        }
      });
      
      // Converter para arrays
      dataOrgaos = Array.from(orgaoMap.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
      
      dataMensal = Array.from(mesMap.entries())
        .map(([ym, count]) => ({ ym, count }))
        .sort((a, b) => a.ym.localeCompare(b.ym));
      
      if (window.Logger) {
        window.Logger.debug(`🏢 loadOrgaoMes: Dados agregados localmente`, { 
          orgaos: dataOrgaos.length, 
          meses: dataMensal.length 
        });
      }
    } else {
      // Sem filtros, carregar dados agregados normalmente
      dataOrgaos = await window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [];
      
      dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [];
    }
    
    // Renderizar lista de órgãos
    renderOrgaosList(dataOrgaos);
    
    // Renderizar gráfico mensal
    await renderOrgaoMesChart(dataMensal);
    
    // Atualizar KPI total
    const total = dataOrgaos.reduce((sum, item) => sum + (item.count || 0), 0);
    const totalEl = document.getElementById('totalOrgaos');
    if (totalEl) {
      totalEl.textContent = total.toLocaleString('pt-BR');
    }
    
    if (window.Logger) {
      window.Logger.success('🏢 loadOrgaoMes: Concluído');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar OrgaoMes:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar OrgaoMes:', error);
    }
  }
}

function renderOrgaosList(dataOrgaos) {
  const listaOrgaos = document.getElementById('listaOrgaos');
  if (!listaOrgaos) return;
  
  if (!dataOrgaos || dataOrgaos.length === 0) {
    listaOrgaos.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum órgão encontrado</div>';
    return;
  }
  
  const maxValue = Math.max(...dataOrgaos.map(d => d.count || 0), 1);
  listaOrgaos.innerHTML = dataOrgaos.map((item, idx) => {
    const width = ((item.count || 0) / maxValue) * 100;
    const key = item.key || item.organ || item._id || 'Não informado';
    const count = item.count || 0;
    
    // Tornar clicável para aplicar filtro
    return `
      <div 
        class="flex items-center gap-3 py-2 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors rounded px-2"
        data-orgao="${key}"
        onclick="if(window.chartCommunication){window.chartCommunication.applyFilter('Orgaos','${key.replace(/'/g, "\\'")}','listaOrgaos',{clearPrevious:true});}"
      >
        <div class="flex-1 min-w-0">
          <div class="text-sm text-slate-300 truncate">${key}</div>
          <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
          </div>
        </div>
        <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${count.toLocaleString('pt-BR')}</div>
      </div>
    `;
  }).join('');
}

async function renderOrgaoMesChart(dataMensal) {
  if (!dataMensal || dataMensal.length === 0) return;
  
  // Armazenar mapeamento label -> ym para uso no filtro
  const labelToYmMap = new Map();
  
  const labels = dataMensal.map(x => {
    const ym = x.ym || x.month || '';
    const formattedLabel = window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
    labelToYmMap.set(formattedLabel, ym);
    return formattedLabel;
  });
  const values = dataMensal.map(x => x.count || 0);
  
  await window.chartFactory?.createBarChart('chartOrgaoMes', labels, values, {
    horizontal: true,
    colorIndex: 1,
    label: 'Manifestações',
    onClick: true, // Habilitar comunicação e filtros
    // Callback customizado para converter label formatado para ym
    onClickCallback: (evt, points, chart) => {
      if (points.length > 0) {
        const point = points[0];
        const formattedLabel = chart.data.labels[point.index];
        const value = chart.data.datasets[point.datasetIndex].data[point.index];
        const ym = labelToYmMap.get(formattedLabel);
        
        // Mostrar feedback visual
        if (window.chartCommunication) {
          window.chartCommunication.showFeedback('chartOrgaoMes', formattedLabel, value);
        }
        
        if (ym && window.chartCommunication) {
          // Aplicar filtro usando o formato YYYY-MM que o backend entende
          window.chartCommunication.applyFilter(
            'Data',
            ym, // Usar o formato YYYY-MM ao invés do label formatado
            'chartOrgaoMes',
            { toggle: true, operator: 'contains', clearPrevious: true }
          );
        }
      }
    }
  });
}

/**
 * Inicializar listeners de filtro para a página OrgaoMes
 */
function initOrgaoMesFilterListeners() {
  if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
    window.chartCommunication.createPageFilterListener('page-orgao-mes', loadOrgaoMes, 500);
    if (window.Logger) {
      window.Logger.success('✅ Listeners de filtro para OrgaoMes inicializados');
    }
  }
}

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOrgaoMesFilterListeners);
} else {
  initOrgaoMesFilterListeners();
}

window.loadOrgaoMes = loadOrgaoMes;

