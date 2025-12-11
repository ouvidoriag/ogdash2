/**
 * Página: Tempo Médio
 * Análise do tempo médio de atendimento em dias
 * 
 * Recriada com estrutura otimizada
 */

let mesSelecionadoTempoMedio = '';
let ordenacaoTempoMedio = 'decrescente'; // 'decrescente' ou 'crescente'
let filtroMesTempoMedio = ''; // Filtro por mês (YYYY-MM)

/**
 * Função auxiliar para destruir um gráfico de forma segura
 */
function destroyChartSafely(chartId) {
  try {
    // Verificar se existe no window e tem método destroy
    if (window[chartId] && typeof window[chartId].destroy === 'function') {
      window[chartId].destroy();
      window[chartId] = null;
    }
    // Também tentar destruir via Chart.js se estiver disponível
    if (typeof window.Chart !== 'undefined' && typeof window.Chart.getChart === 'function') {
      const existingChart = window.Chart.getChart(chartId);
      if (existingChart && typeof existingChart.destroy === 'function') {
        existingChart.destroy();
      }
    }
  } catch (error) {
    // Ignorar erros ao destruir gráficos
    if (window.Logger) {
      window.Logger.debug(`Erro ao destruir gráfico ${chartId}:`, error);
    }
  }
}

/**
 * Destruir todos os gráficos da página Tempo Médio
 */
function destroyAllTempoMedioCharts() {
  const chartIds = [
    'chartTempoMedio',
    'chartTempoMedioMes',
    'chartTempoMedioDia',
    'chartTempoMedioSemana',
    'chartTempoMedioUnidade',
    'chartTempoMedioUnidadeMes'
  ];
  
  chartIds.forEach(chartId => {
    destroyChartSafely(chartId);
  });
  
  if (window.Logger) {
    window.Logger.debug('⏱️ Todos os gráficos de Tempo Médio destruídos');
  }
}

/**
 * Coletar filtros da página
 */
function coletarFiltrosTempoMedio() {
  const filtros = [];
  
  // Filtro por mês
  const mesFiltro = document.getElementById('filtroMesTempoMedio')?.value?.trim() || '';
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
}

async function loadTempoMedio(forceRefresh = false) {
  // PRIORIDADE 1: Verificar dependências críticas
  const dependencies = window.errorHandler?.requireDependencies(
    ['dataLoader', 'chartFactory'],
    () => {
      window.errorHandler?.showNotification(
        'Sistemas não carregados. Recarregue a página.',
        'warning'
      );
      return null;
    }
  );
  
  if (!dependencies) {
    return Promise.resolve();
  }
  
  const { dataLoader, chartFactory } = dependencies;
  
  if (window.Logger) {
    window.Logger.debug('⏱️ loadTempoMedio: Iniciando');
  }
  
  const page = document.getElementById('page-tempo-medio');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  // PRIORIDADE 2: Mostrar loading
  window.loadingManager?.show('Carregando dados de tempo médio...');
  
  // PRIORIDADE 1: Usar safeAsync para tratamento de erros
  return await window.errorHandler?.safeAsync(async () => {
    // Coletar filtros da página
    const filtrosPagina = coletarFiltrosTempoMedio();
    
    // Verificar se há filtros ativos
    let activeFilters = null;
    if (window.chartCommunication) {
      const globalFilters = window.chartCommunication.filters?.filters || [];
      // Combinar filtros globais com filtros da página
      activeFilters = [...globalFilters, ...filtrosPagina];
      if (activeFilters.length > 0) {
        if (window.Logger) {
          window.Logger.debug(`⏱️ loadTempoMedio: ${activeFilters.length} filtro(s) ativo(s)`, activeFilters);
        }
      }
    } else if (filtrosPagina.length > 0) {
      activeFilters = filtrosPagina;
    }
    
    // Carregar dados por mês (para gráfico de evolução)
    const dataMesRaw = await dataLoader.load('/api/stats/average-time/by-month', {
      fallback: [], // Fallback para erro 502
      useDataStore: true,
      ttl: 5 * 60 * 1000
    }) || [];
    
    // PRIORIDADE 1: Validar dados mensais
    const mesValidation = window.dataValidator?.validateApiResponse(dataMesRaw, {
      arrayItem: {
        types: { month: 'string', average: 'number' }
      }
    });
    
    const dataMes = mesValidation.valid ? mesValidation.data : [];
    
    // Usar filtro de mês selecionado
    const mesSelecionado = filtroMesTempoMedio || '';
    mesSelecionadoTempoMedio = mesSelecionado;
    
    // Carregar estatísticas principais
    let stats = {};
    
    // Se houver filtros, usar endpoint /api/filter e calcular stats localmente
    if (activeFilters && activeFilters.length > 0) {
      try {
        const filterRequest = {
          filters: activeFilters,
          originalUrl: window.location.pathname
        };
        
        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(filterRequest)
        });
        
        if (response.ok) {
          const filteredData = await response.json();
          
          if (Array.isArray(filteredData) && filteredData.length > 0) {
            // Calcular estatísticas dos dados filtrados
            const tempos = filteredData
              .map(record => {
                const tempo = record.tempoDeResolucaoEmDias || 
                             record.data?.tempoDeResolucaoEmDias ||
                             record.data?.tempo_de_resolucao_em_dias ||
                             null;
                return tempo !== null && tempo !== undefined ? parseFloat(tempo) : null;
              })
              .filter(t => t !== null && !isNaN(t));
            
            if (tempos.length > 0) {
              const sorted = [...tempos].sort((a, b) => a - b);
              const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
              const mediana = sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)];
              const minimo = sorted[0];
              const maximo = sorted[sorted.length - 1];
              
              stats = {
                media: media,
                mediana: mediana,
                minimo: minimo,
                maximo: maximo,
                total: filteredData.length
              };
            }
          }
        }
      } catch (filterError) {
        if (window.Logger) {
          window.Logger.error('Erro ao aplicar filtros, carregando sem filtros:', filterError);
        }
      }
    }
    
    // Se não calculou stats com filtros, usar endpoint normal
    if (!stats.media && !stats.total) {
      const statsUrl = '/api/stats/average-time/stats';
      
      if (window.Logger) {
        window.Logger.debug(`⏱️ Carregando stats de: ${statsUrl}`);
      }
      
      const statsRaw = await dataLoader.load(statsUrl, {
        useDataStore: !forceRefresh, // Não usar cache se for refresh forçado
        ttl: 5 * 60 * 1000,
        fallback: { media: 0, mediana: 0, minimo: 0, maximo: 0, total: 0 } // Fallback para erro 502
      }) || {};
      
      // PRIORIDADE 1: Validar stats
      const statsValidation = window.dataValidator?.validateDataStructure(statsRaw, {
        types: {
          media: 'number',
          mediana: 'number',
          minimo: 'number',
          maximo: 'number',
          total: 'number'
        }
      });
      
      stats = statsValidation.valid ? statsValidation.data : { media: 0, mediana: 0, minimo: 0, maximo: 0, total: 0 };
    }
    
    if (window.Logger) {
      window.Logger.debug(`⏱️ Stats recebidos:`, stats);
    }
    
    // Renderizar estatísticas (sempre atualizar TODOS os cards quando há refresh)
    renderTempoMedioStats(stats);
    
    if (window.Logger && forceRefresh) {
      window.Logger.debug(`✅ Cards atualizados`);
    }
    
    // Renderizar gráficos principais (passar forceRefresh e filtros para controle de cache)
    await renderTempoMedioCharts(stats, dataMes, mesSelecionado, forceRefresh, activeFilters);
    
    // Carregar dados secundários (AGUARDAR conclusão para garantir que TUDO seja atualizado)
    // Quando há refresh forçado, todos os dados devem ser recarregados
    await window.errorHandler?.safeAsync(
      async () => await loadSecondaryTempoMedioData('', forceRefresh),
      'loadTempoMedio (dados secundários)',
      { showToUser: false }
    );
    
    if (window.Logger && forceRefresh) {
      window.Logger.debug(`✅ Todos os cards, gráficos e dados atualizados com sucesso`);
    }
    
    if (window.Logger) {
      window.Logger.success('⏱️ loadTempoMedio: Concluído');
    }
    
    // PRIORIDADE 2: Esconder loading
    window.loadingManager?.hide();
    
    return { success: true, stats, dataMes };
  }, 'loadTempoMedio', {
    showToUser: true,
    fallback: () => {
      // PRIORIDADE 2: Esconder loading em caso de erro
      window.loadingManager?.hide();
      
      return { success: false, stats: { media: 0, mediana: 0, minimo: 0, maximo: 0, total: 0 }, dataMes: [] };
    }
  });
}

// Função removida - filtro por mês não está mais disponível

function renderTempoMedioStats(stats) {
  if (!stats) {
    if (window.Logger) {
      window.Logger.warn('⚠️ renderTempoMedioStats: stats é null ou undefined');
    }
    return;
  }
  
  if (window.Logger) {
    window.Logger.debug('📊 renderTempoMedioStats:', stats);
  }
  
  const statMedia = document.getElementById('statMedia');
  const statMediana = document.getElementById('statMediana');
  const statMinimo = document.getElementById('statMinimo');
  const statMaximo = document.getElementById('statMaximo');
  
  // Extrair valores com fallbacks para diferentes formatos de resposta da API
  const media = stats.media || stats.average || stats.dias || stats.mediaGeral || 0;
  const mediana = stats.mediana || stats.median || 0;
  const minimo = stats.minimo || stats.min || 0;
  const maximo = stats.maximo || stats.max || 0;
  
  if (statMedia) {
    statMedia.textContent = media.toFixed(1);
    if (window.Logger) {
      window.Logger.debug('📊 Média atualizada:', media.toFixed(1));
    }
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Elemento statMedia não encontrado');
    }
  }
  
  if (statMediana) {
    statMediana.textContent = mediana.toFixed(1);
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Elemento statMediana não encontrado');
    }
  }
  
  if (statMinimo) {
    statMinimo.textContent = minimo.toFixed(1);
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Elemento statMinimo não encontrado');
    }
  }
  
  if (statMaximo) {
    statMaximo.textContent = maximo.toFixed(1);
  } else {
    if (window.Logger) {
      window.Logger.warn('⚠️ Elemento statMaximo não encontrado');
    }
  }
  
  if (window.Logger) {
    window.Logger.debug('📊 TODOS os cards atualizados:', { 
      media: media.toFixed(1), 
      mediana: mediana.toFixed(1), 
      minimo: minimo.toFixed(1), 
      maximo: maximo.toFixed(1) 
    });
  }
  
  // Confirmar visualmente que os cards foram atualizados
  if (window.Logger) {
    window.Logger.debug('✅ Cards atualizados:', {
      Média: media.toFixed(1),
      Mediana: mediana.toFixed(1),
      Mínimo: minimo.toFixed(1),
      Máximo: maximo.toFixed(1)
    });
  }
}

async function renderTempoMedioCharts(stats, dataMes, mesSelecionado = '', forceRefresh = false) {
  try {
    // Carregar dados por órgão/unidade (sem filtro de mês)
    const dataOrgaoUrl = '/api/stats/average-time';
    
    const dataOrgao = await window.dataLoader?.load(dataOrgaoUrl, {
        useDataStore: !forceRefresh, // Não usar cache se há refresh forçado
        ttl: 5 * 60 * 1000,
        fallback: [] // Fallback para erro 502
      }) || [];
    
    // Gráfico principal: Tempo médio por órgão/unidade
    if (dataOrgao && Array.isArray(dataOrgao) && dataOrgao.length > 0) {
      // Ordenar por tempo médio conforme ordenação selecionada
      const sortedData = [...dataOrgao].sort((a, b) => {
        const valueA = a.dias || a.average || a.media || 0;
        const valueB = b.dias || b.average || b.media || 0;
        // Usar ordenação selecionada
        return ordenacaoTempoMedio === 'crescente' 
          ? valueA - valueB  // Ordem crescente (menor primeiro)
          : valueB - valueA;  // Ordem decrescente (maior primeiro)
      });
      
      const top10 = sortedData.slice(0, 10); // GARANTIR APENAS 10 ITENS
      const labels = top10.map(o => o.org || o.unit || o._id || 'N/A');
      const values = top10.map(o => o.dias || o.average || o.media || 0);
      
      // GARANTIR APENAS 10 ITENS - SEM EXCEÇÕES
      const MAX_ITEMS = 10;
      const finalLabels = labels.slice(0, MAX_ITEMS);
      const finalValues = values.slice(0, MAX_ITEMS);
      
      if (window.Logger) {
        window.Logger.debug(`⏱️ Top ${finalLabels.length} unidades selecionadas (de ${dataOrgao.length} totais)`);
      }
      
      // Log para debug
      if (window.Logger) {
        window.Logger.debug(`📊 Gráfico Tempo Médio: Exibindo exatamente ${finalLabels.length} unidades`);
      }
      
      if (finalLabels.length > 0 && finalValues.length > 0) {
        // Destruir gráfico existente antes de criar novo
        destroyChartSafely('chartTempoMedio');
        
        // Truncar labels longos para melhor visualização
        const truncatedLabels = finalLabels.map(label => {
          const maxLength = 35;
          return label && label.length > maxLength 
            ? label.substring(0, maxLength) + '...' 
            : label || 'N/A';
        });
        
        // Calcular cores com gradiente baseado no valor
        const maxValue = Math.max(...finalValues);
        const minValue = Math.min(...finalValues);
        
        // Criar cores com gradiente de cyan para violeta
        const backgroundColor = finalValues.map((value) => {
          const normalized = (value - minValue) / (maxValue - minValue || 1); // 0 a 1
          // Gradiente de cyan (180) para violeta (270)
          const hue = 180 + (270 - 180) * normalized;
          const saturation = 70 + (normalized * 10); // 70-80%
          const lightness = 55 - (normalized * 10); // 55-45%
          return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.85)`;
        });
        
        const borderColor = finalValues.map((value) => {
          const normalized = (value - minValue) / (maxValue - minValue || 1);
          const hue = 180 + (270 - 180) * normalized;
          return `hsl(${hue}, 75%, 55%)`;
        });
        
        await window.chartFactory?.createBarChart('chartTempoMedio', truncatedLabels, finalValues, {
          horizontal: true,
          colorIndex: 0,
          label: 'Tempo Médio (dias)',
          onClick: false,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 2,
          chartOptions: {
            indexAxis: 'y',
            maintainAspectRatio: true,
            responsive: true,
            layout: {
              padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#cbd5e1',
                borderColor: '#06b6d4',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                  title: function(context) {
                    // Mostrar label completo no tooltip
                    const index = context[0].dataIndex;
                    return finalLabels[index] || 'N/A';
                  },
                  label: function(context) {
                    const value = context.parsed.x || context.parsed.y;
                    return `Tempo médio: ${value.toFixed(1)} dias`;
                  },
                  afterLabel: function(context) {
                    const index = context.dataIndex;
                    const total = finalValues.reduce((a, b) => a + b, 0);
                    const percent = total > 0 ? ((finalValues[index] / total) * 100).toFixed(1) : '0.0';
                    return `${percent}% do total acumulado`;
                  }
                }
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  color: '#94a3b8',
                  font: {
                    size: 11,
                    weight: '500'
                  },
                  callback: function(value) {
                    return value + ' dias';
                  }
                },
                grid: {
                  color: 'rgba(148, 163, 184, 0.1)',
                  lineWidth: 1
                },
                title: {
                  display: true,
                  text: 'Tempo Médio (dias)',
                  color: '#06b6d4',
                  font: {
                    size: 12,
                    weight: '600'
                  }
                }
              },
              y: {
                ticks: {
                  color: '#cbd5e1',
                  font: {
                    size: 11,
                    weight: '500'
                  },
                  maxRotation: 0,
                  autoSkip: false
                },
                grid: {
                  display: false
                }
              }
            },
            animation: {
              duration: 1500,
              easing: 'easeInOutQuart'
            }
          }
        });
        
        // Renderizar ranking (apenas top 10)
        renderTempoMedioRanking(top10);
      }
    }
    
    // Gráfico por mês
    if (dataMes && Array.isArray(dataMes) && dataMes.length > 0) {
      // Mostrar últimos 12 meses
      const dadosParaGrafico = dataMes.slice(-12);
      
      const labels = dadosParaGrafico.map(m => {
        const ym = m.month || m.ym || '';
        return window.dateUtils?.formatMonthYearShort(ym) || ym;
      });
      const values = dadosParaGrafico.map(m => m.dias || m.average || m.media || 0);
      
      if (labels.length > 0 && values.length > 0) {
        // Destruir gráfico existente antes de criar novo
        destroyChartSafely('chartTempoMedioMes');
        
        await window.chartFactory?.createLineChart('chartTempoMedioMes', labels, values, {
          label: 'Tempo Médio (dias)',
          colorIndex: 0,
          fill: true,
          tension: 0.4,
          onClick: false,
        });
      }
    }
  } catch (error) {
    window.errorHandler?.handleError(error, 'renderTempoMedioCharts', {
      showToUser: false
    });
    if (window.Logger) {
      window.Logger.error('Erro ao renderizar gráficos de Tempo Médio:', error);
    }
  }
}

function renderTempoMedioRanking(dataOrgao) {
  const listaTempoMedio = document.getElementById('listaTempoMedio');
  if (!listaTempoMedio) return;
  
  if (!dataOrgao || !Array.isArray(dataOrgao) || dataOrgao.length === 0) {
    listaTempoMedio.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado encontrado</div>';
    return;
  }
  
  // Ordenar por tempo médio conforme ordenação selecionada
  const sortedData = [...dataOrgao].sort((a, b) => {
    const valueA = a.dias || a.average || a.media || 0;
    const valueB = b.dias || b.average || b.media || 0;
    // Usar ordenação selecionada
    return ordenacaoTempoMedio === 'crescente' 
      ? valueA - valueB  // Ordem crescente (menor primeiro)
      : valueB - valueA; // Ordem decrescente (maior primeiro)
  });
  
  const top10 = sortedData.slice(0, 10); // Garantir apenas 10 itens
  
  if (top10.length === 0) {
    listaTempoMedio.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado encontrado</div>';
    return;
  }
  
  const maxValue = Math.max(...top10.map(item => item.dias || item.average || item.media || 0));
  
  listaTempoMedio.innerHTML = top10.map((item, idx) => {
    const unit = item.org || item.unit || item._id || 'N/A';
    const average = item.dias || item.average || item.media || 0;
    const averageFormatted = average.toFixed(1);
    const percentage = maxValue > 0 ? ((average / maxValue) * 100).toFixed(0) : 0;
    
    // Cores para os top 3
    let badgeClass = 'bg-slate-700/50 text-slate-300';
    let badgeIcon = '';
    if (idx === 0) {
      badgeClass = 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30';
      badgeIcon = '🥇';
    } else if (idx === 1) {
      badgeClass = 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 text-slate-300 border border-slate-500/30';
      badgeIcon = '🥈';
    } else if (idx === 2) {
      badgeClass = 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30';
      badgeIcon = '🥉';
    }
    
    // Truncar nome longo
    const unitDisplay = unit.length > 30 ? unit.substring(0, 30) + '...' : unit;
    
    return `
      <div class="group relative flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-cyan-500/10 transition-all duration-300 border border-transparent hover:border-violet-500/20">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="flex-shrink-0 w-10 h-10 rounded-lg ${badgeClass} flex items-center justify-center text-xs font-bold">
            ${badgeIcon || (idx + 1)}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-200 truncate" title="${unit}">${unitDisplay}</div>
            <div class="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500" 
                style="width: ${percentage}%"
              ></div>
            </div>
          </div>
        </div>
        <div class="flex-shrink-0 ml-3 text-right">
          <span class="text-sm font-bold text-cyan-300">${averageFormatted}</span>
          <span class="text-xs text-slate-500 ml-1">dias</span>
        </div>
      </div>
    `;
  }).join('');
}

async function loadSecondaryTempoMedioData(mesSelecionado = '', forceRefresh = false) {
  try {
    // Carregar dados por dia (sem filtro de mês)
    const dataDiaUrl = '/api/stats/average-time/by-day';
    
    const dataDia = await window.dataLoader?.load(dataDiaUrl, {
      useDataStore: !forceRefresh, // Não usar cache se há refresh forçado
      ttl: 5 * 60 * 1000,
      fallback: [] // Fallback para erro 502
    }) || [];
    
    if (dataDia && Array.isArray(dataDia) && dataDia.length > 0) {
      const last30 = dataDia.slice(-30);
      const labels = last30.map(d => {
        const date = d.date || d._id || '';
        return window.dateUtils?.formatDate(date) || date;
      });
      const values = last30.map(d => d.dias || d.average || d.media || 0);
      
      if (labels.length > 0 && values.length > 0) {
        // Destruir gráfico existente antes de criar novo
        destroyChartSafely('chartTempoMedioDia');
        
        await window.chartFactory?.createLineChart('chartTempoMedioDia', labels, values, {
          label: 'Tempo Médio (dias)',
          colorIndex: 0,
          fill: true,
          tension: 0.4,
          onClick: false,
        });
      }
    }
    
    // Carregar dados por semana (sem filtro de mês)
    const dataSemanaUrl = '/api/stats/average-time/by-week';
    
    const dataSemana = await window.dataLoader?.load(dataSemanaUrl, {
      useDataStore: !forceRefresh, // Não usar cache se há refresh forçado
      ttl: 5 * 60 * 1000,
      fallback: [] // Fallback para erro 502
    }) || [];
    
    if (dataSemana && Array.isArray(dataSemana) && dataSemana.length > 0) {
      const last12 = dataSemana.slice(-12);
      const labels = last12.map(s => {
        const week = s.week || s._id || 'N/A';
        // Formatar semana: "2025-W45" -> "Semana 45/2025"
        if (week.includes('W')) {
          const [year, weekNum] = week.split('-W');
          return `Sem ${weekNum}/${year.slice(-2)}`;
        }
        return week;
      });
      const values = last12.map(s => s.dias || s.average || s.media || 0);
      
      if (labels.length > 0 && values.length > 0) {
        // Destruir gráfico existente antes de criar novo
        destroyChartSafely('chartTempoMedioSemana');
        
        await window.chartFactory?.createLineChart('chartTempoMedioSemana', labels, values, {
          label: 'Tempo Médio (dias)',
          colorIndex: 1,
          onClick: false,
          fill: true,
          tension: 0.4
        });
      } else {
        // Log para debug
        if (window.Logger) {
          window.Logger.warn('Tendência Semanal: dados vazios ou inválidos', { dataSemana, last12, labels, values });
        }
      }
    } else {
      // Log para debug
      if (window.Logger) {
        window.Logger.warn('Tendência Semanal: nenhum dado retornado do endpoint');
      }
    }
    
    // Carregar dados por unidade de cadastro (sem filtro de mês)
    const dataUnidadeUrl = '/api/stats/average-time/by-unit';
    
    const dataUnidade = await window.dataLoader?.load(dataUnidadeUrl, {
      useDataStore: !forceRefresh, // Não usar cache se há refresh forçado
      ttl: 5 * 60 * 1000,
      fallback: [] // Fallback para erro 502
    }) || [];
    
    if (dataUnidade && Array.isArray(dataUnidade) && dataUnidade.length > 0) {
      const top20 = dataUnidade.slice(0, 20);
      const labels = top20.map(u => u.unit || u.org || u._id || 'N/A');
      const values = top20.map(u => u.dias || u.average || u.media || 0);
      
      if (labels.length > 0 && values.length > 0) {
        // Destruir gráfico existente antes de criar novo
        destroyChartSafely('chartTempoMedioUnidade');
        
        await window.chartFactory?.createBarChart('chartTempoMedioUnidade', labels, values, {
          horizontal: true,
          colorIndex: 2,
          label: 'Tempo Médio (dias)',
          onClick: false,
        });
      }
    }
    
    // Carregar dados por unidade e mês (sem filtro de mês)
    const dataUnidadeMesUrl = '/api/stats/average-time/by-month-unit';
    
    const dataUnidadeMes = await window.dataLoader?.load(dataUnidadeMesUrl, {
      useDataStore: !forceRefresh, // Não usar cache se há refresh forçado
      ttl: 5 * 60 * 1000,
      fallback: [] // Fallback para erro 502
    }) || [];
    
    if (dataUnidadeMes && Array.isArray(dataUnidadeMes) && dataUnidadeMes.length > 0) {
      // Processar para gráfico de linha múltipla
      const unidades = [...new Set(dataUnidadeMes.map(d => d.unit || d._id))].slice(0, 5);
      const meses = [...new Set(dataUnidadeMes.map(d => d.month || d.ym))].sort();
      
      const datasets = unidades.map((unidade, idx) => {
        const data = meses.map(mes => {
          const item = dataUnidadeMes.find(d => 
            (d.unit === unidade || d._id === unidade) && (d.month === mes || d.ym === mes)
          );
          return item?.dias || item?.average || item?.media || 0;
        });
        return {
          label: unidade,
          data: data
        };
      });
      
      const labels = meses.map(m => window.dateUtils?.formatMonthYearShort(m) || m);
      
      if (labels.length > 0 && datasets.length > 0 && datasets[0].data.length > 0) {
        // Destruir gráfico existente antes de criar novo
        destroyChartSafely('chartTempoMedioUnidadeMes');
        
        await window.chartFactory?.createLineChart('chartTempoMedioUnidadeMes', labels, datasets, {
          fill: false,
          tension: 0.4,
          onClick: false,
          legendContainer: 'legendTempoMedioUnidadeMes'
        });
      }
    }
  } catch (error) {
    window.errorHandler?.handleError(error, 'loadSecondaryTempoMedioData', {
      showToUser: false
    });
    if (window.Logger) {
      window.Logger.error('Erro ao carregar dados secundários de tempo médio:', error);
    }
  }
}

/**
 * Atualizar ordenação do ranking
 */
function atualizarOrdenacaoTempoMedio(novaOrdenacao) {
  ordenacaoTempoMedio = novaOrdenacao;
  
  // Atualizar botões visuais
  const btnDecrescente = document.getElementById('btnOrdenacaoDecrescente');
  const btnCrescente = document.getElementById('btnOrdenacaoCrescente');
  
  if (btnDecrescente && btnCrescente) {
    if (novaOrdenacao === 'decrescente') {
      btnDecrescente.className = 'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 active:scale-95';
      btnCrescente.className = 'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-600/40 hover:text-slate-300 active:scale-95';
    } else {
      btnCrescente.className = 'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 active:scale-95';
      btnDecrescente.className = 'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-600/40 hover:text-slate-300 active:scale-95';
    }
  }
  
  // Recarregar dados para aplicar nova ordenação
  loadTempoMedio(false).catch(err => {
    window.errorHandler?.handleError(err, 'recarregarTempoMedioComOrdenacao', {
      showToUser: false
    });
  });
}

/**
 * Inicializar event listeners para botões de ordenação
 */
function inicializarBotoesOrdenacaoTempoMedio() {
  const btnDecrescente = document.getElementById('btnOrdenacaoDecrescente');
  const btnCrescente = document.getElementById('btnOrdenacaoCrescente');
  
  if (btnDecrescente) {
    btnDecrescente.addEventListener('click', () => {
      atualizarOrdenacaoTempoMedio('decrescente');
    });
  }
  
  if (btnCrescente) {
    btnCrescente.addEventListener('click', () => {
      atualizarOrdenacaoTempoMedio('crescente');
    });
  }
  
  // Inicializar estado visual
  atualizarOrdenacaoTempoMedio(ordenacaoTempoMedio);
}

/**
 * Popular select de meses
 */
async function popularSelectMesesTempoMedio() {
  const selectMes = document.getElementById('filtroMesTempoMedio');
  if (!selectMes) return;
  
  try {
    // Carregar dados mensais para obter meses disponíveis
    const dataMes = await window.dataLoader?.load('/api/stats/average-time/by-month', {
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
    if (filtroMesTempoMedio) {
      selectMes.value = filtroMesTempoMedio;
    }
  } catch (error) {
    window.errorHandler?.handleError(error, 'popularSelectMesesTempoMedio', {
      showToUser: false
    });
  }
}


/**
 * Inicializar listeners de filtros
 */
function inicializarFiltrosTempoMedio() {
  const selectMes = document.getElementById('filtroMesTempoMedio');
  
  // Listener para filtro de mês
  if (selectMes) {
    selectMes.addEventListener('change', async (e) => {
      filtroMesTempoMedio = e.target.value || '';
      
      if (window.Logger) {
        window.Logger.debug(`⏱️ Filtro de mês alterado para: ${filtroMesTempoMedio || 'Todos'}`);
      }
      
      // Invalidar cache
      if (window.dataStore && typeof window.dataStore.clear === 'function') {
        window.dataStore.clear('/api/stats/average-time');
        window.dataStore.clear('/api/stats/average-time/stats');
      }
      
      // Recarregar dados
      await loadTempoMedio(true);
    });
  }
  
  // Popular select de meses
  popularSelectMesesTempoMedio();
}

// Inicializar botões quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    inicializarBotoesOrdenacaoTempoMedio();
    inicializarFiltrosTempoMedio();
  });
} else {
  inicializarBotoesOrdenacaoTempoMedio();
  inicializarFiltrosTempoMedio();
}

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-tempo-medio', loadTempoMedio, 500);
}

window.loadTempoMedio = loadTempoMedio;

