/**
 * Helper para respostas da API com cache
 */

import { withDbCache } from './dbCache.js';

/**
 * Wrapper para queries com cache e tratamento de erros
 * Adiciona timeout para evitar erros 502
 */
export async function withCache(key, ttlSeconds, res, fn, prisma = null, memoryCache = null, timeoutMs = 30000) {
  try {
    let result;
    
    // Criar promise de timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout após ${timeoutMs}ms`)), timeoutMs)
    );
    
    // Executar função com timeout
    const executeFn = async () => {
      if (prisma) {
        return await withDbCache(prisma, key, ttlSeconds, fn, memoryCache);
      } else {
        return await fn();
      }
    };
    
    result = await Promise.race([executeFn(), timeoutPromise]);
    
    return res.json(result);
  } catch (error) {
    // Se houver timeout
    if (error.message?.includes('Timeout')) {
      console.error(`⏱️ Timeout em ${key} após ${timeoutMs}ms`);
      return res.status(504).json({ 
        error: 'Timeout',
        message: 'A operação demorou muito para responder. Tente novamente ou use filtros mais específicos.',
        code: 'TIMEOUT_ERROR'
      });
    }
    
    // Se houver erro de conexão, retornar erro apropriado
    if (error.code === 'P2010' || error.message?.includes('Server selection timeout')) {
      console.error('❌ Erro de conexão com MongoDB:', error.message);
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível',
        message: 'Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    console.error(`❌ Erro em ${key}:`, error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}

/**
 * Wrapper para queries sem cache (apenas tratamento de erros)
 */
export async function safeQuery(res, fn) {
  try {
    const result = await fn();
    return res.json(result);
  } catch (error) {
    if (error.code === 'P2010' || error.message?.includes('Server selection timeout')) {
      console.error('❌ Erro de conexão com MongoDB:', error.message);
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível',
        message: 'Não foi possível conectar ao banco de dados.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    console.error('❌ Erro na query:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}

