/**
 * Controllers de Agregação
 * /api/aggregate/*
 */

import { withCache } from '../../utils/responseHelper.js';
import { optimizedGroupBy, optimizedGroupByMonth, getDateFilter } from '../../utils/queryOptimizer.js';
import { getNormalizedField } from '../../utils/fieldMapper.js';
import { getDataCriacao } from '../../utils/dateUtils.js';

/**
 * GET /api/aggregate/count-by
 * Contagem por campo
 */
export async function countBy(req, res, prisma) {
  const field = String(req.query.field ?? '').trim();
  if (!field) {
    return res.status(400).json({ error: 'field required' });
  }
  
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `countBy:${field}:servidor:${servidor}:v2` :
                    unidadeCadastro ? `countBy:${field}:uac:${unidadeCadastro}:v2` :
                    `countBy:${field}:v2`;
  
  // Cache de 1 hora para agregações
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // OTIMIZAÇÃO: Usar sistema otimizado de agregação (groupBy do Prisma)
    const col = getNormalizedField(field);
    if (col) {
      // Agregar direto no banco (com filtro se houver)
      const rows = await prisma.record.groupBy({ 
        by: [col], 
        where: Object.keys(where).length > 0 ? where : undefined,
        _count: { _all: true } 
      });
      return rows.map(r => ({ key: r[col] ?? 'Não informado', count: r._count._all }))
        .sort((a, b) => b.count - a.count);
    }

    // Fallback: agrega pelo JSON caso campo não esteja normalizado
    const rows = await prisma.record.findMany({ 
      where: Object.keys(where).length > 0 ? where : undefined,
      select: { data: true } 
    });
    const map = new Map();
    for (const r of rows) {
      const dat = r.data || {};
      const key = dat?.[field] ?? dat?.[field.toLowerCase()] ?? dat?.[field.replace(/\s+/g, '_')] ?? 'Não informado';
      const k = `${key}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  }, prisma);
}

/**
 * GET /api/aggregate/time-series
 * Série temporal por campo de data
 */
export async function timeSeries(req, res, prisma) {
  const field = String(req.query.field ?? '').trim();
  if (!field) {
    return res.status(400).json({ error: 'field required' });
  }

  const cacheKey = `ts:${field}`;
  // Cache de 1 hora para séries temporais
  return withCache(cacheKey, 3600, res, async () => {
    // Se pediram Data, usar sistema global de datas
    if (field === 'Data' || field === 'data_da_criacao') {
      const dateFilter = getDateFilter();
      
      try {
        // Usar groupBy no campo dataCriacaoIso (muito mais rápido)
        const results = await prisma.record.groupBy({
          by: ['dataCriacaoIso'],
          where: {
            dataCriacaoIso: { not: null },
            ...dateFilter
          },
          _count: { _all: true },
          orderBy: {
            dataCriacaoIso: 'asc'
          }
        });
        
        return results
          .filter(r => r.dataCriacaoIso)
          .map(r => ({ date: r.dataCriacaoIso, count: r._count._all }))
          .sort((a, b) => a.date.localeCompare(b.date));
      } catch (error) {
        // Fallback: processar em memória
        console.warn('⚠️ groupBy falhou para time-series, usando fallback:', error.message);
        const rows = await prisma.record.findMany({
          where: { 
            dataDaCriacao: { not: null },
            ...dateFilter
          },
          select: {
            dataCriacaoIso: true,
            dataDaCriacao: true,
            data: true
          },
          take: 100000
        });
        
        const map = new Map();
        for (const r of rows) {
          const dataCriacao = getDataCriacao(r);
          if (dataCriacao) {
            map.set(dataCriacao, (map.get(dataCriacao) || 0) + 1);
          }
        }
        
        return Array.from(map.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    }
    
    // Para outros campos, usar método genérico
    return [];
  }, prisma);
}

/**
 * GET /api/aggregate/by-theme
 * Agregação por tema
 */
export async function byTheme(req, res, prisma) {
  const key = 'byTheme:v2';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const rows = await prisma.record.groupBy({ by: ['tema'], _count: { _all: true } });
    return rows
      .map(r => ({ tema: r.tema ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, prisma);
}

/**
 * GET /api/aggregate/by-subject
 * Agregação por assunto
 */
export async function bySubject(req, res, prisma) {
  const key = 'bySubject:v2';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const rows = await prisma.record.groupBy({ by: ['assunto'], _count: { _all: true } });
    return rows
      .map(r => ({ assunto: r.assunto ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, prisma);
}

/**
 * GET /api/aggregate/by-server
 * Agregação por servidor/cadastrante
 */
export async function byServer(req, res, prisma) {
  const unidadeCadastro = req.query.unidadeCadastro;
  const cacheKey = unidadeCadastro ? `byServer:uac:${unidadeCadastro}:v2` : 'byServer:v2';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = unidadeCadastro ? { unidadeCadastro } : {};
    const rows = await prisma.record.groupBy({ 
      by: ['servidor'],
      where,
      _count: { _all: true } 
    });
    return rows
      .map(r => ({ servidor: r.servidor ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, prisma);
}

/**
 * GET /api/aggregate/by-month
 * Agregação por mês
 */
export async function byMonth(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `byMonth:servidor:${servidor}:v2` :
                    unidadeCadastro ? `byMonth:uac:${unidadeCadastro}:v2` :
                    'byMonth:v2';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Usar função otimizada
    const results = await optimizedGroupByMonth(prisma, where, { dateFilter: true, limit: 24 });
    
    return results.map(r => ({
      month: r.ym,
      count: r.count
    }));
  }, prisma);
}

/**
 * GET /api/aggregate/by-day
 * Agregação por dia (últimos 30 dias)
 */
export async function byDay(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `byDay:servidor:${servidor}:v2` :
                    unidadeCadastro ? `byDay:uac:${unidadeCadastro}:v2` :
                    'byDay:v2';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
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
  }, prisma);
}

/**
 * GET /api/aggregate/heatmap
 * Heatmap por mês x dimensão
 */
export async function heatmap(req, res, prisma) {
  const dimReq = String(req.query.dim ?? 'Categoria');
  const cacheKey = `heatmap:${dimReq}:v2`;
  
  return withCache(cacheKey, 3600, res, async () => {
    const col = getNormalizedField(dimReq);
    if (!col) {
      return res.status(400).json({ error: 'dim must be one of Secretaria, Setor, Tipo, Categoria, Bairro, Status, UAC, Responsavel, Canal, Prioridade' });
    }

    // Construir últimos 12 meses como labels YYYY-MM
    const labels = [];
    const today = new Date();
    const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
      const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      labels.push(ym);
    }

    // Filtrar apenas últimos 24 meses
    const todayForHeatmap = new Date();
    const twoYearsAgo = new Date(todayForHeatmap);
    twoYearsAgo.setMonth(todayForHeatmap.getMonth() - 24);
    const minDateStr = twoYearsAgo.toISOString().slice(0, 10);

    const rows = await prisma.record.findMany({ 
      where: { 
        dataDaCriacao: { not: null },
        OR: [
          { dataCriacaoIso: { gte: minDateStr } },
          { dataDaCriacao: { contains: todayForHeatmap.getFullYear().toString() } },
          { dataDaCriacao: { contains: (todayForHeatmap.getFullYear() - 1).toString() } }
        ]
      },
      select: { 
        dataCriacaoIso: true,
        dataDaCriacao: true,
        data: true,
        [col]: true 
      },
      take: 100000
    });
    
    const { getMes } = await import('../../utils/dateUtils.js');
    const matrix = new Map();
    for (const r of rows) {
      const mes = getMes(r);
      if (!mes || !labels.includes(mes)) continue;
      const key = r[col] ?? 'Não informado';
      if (!matrix.has(key)) matrix.set(key, new Map(labels.map(l => [l, 0])));
      const inner = matrix.get(key);
      inner.set(mes, (inner.get(mes) ?? 0) + 1);
    }

    // Selecionar top 10 chaves pelo total
    const totals = Array.from(matrix.entries()).map(([k, m]) => ({ key: k, total: Array.from(m.values()).reduce((a,b)=>a+b,0) }));
    totals.sort((a,b)=>b.total - a.total);
    const topKeys = totals.slice(0, 10).map(x=>x.key);

    const data = topKeys.map(k => ({ key: k, values: labels.map(ym => matrix.get(k)?.get(ym) ?? 0) }));
    return { labels, rows: data };
  }, prisma);
}

/**
 * GET /api/aggregate/filtered
 * Dados filtrados por servidor ou unidade
 */
export async function filtered(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  if (!servidor && !unidadeCadastro) {
    return res.status(400).json({ error: 'servidor ou unidadeCadastro required' });
  }
  
  const cacheKey = servidor ? `filtered:servidor:${servidor}:v1` : 
                    `filtered:uac:${unidadeCadastro}:v1`;
  
  return withCache(cacheKey, 300, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    const total = await prisma.record.count({ where });
    
    // Dados por mês
    const rows = await prisma.record.findMany({ 
      where: { ...where, dataDaCriacao: { not: null } },
      select: { 
        dataCriacaoIso: true,
        dataDaCriacao: true,
        data: true
      } 
    });
    
    const { getMes } = await import('../../utils/dateUtils.js');
    const monthMap = new Map();
    for (const r of rows) {
      const mes = getMes(r);
      if (!mes) continue;
      monthMap.set(mes, (monthMap.get(mes) ?? 0) + 1);
    }
    const byMonth = Array.from(monthMap.entries()).map(([ym, count]) => ({ ym, count }))
      .sort((a,b) => a.ym.localeCompare(b.ym)).slice(-12);
    
    // Executar agregações em paralelo
    const [temas, assuntos, status, uacs] = await Promise.all([
      prisma.record.groupBy({ by: ['tema'], where, _count: { _all: true } }),
      prisma.record.groupBy({ by: ['assunto'], where, _count: { _all: true } }),
      prisma.record.groupBy({ by: ['status'], where, _count: { _all: true } }),
      servidor ? prisma.record.groupBy({ by: ['unidadeCadastro'], where: { servidor }, _count: { _all: true } }) : Promise.resolve([])
    ]);
    
    const byTheme = temas.map(r => ({ tema: r.tema ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const bySubject = assuntos.map(r => ({ assunto: r.assunto ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const byStatus = status.map(r => ({ status: r.status ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const unidadesCadastradas = uacs.map(r => ({ unidade: r.unidadeCadastro ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    return {
      total,
      byMonth,
      byTheme,
      bySubject,
      byStatus,
      unidadesCadastradas,
      filter: servidor ? { type: 'servidor', value: servidor } : { type: 'unidadeCadastro', value: unidadeCadastro }
    };
  }, prisma);
}

/**
 * GET /api/aggregate/sankey-flow
 * Dados cruzados para Sankey: Tema → Órgão → Status
 */
export async function sankeyFlow(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `sankey:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `sankey:uac:${unidadeCadastro}:v1` : 
                    'sankey:v1';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Filtrar apenas últimos 24 meses
    const today = new Date();
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setMonth(today.getMonth() - 24);
    const minDateStr = twoYearsAgo.toISOString().slice(0, 10);
    
    where.AND = [
      ...(where.AND || []),
      {
        tema: { not: null },
        orgaos: { not: null },
        status: { not: null },
        OR: [
          { dataCriacaoIso: { gte: minDateStr } },
          { dataDaCriacao: { contains: today.getFullYear().toString() } },
          { dataDaCriacao: { contains: (today.getFullYear() - 1).toString() } }
        ]
      }
    ];
    
    const records = await prisma.record.findMany({
      where,
      select: { tema: true, orgaos: true, status: true },
      take: 100000
    });
    
    // Agrupar por combinações tema-órgão-status
    const flowMap = new Map();
    records.forEach(r => {
      const tema = r.tema || 'Não informado';
      const orgao = r.orgaos || 'Não informado';
      const status = r.status || 'Não informado';
      
      const key1 = `${tema}|${orgao}`;
      flowMap.set(key1, (flowMap.get(key1) || 0) + 1);
      
      const key2 = `${orgao}|${status}`;
      flowMap.set(key2, (flowMap.get(key2) || 0) + 1);
    });
    
    // Contar frequência de cada tema, órgão e status
    const temaCount = new Map();
    const orgaoCount = new Map();
    const statusCount = new Map();
    
    records.forEach(r => {
      const tema = r.tema || 'Não informado';
      const orgao = r.orgaos || 'Não informado';
      const status = r.status || 'Não informado';
      
      temaCount.set(tema, (temaCount.get(tema) || 0) + 1);
      orgaoCount.set(orgao, (orgaoCount.get(orgao) || 0) + 1);
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });
    
    // Top temas, órgãos e status
    const topTemas = Array.from(temaCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tema]) => tema);
    
    const topOrgaos = Array.from(orgaoCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([orgao]) => orgao);
    
    const topStatuses = Array.from(statusCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([status]) => status);
    
    // Criar links apenas para os tops
    const links = [];
    
    topTemas.forEach(tema => {
      topOrgaos.forEach(orgao => {
        const key = `${tema}|${orgao}`;
        const value = flowMap.get(key) || 0;
        if (value > 0) {
          links.push({ source: tema, target: orgao, value, type: 'tema-orgao' });
        }
      });
    });
    
    topOrgaos.forEach(orgao => {
      topStatuses.forEach(status => {
        const key = `${orgao}|${status}`;
        const value = flowMap.get(key) || 0;
        if (value > 0) {
          links.push({ source: orgao, target: status, value, type: 'orgao-status' });
        }
      });
    });
    
    return {
      nodes: {
        temas: topTemas,
        orgaos: topOrgaos,
        statuses: topStatuses
      },
      links: links.filter(l => l.value > 0).sort((a, b) => b.value - a.value)
    };
  }, prisma);
}

/**
 * GET /api/aggregate/count-by-status-mes
 * Status por mês
 */
export async function countByStatusMes(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `statusMes:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `statusMes:uac:${unidadeCadastro}:v1` : 
                    'statusMes:v1';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    const rows = await prisma.record.findMany({ 
      where: { ...where, dataDaCriacao: { not: null } },
      select: { 
        dataCriacaoIso: true,
        dataDaCriacao: true,
        data: true,
        status: true
      } 
    });
    
    const { getMes } = await import('../../utils/dateUtils.js');
    const map = new Map();
    for (const r of rows) {
      const mes = getMes(r);
      const status = r.status || 'Não informado';
      if (!mes) continue;
      
      const key = `${status}|${mes}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    
    return Array.from(map.entries()).map(([key, count]) => {
      const [status, month] = key.split('|');
      return { status, month, count };
    }).sort((a, b) => {
      if (a.month !== b.month) return a.month.localeCompare(b.month);
      return a.status.localeCompare(b.status);
    });
  }, prisma);
}

/**
 * GET /api/aggregate/count-by-orgao-mes
 * Órgão por mês
 */
export async function countByOrgaoMes(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `orgaoMes:servidor:${servidor}:v2` : 
                    unidadeCadastro ? `orgaoMes:uac:${unidadeCadastro}:v2` : 
                    'orgaoMes:v2';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Usar sistema otimizado de agregação cruzada
    const { optimizedCrossAggregation } = await import('../../utils/queryOptimizer.js');
    return await optimizedCrossAggregation(
      prisma, 
      'orgaos', 
      'dataCriacaoIso', 
      where, 
      { dateFilter: true, limit: 100000 }
    );
  }, prisma);
}

/**
 * GET /api/aggregate/by-district
 * Agregação por distrito
 */
export async function byDistrict(req, res, prisma) {
  // Este endpoint está implementado no geographicController
  // Mas mantemos aqui para compatibilidade com a rota de aggregate
  const { aggregateByDistrict } = await import('./geographicController.js');
  return aggregateByDistrict(req, res, prisma);
}

