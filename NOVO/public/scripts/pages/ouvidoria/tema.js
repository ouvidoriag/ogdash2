/**
 * Página: Por Tema
 * Análise de manifestações por tema
 * 
 * Recriada com estrutura otimizada
 */

let filtroMesTema = '';

async function loadTema() {
  // PRIORIDADE 1: Verificar dependências críticas
  const dependencies = window.errorHandler?.requireDependencies(
    ['dataLoader', 'chartFactory'],
    () => {
      window.errorHandler?.showNotification(
        'Sistemas não carregados. Recarregue a página.',
        'warning'
      );
      return null;
    }
  );
  
  if (!dependencies) {
    return Promise.resolve();
  }
  
  const { dataLoader, chartFactory } = dependencies;
  
  if (window.Logger) {
    window.Logger.debug('📑 loadTema: Iniciando');
  }
  
  const page = document.getElementById('page-tema');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  // PRIORIDADE 2: Mostrar loading
  window.loadingManager?.show('Carregando dados de temas...');
  
  // PRIORIDADE 1: Usar safeAsync para tratamento de erros
  return await window.errorHandler?.safeAsync(async () => {
    // Coletar filtros de mês
    const filtrosMes = window.MonthFilterHelper?.coletarFiltrosMes?.('filtroMesTema') || [];
    
    // Combinar com filtros globais
    let activeFilters = filtrosMes;
    if (window.chartCommunication) {
      const globalFilters = window.chartCommunication.filters?.filters || [];
      activeFilters = [...globalFilters, ...filtrosMes];
    }
    
    // Destruir gráficos existentes antes de criar novos
    if (chartFactory?.destroyCharts) {
      chartFactory.destroyCharts([
        'chartTema',
        'chartStatusTema',
        'chartTemaMes'
      ]);
    }
    
    // Aplicar filtros se houver
    let dataTemasRaw = [];
    let filtrosAplicados = false;
    
    if (activeFilters.length > 0) {
      filtrosAplicados = true;
      try {
        const filterRequest = {
          filters: activeFilters,
          originalUrl: '/api/aggregate/by-theme'
        };
        
        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(filterRequest)
        });
        
        if (response.ok) {
          const filteredData = await response.json();
          if (Array.isArray(filteredData) && filteredData.length > 0) {
            const temaMap = new Map();
            filteredData.forEach(record => {
              const tema = record.tema || record.data?.tema || 'N/A';
              if (tema && tema !== 'N/A') {
                temaMap.set(tema, (temaMap.get(tema) || 0) + 1);
              }
            });
            
            dataTemasRaw = Array.from(temaMap.entries())
              .map(([tema, count]) => ({ tema, quantidade: count }))
              .sort((a, b) => b.quantidade - a.quantidade);
          }
        }
      } catch (error) {
        if (window.Logger) {
          window.Logger.warn('Erro ao aplicar filtros, carregando sem filtros:', error);
        }
        filtrosAplicados = false;
      }
    }
    
    // Se não aplicou filtros ou deu erro, carregar normalmente
    if (!filtrosAplicados || dataTemasRaw.length === 0) {
      dataTemasRaw = await dataLoader.load('/api/aggregate/by-theme', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [];
    }
    
    // PRIORIDADE 1: Validar dados recebidos
    const validation = window.dataValidator?.validateApiResponse(dataTemasRaw, {
      arrayItem: {
        types: { tema: 'string', quantidade: 'number' }
      }
    });
    
    if (!validation.valid) {
      throw new Error(`Dados inválidos: ${validation.error}`);
    }
    
    if (!Array.isArray(validation.data)) {
      throw new Error('Dados não são um array válido');
    }
    
    dataTemasRaw = validation.data;
    
    // Normalizar dados (endpoint retorna { tema, quantidade }, mas código espera { theme, count })
    const dataTemas = dataTemasRaw.map(item => ({
      theme: item.theme || item.tema || 'N/A',
      tema: item.tema || item.theme || 'N/A',
      count: item.count || item.quantidade || 0,
      quantidade: item.quantidade || item.count || 0,
      _id: item.theme || item.tema || 'N/A'
    }));
    
    if (window.Logger) {
      window.Logger.debug('📑 loadTema: Dados carregados', { 
        raw: dataTemasRaw.length, 
        normalized: dataTemas.length,
        sample: dataTemas[0] 
      });
    }
    
    // Carregar dados mensais de temas
    const dataTemaMesRaw = await dataLoader.load('/api/aggregate/count-by-status-mes?field=Tema', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // PRIORIDADE 1: Validar dados mensais
    const mensalValidation = window.dataValidator?.validateApiResponse(dataTemaMesRaw, {
      arrayItem: {
        types: { theme: 'string', count: 'number' }
      }
    });
    
    const dataTemaMes = mensalValidation.valid ? mensalValidation.data : [];
    
    // Renderizar gráfico principal
    await renderTemaChart(dataTemas);
    
    // Renderizar status por tema
    await renderStatusTemaChart(dataTemas);
    
    // Renderizar temas por mês (precisa dos dados para ordenar)
    await renderTemaMesChart(dataTemaMes, dataTemas);
    
    // Renderizar lista completa (com checkboxes integrados)
    renderTemasList(dataTemas, dataTemaMes);
    
    // Atualizar KPIs
    updateTemaKPIs(dataTemas);
    
    if (window.Logger) {
      window.Logger.success('📑 loadTema: Concluído');
    }
    
    // PRIORIDADE 2: Esconder loading
    window.loadingManager?.hide();
    
    return { success: true, dataTemas, dataTemaMes };
  }, 'loadTema', {
    showToUser: true,
    fallback: () => {
      // PRIORIDADE 2: Esconder loading em caso de erro
      window.loadingManager?.hide();
      
      const listaTemas = document.getElementById('listaTemas');
      if (listaTemas) {
        listaTemas.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados. Tente recarregar a página.</div>';
      }
      return { success: false, dataTemas: [], dataTemaMes: [] };
    }
  });
}

/**
 * Inicializar listeners de filtro para a página Tema
 * Escuta eventos do sistema de comunicação de gráficos para recarregar dados
 */
function initTemaFilterListeners() {
  if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
    window.chartCommunication.createPageFilterListener('page-tema', loadTema, 500);
    if (window.Logger) {
      window.Logger.success('✅ Listeners de filtro para Tema inicializados');
    }
  }
}

// Exportar função imediatamente
window.loadTema = loadTema;

// Inicializar listeners quando o script carregar
function initTemaPage() {
  initTemaFilterListeners();
  
  if (window.MonthFilterHelper && window.MonthFilterHelper.inicializarFiltroMes) {
    window.MonthFilterHelper.inicializarFiltroMes({
      selectId: 'filtroMesTema',
      endpoint: '/api/aggregate/by-month',
      mesSelecionado: filtroMesTema,
      onChange: async (novoMes) => {
        filtroMesTema = novoMes;
        await loadTema();
      }
    });
  } else {
    setTimeout(initTemaPage, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTemaPage);
} else {
  initTemaPage();
}

async function renderTemaChart(dataTemas) {
  if (!dataTemas || !Array.isArray(dataTemas) || dataTemas.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemaChart: dados inválidos ou vazios', dataTemas);
    }
    return;
  }
  
  // Mostrar top 10 temas (ou todos se menos de 10)
  const topTemas = dataTemas.slice(0, Math.min(10, dataTemas.length));
  const labels = topTemas.map(t => t.theme || t.tema || t._id || 'N/A');
  const values = topTemas.map(t => t.count || t.quantidade || 0);
  
  // Calcular total para percentuais
  const total = dataTemas.reduce((sum, item) => sum + (item.count || item.quantidade || 0), 0);
  
  if (window.Logger) {
    window.Logger.debug('📊 renderTemaChart:', { 
      total: dataTemas.length, 
      topTemas: topTemas.length, 
      totalManifestacoes: total,
      sample: topTemas[0] 
    });
  }
  
  // Preparar cores vibrantes (violeta/roxo para temas)
  const canvas = document.getElementById('chartTema');
  if (!canvas) return;
  const colorPalette = [
    { bg: 'rgba(139, 92, 246, 0.8)', border: 'rgba(139, 92, 246, 1)' }, // violet-500
    { bg: 'rgba(124, 58, 237, 0.8)', border: 'rgba(124, 58, 237, 1)' }, // violet-600
    { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgba(168, 85, 247, 1)' }, // purple-500
    { bg: 'rgba(147, 51, 234, 0.8)', border: 'rgba(147, 51, 234, 1)' }, // purple-600
    { bg: 'rgba(192, 132, 252, 0.8)', border: 'rgba(192, 132, 252, 1)' }, // purple-400
    { bg: 'rgba(167, 139, 250, 0.8)', border: 'rgba(167, 139, 250, 1)' }, // violet-400
    { bg: 'rgba(196, 181, 253, 0.8)', border: 'rgba(196, 181, 253, 1)' }, // violet-300
    { bg: 'rgba(221, 214, 254, 0.8)', border: 'rgba(221, 214, 254, 1)' }, // violet-200
    { bg: 'rgba(237, 233, 254, 0.8)', border: 'rgba(237, 233, 254, 1)' }, // violet-100
    { bg: 'rgba(245, 243, 255, 0.8)', border: 'rgba(245, 243, 255, 1)' }  // violet-50
  ];
  
  const backgrounds = labels.map((_, idx) => {
    const color = colorPalette[idx % colorPalette.length];
    return color.bg;
  });
  
  const borders = labels.map((_, idx) => {
    const color = colorPalette[idx % colorPalette.length];
    return color.border;
  });
  
  // Criar gráfico de barras horizontais (melhor para muitos temas)
  const chart = await window.chartFactory?.createBarChart('chartTema', labels, values, {
    horizontal: true, // Barras horizontais
    colorIndex: 2,
    label: 'Manifestações',
    backgroundColor: backgrounds,
    borderColor: borders,
    onClick: true, // Habilitar interatividade
    chartOptions: {
      indexAxis: 'y', // Horizontal
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 11,
              weight: '500'
            },
            color: 'rgba(148, 163, 184, 0.9)',
            callback: function(value) {
              return value.toLocaleString('pt-BR');
            }
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
            drawBorder: false
          }
        },
        y: {
          ticks: {
            font: {
              size: 11,
              weight: '500'
            },
            color: 'rgba(148, 163, 184, 0.9)',
            callback: function(value, index) {
              const label = labels[index];
              // Truncar labels muito longos
              if (label && label.length > 40) {
                return label.substring(0, 37) + '...';
              }
              return label || '';
            }
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: 'rgba(196, 181, 253, 1)',
          bodyColor: 'rgba(226, 232, 240, 1)',
          borderColor: 'rgba(139, 92, 246, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              const label = context[0].label;
              return `📌 ${label}`;
            },
            label: function(context) {
              const value = context.parsed.x;
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return [
                `Quantidade: ${value.toLocaleString('pt-BR')}`,
                `Percentual: ${percent}%`,
                `Posição: #${context.dataIndex + 1}`
              ];
            },
            footer: function(tooltipItems) {
              if (dataTemas.length > topTemas.length) {
                const outros = dataTemas.slice(topTemas.length);
                const totalOutros = outros.reduce((sum, item) => 
                  sum + (item.count || item.quantidade || 0), 0);
                const percentOutros = total > 0 ? ((totalOutros / total) * 100).toFixed(1) : 0;
                return `\nOutros ${dataTemas.length - topTemas.length} temas: ${totalOutros.toLocaleString('pt-BR')} (${percentOutros}%)`;
              }
              return '';
            }
          }
        },
        legend: {
          display: false
        },
        datalabels: {
          display: false // Desabilitar labels nas barras (vamos usar plugin customizado se necessário)
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
  
  // Adicionar interatividade de clique para filtrar (após criação do gráfico)
  if (chart) {
    // Configurar onClick no gráfico
    chart.options.onClick = (event, elements) => {
      if (elements && elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const tema = labels[index];
        
        if (tema && window.chartCommunication && window.chartCommunication.filters) {
          if (window.Logger) {
            window.Logger.debug('📊 Clique no gráfico chartTema (tema):', { tema, index });
          }
          
          // Adicionar filtro por tema
          window.chartCommunication.filters.add({
            field: 'tema',
            operator: 'equals',
            value: tema
          });
          
          // Notificar mudanças
          window.chartCommunication.notifyListeners();
        }
      }
    };
    
    // Adicionar estilo de cursor pointer ao canvas e handlers de interação
    if (chart.canvas) {
      chart.canvas.style.cursor = 'pointer';
      chart.canvas.title = 'Clique em uma barra para filtrar por tema | Clique com botão direito para limpar filtros';
      
      // Adicionar handler para hover (mudar cursor)
      chart.canvas.addEventListener('mousemove', (e) => {
        const elements = chart.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
        chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
      });
      
      // Adicionar handler para clique direito (limpar filtros)
      const chartContainer = chart.canvas.parentElement;
      if (chartContainer && !chartContainer.dataset.crossfilterEnabled) {
        chartContainer.dataset.crossfilterEnabled = 'true';
        chartContainer.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (window.chartCommunication && window.chartCommunication.filters) {
            window.chartCommunication.filters.clear();
            window.chartCommunication.notifyListeners();
            if (window.Logger) {
              window.Logger.debug('📊 Filtros limpos via clique direito no chartTema');
            }
          }
        });
      }
    }
  }
  
  return chart;
}

async function renderStatusTemaChart(dataTemas) {
  if (!dataTemas || !Array.isArray(dataTemas) || dataTemas.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderStatusTemaChart: dados inválidos ou vazios');
    }
    return;
  }
  
  // Se os dados não têm statusCounts, buscar status geral
  // Usar dashboard-data que já tem os dados de status
  try {
    const dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || {};
    
    const statusData = dashboardData.manifestationsByStatus || [];
    
    if (statusData.length > 0) {
      const labels = statusData.map(s => s.status || s._id || 'N/A');
      const values = statusData.map(s => s.count || 0);
      
      await window.chartFactory?.createDoughnutChart('chartStatusTema', labels, values, {
        type: 'doughnut',
        onClick: false,
        legendContainer: 'legendStatusTema'
      });
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao renderizar status por tema:', error);
    }
  }
}

async function renderTemaMesChart(dataTemaMes, dataTemas = null) {
  if (!dataTemaMes || !Array.isArray(dataTemaMes) || dataTemaMes.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemaMesChart: dados inválidos ou vazios');
    }
    return;
  }
  
  // Processar dados para gráfico de barras agrupadas
  const meses = [...new Set(dataTemaMes.map(d => d.month || d.ym))].sort();
  const todosTemas = [...new Set(dataTemaMes.map(d => d.theme || d.tema || d._id))];
  
  // Ordenar temas por total de manifestações (maior primeiro)
  const temasComTotal = todosTemas.map(tema => {
    const total = dataTemaMes
      .filter(d => (d.theme === tema || d.tema === tema || d._id === tema))
      .reduce((sum, d) => sum + (d.count || 0), 0);
    return { tema, total };
  }).sort((a, b) => b.total - a.total);
  
  const temasOrdenados = temasComTotal.map(t => t.tema);
  
  if (meses.length === 0 || temasOrdenados.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemaMesChart: sem meses ou temas para renderizar');
    }
    return;
  }
  
  // Obter temas selecionados (por padrão, os 3 primeiros)
  const temasSelecionados = obterTemasSelecionados();
  
  // Criar datasets apenas para temas selecionados
  const datasets = temasSelecionados.map((tema, idx) => {
    const data = meses.map(mes => {
      const item = dataTemaMes.find(d => 
        (d.month === mes || d.ym === mes) && (d.theme === tema || d.tema === tema || d._id === tema)
      );
      return item?.count || 0;
    });
    return {
      label: tema,
      data: data
    };
  });
  
  const labels = meses.map(m => window.dateUtils?.formatMonthYearShort(m) || m);
  
  await window.chartFactory?.createBarChart('chartTemaMes', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'legendTemaMes'
  });
}

function obterTemasSelecionados() {
  // Buscar checkboxes da lista completa de temas
  const checkboxes = document.querySelectorAll('#listaTemas input[type="checkbox"][data-tema-mes]:checked');
  const selecionados = Array.from(checkboxes).map(cb => cb.getAttribute('data-tema-mes'));
  
  // Se nenhum estiver selecionado, retornar os 3 primeiros por padrão
  if (selecionados.length === 0) {
    const todosCheckboxes = document.querySelectorAll('#listaTemas input[type="checkbox"][data-tema-mes]');
    if (todosCheckboxes.length > 0) {
      // Retornar os 3 primeiros e marcá-los
      const primeiros3 = Array.from(todosCheckboxes).slice(0, 3);
      primeiros3.forEach(cb => {
        cb.checked = true;
      });
      return primeiros3.map(cb => cb.getAttribute('data-tema-mes'));
    }
  }
  
  return selecionados;
}

async function atualizarGraficoTemaMes() {
  // Recarregar dados e atualizar gráfico
  try {
    const dataTemaMes = await window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Tema', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Carregar também dados de temas para ordenação
    const dataTemasRaw = await window.dataLoader?.load('/api/aggregate/by-theme', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const dataTemas = dataTemasRaw.map(item => ({
      theme: item.theme || item.tema || 'N/A',
      tema: item.tema || item.theme || 'N/A',
      count: item.count || item.quantidade || 0,
      quantidade: item.quantidade || item.count || 0,
      _id: item.theme || item.tema || 'N/A'
    }));
    
    // Destruir gráfico existente
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts(['chartTemaMes']);
    }
    
    // Re-renderizar com temas selecionados
    await renderTemaMesChart(dataTemaMes, dataTemas);
  } catch (error) {
    window.errorHandler?.handleError(error, 'renderTemaMesChart', {
      showToUser: false
    });
    if (window.Logger) {
      window.Logger.error('Erro ao atualizar gráfico Temas por Mês:', error);
    }
  }
}

// Tornar função acessível globalmente
window.atualizarGraficoTemaMes = atualizarGraficoTemaMes;

/**
 * Atualizar KPIs da página Tema
 */
function updateTemaKPIs(dataTemas) {
  if (!dataTemas || !Array.isArray(dataTemas) || dataTemas.length === 0) {
    return;
  }
  
  const total = dataTemas.reduce((sum, item) => sum + (item.count || item.quantidade || 0), 0);
  const temasUnicos = dataTemas.length;
  const mediaTema = temasUnicos > 0 ? Math.round(total / temasUnicos) : 0;
  const temaMaisComum = dataTemas.length > 0 ? (dataTemas[0].theme || dataTemas[0].tema || dataTemas[0]._id || 'N/A') : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalTema');
  const kpiUnicos = document.getElementById('kpiTemasUnicos');
  const kpiMedia = document.getElementById('kpiMediaTema');
  const kpiMaisComum = document.getElementById('kpiTemaMaisComum');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicos) kpiUnicos.textContent = temasUnicos.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaTema.toLocaleString('pt-BR');
  if (kpiMaisComum) {
    kpiMaisComum.textContent = temaMaisComum.length > 20 ? temaMaisComum.substring(0, 20) + '...' : temaMaisComum;
    kpiMaisComum.title = temaMaisComum; // Tooltip com nome completo
  }
}

function renderTemasList(dataTemas, dataTemaMes = null) {
  const listaTemas = document.getElementById('listaTemas');
  if (!listaTemas) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemasList: elemento listaTemas não encontrado');
    }
    return;
  }
  
  if (!dataTemas || !Array.isArray(dataTemas) || dataTemas.length === 0) {
    listaTemas.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum tema encontrado</div>';
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemasList: dados inválidos ou vazios', dataTemas);
    }
    return;
  }
  
  if (window.Logger) {
    window.Logger.debug('📊 renderTemasList:', { total: dataTemas.length, sample: dataTemas[0] });
  }
  
  // Se temos dados mensais, ordenar por total mensal (para marcar os 3 primeiros)
  let temasOrdenados = dataTemas;
  if (dataTemaMes && Array.isArray(dataTemaMes) && dataTemaMes.length > 0) {
    const temasComTotal = dataTemas.map(item => {
      const tema = item.theme || item.tema || item._id || 'N/A';
      const total = dataTemaMes
        .filter(d => (d.theme === tema || d.tema === tema || d._id === tema))
        .reduce((sum, d) => sum + (d.count || 0), 0);
      return { ...item, totalMensal: total };
    }).sort((a, b) => b.totalMensal - a.totalMensal);
    temasOrdenados = temasComTotal;
  }
  
  listaTemas.innerHTML = temasOrdenados.map((item, idx) => {
    const tema = item.theme || item.tema || item._id || 'N/A';
    const count = item.count || item.quantidade || 0;
    const checked = idx < 3 ? 'checked' : ''; // Marcar os 3 primeiros por padrão
    const temaId = `tema-mes-${idx}`;
    
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <input 
            type="checkbox" 
            id="${temaId}" 
            data-tema-mes="${tema}"
            ${checked}
            class="w-4 h-4 text-violet-500 bg-slate-700 border-slate-600 rounded focus:ring-violet-500 focus:ring-2 flex-shrink-0"
            onchange="atualizarGraficoTemaMes()"
            title="Selecionar para exibir no gráfico Temas por Mês"
          >
          <span class="text-xs text-slate-400 w-8 flex-shrink-0">${idx + 1}.</span>
          <span class="text-sm text-slate-300 truncate" title="${tema}">${tema}</span>
        </div>
        <span class="text-sm font-bold text-violet-300 flex-shrink-0 ml-2">${count.toLocaleString('pt-BR')}</span>
      </div>
    `;
  }).join('');
}

