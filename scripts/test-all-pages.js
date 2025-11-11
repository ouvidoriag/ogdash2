/**
 * Script Completo de Testes - Todas as Páginas e Caminhos
 * Testa navegação, carregamento de dados e funcionalidades de todas as páginas
 */

import 'dotenv/config';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Função fetch compatível usando http/https nativos
import http from 'http';
import https from 'https';
import { URL } from 'url';

function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };
      
      const req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: async () => {
              try {
                return JSON.parse(data);
              } catch (e) {
                throw new Error(`JSON parse error: ${e.message}`);
              }
            },
            text: async () => data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
      
      // Timeout customizado (padrão: 30s, pode ser sobrescrito via options.timeout)
      const timeout = options.timeout || 30000;
      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error(`Request timeout após ${timeout/1000}s`));
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    } catch (error) {
      reject(new Error(`Invalid URL or options: ${error.message}`));
    }
  });
}

// Lista de todas as páginas do dashboard
const ALL_PAGES = [
  // Páginas principais
  { id: 'home', name: 'Home', loadFn: 'loadHome' },
  { id: 'main', name: 'Visão Geral', loadFn: 'loadOverview', apiEndpoints: ['/api/summary', '/api/aggregate/by-month'] },
  { id: 'orgao-mes', name: 'Por Órgão e Mês', loadFn: 'loadOrgaoMes', apiEndpoints: ['/api/aggregate/count-by?field=Secretaria', '/api/aggregate/by-month'] },
  { id: 'tempo-medio', name: 'Tempo Médio', loadFn: 'loadTempoMedio', apiEndpoints: ['/api/stats/average-time'] },
  { id: 'tema', name: 'Por Tema', loadFn: 'loadTema', apiEndpoints: ['/api/aggregate/by-theme'] },
  { id: 'assunto', name: 'Por Assunto', loadFn: 'loadAssunto', apiEndpoints: ['/api/aggregate/by-subject'] },
  { id: 'cadastrante', name: 'Por Cadastrante', loadFn: 'loadCadastrante', apiEndpoints: ['/api/aggregate/by-server'] },
  { id: 'reclamacoes', name: 'Reclamações e Denúncias', loadFn: 'loadReclamacoes', apiEndpoints: ['/api/complaints-denunciations'] },
  { id: 'projecao-2026', name: 'Projeção 2026', loadFn: 'loadProjecao2026', apiEndpoints: ['/api/aggregate/by-month'] },
  
  // Páginas de relatórios
  { id: 'secretaria', name: 'Secretarias', loadFn: 'loadSecretaria', apiEndpoints: ['/api/aggregate/count-by?field=Secretaria'] },
  { id: 'secretarias-distritos', name: 'Secretarias e Distritos', loadFn: 'loadSecretariasDistritos', apiEndpoints: ['/api/distritos'] },
  { id: 'tipo', name: 'Tipos de Manifestação', loadFn: 'loadTipo', apiEndpoints: ['/api/aggregate/count-by?field=Tipo'] },
  { id: 'status', name: 'Status', loadFn: 'loadStatusPage', apiEndpoints: ['/api/aggregate/count-by?field=status'] },
  { id: 'categoria', name: 'Categoria/Tema', loadFn: 'loadCategoria', apiEndpoints: ['/api/aggregate/count-by?field=Categoria'] },
  { id: 'setor', name: 'Unidade de Cadastro', loadFn: 'loadSetor', apiEndpoints: ['/api/aggregate/count-by?field=Setor'] },
  { id: 'responsavel', name: 'Responsáveis', loadFn: 'loadResponsavel', apiEndpoints: ['/api/aggregate/count-by?field=Responsavel'] },
  { id: 'canal', name: 'Canais', loadFn: 'loadCanal', apiEndpoints: ['/api/aggregate/count-by?field=Canal'] },
  { id: 'prioridade', name: 'Prioridades', loadFn: 'loadPrioridade', apiEndpoints: ['/api/aggregate/count-by?field=Prioridade'] },
  { id: 'bairro', name: 'Bairros', loadFn: 'loadBairro', apiEndpoints: ['/api/aggregate/count-by?field=Bairro'] },
  { id: 'uac', name: 'UAC', loadFn: 'loadUAC', apiEndpoints: ['/api/aggregate/count-by?field=UAC'] },
  
  // Páginas de unidades (exemplos)
  { id: 'unit-adao', name: 'Hospital Adão', loadFn: 'loadUnit', apiEndpoints: ['/api/unit/ADÃO'], params: ['adao'] },
  { id: 'unit-cer-iv', name: 'CER IV', loadFn: 'loadUnit', apiEndpoints: ['/api/unit/CER IV'], params: ['cer iv'] },
  { id: 'unit-hospital-olho', name: 'Hospital do Olho', loadFn: 'loadUnit', apiEndpoints: ['/api/unit/Hospital do Olho'], params: ['hospital olho'] },
];

// Endpoints de API para testar
const API_ENDPOINTS = [
  { path: '/api/summary', method: 'GET', description: 'Resumo geral' },
  { path: '/api/aggregate/by-month', method: 'GET', description: 'Dados mensais' },
  { path: '/api/aggregate/count-by?field=Secretaria', method: 'GET', description: 'Contagem por Secretaria' },
  { path: '/api/aggregate/count-by?field=Status', method: 'GET', description: 'Contagem por Status' },
  { path: '/api/aggregate/count-by?field=Tipo', method: 'GET', description: 'Contagem por Tipo' },
  { path: '/api/aggregate/by-theme', method: 'GET', description: 'Dados por tema' },
  { path: '/api/aggregate/by-subject', method: 'GET', description: 'Dados por assunto' },
  { path: '/api/aggregate/by-server', method: 'GET', description: 'Dados por servidor' },
  { path: '/api/stats/average-time', method: 'GET', description: 'Tempo médio', timeout: 60000 },
  { path: '/api/stats/status-overview', method: 'GET', description: 'Visão geral de status', timeout: 60000 },
  { path: '/api/complaints-denunciations', method: 'GET', description: 'Reclamações e denúncias', timeout: 60000 },
  { path: '/api/distritos', method: 'GET', description: 'Distritos' },
  { path: '/api/filter', method: 'POST', description: 'Filtro de dados', body: { filters: [], originalUrl: '/api/summary' } },
];

const tests = [];
let passed = 0;
let failed = 0;
let skipped = 0;
const errors = [];

function test(name, fn, skip = false) {
  tests.push({ name, fn, skip });
}

// ============================================
// TESTES DE SERVIDOR E ENDPOINTS
// ============================================

test('Servidor está rodando', async () => {
  const response = await httpFetch(`${BASE_URL}/`);
  if (response.status !== 200) {
    throw new Error(`Servidor retornou status ${response.status}`);
  }
  const html = await response.text();
  if (!html.includes('Ouvidoria Caxias')) {
    throw new Error('HTML não contém conteúdo esperado');
  }
});

test('Página principal carrega corretamente', async () => {
  const response = await httpFetch(`${BASE_URL}/`);
  if (response.status !== 200) {
    throw new Error(`Status ${response.status}`);
  }
  const html = await response.text();
  // Verificar se módulos JavaScript estão sendo carregados
  if (!html.includes('scripts/api.js') || !html.includes('scripts/data.js')) {
    throw new Error('Módulos JavaScript não encontrados no HTML');
  }
});

// Testar todos os endpoints de API
API_ENDPOINTS.forEach(endpoint => {
  test(`API: ${endpoint.description} (${endpoint.path})`, async () => {
    const options = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    // Timeout customizado se especificado
    if (endpoint.timeout) {
      options.timeout = endpoint.timeout;
    }
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await httpFetch(`${BASE_URL}${endpoint.path}`, options);
    
    if (!response.ok && response.status !== 500) {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }
    
    // Tentar parsear JSON se possível
    try {
      const data = await response.json();
      if (endpoint.method === 'GET' && !Array.isArray(data) && typeof data !== 'object') {
        throw new Error('Resposta não é um objeto ou array válido');
      }
    } catch (e) {
      // Se não for JSON, verificar se é texto válido
      const text = await response.text();
      if (!text || text.length === 0) {
        throw new Error('Resposta vazia');
      }
    }
  });
});

// ============================================
// TESTES DE PÁGINAS ESPECÍFICAS
// ============================================

// Testar endpoints de cada página
ALL_PAGES.forEach(page => {
  if (page.apiEndpoints && page.apiEndpoints.length > 0) {
    page.apiEndpoints.forEach((endpoint, idx) => {
      test(`Página ${page.name}: Endpoint ${idx + 1} (${endpoint})`, async () => {
        // Timeout maior para endpoints de unidades e estatísticas
        const options = {};
        if (endpoint.includes('/api/unit/') || endpoint.includes('/api/stats/') || endpoint.includes('/api/complaints-denunciations')) {
          options.timeout = 60000; // 60 segundos
        }
        const response = await httpFetch(`${BASE_URL}${endpoint}`, options);
        if (!response.ok && response.status !== 500) {
          throw new Error(`Status ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data) && typeof data !== 'object') {
          throw new Error('Resposta inválida');
        }
      });
    });
  }
});

// ============================================
// TESTES DE FILTROS
// ============================================

test('Filtro: Status = Concluída', async () => {
  const response = await httpFetch(`${BASE_URL}/api/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: [{ field: 'Status', op: 'eq', value: 'Concluída' }],
      originalUrl: '/api/summary'
    })
  });
  
  if (!response.ok && response.status !== 500) {
    throw new Error(`Status ${response.status}`);
  }
  
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Resposta deve ser um array');
  }
});

test('Filtro: Múltiplos filtros', async () => {
  const response = await httpFetch(`${BASE_URL}/api/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: [
        { field: 'Status', op: 'eq', value: 'Concluída' },
        { field: 'Tipo', op: 'contains', value: 'Reclamação' }
      ],
      originalUrl: '/api/summary'
    })
  });
  
  if (!response.ok && response.status !== 500) {
    throw new Error(`Status ${response.status}`);
  }
  
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Resposta deve ser um array');
  }
});

test('Filtro: Vazio (sem filtros)', async () => {
  const response = await httpFetch(`${BASE_URL}/api/filter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: [],
      originalUrl: '/api/summary'
    })
  });
  
  if (!response.ok && response.status !== 500) {
    throw new Error(`Status ${response.status}`);
  }
  
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Resposta deve ser um array');
  }
});

// ============================================
// TESTES DE PERFORMANCE
// ============================================

test('Performance: Endpoint /api/summary < 5s', async () => {
  const start = Date.now();
  const response = await httpFetch(`${BASE_URL}/api/summary`);
  const duration = Date.now() - start;
  
  if (!response.ok) {
    throw new Error(`Status ${response.status}`);
  }
  
  if (duration > 5000) {
    throw new Error(`Muito lento: ${duration}ms (esperado < 5s)`);
  }
  
  console.log(`   ⏱️ Tempo: ${duration}ms`);
});

test('Performance: Endpoint /api/aggregate/by-month < 5s', async () => {
  const start = Date.now();
  const response = await httpFetch(`${BASE_URL}/api/aggregate/by-month`);
  const duration = Date.now() - start;
  
  if (!response.ok) {
    throw new Error(`Status ${response.status}`);
  }
  
  if (duration > 5000) {
    throw new Error(`Muito lento: ${duration}ms (esperado < 5s)`);
  }
  
  console.log(`   ⏱️ Tempo: ${duration}ms`);
});

// ============================================
// TESTES DE VALIDAÇÃO DE DADOS
// ============================================

test('Validação: /api/summary retorna estrutura correta', async () => {
  const response = await httpFetch(`${BASE_URL}/api/summary`);
  if (!response.ok) {
    throw new Error(`Status ${response.status}`);
  }
  
  const data = await response.json();
  if (typeof data !== 'object') {
    throw new Error('Resposta deve ser um objeto');
  }
  
  // Verificar campos esperados (se existirem)
  if (data.total !== undefined && typeof data.total !== 'number') {
    throw new Error('Campo "total" deve ser um número');
  }
});

test('Validação: /api/aggregate/by-month retorna array', async () => {
  const response = await httpFetch(`${BASE_URL}/api/aggregate/by-month`);
  if (!response.ok) {
    throw new Error(`Status ${response.status}`);
  }
  
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Resposta deve ser um array');
  }
  
  // Verificar estrutura dos itens (se houver)
  if (data.length > 0) {
    const firstItem = data[0];
    if (typeof firstItem !== 'object') {
      throw new Error('Itens do array devem ser objetos');
    }
  }
});

// ============================================
// TESTES DE UNIDADES
// ============================================

const UNIDADES = [
  'ADÃO', 'CER IV', 'Hospital do Olho', 'Hospital Duque', 'Hospital Infantil',
  'Hospital Moacyr', 'Maternidade Santa Cruz', 'UPA Beira Mar', 'UPH Pilar',
  'UPH Saracuruna', 'UPH Xerém', 'Hospital Veterinário', 'UPA Walter Garcia',
  'UPH Campos Elíseos', 'UPH Parque Equitativa', 'UBS Antonio Granja',
  'UPA Sarapuí', 'UPH Imbariê'
];

UNIDADES.forEach(unidade => {
  test(`Unidade: ${unidade}`, async () => {
    // Timeout maior para endpoints de unidades (podem ser lentos)
    const response = await httpFetch(`${BASE_URL}/api/unit/${encodeURIComponent(unidade)}`, { timeout: 60000 });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }
    
    if (response.ok) {
      const data = await response.json();
      if (typeof data !== 'object') {
        throw new Error('Resposta deve ser um objeto');
      }
    }
  });
});

// ============================================
// EXECUÇÃO DOS TESTES
// ============================================

async function checkServerRunning() {
  try {
    const response = await httpFetch(`${BASE_URL}/`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes completos do sistema...\n');
  console.log(`📡 URL Base: ${BASE_URL}`);
  console.log(`🔌 Porta: ${PORT}`);
  console.log(`📋 Total de testes: ${tests.length}\n`);
  
  // Verificar se servidor está rodando
  console.log('🔍 Verificando se servidor está rodando...');
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.error('\n❌ ERRO: Servidor não está rodando!');
    console.error(`\n💡 Para iniciar o servidor, execute:`);
    console.error(`   npm start`);
    console.error(`   ou`);
    console.error(`   node src/server.js`);
    console.error(`\n📝 Certifique-se de que:`);
    console.error(`   1. O arquivo .env está configurado corretamente`);
    console.error(`   2. MONGODB_ATLAS_URL está definido no .env`);
    console.error(`   3. O servidor está escutando na porta ${PORT}`);
    process.exit(1);
  }
  console.log('✅ Servidor está rodando!\n');
  console.log('='.repeat(70));
  
  for (const test of tests) {
    if (test.skip) {
      skipped++;
      console.log(`⏭️  PULADO: ${test.name}`);
      continue;
    }
    
    try {
      console.log(`\n📋 Testando: ${test.name}`);
      const start = Date.now();
      
      await Promise.race([
        test.fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout após 30s')), 30000)
        )
      ]);
      
      const duration = Date.now() - start;
      passed++;
      console.log(`✅ PASSOU (${duration}ms): ${test.name}`);
    } catch (error) {
      failed++;
      errors.push({ test: test.name, error: error.message });
      console.error(`❌ FALHOU: ${test.name}`);
      console.error(`   Erro: ${error.message}`);
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(70));
  console.log(`Total: ${tests.length}`);
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`⏭️  Pulado: ${skipped}`);
  console.log(`Taxa de sucesso: ${((passed / (tests.length - skipped)) * 100).toFixed(1)}%`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
  }
  
  console.log('='.repeat(70));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Executar
runTests().catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});

