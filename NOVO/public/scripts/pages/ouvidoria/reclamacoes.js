/**
 * Página: Reclamações e Denúncias
 * 
 * Recriada com estrutura otimizada
 */

async function loadReclamacoes() {
  if (window.Logger) {
    window.Logger.debug('⚠️ loadReclamacoes: Iniciando');
  }
  
  const page = document.getElementById('page-reclamacoes');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const [data, dataMensal] = await Promise.all([
      window.dataLoader?.load('/api/complaints-denunciations', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || { assuntos: [], tipos: [] },
      window.dataLoader?.load('/api/aggregate/by-month', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || []
    ]);
    
    const assuntos = data.assuntos || [];
    const tipos = data.tipos || [];
    
    // Renderizar lista de assuntos
    if (assuntos && Array.isArray(assuntos)) {
      renderReclamacoesAssuntosList(assuntos);
    } else {
      if (window.Logger) {
        window.Logger.warn('Assuntos não é um array válido:', assuntos);
      }
      renderReclamacoesAssuntosList([]);
    }
    
    // Renderizar gráfico de tipos
    if (tipos && Array.isArray(tipos) && tipos.length > 0) {
      await renderTiposChart(tipos);
    } else {
      if (window.Logger) {
        window.Logger.warn('Tipos não é um array válido ou está vazio:', tipos);
      }
    }
    
    // Renderizar gráfico mensal
    await renderReclamacoesMesChart(dataMensal);
    
    // Atualizar KPIs
    updateReclamacoesKPIs(assuntos, tipos);
    
    if (window.Logger) {
      window.Logger.success('⚠️ loadReclamacoes: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Reclamações:', error);
    }
  }
}

function renderReclamacoesAssuntosList(assuntos) {
  const listaEl = document.getElementById('listaReclamacoes');
  if (!listaEl) return;
  
  if (assuntos.length === 0) {
    listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum assunto encontrado</div>';
    return;
  }
  
  const maxValue = Math.max(...assuntos.map(d => d.quantidade || d.count || 0), 1);
  listaEl.innerHTML = assuntos.map((item, idx) => {
    const quantidade = item.quantidade || item.count || 0;
    const width = (quantidade / maxValue) * 100;
    const assunto = item.assunto || item.key || item._id || 'N/A';
    return `
      <div class="flex items-center gap-3 py-2 border-b border-white/5">
        <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-slate-300 truncate font-medium">${assunto}</div>
          <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-rose-500 to-pink-500" style="width: ${width}%"></div>
          </div>
        </div>
        <div class="text-lg font-bold text-rose-300 min-w-[80px] text-right">${quantidade.toLocaleString('pt-BR')}</div>
      </div>
    `;
  }).join('');
}

async function renderTiposChart(tipos) {
  if (!tipos || !Array.isArray(tipos) || tipos.length === 0) {
    if (window.Logger) {
      window.Logger.warn('renderTiposChart: tipos inválido ou vazio');
    }
    return;
  }
  
  const labels = tipos.map(t => t.tipo || t.key || t._id || 'N/A');
  const values = tipos.map(t => t.quantidade || t.count || 0);
  
  await window.chartFactory?.createBarChart('chartReclamacoesTipo', labels, values, {
    horizontal: true,
    field: 'tipoDeManifestacao',
    colorIndex: 4,
    label: 'Quantidade',
    onClick: false // FILTROS DE CLIQUE DESABILITADOS
  });
}

/**
 * Atualizar KPIs da página Reclamações e Denúncias
 */
function updateReclamacoesKPIs(assuntos, tipos) {
  const totalReclamacoes = assuntos?.reduce((sum, item) => sum + (item.quantidade || item.count || 0), 0) || 0;
  const totalDenuncias = tipos?.find(t => (t.tipo || t.key || '').toLowerCase().includes('denúncia'))?.quantidade || 0;
  const assuntosUnicos = assuntos?.length || 0;
  const assuntoMaisComum = assuntos && assuntos.length > 0 
    ? (assuntos[0].assunto || assuntos[0].key || assuntos[0]._id || 'N/A')
    : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalReclamacoes');
  const kpiDenuncias = document.getElementById('kpiTotalDenuncias');
  const kpiAssuntos = document.getElementById('kpiAssuntosUnicos');
  const kpiMaisComum = document.getElementById('kpiAssuntoMaisComum');
  
  if (kpiTotal) kpiTotal.textContent = totalReclamacoes.toLocaleString('pt-BR');
  if (kpiDenuncias) kpiDenuncias.textContent = totalDenuncias.toLocaleString('pt-BR');
  if (kpiAssuntos) kpiAssuntos.textContent = assuntosUnicos.toLocaleString('pt-BR');
  if (kpiMaisComum) {
    kpiMaisComum.textContent = assuntoMaisComum.length > 20 ? assuntoMaisComum.substring(0, 20) + '...' : assuntoMaisComum;
    kpiMaisComum.title = assuntoMaisComum; // Tooltip com nome completo
  }
}

async function renderReclamacoesMesChart(dataMensal) {
  if (!dataMensal || dataMensal.length === 0) return;
  
  const labels = dataMensal.map(x => {
    const ym = x.ym || x.month || '';
    return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
  });
  const values = dataMensal.map(x => x.count || 0);
  
  await window.chartFactory?.createBarChart('chartReclamacoesMes', labels, values, {
    colorIndex: 4,
    label: 'Quantidade'
  });
}

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-reclamacoes', loadReclamacoes, 500);
}

window.loadReclamacoes = loadReclamacoes;

