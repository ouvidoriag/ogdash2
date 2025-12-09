/**
 * Helper para Filtro por Mês
 * Funções reutilizáveis para adicionar filtro por mês em qualquer página
 * 
 * Baseado na implementação da página Tempo Médio
 */

// Tornar funções disponíveis globalmente
window.MonthFilterHelper = window.MonthFilterHelper || {};

/**
 * Coletar filtros de mês a partir de um select
 * @param {string} selectId - ID do elemento select
 * @returns {Array} Array de filtros para aplicar
 */
window.MonthFilterHelper.coletarFiltrosMes = function(selectId) {
  const filtros = [];
  
  const selectMes = document.getElementById(selectId);
  if (!selectMes) return filtros;
  
  const mesFiltro = selectMes.value?.trim() || '';
  if (mesFiltro) {
    // Formato: YYYY-MM
    const [ano, mes] = mesFiltro.split('-');
    if (ano && mes) {
      // Filtrar por data de criação no mês selecionado
      const dataInicial = `${mesFiltro}-01`;
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
      const dataFinal = `${mesFiltro}-${ultimoDia}`;
      
      filtros.push({
        field: 'dataCriacaoIso',
        op: 'gte',
        value: dataInicial
      });
      filtros.push({
        field: 'dataCriacaoIso',
        op: 'lte',
        value: `${dataFinal}T23:59:59.999Z`
      });
    }
  }
  
  return filtros;
};

/**
 * Popular select de meses com dados disponíveis
 * @param {string} selectId - ID do elemento select
 * @param {string} endpoint - Endpoint para buscar dados mensais (deve retornar array com campo month ou ym)
 * @param {string} mesSelecionado - Mês atualmente selecionado (opcional)
 */
window.MonthFilterHelper.popularSelectMeses = async function(selectId, endpoint, mesSelecionado = '') {
  const selectMes = document.getElementById(selectId);
  if (!selectMes) return;
  
  try {
    // Carregar dados mensais para obter meses disponíveis
    const dataMes = await window.dataLoader?.load(endpoint, {
      useDataStore: true,
      ttl: 10 * 60 * 1000,
      fallback: []
    }) || [];
    
    // Limpar opções existentes (exceto "Todos os meses")
    while (selectMes.children.length > 1) {
      selectMes.removeChild(selectMes.lastChild);
    }
    
    // Adicionar meses disponíveis (ordenados do mais recente para o mais antigo)
    const meses = dataMes
      .map(d => d.month || d.ym || d._id)
      .filter(m => m)
      .sort()
      .reverse();
    
    meses.forEach(mes => {
      const option = document.createElement('option');
      option.value = mes;
      
      // Formatar para nome do mês (ex: "Janeiro 2025")
      let nomeMes = mes;
      try {
        if (mes && mes.includes('-')) {
          const [ano, mesNum] = mes.split('-');
          const mesesNomes = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
          ];
          const mesIndex = parseInt(mesNum) - 1;
          if (mesIndex >= 0 && mesIndex < 12) {
            nomeMes = `${mesesNomes[mesIndex]} ${ano}`;
          }
        }
      } catch (e) {
        // Se der erro, usar formatação padrão
        nomeMes = window.dateUtils?.formatMonthYearShort(mes) || mes;
      }
      
      option.textContent = nomeMes;
      selectMes.appendChild(option);
    });
    
    // Restaurar seleção anterior se existir
    if (mesSelecionado) {
      selectMes.value = mesSelecionado;
    }
  } catch (error) {
    console.error('❌ Erro ao popular select de meses:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao popular select de meses:', error);
    }
  }
};

/**
 * Inicializar filtro por mês em uma página
 * @param {Object} config - Configuração do filtro
 * @param {string} config.selectId - ID do elemento select
 * @param {string} config.endpoint - Endpoint para buscar meses disponíveis
 * @param {Function} config.onChange - Função callback quando o mês mudar
 * @param {string} config.mesSelecionado - Mês inicialmente selecionado (opcional)
 */
window.MonthFilterHelper.inicializarFiltroMes = function(config) {
  const { selectId, endpoint, onChange, mesSelecionado = '' } = config;
  
  const selectMes = document.getElementById(selectId);
  if (!selectMes) {
    if (window.Logger) {
      window.Logger.warn(`Select ${selectId} não encontrado para filtro de mês`);
    }
    return;
  }
  
  // Listener para mudança de mês
  selectMes.addEventListener('change', async (e) => {
    const novoMes = e.target.value || '';
    
    if (window.Logger) {
      window.Logger.debug(`Filtro de mês alterado para: ${novoMes || 'Todos'}`);
    }
    
    // Invalidar cache relacionado
    if (window.dataStore && typeof window.dataStore.clear === 'function') {
      // Limpar cache genérico (pode ser customizado por página)
      window.dataStore.clear();
    }
    
    // Chamar callback
    if (onChange && typeof onChange === 'function') {
      await onChange(novoMes);
    }
  });
  
  // Popular select de meses
  window.MonthFilterHelper.popularSelectMeses(selectId, endpoint, mesSelecionado);
};

