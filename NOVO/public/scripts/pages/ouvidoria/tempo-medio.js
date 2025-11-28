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
      useDataStore: !mesSelecionado, // Não cachear quando há filtro
      ttl: 5 * 60 * 1000,
      fallback: { media: 0, mediana: 0, minimo: 0, maximo: 0, total: 0 } // Fallback para erro 502
    }) || {};
    
    if (window.Logger) {
      window.Logger.debug(`⏱️ Stats recebidos:`, stats);
    }
    
    // Renderizar estatísticas (sempre atualizar os cards)
    renderTempoMedioStats(stats);
    
    // Renderizar gráficos principais
    await renderTempoMedioCharts(stats, dataMes, mesSelecionado);
    
    // Carregar dados secundários em background
    loadSecondaryTempoMedioData(mesSelecionado).catch(err => {
      if (window.Logger) {
        window.Logger.debug('Erro ao carregar dados secundários:', err);
      }
    });
    
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
          <p class="text-slate-300">Atualizando gráficos e cards...</p>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
    }
    
    // Destruir todos os gráficos antes de recarregar
    destroyAllTempoMedioCharts();
    
    // Invalidar cache para forçar recarregamento (especialmente stats)
    if (window.dataStore) {
      window.dataStore.invalidate();
      // Invalidar especificamente o cache de stats
      const statsUrl = novoMes 
        ? `/api/stats/average-time/stats?meses=${encodeURIComponent(novoMes)}`
        : '/api/stats/average-time/stats';
      if (typeof window.dataStore.clear === 'function') {
        window.dataStore.clear(statsUrl);
      } else if (window.Logger) {
        window.Logger.debug('dataStore.clear indisponível; cache específico não removido');
      }
    }
    
    try {
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
    window.Logger.debug('📊 Cards atualizados:', { media, mediana, minimo, maximo });
  }
}

async function renderTempoMedioCharts(stats, dataMes, mesSelecionado = '') {
  try {
    // Carregar dados por órgão/unidade (com filtro de mês se selecionado)
    const dataOrgaoUrl = mesSelecionado 
      ? `/api/stats/average-time?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time';
    
    const dataOrgao = await window.dataLoader?.load(dataOrgaoUrl, {
        useDataStore: !mesSelecionado, // Não cachear quando há filtro
        ttl: 5 * 60 * 1000,
        fallback: [] // Fallback para erro 502
      }) || [];
    
    // Gráfico principal: Tempo médio por órgão/unidade
    if (dataOrgao && Array.isArray(dataOrgao) && dataOrgao.length > 0) {
      const top20 = dataOrgao.slice(0, 20);
      const labels = top20.map(o => o.org || o.unit || o._id || 'N/A');
      const values = top20.map(o => o.dias || o.average || o.media || 0);
      
      if (labels.length > 0 && values.length > 0) {
        // Destruir gráfico existente antes de criar novo
        destroyChartSafely('chartTempoMedio');
        
        await window.chartFactory?.createBarChart('chartTempoMedio', labels, values, {
          horizontal: true,
          colorIndex: 0,
          label: 'Tempo Médio (dias)',
          onClick: true // Habilitar comunicação e filtros globais
        });
        
        // Renderizar ranking
        renderTempoMedioRanking(dataOrgao);
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
          onClick: true // Habilitar comunicação e filtros globais
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
  
  listaTempoMedio.innerHTML = dataOrgao.slice(0, 20).map((item, idx) => {
    const unit = item.org || item.unit || item._id || 'N/A';
    const average = (item.dias || item.average || item.media || 0).toFixed(1);
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 w-8">${idx + 1}.</span>
          <span class="text-sm text-slate-300">${unit}</span>
        </div>
        <span class="text-sm font-bold text-cyan-300">${average} dias</span>
      </div>
    `;
  }).join('');
}

async function loadSecondaryTempoMedioData(mesSelecionado = '') {
  try {
    // Carregar dados por dia (com filtro de mês se selecionado)
    const dataDiaUrl = mesSelecionado 
      ? `/api/stats/average-time/by-day?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time/by-day';
    
    const dataDia = await window.dataLoader?.load(dataDiaUrl, {
      useDataStore: !mesSelecionado, // Não cachear quando há filtro
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
          onClick: true // Habilitar comunicação e filtros globais
        });
      }
    }
    
    // Carregar dados por semana (com filtro de mês se selecionado)
    const dataSemanaUrl = mesSelecionado 
      ? `/api/stats/average-time/by-week?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time/by-week';
    
    const dataSemana = await window.dataLoader?.load(dataSemanaUrl, {
      useDataStore: !mesSelecionado, // Não cachear quando há filtro
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
          onClick: true, // Habilitar comunicação e filtros globais
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
      useDataStore: !mesSelecionado, // Não cachear quando há filtro
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
          onClick: true // Habilitar comunicação e filtros globais
        });
      }
    }
    
    // Carregar dados por unidade e mês (com filtro de mês se selecionado)
    const dataUnidadeMesUrl = mesSelecionado 
      ? `/api/stats/average-time/by-month-unit?meses=${encodeURIComponent(mesSelecionado)}`
      : '/api/stats/average-time/by-month-unit';
    
    const dataUnidadeMes = await window.dataLoader?.load(dataUnidadeMesUrl, {
      useDataStore: !mesSelecionado, // Não cachear quando há filtro
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
          onClick: true, // Habilitar comunicação e filtros globais
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

