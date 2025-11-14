/**
 * Controller para /api/distinct
 * Valores distintos de um campo
 */

import { safeQuery } from '../../utils/responseHelper.js';
import { optimizedDistinct } from '../../utils/queryOptimizer.js';
import { getNormalizedField } from '../../utils/fieldMapper.js';

/**
 * GET /api/distinct
 */
export async function getDistinct(req, res, prisma) {
  return safeQuery(res, async () => {
    const field = String(req.query.field ?? '').trim();
    if (!field) {
      return res.status(400).json({ error: 'field required' });
    }
    
    // Normalizar campo
    const normalizedField = getNormalizedField(field);
    if (!normalizedField) {
      return res.status(400).json({ error: `Campo inválido: ${field}` });
    }
    
    // Construir filtros opcionais
    const where = {};
    if (req.query.servidor) where.servidor = req.query.servidor;
    if (req.query.unidadeCadastro) where.unidadeCadastro = req.query.unidadeCadastro;
    
    // Usar função otimizada
    const values = await optimizedDistinct(prisma, normalizedField, where, {
      limit: 1000,
      dateFilter: true
    });
    
    return values;
  });
}
