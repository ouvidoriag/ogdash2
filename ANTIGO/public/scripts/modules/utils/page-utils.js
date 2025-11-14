/**
 * Utilitários Comuns para Carregamento de Páginas
 * Elimina duplicação de código entre funções load*
 */

/**
 * Verifica se uma página está visível no DOM
 * @param {string} pageId - ID da página
 * @returns {boolean}
 */
function isPageVisible(pageId) {
  const page = document.getElementById(pageId);
  return page && page.style.display !== 'none';
}

/**
 * Função genérica para carregar uma página
 * Elimina 60-70% do código duplicado
 * 
 * @param {Object} options - Opções de carregamento
 * @param {string} options.pageId - ID da página no DOM
 * @param {string} options.cacheKey - Chave para cache
 * @param {Function} options.dataLoader - Função async que retorna os dados
 * @param {Function} options.renderer - Função que renderiza os dados
 * @param {Function} [options.onError] - Callback de erro
 * @param {boolean} [options.forceRefresh=false] - Forçar recarregamento
 * @returns {Promise}
 */
async function loadPage({
  pageId,
  cacheKey,
  dataLoader,
  renderer,
  onError,
  forceRefresh = false
}) {
  const functionName = cacheKey || pageId;
  
  try {
    // Verificar cache (se não forçar refresh)
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return cached;
    }
    
    // Usar Promise compartilhada para evitar requisições duplicadas
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        // Verificar visibilidade da página
        if (!isPageVisible(pageId)) {
          return null;
        }
        
        // Carregar dados
        const data = await dataLoader();
        
        // Renderizar
        if (renderer) {
          await renderer(data);
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, data);
        }
        
        return data;
      } catch (error) {
        // Log de erro
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        
        // Callback de erro
        if (onError) {
          onError(error);
        }
        
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao carregar página ${pageId}:`, error);
    } else {
      console.error(`❌ Erro ao carregar página ${pageId}:`, error);
    }
    throw error;
  }
}

/**
 * Helper para criar um loader de dados simples
 * @param {string} endpoint - Endpoint da API
 * @param {*} fallback - Valor padrão em caso de erro
 * @returns {Function} Função async que carrega os dados
 */
function createDataLoader(endpoint, fallback = []) {
  return async () => {
    return await window.dataLoader?.load(endpoint, { fallback }) || fallback;
  };
}

/**
 * Helper para criar múltiplos loaders em paralelo
 * @param {Array<Object>} loaders - Array de {endpoint, fallback}
 * @returns {Function} Função async que retorna array de dados
 */
function createParallelDataLoader(loaders) {
  return async () => {
    const promises = loaders.map(({ endpoint, fallback = [] }) =>
      window.dataLoader?.load(endpoint, { fallback }) || Promise.resolve(fallback)
    );
    return await Promise.all(promises);
  };
}

/**
 * Verifica se um elemento canvas existe e está visível
 * @param {string} chartId - ID do canvas
 * @returns {HTMLElement|null}
 */
function ensureCanvasExists(chartId) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    if (window.Logger) {
      window.Logger.warn(`Canvas ${chartId} não encontrado`);
    } else {
      console.warn(`⚠️ Canvas ${chartId} não encontrado`);
    }
    return null;
  }
  return canvas;
}

/**
 * Destrói um gráfico Chart.js existente
 * @param {string} chartId - ID do gráfico
 */
function destroyChartIfExists(chartId) {
  if (window[chartId] instanceof Chart) {
    window[chartId].destroy();
    window[chartId] = null;
  }
}

/**
 * Tratamento de erro padronizado para gráficos
 * @param {Error} error - Erro ocorrido
 * @param {string} chartId - ID do gráfico
 */
function handleChartError(error, chartId) {
  if (window.Logger) {
    window.Logger.error(`Erro ao criar gráfico ${chartId}:`, error);
  } else {
    console.error(`❌ Erro ao criar gráfico ${chartId}:`, error);
  }
}

// Exportar funções
if (typeof window !== 'undefined') {
  if (!window.pageUtils) window.pageUtils = {};
  
  window.pageUtils.isPageVisible = isPageVisible;
  window.pageUtils.loadPage = loadPage;
  window.pageUtils.createDataLoader = createDataLoader;
  window.pageUtils.createParallelDataLoader = createParallelDataLoader;
  window.pageUtils.ensureCanvasExists = ensureCanvasExists;
  window.pageUtils.destroyChartIfExists = destroyChartIfExists;
  window.pageUtils.handleChartError = handleChartError;
}

