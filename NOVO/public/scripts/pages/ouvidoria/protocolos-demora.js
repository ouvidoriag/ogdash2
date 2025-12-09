/**
 * Página: Protocolos com Maior Demora
 * Top 10 protocolos com maior tempo de demora
 * 
 * Mostra protocolos com:
 * - Protocolo
 * - Tempo de Demora (dias)
 * - Data de Criação
 * - Data de Conclusão (se concluído)
 * - Status
 * - Tema
 * - Assunto
 * - Órgãos
 * - Responsável
 */

/**
 * Carregar dados de protocolos com maior demora
 */
async function loadProtocolosDemora(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('⏳ loadProtocolosDemora: Iniciando');
  }
  
  const page = document.getElementById('page-protocolos-demora');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Carregar dados do endpoint
    const data = await window.dataLoader?.load('/api/aggregate/top-protocolos-demora?limit=10', {
      useDataStore: true,
      ttl: 5 * 60 * 1000, // 5 minutos
      forceRefresh: forceRefresh
    }) || { total: 0, protocolos: [] };
    
    if (window.Logger) {
      window.Logger.debug('⏳ loadProtocolosDemora: Dados carregados', { total: data.total });
    }
    
    // Atualizar KPIs
    updateKPIs(data.protocolos);
    
    // Renderizar tabela
    renderTable(data.protocolos);
    
    if (window.Logger) {
      window.Logger.success('⏳ loadProtocolosDemora: Concluído');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar protocolos com maior demora:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar protocolos com maior demora:', error);
    }
    
    const tableContainer = document.getElementById('tableProtocolosDemora');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="text-center py-12 text-red-400">
          <div class="text-4xl mb-4">❌</div>
          <div class="text-lg font-semibold mb-2">Erro ao carregar dados</div>
          <div class="text-sm text-slate-400">${error.message || 'Erro desconhecido'}</div>
        </div>
      `;
    }
  }
}

/**
 * Atualizar KPIs
 */
function updateKPIs(protocolos) {
  if (!protocolos || protocolos.length === 0) {
    document.getElementById('kpiTotalDemora').textContent = '0';
    document.getElementById('kpiMaiorDemora').textContent = '0';
    document.getElementById('kpiMediaDemora').textContent = '0';
    document.getElementById('kpiNaoConcluidos').textContent = '0';
    return;
  }
  
  const total = protocolos.length;
  const maiorDemora = protocolos[0]?.tempoDemoraDias || 0;
  const mediaDemora = Math.round(
    protocolos.reduce((sum, p) => sum + (p.tempoDemoraDias || 0), 0) / total
  );
  const naoConcluidos = protocolos.filter(p => !p.concluido).length;
  
  document.getElementById('kpiTotalDemora').textContent = total.toLocaleString('pt-BR');
  document.getElementById('kpiMaiorDemora').textContent = maiorDemora.toLocaleString('pt-BR');
  document.getElementById('kpiMediaDemora').textContent = mediaDemora.toLocaleString('pt-BR');
  document.getElementById('kpiNaoConcluidos').textContent = naoConcluidos.toLocaleString('pt-BR');
}

/**
 * Renderizar tabela de protocolos
 */
function renderTable(protocolos) {
  const tableContainer = document.getElementById('tableProtocolosDemora');
  if (!tableContainer) return;
  
  if (!protocolos || protocolos.length === 0) {
    tableContainer.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <div class="text-4xl mb-4">✅</div>
        <div class="text-lg font-semibold mb-2">Nenhum protocolo encontrado</div>
        <div class="text-sm">Não há protocolos com tempo de demora registrado no momento.</div>
      </div>
    `;
    return;
  }
  
  // Criar tabela
  let html = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-700">
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Protocolo</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tempo de Demora</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Criação</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Conclusão</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tema</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assunto</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Órgãos</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Responsável</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
  `;
  
  protocolos.forEach((protocolo, index) => {
    const tempoDemora = protocolo.tempoDemoraDias || 0;
    const concluido = protocolo.concluido || false;
    
    // Cor baseada no tempo de demora
    let corTempo = 'text-slate-300';
    if (tempoDemora > 180) corTempo = 'text-red-400';
    else if (tempoDemora > 90) corTempo = 'text-orange-400';
    else if (tempoDemora > 60) corTempo = 'text-yellow-400';
    else if (tempoDemora > 30) corTempo = 'text-amber-400';
    
    // Badge de status
    let statusBadge = '';
    if (concluido) {
      statusBadge = '<span class="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">Concluído</span>';
    } else {
      statusBadge = '<span class="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">Em Andamento</span>';
    }
    
    // Formatar data
    const formatarData = (dataStr) => {
      if (!dataStr || dataStr === 'N/A') return '—';
      if (dataStr.includes('/')) return dataStr;
      // YYYY-MM-DD para DD/MM/YYYY
      const parts = dataStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dataStr;
    };
    
    html += `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="py-3 px-4 text-sm text-slate-400">${index + 1}</td>
        <td class="py-3 px-4">
          <div class="font-semibold text-cyan-300">${protocolo.protocolo || 'N/A'}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold ${corTempo} text-lg">${tempoDemora.toLocaleString('pt-BR')}</div>
          <div class="text-xs text-slate-500">dias</div>
        </td>
        <td class="py-3 px-4 text-sm text-slate-300">${formatarData(protocolo.dataCriacao)}</td>
        <td class="py-3 px-4 text-sm text-slate-300">${protocolo.dataConclusao ? formatarData(protocolo.dataConclusao) : '—'}</td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-sm text-slate-300">${protocolo.tema || 'N/A'}</td>
        <td class="py-3 px-4 text-sm text-slate-300">${protocolo.assunto || 'N/A'}</td>
        <td class="py-3 px-4 text-sm text-slate-300">${protocolo.orgaos || 'N/A'}</td>
        <td class="py-3 px-4 text-sm text-slate-300">${protocolo.responsavel || 'N/A'}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  tableContainer.innerHTML = html;
}

/**
 * Inicializar listeners de filtro para a página Protocolos Demora
 * Escuta eventos do sistema de comunicação de gráficos para recarregar dados
 */
function initProtocolosDemoraFilterListeners() {
  if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
    window.chartCommunication.createPageFilterListener('page-protocolos-demora', loadProtocolosDemora, 500);
    if (window.Logger) {
      window.Logger.success('✅ Listeners de filtro para Protocolos Demora inicializados');
    }
  }
}

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProtocolosDemoraFilterListeners);
} else {
  initProtocolosDemoraFilterListeners();
}

// Exportar função globalmente
window.loadProtocolosDemora = loadProtocolosDemora;

