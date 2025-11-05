import 'dotenv/config';
import { existsSync, unlinkSync, rmdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🗑️  Zerando todos os bancos de dados...\n');

// Lista de bancos para deletar
const databasesToDelete = [
  path.join(projectRoot, 'prisma', 'dev.db'),
  path.join(projectRoot, 'prisma', 'dev.db.backup'),
  path.join(projectRoot, 'prisma', 'dev.db-journal'),
  path.join(projectRoot, 'prisma', 'prisma', 'dev.db'),
  path.join(projectRoot, 'prisma', 'prisma', 'dev.db-journal'),
];

let deletedCount = 0;

for (const dbPath of databasesToDelete) {
  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath);
      console.log(`✅ Deletado: ${path.relative(projectRoot, dbPath)}`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ Erro ao deletar ${path.relative(projectRoot, dbPath)}: ${error.message}`);
    }
  }
}

// Tentar remover diretório prisma/prisma se estiver vazio
const nestedPrismaDir = path.join(projectRoot, 'prisma', 'prisma');
if (existsSync(nestedPrismaDir)) {
  try {
    const files = require('fs').readdirSync(nestedPrismaDir);
    if (files.length === 0) {
      rmdirSync(nestedPrismaDir);
      console.log(`✅ Diretório vazio removido: prisma/prisma`);
    }
  } catch (error) {
    // Ignorar se não conseguir remover
  }
}

console.log(`\n📊 Total de arquivos deletados: ${deletedCount}\n`);

// Garantir que o diretório prisma existe
const prismaDir = path.join(projectRoot, 'prisma');
if (!existsSync(prismaDir)) {
  require('fs').mkdirSync(prismaDir, { recursive: true });
  console.log('✅ Diretório prisma criado');
}

// Aplicar schema do Prisma
console.log('\n📋 Aplicando schema do Prisma...\n');
try {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: 'file:./prisma/dev.db' }
  });
  console.log('\n✅ Schema aplicado com sucesso!');
} catch (error) {
  console.error('\n❌ Erro ao aplicar schema:', error.message);
  process.exit(1);
}

// Verificar banco final
console.log('\n🔍 Verificando banco final...\n');
const finalDb = path.join(projectRoot, 'prisma', 'dev.db');
if (existsSync(finalDb)) {
  const stats = require('fs').statSync(finalDb);
  console.log(`✅ Banco principal criado: prisma/dev.db`);
  console.log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
  console.error('❌ Banco principal não foi criado!');
  process.exit(1);
}

console.log('\n🎉 Processo concluído!');
console.log('✅ Apenas um banco de dados configurado: prisma/dev.db');
console.log('✅ Pronto para importar dados!\n');

