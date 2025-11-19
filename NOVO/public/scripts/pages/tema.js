/**
 * Página: Por Tema
 * Análise de manifestações por tema
 * 
 * Recriada com estrutura otimizada
 */

async function loadTema() {
  if (window.Logger) {
    window.Logger.debug('📑 loadTema: Iniciando');
  }
  
  const page = document.getElementById('page-tema');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'chartTema',
        'chartStatusTema',
        'chartTemaMes'
      ]);
    }
    
    // Carregar dados de temas
    const dataTemasRaw = await window.dataLoader?.load('/api/aggregate/by-theme', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(dataTemasRaw)) {
      if (window.Logger) {
        window.Logger.warn('📑 loadTema: Dados não são um array', dataTemasRaw);
      }
      return;
    }
    
    // Normalizar dados (endpoint retorna { tema, quantidade }, mas código espera { theme, count })
    const dataTemas = dataTemasRaw.map(item => ({
      theme: item.theme || item.tema || 'N/A',
      tema: item.tema || item.theme || 'N/A',
      count: item.count || item.quantidade || 0,
      quantidade: item.quantidade || item.count || 0,
      _id: item.theme || item.tema || 'N/A'
    }));
    
    if (window.Logger) {
      window.Logger.debug('📑 loadTema: Dados carregados', { 
        raw: dataTemasRaw.length, 
        normalized: dataTemas.length,
        sample: dataTemas[0] 
      });
    }
    
    // Carregar dados mensais de temas
    const dataTemaMes = await window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Tema', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Renderizar gráfico principal
    await renderTemaChart(dataTemas);
    
    // Renderizar status por tema
    await renderStatusTemaChart(dataTemas);
    
    // Renderizar temas por mês
    await renderTemaMesChart(dataTemaMes);
    
    // Renderizar lista completa
    renderTemasList(dataTemas);
    
    if (window.Logger) {
      window.Logger.success('📑 loadTema: Concluído');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Tema:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Tema:', error);
    }
  }
}

/**
 * Inicializar listeners de filtro para a página Tema
 * Escuta eventos do sistema de comunicação de gráficos para recarregar dados
 */
function initTemaFilterListeners() {
  if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
    window.chartCommunication.createPageFilterListener('page-tema', loadTema, 500);
    if (window.Logger) {
      window.Logger.success('✅ Listeners de filtro para Tema inicializados');
    }
  }
}

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTemaFilterListeners);
} else {
  initTemaFilterListeners();
}

async function renderTemaChart(dataTemas) {
  if (!dataTemas || !Array.isArray(dataTemas) || dataTemas.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemaChart: dados inválidos ou vazios', dataTemas);
    }
    return;
  }
  
  const top15 = dataTemas.slice(0, 15);
  const labels = top15.map(t => t.theme || t.tema || t._id || 'N/A');
  const values = top15.map(t => t.count || t.quantidade || 0);
  
  if (window.Logger) {
    window.Logger.debug('📊 renderTemaChart:', { total: dataTemas.length, top15: top15.length, sample: top15[0] });
  }
  
  await window.chartFactory?.createBarChart('chartTema', labels, values, {
    horizontal: true,
    colorIndex: 2,
    label: 'Manifestações',
    onClick: true // Habilitar comunicação e filtros
  });
}

async function renderStatusTemaChart(dataTemas) {
  if (!dataTemas || !Array.isArray(dataTemas) || dataTemas.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderStatusTemaChart: dados inválidos ou vazios');
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
      
      await window.chartFactory?.createDoughnutChart('chartStatusTema', labels, values, {
        type: 'doughnut',
        onClick: true, // Habilitar comunicação e filtros
        legendContainer: 'legendStatusTema'
      });
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao renderizar status por tema:', error);
    }
  }
}

async function renderTemaMesChart(dataTemaMes) {
  if (!dataTemaMes || !Array.isArray(dataTemaMes) || dataTemaMes.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemaMesChart: dados inválidos ou vazios');
    }
    return;
  }
  
  // Processar dados para gráfico de barras agrupadas
  const meses = [...new Set(dataTemaMes.map(d => d.month || d.ym))].sort();
  const temas = [...new Set(dataTemaMes.map(d => d.theme || d.tema || d._id))].slice(0, 20);
  
  if (meses.length === 0 || temas.length === 0) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemaMesChart: sem meses ou temas para renderizar');
    }
    return;
  }
  
  const datasets = temas.map((tema, idx) => {
    const data = meses.map(mes => {
      const item = dataTemaMes.find(d => 
        (d.month === mes || d.ym === mes) && (d.theme === tema || d.tema === tema || d._id === tema)
      );
      return item?.count || 0;
    });
    return {
      label: tema,
      data: data
    };
  });
  
  const labels = meses.map(m => window.dateUtils?.formatMonthYearShort(m) || m);
  
  await window.chartFactory?.createBarChart('chartTemaMes', labels, datasets, {
    colorIndex: 0,
    legendContainer: 'legendTemaMes'
  });
}

function renderTemasList(dataTemas) {
  const listaTemas = document.getElementById('listaTemas');
  if (!listaTemas) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemasList: elemento listaTemas não encontrado');
    }
    return;
  }
  
  if (!dataTemas || !Array.isArray(dataTemas) || dataTemas.length === 0) {
    listaTemas.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum tema encontrado</div>';
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTemasList: dados inválidos ou vazios', dataTemas);
    }
    return;
  }
  
  if (window.Logger) {
    window.Logger.debug('📊 renderTemasList:', { total: dataTemas.length, sample: dataTemas[0] });
  }
  
  listaTemas.innerHTML = dataTemas.map((item, idx) => {
    const tema = item.theme || item.tema || item._id || 'N/A';
    const count = item.count || item.quantidade || 0;
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 w-8">${idx + 1}.</span>
          <span class="text-sm text-slate-300">${tema}</span>
        </div>
        <span class="text-sm font-bold text-violet-300">${count.toLocaleString('pt-BR')}</span>
      </div>
    `;
  }).join('');
}

window.loadTema = loadTema;

