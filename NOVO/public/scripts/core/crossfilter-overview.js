/**
 * Crossfilter Overview - Sistema de Filtros Inteligentes Multi-Dimensionais
 * 
 * Implementação estilo Power BI / Looker para página Overview
 * 
 * Funcionalidades:
 * - Múltiplos filtros simultâneos (Status + Tema + Órgão + etc.)
 * - Clique esquerdo = aplica filtro
 * - Clique direito = limpa TODOS os filtros
 * - Banner visual mostra filtros ativos com botões de remoção
 * - Todos os gráficos reagem bidirecionalmente
 * 
 * Data: 2025-01-XX
 * CÉREBRO X-3
 */

(function() {
  'use strict';

  /**
   * Crossfilter Context - Gerencia estado global de filtros
   */
  const crossfilterContext = {
    // Estado: objeto com múltiplas dimensões
    filters: {
      status: null,
      tema: null,
      orgaos: null,
      tipo: null,
      canal: null,
      prioridade: null,
      unidade: null,
      bairro: null
    },

    // Dados completos (para cálculos de porcentagem)
    allData: null,

    // Dados filtrados (para exibição)
    filteredData: null,

    // Listeners de mudança
    listeners: [],

    /**
     * Definir todos os dados brutos
     * @param {Array} data - Array de registros brutos
     */
    setAllData(data) {
      this.allData = data;
      if (window.Logger) {
        window.Logger.debug('Crossfilter: Dados brutos definidos', { total: data?.length || 0 });
      }
    },

    /**
     * Obter dados filtrados (compatibilidade)
     * @returns {Object} Dados agregados filtrados
     */
    getFilteredData() {
      if (!this.allData) {
        return null;
      }
      // Se não há filtros, retornar null para usar dados originais
      const hasActiveFilters = Object.values(this.filters).some(v => v !== null);
      if (!hasActiveFilters) {
        return null;
      }
      // Retornar filtros para que o listener busque dados da API
      return this.filters;
    },

    /**
     * Alternar filtro (toggle)
     * @param {String} field - Nome do campo
     * @param {String} value - Valor do filtro
     */
    toggleFilter(field, value) {
      if (this.filters[field] === value) {
        this.filters[field] = null; // Desativar filtro
        if (window.Logger) {
          window.Logger.debug(`Crossfilter: Filtro '${field}' desativado`, { field, value });
        }
      } else {
        this.filters[field] = value; // Ativar filtro
        if (window.Logger) {
          window.Logger.debug(`Crossfilter: Filtro '${field}' ativado`, { field, value });
        }
      }
      this.notifyListeners();
    },

    /**
     * Setters individuais para cada dimensão
     */
    setStatusFilter(status) {
      this.filters.status = status === this.filters.status ? null : status;
      this.notifyListeners();
    },

    setTemaFilter(tema) {
      this.filters.tema = tema === this.filters.tema ? null : tema;
      this.notifyListeners();
    },

    setOrgaosFilter(orgaos) {
      this.filters.orgaos = orgaos === this.filters.orgaos ? null : orgaos;
      this.notifyListeners();
    },

    setTipoFilter(tipo) {
      this.filters.tipo = tipo === this.filters.tipo ? null : tipo;
      this.notifyListeners();
    },

    setCanalFilter(canal) {
      this.filters.canal = canal === this.filters.canal ? null : canal;
      this.notifyListeners();
    },

    setPrioridadeFilter(prioridade) {
      this.filters.prioridade = prioridade === this.filters.prioridade ? null : prioridade;
      this.notifyListeners();
    },

    setUnidadeFilter(unidade) {
      this.filters.unidade = unidade === this.filters.unidade ? null : unidade;
      this.notifyListeners();
    },

    setBairroFilter(bairro) {
      this.filters.bairro = bairro === this.filters.bairro ? null : bairro;
      this.notifyListeners();
    },

    /**
     * Limpar todos os filtros de uma vez
     */
    clearAllFilters() {
      this.filters = {
        status: null,
        tema: null,
        orgaos: null,
        tipo: null,
        canal: null,
        prioridade: null,
        unidade: null,
        bairro: null
      };
      this.notifyListeners();
    },

    /**
     * Função que aplica TODOS os filtros ativos de uma vez
     * @param {Object} data - Dados do dashboard (dashboardData)
     * @returns {Object} Dados filtrados no mesmo formato
     * 
     * NOTA: Esta função filtra apenas os arrays de agregação.
     * Para filtragem completa, use a API /api/filter e reagregue os dados.
     */
    applyFilters(data) {
      if (!data) return data;

      // Se não há filtros ativos, retornar dados originais
      const hasActiveFilters = Object.values(this.filters).some(v => v !== null);
      if (!hasActiveFilters) {
        return data;
      }

      // Criar cópia dos dados para não modificar o original
      const filtered = JSON.parse(JSON.stringify(data));

      // Aplicar filtros em cada agregação
      // IMPORTANTE: Isso filtra apenas os arrays, não recalcula os dados base
      // Para filtragem completa, use /api/filter e reagregue
      if (filtered.manifestationsByStatus && this.filters.status) {
        filtered.manifestationsByStatus = filtered.manifestationsByStatus.filter(item => {
          const itemStatus = item.status || item._id || '';
          return String(itemStatus).toLowerCase() === String(this.filters.status).toLowerCase();
        });
      }

      if (filtered.manifestationsByTheme && this.filters.tema) {
        filtered.manifestationsByTheme = filtered.manifestationsByTheme.filter(item => {
          const itemTheme = item.theme || item._id || '';
          return String(itemTheme).toLowerCase() === String(this.filters.tema).toLowerCase();
        });
      }

      if (filtered.manifestationsByOrgan && this.filters.orgaos) {
        filtered.manifestationsByOrgan = filtered.manifestationsByOrgan.filter(item => {
          const itemOrgan = item.organ || item._id || '';
          return String(itemOrgan).toLowerCase() === String(this.filters.orgaos).toLowerCase();
        });
      }

      if (filtered.manifestationsByType && this.filters.tipo) {
        filtered.manifestationsByType = filtered.manifestationsByType.filter(item => {
          const itemType = item.type || item._id || '';
          return String(itemType).toLowerCase() === String(this.filters.tipo).toLowerCase();
        });
      }

      if (filtered.manifestationsByChannel && this.filters.canal) {
        filtered.manifestationsByChannel = filtered.manifestationsByChannel.filter(item => {
          const itemChannel = item.channel || item._id || '';
          return String(itemChannel).toLowerCase() === String(this.filters.canal).toLowerCase();
        });
      }

      if (filtered.manifestationsByPriority && this.filters.prioridade) {
        filtered.manifestationsByPriority = filtered.manifestationsByPriority.filter(item => {
          const itemPriority = item.priority || item._id || '';
          return String(itemPriority).toLowerCase() === String(this.filters.prioridade).toLowerCase();
        });
      }

      if (filtered.manifestationsByUnit && this.filters.unidade) {
        filtered.manifestationsByUnit = filtered.manifestationsByUnit.filter(item => {
          const itemUnit = item.unit || item._id || '';
          return String(itemUnit).toLowerCase() === String(this.filters.unidade).toLowerCase();
        });
      }

      // Recalcular totais baseado nos dados filtrados
      filtered.totalManifestations = this.calculateTotal(filtered);
      filtered.last7Days = this.calculateLast7Days(filtered);
      filtered.last30Days = this.calculateLast30Days(filtered);

      return filtered;
    },

    /**
     * Filtrar array de agregações
     */
    filterArray(array, field, value) {
      if (!value || !array) return array;
      return array.filter(item => {
        const itemValue = item[field] || item._id || item.status || item.theme || item.organ || item.type || item.channel || item.priority || item.unit;
        return String(itemValue).toLowerCase() === String(value).toLowerCase();
      });
    },

    /**
     * Calcular total de manifestações filtradas
     */
    calculateTotal(data) {
      if (data.manifestationsByStatus && data.manifestationsByStatus.length > 0) {
        return data.manifestationsByStatus.reduce((sum, item) => sum + (item.count || 0), 0);
      }
      return data.totalManifestations || 0;
    },

    /**
     * Calcular últimos 7 dias filtrados
     */
    calculateLast7Days(data) {
      // Simplificado: usar proporção do total
      const total = this.calculateTotal(data);
      const originalTotal = this.allData?.totalManifestations || data.totalManifestations || 1;
      const originalLast7 = this.allData?.last7Days || data.last7Days || 0;
      return Math.round((total / originalTotal) * originalLast7);
    },

    /**
     * Calcular últimos 30 dias filtrados
     */
    calculateLast30Days(data) {
      // Simplificado: usar proporção do total
      const total = this.calculateTotal(data);
      const originalTotal = this.allData?.totalManifestations || data.totalManifestations || 1;
      const originalLast30 = this.allData?.last30Days || data.last30Days || 0;
      return Math.round((total / originalTotal) * originalLast30);
    },

    /**
     * Contador de filtros ativos (para o banner)
     */
    getActiveFilterCount() {
      return Object.values(this.filters).filter(Boolean).length;
    },

    /**
     * Registrar listener para mudanças
     */
    onFilterChange(callback) {
      this.listeners.push(callback);
      return () => {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      };
    },

    /**
     * Notificar todos os listeners com debounce
     */
    _debounceTimer: null,
    notifyListeners() {
      // Debounce para evitar múltiplas chamadas
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }
      
      this._debounceTimer = setTimeout(() => {
        this._debounceTimer = null;
        this.listeners.forEach(callback => {
          try {
            callback(this.filters, this.getActiveFilterCount());
          } catch (error) {
            if (window.Logger) {
              window.Logger.error('Erro em listener de crossfilter:', error);
            }
          }
        });
      }, 100); // 100ms de debounce
    },

    /**
     * Obter label amigável para um campo
     */
    getFieldLabel(field) {
      const labels = {
        status: 'Status',
        tema: 'Tema',
        orgaos: 'Órgão',
        tipo: 'Tipo',
        canal: 'Canal',
        prioridade: 'Prioridade',
        unidade: 'Unidade',
        bairro: 'Bairro'
      };
      return labels[field] || field;
    },

    /**
     * Obter emoji para um campo
     */
    getFieldEmoji(field) {
      const emojis = {
        status: '📊',
        tema: '🏷️',
        orgaos: '🏛️',
        tipo: '📋',
        canal: '📞',
        prioridade: '⚡',
        unidade: '🏥',
        bairro: '📍'
      };
      return emojis[field] || '🔍';
    }
  };

  // Exportar para uso global
  if (typeof window !== 'undefined') {
    window.crossfilterOverview = crossfilterContext;
  }

  if (window.Logger) {
    window.Logger.success('✅ Sistema Crossfilter Overview inicializado');
  }
})();

