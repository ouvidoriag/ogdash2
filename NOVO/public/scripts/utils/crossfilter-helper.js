/**
 * Helper Universal para Crossfilter em Gráficos
 * 
 * Aplica sistema de filtros crossfilter (estilo Power BI) em gráficos Chart.js
 * Funciona tanto com crossfilterOverview quanto com chartCommunication
 * 
 * CÉREBRO X-3
 * Data: 18/12/2025
 */

(function() {
  'use strict';

  /**
   * Adicionar filtros crossfilter a um gráfico Chart.js
   * 
   * @param {Chart} chart - Instância do gráfico Chart.js
   * @param {Array} dataArray - Array de dados originais (para extrair valores)
   * @param {Object} config - Configuração do filtro
   * @param {string} config.field - Campo do filtro ('status', 'tema', 'orgaos', 'tipo', 'canal', 'prioridade', 'bairro')
   * @param {string} config.valueField - Campo no objeto de dados que contém o valor (ex: 'theme', 'status', 'organ')
   * @param {Function} config.onFilterChange - Callback quando filtro muda (opcional)
   * @param {Function} config.onClearFilters - Callback quando filtros são limpos (opcional)
   */
  window.addCrossfilterToChart = function(chart, dataArray, config) {
    // Validação: gráfico deve existir e ter canvas
    if (!chart) {
      if (window.Logger) {
        window.Logger.debug('addCrossfilterToChart: gráfico não fornecido (pode ser esperado)');
      }
      return;
    }
    
    if (!chart.canvas) {
      if (window.Logger) {
        window.Logger.debug('addCrossfilterToChart: gráfico sem canvas (pode ser esperado)');
      }
      return;
    }
    
    // Verificar se o canvas ainda está no DOM
    try {
      if (!chart.canvas.ownerDocument || !chart.canvas.parentElement) {
        if (window.Logger) {
          window.Logger.debug('addCrossfilterToChart: canvas não está no DOM (pode ser esperado)');
        }
        return;
      }
    } catch (error) {
      // Canvas foi removido do DOM - caso esperado quando gráfico é destruído
      if (window.Logger) {
        window.Logger.debug('addCrossfilterToChart: erro ao verificar canvas (pode ser esperado)', error.message);
      }
      return;
    }

    const { field, valueField, onFilterChange, onClearFilters } = config || {};
    
    if (!field) {
      if (window.Logger) {
        window.Logger.warn('addCrossfilterToChart: campo não especificado');
      }
      return;
    }

    // Mapear campo para método do crossfilterOverview
    const fieldMethodMap = {
      'status': 'setStatusFilter',
      'tema': 'setTemaFilter',
      'orgaos': 'setOrgaosFilter',
      'tipo': 'setTipoFilter',
      'canal': 'setCanalFilter',
      'prioridade': 'setPrioridadeFilter',
      'bairro': 'setBairroFilter',
      'unidade': 'setUnidadeFilter'
    };

    const methodName = fieldMethodMap[field.toLowerCase()];
    if (!methodName && !window.chartCommunication) {
      if (window.Logger) {
        window.Logger.warn(`addCrossfilterToChart: campo '${field}' não suportado`);
      }
      return;
    }

    // Tornar gráfico clicável
    chart.canvas.style.cursor = 'pointer';
    chart.canvas.title = `Clique para filtrar por ${field} | Clique direito para limpar filtros`;

    // Capturar estado de Ctrl/Cmd para seleção múltipla
    let lastClickCtrlState = false;

    // Interceptar clique no canvas ANTES do Chart.js
    chart.canvas.addEventListener('click', (e) => {
      lastClickCtrlState = e.ctrlKey || e.metaKey;
      setTimeout(() => {
        lastClickCtrlState = false;
      }, 100);
    }, true); // Capture phase

    // Handler de clique do Chart.js
    if (!chart.options.onClick) {
      chart.options.onClick = (event, elements) => {
        if (elements && elements.length > 0) {
          const element = elements[0];
          const index = element.index;
          
          // Extrair valor do dado original
          let value = null;
          if (dataArray && dataArray[index]) {
            const dataItem = dataArray[index];
            // Tentar múltiplos campos possíveis
            value = dataItem[valueField] || 
                   dataItem[field] || 
                   dataItem._id || 
                   dataItem.status || 
                   dataItem.theme || 
                   dataItem.organ || 
                   dataItem.type || 
                   dataItem.channel || 
                   dataItem.priority || 
                   dataItem.bairro ||
                   dataItem.unit ||
                   chart.data.labels[index];
          } else if (chart.data.labels && chart.data.labels[index]) {
            value = chart.data.labels[index];
          }

          if (!value) {
            if (window.Logger) {
              window.Logger.warn('addCrossfilterToChart: valor não encontrado', { index, dataArray, labels: chart.data.labels });
            }
            return;
          }

          const multiSelect = lastClickCtrlState;

          if (window.Logger) {
            window.Logger.debug(`📊 Clique no gráfico (${field}):`, { 
              value, 
              index, 
              multiSelect,
              field
            });
          }

          // Usar crossfilterOverview se disponível (página Overview)
          if (window.crossfilterOverview && methodName) {
            const method = window.crossfilterOverview[methodName];
            if (method && typeof method === 'function') {
              method.call(window.crossfilterOverview, value, multiSelect);
              // Aguardar um pouco antes de notificar para garantir que os gráficos sejam atualizados corretamente
              setTimeout(() => {
                window.crossfilterOverview.notifyListeners();
              }, 50);
              
              if (onFilterChange) {
                setTimeout(() => {
                  onFilterChange(value, multiSelect);
                }, 100);
              }
            }
          } 
          // Fallback: usar chartCommunication (outras páginas)
          else if (window.chartCommunication && window.chartCommunication.filters) {
            const existingFilters = window.chartCommunication.filters.filters || [];
            const newFilter = { 
              field: field.charAt(0).toUpperCase() + field.slice(1), // Capitalizar
              op: 'eq', 
              value: value 
            };
            
            if (multiSelect) {
              // Seleção múltipla: adicionar se não existir
              const exists = existingFilters.some(f => 
                f.field === newFilter.field && f.value === newFilter.value
              );
              if (!exists) {
                window.chartCommunication.filters.filters = [...existingFilters, newFilter];
              }
            } else {
              // Seleção única: substituir filtros do mesmo campo
              window.chartCommunication.filters.filters = [
                ...existingFilters.filter(f => f.field !== newFilter.field),
                newFilter
              ];
            }

            // Notificar mudanças após um pequeno delay para garantir que os gráficos sejam atualizados
            setTimeout(() => {
              if (window.chartCommunication.onFilterChange) {
                window.chartCommunication.onFilterChange();
              } else if (window.chartCommunication.notifyListeners) {
                window.chartCommunication.notifyListeners();
              }
            }, 50);

            if (onFilterChange) {
              setTimeout(() => {
                onFilterChange(value, multiSelect);
              }, 100);
            }
          }

          // Reset estado
          lastClickCtrlState = false;
        }
      };
    }

    // Adicionar handler para clique direito (limpar filtros)
    const chartContainer = chart.canvas.parentElement;
    if (chartContainer && !chartContainer.dataset.crossfilterEnabled) {
      chartContainer.dataset.crossfilterEnabled = 'true';
      chartContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        if (window.Logger) {
          window.Logger.debug(`📊 Limpando filtros via clique direito (${field})`);
        }

        // Limpar filtros
        if (window.crossfilterOverview) {
          window.crossfilterOverview.clearAllFilters();
          // Aguardar um pouco antes de notificar para garantir que os gráficos sejam recarregados
          setTimeout(() => {
            window.crossfilterOverview.notifyListeners();
          }, 50);
        } else if (window.chartCommunication && window.chartCommunication.filters) {
          window.chartCommunication.filters.clear();
          // Aguardar um pouco antes de notificar para garantir que os gráficos sejam recarregados
          setTimeout(() => {
            if (window.chartCommunication.onFilterChange) {
              window.chartCommunication.onFilterChange();
            } else if (window.chartCommunication.notifyListeners) {
              window.chartCommunication.notifyListeners();
            }
          }, 50);
        }

        // Chamar callback de limpeza após um pequeno delay para garantir que os gráficos sejam recarregados
        if (onClearFilters) {
          setTimeout(() => {
            onClearFilters();
          }, 100);
        }
      });
    }

    // Adicionar hover effect (com verificação de existência)
    chart.canvas.addEventListener('mousemove', (e) => {
      try {
        // Verificar se o gráfico ainda existe e está no DOM
        if (!chart || !chart.canvas || !chart.canvas.ownerDocument || !chart.canvas.parentElement) {
          return;
        }
        const elements = chart.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
        if (chart.canvas) {
          chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      } catch (error) {
        // Gráfico foi destruído, ignorar erro
        if (window.Logger) {
          window.Logger.debug('CrossfilterHelper: Gráfico destruído durante hover', error);
        }
      }
    });

    if (window.Logger) {
      window.Logger.debug(`✅ Crossfilter adicionado ao gráfico (${field})`);
    }
  };

  /**
   * Helper para adicionar crossfilter a múltiplos gráficos
   */
  window.addCrossfilterToCharts = function(chartsConfig) {
    chartsConfig.forEach(config => {
      const { chartId, dataArray, field, valueField, onFilterChange, onClearFilters } = config;
      
      // Aguardar gráfico estar disponível
      const checkChart = setInterval(() => {
        const chart = window.ChartFactory?.getChart?.(chartId) || 
                     window.chartFactory?.getChart?.(chartId) ||
                     (window.Chart && Chart.getChart(chartId));
        
        if (chart) {
          clearInterval(checkChart);
          window.addCrossfilterToChart(chart, dataArray, {
            field,
            valueField,
            onFilterChange,
            onClearFilters
          });
        }
      }, 100);

      // Timeout após 5 segundos
      setTimeout(() => {
        clearInterval(checkChart);
      }, 5000);
    });
  };

  if (window.Logger) {
    window.Logger.debug('✅ CrossfilterHelper: Helper universal de crossfilter inicializado');
  }
})();

