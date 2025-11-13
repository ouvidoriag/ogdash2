/**
 * Script para resolver erro EPERM do Prisma Client
 * Fecha processos Node e limpa arquivos bloqueados
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Corrigindo erro EPERM do Prisma...\n');

// 1. Tentar fechar processos Node
console.log('1️⃣ Fechando processos Node...');
try {
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM node.exe 2>nul', { stdio: 'ignore' });
    console.log('✅ Processos Node finalizados');
  } else {
    execSync('pkill -f node || true', { stdio: 'ignore' });
    console.log('✅ Processos Node finalizados');
  }
} catch (error) {
  console.log('⚠️ Nenhum processo Node encontrado ou já finalizado');
}

// 2. Aguardar um pouco
console.log('\n2️⃣ Aguardando 2 segundos...');
await new Promise(resolve => setTimeout(resolve, 2000));

// 3. Limpar arquivos temporários do Prisma
console.log('\n3️⃣ Limpando arquivos temporários do Prisma...');
const prismaClientDir = path.join(projectRoot, 'node_modules', '.prisma', 'client');

if (fs.existsSync(prismaClientDir)) {
  const files = fs.readdirSync(prismaClientDir);
  let removed = 0;
  
  for (const file of files) {
    if (file.startsWith('query_engine-windows.dll.node.tmp') || 
        file === 'query_engine-windows.dll.node') {
      try {
        const filePath = path.join(prismaClientDir, file);
        fs.unlinkSync(filePath);
        console.log(`   ✅ Removido: ${file}`);
        removed++;
      } catch (error) {
        console.log(`   ⚠️ Não foi possível remover ${file}: ${error.message}`);
      }
    }
  }
  
  if (removed === 0) {
    console.log('   ℹ️ Nenhum arquivo temporário encontrado');
  }
} else {
  console.log('   ⚠️ Diretório do Prisma Client não encontrado');
}

// 4. Gerar Prisma Client
console.log('\n4️⃣ Gerando Prisma Client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: projectRoot 
  });
  console.log('\n✅ Prisma Client gerado com sucesso!');
} catch (error) {
  console.error('\n❌ Erro ao gerar Prisma Client:', error.message);
  console.log('\n💡 Tente executar manualmente: npx prisma generate');
  process.exit(1);
}

console.log('\n✅ Correção concluída! Agora você pode executar: npm start');

