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
    persist: false, // FILTROS LOCAIS POR PÁGINA: Não persistir entre páginas
    _debounceTimer: null, // Timer para debounce
    _pendingFilter: null, // Filtro pendente durante debounce
    
    /**
     * Aplicar filtro global com debounce
     * @param {string} field - Campo a filtrar
     * @param {string} value - Valor do filtro
     * @param {string} chartId - ID do gráfico que aplicou o filtro
     * @param {Object} options - Opções adicionais
     */
    apply(field, value, chartId = null, options = {}) {
      // OTIMIZAÇÃO: Debounce de 300ms para evitar múltiplas requisições
      const debounceDelay = options.debounce !== undefined ? options.debounce : 300;
      
      // Cancelar timer anterior se existir
      if (this._debounceTimer && window.timerManager) {
        window.timerManager.clearTimeout(this._debounceTimer);
      } else if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }
      
      // Guardar filtro pendente
      this._pendingFilter = { field, value, chartId, options };
      
      // Criar novo timer
      const applyFilter = () => {
        this._debounceTimer = null;
        const pending = this._pendingFilter;
        this._pendingFilter = null;
        if (pending) {
          this._applyImmediate(pending.field, pending.value, pending.chartId, pending.options);
        }
      };
      
      if (window.timerManager) {
        this._debounceTimer = window.timerManager.setTimeout(applyFilter, debounceDelay, 'filter-debounce');
      } else {
        this._debounceTimer = setTimeout(applyFilter, debounceDelay);
      }
    },
    
    /**
     * Aplicar filtro imediatamente (sem debounce)
     * @private
     * 
     * CROSSFILTER MULTI-DIMENSIONAL (Power BI Style):
     * - clearPrevious: false por padrão (permite múltiplos filtros simultâneos)
     * - toggle: true por padrão (clicar novamente remove o filtro)
     * - Suporta múltiplos filtros: Status + Tema + Órgão + etc.
     */
    _applyImmediate(field, value, chartId = null, options = {}) {
      // MUDANÇA: clearPrevious = false por padrão (sistema Power BI multi-dimensional)
      const { toggle = true, operator = 'eq', clearPrevious = false, debounce } = options;
      
      if (window.Logger) {
        window.Logger.debug(`Aplicando filtro: ${field} = ${value}`, {
          filtrosAntes: this.filters.length,
          clearPrevious,
          toggle,
          modo: 'crossfilter-multi-dimensional'
        });
      }
      
      // Verificar se já existe filtro para este campo e valor exato
      const existingIndex = this.filters.findIndex(f => f.field === field && f.value === value);
      const filterExists = existingIndex > -1;
      
      // Se clearPrevious estiver habilitado, limpar todos os filtros anteriores
      if (clearPrevious && this.filters.length > 0) {
        if (window.Logger) {
          window.Logger.debug(`Limpando ${this.filters.length} filtro(s) anterior(es) (clearPrevious=true)`);
        }
        this.filters = [];
      }
      
      // Se o filtro já existia e toggle está habilitado, remover (comportamento de toggle)
      if (filterExists && toggle) {
        // Remover filtro existente
        this.filters.splice(existingIndex, 1);
        
        // Atualizar activeField/activeValue se necessário
        if (this.filters.length === 0) {
          this.activeField = null;
          this.activeValue = null;
        } else {
          // Manter o último filtro como ativo
          const lastFilter = this.filters[this.filters.length - 1];
          this.activeField = lastFilter.field;
          this.activeValue = lastFilter.value;
        }
        
        if (window.Logger) {
          window.Logger.debug(`Filtro removido (toggle). Total de filtros: ${this.filters.length}`);
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
        
        // Emitir evento apropriado
        if (this.filters.length === 0) {
          eventBus.emit('filter:cleared', {});
        } else {
          eventBus.emit('filter:removed', { field, value, filters: [...this.filters] });
        }
      } else if (!filterExists) {
        // Adicionar novo filtro (não existe ainda)
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
     * FILTROS LOCAIS POR PÁGINA: Nunca carregar filtros salvos (sempre limpar)
     */
    load(restoreFilters = false) {
      // FILTROS LOCAIS POR PÁGINA: Sempre limpar filtros ao inicializar
      // Não restaurar filtros entre sessões ou páginas
      try {
        // Limpar filtros do localStorage para evitar persistência indesejada
        localStorage.removeItem('dashboardFilters');
        if (window.Logger) {
          window.Logger.debug('🔄 Filtros do localStorage limpos (sistema local por página)');
        }
      } catch (e) {
        // Ignorar erros
      }
      
      // Sempre limpar filtros na memória também
      this.filters = [];
      this.activeField = null;
      this.activeValue = null;
      
      // Não restaurar mesmo se restoreFilters for true (filtros são locais por página)
      return;
      
      // Se restoreFilters for true, carregar filtros salvos
      try {
        const saved = localStorage.getItem('dashboardFilters');
        if (saved) {
          const data = JSON.parse(saved);
          const loadedFilters = data.filters || [];
          
          // CROSSFILTER: Manter todos os filtros carregados (sistema multi-dimensional)
          if (loadedFilters.length > 0) {
            if (window.Logger) {
              window.Logger.debug(`Carregados ${loadedFilters.length} filtro(s) do localStorage (crossfilter multi-dimensional)`);
            }
            // Manter todos os filtros (sistema Power BI)
            this.filters = loadedFilters;
            const lastFilter = this.filters[this.filters.length - 1];
            this.activeField = lastFilter?.field || null;
            this.activeValue = lastFilter?.value || null;
          } else {
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
     * CROSSFILTER MULTI-DIMENSIONAL: Mostra todos os filtros ativos com pills removíveis
     */
    updateFilterIndicator() {
      // FILTROS DE CLIQUE DESABILITADOS: Não mostrar banner de filtros
      // Ocultar banner se existir
      const indicator = document.getElementById('filterIndicator');
      if (indicator) {
        indicator.classList.add('hidden');
        indicator.innerHTML = ''; // Limpar conteúdo
      }
      return; // Retornar imediatamente sem atualizar
    },
    
    /**
     * Obter emoji para um campo (para melhor UX visual)
     */
    getFieldEmoji(field) {
      const emojiMap = {
        'Status': '📊',
        'Tema': '🏷️',
        'Assunto': '📝',
        'Orgaos': '🏛️',
        'Tipo': '📋',
        'Canal': '📞',
        'Prioridade': '⚡',
        'Setor': '🏢',
        'Categoria': '📂',
        'Bairro': '📍',
        'UAC': '🏘️',
        'Responsavel': '👤',
        'Secretaria': '🏛️',
        'Unidade': '🏥',
        'Data': '📅',
        'Departamento': '🏢',
        'Canal': '📞'
      };
      return emojiMap[field] || '🔍';
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
     * FILTROS LOCAIS POR PÁGINA: Só notifica gráficos da página visível
     * OTIMIZADO: Notifica apenas gráficos da página atual
     */
    notifyAllCharts() {
      if (window.chartCommunication) {
        // FILTROS LOCAIS POR PÁGINA: Identificar página atual visível
        const visiblePage = this.getCurrentVisiblePage();
        
        if (window.Logger) {
          window.Logger.debug(`🔄 Notificando gráficos da página: ${visiblePage || 'todas'}`);
        }
        
        // Emitir evento para que gráficos reativos se atualizem
        // Os listeners de página vão verificar se a página está visível antes de atualizar
        eventBus.emit('charts:update-requested', {
          filters: [...this.filters],
          activeField: this.activeField,
          activeValue: this.activeValue,
          pageId: visiblePage // Informar qual página está visível
        });
        
        // INTERLIGAÇÃO: Atualizar estado visual de KPIs (só se a página estiver visível)
        if (visiblePage) {
          if (typeof updateKPIsVisualState === 'function') {
            updateKPIsVisualState();
          } else if (window.updateKPIsVisualState) {
            window.updateKPIsVisualState();
          }
        }
        
        // INTERLIGAÇÃO: Notificar gráficos Chart.js através de elementos canvas
        // O Chart.js não expõe Chart.instances como array, então iteramos sobre os canvas
        if (window.Chart && typeof window.Chart.getChart === 'function') {
          try {
            // Buscar todos os elementos canvas que podem ter gráficos
            // FILTROS LOCAIS: Só atualizar gráficos da página visível
            const selector = visiblePage ? `#${visiblePage} canvas[id]` : 'canvas[id]';
            document.querySelectorAll(selector).forEach(canvas => {
              try {
                const chart = window.Chart.getChart(canvas);
                if (chart && typeof chart.update === 'function') {
                  // Não atualizar aqui, deixar que os dados sejam recarregados primeiro
                  // Os gráficos serão atualizados quando os dados forem recarregados
                  // chart.update('none');
                }
              } catch (e) {
                // Ignorar erros ao acessar gráficos individuais
              }
            });
          } catch (e) {
            // Ignorar erros ao iterar sobre canvas
            if (window.Logger) {
              window.Logger.debug('Erro ao acessar instâncias Chart.js:', e);
            }
          }
        }
      }
    },
    
    /**
     * Obter página atual visível
     * FILTROS LOCAIS POR PÁGINA: Identifica qual página está sendo exibida
     * @returns {string|null} ID da página visível ou null
     */
    getCurrentVisiblePage() {
      const pagesContainer = document.getElementById('pages');
      if (!pagesContainer) return null;
      
      // Buscar seção visível
      const visiblePage = Array.from(pagesContainer.children).find(page => {
        if (page.tagName !== 'SECTION') return false;
        const style = window.getComputedStyle(page);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      return visiblePage ? visiblePage.id : null;
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
    'chartTopOrgaosBar': { field: 'Orgaos', op: 'contains' },
    'chartTopTemas': { field: 'Tema', op: 'eq' },
    'chartFunnelStatus': { field: 'Status', op: 'eq' },
    'chartSlaOverview': { field: null, op: null },
    'chartSLA': { field: null, op: null }, // SLA não deve filtrar
    'chartTiposManifestacao': { field: 'Tipo', op: 'eq' },
    'chartCanais': { field: 'Canal', op: 'eq' },
    'chartPrioridades': { field: 'Prioridade', op: 'eq' },
    'chartUnidadesCadastro': { field: 'Unidade', op: 'contains' },
    'chartDailyDistribution': { field: 'Data', op: 'contains' },
    
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
    'chartOrgaoMes': { field: 'Data', op: 'contains' }, // Filtra por mês quando clicado
    'chartOrgaos': { field: 'Orgaos', op: 'contains' }, // Filtra por órgão quando clicado
    
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
    'chartCrescimentoPercentual': { field: 'Data', op: 'contains' },
    'chartComparacaoAnual': { field: 'Data', op: 'contains' },
    'chartSazonalidade': { field: 'Data', op: 'contains' },
    'chartProjecaoTema': { field: 'Tema', op: 'eq' },
    'chartProjecaoTipo': { field: 'Tipo', op: 'eq' },
    
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
    'zeladoria-tempo-mes-chart': { field: 'Data', op: 'contains' },
    'zeladoria-tempo-distribuicao-chart': { field: null, op: null }, // Distribuição não filtra
    'zeladoria-mensal-chart': { field: 'Data', op: 'contains' },
    'zeladoria-bairro-mes-chart': { field: 'Data', op: 'contains' },
    'zeladoria-canal-mes-chart': { field: 'Data', op: 'contains' },
    'zeladoria-responsavel-mes-chart': { field: 'Data', op: 'contains' },
    'zeladoria-departamento-mes-chart': { field: 'Data', op: 'contains' },
    'zeladoria-categoria-mes-chart': { field: 'Data', op: 'contains' },
    'zeladoria-categoria-dept-chart': { field: 'Departamento', op: 'contains' },
    'zeladoria-status-mes-chart': { field: 'Data', op: 'contains' },
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
   * FILTROS LOCAIS POR PÁGINA: Só atualiza se a página estiver visível
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
      
      // FILTROS LOCAIS POR PÁGINA: Só atualizar se a página estiver visível
      if (!page || page.style.display === 'none') {
        if (window.Logger) {
          window.Logger.debug(`⏭️ Página ${pageId} não está visível, ignorando mudança de filtro`);
        }
        return; // Página não está visível, não precisa atualizar
      }
      
      // Verificar se a página está realmente visível (não apenas display !== 'none')
      const isVisible = page.offsetParent !== null || 
                        page.style.display === 'block' || 
                        getComputedStyle(page).display !== 'none';
      
      if (!isVisible) {
        if (window.Logger) {
          window.Logger.debug(`⏭️ Página ${pageId} não está realmente visível, ignorando mudança de filtro`);
        }
        return;
      }
      
      // Invalidar cache do dataStore para forçar recarregamento
      if (window.dataStore) {
        window.dataStore.invalidate();
      }
      
      // Debounce para evitar múltiplas atualizações simultâneas
      clearTimeout(window[timeoutKey]);
      window[timeoutKey] = setTimeout(() => {
        if (window.Logger) {
          window.Logger.debug(`🔄 Filtro mudou, recarregando ${pageId}...`);
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
      window.Logger.debug(`✅ Listener de filtro criado para ${pageId} (filtros locais por página)`);
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
  // AUTO-CONNECT PAGES - Sistema Automático de Conexão
  // ============================================
  
  /**
   * Conectar automaticamente todas as páginas ao sistema de filtros
   * FILTROS LOCAIS POR PÁGINA: Cada página só atualiza quando está visível
   * Os listeners verificam se a página está visível antes de atualizar
   */
  function autoConnectAllPages() {
    if (!window.chartCommunication) {
      return;
    }
    
    // Mapeamento de páginas para suas funções de carregamento
    const pageLoaders = {
      'page-main': window.loadOverview,
      'page-orgao-mes': window.loadOrgaoMes,
      'page-tipo': window.loadTipo,
      'page-status': window.loadStatusPage,
      'page-tema': window.loadTema,
      'page-assunto': window.loadAssunto,
      'page-bairro': window.loadBairro,
      'page-categoria': window.loadCategoria,
      'page-canal': window.loadCanal,
      'page-prioridade': window.loadPrioridade,
      'page-setor': window.loadSetor,
      'page-responsavel': window.loadResponsavel,
      'page-uac': window.loadUAC,
      'page-secretaria': window.loadSecretaria,
      'page-secretarias-distritos': window.loadSecretariasDistritos,
      'page-unidades-saude': window.loadUnidadesSaude,
      'page-reclamacoes': window.loadReclamacoes,
      'page-tempo-medio': window.loadTempoMedio,
      'page-cadastrante': window.loadCadastrante,
      'page-projecao-2026': window.loadProjecao2026,
      'page-vencimento': window.loadVencimento,
      'page-notificacoes': window.loadNotificacoes,
      'page-zeladoria-overview': window.loadZeladoriaOverview,
      'page-zeladoria-status': window.loadZeladoriaStatus,
      'page-zeladoria-categoria': window.loadZeladoriaCategoria,
      'page-zeladoria-departamento': window.loadZeladoriaDepartamento,
      'page-zeladoria-bairro': window.loadZeladoriaBairro,
      'page-zeladoria-responsavel': window.loadZeladoriaResponsavel,
      'page-zeladoria-canal': window.loadZeladoriaCanal,
      'page-zeladoria-tempo': window.loadZeladoriaTempo,
      'page-zeladoria-mensal': window.loadZeladoriaMensal,
      'page-zeladoria-geografica': window.loadZeladoriaGeografica,
      'page-zeladoria-colab-demandas': window.loadColabDemandas,
      'page-zeladoria-colab-criar': window.loadZeladoriaColabCriar,
      'page-zeladoria-colab-categorias': window.loadZeladoriaColabCategorias
    };
    
    // Conectar todas as páginas que têm loader
    Object.entries(pageLoaders).forEach(([pageId, loader]) => {
      if (loader && typeof loader === 'function') {
        try {
          createPageFilterListener(pageId, loader, 500);
          if (window.Logger) {
            window.Logger.debug(`✅ Página ${pageId} conectada automaticamente ao sistema de filtros`);
          }
        } catch (error) {
          if (window.Logger) {
            window.Logger.warn(`Erro ao conectar página ${pageId}:`, error);
          }
        }
      }
    });
    
    if (window.Logger) {
      window.Logger.success(`✅ Sistema de filtros locais por página ativado - ${Object.keys(pageLoaders).length} páginas conectadas`);
    }
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
      createPageFilterListener,
      
      // Auto-connect
      autoConnectAllPages
    };
    
    // Expor globalmente para compatibilidade
    window.globalFilters = globalFilters;
    window.chartFieldMap = chartFieldMap;
    window.showClickFeedback = feedback.show.bind(feedback);
    
    if (window.Logger) {
      window.Logger.success('✅ Sistema de Comunicação entre Gráficos inicializado');
    }
    
    // Conectar automaticamente todas as páginas ao sistema de filtros globais
    // Sistema Looker/Power BI: Todas as páginas se atualizam quando um filtro é aplicado
    // Aguardar um pouco para garantir que todas as funções de loader estejam disponíveis
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (window.chartCommunication && window.chartCommunication.autoConnectAllPages) {
            window.chartCommunication.autoConnectAllPages();
          }
        }, 1500);
      });
    } else {
      setTimeout(() => {
        if (window.chartCommunication && window.chartCommunication.autoConnectAllPages) {
          window.chartCommunication.autoConnectAllPages();
        }
      }, 1500);
    }
  }
})();

