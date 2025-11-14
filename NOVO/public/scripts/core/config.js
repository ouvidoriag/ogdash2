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

window.config = {
  FIELD_NAMES,
  FIELD_LABELS,
  getFieldLabel,
  API_ENDPOINTS,
  buildEndpoint,
  CHART_CONFIG,
  FORMAT_CONFIG,
  PERFORMANCE_CONFIG
};

window.FIELD_NAMES = FIELD_NAMES;
window.FIELD_LABELS = FIELD_LABELS;
window.API_ENDPOINTS = API_ENDPOINTS;
window.CHART_CONFIG = CHART_CONFIG;

