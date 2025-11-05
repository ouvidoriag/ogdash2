import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';

// Resolver caminho absoluto do banco de dados
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Se DATABASE_URL for relativo, converter para absoluto
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && databaseUrl.startsWith('file:./')) {
  const relativePath = databaseUrl.replace('file:', '');
  const absolutePath = join(projectRoot, relativePath);
  databaseUrl = `file:${absolutePath}`;
  process.env.DATABASE_URL = databaseUrl;
}

const prisma = new PrismaClient();

async function main() {
  try {
    const before = await prisma.record.count();
    console.log(`📊 Registros antes: ${before}`);
    
    await prisma.record.deleteMany({});
    
    const after = await prisma.record.count();
    console.log(`✅ Banco de dados zerado!`);
    console.log(`📊 Registros depois: ${after}`);
    console.log(`🗑️  ${before} registros removidos`);
  } catch (error) {
    console.error('❌ Erro ao zerar banco:', error.message);
    throw error;
  }
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });


