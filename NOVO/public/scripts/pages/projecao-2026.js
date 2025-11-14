/**
 * Página: Projeção 2026
 * Projeções e previsões para 2026
 * 
 * Recriada com estrutura otimizada
 */

async function loadProjecao2026() {
  if (window.Logger) {
    window.Logger.debug('📈 loadProjecao2026: Iniciando');
  }
  
  const page = document.getElementById('page-projecao-2026');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const [byMonth, temas] = await Promise.all([
      window.dataLoader?.load('/api/aggregate/by-month', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || [],
      window.dataLoader?.load('/api/aggregate/by-theme', {
        useDataStore: true,
        ttl: 10 * 60 * 1000
      }) || []
    ]);
    
    // Processar histórico
    const historico = byMonth.map(x => {
      const ym = x.ym || x.month || '';
      if (!ym || typeof ym !== 'string') {
        return {
          label: ym || 'Data inválida',
          value: x.count || 0
        };
      }
      return {
        label: window.dateUtils?.formatMonthYear?.(ym) || ym,
        value: x.count || 0
      };
    });
    
    // Calcular média mensal dos últimos 12 meses
    const ultimos12Meses = historico.slice(-12);
    const mediaMensal = ultimos12Meses.reduce((sum, item) => sum + item.value, 0) / ultimos12Meses.length;
    
    // Gerar projeção para 2026
    const projecao2026 = [];
    for (let mes = 1; mes <= 12; mes++) {
      const ym = `2026-${String(mes).padStart(2, '0')}`;
      projecao2026.push({
        label: window.dateUtils?.formatMonthYear?.(ym) || `${mes}/2026`,
        value: Math.round(mediaMensal * (1 + (Math.random() * 0.2 - 0.1))) // Variação de ±10%
      });
    }
    
    // Renderizar gráfico de projeção
    await renderProjecaoChart(historico, projecao2026);
    
    // Renderizar estatísticas
    renderEstatisticas(historico, projecao2026, mediaMensal);
    
    // Renderizar top temas
    renderTopTemas(temas);
    
    if (window.Logger) {
      window.Logger.success('📈 loadProjecao2026: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Projecao2026:', error);
    }
  }
}

async function renderProjecaoChart(historico, projecao2026) {
  const todosLabels = [...historico.map(h => h.label), ...projecao2026.map(p => p.label)];
  const historicoValues = historico.map(h => h.value);
  const projecaoValues = projecao2026.map(p => p.value);
  
  const datasets = [
    {
      label: 'Histórico',
      data: [...historicoValues, ...Array(12).fill(null)],
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34,211,238,0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Projeção 2026',
      data: [...Array(historico.length).fill(null), ...projecaoValues],
      borderColor: '#a78bfa',
      backgroundColor: 'rgba(167,139,250,0.1)',
      borderDash: [5, 5],
      fill: true,
      tension: 0.4
    }
  ];
  
  await window.chartFactory?.createLineChart('chartProjecaoMensal', todosLabels, datasets, {
    fill: true,
    tension: 0.4,
    chartOptions: {
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#94a3b8' } }
      },
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 45 } }
      }
    }
  });
}

function renderEstatisticas(historico, projecao2026, mediaMensal) {
  const totalHistorico = historico.reduce((sum, item) => sum + item.value, 0);
  const totalProjetado = projecao2026.reduce((sum, item) => sum + item.value, 0);
  
  const totalHistoricoEl = document.getElementById('totalHistorico');
  const totalProjetadoEl = document.getElementById('totalProjetado');
  const mediaMensalEl = document.getElementById('mediaMensal');
  
  if (totalHistoricoEl) totalHistoricoEl.textContent = totalHistorico.toLocaleString('pt-BR');
  if (totalProjetadoEl) totalProjetadoEl.textContent = totalProjetado.toLocaleString('pt-BR');
  if (mediaMensalEl) mediaMensalEl.textContent = Math.round(mediaMensal).toLocaleString('pt-BR');
}

function renderTopTemas(temas) {
  const topTemas = temas.slice(0, 10);
  const listaTemasEl = document.getElementById('listaTemasProjecao');
  if (!listaTemasEl) return;
  
  listaTemasEl.innerHTML = topTemas.map((item, idx) => {
    const tema = item.theme || item.tema || item._id || 'N/A';
    const quantidade = item.count || item.quantidade || 0;
    return `
      <div class="flex items-center gap-3 py-2 border-b border-white/5">
        <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
        <div class="flex-1 text-sm text-slate-300 truncate">${tema}</div>
        <div class="text-lg font-bold text-violet-300 min-w-[80px] text-right">${quantidade.toLocaleString('pt-BR')}</div>
      </div>
    `;
  }).join('');
}

window.loadProjecao2026 = loadProjecao2026;

