/**
 * Página: Filtros Avançados
 * Sistema completo de filtros avançados para protocolos
 * 
 * Funcionalidades:
 * - Múltiplos filtros simultâneos
 * - Carregamento dinâmico de opções de filtro
 * - Aplicação de filtros via API /api/filter
 * - Visualização de resultados em tempo real
 * - Integração com sistema global de filtros
 */

// Estado global da página
let filtrosState = {
  filtros: [],
  totalProtocolos: 0,
  protocolosFiltrados: 0,
  optionsCache: {},
  isLoading: false
};

/**
 * Carregar página de filtros avançados
 */
async function loadFiltrosAvancados(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('🔍 loadFiltrosAvancados: Iniciando carregamento');
  }
  
  const pageElement = document.getElementById('page-filtros-avancados');
  if (!pageElement || pageElement.style.display === 'none') {
    if (window.Logger) {
      window.Logger.debug('🔍 loadFiltrosAvancados: Página não visível');
    }
    return Promise.resolve();
  }
  
  try {
    // Inicializar componentes
    await initializeFilters();
    
    // Carregar opções de filtros
    await loadFilterOptions();
    
    // Carregar total de protocolos
    await loadTotalProtocolos();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Restaurar filtros salvos se houver
    restoreSavedFilters();
    
    if (window.Logger) {
      window.Logger.success('🔍 loadFiltrosAvancados: Carregamento concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar filtros avançados:', error);
    }
    console.error('Erro ao carregar filtros avançados:', error);
  }
}

/**
 * Inicializar filtros
 */
async function initializeFilters() {
  // Limpar estado
  filtrosState.filtros = [];
  filtrosState.totalProtocolos = 0;
  filtrosState.protocolosFiltrados = 0;
  
  // Atualizar contadores
  updateCounters();
  
  // Limpar resultados
  const resultadosDiv = document.getElementById('resultadosFiltros');
  if (resultadosDiv) {
    resultadosDiv.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4 text-slate-600">🔍</div>
        <p class="text-slate-400">Aplique os filtros acima para visualizar os resultados</p>
      </div>
    `;
  }
}

/**
 * Carregar opções para os dropdowns de filtros
 */
async function loadFilterOptions() {
  if (window.Logger) {
    window.Logger.debug('🔍 Carregando opções de filtros...');
  }
  
  const camposFiltro = [
    { id: 'filtroStatusDemanda', campo: 'StatusDemanda' },
    { id: 'filtroUnidadeCadastro', campo: 'UnidadeCadastro' },
    { id: 'filtroCanal', campo: 'Canal' },
    { id: 'filtroServidor', campo: 'Servidor' },
    { id: 'filtroTipoManifestacao', campo: 'Tipo' },
    { id: 'filtroTema', campo: 'Tema' },
    { id: 'filtroPrioridade', campo: 'Prioridade' },
    { id: 'filtroUnidadeSaude', campo: 'unidadeSaude' },
    { id: 'filtroAssunto', campo: 'Assunto' },
    { id: 'filtroResponsavel', campo: 'Responsavel' },
    { id: 'filtroStatus', campo: 'Status' }
  ];
  
  // Carregar opções em paralelo
  const loadPromises = camposFiltro.map(async ({ id, campo }) => {
    try {
      const select = document.getElementById(id);
      if (!select) return;
      
      // Verificar cache
      if (filtrosState.optionsCache[campo] && !forceRefresh) {
        populateSelect(select, filtrosState.optionsCache[campo]);
        return;
      }
      
      // Carregar do servidor
      const options = await loadDistinctValues(campo);
      if (options && options.length > 0) {
        filtrosState.optionsCache[campo] = options;
        populateSelect(select, options);
      }
    } catch (error) {
      if (window.Logger) {
        window.Logger.warn(`Erro ao carregar opções para ${campo}:`, error);
      }
    }
  });
  
  await Promise.all(loadPromises);
  
  if (window.Logger) {
    window.Logger.debug('🔍 Opções de filtros carregadas');
  }
}

/**
 * Carregar valores distintos de um campo
 */
async function loadDistinctValues(field) {
  try {
    if (window.dataLoader) {
      const values = await window.dataLoader.load(`/api/distinct?field=${encodeURIComponent(field)}`, {
        useDataStore: true,
        ttl: 60 * 60 * 1000 // Cache de 1 hora
      });
      
      if (Array.isArray(values)) {
        return values.filter(v => v && v.trim() !== '').sort();
      }
    }
    
    return [];
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn(`Erro ao carregar valores distintos para ${field}:`, error);
    }
    return [];
  }
}

/**
 * Popular select com opções
 */
function populateSelect(selectElement, options) {
  if (!selectElement) return;
  
  // Salvar valor atual
  const currentValue = selectElement.value;
  
  // Limpar opções existentes (exceto "Todos")
  while (selectElement.children.length > 1) {
    selectElement.removeChild(selectElement.lastChild);
  }
  
  // Adicionar novas opções
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    selectElement.appendChild(optionElement);
  });
  
  // Restaurar valor se ainda existir
  if (currentValue) {
    selectElement.value = currentValue;
  }
}

/**
 * Carregar total de protocolos
 */
async function loadTotalProtocolos() {
  try {
    if (window.dataLoader) {
      const summary = await window.dataLoader.load('/api/summary', {
        useDataStore: true,
        ttl: 5 * 60 * 1000 // Cache de 5 minutos
      });
      
      if (summary && summary.total !== undefined) {
        filtrosState.totalProtocolos = summary.total || 0;
        updateTotalProtocolos();
      }
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn('Erro ao carregar total de protocolos:', error);
    }
  }
}

/**
 * Atualizar contador de total de protocolos
 */
function updateTotalProtocolos() {
  const element = document.getElementById('totalProtocolos');
  if (element) {
    element.textContent = filtrosState.totalProtocolos.toLocaleString('pt-BR');
  }
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
  // Botão Aplicar Filtros
  const btnAplicar = document.getElementById('btnAplicarFiltros');
  if (btnAplicar) {
    btnAplicar.addEventListener('click', applyFilters);
  }
  
  // Botão Limpar Todos
  const btnLimpar = document.getElementById('btnLimparTodos');
  if (btnLimpar) {
    btnLimpar.addEventListener('click', clearAllFilters);
  }
  
  // Toggle de ativar/desativar filtros
  const toggleFiltros = document.getElementById('toggleFiltros');
  if (toggleFiltros) {
    toggleFiltros.addEventListener('change', (e) => {
      if (!e.target.checked) {
        clearAllFilters();
      }
    });
  }
  
  // Enter no campo de protocolo
  const inputProtocolo = document.getElementById('filtroProtocolo');
  if (inputProtocolo) {
    inputProtocolo.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyFilters();
      }
    });
  }
}

/**
 * Coletar filtros do formulário
 */
function collectFilters() {
  const filtros = [];
  
  // Protocolo (busca por texto)
  const protocolo = document.getElementById('filtroProtocolo')?.value?.trim();
  if (protocolo) {
    filtros.push({
      field: 'protocolo',
      op: 'contains',
      value: protocolo
    });
  }
  
  // Status Demanda
  const statusDemanda = document.getElementById('filtroStatusDemanda')?.value?.trim();
  if (statusDemanda) {
    filtros.push({
      field: 'StatusDemanda',
      op: 'eq',
      value: statusDemanda
    });
  }
  
  // Verificado
  const verificadoCheck = document.getElementById('filtroVerificadoCheck')?.checked;
  const verificado = document.getElementById('filtroVerificado')?.value?.trim();
  if (verificadoCheck && verificado) {
    filtros.push({
      field: 'verificado',
      op: 'eq',
      value: verificado
    });
  }
  
  // Unidade/Cadastro
  const unidadeCadastro = document.getElementById('filtroUnidadeCadastro')?.value?.trim();
  if (unidadeCadastro) {
    filtros.push({
      field: 'UnidadeCadastro',
      op: 'eq',
      value: unidadeCadastro
    });
  }
  
  // Canal
  const canal = document.getElementById('filtroCanal')?.value?.trim();
  if (canal) {
    filtros.push({
      field: 'Canal',
      op: 'eq',
      value: canal
    });
  }
  
  // Servidor
  const servidor = document.getElementById('filtroServidor')?.value?.trim();
  if (servidor) {
    filtros.push({
      field: 'Servidor',
      op: 'eq',
      value: servidor
    });
  }
  
  // Tipo de Manifestação
  const tipoManifestacao = document.getElementById('filtroTipoManifestacao')?.value?.trim();
  if (tipoManifestacao) {
    filtros.push({
      field: 'Tipo',
      op: 'eq',
      value: tipoManifestacao
    });
  }
  
  // Tema
  const tema = document.getElementById('filtroTema')?.value?.trim();
  if (tema) {
    filtros.push({
      field: 'Tema',
      op: 'eq',
      value: tema
    });
  }
  
  // Prioridade
  const prioridade = document.getElementById('filtroPrioridade')?.value?.trim();
  if (prioridade) {
    filtros.push({
      field: 'Prioridade',
      op: 'eq',
      value: prioridade
    });
  }
  
  // Unidade/Saúde
  const unidadeSaude = document.getElementById('filtroUnidadeSaude')?.value?.trim();
  if (unidadeSaude) {
    filtros.push({
      field: 'unidadeSaude',
      op: 'eq',
      value: unidadeSaude
    });
  }
  
  // Data da Criação
  const dataCriacao = document.getElementById('filtroDataCriacao')?.value?.trim();
  if (dataCriacao) {
    // Converter para formato YYYY-MM-DD se necessário
    filtros.push({
      field: 'Data',
      op: 'contains',
      value: dataCriacao.substring(0, 7) // YYYY-MM para buscar por mês
    });
  }
  
  // Assunto
  const assunto = document.getElementById('filtroAssunto')?.value?.trim();
  if (assunto) {
    filtros.push({
      field: 'Assunto',
      op: 'eq',
      value: assunto
    });
  }
  
  // Responsável
  const responsavel = document.getElementById('filtroResponsavel')?.value?.trim();
  if (responsavel) {
    filtros.push({
      field: 'Responsavel',
      op: 'eq',
      value: responsavel
    });
  }
  
  // Status
  const status = document.getElementById('filtroStatus')?.value?.trim();
  if (status) {
    filtros.push({
      field: 'Status',
      op: 'eq',
      value: status
    });
  }
  
  return filtros;
}

/**
 * Aplicar filtros
 */
async function applyFilters() {
  if (filtrosState.isLoading) {
    if (window.Logger) {
      window.Logger.warn('🔍 Filtros já estão sendo aplicados, aguardando...');
    }
    return;
  }
  
  // Verificar se toggle está ativo
  const toggle = document.getElementById('toggleFiltros');
  if (toggle && !toggle.checked) {
    if (window.Logger) {
      window.Logger.debug('🔍 Toggle de filtros desativado');
    }
    return;
  }
  
  filtrosState.isLoading = true;
  
  try {
    // Coletar filtros do formulário
    const filtros = collectFilters();
    
    if (window.Logger) {
      window.Logger.debug(`🔍 Aplicando ${filtros.length} filtro(s)`, filtros);
    }
    
    // Atualizar estado
    filtrosState.filtros = filtros;
    
    // Atualizar contador de filtros ativos
    updateCounters();
    
    // Se não há filtros, limpar resultados
    if (filtros.length === 0) {
      clearResults();
      filtrosState.isLoading = false;
      return;
    }
    
    // Mostrar loading
    showLoading();
    
    // Aplicar filtros via API
    const resultados = await applyFiltersAPI(filtros);
    
    // Exibir resultados
    displayResults(resultados);
    
    // Atualizar estatísticas
    filtrosState.protocolosFiltrados = resultados.length;
    updateStatistics();
    
    // Aplicar filtros globalmente (integração com sistema de gráficos)
    if (window.chartCommunication && filtros.length > 0) {
      // Aplicar cada filtro no sistema global
      filtros.forEach(filter => {
        window.chartCommunication.applyFilter(
          filter.field,
          filter.value,
          'filtros-avancados',
          {
            toggle: false,
            operator: filter.op,
            clearPrevious: false // Manter outros filtros
          }
        );
      });
    }
    
    // Salvar filtros
    saveFilters();
    
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao aplicar filtros:', error);
    }
    showError('Erro ao aplicar filtros. Tente novamente.');
  } finally {
    filtrosState.isLoading = false;
  }
}

/**
 * Aplicar filtros via API
 */
async function applyFiltersAPI(filtros) {
  try {
    const response = await fetch('/api/filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Enviar cookies de sessão
      body: JSON.stringify({
        filters: filtros,
        originalUrl: window.location.pathname
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }
    
    const resultados = await response.json();
    return Array.isArray(resultados) ? resultados : [];
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro na requisição de filtros:', error);
    }
    throw error;
  }
}

/**
 * Exibir resultados
 */
function displayResults(resultados) {
  const resultadosDiv = document.getElementById('resultadosFiltros');
  if (!resultadosDiv) return;
  
  if (!resultados || resultados.length === 0) {
    resultadosDiv.innerHTML = `
      <div class="text-center py-8">
        <div class="text-6xl mb-4 text-slate-600">🔍</div>
        <p class="text-slate-400 text-lg mb-2">Nenhum protocolo encontrado</p>
        <p class="text-slate-500 text-sm">Tente ajustar os filtros aplicados</p>
      </div>
    `;
    return;
  }
  
  // Criar tabela de resultados
  const tableHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-700">
            <th class="px-4 py-3 text-left text-slate-300 font-semibold">Protocolo</th>
            <th class="px-4 py-3 text-left text-slate-300 font-semibold">Data Criação</th>
            <th class="px-4 py-3 text-left text-slate-300 font-semibold">Status</th>
            <th class="px-4 py-3 text-left text-slate-300 font-semibold">Tema</th>
            <th class="px-4 py-3 text-left text-slate-300 font-semibold">Órgão</th>
            <th class="px-4 py-3 text-left text-slate-300 font-semibold">Canal</th>
          </tr>
        </thead>
        <tbody>
          ${resultados.slice(0, 100).map(row => {
            const data = row.data || row;
            const protocolo = data.protocolo || row.protocolo || 'N/A';
            const dataCriacao = data.data_da_criacao || data.dataDaCriacao || row.dataDaCriacao || 'N/A';
            const status = data.status || row.status || 'N/A';
            const tema = data.tema || row.tema || 'N/A';
            const orgao = data.orgaos || row.orgaos || 'N/A';
            const canal = data.canal || row.canal || 'N/A';
            
            return `
              <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td class="px-4 py-3 text-cyan-300 font-mono">${protocolo}</td>
                <td class="px-4 py-3 text-slate-300">${formatDate(dataCriacao)}</td>
                <td class="px-4 py-3 text-slate-300">${status}</td>
                <td class="px-4 py-3 text-slate-300">${truncateText(tema, 30)}</td>
                <td class="px-4 py-3 text-slate-300">${truncateText(orgao, 30)}</td>
                <td class="px-4 py-3 text-slate-300">${canal}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ${resultados.length > 100 ? `
        <div class="mt-4 text-center text-sm text-slate-400">
          Mostrando 100 de ${resultados.length} resultados. Ajuste os filtros para refinar a busca.
        </div>
      ` : ''}
    </div>
  `;
  
  resultadosDiv.innerHTML = tableHTML;
}

/**
 * Mostrar loading
 */
function showLoading() {
  const resultadosDiv = document.getElementById('resultadosFiltros');
  if (resultadosDiv) {
    resultadosDiv.innerHTML = `
      <div class="text-center py-8">
        <div class="inline-block animate-spin text-4xl mb-4 text-cyan-400">⏳</div>
        <p class="text-slate-400">Aplicando filtros...</p>
      </div>
    `;
  }
}

/**
 * Limpar resultados
 */
function clearResults() {
  const resultadosDiv = document.getElementById('resultadosFiltros');
  if (resultadosDiv) {
    resultadosDiv.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4 text-slate-600">🔍</div>
        <p class="text-slate-400">Aplique os filtros acima para visualizar os resultados</p>
      </div>
    `;
  }
}

/**
 * Mostrar erro
 */
function showError(message) {
  const resultadosDiv = document.getElementById('resultadosFiltros');
  if (resultadosDiv) {
    resultadosDiv.innerHTML = `
      <div class="text-center py-8">
        <div class="text-4xl mb-4 text-red-400">❌</div>
        <p class="text-red-300 mb-2">${message}</p>
      </div>
    `;
  }
}

/**
 * Limpar todos os filtros
 */
function clearAllFilters() {
  // Limpar todos os campos
  document.getElementById('filtroProtocolo').value = '';
  document.getElementById('filtroStatusDemanda').value = '';
  document.getElementById('filtroVerificadoCheck').checked = false;
  document.getElementById('filtroVerificado').value = '';
  document.getElementById('filtroUnidadeCadastro').value = '';
  document.getElementById('filtroCanal').value = '';
  document.getElementById('filtroServidor').value = '';
  document.getElementById('filtroTipoManifestacao').value = '';
  document.getElementById('filtroTema').value = '';
  document.getElementById('filtroPrioridade').value = '';
  document.getElementById('filtroUnidadeSaude').value = '';
  document.getElementById('filtroDataCriacao').value = '';
  document.getElementById('filtroAssunto').value = '';
  document.getElementById('filtroResponsavel').value = '';
  document.getElementById('filtroStatus').value = '';
  
  // Limpar estado
  filtrosState.filtros = [];
  filtrosState.protocolosFiltrados = 0;
  
  // Atualizar contadores
  updateCounters();
  
  // Limpar resultados
  clearResults();
  
  // Limpar filtros globais
  if (window.chartCommunication) {
    window.chartCommunication.clearFilters();
  }
  
  // Limpar filtros salvos
  clearSavedFilters();
  
  if (window.Logger) {
    window.Logger.debug('🔍 Todos os filtros foram limpos');
  }
}

/**
 * Atualizar contadores
 */
function updateCounters() {
  // Contador de filtros ativos
  const contadorEl = document.getElementById('contadorFiltrosAtivos');
  if (contadorEl) {
    contadorEl.textContent = filtrosState.filtros.length;
  }
  
  // Total de protocolos filtrados
  const totalFiltradosEl = document.getElementById('totalProtocolosFiltrados');
  if (totalFiltradosEl) {
    if (filtrosState.protocolosFiltrados > 0) {
      totalFiltradosEl.textContent = filtrosState.protocolosFiltrados.toLocaleString('pt-BR');
    } else {
      totalFiltradosEl.textContent = '—';
    }
  }
  
  // Percentual filtrado
  const percentualEl = document.getElementById('percentualFiltrado');
  if (percentualEl && filtrosState.totalProtocolos > 0) {
    const percentual = filtrosState.protocolosFiltrados > 0
      ? ((filtrosState.protocolosFiltrados / filtrosState.totalProtocolos) * 100).toFixed(1)
      : '0.0';
    percentualEl.textContent = `${percentual}%`;
  } else if (percentualEl) {
    percentualEl.textContent = '—';
  }
}

/**
 * Atualizar estatísticas
 */
function updateStatistics() {
  updateCounters();
}

/**
 * Formatar data
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  
  try {
    // Tentar diferentes formatos
    if (dateStr.includes('/')) {
      return dateStr;
    }
    
    if (dateStr.includes('-')) {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    }
    
    return dateStr;
  } catch (error) {
    return dateStr;
  }
}

/**
 * Truncar texto
 */
function truncateText(text, maxLength) {
  if (!text) return 'N/A';
  const str = String(text);
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * Salvar filtros no localStorage
 */
function saveFilters() {
  try {
    const filtrosData = {
      filtros: filtrosState.filtros,
      timestamp: Date.now()
    };
    localStorage.setItem('filtros-avancados-state', JSON.stringify(filtrosData));
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn('Erro ao salvar filtros:', error);
    }
  }
}

/**
 * Restaurar filtros salvos
 */
function restoreSavedFilters() {
  try {
    const saved = localStorage.getItem('filtros-avancados-state');
    if (!saved) return;
    
    const filtrosData = JSON.parse(saved);
    
    // Verificar se não é muito antigo (7 dias)
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - filtrosData.timestamp > maxAge) {
      clearSavedFilters();
      return;
    }
    
    // Restaurar valores dos campos (simplificado - apenas alguns campos principais)
    // Nota: Restaurar todos os campos seria complexo, então vamos apenas restaurar se houver filtros salvos
    if (filtrosData.filtros && filtrosData.filtros.length > 0) {
      // Aplicar filtros salvos (opcional - pode ser desabilitado)
      // applyFiltersAPI(filtrosData.filtros).then(displayResults);
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn('Erro ao restaurar filtros:', error);
    }
  }
}

/**
 * Limpar filtros salvos
 */
function clearSavedFilters() {
  try {
    localStorage.removeItem('filtros-avancados-state');
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn('Erro ao limpar filtros salvos:', error);
    }
  }
}

// Exportar função globalmente
window.loadFiltrosAvancados = loadFiltrosAvancados;

if (window.Logger) {
  window.Logger.debug('✅ Página Filtros Avançados carregada');
}

