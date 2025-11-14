/**
 * Sistema de Logging Centralizado
 * FASE 2.1: Substituir console.log por sistema de log
 * Permite controlar logs em produção vs desenvolvimento
 */

// Configuração
const LOG_CONFIG = {
  // Ambiente: 'development' ou 'production'
  environment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'development' 
    : 'production',
  
  // Níveis de log habilitados
  levels: {
    error: true,    // Sempre mostrar erros
    warn: true,     // Sempre mostrar avisos
    info: false,    // Apenas em desenvolvimento
    debug: false,  // Apenas em desenvolvimento
    log: false      // Apenas em desenvolvimento
  },
  
  // Prefixos para categorização
  prefixes: {
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    debug: '🔍',
    log: '📝',
    success: '✅',
    performance: '⚡'
  }
};

/**
 * Logger centralizado
 */
const Logger = {
  /**
   * Log de erro (sempre visível)
   */
  error(message, ...args) {
    if (LOG_CONFIG.levels.error) {
      console.error(`${LOG_CONFIG.prefixes.error} ${message}`, ...args);
    }
  },
  
  /**
   * Log de aviso (sempre visível)
   */
  warn(message, ...args) {
    if (LOG_CONFIG.levels.warn) {
      console.warn(`${LOG_CONFIG.prefixes.warn} ${message}`, ...args);
    }
  },
  
  /**
   * Log de informação (apenas em desenvolvimento)
   */
  info(message, ...args) {
    if (LOG_CONFIG.levels.info || LOG_CONFIG.environment === 'development') {
      console.info(`${LOG_CONFIG.prefixes.info} ${message}`, ...args);
    }
  },
  
  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message, ...args) {
    if (LOG_CONFIG.levels.debug || LOG_CONFIG.environment === 'development') {
      console.log(`${LOG_CONFIG.prefixes.debug} ${message}`, ...args);
    }
  },
  
  /**
   * Log genérico (apenas em desenvolvimento)
   */
  log(message, ...args) {
    if (LOG_CONFIG.levels.log || LOG_CONFIG.environment === 'development') {
      console.log(`${LOG_CONFIG.prefixes.log} ${message}`, ...args);
    }
  },
  
  /**
   * Log de sucesso
   */
  success(message, ...args) {
    if (LOG_CONFIG.environment === 'development') {
      console.log(`${LOG_CONFIG.prefixes.success} ${message}`, ...args);
    }
  },
  
  /**
   * Log de performance
   */
  performance(message, duration, ...args) {
    if (LOG_CONFIG.environment === 'development') {
      const color = duration < 100 ? 'green' : duration < 500 ? 'orange' : 'red';
      console.log(
        `%c${LOG_CONFIG.prefixes.performance} ${message}: ${duration.toFixed(2)}ms`,
        `color: ${color}`,
        ...args
      );
    }
  },
  
  /**
   * Agrupar logs (apenas em desenvolvimento)
   */
  group(label) {
    if (LOG_CONFIG.environment === 'development') {
      console.group(label);
    }
  },
  
  groupEnd() {
    if (LOG_CONFIG.environment === 'development') {
      console.groupEnd();
    }
  }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.Logger = Logger;
  
  // Manter compatibilidade: window.log como alias
  window.log = Logger.log;
  window.logError = Logger.error;
  window.logWarn = Logger.warn;
  window.logInfo = Logger.info;
  window.logDebug = Logger.debug;
  window.logSuccess = Logger.success;
  window.logPerformance = Logger.performance;
}

// Exportar também como módulo (se suportado)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}

