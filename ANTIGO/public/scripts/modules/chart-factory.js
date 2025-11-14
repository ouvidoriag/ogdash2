/**
 * Chart Factory - Biblioteca de Geração de Gráficos Abstrata
 * Padroniza criação de gráficos usando configurações centralizadas
 * 
 * Estratégia: Redução de Boilerplate e Consistência Visual
 */

/**
 * Obter paleta de cores do config
 * @returns {Array} Array de cores
 */
function getColorPalette() {
  const config = window.config?.CHART_CONFIG || {};
  return config.COLOR_PALETTE || [
    '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9',
    '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#6366f1'
  ];
}

/**
 * Obter cor da paleta por índice
 * @param {number} index - Índice da cor
 * @param {Array} customPalette - Paleta customizada (opcional)
 * @returns {string} Cor em formato rgba
 */
function getColorFromPalette(index, customPalette = null) {
  const palette = customPalette || getColorPalette();
  const color = palette[index % palette.length];
  
  // Converter hex para rgba se necessário
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }
  return color;
}

/**
 * Obter cor com transparência
 * @param {string} color - Cor base (hex ou rgba)
 * @param {number} alpha - Transparência (0-1)
 * @returns {string} Cor com transparência
 */
function getColorWithAlpha(color, alpha = 0.7) {
  if (color.startsWith('rgba')) {
    return color.replace(/[\d\.]+\)$/g, `${alpha})`);
  }
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

/**
 * Obter configurações padrão para um tipo de gráfico
 * @param {string} chartType - Tipo do gráfico ('bar', 'line', 'doughnut', etc.)
 * @returns {Object} Configuração padrão
 */
function getChartDefaults(chartType) {
  const config = window.config?.CHART_CONFIG || {};
  
  const defaults = {
    responsive: true,
    maintainAspectRatio: true,
    animation: config.PERFORMANCE?.ANIMATION_DURATION === 0 ? false : true,
    plugins: {
      legend: { display: false },
      tooltip: window.utils?.createEnhancedTooltip?.() || {},
      datalabels: window.utils?.createDataLabelsConfig?.() || { display: false }
    }
  };
  
  // Configurações específicas por tipo
  switch (chartType) {
    case 'bar':
      return {
        ...defaults,
        scales: {
          x: { 
            ticks: { color: '#94a3b8' },
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: { 
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      };
      
    case 'bar-horizontal':
      return {
        ...defaults,
        indexAxis: 'y',
        scales: {
          x: { 
            ticks: { color: '#94a3b8' },
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: { 
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      };
      
    case 'line':
      return {
        ...defaults,
        scales: {
          x: { 
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: { 
            ticks: { color: '#94a3b8' },
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      };
      
    case 'doughnut':
    case 'pie':
      return {
        ...defaults,
        plugins: {
          ...defaults.plugins,
          legend: { display: false },
          datalabels: window.utils?.createDataLabelsConfig?.(true, 'doughnut') || { display: false }
        }
      };
      
    default:
      return defaults;
  }
}

/**
 * Garantir que Chart.js está carregado
 * @returns {Promise} Promise que resolve quando Chart.js está pronto
 */
async function ensureChartJS() {
  if (window.Chart) {
    return Promise.resolve();
  }
  
  if (window.lazyLibraries?.loadChartJS) {
    return window.lazyLibraries.loadChartJS();
  }
  
  // Fallback: tentar carregar manualmente
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    script.onload = () => {
      const pluginScript = document.createElement('script');
      pluginScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2/dist/chartjs-plugin-datalabels.min.js';
      pluginScript.onload = resolve;
      pluginScript.onerror = () => resolve(); // Continuar mesmo sem plugin
      document.head.appendChild(pluginScript);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Criar gráfico de barras
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array} labels - Labels do gráfico
 * @param {Array|Array<Array>|Array<Object>} values - Valores do gráfico (pode ser array simples, array de arrays, ou array de objetos dataset)
 * @param {Object} options - Opções customizadas
 * @returns {Promise<Chart|null>} Promise que resolve com instância do Chart ou null se erro
 */
async function createBarChart(canvasId, labels, values, options = {}) {
  try {
    // Garantir que Chart.js está carregado
    await ensureChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      if (window.Logger) {
        window.Logger.warn(`Canvas ${canvasId} não encontrado`);
      }
      return null;
    }
    
    // Destruir gráfico anterior se existir
    if (window[canvasId] instanceof Chart) {
      window[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const defaults = getChartDefaults(options.horizontal ? 'bar-horizontal' : 'bar');
    const palette = getColorPalette();
    
    // Determinar se é múltiplos datasets ou dataset único
    let datasets = [];
    
    if (Array.isArray(values) && values.length > 0) {
      // Se o primeiro elemento é um objeto com propriedades de dataset
      if (typeof values[0] === 'object' && !Array.isArray(values[0]) && ('data' in values[0] || 'label' in values[0])) {
        // Formato: [{ label: 'Dataset 1', data: [1,2,3], ... }, ...]
        datasets = values.map((dataset, idx) => ({
          label: dataset.label || `Dataset ${idx + 1}`,
          data: dataset.data || [],
          backgroundColor: dataset.backgroundColor || getColorWithAlpha(getColorFromPalette(idx, palette), 0.7),
          borderColor: dataset.borderColor || getColorFromPalette(idx, palette),
          borderWidth: dataset.borderWidth || options.borderWidth || 1
        }));
      } else if (Array.isArray(values[0]) && typeof values[0][0] === 'number') {
        // Formato: [[1,2,3], [4,5,6], ...] - múltiplos datasets
        datasets = values.map((data, idx) => ({
          label: options.labels?.[idx] || `Dataset ${idx + 1}`,
          data: data,
          backgroundColor: getColorWithAlpha(getColorFromPalette(idx, palette), 0.7),
          borderColor: getColorFromPalette(idx, palette),
          borderWidth: options.borderWidth || 1
        }));
      } else {
        // Formato: [1,2,3] - dataset único
        const colorIndex = options.colorIndex !== undefined ? options.colorIndex : 1; // Usar cor secundária por padrão
        const baseColor = options.backgroundColor 
          ? (options.backgroundColor.startsWith('#') ? options.backgroundColor : getColorFromPalette(colorIndex, palette))
          : getColorFromPalette(colorIndex, palette);
        
        datasets = [{
          label: options.label || 'Dados',
          data: values,
          backgroundColor: options.backgroundColor || getColorWithAlpha(baseColor, 0.7),
          borderColor: options.borderColor || baseColor,
          borderWidth: options.borderWidth || 1
        }];
      }
    }
    
    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        ...defaults,
        ...options.chartOptions
      }
    };
    
    // Aplicar indexAxis se horizontal (garantir que defaults seja aplicado primeiro)
    if (options.horizontal) {
      config.options.indexAxis = options.chartOptions?.indexAxis || 'y';
    }
    
    const chart = new Chart(ctx, config);
    
    // Adicionar handler de clique se fornecido
    if (options.onClick) {
      window.charts?.addChartClickHandler?.(chart, options.onClick, canvasId);
    }
    
    // Armazenar referência global
    window[canvasId] = chart;
    
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico de barras ${canvasId}:`, error);
    } else {
      console.error(`❌ Erro ao criar gráfico de barras ${canvasId}:`, error);
    }
    return null;
  }
}

/**
 * Criar gráfico de linha
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array} labels - Labels do gráfico
 * @param {Array|Array<Array>|Array<Object>} values - Valores do gráfico (pode ser array simples, array de arrays, ou array de objetos dataset)
 * @param {Object} options - Opções customizadas
 * @returns {Promise<Chart|null>} Promise que resolve com instância do Chart ou null se erro
 */
async function createLineChart(canvasId, labels, values, options = {}) {
  try {
    // Garantir que Chart.js está carregado
    await ensureChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      if (window.Logger) {
        window.Logger.warn(`Canvas ${canvasId} não encontrado`);
      }
      return null;
    }
    
    // Destruir gráfico anterior se existir
    if (window[canvasId] instanceof Chart) {
      window[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const defaults = getChartDefaults('line');
    const palette = getColorPalette();
    
    // Determinar se é múltiplos datasets ou dataset único
    let datasets = [];
    
    if (Array.isArray(values) && values.length > 0) {
      // Se o primeiro elemento é um objeto com propriedades de dataset
      if (typeof values[0] === 'object' && !Array.isArray(values[0]) && ('data' in values[0] || 'label' in values[0])) {
        // Formato: [{ label: 'Dataset 1', data: [1,2,3], ... }, ...]
        datasets = values.map((dataset, idx) => {
          const baseColor = dataset.borderColor || getColorFromPalette(idx, palette);
          const gradientFn = window.utils?.gradient;
          const gradientBg = dataset.gradient && gradientFn
            ? gradientFn(ctx, dataset.gradient.from || baseColor, dataset.gradient.to || getColorWithAlpha(baseColor, 0.1))
            : dataset.backgroundColor || getColorWithAlpha(baseColor, 0.35);
          
          return {
            label: dataset.label || `Dataset ${idx + 1}`,
            data: dataset.data || [],
            fill: dataset.fill !== false,
            borderColor: baseColor,
            backgroundColor: gradientBg,
            tension: dataset.tension || 0.35,
            borderWidth: dataset.borderWidth || 2,
            pointRadius: dataset.pointRadius || 3
          };
        });
      } else if (Array.isArray(values[0]) && typeof values[0][0] === 'number') {
        // Formato: [[1,2,3], [4,5,6], ...] - múltiplos datasets
        datasets = values.map((data, idx) => {
          const baseColor = getColorFromPalette(idx, palette);
          const gradientFn = window.utils?.gradient;
          const gradientBg = options.gradient && gradientFn
            ? gradientFn(ctx, options.gradient.from || baseColor, options.gradient.to || getColorWithAlpha(baseColor, 0.1))
            : getColorWithAlpha(baseColor, 0.35);
          
          return {
            label: options.labels?.[idx] || `Dataset ${idx + 1}`,
            data: data,
            fill: options.fill !== false,
            borderColor: baseColor,
            backgroundColor: gradientBg,
            tension: options.tension || 0.35,
            borderWidth: options.borderWidth || 2,
            pointRadius: options.pointRadius || 3
          };
        });
      } else {
        // Formato: [1,2,3] - dataset único
        const colorIndex = options.colorIndex !== undefined ? options.colorIndex : 0; // Usar cor primária por padrão
        const baseColor = options.borderColor || getColorFromPalette(colorIndex, palette);
        
        // Criar gradiente se fornecido
        const gradientBg = options.gradient 
          ? (typeof window.utils?.gradient === 'function' 
              ? window.utils.gradient(ctx, options.gradient.from || baseColor, options.gradient.to || getColorWithAlpha(baseColor, 0.1))
              : options.backgroundColor)
          : options.backgroundColor || getColorWithAlpha(baseColor, 0.35);
        
        datasets = [{
          label: options.label || 'Dados',
          data: values,
          fill: options.fill !== false,
          borderColor: baseColor,
          backgroundColor: gradientBg,
          tension: options.tension || 0.35,
          borderWidth: options.borderWidth || 2,
          pointRadius: options.pointRadius || 3
        }];
      }
    }
    
    const config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        ...defaults,
        ...options.chartOptions
      }
    };
    
    const chart = new Chart(ctx, config);
    
    // Adicionar handler de clique se fornecido
    if (options.onClick) {
      window.charts?.addChartClickHandler?.(chart, options.onClick, canvasId);
    }
    
    // Armazenar referência global
    window[canvasId] = chart;
    
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico de linha ${canvasId}:`, error);
    } else {
      console.error(`❌ Erro ao criar gráfico de linha ${canvasId}:`, error);
    }
    return null;
  }
}

/**
 * Criar gráfico de pizza/rosquinha
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array} labels - Labels do gráfico
 * @param {Array} values - Valores do gráfico
 * @param {Object} options - Opções customizadas
 * @returns {Chart|null} Instância do Chart ou null se erro
 */
async function createDoughnutChart(canvasId, labels, values, options = {}) {
  try {
    // Garantir que Chart.js está carregado
    await ensureChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      if (window.Logger) {
        window.Logger.warn(`Canvas ${canvasId} não encontrado`);
      }
      return null;
    }
    
    // Destruir gráfico anterior se existir
    if (window[canvasId] instanceof Chart) {
      window[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const defaults = getChartDefaults('doughnut');
    const config = window.config?.CHART_CONFIG || {};
    const colors = options.colors || config.COLOR_PALETTE || [
      '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9'
    ];
    
    const chartColors = labels.map((_, idx) => colors[idx % colors.length]);
    
    const chartConfig = {
      type: options.type || 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: chartColors,
          borderColor: chartColors.map(c => c.replace('0.7', '1')),
          borderWidth: options.borderWidth || 1
        }]
      },
      options: {
        ...defaults,
        ...options.chartOptions
      }
    };
    
    const chart = new Chart(ctx, chartConfig);
    
    // Adicionar handler de clique se fornecido
    if (options.onClick) {
      window.charts?.addChartClickHandler?.(chart, options.onClick, canvasId);
    }
    
    // Armazenar referência global
    window[canvasId] = chart;
    
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico de pizza ${canvasId}:`, error);
    } else {
      console.error(`❌ Erro ao criar gráfico de pizza ${canvasId}:`, error);
    }
    return null;
  }
}

/**
 * Atualizar gráfico existente com novos dados
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array} labels - Novos labels (opcional)
 * @param {Array|Array<Array>|Array<Object>} values - Novos valores
 * @param {Object} options - Opções customizadas
 * @returns {Chart|null} Instância do Chart atualizada ou null se erro
 */
async function updateChart(canvasId, labels = null, values = null, options = {}) {
  try {
    // Garantir que Chart.js está carregado
    await ensureChartJS();
    
    const chart = window[canvasId];
    if (!chart || !(chart instanceof Chart)) {
      // Se gráfico não existe, criar novo
      if (labels && values) {
        // Tentar determinar tipo do gráfico pelo canvasId ou options
        const chartType = options.type || 'bar';
        if (chartType === 'line') {
          return await createLineChart(canvasId, labels, values, options);
        } else if (chartType === 'doughnut' || chartType === 'pie') {
          return await createDoughnutChart(canvasId, labels, values, options);
        } else {
          return await createBarChart(canvasId, labels, values, options);
        }
      }
      return null;
    }
    
    // Atualizar labels se fornecidos
    if (labels) {
      chart.data.labels = labels;
    }
    
    // Atualizar datasets
    if (values) {
      if (Array.isArray(values) && values.length > 0) {
        // Se é array de objetos dataset
        if (typeof values[0] === 'object' && !Array.isArray(values[0]) && ('data' in values[0] || 'label' in values[0])) {
          chart.data.datasets = values.map((dataset, idx) => ({
            ...chart.data.datasets[idx],
            ...dataset,
            data: dataset.data || []
          }));
        } else if (Array.isArray(values[0]) && typeof values[0][0] === 'number') {
          // Múltiplos datasets como arrays
          chart.data.datasets = values.map((data, idx) => ({
            ...(chart.data.datasets[idx] || {}),
            data: data
          }));
        } else {
          // Dataset único
          if (chart.data.datasets.length > 0) {
            chart.data.datasets[0].data = values;
          } else {
            chart.data.datasets = [{
              label: options.label || 'Dados',
              data: values
            }];
          }
        }
      }
    }
    
    // Atualizar opções se fornecidas
    if (options.chartOptions) {
      Object.assign(chart.options, options.chartOptions);
    }
    
    // Atualizar gráfico
    chart.update(options.animationMode || 'default');
    
    if (window.Logger) {
      window.Logger.debug(`Gráfico ${canvasId} atualizado`);
    }
    
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao atualizar gráfico ${canvasId}:`, error);
    } else {
      console.error(`❌ Erro ao atualizar gráfico ${canvasId}:`, error);
    }
    return null;
  }
}

/**
 * Criar ou atualizar gráfico de forma reativa (para uso com dataStore.subscribe)
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} dataStoreKey - Chave no dataStore para observar
 * @param {Function} dataTransformer - Função para transformar dados do store em formato de gráfico
 * @param {Object} chartOptions - Opções do gráfico
 * @returns {Function} Função de unsubscribe
 */
function createReactiveChart(canvasId, dataStoreKey, dataTransformer, chartOptions = {}) {
  if (!window.dataStore) {
    if (window.Logger) {
      window.Logger.warn('dataStore não disponível para gráfico reativo');
    }
    return () => {};
  }
  
  // Função para atualizar gráfico com dados do store
  const updateChartFromStore = (data) => {
    if (!data) return;
    
    try {
      const transformed = dataTransformer(data);
      if (transformed && transformed.labels && transformed.values) {
        updateChart(canvasId, transformed.labels, transformed.values, {
          ...chartOptions,
          type: chartOptions.type || 'bar'
        }).catch(err => {
          if (window.Logger) {
            window.Logger.error(`Erro ao atualizar gráfico ${canvasId}:`, err);
          }
        });
      }
    } catch (error) {
      if (window.Logger) {
        window.Logger.error(`Erro ao atualizar gráfico reativo ${canvasId}:`, error);
      }
    }
  };
  
  // Obter dados iniciais
  const initialData = window.dataStore.get(dataStoreKey);
  if (initialData) {
    updateChartFromStore(initialData);
  }
  
  // Inscrever-se para mudanças
  const unsubscribe = window.dataStore.subscribe(dataStoreKey, updateChartFromStore);
  
  // Armazenar unsubscribe para limpeza
  if (!window._chartFactoryUnsubscribes) {
    window._chartFactoryUnsubscribes = new Map();
  }
  window._chartFactoryUnsubscribes.set(canvasId, unsubscribe);
  
  return unsubscribe;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.chartFactory = {
    getChartDefaults,
    getColorPalette,
    getColorFromPalette,
    getColorWithAlpha,
    createBarChart,
    createLineChart,
    createDoughnutChart,
    updateChart,
    createReactiveChart
  };
  
  // Log de inicialização
  if (window.Logger) {
    window.Logger.debug('✅ Chart Factory inicializado');
  } else {
    console.log('✅ Chart Factory inicializado');
  }
}

