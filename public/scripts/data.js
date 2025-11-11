/**
 * Data Module - Funções de carregamento de dados
 * Centraliza todas as funções load*() que buscam e renderizam dados
 */

// Variáveis globais para estado
let currentTableData = [];
let currentTableHeaders = [];

/**
 * Recarregar todos os dados com filtros aplicados
 */
async function reloadAllData() {
  const currentPage = document.querySelector('[data-page].active')?.getAttribute('data-page') || 'main';
  
  // Recarregar dados da página principal
  if (currentPage === 'main' || currentPage === '') {
    if (window.data?.loadOverview) {
      await window.data.loadOverview();
    }
  }
  
  // Recarregar dados específicos da página atual
  const pageLoaders = {
    'orgao-mes': () => window.data?.loadOrgaoMes?.(),
    'tempo-medio': () => window.data?.loadTempoMedio?.(),
    'tema': () => window.data?.loadTema?.(),
    'assunto': () => window.data?.loadAssunto?.(),
    'cadastrante': () => window.data?.loadCadastrante?.(),
    'reclamacoes': () => window.data?.loadReclamacoes?.(),
    'projecao-2026': () => window.data?.loadProjecao2026?.(),
    'status': () => window.data?.loadStatusPage?.(),
    'bairro': () => window.data?.loadBairro?.(),
    'uac': () => window.data?.loadUAC?.(),
    'responsavel': () => window.data?.loadResponsavel?.(),
    'canal': () => window.data?.loadCanal?.(),
    'prioridade': () => window.data?.loadPrioridade?.(),
    'categoria': () => window.data?.loadCategoria?.()
  };
  
  const loader = pageLoaders[currentPage];
  if (loader) {
    await loader();
  }
  
  // Atualizar realces visuais após recarregar dados
  setTimeout(() => {
    if (window.filters?.updateAllFilterHighlights) {
      window.filters.updateAllFilterHighlights();
    }
  }, 100);
}

/**
 * Carregar insights com IA
 */
async function loadAIInsights() {
  try {
    // Usar fetch direto (sem filtros) para insights
    const fetchFn = window.api?.fetchJSON || fetchJSON;
    const data = await fetchFn('/api/ai/insights').catch((error) => {
      // Se erro 429 (quota excedida), usar fallback silenciosamente
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        console.warn('⚠️ Quota do Gemini excedida, usando insights básicos');
        return { insights: [], geradoPorIA: false, erro: 'quota_excedida' };
      }
      console.warn('⚠️ Erro ao carregar insights:', error);
      return { insights: [], geradoPorIA: false };
    });
    
    const insightsAIBox = document.getElementById('insightsAIBox');
    if (!insightsAIBox) return;
    
    if (!data.insights || data.insights.length === 0) {
      // Mensagem mais informativa se quota excedida
      if (data.erro === 'quota_excedida') {
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
    console.error('❌ Erro ao carregar insights com IA:', error);
    const insightsAIBox = document.getElementById('insightsAIBox');
    if (insightsAIBox) {
      insightsAIBox.innerHTML = '<div class="text-center text-red-400 py-4">Erro ao carregar insights. Tente novamente.</div>';
    }
  }
}

/**
 * Carregar Status Overview
 */
async function loadStatusOverview() {
  try {
    // OTIMIZAÇÃO: Usar fetch direto (sem filtros) para melhor performance
    // Verificar se há filtros ativos - se não houver, usar fetch direto
    const hasFilters = window.globalFilters?.filters?.length > 0;
    let statusData;
    
    if (hasFilters) {
      // Se há filtros, usar fetchJSONWithFilter
      const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
      statusData = await fetchFn('/api/stats/status-overview').catch(() => null);
    } else {
      // Se não há filtros, usar fetch direto (mais rápido)
      try {
        const res = await fetch('/api/stats/status-overview', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          statusData = await res.json();
        } else {
          statusData = null;
        }
      } catch (e) {
        statusData = null;
      }
    }
    const statusCards = document.getElementById('statusOverviewCards');
    if (!statusCards) return;
    
    if (!statusData || !statusData.total) {
      statusCards.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum dado disponível</div>';
      return;
    }
    
    const cards = [
      {
        label: 'Total',
        value: statusData.total?.quantidade || 0,
        color: 'cyan',
        icon: '📊'
      },
      {
        label: 'Concluídas',
        value: statusData.concluida?.quantidade || 0,
        percent: statusData.concluida?.percentual || 0,
        color: 'emerald',
        icon: '✅'
      },
      {
        label: 'Em Atendimento',
        value: statusData.emAtendimento?.quantidade || 0,
        percent: statusData.emAtendimento?.percentual || 0,
        color: 'amber',
        icon: '⏳'
      },
      {
        label: 'Pendentes',
        value: statusData.pendente?.quantidade || 0,
        percent: statusData.pendente?.percentual || 0,
        color: 'rose',
        icon: '📋'
      }
    ];
    
    const colorClasses = {
      cyan: { border: 'border-cyan-500/20', borderHover: 'hover:border-cyan-500/40', text: 'text-cyan-300' },
      emerald: { border: 'border-emerald-500/20', borderHover: 'hover:border-emerald-500/40', text: 'text-emerald-300' },
      amber: { border: 'border-amber-500/20', borderHover: 'hover:border-amber-500/40', text: 'text-amber-300' },
      rose: { border: 'border-rose-500/20', borderHover: 'hover:border-rose-500/40', text: 'text-rose-300' }
    };
    
    statusCards.innerHTML = cards.map(card => {
      const colors = colorClasses[card.color] || colorClasses.cyan;
      const filterFieldMap = {
        'Total': null,
        'Concluídas': 'Status',
        'Em Atendimento': 'Status',
        'Pendentes': 'Status'
      };
      const filterField = filterFieldMap[card.label];
      const canFilter = filterField !== null;
      
      const isActive = window.globalFilters?.filters?.some(f => f.field === filterField && f.value === card.label) || false;
      const cardId = `status-card-${card.label.replace(/\s+/g, '-').toLowerCase()}`;
      
      return `
        <div id="${cardId}" class="glass rounded-xl p-4 border ${colors.border} ${colors.borderHover} transition-all ${canFilter ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${isActive ? 'filter-active border-cyan-500/60 bg-cyan-500/10' : ''}" 
             ${canFilter ? `onclick="const el = document.getElementById('${cardId}'); if(window.filters?.applyGlobalFilter) window.filters.applyGlobalFilter('${filterField}', '${card.label}', null, el);"` : ''}
             title="${canFilter ? (isActive ? 'Clique novamente para remover o filtro' : 'Clique para filtrar por ' + card.label) : ''}">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs text-slate-400 font-medium">${card.label}</div>
            <div class="flex items-center gap-2">
              ${isActive ? '<span class="text-cyan-400 text-sm">✓</span>' : ''}
              <div class="text-xl">${card.icon}</div>
            </div>
          </div>
          <div class="text-2xl font-bold ${colors.text}">${(card.value || 0).toLocaleString('pt-BR')}</div>
          ${card.percent !== undefined ? `<div class="text-xs text-slate-400 mt-1">${card.percent.toFixed(1)}%</div>` : ''}
          ${canFilter ? `<div class="text-xs ${isActive ? 'text-cyan-400' : 'text-cyan-400 opacity-0 group-hover:opacity-100'} mt-2 transition-opacity">${isActive ? '✓ Filtro ativo - Clique para remover' : '🔍 Clique para filtrar'}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('❌ Erro ao carregar Status Overview:', error);
    const statusCards = document.getElementById('statusOverviewCards');
    if (statusCards) {
      statusCards.innerHTML = '<div class="text-center text-red-400 py-4">Erro ao carregar dados</div>';
    }
  }
}

/**
 * Carregar tabela de registros
 */
async function loadTable(limit = 50) {
  try {
    const pageSize = limit === 'all' ? 10000 : parseInt(limit) || 50;
    const fetchFn = window.api?.fetchJSON || fetchJSON;
    const data = await fetchFn(`/api/records?page=1&pageSize=${pageSize}`);
    const rows = data.rows || [];
    currentTableData = rows;
    
    const tbody = document.getElementById('tbody');
    const thead = document.getElementById('thead');
    const tableInfo = document.getElementById('tableInfo');
    
    if (!tbody || !thead) {
      console.warn('Elementos da tabela não encontrados (pode não estar na página atual)');
      return;
    }
    
    tbody.innerHTML = '';
    thead.innerHTML = '';
      
    if (rows.length === 0) {
      if (tableInfo) tableInfo.textContent = 'Nenhum registro encontrado';
      return;
    }
      
    const first = rows[0].data || {};
    const keys = Object.keys(first);
    currentTableHeaders = keys;
      
    // Ordenar colunas por importância
    const priorityOrder = ['protocolo', 'data_da_criacao', 'status_demanda', 'tipo_de_manifestacao', 
      'tema', 'assunto', 'orgaos', 'unidade_cadastro', 'responsavel', 'canal', 'prioridade', 'status'];
    const sortedKeys = [...priorityOrder.filter(k => keys.includes(k)), ...keys.filter(k => !priorityOrder.includes(k))];
      
    for (const k of sortedKeys) {
      const th = document.createElement('th'); 
      th.textContent = k; 
      th.className = 'px-3 py-2 text-left font-semibold text-slate-300 sticky top-0 bg-slate-900/95'; 
      thead.appendChild(th);
    }
      
    for (const r of rows) {
      const tr = document.createElement('tr'); 
      tr.className = 'hover:bg-white/5 transition-colors duration-100';
      for (const k of sortedKeys) {
        const td = document.createElement('td'); 
        const value = r.data?.[k] ?? '';
        td.textContent = value; 
        td.className = 'px-3 py-2 text-slate-300'; 
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
      
    if (tableInfo) {
      tableInfo.textContent = `Mostrando ${rows.length} de ${data.total || rows.length} registros`;
    }
  } catch (error) {
    console.error('Erro ao carregar tabela:', error);
    const tableInfo = document.getElementById('tableInfo');
    if (tableInfo) {
      tableInfo.textContent = 'Erro ao carregar dados';
    }
  }
}

/**
 * Carregar KPIs com dados já obtidos (evita requisições duplicadas)
 */
async function loadKpisWithData(sum, dailyData, byMonth = null) {
  // Se byMonth não foi fornecido, buscar (para compatibilidade)
  if (!byMonth) {
    const fetchFn = window.api?.fetchJSONWithFilter;
    if (fetchFn) {
      byMonth = await fetchFn('/api/aggregate/by-month');
    } else {
      console.warn('API module não disponível para buscar byMonth');
      return;
    }
  }
  // Chamar implementação diretamente para evitar loops
  // Preferir window.renderKpisImplementation se disponível
  if (typeof window.renderKpisImplementation === 'function') {
    await window.renderKpisImplementation(sum, dailyData, byMonth);
  } else if (window.data?.renderKpis) {
    // Usar wrapper do módulo (que também chama a implementação)
    await window.data.renderKpis(sum, dailyData, byMonth);
  } else {
    console.warn('Função renderKpis não disponível');
  }
}

/**
 * Renderizar KPIs (função wrapper que chama a implementação real do index.html)
 * IMPORTANTE: Evitar loop infinito - chamar diretamente a implementação
 */
async function renderKpis(sum, dailyData, byMonth) {
  // Chamar implementação real diretamente (evita loop)
  // NUNCA chamar window.renderKpis aqui para evitar loop infinito
  if (typeof window.renderKpisImplementation === 'function') {
    return await window.renderKpisImplementation(sum, dailyData, byMonth);
  }
  
  // Se implementação não estiver disponível, apenas avisar
  // NÃO chamar window.renderKpis para evitar loop infinito
  console.warn('⚠️ Loop infinito detectado em renderKpis, usando implementação direta');
  console.warn('Função renderKpisImplementation não disponível no window');
}

/**
 * Carregar KPIs (busca dados)
 */
async function loadKpis(defaultCountField, defaultDateField) {
  const fetchFn = window.api?.fetchJSONWithFilters;
  const fetchFn2 = window.api?.fetchJSONWithFilter;
  
  if (!fetchFn || !fetchFn2) {
    console.warn('API module não disponível');
    return;
  }
  
  const [sum, dailyData, byMonth] = await Promise.all([
    fetchFn('/api/summary'),
    fetchFn('/api/aggregate/by-day').catch(() => []),
    fetchFn2('/api/aggregate/by-month')
  ]);
  
  // Chamar implementação diretamente para evitar loops
  // Preferir window.renderKpisImplementation se disponível
  if (typeof window.renderKpisImplementation === 'function') {
    await window.renderKpisImplementation(sum, dailyData, byMonth);
  } else if (window.data?.renderKpis) {
    // Usar wrapper do módulo (que também chama a implementação)
    await window.data.renderKpis(sum, dailyData, byMonth);
  } else {
    console.warn('Função renderKpis não disponível');
  }
}

/**
 * Função auxiliar: Desenhar sparkline
 */
function drawSpark(canvasId, data, color) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  const w = c.width || c.offsetWidth;
  const h = c.height || 32;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1 || 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = h - (v / max) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

/**
 * Função auxiliar: Desenhar sparkline para dados diários
 */
function drawSparkDaily(canvasId, data, color) {
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
}

/**
 * Carregar Visão Geral completa (Overview)
 * Função principal que carrega todos os dados e gráficos da página principal
 */
async function loadOverview() {
  try {
    // Verificar se a página está visível
    const overviewPage = document.getElementById('page-main') || document.querySelector('[data-page="main"]');
    if (!overviewPage || overviewPage.style.display === 'none') {
      console.warn('⚠️ Página de visão geral não está visível, aguardando...');
      // Aguardar um pouco e tentar novamente
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryPage = document.getElementById('page-main') || document.querySelector('[data-page="main"]');
      if (!retryPage || retryPage.style.display === 'none') {
        console.warn('⚠️ Página ainda não está visível, pulando carregamento');
        return;
      }
    }
    
    // CORREÇÃO CRÍTICA: Desabilitar TODOS os filtros e limpar cache
    // Limpar filtros completamente
    if (window.globalFilters) {
      console.log('🧹 Limpando filtros e cache...');
      window.globalFilters.filters = [];
      window.globalFilters.activeField = null;
      window.globalFilters.activeValue = null;
    }
    
    // Limpar cache da API
    if (window.api?.clearApiCache) {
      window.api.clearApiCache();
      console.log('🧹 Cache da API limpo');
    }
    
    // Função auxiliar para buscar dados (SEMPRE usar fetch direto, SEM cache, SEM filtros)
    const fetchData = async (url, fallback = []) => {
      try {
        // Usar fetch nativo DIRETO, sem passar por nenhuma camada de cache ou filtro
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : (data?.total || Object.keys(data || {}).length || 0);
        console.log(`✅ ${url}: ${count} itens recebidos (fetch direto)`);
        return data;
      } catch (e) {
        console.error(`❌ Erro ao buscar ${url}:`, e.message || e);
          return fallback;
      }
    };
    
    // OTIMIZAÇÃO: Usar Promise.allSettled para não parar se uma requisição falhar
    const results = await Promise.allSettled([
      fetchData('/api/summary', { total: 0, last7: 0, last30: 0, statusCounts: [] }),
      fetchData('/api/aggregate/by-month', []),
      fetchData('/api/aggregate/count-by?field=Orgaos', []),
      fetchData('/api/aggregate/by-theme', []),
      fetchData('/api/aggregate/by-day', [])
    ]);
    
    // Extrair dados dos resultados (usar fallback se falhou)
    const summary = results[0].status === 'fulfilled' ? results[0].value : { total: 0, last7: 0, last30: 0, statusCounts: [] };
    const byMonth = results[1].status === 'fulfilled' ? results[1].value : [];
    const orgaos = results[2].status === 'fulfilled' ? results[2].value : [];
    const temas = results[3].status === 'fulfilled' ? results[3].value : [];
    const dailyData = results[4].status === 'fulfilled' ? results[4].value : [];
    
    // DEBUG: Log detalhado dos dados recebidos
    console.log('📊 Dados recebidos em loadOverview:', {
      summary: summary?.total || 0,
      summaryKeys: Object.keys(summary || {}),
      byMonth: byMonth?.length || 0,
      orgaos: orgaos?.length || 0,
      temas: temas?.length || 0,
      dailyData: dailyData?.length || 0,
      hasFilters: window.globalFilters?.filters?.length || 0,
      filters: window.globalFilters?.filters || []
    });
    
    // Verificar se há erros nas requisições
    results.forEach((result, index) => {
      const urls = ['/api/summary', '/api/aggregate/by-month', '/api/aggregate/count-by?field=Orgaos', '/api/aggregate/by-theme', '/api/aggregate/by-day'];
      if (result.status === 'rejected') {
        console.error(`❌ Requisição ${index} (${urls[index]}) falhou:`, result.reason);
      } else if (result.status === 'fulfilled') {
        const data = result.value;
        const count = Array.isArray(data) ? data.length : (data?.total || Object.keys(data || {}).length);
        console.log(`✅ Requisição ${index} (${urls[index]}) sucesso: ${count} itens`);
      }
    });
    
    // Carregar KPIs com dados já obtidos (evita requisição duplicada)
    await loadKpisWithData(summary, dailyData, byMonth);
    
    // Guardar summary para reutilizar
    let summaryData = summary;

    // Processar dados de tendência mensal
    const labels = byMonth && byMonth.length > 0 ? byMonth.map(x => {
      const ym = x.ym || x.month || '';
      // OTIMIZADO: Usar dateUtils centralizado
      return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
    }) : [];
    const values = byMonth && byMonth.length > 0 ? byMonth.map(x => x.count || 0) : [];
    
    // DEBUG: Log dos dados processados
    console.log('📈 Dados de tendência processados:', {
      labelsCount: labels.length,
      valuesCount: values.length,
      firstLabel: labels[0],
      firstValue: values[0]
    });
    
    // Gráfico de tendência (otimizado)
    if (window.chartTrend instanceof Chart) window.chartTrend.destroy();
    const chartTrendEl = document.getElementById('chartTrend');
    if (chartTrendEl) {
      const ctxTrend = chartTrendEl.getContext('2d');
    if (ctxTrend) {
        if (labels.length === 0 || values.length === 0) {
          console.warn('⚠️ Elemento chartTrend encontrado mas sem dados (labels ou values vazios)');
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
              console.log('✅ Gráfico de tendência criado');
            } catch (error) {
              console.error('❌ Erro ao criar gráfico de tendência:', error);
            }
          });
        }
      } else {
        console.warn('⚠️ Contexto chartTrend não encontrado');
      }
    } else {
      console.warn('⚠️ Elemento chartTrend não encontrado no DOM');
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
            console.log('✅ Gráfico Top Órgãos criado');
          } catch (error) {
            console.error('❌ Erro ao criar gráfico Top Órgãos:', error);
          }
        });
      }
    } else {
      console.warn('⚠️ Elemento chartTopOrgaos não encontrado ou sem dados');
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
            console.log('✅ Gráfico Top Temas criado');
          } catch (error) {
            console.error('❌ Erro ao criar gráfico Top Temas:', error);
          }
        });
      }
    } else {
      console.warn('⚠️ Elemento chartTopTemas não encontrado ou sem dados');
    }

    // Funil por status (reutiliza summary já carregado)
    const statusCounts = (summaryData.statusCounts || []).slice(0, 6);
    const funilLabels = statusCounts.map(s => s.status);
    const funilValues = statusCounts.map(s => s.count);
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
            console.log('✅ Gráfico Funil Status criado');
          } catch (error) {
            console.error('❌ Erro ao criar gráfico Funil Status:', error);
          }
        });
      }
    } else {
      console.warn('⚠️ Elemento chartFunnelStatus não encontrado ou sem dados');
    }

    // Sparks e deltas rápidos usando byMonth
    const totalNow = values[values.length-1] || 0;
    const totalPrev = values[values.length-2] || 0;
    const delta = totalPrev ? (((totalNow-totalPrev)/totalPrev)*100).toFixed(1) : 0;
    const deltaEl = document.getElementById('kpiTotalDelta');
    if (deltaEl) deltaEl.textContent = `${delta>=0?'+':''}${delta}% vs mês anterior`;

    // Desenhar sparkline
    drawSpark('sparkTotal', values.slice(-12), '#22d3ee');

    // Carregar insights com IA e Status Overview em PARALELO (não bloquear se falhar)
    Promise.allSettled([
      loadAIInsights().catch(e => console.warn('Erro ao carregar insights:', e)),
      loadStatusOverview().catch(e => console.warn('Erro ao carregar status overview:', e))
    ]).catch(() => {}); // Ignorar erros, já tratados individualmente
    
    // Insights básicos (fallback)
    const insights = [];
    if (orgaos.length) insights.push(`Maior volume: ${orgaos[0].key} (${orgaos[0].count.toLocaleString('pt-BR')}).`);
    const upIdx = values.length>2 ? values[values.length-1] - values[values.length-2] : 0;
    if (upIdx>0) insights.push(`Crescimento de ${upIdx.toLocaleString('pt-BR')} em relação ao mês anterior.`);
    
    // Buscar dados adicionais para insights básicos (em background, não bloquear)
    // OTIMIZAÇÃO: Usar fetch direto (sem filtros) para melhor performance
    Promise.allSettled([
      fetchData('/api/aggregate/by-subject', []),
      fetchData('/api/aggregate/count-by?field=UAC', []),
      fetchData('/api/stats/average-time/stats', null)
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

    // Heatmap dinâmico já conectado ao seletor (reuso existente)
    const dimSel = document.getElementById('heatmapDim');
    if (dimSel) dimSel.dispatchEvent(new Event('change'));
    
    // Carregar novos gráficos avançados (reutilizar temas e orgaos já carregados)
    await loadAdvancedCharts(temas, orgaos);
  } catch (e) {
    console.error('Erro ao carregar Visão Geral', e);
  }
}

/**
 * Carregar gráficos avançados (Sankey, TreeMap, Mapa)
 */
async function loadAdvancedCharts(temas = null, orgaos = null) {
  try {
    // OTIMIZAÇÃO: Usar fetch direto (sem filtros) quando não há filtros ativos
    // Função auxiliar para buscar dados (SEM filtros para melhor performance)
    const fetchDataDirect = async (url, fallback = []) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (e) {
        console.warn(`⚠️ ${url}: ${e.message || e}`);
        return fallback;
      }
    };
    
    // Se temas e orgaos já foram carregados, reutilizar (evita requisições duplicadas)
    // OTIMIZAÇÃO: Usar Promise.allSettled para não parar se uma requisição falhar
    const results = await Promise.allSettled([
      temas ? Promise.resolve(temas) : fetchDataDirect('/api/aggregate/by-theme', []),
      orgaos ? Promise.resolve(orgaos) : fetchDataDirect('/api/aggregate/count-by?field=Orgaos', []),
      fetchDataDirect('/api/aggregate/count-by?field=status', []),
      fetchDataDirect('/api/aggregate/count-by?field=Bairro', [])
    ]);
    
    const temasData = results[0].status === 'fulfilled' ? results[0].value : (temas || []);
    const orgaosData = results[1].status === 'fulfilled' ? results[1].value : (orgaos || []);
    const status = results[2].status === 'fulfilled' ? results[2].value : [];
    const bairros = results[3].status === 'fulfilled' ? results[3].value : [];
    
    const temasFinal = temasData || temas;
    const orgaosFinal = orgaosData || orgaos;
    
    // 1. Sankey Diagram: Tema → Órgão → Status
    await loadSankeyChart(temasFinal, orgaosFinal, status);
    
    // 2. TreeMap: Proporção por Categoria
    await loadTreeMapChart(temasFinal);
    
    // 3. Mapa de Calor Geográfico: Bairros
    await loadGeographicMap(bairros);
  } catch (error) {
    console.error('❌ Erro ao carregar gráficos avançados:', error);
  }
}

/**
 * Criar Sankey Diagram
 */
async function loadSankeyChart(temas, orgaos, status) {
  try {
    if (typeof Plotly === 'undefined') {
      console.warn('Plotly.js não carregado');
      return;
    }
    
    // OTIMIZAÇÃO: Usar fetch direto (sem filtros) para melhor performance
    let flowData = null;
    try {
      const res = await fetch('/api/aggregate/sankey-flow', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        flowData = await res.json();
      }
    } catch (e) {
      // Ignorar erro silenciosamente
    }
    
    if (!flowData || !flowData.nodes || !flowData.links) {
      // Fallback: usar dados agregados
      const topTemas = temas.slice(0, 5);
      const topOrgaos = orgaos.slice(0, 5);
      const topStatus = status.slice(0, 3);
      
      const labels = [
        ...topTemas.map(t => t.tema || 'Não informado'),
        ...topOrgaos.map(o => o.key || 'Não informado'),
        ...topStatus.map(s => s.key || 'Não informado')
      ];
      
      const temaIndices = topTemas.map((_, i) => i);
      const orgaoIndices = topOrgaos.map((_, i) => topTemas.length + i);
      const statusIndices = topStatus.map((_, i) => topTemas.length + topOrgaos.length + i);
      
      const source = [];
      const target = [];
      const value = [];
      
      topTemas.forEach((tema, tIdx) => {
        topOrgaos.forEach((orgao, oIdx) => {
          source.push(temaIndices[tIdx]);
          target.push(orgaoIndices[oIdx]);
          value.push(Math.round((tema.quantidade || 0) * (orgao.count || 0) / 1000));
        });
      });
      
      topOrgaos.forEach((orgao, oIdx) => {
        topStatus.forEach((st, sIdx) => {
          source.push(orgaoIndices[oIdx]);
          target.push(statusIndices[sIdx]);
          value.push(Math.round((orgao.count || 0) * (st.count || 0) / 1000));
        });
      });
      
      const data = [{
        type: 'sankey',
        node: {
          pad: 15,
          thickness: 20,
          line: { color: '#0f172a', width: 0.5 },
          label: labels,
          color: [
            ...topTemas.map(() => '#22d3ee'),
            ...topOrgaos.map(() => '#a78bfa'),
            ...topStatus.map(() => '#34d399')
          ]
        },
        link: {
          source: source,
          target: target,
          value: value,
          color: ['rgba(34,211,238,0.4)']
        }
      }];
      
      const layout = {
        title: '',
        font: { color: '#94a3b8', size: 12 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent'
      };
      
      Plotly.newPlot('sankeyChart', data, layout, { responsive: true, displayModeBar: false });
      return;
    }
    
    // Usar dados reais do backend
    const allNodes = [
      ...flowData.nodes.temas,
      ...flowData.nodes.orgaos,
      ...flowData.nodes.statuses
    ];
    
    const nodeMap = new Map();
    allNodes.forEach((node, idx) => {
      nodeMap.set(node, idx);
    });
    
    const source = [];
    const target = [];
    const value = [];
    
    flowData.links.forEach(link => {
      const srcIdx = nodeMap.get(link.source);
      const tgtIdx = nodeMap.get(link.target);
      if (srcIdx !== undefined && tgtIdx !== undefined) {
        source.push(srcIdx);
        target.push(tgtIdx);
        value.push(link.value);
      }
    });
    
    const nodeColors = [
      ...flowData.nodes.temas.map(() => '#22d3ee'),
      ...flowData.nodes.orgaos.map(() => '#a78bfa'),
      ...flowData.nodes.statuses.map(() => '#34d399')
    ];
    
    const data = [{
      type: 'sankey',
      node: {
        pad: 15,
        thickness: 20,
        line: { color: '#0f172a', width: 0.5 },
        label: allNodes,
        color: nodeColors
      },
      link: {
        source: source,
        target: target,
        value: value,
        color: ['rgba(34,211,238,0.4)']
      }
    }];
    
    const layout = {
      title: '',
      font: { color: '#94a3b8', size: 12 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent'
    };
    
    Plotly.newPlot('sankeyChart', data, layout, { responsive: true, displayModeBar: false });
  } catch (error) {
    console.error('❌ Erro ao criar Sankey:', error);
    const container = document.getElementById('sankeyChart');
    if (container) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Erro ao carregar gráfico Sankey</div>';
    }
  }
}

/**
 * Criar TreeMap
 */
async function loadTreeMapChart(temas) {
  try {
    if (typeof Plotly === 'undefined') {
      console.warn('Plotly.js não carregado');
      return;
    }
    
    // Preparar dados para TreeMap (top 20 temas)
    const topTemas = temas.slice(0, 20);
    
    const data = [{
      type: 'treemap',
      labels: topTemas.map(t => t.tema || 'Não informado'),
      values: topTemas.map(t => t.quantidade || 0),
      parents: topTemas.map(() => ''),
      textinfo: 'label+value',
      textfont: { color: '#ffffff', size: 12 },
      marker: {
        colors: topTemas.map((_, i) => {
          const colors = ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9', '#8b5cf6', '#06b6d4'];
          return colors[i % colors.length];
        }),
        line: { color: '#0f172a', width: 2 }
      }
    }];
    
    const layout = {
      title: '',
      font: { color: '#94a3b8' },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 0, r: 0, t: 0, b: 0 }
    };
    
    Plotly.newPlot('treemapChart', data, layout, { responsive: true, displayModeBar: false });
  } catch (error) {
    console.error('❌ Erro ao criar TreeMap:', error);
    const container = document.getElementById('treemapChart');
    if (container) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Erro ao carregar TreeMap</div>';
    }
  }
}

/**
 * Criar Mapa de Calor Geográfico
 */
async function loadGeographicMap(bairros) {
  try {
    // Usar fallback direto (lista visual) já que Mapbox requer token válido
    const topBairros = (bairros || []).slice(0, 15);
    
    if (topBairros.length === 0) {
      const container = document.getElementById('mapChart');
      if (container) {
        container.innerHTML = '<div class="p-4 text-center text-slate-400">Nenhum dado de bairro disponível</div>';
      }
      return;
    }
    
    const maxCount = Math.max(...topBairros.map(b => b.count || 0), 1);
    
    // Criar visualização de mapa de calor usando gráfico de barras horizontais
    const labels = topBairros.map(b => b.key || 'Não informado');
    const values = topBairros.map(b => b.count || 0);
    
    // Usar Chart.js para criar um gráfico de barras horizontais estilizado como mapa
    const ctx = document.createElement('canvas');
    ctx.id = 'mapChartCanvas';
    const container = document.getElementById('mapChart');
    if (!container) return;
    
    container.innerHTML = '';
    container.appendChild(ctx);
    
    if (window.chartMap instanceof Chart) window.chartMap.destroy();
    
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    
    window.chartMap = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Manifestações',
          data: values,
          backgroundColor: values.map(v => {
            const intensity = v / maxCount;
            if (intensity > 0.7) return 'rgba(239,68,68,0.8)'; // Vermelho - alto
            if (intensity > 0.4) return 'rgba(167,139,250,0.8)'; // Violeta - médio
            return 'rgba(34,211,238,0.8)'; // Cyan - baixo
          }),
          borderColor: values.map(v => {
            const intensity = v / maxCount;
            if (intensity > 0.7) return 'rgba(239,68,68,1)';
            if (intensity > 0.4) return 'rgba(167,139,250,1)';
            return 'rgba(34,211,238,1)';
          }),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: tooltipFn(),
          datalabels: {
            ...dataLabelsFn(),
            anchor: 'start',
            align: 'end'
          }
        },
        scales: {
          x: { 
            beginAtZero: true, 
            ticks: { color: '#94a3b8' }, 
            grid: { color: 'rgba(255,255,255,0.05)' } 
          },
          y: { 
            ticks: { color: '#94a3b8', font: { size: 10 } }, 
            grid: { color: 'rgba(255,255,255,0.05)' } 
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar mapa geográfico:', error);
    // Fallback: mostrar lista simples
    const topBairros = (bairros || []).slice(0, 10);
    const maxCount = Math.max(...topBairros.map(b => b.count || 0), 1);
    const container = document.getElementById('mapChart');
    if (container) {
      container.innerHTML = `
        <div class="p-4">
          <div class="text-slate-400 text-sm mb-4">Top Bairros por Volume</div>
          <div class="space-y-2">
            ${topBairros.map((b, idx) => `
              <div class="flex items-center gap-3">
                <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
                <div class="flex-1">
                  <div class="text-sm text-slate-300">${b.key || 'Não informado'}</div>
                  <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style="width: ${((b.count || 0) / maxCount) * 100}%"></div>
                  </div>
                </div>
                <div class="text-sm font-bold text-emerald-300">${(b.count || 0).toLocaleString('pt-BR')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }
}

/**
 * Construir heatmap
 */
function buildHeatmap(containerId, labels, rows) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Verificar se há dados válidos
  if (!rows || rows.length === 0 || !labels || labels.length === 0) {
    container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Nenhum dado disponível para o heatmap</div>';
    return;
  }
  
  try {
    const validRows = rows.filter(r => r && r.values && Array.isArray(r.values));
    if (validRows.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Nenhum dado válido para o heatmap</div>';
      return;
    }
    
    const max = Math.max(1, ...validRows.flatMap(r => r.values || []));
    const toBg = (v) => {
      const numValue = Number(v) || 0;
      const alpha = numValue === 0 ? 0.05 : Math.min(0.9, 0.15 + 0.75 * (numValue / max));
      return `rgba(34,211,238,${alpha})`;
    };
    
    let html = '<div class="min-w-max"><table class="text-xs w-full">';
    html += '<thead><tr><th class="px-2 py-1 text-left text-slate-400">Chave</th>' + labels.map(l=>`<th class="px-2 py-1 text-slate-400">${l || ''}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + validRows.map(r=>{
      const cells = (r.values || []).map(v=>`<td class="px-2 py-1" style="background:${toBg(v)}">${v || 0}</td>`).join('');
      return `<tr><td class="px-2 py-1 text-slate-300">${r.key || 'Não informado'}</td>${cells}</tr>`;
    }).join('') + '</tbody></table></div>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Erro ao construir heatmap:', error);
    container.innerHTML = '<div class="p-4 text-center text-slate-400 text-sm">Erro ao carregar heatmap</div>';
  }
}

/**
 * Carregar Órgão por Mês
 */
async function loadOrgaoMes() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    
    // Carregar dados de secretarias/órgãos (com filtro se houver)
    const dataOrgaos = await fetchFn('/api/aggregate/count-by?field=Secretaria');
    const totalOrgaos = dataOrgaos.length;
    const totalOrgaosEl = document.getElementById('totalOrgaos');
    if (totalOrgaosEl) totalOrgaosEl.textContent = totalOrgaos;
    
    // Criar lista visual de órgãos (estilo Looker Studio)
    const listaOrgaos = document.getElementById('listaOrgaos');
    if (listaOrgaos) {
      const maxValue = Math.max(...dataOrgaos.map(d => d.count), 1);
      listaOrgaos.innerHTML = dataOrgaos.map(item => {
        const width = (item.count / maxValue) * 100;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate">${item.key}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${item.count.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
    
    // Carregar dados mensais (com filtro se houver)
    const dataMensal = await fetchFn('/api/aggregate/by-month');
    const labels = dataMensal.map(x => {
      const ym = x.ym || x.month || '';
      if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
      // OTIMIZADO: Usar dateUtils centralizado
      return window.dateUtils?.formatMonthYear?.(ym) || ym;
    });
    const values = dataMensal.map(x => x.count);
    
    // Criar gráfico de barras mensal
    const chartEl = document.getElementById('chartOrgaoMes');
    if (chartEl) {
      if (window.chartOrgaoMes instanceof Chart) window.chartOrgaoMes.destroy();
      const ctx = chartEl.getContext('2d');
      
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartOrgaoMes = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Manifestações',
            data: values,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(),
              anchor: 'start',
              align: 'end'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            }
          }
        }
      });
      addClickFn(window.chartOrgaoMes, (label, value) => showFeedbackFn(null, label, value), 'chartOrgaoMes');
    }
    
    // Atualizar KPI total
    const total = dataOrgaos.reduce((sum, item) => sum + item.count, 0);
    const totalEl = document.getElementById('totalOrgaoMes');
    if (totalEl) totalEl.textContent = total.toLocaleString('pt-BR');
    
    // Carregar e exibir tabela Por Órgão e Mês
    const dataOrgaoMes = await fetchFn('/api/aggregate/count-by-orgao-mes').catch(() => []);
    const tabelaEl = document.getElementById('tabelaOrgaoMes');
    if (tabelaEl && dataOrgaoMes && dataOrgaoMes.length > 0) {
      const orgaosUnicos = [...new Set(dataOrgaoMes.map(d => d.orgao))].sort();
      const mesesUnicos = [...new Set(dataOrgaoMes.map(d => d.month))].sort();
      
      let html = '<table class="w-full text-sm border-collapse">';
      html += '<thead><tr class="border-b border-white/10">';
      html += '<th class="px-4 py-3 text-left text-slate-300 font-semibold">Órgão</th>';
      mesesUnicos.forEach(mes => {
        if (!mes || typeof mes !== 'string') {
          html += `<th class="px-4 py-3 text-center text-slate-300 font-semibold">${mes || 'N/A'}</th>`;
        } else {
          const parts = mes.split('-');
          // OTIMIZADO: Usar dateUtils centralizado
          if (window.dateUtils?.isValidMonthFormat?.(mes)) {
            const formatted = window.dateUtils.formatMonthYearShort(mes);
            html += `<th class="px-4 py-3 text-center text-slate-300 font-semibold">${formatted}</th>`;
          } else {
            html += `<th class="px-4 py-3 text-center text-slate-300 font-semibold">${mes}</th>`;
          }
        }
      });
      html += '<th class="px-4 py-3 text-center text-slate-300 font-semibold">Total</th>';
      html += '</tr></thead><tbody>';
      
      orgaosUnicos.forEach(orgao => {
        let totalOrgao = 0;
        html += '<tr class="border-b border-white/5 hover:bg-white/5">';
        html += `<td class="px-4 py-2 text-slate-200 font-medium">${orgao || 'Não informado'}</td>`;
        mesesUnicos.forEach(mes => {
          const item = dataOrgaoMes.find(d => d.orgao === orgao && d.month === mes);
          const count = item ? (item.count || 0) : 0;
          totalOrgao += count;
          html += `<td class="px-4 py-2 text-center text-slate-300">${count.toLocaleString('pt-BR')}</td>`;
        });
        html += `<td class="px-4 py-2 text-center text-cyan-300 font-bold">${totalOrgao.toLocaleString('pt-BR')}</td>`;
        html += '</tr>';
      });
      
      // Linha de totais
      html += '<tr class="border-t-2 border-cyan-500/50 bg-cyan-500/10 font-bold">';
      html += '<td class="px-4 py-3 text-cyan-300">TOTAL</td>';
      mesesUnicos.forEach(mes => {
        const totalMes = dataOrgaoMes.filter(d => d.month === mes).reduce((sum, d) => sum + (d.count || 0), 0);
        html += `<td class="px-4 py-3 text-center text-cyan-300">${totalMes.toLocaleString('pt-BR')}</td>`;
      });
      html += `<td class="px-4 py-3 text-center text-cyan-300">${total.toLocaleString('pt-BR')}</td>`;
      html += '</tr>';
      
      html += '</tbody></table>';
      tabelaEl.innerHTML = html;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Órgão por Mês:', error);
  }
}

// Exportar funções para uso global
window.data = {
  reloadAllData,
  loadAIInsights,
  loadStatusOverview,
  loadTable,
  loadKpisWithData,
  loadKpis,
  renderKpis, // Função wrapper que chama window.renderKpis
  currentTableData, // Exportar variável global
  currentTableHeaders, // Exportar variável global
  loadOverview,
  loadAdvancedCharts,
  loadSankeyChart,
  loadTreeMapChart,
  loadGeographicMap,
  buildHeatmap,
  drawSpark,
  drawSparkDaily,
  loadOrgaoMes,
  loadCategoria,
  loadStatusPage,
  loadBairro,
  loadUAC,
  loadResponsavel,
  loadCanal,
  loadPrioridade,
  loadTema,
  loadAssunto,
  loadTempoMedio,
  loadCadastrante,
  loadReclamacoes,
  loadProjecao2026,
  loadSecretaria,
  loadSecretariasDistritos,
  loadSecretariasPorDistrito,
  loadTipo,
  loadSetor,
  loadUnit,
  loadCountChart,
  loadTimeChart,
  // Variáveis de estado
  getCurrentTableData: () => currentTableData,
  getCurrentTableHeaders: () => currentTableHeaders
};

/**
 * Carregar Unidade
 */
async function loadUnit(unitName) {
  try {
    // Mapear nomes das unidades para os nomes no banco
    const unitMap = {
      'adao': 'ADÃO',
      'cer iv': 'CER IV',
      'hospital olho': 'Hospital do Olho',
      'hospital duque': 'Hospital Duque',
      'hospital infantil': 'Hospital Infantil',
      'hospital moacyr': 'Hospital Moacyr',
      'maternidade santa cruz': 'Maternidade Santa Cruz',
      'upa beira mar': 'UPA Beira Mar',
      'uph pilar': 'UPH Pilar',
      'uph saracuruna': 'UPH Saracuruna',
      'uph xerem': 'UPH Xerém',
      'hospital veterinario': 'Hospital Veterinário',
      'upa walter garcia': 'UPA Walter Garcia',
      'uph campos eliseos': 'UPH Campos Elíseos',
      'uph parque equitativa': 'UPH Parque Equitativa',
      'ubs antonio granja': 'UBS Antonio Granja',
      'upa sarapui': 'UPA Sarapuí',
      'uph imbarie': 'UPH Imbariê'
    };
    
    const fetchFn = window.api?.fetchJSON || fetchJSON;
    const searchName = unitMap[unitName.toLowerCase()] || unitName;
    const data = await fetchFn(`/api/unit/${encodeURIComponent(searchName)}`);
    
    // Encontrar a seção da unidade
    const pageId = `page-unit-${unitName.replace(/\s+/g, '-').toLowerCase()}`;
    const section = document.getElementById(pageId);
    if (!section) return;
    
    const assuntosContainer = section.querySelector('.unit-assuntos');
    const tiposCanvas = section.querySelector('.unit-tipos');
    
    // Lista de assuntos
    const assuntos = data.assuntos || [];
    if (assuntosContainer) {
      assuntosContainer.innerHTML = assuntos.map((item, idx) => {
        const width = assuntos.length > 0 ? (item.quantidade / Math.max(...assuntos.map(d => d.quantidade), 1)) * 100 : 0;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate">${item.assunto}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
    
    // Gráfico de tipos
    const tipos = data.tipos || [];
    if (tiposCanvas && tipos.length > 0) {
      const labels = tipos.map(t => t.tipo);
      const values = tipos.map(t => t.quantidade);
      
      if (window[`chartUnit${unitName.replace(/\s+/g, '')}Tipos`] instanceof Chart) {
        window[`chartUnit${unitName.replace(/\s+/g, '')}Tipos`].destroy();
      }
      
      const ctx = tiposCanvas.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window[`chartUnit${unitName.replace(/\s+/g, '')}Tipos`] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'right', labels: { color: '#94a3b8' } },
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(true, 'doughnut')
          }
        }
      });
      addClickFn(window[`chartUnit${unitName.replace(/\s+/g, '')}Tipos`], (label, value) => showFeedbackFn(null, label, value));
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Unidade:', error);
  }
}

/**
 * Carregar Gráfico de Contagem
 */
async function loadCountChart(field) {
  try {
    console.log('Carregando gráfico de contagem para campo:', field);
    const fetchFn = window.api?.fetchJSON || fetchJSON;
    const endpoint = window.config?.buildEndpoint?.(window.config?.API_ENDPOINTS?.AGGREGATE_COUNT_BY || '/api/aggregate/count-by', { field }) || `/api/aggregate/count-by?field=${encodeURIComponent(field)}`;
    const data = await fetchFn(endpoint);
    console.log('Dados recebidos:', data.length, 'itens');
    
    const labels = data.slice(0, 20).map(x => x.key);
    const values = data.slice(0, 20).map(x => x.count);
    const chartEl = document.getElementById('chartCount');
    
    if (!chartEl) {
      console.warn('Canvas chartCount não encontrado (pode não estar na página atual)');
      return;
    }
    
    const ctx2d = chartEl.getContext('2d');
    if (window.chartCount instanceof Chart) window.chartCount.destroy();
    
    // OTIMIZAÇÃO: Preparar funções antes de criar gráfico
    const gradientFn = window.utils?.gradient || (() => ({}));
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    // OTIMIZAÇÃO: Criar gradiente uma vez antes do gráfico
    const gradientBg = typeof gradientFn === 'function' ? gradientFn(ctx2d, 'rgba(34,211,238,0.8)', 'rgba(167,139,250,0.2)') : 'rgba(34,211,238,0.8)';
    
    // OTIMIZAÇÃO: Usar requestAnimationFrame para não bloquear UI
    requestAnimationFrame(() => {
    window.chartCount = new Chart(ctx2d, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: `Contagem por ${field}`,
          data: values,
          borderRadius: 8,
            backgroundColor: gradientBg,
          borderColor: 'rgba(34,211,238,1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
          animation: false, // Já desabilitado
          maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: tooltipFn(),
          datalabels: dataLabelsFn(false, 'bar', false)
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          }
        }
      }
    });
    addClickFn(window.chartCount, (label, value) => showFeedbackFn(null, label, value));
    chartEl.classList.remove('skeleton');
    });
    console.log('Gráfico de contagem criado com sucesso');
  } catch (error) {
    console.error('Erro em loadCountChart:', error);
    throw error;
  }
}

/**
 * Carregar Gráfico de Série Temporal
 */
async function loadTimeChart(field) {
  try {
    console.log('Carregando gráfico de série temporal para campo:', field);
    const fetchFn = window.api?.fetchJSON || fetchJSON;
    const endpoint = window.config?.buildEndpoint?.(window.config?.API_ENDPOINTS?.AGGREGATE_TIME_SERIES || '/api/aggregate/time-series', { field }) || `/api/aggregate/time-series?field=${encodeURIComponent(field)}`;
    const data = await fetchFn(endpoint);
    console.log('Dados recebidos:', data.length, 'itens');
    
    const labels = data.map(x => x.date);
    const values = data.map(x => x.count);
    const chartEl = document.getElementById('chartTime');
    
    if (!chartEl) {
      console.warn('Canvas chartTime não encontrado (pode não estar na página atual)');
      return;
    }
    
    const ctx2d = chartEl.getContext('2d');
    if (window.chartTime instanceof Chart) window.chartTime.destroy();
    
    // OTIMIZAÇÃO: Preparar funções antes de criar gráfico
    const gradientFn = window.utils?.gradient || (() => ({}));
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    // OTIMIZAÇÃO: Criar gradiente uma vez antes do gráfico
    const gradientBg = typeof gradientFn === 'function' ? gradientFn(ctx2d, 'rgba(52,211,153,0.35)', 'rgba(52,211,153,0.05)') : 'rgba(52,211,153,0.35)';
    
    // OTIMIZAÇÃO: Limitar número de pontos para melhor performance (máximo 100 pontos)
    const maxPoints = 100;
    const step = Math.max(1, Math.floor(labels.length / maxPoints));
    const sampledLabels = labels.filter((_, i) => i % step === 0 || i === labels.length - 1);
    const sampledValues = values.filter((_, i) => i % step === 0 || i === values.length - 1);
    
    // OTIMIZAÇÃO: Usar requestAnimationFrame para não bloquear UI
    requestAnimationFrame(() => {
    window.chartTime = new Chart(ctx2d, {
      type: 'line',
      data: {
          labels: sampledLabels,
        datasets: [{
          label: `Registros por dia (${field})`,
            data: sampledValues,
          fill: true,
          borderWidth: 2,
          tension: 0.35,
          borderColor: 'rgba(52,211,153,1)',
            backgroundColor: gradientBg,
            pointRadius: 3, // Reduzido de 4 para melhor performance
            pointHoverRadius: 5, // Reduzido de 6
          pointBackgroundColor: 'rgba(52,211,153,1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
          animation: false, // Já desabilitado
          maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: '#cbd5e1' } },
          tooltip: tooltipFn(),
          datalabels: {
            ...dataLabelsFn(),
            display: function(context) {
                // Mostrar apenas em alguns pontos para não poluir (otimizado)
                const dataLength = context.dataset.data.length;
                const showEvery = Math.max(1, Math.floor(dataLength / 15)); // Máximo 15 labels
                return context.dataIndex % showEvery === 0 || context.dataIndex === dataLength - 1;
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' }, beginAtZero: true }
        }
      }
    });
    addClickFn(window.chartTime, (label, value) => showFeedbackFn(null, label, value));
    chartEl.classList.remove('skeleton');
    });
    console.log('Gráfico de série temporal criado com sucesso');
  } catch (error) {
    console.error('Erro em loadTimeChart:', error);
    throw error;
  }
}

/**
 * Carregar Secretaria
 */
async function loadSecretaria() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=Secretaria');
    const labels = data.slice(0, 10).map(x => x.key);
    const values = data.slice(0, 10).map(x => x.count);
    
    const chartEl = document.getElementById('chartSecretaria');
    if (chartEl) {
      if (window.chartSecretaria instanceof Chart) window.chartSecretaria.destroy();
      const ctx = chartEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartSecretaria = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Secretaria',
            data: values,
            backgroundColor: '#22d3ee',
            borderColor: '#22d3ee',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(false, 'bar', false)
          },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartSecretaria, (label, value) => showFeedbackFn(null, label, value), 'chartSecretaria');
    }
    
    const rankEl = document.getElementById('rankSecretaria');
    if (rankEl) {
      rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-cyan-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
    }
    
    // Gráfico mensal
    const dataMensal = await fetchFn('/api/aggregate/by-month').catch(() => []);
    if (dataMensal && dataMensal.length > 0) {
      // OTIMIZADO: Usar dateUtils centralizado
      const labelsMes = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
      });
      const valuesMes = dataMensal.map(x => x.count || 0);
      
      const chartMesEl = document.getElementById('chartSecretariaMes');
      if (chartMesEl) {
        if (window.chartSecretariaMes instanceof Chart) window.chartSecretariaMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartSecretariaMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Manifestações',
              data: valuesMes,
              backgroundColor: 'rgba(34,211,238,0.7)',
              borderColor: 'rgba(34,211,238,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Secretaria:', error);
  }
}

/**
 * Carregar Secretarias e Distritos
 */
async function loadSecretariasDistritos() {
  try {
    const fetchFn = window.api?.fetchJSON || fetchJSON;
    
    // Carregar dados de distritos e secretarias
    const distritosData = await fetchFn('/api/distritos').catch(() => null);
    
    if (!distritosData || !distritosData.distritos) {
      const listaEl = document.getElementById('listaDistritos');
      if (listaEl) {
        listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados de distritos</div>';
      }
      return;
    }
    
    const distritos = distritosData.distritos;
    const estatisticas = distritosData.estatisticas || {};
    
    // Renderizar lista de distritos
    const listaDistritos = document.getElementById('listaDistritos');
    if (listaDistritos) {
      listaDistritos.innerHTML = Object.entries(distritos).map(([nome, info]) => `
        <div class="distrito-item p-4 rounded-lg border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 cursor-pointer transition-all" 
             data-distrito="${nome}" 
             data-code="${info.code || ''}">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold text-cyan-300">${nome}</div>
              <div class="text-xs text-slate-400 mt-1">
                ${info.bairros ? info.bairros.length + ' bairros' : ''}
                ${estatisticas.secretariasPorDistrito && estatisticas.secretariasPorDistrito[nome] 
                  ? ' • ' + estatisticas.secretariasPorDistrito[nome] + ' secretarias' 
                  : ''}
              </div>
            </div>
            <div class="text-2xl">${info.code || '📍'}</div>
          </div>
        </div>
      `).join('');
      
      // Adicionar event listeners para seleção de distrito
      listaDistritos.querySelectorAll('.distrito-item').forEach(item => {
        item.addEventListener('click', async () => {
          // Remover seleção anterior
          listaDistritos.querySelectorAll('.distrito-item').forEach(i => {
            i.classList.remove('border-cyan-400', 'bg-cyan-500/10');
            i.classList.add('border-white/10');
          });
          
          // Marcar como selecionado
          item.classList.remove('border-white/10');
          item.classList.add('border-cyan-400', 'bg-cyan-500/10');
          
          const distritoNome = item.dataset.distrito;
          const distritoCode = item.dataset.code;
          
          // Atualizar nome do distrito selecionado
          const nomeEl = document.getElementById('distritoSelecionadoNome');
          if (nomeEl) nomeEl.textContent = distritoNome;
          
          // Carregar secretarias do distrito
          if (window.data?.loadSecretariasPorDistrito) {
            await window.data.loadSecretariasPorDistrito(distritoNome, distritoCode);
          }
        });
      });
    }
    
    // Renderizar estatísticas
    const estatisticasDiv = document.getElementById('estatisticasDistritos');
    if (estatisticasDiv) {
      estatisticasDiv.innerHTML = `
        <div class="glass rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Total de Secretarias</div>
          <div class="text-2xl font-bold text-cyan-300">${estatisticas.totalSecretarias || 0}</div>
        </div>
        <div class="glass rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Total de Distritos</div>
          <div class="text-2xl font-bold text-violet-300">${estatisticas.totalDistritos || 0}</div>
        </div>
        <div class="glass rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Total de Bairros</div>
          <div class="text-2xl font-bold text-emerald-300">${estatisticas.totalBairros || 0}</div>
        </div>
        <div class="glass rounded-xl p-4">
          <div class="text-slate-400 text-sm mb-1">Média Secretarias/Distrito</div>
          <div class="text-2xl font-bold text-amber-300">${estatisticas.totalSecretarias && estatisticas.totalDistritos 
            ? (estatisticas.totalSecretarias / estatisticas.totalDistritos).toFixed(1) 
            : 0}</div>
        </div>
      `;
    }
    
    // Criar gráfico de distribuição de secretarias por distrito
    if (estatisticas.secretariasPorDistrito) {
      const distritoLabels = Object.keys(estatisticas.secretariasPorDistrito);
      const distritoValues = Object.values(estatisticas.secretariasPorDistrito);
      
      const chartEl = document.getElementById('chartSecretariasDistritos');
      if (chartEl) {
        if (window.chartSecretariasDistritos instanceof Chart) window.chartSecretariasDistritos.destroy();
        const ctx = chartEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartSecretariasDistritos = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: distritoLabels.map(d => d.replace('º Distrito - ', '').split('(')[0].trim()),
            datasets: [{
              label: 'Quantidade de Secretarias',
              data: distritoValues,
              backgroundColor: 'rgba(245,158,11,0.7)',
              borderColor: 'rgba(245,158,11,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn()
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar secretarias e distritos:', error);
    const listaEl = document.getElementById('listaDistritos');
    if (listaEl) {
      listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados</div>';
    }
  }
}

/**
 * Carregar Secretarias por Distrito
 */
async function loadSecretariasPorDistrito(distritoNome, distritoCode) {
  try {
    // Buscar secretarias do distrito
    const response = await fetch(`/api/secretarias/${encodeURIComponent(distritoCode || distritoNome)}`);
    const data = await response.json().catch(() => ({ secretarias: [] }));
    
    const secretarias = data.secretarias || [];
    const listaSecretarias = document.getElementById('listaSecretarias');
    
    if (!listaSecretarias) return;
    
    if (secretarias.length === 0) {
      listaSecretarias.innerHTML = '<div class="text-center text-slate-400 py-8">Nenhuma secretaria encontrada para este distrito</div>';
      return;
    }
    
    listaSecretarias.innerHTML = secretarias.map(sec => `
      <div class="glass rounded-xl p-4 border border-white/10 hover:border-violet-400/50 transition-all">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h4 class="font-semibold text-violet-300 mb-2">${sec.name || 'Secretaria'}</h4>
            ${sec.address ? `<div class="text-sm text-slate-400 mb-1">📍 ${sec.address}</div>` : ''}
            ${sec.phone ? `<div class="text-sm text-slate-400 mb-1">📞 ${sec.phone}</div>` : ''}
            ${sec.email ? `<div class="text-sm text-slate-400 mb-1">✉️ ${sec.email}</div>` : ''}
            ${sec.workingHours ? `<div class="text-sm text-slate-400 mb-2">🕐 ${sec.workingHours}</div>` : ''}
            ${sec.services && sec.services.length > 0 ? `
              <div class="mt-3">
                <div class="text-xs text-slate-500 mb-1">Serviços oferecidos:</div>
                <div class="flex flex-wrap gap-1">
                  ${sec.services.map(s => `<span class="px-2 py-1 text-xs rounded bg-slate-800/50 text-slate-300">${s}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('❌ Erro ao carregar secretarias do distrito:', error);
    const listaEl = document.getElementById('listaSecretarias');
    if (listaEl) {
      listaEl.innerHTML = '<div class="text-center text-slate-400 py-8">Erro ao carregar secretarias</div>';
    }
  }
}

/**
 * Carregar Tipo
 */
async function loadTipo() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=Tipo');
    const labels = data.slice(0, 10).map(x => x.key);
    const values = data.slice(0, 10).map(x => x.count);
    
    const chartEl = document.getElementById('chartTipo');
    if (chartEl) {
      if (window.chartTipo instanceof Chart) window.chartTipo.destroy();
      const ctx = chartEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartTipo = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            label: 'Tipo Manifestação',
            data: values,
            backgroundColor: ['#c084fc', '#22d3ee', '#facc15', '#fb7185']
          }]
        },
        options: {
          responsive: true,
          animation: false,
          plugins: {
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(true, 'pie')
          }
        }
      });
      addClickFn(window.chartTipo, (label, value) => showFeedbackFn(null, label, value), 'chartTipo');
    }
    
    const rankEl = document.getElementById('rankTipo');
    if (rankEl) {
      rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-violet-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Tipo:', error);
  }
}

/**
 * Carregar Setor
 */
async function loadSetor() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=Setor');
    const labels = data.slice(0, 10).map(x => x.key);
    const values = data.slice(0, 10).map(x => x.count);
    
    const chartEl = document.getElementById('chartSetor');
    if (chartEl) {
      if (window.chartSetor instanceof Chart) window.chartSetor.destroy();
      const ctx = chartEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartSetor = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Setor',
            data: values,
            backgroundColor: '#34d399',
            borderColor: '#34d399',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          animation: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(),
              anchor: 'start',
              align: 'end'
            }
          },
          scales: {
            x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartSetor, (label, value) => showFeedbackFn(null, label, value), 'chartSetor');
    }
    
    const rankEl = document.getElementById('rankSetor');
    if (rankEl) {
      rankEl.innerHTML = data.slice(0, 10).map(e => `<li><span class='text-emerald-300 font-mono'>${e.key}</span> <span class='float-right font-bold'>${e.count}</span></li>`).join('');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Setor:', error);
  }
}

/**
 * Carregar Cadastrante
 */
async function loadCadastrante() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    
    // Servidores
    const servidores = await fetchFn('/api/aggregate/by-server');
    const listaServidores = document.getElementById('listaServidores');
    if (listaServidores) {
      listaServidores.innerHTML = servidores.map((item, idx) => {
        const width = (item.quantidade / Math.max(...servidores.map(d => d.quantidade), 1)) * 100;
        const isActive = window.globalFilters?.cadastranteFilter?.type === 'servidor' && window.globalFilters.cadastranteFilter.value === item.servidor;
        return `
          <div class="servidor-item flex items-center gap-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${isActive ? 'bg-cyan-500/20 border-cyan-500/30 border-l-4' : ''}" 
               data-servidor="${item.servidor.replace(/"/g, '&quot;')}">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.servidor}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
      
      // Adicionar event listeners aos servidores
      listaServidores.querySelectorAll('.servidor-item').forEach(item => {
        item.addEventListener('click', function() {
          const servidor = this.getAttribute('data-servidor');
          if (window.updateCadastranteCharts) {
            window.updateCadastranteCharts({ type: 'servidor', value: servidor });
          }
        });
      });
    }
    
    // Unidades de Cadastro (UAC)
    const uacs = await fetchFn('/api/aggregate/count-by?field=UAC');
    const listaUnidades = document.getElementById('listaUnidadesCadastro');
    if (listaUnidades) {
      listaUnidades.innerHTML = uacs.map((item, idx) => {
        const width = (item.count / Math.max(...uacs.map(d => d.count), 1)) * 100;
        const isActive = window.globalFilters?.cadastranteFilter?.type === 'unidadeCadastro' && window.globalFilters.cadastranteFilter.value === item.key;
        return `
          <div class="unidade-item flex items-center gap-3 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${isActive ? 'bg-violet-500/20 border-violet-500/30 border-l-4' : ''}" 
               data-unidade="${item.key.replace(/"/g, '&quot;')}">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.key}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${item.count.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
      
      // Adicionar event listeners às unidades
      listaUnidades.querySelectorAll('.unidade-item').forEach(item => {
        item.addEventListener('click', function() {
          const unidade = this.getAttribute('data-unidade');
          if (window.updateCadastranteCharts) {
            window.updateCadastranteCharts({ type: 'unidadeCadastro', value: unidade });
          }
        });
      });
    }
    
    // Gráfico mensal (com filtro se houver)
    const dataMensal = await fetchFn('/api/aggregate/by-month');
    const labelsMes = dataMensal.map(x => {
      const ym = x.ym || x.month || '';
      if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
      // OTIMIZADO: Usar dateUtils centralizado
      return window.dateUtils?.formatMonthYear?.(ym) || ym;
    });
    const valuesMes = dataMensal.map(x => x.count);
    
    const chartMesEl = document.getElementById('chartCadastranteMes');
    if (chartMesEl) {
      if (window.chartCadastranteMes instanceof Chart) window.chartCadastranteMes.destroy();
      const ctxMes = chartMesEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      
      window.chartCadastranteMes = new Chart(ctxMes, {
        type: 'bar',
        data: {
          labels: labelsMes,
          datasets: [{
            label: 'Quantidade',
            data: valuesMes,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(false, 'bar', false)
          },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
    
    // Total (com filtro se houver)
    const summary = await fetchFn('/api/summary');
    const totalEl = document.getElementById('totalCadastrante');
    if (totalEl) {
      totalEl.textContent = (summary.total || 0).toLocaleString('pt-BR');
    }
    
    // Atualizar exibição de filtros
    if (window.updateCadastranteFiltersDisplay) {
      window.updateCadastranteFiltersDisplay();
    }
    
    // Se já houver filtro ativo, atualizar gráficos adicionais
    if (window.globalFilters?.cadastranteFilter && window.updateCadastranteCharts) {
      await window.updateCadastranteCharts(window.globalFilters.cadastranteFilter);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Cadastrante:', error);
  }
}

/**
 * Carregar Reclamações
 */
async function loadReclamacoes() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    
    const [data, dataMensal] = await Promise.all([
      fetchFn('/api/complaints-denunciations'),
      fetchFn('/api/aggregate/by-month').catch(() => [])
    ]);
    
    const assuntos = data.assuntos || [];
    const tipos = data.tipos || [];
    
    // Lista de assuntos
    const listaEl = document.getElementById('listaReclamacoes');
    if (listaEl) {
      listaEl.innerHTML = assuntos.map((item, idx) => {
        const width = assuntos.length > 0 ? (item.quantidade / Math.max(...assuntos.map(d => d.quantidade), 1)) * 100 : 0;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.assunto}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-rose-500 to-pink-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-rose-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
    
    // Gráfico de tipos de ação
    const labels = tipos.map(t => t.tipo);
    const values = tipos.map(t => t.quantidade);
    
    const chartTipoEl = document.getElementById('chartReclamacoesTipo');
    if (chartTipoEl) {
      if (window.chartReclamacoesTipo instanceof Chart) window.chartReclamacoesTipo.destroy();
      const ctx = chartTipoEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartReclamacoesTipo = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Quantidade',
            data: values,
            backgroundColor: 'rgba(239,68,68,0.7)',
            borderColor: 'rgba(239,68,68,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: dataLabelsFn(false, 'bar', true)
          },
          scales: {
            x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartReclamacoesTipo, (label, value) => showFeedbackFn(null, label, value), 'chartReclamacoesTipo');
    }
    
    // Gráfico por mês
    if (dataMensal && dataMensal.length > 0) {
      const labelsMes = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
        const parts = ym.split('-');
        // OTIMIZADO: Usar dateUtils centralizado
        return window.dateUtils?.formatMonthYear?.(ym) || ym;
      });
      const valuesMes = dataMensal.map(x => x.count);
      
      const chartMesEl = document.getElementById('chartReclamacoesMes');
      if (chartMesEl) {
        if (window.chartReclamacoesMes instanceof Chart) window.chartReclamacoesMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartReclamacoesMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Quantidade',
              data: valuesMes,
              backgroundColor: 'rgba(239,68,68,0.7)',
              borderColor: 'rgba(239,68,68,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Reclamações:', error);
  }
}

/**
 * Carregar Projeção 2026
 */
async function loadProjecao2026() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    
    // Carregar dados históricos
    const [byMonth, temas, status] = await Promise.all([
      fetchFn('/api/aggregate/by-month'),
      fetchFn('/api/aggregate/by-theme'),
      fetchFn('/api/stats/status-overview')
    ]);
    
    // Processar dados mensais históricos
    const historico = byMonth.map(x => {
      const ym = x.ym || x.month || '';
      if (!ym || typeof ym !== 'string') {
        return {
          label: ym || 'Data inválida',
          value: x.count || 0,
          year: 0,
          month: 0
        };
      }
      const parts = ym.split('-');
      if (parts.length < 2) {
        return {
          label: ym,
          value: x.count || 0,
          year: 0,
          month: 0
        };
      }
      // OTIMIZADO: Usar dateUtils centralizado
      const [year, month] = parts;
      return {
        label: window.dateUtils?.formatMonthYear?.(ym) || ym,
        value: x.count || 0,
        year: parseInt(year) || 0,
        month: parseInt(month) || 0
      };
    });
    
    // Calcular média mensal dos últimos 12 meses
    const ultimos12Meses = historico.slice(-12);
    const mediaMensal = ultimos12Meses.reduce((sum, item) => sum + item.value, 0) / ultimos12Meses.length;
    
    // Gerar projeção para 2026 (12 meses)
    // OTIMIZADO: Usar dateUtils centralizado
    const projecao2026 = [];
    for (let mes = 1; mes <= 12; mes++) {
      const ym = `2026-${String(mes).padStart(2, '0')}`;
      projecao2026.push({
        label: window.dateUtils?.formatMonthYear?.(ym) || `${mes}/2026`,
        value: Math.round(mediaMensal * (1 + (Math.random() * 0.2 - 0.1))) // Variação de ±10%
      });
    }
    
    // Combinar histórico e projeção
    const todosLabels = [...historico.map(h => h.label), ...projecao2026.map(p => p.label)];
    const todosValores = [...historico.map(h => h.value), ...projecao2026.map(p => p.value)];
    
    // Gráfico de tendência mensal com projeção
    const chartMensalEl = document.getElementById('chartProjecaoMensal');
    if (chartMensalEl) {
      if (window.chartProjecaoMensal instanceof Chart) window.chartProjecaoMensal.destroy();
      const ctxMensal = chartMensalEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartProjecaoMensal = new Chart(ctxMensal, {
        type: 'line',
        data: {
          labels: todosLabels,
          datasets: [
            {
              label: 'Histórico',
              data: [...historico.map(h => h.value), ...Array(12).fill(null)],
              borderColor: '#22d3ee',
              backgroundColor: 'rgba(34,211,238,0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            },
            {
              label: 'Projeção 2026',
              data: [...Array(historico.length).fill(null), ...projecao2026.map(p => p.value)],
              borderColor: '#a78bfa',
              backgroundColor: 'rgba(167,139,250,0.1)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'top', labels: { color: '#94a3b8' } },
            tooltip: tooltipFn(),
            datalabels: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartProjecaoMensal, (label, value) => showFeedbackFn(null, label, value), 'chartProjecaoMensal');
    }
    
    // Exibir estatísticas
    const totalHistorico = historico.reduce((sum, item) => sum + item.value, 0);
    const totalProjetado = projecao2026.reduce((sum, item) => sum + item.value, 0);
    
    const totalHistoricoEl = document.getElementById('totalHistorico');
    const totalProjetadoEl = document.getElementById('totalProjetado');
    const mediaMensalEl = document.getElementById('mediaMensal');
    
    if (totalHistoricoEl) totalHistoricoEl.textContent = totalHistorico.toLocaleString('pt-BR');
    if (totalProjetadoEl) totalProjetadoEl.textContent = totalProjetado.toLocaleString('pt-BR');
    if (mediaMensalEl) mediaMensalEl.textContent = Math.round(mediaMensal).toLocaleString('pt-BR');
    
    // Top temas
    const topTemas = temas.slice(0, 10);
    const listaTemasEl = document.getElementById('listaTemasProjecao');
    if (listaTemasEl) {
      listaTemasEl.innerHTML = topTemas.map((item, idx) => `
        <div class="flex items-center gap-3 py-2 border-b border-white/5">
          <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
          <div class="flex-1 text-sm text-slate-300 truncate">${item.tema}</div>
          <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Projeção 2026:', error);
  }
}

/**
 * Carregar Tema
 */
async function loadTema() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/by-theme').catch(() => []);
    
    // Validar dados
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ Nenhum dado de tema disponível');
      return;
    }
    
    // Mostrar todos os temas, sem limitação
    const labels = data.map(x => x.tema);
    const values = data.map(x => x.quantidade);
    
    // Gráfico de temas
    const chartEl = document.getElementById('chartTema');
    if (chartEl) {
      if (window.chartTema instanceof Chart) window.chartTema.destroy();
      const ctx = chartEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      window.chartTema = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Quantidade',
            data: values,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(),
              anchor: 'start',
              align: 'end'
            }
          },
          scales: {
            x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
      addClickFn(window.chartTema, (label, value) => showFeedbackFn(null, label, value), 'chartTema');
    }
    
    // Status geral (com validação)
    const status = await fetchFn('/api/stats/status-overview').catch(() => null);
    const chartStatusEl = document.getElementById('chartStatusTema');
    if (chartStatusEl && status && status.concluida && status.emAtendimento) {
      if (window.chartStatusTema instanceof Chart) window.chartStatusTema.destroy();
      const ctxStatus = chartStatusEl.getContext('2d');
      const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
      const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
      const addClickFn = window.charts?.addChartClickHandler || (() => {});
      const showFeedbackFn = window.showClickFeedback || (() => {});
      
      const concluidaPercent = status.concluida?.percentual || 0;
      const emAtendimentoPercent = status.emAtendimento?.percentual || 0;
      
      window.chartStatusTema = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Concluída', 'Em atendimento'],
          datasets: [{
            data: [concluidaPercent, emAtendimentoPercent],
            backgroundColor: ['#38bdf8', '#fbbf24']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: tooltipFn(),
            datalabels: {
              ...dataLabelsFn(true),
              anchor: 'center',
              align: 'center'
            }
          }
        }
      });
      addClickFn(window.chartStatusTema, (label, value) => showFeedbackFn(null, label, value), 'chartStatusTema');
    }
    
    const statusInfoEl = document.getElementById('statusTemaInfo');
    if (statusInfoEl && status && status.concluida && status.emAtendimento) {
      statusInfoEl.innerHTML = `
        <div class="text-cyan-300">Concluída: ${status.concluida?.percentual || 0}%</div>
        <div class="text-amber-300">Em atendimento: ${status.emAtendimento?.percentual || 0}%</div>
      `;
    } else if (statusInfoEl) {
      statusInfoEl.innerHTML = '<div class="text-slate-400">Dados de status não disponíveis</div>';
    }
    
    // Gráfico mensal (com validação)
    const dataMensal = await fetchFn('/api/aggregate/by-month').catch(() => []);
    const labelsMes = (Array.isArray(dataMensal) ? dataMensal : []).map(x => {
      const ym = x.ym || x.month || '';
      if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
      // OTIMIZADO: Usar dateUtils centralizado
      return window.dateUtils?.formatMonthYear?.(ym) || ym;
    });
    const valuesMes = dataMensal.map(x => x.count);
    
    const chartMesEl = document.getElementById('chartTemaMes');
    if (chartMesEl) {
      if (window.chartTemaMes instanceof Chart) window.chartTemaMes.destroy();
      const ctxMes = chartMesEl.getContext('2d');
      
      window.chartTemaMes = new Chart(ctxMes, {
        type: 'bar',
        data: {
          labels: labelsMes,
          datasets: [{
            label: 'Quantidade',
            data: valuesMes,
            backgroundColor: 'rgba(167,139,250,0.7)',
            borderColor: 'rgba(167,139,250,1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
    
    // Lista completa de temas
    const listaTemas = document.getElementById('listaTemas');
    if (listaTemas) {
      const maxQuantidade = Math.max(...data.map(d => d.quantidade), 1);
      listaTemas.innerHTML = data.map((item, idx) => {
        const width = (item.quantidade / maxQuantidade) * 100;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.tema}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
    
    // Exibir filtros aplicados
    const filtrosTemaInfo = document.getElementById('filtrosTemaInfo');
    if (filtrosTemaInfo) {
      const filtros = [];
      if (window.globalFilters?.filters && window.globalFilters.filters.length > 0) {
        window.globalFilters.filters.forEach(f => {
          if (f.field === 'Data' || f.field === 'Mês') {
            const meses = Array.isArray(f.value) ? f.value : [f.value];
            meses.forEach(mes => {
              if (mes && typeof mes === 'string') {
                const parts = mes.split('-');
                // OTIMIZADO: Usar dateUtils centralizado
                if (window.dateUtils?.isValidMonthFormat?.(mes)) {
                  filtros.push(window.dateUtils.formatMonthYearShort(mes));
                } else {
                  filtros.push(`Mês: ${mes}`);
                }
              }
            });
          } else {
            filtros.push(`${f.field}: ${f.value}`);
          }
        });
      }
      if (filtros.length > 0) {
        filtrosTemaInfo.innerHTML = `🔍 Filtros: ${filtros.join(', ')}`;
        filtrosTemaInfo.classList.remove('hidden');
      } else {
        filtrosTemaInfo.innerHTML = '';
        filtrosTemaInfo.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Tema:', error);
  }
}

/**
 * Carregar Assunto
 */
async function loadAssunto() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/by-subject');
    
    // Limitar gráfico "Top Assuntos" para Top 15 para melhor legibilidade
    const topAssuntos = data.slice(0, 15);
    const labels = topAssuntos.map(x => {
      const label = x.assunto || 'Não informado';
      return label.length > 50 ? label.substring(0, 47) + '...' : label;
    });
    const labelsFull = topAssuntos.map(x => x.assunto || 'Não informado');
    const values = topAssuntos.map(x => x.quantidade);
    
    // Gráfico de assuntos (Top 15)
    const canvasAssunto = document.getElementById('chartAssunto');
    if (!canvasAssunto) {
      console.warn('Canvas chartAssunto não encontrado');
      return;
    }
    
    if (window.chartAssunto instanceof Chart) {
      try {
        window.chartAssunto.destroy();
      } catch (e) {
        console.warn('Erro ao destruir gráfico anterior:', e);
      }
      window.chartAssunto = null;
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const ctx = canvasAssunto.getContext('2d');
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    window.chartAssunto = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Quantidade',
          data: values,
          backgroundColor: 'rgba(34,211,238,0.7)',
          borderColor: 'rgba(34,211,238,1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const fullLabel = labelsFull[context.dataIndex];
                const value = context.parsed.x;
                return `${fullLabel}: ${value.toLocaleString('pt-BR')}`;
              }
            }
          },
          datalabels: {
            ...dataLabelsFn(),
            anchor: 'start',
            align: 'end',
            display: function(context) {
              return context.dataIndex < 10;
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              maxRotation: 0,
              minRotation: 0,
              callback: function(value, index) {
                return labels[index] || '';
              }
            },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10
          }
        }
      }
    });
    addClickFn(window.chartAssunto, (label, value) => showFeedbackFn(null, label, value), 'chartAssunto');
    
    // Status geral
    const status = await fetchFn('/api/stats/status-overview');
    const chartStatusEl = document.getElementById('chartStatusAssunto');
    if (chartStatusEl) {
      if (window.chartStatusAssunto instanceof Chart) window.chartStatusAssunto.destroy();
      const ctxStatus = chartStatusEl.getContext('2d');
      
      window.chartStatusAssunto = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Concluída', 'Em atendimento'],
          datasets: [{
            data: [status.concluida.percentual, status.emAtendimento.percentual],
            backgroundColor: ['#38bdf8', '#fbbf24']
          }]
        },
        options: { responsive: true }
      });
    }
    
    // Lista completa de assuntos
    const listaAssuntos = document.getElementById('listaAssuntos');
    if (listaAssuntos) {
      const maxQuantidade = Math.max(...data.map(d => d.quantidade), 1);
      listaAssuntos.innerHTML = data.map((item, idx) => {
        const width = (item.quantidade / maxQuantidade) * 100;
        return `
          <div class="flex items-center gap-3 py-2 border-b border-white/5">
            <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-300 truncate font-medium">${item.assunto}</div>
              <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
              </div>
            </div>
            <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${item.quantidade.toLocaleString('pt-BR')}</div>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Assunto:', error);
  }
}

/**
 * Carregar Tempo Médio
 */
async function loadTempoMedio() {
  try {
    console.log('📊 Carregando dados de tempo médio...');
    
    // OTIMIZAÇÃO: Usar fetch direto (sem filtros) para melhor performance
    const fetchData = async (url, fallback = []) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : (data?.total || Object.keys(data || {}).length || 0);
        console.log(`✅ ${url}: ${count} itens`);
        return data;
      } catch (e) {
        console.warn(`⚠️ ${url}: ${e.message || e}`);
        return fallback;
      }
    };
    
    // OTIMIZAÇÃO: Carregar dados críticos primeiro, secundários depois
    // Dados críticos (necessários para renderizar a página)
    const criticalData = await Promise.allSettled([
      fetchData('/api/stats/average-time/stats', null),
      fetchData('/api/stats/average-time/by-month', [])
    ]);
    
    const stats = criticalData[0].status === 'fulfilled' ? criticalData[0].value : null;
    const dataMes = criticalData[1].status === 'fulfilled' ? criticalData[1].value : [];
    
    // OTIMIZAÇÃO: Renderizar dados críticos IMEDIATAMENTE (não bloqueia)
    // Atualizar estatísticas gerais primeiro
    if (stats) {
      const statMedia = document.getElementById('statMedia');
      const statMediana = document.getElementById('statMediana');
      const statMinimo = document.getElementById('statMinimo');
      const statMaximo = document.getElementById('statMaximo');
      
      if (statMedia) statMedia.textContent = stats.media || '0';
      if (statMediana) statMediana.textContent = stats.mediana || '0';
      if (statMinimo) statMinimo.textContent = stats.minimo || '0';
      if (statMaximo) statMaximo.textContent = stats.maximo || '0';
    }
    
    // Renderizar gráfico por mês (dados críticos)
    if (dataMes && Array.isArray(dataMes) && dataMes.length > 0) {
      const labelsMes = dataMes.map(x => {
        if (!x.month) return 'Mês inválido';
        try {
          const [year, month] = x.month.split('-');
          return `${month}/${year}`;
        } catch (e) {
          return x.month;
        }
      });
      const valuesMes = dataMes.map(x => x.dias || 0);
      
      const chartMesEl = document.getElementById('chartTempoMedioMes');
      if (chartMesEl) {
        if (window.chartTempoMedioMes instanceof Chart) window.chartTempoMedioMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        const addClickFn = window.charts?.addChartClickHandler || (() => {});
        const showFeedbackFn = window.showClickFeedback || (() => {});
        
        window.chartTempoMedioMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Tempo Médio (dias)',
              data: valuesMes,
              backgroundColor: 'rgba(34,211,238,0.7)',
              borderColor: 'rgba(34,211,238,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            animation: false, // OTIMIZAÇÃO: Desabilitar animação
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: {
                ...dataLabelsFn(),
                anchor: 'end',
                align: 'top'
              }
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedioMes, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioMes');
      }
    }
    
    // Dados secundários (carregar em background - não bloqueia)
    Promise.allSettled([
      fetchData('/api/stats/average-time', []),
      fetchData('/api/stats/average-time/by-day', []),
      fetchData('/api/stats/average-time/by-week', []),
      fetchData('/api/stats/average-time/by-unit', []),
      fetchData('/api/stats/average-time/by-month-unit', [])
    ]).then((results) => {
      const data = results[0].status === 'fulfilled' ? results[0].value : [];
      const dataDia = results[1].status === 'fulfilled' ? results[1].value : [];
      const dataSemana = results[2].status === 'fulfilled' ? results[2].value : [];
      const dataUnidade = results[3].status === 'fulfilled' ? results[3].value : [];
      const dataUnidadeMes = results[4].status === 'fulfilled' ? results[4].value : [];
      
      // Renderizar gráfico principal por órgão
      if (data && Array.isArray(data) && data.length > 0) {
        const labels = data.map(x => x.org);
        const values = data.map(x => x.dias);
        
        const chartEl = document.getElementById('chartTempoMedio');
        if (chartEl) {
          if (window.chartTempoMedio instanceof Chart) window.chartTempoMedio.destroy();
          const ctx = chartEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartTempoMedio = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Dias',
                data: values,
                backgroundColor: 'rgba(34,211,238,0.7)',
                borderColor: 'rgba(34,211,238,1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: tooltipFn(),
                datalabels: {
                  ...dataLabelsFn(),
                  anchor: 'start',
                  align: 'end'
                }
              },
              scales: {
                x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
          addClickFn(window.chartTempoMedio, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedio');
        }
        
        // Lista de ranking
        const listaEl = document.getElementById('listaTempoMedio');
        if (listaEl) {
          listaEl.innerHTML = data.map((item, idx) => `
            <div class="flex items-center gap-3 py-2 border-b border-white/5">
              <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
              <div class="flex-1 text-sm text-slate-300 truncate">${item.org}</div>
              <div class="text-lg font-bold text-cyan-300 min-w-[60px] text-right">${item.dias.toFixed(2)}</div>
            </div>
          `).join('');
        }
      } else {
        const chartEl = document.getElementById('chartTempoMedio');
        const listaEl = document.getElementById('listaTempoMedio');
        
        if (chartEl) {
          const ctx = chartEl.getContext('2d');
          ctx.clearRect(0, 0, chartEl.width, chartEl.height);
        }
        if (listaEl) {
          listaEl.innerHTML = '<div class="text-slate-400 text-center py-8">Nenhum dado disponível. Verifique se há registros com data de criação e conclusão.</div>';
        }
      }
      
      // Renderizar gráficos secundários quando disponíveis
      // Gráfico por Dia (linha)
      if (dataDia && Array.isArray(dataDia) && dataDia.length > 0) {
        // OTIMIZADO: Usar dateUtils centralizado
        const labelsDia = dataDia.map(x => {
          if (!x.date) return 'Data inválida';
          return window.dateUtils?.formatDateShort?.(x.date) || 'Data inválida';
        });
        const valuesDia = dataDia.map(x => x.dias || 0);
        
        const chartDiaEl = document.getElementById('chartTempoMedioDia');
        if (chartDiaEl) {
          if (window.chartTempoMedioDia instanceof Chart) window.chartTempoMedioDia.destroy();
          const ctxDia = chartDiaEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartTempoMedioDia = new Chart(ctxDia, {
            type: 'line',
            data: {
              labels: labelsDia,
              datasets: [{
                label: 'Tempo Médio (dias)',
                data: valuesDia,
                borderColor: 'rgba(34,211,238,1)',
                backgroundColor: 'rgba(34,211,238,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              plugins: {
                legend: { display: false },
                tooltip: tooltipFn(),
                datalabels: dataLabelsFn(false, 'line', false)
              },
              scales: {
                y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
          addClickFn(window.chartTempoMedioDia, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioDia');
        }
      }
      
      // Gráfico por Semana (linha)
      if (dataSemana && Array.isArray(dataSemana) && dataSemana.length > 0) {
        const labelsSemana = dataSemana.map(x => {
          if (!x.week || typeof x.week !== 'string') return 'Semana inválida';
          return x.week.replace('W', ' Semana ');
        });
        const valuesSemana = dataSemana.map(x => x.dias || 0);
        
        const chartSemanaEl = document.getElementById('chartTempoMedioSemana');
        if (chartSemanaEl) {
          if (window.chartTempoMedioSemana instanceof Chart) window.chartTempoMedioSemana.destroy();
          const ctxSemana = chartSemanaEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartTempoMedioSemana = new Chart(ctxSemana, {
            type: 'line',
            data: {
              labels: labelsSemana,
              datasets: [{
                label: 'Tempo Médio (dias)',
                data: valuesSemana,
                borderColor: 'rgba(167,139,250,1)',
                backgroundColor: 'rgba(167,139,250,0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'line', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
        addClickFn(window.chartTempoMedioSemana, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioSemana');
        }
      }
      
      // Gráfico por Unidade de Cadastro
      if (dataUnidade && dataUnidade.length > 0) {
        const labelsUnidade = dataUnidade.map(x => x.unit || 'Não informado');
        const valuesUnidade = dataUnidade.map(x => x.dias || 0);
        
        const chartUnidadeEl = document.getElementById('chartTempoMedioUnidade');
        if (chartUnidadeEl) {
          if (window.chartTempoMedioUnidade instanceof Chart) window.chartTempoMedioUnidade.destroy();
          const ctxUnidade = chartUnidadeEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
          const addClickFn = window.charts?.addChartClickHandler || (() => {});
          const showFeedbackFn = window.showClickFeedback || (() => {});
          
          window.chartTempoMedioUnidade = new Chart(ctxUnidade, {
            type: 'bar',
            data: {
              labels: labelsUnidade,
              datasets: [{
                label: 'Dias',
                data: valuesUnidade,
                backgroundColor: 'rgba(167,139,250,0.7)',
                borderColor: 'rgba(167,139,250,1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: tooltipFn(),
                datalabels: {
                  ...dataLabelsFn(),
                  anchor: 'start',
                  align: 'end'
                }
              },
              scales: {
                x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
          addClickFn(window.chartTempoMedioUnidade, (label, value) => showFeedbackFn(null, label, value), 'chartTempoMedioUnidade');
        }
      }
      
      // Gráfico por Unidade de Cadastro por Mês
      if (dataUnidadeMes && dataUnidadeMes.length > 0) {
        const meses = [...new Set(dataUnidadeMes.map(d => d.month).filter(m => m && typeof m === 'string' && m.includes('-')))].sort();
        const unidades = [...new Set(dataUnidadeMes.map(d => d.unit).filter(u => u))];
        const colors = ['#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'];
        
        const datasets = unidades.slice(0, 10).map((unit, idx) => ({
          label: unit || 'Não informado',
          data: meses.map(month => {
            const item = dataUnidadeMes.find(d => d.month === month && d.unit === unit);
            return item ? (item.dias || 0) : 0;
          }),
          backgroundColor: colors[idx % colors.length] + '80',
          borderColor: colors[idx % colors.length],
          borderWidth: 1
        }));
        
        // OTIMIZADO: Usar dateUtils centralizado
        const labelsMes = meses.map(m => {
          return window.dateUtils?.formatMonthYear?.(m) || m || 'Data inválida';
        });
        
        const chartUnidadeMesEl = document.getElementById('chartTempoMedioUnidadeMes');
        if (chartUnidadeMesEl) {
          if (window.chartTempoMedioUnidadeMes instanceof Chart) window.chartTempoMedioUnidadeMes.destroy();
          const ctxUnidadeMes = chartUnidadeMesEl.getContext('2d');
          const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
          
          window.chartTempoMedioUnidadeMes = new Chart(ctxUnidadeMes, {
            type: 'line',
            data: {
              labels: labelsMes,
              datasets: datasets
            },
            options: {
              responsive: true,
              animation: false, // OTIMIZAÇÃO: Desabilitar animação
              plugins: {
                legend: { display: true, position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } },
                tooltip: tooltipFn(),
                datalabels: { display: false }
              },
              scales: {
                y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao carregar tempo médio:', error);
    const errorMsg = error.message || 'Erro desconhecido ao carregar dados';
    const listaEl = document.getElementById('listaTempoMedio');
    if (listaEl) {
      listaEl.innerHTML = `<div class="text-red-400 text-center py-8">Erro ao carregar dados: ${errorMsg}</div>`;
    }
  }
}

/**
 * Função auxiliar: Criar gráfico de barras horizontal genérico
 */
function createHorizontalBarChart(chartId, labels, values, color, options = {}) {
  const chartEl = document.getElementById(chartId);
  if (!chartEl) return;
  
  if (window[`chart${chartId.replace('chart', '')}`] instanceof Chart) {
    window[`chart${chartId.replace('chart', '')}`].destroy();
  }
  
  const ctx = chartEl.getContext('2d');
  const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
  const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
  const addClickFn = window.charts?.addChartClickHandler || (() => {});
  const showFeedbackFn = window.showClickFeedback || (() => {});
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: options.label || 'Dados',
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: tooltipFn(),
        datalabels: {
          ...dataLabelsFn(options.showDataLabels !== false, 'bar', options.anchor === 'start'),
          ...(options.anchor === 'start' ? { anchor: 'start', align: 'end' } : {})
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
  
  window[`chart${chartId.replace('chart', '')}`] = chart;
  addClickFn(chart, (label, value) => showFeedbackFn(null, label, value), chartId);
  
  return chart;
}

/**
 * Carregar Categoria
 */
async function loadCategoria() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=Categoria');
    const labels = data.slice(0, 15).map(x => x.key);
    const values = data.slice(0, 15).map(x => x.count);
    
    createHorizontalBarChart('chartCategoria', labels, values, '#f472b6', {
      label: 'Categoria',
      showDataLabels: true,
      anchor: 'start'
    });
    
    // Heatmap
    const hm = await fetchFn('/api/aggregate/heatmap?dim=Categoria').catch(() => ({ labels: [], rows: [] }));
    buildHeatmap('heatmapCategoria', hm.labels || [], hm.rows || []);
    
    // Gráfico mensal
    const dataMensal = await fetchFn('/api/aggregate/by-month').catch(() => []);
    if (dataMensal && dataMensal.length > 0) {
      // OTIMIZADO: Usar dateUtils centralizado
      const labelsMes = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
      });
      const valuesMes = dataMensal.map(x => x.count || 0);
      
      const chartMesEl = document.getElementById('chartCategoriaMes');
      if (chartMesEl) {
        if (window.chartCategoriaMes instanceof Chart) window.chartCategoriaMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartCategoriaMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Manifestações',
              data: valuesMes,
              backgroundColor: 'rgba(244,114,182,0.7)',
              borderColor: 'rgba(244,114,182,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Categoria:', error);
  }
}

/**
 * Carregar Status Page
 */
async function loadStatusPage() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=status');
    
    if (!data || data.length === 0) {
      console.warn('⚠️ Nenhum dado de status disponível');
      const ctx = document.getElementById('chartStatusPage')?.getContext('2d');
      if (ctx && window.chartStatusPage instanceof Chart) {
        window.chartStatusPage.destroy();
        window.chartStatusPage = null;
      }
      return;
    }
    
    const labels = data.map(x => x.key || 'Não informado');
    const values = data.map(x => x.count || 0);
    
    const chartEl = document.getElementById('chartStatusPage');
    if (!chartEl) return;
    
    if (window.chartStatusPage instanceof Chart) window.chartStatusPage.destroy();
    const ctx = chartEl.getContext('2d');
    
    const colors = ['#38bdf8', '#22d3ee', '#fbbf24', '#34d399', '#fb7185', '#e879f9', '#a78bfa', '#8b5cf6', '#06b6d4', '#10b981'];
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    window.chartStatusPage = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map((_, i) => colors[i % colors.length])
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } },
          tooltip: tooltipFn(),
          datalabels: dataLabelsFn(true, 'doughnut')
        }
      }
    });
    
    addClickFn(window.chartStatusPage, (label, value) => showFeedbackFn(null, label, value), 'chartStatusPage');
  } catch (error) {
    console.error('❌ Erro ao carregar Status Page:', error);
  }
}

/**
 * Carregar Bairro
 */
async function loadBairro() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=Bairro');
    const labels = data.slice(0, 15).map(x => x.key);
    const values = data.slice(0, 15).map(x => x.count);
    
    createHorizontalBarChart('chartBairro', labels, values, '#f59e0b', {
      label: 'Bairro',
      anchor: 'start'
    });
    
    // Heatmap
    const hm = await fetchFn('/api/aggregate/heatmap?dim=Bairro').catch(() => ({ labels: [], rows: [] }));
    buildHeatmap('heatmapBairro', hm.labels || [], hm.rows || []);
    
    // Gráfico mensal
    const dataMensal = await fetchFn('/api/aggregate/by-month').catch(() => []);
    if (dataMensal && dataMensal.length > 0) {
      // OTIMIZADO: Usar dateUtils centralizado
      const labelsMes = dataMensal.map(x => {
        const ym = x.ym || x.month || '';
        return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
      });
      const valuesMes = dataMensal.map(x => x.count || 0);
      
      const chartMesEl = document.getElementById('chartBairroMes');
      if (chartMesEl) {
        if (window.chartBairroMes instanceof Chart) window.chartBairroMes.destroy();
        const ctxMes = chartMesEl.getContext('2d');
        const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
        const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
        
        window.chartBairroMes = new Chart(ctxMes, {
          type: 'bar',
          data: {
            labels: labelsMes,
            datasets: [{
              label: 'Manifestações',
              data: valuesMes,
              backgroundColor: 'rgba(245,158,11,0.7)',
              borderColor: 'rgba(245,158,11,1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: tooltipFn(),
              datalabels: dataLabelsFn(false, 'bar', false)
            },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Bairro:', error);
  }
}

/**
 * Carregar UAC
 */
async function loadUAC() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=UAC');
    const labels = data.slice(0, 15).map(x => x.key);
    const values = data.slice(0, 15).map(x => x.count);
    
    createHorizontalBarChart('chartUAC', labels, values, '#34d399', {
      label: 'UAC',
      anchor: 'start'
    });
    
    // Heatmap
    const hm = await fetchFn('/api/aggregate/heatmap?dim=UAC').catch(() => ({ labels: [], rows: [] }));
    buildHeatmap('heatmapUAC', hm.labels || [], hm.rows || []);
  } catch (error) {
    console.error('❌ Erro ao carregar UAC:', error);
  }
}

/**
 * Carregar Responsável
 */
async function loadResponsavel() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=Responsavel');
    const labels = data.slice(0, 15).map(x => x.key);
    const values = data.slice(0, 15).map(x => x.count);
    
    createHorizontalBarChart('chartResponsavel', labels, values, '#8b5cf6', {
      label: 'Responsável',
      anchor: 'start'
    });
    
    // Heatmap
    const hm = await fetchFn('/api/aggregate/heatmap?dim=Responsavel').catch(() => ({ labels: [], rows: [] }));
    buildHeatmap('heatmapResponsavel', hm.labels || [], hm.rows || []);
  } catch (error) {
    console.error('❌ Erro ao carregar Responsável:', error);
  }
}

/**
 * Carregar Canal
 */
async function loadCanal() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=Canal');
    const labels = data.map(x => x.key);
    const values = data.map(x => x.count);
    
    const chartEl = document.getElementById('chartCanal');
    if (!chartEl) return;
    
    if (window.chartCanal instanceof Chart) window.chartCanal.destroy();
    const ctx = chartEl.getContext('2d');
    
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    window.chartCanal = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'Canal',
          data: values,
          backgroundColor: ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'right', labels: { color: '#94a3b8' } },
          tooltip: tooltipFn(),
          datalabels: dataLabelsFn(true, 'pie')
        }
      }
    });
    
    addClickFn(window.chartCanal, (label, value) => showFeedbackFn(null, label, value), 'chartCanal');
  } catch (error) {
    console.error('❌ Erro ao carregar Canal:', error);
  }
}

/**
 * Carregar Prioridade
 */
async function loadPrioridade() {
  try {
    const fetchFn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
    const data = await fetchFn('/api/aggregate/count-by?field=Prioridade');
    const labels = data.map(x => x.key);
    const values = data.map(x => x.count);
    
    const chartEl = document.getElementById('chartPrioridade');
    if (!chartEl) return;
    
    if (window.chartPrioridade instanceof Chart) window.chartPrioridade.destroy();
    const ctx = chartEl.getContext('2d');
    
    const tooltipFn = window.utils?.createEnhancedTooltip || (() => ({}));
    const dataLabelsFn = window.utils?.createDataLabelsConfig || (() => ({}));
    const addClickFn = window.charts?.addChartClickHandler || (() => {});
    const showFeedbackFn = window.showClickFeedback || (() => {});
    
    window.chartPrioridade = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Prioridade',
          data: values,
          backgroundColor: '#fb7185',
          borderColor: '#fb7185',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: tooltipFn(),
          datalabels: dataLabelsFn(false, 'bar', false)
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
    
    addClickFn(window.chartPrioridade, (label, value) => showFeedbackFn(null, label, value), 'chartPrioridade');
  } catch (error) {
    console.error('❌ Erro ao carregar Prioridade:', error);
  }
}

// Exportar funções globalmente para compatibilidade
window.reloadAllData = reloadAllData;
window.loadKpisWithData = loadKpisWithData;
window.loadKpis = loadKpis;

