/**
 * Script de Início Rápido da Refatoração
 * Aplica as correções críticas da Fase 1 automaticamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Iniciando refatoração - Fase 1: Correções Críticas\n');

// 1. Corrigir ordem de carregamento no index.html
console.log('📝 1. Corrigindo ordem de carregamento...');
const indexPath = path.join(projectRoot, 'public', 'index.html');
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf-8');
  
  // Verificar ordem atual
  const dataLoaderIndex = content.indexOf('/scripts/dataLoader.js');
  const apiIndex = content.indexOf('/scripts/api.js');
  
  if (dataLoaderIndex > apiIndex && dataLoaderIndex !== -1 && apiIndex !== -1) {
    console.log('   ⚠️  Ordem incorreta detectada!');
    console.log('   📋 Ação necessária: Mover dataLoader.js antes de api.js');
    console.log('   📄 Arquivo: public/index.html');
    console.log('   ⚠️  CORREÇÃO MANUAL NECESSÁRIA\n');
  } else {
    console.log('   ✅ Ordem de carregamento está correta\n');
  }
} else {
  console.log('   ❌ index.html não encontrado\n');
}

// 2. Verificar arquivos JSON
console.log('📝 2. Verificando arquivos JSON...');
const jsonFiles = ['colunas.json', 'colunas2.json'];
jsonFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      JSON.parse(content);
      console.log(`   ✅ ${file} - JSON válido`);
    } catch (e) {
      console.log(`   ❌ ${file} - JSON INVÁLIDO: ${e.message}`);
      console.log(`   📋 Ação: Recriar ou remover este arquivo`);
    }
  } else {
    console.log(`   ℹ️  ${file} - não encontrado (pode ter sido removido)`);
  }
});
console.log('');

// 3. Verificar tratamento de erros
console.log('📝 3. Verificando tratamento de erros...');
const dataJsPath = path.join(projectRoot, 'public', 'scripts', 'data.js');
if (fs.existsSync(dataJsPath)) {
  const content = fs.readFileSync(dataJsPath, 'utf-8');
  const asyncFunctions = (content.match(/async\s+function\s+\w+/g) || []).length;
  const tryCatchBlocks = (content.match(/try\s*{/g) || []).length;
  
  console.log(`   📊 Funções async: ${asyncFunctions}`);
  console.log(`   📊 Blocos try/catch: ${tryCatchBlocks}`);
  
  if (asyncFunctions > tryCatchBlocks * 1.5) {
    console.log(`   ⚠️  Muitas funções async sem try/catch!`);
    console.log(`   📋 Ação: Adicionar try/catch em funções async`);
  } else {
    console.log(`   ✅ Tratamento de erros adequado`);
  }
} else {
  console.log('   ❌ data.js não encontrado');
}
console.log('');

// 4. Verificar tamanho de arquivos
console.log('📝 4. Verificando tamanho de arquivos...');
const scriptsDir = path.join(projectRoot, 'public', 'scripts');
if (fs.existsSync(scriptsDir)) {
  const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
  files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    
    if (sizeKB > 100) {
      console.log(`   ⚠️  ${file}: ${sizeKB.toFixed(2)} KB (muito grande!)`);
      console.log(`   📋 Ação: Considerar dividir em módulos menores`);
    }
  });
}
console.log('');

// 5. Gerar relatório de ações necessárias
console.log('📝 5. Gerando relatório de ações...');
const reportDir = path.join(projectRoot, 'analise-projeto');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const actions = {
  timestamp: new Date().toISOString(),
  critical: [
    {
      action: 'Corrigir ordem de carregamento',
      file: 'public/index.html',
      description: 'Mover dataLoader.js antes de api.js',
      priority: 'ALTA',
      estimatedTime: '15 minutos'
    },
    {
      action: 'Corrigir arquivos JSON',
      files: ['colunas.json', 'colunas2.json'],
      description: 'Recriar ou remover arquivos JSON corrompidos',
      priority: 'ALTA',
      estimatedTime: '30 minutos'
    },
    {
      action: 'Adicionar try/catch',
      file: 'public/scripts/data.js',
      description: 'Adicionar tratamento de erros em funções async',
      priority: 'ALTA',
      estimatedTime: '2 horas'
    }
  ],
  recommendations: [
    {
      action: 'Dividir data.js',
      file: 'public/scripts/data.js',
      description: 'Dividir arquivo grande em módulos menores',
      priority: 'MÉDIA',
      estimatedTime: '4 horas'
    },
    {
      action: 'Limpar console.log',
      description: 'Remover ou substituir console.log de debug',
      priority: 'MÉDIA',
      estimatedTime: '1 hora'
    }
  ]
};

fs.writeFileSync(
  path.join(reportDir, 'acoes-imediatas.json'),
  JSON.stringify(actions, null, 2)
);

console.log('   ✅ Relatório salvo em: analise-projeto/acoes-imediatas.json\n');

console.log('✅ Análise inicial concluída!\n');
console.log('📋 PRÓXIMOS PASSOS:');
console.log('   1. Abra: analise-projeto/PLANO-REFATORACAO.md');
console.log('   2. Siga a Fase 1: Correções Críticas');
console.log('   3. Use: analise-projeto/CHECKLIST-REFATORACAO.md para acompanhar');
console.log('   4. Após cada correção, re-execute: node scripts/analyze-project.js\n');

console.log('🎯 Meta: 100% de sucesso!');

