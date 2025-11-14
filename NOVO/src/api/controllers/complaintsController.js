/**
 * Controller para /api/complaints-denunciations
 * Reclamações e denúncias
 */

import { withCache } from '../../utils/responseHelper.js';

/**
 * GET /api/complaints-denunciations
 */
export async function getComplaints(req, res, prisma) {
  const key = 'complaints:v2';
  
  return withCache(key, 3600, res, async () => {
    // Buscar variações do texto para cobrir diferentes grafias
    const allRecords = await prisma.record.findMany({
      where: {
        OR: [
          { tipoDeManifestacao: { contains: 'Reclamação' } },
          { tipoDeManifestacao: { contains: 'Reclamacao' } },
          { tipoDeManifestacao: { contains: 'Reclama' } },
          { tipoDeManifestacao: { contains: 'Denúncia' } },
          { tipoDeManifestacao: { contains: 'Denuncia' } },
          { tipoDeManifestacao: { contains: 'Denún' } }
        ]
      },
      select: { assunto: true, tipoDeManifestacao: true },
      take: 5000
    });
    
    // Filtrar em memória para case-insensitive
    const records = allRecords.filter(r => {
      const tipo = (r.tipoDeManifestacao || '').toLowerCase();
      return tipo.includes('reclamação') || tipo.includes('reclamacao') || 
             tipo.includes('denúncia') || tipo.includes('denuncia');
    });
    
    const assuntoMap = new Map();
    const tipoMap = new Map();
    
    for (const r of records) {
      const tipo = r.tipoDeManifestacao || 'Não informado';
      const assunto = r.assunto || 'Não informado';
      
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

