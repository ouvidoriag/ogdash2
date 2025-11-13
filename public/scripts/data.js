/**
 * Data Module - Funções de carregamento de dados
 * Centraliza todas as funções load*() que buscam e renderizam dados
 */

// DEBUG: Log para verificar se data.js está sendo executado
if (typeof window !== 'undefined') {
  if (window.Logger) {
    window.Logger.debug('🔍 data.js: Iniciando execução do script...');
  } else {
    console.log('🔍 data.js: Iniciando execução do script...');
  }
}

// NOTA: currentTableData e currentTableHeaders foram movidos para data-tables.js
// Usar window.data.currentTableData e window.data.currentTableHeaders

/**
 * Sistema de Cache Genérico para funções load*
 * NOTA: Cache principal foi movido para data-utils.js
 * Estas funções são mantidas apenas para compatibilidade retroativa
 * Usar window.data.getCachedData, window.data.setCachedData, etc.
 */
// CORREÇÃO CRÍTICA: functionCache foi completamente removido de data.js
// Agora está apenas em data-utils.js para evitar declaração duplicada

function getCachedData(functionName, ttl = 5000) {
  // Delegar para data-utils se disponível
  if (window.data && typeof window.data.getCachedData === 'function') {
    return window.data.getCachedData(functionName, ttl);
  }
  return null;
}

function setCachedData(functionName, data) {
  // Delegar para data-utils se disponível
  if (window.data && typeof window.data.setCachedData === 'function') {
    return window.data.setCachedData(functionName, data);
  }
}

function clearCache(functionName = null) {
  // Delegar para data-utils se disponível
  if (window.data && typeof window.data.clearCache === 'function') {
    return window.data.clearCache(functionName);
  }
}

/**
 * Sistema de Proteção contra Execuções Simultâneas
 * NOTA: runningPromises foi movido para data-utils.js para evitar duplicação
 * Esta função delega para data-utils se disponível
 */
function getOrCreatePromise(functionName, promiseFactory) {
  // Delegar para data-utils se disponível
  if (window.data && typeof window.data.getOrCreatePromise === 'function') {
    return window.data.getOrCreatePromise(functionName, promiseFactory);
  }
  
  // Fallback: implementação simples sem cache compartilhado
  return promiseFactory();
}

/**
 * Helper genérico para otimizar funções load*
 * Aplica cache e Promise compartilhada automaticamente
 */
function createOptimizedLoader(functionName, loaderFn, defaultTtl = 5000) {
  return async function(forceRefresh = false, ...args) {
    // Verificar cache
    if (!forceRefresh) {
      const cached = getCachedData(functionName, defaultTtl);
      if (cached !== null) {
        return cached;
      }
    }
    
    // Usar Promise compartilhada
    return getOrCreatePromise(functionName, async () => {
      try {
        const result = await loaderFn(...args);
        setCachedData(functionName, result);
        return result;
      } catch (e) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, e);
        } else {
          console.error(`❌ Erro em ${functionName}:`, e);
        }
        throw e;
      }
    });
  };
}

/**
 * Recarregar todos os dados
 */
async function reloadAllData() {
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
  const currentPage = document.querySelector('[data-page].active')?.getAttribute('data-page') || 'main';
  
  // Recarregar dados da página principal
  if (currentPage === 'main' || currentPage === '') {
    if (window.data?.loadOverview) {
      await window.data.loadOverview();
    }
  }
  
  // Recarregar dados específicos da página atual
  const pageLoaders = {
    'orgao-mes': () => window.data?.loadOrgaoMes?.(),
    'tempo-medio': () => window.data?.loadTempoMedio?.(),
    'tema': () => window.data?.loadTema?.(),
    'assunto': () => window.data?.loadAssunto?.(),
    'cadastrante': () => window.data?.loadCadastrante?.(),
    'reclamacoes': () => window.data?.loadReclamacoes?.(),
    'projecao-2026': () => window.data?.loadProjecao2026?.(),
    'status': () => window.data?.loadStatusPage?.(),
    'bairro': () => window.data?.loadBairro?.(),
    'uac': () => window.data?.loadUAC?.(),
    'responsavel': () => window.data?.loadResponsavel?.(),
    'canal': () => window.data?.loadCanal?.(),
    'prioridade': () => window.data?.loadPrioridade?.(),
    'categoria': () => window.data?.loadCategoria?.()
  };
  
  const loader = pageLoaders[currentPage];
  if (loader) {
    await loader();
  }
  
  // Atualizar realces visuais após recarregar dados
  // FASE 2.2: Usar timerManager
  const highlightTimerId = window.timerManager 
    ? window.timerManager.setTimeout(() => {
        if (window.filters?.updateAllFilterHighlights) {
          window.filters.updateAllFilterHighlights();
        }
      }, 100, 'data-reload-highlights')
    : setTimeout(() => {
        if (window.filters?.updateAllFilterHighlights) {
          window.filters.updateAllFilterHighlights();
        }
      }, 100);
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao recarregar dados:', error);
    } else {
      console.error('❌ Erro ao recarregar dados:', error);
    }
    // Não quebrar a aplicação - apenas logar o erro
  }
}

/**
 * Carregar insights com IA
 */
async function loadAIInsights() {
  try {
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/ai/insights', { 
      fallback: null,
      timeout: 60000 // Timeout maior para IA
    }).catch((error) => {
      // Se erro 429 (quota excedida), usar fallback silenciosamente
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.warn('Quota do Gemini excedida, usando insights básicos');
        } else {
          console.warn('⚠️ Quota do Gemini excedida, usando insights básicos');
        }
        return { insights: [], geradoPorIA: false, erro: 'quota_excedida' };
      }
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Erro ao carregar insights:', error);
      } else {
        console.warn('⚠️ Erro ao carregar insights:', error);
      }
      return { insights: [], geradoPorIA: false };
    });
    
    const insightsAIBox = document.getElementById('insightsAIBox');
    if (!insightsAIBox) return;
    
    if (!data || !data.insights || data.insights.length === 0) {
      // Mensagem mais informativa se quota excedida
      if (data && data.erro === 'quota_excedida') {
        insightsAIBox.innerHTML = '<div class="text-center text-slate-400 py-4">Insights básicos disponíveis. Quota da IA temporariamente indisponível.</div>';
      } else {
        insightsAIBox.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum insight disponível no momento.</div>';
      }
      return;
    }
    
    const severidadeColors = {
      alta: 'border-red-500/50 bg-red-500/10',
      media: 'border-amber-500/50 bg-amber-500/10',
      baixa: 'border-blue-500/50 bg-blue-500/10'
    };
    
    const tipoIcons = {
      anomalia: '⚠️',
      tendencia: '📈',
      volume: '📊',
      tempo: '⏱️'
    };
    
    insightsAIBox.innerHTML = data.insights.map(insight => `
      <div class="glass rounded-xl p-4 border ${severidadeColors[insight.severidade] || 'border-white/10'} hover:border-white/20 transition-all">
        <div class="flex items-start gap-3">
          <div class="text-2xl">${tipoIcons[insight.tipo] || '💡'}</div>
          <div class="flex-1">
            <div class="font-semibold text-emerald-300 mb-2">${insight.insight}</div>
            <div class="text-sm text-slate-400 mt-2">
              <div class="font-medium text-cyan-300 mb-1">💡 Recomendação:</div>
              <div>${insight.recomendacao}</div>
            </div>
            ${data.geradoPorIA ? '<div class="text-xs text-slate-500 mt-2">✨ Gerado por IA</div>' : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar insights com IA:', error);
    } else {
      console.error('❌ Erro ao carregar insights com IA:', error);
    }
    const insightsAIBox = document.getElementById('insightsAIBox');
    if (insightsAIBox) {
      insightsAIBox.innerHTML = '<div class="text-center text-red-400 py-4">Erro ao carregar insights. Tente novamente.</div>';
    }
  }
}

/**
 * Carregar Status Overview
 */
async function loadStatusOverview(summaryData = null) {
  try {
    // OTIMIZADO: Tentar usar dados do summary se disponível (evita requisição duplicada)
    let statusData = null;
    
    if (summaryData && summaryData.statusCounts) {
      // Construir statusData a partir do summary para evitar requisição extra
      const total = summaryData.total || 0;
      const statusCounts = summaryData.statusCounts || [];
      
      // Mapear statusCounts para formato esperado
      const concluida = statusCounts.find(s => (s.status || s.key || '').toLowerCase().includes('conclu'));
      const emAtendimento = statusCounts.find(s => (s.status || s.key || '').toLowerCase().includes('atendimento') || (s.status || s.key || '').toLowerCase().includes('andamento'));
      const pendente = statusCounts.find(s => (s.status || s.key || '').toLowerCase().includes('pendente'));
      
      statusData = {
        total: total,
        concluida: concluida ? { quantidade: concluida.count || concluida.quantidade || 0, percentual: total > 0 ? ((concluida.count || concluida.quantidade || 0) / total * 100).toFixed(1) : 0 } : { quantidade: 0, percentual: 0 },
        emAtendimento: emAtendimento ? { quantidade: emAtendimento.count || emAtendimento.quantidade || 0, percentual: total > 0 ? ((emAtendimento.count || emAtendimento.quantidade || 0) / total * 100).toFixed(1) : 0 } : { quantidade: 0, percentual: 0 },
        pendente: pendente ? { quantidade: pendente.count || pendente.quantidade || 0, percentual: total > 0 ? ((pendente.count || pendente.quantidade || 0) / total * 100).toFixed(1) : 0 } : { quantidade: 0, percentual: 0 }
      };
    } else {
      // Fallback: usar sistema global de carregamento apenas se summary não disponível
      statusData = await window.dataLoader?.load('/api/stats/status-overview', { fallback: null }) || null;
    }
    
    const statusCards = document.getElementById('statusOverviewCards');
    if (!statusCards) return;
    
    if (!statusData || (!statusData.total && !statusData.total?.quantidade)) {
      statusCards.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado disponível</div>';
      return;
    }
    
    // Compatibilidade: aceitar tanto total como número quanto como objeto
    const totalQuantidade = typeof statusData.total === 'number' 
      ? statusData.total 
      : (statusData.total?.quantidade || 0);
    
    const cards = [
      {
        label: 'Total',
        value: totalQuantidade,
        color: 'cyan',
        icon: '📊'
      },
      {
        label: 'Concluídas',
        value: statusData.concluida?.quantidade || 0,
        percent: statusData.concluida?.percentual || 0,
        color: 'emerald',
        icon: '✅'
      },
      {
        label: 'Em Atendimento',
        value: statusData.emAtendimento?.quantidade || 0,
        percent: statusData.emAtendimento?.percentual || 0,
        color: 'amber',
        icon: '⏳'
      },
      {
        label: 'Pendentes',
        value: statusData.pendente?.quantidade || 0,
        percent: statusData.pendente?.percentual || 0,
        color: 'rose',
        icon: '📋'
      }
    ];
    
    const colorClasses = {
      cyan: { border: 'border-cyan-500/20', borderHover: 'hover:border-cyan-500/40', text: 'text-cyan-300' },
      emerald: { border: 'border-emerald-500/20', borderHover: 'hover:border-emerald-500/40', text: 'text-emerald-300' },
      amber: { border: 'border-amber-500/20', borderHover: 'hover:border-amber-500/40', text: 'text-amber-300' },
      rose: { border: 'border-rose-500/20', borderHover: 'hover:border-rose-500/40', text: 'text-rose-300' }
    };
    
    statusCards.innerHTML = cards.map(card => {
      const colors = colorClasses[card.color] || colorClasses.cyan;
      const filterFieldMap = {
        'Total': null,
        'Concluídas': 'Status',
        'Em Atendimento': 'Status',
        'Pendentes': 'Status'
      };
      const filterField = filterFieldMap[card.label];
      const canFilter = filterField !== null;
      
      const isActive = window.globalFilters?.filters?.some(f => f.field === filterField && f.value === card.label) || false;
      const cardId = `status-card-${card.label.replace(/\s+/g, '-').toLowerCase()}`;
      
      return `
        <div id="${cardId}" class="glass rounded-xl p-4 border ${colors.border} ${colors.borderHover} transition-all">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs text-slate-400 font-medium">${card.label}</div>
            <div class="flex items-center gap-2">
              <div class="text-xl">${card.icon}</div>
            </div>
          </div>
          <div class="text-2xl font-bold ${colors.text}">${(card.value || 0).toLocaleString('pt-BR')}</div>
          ${card.percent !== undefined && card.percent !== null ? `<div class="text-xs text-slate-400 mt-1">${Number(card.percent).toFixed(1)}%</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Status Overview:', error);
    } else {
      console.error('❌ Erro ao carregar Status Overview:', error);
    }
    const statusCards = document.getElementById('statusOverviewCards');
    if (statusCards) {
      statusCards.innerHTML = '<div class="text-center text-red-400 py-4">Erro ao carregar dados</div>';
    }
  }
}

/**
 * Carregar tabela de registros
 */
async function loadTable(limit = 50) {
  try {
    const pageSize = limit === 'all' ? 10000 : parseInt(limit) || 50;
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load(`/api/records?page=1&pageSize=${pageSize}`, { fallback: { rows: [], total: 0 } }) || { rows: [], total: 0 };
    const rows = data.rows || [];
    // Atualizar via window.data (gerenciado por data-tables.js)
    if (window.data && typeof window.data.currentTableData !== 'undefined') {
      window.data.currentTableData = rows;
    }
    
    const tbody = document.getElementById('tbody');
    const thead = document.getElementById('thead');
    const tableInfo = document.getElementById('tableInfo');
    
    if (!tbody || !thead) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Elementos da tabela não encontrados (pode não estar na página atual)');
      } else {
        console.warn('Elementos da tabela não encontrados (pode não estar na página atual)');
      }
      return;
    }
    
    tbody.innerHTML = '';
    thead.innerHTML = '';
      
    if (rows.length === 0) {
      if (tableInfo) tableInfo.textContent = 'Nenhum registro encontrado';
      return;
    }
      
    const first = rows[0].data || {};
    const keys = Object.keys(first);
    // Atualizar via window.data (gerenciado por data-tables.js)
    if (window.data && typeof window.data.currentTableHeaders !== 'undefined') {
      window.data.currentTableHeaders = keys;
    }
      
    // Ordenar colunas por importância
    const priorityOrder = ['protocolo', 'data_da_criacao', 'status_demanda', 'tipo_de_manifestacao', 
      'tema', 'assunto', 'orgaos', 'unidade_cadastro', 'responsavel', 'canal', 'prioridade', 'status'];
    const sortedKeys = [...priorityOrder.filter(k => keys.includes(k)), ...keys.filter(k => !priorityOrder.includes(k))];
      
    for (const k of sortedKeys) {
      const th = document.createElement('th'); 
      th.textContent = k; 
      th.className = 'px-3 py-2 text-left font-semibold text-slate-300 sticky top-0 bg-slate-900/95'; 
      thead.appendChild(th);
    }
      
    for (const r of rows) {
      const tr = document.createElement('tr'); 
      tr.className = 'hover:bg-white/5 transition-colors duration-100';
      for (const k of sortedKeys) {
        const td = document.createElement('td'); 
        const value = r.data?.[k] ?? '';
        td.textContent = value; 
        td.className = 'px-3 py-2 text-slate-300'; 
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
      
    if (tableInfo) {
      tableInfo.textContent = `Mostrando ${rows.length} de ${data.total || rows.length} registros`;
    }
  } catch (error) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar tabela:', error);
    } else {
      console.error('Erro ao carregar tabela:', error);
    }
    const tableInfo = document.getElementById('tableInfo');
    if (tableInfo) {
      tableInfo.textContent = 'Erro ao carregar dados';
    }
  }
}

/**
 * Carregar KPIs com dados já obtidos (evita requisições duplicadas)
 */
async function loadKpisWithData(sum, dailyData, byMonth = null) {
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
  // Se byMonth não foi fornecido, buscar (para compatibilidade)
  if (!byMonth) {
    byMonth = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
  }
  
  // CORREÇÃO: Renderizar IMEDIATAMENTE quando dados chegarem
  // Não esperar pela função - renderizar diretamente primeiro
    const kpiTotalEl = document.getElementById('kpiTotal');
    const kpi7El = document.getElementById('kpi7');
    const kpi30El = document.getElementById('kpi30');
    
  // DEBUG: Verificar se elementos existem
  if (!kpiTotalEl || !kpi7El || !kpi30El) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.warn('loadKpisWithData: Elementos KPI não encontrados:', { 
        kpiTotal: !!kpiTotalEl, 
        kpi7: !!kpi7El, 
        kpi30: !!kpi30El,
        sum: !!sum,
        sumTotal: sum?.total
      });
    } else {
      console.warn('⚠️ loadKpisWithData: Elementos KPI não encontrados:', {
        kpiTotal: !!kpiTotalEl,
        kpi7: !!kpi7El,
        kpi30: !!kpi30El,
        sum: !!sum,
        sumTotal: sum?.total
      });
    }
  }
  
  // CORREÇÃO: Verificar se página está visível antes de renderizar
  const pageMain = document.getElementById('page-main');
  const isPageVisible = pageMain && pageMain.style.display !== 'none';
  
  if (!isPageVisible) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.warn('loadKpisWithData: Página main não está visível');
    } else {
      console.warn('⚠️ loadKpisWithData: Página main não está visível');
    }
    return;
  }
  
  // Renderizar imediatamente (sem esperar)
  // CORREÇÃO: Forçar atualização visual e verificar se valores são válidos
  if (kpiTotalEl && sum && (sum.total !== undefined && sum.total !== null)) {
    const totalValue = (sum.total ?? 0).toLocaleString('pt-BR');
    kpiTotalEl.textContent = totalValue;
    // Forçar atualização visual
    kpiTotalEl.style.display = '';
    kpiTotalEl.offsetHeight; // Trigger reflow
    // FASE 2.1: Usar Logger (apenas em debug)
    if (window.Logger) {
      window.Logger.debug('loadKpisWithData: KPI Total renderizado:', totalValue);
    } else {
      console.log('✅ loadKpisWithData: KPI Total renderizado:', totalValue, 'Elemento:', kpiTotalEl);
    }
  }
  if (kpi7El && sum && (sum.last7 !== undefined && sum.last7 !== null)) {
    const last7Value = (sum.last7 ?? 0).toLocaleString('pt-BR');
    kpi7El.textContent = last7Value;
    kpi7El.style.display = '';
    kpi7El.offsetHeight; // Trigger reflow
    // FASE 2.1: Usar Logger (apenas em debug)
    if (window.Logger) {
      window.Logger.debug('loadKpisWithData: KPI 7 dias renderizado:', last7Value);
    } else {
      console.log('✅ loadKpisWithData: KPI 7 dias renderizado:', last7Value, 'Elemento:', kpi7El);
    }
  }
  if (kpi30El && sum && (sum.last30 !== undefined && sum.last30 !== null)) {
    const last30Value = (sum.last30 ?? 0).toLocaleString('pt-BR');
    kpi30El.textContent = last30Value;
    kpi30El.style.display = '';
    kpi30El.offsetHeight; // Trigger reflow
    // FASE 2.1: Usar Logger (apenas em debug)
    if (window.Logger) {
      window.Logger.debug('loadKpisWithData: KPI 30 dias renderizado:', last30Value);
    } else {
      console.log('✅ loadKpisWithData: KPI 30 dias renderizado:', last30Value, 'Elemento:', kpi30El);
    }
  }
  
  // Se a função completa estiver disponível, chamar ela para renderização completa (gráficos, etc)
  // Mas não esperar - já renderizamos os números básicos acima
  // CORREÇÃO: Adicionar pequeno delay para garantir que renderização básica foi aplicada
  // FASE 2.2: Usar timerManager
  const renderTimerId = window.timerManager 
    ? window.timerManager.setTimeout(() => {
        if (typeof window.renderKpisImplementation === 'function') {
          // Chamar em background - não bloquear
          window.renderKpisImplementation(sum, dailyData, byMonth).catch((e) => {
            // FASE 2.1: Usar Logger
            if (window.Logger) {
              window.Logger.warn('Erro ao renderizar KPIs completos via loadKpisWithData (não crítico):', e);
            } else {
              console.warn('⚠️ Erro ao renderizar KPIs completos via loadKpisWithData (não crítico):', e);
            }
          });
        } else if (window.data?.renderKpis) {
          // Usar wrapper do módulo (que também chama a implementação)
                window.data.renderKpis(sum, dailyData, byMonth).catch((e) => {
              // FASE 2.1: Usar Logger
              if (window.Logger) {
                window.Logger.warn('Erro ao renderizar KPIs via wrapper loadKpisWithData (não crítico):', e);
              } else {
                console.warn('⚠️ Erro ao renderizar KPIs via wrapper loadKpisWithData (não crítico):', e);
              }
            });
          }
        }, 100, 'loadKpisWithData-render')
      : setTimeout(() => {
          if (typeof window.renderKpisImplementation === 'function') {
            window.renderKpisImplementation(sum, dailyData, byMonth).catch((e) => {
              console.warn('⚠️ Erro ao renderizar KPIs completos via loadKpisWithData (não crítico):', e);
            });
          } else if (window.data?.renderKpis) {
            window.data.renderKpis(sum, dailyData, byMonth).catch((e) => {
              // FASE 2.1: Usar Logger
              if (window.Logger) {
                window.Logger.warn('Erro ao renderizar KPIs via wrapper loadKpisWithData (não crítico):', e);
              } else {
                console.warn('⚠️ Erro ao renderizar KPIs via wrapper loadKpisWithData (não crítico):', e);
              }
            });
          }
        }, 100);
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro com fallback
    console.error('❌ Erro ao carregar KPIs com dados:', error);
    // Renderizar valores padrão mesmo em caso de erro
  const kpiTotalEl = document.getElementById('kpiTotal');
  const kpi7El = document.getElementById('kpi7');
  const kpi30El = document.getElementById('kpi30');
    if (kpiTotalEl && sum) kpiTotalEl.textContent = (sum.total ?? 0).toLocaleString('pt-BR');
    if (kpi7El && sum) kpi7El.textContent = (sum.last7 ?? 0).toLocaleString('pt-BR');
    if (kpi30El && sum) kpi30El.textContent = (sum.last30 ?? 0).toLocaleString('pt-BR');
  }
}

/**
 * Renderizar KPIs (função wrapper que chama a implementação real do index.html)
 * IMPORTANTE: Evitar loop infinito - chamar diretamente a implementação
 */
async function renderKpis(sum, dailyData, byMonth) {
  // CORREÇÃO: Renderizar IMEDIATAMENTE quando dados chegarem
  // Não esperar pela função - renderizar diretamente primeiro
    const kpiTotalEl = document.getElementById('kpiTotal');
    const kpi7El = document.getElementById('kpi7');
    const kpi30El = document.getElementById('kpi30');
    
  // Renderizar imediatamente (sem esperar)
    if (kpiTotalEl && sum) {
      kpiTotalEl.textContent = (sum.total ?? 0).toLocaleString('pt-BR');
    }
    if (kpi7El && sum) {
      kpi7El.textContent = (sum.last7 ?? 0).toLocaleString('pt-BR');
    }
    if (kpi30El && sum) {
      kpi30El.textContent = (sum.last30 ?? 0).toLocaleString('pt-BR');
    }
  
  // Se a função completa estiver disponível, chamar ela para renderização completa (gráficos, etc)
  // Mas não esperar - já renderizamos os números básicos acima
  if (typeof window.renderKpisImplementation === 'function') {
    // Chamar em background - não bloquear
    return window.renderKpisImplementation(sum, dailyData, byMonth).catch(() => {});
  }
  
  // Se não estiver disponível, já renderizamos acima, então retornar
  return Promise.resolve();
}

/**
 * Carregar KPIs (busca dados)
 */
async function loadKpis(defaultCountField, defaultDateField) {
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
  // CORREÇÃO: Sempre usar sistema global (window.dataLoader)
  // O dataLoader já otimiza automaticamente
  console.log('📊 loadKpis: Usando sistema global (dataLoader)');
  
  const [sum, dailyData, byMonth] = await Promise.all([
    window.dataLoader?.load('/api/summary', { fallback: {} }) || {},
    window.dataLoader?.load('/api/aggregate/by-day', { fallback: [] }) || [],
    window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || []
  ]);
  
  // CORREÇÃO: Renderizar IMEDIATAMENTE quando dados chegarem
  // Não esperar pela função - renderizar diretamente primeiro, depois atualizar se função estiver disponível
    const kpiTotalEl = document.getElementById('kpiTotal');
    const kpi7El = document.getElementById('kpi7');
    const kpi30El = document.getElementById('kpi30');
    
  // DEBUG: Verificar se elementos existem
  if (!kpiTotalEl || !kpi7El || !kpi30El) {
    console.warn('⚠️ Elementos KPI não encontrados:', { 
      kpiTotal: !!kpiTotalEl, 
      kpi7: !!kpi7El, 
      kpi30: !!kpi30El,
      pageMain: !!document.getElementById('page-main'),
      pageMainVisible: document.getElementById('page-main')?.style.display !== 'none'
    });
  }
  
  // CORREÇÃO: Verificar se página está visível antes de renderizar
  const pageMain = document.getElementById('page-main');
  const isPageVisible = pageMain && pageMain.style.display !== 'none';
  
  console.log('🔍 loadKpis: Verificando visibilidade da página:', {
    pageMainExists: !!pageMain,
    isPageVisible,
    display: pageMain?.style.display,
    sumExists: !!sum,
    sumTotal: sum?.total,
    sumLast7: sum?.last7,
    sumLast30: sum?.last30
  });
  
  if (!isPageVisible) {
    console.warn('⚠️ Página main não está visível, aguardando...');
    // Aguardar um pouco e tentar novamente
    // FASE 2.2: Usar timerManager
    const retryTimerId = window.timerManager 
      ? window.timerManager.setTimeout(() => {
          const retryPageMain = document.getElementById('page-main');
          if (retryPageMain && retryPageMain.style.display !== 'none') {
            // FASE 2.1: Usar Logger
            if (window.Logger) {
              window.Logger.debug('Tentando renderizar novamente após página ficar visível');
            } else {
              console.log('🔄 Tentando renderizar novamente após página ficar visível');
            }
            loadKpis(defaultCountField, defaultDateField);
          }
        }, 500, 'loadKpis-retry')
      : setTimeout(() => {
          const retryPageMain = document.getElementById('page-main');
          if (retryPageMain && retryPageMain.style.display !== 'none') {
            loadKpis(defaultCountField, defaultDateField);
          }
        }, 500);
    return;
  }
  
  // Renderizar imediatamente (sem esperar)
  // CORREÇÃO: Forçar atualização visual e verificar se valores são válidos
  if (kpiTotalEl && sum && (sum.total !== undefined && sum.total !== null)) {
    const totalValue = (sum.total ?? 0).toLocaleString('pt-BR');
    kpiTotalEl.textContent = totalValue;
    // Forçar atualização visual
    kpiTotalEl.style.display = '';
    kpiTotalEl.offsetHeight; // Trigger reflow
    console.log('✅ KPI Total renderizado:', totalValue, 'Elemento:', kpiTotalEl);
  }
  if (kpi7El && sum && (sum.last7 !== undefined && sum.last7 !== null)) {
    const last7Value = (sum.last7 ?? 0).toLocaleString('pt-BR');
    kpi7El.textContent = last7Value;
    kpi7El.style.display = '';
    kpi7El.offsetHeight; // Trigger reflow
    console.log('✅ KPI 7 dias renderizado:', last7Value, 'Elemento:', kpi7El);
  }
  if (kpi30El && sum && (sum.last30 !== undefined && sum.last30 !== null)) {
    const last30Value = (sum.last30 ?? 0).toLocaleString('pt-BR');
    kpi30El.textContent = last30Value;
    kpi30El.style.display = '';
    kpi30El.offsetHeight; // Trigger reflow
    console.log('✅ KPI 30 dias renderizado:', last30Value, 'Elemento:', kpi30El);
  }
  
  // Se a função completa estiver disponível, chamar ela para renderização completa (gráficos, etc)
  // Mas não esperar - já renderizamos os números básicos acima
  // CORREÇÃO: Adicionar pequeno delay para garantir que renderização básica foi aplicada
  // FASE 2.2: Usar timerManager
  const renderTimerId2 = window.timerManager 
    ? window.timerManager.setTimeout(() => {
        if (typeof window.renderKpisImplementation === 'function') {
          // Chamar em background - não bloquear
          window.renderKpisImplementation(sum, dailyData, byMonth).catch((e) => {
            // FASE 2.1: Usar Logger
            if (window.Logger) {
              window.Logger.warn('Erro ao renderizar KPIs completos (não crítico):', e);
            } else {
              console.warn('⚠️ Erro ao renderizar KPIs completos (não crítico):', e);
            }
          });
        } else if (window.data?.renderKpis) {
          // Usar wrapper do módulo (que também chama a implementação)
                window.data.renderKpis(sum, dailyData, byMonth).catch((e) => {
              // FASE 2.1: Usar Logger
              if (window.Logger) {
                window.Logger.warn('Erro ao renderizar KPIs via wrapper (não crítico):', e);
              } else {
                console.warn('⚠️ Erro ao renderizar KPIs via wrapper (não crítico):', e);
              }
            });
          }
        }, 100, 'loadKpis-render')
      : setTimeout(() => {
          if (typeof window.renderKpisImplementation === 'function') {
            window.renderKpisImplementation(sum, dailyData, byMonth).catch((e) => {
              // FASE 2.1: Usar Logger
            if (window.Logger) {
              window.Logger.warn('Erro ao renderizar KPIs completos (não crítico):', e);
            } else {
              console.warn('⚠️ Erro ao renderizar KPIs completos (não crítico):', e);
            }
            });
          } else if (window.data?.renderKpis) {
            window.data.renderKpis(sum, dailyData, byMonth).catch((e) => {
              // FASE 2.1: Usar Logger
              if (window.Logger) {
                window.Logger.warn('Erro ao renderizar KPIs via wrapper (não crítico):', e);
              } else {
                console.warn('⚠️ Erro ao renderizar KPIs via wrapper (não crítico):', e);
              }
            });
          }
        }, 100);
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro com fallback
    console.error('❌ Erro ao carregar KPIs:', error);
    // Renderizar valores padrão mesmo em caso de erro
    const kpiTotalEl = document.getElementById('kpiTotal');
    const kpi7El = document.getElementById('kpi7');
    const kpi30El = document.getElementById('kpi30');
    if (kpiTotalEl) kpiTotalEl.textContent = '0';
    if (kpi7El) kpi7El.textContent = '0';
    if (kpi30El) kpi30El.textContent = '0';
  }
}

/**
 * Função auxiliar: Desenhar sparkline
 */
function drawSpark(canvasId, data, color) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  const w = c.width || c.offsetWidth;
  const h = c.height || 32;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1 || 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = h - (v / max) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

/**
 * Função auxiliar: Desenhar sparkline para dados diários
 */
function drawSparkDaily(canvasId, data, color) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  const w = c.width || c.offsetWidth;
  const h = c.height || 32;
  const max = Math.max(...data.map(d => d.count || 0), 1);
  const step = w / (data.length - 1 || 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = i * step;
    const y = h - ((d.count || 0) / max) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// Proteção contra múltiplas execuções simultâneas - OTIMIZADO: Usa Promise compartilhada
let loadOverviewPromise = null;

// Cache simples de resultados (TTL de 5 segundos)
const overviewCache = {
  data: null,
  timestamp: 0,
  ttl: 5000 // 5 segundos
};

/**
 * Carregar Visão Geral completa (Overview)
 * OTIMIZADO: Promise compartilhada, cache, consolidação de requisições
 */
async function loadOverview(forceRefresh = false) {
  // Proteção contra múltiplas execuções simultâneas - reutilizar Promise existente
  if (loadOverviewPromise && !forceRefresh) {
    return loadOverviewPromise;
  }
  
  // Verificar cache antes de fazer requisições
  if (!forceRefresh && overviewCache.data && (Date.now() - overviewCache.timestamp) < overviewCache.ttl) {
    const { summary, byMonth, orgaos, temas, dailyData } = overviewCache.data;
    // Renderizar com dados em cache (sem fazer requisições)
    await renderOverviewData(summary, byMonth, orgaos, temas, dailyData);
    return;
  }
  
  // Criar nova Promise compartilhada
  loadOverviewPromise = (async () => {
    try {
      // Verificar se a página está visível
      const overviewPage = document.getElementById('page-main') || document.querySelector('[data-page="main"]');
      if (!overviewPage || overviewPage.style.display === 'none') {
        // Não logar warning em produção - apenas retornar silenciosamente
        return;
      }
      
      // OTIMIZADO: Carregar todos os dados essenciais em paralelo
      // O dataLoader já faz deduplicação, então múltiplas chamadas são seguras
      const results = await Promise.allSettled([
        window.dataLoader?.load('/api/summary', { 
          fallback: { total: 0, last7: 0, last30: 0, statusCounts: [] },
          timeout: 30000 // Reduzido de 60s para 30s
        }) || Promise.resolve({ total: 0, last7: 0, last30: 0, statusCounts: [] }),
        window.dataLoader?.load('/api/aggregate/by-month', { 
          fallback: [],
          timeout: 30000
        }) || Promise.resolve([]),
        window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', { 
          fallback: [],
          timeout: 30000
        }) || Promise.resolve([]),
        window.dataLoader?.load('/api/aggregate/by-theme', { 
          fallback: [],
          timeout: 30000
        }) || Promise.resolve([]),
        window.dataLoader?.load('/api/aggregate/by-day', { 
          fallback: [],
          timeout: 30000
        }) || Promise.resolve([])
      ]);
    
      // Extrair dados dos resultados (usar fallback se falhou)
      const summary = results[0].status === 'fulfilled' ? results[0].value : { total: 0, last7: 0, last30: 0, statusCounts: [] };
      const byMonth = results[1].status === 'fulfilled' ? results[1].value : [];
      const orgaos = results[2].status === 'fulfilled' ? results[2].value : [];
      const temas = results[3].status === 'fulfilled' ? results[3].value : [];
      const dailyData = results[4].status === 'fulfilled' ? results[4].value : [];
      
      // Salvar no cache
      overviewCache.data = { summary, byMonth, orgaos, temas, dailyData };
      overviewCache.timestamp = Date.now();
      
      // Renderizar dados
      await renderOverviewData(summary, byMonth, orgaos, temas, dailyData);
    } catch (e) {
      console.error('❌ Erro ao carregar Visão Geral:', e);
      throw e;
    } finally {
      // Limpar Promise compartilhada após conclusão
      loadOverviewPromise = null;
    }
  })();
  
  return loadOverviewPromise;
}

/**
 * Renderizar dados da visão geral (extraído para reutilização com cache)
 */
async function renderOverviewData(summary, byMonth, orgaos, temas, dailyData) {
  try {
    // Carregar KPIs com dados já obtidos (evita requisição duplicada)
    await loadKpisWithData(summary, dailyData, byMonth);
    
    // Guardar summary para reutilizar (garantir estrutura correta)
    let summaryData = summary;
    
    // CORREÇÃO: Garantir que summaryData tem statusCounts
    if (!summaryData.statusCounts && summary.statusCounts) {
      summaryData.statusCounts = summary.statusCounts;
    }

    // Processar dados de tendência mensal
    const labels = byMonth && byMonth.length > 0 ? byMonth.map(x => {
      const ym = x.ym || x.month || '';
      // OTIMIZADO: Usar dateUtils centralizado
      return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
    }) : [];
    const values = byMonth && byMonth.length > 0 ? byMonth.map(x => x.count || 0) : [];
    
    // Dados processados (sem log em produção)
    
    // Gráfico de tendência (otimizado)
    if (window.chartTrend instanceof Chart) window.chartTrend.destroy();
    const chartTrendEl = document.getElementById('chartTrend');
    if (chartTrendEl) {
      const ctxTrend = chartTrendEl.getContext('2d');
    if (ctxTrend) {
        if (labels.length === 0 || values.length === 0) {
          // CORREÇÃO: Não mostrar aviso se dados ainda estão sendo carregados
          // Apenas criar gráfico vazio silenciosamente
          if (byMonth && Array.isArray(byMonth) && byMonth.length === 0) {
            // Dados foram carregados mas estão vazios - criar gráfico vazio
          window.chartTrend = new Chart(ctxTrend, {
            type: 'line',
            data: { labels: ['Sem dados'], datasets: [{ label: 'Manifestações', data: [0], borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.1)' }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } } }
          });
          }
          // Se byMonth é null/undefined, dados ainda estão carregando - não criar gráfico ainda
          return;
        } else {
      const gradientFn = window.utils?.gradient || (() => 'rgba(34,211,238,0.35)');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
          // OTIMIZAÇÃO: Criar gradiente antes e usar requestAnimationFrame
          const gradientBg = typeof gradientFn === 'function' ? gradientFn(ctxTrend, 'rgba(34,211,238,0.35)', 'rgba(34,211,238,0.05)') : 'rgba(34,211,238,0.35)';
          
          requestAnimationFrame(() => {
            try {
      window.chartTrend = new Chart(ctxTrend, {
        type: 'line',
        data: { labels, datasets: [{
            label: 'Manifestações',
            data: values,
            fill: true,
            borderColor: '#22d3ee',
                    backgroundColor: gradientBg,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
          }]},
        options: {
          responsive: true,
                  animation: false, // Desabilitar animação para melhor performance
                  maintainAspectRatio: true,
          plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: { display: false } },
          scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } }
        }
      });
      addClickFn(window.chartTrend, (label, value) => showFeedbackFn(null, label, value), 'chartTrend');
            } catch (error) {
              console.error('❌ Erro ao criar gráfico de tendência:', error);
            }
          });
        }
      } else {
        console.warn('⚠️ Contexto chartTrend não encontrado');
      }
    } else {
      console.warn('⚠️ Elemento chartTrend não encontrado no DOM');
    }

    // Top Órgãos (otimizado)
    const orgLabels = orgaos.slice(0, 10).map(x => x.key);
    const orgValues = orgaos.slice(0, 10).map(x => x.count);
    if (window.chartTopOrgaos instanceof Chart) window.chartTopOrgaos.destroy();
    const chartTopOrgaosEl = document.getElementById('chartTopOrgaos');
    if (chartTopOrgaosEl && orgLabels.length > 0 && orgValues.length > 0) {
      const ctxOrg = chartTopOrgaosEl.getContext('2d');
    if (ctxOrg) {
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
        // OTIMIZAÇÃO: Usar requestAnimationFrame
        requestAnimationFrame(() => {
          try {
      window.chartTopOrgaos = new Chart(ctxOrg, {
        type: 'bar',
        data: { labels: orgLabels, datasets: [{ data: orgValues, backgroundColor: 'rgba(167,139,250,0.7)', borderColor: 'rgba(167,139,250,1)', borderWidth: 1 }] },
              options: { 
                responsive: true, 
                animation: false, // Desabilitar animação
                maintainAspectRatio: true,
                indexAxis: 'y', 
                plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
                scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
              }
      });
      addClickFn(window.chartTopOrgaos, (label, value) => showFeedbackFn(null, label, value), 'chartTopOrgaos');
          } catch (error) {
            console.error('❌ Erro ao criar gráfico Top Órgãos:', error);
          }
        });
      }
    } else {
      if (!orgaos || orgaos.length === 0) {
        console.warn('⚠️ Elemento chartTopOrgaos não encontrado ou sem dados - banco pode estar vazio');
      } else {
        console.warn('⚠️ Elemento chartTopOrgaos não encontrado no DOM');
      }
    }

    // Top Temas (otimizado)
    const temaLabels = temas.slice(0, 10).map(x => x.tema);
    const temaValues = temas.slice(0, 10).map(x => x.quantidade);
    if (window.chartTopTemas instanceof Chart) window.chartTopTemas.destroy();
    const chartTopTemasEl = document.getElementById('chartTopTemas');
    if (chartTopTemasEl && temaLabels.length > 0 && temaValues.length > 0) {
      const ctxTemas = chartTopTemasEl.getContext('2d');
    if (ctxTemas) {
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
        // OTIMIZAÇÃO: Usar requestAnimationFrame
        requestAnimationFrame(() => {
          try {
      window.chartTopTemas = new Chart(ctxTemas, {
        type: 'bar',
        data: { labels: temaLabels, datasets: [{ data: temaValues, backgroundColor: 'rgba(34,211,238,0.7)', borderColor: 'rgba(34,211,238,1)', borderWidth: 1 }] },
              options: { 
                responsive: true, 
                animation: false, // Desabilitar animação
                maintainAspectRatio: true,
                indexAxis: 'y', 
                plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
                scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
              }
      });
      addClickFn(window.chartTopTemas, (label, value) => showFeedbackFn(null, label, value), 'chartTopTemas');
          } catch (error) {
            console.error('❌ Erro ao criar gráfico Top Temas:', error);
          }
        });
      }
    } else {
      if (!temas || temas.length === 0) {
        console.warn('⚠️ Elemento chartTopTemas não encontrado ou sem dados - banco pode estar vazio');
      } else {
        console.warn('⚠️ Elemento chartTopTemas não encontrado no DOM');
      }
    }

    // Funil por status (reutiliza summary já carregado)
    // CORREÇÃO: Garantir que statusCounts existe e tem estrutura correta
    const statusCounts = (summaryData?.statusCounts || summary?.statusCounts || []).slice(0, 6);
    const funilLabels = statusCounts.map(s => s.status || s.key || 'Não informado');
    const funilValues = statusCounts.map(s => s.count || s.quantidade || 0);
    if (window.chartFunnelStatus instanceof Chart) window.chartFunnelStatus.destroy();
    const chartFunnelStatusEl = document.getElementById('chartFunnelStatus');
    if (chartFunnelStatusEl && funilLabels.length > 0 && funilValues.length > 0) {
      const ctxFunnel = chartFunnelStatusEl.getContext('2d');
    if (ctxFunnel) {
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
        // OTIMIZAÇÃO: Usar requestAnimationFrame
        requestAnimationFrame(() => {
          try {
      window.chartFunnelStatus = new Chart(ctxFunnel, {
        type: 'bar',
        data: { labels: funilLabels, datasets: [{ data: funilValues, backgroundColor: ['#22d3ee','#a78bfa','#34d399','#f59e0b','#fb7185','#e879f9'] }] },
              options: { 
                responsive: true, 
                animation: false, // Desabilitar animação
                maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
                scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } } 
              }
      });
      addClickFn(window.chartFunnelStatus, (label, value) => showFeedbackFn(null, label, value), 'chartFunnelStatus');
          } catch (error) {
            console.error('❌ Erro ao criar gráfico Funil Status:', error);
          }
        });
      }
    } else {
      if (!statusCounts || statusCounts.length === 0) {
        console.warn('⚠️ Elemento chartFunnelStatus não encontrado ou sem dados - banco pode estar vazio');
      } else {
        console.warn('⚠️ Elemento chartFunnelStatus não encontrado no DOM');
      }
    }

    // Sparks e deltas rápidos usando byMonth
    const totalNow = values[values.length-1] || 0;
    const totalPrev = values[values.length-2] || 0;
    const delta = totalPrev ? (((totalNow-totalPrev)/totalPrev)*100).toFixed(1) : 0;
    const deltaEl = document.getElementById('kpiTotalDelta');
    if (deltaEl) deltaEl.textContent = `${delta>=0?'+':''}${delta}% vs mês anterior`;

    // Desenhar sparkline
    drawSpark('sparkTotal', values.slice(-12), '#22d3ee');

    // Carregar insights com IA e Status Overview em PARALELO (não bloquear se falhar)
    // OTIMIZADO: Passar summary para loadStatusOverview evitar requisição duplicada
    Promise.allSettled([
      loadAIInsights().catch(e => console.warn('Erro ao carregar insights:', e)),
      loadStatusOverview(summaryData).catch(e => console.warn('Erro ao carregar status overview:', e))
    ]).catch(() => {}); // Ignorar erros, já tratados individualmente
    
    // Insights básicos (fallback)
    const insights = [];
    if (orgaos.length) insights.push(`Maior volume: ${orgaos[0].key} (${orgaos[0].count.toLocaleString('pt-BR')}).`);
    const upIdx = values.length>2 ? values[values.length-1] - values[values.length-2] : 0;
    if (upIdx>0) insights.push(`Crescimento de ${upIdx.toLocaleString('pt-BR')} em relação ao mês anterior.`);
    
    // Buscar dados adicionais para insights básicos (em background, não bloquear)
    // CORREÇÃO: Usar sistema global de carregamento (window.dataLoader)
    Promise.allSettled([
      window.dataLoader?.load('/api/aggregate/by-subject', { fallback: [] }) || Promise.resolve([]),
      window.dataLoader?.load('/api/aggregate/count-by?field=UAC', { fallback: [] }) || Promise.resolve([]),
      window.dataLoader?.load('/api/stats/average-time/stats', { fallback: null }) || Promise.resolve(null)
    ]).then((results) => {
      const assuntos = results[0].status === 'fulfilled' ? results[0].value : [];
      const unidades = results[1].status === 'fulfilled' ? results[1].value : [];
      const tempoMedioStats = results[2].status === 'fulfilled' ? results[2].value : null;
      if (assuntos.length > 0) {
        insights.push(`Assunto mais frequente: ${assuntos[0].assunto} (${assuntos[0].quantidade.toLocaleString('pt-BR')}).`);
      }
      if (unidades.length > 0) {
        insights.push(`Unidade de cadastro com maior volume: ${unidades[0].key} (${unidades[0].count.toLocaleString('pt-BR')}).`);
      }
      if (tempoMedioStats && tempoMedioStats.media) {
        insights.push(`Tempo Médio de Resposta global: ${tempoMedioStats.media.toFixed(1)} dias.`);
      }
      
      const insightsBox = document.getElementById('insightsBox');
      if (insightsBox) {
        insightsBox.innerHTML = insights.length ? insights.map(t=>`<div class="text-slate-400">• ${t}</div>`).join('') : '<div class="text-slate-500">Sem insights básicos no momento.</div>';
      }
    });
    
    // Exibir insights iniciais enquanto carrega os adicionais
    const insightsBox = document.getElementById('insightsBox');
    if (insightsBox) {
      insightsBox.innerHTML = insights.length ? insights.map(t=>`<div>• ${t}</div>`).join('') : '<div class="text-slate-500">Carregando insights...</div>';
    }

    // Heatmap dinâmico - configurar listener se não existir
    const dimSel = document.getElementById('heatmapDim');
    if (dimSel) {
      // Remover listeners antigos para evitar duplicação
      const newDimSel = dimSel.cloneNode(true);
      dimSel.parentNode.replaceChild(newDimSel, dimSel);
      
      // Adicionar listener para carregar heatmap quando dimensão mudar
      newDimSel.addEventListener('change', async function() {
        const dim = this.value || 'Categoria';
        const heatmapContainer = document.getElementById('heatmap');
        if (!heatmapContainer) return;
        
        try {
          heatmapContainer.innerHTML = '<div class="p-4 text-center text-slate-400">Carregando heatmap...</div>';
          const hm = await window.dataLoader?.load(`/api/aggregate/heatmap?dim=${dim}`, { 
            fallback: { labels: [], rows: [] },
            timeout: 30000
          }) || { labels: [], rows: [] };
          
          buildHeatmap('heatmap', hm.labels || [], hm.rows || []);
        } catch (error) {
          console.error('❌ Erro ao carregar heatmap:', error);
          heatmapContainer.innerHTML = '<div class="p-4 text-center text-red-400">Erro ao carregar heatmap</div>';
        }
      });
      
      // Disparar evento inicial para carregar com dimensão padrão
      newDimSel.dispatchEvent(new Event('change'));
    }
    
    // Carregar novos gráficos avançados (reutilizar temas e orgaos já carregados)
    await loadAdvancedCharts(temas, orgaos);
  } catch (e) {
    console.error('❌ Erro ao renderizar dados da visão geral:', e);
  }
}

async function fetchDataFromServer() {
}

/**
 * Carregar gráficos avançados (Sankey, TreeMap, Mapa)
 */
async function loadAdvancedCharts(temas = null, orgaos = null) {
  try {
    // CORREÇÃO: Usar sistema global de carregamento (window.dataLoader)
    // O dataLoader já otimiza automaticamente
    // Se temas e orgaos já foram carregados, reutilizar (evita requisições duplicadas)
    const results = await Promise.allSettled([
      temas ? Promise.resolve(temas) : (window.dataLoader?.load('/api/aggregate/by-theme', { fallback: [] }) || Promise.resolve([])),
      orgaos ? Promise.resolve(orgaos) : (window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', { fallback: [] }) || Promise.resolve([])),
      window.dataLoader?.load('/api/aggregate/count-by?field=status', { fallback: [] }) || Promise.resolve([]),
      window.dataLoader?.load('/api/aggregate/count-by?field=Bairro', { fallback: [] }) || Promise.resolve([])
    ]);
    
    const temasData = results[0].status === 'fulfilled' ? results[0].value : (temas || []);
    const orgaosData = results[1].status === 'fulfilled' ? results[1].value : (orgaos || []);
    const status = results[2].status === 'fulfilled' ? results[2].value : [];
    const bairros = results[3].status === 'fulfilled' ? results[3].value : [];
    
    const temasFinal = temasData || temas;
    const orgaosFinal = orgaosData || orgaos;
    
    // 1. Sankey Diagram: Tema → Órgão → Status
    await loadSankeyChart(temasFinal, orgaosFinal, status);
    
    // 2. TreeMap: Proporção por Categoria
    await loadTreeMapChart(temasFinal);
    
    // 3. Mapa de Calor Geográfico: Bairros
    await loadGeographicMap(bairros);
  } catch (error) {
    console.error('❌ Erro ao carregar gráficos avançados:', error);
  }
}

/**
 * Criar Sankey Diagram
 */
async function loadSankeyChart(temas, orgaos, status) {
  try {
    const container = document.getElementById('sankeyChart');
    if (!container) {
      console.warn('⚠️ Elemento sankeyChart não encontrado');
      return;
    }
    
    if (typeof Plotly === 'undefined') {
      console.warn('⚠️ Plotly.js não carregado');
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Plotly.js não está disponível</div>';
      return;
    }
    
    // CORREÇÃO: Usar sistema global de carregamento
    let flowData = null;
    try {
      flowData = await window.dataLoader?.load('/api/aggregate/sankey-flow', {
        fallback: null,
        timeout: 30000
      }) || null;
    } catch (e) {
      // Ignorar erro silenciosamente
      console.warn('⚠️ Erro ao carregar dados Sankey:', e);
    }
    
    if (!flowData || !flowData.nodes || !flowData.links) {
      // Fallback: usar dados agregados
      const topTemas = temas.slice(0, 5);
      const topOrgaos = orgaos.slice(0, 5);
      const topStatus = status.slice(0, 3);
      
      const labels = [
        ...topTemas.map(t => t.tema || 'Não informado'),
        ...topOrgaos.map(o => o.key || 'Não informado'),
        ...topStatus.map(s => s.key || 'Não informado')
      ];
      
      const temaIndices = topTemas.map((_, i) => i);
      const orgaoIndices = topOrgaos.map((_, i) => topTemas.length + i);
      const statusIndices = topStatus.map((_, i) => topTemas.length + topOrgaos.length + i);
      
      const source = [];
      const target = [];
      const value = [];
      
      topTemas.forEach((tema, tIdx) => {
        topOrgaos.forEach((orgao, oIdx) => {
          source.push(temaIndices[tIdx]);
          target.push(orgaoIndices[oIdx]);
          value.push(Math.round((tema.quantidade || 0) * (orgao.count || 0) / 1000));
        });
      });
      
      topOrgaos.forEach((orgao, oIdx) => {
        topStatus.forEach((st, sIdx) => {
          source.push(orgaoIndices[oIdx]);
          target.push(statusIndices[sIdx]);
          value.push(Math.round((orgao.count || 0) * (st.count || 0) / 1000));
        });
      });
      
      const data = [{
        type: 'sankey',
        node: {
          pad: 15,
          thickness: 20,
          line: { color: '#0f172a', width: 0.5 },
          label: labels,
          color: [
            ...topTemas.map(() => '#22d3ee'),
            ...topOrgaos.map(() => '#a78bfa'),
            ...topStatus.map(() => '#34d399')
          ]
        },
        link: {
          source: source,
          target: target,
          value: value,
          color: ['rgba(34,211,238,0.4)']
        }
      }];
      
      const layout = {
        title: '',
        font: { color: '#94a3b8', size: 12 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent'
      };
      
      const containerEl = document.getElementById('sankeyChart');
      if (containerEl) {
        Plotly.newPlot(containerEl, data, layout, { responsive: true, displayModeBar: false });
        console.log('✅ Gráfico Sankey criado (fallback)');
      }
      return;
    }
    
    // Usar dados reais do backend
    const allNodes = [
      ...flowData.nodes.temas,
      ...flowData.nodes.orgaos,
      ...flowData.nodes.statuses
    ];
    
    const nodeMap = new Map();
    allNodes.forEach((node, idx) => {
      nodeMap.set(node, idx);
    });
    
    const source = [];
    const target = [];
    const value = [];
    
    flowData.links.forEach(link => {
      const srcIdx = nodeMap.get(link.source);
      const tgtIdx = nodeMap.get(link.target);
      if (srcIdx !== undefined && tgtIdx !== undefined) {
        source.push(srcIdx);
        target.push(tgtIdx);
        value.push(link.value);
      }
    });
    
    const nodeColors = [
      ...flowData.nodes.temas.map(() => '#22d3ee'),
      ...flowData.nodes.orgaos.map(() => '#a78bfa'),
      ...flowData.nodes.statuses.map(() => '#34d399')
    ];
    
    const data = [{
      type: 'sankey',
      node: {
        pad: 15,
        thickness: 20,
        line: { color: '#0f172a', width: 0.5 },
        label: allNodes,
        color: nodeColors
      },
      link: {
        source: source,
        target: target,
        value: value,
        color: ['rgba(34,211,238,0.4)']
      }
    }];
    
    const layout = {
      title: '',
      font: { color: '#94a3b8', size: 12 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent'
    };
    
    const containerEl = document.getElementById('sankeyChart');
    if (containerEl) {
      Plotly.newPlot(containerEl, data, layout, { responsive: true, displayModeBar: false });
      console.log('✅ Gráfico Sankey criado (dados reais)');
    }
  } catch (error) {
    console.error('❌ Erro ao criar Sankey:', error);
    const container = document.getElementById('sankeyChart');
    if (container) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Erro ao carregar gráfico Sankey</div>';
    }
  }
}

/**
 * Criar TreeMap
 */
async function loadTreeMapChart(temas) {
  try {
    const container = document.getElementById('treemapChart');
    if (!container) {
      console.warn('⚠️ Elemento treemapChart não encontrado');
      return;
    }
    
    if (typeof Plotly === 'undefined') {
      console.warn('⚠️ Plotly.js não carregado');
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Plotly.js não está disponível</div>';
      return;
    }
    
    if (!temas || temas.length === 0) {
      console.warn('⚠️ Sem dados de temas para TreeMap');
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Sem dados disponíveis</div>';
      return;
    }
    
    // Preparar dados para TreeMap (top 20 temas)
    const topTemas = temas.slice(0, 20);
    
    const data = [{
      type: 'treemap',
      labels: topTemas.map(t => t.tema || 'Não informado'),
      values: topTemas.map(t => t.quantidade || 0),
      parents: topTemas.map(() => ''),
      textinfo: 'label+value',
      textfont: { color: '#ffffff', size: 12 },
      marker: {
        colors: topTemas.map((_, i) => {
          const colors = ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9', '#8b5cf6', '#06b6d4'];
          return colors[i % colors.length];
        }),
        line: { color: '#0f172a', width: 2 }
      }
    }];
    
    const layout = {
      title: '',
      font: { color: '#94a3b8' },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 0, r: 0, t: 0, b: 0 }
    };
    
    const containerEl = document.getElementById('treemapChart');
    if (containerEl) {
      Plotly.newPlot(containerEl, data, layout, { responsive: true, displayModeBar: false });
      console.log('✅ Gráfico TreeMap criado');
    }
  } catch (error) {
    console.error('❌ Erro ao criar TreeMap:', error);
    const container = document.getElementById('treemapChart');
    if (container) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Erro ao carregar TreeMap</div>';
    }
  }
}

/**
 * Criar Mapa de Calor Geográfico
 */
async function loadGeographicMap(bairros) {
  try {
    // Usar fallback direto (lista visual) já que Mapbox requer token válido
    const topBairros = (bairros || []).slice(0, 15);
    
    if (topBairros.length === 0) {
      const container = document.getElementById('mapChart');
      if (container) {
        container.innerHTML = '<div class="p-4 text-center text-slate-400">Nenhum dado de bairro disponível</div>';
      }
      return;
    }
    
    const maxCount = Math.max(...topBairros.map(b => b.count || 0), 1);
    
    // Criar visualização de mapa de calor usando gráfico de barras horizontais
    const labels = topBairros.map(b => b.key || 'Não informado');
    const values = topBairros.map(b => b.count || 0);
    
    // Usar Chart.js para criar um gráfico de barras horizontais estilizado como mapa
    const ctx = document.createElement('canvas');
    ctx.id = 'mapChartCanvas';
    const container = document.getElementById('mapChart');
    if (!container) return;
    
    container.innerHTML = '';
    container.appendChild(ctx);
    
    if (window.chartMap instanceof Chart) window.chartMap.destroy();
    
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    
    window.chartMap = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Manifestações',
          data: values,
          backgroundColor: values.map(v => {
            const intensity = v / maxCount;
            if (intensity > 0.7) return 'rgba(239,68,68,0.8)'; // Vermelho - alto
            if (intensity > 0.4) return 'rgba(167,139,250,0.8)'; // Violeta - médio
            return 'rgba(34,211,238,0.8)'; // Cyan - baixo
          }),
          borderColor: values.map(v => {
            const intensity = v / maxCount;
            if (intensity > 0.7) return 'rgba(239,68,68,1)';
            if (intensity > 0.4) return 'rgba(167,139,250,1)';
            return 'rgba(34,211,238,1)';
          }),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        animation: false, // Desabilitar animação para melhor performance
        plugins: {
          legend: { display: false },
          tooltip: tooltipFn(),
          datalabels: {
            ...dataLabelsFn(),
            anchor: 'start',
            align: 'end'
          }
        },
        scales: {
          x: { 
            beginAtZero: true, 
            ticks: { color: '#94a3b8' }, 
            grid: { color: 'rgba(255,255,255,0.05)' } 
          },
          y: { 
            ticks: { color: '#94a3b8', font: { size: 10 } }, 
            grid: { color: 'rgba(255,255,255,0.05)' } 
          }
        }
      }
    });
    console.log('✅ Gráfico Mapa Geográfico criado');
  } catch (error) {
    console.error('❌ Erro ao criar mapa geográfico:', error);
    // Fallback: mostrar lista simples
    const topBairros = (bairros || []).slice(0, 10);
    const maxCount = Math.max(...topBairros.map(b => b.count || 0), 1);
    const container = document.getElementById('mapChart');
    if (container) {
      container.innerHTML = `
        <div class="p-4">
          <div class="text-slate-400 text-sm mb-4">Top Bairros por Volume</div>
          <div class="space-y-2">
            ${topBairros.map((b, idx) => `
              <div class="flex items-center gap-3">
                <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
                <div class="flex-1">
                  <div class="text-sm text-slate-300">${b.key || 'Não informado'}</div>
                  <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style="width: ${((b.count || 0) / maxCount) * 100}%"></div>
                  </div>
                </div>
                <div class="text-sm font-bold text-emerald-300">${(b.count || 0).toLocaleString('pt-BR')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }
}

/**
 * Construir heatmap
 */
function buildHeatmap(containerId, labels, rows) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Verificar se há dados válidos
  if (!rows || rows.length === 0 || !labels || labels.length === 0) {
    container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Nenhum dado disponível para o heatmap</div>';
    return;
  }
  
  try {
    const validRows = rows.filter(r => r && r.values && Array.isArray(r.values));
    if (validRows.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Nenhum dado válido para o heatmap</div>';
      return;
    }
    
    const max = Math.max(1, ...validRows.flatMap(r => r.values || []));
    const toBg = (v) => {
      const numValue = Number(v) || 0;
      const alpha = numValue === 0 ? 0.05 : Math.min(0.9, 0.15 + 0.75 * (numValue / max));
      return `rgba(34,211,238,${alpha})`;
    };
    
    let html = '<div class="min-w-max"><table class="text-xs w-full">';
    html += '<thead><tr><th class="px-2 py-1 text-left text-slate-400">Chave</th>' + labels.map(l=>`<th class="px-2 py-1 text-slate-400">${l || ''}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + validRows.map(r=>{
      const cells = (r.values || []).map(v=>`<td class="px-2 py-1" style="background:${toBg(v)}">${v || 0}</td>`).join('');
      return `<tr><td class="px-2 py-1 text-slate-300">${r.key || 'Não informado'}</td>${cells}</tr>`;
    }).join('') + '</tbody></table></div>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Erro ao construir heatmap:', error);
    container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Erro ao carregar heatmap</div>';
  }
}

/**
 * Carregar Órgão por Mês
 * OTIMIZADO: Cache e Promise compartilhada
 */
async function loadOrgaoMes(forceRefresh = false) {
  const functionName = 'loadOrgaoMes';
  
  // Verificar cache
  if (!forceRefresh) {
    const cached = getCachedData(functionName);
    if (cached !== null) {
      await renderOrgaoMesData(cached);
      return;
    }
  }
  
  // Usar Promise compartilhada
  return getOrCreatePromise(functionName, async () => {
    try {
      // Verificar se a página está visível
      const page = document.getElementById('page-orgao-mes');
      if (!page) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.debug('Página orgao-mes não encontrada no DOM');
        }
        return;
      }
      
      if (page.style.display === 'none') {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.debug('Página orgao-mes está oculta, aguardando...');
        }
        // Aguardar um pouco e tentar novamente se a página ficar visível
        return new Promise((resolve) => {
          const checkVisibility = () => {
            if (page.style.display !== 'none') {
              // Página ficou visível, continuar carregamento
              loadOrgaoMes(forceRefresh).then(resolve).catch(resolve);
            } else {
              // Ainda oculta, verificar novamente em 100ms
              setTimeout(checkVisibility, 100);
            }
          };
          checkVisibility();
        });
      }
      
      // Usar sistema global de carregamento
      // Carregar dados de secretarias/órgãos
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.debug('Carregando dados de órgãos...');
      }
      
      const dataOrgaos = await window.dataLoader?.load('/api/aggregate/count-by?field=Secretaria', { fallback: [] }) || [];
      
      if (window.Logger) {
        window.Logger.debug(`Dados de órgãos carregados: ${dataOrgaos.length} itens`);
      }
      
      const totalOrgaos = dataOrgaos.length;
      const totalOrgaosEl = document.getElementById('totalOrgaos');
      if (totalOrgaosEl) {
        totalOrgaosEl.textContent = totalOrgaos;
        if (window.Logger) {
          window.Logger.debug(`Total de órgãos atualizado: ${totalOrgaos}`);
        }
      }
      
      // Criar lista visual de órgãos (estilo Looker Studio)
      const listaOrgaos = document.getElementById('listaOrgaos');
      if (listaOrgaos) {
        if (window.Logger) {
          window.Logger.debug('Renderizando lista de órgãos...');
        }
        
        if (dataOrgaos && dataOrgaos.length > 0) {
          const maxValue = Math.max(...dataOrgaos.map(d => d.count || 0), 1);
          listaOrgaos.innerHTML = dataOrgaos.map(item => {
            const width = ((item.count || 0) / maxValue) * 100;
            return `
              <div class="flex items-center gap-3 py-2 border-b border-white/5">
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-300 truncate">${item.key || 'Não informado'}</div>
                  <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
                  </div>
                </div>
                <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${(item.count || 0).toLocaleString('pt-BR')}</div>
              </div>
            `;
          }).join('');
          
          if (window.Logger) {
            window.Logger.debug(`Lista de órgãos renderizada: ${dataOrgaos.length} itens`);
          }
        } else {
          listaOrgaos.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum órgão encontrado</div>';
        }
      }
      
      // Carregar dados mensais
      if (window.Logger) {
        window.Logger.debug('Carregando dados mensais...');
      }
      
      const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
      
      if (window.Logger) {
        window.Logger.debug(`Dados mensais carregados: ${dataMensal.length} itens`);
      }
      
      const labels = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
        // OTIMIZADO: Usar dateUtils centralizado
        return window.dateUtils?.formatMonthYear?.(ym) || ym;
      });
      const values = dataMensal.map(x => x.count || 0);
      
      // Criar gráfico de barras mensal
      const chartEl = document.getElementById('chartOrgaoMes');
      if (chartEl) {
        if (window.Logger) {
          window.Logger.debug('Criando gráfico de barras mensal...');
        }
        
        if (typeof Chart === 'undefined') {
          if (window.Logger) {
            window.Logger.warn('Chart.js não está disponível para criar gráfico');
          }
          chartEl.innerHTML = '<div class="p-4 text-center text-slate-400">Chart.js não está disponível</div>';
        } else {
          if (window.chartOrgaoMes instanceof Chart) {
            window.chartOrgaoMes.destroy();
          }
          const ctx = chartEl.getContext('2d');
          
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartOrgaoMes = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Manifestações',
                data: values,
                backgroundColor: 'rgba(167,139,250,0.7)',
                borderColor: 'rgba(167,139,250,1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: tooltipFn(),
                datalabels: {
                  ...dataLabelsFn(),
                  anchor: 'start',
                  align: 'end'
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  ticks: { color: '#94a3b8' },
                  grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                  ticks: { color: '#94a3b8' },
                  grid: { color: 'rgba(255,255,255,0.05)' }
                }
              }
            }
          });
          addClickFn(window.chartOrgaoMes, (label, value) => showFeedbackFn(null, label, value), 'chartOrgaoMes');
          
          if (window.Logger) {
            window.Logger.debug('Gráfico de barras mensal criado com sucesso');
          }
        }
      } else {
        if (window.Logger) {
          window.Logger.debug('Elemento chartOrgaoMes não encontrado');
        }
      }
      
      // Atualizar KPI total
      const total = dataOrgaos.reduce((sum, item) => sum + (item.count || 0), 0);
      const totalEl = document.getElementById('totalOrgaoMes');
      if (totalEl) {
        totalEl.textContent = total.toLocaleString('pt-BR');
        if (window.Logger) {
          window.Logger.debug(`KPI total atualizado: ${total.toLocaleString('pt-BR')}`);
        }
      }
      
      // Carregar e exibir tabela Por Órgão e Mês
      if (window.Logger) {
        window.Logger.debug('Carregando tabela Por Órgão e Mês...');
      }
      
      const dataOrgaoMes = await window.dataLoader?.load('/api/aggregate/count-by-orgao-mes', { fallback: [] }) || [];
      
      if (window.Logger) {
        window.Logger.debug(`Dados da tabela carregados: ${dataOrgaoMes.length} itens`);
      }
      const tabelaEl = document.getElementById('tabelaOrgaoMes');
      if (tabelaEl && dataOrgaoMes && dataOrgaoMes.length > 0) {
        if (window.Logger) {
          window.Logger.debug('Renderizando tabela Por Órgão e Mês...');
        }
        
        const orgaosUnicos = [...new Set(dataOrgaoMes.map(d => d.orgao))].sort();
        const mesesUnicos = [...new Set(dataOrgaoMes.map(d => d.month))].sort();
        
        let html = '<table class="w-full text-sm border-collapse">';
        html += '<thead><tr class="border-b border-white/10">';
        html += '<th class="px-4 py-3 text-left text-slate-300 font-semibold">Órgão</th>';
        mesesUnicos.forEach(mes => {
          const formatted = window.dateUtils?.formatMonthYearShort?.(mes) || mes || 'N/A';
          html += `<th class="px-4 py-3 text-center text-slate-300 font-semibold">${formatted}</th>`;
        });
        html += '<th class="px-4 py-3 text-center text-slate-300 font-semibold">Total</th>';
        html += '</tr></thead><tbody>';
        
        orgaosUnicos.forEach(orgao => {
          let totalOrgao = 0;
          html += '<tr class="border-b border-white/5 hover:bg-white/5">';
          html += `<td class="px-4 py-2 text-slate-200 font-medium">${orgao || 'Não informado'}</td>`;
          mesesUnicos.forEach(mes => {
            const item = dataOrgaoMes.find(d => d.orgao === orgao && d.month === mes);
            const count = item ? (item.count || 0) : 0;
            totalOrgao += count;
            html += `<td class="px-4 py-2 text-center text-slate-300">${count.toLocaleString('pt-BR')}</td>`;
          });
          html += `<td class="px-4 py-2 text-center text-cyan-300 font-bold">${totalOrgao.toLocaleString('pt-BR')}</td>`;
          html += '</tr>';
        });
        
        // Linha de totais
        html += '<tr class="border-t-2 border-cyan-500/50 bg-cyan-500/10 font-bold">';
        html += '<td class="px-4 py-3 text-cyan-300">TOTAL</td>';
        mesesUnicos.forEach(mes => {
          const totalMes = dataOrgaoMes.filter(d => d.month === mes).reduce((sum, d) => sum + (d.count || 0), 0);
          html += `<td class="px-4 py-3 text-center text-cyan-300">${totalMes.toLocaleString('pt-BR')}</td>`;
        });
        html += `<td class="px-4 py-3 text-center text-cyan-300">${total.toLocaleString('pt-BR')}</td>`;
        html += '</tr>';
        
        html += '</tbody></table>';
        tabelaEl.innerHTML = html;
        
        if (window.Logger) {
          window.Logger.debug(`Tabela renderizada: ${orgaosUnicos.length} órgãos, ${mesesUnicos.length} meses`);
        }
      } else if (tabelaEl) {
        tabelaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado disponível para a tabela</div>';
        if (window.Logger) {
          window.Logger.debug('Tabela não renderizada: sem dados ou elemento não encontrado');
        }
      }
      
      // Salvar no cache
      const cacheData = { dataOrgaos, dataMensal, dataOrgaoMes, total };
      setCachedData(functionName, cacheData);
      
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.debug('Dados de Órgão por Mês carregados com sucesso');
      }
      
      return cacheData;
    } catch (error) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.error('Erro ao carregar Órgão por Mês:', error);
      } else {
        console.error('❌ Erro ao carregar Órgão por Mês:', error);
      }
      throw error;
    }
  });
}

// NOTA: loadOrgaoMes foi movido para data-pages.js
// Esta função permanece aqui apenas como fallback temporário
// A exportação principal está em data-pages.js

/**
 * Renderizar dados de Órgão por Mês (para uso com cache)
 */
async function renderOrgaoMesData(cached) {
  // CORREÇÃO: Implementar renderização com dados do cache
  if (!cached) return;
  
  const { dataOrgaos, dataMensal, dataOrgaoMes, total } = cached;
  
  // Renderizar lista de órgãos
  const totalOrgaos = dataOrgaos?.length || 0;
  const totalOrgaosEl = document.getElementById('totalOrgaos');
  if (totalOrgaosEl) totalOrgaosEl.textContent = totalOrgaos;
  
  const listaOrgaos = document.getElementById('listaOrgaos');
  if (listaOrgaos && dataOrgaos && dataOrgaos.length > 0) {
    const maxValue = Math.max(...dataOrgaos.map(d => d.count), 1);
    listaOrgaos.innerHTML = dataOrgaos.map(item => {
      const width = (item.count / maxValue) * 100;
      return `
        <div class="flex items-center gap-3 py-2 border-b border-white/5">
          <div class="flex-1 min-w-0">
            <div class="text-sm text-slate-300 truncate">${item.key}</div>
            <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
            </div>
          </div>
          <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${item.count.toLocaleString('pt-BR')}</div>
        </div>
      `;
    }).join('');
  }
  
  // Renderizar gráfico mensal
  if (dataMensal && dataMensal.length > 0) {
    const labels = dataMensal.map(x => {
      const ym = x.ym || x.month || '';
      return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
    });
    const values = dataMensal.map(x => x.count || 0);
    
    const chartEl = document.getElementById('chartOrgaoMes');
    if (chartEl && typeof Chart !== 'undefined') {
      if (window.chartOrgaoMes instanceof Chart) window.chartOrgaoMes.destroy();
      const ctx = chartEl.getContext('2d');
      
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartOrgaoMes = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Manifestações',
            data: values,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(),
              anchor: 'start',
              align: 'end'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            }
          }
        }
      });
      addClickFn(window.chartOrgaoMes, (label, value) => showFeedbackFn(null, label, value), 'chartOrgaoMes');
    }
  }
  
  // Renderizar KPI total
  const totalEl = document.getElementById('totalOrgaoMes');
  if (totalEl && total !== undefined) {
    totalEl.textContent = total.toLocaleString('pt-BR');
  }
  
  // Renderizar tabela
  const tabelaEl = document.getElementById('tabelaOrgaoMes');
  if (tabelaEl && dataOrgaoMes && dataOrgaoMes.length > 0) {
    const orgaosUnicos = [...new Set(dataOrgaoMes.map(d => d.orgao))].sort();
    const mesesUnicos = [...new Set(dataOrgaoMes.map(d => d.month))].sort();
    
    let html = '<table class="w-full text-sm border-collapse">';
    html += '<thead><tr class="border-b border-white/10">';
    html += '<th class="px-4 py-3 text-left text-slate-300 font-semibold">Órgão</th>';
    mesesUnicos.forEach(mes => {
      const formatted = window.dateUtils?.formatMonthYearShort?.(mes) || mes || 'N/A';
      html += `<th class="px-4 py-3 text-center text-slate-300 font-semibold">${formatted}</th>`;
    });
    html += '<th class="px-4 py-3 text-center text-slate-300 font-semibold">Total</th>';
    html += '</tr></thead><tbody>';
    
    const totalGeral = dataOrgaos?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    
    orgaosUnicos.forEach(orgao => {
      let totalOrgao = 0;
      html += '<tr class="border-b border-white/5 hover:bg-white/5">';
      html += `<td class="px-4 py-2 text-slate-200 font-medium">${orgao || 'Não informado'}</td>`;
      mesesUnicos.forEach(mes => {
        const item = dataOrgaoMes.find(d => d.orgao === orgao && d.month === mes);
        const count = item ? (item.count || 0) : 0;
        totalOrgao += count;
        html += `<td class="px-4 py-2 text-center text-slate-300">${count.toLocaleString('pt-BR')}</td>`;
      });
      html += `<td class="px-4 py-2 text-center text-cyan-300 font-bold">${totalOrgao.toLocaleString('pt-BR')}</td>`;
      html += '</tr>';
    });
    
    // Linha de totais
    html += '<tr class="border-t-2 border-cyan-500/50 bg-cyan-500/10 font-bold">';
    html += '<td class="px-4 py-3 text-cyan-300">TOTAL</td>';
    mesesUnicos.forEach(mes => {
      const totalMes = dataOrgaoMes.filter(d => d.month === mes).reduce((sum, d) => sum + (d.count || 0), 0);
      html += `<td class="px-4 py-3 text-center text-cyan-300">${totalMes.toLocaleString('pt-BR')}</td>`;
    });
    html += `<td class="px-4 py-3 text-center text-cyan-300">${totalGeral.toLocaleString('pt-BR')}</td>`;
    html += '</tr>';
    
    html += '</tbody></table>';
    tabelaEl.innerHTML = html;
  }
}

// DEBUG CRÍTICO: Log ANTES do bloco try para verificar se chegou até aqui
if (typeof window !== 'undefined') {
  if (window.Logger) {
    window.Logger.debug('🔍 data.js: Chegou até a exportação (antes do try)');
  } else {
    console.log('🔍 data.js: Chegou até a exportação (antes do try)');
  }
}

// Exportar funções para uso global
// CORREÇÃO: Mesclar com window.data existente em vez de sobrescrever
// Isso preserva funções adicionadas pelos módulos (data-kpis.js, data-pages.js, etc.)
try {
  // DEBUG CRÍTICO: Log DENTRO do bloco try
  if (typeof window !== 'undefined') {
    if (window.Logger) {
      window.Logger.debug('🔍 data.js: Dentro do bloco try de exportação');
    } else {
      console.log('🔍 data.js: Dentro do bloco try de exportação');
    }
  }
  if (!window.data) window.data = {};

  // DEBUG: Log para verificar se loadOrgaoMes está sendo exportado
  if (window.Logger) {
    window.Logger.debug('Exportando loadOrgaoMes para window.data');
  } else {
    console.log('🔍 Exportando loadOrgaoMes para window.data');
  }

  // DEBUG: Verificar se loadOrgaoMes está definido antes de exportar
  if (typeof loadOrgaoMes === 'undefined') {
    if (window.Logger) {
      window.Logger.error('❌ loadOrgaoMes não está definido antes da exportação!');
    } else {
      console.error('❌ loadOrgaoMes não está definido antes da exportação!');
    }
  } else {
    if (window.Logger) {
      window.Logger.debug(`✅ loadOrgaoMes está definido: ${typeof loadOrgaoMes}`);
    } else {
      console.log(`✅ loadOrgaoMes está definido: ${typeof loadOrgaoMes}`);
    }
  }

  // Mesclar funções do data.js com window.data existente
  Object.assign(window.data, {
  reloadAllData,
  loadAIInsights,
  loadStatusOverview,
  loadTable,
  loadKpisWithData,
  loadKpis,
  renderKpis, // Função wrapper que chama window.renderKpis
  // currentTableData e currentTableHeaders agora estão em data-tables.js
  loadOverview,
  loadAdvancedCharts,
  loadSankeyChart,
  loadTreeMapChart,
  loadGeographicMap,
  buildHeatmap,
  drawSpark,
  drawSparkDaily,
  // loadOrgaoMes movido para data-pages.js
  loadCategoria,
  loadStatusPage,
  loadBairro,
  loadUAC,
  loadResponsavel,
  loadCanal,
  loadPrioridade,
  loadTema,
  loadAssunto,
  // loadTempoMedio movido para data-pages.js
  loadCadastrante,
  loadReclamacoes,
  loadProjecao2026,
  loadSecretaria,
  loadSecretariasDistritos,
  loadSecretariasPorDistrito,
  loadTipo,
  loadSetor,
  loadUnit,
  loadCountChart,
  loadTimeChart,
  // Chat functions
  loadCoraChat,
  loadChatMessages,
  sendChatMessage,
  renderChatMessages,
  formatChatTime,
  initChatWidget,
  initChatPage,
  // Variáveis de estado (agora em data-tables.js)
  getCurrentTableData: () => window.data?.getCurrentTableData?.() || [],
  getCurrentTableHeaders: () => window.data?.getCurrentTableHeaders?.() || []
  });

  // DEBUG: Verificar se loadOrgaoMes foi exportado corretamente
  if (window.Logger) {
    window.Logger.debug(`loadOrgaoMes exportado: ${typeof window.data.loadOrgaoMes === 'function' ? '✅ SIM' : '❌ NÃO'}`);
  } else {
    console.log(`🔍 loadOrgaoMes exportado: ${typeof window.data.loadOrgaoMes === 'function' ? '✅ SIM' : '❌ NÃO'}`);
  }

  // DEBUG: loadTempoMedio foi movido para data-pages.js
  // Verificar se foi exportado corretamente por data-pages.js
  if (window.Logger) {
    window.Logger.debug(`loadTempoMedio exportado (data-pages.js): ${typeof window.data.loadTempoMedio === 'function' ? '✅ SIM' : '❌ NÃO'}`);
  } else {
    console.log(`🔍 loadTempoMedio exportado (data-pages.js): ${typeof window.data.loadTempoMedio === 'function' ? '✅ SIM' : '❌ NÃO'}`);
  }
} catch (error) {
  // CORREÇÃO: Capturar erros na exportação
  if (window.Logger) {
    window.Logger.error('❌ Erro ao exportar funções de data.js:', error);
  } else {
    console.error('❌ Erro ao exportar funções de data.js:', error);
  }
}

/**
 * Carregar Unidade
 */
async function loadUnit(unitName) {
  try {
    // Mapear nomes das unidades para os nomes no banco
    const unitMap = {
      'adao': 'ADÃO',
      'cer iv': 'CER IV',
      'hospital olho': 'Hospital do Olho',
      'hospital duque': 'Hospital Duque',
      'hospital infantil': 'Hospital Infantil',
      'hospital moacyr': 'Hospital Moacyr',
      'maternidade santa cruz': 'Maternidade Santa Cruz',
      'upa beira mar': 'UPA Beira Mar',
      'uph pilar': 'UPH Pilar',
      'uph saracuruna': 'UPH Saracuruna',
      'uph xerem': 'UPH Xerém',
      'hospital veterinario': 'Hospital Veterinário',
      'upa walter garcia': 'UPA Walter Garcia',
      'uph campos eliseos': 'UPH Campos Elíseos',
      'uph parque equitativa': 'UPH Parque Equitativa',
      'ubs antonio granja': 'UBS Antonio Granja',
      'upa sarapui': 'UPA Sarapuí',
      'uph imbarie': 'UPH Imbariê'
    };
    
    // Usar sistema global de carregamento
    const searchName = unitMap[unitName.toLowerCase()] || unitName;
    const data = await window.dataLoader?.load(`/api/unit/${encodeURIComponent(searchName)}`, { fallback: null }) || null;
    
    // Encontrar a seção da unidade
    const pageId = `page-unit-${unitName.replace(/\s+/g, '-').toLowerCase()}`;
    const section = document.getElementById(pageId);
    if (!section) return;
    
    const assuntosContainer = section.querySelector('.unit-assuntos');
    const tiposCanvas = section.querySelector('.unit-tipos');
    
    // Lista de assuntos
    const assuntos = data.assuntos || [];
    if (assuntosContainer) {
      assuntosContainer.innerHTML = assuntos.map((item, idx) => {
        const width = assuntos.length > 0 ? (item.quantidade / Math.max(...assuntos.map(d => d.quantidade), 1)) * 100 : 0;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate">${item.assunto}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
    
    // Gráfico de tipos
    const tipos = data.tipos || [];
    if (tiposCanvas && tipos.length > 0) {
      const labels = tipos.map(t => t.tipo);
      const values = tipos.map(t => t.quantidade);
      
      if (window[`chartUnit${unitName.replace(/\s+/g, '')}Tipos`] instanceof Chart) {
        window[`chartUnit${unitName.replace(/\s+/g, '')}Tipos`].destroy();
      }
      
      const ctx = tiposCanvas.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window[`chartUnit${unitName.replace(/\s+/g, '')}Tipos`] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'right', labels: { color: '#94a3b8' } },
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(true, 'doughnut')
          }
        }
      });
      addClickFn(window[`chartUnit${unitName.replace(/\s+/g, '')}Tipos`], (label, value) => showFeedbackFn(null, label, value));
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Unidade:', error);
  }
}

/**
 * Carregar Gráfico de Contagem
 */
async function loadCountChart(field) {
  try {
    console.log('Carregando gráfico de contagem para campo:', field);
    // CORREÇÃO: Usar sistema global de carregamento (window.dataLoader)
    const endpoint = window.config?.buildEndpoint?.(window.config?.API_ENDPOINTS?.AGGREGATE_COUNT_BY || '/api/aggregate/count-by', { field }) || `/api/aggregate/count-by?field=${encodeURIComponent(field)}`;
    const data = await window.dataLoader?.load(endpoint, { fallback: [] }) || [];
    console.log('Dados recebidos:', data.length, 'itens');
    
    const labels = data.slice(0, 20).map(x => x.key);
    const values = data.slice(0, 20).map(x => x.count);
    const chartEl = document.getElementById('chartCount');
    
    if (!chartEl) {
      console.warn('Canvas chartCount não encontrado (pode não estar na página atual)');
      return;
    }
    
    const ctx2d = chartEl.getContext('2d');
    if (window.chartCount instanceof Chart) window.chartCount.destroy();
    
    // OTIMIZAÇÃO: Preparar funções antes de criar gráfico
    const gradientFn = window.utils?.gradient || (() => ({}));
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    // OTIMIZAÇÃO: Criar gradiente uma vez antes do gráfico
    const gradientBg = typeof gradientFn === 'function' ? gradientFn(ctx2d, 'rgba(34,211,238,0.8)', 'rgba(167,139,250,0.2)') : 'rgba(34,211,238,0.8)';
    
    // OTIMIZAÇÃO: Usar requestAnimationFrame para não bloquear UI
    requestAnimationFrame(() => {
    window.chartCount = new Chart(ctx2d, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: `Contagem por ${field}`,
          data: values,
          borderRadius: 8,
            backgroundColor: gradientBg,
          borderColor: 'rgba(34,211,238,1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
          animation: false, // Já desabilitado
          maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: tooltipFn(),
          datalabels: dataLabelsFn(false, 'bar', false)
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          }
        }
      }
    });
    addClickFn(window.chartCount, (label, value) => showFeedbackFn(null, label, value));
    chartEl.classList.remove('skeleton');
    });
    console.log('Gráfico de contagem criado com sucesso');
  } catch (error) {
    console.error('Erro em loadCountChart:', error);
    throw error;
  }
}

// CORREÇÃO CRÍTICA: Exportar loadCountChart IMEDIATAMENTE após definição
(function() {
  try {
    if (typeof window !== 'undefined') {
      if (!window.data) window.data = {};
      window.data.loadCountChart = loadCountChart;
      if (window.Logger) {
        window.Logger.debug('✅ loadCountChart exportado imediatamente após definição');
      } else {
        console.log('✅ loadCountChart exportado imediatamente após definição');
      }
    }
  } catch (e) {
    console.error('❌ Erro ao exportar loadCountChart:', e);
  }
})();

/**
 * Carregar Gráfico de Série Temporal
 */
async function loadTimeChart(field) {
  try {
    console.log('Carregando gráfico de série temporal para campo:', field);
    // CORREÇÃO: Usar sistema global de carregamento (window.dataLoader)
    const endpoint = window.config?.buildEndpoint?.(window.config?.API_ENDPOINTS?.AGGREGATE_TIME_SERIES || '/api/aggregate/time-series', { field }) || `/api/aggregate/time-series?field=${encodeURIComponent(field)}`;
    const data = await window.dataLoader?.load(endpoint, { fallback: [] }) || [];
    console.log('Dados recebidos:', data.length, 'itens');
    
    const labels = data.map(x => x.date);
    const values = data.map(x => x.count);
    const chartEl = document.getElementById('chartTime');
    
    if (!chartEl) {
      console.warn('Canvas chartTime não encontrado (pode não estar na página atual)');
      return;
    }
    
    const ctx2d = chartEl.getContext('2d');
    if (window.chartTime instanceof Chart) window.chartTime.destroy();
    
    // OTIMIZAÇÃO: Preparar funções antes de criar gráfico
    const gradientFn = window.utils?.gradient || (() => ({}));
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    // OTIMIZAÇÃO: Criar gradiente uma vez antes do gráfico
    const gradientBg = typeof gradientFn === 'function' ? gradientFn(ctx2d, 'rgba(52,211,153,0.35)', 'rgba(52,211,153,0.05)') : 'rgba(52,211,153,0.35)';
    
    // OTIMIZAÇÃO: Limitar número de pontos para melhor performance (máximo 100 pontos)
    const maxPoints = 100;
    const step = Math.max(1, Math.floor(labels.length / maxPoints));
    const sampledLabels = labels.filter((_, i) => i % step === 0 || i === labels.length - 1);
    const sampledValues = values.filter((_, i) => i % step === 0 || i === values.length - 1);
    
    // OTIMIZAÇÃO: Usar requestAnimationFrame para não bloquear UI
    requestAnimationFrame(() => {
    window.chartTime = new Chart(ctx2d, {
      type: 'line',
      data: {
          labels: sampledLabels,
        datasets: [{
          label: `Registros por dia (${field})`,
            data: sampledValues,
          fill: true,
          borderWidth: 2,
          tension: 0.35,
          borderColor: 'rgba(52,211,153,1)',
            backgroundColor: gradientBg,
            pointRadius: 3, // Reduzido de 4 para melhor performance
            pointHoverRadius: 5, // Reduzido de 6
          pointBackgroundColor: 'rgba(52,211,153,1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
          animation: false, // Já desabilitado
          maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: '#cbd5e1' } },
          tooltip: tooltipFn(),
          datalabels: {
            ...dataLabelsFn(),
            display: function(context) {
                // Mostrar apenas em alguns pontos para não poluir (otimizado)
                const dataLength = context.dataset.data.length;
                const showEvery = Math.max(1, Math.floor(dataLength / 15)); // Máximo 15 labels
                return context.dataIndex % showEvery === 0 || context.dataIndex === dataLength - 1;
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' }, beginAtZero: true }
        }
      }
    });
    addClickFn(window.chartTime, (label, value) => showFeedbackFn(null, label, value));
    chartEl.classList.remove('skeleton');
    });
    console.log('Gráfico de série temporal criado com sucesso');
  } catch (error) {
    console.error('Erro em loadTimeChart:', error);
    throw error;
  }
}

// CORREÇÃO CRÍTICA: Exportar loadTimeChart IMEDIATAMENTE após definição
(function() {
  try {
    if (typeof window !== 'undefined') {
      if (!window.data) window.data = {};
      window.data.loadTimeChart = loadTimeChart;
      if (window.Logger) {
        window.Logger.debug('✅ loadTimeChart exportado imediatamente após definição');
      } else {
        console.log('✅ loadTimeChart exportado imediatamente após definição');
      }
    }
  } catch (e) {
    console.error('❌ Erro ao exportar loadTimeChart:', e);
  }
})();

/**
 * Carregar Secretaria
 */
async function loadSecretaria() {
  try {
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Secretaria', { fallback: [] }) || [];
    const labels = data.slice(0, 10).map(x => x.key);
    const values = data.slice(0, 10).map(x => x.count);
    
    const chartEl = document.getElementById('chartSecretaria');
    if (chartEl) {
      if (window.chartSecretaria instanceof Chart) window.chartSecretaria.destroy();
      const ctx = chartEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartSecretaria = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Secretaria',
            data: values,
            backgroundColor: '#22d3ee',
            borderColor: '#22d3ee',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(false, 'bar', false)
          },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartSecretaria, (label, value) => showFeedbackFn(null, label, value), 'chartSecretaria');
    }
    
    const rankEl = document.getElementById('rankSecretaria');
    if (rankEl) {
      rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-cyan-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
    }
    
    // Gráfico mensal - CORREÇÃO: Usar sistema global de carregamento
    const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
    if (dataMensal && dataMensal.length > 0) {
      // OTIMIZADO: Usar dateUtils centralizado
      const labelsMes = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
      });
      const valuesMes = dataMensal.map(x => x.count || 0);
      
      const chartMesEl = document.getElementById('chartSecretariaMes');
      if (chartMesEl) {
        if (window.chartSecretariaMes instanceof Chart) window.chartSecretariaMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartSecretariaMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Manifestações',
              data: valuesMes,
              backgroundColor: 'rgba(34,211,238,0.7)',
              borderColor: 'rgba(34,211,238,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Secretaria:', error);
  }
}

/**
 * Carregar Secretarias e Distritos
 */
async function loadSecretariasDistritos() {
  try {
    // Usar sistema global de carregamento
    // Carregar dados de distritos e secretarias
    const distritosData = await window.dataLoader?.load('/api/distritos', { fallback: null }) || null;
    
    if (!distritosData || !distritosData.distritos) {
      const listaEl = document.getElementById('listaDistritos');
      if (listaEl) {
        listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados de distritos</div>';
      }
      return;
    }
    
    const distritos = distritosData.distritos;
    const estatisticas = distritosData.estatisticas || {};
    
    // Renderizar lista de distritos
    const listaDistritos = document.getElementById('listaDistritos');
    if (listaDistritos) {
      listaDistritos.innerHTML = Object.entries(distritos).map(([nome, info]) => `
        <div class="distrito-item p-4 rounded-lg border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 cursor-pointer transition-all" 
             data-distrito="${nome}" 
             data-code="${info.code || ''}">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold text-cyan-300">${nome}</div>
              <div class="text-xs text-slate-400 mt-1">
                ${info.bairros ? info.bairros.length + ' bairros' : ''}
                ${estatisticas.secretariasPorDistrito && estatisticas.secretariasPorDistrito[nome] 
                  ? ' • ' + estatisticas.secretariasPorDistrito[nome] + ' secretarias' 
                  : ''}
              </div>
            </div>
            <div class="text-2xl">${info.code || '📍'}</div>
          </div>
        </div>
      `).join('');
      
      // Adicionar event listeners para seleção de distrito
      listaDistritos.querySelectorAll('.distrito-item').forEach(item => {
        item.addEventListener('click', async () => {
          // Remover seleção anterior
          listaDistritos.querySelectorAll('.distrito-item').forEach(i => {
            i.classList.remove('border-cyan-400', 'bg-cyan-500/10');
            i.classList.add('border-white/10');
          });
          
          // Marcar como selecionado
          item.classList.remove('border-white/10');
          item.classList.add('border-cyan-400', 'bg-cyan-500/10');
          
          const distritoNome = item.dataset.distrito;
          const distritoCode = item.dataset.code;
          
          // Atualizar nome do distrito selecionado
          const nomeEl = document.getElementById('distritoSelecionadoNome');
          if (nomeEl) nomeEl.textContent = distritoNome;
          
          // Carregar secretarias do distrito
          if (window.data?.loadSecretariasPorDistrito) {
            await window.data.loadSecretariasPorDistrito(distritoNome, distritoCode);
          }
        });
      });
    }
    
    // Renderizar estatísticas
    const estatisticasDiv = document.getElementById('estatisticasDistritos');
    if (estatisticasDiv) {
      estatisticasDiv.innerHTML = `
        <div class="glass rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Total de Secretarias</div>
          <div class="text-2xl font-bold text-cyan-300">${estatisticas.totalSecretarias || 0}</div>
        </div>
        <div class="glass rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Total de Distritos</div>
          <div class="text-2xl font-bold text-violet-300">${estatisticas.totalDistritos || 0}</div>
        </div>
        <div class="glass rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Total de Bairros</div>
          <div class="text-2xl font-bold text-emerald-300">${estatisticas.totalBairros || 0}</div>
        </div>
        <div class="glass rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Média Secretarias/Distrito</div>
          <div class="text-2xl font-bold text-amber-300">${estatisticas.totalSecretarias && estatisticas.totalDistritos 
            ? (estatisticas.totalSecretarias / estatisticas.totalDistritos).toFixed(1) 
            : 0}</div>
        </div>
      `;
    }
    
    // Criar gráfico de distribuição de secretarias por distrito
    if (estatisticas.secretariasPorDistrito) {
      const distritoLabels = Object.keys(estatisticas.secretariasPorDistrito);
      const distritoValues = Object.values(estatisticas.secretariasPorDistrito);
      
      const chartEl = document.getElementById('chartSecretariasDistritos');
      if (chartEl) {
        if (window.chartSecretariasDistritos instanceof Chart) window.chartSecretariasDistritos.destroy();
        const ctx = chartEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartSecretariasDistritos = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: distritoLabels.map(d => d.replace('º Distrito - ', '').split('(')[0].trim()),
            datasets: [{
              label: 'Quantidade de Secretarias',
              data: distritoValues,
              backgroundColor: 'rgba(245,158,11,0.7)',
              borderColor: 'rgba(245,158,11,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn()
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar secretarias e distritos:', error);
    const listaEl = document.getElementById('listaDistritos');
    if (listaEl) {
      listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados</div>';
    }
  }
}

/**
 * Carregar Secretarias por Distrito
 */
async function loadSecretariasPorDistrito(distritoNome, distritoCode) {
  try {
    // CORREÇÃO: Usar sistema global de carregamento
    const endpoint = `/api/secretarias/${encodeURIComponent(distritoCode || distritoNome)}`;
    const data = await window.dataLoader?.load(endpoint, {
      fallback: { secretarias: [] },
      timeout: 30000
    }) || { secretarias: [] };
    
    const secretarias = data.secretarias || [];
    const listaSecretarias = document.getElementById('listaSecretarias');
    
    if (!listaSecretarias) return;
    
    if (secretarias.length === 0) {
      listaSecretarias.innerHTML = '<div class="text-center text-slate-400 py-8">Nenhuma secretaria encontrada para este distrito</div>';
      return;
    }
    
    listaSecretarias.innerHTML = secretarias.map(sec => `
      <div class="glass rounded-xl p-4 border border-white/10 hover:border-violet-400/50 transition-all">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h4 class="font-semibold text-violet-300 mb-2">${sec.name || 'Secretaria'}</h4>
            ${sec.address ? `<div class="text-sm text-slate-400 mb-1">📍 ${sec.address}</div>` : ''}
            ${sec.phone ? `<div class="text-sm text-slate-400 mb-1">📞 ${sec.phone}</div>` : ''}
            ${sec.email ? `<div class="text-sm text-slate-400 mb-1">✉️ ${sec.email}</div>` : ''}
            ${sec.workingHours ? `<div class="text-sm text-slate-400 mb-2">🕐 ${sec.workingHours}</div>` : ''}
            ${sec.services && sec.services.length > 0 ? `
              <div class="mt-3">
                <div class="text-xs text-slate-500 mb-1">Serviços oferecidos:</div>
                <div class="flex flex-wrap gap-1">
                  ${sec.services.map(s => `<span class="px-2 py-1 text-xs rounded bg-slate-800/50 text-slate-300">${s}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('❌ Erro ao carregar secretarias do distrito:', error);
    const listaEl = document.getElementById('listaSecretarias');
    if (listaEl) {
      listaEl.innerHTML = '<div class="text-center text-slate-400 py-8">Erro ao carregar secretarias</div>';
    }
  }
}

/**
 * Carregar Tipo
 */
async function loadTipo() {
  try {
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Tipo', { fallback: [] }) || [];
    const labels = data.slice(0, 10).map(x => x.key);
    const values = data.slice(0, 10).map(x => x.count);
    
    const chartEl = document.getElementById('chartTipo');
    if (chartEl) {
      if (window.chartTipo instanceof Chart) window.chartTipo.destroy();
      const ctx = chartEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartTipo = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            label: 'Tipo Manifestação',
            data: values,
            backgroundColor: ['#c084fc', '#22d3ee', '#facc15', '#fb7185']
          }]
        },
        options: {
          responsive: true,
          animation: false,
          plugins: {
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(true, 'pie')
          }
        }
      });
      addClickFn(window.chartTipo, (label, value) => showFeedbackFn(null, label, value), 'chartTipo');
    }
    
    const rankEl = document.getElementById('rankTipo');
    if (rankEl) {
      rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-violet-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Tipo:', error);
  }
}

/**
 * Carregar Setor
 */
async function loadSetor() {
  try {
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Setor', { fallback: [] }) || [];
    const labels = data.slice(0, 10).map(x => x.key);
    const values = data.slice(0, 10).map(x => x.count);
    
    const chartEl = document.getElementById('chartSetor');
    if (chartEl) {
      if (window.chartSetor instanceof Chart) window.chartSetor.destroy();
      const ctx = chartEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartSetor = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Setor',
            data: values,
            backgroundColor: '#34d399',
            borderColor: '#34d399',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          animation: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(),
              anchor: 'start',
              align: 'end'
            }
          },
          scales: {
            x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartSetor, (label, value) => showFeedbackFn(null, label, value), 'chartSetor');
    }
    
    const rankEl = document.getElementById('rankSetor');
    if (rankEl) {
      rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-emerald-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Setor:', error);
  }
}

/**
 * Carregar Cadastrante
 */
async function loadCadastrante() {
  try {
    // Usar sistema global de carregamento
    // Servidores
    const servidores = await window.dataLoader?.load('/api/aggregate/by-server', { fallback: [] }) || [];
    const listaServidores = document.getElementById('listaServidores');
    if (listaServidores) {
      listaServidores.innerHTML = servidores.map((item, idx) => {
        const width = (item.quantidade / Math.max(...servidores.map(d => d.quantidade), 1)) * 100;
        const isActive = window.globalFilters?.cadastranteFilter?.type === 'servidor' && window.globalFilters.cadastranteFilter.value === item.servidor;
        return `
          <div class="servidor-item flex items-center gap-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${isActive ? 'bg-cyan-500/20 border-cyan-500/30 border-l-4' : ''}" 
               data-servidor="${item.servidor.replace(/"/g, '&quot;')}">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.servidor}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
      
      // Adicionar event listeners aos servidores
      listaServidores.querySelectorAll('.servidor-item').forEach(item => {
        item.addEventListener('click', function() {
          const servidor = this.getAttribute('data-servidor');
          if (window.updateCadastranteCharts) {
            window.updateCadastranteCharts({ type: 'servidor', value: servidor });
          }
        });
      });
    }
    
    // Unidades de Cadastro (UAC)
    const uacs = await window.dataLoader?.load('/api/aggregate/count-by?field=UAC', { fallback: [] }) || [];
    const listaUnidades = document.getElementById('listaUnidadesCadastro');
    if (listaUnidades) {
      listaUnidades.innerHTML = uacs.map((item, idx) => {
        const width = (item.count / Math.max(...uacs.map(d => d.count), 1)) * 100;
        const isActive = window.globalFilters?.cadastranteFilter?.type === 'unidadeCadastro' && window.globalFilters.cadastranteFilter.value === item.key;
        return `
          <div class="unidade-item flex items-center gap-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${isActive ? 'bg-violet-500/20 border-violet-500/30 border-l-4' : ''}" 
               data-unidade="${item.key.replace(/"/g, '&quot;')}">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.key}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${item.count.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
      
      // Adicionar event listeners às unidades
      listaUnidades.querySelectorAll('.unidade-item').forEach(item => {
        item.addEventListener('click', function() {
          const unidade = this.getAttribute('data-unidade');
          if (window.updateCadastranteCharts) {
            window.updateCadastranteCharts({ type: 'unidadeCadastro', value: unidade });
          }
        });
      });
    }
    
    // Gráfico mensal - Usar sistema global
    const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
    const labelsMes = dataMensal.map(x => {
      const ym = x.ym || x.month || '';
      if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
      // OTIMIZADO: Usar dateUtils centralizado
      return window.dateUtils?.formatMonthYear?.(ym) || ym;
    });
    const valuesMes = dataMensal.map(x => x.count);
    
    const chartMesEl = document.getElementById('chartCadastranteMes');
    if (chartMesEl) {
      if (window.chartCadastranteMes instanceof Chart) window.chartCadastranteMes.destroy();
      const ctxMes = chartMesEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      
      window.chartCadastranteMes = new Chart(ctxMes, {
        type: 'bar',
        data: {
          labels: labelsMes,
          datasets: [{
            label: 'Quantidade',
            data: valuesMes,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(false, 'bar', false)
          },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
    
    // Total - Usar sistema global
    const summary = await window.dataLoader?.load('/api/summary', { fallback: { total: 0 } }) || { total: 0 };
    const totalEl = document.getElementById('totalCadastrante');
    if (totalEl) {
      totalEl.textContent = (summary.total || 0).toLocaleString('pt-BR');
    }
    
    if (window.updateCadastranteFiltersDisplay) {
      window.updateCadastranteFiltersDisplay();
    }
    
    if (window.globalFilters?.cadastranteFilter && window.updateCadastranteCharts) {
      await window.updateCadastranteCharts(window.globalFilters.cadastranteFilter);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Cadastrante:', error);
  }
}

/**
 * Carregar Reclamações
 */
async function loadReclamacoes() {
  try {
    // Usar sistema global de carregamento
    const [data, dataMensal] = await Promise.all([
      window.dataLoader?.load('/api/complaints-denunciations', { fallback: { assuntos: [], tipos: [] } }) || { assuntos: [], tipos: [] },
      window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || []
    ]);
    
    const assuntos = data.assuntos || [];
    const tipos = data.tipos || [];
    
    // Lista de assuntos
    const listaEl = document.getElementById('listaReclamacoes');
    if (listaEl) {
      listaEl.innerHTML = assuntos.map((item, idx) => {
        const width = assuntos.length > 0 ? (item.quantidade / Math.max(...assuntos.map(d => d.quantidade), 1)) * 100 : 0;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.assunto}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-rose-500 to-pink-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-rose-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
    
    // Gráfico de tipos de ação
    const labels = tipos.map(t => t.tipo);
    const values = tipos.map(t => t.quantidade);
    
    const chartTipoEl = document.getElementById('chartReclamacoesTipo');
    if (chartTipoEl) {
      if (window.chartReclamacoesTipo instanceof Chart) window.chartReclamacoesTipo.destroy();
      const ctx = chartTipoEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartReclamacoesTipo = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Quantidade',
            data: values,
            backgroundColor: 'rgba(239,68,68,0.7)',
            borderColor: 'rgba(239,68,68,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(false, 'bar', true)
          },
          scales: {
            x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartReclamacoesTipo, (label, value) => showFeedbackFn(null, label, value), 'chartReclamacoesTipo');
    }
    
    // Gráfico por mês
    if (dataMensal && dataMensal.length > 0) {
      const labelsMes = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
        const parts = ym.split('-');
        // OTIMIZADO: Usar dateUtils centralizado
        return window.dateUtils?.formatMonthYear?.(ym) || ym;
      });
      const valuesMes = dataMensal.map(x => x.count);
      
      const chartMesEl = document.getElementById('chartReclamacoesMes');
      if (chartMesEl) {
        if (window.chartReclamacoesMes instanceof Chart) window.chartReclamacoesMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartReclamacoesMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Quantidade',
              data: valuesMes,
              backgroundColor: 'rgba(239,68,68,0.7)',
              borderColor: 'rgba(239,68,68,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Reclamações:', error);
  }
}

/**
 * Carregar Projeção 2026
 */
async function loadProjecao2026() {
  try {
    // Usar sistema global de carregamento
    // Carregar dados históricos
    const [byMonth, temas, status] = await Promise.all([
      window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [],
      window.dataLoader?.load('/api/aggregate/by-theme', { fallback: [] }) || [],
      window.dataLoader?.load('/api/stats/status-overview', { fallback: null }) || null
    ]);
    
    // Processar dados mensais históricos
    const historico = byMonth.map(x => {
      const ym = x.ym || x.month || '';
      if (!ym || typeof ym !== 'string') {
        return {
          label: ym || 'Data inválida',
          value: x.count || 0,
          year: 0,
          month: 0
        };
      }
      const parts = ym.split('-');
      if (parts.length < 2) {
        return {
          label: ym,
          value: x.count || 0,
          year: 0,
          month: 0
        };
      }
      // OTIMIZADO: Usar dateUtils centralizado
      const [year, month] = parts;
      return {
        label: window.dateUtils?.formatMonthYear?.(ym) || ym,
        value: x.count || 0,
        year: parseInt(year) || 0,
        month: parseInt(month) || 0
      };
    });
    
    // Calcular média mensal dos últimos 12 meses
    const ultimos12Meses = historico.slice(-12);
    const mediaMensal = ultimos12Meses.reduce((sum, item) => sum + item.value, 0) / ultimos12Meses.length;
    
    // Gerar projeção para 2026 (12 meses)
    // OTIMIZADO: Usar dateUtils centralizado
    const projecao2026 = [];
    for (let mes = 1; mes <= 12; mes++) {
      const ym = `2026-${String(mes).padStart(2, '0')}`;
      projecao2026.push({
        label: window.dateUtils?.formatMonthYear?.(ym) || `${mes}/2026`,
        value: Math.round(mediaMensal * (1 + (Math.random() * 0.2 - 0.1))) // Variação de ±10%
      });
    }
    
    // Combinar histórico e projeção
    const todosLabels = [...historico.map(h => h.label), ...projecao2026.map(p => p.label)];
    const todosValores = [...historico.map(h => h.value), ...projecao2026.map(p => p.value)];
    
    // Gráfico de tendência mensal com projeção
    const chartMensalEl = document.getElementById('chartProjecaoMensal');
    if (chartMensalEl) {
      if (window.chartProjecaoMensal instanceof Chart) window.chartProjecaoMensal.destroy();
      const ctxMensal = chartMensalEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartProjecaoMensal = new Chart(ctxMensal, {
        type: 'line',
        data: {
          labels: todosLabels,
          datasets: [
            {
              label: 'Histórico',
              data: [...historico.map(h => h.value), ...Array(12).fill(null)],
              borderColor: '#22d3ee',
              backgroundColor: 'rgba(34,211,238,0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            },
            {
              label: 'Projeção 2026',
              data: [...Array(historico.length).fill(null), ...projecao2026.map(p => p.value)],
              borderColor: '#a78bfa',
              backgroundColor: 'rgba(167,139,250,0.1)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'top', labels: { color: '#94a3b8' } },
            tooltip: tooltipFn(),
            datalabels: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartProjecaoMensal, (label, value) => showFeedbackFn(null, label, value), 'chartProjecaoMensal');
    }
    
    // Exibir estatísticas
    const totalHistorico = historico.reduce((sum, item) => sum + item.value, 0);
    const totalProjetado = projecao2026.reduce((sum, item) => sum + item.value, 0);
    
    const totalHistoricoEl = document.getElementById('totalHistorico');
    const totalProjetadoEl = document.getElementById('totalProjetado');
    const mediaMensalEl = document.getElementById('mediaMensal');
    
    if (totalHistoricoEl) totalHistoricoEl.textContent = totalHistorico.toLocaleString('pt-BR');
    if (totalProjetadoEl) totalProjetadoEl.textContent = totalProjetado.toLocaleString('pt-BR');
    if (mediaMensalEl) mediaMensalEl.textContent = Math.round(mediaMensal).toLocaleString('pt-BR');
    
    // Top temas
    const topTemas = temas.slice(0, 10);
    const listaTemasEl = document.getElementById('listaTemasProjecao');
    if (listaTemasEl) {
      listaTemasEl.innerHTML = topTemas.map((item, idx) => `
        <div class="flex items-center gap-3 py-2 border-b border-white/5">
          <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
          <div class="flex-1 text-sm text-slate-300 truncate">${item.tema}</div>
          <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Projeção 2026:', error);
  }
}

/**
 * Carregar Tema
 */
async function loadTema() {
  try {
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/aggregate/by-theme', { fallback: [] }) || [];
    
    // Validar dados
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ Nenhum dado de tema disponível');
      return;
    }
    
    // Mostrar todos os temas, sem limitação
    const labels = data.map(x => x.tema);
    const values = data.map(x => x.quantidade);
    
    // Gráfico de temas
    const chartEl = document.getElementById('chartTema');
    if (chartEl) {
      if (window.chartTema instanceof Chart) window.chartTema.destroy();
      const ctx = chartEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartTema = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Quantidade',
            data: values,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(),
              anchor: 'start',
              align: 'end'
            }
          },
          scales: {
            x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartTema, (label, value) => showFeedbackFn(null, label, value), 'chartTema');
    }
    
    // Status geral (com validação) - CORREÇÃO: Usar sistema global
    const status = await window.dataLoader?.load('/api/stats/status-overview', { fallback: null }) || null;
    const chartStatusEl = document.getElementById('chartStatusTema');
    if (chartStatusEl && status && status.concluida && status.emAtendimento) {
      if (window.chartStatusTema instanceof Chart) window.chartStatusTema.destroy();
      const ctxStatus = chartStatusEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      const concluidaPercent = status.concluida?.percentual || 0;
      const emAtendimentoPercent = status.emAtendimento?.percentual || 0;
      
      window.chartStatusTema = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Concluída', 'Em atendimento'],
          datasets: [{
            data: [concluidaPercent, emAtendimentoPercent],
            backgroundColor: ['#38bdf8', '#fbbf24']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(true),
              anchor: 'center',
              align: 'center'
            }
          }
        }
      });
      addClickFn(window.chartStatusTema, (label, value) => showFeedbackFn(null, label, value), 'chartStatusTema');
    }
    
    const statusInfoEl = document.getElementById('statusTemaInfo');
    if (statusInfoEl && status && status.concluida && status.emAtendimento) {
      statusInfoEl.innerHTML = `
        <div class="text-cyan-300">Concluída: ${status.concluida?.percentual || 0}%</div>
        <div class="text-amber-300">Em atendimento: ${status.emAtendimento?.percentual || 0}%</div>
      `;
    } else if (statusInfoEl) {
      statusInfoEl.innerHTML = '<div class="text-slate-400">Dados de status não disponíveis</div>';
    }
    
    // Gráfico mensal (com validação) - CORREÇÃO: Usar sistema global
    const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
    const labelsMes = (Array.isArray(dataMensal) ? dataMensal : []).map(x => {
      const ym = x.ym || x.month || '';
      if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
      // OTIMIZADO: Usar dateUtils centralizado
      return window.dateUtils?.formatMonthYear?.(ym) || ym;
    });
    const valuesMes = dataMensal.map(x => x.count);
    
    const chartMesEl = document.getElementById('chartTemaMes');
    if (chartMesEl) {
      if (window.chartTemaMes instanceof Chart) window.chartTemaMes.destroy();
      const ctxMes = chartMesEl.getContext('2d');
      
      window.chartTemaMes = new Chart(ctxMes, {
        type: 'bar',
        data: {
          labels: labelsMes,
          datasets: [{
            label: 'Quantidade',
            data: valuesMes,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
    
    // Lista completa de temas
    const listaTemas = document.getElementById('listaTemas');
    if (listaTemas) {
      const maxQuantidade = Math.max(...data.map(d => d.quantidade), 1);
      listaTemas.innerHTML = data.map((item, idx) => {
        const width = (item.quantidade / maxQuantidade) * 100;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.tema}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
    
    const filtrosTemaInfo = document.getElementById('filtrosTemaInfo');
    if (filtrosTemaInfo) {
      const filtros = [];
      if (window.globalFilters?.filters && window.globalFilters.filters.length > 0) {
        window.globalFilters.filters.forEach(f => {
          if (f.field === 'Data' || f.field === 'Mês') {
            const meses = Array.isArray(f.value) ? f.value : [f.value];
            meses.forEach(mes => {
              if (mes && typeof mes === 'string') {
                const parts = mes.split('-');
                // OTIMIZADO: Usar dateUtils centralizado
                if (window.dateUtils?.isValidMonthFormat?.(mes)) {
                  filtros.push(window.dateUtils.formatMonthYearShort(mes));
                } else {
                  filtros.push(`Mês: ${mes}`);
                }
              }
            });
          } else {
            filtros.push(`${f.field}: ${f.value}`);
          }
        });
      }
      if (filtros.length > 0) {
        filtrosTemaInfo.innerHTML = `🔍 Filtros: ${filtros.join(', ')}`;
        filtrosTemaInfo.classList.remove('hidden');
      } else {
        filtrosTemaInfo.innerHTML = '';
        filtrosTemaInfo.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Tema:', error);
  }
}

/**
 * Carregar Assunto
 */
async function loadAssunto() {
  try {
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/aggregate/by-subject', { fallback: [] }) || [];
    
    // Limitar gráfico "Top Assuntos" para Top 15 para melhor legibilidade
    const topAssuntos = data.slice(0, 15);
    const labels = topAssuntos.map(x => {
      const label = x.assunto || 'Não informado';
      return label.length > 50 ? label.substring(0, 47) + '...' : label;
    });
    const labelsFull = topAssuntos.map(x => x.assunto || 'Não informado');
    const values = topAssuntos.map(x => x.quantidade);
    
    // Gráfico de assuntos (Top 15)
    const canvasAssunto = document.getElementById('chartAssunto');
    if (!canvasAssunto) {
      console.warn('Canvas chartAssunto não encontrado');
      return;
    }
    
    if (window.chartAssunto instanceof Chart) {
      try {
        window.chartAssunto.destroy();
      } catch (e) {
        console.warn('Erro ao destruir gráfico anterior:', e);
      }
      window.chartAssunto = null;
    }
    
    // FASE 2.2: Usar timerManager
    // FASE 2.2: Usar timerManager
    await new Promise(resolve => {
      if (window.timerManager) {
        window.timerManager.setTimeout(resolve, 50, 'chart-render-delay');
      } else {
        setTimeout(resolve, 50);
      }
    });
    
    const ctx = canvasAssunto.getContext('2d');
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    window.chartAssunto = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Quantidade',
          data: values,
          backgroundColor: 'rgba(34,211,238,0.7)',
          borderColor: 'rgba(34,211,238,1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const fullLabel = labelsFull[context.dataIndex];
                const value = context.parsed.x;
                return `${fullLabel}: ${value.toLocaleString('pt-BR')}`;
              }
            }
          },
          datalabels: {
            ...dataLabelsFn(),
            anchor: 'start',
            align: 'end',
            display: function(context) {
              return context.dataIndex < 10;
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              maxRotation: 0,
              minRotation: 0,
              callback: function(value, index) {
                return labels[index] || '';
              }
            },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10
          }
        }
      }
    });
    addClickFn(window.chartAssunto, (label, value) => showFeedbackFn(null, label, value), 'chartAssunto');
    
    // Status geral - usar sistema global de carregamento
    const status = await window.dataLoader?.load('/api/stats/status-overview', { fallback: null }) || null;
    const chartStatusEl = document.getElementById('chartStatusAssunto');
    if (chartStatusEl && status && status.concluida && status.emAtendimento) {
      if (window.chartStatusAssunto instanceof Chart) {
        try {
          window.chartStatusAssunto.destroy();
        } catch (e) {
          console.warn('Erro ao destruir gráfico de status anterior:', e);
        }
        window.chartStatusAssunto = null;
      }
      
      // FASE 2.2: Usar timerManager
    // FASE 2.2: Usar timerManager
    await new Promise(resolve => {
      if (window.timerManager) {
        window.timerManager.setTimeout(resolve, 50, 'chart-render-delay');
      } else {
        setTimeout(resolve, 50);
      }
    });
      
      const ctxStatus = chartStatusEl.getContext('2d');
      
      window.chartStatusAssunto = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Concluída', 'Em atendimento'],
          datasets: [{
            data: [
              status?.concluida?.percentual ?? 0, 
              status?.emAtendimento?.percentual ?? 0
            ],
            backgroundColor: ['#38bdf8', '#fbbf24']
          }]
        },
        options: { responsive: true }
      });
    }
    
    // Lista completa de assuntos
    const listaAssuntos = document.getElementById('listaAssuntos');
    if (listaAssuntos) {
      const maxQuantidade = Math.max(...data.map(d => d.quantidade), 1);
      listaAssuntos.innerHTML = data.map((item, idx) => {
        const width = (item.quantidade / maxQuantidade) * 100;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.assunto}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Assunto:', error);
  }
}

/**
 * Carregar Tempo Médio
 * OTIMIZADO: Promise compartilhada e cache
 */
async function loadTempoMedio(forceRefresh = false) {
  const functionName = 'loadTempoMedio';
  
  // Verificar cache
  if (!forceRefresh) {
    const cached = getCachedData(functionName);
    if (cached) {
      await renderTempoMedioData(cached.stats, cached.dataMes);
      return;
    }
  }
  
  // Usar Promise compartilhada
  return getOrCreatePromise(functionName, async () => {
    try {
      // Verificar se a página está visível
      const page = document.getElementById('page-tempo-medio');
      if (!page || page.style.display === 'none') {
        return;
      }
      
      // OTIMIZADO: Carregar dados críticos em paralelo
      const criticalData = await Promise.allSettled([
        window.dataLoader?.load('/api/stats/average-time/stats', { 
          fallback: null,
          timeout: 30000 
        }) || Promise.resolve(null),
        window.dataLoader?.load('/api/stats/average-time/by-month', { 
          fallback: [],
          timeout: 30000 
        }) || Promise.resolve([])
      ]);
    
      const stats = criticalData[0].status === 'fulfilled' ? criticalData[0].value : null;
      const dataMes = criticalData[1].status === 'fulfilled' ? criticalData[1].value : [];
      
      // Salvar no cache
      setCachedData(functionName, { stats, dataMes });
      
      // Renderizar dados críticos
      await renderTempoMedioData(stats, dataMes);
      
      // Carregar dados secundários em background (não bloqueia)
      loadSecondaryTempoMedioData();
    } catch (e) {
      console.error('❌ Erro ao carregar Tempo Médio:', e);
      throw e;
    }
  });
}

/**
 * Carregar dados secundários de Tempo Médio (em background)
 */
function loadSecondaryTempoMedioData() {
  // OTIMIZAÇÃO: Carregar dados secundários sequencialmente com delays (reduz carga no servidor)
  const loadSecondaryData = async () => {
          const results = [];
          
          // Carregar em sequência com pequenos delays para não sobrecarregar o servidor
          const endpoints = [
            '/api/stats/average-time',
            '/api/stats/average-time/by-day',
            '/api/stats/average-time/by-week',
            '/api/stats/average-time/by-unit',
            '/api/stats/average-time/by-month-unit'
          ];
          
          for (let i = 0; i < endpoints.length; i++) {
            try {
              // CORREÇÃO: Usar sistema global de carregamento
              const result = await Promise.allSettled([
                window.dataLoader?.load(endpoints[i], {
                  fallback: [],
                  timeout: 45000, // 45s timeout
                  retries: 1
                }) || Promise.resolve([])
              ]);
              
              results.push(result[0]);
            } catch (e) {
              console.warn(`⚠️ Erro ao carregar ${endpoints[i]}:`, e);
              results.push({ status: 'rejected', reason: e });
            }
            
            // Pequeno delay entre requisições (exceto na última)
            if (i < endpoints.length - 1) {
              // FASE 2.2: Usar timerManager
              await new Promise(resolve => {
                if (window.timerManager) {
                  window.timerManager.setTimeout(resolve, 300, 'request-delay');
                } else {
                  setTimeout(resolve, 300);
                }
              }); // 300ms delay
            }
          }
          
          return results;
        };
    
  loadSecondaryData().then((results) => {
      const data = results[0].status === 'fulfilled' ? results[0].value : [];
      const dataDia = results[1].status === 'fulfilled' ? results[1].value : [];
      const dataSemana = results[2].status === 'fulfilled' ? results[2].value : [];
      const dataUnidade = results[3].status === 'fulfilled' ? results[3].value : [];
      const dataUnidadeMes = results[4].status === 'fulfilled' ? results[4].value : [];
      
      // Renderizar gráfico principal por órgão
      if (data && Array.isArray(data) && data.length > 0) {
        const labels = data.map(x => x.org);
        const values = data.map(x => x.dias);
        
        const chartEl = document.getElementById('chartTempoMedio');
        if (chartEl) {
          if (window.chartTempoMedio instanceof Chart) window.chartTempoMedio.destroy();
          const ctx = chartEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartTempoMedio = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Dias',
                data: values,
                backgroundColor: 'rgba(34,211,238,0.7)',
                borderColor: 'rgba(34,211,238,1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: tooltipFn(),
                datalabels: {
                  ...dataLabelsFn(),
                  anchor: 'start',
                  align: 'end'
                }
              },
              scales: {
                x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
          addClickFn(window.chartTempoMedio, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedio');
        }
        
        // Lista de ranking
        const listaEl = document.getElementById('listaTempoMedio');
        if (listaEl) {
          listaEl.innerHTML = data.map((item, idx) => `
            <div class="flex items-center gap-3 py-2 border-b border-white/5">
              <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
              <div class="flex-1 text-sm text-slate-300 truncate">${item.org}</div>
              <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${item.dias.toFixed(2)}</div>
            </div>
          `).join('');
        }
      } else {
        const chartEl = document.getElementById('chartTempoMedio');
        const listaEl = document.getElementById('listaTempoMedio');
        
        if (chartEl) {
          const ctx = chartEl.getContext('2d');
          ctx.clearRect(0, 0, chartEl.width, chartEl.height);
        }
        if (listaEl) {
          listaEl.innerHTML = '<div class="text-slate-400 text-center py-8">Nenhum dado disponível. Verifique se há registros com data de criação e conclusão.</div>';
        }
      }
      
      // Renderizar gráficos secundários quando disponíveis
      // Gráfico por Dia (linha)
      if (dataDia && Array.isArray(dataDia) && dataDia.length > 0) {
        // OTIMIZADO: Usar dateUtils centralizado
        const labelsDia = dataDia.map(x => {
          if (!x.date) return 'Data inválida';
          return window.dateUtils?.formatDateShort?.(x.date) || 'Data inválida';
        });
        const valuesDia = dataDia.map(x => x.dias || 0);
        
        const chartDiaEl = document.getElementById('chartTempoMedioDia');
        if (chartDiaEl) {
          if (window.chartTempoMedioDia instanceof Chart) window.chartTempoMedioDia.destroy();
          const ctxDia = chartDiaEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartTempoMedioDia = new Chart(ctxDia, {
            type: 'line',
            data: {
              labels: labelsDia,
              datasets: [{
                label: 'Tempo Médio (dias)',
                data: valuesDia,
                borderColor: 'rgba(34,211,238,1)',
                backgroundColor: 'rgba(34,211,238,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              plugins: {
                legend: { display: false },
                tooltip: tooltipFn(),
                datalabels: dataLabelsFn(false, 'line', false)
              },
              scales: {
                y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
          addClickFn(window.chartTempoMedioDia, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioDia');
        }
      }
      
      // Gráfico por Semana (linha)
      if (dataSemana && Array.isArray(dataSemana) && dataSemana.length > 0) {
        const labelsSemana = dataSemana.map(x => {
          if (!x.week || typeof x.week !== 'string') return 'Semana inválida';
          return x.week.replace('W', ' Semana ');
        });
        const valuesSemana = dataSemana.map(x => x.dias || 0);
        
        const chartSemanaEl = document.getElementById('chartTempoMedioSemana');
        if (chartSemanaEl) {
          if (window.chartTempoMedioSemana instanceof Chart) window.chartTempoMedioSemana.destroy();
          const ctxSemana = chartSemanaEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartTempoMedioSemana = new Chart(ctxSemana, {
            type: 'line',
            data: {
              labels: labelsSemana,
              datasets: [{
                label: 'Tempo Médio (dias)',
                data: valuesSemana,
                borderColor: 'rgba(167,139,250,1)',
                backgroundColor: 'rgba(167,139,250,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'line', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedioSemana, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioSemana');
        }
      }
      
      // Gráfico por Unidade de Cadastro
      if (dataUnidade && dataUnidade.length > 0) {
        const labelsUnidade = dataUnidade.map(x => x.unit || 'Não informado');
        const valuesUnidade = dataUnidade.map(x => x.dias || 0);
        
        const chartUnidadeEl = document.getElementById('chartTempoMedioUnidade');
        if (chartUnidadeEl) {
          if (window.chartTempoMedioUnidade instanceof Chart) window.chartTempoMedioUnidade.destroy();
          const ctxUnidade = chartUnidadeEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartTempoMedioUnidade = new Chart(ctxUnidade, {
            type: 'bar',
            data: {
              labels: labelsUnidade,
              datasets: [{
                label: 'Dias',
                data: valuesUnidade,
                backgroundColor: 'rgba(167,139,250,0.7)',
                borderColor: 'rgba(167,139,250,1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: tooltipFn(),
                datalabels: {
                  ...dataLabelsFn(),
                  anchor: 'start',
                  align: 'end'
                }
              },
              scales: {
                x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
          addClickFn(window.chartTempoMedioUnidade, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioUnidade');
        }
      }
      
      // Gráfico por Unidade de Cadastro por Mês
      if (dataUnidadeMes && dataUnidadeMes.length > 0) {
        const meses = [...new Set(dataUnidadeMes.map(d => d.month).filter(m => m && typeof m === 'string' && m.includes('-')))].sort();
        const unidades = [...new Set(dataUnidadeMes.map(d => d.unit).filter(u => u))];
        const colors = ['#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'];
        
        const datasets = unidades.slice(0, 10).map((unit, idx) => ({
          label: unit || 'Não informado',
          data: meses.map(month => {
            const item = dataUnidadeMes.find(d => d.month === month && d.unit === unit);
            return item ? (item.dias || 0) : 0;
          }),
          backgroundColor: colors[idx % colors.length] + '80',
          borderColor: colors[idx % colors.length],
          borderWidth: 1
        }));
        
        // OTIMIZADO: Usar dateUtils centralizado
        const labelsMes = meses.map(m => {
          return window.dateUtils?.formatMonthYear?.(m) || m || 'Data inválida';
        });
        
        const chartUnidadeMesEl = document.getElementById('chartTempoMedioUnidadeMes');
        if (chartUnidadeMesEl) {
          if (window.chartTempoMedioUnidadeMes instanceof Chart) window.chartTempoMedioUnidadeMes.destroy();
          const ctxUnidadeMes = chartUnidadeMesEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          
          window.chartTempoMedioUnidadeMes = new Chart(ctxUnidadeMes, {
            type: 'line',
            data: {
              labels: labelsMes,
              datasets: datasets
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              plugins: {
                legend: { display: true, position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } },
                tooltip: tooltipFn(),
                datalabels: { display: false }
              },
              scales: {
                y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
        }
      }
    }).catch(error => {
      console.error('❌ Erro ao carregar dados secundários de Tempo Médio:', error);
    });
}

/**
 * Renderizar dados de Tempo Médio (extraído para reutilização com cache)
 */
async function renderTempoMedioData(stats, dataMes) {
  try {
    // Atualizar estatísticas gerais
    if (stats) {
      const statMedia = document.getElementById('statMedia');
      const statMediana = document.getElementById('statMediana');
      const statMinimo = document.getElementById('statMinimo');
      const statMaximo = document.getElementById('statMaximo');
      
      if (statMedia) statMedia.textContent = stats.media || '0';
      if (statMediana) statMediana.textContent = stats.mediana || '0';
      if (statMinimo) statMinimo.textContent = stats.minimo || '0';
      if (statMaximo) statMaximo.textContent = stats.maximo || '0';
    }
    
    // Renderizar gráfico por mês (dados críticos)
    if (dataMes && Array.isArray(dataMes) && dataMes.length > 0) {
      const labelsMes = dataMes.map(x => {
        if (!x.month) return 'Mês inválido';
        try {
          const [year, month] = x.month.split('-');
          return `${month}/${year}`;
        } catch (e) {
          return x.month;
        }
      });
      const valuesMes = dataMes.map(x => x.dias || 0);
      
      const chartMesEl = document.getElementById('chartTempoMedioMes');
      if (chartMesEl) {
        if (window.chartTempoMedioMes instanceof Chart) window.chartTempoMedioMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        window.chartTempoMedioMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Tempo Médio (dias)',
              data: valuesMes,
              backgroundColor: 'rgba(34,211,238,0.7)',
              borderColor: 'rgba(34,211,238,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: {
                ...dataLabelsFn(),
                anchor: 'end',
                align: 'top'
              }
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedioMes, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioMes');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao renderizar dados de Tempo Médio:', error);
  }
}

/**
 * Função auxiliar: Criar gráfico de barras horizontal genérico
 */
function createHorizontalBarChart(chartId, labels, values, color, options = {}) {
  const chartEl = document.getElementById(chartId);
  if (!chartEl) return;
  
  if (window[`chart${chartId.replace('chart', '')}`] instanceof Chart) {
    window[`chart${chartId.replace('chart', '')}`].destroy();
  }
  
  const ctx = chartEl.getContext('2d');
  const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
  const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
  const addClickFn = window.charts?.addChartClickHandler || (() => {});
  const showFeedbackFn = window.showClickFeedback || (() => {});
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: options.label || 'Dados',
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: tooltipFn(),
        datalabels: {
          ...dataLabelsFn(options.showDataLabels !== false, 'bar', options.anchor === 'start'),
          ...(options.anchor === 'start' ? { anchor: 'start', align: 'end' } : {})
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
  
  window[`chart${chartId.replace('chart', '')}`] = chart;
  addClickFn(chart, (label, value) => showFeedbackFn(null, label, value), chartId);
  
  return chart;
}

/**
 * Carregar Categoria
 */
async function loadCategoria(forceRefresh = false) {
  const functionName = 'loadCategoria';
  
  if (!forceRefresh) {
    const cached = getCachedData(functionName);
    if (cached !== null) return;
  }
  
  return getOrCreatePromise(functionName, async () => {
    try {
      const page = document.getElementById('page-categoria');
      if (!page || page.style.display === 'none') return;
      
      // Usar sistema global de carregamento
      const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Categoria', { fallback: [] }) || [];
    const labels = data.slice(0, 15).map(x => x.key);
    const values = data.slice(0, 15).map(x => x.count);
    
    createHorizontalBarChart('chartCategoria', labels, values, '#f472b6', {
      label: 'Categoria',
      showDataLabels: true,
      anchor: 'start'
    });
    
    // Heatmap
    const hm = await window.dataLoader?.load('/api/aggregate/heatmap?dim=Categoria', { fallback: { labels: [], rows: [] } }) || { labels: [], rows: [] };
    buildHeatmap('heatmapCategoria', hm.labels || [], hm.rows || []);
    
    // Gráfico mensal
    const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
    if (dataMensal && dataMensal.length > 0) {
      // OTIMIZADO: Usar dateUtils centralizado
      const labelsMes = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
      });
      const valuesMes = dataMensal.map(x => x.count || 0);
      
      const chartMesEl = document.getElementById('chartCategoriaMes');
      if (chartMesEl) {
        if (window.chartCategoriaMes instanceof Chart) window.chartCategoriaMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartCategoriaMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Manifestações',
              data: valuesMes,
              backgroundColor: 'rgba(244,114,182,0.7)',
              borderColor: 'rgba(244,114,182,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
    
    setCachedData(functionName, { data });
    } catch (error) {
      console.error('❌ Erro ao carregar Categoria:', error);
      throw error;
    }
  });
}

/**
 * Carregar Status Page
 */
async function loadStatusPage(forceRefresh = false) {
  const functionName = 'loadStatusPage';
  
  if (!forceRefresh) {
    const cached = getCachedData(functionName);
    if (cached !== null) return;
  }
  
  return getOrCreatePromise(functionName, async () => {
    try {
      const page = document.getElementById('page-status');
      if (!page || page.style.display === 'none') return;
      
      // Usar sistema global de carregamento
      const data = await window.dataLoader?.load('/api/aggregate/count-by?field=status', { fallback: [] }) || [];
    
    if (!data || data.length === 0) {
      console.warn('⚠️ Nenhum dado de status disponível');
      const ctx = document.getElementById('chartStatusPage')?.getContext('2d');
      if (ctx && window.chartStatusPage instanceof Chart) {
        window.chartStatusPage.destroy();
        window.chartStatusPage = null;
      }
      return;
    }
    
    const labels = data.map(x => x.key || 'Não informado');
    const values = data.map(x => x.count || 0);
    
    const chartEl = document.getElementById('chartStatusPage');
    if (!chartEl) return;
    
    if (window.chartStatusPage instanceof Chart) window.chartStatusPage.destroy();
    const ctx = chartEl.getContext('2d');
    
    const colors = ['#38bdf8', '#22d3ee', '#fbbf24', '#34d399', '#fb7185', '#e879f9', '#a78bfa', '#8b5cf6', '#06b6d4', '#10b981'];
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    window.chartStatusPage = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map((_, i) => colors[i % colors.length])
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } },
          tooltip: tooltipFn(),
          datalabels: dataLabelsFn(true, 'doughnut')
        }
      }
    });
    
    addClickFn(window.chartStatusPage, (label, value) => showFeedbackFn(null, label, value), 'chartStatusPage');
    
    setCachedData(functionName, { data });
    } catch (error) {
      console.error('❌ Erro ao carregar Status Page:', error);
      throw error;
    }
  });
}

/**
 * Carregar Bairro
 */
async function loadBairro(forceRefresh = false) {
  const functionName = 'loadBairro';
  
  if (!forceRefresh) {
    const cached = getCachedData(functionName);
    if (cached !== null) return;
  }
  
  return getOrCreatePromise(functionName, async () => {
    try {
      const page = document.getElementById('page-bairro');
      if (!page || page.style.display === 'none') return;
      
      // Usar sistema global de carregamento
      const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Bairro', { fallback: [] }) || [];
    const labels = data.slice(0, 15).map(x => x.key);
    const values = data.slice(0, 15).map(x => x.count);
    
    createHorizontalBarChart('chartBairro', labels, values, '#f59e0b', {
      label: 'Bairro',
      anchor: 'start'
    });
    
    // Heatmap
    const hm = await window.dataLoader?.load('/api/aggregate/heatmap?dim=Bairro', { fallback: { labels: [], rows: [] } }) || { labels: [], rows: [] };
    buildHeatmap('heatmapBairro', hm.labels || [], hm.rows || []);
    
    // Gráfico mensal
    const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
    if (dataMensal && dataMensal.length > 0) {
      // OTIMIZADO: Usar dateUtils centralizado
      const labelsMes = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
      });
      const valuesMes = dataMensal.map(x => x.count || 0);
      
      const chartMesEl = document.getElementById('chartBairroMes');
      if (chartMesEl) {
        if (window.chartBairroMes instanceof Chart) window.chartBairroMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartBairroMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Manifestações',
              data: valuesMes,
              backgroundColor: 'rgba(245,158,11,0.7)',
              borderColor: 'rgba(245,158,11,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
    
    setCachedData(functionName, { data });
    } catch (error) {
      console.error('❌ Erro ao carregar Bairro:', error);
      throw error;
    }
  });
}

/**
 * Carregar UAC
 */
async function loadUAC(forceRefresh = false) {
  const functionName = 'loadUAC';
  
  if (!forceRefresh) {
    const cached = getCachedData(functionName);
    if (cached !== null) return;
  }
  
  return getOrCreatePromise(functionName, async () => {
    try {
      const page = document.getElementById('page-uac');
      if (!page || page.style.display === 'none') return;
      
      // Usar sistema global de carregamento
      const data = await window.dataLoader?.load('/api/aggregate/count-by?field=UAC', { fallback: [] }) || [];
    const labels = data.slice(0, 15).map(x => x.key);
    const values = data.slice(0, 15).map(x => x.count);
    
    createHorizontalBarChart('chartUAC', labels, values, '#34d399', {
      label: 'UAC',
      anchor: 'start'
    });
    
    // Heatmap
    const hm = await window.dataLoader?.load('/api/aggregate/heatmap?dim=UAC', { fallback: { labels: [], rows: [] } }) || { labels: [], rows: [] };
    buildHeatmap('heatmapUAC', hm.labels || [], hm.rows || []);
    
    setCachedData(functionName, { data });
    } catch (error) {
      console.error('❌ Erro ao carregar UAC:', error);
      throw error;
    }
  });
}

/**
 * Carregar Responsável
 */
async function loadResponsavel() {
  try {
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Responsavel', { fallback: [] }) || [];
    const labels = data.slice(0, 15).map(x => x.key);
    const values = data.slice(0, 15).map(x => x.count);
    
    createHorizontalBarChart('chartResponsavel', labels, values, '#8b5cf6', {
      label: 'Responsável',
      anchor: 'start'
    });
    
    // Heatmap
    const hm = await window.dataLoader?.load('/api/aggregate/heatmap?dim=Responsavel', { fallback: { labels: [], rows: [] } }) || { labels: [], rows: [] };
    buildHeatmap('heatmapResponsavel', hm.labels || [], hm.rows || []);
  } catch (error) {
    console.error('❌ Erro ao carregar Responsável:', error);
  }
}

/**
 * Carregar Canal
 */
async function loadCanal(forceRefresh = false) {
  const functionName = 'loadCanal';
  
  if (!forceRefresh) {
    const cached = getCachedData(functionName);
    if (cached !== null) return;
  }
  
  return getOrCreatePromise(functionName, async () => {
    try {
      const page = document.getElementById('page-canal');
      if (!page || page.style.display === 'none') return;
      
      // Usar sistema global de carregamento
      const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Canal', { fallback: [] }) || [];
    const labels = data.map(x => x.key);
    const values = data.map(x => x.count);
    
    const chartEl = document.getElementById('chartCanal');
    if (!chartEl) return;
    
    if (window.chartCanal instanceof Chart) window.chartCanal.destroy();
    const ctx = chartEl.getContext('2d');
    
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    window.chartCanal = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'Canal',
          data: values,
          backgroundColor: ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'right', labels: { color: '#94a3b8' } },
          tooltip: tooltipFn(),
          datalabels: dataLabelsFn(true, 'pie')
        }
      }
    });
    
    addClickFn(window.chartCanal, (label, value) => showFeedbackFn(null, label, value), 'chartCanal');
    
    setCachedData(functionName, { data });
    } catch (error) {
      console.error('❌ Erro ao carregar Canal:', error);
      throw error;
    }
  });
}

/**
 * Carregar Prioridade
 */
async function loadPrioridade(forceRefresh = false) {
  const functionName = 'loadPrioridade';
  
  if (!forceRefresh) {
    const cached = getCachedData(functionName);
    if (cached !== null) return;
  }
  
  return getOrCreatePromise(functionName, async () => {
    try {
      const page = document.getElementById('page-prioridade');
      if (!page || page.style.display === 'none') return;
      
      // Usar sistema global de carregamento
      const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Prioridade', { fallback: [] }) || [];
    const labels = data.map(x => x.key);
    const values = data.map(x => x.count);
    
    const chartEl = document.getElementById('chartPrioridade');
    if (!chartEl) return;
    
    if (window.chartPrioridade instanceof Chart) window.chartPrioridade.destroy();
    const ctx = chartEl.getContext('2d');
    
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    window.chartPrioridade = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Prioridade',
          data: values,
          backgroundColor: '#fb7185',
          borderColor: '#fb7185',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: tooltipFn(),
          datalabels: dataLabelsFn(false, 'bar', false)
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
    
    addClickFn(window.chartPrioridade, (label, value) => showFeedbackFn(null, label, value), 'chartPrioridade');
    
    setCachedData(functionName, { data });
    } catch (error) {
      console.error('❌ Erro ao carregar Prioridade:', error);
      throw error;
    }
  });
}

// ============================================
// CORA CHAT - Sistema de Chat
// ============================================

// Variável global para mensagens do chat (compartilhada)
window.chatMessages = window.chatMessages || [];
let chatMessages = window.chatMessages;

/**
 * Formatar data/hora para chat
 */
function formatChatTime(date) {
  const now = new Date();
  const msgDate = new Date(date);
  const diffMs = now - msgDate;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
  return msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * Renderizar mensagens do chat
 */
function renderChatMessages(containerId, messages) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = messages.map(msg => {
    const isUser = msg.sender === 'user';
    return `
      <div class="flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}">
        ${!isUser ? `
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span class="text-white text-sm font-bold">C</span>
          </div>
        ` : `
          <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span class="text-white text-xs">Você</span>
          </div>
        `}
        <div class="flex-1 ${isUser ? 'text-right' : ''}">
          <div class="bg-slate-800/60 rounded-lg p-3 text-sm text-slate-200 inline-block ${isUser ? 'bg-cyan-500/20' : ''}">
            ${!isUser ? `<div class="font-semibold text-purple-300 mb-1">Cora</div>` : ''}
            <div>${msg.text}</div>
          </div>
          <div class="text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : 'ml-1'}">${formatChatTime(msg.createdAt)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  // Scroll para o final
  container.scrollTop = container.scrollHeight;
}

/**
 * Carregar mensagens do chat (CORREÇÃO: usa sistema global)
 */
async function loadChatMessages() {
  try {
    // CORREÇÃO: Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/chat/messages', {
      fallback: { messages: [] },
      timeout: 30000
    }) || { messages: [] };
    
    window.chatMessages = data.messages || [];
    chatMessages = window.chatMessages;
    if (chatMessages.length === 0) {
      // Mensagem inicial
      chatMessages.push({
        text: 'Olá! Sou a Cora, sua assistente virtual. Como posso ajudar você hoje?',
        sender: 'cora',
        createdAt: new Date().toISOString()
      });
      window.chatMessages = chatMessages;
    }
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
    window.chatMessages = [{
      text: 'Olá! Sou a Cora, sua assistente virtual. Como posso ajudar você hoje?',
      sender: 'cora',
      createdAt: new Date().toISOString()
    }];
    chatMessages = window.chatMessages;
  }
}

/**
 * Enviar mensagem do chat (CORREÇÃO: usa sistema global)
 */
async function sendChatMessage(text, isWidget = false) {
  console.log('🚀 sendChatMessage chamada', { text, isWidget });
  if (!text.trim()) {
    console.warn('⚠️ Texto vazio, ignorando');
    return;
  }
  
  const message = {
    text: text.trim(),
    sender: 'user',
    createdAt: new Date().toISOString()
  };
  
  console.log('💬 Adicionando mensagem do usuário', message);
  
  // Adicionar mensagem do usuário
  chatMessages.push(message);
  window.chatMessages = chatMessages; // Sincronizar
  renderChatMessages(isWidget ? 'chatWidgetMessages' : 'chatMessages', chatMessages);
  
  // Limpar input
  const inputId = isWidget ? 'chatWidgetInput' : 'chatInput';
  const inputEl = document.getElementById(inputId);
  if (inputEl) {
    inputEl.value = '';
  }
  
  try {
    console.log('📡 Enviando para backend...');
    // CORREÇÃO: Usar sistema global para POST
    const data = await window.api?.fetchJSON('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() })
    }) || { response: 'Obrigada pela sua mensagem! Como posso ajudar?' };
    
    console.log('✅ Resposta recebida do backend', data);
    
    // Adicionar resposta da Cora
    const coraMessage = {
      text: data.response || 'Obrigada pela sua mensagem! Como posso ajudar?',
      sender: 'cora',
      createdAt: new Date().toISOString()
    };
    
    console.log('🤖 Adicionando resposta da Cora', coraMessage);
    chatMessages.push(coraMessage);
    window.chatMessages = chatMessages; // Sincronizar
    renderChatMessages(isWidget ? 'chatWidgetMessages' : 'chatMessages', chatMessages);
    
    // Salvar resposta também (CORREÇÃO: usar sistema global)
    try {
      await window.api?.fetchJSON('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: coraMessage.text, sender: 'cora' })
      });
    } catch (e) {
      console.warn('⚠️ Erro ao salvar resposta da Cora:', e);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    const errorMsg = {
      text: 'Desculpe, ocorreu um erro. Tente novamente.',
      sender: 'cora',
      createdAt: new Date().toISOString()
    };
    chatMessages.push(errorMsg);
    window.chatMessages = chatMessages; // Sincronizar
    renderChatMessages(isWidget ? 'chatWidgetMessages' : 'chatMessages', chatMessages);
  }
}

/**
 * Carregar página do chat
 */
async function loadCoraChat() {
  await loadChatMessages();
  chatMessages = window.chatMessages; // Sincronizar
  renderChatMessages('chatMessages', chatMessages);
}

/**
 * Inicializar widget flutuante do chat
 */
function initChatWidget() {
  const toggle = document.getElementById('chatWidgetToggle');
  const chatWindow = document.getElementById('chatWidgetWindow'); // CORREÇÃO: renomeado para evitar conflito com window global
  const close = document.getElementById('chatWidgetClose');
  const form = document.getElementById('chatWidgetForm');
  const input = document.getElementById('chatWidgetInput');
  const submitBtn = document.getElementById('chatWidgetSubmitBtn');
  
  if (!form || !input) {
    console.warn('Elementos do widget de chat não encontrados');
    return;
  }
  
  console.log('✅ Widget de chat inicializado', { form: !!form, input: !!input, submitBtn: !!submitBtn });
  
  if (toggle) {
    toggle.addEventListener('click', async () => {
      if (chatWindow && chatWindow.classList.contains('hidden')) {
        await loadChatMessages();
        chatMessages = window.chatMessages; // Sincronizar
        renderChatMessages('chatWidgetMessages', chatMessages);
      }
      if (chatWindow) chatWindow.classList.toggle('hidden');
    });
  }
  
  if (close) {
    close.addEventListener('click', () => {
      if (chatWindow) chatWindow.classList.add('hidden');
    });
  }
  
  const sendWidgetMessage = (e) => {
    console.log('📤 Tentando enviar mensagem do widget', input.value);
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = input.value.trim();
    if (text) {
      sendChatMessage(text, true);
      input.value = '';
    }
    return false;
  };
  
  // Adicionar listeners
  form.onsubmit = sendWidgetMessage;
  
  if (submitBtn) {
    submitBtn.onclick = sendWidgetMessage;
  }
  
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('⌨️ Enter pressionado no widget');
      e.preventDefault();
      e.stopPropagation();
      sendWidgetMessage(e);
    }
  };
  
  // Carregar mensagens iniciais
  loadChatMessages().then(() => {
    chatMessages = window.chatMessages; // Sincronizar
  });
}

/**
 * Inicializar formulário da página do chat
 */
function initChatPage() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const submitBtn = document.getElementById('chatSubmitBtn');
  
  if (!form || !input) {
    console.warn('Elementos da página de chat não encontrados');
    return;
  }
  
  console.log('✅ Página de chat inicializada', { form: !!form, input: !!input, submitBtn: !!submitBtn });
  
  const sendPageMessage = (e) => {
    console.log('📤 Tentando enviar mensagem da página', input.value);
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = input.value.trim();
    console.log('📝 Texto capturado:', text);
    if (text) {
      console.log('✅ Chamando sendChatMessage...');
      sendChatMessage(text, false);
    } else {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Texto vazio, não enviando');
      } else {
        console.warn('⚠️ Texto vazio, não enviando');
      }
    }
    return false;
  };
  
  // Adicionar listeners
  console.log('🔗 Anexando listeners ao formulário da página');
  form.onsubmit = sendPageMessage;
  
  if (submitBtn) {
    submitBtn.onclick = (e) => {
      console.log('🖱️ Botão Enviar clicado');
      sendPageMessage(e);
    };
  }
  
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('⌨️ Enter pressionado na página');
      e.preventDefault();
      e.stopPropagation();
      sendPageMessage(e);
    }
  };
}

// Exportar funções globalmente para compatibilidade
window.reloadAllData = reloadAllData;
window.loadKpisWithData = loadKpisWithData;
window.loadKpis = loadKpis;
// Chat functions globais
window.loadCoraChat = loadCoraChat;
window.loadChatMessages = loadChatMessages;
window.sendMessage = sendChatMessage; // Alias para compatibilidade
window.renderMessages = renderChatMessages; // Alias para compatibilidade
window.formatChatTime = formatChatTime;
window.initChatWidget = initChatWidget;
window.initChatPage = initChatPage;

