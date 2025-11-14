/**
 * Sistema de Cache no Banco de Dados
 * Armazena agregações pré-computadas diretamente no MongoDB
 * Muito mais rápido que cache em memória para dados grandes
 */

/**
 * Obter cache do banco de dados
 */
export async function getDbCache(prisma, key) {
  try {
    const cached = await prisma.aggregationCache.findUnique({
      where: { key },
      select: { data: true, expiresAt: true }
    });
    
    if (!cached) return null;
    
    // Verificar se expirou
    if (new Date() > cached.expiresAt) {
      // Cache expirado, remover
      await prisma.aggregationCache.delete({ where: { key } });
      return null;
    }
    
    return cached.data;
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar cache do banco para ${key}:`, error.message);
    return null;
  }
}

/**
 * Salvar cache no banco de dados
 */
export async function setDbCache(prisma, key, data, ttlSeconds = 3600) {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    await prisma.aggregationCache.upsert({
      where: { key },
      update: {
        data,
        expiresAt,
        updatedAt: new Date()
      },
      create: {
        key,
        data,
        expiresAt
      }
    });
    
    return true;
  } catch (error) {
    console.warn(`⚠️ Erro ao salvar cache no banco para ${key}:`, error.message);
    return false;
  }
}

/**
 * Limpar cache expirado do banco
 */
export async function cleanExpiredCache(prisma) {
  try {
    const result = await prisma.aggregationCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    if (result.count > 0) {
      console.log(`🧹 Limpeza de cache: ${result.count} entradas expiradas removidas`);
    }
    
    return result.count;
  } catch (error) {
    console.warn('⚠️ Erro ao limpar cache expirado:', error.message);
    return 0;
  }
}

/**
 * Limpar cache específico
 */
export async function clearDbCache(prisma, key) {
  try {
    await prisma.aggregationCache.delete({ where: { key } });
    return true;
  } catch (error) {
    console.warn(`⚠️ Erro ao limpar cache ${key}:`, error.message);
    return false;
  }
}

/**
 * Limpar todo o cache
 */
export async function clearAllDbCache(prisma) {
  try {
    const result = await prisma.aggregationCache.deleteMany({});
    console.log(`🗑️ Cache do banco limpo: ${result.count} entradas removidas`);
    return result.count;
  } catch (error) {
    console.warn('⚠️ Erro ao limpar todo o cache:', error.message);
    return 0;
  }
}

/**
 * Obter estatísticas do cache
 */
export async function getCacheStats(prisma) {
  try {
    const total = await prisma.aggregationCache.count();
    const expired = await prisma.aggregationCache.count({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    const active = total - expired;
    
    return {
      total,
      active,
      expired,
      expiredPercent: total > 0 ? ((expired / total) * 100).toFixed(1) : 0
    };
  } catch (error) {
    console.warn('⚠️ Erro ao obter estatísticas do cache:', error.message);
    return { total: 0, active: 0, expired: 0, expiredPercent: 0 };
  }
}

/**
 * Wrapper para usar cache do banco com fallback para cache em memória
 */
export async function withDbCache(prisma, key, ttlSeconds, fn, memoryCache = null) {
  // 1. Tentar cache do banco primeiro
  const dbCached = await getDbCache(prisma, key);
  if (dbCached !== null) {
    return dbCached;
  }
  
  // 2. Tentar cache em memória se disponível
  if (memoryCache) {
    const memCached = memoryCache.get(key);
    if (memCached) {
      // Salvar no banco também para próxima vez
      await setDbCache(prisma, key, memCached, ttlSeconds);
      return memCached;
    }
  }
  
  // 3. Executar função e cachear resultado
  const result = await fn();
  
  // Salvar em ambos os caches
  await setDbCache(prisma, key, result, ttlSeconds);
  if (memoryCache) {
    memoryCache.set(key, result, ttlSeconds);
  }
  
  return result;
}

