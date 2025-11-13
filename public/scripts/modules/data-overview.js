/**
 * Módulo: Visão Geral (Overview)
 * Funções relacionadas à página principal e visão geral
 * Extraído de data.js para melhor organização
 */

// Importar dependências (será carregado após data-kpis.js)
// As funções loadKpisWithData e loadKpis devem estar disponíveis globalmente

/**
 * Carregar dados da visão geral
 */
async function loadOverview(forceRefresh = false) {
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Usar cache para evitar múltiplas requisições simultâneas
    const cacheKey = 'loadOverview';
    if (!forceRefresh && window.dataUtils?.getCachedData) {
      const cached = window.dataUtils.getCachedData(cacheKey, 5000);
      if (cached !== null) {
        return cached;
      }
    }
    
    // Usar Promise compartilhada para evitar execuções simultâneas
    const loadOverviewPromise = window.dataUtils?.getOrCreatePromise(cacheKey, async () => {
      try {
        // Carregar dados em paralelo
        const [summary, byMonth, orgaos, temas, dailyData] = await Promise.all([
          window.dataLoader?.load('/api/summary', { fallback: { total: 0, last7: 0, last30: 0, statusCounts: [] } }) || Promise.resolve({ total: 0, last7: 0, last30: 0, statusCounts: [] }),
          window.dataLoader?.load('/api/aggregate/by-month', { fallback: [] }) || Promise.resolve([]),
          window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', { fallback: [] }) || Promise.resolve([]),
          window.dataLoader?.load('/api/aggregate/by-theme', { fallback: [] }) || Promise.resolve([]),
          window.dataLoader?.load('/api/aggregate/by-day', { fallback: [] }) || Promise.resolve([])
        ]);
        
        // Renderizar dados
        await renderOverviewData(summary, byMonth, orgaos, temas, dailyData);
        
        // Cachear resultado
        if (window.dataUtils?.setCachedData) {
          window.dataUtils.setCachedData(cacheKey, { summary, byMonth, orgaos, temas, dailyData });
        }
        
        return { summary, byMonth, orgaos, temas, dailyData };
      } catch (error) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error('Erro ao carregar visão geral:', error);
        } else {
          console.error('❌ Erro ao carregar visão geral:', error);
        }
        throw error;
      }
    });
    
    return loadOverviewPromise;
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar visão geral:', error);
    } else {
      console.error('❌ Erro ao carregar visão geral:', error);
    }
    // Retornar dados vazios para não quebrar a aplicação
    return {
      summary: { total: 0, last7: 0, last30: 0, statusCounts: [] },
      byMonth: [],
      orgaos: [],
      temas: [],
      dailyData: []
    };
  }
}

/**
 * Renderizar dados da visão geral (extraído para reutilização com cache)
 */
async function renderOverviewData(summary, byMonth, orgaos, temas, dailyData) {
  try {
    // Carregar KPIs com dados já obtidos (evita requisição duplicada)
    if (window.data?.loadKpisWithData) {
      await window.data.loadKpisWithData(summary, dailyData, byMonth);
    } else if (window.loadKpisWithData) {
      await window.loadKpisWithData(summary, dailyData, byMonth);
    }
    
    // Guardar summary para reutilizar (garantir estrutura correta)
    let summaryData = summary;
    
    // CORREÇÃO: Garantir que summaryData tem statusCounts
    if (!summaryData.statusCounts && summary.statusCounts) {
      summaryData.statusCounts = summary.statusCounts;
    }

    // Processar dados de tendência mensal
    const labels = byMonth && byMonth.length > 0 ? byMonth.map(x => {
      const ym = x.ym || x.month || '';
      // OTIMIZADO: Usar dateUtils centralizado
      return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
    }) : [];
    const values = byMonth && byMonth.length > 0 ? byMonth.map(x => x.count || 0) : [];
    
    // Gráfico de tendência (otimizado)
    if (window.chartTrend instanceof Chart) window.chartTrend.destroy();
    const chartTrendEl = document.getElementById('chartTrend');
    if (chartTrendEl) {
      const ctxTrend = chartTrendEl.getContext('2d');
      if (ctxTrend) {
        if (labels.length === 0 || values.length === 0) {
          // CORREÇÃO: Não mostrar aviso se dados ainda estão sendo carregados
          // Apenas criar gráfico vazio silenciosamente
          if (byMonth && Array.isArray(byMonth) && byMonth.length === 0) {
            // Dados foram carregados mas estão vazios - criar gráfico vazio
            window.chartTrend = new Chart(ctxTrend, {
              type: 'line',
              data: { labels: ['Sem dados'], datasets: [{ label: 'Manifestações', data: [0], borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.1)' }] },
              options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } } }
            });
          }
          // Se byMonth é null/undefined, dados ainda estão carregando - não criar gráfico ainda
          return;
        } else {
          const gradientFn = window.utils?.gradient || (() => 'rgba(34,211,238,0.35)');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          // OTIMIZAÇÃO: Criar gradiente antes e usar requestAnimationFrame
          const gradientBg = typeof gradientFn === 'function' ? gradientFn(ctxTrend, 'rgba(34,211,238,0.35)', 'rgba(34,211,238,0.05)') : 'rgba(34,211,238,0.35)';
          
          requestAnimationFrame(() => {
            try {
              window.chartTrend = new Chart(ctxTrend, {
                type: 'line',
                data: { labels, datasets: [{
                  label: 'Manifestações',
                  data: values,
                  fill: true,
                  borderColor: '#22d3ee',
                  backgroundColor: gradientBg,
                  tension: 0.35,
                  borderWidth: 2,
                  pointRadius: 3
                }]},
                options: {
                  responsive: true,
                  animation: false, // Desabilitar animação para melhor performance
                  maintainAspectRatio: true,
                  plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: { display: false } },
                  scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } }
                }
              });
              addClickFn(window.chartTrend, (label, value) => showFeedbackFn(null, label, value), 'chartTrend');
            } catch (error) {
              // FASE 2.1: Usar Logger
              if (window.Logger) {
                window.Logger.error('Erro ao criar gráfico de tendência:', error);
              } else {
                console.error('❌ Erro ao criar gráfico de tendência:', error);
              }
            }
          });
        }
      } else {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.warn('Contexto chartTrend não encontrado');
        } else {
          console.warn('⚠️ Contexto chartTrend não encontrado');
        }
      }
    } else {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Elemento chartTrend não encontrado no DOM');
      } else {
        console.warn('⚠️ Elemento chartTrend não encontrado no DOM');
      }
    }

    // Top Órgãos (otimizado)
    const orgLabels = orgaos.slice(0, 10).map(x => x.key);
    const orgValues = orgaos.slice(0, 10).map(x => x.count);
    if (window.chartTopOrgaos instanceof Chart) window.chartTopOrgaos.destroy();
    const chartTopOrgaosEl = document.getElementById('chartTopOrgaos');
    if (chartTopOrgaosEl && orgLabels.length > 0 && orgValues.length > 0) {
      const ctxOrg = chartTopOrgaosEl.getContext('2d');
      if (ctxOrg) {
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        // OTIMIZAÇÃO: Usar requestAnimationFrame
        requestAnimationFrame(() => {
          try {
            window.chartTopOrgaos = new Chart(ctxOrg, {
              type: 'bar',
              data: { labels: orgLabels, datasets: [{ data: orgValues, backgroundColor: 'rgba(167,139,250,0.7)', borderColor: 'rgba(167,139,250,1)', borderWidth: 1 }] },
              options: { 
                responsive: true, 
                animation: false, // Desabilitar animação
                maintainAspectRatio: true,
                indexAxis: 'y', 
                plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
                scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
              }
            });
            addClickFn(window.chartTopOrgaos, (label, value) => showFeedbackFn(null, label, value), 'chartTopOrgaos');
          } catch (error) {
            // FASE 2.1: Usar Logger
            if (window.Logger) {
              window.Logger.error('Erro ao criar gráfico Top Órgãos:', error);
            } else {
              console.error('❌ Erro ao criar gráfico Top Órgãos:', error);
            }
          }
        });
      }
    } else {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        if (!orgaos || orgaos.length === 0) {
          window.Logger.warn('Elemento chartTopOrgaos não encontrado ou sem dados - banco pode estar vazio');
        } else {
          window.Logger.warn('Elemento chartTopOrgaos não encontrado no DOM');
        }
      } else {
        if (!orgaos || orgaos.length === 0) {
          console.warn('⚠️ Elemento chartTopOrgaos não encontrado ou sem dados - banco pode estar vazio');
        } else {
          console.warn('⚠️ Elemento chartTopOrgaos não encontrado no DOM');
        }
      }
    }

    // Top Temas (otimizado)
    const temaLabels = temas.slice(0, 10).map(x => x.tema);
    const temaValues = temas.slice(0, 10).map(x => x.quantidade);
    if (window.chartTopTemas instanceof Chart) window.chartTopTemas.destroy();
    const chartTopTemasEl = document.getElementById('chartTopTemas');
    if (chartTopTemasEl && temaLabels.length > 0 && temaValues.length > 0) {
      const ctxTemas = chartTopTemasEl.getContext('2d');
      if (ctxTemas) {
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        // OTIMIZAÇÃO: Usar requestAnimationFrame
        requestAnimationFrame(() => {
          try {
            window.chartTopTemas = new Chart(ctxTemas, {
              type: 'bar',
              data: { labels: temaLabels, datasets: [{ data: temaValues, backgroundColor: 'rgba(34,211,238,0.7)', borderColor: 'rgba(34,211,238,1)', borderWidth: 1 }] },
              options: { 
                responsive: true, 
                animation: false, // Desabilitar animação
                maintainAspectRatio: true,
                indexAxis: 'y', 
                plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
                scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } 
              }
            });
            addClickFn(window.chartTopTemas, (label, value) => showFeedbackFn(null, label, value), 'chartTopTemas');
          } catch (error) {
            // FASE 2.1: Usar Logger
            if (window.Logger) {
              window.Logger.error('Erro ao criar gráfico Top Temas:', error);
            } else {
              console.error('❌ Erro ao criar gráfico Top Temas:', error);
            }
          }
        });
      }
    } else {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        if (!temas || temas.length === 0) {
          window.Logger.warn('Elemento chartTopTemas não encontrado ou sem dados - banco pode estar vazio');
        } else {
          window.Logger.warn('Elemento chartTopTemas não encontrado no DOM');
        }
      } else {
        if (!temas || temas.length === 0) {
          console.warn('⚠️ Elemento chartTopTemas não encontrado ou sem dados - banco pode estar vazio');
        } else {
          console.warn('⚠️ Elemento chartTopTemas não encontrado no DOM');
        }
      }
    }

    // Funil por status (reutiliza summary já carregado)
    // CORREÇÃO: Garantir que statusCounts existe e tem estrutura correta
    const statusCounts = (summaryData?.statusCounts || summary?.statusCounts || []).slice(0, 6);
    const funilLabels = statusCounts.map(s => s.status || s.key || 'Não informado');
    const funilValues = statusCounts.map(s => s.count || s.quantidade || 0);
    if (window.chartFunnelStatus instanceof Chart) window.chartFunnelStatus.destroy();
    const chartFunnelStatusEl = document.getElementById('chartFunnelStatus');
    if (chartFunnelStatusEl && funilLabels.length > 0 && funilValues.length > 0) {
      const ctxFunnel = chartFunnelStatusEl.getContext('2d');
      if (ctxFunnel) {
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        // OTIMIZAÇÃO: Usar requestAnimationFrame
        requestAnimationFrame(() => {
          try {
            window.chartFunnelStatus = new Chart(ctxFunnel, {
              type: 'bar',
              data: { labels: funilLabels, datasets: [{ data: funilValues, backgroundColor: ['#22d3ee','#a78bfa','#34d399','#f59e0b','#fb7185','#e879f9'] }] },
              options: { 
                responsive: true, 
                animation: false, // Desabilitar animação
                maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: tooltipFn(), datalabels: dataLabelsFn() }, 
                scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } } 
              }
            });
            addClickFn(window.chartFunnelStatus, (label, value) => showFeedbackFn(null, label, value), 'chartFunnelStatus');
          } catch (error) {
            // FASE 2.1: Usar Logger
            if (window.Logger) {
              window.Logger.error('Erro ao criar gráfico Funil Status:', error);
            } else {
              console.error('❌ Erro ao criar gráfico Funil Status:', error);
            }
          }
        });
      }
    } else {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        if (!statusCounts || statusCounts.length === 0) {
          window.Logger.warn('Elemento chartFunnelStatus não encontrado ou sem dados - banco pode estar vazio');
        } else {
          window.Logger.warn('Elemento chartFunnelStatus não encontrado no DOM');
        }
      } else {
        if (!statusCounts || statusCounts.length === 0) {
          console.warn('⚠️ Elemento chartFunnelStatus não encontrado ou sem dados - banco pode estar vazio');
        } else {
          console.warn('⚠️ Elemento chartFunnelStatus não encontrado no DOM');
        }
      }
    }

    // Sparks e deltas rápidos usando byMonth
    const totalNow = values[values.length-1] || 0;
    const totalPrev = values[values.length-2] || 0;
    const delta = totalPrev ? (((totalNow-totalPrev)/totalPrev)*100).toFixed(1) : 0;
    const deltaEl = document.getElementById('kpiTotalDelta');
    if (deltaEl) deltaEl.textContent = `${delta>=0?'+':''}${delta}% vs mês anterior`;

    // Desenhar sparkline
    if (window.drawSpark) {
      drawSpark('sparkTotal', values.slice(-12), '#22d3ee');
    }

    // Carregar insights com IA e Status Overview em PARALELO (não bloquear se falhar)
    // OTIMIZADO: Passar summary para loadStatusOverview evitar requisição duplicada
    Promise.allSettled([
      loadAIInsights().catch(e => {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.warn('Erro ao carregar insights:', e);
        } else {
          console.warn('Erro ao carregar insights:', e);
        }
      }),
      loadStatusOverview(summaryData).catch(e => {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.warn('Erro ao carregar status overview:', e);
        } else {
          console.warn('Erro ao carregar status overview:', e);
        }
      })
    ]).catch(() => {}); // Ignorar erros, já tratados individualmente
    
    // Insights básicos (fallback)
    const insights = [];
    if (orgaos.length) insights.push(`Maior volume: ${orgaos[0].key} (${orgaos[0].count.toLocaleString('pt-BR')}).`);
    const upIdx = values.length>2 ? values[values.length-1] - values[values.length-2] : 0;
    if (upIdx>0) insights.push(`Crescimento de ${upIdx.toLocaleString('pt-BR')} em relação ao mês anterior.`);
    
    // Buscar dados adicionais para insights básicos (em background, não bloquear)
    // CORREÇÃO: Usar sistema global de carregamento (window.dataLoader)
    Promise.allSettled([
      window.dataLoader?.load('/api/aggregate/by-subject', { fallback: [] }) || Promise.resolve([]),
      window.dataLoader?.load('/api/aggregate/count-by?field=UAC', { fallback: [] }) || Promise.resolve([]),
      window.dataLoader?.load('/api/stats/average-time/stats', { fallback: null }) || Promise.resolve(null)
    ]).then((results) => {
      const assuntos = results[0].status === 'fulfilled' ? results[0].value : [];
      const unidades = results[1].status === 'fulfilled' ? results[1].value : [];
      const tempoMedioStats = results[2].status === 'fulfilled' ? results[2].value : null;
      if (assuntos.length > 0) {
        insights.push(`Assunto mais frequente: ${assuntos[0].assunto} (${assuntos[0].quantidade.toLocaleString('pt-BR')}).`);
      }
      if (unidades.length > 0) {
        insights.push(`Unidade de cadastro com maior volume: ${unidades[0].key} (${unidades[0].count.toLocaleString('pt-BR')}).`);
      }
      if (tempoMedioStats && tempoMedioStats.media) {
        insights.push(`Tempo Médio de Resposta global: ${tempoMedioStats.media.toFixed(1)} dias.`);
      }
      
      const insightsBox = document.getElementById('insightsBox');
      if (insightsBox) {
        insightsBox.innerHTML = insights.length ? insights.map(t=>`<div class="text-slate-400">• ${t}</div>`).join('') : '<div class="text-slate-500">Sem insights básicos no momento.</div>';
      }
    });
    
    // Exibir insights iniciais enquanto carrega os adicionais
    const insightsBox = document.getElementById('insightsBox');
    if (insightsBox) {
      insightsBox.innerHTML = insights.length ? insights.map(t=>`<div>• ${t}</div>`).join('') : '<div class="text-slate-500">Carregando insights...</div>';
    }

    // Heatmap dinâmico - configurar listener se não existir
    const dimSel = document.getElementById('heatmapDim');
    if (dimSel) {
      // Remover listeners antigos para evitar duplicação
      const newDimSel = dimSel.cloneNode(true);
      dimSel.parentNode.replaceChild(newDimSel, dimSel);
      
      // Adicionar listener para carregar heatmap quando dimensão mudar
      newDimSel.addEventListener('change', async function() {
        const dim = this.value || 'Categoria';
        const heatmapContainer = document.getElementById('heatmap');
        if (!heatmapContainer) return;
        
        try {
          heatmapContainer.innerHTML = '<div class="p-4 text-center text-slate-400">Carregando heatmap...</div>';
          const hm = await window.dataLoader?.load(`/api/aggregate/heatmap?dim=${dim}`, { 
            fallback: { labels: [], rows: [] },
            timeout: 30000
          }) || { labels: [], rows: [] };
          
          if (window.buildHeatmap) {
            buildHeatmap('heatmap', hm.labels || [], hm.rows || []);
          }
        } catch (error) {
          // FASE 2.1: Usar Logger
          if (window.Logger) {
            window.Logger.error('Erro ao carregar heatmap:', error);
          } else {
            console.error('❌ Erro ao carregar heatmap:', error);
          }
          heatmapContainer.innerHTML = '<div class="p-4 text-center text-red-400">Erro ao carregar heatmap</div>';
        }
      });
      
      // Disparar evento inicial para carregar com dimensão padrão
      newDimSel.dispatchEvent(new Event('change'));
    }
    
    // Carregar novos gráficos avançados (reutilizar temas e orgaos já carregados)
    if (window.data?.loadAdvancedCharts) {
      await window.data.loadAdvancedCharts(temas, orgaos);
    } else if (window.loadAdvancedCharts) {
      await window.loadAdvancedCharts(temas, orgaos);
    }
  } catch (e) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao renderizar dados da visão geral:', e);
    } else {
      console.error('❌ Erro ao renderizar dados da visão geral:', e);
    }
  }
}

/**
 * Carregar insights com IA
 */
async function loadAIInsights() {
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Usar sistema global de carregamento
    const data = await window.dataLoader?.load('/api/ai/insights', { 
      fallback: null,
      timeout: 60000 // Timeout maior para IA
    }).catch((error) => {
      // Se erro 429 (quota excedida), usar fallback silenciosamente
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.warn('Quota do Gemini excedida, usando insights básicos');
        } else {
          console.warn('⚠️ Quota do Gemini excedida, usando insights básicos');
        }
        return { insights: [], geradoPorIA: false, erro: 'quota_excedida' };
      }
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Erro ao carregar insights:', error);
      } else {
        console.warn('⚠️ Erro ao carregar insights:', error);
      }
      return { insights: [], geradoPorIA: false };
    });
    
    const insightsAIBox = document.getElementById('insightsAIBox');
    if (!insightsAIBox) return;
    
    if (!data || !data.insights || data.insights.length === 0) {
      // Mensagem mais informativa se quota excedida
      if (data && data.erro === 'quota_excedida') {
        insightsAIBox.innerHTML = '<div class="text-center text-slate-400 py-4">Insights básicos disponíveis. Quota da IA temporariamente indisponível.</div>';
      } else {
        insightsAIBox.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum insight disponível no momento.</div>';
      }
      return;
    }
    
    const severidadeColors = {
      alta: 'border-red-500/50 bg-red-500/10',
      media: 'border-amber-500/50 bg-amber-500/10',
      baixa: 'border-blue-500/50 bg-blue-500/10'
    };
    
    const tipoIcons = {
      anomalia: '⚠️',
      tendencia: '📈',
      volume: '📊',
      tempo: '⏱️'
    };
    
    insightsAIBox.innerHTML = data.insights.map(insight => `
      <div class="glass rounded-xl p-4 border ${severidadeColors[insight.severidade] || 'border-white/10'} hover:border-white/20 transition-all">
        <div class="flex items-start gap-3">
          <div class="text-2xl">${tipoIcons[insight.tipo] || '💡'}</div>
          <div class="flex-1">
            <div class="font-semibold text-emerald-300 mb-2">${insight.insight}</div>
            <div class="text-sm text-slate-400 mt-2">
              <div class="font-medium text-cyan-300 mb-1">💡 Recomendação:</div>
              <div>${insight.recomendacao}</div>
            </div>
            ${data.geradoPorIA ? '<div class="text-xs text-slate-500 mt-2">✨ Gerado por IA</div>' : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar insights com IA:', error);
    } else {
      console.error('❌ Erro ao carregar insights com IA:', error);
    }
    const insightsAIBox = document.getElementById('insightsAIBox');
    if (insightsAIBox) {
      insightsAIBox.innerHTML = '<div class="text-center text-red-400 py-4">Erro ao carregar insights. Tente novamente.</div>';
    }
  }
}

/**
 * Carregar Status Overview
 */
async function loadStatusOverview(summaryData = null) {
  // CORREÇÃO FASE 1.3: Adicionar try/catch para tratamento de erros
  try {
    // Se summaryData foi passado, reutilizar (evita requisição duplicada)
    let statusOverview = summaryData;
    
    if (!statusOverview) {
      // Buscar dados se não foram passados
      statusOverview = await window.dataLoader?.load('/api/stats/status-overview', { 
        fallback: { statusCounts: [] }
      }) || { statusCounts: [] };
    }
    
    const statusCounts = statusOverview?.statusCounts || [];
    // CORREÇÃO: O elemento HTML é 'statusOverviewCards', não 'statusOverview'
    const statusOverviewEl = document.getElementById('statusOverviewCards') || document.getElementById('statusOverview');
    
    if (!statusOverviewEl) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.debug('Elemento statusOverviewCards não encontrado (opcional)');
      }
      return;
    }
    
    if (!statusCounts || statusCounts.length === 0) {
      statusOverviewEl.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado de status disponível.</div>';
      return;
    }
    
    // Renderizar cards de status
    const statusColors = {
      'Aberto': 'bg-blue-500/20 border-blue-500/50',
      'Em Andamento': 'bg-amber-500/20 border-amber-500/50',
      'Resolvido': 'bg-emerald-500/20 border-emerald-500/50',
      'Fechado': 'bg-slate-500/20 border-slate-500/50',
      'Cancelado': 'bg-red-500/20 border-red-500/50'
    };
    
    statusOverviewEl.innerHTML = statusCounts.slice(0, 5).map(status => `
      <div class="glass rounded-lg p-4 border ${statusColors[status.status] || 'bg-slate-500/20 border-slate-500/50'}">
        <div class="flex items-center justify-between">
          <div class="font-semibold text-slate-200">${status.status || 'Não informado'}</div>
          <div class="text-2xl font-bold text-cyan-300">${(status.count || 0).toLocaleString('pt-BR')}</div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    // CORREÇÃO FASE 1.3: Tratamento de erro
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar status overview:', error);
    } else {
      console.error('❌ Erro ao carregar status overview:', error);
    }
    const statusOverviewEl = document.getElementById('statusOverview');
    if (statusOverviewEl) {
      statusOverviewEl.innerHTML = '<div class="text-center text-red-400 py-4">Erro ao carregar status. Tente novamente.</div>';
    }
  }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  
  window.data.loadOverview = loadOverview;
  window.data.renderOverviewData = renderOverviewData;
  window.data.loadAIInsights = loadAIInsights;
  window.data.loadStatusOverview = loadStatusOverview;
  
  // Exportar também como variáveis globais para compatibilidade
  window.loadOverview = loadOverview;
  window.renderOverviewData = renderOverviewData;
  window.loadAIInsights = loadAIInsights;
  window.loadStatusOverview = loadStatusOverview;
}

