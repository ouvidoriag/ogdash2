/**
 * Rotas principais da API
 * Organiza todas as rotas em módulos especializados
 * 
 * Estrutura:
 * - /api/aggregate/* - Agregações e análises de dados
 * - /api/stats/* - Estatísticas e métricas
 * - /api/cache/* - Gerenciamento de cache
 * - /api/chat/* - Sistema de chat
 * - /api/ai/* - Inteligência artificial e insights
 * - /api/* - Dados gerais (summary, records, etc.)
 * - /api/secretarias, /api/distritos, etc. - Dados geográficos
 * - /api/colab/* - Integração com API do Colab
 * 
 * @param {PrismaClient} prisma - Cliente Prisma para acesso ao banco
 * @param {Function} getMongoClient - Função para obter cliente MongoDB nativo
 * @returns {express.Router} Router configurado com todas as rotas
 */

import express from 'express';
import aggregateRoutes from './aggregate.js';
import statsRoutes from './stats.js';
import cacheRoutes from './cache.js';
import chatRoutes from './chat.js';
import aiRoutes from './ai.js';
import dataRoutes from './data.js';
import geographicRoutes from './geographic.js';
import zeladoriaRoutes from './zeladoria.js';
import notificationRoutes from './notifications.js';
import colabRoutes from './colab.js';
import batchRoutes from './batch.js';
import metricsRoutes from './metrics.js';

export default function apiRoutes(prisma, getMongoClient) {
  const router = express.Router();
  
  // Nota: Rotas de autenticação (/api/auth) são registradas separadamente no server.js
  // para que sejam públicas (sem requireAuth)
  
  // Mapa de rotas carregadas (para debug e documentação)
  const routesMap = {
    aggregate: '/api/aggregate/*',
    stats: '/api/stats/*',
    cache: '/api/cache/*',
    chat: '/api/chat/*',
    ai: '/api/ai/*',
    data: '/api/*',
    geographic: '/api/secretarias, /api/distritos, etc.',
    zeladoria: '/api/zeladoria/*',
    notifications: '/api/notifications/*',
    colab: '/api/colab/*',
    batch: '/api/batch/*',
    metrics: '/api/metrics/*'
  };
  
  // Rotas de agregação - Análises e agregações de dados
  router.use('/aggregate', aggregateRoutes(prisma, getMongoClient));
  
  // Rotas de estatísticas - Métricas e análises estatísticas
  router.use('/stats', statsRoutes(prisma, getMongoClient));
  
  // Rotas de cache - Gerenciamento de cache híbrido
  router.use('/cache', cacheRoutes(prisma));
  
  // Rotas de chat - Sistema de mensagens e chat
  router.use('/chat', chatRoutes(prisma));
  
  // Rotas de IA - Inteligência artificial e insights
  router.use('/ai', aiRoutes(prisma, getMongoClient));
  
  // Rotas de dados gerais - Endpoints principais (summary, records, etc.)
  router.use('/', dataRoutes(prisma, getMongoClient));
  
  // Rotas geográficas - Dados de secretarias, distritos, bairros, saúde
  router.use('/', geographicRoutes(prisma));
  
  // Rotas de Zeladoria - Dados de serviços de zeladoria
  router.use('/zeladoria', zeladoriaRoutes(prisma, getMongoClient));
  
  // Rotas de Notificações - Sistema de notificações por email
  router.use('/notifications', notificationRoutes(prisma));
  
  // Rotas de Colab - Integração com API do Colab
  router.use('/colab', colabRoutes());
  
  // Rotas de Batch - Requisições em lote
  router.use('/batch', batchRoutes(prisma, getMongoClient));
  
  // Rotas de Métricas - Monitoramento do sistema
  router.use('/metrics', metricsRoutes(prisma));
  
  // Log de carregamento das rotas (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Rotas da API carregadas:', routesMap);
    console.log(`✅ Total de módulos registrados: ${Object.keys(routesMap).length}`);
  }
  
  // Expor mapa de rotas para documentação automática (opcional)
  router.routesMap = routesMap;
  
  return router;
}

