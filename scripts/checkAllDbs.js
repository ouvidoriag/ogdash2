import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function checkDb(dbPath, name) {
  if (!existsSync(dbPath)) {
    console.log(`\n❌ ${name}: Não encontrado em ${dbPath}`);
    return;
  }

  const stats = statSync(dbPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📊 ${name}:`);
  console.log(`   Caminho: ${dbPath}`);
  console.log(`   Tamanho: ${sizeMB} MB`);
  
  // Criar Prisma Client temporário para este banco
  process.env.DATABASE_URL = `file:${dbPath}`;
  const prisma = new PrismaClient();
  
  try {
    // Verificar tabelas
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    console.log(`   Tabelas: ${tables.map(t => t.name).join(', ')}`);
    
    // Se tem tabela Record, contar registros
    const hasRecord = tables.some(t => t.name === 'Record');
    if (hasRecord) {
      const count = await prisma.record.count();
      console.log(`   📈 Total de registros: ${count}`);
      
      // Mostrar alguns exemplos de campos normalizados
      if (count > 0) {
        const sample = await prisma.record.findFirst({
          select: {
            id: true,
            secretaria: true,
            setor: true,
            tipo: true,
            dataIso: true
          }
        });
        console.log(`   Exemplo: ID=${sample.id}, Secretaria=${sample.secretaria || 'N/A'}, Tipo=${sample.tipo || 'N/A'}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🔍 Verificando todos os bancos de dados encontrados...\n');

// Banco principal
const db1 = path.join(projectRoot, 'prisma', 'dev.db');
await checkDb(db1, 'Banco 1: prisma/dev.db');

// Banco secundário (dentro de prisma/prisma)
const db2 = path.join(projectRoot, 'prisma', 'prisma', 'dev.db');
await checkDb(db2, 'Banco 2: prisma/prisma/dev.db');

// Verificar DATABASE_URL atual
console.log(`\n📁 DATABASE_URL atual: ${process.env.DATABASE_URL}`);
const currentDb = process.env.DATABASE_URL.replace('file:', '');
const resolvedCurrent = path.isAbsolute(currentDb) ? currentDb : path.resolve(projectRoot, currentDb);
console.log(`📁 Caminho resolvido: ${resolvedCurrent}`);
console.log(`📁 Existe? ${existsSync(resolvedCurrent)}`);

