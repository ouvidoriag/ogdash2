/**
 * Script de Setup do Sistema
 * Executado automaticamente no postinstall e prestart
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// projectRoot deve apontar para NOVO (onde está o package.json e prisma/)
// De NOVO/scripts/setup -> NOVO/scripts -> NOVO
let projectRoot = path.join(__dirname, '..', '..');

// Verificar se o schema existe no caminho calculado
let schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
if (!fs.existsSync(schemaPath)) {
  // Tentar caminho alternativo (se executado de dentro de NOVO diretamente)
  const altProjectRoot = path.join(__dirname, '..');
  const altSchemaPath = path.join(altProjectRoot, 'prisma', 'schema.prisma');
  if (fs.existsSync(altSchemaPath)) {
    console.log('📁 Usando caminho alternativo para o schema...');
    projectRoot = altProjectRoot;
    schemaPath = altSchemaPath;
  } else {
    // Tentar caminho absoluto a partir do diretório atual de trabalho
    const cwd = process.cwd();
    const cwdSchemaPath = path.join(cwd, 'prisma', 'schema.prisma');
    if (fs.existsSync(cwdSchemaPath)) {
      console.log('📁 Usando diretório de trabalho atual...');
      projectRoot = cwd;
      schemaPath = cwdSchemaPath;
    } else {
      console.error('❌ Schema do Prisma não encontrado!');
      console.error(`   Procurado em: ${path.join(__dirname, '..', '..', 'prisma', 'schema.prisma')}`);
      console.error(`   Procurado em: ${altSchemaPath}`);
      console.error(`   Procurado em: ${cwdSchemaPath}`);
      console.error(`   Diretório atual: ${cwd}`);
      process.exit(1);
    }
  }
}

console.log('🔧 Configurando o sistema...');
console.log(`📁 Diretório do projeto: ${projectRoot}`);
console.log(`📁 Schema do Prisma: ${schemaPath}`);

// 1. Gerar Prisma Client
console.log('1️⃣ Gerando Prisma Client...');

// Função para verificar se o Prisma Client já está gerado
function isPrismaClientGenerated() {
  const prismaClientPath = path.join(projectRoot, 'node_modules', '.prisma', 'client', 'index.js');
  const queryEnginePath = path.join(projectRoot, 'node_modules', '.prisma', 'client');
  
  // Verificar se o index.js existe
  if (!fs.existsSync(prismaClientPath)) {
    return false;
  }
  
  // Verificar se há algum query_engine (pode variar por plataforma)
  try {
    const files = fs.readdirSync(queryEnginePath);
    const hasQueryEngine = files.some(file => 
      file.includes('query_engine') || file.includes('libquery_engine')
    );
    return hasQueryEngine;
  } catch {
    return false;
  }
}

// Função para tentar fechar processos Node.js no Windows (apenas se necessário)
async function tryKillNodeProcesses() {
  if (os.platform() !== 'win32') {
    return false;
  }
  
  try {
    // Verificar se há processos Node.js rodando (exceto o atual)
    const result = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
    const lines = result.stdout.split('\n').filter(line => line.trim());
    const nodeProcesses = lines.length - 1; // -1 porque a primeira linha é o cabeçalho
    
    if (nodeProcesses > 1) { // Mais de 1 porque o processo atual conta
      console.log('   Fechando outros processos Node.js...');
      try {
        execSync('taskkill /F /IM node.exe /FI "PID ne %PID%"', { 
          stdio: 'ignore',
          shell: true 
        });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
        return true;
      } catch {
        // Ignorar erro se não conseguir fechar
        return false;
      }
    }
  } catch {
    // Ignorar erro
  }
  
  return false;
}

// Função para tentar gerar o Prisma Client com retry
async function generatePrismaClient(maxRetries = 3, delay = 3000) {
  // Verificar se já está gerado
  if (isPrismaClientGenerated()) {
    console.log('✅ Prisma Client já está gerado. Pulando geração...');
    return true;
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`   Tentativa ${attempt}/${maxRetries}...`);
        
        // Na segunda tentativa, tentar fechar processos Node.js no Windows
        if (attempt === 2 && os.platform() === 'win32') {
          await tryKillNodeProcesses();
        }
        
        // Aguardar um pouco mais antes de tentar novamente
        const waitTime = delay * attempt; // Aumentar o tempo a cada tentativa
        console.log(`   Aguardando ${waitTime/1000}s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Usar --schema para garantir que encontre o schema
      // Usar schemaPath que já foi calculado e validado
      const schemaFile = schemaPath || path.join(projectRoot, 'prisma', 'schema.prisma');
      execSync(`npx prisma generate --schema="${schemaFile}"`, { 
        cwd: projectRoot, 
        stdio: 'inherit',
        env: { ...process.env },
        timeout: 60000, // 60 segundos de timeout
        shell: true // Importante no Windows
      });
      console.log('✅ Prisma Client gerado com sucesso!');
      return true;
    } catch (error) {
      const errorMsg = error.message || error.toString();
      
      // Se for erro de permissão (EPERM), tentar novamente
      if (errorMsg.includes('EPERM') || errorMsg.includes('operation not permitted')) {
        if (attempt < maxRetries) {
          console.warn(`⚠️ Erro de permissão detectado (EPERM).`);
          continue;
        } else {
          // Verificar se foi gerado mesmo com erro
          if (isPrismaClientGenerated()) {
            console.log('✅ Prisma Client foi gerado apesar do erro!');
            return true;
          }
          
          console.error('❌ Erro ao gerar Prisma Client após múltiplas tentativas:');
          console.error('   Este erro geralmente ocorre quando:');
          console.error('   1. Outro processo Node.js está usando o arquivo');
          console.error('   2. O antivírus está bloqueando a operação');
          console.error('   3. Permissões insuficientes');
          console.error('');
          console.error('💡 Soluções:');
          console.error('   1. Execute: npm run fix:prisma (fecha processos e regenera)');
          console.error('   2. Feche todos os processos Node.js manualmente');
          console.error('   3. Execute o terminal como Administrador');
          console.error('   4. Adicione a pasta node_modules ao antivírus como exceção');
          console.error('   5. Tente executar manualmente: cd NOVO && npx prisma generate');
          console.error('');
          console.error('⚠️ Continuando mesmo com erro (o Prisma pode já estar gerado)...');
          return false; // Não encerrar o processo, apenas avisar
        }
      } else {
        // Outro tipo de erro
        console.error('❌ Erro ao gerar Prisma Client:', errorMsg);
        if (attempt < maxRetries) {
          continue;
        } else {
          // Verificar se foi gerado mesmo com erro
          if (isPrismaClientGenerated()) {
            console.log('✅ Prisma Client foi gerado apesar do erro!');
            return true;
          }
          console.error('⚠️ Continuando mesmo com erro...');
          return false;
        }
      }
    }
  }
  return false;
}

(async () => {
  const prismaGenerated = await generatePrismaClient();
  if (!prismaGenerated) {
    console.warn('⚠️ Prisma Client pode não ter sido gerado. Verifique manualmente.');
  }
  
  // Continuar com o resto do setup
  continueSetup();
})();

async function checkPython() {
  const pythonCommands = ['python3', 'python', 'py'];
  
  for (const cmd of pythonCommands) {
    try {
      await execAsync(`${cmd} --version`);
      return { installed: true, command: cmd };
    } catch (error) {
      // Continuar tentando
    }
  }
  
  return { installed: false, command: null };
}

async function continueSetup() {
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

  // 3. Verificar Python (opcional - não falha se não estiver instalado)
  console.log('3️⃣ Verificando Python (opcional para pipeline)...');
  const pythonCheck = await checkPython();
  
  if (pythonCheck.installed) {
    console.log(`✅ Python encontrado: ${pythonCheck.command}`);
    console.log('   Para instalar dependências Python: npm run setup:python');
  } else {
    console.log('⚠️  Python não encontrado (opcional)');
    console.log('   Para instalar Python e dependências: npm run setup:python');
  }

  console.log('\n🎉 Setup concluído! O sistema está pronto para rodar.');
  console.log('💡 Execute: npm start');
}

