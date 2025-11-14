/**
 * Sistema Global de Carregamento de Dados
 * Unifica o carregamento de dados para TODAS as páginas e cards
 */

// Deduplicação de requisições (evita múltiplas chamadas simultâneas para o mesmo endpoint)
const pendingRequests = new Map();

window.dataLoader = {
  async load(endpoint, options = {}) {
    const {
      fallback = null,
      timeout = 30000,
      retries = 1,
      useDataStore = true // Nova opção: usar dataStore se disponível
    } = options;
    
    // INTEGRAÇÃO COM DATASTORE: Verificar se dados já estão no store
    // NOVO: Agora verifica cache persistente (localStorage) automaticamente
    if (useDataStore && window.dataStore) {
      // Usar TTL do dataStore se não especificado
      const ttl = options.ttl !== undefined ? options.ttl : window.dataStore.getDefaultTTL();
      
      // Para endpoint especial dashboard-data
      if (endpoint === '/api/dashboard-data' || endpoint.includes('/api/dashboard-data')) {
        const cached = window.dataStore.get('dashboardData', ttl);
        if (cached !== null) {
          if (window.Logger) {
            window.Logger.debug(`${endpoint}: Dados obtidos do cache (memória ou persistente)`);
          }
          return cached;
        }
      } else {
        // Para outros endpoints, verificar cache geral (inclui persistente)
        const cached = window.dataStore.get(endpoint, ttl);
        if (cached !== null) {
          if (window.Logger) {
            window.Logger.debug(`${endpoint}: Dados obtidos do cache (memória ou persistente)`);
          }
          return cached;
        }
      }
    }
    
    // Deduplicação: se já existe uma requisição pendente para este endpoint, reutilizar
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    if (pendingRequests.has(cacheKey)) {
      // FASE 2.1: Usar Logger em vez de console.log
      if (window.Logger) {
        window.Logger.debug(`${endpoint}: Reutilizando requisição pendente`);
      } else {
        console.log(`🔄 ${endpoint}: Reutilizando requisição pendente`);
      }
      return pendingRequests.get(cacheKey);
    }
    
    const requestPromise = this._fetchDirect(endpoint, { fallback, timeout, retries, deepCopy: options.deepCopy })
      .then(data => {
        pendingRequests.delete(cacheKey);
        return data;
      })
      .catch(error => {
        pendingRequests.delete(cacheKey);
        throw error;
      });
    
    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },
  
  async _fetchDirect(endpoint, { fallback, timeout, retries, deepCopy = true }) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          if (res.status === 404 || res.status === 500) {
            // FASE 2.1: Usar Logger em vez de console.warn
            if (window.Logger) {
              window.Logger.warn(`${endpoint}: HTTP ${res.status}, retornando fallback`);
            } else {
              console.warn(`⚠️ ${endpoint}: HTTP ${res.status}, retornando fallback`);
            }
            return fallback;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        const count = this._countItems(data);
        
        // INTEGRAÇÃO COM DATASTORE: Armazenar dados no store global
        if (window.dataStore) {
          // Usar deepCopy para imutabilidade (evita modificações acidentais)
          const useDeepCopy = deepCopy !== false; // Por padrão, usar deepCopy
          
          // Endpoint especial: dashboard-data
          if (endpoint === '/api/dashboard-data' || endpoint.includes('/api/dashboard-data')) {
            window.dataStore.set('dashboardData', data, useDeepCopy);
            // Também armazenar datasets individuais para acesso direto
            if (data.manifestationsByMonth) {
              window.dataStore.set('manifestationsByMonth', data.manifestationsByMonth, useDeepCopy);
              // Também armazenar com endpoint para subscribe
              window.dataStore.set('/api/aggregate/by-month', data.manifestationsByMonth, useDeepCopy);
            }
            if (data.manifestationsByDay) {
              window.dataStore.set('manifestationsByDay', data.manifestationsByDay, useDeepCopy);
              window.dataStore.set('/api/aggregate/by-day', data.manifestationsByDay, useDeepCopy);
            }
            if (data.manifestationsByStatus) {
              window.dataStore.set('manifestationsByStatus', data.manifestationsByStatus, useDeepCopy);
            }
            if (data.manifestationsByTheme) {
              window.dataStore.set('manifestationsByTheme', data.manifestationsByTheme, useDeepCopy);
              window.dataStore.set('/api/aggregate/by-theme', data.manifestationsByTheme, useDeepCopy);
            }
            if (data.manifestationsBySubject) {
              window.dataStore.set('manifestationsBySubject', data.manifestationsBySubject, useDeepCopy);
              window.dataStore.set('/api/aggregate/by-subject', data.manifestationsBySubject, useDeepCopy);
            }
            if (data.manifestationsByOrgan) {
              window.dataStore.set('manifestationsByOrgan', data.manifestationsByOrgan, useDeepCopy);
              window.dataStore.set('/api/aggregate/count-by?field=Orgaos', data.manifestationsByOrgan, useDeepCopy);
            }
          } else {
            // Armazenar outros endpoints no cache geral
            // Usar endpoint completo como chave (incluindo query params se houver)
            window.dataStore.set(endpoint, data, useDeepCopy);
          }
          
          if (window.Logger) {
            window.Logger.debug(`${endpoint}: Dados armazenados no dataStore${useDeepCopy ? ' (deepCopy)' : ''}`);
          }
        }
        
        // FASE 2.1: Usar Logger em vez de console.log
        if (window.Logger) {
          window.Logger.success(`${endpoint}: ${count} itens (fetch direto)`);
        } else {
          console.log(`✅ ${endpoint}: ${count} itens (fetch direto)`);
        }
        
        // DEBUG: Se retornar 0 itens, logar mais detalhes
        if (count === 0) {
          // FASE 2.1: Usar Logger em vez de console.warn
          if (window.Logger) {
            window.Logger.warn(`${endpoint}: Retornou 0 itens - verificar resposta`, {
              tipo: Array.isArray(data) ? 'array' : typeof data,
              keys: typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A',
              status: res.status,
              ok: res.ok
            });
          } else {
            console.warn(`⚠️ ${endpoint}: Retornou 0 itens - verificar resposta:`, {
              tipo: Array.isArray(data) ? 'array' : typeof data,
              keys: typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A',
              status: res.status,
              ok: res.ok
            });
          }
        }
        
        return data;
      } catch (error) {
        if (error.name === 'AbortError' && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        if (attempt < retries && (error.name === 'AbortError' || error.message?.includes('timeout'))) {
          // FASE 2.1: Usar Logger em vez de console.warn
          if (window.Logger) {
            window.Logger.warn(`${endpoint}: Tentativa ${attempt + 1}/${retries + 1} falhou, tentando novamente...`);
          } else {
            console.warn(`⚠️ ${endpoint}: Tentativa ${attempt + 1}/${retries + 1} falhou, tentando novamente...`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        if (error.name !== 'AbortError') {
          // FASE 2.1: Usar Logger em vez de console.error
          if (window.Logger) {
            window.Logger.error(`${endpoint}: ${error.message || error}`);
          } else {
            console.error(`❌ ${endpoint}: ${error.message || error}`);
          }
        }
        return fallback;
      }
    }
    
    return fallback;
  },
  
  
  async loadMany(endpoints, options = {}) {
    const promises = endpoints.map(endpoint => this.load(endpoint, options));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      endpoint: endpoints[index],
      data: result.status === 'fulfilled' ? result.value : options.fallback || null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  },
  
  _countItems(data) {
    if (data === null || data === undefined) return 0;
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object') {
      // Se tem propriedade 'total' ou 'count', usar ela
      if ('total' in data && typeof data.total === 'number') return data.total;
      if ('count' in data && typeof data.count === 'number') return data.count;
      return Object.keys(data).length;
    }
    return 0;
  }
};

if (typeof window !== 'undefined') {
  window.dataLoader = window.dataLoader;
}
