/**
 * Lazy Loading de Bibliotecas Pesadas
 * Carrega Chart.js e Plotly.js apenas quando necessário
 * Reduz ~800KB-1.2MB do carregamento inicial
 */

/**
 * Carregar Chart.js dinamicamente
 * @returns {Promise} Promise que resolve quando Chart.js está carregado
 */
async function loadChartJS() {
  if (window.Chart) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    // Verificar se já está sendo carregado
    if (window._chartJSLoading) {
      window._chartJSLoading.then(resolve).catch(reject);
      return;
    }
    
    // Criar Promise compartilhada
    const loadingPromise = new Promise((res, rej) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
      script.async = true;
      script.onload = () => {
        // Carregar plugin de datalabels após Chart.js
        const pluginScript = document.createElement('script');
        pluginScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2/dist/chartjs-plugin-datalabels.min.js';
        pluginScript.async = true;
        pluginScript.onload = () => {
          window._chartJSLoading = null;
          res();
        };
        pluginScript.onerror = () => {
          window._chartJSLoading = null;
          console.warn('⚠️ Erro ao carregar chartjs-plugin-datalabels, continuando sem ele');
          res(); // Continuar mesmo sem o plugin
        };
        document.head.appendChild(pluginScript);
      };
      script.onerror = () => {
        window._chartJSLoading = null;
        rej(new Error('Erro ao carregar Chart.js'));
      };
      document.head.appendChild(script);
    });
    
    window._chartJSLoading = loadingPromise;
    loadingPromise.then(resolve).catch(reject);
  });
}

/**
 * Carregar Plotly.js dinamicamente
 * @returns {Promise} Promise que resolve quando Plotly.js está carregado
 */
async function loadPlotly() {
  if (window.Plotly) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    // Verificar se já está sendo carregado
    if (window._plotlyLoading) {
      window._plotlyLoading.then(resolve).catch(reject);
      return;
    }
    
    // Criar Promise compartilhada
    const loadingPromise = new Promise((res, rej) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-2.26.0.min.js';
      script.async = true;
      script.onload = () => {
        window._plotlyLoading = null;
        res();
      };
      script.onerror = () => {
        window._plotlyLoading = null;
        rej(new Error('Erro ao carregar Plotly.js'));
      };
      document.head.appendChild(script);
    });
    
    window._plotlyLoading = loadingPromise;
    loadingPromise.then(resolve).catch(reject);
  });
}

/**
 * Carregar todas as bibliotecas de gráficos
 * @returns {Promise} Promise que resolve quando todas estão carregadas
 */
async function loadChartLibraries() {
  const promises = [];
  
  // Chart.js é necessário para a maioria dos gráficos
  promises.push(loadChartJS());
  
  // Plotly só é necessário para gráficos avançados (Sankey, TreeMap)
  // Carregar apenas se necessário (será carregado sob demanda)
  
  return Promise.all(promises);
}

// Exportar funções
if (typeof window !== 'undefined') {
  if (!window.lazyLibraries) window.lazyLibraries = {};
  
  window.lazyLibraries.loadChartJS = loadChartJS;
  window.lazyLibraries.loadPlotly = loadPlotly;
  window.lazyLibraries.loadChartLibraries = loadChartLibraries;
}

