/**
 * Filters Module - Sistema de Filtros Inteligentes
 * Gerencia filtros globais, persistência e interações
 */

// Estado global de filtros inteligentes
window.globalFilters = {
  filters: [],
  activeField: null,
  activeValue: null,
  persist: true
};

// Mapeamento de campos de gráficos para campos de filtro (usando config centralizado)
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

/**
 * Restaurar filtros do localStorage
 */
function restoreFilters() {
  try {
    const savedFilters = localStorage.getItem('dashboardFilters');
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      window.globalFilters.filters = parsed.filters || [];
      window.globalFilters.activeField = parsed.activeField || null;
      window.globalFilters.activeValue = parsed.activeValue || null;
    }
  } catch (e) {
    console.warn('Erro ao restaurar filtros do localStorage:', e);
  }
}

/**
 * Aplicar filtro inteligente com toggle
 */
function applyGlobalFilter(field, value, chartId = null, element = null) {
  if (!field || !value) return;
  
  // Determinar operação baseado no tipo de campo
  let op = 'contains';
  if (chartId && chartFieldMap[chartId]) {
    op = chartFieldMap[chartId].op || 'contains';
    field = chartFieldMap[chartId].field || field;
  }
  
  // Verificar se o mesmo filtro já está ativo (toggle)
  const existingFilter = window.globalFilters.filters.find(
    f => f.field === field && f.value === value
  );
  
  if (existingFilter) {
    // Se o mesmo filtro já está ativo, remover (toggle off)
    window.globalFilters.filters = window.globalFilters.filters.filter(
      f => !(f.field === field && f.value === value)
    );
    
    // Se não há mais filtros, limpar campos ativos
    if (window.globalFilters.filters.length === 0) {
      window.globalFilters.activeField = null;
      window.globalFilters.activeValue = null;
    } else {
      // Manter o último filtro como ativo
      const lastFilter = window.globalFilters.filters[window.globalFilters.filters.length - 1];
      window.globalFilters.activeField = lastFilter.field;
      window.globalFilters.activeValue = lastFilter.value;
    }
    
    // Remover realce visual
    removeFilterHighlight(element);
    
    // Feedback visual de remoção
    showFilterFeedback(field, value, true);
  } else {
    // Remover filtros anteriores do mesmo campo (substituir)
    window.globalFilters.filters = window.globalFilters.filters.filter(f => f.field !== field);
    
    // Adicionar novo filtro
    window.globalFilters.filters.push({ field, value, op });
    window.globalFilters.activeField = field;
    window.globalFilters.activeValue = value;
    
    // Adicionar realce visual
    addFilterHighlight(element, field, value);
    
    // Feedback visual de aplicação
    showFilterFeedback(field, value, false);
  }
  
  // Salvar no localStorage para persistência
  try {
    localStorage.setItem('dashboardFilters', JSON.stringify({
      filters: window.globalFilters.filters,
      activeField: window.globalFilters.activeField,
      activeValue: window.globalFilters.activeValue
    }));
  } catch (e) {
    console.warn('Erro ao salvar filtros no localStorage:', e);
  }
  
  // Atualizar indicador visual e título
  updateFilterIndicator();
  updatePageTitle();
  updateAllFilterHighlights();
  
  // Recarregar todos os dados
  if (window.reloadAllData) {
    window.reloadAllData();
  }
}

/**
 * Limpar todos os filtros
 */
window.clearGlobalFilters = function() {
  window.globalFilters.filters = [];
  window.globalFilters.activeField = null;
  window.globalFilters.activeValue = null;
  
  // Limpar localStorage
  try {
    localStorage.removeItem('dashboardFilters');
  } catch (e) {
    console.warn('Erro ao limpar filtros do localStorage:', e);
  }
  
  updateFilterIndicator();
  updatePageTitle();
  updateAllFilterHighlights();
  
  if (window.reloadAllData) {
    window.reloadAllData();
  }
  
  // Feedback visual
  const feedback = document.createElement('div');
  feedback.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50';
  feedback.innerHTML = `
    <div class="glass rounded-xl p-4 border border-emerald-500/50 shadow-lg">
      <div class="flex items-center gap-3">
        <div class="text-2xl">✨</div>
        <div class="text-emerald-300 font-bold text-sm">Filtros Limpos</div>
      </div>
    </div>
  `;
  document.body.appendChild(feedback);
  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transition = 'opacity 0.3s';
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
};

/**
 * Adicionar realce visual ao elemento filtrado
 */
function addFilterHighlight(element, field, value) {
  if (!element) return;
  
  // Remover realces anteriores do mesmo campo
  document.querySelectorAll(`[data-filter-highlight="${field}"]`).forEach(el => {
    el.classList.remove('filter-active');
    el.removeAttribute('data-filter-highlight');
  });
  
  // Adicionar realce ao elemento atual
  if (element.classList) {
    element.classList.add('filter-active');
    element.setAttribute('data-filter-highlight', field);
    element.setAttribute('data-filter-value', value);
  }
}

/**
 * Remover realce visual
 */
function removeFilterHighlight(element) {
  if (!element) return;
  
  if (element.classList) {
    element.classList.remove('filter-active');
    element.removeAttribute('data-filter-highlight');
    element.removeAttribute('data-filter-value');
  }
}

/**
 * Mostrar feedback visual ao aplicar/remover filtro
 */
function showFilterFeedback(field, value, isRemoved = false) {
  // Remover feedback anterior se existir
  const existingFeedback = document.getElementById('filterFeedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  // Usar config centralizado para obter label do campo
  const fieldName = window.config?.getFieldLabel?.(field) || 
                   field === 'Orgaos' ? 'Órgão' : 
                   field === 'Status' ? 'Status' :
                   field === 'Tema' ? 'Tema' :
                   field === 'Secretaria' ? 'Secretaria' :
                   field === 'Bairro' ? 'Bairro' :
                   field === 'Assunto' ? 'Assunto' :
                   field;
  
  const feedback = document.createElement('div');
  feedback.id = 'filterFeedback';
  feedback.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in';
  feedback.innerHTML = `
    <div class="glass rounded-xl p-4 border ${isRemoved ? 'border-emerald-500/50' : 'border-cyan-500/50'} shadow-lg">
      <div class="flex items-center gap-3">
        <div class="text-2xl">${isRemoved ? '✨' : '🔍'}</div>
        <div>
          <div class="${isRemoved ? 'text-emerald-300' : 'text-cyan-300'} font-bold text-sm">
            ${isRemoved ? 'Filtro Removido' : 'Filtro Aplicado'}
          </div>
          <div class="text-slate-300 text-xs mt-1">${fieldName}: <span class="font-semibold ${isRemoved ? 'text-emerald-200' : 'text-cyan-200'}">${value}</span></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(feedback);
  
  // Remover após 2.5 segundos
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.style.opacity = '0';
      feedback.style.transition = 'opacity 0.3s';
      setTimeout(() => feedback.remove(), 300);
    }
  }, 2500);
}

/**
 * Atualizar todos os realces visuais
 */
function updateAllFilterHighlights() {
  // Atualizar cartões de status
  if (window.globalFilters.filters.length > 0) {
    window.globalFilters.filters.forEach(filter => {
      // Procurar por elementos com o valor do filtro
      const elements = document.querySelectorAll(`[data-filter-value="${filter.value}"], [id*="${filter.value.toLowerCase().replace(/\s+/g, '-')}"]`);
      elements.forEach(el => {
        if (el.classList) {
          const isActive = window.globalFilters.filters.some(f => f.field === filter.field && f.value === filter.value);
          if (isActive) {
            el.classList.add('filter-active');
          } else {
            el.classList.remove('filter-active');
          }
        }
      });
    });
  } else {
    // Remover todos os realces
    document.querySelectorAll('.filter-active').forEach(el => {
      el.classList.remove('filter-active');
    });
  }
}

/**
 * Atualizar indicador visual de filtros
 */
function updateFilterIndicator() {
  const indicator = document.getElementById('filterIndicator');
  if (!indicator) return;
  
  if (window.globalFilters.filters.length > 0) {
    const filterText = window.globalFilters.filters.map(f => {
      const fieldName = f.field === 'Orgaos' ? 'Órgão' : 
                       f.field === 'Status' ? 'Status' :
                       f.field === 'Tema' ? 'Tema' :
                       f.field === 'Secretaria' ? 'Secretaria' :
                       f.field === 'Bairro' ? 'Bairro' :
                       f.field === 'Assunto' ? 'Assunto' :
                       f.field;
      return `<span class="font-semibold">${fieldName}</span>: <span class="text-cyan-200">${f.value}</span>`;
    }).join(', ');
    
    indicator.innerHTML = `
      <div class="flex items-center gap-3 px-4 py-2 rounded-xl glass border border-cyan-500/40 shadow-lg backdrop-blur-sm">
        <div class="flex items-center gap-2">
          <span class="text-2xl animate-pulse">🔍</span>
          <div class="flex flex-col">
            <span class="text-cyan-300 text-xs font-semibold uppercase tracking-wider">Filtro Inteligente Ativo</span>
            <span class="text-slate-200 text-sm">${filterText}</span>
          </div>
        </div>
        <button onclick="clearGlobalFilters()" 
                class="ml-2 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 hover:text-rose-100 text-sm font-bold transition-all cursor-pointer">
          ✕ Limpar
        </button>
      </div>
    `;
    indicator.classList.remove('hidden');
  } else {
    indicator.classList.add('hidden');
  }
}

/**
 * Atualizar título da página com filtro ativo
 */
function updatePageTitle() {
  const pageTitleEl = document.getElementById('pageTitle');
  if (!pageTitleEl) return;
  
  if (window.globalFilters.filters.length > 0) {
    const filterText = window.globalFilters.filters.map(f => {
      const fieldName = f.field === 'Orgaos' ? 'Órgão' : 
                       f.field === 'Status' ? 'Status' :
                       f.field === 'Tema' ? 'Tema' :
                       f.field === 'Secretaria' ? 'Secretaria' :
                       f.field === 'Bairro' ? 'Bairro' :
                       f.field === 'Assunto' ? 'Assunto' :
                       f.field;
      return `${fieldName}: ${f.value}`;
    }).join(' • ');
    
    pageTitleEl.innerHTML = `
      <div class="flex items-center gap-2">
        <span>📊</span>
        <span>Filtrado por: <span class="text-cyan-300 font-semibold">${filterText}</span></span>
      </div>
    `;
    pageTitleEl.classList.add('filter-active-title');
  } else {
    pageTitleEl.innerHTML = '';
    pageTitleEl.classList.remove('filter-active-title');
  }
}

// Exportar funções para uso global
window.filters = {
  applyGlobalFilter,
  clearGlobalFilters: window.clearGlobalFilters,
  restoreFilters,
  updateFilterIndicator,
  updatePageTitle,
  updateAllFilterHighlights,
  chartFieldMap,
  addFilterHighlight,
  removeFilterHighlight,
  showFilterFeedback
};

// Exportar chartFieldMap diretamente para compatibilidade
window.chartFieldMap = chartFieldMap;

// Restaurar filtros ao carregar
restoreFilters();

