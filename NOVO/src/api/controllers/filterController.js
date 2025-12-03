/**
 * Controller de Filtros
 * POST /api/filter
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 * 
 * OTIMIZAÇÃO: Usa MongoDB Native para queries mais eficientes
 * Suporta paginação cursor-based opcional
 */

import { getNormalizedField } from '../../utils/fieldMapper.js';
import { paginateWithCursor } from '../../utils/cursorPagination.js';
import Record from '../../models/Record.model.js';
import { logger } from '../../utils/logger.js';

/**
 * POST /api/filter
 * Filtro dinâmico de registros
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} getMongoClient - Função para obter cliente MongoDB nativo
 */
export async function filterRecords(req, res, getMongoClient) {
  try {
    const filters = Array.isArray(req.body?.filters) ? req.body.filters : [];
    const originalUrl = req.body?.originalUrl || '';
    
    // Se não há filtros, retornar vazio
    if (filters.length === 0) {
      logger.warn('/api/filter: Chamado SEM filtros! Retornando array vazio.');
      return res.json([]);
    }
    
    // Debug: log dos filtros recebidos
    logger.debug('/api/filter: Filtros recebidos', { filters });
    
    // Construir filtro MongoDB otimizado
    const mongoFilter = {};
    const needsInMemoryFilter = [];
    const fieldsNeeded = new Set(['_id', 'data']);
    
    // Separar filtros que podem usar $match do MongoDB
    for (const f of filters) {
      const col = getNormalizedField(f.field);
      
      // Se o campo está normalizado no schema, tentar usar $match
      if (col && f.op === 'eq') {
        // Tentar filtrar pelo campo normalizado
        mongoFilter[col] = f.value;
        fieldsNeeded.add(col);
      } else if (col && f.op === 'contains') {
        // Para campos de data, usar regex se o valor for no formato YYYY-MM
        if ((col === 'dataDaCriacao' || col === 'dataCriacaoIso') && /^\d{4}-\d{2}$/.test(f.value)) {
          // Filtro por mês: usar regex para melhor performance
          mongoFilter[col] = { $regex: `^${f.value}`, $options: 'i' };
        } else {
          mongoFilter[col] = { $regex: f.value, $options: 'i' };
        }
        fieldsNeeded.add(col);
      } else if (col && (f.op === 'gte' || f.op === 'lte' || f.op === 'gt' || f.op === 'lt')) {
        // Operadores de comparação para campos de data
        if (col === 'dataCriacaoIso' || col === 'dataDaCriacao' || col === 'dataConclusaoIso') {
          // Inicializar objeto de filtro de data se não existir
          if (!mongoFilter[col]) {
            mongoFilter[col] = {};
          }
          
          // Converter operador para formato MongoDB
          if (f.op === 'gte') {
            mongoFilter[col].$gte = f.value;
          } else if (f.op === 'lte') {
            mongoFilter[col].$lte = f.value;
          } else if (f.op === 'gt') {
            mongoFilter[col].$gt = f.value;
          } else if (f.op === 'lt') {
            mongoFilter[col].$lt = f.value;
          }
          
          fieldsNeeded.add(col);
        } else {
          // Campo não é de data, filtrar em memória
          needsInMemoryFilter.push(f);
          if (col) fieldsNeeded.add(col);
        }
      } else {
        // Campo não normalizado ou operação não suportada - filtrar em memória
        needsInMemoryFilter.push(f);
        if (col) fieldsNeeded.add(col);
      }
    }
    
    // Buscar apenas campos necessários
    const selectFields = Array.from(fieldsNeeded).join(' ');
    const hasFilter = Object.keys(mongoFilter).length > 0;
    
    // OTIMIZAÇÃO: Verificar se deve usar paginação cursor-based
    const usePagination = req.query.cursor !== undefined || req.query.pageSize !== undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 50;
    const cursor = req.query.cursor || null;
    
    let allRows;
    
    // Se usar paginação cursor-based e getMongoClient disponível
    if (usePagination && getMongoClient) {
      try {
        const paginationResult = await paginateWithCursor(
          getMongoClient,
          mongoFilter,
          pageSize,
          cursor
        );
        
        // Formatar resultados
        allRows = paginationResult.results.map(doc => ({
          id: doc._id.toString(),
          ...doc,
          _id: doc._id.toString() // Compatibilidade
        }));
        
        // Retornar com metadados de paginação
        return res.json({
          data: allRows,
          nextCursor: paginationResult.nextCursor,
          hasMore: paginationResult.hasMore,
          pageSize: paginationResult.pageSize,
          totalReturned: paginationResult.totalReturned
        });
      } catch (mongoError) {
        logger.warn('Erro ao usar MongoDB Native, usando fallback Mongoose:', { error: mongoError.message });
        // Continuar com Mongoose como fallback
      }
    }
    
    // Usar Mongoose diretamente
    const hasFilters = filters.length > 0;
    
    let limitValue;
    if (!hasFilters) {
      limitValue = 10000;
    } else {
      limitValue = undefined; // Sem limite quando há filtros
      logger.debug('/api/filter: Há filtros ativos, removendo limite de registros');
    }
    
    // OTIMIZAÇÃO: Timeout aumentado para 30s (padrão) para queries complexas
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout após 30 segundos')), 30000)
    );
    
    try {
      let query = Record.find(hasFilter ? mongoFilter : {});
      if (selectFields) query = query.select(selectFields);
      if (limitValue !== undefined) query = query.limit(limitValue);
      
      allRows = await Promise.race([query.lean(), timeoutPromise]);
    } catch (queryError) {
      if (queryError.message?.includes('timeout')) {
        logger.warn('Timeout ou erro de conexão, retornando array vazio');
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
          
          // Aplicar operação de filtro
          if (f.op === 'eq') {
            // Comparação exata (case-insensitive)
            const valueStr = `${value}`.trim().toLowerCase();
            const filterStr = `${f.value}`.trim().toLowerCase();
            if (valueStr !== filterStr) {
              return false; // Não corresponde, excluir registro
            }
          } else if (f.op === 'contains') {
            // Contém (case-insensitive)
            const valueStr = `${value}`.trim().toLowerCase();
            const filterStr = `${f.value}`.trim().toLowerCase();
            if (!valueStr.includes(filterStr)) {
              return false; // Não contém, excluir registro
            }
          } else if (f.op === 'gte' || f.op === 'lte' || f.op === 'gt' || f.op === 'lt') {
            // Operadores de comparação para datas
            // Tentar obter data do campo normalizado ou do JSON
            let dateValue = null;
            
            // 1. Tentar campo normalizado direto
            if (col && (col === 'dataCriacaoIso' || col === 'dataDaCriacao' || col === 'dataConclusaoIso')) {
              if (r[col]) {
                dateValue = new Date(r[col]);
              }
            }
            
            // 2. Tentar no JSON
            if (!dateValue && r.data && typeof r.data === 'object') {
              const dateFields = [
                'dataCriacaoIso', 'dataDaCriacao', 'dataConclusaoIso',
                'Data', 'data_da_criacao', 'data_da_conclusao'
              ];
              for (const fieldName of dateFields) {
                if (r.data[fieldName]) {
                  dateValue = new Date(r.data[fieldName]);
                  if (!isNaN(dateValue.getTime())) break;
                }
              }
            }
            
            // Se não encontrou data válida, pular este filtro
            if (!dateValue || isNaN(dateValue.getTime())) {
              continue; // Pular este filtro, não excluir o registro
            }
            
            // Converter valor do filtro para data
            const filterDate = new Date(f.value);
            if (isNaN(filterDate.getTime())) {
              continue; // Data inválida no filtro, pular
            }
            
            // Aplicar comparação
            if (f.op === 'gte' && dateValue < filterDate) {
              return false; // Data é menor que o mínimo, excluir
            } else if (f.op === 'lte' && dateValue > filterDate) {
              return false; // Data é maior que o máximo, excluir
            } else if (f.op === 'gt' && dateValue <= filterDate) {
              return false; // Data é menor ou igual, excluir
            } else if (f.op === 'lt' && dateValue >= filterDate) {
              return false; // Data é maior ou igual, excluir
            }
          }
        }
        return true; // Passou em todos os filtros
      });
    }
    
    const result = filtered.map(r => ({ ...r, data: r.data || {} }));
    
    // Debug: log do resultado
    logger.debug(`/api/filter: Retornando ${result.length} registro(s) de ${allRows.length} total após filtros`);
    if (result.length > 0 && result.length < allRows.length) {
      // Se houve filtragem, mostrar amostra
      const sample = result[0];
      logger.debug('/api/filter: Primeiro registro filtrado', {
        id: sample.id || sample._id,
        canal: sample.canal || sample.data?.Canal || sample.data?.canal,
        tipo: sample.tipoDeManifestacao || sample.data?.Tipo || sample.data?.tipo
      });
    } else if (result.length === allRows.length && filters.length > 0) {
      // AVISO: Filtros não foram aplicados corretamente
      logger.warn('/api/filter: ATENÇÃO - Filtros não reduziram o resultado!', { filters });
    }
    
    return res.json(result);
  } catch (error) {
    logger.error('Erro no endpoint /api/filter:', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: error.message || 'Erro ao processar filtros', 
      data: [],
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

