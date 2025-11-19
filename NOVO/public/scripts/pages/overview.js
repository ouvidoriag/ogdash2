/**
 * Página: Visão Geral (Overview)
 * Dashboard principal com visão consolidada
 * 
 * Recriada com estrutura otimizada:
 * - Usa dataLoader para carregar dados
 * - Usa dataStore para cache
 * - Usa chartFactory para gráficos
 * - Estrutura modular e limpa
 */

/**
 * Carregar dados da visão geral
 */
async function loadOverview(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('📊 loadOverview: Iniciando carregamento');
  }
  
  const pageMain = document.getElementById('page-main');
  if (!pageMain || pageMain.style.display === 'none') {
    if (window.Logger) {
      window.Logger.debug('📊 loadOverview: Página não visível, aguardando...');
    }
    return Promise.resolve();
  }
  
  try {
    // Verificar se há filtros ativos
    let activeFilters = null;
    if (window.chartCommunication) {
      const globalFilters = window.chartCommunication.filters.filters || [];
      if (globalFilters.length > 0) {
        activeFilters = globalFilters;
        if (window.Logger) {
          window.Logger.debug(`📊 loadOverview: ${activeFilters.length} filtro(s) ativo(s)`, activeFilters);
        }
      }
    }
    
    let dashboardData = {};
    
    // Se houver filtros ativos, usar endpoint /api/filter e agregar localmente
    if (activeFilters && activeFilters.length > 0) {
      try {
        const filterRequest = {
          filters: activeFilters,
          originalUrl: window.location.pathname
        };
        
        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(filterRequest)
        });
        
        if (response.ok) {
          const filteredRows = await response.json();
          
          // Agregar dados localmente
          dashboardData = aggregateFilteredData(filteredRows);
          
          if (window.Logger) {
            window.Logger.debug('📊 loadOverview: Dados agregados localmente com filtros', {
              total: dashboardData.totalManifestations,
              byStatus: dashboardData.manifestationsByStatus?.length || 0,
              byMonth: dashboardData.manifestationsByMonth?.length || 0,
              byDay: dashboardData.manifestationsByDay?.length || 0,
              byTheme: dashboardData.manifestationsByTheme?.length || 0,
              byOrgan: dashboardData.manifestationsByOrgan?.length || 0,
              sampleStatus: dashboardData.manifestationsByStatus?.[0],
              sampleMonth: dashboardData.manifestationsByMonth?.[0],
              sampleDay: dashboardData.manifestationsByDay?.[0]
            });
          }
        } else {
          throw new Error(`Erro ao buscar dados filtrados: ${response.statusText}`);
        }
      } catch (filterError) {
        if (window.Logger) {
          window.Logger.error('Erro ao aplicar filtros no overview, carregando sem filtros:', filterError);
        }
        // Em caso de erro, carregar sem filtros
        dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
          useDataStore: !forceRefresh,
          ttl: 5000
        }) || {};
      }
    } else {
      // Sem filtros, usar endpoint normal
      dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
        useDataStore: !forceRefresh,
        ttl: 5000
      }) || {};
    }
    
    // Debug: verificar dados recebidos
    console.log('📊 Dashboard Data recebido:', {
      total: dashboardData.totalManifestations,
      byMonth: dashboardData.manifestationsByMonth?.length || 0,
      byDay: dashboardData.manifestationsByDay?.length || 0,
      byStatus: dashboardData.manifestationsByStatus?.length || 0,
      byTheme: dashboardData.manifestationsByTheme?.length || 0,
      byOrgan: dashboardData.manifestationsByOrgan?.length || 0,
      byType: dashboardData.manifestationsByType?.length || 0,
      byChannel: dashboardData.manifestationsByChannel?.length || 0,
      byPriority: dashboardData.manifestationsByPriority?.length || 0,
      byUnit: dashboardData.manifestationsByUnit?.length || 0,
      sampleMonth: dashboardData.manifestationsByMonth?.[0],
      sampleDay: dashboardData.manifestationsByDay?.[0],
      sampleStatus: dashboardData.manifestationsByStatus?.[0],
      sampleTheme: dashboardData.manifestationsByTheme?.[0],
      sampleOrgan: dashboardData.manifestationsByOrgan?.[0]
    });
    
    if (window.Logger) {
      window.Logger.debug('📊 Dashboard Data recebido:', dashboardData);
    }
    
    // Extrair dados
    const summary = {
      total: dashboardData.totalManifestations || 0,
      last7: dashboardData.last7Days || 0,
      last30: dashboardData.last30Days || 0,
      statusCounts: dashboardData.manifestationsByStatus || []
    };
    
    const byMonth = dashboardData.manifestationsByMonth || [];
    const byDay = dashboardData.manifestationsByDay || [];
    const byTheme = dashboardData.manifestationsByTheme || [];
    const bySubject = dashboardData.manifestationsBySubject || [];
    const byOrgan = dashboardData.manifestationsByOrgan || [];
    const byType = dashboardData.manifestationsByType || [];
    const byChannel = dashboardData.manifestationsByChannel || [];
    const byPriority = dashboardData.manifestationsByPriority || [];
    const byUnit = dashboardData.manifestationsByUnit || [];
    
    // Renderizar KPIs
    await renderKPIs(summary, byDay, byMonth);
    
    // Renderizar gráficos principais (inclui todos os gráficos organizados por seção)
    await renderMainCharts(summary, byMonth, byDay, byTheme, byOrgan, byType, byChannel, byPriority, byUnit);
    
    // Carregar insights de IA (em background)
    loadAIInsights().catch(err => {
      if (window.Logger) {
        window.Logger.warn('Erro ao carregar insights de IA:', err);
      }
    });
    
    if (window.Logger) {
      window.Logger.success('📊 loadOverview: Carregamento concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar overview:', error);
    }
  }
}

/**
 * Renderizar KPIs principais
 */
async function renderKPIs(summary, dailyData, byMonth) {
  const kpiTotal = document.getElementById('kpiTotal');
  const kpi7 = document.getElementById('kpi7');
  const kpi30 = document.getElementById('kpi30');
  
  if (kpiTotal) {
    kpiTotal.textContent = (summary.total || 0).toLocaleString('pt-BR');
  }
  if (kpi7) {
    kpi7.textContent = (summary.last7 || 0).toLocaleString('pt-BR');
  }
  if (kpi30) {
    kpi30.textContent = (summary.last30 || 0).toLocaleString('pt-BR');
  }
  
  // Renderizar sparklines se houver dados
  if (dailyData && dailyData.length > 0 && window.chartFactory) {
    const last7Days = dailyData.slice(-7).map(d => d.count || 0);
    const last30Days = dailyData.slice(-30).map(d => d.count || 0);
    const last12Months = byMonth.slice(-12).map(m => m.count || 0);
    
    await renderSparkline('sparkTotal', last12Months);
    await renderSparkline('spark7', last7Days);
    await renderSparkline('spark30', last30Days);
  }
}

/**
 * Renderizar sparkline (gráfico pequeno)
 */
async function renderSparkline(canvasId, data) {
  if (!data || data.length === 0) return;
  
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const labels = data.map((_, i) => '');
  
  await window.chartFactory?.createLineChart(canvasId, labels, data, {
    borderWidth: 2,
    pointRadius: 0,
    fill: true,
    tension: 0.4,
    colorIndex: 0,
    chartOptions: {
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

/**
 * Renderizar gráficos principais
 * 
 * Estrutura organizada:
 * 1. Análise Temporal: Tendência Mensal + Distribuição Diária
 * 2. Status e SLA: Funil por Status + SLA
 * 3. Rankings: Top Órgãos + Top Temas + Top Unidades
 * 4. Distribuições: Tipos + Canais + Prioridades
 */
async function renderMainCharts(summary, byMonth, byDay, byTheme, byOrgan, byType, byChannel, byPriority, byUnit) {
  // Verificar se chartFactory está disponível
  if (!window.chartFactory) {
    console.error('❌ chartFactory não está disponível!');
    if (window.Logger) {
      window.Logger.error('chartFactory não está disponível');
    }
    return;
  }
  
  // Destruir gráficos existentes antes de criar novos (prevenir vazamentos de memória)
  const chartIds = [
    'chartTrend',
    'chartFunnelStatus',
    'chartDailyDistribution',
    'chartTopOrgaos',
    'chartTopTemas',
    'chartTiposManifestacao',
    'chartCanais',
    'chartPrioridades',
    'chartUnidadesCadastro'
  ];
  
  if (window.chartFactory.destroyCharts) {
    window.chartFactory.destroyCharts(chartIds);
    if (window.Logger) {
      window.Logger.debug('📊 Gráficos da Overview destruídos antes de recriar');
    }
  }
  
  // ============================================
  // SEÇÃO 2: ANÁLISE TEMPORAL
  // ============================================
  
  // Gráfico de tendência mensal
  if (byMonth && Array.isArray(byMonth) && byMonth.length > 0) {
    const last12Months = byMonth.slice(-12);
    const labels = last12Months.map(m => {
      const month = m.month || m.ym || '';
      if (month.includes('-')) {
        const [year, monthNum] = month.split('-');
        return window.dateUtils?.formatMonthYearShort(month) || `${monthNum}/${year.slice(-2)}`;
      }
      return month;
    });
    const values = last12Months.map(m => m.count || 0);
    
    // Calcular estatísticas
    const total = values.reduce((sum, v) => sum + v, 0);
    const media = values.length > 0 ? Math.round(total / values.length) : 0;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);
    
    // Detectar picos (valores que são máximos locais significativos)
    const peaks = [];
    const threshold = media * 1.15; // 15% acima da média
    
    // Detectar picos locais no meio do gráfico
    for (let i = 1; i < values.length - 1; i++) {
      const isLocalMax = values[i] > values[i - 1] && values[i] > values[i + 1];
      const isSignificant = values[i] > threshold;
      
      if (isLocalMax && isSignificant) {
        peaks.push({ index: i, value: values[i], label: labels[i] });
      }
    }
    
    // Adicionar primeiro se for pico significativo
    if (values.length > 1 && values[0] > values[1] && values[0] > threshold) {
      peaks.push({ index: 0, value: values[0], label: labels[0] });
    }
    
    // Adicionar último se for pico significativo
    if (values.length > 1 && values[values.length - 1] > values[values.length - 2] && values[values.length - 1] > threshold) {
      peaks.push({ index: values.length - 1, value: values[values.length - 1], label: labels[values.length - 1] });
    }
    
    // Ordenar picos por valor (maior primeiro) e pegar os top 3
    peaks.sort((a, b) => b.value - a.value);
    const topPeaks = peaks.slice(0, 3);
    
    // Ordenar novamente por índice para manter ordem cronológica
    topPeaks.sort((a, b) => a.index - b.index);
    
    // Renderizar informações
    const trendMediaEl = document.getElementById('trendMedia');
    const trendTotalEl = document.getElementById('trendTotal');
    const trendMaxEl = document.getElementById('trendMax');
    const trendMinEl = document.getElementById('trendMin');
    
    if (trendMediaEl) trendMediaEl.textContent = media.toLocaleString('pt-BR');
    if (trendTotalEl) trendTotalEl.textContent = total.toLocaleString('pt-BR');
    if (trendMaxEl) trendMaxEl.textContent = `${max.toLocaleString('pt-BR')} (${labels[maxIndex]})`;
    if (trendMinEl) trendMinEl.textContent = `${min.toLocaleString('pt-BR')} (${labels[minIndex]})`;
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartTrend:', { labels: labels.length, values: values.length, peaks: topPeaks.length });
    }
    
    try {
      await window.chartFactory.createLineChart('chartTrend', labels, values, {
        label: 'Manifestações',
        colorIndex: 0,
        fill: true,
        tension: 0.4,
        chartOptions: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')}`;
                }
              }
            }
          }
        }
      });
      
      // Adicionar anotações de picos após o gráfico ser renderizado
      if (topPeaks.length > 0) {
        setTimeout(() => {
          addPeakAnnotations('chartTrend', topPeaks, labels, values);
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao criar chartTrend:', error);
      if (window.Logger) {
        window.Logger.error('Erro ao criar chartTrend:', error);
      }
    }
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados mensais para chartTrend');
    }
    // Mostrar mensagem de "sem dados" no canvas
    const canvas = document.getElementById('chartTrend');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // Função auxiliar para obter cor por índice
  function getColorForIndex(idx) {
    const colors = [
      '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', 
      '#fb7185', '#60a5fa', '#f472b6', '#84cc16'
    ];
    return colors[idx % colors.length];
  }
  
  // ============================================
  // SEÇÃO 3: STATUS E SLA
  // ============================================
  
  // Gráfico funil por status (melhorado com mais informações)
  if (summary.statusCounts && summary.statusCounts.length > 0) {
    const statusData = summary.statusCounts.slice(0, 8); // Aumentar para 8 status
    const labels = statusData.map(s => s.status || s._id || 'N/A');
    const values = statusData.map(s => s.count || 0);
    const totalStatus = values.reduce((sum, v) => sum + v, 0);
    
    // Calcular percentuais e estatísticas
    const statusWithPercent = statusData.map((s, idx) => ({
      status: s.status || s._id || 'N/A',
      count: s.count || 0,
      percent: totalStatus > 0 ? ((s.count || 0) / totalStatus * 100).toFixed(1) : '0.0'
    }));
    
    // Atualizar informações no HTML
    const statusInfoEl = document.getElementById('statusInfo');
    if (statusInfoEl) {
      const topStatus = statusWithPercent[0];
      statusInfoEl.innerHTML = `
        <div class="text-xs text-slate-400 mb-1">Status mais comum</div>
        <div class="text-sm font-bold text-violet-300">${topStatus.status}</div>
        <div class="text-xs text-slate-500 mt-1">${topStatus.count.toLocaleString('pt-BR')} (${topStatus.percent}%)</div>
      `;
    }
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartFunnelStatus:', { labels: labels.length, values: values.length });
    }
    
    try {
      await window.chartFactory.createDoughnutChart('chartFunnelStatus', labels, values, {
        type: 'doughnut',
        onClick: true, // Habilitar comunicação e filtros
        legendContainer: 'legendFunnelStatus',
        chartOptions: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return `${label}: ${value.toLocaleString('pt-BR')} (${percent}%)`;
                }
              }
            }
          }
        }
      });
      
      // Adicionar informações detalhadas na legenda
      const legendContainer = document.getElementById('legendFunnelStatus');
      if (legendContainer) {
        legendContainer.innerHTML = statusWithPercent.map((s, idx) => `
          <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" style="background-color: ${getColorForIndex(idx)}"></div>
              <span class="text-sm text-slate-300">${s.status}</span>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-cyan-300">${s.count.toLocaleString('pt-BR')}</div>
              <div class="text-xs text-slate-400">${s.percent}%</div>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Erro ao criar chartFunnelStatus:', error);
      if (window.Logger) {
        window.Logger.error('Erro ao criar chartFunnelStatus:', error);
      }
    }
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados de status para chartFunnelStatus');
    }
    const canvas = document.getElementById('chartFunnelStatus');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // Distribuição diária (últimos 30 dias) - parte da Análise Temporal
  if (byDay && byDay.length > 0) {
    if (window.Logger) {
      window.Logger.debug('📅 Renderizando distribuição diária:', { total: byDay.length, sample: byDay[0] });
    }
    
    // Pegar últimos 30 dias ou todos se tiver menos
    const last30Days = byDay.slice(-30);
    
    // Formatar labels de data
    const labels = last30Days.map(d => {
      const dateStr = d.date || d._id || '';
      if (!dateStr) return '';
      
      // Tentar parsear a data
      let date;
      if (dateStr.includes('-')) {
        date = new Date(dateStr + 'T00:00:00');
      } else {
        date = new Date(dateStr);
      }
      
      if (!isNaN(date.getTime())) {
        // Usar formatDateShort se disponível, senão formatar manualmente
        if (window.dateUtils?.formatDateShort) {
          return window.dateUtils.formatDateShort(date);
        } else {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return `${day}/${month}`;
        }
      }
      
      return dateStr;
    });
    const values = last30Days.map(d => d.count || 0);
    
    // Calcular estatísticas
    const total = values.reduce((sum, v) => sum + v, 0);
    const media = values.length > 0 ? Math.round(total / values.length) : 0;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);
    
    // Atualizar informações no HTML
    const dailyInfoEl = document.getElementById('dailyInfo');
    if (dailyInfoEl) {
      dailyInfoEl.innerHTML = `
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div class="text-slate-400 mb-1">Média diária</div>
            <div class="text-cyan-300 font-bold">${media.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div class="text-slate-400 mb-1">Total (30 dias)</div>
            <div class="text-violet-300 font-bold">${total.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div class="text-slate-400 mb-1">Dia com mais</div>
            <div class="text-emerald-300 font-bold">${max.toLocaleString('pt-BR')}</div>
            <div class="text-slate-500 text-xs">${labels[maxIndex]}</div>
          </div>
          <div>
            <div class="text-slate-400 mb-1">Dia com menos</div>
            <div class="text-rose-300 font-bold">${min.toLocaleString('pt-BR')}</div>
            <div class="text-slate-500 text-xs">${labels[minIndex]}</div>
          </div>
        </div>
      `;
    }
    
    try {
      const canvas = document.getElementById('chartDailyDistribution');
      if (!canvas) {
        if (window.Logger) {
          window.Logger.warn('⚠️ Canvas chartDailyDistribution não encontrado no DOM');
        }
        console.warn('⚠️ Canvas chartDailyDistribution não encontrado');
        return;
      }
      
      // Verificar se há dados válidos
      if (labels.length === 0 || values.length === 0 || labels.length !== values.length) {
        if (window.Logger) {
          window.Logger.warn('⚠️ Sem dados válidos para distribuição diária', { 
            labelsLength: labels.length, 
            valuesLength: values.length 
          });
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
        return;
      }
      
      if (window.Logger) {
        window.Logger.debug('📅 Criando gráfico de distribuição diária:', { 
          labels: labels.length, 
          values: values.length,
          sampleLabel: labels[0],
          sampleValue: values[0],
          total: total
        });
      }
      
      console.log('📅 Criando gráfico de distribuição diária:', { 
        labels: labels.slice(0, 5), 
        values: values.slice(0, 5),
        total: total
      });
      
      await window.chartFactory.createBarChart('chartDailyDistribution', labels, values, {
        colorIndex: 0,
        chartOptions: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.parsed.y.toLocaleString('pt-BR')} manifestações`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value.toLocaleString('pt-BR');
                }
              }
            }
          }
        }
      });
      
      if (window.Logger) {
        window.Logger.success('✅ Gráfico de distribuição diária criado com sucesso');
      }
      console.log('✅ Gráfico de distribuição diária criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar chartDailyDistribution:', error);
      if (window.Logger) {
        window.Logger.error('Erro ao criar chartDailyDistribution:', error);
      }
    }
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados diários para chartDailyDistribution. byDay:', byDay);
    }
    console.warn('⚠️ Sem dados diários. byDay:', byDay);
    // Mostrar mensagem de "sem dados" no canvas
    const canvas = document.getElementById('chartDailyDistribution');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // Carregar e renderizar SLA (parte da seção Status e SLA)
  try {
    const slaData = await window.dataLoader?.load('/api/sla/summary', {
      useDataStore: true,
      ttl: 5 * 60 * 1000
    });
    
    if (slaData) {
      await renderSLAChart(slaData);
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn('Erro ao carregar dados de SLA:', error);
    }
  }
  
  // ============================================
  // SEÇÃO 4: RANKINGS E TOP PERFORMERS
  // ============================================
  
  // Top órgãos (se disponível)
  if (byOrgan && Array.isArray(byOrgan) && byOrgan.length > 0) {
    const topOrgaos = byOrgan.slice(0, 20);
    const labels = topOrgaos.map(o => o.organ || o._id || 'N/A');
    const values = topOrgaos.map(o => o.count || 0);
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartTopOrgaos:', { labels: labels.length, values: values.length });
    }
    
    try {
      await window.chartFactory.createBarChart('chartTopOrgaos', labels, values, {
        horizontal: true,
        colorIndex: 1,
        onClick: true // Habilitar comunicação e filtros
      });
    } catch (error) {
      console.error('Erro ao criar chartTopOrgaos:', error);
      if (window.Logger) {
        window.Logger.error('Erro ao criar chartTopOrgaos:', error);
      }
    }
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados de órgãos para chartTopOrgaos');
    }
    const canvas = document.getElementById('chartTopOrgaos');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // Top temas (se disponível)
  if (byTheme && Array.isArray(byTheme) && byTheme.length > 0) {
    const topTemas = byTheme.slice(0, 20);
    const labels = topTemas.map(t => t.theme || t._id || 'N/A');
    const values = topTemas.map(t => t.count || 0);
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartTopTemas:', { labels: labels.length, values: values.length });
    }
    
    try {
      await window.chartFactory.createBarChart('chartTopTemas', labels, values, {
        horizontal: true,
        colorIndex: 2,
        onClick: true // Habilitar comunicação e filtros
      });
    } catch (error) {
      console.error('Erro ao criar chartTopTemas:', error);
      if (window.Logger) {
        window.Logger.error('Erro ao criar chartTopTemas:', error);
      }
    }
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Sem dados de temas para chartTopTemas');
    }
    const canvas = document.getElementById('chartTopTemas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // ============================================
  // SEÇÃO 5: DISTRIBUIÇÕES E CATEGORIAS
  // ============================================
  
  // Tipos de manifestação (pie chart melhorado)
  if (byType && byType.length > 0) {
    const labels = byType.map(t => t.type || 'N/A');
    const values = byType.map(t => t.count || 0);
    const total = values.reduce((sum, v) => sum + v, 0);
    
    // Calcular estatísticas
    const tiposWithPercent = byType.map((t, idx) => ({
      type: t.type || 'N/A',
      count: t.count || 0,
      percent: total > 0 ? ((t.count || 0) / total * 100).toFixed(1) : '0.0'
    }));
    
    // Atualizar informações no HTML
    const tiposInfoEl = document.getElementById('tiposInfo');
    if (tiposInfoEl) {
      const topTipo = tiposWithPercent[0];
      tiposInfoEl.innerHTML = `
        <div class="text-xs text-slate-400 mb-1">Tipo mais comum</div>
        <div class="text-sm font-bold text-pink-300">${topTipo.type}</div>
        <div class="text-xs text-slate-500 mt-1">${topTipo.count.toLocaleString('pt-BR')} (${topTipo.percent}%)</div>
        <div class="text-xs text-slate-400 mt-2">Total de tipos: ${tiposWithPercent.length}</div>
      `;
    }
    
    try {
      await window.chartFactory.createDoughnutChart('chartTiposManifestacao', labels, values, {
        field: 'tipoDeManifestacao',
        onClick: true,
        legendContainer: 'legendTiposManifestacao',
        chartOptions: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return `${label}: ${value.toLocaleString('pt-BR')} (${percent}%)`;
                }
              }
            }
          }
        }
      });
      
      // Adicionar informações detalhadas na legenda
      const legendContainer = document.getElementById('legendTiposManifestacao');
      if (legendContainer) {
        legendContainer.innerHTML = tiposWithPercent.map((t, idx) => `
          <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" style="background-color: ${getColorForIndex(idx)}"></div>
              <span class="text-sm text-slate-300">${t.type}</span>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-pink-300">${t.count.toLocaleString('pt-BR')}</div>
              <div class="text-xs text-slate-400">${t.percent}%</div>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Erro ao criar chartTiposManifestacao:', error);
    }
  }
  
  // Canais de atendimento (doughnut chart)
  if (byChannel && byChannel.length > 0) {
    const topCanais = byChannel.slice(0, 8); // Top 8 canais
    const labels = topCanais.map(c => c.channel || 'N/A');
    const values = topCanais.map(c => c.count || 0);
    
    try {
      await window.chartFactory.createDoughnutChart('chartCanais', labels, values, {
        onClick: true,
        legendContainer: 'legendCanais'
      });
    } catch (error) {
      console.error('Erro ao criar chartCanais:', error);
    }
  }
  
  // Prioridades (doughnut chart)
  if (byPriority && byPriority.length > 0) {
    const labels = byPriority.map(p => p.priority || 'N/A');
    const values = byPriority.map(p => p.count || 0);
    
    try {
      await window.chartFactory.createDoughnutChart('chartPrioridades', labels, values, {
        onClick: true,
        legendContainer: 'legendPrioridades'
      });
    } catch (error) {
      console.error('Erro ao criar chartPrioridades:', error);
    }
  }
  
  // Top unidades de cadastro (movido para seção de Rankings)
  if (byUnit && Array.isArray(byUnit) && byUnit.length > 0) {
    const topUnidades = byUnit.slice(0, 20);
    const labels = topUnidades.map(u => u.unit || 'N/A');
    const values = topUnidades.map(u => u.count || 0);
    
    try {
      await window.chartFactory.createBarChart('chartUnidadesCadastro', labels, values, {
        horizontal: true,
        colorIndex: 3,
        onClick: true
      });
    } catch (error) {
      console.error('Erro ao criar chartUnidadesCadastro:', error);
    }
  }
  
  if (window.Logger) {
    window.Logger.success('📊 Todos os gráficos renderizados');
  }
}

/**
 * Esta função não é mais necessária - os gráficos foram movidos para renderMainCharts
 * Mantida apenas para compatibilidade, mas não é chamada
 */

/**
 * Renderizar gráfico de SLA
 */
async function renderSLAChart(slaData) {
  const labels = ['Concluídos', 'Verde (0-30d)', 'Amarelo (31-60d)', 'Vermelho (61+d)'];
  const values = [
    slaData.concluidos || 0,
    slaData.verdeClaro || 0,
    slaData.amarelo || 0,
    slaData.vermelho || 0
  ];
  
  const total = values.reduce((sum, v) => sum + v, 0);
  
  if (total === 0) return;
  
  // Calcular percentuais
  const slaWithPercent = values.map((v, idx) => ({
    label: labels[idx],
    value: v,
    percent: total > 0 ? ((v / total) * 100).toFixed(1) : '0.0'
  }));
  
  // Atualizar informações no HTML
  const slaInfoEl = document.getElementById('slaInfo');
  if (slaInfoEl) {
    const concluidosPercent = slaWithPercent[0].percent;
    const emAndamento = total - (slaData.concluidos || 0);
    slaInfoEl.innerHTML = `
      <div class="space-y-3">
        <div>
          <div class="text-xs text-slate-400 mb-1">Taxa de conclusão</div>
          <div class="text-2xl font-bold text-emerald-300">${concluidosPercent}%</div>
          <div class="text-xs text-slate-500 mt-1">${(slaData.concluidos || 0).toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-slate-400 mb-1">Em andamento</div>
            <div class="text-cyan-300 font-bold">${emAndamento.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div class="text-slate-400 mb-1">Atrasados</div>
            <div class="text-red-300 font-bold">${(slaData.vermelho || 0).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  try {
    const canvas = document.getElementById('chartSLA');
    if (canvas) {
      await window.chartFactory.createDoughnutChart('chartSLA', labels, values, {
        chartOptions: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return `${label}: ${value.toLocaleString('pt-BR')} (${percent}%)`;
                }
              }
            }
          }
        }
      });
      
      // Adicionar informações detalhadas na legenda
      const legendContainer = document.getElementById('legendSLA');
      if (legendContainer) {
        const colors = ['#34d399', '#22d3ee', '#fbbf24', '#fb7185'];
        legendContainer.innerHTML = slaWithPercent.map((s, idx) => `
          <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" style="background-color: ${colors[idx]}"></div>
              <span class="text-sm text-slate-300">${s.label}</span>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold" style="color: ${colors[idx]}">${s.value.toLocaleString('pt-BR')}</div>
              <div class="text-xs text-slate-400">${s.percent}%</div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao criar chartSLA:', error);
    }
  }
}

/**
 * Adicionar anotações de picos no gráfico
 */
function addPeakAnnotations(chartId, peaks, labels, values) {
  const chart = window[chartId];
  if (!chart || !(chart instanceof Chart)) return;
  
  const canvas = chart.canvas;
  const canvasContainer = canvas.parentElement;
  if (!canvasContainer) return;
  
  // Limpar anotações anteriores
  const existingAnnotations = canvasContainer.querySelectorAll('.peak-annotation');
  existingAnnotations.forEach(el => el.remove());
  
  // Garantir que o container tenha position relative
  if (getComputedStyle(canvasContainer).position === 'static') {
    canvasContainer.style.position = 'relative';
  }
  
  // Função para atualizar posições das anotações
  const updateAnnotations = () => {
    if (!chart || !chart.chartArea) return;
    
    peaks.forEach((peak, idx) => {
      const annotation = canvasContainer.querySelectorAll('.peak-annotation')[idx];
      if (!annotation) return;
      
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data || !meta.data[peak.index]) return;
      
      const point = meta.data[peak.index];
      if (!point) return;
      
      // Posição do ponto no canvas (coordenadas do Chart.js são relativas ao canvas)
      // Chart.js já calcula as posições relativas ao canvas
      const x = point.x;
      const y = point.y - 40; // Posicionar acima do ponto
      
      annotation.style.left = `${x}px`;
      annotation.style.top = `${y}px`;
      annotation.style.opacity = '1'; // Mostrar após posicionar
    });
  };
  
  // Criar anotações (serão posicionadas pela função updateAnnotations)
  peaks.forEach(peak => {
    // Criar elemento de anotação
    const annotation = document.createElement('div');
    annotation.className = 'peak-annotation absolute pointer-events-none';
    annotation.style.cssText = `
      transform: translate(-50%, -100%);
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.95), rgba(34, 211, 238, 0.85));
      border: 2px solid #22d3ee;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: bold;
      color: #0b1020;
      text-align: center;
      box-shadow: 0 4px 16px rgba(34, 211, 238, 0.4), 0 0 0 1px rgba(34, 211, 238, 0.2);
      z-index: 100;
      white-space: nowrap;
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    annotation.innerHTML = `
      <div style="font-size: 10px; opacity: 0.85; margin-bottom: 2px;">${peak.label}</div>
      <div style="font-size: 14px; font-weight: 700; line-height: 1.2;">${peak.value.toLocaleString('pt-BR')}</div>
    `;
    
    canvasContainer.appendChild(annotation);
  });
  
  // Atualizar posições após renderização completa
  setTimeout(updateAnnotations, 300);
  
  // Observar redimensionamento
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      setTimeout(updateAnnotations, 100);
    });
    observer.observe(canvas);
  }
  
  // Atualizar quando o gráfico for atualizado
  const originalUpdate = chart.update.bind(chart);
  chart.update = function(...args) {
    const result = originalUpdate(...args);
    setTimeout(updateAnnotations, 100);
    return result;
  };
}

/**
 * Carregar insights de IA
 */
async function loadAIInsights() {
  try {
    const insights = await window.dataLoader?.load('/api/ai/insights', {
      useDataStore: true,
      ttl: 5 * 60 * 1000 // 5 minutos
    }) || {};
    
    const insightsBox = document.getElementById('insightsAIBox');
    if (insightsBox && insights.insights) {
      insightsBox.innerHTML = insights.insights.map(insight => `
        <div class="bg-slate-800/60 rounded-lg p-4 border border-emerald-500/20">
          <div class="text-sm text-emerald-300 font-semibold mb-2">💡 ${insight.title || 'Insight'}</div>
          <div class="text-xs text-slate-300">${insight.description || insight}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.debug('Erro ao carregar insights de IA:', error);
    }
  }
}

/**
 * Agregar dados filtrados localmente
 * Converte array de registros filtrados em formato de dashboard-data
 */
function aggregateFilteredData(rows) {
  if (window.Logger) {
    window.Logger.debug('📊 aggregateFilteredData: Iniciando agregação', {
      totalRows: rows?.length || 0,
      sampleRow: rows?.[0]
    });
  }
  
  if (!rows || rows.length === 0) {
    if (window.Logger) {
      window.Logger.warn('📊 aggregateFilteredData: Nenhum registro para agregar');
    }
    return {
      totalManifestations: 0,
      last7Days: 0,
      last30Days: 0,
      manifestationsByMonth: [],
      manifestationsByDay: [],
      manifestationsByStatus: [],
      manifestationsByTheme: [],
      manifestationsByOrgan: [],
      manifestationsByType: [],
      manifestationsByChannel: [],
      manifestationsByPriority: [],
      manifestationsByUnit: []
    };
  }
  
  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(now.getDate() - 7);
  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 30);
  
  // Agregações
  const statusMap = new Map();
  const themeMap = new Map();
  const organMap = new Map();
  const typeMap = new Map();
  const channelMap = new Map();
  const priorityMap = new Map();
  const unitMap = new Map();
  const monthMap = new Map();
  const dayMap = new Map();
  
  let last7Count = 0;
  let last30Count = 0;
  
  for (const row of rows) {
    // Extrair dados - pode estar em row.data ou diretamente em row
    // Também verificar campos normalizados do banco
    const data = row.data || row;
    
    // Status - verificar múltiplos campos possíveis
    const status = data.status || 
                   data.status_demanda || 
                   row.status || 
                   row.status_demanda || 
                   'N/A';
    if (status && status !== 'N/A') {
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }
    
    // Tema
    const theme = data.tema || row.tema || 'N/A';
    if (theme && theme !== 'N/A') {
      themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
    }
    
    // Órgãos
    const organ = data.orgaos || 
                  data.orgao || 
                  row.orgaos || 
                  row.orgao || 
                  'N/A';
    if (organ && organ !== 'N/A') {
      organMap.set(organ, (organMap.get(organ) || 0) + 1);
    }
    
    // Tipo
    const type = data.tipo || 
                 data.tipo_de_manifestacao || 
                 row.tipo || 
                 row.tipo_de_manifestacao || 
                 'N/A';
    if (type && type !== 'N/A') {
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    }
    
    // Canal
    const channel = data.canal || row.canal || 'N/A';
    if (channel && channel !== 'N/A') {
      channelMap.set(channel, (channelMap.get(channel) || 0) + 1);
    }
    
    // Prioridade
    const priority = data.prioridade || row.prioridade || 'N/A';
    if (priority && priority !== 'N/A') {
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    }
    
    // Unidade
    const unit = data.unidade_cadastro || 
                 data.unidadeCadastro || 
                 row.unidade_cadastro || 
                 row.unidadeCadastro || 
                 'N/A';
    if (unit && unit !== 'N/A') {
      unitMap.set(unit, (unitMap.get(unit) || 0) + 1);
    }
    
    // Data - verificar múltiplos campos possíveis
    let dataCriacao = data.data_da_criacao || 
                      data.dataDaCriacao || 
                      data.dataCriacaoIso ||
                      row.data_da_criacao || 
                      row.dataDaCriacao || 
                      row.dataCriacaoIso;
    
    // Se não encontrou, tentar usar getDataCriacao do sistema global
    if (!dataCriacao && window.getDataCriacao) {
      dataCriacao = window.getDataCriacao(row);
    }
    
    if (dataCriacao) {
      // Normalizar formato de data
      let dateStr = dataCriacao;
      if (typeof dataCriacao === 'string' && !dataCriacao.includes('T')) {
        dateStr = dataCriacao + 'T00:00:00';
      }
      
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Por mês
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        
        // Por dia (usar formato YYYY-MM-DD)
        const dayKey = date.toISOString().slice(0, 10);
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
        
        // Últimos 7 e 30 dias
        if (date >= last7Days) last7Count++;
        if (date >= last30Days) last30Count++;
      }
    }
  }
  
  // Converter maps em arrays
  const manifestationsByStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({ 
      status, 
      count,
      _id: status // Adicionar alias '_id' para compatibilidade
    }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByTheme = Array.from(themeMap.entries())
    .map(([theme, count]) => ({ 
      theme, 
      count,
      _id: theme // Adicionar alias '_id' para compatibilidade
    }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByOrgan = Array.from(organMap.entries())
    .map(([organ, count]) => ({ 
      organ, 
      count,
      _id: organ // Adicionar alias '_id' para compatibilidade
    }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByChannel = Array.from(channelMap.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByPriority = Array.from(priorityMap.entries())
    .map(([priority, count]) => ({ priority, count }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByUnit = Array.from(unitMap.entries())
    .map(([unit, count]) => ({ unit, count }))
    .sort((a, b) => b.count - a.count);
  
  const manifestationsByMonth = Array.from(monthMap.entries())
    .map(([month, count]) => ({ 
      month, 
      count,
      ym: month, // Adicionar alias 'ym' para compatibilidade
      _id: month // Adicionar alias '_id' para compatibilidade
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  const manifestationsByDay = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Garantir apenas últimos 30 dias
  
  const result = {
    totalManifestations: rows.length,
    last7Days: last7Count,
    last30Days: last30Count,
    manifestationsByMonth,
    manifestationsByDay,
    manifestationsByStatus,
    manifestationsByTheme,
    manifestationsByOrgan,
    manifestationsByType,
    manifestationsByChannel,
    manifestationsByPriority,
    manifestationsByUnit
  };
  
  if (window.Logger) {
    window.Logger.debug('📊 aggregateFilteredData: Agregação concluída', {
      total: result.totalManifestations,
      byStatus: result.manifestationsByStatus.length,
      byMonth: result.manifestationsByMonth.length,
      byDay: result.manifestationsByDay.length,
      byTheme: result.manifestationsByTheme.length,
      byOrgan: result.manifestationsByOrgan.length,
      sampleStatus: result.manifestationsByStatus[0],
      sampleMonth: result.manifestationsByMonth[0],
      sampleDay: result.manifestationsByDay[0]
    });
  }
  
  return result;
}

/**
 * Inicializar listeners de eventos de filtro
 * Escuta eventos do sistema de comunicação de gráficos para recarregar dados
 */
function initOverviewFilterListeners() {
  if (!window.chartCommunication) {
    if (window.Logger) {
      window.Logger.warn('Sistema de comunicação de gráficos não disponível. Overview não será atualizado automaticamente.');
    }
    return;
  }
  
  // Escutar evento de filtro aplicado
  window.chartCommunication.on('filter:applied', (data) => {
    if (window.Logger) {
      window.Logger.debug('Filtro aplicado, recarregando overview...', data);
    }
    
    // Verificar se a página está visível
    const pageMain = document.getElementById('page-main');
    if (pageMain && pageMain.style.display !== 'none') {
      // Invalidar cache do dataStore para forçar recarregamento
      if (window.dataStore) {
        window.dataStore.invalidate([
          'dashboardData',
          '/api/dashboard-data',
          '/api/summary'
        ]);
      }
      
      // Recarregar overview com refresh forçado
      // Usar debounce maior para evitar múltiplas atualizações simultâneas
      clearTimeout(window.overviewUpdateTimeout);
      window.overviewUpdateTimeout = setTimeout(() => {
        loadOverview(true); // forceRefresh = true
      }, 500); // Aumentado de 300ms para 500ms para dar mais tempo entre eventos
    }
  });
  
  // Escutar evento de filtro removido
  window.chartCommunication.on('filter:removed', (data) => {
    if (window.Logger) {
      window.Logger.debug('Filtro removido, recarregando overview...', data);
    }
    
    const pageMain = document.getElementById('page-main');
    if (pageMain && pageMain.style.display !== 'none') {
      if (window.dataStore) {
        window.dataStore.invalidate([
          'dashboardData',
          '/api/dashboard-data',
          '/api/summary'
        ]);
      }
      
      clearTimeout(window.overviewUpdateTimeout);
      window.overviewUpdateTimeout = setTimeout(() => {
        loadOverview(true);
      }, 300);
    }
  });
  
  // Escutar evento de filtros limpos
  window.chartCommunication.on('filter:cleared', () => {
    if (window.Logger) {
      window.Logger.debug('Filtros limpos, recarregando overview...');
    }
    
    const pageMain = document.getElementById('page-main');
    if (pageMain && pageMain.style.display !== 'none') {
      if (window.dataStore) {
        window.dataStore.invalidate([
          'dashboardData',
          '/api/dashboard-data',
          '/api/summary'
        ]);
      }
      
      clearTimeout(window.overviewUpdateTimeout);
      window.overviewUpdateTimeout = setTimeout(() => {
        loadOverview(true);
      }, 300);
    }
  });
  
  if (window.Logger) {
    window.Logger.success('✅ Listeners de filtro para overview inicializados');
  }
}

// Exportar função globalmente
window.loadOverview = loadOverview;
window.initOverviewFilterListeners = initOverviewFilterListeners;

// Inicializar listeners quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que chartCommunication está disponível
    setTimeout(() => {
      initOverviewFilterListeners();
    }, 500);
  });
} else {
  // DOM já está pronto
  setTimeout(() => {
    initOverviewFilterListeners();
  }, 500);
}

if (window.Logger) {
  window.Logger.debug('✅ Página Overview carregada');
}

