/**
 * Controllers de Zeladoria
 * /api/zeladoria/*
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 */

import { withCache } from '../../utils/responseHelper.js';
import Zeladoria from '../../models/Zeladoria.model.js';

/**
 * GET /api/zeladoria/summary
 * Resumo geral de dados de Zeladoria
 */
export async function summary(req, res) {
  const cacheKey = 'zeladoria:summary:v2';
  return withCache(cacheKey, 3600, res, async () => {
    const total = await Zeladoria.countDocuments();
    
    const [statusCount, categoriaCount, departamentoCount] = await Promise.all([
      Zeladoria.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Zeladoria.aggregate([
        { $group: { _id: '$categoria', count: { $sum: 1 } } }
      ]),
      Zeladoria.aggregate([
        { $group: { _id: '$departamento', count: { $sum: 1 } } }
      ])
    ]);
    
    return {
      total,
      porStatus: statusCount.map(s => ({ key: s._id || 'Não informado', count: s.count })),
      porCategoria: categoriaCount.map(c => ({ key: c._id || 'Não informado', count: c.count })),
      porDepartamento: departamentoCount.map(d => ({ key: d._id || 'Não informado', count: d.count }))
    };
  });
}

/**
 * GET /api/zeladoria/count-by
 * Contagem por campo
 */
export async function countBy(req, res) {
  const field = String(req.query.field ?? '').trim();
  if (!field) {
    return res.status(400).json({ error: 'field required' });
  }
  
  const cacheKey = `zeladoria:countBy:${field}:v2`;
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
      const rows = await Zeladoria.aggregate([
        { $group: { _id: `$${col}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      return rows
        .map(r => ({ key: r._id || 'Não informado', count: r.count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      // Fallback: agrega pelo JSON
      const rows = await Zeladoria.find({})
        .select('data')
        .lean();
      
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
  });
}

/**
 * GET /api/zeladoria/by-month
 * Agregação por mês
 */
export async function byMonth(req, res) {
  const cacheKey = 'zeladoria:byMonth:v2';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await Zeladoria.find({
      dataCriacaoIso: { $ne: null }
    })
    .select('dataCriacaoIso')
    .lean();
    
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
  });
}

/**
 * GET /api/zeladoria/time-series
 * Série temporal
 */
export async function timeSeries(req, res) {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  
  const cacheKey = `zeladoria:timeSeries:${startDate || 'all'}:${endDate || 'all'}:v2`;
  return withCache(cacheKey, 3600, res, async () => {
    const filter = {
      dataCriacaoIso: { $ne: null }
    };
    
    if (startDate) filter.dataCriacaoIso.$gte = startDate;
    if (endDate) filter.dataCriacaoIso.$lte = endDate;
    
    const rows = await Zeladoria.find(filter)
      .select('dataCriacaoIso')
      .lean();
    
    const map = new Map();
    for (const r of rows) {
      if (r.dataCriacaoIso) {
        map.set(r.dataCriacaoIso, (map.get(r.dataCriacaoIso) || 0) + 1);
      }
    }
    
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });
}

/**
 * GET /api/zeladoria/records
 * Lista de registros com paginação
 */
export async function records(req, res) {
  const page = parseInt(req.query.page || '1', 10);
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  const skip = (page - 1) * limit;
  
  const status = req.query.status;
  const categoria = req.query.categoria;
  const departamento = req.query.departamento;
  
  const filter = {};
  if (status) filter.status = status;
  if (categoria) filter.categoria = categoria;
  if (departamento) filter.departamento = departamento;
  
  const cacheKey = `zeladoria:records:${JSON.stringify(filter)}:${page}:${limit}:v2`;
  return withCache(cacheKey, 300, res, async () => {
    const [data, total] = await Promise.all([
      Zeladoria.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Zeladoria.countDocuments(filter)
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
  });
}

/**
 * GET /api/zeladoria/stats
 * Estatísticas gerais
 */
export async function stats(req, res) {
  const cacheKey = 'zeladoria:stats:v2';
  return withCache(cacheKey, 3600, res, async () => {
    const [total, fechados, abertos, comApoios] = await Promise.all([
      Zeladoria.countDocuments(),
      Zeladoria.countDocuments({ status: 'FECHADO' }),
      Zeladoria.countDocuments({ status: { $in: ['ABERTO', 'NOVO', 'ATENDIMENTO'] } }),
      Zeladoria.countDocuments({ apoios: { $gt: 0 } })
    ]);
    
    // Tempo médio de resolução (apenas fechados com datas)
    const fechadosComDatas = await Zeladoria.find({
      status: 'FECHADO',
      dataCriacaoIso: { $ne: null },
      dataConclusaoIso: { $ne: null }
    })
    .select('dataCriacaoIso dataConclusaoIso')
    .lean();
    
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
  });
}

/**
 * GET /api/zeladoria/by-status-month
 * Status por mês
 */
export async function byStatusMonth(req, res) {
  const cacheKey = 'zeladoria:byStatusMonth:v2';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await Zeladoria.find({
      dataCriacaoIso: { $ne: null }
    })
    .select('status dataCriacaoIso')
    .lean();
    
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
  });
}

/**
 * GET /api/zeladoria/by-categoria-departamento
 * Categoria por Departamento
 */
export async function byCategoriaDepartamento(req, res) {
  const cacheKey = 'zeladoria:byCategoriaDepartamento:v2';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await Zeladoria.aggregate([
      { $group: { _id: { categoria: '$categoria', departamento: '$departamento' }, count: { $sum: 1 } } }
    ]);
    
    const result = {};
    for (const r of rows) {
      const categoria = r._id.categoria || 'Não informado';
      const departamento = r._id.departamento || 'Não informado';
      
      if (!result[categoria]) result[categoria] = {};
      result[categoria][departamento] = r.count;
    }
    
    return result;
  });
}

/**
 * GET /api/zeladoria/geographic
 * Dados geográficos (bairros com coordenadas)
 */
export async function geographic(req, res) {
  const cacheKey = 'zeladoria:geographic:v2';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await Zeladoria.find({
      latitude: { $ne: null },
      longitude: { $ne: null },
      bairro: { $ne: null }
    })
    .select('bairro latitude longitude categoria status')
    .lean();
    
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
  });
}

/**
 * GET /api/zeladoria/map
 * Dados para mapa (todas as demandas individuais com coordenadas)
 */
export async function map(req, res) {
  const cacheKey = 'zeladoria:map:v2';
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await Zeladoria.find({
      latitude: { $ne: null, $exists: true },
      longitude: { $ne: null, $exists: true }
    })
    .select('protocoloEmpresa latitude longitude categoria status bairro endereco dataCriacaoIso dataConclusaoIso departamento apoios')
    .lean();
    
    // Limites de Duque de Caxias para validação
    const CAXIAS_BOUNDS = {
      north: -22.65,
      south: -22.90,
      east: -43.15,
      west: -43.45
    };
    
    // Função para validar coordenadas
    const validateCoords = (lat, lng) => {
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return false;
      return lat >= CAXIAS_BOUNDS.south && lat <= CAXIAS_BOUNDS.north &&
             lng >= CAXIAS_BOUNDS.west && lng <= CAXIAS_BOUNDS.east;
    };
    
    // Função para identificar distrito pelo bairro
    const getDistrito = (bairro) => {
      if (!bairro) return null;
      const bairroLower = bairro.trim().toLowerCase();
      
      const distritos = {
        '1º Distrito - Duque de Caxias (Sede)': ['centro', 'sarapuí', 'gramacho', 'parque beira-mar', 'vila meriti'],
        '2º Distrito - Campos Elíseos': ['campos elíseos', 'pilar', 'saracuruna', 'são bento'],
        '3º Distrito - Imbariê': ['imbariê', 'santa lúcia', 'santa cruz da serra'],
        '4º Distrito - Xerém': ['xerém', 'mantiquira', 'capivari']
      };
      
      for (const [distrito, bairros] of Object.entries(distritos)) {
        if (bairros.some(b => bairroLower.includes(b))) {
          return distrito;
        }
      }
      return null;
    };
    
    return rows.map(r => {
      const lat = parseFloat(r.latitude);
      const lng = parseFloat(r.longitude);
      const isValid = validateCoords(lat, lng);
      
      return {
        id: r._id?.toString() || r.protocoloEmpresa,
        protocolo: r.protocoloEmpresa || 'N/A',
        latitude: lat,
        longitude: lng,
        categoria: r.categoria || 'Não informado',
        status: r.status || 'Não informado',
        bairro: r.bairro || 'Não informado',
        endereco: r.endereco || 'Não informado',
        dataCriacao: r.dataCriacaoIso || r.dataCriacao || 'N/A',
        dataConclusao: r.dataConclusaoIso || r.dataConclusao || null,
        departamento: r.departamento || 'Não informado',
        apoios: r.apoios || 0,
        distrito: getDistrito(r.bairro),
        coordenadasValidas: isValid
      };
    }).filter(r => !isNaN(r.latitude) && !isNaN(r.longitude));
  });
}

