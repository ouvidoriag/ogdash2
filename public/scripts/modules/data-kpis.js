/**
 * Módulo: KPIs
 * Funções relacionadas a carregamento e renderização de KPIs
 * Extraído de data.js para melhor organização
 */

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
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('loadKpisWithData: KPI Total renderizado:', totalValue);
      }
    }
    if (kpi7El && sum && (sum.last7 !== undefined && sum.last7 !== null)) {
      const last7Value = (sum.last7 ?? 0).toLocaleString('pt-BR');
      kpi7El.textContent = last7Value;
      kpi7El.style.display = '';
      kpi7El.offsetHeight; // Trigger reflow
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('loadKpisWithData: KPI 7 dias renderizado:', last7Value);
      }
    }
    if (kpi30El && sum && (sum.last30 !== undefined && sum.last30 !== null)) {
      const last30Value = (sum.last30 ?? 0).toLocaleString('pt-BR');
      kpi30El.textContent = last30Value;
      kpi30El.style.display = '';
      kpi30El.offsetHeight; // Trigger reflow
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('loadKpisWithData: KPI 30 dias renderizado:', last30Value);
      }
    }
    
    // Se a função completa estiver disponível, chamar ela para renderização completa (gráficos, etc)
    // Mas não esperar - já renderizamos os números básicos acima
    // CORREÇÃO: Adicionar pequeno delay para garantir que renderização básica foi aplicada
    // FASE 2.2: Usar timerManager para gerenciar timeout
    const timerId = window.timerManager 
      ? window.timerManager.setTimeout(() => {
          if (typeof window.renderKpisImplementation === 'function') {
            // Chamar em background - não bloquear
            window.renderKpisImplementation(sum, dailyData, byMonth).catch((e) => {
              if (window.Logger) {
                window.Logger.warn('Erro ao renderizar KPIs completos via loadKpisWithData (não crítico):', e);
              } else {
                console.warn('⚠️ Erro ao renderizar KPIs completos via loadKpisWithData (não crítico):', e);
              }
            });
          } else if (window.data?.renderKpis) {
            // Usar wrapper do módulo (que também chama a implementação)
            window.data.renderKpis(sum, dailyData, byMonth).catch((e) => {
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
              console.warn('⚠️ Erro ao renderizar KPIs via wrapper loadKpisWithData (não crítico):', e);
            });
          }
        }, 100);
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro com fallback
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar KPIs com dados:', error);
    } else {
      console.error('❌ Erro ao carregar KPIs com dados:', error);
    }
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
    // FASE 2.1: Usar Logger em vez de console.log
    if (window.Logger) {
      window.Logger.debug('loadKpis: Usando sistema global (dataLoader)');
    } else {
      console.log('📊 loadKpis: Usando sistema global (dataLoader)');
    }
    
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
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Elementos KPI não encontrados:', { 
          kpiTotal: !!kpiTotalEl, 
          kpi7: !!kpi7El, 
          kpi30: !!kpi30El,
          pageMain: !!document.getElementById('page-main'),
          pageMainVisible: document.getElementById('page-main')?.style.display !== 'none'
        });
      } else {
        console.warn('⚠️ Elementos KPI não encontrados:', {
          kpiTotal: !!kpiTotalEl, 
          kpi7: !!kpi7El, 
          kpi30: !!kpi30El,
          pageMain: !!document.getElementById('page-main'),
          pageMainVisible: document.getElementById('page-main')?.style.display !== 'none'
        });
      }
    }
    
    // CORREÇÃO: Verificar se página está visível antes de renderizar
    const pageMain = document.getElementById('page-main');
    const isPageVisible = pageMain && pageMain.style.display !== 'none';
    
    // FASE 2.1: Usar Logger (apenas em dev)
    if (window.Logger) {
      window.Logger.debug('loadKpis: Verificando visibilidade da página', {
        pageMainExists: !!pageMain,
        isPageVisible,
        sumExists: !!sum
      });
    }
    
    if (!isPageVisible) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Página main não está visível, aguardando...');
      } else {
        console.warn('⚠️ Página main não está visível, aguardando...');
      }
      // Aguardar um pouco e tentar novamente
      // FASE 2.2: Usar timerManager
      const retryTimerId = window.timerManager 
        ? window.timerManager.setTimeout(() => {
            const retryPageMain = document.getElementById('page-main');
            if (retryPageMain && retryPageMain.style.display !== 'none') {
              if (window.Logger) {
                window.Logger.debug('Tentando renderizar novamente após página ficar visível');
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
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('KPI Total renderizado:', totalValue);
      }
    }
    if (kpi7El && sum && (sum.last7 !== undefined && sum.last7 !== null)) {
      const last7Value = (sum.last7 ?? 0).toLocaleString('pt-BR');
      kpi7El.textContent = last7Value;
      kpi7El.style.display = '';
      kpi7El.offsetHeight; // Trigger reflow
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('KPI 7 dias renderizado:', last7Value);
      }
    }
    if (kpi30El && sum && (sum.last30 !== undefined && sum.last30 !== null)) {
      const last30Value = (sum.last30 ?? 0).toLocaleString('pt-BR');
      kpi30El.textContent = last30Value;
      kpi30El.style.display = '';
      kpi30El.offsetHeight; // Trigger reflow
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('KPI 30 dias renderizado:', last30Value);
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
              if (window.Logger) {
                window.Logger.warn('Erro ao renderizar KPIs completos (não crítico):', e);
              } else {
                console.warn('⚠️ Erro ao renderizar KPIs completos (não crítico):', e);
              }
            });
          } else if (window.data?.renderKpis) {
            // Usar wrapper do módulo (que também chama a implementação)
            window.data.renderKpis(sum, dailyData, byMonth).catch((e) => {
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
              console.warn('⚠️ Erro ao renderizar KPIs completos (não crítico):', e);
            });
          } else if (window.data?.renderKpis) {
            window.data.renderKpis(sum, dailyData, byMonth).catch((e) => {
              console.warn('⚠️ Erro ao renderizar KPIs via wrapper (não crítico):', e);
            });
          }
        }, 100);
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro com fallback
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar KPIs:', error);
    } else {
      console.error('❌ Erro ao carregar KPIs:', error);
    }
    // Renderizar valores padrão mesmo em caso de erro
    const kpiTotalEl = document.getElementById('kpiTotal');
    const kpi7El = document.getElementById('kpi7');
    const kpi30El = document.getElementById('kpi30');
    if (kpiTotalEl) kpiTotalEl.textContent = '0';
    if (kpi7El) kpi7El.textContent = '0';
    if (kpi30El) kpi30El.textContent = '0';
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.dataKpis = {
    loadKpis,
    loadKpisWithData,
    renderKpis
  };
  
  // Manter compatibilidade com window.data
  if (!window.data) window.data = {};
  window.data.loadKpis = loadKpis;
  window.data.loadKpisWithData = loadKpisWithData;
  window.data.renderKpis = renderKpis;
}

