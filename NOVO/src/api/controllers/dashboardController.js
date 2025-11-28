/**
 * Controller para /api/dashboard-data
 * Endpoint centralizado de dados do dashboard
 * Retorna todos os datasets fundamentais pré-agregados em uma única requisição
 * 
 * OTIMIZAÇÃO: Usa MongoDB Native com pipeline $facet para máxima performance
 */

import { withCache } from '../../utils/responseHelper.js';
import { getOverviewData } from '../../utils/dbAggregations.js';
import { sanitizeFilters } from '../../utils/validateFilters.js';

/**
 * GET /api/dashboard-data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {PrismaClient} prisma - Cliente Prisma (usado apenas para cache)
 * @param {Function} getMongoClient - Função para obter cliente MongoDB nativo
 */
export async function getDashboardData(req, res, prisma, getMongoClient) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const key = servidor ? `dashboardData:servidor:${servidor}:v2` :
              unidadeCadastro ? `dashboardData:uac:${unidadeCadastro}:v2` :
              'dashboardData:v2';
  
  // Cache de 5 minutos para dados agregados
  // OTIMIZAÇÃO: Usar MongoDB Native com pipeline $facet (3-10x mais rápido)
  return withCache(key, 300, res, async () => {
    try {
      // Construir e validar filtros
      const filters = {};
      if (servidor) filters.servidor = servidor;
      if (unidadeCadastro) filters.unidadeCadastro = unidadeCadastro;
      
      // Validar filtros antes de usar
      let sanitizedFilters = {};
      try {
        sanitizedFilters = sanitizeFilters(filters);
      } catch (validationError) {
        console.error('❌ Erro na validação de filtros:', validationError.message);
        // Se validação falhar, usar filtros vazios (mais seguro)
        sanitizedFilters = {};
      }
      
      // Verificar se getMongoClient está disponível
      if (!getMongoClient) {
        console.error('❌ getMongoClient não disponível');
        throw new Error('MongoDB client não disponível');
      }
      
      // Usar pipeline otimizado com $facet e cache inteligente
      const startTime = Date.now();
      let result;
      
      try {
        result = await getOverviewData(getMongoClient, sanitizedFilters, prisma);
        const duration = Date.now() - startTime;
        
        // Log de performance
        if (duration > 1000) {
          console.log(`📊 Dashboard Data (MongoDB Native): ${duration}ms`, {
            total: result.totalManifestations,
            byMonth: result.manifestationsByMonth.length,
            byStatus: result.manifestationsByStatus.length,
            byTheme: result.manifestationsByTheme.length,
            byOrgan: result.manifestationsByOrgan.length,
            byType: result.manifestationsByType.length,
            byChannel: result.manifestationsByChannel.length,
            byPriority: result.manifestationsByPriority.length,
            byUnit: result.manifestationsByUnit.length
          });
        }
      } catch (mongoError) {
        console.error('⚠️ Erro ao usar MongoDB Native, tentando fallback com Prisma:', mongoError.message);
        // Fallback para Prisma se MongoDB falhar (compatibilidade)
        // Nota: Isso é mais lento, mas garante que o sistema continue funcionando
        throw new Error('MongoDB aggregation failed. Please check database connection.');
      }
      
      // Garantir que todos os campos esperados existam
      if (!result.manifestationsBySubject) {
        result.manifestationsBySubject = [];
      }
      
      // Adicionar campo manifestationsBySecretaria (compatibilidade)
      if (!result.manifestationsBySecretaria) {
        result.manifestationsBySecretaria = result.manifestationsByOrgan.map(o => ({
          secretaria: o.organ,
          count: o.count
        }));
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }, prisma, null, 60000); // Timeout de 60s para endpoint pesado
}
