/**
 * Rotas de agregação
 * Endpoints para análises e agregações de dados
 * 
 * Endpoints:
 * - GET /api/aggregate/count-by - Contagem por campo
 * - GET /api/aggregate/time-series - Série temporal
 * - GET /api/aggregate/by-theme - Agregação por tema
 * - GET /api/aggregate/by-subject - Agregação por assunto
 * - GET /api/aggregate/by-server - Agregação por servidor
 * - GET /api/aggregate/by-month - Agregação por mês
 * - GET /api/aggregate/by-day - Agregação por dia
 * - GET /api/aggregate/heatmap - Dados para heatmap (mês x dimensão)
 * - GET /api/aggregate/filtered - Agregação com filtros customizados
 * - GET /api/aggregate/sankey-flow - Dados para diagrama Sankey
 * - GET /api/aggregate/count-by-status-mes - Status por mês
 * - GET /api/aggregate/count-by-orgao-mes - Órgão por mês
 * - GET /api/aggregate/by-district - Agregação por distrito
 * 
 * @param {PrismaClient} prisma - Cliente Prisma
 * @param {Function} getMongoClient - Função para obter cliente MongoDB
 * @returns {express.Router} Router configurado
 */

import express from 'express';
import * as aggregateController from '../controllers/aggregateController.js';

export default function aggregateRoutes(prisma, getMongoClient) {
  const router = express.Router();
  
  /**
   * GET /api/aggregate/count-by
   * Contagem de registros agrupados por campo
   * Query params: field, servidor, unidadeCadastro
   */
  router.get('/count-by', (req, res) => aggregateController.countBy(req, res, prisma));
  
  /**
   * GET /api/aggregate/time-series
   * Série temporal de registros
   * Query params: servidor, unidadeCadastro, startDate, endDate
   */
  router.get('/time-series', (req, res) => aggregateController.timeSeries(req, res, prisma));
  
  /**
   * GET /api/aggregate/by-theme
   * Agregação por tema
   * OTIMIZAÇÃO: Usa pipeline MongoDB nativo
   */
  router.get('/by-theme', (req, res) => aggregateController.byTheme(req, res, prisma, getMongoClient));
  
  /**
   * GET /api/aggregate/by-subject
   * Agregação por assunto
   * OTIMIZAÇÃO: Usa pipeline MongoDB nativo
   */
  router.get('/by-subject', (req, res) => aggregateController.bySubject(req, res, prisma, getMongoClient));
  
  /**
   * GET /api/aggregate/by-server
   * Agregação por servidor
   * Query params: servidor
   */
  router.get('/by-server', (req, res) => aggregateController.byServer(req, res, prisma));
  
  /**
   * GET /api/aggregate/by-month
   * Agregação por mês
   * Query params: servidor, unidadeCadastro, meses
   */
  router.get('/by-month', (req, res) => aggregateController.byMonth(req, res, prisma));
  
  /**
   * GET /api/aggregate/by-day
   * Agregação por dia
   * Query params: servidor, unidadeCadastro, startDate, endDate
   */
  router.get('/by-day', (req, res) => aggregateController.byDay(req, res, prisma));
  
  /**
   * GET /api/aggregate/heatmap
   * Dados para heatmap (mês x dimensão)
   * Query params: dim (Secretaria, Setor, Tipo, Categoria, etc.)
   */
  router.get('/heatmap', (req, res) => aggregateController.heatmap(req, res, prisma));
  
  /**
   * GET /api/aggregate/filtered
   * Agregação com filtros customizados
   * Query params: filters (JSON), servidor, unidadeCadastro
   */
  router.get('/filtered', (req, res) => aggregateController.filtered(req, res, prisma));
  
  /**
   * GET /api/aggregate/sankey-flow
   * Dados para diagrama Sankey (fluxo entre dimensões)
   * Query params: from, to, servidor, unidadeCadastro
   */
  router.get('/sankey-flow', (req, res) => aggregateController.sankeyFlow(req, res, prisma));
  
  /**
   * GET /api/aggregate/count-by-status-mes
   * Contagem de status por mês
   * Query params: servidor, unidadeCadastro, meses
   */
  router.get('/count-by-status-mes', (req, res) => aggregateController.countByStatusMes(req, res, prisma));
  
  /**
   * GET /api/aggregate/count-by-orgao-mes
   * Contagem de órgão por mês
   * Query params: servidor, unidadeCadastro, meses
   * OTIMIZAÇÃO: Usa pipeline MongoDB nativo
   */
  router.get('/count-by-orgao-mes', (req, res) => aggregateController.countByOrgaoMes(req, res, prisma, getMongoClient));
  
  /**
   * GET /api/aggregate/by-district
   * Agregação por distrito (geográfico)
   */
  router.get('/by-district', (req, res) => aggregateController.byDistrict(req, res, prisma));
  
  return router;
}

