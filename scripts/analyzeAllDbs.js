import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function analyzeDb(dbPath, name) {
  if (!existsSync(dbPath)) {
    return null;
  }

  const stats = statSync(dbPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  process.env.DATABASE_URL = `file:${dbPath}`;
  const prisma = new PrismaClient();
  
  try {
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    
    let recordCount = 0;
    if (tables.some(t => t.name === 'Record')) {
      recordCount = await prisma.record.count();
    }
    
    return {
      name,
      path: dbPath,
      sizeMB: parseFloat(sizeMB),
      tables: tables.map(t => t.name),
      recordCount
    };
  } catch (error) {
    return { name, path: dbPath, sizeMB: parseFloat(sizeMB), error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🔍 Analisando todos os bancos de dados...\n');

const db1 = path.join(projectRoot, 'prisma', 'dev.db');
const db2 = path.join(projectRoot, 'prisma', 'prisma', 'dev.db');

const results = await Promise.all([
  analyzeDb(db1, 'prisma/dev.db'),
  analyzeDb(db2, 'prisma/prisma/dev.db')
]);

console.log('📊 RESULTADOS:\n');
for (const result of results) {
  if (!result) continue;
  console.log(`📁 ${result.name}:`);
  console.log(`   Caminho: ${result.path}`);
  console.log(`   Tamanho: ${result.sizeMB} MB`);
  if (result.error) {
    console.log(`   ❌ Erro: ${result.error}`);
  } else {
    console.log(`   Tabelas: ${result.tables.join(', ') || 'Nenhuma'}`);
    console.log(`   📈 Registros: ${result.recordCount}`);
  }
  console.log('');
}

// Encontrar o banco com mais registros
const validDbs = results.filter(r => r && !r.error && r.recordCount !== undefined);
if (validDbs.length > 0) {
  const maiorDb = validDbs.reduce((a, b) => a.recordCount > b.recordCount ? a : b);
  console.log(`\n✅ Banco com mais registros: ${maiorDb.name} (${maiorDb.recordCount} registros)`);
  console.log(`💡 Recomendação: Use este banco como principal`);
  
  // Verificar qual banco está configurado
  const currentDb = process.env.DATABASE_URL?.replace('file:', '') || '';
  const resolvedCurrent = path.isAbsolute(currentDb) ? currentDb : path.resolve(projectRoot, currentDb);
  console.log(`\n📁 DATABASE_URL atual aponta para: ${resolvedCurrent}`);
  console.log(`📁 Banco principal deveria ser: ${maiorDb.path}`);
  
  if (resolvedCurrent !== maiorDb.path) {
    console.log(`\n⚠️  ATENÇÃO: O servidor está apontando para o banco errado!`);
    console.log(`💡 Corrija o .env para: DATABASE_URL="file:${path.relative(projectRoot, maiorDb.path)}"`);
  }
}

