/**
 * Página: Vencimento
 * Protocolos próximos de vencer ou já vencidos
 * 
 * Mostra protocolos com:
 * - Protocolo
 * - Setor
 * - Informações (o que é)
 * - Secretaria
 * - Data de vencimento
 * - Dias restantes
 * 
 * Filtros disponíveis:
 * - Vencidos
 * - 3 dias, 7 dias, 15 dias, 30 dias
 * - Prazo customizado
 * - Filtro por secretaria
 */

let filtroAtual = 'vencidos';
let secretariaFiltro = null;
let protocolosCompletos = [];
let protocolosExibidos = [];
let itensPorPagina = 100;
let paginaAtual = 0;

/**
 * Carregar dados de vencimento
 */
async function loadVencimento(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('⏰ loadVencimento: Iniciando');
  }
  
  const page = document.getElementById('page-vencimento');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Garantir que o dropdown está populado ANTES de obter os valores
    const selectSecretaria = document.getElementById('selectSecretariaVencimento');
    if (selectSecretaria && selectSecretaria.options.length <= 1) {
      await popularDropdownSecretarias();
    }
    
    // Obter filtros selecionados APÓS popular os dropdowns
    const selectFiltro = document.getElementById('selectFiltroVencimento');
    const selectSecretariaEl = document.getElementById('selectSecretariaVencimento');
    
    const filtro = selectFiltro?.value || 'vencidos';
    const secretaria = selectSecretariaEl?.value || '';
    
    filtroAtual = filtro;
    secretariaFiltro = (secretaria && secretaria.trim() !== '' && secretaria !== 'Todas as secretarias') ? secretaria.trim() : null;
    
    // Construir URL da API
    let url = `/api/vencimento?filtro=${encodeURIComponent(filtro)}`;
    if (secretariaFiltro) {
      url += `&secretaria=${encodeURIComponent(secretariaFiltro)}`;
    }
    
    // Debug: log dos valores antes de enviar
    console.log('⏰ Frontend - Valores dos filtros:', {
      filtro,
      secretaria,
      secretariaFiltro,
      url
    });
    
    if (window.Logger) {
      window.Logger.debug(`⏰ Carregando vencimentos: filtro=${filtro}, secretaria=${secretariaFiltro || 'todas'}, url=${url}`);
    }
    
    // Carregar dados (sempre forçar refresh quando há filtro de secretaria)
    const forceRefreshComFiltros = forceRefresh || !!secretariaFiltro;
    const data = await window.dataLoader?.load(url, {
      useDataStore: !forceRefreshComFiltros,
      ttl: 2 * 60 * 1000, // Cache de 2 minutos
      fallback: { total: 0, filtro, protocolos: [] }
    }) || { total: 0, filtro, protocolos: [] };
    
    if (window.Logger) {
      window.Logger.debug(`⏰ Dados recebidos: ${data.total} protocolos`);
    }
    
    // Armazenar todos os protocolos
    protocolosCompletos = data.protocolos || [];
    paginaAtual = 0;
    
    // Renderizar tabela (primeira página)
    renderVencimentoTable();
    
    // Atualizar contador
    updateVencimentoCounter(data);
    
    if (window.Logger) {
      window.Logger.success('⏰ loadVencimento: Concluído');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar vencimentos:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar vencimentos:', error);
    }
    
    // Mostrar mensagem de erro
    const tableContainer = document.getElementById('tableVencimento');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="text-center py-8 text-red-400">
          <div class="text-2xl mb-2">❌</div>
          <div>Erro ao carregar dados de vencimento</div>
          <div class="text-sm text-slate-400 mt-2">${error.message || 'Erro desconhecido'}</div>
        </div>
      `;
    }
  }
}

/**
 * Renderizar tabela de protocolos (com paginação)
 */
function renderVencimentoTable() {
  const tableContainer = document.getElementById('tableVencimento');
  if (!tableContainer) return;
  
  if (protocolosCompletos.length === 0) {
    tableContainer.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <div class="text-4xl mb-4">✅</div>
        <div class="text-lg font-semibold mb-2">Nenhum protocolo encontrado</div>
        <div class="text-sm">Não há protocolos ${getFiltroLabel(filtroAtual)} no momento.</div>
      </div>
    `;
    return;
  }
  
  // Calcular quantos itens mostrar
  const inicio = paginaAtual * itensPorPagina;
  const fim = inicio + itensPorPagina;
  protocolosExibidos = protocolosCompletos.slice(inicio, fim);
  const temMais = fim < protocolosCompletos.length;
  
  // Criar tabela
  let html = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-700">
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Protocolo</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Setor</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">O que é</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Secretaria</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Criação</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vencimento</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Prazo</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dias Restantes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
  `;
  
  protocolosExibidos.forEach((p, idx) => {
    const isVencido = p.diasRestantes < 0;
    const isUrgente = p.diasRestantes >= 0 && p.diasRestantes <= 3;
    const isAtencao = p.diasRestantes > 3 && p.diasRestantes <= 7;
    
    // Cor baseada em dias restantes
    let corDias = 'text-slate-300';
    let bgDias = 'bg-slate-800/30';
    let labelDias = `${p.diasRestantes} dias`;
    
    if (isVencido) {
      corDias = 'text-red-400';
      bgDias = 'bg-red-500/20';
      labelDias = `Vencido há ${Math.abs(p.diasRestantes)} dia${Math.abs(p.diasRestantes) !== 1 ? 's' : ''}`;
    } else if (isUrgente) {
      corDias = 'text-orange-400';
      bgDias = 'bg-orange-500/20';
    } else if (isAtencao) {
      corDias = 'text-yellow-400';
      bgDias = 'bg-yellow-500/20';
    }
    
    // Formatar datas
    const dataCriacaoFormatada = formatarData(p.dataCriacao);
    const dataVencimentoFormatada = formatarData(p.dataVencimento);
    
    html += `
      <tr class="hover:bg-slate-800/50 transition-colors ${isVencido ? 'border-l-2 border-red-500' : ''}">
        <td class="py-3 px-4">
          <div class="font-mono text-sm font-semibold text-cyan-300">${escapeHtml(p.protocolo)}</div>
        </td>
        <td class="py-3 px-4">
          <div class="text-sm text-slate-300">${escapeHtml(p.setor)}</div>
        </td>
        <td class="py-3 px-4">
          <div class="text-sm text-slate-300" title="${escapeHtml(p.oQueE)}">
            ${truncateText(escapeHtml(p.oQueE), 40)}
          </div>
        </td>
        <td class="py-3 px-4">
          <div class="text-sm text-slate-300">${escapeHtml(p.secretaria)}</div>
        </td>
        <td class="py-3 px-4">
          <div class="text-sm text-slate-400">${dataCriacaoFormatada}</div>
        </td>
        <td class="py-3 px-4">
          <div class="text-sm ${isVencido ? 'text-red-400 font-semibold' : 'text-slate-300'}">${dataVencimentoFormatada}</div>
        </td>
        <td class="py-3 px-4">
          <div class="text-xs text-slate-400">${p.prazo} dias</div>
          <div class="text-xs text-slate-500">${p.tipoManifestacao === 'SIC' || p.prazo === 20 ? 'SIC' : 'Ouvidoria'}</div>
        </td>
        <td class="py-3 px-4">
          <div class="inline-flex items-center px-2 py-1 rounded ${bgDias}">
            <span class="text-xs font-semibold ${corDias}">${labelDias}</span>
          </div>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  // Adicionar botão "Carregar mais" se houver mais itens
  if (temMais) {
    html += `
      <div class="mt-6 text-center">
        <button 
          id="btnCarregarMaisVencimento" 
          class="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold text-white hover:scale-105 transition-transform duration-100"
        >
          Carregar Mais (${protocolosCompletos.length - fim} restantes)
        </button>
        <div class="text-sm text-slate-400 mt-2">
          Mostrando ${inicio + 1}-${Math.min(fim, protocolosCompletos.length)} de ${protocolosCompletos.length} protocolos
        </div>
      </div>
    `;
  } else if (protocolosCompletos.length > 0) {
    html += `
      <div class="mt-6 text-center text-sm text-slate-400">
        Mostrando todos os ${protocolosCompletos.length} protocolos
      </div>
    `;
  }
  
  tableContainer.innerHTML = html;
  
  // Adicionar listener ao botão "Carregar mais"
  const btnCarregarMais = document.getElementById('btnCarregarMaisVencimento');
  if (btnCarregarMais) {
    btnCarregarMais.addEventListener('click', () => {
      paginaAtual++;
      renderVencimentoTable();
    });
  }
}

/**
 * Atualizar contador de protocolos
 */
function updateVencimentoCounter(data) {
  const counter = document.getElementById('counterVencimento');
  if (counter) {
    counter.textContent = data.total.toLocaleString('pt-BR');
  }
  
  const filtroLabel = document.getElementById('filtroLabelVencimento');
  if (filtroLabel) {
    filtroLabel.textContent = getFiltroLabel(data.filtro);
  }
}

/**
 * Obter label do filtro
 */
function getFiltroLabel(filtro) {
  const labels = {
    'vencidos': 'vencidos',
    '3': 'vencendo em até 3 dias',
    '7': 'vencendo em até 7 dias',
    '15': 'vencendo em até 15 dias',
    '30': 'vencendo em até 30 dias'
  };
  
  return labels[filtro] || filtro;
}

/**
 * Formatar data para exibição
 */
function formatarData(dataStr) {
  if (!dataStr) return 'N/A';
  
  try {
    const date = new Date(dataStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dataStr;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dataStr;
  }
}

/**
 * Truncar texto
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Escapar HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Popular dropdown de secretarias
 */
async function popularDropdownSecretarias() {
  const selectSecretaria = document.getElementById('selectSecretariaVencimento');
  if (!selectSecretaria) {
    if (window.Logger) {
      window.Logger.warn('selectSecretariaVencimento não encontrado');
    }
    return;
  }
  
  try {
    // Limpar opções existentes (exceto "Todas as secretarias")
    while (selectSecretaria.options.length > 1) {
      selectSecretaria.remove(1);
    }
    
    // Buscar secretarias do banco usando distinct (mais confiável)
    let secretarias = [];
    
    try {
      const dataDistinct = await window.dataLoader?.load('/api/distinct?field=Secretaria', {
        useDataStore: true,
        ttl: 10 * 60 * 1000,
        fallback: []
      }) || [];
      
      // Processar dados do distinct
      secretarias = dataDistinct
        .map(item => {
          const nome = item.key || item._id || item.value || item;
          return typeof nome === 'string' ? nome : String(nome);
        })
        .filter(nome => nome && nome.trim() !== '' && nome !== 'N/A' && nome !== 'null' && nome !== 'undefined');
      
      // Se não encontrou pelo distinct, tentar endpoint de secretarias
      if (secretarias.length === 0) {
        try {
          const data = await window.dataLoader?.load('/api/secretarias', {
            useDataStore: true,
            ttl: 10 * 60 * 1000,
            fallback: { secretarias: [], total: 0 }
          }) || { secretarias: [], total: 0 };
          
          secretarias = (data.secretarias || [])
            .map(s => s.name || s.code || s)
            .filter(nome => nome && nome.trim() !== '' && nome !== 'N/A');
        } catch (error) {
          if (window.Logger) {
            window.Logger.warn('Erro ao buscar secretarias do endpoint:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar secretarias:', error);
      if (window.Logger) {
        window.Logger.error('Erro ao buscar secretarias:', error);
      }
    }
    
    // Remover duplicatas
    secretarias = [...new Set(secretarias)];
    
    // Ordenar secretarias alfabeticamente
    secretarias.sort((a, b) => {
      const nomeA = String(a).toLowerCase().trim();
      const nomeB = String(b).toLowerCase().trim();
      return nomeA.localeCompare(nomeB);
    });
    
    // Adicionar opções ao dropdown
    secretarias.forEach(nome => {
      const option = document.createElement('option');
      option.value = nome;
      option.textContent = nome;
      selectSecretaria.appendChild(option);
    });
    
    if (window.Logger) {
      window.Logger.debug(`✅ Dropdown de secretarias populado com ${secretarias.length} secretarias`);
    }
  } catch (error) {
    console.error('❌ Erro ao popular dropdown de secretarias:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao popular dropdown de secretarias:', error);
    }
  }
}

/**
 * Inicializar listeners
 */
function initVencimentoListeners() {
  const selectFiltro = document.getElementById('selectFiltroVencimento');
  const selectSecretaria = document.getElementById('selectSecretariaVencimento');
  
  // Listener para filtro de prazo
  if (selectFiltro) {
    selectFiltro.addEventListener('change', async (e) => {
      const novoFiltro = e.target.value;
      filtroAtual = novoFiltro;
      
      if (window.Logger) {
        window.Logger.debug(`⏰ Filtro alterado para: ${novoFiltro}`);
      }
      
      await recarregarVencimentos();
    });
  }
  
  // Listener para filtro de secretaria
  if (selectSecretaria) {
    selectSecretaria.addEventListener('change', async (e) => {
      const novaSecretaria = e.target.value || null;
      secretariaFiltro = novaSecretaria;
      
      if (window.Logger) {
        window.Logger.debug(`⏰ Secretaria alterada para: ${novaSecretaria || 'Todas'}`);
      }
      
      await recarregarVencimentos();
    });
  }
  
  // Popular dropdown quando a página for carregada
  setTimeout(() => {
    popularDropdownSecretarias();
  }, 100);
}

/**
 * Recarregar vencimentos
 */
async function recarregarVencimentos() {
  // Mostrar loading
  const tableContainer = document.getElementById('tableVencimento');
  if (tableContainer) {
    tableContainer.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <div class="text-2xl mb-2 animate-spin">⏳</div>
        <div>Carregando protocolos...</div>
      </div>
    `;
  }
  
  // Invalidar cache
  if (window.dataStore) {
    let url = `/api/vencimento?filtro=${encodeURIComponent(filtroAtual)}`;
    if (secretariaFiltro) url += `&secretaria=${encodeURIComponent(secretariaFiltro)}`;
    
    if (typeof window.dataStore.clear === 'function') {
      window.dataStore.clear(url);
    }
  }
  
  // Recarregar dados
  try {
    await loadVencimento(true);
  } catch (error) {
    console.error('❌ Erro ao atualizar vencimentos:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao atualizar vencimentos:', error);
    }
  }
}

// Exportar função globalmente
window.loadVencimento = loadVencimento;

// Inicializar listeners quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initVencimentoListeners();
    }, 500);
  });
} else {
  setTimeout(() => {
    initVencimentoListeners();
  }, 500);
}

if (window.Logger) {
  window.Logger.debug('✅ Página Vencimento carregada');
}
