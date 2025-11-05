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
  console.log(`Registros totais: ${total}`);
  const pageSize = 1000;
  for (let skip = 0; skip < total; skip += pageSize) {
    const rows = await prisma.record.findMany({ skip, take: pageSize, orderBy: { id: 'asc' } });
    const updates = [];
    for (const r of rows) {
      let data;
      try { data = JSON.parse(r.data); } catch { data = {}; }
      // Mapeamento antigo + novos nomes da planilha atual
      const secretaria = pick(data, [
        'Secretaria', 'Órgão', 'Orgao', 'Secretaria/Órgão',
        'orgaos', 'unidade_cadastro'
      ]);
      const setor = pick(data, [
        'Setor', 'Departamento', 'Unidade',
        'unidade_saude', 'unidade_cadastro'
      ]);
      const tipo = pick(data, [
        'Tipo', 'Tipo Manifestação', 'TipoManifestacao',
        'tipo_de_manifestacao'
      ]);
      const categoria = pick(data, [
        'Categoria', 'Assunto', 'Tema',
        'tema', 'assunto'
      ]);
      const bairro = pick(data, [
        'Bairro', 'Localidade' // planilha atual não traz bairro explicitamente
      ]);
      const status = pick(data, [
        'Status', 'Situação', 'Situacao',
        'status_demanda', 'status'
      ]);
      const dataIso = toIsoDate(pick(data, [
        'Data', 'Data Abertura', 'DataAbertura', 'Abertura',
        'data_da_criacao'
      ]));
      
      // Novos campos alinhados com painel Looker Studio
      const uac = pick(data, [
        'UAC', 'Unidade de Atendimento', 'Unidade de Atendimento ao Cidadão',
        'unidade_cadastro', 'Unidade Cadastro'
      ]);
      const responsavel = pick(data, [
        'Responsável', 'responsavel', 'Ouvidoria Responsável',
        'Responsável pelo Tratamento', 'Ouvidoria'
      ]);
      const canal = pick(data, [
        'Canal', 'canal', 'Canal de Entrada', 'Canal de Atendimento'
      ]);
      const prioridade = pick(data, [
        'Prioridade', 'prioridade', 'Prioridade da Demanda'
      ]);
      
      // Campos adicionais para visualizações do Looker Studio
      const servidor = pick(data, [
        'Servidor', 'servidor', 'Cadastrante', 'cadastrante'
      ]);
      
      // Tema e Assunto podem vir do mesmo campo ou separados
      const tema = pick(data, [
        'Tema', 'tema', 'Categoria', 'categoria'
      ]);
      const assunto = pick(data, [
        'Assunto', 'assunto', 'Categoria', 'categoria'
      ]);
      
      // Data de conclusão para calcular tempo médio
      const dataConclusaoIso = toIsoDate(pick(data, [
        'Data Conclusão', 'Data Conclusao', 'Data da Conclusão', 'Data da Conclusao',
        'data_da_conclusao', 'DataConclusao'
      ]));

      updates.push(prisma.record.update({
        where: { id: r.id },
        data: { secretaria, setor, tipo, categoria, bairro, status, dataIso, uac, responsavel, canal, prioridade, servidor, tema, assunto, dataConclusaoIso }
      }));
    }
    await prisma.$transaction(updates, { timeout: 60000 });
    console.log(`Atualizados: ${Math.min(skip + pageSize, total)}/${total}`);
  }
  console.log('Backfill concluído.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });


