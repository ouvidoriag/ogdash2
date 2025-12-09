/**
 * Página: Visão Geral (Overview)
 * Dashboard principal com visão consolidada
 * 
 * Recriada com estrutura otimizada:
 * - Usa dataLoader para carregar dados
 * - Usa dataStore para cache
 * - Usa chartFactory para gráficos
 * - Estrutura modular e limpa
 * 
 * CROSSFILTER INTELIGENTE (Power BI Style):
 * - Sistema de filtros multi-dimensionais
 * - Clique esquerdo = aplica filtro
 * - Clique direito = limpa todos os filtros
 * - Banner visual mostra filtros ativos
 * - Todos os gráficos reagem bidirecionalmente
 */

/**
 * Carregar dados da visão geral
 */
async function loadOverview(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('📊 loadOverview: Iniciando carregamento');
  }
  
  const pageMain = document.getElementById('page-main');
  if (!pageMain || pageMain.style.display === 'none') {
    if (window.Logger) {
      window.Logger.debug('📊 loadOverview: Página não visível, aguardando...');
    }
    return Promise.resolve();
  }
  
  // OTIMIZAÇÃO: Mostrar indicador de carregamento
  const loadingIndicator = document.getElementById('overview-loading');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'flex';
  } else {
    // Criar indicador se não existir
    const loader = document.createElement('div');
    loader.id = 'overview-loading';
    loader.className = 'fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center';
    loader.innerHTML = `
      <div class="bg-slate-800 rounded-lg p-6 shadow-xl">
        <div class="flex items-center gap-4">
          <div class="animate-spin text-4xl">⏳</div>
          <div>
            <div class="text-lg font-semibold text-cyan-300 mb-1">Carregando Dashboard...</div>
            <div class="text-sm text-slate-400">Aguarde enquanto os dados são carregados</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(loader);
  }
  
  try {
    let dashboardData = {};
    
    // CROSSFILTER: Carregar dados completos e armazenar no crossfilter
    if (window.crossfilterOverview) {
      // Carregar dados completos primeiro
      dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
        useDataStore: !forceRefresh,
        ttl: 5 * 60 * 1000 // 5 minutos
      }) || {};
      
      // Armazenar dados completos no crossfilter
      window.crossfilterOverview.allData = dashboardData;
      
      // Aplicar filtros se houver
      dashboardData = window.crossfilterOverview.applyFilters(dashboardData);
    } else {
      // Fallback: carregar normalmente
      dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
        useDataStore: !forceRefresh,
        ttl: 5 * 60 * 1000 // 5 minutos
      }) || {};
    }
    
    // CÓDIGO ANTIGO DE FILTROS (mantido para referência, mas não usado)
    if (false) {
      try {
        const filterRequest = {
          filters: activeFilters,
          originalUrl: window.location.pathname
        };
        
        // OTIMIZAÇÃO: Adicionar timeout para evitar travamentos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Enviar cookies de sessão
          body: JSON.stringify(filterRequest),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const filteredRows = await response.json();
          
          // Debug: verificar dados recebidos
          if (window.Logger) {
            window.Logger.debug('📊 loadOverview: Dados filtrados recebidos do /api/filter', {
              totalRows: filteredRows?.length || 0,
              sampleRow: filteredRows?.[0] ? {
                keys: Object.keys(filteredRows[0]).slice(0, 10),
                hasData: !!filteredRows[0].data,
                hasPrioridade: !!(filteredRows[0].prioridade || filteredRows[0].Prioridade || filteredRows[0].data?.prioridade || filteredRows[0].data?.Prioridade)
              } : null
            });
          }
          
          // Validar que filteredRows é um array
          if (!Array.isArray(filteredRows)) {
            throw new Error('Dados filtrados não são um array');
          }
          
          // OTIMIZAÇÃO: Limitar quantidade de registros processados se houver muitos
          // Processar no máximo 50000 registros para manter performance
          const rowsToProcess = filteredRows.length > 50000 
            ? filteredRows.slice(0, 50000) 
            : filteredRows;
          
          if (filteredRows.length > 50000 && window.Logger) {
            window.Logger.warn(`📊 Muitos registros filtrados (${filteredRows.length}), processando apenas os primeiros 50000 para manter performance`);
          }
          
          // Agregar dados localmente
          dashboardData = aggregateFilteredData(rowsToProcess);
          
          if (window.Logger) {
            window.Logger.debug('📊 loadOverview: Dados agregados localmente com filtros', {
              total: dashboardData.totalManifestations,
              byStatus: dashboardData.manifestationsByStatus?.length || 0,
              byMonth: dashboardData.manifestationsByMonth?.length || 0,
              byDay: dashboardData.manifestationsByDay?.length || 0,
              byTheme: dashboardData.manifestationsByTheme?.length || 0,
              byOrgan: dashboardData.manifestationsByOrgan?.length || 0,
              sampleStatus: dashboardData.manifestationsByStatus?.[0],
              sampleMonth: dashboardData.manifestationsByMonth?.[0],
              sampleDay: dashboardData.manifestationsByDay?.[0]
            });
          }
        } else {
          throw new Error(`Erro ao buscar dados filtrados: ${response.statusText}`);
        }
      } catch (filterError) {
        if (window.Logger) {
          window.Logger.error('Erro ao aplicar filtros no overview, carregando sem filtros:', filterError);
        }
        // Em caso de erro, carregar sem filtros
        // OTIMIZAÇÃO: Aumentar TTL para melhor performance
        dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
          useDataStore: !forceRefresh,
          ttl: 5 * 60 * 1000 // 5 minutos ao invés de 5 segundos
        }) || {};
      }
    } else {
      // Sem filtros, usar endpoint normal
      // OTIMIZAÇÃO: Aumentar TTL para 5 minutos (300000ms) para melhor performance
      dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
        useDataStore: !forceRefresh,
        ttl: 5 * 60 * 1000 // 5 minutos ao invés de 5 segundos
      }) || {};
    }
    
    // Debug: verificar dados recebidos
    console.log('📊 Dashboard Data recebido:', {
      total: dashboardData.totalManifestations,
      byMonth: dashboardData.manifestationsByMonth?.length || 0,
      byDay: dashboardData.manifestationsByDay?.length || 0,
      byStatus: dashboardData.manifestationsByStatus?.length || 0,
      byTheme: dashboardData.manifestationsByTheme?.length || 0,
      byOrgan: dashboardData.manifestationsByOrgan?.length || 0,
      byType: dashboardData.manifestationsByType?.length || 0,
      byChannel: dashboardData.manifestationsByChannel?.length || 0,
      byPriority: dashboardData.manifestationsByPriority?.length || 0,
      byUnit: dashboardData.manifestationsByUnit?.length || 0,
      sampleMonth: dashboardData.manifestationsByMonth?.[0],
      sampleDay: dashboardData.manifestationsByDay?.[0],
      sampleStatus: dashboardData.manifestationsByStatus?.[0],
      sampleTheme: dashboardData.manifestationsByTheme?.[0],
      sampleOrgan: dashboardData.manifestationsByOrgan?.[0]
    });
    
    if (window.Logger) {
      window.Logger.debug('📊 Dashboard Data recebido:', dashboardData);
    }
    
    // Extrair dados
    const summary = {
      total: dashboardData.totalManifestations || 0,
      last7: dashboardData.last7Days || 0,
      last30: dashboardData.last30Days || 0,
      statusCounts: dashboardData.manifestationsByStatus || []
    };
    
    const byMonth = dashboardData.manifestationsByMonth || [];
    const byDay = dashboardData.manifestationsByDay || [];
    const byTheme = dashboardData.manifestationsByTheme || [];
    const bySubject = dashboardData.manifestationsBySubject || [];
    const byOrgan = dashboardData.manifestationsByOrgan || [];
    const byType = dashboardData.manifestationsByType || [];
    const byChannel = dashboardData.manifestationsByChannel || [];
    const byPriority = dashboardData.manifestationsByPriority || [];
    const byUnit = dashboardData.manifestationsByUnit || [];
    
    // CROSSFILTER: Renderizar banner de filtros ativos
    renderCrossfilterBanner();
    
    // CROSSFILTER: Registrar listener UMA VEZ para atualizar quando filtros mudarem
    if (window.crossfilterOverview && !window.crossfilterOverview._listenerRegistered) {
      window.crossfilterOverview._listenerRegistered = true;
      
      // CORREÇÃO CRÍTICA: Garantir que aggregateFilteredData está disponível
      if (!window.aggregateFilteredData && typeof aggregateFilteredData === 'function') {
        window.aggregateFilteredData = aggregateFilteredData;
        if (window.Logger) {
          window.Logger.debug('✅ aggregateFilteredData exportada no listener', {
            functionType: typeof window.aggregateFilteredData
          });
        }
      }
      
      window.crossfilterOverview.onFilterChange(async () => {
        // Prevenir múltiplas execuções simultâneas
        if (window.crossfilterOverview._isUpdating) {
          if (window.Logger) {
            window.Logger.debug('⏸️ Listener já está executando, pulando...');
          }
          return;
        }
        window.crossfilterOverview._isUpdating = true;
        
        try {
          const filters = window.crossfilterOverview.filters;
          const hasActiveFilters = Object.values(filters).some(v => v !== null);
          
          if (window.Logger) {
            window.Logger.debug('🔄 Listener de filtros acionado:', {
              hasActiveFilters,
              filters,
              activeFiltersCount: Object.values(filters).filter(v => v !== null).length
            });
          }
          
          let filteredData;
          
          if (hasActiveFilters) {
            // Construir filtros para API
            const apiFilters = [];
            Object.entries(filters).forEach(([field, value]) => {
              if (value) {
                // Mapear campos do crossfilter para campos da API
                // IMPORTANTE: Usar os nomes exatos que a API espera
                const fieldMap = {
                  status: 'Status', // API usa 'Status' que mapeia para 'status' ou 'statusDemanda' no banco
                  tema: 'Tema',
                  orgaos: 'Orgaos',
                  tipo: 'Tipo',
                  canal: 'Canal',
                  prioridade: 'Prioridade',
                  unidade: 'UnidadeCadastro',
                  bairro: 'Bairro'
                };
                const apiField = fieldMap[field] || field;
                apiFilters.push({ field: apiField, op: 'eq', value: value });
              }
            });
            
            // SOLUÇÃO DEFINITIVA: Usar endpoint /api/filter/aggregated
            // Este endpoint faz a agregação no backend usando MongoDB aggregation pipeline
            // Muito mais rápido e confiável do que agregar no frontend
            try {
              if (window.Logger) {
                window.Logger.debug('🚀 SOLUÇÃO DEFINITIVA: Buscando dados agregados da API /api/filter/aggregated:', { 
                  apiFilters,
                  filtersCount: apiFilters.length,
                  endpoint: '/api/filter/aggregated'
                });
              }
              
              // LOG CRÍTICO: Confirmar que está usando o endpoint correto
              console.log('🚀🚀🚀 CHAMANDO /api/filter/aggregated (NÃO /api/filter)', {
                filters: apiFilters,
                endpoint: '/api/filter/aggregated',
                timestamp: new Date().toISOString()
              });
              
              const response = await fetch('/api/filter/aggregated', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filters: apiFilters })
              });
              
              console.log('📡 Resposta recebida:', {
                ok: response.ok,
                status: response.status,
                url: response.url,
                endpoint: '/api/filter/aggregated'
              });
              
              if (window.Logger) {
                window.Logger.debug('📡 Resposta da API /api/filter/aggregated:', {
                  ok: response.ok,
                  status: response.status,
                  statusText: response.statusText,
                  url: response.url
                });
              }
              
              if (response.ok) {
                filteredData = await response.json();
                
                if (window.Logger) {
                  window.Logger.debug('📦 Dados brutos recebidos da API:', {
                    type: typeof filteredData,
                    isArray: Array.isArray(filteredData),
                    keys: filteredData ? Object.keys(filteredData).slice(0, 15) : [],
                    total: filteredData?.totalManifestations,
                    hasByStatus: !!filteredData?.manifestationsByStatus,
                    byStatusLength: Array.isArray(filteredData?.manifestationsByStatus) ? filteredData.manifestationsByStatus.length : 'N/A'
                  });
                }
                
                // Validar estrutura retornada
                if (!filteredData || typeof filteredData !== 'object' || Array.isArray(filteredData)) {
                  if (window.Logger) {
                    window.Logger.error('❌ API retornou estrutura inválida:', {
                      type: typeof filteredData,
                      isArray: Array.isArray(filteredData),
                      value: filteredData
                    });
                  }
                  // Fallback: estrutura vazia
                  filteredData = {
                    totalManifestations: 0,
                    last7Days: 0,
                    last30Days: 0,
                    manifestationsByMonth: [],
                    manifestationsByDay: [],
                    manifestationsByStatus: [],
                    manifestationsByTheme: [],
                    manifestationsByOrgan: [],
                    manifestationsByType: [],
                    manifestationsByChannel: [],
                    manifestationsByPriority: [],
                    manifestationsByUnit: []
                  };
                } else {
                  // Garantir que todas as propriedades existem
                  filteredData = {
                    totalManifestations: filteredData.totalManifestations ?? 0,
                    last7Days: filteredData.last7Days ?? 0,
                    last30Days: filteredData.last30Days ?? 0,
                    manifestationsByMonth: Array.isArray(filteredData.manifestationsByMonth) ? filteredData.manifestationsByMonth : [],
                    manifestationsByDay: Array.isArray(filteredData.manifestationsByDay) ? filteredData.manifestationsByDay : [],
                    manifestationsByStatus: Array.isArray(filteredData.manifestationsByStatus) ? filteredData.manifestationsByStatus : [],
                    manifestationsByTheme: Array.isArray(filteredData.manifestationsByTheme) ? filteredData.manifestationsByTheme : [],
                    manifestationsByOrgan: Array.isArray(filteredData.manifestationsByOrgan) ? filteredData.manifestationsByOrgan : [],
                    manifestationsByType: Array.isArray(filteredData.manifestationsByType) ? filteredData.manifestationsByType : [],
                    manifestationsByChannel: Array.isArray(filteredData.manifestationsByChannel) ? filteredData.manifestationsByChannel : [],
                    manifestationsByPriority: Array.isArray(filteredData.manifestationsByPriority) ? filteredData.manifestationsByPriority : [],
                    manifestationsByUnit: Array.isArray(filteredData.manifestationsByUnit) ? filteredData.manifestationsByUnit : []
                  };
                  
                  if (window.Logger) {
                    window.Logger.debug('✅ Dados agregados processados e validados:', {
                      total: filteredData.totalManifestations,
                      byStatus: filteredData.manifestationsByStatus.length,
                      byTheme: filteredData.manifestationsByTheme.length,
                      byOrgan: filteredData.manifestationsByOrgan.length,
                      byType: filteredData.manifestationsByType.length,
                      byChannel: filteredData.manifestationsByChannel.length,
                      byPriority: filteredData.manifestationsByPriority.length,
                      byUnit: filteredData.manifestationsByUnit.length,
                      byMonth: filteredData.manifestationsByMonth.length,
                      byDay: filteredData.manifestationsByDay.length,
                      sampleStatus: filteredData.manifestationsByStatus[0],
                      sampleTheme: filteredData.manifestationsByTheme[0],
                      sampleOrgan: filteredData.manifestationsByOrgan[0]
                    });
                  }
                }
              } else {
                const errorText = await response.text();
                if (window.Logger) {
                  window.Logger.error('❌ Erro na resposta da API /api/filter/aggregated:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                  });
                }
                // Fallback: estrutura vazia
                filteredData = {
                  totalManifestations: 0,
                  last7Days: 0,
                  last30Days: 0,
                  manifestationsByMonth: [],
                  manifestationsByDay: [],
                  manifestationsByStatus: [],
                  manifestationsByTheme: [],
                  manifestationsByOrgan: [],
                  manifestationsByType: [],
                  manifestationsByChannel: [],
                  manifestationsByPriority: [],
                  manifestationsByUnit: []
                };
              }
            } catch (error) {
              if (window.Logger) {
                window.Logger.error('❌ Erro ao buscar dados agregados:', {
                  error: error.message,
                  stack: error.stack
                });
              }
              // Fallback: estrutura vazia
              filteredData = {
                totalManifestations: 0,
                last7Days: 0,
                last30Days: 0,
                manifestationsByMonth: [],
                manifestationsByDay: [],
                manifestationsByStatus: [],
                manifestationsByTheme: [],
                manifestationsByOrgan: [],
                manifestationsByType: [],
                manifestationsByChannel: [],
                manifestationsByPriority: [],
                manifestationsByUnit: []
              };
            }
          } else {
            // Sem filtros, usar dados completos
            filteredData = window.crossfilterOverview.allData;
          }
          
          if (filteredData) {
            // VALIDAÇÃO CRÍTICA: Garantir que filteredData tem estrutura válida
            if (!filteredData || typeof filteredData !== 'object' || Array.isArray(filteredData)) {
              if (window.Logger) {
                window.Logger.error('❌ filteredData inválido antes de renderizar!', {
                  type: typeof filteredData,
                  isArray: Array.isArray(filteredData),
                  value: filteredData
                });
              }
              // Usar dados originais como fallback
              filteredData = window.crossfilterOverview.allData;
              if (!filteredData) {
                if (window.Logger) {
                  window.Logger.error('❌ Não há dados originais disponíveis! Usando estrutura vazia.');
                }
                filteredData = {
                  totalManifestations: 0,
                  last7Days: 0,
                  last30Days: 0,
                  manifestationsByMonth: [],
                  manifestationsByDay: [],
                  manifestationsByStatus: [],
                  manifestationsByTheme: [],
                  manifestationsByOrgan: [],
                  manifestationsByType: [],
                  manifestationsByChannel: [],
                  manifestationsByPriority: [],
                  manifestationsByUnit: []
                };
              }
            }
            
            // Garantir que todas as propriedades necessárias existem
            const safeFilteredData = {
              totalManifestations: filteredData.totalManifestations ?? 0,
              last7Days: filteredData.last7Days ?? 0,
              last30Days: filteredData.last30Days ?? 0,
              manifestationsByMonth: Array.isArray(filteredData.manifestationsByMonth) ? filteredData.manifestationsByMonth : [],
              manifestationsByDay: Array.isArray(filteredData.manifestationsByDay) ? filteredData.manifestationsByDay : [],
              manifestationsByStatus: Array.isArray(filteredData.manifestationsByStatus) ? filteredData.manifestationsByStatus : [],
              manifestationsByTheme: Array.isArray(filteredData.manifestationsByTheme) ? filteredData.manifestationsByTheme : [],
              manifestationsByOrgan: Array.isArray(filteredData.manifestationsByOrgan) ? filteredData.manifestationsByOrgan : [],
              manifestationsByType: Array.isArray(filteredData.manifestationsByType) ? filteredData.manifestationsByType : [],
              manifestationsByChannel: Array.isArray(filteredData.manifestationsByChannel) ? filteredData.manifestationsByChannel : [],
              manifestationsByPriority: Array.isArray(filteredData.manifestationsByPriority) ? filteredData.manifestationsByPriority : [],
              manifestationsByUnit: Array.isArray(filteredData.manifestationsByUnit) ? filteredData.manifestationsByUnit : []
            };
            
            // Log detalhado dos dados antes de renderizar
            if (window.Logger) {
              window.Logger.debug('📊 Preparando dados para renderização:', {
                total: safeFilteredData.totalManifestations,
                byMonth: safeFilteredData.manifestationsByMonth.length,
                byDay: safeFilteredData.manifestationsByDay.length,
                byStatus: safeFilteredData.manifestationsByStatus.length,
                byTheme: safeFilteredData.manifestationsByTheme.length,
                byOrgan: safeFilteredData.manifestationsByOrgan.length,
                byType: safeFilteredData.manifestationsByType.length,
                byChannel: safeFilteredData.manifestationsByChannel.length,
                byPriority: safeFilteredData.manifestationsByPriority.length,
                byUnit: safeFilteredData.manifestationsByUnit.length,
                // Amostras
                sampleMonth: safeFilteredData.manifestationsByMonth[0],
                sampleDay: safeFilteredData.manifestationsByDay[0],
                sampleStatus: safeFilteredData.manifestationsByStatus[0],
                sampleTheme: safeFilteredData.manifestationsByTheme[0]
              });
            }
            
            // Re-renderizar com dados filtrados
            const filteredSummary = {
              total: safeFilteredData.totalManifestations,
              last7: safeFilteredData.last7Days,
              last30: safeFilteredData.last30Days,
              statusCounts: safeFilteredData.manifestationsByStatus
            };
            const filteredByMonth = safeFilteredData.manifestationsByMonth;
            const filteredByDay = safeFilteredData.manifestationsByDay;
            const filteredByStatus = safeFilteredData.manifestationsByStatus;
            const filteredByTheme = safeFilteredData.manifestationsByTheme;
            const filteredByOrgan = safeFilteredData.manifestationsByOrgan;
            const filteredByType = safeFilteredData.manifestationsByType;
            const filteredByChannel = safeFilteredData.manifestationsByChannel;
            const filteredByPriority = safeFilteredData.manifestationsByPriority;
            const filteredByUnit = safeFilteredData.manifestationsByUnit;
            
            // Validar dados antes de renderizar
            if (window.Logger) {
              if (safeFilteredData.totalManifestations > 0 && 
                  filteredByMonth.length === 0 && 
                  filteredByStatus.length === 0 && 
                  filteredByTheme.length === 0) {
                window.Logger.warn('⚠️ Dados filtrados não geraram agregações!', {
                  totalRows: safeFilteredData.totalManifestations,
                  byMonth: filteredByMonth.length,
                  byDay: filteredByDay.length,
                  byStatus: filteredByStatus.length,
                  byTheme: filteredByTheme.length,
                  byOrgan: filteredByOrgan.length,
                  byType: filteredByType.length,
                  byChannel: filteredByChannel.length,
                  byPriority: filteredByPriority.length,
                  byUnit: filteredByUnit.length
                });
              }
            }
            
            // Atualizar KPIs
            await renderKPIs(filteredSummary, filteredByDay, filteredByMonth);
            
            // Atualizar todos os gráficos
            await renderMainCharts(filteredSummary, filteredByMonth, filteredByDay, filteredByTheme, filteredByOrgan, filteredByType, filteredByChannel, filteredByPriority, filteredByUnit, false);
            
            // Atualizar banner
            renderCrossfilterBanner();
          }
        } catch (error) {
          if (window.Logger) {
            window.Logger.error('Erro ao atualizar com filtros:', error);
          }
        } finally {
          window.crossfilterOverview._isUpdating = false;
        }
      });
    }
    
    // OTIMIZAÇÃO: Renderizar KPIs primeiro (mais rápido, feedback imediato)
    await renderKPIs(summary, byDay, byMonth);
    
    // OTIMIZAÇÃO: Ocultar indicador de carregamento após KPIs (feedback mais rápido)
    const loadingIndicator = document.getElementById('overview-loading');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // OTIMIZAÇÃO: Renderizar gráficos principais de forma incremental (não bloqueia UI)
    // Usar requestAnimationFrame para não bloquear a thread principal
    requestAnimationFrame(async () => {
      await renderMainCharts(summary, byMonth, byDay, byTheme, byOrgan, byType, byChannel, byPriority, byUnit, forceRefresh);
    });
    
    // Insights de IA removidos
    
    if (window.Logger) {
      window.Logger.success('📊 loadOverview: Carregamento concluído');
    }
    
    // Indicador já foi ocultado após renderizar KPIs
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar overview:', error);
    }
    
    // OTIMIZAÇÃO: Mostrar mensagem de erro ao usuário
    const pageMain = document.getElementById('page-main');
    if (pageMain) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorMessage.innerHTML = `
        <div class="flex items-center gap-2">
          <span>❌</span>
          <span>Erro ao carregar dados. Tente recarregar a página.</span>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      // Remover mensagem após 5 segundos
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    }
    
    // OTIMIZAÇÃO: Ocultar indicador de carregamento mesmo em caso de erro
    const loadingIndicator = document.getElementById('overview-loading');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Re-throw para que o erro seja visível no console
    throw error;
  }
}

/**
 * Renderizar KPIs principais
 * OTIMIZADO: KPIs agora são interligados e podem aplicar filtros
 */
async function renderKPIs(summary, dailyData, byMonth) {
  const kpiTotal = document.getElementById('kpiTotal');
  const kpi7 = document.getElementById('kpi7');
  const kpi30 = document.getElementById('kpi30');
  
  // Encontrar containers dos KPIs para adicionar handlers
  const kpiTotalContainer = kpiTotal?.closest('.glass') || kpiTotal?.parentElement;
  const kpi7Container = kpi7?.closest('.glass') || kpi7?.parentElement;
  const kpi30Container = kpi30?.closest('.glass') || kpi30?.parentElement;
  
  if (kpiTotal) {
    kpiTotal.textContent = (summary.total || 0).toLocaleString('pt-BR');
  }
  if (kpi7) {
    kpi7.textContent = (summary.last7 || 0).toLocaleString('pt-BR');
  }
  if (kpi30) {
    kpi30.textContent = (summary.last30 || 0).toLocaleString('pt-BR');
  }
  
  // CROSSFILTER: Adicionar feedback visual quando há filtros ativos
  // Os KPIs não filtram, mas mostram estado visual
  function updateKPIsVisualState() {
    const hasFilters = window.crossfilterOverview && 
      Object.values(window.crossfilterOverview.filters).some(v => v !== null);
    
    [kpiTotalContainer, kpi7Container, kpi30Container].forEach(container => {
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
  
  // Atualizar estado visual inicial
  updateKPIsVisualState();
  
  // Listener para atualizar estado visual quando filtros mudarem
  if (window.crossfilterOverview) {
    window.crossfilterOverview.onFilterChange(updateKPIsVisualState);
  }
  
  // Renderizar sparklines se houver dados
  if (dailyData && dailyData.length > 0 && window.chartFactory) {
    const last7Days = dailyData.slice(-7).map(d => d.count || 0);
    const last30Days = dailyData.slice(-30).map(d => d.count || 0);
    const last12Months = byMonth.slice(-12).map(m => m.count || 0);
    
    await renderSparkline('sparkTotal', last12Months);
    await renderSparkline('spark7', last7Days);
    await renderSparkline('spark30', last30Days);
  }
}

/**
 * Atualizar estado visual dos KPIs baseado em filtros ativos
 * Exportada para uso global
 */
function updateKPIsVisualState() {
  return;
}

// Exportar função para uso global
window.updateKPIsVisualState = updateKPIsVisualState;

/**
 * Renderizar sparkline (gráfico pequeno)
 */
async function renderSparkline(canvasId, data) {
  if (!data || data.length === 0) return;
  
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const labels = data.map((_, i) => '');
  
  await window.chartFactory?.createLineChart(canvasId, labels, data, {
    borderWidth: 2,
    pointRadius: 0,
    fill: true,
    tension: 0.4,
    colorIndex: 0,
        onClick: false,
    chartOptions: {
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

// ============================================
// FUNÇÕES AUXILIARES PADRONIZADAS (ESCOPO GLOBAL)
// ============================================

/**
 * Função auxiliar para obter cor por índice
 */
function getColorForIndex(idx) {
  const colors = [
    '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', 
    '#fb7185', '#60a5fa', '#f472b6', '#84cc16'
  ];
  return colors[idx % colors.length];
}

/**
 * Função auxiliar padronizada para tooltip de gráficos de pizza
 */
function getStandardDoughnutTooltip() {
  return {
    callbacks: {
      label: function(context) {
        const label = context.label || '';
        const value = context.parsed || 0;
        const total = context.dataset.data.reduce((a, b) => a + b, 0);
        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        return `${label}: ${value.toLocaleString('pt-BR')} (${percent}%)`;
      }
    }
  };
}

// Garantir que a função esteja disponível no escopo global
window.getStandardDoughnutTooltip = getStandardDoughnutTooltip;

/**
 * Função auxiliar padronizada para renderizar info box de gráficos de pizza
 */
function renderStandardDoughnutInfoBox(infoBoxId, dataWithPercent, config = {}) {
  const infoBox = document.getElementById(infoBoxId);
  if (!infoBox || !dataWithPercent || dataWithPercent.length === 0) return;
  
  const topItem = dataWithPercent[0];
  const label = topItem.label || topItem.status || topItem.type || topItem.channel || topItem.priority || 'N/A';
  const count = topItem.count || topItem.value || 0;
  const percent = topItem.percent || '0.0';
  const totalLabel = config.totalLabel || 'Total';
  const itemLabel = config.itemLabel || 'item';
  
  const color = topItem.color || getColorForIndex(0);
  
  infoBox.innerHTML = `
    <div class="text-xs text-slate-400 mb-1">${config.mostCommonLabel || 'Mais comum'}</div>
    <div class="text-sm font-bold" style="color: ${color}">${label}</div>
    <div class="text-xs text-slate-500 mt-1">${count.toLocaleString('pt-BR')} (${percent}%)</div>
    <div class="text-xs text-slate-400 mt-2">${totalLabel} de ${itemLabel}: ${dataWithPercent.length}</div>
  `;
}

/**
 * Função auxiliar padronizada para renderizar legenda de gráficos de pizza
 */
function renderStandardDoughnutLegend(legendContainerId, dataWithPercent, colorGetter = null) {
  const legendContainer = document.getElementById(legendContainerId);
  if (!legendContainer || !dataWithPercent || dataWithPercent.length === 0) return;
  
  legendContainer.innerHTML = dataWithPercent.map((item, idx) => {
    const label = item.label || item.status || item.type || item.channel || item.priority || 'N/A';
    const count = item.count || item.value || 0;
    const percent = item.percent || '0.0';
    
    // Obter cor: usar colorGetter se fornecido, senão usar getColorForIndex
    let color;
    if (colorGetter && typeof colorGetter === 'function') {
      color = colorGetter(idx, item);
    } else if (item.color) {
      color = item.color;
    } else {
      color = getColorForIndex(idx);
    }
    
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
          <span class="text-sm text-slate-300">${label}</span>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold" style="color: ${color}">${count.toLocaleString('pt-BR')}</div>
          <div class="text-xs text-slate-400">${percent}%</div>
        </div>
      </div>
    `;
  }).join('');
}

// Garantir que a função esteja disponível no escopo global
window.renderStandardDoughnutLegend = renderStandardDoughnutLegend;

/**
 * Renderizar gráficos principais
 * 
 * Estrutura organizada:
 * 1. Análise Temporal: Tendência Mensal + Distribuição Diária
 * 2. Status e SLA: Funil por Status + SLA
 * 3. Rankings: Top Órgãos + Top Temas + Top Unidades
 * 4. Distribuições: Tipos + Canais + Prioridades
 * 
 * OTIMIZAÇÃO: Renderização incremental com lazy loading
 */
async function renderMainCharts(summary, byMonth, byDay, byTheme, byOrgan, byType, byChannel, byPriority, byUnit, forceRefresh = false) {
  // Verificar se chartFactory está disponível
  if (!window.chartFactory) {
    console.error('❌ chartFactory não está disponível!');
    if (window.Logger) {
      window.Logger.error('chartFactory não está disponível');
    }
    return;
  }
  
  // OTIMIZAÇÃO: Verificar se a página ainda está visível antes de renderizar
  const pageMain = document.getElementById('page-main');
  if (!pageMain || pageMain.style.display === 'none') {
    if (window.Logger) {
      window.Logger.debug('📊 renderMainCharts: Página não visível, cancelando renderização');
    }
    return;
  }
  
  // Destruir TODOS os gráficos existentes antes de criar novos (prevenir vazamentos de memória)
  const chartIds = [
    'chartTrend',
    'chartFunnelStatus',
    'chartDailyDistribution',
    'chartTopOrgaos',
    'chartTopTemas',
    'chartTiposManifestacao',
    'chartCanais',
    'chartPrioridades',
    'chartUnidadesCadastro',
    'chartSLA',
    'sparkTotal',
    'spark7',
    'spark30'
  ];
  
  if (window.chartFactory.destroyCharts) {
    const destroyed = window.chartFactory.destroyCharts(chartIds);
    if (window.Logger) {
      window.Logger.debug(`📊 Destruídos ${destroyed} gráfico(s)`);
    }
  }
  
  // Também destruir gráficos Chart.js diretamente (fallback)
  if (window.Chart && typeof window.Chart.getChart === 'function') {
    chartIds.forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const chart = window.Chart.getChart(canvas);
        if (chart) {
          chart.destroy();
        }
      }
    });
  }
  
  // OTIMIZAÇÃO: Renderizar gráficos críticos primeiro (visíveis acima da dobra)
  // Usar Promise.all para renderizar em paralelo os gráficos principais
  
  // ============================================
  // SEÇÃO 2: ANÁLISE TEMPORAL
  // ============================================
  
  // OTIMIZAÇÃO: Renderizar gráficos principais em paralelo (não bloqueiam uns aos outros)
  const criticalChartsPromises = [];
  
  // Gráfico de tendência mensal
  if (byMonth && Array.isArray(byMonth) && byMonth.length > 0) {
    const last12Months = byMonth.slice(-12);
    // Armazenar para uso no onClick handler
    window._last12MonthsData = last12Months;
    
    const labels = last12Months.map(m => {
      const month = m.month || m.ym || '';
      if (month.includes('-')) {
        const [year, monthNum] = month.split('-');
        return window.dateUtils?.formatMonthYearShort(month) || `${monthNum}/${year.slice(-2)}`;
      }
      return month;
    });
    const values = last12Months.map(m => m.count || 0);
    
    // Calcular estatísticas
    const total = values.reduce((sum, v) => sum + v, 0);
    const media = values.length > 0 ? Math.round(total / values.length) : 0;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);
    
    // Detectar picos (valores que são máximos locais significativos)
    const peaks = [];
    const threshold = media * 1.15; // 15% acima da média
    
    // Detectar picos locais no meio do gráfico
    for (let i = 1; i < values.length - 1; i++) {
      const isLocalMax = values[i] > values[i - 1] && values[i] > values[i + 1];
      const isSignificant = values[i] > threshold;
      
      if (isLocalMax && isSignificant) {
        peaks.push({ index: i, value: values[i], label: labels[i] });
      }
    }
    
    // Adicionar primeiro se for pico significativo
    if (values.length > 1 && values[0] > values[1] && values[0] > threshold) {
      peaks.push({ index: 0, value: values[0], label: labels[0] });
    }
    
    // Adicionar último se for pico significativo
    if (values.length > 1 && values[values.length - 1] > values[values.length - 2] && values[values.length - 1] > threshold) {
      peaks.push({ index: values.length - 1, value: values[values.length - 1], label: labels[values.length - 1] });
    }
    
    // Ordenar picos por valor (maior primeiro) e pegar os top 3
    peaks.sort((a, b) => b.value - a.value);
    const topPeaks = peaks.slice(0, 3);
    
    // Ordenar novamente por índice para manter ordem cronológica
    topPeaks.sort((a, b) => a.index - b.index);
    
    // Renderizar informações
    const trendMediaEl = document.getElementById('trendMedia');
    const trendTotalEl = document.getElementById('trendTotal');
    const trendMaxEl = document.getElementById('trendMax');
    const trendMinEl = document.getElementById('trendMin');
    
    if (trendMediaEl) trendMediaEl.textContent = media.toLocaleString('pt-BR');
    if (trendTotalEl) trendTotalEl.textContent = total.toLocaleString('pt-BR');
    if (trendMaxEl) trendMaxEl.textContent = `${max.toLocaleString('pt-BR')} (${labels[maxIndex]})`;
    if (trendMinEl) trendMinEl.textContent = `${min.toLocaleString('pt-BR')} (${labels[minIndex]})`;
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartTrend:', { labels: labels.length, values: values.length, peaks: topPeaks.length });
    }
    
    // OTIMIZAÇÃO: Adicionar à lista de promises para renderização paralela
    criticalChartsPromises.push(
      (async () => {
        try {
          // CROSSFILTER: Adicionar wrapper para clique direito
      const trendCanvas = document.getElementById('chartTrend');
      if (trendCanvas) {
        const container = trendCanvas.parentElement;
        if (container && !container.dataset.crossfilterEnabled) {
          container.dataset.crossfilterEnabled = 'true';
          container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window.crossfilterOverview) {
              window.crossfilterOverview.clearAllFilters();
              window.crossfilterOverview.notifyListeners();
            }
          });
        }
      }
      
          const trendChart = await window.chartFactory.createLineChart('chartTrend', labels, values, {
            label: 'Manifestações',
            colorIndex: 0,
            fill: true,
            tension: 0.4,
            chartOptions: {
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')}`;
                    }
                  }
                }
              }
            }
          });
          
          // Adicionar anotações de picos após o gráfico ser renderizado
          if (topPeaks.length > 0) {
            setTimeout(() => {
              addPeakAnnotations('chartTrend', topPeaks, labels, values);
            }, 500);
          }
          
          // CROSSFILTER: Adicionar handler de clique após criar o gráfico
          if (trendChart && trendChart.canvas) {
            trendChart.canvas.style.cursor = 'pointer';
            trendChart.options.onClick = (event, elements) => {
              // CROSSFILTER: Filtrar por mês quando clicado
              if (elements && elements.length > 0) {
                const element = elements[0];
                const index = element.index;
                const monthData = window._last12MonthsData?.[index] || last12Months[index];
                if (monthData) {
                  const month = monthData.month || monthData.ym || monthData._id;
                  if (month && window.chartCommunication && window.chartCommunication.filters) {
                    if (window.Logger) {
                      window.Logger.debug('📊 Clique no gráfico chartTrend (mês):', { month, index });
                    }
                    // Filtrar por mês usando dataCriacaoIso
                    window.chartCommunication.filters.apply('dataCriacaoIso', month, 'chartTrend', { operator: 'contains' });
                  }
                }
              }
            };
            trendChart.update('none');
          }
        } catch (error) {
          console.error('Erro ao criar chartTrend:', error);
          if (window.Logger) {
            window.Logger.error('Erro ao criar chartTrend:', error);
          }
        }
      })()
    );
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados mensais para chartTrend');
    }
    // Mostrar mensagem de "sem dados" no canvas
    const canvas = document.getElementById('chartTrend');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // ============================================
  // SEÇÃO 3: STATUS E SLA
  // ============================================
  
  // Gráfico funil por status (melhorado com mais informações)
  if (summary.statusCounts && summary.statusCounts.length > 0) {
    const statusData = summary.statusCounts.slice(0, 8); // Aumentar para 8 status
    const labels = statusData.map(s => s.status || s._id || 'N/A');
    const values = statusData.map(s => s.count || 0);
    const totalStatus = values.reduce((sum, v) => sum + v, 0);
    
    // Calcular percentuais e estatísticas
    const statusWithPercent = statusData.map((s, idx) => ({
      status: s.status || s._id || 'N/A',
      count: s.count || 0,
      percent: totalStatus > 0 ? ((s.count || 0) / totalStatus * 100).toFixed(1) : '0.0'
    }));
    
    // Atualizar informações no HTML (padronizado)
    renderStandardDoughnutInfoBox('statusInfo', statusWithPercent.map(s => ({
      label: s.status,
      count: s.count,
      percent: s.percent
    })), {
      mostCommonLabel: 'Status mais comum',
      totalLabel: 'Total',
      itemLabel: 'status'
    });
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartFunnelStatus:', { labels: labels.length, values: values.length });
    }
    
    // OTIMIZAÇÃO: Adicionar à lista de promises para renderização paralela
    criticalChartsPromises.push(
      (async () => {
        try {
          const statusChart = await window.chartFactory.createDoughnutChart('chartFunnelStatus', labels, values, {
            type: 'doughnut',
            field: 'Status', // Campo para cores consistentes
            // Não passar legendContainer para evitar duplicação - usamos apenas renderStandardDoughnutLegend
            chartOptions: {
              plugins: {
                legend: {
                  display: false // Desabilitar legenda padrão (usamos legenda customizada abaixo)
                },
                tooltip: getStandardDoughnutTooltip()
              }
            }
          });
          
          // Adicionar informações detalhadas na legenda (padronizado)
          renderStandardDoughnutLegend('legendFunnelStatus', statusWithPercent.map(s => ({
            label: s.status,
            count: s.count,
            percent: s.percent
          })));
          
          // CROSSFILTER: Adicionar handler de clique após criar o gráfico
          if (statusChart && statusChart.canvas) {
            statusChart.canvas.style.cursor = 'pointer';
            statusChart.options.onClick = (event, elements) => {
              if (elements && elements.length > 0) {
                const element = elements[0];
                const index = element.index;
                // Usar o valor original dos dados, não apenas o label
                const statusItem = statusData[index];
                const status = statusItem?.status || statusItem?._id || labels[index];
                if (status && window.crossfilterOverview) {
                  if (window.Logger) {
                    window.Logger.debug('📊 Clique no gráfico de Status:', { status, index, label: labels[index], statusItem });
                  }
                  window.crossfilterOverview.setStatusFilter(status);
                  window.crossfilterOverview.notifyListeners();
                }
              }
            };
            statusChart.update('none');
          }
        } catch (error) {
          console.error('Erro ao criar chartFunnelStatus:', error);
          if (window.Logger) {
            window.Logger.error('Erro ao criar chartFunnelStatus:', error);
          }
        }
      })()
    );
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados de status para chartFunnelStatus');
    }
    const canvas = document.getElementById('chartFunnelStatus');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // Distribuição diária (últimos 30 dias) - parte da Análise Temporal
  if (byDay && byDay.length > 0) {
    if (window.Logger) {
      window.Logger.debug('📅 Renderizando distribuição diária:', { total: byDay.length, sample: byDay[0] });
    }
    
    // Pegar últimos 30 dias ou todos se tiver menos
    const last30Days = byDay.slice(-30);
    // Armazenar para uso no onClick handler
    window._last30DaysData = last30Days;
    
    // Formatar labels de data
    const labels = last30Days.map(d => {
      const dateStr = d.date || d._id || '';
      if (!dateStr) return '';
      
      // Tentar parsear a data
      let date;
      if (dateStr.includes('-')) {
        date = new Date(dateStr + 'T00:00:00');
      } else {
        date = new Date(dateStr);
      }
      
      if (!isNaN(date.getTime())) {
        // Usar formatDateShort se disponível, senão formatar manualmente
        if (window.dateUtils?.formatDateShort) {
          return window.dateUtils.formatDateShort(date);
        } else {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return `${day}/${month}`;
        }
      }
      
      return dateStr;
    });
    const values = last30Days.map(d => d.count || 0);
    
    // Calcular estatísticas
    const total = values.reduce((sum, v) => sum + v, 0);
    const media = values.length > 0 ? Math.round(total / values.length) : 0;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);
    
    // Atualizar informações no HTML
    const dailyInfoEl = document.getElementById('dailyInfo');
    if (dailyInfoEl) {
      dailyInfoEl.innerHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div class="text-slate-400 mb-1">Média diária</div>
            <div class="text-cyan-300 font-bold">${media.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div class="text-slate-400 mb-1">Total (30 dias)</div>
            <div class="text-violet-300 font-bold">${total.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div class="text-slate-400 mb-1">Dia com mais</div>
            <div class="text-emerald-300 font-bold">${max.toLocaleString('pt-BR')}</div>
            <div class="text-slate-500 text-xs">${labels[maxIndex]}</div>
          </div>
          <div>
            <div class="text-slate-400 mb-1">Dia com menos</div>
            <div class="text-rose-300 font-bold">${min.toLocaleString('pt-BR')}</div>
            <div class="text-slate-500 text-xs">${labels[minIndex]}</div>
          </div>
        </div>
      `;
    }
    
    try {
      const canvas = document.getElementById('chartDailyDistribution');
      if (!canvas) {
        if (window.Logger) {
          window.Logger.warn('⚠️ Canvas chartDailyDistribution não encontrado no DOM');
        }
        console.warn('⚠️ Canvas chartDailyDistribution não encontrado');
        return;
      }
      
      // Verificar se há dados válidos
      if (labels.length === 0 || values.length === 0 || labels.length !== values.length) {
        if (window.Logger) {
          window.Logger.warn('⚠️ Sem dados válidos para distribuição diária', { 
            labelsLength: labels.length, 
            valuesLength: values.length 
          });
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
        return;
      }
      
      if (window.Logger) {
        window.Logger.debug('📅 Criando gráfico de distribuição diária:', { 
          labels: labels.length, 
          values: values.length,
          sampleLabel: labels[0],
          sampleValue: values[0],
          total: total
        });
      }
      
      console.log('📅 Criando gráfico de distribuição diária:', { 
        labels: labels.slice(0, 5), 
        values: values.slice(0, 5),
        total: total
      });
      
      // CROSSFILTER: Adicionar wrapper para clique direito
      const dailyChartContainer = canvas.parentElement;
      if (dailyChartContainer && !dailyChartContainer.dataset.crossfilterEnabled) {
        dailyChartContainer.dataset.crossfilterEnabled = 'true';
        dailyChartContainer.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (window.crossfilterOverview) {
            window.crossfilterOverview.clearAllFilters();
            window.crossfilterOverview.notifyListeners();
          }
        });
      }
      
      // OTIMIZAÇÃO: Adicionar à lista de promises para renderização paralela
      criticalChartsPromises.push(
        (async () => {
          const dailyChart = await window.chartFactory.createBarChart('chartDailyDistribution', labels, values, {
          colorIndex: 0,
          chartOptions: {
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.parsed.y.toLocaleString('pt-BR')} manifestações`;
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
          }
          });
          
          // CROSSFILTER: Adicionar handler de clique após criar o gráfico
          if (dailyChart && dailyChart.canvas) {
            dailyChart.canvas.style.cursor = 'pointer';
            dailyChart.options.onClick = (event, elements) => {
              // CROSSFILTER: Filtrar por data quando clicado
              if (elements && elements.length > 0) {
                const element = elements[0];
                const index = element.index;
                const dayData = window._last30DaysData?.[index] || last30Days[index];
                if (dayData) {
                  const date = dayData.date || dayData._id;
                  if (date && window.chartCommunication && window.chartCommunication.filters) {
                    if (window.Logger) {
                      window.Logger.debug('📊 Clique no gráfico chartDailyDistribution (data):', { date, index });
                    }
                    // Filtrar por data usando dataCriacaoIso
                    window.chartCommunication.filters.apply('dataCriacaoIso', date, 'chartDailyDistribution', { operator: 'contains' });
                  }
                }
              }
            };
            dailyChart.update('none');
          }
          
          return dailyChart;
        })()
      );
      
      if (window.Logger) {
        window.Logger.success('✅ Gráfico de distribuição diária criado com sucesso');
      }
      console.log('✅ Gráfico de distribuição diária criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar chartDailyDistribution:', error);
      if (window.Logger) {
        window.Logger.error('Erro ao criar chartDailyDistribution:', error);
      }
      // Adicionar promise rejeitada para não quebrar Promise.all
      criticalChartsPromises.push(Promise.resolve());
    }
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados diários para chartDailyDistribution. byDay:', byDay);
    }
    console.warn('⚠️ Sem dados diários. byDay:', byDay);
    // Mostrar mensagem de "sem dados" no canvas
    const canvas = document.getElementById('chartDailyDistribution');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // OTIMIZAÇÃO: Aguardar gráficos críticos primeiro (feedback visual mais rápido)
  if (criticalChartsPromises.length > 0) {
    await Promise.allSettled(criticalChartsPromises);
    if (window.Logger) {
      window.Logger.debug('📊 Gráficos críticos renderizados');
    }
  }
  
  // Carregar e renderizar SLA (parte da seção Status e SLA)
  // OTIMIZAÇÃO: Carregar SLA em paralelo com outros gráficos secundários
  const slaPromise = (async () => {
    try {
      let slaData = null;
      
      if (!slaData) {
        slaData = await window.dataLoader?.load('/api/sla/summary', {
          useDataStore: !forceRefresh,
          ttl: 5 * 60 * 1000
        });
      }
      
      if (slaData) {
        await renderSLAChart(slaData);
      }
    } catch (error) {
      if (window.Logger) {
        window.Logger.warn('Erro ao carregar dados de SLA:', error);
      }
    }
  })();
  
  // ============================================
  // SEÇÃO 4: RANKINGS E TOP PERFORMERS
  // ============================================
  
  // OTIMIZAÇÃO: Renderizar gráficos de rankings em paralelo (não dependem uns dos outros)
  const rankingPromises = [];
  
  // Top órgãos (se disponível)
  if (byOrgan && Array.isArray(byOrgan) && byOrgan.length > 0) {
    // GARANTIR APENAS TOP 5: Ordenar por count (maior primeiro) e pegar apenas 5
    const sortedOrgaos = [...byOrgan].sort((a, b) => (b.count || 0) - (a.count || 0));
    const topOrgaos = sortedOrgaos.slice(0, 5); // Top 5 principais
    const labels = topOrgaos.map(o => o.organ || o._id || 'N/A');
    const values = topOrgaos.map(o => o.count || 0);
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartTopOrgaos (TOP 5):', { 
        labels: labels.length, 
        values: values.length,
        labelsList: labels,
        valuesList: values
      });
    }
    
    // CROSSFILTER: Adicionar wrapper para clique direito
    const orgaosCanvas = document.getElementById('chartTopOrgaos');
    if (orgaosCanvas) {
      const container = orgaosCanvas.parentElement;
      if (container && !container.dataset.crossfilterEnabled) {
        container.dataset.crossfilterEnabled = 'true';
        container.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (window.crossfilterOverview) {
            window.crossfilterOverview.clearAllFilters();
            window.crossfilterOverview.notifyListeners();
          }
        });
      }
    }
    
    rankingPromises.push(
      (async () => {
        // GARANTIR que apenas 5 barras sejam exibidas (validação final)
        // Backend já limita a 5, mas garantimos aqui também
        const MAX_ITEMS = 5;
        const finalLabels = labels.slice(0, MAX_ITEMS);
        const finalValues = values.slice(0, MAX_ITEMS);
        
        // Log para debug
        if (window.Logger && (finalLabels.length !== MAX_ITEMS || finalValues.length !== MAX_ITEMS)) {
          window.Logger.warn(`⚠️ chartTopOrgaos: Esperado ${MAX_ITEMS} itens, recebido ${finalLabels.length} labels e ${finalValues.length} values`);
        }
        
        const orgaosChart = await window.chartFactory.createBarChart('chartTopOrgaos', finalLabels, finalValues, {
        horizontal: true,
        colorIndex: 1,
        });
        
        // CROSSFILTER: Adicionar handler de clique após criar o gráfico
        if (orgaosChart && orgaosChart.canvas) {
          orgaosChart.canvas.style.cursor = 'pointer';
          orgaosChart.options.onClick = (event, elements) => {
            if (elements && elements.length > 0) {
              const element = elements[0];
              const index = element.index;
              // Usar dados do top 5 (já limitado)
              const orgaoItem = topOrgaos[index];
              const orgao = orgaoItem?.organ || orgaoItem?._id || finalLabels[index] || 'N/A';
              if (orgao && window.crossfilterOverview) {
                if (window.Logger) {
                  window.Logger.debug('📊 Clique no gráfico de Órgãos:', { orgao, index, orgaoItem });
                }
                window.crossfilterOverview.setOrgaosFilter(orgao);
                window.crossfilterOverview.notifyListeners();
              }
            }
          };
          orgaosChart.update('none');
        }
        
        return orgaosChart;
      })().catch(error => {
        console.error('Erro ao criar chartTopOrgaos:', error);
        if (window.Logger) {
          window.Logger.error('Erro ao criar chartTopOrgaos:', error);
        }
        // Mostrar mensagem de erro no canvas
        const canvas = document.getElementById('chartTopOrgaos');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Erro ao carregar', canvas.width / 2, canvas.height / 2);
        }
      })
    );
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados de órgãos para chartTopOrgaos');
    }
    const canvas = document.getElementById('chartTopOrgaos');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // Top temas (se disponível)
  if (byTheme && Array.isArray(byTheme) && byTheme.length > 0) {
    // GARANTIR APENAS TOP 5: Ordenar por count (maior primeiro) e pegar apenas 5
    const sortedTemas = [...byTheme].sort((a, b) => (b.count || 0) - (a.count || 0));
    const topTemas = sortedTemas.slice(0, 5); // Top 5 principais
    const labels = topTemas.map(t => t.theme || t._id || 'N/A');
    const values = topTemas.map(t => t.count || 0);
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartTopTemas (TOP 5):', { 
        labels: labels.length, 
        values: values.length,
        labelsList: labels,
        valuesList: values
      });
    }
    
    // CROSSFILTER: Adicionar wrapper para clique direito
    const temasCanvas = document.getElementById('chartTopTemas');
    if (temasCanvas) {
      const container = temasCanvas.parentElement;
      if (container && !container.dataset.crossfilterEnabled) {
        container.dataset.crossfilterEnabled = 'true';
        container.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (window.crossfilterOverview) {
            window.crossfilterOverview.clearAllFilters();
            window.crossfilterOverview.notifyListeners();
          }
        });
      }
    }
    
    rankingPromises.push(
      (async () => {
        // GARANTIR que apenas 5 barras sejam exibidas (validação final)
        // Backend já limita a 5, mas garantimos aqui também
        const MAX_ITEMS = 5;
        const finalLabels = labels.slice(0, MAX_ITEMS);
        const finalValues = values.slice(0, MAX_ITEMS);
        
        // Log para debug
        if (window.Logger && (finalLabels.length !== MAX_ITEMS || finalValues.length !== MAX_ITEMS)) {
          window.Logger.warn(`⚠️ chartTopTemas: Esperado ${MAX_ITEMS} itens, recebido ${finalLabels.length} labels e ${finalValues.length} values`);
        }
        
        const temasChart = await window.chartFactory.createBarChart('chartTopTemas', finalLabels, finalValues, {
        horizontal: true,
        colorIndex: 2,
        });
        
        // CROSSFILTER: Adicionar handler de clique após criar o gráfico
        if (temasChart && temasChart.canvas) {
          temasChart.canvas.style.cursor = 'pointer';
          temasChart.options.onClick = (event, elements) => {
            if (elements && elements.length > 0) {
              const element = elements[0];
              const index = element.index;
              // Usar dados do top 5 (já limitado)
              const temaItem = topTemas[index];
              const tema = temaItem?.theme || temaItem?._id || finalLabels[index] || 'N/A';
              if (tema && window.crossfilterOverview) {
                if (window.Logger) {
                  window.Logger.debug('📊 Clique no gráfico de Temas:', { tema, index, temaItem });
                }
                window.crossfilterOverview.setTemaFilter(tema);
                window.crossfilterOverview.notifyListeners();
              }
            }
          };
          temasChart.update('none');
        }
        
        return temasChart;
      })().catch(error => {
        console.error('Erro ao criar chartTopTemas:', error);
        if (window.Logger) {
          window.Logger.error('Erro ao criar chartTopTemas:', error);
        }
        const canvas = document.getElementById('chartTopTemas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Erro ao carregar', canvas.width / 2, canvas.height / 2);
        }
      })
    );
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados de temas para chartTopTemas');
    }
    const canvas = document.getElementById('chartTopTemas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // OTIMIZAÇÃO: Aguardar gráficos de ranking e SLA em paralelo
  const secondaryPromises = [...rankingPromises, slaPromise];
  if (secondaryPromises.length > 0) {
    await Promise.allSettled(secondaryPromises);
    if (window.Logger) {
      window.Logger.debug('📊 Gráficos secundários renderizados');
    }
  }
  
  // ============================================
  // SEÇÃO 5: DISTRIBUIÇÕES E CATEGORIAS
  // ============================================
  
  // Tipos de manifestação (pie chart melhorado)
  if (byType && byType.length > 0) {
    const labels = byType.map(t => t.type || 'N/A');
    const values = byType.map(t => t.count || 0);
    const total = values.reduce((sum, v) => sum + v, 0);
    
    // Calcular estatísticas
    const tiposWithPercent = byType.map((t, idx) => ({
      type: t.type || 'N/A',
      count: t.count || 0,
      percent: total > 0 ? ((t.count || 0) / total * 100).toFixed(1) : '0.0'
    }));
    
    // Atualizar informações no HTML (padronizado)
    renderStandardDoughnutInfoBox('tiposInfo', tiposWithPercent.map(t => ({
      label: t.type,
      count: t.count,
      percent: t.percent
    })), {
      mostCommonLabel: 'Tipo mais comum',
      totalLabel: 'Total de tipos',
      itemLabel: 'tipos'
    });
    
    try {
      // CROSSFILTER: Adicionar wrapper para clique direito
      const tiposCanvas = document.getElementById('chartTiposManifestacao');
      if (tiposCanvas) {
        const container = tiposCanvas.parentElement;
        if (container && !container.dataset.crossfilterEnabled) {
          container.dataset.crossfilterEnabled = 'true';
          container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window.crossfilterOverview) {
              window.crossfilterOverview.clearAllFilters();
              window.crossfilterOverview.notifyListeners();
            }
          });
        }
      }
      
      const tiposChart = await window.chartFactory.createDoughnutChart('chartTiposManifestacao', labels, values, {
        field: 'tipoDeManifestacao',
        // Não passar legendContainer para evitar duplicação - usamos apenas renderStandardDoughnutLegend
        chartOptions: {
          plugins: {
            legend: {
              display: false // Desabilitar legenda padrão (usamos legenda customizada abaixo)
            },
            tooltip: getStandardDoughnutTooltip()
          }
        }
      });
      
      // Adicionar informações detalhadas na legenda (padronizado)
      renderStandardDoughnutLegend('legendTiposManifestacao', tiposWithPercent.map(t => ({
        label: t.type,
        count: t.count,
        percent: t.percent
      })));
      
      // CROSSFILTER: Adicionar handler de clique após criar o gráfico
      if (tiposChart && tiposChart.canvas) {
        tiposChart.canvas.style.cursor = 'pointer';
        tiposChart.options.onClick = (event, elements) => {
          if (elements && elements.length > 0) {
            const element = elements[0];
            const index = element.index;
            // Usar dados originais
            const tipoItem = byType[index];
            const tipo = tipoItem?.type || tipoItem?._id || labels[index];
            if (tipo && window.crossfilterOverview) {
              if (window.Logger) {
                window.Logger.debug('📊 Clique no gráfico de Tipos:', { tipo, index, tipoItem });
              }
              window.crossfilterOverview.setTipoFilter(tipo);
              window.crossfilterOverview.notifyListeners();
            }
          }
        };
        tiposChart.update('none');
      }
    } catch (error) {
      console.error('Erro ao criar chartTiposManifestacao:', error);
    }
  }
  
  // OTIMIZAÇÃO: Renderizar gráficos de distribuição em paralelo
  const distributionPromises = [];
  
  // Canais de atendimento (doughnut chart)
  if (byChannel && byChannel.length > 0) {
    const topCanais = byChannel.slice(0, 8); // Top 8 canais
    const labels = topCanais.map(c => c.channel || 'N/A');
    const values = topCanais.map(c => c.count || 0);
    const totalCanais = values.reduce((sum, v) => sum + v, 0);
    
    // Calcular percentuais para legenda
    const canaisWithPercent = topCanais.map((c, idx) => ({
      label: c.channel || 'N/A',
      count: c.count || 0,
      percent: totalCanais > 0 ? ((c.count || 0) / totalCanais * 100).toFixed(1) : '0.0'
    }));
    
    distributionPromises.push(
      (async () => {
        try {
          // CROSSFILTER: Adicionar wrapper para clique direito
          const canaisCanvas = document.getElementById('chartCanais');
          if (canaisCanvas) {
            const container = canaisCanvas.parentElement;
            if (container && !container.dataset.crossfilterEnabled) {
              container.dataset.crossfilterEnabled = 'true';
              container.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (window.crossfilterOverview) {
                  window.crossfilterOverview.clearAllFilters();
                  window.crossfilterOverview.notifyListeners();
                }
              });
            }
          }
          
          const canaisChart = await window.chartFactory.createDoughnutChart('chartCanais', labels, values, {
            field: 'Canal', // Campo para detecção automática de cores consistentes
            // Não passar legendContainer para evitar duplicação - usamos apenas renderStandardDoughnutLegend
            chartOptions: {
              plugins: {
                legend: {
                  display: false // Desabilitar legenda padrão (usamos legenda customizada abaixo)
                },
                tooltip: getStandardDoughnutTooltip()
              }
            }
          });
          
          // Adicionar informações detalhadas na legenda (padronizado)
          renderStandardDoughnutInfoBox('canaisInfo', canaisWithPercent, {
            mostCommonLabel: 'Canal mais comum',
            totalLabel: 'Total de canais',
            itemLabel: 'canais'
          });
          renderStandardDoughnutLegend('legendCanais', canaisWithPercent);
          
          // CROSSFILTER: Adicionar handler de clique após criar o gráfico
          if (canaisChart && canaisChart.canvas) {
            canaisChart.canvas.style.cursor = 'pointer';
            canaisChart.options.onClick = (event, elements) => {
              if (elements && elements.length > 0) {
                const element = elements[0];
                const index = element.index;
                // Usar dados originais
                const canalItem = topCanais[index];
                const canal = canalItem?.channel || canalItem?._id || labels[index];
                if (canal && window.crossfilterOverview) {
                  if (window.Logger) {
                    window.Logger.debug('📊 Clique no gráfico de Canais:', { canal, index, canalItem });
                  }
                  window.crossfilterOverview.setCanalFilter(canal);
                  window.crossfilterOverview.notifyListeners();
                }
              }
            };
            canaisChart.update('none');
          }
        } catch (error) {
          console.error('Erro ao criar chartCanais:', error);
        }
      })()
    );
  }
  
  // Prioridades (doughnut chart)
  if (byPriority && byPriority.length > 0) {
    const labels = byPriority.map(p => p.priority || 'N/A');
    const values = byPriority.map(p => p.count || 0);
    const totalPrioridades = values.reduce((sum, v) => sum + v, 0);
    
    // Calcular percentuais para legenda
    const prioridadesWithPercent = byPriority.map((p, idx) => ({
      label: p.priority || 'N/A',
      count: p.count || 0,
      percent: totalPrioridades > 0 ? ((p.count || 0) / totalPrioridades * 100).toFixed(1) : '0.0'
    }));
    
    distributionPromises.push(
      (async () => {
        try {
          // CROSSFILTER: Adicionar wrapper para clique direito
          const prioridadesCanvas = document.getElementById('chartPrioridades');
          if (prioridadesCanvas) {
            const container = prioridadesCanvas.parentElement;
            if (container && !container.dataset.crossfilterEnabled) {
              container.dataset.crossfilterEnabled = 'true';
              container.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (window.crossfilterOverview) {
                  window.crossfilterOverview.clearAllFilters();
                  window.crossfilterOverview.notifyListeners();
                }
              });
            }
          }
          
          const prioridadesChart = await window.chartFactory.createDoughnutChart('chartPrioridades', labels, values, {
            field: 'Prioridade', // Campo para detecção automática de cores consistentes
            // Não passar legendContainer para evitar duplicação - usamos apenas renderStandardDoughnutLegend
            chartOptions: {
              plugins: {
                legend: {
                  display: false // Desabilitar legenda padrão (usamos legenda customizada abaixo)
                },
                tooltip: getStandardDoughnutTooltip()
              }
            }
          });
          
          // Adicionar informações detalhadas na legenda (padronizado)
          renderStandardDoughnutInfoBox('prioridadesInfo', prioridadesWithPercent, {
            mostCommonLabel: 'Prioridade mais comum',
            totalLabel: 'Total de prioridades',
            itemLabel: 'prioridades'
          });
          renderStandardDoughnutLegend('legendPrioridades', prioridadesWithPercent);
          
          // CROSSFILTER: Adicionar handler de clique após criar o gráfico
          if (prioridadesChart && prioridadesChart.canvas) {
            prioridadesChart.canvas.style.cursor = 'pointer';
            prioridadesChart.options.onClick = (event, elements) => {
              if (elements && elements.length > 0) {
                const element = elements[0];
                const index = element.index;
                // Usar dados originais
                const prioridadeItem = byPriority[index];
                const prioridade = prioridadeItem?.priority || prioridadeItem?._id || labels[index];
                if (prioridade && window.crossfilterOverview) {
                  if (window.Logger) {
                    window.Logger.debug('📊 Clique no gráfico de Prioridades:', { prioridade, index, prioridadeItem });
                  }
                  window.crossfilterOverview.setPrioridadeFilter(prioridade);
                  window.crossfilterOverview.notifyListeners();
                }
              }
            };
            prioridadesChart.update('none');
          }
        } catch (error) {
          console.error('Erro ao criar chartPrioridades:', error);
        }
      })()
    );
  }
  
  // Top unidades de cadastro (movido para seção de Rankings)
  if (byUnit && Array.isArray(byUnit) && byUnit.length > 0) {
    // GARANTIR APENAS TOP 5: Ordenar por count (maior primeiro) e pegar apenas 5
    const sortedUnidades = [...byUnit].sort((a, b) => (b.count || 0) - (a.count || 0));
    const topUnidades = sortedUnidades.slice(0, 5); // Top 5 principais
    const labels = topUnidades.map(u => u.unit || u.unidadeCadastro || u._id || 'N/A');
    const values = topUnidades.map(u => u.count || 0);
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartUnidadesCadastro (TOP 5):', { 
        labels: labels.length, 
        values: values.length,
        labelsList: labels,
        valuesList: values
      });
    }
    
    // CROSSFILTER: Adicionar wrapper para clique direito
    const unidadesCanvas = document.getElementById('chartUnidadesCadastro');
    if (unidadesCanvas) {
      const container = unidadesCanvas.parentElement;
      if (container && !container.dataset.crossfilterEnabled) {
        container.dataset.crossfilterEnabled = 'true';
        container.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (window.crossfilterOverview) {
            window.crossfilterOverview.clearAllFilters();
            window.crossfilterOverview.notifyListeners();
          }
        });
      }
    }
    
    distributionPromises.push(
      (async () => {
        // GARANTIR que apenas 5 barras sejam exibidas (validação final)
        // Backend já limita a 5, mas garantimos aqui também
        const MAX_ITEMS = 5;
        const finalLabels = labels.slice(0, MAX_ITEMS);
        const finalValues = values.slice(0, MAX_ITEMS);
        
        // Log para debug
        if (window.Logger && (finalLabels.length !== MAX_ITEMS || finalValues.length !== MAX_ITEMS)) {
          window.Logger.warn(`⚠️ chartUnidadesCadastro: Esperado ${MAX_ITEMS} itens, recebido ${finalLabels.length} labels e ${finalValues.length} values`);
        }
        
        const unidadesChart = await window.chartFactory.createBarChart('chartUnidadesCadastro', finalLabels, finalValues, {
        horizontal: true,
        colorIndex: 3,
        });
        
        // CROSSFILTER: Adicionar handler de clique após criar o gráfico
        if (unidadesChart && unidadesChart.canvas) {
          unidadesChart.canvas.style.cursor = 'pointer';
          unidadesChart.options.onClick = (event, elements) => {
            if (elements && elements.length > 0) {
              const element = elements[0];
              const index = element.index;
              // Usar dados do top 5 (já limitado)
              const unidadeItem = topUnidades[index];
              const unidade = unidadeItem?.unit || unidadeItem?.unidadeCadastro || unidadeItem?._id || finalLabels[index] || 'N/A';
              if (unidade && window.crossfilterOverview) {
                if (window.Logger) {
                  window.Logger.debug('📊 Clique no gráfico de Unidades:', { unidade, index, unidadeItem });
                }
                window.crossfilterOverview.setUnidadeFilter(unidade);
                window.crossfilterOverview.notifyListeners();
              }
            }
          };
          unidadesChart.update('none');
        }
        
        return unidadesChart;
      })().catch(error => {
        console.error('Erro ao criar chartUnidadesCadastro:', error);
      })
    );
  }
  
  // Aguardar todos os gráficos de distribuição em paralelo
  if (distributionPromises.length > 0) {
    await Promise.all(distributionPromises);
  }
  
  if (window.Logger) {
    window.Logger.success('📊 Todos os gráficos renderizados');
  }
}

/**
 * Esta função não é mais necessária - os gráficos foram movidos para renderMainCharts
 * Mantida apenas para compatibilidade, mas não é chamada
 */

/**
 * Renderizar gráfico de SLA
 */
async function renderSLAChart(slaData) {
  const labels = ['Concluídos', 'Verde (0-30d)', 'Amarelo (31-60d)', 'Vermelho (61+d)'];
  const values = [
    slaData.concluidos || 0,
    slaData.verdeClaro || 0,
    slaData.amarelo || 0,
    slaData.vermelho || 0
  ];
  
  const total = values.reduce((sum, v) => sum + v, 0);
  
  if (total === 0) return;
  
  // Calcular percentuais
  const slaWithPercent = values.map((v, idx) => ({
    label: labels[idx],
    value: v,
    percent: total > 0 ? ((v / total) * 100).toFixed(1) : '0.0'
  }));
  
  // Atualizar informações no HTML
  const slaInfoEl = document.getElementById('slaInfo');
  if (slaInfoEl) {
    const concluidosPercent = slaWithPercent[0].percent;
    const emAndamento = total - (slaData.concluidos || 0);
    slaInfoEl.innerHTML = `
      <div class="space-y-3">
        <div>
          <div class="text-xs text-slate-400 mb-1">Taxa de conclusão</div>
          <div class="text-2xl font-bold text-emerald-300">${concluidosPercent}%</div>
          <div class="text-xs text-slate-500 mt-1">${(slaData.concluidos || 0).toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-slate-400 mb-1">Em andamento</div>
            <div class="text-cyan-300 font-bold">${emAndamento.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div class="text-slate-400 mb-1">Atrasados</div>
            <div class="text-red-300 font-bold">${(slaData.vermelho || 0).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  try {
    const canvas = document.getElementById('chartSLA');
    if (canvas) {
      // Usar função do escopo global ou local
      const tooltipFn = window.getStandardDoughnutTooltip || getStandardDoughnutTooltip;
      
      // CROSSFILTER: Adicionar wrapper para clique direito
      const slaCanvas = document.getElementById('chartSLA');
      if (slaCanvas) {
        const container = slaCanvas.parentElement;
        if (container && !container.dataset.crossfilterEnabled) {
          container.dataset.crossfilterEnabled = 'true';
          container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window.crossfilterOverview) {
              window.crossfilterOverview.clearAllFilters();
              window.crossfilterOverview.notifyListeners();
            }
          });
        }
      }
      
      const slaChart = await window.chartFactory.createDoughnutChart('chartSLA', labels, values, {
        chartOptions: {
          plugins: {
            legend: {
              display: false // Desabilitar legenda padrão (usamos legenda customizada abaixo)
            },
            tooltip: tooltipFn()
          }
        }
      });
      
      // Adicionar informações detalhadas na legenda (padronizado)
      // SLA usa cores fixas específicas
      const slaColors = ['#34d399', '#22d3ee', '#fbbf24', '#fb7185'];
      
      // Usar função do escopo global ou local
      const legendFn = window.renderStandardDoughnutLegend || renderStandardDoughnutLegend;
      legendFn('legendSLA', slaWithPercent.map((s, idx) => ({
        label: s.label,
        count: s.value,
        percent: s.percent,
        color: slaColors[idx]
      })));
      
      // CROSSFILTER: Adicionar handler de clique após criar o gráfico
      if (slaChart && slaChart.canvas) {
        slaChart.canvas.style.cursor = 'pointer';
        slaChart.options.onClick = (event, elements) => {
          // CROSSFILTER: Por enquanto não filtrar por SLA (categoria especial)
        };
        slaChart.update('none');
      }
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao criar chartSLA:', error);
    }
    console.error('Erro ao criar chartSLA:', error);
  }
}

/**
 * Adicionar anotações de picos no gráfico
 */
function addPeakAnnotations(chartId, peaks, labels, values) {
  const chart = window[chartId];
  if (!chart || !(chart instanceof Chart)) return;
  
  const canvas = chart.canvas;
  const canvasContainer = canvas.parentElement;
  if (!canvasContainer) return;
  
  // Limpar anotações anteriores
  const existingAnnotations = canvasContainer.querySelectorAll('.peak-annotation');
  existingAnnotations.forEach(el => el.remove());
  
  // Garantir que o container tenha position relative
  if (getComputedStyle(canvasContainer).position === 'static') {
    canvasContainer.style.position = 'relative';
  }
  
  // Função para atualizar posições das anotações
  const updateAnnotations = () => {
    if (!chart || !chart.chartArea) return;
    
    peaks.forEach((peak, idx) => {
      const annotation = canvasContainer.querySelectorAll('.peak-annotation')[idx];
      if (!annotation) return;
      
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data || !meta.data[peak.index]) return;
      
      const point = meta.data[peak.index];
      if (!point) return;
      
      // Posição do ponto no canvas (coordenadas do Chart.js são relativas ao canvas)
      // Chart.js já calcula as posições relativas ao canvas
      const x = point.x;
      const y = point.y - 40; // Posicionar acima do ponto
      
      annotation.style.left = `${x}px`;
      annotation.style.top = `${y}px`;
      annotation.style.opacity = '1'; // Mostrar após posicionar
    });
  };
  
  // Criar anotações (serão posicionadas pela função updateAnnotations)
  peaks.forEach(peak => {
    // Criar elemento de anotação
    const annotation = document.createElement('div');
    annotation.className = 'peak-annotation absolute pointer-events-none';
    annotation.style.cssText = `
      transform: translate(-50%, -100%);
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.95), rgba(34, 211, 238, 0.85));
      border: 2px solid #22d3ee;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: bold;
      color: #0b1020;
      text-align: center;
      box-shadow: 0 4px 16px rgba(34, 211, 238, 0.4), 0 0 0 1px rgba(34, 211, 238, 0.2);
      z-index: 100;
      white-space: nowrap;
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    annotation.innerHTML = `
      <div style="font-size: 10px; opacity: 0.85; margin-bottom: 2px;">${peak.label}</div>
      <div style="font-size: 14px; font-weight: 700; line-height: 1.2;">${peak.value.toLocaleString('pt-BR')}</div>
    `;
    
    canvasContainer.appendChild(annotation);
  });
  
  // Atualizar posições após renderização completa
  setTimeout(updateAnnotations, 300);
  
  // Observar redimensionamento
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      setTimeout(updateAnnotations, 100);
    });
    observer.observe(canvas);
  }
  
  // Atualizar quando o gráfico for atualizado
  const originalUpdate = chart.update.bind(chart);
  chart.update = function(...args) {
    const result = originalUpdate(...args);
    setTimeout(updateAnnotations, 100);
    return result;
  };
}

/**
 * Carregar insights de IA
 */
async function loadAIInsights() {
  try {
    const insights = await window.dataLoader?.load('/api/ai/insights', {
      useDataStore: true,
      ttl: 5 * 60 * 1000 // 5 minutos
    }) || {};
    
    const insightsBox = document.getElementById('insightsAIBox');
    if (insightsBox && insights.insights) {
      insightsBox.innerHTML = insights.insights.map(insight => `
        <div class="bg-slate-800/60 rounded-lg p-4 border border-emerald-500/20">
          <div class="text-sm text-emerald-300 font-semibold mb-2">💡 ${insight.title || 'Insight'}</div>
          <div class="text-xs text-slate-300">${insight.description || insight}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.debug('Erro ao carregar insights de IA:', error);
    }
  }
}

/**
 * Calcular SLA a partir de um array de registros filtrados
 * @param {Array} rows - Array de registros filtrados
 * @returns {Object} Objeto com dados de SLA
 */
function calculateSLAFromRows(rows) {
  if (!rows || rows.length === 0) {
    return {
      concluidos: 0,
      verdeClaro: 0,
      amarelo: 0,
      vermelho: 0
    };
  }
  
  let concluidos = 0;
  let verdeClaro = 0;
  let amarelo = 0;
  let vermelho = 0;
  
  const now = new Date();
  
  for (const row of rows) {
    const data = row.data || row;
    
    // Verificar se está concluído
    const status = data.status || 
                   data.status_demanda || 
                   row.status || 
                   row.status_demanda || 
                   '';
    
    const isConcluido = status && (
      status.toLowerCase().includes('concluído') ||
      status.toLowerCase().includes('concluido') ||
      status.toLowerCase().includes('finalizado') ||
      status.toLowerCase().includes('resolvido')
    );
    
    if (isConcluido) {
      concluidos++;
      continue;
    }
    
    // Calcular prazo restante
    let prazoRestante = null;
    if (data.prazo_restante) {
      prazoRestante = parseInt(data.prazo_restante);
    } else if (data.prazoRestante) {
      prazoRestante = parseInt(data.prazoRestante);
    } else if (row.prazo_restante) {
      prazoRestante = parseInt(row.prazo_restante);
    } else if (row.prazoRestante) {
      prazoRestante = parseInt(row.prazoRestante);
    }
    
    // Classificar por prazo
    if (prazoRestante !== null && !isNaN(prazoRestante)) {
      if (prazoRestante <= 30) {
        verdeClaro++;
      } else if (prazoRestante <= 60) {
        amarelo++;
      } else {
        vermelho++;
      }
    } else {
      // Se não tem prazo, considerar como vermelho (atrasado)
      vermelho++;
    }
  }
  
  return {
    concluidos,
    verdeClaro,
    amarelo,
    vermelho
  };
}

/**
 * Agregar dados filtrados localmente
 * Converte array de registros filtrados em formato de dashboard-data
 */
// CORREÇÃO CRÍTICA: NÃO criar stub - a função será definida logo abaixo
// O stub estava causando problemas porque retornava estrutura incompleta

function aggregateFilteredData(rows) {
  // CORREÇÃO CRÍTICA: Console.log DIRETO para garantir que aparece
  console.log('🚀🚀🚀 aggregateFilteredData CHAMADA!', {
    rowsCount: rows?.length,
    isArray: Array.isArray(rows),
    functionName: 'aggregateFilteredData',
    timestamp: new Date().toISOString()
  });
  
  // CORREÇÃO CRÍTICA: Validar entrada imediatamente
  if (!rows || !Array.isArray(rows)) {
    console.error('❌ aggregateFilteredData: rows não é um array válido!', {
      type: typeof rows,
      isArray: Array.isArray(rows),
      value: rows
    });
    if (window.Logger) {
      window.Logger.error('❌ aggregateFilteredData: rows não é um array válido!', {
        type: typeof rows,
        isArray: Array.isArray(rows),
        value: rows
      });
    }
    return {
      totalManifestations: 0,
      last7Days: 0,
      last30Days: 0,
      manifestationsByMonth: [],
      manifestationsByDay: [],
      manifestationsByStatus: [],
      manifestationsByTheme: [],
      manifestationsByOrgan: [],
      manifestationsByType: [],
      manifestationsByChannel: [],
      manifestationsByPriority: [],
      manifestationsByUnit: []
    };
  }
  
  // CORREÇÃO CRÍTICA: Log imediato para confirmar que a função está sendo executada
  console.log('📊 aggregateFilteredData: Iniciando processamento...', rows.length);
  if (window.Logger) {
    window.Logger.debug('🚀 aggregateFilteredData: FUNÇÃO REAL EXECUTADA!', {
      totalRows: rows.length,
      isArray: Array.isArray(rows),
      firstRowExists: !!rows[0],
      functionName: 'aggregateFilteredData'
    });
  }
  
  try {
    if (window.Logger) {
      window.Logger.debug('📊 aggregateFilteredData: Iniciando agregação', {
        totalRows: rows.length,
        sampleRow: rows[0] ? {
          id: rows[0].id || rows[0]._id,
          keys: Object.keys(rows[0]).slice(0, 15),
          hasData: !!rows[0].data,
          dataKeys: rows[0].data ? Object.keys(rows[0].data).slice(0, 15) : [],
          prioridade: rows[0].prioridade || rows[0].Prioridade || rows[0].data?.prioridade || rows[0].data?.Prioridade || 'N/A',
          status: rows[0].status || rows[0].Status || rows[0].data?.status || rows[0].data?.Status || 'N/A'
        } : null
      });
    }
  
    if (!rows || rows.length === 0) {
    if (window.Logger) {
      window.Logger.warn('📊 aggregateFilteredData: Nenhum registro para agregar');
    }
    return {
      totalManifestations: 0,
      last7Days: 0,
      last30Days: 0,
      manifestationsByMonth: [],
      manifestationsByDay: [],
      manifestationsByStatus: [],
      manifestationsByTheme: [],
      manifestationsByOrgan: [],
      manifestationsByType: [],
      manifestationsByChannel: [],
      manifestationsByPriority: [],
      manifestationsByUnit: []
    };
  }
  
  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(now.getDate() - 7);
  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 30);
  
  // Agregações
  const statusMap = new Map();
  const themeMap = new Map();
  const organMap = new Map();
  const typeMap = new Map();
  const channelMap = new Map();
  const priorityMap = new Map();
  const unitMap = new Map();
  const monthMap = new Map();
  const dayMap = new Map();
  
  let last7Count = 0;
  let last30Count = 0;
  
  // Helper MELHORADO para buscar campo em múltiplos locais
  // CORREÇÃO CRÍTICA: Buscar em TODAS as variações possíveis de nomes de campos
  const getFieldValue = (row, fieldName, variations = []) => {
    if (!row || typeof row !== 'object') return null;
    
    // Criar lista completa de variações para buscar
    const allVariations = [
      fieldName, // Nome original
      ...variations, // Variações fornecidas
      // Variações automáticas
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1), // Primeira maiúscula
      fieldName.toUpperCase(), // Tudo maiúscula
      fieldName.toLowerCase(), // Tudo minúscula
      // Para cada variação fornecida, criar maiúsculas/minúsculas
      ...variations.map(v => v.charAt(0).toUpperCase() + v.slice(1)),
      ...variations.map(v => v.toUpperCase()),
      ...variations.map(v => v.toLowerCase())
    ];
    
    // Remover duplicatas e valores vazios
    const uniqueVariations = [...new Set(allVariations.filter(v => v && v.trim()))];
    
    // 1. PRIORIDADE MÁXIMA: Tentar no registro direto (campos normalizados do banco)
    for (const variation of uniqueVariations) {
      if (row.hasOwnProperty(variation) && row[variation] !== undefined && row[variation] !== null && row[variation] !== '') {
        const value = String(row[variation]).trim();
        if (value && value !== 'null' && value !== 'undefined' && value !== 'N/A' && value.length > 0) {
          return value;
        }
      }
    }
    
    // 2. Tentar no objeto data (JSON armazenado)
    const data = row.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const variation of uniqueVariations) {
        if (data.hasOwnProperty(variation) && data[variation] !== undefined && data[variation] !== null && data[variation] !== '') {
          const value = String(data[variation]).trim();
          if (value && value !== 'null' && value !== 'undefined' && value !== 'N/A' && value.length > 0) {
            return value;
          }
        }
      }
    }
    
    // 3. FALLBACK: Tentar buscar em todas as chaves do objeto (case-insensitive)
    const allKeys = Object.keys(row);
    const lowerFieldName = fieldName.toLowerCase();
    
    for (const key of allKeys) {
      if (key.toLowerCase() === lowerFieldName) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          const strValue = String(value).trim();
          if (strValue && strValue !== 'null' && strValue !== 'undefined' && strValue !== 'N/A' && strValue.length > 0) {
            return strValue;
          }
        }
      }
    }
    
    // 4. FALLBACK FINAL: Tentar no data com busca case-insensitive
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const dataKeys = Object.keys(data);
      for (const key of dataKeys) {
        if (key.toLowerCase() === lowerFieldName) {
          const value = data[key];
          if (value !== undefined && value !== null && value !== '') {
            const strValue = String(value).trim();
            if (strValue && strValue !== 'null' && strValue !== 'undefined' && strValue !== 'N/A' && strValue.length > 0) {
              return strValue;
            }
          }
        }
      }
    }
    
    // 5. FALLBACK EXTRA: Tentar buscar variações case-insensitive em todas as chaves
    for (const variation of uniqueVariations) {
      const lowerVariation = variation.toLowerCase();
      for (const key of allKeys) {
        if (key.toLowerCase() === lowerVariation) {
          const value = row[key];
          if (value !== undefined && value !== null && value !== '') {
            const strValue = String(value).trim();
            if (strValue && strValue !== 'null' && strValue !== 'undefined' && strValue !== 'N/A' && strValue.length > 0) {
              return strValue;
            }
          }
        }
      }
      
      // Também tentar no data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const dataKeys = Object.keys(data);
        for (const key of dataKeys) {
          if (key.toLowerCase() === lowerVariation) {
            const value = data[key];
            if (value !== undefined && value !== null && value !== '') {
              const strValue = String(value).trim();
              if (strValue && strValue !== 'null' && strValue !== 'undefined' && strValue !== 'N/A' && strValue.length > 0) {
                return strValue;
              }
            }
          }
        }
      }
    }
    
    return null;
  };
  
  // OTIMIZAÇÃO: Processar todos os registros (já limitado a 50000 no loadOverview)
  let processedCount = 0;
  let fieldsFound = {
    status: 0,
    tema: 0,
    orgaos: 0,
    tipo: 0,
    canal: 0,
    prioridade: 0,
    unidade: 0,
    data: 0
  };
  
  // CORREÇÃO: Log detalhado do primeiro registro para debug
  if (rows.length > 0 && window.Logger) {
    const firstRow = rows[0];
    window.Logger.debug('🔍 ESTRUTURA DO PRIMEIRO REGISTRO FILTRADO:', {
      allKeys: Object.keys(firstRow),
      hasData: !!firstRow.data,
      dataKeys: firstRow.data ? Object.keys(firstRow.data) : [],
      // Testar TODOS os campos possíveis
      testStatus: getFieldValue(firstRow, 'status', ['Status', 'status_demanda', 'StatusDemanda', 'statusDemanda']),
      testTema: getFieldValue(firstRow, 'tema', ['Tema', 'categoria', 'Categoria']),
      testOrgaos: getFieldValue(firstRow, 'orgaos', ['orgao', 'Orgaos', 'secretaria', 'Secretaria']),
      testTipo: getFieldValue(firstRow, 'tipoDeManifestacao', ['tipo', 'Tipo', 'tipo_de_manifestacao']),
      testCanal: getFieldValue(firstRow, 'canal', ['Canal']),
      testPrioridade: getFieldValue(firstRow, 'prioridade', ['Prioridade']),
      testUnidade: getFieldValue(firstRow, 'unidadeCadastro', ['unidade_cadastro', 'UnidadeCadastro', 'UAC']),
      testData: getFieldValue(firstRow, 'dataCriacaoIso', ['dataDaCriacao', 'dataCriacao', 'Data']),
      // Valores diretos (para comparação)
      direct: {
        status: firstRow.status,
        tema: firstRow.tema,
        orgaos: firstRow.orgaos,
        tipo: firstRow.tipoDeManifestacao,
        canal: firstRow.canal,
        prioridade: firstRow.prioridade,
        unidade: firstRow.unidadeCadastro,
        dataCriacaoIso: firstRow.dataCriacaoIso
      },
      // Valores em data (para comparação)
      inData: firstRow.data ? {
        status: firstRow.data.status,
        tema: firstRow.data.tema,
        orgaos: firstRow.data.orgaos,
        tipo: firstRow.data.tipoDeManifestacao,
        canal: firstRow.data.canal,
        prioridade: firstRow.data.prioridade,
        unidade: firstRow.data.unidadeCadastro
      } : null
    });
  }
  
  for (const row of rows) {
    processedCount++;
    
    // CORREÇÃO CRÍTICA: Usar getFieldValue para TODOS os campos
    // Isso garante que encontramos os dados independente de onde estejam
    
    // Status - usar getFieldValue com todas as variações possíveis
    const status = getFieldValue(row, 'status', [
      'Status', 'status_demanda', 'StatusDemanda', 'statusDemanda', 
      'situacao', 'Situacao', 'situação', 'Situação'
    ]);
    if (status) {
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
      fieldsFound.status++;
    }
    
    // Tema - usar getFieldValue
    const theme = getFieldValue(row, 'tema', [
      'Tema', 'categoria', 'Categoria', 'assunto', 'Assunto'
    ]);
    if (theme) {
      themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
      fieldsFound.tema++;
    }
    
    // Órgãos - usar getFieldValue
    const organ = getFieldValue(row, 'orgaos', [
      'orgao', 'Orgaos', 'Orgao', 'secretaria', 'Secretaria',
      'orgaoResponsavel', 'OrgaoResponsavel', 'orgão', 'Órgão'
    ]);
    if (organ) {
      organMap.set(organ, (organMap.get(organ) || 0) + 1);
      fieldsFound.orgaos++;
    }
    
    // Tipo - usar getFieldValue
    const type = getFieldValue(row, 'tipoDeManifestacao', [
      'tipo', 'Tipo', 'tipo_de_manifestacao', 'TipoDeManifestacao',
      'tipoManifestacao', 'TipoManifestacao', 'tipo_manifestacao'
    ]);
    if (type) {
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
      fieldsFound.tipo++;
    }
    
    // Canal - usar getFieldValue
    const channel = getFieldValue(row, 'canal', [
      'Canal', 'canalAtendimento', 'CanalAtendimento',
      'canalEntrada', 'CanalEntrada'
    ]);
    if (channel) {
      channelMap.set(channel, (channelMap.get(channel) || 0) + 1);
      fieldsFound.canal++;
    }
    
    // Prioridade - usar getFieldValue
    const priority = getFieldValue(row, 'prioridade', [
      'Prioridade', 'prioridadeDemanda', 'PrioridadeDemanda'
    ]);
    if (priority) {
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
      fieldsFound.prioridade++;
    }
    
    // Unidade - usar getFieldValue
    const unit = getFieldValue(row, 'unidadeCadastro', [
      'unidade_cadastro', 'UnidadeCadastro', 'UAC', 'uac',
      'unidade', 'Unidade', 'unidadeAtendimento', 'UnidadeAtendimento'
    ]);
    if (unit) {
      unitMap.set(unit, (unitMap.get(unit) || 0) + 1);
      fieldsFound.unidade++;
    }
    
    // Log de progresso a cada 1000 registros
    if (processedCount % 1000 === 0 && window.Logger) {
      window.Logger.debug(`📊 Processando registro ${processedCount}/${rows.length}`, {
        fieldsFound: {
          status: fieldsFound.status,
          tema: fieldsFound.tema,
          orgaos: fieldsFound.orgaos,
          tipo: fieldsFound.tipo,
          canal: fieldsFound.canal,
          prioridade: fieldsFound.prioridade,
          unidade: fieldsFound.unidade,
          data: fieldsFound.data
        },
        mapsSize: {
          status: statusMap.size,
          theme: themeMap.size,
          organ: organMap.size,
          type: typeMap.size,
          channel: channelMap.size,
          priority: priorityMap.size,
          unit: unitMap.size,
          month: monthMap.size,
          day: dayMap.size
        }
      });
    }
    
    // Data - usar getFieldValue para buscar data de criação
    const dataCriacao = getFieldValue(row, 'dataCriacaoIso', [
      'dataDaCriacao', 
      'data_da_criacao', 
      'dataCriacao',
      'DataCriacao',
      'Data',
      'data',
      'DataDaCriacao',
      'Data_Criacao'
    ]);
    
    // Se não encontrou, tentar usar getDataCriacao do sistema global
    let finalDataCriacao = dataCriacao;
    if (!finalDataCriacao && window.getDataCriacao) {
      finalDataCriacao = window.getDataCriacao(row);
    }
    
    if (finalDataCriacao) {
      fieldsFound.data++;
      // Normalizar formato de data
      let dateStr = String(finalDataCriacao).trim();
      
      // Se for string sem T, adicionar T00:00:00
      if (typeof finalDataCriacao === 'string') {
        // Remover espaços extras
        dateStr = dateStr.trim();
        
        // Se não tem T e não tem Z, adicionar T00:00:00
        if (!dateStr.includes('T') && !dateStr.includes('Z')) {
          dateStr = dateStr + 'T00:00:00';
        }
        
        // Se tem formato YYYY-MM-DD HH:mm:ss, converter para ISO
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
          dateStr = dateStr.replace(' ', 'T');
        }
      }
      
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Por mês
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        
        // Por dia (usar formato YYYY-MM-DD)
        const dayKey = date.toISOString().slice(0, 10);
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
        
        // Últimos 7 e 30 dias
        if (date >= last7Days) last7Count++;
        if (date >= last30Days) last30Count++;
      } else if (window.Logger) {
        // Log apenas se não conseguir parsear (para debug)
        window.Logger.debug('⚠️ aggregateFilteredData: Não foi possível parsear data:', {
          original: dataCriacao,
          normalized: dateStr,
          sampleRow: { id: row.id, hasData: !!row.data }
        });
      }
    }
  }
  
  // Converter maps em arrays
  const manifestationsByStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({ 
      status, 
      count,
      _id: status // Adicionar alias '_id' para compatibilidade
    }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByTheme = Array.from(themeMap.entries())
    .map(([theme, count]) => ({ 
      theme, 
      count,
      _id: theme // Adicionar alias '_id' para compatibilidade
    }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByOrgan = Array.from(organMap.entries())
    .map(([organ, count]) => ({ 
      organ, 
      count,
      _id: organ // Adicionar alias '_id' para compatibilidade
    }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByChannel = Array.from(channelMap.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByPriority = Array.from(priorityMap.entries())
    .map(([priority, count]) => ({ priority, count }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByUnit = Array.from(unitMap.entries())
    .map(([unit, count]) => ({ unit, count }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByMonth = Array.from(monthMap.entries())
    .map(([month, count]) => ({ 
      month, 
      count,
      ym: month, // Adicionar alias 'ym' para compatibilidade
      _id: month // Adicionar alias '_id' para compatibilidade
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  const manifestationsByDay = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Garantir apenas últimos 30 dias
  
  // Debug: verificar se há dados diários
  if (window.Logger && manifestationsByDay.length === 0 && rows.length > 0) {
    const sampleRow = rows[0];
    window.Logger.debug('⚠️ aggregateFilteredData: Nenhum dado diário encontrado', {
      totalRows: rows.length,
      sampleRow: {
        id: sampleRow.id,
        hasData: !!sampleRow.data,
        dataKeys: sampleRow.data ? Object.keys(sampleRow.data).slice(0, 10) : [],
        hasDataDaCriacao: !!(sampleRow.dataDaCriacao || sampleRow.data?.dataDaCriacao),
        hasDataCriacaoIso: !!(sampleRow.dataCriacaoIso || sampleRow.data?.dataCriacaoIso)
      }
    });
  }
  
  // IMPORTANTE: Garantir que todas as variáveis estão definidas
  // Se alguma variável não foi definida (erro anterior), criar arrays vazios
  const safeManifestationsByStatus = typeof manifestationsByStatus !== 'undefined' ? manifestationsByStatus : [];
  const safeManifestationsByTheme = typeof manifestationsByTheme !== 'undefined' ? manifestationsByTheme : [];
  const safeManifestationsByOrgan = typeof manifestationsByOrgan !== 'undefined' ? manifestationsByOrgan : [];
  const safeManifestationsByType = typeof manifestationsByType !== 'undefined' ? manifestationsByType : [];
  const safeManifestationsByChannel = typeof manifestationsByChannel !== 'undefined' ? manifestationsByChannel : [];
  const safeManifestationsByPriority = typeof manifestationsByPriority !== 'undefined' ? manifestationsByPriority : [];
  const safeManifestationsByUnit = typeof manifestationsByUnit !== 'undefined' ? manifestationsByUnit : [];
  const safeManifestationsByMonth = typeof manifestationsByMonth !== 'undefined' ? manifestationsByMonth : [];
  const safeManifestationsByDay = typeof manifestationsByDay !== 'undefined' ? manifestationsByDay : [];
  
  // IMPORTANTE: Garantir que todos os arrays existem
  const result = {
    totalManifestations: rows.length || 0,
    last7Days: last7Count || 0,
    last30Days: last30Count || 0,
    manifestationsByMonth: safeManifestationsByMonth,
    manifestationsByDay: safeManifestationsByDay,
    manifestationsByStatus: safeManifestationsByStatus,
    manifestationsByTheme: safeManifestationsByTheme,
    manifestationsByOrgan: safeManifestationsByOrgan,
    manifestationsByType: safeManifestationsByType,
    manifestationsByChannel: safeManifestationsByChannel,
    manifestationsByPriority: safeManifestationsByPriority,
    manifestationsByUnit: safeManifestationsByUnit
  };
  
  // Validar que o objeto está completo
  if (!result.totalManifestations && result.totalManifestations !== 0) {
    result.totalManifestations = rows.length || 0;
  }
  
  // Garantir que todas as propriedades existem
  if (!Array.isArray(result.manifestationsByStatus)) result.manifestationsByStatus = [];
  if (!Array.isArray(result.manifestationsByTheme)) result.manifestationsByTheme = [];
  if (!Array.isArray(result.manifestationsByOrgan)) result.manifestationsByOrgan = [];
  if (!Array.isArray(result.manifestationsByType)) result.manifestationsByType = [];
  if (!Array.isArray(result.manifestationsByChannel)) result.manifestationsByChannel = [];
  if (!Array.isArray(result.manifestationsByPriority)) result.manifestationsByPriority = [];
  if (!Array.isArray(result.manifestationsByUnit)) result.manifestationsByUnit = [];
  if (!Array.isArray(result.manifestationsByMonth)) result.manifestationsByMonth = [];
  if (!Array.isArray(result.manifestationsByDay)) result.manifestationsByDay = [];
  
  if (window.Logger) {
    window.Logger.debug('📊 aggregateFilteredData: Agregação concluída', {
      totalRows: rows.length,
      processedCount: processedCount,
      total: result.totalManifestations,
      last7Days: result.last7Days,
      last30Days: result.last30Days,
      byStatus: result.manifestationsByStatus.length,
      byMonth: result.manifestationsByMonth.length,
      byDay: result.manifestationsByDay.length,
      byTheme: result.manifestationsByTheme.length,
      byOrgan: result.manifestationsByOrgan.length,
      byType: result.manifestationsByType.length,
      byChannel: result.manifestationsByChannel.length,
      byPriority: result.manifestationsByPriority.length,
      byUnit: result.manifestationsByUnit.length,
      // Contadores de campos encontrados (de TODOS os registros processados)
      fieldsFound: fieldsFound,
      fieldsFoundPercent: {
        status: rows.length > 0 ? ((fieldsFound.status / rows.length) * 100).toFixed(1) + '%' : '0%',
        tema: rows.length > 0 ? ((fieldsFound.tema / rows.length) * 100).toFixed(1) + '%' : '0%',
        orgaos: rows.length > 0 ? ((fieldsFound.orgaos / rows.length) * 100).toFixed(1) + '%' : '0%',
        tipo: rows.length > 0 ? ((fieldsFound.tipo / rows.length) * 100).toFixed(1) + '%' : '0%',
        canal: rows.length > 0 ? ((fieldsFound.canal / rows.length) * 100).toFixed(1) + '%' : '0%',
        prioridade: rows.length > 0 ? ((fieldsFound.prioridade / rows.length) * 100).toFixed(1) + '%' : '0%',
        unidade: rows.length > 0 ? ((fieldsFound.unidade / rows.length) * 100).toFixed(1) + '%' : '0%',
        data: rows.length > 0 ? ((fieldsFound.data / rows.length) * 100).toFixed(1) + '%' : '0%'
      },
      // Tamanhos dos Maps (quantos valores únicos foram encontrados)
      mapsSize: {
        status: statusMap.size,
        theme: themeMap.size,
        organ: organMap.size,
        type: typeMap.size,
        channel: channelMap.size,
        priority: priorityMap.size,
        unit: unitMap.size,
        month: monthMap.size,
        day: dayMap.size
      },
      // Amostras dos primeiros itens
      sampleStatus: result.manifestationsByStatus[0],
      sampleTheme: result.manifestationsByTheme[0],
      sampleOrgan: result.manifestationsByOrgan[0],
      sampleType: result.manifestationsByType[0],
      sampleChannel: result.manifestationsByChannel[0],
      samplePriority: result.manifestationsByPriority[0],
      sampleMonth: result.manifestationsByMonth[0],
      sampleDay: result.manifestationsByDay[0],
      // Top 3 de cada categoria
      top3Status: result.manifestationsByStatus.slice(0, 3),
      top3Theme: result.manifestationsByTheme.slice(0, 3),
      top3Organ: result.manifestationsByOrgan.slice(0, 3)
    });
    
    // Se não há dados agregados mas há registros, avisar com detalhes
    if (rows.length > 0 && 
        result.manifestationsByStatus.length === 0 && 
        result.manifestationsByTheme.length === 0 &&
        result.manifestationsByOrgan.length === 0) {
      const sampleRow = rows[0];
      window.Logger.error('❌ ERRO CRÍTICO: aggregateFilteredData não encontrou campos nos dados!', {
        totalRows: rows.length,
        fieldsFound: fieldsFound,
        fieldsFoundPercent: rows.length > 0 ? {
          status: ((fieldsFound.status / rows.length) * 100).toFixed(1) + '%',
          tema: ((fieldsFound.tema / rows.length) * 100).toFixed(1) + '%',
          orgaos: ((fieldsFound.orgaos / rows.length) * 100).toFixed(1) + '%',
          tipo: ((fieldsFound.tipo / rows.length) * 100).toFixed(1) + '%',
          canal: ((fieldsFound.canal / rows.length) * 100).toFixed(1) + '%',
          prioridade: ((fieldsFound.prioridade / rows.length) * 100).toFixed(1) + '%',
          unidade: ((fieldsFound.unidade / rows.length) * 100).toFixed(1) + '%',
          data: ((fieldsFound.data / rows.length) * 100).toFixed(1) + '%'
        } : {},
        sampleRowKeys: Object.keys(sampleRow).slice(0, 30),
        hasData: !!sampleRow.data,
        dataKeys: sampleRow.data ? Object.keys(sampleRow.data).slice(0, 30) : [],
        // Testar campos diretamente
        statusDirect: sampleRow.status,
        statusData: sampleRow.data?.status,
        temaDirect: sampleRow.tema,
        temaData: sampleRow.data?.tema,
        orgaosDirect: sampleRow.orgaos,
        orgaosData: sampleRow.data?.orgaos,
        tipoDirect: sampleRow.tipoDeManifestacao,
        tipoData: sampleRow.data?.tipoDeManifestacao,
        canalDirect: sampleRow.canal,
        canalData: sampleRow.data?.canal,
        prioridadeDirect: sampleRow.prioridade,
        prioridadeData: sampleRow.data?.prioridade,
        unidadeDirect: sampleRow.unidadeCadastro,
        unidadeData: sampleRow.data?.unidadeCadastro,
        // Testar getFieldValue no primeiro registro
        testGetFieldValue: {
          status: getFieldValue(sampleRow, 'status', ['Status', 'status_demanda', 'StatusDemanda', 'statusDemanda']),
          tema: getFieldValue(sampleRow, 'tema', ['Tema', 'categoria', 'Categoria']),
          orgaos: getFieldValue(sampleRow, 'orgaos', ['orgao', 'Orgaos', 'secretaria', 'Secretaria']),
          tipo: getFieldValue(sampleRow, 'tipoDeManifestacao', ['tipo', 'Tipo', 'tipo_de_manifestacao']),
          canal: getFieldValue(sampleRow, 'canal', ['Canal']),
          prioridade: getFieldValue(sampleRow, 'prioridade', ['Prioridade']),
          unidade: getFieldValue(sampleRow, 'unidadeCadastro', ['unidade_cadastro', 'UnidadeCadastro', 'UAC'])
        }
      });
    } else if (rows.length > 0 && window.Logger) {
      // Log de sucesso com resumo
      window.Logger.success('✅ aggregateFilteredData: Agregação bem-sucedida!', {
        totalRows: rows.length,
        totalManifestations: result.totalManifestations,
        agregações: {
          status: result.manifestationsByStatus.length,
          tema: result.manifestationsByTheme.length,
          orgaos: result.manifestationsByOrgan.length,
          tipo: result.manifestationsByType.length,
          canal: result.manifestationsByChannel.length,
          prioridade: result.manifestationsByPriority.length,
          unidade: result.manifestationsByUnit.length,
          mes: result.manifestationsByMonth.length,
          dia: result.manifestationsByDay.length
        },
        camposEncontrados: {
          status: fieldsFound.status + ' (' + ((fieldsFound.status / rows.length) * 100).toFixed(1) + '%)',
          tema: fieldsFound.tema + ' (' + ((fieldsFound.tema / rows.length) * 100).toFixed(1) + '%)',
          orgaos: fieldsFound.orgaos + ' (' + ((fieldsFound.orgaos / rows.length) * 100).toFixed(1) + '%)',
          tipo: fieldsFound.tipo + ' (' + ((fieldsFound.tipo / rows.length) * 100).toFixed(1) + '%)',
          canal: fieldsFound.canal + ' (' + ((fieldsFound.canal / rows.length) * 100).toFixed(1) + '%)',
          prioridade: fieldsFound.prioridade + ' (' + ((fieldsFound.prioridade / rows.length) * 100).toFixed(1) + '%)',
          unidade: fieldsFound.unidade + ' (' + ((fieldsFound.unidade / rows.length) * 100).toFixed(1) + '%)',
          data: fieldsFound.data + ' (' + ((fieldsFound.data / rows.length) * 100).toFixed(1) + '%)'
        }
      });
    }
  }
  
    // IMPORTANTE: Garantir que o objeto está completo antes de retornar
    // Validar TODAS as propriedades antes de retornar
    const finalResult = {
      totalManifestations: result.totalManifestations || rows.length || 0,
      last7Days: result.last7Days || 0,
      last30Days: result.last30Days || 0,
      manifestationsByMonth: Array.isArray(result.manifestationsByMonth) ? result.manifestationsByMonth : [],
      manifestationsByDay: Array.isArray(result.manifestationsByDay) ? result.manifestationsByDay : [],
      manifestationsByStatus: Array.isArray(result.manifestationsByStatus) ? result.manifestationsByStatus : [],
      manifestationsByTheme: Array.isArray(result.manifestationsByTheme) ? result.manifestationsByTheme : [],
      manifestationsByOrgan: Array.isArray(result.manifestationsByOrgan) ? result.manifestationsByOrgan : [],
      manifestationsByType: Array.isArray(result.manifestationsByType) ? result.manifestationsByType : [],
      manifestationsByChannel: Array.isArray(result.manifestationsByChannel) ? result.manifestationsByChannel : [],
      manifestationsByPriority: Array.isArray(result.manifestationsByPriority) ? result.manifestationsByPriority : [],
      manifestationsByUnit: Array.isArray(result.manifestationsByUnit) ? result.manifestationsByUnit : []
    };
    
    // VALIDAÇÃO FINAL: Garantir que todos os arrays têm pelo menos a estrutura correta
    if (finalResult.manifestationsByStatus.length === 0 && fieldsFound.status > 0) {
      if (window.Logger) {
        window.Logger.warn('⚠️ statusMap tem dados mas manifestationsByStatus está vazio!', {
          statusMapSize: statusMap.size,
          fieldsFoundStatus: fieldsFound.status
        });
      }
    }
    
    if (window.Logger) {
      window.Logger.debug('📊 aggregateFilteredData: Retornando resultado FINAL', {
        hasTotal: 'totalManifestations' in finalResult,
        totalValue: finalResult.totalManifestations,
        resultKeys: Object.keys(finalResult),
        resultKeysCount: Object.keys(finalResult).length,
        resultType: typeof finalResult,
        allKeys: Object.keys(finalResult).join(', '),
        byStatus: finalResult.manifestationsByStatus.length,
        byTheme: finalResult.manifestationsByTheme.length,
        byOrgan: finalResult.manifestationsByOrgan.length,
        byType: finalResult.manifestationsByType.length,
        byChannel: finalResult.manifestationsByChannel.length,
        byPriority: finalResult.manifestationsByPriority.length,
        byUnit: finalResult.manifestationsByUnit.length,
        byMonth: finalResult.manifestationsByMonth.length,
        byDay: finalResult.manifestationsByDay.length,
        // Verificar se os maps têm dados
        mapsHaveData: {
          status: statusMap.size > 0,
          theme: themeMap.size > 0,
          organ: organMap.size > 0,
          type: typeMap.size > 0,
          channel: channelMap.size > 0,
          priority: priorityMap.size > 0,
          unit: unitMap.size > 0,
          month: monthMap.size > 0,
          day: dayMap.size > 0
        },
        // Amostras dos primeiros itens de cada array
        samples: {
          status: finalResult.manifestationsByStatus[0],
          theme: finalResult.manifestationsByTheme[0],
          organ: finalResult.manifestationsByOrgan[0],
          type: finalResult.manifestationsByType[0],
          channel: finalResult.manifestationsByChannel[0],
          priority: finalResult.manifestationsByPriority[0],
          unit: finalResult.manifestationsByUnit[0],
          month: finalResult.manifestationsByMonth[0],
          day: finalResult.manifestationsByDay[0]
        }
      });
    }
    
    return finalResult;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('❌ ERRO CRÍTICO em aggregateFilteredData:', {
        error: error.message,
        stack: error.stack,
        rowsCount: rows?.length || 0
      });
    }
    
    // Retornar estrutura vazia em caso de erro
    return {
      totalManifestations: rows?.length || 0,
      last7Days: 0,
      last30Days: 0,
      manifestationsByMonth: [],
      manifestationsByDay: [],
      manifestationsByStatus: [],
      manifestationsByTheme: [],
      manifestationsByOrgan: [],
      manifestationsByType: [],
      manifestationsByChannel: [],
      manifestationsByPriority: [],
      manifestationsByUnit: []
    };
  }
}

// CORREÇÃO CRÍTICA: Exportar função imediatamente após definição
// Garantir que está disponível quando o listener for executado
if (typeof window !== 'undefined') {
  // Atualizar função real - SEMPRE sobrescrever
  window._aggregateFilteredDataReal = aggregateFilteredData;
  window.aggregateFilteredData = aggregateFilteredData;
  
  // CORREÇÃO: Garantir que não há stub interferindo
  if (window.aggregateFilteredData !== aggregateFilteredData) {
    window.aggregateFilteredData = aggregateFilteredData;
  }
  
  if (window.Logger) {
    window.Logger.debug('✅ aggregateFilteredData exportada para window', {
      functionType: typeof window.aggregateFilteredData,
      isFunction: typeof window.aggregateFilteredData === 'function',
      hasRealFunction: typeof window._aggregateFilteredDataReal === 'function',
      functionsMatch: window.aggregateFilteredData === aggregateFilteredData,
      realFunctionMatches: window._aggregateFilteredDataReal === aggregateFilteredData
    });
  }
}

/**
 * Renderizar banner de filtros ativos (Crossfilter)
 */
function renderCrossfilterBanner() {
  if (!window.crossfilterOverview) return;
  
  const pageMain = document.getElementById('page-main');
  if (!pageMain) return;
  
  // Remover banner existente
  const existingBanner = document.getElementById('crossfilter-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
  
  const activeCount = window.crossfilterOverview.getActiveFilterCount();
  if (activeCount === 0) return;
  
  const filters = window.crossfilterOverview.filters;
  
  // Criar banner
  const banner = document.createElement('section');
  banner.id = 'crossfilter-banner';
  banner.className = 'glass rounded-2xl p-4 mb-6';
  banner.style.cssText = 'background: rgba(34, 211, 238, 0.1); border-left: 4px solid #22d3ee;';
  
  // Criar estrutura do banner
  const bannerContent = document.createElement('div');
  bannerContent.style.cssText = 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;';
  
  const pillsContainer = document.createElement('div');
  pillsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;';
  
  const title = document.createElement('strong');
  title.style.cssText = 'color: #22d3ee; font-size: 1.1rem;';
  title.textContent = `Filtros Ativos (${activeCount}):`;
  pillsContainer.appendChild(title);
  
  // Criar pill para cada filtro ativo
  Object.entries(filters).forEach(([field, value]) => {
    if (value) {
      const emoji = window.crossfilterOverview.getFieldEmoji(field);
      const label = window.crossfilterOverview.getFieldLabel(field);
      
      const pill = document.createElement('span');
      pill.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm';
      pill.style.cssText = 'background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(34, 211, 238, 0.3);';
      
      const labelEl = document.createElement('strong');
      labelEl.style.color = '#22d3ee';
      labelEl.textContent = `${label}: `;
      
      const valueEl = document.createElement('span');
      valueEl.style.color = '#e2e8f0';
      valueEl.textContent = value;
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.style.cssText = 'background: transparent; border: none; cursor: pointer; padding: 0; color: #94a3b8; margin-left: 4px; font-size: 16px; line-height: 1;';
      removeBtn.title = 'Remover filtro';
      removeBtn.addEventListener('click', () => {
        window.crossfilterOverview.filters[field] = null;
        window.crossfilterOverview.notifyListeners();
      });
      
      pill.appendChild(labelEl);
      pill.appendChild(valueEl);
      pill.appendChild(removeBtn);
      pillsContainer.appendChild(pill);
    }
  });
  
  const clearAllBtn = document.createElement('button');
  clearAllBtn.textContent = 'Limpar Todos';
  clearAllBtn.style.cssText = 'padding: 0.5rem 1rem; background: #22d3ee; color: #0b1020; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.9rem;';
  clearAllBtn.title = 'Limpar todos os filtros';
  clearAllBtn.addEventListener('click', () => {
    window.crossfilterOverview.clearAllFilters();
    window.crossfilterOverview.notifyListeners();
  });
  
  bannerContent.appendChild(pillsContainer);
  bannerContent.appendChild(clearAllBtn);
  banner.appendChild(bannerContent);
  
  // Inserir banner após o header
  const header = pageMain.querySelector('header');
  if (header) {
    header.insertAdjacentElement('afterend', banner);
  } else {
    pageMain.insertBefore(banner, pageMain.firstChild);
  }
}

/**
 * Inicializar listeners de eventos de filtro
 * CROSSFILTER: Agora usa sistema de crossfilter inteligente
 */
function initOverviewFilterListeners() {
  if (window.Logger) {
    window.Logger.debug('✅ Listeners de crossfilter inicializados - Overview com filtros inteligentes');
  }
  
  // CROSSFILTER: Não usar chartCommunication, usar crossfilterOverview
  return;
}

// Exportar função globalmente
window.loadOverview = loadOverview;
window.initOverviewFilterListeners = initOverviewFilterListeners;

// Inicializar listeners quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que chartCommunication está disponível
    setTimeout(() => {
      initOverviewFilterListeners();
    }, 500);
  });
} else {
  // DOM já está pronto
  setTimeout(() => {
    initOverviewFilterListeners();
  }, 500);
}

if (window.Logger) {
  window.Logger.debug('✅ Página Overview carregada');
}


