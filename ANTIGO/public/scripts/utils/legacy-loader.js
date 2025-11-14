/**
 * Lazy Loader para Módulos Legados
 * Carrega data-pages.js apenas quando necessário (páginas não migradas)
 */

/**
 * Lista de páginas que ainda usam data-pages.js (não migradas)
 */
const LEGACY_PAGES = [
  'orgao-mes',
  'tempo-medio',
  'cadastrante',
  'reclamacoes',
  'projecao-2026',
  'secretaria',
  'secretarias-distritos',
  'status'
];

/**
 * Verificar se uma página precisa do módulo legado
 * @param {string} pageName - Nome da página
 * @returns {boolean}
 */
function isLegacyPage(pageName) {
  return LEGACY_PAGES.includes(pageName);
}

/**
 * Carregar data-pages.js condicionalmente
 * @param {string} pageName - Nome da página que será carregada
 * @returns {Promise} Promise que resolve quando o módulo está carregado
 */
async function loadLegacyModuleIfNeeded(pageName) {
  // Se a página não precisa do módulo legado, não carregar
  if (!isLegacyPage(pageName)) {
    return Promise.resolve();
  }
  
  // Se já está carregado, não carregar novamente
  if (window.data?.loadOrgaoMes || window.data?.loadTempoMedio) {
    return Promise.resolve();
  }
  
  // Se já está sendo carregado, aguardar
  if (window._legacyModuleLoading) {
    return window._legacyModuleLoading;
  }
  
  // Carregar módulo legado
  const loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/scripts/modules/data-pages.js';
    script.async = true;
    script.onload = () => {
      window._legacyModuleLoading = null;
      if (window.Logger) {
        window.Logger.debug('Módulo legado data-pages.js carregado sob demanda');
      }
      resolve();
    };
    script.onerror = () => {
      window._legacyModuleLoading = null;
      if (window.Logger) {
        window.Logger.warn('Erro ao carregar módulo legado data-pages.js');
      }
      reject(new Error('Erro ao carregar data-pages.js'));
    };
    document.head.appendChild(script);
  });
  
  window._legacyModuleLoading = loadingPromise;
  return loadingPromise;
}

// Exportar funções
if (typeof window !== 'undefined') {
  if (!window.legacyLoader) window.legacyLoader = {};
  
  window.legacyLoader.isLegacyPage = isLegacyPage;
  window.legacyLoader.loadIfNeeded = loadLegacyModuleIfNeeded;
}

