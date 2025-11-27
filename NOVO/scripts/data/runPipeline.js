/**
 * Script de Pipeline Completo
 * 
 * Integra todo o processo:
 * 1. Executa o main.py do Pipeline (que já faz todo o tratamento)
 * 2. Lê os dados da planilha tratada atualizada
 * 3. Salva no banco de dados
 * 
 * Uso: node scripts/data/runPipeline.js
 * OU: npm run pipeline
 * 
 * REQUISITOS:
 * - Python 3 instalado
 * - Dependências do Pipeline instaladas (pip install -r Pipeline/requirements.txt)
 * - Credenciais Google em google-credentials.json
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { normalizeDate } from '../src/utils/dateUtils.js';

const execAsync = promisify(exec);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const pipelineRoot = path.join(projectRoot, '..'); // Volta para Dashboard/

// IDs do Google Drive
const FOLDER_ID_BRUTA = process.env.GOOGLE_FOLDER_BRUTA || "1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5";
const PLANILHA_TRATADA_ID = process.env.GOOGLE_SHEET_ID || "1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g";

/**
 * Preparar credenciais para o Python (converter para Base64 como esperado pelo main.py)
 */
function prepareCredentialsForPython() {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_FILE || 'config/google-credentials.json';
  const credentialsFile = path.isAbsolute(credentialsPath)
    ? credentialsPath
    : path.join(projectRoot, credentialsPath);
  
  if (!fs.existsSync(credentialsFile)) {
    throw new Error(`❌ Arquivo de credenciais não encontrado: ${credentialsFile}`);
  }
  
  // Ler credenciais JSON
  const credentialsContent = fs.readFileSync(credentialsFile, 'utf-8');
  const credentials = JSON.parse(credentialsContent);
  
  // Converter para Base64 (como o main.py espera)
  const credentialsBase64 = Buffer.from(JSON.stringify(credentials)).toString('base64');
  
  // Criar arquivo temporário para o Python (no formato esperado pelo main.py)
  // O main.py espera: .github/workflows/credentials.json (Base64)
  const pythonCredentialsPath = path.join(pipelineRoot, '.github', 'workflows', 'credentials.json');
  const pythonCredentialsDir = path.dirname(pythonCredentialsPath);
  
  // Criar diretório se não existir
  if (!fs.existsSync(pythonCredentialsDir)) {
    fs.mkdirSync(pythonCredentialsDir, { recursive: true });
  }
  
  // Escrever credenciais em Base64 (como o main.py espera)
  fs.writeFileSync(pythonCredentialsPath, credentialsBase64, 'utf-8');
  
  console.log(`✅ Credenciais preparadas para o Python em: ${pythonCredentialsPath}\n`);
  
  return pythonCredentialsPath;
}

/**
 * Executar o main.py do Pipeline
 */
async function runPythonPipeline() {
  console.log('🐍 Executando pipeline Python...\n');
  
  const pythonScriptPath = path.join(pipelineRoot, 'Pipeline', 'main.py');
  
  if (!fs.existsSync(pythonScriptPath)) {
    throw new Error(`❌ Script Python não encontrado: ${pythonScriptPath}`);
  }
  
  // Verificar se Python está instalado (tentar múltiplos comandos no Windows)
  let pythonCmd = null;
  const pythonCommands = process.platform === 'win32' 
    ? ['py', 'python', 'python3'] 
    : ['python3', 'python'];
  
  for (const cmd of pythonCommands) {
    try {
      await execAsync(`${cmd} --version`);
      pythonCmd = cmd;
      console.log(`✅ Python encontrado: ${cmd}\n`);
      break;
    } catch (error) {
      // Continuar tentando
    }
  }
  
  if (!pythonCmd) {
    console.log('\n⚠️  Python não encontrado.');
    console.log('   Execute: npm run setup:python');
    console.log('   Ou instale manualmente: https://www.python.org/downloads/\n');
    throw new Error('❌ Python não encontrado. Execute: npm run setup:python');
  }
  
  // Executar o script Python (usar cwd ao invés de cd no comando)
  console.log(`📝 Executando: ${pythonCmd} "${pythonScriptPath}"`);
  console.log(`📁 Diretório: ${pipelineRoot}\n`);
  
  try {
    // Configurar encoding UTF-8 para o Python (resolve problema de emojis no Windows)
    const env = {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
    };
    
    const { stdout, stderr } = await execAsync(`"${pythonCmd}" "${pythonScriptPath}"`, {
      maxBuffer: 10 * 1024 * 1024, // 10MB
      cwd: pipelineRoot,
      shell: true,
      env: env,
    });
    
    if (stdout) {
      console.log('📋 Saída do Python:');
      console.log(stdout);
    }
    
    if (stderr) {
      console.warn('⚠️  Avisos do Python:');
      console.warn(stderr);
    }
    
    console.log('✅ Pipeline Python executado com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao executar pipeline Python:');
    console.error(error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    throw error;
  }
}

/**
 * Autenticar e obter cliente do Google Sheets
 */
async function getGoogleClient() {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_FILE || 'config/google-credentials.json';
  
  const credentialsFile = path.isAbsolute(credentialsPath)
    ? credentialsPath
    : path.join(projectRoot, credentialsPath);
  
  if (!fs.existsSync(credentialsFile)) {
    throw new Error(`❌ Arquivo de credenciais não encontrado: ${credentialsFile}`);
  }
  
  const credentialsContent = fs.readFileSync(credentialsFile, 'utf-8');
  const credentials = JSON.parse(credentialsContent);
  
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
    ],
  });
  
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  
  return { sheets };
}

/**
 * Ler dados da planilha do Google Sheets
 */
async function readSpreadsheetData(sheets, spreadsheetId) {
  console.log(`📥 Lendo dados da planilha tratada (ID: ${spreadsheetId})...`);
  
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
  });
  
  const sheetName = spreadsheet.data.sheets[0].properties.title;
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `${sheetName}!A:ZZ`,
  });
  
  const rows = response.data.values || [];
  
  if (rows.length === 0) {
    return [];
  }
  
  // Primeira linha são os cabeçalhos
  const headers = rows[0].map(h => String(h || '').trim());
  
  // Converter para objetos
  const data = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });
  
  console.log(`✅ ${data.length} registros lidos da planilha tratada\n`);
  
  return data;
}

/**
 * Normalizar nome de coluna
 */
function normalizeColumnName(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Normalizar protocolo
 */
function normalizeProtocolo(protocolo) {
  if (!protocolo) return null;
  return String(protocolo).trim().toUpperCase();
}

/**
 * Normalizar dados do registro
 */
function normalizeRecordData(row) {
  const normalized = {};
  
  // Mapear todas as colunas
  Object.keys(row).forEach(key => {
    const normalizedKey = normalizeColumnName(key);
    let value = row[key];
    
    // Normalizar valores vazios
    if (value === null || value === undefined || value === '') {
      value = null;
    }
    
    normalized[normalizedKey] = value;
  });
  
  // Normalizar protocolo
  if (normalized.protocolo) {
    normalized.protocolo = normalizeProtocolo(normalized.protocolo);
  }
  
  // Normalizar datas
  if (normalized.data_da_criacao) {
    normalized.dataCriacaoIso = normalizeDate(normalized.data_da_criacao);
  }
  
  if (normalized.data_da_conclusao) {
    normalized.dataConclusaoIso = normalizeDate(normalized.data_da_conclusao);
  }
  
  // Criar campo data (JSON completo)
  normalized.data = { ...row };
  
  return normalized;
}

/**
 * Comparar campos para identificar mudanças
 */
function getChangedFields(newData, existingRecord) {
  const changedFields = {};
  let hasChanges = false;
  
  const fieldsToCompare = [
    'protocolo', 'dataDaCriacao', 'statusDemanda', 'prazoRestante',
    'dataDaConclusao', 'tempoDeResolucaoEmDias', 'prioridade',
    'tipoDeManifestacao', 'tema', 'assunto', 'canal', 'endereco',
    'unidadeCadastro', 'unidadeSaude', 'status', 'servidor',
    'responsavel', 'verificado', 'orgaos',
    'dataCriacaoIso', 'dataConclusaoIso'
  ];
  
  function valuesEqual(val1, val2) {
    const v1 = val1 === null || val1 === undefined ? null : String(val1).trim();
    const v2 = val2 === null || val2 === undefined ? null : String(val2).trim();
    return v1 === v2;
  }
  
  for (const field of fieldsToCompare) {
    const newValue = newData[field];
    const existingValue = existingRecord[field];
    
    if (!valuesEqual(newValue, existingValue)) {
      changedFields[field] = newValue;
      hasChanges = true;
    }
  }
  
  // Sempre atualizar o campo 'data' (JSON completo) se houver diferenças
  const newDataJson = newData.data || {};
  const existingDataJson = existingRecord.data || {};
  
  const jsonKeys = new Set([
    ...Object.keys(newDataJson),
    ...Object.keys(existingDataJson)
  ]);
  
  let jsonChanged = false;
  for (const key of jsonKeys) {
    if (!valuesEqual(newDataJson[key], existingDataJson[key])) {
      jsonChanged = true;
      break;
    }
  }
  
  if (jsonChanged) {
    changedFields.data = newDataJson;
    hasChanges = true;
  }
  
  return { changedFields, hasChanges };
}

/**
 * Salvar dados no banco de dados
 */
async function saveToDatabase(jsonData) {
  console.log('💾 Salvando dados no banco de dados...\n');
  
  // Buscar registros existentes
  const existingRecords = await prisma.record.findMany({
    where: { protocolo: { not: null } }
  });
  
  const protocolMap = new Map(); // protocolo -> id
  const existingDataMap = new Map(); // protocolo -> registro completo
  
  existingRecords.forEach(record => {
    const protocolo = String(record.protocolo);
    protocolMap.set(protocolo, record.id);
    existingDataMap.set(protocolo, record);
  });
  
  // Preparar dados para inserção/atualização
  const toInsert = [];
  const toUpdate = [];
  let unchanged = 0;
  let skipped = 0;
  
  for (const row of jsonData) {
    const normalized = normalizeRecordData(row);
    
    if (!normalized.protocolo) {
      skipped++;
      continue;
    }
    
    const protocolo = String(normalized.protocolo);
    const existingRecord = existingDataMap.get(protocolo);
    
    if (existingRecord) {
      const { changedFields, hasChanges } = getChangedFields(normalized, existingRecord);
      
      if (hasChanges) {
        toUpdate.push({
          id: existingRecord.id,
          protocolo: protocolo,
          changedFields: changedFields
        });
      } else {
        unchanged++;
      }
    } else {
      toInsert.push(normalized);
    }
  }
  
  console.log(`📊 Preparados: ${toUpdate.length} para atualizar, ${toInsert.length} para inserir, ${unchanged} sem mudanças, ${skipped} sem protocolo\n`);
  
  // Atualizar registros
  let updated = 0;
  let fieldsUpdated = 0;
  const batchSize = 500;
  
  if (toUpdate.length > 0) {
    console.log(`🔄 Atualizando ${toUpdate.length} registros...`);
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const slice = toUpdate.slice(i, i + batchSize);
      
      const updatePromises = slice.map(item => {
        return prisma.record.update({
          where: { id: item.id },
          data: item.changedFields
        }).then(result => {
          fieldsUpdated += Object.keys(item.changedFields).length;
          return result;
        }).catch(error => {
          console.error(`❌ Erro ao atualizar protocolo ${item.protocolo}:`, error.message);
          return null;
        });
      });
      
      const results = await Promise.all(updatePromises);
      updated += results.filter(r => r !== null).length;
      
      const processed = Math.min(i + batchSize, toUpdate.length);
      const progress = Math.round((processed / toUpdate.length) * 100);
      console.log(`📦 Atualizados: ${processed}/${toUpdate.length} (${progress}%)`);
    }
    console.log('');
  }
  
  // Inserir novos registros
  let inserted = 0;
  
  if (toInsert.length > 0) {
    console.log(`➕ Inserindo ${toInsert.length} novos registros...`);
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const slice = toInsert.slice(i, i + batchSize);
      
      try {
        await prisma.record.createMany({
          data: slice,
          skipDuplicates: true
        });
        inserted += slice.length;
      } catch (error) {
        for (const item of slice) {
          try {
            await prisma.record.create({ data: item });
            inserted++;
          } catch (e) {
            console.error(`❌ Erro ao inserir protocolo ${item.protocolo}:`, e.message);
          }
        }
      }
      
      const processed = Math.min(i + batchSize, toInsert.length);
      const progress = Math.round((processed / toInsert.length) * 100);
      console.log(`📦 Inseridos: ${processed}/${toInsert.length} (${progress}%)`);
    }
    console.log('');
  }
  
  const countAfter = await prisma.record.count();
  
  console.log('✅ Dados salvos no banco de dados!');
  console.log(`📊 Estatísticas:`);
  console.log(`   - Registros atualizados: ${updated}`);
  console.log(`   - Campos atualizados: ${fieldsUpdated}`);
  console.log(`   - Registros inseridos: ${inserted}`);
  console.log(`   - Registros sem mudanças: ${unchanged}`);
  console.log(`   - Registros sem protocolo (ignorados): ${skipped}`);
  console.log(`   - Total no banco: ${countAfter}\n`);
  
  return {
    updated,
    inserted,
    unchanged,
    skipped,
    total: countAfter
  };
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando Pipeline Completo...\n');
  console.log('='.repeat(60));
  console.log('PIPELINE DE PROCESSAMENTO DE DADOS');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Verificar se deve executar o Python ou apenas ler a planilha
    const SKIP_PYTHON = process.env.SKIP_PYTHON === 'true';
    
    if (!SKIP_PYTHON) {
      // 1. Preparar credenciais para o Python
      console.log('1️⃣ Preparando credenciais para o Python...');
      prepareCredentialsForPython();
      
      // 2. Executar pipeline Python
      console.log('2️⃣ Executando pipeline Python (main.py)...');
      try {
        await runPythonPipeline();
      } catch (error) {
        if (error.message.includes('Python não encontrado')) {
          console.log('\n⚠️  Python não encontrado. Pulando execução do Python...');
          console.log('   Para instalar: https://www.python.org/downloads/\n');
          console.log('   Continuando apenas com a leitura da planilha tratada...\n');
        } else {
          throw error;
        }
      }
    } else {
      console.log('⏭️  Pulando execução do Python (SKIP_PYTHON=true)\n');
    }
    
    // 3. Ler dados da planilha tratada atualizada
    console.log('3️⃣ Lendo dados da planilha tratada atualizada...');
    const { sheets } = await getGoogleClient();
    const dadosTratados = await readSpreadsheetData(sheets, PLANILHA_TRATADA_ID);
    
    if (dadosTratados.length === 0) {
      console.log('⚠️  Nenhum dado encontrado na planilha tratada.\n');
      return;
    }
    
    // 4. Salvar no banco de dados
    console.log('4️⃣ Salvando no banco de dados...');
    const dbStats = await saveToDatabase(dadosTratados);
    
    // Resumo final
    console.log('='.repeat(60));
    console.log('✅ PIPELINE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📊 Resumo:`);
    console.log(`   - Registros processados pelo Python: ${dadosTratados.length}`);
    console.log(`   - Atualizados no banco: ${dbStats.updated}`);
    console.log(`   - Inseridos no banco: ${dbStats.inserted}`);
    console.log(`   - Sem mudanças no banco: ${dbStats.unchanged}`);
    console.log(`   - Total no banco: ${dbStats.total}\n`);
    
  } catch (error) {
    console.error('\n❌❌❌ ERRO NO PIPELINE ❌❌❌\n');
    console.error('Erro:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main()
  .then(() => {
    console.log('🎉 Pipeline finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
