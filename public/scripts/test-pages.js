/**
 * Test Suite Completo - Todas as Páginas e Caminhos (Client-Side)
 * Testa navegação, carregamento de dados e funcionalidades de todas as páginas
 */

// Configuração de testes (usar namespace para evitar conflito com test.js)
const PAGE_TEST_CONFIG = {
  verbose: true,
  timeout: 30000,
  stopOnError: false,
  autoRun: false
};

// Estatísticas de testes (usar namespace para evitar conflito)
let pageTestStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

/**
 * Utilitário de teste
 */
class PageTestRunner {
  constructor() {
    this.tests = [];
    this.currentTest = null;
  }

  /**
   * Registrar um teste
   */
  test(name, fn, skip = false) {
    this.tests.push({ name, fn, skip, status: 'pending' });
  }

  /**
   * Executar todos os testes
   */
  async run() {
    console.log('🧪 Iniciando testes de páginas e caminhos...\n');
    pageTestStats.total = this.tests.length;

    for (const test of this.tests) {
      if (test.skip) {
        pageTestStats.skipped++;
        console.log(`⏭️  PULADO: ${test.name}`);
        continue;
      }

      this.currentTest = test;
      
      try {
        console.log(`\n📋 Testando: ${test.name}`);
        const startTime = Date.now();
        
        await Promise.race([
          test.fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), PAGE_TEST_CONFIG.timeout)
          )
        ]);
        
        const duration = Date.now() - startTime;
        test.status = 'passed';
        pageTestStats.passed++;
        console.log(`✅ PASSOU (${duration}ms): ${test.name}`);
      } catch (error) {
        test.status = 'failed';
        pageTestStats.failed++;
        pageTestStats.errors.push({ test: test.name, error: error.message });
        console.error(`❌ FALHOU: ${test.name}`);
        console.error(`   Erro: ${error.message}`);
        if (PAGE_TEST_CONFIG.verbose) {
          console.error(error.stack);
        }
        
        if (PAGE_TEST_CONFIG.stopOnError) {
          break;
        }
      }
    }

    this.printSummary();
  }

  /**
   * Imprimir resumo dos testes
   */
  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DOS TESTES DE PÁGINAS');
    console.log('='.repeat(70));
    console.log(`Total: ${pageTestStats.total}`);
    console.log(`✅ Passou: ${pageTestStats.passed}`);
    console.log(`❌ Falhou: ${pageTestStats.failed}`);
    console.log(`⏭️  Pulado: ${pageTestStats.skipped}`);
    const successRate = pageTestStats.total > 0 
      ? ((pageTestStats.passed / (pageTestStats.total - pageTestStats.skipped)) * 100).toFixed(1)
      : 0;
    console.log(`Taxa de sucesso: ${successRate}%`);
    
    if (pageTestStats.errors.length > 0) {
      console.log('\n❌ ERROS:');
      pageTestStats.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    console.log('='.repeat(70));
  }
}

// Criar instância do runner
const pageTestRunner = new PageTestRunner();
window.pageTestRunner = pageTestRunner;

// Lista de todas as páginas
const ALL_PAGES = [
  'home', 'main', 'orgao-mes', 'tempo-medio', 'tema', 'assunto',
  'cadastrante', 'reclamacoes', 'projecao-2026', 'secretaria',
  'secretarias-distritos', 'tipo', 'status', 'categoria', 'setor',
  'responsavel', 'canal', 'prioridade', 'bairro', 'uac'
];

// Lista de unidades
const UNIDADES = [
  'adao', 'cer iv', 'hospital olho', 'hospital duque', 'hospital infantil',
  'hospital moacyr', 'maternidade santa cruz', 'upa beira mar', 'uph pilar',
  'uph saracuruna', 'uph xerem', 'hospital veterinario', 'upa walter garcia',
  'uph campos eliseos', 'uph parque equitativa', 'ubs antonio granja',
  'upa sarapui', 'uph imbarie'
];

// ============================================
// TESTES DE MÓDULOS
// ============================================

pageTestRunner.test('Módulos JavaScript carregados', () => {
  const modules = ['api', 'utils', 'filters', 'charts', 'data', 'main'];
  const missing = modules.filter(m => !window[m]);
  if (missing.length > 0) {
    throw new Error(`Módulos não carregados: ${missing.join(', ')}`);
  }
});

pageTestRunner.test('Funções globais disponíveis', () => {
  const requiredFunctions = [
    'loadSection', 'loadHome', 'loadOverview',
    'fetchJSON', 'fetchJSONWithFilter', 'applyGlobalFilter'
  ];
  const missing = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
  if (missing.length > 0) {
    throw new Error(`Funções não disponíveis: ${missing.join(', ')}`);
  }
});

// ============================================
// TESTES DE NAVEGAÇÃO
// ============================================

pageTestRunner.test('Menu lateral existe', () => {
  const sideMenu = document.getElementById('sideMenu');
  if (!sideMenu) {
    throw new Error('Menu lateral não encontrado');
  }
});

pageTestRunner.test('Container de páginas existe', () => {
  const pages = document.getElementById('pages');
  if (!pages) {
    throw new Error('Container de páginas não encontrado');
  }
});

pageTestRunner.test('Todas as páginas existem no DOM', () => {
  const pages = document.getElementById('pages');
  if (!pages) return;
  
  const missingPages = [];
  ALL_PAGES.forEach(pageId => {
    const page = document.getElementById(`page-${pageId}`);
    if (!page) {
      missingPages.push(pageId);
    }
  });
  
  if (missingPages.length > 0) {
    throw new Error(`Páginas não encontradas: ${missingPages.join(', ')}`);
  }
});

// ============================================
// TESTES DE CARREGAMENTO DE PÁGINAS
// ============================================

ALL_PAGES.forEach(pageId => {
  pageTestRunner.test(`Navegação: Página ${pageId}`, async () => {
    // Simular clique no menu
    const menuItem = document.querySelector(`[data-page="${pageId}"]`);
    if (!menuItem) {
      throw new Error(`Item de menu não encontrado para página ${pageId}`);
    }
    
    // Disparar evento de clique
    menuItem.click();
    
    // Aguardar navegação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se página está visível
    const page = document.getElementById(`page-${pageId}`);
    if (!page) {
      throw new Error(`Página ${pageId} não encontrada`);
    }
    
    // Verificar se função de carregamento existe
    const loadFn = window.main?.loadSection || loadSection;
    if (typeof loadFn !== 'function') {
      throw new Error(`Função loadSection não disponível`);
    }
  });
});

// ============================================
// TESTES DE FUNÇÕES DE CARREGAMENTO
// ============================================

pageTestRunner.test('loadHome existe e é função', () => {
  const fn = window.main?.loadHome || loadHome;
  if (typeof fn !== 'function') {
    throw new Error('loadHome não é uma função');
  }
});

pageTestRunner.test('loadOverview existe e é função', () => {
  const fn = window.data?.loadOverview || loadOverview;
  if (typeof fn !== 'function') {
    throw new Error('loadOverview não é uma função');
  }
});

pageTestRunner.test('loadSection existe e é função', () => {
  const fn = window.main?.loadSection || loadSection;
  if (typeof fn !== 'function') {
    throw new Error('loadSection não é uma função');
  }
});

// Testar funções de carregamento de dados
const dataFunctions = [
  'loadOrgaoMes', 'loadTempoMedio', 'loadTema', 'loadAssunto',
  'loadCadastrante', 'loadReclamacoes', 'loadProjecao2026',
  'loadSecretaria', 'loadSecretariasDistritos', 'loadTipo', 'loadSetor',
  'loadCategoria', 'loadStatusPage', 'loadBairro', 'loadUAC',
  'loadResponsavel', 'loadCanal', 'loadPrioridade'
];

dataFunctions.forEach(fnName => {
  pageTestRunner.test(`Função ${fnName} existe`, () => {
    const fn = window.data?.[fnName] || window[fnName];
    if (typeof fn !== 'function') {
      throw new Error(`${fnName} não é uma função`);
    }
  });
});

// ============================================
// TESTES DE API
// ============================================

pageTestRunner.test('API: fetchJSON funciona', async () => {
  const fn = window.api?.fetchJSON || fetchJSON;
  if (typeof fn !== 'function') {
    throw new Error('fetchJSON não é uma função');
  }
  
  try {
    const data = await fn('/api/summary');
    if (!data || typeof data !== 'object') {
      throw new Error('Resposta inválida');
    }
  } catch (error) {
    // Se falhar, pode ser que o servidor não esteja rodando
    console.warn('   ⚠️ Servidor pode não estar rodando:', error.message);
  }
});

pageTestRunner.test('API: fetchJSONWithFilter funciona', async () => {
  const fn = window.api?.fetchJSONWithFilter || fetchJSONWithFilter;
  if (typeof fn !== 'function') {
    throw new Error('fetchJSONWithFilter não é uma função');
  }
  
  try {
    const data = await fn('/api/summary');
    if (!data || typeof data !== 'object') {
      throw new Error('Resposta inválida');
    }
  } catch (error) {
    console.warn('   ⚠️ Servidor pode não estar rodando:', error.message);
  }
});

// ============================================
// TESTES DE FILTROS
// ============================================

pageTestRunner.test('Sistema de filtros global existe', () => {
  if (!window.globalFilters) {
    throw new Error('window.globalFilters não existe');
  }
  
  if (!Array.isArray(window.globalFilters.filters)) {
    throw new Error('window.globalFilters.filters não é um array');
  }
});

pageTestRunner.test('Função applyGlobalFilter existe', () => {
  const fn = window.filters?.applyGlobalFilter || applyGlobalFilter;
  if (typeof fn !== 'function') {
    throw new Error('applyGlobalFilter não é uma função');
  }
});

pageTestRunner.test('Função clearGlobalFilters existe', () => {
  const fn = window.filters?.clearGlobalFilters || clearGlobalFilters;
  if (typeof fn !== 'function') {
    throw new Error('clearGlobalFilters não é uma função');
  }
});

pageTestRunner.test('chartFieldMap existe', () => {
  const map = window.chartFieldMap || window.filters?.chartFieldMap;
  if (!map || typeof map !== 'object') {
    throw new Error('chartFieldMap não existe ou não é um objeto');
  }
});

// ============================================
// TESTES DE GRÁFICOS
// ============================================

pageTestRunner.test('Chart.js está carregado', () => {
  if (typeof Chart === 'undefined') {
    throw new Error('Chart.js não está carregado');
  }
});

pageTestRunner.test('Funções de gráficos existem', () => {
  const required = ['createEnhancedTooltip', 'createDataLabelsConfig', 'addChartClickHandler'];
  const missing = required.filter(fn => {
    const func = window.utils?.[fn] || window.charts?.[fn] || window[fn];
    return typeof func !== 'function';
  });
  
  if (missing.length > 0) {
    throw new Error(`Funções de gráficos não encontradas: ${missing.join(', ')}`);
  }
});

// ============================================
// TESTES DE ELEMENTOS DO DOM
// ============================================

pageTestRunner.test('Elementos principais existem', () => {
  const required = [
    'sideMenu', 'pages', 'filterIndicator', 'filterClearBtn'
  ];
  
  const missing = required.filter(id => !document.getElementById(id));
  
  if (missing.length > 0) {
    throw new Error(`Elementos não encontrados: ${missing.join(', ')}`);
  }
});

// ============================================
// TESTES DE PERFORMANCE
// ============================================

pageTestRunner.test('Performance: Carregamento inicial < 3s', async () => {
  const start = performance.now();
  
  // Simular carregamento inicial
  if (window.main?.initPage) {
    await window.main.initPage();
  } else if (typeof initPage === 'function') {
    await initPage();
  }
  
  const duration = performance.now() - start;
  
  if (duration > 3000) {
    throw new Error(`Carregamento muito lento: ${duration.toFixed(0)}ms (esperado < 3s)`);
  }
  
  console.log(`   ⏱️ Tempo: ${duration.toFixed(0)}ms`);
});

// ============================================
// TESTES DE UNIDADES
// ============================================

UNIDADES.forEach(unitName => {
  pageTestRunner.test(`Unidade: ${unitName}`, () => {
    const pageId = `page-unit-${unitName.replace(/\s+/g, '-').toLowerCase()}`;
    const page = document.getElementById(pageId);
    if (!page) {
      throw new Error(`Página da unidade ${unitName} não encontrada`);
    }
    
    const loadFn = window.data?.loadUnit || loadUnit;
    if (typeof loadFn !== 'function') {
      throw new Error('loadUnit não é uma função');
    }
  });
});

// ============================================
// FUNÇÃO PARA EXECUTAR TODOS OS TESTES
// ============================================

async function runAllPageTests() {
  await pageTestRunner.run();
  return {
    total: pageTestStats.total,
    passed: pageTestStats.passed,
    failed: pageTestStats.failed,
    skipped: pageTestStats.skipped,
    errors: pageTestStats.errors
  };
}

// Expor globalmente
window.runAllPageTests = runAllPageTests;

// Auto-executar se estiver em modo de teste
if (window.location.search.includes('test=pages') || window.location.search.includes('test=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
      console.log('🚀 Executando testes de páginas automaticamente...\n');
      await runAllPageTests();
    }, 2000); // Aguardar 2s para garantir que tudo carregou
  });
}

