/**
 * Sistema Global de Carregamento de Dados
 * Unifica o carregamento de dados para TODAS as páginas e cards
 */

const pendingRequests = new Map();

window.dataLoader = {
  async load(endpoint, options = {}) {
    const {
      fallback = null,
      timeout = 30000,
      retries = 1,
      useDataStore = true
    } = options;
    
    if (useDataStore && window.dataStore) {
      const ttl = options.ttl !== undefined ? options.ttl : window.dataStore.getDefaultTTL();
      
      if (endpoint === '/api/dashboard-data' || endpoint.includes('/api/dashboard-data')) {
        const cached = window.dataStore.get('dashboardData', ttl);
        if (cached !== null) {
          if (window.Logger) {
            window.Logger.debug(`${endpoint}: Dados obtidos do cache`);
          }
          return cached;
        }
      } else {
        const cached = window.dataStore.get(endpoint, ttl);
        if (cached !== null) {
          if (window.Logger) {
            window.Logger.debug(`${endpoint}: Dados obtidos do cache`);
          }
          return cached;
        }
      }
    }
    
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    if (pendingRequests.has(cacheKey)) {
      if (window.Logger) {
        window.Logger.debug(`${endpoint}: Reutilizando requisição pendente`);
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
            if (window.Logger) {
              window.Logger.warn(`${endpoint}: HTTP ${res.status}, retornando fallback`);
            }
            return fallback;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        const count = this._countItems(data);
        
        // Validar dados antes de salvar no cache (especialmente para /api/distritos)
        if (endpoint === '/api/distritos') {
          if (!data || !data.distritos || Object.keys(data.distritos || {}).length === 0) {
            console.warn('⚠️ dataLoader: /api/distritos retornou dados vazios, não salvando no cache');
            console.warn('   Estrutura recebida:', data ? Object.keys(data) : 'null');
            if (window.Logger) {
              window.Logger.warn('/api/distritos: Dados vazios recebidos, ignorando cache');
            }
            // Limpar cache antigo se existir
            if (window.dataStore) {
              window.dataStore.clear('/api/distritos');
            }
            return data; // Retornar mesmo assim, mas sem salvar no cache
          }
          // Validar que os dados são válidos antes de salvar
          console.log('✅ dataLoader: /api/distritos validado, salvando no cache');
          console.log(`   - Distritos: ${Object.keys(data.distritos).length}`);
        }
        
        if (window.dataStore) {
          const useDeepCopy = deepCopy !== false;
          
          if (endpoint === '/api/dashboard-data' || endpoint.includes('/api/dashboard-data')) {
            window.dataStore.set('dashboardData', data, useDeepCopy);
            if (data.manifestationsByMonth) {
              window.dataStore.set('manifestationsByMonth', data.manifestationsByMonth, useDeepCopy);
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
            }
          } else {
            window.dataStore.set(endpoint, data, useDeepCopy);
          }
          
          if (window.Logger) {
            window.Logger.debug(`${endpoint}: Dados armazenados no dataStore${useDeepCopy ? ' (deepCopy)' : ''}`);
          }
        }
        
        if (window.Logger) {
          window.Logger.success(`${endpoint}: ${count} itens`);
        }
        
        return data;
      } catch (error) {
        if (error.name === 'AbortError' && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        if (attempt < retries && (error.name === 'AbortError' || error.message?.includes('timeout'))) {
          if (window.Logger) {
            window.Logger.warn(`${endpoint}: Tentativa ${attempt + 1}/${retries + 1} falhou, tentando novamente...`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        if (error.name !== 'AbortError') {
          if (window.Logger) {
            window.Logger.error(`${endpoint}: ${error.message || error}`);
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
      if ('total' in data && typeof data.total === 'number') return data.total;
      if ('count' in data && typeof data.count === 'number') return data.count;
      return Object.keys(data).length;
    }
    return 0;
  }
};

