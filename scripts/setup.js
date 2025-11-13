import 'dotenv/config';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'prisma', 'dev.db');

console.log('🔧 Configurando o sistema...\n');

// 1. Gerar Prisma Client
console.log('1️⃣ Gerando Prisma Client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit', 
    cwd: join(__dirname, '..'),
    env: { ...process.env, PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true' }
  });
  console.log('✅ Prisma Client gerado com sucesso!\n');
} catch (error) {
  console.warn('⚠️ Aviso: Erro ao gerar Prisma Client (pode ser ignorado se já existe)');
  console.warn('   Mensagem:', error.message);
  console.log('💡 Tentando continuar mesmo assim...\n');
  // Não sair com erro - pode ser que o Prisma já esteja gerado
}

// 2. Verificar/criar banco de dados
console.log('2️⃣ Verificando banco de dados...');
console.log(`📁 Caminho do banco: ${dbPath}`);
console.log(`📁 DATABASE_URL: ${process.env.DATABASE_URL || 'não definido'}`);

// Garantir que o diretório prisma existe
const prismaDir = join(__dirname, '..', 'prisma');
if (!existsSync(prismaDir)) {
  console.log('📁 Criando diretório prisma...');
  mkdirSync(prismaDir, { recursive: true });
}

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
  const stats = statSync(dbPath);
  console.log(`✅ Banco de dados encontrado! (${Math.round(stats.size / 1024)} KB)\n`);
}

console.log('🎉 Setup concluído! O sistema está pronto para rodar.');
console.log('💡 Execute: npm start\n');

