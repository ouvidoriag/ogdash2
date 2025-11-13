/**
 * Módulo: Páginas Específicas
 * Funções relacionadas a carregamento de dados de páginas específicas
 * Extraído de data.js para melhor organização
 */

/**
 * Helper para criar gráfico de barras horizontal
 */
function createHorizontalBarChart(chartId, labels, values, color, options = {}) {
  try {
    const chartEl = document.getElementById(chartId);
    if (!chartEl) {
      // FASE 2.1: Usar Logger
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
    // FASE 2.1: Usar Logger
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
  window.data.createHorizontalBarChart = createHorizontalBarChart;
  
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
  window.createHorizontalBarChart = createHorizontalBarChart;
  
  // Log de confirmação
  if (window.Logger) {
    window.Logger.debug('✅ data-pages.js: loadOrgaoMes e loadTempoMedio exportados');
  } else {
    console.log('✅ data-pages.js: loadOrgaoMes e loadTempoMedio exportados');
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

