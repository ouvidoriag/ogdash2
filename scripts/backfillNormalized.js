import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && `${v}`.trim() !== '') return `${v}`.trim();
  }
  return null;
}

function toIsoDate(val) {
  if (!val) return null;
  const s = `${val}`.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

async function main() {
  const total = await prisma.record.count();
  console.log(`📊 Registros totais: ${total}`);
  const pageSize = 1000;
  
  for (let skip = 0; skip < total; skip += pageSize) {
    const rows = await prisma.record.findMany({ skip, take: pageSize });
    const updates = [];
    
    for (const r of rows) {
      // MongoDB já armazena JSON diretamente, não precisa fazer parse
      const data = r.data || {};
      
      // Mapeamento direto das colunas da planilha atual
      const protocolo = pick(data, ['protocolo']);
      const dataDaCriacao = pick(data, ['data_da_criacao']);
      const statusDemanda = pick(data, ['status_demanda']);
      const prazoRestante = pick(data, ['prazo_restante']);
      const dataDaConclusao = pick(data, ['data_da_conclusao']);
      const tempoDeResolucaoEmDias = pick(data, ['tempo_de_resolucao_em_dias']);
      const prioridade = pick(data, ['prioridade']);
      const tipoDeManifestacao = pick(data, ['tipo_de_manifestacao']);
      const tema = pick(data, ['tema']);
      const assunto = pick(data, ['assunto']);
      const canal = pick(data, ['canal']);
      const endereco = pick(data, ['endereco']);
      const unidadeCadastro = pick(data, ['unidade_cadastro']);
      const unidadeSaude = pick(data, ['unidade_saude']);
      const status = pick(data, ['status']);
      const servidor = pick(data, ['servidor']);
      const responsavel = pick(data, ['responsavel']);
      const verificado = pick(data, ['verificado']);
      const orgaos = pick(data, ['orgaos']);
      
      // Normalizar datas para formato ISO
      const dataCriacaoIso = toIsoDate(dataDaCriacao);
      const dataConclusaoIso = toIsoDate(dataDaConclusao);

      updates.push(prisma.record.update({
        where: { id: r.id },
        data: {
          protocolo,
          dataDaCriacao,
          statusDemanda,
          prazoRestante,
          dataDaConclusao,
          tempoDeResolucaoEmDias,
          prioridade,
          tipoDeManifestacao,
          tema,
          assunto,
          canal,
          endereco,
          unidadeCadastro,
          unidadeSaude,
          status,
          servidor,
          responsavel,
          verificado,
          orgaos,
          dataCriacaoIso,
          dataConclusaoIso
        }
      }));
    }
    
    await Promise.all(updates);
    console.log(`✅ Atualizados: ${Math.min(skip + pageSize, total)}/${total} (${Math.round(Math.min(skip + pageSize, total)/total*100)}%)`);
  }
  
  console.log('✅ Backfill concluído!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });


