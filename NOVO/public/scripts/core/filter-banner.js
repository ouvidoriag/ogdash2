/**
 * Banner de Filtros Ativos
 * 
 * Componente reutilizável para exibir filtros ativos em qualquer página
 * 
 * Data: 2025-01-XX
 * CÉREBRO X-3
 */

(function() {
  'use strict';

  /**
   * Sistema de Banner de Filtros
   */
  window.filterBanner = {
    /**
     * Criar banner de filtros
     * @param {String} containerId - ID do container onde inserir o banner
     * @param {Array} filters - Array de filtros ativos
     * @param {Object} options - Opções de configuração
     */
    render(containerId, filters = [], options = {}) {
      const {
        showClearAll = true,
        showCount = true,
        position = 'top', // 'top' ou 'bottom'
        className = 'filter-banner-container'
      } = options;

      const container = document.getElementById(containerId);
      if (!container) {
        if (window.Logger) {
          window.Logger.warn(`FilterBanner: Container '${containerId}' não encontrado`);
        }
        return;
      }

      // Remover banner existente
      const existingBanner = container.querySelector(`.${className}`);
      if (existingBanner) {
        existingBanner.remove();
      }

      // Se não há filtros e não deve mostrar quando vazio, não criar banner
      if (filters.length === 0 && !options.showWhenEmpty) {
        return;
      }

      // Criar banner
      const banner = document.createElement('div');
      banner.className = className;
      banner.style.cssText = `
        display: ${filters.length > 0 ? 'flex' : 'none'};
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        margin-bottom: 16px;
        align-items: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;

      // Contador de filtros
      if (showCount && filters.length > 0) {
        const countBadge = document.createElement('span');
        countBadge.style.cssText = `
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-right: 8px;
        `;
        countBadge.textContent = `${filters.length} filtro(s) ativo(s)`;
        banner.appendChild(countBadge);
      }

      // Badges de filtros individuais
      filters.forEach((filter, index) => {
        const badge = this.createFilterBadge(filter, index);
        banner.appendChild(badge);
      });

      // Botão limpar todos
      if (showClearAll && filters.length > 0) {
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Limpar Todos';
        clearButton.style.cssText = `
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-left: auto;
          transition: all 0.2s;
        `;
        clearButton.onmouseover = () => {
          clearButton.style.background = 'rgba(255,255,255,0.3)';
        };
        clearButton.onmouseout = () => {
          clearButton.style.background = 'rgba(255,255,255,0.2)';
        };
        clearButton.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.clearAll();
        };
        banner.appendChild(clearButton);
      }

      // Inserir banner no container
      if (position === 'top') {
        container.insertBefore(banner, container.firstChild);
      } else {
        container.appendChild(banner);
      }

      if (window.Logger) {
        window.Logger.debug(`FilterBanner: Banner renderizado com ${filters.length} filtro(s)`);
      }
    },

    /**
     * Criar badge individual de filtro
     * @param {Object} filter - Filtro
     * @param {Number} index - Índice do filtro
     * @returns {HTMLElement} Badge
     */
    createFilterBadge(filter, index) {
      const badge = document.createElement('div');
      badge.className = 'filter-badge';
      badge.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        background: white;
        color: #333;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 14px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;

      // Label do campo
      const fieldLabel = this.getFieldLabel(filter.field);
      const operatorLabel = filter.op ? this.getOperatorLabel(filter.op) : '';
      
      // Valor do filtro
      let valueLabel = '';
      if (Array.isArray(filter.value)) {
        valueLabel = filter.value.length > 2 
          ? `${filter.value.length} valores`
          : filter.value.join(', ');
      } else {
        valueLabel = String(filter.value);
      }

      // Texto do badge (sem operador se não houver ou se for undefined)
      const badgeText = document.createElement('span');
      if (operatorLabel && operatorLabel !== 'undefined') {
        badgeText.textContent = `${fieldLabel} ${operatorLabel} ${valueLabel}`;
      } else {
        badgeText.textContent = `${fieldLabel}: ${valueLabel}`;
      }
      badge.appendChild(badgeText);

      // Botão remover
      const removeButton = document.createElement('button');
      removeButton.textContent = '×';
      removeButton.style.cssText = `
        background: transparent;
        border: none;
        color: #666;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      `;
      removeButton.onmouseover = () => {
        removeButton.style.background = '#f0f0f0';
        removeButton.style.color = '#d32f2f';
      };
      removeButton.onmouseout = () => {
        removeButton.style.background = 'transparent';
        removeButton.style.color = '#666';
      };
      removeButton.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.removeFilter(filter);
      };
      badge.appendChild(removeButton);

      return badge;
    },

    /**
     * Obter label amigável do campo
     * @param {String} field - Nome do campo
     * @returns {String} Label
     */
    getFieldLabel(field) {
      const labels = {
        'statusDemanda': 'Status',
        'Status': 'Status',
        'tema': 'Tema',
        'Tema': 'Tema',
        'assunto': 'Assunto',
        'Assunto': 'Assunto',
        'secretaria': 'Secretaria',
        'Secretaria': 'Secretaria',
        'Orgaos': 'Secretaria',
        'orgaos': 'Secretaria',
        'Orgao': 'Secretaria',
        'tipoDeManifestacao': 'Tipo',
        'Tipo': 'Tipo',
        'canal': 'Canal',
        'Canal': 'Canal',
        'prioridade': 'Prioridade',
        'Prioridade': 'Prioridade',
        'unidadeCadastro': 'Unidade',
        'Unidade': 'Unidade',
        'bairro': 'Bairro',
        'Bairro': 'Bairro',
        'dataCriacaoIso': 'Data de Criação',
        'Data': 'Data de Criação',
        'dataConclusaoIso': 'Data de Conclusão'
      };
      return labels[field] || field;
    },

    /**
     * Obter label amigável do operador
     * @param {String} op - Operador
     * @returns {String} Label
     */
    getOperatorLabel(op) {
      if (!op || op === 'undefined') return '';
      const labels = {
        'eq': '=',
        'in': 'em',
        'contains': 'contém',
        'gte': '≥',
        'lte': '≤',
        'gt': '>',
        'lt': '<'
      };
      return labels[op] || '';
    },

    /**
     * Remover filtro específico
     * @param {Object} filter - Filtro a remover
     */
    removeFilter(filter) {
      if (window.Logger) {
        window.Logger.debug('🗑️ Removendo filtro via filter-banner:', filter);
      }
      
      // Remover do chartCommunication (sistema global)
      if (window.chartCommunication && window.chartCommunication.filters) {
        // Tentar remover por field e value exatos
        window.chartCommunication.filters.remove(filter.field, filter.value);
        
        // Se o filtro tem operador 'in' e value é array, remover cada valor
        if (filter.op === 'in' && Array.isArray(filter.value)) {
          filter.value.forEach(val => {
            window.chartCommunication.filters.remove(filter.field, val);
          });
        }
        
        // Notificar todos os gráficos
        if (window.chartCommunication.filters.notifyAllCharts) {
          window.chartCommunication.filters.notifyAllCharts();
        }
      }
      
      // Remover do crossfilterOverview (sistema principal)
      if (window.crossfilterOverview) {
        if (Array.isArray(filter.value)) {
          // Se é array, remover valores específicos
          const currentValue = window.crossfilterOverview.filters[filter.field];
          if (Array.isArray(currentValue)) {
            const newArray = currentValue.filter(v => !filter.value.includes(v));
            window.crossfilterOverview.filters[filter.field] = newArray.length > 0 ? newArray : null;
          } else {
            window.crossfilterOverview.filters[filter.field] = null;
          }
        } else {
          // Valor único - limpar o campo
          window.crossfilterOverview.filters[filter.field] = null;
        }
        window.crossfilterOverview.notifyListeners();
      }
      
      // Atualizar banner após um pequeno delay para garantir que os gráficos foram atualizados
      setTimeout(() => {
        if (window.filterBanner && window.filterBanner.autoUpdate) {
          // O autoUpdate será chamado automaticamente via eventos, mas forçamos aqui também
          const container = document.querySelector('.filter-banner-container')?.parentElement;
          if (container) {
            const containerId = container.id;
            if (containerId) {
              window.filterBanner.autoUpdate(containerId);
            }
          }
        }
      }, 50);
    },

    /**
     * Limpar todos os filtros
     */
    clearAll() {
      if (window.Logger) {
        window.Logger.debug('🗑️ Limpando todos os filtros via filter-banner');
      }
      
      // Limpar chartCommunication primeiro (sistema global)
      if (window.chartCommunication && window.chartCommunication.filters) {
        if (window.chartCommunication.filters.clear) {
          window.chartCommunication.filters.clear();
        }
        if (window.chartCommunication.filters.notifyAllCharts) {
          window.chartCommunication.filters.notifyAllCharts();
        }
      }
      
      // Limpar crossfilterOverview (sistema principal)
      if (window.crossfilterOverview) {
        window.crossfilterOverview.clearAllFilters();
        // notifyListeners já é chamado dentro de clearAllFilters, mas garantimos aqui também
        if (window.crossfilterOverview.notifyListeners) {
          window.crossfilterOverview.notifyListeners();
        }
      }
      
      // Limpar filtros do localStorage se existir
      try {
        localStorage.removeItem('dashboardFilters');
      } catch (e) {
        // Ignorar erros
      }
      
      // Emitir evento global de limpeza
      if (window.eventBus) {
        window.eventBus.emit('filter:cleared', {});
      }
      
      // Invalidar cache de dados
      if (window.dataStore && window.dataStore.invalidate) {
        window.dataStore.invalidate([
          'dashboardData',
          '/api/dashboard-data',
          '/api/summary',
          '/api/aggregate/by-month',
          '/api/aggregate/by-day',
          '/api/aggregate/by-theme',
          '/api/aggregate/by-subject'
        ]);
      }
      
      // Forçar atualização de todas as páginas visíveis
      setTimeout(() => {
        const visiblePages = document.querySelectorAll('section[id^="page-"]');
        visiblePages.forEach(page => {
          if (page.style.display !== 'none') {
            const pageId = page.id;
            // Tentar encontrar e chamar a função de load da página
            const pageName = pageId.replace('page-', '').split('-').map(w => 
              w.charAt(0).toUpperCase() + w.slice(1)
            ).join('');
            const loadFunction = window[`load${pageName}`] || window[`load${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`];
            
            if (loadFunction && typeof loadFunction === 'function') {
              if (window.Logger) {
                window.Logger.debug(`🔄 Recarregando página ${pageId} após limpar filtros`);
              }
              loadFunction(false);
            }
          }
        });
      }, 100);
    },

    /**
     * Atualizar banner automaticamente quando filtros mudarem
     * @param {String} containerId - ID do container
     * @param {Object} options - Opções
     */
    autoUpdate(containerId, options = {}) {
      const updateBanner = () => {
        let filters = [];
        
        // Obter filtros globais
        if (window.chartCommunication && window.chartCommunication.filters) {
          filters = window.chartCommunication.filters.filters || [];
        }
        
        // Obter filtros do crossfilter se disponível
        if (window.crossfilterOverview && window.crossfilterOverview.filters) {
          const crossFilters = window.crossfilterOverview.filters;
          Object.entries(crossFilters).forEach(([field, value]) => {
            if (value !== null && value !== undefined) {
              if (Array.isArray(value)) {
                value.forEach(v => {
                  filters.push({ field, op: 'eq', value: v });
                });
              } else {
                filters.push({ field, op: 'eq', value });
              }
            }
          });
        }
        
        this.render(containerId, filters, options);
      };

      // Escutar mudanças de filtros
      if (window.eventBus) {
        window.eventBus.on('filter:applied', updateBanner);
        window.eventBus.on('filter:removed', updateBanner);
        window.eventBus.on('filter:cleared', updateBanner);
      }

      // Atualizar inicialmente
      updateBanner();
    }
  };

  if (window.Logger) {
    window.Logger.debug('FilterBanner: Sistema de banner de filtros inicializado');
  }
})();

