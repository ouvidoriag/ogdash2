/**
 * Página: Por Órgão e Mês
 * Análise de manifestações por órgão e período mensal
 * 
 * Recriada com estrutura otimizada
 */

async function loadOrgaoMes(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('🏢 loadOrgaoMes: Iniciando');
  }
  
  const page = document.getElementById('page-orgao-mes');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Carregar dados de órgãos
    const dataOrgaos = await window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {
      useDataStore: true,
      ttl: 10 * 60 * 1000 // 10 minutos
    }) || [];
    
    // Carregar dados mensais
    const dataMensal = await window.dataLoader?.load('/api/aggregate/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Renderizar lista de órgãos
    renderOrgaosList(dataOrgaos);
    
    // Renderizar gráfico mensal
    await renderOrgaoMesChart(dataMensal);
    
    // Atualizar KPI total
    const total = dataOrgaos.reduce((sum, item) => sum + (item.count || 0), 0);
    const totalEl = document.getElementById('totalOrgaos');
    if (totalEl) {
      totalEl.textContent = total.toLocaleString('pt-BR');
    }
    
    if (window.Logger) {
      window.Logger.success('🏢 loadOrgaoMes: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar OrgaoMes:', error);
    }
  }
}

function renderOrgaosList(dataOrgaos) {
  const listaOrgaos = document.getElementById('listaOrgaos');
  if (!listaOrgaos) return;
  
  if (dataOrgaos.length === 0) {
    listaOrgaos.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum órgão encontrado</div>';
    return;
  }
  
  const maxValue = Math.max(...dataOrgaos.map(d => d.count || 0), 1);
  listaOrgaos.innerHTML = dataOrgaos.map(item => {
    const width = ((item.count || 0) / maxValue) * 100;
    const key = item.key || item.organ || item._id || 'Não informado';
    return `
      <div class="flex items-center gap-3 py-2 border-b border-white/5">
        <div class="flex-1 min-w-0">
          <div class="text-sm text-slate-300 truncate">${key}</div>
          <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
          </div>
        </div>
        <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${(item.count || 0).toLocaleString('pt-BR')}</div>
      </div>
    `;
  }).join('');
}

async function renderOrgaoMesChart(dataMensal) {
  if (!dataMensal || dataMensal.length === 0) return;
  
  const labels = dataMensal.map(x => {
    const ym = x.ym || x.month || '';
    return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
  });
  const values = dataMensal.map(x => x.count || 0);
  
  await window.chartFactory?.createBarChart('chartOrgaoMes', labels, values, {
    horizontal: true,
    colorIndex: 1,
    label: 'Manifestações',
    onClick: true // Habilitar comunicação e filtros
  });
}

window.loadOrgaoMes = loadOrgaoMes;

