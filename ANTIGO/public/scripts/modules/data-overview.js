/**
 * Módulo: Visão Geral (Overview)
 * Funções relacionadas à página principal e visão geral
 * Extraído de data.js para melhor organização
 * 
 * Versão: 2025-01-27 - Correção de sintaxe
 */

// Importar dependências (será carregado após data-kpis.js)
// As funções loadKpisWithData e loadKpis devem estar disponíveis globalmente

/**
 * Carregar dados da visão geral
 */
async function loadOverview(forceRefresh = false) {
  // DEBUG: Log para verificar se função está sendo chamada
  if (window.Logger) {
    window.Logger.debug('📊 loadOverview chamada (data-overview.js)');
  } else {
    console.log('📊 loadOverview chamada (data-overview.js)');
  }
  
  // Verificar se a página está visível
  const pageMain = document.getElementById('page-main');
  if (!pageMain || pageMain.style.display === 'none') {
    if (window.Logger) {
      window.Logger.warn('⚠️ Página main não está visível, aguardando...');
    } else {
      console.warn('⚠️ Página main não está visível, aguardando...');
    }
    // Aguardar até a página ficar visível
    return new Promise((resolve) => {
      const checkVisibility = setInterval(() => {
        const page = document.getElementById('page-main');
        if (page && page.style.display !== 'none') {
          clearInterval(checkVisibility);
          // Tentar novamente após página ficar visível
          setTimeout(() => loadOverview(forceRefresh).then(resolve).catch(resolve), 100);
        }
      }, 100);
      // Timeout após 5 segundos
      setTimeout(() => {
        clearInterval(checkVisibility);
        resolve();
      }, 5000);
    });
  }
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Usar cache para evitar múltiplas requisições simultâneas
    const cacheKey = 'loadOverview';
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(cacheKey, 5000);
      if (cached !== null) {
        if (window.Logger) {
          window.Logger.debug('📊 Usando cache de loadOverview');
        }
        return cached;
      }
    }
    
    // Usar Promise compartilhada para evitar execuções simultâneas
    const loadOverviewPromise = window.dataUtils?.getOrCreatePromise(cacheKey, async () => {
      try {
        if (window.Logger) {
          window.Logger.debug('📊 Iniciando carregamento de dados (ETAPA 1: KPIs)');
        }
        
        // NOVA ESTRATÉGIA: Usar endpoint centralizado /api/dashboard-data
        // Uma única requisição retorna todos os datasets necessários
        let dashboardData = null;
        
        // Verificar se dados já estão no dataStore
        if (window.dataStore) {
          dashboardData = window.dataStore.get('dashboardData', 5000);
        }
        
        // Se não estiver no store, carregar do endpoint centralizado
        if (!dashboardData) {
          if (window.Logger) {
            window.Logger.debug('📊 Carregando dados do endpoint centralizado /api/dashboard-data');
          }
          dashboardData = await window.dataLoader?.load('/api/dashboard-data', { 
            fallback: {
              totalManifestations: 0,
              last7Days: 0,
              last30Days: 0,
              manifestationsByMonth: [],
              manifestationsByDay: [],
              manifestationsByStatus: [],
              manifestationsByTheme: [],
              manifestationsBySubject: [],
              manifestationsByOrgan: [],
              manifestationsBySecretaria: []
            }
          }) || {
            totalManifestations: 0,
            last7Days: 0,
            last30Days: 0,
            manifestationsByMonth: [],
            manifestationsByDay: [],
            manifestationsByStatus: [],
            manifestationsByTheme: [],
            manifestationsBySubject: [],
            manifestationsByOrgan: [],
            manifestationsBySecretaria: []
          };
        }
        
        // Transformar dados do formato centralizado para formato esperado
        const summary = {
          total: dashboardData.totalManifestations || 0,
          last7: dashboardData.last7Days || 0,
          last30: dashboardData.last30Days || 0,
          statusCounts: dashboardData.manifestationsByStatus || []
        };
        
        const dailyData = dashboardData.manifestationsByDay || [];
        const byMonth = dashboardData.manifestationsByMonth || [];
        const orgaos = dashboardData.manifestationsByOrgan || [];
        const temas = dashboardData.manifestationsByTheme || [];
        
        if (window.Logger) {
          window.Logger.debug('📊 Dados centralizados carregados, renderizando...', {
            total: summary.total,
            byMonth: byMonth.length,
            orgaos: orgaos.length,
            temas: temas.length
          });
        }
        
        // Renderizar KPIs imediatamente
        if (window.data?.loadKpisWithData) {
          await window.data.loadKpisWithData(summary, dailyData, byMonth);
        } else if (window.loadKpisWithData) {
          await window.loadKpisWithData(summary, dailyData, byMonth);
        }
        
        if (window.Logger) {
          window.Logger.debug('📊 Dados carregados, renderizando gráficos...', {
            byMonth: byMonth?.length || 0,
            orgaos: orgaos?.length || 0,
            temas: temas?.length || 0
          });
        }
        
        // Renderizar dados principais
        await renderOverviewData(summary, byMonth, orgaos, temas, dailyData);
        
        if (window.Logger) {
          window.Logger.debug('✅ loadOverview concluída com sucesso');
        }
        
        // Cachear resultado (também já está no dataStore via dataLoader)
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(cacheKey, { summary, byMonth, orgaos, temas, dailyData });
        }
        
        return { summary, byMonth, orgaos, temas, dailyData, dashboardData };
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error('Erro ao carregar visão geral:', error);
        } else {
          console.error('❌ Erro ao carregar visão geral:', error);
        }
        throw error;
      }
    });
    
    return loadOverviewPromise;
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar visão geral:', error);
    } else {
      console.error('❌ Erro ao carregar visão geral:', error);
    }
    // Retornar dados vazios para não quebrar a aplicação
    return {
      summary: { total: 0, last7: 0, last30: 0, statusCounts: [] },
      byMonth: [],
      orgaos: [],
      temas: [],
      dailyData: []
    };
  }
}

/**
 * Renderizar dados da visão geral (extraído para reutilização com cache)
 */
async function renderOverviewData(summary, byMonth, orgaos, temas, dailyData) {
  // DIAGNÓSTICO: Iniciar rastreamento
  if (window.diagnostic) {
    window.diagnostic.start('renderOverviewData');
  }
  
  try {
    // LOG DE DIAGNÓSTICO: Verificar dados recebidos
    console.log('🔍 DIAGNÓSTICO - Dados recebidos em renderOverviewData:', {
      hasSummary: !!summary,
      summaryTotal: summary?.total,
      byMonthLength: byMonth?.length || 0,
      orgaosLength: orgaos?.length || 0,
      temasLength: temas?.length || 0,
      dailyDataLength: dailyData?.length || 0
    });
    
    if (window.Logger) {
      window.Logger.debug('🎨 renderOverviewData iniciada', {
        hasSummary: !!summary,
        byMonthLength: byMonth?.length || 0,
        orgaosLength: orgaos?.length || 0,
        temasLength: temas?.length || 0
      });
    }
    
    // KPIs já foram renderizados antes, apenas atualizar com byMonth se necessário
    if (byMonth && window.data?.loadKpisWithData) {
      // Atualizar sparklines com dados mensais
      await window.data.loadKpisWithData(summary, dailyData, byMonth);
    }
    
    // Guardar summary para reutilizar (garantir estrutura correta)
    let summaryData = summary;
    
    // CORREÇÃO: Garantir que summaryData tem statusCounts
    if (!summaryData.statusCounts && summary.statusCounts) {
      summaryData.statusCounts = summary.statusCounts;
    }

    // OTIMIZAÇÃO: Criar gráficos em sequência priorizada (não todos de uma vez)
    // Verificar se a página está visível ANTES de criar gráficos
    const pageMain = document.getElementById('page-main');
    if (!pageMain || pageMain.style.display === 'none') {
      if (window.Logger) {
        window.Logger.warn('⚠️ Página main não está visível, aguardando antes de criar gráficos...');
      }
      // Aguardar até a página ficar visível
      await new Promise((resolve) => {
        const checkVisibility = setInterval(() => {
          const page = document.getElementById('page-main');
          if (page && page.style.display !== 'none') {
            clearInterval(checkVisibility);
            resolve();
          }
        }, 100);
        // Timeout após 3 segundos
        setTimeout(() => {
          clearInterval(checkVisibility);
          resolve();
        }, 3000);
      });
    }
    
    // DIAGNÓSTICO: Verificar elementos antes de criar gráficos
    if (window.diagnostic) {
      window.diagnostic.checkElement('chartTrend', 'chartTrend');
      window.diagnostic.checkElement('chartTopOrgaos', 'chartTopOrgaos');
      window.diagnostic.checkElement('chartTopTemas', 'chartTopTemas');
      window.diagnostic.checkElement('chartFunnelStatus', 'chartFunnelStatus');
      window.diagnostic.checkElement('insightsAIBox', 'insightsAIBox');
      window.diagnostic.checkElement('statusOverviewEl', 'statusOverviewEl');
    }
    
    // Prioridade 1: Gráfico de tendência (mais importante)
    console.log('🔍 DIAGNÓSTICO - Tentando criar gráfico de tendência, byMonth:', byMonth);
    if (window.diagnostic) window.diagnostic.start('createTrendChart');
    if (window.Logger) {
      window.Logger.debug('📈 Criando gráfico de tendência...');
    }
    await createTrendChart(byMonth);
    console.log('🔍 DIAGNÓSTICO - Gráfico de tendência criado (ou tentado)');
    if (window.diagnostic) window.diagnostic.success('createTrendChart');
    
    // Prioridade 2: Top Órgãos e Top Temas (carregar em paralelo após tendência)
    console.log('🔍 DIAGNÓSTICO - Tentando criar gráficos Top Órgãos e Top Temas');
    console.log('🔍 DIAGNÓSTICO - orgaos:', orgaos);
    console.log('🔍 DIAGNÓSTICO - temas:', temas);
    if (window.Logger) {
      window.Logger.debug('📊 Criando gráficos Top Órgãos e Top Temas...');
    }
    if (window.diagnostic) {
      window.diagnostic.start('createTopOrgaosChart');
      window.diagnostic.start('createTopTemasChart');
    }
    await Promise.all([
      createTopOrgaosChart(orgaos).then(() => {
        console.log('🔍 DIAGNÓSTICO - Gráfico Top Órgãos criado com sucesso');
        if (window.diagnostic) window.diagnostic.success('createTopOrgaosChart');
      }).catch(err => {
        console.error('🔍 DIAGNÓSTICO - Erro ao criar gráfico Top Órgãos:', err);
        if (window.diagnostic) window.diagnostic.error('createTopOrgaosChart', err);
      }),
      createTopTemasChart(temas).then(() => {
        console.log('🔍 DIAGNÓSTICO - Gráfico Top Temas criado com sucesso');
        if (window.diagnostic) window.diagnostic.success('createTopTemasChart');
      }).catch(err => {
        console.error('🔍 DIAGNÓSTICO - Erro ao criar gráfico Top Temas:', err);
        if (window.diagnostic) window.diagnostic.error('createTopTemasChart', err);
      })
    ]);
    
    // Prioridade 3: Funil por Status (menos crítico)
    if (window.Logger) {
      window.Logger.debug('📊 Criando gráfico Funil por Status...');
    }
    if (window.diagnostic) window.diagnostic.start('createFunnelChart');
    await createFunnelChart(summaryData);
    if (window.diagnostic) window.diagnostic.success('createFunnelChart');
    
    // Prioridade 4: Dados secundários (carregar depois)
    if (window.Logger) {
      window.Logger.debug('📊 Carregando dados secundários...');
    }
    if (window.diagnostic) window.diagnostic.start('loadSecondaryData');
    await loadSecondaryData(summaryData, byMonth, orgaos, temas);
    if (window.diagnostic) window.diagnostic.success('loadSecondaryData');
    
    if (window.Logger) {
      window.Logger.debug('✅ renderOverviewData concluída');
    }
    
    // DIAGNÓSTICO: Sucesso
    if (window.diagnostic) {
      window.diagnostic.success('renderOverviewData', {
        hasSummary: !!summary,
        byMonthCount: byMonth?.length || 0,
        orgaosCount: orgaos?.length || 0,
        temasCount: temas?.length || 0
      });
    }
    
  } catch (e) {
    // DIAGNÓSTICO: Erro
    if (window.diagnostic) {
      window.diagnostic.error('renderOverviewData', e, {
        hasSummary: !!summary,
        byMonthCount: byMonth?.length || 0,
        orgaosCount: orgaos?.length || 0,
        temasCount: temas?.length || 0
      });
    }
    
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao renderizar dados da visão geral:', e);
    } else {
      console.error('❌ Erro ao renderizar dados da visão geral:', e);
    }
  }
}

/**
 * Criar gráfico de tendência (prioridade 1)
 * NOVA ESTRATÉGIA: Usa Chart Factory e reatividade do dataStore
 */
async function createTrendChart(byMonth) {
  return new Promise((resolve) => {
    console.log('🔍 DIAGNÓSTICO createTrendChart - Iniciando, byMonth:', byMonth);
    
    // Verificar se a página está visível
    const pageMain = document.getElementById('page-main');
    console.log('🔍 DIAGNÓSTICO createTrendChart - pageMain:', pageMain, 'display:', pageMain?.style.display);
    if (!pageMain || pageMain.style.display === 'none') {
      console.warn('🔍 DIAGNÓSTICO createTrendChart - Página não está visível!');
      if (window.Logger) {
        window.Logger.warn('⚠️ Página main não está visível, não criando gráfico de tendência');
      }
      resolve();
      return;
    }
    
    // NOVA ESTRATÉGIA: Inscrever-se para mudanças nos dados mensais
    if (window.dataStore) {
      const unsubscribe = window.dataStore.subscribe('/api/aggregate/by-month', (newData) => {
        if (newData && Array.isArray(newData) && newData.length > 0) {
          if (window.Logger) {
            window.Logger.debug('📊 Dados mensais atualizados via dataStore, atualizando gráfico de tendência');
          }
          // Atualizar gráfico com novos dados
          updateTrendChart(newData);
        }
      });
      
      // Armazenar função de unsubscribe para limpeza posterior
      if (!window._dataStoreUnsubscribes) {
        window._dataStoreUnsubscribes = new Map();
      }
      window._dataStoreUnsubscribes.set('chartTrend', unsubscribe);
    }
    
    // Renderizar gráfico inicial
    updateTrendChart(byMonth);
    resolve();
  });
}

/**
 * Atualizar gráfico de tendência (função auxiliar reutilizável)
 * @param {Array} byMonth - Dados mensais
 */
function updateTrendChart(byMonth) {
  // Suportar tanto formato antigo (x.ym) quanto novo (x.month)
    const labels = byMonth && byMonth.length > 0 ? byMonth.map(x => {
      const ym = x.ym || x.month || '';
      return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
    }) : [];
    const values = byMonth && byMonth.length > 0 ? byMonth.map(x => x.count || 0) : [];
    
  console.log('🔍 DIAGNÓSTICO updateTrendChart - labels:', labels.length, 'values:', values.length);
    
    if (window.chartTrend instanceof Chart) window.chartTrend.destroy();
    
    // Aguardar um pouco para garantir que o DOM está pronto
    setTimeout(() => {
      const chartTrendEl = document.getElementById('chartTrend');
    console.log('🔍 DIAGNÓSTICO updateTrendChart - Elemento encontrado:', !!chartTrendEl);
      
      if (!chartTrendEl) {
      console.error('🔍 DIAGNÓSTICO updateTrendChart - Elemento chartTrend NÃO encontrado no DOM!');
        if (window.Logger) {
          window.Logger.warn('⚠️ Elemento chartTrend não encontrado no DOM após delay');
        }
        return;
      }
      
      // Verificar se o elemento está visível
      const rect = chartTrendEl.getBoundingClientRect();
    console.log('🔍 DIAGNÓSTICO updateTrendChart - Rect:', rect.width, 'x', rect.height);
      if (rect.width === 0 || rect.height === 0) {
      console.warn('🔍 DIAGNÓSTICO updateTrendChart - Elemento não está visível (width ou height = 0)');
        if (window.Logger) {
          window.Logger.warn('⚠️ Elemento chartTrend não está visível (width ou height = 0)');
        }
        return;
      }
    
      const ctxTrend = chartTrendEl.getContext('2d');
    console.log('🔍 DIAGNÓSTICO updateTrendChart - Context:', !!ctxTrend);
    if (!ctxTrend) {
      if (window.Logger) {
        window.Logger.warn('⚠️ Contexto chartTrend não encontrado');
      }
      return;
    }
    
        if (labels.length === 0 || values.length === 0) {
      // Criar gráfico vazio silenciosamente
          if (byMonth && Array.isArray(byMonth) && byMonth.length === 0) {
            window.chartTrend = new Chart(ctxTrend, {
              type: 'line',
              data: { labels: ['Sem dados'], datasets: [{ label: 'Manifestações', data: [0], borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.1)' }] },
              options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } } }
            });
          }
          return;
    }
    
    // NOVA ESTRATÉGIA: Usar Chart Factory
    if (window.chartFactory && window.chartFactory.createLineChart) {
      requestAnimationFrame(() => {
        try {
          console.log('🔍 DIAGNÓSTICO updateTrendChart - Criando Chart com Chart Factory');
          if (window.Logger) {
            window.Logger.debug('📈 Criando Chart de tendência com Chart Factory');
          }
          window.chartTrend = window.chartFactory.createLineChart('chartTrend', labels, values, {
            label: 'Manifestações',
            borderColor: '#22d3ee',
            gradient: { from: '#06b6d4', to: '#22d3ee' },
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3,
            onClick: (label, value) => {
              if (window.showClickFeedback) {
                window.showClickFeedback(null, label, value);
              }
            }
          });
          console.log('🔍 DIAGNÓSTICO updateTrendChart - ✅ Gráfico criado com sucesso!');
          if (window.Logger) {
            window.Logger.debug('✅ Gráfico de tendência criado com sucesso');
          }
        } catch (error) {
          console.error('🔍 DIAGNÓSTICO updateTrendChart - ❌ ERRO ao criar gráfico:', error);
          if (window.Logger) {
            window.Logger.error('Erro ao criar gráfico de tendência:', error);
          }
        }
      });
        } else {
      // Fallback: método antigo
          const gradientFn = window.utils?.gradient || (() => 'rgba(34,211,238,0.35)');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => ({}));
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          const gradientBg = typeof gradientFn === 'function' ? gradientFn(ctxTrend, 'rgba(34,211,238,0.35)', 'rgba(34,211,238,0.05)') : 'rgba(34,211,238,0.35)';
          
          requestAnimationFrame(() => {
            try {
          console.log('🔍 DIAGNÓSTICO updateTrendChart - Criando Chart com método antigo');
              if (window.Logger) {
                window.Logger.debug('📈 Criando Chart de tendência com', labels.length, 'pontos');
              }
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
              animation: false,
                  maintainAspectRatio: true,
                  plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: { display: false } },
                  scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } }
                }
              });
              addClickFn(window.chartTrend, (label, value) => showFeedbackFn(null, label, value), 'chartTrend');
          console.log('🔍 DIAGNÓSTICO updateTrendChart - ✅ Gráfico criado com sucesso!');
              if (window.Logger) {
                window.Logger.debug('✅ Gráfico de tendência criado com sucesso');
              }
            } catch (error) {
          console.error('🔍 DIAGNÓSTICO updateTrendChart - ❌ ERRO ao criar gráfico:', error);
              if (window.Logger) {
                window.Logger.error('Erro ao criar gráfico de tendência:', error);
          }
        }
      });
      }
      }, 100); // Delay de 100ms para garantir que DOM está pronto
}

/**
 * Criar gráfico Top Órgãos (prioridade 2)
 * NOVA ESTRATÉGIA: Usa Chart Factory e reatividade do dataStore
 */
async function createTopOrgaosChart(orgaos) {
  return new Promise((resolve) => {
    console.log('🔍 DIAGNÓSTICO createTopOrgaosChart - Iniciando, orgaos:', orgaos);
    
    // Verificar se a página está visível
    const pageMain = document.getElementById('page-main');
    if (!pageMain || pageMain.style.display === 'none') {
      console.warn('🔍 DIAGNÓSTICO createTopOrgaosChart - Página não está visível!');
      resolve();
      return;
    }
    
    // NOVA ESTRATÉGIA: Inscrever-se para mudanças nos dados de órgãos
    if (window.dataStore) {
      const unsubscribe = window.dataStore.subscribe('/api/aggregate/count-by?field=Orgaos', (newData) => {
        if (newData && Array.isArray(newData) && newData.length > 0) {
          if (window.Logger) {
            window.Logger.debug('📊 Dados de órgãos atualizados via dataStore, atualizando gráfico');
          }
          updateTopOrgaosChart(newData);
        }
      });
      
      // Armazenar função de unsubscribe
      if (!window._dataStoreUnsubscribes) {
        window._dataStoreUnsubscribes = new Map();
      }
      window._dataStoreUnsubscribes.set('chartTopOrgaos', unsubscribe);
    }
    
    // Renderizar gráfico inicial
    updateTopOrgaosChart(orgaos);
    resolve();
  });
}

/**
 * Atualizar gráfico Top Órgãos (função auxiliar reutilizável)
 * @param {Array} orgaos - Dados de órgãos
 */
function updateTopOrgaosChart(orgaos) {
    const orgLabels = orgaos?.slice(0, 10).map(x => x.key) || [];
    const orgValues = orgaos?.slice(0, 10).map(x => x.count) || [];
  console.log('🔍 DIAGNÓSTICO updateTopOrgaosChart - labels:', orgLabels.length, 'values:', orgValues.length);
    
    if (window.chartTopOrgaos instanceof Chart) window.chartTopOrgaos.destroy();
    
    // Aguardar um pouco para garantir que o DOM está pronto
    setTimeout(() => {
      const chartTopOrgaosEl = document.getElementById('chartTopOrgaos');
    console.log('🔍 DIAGNÓSTICO updateTopOrgaosChart - Elemento encontrado:', !!chartTopOrgaosEl);
      
      if (!chartTopOrgaosEl || orgLabels.length === 0 || orgValues.length === 0) {
      console.warn('🔍 DIAGNÓSTICO updateTopOrgaosChart - Elemento não encontrado ou dados vazios!');
        return;
      }
      
      // Verificar se o elemento está visível
      const rect = chartTopOrgaosEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
      console.warn('🔍 DIAGNÓSTICO updateTopOrgaosChart - Elemento não está visível');
        return;
      }
      
    // NOVA ESTRATÉGIA: Usar Chart Factory
    if (window.chartFactory && window.chartFactory.createBarChart) {
      requestAnimationFrame(() => {
        try {
          console.log('🔍 DIAGNÓSTICO updateTopOrgaosChart - Criando Chart com Chart Factory');
          window.chartTopOrgaos = window.chartFactory.createBarChart('chartTopOrgaos', orgLabels, orgValues, {
            horizontal: true,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            label: 'Órgãos',
            onClick: (label, value) => {
              if (window.showClickFeedback) {
                window.showClickFeedback(null, label, value);
              }
            }
          });
          console.log('🔍 DIAGNÓSTICO updateTopOrgaosChart - ✅ Gráfico criado com sucesso!');
        } catch (error) {
          console.error('🔍 DIAGNÓSTICO updateTopOrgaosChart - ❌ ERRO:', error);
          if (window.Logger) {
            window.Logger.error('Erro ao criar gráfico Top Órgãos:', error);
          }
        }
      });
    } else {
      // Fallback: método antigo
      const ctxOrg = chartTopOrgaosEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    requestAnimationFrame(() => {
      try {
        window.chartTopOrgaos = new Chart(ctxOrg, {
          type: 'bar',
          data: { labels: orgLabels, datasets: [{ data: orgValues, backgroundColor: 'rgba(167,139,250,0.7)', borderColor: 'rgba(167,139,250,1)', borderWidth: 1 }] },
          options: { 
            responsive: true, 
            animation: false,
            maintainAspectRatio: true,
            indexAxis: 'y', 
            plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
            scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
          }
        });
        addClickFn(window.chartTopOrgaos, (label, value) => showFeedbackFn(null, label, value), 'chartTopOrgaos');
          console.log('🔍 DIAGNÓSTICO updateTopOrgaosChart - ✅ Gráfico criado com sucesso!');
      } catch (error) {
          console.error('🔍 DIAGNÓSTICO updateTopOrgaosChart - ❌ ERRO:', error);
        if (window.Logger) {
          window.Logger.error('Erro ao criar gráfico Top Órgãos:', error);
        }
      }
  });
    }
  }, 100);
}

/**
 * Criar gráfico Top Temas (prioridade 2)
 * NOVA ESTRATÉGIA: Usa Chart Factory e reatividade do dataStore
 */
async function createTopTemasChart(temas) {
  return new Promise((resolve) => {
    console.log('🔍 DIAGNÓSTICO createTopTemasChart - Iniciando, temas:', temas);
    
    // Verificar se a página está visível
    const pageMain = document.getElementById('page-main');
    if (!pageMain || pageMain.style.display === 'none') {
      console.warn('🔍 DIAGNÓSTICO createTopTemasChart - Página não está visível!');
      resolve();
      return;
    }
    
    // NOVA ESTRATÉGIA: Inscrever-se para mudanças nos dados de temas
    if (window.dataStore) {
      const unsubscribe = window.dataStore.subscribe('/api/aggregate/by-theme', (newData) => {
        if (newData && Array.isArray(newData) && newData.length > 0) {
          if (window.Logger) {
            window.Logger.debug('📊 Dados de temas atualizados via dataStore, atualizando gráfico');
          }
          updateTopTemasChart(newData);
        }
      });
      
      // Armazenar função de unsubscribe
      if (!window._dataStoreUnsubscribes) {
        window._dataStoreUnsubscribes = new Map();
      }
      window._dataStoreUnsubscribes.set('chartTopTemas', unsubscribe);
    }
    
    // Renderizar gráfico inicial
    updateTopTemasChart(temas);
    resolve();
  });
}

/**
 * Atualizar gráfico Top Temas (função auxiliar reutilizável)
 * @param {Array} temas - Dados de temas
 */
function updateTopTemasChart(temas) {
  const temaLabels = temas?.slice(0, 10).map(x => x.tema || x.theme) || [];
  const temaValues = temas?.slice(0, 10).map(x => x.quantidade || x.count || 0) || [];
  console.log('🔍 DIAGNÓSTICO updateTopTemasChart - labels:', temaLabels.length, 'values:', temaValues.length);
    
    if (window.chartTopTemas instanceof Chart) window.chartTopTemas.destroy();
    
    // Aguardar um pouco para garantir que o DOM está pronto
    setTimeout(() => {
      const chartTopTemasEl = document.getElementById('chartTopTemas');
    console.log('🔍 DIAGNÓSTICO updateTopTemasChart - Elemento encontrado:', !!chartTopTemasEl);
      
      if (!chartTopTemasEl || temaLabels.length === 0 || temaValues.length === 0) {
      console.warn('🔍 DIAGNÓSTICO updateTopTemasChart - Elemento não encontrado ou dados vazios!');
        return;
      }
      
      // Verificar se o elemento está visível
      const rect = chartTopTemasEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
      console.warn('🔍 DIAGNÓSTICO updateTopTemasChart - Elemento não está visível');
        return;
      }
      
    // NOVA ESTRATÉGIA: Usar Chart Factory
    if (window.chartFactory && window.chartFactory.createBarChart) {
      requestAnimationFrame(() => {
        try {
          console.log('🔍 DIAGNÓSTICO updateTopTemasChart - Criando Chart com Chart Factory');
          window.chartTopTemas = window.chartFactory.createBarChart('chartTopTemas', temaLabels, temaValues, {
            horizontal: true,
            backgroundColor: 'rgba(34,211,238,0.7)',
            borderColor: 'rgba(34,211,238,1)',
            label: 'Temas',
            onClick: (label, value) => {
              if (window.showClickFeedback) {
                window.showClickFeedback(null, label, value);
              }
            }
          });
          console.log('🔍 DIAGNÓSTICO updateTopTemasChart - ✅ Gráfico criado com sucesso!');
          if (window.Logger) {
            window.Logger.debug('✅ Gráfico Top Temas criado com sucesso');
          }
        } catch (error) {
          console.error('🔍 DIAGNÓSTICO updateTopTemasChart - ❌ ERRO:', error);
          if (window.Logger) {
            window.Logger.error('Erro ao criar gráfico Top Temas:', error);
          }
        }
      });
    } else {
      // Fallback: método antigo
      const ctxTemas = chartTopTemasEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => ({}));
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      requestAnimationFrame(() => {
        try {
          window.chartTopTemas = new Chart(ctxTemas, {
            type: 'bar',
            data: { labels: temaLabels, datasets: [{ data: temaValues, backgroundColor: 'rgba(34,211,238,0.7)', borderColor: 'rgba(34,211,238,1)', borderWidth: 1 }] },
            options: { 
              responsive: true, 
              animation: false,
              maintainAspectRatio: true,
              indexAxis: 'y', 
              plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
              scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
            }
          });
          addClickFn(window.chartTopTemas, (label, value) => showFeedbackFn(null, label, value), 'chartTopTemas');
          console.log('🔍 DIAGNÓSTICO updateTopTemasChart - ✅ Gráfico criado com sucesso!');
        } catch (error) {
          console.error('🔍 DIAGNÓSTICO updateTopTemasChart - ❌ ERRO:', error);
          if (window.Logger) {
            window.Logger.error('Erro ao criar gráfico Top Temas:', error);
          }
        }
  });
    }
  }, 100);
}

/**
 * Criar gráfico Funil por Status (prioridade 3)
 */
async function createFunnelChart(summaryData) {
  return new Promise((resolve) => {
    // Verificar se a página está visível
    const pageMain = document.getElementById('page-main');
    if (!pageMain || pageMain.style.display === 'none') {
      resolve();
      return;
    }
    
    const statusCounts = (summaryData?.statusCounts || []).slice(0, 6);
    const funilLabels = statusCounts.map(s => s.status || s.key || 'Não informado');
    const funilValues = statusCounts.map(s => s.count || s.quantidade || 0);
    
    if (window.chartFunnelStatus instanceof Chart) window.chartFunnelStatus.destroy();
    
    // Aguardar um pouco para garantir que o DOM está pronto
    setTimeout(() => {
      const chartFunnelStatusEl = document.getElementById('chartFunnelStatus');
      
      if (!chartFunnelStatusEl || funilLabels.length === 0 || funilValues.length === 0) {
        resolve();
        return;
      }
      
      // Verificar se o elemento está visível
      const rect = chartFunnelStatusEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        resolve();
        return;
      }
      const ctxFunnel = chartFunnelStatusEl.getContext('2d');
      if (!ctxFunnel) {
        resolve();
        return;
      }
      
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => ({}));
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      // NOVA ESTRATÉGIA: Usar Chart Factory
      if (window.chartFactory && window.chartFactory.createBarChart) {
        requestAnimationFrame(() => {
          try {
            // Criar array de cores da paleta
            const palette = window.chartFactory.getColorPalette();
            const colors = funilLabels.map((_, idx) => 
              window.chartFactory.getColorWithAlpha(palette[idx % palette.length], 0.7)
            );
            
            window.chartFactory.createBarChart('chartFunnelStatus', funilLabels, funilValues, {
              label: 'Status',
              backgroundColor: colors,
              onClick: (event, elements, chart) => {
                if (elements.length > 0 && window.showClickFeedback) {
                  const index = elements[0].index;
                  const label = chart.data.labels[index];
                  const value = chart.data.datasets[0].data[index];
                  window.showClickFeedback(null, label, value);
                }
              }
            });
            
            if (window.Logger) {
              window.Logger.debug('✅ Gráfico Funil Status criado com sucesso (Chart Factory)');
            }
          } catch (error) {
            if (window.Logger) {
              window.Logger.error('Erro ao criar gráfico Funil Status:', error);
            }
          }
          resolve();
        });
      } else {
        // Fallback: método antigo
      requestAnimationFrame(() => {
        try {
          window.chartFunnelStatus = new Chart(ctxFunnel, {
            type: 'bar',
            data: { labels: funilLabels, datasets: [{ data: funilValues, backgroundColor: ['#22d3ee','#a78bfa','#34d399','#f59e0b','#fb7185','#e879f9'] }] },
            options: { 
              responsive: true, 
              animation: false,
              maintainAspectRatio: true,
              plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
              scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } } 
            }
          });
          addClickFn(window.chartFunnelStatus, (label, value) => showFeedbackFn(null, label, value), 'chartFunnelStatus');
          if (window.Logger) {
            window.Logger.debug('✅ Gráfico Funil Status criado com sucesso');
          }
        } catch (error) {
          if (window.Logger) {
            window.Logger.error('Erro ao criar gráfico Funil Status:', error);
          }
        }
        resolve();
      });
      }
    }, 100); // Delay de 100ms
  });
}

/**
 * Carregar dados secundários (insights, heatmap, gráficos avançados)
 */
async function loadSecondaryData(summaryData, byMonth, orgaos, temas) {
  // Processar dados de tendência para deltas
  const values = byMonth && byMonth.length > 0 ? byMonth.map(x => x.count || 0) : [];
  const totalNow = values[values.length-1] || 0;
  const totalPrev = values[values.length-2] || 0;
  const delta = totalPrev ? (((totalNow-totalPrev)/totalPrev)*100).toFixed(1) : 0;
  const deltaEl = document.getElementById('kpiTotalDelta');
  if (deltaEl) deltaEl.textContent = `${delta>=0?'+':''}${delta}% vs mês anterior`;

  // Desenhar sparkline
  if (window.drawSpark && values.length > 0) {
    window.drawSpark('sparkTotal', values.slice(-12), '#22d3ee');
  }

  // Carregar insights e status overview em background (não bloquear)
  // DIAGNÓSTICO: Rastrear carregamento
  if (window.diagnostic) {
    window.diagnostic.start('loadAIInsights');
    window.diagnostic.start('loadStatusOverview');
  }
  
  Promise.allSettled([
    loadAIInsights()
      .then(() => {
        if (window.diagnostic) window.diagnostic.success('loadAIInsights');
      })
      .catch((err) => {
        if (window.diagnostic) window.diagnostic.error('loadAIInsights', err);
      }),
    loadStatusOverview(summaryData)
      .then(() => {
        if (window.diagnostic) window.diagnostic.success('loadStatusOverview');
      })
      .catch((err) => {
        if (window.diagnostic) window.diagnostic.error('loadStatusOverview', err);
      })
  ]);

  // Insights básicos
  const insights = [];
  if (orgaos?.length) insights.push(`Maior volume: ${orgaos[0].key} (${orgaos[0].count.toLocaleString('pt-BR')}).`);
  if (values.length > 2) {
    const upIdx = values[values.length-1] - values[values.length-2];
    if (upIdx > 0) insights.push(`Crescimento de ${upIdx.toLocaleString('pt-BR')} em relação ao mês anterior.`);
  }
  
  // Buscar dados adicionais em background
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
    if (tempoMedioStats?.media) {
      insights.push(`Tempo Médio de Resposta global: ${tempoMedioStats.media.toFixed(1)} dias.`);
    }
    
    const insightsBox = document.getElementById('insightsBox');
    if (insightsBox) {
      insightsBox.innerHTML = insights.length ? insights.map(t=>`<div class="text-slate-400">• ${t}</div>`).join('') : '<div class="text-slate-500">Sem insights básicos no momento.</div>';
    }
  });
  
  // Exibir insights iniciais
  const insightsBox = document.getElementById('insightsBox');
  if (insightsBox) {
    insightsBox.innerHTML = insights.length ? insights.map(t=>`<div>• ${t}</div>`).join('') : '<div class="text-slate-500">Carregando insights...</div>';
  }

  // Heatmap dinâmico - configurar listener
  const dimSel = document.getElementById('heatmapDim');
  if (dimSel) {
    const newDimSel = dimSel.cloneNode(true);
    dimSel.parentNode.replaceChild(newDimSel, dimSel);
    
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
        
        if (window.buildHeatmap) {
          window.buildHeatmap('heatmap', hm.labels || [], hm.rows || []);
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error('Erro ao carregar heatmap:', error);
        }
        heatmapContainer.innerHTML = '<div class="p-4 text-center text-red-400">Erro ao carregar heatmap</div>';
      }
    });
    
    // Disparar evento inicial
    newDimSel.dispatchEvent(new Event('change'));
  }
  
  // Carregar gráficos avançados em background (última prioridade)
  setTimeout(() => {
    if (window.data?.loadAdvancedCharts) {
      window.data.loadAdvancedCharts(temas, orgaos).catch(() => {});
    } else if (window.loadAdvancedCharts) {
      window.loadAdvancedCharts(temas, orgaos).catch(() => {});
    }
  }, 2000); // Aguardar 2 segundos antes de carregar gráficos avançados
}

/**
 * Carregar insights com IA
 */
async function loadAIInsights() {
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
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
    // CORREÇÃO FASE 1.3: Tratamento de erro
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
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Se summaryData foi passado, reutilizar (evita requisição duplicada)
    let statusOverview = summaryData;
    
    if (!statusOverview) {
      // Buscar dados se não foram passados
      statusOverview = await window.dataLoader?.load('/api/stats/status-overview', { 
        fallback: { statusCounts: [] }
      }) || { statusCounts: [] };
    }
    
    const statusCounts = statusOverview?.statusCounts || [];
    // CORREÇÃO: O elemento HTML é 'statusOverviewCards', não 'statusOverview'
    const statusOverviewEl = document.getElementById('statusOverviewCards') || document.getElementById('statusOverview');
    
    if (!statusOverviewEl) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.debug('Elemento statusOverviewCards não encontrado (opcional)');
      }
      return;
    }
    
    if (!statusCounts || statusCounts.length === 0) {
      statusOverviewEl.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado de status disponível.</div>';
      return;
    }
    
    // Renderizar cards de status
    const statusColors = {
      'Aberto': 'bg-blue-500/20 border-blue-500/50',
      'Em Andamento': 'bg-amber-500/20 border-amber-500/50',
      'Resolvido': 'bg-emerald-500/20 border-emerald-500/50',
      'Fechado': 'bg-slate-500/20 border-slate-500/50',
      'Cancelado': 'bg-red-500/20 border-red-500/50'
    };
    
    statusOverviewEl.innerHTML = statusCounts.slice(0, 5).map(status => `
      <div class="glass rounded-lg p-4 border ${statusColors[status.status] || 'bg-slate-500/20 border-slate-500/50'}">
        <div class="flex items-center justify-between">
          <div class="font-semibold text-slate-200">${status.status || 'Não informado'}</div>
          <div class="text-2xl font-bold text-cyan-300">${(status.count || 0).toLocaleString('pt-BR')}</div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar status overview:', error);
    } else {
      console.error('❌ Erro ao carregar status overview:', error);
    }
    const statusOverviewEl = document.getElementById('statusOverview');
    if (statusOverviewEl) {
      statusOverviewEl.innerHTML = '<div class="text-center text-red-400 py-4">Erro ao carregar status. Tente novamente.</div>';
    }
  }
}

// Exportar funções para uso global
// IMPORTANTE: Executar imediatamente quando o script carregar (síncrono)
// Não usar IIFE - exportar diretamente para garantir que está disponível antes de data.js
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  
  // Marcar função como vinda do módulo (para evitar sobrescrita)
  loadOverview._fromModule = true;
  
  // Exportar IMEDIATAMENTE (antes de data.js executar)
  window.data.loadOverview = loadOverview;
  window.data.renderOverviewData = renderOverviewData;
  window.data.loadAIInsights = loadAIInsights;
  window.data.loadStatusOverview = loadStatusOverview;
  
  // Exportar também como variáveis globais para compatibilidade
  window.loadOverview = loadOverview;
  window.renderOverviewData = renderOverviewData;
  window.loadAIInsights = loadAIInsights;
  window.loadStatusOverview = loadStatusOverview;
  
  // Log imediato para debug
  if (window.Logger) {
    window.Logger.debug('✅ Módulo data-overview.js exportado com prioridade');
  } else {
    console.log('✅ Módulo data-overview.js exportado com prioridade');
  }
}

