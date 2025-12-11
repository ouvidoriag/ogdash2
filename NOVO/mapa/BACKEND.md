# 🟧 BACKEND - API REST

**Localização:** `NOVO/src/`  
**Data:** 11/12/2025  
**CÉREBRO X-3**

---

## 📋 ÍNDICE

1. [Estrutura Geral](#estrutura-geral)
2. [Rotas da API](#rotas-da-api)
3. [Controllers](#controllers)
4. [Models](#models)
5. [Services](#services)
6. [Utils](#utils)
7. [Configurações](#configurações)

---

## 🏗️ ESTRUTURA GERAL

```
src/
├── api/
│   ├── controllers/    # 26 controllers
│   ├── routes/         # 16 rotas
│   └── middleware/     # Middlewares
├── models/             # 9 modelos Mongoose
├── services/           # Serviços
├── utils/              # 23 utilitários
├── config/              # Configurações
└── server.js           # Servidor principal
```

---

## 🔗 ROTAS DA API

**Total:** 16 módulos de rotas

### 1. **/api/aggregate** - Agregações
**Arquivo:** `routes/aggregate.js`  
**Controller:** `aggregateController.js`

**Endpoints:**
- `GET /api/aggregate/count-by?field=Status` - Contagem por campo
- `GET /api/aggregate/by-month` - Agregação por mês
- `GET /api/aggregate/by-day` - Agregação por dia
- `GET /api/aggregate/by-theme` - Agregação por tema
- `GET /api/aggregate/by-subject` - Agregação por assunto
- `GET /api/aggregate/time-series` - Série temporal
- `GET /api/aggregate/heatmap` - Heatmap
- `GET /api/aggregate/count-by-status-mes` - Status por mês
- `GET /api/aggregate/count-by-orgao-mes` - Órgão por mês
- `GET /api/aggregate/top-protocolos-demora` - Top protocolos com demora

---

### 2. **/api/stats** - Estatísticas
**Arquivo:** `routes/stats.js`  
**Controller:** `statsController.js`

**Endpoints:**
- `GET /api/stats/status-overview` - Visão geral de status
- `GET /api/stats/average-time/stats` - Tempo médio

---

### 3. **/api/cache** - Cache
**Arquivo:** `routes/cache.js`  
**Controller:** `cacheController.js`

**Endpoints:**
- `GET /api/cache/stats` - Estatísticas de cache
- `POST /api/cache/invalidate` - Invalidar cache

---

### 4. **/api/chat** - Chat
**Arquivo:** `routes/chat.js`  
**Controller:** `chatController.js`

**Endpoints:**
- `GET /api/chat/messages` - Mensagens
- `POST /api/chat/messages` - Enviar mensagem
- `POST /api/chat/reindex` - Reindexar dados para IA

---

### 5. **/api/ai** - Inteligência Artificial
**Arquivo:** `routes/ai.js`  
**Controller:** `aiController.js`

**Endpoints:**
- `GET /api/ai/insights` - Insights gerados por IA

---

### 6. **/api/** - Dados Gerais
**Arquivo:** `routes/data.js`  
**Controllers:** `summaryController.js`, `dashboardController.js`, `recordsController.js`

**Endpoints:**
- `GET /api/summary` - Resumo geral
- `GET /api/dashboard-data` - Dados do dashboard
- `GET /api/records` - Registros
- `POST /api/filter` - Filtrar registros
- `POST /api/filter/aggregated` - Dados agregados filtrados

---

### 7. **/api/zeladoria** - Zeladoria
**Arquivo:** `routes/zeladoria.js`  
**Controller:** `zeladoriaController.js`

**Endpoints:**
- `GET /api/zeladoria/summary` - Resumo
- `GET /api/zeladoria/count-by?field=Status` - Contagem por campo
- `GET /api/zeladoria/by-month` - Por mês

---

### 8. **/api/esic** - E-SIC
**Arquivo:** `routes/esic.js`  
**Controller:** `esicController.js`

**Endpoints:**
- `GET /api/esic/summary` - Resumo
- `GET /api/esic/count-by?field=Status` - Contagem por campo
- `GET /api/esic/by-month` - Por mês

---

### 9. **/api/notifications** - Notificações
**Arquivo:** `routes/notifications.js`  
**Controller:** `notificationController.js`

**Endpoints:**
- `GET /api/notificacoes` - Listar notificações
- `POST /api/notifications/send` - Enviar notificação

---

### 10. **/api/data-sync** - Sincronização
**Arquivo:** `routes/dataSync.js`  
**Controller:** `dataSyncController.js`

**Endpoints:**
- `POST /api/data-sync/trigger` - Disparar sincronização

---

### 11. **/api/vencimento** - Vencimentos
**Controller:** `vencimentoController.js`

**Endpoints:**
- `GET /api/vencimento?filtro=vencidos&secretaria=...` - Protocolos vencidos

---

### 12. **/api/unit** - Unidades
**Controller:** `unitController.js`

**Endpoints:**
- `GET /api/unit/:name` - Dados de unidade específica

---

### 13. **/api/secretarias** - Secretarias
**Controller:** `geographicController.js`

**Endpoints:**
- `GET /api/secretarias` - Lista de secretarias
- `GET /api/distritos` - Lista de distritos

---

### 14. **/api/colab** - Colab
**Arquivo:** `routes/colab.js`  
**Controller:** `colabController.js`

**Endpoints:**
- Integração com API do Colab

---

### 15. **/api/batch** - Batch
**Arquivo:** `routes/batch.js`  
**Controller:** `batchController.js`

**Endpoints:**
- Requisições em lote

---

### 16. **/api/metrics** - Métricas
**Arquivo:** `routes/metrics.js`  
**Controller:** `metricsController.js`

**Endpoints:**
- Métricas do sistema

---

## 🎮 CONTROLLERS

**Total:** 26 controllers

### Principais Controllers

1. **aggregateController.js** - Agregações e análises
2. **summaryController.js** - Resumos e visões gerais
3. **dashboardController.js** - Dados do dashboard
4. **filterController.js** - Filtros e buscas
5. **statsController.js** - Estatísticas
6. **vencimentoController.js** - Vencimentos
7. **zeladoriaController.js** - Zeladoria
8. **esicController.js** - E-SIC
9. **chatController.js** - Chat
10. **aiController.js** - IA
11. **notificationController.js** - Notificações
12. **recordsController.js** - Registros
13. **unitController.js** - Unidades
14. **geographicController.js** - Dados geográficos
15. **cacheController.js** - Cache
16. **dataSyncController.js** - Sincronização
17. **colabController.js** - Colab
18. **batchController.js** - Batch
19. **metricsController.js** - Métricas
20. **authController.js** - Autenticação
21. **slaController.js** - SLA
22. **complaintsController.js** - Reclamações
23. **distinctController.js** - Valores distintos
24. **secretariaInfoController.js** - Info de secretarias
25. **utilsController.js** - Utilitários
26. **notificacoesController.js** - Notificações (alternativo)

---

## 📦 MODELS

**Total:** 9 modelos Mongoose

1. **Record.model.js** - Manifestações de Ouvidoria
2. **Zeladoria.model.js** - Demandas de Zeladoria
3. **Esic.model.js** - Pedidos E-SIC
4. **User.model.js** - Usuários
5. **ChatMessage.model.js** - Mensagens de chat
6. **NotificacaoEmail.model.js** - Notificações por email
7. **SecretariaInfo.model.js** - Informações de secretarias
8. **AggregationCache.model.js** - Cache de agregações
9. **index.js** - Exportação centralizada

---

## 🔧 SERVICES

**Localização:** `src/services/`

### 1. **email-notifications/**
- `gmailService.js` - Serviço Gmail
- `emailConfig.js` - Configuração de emails
- `notificationService.js` - Lógica de notificações
- `scheduler.js` - Agendamento

### 2. **data-sync/**
- `scheduler.js` - Sincronização de dados

### 3. **changeStreamWatcher.js**
- Monitora mudanças no MongoDB

---

## 🛠️ UTILS

**Total:** 23 utilitários

### Principais Utils

1. **logger.js** - Sistema de logs
2. **fieldMapper.js** - Mapeamento de campos
3. **dateUtils.js** - Utilitários de data
4. **dbAggregations.js** - Agregações MongoDB
5. **queryOptimizer.js** - Otimização de queries
6. **responseHelper.js** - Helpers de resposta
7. **smartCache.js** - Cache inteligente
8. **validateFilters.js** - Validação de filtros
9. **dataFormatter.js** - Formatação de dados
10. **geminiHelper.js** - Integração Gemini
11. **cacheManager.js** - Gerenciamento de cache
12. **cacheBuilder.js** - Construção de cache
13. **dbCache.js** - Cache de banco
14. **cursorPagination.js** - Paginação
15. **districtMapper.js** - Mapeamento de distritos
16. **pipelines/** - Pipelines MongoDB
   - `overview.js`
   - `tema.js`
   - `assunto.js`
   - `bairro.js`
   - `status.js`
   - `orgaoMes.js`
   - `categoria.js`

---

## ⚙️ CONFIGURAÇÕES

**Localização:** `src/config/`

1. **database.js** - Configuração do banco
2. **cache.js** - Configuração de cache
3. **cache-ttls.js** - TTLs de cache

---

## 🚀 SERVER.JS

**Arquivo:** `src/server.js`  
**Função:** Servidor principal Express.js

### O que faz:
- Inicializa Express
- Conecta MongoDB (Mongoose)
- Registra rotas
- Inicializa serviços (email, cron, etc.)
- Middlewares (CORS, compression, session)

### Serviços Inicializados:
- Database (MongoDB)
- Cache
- Gemini (IA)
- Email Scheduler
- Cron Vencimentos
- Data Sync Scheduler
- Change Stream Watcher

---

## 🔐 AUTENTICAÇÃO

**Middleware:** `api/middleware/authMiddleware.js`

- `requireAuth` - Requer autenticação
- Usa sessões Express

---

## 📊 CACHE

**Sistema:** Híbrido (memória + arquivo + banco)

- **Memória:** Cache rápido
- **Arquivo:** Cache persistente
- **Banco:** Cache de agregações

**TTLs:** Configurados em `cache-ttls.js`

---

## ✅ CHECKUP DO BACKEND

### ✅ Rotas
- [x] Todas as 16 rotas funcionando
- [x] Integração com controllers correta
- [x] Middlewares aplicados

### ✅ Controllers
- [x] Todos os 26 controllers implementados
- [x] Migração Prisma → Mongoose completa
- [x] Cache implementado

### ✅ Models
- [x] Todos os 9 models funcionando
- [x] Schemas validados
- [x] Índices criados

### ✅ Services
- [x] Email notifications funcionando
- [x] Data sync funcionando
- [x] Change streams funcionando

### ✅ Utils
- [x] Todos os utilitários funcionando
- [x] Pipelines otimizados
- [x] Cache inteligente funcionando

---

**Última Atualização:** 11/12/2025

