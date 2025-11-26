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
    
    // Debug: log dos filtros recebidos
    console.log('🔍 /api/filter: Filtros recebidos:', JSON.stringify(filters, null, 2));
    
    // Construir where clause otimizado
    const whereClause = {};
    const needsInMemoryFilter = [];
    const fieldsNeeded = new Set(['id', 'data']);
    
    // Separar filtros que podem usar where clause
    for (const f of filters) {
      const col = getNormalizedField(f.field);
      
      // Se o campo está normalizado no schema, tentar usar where clause
      if (col && f.op === 'eq') {
        // Tentar filtrar pelo campo normalizado
        whereClause[col] = f.value;
        fieldsNeeded.add(col);
      } else if (col && f.op === 'contains') {
        // Para campos de data, usar startsWith se o valor for no formato YYYY-MM
        if ((col === 'dataDaCriacao' || col === 'dataCriacaoIso') && /^\d{4}-\d{2}$/.test(f.value)) {
          // Filtro por mês: usar startsWith para melhor performance
          whereClause[col] = { startsWith: f.value };
        } else {
          whereClause[col] = { contains: f.value };
        }
        fieldsNeeded.add(col);
      } else {
        // Campo não normalizado ou operação não suportada - filtrar em memória
        needsInMemoryFilter.push(f);
        if (col) fieldsNeeded.add(col);
      }
    }
    
    // Buscar apenas campos necessários e limitar resultados
    const selectFields = Object.fromEntries(Array.from(fieldsNeeded).map(f => [f, true]));
    const finalSelect = Object.keys(selectFields).length > 1 ? selectFields : undefined;
    const whereCondition = Object.keys(whereClause).length > 0 ? whereClause : undefined;
    
    // IMPORTANTE: Se há filtros, NÃO limitar para garantir que todos os dados filtrados sejam retornados
    // O limite só deve ser aplicado quando NÃO há filtros (caso de uso raro)
    const hasFilters = filters.length > 0;
    
    let limitValue;
    if (!hasFilters) {
      // Sem filtros: limitar a 10.000 para evitar carregar tudo desnecessariamente
      limitValue = 10000;
    } else {
      // COM FILTROS: NUNCA limitar - precisamos de TODOS os registros para filtrar corretamente
      // Se o where clause funcionou, o banco já filtra. Se não funcionou, precisamos filtrar em memória.
      limitValue = undefined; // Sem limite quando há filtros
      
      console.log('🔍 /api/filter: Há filtros ativos, removendo limite de registros');
      console.log('🔍 /api/filter: Where condition:', whereCondition);
      console.log('🔍 /api/filter: Filtros em memória:', needsInMemoryFilter.length);
    }
    
    const queryOptions = {
      where: whereCondition,
      ...(finalSelect ? { select: finalSelect } : {}),
      ...(limitValue !== undefined ? { take: limitValue } : {}) // Só adicionar take se limitValue estiver definido
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
    
    // Aplicar filtros em memória
    // IMPORTANTE: Sempre verificar em memória porque os campos normalizados podem não estar populados
    // ou os valores podem estar no JSON com case diferente
    let filtered = allRows;
    
    if (filters.length > 0) {
      filtered = allRows.filter(r => {
        // Verificar todos os filtros
        for (const f of filters) {
          const col = getNormalizedField(f.field);
          
          // Tentar obter valor do campo normalizado primeiro, depois do JSON
          let value = '';
          
          // 1. Tentar campo normalizado direto no registro
          if (col && r[col] !== undefined && r[col] !== null) {
            value = r[col];
          } 
          // 2. Tentar no JSON com diferentes variações de nome
          else if (r.data && typeof r.data === 'object') {
            // Tentar todas as variações possíveis do nome do campo
            const fieldVariations = [
              f.field,                    // Nome original: "Canal"
              col,                        // Campo normalizado: "canal"
              f.field?.toLowerCase(),      // "canal"
              f.field?.toUpperCase(),      // "CANAL"
              f.field?.charAt(0).toUpperCase() + f.field?.slice(1).toLowerCase(), // "Canal"
              col?.charAt(0).toUpperCase() + col?.slice(1).toLowerCase() // "Canal" (se col = "canal")
            ].filter(Boolean);
            
            // Buscar valor em todas as variações
            for (const fieldName of fieldVariations) {
              if (r.data[fieldName] !== undefined && r.data[fieldName] !== null) {
                value = r.data[fieldName];
                break;
              }
            }
          }
          
          // Normalizar valores para comparação (case-insensitive, sem espaços extras)
          const valueStr = `${value}`.trim().toLowerCase();
          const filterStr = `${f.value}`.trim().toLowerCase();
          
          // Aplicar operação de filtro
          if (f.op === 'eq') {
            if (valueStr !== filterStr) {
              return false; // Não corresponde, excluir registro
            }
          } else if (f.op === 'contains') {
            if (!valueStr.includes(filterStr)) {
              return false; // Não contém, excluir registro
            }
          }
        }
        return true; // Passou em todos os filtros
      });
    }
    
    const result = filtered.map(r => ({ ...r, data: r.data || {} }));
    
    // Debug: log do resultado
    console.log(`✅ /api/filter: Retornando ${result.length} registro(s) de ${allRows.length} total após filtros`);
    if (result.length > 0 && result.length < allRows.length) {
      // Se houve filtragem, mostrar amostra
      const sample = result[0];
      console.log('🔍 /api/filter: Primeiro registro filtrado:', {
        id: sample.id,
        canal: sample.canal || sample.data?.Canal || sample.data?.canal,
        tipo: sample.tipoDeManifestacao || sample.data?.Tipo || sample.data?.tipo
      });
    } else if (result.length === allRows.length && filters.length > 0) {
      // AVISO: Filtros não foram aplicados corretamente
      console.warn('⚠️ /api/filter: ATENÇÃO - Filtros não reduziram o resultado!');
      console.warn('⚠️ Filtros aplicados:', JSON.stringify(filters, null, 2));
      const sample = allRows[0];
      console.warn('⚠️ Primeiro registro (não filtrado):', {
        id: sample.id,
        canal: sample.canal || sample.data?.Canal || sample.data?.canal,
        tipo: sample.tipoDeManifestacao || sample.data?.Tipo || sample.data?.tipo,
        dataKeys: sample.data ? Object.keys(sample.data).slice(0, 10) : []
      });
    }
    
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

