/**
 * Pipeline para Análise por Órgão e Mês
 * Retorna distribuição de manifestações agrupadas por órgão e mês
 */

/**
 * Construir pipeline de órgão por mês
 * @param {Object} filters - Filtros a aplicar
 * @param {number} limitOrgaos - Limite de órgãos (padrão: 20)
 * @param {number} limitMonths - Limite de meses (padrão: 12)
 * @returns {Array} Pipeline MongoDB
 */
export function buildOrgaoMesPipeline(filters = {}, limitOrgaos = 20, limitMonths = 12) {
  const pipeline = [];
  
  // Construir $match
  const match = buildMatchFromFilters(filters);
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }
  
  // Agrupar por órgão e mês
  pipeline.push(
    {
      $addFields: {
        dateField: {
          $cond: {
            if: { $ne: ['$createdAt', null] },
            then: '$createdAt',
            else: {
              $cond: {
                if: { $ne: ['$dataCriacaoIso', null] },
                then: { $dateFromString: { dateString: { $concat: ['$dataCriacaoIso', 'T00:00:00Z'] } } },
                else: null
              }
            }
          }
        }
      }
    },
    {
      $match: {
        orgaos: { $exists: true, $ne: null, $ne: '' },
        dateField: { $ne: null }
      }
    },
    {
      $group: {
        _id: {
          orgao: '$orgaos',
          year: { $year: '$dateField' },
          month: { $month: '$dateField' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        orgao: '$_id.orgao',
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: {
                if: { $lt: ['$_id.month', 10] },
                then: { $concat: ['0', { $toString: '$_id.month' }] },
                else: { $toString: '$_id.month' }
              }
            }
          ]
        },
        count: 1
      }
    },
    { $sort: { orgao: 1, month: 1 } }
  );
  
  return pipeline;
}

/**
 * Construir $match a partir de filtros
 */
function buildMatchFromFilters(filters = {}) {
  const match = {};
  
  const { orgaos, ...otherFilters } = filters;
  
  const filterFields = [
    'servidor', 'unidadeCadastro', 'status', 'tema', 
    'tipoDeManifestacao', 'canal', 'prioridade', 'assunto',
    'responsavel', 'unidadeSaude'
  ];
  
  for (const field of filterFields) {
    if (otherFilters[field] !== undefined && otherFilters[field] !== null) {
      match[field] = otherFilters[field];
    }
  }
  
  // Filtros de data
  if (otherFilters.dataInicio || otherFilters.dataFim) {
    const dateFilter = {};
    if (otherFilters.dataInicio) dateFilter.$gte = otherFilters.dataInicio;
    if (otherFilters.dataFim) dateFilter.$lte = otherFilters.dataFim;
    
    match.$or = [
      { createdAt: dateFilter },
      { dataCriacaoIso: dateFilter }
    ];
  }
  
  return match;
}

