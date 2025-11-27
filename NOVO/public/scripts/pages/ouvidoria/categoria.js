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
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'chartCategoria',
        'chartCategoriaMes'
      ]);
    }
    
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Categoria', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(data) || data.length === 0) {
      if (window.Logger) {
        window.Logger.warn('📂 loadCategoria: Dados não são um array válido', data);
      }
      return;
    }
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
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
    
    // Atualizar KPIs
    updateCategoriaKPIs(data);
    
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
  // Validar parâmetros
  if (!dataMes || !Array.isArray(dataMes) || dataMes.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderCategoriaMesChart: dataMes vazio ou inválido', dataMes);
    }
    return;
  }
  
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const categorias = [...new Set(dataMes.map(d => d.categoria || d._id))].slice(0, 20);
  
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
    colorIndex: 0,
    legendContainer: 'legendCategoriaMes'
  });
}

/**
 * Atualizar KPIs da página Categoria
 */
function updateCategoriaKPIs(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return;
  }
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const categoriasUnicas = data.length;
  const mediaCategoria = categoriasUnicas > 0 ? Math.round(total / categoriasUnicas) : 0;
  const categoriaMaisComum = data.length > 0 ? (data[0].key || data[0]._id || 'N/A') : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalCategoria');
  const kpiUnicas = document.getElementById('kpiCategoriasUnicas');
  const kpiMedia = document.getElementById('kpiMediaCategoria');
  const kpiMaisComum = document.getElementById('kpiCategoriaMaisComum');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicas) kpiUnicas.textContent = categoriasUnicas.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaCategoria.toLocaleString('pt-BR');
  if (kpiMaisComum) {
    kpiMaisComum.textContent = categoriaMaisComum.length > 20 ? categoriaMaisComum.substring(0, 20) + '...' : categoriaMaisComum;
    kpiMaisComum.title = categoriaMaisComum; // Tooltip com nome completo
  }
}

window.loadCategoria = loadCategoria;

