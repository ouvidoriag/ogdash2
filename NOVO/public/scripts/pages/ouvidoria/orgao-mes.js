/**
 * Página: Por Órgão e Mês
 * Análise de manifestações por órgão e período mensal
 * 
 * Refatorada para usar o sistema global de filtros
 */

// Variáveis globais para controle de ordenação e busca
let currentOrgaosData = [];
let sortAscending = false;
let searchTerm = '';

/**
 * Extrair valor de um campo de um registro
 * @param {Object} record - Registro do banco
 * @param {string} field - Nome do campo
 * @returns {string|null} Valor do campo ou null
 */
function extractFieldValue(record, field) {
  if (!record) return null;
  
  // Tentar múltiplos caminhos possíveis
  const paths = [
    record[field],
    record[field?.toLowerCase()],
    record.data?.[field],
    record.data?.[field?.toLowerCase()],
    record.data?.[field?.charAt(0).toUpperCase() + field?.slice(1).toLowerCase()]
  ];
  
  for (const value of paths) {
    if (value !== null && value !== undefined && value !== '') {
      return String(value);
    }
  }
  
  return null;
}

/**
 * Extrair data de criação de um registro
 * @param {Object} record - Registro do banco
 * @returns {string|null} Data no formato YYYY-MM-DD ou YYYY-MM
 */
function extractDataCriacao(record) {
  if (!record) return null;
  
  // Tentar múltiplos campos possíveis
  const dateFields = [
    record.dataCriacaoIso,
    record.dataCriacao,
    record.dataDaCriacao,
    record.data?.dataCriacaoIso,
    record.data?.dataCriacao,
    record.data?.dataDaCriacao,
    record.data?.data_da_criacao,
    record.data?.Data,
    record.data?.data
  ];
  
  for (const dateValue of dateFields) {
    if (dateValue) {
      // Se já está no formato YYYY-MM, retornar direto
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      
      // Tentar usar função global se disponível
      if (window.getDataCriacao) {
        const globalDate = window.getDataCriacao(record);
        if (globalDate) {
          return globalDate;
        }
      }
      
      // Tentar converter para Date
      try {
        let dateStr = String(dateValue);
        if (!dateStr.includes('T')) {
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateStr = dateStr + 'T00:00:00';
          } else if (dateStr.match(/^\d{4}-\d{2}$/)) {
            return dateStr; // Já está no formato correto
          }
        }
        
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      } catch (e) {
        // Continuar tentando outros campos
      }
    }
  }
  
  return null;
}

/**
 * Agregar dados filtrados localmente
 * @param {Array} filteredData - Array de registros filtrados
 * @returns {Object} Objeto com dataOrgaos e dataMensal
 */
function aggregateFilteredData(filteredData) {
  const orgaoMap = new Map();
  const mesMap = new Map();
  
  filteredData.forEach(record => {
    // Extrair órgão
    const orgao = extractFieldValue(record, 'orgaos') || 
                 extractFieldValue(record, 'Orgaos') ||
                 extractFieldValue(record, 'Secretaria') ||
                 'Não informado';
    
    if (orgao && orgao !== 'Não informado' && orgao !== 'null' && orgao !== 'undefined') {
      orgaoMap.set(orgao, (orgaoMap.get(orgao) || 0) + 1);
    }
    
    // Extrair mês
    const dataCriacao = extractDataCriacao(record);
    if (dataCriacao) {
      // Garantir formato YYYY-MM
      const ym = dataCriacao.match(/^(\d{4}-\d{2})/)?.[1] || dataCriacao;
      if (ym && /^\d{4}-\d{2}$/.test(ym)) {
        mesMap.set(ym, (mesMap.get(ym) || 0) + 1);
      }
    }
  });
  
  // Converter para arrays
  const dataOrgaos = Array.from(orgaoMap.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
  
  const dataMensal = Array.from(mesMap.entries())
    .map(([ym, count]) => ({ ym, count }))
    .sort((a, b) => a.ym.localeCompare(b.ym));
  
  return { dataOrgaos, dataMensal };
}

async function loadOrgaoMes(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('🏢 loadOrgaoMes: Iniciando');
  }
  
  const page = document.getElementById('page-orgao-mes');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  
  try {
    // Coletar filtros da página (mês e status)
    const pageFilters = collectPageFilters();
    
    // Verificar se há filtros ativos usando o sistema global
    let activeFilters = null;
    if (window.chartCommunication) {
      const globalFilters = window.chartCommunication.filters?.filters || [];
      // Combinar filtros globais com filtros da página
      activeFilters = [...globalFilters, ...pageFilters];
      if (activeFilters.length > 0) {
        if (window.Logger) {
          window.Logger.debug(`🏢 loadOrgaoMes: ${activeFilters.length} filtro(s) ativo(s)`, activeFilters);
        }
      }
    } else if (pageFilters.length > 0) {
      activeFilters = pageFilters;
    }
    
    let dataOrgaos = [];
    let dataMensal = [];
    
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'chartOrgaoMes',
        'chartTopOrgaosBar'
      ]);
    }
    
    // Se houver filtros ativos, usar endpoint /api/filter e agregar localmente
    if (activeFilters && activeFilters.length > 0) {
      try {
        const filterRequest = {
          filters: activeFilters,
          originalUrl: window.location.pathname
        };
        
        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Enviar cookies de sessão
          body: JSON.stringify(filterRequest)
        });
        
        if (response.ok) {
          const filteredData = await response.json();
          
          // Validar dados filtrados
          if (!Array.isArray(filteredData)) {
            if (window.Logger) {
              window.Logger.warn('🏢 loadOrgaoMes: Dados filtrados não são um array', filteredData);
            }
            throw new Error('Dados filtrados inválidos');
          }
          
          if (window.Logger) {
            window.Logger.debug(`🏢 loadOrgaoMes: Dados filtrados recebidos`, { 
              count: filteredData.length,
              sampleRecord: filteredData[0] ? {
                hasOrgaos: !!(extractFieldValue(filteredData[0], 'orgaos')),
                hasData: !!(extractDataCriacao(filteredData[0]))
              } : null
            });
          }
          
          // Log de aviso se recebeu exatamente 10.000 registros (pode indicar limite)
          if (filteredData.length === 10000) {
            if (window.Logger) {
              window.Logger.warn('⚠️ loadOrgaoMes: Recebidos exatamente 10.000 registros - pode haver limite aplicado incorretamente');
            }
          }
          
          // Agregar dados localmente
          const aggregated = aggregateFilteredData(filteredData);
          dataOrgaos = aggregated.dataOrgaos;
          dataMensal = aggregated.dataMensal;
          
          // Normalizar formato de dataMensal (já vem como { ym, count } da agregação)
          // Mas garantir formato consistente
          dataMensal = dataMensal.map(m => ({
            ym: m.ym || m.month || m._id,
            count: m.count || 0
          })).filter(m => m.ym);
          
          if (window.Logger) {
            window.Logger.debug(`🏢 loadOrgaoMes: Dados agregados localmente`, { 
              orgaos: dataOrgaos.length, 
              meses: dataMensal.length,
              totalOrgaos: dataOrgaos.reduce((sum, o) => sum + (o.count || 0), 0),
              totalMeses: dataMensal.reduce((sum, m) => sum + (m.count || 0), 0)
            });
          }
        } else {
          throw new Error(`Erro ao buscar dados filtrados: ${response.statusText}`);
        }
      } catch (filterError) {
        if (window.Logger) {
          window.Logger.warn('Erro ao aplicar filtros, carregando sem filtros:', filterError);
        }
        // Em caso de erro, carregar sem filtros
        dataOrgaos = await window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {
          useDataStore: !forceRefresh,
          ttl: 10 * 60 * 1000
        }) || [];
        
        dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', {
          useDataStore: !forceRefresh,
          ttl: 10 * 60 * 1000
        }) || [];
        
        // Normalizar formato de dataMensal
        dataMensal = dataMensal.map(m => ({
          ym: m.month || m.ym || m._id,
          count: m.count || 0
        })).filter(m => m.ym);
      }
    } else {
      // Sem filtros, carregar dados agregados normalmente
      dataOrgaos = await window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {
        useDataStore: !forceRefresh,
        ttl: 10 * 60 * 1000
      }) || [];
      
      dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', {
        useDataStore: !forceRefresh,
        ttl: 10 * 60 * 1000
      }) || [];
      
      // Normalizar formato de dataMensal (pode vir como { month, count } ou { ym, count })
      dataMensal = dataMensal.map(m => ({
        ym: m.month || m.ym || m._id,
        count: m.count || 0
      })).filter(m => m.ym);
    }
    
    // Armazenar dados globalmente para busca e ordenação
    currentOrgaosData = dataOrgaos;
    
    // Limpar busca e ordenação quando dados mudam
    const searchInput = document.getElementById('searchOrgaos');
    if (searchInput) {
      searchInput.value = '';
      searchTerm = '';
    }
    sortAscending = false;
    const sortModeEl = document.getElementById('sortMode');
    if (sortModeEl) {
      sortModeEl.textContent = 'Maior → Menor';
    }
    
    // Renderizar lista de órgãos
    renderOrgaosList(dataOrgaos);
    
    // Renderizar gráfico mensal
    await renderOrgaoMesChart(dataMensal);
    
    // Renderizar gráfico de barras dos top órgãos
    await renderTopOrgaosBarChart(dataOrgaos);
    
    // Atualizar KPIs
    updateKPIs(dataOrgaos, dataMensal);
    
    
    // Atualizar info mensal
    const infoMensal = document.getElementById('infoMensal');
    if (infoMensal) {
      if (activeFilters && activeFilters.length > 0) {
        const lastFilter = activeFilters[activeFilters.length - 1];
        infoMensal.textContent = `Filtro ativo: ${lastFilter.field} = ${lastFilter.value}`;
      } else {
        infoMensal.textContent = 'Clique em um mês ou órgão para filtrar';
      }
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
  
  // Aplicar busca se houver termo de busca
  let filteredData = dataOrgaos;
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredData = dataOrgaos.filter(item => {
      const key = (item.key || item.organ || item._id || '').toLowerCase();
      return key.includes(searchLower);
    });
  }
  
  // Aplicar ordenação
  if (sortAscending) {
    filteredData = [...filteredData].sort((a, b) => (a.count || 0) - (b.count || 0));
  } else {
    filteredData = [...filteredData].sort((a, b) => (b.count || 0) - (a.count || 0));
  }
  
  if (!filteredData || filteredData.length === 0) {
    listaOrgaos.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum órgão encontrado</div>';
    return;
  }
  
  const maxValue = Math.max(...filteredData.map(d => d.count || 0), 1);
  listaOrgaos.innerHTML = filteredData.map((item, idx) => {
    const width = ((item.count || 0) / maxValue) * 100;
    const key = item.key || item.organ || item._id || 'Não informado';
    const count = item.count || 0;
    const percent = maxValue > 0 ? ((count / maxValue) * 100).toFixed(1) : '0';
    
    // Destacar se está filtrado
    const isFiltered = window.chartCommunication?.filters?.filters?.some(f => 
      f.field === 'Orgaos' && f.value === key
    );
    
    return `
      <div 
        class="flex items-center gap-3 py-3 border-b border-white/5 hover:bg-white/10 cursor-pointer transition-all rounded-lg px-3 ${isFiltered ? 'bg-cyan-500/10 border-cyan-500/30' : ''}"
        data-orgao="${key}"
        // FILTROS DE CLIQUE DESABILITADOS - onclick removido
        title="Clique para filtrar por ${key}"
      >
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div class="text-xs font-bold text-slate-500 w-6 text-right">${idx + 1}º</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-200 truncate">${key}</div>
            <div class="mt-1.5 h-2 bg-slate-800 rounded-full overflow-hidden relative">
              <div class="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 transition-all duration-300" style="width: ${width}%"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-[10px] text-slate-300 font-semibold">${percent}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="text-right min-w-[80px]">
          <div class="text-lg font-bold text-cyan-300">${count.toLocaleString('pt-BR')}</div>
          <div class="text-xs text-slate-500">manifestações</div>
        </div>
      </div>
    `;
  }).join('');
}

async function renderOrgaoMesChart(dataMensal) {
  if (!dataMensal || dataMensal.length === 0) {
    const canvas = document.getElementById('chartOrgaoMes');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
    return;
  }
  
  // Armazenar mapeamento label -> ym para uso no filtro
  const labelToYmMap = new Map();
  
  const labels = dataMensal.map(x => {
    const ym = x.ym || x.month || '';
    const formattedLabel = window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
    labelToYmMap.set(formattedLabel, ym);
    return formattedLabel;
  });
  const values = dataMensal.map(x => x.count || 0);
  
  // Calcular estatísticas
  const total = values.reduce((sum, v) => sum + v, 0);
  const media = values.length > 0 ? Math.round(total / values.length) : 0;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const maxIndex = values.indexOf(max);
  const minIndex = values.indexOf(min);
  
  // Atualizar informações
  const mesMaxEl = document.getElementById('mesMax');
  const mesMinEl = document.getElementById('mesMin');
  const mesMediaEl = document.getElementById('mesMedia');
  
  if (mesMaxEl) mesMaxEl.textContent = `${labels[maxIndex]}: ${max.toLocaleString('pt-BR')}`;
  if (mesMinEl) mesMinEl.textContent = `${labels[minIndex]}: ${min.toLocaleString('pt-BR')}`;
  if (mesMediaEl) mesMediaEl.textContent = `${media.toLocaleString('pt-BR')}`;
  
  await window.chartFactory?.createBarChart('chartOrgaoMes', labels, values, {
    horizontal: false, // Gráfico vertical
    colorIndex: 1,
    label: 'Manifestações',
    onClick: false, // FILTROS DE CLIQUE DESABILITADOS
    chartOptions: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString('pt-BR');
            }
          }
        }
      }
    },
    // FILTROS DE CLIQUE DESABILITADOS - onClickCallback removido
  });
}

/**
 * Renderizar gráfico de barras dos top órgãos
 */
async function renderTopOrgaosBarChart(dataOrgaos) {
  if (!dataOrgaos || dataOrgaos.length === 0) return;
  
  const top10 = dataOrgaos.slice(0, 10);
  const labels = top10.map(o => {
    const key = o.key || o.organ || o._id || 'Não informado';
    // Truncar nomes longos
    return key.length > 30 ? key.substring(0, 30) + '...' : key;
  });
  const values = top10.map(o => o.count || 0);
  
  await window.chartFactory?.createBarChart('chartTopOrgaosBar', labels, values, {
    horizontal: true,
    colorIndex: 2,
    label: 'Manifestações',
    onClick: false, // FILTROS DE CLIQUE DESABILITADOS
    chartOptions: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.x.toLocaleString('pt-BR')}`;
            }
          }
        }
      }
    },
    // FILTROS DE CLIQUE DESABILITADOS - onClickCallback removido
  });
}

/**
 * Atualizar KPIs da página
 */
function updateKPIs(dataOrgaos, dataMensal) {
  const total = dataOrgaos.reduce((sum, item) => sum + (item.count || 0), 0);
  const orgaosUnicos = dataOrgaos.length;
  const mediaOrgao = orgaosUnicos > 0 ? Math.round(total / orgaosUnicos) : 0;
  
  // Calcular período
  let periodo = '—';
  if (dataMensal && dataMensal.length > 0) {
    const sorted = [...dataMensal].sort((a, b) => (a.ym || '').localeCompare(b.ym || ''));
    const primeiro = sorted[0];
    const ultimo = sorted[sorted.length - 1];
    if (primeiro && ultimo) {
      const primeiroLabel = window.dateUtils?.formatMonthYear?.(primeiro.ym || primeiro.month) || primeiro.ym || '';
      const ultimoLabel = window.dateUtils?.formatMonthYear?.(ultimo.ym || ultimo.month) || ultimo.ym || '';
      periodo = `${primeiroLabel} - ${ultimoLabel}`;
    }
  }
  
  // Atualizar elementos
  const totalEl = document.getElementById('totalOrgaos');
  const kpiTotalEl = document.getElementById('kpiTotalOrgaos');
  const kpiUnicosEl = document.getElementById('kpiOrgaosUnicos');
  const kpiMediaEl = document.getElementById('kpiMediaOrgao');
  const kpiPeriodoEl = document.getElementById('kpiPeriodo');
  
  if (totalEl) totalEl.textContent = total.toLocaleString('pt-BR');
  if (kpiTotalEl) kpiTotalEl.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicosEl) kpiUnicosEl.textContent = orgaosUnicos.toLocaleString('pt-BR');
  if (kpiMediaEl) kpiMediaEl.textContent = mediaOrgao.toLocaleString('pt-BR');
  if (kpiPeriodoEl) kpiPeriodoEl.textContent = periodo;
}

/**
 * Inicializar listeners de filtro para a página OrgaoMes
 * Usa o sistema global de filtros para atualização automática
 * REFATORADO: Integração completa com sistema global de filtros
 */
function initOrgaoMesFilterListeners() {
  // Conectar ao sistema global de filtros
  if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
    window.chartCommunication.createPageFilterListener('page-orgao-mes', loadOrgaoMes, 500);
    if (window.Logger) {
      window.Logger.success('✅ Listeners de filtro para OrgaoMes inicializados (sistema global)');
    }
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sistema de comunicação não disponível. Listener de filtros não será criado.');
    }
  }
  
  // Inicializar busca de órgãos (busca local, não afeta filtros globais)
  const searchInput = document.getElementById('searchOrgaos');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderOrgaosList(currentOrgaosData);
    });
  }
  
  
}

/**
 * Alternar ordenação dos órgãos
 */
function toggleSortOrgaos() {
  sortAscending = !sortAscending;
  const sortModeEl = document.getElementById('sortMode');
  if (sortModeEl) {
    sortModeEl.textContent = sortAscending ? 'Menor → Maior' : 'Maior → Menor';
  }
  renderOrgaosList(currentOrgaosData);
}

/**
 * Coletar filtros da página
 * REMOVIDO: Filtros de mês e status da página foram removidos
 * Agora usa apenas filtros globais
 */
function collectPageFilters() {
  // Retornar array vazio - filtros da página foram removidos
  // A página agora usa apenas filtros globais via chartCommunication
  return [];
}

// Exportar funções globais
window.toggleSortOrgaos = toggleSortOrgaos;

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOrgaoMesFilterListeners);
} else {
  initOrgaoMesFilterListeners();
}

window.loadOrgaoMes = loadOrgaoMes;

