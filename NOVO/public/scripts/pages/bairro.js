/**
 * Página: Bairro
 * 
 * Recriada com estrutura otimizada
 */

async function loadBairro(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('📍 loadBairro: Iniciando');
  }
  
  const page = document.getElementById('page-bairro');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Bairro', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top15 = data.slice(0, 15);
    const labels = top15.map(x => x.key || x._id || 'N/A');
    const values = top15.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartBairro', labels, values, {
      horizontal: true,
      colorIndex: 5,
      label: 'Manifestações',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Bairro', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderBairroMesChart(dataMes);
    }
    
    if (window.Logger) {
      window.Logger.success('📍 loadBairro: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Bairro:', error);
    }
  }
}

async function renderBairroMesChart(dataMes) {
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const bairros = [...new Set(dataMes.map(d => d.bairro || d._id))].slice(0, 10);
  
  const datasets = bairros.map((bairro, idx) => {
    const data = meses.map(mes => {
      const item = dataMes.find(d => 
        (d.month === mes || d.ym === mes) && (d.bairro === bairro || d._id === bairro)
      );
      return item?.count || 0;
    });
    return {
      label: bairro,
      data: data
    };
  });
  
  const labels = meses.map(m => window.dateUtils?.formatMonthYearShort(m) || m);
  
  await window.chartFactory?.createBarChart('chartBairroMes', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'legendBairroMes'
  });
}

window.loadBairro = loadBairro;

