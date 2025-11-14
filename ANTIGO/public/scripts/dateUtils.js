/**
 * Date Utils Module - Sistema centralizado de cálculos e formatação de datas
 * Otimizado para evitar duplicação e garantir consistência
 */

// Cache de valores calculados (evita recalcular a cada chamada)
const dateCache = {
  today: null,
  todayTimestamp: null,
  currentMonth: null,
  currentYear: null,
  currentWeek: null,
  lastUpdate: null
};

// Cache TTL: 1 minuto (valores mudam pouco durante execução)
const CACHE_TTL = 60 * 1000;

/**
 * Limpar cache se expirado
 */
function clearCacheIfExpired() {
  const now = Date.now();
  if (!dateCache.lastUpdate || (now - dateCache.lastUpdate) > CACHE_TTL) {
    dateCache.today = null;
    dateCache.todayTimestamp = null;
    dateCache.currentMonth = null;
    dateCache.currentYear = null;
    dateCache.currentWeek = null;
    dateCache.lastUpdate = now;
  }
}

/**
 * Obter data de hoje (com cache)
 */
function getToday() {
  clearCacheIfExpired();
  if (!dateCache.today) {
    dateCache.today = new Date();
    dateCache.today.setHours(0, 0, 0, 0); // Zerar horas
  }
  return new Date(dateCache.today); // Retornar cópia
}

/**
 * Obter timestamp de hoje (com cache)
 */
function getTodayTimestamp() {
  clearCacheIfExpired();
  if (!dateCache.todayTimestamp) {
    dateCache.todayTimestamp = getToday().getTime();
  }
  return dateCache.todayTimestamp;
}

/**
 * Obter mês atual (YYYY-MM) (com cache)
 */
function getCurrentMonth() {
  clearCacheIfExpired();
  if (!dateCache.currentMonth) {
    const today = getToday();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    dateCache.currentMonth = `${year}-${month}`;
  }
  return dateCache.currentMonth;
}

/**
 * Obter ano atual (com cache)
 */
function getCurrentYear() {
  clearCacheIfExpired();
  if (!dateCache.currentYear) {
    dateCache.currentYear = getToday().getFullYear();
  }
  return dateCache.currentYear;
}

/**
 * Obter semana atual (YYYY-Www) (com cache)
 */
function getCurrentWeek() {
  clearCacheIfExpired();
  if (!dateCache.currentWeek) {
    const today = getToday();
    const year = today.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    dateCache.currentWeek = `W${String(week).padStart(2, '0')}`;
  }
  return dateCache.currentWeek;
}

/**
 * Formatar data para exibição (dd/MM/yyyy)
 */
function formatDate(dateInput) {
  if (!dateInput) return '';
  
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
    if (isNaN(date.getTime())) return dateInput; // Retornar original se inválido
  } else {
    return '';
  }
  
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formatar mês/ano (YYYY-MM) para exibição (jan. de 2024)
 */
function formatMonthYear(ym) {
  if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
  
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  
  const [year, month] = parts;
  const monthIndex = parseInt(month) - 1;
  
  if (monthIndex < 0 || monthIndex > 11) return ym;
  
  const monthNames = window.config?.FORMAT_CONFIG?.MONTH_NAMES || 
    ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  return `${monthNames[monthIndex]}. de ${year}`;
}

/**
 * Formatar mês/ano curto (MM/YYYY)
 */
function formatMonthYearShort(ym) {
  if (!ym || typeof ym !== 'string') return ym || 'Data inválida';
  
  const parts = ym.split('-');
  if (parts.length < 2) return ym;
  
  const [year, month] = parts;
  return `${month}/${year.slice(-2)}`;
}

/**
 * Formatar data curta (dd/MM)
 */
function formatDateShort(dateInput) {
  if (!dateInput) return '';
  
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Data inválida';
  } else {
    return '';
  }
  
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calcular diferença em dias entre duas datas
 */
function daysBetween(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Obter início do mês (primeiro dia às 00:00:00)
 */
function getMonthStart(ym) {
  if (!ym || typeof ym !== 'string') {
    const today = getToday();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }
  
  const parts = ym.split('-');
  if (parts.length < 2) return null;
  
  const [year, month] = parts;
  return new Date(parseInt(year), parseInt(month) - 1, 1);
}

/**
 * Obter fim do mês (último dia às 23:59:59)
 */
function getMonthEnd(ym) {
  const start = getMonthStart(ym);
  if (!start) return null;
  
  return new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Obter início da semana (segunda-feira às 00:00:00)
 */
function getWeekStart(date = null) {
  const d = date ? (date instanceof Date ? date : new Date(date)) : getToday();
  if (isNaN(d.getTime())) return null;
  
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda-feira
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Obter fim da semana (domingo às 23:59:59)
 */
function getWeekEnd(date = null) {
  const start = getWeekStart(date);
  if (!start) return null;
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Verificar se data é hoje
 */
function isToday(dateInput) {
  if (!dateInput) return false;
  
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return false;
  
  const today = getToday();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Verificar se data está no mês atual
 */
function isCurrentMonth(ym) {
  if (!ym) return false;
  return ym === getCurrentMonth();
}

/**
 * Obter últimos N meses (incluindo mês atual)
 */
function getLastMonths(n) {
  const months = [];
  const today = getToday();
  
  for (let i = 0; i < n; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  
  return months;
}

/**
 * Obter próximos N meses (incluindo mês atual)
 */
function getNextMonths(n) {
  const months = [];
  const today = getToday();
  
  for (let i = 0; i < n; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  
  return months;
}

/**
 * Converter string de data para objeto Date (com validação)
 */
function parseDate(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Validar formato YYYY-MM
 */
function isValidMonthFormat(ym) {
  if (!ym || typeof ym !== 'string') return false;
  const match = ym.match(/^(\d{4})-(\d{2})$/);
  if (!match) return false;
  
  const [, year, month] = match;
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  
  return monthNum >= 1 && monthNum <= 12 && yearNum >= 2000 && yearNum <= 2100;
}

// Exportar funções para uso global
window.dateUtils = {
  // Datas de referência (com cache)
  getToday,
  getTodayTimestamp,
  getCurrentMonth,
  getCurrentYear,
  getCurrentWeek,
  
  // Formatação
  formatDate,
  formatMonthYear,
  formatMonthYearShort,
  formatDateShort,
  
  // Cálculos
  daysBetween,
  getMonthStart,
  getMonthEnd,
  getWeekStart,
  getWeekEnd,
  
  // Validação
  isToday,
  isCurrentMonth,
  isValidMonthFormat,
  
  // Utilitários
  getLastMonths,
  getNextMonths,
  parseDate,
  
  // Limpar cache manualmente (útil para testes)
  clearCache: () => {
    dateCache.today = null;
    dateCache.todayTimestamp = null;
    dateCache.currentMonth = null;
    dateCache.currentYear = null;
    dateCache.currentWeek = null;
    dateCache.lastUpdate = null;
  }
};

