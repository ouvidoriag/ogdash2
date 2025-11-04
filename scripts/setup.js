import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'prisma', 'dev.db');

console.log('🔧 Configurando o sistema...\n');

// 1. Gerar Prisma Client
console.log('1️⃣ Gerando Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: join(__dirname, '..') });
  console.log('✅ Prisma Client gerado com sucesso!\n');
} catch (error) {
  console.error('❌ Erro ao gerar Prisma Client:', error.message);
  process.exit(1);
}

// 2. Verificar/criar banco de dados
console.log('2️⃣ Verificando banco de dados...');
if (!existsSync(dbPath)) {
  console.log('📦 Banco de dados não encontrado. Criando banco...');
  try {
    // Executar migrações (cria o banco se não existir)
    execSync('npx prisma db push', { stdio: 'inherit', cwd: join(__dirname, '..') });
    console.log('✅ Banco de dados criado!\n');
  } catch (error) {
    console.error('❌ Erro ao criar banco de dados:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Banco de dados encontrado!\n');
}

console.log('🎉 Setup concluído! O sistema está pronto para rodar.');
console.log('💡 Execute: npm start\n');

