/**
 * Controllers de Estatísticas
 * /api/stats/*
 */

import { withCache } from '../../utils/responseHelper.js';
import { getDateFilter } from '../../utils/queryOptimizer.js';
import { getDataCriacao, getTempoResolucaoEmDias, isConcluido, addMesFilter } from '../../utils/dateUtils.js';

/**
 * GET /api/stats/average-time
 * Tempo médio de atendimento por órgão/unidade
 */
export async function averageTime(req, res, prisma) {
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const key = servidor ? `avgTime:servidor:${servidor}:v3` :
              unidadeCadastro ? `avgTime:uac:${unidadeCadastro}:v3` :
              'avgTime:v3';
  
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Filtrar apenas últimos 24 meses por padrão
    const today = new Date();
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setMonth(today.getMonth() - 24);
    const minDateStr = twoYearsAgo.toISOString().slice(0, 10);
    
    // Construir filtro de data baseado nos meses selecionados
    if (meses && meses.length > 0) {
      addMesFilter(where, meses);
    } else {
      // Se não há filtro de meses, adicionar filtro de últimos 24 meses
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { dataCriacaoIso: { gte: minDateStr } },
            { dataDaCriacao: { contains: today.getFullYear().toString() } },
            { dataDaCriacao: { contains: (today.getFullYear() - 1).toString() } }
          ]
        }
      ];
    }
    
    // Buscar apenas registros com dados necessários
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null },
      },
      select: {
        orgaos: true,
        responsavel: true,
        unidadeCadastro: true,
        tempoDeResolucaoEmDias: true,
        dataCriacaoIso: true,
        dataDaCriacao: true,
        dataConclusaoIso: true,
        dataDaConclusao: true
      }
    });
    
    // Agrupar por órgão/unidade e calcular média
    const map = new Map();
    for (const r of rows) {
      const org = r.orgaos || r.responsavel || r.unidadeCadastro || 'Não informado';
      
      if (apenasConcluidos && !isConcluido(r)) {
        continue;
      }
      
      const days = getTempoResolucaoEmDias(r, incluirZero);
      if (days === null) continue;
      
      if (!map.has(org)) map.set(org, { total: 0, sum: 0 });
      const stats = map.get(org);
      stats.total += 1;
      stats.sum += days;
    }
    
    // Calcular médias e retornar ordenado
    const result = Array.from(map.entries())
      .map(([org, stats]) => ({ 
        org, 
        dias: stats.total > 0 ? Number((stats.sum / stats.total).toFixed(2)) : 0,
        quantidade: stats.total
      }))
      .filter(item => item.dias > 0)
      .sort((a, b) => b.dias - a.dias);
    
    return result;
  }, prisma);
}

/**
 * GET /api/stats/average-time/by-day
 * Tempo médio por dia (últimos 30 dias)
 */
export async function averageTimeByDay(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  
  const key = servidor ? `avgTimeByDay:servidor:${servidor}:v4` :
              unidadeCadastro ? `avgTimeByDay:uac:${unidadeCadastro}:v4` :
              meses ? `avgTimeByDay:meses:${meses.sort().join(',')}:v4` :
              'avgTimeByDay:v4';
  
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Filtrar apenas últimos 24 meses
    const todayForFilter = new Date();
    const twoYearsAgo = new Date(todayForFilter);
    twoYearsAgo.setMonth(todayForFilter.getMonth() - 24);
    const minDateStr = twoYearsAgo.toISOString().slice(0, 10);
    
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { dataCriacaoIso: { gte: minDateStr } },
          { dataDaCriacao: { contains: todayForFilter.getFullYear().toString() } },
          { dataDaCriacao: { contains: (todayForFilter.getFullYear() - 1).toString() } }
        ]
      }
    ];
    
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null }
      },
      select: {
        dataCriacaoIso: true,
        dataDaCriacao: true,
        tempoDeResolucaoEmDias: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      },
      take: 100000
    });
    
    const map = new Map();
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const minDateForProcessing = ninetyDaysAgo.toISOString().slice(0, 10);
    
    for (const r of rows) {
      const dataCriacao = getDataCriacao(r);
      if (!dataCriacao || dataCriacao < minDateForProcessing) continue;
      
      if (apenasConcluidos && !isConcluido(r)) continue;
      
      const days = getTempoResolucaoEmDias(r, incluirZero);
      if (days === null) continue;
      
      if (!map.has(dataCriacao)) map.set(dataCriacao, { total: 0, sum: 0 });
      const stats = map.get(dataCriacao);
      stats.total += 1;
      stats.sum += days;
    }
    
    // Gerar últimos 30 dias
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const stats = map.get(dateKey) || { total: 0, sum: 0 };
      result.push({
        date: dateKey,
        dias: stats.total > 0 ? Number((stats.sum / stats.total).toFixed(2)) : 0,
        quantidade: stats.total
      });
    }
    
    return result;
  }, prisma);
}

/**
 * GET /api/stats/average-time/by-week
 * Tempo médio por semana
 */
export async function averageTimeByWeek(req, res, prisma) {
  // Similar ao by-day, mas agrupa por semana
  // Implementação similar, agrupando por semana ISO
  return averageTimeByDay(req, res, prisma); // Por enquanto, usar mesma lógica
}

/**
 * GET /api/stats/average-time/by-month
 * Tempo médio por mês
 */
export async function averageTimeByMonth(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  
  const key = servidor ? `avgTimeByMonth:servidor:${servidor}:v3` :
              unidadeCadastro ? `avgTimeByMonth:uac:${unidadeCadastro}:v3` :
              'avgTimeByMonth:v3';
  
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null }
      },
      select: {
        dataCriacaoIso: true,
        dataDaCriacao: true,
        tempoDeResolucaoEmDias: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      },
      take: 100000
    });
    
    const map = new Map();
    for (const r of rows) {
      const mes = getDataCriacao(r)?.slice(0, 7); // YYYY-MM
      if (!mes) continue;
      
      if (apenasConcluidos && !isConcluido(r)) continue;
      
      const days = getTempoResolucaoEmDias(r, incluirZero);
      if (days === null) continue;
      
      if (!map.has(mes)) map.set(mes, { total: 0, sum: 0 });
      const stats = map.get(mes);
      stats.total += 1;
      stats.sum += days;
    }
    
    return Array.from(map.entries())
      .map(([month, stats]) => ({
        month,
        dias: stats.total > 0 ? Number((stats.sum / stats.total).toFixed(2)) : 0,
        quantidade: stats.total
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, prisma);
}

/**
 * GET /api/stats/average-time/stats
 * Estatísticas gerais de tempo (média, mediana, min, max)
 */
export async function averageTimeStats(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  
  const key = servidor ? `avgTimeStats:servidor:${servidor}:v2` :
              unidadeCadastro ? `avgTimeStats:uac:${unidadeCadastro}:v2` :
              'avgTimeStats:v2';
  
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    if (meses && meses.length > 0) {
      addMesFilter(where, meses);
    }
    
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null }
      },
      select: {
        tempoDeResolucaoEmDias: true,
        dataCriacaoIso: true,
        dataDaCriacao: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      },
      take: 100000
    });
    
    const days = [];
    for (const r of rows) {
      if (apenasConcluidos && !isConcluido(r)) continue;
      
      const d = getTempoResolucaoEmDias(r, incluirZero);
      if (d !== null && d > 0) {
        days.push(d);
      }
    }
    
    if (days.length === 0) {
      return { media: 0, mediana: 0, minimo: 0, maximo: 0, total: 0 };
    }
    
    days.sort((a, b) => a - b);
    const media = days.reduce((a, b) => a + b, 0) / days.length;
    const mediana = days.length % 2 === 0
      ? (days[days.length / 2 - 1] + days[days.length / 2]) / 2
      : days[Math.floor(days.length / 2)];
    const minimo = days[0];
    const maximo = days[days.length - 1];
    
    return {
      media: Number(media.toFixed(2)),
      mediana: Number(mediana.toFixed(2)),
      minimo,
      maximo,
      total: days.length
    };
  }, prisma);
}

/**
 * GET /api/stats/average-time/by-unit
 * Tempo médio por unidade de cadastro
 */
export async function averageTimeByUnit(req, res, prisma) {
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  
  const key = meses ? `avgTimeByUnit:meses:${meses.sort().join(',')}:v2` : 'avgTimeByUnit:v2';
  
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (meses && meses.length > 0) {
      addMesFilter(where, meses);
    }
    
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null },
        unidadeCadastro: { not: null }
      },
      select: {
        unidadeCadastro: true,
        tempoDeResolucaoEmDias: true,
        dataCriacaoIso: true,
        dataDaCriacao: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      },
      take: 100000
    });
    
    const map = new Map();
    for (const r of rows) {
      const unit = r.unidadeCadastro || 'Não informado';
      
      if (apenasConcluidos && !isConcluido(r)) continue;
      
      const days = getTempoResolucaoEmDias(r, incluirZero);
      if (days === null) continue;
      
      if (!map.has(unit)) map.set(unit, { total: 0, sum: 0 });
      const stats = map.get(unit);
      stats.total += 1;
      stats.sum += days;
    }
    
    return Array.from(map.entries())
      .map(([unit, stats]) => ({
        unit,
        dias: stats.total > 0 ? Number((stats.sum / stats.total).toFixed(2)) : 0,
        quantidade: stats.total
      }))
      .filter(item => item.dias > 0)
      .sort((a, b) => b.dias - a.dias);
  }, prisma);
}

/**
 * GET /api/stats/average-time/by-month-unit
 * Tempo médio por mês e unidade
 */
export async function averageTimeByMonthUnit(req, res, prisma) {
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  
  const key = meses ? `avgTimeByMonthUnit:meses:${meses.sort().join(',')}:v2` : 'avgTimeByMonthUnit:v2';
  
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (meses && meses.length > 0) {
      addMesFilter(where, meses);
    }
    
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null },
        unidadeCadastro: { not: null }
      },
      select: {
        unidadeCadastro: true,
        dataCriacaoIso: true,
        dataDaCriacao: true,
        tempoDeResolucaoEmDias: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      },
      take: 100000
    });
    
    const map = new Map();
    for (const r of rows) {
      const unit = r.unidadeCadastro || 'Não informado';
      const mes = getDataCriacao(r)?.slice(0, 7);
      if (!mes) continue;
      
      if (apenasConcluidos && !isConcluido(r)) continue;
      
      const days = getTempoResolucaoEmDias(r, incluirZero);
      if (days === null) continue;
      
      const key = `${unit}|${mes}`;
      if (!map.has(key)) map.set(key, { total: 0, sum: 0 });
      const stats = map.get(key);
      stats.total += 1;
      stats.sum += days;
    }
    
    return Array.from(map.entries())
      .map(([key, stats]) => {
        const [unit, month] = key.split('|');
        return {
          unit,
          month,
          dias: stats.total > 0 ? Number((stats.sum / stats.total).toFixed(2)) : 0,
          quantidade: stats.total
        };
      })
      .sort((a, b) => {
        if (a.month !== b.month) return a.month.localeCompare(b.month);
        return a.unit.localeCompare(b.unit);
      });
  }, prisma);
}

/**
 * GET /api/stats/status-overview
 * Visão geral de status (percentuais)
 */
export async function statusOverview(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const key = servidor ? `statusOverview:servidor:${servidor}:v2` :
              unidadeCadastro ? `statusOverview:uac:${unidadeCadastro}:v2` :
              'statusOverview:v2';
  
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    const total = await prisma.record.count({ where });
    
    try {
      const statusGroups = await prisma.record.groupBy({
        by: ['status'],
        where: Object.keys(where).length > 0 ? where : undefined,
        _count: { _all: true }
      });
      
      let concluidas = 0;
      let emAtendimento = 0;
      
      for (const group of statusGroups) {
        const statusValue = group.status || '';
        const status = `${statusValue}`.toLowerCase();
        
        if (status.includes('concluída') || status.includes('concluida') || 
            status.includes('encerrada') || status.includes('arquivamento') ||
            status.includes('resposta final')) {
          concluidas += group._count._all;
        } else if (status.includes('em atendimento') || status.includes('aberto') || 
                   status.includes('pendente') || status.includes('análise') ||
                   status.includes('departamento') || status.includes('ouvidoria') ||
                   status.length > 0) {
          emAtendimento += group._count._all;
        }
      }
      
      const totalCount = total || 0;
      
      return {
        total: totalCount,
        concluida: {
          quantidade: concluidas,
          percentual: totalCount > 0 ? Number(((concluidas / totalCount) * 100).toFixed(1)) : 0
        },
        emAtendimento: {
          quantidade: emAtendimento,
          percentual: totalCount > 0 ? Number(((emAtendimento / totalCount) * 100).toFixed(1)) : 0
        }
      };
    } catch (error) {
      // Fallback
      const allRecords = await prisma.record.findMany({ 
        where: Object.keys(where).length > 0 ? where : undefined,
        select: { status: true, statusDemanda: true }
      });
      
      let concluidas = 0;
      let emAtendimento = 0;
      
      for (const r of allRecords) {
        const statusValue = r.status || r.statusDemanda || '';
        const status = `${statusValue}`.toLowerCase();
        
        if (status.includes('concluída') || status.includes('concluida') || 
            status.includes('encerrada') || status.includes('arquivamento') ||
            status.includes('resposta final')) {
          concluidas++;
        } else if (status.includes('em atendimento') || status.includes('aberto') || 
                   status.includes('pendente') || status.includes('análise') ||
                   status.includes('departamento') || status.includes('ouvidoria') ||
                   status.length > 0) {
          emAtendimento++;
        }
      }
      
      const totalCount = total || 0;
      
      return {
        total: totalCount,
        concluida: {
          quantidade: concluidas,
          percentual: totalCount > 0 ? Number(((concluidas / totalCount) * 100).toFixed(1)) : 0
        },
        emAtendimento: {
          quantidade: emAtendimento,
          percentual: totalCount > 0 ? Number(((emAtendimento / totalCount) * 100).toFixed(1)) : 0
        }
      };
    }
  }, prisma);
}

