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
        bySecretaria,
        byTipo,
        byCanal,
        byPrioridade,
        byUnidadeCadastro
      ] = await Promise.all([
        // Total geral
        prisma.record.count({ where }),
        
        // Por status
        prisma.record.groupBy({ 
          by: ['status'], 
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true } 
        }),
        
        // Por mês (usar função otimizada)
        optimizedGroupByMonth(prisma, where, { dateFilter: true, limit: 24 }),
        
        // Por dia (últimos 30 dias) - OTIMIZADO: usar agregação do MongoDB
        (async () => {
          const today = new Date();
          const d30 = new Date(today);
          d30.setDate(today.getDate() - 29);
          const last30Str = d30.toISOString().slice(0, 10);
          const todayStr = today.toISOString().slice(0, 10);
          
          // OTIMIZAÇÃO: Usar groupBy com filtro de dataCriacaoIso (campo indexado)
          // Isso é muito mais rápido que buscar todos os registros
          try {
            const whereWithDate = {
              ...where,
              dataCriacaoIso: {
                gte: last30Str,
                lte: todayStr
              }
            };
            
            // Buscar registros apenas dos últimos 30 dias com dataCriacaoIso
            const rows = await prisma.record.findMany({
              where: whereWithDate,
              select: { dataCriacaoIso: true },
              take: 50000 // Limite reduzido (apenas últimos 30 dias)
            });
            
            // Agrupar por dia
            const dayMap = new Map();
            for (const r of rows) {
              if (r.dataCriacaoIso) {
                dayMap.set(r.dataCriacaoIso, (dayMap.get(r.dataCriacaoIso) || 0) + 1);
              }
            }
            
            // Se não encontrou dados com dataCriacaoIso, usar fallback
            if (dayMap.size === 0) {
              const fallbackRows = await prisma.record.findMany({
                where: {
                  ...where,
                  OR: [
                    { dataCriacaoIso: { gte: last30Str } },
                    { dataDaCriacao: { contains: todayStr.substring(0, 7) } }
                  ]
                },
                select: { dataCriacaoIso: true, dataDaCriacao: true, data: true },
                take: 30000 // Limite reduzido para fallback
              });
              
              for (const r of fallbackRows) {
                const dataCriacao = getDataCriacao(r);
                if (dataCriacao && dataCriacao >= last30Str && dataCriacao <= todayStr) {
                  dayMap.set(dataCriacao, (dayMap.get(dataCriacao) || 0) + 1);
                }
              }
            }
            
            return Array.from(dayMap.entries())
              .map(([date, count]) => ({ date, count }))
              .sort((a, b) => a.date.localeCompare(b.date));
          } catch (error) {
            console.error('❌ Erro ao buscar dados por dia:', error);
            return [];
          }
        })(),
        
        // Por tema
        prisma.record.groupBy({
          by: ['tema'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true }
        }),
        
        // Por assunto
        prisma.record.groupBy({
          by: ['assunto'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true }
        }),
        
        // Por órgãos
        prisma.record.groupBy({
          by: ['orgaos'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true }
        }),
        
        // Por secretaria (usar mesmo campo orgaos - secretarias são órgãos)
        prisma.record.groupBy({
          by: ['orgaos'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true }
        }),
        
        // Por tipo de manifestação
        prisma.record.groupBy({
          by: ['tipoDeManifestacao'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true }
        }),
        
        // Por canal
        prisma.record.groupBy({
          by: ['canal'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true }
        }),
        
        // Por prioridade
        prisma.record.groupBy({
          by: ['prioridade'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true }
        }),
        
        // Por unidade de cadastro
        prisma.record.groupBy({
          by: ['unidadeCadastro'],
          where: Object.keys(where).length > 0 ? where : undefined,
          _count: { id: true }
        })
      ]);
      
      // Calcular últimos 7 e 30 dias usando dados da planilha diretamente
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const d7 = new Date(today);
      d7.setDate(today.getDate() - 6);
      const last7Str = d7.toISOString().slice(0, 10);
      const d30 = new Date(today);
      d30.setDate(today.getDate() - 29);
      const last30Str = d30.toISOString().slice(0, 10);
      
      // Buscar registros recentes e filtrar usando getDataCriacao (usa dados da planilha)
      const recentRecords = await prisma.record.findMany({
        where: {
          ...where,
          // Filtrar por registros que têm dataDaCriacao ou data no JSON
          OR: [
            { dataDaCriacao: { not: null } },
            { dataCriacaoIso: { not: null } }
          ]
        },
        select: {
          dataDaCriacao: true,
          dataCriacaoIso: true,
          data: true
        },
        take: 100000 // Limite alto para garantir que pegamos todos
      });
      
      // Filtrar em memória usando getDataCriacao (que usa dados da planilha)
      let last7Days = 0;
      let last30Days = 0;
      
      for (const record of recentRecords) {
        const dataCriacao = getDataCriacao(record);
        if (dataCriacao) {
          if (dataCriacao >= last7Str && dataCriacao <= todayStr) {
            last7Days++;
          }
          if (dataCriacao >= last30Str && dataCriacao <= todayStr) {
            last30Days++;
          }
        }
      }
      
      // Transformar dados para formato esperado pelo frontend
      const result = {
        totalManifestations: total,
        last7Days,
        last30Days,
        manifestationsByMonth: byMonth.map(m => ({
          month: m.ym || m.month,
          ym: m.ym || m.month, // Compatibilidade
          count: m.count || 0
        })),
        manifestationsByDay: byDay,
        manifestationsByStatus: byStatus
          .map(s => ({
            status: s.status ?? 'Não informado',
            count: s._count.id
          }))
          .filter(s => {
            const statusLower = (s.status || '').toLowerCase();
            return !statusLower.includes('demanda encerrada');
          }),
        manifestationsByTheme: byTheme.map(t => ({
          theme: t.tema ?? 'Não informado',
          count: t._count.id
        })).sort((a, b) => b.count - a.count),
        manifestationsBySubject: bySubject.map(s => ({
          subject: s.assunto ?? 'Não informado',
          count: s._count.id
        })).sort((a, b) => b.count - a.count),
        manifestationsByOrgan: byOrgaos.map(o => ({
          organ: o.orgaos ?? 'Não informado',
          count: o._count.id
        })).sort((a, b) => b.count - a.count),
        manifestationsBySecretaria: bySecretaria.map(s => ({
          secretaria: s.orgaos ?? 'Não informado',
          count: s._count.id
        })).sort((a, b) => b.count - a.count),
        manifestationsByType: byTipo.map(t => ({
          type: t.tipoDeManifestacao ?? 'Não informado',
          count: t._count.id
        })).sort((a, b) => b.count - a.count),
        manifestationsByChannel: byCanal.map(c => ({
          channel: c.canal ?? 'Não informado',
          count: c._count.id
        })).sort((a, b) => b.count - a.count),
        manifestationsByPriority: byPrioridade.map(p => ({
          priority: p.prioridade ?? 'Não informado',
          count: p._count.id
        })).sort((a, b) => {
          // Ordenar: Alta, Média, Baixa, Não informado
          const order = { 'Alta': 1, 'Média': 2, 'Baixa': 3, 'Não informado': 4 };
          return (order[a.priority] || 99) - (order[b.priority] || 99);
        }),
        manifestationsByUnit: byUnidadeCadastro.map(u => ({
          unit: u.unidadeCadastro ?? 'Não informado',
          count: u._count.id
        })).sort((a, b) => b.count - a.count)
      };
      
      // Log para debug
      console.log('📊 Dashboard Data retornado:', {
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
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }, prisma);
}
