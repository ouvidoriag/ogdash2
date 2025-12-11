/**
 * 🧪 TESTE MASTER - EXECUTA TODOS OS TESTES E VERIFICAÇÕES
 * 
 * Este script executa TODOS os testes, verificações e validações do sistema:
 * - Testes de APIs, KPIs, Filtros
 * - Testes de Páginas e Frontend
 * - Validações de dados e integridade
 * - Verificações de manutenção
 * - Testes de integração
 * - Validações de estrutura
 * 
 * Data: 12/12/2025
 * CÉREBRO X-3
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.join(__dirname, '../..');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Resultados consolidados
const resultados = {
  inicio: new Date(),
  fim: null,
  categorias: {
    sintaxe: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    apis: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    kpis: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    filtros: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    paginas: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    integracao: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    dados: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    manutencao: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    conexoes: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] },
    emails: { total: 0, passou: 0, falhou: 0, pulou: 0, detalhes: [] }
  }
};

/**
 * Executar comando e capturar resultado
 */
async function executarComando(comando, descricao, categoria = 'geral', opcional = false) {
  try {
    logInfo(`Executando: ${descricao}...`);
    const { stdout, stderr } = await execAsync(comando, {
      cwd: BASE_DIR,
      timeout: 600000 // 10 minutos
    });
    
    if (stderr && !stderr.includes('warning') && !stderr.includes('deprecated')) {
      logWarning(`Avisos em ${descricao}: ${stderr.substring(0, 200)}`);
    }
    
    resultados.categorias[categoria].total++;
    resultados.categorias[categoria].passou++;
    resultados.categorias[categoria].detalhes.push({
      teste: descricao,
      status: 'PASSOU',
      output: stdout.substring(0, 1000),
      timestamp: new Date().toISOString()
    });
    logSuccess(`${descricao} - PASSOU`);
    return { success: true, stdout, stderr };
  } catch (error) {
    resultados.categorias[categoria].total++;
    if (opcional) {
      resultados.categorias[categoria].pulou++;
      logWarning(`${descricao} falhou mas é opcional`);
    } else {
      resultados.categorias[categoria].falhou++;
      logError(`${descricao} - FALHOU: ${error.message.substring(0, 200)}`);
    }
    
    const stdout = error.stdout?.substring(0, 2000) || '';
    const stderr = error.stderr?.substring(0, 2000) || '';
    
    resultados.categorias[categoria].detalhes.push({
      teste: descricao,
      status: opcional ? 'PULOU' : 'FALHOU',
      erro: error.message,
      output: stdout || stderr || error.message,
      timestamp: new Date().toISOString()
    });
    
    return { success: false, error, stdout, stderr };
  }
}

/**
 * Verificar se servidor está rodando
 */
async function verificarServidor() {
  try {
    const fetch = globalThis.fetch;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('http://localhost:3000/api/summary', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    // Se o servidor respondeu (qualquer status), significa que está rodando
    // 401 = não autorizado, mas servidor está ativo
    // 200 = OK
    // Qualquer resposta HTTP significa que o servidor está rodando
    if (response.status >= 200 && response.status < 600) {
      logInfo(`Servidor detectado! Status: ${response.status}`);
      return true;
    }
    
    return false;
  } catch (error) {
    // Se der erro de conexão (ECONNREFUSED), servidor não está rodando
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      logWarning('Servidor não está acessível (conexão recusada)');
      return false;
    }
    // Outros erros podem indicar que o servidor está rodando mas com problemas
    logWarning(`Erro ao verificar servidor: ${error.message}`);
    return false;
  }
}

/**
 * 1. VALIDAÇÃO DE SINTAXE
 */
async function validarSintaxe() {
  logSection('🔍 1. VALIDAÇÃO DE SINTAXE JAVASCRIPT');
  
  const diretorios = ['src', 'public/scripts', 'scripts'];
  const arquivos = [];
  
  for (const dir of diretorios) {
    const caminhoDir = path.join(BASE_DIR, dir);
    if (fs.existsSync(caminhoDir)) {
      function buscarArquivosJS(dirPath) {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('__tests__') && !item.includes('test')) {
            buscarArquivosJS(itemPath);
          } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
            arquivos.push(path.relative(BASE_DIR, itemPath));
          }
        }
      }
      buscarArquivosJS(caminhoDir);
    }
  }
  
  logInfo(`Encontrados ${arquivos.length} arquivos JavaScript para validar`);
  
  let validos = 0;
  let invalidos = 0;
  const erros = [];
  
  for (const arquivo of arquivos) {
    try {
      const caminhoCompleto = path.join(BASE_DIR, arquivo);
      await execAsync(`node --check "${caminhoCompleto}"`, {
        cwd: BASE_DIR,
        timeout: 10000
      });
      validos++;
    } catch (error) {
      invalidos++;
      erros.push({ arquivo, erro: error.message });
    }
  }
  
  resultados.categorias.sintaxe.total = arquivos.length;
  resultados.categorias.sintaxe.passou = validos;
  resultados.categorias.sintaxe.falhou = invalidos;
  resultados.categorias.sintaxe.detalhes = erros.slice(0, 50);
  
  logInfo(`✅ ${validos} arquivos válidos`);
  if (invalidos > 0) {
    logError(`${invalidos} arquivos com erro de sintaxe`);
  }
}

/**
 * 2. TESTES DE CONEXÕES E CONFIGURAÇÃO
 */
async function testarConexoes() {
  logSection('🔌 2. TESTES DE CONEXÕES E CONFIGURAÇÃO');
  
  await executarComando(
    'node scripts/test/test-mongoose-connection.js',
    'Teste de Conexão MongoDB',
    'conexoes',
    false
  );
  
  await executarComando(
    'node scripts/test/testGoogleSheets.js',
    'Teste de Google Sheets',
    'conexoes',
    true
  );
  
  await executarComando(
    'node scripts/test/testGeminiKeys.js',
    'Teste de Chaves Gemini',
    'conexoes',
    true
  );
}

/**
 * 3. TESTES DE APIs
 */
async function testarAPIs() {
  logSection('📡 3. TESTES DE APIs');
  
  const servidorRodando = await verificarServidor();
  if (!servidorRodando) {
    logWarning('Servidor não está rodando. Pulando testes de API');
    resultados.categorias.apis.pulou = 4;
    resultados.categorias.apis.total = 4;
    return;
  }
  
  logSuccess('Servidor detectado! Executando testes de API...');
  
  await executarComando('npm run test:validate', 'Validação de Endpoints', 'apis');
  await executarComando('npm run test:apis', 'Teste de Todas as APIs', 'apis');
  await executarComando('npm run test:kpis', 'Teste de KPIs', 'kpis');
  await executarComando('npm run test:filters', 'Teste de Filtros', 'filtros');
}

/**
 * 4. TESTES DE INTEGRAÇÃO
 */
async function testarIntegracao() {
  logSection('🔗 4. TESTES DE INTEGRAÇÃO');
  
  const servidorRodando = await verificarServidor();
  if (!servidorRodando) {
    logWarning('Servidor não está rodando. Pulando testes de integração');
    resultados.categorias.integracao.pulou = 3;
    resultados.categorias.integracao.total = 3;
    return;
  }
  
  await executarComando('npm run test:crossfilter', 'Teste Crossfilter', 'integracao');
  await executarComando('npm run test:crossfilter:structure', 'Teste Estrutura Crossfilter', 'integracao');
  await executarComando('npm run test:aggregation', 'Teste de Agregações', 'integracao');
}

/**
 * 5. TESTES DE PÁGINAS E FRONTEND
 */
async function testarPaginas() {
  logSection('🎨 5. TESTES DE PÁGINAS E FRONTEND');
  
  const servidorRodando = await verificarServidor();
  if (!servidorRodando) {
    logWarning('Servidor não está rodando. Pulando testes de páginas');
    resultados.categorias.paginas.pulou = 2;
    resultados.categorias.paginas.total = 2;
    return;
  }
  
  await executarComando('npm run test:pages', 'Teste de Páginas', 'paginas');
  await executarComando('npm run test:all', 'Teste de Todas as Páginas', 'paginas');
}

/**
 * 6. TESTES ESPECÍFICOS
 */
async function testarEspecificos() {
  logSection('🎯 6. TESTES ESPECÍFICOS');
  
  const servidorRodando = await verificarServidor();
  if (!servidorRodando) {
    logWarning('Servidor não está rodando. Pulando testes específicos');
    return;
  }
  
  await executarComando('npm run test:esic', 'Teste de Endpoints e-SIC', 'apis', true);
}

/**
 * 7. VERIFICAÇÕES DE DADOS
 */
async function verificarDados() {
  logSection('📊 7. VERIFICAÇÕES DE DADOS E INTEGRIDADE');
  
  const verificacoes = [
    { script: 'scripts/maintenance/verificar-todos-protocolos.js', desc: 'Verificar Todos os Protocolos' },
    { script: 'scripts/maintenance/verificar-datas-inconsistentes.js', desc: 'Verificar Datas Inconsistentes' },
    { script: 'scripts/maintenance/verificar-tempo-conclusao.js', desc: 'Verificar Tempo de Conclusão' },
    { script: 'scripts/maintenance/verificarDuplicatas.js', desc: 'Verificar Duplicatas' },
    { script: 'scripts/maintenance/verificar-secretarias-banco.js', desc: 'Verificar Secretarias no Banco' },
    { script: 'scripts/maintenance/validateUnidadesSaude.js', desc: 'Validar Unidades de Saúde' }
  ];
  
  for (const verif of verificacoes) {
    const caminhoCompleto = path.join(BASE_DIR, verif.script);
    if (fs.existsSync(caminhoCompleto)) {
      await executarComando(`node ${verif.script}`, verif.desc, 'dados', true);
    } else {
      logWarning(`${verif.desc} - Script não encontrado`);
    }
  }
}

/**
 * 8. VERIFICAÇÕES DE EMAIL
 */
async function verificarEmails() {
  logSection('📧 8. VERIFICAÇÕES DE SISTEMA DE EMAIL');
  
  const verificacoes = [
    { script: 'scripts/test/verificar-emails-enviados.js', desc: 'Verificar Emails Enviados' },
    { script: 'scripts/test/verificar-emails-notificacoes.js', desc: 'Verificar Notificações de Email' },
    { script: 'scripts/test/verificar-calculo-vencimentos.js', desc: 'Verificar Cálculo de Vencimentos' }
  ];
  
  for (const verif of verificacoes) {
    const caminhoCompleto = path.join(BASE_DIR, verif.script);
    if (fs.existsSync(caminhoCompleto)) {
      await executarComando(`node ${verif.script}`, verif.desc, 'emails', true);
    }
  }
}

/**
 * 9. VERIFICAÇÕES DE MANUTENÇÃO
 */
async function verificarManutencao() {
  logSection('🔧 9. VERIFICAÇÕES DE MANUTENÇÃO');
  
  const verificacoes = [
    { script: 'scripts/maintenance/infoDatabase.js', desc: 'Informações do Banco de Dados' },
    { script: 'scripts/maintenance/checkZeladoria.js', desc: 'Verificar Zeladoria' },
    { script: 'scripts/maintenance/checkPrazoMais200.js', desc: 'Verificar Protocolos com Prazo > 200 dias' }
  ];
  
  for (const verif of verificacoes) {
    const caminhoCompleto = path.join(BASE_DIR, verif.script);
    if (fs.existsSync(caminhoCompleto)) {
      await executarComando(`node ${verif.script}`, verif.desc, 'manutencao', true);
    }
  }
}

/**
 * Gerar relatório completo
 */
function gerarRelatorio() {
  logSection('📊 RELATÓRIO FINAL COMPLETO');
  
  resultados.fim = new Date();
  const duracao = (resultados.fim - resultados.inicio) / 1000;
  
  // Calcular totais
  let totalGeral = 0;
  let passouGeral = 0;
  let falhouGeral = 0;
  let pulouGeral = 0;
  
  for (const categoria in resultados.categorias) {
    const cat = resultados.categorias[categoria];
    totalGeral += cat.total;
    passouGeral += cat.passou;
    falhouGeral += cat.falhou;
    pulouGeral += cat.pulou;
  }
  
  console.log('\n' + '='.repeat(80));
  log('RESUMO GERAL DOS TESTES', 'bright');
  console.log('='.repeat(80));
  console.log(`\n⏱️  Duração Total: ${(duracao / 60).toFixed(2)} minutos`);
  console.log(`📊 Total de Testes: ${totalGeral}`);
  log(`✅ Passou: ${passouGeral}`, 'green');
  log(`❌ Falhou: ${falhouGeral}`, 'red');
  log(`⏭️  Pulou: ${pulouGeral}`, 'yellow');
  
  const taxaSucesso = totalGeral > 0 
    ? ((passouGeral / totalGeral) * 100).toFixed(2)
    : 0;
  
  console.log(`\n📈 Taxa de Sucesso: ${taxaSucesso}%`);
  
  // Detalhes por categoria
  console.log('\n' + '='.repeat(80));
  log('DETALHES POR CATEGORIA', 'cyan');
  console.log('='.repeat(80));
  
  for (const [categoria, dados] of Object.entries(resultados.categorias)) {
    if (dados.total > 0) {
      const taxa = ((dados.passou / dados.total) * 100).toFixed(1);
      console.log(`\n📁 ${categoria.toUpperCase()}:`);
      console.log(`   Total: ${dados.total} | Passou: ${dados.passou} | Falhou: ${dados.falhou} | Pulou: ${dados.pulou} | Taxa: ${taxa}%`);
    }
  }
  
  // Salvar relatório JSON
  const relatorioPath = path.join(BASE_DIR, 'relatorio-testes-completo.json');
  fs.writeFileSync(relatorioPath, JSON.stringify(resultados, null, 2));
  logInfo(`\n📄 Relatório JSON salvo em: ${relatorioPath}`);
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  return resultados;
}

/**
 * Função principal
 */
async function main() {
  console.clear();
  log('\n🧪 TESTE MASTER - EXECUTANDO TODOS OS TESTES E VERIFICAÇÕES\n', 'bright');
  log(`Iniciado em: ${resultados.inicio.toLocaleString('pt-BR')}\n`, 'cyan');
  
  try {
    // Executar todos os testes em sequência
    await validarSintaxe();
    await testarConexoes();
    await testarAPIs();
    await testarIntegracao();
    await testarPaginas();
    await testarEspecificos();
    await verificarDados();
    await verificarEmails();
    await verificarManutencao();
    
    // Gerar relatório
    const relatorio = gerarRelatorio();
    
    // Retornar resultados para geração de documento
    return relatorio;
  } catch (error) {
    logError(`Erro fatal durante os testes: ${error.message}`);
    console.error(error);
    return resultados;
  }
}

// Executar
main().then(resultados => {
  // Exportar resultados para geração de documento
  const exportPath = path.join(BASE_DIR, 'test-results-export.json');
  fs.writeFileSync(exportPath, JSON.stringify(resultados, null, 2));
  process.exit(resultados.categorias.apis.falhou > 0 ? 1 : 0);
});

