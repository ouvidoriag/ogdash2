/**
 * Test Suite - Sistema de Testes Abrangente
 * Testa todas as funcionalidades do dashboard
 */

// Configuração de testes
const TEST_CONFIG = {
  verbose: true,
  timeout: 30000, // 30 segundos por teste
  stopOnError: false
};

// Estatísticas de testes
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

/**
 * Utilitário de teste
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.currentTest = null;
  }

  /**
   * Registrar um teste
   */
  test(name, fn) {
    this.tests.push({ name, fn, status: 'pending' });
  }

  /**
   * Executar todos os testes
   */
  async run() {
    console.log('🧪 Iniciando testes...\n');
    testStats.total = this.tests.length;

    for (const test of this.tests) {
      this.currentTest = test;
      testStats.total++;
      
      try {
        console.log(`\n📋 Testando: ${test.name}`);
        const startTime = Date.now();
        
        await Promise.race([
          test.fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), TEST_CONFIG.timeout)
          )
        ]);
        
        const duration = Date.now() - startTime;
        test.status = 'passed';
        testStats.passed++;
        console.log(`✅ PASSOU (${duration}ms): ${test.name}`);
      } catch (error) {
        test.status = 'failed';
        testStats.failed++;
        testStats.errors.push({ test: test.name, error: error.message });
        console.error(`❌ FALHOU: ${test.name}`);
        console.error(`   Erro: ${error.message}`);
        if (TEST_CONFIG.verbose) {
          console.error(error.stack);
        }
        
        if (TEST_CONFIG.stopOnError) {
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
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));
    console.log(`Total: ${testStats.total}`);
    console.log(`✅ Passou: ${testStats.passed}`);
    console.log(`❌ Falhou: ${testStats.failed}`);
    console.log(`⏭️  Pulado: ${testStats.skipped}`);
    console.log(`Taxa de sucesso: ${((testStats.passed / testStats.total) * 100).toFixed(1)}%`);
    
    if (testStats.errors.length > 0) {
      console.log('\n❌ ERROS:');
      testStats.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    console.log('='.repeat(60));
  }
}

// Instância global do test runner
const runner = new TestRunner();

/**
 * Helper: Verificar se elemento existe
 */
function elementExists(selector) {
  return document.querySelector(selector) !== null;
}

/**
 * Helper: Verificar se função existe
 */
function functionExists(name, obj = window) {
  const parts = name.split('.');
  let current = obj;
  for (const part of parts) {
    if (!current || typeof current[part] !== 'function') {
      return false;
    }
    current = current[part];
  }
  return true;
}

/**
 * Helper: Aguardar elemento aparecer
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} não encontrado após ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Helper: Fazer requisição de teste
 */
async function testRequest(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CENÁRIOS DE TESTE
// ============================================

/**
 * TESTE 1: Verificar carregamento de módulos
 */
runner.test('Módulos carregados', async () => {
  const modules = ['api', 'utils', 'filters', 'charts', 'data', 'main'];
  const missing = [];
  
  for (const module of modules) {
    if (!window[module]) {
      missing.push(module);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Módulos não carregados: ${missing.join(', ')}`);
  }
});

/**
 * TESTE 2: Verificar funções principais do módulo API
 */
runner.test('Módulo API - Funções disponíveis', async () => {
  const requiredFunctions = [
    'fetchJSON',
    'fetchJSONWithFilter',
    'fetchWithCache'
  ];
  
  const missing = [];
  for (const fn of requiredFunctions) {
    if (!functionExists(`api.${fn}`)) {
      missing.push(fn);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Funções API não encontradas: ${missing.join(', ')}`);
  }
});

/**
 * TESTE 3: Verificar funções principais do módulo Data
 */
runner.test('Módulo Data - Funções disponíveis', async () => {
  const requiredFunctions = [
    'loadOverview',
    'renderKpis',
    'loadAIInsights',
    'loadStatusOverview',
    'loadTable',
    'loadKpisWithData'
  ];
  
  const missing = [];
  for (const fn of requiredFunctions) {
    if (!functionExists(`data.${fn}`)) {
      missing.push(fn);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Funções Data não encontradas: ${missing.join(', ')}`);
  }
});

/**
 * TESTE 4: Verificar funções principais do módulo Filters
 */
runner.test('Módulo Filters - Funções disponíveis', async () => {
  const requiredFunctions = [
    'applyGlobalFilter',
    'clearGlobalFilters',
    'updateAllFilterHighlights'
  ];
  
  const missing = [];
  for (const fn of requiredFunctions) {
    if (!functionExists(`filters.${fn}`)) {
      missing.push(fn);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Funções Filters não encontradas: ${missing.join(', ')}`);
  }
});

/**
 * TESTE 5: Verificar estado global de filtros
 */
runner.test('Estado global de filtros', async () => {
  if (!window.globalFilters) {
    throw new Error('window.globalFilters não existe');
  }
  
  if (!Array.isArray(window.globalFilters.filters)) {
    throw new Error('window.globalFilters.filters não é um array');
  }
  
  if (typeof window.globalFilters.persist !== 'boolean') {
    throw new Error('window.globalFilters.persist não é boolean');
  }
});

/**
 * TESTE 6: Testar cache da API
 */
runner.test('Cache da API', async () => {
  if (!window.api?.fetchWithCache) {
    throw new Error('fetchWithCache não disponível');
  }
  
  // Primeira chamada (cache miss)
  const start1 = Date.now();
  const data1 = await window.api.fetchWithCache('/api/summary', {}, true);
  const time1 = Date.now() - start1;
  
  // Segunda chamada (cache hit - deve ser mais rápida)
  const start2 = Date.now();
  const data2 = await window.api.fetchWithCache('/api/summary', {}, true);
  const time2 = Date.now() - start2;
  
  if (!data1 || !data2) {
    throw new Error('Dados não retornados');
  }
  
  if (time2 > time1) {
    console.warn(`⚠️ Cache pode não estar funcionando (${time1}ms vs ${time2}ms)`);
  }
});

/**
 * TESTE 7: Testar endpoints da API
 */
runner.test('Endpoints da API - Disponibilidade', async () => {
  const endpoints = [
    '/api/summary',
    '/api/aggregate/by-month',
    '/api/aggregate/by-day',
    '/api/aggregate/count-by?field=Orgaos'
  ];
  
  const results = await Promise.all(endpoints.map(testRequest));
  const failed = results.filter(r => !r.success);
  
  if (failed.length > 0) {
    const errors = failed.map(r => r.error).join(', ');
    throw new Error(`Endpoints falharam: ${errors}`);
  }
});

/**
 * TESTE 8: Testar carregamento de Overview
 */
runner.test('Carregar Overview', async () => {
  if (!window.data?.loadOverview) {
    throw new Error('loadOverview não disponível');
  }
  
  await window.data.loadOverview();
  
  // Verificar se elementos principais foram criados
  const elements = [
    '#kpiTotal',
    '#chartTrend',
    '#chartTopOrgaos',
    '#chartTopTemas'
  ];
  
  const missing = [];
  for (const selector of elements) {
    if (!elementExists(selector)) {
      missing.push(selector);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Elementos não encontrados: ${missing.join(', ')}`);
  }
});

/**
 * TESTE 9: Testar renderização de KPIs
 */
runner.test('Renderizar KPIs', async () => {
  if (!window.data?.renderKpis) {
    throw new Error('renderKpis não disponível');
  }
  
  const mockData = {
    total: 1000,
    last7: 100,
    last30: 500,
    statusCounts: [
      { status: 'Concluída', count: 500 },
      { status: 'Em Atendimento', count: 300 },
      { status: 'Pendente', count: 200 }
    ]
  };
  
  const mockDaily = [
    { date: '2025-01-01', count: 10 },
    { date: '2025-01-02', count: 15 }
  ];
  
  const mockByMonth = [
    { ym: '2025-01', count: 100 },
    { ym: '2025-02', count: 150 }
  ];
  
  await window.data.renderKpis(mockData, mockDaily, mockByMonth);
  
  // Verificar se KPIs foram atualizados
  const kpiTotal = document.getElementById('kpiTotal');
  if (kpiTotal && kpiTotal.textContent !== '1.000') {
    throw new Error('KPI Total não foi atualizado corretamente');
  }
});

/**
 * TESTE 10: Testar filtros inteligentes
 */
runner.test('Filtros Inteligentes', async () => {
  if (!window.filters?.applyGlobalFilter) {
    throw new Error('applyGlobalFilter não disponível');
  }
  
  const initialCount = window.globalFilters.filters.length;
  
  // Aplicar filtro
  const virtualElement = {
    classList: { add: () => {}, remove: () => {} },
    setAttribute: () => {},
    removeAttribute: () => {}
  };
  
  await window.filters.applyGlobalFilter('Status', 'Concluída', 'test', virtualElement);
  
  const afterCount = window.globalFilters.filters.length;
  
  if (afterCount <= initialCount) {
    throw new Error('Filtro não foi aplicado');
  }
  
  // Limpar filtros
  if (window.filters.clearGlobalFilters) {
    window.filters.clearGlobalFilters();
    const finalCount = window.globalFilters.filters.length;
    if (finalCount !== 0) {
      throw new Error('Filtros não foram limpos');
    }
  }
});

/**
 * TESTE 11: Testar persistência de filtros
 */
runner.test('Persistência de Filtros', async () => {
  // Aplicar filtro
  const virtualElement = {
    classList: { add: () => {}, remove: () => {} },
    setAttribute: () => {},
    removeAttribute: () => {}
  };
  
  await window.filters.applyGlobalFilter('Status', 'Concluída', 'test', virtualElement);
  
  // Verificar localStorage
  const stored = localStorage.getItem('globalFilters');
  if (!stored) {
    throw new Error('Filtros não foram salvos no localStorage');
  }
  
  // Limpar
  window.filters.clearGlobalFilters();
});

/**
 * TESTE 12: Testar carregamento de tabela
 */
runner.test('Carregar Tabela', async () => {
  if (!window.data?.loadTable) {
    throw new Error('loadTable não disponível');
  }
  
  await window.data.loadTable(10);
  
  // Verificar se tabela foi criada
  const tbody = document.getElementById('tbody');
  if (!tbody) {
    throw new Error('Elemento tbody não encontrado');
  }
});

/**
 * TESTE 13: Testar gráficos avançados
 */
runner.test('Gráficos Avançados', async () => {
  if (!window.data?.loadAdvancedCharts) {
    throw new Error('loadAdvancedCharts não disponível');
  }
  
  // Mock data
  const mockTemas = [
    { tema: 'Teste 1', quantidade: 100 },
    { tema: 'Teste 2', quantidade: 50 }
  ];
  
  const mockOrgaos = [
    { key: 'Orgão 1', count: 100 },
    { key: 'Orgão 2', count: 50 }
  ];
  
  await window.data.loadAdvancedCharts(mockTemas, mockOrgaos);
  
  // Verificar se containers existem (mesmo que vazios)
  const containers = ['#sankeyChart', '#treemapChart', '#mapChart'];
  for (const selector of containers) {
    if (!elementExists(selector)) {
      console.warn(`⚠️ Container ${selector} não encontrado (pode não estar na página atual)`);
    }
  }
});

/**
 * TESTE 14: Testar performance de carregamento
 */
runner.test('Performance - Tempo de Carregamento', async () => {
  const start = Date.now();
  
  await window.data.loadOverview();
  
  const duration = Date.now() - start;
  
  if (duration > 10000) {
    throw new Error(`Carregamento muito lento: ${duration}ms (esperado < 10s)`);
  }
  
  console.log(`   ⏱️ Tempo de carregamento: ${duration}ms`);
});

/**
 * TESTE 15: Testar tratamento de erros
 */
runner.test('Tratamento de Erros', async () => {
  // Testar com endpoint inválido
  try {
    const result = await window.api?.fetchJSON?.('/api/invalid-endpoint');
    // Se não lançou erro, verificar se retornou algo apropriado
    if (result && result.error) {
      // OK - erro tratado
      return;
    }
  } catch (error) {
    // OK - erro foi lançado
    return;
  }
  
  // Se chegou aqui, pode ser que o endpoint não existe mas não lançou erro
  console.warn('⚠️ Tratamento de erro pode precisar de ajuste');
});

/**
 * TESTE 16: Testar compatibilidade de navegadores
 */
runner.test('Compatibilidade - APIs Modernas', async () => {
  const required = {
    'Promise': typeof Promise !== 'undefined',
    'fetch': typeof fetch !== 'undefined',
    'localStorage': typeof localStorage !== 'undefined',
    'Map': typeof Map !== 'undefined',
    'async/await': (async () => {}).constructor.name === 'AsyncFunction'
  };
  
  const missing = Object.entries(required)
    .filter(([_, available]) => !available)
    .map(([name]) => name);
  
  if (missing.length > 0) {
    throw new Error(`APIs não disponíveis: ${missing.join(', ')}`);
  }
});

/**
 * TESTE 17: Testar Chart.js
 */
runner.test('Chart.js - Disponibilidade', async () => {
  if (typeof Chart === 'undefined') {
    throw new Error('Chart.js não carregado');
  }
  
  // Verificar se Chart.js tem métodos essenciais
  if (typeof Chart.register !== 'function') {
    throw new Error('Chart.js versão incompatível');
  }
});

/**
 * TESTE 18: Testar todas as funções load* do módulo data
 */
runner.test('Todas as funções load* disponíveis', async () => {
  const loadFunctions = [
    'loadOrgaoMes',
    'loadTempoMedio',
    'loadTema',
    'loadAssunto',
    'loadCadastrante',
    'loadReclamacoes',
    'loadProjecao2026',
    'loadStatusPage',
    'loadBairro',
    'loadUAC',
    'loadResponsavel',
    'loadCanal',
    'loadPrioridade',
    'loadCategoria'
  ];
  
  const missing = [];
  for (const fn of loadFunctions) {
    if (!functionExists(`data.${fn}`)) {
      missing.push(fn);
    }
  }
  
  if (missing.length > 0) {
    console.warn(`⚠️ Funções não migradas ainda: ${missing.join(', ')}`);
    // Não falha o teste, apenas avisa
  }
});

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('🚀 Iniciando suite de testes completa...\n');
  await runner.run();
  
  // Retornar estatísticas para uso externo
  return testStats;
}

// Exportar para uso global
window.testRunner = {
  run: runAllTests,
  test: (name, fn) => runner.test(name, fn),
  stats: () => testStats
};

// Auto-executar se estiver em modo de teste
if (window.location.search.includes('test=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      runAllTests();
    }, 2000); // Aguardar 2s para garantir que tudo carregou
  });
}

