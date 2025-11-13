/**
 * Config Module - Sistema Global de Configuração Centralizada
 * Centraliza todos os nomes de campos, endpoints, configurações e mapeamentos
 */

// ============================================
// NOMES DE CAMPOS (Field Names)
// ============================================
const FIELD_NAMES = {
  // Campos principais
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

// Mapeamento de campos para nomes exibidos (labels)
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

// Função helper para obter label de campo
function getFieldLabel(field) {
  return FIELD_LABELS[field] || field;
}

// ============================================
// ENDPOINTS DE API
// ============================================
const API_ENDPOINTS = {
  // Filtros e busca
  FILTER: '/api/filter',
  
  // Agregações
  SUMMARY: '/api/summary',
  AGGREGATE_BY_MONTH: '/api/aggregate/by-month',
  AGGREGATE_BY_DAY: '/api/aggregate/by-day',
  AGGREGATE_BY_THEME: '/api/aggregate/by-theme',
  AGGREGATE_BY_SUBJECT: '/api/aggregate/by-subject',
  AGGREGATE_COUNT_BY: '/api/aggregate/count-by',
  AGGREGATE_TIME_SERIES: '/api/aggregate/time-series',
  AGGREGATE_HEATMAP: '/api/aggregate/heatmap',
  
  // Estatísticas
  STATUS_OVERVIEW: '/api/stats/status-overview',
  AVERAGE_TIME_STATS: '/api/stats/average-time/stats',
  
  // Insights
  AI_INSIGHTS: '/api/ai/insights',
  
  // Chat
  CHAT_MESSAGES: '/api/chat/messages',
  CHAT_SEND: '/api/chat/send'
};

// Função helper para construir endpoint com query params
function buildEndpoint(endpoint, params = {}) {
  const url = new URL(endpoint, window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.pathname + url.search;
}

// ============================================
// CONFIGURAÇÕES DE GRÁFICOS
// ============================================
const CHART_CONFIG = {
  // Cores padrão
  COLORS: {
    PRIMARY: '#22d3ee',      // cyan
    SECONDARY: '#a78bfa',    // violet
    SUCCESS: '#34d399',      // green
    WARNING: '#f59e0b',      // amber
    DANGER: '#fb7185',       // rose
    INFO: '#06b6d4',         // cyan-500
    PURPLE: '#8b5cf6',       // violet-500
    PINK: '#ec4899',         // pink-500
    INDIGO: '#6366f1'        // indigo-500
  },
  
  // Paleta de cores para gráficos
  COLOR_PALETTE: [
    '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#fb7185', '#e879f9',
    '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#6366f1'
  ],
  
  // Configurações de performance
  PERFORMANCE: {
    MAX_POINTS: 100,              // Máximo de pontos em séries temporais
    MAX_LABELS: 15,               // Máximo de labels visíveis
    ANIMATION_DURATION: 0,         // Desabilitar animações (0ms)
    POINT_RADIUS: 3,               // Tamanho padrão de pontos
    POINT_HOVER_RADIUS: 5          // Tamanho de pontos no hover
  },
  
  // Configurações de tooltip
  TOOLTIP: {
    BACKGROUND: 'rgba(15, 23, 42, 0.95)',
    TITLE_COLOR: '#e2e8f0',
    BODY_COLOR: '#cbd5e1',
    BORDER_COLOR: 'rgba(34, 211, 238, 0.3)',
    BORDER_WIDTH: 1,
    PADDING: 12
  },
  
  // Configurações de data labels
  DATA_LABELS: {
    COLOR: '#e2e8f0',
    FONT_SIZE: 11,
    FONT_WEIGHT: 'bold',
    PADDING: 4,
    BACKGROUND: 'rgba(15, 23, 42, 0.7)',
    BORDER_RADIUS: 4
  }
};

// ============================================
// MAPEAMENTO DE GRÁFICOS PARA CAMPOS
// ============================================
const CHART_FIELD_MAP = {
  'chartStatus': { field: FIELD_NAMES.STATUS, op: 'eq' },
  'chartStatusPage': { field: FIELD_NAMES.STATUS, op: 'eq' },
  'chartStatusTema': { field: FIELD_NAMES.STATUS, op: 'eq' },
  'chartStatusAssunto': { field: FIELD_NAMES.STATUS, op: 'eq' },
  'chartTrend': { field: FIELD_NAMES.DATA, op: 'contains' },
  'chartTopOrgaos': { field: FIELD_NAMES.ORGAOS, op: 'contains' },
  'chartTopTemas': { field: FIELD_NAMES.TEMA, op: 'eq' },
  'chartFunnelStatus': { field: FIELD_NAMES.STATUS, op: 'eq' },
  'chartSlaOverview': { field: null, op: null },
  'chartOrgaoMes': { field: FIELD_NAMES.ORGAOS, op: 'contains' },
  'chartSecretaria': { field: FIELD_NAMES.SECRETARIA, op: 'contains' },
  'chartTipo': { field: FIELD_NAMES.TIPO, op: 'eq' },
  'chartSetor': { field: FIELD_NAMES.SETOR, op: 'contains' },
  'chartCategoria': { field: FIELD_NAMES.CATEGORIA, op: 'eq' },
  'chartBairro': { field: FIELD_NAMES.BAIRRO, op: 'contains' },
  'chartUAC': { field: FIELD_NAMES.UAC, op: 'contains' },
  'chartResponsavel': { field: FIELD_NAMES.RESPONSAVEL, op: 'contains' },
  'chartCanal': { field: FIELD_NAMES.CANAL, op: 'eq' },
  'chartPrioridade': { field: FIELD_NAMES.PRIORIDADE, op: 'eq' },
  'chartTema': { field: FIELD_NAMES.TEMA, op: 'eq' },
  'chartAssunto': { field: FIELD_NAMES.ASSUNTO, op: 'contains' },
  'chartMonth': { field: FIELD_NAMES.DATA, op: 'contains' },
  'chartTempoMedio': { field: FIELD_NAMES.ORGAOS, op: 'contains' },
  'chartTempoMedioMes': { field: FIELD_NAMES.DATA, op: 'contains' },
  'chartCount': { field: null, op: null },
  'chartTime': { field: null, op: null },
  'chartSla': { field: null, op: null }
};

// ============================================
// CONFIGURAÇÕES DE PESQUISA/FILTROS
// ============================================
const SEARCH_CONFIG = {
  // Operadores padrão por tipo de campo
  DEFAULT_OPERATORS: {
    [FIELD_NAMES.STATUS]: 'eq',
    [FIELD_NAMES.TEMA]: 'eq',
    [FIELD_NAMES.CATEGORIA]: 'eq',
    [FIELD_NAMES.TIPO]: 'eq',
    [FIELD_NAMES.CANAL]: 'eq',
    [FIELD_NAMES.PRIORIDADE]: 'eq',
    [FIELD_NAMES.ORGAOS]: 'contains',
    [FIELD_NAMES.SECRETARIA]: 'contains',
    [FIELD_NAMES.ASSUNTO]: 'contains',
    [FIELD_NAMES.BAIRRO]: 'contains',
    [FIELD_NAMES.SETOR]: 'contains',
    [FIELD_NAMES.UAC]: 'contains',
    [FIELD_NAMES.RESPONSAVEL]: 'contains',
    [FIELD_NAMES.DATA]: 'contains',
    [FIELD_NAMES.MES]: 'contains'
  },
  
  // Campos que suportam busca por texto
  TEXT_SEARCH_FIELDS: [
    FIELD_NAMES.ORGAOS,
    FIELD_NAMES.SECRETARIA,
    FIELD_NAMES.ASSUNTO,
    FIELD_NAMES.BAIRRO,
    FIELD_NAMES.SETOR,
    FIELD_NAMES.UAC,
    FIELD_NAMES.RESPONSAVEL
  ],
  
  // Campos que são listas/enums
  ENUM_FIELDS: [
    FIELD_NAMES.STATUS,
    FIELD_NAMES.TEMA,
    FIELD_NAMES.CATEGORIA,
    FIELD_NAMES.TIPO,
    FIELD_NAMES.CANAL,
    FIELD_NAMES.PRIORIDADE
  ]
};

// Função helper para obter operador padrão de um campo
function getDefaultOperator(field) {
  return SEARCH_CONFIG.DEFAULT_OPERATORS[field] || 'contains';
}

// ============================================
// CONFIGURAÇÕES DE FORMATAÇÃO
// ============================================
const FORMAT_CONFIG = {
  // Locale para formatação
  LOCALE: 'pt-BR',
  
  // Formato de data
  DATE_FORMAT: {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd de MMMM de yyyy',
    MONTH_YEAR: 'MMM. de yyyy'
  },
  
  // Nomes dos meses
  MONTH_NAMES: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  MONTH_NAMES_FULL: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  
  // Configurações de número
  NUMBER: {
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: '.',
    DECIMAL_SEPARATOR: ','
  },
  
  // Configurações de porcentagem
  PERCENTAGE: {
    DECIMAL_PLACES: 1,
    SHOW_SYMBOL: true
  }
};

// ============================================
// CONFIGURAÇÕES DE CACHE
// DESABILITADO: Cache removido
// ============================================
const CACHE_CONFIG = {
  // Cache desabilitado
  DB_UPDATE_TIMES: [12, 17],
  DEFAULT_TTL: 0,
  ENDPOINT_TTL: {
    [API_ENDPOINTS.FILTER]: 0,
    [API_ENDPOINTS.SUMMARY]: 10,
    [API_ENDPOINTS.AGGREGATE_BY_MONTH]: 30,
    [API_ENDPOINTS.AGGREGATE_BY_DAY]: 30,
    [API_ENDPOINTS.STATUS_OVERVIEW]: 10
  }
};

// ============================================
// CONFIGURAÇÕES DE PERFORMANCE
// ============================================
const PERFORMANCE_CONFIG = {
  // Limites de requisições
  MAX_CONCURRENT_REQUESTS: 6,
  REQUEST_TIMEOUT: 60000, // 60 segundos
  MAX_RETRIES: 2,
  RETRY_DELAY_BASE: 2000, // 2 segundos
  
  // Limites de dados
  MAX_RECORDS_PER_PAGE: 2000,
  MAX_CHART_POINTS: 100,
  MAX_LIST_ITEMS: 50
};

// ============================================
// EXPORTAÇÃO GLOBAL
// ============================================
window.config = {
  // Campos e labels
  FIELD_NAMES,
  FIELD_LABELS,
  getFieldLabel,
  
  // Endpoints
  API_ENDPOINTS,
  buildEndpoint,
  
  // Gráficos
  CHART_CONFIG,
  CHART_FIELD_MAP,
  
  // Pesquisa/Filtros
  SEARCH_CONFIG,
  getDefaultOperator,
  
  // Formatação
  FORMAT_CONFIG,
  
  // Cache
  CACHE_CONFIG,
  
  // Performance
  PERFORMANCE_CONFIG
};

// Exportar também para compatibilidade com código existente
window.FIELD_NAMES = FIELD_NAMES;
window.FIELD_LABELS = FIELD_LABELS;
window.API_ENDPOINTS = API_ENDPOINTS;
window.CHART_CONFIG = CHART_CONFIG;
window.CHART_FIELD_MAP = CHART_FIELD_MAP;

