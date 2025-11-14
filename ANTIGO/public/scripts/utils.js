/**
 * Utils Module - Funções utilitárias e formatações
 * Formatação de números, datas, cores, tooltips, etc.
 */

/**
 * Criar tooltip aprimorado para gráficos
 */
function createEnhancedTooltip() {
  return {
    enabled: true,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    titleColor: '#e2e8f0',
    bodyColor: '#cbd5e1',
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderWidth: 1,
    padding: 12,
    displayColors: true,
    callbacks: {
      title: function(context) {
        return context[0].label || '';
      },
      label: function(context) {
        const label = context.dataset.label || '';
        const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
        const total = context.dataset.data.reduce((a, b) => a + (b || 0), 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        return `${label}: ${value.toLocaleString('pt-BR')} (${percentage}%)`;
      }
    }
  };
}

/**
 * Configurar datalabels para gráficos
 */
function createDataLabelsConfig(showPercentage = false, chartType = 'bar', showAll = true) {
  const baseConfig = {
    color: '#e2e8f0',
    font: {
      size: 11,
      weight: 'bold'
    },
    formatter: function(value, context) {
      if (value === null || value === undefined || isNaN(value)) {
        return '';
      }
      const numValue = Number(value);
      if (isNaN(numValue) || numValue === 0) {
        return '';
      }
      if (showPercentage && context.dataset && context.dataset.data) {
        const total = context.dataset.data.reduce((a, b) => a + (Number(b) || 0), 0);
        const percentage = total > 0 ? ((numValue / total) * 100).toFixed(1) : 0;
        return numValue.toLocaleString('pt-BR') + '\n(' + percentage + '%)';
      }
      return numValue.toLocaleString('pt-BR');
    },
    padding: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 4
  };
  
  // Ajustar anchor e align baseado no tipo de gráfico
  if (chartType === 'doughnut' || chartType === 'pie') {
    baseConfig.anchor = 'center';
    baseConfig.align = 'center';
  } else if (chartType === 'bar' && showAll) {
    baseConfig.anchor = 'end';
    baseConfig.align = 'top';
  } else {
    baseConfig.anchor = 'end';
    baseConfig.align = 'top';
  }
  
  return baseConfig;
}

/**
 * Criar gradiente para gráficos
 */
function gradient(ctx, from, to) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  return g;
}

/**
 * Mostrar feedback visual ao clicar
 * DESABILITADO: Notificações de clique removidas
 */
function showClickFeedback(element, label, value) {
  // DESABILITADO: Não mostrar notificações ao clicar
  return;
}

/**
 * Formatar data para exibição
 * OTIMIZADO: Usa dateUtils se disponível
 */
function formatDate(dateString) {
  if (window.dateUtils?.formatDate) {
    return window.dateUtils.formatDate(dateString);
  }
  // Fallback para compatibilidade
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formatar número com separadores (usando config centralizado)
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const locale = window.config?.FORMAT_CONFIG?.LOCALE || 'pt-BR';
  return Number(num).toLocaleString(locale);
}

/**
 * Formatar porcentagem
 */
function formatPercentage(num, total) {
  if (!total || total === 0) return '0%';
  const percentage = ((num / total) * 100).toFixed(1);
  return `${percentage}%`;
}

/**
 * Formatar nome do mês (usando config centralizado)
 * OTIMIZADO: Usa dateUtils se disponível
 */
function formatMonth(ym) {
  if (window.dateUtils?.formatMonthYear) {
    return window.dateUtils.formatMonthYear(ym);
  }
  // Fallback para compatibilidade
  if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  const [year, month] = parts;
  const monthNames = window.config?.FORMAT_CONFIG?.MONTH_NAMES || ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const monthIndex = parseInt(month) - 1;
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${monthNames[monthIndex]}. de ${year}`;
  }
  return ym;
}

// Exportar funções para uso global
window.utils = {
  createEnhancedTooltip,
  createDataLabelsConfig,
  gradient,
  showClickFeedback,
  formatDate,
  formatNumber,
  formatPercentage,
  formatMonth
};

