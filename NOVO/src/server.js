/**
 * Servidor Principal - Dashboard Ouvidoria Duque de Caxias
 * Versão 3.0 - Refatorada e Otimizada
 */

import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';

// Importar rotas organizadas
import apiRoutes from './api/routes/index.js';
import authRoutes from './api/routes/auth.js';
import { initializeDatabase } from './config/database.js';
import { initializeCache } from './config/cache.js';
import { initializeGemini } from './utils/geminiHelper.js';
import { iniciarScheduler } from './services/email-notifications/scheduler.js';
import { iniciarCronVencimentos } from './cron/vencimentos.cron.js';
import { requireAuth } from './api/middleware/authMiddleware.js';
import { startChangeStreamWatcher } from './services/changeStreamWatcher.js';

// Resolver caminho absoluto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

// Verificar MongoDB Atlas connection string
let mongodbUrl = process.env.MONGODB_ATLAS_URL;
if (!mongodbUrl) {
  console.error('❌ ERRO: MONGODB_ATLAS_URL não está definido!');
  process.exit(1);
}

// Adicionar parâmetros de conexão otimizados (apenas se não existirem)
// Extrair query string da URL
const urlParts = mongodbUrl.split('?');
const baseUrl = urlParts[0];
const existingQuery = urlParts[1] || '';

// Parsear parâmetros existentes
const urlParams = new URLSearchParams(existingQuery);
const paramsToAdd = {};

// Verificar e adicionar apenas parâmetros que não existem
if (!urlParams.has('serverSelectionTimeoutMS')) {
  paramsToAdd.serverSelectionTimeoutMS = '30000';
}
if (!urlParams.has('connectTimeoutMS')) {
  paramsToAdd.connectTimeoutMS = '30000';
}
if (!urlParams.has('socketTimeoutMS')) {
  paramsToAdd.socketTimeoutMS = '30000';
}
if (!urlParams.has('retryWrites')) {
  paramsToAdd.retryWrites = 'true';
}
if (!urlParams.has('w')) {
  paramsToAdd.w = 'majority';
}
if (!urlParams.has('tls')) {
  paramsToAdd.tls = 'true';
}

// Reconstruir URL apenas se houver parâmetros para adicionar
if (Object.keys(paramsToAdd).length > 0) {
  // Adicionar novos parâmetros aos existentes
  Object.entries(paramsToAdd).forEach(([key, value]) => {
    urlParams.set(key, value);
  });
  mongodbUrl = `${baseUrl}?${urlParams.toString()}`;
}

// Configurar DATABASE_URL para o Prisma
process.env.DATABASE_URL = mongodbUrl;
console.log(`📁 MongoDB Atlas: ${mongodbUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80)}...`);

// Configurar Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// MongoDB Client nativo como fallback
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

// Inicializar aplicação Express
const app = express();

// IMPORTANTE: Configurar trust proxy para Render/Heroku funcionar corretamente
// Isso permite que o Express confie nos headers X-Forwarded-* do proxy reverso
app.set('trust proxy', 1);

// Middlewares globais
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true // Permitir cookies
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar sessões
// IMPORTANTE: No Render, o cookie precisa de configurações específicas
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER || process.env.RENDER_EXTERNAL_URL;

// Configurar sessões
// NOTA: Usando MemoryStore por padrão. Em produção com múltiplas instâncias,
// considere usar MongoDBStore ou Redis para persistência entre reinicializações
app.use(session({
  secret: process.env.SESSION_SECRET || 'ouvidoria-dashboard-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction && isRender ? 'auto' : isProduction, // 'auto' no Render detecta HTTPS automaticamente
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: isProduction && isRender ? 'none' : 'lax' // 'none' necessário no Render para cross-site cookies
  },
  // Adicionar configuração de nome do cookie para evitar conflitos
  name: 'ouvidoria.sid',
  // Suprimir aviso do MemoryStore em produção (é esperado)
  store: undefined // Usar MemoryStore padrão (adequado para single-instance)
}));

// OTIMIZAÇÃO: Middleware de cache para respostas da API
app.use('/api', (req, res, next) => {
  // Endpoints que mudam frequentemente: cache curto (5 min)
  if (req.path.includes('/dashboard-data') || req.path.includes('/summary')) {
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.setHeader('ETag', `"${Date.now()}"`);
  }
  // Endpoints estáticos: cache longo (1 hora)
  else if (req.path.includes('/distritos') || req.path.includes('/secretarias')) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  // Outros endpoints: cache médio (10 min)
  else {
    res.setHeader('Cache-Control', 'public, max-age=600, must-revalidate');
  }
  next();
});

// Health check (público)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '3.0.0' });
});

// Endpoint para Chrome DevTools (evita erro 404)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.json({});
});

// Rotas da API
// Registrar rotas de autenticação primeiro (públicas)
app.use('/api/auth', authRoutes(prisma));

// Depois registrar todas as outras rotas da API (protegidas)
app.use('/api', requireAuth, apiRoutes(prisma, getMongoClient));

// IMPORTANTE: Rotas de páginas ANTES do express.static para evitar conflitos
// Rota raiz - página de login (pública)
app.get('/', (_req, res) => {
  // Se já estiver autenticado, redirecionar para dashboard
  if (_req.session && _req.session.isAuthenticated) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(publicDir, 'login.html'));
});

// Rota de login (pública) - servir login.html diretamente
app.get('/login', (_req, res) => {
  // Se já estiver autenticado, redirecionar para dashboard
  if (_req.session && _req.session.isAuthenticated) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(publicDir, 'login.html'));
});

// Rota do dashboard - servir index.html (protegida)
app.get('/dashboard', requireAuth, (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Rota para página de chat (SPA routing) - protegida
app.get('/chat', requireAuth, (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// OTIMIZAÇÃO: Cache headers para arquivos estáticos
// IMPORTANTE: Colocar DEPOIS das rotas de páginas para não interferir
// index: false para não servir index.html automaticamente na rota /
app.use(express.static(publicDir, {
  index: false, // Não servir index.html automaticamente
  maxAge: '1y', // Cache de 1 ano para arquivos estáticos
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Arquivos JS, CSS, imagens: cache longo
    if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Catch-all: servir index.html para todas as outras rotas (SPA routing) - protegida
// Exceção: não capturar /login e / (já tratadas acima)
app.get('*', requireAuth, (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  if (mongoClient) await mongoClient.close();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

// Inicializar sistema
(async () => {
  try {
    // Testar conexão com banco
    await prisma.$connect();
    console.log('✅ Conexão com MongoDB Atlas estabelecida com sucesso!');
    
    // Verificar mensagens no banco
    try {
      const count = await prisma.chatMessage.count();
      console.log(`💬 Mensagens no banco de dados: ${count} mensagens`);
    } catch (error) {
      console.warn('⚠️ Não foi possível contar mensagens:', error.message);
    }
    
    // Inicializar cache
    await initializeCache(prisma);
    
    // Inicializar Gemini
    initializeGemini();
    
    // Inicializar scheduler de notificações por email
    try {
      iniciarScheduler(prisma);
      console.log('📧 Scheduler de notificações por email iniciado');
    } catch (error) {
      console.warn('⚠️ Erro ao iniciar scheduler de notificações:', error.message);
    }
    
    // Inicializar cron de vencimentos (sistema automático simplificado)
    try {
      iniciarCronVencimentos(prisma);
      console.log('🔔 Cron de vencimentos automático iniciado');
    } catch (error) {
      console.warn('⚠️ Erro ao iniciar cron de vencimentos:', error.message);
    }
    
    // Inicializar ChangeStream Watcher para invalidação automática de cache
    let changeStream = null;
    try {
      changeStream = await startChangeStreamWatcher(prisma, getMongoClient);
      console.log('👁️ ChangeStream Watcher ativo - Cache será invalidado automaticamente');
    } catch (error) {
      console.warn('⚠️ Erro ao iniciar ChangeStream Watcher:', error.message);
      console.warn('⚠️ Cache não será invalidado automaticamente, mas sistema continuará funcionando');
    }
    
    // Iniciar servidor
    const port = Number(process.env.PORT ?? 3000);
    app.listen(port, () => {
      console.log(`🚀 Dashboard running on http://localhost:${port}`);
      console.log(`📦 Cache híbrido ativo (memória + banco de dados)`);
      console.log(`🔧 Sistema de otimização global ativo`);
      console.log(`✨ Versão 3.0 - Refatorada e Otimizada`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
})();

export default app;


