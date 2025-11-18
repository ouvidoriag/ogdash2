/**
 * Rotas de Zeladoria
 * Endpoints para dados de Zeladoria
 * 
 * Endpoints:
 * - GET /api/zeladoria/summary - Resumo geral
 * - GET /api/zeladoria/count-by - Contagem por campo
 * - GET /api/zeladoria/by-month - Agregação por mês
 * - GET /api/zeladoria/time-series - Série temporal
 * - GET /api/zeladoria/records - Lista de registros
 * - GET /api/zeladoria/stats - Estatísticas gerais
 * - GET /api/zeladoria/by-status-month - Status por mês
 * - GET /api/zeladoria/by-categoria-departamento - Categoria por Departamento
 * - GET /api/zeladoria/geographic - Dados geográficos
 * 
 * @param {PrismaClient} prisma - Cliente Prisma
 * @param {Function} getMongoClient - Função para obter cliente MongoDB
 * @returns {express.Router} Router configurado
 */

import express from 'express';
import * as zeladoriaController from '../controllers/zeladoriaController.js';

export default function zeladoriaRoutes(prisma, getMongoClient) {
  const router = express.Router();
  
  /**
   * GET /api/zeladoria/summary
   * Resumo geral de dados de Zeladoria
   */
  router.get('/summary', (req, res) => zeladoriaController.summary(req, res, prisma));
  
  /**
   * GET /api/zeladoria/count-by
   * Contagem por campo
   * Query params: field (status, categoria, departamento, etc.)
   */
  router.get('/count-by', (req, res) => zeladoriaController.countBy(req, res, prisma));
  
  /**
   * GET /api/zeladoria/by-month
   * Agregação por mês
   */
  router.get('/by-month', (req, res) => zeladoriaController.byMonth(req, res, prisma));
  
  /**
   * GET /api/zeladoria/time-series
   * Série temporal
   * Query params: startDate, endDate (opcional)
   */
  router.get('/time-series', (req, res) => zeladoriaController.timeSeries(req, res, prisma));
  
  /**
   * GET /api/zeladoria/records
   * Lista de registros com paginação
   * Query params: page, limit, status, categoria, departamento
   */
  router.get('/records', (req, res) => zeladoriaController.records(req, res, prisma));
  
  /**
   * GET /api/zeladoria/stats
   * Estatísticas gerais
   */
  router.get('/stats', (req, res) => zeladoriaController.stats(req, res, prisma));
  
  /**
   * GET /api/zeladoria/by-status-month
   * Status por mês
   */
  router.get('/by-status-month', (req, res) => zeladoriaController.byStatusMonth(req, res, prisma));
  
  /**
   * GET /api/zeladoria/by-categoria-departamento
   * Categoria por Departamento
   */
  router.get('/by-categoria-departamento', (req, res) => zeladoriaController.byCategoriaDepartamento(req, res, prisma));
  
  /**
   * GET /api/zeladoria/geographic
   * Dados geográficos (bairros com coordenadas)
   */
  router.get('/geographic', (req, res) => zeladoriaController.geographic(req, res, prisma));
  
  return router;
}

