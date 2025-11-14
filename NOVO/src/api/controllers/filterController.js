/**
 * Controller de Filtros
 * POST /api/filter
 */

import { getNormalizedField } from '../../utils/fieldMapper.js';

/**
 * POST /api/filter
 * Filtro dinâmico de registros
 */
export async function filterRecords(req, res, prisma) {
  try {
    const filters = Array.isArray(req.body?.filters) ? req.body.filters : [];
    const originalUrl = req.body?.originalUrl || '';
    
    // Se não há filtros, retornar vazio
    if (filters.length === 0) {
      console.warn('⚠️ /api/filter: Chamado SEM filtros! Retornando array vazio.');
      return res.json([]);
    }
    
    // Construir where clause otimizado
    const whereClause = {};
    const needsInMemoryFilter = [];
    const fieldsNeeded = new Set(['id', 'data']);
    
    // Separar filtros que podem usar where clause
    for (const f of filters) {
      const col = getNormalizedField(f.field);
      if (col && f.op === 'eq') {
        whereClause[col] = f.value;
        fieldsNeeded.add(col);
      } else if (col && f.op === 'contains') {
        whereClause[col] = { contains: f.value };
        fieldsNeeded.add(col);
      } else {
        needsInMemoryFilter.push(f);
        if (col) fieldsNeeded.add(col);
      }
    }
    
    // Buscar apenas campos necessários e limitar resultados
    const selectFields = Object.fromEntries(Array.from(fieldsNeeded).map(f => [f, true]));
    const finalSelect = Object.keys(selectFields).length > 1 ? selectFields : undefined;
    const whereCondition = Object.keys(whereClause).length > 0 ? whereClause : undefined;
    
    // OTIMIZAÇÃO: Limitar resultados para evitar timeout
    const shouldLimit = !whereCondition || Object.keys(whereCondition).length === 0;
    const hasStatusFilter = whereCondition?.status !== undefined;
    const hasContainsFilter = Object.values(whereCondition || {}).some(v => 
      typeof v === 'object' && v !== null && 'contains' in v
    );
    
    let limitValue;
    if (shouldLimit) {
      limitValue = 10000;
    } else if (hasStatusFilter || hasContainsFilter) {
      limitValue = 20000;
    } else {
      limitValue = 50000;
    }
    
    const queryOptions = {
      where: whereCondition,
      ...(finalSelect ? { select: finalSelect } : {}),
      take: limitValue
    };
    
    // Timeout de 8 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout após 8 segundos')), 8000)
    );
    
    let allRows;
    try {
      allRows = await Promise.race([prisma.record.findMany(queryOptions), timeoutPromise]);
    } catch (queryError) {
      if (queryError.message?.includes('timeout') || queryError.code === 'P2010') {
        console.warn('⚠️ Timeout ou erro de conexão, retornando array vazio');
        return res.json([]);
      }
      throw queryError;
    }
    
    // Aplicar filtros em memória apenas se necessário
    let filtered = allRows;
    if (needsInMemoryFilter.length > 0) {
      filtered = allRows.filter(r => {
        for (const f of needsInMemoryFilter) {
          const col = getNormalizedField(f.field);
          const value = col ? (r[col] || (r.data || {})[f.field] || '') : ((r.data || {})[f.field] || '');
          const valueStr = `${value}`.toLowerCase();
          const filterStr = `${f.value}`.toLowerCase();
          
          if (f.op === 'eq' && valueStr !== filterStr) return false;
          if (f.op === 'contains' && !valueStr.includes(filterStr)) return false;
        }
        return true;
      });
    }
    
    const result = filtered.map(r => ({ ...r, data: r.data || {} }));
    
    return res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint /api/filter:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro ao processar filtros', 
      data: [],
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

