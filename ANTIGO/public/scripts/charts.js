/**
 * Charts Module - Renderização e manipulação de gráficos
 * Centraliza funções de criação e atualização de gráficos Chart.js
 */

/**
 * Adicionar handler de clique em gráfico
 * DESABILITADO: Filtros globais removidos - gráficos não aplicam mais filtros
 */
function addChartClickHandler(chart, onClickCallback, chartId = null) {
  if (!chart || !chart.canvas) return;
  
  // DESABILITADO: Não adicionar cursor pointer nem handlers de clique
  // Os gráficos mostram apenas seus próprios dados, sem aplicar filtros globais
  // chart.canvas.style.cursor = 'pointer';
  // chart.canvas.onclick = ... (removido)
  
  // Se houver callback customizado, ainda pode ser usado para outras funcionalidades
  // mas não para aplicar filtros globais
  if (onClickCallback && typeof onClickCallback === 'function') {
    // Opcional: ainda permitir callback se necessário, mas sem aplicar filtros
    // chart.canvas.onclick = function(evt) {
    //   const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    //   if (points.length) {
    //     const firstPoint = points[0];
    //     const label = chart.data.labels[firstPoint.index];
    //     const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
    //     onClickCallback(label, value, firstPoint.index);
    //   }
    // };
  }
}

/**
 * Destruir gráfico se existir
 */
function destroyChart(chartInstance) {
  if (chartInstance && chartInstance instanceof Chart) {
    chartInstance.destroy();
  }
}

/**
 * Criar gráfico de linha
 */
function createLineChart(ctx, labels, data, options = {}) {
  const defaultOptions = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: options.label || 'Dados',
        data: data,
        fill: options.fill !== false,
        borderColor: options.borderColor || '#22d3ee',
        backgroundColor: options.backgroundColor || 'rgba(34,211,238,0.35)',
        tension: options.tension || 0.35,
        borderWidth: options.borderWidth || 2,
        pointRadius: options.pointRadius || 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: options.showLegend !== false },
        tooltip: window.utils?.createEnhancedTooltip?.() || {},
        datalabels: { display: false }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' } },
        y: { ticks: { color: '#94a3b8' }, beginAtZero: true }
      }
    }
  };
  
  return new Chart(ctx, defaultOptions);
}

/**
 * Criar gráfico de barras
 */
function createBarChart(ctx, labels, data, options = {}) {
  const defaultOptions = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: options.label || 'Dados',
        data: data,
        backgroundColor: options.backgroundColor || 'rgba(167,139,250,0.7)',
        borderColor: options.borderColor || 'rgba(167,139,250,1)',
        borderWidth: options.borderWidth || 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: options.horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: options.showLegend !== false },
        tooltip: window.utils?.createEnhancedTooltip?.() || {},
        datalabels: window.utils?.createDataLabelsConfig?.() || { display: false }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, beginAtZero: true },
        y: { ticks: { color: '#94a3b8' }, beginAtZero: true }
      }
    }
  };
  
  return new Chart(ctx, defaultOptions);
}

/**
 * Criar gráfico de pizza/rosquinha
 */
function createDoughnutChart(ctx, labels, data, colors = null) {
  const defaultColors = [
    '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#f472b6',
    '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#6366f1'
  ];
  
  const chartColors = colors || labels.map((_, idx) => defaultColors[idx % defaultColors.length]);
  
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: chartColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: window.utils?.createEnhancedTooltip?.() || {},
        datalabels: window.utils?.createDataLabelsConfig?.(true, 'doughnut') || { display: false }
      }
    }
  });
}

// Exportar funções para uso global
window.charts = {
  addChartClickHandler,
  destroyChart,
  createLineChart,
  createBarChart,
  createDoughnutChart
};

