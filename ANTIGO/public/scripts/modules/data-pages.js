/**
 * Módulo: Páginas Específicas
 * Funções relacionadas a carregamento de dados de páginas específicas
 * Extraído de data.js para melhor organização
 */

/**
 * Helper para adicionar subscribe automático a um gráfico
 * @param {string} chartId - ID do gráfico
 * @param {string} dataStoreKey - Chave no dataStore para observar
 * @param {Function} dataTransformer - Função para transformar dados
 * @param {Object} chartOptions - Opções do gráfico (type, horizontal, etc.)
 */
function addChartSubscribe(chartId, dataStoreKey, dataTransformer, chartOptions = {}) {
  if (!window.dataStore) return () => {};
  
  const unsubscribe = window.dataStore.subscribe(dataStoreKey, (newData) => {
    if (newData && Array.isArray(newData) && newData.length > 0) {
      const transformed = dataTransformer(newData);
      if (transformed && transformed.labels && transformed.values) {
        if (window.chartFactory && window.chartFactory.updateChart) {
          window.chartFactory.updateChart(chartId, transformed.labels, transformed.values, {
            type: chartOptions.type || 'bar',
            horizontal: chartOptions.horizontal !== false
          });
        } else {
          // Fallback: recriar gráfico
          const color = transformed.color || '#22d3ee';
          const options = transformed.options || {};
          if (chartOptions.type === 'doughnut' || chartOptions.type === 'pie') {
            // Para gráficos de pizza/rosquinha, usar Chart Factory se disponível
            if (window.chartFactory && window.chartFactory.createDoughnutChart) {
              window.chartFactory.createDoughnutChart(chartId, transformed.labels, transformed.values, {
                type: chartOptions.type || 'doughnut',
                colors: transformed.colors
              });
            }
          } else {
            createHorizontalBarChart(chartId, transformed.labels, transformed.values, color, options);
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

/**
 * Helper para criar gráfico de barras horizontal
 * NOVA ESTRATÉGIA: Usa Chart Factory quando disponível
 */
function createHorizontalBarChart(chartId, labels, values, color, options = {}) {
  try {
    // NOVA ESTRATÉGIA: Usar Chart Factory se disponível
    if (window.chartFactory && window.chartFactory.createBarChart) {
      // Converter cor hex para índice da paleta se necessário
      const palette = window.chartFactory.getColorPalette();
      let colorIndex = 1; // Padrão: cor secundária
      
      if (color && color.startsWith('#')) {
        // Tentar encontrar cor na paleta
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
 * Carregar Tema
 */
async function loadTema() {
  const functionName = 'loadTema';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    // Usar Promise compartilhada
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-tema');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/by-theme', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.tema || 'Não informado');
        const values = data.slice(0, 15).map(x => x.quantidade || 0);
        
        createHorizontalBarChart('chartTema', labels, values, '#22d3ee', {
          label: 'Tema',
          showDataLabels: true,
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        if (window.dataStore) {
          const unsubscribe = window.dataStore.subscribe('/api/aggregate/by-theme', (newData) => {
            if (newData && Array.isArray(newData) && newData.length > 0) {
              const updatedLabels = newData.slice(0, 15).map(x => x.tema || 'Não informado');
              const updatedValues = newData.slice(0, 15).map(x => x.quantidade || 0);
              if (window.chartFactory && window.chartFactory.updateChart) {
                window.chartFactory.updateChart('chartTema', updatedLabels, updatedValues, {
                  type: 'bar',
                  horizontal: true
                });
              } else {
                createHorizontalBarChart('chartTema', updatedLabels, updatedValues, '#22d3ee', {
                  label: 'Tema',
                  showDataLabels: true,
                  anchor: 'start'
                });
              }
            }
          });
          
          // Armazenar unsubscribe
          if (!window._dataStoreUnsubscribes) {
            window._dataStoreUnsubscribes = new Map();
          }
          window._dataStoreUnsubscribes.set('chartTema', unsubscribe);
        }
        
        // Heatmap
        const hm = await window.dataLoader?.load('/api/aggregate/heatmap?dim=Tema', { 
          fallback: { labels: [], rows: [] } 
        }) || { labels: [], rows: [] };
        
        if (window.data?.buildHeatmap) {
          window.data.buildHeatmap('heatmapTema', hm.labels || [], hm.rows || []);
        } else if (window.buildHeatmap) {
          buildHeatmap('heatmapTema', hm.labels || [], hm.rows || []);
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Tema:', error);
    } else {
      console.error('❌ Erro ao carregar Tema:', error);
    }
  }
}

/**
 * Carregar Assunto
 */
async function loadAssunto() {
  const functionName = 'loadAssunto';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    // Usar Promise compartilhada
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-assunto');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/by-subject', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.assunto || 'Não informado');
        const values = data.slice(0, 15).map(x => x.quantidade || 0);
        
        createHorizontalBarChart('chartAssunto', labels, values, '#a78bfa', {
          label: 'Assunto',
          showDataLabels: true,
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        if (window.dataStore) {
          const unsubscribe = window.dataStore.subscribe('/api/aggregate/by-subject', (newData) => {
            if (newData && Array.isArray(newData) && newData.length > 0) {
              const updatedLabels = newData.slice(0, 15).map(x => x.assunto || 'Não informado');
              const updatedValues = newData.slice(0, 15).map(x => x.quantidade || 0);
              if (window.chartFactory && window.chartFactory.updateChart) {
                window.chartFactory.updateChart('chartAssunto', updatedLabels, updatedValues, {
                  type: 'bar',
                  horizontal: true
                });
              } else {
                createHorizontalBarChart('chartAssunto', updatedLabels, updatedValues, '#a78bfa', {
                  label: 'Assunto',
                  showDataLabels: true,
                  anchor: 'start'
                });
              }
            }
          });
          
          // Armazenar unsubscribe
          if (!window._dataStoreUnsubscribes) {
            window._dataStoreUnsubscribes = new Map();
          }
          window._dataStoreUnsubscribes.set('chartAssunto', unsubscribe);
        }
        
        // Heatmap
        const hm = await window.dataLoader?.load('/api/aggregate/heatmap?dim=Assunto', { 
          fallback: { labels: [], rows: [] } 
        }) || { labels: [], rows: [] };
        
        if (window.data?.buildHeatmap) {
          window.data.buildHeatmap('heatmapAssunto', hm.labels || [], hm.rows || []);
        } else if (window.buildHeatmap) {
          buildHeatmap('heatmapAssunto', hm.labels || [], hm.rows || []);
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Assunto:', error);
    } else {
      console.error('❌ Erro ao carregar Assunto:', error);
    }
  }
}

/**
 * Carregar Categoria
 */
async function loadCategoria(forceRefresh = false) {
  const functionName = 'loadCategoria';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-categoria');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Categoria', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.key);
        const values = data.slice(0, 15).map(x => x.count);
        
        createHorizontalBarChart('chartCategoria', labels, values, '#f472b6', {
          label: 'Categoria',
          showDataLabels: true,
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartCategoria', '/api/aggregate/count-by?field=Categoria', (data) => ({
          labels: data.slice(0, 15).map(x => x.key),
          values: data.slice(0, 15).map(x => x.count),
          color: '#f472b6',
          options: { label: 'Categoria', showDataLabels: true, anchor: 'start' }
        }));
        
        // Heatmap
        const hm = await window.dataLoader?.load('/api/aggregate/heatmap?dim=Categoria', { 
          fallback: { labels: [], rows: [] } 
        }) || { labels: [], rows: [] };
        
        if (window.data?.buildHeatmap) {
          window.data.buildHeatmap('heatmapCategoria', hm.labels || [], hm.rows || []);
        } else if (window.buildHeatmap) {
          buildHeatmap('heatmapCategoria', hm.labels || [], hm.rows || []);
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Categoria:', error);
    } else {
      console.error('❌ Erro ao carregar Categoria:', error);
    }
  }
}

/**
 * Carregar Bairro
 */
async function loadBairro(forceRefresh = false) {
  const functionName = 'loadBairro';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-bairro');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Bairro', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.key);
        const values = data.slice(0, 15).map(x => x.count);
        
        createHorizontalBarChart('chartBairro', labels, values, '#f59e0b', {
          label: 'Bairro',
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartBairro', '/api/aggregate/count-by?field=Bairro', (data) => ({
          labels: data.slice(0, 15).map(x => x.key),
          values: data.slice(0, 15).map(x => x.count),
          color: '#f59e0b',
          options: { label: 'Bairro', anchor: 'start' }
        }));
        
        // Heatmap
        const hm = await window.dataLoader?.load('/api/aggregate/heatmap?dim=Bairro', { 
          fallback: { labels: [], rows: [] } 
        }) || { labels: [], rows: [] };
        
        if (window.data?.buildHeatmap) {
          window.data.buildHeatmap('heatmapBairro', hm.labels || [], hm.rows || []);
        } else if (window.buildHeatmap) {
          buildHeatmap('heatmapBairro', hm.labels || [], hm.rows || []);
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    console.error('❌ Erro ao carregar Bairro:', error);
  }
}

/**
 * Carregar UAC (Unidade de Cadastro)
 */
async function loadUAC(forceRefresh = false) {
  const functionName = 'loadUAC';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-uac');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=UAC', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.key);
        const values = data.slice(0, 15).map(x => x.count);
        
        createHorizontalBarChart('chartUAC', labels, values, '#34d399', {
          label: 'UAC',
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartUAC', '/api/aggregate/count-by?field=UAC', (data) => ({
          labels: data.slice(0, 15).map(x => x.key),
          values: data.slice(0, 15).map(x => x.count),
          color: '#34d399',
          options: { label: 'UAC', anchor: 'start' }
        }));
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    console.error('❌ Erro ao carregar UAC:', error);
  }
}

/**
 * Carregar Canal
 */
async function loadCanal(forceRefresh = false) {
  const functionName = 'loadCanal';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-canal');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Canal', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.key);
        const values = data.slice(0, 15).map(x => x.count);
        
        createHorizontalBarChart('chartCanal', labels, values, '#8b5cf6', {
          label: 'Canal',
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartCanal', '/api/aggregate/count-by?field=Canal', (data) => ({
          labels: data.slice(0, 15).map(x => x.key),
          values: data.slice(0, 15).map(x => x.count),
          color: '#8b5cf6',
          options: { label: 'Canal', anchor: 'start' }
        }));
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    console.error('❌ Erro ao carregar Canal:', error);
  }
}

/**
 * Carregar Prioridade
 */
async function loadPrioridade(forceRefresh = false) {
  const functionName = 'loadPrioridade';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-prioridade');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Prioridade', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.key);
        const values = data.slice(0, 15).map(x => x.count);
        
        createHorizontalBarChart('chartPrioridade', labels, values, '#fb7185', {
          label: 'Prioridade',
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartPrioridade', '/api/aggregate/count-by?field=Prioridade', (data) => ({
          labels: data.slice(0, 15).map(x => x.key),
          values: data.slice(0, 15).map(x => x.count),
          color: '#fb7185',
          options: { label: 'Prioridade', anchor: 'start' }
        }));
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    console.error('❌ Erro ao carregar Prioridade:', error);
  }
}

/**
 * Carregar Responsável
 */
async function loadResponsavel() {
  const functionName = 'loadResponsavel';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    // Usar Promise compartilhada
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-responsavel');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Responsavel', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.key);
        const values = data.slice(0, 15).map(x => x.count);
        
        createHorizontalBarChart('chartResponsavel', labels, values, '#06b6d4', {
          label: 'Responsável',
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartResponsavel', '/api/aggregate/count-by?field=Responsavel', (data) => ({
          labels: data.slice(0, 15).map(x => x.key),
          values: data.slice(0, 15).map(x => x.count),
          color: '#06b6d4',
          options: { label: 'Responsável', anchor: 'start' }
        }));
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    console.error('❌ Erro ao carregar Responsável:', error);
  }
}

/**
 * Renderizar dados de Órgão por Mês (para uso com cache)
 */
async function renderOrgaoMesData(cached) {
  if (!cached) return;
  
  const { dataOrgaos, dataMensal, dataOrgaoMes, total } = cached;
  
  // Renderizar lista de órgãos
  const totalOrgaos = dataOrgaos?.length || 0;
  const totalOrgaosEl = document.getElementById('totalOrgaos');
  if (totalOrgaosEl) totalOrgaosEl.textContent = totalOrgaos;
  
  const listaOrgaos = document.getElementById('listaOrgaos');
  if (listaOrgaos && dataOrgaos && dataOrgaos.length > 0) {
    const maxValue = Math.max(...dataOrgaos.map(d => d.count || 0), 1);
    listaOrgaos.innerHTML = dataOrgaos.map(item => {
      const width = ((item.count || 0) / maxValue) * 100;
      return `
        <div class="flex items-center gap-3 py-2 border-b border-white/5">
          <div class="flex-1 min-w-0">
            <div class="text-sm text-slate-300 truncate">${item.key || 'Não informado'}</div>
            <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
            </div>
          </div>
          <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${(item.count || 0).toLocaleString('pt-BR')}</div>
        </div>
      `;
    }).join('');
  }
  
  // Renderizar gráfico mensal
  if (dataMensal && dataMensal.length > 0) {
    const labels = dataMensal.map(x => {
      const ym = x.ym || x.month || '';
      return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
    });
    const values = dataMensal.map(x => x.count || 0);
    
    const chartEl = document.getElementById('chartOrgaoMes');
    if (chartEl && typeof Chart !== 'undefined') {
      if (window.chartOrgaoMes instanceof Chart) window.chartOrgaoMes.destroy();
      const ctx = chartEl.getContext('2d');
      
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartOrgaoMes = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Manifestações',
            data: values,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(),
              anchor: 'start',
              align: 'end'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            }
          }
        }
      });
      addClickFn(window.chartOrgaoMes, (label, value) => showFeedbackFn(null, label, value), 'chartOrgaoMes');
    }
  }
  
  // Renderizar KPI total
  const totalEl = document.getElementById('totalOrgaoMes');
  if (totalEl && total !== undefined) {
    totalEl.textContent = total.toLocaleString('pt-BR');
  }
  
  // Renderizar tabela
  const tabelaEl = document.getElementById('tabelaOrgaoMes');
  if (tabelaEl && dataOrgaoMes && dataOrgaoMes.length > 0) {
    const orgaosUnicos = [...new Set(dataOrgaoMes.map(d => d.orgao))].sort();
    const mesesUnicos = [...new Set(dataOrgaoMes.map(d => d.month))].sort();
    
    let html = '<table class="w-full text-sm border-collapse">';
    html += '<thead><tr class="border-b border-white/10">';
    html += '<th class="px-4 py-3 text-left text-slate-300 font-semibold">Órgão</th>';
    mesesUnicos.forEach(mes => {
      const formatted = window.dateUtils?.formatMonthYearShort?.(mes) || mes || 'N/A';
      html += `<th class="px-4 py-3 text-center text-slate-300 font-semibold">${formatted}</th>`;
    });
    html += '<th class="px-4 py-3 text-center text-slate-300 font-semibold">Total</th>';
    html += '</tr></thead><tbody>';
    
    const totalGeral = dataOrgaos?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    
    orgaosUnicos.forEach(orgao => {
      let totalOrgao = 0;
      html += '<tr class="border-b border-white/5 hover:bg-white/5">';
      html += `<td class="px-4 py-2 text-slate-200 font-medium">${orgao || 'Não informado'}</td>`;
      mesesUnicos.forEach(mes => {
        const item = dataOrgaoMes.find(d => d.orgao === orgao && d.month === mes);
        const count = item ? (item.count || 0) : 0;
        totalOrgao += count;
        html += `<td class="px-4 py-2 text-center text-slate-300">${count.toLocaleString('pt-BR')}</td>`;
      });
      html += `<td class="px-4 py-2 text-center text-cyan-300 font-bold">${totalOrgao.toLocaleString('pt-BR')}</td>`;
      html += '</tr>';
    });
    
    // Linha de totais
    html += '<tr class="border-t-2 border-cyan-500/50 bg-cyan-500/10 font-bold">';
    html += '<td class="px-4 py-3 text-cyan-300">TOTAL</td>';
    mesesUnicos.forEach(mes => {
      const totalMes = dataOrgaoMes.filter(d => d.month === mes).reduce((sum, d) => sum + (d.count || 0), 0);
      html += `<td class="px-4 py-3 text-center text-cyan-300">${totalMes.toLocaleString('pt-BR')}</td>`;
    });
    html += `<td class="px-4 py-3 text-center text-cyan-300">${totalGeral.toLocaleString('pt-BR')}</td>`;
    html += '</tr>';
    
    html += '</tbody></table>';
    tabelaEl.innerHTML = html;
  }
}

/**
 * Carregar Órgão por Mês
 * OTIMIZADO: Cache e Promise compartilhada
 */
async function loadOrgaoMes(forceRefresh = false) {
  const functionName = 'loadOrgaoMes';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Verificar cache
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) {
        await renderOrgaoMesData(cached);
        return;
      }
    }
    
    // Usar Promise compartilhada
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        // Verificar se a página está visível
        const page = document.getElementById('page-orgao-mes');
        if (!page) {
          if (window.Logger) {
            window.Logger.debug('Página orgao-mes não encontrada no DOM');
          }
          return;
        }
        
        if (page.style.display === 'none') {
          if (window.Logger) {
            window.Logger.debug('Página orgao-mes está oculta, aguardando...');
          }
          // Aguardar um pouco e tentar novamente se a página ficar visível
          return new Promise((resolve) => {
            const checkVisibility = () => {
              if (page.style.display !== 'none') {
                loadOrgaoMes(forceRefresh).then(resolve).catch(resolve);
              } else {
                // FASE 2.2: Usar timerManager
                const timerId = window.timerManager 
                  ? window.timerManager.setTimeout(checkVisibility, 100, 'loadOrgaoMes-visibility')
                  : setTimeout(checkVisibility, 100);
              }
            };
            checkVisibility();
          });
        }
        
        // Carregar dados de secretarias/órgãos
        if (window.Logger) {
          window.Logger.debug('Carregando dados de órgãos...');
        }
        
        const dataOrgaos = await window.dataLoader?.load('/api/aggregate/count-by?field=Secretaria', { fallback: [] }) || [];
        
        if (window.Logger) {
          window.Logger.debug(`Dados de órgãos carregados: ${dataOrgaos.length} itens`);
        }
        
        const totalOrgaos = dataOrgaos.length;
        const totalOrgaosEl = document.getElementById('totalOrgaos');
        if (totalOrgaosEl) {
          totalOrgaosEl.textContent = totalOrgaos;
        }
        
        // Criar lista visual de órgãos
        const listaOrgaos = document.getElementById('listaOrgaos');
        if (listaOrgaos) {
          if (dataOrgaos && dataOrgaos.length > 0) {
            const maxValue = Math.max(...dataOrgaos.map(d => d.count || 0), 1);
            listaOrgaos.innerHTML = dataOrgaos.map(item => {
              const width = ((item.count || 0) / maxValue) * 100;
              return `
                <div class="flex items-center gap-3 py-2 border-b border-white/5">
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-slate-300 truncate">${item.key || 'Não informado'}</div>
                    <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
                    </div>
                  </div>
                  <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${(item.count || 0).toLocaleString('pt-BR')}</div>
                </div>
              `;
            }).join('');
          } else {
            listaOrgaos.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum órgão encontrado</div>';
          }
        }
        
        // Carregar dados mensais
        const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
        
        const labels = dataMensal.map(x => {
          const ym = x.ym || x.month || '';
          return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
        });
        const values = dataMensal.map(x => x.count || 0);
        
        // Criar gráfico de barras mensal
        const chartEl = document.getElementById('chartOrgaoMes');
        if (chartEl && typeof Chart !== 'undefined') {
          if (window.chartOrgaoMes instanceof Chart) {
            window.chartOrgaoMes.destroy();
          }
          const ctx = chartEl.getContext('2d');
          
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartOrgaoMes = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Manifestações',
                data: values,
                backgroundColor: 'rgba(167,139,250,0.7)',
                borderColor: 'rgba(167,139,250,1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: tooltipFn(),
                datalabels: {
                  ...dataLabelsFn(),
                  anchor: 'start',
                  align: 'end'
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  ticks: { color: '#94a3b8' },
                  grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                  ticks: { color: '#94a3b8' },
                  grid: { color: 'rgba(255,255,255,0.05)' }
                }
              }
            }
          });
          addClickFn(window.chartOrgaoMes, (label, value) => showFeedbackFn(null, label, value), 'chartOrgaoMes');
        }
        
        // Atualizar KPI total
        const total = dataOrgaos.reduce((sum, item) => sum + (item.count || 0), 0);
        const totalEl = document.getElementById('totalOrgaoMes');
        if (totalEl) {
          totalEl.textContent = total.toLocaleString('pt-BR');
        }
        
        // Carregar e exibir tabela Por Órgão e Mês
        const dataOrgaoMes = await window.dataLoader?.load('/api/aggregate/count-by-orgao-mes', { fallback: [] }) || [];
        const tabelaEl = document.getElementById('tabelaOrgaoMes');
        if (tabelaEl && dataOrgaoMes && dataOrgaoMes.length > 0) {
          const orgaosUnicos = [...new Set(dataOrgaoMes.map(d => d.orgao))].sort();
          const mesesUnicos = [...new Set(dataOrgaoMes.map(d => d.month))].sort();
          
          let html = '<table class="w-full text-sm border-collapse">';
          html += '<thead><tr class="border-b border-white/10">';
          html += '<th class="px-4 py-3 text-left text-slate-300 font-semibold">Órgão</th>';
          mesesUnicos.forEach(mes => {
            const formatted = window.dateUtils?.formatMonthYearShort?.(mes) || mes || 'N/A';
            html += `<th class="px-4 py-3 text-center text-slate-300 font-semibold">${formatted}</th>`;
          });
          html += '<th class="px-4 py-3 text-center text-slate-300 font-semibold">Total</th>';
          html += '</tr></thead><tbody>';
          
          orgaosUnicos.forEach(orgao => {
            let totalOrgao = 0;
            html += '<tr class="border-b border-white/5 hover:bg-white/5">';
            html += `<td class="px-4 py-2 text-slate-200 font-medium">${orgao || 'Não informado'}</td>`;
            mesesUnicos.forEach(mes => {
              const item = dataOrgaoMes.find(d => d.orgao === orgao && d.month === mes);
              const count = item ? (item.count || 0) : 0;
              totalOrgao += count;
              html += `<td class="px-4 py-2 text-center text-slate-300">${count.toLocaleString('pt-BR')}</td>`;
            });
            html += `<td class="px-4 py-2 text-center text-cyan-300 font-bold">${totalOrgao.toLocaleString('pt-BR')}</td>`;
            html += '</tr>';
          });
          
          // Linha de totais
          html += '<tr class="border-t-2 border-cyan-500/50 bg-cyan-500/10 font-bold">';
          html += '<td class="px-4 py-3 text-cyan-300">TOTAL</td>';
          mesesUnicos.forEach(mes => {
            const totalMes = dataOrgaoMes.filter(d => d.month === mes).reduce((sum, d) => sum + (d.count || 0), 0);
            html += `<td class="px-4 py-3 text-center text-cyan-300">${totalMes.toLocaleString('pt-BR')}</td>`;
          });
          html += `<td class="px-4 py-3 text-center text-cyan-300">${total.toLocaleString('pt-BR')}</td>`;
          html += '</tr>';
          
          html += '</tbody></table>';
          tabelaEl.innerHTML = html;
        } else if (tabelaEl) {
          tabelaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado disponível para a tabela</div>';
        }
        
        // Salvar no cache
        const cacheData = { dataOrgaos, dataMensal, dataOrgaoMes, total };
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, cacheData);
        }
        
        return cacheData;
      } catch (error) {
        if (window.Logger) {
          window.Logger.error('Erro ao carregar Órgão por Mês:', error);
        } else {
          console.error('❌ Erro ao carregar Órgão por Mês:', error);
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Órgão por Mês:', error);
    } else {
      console.error('❌ Erro ao carregar Órgão por Mês:', error);
    }
  }
}

/**
 * Carregar Status Page
 */
async function loadStatusPage(forceRefresh = false) {
  const functionName = 'loadStatusPage';
  
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-status');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Status', { fallback: [] }) || [];
        const labels = data.slice(0, 15).map(x => x.key);
        const values = data.slice(0, 15).map(x => x.count);
        
        createHorizontalBarChart('chartStatus', labels, values, '#10b981', {
          label: 'Status',
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartStatus', '/api/aggregate/count-by?field=Status', (data) => ({
          labels: data.slice(0, 15).map(x => x.key),
          values: data.slice(0, 15).map(x => x.count),
          color: '#10b981',
          options: { label: 'Status', anchor: 'start' }
        }));
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    console.error('❌ Erro ao carregar Status Page:', error);
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  
  window.data.loadOrgaoMes = loadOrgaoMes;
  window.data.renderOrgaoMesData = renderOrgaoMesData;
  window.data.loadTempoMedio = loadTempoMedio;
  window.data.renderTempoMedioData = renderTempoMedioData;
  window.data.loadTema = loadTema;
  window.data.loadAssunto = loadAssunto;
  window.data.loadCategoria = loadCategoria;
  window.data.loadBairro = loadBairro;
  window.data.loadUAC = loadUAC;
  window.data.loadCanal = loadCanal;
  window.data.loadPrioridade = loadPrioridade;
  window.data.loadResponsavel = loadResponsavel;
  window.data.loadStatusPage = loadStatusPage;
  // NOVAS FUNÇÕES MIGRADAS
  window.data.loadTipo = loadTipo;
  window.data.loadSetor = loadSetor;
  window.data.loadSecretaria = loadSecretaria;
  window.data.loadSecretariasDistritos = loadSecretariasDistritos;
  window.data.loadCadastrante = loadCadastrante;
  window.data.loadReclamacoes = loadReclamacoes;
  window.data.loadProjecao2026 = loadProjecao2026;
  window.data.loadUnit = loadUnit;
  window.data.createHorizontalBarChart = createHorizontalBarChart;
  window.data.addChartSubscribe = addChartSubscribe;
  
  // Exportar também como variáveis globais para compatibilidade
  window.loadOrgaoMes = loadOrgaoMes;
  window.renderOrgaoMesData = renderOrgaoMesData;
  window.loadTempoMedio = loadTempoMedio;
  window.renderTempoMedioData = renderTempoMedioData;
  window.loadTema = loadTema;
  window.loadAssunto = loadAssunto;
  window.loadCategoria = loadCategoria;
  window.loadBairro = loadBairro;
  window.loadUAC = loadUAC;
  window.loadCanal = loadCanal;
  window.loadPrioridade = loadPrioridade;
  window.loadResponsavel = loadResponsavel;
  window.loadStatusPage = loadStatusPage;
  // NOVAS FUNÇÕES MIGRADAS
  window.loadTipo = loadTipo;
  window.loadSetor = loadSetor;
  window.loadSecretaria = loadSecretaria;
  window.loadSecretariasDistritos = loadSecretariasDistritos;
  window.loadCadastrante = loadCadastrante;
  window.loadReclamacoes = loadReclamacoes;
  window.loadProjecao2026 = loadProjecao2026;
  window.loadUnit = loadUnit;
  window.createHorizontalBarChart = createHorizontalBarChart;
  window.addChartSubscribe = addChartSubscribe;
  
  // Log de confirmação
  if (window.Logger) {
    window.Logger.debug('✅ data-pages.js: Todas as funções exportadas (incluindo novas migrações)');
  } else {
    console.log('✅ data-pages.js: Todas as funções exportadas (incluindo novas migrações)');
  }
}

/**
 * Renderizar dados de Tempo Médio (extraído para reutilização com cache)
 */
async function renderTempoMedioData(stats, dataMes) {
  try {
    // Atualizar estatísticas gerais
    if (stats) {
      const statMedia = document.getElementById('statMedia');
      const statMediana = document.getElementById('statMediana');
      const statMinimo = document.getElementById('statMinimo');
      const statMaximo = document.getElementById('statMaximo');
      
      if (statMedia) statMedia.textContent = stats.media || '0';
      if (statMediana) statMediana.textContent = stats.mediana || '0';
      if (statMinimo) statMinimo.textContent = stats.minimo || '0';
      if (statMaximo) statMaximo.textContent = stats.maximo || '0';
    }
    
    // Renderizar gráfico por mês (dados críticos)
    if (dataMes && Array.isArray(dataMes) && dataMes.length > 0) {
      const labelsMes = dataMes.map(x => {
        if (!x.month) return 'Mês inválido';
        try {
          const [year, month] = x.month.split('-');
          return `${month}/${year}`;
        } catch (e) {
          return x.month;
        }
      });
      const valuesMes = dataMes.map(x => x.dias || 0);
      
      const chartMesEl = document.getElementById('chartTempoMedioMes');
      if (chartMesEl) {
        if (window.chartTempoMedioMes instanceof Chart) window.chartTempoMedioMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        window.chartTempoMedioMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Tempo Médio (dias)',
              data: valuesMes,
              backgroundColor: 'rgba(34,211,238,0.7)',
              borderColor: 'rgba(34,211,238,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: {
                ...dataLabelsFn(),
                anchor: 'end',
                align: 'top'
              }
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedioMes, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioMes');
      }
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao renderizar dados de Tempo Médio:', error);
    } else {
      console.error('❌ Erro ao renderizar dados de Tempo Médio:', error);
    }
  }
}

/**
 * Carregar dados secundários de Tempo Médio (em background)
 */
function loadSecondaryTempoMedioData() {
  const loadSecondaryData = async () => {
    const results = [];
    
    const endpoints = [
      '/api/stats/average-time',
      '/api/stats/average-time/by-day',
      '/api/stats/average-time/by-week',
      '/api/stats/average-time/by-unit',
      '/api/stats/average-time/by-month-unit'
    ];
    
    for (let i = 0; i < endpoints.length; i++) {
      try {
        const result = await Promise.allSettled([
          window.dataLoader?.load(endpoints[i], {
            fallback: [],
            timeout: 45000,
            retries: 1
          }) || Promise.resolve([])
        ]);
        results.push(result[0]);
      } catch (e) {
        if (window.Logger) {
          window.Logger.warn(`Erro ao carregar ${endpoints[i]}:`, e);
        } else {
          console.warn(`⚠️ Erro ao carregar ${endpoints[i]}:`, e);
        }
        results.push({ status: 'rejected', reason: e });
      }
      
      if (i < endpoints.length - 1) {
        await new Promise(resolve => {
          if (window.timerManager) {
            window.timerManager.setTimeout(resolve, 300, 'request-delay');
          } else {
            setTimeout(resolve, 300);
          }
        });
      }
    }
    
    return results;
  };
  
  loadSecondaryData().then((results) => {
    const data = results[0].status === 'fulfilled' ? results[0].value : [];
    const dataDia = results[1].status === 'fulfilled' ? results[1].value : [];
    const dataSemana = results[2].status === 'fulfilled' ? results[2].value : [];
    const dataUnidade = results[3].status === 'fulfilled' ? results[3].value : [];
    const dataUnidadeMes = results[4].status === 'fulfilled' ? results[4].value : [];
    
    // Renderizar gráfico principal por órgão
    if (data && Array.isArray(data) && data.length > 0) {
      const labels = data.map(x => x.org);
      const values = data.map(x => x.dias);
      
      const chartEl = document.getElementById('chartTempoMedio');
      if (chartEl) {
        if (window.chartTempoMedio instanceof Chart) window.chartTempoMedio.destroy();
        const ctx = chartEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        window.chartTempoMedio = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Dias',
              data: values,
              backgroundColor: 'rgba(34,211,238,0.7)',
              borderColor: 'rgba(34,211,238,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            animation: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: {
                ...dataLabelsFn(),
                anchor: 'start',
                align: 'end'
              }
            },
            scales: {
              x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedio, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedio');
      }
      
      // Lista de ranking
      const listaEl = document.getElementById('listaTempoMedio');
      if (listaEl) {
        listaEl.innerHTML = data.map((item, idx) => `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 text-sm text-slate-300 truncate">${item.org}</div>
            <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${item.dias.toFixed(2)}</div>
          </div>
        `).join('');
      }
    } else {
      const chartEl = document.getElementById('chartTempoMedio');
      const listaEl = document.getElementById('listaTempoMedio');
      
      if (chartEl) {
        const ctx = chartEl.getContext('2d');
        ctx.clearRect(0, 0, chartEl.width, chartEl.height);
      }
      if (listaEl) {
        listaEl.innerHTML = '<div class="text-slate-400 text-center py-8">Nenhum dado disponível. Verifique se há registros com data de criação e conclusão.</div>';
      }
    }
    
    // Renderizar gráficos secundários quando disponíveis
    // Gráfico por Dia (linha)
    if (dataDia && Array.isArray(dataDia) && dataDia.length > 0) {
      const labelsDia = dataDia.map(x => {
        if (!x.date) return 'Data inválida';
        return window.dateUtils?.formatDateShort?.(x.date) || 'Data inválida';
      });
      const valuesDia = dataDia.map(x => x.dias || 0);
      
      const chartDiaEl = document.getElementById('chartTempoMedioDia');
      if (chartDiaEl) {
        if (window.chartTempoMedioDia instanceof Chart) window.chartTempoMedioDia.destroy();
        const ctxDia = chartDiaEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        window.chartTempoMedioDia = new Chart(ctxDia, {
          type: 'line',
          data: {
            labels: labelsDia,
            datasets: [{
              label: 'Tempo Médio (dias)',
              data: valuesDia,
              borderColor: 'rgba(34,211,238,1)',
              backgroundColor: 'rgba(34,211,238,0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'line', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedioDia, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioDia');
      }
    }
    
    // Gráfico por Semana (linha)
    if (dataSemana && Array.isArray(dataSemana) && dataSemana.length > 0) {
      const labelsSemana = dataSemana.map(x => {
        if (!x.week || typeof x.week !== 'string') return 'Semana inválida';
        return x.week.replace('W', ' Semana ');
      });
      const valuesSemana = dataSemana.map(x => x.dias || 0);
      
      const chartSemanaEl = document.getElementById('chartTempoMedioSemana');
      if (chartSemanaEl) {
        if (window.chartTempoMedioSemana instanceof Chart) window.chartTempoMedioSemana.destroy();
        const ctxSemana = chartSemanaEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        window.chartTempoMedioSemana = new Chart(ctxSemana, {
          type: 'line',
          data: {
            labels: labelsSemana,
            datasets: [{
              label: 'Tempo Médio (dias)',
              data: valuesSemana,
              borderColor: 'rgba(167,139,250,1)',
              backgroundColor: 'rgba(167,139,250,0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'line', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedioSemana, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioSemana');
      }
    }
    
    // Gráfico por Unidade de Cadastro
    if (dataUnidade && dataUnidade.length > 0) {
      const labelsUnidade = dataUnidade.map(x => x.unit || 'Não informado');
      const valuesUnidade = dataUnidade.map(x => x.dias || 0);
      
      const chartUnidadeEl = document.getElementById('chartTempoMedioUnidade');
      if (chartUnidadeEl) {
        if (window.chartTempoMedioUnidade instanceof Chart) window.chartTempoMedioUnidade.destroy();
        const ctxUnidade = chartUnidadeEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        window.chartTempoMedioUnidade = new Chart(ctxUnidade, {
          type: 'bar',
          data: {
            labels: labelsUnidade,
            datasets: [{
              label: 'Dias',
              data: valuesUnidade,
              backgroundColor: 'rgba(167,139,250,0.7)',
              borderColor: 'rgba(167,139,250,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            animation: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: {
                ...dataLabelsFn(),
                anchor: 'start',
                align: 'end'
              }
            },
            scales: {
              x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedioUnidade, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioUnidade');
      }
    }
    
    // Gráfico por Unidade de Cadastro por Mês
    if (dataUnidadeMes && dataUnidadeMes.length > 0) {
      // CORREÇÃO: O endpoint retorna 'mes' e 'unidade', não 'month' e 'unit'
      const meses = [...new Set(dataUnidadeMes.map(d => d.mes || d.month).filter(m => m && typeof m === 'string' && m.includes('-')))].sort();
      const unidades = [...new Set(dataUnidadeMes.map(d => d.unidade || d.unit).filter(u => u))];
      const colors = ['#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'];
      
      const datasets = unidades.slice(0, 10).map((unit, idx) => ({
        label: unit || 'Não informado',
        data: meses.map(month => {
          const item = dataUnidadeMes.find(d => (d.mes || d.month) === month && (d.unidade || d.unit) === unit);
          return item ? (item.dias || 0) : 0;
        }),
        backgroundColor: colors[idx % colors.length] + '80',
        borderColor: colors[idx % colors.length],
        borderWidth: 1
      }));
      
      const labelsMes = meses.map(m => {
        return window.dateUtils?.formatMonthYear?.(m) || m || 'Data inválida';
      });
      
      const chartUnidadeMesEl = document.getElementById('chartTempoMedioUnidadeMes');
      if (chartUnidadeMesEl) {
        if (window.chartTempoMedioUnidadeMes instanceof Chart) window.chartTempoMedioUnidadeMes.destroy();
        const ctxUnidadeMes = chartUnidadeMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        
        window.chartTempoMedioUnidadeMes = new Chart(ctxUnidadeMes, {
          type: 'line',
          data: {
            labels: labelsMes,
            datasets: datasets
          },
          options: {
            responsive: true,
            animation: false,
            plugins: {
              legend: { display: true, position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } },
              tooltip: tooltipFn(),
              datalabels: { display: false }
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  }).catch(error => {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar dados secundários de Tempo Médio:', error);
    } else {
      console.error('❌ Erro ao carregar dados secundários de Tempo Médio:', error);
    }
  });
}

/**
 * Carregar Tempo Médio
 * OTIMIZADO: Promise compartilhada e cache
 */
async function loadTempoMedio(forceRefresh = false) {
  const functionName = 'loadTempoMedio';
  
  try {
    // Verificar cache
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached) {
        await renderTempoMedioData(cached.stats, cached.dataMes);
        return;
      }
    }
    
    // Usar Promise compartilhada
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        // Verificar se a página está visível
        const page = document.getElementById('page-tempo-medio');
        if (!page || page.style.display === 'none') {
          return;
        }
        
        // OTIMIZADO: Carregar dados críticos em paralelo
        const criticalData = await Promise.allSettled([
          window.dataLoader?.load('/api/stats/average-time/stats', { 
            fallback: null,
            timeout: 30000 
          }) || Promise.resolve(null),
          window.dataLoader?.load('/api/stats/average-time/by-month', { 
            fallback: [],
            timeout: 30000 
          }) || Promise.resolve([])
        ]);
      
        const stats = criticalData[0].status === 'fulfilled' ? criticalData[0].value : null;
        const dataMes = criticalData[1].status === 'fulfilled' ? criticalData[1].value : [];
        
        // Salvar no cache
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { stats, dataMes });
        }
        
        // Renderizar dados críticos
        await renderTempoMedioData(stats, dataMes);
        
        // Carregar dados secundários em background (não bloqueia)
        loadSecondaryTempoMedioData();
      } catch (e) {
        if (window.Logger) {
          window.Logger.error('Erro ao carregar Tempo Médio:', e);
        } else {
          console.error('❌ Erro ao carregar Tempo Médio:', e);
        }
        throw e;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Tempo Médio:', error);
    } else {
      console.error('❌ Erro ao carregar Tempo Médio:', error);
    }
  }
}

/**
 * Carregar Tipo de Manifestação
 * NOVA ESTRATÉGIA: Usa Chart Factory e dataStore
 */
async function loadTipo() {
  const functionName = 'loadTipo';
  
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-tipo');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Tipo', { fallback: [] }) || [];
        const labels = data.slice(0, 10).map(x => x.key);
        const values = data.slice(0, 10).map(x => x.count);
        
        // NOVA ESTRATÉGIA: Usar Chart Factory
        if (window.chartFactory && window.chartFactory.createDoughnutChart) {
          const palette = window.chartFactory.getColorPalette();
          const colors = labels.map((_, idx) => palette[idx % palette.length]);
          
          window.chartFactory.createDoughnutChart('chartTipo', labels, values, {
            type: 'pie',
            colors: colors,
            onClick: (event, elements, chart) => {
              if (elements.length > 0 && window.showClickFeedback) {
                const index = elements[0].index;
                const label = chart.data.labels[index];
                const value = chart.data.datasets[0].data[index];
                window.showClickFeedback(null, label, value);
              }
            }
          });
        } else {
          // Fallback: método antigo
          const chartEl = document.getElementById('chartTipo');
          if (chartEl) {
            if (window.chartTipo instanceof Chart) window.chartTipo.destroy();
            const ctx = chartEl.getContext('2d');
            const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
            const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
            const addClickFn = window.charts?.addChartClickHandler || (() => ({}));
            const showFeedbackFn = window.showClickFeedback || (() => {});
            
            window.chartTipo = new Chart(ctx, {
              type: 'pie',
              data: {
                labels,
                datasets: [{
                  label: 'Tipo Manifestação',
                  data: values,
                  backgroundColor: ['#c084fc', '#22d3ee', '#facc15', '#fb7185']
                }]
              },
              options: {
                responsive: true,
                animation: false,
                plugins: {
                  tooltip: tooltipFn(),
                  datalabels: dataLabelsFn(true, 'pie')
                }
              }
            });
            addClickFn(window.chartTipo, (label, value) => showFeedbackFn(null, label, value), 'chartTipo');
          }
        }
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartTipo', '/api/aggregate/count-by?field=Tipo', (data) => ({
          labels: data.slice(0, 10).map(x => x.key),
          values: data.slice(0, 10).map(x => x.count),
          colors: data.slice(0, 10).map((_, idx) => {
            const palette = window.chartFactory?.getColorPalette() || ['#c084fc', '#22d3ee', '#facc15', '#fb7185'];
            return palette[idx % palette.length];
          })
        }), { type: 'pie' });
        
        // Lista de ranking
        const rankEl = document.getElementById('rankTipo');
        if (rankEl) {
          rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-violet-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Tipo:', error);
    } else {
      console.error('❌ Erro ao carregar Tipo:', error);
    }
  }
}

/**
 * Carregar Setor (Unidade de Cadastro)
 * NOVA ESTRATÉGIA: Usa Chart Factory e dataStore
 */
async function loadSetor() {
  const functionName = 'loadSetor';
  
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-setor');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Setor', { fallback: [] }) || [];
        const labels = data.slice(0, 10).map(x => x.key);
        const values = data.slice(0, 10).map(x => x.count);
        
        createHorizontalBarChart('chartSetor', labels, values, '#34d399', {
          label: 'Setor',
          showDataLabels: true,
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartSetor', '/api/aggregate/count-by?field=Setor', (data) => ({
          labels: data.slice(0, 10).map(x => x.key),
          values: data.slice(0, 10).map(x => x.count),
          color: '#34d399',
          options: { label: 'Setor', showDataLabels: true, anchor: 'start' }
        }));
        
        // Lista de ranking
        const rankEl = document.getElementById('rankSetor');
        if (rankEl) {
          rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-green-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Setor:', error);
    } else {
      console.error('❌ Erro ao carregar Setor:', error);
    }
  }
}

/**
 * Carregar Secretaria
 * NOVA ESTRATÉGIA: Usa Chart Factory e dataStore
 */
async function loadSecretaria() {
  const functionName = 'loadSecretaria';
  
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-secretaria');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Secretaria', { fallback: [] }) || [];
        const labels = data.slice(0, 10).map(x => x.key);
        const values = data.slice(0, 10).map(x => x.count);
        
        createHorizontalBarChart('chartSecretaria', labels, values, '#22d3ee', {
          label: 'Secretaria',
          showDataLabels: true,
          anchor: 'start'
        });
        
        // NOVA ESTRATÉGIA: Inscrever-se para atualizações automáticas
        addChartSubscribe('chartSecretaria', '/api/aggregate/count-by?field=Secretaria', (data) => ({
          labels: data.slice(0, 10).map(x => x.key),
          values: data.slice(0, 10).map(x => x.count),
          color: '#22d3ee',
          options: { label: 'Secretaria', showDataLabels: true, anchor: 'start' }
        }));
        
        // Lista de ranking
        const rankEl = document.getElementById('rankSecretaria');
        if (rankEl) {
          rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-cyan-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
        }
        
        // Gráfico mensal
        const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [];
        if (dataMensal && dataMensal.length > 0) {
          const labelsMes = dataMensal.map(x => {
            const ym = x.ym || x.month || '';
            return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
          });
          const valuesMes = dataMensal.map(x => x.count || 0);
          
          // NOVA ESTRATÉGIA: Usar Chart Factory
          if (window.chartFactory && window.chartFactory.createBarChart) {
            window.chartFactory.createBarChart('chartSecretariaMes', labelsMes, valuesMes, {
              label: 'Manifestações',
              colorIndex: 0,
              onClick: (event, elements, chart) => {
                if (elements.length > 0 && window.showClickFeedback) {
                  const index = elements[0].index;
                  const label = chart.data.labels[index];
                  const value = chart.data.datasets[0].data[index];
                  window.showClickFeedback(null, label, value);
                }
              }
            });
          } else {
            // Fallback: método antigo
            const chartMesEl = document.getElementById('chartSecretariaMes');
            if (chartMesEl) {
              if (window.chartSecretariaMes instanceof Chart) window.chartSecretariaMes.destroy();
              const ctxMes = chartMesEl.getContext('2d');
              const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
              const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
              
              window.chartSecretariaMes = new Chart(ctxMes, {
                type: 'bar',
                data: {
                  labels: labelsMes,
                  datasets: [{
                    label: 'Manifestações',
                    data: valuesMes,
                    backgroundColor: 'rgba(34,211,238,0.7)',
                    borderColor: 'rgba(34,211,238,1)',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: tooltipFn(),
                    datalabels: dataLabelsFn(false, 'bar', false)
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                  }
                }
              });
            }
          }
          
          // Subscribe para gráfico mensal
          addChartSubscribe('chartSecretariaMes', '/api/aggregate/by-month', (data) => ({
            labels: data.map(x => {
              const ym = x.ym || x.month || '';
              return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
            }),
            values: data.map(x => x.count || 0)
          }), { type: 'bar', horizontal: false });
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, labels, values });
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Secretaria:', error);
    } else {
      console.error('❌ Erro ao carregar Secretaria:', error);
    }
  }
}

/**
 * Carregar Secretarias e Distritos
 * NOVA ESTRATÉGIA: Usa Chart Factory e dataStore
 */
async function loadSecretariasDistritos() {
  const functionName = 'loadSecretariasDistritos';
  
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-secretarias-distritos');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const distritosData = await window.dataLoader?.load('/api/distritos', { fallback: null }) || null;
        
        if (!distritosData || !distritosData.distritos) {
          const listaEl = document.getElementById('listaDistritos');
          if (listaEl) {
            listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados de distritos</div>';
          }
          return;
        }
        
        const distritos = distritosData.distritos;
        const estatisticas = distritosData.estatisticas || {};
        
        // Renderizar lista de distritos
        const listaDistritos = document.getElementById('listaDistritos');
        if (listaDistritos) {
          listaDistritos.innerHTML = Object.entries(distritos).map(([nome, info]) => `
            <div class="distrito-item p-4 rounded-lg border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 cursor-pointer transition-all" 
                 data-distrito="${nome}" 
                 data-code="${info.code || ''}">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold text-cyan-300">${nome}</div>
                  <div class="text-xs text-slate-400 mt-1">
                    ${info.bairros ? info.bairros.length + ' bairros' : ''}
                    ${estatisticas.secretariasPorDistrito && estatisticas.secretariasPorDistrito[nome] 
                      ? ' • ' + estatisticas.secretariasPorDistrito[nome] + ' secretarias' 
                      : ''}
                  </div>
                </div>
                <div class="text-2xl">${info.code || '📍'}</div>
              </div>
            </div>
          `).join('');
          
          // Adicionar event listeners para seleção de distrito
          listaDistritos.querySelectorAll('.distrito-item').forEach(item => {
            item.addEventListener('click', async () => {
              // Remover seleção anterior
              listaDistritos.querySelectorAll('.distrito-item').forEach(i => {
                i.classList.remove('border-cyan-400', 'bg-cyan-500/10');
                i.classList.add('border-white/10');
              });
              
              // Marcar como selecionado
              item.classList.remove('border-white/10');
              item.classList.add('border-cyan-400', 'bg-cyan-500/10');
              
              const distritoNome = item.dataset.distrito;
              const distritoCode = item.dataset.code;
              
              // Atualizar nome do distrito selecionado
              const nomeEl = document.getElementById('distritoSelecionadoNome');
              if (nomeEl) nomeEl.textContent = distritoNome;
              
              // Carregar secretarias do distrito
              if (window.data?.loadSecretariasPorDistrito) {
                await window.data.loadSecretariasPorDistrito(distritoNome, distritoCode);
              }
            });
          });
        }
        
        // Renderizar estatísticas
        const estatisticasDiv = document.getElementById('estatisticasDistritos');
        if (estatisticasDiv) {
          estatisticasDiv.innerHTML = `
            <div class="glass rounded-xl p-4">
              <div class="text-slate-400 text-sm mb-1">Total de Secretarias</div>
              <div class="text-2xl font-bold text-cyan-300">${estatisticas.totalSecretarias || 0}</div>
            </div>
            <div class="glass rounded-xl p-4">
              <div class="text-slate-400 text-sm mb-1">Total de Distritos</div>
              <div class="text-2xl font-bold text-violet-300">${estatisticas.totalDistritos || 0}</div>
            </div>
            <div class="glass rounded-xl p-4">
              <div class="text-slate-400 text-sm mb-1">Total de Bairros</div>
              <div class="text-2xl font-bold text-emerald-300">${estatisticas.totalBairros || 0}</div>
            </div>
            <div class="glass rounded-xl p-4">
              <div class="text-slate-400 text-sm mb-1">Média Secretarias/Distrito</div>
              <div class="text-2xl font-bold text-amber-300">${estatisticas.totalSecretarias && estatisticas.totalDistritos 
                ? (estatisticas.totalSecretarias / estatisticas.totalDistritos).toFixed(1) 
                : 0}</div>
            </div>
          `;
        }
        
        // Criar gráfico de distribuição de secretarias por distrito
        if (estatisticas.secretariasPorDistrito) {
          const distritoLabels = Object.keys(estatisticas.secretariasPorDistrito).map(d => 
            d.replace('º Distrito - ', '').split('(')[0].trim()
          );
          const distritoValues = Object.values(estatisticas.secretariasPorDistrito);
          
          // NOVA ESTRATÉGIA: Usar Chart Factory
          if (window.chartFactory && window.chartFactory.createBarChart) {
            window.chartFactory.createBarChart('chartSecretariasDistritos', distritoLabels, distritoValues, {
              label: 'Quantidade de Secretarias',
              colorIndex: 9, // Cor laranja/amber
              chartOptions: {
                scales: {
                  x: { ticks: { maxRotation: 45, minRotation: 45 } }
                }
              },
              onClick: (event, elements, chart) => {
                if (elements.length > 0 && window.showClickFeedback) {
                  const index = elements[0].index;
                  const label = chart.data.labels[index];
                  const value = chart.data.datasets[0].data[index];
                  window.showClickFeedback(null, label, value);
                }
              }
            });
          } else {
            // Fallback: método antigo
            const chartEl = document.getElementById('chartSecretariasDistritos');
            if (chartEl) {
              if (window.chartSecretariasDistritos instanceof Chart) window.chartSecretariasDistritos.destroy();
              const ctx = chartEl.getContext('2d');
              const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
              const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
              
              window.chartSecretariasDistritos = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: distritoLabels,
                  datasets: [{
                    label: 'Quantidade de Secretarias',
                    data: distritoValues,
                    backgroundColor: 'rgba(245,158,11,0.7)',
                    borderColor: 'rgba(245,158,11,1)',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: tooltipFn(),
                    datalabels: dataLabelsFn()
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
                  }
                }
              });
            }
          }
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { distritosData, estatisticas });
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        const listaEl = document.getElementById('listaDistritos');
        if (listaEl) {
          listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados</div>';
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar secretarias e distritos:', error);
    } else {
      console.error('❌ Erro ao carregar secretarias e distritos:', error);
    }
  }
}

/**
 * Carregar Cadastrante
 * NOVA ESTRATÉGIA: Usa Chart Factory e dataStore
 */
async function loadCadastrante() {
  const functionName = 'loadCadastrante';
  
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-cadastrante');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const [servidores, uacs, dataMensal, summary] = await Promise.all([
          window.dataLoader?.load('/api/aggregate/by-server', { fallback: [] }) || [],
          window.dataLoader?.load('/api/aggregate/count-by?field=UAC', { fallback: [] }) || [],
          window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [],
          window.dataLoader?.load('/api/summary', { fallback: { total: 0 } }) || { total: 0 }
        ]);
        
        // Renderizar lista de servidores
        const listaServidores = document.getElementById('listaServidores');
        if (listaServidores) {
          listaServidores.innerHTML = servidores.map((item, idx) => {
            const width = (item.quantidade / Math.max(...servidores.map(d => d.quantidade), 1)) * 100;
            const isActive = window.globalFilters?.cadastranteFilter?.type === 'servidor' && window.globalFilters.cadastranteFilter.value === item.servidor;
            return `
              <div class="servidor-item flex items-center gap-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${isActive ? 'bg-cyan-500/20 border-cyan-500/30 border-l-4' : ''}" 
                   data-servidor="${item.servidor.replace(/"/g, '&quot;')}">
                <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-300 truncate font-medium">${item.servidor}</div>
                  <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
                  </div>
                </div>
                <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
              </div>
            `;
          }).join('');
          
          // Adicionar event listeners aos servidores
          listaServidores.querySelectorAll('.servidor-item').forEach(item => {
            item.addEventListener('click', function() {
              const servidor = this.getAttribute('data-servidor');
              if (window.updateCadastranteCharts) {
                window.updateCadastranteCharts({ type: 'servidor', value: servidor });
              }
            });
          });
        }
        
        // Renderizar lista de unidades de cadastro
        const listaUnidades = document.getElementById('listaUnidadesCadastro');
        if (listaUnidades) {
          listaUnidades.innerHTML = uacs.map((item, idx) => {
            const width = (item.count / Math.max(...uacs.map(d => d.count), 1)) * 100;
            const isActive = window.globalFilters?.cadastranteFilter?.type === 'unidadeCadastro' && window.globalFilters.cadastranteFilter.value === item.key;
            return `
              <div class="unidade-item flex items-center gap-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${isActive ? 'bg-violet-500/20 border-violet-500/30 border-l-4' : ''}" 
                   data-unidade="${item.key.replace(/"/g, '&quot;')}">
                <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-300 truncate font-medium">${item.key}</div>
                  <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style="width: ${width}%"></div>
                  </div>
                </div>
                <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${item.count.toLocaleString('pt-BR')}</div>
              </div>
            `;
          }).join('');
          
          // Adicionar event listeners às unidades
          listaUnidades.querySelectorAll('.unidade-item').forEach(item => {
            item.addEventListener('click', function() {
              const unidade = this.getAttribute('data-unidade');
              if (window.updateCadastranteCharts) {
                window.updateCadastranteCharts({ type: 'unidadeCadastro', value: unidade });
              }
            });
          });
        }
        
        // Gráfico mensal
        if (dataMensal && dataMensal.length > 0) {
          const labelsMes = dataMensal.map(x => {
            const ym = x.ym || x.month || '';
            return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
          });
          const valuesMes = dataMensal.map(x => x.count || 0);
          
          // NOVA ESTRATÉGIA: Usar Chart Factory
          if (window.chartFactory && window.chartFactory.createBarChart) {
            window.chartFactory.createBarChart('chartCadastranteMes', labelsMes, valuesMes, {
              label: 'Quantidade',
              colorIndex: 1, // Cor violet
              onClick: (event, elements, chart) => {
                if (elements.length > 0 && window.showClickFeedback) {
                  const index = elements[0].index;
                  const label = chart.data.labels[index];
                  const value = chart.data.datasets[0].data[index];
                  window.showClickFeedback(null, label, value);
                }
              }
            });
          } else {
            // Fallback: método antigo
            const chartMesEl = document.getElementById('chartCadastranteMes');
            if (chartMesEl) {
              if (window.chartCadastranteMes instanceof Chart) window.chartCadastranteMes.destroy();
              const ctxMes = chartMesEl.getContext('2d');
              const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
              const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
              
              window.chartCadastranteMes = new Chart(ctxMes, {
                type: 'bar',
                data: {
                  labels: labelsMes,
                  datasets: [{
                    label: 'Quantidade',
                    data: valuesMes,
                    backgroundColor: 'rgba(167,139,250,0.7)',
                    borderColor: 'rgba(167,139,250,1)',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: tooltipFn(),
                    datalabels: dataLabelsFn(false, 'bar', false)
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                  }
                }
              });
            }
          }
          
          // Subscribe para gráfico mensal
          addChartSubscribe('chartCadastranteMes', '/api/aggregate/by-month', (data) => ({
            labels: data.map(x => {
              const ym = x.ym || x.month || '';
              return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
            }),
            values: data.map(x => x.count || 0)
          }), { type: 'bar', horizontal: false });
        }
        
        // Total
        const totalEl = document.getElementById('totalCadastrante');
        if (totalEl) {
          totalEl.textContent = (summary.total || 0).toLocaleString('pt-BR');
        }
        
        if (window.updateCadastranteFiltersDisplay) {
          window.updateCadastranteFiltersDisplay();
        }
        
        if (window.globalFilters?.cadastranteFilter && window.updateCadastranteCharts) {
          await window.updateCadastranteCharts(window.globalFilters.cadastranteFilter);
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { servidores, uacs, dataMensal, summary });
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Cadastrante:', error);
    } else {
      console.error('❌ Erro ao carregar Cadastrante:', error);
    }
  }
}

/**
 * Carregar Reclamações e Denúncias
 * NOVA ESTRATÉGIA: Usa Chart Factory e dataStore
 */
async function loadReclamacoes() {
  const functionName = 'loadReclamacoes';
  
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-reclamacoes');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const [data, dataMensal] = await Promise.all([
          window.dataLoader?.load('/api/complaints-denunciations', { fallback: { assuntos: [], tipos: [] } }) || { assuntos: [], tipos: [] },
          window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || []
        ]);
        
        const assuntos = data.assuntos || [];
        const tipos = data.tipos || [];
        
        // Lista de assuntos
        const listaEl = document.getElementById('listaReclamacoes');
        if (listaEl) {
          listaEl.innerHTML = assuntos.map((item, idx) => {
            const width = assuntos.length > 0 ? (item.quantidade / Math.max(...assuntos.map(d => d.quantidade), 1)) * 100 : 0;
            return `
              <div class="flex items-center gap-3 py-2 border-b border-white/5">
                <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-300 truncate font-medium">${item.assunto}</div>
                  <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-rose-500 to-pink-500" style="width: ${width}%"></div>
                  </div>
                </div>
                <div class="text-lg font-bold text-rose-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
              </div>
            `;
          }).join('');
        }
        
        // Gráfico de tipos de ação
        const labels = tipos.map(t => t.tipo);
        const values = tipos.map(t => t.quantidade);
        
        // NOVA ESTRATÉGIA: Usar Chart Factory
        if (window.chartFactory && window.chartFactory.createBarChart) {
          window.chartFactory.createBarChart('chartReclamacoesTipo', labels, values, {
            horizontal: true,
            label: 'Quantidade',
            colorIndex: 4, // Cor rose/perigo
            chartOptions: {
              plugins: {
                datalabels: {
                  anchor: 'start',
                  align: 'end',
                  display: true
                }
              }
            },
            onClick: (event, elements, chart) => {
              if (elements.length > 0 && window.showClickFeedback) {
                const index = elements[0].index;
                const label = chart.data.labels[index];
                const value = chart.data.datasets[0].data[index];
                window.showClickFeedback(null, label, value);
              }
            }
          });
        } else {
          // Fallback: método antigo
          const chartTipoEl = document.getElementById('chartReclamacoesTipo');
          if (chartTipoEl) {
            if (window.chartReclamacoesTipo instanceof Chart) window.chartReclamacoesTipo.destroy();
            const ctx = chartTipoEl.getContext('2d');
            const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
            const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
            const addClickFn = window.charts?.addChartClickHandler || (() => ({}));
            const showFeedbackFn = window.showClickFeedback || (() => {});
            
            window.chartReclamacoesTipo = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Quantidade',
                  data: values,
                  backgroundColor: 'rgba(239,68,68,0.7)',
                  borderColor: 'rgba(239,68,68,1)',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                indexAxis: 'y',
                plugins: {
                  legend: { display: false },
                  tooltip: tooltipFn(),
                  datalabels: dataLabelsFn(false, 'bar', true)
                },
                scales: {
                  x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  y: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
              }
            });
            addClickFn(window.chartReclamacoesTipo, (label, value) => showFeedbackFn(null, label, value), 'chartReclamacoesTipo');
          }
        }
        
        // Gráfico por mês
        if (dataMensal && dataMensal.length > 0) {
          const labelsMes = dataMensal.map(x => {
            const ym = x.ym || x.month || '';
            return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
          });
          const valuesMes = dataMensal.map(x => x.count || 0);
          
          // NOVA ESTRATÉGIA: Usar Chart Factory
          if (window.chartFactory && window.chartFactory.createBarChart) {
            window.chartFactory.createBarChart('chartReclamacoesMes', labelsMes, valuesMes, {
              label: 'Quantidade',
              colorIndex: 4, // Cor rose/perigo
              onClick: (event, elements, chart) => {
                if (elements.length > 0 && window.showClickFeedback) {
                  const index = elements[0].index;
                  const label = chart.data.labels[index];
                  const value = chart.data.datasets[0].data[index];
                  window.showClickFeedback(null, label, value);
                }
              }
            });
          } else {
            // Fallback: método antigo
            const chartMesEl = document.getElementById('chartReclamacoesMes');
            if (chartMesEl) {
              if (window.chartReclamacoesMes instanceof Chart) window.chartReclamacoesMes.destroy();
              const ctxMes = chartMesEl.getContext('2d');
              const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
              const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
              
              window.chartReclamacoesMes = new Chart(ctxMes, {
                type: 'bar',
                data: {
                  labels: labelsMes,
                  datasets: [{
                    label: 'Quantidade',
                    data: valuesMes,
                    backgroundColor: 'rgba(239,68,68,0.7)',
                    borderColor: 'rgba(239,68,68,1)',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: tooltipFn(),
                    datalabels: dataLabelsFn(false, 'bar', false)
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                  }
                }
              });
            }
          }
          
          // Subscribe para gráfico mensal
          addChartSubscribe('chartReclamacoesMes', '/api/aggregate/by-month', (data) => ({
            labels: data.map(x => {
              const ym = x.ym || x.month || '';
              return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
            }),
            values: data.map(x => x.count || 0)
          }), { type: 'bar', horizontal: false });
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, dataMensal });
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Reclamações:', error);
    } else {
      console.error('❌ Erro ao carregar Reclamações:', error);
    }
  }
}

/**
 * Carregar Projeção 2026
 * NOVA ESTRATÉGIA: Usa Chart Factory e dataStore
 */
async function loadProjecao2026() {
  const functionName = 'loadProjecao2026';
  
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        const page = document.getElementById('page-projecao-2026');
        if (!page || page.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const [byMonth, temas] = await Promise.all([
          window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || [],
          window.dataLoader?.load('/api/aggregate/by-theme', { fallback: [] }) || []
        ]);
        
        // Processar dados mensais históricos
        const historico = byMonth.map(x => {
          const ym = x.ym || x.month || '';
          if (!ym || typeof ym !== 'string') {
            return {
              label: ym || 'Data inválida',
              value: x.count || 0,
              year: 0,
              month: 0
            };
          }
          const parts = ym.split('-');
          if (parts.length < 2) {
            return {
              label: ym,
              value: x.count || 0,
              year: 0,
              month: 0
            };
          }
          const [year, month] = parts;
          return {
            label: window.dateUtils?.formatMonthYear?.(ym) || ym,
            value: x.count || 0,
            year: parseInt(year) || 0,
            month: parseInt(month) || 0
          };
        });
        
        // Calcular média mensal dos últimos 12 meses
        const ultimos12Meses = historico.slice(-12);
        const mediaMensal = ultimos12Meses.reduce((sum, item) => sum + item.value, 0) / ultimos12Meses.length;
        
        // Gerar projeção para 2026 (12 meses)
        const projecao2026 = [];
        for (let mes = 1; mes <= 12; mes++) {
          const ym = `2026-${String(mes).padStart(2, '0')}`;
          projecao2026.push({
            label: window.dateUtils?.formatMonthYear?.(ym) || `${mes}/2026`,
            value: Math.round(mediaMensal * (1 + (Math.random() * 0.2 - 0.1))) // Variação de ±10%
          });
        }
        
        // Combinar histórico e projeção
        const todosLabels = [...historico.map(h => h.label), ...projecao2026.map(p => p.label)];
        const historicoValues = historico.map(h => h.value);
        const projecaoValues = projecao2026.map(p => p.value);
        
        // NOVA ESTRATÉGIA: Usar Chart Factory para gráfico de linha com múltiplos datasets
        if (window.chartFactory && window.chartFactory.createLineChart) {
          window.chartFactory.createLineChart('chartProjecaoMensal', todosLabels, [
            {
              label: 'Histórico',
              data: [...historicoValues, ...Array(12).fill(null)],
              borderColor: '#22d3ee',
              backgroundColor: 'rgba(34,211,238,0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Projeção 2026',
              data: [...Array(historico.length).fill(null), ...projecaoValues],
              borderColor: '#a78bfa',
              backgroundColor: 'rgba(167,139,250,0.1)',
              borderDash: [5, 5],
              fill: true,
              tension: 0.4
            }
          ], {
            chartOptions: {
              plugins: {
                legend: { display: true, position: 'top', labels: { color: '#94a3b8' } },
                datalabels: { display: false }
              },
              scales: {
                x: { ticks: { maxRotation: 45, minRotation: 45 } }
              }
            },
            onClick: (event, elements, chart) => {
              if (elements.length > 0 && window.showClickFeedback) {
                const index = elements[0].index;
                const label = chart.data.labels[index];
                const datasetIndex = elements[0].datasetIndex;
                const value = chart.data.datasets[datasetIndex].data[index];
                window.showClickFeedback(null, label, value);
              }
            }
          });
        } else {
          // Fallback: método antigo
          const chartMensalEl = document.getElementById('chartProjecaoMensal');
          if (chartMensalEl) {
            if (window.chartProjecaoMensal instanceof Chart) window.chartProjecaoMensal.destroy();
            const ctxMensal = chartMensalEl.getContext('2d');
            const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
            const addClickFn = window.charts?.addChartClickHandler || (() => ({}));
            const showFeedbackFn = window.showClickFeedback || (() => {});
            
            window.chartProjecaoMensal = new Chart(ctxMensal, {
              type: 'line',
              data: {
                labels: todosLabels,
                datasets: [
                  {
                    label: 'Histórico',
                    data: [...historicoValues, ...Array(12).fill(null)],
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34,211,238,0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                  },
                  {
                    label: 'Projeção 2026',
                    data: [...Array(historico.length).fill(null), ...projecaoValues],
                    borderColor: '#a78bfa',
                    backgroundColor: 'rgba(167,139,250,0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.4
                  }
                ]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: { display: true, position: 'top', labels: { color: '#94a3b8' } },
                  tooltip: tooltipFn(),
                  datalabels: { display: false }
                },
                scales: {
                  y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
              }
            });
            addClickFn(window.chartProjecaoMensal, (label, value) => showFeedbackFn(null, label, value), 'chartProjecaoMensal');
          }
        }
        
        // Exibir estatísticas
        const totalHistorico = historico.reduce((sum, item) => sum + item.value, 0);
        const totalProjetado = projecao2026.reduce((sum, item) => sum + item.value, 0);
        
        const totalHistoricoEl = document.getElementById('totalHistorico');
        const totalProjetadoEl = document.getElementById('totalProjetado');
        const mediaMensalEl = document.getElementById('mediaMensal');
        
        if (totalHistoricoEl) totalHistoricoEl.textContent = totalHistorico.toLocaleString('pt-BR');
        if (totalProjetadoEl) totalProjetadoEl.textContent = totalProjetado.toLocaleString('pt-BR');
        if (mediaMensalEl) mediaMensalEl.textContent = Math.round(mediaMensal).toLocaleString('pt-BR');
        
        // Top temas
        const topTemas = temas.slice(0, 10);
        const listaTemasEl = document.getElementById('listaTemasProjecao');
        if (listaTemasEl) {
          listaTemasEl.innerHTML = topTemas.map((item, idx) => `
            <div class="flex items-center gap-3 py-2 border-b border-white/5">
              <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
              <div class="flex-1 text-sm text-slate-300 truncate">${item.tema}</div>
              <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
            </div>
          `).join('');
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { historico, projecao2026, temas });
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Projeção 2026:', error);
    } else {
      console.error('❌ Erro ao carregar Projeção 2026:', error);
    }
  }
}

/**
 * Carregar Unidade de Saúde
 * NOVA ESTRATÉGIA: Usa Chart Factory e dataStore
 */
async function loadUnit(unitName) {
  const functionName = `loadUnit-${unitName}`;
  
  try {
    // Verificar cache
    if (window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(functionName);
      if (cached !== null) return;
    }
    
    return window.dataUtils?.getOrCreatePromise(functionName, async () => {
      try {
        // Mapear nomes das unidades para os nomes no banco
        const unitMap = {
          'adao': 'ADÃO',
          'cer iv': 'CER IV',
          'hospital olho': 'Hospital do Olho',
          'hospital duque': 'Hospital Duque',
          'hospital infantil': 'Hospital Infantil',
          'hospital moacyr': 'Hospital Moacyr',
          'maternidade santa cruz': 'Maternidade Santa Cruz',
          'upa beira mar': 'UPA Beira Mar',
          'uph pilar': 'UPH Pilar',
          'uph saracuruna': 'UPH Saracuruna',
          'uph xerem': 'UPH Xerém',
          'hospital veterinario': 'Hospital Veterinário',
          'upa walter garcia': 'UPA Walter Garcia',
          'uph campos eliseos': 'UPH Campos Elíseos',
          'uph parque equitativa': 'UPH Parque Equitativa',
          'ubs antonio granja': 'UBS Antonio Granja',
          'upa sarapui': 'UPA Sarapuí',
          'uph imbarie': 'UPH Imbariê'
        };
        
        const searchName = unitMap[unitName.toLowerCase()] || unitName;
        const pageId = `page-unit-${unitName.replace(/\s+/g, '-').toLowerCase()}`;
        const section = document.getElementById(pageId);
        if (!section || section.style.display === 'none') return;
        
        // Usar sistema global de carregamento
        const data = await window.dataLoader?.load(`/api/unit/${encodeURIComponent(searchName)}`, { fallback: null }) || null;
        
        if (!data) return;
        
        const assuntosContainer = section.querySelector('.unit-assuntos');
        const tiposCanvas = section.querySelector('.unit-tipos');
        
        // Lista de assuntos
        const assuntos = data.assuntos || [];
        if (assuntosContainer) {
          assuntosContainer.innerHTML = assuntos.map((item, idx) => {
            const width = assuntos.length > 0 ? (item.quantidade / Math.max(...assuntos.map(d => d.quantidade), 1)) * 100 : 0;
            return `
              <div class="flex items-center gap-3 py-2 border-b border-white/5">
                <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-300 truncate">${item.assunto}</div>
                  <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
                  </div>
                </div>
                <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
              </div>
            `;
          }).join('');
        }
        
        // Gráfico de tipos
        const tipos = data.tipos || [];
        if (tiposCanvas && tipos.length > 0) {
          const labels = tipos.map(t => t.tipo);
          const values = tipos.map(t => t.quantidade);
          const chartId = `chartUnit${unitName.replace(/\s+/g, '')}Tipos`;
          
          // NOVA ESTRATÉGIA: Usar Chart Factory
          if (window.chartFactory && window.chartFactory.createDoughnutChart) {
            const palette = window.chartFactory.getColorPalette();
            const colors = labels.map((_, idx) => palette[idx % palette.length]);
            
            window.chartFactory.createDoughnutChart(chartId, labels, values, {
              type: 'doughnut',
              colors: colors,
              chartOptions: {
                plugins: {
                  legend: { display: true, position: 'right', labels: { color: '#94a3b8' } }
                }
              },
              onClick: (event, elements, chart) => {
                if (elements.length > 0 && window.showClickFeedback) {
                  const index = elements[0].index;
                  const label = chart.data.labels[index];
                  const value = chart.data.datasets[0].data[index];
                  window.showClickFeedback(null, label, value);
                }
              }
            });
          } else {
            // Fallback: método antigo
            if (window[chartId] instanceof Chart) {
              window[chartId].destroy();
            }
            
            const ctx = tiposCanvas.getContext('2d');
            const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
            const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
            const addClickFn = window.charts?.addChartClickHandler || (() => ({}));
            const showFeedbackFn = window.showClickFeedback || (() => {});
            
            window[chartId] = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels,
                datasets: [{
                  data: values,
                  backgroundColor: ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  legend: { display: true, position: 'right', labels: { color: '#94a3b8' } },
                  tooltip: tooltipFn(),
                  datalabels: dataLabelsFn(true, 'doughnut')
                }
              }
            });
            addClickFn(window[chartId], (label, value) => showFeedbackFn(null, label, value));
          }
        }
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(functionName, { data, assuntos, tipos });
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em ${functionName}:`, error);
        } else {
          console.error(`❌ Erro em ${functionName}:`, error);
        }
        throw error;
      }
    });
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao carregar Unidade ${unitName}:`, error);
    } else {
      console.error(`❌ Erro ao carregar Unidade ${unitName}:`, error);
    }
  }
}

