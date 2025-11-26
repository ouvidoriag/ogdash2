/**
 * ============================================================================
 * PÁGINA: ZELADORIA - ANÁLISE POR RESPONSÁVEL
 * ============================================================================
 * 
 * Esta página apresenta uma análise detalhada das ocorrências de zeladoria
 * agrupadas por responsável, permitindo identificar a carga de trabalho
 * individual e a distribuição de demandas entre os responsáveis.
 * 
 * DADOS EXIBIDOS:
 * - Distribuição de ocorrências por responsável (gráfico de barras horizontal)
 * - Ranking dos responsáveis com mais ocorrências
 * - Evolução mensal das ocorrências por responsável
 * - Estatísticas agregadas (total, concentração, média)
 * - Dados adicionais: departamento, categoria, status, prazo
 * 
 * CAMPOS DO BANCO UTILIZADOS:
 * - responsavel: Nome do responsável pelo atendimento
 * - departamento: Departamento do responsável
 * - categoria: Categoria das demandas atendidas
 * - status: Status atual das demandas
 * - prazo: Prazo estabelecido para resolução
 * 
 * ============================================================================
 */

async function loadZeladoriaResponsavel() {
  if (window.Logger) {
    window.Logger.debug('👥 loadZeladoriaResponsavel: Iniciando');
  }
  
  const page = document.getElementById('page-zeladoria-responsavel');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts([
        'zeladoria-responsavel-chart',
        'zeladoria-responsavel-mes-chart'
      ]);
    }
    
    // Carregar dados por responsável
    const data = await window.dataLoader?.load('/api/zeladoria/count-by?field=responsavel', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(data) || data.length === 0) {
      if (window.Logger) {
        window.Logger.warn('👥 loadZeladoriaResponsavel: Dados não são um array válido', data);
      }
      return;
    }
    
    // Ordenar por quantidade (maior primeiro) e pegar top 20
    const sortedData = [...data].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 20);
    const labels = sortedData.map(d => d.key || d._id || 'N/A');
    const values = sortedData.map(d => d.count || 0);
    
    // Criar gráfico principal (barra horizontal)
    await window.chartFactory?.createBarChart('zeladoria-responsavel-chart', labels, values, {
      horizontal: true,
      colorIndex: 4,
      field: 'responsavel',
      onClick: true,
      legendContainer: 'zeladoria-responsavel-legend'
    });
    
    // Renderizar ranking de responsáveis
    renderResponsavelRanking(sortedData);
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/zeladoria/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      await renderResponsavelMesChart(dataMes, sortedData.slice(0, 10));
    }
    
    // Renderizar estatísticas
    renderResponsavelStats(sortedData);
    
    if (window.Logger) {
      window.Logger.success('👥 loadZeladoriaResponsavel: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Responsável Zeladoria:', error);
    }
  }
}

/**
 * Renderizar gráfico de responsável por mês
 */
async function renderResponsavelMesChart(dataMes, topResponsaveis) {
  const meses = [...new Set(dataMes.map(d => d.month || d.ym))].sort();
  const responsaveis = topResponsaveis.map(r => r.key || r._id || 'N/A');
  
  const datasets = responsaveis.map((responsavel, idx) => {
    const data = meses.map(mes => {
      const item = dataMes.find(d => {
        const dMonth = d.month || d.ym;
        const dResp = d.responsavel;
        return dMonth === mes && dResp === responsavel;
      });
      return item?.count || 0;
    });
    return {
      label: responsavel,
      data: data
    };
  });
  
  const labels = meses.map(m => {
    if (window.dateUtils?.formatMonthYearShort) {
      return window.dateUtils.formatMonthYearShort(m);
    }
    return m;
  });
  
  await window.chartFactory?.createBarChart('zeladoria-responsavel-mes-chart', labels, datasets, {
    colorIndex: 0,
    onClick: true, // Habilitar comunicação e filtros globais
    legendContainer: 'zeladoria-responsavel-mes-legend'
  });
}

/**
 * Renderizar ranking de responsáveis
 */
function renderResponsavelRanking(data) {
  const rankEl = document.getElementById('zeladoria-responsavel-ranking');
  if (!rankEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  
  rankEl.innerHTML = data.map((item, idx) => {
    const responsavel = item.key || item._id || 'N/A';
    const count = item.count || 0;
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <span class="text-xs text-slate-400 w-6">${idx + 1}.</span>
          <span class="text-sm text-slate-300 truncate" title="${responsavel}">${responsavel || 'Não informado'}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-sm font-bold text-amber-300">${count.toLocaleString('pt-BR')}</div>
            <div class="text-xs text-slate-500">${percent}%</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renderizar estatísticas
 */
function renderResponsavelStats(data) {
  const statsEl = document.getElementById('zeladoria-responsavel-stats');
  if (!statsEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const top5 = data.slice(0, 5).reduce((sum, item) => sum + (item.count || 0), 0);
  const top5Percent = total > 0 ? ((top5 / total) * 100).toFixed(1) : 0;
  const uniqueResponsaveis = data.length;
  const avgPerResp = uniqueResponsaveis > 0 ? (total / uniqueResponsaveis).toFixed(0) : 0;
  
  statsEl.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Total de Ocorrências</div>
        <div class="text-2xl font-bold text-cyan-300">${total.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Responsáveis</div>
        <div class="text-2xl font-bold text-violet-300">${uniqueResponsaveis}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Top 5 Concentração</div>
        <div class="text-2xl font-bold text-emerald-300">${top5Percent}%</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Média por Responsável</div>
        <div class="text-2xl font-bold text-amber-300">${avgPerResp}</div>
      </div>
    </div>
  `;
}

window.loadZeladoriaResponsavel = loadZeladoriaResponsavel;
