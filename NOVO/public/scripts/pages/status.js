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
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'chartStatusPage',
        'chartStatusMes'
      ]);
    }
    
    // Usar endpoint correto para obter lista de status
    const statusCounts = await window.dataLoader?.load('/api/aggregate/count-by?field=Status', {
      useDataStore: true,
      ttl: 5 * 60 * 1000
    }) || [];
    
    // Validar que statusCounts é um array
    if (!Array.isArray(statusCounts) || statusCounts.length === 0) {
      if (window.Logger) {
        window.Logger.warn('📊 loadStatusPage: statusCounts não é um array válido', statusCounts);
      }
      // Criar gráfico vazio se não houver dados
      await window.chartFactory?.createDoughnutChart('chartStatusPage', ['Sem dados'], [1], {
        type: 'doughnut',
        onClick: false,
        legendContainer: 'legendStatusPage'
      });
    } else {
      const labels = statusCounts.map(s => s.status || s._id || s.key || 'N/A');
      const values = statusCounts.map(s => s.count || 0);
      
      await window.chartFactory?.createDoughnutChart('chartStatusPage', labels, values, {
        type: 'doughnut',
        onClick: true, // Habilitar comunicação e filtros
        legendContainer: 'legendStatusPage'
      });
    }
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Status', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderStatusMesChart(dataMes);
    } else {
      // Criar gráfico vazio se não houver dados mensais
      const canvas = document.getElementById('chartStatusMes');
      if (canvas && window.chartFactory) {
        await window.chartFactory.createBarChart('chartStatusMes', ['Sem dados'], [{ label: 'Sem dados', data: [0] }], {
          colorIndex: 0,
          legendContainer: 'legendStatusMes'
        });
      }
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

/**
 * Inicializar listeners de filtro para a página Status
 */
function initStatusFilterListeners() {
  if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
    window.chartCommunication.createPageFilterListener('page-status', loadStatusPage, 500);
    if (window.Logger) {
      window.Logger.success('✅ Listeners de filtro para Status inicializados');
    }
  }
}

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStatusFilterListeners);
} else {
  initStatusFilterListeners();
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

