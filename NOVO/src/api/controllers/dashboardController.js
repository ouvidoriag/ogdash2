/**
 * Controller para /api/dashboard-data
 * Endpoint centralizado de dados do dashboard
 * Retorna todos os datasets fundamentais pré-agregados em uma única requisição
 */

import { withCache } from '../../utils/responseHelper.js';
import { optimizedGroupByMonth } from '../../utils/queryOptimizer.js';
import { getDataCriacao } from '../../utils/dateUtils.js';

/**
 * GET /api/dashboard-data
 */
export async function getDashboardData(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const key = servidor ? `dashboardData:servidor:${servidor}:v1` :
              unidadeCadastro ? `dashboardData:uac:${unidadeCadastro}:v1` :
              'dashboardData:v1';
  
  // Cache de 5 minutos para dados agregados
  return withCache(key, 300, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    try {
      // Executar todas as agregações em paralelo para máxima performance
      const [
        total,
        byStatus,
        byMonth,
        byDay,
        byTheme,
        bySubject,
        byOrgaos,
        bySecretaria
      ] = await Promise.all([
        // Total geral
        prisma.record.count({ where }),
        
        // Por status
        prisma.record.groupBy({ 
          by: ['status'], 
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { _all: true } 
        }),
        
        // Por mês (usar função otimizada)
        optimizedGroupByMonth(prisma, where, { dateFilter: true, limit: 24 }),
        
        // Por dia (últimos 30 dias)
        (async () => {
          const today = new Date();
          const d30 = new Date(today);
          d30.setDate(today.getDate() - 29);
          const last30Str = d30.toISOString().slice(0, 10);
          const todayStr = today.toISOString().slice(0, 10);
          
          const whereDate = {
            ...where,
            dataCriacaoIso: { gte: last30Str, lte: todayStr }
          };
          
          const rows = await prisma.record.findMany({
            where: whereDate,
            select: { dataCriacaoIso: true, dataDaCriacao: true, data: true },
            take: 50000
          });
          
          const dayMap = new Map();
          for (const r of rows) {
            const dataCriacao = getDataCriacao(r);
            if (dataCriacao) {
              dayMap.set(dataCriacao, (dayMap.get(dataCriacao) || 0) + 1);
            }
          }
          
          return Array.from(dayMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        })(),
        
        // Por tema
        prisma.record.groupBy({
          by: ['tema'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { _all: true }
        }),
        
        // Por assunto
        prisma.record.groupBy({
          by: ['assunto'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { _all: true }
        }),
        
        // Por órgãos
        prisma.record.groupBy({
          by: ['orgaos'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { _all: true }
        }),
        
        // Por secretaria (usar mesmo campo orgaos - secretarias são órgãos)
        prisma.record.groupBy({
          by: ['orgaos'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { _all: true }
        })
      ]);
      
      // Calcular últimos 7 e 30 dias
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const d7 = new Date(today);
      d7.setDate(today.getDate() - 6);
      const last7Str = d7.toISOString().slice(0, 10);
      const d30 = new Date(today);
      d30.setDate(today.getDate() - 29);
      const last30Str = d30.toISOString().slice(0, 10);
      
      const [last7Days, last30Days] = await Promise.all([
        prisma.record.count({
          where: {
            ...where,
            dataCriacaoIso: { gte: last7Str, lte: todayStr }
          }
        }),
        prisma.record.count({
          where: {
            ...where,
            dataCriacaoIso: { gte: last30Str, lte: todayStr }
          }
        })
      ]);
      
      // Transformar dados para formato esperado pelo frontend
      return {
        totalManifestations: total,
        last7Days,
        last30Days,
        manifestationsByMonth: byMonth.map(m => ({
          month: m.ym,
          count: m.count
        })),
        manifestationsByDay: byDay,
        manifestationsByStatus: byStatus.map(s => ({
          status: s.status ?? 'Não informado',
          count: s._count._all
        })),
        manifestationsByTheme: byTheme.map(t => ({
          theme: t.tema ?? 'Não informado',
          count: t._count._all
        })).sort((a, b) => b.count - a.count),
        manifestationsBySubject: bySubject.map(s => ({
          subject: s.assunto ?? 'Não informado',
          count: s._count._all
        })).sort((a, b) => b.count - a.count),
        manifestationsByOrgan: byOrgaos.map(o => ({
          organ: o.orgaos ?? 'Não informado',
          count: o._count._all
        })).sort((a, b) => b.count - a.count),
        manifestationsBySecretaria: bySecretaria.map(s => ({
          secretaria: s.orgaos ?? 'Não informado',
          count: s._count._all
        })).sort((a, b) => b.count - a.count)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }, prisma);
}
