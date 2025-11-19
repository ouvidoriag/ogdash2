/**
 * Página: Por Assunto
 * Análise de manifestações por assunto
 * 
 * Recriada com estrutura otimizada
 */

async function loadAssunto() {
  if (window.Logger) {
    window.Logger.debug('📝 loadAssunto: Iniciando');
  }
  
  const page = document.getElementById('page-assunto');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'chartAssunto',
        'chartStatusAssunto',
        'chartAssuntoMes'
      ]);
    }
    
    // Carregar dados de assuntos
    const dataAssuntosRaw = await window.dataLoader?.load('/api/aggregate/by-subject', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(dataAssuntosRaw)) {
      if (window.Logger) {
        window.Logger.warn('📝 loadAssunto: Dados não são um array', dataAssuntosRaw);
      }
      return;
    }
    
    // Normalizar dados (endpoint retorna { assunto, quantidade }, mas código espera { subject, count })
    const dataAssuntos = dataAssuntosRaw.map(item => ({
      subject: item.subject || item.assunto || 'N/A',
      assunto: item.assunto || item.subject || 'N/A',
      count: item.count || item.quantidade || 0,
      quantidade: item.quantidade || item.count || 0,
      _id: item.subject || item.assunto || 'N/A'
    }));
    
    if (window.Logger) {
      window.Logger.debug('📝 loadAssunto: Dados carregados', { 
        raw: dataAssuntosRaw.length, 
        normalized: dataAssuntos.length,
        sample: dataAssuntos[0] 
      });
    }
    
    // Carregar dados mensais de assuntos
    const dataAssuntoMes = await window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Assunto', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Renderizar gráfico principal
    await renderAssuntoChart(dataAssuntos);
    
    // Renderizar status por assunto
    await renderStatusAssuntoChart(dataAssuntos);
    
    // Renderizar assuntos por mês
    await renderAssuntoMesChart(dataAssuntoMes);
    
    // Renderizar lista completa
    renderAssuntosList(dataAssuntos);
    
    if (window.Logger) {
      window.Logger.success('📝 loadAssunto: Concluído');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Assunto:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Assunto:', error);
    }
  }
}

/**
 * Inicializar listeners de filtro para a página Assunto
 */
function initAssuntoFilterListeners() {
  if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
    window.chartCommunication.createPageFilterListener('page-assunto', loadAssunto, 500);
    if (window.Logger) {
      window.Logger.success('✅ Listeners de filtro para Assunto inicializados');
    }
  }
}

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAssuntoFilterListeners);
} else {
  initAssuntoFilterListeners();
}

async function renderAssuntoChart(dataAssuntos) {
  if (!dataAssuntos || !Array.isArray(dataAssuntos) || dataAssuntos.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderAssuntoChart: dados inválidos ou vazios', dataAssuntos);
    }
    return;
  }
  
  const top15 = dataAssuntos.slice(0, 15);
  const labels = top15.map(a => a.subject || a.assunto || a._id || 'N/A');
  const values = top15.map(a => a.count || a.quantidade || 0);
  
  if (window.Logger) {
    window.Logger.debug('📊 renderAssuntoChart:', { total: dataAssuntos.length, top15: top15.length, sample: top15[0] });
  }
  
  await window.chartFactory?.createBarChart('chartAssunto', labels, values, {
    horizontal: true,
    colorIndex: 3,
    label: 'Manifestações',
    onClick: true // Habilitar comunicação e filtros
  });
}

async function renderStatusAssuntoChart(dataAssuntos) {
  if (!dataAssuntos || !Array.isArray(dataAssuntos) || dataAssuntos.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderStatusAssuntoChart: dados inválidos ou vazios');
    }
    return;
  }
  
  // Se os dados não têm statusCounts, buscar status geral
  // Usar dashboard-data que já tem os dados de status
  try {
    const dashboardData = await window.dataLoader?.load('/api/dashboard-data', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || {};
    
    const statusData = dashboardData.manifestationsByStatus || [];
    
    if (statusData.length > 0) {
      const labels = statusData.map(s => s.status || s._id || 'N/A');
      const values = statusData.map(s => s.count || 0);
      
      await window.chartFactory?.createDoughnutChart('chartStatusAssunto', labels, values, {
        type: 'doughnut',
        onClick: true, // Habilitar comunicação e filtros
        legendContainer: 'legendStatusAssunto'
      });
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao renderizar status por assunto:', error);
    }
  }
}

async function renderAssuntoMesChart(dataAssuntoMes) {
  if (!dataAssuntoMes || !Array.isArray(dataAssuntoMes) || dataAssuntoMes.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderAssuntoMesChart: dados inválidos ou vazios');
    }
    return;
  }
  
  const meses = [...new Set(dataAssuntoMes.map(d => d.month || d.ym))].sort();
  const assuntos = [...new Set(dataAssuntoMes.map(d => d.subject || d.assunto || d._id))].slice(0, 20);
  
  if (meses.length === 0 || assuntos.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderAssuntoMesChart: sem meses ou assuntos para renderizar');
    }
    return;
  }
  
  const datasets = assuntos.map((assunto, idx) => {
    const data = meses.map(mes => {
      const item = dataAssuntoMes.find(d => 
        (d.month === mes || d.ym === mes) && (d.subject === assunto || d.assunto === assunto || d._id === assunto)
      );
      return item?.count || 0;
    });
    return {
      label: assunto,
      data: data
    };
  });
  
  const labels = meses.map(m => window.dateUtils?.formatMonthYearShort(m) || m);
  
  await window.chartFactory?.createBarChart('chartAssuntoMes', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'legendAssuntoMes'
  });
}

function renderAssuntosList(dataAssuntos) {
  const listaAssuntos = document.getElementById('listaAssuntos');
  if (!listaAssuntos) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderAssuntosList: elemento listaAssuntos não encontrado');
    }
    return;
  }
  
  if (!dataAssuntos || !Array.isArray(dataAssuntos) || dataAssuntos.length === 0) {
    listaAssuntos.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum assunto encontrado</div>';
    if (window.Logger) {
      window.Logger.warn('⚠️ renderAssuntosList: dados inválidos ou vazios', dataAssuntos);
    }
    return;
  }
  
  if (window.Logger) {
    window.Logger.debug('📊 renderAssuntosList:', { total: dataAssuntos.length, sample: dataAssuntos[0] });
  }
  
  listaAssuntos.innerHTML = dataAssuntos.map((item, idx) => {
    const assunto = item.subject || item.assunto || item._id || 'N/A';
    const count = item.count || item.quantidade || 0;
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 w-8">${idx + 1}.</span>
          <span class="text-sm text-slate-300">${assunto}</span>
        </div>
        <span class="text-sm font-bold text-emerald-300">${count.toLocaleString('pt-BR')}</span>
      </div>
    `;
  }).join('');
}

window.loadAssunto = loadAssunto;

