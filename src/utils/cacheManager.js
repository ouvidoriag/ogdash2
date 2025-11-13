/**
 * Sistema de Cache Universal Persistente
 * Armazena cache em arquivo JSON para sobreviver a reinicializações
 * Atualiza automaticamente às 07:00 todos os dias
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '..', '..', 'db-data', 'universal-cache.json');
const CACHE_DIR = path.dirname(CACHE_FILE);

// Garantir que o diretório existe
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

let cacheData = null;
let lastUpdate = null;

/**
 * Carregar cache do arquivo
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      cacheData = parsed.data || {};
      lastUpdate = parsed.lastUpdate || null;
      console.log(`📦 Cache universal carregado: ${Object.keys(cacheData).length} chaves, última atualização: ${lastUpdate || 'Nunca'}`);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar cache universal:', error.message);
  }
  cacheData = {};
  return false;
}

/**
 * Salvar cache no arquivo
 */
function saveCache() {
  try {
    const data = {
      lastUpdate: new Date().toISOString(),
      data: cacheData
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 Cache universal salvo: ${Object.keys(cacheData).length} chaves`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar cache universal:', error.message);
    return false;
  }
}

/**
 * Verificar se precisa atualizar (após 07:00)
 */
function shouldUpdate() {
  if (!lastUpdate) return true;
  
  const now = new Date();
  const lastUpdateDate = new Date(lastUpdate);
  const updateTime = new Date(lastUpdateDate);
  updateTime.setHours(7, 0, 0, 0);
  
  // Se já passou das 07:00 de hoje e última atualização foi antes das 07:00
  const today7am = new Date(now);
  today7am.setHours(7, 0, 0, 0);
  
  // Se já passou das 07:00 de hoje e última atualização foi antes
  if (now >= today7am && lastUpdateDate < today7am) {
    return true;
  }
  
  // Se última atualização foi há mais de 24 horas
  const hoursSinceUpdate = (now - lastUpdateDate) / (1000 * 60 * 60);
  if (hoursSinceUpdate >= 24) {
    return true;
  }
  
  return false;
}

/**
 * Obter valor do cache
 */
function get(key) {
  if (!cacheData) loadCache();
  return cacheData[key] || null;
}

/**
 * Definir valor no cache
 */
function set(key, value) {
  if (!cacheData) loadCache();
  cacheData[key] = value;
  saveCache();
}

/**
 * Obter todos os dados do cache
 */
function getAll() {
  if (!cacheData) loadCache();
  return {
    data: cacheData,
    lastUpdate: lastUpdate,
    shouldUpdate: shouldUpdate()
  };
}

/**
 * Limpar cache
 */
function clear() {
  cacheData = {};
  lastUpdate = null;
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
  console.log('🗑️ Cache universal limpo');
}

/**
 * Verificar status do cache
 */
function getStatus() {
  if (!cacheData) loadCache();
  return {
    keys: Object.keys(cacheData).length,
    lastUpdate: lastUpdate,
    shouldUpdate: shouldUpdate(),
    fileSize: fs.existsSync(CACHE_FILE) ? fs.statSync(CACHE_FILE).size : 0
  };
}

// Carregar cache na inicialização
loadCache();

export default {
  get,
  set,
  getAll,
  clear,
  getStatus,
  shouldUpdate,
  loadCache,
  saveCache
};

