/**
 * Página: Zeladoria - Por Canal
 * 
 * Refatorada para trazer o máximo de informações possíveis
 */

async function loadZeladoriaCanal() {
  if (window.Logger) {
    window.Logger.debug('📡 loadZeladoriaCanal: Iniciando');
  }
  
  const page = document.getElementById('page-zeladoria-canal');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'zeladoria-canal-chart',
        'zeladoria-canal-mes-chart'
      ]);
    }
    
    // Carregar dados por canal
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=canal', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(data) || data.length === 0) {
      if (window.Logger) {
        window.Logger.warn('📡 loadZeladoriaCanal: Dados não são um array válido', data);
      }
      return;
    }
    
    // Ordenar por quantidade (maior primeiro)
    const sortedData = [...data].sort((a, b) => (b.count || 0) - (a.count || 0));
    const labels = sortedData.map(d => d.key || d._id || 'N/A');
    const values = sortedData.map(d => d.count || 0);
    
    // Criar gráfico principal (doughnut)
    await window.chartFactory?.createDoughnutChart('zeladoria-canal-chart', labels, values, {
      onClick: true,
      field: 'canal',
      colorIndex: 5,
      legendContainer: 'zeladoria-canal-legend'
    });
    
    // Renderizar ranking de canais
    renderCanalRanking(sortedData);
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/zeladoria/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderCanalMesChart(dataMes, sortedData);
    }
    
    // Renderizar estatísticas
    renderCanalStats(sortedData);
    
    if (window.Logger) {
      window.Logger.success('📡 loadZeladoriaCanal: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Canal Zeladoria:', error);
    }
  }
}

/**
 * Renderizar gráfico de canal por mês
 */
async function renderCanalMesChart(dataMes, canais) {
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const canalList = canais.map(c => c.key || c._id || 'N/A');
  
  const datasets = canalList.map((canal, idx) => {
    const data = meses.map(mes => {
      const item = dataMes.find(d => {
        const dMonth = d.month || d.ym;
        const dCanal = d.canal;
        return dMonth === mes && dCanal === canal;
      });
      return item?.count || 0;
    });
    return {
      label: canal,
      data: data
    };
  });
  
  const labels = meses.map(m => {
    if (window.dateUtils?.formatMonthYearShort) {
      return window.dateUtils.formatMonthYearShort(m);
    }
    return m;
  });
  
  await window.chartFactory?.createBarChart('zeladoria-canal-mes-chart', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'zeladoria-canal-mes-legend'
  });
}

/**
 * Renderizar ranking de canais
 */
function renderCanalRanking(data) {
  const rankEl = document.getElementById('zeladoria-canal-ranking');
  if (!rankEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  
  rankEl.innerHTML = data.map((item, idx) => {
    const canal = item.key || item._id || 'N/A';
    const count = item.count || 0;
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    
    // Ícones por tipo de canal
    const canalIcons = {
      'Colab': '📱',
      'Aplicativo': '📱',
      'Web': '🌐',
      'Telefone': '📞',
      'Presencial': '🏢',
      'Email': '📧'
    };
    
    const icon = canalIcons[canal] || '📡';
    
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <span class="text-xs text-slate-400 w-6">${idx + 1}.</span>
          <span class="text-lg">${icon}</span>
          <span class="text-sm text-slate-300 truncate" title="${canal}">${canal}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-sm font-bold text-indigo-300">${count.toLocaleString('pt-BR')}</div>
            <div class="text-xs text-slate-500">${percent}%</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renderizar estatísticas
 */
function renderCanalStats(data) {
  const statsEl = document.getElementById('zeladoria-canal-stats');
  if (!statsEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const topCanal = data[0];
  const topCanalPercent = topCanal && total > 0 ? ((topCanal.count / total) * 100).toFixed(1) : 0;
  const uniqueCanais = data.length;
  
  statsEl.innerHTML = `
    <div class="grid grid-cols-3 gap-4">
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Total de Ocorrências</div>
        <div class="text-2xl font-bold text-cyan-300">${total.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Canais Únicos</div>
        <div class="text-2xl font-bold text-violet-300">${uniqueCanais}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Canal Principal</div>
        <div class="text-lg font-bold text-indigo-300">${topCanal ? (topCanalPercent + '%') : '—'}</div>
        <div class="text-xs text-slate-400 mt-1">${topCanal ? (topCanal.key || topCanal._id || 'N/A') : ''}</div>
      </div>
    </div>
  `;
}

window.loadZeladoriaCanal = loadZeladoriaCanal;
