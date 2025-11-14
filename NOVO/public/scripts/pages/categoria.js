/**
 * Página: Categoria
 * 
 * Recriada com estrutura otimizada
 */

async function loadCategoria(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('📂 loadCategoria: Iniciando');
  }
  
  const page = document.getElementById('page-categoria');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Categoria', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top10 = data.slice(0, 10);
    const labels = top10.map(x => x.key || x._id || 'N/A');
    const values = top10.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartCategoria', labels, values, {
      horizontal: true,
      colorIndex: 4,
      label: 'Manifestações',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Categoria', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderCategoriaMesChart(dataMes);
    }
    
    if (window.Logger) {
      window.Logger.success('📂 loadCategoria: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Categoria:', error);
    }
  }
}

async function renderCategoriaMesChart(dataMes) {
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const categorias = [...new Set(dataMes.map(d => d.categoria || d._id))].slice(0, 10);
  
  const datasets = categorias.map((categoria, idx) => {
    const data = meses.map(mes => {
      const item = dataMes.find(d => 
        (d.month === mes || d.ym === mes) && (d.categoria === categoria || d._id === categoria)
      );
      return item?.count || 0;
    });
    return {
      label: categoria,
      data: data
    };
  });
  
  const labels = meses.map(m => window.dateUtils?.formatMonthYearShort(m) || m);
  
  await window.chartFactory?.createBarChart('chartCategoriaMes', labels, datasets, {
    colorIndex: 0
  });
}

window.loadCategoria = loadCategoria;

