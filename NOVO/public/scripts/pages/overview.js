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
    // Carregar dados do dashboard (endpoint centralizado)
    const dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
      useDataStore: true,
      ttl: 5000
    }) || {};
    
    // Debug: verificar dados recebidos
    console.log('📊 Dashboard Data recebido:', {
      total: dashboardData.totalManifestations,
      byMonth: dashboardData.manifestationsByMonth?.length || 0,
      byStatus: dashboardData.manifestationsByStatus?.length || 0,
      byTheme: dashboardData.manifestationsByTheme?.length || 0,
      byOrgan: dashboardData.manifestationsByOrgan?.length || 0,
      byType: dashboardData.manifestationsByType?.length || 0,
      byChannel: dashboardData.manifestationsByChannel?.length || 0,
      byPriority: dashboardData.manifestationsByPriority?.length || 0,
      byUnit: dashboardData.manifestationsByUnit?.length || 0,
      sampleMonth: dashboardData.manifestationsByMonth?.[0],
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
    
    // Renderizar gráficos principais
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
  
  // Gráfico de tendência mensal
  if (byMonth && byMonth.length > 0) {
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
  
  // Gráfico funil por status
  if (summary.statusCounts && summary.statusCounts.length > 0) {
    const statusData = summary.statusCounts.slice(0, 5);
    const labels = statusData.map(s => s.status || s._id || 'N/A');
    const values = statusData.map(s => s.count || 0);
    
    if (window.Logger) {
      window.Logger.debug('📊 Renderizando chartFunnelStatus:', { labels: labels.length, values: values.length });
    }
    
    try {
      await window.chartFactory.createDoughnutChart('chartFunnelStatus', labels, values, {
        type: 'doughnut',
        onClick: true, // Habilitar comunicação e filtros
        legendContainer: 'legendFunnelStatus'
      });
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
  
  // Top órgãos (se disponível)
  if (byOrgan && byOrgan.length > 0) {
    const topOrgaos = byOrgan.slice(0, 10);
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
  if (byTheme && byTheme.length > 0) {
    const topTemas = byTheme.slice(0, 10);
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
  
  // Tipos de manifestação (pie chart)
  if (byType && byType.length > 0) {
    const labels = byType.map(t => t.type || 'N/A');
    const values = byType.map(t => t.count || 0);
    
    try {
      await window.chartFactory.createDoughnutChart('chartTiposManifestacao', labels, values, {
        field: 'tipoDeManifestacao',
        onClick: true,
        legendContainer: 'legendTiposManifestacao'
      });
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
  
  // Top unidades de cadastro (bar chart horizontal)
  if (byUnit && byUnit.length > 0) {
    const topUnidades = byUnit.slice(0, 10);
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

// Exportar função globalmente
window.loadOverview = loadOverview;

if (window.Logger) {
  window.Logger.debug('✅ Página Overview carregada');
}

