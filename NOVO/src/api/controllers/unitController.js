/**
 * Controller para /api/unit/:unitName
 * Dados filtrados por unidade (UAC ou Responsável)
 */

import { withCache } from '../../utils/responseHelper.js';

/**
 * GET /api/unit/:unitName
 */
export async function getUnit(req, res, prisma) {
  const unitName = decodeURIComponent(req.params.unitName);
  const key = `unit:${unitName}:v2`;
  
  return withCache(key, 3600, res, async () => {
    // Buscar registros que contenham o nome em qualquer um dos campos indexados
    const allRecords = await prisma.record.findMany({
      where: {
        OR: [
          { unidadeCadastro: { contains: unitName } },
          { responsavel: { contains: unitName } },
          { orgaos: { contains: unitName } },
          { unidadeSaude: { contains: unitName } }
        ]
      },
      select: { assunto: true, tipoDeManifestacao: true, unidadeCadastro: true, responsavel: true, orgaos: true, unidadeSaude: true },
      take: 5000
    });
    
    // Filtrar em memória para case-insensitive
    const searchLower = unitName.toLowerCase();
    const records = allRecords.filter(r => {
      const unidadeCadastro = (r.unidadeCadastro || '').toLowerCase();
      const responsavel = (r.responsavel || '').toLowerCase();
      const orgaos = (r.orgaos || '').toLowerCase();
      const unidadeSaude = (r.unidadeSaude || '').toLowerCase();
      
      return unidadeCadastro.includes(searchLower) || 
             responsavel.includes(searchLower) || 
             orgaos.includes(searchLower) || 
             unidadeSaude.includes(searchLower);
    });
    
    // Agrupar por assunto e tipo
    const assuntoMap = new Map();
    const tipoMap = new Map();
    
    for (const r of records) {
      const assunto = r.assunto || 'Não informado';
      const tipo = r.tipoDeManifestacao || 'Não informado';
      
      assuntoMap.set(assunto, (assuntoMap.get(assunto) || 0) + 1);
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    }
    
    const assuntos = Array.from(assuntoMap.entries())
      .map(([assunto, count]) => ({ assunto, quantidade: count }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const tipos = Array.from(tipoMap.entries())
      .map(([tipo, count]) => ({ tipo, quantidade: count }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    return { assuntos, tipos };
  }, prisma);
}

