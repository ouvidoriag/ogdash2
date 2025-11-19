/**
 * Chart Factory - Biblioteca de Geração de Gráficos Abstrata
 * Padroniza criação de gráficos usando configurações centralizadas
 */

function getColorPalette() {
  const config = window.config?.CHART_CONFIG || {};
  return config.COLOR_PALETTE || [
    '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9',
    '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#6366f1'
  ];
}

function getColorFromPalette(index, customPalette = null) {
  const palette = customPalette || getColorPalette();
  const color = palette[index % palette.length];
  
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }
  return color;
}

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

function getChartDefaults(chartType) {
  const config = window.config?.CHART_CONFIG || {};
  
  const defaults = {
    responsive: true,
    maintainAspectRatio: true,
    animation: config.PERFORMANCE?.ANIMATION_DURATION === 0 ? false : true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: config.TOOLTIP?.BACKGROUND || 'rgba(15, 23, 42, 0.95)',
        titleColor: config.TOOLTIP?.TITLE_COLOR || '#e2e8f0',
        bodyColor: config.TOOLTIP?.BODY_COLOR || '#cbd5e1',
        borderColor: config.TOOLTIP?.BORDER_COLOR || 'rgba(34, 211, 238, 0.3)',
        borderWidth: config.TOOLTIP?.BORDER_WIDTH || 1,
        padding: config.TOOLTIP?.PADDING || 12
      }
    }
  };
  
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
          legend: { display: false }
        }
      };
      
    default:
      return defaults;
  }
}

async function ensureChartJS() {
  if (window.Chart) {
    return Promise.resolve();
  }
  
  if (window.lazyLibraries?.loadChartJS) {
    return window.lazyLibraries.loadChartJS();
  }
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    script.onload = () => {
      const pluginScript = document.createElement('script');
      pluginScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2/dist/chartjs-plugin-datalabels.min.js';
      pluginScript.onload = resolve;
      pluginScript.onerror = () => resolve();
      document.head.appendChild(pluginScript);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function createBarChart(canvasId, labels, values, options = {}) {
  try {
    await ensureChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      if (window.Logger) {
        window.Logger.warn(`Canvas ${canvasId} não encontrado`);
      }
      return null;
    }
    
    if (window[canvasId] instanceof Chart) {
      window[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const defaults = getChartDefaults(options.horizontal ? 'bar-horizontal' : 'bar');
    const palette = getColorPalette();
    
    let datasets = [];
    
    if (Array.isArray(values) && values.length > 0) {
      if (typeof values[0] === 'object' && !Array.isArray(values[0]) && ('data' in values[0] || 'label' in values[0])) {
        datasets = values.map((dataset, idx) => ({
          label: dataset.label || `Dataset ${idx + 1}`,
          data: dataset.data || [],
          backgroundColor: dataset.backgroundColor || getColorWithAlpha(getColorFromPalette(idx, palette), 0.7),
          borderColor: dataset.borderColor || getColorFromPalette(idx, palette),
          borderWidth: dataset.borderWidth || options.borderWidth || 1
        }));
      } else if (Array.isArray(values[0]) && typeof values[0][0] === 'number') {
        datasets = values.map((data, idx) => ({
          label: options.labels?.[idx] || `Dataset ${idx + 1}`,
          data: data,
          backgroundColor: getColorWithAlpha(getColorFromPalette(idx, palette), 0.7),
          borderColor: getColorFromPalette(idx, palette),
          borderWidth: options.borderWidth || 1
        }));
      } else {
        // Verificar se é tipo de manifestação e usar cores específicas
        const isTipoManifestacao = options.field === 'tipoDeManifestacao' || 
                                    options.field === 'Tipo' ||
                                    canvasId.toLowerCase().includes('tipo') ||
                                    (labels && labels.some(l => {
                                      const tipoLower = (l || '').toLowerCase();
                                      return tipoLower.includes('elogio') || 
                                             tipoLower.includes('reclama') || 
                                             tipoLower.includes('denúncia') || 
                                             tipoLower.includes('denuncia') ||
                                             tipoLower.includes('sugest');
                                    }));
        
        let backgroundColor, borderColor;
        
        if (isTipoManifestacao && window.config?.getColorByTipoManifestacao) {
          // Usar cores específicas por tipo de manifestação
          backgroundColor = labels.map((label) => {
            const color = window.config.getColorByTipoManifestacao(label);
            return color ? getColorWithAlpha(color, 0.7) : getColorWithAlpha(getColorFromPalette(1, palette), 0.7);
          });
          borderColor = labels.map((label) => {
            const color = window.config.getColorByTipoManifestacao(label);
            return color || getColorFromPalette(1, palette);
          });
        } else {
          // Usar cor padrão
          const colorIndex = options.colorIndex !== undefined ? options.colorIndex : 1;
          const baseColor = options.backgroundColor 
            ? (options.backgroundColor.startsWith('#') ? options.backgroundColor : getColorFromPalette(colorIndex, palette))
            : getColorFromPalette(colorIndex, palette);
          
          backgroundColor = options.backgroundColor || getColorWithAlpha(baseColor, 0.7);
          borderColor = options.borderColor || baseColor;
        }
        
        datasets = [{
          label: options.label || 'Dados',
          data: values,
          backgroundColor: Array.isArray(backgroundColor) ? backgroundColor : backgroundColor,
          borderColor: Array.isArray(borderColor) ? borderColor : borderColor,
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
    
    if (options.horizontal) {
      config.options.indexAxis = options.chartOptions?.indexAxis || 'y';
    }
    
    const chart = new Chart(ctx, config);
    window[canvasId] = chart;
    
    // Criar legenda interativa se houver múltiplos datasets e container especificado
    if (datasets.length > 1 && options.legendContainer) {
      if (window.chartLegend && window.chartLegend.createInteractiveLegend) {
        window.chartLegend.createInteractiveLegend(canvasId, options.legendContainer, datasets, options);
      }
    }
    
    // Registrar gráfico no sistema de comunicação
    if (window.chartCommunication) {
      const fieldMapping = window.chartCommunication.getFieldMapping(canvasId);
      window.chartCommunication.registerChart(canvasId, {
        type: 'bar',
        field: fieldMapping?.field || null,
        operator: fieldMapping?.op || null,
        horizontal: options.horizontal || false
      });
    }
    
    // Adicionar handler de clique se fornecido
    if (options.onClick) {
      chart.canvas.style.cursor = 'pointer';
      chart.canvas.onclick = (evt) => {
        const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        if (points.length > 0) {
          const point = points[0];
          const label = chart.data.labels[point.index];
          const value = chart.data.datasets[point.datasetIndex].data[point.index];
          
          // Chamar callback customizado primeiro (se existir)
          if (typeof options.onClickCallback === 'function') {
            options.onClickCallback(evt, points, chart);
            // Se o callback customizado foi chamado, não aplicar filtro padrão
            // (o callback customizado deve aplicar o filtro se necessário)
            return;
          }
          
          // Chamar callback customizado (compatibilidade com versão antiga)
          if (typeof options.onClick === 'function') {
            options.onClick(evt, points, chart);
          }
          
          // Mostrar feedback visual
          if (window.chartCommunication) {
            window.chartCommunication.showFeedback(canvasId, label, value);
          }
          
          // Aplicar filtro se mapeamento existir
          if (window.chartCommunication) {
            const fieldMapping = window.chartCommunication.getFieldMapping(canvasId);
            if (fieldMapping && fieldMapping.field) {
              window.chartCommunication.applyFilter(
                fieldMapping.field,
                label,
                canvasId,
                { toggle: true, operator: fieldMapping.op, clearPrevious: true }
              );
            }
          }
        }
      };
    }
    
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico de barras ${canvasId}:`, error);
    }
    return null;
  }
}

async function createLineChart(canvasId, labels, values, options = {}) {
  try {
    await ensureChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      if (window.Logger) {
        window.Logger.warn(`Canvas ${canvasId} não encontrado`);
      }
      return null;
    }
    
    if (window[canvasId] instanceof Chart) {
      window[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const defaults = getChartDefaults('line');
    const palette = getColorPalette();
    
    let datasets = [];
    
    if (Array.isArray(values) && values.length > 0) {
      if (typeof values[0] === 'object' && !Array.isArray(values[0]) && ('data' in values[0] || 'label' in values[0])) {
        datasets = values.map((dataset, idx) => ({
          label: dataset.label || `Dataset ${idx + 1}`,
          data: dataset.data || [],
          borderColor: dataset.borderColor || getColorFromPalette(idx, palette),
          backgroundColor: dataset.backgroundColor || getColorWithAlpha(getColorFromPalette(idx, palette), 0.1),
          borderWidth: dataset.borderWidth || options.borderWidth || 2,
          fill: dataset.fill !== undefined ? dataset.fill : options.fill || false,
          tension: dataset.tension !== undefined ? dataset.tension : options.tension || 0.4
        }));
      } else if (Array.isArray(values[0]) && typeof values[0][0] === 'number') {
        datasets = values.map((data, idx) => ({
          label: options.labels?.[idx] || `Dataset ${idx + 1}`,
          data: data,
          borderColor: getColorFromPalette(idx, palette),
          backgroundColor: getColorWithAlpha(getColorFromPalette(idx, palette), 0.1),
          borderWidth: options.borderWidth || 2,
          fill: options.fill || false,
          tension: options.tension || 0.4
        }));
      } else {
        const colorIndex = options.colorIndex !== undefined ? options.colorIndex : 0;
        const baseColor = options.borderColor || getColorFromPalette(colorIndex, palette);
        
        datasets = [{
          label: options.label || 'Dados',
          data: values,
          borderColor: baseColor,
          backgroundColor: options.backgroundColor || getColorWithAlpha(baseColor, 0.1),
          borderWidth: options.borderWidth || 2,
          fill: options.fill || false,
          tension: options.tension || 0.4
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
    window[canvasId] = chart;
    
    // Criar legenda interativa se houver múltiplos datasets e container especificado
    if (datasets.length > 1 && options.legendContainer) {
      if (window.chartLegend && window.chartLegend.createInteractiveLegend) {
        window.chartLegend.createInteractiveLegend(canvasId, options.legendContainer, datasets, options);
      }
    }
    
    // Registrar gráfico no sistema de comunicação
    if (window.chartCommunication) {
      const fieldMapping = window.chartCommunication.getFieldMapping(canvasId);
      window.chartCommunication.registerChart(canvasId, {
        type: 'line',
        field: fieldMapping?.field || null,
        operator: fieldMapping?.op || null
      });
    }
    
    // Adicionar handler de clique se fornecido
    if (options.onClick) {
      chart.canvas.style.cursor = 'pointer';
      chart.canvas.onclick = (evt) => {
        const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        if (points.length > 0) {
          const point = points[0];
          const label = chart.data.labels[point.index];
          const datasetIndex = point.datasetIndex;
          const value = chart.data.datasets[datasetIndex].data[point.index];
          
          // Chamar callback customizado primeiro (se existir)
          if (typeof options.onClickCallback === 'function') {
            options.onClickCallback(evt, points, chart);
            // Se o callback customizado foi chamado, não aplicar filtro padrão
            // (o callback customizado deve aplicar o filtro se necessário)
            return;
          }
          
          // Chamar callback customizado (compatibilidade com versão antiga)
          if (typeof options.onClick === 'function') {
            options.onClick(evt, points, chart);
          }
          
          // Mostrar feedback visual
          if (window.chartCommunication) {
            window.chartCommunication.showFeedback(canvasId, label, value);
          }
          
          // Aplicar filtro se mapeamento existir
          if (window.chartCommunication) {
            const fieldMapping = window.chartCommunication.getFieldMapping(canvasId);
            if (fieldMapping && fieldMapping.field) {
              window.chartCommunication.applyFilter(
                fieldMapping.field,
                label,
                canvasId,
                { toggle: true, operator: fieldMapping.op, clearPrevious: true }
              );
            }
          }
        }
      };
    }
    
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico de linha ${canvasId}:`, error);
    }
    return null;
  }
}

async function createDoughnutChart(canvasId, labels, values, options = {}) {
  try {
    await ensureChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      if (window.Logger) {
        window.Logger.warn(`Canvas ${canvasId} não encontrado`);
      }
      return null;
    }
    
    if (window[canvasId] instanceof Chart) {
      window[canvasId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    const defaults = getChartDefaults('doughnut');
    const palette = getColorPalette();
    
    // Verificar se é tipo de manifestação e usar cores específicas
    const isTipoManifestacao = options.field === 'tipoDeManifestacao' || 
                                options.field === 'Tipo' ||
                                canvasId.toLowerCase().includes('tipo') ||
                                (labels && labels.some(l => {
                                  const tipoLower = (l || '').toLowerCase();
                                  return tipoLower.includes('elogio') || 
                                         tipoLower.includes('reclama') || 
                                         tipoLower.includes('denúncia') || 
                                         tipoLower.includes('denuncia') ||
                                         tipoLower.includes('sugest') ||
                                         tipoLower.includes('esic') ||
                                         tipoLower.includes('acesso') ||
                                         tipoLower.includes('não informado') ||
                                         tipoLower.includes('nao informado');
                                }));
    
    let backgroundColor, borderColor;
    
    if (isTipoManifestacao && window.config?.getColorByTipoManifestacao) {
      // Usar cores específicas por tipo de manifestação
      backgroundColor = labels.map((label, idx) => {
        const color = window.config.getColorByTipoManifestacao(label);
        return color ? getColorWithAlpha(color, 0.8) : getColorWithAlpha(getColorFromPalette(idx, palette), 0.8);
      });
      borderColor = labels.map((label, idx) => {
        const color = window.config.getColorByTipoManifestacao(label);
        return color || getColorFromPalette(idx, palette);
      });
    } else {
      // Usar paleta padrão
      backgroundColor = Array.isArray(values) && values.length > 0
        ? values.map((_, idx) => getColorWithAlpha(getColorFromPalette(idx, palette), 0.8))
        : [getColorWithAlpha(getColorFromPalette(0, palette), 0.8)];
      
      borderColor = Array.isArray(values) && values.length > 0
        ? values.map((_, idx) => getColorFromPalette(idx, palette))
        : [getColorFromPalette(0, palette)];
    }
    
    const config = {
      type: options.type || 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: options.label || 'Dados',
          data: values,
          backgroundColor: options.backgroundColor || backgroundColor,
          borderColor: options.borderColor || borderColor,
          borderWidth: options.borderWidth || 2
        }]
      },
      options: {
        ...defaults,
        ...options.chartOptions
      }
    };
    
    const chart = new Chart(ctx, config);
    window[canvasId] = chart;
    
    // Criar legenda interativa se container especificado
    if (options.legendContainer && labels && labels.length > 0) {
      if (window.chartLegend && window.chartLegend.createDoughnutLegend) {
        // Aguardar um pouco para garantir que o gráfico está renderizado
        setTimeout(() => {
          window.chartLegend.createDoughnutLegend(
            canvasId, 
            options.legendContainer, 
            labels, 
            values, 
            backgroundColor,
            options
          );
        }, 100);
      }
    }
    
    // Registrar gráfico no sistema de comunicação
    if (window.chartCommunication) {
      const fieldMapping = window.chartCommunication.getFieldMapping(canvasId);
      window.chartCommunication.registerChart(canvasId, {
        type: options.type || 'doughnut',
        field: fieldMapping?.field || null,
        operator: fieldMapping?.op || null
      });
    }
    
    // Adicionar handler de clique se fornecido
    if (options.onClick) {
      chart.canvas.style.cursor = 'pointer';
      chart.canvas.onclick = (evt) => {
        const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        if (points.length > 0) {
          const point = points[0];
          const label = chart.data.labels[point.index];
          const value = chart.data.datasets[point.datasetIndex].data[point.index];
          
          // Chamar callback customizado primeiro (se existir)
          if (typeof options.onClickCallback === 'function') {
            options.onClickCallback(evt, points, chart);
            // Se o callback customizado foi chamado, não aplicar filtro padrão
            // (o callback customizado deve aplicar o filtro se necessário)
            return;
          }
          
          // Chamar callback customizado (compatibilidade com versão antiga)
          if (typeof options.onClick === 'function') {
            options.onClick(evt, points, chart);
          }
          
          // Mostrar feedback visual
          if (window.chartCommunication) {
            window.chartCommunication.showFeedback(canvasId, label, value);
          }
          
          // Aplicar filtro se mapeamento existir
          if (window.chartCommunication) {
            const fieldMapping = window.chartCommunication.getFieldMapping(canvasId);
            if (fieldMapping && fieldMapping.field) {
              window.chartCommunication.applyFilter(
                fieldMapping.field,
                label,
                canvasId,
                { toggle: true, operator: fieldMapping.op, clearPrevious: true }
              );
            }
          }
        }
      };
    }
    
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao criar gráfico de rosca ${canvasId}:`, error);
    }
    return null;
  }
}

async function updateChart(canvasId, labels, values, options = {}) {
  try {
    const chart = window[canvasId];
    if (!chart || !(chart instanceof Chart)) {
      if (labels && values) {
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
    
    if (labels) {
      chart.data.labels = labels;
    }
    
    if (values) {
      if (Array.isArray(values) && values.length > 0) {
        if (typeof values[0] === 'object' && !Array.isArray(values[0]) && ('data' in values[0] || 'label' in values[0])) {
          chart.data.datasets = values.map((dataset, idx) => ({
            ...chart.data.datasets[idx],
            ...dataset,
            data: dataset.data || []
          }));
        } else if (Array.isArray(values[0]) && typeof values[0][0] === 'number') {
          chart.data.datasets = values.map((data, idx) => ({
            ...(chart.data.datasets[idx] || {}),
            data: data
          }));
        } else {
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
    
    if (options.chartOptions) {
      Object.assign(chart.options, options.chartOptions);
    }
    
    chart.update(options.animationMode || 'default');
    
    if (window.Logger) {
      window.Logger.debug(`Gráfico ${canvasId} atualizado`);
    }
    
    return chart;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao atualizar gráfico ${canvasId}:`, error);
    }
    return null;
  }
}

function createReactiveChart(canvasId, dataStoreKey, dataTransformer, chartOptions = {}) {
  if (!window.dataStore) {
    if (window.Logger) {
      window.Logger.warn('dataStore não disponível para gráfico reativo');
    }
    return () => {};
  }
  
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
  
  const initialData = window.dataStore.get(dataStoreKey);
  if (initialData) {
    updateChartFromStore(initialData);
  }
  
  const unsubscribe = window.dataStore.subscribe(dataStoreKey, updateChartFromStore);
  
  if (!window._chartFactoryUnsubscribes) {
    window._chartFactoryUnsubscribes = new Map();
  }
  window._chartFactoryUnsubscribes.set(canvasId, unsubscribe);
  
  return unsubscribe;
}

/**
 * Função utilitária global para destruir gráficos Chart.js de forma segura
 * Pode ser usada em qualquer página antes de criar novos gráficos
 * 
 * @param {string|string[]} chartId - ID do canvas ou array de IDs
 * @returns {boolean} - true se algum gráfico foi destruído
 */
function destroyChartSafely(chartId) {
  let destroyed = false;
  const ids = Array.isArray(chartId) ? chartId : [chartId];
  
  ids.forEach(id => {
    try {
      // Verificar se existe no window e tem método destroy
      if (window[id] && typeof window[id].destroy === 'function') {
        window[id].destroy();
        window[id] = null;
        destroyed = true;
        if (window.Logger) {
          window.Logger.debug(`Gráfico ${id} destruído (window[${id}])`);
        }
      }
      
      // Também tentar destruir via Chart.js se estiver disponível
      if (typeof window.Chart !== 'undefined' && typeof window.Chart.getChart === 'function') {
        const existingChart = window.Chart.getChart(id);
        if (existingChart && typeof existingChart.destroy === 'function') {
          existingChart.destroy();
          destroyed = true;
          if (window.Logger) {
            window.Logger.debug(`Gráfico ${id} destruído (Chart.getChart)`);
          }
        }
      }
      
      // Verificar se o canvas existe e limpar
      const canvas = document.getElementById(id);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } catch (error) {
      // Ignorar erros ao destruir gráficos (pode não existir)
      if (window.Logger) {
        window.Logger.debug(`Erro ao destruir gráfico ${id}:`, error);
      }
    }
  });
  
  return destroyed;
}

/**
 * Destruir múltiplos gráficos de uma vez
 * 
 * @param {string[]} chartIds - Array de IDs de gráficos
 */
function destroyCharts(chartIds) {
  if (!Array.isArray(chartIds) || chartIds.length === 0) {
    return;
  }
  
  chartIds.forEach(id => destroyChartSafely(id));
  
  if (window.Logger) {
    window.Logger.debug(`Destruídos ${chartIds.length} gráfico(s)`);
  }
}

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
    createReactiveChart,
    destroyChart: destroyChartSafely,
    destroyCharts: destroyCharts
  };
  
  if (window.Logger) {
    window.Logger.debug('✅ Chart Factory inicializado');
  }
}

