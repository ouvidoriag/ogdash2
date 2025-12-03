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
 * @param {*} prisma - Parâmetro mantido para compatibilidade (não usado - sistema migrado para Mongoose)
 * @param {Function} getMongoClient - Função para obter cliente MongoDB
 * @returns {express.Router} Router configurado
 */

import express from 'express';
import * as zeladoriaController from '../controllers/zeladoriaController.js';

export default function zeladoriaRoutes() {
  const router = express.Router();
  
  /**
   * GET /api/zeladoria/summary
   * Resumo geral de dados de Zeladoria
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/summary', (req, res) => zeladoriaController.summary(req, res));
  
  /**
   * GET /api/zeladoria/count-by
   * Contagem por campo
   * Query params: field (status, categoria, departamento, etc.)
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/count-by', (req, res) => zeladoriaController.countBy(req, res));
  
  /**
   * GET /api/zeladoria/by-month
   * Agregação por mês
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/by-month', (req, res) => zeladoriaController.byMonth(req, res));
  
  /**
   * GET /api/zeladoria/time-series
   * Série temporal
   * Query params: startDate, endDate (opcional)
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/time-series', (req, res) => zeladoriaController.timeSeries(req, res));
  
  /**
   * GET /api/zeladoria/records
   * Lista de registros com paginação
   * Query params: page, limit, status, categoria, departamento
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/records', (req, res) => zeladoriaController.records(req, res));
  
  /**
   * GET /api/zeladoria/stats
   * Estatísticas gerais
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/stats', (req, res) => zeladoriaController.stats(req, res));
  
  /**
   * GET /api/zeladoria/by-status-month
   * Status por mês
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/by-status-month', (req, res) => zeladoriaController.byStatusMonth(req, res));
  
  /**
   * GET /api/zeladoria/by-categoria-departamento
   * Categoria por Departamento
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/by-categoria-departamento', (req, res) => zeladoriaController.byCategoriaDepartamento(req, res));
  
  /**
   * GET /api/zeladoria/geographic
   * Dados geográficos (bairros com coordenadas)
   * REFATORAÇÃO: Mongoose (sem prisma)
   */
  router.get('/geographic', (req, res) => zeladoriaController.geographic(req, res));
  
  return router;
}

