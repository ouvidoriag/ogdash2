/**
 * Config Module - Sistema Global de Configuração Centralizada
 * Centraliza todos os nomes de campos, endpoints, configurações e mapeamentos
 */

const FIELD_NAMES = {
  STATUS: 'Status',
  ORGAOS: 'Orgaos',
  SECRETARIA: 'Secretaria',
  TEMA: 'Tema',
  ASSUNTO: 'Assunto',
  DATA: 'Data',
  MES: 'Mês',
  BAIRRO: 'Bairro',
  CATEGORIA: 'Categoria',
  TIPO: 'Tipo',
  SETOR: 'Setor',
  UAC: 'UAC',
  RESPONSAVEL: 'Responsavel',
  CANAL: 'Canal',
  PRIORIDADE: 'Prioridade',
  CADASTRANTE: 'Cadastrante',
  UNIDADE: 'Unidade'
};

const FIELD_LABELS = {
  [FIELD_NAMES.STATUS]: 'Status',
  [FIELD_NAMES.ORGAOS]: 'Órgão',
  [FIELD_NAMES.SECRETARIA]: 'Secretaria',
  [FIELD_NAMES.TEMA]: 'Tema',
  [FIELD_NAMES.ASSUNTO]: 'Assunto',
  [FIELD_NAMES.DATA]: 'Data',
  [FIELD_NAMES.MES]: 'Mês',
  [FIELD_NAMES.BAIRRO]: 'Bairro',
  [FIELD_NAMES.CATEGORIA]: 'Categoria',
  [FIELD_NAMES.TIPO]: 'Tipo',
  [FIELD_NAMES.SETOR]: 'Setor',
  [FIELD_NAMES.UAC]: 'UAC',
  [FIELD_NAMES.RESPONSAVEL]: 'Responsável',
  [FIELD_NAMES.CANAL]: 'Canal',
  [FIELD_NAMES.PRIORIDADE]: 'Prioridade',
  [FIELD_NAMES.CADASTRANTE]: 'Cadastrante',
  [FIELD_NAMES.UNIDADE]: 'Unidade'
};

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field;
}

const API_ENDPOINTS = {
  FILTER: '/api/filter',
  SUMMARY: '/api/summary',
  DASHBOARD_DATA: '/api/dashboard-data',
  AGGREGATE_BY_MONTH: '/api/aggregate/by-month',
  AGGREGATE_BY_DAY: '/api/aggregate/by-day',
  AGGREGATE_BY_THEME: '/api/aggregate/by-theme',
  AGGREGATE_BY_SUBJECT: '/api/aggregate/by-subject',
  AGGREGATE_COUNT_BY: '/api/aggregate/count-by',
  AGGREGATE_TIME_SERIES: '/api/aggregate/time-series',
  AGGREGATE_HEATMAP: '/api/aggregate/heatmap',
  STATUS_OVERVIEW: '/api/stats/status-overview',
  AVERAGE_TIME_STATS: '/api/stats/average-time/stats',
  AI_INSIGHTS: '/api/ai/insights',
  CHAT_MESSAGES: '/api/chat/messages'
};

function buildEndpoint(endpoint, params = {}) {
  const url = new URL(endpoint, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.pathname + url.search;
}

const CHART_CONFIG = {
  COLORS: {
    PRIMARY: '#22d3ee',
    SECONDARY: '#a78bfa',
    SUCCESS: '#34d399',
    WARNING: '#f59e0b',
    DANGER: '#fb7185',
    INFO: '#06b6d4',
    PURPLE: '#8b5cf6',
    PINK: '#ec4899',
    INDIGO: '#6366f1'
  },
  
  COLOR_PALETTE: [
    '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9',
    '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#6366f1'
  ],
  
  // Mapeamento de cores por tipo de manifestação (modo escuro)
  TIPO_MANIFESTACAO_COLORS: {
    'elogio': '#10b981',        // Verde
    'elogios': '#10b981',
    'reclamação': '#f97316',    // Laranja
    'reclamações': '#f97316',
    'reclamacao': '#f97316',
    'reclamacoes': '#f97316',
    'reclama': '#f97316',
    'denúncia': '#ef4444',      // Vermelho
    'denúncias': '#ef4444',
    'denuncia': '#ef4444',
    'denuncias': '#ef4444',
    'denún': '#ef4444',
    'sugestão': '#3b82f6',      // Azul
    'sugestões': '#3b82f6',
    'sugestao': '#3b82f6',
    'sugestoes': '#3b82f6',
    'sugest': '#3b82f6',
    'não informado': '#94a3b8', // Cinza
    'nao informado': '#94a3b8',
    'não informada': '#94a3b8',
    'nao informada': '#94a3b8',
    'não informados': '#94a3b8',
    'nao informados': '#94a3b8',
    'não informadas': '#94a3b8',
    'nao informadas': '#94a3b8',
    'acesso a informação': '#eab308', // Amarelo
    'acesso a informacao': '#eab308',
    'acesso à informação': '#eab308',
    'acesso à informacao': '#eab308',
    'esic': '#eab308',          // Amarelo
    'e-sic': '#eab308',
    'e sic': '#eab308',
    'lei de acesso': '#eab308',
    'lei acesso': '#eab308'
  },
  
  // Mapeamento de cores por tipo de manifestação (modo claro - cores mais escuras para contraste)
  TIPO_MANIFESTACAO_COLORS_LIGHT: {
    'elogio': '#059669',        // Verde mais escuro
    'elogios': '#059669',
    'reclamação': '#ea580c',    // Laranja mais escuro
    'reclamações': '#ea580c',
    'reclamacao': '#ea580c',
    'reclamacoes': '#ea580c',
    'reclama': '#ea580c',
    'denúncia': '#dc2626',      // Vermelho mais escuro
    'denúncias': '#dc2626',
    'denuncia': '#dc2626',
    'denuncias': '#dc2626',
    'denún': '#dc2626',
    'sugestão': '#2563eb',      // Azul mais escuro
    'sugestões': '#2563eb',
    'sugestao': '#2563eb',
    'sugestoes': '#2563eb',
    'sugest': '#2563eb',
    'não informado': '#64748b', // Cinza mais escuro
    'nao informado': '#64748b',
    'não informada': '#64748b',
    'nao informada': '#64748b',
    'não informados': '#64748b',
    'nao informados': '#64748b',
    'não informadas': '#64748b',
    'nao informadas': '#64748b',
    'acesso a informação': '#ca8a04', // Amarelo mais escuro
    'acesso a informacao': '#ca8a04',
    'acesso à informação': '#ca8a04',
    'acesso à informacao': '#ca8a04',
    'esic': '#ca8a04',          // Amarelo mais escuro
    'e-sic': '#ca8a04',
    'e sic': '#ca8a04',
    'lei de acesso': '#ca8a04',
    'lei acesso': '#ca8a04'
  },
  
  PERFORMANCE: {
    MAX_POINTS: 100,
    MAX_LABELS: 15,
    ANIMATION_DURATION: 0,
    POINT_RADIUS: 3,
    POINT_HOVER_RADIUS: 5
  },
  
  TOOLTIP: {
    BACKGROUND: 'rgba(15, 23, 42, 0.95)',
    TITLE_COLOR: '#e2e8f0',
    BODY_COLOR: '#cbd5e1',
    BORDER_COLOR: 'rgba(34, 211, 238, 0.3)',
    BORDER_WIDTH: 1,
    PADDING: 12
  },
  
  DATA_LABELS: {
    COLOR: '#e2e8f0',
    FONT_SIZE: 11,
    FONT_WEIGHT: 'bold',
    PADDING: 4,
    BACKGROUND: 'rgba(15, 23, 42, 0.7)',
    BORDER_RADIUS: 4
  }
};

const FORMAT_CONFIG = {
  LOCALE: 'pt-BR',
  DATE_FORMAT: {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd de MMMM de yyyy',
    MONTH_YEAR: 'MMM. de yyyy'
  },
  MONTH_NAMES: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  MONTH_NAMES_FULL: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  NUMBER: {
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: '.',
    DECIMAL_SEPARATOR: ','
  },
  PERCENTAGE: {
    DECIMAL_PLACES: 1,
    SHOW_SYMBOL: true
  }
};

const PERFORMANCE_CONFIG = {
  MAX_CONCURRENT_REQUESTS: 6,
  REQUEST_TIMEOUT: 60000,
  MAX_RETRIES: 2,
  RETRY_DELAY_BASE: 2000,
  MAX_RECORDS_PER_PAGE: 2000,
  MAX_CHART_POINTS: 100,
  MAX_LIST_ITEMS: 50
};

/**
 * Verificar se está no modo claro
 * @returns {boolean}
 */
function isLightMode() {
  return document.body && document.body.classList.contains('light-mode');
}

/**
 * Obter cor baseada no tipo de manifestação
 * @param {string} tipo - Tipo de manifestação
 * @returns {string} - Cor hexadecimal
 */
function getColorByTipoManifestacao(tipo) {
  if (!tipo || typeof tipo !== 'string') {
    return null;
  }
  
  const tipoLower = tipo.toLowerCase().trim();
  // Usar cores diferentes para modo claro e escuro
  const colorMap = isLightMode() 
    ? CHART_CONFIG.TIPO_MANIFESTACAO_COLORS_LIGHT 
    : CHART_CONFIG.TIPO_MANIFESTACAO_COLORS;
  
  // Buscar correspondência exata ou parcial
  for (const [key, color] of Object.entries(colorMap)) {
    if (tipoLower.includes(key) || key.includes(tipoLower)) {
      return color;
    }
  }
  
  return null;
}

window.config = {
  FIELD_NAMES,
  FIELD_LABELS,
  getFieldLabel,
  API_ENDPOINTS,
  buildEndpoint,
  CHART_CONFIG,
  FORMAT_CONFIG,
  PERFORMANCE_CONFIG,
  getColorByTipoManifestacao
};

window.FIELD_NAMES = FIELD_NAMES;
window.FIELD_LABELS = FIELD_LABELS;
window.API_ENDPOINTS = API_ENDPOINTS;
window.CHART_CONFIG = CHART_CONFIG;

