/**
 * Controller de SLA
 * /api/sla/summary
 */

import { withCache } from '../../utils/responseHelper.js';
import { getDataCriacao, isConcluido, getTempoResolucaoEmDias, addMesFilter } from '../../utils/dateUtils.js';

/**
 * GET /api/sla/summary
 * Resumo de SLA: concluídos, verde claro (0-30), amarelo (31-60), vermelho (61+)
 */
export async function slaSummary(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  
  const key = servidor ? `sla:servidor:${servidor}:v4` :
              unidadeCadastro ? `sla:uac:${unidadeCadastro}:v4` :
              meses ? `sla:meses:${meses.sort().join(',')}:v4` :
              'sla:v4';
  
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Adicionar filtro de meses se fornecido
    addMesFilter(where, meses);
    
    const today = new Date();
    
    // OTIMIZAÇÃO: Adicionar filtro de data (últimos 24 meses) para melhor performance
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setMonth(today.getMonth() - 24);
    const minDateStr = twoYearsAgo.toISOString().slice(0, 10);
    
    // Adicionar filtro de data se não houver filtro de meses
    if (!meses || meses.length === 0) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { dataCriacaoIso: { gte: minDateStr } },
            { dataDaCriacao: { contains: today.getFullYear().toString() } },
            { dataDaCriacao: { contains: (today.getFullYear() - 1).toString() } }
          ]
        }
      ];
    }
    
    // Buscar campos necessários usando sistema global de datas
    const rows = await prisma.record.findMany({ 
      where: { ...where, dataDaCriacao: { not: null } },
      select: { 
        dataCriacaoIso: true,
        dataDaCriacao: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        tempoDeResolucaoEmDias: true,
        status: true,
        statusDemanda: true,
        tipoDeManifestacao: true,
        data: true
      },
      take: 100000 // Limite de segurança para evitar timeout
    });
    
    // Buckets: concluídos (verde escuro), verde claro (0-30), amarelo (31-60), vermelho (61+)
    const buckets = { 
      concluidos: 0,      // Verde escuro
      verdeClaro: 0,      // 0-30 dias
      amarelo: 0,         // 31-60 dias
      vermelho: 0         // 61+ dias (atraso)
    };

    for (const r of rows) {
      // Se está concluído, marcar como verde escuro
      if (isConcluido(r)) {
        buckets.concluidos += 1;
        continue;
      }
      
      // Se não está concluído, calcular tempo de resolução usando sistema global
      const tempoResolucao = getTempoResolucaoEmDias(r, true);
      
      // Se não conseguir calcular pelo tempo, calcular dias desde criação
      let days = tempoResolucao;
      if (days === null) {
        const dataCriacao = getDataCriacao(r);
        if (dataCriacao) {
          const d = new Date(dataCriacao + 'T00:00:00');
          if (!isNaN(d.getTime())) {
            days = Math.floor((today - d) / (1000*60*60*24));
          }
        }
      }
      
      if (days === null) continue;
      
      // Classificar por faixa de dias
      if (days <= 30) {
        buckets.verdeClaro += 1;
      } else if (days <= 60) {
        buckets.amarelo += 1;
      } else {
        buckets.vermelho += 1;
      }
    }

    return buckets;
  }, prisma);
}

