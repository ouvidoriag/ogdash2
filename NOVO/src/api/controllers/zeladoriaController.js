/**
 * Controllers de Zeladoria
 * /api/zeladoria/*
 */

import { withCache } from '../../utils/responseHelper.js';

/**
 * GET /api/zeladoria/summary
 * Resumo geral de dados de Zeladoria
 */
export async function summary(req, res, prisma) {
  const cacheKey = 'zeladoria:summary:v1';
  return withCache(cacheKey, 3600, res, async () => {
    const total = await prisma.zeladoria.count();
    
    const statusCount = await prisma.zeladoria.groupBy({
      by: ['status'],
      _count: true
    });
    
    const categoriaCount = await prisma.zeladoria.groupBy({
      by: ['categoria'],
      _count: true
    });
    
    const departamentoCount = await prisma.zeladoria.groupBy({
      by: ['departamento'],
      _count: true
    });
    
    return {
      total,
      porStatus: statusCount.map(s => ({ key: s.status || 'Não informado', count: s._count })),
      porCategoria: categoriaCount.map(c => ({ key: c.categoria || 'Não informado', count: c._count })),
      porDepartamento: departamentoCount.map(d => ({ key: d.departamento || 'Não informado', count: d._count }))
    };
  }, prisma);
}

/**
 * GET /api/zeladoria/count-by
 * Contagem por campo
 */
export async function countBy(req, res, prisma) {
  const field = String(req.query.field ?? '').trim();
  if (!field) {
    return res.status(400).json({ error: 'field required' });
  }
  
  const cacheKey = `zeladoria:countBy:${field}:v1`;
  return withCache(cacheKey, 3600, res, async () => {
    // Mapear campo para coluna normalizada
    const fieldMap = {
      'status': 'status',
      'categoria': 'categoria',
      'departamento': 'departamento',
      'responsavel': 'responsavel',
      'bairro': 'bairro',
      'canal': 'canal',
      'origem': 'origem'
    };
    
    const col = fieldMap[field.toLowerCase()] || field.toLowerCase();
    
    try {
      const rows = await prisma.zeladoria.groupBy({
        by: [col],
        _count: true
      });
      
      return rows
        .map(r => ({ key: r[col] || 'Não informado', count: r._count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      // Fallback: agrega pelo JSON
      const rows = await prisma.zeladoria.findMany({
        select: { data: true }
      });
      
      const map = new Map();
      for (const r of rows) {
        const dat = r.data || {};
        const key = dat?.[field] ?? dat?.[field.toLowerCase()] ?? 'Não informado';
        const k = `${key}`;
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      
      return Array.from(map.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    }
  }, prisma);
}

/**
 * GET /api/zeladoria/by-month
 * Agregação por mês
 */
export async function byMonth(req, res, prisma) {
  const cacheKey = 'zeladoria:byMonth:v1';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await prisma.zeladoria.findMany({
      where: {
        dataCriacaoIso: { not: null }
      },
      select: {
        dataCriacaoIso: true
      }
    });
    
    const map = new Map();
    for (const r of rows) {
      if (r.dataCriacaoIso) {
        const month = r.dataCriacaoIso.substring(0, 7); // YYYY-MM
        map.set(month, (map.get(month) || 0) + 1);
      }
    }
    
    return Array.from(map.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, prisma);
}

/**
 * GET /api/zeladoria/time-series
 * Série temporal
 */
export async function timeSeries(req, res, prisma) {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  
  const cacheKey = `zeladoria:timeSeries:${startDate || 'all'}:${endDate || 'all'}:v1`;
  return withCache(cacheKey, 3600, res, async () => {
    const where = {
      dataCriacaoIso: { not: null }
    };
    
    if (startDate) where.dataCriacaoIso = { ...where.dataCriacaoIso, gte: startDate };
    if (endDate) where.dataCriacaoIso = { ...where.dataCriacaoIso, lte: endDate };
    
    const rows = await prisma.zeladoria.findMany({
      where,
      select: {
        dataCriacaoIso: true
      }
    });
    
    const map = new Map();
    for (const r of rows) {
      if (r.dataCriacaoIso) {
        map.set(r.dataCriacaoIso, (map.get(r.dataCriacaoIso) || 0) + 1);
      }
    }
    
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, prisma);
}

/**
 * GET /api/zeladoria/records
 * Lista de registros com paginação
 */
export async function records(req, res, prisma) {
  const page = parseInt(req.query.page || '1', 10);
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  const skip = (page - 1) * limit;
  
  const status = req.query.status;
  const categoria = req.query.categoria;
  const departamento = req.query.departamento;
  
  const where = {};
  if (status) where.status = status;
  if (categoria) where.categoria = categoria;
  if (departamento) where.departamento = departamento;
  
  const cacheKey = `zeladoria:records:${JSON.stringify(where)}:${page}:${limit}:v1`;
  return withCache(cacheKey, 300, res, async () => {
    const [data, total] = await Promise.all([
      prisma.zeladoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.zeladoria.count({ where })
    ]);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }, prisma);
}

/**
 * GET /api/zeladoria/stats
 * Estatísticas gerais
 */
export async function stats(req, res, prisma) {
  const cacheKey = 'zeladoria:stats:v1';
  return withCache(cacheKey, 3600, res, async () => {
    const total = await prisma.zeladoria.count();
    const fechados = await prisma.zeladoria.count({ where: { status: 'FECHADO' } });
    const abertos = await prisma.zeladoria.count({ where: { status: { in: ['ABERTO', 'NOVO', 'ATENDIMENTO'] } } });
    const comApoios = await prisma.zeladoria.count({ where: { apoios: { gt: 0 } } });
    
    // Tempo médio de resolução (apenas fechados com datas)
    const fechadosComDatas = await prisma.zeladoria.findMany({
      where: {
        status: 'FECHADO',
        dataCriacaoIso: { not: null },
        dataConclusaoIso: { not: null }
      },
      select: {
        dataCriacaoIso: true,
        dataConclusaoIso: true
      }
    });
    
    let tempoMedio = 0;
    if (fechadosComDatas.length > 0) {
      const tempos = fechadosComDatas.map(r => {
        const inicio = new Date(r.dataCriacaoIso);
        const fim = new Date(r.dataConclusaoIso);
        return Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)); // dias
      }).filter(t => t > 0);
      
      if (tempos.length > 0) {
        tempoMedio = Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
      }
    }
    
    return {
      total,
      fechados,
      abertos,
      comApoios,
      tempoMedioResolucao: tempoMedio,
      taxaResolucao: total > 0 ? Math.round((fechados / total) * 100) : 0
    };
  }, prisma);
}

/**
 * GET /api/zeladoria/by-status-month
 * Status por mês
 */
export async function byStatusMonth(req, res, prisma) {
  const cacheKey = 'zeladoria:byStatusMonth:v1';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await prisma.zeladoria.findMany({
      where: {
        dataCriacaoIso: { not: null }
      },
      select: {
        status: true,
        dataCriacaoIso: true
      }
    });
    
    const map = new Map();
    for (const r of rows) {
      if (r.dataCriacaoIso) {
        const month = r.dataCriacaoIso.substring(0, 7);
        const key = `${month}|${r.status || 'Não informado'}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    
    const result = {};
    for (const [key, count] of map.entries()) {
      const [month, status] = key.split('|');
      if (!result[month]) result[month] = {};
      result[month][status] = count;
    }
    
    return result;
  }, prisma);
}

/**
 * GET /api/zeladoria/by-categoria-departamento
 * Categoria por Departamento
 */
export async function byCategoriaDepartamento(req, res, prisma) {
  const cacheKey = 'zeladoria:byCategoriaDepartamento:v1';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await prisma.zeladoria.groupBy({
      by: ['categoria', 'departamento'],
      _count: true
    });
    
    const result = {};
    for (const r of rows) {
      const categoria = r.categoria || 'Não informado';
      const departamento = r.departamento || 'Não informado';
      
      if (!result[categoria]) result[categoria] = {};
      result[categoria][departamento] = r._count;
    }
    
    return result;
  }, prisma);
}

/**
 * GET /api/zeladoria/geographic
 * Dados geográficos (bairros com coordenadas)
 */
export async function geographic(req, res, prisma) {
  const cacheKey = 'zeladoria:geographic:v1';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await prisma.zeladoria.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        bairro: { not: null }
      },
      select: {
        bairro: true,
        latitude: true,
        longitude: true,
        categoria: true,
        status: true
      }
    });
    
    // Agrupar por bairro
    const map = new Map();
    for (const r of rows) {
      const bairro = r.bairro;
      if (!map.has(bairro)) {
        map.set(bairro, {
          bairro,
          latitude: parseFloat(r.latitude),
          longitude: parseFloat(r.longitude),
          count: 0,
          categorias: {},
          status: {}
        });
      }
      
      const entry = map.get(bairro);
      entry.count++;
      entry.categorias[r.categoria || 'Não informado'] = (entry.categorias[r.categoria || 'Não informado'] || 0) + 1;
      entry.status[r.status || 'Não informado'] = (entry.status[r.status || 'Não informado'] || 0) + 1;
    }
    
    return Array.from(map.values());
  }, prisma);
}

