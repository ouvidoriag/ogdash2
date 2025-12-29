/**
 * Executar Todos os Testes do Sistema Crossfilter
 * 
 * Valida estrutura, arquivos e implementação
 * 
 * CÉREBRO X-3
 * Data: 18/12/2025
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, passed, message = '', warning = false) {
  results.tests.push({ name, passed, message, warning });
  if (warning) {
    results.warnings++;
  } else if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

console.log('🧪 EXECUTANDO TODOS OS TESTES DO SISTEMA CROSSFILTER\n');
console.log('='.repeat(70));

// Teste 1: Verificar arquivos de helper
function testHelperFiles() {
  console.log('\n📦 Testando Helpers...');
  
  const helpers = [
    { path: 'public/scripts/utils/crossfilter-helper.js', name: 'crossfilter-helper.js' },
    { path: 'public/scripts/utils/kpi-filter-helper.js', name: 'kpi-filter-helper.js' }
  ];

  helpers.forEach(helper => {
    const fullPath = path.join(projectRoot, helper.path);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasFunction = helper.name.includes('crossfilter') 
          ? content.includes('addCrossfilterToChart')
          : content.includes('makeKPIsReactive') && content.includes('makeCardsClickable');
        
        recordTest(`Helper ${helper.name}`, hasFunction,
          hasFunction ? 'Arquivo válido com funções' : 'Arquivo sem funções principais');
      } else {
        recordTest(`Helper ${helper.name}`, false, 'Arquivo não encontrado');
      }
    } catch (error) {
      recordTest(`Helper ${helper.name}`, false, `Erro: ${error.message}`);
    }
  });
}

// Teste 2: Verificar scripts de teste
function testTestScripts() {
  console.log('\n🧪 Testando Scripts de Teste...');
  
  const testScripts = [
    { path: 'public/scripts/test/test-crossfilter.js', name: 'test-crossfilter.js' },
    { path: 'public/scripts/test/test-crossfilter-interactive.js', name: 'test-crossfilter-interactive.js' },
    { path: 'public/scripts/test/test-crossfilter-complete.js', name: 'test-crossfilter-complete.js' }
  ];

  testScripts.forEach(script => {
    const fullPath = path.join(projectRoot, script.path);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasExports = content.includes('window.testCrossfilter') || 
                          content.includes('window.testCrossfilterInteractive') ||
                          content.includes('window.testCrossfilterComplete');
        
        recordTest(`Script ${script.name}`, hasExports,
          hasExports ? 'Script válido com exports' : 'Script sem exports');
      } else {
        recordTest(`Script ${script.name}`, false, 'Arquivo não encontrado');
      }
    } catch (error) {
      recordTest(`Script ${script.name}`, false, `Erro: ${error.message}`);
    }
  });
}

// Teste 3: Verificar implementação em páginas
function testPageImplementations() {
  console.log('\n📄 Testando Implementação nas Páginas...');
  
  const pages = {
    'pages/ouvidoria/tema.js': ['addCrossfilterToChart', 'makeKPIsReactive', 'makeCardsClickable', 'rank-item', 'tema-item'],
    'pages/ouvidoria/assunto.js': ['addCrossfilterToChart', 'makeKPIsReactive', 'assunto-item'],
    'pages/ouvidoria/status.js': ['addCrossfilterToChart', 'makeKPIsReactive'],
    'pages/ouvidoria/tipo.js': ['addCrossfilterToChart', 'makeKPIsReactive', 'rank-item'],
    'pages/ouvidoria/canal.js': ['addCrossfilterToChart', 'makeKPIsReactive', 'rank-item'],
    'pages/ouvidoria/prioridade.js': ['addCrossfilterToChart', 'makeKPIsReactive', 'rank-item'],
    'pages/ouvidoria/bairro.js': ['addCrossfilterToChart', 'makeKPIsReactive'],
    'pages/ouvidoria/responsavel.js': ['addCrossfilterToChart', 'makeKPIsReactive', 'rank-item'],
    'pages/ouvidoria/reclamacoes.js': ['addCrossfilterToChart'],
    'pages/ouvidoria/notificacoes.js': ['addCrossfilterToChart']
  };

  Object.entries(pages).forEach(([pagePath, features]) => {
    const fullPath = path.join(projectRoot, 'public/scripts', pagePath);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const pageName = path.basename(pagePath, '.js');
        
        const hasFeatures = features.map(feature => {
          if (feature.includes('-')) {
            // É um seletor CSS (rank-item, tema-item, etc)
            return content.includes(`class="${feature}"`) || content.includes(`class='${feature}'`) || content.includes(`.${feature}`);
          } else {
            // É uma função
            return content.includes(feature);
          }
        });
        
        const allPresent = hasFeatures.every(v => v);
        const count = hasFeatures.filter(v => v).length;
        
        recordTest(
          `Página ${pageName}`,
          allPresent,
          `${count}/${features.length} funcionalidades encontradas`,
          !allPresent && count > 0
        );
      } else {
        recordTest(`Página ${path.basename(pagePath)}`, false, 'Arquivo não encontrado');
      }
    } catch (error) {
      recordTest(`Página ${path.basename(pagePath)}`, false, `Erro: ${error.message}`);
    }
  });
}

// Teste 4: Verificar carregamento no HTML
function testHTMLLoading() {
  console.log('\n🌐 Testando Carregamento no HTML...');
  
  const htmlPath = path.join(projectRoot, 'public', 'index.html');
  try {
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');
      
      const scripts = [
        'crossfilter-helper.js',
        'kpi-filter-helper.js',
        'test-crossfilter.js',
        'test-crossfilter-interactive.js',
        'test-crossfilter-complete.js'
      ];
      
      scripts.forEach(script => {
        const hasScript = content.includes(script);
        recordTest(`Script ${script} no HTML`, hasScript,
          hasScript ? 'Carregado no HTML' : 'Não encontrado no HTML');
      });
  } else {
      recordTest('HTML index.html', false, 'Arquivo não encontrado');
    }
  } catch (error) {
    recordTest('HTML index.html', false, `Erro: ${error.message}`);
  }
}

// Teste 5: Verificar documentação
function testDocumentation() {
  console.log('\n📚 Testando Documentação...');
  
  const docs = [
    'docs/02-desenvolvimento/GUIA_CROSSFILTER.md', // Consolidado de EVOLUCAO_CROSSFILTER.md e outros
    'public/scripts/test/README-TESTES.md'
  ];
  
  docs.forEach(doc => {
    const fullPath = path.join(projectRoot, doc);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasContent = content.length > 100; // Mínimo de conteúdo
        recordTest(`Documentação ${path.basename(doc)}`, hasContent,
          hasContent ? 'Documentação completa' : 'Documentação muito curta');
      } else {
        recordTest(`Documentação ${path.basename(doc)}`, false, 'Arquivo não encontrado');
      }
    } catch (error) {
      recordTest(`Documentação ${path.basename(doc)}`, false, `Erro: ${error.message}`);
    }
  });
}

// Teste 6: Verificar gráficos específicos
function testSpecificCharts() {
  console.log('\n📊 Testando Gráficos Específicos...');
  
  const charts = {
    'Pizza': ['chartStatusPage', 'chartTipo', 'chartCanal', 'chartPrioridade'],
    'Barras': ['chartTema', 'chartAssunto', 'chartBairro', 'chartResponsavel'],
    'Barras Agrupadas': ['chartTemaMes', 'chartAssuntoMes', 'chartStatusMes', 'chartCanalMes']
  };
  
  Object.entries(charts).forEach(([type, chartIds]) => {
    chartIds.forEach(chartId => {
      // Verificar se gráfico é referenciado nas páginas
      const pagesDir = path.join(projectRoot, 'public/scripts/pages/ouvidoria');
      let found = false;
      
      try {
        const files = fs.readdirSync(pagesDir);
        for (const file of files) {
          if (file.endsWith('.js')) {
            const filePath = path.join(pagesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(chartId)) {
              found = true;
              break;
            }
          }
        }
      } catch (error) {
        // Ignorar erros
      }
      
      recordTest(`Gráfico ${type} ${chartId}`, found,
        found ? 'Referenciado em páginas' : 'Não encontrado', !found);
    });
  });
}

// Executar todos os testes
testHelperFiles();
testTestScripts();
testPageImplementations();
testHTMLLoading();
testDocumentation();
testSpecificCharts();

// Mostrar resultados
console.log('\n' + '='.repeat(70));
console.log('📊 RESULTADOS FINAIS\n');
console.log('='.repeat(70));

// Agrupar por categoria
const categories = {
  'Helpers': [],
  'Scripts de Teste': [],
  'Páginas': [],
  'HTML': [],
  'Documentação': [],
  'Gráficos': []
};

results.tests.forEach(test => {
  if (test.name.includes('Helper')) {
    categories['Helpers'].push(test);
  } else if (test.name.includes('Script') || test.name.includes('test-')) {
    categories['Scripts de Teste'].push(test);
  } else if (test.name.includes('Página')) {
    categories['Páginas'].push(test);
  } else if (test.name.includes('HTML') || test.name.includes('.js no HTML')) {
    categories['HTML'].push(test);
  } else if (test.name.includes('Documentação')) {
    categories['Documentação'].push(test);
  } else if (test.name.includes('Gráfico')) {
    categories['Gráficos'].push(test);
  }
});

Object.entries(categories).forEach(([category, tests]) => {
  if (tests.length > 0) {
    console.log(`\n${category}:`);
    tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      const warning = test.warning ? '⚠️' : '';
      console.log(`  ${icon} ${warning} ${test.name}`);
      if (test.message && !test.passed) {
        console.log(`     ${test.message}`);
      }
    });
  }
});

console.log('\n' + '='.repeat(70));
console.log(`✅ Passou: ${results.passed}`);
console.log(`❌ Falhou: ${results.failed}`);
console.log(`⚠️ Avisos: ${results.warnings}`);
console.log(`📊 Total: ${results.tests.length}`);
console.log('='.repeat(70));

const success = results.failed === 0;
if (success) {
  console.log('\n🎉 Todos os testes passaram!');
  process.exit(0);
} else {
  console.log('\n⚠️ Alguns testes falharam. Verifique os detalhes acima.');
  process.exit(1);
}
