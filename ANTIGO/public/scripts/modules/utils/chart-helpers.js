/**
 * Helpers para Criação de Gráficos
 * Abstrai criação de gráficos usando Chart Factory quando disponível
 */

/**
 * Cria um gráfico de barras horizontal
 * Usa Chart Factory quando disponível, fallback para Chart.js direto
 * 
 * @param {string} chartId - ID do canvas
 * @param {Array<string>} labels - Labels do gráfico
 * @param {Array<number>} values - Valores do gráfico
 * @param {string} color - Cor principal (hex)
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Chart|null>}
 */
async function createHorizontalBarChart(chartId, labels, values, color, options = {}) {
  try {
    // OTIMIZAÇÃO: Garantir que Chart.js está carregado
    if (window.lazyLibraries?.loadChartJS) {
      await window.lazyLibraries.loadChartJS();
    } else if (!window.Chart) {
      // Fallback: tentar carregar manualmente
      await new Promise((resolve, reject) => {
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
    
    // NOVA ESTRATÉGIA: Usar Chart Factory se disponível
    if (window.chartFactory && window.chartFactory.createBarChart) {
      const palette = window.chartFactory.getColorPalette();
      let colorIndex = 1; // Padrão: cor secundária
      
      if (color && color.startsWith('#')) {
        const colorIndexFound = palette.findIndex(c => c.toLowerCase() === color.toLowerCase());
        if (colorIndexFound >= 0) {
          colorIndex = colorIndexFound;
        }
      }
      
      return window.chartFactory.createBarChart(chartId, labels, values, {
        horizontal: true,
        label: options.label || 'Dados',
        colorIndex: colorIndex,
        backgroundColor: color ? (color + '80') : undefined,
        borderColor: color || undefined,
        onClick: (event, elements, chart) => {
          if (elements.length > 0 && window.showClickFeedback) {
            const index = elements[0].index;
            const label = chart.data.labels[index];
            const value = chart.data.datasets[0].data[index];
            window.showClickFeedback(null, label, value);
          }
        },
        chartOptions: {
          plugins: {
            datalabels: {
              anchor: options.anchor || 'end',
              align: options.align || 'end',
              display: options.showDataLabels !== false
            }
          }
        }
      });
    }
    
    // Fallback: método antigo se Chart Factory não estiver disponível
    const chartEl = document.getElementById(chartId);
    if (!chartEl) {
      if (window.Logger) {
        window.Logger.warn(`Elemento ${chartId} não encontrado`);
      } else {
        console.warn(`⚠️ Elemento ${chartId} não encontrado`);
      }
      return null;
    }
    
    if (window[chartId] instanceof Chart) {
      window[chartId].destroy();
    }
    
    const ctx = chartEl.getContext('2d');
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: options.label || 'Dados',
          data: values,
          backgroundColor: color + '80',
          borderColor: color,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        animation: false,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: tooltipFn(),
          datalabels: {
            ...dataLabelsFn(),
            anchor: options.anchor || 'end',
            align: options.align || 'end',
            display: options.showDataLabels !== false
          }
        },
        scales: {
          x: { 
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          },
          y: { 
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
    
    addClickFn(chart, (label, value) => showFeedbackFn(null, label, value), chartId);
    window[chartId] = chart;
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico ${chartId}:`, error);
    } else {
      console.error(`❌ Erro ao criar gráfico ${chartId}:`, error);
    }
    return null;
  }
}

/**
 * Cria um gráfico de linha
 * @param {string} chartId - ID do canvas
 * @param {Array<string>} labels - Labels do gráfico
 * @param {Array<number>} values - Valores do gráfico
 * @param {string} color - Cor principal (hex)
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Chart|null>}
 */
async function createLineChart(chartId, labels, values, color, options = {}) {
  try {
    // OTIMIZAÇÃO: Garantir que Chart.js está carregado
    if (window.lazyLibraries?.loadChartJS) {
      await window.lazyLibraries.loadChartJS();
    } else if (!window.Chart) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    if (window.chartFactory && window.chartFactory.createLineChart) {
      const palette = window.chartFactory.getColorPalette();
      let colorIndex = 0;
      
      if (color && color.startsWith('#')) {
        const colorIndexFound = palette.findIndex(c => c.toLowerCase() === color.toLowerCase());
        if (colorIndexFound >= 0) {
          colorIndex = colorIndexFound;
        }
      }
      
      return window.chartFactory.createLineChart(chartId, labels, values, {
        label: options.label || 'Dados',
        colorIndex: colorIndex,
        fill: options.fill !== false,
        chartOptions: options.chartOptions || {}
      });
    }
    
    // Fallback
    const chartEl = document.getElementById(chartId);
    if (!chartEl) return null;
    
    if (window[chartId] instanceof Chart) {
      window[chartId].destroy();
    }
    
    const ctx = chartEl.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: options.label || 'Dados',
          data: values,
          borderColor: color,
          backgroundColor: color + '40',
          fill: options.fill !== false,
          tension: 0.4
        }]
      },
      options: window.chartFactory?.getChartDefaults?.('line') || {
        responsive: true,
        animation: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
    
    window[chartId] = chart;
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico de linha ${chartId}:`, error);
    }
    return null;
  }
}

/**
 * Cria um gráfico de rosca (doughnut)
 * @param {string} chartId - ID do canvas
 * @param {Array<string>} labels - Labels do gráfico
 * @param {Array<number>} values - Valores do gráfico
 * @param {Array<string>} colors - Cores (opcional)
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Chart|null>}
 */
async function createDoughnutChart(chartId, labels, values, colors, options = {}) {
  try {
    // OTIMIZAÇÃO: Garantir que Chart.js está carregado
    if (window.lazyLibraries?.loadChartJS) {
      await window.lazyLibraries.loadChartJS();
    } else if (!window.Chart) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    if (window.chartFactory && window.chartFactory.createDoughnutChart) {
      const palette = window.chartFactory.getColorPalette();
      const chartColors = colors || labels.map((_, idx) => palette[idx % palette.length]);
      
      return window.chartFactory.createDoughnutChart(chartId, labels, values, {
        type: options.type || 'doughnut',
        colors: chartColors,
        chartOptions: options.chartOptions || {}
      });
    }
    
    // Fallback
    const chartEl = document.getElementById(chartId);
    if (!chartEl) return null;
    
    if (window[chartId] instanceof Chart) {
      window[chartId].destroy();
    }
    
    const ctx = chartEl.getContext('2d');
    const palette = window.chartFactory?.getColorPalette?.() || 
      ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185'];
    const chartColors = colors || labels.map((_, idx) => palette[idx % palette.length]);
    
    const chart = new Chart(ctx, {
      type: options.type || 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: chartColors
        }]
      },
      options: {
        responsive: true,
        animation: false,
        plugins: {
          legend: { display: options.showLegend !== false },
          tooltip: window.utils?.createEnhancedTooltip?.() || {}
        }
      }
    });
    
    window[chartId] = chart;
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico de rosca ${chartId}:`, error);
    }
    return null;
  }
}

/**
 * Adiciona subscribe automático a um gráfico
 * @param {string} chartId - ID do gráfico
 * @param {string} dataStoreKey - Chave no dataStore
 * @param {Function} dataTransformer - Função para transformar dados
 * @param {Object} chartOptions - Opções do gráfico
 * @returns {Function} Função unsubscribe
 */
function addChartSubscribe(chartId, dataStoreKey, dataTransformer, chartOptions = {}) {
  if (!window.dataStore) return () => {};
  
  const unsubscribe = window.dataStore.subscribe(dataStoreKey, async (newData) => {
    if (newData && Array.isArray(newData) && newData.length > 0) {
      const transformed = dataTransformer(newData);
      if (transformed && transformed.labels && transformed.values) {
        if (window.chartFactory && window.chartFactory.updateChart) {
          await window.chartFactory.updateChart(chartId, transformed.labels, transformed.values, {
            type: chartOptions.type || 'bar',
            horizontal: chartOptions.horizontal !== false
          }).catch(err => {
            if (window.Logger) {
              window.Logger.error(`Erro ao atualizar gráfico ${chartId}:`, err);
            }
          });
        } else {
          // Fallback: recriar gráfico
          const color = transformed.color || '#22d3ee';
          const options = transformed.options || {};
          if (chartOptions.type === 'doughnut' || chartOptions.type === 'pie') {
            if (window.chartFactory && window.chartFactory.createDoughnutChart) {
              await window.chartFactory.createDoughnutChart(chartId, transformed.labels, transformed.values, {
                type: chartOptions.type || 'doughnut',
                colors: transformed.colors
              }).catch(err => {
                if (window.Logger) {
                  window.Logger.error(`Erro ao criar gráfico ${chartId}:`, err);
                }
              });
            }
          } else {
            await createHorizontalBarChart(chartId, transformed.labels, transformed.values, color, options).catch(err => {
              if (window.Logger) {
                window.Logger.error(`Erro ao criar gráfico ${chartId}:`, err);
              }
            });
          }
        }
      }
    }
  });
  
  // Armazenar unsubscribe
  if (!window._dataStoreUnsubscribes) {
    window._dataStoreUnsubscribes = new Map();
  }
  window._dataStoreUnsubscribes.set(chartId, unsubscribe);
  
  return unsubscribe;
}

// Exportar funções
if (typeof window !== 'undefined') {
  if (!window.chartHelpers) window.chartHelpers = {};
  
  window.chartHelpers.createHorizontalBarChart = createHorizontalBarChart;
  window.chartHelpers.createLineChart = createLineChart;
  window.chartHelpers.createDoughnutChart = createDoughnutChart;
  window.chartHelpers.addChartSubscribe = addChartSubscribe;
}

