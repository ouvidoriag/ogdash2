/**
 * API Module - Funções para buscar dados do backend
 * Centraliza todas as chamadas de API com cache, retry, timeout e deduplicação
 */

// Cache otimizado
const apiCache = new Map();

// Horários de atualização do banco de dados (usando config centralizado se disponível)
const UPDATE_TIMES = window.config?.CACHE_CONFIG?.DB_UPDATE_TIMES || [12, 17]; // Horas do dia

/**
 * Calcular duração do cache baseado nos horários de atualização
 * Se estamos entre atualizações, cache pode durar até a próxima atualização
 * Se estamos próximo de uma atualização, usar cache menor
 */
function getCacheDuration() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Minutos desde meia-noite
  
  // Horários de atualização em minutos desde meia-noite
  const updateTimesMinutes = UPDATE_TIMES.map(h => h * 60);
  
  // Encontrar próxima atualização
  let nextUpdate = updateTimesMinutes.find(t => t > currentTime);
  if (!nextUpdate) {
    // Se passou da última atualização do dia, próxima é às 12:00 do dia seguinte
    nextUpdate = UPDATE_TIMES[0] * 60 + 24 * 60; // 12:00 do dia seguinte
  }
  
  const minutesUntilUpdate = nextUpdate - currentTime;
  
  // Se estamos muito próximo de uma atualização (últimos 5 minutos), usar cache curto
  if (minutesUntilUpdate <= 5) {
    return 1 * 60 * 1000; // 1 minuto
  }
  
  // Se estamos entre atualizações, cache pode durar até a próxima atualização
  // Mas limitar a no máximo 6 horas para segurança
  const maxCache = Math.min(minutesUntilUpdate * 60 * 1000, 6 * 60 * 60 * 1000);
  
  // Adicionar 5 minutos de margem de segurança
  return maxCache + (5 * 60 * 1000);
}

// Cache duration dinâmico baseado nos horários de atualização
const CACHE_DURATION = getCacheDuration();

// Request deduplication: evita múltiplas requisições simultâneas para o mesmo endpoint
const pendingRequests = new Map();

// Request queue: limita requisições simultâneas para evitar sobrecarga
let activeRequests = 0;
const requestQueue = [];

// Configurações (usando config centralizado se disponível)
const REQUEST_TIMEOUT = window.config?.PERFORMANCE_CONFIG?.REQUEST_TIMEOUT || 60000;
const MAX_RETRIES = window.config?.PERFORMANCE_CONFIG?.MAX_RETRIES || 2;
const RETRY_DELAY_BASE = window.config?.PERFORMANCE_CONFIG?.RETRY_DELAY_BASE || 2000;
const MAX_CONCURRENT_REQUESTS = window.config?.PERFORMANCE_CONFIG?.MAX_CONCURRENT_REQUESTS || 6;

/**
 * Função base para fazer requisições JSON com timeout, retry e tratamento de erro
 */
async function fetchJSON(url, opts = {}, retryCount = 0) {
  // Criar AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const fetchOpts = {
      ...opts,
      signal: controller.signal
    };
    
    const res = await fetch(url, fetchOpts);
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      // Erros HTTP (4xx, 5xx) não devem fazer retry
      throw new Error(`Request failed: ${res.status} ${res.statusText} for ${url}`);
    }
    
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Apenas fazer retry para erros de rede/timeout, não para erros HTTP
    const isNetworkError = error.name === 'AbortError' || 
                          (error.message && (
                            error.message.includes('fetch') || 
                            error.message.includes('network') ||
                            error.message.includes('Failed to fetch') ||
                            error.message.includes('timeout')
                          ));
    
    // Não fazer retry se já tentou demais ou se não é erro de rede
    if (isNetworkError && retryCount < MAX_RETRIES && !error.message?.includes('Request failed')) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount); // Backoff exponencial
      // Apenas logar retry se for a primeira tentativa (evitar spam)
      if (retryCount === 0) {
        console.warn(`⚠️ Retry ${retryCount + 1}/${MAX_RETRIES} para ${url} após ${delay}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchJSON(url, opts, retryCount + 1);
    }
    
    // Não logar erro se já foi logado no retry ou se é erro HTTP esperado
    if (!error.message?.includes('Request failed') || retryCount === 0) {
      console.error(`❌ Erro ao buscar ${url}:`, error.message);
    }
    throw error;
  }
}

/**
 * Processar fila de requisições
 */
async function processQueue() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }
  
  const { resolve, reject, url, opts, retryCount } = requestQueue.shift();
  activeRequests++;
  
  try {
    const data = await fetchJSON(url, opts, retryCount);
    resolve(data);
  } catch (error) {
    reject(error);
  } finally {
    activeRequests--;
    // Processar próxima requisição na fila
    if (requestQueue.length > 0) {
      setTimeout(processQueue, 0);
    }
  }
}

/**
 * Adicionar requisição à fila
 */
function queueRequest(url, opts = {}, retryCount = 0) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, url, opts, retryCount });
    processQueue();
  });
}

/**
 * Buscar dados com filtros aplicados (com cache otimizado e deduplicação)
 */
async function fetchJSONWithFilters(url, opts = {}) {
  // Se não há filtros, usar cache normal
  if (!window.globalFilters?.filters || window.globalFilters.filters.length === 0) {
    return await fetchWithCache(url, opts, true);
  }
  
  // Se há filtros, usar endpoint de filtro (com cache baseado nos filtros)
  const filterUrl = '/api/filter';
  const filterOpts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters: window.globalFilters.filters, originalUrl: url })
  };
  
  // Cache baseado na URL original + filtros
  const cacheKey = `${url}_${JSON.stringify(window.globalFilters.filters)}`;
  
  // Recalcular duração do cache
  const cacheDuration = getCacheDuration();
  
  // Verificar cache primeiro
  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    const age = Date.now() - cached.timestamp;
    
    // Se estamos próximo de uma atualização, invalidar cache mais cedo
    if (isNearUpdateTime() && age > (cacheDuration * 0.8)) {
      apiCache.delete(cacheKey);
    } else if (age < cacheDuration) {
      return cached.data;
    } else {
      apiCache.delete(cacheKey);
    }
  }
  
  // Deduplicação: se já existe uma requisição pendente para este endpoint, aguardar ela
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  // Criar promise para deduplicação
  const requestPromise = queueRequest(filterUrl, filterOpts).then(filteredData => {
    // Armazenar no cache
    apiCache.set(cacheKey, {
      data: filteredData,
      timestamp: Date.now()
    });
    // Remover da lista de pendentes
    pendingRequests.delete(cacheKey);
    return filteredData;
  }).catch(error => {
    pendingRequests.delete(cacheKey);
    throw error;
  });
  
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Alias para compatibilidade
 */
async function fetchJSONWithFilter(url, opts = {}) {
  return await fetchJSONWithFilters(url, opts);
}

/**
 * Verificar se estamos próximo de um horário de atualização
 */
function isNearUpdateTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  // Verificar se estamos nos últimos 5 minutos antes de uma atualização
  return UPDATE_TIMES.some(updateHour => {
    const updateTime = updateHour * 60;
    const diff = updateTime - currentTime;
    return diff >= 0 && diff <= 5;
  });
}

/**
 * Buscar dados com cache otimizado e deduplicação
 * Cache inteligente baseado nos horários de atualização do banco
 */
async function fetchWithCache(url, opts = {}, useCache = true) {
  const cacheKey = `${url}_${JSON.stringify(opts)}`;
  
  // Recalcular duração do cache (pode ter mudado desde a última vez)
  const cacheDuration = getCacheDuration();
  
  // Verificar cache se habilitado
  if (useCache && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    const age = Date.now() - cached.timestamp;
    
    // Se estamos próximo de uma atualização, invalidar cache mais cedo
    if (isNearUpdateTime() && age > (cacheDuration * 0.8)) {
      // Invalidar cache se estamos nos últimos 20% do tempo antes da atualização
      apiCache.delete(cacheKey);
    } else if (age < cacheDuration) {
      // Cache ainda válido
      return cached.data;
    } else {
      // Cache expirado, remover
      apiCache.delete(cacheKey);
    }
  }
  
  // Deduplicação: se já existe uma requisição pendente para este endpoint, aguardar ela
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  // Criar promise para deduplicação
  const requestPromise = queueRequest(url, opts).then(data => {
    // Armazenar no cache se habilitado
    if (useCache) {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
    // Remover da lista de pendentes
    pendingRequests.delete(cacheKey);
    return data;
  }).catch(error => {
    pendingRequests.delete(cacheKey);
    throw error;
  });
  
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Limpar cache
 */
function clearApiCache() {
  apiCache.clear();
  pendingRequests.clear();
}

/**
 * Invalidar cache nos horários de atualização
 * Esta função deve ser chamada periodicamente ou nos horários de atualização
 */
function invalidateCacheIfNeeded() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Verificar se estamos exatamente em um horário de atualização (com margem de 1 minuto)
  const isUpdateTime = UPDATE_TIMES.some(updateHour => {
    return currentHour === updateHour && currentMinute <= 1;
  });
  
  if (isUpdateTime) {
    console.log(`🔄 Horário de atualização detectado (${currentHour}:${String(currentMinute).padStart(2, '0')}), invalidando cache...`);
    clearApiCache();
  }
}

// Verificar periodicamente se precisamos invalidar o cache (a cada minuto)
setInterval(invalidateCacheIfNeeded, 60 * 1000);

/**
 * Obter estatísticas do cache e fila
 */
function getApiStats() {
  return {
    cacheSize: apiCache.size,
    pendingRequests: pendingRequests.size,
    activeRequests,
    queueLength: requestQueue.length
  };
}

// Exportar funções para uso global
window.api = {
  fetchJSON,
  fetchJSONWithFilters,
  fetchJSONWithFilter,
  fetchWithCache,
  clearApiCache,
  getApiStats,
  getCacheDuration,
  invalidateCacheIfNeeded
};

