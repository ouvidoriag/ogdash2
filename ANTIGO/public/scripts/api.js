/**
 * API Module - Funções para buscar dados do backend
 */

// REMOVIDO: pendingRequests movido para dataLoader.js para evitar conflito
// const pendingRequests = new Map();

let activeRequests = 0;
const requestQueue = [];

const REQUEST_TIMEOUT = window.config?.PERFORMANCE_CONFIG?.REQUEST_TIMEOUT || 60000;
const MAX_RETRIES = window.config?.PERFORMANCE_CONFIG?.MAX_RETRIES || 2;
const RETRY_DELAY_BASE = window.config?.PERFORMANCE_CONFIG?.RETRY_DELAY_BASE || 2000;
const MAX_CONCURRENT_REQUESTS = window.config?.PERFORMANCE_CONFIG?.MAX_CONCURRENT_REQUESTS || 6;

async function fetchJSON(url, opts = {}, retryCount = 0) {
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
      throw new Error(`Request failed: ${res.status} ${res.statusText} for ${url}`);
    }
    
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    const isNetworkError = error.name === 'AbortError' || 
                          (error.message && (
                            error.message.includes('fetch') || 
                            error.message.includes('network') ||
                            error.message.includes('Failed to fetch') ||
                            error.message.includes('timeout')
                          ));
    
    if (isNetworkError && retryCount < MAX_RETRIES && !error.message?.includes('Request failed')) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * (retryCount + 1)));
      return fetchJSON(url, opts, retryCount + 1);
    }
    
    throw error;
  }
}

async function queueRequest(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      activeRequests++;
      try {
        const data = await fetchJSON(url, opts);
        resolve(data);
      } catch (error) {
        reject(error);
      } finally {
        activeRequests--;
        if (requestQueue.length > 0) {
          const next = requestQueue.shift();
          executeRequest();
        }
      }
    };
    
    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      executeRequest();
    } else {
      requestQueue.push(executeRequest);
    }
  });
}

// REMOVIDO: fetchWithCache não usa mais pendingRequests (movido para dataLoader)
// Usar window.dataLoader.load() diretamente
async function fetchWithCache(url, opts = {}) {
  // Usar dataLoader se disponível, senão fazer fetch direto
  if (window.dataLoader?.load) {
    return await window.dataLoader.load(url, opts);
  }
  return await fetchJSON(url, opts);
}

function clearApiCache() {
  // Limpar cache do dataLoader se disponível
  if (window.dataLoader?.clearCache) {
    window.dataLoader.clearCache();
  }
}

async function fetchData(url, opts = {}) {
  return await fetchWithCache(url, opts);
}

async function fetchWithFilters(url, opts = {}) {
  return await fetchWithCache(url, opts);
}

window.api = {
  fetchData,
  fetchWithFilters,
  clearCache: clearApiCache
};
