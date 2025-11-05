import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function copyRecords(sourceDb, targetDb) {
  console.log(`\n📥 Copiando registros de ${sourceDb} para ${targetDb}...`);
  
  // Conectar ao banco de origem
  process.env.DATABASE_URL = `file:${sourceDb}`;
  const sourcePrisma = new PrismaClient();
  
  // Conectar ao banco de destino
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${targetDb}`;
  const targetPrisma = new PrismaClient();
  
  try {
    // Ler todos os registros da origem
    const sourceRecords = await sourcePrisma.record.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Registros na origem: ${sourceRecords.length}`);
    
    // Verificar quantos já existem no destino
    const targetCount = await targetPrisma.record.count();
    console.log(`📊 Registros no destino: ${targetCount}`);
    
    if (targetCount === 0) {
      // Inserir todos os registros
      console.log('➕ Inserindo todos os registros...');
      const batchSize = 500;
      let inserted = 0;
      
      for (let i = 0; i < sourceRecords.length; i += batchSize) {
        const batch = sourceRecords.slice(i, i + batchSize);
        await targetPrisma.record.createMany({
          data: batch.map(r => ({
            data: r.data,
            secretaria: r.secretaria,
            setor: r.setor,
            tipo: r.tipo,
            categoria: r.categoria,
            bairro: r.bairro,
            status: r.status,
            dataIso: r.dataIso,
            uac: r.uac,
            responsavel: r.responsavel,
            canal: r.canal,
            prioridade: r.prioridade,
            servidor: r.servidor,
            tema: r.tema,
            assunto: r.assunto,
            dataConclusaoIso: r.dataConclusaoIso,
            createdAt: r.createdAt
          }))
        });
        inserted += batch.length;
        console.log(`   Inseridos: ${inserted}/${sourceRecords.length}`);
      }
      
      const finalCount = await targetPrisma.record.count();
      console.log(`✅ Consolidação concluída! Total no destino: ${finalCount}`);
    } else {
      console.log('⚠️  Banco de destino já possui registros. Pulando cópia.');
      console.log('💡 Para sobrescrever, delete o banco de destino primeiro.');
    }
  } catch (error) {
    console.error('❌ Erro ao copiar registros:', error.message);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
    process.env.DATABASE_URL = originalUrl;
  }
}

async function main() {
  const db1 = path.join(projectRoot, 'prisma', 'dev.db');
  const db2 = path.join(projectRoot, 'prisma', 'prisma', 'dev.db');
  
  console.log('🔍 Consolidação de bancos de dados\n');
  
  // Verificar qual banco tem mais dados
  process.env.DATABASE_URL = `file:${db1}`;
  const prisma1 = new PrismaClient();
  const count1 = await prisma1.record.count().catch(() => 0);
  await prisma1.$disconnect();
  
  process.env.DATABASE_URL = `file:${db2}`;
  const prisma2 = new PrismaClient();
  const count2 = await prisma2.record.count().catch(() => 0);
  await prisma2.$disconnect();
  
  console.log(`📊 prisma/dev.db: ${count1} registros`);
  console.log(`📊 prisma/prisma/dev.db: ${count2} registros\n`);
  
  // Se db1 está vazio mas db2 tem dados, copiar db2 para db1
  if (count1 === 0 && count2 > 0) {
    console.log('💡 prisma/dev.db está vazio, copiando dados de prisma/prisma/dev.db...');
    await copyRecords(db2, db1);
  } else if (count1 > 0 && count2 === 0) {
    console.log('💡 prisma/prisma/dev.db está vazio, copiando dados de prisma/dev.db...');
    await copyRecords(db1, db2);
  } else if (count1 > 0 && count2 > 0) {
    console.log('⚠️  Ambos os bancos têm dados. Mantendo prisma/dev.db como principal.');
    if (count2 > count1) {
      console.log('💡 prisma/prisma/dev.db tem mais registros. Recomendação: copiar para prisma/dev.db');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      // Para automação, vamos copiar automaticamente se db2 tem mais
      await copyRecords(db2, db1);
      readline.close();
    }
  }
  
  // Verificar resultado final
  process.env.DATABASE_URL = `file:${db1}`;
  const finalPrisma = new PrismaClient();
  const finalCount = await finalPrisma.record.count();
  await finalPrisma.$disconnect();
  
  console.log(`\n✅ Banco principal (prisma/dev.db) agora tem: ${finalCount} registros`);
}

main().catch(console.error);

