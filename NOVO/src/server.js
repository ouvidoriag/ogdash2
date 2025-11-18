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
import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';

// Importar rotas organizadas
import apiRoutes from './api/routes/index.js';
import { initializeDatabase } from './config/database.js';
import { initializeCache } from './config/cache.js';
import { initializeGemini } from './utils/geminiHelper.js';

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

// Adicionar parâmetros de conexão otimizados
if (!mongodbUrl.includes('serverSelectionTimeoutMS')) {
  const separator = mongodbUrl.includes('?') ? '&' : '?';
  mongodbUrl += `${separator}serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000&retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false`;
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

// Middlewares globais
app.use(compression());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(publicDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '3.0.0' });
});

// Endpoint para Chrome DevTools (evita erro 404)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.json({});
});

// Rotas da API
app.use('/api', apiRoutes(prisma, getMongoClient));

// Rota principal - servir index.html
app.get('/', (_req, res) => {
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

