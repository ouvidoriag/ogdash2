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

// Adicionar parâmetros de conexão otimizados para evitar timeouts
// Se a URL já não tiver esses parâmetros, adiciona
if (!mongodbUrl.includes('serverSelectionTimeoutMS')) {
  const separator = mongodbUrl.includes('?') ? '&' : '?';
  mongodbUrl += `${separator}serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000&retryWrites=true&w=majority`;
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
    mongoClient = new MongoClient(mongodbUrl);
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
        console.error('   2. O IP do servidor está na whitelist do MongoDB Atlas');
        console.error('   3. As credenciais estão corretas');
        console.error('   4. A rede permite conexões SSL/TLS na porta 27017');
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
    const ext = path.extname(filePath).toLowerCase();
    if (['.md','.txt','.json','.csv'].includes(ext)) {
      if (ext === '.json') {
        const obj = JSON.parse(fs.readFileSync(filePath,'utf8'));
        return JSON.stringify(obj).slice(0, 20000);
      }
      return fs.readFileSync(filePath,'utf8').slice(0, 20000);
    }
    return '';
  } catch { return ''; }
}

function walkDir(dir, files=[]) {
  try {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walkDir(full, files);
      else files.push(full);
    }
  } catch {}
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
app.get('/api/summary', async (_req, res) => {
  const key = 'summary:v1';
  // Cache de 1 hora para dados que mudam pouco
  return withCache(key, 3600, res, async () => {
  // Totais
  const total = await prisma.record.count();

  // Por status (normalizado)
  const byStatus = await prisma.record.groupBy({ by: ['status'], _count: { _all: true } });
  const statusCounts = byStatus.map(r => ({ status: r.status ?? 'Não informado', count: r._count._all }))
    .sort((a,b) => b.count - a.count);

  // Últimos 7 e 30 dias usando dataCriacaoIso
  const today = new Date();
  const toIso = (d) => d.toISOString().slice(0,10);
  const d7 = new Date(today); d7.setDate(today.getDate() - 7);
  const d30 = new Date(today); d30.setDate(today.getDate() - 30);
  const last7 = await prisma.record.count({ where: { dataCriacaoIso: { gte: toIso(d7) } } });
  const last30 = await prisma.record.count({ where: { dataCriacaoIso: { gte: toIso(d30) } } });

  // Top dimensões normalizadas (usando novos campos)
  const top = async (col) => {
    const rows = await prisma.record.groupBy({ by: [col], _count: { _all: true } });
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

  const cacheKey = `countBy:${field}:v2`;
  // Cache de 1 hora para agregações
  return withCache(cacheKey, 3600, res, async () => {
    // Preferir coluna normalizada quando corresponder a um dos campos conhecidos
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
      // Agregar direto no banco
      const rows = await prisma.record.groupBy({ by: [col], _count: { _all: true } });
      return rows.map(r => ({ key: r[col] ?? 'Não informado', count: r._count._all }))
        .sort((a, b) => b.count - a.count);
    }

    // Fallback: agrega pelo JSON caso campo não esteja normalizado
    const rows = await prisma.record.findMany({ select: { data: true } });
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
    // Se pediram Data, usar coluna normalizada dataCriacaoIso
    if (field === 'Data' || field === 'data_da_criacao') {
      const rows = await prisma.record.groupBy({ by: ['dataCriacaoIso'], _count: { _all: true } });
      return rows.map(r => ({ date: r.dataCriacaoIso ?? 'Sem data', count: r._count._all }))
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
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

// Série mensal últimos 12 meses (usa dataCriacaoIso)
app.get('/api/aggregate/by-month', async (_req, res) => {
  const key = 'byMonth:v1';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const rows = await prisma.record.findMany({ select: { dataCriacaoIso: true } });
    const map = new Map();
    for (const r of rows) {
      const d = r.dataCriacaoIso;
      if (!d || d.length < 7) continue;
      const ym = d.slice(0,7); // YYYY-MM
      map.set(ym, (map.get(ym) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([ym, count]) => ({ ym, count }))
      .sort((a,b) => a.ym.localeCompare(b.ym)).slice(-12);
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
  const rows = await prisma.record.findMany({ select: { dataCriacaoIso: true, [col]: true } });
  const matrix = new Map(); // key: dim value -> Map(ym -> count)
  for (const r of rows) {
    const d = r.dataCriacaoIso;
    if (!d || d.length < 7) continue;
    const ym = d.slice(0,7);
    if (!labels.includes(ym)) continue;
    const key = r[col] ?? 'Não informado';
    if (!matrix.has(key)) matrix.set(key, new Map(labels.map(l => [l, 0])));
    const inner = matrix.get(key);
    inner.set(ym, (inner.get(ym) ?? 0) + 1);
  }

  // Selecionar top 10 chaves pelo total (para heatmap legível)
  const totals = Array.from(matrix.entries()).map(([k, m]) => ({ key: k, total: Array.from(m.values()).reduce((a,b)=>a+b,0) }));
  totals.sort((a,b)=>b.total - a.total);
  const topKeys = totals.slice(0, 10).map(x=>x.key);

    const data = topKeys.map(k => ({ key: k, values: labels.map(ym => matrix.get(k)?.get(ym) ?? 0) }));
    return { labels, rows: data };
  });
});

// SLA summary: e-SIC >20 dias = atraso; outros: <=30 verde, 30-60 amarelo, >60 vermelho
app.get('/api/sla/summary', async (_req, res) => {
  const key = 'sla:v2';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const today = new Date();
    const toIso = (d) => d.toISOString().slice(0,10);
    // Otimizado: buscar apenas campos necessários
    const rows = await prisma.record.findMany({ 
      select: { dataCriacaoIso: true, tipoDeManifestacao: true } 
    });
    const buckets = { esic: { dentro: 0, atraso: 0 }, outros: { verde: 0, amarelo: 0, atraso: 0 } };

    const isEsic = (row) => {
      const t = (row.tipoDeManifestacao ?? '').toLowerCase();
      return t.includes('e-sic') || t.includes('esic') || t.includes('e sic');
    };

    const daysBetween = (iso) => {
      if (!iso) return null;
      const d = new Date(iso + 'T00:00:00');
      if (isNaN(d)) return null;
      return Math.floor((today - d) / (1000*60*60*24));
    };

    for (const r of rows) {
      const days = daysBetween(r.dataCriacaoIso);
      if (days === null) continue;
      if (isEsic(r)) {
        if (days > 20) buckets.esic.atraso += 1; else buckets.esic.dentro += 1;
      } else {
        if (days <= 30) buckets.outros.verde += 1;
        else if (days <= 60) buckets.outros.amarelo += 1;
        else buckets.outros.atraso += 1;
      }
    }

    return buckets;
  });
});

// Simple filter endpoint: accepts field/value, returns matching rows
app.post('/api/filter', async (req, res) => {
  const filters = Array.isArray(req.body?.filters) ? req.body.filters : [];
  // Tentar filtrar usando colunas normalizadas quando possível
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
  // MongoDB não suporta contains diretamente, então buscamos todos e filtramos
  const allRows = await prisma.record.findMany({ select: { id: true, data: true, ...Object.fromEntries(Object.values(fieldMap).map(col => [col, true])) } });
  
  const filtered = allRows.filter(r => {
    for (const f of filters) {
      const col = fieldMap[f.field];
      if (col) {
        const value = r[col] || (r.data || {})[f.field] || '';
        if (f.op === 'eq' && `${value}` !== `${f.value}`) return false;
        if (f.op === 'contains' && !(`${value}`.toLowerCase().includes(`${f.value}`.toLowerCase()))) return false;
      } else {
        const value = (r.data || {})[f.field] || '';
        if (f.op === 'eq' && `${value}` !== `${f.value}`) return false;
        if (f.op === 'contains' && !(`${value}`.toLowerCase().includes(`${f.value}`.toLowerCase()))) return false;
      }
    }
    return true;
  });
  
  res.json(filtered.map(r => ({ ...r, data: r.data || {} })));
});

// Tempo médio de atendimento por órgão/unidade
app.get('/api/stats/average-time', async (_req, res) => {
  const key = 'avgTime:v2';
  // Cache de 1 hora
  try {
    return await withCache(key, 3600, res, async () => {
      const rows = await prisma.record.findMany({
        where: {
          dataCriacaoIso: { not: null },
          dataConclusaoIso: { not: null }
        },
        select: {
          responsavel: true,
          unidadeCadastro: true,
          dataCriacaoIso: true,
          dataConclusaoIso: true
        }
      });
      
      // Agrupar por órgão/unidade e calcular média
      const map = new Map();
      for (const r of rows) {
        const org = r.responsavel || r.unidadeCadastro || 'Não informado';
        const start = new Date(r.dataCriacaoIso + 'T00:00:00');
        const end = new Date(r.dataConclusaoIso + 'T00:00:00');
        if (isNaN(start) || isNaN(end)) continue;
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        if (days < 0 || days > 1000) continue; // Filtrar outliers
        
        if (!map.has(org)) map.set(org, { total: 0, sum: 0 });
        const stats = map.get(org);
        stats.total += 1;
        stats.sum += days;
      }
      
      return Array.from(map.entries())
        .map(([org, stats]) => ({ org, dias: Number((stats.sum / stats.total).toFixed(2)) }))
        .sort((a, b) => b.dias - a.dias);
    });
  } catch (error) {
    console.error('❌ Erro ao calcular tempo médio:', error);
    return res.status(500).json({ error: 'Erro ao calcular tempo médio de atendimento', details: error.message });
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
app.get('/api/aggregate/by-server', async (_req, res) => {
  const key = 'byServer:v2';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const rows = await prisma.record.groupBy({ by: ['servidor'], _count: { _all: true } });
    return rows
      .map(r => ({ servidor: r.servidor ?? 'Não informado', quantidade: r._count._all }))
      .sort((a, b) => b.quantidade - a.quantidade);
  });
});

// Status geral (percentuais)
app.get('/api/stats/status-overview', async (_req, res) => {
  const key = 'statusOverview:v2';
  // Cache de 1 hora
  return withCache(key, 3600, res, async () => {
    const total = await prisma.record.count();
    // Otimizado: usar agregação do banco ao invés de buscar todos
    // Buscar apenas campos necessários
    const allRecords = await prisma.record.findMany({ 
      select: { status: true, statusDemanda: true } 
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
    // Otimizado: usar índices do MongoDB para buscar apenas campos necessários
    // Buscar registros que tenham a unidade no UAC ou Responsável usando queries otimizadas
    const searchLower = unitName.toLowerCase();
    
    // MongoDB: buscar todos e filtrar (mais eficiente que múltiplas queries)
    // Buscar apenas campos necessários para otimizar
    const allRecords = await prisma.record.findMany({
      select: { assunto: true, tipoDeManifestacao: true, unidadeCadastro: true, responsavel: true, orgaos: true, unidadeSaude: true }
    });
    
    // Filtrar em memória (mais rápido que múltiplas queries no MongoDB)
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
    // Otimizado: buscar todos e filtrar (MongoDB não tem contains case-insensitive eficiente)
    const allRecords = await prisma.record.findMany({
      select: { assunto: true, tipoDeManifestacao: true }
    });
    
    // Filtrar apenas Reclamação e Denúncia
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
        '10. Seja profissional mas amigável, sempre se referindo ao usuário como "Prefeito"',
        '11. NÃO diga "preciso acessar os dados" ou "não posso fazer cálculos" - você JÁ TEM os dados e PODE fazer qualquer cálculo necessário',
        '12. Quando o Prefeito pedir cálculos, percentuais, somas, médias, etc., FAÇA os cálculos usando os dados fornecidos',
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
                { role: 'user', parts: [{ text: `${dadosFormatados ? dadosFormatados + '\n\n' : ''}${ctxParts ? 'CONTEXTO DO PROJETO:\n' + ctxParts + '\n\n' : ''}PERGUNTA DO PREFEITO: ${text}\n\nINSTRUÇÕES PARA RESPOSTA:\n- Use os dados reais fornecidos acima para responder de forma precisa e objetiva\n- Cite números exatos formatados com separadores de milhar (ex: 10.339)\n- FAÇA CÁLCULOS MATEMÁTICOS quando necessário (somas, subtrações, médias, percentuais, etc.)\n- Formate a resposta usando Markdown: use **negrito** para destacar números e títulos, listas numeradas ou bullets para organizar, e emojis quando apropriado\n- Organize as informações de forma clara e hierárquica\n- Quando apresentar rankings ou listas, use formatação visualmente atraente\n- Sempre inclua totais e percentuais quando relevante\n- Você tem total liberdade para realizar qualquer operação matemática ou análise estatística solicitada pelo Prefeito` }] }
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

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Dashboard running on http://localhost:${port}`);
});


