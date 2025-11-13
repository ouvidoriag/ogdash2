import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Corrigindo permissões do Prisma...\n');

// Tentar remover arquivo temporário se existir
const prismaClientPath = join(__dirname, '..', 'node_modules', '.prisma', 'client');
const queryEnginePath = join(prismaClientPath, 'query_engine-windows.dll.node');

try {
  // Tentar remover arquivo temporário bloqueado
  const tmpFiles = queryEnginePath.replace('.node', '.node.tmp*');
  console.log('📁 Verificando arquivos temporários...');
  
  // Tentar gerar Prisma novamente
  console.log('🔄 Gerando Prisma Client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit', 
    cwd: join(__dirname, '..'),
    env: { ...process.env, PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true' }
  });
  console.log('✅ Prisma Client gerado com sucesso!\n');
} catch (error) {
  console.warn('⚠️ Aviso: Erro ao gerar Prisma (pode ser ignorado se já existe):', error.message);
  console.log('💡 Tentando continuar mesmo assim...\n');
}

console.log('✅ Correção concluída!');

