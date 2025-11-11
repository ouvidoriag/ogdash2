/**
 * Script para executar testes do servidor via Node.js
 * Testa endpoints e funcionalidades básicas
 * Requer Node.js 18+ (fetch nativo) ou node-fetch instalado
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
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
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

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function checkServerRunning() {
  try {
    const response = await httpFetch(`${BASE_URL}/`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes do servidor...\n');
  console.log(`📡 URL Base: ${BASE_URL}`);
  console.log(`🔌 Porta: ${PORT}\n`);
  
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
  
  // Teste 1: Servidor está rodando
  test('Servidor está rodando', async () => {
    const response = await httpFetch(`${BASE_URL}/`);
    if (response.status !== 200) {
      throw new Error(`Servidor retornou status ${response.status}`);
    }
  });
  
  // Teste 2: Endpoint /api/summary
  test('Endpoint /api/summary', async () => {
    const response = await httpFetch(`${BASE_URL}/api/summary`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Resposta inválida');
    }
  });
  
  // Teste 3: Endpoint /api/aggregate/by-month
  test('Endpoint /api/aggregate/by-month', async () => {
    const response = await httpFetch(`${BASE_URL}/api/aggregate/by-month`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Resposta deve ser um array');
    }
  });
  
  // Teste 4: Endpoint /api/filter (POST)
  test('Endpoint /api/filter - POST', async () => {
    const response = await httpFetch(`${BASE_URL}/api/filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: [] })
    });
    if (!response.ok && response.status !== 500) {
      throw new Error(`Status ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Resposta deve ser um array');
    }
  });
  
  // Teste 5: Endpoint /api/filter com filtros
  test('Endpoint /api/filter - Com filtros', async () => {
    const response = await httpFetch(`${BASE_URL}/api/filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        filters: [
          { field: 'Status', op: 'eq', value: 'Concluída' }
        ]
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Resposta deve ser um array');
    }
  });
  
  // Teste 6: Performance - tempo de resposta
  test('Performance - Tempo de resposta < 5s', async () => {
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
  
  // Executar todos os testes
  for (const test of tests) {
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
      console.error(`❌ FALHOU: ${test.name}`);
      console.error(`   Erro: ${error.message}`);
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  console.log(`Total: ${tests.length}`);
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`Taxa de sucesso: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Executar
runTests().catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});

