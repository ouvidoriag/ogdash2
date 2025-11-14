/**
 * Configuração e inicialização do sistema de cache
 */

import cacheManager from '../utils/cacheManager.js';
import { buildUniversalCache, scheduleDailyUpdate } from '../utils/cacheBuilder.js';

export async function initializeCache(prisma) {
  try {
    // Carregar cache persistente
    cacheManager.loadCache();
    
    // Inicializar cache universal e agendar atualizações diárias
    scheduleDailyUpdate(prisma);
    
    console.log('✅ Sistema de cache universal inicializado');
    return true;
  } catch (error) {
    console.warn('⚠️ Erro ao inicializar cache universal:', error.message);
    return false;
  }
}

