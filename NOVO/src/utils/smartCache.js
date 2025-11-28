/**
 * Cache Inteligente (Smart Cache)
 * 
 * Sistema de cache baseado em chaves derivadas de filtros
 * TTL configurável por tipo de endpoint
 * Integração com AggregationCache do banco de dados
 */

import crypto from 'crypto';

/**
 * TTL por tipo de endpoint (em segundos)
 */
const TTL_CONFIG = {
  overview: 5,           // 5 segundos - dados muito dinâmicos
  status: 15,            // 15 segundos
  tema: 15,              // 15 segundos
  assunto: 15,           // 15 segundos
  categoria: 15,        // 15 segundos
  bairro: 15,            // 15 segundos
  orgaoMes: 30,          // 30 segundos
  distinct: 300,         // 5 minutos - valores distintos mudam pouco
  dashboard: 5,          // 5 segundos
  sla: 60,               // 1 minuto
  default: 15            // 15 segundos padrão
};

/**
 * Gerar chave de cache baseada em filtros
 * @param {string} endpoint - Tipo de endpoint (overview, status, etc.)
 * @param {Object} filters - Filtros aplicados
 * @param {string} version - Versão do cache (padrão: 'v1')
 * @returns {string} Chave de cache única
 */
export function generateCacheKey(endpoint, filters = {}, version = 'v1') {
  // Normalizar filtros (ordenar chaves para consistência)
  const normalizedFilters = {};
  const sortedKeys = Object.keys(filters).sort();
  
  for (const key of sortedKeys) {
    const value = filters[key];
    if (value !== undefined && value !== null) {
      // Se for objeto MongoDB, serializar
      if (typeof value === 'object' && !Array.isArray(value)) {
        normalizedFilters[key] = JSON.stringify(value);
      } else {
        normalizedFilters[key] = value;
      }
    }
  }
  
  // Criar hash dos filtros para chave mais curta
  const filtersStr = JSON.stringify(normalizedFilters);
  const hash = crypto.createHash('md5').update(filtersStr).digest('hex').substring(0, 8);
  
  // Formato: endpoint:hash:v1
  return `${endpoint}:${hash}:${version}`;
}

/**
 * Obter TTL para um endpoint
 * @param {string} endpoint - Tipo de endpoint
 * @returns {number} TTL em segundos
 */
export function getTTL(endpoint) {
  return TTL_CONFIG[endpoint] || TTL_CONFIG.default;
}

/**
 * Obter cache de agregação do banco
 * @param {PrismaClient} prisma - Cliente Prisma
 * @param {string} key - Chave do cache
 * @returns {Promise<Object|null>} Dados em cache ou null
 */
export async function getCachedAggregation(prisma, key) {
  try {
    const cached = await prisma.aggregationCache.findFirst({
      where: {
        key,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (cached && cached.data) {
      return cached.data;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar cache:', error);
    return null;
  }
}

/**
 * Armazenar agregação no cache do banco
 * @param {PrismaClient} prisma - Cliente Prisma
 * @param {string} key - Chave do cache
 * @param {Object} data - Dados para cachear
 * @param {number} ttlSeconds - TTL em segundos
 * @returns {Promise<void>}
 */
export async function setCachedAggregation(prisma, key, data, ttlSeconds) {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    await prisma.aggregationCache.upsert({
      where: { key },
      create: {
        key,
        data,
        expiresAt
      },
      update: {
        data,
        expiresAt
      }
    });
  } catch (error) {
    console.error('❌ Erro ao armazenar cache:', error);
    // Não lançar erro - cache é opcional
  }
}

/**
 * Executar função com cache inteligente
 * @param {PrismaClient} prisma - Cliente Prisma
 * @param {string} endpoint - Tipo de endpoint
 * @param {Object} filters - Filtros aplicados
 * @param {Function} fn - Função para executar se cache não existir
 * @param {number} customTTL - TTL customizado (opcional)
 * @returns {Promise<Object>} Dados (do cache ou da função)
 */
export async function withSmartCache(prisma, endpoint, filters, fn, customTTL = null) {
  const cacheKey = generateCacheKey(endpoint, filters);
  const ttl = customTTL || getTTL(endpoint);
  
  // Tentar obter do cache
  const cached = await getCachedAggregation(prisma, cacheKey);
  if (cached) {
    return cached;
  }
  
  // Executar função
  const data = await fn();
  
  // Armazenar no cache (não bloquear se falhar)
  setCachedAggregation(prisma, cacheKey, data, ttl).catch(err => {
    console.warn('⚠️ Erro ao cachear (não crítico):', err.message);
  });
  
  return data;
}

/**
 * Invalidar cache por padrão
 * @param {PrismaClient} prisma - Cliente Prisma
 * @param {string} pattern - Padrão de chave (ex: 'overview:*')
 * @returns {Promise<number>} Número de registros removidos
 */
export async function invalidateCachePattern(prisma, pattern) {
  try {
    // MongoDB não suporta LIKE diretamente, usar regex
    const regexPattern = pattern.replace('*', '.*');
    
    const result = await prisma.aggregationCache.deleteMany({
      where: {
        key: {
          contains: pattern.replace('*', '')
        }
      }
    });
    
    return result.count || 0;
  } catch (error) {
    console.error('❌ Erro ao invalidar cache:', error);
    return 0;
  }
}

/**
 * Limpar cache expirado
 * @param {PrismaClient} prisma - Cliente Prisma
 * @returns {Promise<number>} Número de registros removidos
 */
export async function cleanExpiredCache(prisma) {
  try {
    const result = await prisma.aggregationCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    
    return result.count || 0;
  } catch (error) {
    console.error('❌ Erro ao limpar cache expirado:', error);
    return 0;
  }
}

/**
 * Obter estatísticas de cache
 * @param {PrismaClient} prisma - Cliente Prisma
 * @returns {Promise<Object>} Estatísticas do cache
 */
export async function getCacheStats(prisma) {
  try {
    const total = await prisma.aggregationCache.count();
    const expired = await prisma.aggregationCache.count({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    const active = total - expired;
    
    return {
      total,
      active,
      expired,
      hitRate: 0 // Seria calculado com métricas de uso
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de cache:', error);
    return { total: 0, active: 0, expired: 0, hitRate: 0 };
  }
}

