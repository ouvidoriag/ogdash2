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
    
    // Renderizar KPIs
    await renderKPIs(summary, byDay, byMonth);
    
    // Renderizar gráficos principais
    await renderMainCharts(summary, byMonth, byDay, byTheme, byOrgan);
    
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
async function renderMainCharts(summary, byMonth, byDay, byTheme, byOrgan) {
  // Gráfico de tendência mensal
  if (byMonth && byMonth.length > 0) {
    const last12Months = byMonth.slice(-12);
    const labels = last12Months.map(m => {
      const [year, month] = m.month.split('-');
      return window.dateUtils?.formatMonthYearShort(m.month) || `${month}/${year.slice(-2)}`;
    });
    const values = last12Months.map(m => m.count || 0);
    
    await window.chartFactory?.createLineChart('chartTrend', labels, values, {
      label: 'Manifestações',
      colorIndex: 0,
      fill: true,
      tension: 0.4
    });
  }
  
  // Gráfico funil por status
  if (summary.statusCounts && summary.statusCounts.length > 0) {
    const statusData = summary.statusCounts.slice(0, 5);
    const labels = statusData.map(s => s.status || s._id || 'N/A');
    const values = statusData.map(s => s.count || 0);
    
    await window.chartFactory?.createDoughnutChart('chartFunnelStatus', labels, values, {
      type: 'doughnut',
      onClick: true // Habilitar comunicação e filtros
    });
  }
  
  // Top órgãos (se disponível)
  if (byOrgan && byOrgan.length > 0) {
    const topOrgaos = byOrgan.slice(0, 10);
    const labels = topOrgaos.map(o => o.organ || o._id || 'N/A');
    const values = topOrgaos.map(o => o.count || 0);
    
    await window.chartFactory?.createBarChart('chartTopOrgaos', labels, values, {
      horizontal: true,
      colorIndex: 1,
      onClick: true // Habilitar comunicação e filtros
    });
  }
  
  // Top temas (se disponível)
  if (byTheme && byTheme.length > 0) {
    const topTemas = byTheme.slice(0, 10);
    const labels = topTemas.map(t => t.theme || t._id || 'N/A');
    const values = topTemas.map(t => t.count || 0);
    
    await window.chartFactory?.createBarChart('chartTopTemas', labels, values, {
      horizontal: true,
      colorIndex: 2,
      onClick: true // Habilitar comunicação e filtros
    });
  }
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

