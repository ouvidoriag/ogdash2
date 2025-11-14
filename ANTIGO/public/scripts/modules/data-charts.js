/**
 * Módulo: Gráficos Avançados
 * Funções relacionadas a gráficos avançados (Sankey, TreeMap, Mapa, Heatmap, Sparklines)
 * Extraído de data.js para melhor organização
 */

/**
 * Garantir que Plotly.js está carregado
 * OTIMIZAÇÃO: Carrega Plotly.js sob demanda
 * @returns {Promise} Promise que resolve quando Plotly.js está pronto
 */
async function ensurePlotly() {
  if (typeof Plotly !== 'undefined') {
    return Promise.resolve();
  }
  
  if (window.lazyLibraries?.loadPlotly) {
    return window.lazyLibraries.loadPlotly();
  }
  
  // Fallback: tentar carregar manualmente
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.plot.ly/plotly-2.26.0.min.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      if (window.Logger) {
        window.Logger.warn('Erro ao carregar Plotly.js');
      } else {
        console.warn('⚠️ Erro ao carregar Plotly.js');
      }
      reject(new Error('Plotly.js não carregado'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Carregar gráficos avançados (Sankey, TreeMap, Mapa)
 */
async function loadAdvancedCharts(temas = null, orgaos = null) {
  try {
    // CORREÇÃO: Usar sistema global de carregamento (window.dataLoader)
    // O dataLoader já otimiza automaticamente
    // Se temas e orgaos já foram carregados, reutilizar (evita requisições duplicadas)
    const results = await Promise.allSettled([
      temas ? Promise.resolve(temas) : (window.dataLoader?.load('/api/aggregate/by-theme', { fallback: [] }) || Promise.resolve([])),
      orgaos ? Promise.resolve(orgaos) : (window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', { fallback: [] }) || Promise.resolve([])),
      window.dataLoader?.load('/api/aggregate/count-by?field=status', { fallback: [] }) || Promise.resolve([]),
      window.dataLoader?.load('/api/aggregate/count-by?field=Bairro', { fallback: [] }) || Promise.resolve([])
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
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao carregar gráficos avançados:', error);
    } else {
      console.error('❌ Erro ao carregar gráficos avançados:', error);
    }
  }
}

/**
 * Criar Sankey Diagram
 */
async function loadSankeyChart(temas, orgaos, status) {
  try {
    const container = document.getElementById('sankeyChart');
    if (!container) {
      // CORREÇÃO: Elemento opcional - não é erro se não existir
      // Usar debug em vez de warn para reduzir ruído no console
      if (window.Logger) {
        window.Logger.debug('Elemento sankeyChart não encontrado (opcional)');
      }
      return;
    }
    
    // OTIMIZAÇÃO: Carregar Plotly.js sob demanda
    try {
      await ensurePlotly();
    } catch (error) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Plotly.js não está disponível</div>';
      return;
    }
    
    // CORREÇÃO: Usar sistema global de carregamento
    let flowData = null;
    try {
      flowData = await window.dataLoader?.load('/api/aggregate/sankey-flow', {
        fallback: null,
        timeout: 30000
      }) || null;
    } catch (e) {
      // Ignorar erro silenciosamente
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn('Erro ao carregar dados Sankey:', e);
      } else {
        console.warn('⚠️ Erro ao carregar dados Sankey:', e);
      }
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
      
      const containerEl = document.getElementById('sankeyChart');
      if (containerEl) {
        Plotly.newPlot(containerEl, data, layout, { responsive: true, displayModeBar: false });
        // FASE 2.1: Usar Logger (apenas em dev)
        if (window.Logger) {
          window.Logger.debug('Gráfico Sankey criado (fallback)');
        }
      }
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
    
    const containerEl = document.getElementById('sankeyChart');
    if (containerEl) {
      Plotly.newPlot(containerEl, data, layout, { responsive: true, displayModeBar: false });
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('Gráfico Sankey criado');
      }
    }
  } catch (error) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao criar gráfico Sankey:', error);
    } else {
      console.error('❌ Erro ao criar gráfico Sankey:', error);
    }
    const container = document.getElementById('sankeyChart');
    if (container) {
      container.innerHTML = '<div class="p-4 text-center text-red-400">Erro ao carregar gráfico Sankey</div>';
    }
  }
}

/**
 * Criar TreeMap Chart
 */
async function loadTreeMapChart(temas) {
  try {
    // CORREÇÃO: Verificar ambos os IDs possíveis (treemapChart e treeMapChart)
    const container = document.getElementById('treemapChart') || document.getElementById('treeMapChart');
    if (!container) {
      // CORREÇÃO: Elemento opcional - não é erro se não existir
      // Usar debug em vez de warn para reduzir ruído no console
      if (window.Logger) {
        window.Logger.debug('Elemento treemapChart/treeMapChart não encontrado (opcional)');
      }
      return;
    }
    
    // OTIMIZAÇÃO: Carregar Plotly.js sob demanda
    try {
      await ensurePlotly();
    } catch (error) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Plotly.js não está disponível</div>';
      return;
    }
    
    if (!temas || temas.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Sem dados de temas disponíveis</div>';
      return;
    }
    
    const topTemas = temas.slice(0, 15);
    const labels = topTemas.map(t => t.tema || 'Não informado');
    const values = topTemas.map(t => t.quantidade || 0);
    const parents = topTemas.map(() => '');
    
    const data = [{
      type: 'treemap',
      labels: labels,
      values: values,
      parents: parents,
      marker: {
        colors: Array.from({ length: topTemas.length }, (_, i) => {
          const hue = (i * 137.508) % 360; // Golden angle para distribuição de cores
          return `hsl(${hue}, 70%, 50%)`;
        }),
        line: { color: '#0f172a', width: 2 }
      },
      textfont: { color: '#ffffff', size: 12 },
      hovertemplate: '<b>%{label}</b><br>Quantidade: %{value}<extra></extra>'
    }];
    
    const layout = {
      title: '',
      font: { color: '#94a3b8' },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 0, r: 0, t: 0, b: 0 }
    };
    
    Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });
    // FASE 2.1: Usar Logger (apenas em dev)
    if (window.Logger) {
      window.Logger.debug('Gráfico TreeMap criado');
    }
  } catch (error) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao criar gráfico TreeMap:', error);
    } else {
      console.error('❌ Erro ao criar gráfico TreeMap:', error);
    }
    const container = document.getElementById('treeMapChart');
    if (container) {
      container.innerHTML = '<div class="p-4 text-center text-red-400">Erro ao carregar gráfico TreeMap</div>';
    }
  }
}

/**
 * Criar Mapa Geográfico
 * CORREÇÃO: Buscar dados de bairro diretamente do banco de dados
 */
async function loadGeographicMap(bairros = null) {
  try {
    // CORREÇÃO: Verificar ambos os IDs possíveis (mapChart e geographicMap)
    const container = document.getElementById('mapChart') || document.getElementById('geographicMap');
    if (!container) {
      // CORREÇÃO: Elemento opcional - não é erro se não existir
      // Usar debug em vez de warn para reduzir ruído no console
      if (window.Logger) {
        window.Logger.debug('Elemento mapChart/geographicMap não encontrado (opcional)');
      }
      return;
    }
    
    // CORREÇÃO: Buscar dados de bairro do banco de dados se não foram passados
    let bairrosData = bairros;
    if (!bairrosData || bairrosData.length === 0) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.debug('Buscando dados de bairro do banco de dados...');
      }
      
      // Buscar dados de bairro diretamente da API
      bairrosData = await window.dataLoader?.load('/api/aggregate/count-by?field=Bairro', { 
        fallback: [] 
      }) || [];
      
      if (window.Logger) {
        window.Logger.debug(`Dados de bairro carregados: ${bairrosData.length} itens`);
      }
    }
    
    if (!bairrosData || bairrosData.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Sem dados de bairros disponíveis</div>';
      return;
    }
    
    // Usar Plotly se disponível, senão criar gráfico de barras com Chart.js
    if (typeof Plotly !== 'undefined') {
      // Criar gráfico de barras horizontal com Plotly
      const topBairros = bairrosData.slice(0, 15); // Top 15 bairros
      const labels = topBairros.map(b => b.key || b.bairro || 'Não informado');
      const values = topBairros.map(b => b.count || b.quantidade || 0);
      
      const data = [{
        type: 'bar',
        x: values,
        y: labels,
        orientation: 'h',
        marker: {
          color: 'rgba(34,211,238,0.7)',
          line: { color: 'rgba(34,211,238,1)', width: 1 }
        },
        text: values.map(v => v.toLocaleString('pt-BR')),
        textposition: 'auto'
      }];
      
      const layout = {
        title: '',
        font: { color: '#94a3b8', size: 12 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: { 
          title: 'Quantidade', 
          color: '#94a3b8',
          gridcolor: 'rgba(255,255,255,0.05)'
        },
        yaxis: { 
          title: 'Bairro', 
          color: '#94a3b8',
          gridcolor: 'rgba(255,255,255,0.05)'
        },
        margin: { l: 120, r: 20, t: 20, b: 40 }
      };
      
      Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });
      
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('Mapa geográfico criado com Plotly');
      }
    } else if (typeof Chart !== 'undefined' && container.tagName === 'CANVAS') {
      // Fallback: Usar Chart.js se Plotly não estiver disponível E container for canvas
      const topBairros = bairrosData.slice(0, 15);
      const labels = topBairros.map(b => b.key || b.bairro || 'Não informado');
      const values = topBairros.map(b => b.count || b.quantidade || 0);
      
      // Destruir gráfico anterior se existir
      if (window.chartGeographicMap instanceof Chart) {
        window.chartGeographicMap.destroy();
      }
      
      const ctx = container.getContext('2d');
      window.chartGeographicMap = new Chart(ctx, {
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
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Quantidade: ${context.parsed.x.toLocaleString('pt-BR')}`;
                }
              }
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
      
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('Mapa geográfico criado com Chart.js (fallback)');
      }
    } else {
      // Fallback final: HTML simples
      const topBairros = bairrosData.slice(0, 15);
      let html = '<div class="space-y-2">';
      topBairros.forEach((b, idx) => {
        const bairro = b.key || b.bairro || 'Não informado';
        const count = b.count || b.quantidade || 0;
        html += `
          <div class="flex items-center justify-between p-2 rounded bg-slate-800/50">
            <span class="text-slate-300">${idx + 1}. ${bairro}</span>
            <span class="text-cyan-300 font-bold">${count.toLocaleString('pt-BR')}</span>
          </div>
        `;
      });
      html += '</div>';
      container.innerHTML = html;
      
      // FASE 2.1: Usar Logger (apenas em dev)
      if (window.Logger) {
        window.Logger.debug('Mapa geográfico criado com HTML (fallback)');
      }
    }
  } catch (error) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao criar mapa geográfico:', error);
    } else {
      console.error('❌ Erro ao criar mapa geográfico:', error);
    }
    const container = document.getElementById('mapChart') || document.getElementById('geographicMap');
    if (container) {
      container.innerHTML = '<div class="p-4 text-center text-red-400">Erro ao carregar mapa geográfico</div>';
    }
  }
}

/**
 * Construir Heatmap
 */
function buildHeatmap(containerId, labels, rows) {
  try {
    const container = document.getElementById(containerId);
    if (!container) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn(`Elemento ${containerId} não encontrado`);
      } else {
        console.warn(`⚠️ Elemento ${containerId} não encontrado`);
      }
      return;
    }
    
    // CORREÇÃO CRÍTICA: Validar dados antes de processar
    if (!labels || !Array.isArray(labels) || labels.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Sem labels para heatmap</div>';
      return;
    }
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400">Sem dados para heatmap</div>';
      return;
    }
    
    // Criar tabela HTML para heatmap
    let html = '<div class="overflow-auto"><table class="w-full text-xs">';
    
    // Cabeçalho
    html += '<thead><tr><th class="px-2 py-1 text-left text-slate-300"></th>';
    labels.forEach(label => {
      html += `<th class="px-2 py-1 text-center text-slate-300">${label}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Linhas
    // CORREÇÃO CRÍTICA: Verificar se rows é array e se cada row é array ou objeto
    // NUNCA chamar row.forEach diretamente - sempre verificar o formato primeiro
    rows.forEach((row, idx) => {
      // CORREÇÃO: Validar row antes de usar
      if (!row || (typeof row !== 'object' && !Array.isArray(row))) {
        if (window.Logger) {
          window.Logger.warn(`Linha inválida no heatmap (índice ${idx}):`, row);
        }
        return; // Pular esta linha
      }
      
      html += `<tr><td class="px-2 py-1 text-slate-300 font-semibold">${labels[idx] || 'N/A'}</td>`;
      
      // CORREÇÃO: Suportar dois formatos de dados:
      // 1. Array de arrays: [[1,2,3], [4,5,6]]
      // 2. Array de objetos: [{key: 'A', values: [1,2,3]}, {key: 'B', values: [4,5,6]}]
      let values = [];
      if (Array.isArray(row)) {
        // Formato 1: array direto
        values = row;
      } else if (row && typeof row === 'object' && row.values && Array.isArray(row.values)) {
        // Formato 2: objeto com propriedade values
        values = row.values;
      } else {
        // Formato inválido - pular linha
        if (window.Logger) {
          window.Logger.warn(`Formato de linha inválido no heatmap (índice ${idx}):`, row);
        }
        html += '</tr>'; // Fechar linha vazia
        return; // Pular esta linha
      }
      
      // CORREÇÃO: Validar que values é array antes de usar forEach
      if (!Array.isArray(values)) {
        if (window.Logger) {
          window.Logger.warn(`Values não é array no heatmap (índice ${idx}):`, values);
        }
        html += '</tr>'; // Fechar linha vazia
        return; // Pular esta linha
      }
      
      values.forEach((value, colIdx) => {
        const numValue = Number(value) || 0;
        const intensity = Math.min(numValue / 100, 1); // Normalizar para 0-1
        const opacity = 0.3 + (intensity * 0.7);
        const color = `rgba(34,211,238,${opacity})`;
        html += `<td class="px-2 py-1 text-center" style="background-color: ${color}">${numValue || 0}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    // FASE 2.1: Usar Logger (apenas em dev)
    if (window.Logger) {
      window.Logger.debug('Heatmap criado');
    }
  } catch (error) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error('Erro ao criar heatmap:', error);
    } else {
      console.error('❌ Erro ao criar heatmap:', error);
    }
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div class="p-4 text-center text-red-400">Erro ao criar heatmap</div>';
    }
  }
}

/**
 * Desenhar Sparkline
 */
function drawSpark(elementId, values, color = '#22d3ee') {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn(`Elemento ${elementId} não encontrado`);
      } else {
        console.warn(`⚠️ Elemento ${elementId} não encontrado`);
      }
      return;
    }
    
    if (!values || values.length === 0) {
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = el.offsetWidth || 100;
    canvas.height = el.offsetHeight || 30;
    const ctx = canvas.getContext('2d');
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const width = canvas.width;
    const height = canvas.height;
    const stepX = width / (values.length - 1 || 1);
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    values.forEach((val, idx) => {
      const x = idx * stepX;
      const y = height - ((val - min) / range) * height;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    el.innerHTML = '';
    el.appendChild(canvas);
  } catch (error) {
    // FASE 2.1: Usar Logger
    if (window.Logger) {
      window.Logger.error(`Erro ao desenhar sparkline ${elementId}:`, error);
    } else {
      console.error(`❌ Erro ao desenhar sparkline ${elementId}:`, error);
    }
  }
}

/**
 * Desenhar Sparkline Diário
 */
function drawSparkDaily(elementId, values, color = '#22d3ee') {
  // Por enquanto, usar a mesma função
  drawSpark(elementId, values, color);
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  if (!window.data) window.data = {};
  
  window.data.loadAdvancedCharts = loadAdvancedCharts;
  window.data.loadSankeyChart = loadSankeyChart;
  window.data.loadTreeMapChart = loadTreeMapChart;
  window.data.loadGeographicMap = loadGeographicMap;
  window.data.buildHeatmap = buildHeatmap;
  window.data.drawSpark = drawSpark;
  window.data.drawSparkDaily = drawSparkDaily;
  
  // Exportar também como variáveis globais para compatibilidade
  window.loadAdvancedCharts = loadAdvancedCharts;
  window.loadSankeyChart = loadSankeyChart;
  window.loadTreeMapChart = loadTreeMapChart;
  window.loadGeographicMap = loadGeographicMap;
  window.buildHeatmap = buildHeatmap;
  window.drawSpark = drawSpark;
  window.drawSparkDaily = drawSparkDaily;
}

