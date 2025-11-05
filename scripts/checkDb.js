import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
  try {
    // Verificar tabelas
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    
    console.log('📊 Tabelas encontradas no banco:');
    console.log(JSON.stringify(tables, null, 2));
    
    // Verificar se a tabela Record existe
    const recordExists = tables.some(t => t.name === 'Record');
    
    if (!recordExists) {
      console.log('\n❌ Tabela Record NÃO encontrada!');
      console.log('💡 Aplicando schema...');
      
      // Tentar aplicar o schema
      const { execSync } = await import('child_process');
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit', cwd: process.cwd() });
      
      // Verificar novamente
      const tablesAfter = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `;
      console.log('\n📊 Tabelas após aplicar schema:');
      console.log(JSON.stringify(tablesAfter, null, 2));
    } else {
      console.log('\n✅ Tabela Record encontrada!');
      
      // Verificar contagem
      const count = await prisma.record.count();
      console.log(`📈 Total de registros: ${count}`);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();

