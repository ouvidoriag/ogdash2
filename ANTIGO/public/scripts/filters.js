/**
 * Filters Module - Sistema de Filtros
 */

window.globalFilters = {
  filters: [],
  activeField: null,
  activeValue: null,
  persist: true
};

const chartFieldMap = window.config?.CHART_FIELD_MAP || window.CHART_FIELD_MAP || {
  'chartStatus': { field: 'Status', op: 'eq' },
  'chartStatusPage': { field: 'Status', op: 'eq' },
  'chartStatusTema': { field: 'Status', op: 'eq' },
  'chartStatusAssunto': { field: 'Status', op: 'eq' },
  'chartTrend': { field: 'Data', op: 'contains' },
  'chartTopOrgaos': { field: 'Orgaos', op: 'contains' },
  'chartTopTemas': { field: 'Tema', op: 'eq' },
  'chartFunnelStatus': { field: 'Status', op: 'eq' },
  'chartSlaOverview': { field: null, op: null },
  'chartOrgaoMes': { field: 'Orgaos', op: 'contains' },
  'chartSecretaria': { field: 'Secretaria', op: 'contains' },
  'chartTipo': { field: 'Tipo', op: 'eq' },
  'chartSetor': { field: 'Setor', op: 'contains' },
  'chartCategoria': { field: 'Categoria', op: 'eq' },
  'chartBairro': { field: 'Bairro', op: 'contains' },
  'chartUAC': { field: 'UAC', op: 'contains' },
  'chartResponsavel': { field: 'Responsavel', op: 'contains' },
  'chartCanal': { field: 'Canal', op: 'eq' },
  'chartPrioridade': { field: 'Prioridade', op: 'eq' },
  'chartTema': { field: 'Tema', op: 'eq' },
  'chartAssunto': { field: 'Assunto', op: 'contains' },
  'chartMonth': { field: 'Data', op: 'contains' },
  'chartTempoMedio': { field: 'Orgaos', op: 'contains' },
  'chartTempoMedioMes': { field: 'Data', op: 'contains' },
  'chartCount': { field: null, op: null },
  'chartTime': { field: null, op: null },
  'chartSla': { field: null, op: null }
};

function restoreFilters() {
  window.globalFilters.filters = [];
  window.globalFilters.activeField = null;
  window.globalFilters.activeValue = null;
  
  try {
    localStorage.removeItem('dashboardFilters');
  } catch (e) {
    // Ignorar erros
  }
  
  updateFilterIndicator();
  updatePageTitle();
}

function applyGlobalFilter(field, value, chartId = null, element = null) {
  // DESABILITADO: Filtros globais removidos - gráficos não aplicam mais filtros
  // Mas manter estrutura para futuras implementações
  
  // Se dataStore estiver disponível, invalidar dados relevantes
  if (window.dataStore) {
    // Invalidar dados que podem ser afetados pelo filtro
    const keysToInvalidate = [
      'dashboardData',
      '/api/dashboard-data',
      '/api/summary',
      '/api/aggregate/by-month',
      '/api/aggregate/by-day',
      '/api/aggregate/by-theme',
      '/api/aggregate/by-subject',
      '/api/aggregate/count-by',
      '/api/stats/status-overview'
    ];
    
    if (window.Logger) {
      window.Logger.debug(`Filtro aplicado: ${field}=${value}. Invalidando ${keysToInvalidate.length} chaves no dataStore`);
    }
    
    window.dataStore.invalidate(keysToInvalidate);
    
    // Notificar que dados foram invalidados (pode acionar recarregamento)
    if (window.reloadAllData) {
      // Usar setTimeout para não bloquear
      setTimeout(() => {
        window.reloadAllData();
      }, 100);
    }
  }
  
  return;
}

window.clearGlobalFilters = function() {
  window.globalFilters.filters = [];
  window.globalFilters.activeField = null;
  window.globalFilters.activeValue = null;
  
  try {
    localStorage.removeItem('dashboardFilters');
  } catch (e) {
    // Ignorar erros
  }
  
  // Invalidar todos os dados no dataStore se disponível
  if (window.dataStore) {
    const stats = window.dataStore.getStats();
    const allKeys = [
      'dashboardData',
      ...stats.keys,
      '/api/dashboard-data',
      '/api/summary',
      '/api/aggregate/by-month',
      '/api/aggregate/by-day',
      '/api/aggregate/by-theme',
      '/api/aggregate/by-subject',
      '/api/aggregate/count-by',
      '/api/stats/status-overview'
    ];
    
    if (window.Logger) {
      window.Logger.info(`Filtros globais limpos. Invalidando ${allKeys.length} chaves no dataStore`);
    }
    
    window.dataStore.invalidate(allKeys);
  }
  
  updateFilterIndicator();
  updatePageTitle();
  updateAllFilterHighlights();
  
  if (window.reloadAllData) {
    // Aguardar um pouco antes de recarregar para garantir que invalidação foi processada
    setTimeout(() => {
      window.reloadAllData();
    }, 150);
  }
};

window.clearDateFilters = function() {
  const filtersAntes = window.globalFilters.filters.length;
  
  window.globalFilters.filters = window.globalFilters.filters.filter(f => {
    const fieldLower = (f.field || '').toLowerCase();
    const valueStr = String(f.value || '').toLowerCase();
    
    const isDateFilter = fieldLower === 'data' || fieldLower === 'mês' || fieldLower === 'mes' || fieldLower === 'month';
    const hasDateValue = valueStr.includes('mai') || valueStr.includes('2025') || valueStr.match(/\d{4}-\d{2}/);
    
    if (isDateFilter || hasDateValue) {
      return false;
    }
    return true;
  });
  
  if (window.globalFilters.activeField) {
    const activeFieldLower = window.globalFilters.activeField.toLowerCase();
    if (activeFieldLower === 'data' || activeFieldLower === 'mês' || activeFieldLower === 'mes' || activeFieldLower === 'month') {
      window.globalFilters.activeField = null;
      window.globalFilters.activeValue = null;
    }
  }
  
  const filtrosRemovidos = filtersAntes - window.globalFilters.filters.length;
  
  if (filtrosRemovidos > 0) {
    try {
      localStorage.setItem('dashboardFilters', JSON.stringify({
        filters: window.globalFilters.filters,
        activeField: window.globalFilters.activeField,
        activeValue: window.globalFilters.activeValue
      }));
    } catch (e) {
      // Ignorar erros
    }
    
    // Invalidar dados relacionados a datas no dataStore
    if (window.dataStore) {
      const dateRelatedKeys = [
        'dashboardData',
        '/api/dashboard-data',
        '/api/aggregate/by-month',
        '/api/aggregate/by-day',
        '/api/aggregate/time-series'
      ];
      
      if (window.Logger) {
        window.Logger.debug(`Filtros de data removidos. Invalidando ${dateRelatedKeys.length} chaves no dataStore`);
      }
      
      window.dataStore.invalidate(dateRelatedKeys);
    }
    
    updateFilterIndicator();
    updatePageTitle();
    updateAllFilterHighlights();
    
    if (window.reloadAllData) {
      setTimeout(() => {
        window.reloadAllData();
      }, 150);
    }
  }
};

function addFilterHighlight(element, field, value) {
  if (!element) return;
  
  document.querySelectorAll(`[data-filter-highlight="${field}"]`).forEach(el => {
    el.classList.remove('filter-active');
    el.removeAttribute('data-filter-highlight');
  });
  
  if (element.classList) {
    element.classList.add('filter-active');
    element.setAttribute('data-filter-highlight', field);
    element.setAttribute('data-filter-value', value);
  }
}

function removeFilterHighlight(element) {
  if (!element) return;
  
  if (element.classList) {
    element.classList.remove('filter-active');
    element.removeAttribute('data-filter-highlight');
    element.removeAttribute('data-filter-value');
  }
}

function showFilterFeedback(field, value, isRemoved = false) {
  return;
}

function updateAllFilterHighlights() {
  document.querySelectorAll('.filter-active').forEach(el => {
    el.classList.remove('filter-active');
  });
  document.querySelectorAll('[data-filter-highlight]').forEach(el => {
    el.removeAttribute('data-filter-highlight');
    el.removeAttribute('data-filter-value');
  });
}

function updateFilterIndicator() {
  const indicator = document.getElementById('filterIndicator');
  if (!indicator) return;
  
  indicator.classList.add('hidden');
  indicator.innerHTML = '';
}

function updatePageTitle() {
  const pageTitleEl = document.getElementById('pageTitle');
  if (!pageTitleEl) return;
  
  pageTitleEl.innerHTML = '';
  pageTitleEl.classList.remove('filter-active-title');
}

window.filters = {
  applyGlobalFilter,
  clearGlobalFilters: window.clearGlobalFilters,
  clearDateFilters: window.clearDateFilters,
  restoreFilters,
  updateFilterIndicator,
  updatePageTitle,
  updateAllFilterHighlights,
  chartFieldMap,
  addFilterHighlight,
  removeFilterHighlight,
  showFilterFeedback
};

window.chartFieldMap = chartFieldMap;

restoreFilters();
