/**
 * Helper para respostas da API com cache
 */

import { withDbCache } from './dbCache.js';

/**
 * Wrapper para queries com cache e tratamento de erros
 */
export async function withCache(key, ttlSeconds, res, fn, prisma = null, memoryCache = null) {
  try {
    let result;
    
    // Se prisma está disponível, usar cache híbrido (banco + memória)
    if (prisma) {
      result = await withDbCache(prisma, key, ttlSeconds, fn, memoryCache);
    } else {
      // Sem prisma, executar função diretamente
      result = await fn();
    }
    
    return res.json(result);
  } catch (error) {
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

