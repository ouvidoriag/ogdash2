/**
 * Controller para /api/records
 * Listagem paginada de registros
 */

import { safeQuery } from '../../utils/responseHelper.js';

/**
 * GET /api/records
 */
export async function getRecords(req, res, prisma) {
  return safeQuery(res, async () => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Math.min(Number(req.query.pageSize ?? 50), 500);
    const skip = (page - 1) * pageSize;
    
    // Construir filtros
    const where = {};
    
    // Filtros opcionais
    if (req.query.servidor) where.servidor = req.query.servidor;
    if (req.query.unidadeCadastro) where.unidadeCadastro = req.query.unidadeCadastro;
    if (req.query.status) where.status = req.query.status;
    if (req.query.tema) where.tema = req.query.tema;
    if (req.query.assunto) where.assunto = req.query.assunto;
    
    // Buscar registros e total em paralelo
    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.record.count({
        where: Object.keys(where).length > 0 ? where : undefined
      })
    ]);
    
    return {
      data: records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  });
}
