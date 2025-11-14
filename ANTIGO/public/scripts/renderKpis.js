/**
 * FASE 2.3: Renderização completa de KPIs
 * Extraído de index.html para melhor organização e cache do navegador
 * 
 * Dependências globais (devem estar disponíveis):
 * - createEnhancedTooltip() - definida em index.html ou window.utils
 * - createDataLabelsConfig() - definida em index.html ou window.utils
 * - addChartClickHandler() - definida em index.html ou window.charts
 * - showClickFeedback() - definida em index.html ou window.utils
 * - applyGlobalFilter() - definida em index.html ou window.filters
 * - fetchJSON() - definida em index.html ou window.api
 * - Chart - Chart.js global
 */

// FASE 2.1: Usar Logger se disponível
function logWarn(message, ...args) {
  if (window.Logger) {
    window.Logger.warn(message, ...args);
  } else {
    console.warn(message, ...args);
  }
}

function logError(message, ...args) {
  if (window.Logger) {
    window.Logger.error(message, ...args);
  } else {
    console.error(message, ...args);
  }
}

// Implementação completa de renderização de KPIs
async function renderKpisImplementationFull(sum, dailyData, byMonth) {
  try {
    // CORREÇÃO: Verificar se dados são válidos antes de renderizar
    if (!sum || (sum.total === undefined && sum.last7 === undefined && sum.last30 === undefined)) {
      logWarn('⚠️ renderKpisImplementationFull: Dados inválidos ou vazios, pulando renderização');
      return;
    }
    
    // CORREÇÃO: Verificar se página está visível
    const pageMain = document.getElementById('page-main');
    if (!pageMain || pageMain.style.display === 'none') {
      logWarn('⚠️ renderKpisImplementationFull: Página não está visível, pulando renderização');
      return;
    }
    
    // Atualizar KPIs e adicionar handlers de clique
    const kpiTotalEl = document.getElementById('kpiTotal');
    const kpi7El = document.getElementById('kpi7');
    const kpi30El = document.getElementById('kpi30');
    
    // CORREÇÃO: Só atualizar se valor for válido e diferente do atual (evita sobrescrever com valores vazios)
    if (kpiTotalEl && sum && sum.total !== undefined && sum.total !== null) {
      const newValue = (sum.total ?? 0).toLocaleString('pt-BR');
      // Só atualizar se valor mudou (evita flicker e sobrescrita desnecessária)
      if (kpiTotalEl.textContent !== newValue && kpiTotalEl.textContent !== '—') {
        kpiTotalEl.textContent = newValue;
        kpiTotalEl.style.display = '';
        kpiTotalEl.offsetHeight; // Trigger reflow
      }
      // DESABILITADO: Removido onclick e indicadores de filtro
      // Cards mostram apenas seus próprios dados
    }
    
    // Calcular últimos 7 e 30 dias a partir dos dados diários (mais confiável)
    let calculatedLast7 = sum.last7 ?? 0;
    let calculatedLast30 = sum.last30 ?? 0;
    
    if (dailyData && dailyData.length > 0) {
      // Calcular últimos 7 dias a partir dos dados diários
      const last7Days = dailyData.slice(-7);
      calculatedLast7 = last7Days.reduce((s, d) => s + (d.count || 0), 0);
      
      // Calcular últimos 30 dias a partir dos dados diários
      const last30Days = dailyData.slice(-30);
      calculatedLast30 = last30Days.reduce((s, d) => s + (d.count || 0), 0);
    }
    
    // Usar valores calculados dos dados diários se disponíveis, senão usar do summary
    // CORREÇÃO: Só atualizar se valor for válido e diferente do atual
    if (kpi7El && calculatedLast7 !== undefined && calculatedLast7 !== null) {
      const newValue7 = calculatedLast7.toLocaleString('pt-BR');
      if (kpi7El.textContent !== newValue7 && kpi7El.textContent !== '—') {
        kpi7El.textContent = newValue7;
        kpi7El.style.display = '';
        kpi7El.offsetHeight; // Trigger reflow
      }
    }
    
    if (kpi30El && calculatedLast30 !== undefined && calculatedLast30 !== null) {
      const newValue30 = calculatedLast30.toLocaleString('pt-BR');
      if (kpi30El.textContent !== newValue30 && kpi30El.textContent !== '—') {
        kpi30El.textContent = newValue30;
        kpi30El.style.display = '';
        kpi30El.offsetHeight; // Trigger reflow
      }
    }
    
    // Calcular deltas e sparklines para últimos 7 e 30 dias
    if (dailyData && dailyData.length > 0) {
      // Últimos 7 dias: comparar últimos 7 dias com os 7 dias anteriores
      const last7Days = dailyData.slice(-7);
      const prev7Days = dailyData.slice(-14, -7);
      const last7Sum = last7Days.reduce((s, d) => s + (d.count || 0), 0);
      const prev7Sum = prev7Days.reduce((s, d) => s + (d.count || 0), 0);
      const delta7 = prev7Sum > 0 ? (((last7Sum - prev7Sum) / prev7Sum) * 100).toFixed(1) : 0;
      const delta7El = document.getElementById('kpi7Delta');
      if (delta7El) delta7El.textContent = `${delta7 >= 0 ? '+' : ''}${delta7}% vs período anterior`;
      
      // Últimos 30 dias: comparar últimos 30 dias com os 30 dias anteriores
      const last30Days = dailyData.slice(-30);
      const prev30Days = dailyData.length >= 60 ? dailyData.slice(-60, -30) : [];
      const last30Sum = last30Days.reduce((s, d) => s + (d.count || 0), 0);
      const prev30Sum = prev30Days.length > 0 ? prev30Days.reduce((s, d) => s + (d.count || 0), 0) : 0;
      const delta30 = prev30Sum > 0 ? (((last30Sum - prev30Sum) / prev30Sum) * 100).toFixed(1) : 0;
      const delta30El = document.getElementById('kpi30Delta');
      if (delta30El) delta30El.textContent = `${delta30 >= 0 ? '+' : ''}${delta30}% vs período anterior`;
      
      // Desenhar sparklines
      const drawSpark = (canvasId, data, color) => {
        const c = document.getElementById(canvasId);
        if (!c) return;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        const w = c.width || c.offsetWidth; 
        const h = c.height || 32;
        const max = Math.max(...data.map(d => d.count || 0), 1);
        const step = w / (data.length - 1 || 1);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((d, i) => {
          const x = i * step;
          const y = h - ((d.count || 0) / max) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };
      
      drawSpark('spark7', last7Days, '#a78bfa');
      drawSpark('spark30', last30Days, '#34d399');
    }
    if (sum.statusCounts && sum.statusCounts.length) {
      // Cores para o gráfico (expandido para mais status)
      const colors = [
        '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#f472b6',
        '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#6366f1',
        '#14b8a6', '#eab308', '#ef4444', '#84cc16', '#3b82f6', '#a855f7'
      ];
      
      // Inicializar visibilidade dos status (todos visíveis por padrão)
      if (!window.statusVisibility) {
        window.statusVisibility = {};
        sum.statusCounts.forEach(status => {
          window.statusVisibility[status.status] = true;
        });
      }
      
      // Função para atualizar o gráfico baseado na visibilidade
      const updateStatusChart = () => {
        const visibleStatuses = sum.statusCounts.filter(s => window.statusVisibility[s.status]);
        const visibleLabels = visibleStatuses.map(s => s.status);
        const visibleData = visibleStatuses.map(s => s.count);
        const visibleColors = visibleStatuses.map((s, idx) => {
          const originalIdx = sum.statusCounts.findIndex(orig => orig.status === s.status);
          return colors[originalIdx % colors.length];
        });
        
        // NOVA ESTRATÉGIA: Usar Chart Factory updateChart se disponível
        if (window.chartFactory && window.chartFactory.updateChart && window.chartStatus) {
          window.chartFactory.updateChart('chartStatus', visibleLabels, visibleData, {
            type: 'doughnut',
            colors: visibleColors
          });
        } else if (window.chartStatus instanceof Chart) {
          window.chartStatus.data.labels = visibleLabels;
          window.chartStatus.data.datasets[0].data = visibleData;
          window.chartStatus.data.datasets[0].backgroundColor = visibleColors;
          window.chartStatus.update('active');
        }
      };
      
      // Monta gráfico de status inicialmente com todos os status
      const chartStatusEl = document.getElementById('chartStatus');
      if (!chartStatusEl) return;
      const ctx = chartStatusEl.getContext('2d');
      if (window.chartStatus instanceof Chart) window.chartStatus.destroy();
      
      // Obter funções auxiliares (podem estar definidas em index.html ou módulos)
      const createEnhancedTooltipFn = typeof createEnhancedTooltip === 'function' 
        ? createEnhancedTooltip 
        : (window.utils?.createEnhancedTooltip || (() => ({})));
      const createDataLabelsConfigFn = typeof createDataLabelsConfig === 'function'
        ? createDataLabelsConfig
        : (window.utils?.createDataLabelsConfig || (() => ({})));
      const addChartClickHandlerFn = typeof addChartClickHandler === 'function'
        ? addChartClickHandler
        : (window.charts?.addChartClickHandler || (() => {}));
      const showClickFeedbackFn = typeof showClickFeedback === 'function'
        ? showClickFeedback
        : (window.utils?.showClickFeedback || (() => {}));
      const applyGlobalFilterFn = typeof applyGlobalFilter === 'function'
        ? applyGlobalFilter
        : (window.filters?.applyGlobalFilter || (() => {}));
      
      // NOVA ESTRATÉGIA: Usar Chart Factory se disponível
      const labels = sum.statusCounts.map(s => s.status);
      const values = sum.statusCounts.map(s => s.count);
      const statusColors = sum.statusCounts.map((s, idx) => colors[idx % colors.length]);
      
      if (window.chartFactory && window.chartFactory.createDoughnutChart) {
        window.chartFactory.createDoughnutChart('chartStatus', labels, values, {
          type: 'doughnut',
          colors: statusColors,
          chartOptions: {
            plugins: {
              legend: { display: false },
              tooltip: createEnhancedTooltipFn(),
              datalabels: createDataLabelsConfigFn(true, 'doughnut')
            }
          },
          onClick: (evt, elements, chart) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const label = chart.data.labels[idx];
              const value = chart.data.datasets[0].data[idx];
              // Aplicar filtro inteligente ao clicar (com toggle)
              const virtualElement = { 
                classList: { add: () => {}, remove: () => {} },
                setAttribute: () => {},
                removeAttribute: () => {}
              };
              applyGlobalFilterFn('Status', label, 'chartStatus', virtualElement);
            }
          }
        });
        // Obter referência do gráfico criado (Chart Factory armazena em window[canvasId])
        window.chartStatus = window['chartStatus'];
      } else {
        // Fallback: método antigo
        window.chartStatus = new Chart(ctx, { 
          type: 'doughnut', 
          data: {
            labels: labels,
            datasets: [{ 
              data: values, 
              backgroundColor: statusColors
            }]
          }, 
          options: { 
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false // Desabilitar legenda padrão do Chart.js
              },
              tooltip: createEnhancedTooltipFn(),
              datalabels: createDataLabelsConfigFn(true, 'doughnut')
            },
            onClick: (evt, elements) => {
              if (elements.length > 0) {
                const idx = elements[0].index;
                const label = window.chartStatus.data.labels[idx];
                const value = window.chartStatus.data.datasets[0].data[idx];
                // Aplicar filtro inteligente ao clicar (com toggle)
                const virtualElement = { 
                  classList: { add: () => {}, remove: () => {} },
                  setAttribute: () => {},
                  removeAttribute: () => {}
                };
                applyGlobalFilterFn('Status', label, 'chartStatus', virtualElement);
              }
            }
          } 
        });
      }
      addChartClickHandlerFn(window.chartStatus, (label, value) => showClickFeedbackFn(null, label, value), 'chartStatus');
      
      // Criar legenda customizada organizada com checkboxes
      const legendContainer = document.getElementById('statusLegend');
      if (legendContainer) {
        const total = sum.statusCounts.reduce((acc, s) => acc + s.count, 0);
        
        const renderLegend = () => {
          legendContainer.innerHTML = sum.statusCounts.map((status, idx) => {
            const percent = ((status.count / total) * 100).toFixed(1);
            const color = colors[idx % colors.length];
            const isVisible = window.statusVisibility[status.status];
            
            // Determinar se é encerrada ou ativa (baseado em palavras-chave comuns)
            const statusLower = status.status.toLowerCase();
            const isEncerrada = statusLower.includes('concluída') || statusLower.includes('encerrada') || 
                               statusLower.includes('finalizada') || statusLower.includes('resolvida');
            const isAtiva = statusLower.includes('em atendimento') || statusLower.includes('ativa') || 
                           statusLower.includes('pendente') || statusLower.includes('em andamento');
            
            return `
              <div 
                class="status-legend-item flex items-center gap-2 p-2 rounded hover:bg-white/5 transition-all cursor-pointer border ${isVisible ? 'border-transparent opacity-100' : 'border-white/20 opacity-40'}"
                data-status="${status.status.replace(/"/g, '&quot;')}"
              >
                <div 
                  class="w-4 h-4 rounded flex-shrink-0 border-2 transition-all relative ${isVisible ? 'border-white/30' : 'border-white/50'}" 
                  style="background-color: ${isVisible ? color : 'transparent'}; ${!isVisible ? `border-color: ${color}; border-style: dashed;` : ''}"
                >
                  ${isVisible ? '' : '<div class="w-full h-0.5 bg-white/50 absolute top-1/2 left-0 transform rotate-45"></div>'}
                </div>
                <div class="flex-1 min-w-0 ${!isVisible ? 'line-through' : ''}">
                  <div class="text-slate-300 truncate" title="${status.status}">${status.status}</div>
                  <div class="text-slate-500 text-[10px]">${status.count.toLocaleString('pt-BR')} (${percent}%)</div>
                </div>
              </div>
            `;
          }).join('');
          
          // Adicionar event listeners após renderizar
          legendContainer.querySelectorAll('.status-legend-item').forEach((item) => {
            item.addEventListener('click', () => {
              const statusName = item.getAttribute('data-status');
              window.statusVisibility[statusName] = !window.statusVisibility[statusName];
              updateStatusChart();
              renderLegend();
            });
          });
        };
        
        renderLegend();
        
        // Event listeners para os botões
        const btnMarcarTodos = document.getElementById('btnMarcarTodosStatus');
        const btnDesmarcarTodos = document.getElementById('btnDesmarcarTodosStatus');
        
        if (btnMarcarTodos) {
          btnMarcarTodos.addEventListener('click', () => {
            sum.statusCounts.forEach(status => {
              window.statusVisibility[status.status] = true;
            });
            updateStatusChart();
            renderLegend();
          });
        }
        
        if (btnDesmarcarTodos) {
          btnDesmarcarTodos.addEventListener('click', () => {
            sum.statusCounts.forEach(status => {
              window.statusVisibility[status.status] = false;
            });
            updateStatusChart();
            renderLegend();
          });
        }
      }
      
      // Remover skeleton após carregar
      document.getElementById('chartStatus').classList.remove('skeleton');
    }
    // Série temporal mensal 12M (usar byMonth já obtido)
    const monthCanvas = document.getElementById('chartMonth');
    if (monthCanvas) {
      const ctxM = monthCanvas.getContext('2d');
      if (window.chartMonth instanceof Chart) window.chartMonth.destroy();
      
      // Formatar labels do mês corretamente
      const monthLabels = byMonth.map(x => {
        const ym = x.ym || x.month || '';
        if (!ym || typeof ym !== 'string') return '';
        const parts = ym.split('-');
        if (parts.length < 2) return ym;
        const [year, month] = parts;
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return month ? (monthNames[parseInt(month) - 1] + '/' + year.slice(2)) : ym;
      });
      
      const createEnhancedTooltipFn = typeof createEnhancedTooltip === 'function' 
        ? createEnhancedTooltip 
        : (window.utils?.createEnhancedTooltip || (() => ({})));
      const createDataLabelsConfigFn = typeof createDataLabelsConfig === 'function'
        ? createDataLabelsConfig
        : (window.utils?.createDataLabelsConfig || (() => ({})));
      const addChartClickHandlerFn = typeof addChartClickHandler === 'function'
        ? addChartClickHandler
        : (window.charts?.addChartClickHandler || (() => {}));
      const showClickFeedbackFn = typeof showClickFeedback === 'function'
        ? showClickFeedback
        : (window.utils?.showClickFeedback || (() => {}));
      
      // NOVA ESTRATÉGIA: Usar Chart Factory se disponível
      const monthLabelsFiltered = monthLabels.filter(l => l);
      const monthValues = byMonth.filter(x => x.ym).map(x => x.count);
      
      if (window.chartFactory && window.chartFactory.createBarChart) {
        window.chartFactory.createBarChart('chartMonth', monthLabelsFiltered, monthValues, {
          label: 'Manifestações',
          colorIndex: 1, // Cor violet
          chartOptions: {
            plugins: {
              tooltip: createEnhancedTooltipFn(),
              datalabels: createDataLabelsConfigFn(false, 'bar', false)
            },
            scales: {
              x: { ticks: { maxRotation: 45, minRotation: 45 } }
            }
          },
          onClick: (event, elements, chart) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              const label = chart.data.labels[index];
              const value = chart.data.datasets[0].data[index];
              showClickFeedbackFn(null, label, value);
            }
          }
        });
        // Obter referência do gráfico criado (Chart Factory armazena em window[canvasId])
        window.chartMonth = window['chartMonth'];
      } else {
        // Fallback: método antigo
        window.chartMonth = new Chart(ctxM, { 
          type:'bar', 
          data:{ 
            labels: monthLabelsFiltered, 
            datasets:[{ 
              data: monthValues, 
              backgroundColor: 'rgba(167,139,250,0.6)',
              borderColor: 'rgba(167,139,250,1)',
              borderWidth: 1
            }] 
          }, 
          options:{ 
            responsive:true,
            plugins: {
              tooltip: createEnhancedTooltipFn(),
              datalabels: createDataLabelsConfigFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          } 
        });
      }
      addChartClickHandlerFn(window.chartMonth, (label, value) => showClickFeedbackFn(null, label, value), 'chartMonth');
      // Remover skeleton após carregar
      monthCanvas.classList.remove('skeleton');
    }
    
    // SLA chart
    // NOVA ESTRATÉGIA: Usar dataLoader em vez de fetch direto
    let sla = { concluidos: 0, verdeClaro: 0, amarelo: 0, vermelho: 0 };
    try {
      sla = await window.dataLoader?.load('/api/sla/summary', { fallback: sla }) || sla;
    } catch (e) {
      logWarn('⚠️ Erro ao carregar SLA summary, usando valores padrão:', e);
    }
    const chartSlaEl = document.getElementById('chartSla');
    if (chartSlaEl) {
      const ctxS = chartSlaEl.getContext('2d');
      if (window.chartSla instanceof Chart) window.chartSla.destroy();
      
      const createEnhancedTooltipFn = typeof createEnhancedTooltip === 'function' 
        ? createEnhancedTooltip 
        : (window.utils?.createEnhancedTooltip || (() => ({})));
      const createDataLabelsConfigFn = typeof createDataLabelsConfig === 'function'
        ? createDataLabelsConfig
        : (window.utils?.createDataLabelsConfig || (() => ({})));
      const addChartClickHandlerFn = typeof addChartClickHandler === 'function'
        ? addChartClickHandler
        : (window.charts?.addChartClickHandler || (() => {}));
      const showClickFeedbackFn = typeof showClickFeedback === 'function'
        ? showClickFeedback
        : (window.utils?.showClickFeedback || (() => {}));
      
      // NOVA ESTRATÉGIA: Usar Chart Factory se disponível
      const slaLabels = ['Concluídos', 'Verde Claro (0-30d)', 'Amarelo (31-60d)', 'Vermelho (61+d)'];
      const slaValues = [sla.concluidos||0, sla.verdeClaro||0, sla.amarelo||0, sla.vermelho||0];
      const slaColors = ['#059669','#86efac','#fbbf24','#fb7185'];
      
      if (window.chartFactory && window.chartFactory.createBarChart) {
        // Para gráfico com cores customizadas, usar múltiplos datasets ou criar manualmente
        // Como Chart Factory não suporta cores por barra diretamente, usar fallback ou criar dataset customizado
        window.chartFactory.createBarChart('chartSla', slaLabels, slaValues, {
          label: 'SLA',
          colorIndex: 2, // Cor verde como padrão
          chartOptions: {
            plugins: {
              legend: { display: false },
              tooltip: createEnhancedTooltipFn(),
              datalabels: createDataLabelsConfigFn(false, 'bar', false)
            },
            scales: {
              x: { ticks: { maxRotation: 45, minRotation: 45 } }
            }
          },
          onClick: (event, elements, chart) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              const label = chart.data.labels[index];
              const value = chart.data.datasets[0].data[index];
              showClickFeedbackFn(null, label, value);
            }
          }
        });
        // Aplicar cores customizadas após criação (Chart Factory armazena em window[canvasId])
        const chartSlaInstance = window['chartSla'];
        if (chartSlaInstance && chartSlaInstance.data && chartSlaInstance.data.datasets[0]) {
          chartSlaInstance.data.datasets[0].backgroundColor = slaColors;
          chartSlaInstance.data.datasets[0].borderColor = slaColors;
          chartSlaInstance.update();
        }
        window.chartSla = chartSlaInstance;
      } else {
        // Fallback: método antigo
        window.chartSla = new Chart(ctxS, {
          type: 'bar',
          data: {
            labels: slaLabels,
            datasets: [{
              data: slaValues,
              backgroundColor: slaColors,
              borderColor: slaColors,
              borderWidth: 1
            }]
          },
          options: { 
            responsive: true, 
            plugins: { 
              legend: { display: false },
              tooltip: createEnhancedTooltipFn(),
              datalabels: createDataLabelsConfigFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
      addChartClickHandlerFn(window.chartSla, (label, value) => showClickFeedbackFn(null, label, value));
      // Remover skeleton após carregar
      chartSlaEl.classList.remove('skeleton');
    }
  } catch (error) {
    // CORREÇÃO: Tratamento de erro para não bloquear renderização completa
    logError('❌ Erro ao renderizar KPIs completos:', error);
    // Garantir que pelo menos os números básicos sejam renderizados
    const kpiTotalEl = document.getElementById('kpiTotal');
    const kpi7El = document.getElementById('kpi7');
    const kpi30El = document.getElementById('kpi30');
    if (kpiTotalEl && sum) kpiTotalEl.textContent = (sum.total ?? 0).toLocaleString('pt-BR');
    if (kpi7El && sum) kpi7El.textContent = (sum.last7 ?? 0).toLocaleString('pt-BR');
    if (kpi30El && sum) kpi30El.textContent = (sum.last30 ?? 0).toLocaleString('pt-BR');
  }
}

// Exportar para window para compatibilidade
window.renderKpisImplementationFull = renderKpisImplementationFull;



