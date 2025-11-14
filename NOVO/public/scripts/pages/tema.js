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
    // Carregar dados de temas
    const dataTemas = await window.dataLoader?.load('/api/aggregate/by-theme', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
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
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Tema:', error);
    }
  }
}

async function renderTemaChart(dataTemas) {
  if (!dataTemas || dataTemas.length === 0) return;
  
  const top15 = dataTemas.slice(0, 15);
  const labels = top15.map(t => t.theme || t._id || 'N/A');
  const values = top15.map(t => t.count || 0);
  
  await window.chartFactory?.createBarChart('chartTema', labels, values, {
    horizontal: true,
    colorIndex: 2,
    label: 'Manifestações',
    onClick: true // Habilitar comunicação e filtros
  });
}

async function renderStatusTemaChart(dataTemas) {
  if (!dataTemas || dataTemas.length === 0) return;
  
  // Agrupar por status
  const statusMap = new Map();
  dataTemas.forEach(tema => {
    if (tema.statusCounts) {
      tema.statusCounts.forEach(status => {
        const key = status.status || status._id || 'N/A';
        statusMap.set(key, (statusMap.get(key) || 0) + (status.count || 0));
      });
    }
  });
  
  const labels = Array.from(statusMap.keys());
  const values = Array.from(statusMap.values());
  
  if (labels.length > 0) {
    await window.chartFactory?.createDoughnutChart('chartStatusTema', labels, values, {
      type: 'doughnut',
      onClick: true // Habilitar comunicação e filtros
    });
  }
}

async function renderTemaMesChart(dataTemaMes) {
  if (!dataTemaMes || dataTemaMes.length === 0) return;
  
  // Processar dados para gráfico de barras agrupadas
  const meses = [...new Set(dataTemaMes.map(d => d.month || d.ym))].sort();
  const temas = [...new Set(dataTemaMes.map(d => d.theme || d._id))].slice(0, 10);
  
  const datasets = temas.map((tema, idx) => {
    const data = meses.map(mes => {
      const item = dataTemaMes.find(d => 
        (d.month === mes || d.ym === mes) && (d.theme === tema || d._id === tema)
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
    colorIndex: 0
  });
}

function renderTemasList(dataTemas) {
  const listaTemas = document.getElementById('listaTemas');
  if (!listaTemas) return;
  
  if (dataTemas.length === 0) {
    listaTemas.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum tema encontrado</div>';
    return;
  }
  
  listaTemas.innerHTML = dataTemas.map((item, idx) => {
    const tema = item.theme || item._id || 'N/A';
    const count = item.count || 0;
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

