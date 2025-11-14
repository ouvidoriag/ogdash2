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

export default function apiRoutes(prisma, getMongoClient) {
  const router = express.Router();
  
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
  
  return router;
}

