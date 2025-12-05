/**
 * Página: Tempo Médio
 * Análise do tempo médio de atendimento em dias
 * 
 * Recriada com estrutura otimizada
 */

let mesSelecionadoTempoMedio = '';

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

async function loadTempoMedio(forceRefresh = false) {
  if (window.Logger) {
    window.Logger.debug('⏱️ loadTempoMedio: Iniciando');
  }
  
  const page = document.getElementById('page-tempo-medio');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Carregar dados por mês primeiro (para popular dropdown)
    const dataMes = await window.dataLoader?.load('/api/stats/average-time/by-month', {
      fallback: [], // Fallback para erro 502
      useDataStore: true,
      ttl: 5 * 60 * 1000
    }) || [];
    
    // Popular dropdown se ainda não foi populado
    if (document.getElementById('selectMesTempoMedio')?.options.length <= 1) {
      popularDropdownMeses(dataMes);
    }
    
    // Obter mês selecionado
    const selectMes = document.getElementById('selectMesTempoMedio');
    const mesSelecionado = selectMes?.value || '';
    mesSelecionadoTempoMedio = mesSelecionado;
    
    // Carregar estatísticas principais (com filtro de mês se selecionado)
    const statsUrl = mesSelecionado 
      ? `/api/stats/average-time/stats?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time/stats';
    
    if (window.Logger) {
      window.Logger.debug(`⏱️ Carregando stats de: ${statsUrl}`);
    }
    
    const stats = await window.dataLoader?.load(statsUrl, {
      useDataStore: !forceRefresh && !mesSelecionado, // Não usar cache se for refresh forçado ou se houver filtro
      ttl: 5 * 60 * 1000,
      fallback: { media: 0, mediana: 0, minimo: 0, maximo: 0, total: 0 } // Fallback para erro 502
    }) || {};
    
    if (window.Logger) {
      window.Logger.debug(`⏱️ Stats recebidos:`, stats);
    }
    
    // Renderizar estatísticas (sempre atualizar TODOS os cards quando há filtro ou refresh)
    renderTempoMedioStats(stats);
    
    if (window.Logger && (forceRefresh || mesSelecionado)) {
      window.Logger.debug(`✅ Cards atualizados com filtro: ${mesSelecionado || 'nenhum'}`);
    }
    
    // Renderizar gráficos principais (passar forceRefresh para controle de cache)
    await renderTempoMedioCharts(stats, dataMes, mesSelecionado, forceRefresh);
    
    // Carregar dados secundários (AGUARDAR conclusão para garantir que TUDO seja atualizado)
    // Quando há filtro ativo ou refresh forçado, todos os dados devem ser recarregados
    await loadSecondaryTempoMedioData(mesSelecionado, forceRefresh).catch(err => {
      console.error('❌ Erro ao carregar dados secundários de tempo médio:', err);
      if (window.Logger) {
        window.Logger.error('Erro ao carregar dados secundários:', err);
      }
    });
    
    if (window.Logger && (forceRefresh || mesSelecionado)) {
      window.Logger.debug(`✅ Todos os cards, gráficos e dados atualizados com sucesso (filtro: ${mesSelecionado || 'nenhum'})`);
    }
    
    if (window.Logger) {
      window.Logger.success('⏱️ loadTempoMedio: Concluído');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar TempoMedio:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar TempoMedio:', error);
    }
  }
}

function popularDropdownMeses(dataMes) {
  const select = document.getElementById('selectMesTempoMedio');
  if (!select || !dataMes || dataMes.length === 0) return;
  
  // Limpar opções existentes (exceto "Todos os meses")
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  // Ordenar meses (mais recentes primeiro)
  const mesesOrdenados = [...dataMes]
    .map(m => ({ ym: m.month || m.ym || '', dias: m.dias || 0 }))
    .filter(m => m.ym)
    .sort((a, b) => b.ym.localeCompare(a.ym));
  
  // Adicionar opções
  mesesOrdenados.forEach(m => {
    const option = document.createElement('option');
    option.value = m.ym;
    const label = window.dateUtils?.formatMonthYear?.(m.ym) || m.ym;
    option.textContent = `${label} (${m.dias.toFixed(1)} dias)`;
    select.appendChild(option);
  });
  
  // Adicionar listener para mudança de seleção
  select.addEventListener('change', async (e) => {
    const novoMes = e.target.value;
    mesSelecionadoTempoMedio = novoMes;
    
    if (window.Logger) {
      window.Logger.debug(`⏱️ Mês alterado para: ${novoMes || 'Todos os meses'}`);
    }
    
    // Mostrar loading
    const page = document.getElementById('page-tempo-medio');
    if (page) {
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'tempoMedioLoading';
      loadingOverlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      loadingOverlay.innerHTML = `
        <div class="glass rounded-2xl p-8 text-center">
          <div class="text-4xl mb-4 animate-spin">⏳</div>
          <p class="text-slate-300">Atualizando TODOS os cards e gráficos...</p>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
    }
    
    // Destruir todos os gráficos antes de recarregar
    destroyAllTempoMedioCharts();
    
    // Invalidar TODOS os caches relacionados ao tempo médio para forçar recarregamento completo
    if (window.dataStore) {
      // Invalidar cache completo
      window.dataStore.invalidate();
      
      // Invalidar especificamente todos os endpoints que podem ser afetados pelo filtro
      const endpointsToClear = [
        '/api/stats/average-time/stats',
        '/api/stats/average-time',
        '/api/stats/average-time/by-month',
        '/api/stats/average-time/by-day',
        '/api/stats/average-time/by-week',
        '/api/stats/average-time/by-unit',
        '/api/stats/average-time/by-month-unit'
      ];
      
      // Limpar cache para cada endpoint (com e sem filtro de mês)
      endpointsToClear.forEach(endpoint => {
        if (typeof window.dataStore.clear === 'function') {
          // Limpar sem filtro
          window.dataStore.clear(endpoint);
          // Limpar com filtro se houver
          if (novoMes) {
            window.dataStore.clear(`${endpoint}?meses=${encodeURIComponent(novoMes)}`);
          }
        }
      });
      
      if (window.Logger) {
        window.Logger.debug(`⏱️ Cache invalidado para ${endpointsToClear.length} endpoints`);
      }
    }
    
    try {
      // Recarregar TUDO com forceRefresh=true para garantir atualização completa
      await loadTempoMedio(true);
    } catch (error) {
      console.error('❌ Erro ao atualizar Tempo Médio:', error);
      if (window.Logger) {
        window.Logger.error('Erro ao atualizar Tempo Médio:', error);
      }
    } finally {
      // Remover loading
      const loadingOverlay = document.getElementById('tempoMedioLoading');
      if (loadingOverlay) {
        loadingOverlay.remove();
      }
    }
  });
}

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
  console.log('✅ Cards atualizados:', {
    Média: media.toFixed(1),
    Mediana: mediana.toFixed(1),
    Mínimo: minimo.toFixed(1),
    Máximo: maximo.toFixed(1)
  });
}

async function renderTempoMedioCharts(stats, dataMes, mesSelecionado = '', forceRefresh = false) {
  try {
    // Carregar dados por órgão/unidade (com filtro de mês se selecionado)
    const dataOrgaoUrl = mesSelecionado 
      ? `/api/stats/average-time?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time';
    
    const dataOrgao = await window.dataLoader?.load(dataOrgaoUrl, {
        useDataStore: !forceRefresh && !mesSelecionado, // Não usar cache se há filtro ou refresh forçado
        ttl: 5 * 60 * 1000,
        fallback: [] // Fallback para erro 502
      }) || [];
    
    // Gráfico principal: Tempo médio por órgão/unidade
    if (dataOrgao && Array.isArray(dataOrgao) && dataOrgao.length > 0) {
      // Ordenar por tempo médio (maior primeiro) e pegar apenas os top 10
      const sortedData = [...dataOrgao].sort((a, b) => {
        const valueA = a.dias || a.average || a.media || 0;
        const valueB = b.dias || b.average || b.media || 0;
        return valueB - valueA; // Ordem decrescente
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
      console.log(`📊 Gráfico Tempo Médio: Exibindo exatamente ${finalLabels.length} unidades`);
      
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
          onClick: false, // FILTROS DE CLIQUE DESABILITADOS
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
      // Se houver mês selecionado, destacar no gráfico
      let dadosParaGrafico = dataMes;
      if (mesSelecionado) {
        // Mostrar últimos 12 meses, mas destacar o selecionado
        dadosParaGrafico = dataMes.slice(-12);
      } else {
        dadosParaGrafico = dataMes.slice(-12);
      }
      
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
          onClick: false // FILTROS DE CLIQUE DESABILITADOS
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao renderizar gráficos de Tempo Médio:', error);
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
  
  // Ordenar por tempo médio (maior primeiro) e garantir apenas os top 10
  const sortedData = [...dataOrgao].sort((a, b) => {
    const valueA = a.dias || a.average || a.media || 0;
    const valueB = b.dias || b.average || b.media || 0;
    return valueB - valueA; // Ordem decrescente
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
    // Carregar dados por dia (com filtro de mês se selecionado)
    const dataDiaUrl = mesSelecionado 
      ? `/api/stats/average-time/by-day?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time/by-day';
    
    const dataDia = await window.dataLoader?.load(dataDiaUrl, {
      useDataStore: !forceRefresh && !mesSelecionado, // Não usar cache se há filtro ou refresh forçado
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
          onClick: false // FILTROS DE CLIQUE DESABILITADOS
        });
      }
    }
    
    // Carregar dados por semana (com filtro de mês se selecionado)
    const dataSemanaUrl = mesSelecionado 
      ? `/api/stats/average-time/by-week?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time/by-week';
    
    const dataSemana = await window.dataLoader?.load(dataSemanaUrl, {
      useDataStore: !forceRefresh && !mesSelecionado, // Não usar cache se há filtro ou refresh forçado
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
          onClick: false, // FILTROS DE CLIQUE DESABILITADOS
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
    
    // Carregar dados por unidade de cadastro (com filtro de mês se selecionado)
    const dataUnidadeUrl = mesSelecionado 
      ? `/api/stats/average-time/by-unit?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time/by-unit';
    
    const dataUnidade = await window.dataLoader?.load(dataUnidadeUrl, {
      useDataStore: !forceRefresh && !mesSelecionado, // Não usar cache se há filtro ou refresh forçado
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
          onClick: false // FILTROS DE CLIQUE DESABILITADOS
        });
      }
    }
    
    // Carregar dados por unidade e mês (com filtro de mês se selecionado)
    const dataUnidadeMesUrl = mesSelecionado 
      ? `/api/stats/average-time/by-month-unit?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time/by-month-unit';
    
    const dataUnidadeMes = await window.dataLoader?.load(dataUnidadeMesUrl, {
      useDataStore: !forceRefresh && !mesSelecionado, // Não usar cache se há filtro ou refresh forçado
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
          onClick: false, // FILTROS DE CLIQUE DESABILITADOS
          legendContainer: 'legendTempoMedioUnidadeMes'
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar dados secundários de tempo médio:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar dados secundários de tempo médio:', error);
    }
  }
}

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-tempo-medio', loadTempoMedio, 500);
}

window.loadTempoMedio = loadTempoMedio;

