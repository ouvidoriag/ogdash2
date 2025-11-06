import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';

// Resolver caminho absoluto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Verificar MongoDB Atlas connection string
const mongodbUrl = process.env.MONGODB_ATLAS_URL;
if (!mongodbUrl) {
  console.error('❌ ERRO: MONGODB_ATLAS_URL não está definido!');
  console.error('Configure a variável MONGODB_ATLAS_URL no .env ou nas variáveis de ambiente');
  process.exit(1);
}

// Configurar DATABASE_URL para o Prisma (usa MONGODB_ATLAS_URL)
process.env.DATABASE_URL = mongodbUrl;
console.log(`📁 MongoDB Atlas conectado: ${mongodbUrl.replace(/:[^:@]+@/, ':****@')}`);

const prisma = new PrismaClient();
const app = express();
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

function setCacheHeaders(res, seconds = 60) {
  res.set('Cache-Control', `public, max-age=${seconds}`);
}

async function withCache(key, ttlSeconds, res, fn) {
  const cached = cache.get(key);
  if (cached) {
    setCacheHeaders(res, ttlSeconds);
    return res.json(cached);
  }
  const data = await fn();
  cache.set(key, data, ttlSeconds);
  setCacheHeaders(res, ttlSeconds);
  return res.json(data);
}

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Summary KPIs e insights críticos
app.get('/api/summary', async (_req, res) => {
  const key = 'summary:v1';
  if (cache.get(key)) return withCache(key, 300, res, async () => ({}));
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

  return withCache(key, 300, res, async () => ({ total, last7, last30, statusCounts, topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema }));
});

// List records (paginated)
app.get('/api/records', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Math.min(Number(req.query.pageSize ?? 50), 500);
  const skip = (page - 1) * pageSize;

  const [total, rowsRaw] = await Promise.all([
    prisma.record.count(),
    prisma.record.findMany({ orderBy: { id: 'asc' }, skip, take: pageSize })
  ]);
  // MongoDB já armazena JSON diretamente, não precisa fazer parse
  const rows = rowsRaw.map(r => ({ ...r, data: r.data || {} }));
  res.json({ total, page, pageSize, rows });
});
// Distinct values for a field inside JSON data
app.get('/api/distinct', async (req, res) => {
  const field = String(req.query.field ?? '').trim();
  if (!field) return res.status(400).json({ error: 'field required' });

  const cacheKey = `distinct:${field}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const rows = await prisma.record.findMany({ select: { data: true } });
  const values = new Set();
  for (const r of rows) {
    const dat = r.data || {};
    // Tentar diferentes variações do nome do campo
    const val = dat?.[field] ?? dat?.[field.toLowerCase()] ?? dat?.[field.replace(/\s+/g, '_')];
    if (val !== undefined && val !== null && `${val}`.trim() !== '') values.add(`${val}`);
  }
  const result = Array.from(values).sort();
  cache.set(cacheKey, result);
  res.json(result);
});

// Basic aggregations (count by field)
app.get('/api/aggregate/count-by', async (req, res) => {
  const field = String(req.query.field ?? '').trim();
  if (!field) return res.status(400).json({ error: 'field required' });

  const cacheKey = `countBy:${field}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

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
    const result = rows.map(r => ({ key: r[col] ?? 'Não informado', count: r._count._all }))
      .sort((a, b) => b.count - a.count);
    cache.set(cacheKey, result);
    return res.json(result);
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
  const result = Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  cache.set(cacheKey, result);
  res.json(result);
});

// Time series by date field (YYYY-MM-DD or DD/MM/YYYY)
app.get('/api/aggregate/time-series', async (req, res) => {
  const field = String(req.query.field ?? '').trim();
  if (!field) return res.status(400).json({ error: 'field required' });

  const cacheKey = `ts:${field}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  // Se pediram Data, usar coluna normalizada dataCriacaoIso
  if (field === 'Data' || field === 'data_da_criacao') {
    const rows = await prisma.record.groupBy({ by: ['dataCriacaoIso'], _count: { _all: true } });
    const result = rows.map(r => ({ date: r.dataCriacaoIso ?? 'Sem data', count: r._count._all }))
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
    cache.set(cacheKey, result);
    return res.json(result);
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

  const result = Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  cache.set(cacheKey, result);
  res.json(result);
});

// Série mensal últimos 12 meses (usa dataIso)
app.get('/api/aggregate/by-month', async (_req, res) => {
  const key = 'byMonth:v1';
  const rows = await prisma.record.findMany({ select: { dataCriacaoIso: true } });
  const map = new Map();
  for (const r of rows) {
    const d = r.dataCriacaoIso;
    if (!d || d.length < 7) continue;
    const ym = d.slice(0,7); // YYYY-MM
    map.set(ym, (map.get(ym) ?? 0) + 1);
  }
  const result = Array.from(map.entries()).map(([ym, count]) => ({ ym, count }))
    .sort((a,b) => a.ym.localeCompare(b.ym)).slice(-12);
  return withCache(key, 300, res, async () => result);
});

// Heatmap por mês (últimos 12 meses) x dimensão (usa colunas normalizadas quando possível)
app.get('/api/aggregate/heatmap', async (req, res) => {
  const dimReq = String(req.query.dim ?? 'Categoria');
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
  res.json({ labels, rows: data });
});

// SLA summary: e-SIC >20 dias = atraso; outros: <=30 verde, 30-60 amarelo, >60 vermelho
app.get('/api/sla/summary', async (_req, res) => {
  const key = 'sla:v1';
  const today = new Date();
  const toIso = (d) => d.toISOString().slice(0,10);
  const rows = await prisma.record.findMany({ select: { dataCriacaoIso: true, tipoDeManifestacao: true, data: true } });
  const buckets = { esic: { dentro: 0, atraso: 0 }, outros: { verde: 0, amarelo: 0, atraso: 0 } };

  const isEsic = (row) => {
    const t = (row.tipoDeManifestacao ?? '').toLowerCase();
    if (t.includes('e-sic') || t.includes('esic') || t.includes('e sic')) return true;
    // fallback: olhar JSON bruto
    const json = row.data || {};
    const tv = `${json['tipo_de_manifestacao'] ?? json['Tipo'] ?? ''}`.toLowerCase();
    return tv.includes('e-sic') || tv.includes('esic') || tv.includes('e sic');
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

  return withCache(key, 300, res, async () => buckets);
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
  const key = 'avgTime:v1';
  const cached = cache.get(key);
  if (cached) return withCache(key, 300, res, async () => cached);
  
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
  
  const result = Array.from(map.entries())
    .map(([org, stats]) => ({ org, dias: Number((stats.sum / stats.total).toFixed(2)) }))
    .sort((a, b) => b.dias - a.dias);
  
  return withCache(key, 300, res, async () => result);
});

// Total por Tema
app.get('/api/aggregate/by-theme', async (_req, res) => {
  const key = 'byTheme:v1';
  const cached = cache.get(key);
  if (cached) return withCache(key, 300, res, async () => cached);
  
  const rows = await prisma.record.groupBy({ by: ['tema'], _count: { _all: true } });
  const result = rows
    .map(r => ({ tema: r.tema ?? 'Não informado', quantidade: r._count._all }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  return withCache(key, 300, res, async () => result);
});

// Total por Assunto
app.get('/api/aggregate/by-subject', async (_req, res) => {
  const key = 'bySubject:v1';
  const cached = cache.get(key);
  if (cached) return withCache(key, 300, res, async () => cached);
  
  const rows = await prisma.record.groupBy({ by: ['assunto'], _count: { _all: true } });
  const result = rows
    .map(r => ({ assunto: r.assunto ?? 'Não informado', quantidade: r._count._all }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  return withCache(key, 300, res, async () => result);
});

// Por Servidor/Cadastrante
app.get('/api/aggregate/by-server', async (_req, res) => {
  const key = 'byServer:v1';
  const cached = cache.get(key);
  if (cached) return withCache(key, 300, res, async () => cached);
  
  const rows = await prisma.record.groupBy({ by: ['servidor'], _count: { _all: true } });
  const result = rows
    .map(r => ({ servidor: r.servidor ?? 'Não informado', quantidade: r._count._all }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  return withCache(key, 300, res, async () => result);
});

// Status geral (percentuais)
app.get('/api/stats/status-overview', async (_req, res) => {
  const key = 'statusOverview:v1';
  const cached = cache.get(key);
  if (cached) return withCache(key, 300, res, async () => cached);
  
  const total = await prisma.record.count();
  // Buscar status e statusDemanda para análise completa
  const allRecords = await prisma.record.findMany({ select: { status: true, statusDemanda: true, data: true } });
  let concluidas = 0;
  let emAtendimento = 0;
  
  for (const r of allRecords) {
    // Verificar status normalizado primeiro, depois statusDemanda, depois JSON
    const statusValue = r.status || r.statusDemanda || (r.data || {})['status'] || (r.data || {})['status_demanda'] || '';
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
  
  const result = {
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
  
  return withCache(key, 300, res, async () => result);
});

// Endpoint para dados filtrados por unidade (UAC ou Responsável)
app.get('/api/unit/:unitName', async (req, res) => {
  const unitName = decodeURIComponent(req.params.unitName);
  const key = `unit:${unitName}:v1`;
  const cached = cache.get(key);
  if (cached) return withCache(key, 300, res, async () => cached);
  
  // Buscar registros que tenham a unidade no UAC ou Responsável
  // SQLite não tem contains, então usamos busca em todos os registros
  const allRecords = await prisma.record.findMany({
    select: { assunto: true, tipoDeManifestacao: true, data: true, unidadeCadastro: true, responsavel: true, orgaos: true, unidadeSaude: true }
  });
  
  const records = allRecords.filter(r => {
    const unidadeCadastro = (r.unidadeCadastro || '').toLowerCase();
    const responsavel = (r.responsavel || '').toLowerCase();
    const orgaos = (r.orgaos || '').toLowerCase();
    const unidadeSaude = (r.unidadeSaude || '').toLowerCase();
    const searchLower = unitName.toLowerCase();
    
    return unidadeCadastro.includes(searchLower) || 
           responsavel.includes(searchLower) || 
           orgaos.includes(searchLower) || 
           unidadeSaude.includes(searchLower);
  });
  
  // Agrupar por assunto
  const assuntoMap = new Map();
  const tipoMap = new Map();
  
  for (const r of records) {
    // Assunto normalizado ou buscar no JSON
    const assunto = r.assunto || (() => {
      const data = r.data || {};
      return data['assunto'] || data['Assunto'] || data['Categoria'] || data['categoria'] || 'Não informado';
    })();
    
    // Tipo de ação normalizado ou buscar no JSON
    const tipo = r.tipoDeManifestacao || (() => {
      const data = r.data || {};
      return data['tipo_de_manifestacao'] || data['Tipo'] || data['Tipo Manifestação'] || data['TipoManifestacao'] || 'Não informado';
    })();
    
    assuntoMap.set(assunto, (assuntoMap.get(assunto) || 0) + 1);
    tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
  }
  
  const assuntos = Array.from(assuntoMap.entries())
    .map(([assunto, count]) => ({ assunto, quantidade: count }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  const tipos = Array.from(tipoMap.entries())
    .map(([tipo, count]) => ({ tipo, quantidade: count }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  const result = { assuntos, tipos };
  return withCache(key, 300, res, async () => result);
});

// Endpoint para reclamações e denúncias (filtro por tipo)
app.get('/api/complaints-denunciations', async (_req, res) => {
  const key = 'complaints:v1';
  const cached = cache.get(key);
  if (cached) return withCache(key, 300, res, async () => cached);
  
  // Buscar todos os registros
  const records = await prisma.record.findMany({
    select: { assunto: true, tipoDeManifestacao: true, data: true }
  });
  
  const assuntoMap = new Map();
  const tipoMap = new Map();
  
  for (const r of records) {
    let tipo = r.tipoDeManifestacao;
    if (!tipo) {
      const data = r.data || {};
      tipo = data['tipo_de_manifestacao'] || data['Tipo'] || data['Tipo Manifestação'] || data['TipoManifestacao'] || '';
    }
    
    // Filtrar apenas Reclamação e Denúncia
    const tipoLower = (tipo || '').toLowerCase();
    if (!tipoLower.includes('reclamação') && !tipoLower.includes('reclamacao') && !tipoLower.includes('denúncia') && !tipoLower.includes('denuncia')) {
      continue;
    }
    
    const assunto = r.assunto || (() => {
      const data = r.data || {};
      return data['assunto'] || data['Assunto'] || data['Categoria'] || data['categoria'] || 'Não informado';
    })();
    
    assuntoMap.set(assunto, (assuntoMap.get(assunto) || 0) + 1);
    tipoMap.set(tipo || 'Não informado', (tipoMap.get(tipo || 'Não informado') || 0) + 1);
  }
  
  const assuntos = Array.from(assuntoMap.entries())
    .map(([assunto, count]) => ({ assunto, quantidade: count }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  const tipos = Array.from(tipoMap.entries())
    .map(([tipo, count]) => ({ tipo, quantidade: count }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  return withCache(key, 300, res, async () => ({ assuntos, tipos }));
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

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Dashboard running on http://localhost:${port}`);
});


