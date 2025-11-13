/**
 * Módulo: Tabelas
 * Funções relacionadas a carregamento e renderização de tabelas
 * Extraído de data.js para melhor organização
 */

// Variáveis globais para estado da tabela
let currentTableData = [];
let currentTableHeaders = [];

/**
 * Carregar tabela de registros
 */
async function loadTable(limit = 50) {
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    const pageSize = limit === 'all' ? 10000 : parseInt(limit) || 50;
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load(`/api/records?page=1&pageSize=${pageSize}`, { 
      fallback: { rows: [], total: 0 } 
    }) || { rows: [], total: 0 };
    
    const rows = data.rows || [];
    currentTableData = rows;
    
    const tbody = document.getElementById('tbody');
    const thead = document.getElementById('thead');
    const tableInfo = document.getElementById('tableInfo');
    
    if (!tbody || !thead) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Elementos da tabela não encontrados (pode não estar na página atual)');
      } else {
        console.warn('⚠️ Elementos da tabela não encontrados (pode não estar na página atual)');
      }
      return;
    }
    
    tbody.innerHTML = '';
    thead.innerHTML = '';
      
    if (rows.length === 0) {
      if (tableInfo) tableInfo.textContent = 'Nenhum registro encontrado';
      return;
    }
      
    const first = rows[0].data || {};
    const keys = Object.keys(first);
    currentTableHeaders = keys;
      
    // Ordenar colunas por importância
    const priorityOrder = [
      'protocolo', 
      'data_da_criacao', 
      'status_demanda', 
      'tipo_de_manifestacao', 
      'tema', 
      'assunto', 
      'orgaos', 
      'unidade_cadastro', 
      'responsavel', 
      'canal', 
      'prioridade', 
      'status'
    ];
    const sortedKeys = [
      ...priorityOrder.filter(k => keys.includes(k)), 
      ...keys.filter(k => !priorityOrder.includes(k))
    ];
      
    // Criar cabeçalho
    for (const k of sortedKeys) {
      const th = document.createElement('th'); 
      th.textContent = k; 
      th.className = 'px-3 py-2 text-left font-semibold text-slate-300 sticky top-0 bg-slate-900/95'; 
      thead.appendChild(th);
    }
      
    // Criar linhas
    for (const r of rows) {
      const tr = document.createElement('tr'); 
      tr.className = 'hover:bg-white/5 transition-colors duration-100';
      for (const k of sortedKeys) {
        const td = document.createElement('td'); 
        const value = r.data?.[k] ?? '';
        td.textContent = value; 
        td.className = 'px-3 py-2 text-slate-300'; 
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
      
    if (tableInfo) {
      tableInfo.textContent = `Mostrando ${rows.length} de ${data.total || rows.length} registros`;
    }
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar tabela:', error);
    } else {
      console.error('❌ Erro ao carregar tabela:', error);
    }
    const tableInfo = document.getElementById('tableInfo');
    if (tableInfo) {
      tableInfo.textContent = 'Erro ao carregar dados';
    }
    const tbody = document.getElementById('tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="100%" class="text-center text-red-400 py-4">Erro ao carregar dados da tabela</td></tr>';
    }
  }
}

/**
 * Obter dados atuais da tabela
 */
function getCurrentTableData() {
  return currentTableData;
}

/**
 * Obter cabeçalhos atuais da tabela
 */
function getCurrentTableHeaders() {
  return currentTableHeaders;
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  
  window.data.loadTable = loadTable;
  window.data.getCurrentTableData = getCurrentTableData;
  window.data.getCurrentTableHeaders = getCurrentTableHeaders;
  
  // Exportar variáveis globais para compatibilidade
  window.data.currentTableData = currentTableData;
  window.data.currentTableHeaders = currentTableHeaders;
  
  // Exportar também como variáveis globais para compatibilidade
  window.loadTable = loadTable;
  window.getCurrentTableData = getCurrentTableData;
  window.getCurrentTableHeaders = getCurrentTableHeaders;
  
  // Permitir acesso direto às variáveis (com getters)
  Object.defineProperty(window.data, 'currentTableData', {
    get: () => currentTableData,
    set: (val) => { currentTableData = val; }
  });
  
  Object.defineProperty(window.data, 'currentTableHeaders', {
    get: () => currentTableHeaders,
    set: (val) => { currentTableHeaders = val; }
  });
}

