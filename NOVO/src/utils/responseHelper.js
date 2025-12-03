/**
 * Helper para respostas da API com cache
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 */

import { withDbCache } from './dbCache.js';
import { logger } from './logger.js';

/**
 * Wrapper para queries com cache e tratamento de erros
 * Adiciona timeout para evitar erros 502
 * 
 * @param {string} key - Chave do cache
 * @param {number} ttlSeconds - TTL em segundos
 * @param {Object} res - Response object do Express
 * @param {Function} fn - Função para executar
 * @param {Object|null} memoryCache - Cache em memória opcional
 * @param {number} timeoutMs - Timeout em milissegundos (padrão: 30000)
 * @returns {Promise<Object>} - Resposta JSON
 */
export async function withCache(key, ttlSeconds, res, fn, memoryCache = null, timeoutMs = 30000) {
  try {
    let result;
    
    // Criar promise de timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs)
    );
    
    // Executar função com cache e timeout
    const executeFn = async () => {
      return await withDbCache(key, ttlSeconds, fn, memoryCache);
    };
    
    result = await Promise.race([executeFn(), timeoutPromise]);
    
    return res.json(result);
  } catch (error) {
    // Se houver timeout
    if (error.message?.includes('Timeout')) {
      logger.error(`Timeout em ${key} após ${timeoutMs}ms`);
      return res.status(504).json({ 
        error: 'Timeout',
        message: 'A operação demorou muito para responder. Tente novamente ou use filtros mais específicos.',
        code: 'TIMEOUT_ERROR'
      });
    }
    
    // Se houver erro de conexão, retornar erro apropriado
    if (error.code === 'P2010' || error.message?.includes('Server selection timeout') || error.name === 'MongooseError') {
      logger.error('Erro de conexão com MongoDB:', { error: error.message });
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível',
        message: 'Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    logger.error(`Erro em ${key}:`, { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}

/**
 * Wrapper para queries sem cache (apenas tratamento de erros)
 * 
 * @param {Object} res - Response object do Express
 * @param {Function} fn - Função para executar
 * @returns {Promise<Object>} - Resposta JSON
 */
export async function safeQuery(res, fn) {
  try {
    const result = await fn();
    return res.json(result);
  } catch (error) {
    if (error.code === 'P2010' || error.message?.includes('Server selection timeout') || error.name === 'MongooseError') {
      logger.error('Erro de conexão com MongoDB:', { error: error.message });
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível',
        message: 'Não foi possível conectar ao banco de dados.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    logger.error('Erro na query:', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}

