/**
 * Página: Tempo Médio
 * Análise do tempo médio de atendimento em dias
 * 
 * Recriada com estrutura otimizada
 */

async function loadTempoMedio(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('⏱️ loadTempoMedio: Iniciando');
  }
  
  const page = document.getElementById('page-tempo-medio');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Carregar estatísticas principais
    const stats = await window.dataLoader?.load('/api/stats/average-time/stats', {
      useDataStore: true,
      ttl: 5 * 60 * 1000
    }) || {};
    
    // Carregar dados por mês
    const dataMes = await window.dataLoader?.load('/api/stats/average-time/by-month', {
      useDataStore: true,
      ttl: 5 * 60 * 1000
    }) || [];
    
    // Renderizar estatísticas
    renderTempoMedioStats(stats);
    
    // Renderizar gráficos principais
    await renderTempoMedioCharts(stats, dataMes);
    
    // Carregar dados secundários em background
    loadSecondaryTempoMedioData().catch(err => {
      if (window.Logger) {
        window.Logger.debug('Erro ao carregar dados secundários:', err);
      }
    });
    
    if (window.Logger) {
      window.Logger.success('⏱️ loadTempoMedio: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar TempoMedio:', error);
    }
  }
}

function renderTempoMedioStats(stats) {
  const statMedia = document.getElementById('statMedia');
  const statMediana = document.getElementById('statMediana');
  const statMinimo = document.getElementById('statMinimo');
  const statMaximo = document.getElementById('statMaximo');
  
  if (statMedia) {
    statMedia.textContent = (stats.media || stats.average || 0).toFixed(1);
  }
  if (statMediana) {
    statMediana.textContent = (stats.mediana || stats.median || 0).toFixed(1);
  }
  if (statMinimo) {
    statMinimo.textContent = (stats.minimo || stats.min || 0).toFixed(1);
  }
  if (statMaximo) {
    statMaximo.textContent = (stats.maximo || stats.max || 0).toFixed(1);
  }
}

async function renderTempoMedioCharts(stats, dataMes) {
  // Carregar dados por órgão/unidade
  const dataOrgao = await window.dataLoader?.load('/api/stats/average-time/by-unit', {
      useDataStore: true,
      ttl: 5 * 60 * 1000
    }) || [];
  
  // Gráfico principal: Tempo médio por órgão/unidade
  if (dataOrgao.length > 0) {
    const top10 = dataOrgao.slice(0, 10);
    const labels = top10.map(o => o.unit || o._id || 'N/A');
    const values = top10.map(o => o.average || o.media || 0);
    
    await window.chartFactory?.createBarChart('chartTempoMedio', labels, values, {
      horizontal: true,
      colorIndex: 0,
      label: 'Tempo Médio (dias)'
    });
    
    // Renderizar ranking
    renderTempoMedioRanking(dataOrgao);
  }
  
  // Gráfico por mês
  if (dataMes.length > 0) {
    const last12 = dataMes.slice(-12);
    const labels = last12.map(m => {
      const ym = m.month || m.ym || '';
      return window.dateUtils?.formatMonthYearShort(ym) || ym;
    });
    const values = last12.map(m => m.average || m.media || 0);
    
    await window.chartFactory?.createLineChart('chartTempoMedioMes', labels, values, {
      label: 'Tempo Médio (dias)',
      colorIndex: 0,
      fill: true,
      tension: 0.4
    });
  }
}

function renderTempoMedioRanking(dataOrgao) {
  const listaTempoMedio = document.getElementById('listaTempoMedio');
  if (!listaTempoMedio) return;
  
  if (dataOrgao.length === 0) {
    listaTempoMedio.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado encontrado</div>';
    return;
  }
  
  listaTempoMedio.innerHTML = dataOrgao.slice(0, 10).map((item, idx) => {
    const unit = item.unit || item._id || 'N/A';
    const average = (item.average || item.media || 0).toFixed(1);
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 w-8">${idx + 1}.</span>
          <span class="text-sm text-slate-300">${unit}</span>
        </div>
        <span class="text-sm font-bold text-cyan-300">${average} dias</span>
      </div>
    `;
  }).join('');
}

async function loadSecondaryTempoMedioData() {
  // Carregar dados por dia
  const dataDia = await window.dataLoader?.load('/api/stats/average-time/by-day', {
    useDataStore: true,
    ttl: 5 * 60 * 1000
  }) || [];
  
  if (dataDia.length > 0) {
    const last30 = dataDia.slice(-30);
    const labels = last30.map(d => {
      const date = d.date || d._id || '';
      return window.dateUtils?.formatDate(date) || date;
    });
    const values = last30.map(d => d.average || d.media || 0);
    
    await window.chartFactory?.createLineChart('chartTempoMedioDia', labels, values, {
      label: 'Tempo Médio (dias)',
      colorIndex: 0,
      fill: true,
      tension: 0.4
    });
  }
  
  // Carregar dados por semana
  const dataSemana = await window.dataLoader?.load('/api/stats/average-time/by-week', {
    useDataStore: true,
    ttl: 5 * 60 * 1000
  }) || [];
  
  if (dataSemana.length > 0) {
    const last12 = dataSemana.slice(-12);
    const labels = last12.map(s => s.week || s._id || 'N/A');
    const values = last12.map(s => s.average || s.media || 0);
    
    await window.chartFactory?.createLineChart('chartTempoMedioSemana', labels, values, {
      label: 'Tempo Médio (dias)',
      colorIndex: 1,
      fill: true,
      tension: 0.4
    });
  }
  
  // Carregar dados por unidade de cadastro
  const dataUnidade = await window.dataLoader?.load('/api/stats/average-time/by-unit', {
    useDataStore: true,
    ttl: 5 * 60 * 1000
  }) || [];
  
  if (dataUnidade.length > 0) {
    const top10 = dataUnidade.slice(0, 10);
    const labels = top10.map(u => u.unit || u._id || 'N/A');
    const values = top10.map(u => u.average || u.media || 0);
    
    await window.chartFactory?.createBarChart('chartTempoMedioUnidade', labels, values, {
      horizontal: true,
      colorIndex: 2,
      label: 'Tempo Médio (dias)'
    });
  }
  
  // Carregar dados por unidade e mês
  const dataUnidadeMes = await window.dataLoader?.load('/api/stats/average-time/by-month-unit', {
    useDataStore: true,
    ttl: 5 * 60 * 1000
  }) || [];
  
  if (dataUnidadeMes.length > 0) {
    // Processar para gráfico de linha múltipla
    const unidades = [...new Set(dataUnidadeMes.map(d => d.unit || d._id))].slice(0, 5);
    const meses = [...new Set(dataUnidadeMes.map(d => d.month || d.ym))].sort();
    
    const datasets = unidades.map((unidade, idx) => {
      const data = meses.map(mes => {
        const item = dataUnidadeMes.find(d => 
          (d.unit === unidade || d._id === unidade) && (d.month === mes || d.ym === mes)
        );
        return item?.average || item?.media || 0;
      });
      return {
        label: unidade,
        data: data
      };
    });
    
    const labels = meses.map(m => window.dateUtils?.formatMonthYearShort(m) || m);
    
    await window.chartFactory?.createLineChart('chartTempoMedioUnidadeMes', labels, datasets, {
      fill: false,
      tension: 0.4
    });
  }
}

window.loadTempoMedio = loadTempoMedio;

