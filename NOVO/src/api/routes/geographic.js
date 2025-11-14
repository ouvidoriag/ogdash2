/**
 * Rotas geográficas
 * Endpoints para dados geográficos: secretarias, distritos, bairros, unidades de saúde
 * 
 * Endpoints:
 * Secretarias:
 * - GET /api/secretarias - Listar todas secretarias
 * - GET /api/secretarias/:district - Secretarias por distrito
 * 
 * Distritos:
 * - GET /api/distritos - Listar todos distritos
 * - GET /api/distritos/:code - Distrito por código
 * - GET /api/distritos/:code/stats - Estatísticas de distrito
 * 
 * Bairros:
 * - GET /api/bairros - Listar bairros (com filtro opcional por distrito)
 * 
 * Unidades de Saúde:
 * - GET /api/unidades-saude - Listar unidades (com filtros: distrito, tipo, bairro)
 * - GET /api/unidades-saude/por-distrito - Agrupar por distrito
 * - GET /api/unidades-saude/por-bairro - Agrupar por bairro
 * - GET /api/unidades-saude/por-tipo - Agrupar por tipo
 * 
 * Saúde:
 * - GET /api/saude/manifestacoes - Manifestações relacionadas a saúde
 * - GET /api/saude/por-distrito - Saúde por distrito
 * - GET /api/saude/por-tema - Saúde por tema
 * - GET /api/saude/por-unidade - Saúde por unidade
 * 
 * Debug:
 * - GET /api/debug/district-mapping - Testar mapeamento de endereços
 * - POST /api/debug/district-mapping-batch - Testar mapeamento em lote
 * 
 * @param {PrismaClient} prisma - Cliente Prisma
 * @returns {express.Router} Router configurado
 */

import express from 'express';
import * as geographicController from '../controllers/geographicController.js';

export default function geographicRoutes(prisma) {
  const router = express.Router();
  
  // ========== SECRETARIAS ==========
  
  /**
   * GET /api/secretarias
   * Listar todas as secretarias
   */
  router.get('/secretarias', (req, res) => geographicController.getSecretarias(req, res, prisma));
  
  /**
   * GET /api/secretarias/:district
   * Secretarias filtradas por distrito
   * Params: district - Nome ou código do distrito
   */
  router.get('/secretarias/:district', (req, res) => geographicController.getSecretariasByDistrict(req, res, prisma));
  
  // ========== DISTRITOS ==========
  
  /**
   * GET /api/distritos
   * Listar todos os distritos com estatísticas
   */
  router.get('/distritos', (req, res) => geographicController.getDistritos(req, res, prisma));
  
  /**
   * GET /api/distritos/:code
   * Informações de um distrito específico
   * Params: code - Código do distrito
   */
  router.get('/distritos/:code', (req, res) => geographicController.getDistritoByCode(req, res, prisma));
  
  /**
   * GET /api/distritos/:code/stats
   * Estatísticas detalhadas de um distrito
   * Params: code - Código do distrito
   */
  router.get('/distritos/:code/stats', (req, res) => geographicController.getDistritoStats(req, res, prisma));
  
  // ========== BAIRROS ==========
  
  /**
   * GET /api/bairros
   * Listar bairros
   * Query params: distrito (opcional) - Filtrar por distrito
   */
  router.get('/bairros', (req, res) => geographicController.getBairros(req, res, prisma));
  
  // ========== UNIDADES DE SAÚDE ==========
  
  /**
   * GET /api/unidades-saude
   * Listar unidades de saúde
   * Query params: distrito, tipo, bairro (opcionais)
   */
  router.get('/unidades-saude', (req, res) => geographicController.getUnidadesSaude(req, res, prisma));
  
  /**
   * GET /api/unidades-saude/por-distrito
   * Agrupar unidades de saúde por distrito
   */
  router.get('/unidades-saude/por-distrito', (req, res) => geographicController.getUnidadesSaudeByDistrito(req, res, prisma));
  
  /**
   * GET /api/unidades-saude/por-bairro
   * Agrupar unidades de saúde por bairro
   * Query params: distrito (opcional) - Filtrar por distrito
   */
  router.get('/unidades-saude/por-bairro', (req, res) => geographicController.getUnidadesSaudeByBairro(req, res, prisma));
  
  /**
   * GET /api/unidades-saude/por-tipo
   * Agrupar unidades de saúde por tipo
   */
  router.get('/unidades-saude/por-tipo', (req, res) => geographicController.getUnidadesSaudeByTipo(req, res, prisma));
  
  // ========== SAÚDE ==========
  
  /**
   * GET /api/saude/manifestacoes
   * Manifestações relacionadas a saúde
   */
  router.get('/saude/manifestacoes', (req, res) => geographicController.getSaudeManifestacoes(req, res, prisma));
  
  /**
   * GET /api/saude/por-distrito
   * Manifestações de saúde agrupadas por distrito
   */
  router.get('/saude/por-distrito', (req, res) => geographicController.getSaudePorDistrito(req, res, prisma));
  
  /**
   * GET /api/saude/por-tema
   * Manifestações de saúde agrupadas por tema
   */
  router.get('/saude/por-tema', (req, res) => geographicController.getSaudePorTema(req, res, prisma));
  
  /**
   * GET /api/saude/por-unidade
   * Manifestações de saúde agrupadas por unidade
   */
  router.get('/saude/por-unidade', (req, res) => geographicController.getSaudePorUnidade(req, res, prisma));
  
  // ========== DEBUG ==========
  
  /**
   * GET /api/debug/district-mapping
   * Testar mapeamento de endereço para distrito
   * Query params: endereco (obrigatório)
   */
  router.get('/debug/district-mapping', (req, res) => geographicController.debugDistrictMapping(req, res, prisma));
  
  /**
   * POST /api/debug/district-mapping-batch
   * Testar mapeamento de múltiplos endereços
   * Body: { enderecos: string[] }
   */
  router.post('/debug/district-mapping-batch', (req, res) => geographicController.debugDistrictMappingBatch(req, res, prisma));
  
  return router;
}

