/**
 * Global Data Store - Repositório Central de Dados
 * Única fonte de verdade para dados consumidos pelos gráficos
 * 
 * Estratégia: Centralização e Normalização Agressiva dos Dados
 */

// Estado global do store
const dataStore = {
  // Dados agregados principais
  dashboardData: null,
  dashboardDataTimestamp: null,
  
  // Dados individuais (cache por chave)
  dataCache: new Map(),
  dataTimestamps: new Map(),
  
  // Listeners para atualizações
  listeners: new Map(),
  
  // TTL padrão (5 segundos)
  defaultTTL: 5000,
  
  // Cache persistente (localStorage) - prefixo para chaves
  persistentPrefix: 'dashboard_cache_',
  
  // Configuração de TTL por tipo de dado
  ttlConfig: {
    // Dados estáticos (raramente mudam)
    static: 30 * 60 * 1000,      // 30 minutos
    '/api/distritos': 30 * 60 * 1000,
    '/api/unit/*': 30 * 60 * 1000,
    // Dados semi-estáticos
    semiStatic: 10 * 60 * 1000,  // 10 minutos
    '/api/aggregate/by-month': 10 * 60 * 1000,
    // Dados dinâmicos (mudam frequentemente)
    dynamic: 5000,                // 5 segundos (padrão)
    '/api/dashboard-data': 5000,
    '/api/summary': 5000
  }
};

/**
 * Obter dados do store
 * @param {string} key - Chave dos dados (ex: 'dashboardData', 'manifestationsByMonth', '/api/aggregate/by-month')
 * @param {number} ttl - Time to live em ms (opcional)
 * @param {boolean} returnCopy - Se true, retorna cópia dos dados (imutabilidade)
 * @returns {any|null} Dados ou null se não existirem ou expirados
 */
function get(key, ttl = null, returnCopy = false) {
  // Validação básica
  if (typeof key !== 'string' || !key.trim()) {
    return null;
  }
  
  // NOVO: Tentar cache persistente primeiro (apenas para dados estáticos/semi-estáticos)
  const effectiveTTL = ttl !== null ? ttl : getEffectiveTTL(key);
  if (effectiveTTL >= 10 * 60 * 1000) { // Apenas verificar persistente se TTL >= 10 minutos
    const persistentData = getPersistent(key, effectiveTTL);
    if (persistentData !== null) {
      // Dados encontrados no cache persistente - também armazenar em memória para acesso rápido
      if (key === 'dashboardData') {
        dataStore.dashboardData = persistentData;
        dataStore.dashboardDataTimestamp = Date.now();
      } else {
        dataStore.dataCache.set(key, persistentData);
        dataStore.dataTimestamps.set(key, Date.now());
      }
      return returnCopy ? createDeepCopy(persistentData) : persistentData;
    }
  }
  
  // Dados especiais do dashboard
  if (key === 'dashboardData') {
    if (dataStore.dashboardData && dataStore.dashboardDataTimestamp) {
      const age = Date.now() - dataStore.dashboardDataTimestamp;
      if (age < effectiveTTL) {
        return returnCopy ? createDeepCopy(dataStore.dashboardData) : dataStore.dashboardData;
      }
    }
    return null;
  }
  
  // Suporte para sub-chaves do dashboardData (ex: 'dashboardData.manifestationsByMonth')
  if (key.startsWith('dashboardData.')) {
    const subKey = key.replace('dashboardData.', '');
    if (dataStore.dashboardData && dataStore.dashboardDataTimestamp) {
      const age = Date.now() - dataStore.dashboardDataTimestamp;
      if (age < effectiveTTL && dataStore.dashboardData[subKey] !== undefined) {
        const value = dataStore.dashboardData[subKey];
        return returnCopy ? createDeepCopy(value) : value;
      }
    }
    return null;
  }
  
  // Dados do cache geral
  const cached = dataStore.dataCache.get(key);
  const timestamp = dataStore.dataTimestamps.get(key);
  
  if (cached && timestamp) {
    const age = Date.now() - timestamp;
    if (age < effectiveTTL) {
      return returnCopy ? createDeepCopy(cached) : cached;
    } else {
      // Expirou - remover
      dataStore.dataCache.delete(key);
      dataStore.dataTimestamps.delete(key);
    }
  }
  
  return null;
}

/**
 * Criar cópia profunda de dados (helper interno)
 * @param {any} data - Dados para copiar
 * @returns {any} Cópia dos dados
 */
function createDeepCopy(data) {
  if (data === null || data === undefined) return data;
  
  try {
    if (Array.isArray(data)) {
      return data.map(item => 
        typeof item === 'object' && item !== null 
          ? JSON.parse(JSON.stringify(item)) 
          : item
      );
    } else if (typeof data === 'object') {
      return JSON.parse(JSON.stringify(data));
    }
    return data;
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn('dataStore.createDeepCopy: Erro ao criar cópia, retornando referência original:', error);
    }
    return data;
  }
}

/**
 * Armazenar dados no store
 * @param {string} key - Chave dos dados
 * @param {any} data - Dados para armazenar
 * @param {boolean} deepCopy - Se true, cria cópia profunda dos dados (imutabilidade)
 */
function set(key, data, deepCopy = false) {
  // Validação básica
  if (typeof key !== 'string' || !key.trim()) {
    if (window.Logger) {
      window.Logger.warn('dataStore.set: key deve ser uma string não vazia');
    }
    return;
  }
  
  // Criar cópia se solicitado (imutabilidade)
  let dataToStore = data;
  if (deepCopy && data !== null && data !== undefined) {
    try {
      if (Array.isArray(data)) {
        dataToStore = data.map(item => 
          typeof item === 'object' && item !== null 
            ? JSON.parse(JSON.stringify(item)) 
            : item
        );
      } else if (typeof data === 'object') {
        dataToStore = JSON.parse(JSON.stringify(data));
      }
    } catch (error) {
      if (window.Logger) {
        window.Logger.warn('dataStore.set: Erro ao criar deep copy, usando referência original:', error);
      }
      dataToStore = data;
    }
  }
  
  if (key === 'dashboardData') {
    dataStore.dashboardData = dataToStore;
    dataStore.dashboardDataTimestamp = Date.now();
  } else {
    dataStore.dataCache.set(key, dataToStore);
    dataStore.dataTimestamps.set(key, Date.now());
  }
  
  // NOVO: Armazenar em cache persistente se for dado estático/semi-estático
  const effectiveTTL = getEffectiveTTL(key);
  if (effectiveTTL >= 10 * 60 * 1000) { // Apenas para TTL >= 10 minutos (dados estáticos/semi-estáticos)
    setPersistent(key, dataToStore, effectiveTTL);
  }
  
  // Notificar listeners
  notifyListeners(key, dataToStore);
}

/**
 * Obter TTL efetivo para uma chave (baseado em configuração)
 * @param {string} key - Chave dos dados
 * @returns {number} TTL em milissegundos
 */
function getEffectiveTTL(key) {
  // Verificar configuração específica por endpoint
  for (const [pattern, ttl] of Object.entries(dataStore.ttlConfig)) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(key)) {
        return ttl;
      }
    } else if (key === pattern || key.includes(pattern)) {
      return ttl;
    }
  }
  return dataStore.defaultTTL;
}

/**
 * Obter dados do cache persistente (localStorage)
 * @param {string} key - Chave dos dados
 * @param {number} ttl - Time to live em ms
 * @returns {any|null} Dados ou null se não existirem ou expirados
 */
function getPersistent(key, ttl = null) {
  try {
    const storageKey = dataStore.persistentPrefix + key;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const { data, timestamp, ttl: storedTTL } = JSON.parse(cached);
      const effectiveTTL = ttl !== null ? ttl : (storedTTL || dataStore.defaultTTL);
      const age = Date.now() - timestamp;
      if (age < effectiveTTL) {
        if (window.Logger) {
          window.Logger.debug(`Cache persistente hit: ${key} (idade: ${Math.round(age/1000)}s)`);
        }
        return data; // ✅ Cache válido
      }
      // Cache expirado - remover
      localStorage.removeItem(storageKey);
    }
  } catch (e) {
    // Ignorar erros (localStorage pode estar desabilitado ou cheio)
    if (window.Logger) {
      window.Logger.debug(`Erro ao ler cache persistente para ${key}:`, e.message);
    }
  }
  return null;
}

/**
 * Armazenar dados no cache persistente (localStorage)
 * @param {string} key - Chave dos dados
 * @param {any} data - Dados para armazenar
 * @param {number} ttl - Time to live em ms
 */
function setPersistent(key, data, ttl = null) {
  try {
    const storageKey = dataStore.persistentPrefix + key;
    const effectiveTTL = ttl !== null ? ttl : getEffectiveTTL(key);
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      ttl: effectiveTTL
    };
    localStorage.setItem(storageKey, JSON.stringify(cacheData));
    if (window.Logger) {
      window.Logger.debug(`Cache persistente armazenado: ${key} (TTL: ${Math.round(effectiveTTL/1000)}s)`);
    }
  } catch (e) {
    // Se localStorage estiver cheio, tentar limpar cache antigo
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      if (window.Logger) {
        window.Logger.warn('localStorage cheio, limpando cache antigo...');
      }
      clearOldPersistent();
      // Tentar novamente
      try {
        const storageKey = dataStore.persistentPrefix + key;
        const effectiveTTL = ttl !== null ? ttl : getEffectiveTTL(key);
        const cacheData = {
          data: data,
          timestamp: Date.now(),
          ttl: effectiveTTL
        };
        localStorage.setItem(storageKey, JSON.stringify(cacheData));
      } catch (e2) {
        if (window.Logger) {
          window.Logger.warn(`Não foi possível armazenar cache persistente para ${key}:`, e2.message);
        }
      }
    } else {
      if (window.Logger) {
        window.Logger.debug(`Erro ao armazenar cache persistente para ${key}:`, e.message);
      }
    }
  }
}

/**
 * Limpar cache persistente específico
 * @param {string} key - Chave para limpar (ou null para limpar tudo)
 */
function clearPersistent(key = null) {
  try {
    if (key === null) {
      // Limpar todo o cache persistente
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith(dataStore.persistentPrefix)) {
          localStorage.removeItem(k);
        }
      });
      if (window.Logger) {
        window.Logger.info('Todo o cache persistente foi limpo');
      }
    } else {
      const storageKey = dataStore.persistentPrefix + key;
      localStorage.removeItem(storageKey);
    }
  } catch (e) {
    if (window.Logger) {
      window.Logger.warn('Erro ao limpar cache persistente:', e.message);
    }
  }
}

/**
 * Limpar cache persistente antigo (expirado)
 */
function clearOldPersistent() {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleared = 0;
    
    keys.forEach(k => {
      if (k.startsWith(dataStore.persistentPrefix)) {
        try {
          const cached = JSON.parse(localStorage.getItem(k));
          if (cached && cached.timestamp && cached.ttl) {
            const age = now - cached.timestamp;
            if (age > cached.ttl) {
              localStorage.removeItem(k);
              cleared++;
            }
          }
        } catch (e) {
          // Dados corrompidos - remover
          localStorage.removeItem(k);
          cleared++;
        }
      }
    });
    
    if (cleared > 0 && window.Logger) {
      window.Logger.debug(`Limpos ${cleared} itens do cache persistente antigo`);
    }
    
    return cleared;
  } catch (e) {
    if (window.Logger) {
      window.Logger.warn('Erro ao limpar cache persistente antigo:', e.message);
    }
    return 0;
  }
}

/**
 * Verificar se dados existem e estão frescos
 * @param {string} key - Chave dos dados
 * @param {number} ttl - Time to live em ms
 * @returns {boolean}
 */
function has(key, ttl = null) {
  return get(key, ttl) !== null;
}

/**
 * Limpar dados específicos ou todo o store
 * @param {string|null} key - Chave específica ou null para limpar tudo
 */
function clear(key = null) {
  if (key === null) {
    dataStore.dashboardData = null;
    dataStore.dashboardDataTimestamp = null;
    dataStore.dataCache.clear();
    dataStore.dataTimestamps.clear();
    // NOVO: Limpar também cache persistente
    clearPersistent(null);
  } else {
    if (key === 'dashboardData') {
      dataStore.dashboardData = null;
      dataStore.dashboardDataTimestamp = null;
    } else {
      dataStore.dataCache.delete(key);
      dataStore.dataTimestamps.delete(key);
    }
    // NOVO: Limpar também cache persistente específico
    clearPersistent(key);
  }
  
  // Notificar listeners de limpeza
  notifyListeners(key, null);
}

/**
 * Invalidar dados (marcar como expirados)
 * @param {string|string[]} keys - Chave(s) para invalidar
 */
function invalidate(keys) {
  const keysArray = Array.isArray(keys) ? keys : [keys];
  
  keysArray.forEach(key => {
    // NOVO: Também limpar cache persistente
    clearPersistent(key);
    
    if (key === 'dashboardData') {
      dataStore.dashboardDataTimestamp = 0; // Forçar expiração
    } else {
      dataStore.dataTimestamps.set(key, 0); // Forçar expiração
    }
  });
  
  // Notificar listeners
  keysArray.forEach(key => notifyListeners(key, null));
}

/**
 * Registrar listener para mudanças em uma chave
 * @param {string} key - Chave para observar
 * @param {Function} callback - Função callback
 * @returns {Function} Função para remover o listener
 */
function subscribe(key, callback) {
  if (!dataStore.listeners.has(key)) {
    dataStore.listeners.set(key, new Set());
  }
  
  dataStore.listeners.get(key).add(callback);
  
  // Retornar função de unsubscribe
  return () => {
    const listeners = dataStore.listeners.get(key);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        dataStore.listeners.delete(key);
      }
    }
  };
}

/**
 * Notificar listeners sobre mudanças
 * @param {string} key - Chave que mudou
 * @param {any} data - Novos dados (ou null se removido)
 */
function notifyListeners(key, data) {
  const listeners = dataStore.listeners.get(key);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(data, key);
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em listener do dataStore para ${key}:`, error);
        } else {
          console.error(`❌ Erro em listener do dataStore para ${key}:`, error);
        }
      }
    });
  }
  
  // Notificar listeners globais (chave '*')
  const globalListeners = dataStore.listeners.get('*');
  if (globalListeners) {
    globalListeners.forEach(callback => {
      try {
        callback(data, key);
      } catch (error) {
        if (window.Logger) {
          window.Logger.error(`Erro em listener global do dataStore:`, error);
        } else {
          console.error(`❌ Erro em listener global do dataStore:`, error);
        }
      }
    });
  }
}

/**
 * Obter estatísticas do store
 * @returns {Object} Estatísticas
 */
function getStats() {
  return {
    dashboardDataAge: dataStore.dashboardDataTimestamp 
      ? Date.now() - dataStore.dashboardDataTimestamp 
      : null,
    cacheSize: dataStore.dataCache.size,
    listenersCount: Array.from(dataStore.listeners.values())
      .reduce((sum, set) => sum + set.size, 0),
    keys: Array.from(dataStore.dataCache.keys())
  };
}

/**
 * Obter dados do dashboard (helper conveniente)
 * @param {string} subKey - Sub-chave opcional (ex: 'manifestationsByMonth')
 * @param {number} ttl - Time to live em ms
 * @returns {any|null} Dados do dashboard ou sub-dados
 */
function getDashboardData(subKey = null, ttl = null) {
  if (subKey) {
    return get(`dashboardData.${subKey}`, ttl);
  }
  return get('dashboardData', ttl);
}

/**
 * Invalidar dados do dashboard (helper conveniente)
 */
function invalidateDashboardData() {
  invalidate('dashboardData');
  // Também invalidar sub-chaves individuais se existirem
  const dashboardData = dataStore.dashboardData;
  if (dashboardData && typeof dashboardData === 'object') {
    Object.keys(dashboardData).forEach(subKey => {
      invalidate(`dashboardData.${subKey}`);
    });
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  // Limpar cache persistente expirado ao carregar
  clearOldPersistent();
  
  // Limpar cache persistente antigo periodicamente (a cada 5 minutos)
  setInterval(() => {
    clearOldPersistent();
  }, 5 * 60 * 1000);
  
  window.dataStore = {
    get,
    set,
    has,
    clear,
    invalidate,
    subscribe,
    getStats,
    getDashboardData,
    invalidateDashboardData,
    // Expor TTL padrão para configuração
    getDefaultTTL: () => dataStore.defaultTTL,
    setDefaultTTL: (ttl) => { dataStore.defaultTTL = ttl; },
    
    // Cache persistente
    getPersistent,
    setPersistent,
    clearPersistent,
    clearOldPersistent
  };
  
  // Log de inicialização
  if (window.Logger) {
    window.Logger.debug('✅ Global Data Store inicializado (com cache persistente)');
  } else {
    console.log('✅ Global Data Store inicializado (com cache persistente)');
  }
}

