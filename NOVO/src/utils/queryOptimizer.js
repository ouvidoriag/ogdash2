/**
 * Sistema Global de Otimização de Queries
 * Usa agregações do banco de dados em vez de processar em memória
 * Muito mais rápido e eficiente
 */

import { getDataCriacao } from './dateUtils.js';

/**
 * Obter filtro de data otimizado (últimos 24 meses)
 */
export function getDateFilter() {
  const today = new Date();
  const twoYearsAgo = new Date(today);
  twoYearsAgo.setMonth(today.getMonth() - 24);
  const minDateStr = twoYearsAgo.toISOString().slice(0, 10);
  
  return {
    OR: [
      { dataCriacaoIso: { gte: minDateStr } },
      { dataDaCriacao: { contains: today.getFullYear().toString() } },
      { dataDaCriacao: { contains: (today.getFullYear() - 1).toString() } }
    ]
  };
}

/**
 * Agregação otimizada usando groupBy do Prisma (muito mais rápido)
 * Em vez de buscar todos os registros e processar em memória
 */
export async function optimizedGroupBy(prisma, field, where = {}, options = {}) {
  const { limit, sortBy = 'count', sortOrder = 'desc' } = options;
  
  try {
    // Usar groupBy do Prisma - agregação no banco (muito mais rápido)
    const results = await prisma.record.groupBy({
      by: [field],
      where: Object.keys(where).length > 0 ? where : undefined,
      _count: { id: true }
    });
    
    const mapped = results.map(r => ({
      key: r[field] ?? 'Não informado',
      count: r._count.id
    }));
    
    // Ordenar manualmente (MongoDB não suporta orderBy com _count)
    mapped.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.count - a.count;
      } else {
        return a.count - b.count;
      }
    });
    
    return limit ? mapped.slice(0, limit) : mapped;
  } catch (error) {
    // Fallback: se groupBy falhar, usar método tradicional (mas otimizado)
    console.warn(`⚠️ groupBy falhou para ${field}, usando fallback:`, error.message);
    return await fallbackGroupBy(prisma, field, where, options);
  }
}

/**
 * Fallback: agregação em memória (mais lento, mas funciona sempre)
 */
async function fallbackGroupBy(prisma, field, where = {}, options = {}) {
  const { limit, dateFilter = true } = options;
  
  const finalWhere = { ...where };
  
  // Adicionar filtro de data se solicitado
  if (dateFilter) {
    const dateFilterObj = getDateFilter();
    finalWhere.AND = [
      ...(finalWhere.AND || []),
      dateFilterObj
    ];
  }
  
  // Buscar apenas campos necessários
  const rows = await prisma.record.findMany({
    where: finalWhere,
    select: { [field]: true },
    take: limit || 100000
  });
  
  // Agrupar em memória
  const map = new Map();
  for (const row of rows) {
    const key = row[field] ?? 'Não informado';
    map.set(key, (map.get(key) || 0) + 1);
  }
  
  const result = Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
  
  return limit ? result.slice(0, limit) : result;
}

/**
 * Agregação por mês otimizada usando dados da planilha
 */
export async function optimizedGroupByMonth(prisma, where = {}, options = {}) {
  const { limit = 24, dateFilter = true } = options; // Últimos 24 meses por padrão
  
  // Sempre usar fallback que processa dados da planilha diretamente
  // Isso garante que usamos dataDaCriacao ou data.data_da_criacao
  return await fallbackGroupByMonth(prisma, where, { ...options, dateFilter });
}

/**
 * Fallback: agregação por mês em memória usando dados da planilha
 */
async function fallbackGroupByMonth(prisma, where = {}, options = {}) {
  const { limit = 24, dateFilter = true } = options;
  
  const finalWhere = { 
    ...where,
    OR: [
      { dataDaCriacao: { not: null } },
      { dataCriacaoIso: { not: null } }
    ]
  };
  
  if (dateFilter) {
    const dateFilterObj = getDateFilter();
    finalWhere.AND = [
      ...(finalWhere.AND || []),
      dateFilterObj
    ];
  }
  
  const rows = await prisma.record.findMany({
    where: finalWhere,
    select: {
      dataCriacaoIso: true,
      dataDaCriacao: true,
      data: true
    },
    take: 100000
  });
  
  const monthMap = new Map();
  for (const r of rows) {
    // Usar getDataCriacao que já tem fallback para dados da planilha
    const dataCriacao = getDataCriacao(r);
    if (!dataCriacao) continue;
    const mes = dataCriacao.slice(0, 7); // YYYY-MM
    monthMap.set(mes, (monthMap.get(mes) || 0) + 1);
  }
  
  return Array.from(monthMap.entries())
    .map(([ym, count]) => ({ ym, count }))
    .sort((a, b) => a.ym.localeCompare(b.ym))
    .slice(-limit);
}

/**
 * Contagem otimizada usando count do Prisma
 */
export async function optimizedCount(prisma, where = {}) {
  return await prisma.record.count({
    where: Object.keys(where).length > 0 ? where : undefined
  });
}

/**
 * Valores distintos otimizados usando groupBy
 */
export async function optimizedDistinct(prisma, field, where = {}, options = {}) {
  const { limit = 1000, dateFilter = true } = options;
  
  try {
    // Usar groupBy para obter valores distintos (muito mais rápido)
    // NOTA: Prisma groupBy não suporta 'take' diretamente, então aplicamos o limite depois
    const results = await prisma.record.groupBy({
      by: [field],
      where: Object.keys(where).length > 0 ? where : undefined,
      _count: { _all: true }
      // Removido 'take' - não é suportado pelo Prisma groupBy
    });
    
    // Filtrar, ordenar e aplicar limite após a query
    const values = results
      .map(r => r[field])
      .filter(v => v !== null && v !== undefined && `${v}`.trim() !== '')
      .sort()
      .slice(0, limit);
    
    return values;
  } catch (error) {
    // Fallback: buscar e processar em memória
    console.warn(`⚠️ groupBy distinct falhou para ${field}, usando fallback:`, error.message);
    
    const finalWhere = { ...where };
    if (dateFilter) {
      const dateFilterObj = getDateFilter();
      finalWhere.AND = [
        ...(finalWhere.AND || []),
        dateFilterObj
      ];
    }
    
    const rows = await prisma.record.findMany({
      where: finalWhere,
      select: { [field]: true, data: true },
      take: 50000
    });
    
    const values = new Set();
    for (const r of rows) {
      const val = r[field] || r.data?.[field] || r.data?.[field.toLowerCase()];
      if (val !== undefined && val !== null && `${val}`.trim() !== '') {
        values.add(`${val}`);
      }
    }
    
    return Array.from(values).sort().slice(0, limit);
  }
}

/**
 * Agregação cruzada otimizada (ex: por órgão e mês)
 */
export async function optimizedCrossAggregation(prisma, field1, field2, where = {}, options = {}) {
  const { dateFilter = true, limit = 10000 } = options;
  
  const finalWhere = { ...where };
  if (dateFilter) {
    const dateFilterObj = getDateFilter();
    finalWhere.AND = [
      ...(finalWhere.AND || []),
      dateFilterObj
    ];
  }
  
  // Buscar apenas campos necessários
  const rows = await prisma.record.findMany({
    where: finalWhere,
    select: {
      [field1]: true,
      [field2]: true,
      dataCriacaoIso: true,
      dataDaCriacao: true,
      data: true
    },
    take: limit
  });
  
  const map = new Map();
  for (const r of rows) {
    const val1 = r[field1] || 'Não informado';
    let val2 = r[field2];
    
    // Se field2 é data, extrair mês (YYYY-MM)
    if (field2 === 'dataDaCriacao' || field2 === 'dataCriacaoIso') {
      if (r.dataCriacaoIso) {
        val2 = r.dataCriacaoIso.slice(0, 7); // YYYY-MM
      } else if (r.dataDaCriacao) {
        const match = r.dataDaCriacao.match(/(\d{4})-(\d{2})/);
        if (match) {
          val2 = `${match[1]}-${match[2]}`;
        } else {
          try {
            const date = new Date(r.dataDaCriacao);
            if (!isNaN(date.getTime())) {
              val2 = date.toISOString().slice(0, 7);
            } else {
              continue;
            }
          } catch {
            continue;
          }
        }
      } else {
        continue;
      }
    } else {
      val2 = val2 || 'Não informado';
    }
    
    const key = `${val1}|${val2}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  
  const result = Array.from(map.entries()).map(([key, count]) => {
    const [val1, val2] = key.split('|');
    
    if (field2 === 'dataDaCriacao' || field2 === 'dataCriacaoIso') {
      return { 
        [field1]: val1, 
        month: val2, 
        count 
      };
    }
    
    return { 
      [field1]: val1, 
      [field2]: val2, 
      count 
    };
  });
  
  return result.sort((a, b) => {
    if (a.month && b.month && a.month !== b.month) {
      return a.month.localeCompare(b.month);
    }
    const key1 = a[field1] || '';
    const key2 = b[field1] || '';
    return key1.localeCompare(key2);
  });
}

