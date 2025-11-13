/**
 * Módulo: Utilitários e Helpers
 * Sistema de cache, Promises compartilhadas e funções auxiliares
 * Extraído de data.js para melhor organização
 */

/**
 * Sistema de Cache Genérico para funções load*
 * TTL padrão: 5 segundos
 */
const functionCache = new Map();

function getCachedData(functionName, ttl = 5000) {
  const cached = functionCache.get(functionName);
  if (cached && (Date.now() - cached.timestamp) < ttl) {
    return cached.data;
  }
  return null;
}

function setCachedData(functionName, data) {
  functionCache.set(functionName, {
    data,
    timestamp: Date.now()
  });
}

function clearCache(functionName = null) {
  if (functionName) {
    functionCache.delete(functionName);
  } else {
    functionCache.clear();
  }
}

/**
 * Sistema de Proteção contra Execuções Simultâneas
 * Reutiliza Promise compartilhada em vez de loops
 */
const runningPromises = new Map();

function getOrCreatePromise(functionName, promiseFactory) {
  if (runningPromises.has(functionName)) {
    return runningPromises.get(functionName);
  }
  
  const promise = promiseFactory()
    .then(result => {
      runningPromises.delete(functionName);
      return result;
    })
    .catch(error => {
      runningPromises.delete(functionName);
      throw error;
    });
  
  runningPromises.set(functionName, promise);
  return promise;
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
        console.error(`❌ Erro em ${functionName}:`, e);
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
        await window.data.loadOverview(true); // Force refresh
      }
    }
    
    // Recarregar dados específicos da página atual
    const pageLoaders = {
      'orgao-mes': () => window.data?.loadOrgaoMes?.(true),
      'tempo-medio': () => window.data?.loadTempoMedio?.(true),
      'tema': () => window.data?.loadTema?.(),
      'assunto': () => window.data?.loadAssunto?.(),
      'cadastrante': () => window.data?.loadCadastrante?.(),
      'reclamacoes': () => window.data?.loadReclamacoes?.(),
      'projecao-2026': () => window.data?.loadProjecao2026?.(),
      'status': () => window.data?.loadStatusPage?.(true),
      'bairro': () => window.data?.loadBairro?.(true),
      'uac': () => window.data?.loadUAC?.(true),
      'responsavel': () => window.data?.loadResponsavel?.(),
      'canal': () => window.data?.loadCanal?.(true),
      'prioridade': () => window.data?.loadPrioridade?.(true),
      'categoria': () => window.data?.loadCategoria?.(true)
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
        }, 100, 'reloadAllData-highlights')
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
 * Buscar dados do servidor (função auxiliar)
 */
async function fetchDataFromServer() {
  try {
    return await window.dataLoader?.load('/api/records', { fallback: { rows: [], total: 0 } }) || { rows: [], total: 0 };
  } catch (error) {
    console.error('❌ Erro ao buscar dados do servidor:', error);
    return { rows: [], total: 0 };
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.dataUtils = {
    getCachedData,
    setCachedData,
    clearCache,
    getOrCreatePromise,
    createOptimizedLoader,
    reloadAllData,
    fetchDataFromServer
  };
  
  // Manter compatibilidade com window.data
  if (!window.data) window.data = {};
  window.data.reloadAllData = reloadAllData;
  window.data.clearCache = clearCache;
  window.data.getOrCreatePromise = getOrCreatePromise;
  window.data.getCachedData = getCachedData;
  window.data.setCachedData = setCachedData;
  
  // Exportar também como variáveis globais para compatibilidade
  window.getCachedData = getCachedData;
  window.setCachedData = setCachedData;
  window.clearCache = clearCache;
  window.getOrCreatePromise = getOrCreatePromise;
  window.createOptimizedLoader = createOptimizedLoader;
  window.reloadAllData = reloadAllData;
}

