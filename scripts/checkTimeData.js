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
  console.log('🔍 Verificando dados de tempo no banco...\n');
  
  // Total de registros
  const total = await prisma.record.count();
  console.log(`📊 Total de registros: ${total}`);
  
  // Registros com dataCriacaoIso
  const comDataCriacao = await prisma.record.count({
    where: { dataCriacaoIso: { not: null } }
  });
  console.log(`📅 Registros com dataCriacaoIso: ${comDataCriacao} (${((comDataCriacao/total)*100).toFixed(1)}%)`);
  
  // Registros com dataConclusaoIso
  const comDataConclusao = await prisma.record.count({
    where: { dataConclusaoIso: { not: null } }
  });
  console.log(`✅ Registros com dataConclusaoIso: ${comDataConclusao} (${((comDataConclusao/total)*100).toFixed(1)}%)`);
  
  // Registros com tempoDeResolucaoEmDias
  const comTempoResolucao = await prisma.record.count({
    where: { tempoDeResolucaoEmDias: { not: null } }
  });
  console.log(`⏱️ Registros com tempoDeResolucaoEmDias: ${comTempoResolucao} (${((comTempoResolucao/total)*100).toFixed(1)}%)`);
  
  // Registros que podem calcular tempo médio
  const podeCalcular = await prisma.record.count({
    where: {
      OR: [
        { tempoDeResolucaoEmDias: { not: null } },
        { 
          AND: [
            { dataCriacaoIso: { not: null } },
            { dataConclusaoIso: { not: null } }
          ]
        }
      ]
    }
  });
  console.log(`🔢 Registros que podem calcular tempo médio: ${podeCalcular} (${((podeCalcular/total)*100).toFixed(1)}%)`);
  
  // Registros com dataDaCriacao
  const comDataDaCriacao = await prisma.record.count({
    where: { dataDaCriacao: { not: null } }
  });
  console.log(`📅 Registros com dataDaCriacao: ${comDataDaCriacao} (${((comDataDaCriacao/total)*100).toFixed(1)}%)`);
  
  // Amostra de registros
  console.log('\n📋 Amostra de 5 registros:');
  const amostra = await prisma.record.findMany({
    take: 5,
    select: {
      dataCriacaoIso: true,
      dataDaCriacao: true,
      dataConclusaoIso: true,
      dataDaConclusao: true,
      tempoDeResolucaoEmDias: true,
      data: true
    }
  });
  
  amostra.forEach((r, idx) => {
    console.log(`\n${idx + 1}.`);
    console.log(`   dataCriacaoIso: ${r.dataCriacaoIso || 'NULL'}`);
    console.log(`   dataDaCriacao: ${r.dataDaCriacao || 'NULL'}`);
    console.log(`   dataConclusaoIso: ${r.dataConclusaoIso || 'NULL'}`);
    console.log(`   dataDaConclusao: ${r.dataDaConclusao || 'NULL'}`);
    console.log(`   tempoDeResolucaoEmDias: ${r.tempoDeResolucaoEmDias || 'NULL'}`);
    if (r.data && typeof r.data === 'object') {
      console.log(`   data.data_da_criacao: ${r.data.data_da_criacao || 'NULL'}`);
    }
  });
  
  // Verificar distribuição por mês
  console.log('\n📅 Distribuição por mês (últimos 12 meses):');
  const rows = await prisma.record.findMany({
    where: { dataCriacaoIso: { not: null } },
    select: { dataCriacaoIso: true }
  });
  
  const monthMap = new Map();
  for (const r of rows) {
    const monthKey = r.dataCriacaoIso.slice(0, 7);
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
  }
  
  const sortedMonths = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12);
  
  sortedMonths.forEach(([month, count]) => {
    console.log(`   ${month}: ${count} registros`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

