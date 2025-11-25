/**
 * Página: Zeladoria - Por Bairro
 * 
 * Refatorada para trazer o máximo de informações possíveis
 */

async function loadZeladoriaBairro() {
  if (window.Logger) {
    window.Logger.debug('📍 loadZeladoriaBairro: Iniciando');
  }
  
  const page = document.getElementById('page-zeladoria-bairro');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'zeladoria-bairro-chart',
        'zeladoria-bairro-mes-chart'
      ]);
    }
    
    // Carregar dados por bairro
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=bairro', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(data) || data.length === 0) {
      if (window.Logger) {
        window.Logger.warn('📍 loadZeladoriaBairro: Dados não são um array válido', data);
      }
      return;
    }
    
    // Ordenar por quantidade (maior primeiro) e pegar top 20
    const sortedData = [...data].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 20);
    const labels = sortedData.map(d => d.key || d._id || 'N/A');
    const values = sortedData.map(d => d.count || 0);
    
    // Criar gráfico principal (barra horizontal)
    await window.chartFactory?.createBarChart('zeladoria-bairro-chart', labels, values, {
      horizontal: true,
      colorIndex: 3,
      field: 'bairro',
      onClick: true,
      legendContainer: 'zeladoria-bairro-legend'
    });
    
    // Renderizar ranking de bairros
    renderBairroRanking(sortedData);
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/zeladoria/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderBairroMesChart(dataMes, sortedData.slice(0, 10));
    }
    
    // Carregar dados geográficos
    const geoData = await window.dataLoader?.load('/api/zeladoria/geographic', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (geoData.length > 0) {
      renderBairroGeoInfo(geoData, sortedData);
    }
    
    // Renderizar estatísticas
    renderBairroStats(sortedData, data);
    
    if (window.Logger) {
      window.Logger.success('📍 loadZeladoriaBairro: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Bairro Zeladoria:', error);
    }
  }
}

/**
 * Renderizar gráfico de bairro por mês
 */
async function renderBairroMesChart(dataMes, topBairros) {
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const bairros = topBairros.map(b => b.key || b._id || 'N/A');
  
  const datasets = bairros.map((bairro, idx) => {
    const data = meses.map(mes => {
      const item = dataMes.find(d => {
        const dMonth = d.month || d.ym;
        const dBairro = d.bairro;
        return dMonth === mes && dBairro === bairro;
      });
      return item?.count || 0;
    });
    return {
      label: bairro,
      data: data
    };
  });
  
  const labels = meses.map(m => {
    if (window.dateUtils?.formatMonthYearShort) {
      return window.dateUtils.formatMonthYearShort(m);
    }
    return m;
  });
  
  await window.chartFactory?.createBarChart('zeladoria-bairro-mes-chart', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'zeladoria-bairro-mes-legend'
  });
}

/**
 * Renderizar ranking de bairros
 */
function renderBairroRanking(data) {
  const rankEl = document.getElementById('zeladoria-bairro-ranking');
  if (!rankEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  
  rankEl.innerHTML = data.map((item, idx) => {
    const bairro = item.key || item._id || 'N/A';
    const count = item.count || 0;
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <span class="text-xs text-slate-400 w-6">${idx + 1}.</span>
          <span class="text-lg">📍</span>
          <span class="text-sm text-slate-300 truncate" title="${bairro}">${bairro}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-sm font-bold text-emerald-300">${count.toLocaleString('pt-BR')}</div>
            <div class="text-xs text-slate-500">${percent}%</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renderizar informações geográficas
 */
function renderBairroGeoInfo(geoData, rankingData) {
  const geoEl = document.getElementById('zeladoria-bairro-geo');
  if (!geoEl) return;
  
  // Combinar dados geográficos com ranking
  const bairrosComGeo = rankingData.slice(0, 10).map(item => {
    const bairro = item.key || item._id || 'N/A';
    const geo = geoData.find(g => (g.bairro || g._id?.bairro) === bairro);
    return {
      bairro,
      count: item.count || 0,
      lat: geo?.latitude || geo?._id?.latitude,
      lng: geo?.longitude || geo?._id?.longitude
    };
  }).filter(b => b.lat && b.lng);
  
  if (bairrosComGeo.length === 0) {
    geoEl.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado geográfico disponível</div>';
    return;
  }
  
  geoEl.innerHTML = `
    <div class="text-xs text-slate-400 mb-2">Top ${bairrosComGeo.length} bairros com coordenadas</div>
    <div class="space-y-2">
      ${bairrosComGeo.map((item, idx) => `
        <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/30">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">${idx + 1}.</span>
            <span class="text-sm text-slate-300">${item.bairro}</span>
          </div>
          <div class="text-xs text-slate-400">
            ${item.lat?.toFixed(4)}, ${item.lng?.toFixed(4)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Renderizar estatísticas
 */
function renderBairroStats(topData, allData) {
  const statsEl = document.getElementById('zeladoria-bairro-stats');
  if (!statsEl) return;
  
  const total = allData.reduce((sum, item) => sum + (item.count || 0), 0);
  const top10 = topData.slice(0, 10).reduce((sum, item) => sum + (item.count || 0), 0);
  const top10Percent = total > 0 ? ((top10 / total) * 100).toFixed(1) : 0;
  const uniqueBairros = allData.length;
  const avgPerBairro = uniqueBairros > 0 ? (total / uniqueBairros).toFixed(0) : 0;
  
  statsEl.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Total de Ocorrências</div>
        <div class="text-2xl font-bold text-cyan-300">${total.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Bairros Únicos</div>
        <div class="text-2xl font-bold text-violet-300">${uniqueBairros}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Top 10 Concentração</div>
        <div class="text-2xl font-bold text-emerald-300">${top10Percent}%</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Média por Bairro</div>
        <div class="text-2xl font-bold text-amber-300">${avgPerBairro}</div>
      </div>
    </div>
  `;
}

window.loadZeladoriaBairro = loadZeladoriaBairro;
