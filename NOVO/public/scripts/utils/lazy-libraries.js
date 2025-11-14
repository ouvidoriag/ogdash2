/**
 * Lazy Loading de Bibliotecas Pesadas
 * Carrega Chart.js e Plotly.js apenas quando necessário
 * Reduz ~800KB-1.2MB do carregamento inicial
 */

async function loadChartJS() {
  if (window.Chart) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    if (window._chartJSLoading) {
      window._chartJSLoading.then(resolve).catch(reject);
      return;
    }
    
    const loadingPromise = new Promise((res, rej) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
      script.async = true;
      script.onload = () => {
        const pluginScript = document.createElement('script');
        pluginScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2/dist/chartjs-plugin-datalabels.min.js';
        pluginScript.async = true;
        pluginScript.onload = () => {
          window._chartJSLoading = null;
          res();
        };
        pluginScript.onerror = () => {
          window._chartJSLoading = null;
          if (window.Logger) {
            window.Logger.warn('Erro ao carregar chartjs-plugin-datalabels, continuando sem ele');
          }
          res();
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

async function loadPlotly() {
  if (window.Plotly) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    if (window._plotlyLoading) {
      window._plotlyLoading.then(resolve).catch(reject);
      return;
    }
    
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

async function loadChartLibraries() {
  return Promise.all([loadChartJS()]);
}

if (typeof window !== 'undefined') {
  if (!window.lazyLibraries) window.lazyLibraries = {};
  
  window.lazyLibraries.loadChartJS = loadChartJS;
  window.lazyLibraries.loadPlotly = loadPlotly;
  window.lazyLibraries.loadChartLibraries = loadChartLibraries;
}

