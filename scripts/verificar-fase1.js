/**
 * Script de Verificação da Fase 1
 * Verifica se todos os arquivos e módulos estão presentes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando Fase 1...\n');

let errors = [];
let warnings = [];

// Verificar módulos
const modules = [
  'public/scripts/modules/data-utils.js',
  'public/scripts/modules/data-kpis.js',
  'public/scripts/modules/data-overview.js',
  'public/scripts/modules/data-charts.js',
  'public/scripts/modules/data-tables.js',
  'public/scripts/modules/data-pages.js'
];

console.log('📦 Verificando módulos...');
modules.forEach(module => {
  const fullPath = path.join(__dirname, '..', module);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`  ✅ ${path.basename(module)} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  ❌ ${path.basename(module)} - NÃO ENCONTRADO`);
    errors.push(module);
  }
});

// Verificar scripts de teste
console.log('\n🧪 Verificando scripts de teste...');
const testScripts = [
  'scripts/test-modules.js',
  'scripts/test-fase1-completo.js'
];

testScripts.forEach(script => {
  const fullPath = path.join(__dirname, '..', script);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${path.basename(script)}`);
  } else {
    console.log(`  ⚠️ ${path.basename(script)} - NÃO ENCONTRADO`);
    warnings.push(script);
  }
});

// Verificar index.html
console.log('\n📄 Verificando index.html...');
const indexPath = path.join(__dirname, '..', 'public', 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Verificar se módulos estão referenciados
  const modulesInIndex = modules.filter(m => {
    const moduleName = path.basename(m);
    return indexContent.includes(moduleName);
  });
  
  if (modulesInIndex.length === modules.length) {
    console.log(`  ✅ Todos os ${modules.length} módulos referenciados no index.html`);
  } else {
    console.log(`  ⚠️ Apenas ${modulesInIndex.length} de ${modules.length} módulos referenciados`);
    warnings.push('Alguns módulos não estão no index.html');
  }
  
  // Verificar ordem de carregamento (apenas em tags <script>)
  const scriptTagRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/g;
  const scripts = [];
  let match;
  while ((match = scriptTagRegex.exec(indexContent)) !== null) {
    scripts.push(match[1]);
  }
  
  const dataLoaderIndex = scripts.findIndex(s => s.includes('dataLoader.js'));
  const apiIndex = scripts.findIndex(s => s.includes('api.js'));
  
  if (dataLoaderIndex !== -1 && apiIndex !== -1) {
    if (dataLoaderIndex < apiIndex) {
      console.log('  ✅ Ordem de carregamento correta (dataLoader antes de api)');
    } else {
      console.log('  ❌ Ordem de carregamento incorreta (api antes de dataLoader)');
      errors.push('Ordem de carregamento incorreta no index.html');
    }
  } else {
    console.log('  ⚠️ Não foi possível verificar ordem de carregamento');
    warnings.push('Não foi possível verificar ordem de carregamento');
  }
} else {
  console.log('  ❌ index.html não encontrado');
  errors.push('index.html não encontrado');
}

// Verificar se arquivos JSON corrompidos foram removidos
console.log('\n🗑️ Verificando limpeza de arquivos...');
const removedFiles = [
  'colunas.json',
  'colunas2.json'
];

removedFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file} removido (correto)`);
  } else {
    console.log(`  ⚠️ ${file} ainda existe (deveria ser removido)`);
    warnings.push(`${file} ainda existe`);
  }
});

// Resumo
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMO DA VERIFICAÇÃO');
console.log('='.repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ TUDO OK! Fase 1 está completa e verificada.');
  console.log('🚀 Pronto para avançar!');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`\n❌ ERROS ENCONTRADOS (${errors.length}):`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️ AVISOS (${warnings.length}):`);
    warnings.forEach(w => console.log(`  - ${w}`));
  }
  console.log('\n🔧 Corrija os problemas antes de avançar.');
  process.exit(errors.length > 0 ? 1 : 0);
}

