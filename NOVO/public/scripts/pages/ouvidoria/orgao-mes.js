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
  // PRIORIDADE 1: Verificar dependências críticas
  const dependencies = window.errorHandler?.requireDependencies(
    ['dataLoader', 'chartFactory', 'dataStore'],
    () => {
      window.errorHandler?.showNotification(
        'Sistemas não carregados. Recarregue a página.',
        'warning'
      );
      return null;
    }
  );
  
  if (!dependencies) {
    return Promise.resolve();
  }
  
  const { dataLoader, chartFactory, dataStore } = dependencies;
  
  if (window.Logger) {
    window.Logger.debug('🏢 loadOrgaoMes: Iniciando');
  }
  
  const page = document.getElementById('page-orgao-mes');
  if (!page || page.style.display === 'none') {
    if (window.Logger) {
      window.Logger.debug('🏢 loadOrgaoMes: Página não visível, pulando carregamento');
    }
    return Promise.resolve();
  }
  
  // Garantir que a página esteja visível
  if (page.style.display === 'none') {
    page.style.display = '';
  }
  
  // PRIORIDADE 2: Mostrar loading
  window.loadingManager?.show('Carregando dados de órgãos...');
  
  // PRIORIDADE 1: Usar safeAsync para tratamento de erros
  return await window.errorHandler?.safeAsync(async () => {
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
    
    // Se houver filtros ativos, usar endpoint /api/filter/aggregated (mesmo da Overview)
    if (activeFilters && activeFilters.length > 0) {
      try {
        // Invalidar cache quando há filtros ativos
        if (dataStore && forceRefresh) {
          dataStore.invalidate?.();
        }
        
        // Converter filtros para formato da API
        const apiFilters = activeFilters.map(f => ({
          field: f.field,
          op: f.op || 'eq',
          value: f.value
        }));
        
        if (window.Logger) {
          window.Logger.debug('🚀 loadOrgaoMes: Buscando dados agregados da API /api/filter/aggregated', { 
            filters: apiFilters.length,
            apiFilters 
          });
        }
        
        const response = await fetch('/api/filter/aggregated', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ filters: apiFilters })
        });
        
        if (!response.ok) {
          throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
        }
        
        const aggregatedData = await response.json();
        
        // PRIORIDADE 1: Validar dados recebidos
        const validation = window.dataValidator?.validateApiResponse(aggregatedData, {
          arrays: {
            manifestationsByOrgan: {
              required: ['organ', 'count'],
              types: { organ: 'string', count: 'number' }
            },
            manifestationsByMonth: {
              required: ['month', 'count'],
              types: { month: 'string', count: 'number' }
            }
          }
        });
        
        if (!validation.valid) {
          throw new Error(`Dados inválidos: ${validation.error}`);
        }
          
          if (window.Logger) {
            window.Logger.debug('📡 loadOrgaoMes: Dados agregados recebidos', { 
              type: typeof aggregatedData,
              isArray: Array.isArray(aggregatedData),
              keys: aggregatedData ? Object.keys(aggregatedData).slice(0, 10) : [],
              hasByOrgan: !!aggregatedData?.manifestationsByOrgan,
              hasByMonth: !!aggregatedData?.manifestationsByMonth
            });
          }
          
          // Extrair dados de órgãos e meses do formato agregado
          if (aggregatedData?.manifestationsByOrgan) {
            dataOrgaos = aggregatedData.manifestationsByOrgan.map(item => ({
              key: item.organ || item._id || item.key || 'Não informado',
              count: item.count || 0
            })).sort((a, b) => b.count - a.count);
          }
          
          if (aggregatedData?.manifestationsByMonth) {
            dataMensal = aggregatedData.manifestationsByMonth.map(item => ({
              ym: item.month || item.ym || item._id || '',
              count: item.count || 0
            })).filter(m => m.ym).sort((a, b) => a.ym.localeCompare(b.ym));
          }
          
          if (window.Logger) {
            window.Logger.debug(`🏢 loadOrgaoMes: Dados extraídos do formato agregado`, { 
              orgaos: dataOrgaos.length, 
              meses: dataMensal.length,
              totalOrgaos: dataOrgaos.reduce((sum, o) => sum + (o.count || 0), 0),
              totalMeses: dataMensal.reduce((sum, m) => sum + (m.count || 0), 0)
            });
          }
      } catch (filterError) {
        // PRIORIDADE 1: Tratamento de erro com fallback
        window.errorHandler?.handleError(filterError, 'loadOrgaoMes (com filtros)', {
          showToUser: false, // Não mostrar erro, vamos tentar sem filtros
          fallback: async () => {
            // Fallback: carregar sem filtros
            const fallbackOrgaos = await dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {
              useDataStore: !forceRefresh,
              ttl: 10 * 60 * 1000
            }) || [];
            
            const fallbackMensal = await dataLoader?.load('/api/aggregate/by-month', {
              useDataStore: !forceRefresh,
              ttl: 10 * 60 * 1000
            }) || [];
            
            return { dataOrgaos: fallbackOrgaos, dataMensal: fallbackMensal };
          }
        });
        
        // Tentar fallback
        const fallbackResult = await window.errorHandler?.safeAsync(async () => {
          return {
            dataOrgaos: await dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {
              useDataStore: !forceRefresh,
              ttl: 10 * 60 * 1000
            }) || [],
            dataMensal: await dataLoader?.load('/api/aggregate/by-month', {
              useDataStore: !forceRefresh,
              ttl: 10 * 60 * 1000
            }) || []
          };
        }, 'loadOrgaoMes (fallback sem filtros)');
        
        if (fallbackResult) {
          dataOrgaos = fallbackResult.dataOrgaos;
          dataMensal = fallbackResult.dataMensal;
        }
        
        // Normalizar formato de dataMensal
        dataMensal = dataMensal.map(m => ({
          ym: m.month || m.ym || m._id,
          count: m.count || 0
        })).filter(m => m.ym);
      }
    } else {
      // Sem filtros, carregar dados agregados normalmente
      if (window.Logger) {
        window.Logger.debug('🏢 loadOrgaoMes: Carregando dados sem filtros');
      }
      
      // PRIORIDADE 1: Carregar dados com validação
      const orgaosData = await dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {
        useDataStore: !forceRefresh,
        ttl: 10 * 60 * 1000
      }) || [];
      
      // Validar dados de órgãos
      const orgaosValidation = window.dataValidator?.validateApiResponse(orgaosData, {
        arrayItem: {
          required: ['key', 'count'],
          types: { key: 'string', count: 'number' }
        }
      });
      
      if (orgaosValidation.valid) {
        dataOrgaos = (orgaosData || []).map(item => ({
          key: item.key || item.organ || item._id || item.name || 'Não informado',
          count: Number(item.count || item.value || 0)
        })).filter(item => item.key && item.key !== 'Não informado');
      } else {
        window.errorHandler?.handleError(
          new Error(`Dados de órgãos inválidos: ${orgaosValidation.error}`),
          'loadOrgaoMes (validação órgãos)',
          { showToUser: false }
        );
        dataOrgaos = [];
      }
      
      const mensalData = await dataLoader?.load('/api/aggregate/by-month', {
        useDataStore: !forceRefresh,
        ttl: 10 * 60 * 1000
      }) || [];
      
      // Validar dados mensais
      const mensalValidation = window.dataValidator?.validateApiResponse(mensalData, {
        arrayItem: {
          required: ['ym', 'count'],
          types: { ym: 'string', count: 'number' }
        }
      });
      
      if (mensalValidation.valid) {
        dataMensal = (mensalData || []).map(m => ({
          ym: m.month || m.ym || m._id || '',
          count: Number(m.count || m.value || 0)
        })).filter(m => m.ym);
      } else {
        window.errorHandler?.handleError(
          new Error(`Dados mensais inválidos: ${mensalValidation.error}`),
          'loadOrgaoMes (validação mensal)',
          { showToUser: false }
        );
        dataMensal = [];
      }
    }
    
    // Normalizar dados de órgãos (garantir formato consistente)
    dataOrgaos = (dataOrgaos || []).map(item => ({
      key: item.key || item.organ || item._id || item.name || 'Não informado',
      count: Number(item.count || item.value || 0)
    })).filter(item => {
      // Manter apenas itens válidos (com key válido e count numérico)
      return item.key && 
             item.key !== 'Não informado' && 
             item.key !== 'null' && 
             item.key !== 'undefined' &&
             !isNaN(item.count);
      // Não filtrar por count > 0 aqui, pois queremos mostrar todos os órgãos
    });
    
    // Normalizar dados mensais (garantir formato consistente)
    dataMensal = (dataMensal || []).map(item => ({
      ym: item.ym || item.month || item._id || '',
      count: Number(item.count || item.value || 0)
    })).filter(item => {
      // Manter apenas itens com ym válido
      return item.ym && 
             item.ym !== 'null' && 
             item.ym !== 'undefined' &&
             !isNaN(item.count);
      // Não filtrar por count > 0 aqui
    });
    
    if (window.Logger) {
      window.Logger.debug('🏢 loadOrgaoMes: Dados normalizados', {
        orgaosCount: dataOrgaos.length,
        mesesCount: dataMensal.length,
        totalOrgaos: dataOrgaos.reduce((sum, o) => sum + (o.count || 0), 0),
        totalMeses: dataMensal.reduce((sum, m) => sum + (m.count || 0), 0),
        sampleOrgao: dataOrgaos[0],
        sampleMes: dataMensal[0]
      });
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
    
    // Renderizar lista de órgãos (atualizar após renderizar para garantir destaque visual)
    renderOrgaosList(dataOrgaos);
    
    // PRIORIDADE 1: Verificar chartFactory antes de renderizar
    if (!chartFactory) {
      throw new Error('chartFactory não disponível');
    }
    
    // Renderizar gráfico mensal
    await renderOrgaoMesChart(dataMensal);
    
    // Renderizar gráfico de barras dos top órgãos
    await renderTopOrgaosBarChart(dataOrgaos);
    
    // Atualizar KPIs - tentar múltiplas vezes para garantir que funcione
    // Primeira tentativa imediata
    updateKPIs(dataOrgaos, dataMensal);
    
    // Segunda tentativa após pequeno delay (DOM pode não estar pronto)
    setTimeout(() => {
      updateKPIs(dataOrgaos, dataMensal);
    }, 100);
    
    // Terceira tentativa após delay maior (garantir que tudo esteja carregado)
    setTimeout(() => {
      updateKPIs(dataOrgaos, dataMensal);
    }, 500);
    
    // CROSSFILTER: Renderizar banner de filtros ativos
    renderOrgaoMesFilterBanner();
    
    // Atualizar feedback visual dos KPIs
    updateKPIsVisualState();
    
    // Re-renderizar lista para garantir destaque visual correto após banner ser criado
    renderOrgaosList(dataOrgaos);
    
    // Atualizar info mensal
    const infoMensal = document.getElementById('infoMensal');
    if (infoMensal) {
      if (activeFilters && activeFilters.length > 0) {
        const filterCount = activeFilters.length;
        infoMensal.textContent = `${filterCount} filtro(s) ativo(s) - Clique direito para limpar`;
      } else {
        infoMensal.textContent = 'Clique em um mês ou órgão para filtrar';
      }
    }
    
    if (window.Logger) {
      window.Logger.success('🏢 loadOrgaoMes: Concluído');
    }
    
    // PRIORIDADE 2: Esconder loading
    window.loadingManager?.hide();
    
    return { success: true, dataOrgaos, dataMensal };
  }, 'loadOrgaoMes', {
    showToUser: true,
    fallback: () => {
      // PRIORIDADE 2: Esconder loading em caso de erro
      window.loadingManager?.hide();
      
      // Fallback: mostrar página vazia
      const listaOrgaos = document.getElementById('listaOrgaos');
      if (listaOrgaos) {
        listaOrgaos.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados. Tente recarregar a página.</div>';
      }
      return { success: false, dataOrgaos: [], dataMensal: [] };
    }
  });
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
        class="flex items-center gap-3 py-3 border-b border-white/5 hover:bg-white/10 cursor-pointer transition-all rounded-lg px-3 ${isFiltered ? 'bg-cyan-500/10 border-cyan-500/30 ring-2 ring-cyan-500/50' : ''}"
        data-orgao="${key}"
        onclick="filterByOrgao('${key.replace(/'/g, "\\'")}')"
        oncontextmenu="event.preventDefault(); clearAllFiltersOrgaoMes();"
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
  // PRIORIDADE 1: Verificar dependências
  const chartFactory = window.errorHandler?.requireDependency('chartFactory');
  if (!chartFactory) return;
  
  // Destruir gráfico existente antes de criar novo
  if (chartFactory.destroyCharts) {
    chartFactory.destroyCharts(['chartOrgaoMes']);
  }
  
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
  
  if (window.Logger) {
    window.Logger.debug('📊 renderOrgaoMesChart: Renderizando', { 
      labels: labels.length, 
      values: values.length,
      total: values.reduce((sum, v) => sum + v, 0)
    });
  }
  
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
  
  // Armazenar dados para uso no onClick handler
  window._orgaoMesDataMensal = dataMensal;
  window._orgaoMesLabelToYmMap = labelToYmMap;
  
  const chart = await chartFactory.createBarChart('chartOrgaoMes', labels, values, {
    horizontal: false, // Gráfico vertical
    colorIndex: 1,
    label: 'Manifestações',
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
  });
  
  // CROSSFILTER: Adicionar handler de clique para filtrar por mês
  if (chart && chart.canvas) {
    chart.canvas.style.cursor = 'pointer';
    
    // Adicionar wrapper para clique direito (limpar filtros)
    const chartContainer = chart.canvas.parentElement;
    if (chartContainer && !chartContainer.dataset.crossfilterEnabled) {
      chartContainer.dataset.crossfilterEnabled = 'true';
      chartContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (window.crossfilterOverview) {
          window.crossfilterOverview.clearAllFilters();
          window.crossfilterOverview.notifyListeners();
        } else if (window.chartCommunication && window.chartCommunication.filters) {
          window.chartCommunication.filters.clear();
        }
      });
    }
    
    chart.options.onClick = (event, elements) => {
      if (elements && elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const label = labels[index];
        const ym = labelToYmMap.get(label) || window._orgaoMesDataMensal?.[index]?.ym || window._orgaoMesDataMensal?.[index]?.month;
        
        if (ym) {
          if (window.Logger) {
            window.Logger.debug('📊 Clique no gráfico chartOrgaoMes (mês):', { ym, label, index });
          }
          
          // Filtrar por mês usando dataCriacaoIso
          // Usar sistema global de filtros (crossfilter não tem filtro de data direto)
          if (window.chartCommunication && window.chartCommunication.filters) {
            window.chartCommunication.filters.apply('dataCriacaoIso', ym, 'chartOrgaoMes', { operator: 'contains' });
          }
          
          // Atualizar banner e visual
          setTimeout(() => {
            renderOrgaoMesFilterBanner();
            updateKPIsVisualState();
          }, 100);
        }
      }
    };
    chart.update('none');
  }
}

/**
 * Renderizar gráfico de barras dos top órgãos
 */
async function renderTopOrgaosBarChart(dataOrgaos) {
  // PRIORIDADE 1: Verificar dependências
  const chartFactory = window.errorHandler?.requireDependency('chartFactory');
  if (!chartFactory) return;
  
  // Destruir gráfico existente antes de criar novo
  if (chartFactory.destroyCharts) {
    chartFactory.destroyCharts(['chartTopOrgaosBar']);
  }
  
  if (!dataOrgaos || dataOrgaos.length === 0) {
    const canvas = document.getElementById('chartTopOrgaosBar');
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
  
  const top5 = dataOrgaos.slice(0, 5); // Top 5 principais
  const labels = top5.map(o => {
    const key = o.key || o.organ || o._id || 'Não informado';
    // Truncar nomes longos
    return key.length > 30 ? key.substring(0, 30) + '...' : key;
  });
  const values = top5.map(o => o.count || 0);
  
  if (window.Logger) {
    window.Logger.debug('📊 renderTopOrgaosBarChart: Renderizando', { 
      labels: labels.length, 
      values: values.length,
      total: values.reduce((sum, v) => sum + v, 0)
    });
  }
  
  const chart = await chartFactory.createBarChart('chartTopOrgaosBar', labels, values, {
    horizontal: true,
    colorIndex: 2,
    label: 'Manifestações',
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
  });
  
  // CROSSFILTER: Adicionar handler de clique para filtrar por órgão
  if (chart && chart.canvas) {
    chart.canvas.style.cursor = 'pointer';
    
    // Adicionar wrapper para clique direito (limpar filtros)
    const chartContainer = chart.canvas.parentElement;
    if (chartContainer && !chartContainer.dataset.crossfilterEnabled) {
      chartContainer.dataset.crossfilterEnabled = 'true';
      chartContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        clearAllFiltersOrgaoMes();
      });
    }
    
    chart.options.onClick = (event, elements) => {
      if (elements && elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const orgaoItem = top5[index];
        const orgao = orgaoItem?.key || orgaoItem?.organ || orgaoItem?._id || labels[index] || 'N/A';
        
        if (orgao) {
          if (window.crossfilterOverview) {
            if (window.Logger) {
              window.Logger.debug('📊 Clique no gráfico chartTopOrgaosBar:', { orgao, index, orgaoItem });
            }
            window.crossfilterOverview.setOrgaosFilter(orgao);
            window.crossfilterOverview.notifyListeners();
          } else if (window.chartCommunication && window.chartCommunication.filters) {
            window.chartCommunication.filters.apply('Orgaos', orgao, 'chartTopOrgaosBar', { operator: 'contains' });
          }
        }
      }
    };
    chart.update('none');
  }
}

/**
 * Atualizar KPIs da página
 */
function updateKPIs(dataOrgaos, dataMensal) {
  // Validar e normalizar dados
  const safeDataOrgaos = Array.isArray(dataOrgaos) ? dataOrgaos : [];
  const safeDataMensal = Array.isArray(dataMensal) ? dataMensal : [];
  
  if (window.Logger) {
    window.Logger.debug('📊 updateKPIs: Atualizando KPIs', {
      orgaosCount: safeDataOrgaos.length,
      mesesCount: safeDataMensal.length,
      sampleOrgao: safeDataOrgaos[0],
      sampleMes: safeDataMensal[0]
    });
  }
  
  // Calcular totais - usar dados mensais se disponíveis (mais preciso), senão usar órgãos
  let total = 0;
  if (safeDataMensal && safeDataMensal.length > 0) {
    // Total = soma de todas as manifestações por mês (mais preciso)
    total = safeDataMensal.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  } else if (safeDataOrgaos && safeDataOrgaos.length > 0) {
    // Fallback: soma por órgão
    total = safeDataOrgaos.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  }
  
  const orgaosUnicos = safeDataOrgaos.length;
  const mediaOrgao = orgaosUnicos > 0 ? Math.round(total / orgaosUnicos) : 0;
  
  // Calcular período
  let periodo = '—';
  if (safeDataMensal && safeDataMensal.length > 0) {
    const sorted = [...safeDataMensal].sort((a, b) => {
      const ymA = a.ym || a.month || a._id || '';
      const ymB = b.ym || b.month || b._id || '';
      return ymA.localeCompare(ymB);
    });
    const primeiro = sorted[0];
    const ultimo = sorted[sorted.length - 1];
    if (primeiro && ultimo) {
      const primeiroYm = primeiro.ym || primeiro.month || primeiro._id || '';
      const ultimoYm = ultimo.ym || ultimo.month || ultimo._id || '';
      
      const primeiroLabel = window.dateUtils?.formatMonthYear?.(primeiroYm) || primeiroYm || '';
      const ultimoLabel = window.dateUtils?.formatMonthYear?.(ultimoYm) || ultimoYm || '';
      
      if (primeiroLabel && ultimoLabel) {
        periodo = primeiroLabel === ultimoLabel ? primeiroLabel : `${primeiroLabel} - ${ultimoLabel}`;
      }
    }
  }
  
  // Atualizar elementos DOM
  const totalEl = document.getElementById('totalOrgaos');
  const kpiTotalEl = document.getElementById('kpiTotalOrgaos');
  const kpiUnicosEl = document.getElementById('kpiOrgaosUnicos');
  const kpiMediaEl = document.getElementById('kpiMediaOrgao');
  const kpiPeriodoEl = document.getElementById('kpiPeriodo');
  
  // Verificar se os elementos existem
  if (!kpiTotalEl || !kpiUnicosEl || !kpiMediaEl || !kpiPeriodoEl) {
    if (window.Logger) {
      window.Logger.warn('⚠️ updateKPIs: Alguns elementos DOM não foram encontrados', {
        kpiTotalEl: !!kpiTotalEl,
        kpiUnicosEl: !!kpiUnicosEl,
        kpiMediaEl: !!kpiMediaEl,
        kpiPeriodoEl: !!kpiPeriodoEl
      });
    }
    // Tentar novamente após um pequeno delay (pode ser problema de timing)
    setTimeout(() => updateKPIs(safeDataOrgaos, safeDataMensal), 200);
    return;
  }
  
  // Atualizar valores (sempre mostrar números, mesmo que sejam 0)
  if (totalEl) {
    totalEl.textContent = total.toLocaleString('pt-BR');
  }
  
  // Forçar atualização dos KPIs - sempre mostrar valores, mesmo que sejam 0
  if (kpiTotalEl) {
    kpiTotalEl.textContent = total.toLocaleString('pt-BR');
  }
  
  if (kpiUnicosEl) {
    kpiUnicosEl.textContent = orgaosUnicos.toLocaleString('pt-BR');
  }
  
  if (kpiMediaEl) {
    kpiMediaEl.textContent = mediaOrgao.toLocaleString('pt-BR');
  }
  
  if (kpiPeriodoEl) {
    kpiPeriodoEl.textContent = periodo;
  }
  
  // Log para debug
  if (window.Logger) {
    window.Logger.debug('📊 updateKPIs executado:', {
      total,
      orgaosUnicos,
      mediaOrgao,
      periodo,
      elementosEncontrados: {
        kpiTotalEl: !!kpiTotalEl,
        kpiUnicosEl: !!kpiUnicosEl,
        kpiMediaEl: !!kpiMediaEl,
        kpiPeriodoEl: !!kpiPeriodoEl
      },
      dadosOrgaos: safeDataOrgaos.length,
      dadosMensal: safeDataMensal.length
    });
  }
  
  if (window.Logger) {
    window.Logger.success('✅ updateKPIs: KPIs atualizados', {
      total,
      orgaosUnicos,
      mediaOrgao,
      periodo
    });
  }
}

/**
 * Atualizar estado visual dos KPIs baseado em filtros ativos
 */
function updateKPIsVisualState() {
  const kpiTotalEl = document.getElementById('kpiTotalOrgaos');
  const kpiUnicosEl = document.getElementById('kpiOrgaosUnicos');
  const kpiMediaEl = document.getElementById('kpiMediaOrgao');
  const kpiPeriodoEl = document.getElementById('kpiPeriodo');
  
  const kpiContainers = [
    kpiTotalEl?.closest('.glass') || kpiTotalEl?.parentElement,
    kpiUnicosEl?.closest('.glass') || kpiUnicosEl?.parentElement,
    kpiMediaEl?.closest('.glass') || kpiMediaEl?.parentElement,
    kpiPeriodoEl?.closest('.glass') || kpiPeriodoEl?.parentElement
  ].filter(Boolean);
  
  // Verificar se há filtros ativos
  let hasFilters = false;
  if (window.crossfilterOverview) {
    hasFilters = Object.values(window.crossfilterOverview.filters).some(v => v !== null);
  } else if (window.chartCommunication && window.chartCommunication.filters) {
    hasFilters = (window.chartCommunication.filters.filters || []).length > 0;
  }
  
  // Aplicar feedback visual
  kpiContainers.forEach(container => {
    if (container) {
      if (hasFilters) {
        container.classList.add('ring-2', 'ring-cyan-500/50');
        container.style.opacity = '0.9';
      } else {
        container.classList.remove('ring-2', 'ring-cyan-500/50');
        container.style.opacity = '1';
      }
    }
  });
}

/**
 * Inicializar listeners de filtro para a página OrgaoMes
 * Usa o sistema global de filtros para atualização automática
 * REFATORADO: Integração completa com sistema global de filtros + crossfilter
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
  
  // CROSSFILTER: Conectar ao sistema crossfilterOverview se disponível
  // IMPORTANTE: Registrar apenas UMA VEZ para evitar múltiplos listeners
  if (window.crossfilterOverview && !window.crossfilterOverview._orgaoMesListenerRegistered) {
    window.crossfilterOverview._orgaoMesListenerRegistered = true;
    
    window.crossfilterOverview.onFilterChange(async () => {
      // Verificar se a página está visível
      const page = document.getElementById('page-orgao-mes');
      if (!page || page.style.display === 'none') {
        return;
      }
      
      // Prevenir múltiplas execuções simultâneas
      if (window.crossfilterOverview._isUpdatingOrgaoMes) {
        if (window.Logger) {
          window.Logger.debug('⏸️ loadOrgaoMes já está executando, pulando...');
        }
        return;
      }
      window.crossfilterOverview._isUpdatingOrgaoMes = true;
      
      try {
        if (window.Logger) {
          window.Logger.debug('🔄 Filtros mudaram, recarregando OrgaoMes...');
        }
        
        // Invalidar cache
        if (window.dataStore) {
          window.dataStore.invalidate?.();
        }
        
        // Recarregar dados quando filtros mudarem (isso vai atualizar os gráficos)
        await loadOrgaoMes(true); // forceRefresh = true para garantir dados atualizados
      } catch (err) {
        window.errorHandler?.handleError(err, 'loadOrgaoMes (recarregar com filtros)', {
          showToUser: false
        });
        if (window.Logger) {
          window.Logger.error('Erro ao recarregar OrgaoMes com filtros:', err);
        }
      } finally {
        window.crossfilterOverview._isUpdatingOrgaoMes = false;
      }
    });
    
    if (window.Logger) {
      window.Logger.success('✅ Listener crossfilterOverview registrado para OrgaoMes');
    }
  }
  
  // Listener para sistema global de filtros (chartCommunication) via eventos
  // O createPageFilterListener já cuida disso, mas vamos garantir que os gráficos sejam atualizados
  if (window.chartCommunication) {
    // Escutar eventos de filtro para atualizar banner e visual
    const updateUI = () => {
      renderOrgaoMesFilterBanner();
      updateKPIsVisualState();
      renderOrgaosList(currentOrgaosData);
    };
    
    window.chartCommunication.on('filter:applied', updateUI);
    window.chartCommunication.on('filter:removed', updateUI);
    window.chartCommunication.on('filter:cleared', updateUI);
    window.chartCommunication.on('charts:update-requested', updateUI);
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
 * Filtrar por órgão (chamado ao clicar em um item da lista)
 */
function filterByOrgao(orgao) {
  if (!orgao) return;
  
  if (window.crossfilterOverview) {
    // Usar crossfilterOverview se disponível
    window.crossfilterOverview.setOrgaosFilter(orgao);
    window.crossfilterOverview.notifyListeners();
  } else if (window.chartCommunication && window.chartCommunication.filters) {
    // Usar sistema global de filtros
    window.chartCommunication.filters.apply('Orgaos', orgao, 'listaOrgaos', { operator: 'contains' });
  }
  
  // Atualizar banner e visual imediatamente
  renderOrgaoMesFilterBanner();
  updateKPIsVisualState();
  renderOrgaosList(currentOrgaosData);
  
  if (window.Logger) {
    window.Logger.debug('📊 Filtro aplicado por órgão:', { orgao });
  }
}

/**
 * Limpar todos os filtros (chamado ao clicar direito)
 */
function clearAllFiltersOrgaoMes() {
  if (window.crossfilterOverview) {
    window.crossfilterOverview.clearAllFilters();
    window.crossfilterOverview.notifyListeners();
  } else if (window.chartCommunication && window.chartCommunication.filters) {
    window.chartCommunication.filters.clear();
  }
  
  // Atualizar banner e visual
  renderOrgaoMesFilterBanner();
  updateKPIsVisualState();
  renderOrgaosList(currentOrgaosData);
  
  if (window.Logger) {
    window.Logger.debug('📊 Todos os filtros limpos');
  }
}

/**
 * Renderizar banner de filtros ativos (similar ao Overview)
 */
function renderOrgaoMesFilterBanner() {
  const page = document.getElementById('page-orgao-mes');
  if (!page) return;
  
  // Remover banner existente se houver
  const existingBanner = document.getElementById('orgao-mes-filter-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
  
  // Obter filtros ativos
  let activeFilters = [];
  if (window.crossfilterOverview) {
    const filters = window.crossfilterOverview.filters;
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== null) {
        // Mapear campos do crossfilter para nomes amigáveis
        const fieldMap = {
          'status': 'Status',
          'tema': 'Tema',
          'orgaos': 'Orgaos',
          'tipo': 'Tipo',
          'canal': 'Canal',
          'prioridade': 'Prioridade',
          'unidade': 'Unidade',
          'bairro': 'Bairro'
        };
        activeFilters.push({ 
          field: fieldMap[field] || field, 
          value: value 
        });
      }
    });
  }
  
  // Também verificar sistema global de filtros (pode ter filtros de data)
  if (window.chartCommunication && window.chartCommunication.filters) {
    const globalFilters = window.chartCommunication.filters.filters || [];
    // Adicionar filtros que não estão no crossfilter (ex: dataCriacaoIso)
    globalFilters.forEach(filter => {
      if (!activeFilters.some(f => f.field === filter.field && f.value === filter.value)) {
        activeFilters.push(filter);
      }
    });
  }
  
  // Se não há filtros, não mostrar banner
  if (activeFilters.length === 0) {
    return;
  }
  
  // Criar banner
  const banner = document.createElement('div');
  banner.id = 'orgao-mes-filter-banner';
  banner.className = 'glass rounded-xl p-4 mb-6 border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-violet-500/10';
  
  const fieldLabels = {
    'Status': 'Status',
    'Tema': 'Tema',
    'Orgaos': 'Órgão',
    'Tipo': 'Tipo',
    'Canal': 'Canal',
    'Prioridade': 'Prioridade',
    'Unidade': 'Unidade',
    'Bairro': 'Bairro',
    'dataCriacaoIso': 'Data'
  };
  
  const fieldEmojis = {
    'Status': '📊',
    'Tema': '🏷️',
    'Orgaos': '🏛️',
    'Tipo': '📋',
    'Canal': '📞',
    'Prioridade': '⚡',
    'Unidade': '🏥',
    'Bairro': '📍',
    'dataCriacaoIso': '📅'
  };
  
  banner.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="text-sm font-semibold text-cyan-300">🔍 Filtros Ativos:</div>
        ${activeFilters.map(filter => {
          const label = fieldLabels[filter.field] || filter.field;
          const emoji = fieldEmojis[filter.field] || '🔍';
          return `
            <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-cyan-500/30 rounded-lg">
              <span>${emoji}</span>
              <span class="text-sm text-slate-200">${label}: <span class="font-bold text-cyan-300">${filter.value}</span></span>
              <button 
                onclick="removeFilterOrgaoMes('${filter.field}', '${String(filter.value).replace(/'/g, "\\'")}')"
                class="ml-2 text-cyan-400 hover:text-red-400 transition-colors"
                title="Remover filtro"
              >
                ✕
              </button>
            </div>
          `;
        }).join('')}
      </div>
      <button 
        onclick="clearAllFiltersOrgaoMes()"
        class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-medium text-red-300 transition-colors"
        title="Limpar todos os filtros"
      >
        Limpar Todos
      </button>
    </div>
  `;
  
  // Inserir banner no topo da página
  const header = page.querySelector('header');
  if (header && header.nextSibling) {
    page.insertBefore(banner, header.nextSibling);
  } else {
    page.insertBefore(banner, page.firstChild);
  }
}

/**
 * Remover filtro específico
 */
function removeFilterOrgaoMes(field, value) {
  if (window.crossfilterOverview) {
    // Usar crossfilterOverview
    const fieldMap = {
      'Status': 'status',
      'Tema': 'tema',
      'Orgaos': 'orgaos',
      'Tipo': 'tipo',
      'Canal': 'canal',
      'Prioridade': 'prioridade',
      'Unidade': 'unidade',
      'Bairro': 'bairro',
      'dataCriacaoIso': null // Não tem setter direto no crossfilter
    };
    
    const mappedField = fieldMap[field] || field.toLowerCase();
    
    if (mappedField === 'status') window.crossfilterOverview.setStatusFilter(null);
    else if (mappedField === 'tema') window.crossfilterOverview.setTemaFilter(null);
    else if (mappedField === 'orgaos') window.crossfilterOverview.setOrgaosFilter(null);
    else if (mappedField === 'tipo') window.crossfilterOverview.setTipoFilter(null);
    else if (mappedField === 'canal') window.crossfilterOverview.setCanalFilter(null);
    else if (mappedField === 'prioridade') window.crossfilterOverview.setPrioridadeFilter(null);
    else if (mappedField === 'unidade') window.crossfilterOverview.setUnidadeFilter(null);
    else if (mappedField === 'bairro') window.crossfilterOverview.setBairroFilter(null);
    
    window.crossfilterOverview.notifyListeners();
  } else if (window.chartCommunication && window.chartCommunication.filters) {
    // Usar sistema global
    window.chartCommunication.filters.remove(field, value);
  }
  
  // Atualizar banner e visual
  renderOrgaoMesFilterBanner();
  updateKPIsVisualState();
  renderOrgaosList(currentOrgaosData);
  
  if (window.Logger) {
    window.Logger.debug('📊 Filtro removido:', { field, value });
  }
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
window.filterByOrgao = filterByOrgao;
window.clearAllFiltersOrgaoMes = clearAllFiltersOrgaoMes;
window.removeFilterOrgaoMes = removeFilterOrgaoMes;

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOrgaoMesFilterListeners);
} else {
  initOrgaoMesFilterListeners();
}

window.loadOrgaoMes = loadOrgaoMes;

