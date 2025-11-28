/**
 * Página: Por Cadastrante
 * 
 * Recriada com estrutura otimizada
 */

async function loadCadastrante() {
  if (window.Logger) {
    window.Logger.debug('👤 loadCadastrante: Iniciando');
  }
  
  const page = document.getElementById('page-cadastrante');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const [servidores, uacs, dataMensal, summary] = await Promise.all([
      window.dataLoader?.load('/api/aggregate/by-server', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [],
      window.dataLoader?.load('/api/aggregate/count-by?field=UAC', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [],
      window.dataLoader?.load('/api/aggregate/by-month', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [],
      window.dataLoader?.load('/api/summary', {
        useDataStore: true,
        ttl: 5 * 60 * 1000
      }) || { total: 0 }
    ]);
    
    // Renderizar lista de servidores
    renderServidoresList(servidores);
    
    // Renderizar lista de unidades de cadastro
    renderUnidadesList(uacs);
    
    // Renderizar gráfico mensal
    await renderCadastranteMesChart(dataMensal);
    
    // Atualizar KPIs
    updateCadastranteKPIs(servidores, uacs, summary);
    
    // Atualizar total (manter compatibilidade)
    const totalEl = document.getElementById('totalCadastrante');
    if (totalEl) {
      totalEl.textContent = (summary.total || 0).toLocaleString('pt-BR');
    }
    
    if (window.Logger) {
      window.Logger.success('👤 loadCadastrante: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Cadastrante:', error);
    }
  }
}

function renderServidoresList(servidores) {
  const listaServidores = document.getElementById('listaServidores');
  if (!listaServidores) return;
  
  if (servidores.length === 0) {
    listaServidores.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum servidor encontrado</div>';
    return;
  }
  
  const maxValue = Math.max(...servidores.map(d => d.quantidade || d.count || 0), 1);
  listaServidores.innerHTML = servidores.map((item, idx) => {
    const quantidade = item.quantidade || item.count || 0;
    const width = (quantidade / maxValue) * 100;
    const servidor = item.servidor || item.key || item._id || 'N/A';
    return `
      <div class="flex items-center gap-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all" 
           data-servidor="${servidor.replace(/"/g, '&quot;')}">
        <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-slate-300 truncate font-medium">${servidor}</div>
          <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
          </div>
        </div>
        <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${quantidade.toLocaleString('pt-BR')}</div>
      </div>
    `;
  }).join('');
}

function renderUnidadesList(uacs) {
  const listaUnidades = document.getElementById('listaUnidadesCadastro');
  if (!listaUnidades) return;
  
  if (uacs.length === 0) {
    listaUnidades.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhuma unidade encontrada</div>';
    return;
  }
  
  const maxValue = Math.max(...uacs.map(d => d.count || 0), 1);
  listaUnidades.innerHTML = uacs.map((item, idx) => {
    const count = item.count || 0;
    const width = (count / maxValue) * 100;
    const key = item.key || item._id || 'N/A';
    return `
      <div class="flex items-center gap-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all" 
           data-unidade="${key.replace(/"/g, '&quot;')}">
        <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-slate-300 truncate font-medium">${key}</div>
          <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style="width: ${width}%"></div>
          </div>
        </div>
        <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${count.toLocaleString('pt-BR')}</div>
      </div>
    `;
  }).join('');
}

/**
 * Atualizar KPIs da página Cadastrante
 */
function updateCadastranteKPIs(servidores, uacs, summary) {
  const total = summary.total || 0;
  const servidoresUnicos = servidores?.length || 0;
  const unidadesUnicas = uacs?.length || 0;
  const servidorMaisAtivo = servidores && servidores.length > 0 
    ? (servidores[0].servidor || servidores[0].key || servidores[0]._id || 'N/A')
    : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalCadastrante');
  const kpiServidores = document.getElementById('kpiServidoresUnicos');
  const kpiUnidades = document.getElementById('kpiUnidadesUnicas');
  const kpiMaisAtivo = document.getElementById('kpiServidorMaisAtivo');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiServidores) kpiServidores.textContent = servidoresUnicos.toLocaleString('pt-BR');
  if (kpiUnidades) kpiUnidades.textContent = unidadesUnicas.toLocaleString('pt-BR');
  if (kpiMaisAtivo) {
    kpiMaisAtivo.textContent = servidorMaisAtivo.length > 20 ? servidorMaisAtivo.substring(0, 20) + '...' : servidorMaisAtivo;
    kpiMaisAtivo.title = servidorMaisAtivo; // Tooltip com nome completo
  }
}

async function renderCadastranteMesChart(dataMensal) {
  if (!dataMensal || dataMensal.length === 0) return;
  
  const labels = dataMensal.map(x => {
    const ym = x.ym || x.month || '';
    return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
  });
  const values = dataMensal.map(x => x.count || 0);
  
  await window.chartFactory?.createBarChart('chartCadastranteMes', labels, values, {
    colorIndex: 1,
    label: 'Quantidade',
    onClick: true // Habilitar comunicação e filtros globais
  });
}

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-cadastrante', loadCadastrante, 500);
}

window.loadCadastrante = loadCadastrante;

