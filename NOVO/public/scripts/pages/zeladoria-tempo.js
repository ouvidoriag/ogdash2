/**
 * Página: Zeladoria - Tempo de Resolução
 * 
 * Refatorada para trazer o máximo de informações possíveis
 */

async function loadZeladoriaTempo() {
  if (window.Logger) {
    window.Logger.debug('⏱️ loadZeladoriaTempo: Iniciando');
  }
  
  const page = document.getElementById('page-zeladoria-tempo');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'zeladoria-tempo-chart',
        'zeladoria-tempo-mes-chart',
        'zeladoria-tempo-distribuicao-chart'
      ]);
    }
    
    // Carregar estatísticas
    const stats = await window.dataLoader?.load('/api/zeladoria/stats', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || {};
    
    // Carregar série temporal
    const timeSeries = await window.dataLoader?.load('/api/zeladoria/time-series', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Renderizar KPIs de tempo
    renderTempoKPIs(stats);
    
    // Renderizar gráfico de tempo médio por mês
    if (timeSeries.length > 0) {
      await renderTempoMesChart(timeSeries);
    }
    
    // Renderizar distribuição de tempo
    await renderTempoDistribuicao(stats);
    
    // Renderizar análises detalhadas
    renderTempoAnalises(stats, timeSeries);
    
    if (window.Logger) {
      window.Logger.success('⏱️ loadZeladoriaTempo: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Tempo Zeladoria:', error);
    }
  }
}

/**
 * Renderizar KPIs de tempo
 */
function renderTempoKPIs(stats) {
  const kpiEl = document.getElementById('zeladoria-tempo-kpis');
  if (!kpiEl) return;
  
  const tempoMedio = stats.tempoMedioResolucao || 0;
  const fechados = stats.fechados || 0;
  const abertos = stats.abertos || 0;
  const emAtendimento = stats.emAtendimento || 0;
  
  // Calcular eficiência (quanto menor o tempo, melhor)
  const eficiencia = tempoMedio > 0 ? Math.max(0, 100 - (tempoMedio * 2)).toFixed(0) : 0;
  
  kpiEl.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Tempo Médio</div>
        <div class="text-2xl font-bold ${tempoMedio <= 7 ? 'text-emerald-300' : tempoMedio <= 15 ? 'text-amber-300' : 'text-rose-300'}">
          ${tempoMedio.toFixed(1)} dias
        </div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Fechados</div>
        <div class="text-2xl font-bold text-emerald-300">${fechados.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Em Aberto</div>
        <div class="text-2xl font-bold text-amber-300">${abertos.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Eficiência</div>
        <div class="text-2xl font-bold text-cyan-300">${eficiencia}%</div>
      </div>
    </div>
  `;
}

/**
 * Renderizar gráfico de tempo médio por mês
 */
async function renderTempoMesChart(timeSeries) {
  const meses = [...new Set(timeSeries.map(d => d.month || d.ym || d.date))].sort();
  const tempoMedio = meses.map(mes => {
    const item = timeSeries.find(d => (d.month || d.ym || d.date) === mes);
    return item?.tempoMedio || item?.avgTime || 0;
  });
  
  const labels = meses.map(m => {
    if (window.dateUtils?.formatMonthYearShort) {
      return window.dateUtils.formatMonthYearShort(m);
    }
    return m;
  });
  
  await window.chartFactory?.createLineChart('zeladoria-tempo-mes-chart', labels, tempoMedio, {
    colorIndex: 6,
    label: 'Tempo Médio (dias)',
    legendContainer: 'zeladoria-tempo-mes-legend'
  });
}

/**
 * Renderizar distribuição de tempo
 */
async function renderTempoDistribuicao(stats) {
  // Criar buckets de tempo
  const buckets = {
    '0-7 dias': stats.tempo0a7 || 0,
    '8-15 dias': stats.tempo8a15 || 0,
    '16-30 dias': stats.tempo16a30 || 0,
    '31-60 dias': stats.tempo31a60 || 0,
    '60+ dias': stats.tempoMais60 || 0
  };
  
  const labels = Object.keys(buckets);
  const values = Object.values(buckets);
  
  await window.chartFactory?.createBarChart('zeladoria-tempo-distribuicao-chart', labels, values, {
    colorIndex: 6,
    horizontal: true,
    legendContainer: 'zeladoria-tempo-distribuicao-legend'
  });
}

/**
 * Renderizar análises detalhadas
 */
function renderTempoAnalises(stats, timeSeries) {
  const analisesEl = document.getElementById('zeladoria-tempo-analises');
  if (!analisesEl) return;
  
  const tempoMedio = stats.tempoMedioResolucao || 0;
  const fechados = stats.fechados || 0;
  
  // Calcular tendência (se houver dados mensais)
  let tendencia = '—';
  if (timeSeries.length >= 2) {
    const ultimos = timeSeries.slice(-3).map(d => d.tempoMedio || d.avgTime || 0);
    const primeiro = ultimos[0];
    const ultimo = ultimos[ultimos.length - 1];
    const diff = ultimo - primeiro;
    if (diff < -1) {
      tendencia = `↓ Melhorando (${Math.abs(diff).toFixed(1)} dias a menos)`;
    } else if (diff > 1) {
      tendencia = `↑ Piorando (${diff.toFixed(1)} dias a mais)`;
    } else {
      tendencia = '→ Estável';
    }
  }
  
  // Classificação de performance
  let performance = 'Excelente';
  let performanceColor = 'text-emerald-300';
  if (tempoMedio > 30) {
    performance = 'Crítico';
    performanceColor = 'text-rose-300';
  } else if (tempoMedio > 15) {
    performance = 'Atenção';
    performanceColor = 'text-amber-300';
  } else if (tempoMedio > 7) {
    performance = 'Bom';
    performanceColor = 'text-cyan-300';
  }
  
  analisesEl.innerHTML = `
    <div class="space-y-4">
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-2">Performance</div>
        <div class="text-lg font-bold ${performanceColor}">${performance}</div>
        <div class="text-sm text-slate-400 mt-1">Baseado no tempo médio de ${tempoMedio.toFixed(1)} dias</div>
      </div>
      
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-2">Tendência</div>
        <div class="text-lg font-bold text-violet-300">${tendencia}</div>
        <div class="text-sm text-slate-400 mt-1">Últimos 3 meses</div>
      </div>
      
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-2">Estatísticas</div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-400">Ocorrências analisadas:</span>
            <span class="text-slate-300 font-bold">${fechados.toLocaleString('pt-BR')}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Meta (7 dias):</span>
            <span class="${tempoMedio <= 7 ? 'text-emerald-300' : 'text-rose-300'} font-bold">
              ${tempoMedio <= 7 ? '✓ Atingida' : '✗ Não atingida'}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.loadZeladoriaTempo = loadZeladoriaTempo;
