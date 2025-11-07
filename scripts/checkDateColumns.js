import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Configurar DATABASE_URL como no server.js
let mongodbUrl = process.env.MONGODB_ATLAS_URL;
if (!mongodbUrl) {
  console.error('❌ ERRO: MONGODB_ATLAS_URL não está definido!');
  process.exit(1);
}

if (!mongodbUrl.includes('serverSelectionTimeoutMS')) {
  const separator = mongodbUrl.includes('?') ? '&' : '?';
  mongodbUrl += `${separator}serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000&retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false`;
}

process.env.DATABASE_URL = mongodbUrl;

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando colunas de data no banco de dados...\n');
  
  // Buscar alguns registros com todas as colunas de data
  const amostra = await prisma.record.findMany({
    take: 10,
    select: {
      id: true,
      dataCriacaoIso: true,
      dataDaCriacao: true,
      dataConclusaoIso: true,
      dataDaConclusao: true,
      tempoDeResolucaoEmDias: true,
      data: true
    }
  });
  
  console.log(`📊 Amostra de ${amostra.length} registros:\n`);
  
  amostra.forEach((r, idx) => {
    console.log(`\n${idx + 1}. ID: ${r.id.substring(0, 8)}...`);
    console.log(`   dataCriacaoIso: ${r.dataCriacaoIso || 'NULL'} (tipo: ${typeof r.dataCriacaoIso})`);
    console.log(`   dataDaCriacao: ${r.dataDaCriacao || 'NULL'} (tipo: ${typeof r.dataDaCriacao}, constructor: ${r.dataDaCriacao?.constructor?.name || 'N/A'})`);
    console.log(`   dataConclusaoIso: ${r.dataConclusaoIso || 'NULL'} (tipo: ${typeof r.dataConclusaoIso})`);
    console.log(`   dataDaConclusao: ${r.dataDaConclusao || 'NULL'} (tipo: ${typeof r.dataDaConclusao}, constructor: ${r.dataDaConclusao?.constructor?.name || 'N/A'})`);
    console.log(`   tempoDeResolucaoEmDias: ${r.tempoDeResolucaoEmDias || 'NULL'} (tipo: ${typeof r.tempoDeResolucaoEmDias})`);
    
    if (r.data && typeof r.data === 'object') {
      console.log(`   data.data_da_criacao: ${r.data.data_da_criacao || 'NULL'} (tipo: ${typeof r.data.data_da_criacao})`);
      console.log(`   data.data_da_conclusao: ${r.data.data_da_conclusao || 'NULL'} (tipo: ${typeof r.data.data_da_conclusao})`);
      console.log(`   data.tempo_de_resolucao_em_dias: ${r.data.tempo_de_resolucao_em_dias || 'NULL'} (tipo: ${typeof r.data.tempo_de_resolucao_em_dias})`);
    }
  });
  
  // Verificar distribuição de tipos
  console.log('\n\n📊 Análise de tipos de dados:\n');
  
  const tiposDataDaCriacao = new Map();
  const tiposDataDaConclusao = new Map();
  
  for (const r of amostra) {
    const tipoCriacao = r.dataDaCriacao ? 
      (r.dataDaCriacao instanceof Date ? 'Date' : typeof r.dataDaCriacao) : 'null';
    tiposDataDaCriacao.set(tipoCriacao, (tiposDataDaCriacao.get(tipoCriacao) || 0) + 1);
    
    const tipoConclusao = r.dataDaConclusao ? 
      (r.dataDaConclusao instanceof Date ? 'Date' : typeof r.dataDaConclusao) : 'null';
    tiposDataDaConclusao.set(tipoConclusao, (tiposDataDaConclusao.get(tipoConclusao) || 0) + 1);
  }
  
  console.log('Tipos de dataDaCriacao:');
  tiposDataDaCriacao.forEach((count, tipo) => {
    console.log(`  ${tipo}: ${count}`);
  });
  
  console.log('\nTipos de dataDaConclusao:');
  tiposDataDaConclusao.forEach((count, tipo) => {
    console.log(`  ${tipo}: ${count}`);
  });
  
  // Verificar range de datas
  console.log('\n\n📅 Range de datas:\n');
  
  const todasDatas = [];
  for (const r of amostra) {
    if (r.dataDaCriacao) {
      let dateStr = null;
      if (r.dataDaCriacao instanceof Date) {
        dateStr = r.dataDaCriacao.toISOString().slice(0, 10);
      } else if (typeof r.dataDaCriacao === 'string') {
        dateStr = r.dataDaCriacao.slice(0, 10);
      }
      if (dateStr) todasDatas.push(dateStr);
    }
  }
  
  if (todasDatas.length > 0) {
    todasDatas.sort();
    console.log(`Primeira data: ${todasDatas[0]}`);
    console.log(`Última data: ${todasDatas[todasDatas.length - 1]}`);
    console.log(`Total de datas únicas: ${new Set(todasDatas).size}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

