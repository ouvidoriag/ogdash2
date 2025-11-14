/**
 * Controller para /api/summary
 * Summary KPIs e insights críticos
 */

import { withCache } from '../../utils/responseHelper.js';
import { optimizedGroupBy } from '../../utils/queryOptimizer.js';
import { getDataCriacao } from '../../utils/dateUtils.js';

/**
 * Calcular últimos 7 e 30 dias com fallback robusto
 */
async function calculateLastDays(prisma, where, todayStr, last7Str, last30Str) {
  let last7 = 0;
  let last30 = 0;
  
  try {
    // OTIMIZAÇÃO: Usar count do Prisma com filtro de data (muito mais rápido)
    const whereLast7 = {
      ...where,
      dataCriacaoIso: {
        gte: last7Str,
        lte: todayStr
      }
    };
    
    const whereLast30 = {
      ...where,
      dataCriacaoIso: {
        gte: last30Str,
        lte: todayStr
      }
    };
    
    // Executar contagens em paralelo
    [last7, last30] = await Promise.all([
      prisma.record.count({ where: whereLast7 }),
      prisma.record.count({ where: whereLast30 })
    ]);
    
    console.log(`✅ Resultado (agregação no banco): últimos 7 dias=${last7}, últimos 30 dias=${last30}`);
    
    // Se ainda está zerado, usar método alternativo baseado em dataDaCriacao
    if (last7 === 0 && last30 === 0) {
      console.log('⚠️ Contagem com dataCriacaoIso retornou 0, tentando com dataDaCriacao...');
      
      const today = new Date();
      const recentRecords = await prisma.record.findMany({
        where: {
          ...where,
          dataDaCriacao: { not: null },
          OR: [
            { dataDaCriacao: { contains: today.getFullYear().toString() } },
            { dataDaCriacao: { contains: (today.getFullYear() - 1).toString() } }
          ]
        },
        select: {
          dataCriacaoIso: true,
          dataDaCriacao: true,
          data: true
        },
        take: 100000
      });
      
      console.log(`📊 Processando ${recentRecords.length} registros com getDataCriacao()...`);
      
      last7 = 0;
      last30 = 0;
      
      for (const r of recentRecords) {
        const dataCriacao = getDataCriacao(r);
        if (!dataCriacao) continue;
        
        if (dataCriacao >= last7Str && dataCriacao <= todayStr) {
          last7++;
        }
        if (dataCriacao >= last30Str && dataCriacao <= todayStr) {
          last30++;
        }
      }
      
      console.log(`✅ Resultado (método alternativo): últimos 7 dias=${last7}, últimos 30 dias=${last30}`);
    }
  } catch (error) {
    console.error('❌ Erro ao calcular últimos 7 e 30 dias:', error);
    last7 = 0;
    last30 = 0;
  }
  
  return { last7, last30 };
}

/**
 * Obter top dimensões
 */
async function getTopDimensions(prisma, where) {
  const top = async (col) => {
    const rows = await prisma.record.groupBy({ 
      by: [col], 
      where: Object.keys(where).length > 0 ? where : undefined,
      _count: { _all: true } 
    });
    return rows.map(r => ({ key: r[col] ?? 'Não informado', count: r._count._all }))
      .sort((a,b) => b.count - a.count).slice(0,10);
  };
  
  const [topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema] = await Promise.all([
    top('orgaos'), 
    top('unidadeCadastro'), 
    top('tipoDeManifestacao'), 
    top('tema')
  ]);
  
  return { topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema };
}

/**
 * GET /api/summary
 */
export async function getSummary(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const key = servidor ? `summary:servidor:${servidor}:v1` :
              unidadeCadastro ? `summary:uac:${unidadeCadastro}:v1` :
              'summary:v1';
  
  // Cache de 1 hora para dados que mudam pouco
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Totais
    const total = await prisma.record.count({ where });

    // Por status (normalizado)
    const byStatus = await prisma.record.groupBy({ 
      by: ['status'], 
      where: Object.keys(where).length > 0 ? where : undefined,
      _count: { _all: true } 
    });
    const statusCounts = byStatus.map(r => ({ status: r.status ?? 'Não informado', count: r._count._all }))
      .sort((a,b) => b.count - a.count);

    // Últimos 7 e 30 dias - OTIMIZADO: usar agregação no banco
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const d7 = new Date(today);
    d7.setDate(today.getDate() - 6);
    const last7Str = d7.toISOString().slice(0, 10);
    const d30 = new Date(today);
    d30.setDate(today.getDate() - 29);
    const last30Str = d30.toISOString().slice(0, 10);
    
    console.log(`📅 Calculando últimos 7 e 30 dias: hoje=${todayStr}, últimos 7 dias de ${last7Str} até ${todayStr}, últimos 30 dias de ${last30Str} até ${todayStr}`);
    
    const { last7, last30 } = await calculateLastDays(prisma, where, todayStr, last7Str, last30Str);
    
    // Top dimensões normalizadas
    const { topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema } = await getTopDimensions(prisma, where);

    return { total, last7, last30, statusCounts, topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema };
  }, prisma);
}
