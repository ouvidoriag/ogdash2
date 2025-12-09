/**
 * ============================================================================
 * PÁGINA: e-SIC - ANÁLISE POR STATUS
 * ============================================================================
 * 
 * Esta página apresenta uma análise detalhada das solicitações de informação
 * agrupadas por status, permitindo monitorar o estado atual das solicitações
 * e identificar gargalos no processo de atendimento.
 * 
 * DADOS EXIBIDOS:
 * - Distribuição de solicitações por status (gráfico de barras)
 * - Ranking dos status mais frequentes
 * - Estatísticas agregadas (total, encerradas, em aberto, taxa de resolução)
 * 
 * CAMPOS DO BANCO UTILIZADOS:
 * - status: Status atual da solicitação
 * - dataCriacaoIso: Data de criação normalizada
 * - dataEncerramentoIso: Data de encerramento normalizada
 * 
 * ============================================================================
 */

// Expor função globalmente ANTES de definir (para garantir disponibilidade)
window.loadEsicStatus = window.loadEsicStatus || function() { return Promise.resolve(); };

async function loadEsicStatus() {
  if (window.Logger) {
    window.Logger.debug('📈 loadEsicStatus: Iniciando');
  }
  
  const page = document.getElementById('page-esic-status');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Destruir gráficos existentes antes de criar novos
    if (window.chartFactory?.destroyCharts) {
      window.chartFactory.destroyCharts(['esic-chart-status-detail']);
    }
    
    // Carregar dados por status
    const statusData = await window.dataLoader?.load('/api/esic/count-by?field=status', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    // Validar dados recebidos
    if (!Array.isArray(statusData) || statusData.length === 0) {
      if (window.Logger) {
        window.Logger.warn('📈 loadEsicStatus: Dados não são um array válido', statusData);
      }
      return;
    }
    
    // Ordenar por quantidade (maior primeiro)
    const sortedData = [...statusData].sort((a, b) => (b.count || 0) - (a.count || 0));
    const labels = sortedData.map(d => d.key || d._id || 'N/A');
    const values = sortedData.map(d => d.count || 0);
    
    // Criar gráfico principal (barras)
    await window.chartFactory?.createBarChart('esic-chart-status-detail', labels, values, {
      horizontal: false,
      colorIndex: 0,
      onClick: false,
    });
    
    // Renderizar ranking de status
    renderStatusRanking(sortedData);
    
    // Carregar estatísticas adicionais
    const stats = await window.dataLoader?.load('/api/esic/stats', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || {};
    
    renderStatusStats(stats, sortedData);
    
    if (window.Logger) {
      window.Logger.success('📈 loadEsicStatus: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Status e-SIC:', error);
    }
  }
}

/**
 * Renderizar ranking de status
 */
function renderStatusRanking(data) {
  const rankEl = document.getElementById('esic-status-ranking');
  if (!rankEl) return;
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  
  rankEl.innerHTML = data.map((item, idx) => {
    const status = item.key || item._id || 'N/A';
    const count = item.count || 0;
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    
    // Cores por status
    const statusColors = {
      'ENCERRADO': '#10b981',
      'FECHADO': '#059669',
      'EM ANDAMENTO': '#f59e0b',
      'ABERTO': '#3b82f6',
      'NOVO': '#a78bfa',
      'CANCELADO': '#ef4444'
    };
    
    const color = statusColors[status] || '#94a3b8';
    
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <span class="text-xs text-slate-400 w-6">${idx + 1}.</span>
          <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${color}"></div>
          <span class="text-sm text-slate-300 truncate" title="${status}">${status}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-sm font-bold" style="color: ${color}">${count.toLocaleString('pt-BR')}</div>
            <div class="text-xs text-slate-500">${percent}%</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renderizar estatísticas adicionais
 */
function renderStatusStats(stats, statusData) {
  const statsEl = document.getElementById('esic-status-stats');
  if (!statsEl) return;
  
  const total = stats.total || statusData.reduce((sum, item) => sum + (item.count || 0), 0);
  const encerrados = stats.encerrados || statusData.find(s => 
    s.key === 'ENCERRADO' || s.key === 'FECHADO' || 
    s._id === 'ENCERRADO' || s._id === 'FECHADO'
  )?.count || 0;
  const emAberto = stats.emAberto || statusData.find(s => 
    s.key === 'ABERTO' || s.key === 'EM ANDAMENTO' || s.key === 'NOVO' ||
    s._id === 'ABERTO' || s._id === 'EM ANDAMENTO' || s._id === 'NOVO'
  )?.count || 0;
  const taxaResolucao = total > 0 ? ((encerrados / total) * 100).toFixed(1) : 0;
  
  statsEl.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Total</div>
        <div class="text-2xl font-bold text-cyan-300">${total.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Encerradas</div>
        <div class="text-2xl font-bold text-emerald-300">${encerrados.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Em Aberto</div>
        <div class="text-2xl font-bold text-amber-300">${emAberto.toLocaleString('pt-BR')}</div>
      </div>
      <div class="glass rounded-lg p-4">
        <div class="text-xs text-slate-400 mb-1">Taxa Resolução</div>
        <div class="text-2xl font-bold text-violet-300">${taxaResolucao}%</div>
      </div>
    </div>
  `;
}

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-esic-status', loadEsicStatus, 500);
}

window.loadEsicStatus = loadEsicStatus;
