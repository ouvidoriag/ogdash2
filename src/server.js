import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import compression from 'compression';
import { detectDistrictByAddress, mapAddressesToDistricts, getMappingStats } from './utils/districtMapper.js';

// Resolver caminho absoluto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Verificar MongoDB Atlas connection string
let mongodbUrl = process.env.MONGODB_ATLAS_URL;
if (!mongodbUrl) {
  console.error('❌ ERRO: MONGODB_ATLAS_URL não está definido!');
  console.error('Configure a variável MONGODB_ATLAS_URL no .env ou nas variáveis de ambiente');
  process.exit(1);
}

// Adicionar parâmetros de conexão otimizados para evitar timeouts e problemas SSL/TLS
// Se a URL já não tiver esses parâmetros, adiciona
if (!mongodbUrl.includes('serverSelectionTimeoutMS')) {
  const separator = mongodbUrl.includes('?') ? '&' : '?';
  mongodbUrl += `${separator}serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000&retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false`;
}

// Configurar DATABASE_URL para o Prisma (usa MONGODB_ATLAS_URL otimizada)
process.env.DATABASE_URL = mongodbUrl;
console.log(`📁 MongoDB Atlas: ${mongodbUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80)}...`);

// Sistema de rotação de chaves da API Gemini
const GEMINI_API_KEYS = [
  'AIzaSyCvFKNMX-4rzCev4TQj4uE6ysrGgR9QG6E',
  'AIzaSyBmawLDceBQNgaqh7JSGamDGhxtBNtJikQ'
].filter(k => k && k.trim()); // Filtrar chaves vazias

let currentKeyIndex = 0; // Índice da chave atual

if (GEMINI_API_KEYS.length > 0) {
  console.log(`🤖 ${GEMINI_API_KEYS.length} chave(s) Gemini configurada(s)`);
  GEMINI_API_KEYS.forEach((key, idx) => {
    console.log(`   Chave ${idx + 1}: ${key.substring(0, 15)}... (${key.length} caracteres)`);
  });
} else {
  console.warn('⚠️ Nenhuma chave Gemini encontrada');
}

// Função para obter a chave atual
function getCurrentGeminiKey() {
  return GEMINI_API_KEYS[currentKeyIndex] || '';
}

// Função para rotacionar para a próxima chave
function rotateToNextKey() {
  if (GEMINI_API_KEYS.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
    console.log(`🔄 Rotacionando para chave ${currentKeyIndex + 1}/${GEMINI_API_KEYS.length}`);
  }
}

// Função para voltar para a primeira chave
function resetToFirstKey() {
  if (currentKeyIndex !== 0) {
    currentKeyIndex = 0;
    console.log(`🔄 Voltando para primeira chave`);
  }
}

// Configurar Prisma Client com opções de conexão otimizadas
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// MongoDB Client nativo como fallback para operações que não suportam transações
let mongoClient = null;
async function getMongoClient() {
  if (!mongoClient) {
    mongoClient = new MongoClient(mongodbUrl, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      tls: true,
      tlsAllowInvalidCertificates: false
    });
    await mongoClient.connect();
  }
  return mongoClient;
}

// Função para testar conexão com retry
async function testConnection(maxRetries = 3, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Conexão com MongoDB Atlas estabelecida com sucesso!');
      return true;
    } catch (error) {
      console.error(`❌ Tentativa ${i + 1}/${maxRetries} falhou:`, error.message);
      if (i < maxRetries - 1) {
        console.log(`⏳ Aguardando ${delay/1000}s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Não foi possível conectar ao MongoDB Atlas após', maxRetries, 'tentativas');
        console.error('💡 Verifique:');
        console.error('   1. A string de conexão MONGODB_ATLAS_URL está correta');
        console.error('   2. O IP do servidor está na whitelist do MongoDB Atlas:');
        console.error('      → MongoDB Atlas → Network Access → Add IP Address');
        console.error('      → Adicione 0.0.0.0/0 (qualquer IP) OU o IP específico do Render');
        console.error('   3. As credenciais estão corretas');
        console.error('   4. A rede permite conexões SSL/TLS na porta 27017');
        console.error('   5. O cluster MongoDB Atlas está ativo e não pausado');
        // Não encerra o processo, permite que o servidor inicie mesmo sem conexão
        return false;
      }
    }
  }
  return false;
}

// Verificar mensagens existentes no banco ao iniciar (com tratamento de erro)
(async () => {
  try {
    const connected = await testConnection();
    if (connected) {
      try {
        const count = await prisma.chatMessage.count();
        console.log(`💬 Mensagens no banco de dados: ${count} mensagens`);
      } catch (error) {
        console.warn('⚠️ Não foi possível contar mensagens (banco pode estar indisponível):', error.message);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar conexão:', error.message);
  }
})();

// Graceful shutdown - desconectar Prisma e MongoDB ao encerrar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  if (mongoClient) {
    await mongoClient.close();
  }
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

const app = express();
// Cache otimizado: TTL padrão de 1 hora (3600s) para dados que mudam pouco
// checkperiod: verifica itens expirados a cada 5 minutos
const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hora padrão
  checkperiod: 300, // Verifica expirados a cada 5 minutos
  useClones: false // Melhor performance (não clona objetos)
});

function setCacheHeaders(res, seconds = 3600) {
  res.set('Cache-Control', `public, max-age=${seconds}`);
}

// Wrapper para queries do Prisma com retry em caso de erro de conexão
async function safePrismaQuery(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isConnectionError = error.code === 'P2010' || 
                                error.message?.includes('Server selection timeout') ||
                                error.message?.includes('No available servers') ||
                                error.message?.includes('I/O error');
      
      if (isConnectionError && i < retries) {
        console.warn(`⚠️ Erro de conexão (tentativa ${i + 1}/${retries + 1}), tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Backoff exponencial
        continue;
      }
      throw error;
    }
  }
}

async function withCache(key, ttlSeconds, res, fn) {
  const cached = cache.get(key);
  if (cached) {
    setCacheHeaders(res, ttlSeconds);
    return res.json(cached);
  }
  
  try {
    // Usar safePrismaQuery se a função envolve queries do Prisma
    const data = await safePrismaQuery(fn);
    cache.set(key, data, ttlSeconds);
    setCacheHeaders(res, ttlSeconds);
    return res.json(data);
  } catch (error) {
    // Se houver erro de conexão, retornar dados em cache se disponível, ou erro
    const cached = cache.get(key);
    if (cached) {
      console.warn(`⚠️ Erro ao buscar dados, usando cache: ${error.message}`);
      setCacheHeaders(res, ttlSeconds);
      return res.json(cached);
    }
    
    // Se não houver cache e houver erro de conexão, retornar erro apropriado
    if (error.code === 'P2010' || error.message?.includes('Server selection timeout')) {
      console.error('❌ Erro de conexão com MongoDB:', error.message);
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível',
        message: 'Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    throw error;
  }
}

// ========== SISTEMA GLOBAL DE DATAS ==========
/**
 * Sistema global de normalização e processamento de datas
 * Usado por TODAS as APIs e páginas do sistema
 */

/**
 * Normaliza qualquer formato de data para YYYY-MM-DD
 * @param {any} dateInput - Data em qualquer formato (Date, string ISO, string DD/MM/YYYY, etc.)
 * @returns {string|null} - Data normalizada em formato YYYY-MM-DD ou null se inválida
 */
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  // Se for objeto Date, converter para YYYY-MM-DD
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return dateInput.toISOString().slice(0, 10);
  }
  
  // Se for objeto com propriedades de data (MongoDB Date)
  if (typeof dateInput === 'object' && dateInput !== null) {
    try {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    } catch (e) {
      // Ignorar erro
    }
  }
  
  const str = String(dateInput).trim();
  if (!str || str === 'null' || str === 'undefined') return null;
  
  // Formato YYYY-MM-DD (já está no formato correto)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  
  // Formato ISO com hora (2025-01-06T03:00:28.000Z) - EXTRAIR APENAS A DATA
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  
  // Formato DD/MM/YYYY
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  
  return null;
}

/**
 * Obtém a data de criação de um registro usando a ordem de prioridade
 * @param {Object} record - Registro do Prisma
 * @returns {string|null} - Data de criação em formato YYYY-MM-DD ou null
 */
function getDataCriacao(record) {
  // Prioridade 1: dataCriacaoIso (se disponível e válida)
  if (record.dataCriacaoIso) {
    const normalized = normalizeDate(record.dataCriacaoIso);
    if (normalized) return normalized;
  }
  
  // Prioridade 2: dataDaCriacao (100% dos registros têm este campo)
  if (record.dataDaCriacao) {
    const normalized = normalizeDate(record.dataDaCriacao);
    if (normalized) return normalized;
  }
  
  // Prioridade 3: data.data_da_criacao (do JSON)
  if (record.data && typeof record.data === 'object' && record.data.data_da_criacao) {
    const normalized = normalizeDate(record.data.data_da_criacao);
    if (normalized) return normalized;
  }
  
  return null;
}

/**
 * Obtém a data de conclusão de um registro usando a ordem de prioridade
 * @param {Object} record - Registro do Prisma
 * @returns {string|null} - Data de conclusão em formato YYYY-MM-DD ou null
 */
function getDataConclusao(record) {
  // Prioridade 1: dataConclusaoIso (se disponível e válida)
  if (record.dataConclusaoIso) {
    const normalized = normalizeDate(record.dataConclusaoIso);
    if (normalized) return normalized;
  }
  
  // Prioridade 2: dataDaConclusao
  if (record.dataDaConclusao) {
    const normalized = normalizeDate(record.dataDaConclusao);
    if (normalized) return normalized;
  }
  
  // Prioridade 3: data.data_da_conclusao (do JSON)
  if (record.data && typeof record.data === 'object' && record.data.data_da_conclusao) {
    const normalized = normalizeDate(record.data.data_da_conclusao);
    if (normalized) return normalized;
  }
  
  return null;
}

/**
 * Verifica se um registro está concluído
 * @param {Object} record - Registro do Prisma
 * @returns {boolean} - true se o registro está concluído
 */
function isConcluido(record) {
  // Verificar se tem data de conclusão
  if (getDataConclusao(record)) return true;
  
  // Verificar status
  const status = (record.status || record.statusDemanda || '').toLowerCase();
  return status.includes('concluída') || 
         status.includes('concluida') || 
         status.includes('encerrada') || 
         status.includes('finalizada') ||
         status.includes('resolvida') ||
         status.includes('arquivamento');
}

/**
 * Calcula o tempo de resolução em dias usando a ordem de prioridade
 * @param {Object} record - Registro do Prisma
 * @param {boolean} incluirZero - Se true, inclui valores zero
 * @returns {number|null} - Tempo de resolução em dias ou null se não puder calcular
 */
function getTempoResolucaoEmDias(record, incluirZero = true) {
  // Prioridade 1: tempoDeResolucaoEmDias (campo direto)
  if (record.tempoDeResolucaoEmDias !== null && record.tempoDeResolucaoEmDias !== undefined && record.tempoDeResolucaoEmDias !== '') {
    const parsed = parseFloat(record.tempoDeResolucaoEmDias);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1000) {
      if (!incluirZero && parsed === 0) {
        // Não retornar zero se incluirZero é false, mas continuar tentando calcular das datas
      } else {
        return parsed;
      }
    }
  }
  
  // Prioridade 2: Calcular a partir das datas ISO
  const dataCriacao = getDataCriacao(record);
  const dataConclusao = getDataConclusao(record);
  
  if (dataCriacao && dataConclusao) {
    const start = new Date(dataCriacao + 'T00:00:00');
    const end = new Date(dataConclusao + 'T00:00:00');
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const calculated = Math.floor((end - start) / (1000 * 60 * 60 * 24));
      if (calculated >= 0 && calculated <= 1000) {
        if (incluirZero || calculated > 0) {
          return calculated;
        }
      }
    }
  }
  
  // Prioridade 3: Calcular a partir de data.data_da_criacao e data.data_da_conclusao
  if (record.data && typeof record.data === 'object') {
    const dataCriacaoJson = normalizeDate(record.data.data_da_criacao);
    const dataConclusaoJson = normalizeDate(record.data.data_da_conclusao);
    
    if (dataCriacaoJson && dataConclusaoJson) {
      const start = new Date(dataCriacaoJson + 'T00:00:00');
      const end = new Date(dataConclusaoJson + 'T00:00:00');
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const calculated = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        if (calculated >= 0 && calculated <= 1000) {
          if (incluirZero || calculated > 0) {
            return calculated;
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Obtém o mês (YYYY-MM) de um registro baseado na data de criação
 * @param {Object} record - Registro do Prisma
 * @returns {string|null} - Mês em formato YYYY-MM ou null
 */
function getMes(record) {
  const dataCriacao = getDataCriacao(record);
  if (dataCriacao) {
    return dataCriacao.slice(0, 7); // YYYY-MM
  }
  return null;
}

/**
 * Obtém o ano de um registro baseado na data de criação
 * @param {Object} record - Registro do Prisma
 * @returns {number|null} - Ano ou null
 */
function getAno(record) {
  const dataCriacao = getDataCriacao(record);
  if (dataCriacao) {
    return parseInt(dataCriacao.slice(0, 4));
  }
  return null;
}

/**
 * Filtra registros por mês(es) usando dataDaCriacao
 * @param {Object} where - Objeto where do Prisma
 * @param {string[]|null} meses - Array de meses no formato YYYY-MM
 * @returns {Object} - Objeto where atualizado
 */
function addMesFilter(where, meses) {
  if (meses && meses.length > 0) {
    const monthFilters = meses.map(month => {
      // Se já está em formato YYYY-MM, usar diretamente
      if (/^\d{4}-\d{2}$/.test(month)) return month;
      // Se está em formato MM/YYYY, converter
      const match = month.match(/^(\d{2})\/(\d{4})$/);
      if (match) return `${match[2]}-${match[1]}`;
      return month;
    });
    
    // Adicionar filtro OR para qualquer um dos meses
    if (where.OR) {
      where.AND = [
        ...(where.AND || []),
        { OR: monthFilters.map(month => ({ dataDaCriacao: { startsWith: month } })) }
      ];
    } else {
      where.OR = monthFilters.map(month => ({
        dataDaCriacao: { startsWith: month }
      }));
    }
  }
  return where;
}

// ========== CONTEXTO (CÉREBRO + WELLINGTON + DADOS DO BANCO) ==========
const WELLINGTON_DIR = process.env.WELLINGTON_DIR || path.join(projectRoot, 'Wellington');
const DB_DATA_DIR = path.join(projectRoot, 'db-data'); // Pasta para dados do banco
let CONTEXT_CACHE = { chunks: [], lastIndexedAt: null };

// Criar pasta db-data se não existir
if (!fs.existsSync(DB_DATA_DIR)) {
  fs.mkdirSync(DB_DATA_DIR, { recursive: true });
  console.log('📁 Pasta db-data criada');
}

function readFileSafe(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return '';
    
    // ⚠️ FILTRO: Ignorar arquivos em node_modules, build, dist, .git
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (normalizedPath.includes('/node_modules/') || 
        normalizedPath.includes('/build/') || 
        normalizedPath.includes('/dist/') || 
        normalizedPath.includes('/.git/') ||
        normalizedPath.includes('/.next/') ||
        normalizedPath.includes('/coverage/')) {
      return '';
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();
    
    // ⚠️ FILTRO: Ignorar arquivos de configuração TypeScript e outros que não são JSON válido
    if (ext === '.json') {
      // Ignorar tsconfig.json, package-lock.json muito grandes, e outros arquivos problemáticos
      if (fileName === 'tsconfig.json' || 
          fileName === 'tsdoc-metadata.json' ||
          fileName === 'package-lock.json' ||
          fileName.includes('tsconfig') ||
          fileName.includes('tsdoc')) {
        return ''; // Silenciosamente ignorar
      }
      
      // Tentar parsear JSON, mas silenciosamente ignorar erros
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const obj = JSON.parse(content);
        return JSON.stringify(obj).slice(0, 20000);
      } catch (error) {
        // Silenciosamente ignorar arquivos JSON inválidos (tsconfig.json com comentários, etc.)
        return '';
      }
    }
    
    if (['.md','.txt','.csv'].includes(ext)) {
      return fs.readFileSync(filePath,'utf8').slice(0, 20000);
    }
    return '';
  } catch { return ''; }
}

function walkDir(dir, files=[]) {
  try {
    for (const name of fs.readdirSync(dir)) {
      // ⚠️ FILTRO: Ignorar diretórios que não precisamos indexar
      if (name === 'node_modules' || 
          name === 'build' || 
          name === 'dist' || 
          name === '.git' || 
          name === '.next' ||
          name === 'coverage' ||
          name.startsWith('.')) {
        continue;
      }
      
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walkDir(full, files);
      } else {
        files.push(full);
      }
    }
  } catch (error) {
    // Silenciosamente ignorar erros de permissão ou arquivos corrompidos
    // Não logar para evitar spam no console
  }
  return files;
}

function chunkText(text, maxLen = 1800) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxLen));
    i += maxLen;
  }
  return chunks;
}

function buildContextSummary(raw) {
  const first = raw.split('\n').slice(0, 40).join('\n');
  return first;
}

// Função para exportar dados agregados do banco para JSON
async function exportDatabaseData() {
  try {
    console.log('📊 Exportando dados agregados do banco para JSON...');
    
    // Buscar dados agregados (não todos os registros, mas estatísticas)
    const [
      total,
      porStatus,
      topOrgaos,
      topTemas,
      topAssuntos,
      topCanais,
      topUnidades,
      topResponsaveis,
      topPrioridades
    ] = await Promise.all([
      prisma.record.count(),
      prisma.record.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.record.groupBy({ by: ['orgaos'], _count: { _all: true } }),
      prisma.record.groupBy({ by: ['tema'], _count: { _all: true } }),
      prisma.record.groupBy({ by: ['assunto'], _count: { _all: true } }),
      prisma.record.groupBy({ by: ['canal'], _count: { _all: true } }),
      prisma.record.groupBy({ by: ['unidadeCadastro'], _count: { _all: true } }),
      prisma.record.groupBy({ by: ['responsavel'], _count: { _all: true } }),
      prisma.record.groupBy({ by: ['prioridade'], _count: { _all: true } })
    ]);
    
    // Calcular tempo médio manualmente (MongoDB não suporta aggregate direto)
    let tempoMedio = { media: null, minimo: null, maximo: null };
    try {
      const recordsComTempo = await prisma.record.findMany({
        where: {
          tempoDeResolucaoEmDias: { not: null }
        },
        select: {
          tempoDeResolucaoEmDias: true
        },
        take: 10000 // Limitar para performance
      });
      
      if (recordsComTempo.length > 0) {
        const tempos = recordsComTempo
          .map(r => parseFloat(r.tempoDeResolucaoEmDias))
          .filter(t => !isNaN(t) && t > 0);
        
        if (tempos.length > 0) {
          tempoMedio = {
            media: tempos.reduce((a, b) => a + b, 0) / tempos.length,
            minimo: Math.min(...tempos),
            maximo: Math.max(...tempos)
          };
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao calcular tempo médio:', e.message);
    }
    
    // Ordenar e limitar
    const dadosAgregados = {
      total,
      estatisticas: {
        porStatus: porStatus
          .map(s => ({ status: s.status || 'Não informado', count: s._count._all }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        topOrgaos: topOrgaos
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 30)
          .map(o => ({ orgao: o.orgaos || 'Não informado', count: o._count._all })),
        topTemas: topTemas
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 30)
          .map(t => ({ tema: t.tema || 'Não informado', count: t._count._all })),
        topAssuntos: topAssuntos
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 30)
          .map(a => ({ assunto: a.assunto || 'Não informado', count: a._count._all })),
        topCanais: topCanais
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 20)
          .map(c => ({ canal: c.canal || 'Não informado', count: c._count._all })),
        topUnidades: topUnidades
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 30)
          .map(u => ({ unidade: u.unidadeCadastro || 'Não informado', count: u._count._all })),
        topResponsaveis: topResponsaveis
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 20)
          .map(r => ({ responsavel: r.responsavel || 'Não informado', count: r._count._all })),
        topPrioridades: topPrioridades
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 10)
          .map(p => ({ prioridade: p.prioridade || 'Não informado', count: p._count._all })),
        tempoMedio: {
          media: tempoMedio.media,
          minimo: tempoMedio.minimo,
          maximo: tempoMedio.maximo
        }
      },
      exportadoEm: new Date().toISOString()
    };
    
    // Salvar em arquivo JSON
    const jsonPath = path.join(DB_DATA_DIR, 'dados-agregados.json');
    fs.writeFileSync(jsonPath, JSON.stringify(dadosAgregados, null, 2), 'utf8');
    console.log(`✅ Dados agregados exportados: ${jsonPath}`);
    
    return dadosAgregados;
  } catch (error) {
    console.error('❌ Erro ao exportar dados do banco:', error);
    return null;
  }
}

export async function reindexContext() {
  const chunks = [];
  // Incluir "cérebro" local se existir
  const cerebroPath = path.join(projectRoot, '.cursor', 'rules', 'cerebro.mdc');
  if (fs.existsSync(cerebroPath)) {
    const t = readFileSafe(cerebroPath);
    if (t) chunks.push({ source: 'cerebro.mdc', text: buildContextSummary(t) });
  }
  // Ler diretório Wellington
  if (fs.existsSync(WELLINGTON_DIR)) {
    const files = walkDir(WELLINGTON_DIR);
    for (const f of files) {
      const t = readFileSafe(f);
      if (!t) continue;
      const parts = chunkText(t, 1600);
      for (let idx = 0; idx < Math.min(parts.length, 6); idx++) {
        chunks.push({ source: path.relative(projectRoot, f), text: parts[idx] });
      }
    }
  }
  
  // Incluir dados agregados do banco
  const dadosAgregados = await exportDatabaseData();
  if (dadosAgregados) {
    const dadosTexto = `DADOS AGREGADOS DO BANCO DE DADOS (${dadosAgregados.exportadoEm}):\n\n` +
      `Total de registros: ${dadosAgregados.total.toLocaleString('pt-BR')}\n\n` +
      `Status mais comuns:\n${dadosAgregados.estatisticas.porStatus.map(s => `- ${s.status}: ${s.count.toLocaleString('pt-BR')}`).join('\n')}\n\n` +
      `Top 10 Órgãos:\n${dadosAgregados.estatisticas.topOrgaos.slice(0, 10).map(o => `- ${o.orgao}: ${o.count.toLocaleString('pt-BR')}`).join('\n')}\n\n` +
      `Top 10 Temas:\n${dadosAgregados.estatisticas.topTemas.slice(0, 10).map(t => `- ${t.tema}: ${t.count.toLocaleString('pt-BR')}`).join('\n')}\n\n` +
      `Top 10 Assuntos:\n${dadosAgregados.estatisticas.topAssuntos.slice(0, 10).map(a => `- ${a.assunto}: ${a.count.toLocaleString('pt-BR')}`).join('\n')}\n\n` +
      `Top 10 Canais:\n${dadosAgregados.estatisticas.topCanais.slice(0, 10).map(c => `- ${c.canal}: ${c.count.toLocaleString('pt-BR')}`).join('\n')}\n\n` +
      `Top 10 Unidades:\n${dadosAgregados.estatisticas.topUnidades.slice(0, 10).map(u => `- ${u.unidade}: ${u.count.toLocaleString('pt-BR')}`).join('\n')}\n\n` +
      `Tempo médio de resolução: ${dadosAgregados.estatisticas.tempoMedio.media ? dadosAgregados.estatisticas.tempoMedio.media.toFixed(1) + ' dias' : 'N/A'}`;
    
    chunks.push({ source: 'db-data/dados-agregados.json', text: dadosTexto });
  }
  
  // Metadados simples do banco (campos indexados)
  chunks.push({ source: 'db-metadata', text: `Campos normalizados: protocolo, dataDaCriacao, statusDemanda, prazoRestante, dataDaConclusao, tempoDeResolucaoEmDias, prioridade, tipoDeManifestacao, tema, assunto, canal, endereco, unidadeCadastro, unidadeSaude, status, servidor, responsavel, verificado, orgaos, dataCriacaoIso, dataConclusaoIso.` });
  CONTEXT_CACHE = { chunks: chunks.slice(0, 200), lastIndexedAt: new Date() };
  return CONTEXT_CACHE;
}

// Indexar contexto na inicialização (executar de forma assíncrona)
reindexContext().then(() => {
  console.log(`✅ Contexto indexado: ${CONTEXT_CACHE.chunks.length} chunks`);
}).catch(err => {
  console.error('⚠️ Erro ao indexar contexto:', err);
});

// Compressão Gzip para reduzir tamanho de transferência
app.use(compression({ 
  level: 6, // Nível de compressão (1-9, 6 é um bom equilíbrio)
  filter: (req, res) => {
    // Comprimir apenas respostas JSON e HTML
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const publicDir = path.join(__dirname, '..', 'public');

// Rota para página de chat separada (ANTES do static para ter prioridade)
app.get('/chat', (_req, res) => {
  res.sendFile(path.join(publicDir, 'chat.html'));
});

app.use(express.static(publicDir));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Summary KPIs e insights críticos
app.get('/api/summary', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const key = servidor ? `summary:servidor:${servidor}:v1` :
              unidadeCadastro ? `summary:uac:${unidadeCadastro}:v1` :
              'summary:v1';
  
  // Cache de 1 hora para dados que mudam pouco
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Totais
    const total = await prisma.record.count({ where });

    // Por status (normalizado)
    const byStatus = await prisma.record.groupBy({ 
      by: ['status'], 
      where: Object.keys(where).length > 0 ? where : undefined,
      _count: { _all: true } 
    });
    const statusCounts = byStatus.map(r => ({ status: r.status ?? 'Não informado', count: r._count._all }))
      .sort((a,b) => b.count - a.count);

    // Últimos 7 e 30 dias usando dataCriacaoIso (campo normalizado) - OTIMIZADO
    // Incluir hoje nos últimos 7 e 30 dias
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD (hoje)
    
    // Data há 7 dias atrás (incluindo hoje = últimos 7 dias)
    const d7 = new Date(today);
    d7.setDate(today.getDate() - 6); // -6 porque incluímos hoje (hoje + 6 dias = 7 dias)
    const last7Str = d7.toISOString().slice(0, 10); // YYYY-MM-DD
    
    // Data há 30 dias atrás (incluindo hoje = últimos 30 dias)
    const d30 = new Date(today);
    d30.setDate(today.getDate() - 29); // -29 porque incluímos hoje (hoje + 29 dias = 30 dias)
    const last30Str = d30.toISOString().slice(0, 10); // YYYY-MM-DD
    
    console.log(`📅 Calculando últimos 7 e 30 dias: hoje=${todayStr}, últimos 7 dias de ${last7Str} até ${todayStr}, últimos 30 dias de ${last30Str} até ${todayStr}`);
    
    // OTIMIZAÇÃO: Usar count com filtros de data diretamente no banco (muito mais rápido!)
    // Em vez de buscar todos os registros, fazemos queries com filtros de data
    const whereLast7 = {
      ...where,
      dataCriacaoIso: {
        gte: last7Str,
        lte: todayStr
      }
    };
    
    const whereLast30 = {
      ...where,
      dataCriacaoIso: {
        gte: last30Str,
        lte: todayStr
      }
    };
    
    // Executar contagens em paralelo (muito mais rápido que buscar todos os registros)
    const [last7, last30] = await Promise.all([
      prisma.record.count({ where: whereLast7 }),
      prisma.record.count({ where: whereLast30 })
    ]);
    
    console.log(`📊 Resultado (otimizado): últimos 7 dias=${last7}, últimos 30 dias=${last30}`);

    // Top dimensões normalizadas (usando novos campos)
    const top = async (col) => {
      const rows = await prisma.record.groupBy({ 
        by: [col], 
        where: Object.keys(where).length > 0 ? where : undefined,
        _count: { _all: true } 
      });
      return rows.map(r => ({ key: r[col] ?? 'Não informado', count: r._count._all }))
        .sort((a,b) => b.count - a.count).slice(0,10);
    };
    const [topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema] = await Promise.all([
      top('orgaos'), top('unidadeCadastro'), top('tipoDeManifestacao'), top('tema')
    ]);

    return { total, last7, last30, statusCounts, topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema };
  });
});

// List records (paginated)
app.get('/api/records', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Math.min(Number(req.query.pageSize ?? 50), 500);
  const skip = (page - 1) * pageSize;
  
  // Cache apenas para primeira página (mais acessada)
  const cacheKey = page === 1 ? `records:page1:${pageSize}` : null;
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) {
      setCacheHeaders(res, 300); // Cache menor para dados paginados (5 min)
      return res.json(cached);
    }
  }

  const [total, rowsRaw] = await Promise.all([
    prisma.record.count(),
    prisma.record.findMany({ orderBy: { id: 'asc' }, skip, take: pageSize })
  ]);
  // MongoDB já armazena JSON diretamente, não precisa fazer parse
  const rows = rowsRaw.map(r => ({ ...r, data: r.data || {} }));
  const result = { total, page, pageSize, rows };
  
  if (cacheKey) {
    cache.set(cacheKey, result, 300); // 5 minutos para primeira página
  }
  
  res.json(result);
});
// Distinct values for a field inside JSON data
app.get('/api/distinct', async (req, res) => {
  const field = String(req.query.field ?? '').trim();
  if (!field) return res.status(400).json({ error: 'field required' });

  const cacheKey = `distinct:${field}`;
  // Cache de 1 hora para valores distintos
  return withCache(cacheKey, 3600, res, async () => {
    const rows = await prisma.record.findMany({ select: { data: true } });
    const values = new Set();
    for (const r of rows) {
      const dat = r.data || {};
      // Tentar diferentes variações do nome do campo
      const val = dat?.[field] ?? dat?.[field.toLowerCase()] ?? dat?.[field.replace(/\s+/g, '_')];
      if (val !== undefined && val !== null && `${val}`.trim() !== '') values.add(`${val}`);
    }
    return Array.from(values).sort();
  });
});

// Basic aggregations (count by field)
app.get('/api/aggregate/count-by', async (req, res) => {
  const field = String(req.query.field ?? '').trim();
  if (!field) return res.status(400).json({ error: 'field required' });
  
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `countBy:${field}:servidor:${servidor}:v2` :
                    unidadeCadastro ? `countBy:${field}:uac:${unidadeCadastro}:v2` :
                    `countBy:${field}:v2`;
  
  // Cache de 1 hora para agregações
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    // Preferir coluna normalizada quando corresponder a um dos campos conhecidos
    const fieldMap = {
      Secretaria: 'orgaos',
      Setor: 'unidadeCadastro',
      Tipo: 'tipoDeManifestacao',
      Categoria: 'tema',
      Bairro: 'endereco',
      Status: 'status',
      StatusDemanda: 'statusDemanda',
      Data: 'dataDaCriacao', // Usa sistema global getDataCriacao()
      UAC: 'unidadeCadastro',
      Responsavel: 'responsavel',
      Canal: 'canal',
      Prioridade: 'prioridade',
      // Aliases para compatibilidade
      Orgaos: 'orgaos',
      UnidadeCadastro: 'unidadeCadastro',
      TipoManifestacao: 'tipoDeManifestacao',
      Tema: 'tema',
      Assunto: 'assunto',
      // Nomes exatos da planilha
      'protocolo': 'protocolo',
      'data_da_criacao': 'dataDaCriacao',
      'status_demanda': 'statusDemanda',
      'prazo_restante': 'prazoRestante',
      'data_da_conclusao': 'dataDaConclusao',
      'tempo_de_resolucao_em_dias': 'tempoDeResolucaoEmDias',
      'prioridade': 'prioridade',
      'tipo_de_manifestacao': 'tipoDeManifestacao',
      'tema': 'tema',
      'assunto': 'assunto',
      'canal': 'canal',
      'endereco': 'endereco',
      'unidade_cadastro': 'unidadeCadastro',
      'unidade_saude': 'unidadeSaude',
      'status': 'status',
      'servidor': 'servidor',
      'responsavel': 'responsavel',
      'verificado': 'verificado',
      'orgaos': 'orgaos'
    };
    const col = fieldMap[field];
    if (col) {
      // Agregar direto no banco (com filtro se houver)
      const rows = await prisma.record.groupBy({ 
        by: [col], 
        where: Object.keys(where).length > 0 ? where : undefined,
        _count: { _all: true } 
      });
      return rows.map(r => ({ key: r[col] ?? 'Não informado', count: r._count._all }))
        .sort((a, b) => b.count - a.count);
    }

    // Fallback: agrega pelo JSON caso campo não esteja normalizado
    const rows = await prisma.record.findMany({ 
      where: Object.keys(where).length > 0 ? where : undefined,
      select: { data: true } 
    });
    const map = new Map();
    for (const r of rows) {
      const dat = r.data || {};
      // Tentar diferentes variações do nome do campo
      const key = dat?.[field] ?? dat?.[field.toLowerCase()] ?? dat?.[field.replace(/\s+/g, '_')] ?? 'Não informado';
      const k = `${key}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  });
});

// Time series by date field (YYYY-MM-DD or DD/MM/YYYY)
app.get('/api/aggregate/time-series', async (req, res) => {
  const field = String(req.query.field ?? '').trim();
  if (!field) return res.status(400).json({ error: 'field required' });

  const cacheKey = `ts:${field}`;
  // Cache de 1 hora para séries temporais
  return withCache(cacheKey, 3600, res, async () => {
    // Se pediram Data, usar sistema global de datas
    if (field === 'Data' || field === 'data_da_criacao') {
      const rows = await prisma.record.findMany({
        where: { dataDaCriacao: { not: null } },
        select: {
          dataCriacaoIso: true,
          dataDaCriacao: true,
          data: true
        }
      });
      
      const map = new Map();
      for (const r of rows) {
        const dataCriacao = getDataCriacao(r);
        if (dataCriacao) {
          map.set(dataCriacao, (map.get(dataCriacao) || 0) + 1);
        }
      }
      
      return Array.from(map.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    const rows = await prisma.record.findMany({ select: { data: true } });
    const map = new Map();

    const normalize = (v) => {
      if (!v) return null;
      const s = `${v}`.trim();
      if (!s) return null;
      // 2024-10-30
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // 30/10/2024
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      return null;
    };

    for (const r of rows) {
      const dat = r.data || {};
      const d = normalize(dat?.[field]);
      const key = d ?? 'Sem data';
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });
});

// Série mensal últimos 12 meses (usa dataCriacaoIso) - OTIMIZADO
app.get('/api/aggregate/by-month', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `byMonth:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `byMonth:uac:${unidadeCadastro}:v1` : 
                    'byMonth:v1';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    where.dataCriacaoIso = { not: null }; // Usar campo normalizado com índice
    
    // OTIMIZAÇÃO: Usar groupBy do Prisma em vez de buscar todos os registros
    // Agrupar por dataCriacaoIso e depois extrair o mês (YYYY-MM)
    const rows = await prisma.record.groupBy({
      by: ['dataCriacaoIso'],
      where: where,
      _count: { _all: true }
    });
    
    // Agrupar por mês (YYYY-MM) a partir do dataCriacaoIso
    const map = new Map();
    for (const r of rows) {
      if (!r.dataCriacaoIso) continue;
      const mes = r.dataCriacaoIso.slice(0, 7); // YYYY-MM
      map.set(mes, (map.get(mes) ?? 0) + r._count._all);
    }
    
    return Array.from(map.entries()).map(([ym, count]) => ({ ym, count }))
      .sort((a,b) => a.ym.localeCompare(b.ym)).slice(-12);
  });
});

// Dados diários (últimos 30 dias) para KPIs e sparklines - OTIMIZADO
app.get('/api/aggregate/by-day', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `byDay:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `byDay:uac:${unidadeCadastro}:v1` : 
                    'byDay:v1';
  
  return withCache(cacheKey, 300, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Calcular intervalo dos últimos 30 dias
    const today = new Date();
    const d30 = new Date(today);
    d30.setDate(today.getDate() - 29); // Últimos 30 dias (incluindo hoje)
    const last30Str = d30.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);
    
    // OTIMIZAÇÃO: Filtrar apenas últimos 30 dias e usar groupBy
    where.dataCriacaoIso = {
      gte: last30Str,
      lte: todayStr
    };
    
    const rows = await prisma.record.groupBy({
      by: ['dataCriacaoIso'],
      where: where,
      _count: { _all: true }
    });
    
    // Criar mapa de datas
    const map = new Map();
    for (const r of rows) {
      if (r.dataCriacaoIso) {
        map.set(r.dataCriacaoIso, r._count._all);
      }
    }
    
    // Gerar últimos 30 dias (garantir que todos os dias estejam presentes)
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      result.push({
        date: dateKey,
        count: map.get(dateKey) || 0
      });
    }
    
    return result;
  });
});

// Heatmap por mês (últimos 12 meses) x dimensão (usa colunas normalizadas quando possível)
app.get('/api/aggregate/heatmap', async (req, res) => {
  const dimReq = String(req.query.dim ?? 'Categoria');
  const cacheKey = `heatmap:${dimReq}:v2`;
  // Cache de 1 hora para heatmaps
  return withCache(cacheKey, 3600, res, async () => {
  const fieldMap = {
    Secretaria: 'orgaos',
    Setor: 'unidadeCadastro',
    Tipo: 'tipoDeManifestacao',
    Categoria: 'tema',
    Bairro: 'endereco',
    Status: 'status',
    StatusDemanda: 'statusDemanda',
    UAC: 'unidadeCadastro',
    Responsavel: 'responsavel',
    Canal: 'canal',
    Prioridade: 'prioridade',
    Orgaos: 'orgaos',
    UnidadeCadastro: 'unidadeCadastro',
    TipoManifestacao: 'tipoDeManifestacao',
    Tema: 'tema',
    Assunto: 'assunto',
    // Nomes exatos da planilha
    'protocolo': 'protocolo',
    'data_da_criacao': 'dataDaCriacao',
    'status_demanda': 'statusDemanda',
    'prazo_restante': 'prazoRestante',
    'data_da_conclusao': 'dataDaConclusao',
    'tempo_de_resolucao_em_dias': 'tempoDeResolucaoEmDias',
    'prioridade': 'prioridade',
    'tipo_de_manifestacao': 'tipoDeManifestacao',
    'tema': 'tema',
    'assunto': 'assunto',
    'canal': 'canal',
    'endereco': 'endereco',
    'unidade_cadastro': 'unidadeCadastro',
    'unidade_saude': 'unidadeSaude',
    'status': 'status',
    'servidor': 'servidor',
    'responsavel': 'responsavel',
    'verificado': 'verificado',
    'orgaos': 'orgaos'
  };
  const col = fieldMap[dimReq];
  if (!col) return res.status(400).json({ error: 'dim must be one of Secretaria, Setor, Tipo, Categoria, Bairro, Status, UAC, Responsavel, Canal, Prioridade' });

  // Construir últimos 12 meses como labels YYYY-MM
  const labels = [];
  const today = new Date();
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    labels.push(ym);
  }

  // Buscar apenas colunas necessárias
  const rows = await prisma.record.findMany({ 
    where: { dataDaCriacao: { not: null } },
    select: { 
      dataCriacaoIso: true,
      dataDaCriacao: true,
      data: true,
      [col]: true 
    } 
  });
  const matrix = new Map(); // key: dim value -> Map(ym -> count)
  for (const r of rows) {
    // Usar sistema global de datas
    const mes = getMes(r);
    if (!mes || !labels.includes(mes)) continue;
    const key = r[col] ?? 'Não informado';
    if (!matrix.has(key)) matrix.set(key, new Map(labels.map(l => [l, 0])));
    const inner = matrix.get(key);
    inner.set(mes, (inner.get(mes) ?? 0) + 1);
  }

  // Selecionar top 10 chaves pelo total (para heatmap legível)
  const totals = Array.from(matrix.entries()).map(([k, m]) => ({ key: k, total: Array.from(m.values()).reduce((a,b)=>a+b,0) }));
  totals.sort((a,b)=>b.total - a.total);
  const topKeys = totals.slice(0, 10).map(x=>x.key);

    const data = topKeys.map(k => ({ key: k, values: labels.map(ym => matrix.get(k)?.get(ym) ?? 0) }));
    return { labels, rows: data };
  });
});

// SLA summary: 
// - Concluídos: verde escuro
// - Não concluídos: 0-30 dias = verde claro, 31-60 dias = amarelo, 61+ dias = vermelho (atraso)
app.get('/api/sla/summary', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  
  const key = servidor ? `sla:servidor:${servidor}:v4` :
              unidadeCadastro ? `sla:uac:${unidadeCadastro}:v4` :
              meses ? `sla:meses:${meses.sort().join(',')}:v4` :
              'sla:v4';
  
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Adicionar filtro de meses se fornecido
    addMesFilter(where, meses);
    
    const today = new Date();
    
    // Buscar campos necessários usando sistema global de datas
    const rows = await prisma.record.findMany({ 
      where: { ...where, dataDaCriacao: { not: null } },
      select: { 
        dataCriacaoIso: true,
        dataDaCriacao: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        tempoDeResolucaoEmDias: true,
        status: true,
        statusDemanda: true,
        tipoDeManifestacao: true,
        data: true
      } 
    });
    
    // Buckets: concluídos (verde escuro), verde claro (0-30), amarelo (31-60), vermelho (61+)
    const buckets = { 
      concluidos: 0,      // Verde escuro
      verdeClaro: 0,      // 0-30 dias
      amarelo: 0,         // 31-60 dias
      vermelho: 0         // 61+ dias (atraso)
    };

    for (const r of rows) {
      // Se está concluído, marcar como verde escuro
      if (isConcluido(r)) {
        buckets.concluidos += 1;
        continue;
      }
      
      // Se não está concluído, calcular tempo de resolução usando sistema global
      const tempoResolucao = getTempoResolucaoEmDias(r, true);
      
      // Se não conseguir calcular pelo tempo, calcular dias desde criação
      let days = tempoResolucao;
      if (days === null) {
        const dataCriacao = getDataCriacao(r);
        if (dataCriacao) {
          const d = new Date(dataCriacao + 'T00:00:00');
          if (!isNaN(d.getTime())) {
            days = Math.floor((today - d) / (1000*60*60*24));
          }
        }
      }
      
      if (days === null) continue;
      
      // Classificar por faixa de dias
      if (days <= 30) {
        buckets.verdeClaro += 1;
      } else if (days <= 60) {
        buckets.amarelo += 1;
      } else {
        buckets.vermelho += 1;
      }
    }

    return buckets;
  });
});

// Simple filter endpoint: accepts field/value, returns matching rows
// OTIMIZADO: Cache, query otimizada, timeout e melhor tratamento de erros
app.post('/api/filter', async (req, res) => {
  try {
    const filters = Array.isArray(req.body?.filters) ? req.body.filters : [];
    const originalUrl = req.body?.originalUrl || '';
    
    // OTIMIZAÇÃO: Se não há filtros, retornar vazio IMEDIATAMENTE (sem processar)
    if (filters.length === 0) {
      setCacheHeaders(res, 300);
      return res.json([]);
    }
    
    // Criar chave de cache baseada nos filtros e URL original
    const cacheKey = `filter:${originalUrl}:${JSON.stringify(filters)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      setCacheHeaders(res, 300); // 5 minutos de cache
      return res.json(cached);
    }
    
    // Mapeamento de campos otimizado
    const fieldMap = { 
      Secretaria: 'orgaos', 
      Setor: 'unidadeCadastro', 
      Tipo: 'tipoDeManifestacao', 
      Categoria: 'tema', 
      Bairro: 'endereco', 
      Status: 'status', 
      StatusDemanda: 'statusDemanda',
      Data: 'dataCriacaoIso', 
      UAC: 'unidadeCadastro', 
      Responsavel: 'responsavel', 
      Canal: 'canal', 
      Prioridade: 'prioridade', 
      Orgaos: 'orgaos', 
      UnidadeCadastro: 'unidadeCadastro', 
      TipoManifestacao: 'tipoDeManifestacao', 
      Tema: 'tema', 
      Assunto: 'assunto',
      'protocolo': 'protocolo',
      'data_da_criacao': 'dataDaCriacao',
      'status_demanda': 'statusDemanda',
      'prazo_restante': 'prazoRestante',
      'data_da_conclusao': 'dataDaConclusao',
      'tempo_de_resolucao_em_dias': 'tempoDeResolucaoEmDias',
      'prioridade': 'prioridade',
      'tipo_de_manifestacao': 'tipoDeManifestacao',
      'tema': 'tema',
      'assunto': 'assunto',
      'canal': 'canal',
      'endereco': 'endereco',
      'unidade_cadastro': 'unidadeCadastro',
      'unidade_saude': 'unidadeSaude',
      'status': 'status',
      'servidor': 'servidor',
      'responsavel': 'responsavel',
      'verificado': 'verificado',
      'orgaos': 'orgaos'
    };
    
    // Construir where clause otimizado
    const whereClause = {};
    const needsInMemoryFilter = [];
    const fieldsNeeded = new Set(['id', 'data']); // Campos sempre necessários
    
    // Separar filtros que podem usar where clause
    for (const f of filters) {
      const col = fieldMap[f.field];
      if (col && f.op === 'eq') {
        whereClause[col] = f.value;
        fieldsNeeded.add(col);
      } else if (col && f.op === 'contains') {
        // Para contains, usar contains do MongoDB (mais rápido que filtrar em memória)
        whereClause[col] = { contains: f.value };
        fieldsNeeded.add(col);
      } else {
        needsInMemoryFilter.push(f);
        if (col) fieldsNeeded.add(col);
      }
    }
    
    // OTIMIZAÇÃO: Buscar apenas campos necessários e limitar resultados
    const selectFields = Object.fromEntries(Array.from(fieldsNeeded).map(f => [f, true]));
    
    // OTIMIZAÇÃO: Reduzir ainda mais o limite e timeout mais agressivo
    const queryPromise = prisma.record.findMany({ 
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      select: selectFields,
      take: 1000 // Reduzido de 2k para 1k para melhor performance
    });
    
    // Timeout mais agressivo: 15 segundos (reduzido de 20s)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout após 15 segundos')), 15000)
    );
    
    const allRows = await Promise.race([queryPromise, timeoutPromise]);
    
    // Aplicar filtros em memória apenas se necessário (casos especiais)
    let filtered = allRows;
    if (needsInMemoryFilter.length > 0) {
      filtered = allRows.filter(r => {
        for (const f of needsInMemoryFilter) {
          const col = fieldMap[f.field];
          const value = col ? (r[col] || (r.data || {})[f.field] || '') : ((r.data || {})[f.field] || '');
          const valueStr = `${value}`.toLowerCase();
          const filterStr = `${f.value}`.toLowerCase();
          
          if (f.op === 'eq' && valueStr !== filterStr) return false;
          if (f.op === 'contains' && !valueStr.includes(filterStr)) return false;
        }
        return true;
      });
    }
    
    const result = filtered.map(r => ({ ...r, data: r.data || {} }));
    
    // Armazenar no cache (5 minutos - dados mudam apenas às 12h e 17h)
    cache.set(cacheKey, result, 300);
    setCacheHeaders(res, 300);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no endpoint /api/filter:', error.message);
    // Retornar array vazio em caso de erro (melhor que quebrar a aplicação)
    res.status(500).json({ error: error.message || 'Erro ao processar filtros', data: [] });
  }
});

// Tempo médio de atendimento por órgão/unidade
app.get('/api/stats/average-time', async (req, res) => {
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const key = servidor ? `avgTime:servidor:${servidor}:v3` :
              unidadeCadastro ? `avgTime:uac:${unidadeCadastro}:v3` :
              'avgTime:v3';
  
  // Cache de 1 hora
  try {
    return await withCache(key, 3600, res, async () => {
      const where = {};
      if (servidor) where.servidor = servidor;
      if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
      
      // Construir filtro de data baseado nos meses selecionados
      if (meses && meses.length > 0) {
        const monthFilters = meses.map(month => {
          if (/^\d{4}-\d{2}$/.test(month)) return month;
          const match = month.match(/^(\d{2})\/(\d{4})$/);
          if (match) return `${match[2]}-${match[1]}`;
          return month;
        });
        where.AND = [
          ...(where.AND || []),
          {
            OR: monthFilters.map(month => ({
              dataDaCriacao: { startsWith: month }
            }))
          }
        ];
      }
      
      // OTIMIZAÇÃO: Buscar apenas registros com dados necessários, limitando resultado
      // Usar select para buscar apenas campos necessários (reduz transferência de dados)
      const rows = await prisma.record.findMany({
        where: {
          ...where,
          dataDaCriacao: { not: null },
        },
        select: {
          orgaos: true,
          responsavel: true,
          unidadeCadastro: true,
          tempoDeResolucaoEmDias: true,
          dataCriacaoIso: true,
          dataDaCriacao: true,
          dataConclusaoIso: true,
          dataDaConclusao: true
        },
        take: 10000 // Limitar para evitar timeout em bases muito grandes
      });
      
      // Agrupar por órgão/unidade e calcular média usando sistema global de datas
      const map = new Map();
      for (const r of rows) {
        // Priorizar orgaos, depois responsavel, depois unidadeCadastro
        const org = r.orgaos || r.responsavel || r.unidadeCadastro || 'Não informado';
        
        // Se apenasConcluidos é true, verificar se tem data de conclusão
        if (apenasConcluidos && !isConcluido(r)) {
          continue;
        }
        
        // Usar sistema global para calcular tempo de resolução
        const days = getTempoResolucaoEmDias(r, incluirZero);
        
        // Ignorar se não conseguir calcular
        if (days === null) continue;
        
        if (!map.has(org)) map.set(org, { total: 0, sum: 0 });
        const stats = map.get(org);
        stats.total += 1;
        stats.sum += days;
      }
      
      // Calcular médias e retornar ordenado por dias (maior primeiro)
      const result = Array.from(map.entries())
        .map(([org, stats]) => ({ 
          org, 
          dias: stats.total > 0 ? Number((stats.sum / stats.total).toFixed(2)) : 0,
          quantidade: stats.total
        }))
        .filter(item => item.dias > 0) // Filtrar apenas órgãos com tempo válido
        .sort((a, b) => b.dias - a.dias);
      
      return result;
    });
  } catch (error) {
    console.error('❌ Erro ao calcular tempo médio:', error);
    return res.status(500).json({ error: 'Erro ao calcular tempo médio de atendimento', details: error.message });
  }
});

// Tempo médio por dia (últimos 30 dias)
app.get('/api/stats/average-time/by-day', async (req, res) => {
  console.log('📥 [by-day] Requisição recebida');
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false'; // default true
  
  const key = servidor ? `avgTimeByDay:servidor:${servidor}:v4` :
              unidadeCadastro ? `avgTimeByDay:uac:${unidadeCadastro}:v4` :
              meses ? `avgTimeByDay:meses:${meses.sort().join(',')}:v4` :
              'avgTimeByDay:v4';
  
  return withCache(key, 3600, res, async () => {
    console.log('📊 [by-day] Calculando dados (cache miss)...');
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Buscar TODOS os registros que têm dataDaCriacao (100% dos registros)
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null }
      },
      select: {
        dataCriacaoIso: true,
        dataDaCriacao: true,
        tempoDeResolucaoEmDias: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      }
    });
    
    const today = new Date();
    const map = new Map();
    
    // Usar sistema global de datas (normalizeDate, getDataCriacao, getTempoResolucaoEmDias já estão disponíveis)
    
    // Debug: verificar quantos registros temos
    console.log(`📊 [by-day] Total de registros encontrados: ${rows.length}`);
    let processados = 0;
    let comData = 0;
    let comDias = 0;
    
    for (const r of rows) {
      processados++;
      // Usar sistema global de datas
      const dataCriacao = getDataCriacao(r);
      
      if (!dataCriacao) {
        if (processados <= 10) {
          console.log(`  [${processados}] Sem data: dataCriacaoIso=${r.dataCriacaoIso}, dataDaCriacao=${typeof r.dataDaCriacao}`);
        }
        continue;
      }
      comData++;
      
      // Debug: mostrar primeiras datas normalizadas
      if (comData <= 5) {
        console.log(`  [${comData}] Data normalizada: ${dataCriacao}`);
      }
      
      let days = null;
      // Verificar se tempoDeResolucaoEmDias existe (mesmo que seja 0 ou string vazia)
      if (r.tempoDeResolucaoEmDias !== null && r.tempoDeResolucaoEmDias !== undefined && r.tempoDeResolucaoEmDias !== '') {
        const parsed = parseFloat(r.tempoDeResolucaoEmDias);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1000) {
          days = parsed;
        }
      }
      
      // Se não tiver tempoDeResolucaoEmDias, tentar calcular a partir das datas
      if (days === null) {
        // Tentar usar dataCriacaoIso e dataConclusaoIso
        if (dataCriacao && r.dataConclusaoIso) {
          const start = new Date(dataCriacao + 'T00:00:00');
          const end = new Date(r.dataConclusaoIso + 'T00:00:00');
          if (!isNaN(start) && !isNaN(end)) {
            const calculated = Math.floor((end - start) / (1000 * 60 * 60 * 24));
            if (calculated >= 0 && calculated <= 1000) {
              days = calculated;
            }
          }
        }
        
        // Se ainda não tiver, tentar usar dataDaConclusao
        if (days === null && r.dataDaConclusao) {
          const dataConclusao = normalizeDate(r.dataDaConclusao);
          if (dataConclusao && dataCriacao) {
            const start = new Date(dataCriacao + 'T00:00:00');
            const end = new Date(dataConclusao + 'T00:00:00');
            if (!isNaN(start) && !isNaN(end)) {
              const calculated = Math.floor((end - start) / (1000 * 60 * 60 * 24));
              if (calculated >= 0 && calculated <= 1000) {
                days = calculated;
              }
            }
          }
        }
      }
      
      // Se apenasConcluidos é true, verificar se tem data de conclusão
      if (apenasConcluidos && !r.dataConclusaoIso && !r.dataDaConclusao) {
        continue;
      }
      
      // Se não conseguir calcular dias, pular (registro não concluído ou sem dados)
      if (days === null) continue;
      comDias++;
      
      // Agrupar por data de criação para ver tendência ao longo do tempo
      if (!map.has(dataCriacao)) map.set(dataCriacao, { total: 0, sum: 0 });
      const stats = map.get(dataCriacao);
      stats.total += 1;
      stats.sum += days;
    }
    
    console.log(`📊 [by-day] Processados: ${processados}, Com data: ${comData}, Com dias: ${comDias}, Datas únicas: ${map.size}`);
    
    // Mostrar algumas datas processadas
    if (map.size > 0) {
      const sampleDates = Array.from(map.entries()).slice(0, 5);
      console.log(`📊 [by-day] Amostra de datas processadas:`, sampleDates.map(([date, stats]) => `${date}: ${stats.total} registros, média ${(stats.sum/stats.total).toFixed(2)} dias`));
    }
    
    // Usar TODAS as datas disponíveis no banco, limitando aos últimos 30 dias de dados reais
    const result = [];
    const todayStr = today.toISOString().slice(0, 10);
    console.log(`📊 [by-day] Data de hoje: ${todayStr}, Total de datas no map: ${map.size}`);
    
    if (map.size > 0) {
      const allDates = Array.from(map.keys()).sort();
      console.log(`📊 [by-day] Primeira data no map: ${allDates[0]}, Última data no map: ${allDates[allDates.length - 1]}`);
      console.log(`📊 [by-day] Últimas 5 datas no map:`, allDates.slice(-5));
      
      // Pegar as últimas 30 datas disponíveis (ou todas se houver menos de 30)
      const datesToUse = allDates.slice(-30);
      
      // Preencher com zeros as datas que não existem no período
      // Mas usar as datas reais que temos
      for (const dateKey of datesToUse) {
        const stats = map.get(dateKey);
        result.push({
          date: dateKey,
          dias: stats ? Number((stats.sum / stats.total).toFixed(2)) : 0,
          quantidade: stats ? stats.total : 0
        });
      }
      
      // Se temos menos de 30 datas, preencher com zeros até completar 30
      while (result.length < 30 && datesToUse.length > 0) {
        const lastDate = new Date(datesToUse[datesToUse.length - 1] + 'T00:00:00');
        lastDate.setDate(lastDate.getDate() + 1);
        const nextDateKey = lastDate.toISOString().slice(0, 10);
        if (!datesToUse.includes(nextDateKey)) {
          result.push({
            date: nextDateKey,
            dias: 0,
            quantidade: 0
          });
          datesToUse.push(nextDateKey);
        } else {
          break;
        }
      }
    } else {
      // Se não há dados, retornar últimos 30 dias a partir de hoje
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        result.push({
          date: dateKey,
          dias: 0,
          quantidade: 0
        });
      }
    }
    
    // Debug: verificar quantos dias têm dados
    const diasComDados = result.filter(r => r.quantidade > 0).length;
    const totalDias = result.reduce((sum, r) => sum + r.dias, 0);
    const totalQuantidade = result.reduce((sum, r) => sum + r.quantidade, 0);
    console.log(`📊 [by-day] Resultado: ${diasComDados}/30 dias com dados, ${totalQuantidade} registros totais, média geral: ${totalQuantidade > 0 ? (totalDias/totalQuantidade).toFixed(2) : 0} dias`);
    
    return result;
  });
});

// Tempo médio por semana (últimas 12 semanas)
app.get('/api/stats/average-time/by-week', async (req, res) => {
  console.log('📥 [by-week] Requisição recebida');
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  
  const key = servidor ? `avgTimeByWeek:servidor:${servidor}:v4` :
              unidadeCadastro ? `avgTimeByWeek:uac:${unidadeCadastro}:v4` :
              meses ? `avgTimeByWeek:meses:${meses.sort().join(',')}:v4` :
              'avgTimeByWeek:v4';
  
  return withCache(key, 3600, res, async () => {
    console.log('📊 [by-week] Calculando dados (cache miss)...');
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Construir filtro de data baseado nos meses selecionados
    if (meses && meses.length > 0) {
      const monthFilters = meses.map(month => {
        if (/^\d{4}-\d{2}$/.test(month)) return month;
        const match = month.match(/^(\d{2})\/(\d{4})$/);
        if (match) return `${match[2]}-${match[1]}`;
        return month;
      });
      where.OR = monthFilters.map(month => ({
        dataDaCriacao: { startsWith: month }
      }));
    }
    
    // Buscar TODOS os registros que têm dataDaCriacao (100% dos registros)
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null }
      },
      select: {
        dataCriacaoIso: true,
        dataDaCriacao: true,
        tempoDeResolucaoEmDias: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      }
    });
    
    const map = new Map();
    
    // Usar sistema global de datas
    for (const r of rows) {
      // Se apenasConcluidos é true, verificar se tem data de conclusão
      if (apenasConcluidos && !isConcluido(r)) {
        continue;
      }
      
      // Usar sistema global para calcular tempo de resolução
      const days = getTempoResolucaoEmDias(r, incluirZero);
      
      if (days === null) continue;
      
      // Calcular semana usando data de criação
      const dataCriacao = getDataCriacao(r);
      if (!dataCriacao) continue;
      
      const date = new Date(dataCriacao + 'T00:00:00');
      if (isNaN(date.getTime())) continue;
      const year = date.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const daysSinceStart = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
      const week = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
      
      if (!map.has(weekKey)) map.set(weekKey, { total: 0, sum: 0 });
      const stats = map.get(weekKey);
      stats.total += 1;
      stats.sum += days;
    }
    
    // Últimas 12 semanas
    const result = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - (i * 7));
      const year = d.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const daysSinceStart = Math.floor((d - startOfYear) / (1000 * 60 * 60 * 24));
      const week = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
      const stats = map.get(weekKey);
      result.push({
        week: weekKey,
        dias: stats ? Number((stats.sum / stats.total).toFixed(2)) : 0,
        quantidade: stats ? stats.total : 0
      });
    }
    
    return result;
  });
});

// Tempo médio por mês (últimos 12 meses)
app.get('/api/stats/average-time/by-month', async (req, res) => {
  console.log('📥 [by-month] Requisição recebida');
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  
  const key = servidor ? `avgTimeByMonth:servidor:${servidor}:v4` :
              unidadeCadastro ? `avgTimeByMonth:uac:${unidadeCadastro}:v4` :
              meses ? `avgTimeByMonth:meses:${meses.sort().join(',')}:v4` :
              'avgTimeByMonth:v4';
  
  return withCache(key, 3600, res, async () => {
    console.log('📊 [by-month] Calculando dados (cache miss)...');
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Construir filtro de data baseado nos meses selecionados
    if (meses && meses.length > 0) {
      const monthFilters = meses.map(month => {
        if (/^\d{4}-\d{2}$/.test(month)) return month;
        const match = month.match(/^(\d{2})\/(\d{4})$/);
        if (match) return `${match[2]}-${match[1]}`;
        return month;
      });
      where.OR = monthFilters.map(month => ({
        dataDaCriacao: { startsWith: month }
      }));
    }
    
    // Buscar TODOS os registros que têm dataDaCriacao (100% dos registros)
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null }
      },
      select: {
        dataCriacaoIso: true,
        dataDaCriacao: true,
        tempoDeResolucaoEmDias: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      }
    });
    
    const map = new Map();
    
    // Usar sistema global de datas
    for (const r of rows) {
      // Se apenasConcluidos é true, verificar se tem data de conclusão
      if (apenasConcluidos && !isConcluido(r)) {
        continue;
      }
      
      // Usar sistema global para calcular tempo de resolução
      const days = getTempoResolucaoEmDias(r, incluirZero);
      
      if (days === null) continue;
      
      // Obter mês usando sistema global
      const mes = getMes(r);
      if (!mes) continue;
      
      if (!map.has(mes)) map.set(mes, { total: 0, sum: 0 });
      const stats = map.get(mes);
      stats.total += 1;
      stats.sum += days;
    }
    
    // Últimos 12 meses
    const result = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.toISOString().slice(0, 7);
      const stats = map.get(monthKey);
      result.push({
        month: monthKey,
        dias: stats ? Number((stats.sum / stats.total).toFixed(2)) : 0,
        quantidade: stats ? stats.total : 0
      });
    }
    
    return result;
  });
});

// Estatísticas gerais de tempo (mínimo, máximo, mediana, média)
app.get('/api/stats/average-time/stats', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  
  const key = servidor ? `avgTimeStats:servidor:${servidor}:v4` :
              unidadeCadastro ? `avgTimeStats:uac:${unidadeCadastro}:v4` :
              meses ? `avgTimeStats:meses:${meses.sort().join(',')}:v4` :
              'avgTimeStats:v4';
  
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Construir filtro de data baseado nos meses selecionados
    if (meses && meses.length > 0) {
      const monthFilters = meses.map(month => {
        if (/^\d{4}-\d{2}$/.test(month)) return month;
        const match = month.match(/^(\d{2})\/(\d{4})$/);
        if (match) return `${match[2]}-${match[1]}`;
        return month;
      });
      where.OR = monthFilters.map(month => ({
        dataDaCriacao: { startsWith: month }
      }));
    }
    
    // Buscar TODOS os registros que têm dataDaCriacao (100% dos registros)
    const rows = await prisma.record.findMany({
      where: {
        ...where,
        dataDaCriacao: { not: null }
      },
      select: {
        tempoDeResolucaoEmDias: true,
        dataCriacaoIso: true,
        dataDaCriacao: true,
        dataConclusaoIso: true,
        dataDaConclusao: true,
        data: true
      },
      take: 10000 // Limitar para performance
    });
    
    // Usar sistema global de datas
    const tempos = [];
    
    for (const r of rows) {
      // Se apenasConcluidos é true, verificar se tem data de conclusão
      if (apenasConcluidos && !isConcluido(r)) {
        continue;
      }
      
      // Usar sistema global para calcular tempo de resolução
      const days = getTempoResolucaoEmDias(r, incluirZero);
      
      if (days !== null) tempos.push(days);
    }
    
    if (tempos.length === 0) {
      return {
        media: 0,
        mediana: 0,
        minimo: 0,
        maximo: 0,
        total: 0
      };
    }
    
    tempos.sort((a, b) => a - b);
    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    const mediana = tempos.length % 2 === 0
      ? (tempos[tempos.length / 2 - 1] + tempos[tempos.length / 2]) / 2
      : tempos[Math.floor(tempos.length / 2)];
    
    return {
      media: Number(media.toFixed(2)),
      mediana: Number(mediana.toFixed(2)),
      minimo: tempos[0],
      maximo: tempos[tempos.length - 1],
      total: tempos.length
    };
  });
});

// Tempo médio por Unidade de Cadastro
app.get('/api/stats/average-time/by-unit', async (req, res) => {
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  const servidor = req.query.servidor;
  
  const key = servidor ? `avgTimeByUnit:servidor:${servidor}:v1` :
              meses ? `avgTimeByUnit:meses:${meses.sort().join(',')}:v1` :
              'avgTimeByUnit:v1';
  
  try {
    return await withCache(key, 3600, res, async () => {
      const where = {};
      if (servidor) where.servidor = servidor;
      
      // Construir filtro de data baseado nos meses selecionados
      if (meses && meses.length > 0) {
        const monthFilters = meses.map(month => {
          if (/^\d{4}-\d{2}$/.test(month)) return month;
          const match = month.match(/^(\d{2})\/(\d{4})$/);
          if (match) return `${match[2]}-${match[1]}`;
          return month;
        });
        where.AND = [
          ...(where.AND || []),
          {
            OR: monthFilters.map(month => ({
              dataDaCriacao: { startsWith: month }
            }))
          }
        ];
      }
      
      // Buscar registros
      const rows = await prisma.record.findMany({
        where: {
          ...where,
          dataDaCriacao: { not: null }
        },
        select: {
          unidadeCadastro: true,
          tempoDeResolucaoEmDias: true,
          dataCriacaoIso: true,
          dataDaCriacao: true,
          dataConclusaoIso: true,
          dataDaConclusao: true,
          data: true
        }
      });
      
      // Agrupar por unidade de cadastro e calcular média
      const map = new Map();
      for (const r of rows) {
        const unidade = r.unidadeCadastro || 'Não informado';
        
        // Se apenasConcluidos é true, verificar se tem data de conclusão
        if (apenasConcluidos && !isConcluido(r)) {
          continue;
        }
        
        // Usar sistema global para calcular tempo de resolução
        const days = getTempoResolucaoEmDias(r, incluirZero);
        
        // Ignorar se não conseguir calcular
        if (days === null) continue;
        
        if (!map.has(unidade)) map.set(unidade, { total: 0, sum: 0 });
        const stats = map.get(unidade);
        stats.total += 1;
        stats.sum += days;
      }
      
      // Calcular médias e retornar ordenado por dias (maior primeiro - decrescente)
      const result = Array.from(map.entries())
        .map(([unidade, stats]) => ({ 
          unidade, 
          dias: stats.total > 0 ? Number((stats.sum / stats.total).toFixed(2)) : 0,
          quantidade: stats.total
        }))
        .filter(item => item.dias > 0) // Filtrar apenas unidades com tempo válido
        .sort((a, b) => b.dias - a.dias); // Ordem decrescente
      
      return result;
    });
  } catch (error) {
    console.error('❌ Erro ao calcular tempo médio por unidade:', error);
    return res.status(500).json({ error: 'Erro ao calcular tempo médio por unidade', details: error.message });
  }
});

// Tempo médio por mês agrupado por unidade de cadastro
app.get('/api/stats/average-time/by-month-unit', async (req, res) => {
  const meses = req.query.meses ? (Array.isArray(req.query.meses) ? req.query.meses : [req.query.meses]) : null;
  const apenasConcluidos = req.query.apenasConcluidos === 'true';
  const incluirZero = req.query.incluirZero !== 'false';
  const servidor = req.query.servidor;
  
  const key = servidor ? `avgTimeByMonthUnit:servidor:${servidor}:v1` :
              meses ? `avgTimeByMonthUnit:meses:${meses.sort().join(',')}:v1` :
              'avgTimeByMonthUnit:v1';
  
  try {
    return await withCache(key, 3600, res, async () => {
      const where = {};
      if (servidor) where.servidor = servidor;
      
      // Construir filtro de data baseado nos meses selecionados
      if (meses && meses.length > 0) {
        const monthFilters = meses.map(month => {
          if (/^\d{4}-\d{2}$/.test(month)) return month;
          const match = month.match(/^(\d{2})\/(\d{4})$/);
          if (match) return `${match[2]}-${match[1]}`;
          return month;
        });
        where.AND = [
          ...(where.AND || []),
          {
            OR: monthFilters.map(month => ({
              dataDaCriacao: { startsWith: month }
            }))
          }
        ];
      }
      
      // Buscar registros
      const rows = await prisma.record.findMany({
        where: {
          ...where,
          dataDaCriacao: { not: null }
        },
        select: {
          unidadeCadastro: true,
          tempoDeResolucaoEmDias: true,
          dataCriacaoIso: true,
          dataDaCriacao: true,
          dataConclusaoIso: true,
          dataDaConclusao: true,
          data: true
        }
      });
      
      // Agrupar por unidade e mês
      const map = new Map(); // key: "unidade|mes", value: { total, sum }
      
      for (const r of rows) {
        const unidade = r.unidadeCadastro || 'Não informado';
        
        // Se apenasConcluidos é true, verificar se tem data de conclusão
        if (apenasConcluidos && !isConcluido(r)) {
          continue;
        }
        
        // Usar sistema global para calcular tempo de resolução
        const days = getTempoResolucaoEmDias(r, incluirZero);
        
        // Ignorar se não conseguir calcular
        if (days === null) continue;
        
        // Obter mês usando sistema global
        const mes = getMes(r);
        if (!mes) continue;
        
        const key = `${unidade}|${mes}`;
        if (!map.has(key)) map.set(key, { total: 0, sum: 0, unidade, mes });
        const stats = map.get(key);
        stats.total += 1;
        stats.sum += days;
      }
      
      // Converter para formato de resposta
      const result = Array.from(map.entries())
        .map(([key, stats]) => ({
          unidade: stats.unidade,
          mes: stats.mes,
          dias: stats.total > 0 ? Number((stats.sum / stats.total).toFixed(2)) : 0,
          quantidade: stats.total
        }))
        .filter(item => item.dias > 0)
        .sort((a, b) => {
          // Ordenar por mês primeiro, depois por unidade
          if (a.mes !== b.mes) return a.mes.localeCompare(b.mes);
          return a.unidade.localeCompare(b.unidade);
        });
      
      return result;
    });
  } catch (error) {
    console.error('❌ Erro ao calcular tempo médio por mês/unidade:', error);
    return res.status(500).json({ error: 'Erro ao calcular tempo médio por mês/unidade', details: error.message });
  }
});

// Total por Tema
app.get('/api/aggregate/by-theme', async (_req, res) => {
  const key = 'byTheme:v2';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const rows = await prisma.record.groupBy({ by: ['tema'], _count: { _all: true } });
    return rows
      .map(r => ({ tema: r.tema ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
  });
});

// Total por Assunto
app.get('/api/aggregate/by-subject', async (_req, res) => {
  const key = 'bySubject:v2';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const rows = await prisma.record.groupBy({ by: ['assunto'], _count: { _all: true } });
    return rows
      .map(r => ({ assunto: r.assunto ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
  });
});

// Por Servidor/Cadastrante
app.get('/api/aggregate/by-server', async (req, res) => {
  const unidadeCadastro = req.query.unidadeCadastro;
  const cacheKey = unidadeCadastro ? `byServer:uac:${unidadeCadastro}:v2` : 'byServer:v2';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = unidadeCadastro ? { unidadeCadastro } : {};
    const rows = await prisma.record.groupBy({ 
      by: ['servidor'],
      where,
      _count: { _all: true } 
    });
    return rows
      .map(r => ({ servidor: r.servidor ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
  });
});

// Endpoint para dados filtrados por servidor ou unidade
app.get('/api/aggregate/filtered', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  if (!servidor && !unidadeCadastro) {
    return res.status(400).json({ error: 'servidor ou unidadeCadastro required' });
  }
  
  const cacheKey = servidor ? `filtered:servidor:${servidor}:v1` : 
                    `filtered:uac:${unidadeCadastro}:v1`;
  
  return withCache(cacheKey, 300, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    const total = await prisma.record.count({ where });
    
    // Dados por mês
    const rows = await prisma.record.findMany({ 
      where: { ...where, dataDaCriacao: { not: null } },
      select: { 
        dataCriacaoIso: true,
        dataDaCriacao: true,
        data: true
      } 
    });
    const monthMap = new Map();
    for (const r of rows) {
      // Usar sistema global de datas
      const mes = getMes(r);
      if (!mes) continue;
      monthMap.set(mes, (monthMap.get(mes) ?? 0) + 1);
    }
    const byMonth = Array.from(monthMap.entries()).map(([ym, count]) => ({ ym, count }))
      .sort((a,b) => a.ym.localeCompare(b.ym)).slice(-12);
    
    // Dados por tema
    const temas = await prisma.record.groupBy({
      by: ['tema'],
      where,
      _count: { _all: true }
    });
    const byTheme = temas
      .map(r => ({ tema: r.tema ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
      // Removido .slice(0, 10) para mostrar todos os temas
    
    // Dados por assunto
    const assuntos = await prisma.record.groupBy({
      by: ['assunto'],
      where,
      _count: { _all: true }
    });
    const bySubject = assuntos
      .map(r => ({ assunto: r.assunto ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
      // Removido .slice(0, 10) para mostrar todos os assuntos
    
    // Dados por status
    const status = await prisma.record.groupBy({
      by: ['status'],
      where,
      _count: { _all: true }
    });
    const byStatus = status
      .map(r => ({ status: r.status ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    // Unidades cadastradas por este servidor (se filtro for por servidor)
    let unidadesCadastradas = [];
    if (servidor) {
      const uacs = await prisma.record.groupBy({
        by: ['unidadeCadastro'],
        where: { servidor },
        _count: { _all: true }
      });
      unidadesCadastradas = uacs
        .map(r => ({ unidade: r.unidadeCadastro ?? 'Não informado', quantidade: r._count._all }))
        .sort((a, b) => b.quantidade - a.quantidade);
    }
    
    return {
      total,
      byMonth,
      byTheme,
      bySubject,
      byStatus,
      unidadesCadastradas,
      filter: servidor ? { type: 'servidor', value: servidor } : { type: 'unidadeCadastro', value: unidadeCadastro }
    };
  });
});

// Dados cruzados para Sankey: Tema → Órgão → Status
app.get('/api/aggregate/sankey-flow', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `sankey:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `sankey:uac:${unidadeCadastro}:v1` : 
                    'sankey:v1';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Buscar registros com tema, órgão e status
    const records = await prisma.record.findMany({
      where: { ...where, tema: { not: null }, orgaos: { not: null }, status: { not: null } },
      select: {
        tema: true,
        orgaos: true,
        status: true
      },
      take: 10000 // Limitar para performance
    });
    
    // Agrupar por combinações tema-órgão-status
    const flowMap = new Map();
    records.forEach(r => {
      const tema = r.tema || 'Não informado';
      const orgao = r.orgaos || 'Não informado';
      const status = r.status || 'Não informado';
      
      // Tema → Órgão
      const key1 = `${tema}|${orgao}`;
      flowMap.set(key1, (flowMap.get(key1) || 0) + 1);
      
      // Órgão → Status
      const key2 = `${orgao}|${status}`;
      flowMap.set(key2, (flowMap.get(key2) || 0) + 1);
    });
    
    // Contar frequência de cada tema, órgão e status para pegar os top
    const temaCount = new Map();
    const orgaoCount = new Map();
    const statusCount = new Map();
    
    records.forEach(r => {
      const tema = r.tema || 'Não informado';
      const orgao = r.orgaos || 'Não informado';
      const status = r.status || 'Não informado';
      
      temaCount.set(tema, (temaCount.get(tema) || 0) + 1);
      orgaoCount.set(orgao, (orgaoCount.get(orgao) || 0) + 1);
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });
    
    // Top temas, órgãos e status
    const topTemas = Array.from(temaCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tema]) => tema);
    
    const topOrgaos = Array.from(orgaoCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([orgao]) => orgao);
    
    const topStatuses = Array.from(statusCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([status]) => status);
    
    // Criar links apenas para os tops
    const links = [];
    
    // Tema → Órgão
    topTemas.forEach(tema => {
      topOrgaos.forEach(orgao => {
        const key = `${tema}|${orgao}`;
        const value = flowMap.get(key) || 0;
        if (value > 0) {
          links.push({ source: tema, target: orgao, value, type: 'tema-orgao' });
        }
      });
    });
    
    // Órgão → Status
    topOrgaos.forEach(orgao => {
      topStatuses.forEach(status => {
        const key = `${orgao}|${status}`;
        const value = flowMap.get(key) || 0;
        if (value > 0) {
          links.push({ source: orgao, target: status, value, type: 'orgao-status' });
        }
      });
    });
    
    return {
      nodes: {
        temas: topTemas,
        orgaos: topOrgaos,
        statuses: topStatuses
      },
      links: links.filter(l => l.value > 0).sort((a, b) => b.value - a.value)
    };
  });
});

// Status por mês
app.get('/api/aggregate/count-by-status-mes', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `statusMes:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `statusMes:uac:${unidadeCadastro}:v1` : 
                    'statusMes:v1';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    const rows = await prisma.record.findMany({ 
      where: { ...where, dataDaCriacao: { not: null } },
      select: { 
        dataCriacaoIso: true,
        dataDaCriacao: true,
        data: true,
        status: true
      } 
    });
    
    const map = new Map();
    for (const r of rows) {
      const mes = getMes(r);
      const status = r.status || 'Não informado';
      if (!mes) continue;
      
      const key = `${status}|${mes}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    
    return Array.from(map.entries()).map(([key, count]) => {
      const [status, month] = key.split('|');
      return { status, month, count };
    }).sort((a, b) => {
      if (a.month !== b.month) return a.month.localeCompare(b.month);
      return a.status.localeCompare(b.status);
    });
  });
});

// Órgão por mês
app.get('/api/aggregate/count-by-orgao-mes', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `orgaoMes:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `orgaoMes:uac:${unidadeCadastro}:v1` : 
                    'orgaoMes:v1';
  
  return withCache(cacheKey, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    const rows = await prisma.record.findMany({ 
      where: { ...where, dataDaCriacao: { not: null } },
      select: { 
        dataCriacaoIso: true,
        dataDaCriacao: true,
        data: true,
        orgaos: true
      } 
    });
    
    const map = new Map();
    for (const r of rows) {
      const mes = getMes(r);
      const orgao = r.orgaos || 'Não informado';
      if (!mes) continue;
      
      const key = `${orgao}|${mes}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    
    return Array.from(map.entries()).map(([key, count]) => {
      const [orgao, month] = key.split('|');
      return { orgao, month, count };
    }).sort((a, b) => {
      if (a.month !== b.month) return a.month.localeCompare(b.month);
      return a.orgao.localeCompare(b.orgao);
    });
  });
});

// Status geral (percentuais)
app.get('/api/stats/status-overview', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const key = servidor ? `statusOverview:servidor:${servidor}:v2` :
              unidadeCadastro ? `statusOverview:uac:${unidadeCadastro}:v2` :
              'statusOverview:v2';
  
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    const total = await prisma.record.count({ where });
    // OTIMIZAÇÃO: Usar groupBy do Prisma para agregação no banco (muito mais rápido)
    // Se groupBy não funcionar bem, usar select limitado
    try {
      // Tentar usar groupBy primeiro (mais eficiente)
      const statusGroups = await prisma.record.groupBy({
        by: ['status'],
        where: Object.keys(where).length > 0 ? where : undefined,
        _count: { _all: true }
      });
      
      // Se groupBy retornou resultados, usar eles
      if (statusGroups.length > 0) {
        let concluidas = 0;
        let emAtendimento = 0;
        
        for (const group of statusGroups) {
          const statusValue = group.status || '';
          const status = `${statusValue}`.toLowerCase();
          
          if (status.includes('concluída') || status.includes('concluida') || 
              status.includes('encerrada') || status.includes('arquivamento') ||
              status.includes('resposta final')) {
            concluidas += group._count._all;
          } else if (status.includes('em atendimento') || status.includes('aberto') || 
                     status.includes('pendente') || status.includes('análise') ||
                     status.includes('departamento') || status.includes('ouvidoria') ||
                     status.length > 0) {
            emAtendimento += group._count._all;
          }
        }
        
        return {
          total,
          concluida: {
            quantidade: concluidas,
            percentual: total > 0 ? Number(((concluidas / total) * 100).toFixed(1)) : 0
          },
          emAtendimento: {
            quantidade: emAtendimento,
            percentual: total > 0 ? Number(((emAtendimento / total) * 100).toFixed(1)) : 0
          }
        };
      }
    } catch (e) {
      // Fallback: se groupBy falhar, usar método anterior
      console.warn('⚠️ groupBy não disponível, usando fallback');
    }
    
    // Fallback: buscar apenas campos necessários com limite
    const allRecords = await prisma.record.findMany({ 
      where: Object.keys(where).length > 0 ? where : undefined,
      select: { status: true, statusDemanda: true },
      take: 10000 // Limitar para evitar timeout
    });
    let concluidas = 0;
    let emAtendimento = 0;
    
    for (const r of allRecords) {
      const statusValue = r.status || r.statusDemanda || '';
      const status = `${statusValue}`.toLowerCase();
      
      // Detectar status concluído
      if (status.includes('concluída') || status.includes('concluida') || 
          status.includes('encerrada') || status.includes('arquivamento') ||
          status.includes('resposta final')) {
        concluidas++;
      } 
      // Detectar status em atendimento
      else if (status.includes('em atendimento') || status.includes('aberto') || 
               status.includes('pendente') || status.includes('análise') ||
               status.includes('departamento') || status.includes('ouvidoria') ||
               status.length > 0) {
        emAtendimento++;
      }
    }
    
    return {
      total,
      concluida: {
        quantidade: concluidas,
        percentual: total > 0 ? Number(((concluidas / total) * 100).toFixed(1)) : 0
      },
      emAtendimento: {
        quantidade: emAtendimento,
        percentual: total > 0 ? Number(((emAtendimento / total) * 100).toFixed(1)) : 0
      }
    };
  });
});

// Endpoint para dados filtrados por unidade (UAC ou Responsável)
app.get('/api/unit/:unitName', async (req, res) => {
  const unitName = decodeURIComponent(req.params.unitName);
  const key = `unit:${unitName}:v2`;
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    // OTIMIZAÇÃO: Usar queries com where clause usando índices (muito mais rápido)
    // MongoDB não suporta contains case-insensitive, então buscamos com contains e filtramos
    const searchLower = unitName.toLowerCase();
    
    // Buscar com OR em múltiplos campos usando contains (usa índices!)
    // Buscar variações do nome para melhor cobertura
    const searchVariations = [
      unitName,
      unitName.toLowerCase(),
      unitName.toUpperCase(),
      unitName.charAt(0).toUpperCase() + unitName.slice(1).toLowerCase()
    ];
    
    // Buscar registros que contenham o nome em qualquer um dos campos indexados
    const allRecords = await prisma.record.findMany({
      where: {
        OR: [
          { unidadeCadastro: { contains: unitName } },
          { responsavel: { contains: unitName } },
          { orgaos: { contains: unitName } },
          { unidadeSaude: { contains: unitName } }
        ]
      },
      select: { assunto: true, tipoDeManifestacao: true, unidadeCadastro: true, responsavel: true, orgaos: true, unidadeSaude: true },
      take: 5000 // Limitar para evitar timeout
    });
    
    // Filtrar em memória para case-insensitive (apenas nos resultados limitados)
    const records = allRecords.filter(r => {
      const unidadeCadastro = (r.unidadeCadastro || '').toLowerCase();
      const responsavel = (r.responsavel || '').toLowerCase();
      const orgaos = (r.orgaos || '').toLowerCase();
      const unidadeSaude = (r.unidadeSaude || '').toLowerCase();
      
      return unidadeCadastro.includes(searchLower) || 
             responsavel.includes(searchLower) || 
             orgaos.includes(searchLower) || 
             unidadeSaude.includes(searchLower);
    });
    
    // Agrupar por assunto
    const assuntoMap = new Map();
    const tipoMap = new Map();
    
    for (const r of records) {
      const assunto = r.assunto || 'Não informado';
      const tipo = r.tipoDeManifestacao || 'Não informado';
      
      assuntoMap.set(assunto, (assuntoMap.get(assunto) || 0) + 1);
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    }
    
    const assuntos = Array.from(assuntoMap.entries())
      .map(([assunto, count]) => ({ assunto, quantidade: count }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const tipos = Array.from(tipoMap.entries())
      .map(([tipo, count]) => ({ tipo, quantidade: count }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    return { assuntos, tipos };
  });
});

// Endpoint para reclamações e denúncias (filtro por tipo)
app.get('/api/complaints-denunciations', async (_req, res) => {
  const key = 'complaints:v2';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    // OTIMIZAÇÃO: Usar where clause com OR para buscar tipos específicos (usa índices!)
    // Buscar variações do texto para cobrir diferentes grafias
    const allRecords = await prisma.record.findMany({
      where: {
        OR: [
          { tipoDeManifestacao: { contains: 'Reclamação' } },
          { tipoDeManifestacao: { contains: 'Reclamacao' } },
          { tipoDeManifestacao: { contains: 'Reclama' } },
          { tipoDeManifestacao: { contains: 'Denúncia' } },
          { tipoDeManifestacao: { contains: 'Denuncia' } },
          { tipoDeManifestacao: { contains: 'Denún' } }
        ]
      },
      select: { assunto: true, tipoDeManifestacao: true },
      take: 5000 // Limitar para evitar timeout
    });
    
    // Filtrar em memória para case-insensitive (apenas nos resultados limitados)
    const records = allRecords.filter(r => {
      const tipo = (r.tipoDeManifestacao || '').toLowerCase();
      return tipo.includes('reclamação') || tipo.includes('reclamacao') || 
             tipo.includes('denúncia') || tipo.includes('denuncia');
    });
    
    const assuntoMap = new Map();
    const tipoMap = new Map();
    
    for (const r of records) {
      const tipo = r.tipoDeManifestacao || 'Não informado';
      const assunto = r.assunto || 'Não informado';
      
      assuntoMap.set(assunto, (assuntoMap.get(assunto) || 0) + 1);
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    }
    
    const assuntos = Array.from(assuntoMap.entries())
      .map(([assunto, count]) => ({ assunto, quantidade: count }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const tipos = Array.from(tipoMap.entries())
      .map(([tipo, count]) => ({ tipo, quantidade: count }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    return { assuntos, tipos };
  });
});

// Metadados: retornar aliases e colunas disponíveis
// ========== ENDPOINTS DE SECRETARIAS E DISTRITOS ==========
// ========== IA ANALÍTICA - INSIGHTS AUTOMÁTICOS ==========

// Função para detectar anomalias e padrões
async function detectPatternsAndAnomalies(servidor, unidadeCadastro) {
  const where = {};
  if (servidor) where.servidor = servidor;
  if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
  
  // Buscar dados dos últimos 3 meses para comparação
  const hoje = new Date();
  const tresMesesAtras = new Date(hoje);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  
  // Buscar registros e agrupar por mês manualmente
  // ⚠️ PERFORMANCE: Limitar busca para evitar problemas com grandes volumes
  const registros = await prisma.record.findMany({
    where: {
      ...where,
      dataDaCriacao: { not: null }
    },
    select: {
      dataCriacaoIso: true,
      dataDaCriacao: true,
      data: true
    },
    take: 50000 // Limite razoável para análise de padrões
  });
  
  // Agrupar por mês usando a função getMes
  const porMes = new Map();
  registros.forEach(r => {
    const mes = getMes(r);
    if (mes) {
      porMes.set(mes, (porMes.get(mes) || 0) + 1);
    }
  });
  
  const meses = Array.from(porMes.entries()).sort();
  const anomalias = [];
  
  // Detectar aumentos anormais (mais de 30% de aumento)
  if (meses.length >= 2) {
    const ultimoMes = meses[meses.length - 1];
    const penultimoMes = meses[meses.length - 2];
    // ⚠️ VALIDAÇÃO: Evitar divisão por zero
    const aumento = penultimoMes[1] > 0 
      ? ((ultimoMes[1] - penultimoMes[1]) / penultimoMes[1]) * 100 
      : (ultimoMes[1] > 0 ? 100 : 0);
    
    if (aumento > 30) {
      anomalias.push({
        tipo: 'aumento_anormal',
        mes: ultimoMes[0],
        valor: ultimoMes[1],
        aumento: aumento.toFixed(1),
        mensagem: `Aumento anormal de ${aumento.toFixed(1)}% em ${ultimoMes[0]}`
      });
    }
  }
  
  // Dados por secretaria
  const porSecretaria = await prisma.record.groupBy({
    by: ['orgaos'],
    where: {
      ...where,
      orgaos: { not: null }
    },
    _count: true
  });
  
  // Dados por assunto
  const porAssunto = await prisma.record.groupBy({
    by: ['assunto'],
    where: {
      ...where,
      assunto: { not: null }
    },
    _count: true
  });
  
  // Dados por unidade de cadastro
  const porUnidade = await prisma.record.groupBy({
    by: ['unidadeCadastro'],
    where: {
      ...where,
      unidadeCadastro: { not: null }
    },
    _count: true
  });
  
  return {
    anomalias,
    topSecretarias: porSecretaria
      .sort((a, b) => b._count - a._count)
      .slice(0, 10)
      .map(s => ({ nome: s.orgaos, count: s._count })),
    topAssuntos: porAssunto
      .sort((a, b) => b._count - a._count)
      .slice(0, 10)
      .map(a => ({ nome: a.assunto, count: a._count })),
    topUnidades: porUnidade
      .sort((a, b) => b._count - a._count)
      .slice(0, 10)
      .map(u => ({ nome: u.unidadeCadastro, count: u._count })),
    tendenciaMensal: meses.map(([mes, count]) => ({ mes, count }))
  };
}

// Endpoint para gerar insights com IA
app.get('/api/ai/insights', async (req, res) => {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `aiInsights:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `aiInsights:uac:${unidadeCadastro}:v1` : 
                    'aiInsights:v1';
  
  return withCache(cacheKey, 1800, res, async () => { // Cache de 30 minutos
    try {
      // Detectar padrões e anomalias
      const patterns = await detectPatternsAndAnomalies(servidor, unidadeCadastro);
      
      // Se não houver chave Gemini, retornar insights básicos
      if (GEMINI_API_KEYS.length === 0) {
        const insights = [];
        
        if (patterns.anomalias.length > 0) {
          patterns.anomalias.forEach(a => {
            insights.push({
              tipo: 'anomalia',
              insight: a.mensagem,
              recomendacao: 'Revisar causas do aumento e implementar medidas preventivas.',
              severidade: 'alta'
            });
          });
        }
        
        if (patterns.topSecretarias.length > 0) {
          insights.push({
            tipo: 'volume',
            insight: `Maior volume: ${patterns.topSecretarias[0].nome} com ${patterns.topSecretarias[0].count.toLocaleString('pt-BR')} manifestações.`,
            recomendacao: 'Monitorar de perto e garantir recursos adequados.',
            severidade: 'media'
          });
        }
        
        return { insights, patterns };
      }
      
      // Gerar insights com IA (Gemini)
      const GEMINI_API_KEY = getCurrentGeminiKey();
      
      if (!GEMINI_API_KEY) {
        console.warn('⚠️ Nenhuma chave Gemini disponível para insights');
        // Fallback para insights básicos
        const insights = [];
        if (patterns.anomalias.length > 0) {
          patterns.anomalias.forEach(a => {
            insights.push({
              tipo: 'anomalia',
              insight: a.mensagem,
              recomendacao: 'Revisar causas do aumento e implementar medidas preventivas.',
              severidade: 'alta'
            });
          });
        }
        if (patterns.topSecretarias.length > 0) {
          insights.push({
            tipo: 'volume',
            insight: `Maior volume: ${patterns.topSecretarias[0].nome} com ${patterns.topSecretarias[0].count.toLocaleString('pt-BR')} manifestações.`,
            recomendacao: 'Monitorar de perto e garantir recursos adequados.',
            severidade: 'media'
          });
        }
        return { insights, patterns, geradoPorIA: false };
      }
      
      console.log(`🤖 Gerando insights com Gemini (chave ${currentKeyIndex + 1}/${GEMINI_API_KEYS.length})...`);
      
      const dadosTexto = `
ANÁLISE DE DADOS DA OUVIDORIA DE DUQUE DE CAXIAS

TENDÊNCIA MENSAL:
${patterns.tendenciaMensal.map(t => `- ${t.mes}: ${t.count.toLocaleString('pt-BR')} manifestações`).join('\n')}

TOP 5 SECRETARIAS/ÓRGÃOS:
${patterns.topSecretarias.slice(0, 5).map((s, i) => `${i+1}. ${s.nome}: ${s.count.toLocaleString('pt-BR')} manifestações`).join('\n')}

TOP 5 ASSUNTOS:
${patterns.topAssuntos.slice(0, 5).map((a, i) => `${i+1}. ${a.nome}: ${a.count.toLocaleString('pt-BR')} manifestações`).join('\n')}

TOP 5 UNIDADES DE CADASTRO:
${patterns.topUnidades.slice(0, 5).map((u, i) => `${i+1}. ${u.nome}: ${u.count.toLocaleString('pt-BR')} manifestações`).join('\n')}

${patterns.anomalias.length > 0 ? `\nANOMALIAS DETECTADAS:\n${patterns.anomalias.map(a => `- ${a.mensagem}`).join('\n')}` : ''}
      `.trim();
      
      const systemPrompt = `Você é um analista especializado em dados de ouvidoria municipal. 
Analise os dados fornecidos e gere insights acionáveis em português brasileiro.
Seja objetivo, use números reais e forneça recomendações práticas.`;
      
      const userPrompt = `${dadosTexto}

Gere 3-5 insights principais baseados nestes dados. Para cada insight:
1. Identifique padrões, tendências ou anomalias importantes
2. Explique o que isso significa em linguagem clara
3. Forneça uma recomendação acionável

Formato JSON:
{
  "insights": [
    {
      "tipo": "anomalia|tendencia|volume|tempo",
      "insight": "Descrição clara do que foi detectado (ex: 'A Secretaria de Saúde teve aumento de 32% em manifestações no último mês')",
      "recomendacao": "Ação sugerida (ex: 'Revisar fluxo de triagem e reforçar equipe médica no local')",
      "severidade": "alta|media|baixa"
    }
  ]
}

Retorne APENAS o JSON, sem markdown, sem explicações adicionais.`;
      
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          },
          contents: [
            { role: 'user', parts: [{ text: userPrompt }] }
          ]
        };
        
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!resp.ok) {
          const errorText = await resp.text().catch(() => '');
          console.error(`❌ Gemini API error ${resp.status}:`, errorText);
          throw new Error(`Gemini API error: ${resp.status} - ${errorText.substring(0, 200)}`);
        }
        
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        console.log('✅ Resposta recebida da Gemini para insights');
        
        // Tentar extrair JSON mesmo se vier com markdown
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
        
        let aiInsights;
        try {
          aiInsights = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do JSON da Gemini:', parseError);
          console.error('Texto recebido:', jsonStr.substring(0, 500));
          throw new Error('Resposta da Gemini não é um JSON válido');
        }
        
        console.log(`✅ ${aiInsights.insights?.length || 0} insights gerados pela IA`);
        
        return {
          insights: aiInsights.insights || [],
          patterns,
          geradoPorIA: true
        };
      } catch (geminiError) {
        console.error('❌ Erro ao chamar Gemini para insights:', geminiError);
        rotateToNextKey();
        
        // Fallback para insights básicos
        const insights = [];
        if (patterns.anomalias.length > 0) {
          patterns.anomalias.forEach(a => {
            insights.push({
              tipo: 'anomalia',
              insight: a.mensagem,
              recomendacao: 'Revisar causas do aumento e implementar medidas preventivas.',
              severidade: 'alta'
            });
          });
        }
        return { insights, patterns, geradoPorIA: false };
      }
    } catch (error) {
      console.error('❌ Erro ao gerar insights:', error);
      return { insights: [], patterns: {}, geradoPorIA: false, erro: error.message };
    }
  });
});

app.get('/api/secretarias', async (_req, res) => {
  try {
    const dataPath = path.join(projectRoot, 'data', 'secretarias-distritos.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return res.json({
      secretarias: data.secretarias,
      total: data.secretarias.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar secretarias:', error);
    return res.status(500).json({ error: 'Erro ao buscar secretarias' });
  }
});

app.get('/api/secretarias/:district', async (req, res) => {
  try {
    const { district } = req.params;
    const dataPath = path.join(projectRoot, 'data', 'secretarias-distritos.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const secretarias = data.secretarias.filter(s => 
      s.district.toLowerCase().includes(district.toLowerCase())
    );
    return res.json({ secretarias, total: secretarias.length });
  } catch (error) {
    console.error('❌ Erro ao buscar secretarias por distrito:', error);
    return res.status(500).json({ error: 'Erro ao buscar secretarias' });
  }
});

app.get('/api/distritos', async (_req, res) => {
  try {
    const dataPath = path.join(projectRoot, 'data', 'secretarias-distritos.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return res.json({
      distritos: data.distritos,
      estatisticas: data.estatisticas
    });
  } catch (error) {
    console.error('❌ Erro ao buscar distritos:', error);
    return res.status(500).json({ error: 'Erro ao buscar distritos' });
  }
});

app.get('/api/distritos/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const dataPath = path.join(projectRoot, 'data', 'secretarias-distritos.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const distrito = Object.entries(data.distritos).find(([name, info]) => 
      info.code === code || name.includes(code)
    );
    
    if (!distrito) {
      return res.status(404).json({ error: 'Distrito não encontrado' });
    }
    
    return res.json({
      nome: distrito[0],
      ...distrito[1]
    });
  } catch (error) {
    console.error('❌ Erro ao buscar distrito:', error);
    return res.status(500).json({ error: 'Erro ao buscar distrito' });
  }
});

app.get('/api/bairros', async (req, res) => {
  try {
    const { distrito } = req.query;
    const dataPath = path.join(projectRoot, 'data', 'secretarias-distritos.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    if (distrito) {
      const distritoInfo = data.distritos[distrito];
      if (!distritoInfo) {
        return res.status(404).json({ error: 'Distrito não encontrado' });
      }
      return res.json({ bairros: distritoInfo.bairros, total: distritoInfo.bairros.length });
    }
    
    // Retornar todos os bairros agrupados por distrito
    const bairrosPorDistrito = {};
    Object.entries(data.distritos).forEach(([nome, info]) => {
      bairrosPorDistrito[nome] = info.bairros;
    });
    
    return res.json({ bairrosPorDistrito });
  } catch (error) {
    console.error('❌ Erro ao buscar bairros:', error);
    return res.status(500).json({ error: 'Erro ao buscar bairros' });
  }
});

// Endpoint de debug para testar mapeamento de endereços
app.get('/api/debug/district-mapping', async (req, res) => {
  try {
    const { endereco } = req.query;
    if (!endereco) {
      return res.status(400).json({ error: 'Parâmetro "endereco" é obrigatório' });
    }
    
    const resultado = detectDistrictByAddress(endereco);
    const stats = getMappingStats();
    
    return res.json({
      endereco: endereco,
      resultado: resultado,
      estatisticas: stats
    });
  } catch (error) {
    console.error('❌ Erro ao testar mapeamento:', error);
    return res.status(500).json({ error: 'Erro ao testar mapeamento' });
  }
});

// Endpoint para testar mapeamento em lote
app.post('/api/debug/district-mapping-batch', async (req, res) => {
  try {
    const { enderecos } = req.body;
    if (!Array.isArray(enderecos)) {
      return res.status(400).json({ error: 'Body deve conter array "enderecos"' });
    }
    
    const resultado = mapAddressesToDistricts(enderecos);
    
    return res.json(resultado);
  } catch (error) {
    console.error('❌ Erro ao testar mapeamento em lote:', error);
    return res.status(500).json({ error: 'Erro ao testar mapeamento' });
  }
});

// Endpoint para agregar manifestações por distrito
app.get('/api/aggregate/by-district', async (req, res) => {
  return withCache('aggregate-by-district', 300, res, async () => {
    try {
      const dataPath = path.join(projectRoot, 'data', 'secretarias-distritos.json');
      // ⚠️ VALIDAÇÃO: Adicionar tratamento de erro para JSON corrompido
      let distritosData;
      try {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        distritosData = JSON.parse(fileContent);
      } catch (parseError) {
        console.error('❌ Erro ao parsear secretarias-distritos.json:', parseError.message);
        return res.status(500).json({ error: 'Erro ao carregar dados de distritos' });
      }
      
      // Buscar todos os registros (vamos filtrar depois para ter mais flexibilidade)
      const records = await safePrismaQuery(async () => {
        // ⚠️ PERFORMANCE: Limitar busca para evitar problemas com grandes volumes
        const allRecords = await prisma.record.findMany({
          select: {
            endereco: true,
            data: true,
            statusDemanda: true,
            tipoDeManifestacao: true,
            dataCriacaoIso: true
          },
          take: 100000 // Limite para mapeamento de distritos
        });
        
        // Filtrar apenas registros que têm algum endereço/bairro
        return allRecords.filter(record => {
          const dat = record.data || {};
          const endereco = record.endereco || 
                          dat.endereco || 
                          dat.Bairro || 
                          dat.bairro ||
                          dat.endereco_completo ||
                          dat.endereço ||
                          dat.Endereço ||
                          '';
          return endereco && endereco.trim() !== '';
        });
      });
      
      console.log(`📊 Total de registros com endereço encontrados: ${records.length}`);
      
      // Agrupar por distrito
      const distritosMap = {};
      Object.keys(distritosData.distritos).forEach(distrito => {
        distritosMap[distrito] = {
          nome: distrito,
          code: distritosData.distritos[distrito].code,
          count: 0,
          porStatus: {},
          porTipo: {},
          porMes: {}
        };
      });
      
      // Processar cada registro usando a biblioteca de mapeamento
      let mapeados = 0;
      let naoMapeados = 0;
      
      records.forEach(record => {
        const dat = record.data || {};
        const bairro = record.endereco || 
                      dat.endereco || 
                      dat.Bairro || 
                      dat.bairro ||
                      dat.endereco_completo ||
                      dat.endereço ||
                      dat.Endereço ||
                      '';
        
        if (!bairro || bairro.trim() === '') {
          naoMapeados++;
          return;
        }
        
        // Usar biblioteca de mapeamento robusta
        const resultado = detectDistrictByAddress(bairro);
        const distrito = resultado?.distrito;
        
        if (!distrito || !distritosMap[distrito]) {
          naoMapeados++;
          // Log para debug (apenas primeiros 10 não mapeados)
          if (naoMapeados <= 10) {
            console.log(`⚠️ Não mapeado: "${bairro}"`);
          }
          return;
        }
        
        mapeados++;
        distritosMap[distrito].count++;
        
        // Agrupar por status
        const status = record.statusDemanda || record.data?.status_demanda || record.data?.Status || 'Não informado';
        distritosMap[distrito].porStatus[status] = (distritosMap[distrito].porStatus[status] || 0) + 1;
        
        // Agrupar por tipo
        const tipo = record.tipoDeManifestacao || record.data?.tipo_de_manifestacao || record.data?.Tipo || 'Não informado';
        distritosMap[distrito].porTipo[tipo] = (distritosMap[distrito].porTipo[tipo] || 0) + 1;
        
        // Agrupar por mês
        const dataIso = record.dataCriacaoIso || record.data?.dataCriacaoIso;
        if (dataIso) {
          const mes = dataIso.substring(0, 7); // YYYY-MM
          distritosMap[distrito].porMes[mes] = (distritosMap[distrito].porMes[mes] || 0) + 1;
        }
      });
      
      console.log(`📊 Mapeamento: ${mapeados} mapeados, ${naoMapeados} não mapeados (${((mapeados / records.length) * 100).toFixed(1)}% de sucesso)`);
      
      // Converter para array
      const resultado = Object.values(distritosMap).map(d => ({
        distrito: d.nome,
        code: d.code,
        total: d.count,
        porStatus: d.porStatus,
        porTipo: d.porTipo,
        porMes: d.porMes
      }));
      
      return resultado;
    } catch (error) {
      console.error('❌ Erro ao agregar por distrito:', error);
      throw error;
    }
  });
});

// Endpoint para estatísticas detalhadas de um distrito específico
app.get('/api/distritos/:code/stats', async (req, res) => {
  try {
    const { code } = req.params;
    const dataPath = path.join(projectRoot, 'data', 'secretarias-distritos.json');
    const distritosData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Encontrar o distrito
    const distrito = Object.entries(distritosData.distritos).find(([name, info]) => 
      info.code === code || name.includes(code)
    );
    
    if (!distrito) {
      return res.status(404).json({ error: 'Distrito não encontrado' });
    }
    
    const [nome, info] = distrito;
    const bairros = info.bairros;
    
    // Buscar manifestações dos bairros deste distrito
    // MongoDB não suporta mode: 'insensitive' diretamente, vamos buscar todos e filtrar
    const records = await safePrismaQuery(async () => {
      const allRecords = await prisma.record.findMany({
        where: {
          OR: [
            { endereco: { not: null } },
            { data: { path: ['endereco'], not: null } },
            { data: { path: ['Bairro'], not: null } }
          ]
        }
      });
      
      // Filtrar por bairros do distrito usando biblioteca de mapeamento
      return allRecords.filter(record => {
        const endereco = record.endereco || 
                        record.data?.endereco || 
                        record.data?.Bairro || 
                        record.data?.bairro ||
                        record.data?.endereco_completo ||
                        '';
        
        if (!endereco) return false;
        
        const resultado = detectDistrictByAddress(endereco);
        return resultado && resultado.distrito === nome;
      });
    });
    
    // Calcular estatísticas
    const stats = {
      distrito: nome,
      code: info.code,
      totalManifestacoes: records.length,
      porStatus: {},
      porTipo: {},
      porTema: {},
      porMes: {},
      topBairros: {}
    };
    
    records.forEach(record => {
      const dat = record.data || {};
      
      // Status
      const status = record.statusDemanda || dat.status_demanda || dat.Status || 'Não informado';
      stats.porStatus[status] = (stats.porStatus[status] || 0) + 1;
      
      // Tipo
      const tipo = record.tipoDeManifestacao || dat.tipo_de_manifestacao || dat.Tipo || 'Não informado';
      stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
      
      // Tema
      const tema = record.tema || dat.tema || dat.Tema || 'Não informado';
      stats.porTema[tema] = (stats.porTema[tema] || 0) + 1;
      
      // Mês
      const dataIso = record.dataCriacaoIso || dat.dataCriacaoIso;
      if (dataIso) {
        const mes = dataIso.substring(0, 7);
        stats.porMes[mes] = (stats.porMes[mes] || 0) + 1;
      }
      
      // Bairro
      const bairro = record.endereco || dat.endereco || dat.Bairro || 'Não informado';
      stats.topBairros[bairro] = (stats.topBairros[bairro] || 0) + 1;
    });
    
    // Ordenar top bairros
    stats.topBairros = Object.entries(stats.topBairros)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    
    return res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas do distrito:', error);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

app.get('/api/meta/aliases', (_req, res) => {
  res.json({
    aliases: {
      Secretaria: ['Secretaria', 'Órgão', 'Orgao', 'Secretaria/Órgão'],
      Setor: ['Setor', 'Departamento', 'Unidade'],
      Tipo: ['Tipo', 'Tipo Manifestação', 'TipoManifestacao'],
      Categoria: ['Categoria', 'Assunto', 'Tema'],
      Bairro: ['Bairro', 'Localidade'],
      Status: ['Status', 'Situação', 'Situacao'],
      Data: ['Data', 'Data Abertura', 'DataAbertura', 'Abertura'],
      UAC: ['UAC', 'Unidade de Atendimento', 'Unidade de Atendimento ao Cidadão', 'unidade_cadastro', 'Unidade Cadastro', 'unidadeCadastro'],
      Responsavel: ['Responsável', 'responsavel', 'Ouvidoria Responsável', 'Responsável pelo Tratamento', 'Ouvidoria'],
      Canal: ['Canal', 'canal', 'Canal de Entrada', 'Canal de Atendimento'],
      Prioridade: ['Prioridade', 'prioridade', 'Prioridade da Demanda']
    }
  });
});

// Reindexar contexto (protegível futuramente)
app.post('/api/chat/reindex', async (_req, res) => {
  try {
    const ctx = await reindexContext();
    res.json({ ok: true, indexed: ctx.chunks.length, lastIndexedAt: ctx.lastIndexedAt });
  } catch (e) {
    console.error('Reindex error', e);
    res.status(500).json({ ok: false });
  }
});

// Endpoint para exportar dados do banco para JSON
app.get('/api/export/database', async (_req, res) => {
  try {
    const dados = await exportDatabaseData();
    if (dados) {
      res.json({ 
        ok: true, 
        message: 'Dados exportados com sucesso', 
        path: path.join(DB_DATA_DIR, 'dados-agregados.json'),
        total: dados.total,
        exportadoEm: dados.exportadoEm
      });
    } else {
      res.status(500).json({ ok: false, error: 'Erro ao exportar dados' });
    }
  } catch (e) {
    console.error('Erro ao exportar dados:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ========== CORA CHAT - Endpoints ==========
// Buscar mensagens do chat
app.get('/api/chat/messages', async (_req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 500 // Aumentar limite para 500 mensagens
    });
    
    console.log(`📥 Buscando mensagens do chat: ${messages.length} encontradas`);
    
    res.json({
      messages: messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        createdAt: msg.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Mapeamento completo de palavras-chave para campos do banco de dados
const KEYWORD_MAP = {
  // Órgãos/Secretarias
  orgaos: {
    keywords: ['secretaria', 'órgão', 'orgao', 'orgaos', 'secretarias', 'departamento', 'departamentos'],
    field: 'orgaos',
    label: 'Secretarias/Órgãos'
  },
  // Unidades
  unidades: {
    keywords: ['unidade', 'unidades', 'uac', 'setor', 'setores', 'local', 'locais'],
    field: 'unidadeCadastro',
    label: 'Unidades de Cadastro'
  },
  // Unidades de Saúde
  unidadesSaude: {
    keywords: ['unidade de saúde', 'unidade saude', 'unidades de saúde', 'unidades saude'],
    field: 'unidadeSaude',
    label: 'Unidades de Saúde'
  },
  // Temas
  temas: {
    keywords: ['tema', 'temas', 'categoria', 'categorias', 'área', 'area', 'áreas', 'areas'],
    field: 'tema',
    label: 'Temas'
  },
  // Assuntos
  assuntos: {
    keywords: ['assunto', 'assuntos', 'motivo', 'motivos', 'razão', 'razao', 'razões', 'razoes'],
    field: 'assunto',
    label: 'Assuntos'
  },
  // Canais
  canais: {
    keywords: ['canal', 'canais', 'entrada', 'entradas', 'meio', 'formato', 'como chegou'],
    field: 'canal',
    label: 'Canais de Entrada'
  },
  // Status
  status: {
    keywords: ['status', 'situação', 'situacao', 'situações', 'situacoes', 'estado', 'estados', 'encerrada', 'encerradas', 'ativa', 'ativas', 'aberta', 'abertas', 'concluída', 'concluida', 'concluídas', 'concluidas'],
    field: 'status',
    label: 'Status'
  },
  statusDemanda: {
    keywords: ['status demanda', 'status_demanda', 'demanda', 'demandas'],
    field: 'statusDemanda',
    label: 'Status da Demanda'
  },
  // Prioridades
  prioridades: {
    keywords: ['prioridade', 'prioridades', 'urgência', 'urgencia', 'urgências', 'urgencias', 'importância', 'importancia'],
    field: 'prioridade',
    label: 'Prioridades'
  },
  // Tipos de Manifestação
  tiposManifestacao: {
    keywords: ['tipo', 'tipos', 'manifestação', 'manifestacao', 'manifestações', 'manifestacoes', 'reclamação', 'reclamacao', 'reclamações', 'reclamacoes', 'denúncia', 'denuncia', 'denúncias', 'denuncias', 'elogio', 'elogios', 'sugestão', 'sugestao', 'sugestões', 'sugestoes'],
    field: 'tipoDeManifestacao',
    label: 'Tipos de Manifestação'
  },
  // Responsáveis
  responsaveis: {
    keywords: ['responsável', 'responsavel', 'responsáveis', 'responsaveis', 'ouvidoria', 'ouvidorias', 'tratamento', 'atendente', 'atendentes'],
    field: 'responsavel',
    label: 'Responsáveis'
  },
  // Servidores
  servidores: {
    keywords: ['servidor', 'servidores', 'cadastrante', 'cadastrantes', 'funcionário', 'funcionario', 'funcionários', 'funcionarios', 'operador', 'operadores'],
    field: 'servidor',
    label: 'Servidores/Cadastrantes'
  },
  // Endereços/Bairros
  enderecos: {
    keywords: ['endereço', 'endereco', 'endereços', 'enderecos', 'bairro', 'bairros', 'rua', 'ruas', 'localização', 'localizacao', 'localizações', 'localizacoes', 'reclamação', 'reclamacao', 'reclamações', 'reclamacoes'],
    field: 'endereco',
    label: 'Endereços/Bairros'
  },
  // Datas
  datas: {
    keywords: ['data', 'datas', 'criação', 'criacao', 'criado', 'período', 'periodo', 'períodos', 'periodos', 'mês', 'mes', 'mês', 'meses', 'ano', 'anos', 'dia', 'dias'],
    field: 'dataCriacaoIso',
    label: 'Datas de Criação'
  },
  // Tempo de Resolução
  tempoResolucao: {
    keywords: ['tempo', 'tempos', 'prazo', 'prazos', 'resolução', 'resolucao', 'resoluções', 'resolucoes', 'dias', 'duração', 'duracao', 'durar', 'demora', 'demoras', 'rápido', 'rapido', 'lento', 'lentos'],
    field: 'tempoDeResolucaoEmDias',
    label: 'Tempo de Resolução'
  },
  // Protocolos
  protocolos: {
    keywords: ['protocolo', 'protocolos', 'número', 'numero', 'números', 'numeros', 'id', 'código', 'codigo', 'códigos', 'codigos'],
    field: 'protocolo',
    label: 'Protocolos'
  },
  // Verificado
  verificado: {
    keywords: ['verificado', 'verificados', 'verificação', 'verificacao', 'verificações', 'verificacoes', 'checado', 'checados'],
    field: 'verificado',
    label: 'Verificado'
  }
};

// Unidades específicas
const UNIDADES_ESPECIFICAS = {
  upas: {
    keywords: ['upa', 'upas', 'unidade de pronto atendimento', 'unidades de pronto atendimento'],
    filter: (nome) => nome && nome.toLowerCase().includes('upa') && !nome.toLowerCase().includes('uph')
  },
  uphs: {
    keywords: ['uph', 'uphs', 'unidade de pronto atendimento', 'unidades de pronto atendimento'],
    filter: (nome) => nome && nome.toLowerCase().includes('uph')
  },
  hospitais: {
    keywords: ['hospital', 'hospitais', 'maternidade', 'maternidades'],
    filter: (nome) => nome && (nome.toLowerCase().includes('hospital') || nome.toLowerCase().includes('maternidade'))
  },
  ubs: {
    keywords: ['ubs', 'unidade básica', 'unidade basica', 'unidades básicas', 'unidades basicas'],
    filter: (nome) => nome && nome.toLowerCase().includes('ubs')
  }
};

// Função para extrair número de protocolo da pergunta
function extractProtocolNumber(text) {
  // Buscar padrões como "C378066615921629625", "00719.2025.000011-41", "protocolo C378066615921629625", etc.
  const patterns = [
    // Padrão 1: "protocolo 00719.2025.000011-41" ou "protocolo: 00719.2025.000011-41"
    /(?:protocolo|numero|número|código|codigo|id|o que tem|dados|informações)\s*[:\-]?\s*([a-z0-9.\-]+)/i,
    // Padrão 2: "00719.2025.000011-41" (formato com pontos e hífen)
    /\b(\d{5}\.\d{4}\.\d{6}-\d{2})\b/,
    // Padrão 3: "C378066615921629625" (letra seguida de muitos dígitos)
    /\b([a-z]\d{15,})\b/i,
    // Padrão 4: Apenas números longos (15+ dígitos)
    /\b(\d{15,})\b/,
    // Padrão 5: Qualquer sequência alfanumérica longa que pareça protocolo
    /\b([a-z]?\d{10,})\b/i,
    // Padrão 6: Formato com pontos e hífen sem prefixo
    /\b(\d+\.\d+\.\d+-\d+)\b/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let protocolo = match[1];
      
      // Se for formato com pontos e hífen (ex: 00719.2025.000011-41), retornar como está
      if (protocolo.includes('.') && protocolo.includes('-')) {
        return protocolo;
      }
      
      // Se começar com letra, extrair só os números
      const protocoloSemLetra = protocolo.replace(/^[a-z]+/i, '');
      
      // Retornar o número sem a letra para busca (mas tentar ambos)
      if (protocoloSemLetra && /\d/.test(protocoloSemLetra) && protocoloSemLetra.length >= 10) {
        return protocoloSemLetra;
      }
      // Se não conseguiu remover letra mas tem números, retornar completo
      if (/\d/.test(protocolo) && protocolo.length >= 10) {
        return protocolo;
      }
    }
  }
  
  return null;
}

// Função para buscar dados relevantes do banco baseado na pergunta
async function fetchRelevantData(userText) {
  const text = userText.toLowerCase();
  const dados = {
    estatisticasGerais: null,
    topOrgaos: null,
    topSetores: null,
    topTemas: null,
    topBairros: null,
    topAssuntos: null,
    topCanais: null,
    topStatus: null,
    topStatusDemanda: null,
    topPrioridades: null,
    topTiposManifestacao: null,
    topResponsaveis: null,
    topServidores: null,
    topEnderecos: null,
    tempoMedio: null,
    unidadesUPAs: null,
    unidadesUPHs: null,
    unidadesHospitais: null,
    unidadesUBS: null,
    todasUnidades: null,
    todasUnidadesSaude: null,
    estatisticasProtocolos: null,
    protocoloEspecifico: null,
    protocolosSimilares: null,
    protocoloNaoEncontrado: null
  };
  
  try {
    // Verificar se a pergunta é sobre um protocolo específico
    const protocoloNumero = extractProtocolNumber(userText);
    if (protocoloNumero) {
      console.log(`🔍 Buscando protocolo específico: ${protocoloNumero}`);
      
      // Buscar protocolo exato (com e sem "C", e também no campo data JSON)
      const protocoloComC = `C${protocoloNumero}`;
      
      // Primeiro, buscar no campo normalizado protocolo
      let protocoloExato = await prisma.record.findFirst({
        where: {
          OR: [
            { protocolo: protocoloNumero },
            { protocolo: protocoloComC }
          ]
        },
        select: {
          protocolo: true,
          dataDaCriacao: true,
          statusDemanda: true,
          prazoRestante: true,
          dataDaConclusao: true,
          tempoDeResolucaoEmDias: true,
          prioridade: true,
          tipoDeManifestacao: true,
          tema: true,
          assunto: true,
          canal: true,
          endereco: true,
          unidadeCadastro: true,
          unidadeSaude: true,
          status: true,
          servidor: true,
          responsavel: true,
          verificado: true,
          orgaos: true,
          data: true
        }
      });
      
      // Se não encontrou no campo normalizado, buscar no JSON data
      if (!protocoloExato) {
        console.log(`🔍 Buscando protocolo no campo data (JSON)...`);
        // Buscar todos os registros e filtrar em memória (MongoDB não suporta busca direta em JSON)
        const todosRegistros = await prisma.record.findMany({
          select: {
            protocolo: true,
            dataDaCriacao: true,
            statusDemanda: true,
            prazoRestante: true,
            dataDaConclusao: true,
            tempoDeResolucaoEmDias: true,
            prioridade: true,
            tipoDeManifestacao: true,
            tema: true,
            assunto: true,
            canal: true,
            endereco: true,
            unidadeCadastro: true,
            unidadeSaude: true,
            status: true,
            servidor: true,
            responsavel: true,
            verificado: true,
            orgaos: true,
            data: true
          },
          take: 50000 // Limitar para performance
        });
        
        // Filtrar registros onde o protocolo está no JSON data
        protocoloExato = todosRegistros.find(r => {
          if (r.data && typeof r.data === 'object') {
            const dataObj = r.data;
            // Verificar se protocolo está no data
            const protocoloNoData = dataObj.protocolo || dataObj.Protocolo || dataObj.PROTOCOLO;
            if (protocoloNoData) {
              const protocoloStr = String(protocoloNoData);
              return protocoloStr === protocoloNumero || 
                     protocoloStr === protocoloComC ||
                     protocoloStr.includes(protocoloNumero) ||
                     protocoloStr.replace(/^[a-z]+/i, '') === protocoloNumero;
            }
          }
          return false;
        });
      }
      
      let protocoloEncontrado = protocoloExato;
      
      // Se ainda não encontrou, tentar busca parcial (tanto no campo protocolo quanto no data JSON)
      if (!protocoloEncontrado) {
        console.log(`🔍 Buscando protocolo parcialmente...`);
        // Buscar todos os registros e filtrar em memória
        const todosRegistros = await prisma.record.findMany({
          select: {
            protocolo: true,
            dataDaCriacao: true,
            statusDemanda: true,
            prazoRestante: true,
            dataDaConclusao: true,
            tempoDeResolucaoEmDias: true,
            prioridade: true,
            tipoDeManifestacao: true,
            tema: true,
            assunto: true,
            canal: true,
            endereco: true,
            unidadeCadastro: true,
            unidadeSaude: true,
            status: true,
            servidor: true,
            responsavel: true,
            verificado: true,
            orgaos: true,
            data: true
          },
          take: 50000 // Limitar para performance
        });
        
        // Filtrar protocolos que contêm o número buscado (tanto no campo protocolo quanto no data)
        const protocolosSimilares = todosRegistros.filter(r => {
          // Verificar no campo protocolo normalizado
          if (r.protocolo) {
            const protocoloStr = String(r.protocolo);
            if (protocoloStr.includes(protocoloNumero) || 
                protocoloStr.replace(/^[a-z]+/i, '').includes(protocoloNumero)) {
              return true;
            }
          }
          
          // Verificar no campo data JSON
          if (r.data && typeof r.data === 'object') {
            const dataObj = r.data;
            const protocoloNoData = dataObj.protocolo || dataObj.Protocolo || dataObj.PROTOCOLO;
            if (protocoloNoData) {
              const protocoloStr = String(protocoloNoData);
              if (protocoloStr.includes(protocoloNumero) || 
                  protocoloStr.replace(/^[a-z]+/i, '').includes(protocoloNumero)) {
                return true;
              }
            }
          }
          
          return false;
        });
        
        if (protocolosSimilares.length > 0) {
          protocoloEncontrado = protocolosSimilares[0]; // Pegar o primeiro resultado
          if (protocolosSimilares.length > 1) {
            dados.protocolosSimilares = protocolosSimilares.slice(1, 6); // Limitar a 5 similares
          }
        }
      }
      
      if (protocoloEncontrado) {
        dados.protocoloEspecifico = protocoloEncontrado;
        console.log(`✅ Protocolo encontrado: ${protocoloEncontrado.protocolo}`);
      } else {
        console.log(`⚠️ Protocolo não encontrado: ${protocoloNumero}`);
        dados.protocoloNaoEncontrado = protocoloNumero;
      }
    }
    
    // Sempre buscar estatísticas gerais
    const total = await prisma.record.count();
    const porStatus = await prisma.record.groupBy({
      by: ['status'],
      _count: { _all: true }
    });
    
    dados.estatisticasGerais = {
      total,
      porStatus: porStatus
        .map(s => ({ status: s.status || 'Não informado', count: s._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
    
    // Detectar quais campos buscar baseado em palavras-chave
    const camposParaBuscar = {};
    for (const [key, config] of Object.entries(KEYWORD_MAP)) {
      const matches = config.keywords.some(kw => text.includes(kw));
      if (matches) {
        camposParaBuscar[key] = config;
      }
    }
    
    // Detectar perguntas genéricas (mais, maior, volume, quantidade, etc.)
    const perguntaGenerica = text.includes('mais') || text.includes('maior') || text.includes('volume') || 
                            text.includes('quantidade') || text.includes('quantas') || text.includes('quantos') ||
                            text.includes('quais') || text.includes('listar') || text.includes('mostrar') ||
                            text.includes('top') || text.includes('principais') || text.includes('maiores');
    
    // Se for pergunta genérica, buscar os principais campos
    if (perguntaGenerica && Object.keys(camposParaBuscar).length === 0) {
      camposParaBuscar.orgaos = KEYWORD_MAP.orgaos;
      camposParaBuscar.unidades = KEYWORD_MAP.unidades;
      camposParaBuscar.temas = KEYWORD_MAP.temas;
      camposParaBuscar.assuntos = KEYWORD_MAP.assuntos;
      camposParaBuscar.tiposManifestacao = KEYWORD_MAP.tiposManifestacao;
    }
    
    // Buscar unidades específicas
    const buscaUPAs = UNIDADES_ESPECIFICAS.upas.keywords.some(kw => text.includes(kw));
    const buscaUPHs = UNIDADES_ESPECIFICAS.uphs.keywords.some(kw => text.includes(kw));
    const buscaHospitais = UNIDADES_ESPECIFICAS.hospitais.keywords.some(kw => text.includes(kw));
    const buscaUBS = UNIDADES_ESPECIFICAS.ubs.keywords.some(kw => text.includes(kw));
    const buscaUnidades = buscaUPAs || buscaUPHs || buscaHospitais || buscaUBS || 
                         text.includes('unidade') || text.includes('unidades') ||
                         (text.includes('quais') && (text.includes('unidade') || text.includes('temos') || text.includes('tem')));
    
    // Buscar em paralelo
    const promises = [];
    
    // Buscar cada campo detectado
    if (camposParaBuscar.orgaos) {
      promises.push(
        prisma.record.groupBy({
          by: ['orgaos'],
          _count: { _all: true }
        }).then(r => { 
          dados.topOrgaos = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.unidades) {
      promises.push(
        prisma.record.groupBy({
          by: ['unidadeCadastro'],
          _count: { _all: true }
        }).then(r => { 
          dados.topSetores = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20)
            .map(s => ({ setor: s.unidadeCadastro, _count: { _all: s._count._all } }));
        })
      );
    }
    
    if (camposParaBuscar.unidadesSaude) {
      promises.push(
        prisma.record.groupBy({
          by: ['unidadeSaude'],
          _count: { _all: true }
        }).then(r => { 
          dados.todasUnidadesSaude = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.temas) {
      promises.push(
        prisma.record.groupBy({
          by: ['tema'],
          _count: { _all: true }
        }).then(r => { 
          dados.topTemas = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.assuntos) {
      promises.push(
        prisma.record.groupBy({
          by: ['assunto'],
          _count: { _all: true }
        }).then(r => { 
          dados.topAssuntos = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.canais) {
      promises.push(
        prisma.record.groupBy({
          by: ['canal'],
          _count: { _all: true }
        }).then(r => { 
          dados.topCanais = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.status) {
      promises.push(
        prisma.record.groupBy({
          by: ['status'],
          _count: { _all: true }
        }).then(r => { 
          dados.topStatus = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.statusDemanda) {
      promises.push(
        prisma.record.groupBy({
          by: ['statusDemanda'],
          _count: { _all: true }
        }).then(r => { 
          dados.topStatusDemanda = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.prioridades) {
      promises.push(
        prisma.record.groupBy({
          by: ['prioridade'],
          _count: { _all: true }
        }).then(r => { 
          dados.topPrioridades = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.tiposManifestacao) {
      promises.push(
        prisma.record.groupBy({
          by: ['tipoDeManifestacao'],
          _count: { _all: true }
        }).then(r => { 
          dados.topTiposManifestacao = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.responsaveis) {
      promises.push(
        prisma.record.groupBy({
          by: ['responsavel'],
          _count: { _all: true }
        }).then(r => { 
          dados.topResponsaveis = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.servidores) {
      promises.push(
        prisma.record.groupBy({
          by: ['servidor'],
          _count: { _all: true }
        }).then(r => { 
          dados.topServidores = r
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 20);
        })
      );
    }
    
    if (camposParaBuscar.protocolos) {
      // Para protocolos, buscar estatísticas gerais (total, únicos, etc.)
      promises.push(
        Promise.all([
          prisma.record.count({ where: { protocolo: { not: null } } }),
          prisma.record.groupBy({
            by: ['protocolo'],
            _count: { _all: true }
          })
        ]).then(([totalComProtocolo, protocolosAgrupados]) => {
          dados.estatisticasProtocolos = {
            totalComProtocolo,
            protocolosUnicos: protocolosAgrupados.length,
            topProtocolos: protocolosAgrupados
              .filter(p => p.protocolo && p.protocolo.trim())
              .sort((a, b) => b._count._all - a._count._all)
              .slice(0, 20)
              .map(p => ({ protocolo: p.protocolo, count: p._count._all }))
          };
        })
      );
    }
    
    if (camposParaBuscar.enderecos) {
      promises.push(
        prisma.record.groupBy({
          by: ['endereco'],
          _count: { _all: true }
        }).then(r => { 
          // Filtrar endereços vazios e ordenar
          dados.topEnderecos = r
            .filter(e => e.endereco && e.endereco.trim() && e.endereco.trim().toLowerCase() !== 'não informado')
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 50); // Aumentar para 50 para ter mais opções
          
          // Tentar extrair bairros dos endereços (se o formato permitir)
          // Exemplo: "Rua X, Bairro Y" ou "Bairro Y" ou similar
          const bairrosExtraidos = {};
          dados.topEnderecos.forEach(e => {
            const endereco = e.endereco.toLowerCase();
            let bairroEncontrado = null;
            
            // Padrão 1: "Bairro X" ou "Bairro X, ..."
            const matchBairro = endereco.match(/bairro\s+([^,\-]+)/i);
            if (matchBairro) {
              bairroEncontrado = matchBairro[1].trim();
            }
            
            // Padrão 2: Última parte após vírgula ou hífen (pode ser o bairro)
            if (!bairroEncontrado) {
              const partes = endereco.split(/[,\-]/);
              if (partes.length > 1) {
                const ultimaParte = partes[partes.length - 1].trim();
                // Se a última parte não contém números e tem mais de 3 caracteres, pode ser bairro
                if (ultimaParte.length > 3 && !/\d/.test(ultimaParte) && !ultimaParte.includes('rua') && !ultimaParte.includes('avenida') && !ultimaParte.includes('av.')) {
                  bairroEncontrado = ultimaParte;
                }
              }
            }
            
            // Padrão 3: Se o endereço inteiro parece ser um bairro (sem rua, avenida, etc.)
            if (!bairroEncontrado && endereco.length < 50 && !endereco.includes('rua') && !endereco.includes('avenida') && !endereco.includes('av.') && !endereco.includes('estrada') && !/\d/.test(endereco)) {
              bairroEncontrado = endereco.trim();
            }
            
            if (bairroEncontrado && bairroEncontrado.length > 2) {
              // Capitalizar primeira letra de cada palavra
              const bairroFormatado = bairroEncontrado.split(' ').map(p => 
                p.charAt(0).toUpperCase() + p.slice(1)
              ).join(' ');
              
              if (!bairrosExtraidos[bairroFormatado]) {
                bairrosExtraidos[bairroFormatado] = 0;
              }
              bairrosExtraidos[bairroFormatado] += e._count._all;
            }
          });
          
          // Se encontrou bairros, adicionar aos dados
          if (Object.keys(bairrosExtraidos).length > 0) {
            dados.topBairros = Object.entries(bairrosExtraidos)
              .map(([bairro, count]) => ({ bairro, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 20);
          }
        })
      );
    }
    
    if (camposParaBuscar.tempoResolucao) {
      // Calcular tempo médio manualmente (MongoDB não suporta _avg em aggregate)
      promises.push(
        prisma.record.findMany({
          select: { tempoDeResolucaoEmDias: true },
          take: 10000 // Limitar para performance
        }).then(records => {
          const tempos = records
            .map(r => r.tempoDeResolucaoEmDias)
            .filter(t => t && !isNaN(parseFloat(t)))
            .map(t => parseFloat(t));
          
          if (tempos.length > 0) {
            dados.tempoMedio = {
              media: tempos.reduce((a, b) => a + b, 0) / tempos.length,
              minimo: Math.min(...tempos),
              maximo: Math.max(...tempos)
            };
          }
        })
      );
    }
    
    // Buscar unidades específicas se mencionar UPA, UPH, Hospital
    if (buscaUnidades) {
      // Buscar todas as unidades primeiro
      promises.push(
        prisma.record.groupBy({
          by: ['unidadeCadastro'],
          _count: { _all: true }
        }).then(r => {
          const todas = r
            .sort((a, b) => b._count._all - a._count._all)
            .map(u => ({ unidade: u.unidadeCadastro || 'Não informado', count: u._count._all }));
          
          dados.todasUnidades = todas;
          
          // Filtrar UPAs
          if (buscaUPAs) {
            dados.unidadesUPAs = todas.filter(u => UNIDADES_ESPECIFICAS.upas.filter(u.unidade));
            console.log(`🔍 UPAs encontradas: ${dados.unidadesUPAs.length}`);
            dados.unidadesUPAs.forEach((u, i) => {
              console.log(`   ${i+1}. ${u.unidade}: ${u.count} manifestações`);
            });
          }
          
          // Filtrar UPHs
          if (buscaUPHs) {
            dados.unidadesUPHs = todas.filter(u => UNIDADES_ESPECIFICAS.uphs.filter(u.unidade));
          }
          
          // Filtrar Hospitais
          if (buscaHospitais) {
            dados.unidadesHospitais = todas.filter(u => UNIDADES_ESPECIFICAS.hospitais.filter(u.unidade));
          }
          
          // Filtrar UBS
          if (buscaUBS) {
            dados.unidadesUBS = todas.filter(u => UNIDADES_ESPECIFICAS.ubs.filter(u.unidade));
          }
        })
      );
    }
    
    await Promise.all(promises);
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados relevantes:', error);
  }
  
  return dados;
}

// Função para formatar dados em texto legível para a Gemini
function formatDataForGemini(dados, userText = '') {
  const parts = [];
  const buscaUPAs = userText.toLowerCase().includes('upa') || userText.toLowerCase().includes('upas');
  
  if (dados.estatisticasGerais) {
    parts.push(`📊 ESTATÍSTICAS GERAIS:`);
    parts.push(`Total de manifestações: ${dados.estatisticasGerais.total.toLocaleString('pt-BR')}`);
    if (dados.estatisticasGerais.porStatus.length > 0) {
      parts.push(`\nStatus mais comuns:`);
      dados.estatisticasGerais.porStatus.forEach((s, i) => {
        parts.push(`${i+1}. ${s.status}: ${s.count.toLocaleString('pt-BR')} manifestações`);
      });
    }
  }
  
  if (dados.topOrgaos && dados.topOrgaos.length > 0) {
    parts.push(`\n🏛️ TOP ${dados.topOrgaos.length} SECRETARIAS/ÓRGÃOS POR VOLUME:`);
    dados.topOrgaos.forEach((o, i) => {
      parts.push(`${i+1}. **${o.orgaos || 'Não informado'}**: ${o._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalOrgaos = dados.topOrgaos.reduce((sum, o) => sum + o._count._all, 0);
    parts.push(`\n**Total**: ${totalOrgaos.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topSetores && dados.topSetores.length > 0) {
    parts.push(`\n📁 TOP ${dados.topSetores.length} SETORES/UNIDADES POR VOLUME:`);
    dados.topSetores.forEach((s, i) => {
      parts.push(`${i+1}. **${s.setor || 'Não informado'}**: ${s._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalSetores = dados.topSetores.reduce((sum, s) => sum + s._count._all, 0);
    parts.push(`\n**Total**: ${totalSetores.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.unidadesUPAs && dados.unidadesUPAs.length > 0) {
    parts.push(`\n🚑 UPAs (UNIDADES DE PRONTO ATENDIMENTO):`);
    dados.unidadesUPAs.forEach((u, i) => {
      // Limpar o nome removendo "UAC -" se presente para melhor legibilidade
      const nomeLimpo = u.unidade.replace(/^UAC\s*-\s*/i, '').trim();
      parts.push(`${i+1}. ${nomeLimpo}: ${u.count.toLocaleString('pt-BR')} manifestações`);
    });
    const totalManifestacoes = dados.unidadesUPAs.reduce((sum, u) => sum + u.count, 0);
    parts.push(`\n📊 RESUMO DAS UPAs:`);
    parts.push(`Total de UPAs encontradas: ${dados.unidadesUPAs.length}`);
    parts.push(`Total de manifestações em UPAs: ${totalManifestacoes.toLocaleString('pt-BR')}`);
    if (dados.unidadesUPAs.length > 0) {
      parts.push(`Média de manifestações por UPA: ${(totalManifestacoes / dados.unidadesUPAs.length).toFixed(0)}`);
    }
  } else if (dados.todasUnidades && buscaUPAs) {
    // Se não encontrou UPAs específicas mas tem todas as unidades, mostrar unidades que podem ser UPAs
    const possiveisUPAs = dados.todasUnidades.filter(u => 
      u.unidade && u.unidade.toLowerCase().includes('upa') && !u.unidade.toLowerCase().includes('uph')
    );
    if (possiveisUPAs.length > 0) {
      parts.push(`\n🚑 UPAs ENCONTRADAS:`);
      possiveisUPAs.forEach((u, i) => {
        const nomeLimpo = u.unidade.replace(/^UAC\s*-\s*/i, '').trim();
        parts.push(`${i+1}. ${nomeLimpo}: ${u.count.toLocaleString('pt-BR')} manifestações`);
      });
    }
  }
  
  if (dados.unidadesUPHs && dados.unidadesUPHs.length > 0) {
    parts.push(`\n🏥 UPHs (UNIDADES DE PRONTO ATENDIMENTO):`);
    dados.unidadesUPHs.forEach((u, i) => {
      parts.push(`${i+1}. ${u.unidade}: ${u.count.toLocaleString('pt-BR')} manifestações`);
    });
    parts.push(`\nTotal de UPHs: ${dados.unidadesUPHs.length}`);
    parts.push(`Total de manifestações em UPHs: ${dados.unidadesUPHs.reduce((sum, u) => sum + u.count, 0).toLocaleString('pt-BR')}`);
  }
  
  if (dados.unidadesHospitais && dados.unidadesHospitais.length > 0) {
    parts.push(`\n🏥 HOSPITAIS:`);
    dados.unidadesHospitais.forEach((u, i) => {
      parts.push(`${i+1}. ${u.unidade}: ${u.count.toLocaleString('pt-BR')} manifestações`);
    });
    parts.push(`\nTotal de Hospitais: ${dados.unidadesHospitais.length}`);
    parts.push(`Total de manifestações em Hospitais: ${dados.unidadesHospitais.reduce((sum, u) => sum + u.count, 0).toLocaleString('pt-BR')}`);
  }
  
  if (dados.todasUnidades && dados.todasUnidades.length > 0 && !dados.unidadesUPAs && !dados.unidadesUPHs && !dados.unidadesHospitais) {
    parts.push(`\n📍 TODAS AS UNIDADES:`);
    dados.todasUnidades.slice(0, 20).forEach((u, i) => {
      parts.push(`${i+1}. ${u.unidade}: ${u.count.toLocaleString('pt-BR')} manifestações`);
    });
  }
  
  if (dados.topTemas && dados.topTemas.length > 0) {
    parts.push(`\n📋 TOP ${dados.topTemas.length} TEMAS POR VOLUME:`);
    dados.topTemas.forEach((t, i) => {
      parts.push(`${i+1}. **${t.tema || 'Não informado'}**: ${t._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalTemas = dados.topTemas.reduce((sum, t) => sum + t._count._all, 0);
    parts.push(`\n**Total**: ${totalTemas.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topBairros && dados.topBairros.length > 0) {
    parts.push(`\n🏘️ TOP ${dados.topBairros.length} BAIRROS POR VOLUME (extraídos dos endereços):`);
    dados.topBairros.forEach((b, i) => {
      parts.push(`${i+1}. **${b.bairro}**: ${b.count.toLocaleString('pt-BR')} manifestações`);
    });
    const totalBairros = dados.topBairros.reduce((sum, b) => sum + b.count, 0);
    parts.push(`\n**Total**: ${totalBairros.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topAssuntos && dados.topAssuntos.length > 0) {
    parts.push(`\n📝 TOP ${dados.topAssuntos.length} ASSUNTOS POR VOLUME:`);
    dados.topAssuntos.forEach((a, i) => {
      parts.push(`${i+1}. **${a.assunto || 'Não informado'}**: ${a._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalAssuntos = dados.topAssuntos.reduce((sum, a) => sum + a._count._all, 0);
    parts.push(`\n**Total**: ${totalAssuntos.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topCanais && dados.topCanais.length > 0) {
    parts.push(`\n📞 TOP ${dados.topCanais.length} CANAIS POR VOLUME:`);
    dados.topCanais.forEach((c, i) => {
      parts.push(`${i+1}. **${c.canal || 'Não informado'}**: ${c._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalCanais = dados.topCanais.reduce((sum, c) => sum + c._count._all, 0);
    parts.push(`\n**Total**: ${totalCanais.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topStatus && dados.topStatus.length > 0) {
    parts.push(`\n✅ TOP ${dados.topStatus.length} STATUS POR VOLUME:`);
    dados.topStatus.forEach((s, i) => {
      parts.push(`${i+1}. **${s.status || 'Não informado'}**: ${s._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalStatus = dados.topStatus.reduce((sum, s) => sum + s._count._all, 0);
    parts.push(`\n**Total**: ${totalStatus.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topStatusDemanda && dados.topStatusDemanda.length > 0) {
    parts.push(`\n✅ TOP ${dados.topStatusDemanda.length} STATUS DE DEMANDA POR VOLUME:`);
    dados.topStatusDemanda.forEach((s, i) => {
      parts.push(`${i+1}. **${s.statusDemanda || 'Não informado'}**: ${s._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalStatusDemanda = dados.topStatusDemanda.reduce((sum, s) => sum + s._count._all, 0);
    parts.push(`\n**Total**: ${totalStatusDemanda.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topPrioridades && dados.topPrioridades.length > 0) {
    parts.push(`\n⚡ TOP ${dados.topPrioridades.length} PRIORIDADES POR VOLUME:`);
    dados.topPrioridades.forEach((p, i) => {
      parts.push(`${i+1}. **${p.prioridade || 'Não informado'}**: ${p._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalPrioridades = dados.topPrioridades.reduce((sum, p) => sum + p._count._all, 0);
    parts.push(`\n**Total**: ${totalPrioridades.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topTiposManifestacao && dados.topTiposManifestacao.length > 0) {
    parts.push(`\n📝 TOP ${dados.topTiposManifestacao.length} TIPOS DE MANIFESTAÇÃO POR VOLUME:`);
    dados.topTiposManifestacao.forEach((t, i) => {
      parts.push(`${i+1}. **${t.tipoDeManifestacao || 'Não informado'}**: ${t._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalTipos = dados.topTiposManifestacao.reduce((sum, t) => sum + t._count._all, 0);
    parts.push(`\n**Total**: ${totalTipos.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topResponsaveis && dados.topResponsaveis.length > 0) {
    parts.push(`\n👤 TOP ${dados.topResponsaveis.length} RESPONSÁVEIS POR VOLUME:`);
    dados.topResponsaveis.forEach((r, i) => {
      parts.push(`${i+1}. **${r.responsavel || 'Não informado'}**: ${r._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalResponsaveis = dados.topResponsaveis.reduce((sum, r) => sum + r._count._all, 0);
    parts.push(`\n**Total**: ${totalResponsaveis.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topServidores && dados.topServidores.length > 0) {
    parts.push(`\n👥 TOP ${dados.topServidores.length} SERVIDORES/CADASTRISTAS POR VOLUME:`);
    dados.topServidores.forEach((s, i) => {
      parts.push(`${i+1}. **${s.servidor || 'Não informado'}**: ${s._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalServidores = dados.topServidores.reduce((sum, s) => sum + s._count._all, 0);
    parts.push(`\n**Total**: ${totalServidores.toLocaleString('pt-BR')} manifestações`);
  }
  
  if (dados.topEnderecos && dados.topEnderecos.length > 0) {
    parts.push(`\n📍 TOP ${dados.topEnderecos.length} ENDEREÇOS COMPLETOS POR VOLUME:`);
    dados.topEnderecos.forEach((e, i) => {
      parts.push(`${i+1}. **${e.endereco || 'Não informado'}**: ${e._count._all.toLocaleString('pt-BR')} manifestações`);
    });
    const totalEnderecos = dados.topEnderecos.reduce((sum, e) => sum + e._count._all, 0);
    parts.push(`\n**Total**: ${totalEnderecos.toLocaleString('pt-BR')} manifestações`);
    parts.push(`\n💡 Nota: Os endereços podem conter ruas, bairros e outras informações. Bairros identificados são mostrados separadamente acima.`);
  }
  
  if (dados.tempoMedio) {
    parts.push(`\n⏱️ TEMPO DE RESOLUÇÃO:`);
    if (dados.tempoMedio.media !== null && dados.tempoMedio.media !== undefined) {
      parts.push(`Média: ${parseFloat(dados.tempoMedio.media).toFixed(1)} dias`);
    }
    if (dados.tempoMedio.minimo !== null && dados.tempoMedio.minimo !== undefined) {
      parts.push(`Mínimo: ${dados.tempoMedio.minimo} dias`);
    }
    if (dados.tempoMedio.maximo !== null && dados.tempoMedio.maximo !== undefined) {
      parts.push(`Máximo: ${dados.tempoMedio.maximo} dias`);
    }
  }
  
  if (dados.protocoloEspecifico) {
    const p = dados.protocoloEspecifico;
    
    // Extrair protocolo do campo normalizado ou do JSON data
    let protocoloExibido = p.protocolo;
    if (!protocoloExibido && p.data && typeof p.data === 'object') {
      protocoloExibido = p.data.protocolo || p.data.Protocolo || p.data.PROTOCOLO || 'N/A';
    }
    
    parts.push(`\n🔍 DADOS DO PROTOCOLO **${protocoloExibido || 'N/A'}**:`);
    parts.push(`\n📋 INFORMAÇÕES PRINCIPAIS:`);
    
    // Priorizar dados do JSON data, depois do campo normalizado
    const dataObj = (p.data && typeof p.data === 'object') ? p.data : {};
    const dataCriacao = dataObj.dataDaCriacao || p.dataDaCriacao;
    const statusDemanda = dataObj.statusDemanda || p.statusDemanda;
    const status = dataObj.status || p.status;
    const prioridade = dataObj.prioridade || p.prioridade;
    const prazoRestante = dataObj.prazoRestante || p.prazoRestante;
    const dataConclusao = dataObj.dataDaConclusao || p.dataDaConclusao;
    const tempoResolucao = dataObj.tempoDeResolucaoEmDias || p.tempoDeResolucaoEmDias;
    
    if (dataCriacao) parts.push(`Data de Criação: ${dataCriacao}`);
    if (statusDemanda) parts.push(`Status da Demanda: **${statusDemanda}**`);
    if (status) parts.push(`Status: **${status}**`);
    if (prioridade) parts.push(`Prioridade: **${prioridade}**`);
    if (prazoRestante) parts.push(`Prazo Restante: ${prazoRestante}`);
    if (dataConclusao) parts.push(`Data de Conclusão: ${dataConclusao}`);
    if (tempoResolucao !== null && tempoResolucao !== undefined) parts.push(`Tempo de Resolução: ${tempoResolucao} dias`);
    
    parts.push(`\n📝 DETALHES DA MANIFESTAÇÃO:`);
    const tipoManifestacao = dataObj.tipoDeManifestacao || p.tipoDeManifestacao;
    const tema = dataObj.tema || p.tema;
    const assunto = dataObj.assunto || p.assunto;
    const canal = dataObj.canal || p.canal;
    
    if (tipoManifestacao) parts.push(`Tipo: **${tipoManifestacao}**`);
    if (tema) parts.push(`Tema: **${tema}**`);
    if (assunto) parts.push(`Assunto: **${assunto}**`);
    if (canal) parts.push(`Canal: ${canal}`);
    
    parts.push(`\n📍 LOCALIZAÇÃO E RESPONSABILIDADE:`);
    const orgaos = dataObj.orgaos || p.orgaos;
    const unidadeCadastro = dataObj.unidadeCadastro || p.unidadeCadastro;
    const unidadeSaude = dataObj.unidadeSaude || p.unidadeSaude;
    const endereco = dataObj.endereco || p.endereco;
    const responsavel = dataObj.responsavel || p.responsavel;
    const servidor = dataObj.servidor || p.servidor;
    const verificado = dataObj.verificado || p.verificado;
    
    if (orgaos) parts.push(`Órgão/Secretaria: **${orgaos}**`);
    if (unidadeCadastro) parts.push(`Unidade de Cadastro: ${unidadeCadastro}`);
    if (unidadeSaude) parts.push(`Unidade de Saúde: ${unidadeSaude}`);
    if (endereco) parts.push(`Endereço: ${endereco}`);
    if (responsavel) parts.push(`Responsável: **${responsavel}**`);
    if (servidor) parts.push(`Servidor/Cadastrante: ${servidor}`);
    if (verificado) parts.push(`Verificado: ${verificado}`);
    
    // Adicionar informações extras do JSON que não foram mapeadas
    if (p.data && typeof p.data === 'object') {
      const camposExtras = [];
      const camposJaUsados = ['protocolo', 'data_da_criacao', 'status_demanda', 'status', 'prioridade', 'tipo_de_manifestacao', 'tema', 'assunto', 'canal', 'endereco', 'unidade_cadastro', 'unidade_saude', 'orgaos', 'responsavel', 'servidor', 'verificado', 'data_da_conclusao', 'tempo_de_resolucao_em_dias', 'prazo_restante', 'createdat'];
      
      for (const [key, value] of Object.entries(p.data)) {
        if (value !== null && value !== undefined && value !== '' && 
            !camposJaUsados.includes(key.toLowerCase()) &&
            typeof value !== 'object') {
          camposExtras.push(`${key}: ${value}`);
        }
      }
      if (camposExtras.length > 0) {
        parts.push(`\n📄 INFORMAÇÕES ADICIONAIS:`);
        camposExtras.slice(0, 15).forEach(campo => parts.push(campo));
      }
    }
    
    if (dados.protocolosSimilares && dados.protocolosSimilares.length > 0) {
      parts.push(`\n⚠️ ATENÇÃO: Foram encontrados ${dados.protocolosSimilares.length} protocolo(s) similar(es). Mostrando o primeiro resultado.`);
    }
  }
  
  if (dados.protocoloNaoEncontrado) {
    parts.push(`\n⚠️ PROTOCOLO NÃO ENCONTRADO:`);
    parts.push(`O protocolo "${dados.protocoloNaoEncontrado}" não foi encontrado no banco de dados.`);
    parts.push(`Verifique se o número está correto ou se o protocolo existe no sistema.`);
  }
  
  if (dados.estatisticasProtocolos) {
    parts.push(`\n🔢 ESTATÍSTICAS DE PROTOCOLOS:`);
    parts.push(`Total de registros com protocolo: ${dados.estatisticasProtocolos.totalComProtocolo.toLocaleString('pt-BR')}`);
    parts.push(`Protocolos únicos: ${dados.estatisticasProtocolos.protocolosUnicos.toLocaleString('pt-BR')}`);
    if (dados.estatisticasProtocolos.topProtocolos && dados.estatisticasProtocolos.topProtocolos.length > 0) {
      parts.push(`\n📋 TOP ${dados.estatisticasProtocolos.topProtocolos.length} PROTOCOLOS MAIS FREQUENTES:`);
      dados.estatisticasProtocolos.topProtocolos.forEach((p, i) => {
        parts.push(`${i+1}. **${p.protocolo}**: ${p.count.toLocaleString('pt-BR')} ocorrência(s)`);
      });
    }
  }
  
  return parts.length > 0 ? `\n\n📊 DADOS REAIS DO BANCO DE DADOS (TEMPO REAL):\n${parts.join('\n')}\n` : '';
}

// Enviar mensagem no chat
app.post('/api/chat/messages', async (req, res) => {
  try {
    const { text, sender = 'user' } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
    }
    
    // Salvar mensagem (sem transações - MongoDB pode não suportar)
    console.log('💾 Salvando mensagem no banco:', { text: text.trim().substring(0, 50) + '...', sender });
    let message;
    try {
      // Tentar criar diretamente
      message = await safePrismaQuery(async () => {
        return await prisma.chatMessage.create({
          data: {
            text: text.trim(),
            sender: sender
          }
        });
      });
      console.log('✅ Mensagem salva com ID:', message.id);
    } catch (error) {
      // Se falhar por causa de transações, usar raw MongoDB query
      if (error.message?.includes('Transactions are not supported') || error.code === 'P2010') {
        console.warn('⚠️ MongoDB não suporta transações, usando raw query...');
        try {
          // Usar MongoDB driver nativo (sem transações)
          const client = await getMongoClient();
          const db = client.db();
          const collection = db.collection('chat_messages');
          
          const doc = {
            text: text.trim(),
            sender: sender,
            createdAt: new Date()
          };
          
          const result = await collection.insertOne(doc);
          message = {
            id: result.insertedId.toString(),
            text: text.trim(),
            sender: sender,
            createdAt: doc.createdAt
          };
          console.log('✅ Mensagem salva via MongoDB driver nativo, ID:', message.id);
        } catch (rawError) {
          console.error('❌ Erro também no MongoDB driver:', rawError.message);
          // Se ainda falhar, criar mensagem em memória (sem salvar)
          message = { 
            id: 'temp-' + Date.now(), 
            text: text.trim(), 
            sender: sender,
            createdAt: new Date()
          };
          console.warn('⚠️ Mensagem não foi salva no banco, usando ID temporário');
        }
      } else {
        throw error;
      }
    }
    
      // Se for mensagem do usuário, gerar resposta da Cora via Gemini (com fallback local)
      let response = null;
      if (sender === 'user') {
        console.log('\n=== 🚀 NOVA MENSAGEM DO CHAT ===');
        console.log('📝 Texto recebido:', text);
        console.log(`🔑 Usando chave ${currentKeyIndex + 1}/${GEMINI_API_KEYS.length}`);
      
      // Buscar dados relevantes do banco de forma inteligente
      console.log('🔍 Analisando pergunta e buscando dados relevantes do banco...');
      const dadosReais = await fetchRelevantData(text);
      const dadosFormatados = formatDataForGemini(dadosReais, text);
      const dadosEncontrados = Object.keys(dadosReais).filter(k => dadosReais[k] !== null);
      console.log('✅ Dados buscados:', dadosEncontrados.join(', ') || 'NENHUM');
      console.log('📊 Dados formatados (primeiros 500 chars):', dadosFormatados.substring(0, 500));
      
      const systemPrompt = [
        'Você é a Cora, especialista em análises de ouvidoria da Prefeitura de Duque de Caxias.',
        '',
        'IMPORTANTE: Você receberá dados reais do banco de dados em tempo real. USE ESSES DADOS para responder.',
        'NÃO invente números ou informações. Use APENAS os dados fornecidos.',
        '',
        'FORMATAÇÃO DAS RESPOSTAS:',
        '- Use formatação Markdown para melhorar a legibilidade',
        '- Use **negrito** para destacar números importantes e títulos',
        '- Use listas numeradas ou com bullets para organizar informações',
        '- Quando apresentar rankings ou listas, use formatação clara e hierárquica',
        '- Adicione emojis relevantes quando apropriado (📊, 🏥, 📈, etc.)',
        '- Use tabelas quando apresentar dados comparativos',
        '- Sempre inclua o total e percentuais quando relevante',
        '- Organize as informações de forma lógica e fácil de ler',
        '',
        'INSTRUÇÕES:',
        '1. SEMPRE use os dados reais fornecidos na seção "DADOS REAIS DO BANCO DE DADOS"',
        '2. Cite números exatos dos dados fornecidos, formatados com separadores de milhar (ex: 10.339)',
        '3. FAÇA CÁLCULOS MATEMÁTICOS quando necessário: somas, subtrações, médias, percentuais, etc.',
        '4. Quando apresentar listas/rankings, organize de forma clara e hierárquica',
        '5. Se perguntarem sobre "setor com mais reclamação", use os dados de "TOP 10 SETORES/UNIDADES POR VOLUME"',
        '6. Se perguntarem sobre "secretaria", use os dados de "TOP 10 SECRETARIAS/ÓRGÃOS POR VOLUME"',
        '7. Se perguntarem sobre "tema", use os dados de "TOP 10 TEMAS POR VOLUME"',
        '8. Se perguntarem sobre "bairro" ou "reclamação por bairro", use os dados de "TOP X BAIRROS POR VOLUME" (se disponível) ou "TOP X ENDEREÇOS COMPLETOS POR VOLUME"',
        '9. Responda de forma direta e objetiva, citando os números exatos dos dados',
        '10. Seja profissional mas amigável, sempre se referindo ao usuário como "Gestor Municipal"',
        '11. NÃO diga "preciso acessar os dados" ou "não posso fazer cálculos" - você JÁ TEM os dados e PODE fazer qualquer cálculo necessário',
        '12. Quando o Gestor Municipal pedir cálculos, percentuais, somas, médias, etc., FAÇA os cálculos usando os dados fornecidos',
        '13. Você tem total liberdade para realizar operações matemáticas, análises estatísticas e qualquer tipo de cálculo solicitado',
        '14. Sempre apresente os dados de forma visualmente atraente e organizada',
        '15. Quando apresentar rankings, inclua o número de posição e destaque os valores principais'
      ].join('\n');

      // Montar contexto compacto
      const ctxParts = (CONTEXT_CACHE.chunks || []).slice(0, 16).map(c=>`[${c.source}]\n${c.text}`).join('\n\n');

      // Tentar com as chaves disponíveis
      if (GEMINI_API_KEYS.length > 0) {
        let tentouTodasChaves = false;
        let chaveInicial = currentKeyIndex;
        
        while (!response && !tentouTodasChaves) {
          const GEMINI_API_KEY = getCurrentGeminiKey();
          console.log(`🤖 Chamando Gemini API com chave ${currentKeyIndex + 1}/${GEMINI_API_KEYS.length}...`);
          
          try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
            
            // Montar payload igual ao Wellington
            const payload = {
              system_instruction: {
                parts: [{ text: systemPrompt }]
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
              ],
              generationConfig: {
                temperature: 0.7
              },
              contents: [
                { role: 'user', parts: [{ text: `${dadosFormatados ? dadosFormatados + '\n\n' : ''}${ctxParts ? 'CONTEXTO DO PROJETO:\n' + ctxParts + '\n\n' : ''}PERGUNTA DO GESTOR MUNICIPAL: ${text}\n\nINSTRUÇÕES PARA RESPOSTA:\n- Use os dados reais fornecidos acima para responder de forma precisa e objetiva\n- Cite números exatos formatados com separadores de milhar (ex: 10.339)\n- FAÇA CÁLCULOS MATEMÁTICOS quando necessário (somas, subtrações, médias, percentuais, etc.)\n- Formate a resposta usando Markdown: use **negrito** para destacar números e títulos, listas numeradas ou bullets para organizar, e emojis quando apropriado\n- Organize as informações de forma clara e hierárquica\n- Quando apresentar rankings ou listas, use formatação visualmente atraente\n- Sempre inclua totais e percentuais quando relevante\n- Você tem total liberdade para realizar qualquer operação matemática ou análise estatística solicitada pelo Gestor Municipal` }] }
              ]
            };
            
            // Retry com backoff exponencial para erro 429
            let resp = null;
            let lastError = null;
            const maxRetries = 3;
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
              if (attempt > 0) {
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10s
                console.log(`⏳ Aguardando ${waitTime}ms antes de tentar novamente (tentativa ${attempt + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
              
              resp = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              
              console.log(`📡 Resposta Gemini status (chave ${currentKeyIndex + 1}, tentativa ${attempt + 1}):`, resp.status, resp.statusText);
              
              if (resp.ok) {
                const data = await resp.json();
                console.log('✅ Resposta Gemini recebida');
                response = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
                if (response) {
                  console.log('💬 Resposta da IA:', response.substring(0, 100) + '...');
                  break; // Sucesso, sair do loop
                } else {
                  console.warn('⚠️ Resposta vazia da API Gemini');
                  console.log('📋 Dados recebidos:', JSON.stringify(data).substring(0, 500));
                  break;
                }
              } else if (resp.status === 429) {
                // Rate limit (429) - tentar próxima chave após todas as tentativas
                const errorText = await resp.text();
                console.warn(`⚠️ Rate limit (429) na chave ${currentKeyIndex + 1} (tentativa ${attempt + 1}/${maxRetries})`);
                
                // Se ainda há tentativas, continuar com esta chave
                if (attempt < maxRetries - 1) {
                  lastError = { status: resp.status, text: errorText };
                  continue;
                } else {
                  // Última tentativa falhou com 429 - rotacionar para próxima chave
                  if (GEMINI_API_KEYS.length > 1) {
                    rotateToNextKey();
                    // Se voltou para a primeira, já tentou todas as chaves
                    if (currentKeyIndex === chaveInicial) {
                      tentouTodasChaves = true;
                      console.warn('⚠️ Todas as chaves deram rate limit - usando fallback');
                    } else {
                      console.log(`🔄 Tentando próxima chave devido a rate limit...`);
                    }
                    break; // Sair do loop de retry e tentar próxima chave
                  } else {
                    // Só tem uma chave, usar fallback
                    tentouTodasChaves = true;
                    lastError = { status: resp.status, text: errorText };
                    break;
                  }
                }
              } else {
                // Outro erro (não 429) - voltar para primeira chave e usar fallback
                const errorText = await resp.text();
                console.error(`❌ Erro na API Gemini (chave ${currentKeyIndex + 1}):`, resp.status, errorText.substring(0, 500));
                console.log('🔄 Voltando para primeira chave devido a erro');
                resetToFirstKey();
                tentouTodasChaves = true;
                lastError = { status: resp.status, text: errorText };
                break;
              }
            }
            
            // Se conseguiu resposta, sair do loop de chaves
            if (response) {
              break;
            }
            
            // Se não conseguiu e não rotacionou, tentou todas
            if (currentKeyIndex === chaveInicial && !response) {
              tentouTodasChaves = true;
            }
            
          } catch (e) {
            console.error('❌ Erro ao chamar Gemini:', e.message);
            console.error('📋 Tipo do erro:', e.constructor.name);
            
            // Se for erro de rede ou similar, tentar próxima chave
            if (GEMINI_API_KEYS.length > 1 && currentKeyIndex !== chaveInicial) {
              rotateToNextKey();
              if (currentKeyIndex === chaveInicial) {
                tentouTodasChaves = true;
              }
            } else {
              resetToFirstKey();
              tentouTodasChaves = true;
            }
          }
        }
      } else {
        console.warn('⚠️ Nenhuma chave Gemini configurada, usando fallback');
      }

      // Fallback inteligente com dados reais
      if (!response) {
        console.log('⚠️ Usando FALLBACK INTELIGENTE (Gemini não retornou resposta)');
        const userText = text.toLowerCase();
        
        // Se temos dados reais do banco, usar eles na resposta
        if (dadosFormatados) {
          response = `Com base nos dados atuais do banco de ouvidoria:\n\n${dadosFormatados}\n\nEsses são os principais dados disponíveis. Para análises mais detalhadas, posso consultar outros recortes ou períodos específicos.`;
        } else if (userText.includes('olá') || userText.includes('oi') || userText.includes('bom dia') || userText.includes('boa tarde') || userText.includes('boa noite')) {
          response = 'Olá! Como posso ajudar você hoje? Tenho acesso ao contexto do projeto e aos arquivos Wellington.';
        } else if (userText.includes('dados') || userText.includes('estatística') || userText.includes('gráfico')) {
          response = 'Posso analisar órgãos, temas, assuntos, status e tempos médios. Diga o recorte e produzo o insight.';
        } else {
          response = 'Certo! Já li o contexto disponível. Me diga o recorte (órgão/tema/assunto/período) e retorno os principais achados.';
        }
        console.log('💬 Resposta do fallback:', response.substring(0, 80) + '...');
      } else {
        console.log('✅ Resposta da Gemini usada (não fallback)');
      }
      console.log('=== ✅ FIM DO PROCESSAMENTO ===\n');
    }
    
    res.json({
      message: {
        id: message.id,
        text: message.text,
        sender: message.sender,
        createdAt: message.createdAt.toISOString()
      },
      response: response
    });
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    res.status(500).json({ error: 'Erro ao salvar mensagem' });
  }
});

// Endpoint para limpar cache (útil após importação de dados)
app.post('/api/cache/clear', (req, res) => {
  const keys = cache.keys();
  cache.flushAll();
  console.log(`🗑️  Cache limpo: ${keys.length} chaves removidas`);
  res.json({ 
    success: true, 
    message: `Cache limpo: ${keys.length} chaves removidas`,
    keysRemoved: keys.length
  });
});

// Endpoint para verificar status do cache
app.get('/api/cache/status', (req, res) => {
  const keys = cache.keys();
  const stats = cache.getStats();
  res.json({
    keys: keys.length,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize
  });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Dashboard running on http://localhost:${port}`);
});


