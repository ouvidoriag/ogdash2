import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';

// Verificar se DATABASE_URL está configurado
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: DATABASE_URL não está definido!');
  console.error('Configure a variável DATABASE_URL no .env ou nas variáveis de ambiente do Render');
  process.exit(1);
}

console.log(`📁 DATABASE_URL: ${process.env.DATABASE_URL}`);

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Últimos 7 e 30 dias usando dataIso
  const today = new Date();
  const toIso = (d) => d.toISOString().slice(0,10);
  const d7 = new Date(today); d7.setDate(today.getDate() - 7);
  const d30 = new Date(today); d30.setDate(today.getDate() - 30);
  const last7 = await prisma.record.count({ where: { dataIso: { gte: toIso(d7) } } });
  const last30 = await prisma.record.count({ where: { dataIso: { gte: toIso(d30) } } });

  // Top dimensões normalizadas
  const top = async (col) => {
    const rows = await prisma.record.groupBy({ by: [col], _count: { _all: true } });
    return rows.map(r => ({ key: r[col] ?? 'Não informado', count: r._count._all }))
      .sort((a,b) => b.count - a.count).slice(0,10);
  };
  const [topSecretaria, topSetor, topTipo, topCategoria] = await Promise.all([
    top('secretaria'), top('setor'), top('tipo'), top('categoria')
  ]);

  return withCache(key, 300, res, async () => ({ total, last7, last30, statusCounts, topSecretaria, topSetor, topTipo, topCategoria }));
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
  // Parse 'data' string
  const rows = rowsRaw.map(r => ({ ...r, data: safeParse(r.data) }));
  res.json({ total, page, pageSize, rows });
});

// Util para parse seguro
function safeParse(str) {
  try { return JSON.parse(str); } catch (_) { return {}; }
}
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
    const dat = safeParse(r.data);
    const val = dat?.[field];
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
    Secretaria: 'secretaria',
    Setor: 'setor',
    Tipo: 'tipo',
    Categoria: 'categoria',
    Bairro: 'bairro',
    Status: 'status',
    Data: 'dataIso'
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
    const dat = safeParse(r.data);
    const key = dat?.[field] ?? 'Não informado';
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

  // Se pediram Data, usar coluna normalizada dataIso
  if (field === 'Data') {
    const rows = await prisma.record.groupBy({ by: ['dataIso'], _count: { _all: true } });
    const result = rows.map(r => ({ date: r.dataIso ?? 'Sem data', count: r._count._all }))
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
    const dat = safeParse(r.data);
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
  const rows = await prisma.record.findMany({ select: { dataIso: true } });
  const map = new Map();
  for (const r of rows) {
    const d = r.dataIso;
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
    Secretaria: 'secretaria',
    Setor: 'setor',
    Tipo: 'tipo',
    Categoria: 'categoria',
    Bairro: 'bairro',
    Status: 'status'
  };
  const col = fieldMap[dimReq];
  if (!col) return res.status(400).json({ error: 'dim must be one of Secretaria, Setor, Tipo, Categoria, Bairro, Status' });

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
  const rows = await prisma.record.findMany({ select: { dataIso: true, [col]: true } });
  const matrix = new Map(); // key: dim value -> Map(ym -> count)
  for (const r of rows) {
    const d = r.dataIso;
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
  const rows = await prisma.record.findMany({ select: { dataIso: true, tipo: true, data: true } });
  const buckets = { esic: { dentro: 0, atraso: 0 }, outros: { verde: 0, amarelo: 0, atraso: 0 } };

  const isEsic = (row) => {
    const t = (row.tipo ?? '').toLowerCase();
    if (t.includes('e-sic') || t.includes('esic') || t.includes('e sic')) return true;
    // fallback: olhar JSON bruto
    let json; try { json = JSON.parse(row.data); } catch { json = {}; }
    const tv = `${json['Tipo'] ?? json['Tipo Manifestação'] ?? json['TipoManifestacao'] ?? ''}`.toLowerCase();
    return tv.includes('e-sic') || tv.includes('esic') || tv.includes('e sic');
  };

  const daysBetween = (iso) => {
    if (!iso) return null;
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return null;
    return Math.floor((today - d) / (1000*60*60*24));
  };

  for (const r of rows) {
    const days = daysBetween(r.dataIso);
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
  const fieldMap = { Secretaria: 'secretaria', Setor: 'setor', Tipo: 'tipo', Categoria: 'categoria', Bairro: 'bairro', Status: 'status', Data: 'dataIso' };
  const where = {};
  const fallback = [];
  for (const f of filters) {
    const col = fieldMap[f.field];
    if (col) {
      if (f.op === 'eq') where[col] = `${f.value}`;
      if (f.op === 'contains') where[col] = { contains: `${f.value}` };
    } else {
      fallback.push(f);
    }
  }
  let rowsRaw = await prisma.record.findMany({ where, select: { id: true, data: true } });
  if (fallback.length > 0) {
    const rows = rowsRaw.map(r => ({ ...r, data: safeParse(r.data) }));
    const ok = (row) => {
      for (const f of fallback) {
        const v = row.data?.[f.field];
        if (f.op === 'eq' && `${v}` !== `${f.value}`) return false;
        if (f.op === 'contains' && !(`${v}`.toLowerCase().includes(`${f.value}`.toLowerCase()))) return false;
      }
      return true;
    };
    return res.json(rows.filter(ok));
  }
  res.json(rowsRaw.map(r => ({ ...r, data: safeParse(r.data) })));
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
      Data: ['Data', 'Data Abertura', 'DataAbertura', 'Abertura']
    }
  });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Dashboard running on http://localhost:${port}`);
});


