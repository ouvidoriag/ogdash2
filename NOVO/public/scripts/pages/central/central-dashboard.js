/**
 * 🏙️ PAINEL CENTRAL - Dashboard Principal
 * 
 * Visão unificada dos quatro principais sistemas municipais:
 * - Zeladoria Municipal
 * - Ouvidoria Municipal
 * - E-SIC
 * - CORA (Central de Operações e Resposta Ágil)
 * 
 * CÉREBRO X-3
 */

/**
 * Carregar dashboard principal do Painel Central
 */
async function loadCentralDashboard(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('🏙️ loadCentralDashboard: Iniciando carregamento');
  }
  
  const page = document.getElementById('page-central-dashboard');
  if (!page) {
    if (window.Logger) {
      window.Logger.warn('🏙️ loadCentralDashboard: Página page-central-dashboard não encontrada');
    }
    return Promise.resolve();
  }
  
  // Garantir que a página está visível
  if (page.style.display === 'none') {
    page.style.display = 'block';
  }
  
  window.loadingManager?.show('Carregando Painel Central...');
  
  try {
    // Carregar dados consolidados
    const dashboardData = await window.dataLoader?.load('/api/central/dashboard', {
      useDataStore: !forceRefresh,
      ttl: 5 * 60 * 1000 // 5 minutos
    }) || {};
    
    if (window.Logger) {
      window.Logger.debug('🏙️ Dashboard Data recebido:', dashboardData);
    }
    
    // Renderizar KPIs
    await renderCentralKPIs(dashboardData);
    
    // Renderizar gráficos comparativos
    await renderComparativeCharts(dashboardData);
    
    // Renderizar alertas
    await renderCentralAlerts(dashboardData);
    
    // Renderizar timeline
    await renderCentralTimeline(dashboardData);
    
    // Atualizar timestamp
    const lastUpdate = document.getElementById('centralLastUpdate');
    if (lastUpdate) {
      lastUpdate.textContent = new Date().toLocaleString('pt-BR');
    }
    
    window.loadingManager?.hide();
    
    if (window.Logger) {
      window.Logger.success('🏙️ loadCentralDashboard: Carregamento concluído');
    }
  } catch (error) {
    window.errorHandler?.handleError(error, 'loadCentralDashboard', {
      showToUser: true
    });
    window.loadingManager?.hide();
    throw error;
  }
}

/**
 * Renderizar KPIs consolidados
 */
async function renderCentralKPIs(data) {
  // KPIs por sistema
  const kpiZeladoria = document.getElementById('kpiZeladoria');
  const kpiOuvidoria = document.getElementById('kpiOuvidoria');
  const kpiEsic = document.getElementById('kpiEsic');
  const kpiCora = document.getElementById('kpiCora');
  
  // KPIs consolidados
  const kpiTotalGeral = document.getElementById('kpiTotalGeral');
  const kpiEmAtendimento = document.getElementById('kpiEmAtendimento');
  const kpiTempoMedio = document.getElementById('kpiTempoMedio');
  
  if (kpiZeladoria) {
    kpiZeladoria.textContent = (data.zeladoria?.total || 0).toLocaleString('pt-BR');
  }
  
  if (kpiOuvidoria) {
    kpiOuvidoria.textContent = (data.ouvidoria?.total || 0).toLocaleString('pt-BR');
  }
  
  if (kpiEsic) {
    kpiEsic.textContent = (data.esic?.total || 0).toLocaleString('pt-BR');
  }
  
  if (kpiCora) {
    kpiCora.textContent = (data.cora?.ocorrenciasAtivas || 0).toLocaleString('pt-BR');
  }
  
  if (kpiTotalGeral) {
    const total = (data.zeladoria?.total || 0) + 
                  (data.ouvidoria?.total || 0) + 
                  (data.esic?.total || 0);
    kpiTotalGeral.textContent = total.toLocaleString('pt-BR');
  }
  
  if (kpiEmAtendimento) {
    const emAtendimento = (data.zeladoria?.emAtendimento || 0) + 
                         (data.ouvidoria?.emAtendimento || 0) + 
                         (data.esic?.emAtendimento || 0);
    kpiEmAtendimento.textContent = emAtendimento.toLocaleString('pt-BR');
  }
  
  if (kpiTempoMedio) {
    const tempoMedio = data.tempoMedioConsolidado || 0;
    kpiTempoMedio.textContent = `${tempoMedio.toFixed(1)} dias`;
  }
}

/**
 * Renderizar gráficos comparativos
 */
async function renderComparativeCharts(data) {
  // Gráfico de Volume por Sistema
  const volumeCanvas = document.getElementById('chartVolumeSistemas');
  if (volumeCanvas && window.chartFactory) {
    const labels = ['Zeladoria', 'Ouvidoria', 'E-SIC', 'CORA'];
    const values = [
      data.zeladoria?.total || 0,
      data.ouvidoria?.total || 0,
      data.esic?.total || 0,
      data.cora?.ocorrenciasAtivas || 0
    ];
    
    await window.chartFactory.createBarChart('chartVolumeSistemas', labels, values, {
      horizontal: false,
      colorIndex: 0,
      label: 'Volume de Demandas'
    });
  }
  
  // Gráfico de Evolução Temporal
  const evolucaoCanvas = document.getElementById('chartEvolucaoTemporal');
  if (evolucaoCanvas && window.chartFactory && data.evolucaoTemporal) {
    const labels = data.evolucaoTemporal.map(d => d.mes || d._id || 'N/A');
    const zeladoriaData = data.evolucaoTemporal.map(d => d.zeladoria || 0);
    const ouvidoriaData = data.evolucaoTemporal.map(d => d.ouvidoria || 0);
    const esicData = data.evolucaoTemporal.map(d => d.esic || 0);
    
    await window.chartFactory.createLineChart('chartEvolucaoTemporal', labels, [
      { label: 'Zeladoria', data: zeladoriaData, color: '#22d3ee' },
      { label: 'Ouvidoria', data: ouvidoriaData, color: '#a78bfa' },
      { label: 'E-SIC', data: esicData, color: '#34d399' }
    ], {
      label: 'Evolução Temporal'
    });
  }
}

/**
 * Renderizar alertas e indicadores críticos
 */
async function renderCentralAlerts(data) {
  const alertsContainer = document.getElementById('centralAlerts');
  if (!alertsContainer) return;
  
  const alerts = data.alerts || [];
  
  if (alerts.length === 0) {
    alertsContainer.innerHTML = `
      <div class="glass rounded-xl p-4 text-center text-slate-400">
        ✅ Nenhum alerta crítico no momento
      </div>
    `;
    return;
  }
  
  const alertsHTML = alerts.map(alert => {
    const severityColors = {
      critical: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
      high: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
      medium: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
      low: 'border-blue-500/50 bg-blue-500/10 text-blue-300'
    };
    
    const colorClass = severityColors[alert.severity] || severityColors.medium;
    const icon = alert.severity === 'critical' ? '🚨' : 
                 alert.severity === 'high' ? '⚠️' : 
                 alert.severity === 'medium' ? '⚡' : 'ℹ️';
    
    return `
      <div class="glass rounded-xl p-4 border ${colorClass}">
        <div class="flex items-start gap-3">
          <div class="text-2xl">${icon}</div>
          <div class="flex-1">
            <div class="font-semibold mb-1">${alert.title || 'Alerta'}</div>
            <div class="text-sm text-slate-300">${alert.message || ''}</div>
            <div class="text-xs text-slate-500 mt-2">Sistema: ${alert.system || 'N/A'} | ${alert.timestamp || ''}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  alertsContainer.innerHTML = alertsHTML;
}

/**
 * Renderizar timeline de eventos
 */
async function renderCentralTimeline(data) {
  const timelineContainer = document.getElementById('centralTimeline');
  if (!timelineContainer) return;
  
  const events = data.timeline || [];
  
  if (events.length === 0) {
    timelineContainer.innerHTML = `
      <div class="glass rounded-xl p-4 text-center text-slate-400">
        Nenhum evento recente
      </div>
    `;
    return;
  }
  
  const timelineHTML = events.map(event => {
    const systemIcons = {
      zeladoria: '🧹',
      ouvidoria: '📣',
      esic: '📋',
      cora: '🛰️'
    };
    
    const icon = systemIcons[event.system] || '📌';
    
    return `
      <div class="glass rounded-xl p-4 border border-slate-700/50">
        <div class="flex items-start gap-3">
          <div class="text-2xl">${icon}</div>
          <div class="flex-1">
            <div class="font-semibold mb-1">${event.title || 'Evento'}</div>
            <div class="text-sm text-slate-300">${event.description || ''}</div>
            <div class="text-xs text-slate-500 mt-2">${event.timestamp || ''} | ${event.system || 'N/A'}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  timelineContainer.innerHTML = timelineHTML;
}

// Exportar função globalmente
window.loadCentralDashboard = loadCentralDashboard;

