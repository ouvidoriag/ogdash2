/**
 * Página: Zeladoria - Por Departamento
 * 
 * Refatorada para trazer o máximo de informações possíveis
 */

async function loadZeladoriaDepartamento() {
  if (window.Logger) {
    window.Logger.debug('🏢 loadZeladoriaDepartamento: Iniciando');
  }
  
  const page = document.getElementById('page-zeladoria-departamento');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'zeladoria-departamento-chart',
        'zeladoria-departamento-mes-chart'
      ]);
    }
    
    // Carregar dados por departamento
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=departamento', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(data) || data.length === 0) {
      if (window.Logger) {
        window.Logger.warn('🏢 loadZeladoriaDepartamento: Dados não são um array válido', data);
      }
      return;
    }
    
    // Ordenar por quantidade (maior primeiro)
    const sortedData = [...data].sort((a, b) => (b.count || 0) - (a.count || 0));
    const labels = sortedData.map(d => d.key || d._id || 'N/A');
    const values = sortedData.map(d => d.count || 0);
    
    // Criar gráfico principal (barra horizontal)
    await window.chartFactory?.createBarChart('zeladoria-departamento-chart', labels, values, {
      horizontal: true,
      colorIndex: 2,
      field: 'departamento',
      onClick: true,
      legendContainer: 'zeladoria-departamento-legend'
    });
    
    // Renderizar ranking de departamentos
    renderDepartamentoRanking(sortedData);
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/zeladoria/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderDepartamentoMesChart(dataMes, sortedData.slice(0, 10));
    }
    
    // Renderizar estatísticas
    renderDepartamentoStats(sortedData);
    
    if (window.Logger) {
      window.Logger.success('🏢 loadZeladoriaDepartamento: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Departamento Zeladoria:', error);
    }
  }
}

/**
 * Renderizar gráfico de departamento por mês
 */
async function renderDepartamentoMesChart(dataMes, topDepartamentos) {
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const departamentos = topDepartamentos.map(d => d.key || d._id || 'N/A');
  
  const datasets = departamentos.map((departamento, idx) => {
    const data = meses.map(mes => {
      const item = dataMes.find(d => {
        const dMonth = d.month || d.ym;
        const dDept = d.departamento;
        return dMonth === mes && dDept === departamento;
      });
      return item?.count || 0;
    });
    return {
      label: departamento,
      data: data
    };
  });
  
  const labels = meses.map(m => {
    if (window.dateUtils?.formatMonthYearShort) {
      return window.dateUtils.formatMonthYearShort(m);
    }
    return m;
  });
  
  await window.chartFactory?.createBarChart('zeladoria-departamento-mes-chart', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'zeladoria-departamento-mes-legend'
  });
}

/**
 * Renderizar ranking de departamentos
 */
function renderDepartamentoRanking(data) {
  const rankEl = document.getElementById('zeladoria-departamento-ranking');
  if (!rankEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  
  rankEl.innerHTML = data.map((item, idx) => {
    const departamento = item.key || item._id || 'N/A';
    const count = item.count || 0;
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <span class="text-xs text-slate-400 w-6">${idx + 1}.</span>
          <span class="text-sm text-slate-300 truncate" title="${departamento}">${departamento}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-sm font-bold text-cyan-300">${count.toLocaleString('pt-BR')}</div>
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
function renderDepartamentoStats(data) {
  const statsEl = document.getElementById('zeladoria-departamento-stats');
  if (!statsEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const top3 = data.slice(0, 3).reduce((sum, item) => sum + (item.count || 0), 0);
  const top3Percent = total > 0 ? ((top3 / total) * 100).toFixed(1) : 0;
  const uniqueDepts = data.length;
  const avgPerDept = uniqueDepts > 0 ? (total / uniqueDepts).toFixed(0) : 0;
  
  statsEl.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Total de Ocorrências</div>
        <div class="text-2xl font-bold text-cyan-300">${total.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Departamentos</div>
        <div class="text-2xl font-bold text-violet-300">${uniqueDepts}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Top 3 Concentração</div>
        <div class="text-2xl font-bold text-emerald-300">${top3Percent}%</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Média por Dept.</div>
        <div class="text-2xl font-bold text-amber-300">${avgPerDept}</div>
      </div>
    </div>
  `;
}

window.loadZeladoriaDepartamento = loadZeladoriaDepartamento;
