/**
 * Sistema de Cache Universal no Cliente
 * DESABILITADO: Cache completamente removido
 */

const CACHE_KEY = 'ouvidoria_universal_cache';

function getCache() {
  return null;
}

function setCache(data) {
  return false;
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('cache') || key.includes('Cache') || key.includes('CACHE')) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function fetchUniversalCache() {
  return {};
}

async function getCachedData(key) {
  return null;
}

async function initCache() {
  clearCache();
  return {};
}

function getCacheStatus() {
  return {
    hasLocalCache: false,
    keys: 0,
    timestamp: null,
    expiry: null,
    isExpired: true
  };
}

window.cache = {
  get: getCache,
  set: setCache,
  clear: clearCache,
  fetch: fetchUniversalCache,
  getCachedData,
  init: initCache,
  getStatus: getCacheStatus
};

// DESABILITADO: Não inicializar cache automaticamente
// Cache completamente removido - dados sempre vêm do banco
