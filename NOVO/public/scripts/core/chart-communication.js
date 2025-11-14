/**
 * Chart Communication System - Sistema Global de Comunicação entre Gráficos
 * 
 * Permite que gráficos se comuniquem entre si, compartilhem filtros,
 * atualizem-se reativamente e respondam a eventos globais.
 * 
 * Funcionalidades:
 * - Event Bus para comunicação entre gráficos
 * - Sistema de filtros globais
 * - Atualização reativa de gráficos
 * - Feedback visual de interações
 * - Mapeamento de campos de gráficos
 */

(function() {
  'use strict';

  // ============================================
  // EVENT BUS - Sistema de Eventos Global
  // ============================================
  
  const eventBus = {
    listeners: new Map(),
    
    /**
     * Registrar listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     * @returns {Function} Função para remover o listener
     */
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
      
      // Retornar função de unsubscribe
      return () => {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      };
    },
    
    /**
     * Emitir evento
     * @param {string} event - Nome do evento
     * @param {*} data - Dados do evento
     */
    emit(event, data) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            if (window.Logger) {
              window.Logger.error(`Erro em listener do evento ${event}:`, error);
            }
          }
        });
      }
    },
    
    /**
     * Remover todos os listeners de um evento
     * @param {string} event - Nome do evento
     */
    off(event) {
      this.listeners.delete(event);
    },
    
    /**
     * Limpar todos os listeners
     */
    clear() {
      this.listeners.clear();
    }
  };

  // ============================================
  // GLOBAL FILTERS - Sistema de Filtros Globais
  // ============================================
  
  const globalFilters = {
    filters: [],
    activeField: null,
    activeValue: null,
    persist: true,
    
    /**
     * Aplicar filtro global
     * @param {string} field - Campo a filtrar
     * @param {string} value - Valor do filtro
     * @param {string} chartId - ID do gráfico que aplicou o filtro
     * @param {Object} options - Opções adicionais
     */
    apply(field, value, chartId = null, options = {}) {
      const { toggle = true, operator = 'eq' } = options;
      
      // Verificar se já existe filtro para este campo
      const existingIndex = this.filters.findIndex(f => f.field === field && f.value === value);
      
      if (existingIndex > -1 && toggle) {
        // Remover filtro se já existe (toggle)
        this.filters.splice(existingIndex, 1);
        if (this.activeField === field && this.activeValue === value) {
          this.activeField = null;
          this.activeValue = null;
        }
      } else if (existingIndex === -1) {
        // Adicionar novo filtro
        this.filters.push({ field, value, operator, chartId });
        this.activeField = field;
        this.activeValue = value;
      }
      
      // Persistir se habilitado
      if (this.persist) {
        this.save();
      }
      
      // Emitir evento de filtro aplicado
      eventBus.emit('filter:applied', { field, value, chartId, filters: [...this.filters] });
      
      // Invalidar dados no dataStore
      this.invalidateData();
      
      // Atualizar UI
      this.updateUI();
    },
    
    /**
     * Limpar todos os filtros
     */
    clear() {
      this.filters = [];
      this.activeField = null;
      this.activeValue = null;
      
      if (this.persist) {
        this.save();
      }
      
      eventBus.emit('filter:cleared', {});
      this.invalidateData();
      this.updateUI();
    },
    
    /**
     * Remover filtro específico
     * @param {string} field - Campo do filtro
     * @param {string} value - Valor do filtro
     */
    remove(field, value) {
      const index = this.filters.findIndex(f => f.field === field && f.value === value);
      if (index > -1) {
        this.filters.splice(index, 1);
        if (this.activeField === field && this.activeValue === value) {
          this.activeField = null;
          this.activeValue = null;
        }
        
        if (this.persist) {
          this.save();
        }
        
        eventBus.emit('filter:removed', { field, value });
        this.invalidateData();
        this.updateUI();
      }
    },
    
    /**
     * Verificar se um filtro está ativo
     * @param {string} field - Campo
     * @param {string} value - Valor
     * @returns {boolean}
     */
    isActive(field, value) {
      return this.filters.some(f => f.field === field && f.value === value);
    },
    
    /**
     * Salvar filtros no localStorage
     */
    save() {
      try {
        localStorage.setItem('dashboardFilters', JSON.stringify({
          filters: this.filters,
          activeField: this.activeField,
          activeValue: this.activeValue
        }));
      } catch (e) {
        // Ignorar erros de localStorage
      }
    },
    
    /**
     * Carregar filtros do localStorage
     */
    load() {
      try {
        const saved = localStorage.getItem('dashboardFilters');
        if (saved) {
          const data = JSON.parse(saved);
          this.filters = data.filters || [];
          this.activeField = data.activeField || null;
          this.activeValue = data.activeValue || null;
        }
      } catch (e) {
        // Ignorar erros
      }
    },
    
    /**
     * Invalidar dados no dataStore
     */
    invalidateData() {
      if (window.dataStore) {
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
        
        window.dataStore.invalidate(keysToInvalidate);
        
        // Notificar recarregamento se necessário
        if (window.reloadAllData) {
          setTimeout(() => {
            window.reloadAllData();
          }, 100);
        }
      }
    },
    
    /**
     * Atualizar UI (indicadores, títulos, etc.)
     */
    updateUI() {
      // Atualizar indicador de filtros
      this.updateFilterIndicator();
      
      // Atualizar título da página
      this.updatePageTitle();
      
      // Atualizar realces visuais
      this.updateHighlights();
    },
    
    /**
     * Atualizar indicador de filtros ativos
     */
    updateFilterIndicator() {
      const indicator = document.getElementById('filterIndicator');
      if (indicator) {
        if (this.filters.length > 0) {
          indicator.textContent = `${this.filters.length} filtro(s) ativo(s)`;
          indicator.classList.remove('hidden');
        } else {
          indicator.classList.add('hidden');
        }
      }
    },
    
    /**
     * Atualizar título da página
     */
    updatePageTitle() {
      const pageTitle = document.querySelector('[data-page-title]');
      if (pageTitle && this.filters.length > 0) {
        pageTitle.classList.add('filter-active-title');
      } else if (pageTitle) {
        pageTitle.classList.remove('filter-active-title');
      }
    },
    
    /**
     * Atualizar realces visuais de elementos filtrados
     */
    updateHighlights() {
      // Remover realces anteriores
      document.querySelectorAll('[data-filter-highlight]').forEach(el => {
        el.classList.remove('filter-active');
        el.removeAttribute('data-filter-highlight');
      });
      
      // Aplicar realces aos elementos filtrados
      this.filters.forEach(filter => {
        document.querySelectorAll(`[data-filter-field="${filter.field}"][data-filter-value="${filter.value}"]`).forEach(el => {
          el.classList.add('filter-active');
          el.setAttribute('data-filter-highlight', filter.field);
        });
      });
    }
  };

  // Carregar filtros salvos ao inicializar
  globalFilters.load();

  // ============================================
  // CHART FIELD MAP - Mapeamento de Campos
  // ============================================
  
  const chartFieldMap = {
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
    'chartTempoMedioMes': { field: 'Data', op: 'contains' }
  };

  // ============================================
  // FEEDBACK SYSTEM - Sistema de Feedback Visual
  // ============================================
  
  const feedback = {
    /**
     * Mostrar feedback visual de clique em gráfico
     * @param {string} chartId - ID do gráfico
     * @param {string} label - Label clicado
     * @param {number} value - Valor clicado
     */
    show(chartId, label, value) {
      // Criar elemento de feedback se não existir
      let feedbackEl = document.getElementById('chartFeedback');
      if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.id = 'chartFeedback';
        feedbackEl.className = 'fixed top-4 right-4 bg-slate-800/90 border border-cyan-500/50 rounded-lg px-4 py-2 text-sm text-slate-200 z-50 shadow-lg';
        feedbackEl.style.display = 'none';
        document.body.appendChild(feedbackEl);
      }
      
      // Atualizar conteúdo
      feedbackEl.innerHTML = `
        <div class="font-semibold text-cyan-300">${label}</div>
        <div class="text-xs text-slate-400">${value.toLocaleString('pt-BR')} registros</div>
      `;
      
      // Mostrar
      feedbackEl.style.display = 'block';
      
      // Ocultar após 2 segundos
      setTimeout(() => {
        if (feedbackEl) {
          feedbackEl.style.display = 'none';
        }
      }, 2000);
    }
  };

  // ============================================
  // CHART REGISTRY - Registro de Gráficos
  // ============================================
  
  const chartRegistry = {
    charts: new Map(),
    
    /**
     * Registrar gráfico
     * @param {string} chartId - ID do gráfico
     * @param {Object} config - Configuração do gráfico
     */
    register(chartId, config) {
      this.charts.set(chartId, {
        ...config,
        id: chartId,
        createdAt: Date.now()
      });
      
      eventBus.emit('chart:registered', { chartId, config });
    },
    
    /**
     * Desregistrar gráfico
     * @param {string} chartId - ID do gráfico
     */
    unregister(chartId) {
      this.charts.delete(chartId);
      eventBus.emit('chart:unregistered', { chartId });
    },
    
    /**
     * Obter gráfico registrado
     * @param {string} chartId - ID do gráfico
     * @returns {Object|null}
     */
    get(chartId) {
      return this.charts.get(chartId) || null;
    },
    
    /**
     * Obter todos os gráficos
     * @returns {Array}
     */
    getAll() {
      return Array.from(this.charts.values());
    },
    
    /**
     * Obter gráficos por campo
     * @param {string} field - Campo
     * @returns {Array}
     */
    getByField(field) {
      return this.getAll().filter(chart => {
        const mapping = chartFieldMap[chart.id];
        return mapping && mapping.field === field;
      });
    }
  };

  // ============================================
  // EXPORT - Exportar para window
  // ============================================
  
  if (typeof window !== 'undefined') {
    window.chartCommunication = {
      // Event Bus
      on: eventBus.on.bind(eventBus),
      emit: eventBus.emit.bind(eventBus),
      off: eventBus.off.bind(eventBus),
      
      // Global Filters
      filters: globalFilters,
      applyFilter: globalFilters.apply.bind(globalFilters),
      clearFilters: globalFilters.clear.bind(globalFilters),
      removeFilter: globalFilters.remove.bind(globalFilters),
      isFilterActive: globalFilters.isActive.bind(globalFilters),
      
      // Chart Field Map
      chartFieldMap,
      getFieldMapping: (chartId) => chartFieldMap[chartId] || null,
      
      // Feedback
      showFeedback: feedback.show.bind(feedback),
      
      // Chart Registry
      registerChart: chartRegistry.register.bind(chartRegistry),
      unregisterChart: chartRegistry.unregister.bind(chartRegistry),
      getChart: chartRegistry.get.bind(chartRegistry),
      getAllCharts: chartRegistry.getAll.bind(chartRegistry),
      getChartsByField: chartRegistry.getByField.bind(chartRegistry)
    };
    
    // Compatibilidade com sistema antigo
    window.globalFilters = globalFilters;
    window.chartFieldMap = chartFieldMap;
    window.showClickFeedback = feedback.show.bind(feedback);
    
    if (window.Logger) {
      window.Logger.success('✅ Sistema de Comunicação entre Gráficos inicializado');
    }
  }
})();

