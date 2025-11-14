/**
 * Script de Setup do Sistema
 * Executado automaticamente no postinstall e prestart
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Configurando o sistema...');

// 1. Gerar Prisma Client
console.log('1️⃣ Gerando Prisma Client...');
try {
  execSync('npx prisma generate', { 
    cwd: projectRoot, 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Prisma Client gerado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao gerar Prisma Client:', error.message);
  process.exit(1);
}

// 2. Verificar banco de dados
console.log('2️⃣ Verificando banco de dados...');
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');
const dbExists = fs.existsSync(dbPath);

if (dbExists) {
  const stats = fs.statSync(dbPath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`📁 Caminho do banco: ${dbPath}`);
  console.log(`📁 DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 80)}...`);
  console.log(`✅ Banco de dados encontrado! (${sizeKB} KB)`);
} else {
  console.log('📁 Banco de dados será criado na primeira conexão');
}

console.log('🎉 Setup concluído! O sistema está pronto para rodar.');
console.log('💡 Execute: npm start');

