/**
 * Rotas de dados gerais
 * Endpoints principais para acesso a dados do sistema
 * 
 * Endpoints:
 * - GET /api/summary - Resumo geral com KPIs
 * - GET /api/dashboard-data - Dados completos para dashboard
 * - GET /api/records - Lista paginada de registros
 * - GET /api/distinct - Valores distintos de um campo
 * - GET /api/unit/:unitName - Dados de uma unidade específica
 * - GET /api/complaints-denunciations - Reclamações e denúncias
 * - GET /api/sla/summary - Resumo de SLA (concluídos, verde, amarelo, vermelho)
 * - POST /api/filter - Filtro dinâmico de registros
 * - GET /api/meta/aliases - Metadados e aliases de campos
 * - POST /api/chat/reindex - Reindexar contexto do chat
 * - GET /api/export/database - Exportar dados do banco
 * 
 * @param {PrismaClient} prisma - Cliente Prisma
 * @param {Function} getMongoClient - Função para obter cliente MongoDB
 * @returns {express.Router} Router configurado
 */

import express from 'express';
import { getSummary } from '../controllers/summaryController.js';
import { getDashboardData } from '../controllers/dashboardController.js';
import { getRecords } from '../controllers/recordsController.js';
import { getDistinct } from '../controllers/distinctController.js';
import { getUnit } from '../controllers/unitController.js';
import { getComplaints } from '../controllers/complaintsController.js';
import { slaSummary } from '../controllers/slaController.js';
import { filterRecords } from '../controllers/filterController.js';
import { getMetaAliases, reindexChat, exportDatabase } from '../controllers/utilsController.js';

export default function dataRoutes(prisma, getMongoClient) {
  const router = express.Router();
  
  /**
   * GET /api/summary
   * Resumo geral com KPIs principais
   * Query params: servidor, unidadeCadastro
   */
  router.get('/summary', (req, res) => getSummary(req, res, prisma));
  
  /**
   * GET /api/dashboard-data
   * Dados completos para dashboard (agregações paralelas)
   * Query params: servidor, unidadeCadastro
   */
  router.get('/dashboard-data', (req, res) => getDashboardData(req, res, prisma));
  
  /**
   * GET /api/records
   * Lista paginada de registros
   * Query params: page, limit, servidor, unidadeCadastro
   */
  router.get('/records', (req, res) => getRecords(req, res, prisma));
  
  /**
   * GET /api/distinct
   * Valores distintos de um campo
   * Query params: field, servidor, unidadeCadastro
   */
  router.get('/distinct', (req, res) => getDistinct(req, res, prisma));
  
  /**
   * GET /api/unit/:unitName
   * Dados de uma unidade específica (UAC, Responsável, Órgãos, Unidade de Saúde)
   * Params: unitName - Nome da unidade
   */
  router.get('/unit/:unitName', (req, res) => getUnit(req, res, prisma));
  
  /**
   * GET /api/complaints-denunciations
   * Reclamações e denúncias agregadas
   */
  router.get('/complaints-denunciations', (req, res) => getComplaints(req, res, prisma));
  
  /**
   * GET /api/sla/summary
   * Resumo de SLA (concluídos, verde claro 0-30, amarelo 31-60, vermelho 61+)
   * Query params: servidor, unidadeCadastro, meses
   */
  router.get('/sla/summary', (req, res) => slaSummary(req, res, prisma));
  
  /**
   * POST /api/filter
   * Filtro dinâmico de registros
   * Body: { filters: [{ field, op, value }], originalUrl }
   */
  router.post('/filter', (req, res) => filterRecords(req, res, prisma));
  
  /**
   * GET /api/meta/aliases
   * Metadados e aliases de campos do sistema
   */
  router.get('/meta/aliases', (req, res) => getMetaAliases(req, res, prisma));
  
  /**
   * POST /api/chat/reindex
   * Reindexar contexto do chat para busca semântica
   */
  router.post('/chat/reindex', (req, res) => reindexChat(req, res, prisma));
  
  /**
   * GET /api/export/database
   * Exportar dados do banco de dados
   */
  router.get('/export/database', (req, res) => exportDatabase(req, res, prisma));
  
  return router;
}

