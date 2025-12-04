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
let filterOptionsLoaded = false; // Flag para evitar carregar opções múltiplas vezes
let isSyncingFilters = false; // Flag para evitar loops infinitos na sincronização

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
  
  // Resetar flag quando a página é carregada para garantir que os filtros sejam populados
  filterOptionsLoaded = false;
  
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
    
    // POPULAR FILTROS COM OS DADOS JÁ CARREGADOS
    // Carregar opções de filtros após dados serem carregados
    // Usar setTimeout para garantir que o DOM está atualizado e a página está visível
    // CORREÇÃO: Sempre tentar carregar opções, mesmo que já tenham sido carregadas antes
    setTimeout(() => {
      const pageCheck = document.getElementById('page-orgao-mes');
      if (pageCheck && pageCheck.style.display !== 'none') {
        console.log('🔄 Carregando opções de filtros após carregamento dos dados...');
        // Sempre forçar refresh se a flag não estiver marcada
        loadFilterOptions(!filterOptionsLoaded || forceRefresh).catch(error => {
          console.error('❌ Erro ao carregar opções de filtros:', error);
          if (window.Logger) {
            window.Logger.warn('Erro ao carregar opções de filtros:', error);
          }
        });
      } else {
        console.warn('⚠️ Página não está visível, tentando novamente em 500ms...');
        setTimeout(() => {
          const pageCheck2 = document.getElementById('page-orgao-mes');
          if (pageCheck2 && pageCheck2.style.display !== 'none') {
            loadFilterOptions(!filterOptionsLoaded || forceRefresh).catch(error => {
              console.error('❌ Erro ao carregar opções de filtros (segunda tentativa):', error);
            });
          }
        }, 500);
      }
    }, 200);
    
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
  
  // Listeners para filtros da página (mês e status) - INTEGRADO COM SISTEMA GLOBAL
  const filtroMes = document.getElementById('filtroMesOrgaoMes');
  if (filtroMes) {
    filtroMes.addEventListener('change', () => {
      // Evitar loop infinito se estiver sincronizando
      if (isSyncingFilters) {
        return;
      }
      
      const mesValue = filtroMes.value?.trim();
      
      // Remover filtro de mês anterior se existir
      if (window.chartCommunication && window.chartCommunication.filters) {
        const existingMesFilter = window.chartCommunication.filters.filters.find(
          f => {
            const field = f.field?.toLowerCase() || '';
            return field === 'data' || field === 'datacriacaoiso' || field === 'datacriacao' || field === 'datadacriacao';
          }
        );
        if (existingMesFilter) {
          window.chartCommunication.filters.remove(existingMesFilter.field, existingMesFilter.value);
        }
        
        // Aplicar novo filtro de mês no sistema global se houver valor
        if (mesValue) {
          window.chartCommunication.filters.apply('Data', mesValue, null, {
            operator: 'contains',
            toggle: false,
            clearPrevious: false
          });
        }
      }
      
      // Recarregar dados da página
      loadOrgaoMes(true);
    });
  }
  
  const filtroStatus = document.getElementById('filtroStatusOrgaoMes');
  if (filtroStatus) {
    filtroStatus.addEventListener('change', () => {
      // Evitar loop infinito se estiver sincronizando
      if (isSyncingFilters) {
        return;
      }
      
      const statusValue = filtroStatus.value?.trim();
      
      // Remover filtro de status anterior se existir
      if (window.chartCommunication && window.chartCommunication.filters) {
        const existingStatusFilter = window.chartCommunication.filters.filters.find(
          f => {
            const field = f.field?.toLowerCase() || '';
            return field === 'status' || field === 'statusdemanda';
          }
        );
        if (existingStatusFilter) {
          window.chartCommunication.filters.remove(existingStatusFilter.field, existingStatusFilter.value);
        }
        
        // Aplicar novo filtro de status no sistema global se houver valor
        if (statusValue) {
          window.chartCommunication.filters.apply('Status', statusValue, null, {
            operator: 'eq',
            toggle: false,
            clearPrevious: false
          });
        }
      }
      
      // Recarregar dados da página
      loadOrgaoMes(true);
    });
  }
  
  // Sincronizar filtros globais com os selects quando filtros forem aplicados externamente
  if (window.chartCommunication && window.chartCommunication.on) {
    window.chartCommunication.on('filter:applied', syncGlobalFiltersToPageFilters);
    window.chartCommunication.on('filter:removed', syncGlobalFiltersToPageFilters);
    window.chartCommunication.on('filter:cleared', syncGlobalFiltersToPageFilters);
  }
  
  // Carregar opções de filtros quando a página é inicializada
  // CORREÇÃO: Sempre forçar carregamento na inicialização, mesmo que já tenha sido carregado antes
  // Isso garante que as opções estejam sempre atualizadas quando a página é exibida
  setTimeout(() => {
    const pageCheck = document.getElementById('page-orgao-mes');
    if (pageCheck && pageCheck.style.display !== 'none') {
      console.log('🔄 Carregando opções de filtros na inicialização (forçado)...');
      // Forçar refresh na inicialização para garantir que as opções sejam carregadas
      loadFilterOptions(true).then(() => {
        // Após carregar opções, sincronizar filtros globais com os selects
        syncGlobalFiltersToPageFilters();
      }).catch(error => {
        console.error('❌ Erro ao carregar opções na inicialização:', error);
        if (window.Logger) {
          window.Logger.warn('Erro ao carregar opções na inicialização:', error);
        }
      });
    } else {
      console.log('⏳ Página não está visível ainda, aguardando...');
      // Tentar novamente após um delay maior
      setTimeout(() => {
        const pageCheck2 = document.getElementById('page-orgao-mes');
        if (pageCheck2 && pageCheck2.style.display !== 'none') {
          console.log('🔄 Tentando carregar opções novamente (forçado)...');
          // Forçar refresh na segunda tentativa também
          loadFilterOptions(true).then(() => {
            // Após carregar opções, sincronizar filtros globais com os selects
            syncGlobalFiltersToPageFilters();
          }).catch(error => {
            console.error('❌ Erro ao carregar opções na segunda tentativa:', error);
          });
        }
      }, 1000);
    }
  }, 500);
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
 * Coletar filtros da página (mês e status)
 * REFATORADO: Integrado com sistema global de filtros
 */
function collectPageFilters() {
  const filters = [];
  
  // Priorizar filtros do sistema global, mas também considerar filtros dos selects da página
  let mesValue = null;
  let statusValue = null;
  
  // Verificar se há filtros globais ativos
  if (window.chartCommunication && window.chartCommunication.filters) {
    const globalFilters = window.chartCommunication.filters.filters || [];
    
    // Buscar filtro de mês/data nos filtros globais
    const mesFilter = globalFilters.find(f => 
      f.field === 'Data' || f.field === 'dataCriacaoIso' || f.field === 'dataCriacao'
    );
    if (mesFilter) {
      mesValue = mesFilter.value;
    }
    
    // Buscar filtro de status nos filtros globais
    const statusFilter = globalFilters.find(f => 
      f.field === 'Status' || f.field === 'StatusDemanda'
    );
    if (statusFilter) {
      statusValue = statusFilter.value;
    }
  }
  
  // Se não houver filtros globais, usar valores dos selects da página
  if (!mesValue) {
    mesValue = document.getElementById('filtroMesOrgaoMes')?.value?.trim();
  }
  
  if (!statusValue) {
    statusValue = document.getElementById('filtroStatusOrgaoMes')?.value?.trim();
  }
  
  // Adicionar filtro de mês se houver valor
  if (mesValue) {
    filters.push({
      field: 'Data',
      op: 'contains',
      value: mesValue // Formato YYYY-MM
    });
  }
  
  // Adicionar filtro de status se houver valor
  if (statusValue) {
    filters.push({
      field: 'Status',
      op: 'eq',
      value: statusValue
    });
  }
  
  return filters;
}

/**
 * Sincronizar filtros globais com os selects da página
 * Quando um filtro global é aplicado externamente, atualiza os selects
 * REFATORADO: Melhor tratamento de campos e valores, com proteção contra loops
 */
function syncGlobalFiltersToPageFilters() {
  // Evitar loops infinitos
  if (isSyncingFilters) {
    return;
  }
  
  if (!window.chartCommunication || !window.chartCommunication.filters) {
    return;
  }
  
  // Verificar se a página está visível
  const page = document.getElementById('page-orgao-mes');
  if (!page || page.style.display === 'none') {
    return;
  }
  
  isSyncingFilters = true;
  
  try {
    const globalFilters = window.chartCommunication.filters.filters || [];
    const filtroMes = document.getElementById('filtroMesOrgaoMes');
    const filtroStatus = document.getElementById('filtroStatusOrgaoMes');
    
    // Sincronizar filtro de mês
    if (filtroMes) {
      // Buscar filtro de mês/data nos filtros globais
      // O campo pode ser 'Data', 'dataCriacaoIso', 'dataCriacao', 'dataDaCriacao'
      const mesFilter = globalFilters.find(f => {
        const field = f.field?.toLowerCase() || '';
        return field === 'data' || 
               field === 'datacriacaoiso' || 
               field === 'datacriacao' ||
               field === 'datadacriacao';
      });
      
      if (mesFilter && mesFilter.value) {
        // O valor pode estar no formato YYYY-MM ou YYYY-MM-DD
        // Extrair apenas YYYY-MM se necessário
        let mesValue = mesFilter.value;
        if (mesValue.length > 7) {
          mesValue = mesValue.substring(0, 7); // Pegar apenas YYYY-MM
        }
        
        // Verificar se o valor existe nas opções do select
        const optionExists = Array.from(filtroMes.options).some(opt => opt.value === mesValue);
        if (optionExists) {
          // Evitar loop infinito: só atualizar se o valor for diferente
          if (filtroMes.value !== mesValue) {
            filtroMes.value = mesValue;
            if (window.Logger) {
              window.Logger.debug(`Sincronizado filtro de mês: ${mesValue}`);
            }
          }
        } else if (window.Logger) {
          window.Logger.debug(`Filtro de mês ${mesValue} não encontrado nas opções do select`);
        }
      } else {
        // Se não houver filtro global de mês, limpar o select apenas se houver valor
        if (filtroMes.value) {
          filtroMes.value = '';
        }
      }
    }
    
    // Sincronizar filtro de status
    if (filtroStatus) {
      // Buscar filtro de status nos filtros globais
      // O campo pode ser 'Status', 'StatusDemanda', 'status', 'statusdemanda'
      const statusFilter = globalFilters.find(f => {
        const field = f.field?.toLowerCase() || '';
        return field === 'status' || field === 'statusdemanda';
      });
      
      if (statusFilter && statusFilter.value) {
        // Verificar se o valor existe nas opções do select
        const optionExists = Array.from(filtroStatus.options).some(opt => opt.value === statusFilter.value);
        if (optionExists) {
          // Evitar loop infinito: só atualizar se o valor for diferente
          if (filtroStatus.value !== statusFilter.value) {
            filtroStatus.value = statusFilter.value;
            if (window.Logger) {
              window.Logger.debug(`Sincronizado filtro de status: ${statusFilter.value}`);
            }
          }
        } else if (window.Logger) {
          window.Logger.debug(`Filtro de status ${statusFilter.value} não encontrado nas opções do select`);
        }
      } else {
        // Se não houver filtro global de status, limpar o select apenas se houver valor
        if (filtroStatus.value) {
          filtroStatus.value = '';
        }
      }
    }
  } finally {
    // Sempre liberar a flag, mesmo em caso de erro
    setTimeout(() => {
      isSyncingFilters = false;
    }, 100);
  }
}

/**
 * Carregar valores distintos de um campo (igual aos filtros avançados)
 */
async function loadDistinctValues(field) {
  try {
    if (window.dataLoader) {
      const values = await window.dataLoader.load(`/api/distinct?field=${encodeURIComponent(field)}`, {
        useDataStore: true,
        ttl: 60 * 60 * 1000, // Cache de 1 hora
        timeout: 15000 // 15 segundos de timeout
      });
      
      if (Array.isArray(values)) {
        return values.filter(v => v && v.trim() !== '').sort();
      }
    }
    
    return [];
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn(`Erro ao carregar valores distintos para ${field}:`, error);
    }
    
    // Tentar retornar do cache se houver erro
    if (window.dataStore) {
      const cacheKey = `/api/distinct?field=${encodeURIComponent(field)}`;
      const cached = window.dataStore.get(cacheKey);
      if (cached && Array.isArray(cached)) {
        if (window.Logger) {
          window.Logger.debug(`Usando valores em cache para ${field}`);
        }
        return cached.filter(v => v && v.trim() !== '').sort();
      }
    }
    
    return [];
  }
}

/**
 * Carregar meses disponíveis
 */
async function loadMonths() {
  try {
    if (window.dataLoader) {
      const meses = await window.dataLoader.load('/api/aggregate/by-month', {
        useDataStore: true,
        ttl: 60 * 60 * 1000, // Cache de 1 hora
        timeout: 15000
      });
      
      if (Array.isArray(meses) && meses.length > 0) {
        // O endpoint retorna { month: 'YYYY-MM', count: number }
        // Extrair apenas os valores de month
        const mesesUnicos = [...new Set(
          meses
            .map(m => {
              // Se já é string no formato YYYY-MM
              if (typeof m === 'string' && /^\d{4}-\d{2}$/.test(m)) {
                return m;
              }
              // Se é objeto { month: 'YYYY-MM', count: number }
              if (typeof m === 'object' && m !== null) {
                return m.month || m.ym || m._id;
              }
              return null;
            })
            .filter(Boolean)
            .filter(ym => {
              const isValid = /^\d{4}-\d{2}$/.test(ym);
              if (!isValid && window.Logger) {
                window.Logger.debug(`Mês inválido ignorado: ${ym}`);
              }
              return isValid;
            })
        )].sort().reverse(); // Mais recente primeiro
        
        if (window.Logger) {
          window.Logger.debug(`✅ loadMonths: ${mesesUnicos.length} meses extraídos de ${meses.length} registros`);
        }
        
        return mesesUnicos;
      } else {
        if (window.Logger) {
          window.Logger.warn('⚠️ loadMonths: Nenhum mês retornado ou array vazio');
        }
      }
    }
    
    return [];
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn('Erro ao carregar meses:', error);
    }
    return [];
  }
}

/**
 * Popular select com opções (igual aos filtros avançados)
 */
function populateSelect(selectElement, options) {
  console.log('🔧 populateSelect chamado:', {
    selectElement: !!selectElement,
    selectId: selectElement?.id,
    optionsType: Array.isArray(options) ? 'array' : typeof options,
    optionsLength: Array.isArray(options) ? options.length : 'N/A',
    optionsSample: Array.isArray(options) && options.length > 0 ? options.slice(0, 3) : options
  });
  
  if (!selectElement) {
    if (window.Logger) {
      window.Logger.warn('⚠️ populateSelect: selectElement é null ou undefined');
    }
    console.error('❌ populateSelect: selectElement não encontrado');
    return;
  }
  
  if (!Array.isArray(options)) {
    console.error('❌ populateSelect: options não é um array!', { type: typeof options, value: options });
    if (window.Logger) {
      window.Logger.warn('⚠️ populateSelect: options não é array', options);
    }
    return;
  }
  
  if (options.length === 0) {
    console.warn('⚠️ populateSelect: options é um array vazio');
    if (window.Logger) {
      window.Logger.warn('⚠️ populateSelect: options é vazio', options);
    }
    return;
  }
  
  // Verificar se o select está desabilitado ou bloqueado
  if (selectElement.disabled) {
    console.warn('⚠️ populateSelect: Select está desabilitado!');
    selectElement.disabled = false; // Habilitar
  }
  
  // Verificar estilo que pode bloquear
  const computedStyle = window.getComputedStyle(selectElement);
  if (computedStyle.pointerEvents === 'none') {
    console.warn('⚠️ populateSelect: Select tem pointer-events: none!');
    selectElement.style.pointerEvents = 'auto';
  }
  
  // Salvar valor atual
  const currentValue = selectElement.value;
  
  // Limpar opções existentes (exceto a primeira que é "Todos")
  const initialCount = selectElement.children.length;
  while (selectElement.children.length > 1) {
    selectElement.removeChild(selectElement.lastChild);
  }
  
  console.log(`🔍 populateSelect: Limpou ${initialCount - selectElement.children.length} opções, adicionando ${options.length} novas`);
  if (window.Logger) {
    window.Logger.debug(`🔍 populateSelect: Limpou ${initialCount - selectElement.children.length} opções, adicionando ${options.length} novas`);
  }
  
  // Adicionar novas opções
  let addedCount = 0;
  options.forEach((option, index) => {
    if (option === null || option === undefined || option === '') {
      return; // Pular valores inválidos
    }
    
    const optionElement = document.createElement('option');
    optionElement.value = String(option);
    
    // Se for um mês (formato YYYY-MM), formatar o texto
    if (/^\d{4}-\d{2}$/.test(option) && window.dateUtils?.formatMonthYear) {
      optionElement.textContent = window.dateUtils.formatMonthYear(option);
    } else {
      optionElement.textContent = String(option);
    }
    
    selectElement.appendChild(optionElement);
    addedCount++;
    
    // Log a cada 5 opções para não poluir o console
    if ((index + 1) % 5 === 0 || index === options.length - 1) {
      console.log(`  ✓ Adicionado ${index + 1}/${options.length}: ${optionElement.textContent}`);
    }
  });
  
  const finalCount = selectElement.children.length;
  console.log(`✅ populateSelect: ${addedCount} opções adicionadas (total no select: ${finalCount})`);
  console.log(`✅ Opções no select:`, Array.from(selectElement.children).map(c => ({ value: c.value, text: c.textContent })));
  
  if (window.Logger) {
    window.Logger.debug(`✅ populateSelect: ${addedCount} opções adicionadas ao select (total: ${finalCount})`);
  }
  
  // Verificar se realmente foram adicionadas
  if (finalCount <= 1) {
    console.error('❌ ERRO CRÍTICO: Nenhuma opção foi adicionada ao select!');
    console.error('❌ Select HTML:', selectElement.outerHTML);
    console.error('❌ Options recebidas:', options);
  }
  
  // Restaurar valor se ainda existir
  if (currentValue && Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
    selectElement.value = currentValue;
  }
  
  // Forçar atualização visual - NÃO usar dispatchEvent aqui pois pode causar loop
  // O select nativo do HTML já atualiza automaticamente quando options são adicionadas
}

/**
 * Carregar opções de filtros (mês e status) - REFATORADO usando abordagem dos filtros avançados
 */
async function loadFilterOptions(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('🔍 Carregando opções de filtros (mês e status)...', { forceRefresh });
  }
  
  const selectMes = document.getElementById('filtroMesOrgaoMes');
  const selectStatus = document.getElementById('filtroStatusOrgaoMes');
  
  if (!selectMes || !selectStatus) {
    if (window.Logger) {
      window.Logger.warn('⚠️ Selects não encontrados, tentando novamente em 500ms...');
    }
    console.warn('⚠️ Selects não encontrados:', { selectMes: !!selectMes, selectStatus: !!selectStatus });
    setTimeout(() => loadFilterOptions(forceRefresh), 500);
    return;
  }
  
  // Verificar se os selects já têm opções válidas (exceto a primeira "Todos")
  const mesHasOptions = selectMes.children.length > 1;
  const statusHasOptions = selectStatus.children.length > 1;
  
  // Verificar se as opções existentes são válidas (têm valores não vazios)
  const mesOptionsValid = mesHasOptions && Array.from(selectMes.options).slice(1).some(opt => opt.value && opt.value.trim() !== '');
  const statusOptionsValid = statusHasOptions && Array.from(selectStatus.options).slice(1).some(opt => opt.value && opt.value.trim() !== '');
  
  // CORREÇÃO: Sempre carregar se não houver opções válidas, mesmo sem forceRefresh
  // Isso garante que as opções sejam carregadas na primeira vez que a página é exibida
  if (!forceRefresh && mesOptionsValid && statusOptionsValid) {
    console.log('🔍 Opções já carregadas e válidas, pulando recarregamento...', {
      mesCount: selectMes.children.length - 1,
      statusCount: selectStatus.children.length - 1
    });
    if (window.Logger) {
      window.Logger.debug('🔍 Opções já carregadas e válidas, pulando...');
    }
    // MAS: Se a flag filterOptionsLoaded for false, ainda assim carregar (primeira vez)
    if (filterOptionsLoaded) {
      return;
    }
    // Se não foi carregado ainda, continuar para carregar
    console.log('🔄 Flag filterOptionsLoaded é false, forçando carregamento mesmo com opções existentes...');
  }
  
  // Se chegou aqui, precisa carregar (ou recarregar)
  console.log('🔍 Carregando opções de filtros...', {
    forceRefresh,
    mesHasOptions,
    statusHasOptions,
    mesOptionsValid,
    statusOptionsValid,
    filterOptionsLoaded
  });
  
  // Verificar se a página está visível (igual aos filtros avançados)
  const page = document.getElementById('page-orgao-mes');
  if (!page) {
    if (window.Logger) {
      window.Logger.warn('⚠️ Página page-orgao-mes não encontrada');
    }
    return;
  }
  
  if (page.style.display === 'none') {
    if (window.Logger) {
      window.Logger.debug('🔍 Página não visível, aguardando...');
    }
    // Tentar novamente após um delay maior para garantir que a página foi exibida
    setTimeout(() => {
      const pageCheck = document.getElementById('page-orgao-mes');
      if (pageCheck && pageCheck.style.display !== 'none') {
        loadFilterOptions(forceRefresh);
      }
    }, 1000);
    return;
  }
  
  // Verificar se os selects estão bloqueados ou desabilitados
  console.log('🔍 Verificando estado dos selects...');
  console.log('  selectMes.disabled:', selectMes.disabled);
  console.log('  selectStatus.disabled:', selectStatus.disabled);
  const mesStyle = window.getComputedStyle(selectMes);
  const statusStyle = window.getComputedStyle(selectStatus);
  console.log('  selectMes.pointerEvents:', mesStyle.pointerEvents);
  console.log('  selectStatus.pointerEvents:', statusStyle.pointerEvents);
  
  // Garantir que não estão desabilitados
  if (selectMes.disabled) {
    console.warn('⚠️ selectMes estava desabilitado, habilitando...');
    selectMes.disabled = false;
  }
  if (selectStatus.disabled) {
    console.warn('⚠️ selectStatus estava desabilitado, habilitando...');
    selectStatus.disabled = false;
  }
  
  // Garantir que pointer-events não está bloqueado
  if (mesStyle.pointerEvents === 'none') {
    console.warn('⚠️ selectMes tinha pointer-events: none, corrigindo...');
    selectMes.style.pointerEvents = 'auto';
  }
  if (statusStyle.pointerEvents === 'none') {
    console.warn('⚠️ selectStatus tinha pointer-events: none, corrigindo...');
    selectStatus.style.pointerEvents = 'auto';
  }
  
  // Carregar meses e status em paralelo
  console.log('🚀 Iniciando carregamento de meses e status...');
  const loadPromises = [
    loadMonths().then(meses => {
      console.log('📅 Meses recebidos do endpoint:', meses);
      console.log('📅 Tipo:', Array.isArray(meses) ? 'array' : typeof meses);
      console.log('📅 Quantidade:', meses?.length || 0);
      
      if (meses && Array.isArray(meses) && meses.length > 0) {
        console.log(`📅 Populando select com ${meses.length} meses...`);
        console.log('📅 Primeiros 5 meses:', meses.slice(0, 5));
        
        // Verificar estado do select antes de popular
        const beforeCount = selectMes.children.length;
        console.log('📅 Select antes de popular:', beforeCount, 'opções');
        
        populateSelect(selectMes, meses);
        
        // Verificar estado do select depois de popular
        const afterCount = selectMes.children.length;
        const optionCount = afterCount - 1; // -1 para "Todos os meses"
        console.log(`📅 Select depois de popular: ${afterCount} opções (${optionCount} meses + 1 "Todos")`);
        
        if (window.Logger) {
          window.Logger.success(`✅ ${meses.length} meses carregados e populados no select`);
        }
        
        // Verificar se realmente foram adicionados
        if (optionCount !== meses.length) {
          console.error(`❌ DISCREPÂNCIA: ${meses.length} meses carregados, mas ${optionCount} opções no select!`);
          console.error('❌ Select HTML (primeiros 500 chars):', selectMes.outerHTML.substring(0, 500));
          console.error('❌ Opções no select:', Array.from(selectMes.options).map(o => ({ value: o.value, text: o.textContent })));
          if (window.Logger) {
            window.Logger.warn(`⚠️ Discrepância: ${meses.length} meses carregados, mas ${optionCount} opções no select`);
          }
        } else {
          console.log('✅ Meses populados corretamente!');
          console.log('✅ Opções no select:', Array.from(selectMes.options).slice(0, 5).map(o => o.textContent));
        }
      } else {
        console.warn('⚠️ Nenhum mês retornado ou array vazio');
        console.warn('⚠️ Dados recebidos:', meses);
        if (window.Logger) {
          window.Logger.warn('⚠️ Nenhum mês retornado');
        }
      }
      return { success: true, type: 'meses', count: meses?.length || 0 };
    }).catch(error => {
      console.error('❌ Erro ao carregar meses:', error);
      console.error('❌ Stack:', error.stack);
      if (window.Logger) {
        window.Logger.warn('❌ Erro ao carregar meses:', error);
      }
      return { success: false, type: 'meses', error: error.message };
    }),
    
    loadDistinctValues('Status').then(status => {
      console.log('🏷️ Status recebidos do endpoint:', status);
      console.log('🏷️ Tipo:', Array.isArray(status) ? 'array' : typeof status);
      console.log('🏷️ Quantidade:', status?.length || 0);
      
      if (status && Array.isArray(status) && status.length > 0) {
        console.log(`🏷️ Populando select com ${status.length} status...`);
        console.log('🏷️ Primeiros 5 status:', status.slice(0, 5));
        
        // Verificar estado do select antes de popular
        const beforeCount = selectStatus.children.length;
        console.log('🏷️ Select antes de popular:', beforeCount, 'opções');
        
        populateSelect(selectStatus, status);
        
        // Verificar estado do select depois de popular
        const afterCount = selectStatus.children.length;
        const optionCount = afterCount - 1; // -1 para "Todos os status"
        console.log(`🏷️ Select depois de popular: ${afterCount} opções (${optionCount} status + 1 "Todos")`);
        
        if (window.Logger) {
          window.Logger.success(`✅ ${status.length} status carregados e populados no select`);
        }
        
        // Verificar se realmente foram adicionados
        if (optionCount !== status.length) {
          console.error(`❌ DISCREPÂNCIA: ${status.length} status carregados, mas ${optionCount} opções no select!`);
          console.error('❌ Select HTML (primeiros 500 chars):', selectStatus.outerHTML.substring(0, 500));
          console.error('❌ Opções no select:', Array.from(selectStatus.options).map(o => ({ value: o.value, text: o.textContent })));
          if (window.Logger) {
            window.Logger.warn(`⚠️ Discrepância: ${status.length} status carregados, mas ${optionCount} opções no select`);
          }
        } else {
          console.log('✅ Status populados corretamente!');
          console.log('✅ Opções no select:', Array.from(selectStatus.options).slice(0, 5).map(o => o.textContent));
        }
        
        return { success: true, type: 'status', count: status.length };
      } else {
        console.warn('⚠️ Nenhum status retornado, tentando StatusDemanda...');
        console.warn('⚠️ Dados recebidos:', status);
        // Tentar StatusDemanda como fallback
        return loadDistinctValues('StatusDemanda').then(statusDemanda => {
          console.log('🏷️ StatusDemanda recebidos:', statusDemanda);
          if (statusDemanda && Array.isArray(statusDemanda) && statusDemanda.length > 0) {
            console.log(`🏷️ Populando select com ${statusDemanda.length} statusDemanda...`);
            populateSelect(selectStatus, statusDemanda);
            if (window.Logger) {
              window.Logger.success(`✅ ${statusDemanda.length} statusDemanda carregados e populados no select`);
            }
            return { success: true, type: 'statusDemanda', count: statusDemanda.length };
          } else {
            console.warn('⚠️ Nenhum statusDemanda retornado');
            if (window.Logger) {
              window.Logger.warn('⚠️ Nenhum status retornado (nem Status nem StatusDemanda)');
            }
            return { success: false, type: 'status', error: 'Nenhum status encontrado' };
          }
        });
      }
    }).catch(error => {
      console.error('❌ Erro ao carregar status:', error);
      console.error('❌ Stack:', error.stack);
      if (window.Logger) {
        window.Logger.warn('❌ Erro ao carregar status:', error);
      }
      // Tentar StatusDemanda como fallback em caso de erro
      return loadDistinctValues('StatusDemanda').then(statusDemanda => {
        if (statusDemanda && Array.isArray(statusDemanda) && statusDemanda.length > 0) {
          console.log('🏷️ Usando StatusDemanda como fallback:', statusDemanda.length);
          populateSelect(selectStatus, statusDemanda);
          return { success: true, type: 'statusDemanda', count: statusDemanda.length };
        }
        return { success: false, type: 'status', error: error.message };
      }).catch(fallbackError => {
        console.error('❌ Erro ao carregar StatusDemanda também:', fallbackError);
        return { success: false, type: 'status', error: error.message };
      });
    })
  ];
  
  // Usar allSettled para não bloquear se uma falhar
  console.log('⏳ Aguardando carregamento de meses e status...');
  const results = await Promise.allSettled(loadPromises);
  
  console.log('📊 Resultados do carregamento:', results);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
  const mesesCount = results[0]?.status === 'fulfilled' ? results[0].value?.count || 0 : 0;
  const statusCount = results[1]?.status === 'fulfilled' ? results[1].value?.count || 0 : 0;
  
  console.log(`✅ Carregamento concluído: ${successful}/2 sucesso (${mesesCount} meses, ${statusCount} status)`);
  console.log('📊 Estado final dos selects:');
  console.log('  selectMes.children.length:', selectMes.children.length);
  console.log('  selectStatus.children.length:', selectStatus.children.length);
  
  if (window.Logger) {
    window.Logger.debug(`🔍 Carregamento concluído: ${successful}/2 sucesso (${mesesCount} meses, ${statusCount} status)`);
  }
  
  // Marcar como carregado apenas se ambos tiverem sucesso E tiverem opções válidas
  const mesHasValidOptions = selectMes.children.length > 1;
  const statusHasValidOptions = selectStatus.children.length > 1;
  
  if (successful === 2 && mesesCount > 0 && statusCount > 0 && mesHasValidOptions && statusHasValidOptions) {
    filterOptionsLoaded = true;
    console.log('✅ Filtros carregados com sucesso!', {
      meses: mesesCount,
      status: statusCount,
      mesOptions: selectMes.children.length,
      statusOptions: selectStatus.children.length
    });
  } else {
    console.warn('⚠️ Filtros não foram totalmente carregados', {
      successful,
      mesesCount,
      statusCount,
      mesHasValidOptions,
      statusHasValidOptions,
      mesOptions: selectMes.children.length,
      statusOptions: selectStatus.children.length
    });
    filterOptionsLoaded = false; // Permitir tentar novamente
  }
}

// Exportar funções globais
window.toggleSortOrgaos = toggleSortOrgaos;

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOrgaoMesFilterListeners);
} else {
  initOrgaoMesFilterListeners();
}

// CORREÇÃO: Observer para detectar quando a página é exibida e carregar opções
// Isso garante que as opções sejam carregadas sempre que a página for mostrada
if (typeof MutationObserver !== 'undefined') {
  const pageElement = document.getElementById('page-orgao-mes');
  if (pageElement) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          const isVisible = target.style.display !== 'none';
          
          if (isVisible) {
            // Página foi exibida, verificar se precisa carregar opções
            const selectMes = document.getElementById('filtroMesOrgaoMes');
            const selectStatus = document.getElementById('filtroStatusOrgaoMes');
            
            const mesHasOptions = selectMes && selectMes.children.length > 1;
            const statusHasOptions = selectStatus && selectStatus.children.length > 1;
            
            if (!mesHasOptions || !statusHasOptions) {
              console.log('🔄 Página exibida sem opções nos filtros, carregando...');
              // Aguardar um pouco para garantir que o DOM está pronto
              setTimeout(() => {
                loadFilterOptions(true).catch(error => {
                  console.error('❌ Erro ao carregar opções via observer:', error);
                });
              }, 300);
            }
          }
        }
      });
    });
    
    observer.observe(pageElement, {
      attributes: true,
      attributeFilter: ['style']
    });
    
    if (window.Logger) {
      window.Logger.debug('✅ Observer de visibilidade da página configurado para OrgaoMes');
    }
  }
}

window.loadOrgaoMes = loadOrgaoMes;

// Função de teste para debug (pode ser chamada no console)
window.testOrgaoMesFilters = async function() {
  console.log('🧪 TESTE: Verificando filtros de OrgaoMes...');
  
  const selectMes = document.getElementById('filtroMesOrgaoMes');
  const selectStatus = document.getElementById('filtroStatusOrgaoMes');
  
  console.log('📋 Estado dos selects:');
  console.log('  selectMes:', {
    existe: !!selectMes,
    disabled: selectMes?.disabled,
    children: selectMes?.children?.length || 0,
    options: Array.from(selectMes?.options || []).map(o => ({ value: o.value, text: o.textContent }))
  });
  console.log('  selectStatus:', {
    existe: !!selectStatus,
    disabled: selectStatus?.disabled,
    children: selectStatus?.children?.length || 0,
    options: Array.from(selectStatus?.options || []).map(o => ({ value: o.value, text: o.textContent }))
  });
  
  if (selectMes) {
    const mesStyle = window.getComputedStyle(selectMes);
    console.log('  selectMes styles:', {
      pointerEvents: mesStyle.pointerEvents,
      display: mesStyle.display,
      visibility: mesStyle.visibility,
      opacity: mesStyle.opacity
    });
  }
  
  if (selectStatus) {
    const statusStyle = window.getComputedStyle(selectStatus);
    console.log('  selectStatus styles:', {
      pointerEvents: statusStyle.pointerEvents,
      display: statusStyle.display,
      visibility: statusStyle.visibility,
      opacity: statusStyle.opacity
    });
  }
  
  console.log('🧪 TESTE: Forçando recarregamento de opções...');
  await loadFilterOptions(true);
  
  console.log('📋 Estado após recarregamento:');
  console.log('  selectMes.children:', selectMes?.children?.length || 0);
  console.log('  selectStatus.children:', selectStatus?.children?.length || 0);
  
  return {
    selectMes: {
      options: selectMes?.children?.length || 0,
      list: Array.from(selectMes?.options || []).map(o => o.textContent)
    },
    selectStatus: {
      options: selectStatus?.children?.length || 0,
      list: Array.from(selectStatus?.options || []).map(o => o.textContent)
    }
  };
};

