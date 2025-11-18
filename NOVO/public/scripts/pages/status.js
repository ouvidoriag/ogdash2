/**
 * Página: Status
 * 
 * Recriada com estrutura otimizada
 */

async function loadStatusPage(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('📊 loadStatusPage: Iniciando');
  }
  
  const page = document.getElementById('page-status');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/stats/status-overview', {
      useDataStore: true,
      ttl: 5 * 60 * 1000
    }) || {};
    
    const statusCounts = data.statusCounts || data.status || [];
    const labels = statusCounts.map(s => s.status || s._id || 'N/A');
    const values = statusCounts.map(s => s.count || 0);
    
    await window.chartFactory?.createDoughnutChart('chartStatusPage', labels, values, {
      type: 'doughnut',
      onClick: true, // Habilitar comunicação e filtros
      legendContainer: 'legendStatusPage'
    });
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Status', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderStatusMesChart(dataMes);
    }
    
    if (window.Logger) {
      window.Logger.success('📊 loadStatusPage: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Status:', error);
    }
  }
}

async function renderStatusMesChart(dataMes) {
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const statuses = [...new Set(dataMes.map(d => d.status || d._id))];
  
  const datasets = statuses.map((status, idx) => {
    const data = meses.map(mes => {
      const item = dataMes.find(d => 
        (d.month === mes || d.ym === mes) && (d.status === status || d._id === status)
      );
      return item?.count || 0;
    });
    return {
      label: status,
      data: data
    };
  });
  
  const labels = meses.map(m => window.dateUtils?.formatMonthYearShort(m) || m);
  
  await window.chartFactory?.createBarChart('chartStatusMes', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'legendStatusMes'
  });
}

window.loadStatusPage = loadStatusPage;

