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
      const { toggle = true, operator = 'eq', clearPrevious = true } = options;
      
      if (window.Logger) {
        window.Logger.debug(`Aplicando filtro: ${field} = ${value}`, {
          filtrosAntes: this.filters.length,
          clearPrevious,
          toggle
        });
      }
      
      // Verificar se já existe filtro para este campo e valor exato (ANTES de limpar)
      const existingIndex = this.filters.findIndex(f => f.field === field && f.value === value);
      const filterExists = existingIndex > -1;
      
      // Se clearPrevious estiver habilitado (padrão), SEMPRE limpar todos os filtros anteriores
      // NÃO emitir eventos filter:removed individuais para evitar múltiplos recarregamentos
      // O evento filter:applied final será suficiente para atualizar tudo
      if (clearPrevious && this.filters.length > 0) {
        if (window.Logger) {
          window.Logger.debug(`Limpando ${this.filters.length} filtro(s) anterior(es) (sem emitir eventos individuais)`);
        }
        
        // Limpar todos os filtros anteriores sem emitir eventos
        // Isso evita múltiplos recarregamentos desnecessários
        this.filters = [];
      }
      
      // Se o filtro já existia e toggle está habilitado, não adicionar (comportamento de toggle)
      if (filterExists && toggle) {
        // Filtro foi removido ao limpar acima, então não adicionar novamente
        if (window.Logger) {
          window.Logger.debug(`Filtro já existia, removendo (toggle)`);
        }
        this.activeField = null;
        this.activeValue = null;
        
        // Persistir se habilitado
        if (this.persist) {
          this.save();
        }
        
        // Invalidar dados no dataStore
        this.invalidateData();
        
        // Atualizar UI
        this.updateUI();
        
        // Notificar todos os gráficos registrados para se atualizarem
        this.notifyAllCharts();
        
        // Emitir evento de filtros limpos (já que não há mais filtros)
        eventBus.emit('filter:cleared', {});
      } else {
        // Adicionar novo filtro
        this.filters.push({ field, value, operator, chartId });
        this.activeField = field;
        this.activeValue = value;
        if (window.Logger) {
          window.Logger.debug(`Filtro adicionado. Total de filtros: ${this.filters.length}`);
        }
        
        // Persistir se habilitado
        if (this.persist) {
          this.save();
        }
        
        // Invalidar dados no dataStore
        this.invalidateData();
        
        // Atualizar UI
        this.updateUI();
        
        // Notificar todos os gráficos registrados para se atualizarem
        this.notifyAllCharts();
        
        // Emitir evento de filtro aplicado
        eventBus.emit('filter:applied', { field, value, chartId, filters: [...this.filters] });
      }
    },
    
    /**
     * Limpar todos os filtros
     */
    clear() {
      this.filters = [];
      this.activeField = null;
      this.activeValue = null;
      
      // Limpar do localStorage também
      try {
        localStorage.removeItem('dashboardFilters');
      } catch (e) {
        // Ignorar erros
      }
      
      if (this.persist) {
        this.save(); // Salvar estado vazio
      }
      
      eventBus.emit('filter:cleared', {});
      this.invalidateData();
      this.updateUI();
      
      // Notificar todos os gráficos registrados para se atualizarem
      this.notifyAllCharts();
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
        
        // Notificar todos os gráficos registrados para se atualizarem
        this.notifyAllCharts();
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
     * Só salva se houver filtros ativos (não salva array vazio)
     */
    save() {
      try {
        // Se não há filtros, remover do localStorage
        if (this.filters.length === 0) {
          localStorage.removeItem('dashboardFilters');
          return;
        }
        
        // Salvar apenas se houver filtros
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
     * Por padrão, NÃO carrega filtros ao inicializar (para evitar filtros persistentes indesejados)
     */
    load(restoreFilters = false) {
      // Se restoreFilters for false (padrão), limpar filtros salvos e não restaurar
      if (!restoreFilters) {
        try {
          // Limpar filtros do localStorage para evitar persistência indesejada
          localStorage.removeItem('dashboardFilters');
          if (window.Logger) {
            window.Logger.debug('Filtros do localStorage limpos na inicialização');
          }
        } catch (e) {
          // Ignorar erros
        }
        return;
      }
      
      // Se restoreFilters for true, carregar filtros salvos
      try {
        const saved = localStorage.getItem('dashboardFilters');
        if (saved) {
          const data = JSON.parse(saved);
          const loadedFilters = data.filters || [];
          
          // Se houver múltiplos filtros carregados, manter apenas o último (comportamento clearPrevious)
          if (loadedFilters.length > 1) {
            if (window.Logger) {
              window.Logger.debug(`Carregados ${loadedFilters.length} filtros do localStorage, mantendo apenas o último`);
            }
            // Manter apenas o último filtro
            this.filters = loadedFilters.slice(-1);
            const lastFilter = this.filters[0];
            this.activeField = lastFilter?.field || null;
            this.activeValue = lastFilter?.value || null;
          } else if (loadedFilters.length === 1) {
            this.filters = loadedFilters;
            this.activeField = data.activeField || null;
            this.activeValue = data.activeValue || null;
            if (window.Logger) {
              window.Logger.debug('Filtro restaurado do localStorage:', this.filters[0]);
            }
          } else {
            this.filters = [];
            this.activeField = null;
            this.activeValue = null;
          }
        }
      } catch (e) {
        // Ignorar erros
        if (window.Logger) {
          window.Logger.warn('Erro ao carregar filtros do localStorage:', e);
        }
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
          // Mostrar qual filtro está ativo
          const activeFilter = this.filters[this.filters.length - 1]; // Último filtro (o ativo)
          const fieldLabel = this.getFieldLabel(activeFilter.field);
          const valueLabel = activeFilter.value;
          
          indicator.innerHTML = `
            <div class="bg-cyan-500/20 border border-cyan-500/50 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg backdrop-blur-sm">
              <span class="text-cyan-300 text-sm font-semibold">Filtro ativo:</span>
              <span class="text-cyan-100 text-sm">${fieldLabel} = ${valueLabel}</span>
              <button onclick="window.chartCommunication?.clearFilters()" 
                      class="ml-2 text-cyan-300 hover:text-cyan-100 transition-colors" 
                      title="Remover filtro">
                ✕
              </button>
            </div>
          `;
          indicator.classList.remove('hidden');
        } else {
          indicator.classList.add('hidden');
        }
      }
    },
    
    /**
     * Obter label amigável para um campo
     */
    getFieldLabel(field) {
      const fieldLabels = {
        'Status': 'Status',
        'Tema': 'Tema',
        'Assunto': 'Assunto',
        'Orgaos': 'Órgão',
        'Tipo': 'Tipo',
        'Canal': 'Canal',
        'Prioridade': 'Prioridade',
        'Setor': 'Setor',
        'Categoria': 'Categoria',
        'Bairro': 'Bairro',
        'UAC': 'UAC',
        'Responsavel': 'Responsável',
        'Secretaria': 'Secretaria',
        'Data': 'Data'
      };
      return fieldLabels[field] || field;
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
    },
    
    /**
     * Notificar todos os gráficos registrados para se atualizarem
     */
    notifyAllCharts() {
      if (window.chartCommunication) {
        const allCharts = window.chartCommunication.getAllCharts();
        if (allCharts.length > 0 && window.Logger) {
          window.Logger.debug(`Notificando ${allCharts.length} gráfico(s) para atualização`);
        }
        
        // Emitir evento para que gráficos reativos se atualizem
        eventBus.emit('charts:update-requested', {
          filters: [...this.filters],
          activeField: this.activeField,
          activeValue: this.activeValue
        });
      }
    }
  };

  // Carregar filtros salvos ao inicializar
  globalFilters.load();

  // ============================================
  // CHART FIELD MAP - Mapeamento de Campos
  // ============================================
  
  const chartFieldMap = {
    // Overview
    'chartStatus': { field: 'Status', op: 'eq' },
    'chartStatusPage': { field: 'Status', op: 'eq' },
    'chartStatusTema': { field: 'Status', op: 'eq' },
    'chartStatusAssunto': { field: 'Status', op: 'eq' },
    'chartTrend': { field: 'Data', op: 'contains' },
    'chartTopOrgaos': { field: 'Orgaos', op: 'contains' },
    'chartTopTemas': { field: 'Tema', op: 'eq' },
    'chartFunnelStatus': { field: 'Status', op: 'eq' },
    'chartSlaOverview': { field: null, op: null },
    'chartTiposManifestacao': { field: 'Tipo', op: 'eq' },
    'chartCanais': { field: 'Canal', op: 'eq' },
    'chartPrioridades': { field: 'Prioridade', op: 'eq' },
    'chartUnidadesCadastro': { field: 'Unidade', op: 'contains' },
    
    // Status
    'chartStatusMes': { field: 'Data', op: 'contains' },
    
    // Tema
    'chartTema': { field: 'Tema', op: 'eq' },
    'chartTemaMes': { field: 'Data', op: 'contains' },
    
    // Assunto
    'chartAssunto': { field: 'Assunto', op: 'contains' },
    'chartAssuntoMes': { field: 'Data', op: 'contains' },
    
    // Tipo
    'chartTipo': { field: 'Tipo', op: 'eq' },
    
    // Órgão e Mês
    'chartOrgaoMes': { field: 'Orgaos', op: 'contains' },
    
    // Secretaria
    'chartSecretaria': { field: 'Secretaria', op: 'contains' },
    'chartSecretariaMes': { field: 'Data', op: 'contains' },
    'chartSecretariasDistritos': { field: 'Secretaria', op: 'contains' },
    
    // Setor
    'chartSetor': { field: 'Setor', op: 'contains' },
    
    // Categoria
    'chartCategoria': { field: 'Categoria', op: 'eq' },
    'chartCategoriaMes': { field: 'Data', op: 'contains' },
    
    // Bairro
    'chartBairro': { field: 'Bairro', op: 'contains' },
    'chartBairroMes': { field: 'Data', op: 'contains' },
    
    // UAC
    'chartUAC': { field: 'UAC', op: 'contains' },
    
    // Responsável
    'chartResponsavel': { field: 'Responsavel', op: 'contains' },
    
    // Canal
    'chartCanal': { field: 'Canal', op: 'eq' },
    
    // Prioridade
    'chartPrioridade': { field: 'Prioridade', op: 'eq' },
    
    // Tempo Médio
    'chartTempoMedio': { field: 'Orgaos', op: 'contains' },
    'chartTempoMedioMes': { field: 'Data', op: 'contains' },
    'chartTempoMedioDia': { field: 'Data', op: 'contains' },
    'chartTempoMedioSemana': { field: 'Data', op: 'contains' },
    'chartTempoMedioUnidade': { field: 'Unidade', op: 'contains' },
    'chartTempoMedioUnidadeMes': { field: 'Data', op: 'contains' },
    
    // Cadastrante
    'chartCadastranteMes': { field: 'Data', op: 'contains' },
    
    // Reclamações
    'chartReclamacoesTipo': { field: 'Tipo', op: 'eq' },
    'chartReclamacoesMes': { field: 'Data', op: 'contains' },
    
    // Projeção
    'chartProjecaoMensal': { field: 'Data', op: 'contains' },
    
    // Unidades de Saúde (dinâmico)
    'chartUnitTipos': { field: 'Tipo', op: 'eq' },
    
    // Zeladoria
    'zeladoria-chart-status': { field: 'Status', op: 'eq' },
    'zeladoria-chart-categoria': { field: 'Categoria', op: 'eq' },
    'zeladoria-chart-departamento': { field: 'Departamento', op: 'contains' },
    'zeladoria-chart-mensal': { field: 'Data', op: 'contains' },
    'zeladoria-status-chart': { field: 'Status', op: 'eq' },
    'zeladoria-categoria-chart': { field: 'Categoria', op: 'eq' },
    'zeladoria-departamento-chart': { field: 'Departamento', op: 'contains' },
    'zeladoria-bairro-chart': { field: 'Bairro', op: 'contains' },
    'zeladoria-responsavel-chart': { field: 'Responsavel', op: 'contains' },
    'zeladoria-canal-chart': { field: 'Canal', op: 'eq' },
    'zeladoria-tempo-chart': { field: 'Data', op: 'contains' },
    'zeladoria-mensal-chart': { field: 'Data', op: 'contains' },
    'chartZeladoriaStatus': { field: 'Status', op: 'eq' },
    'chartZeladoriaCategoria': { field: 'Categoria', op: 'eq' },
    
    // Outros
    'chartMonth': { field: 'Data', op: 'contains' }
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
  // PAGE FILTER LISTENER - Utilitário para páginas
  // ============================================
  
  /**
   * Criar listener genérico de filtros para uma página
   * Todas as páginas devem usar esta função para escutar eventos de filtro
   * @param {string} pageId - ID da página (ex: 'page-tema')
   * @param {Function} reloadFunction - Função para recarregar dados da página
   * @param {number} debounceMs - Tempo de debounce em ms (padrão: 500)
   */
  function createPageFilterListener(pageId, reloadFunction, debounceMs = 500) {
    if (!window.chartCommunication) {
      if (window.Logger) {
        window.Logger.warn(`Sistema de comunicação não disponível. Listener para ${pageId} não será criado.`);
      }
      return;
    }
    
    let updateTimeout = null;
    const timeoutKey = `${pageId}UpdateTimeout`;
    
    const handleFilterChange = () => {
      const page = document.getElementById(pageId);
      if (!page || page.style.display === 'none') {
        return; // Página não está visível, não precisa atualizar
      }
      
      // Invalidar cache do dataStore para forçar recarregamento
      if (window.dataStore) {
        window.dataStore.invalidate();
      }
      
      // Debounce para evitar múltiplas atualizações simultâneas
      clearTimeout(window[timeoutKey]);
      window[timeoutKey] = setTimeout(() => {
        if (window.Logger) {
          window.Logger.debug(`Filtro mudou, recarregando ${pageId}...`);
        }
        reloadFunction(true); // forceRefresh = true
      }, debounceMs);
    };
    
    // Escutar eventos de filtro
    window.chartCommunication.on('filter:applied', handleFilterChange);
    window.chartCommunication.on('filter:removed', handleFilterChange);
    window.chartCommunication.on('filter:cleared', handleFilterChange);
    window.chartCommunication.on('charts:update-requested', handleFilterChange);
    
    if (window.Logger) {
      window.Logger.debug(`✅ Listener de filtro criado para ${pageId}`);
    }
    
    // Retornar função para remover listeners (opcional)
    return () => {
      window.chartCommunication.off('filter:applied', handleFilterChange);
      window.chartCommunication.off('filter:removed', handleFilterChange);
      window.chartCommunication.off('filter:cleared', handleFilterChange);
      window.chartCommunication.off('charts:update-requested', handleFilterChange);
      clearTimeout(window[timeoutKey]);
    };
  }

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
      getChartsByField: chartRegistry.getByField.bind(chartRegistry),
      
      // Page Filter Listener
      createPageFilterListener
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

