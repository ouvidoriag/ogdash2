/**
 * FASE 2.4: Sistema de Lazy Loading para Scripts
 * Carrega scripts sob demanda para melhorar performance inicial
 */

(function() {
  'use strict';

  const loadedScripts = new Set();
  const loadingScripts = new Map(); // { url: Promise }

  /**
   * Carregar script dinamicamente
   * @param {string} url - URL do script
   * @param {Object} options - Opções de carregamento
   * @returns {Promise} Promise que resolve quando o script é carregado
   */
  function loadScript(url, options = {}) {
    // Se já está carregado, retornar Promise resolvida
    if (loadedScripts.has(url)) {
      return Promise.resolve();
    }

    // Se já está carregando, retornar a Promise existente
    if (loadingScripts.has(url)) {
      return loadingScripts.get(url);
    }

    // Criar nova Promise para carregamento
    const loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = options.async !== false;
      script.defer = options.defer || false;

      script.onload = () => {
        loadedScripts.add(url);
        loadingScripts.delete(url);
        if (window.Logger) {
          window.Logger.debug(`Script carregado: ${url}`);
        }
        resolve();
      };

      script.onerror = () => {
        loadingScripts.delete(url);
        const error = new Error(`Falha ao carregar script: ${url}`);
        if (window.Logger) {
          window.Logger.error('Erro ao carregar script:', error);
        }
        reject(error);
      };

      document.head.appendChild(script);
    });

    loadingScripts.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * Carregar múltiplos scripts em paralelo
   * @param {string[]} urls - Array de URLs
   * @returns {Promise} Promise que resolve quando todos os scripts são carregados
   */
  function loadScripts(urls) {
    return Promise.all(urls.map(url => loadScript(url)));
  }

  /**
   * Verificar se script já foi carregado
   * @param {string} url - URL do script
   * @returns {boolean}
   */
  function isScriptLoaded(url) {
    return loadedScripts.has(url);
  }

  // Exportar para window
  window.lazyLoader = {
    load: loadScript,
    loadMultiple: loadScripts,
    isLoaded: isScriptLoaded,
    getLoadedScripts: () => Array.from(loadedScripts)
  };

  // FASE 2.1: Usar Logger
  if (window.Logger) {
    window.Logger.debug('Sistema de Lazy Loading inicializado');
  }
})();



