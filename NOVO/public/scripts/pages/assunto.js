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
    // Carregar dados de assuntos
    const dataAssuntos = await window.dataLoader?.load('/api/aggregate/by-subject', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
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
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Assunto:', error);
    }
  }
}

async function renderAssuntoChart(dataAssuntos) {
  if (!dataAssuntos || dataAssuntos.length === 0) return;
  
  const top15 = dataAssuntos.slice(0, 15);
  const labels = top15.map(a => a.subject || a._id || 'N/A');
  const values = top15.map(a => a.count || 0);
  
  await window.chartFactory?.createBarChart('chartAssunto', labels, values, {
    horizontal: true,
    colorIndex: 3,
    label: 'Manifestações',
    onClick: true // Habilitar comunicação e filtros
  });
}

async function renderStatusAssuntoChart(dataAssuntos) {
  if (!dataAssuntos || dataAssuntos.length === 0) return;
  
  const statusMap = new Map();
  dataAssuntos.forEach(assunto => {
    if (assunto.statusCounts) {
      assunto.statusCounts.forEach(status => {
        const key = status.status || status._id || 'N/A';
        statusMap.set(key, (statusMap.get(key) || 0) + (status.count || 0));
      });
    }
  });
  
  const labels = Array.from(statusMap.keys());
  const values = Array.from(statusMap.values());
  
  if (labels.length > 0) {
    await window.chartFactory?.createDoughnutChart('chartStatusAssunto', labels, values, {
      type: 'doughnut',
      onClick: true, // Habilitar comunicação e filtros
      legendContainer: 'legendStatusAssunto'
    });
  }
}

async function renderAssuntoMesChart(dataAssuntoMes) {
  if (!dataAssuntoMes || dataAssuntoMes.length === 0) return;
  
  const meses = [...new Set(dataAssuntoMes.map(d => d.month || d.ym))].sort();
  const assuntos = [...new Set(dataAssuntoMes.map(d => d.subject || d._id))].slice(0, 10);
  
  const datasets = assuntos.map((assunto, idx) => {
    const data = meses.map(mes => {
      const item = dataAssuntoMes.find(d => 
        (d.month === mes || d.ym === mes) && (d.subject === assunto || d._id === assunto)
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
  if (!listaAssuntos) return;
  
  if (dataAssuntos.length === 0) {
    listaAssuntos.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum assunto encontrado</div>';
    return;
  }
  
  listaAssuntos.innerHTML = dataAssuntos.map((item, idx) => {
    const assunto = item.subject || item._id || 'N/A';
    const count = item.count || 0;
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

