/**
 * Página: Zeladoria - Por Categoria
 * 
 * Refatorada para trazer o máximo de informações possíveis
 */

async function loadZeladoriaCategoria() {
  if (window.Logger) {
    window.Logger.debug('📂 loadZeladoriaCategoria: Iniciando');
  }
  
  const page = document.getElementById('page-zeladoria-categoria');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'zeladoria-categoria-chart',
        'zeladoria-categoria-mes-chart'
      ]);
    }
    
    // Carregar dados por categoria
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=categoria', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(data) || data.length === 0) {
      if (window.Logger) {
        window.Logger.warn('📂 loadZeladoriaCategoria: Dados não são um array válido', data);
      }
      return;
    }
    
    // Ordenar por quantidade (maior primeiro) e pegar top 20
    const sortedData = [...data].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 20);
    const labels = sortedData.map(d => d.key || d._id || 'N/A');
    const values = sortedData.map(d => d.count || 0);
    
    // Criar gráfico principal (barra horizontal)
    await window.chartFactory?.createBarChart('zeladoria-categoria-chart', labels, values, {
      horizontal: true,
      colorIndex: 1,
      field: 'categoria',
      onClick: true,
      legendContainer: 'zeladoria-categoria-legend'
    });
    
    // Renderizar ranking de categorias
    renderCategoriaRanking(sortedData);
    
    // Carregar dados de categoria por departamento
    const categoriaDepartamento = await window.dataLoader?.load('/api/zeladoria/by-categoria-departamento', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (categoriaDepartamento.length > 0) {
      await renderCategoriaDepartamentoChart(categoriaDepartamento);
    }
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/zeladoria/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderCategoriaMesChart(dataMes, sortedData.slice(0, 10));
    }
    
    // Renderizar estatísticas
    renderCategoriaStats(sortedData);
    
    if (window.Logger) {
      window.Logger.success('📂 loadZeladoriaCategoria: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Categoria Zeladoria:', error);
    }
  }
}

/**
 * Renderizar gráfico de categoria por mês
 */
async function renderCategoriaMesChart(dataMes, topCategorias) {
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const categorias = topCategorias.map(c => c.key || c._id || 'N/A');
  
  const datasets = categorias.map((categoria, idx) => {
    const data = meses.map(mes => {
      const item = dataMes.find(d => {
        const dMonth = d.month || d.ym;
        const dCategoria = d.categoria;
        return dMonth === mes && dCategoria === categoria;
      });
      return item?.count || 0;
    });
    return {
      label: categoria,
      data: data
    };
  });
  
  const labels = meses.map(m => {
    if (window.dateUtils?.formatMonthYearShort) {
      return window.dateUtils.formatMonthYearShort(m);
    }
    return m;
  });
  
  await window.chartFactory?.createBarChart('zeladoria-categoria-mes-chart', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'zeladoria-categoria-mes-legend'
  });
}

/**
 * Renderizar gráfico de categoria por departamento
 */
async function renderCategoriaDepartamentoChart(data) {
  // Agrupar por categoria e mostrar departamentos
  const categorias = [...new Set(data.map(d => d.categoria || d._id?.categoria))];
  const departamentos = [...new Set(data.map(d => d.departamento || d._id?.departamento))];
  
  const datasets = categorias.slice(0, 10).map((categoria, idx) => {
    const dataPoints = departamentos.map(dept => {
      const item = data.find(d => {
        const dCategoria = d.categoria || d._id?.categoria;
        const dDept = d.departamento || d._id?.departamento;
        return dCategoria === categoria && dDept === dept;
      });
      return item?.count || 0;
    });
    return {
      label: categoria,
      data: dataPoints
    };
  });
  
  await window.chartFactory?.createBarChart('zeladoria-categoria-dept-chart', departamentos, datasets, {
    colorIndex: 2,
    legendContainer: 'zeladoria-categoria-dept-legend'
  });
}

/**
 * Renderizar ranking de categorias
 */
function renderCategoriaRanking(data) {
  const rankEl = document.getElementById('zeladoria-categoria-ranking');
  if (!rankEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  
  rankEl.innerHTML = data.map((item, idx) => {
    const categoria = item.key || item._id || 'N/A';
    const count = item.count || 0;
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <span class="text-xs text-slate-400 w-6">${idx + 1}.</span>
          <span class="text-sm text-slate-300 truncate" title="${categoria}">${categoria}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-sm font-bold text-violet-300">${count.toLocaleString('pt-BR')}</div>
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
function renderCategoriaStats(data) {
  const statsEl = document.getElementById('zeladoria-categoria-stats');
  if (!statsEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const top5 = data.slice(0, 5).reduce((sum, item) => sum + (item.count || 0), 0);
  const top5Percent = total > 0 ? ((top5 / total) * 100).toFixed(1) : 0;
  const uniqueCategories = data.length;
  
  statsEl.innerHTML = `
    <div class="grid grid-cols-3 gap-4">
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Total de Ocorrências</div>
        <div class="text-2xl font-bold text-cyan-300">${total.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Categorias Únicas</div>
        <div class="text-2xl font-bold text-violet-300">${uniqueCategories}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Top 5 Concentração</div>
        <div class="text-2xl font-bold text-emerald-300">${top5Percent}%</div>
      </div>
    </div>
  `;
}

window.loadZeladoriaCategoria = loadZeladoriaCategoria;
