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

**Total:** 19 módulos de rotas

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
**Controllers:** `summaryController.js`, `dashboardController.js`, `recordsController.js`, `vencimentoController.js`, `notificacoesController.js`, `utilsController.js`

**Endpoints:**
- `GET /api/summary` - Resumo geral com KPIs
- `GET /api/dashboard-data` - Dados completos para dashboard
- `GET /api/records` - Lista paginada de registros
- `GET /api/distinct` - Valores distintos de um campo
- `GET /api/unit/:unitName` - Dados de uma unidade específica
- `GET /api/complaints-denunciations` - Reclamações e denúncias agregadas
- `GET /api/sla/summary` - Resumo de SLA (concluídos, verde, amarelo, vermelho)
- `GET /api/vencimento` - Protocolos próximos de vencer ou já vencidos
- `GET /api/secretarias-info` - Lista informações de contato das secretarias
- `GET /api/secretarias-info/:id` - Detalhes de uma secretaria específica
- `GET /api/notificacoes` - Lista notificações de email enviadas
- `GET /api/notificacoes/meses-disponiveis` - Meses únicos com notificações
- `GET /api/notificacoes/stats` - Estatísticas de notificações
- `GET /api/notificacoes/ultima-execucao` - Última execução do cron
- `GET /api/notificacoes/vencimentos` - Busca vencimentos sem enviar
- `POST /api/notificacoes/enviar-selecionados` - Envia emails para secretarias selecionadas
- `POST /api/notificacoes/enviar-extra` - Envia email extra manualmente
- `POST /api/filter` - Filtro dinâmico de registros
- `POST /api/filter/aggregated` - Dados agregados filtrados
- `GET /api/meta/aliases` - Metadados e aliases de campos
- `POST /api/chat/reindex` - Reindexar contexto do chat
- `GET /api/export/database` - Exportar dados do banco

---

### 7. **/api/zeladoria** - Zeladoria
**Arquivo:** `routes/zeladoria.js`  
**Controller:** `zeladoriaController.js`

**Endpoints:**
- `GET /api/zeladoria/summary` - Resumo
- `GET /api/zeladoria/count-by?field=Status` - Contagem por campo
- `GET /api/zeladoria/by-month` - Por mês
- `GET /api/zeladoria/time-series` - Série temporal
- `GET /api/zeladoria/records` - Registros
- `GET /api/zeladoria/stats` - Estatísticas
- `GET /api/zeladoria/by-status-month` - Status por mês
- `GET /api/zeladoria/by-categoria-departamento` - Por categoria e departamento
- `GET /api/zeladoria/geographic` - Dados geográficos
- `GET /api/zeladoria/map` - Dados para mapa

---

### 8. **/api/esic** - E-SIC
**Arquivo:** `routes/esic.js`  
**Controller:** `esicController.js`

**Endpoints:**
- `GET /api/esic/summary` - Resumo
- `GET /api/esic/count-by?field=Status` - Contagem por campo
- `GET /api/esic/by-month` - Por mês
- `GET /api/esic/time-series` - Série temporal
- `GET /api/esic/records` - Registros
- `GET /api/esic/stats` - Estatísticas
- `GET /api/esic/by-status-month` - Status por mês
- `GET /api/esic/by-tipo-responsavel` - Por tipo e responsável
- `GET /api/esic/by-canal-unidade` - Por canal e unidade
- `GET /api/esic/categorias-por-assunto` - Categorias por assunto

---

### 9. **/api/notifications** - Notificações
**Arquivo:** `routes/notifications.js`  
**Controller:** `notificationController.js`

**Endpoints:**
- `GET /api/notifications/auth/url` - URL de autenticação OAuth
- `POST /api/notifications/auth/callback` - Callback de autenticação
- `GET /api/notifications/auth/status` - Status de autenticação
- `POST /api/notifications/execute` - Executar notificações manualmente
- `POST /api/notifications/scheduler/execute` - Executar scheduler manualmente
- `GET /api/notifications/history` - Histórico de notificações
- `GET /api/notifications/stats` - Estatísticas de notificações
- `GET /api/notifications/config` - Configuração de emails
- `GET /api/notifications/scheduler/status` - Status do scheduler
- `GET /api/notifications/test` - Teste de envio de email

---

### 10. **/api/data-sync** - Sincronização
**Arquivo:** `routes/dataSync.js`  
**Controller:** `dataSyncController.js`

**Endpoints:**
- `POST /api/data-sync/execute` - Executar sincronização
- `GET /api/data-sync/status` - Status da sincronização

---

### 11. **/api/geographic** - Dados Geográficos
**Arquivo:** `routes/geographic.js`  
**Controller:** `geographicController.js`

**Endpoints:**
- `GET /api/secretarias` - Lista de secretarias
- `GET /api/secretarias/:district` - Secretarias por distrito
- `GET /api/distritos` - Lista de distritos
- `GET /api/distritos/:code` - Distrito por código
- `GET /api/distritos/:code/stats` - Estatísticas do distrito
- `GET /api/bairros` - Lista de bairros
- `GET /api/unidades-saude` - Lista de unidades de saúde
- `GET /api/unidades-saude/por-distrito` - Unidades por distrito
- `GET /api/unidades-saude/por-bairro` - Unidades por bairro
- `GET /api/unidades-saude/por-tipo` - Unidades por tipo

---

### 12. **/api/colab** - Colab
**Arquivo:** `routes/colab.js`  
**Controller:** `colabController.js`

**Endpoints:**
- `GET /api/colab/categories` - Listar categorias
- `GET /api/colab/posts` - Listar demandas (posts)
- `GET /api/colab/posts/:id` - Detalhes de uma demanda
- `POST /api/colab/posts` - Criar demanda
- `POST /api/colab/posts/:id/accept` - Aceitar demanda
- `POST /api/colab/posts/:id/reject` - Rejeitar demanda
- `POST /api/colab/posts/:id/solve` - Resolver demanda
- `POST /api/colab/posts/:id/comment` - Criar comentário
- `GET /api/colab/posts/:id/comments` - Listar comentários
- `GET /api/colab/events/:id` - Detalhes de evento
- `POST /api/colab/events/:id/accept` - Aceitar evento
- `POST /api/colab/events/:id/solve` - Resolver evento
- `POST /api/colab/webhooks` - Receber webhooks

---

### 13. **/api/batch** - Batch
**Arquivo:** `routes/batch.js`  
**Controller:** `batchController.js`

**Endpoints:**
- Requisições em lote para múltiplos endpoints

---

### 14. **/api/metrics** - Métricas
**Arquivo:** `routes/metrics.js`  
**Controller:** `metricsController.js`

**Endpoints:**
- Métricas do sistema e performance

---

### 15. **/api/central** - Painel Central
**Arquivo:** `routes/central.js`  
**Controller:** `centralController.js`

**Endpoints:**
- `GET /api/central/dashboard` - Dados do painel central

---

### 16. **/api/saved-filters** - Filtros Salvos
**Arquivo:** `routes/savedFilters.js`  
**Controller:** `savedFiltersController.js`

**Endpoints:**
- `GET /api/saved-filters` - Listar filtros salvos
- `POST /api/saved-filters` - Salvar filtro
- `PUT /api/saved-filters/:id` - Atualizar filtro
- `DELETE /api/saved-filters/:id` - Deletar filtro
- `POST /api/saved-filters/:id/use` - Usar filtro salvo

---

### 17. **/api/config** - Configurações
**Arquivo:** `routes/config.js`  
**Controller:** `configController.js`

**Endpoints:**
- `GET /api/config` - Obter configurações
- `GET /api/config/cache` - Configuração de cache
- `POST /api/config/cache` - Salvar configuração de cache
- `POST /api/config/cache/clear` - Limpar cache
- `GET /api/config/notifications` - Configuração de notificações
- `POST /api/config/notifications` - Salvar configuração de notificações
- `GET /api/config/integrations` - Status de integrações
- `GET /api/config/sla` - Configuração de SLA
- `POST /api/config/sla` - Salvar configuração de SLA
- `GET /api/config/secretarias` - Lista de secretarias
- `POST /api/config/secretarias/:id` - Atualizar email de secretaria
- `POST /api/config/secretarias/:id/test-email` - Testar email de secretaria
- `GET /api/config/system-stats` - Estatísticas do sistema
- `POST /api/config/pipeline/execute` - Executar pipeline

---

### 18. **/api/auth** - Autenticação
**Arquivo:** `routes/auth.js`  
**Controller:** `authController.js`

**Endpoints:**
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout (requer autenticação)
- `GET /api/auth/me` - Obter usuário atual

---

## 🎮 CONTROLLERS

**Total:** 27 controllers

### Lista Completa de Controllers

1. **aggregateController.js** - Agregações e análises de dados
2. **summaryController.js** - Resumos e visões gerais
3. **dashboardController.js** - Dados do dashboard
4. **filterController.js** - Filtros e buscas dinâmicas
5. **statsController.js** - Estatísticas e métricas
6. **vencimentoController.js** - Protocolos vencidos
7. **zeladoriaController.js** - Demandas de Zeladoria
8. **esicController.js** - Pedidos E-SIC
9. **chatController.js** - Sistema de chat
10. **aiController.js** - Inteligência artificial e insights
11. **notificationController.js** - Notificações por email (Gmail API)
12. **notificacoesController.js** - Notificações (endpoints alternativos)
13. **recordsController.js** - Registros e dados brutos
14. **unitController.js** - Unidades específicas (UAC, Saúde, etc.)
15. **geographicController.js** - Dados geográficos (secretarias, distritos, bairros)
16. **cacheController.js** - Gerenciamento de cache
17. **dataSyncController.js** - Sincronização de dados
18. **colabController.js** - Integração com API do Colab
19. **batchController.js** - Requisições em lote
20. **metricsController.js** - Métricas do sistema
21. **authController.js** - Autenticação e autorização
22. **slaController.js** - Análise de SLA
23. **complaintsController.js** - Reclamações e denúncias
24. **distinctController.js** - Valores distintos de campos
25. **secretariaInfoController.js** - Informações de secretarias
26. **utilsController.js** - Utilitários gerais
27. **centralController.js** - Painel central
28. **savedFiltersController.js** - Filtros salvos
29. **configController.js** - Configurações do sistema

---

## 📦 MODELS

**Total:** 9 modelos Mongoose

1. **Record.model.js** - Manifestações de Ouvidoria
   - Schema: protocolo, dataCriacaoIso, dataConclusaoIso, statusDemanda, tipoDeManifestacao, tema, assunto, categoria, secretaria, bairro, etc.
   - Índices: protocolo, dataCriacaoIso, statusDemanda, secretaria
2. **Zeladoria.model.js** - Demandas de Zeladoria
   - Schema: protocolo, statusDemanda, categoria, departamento, bairro, etc.
3. **Esic.model.js** - Pedidos E-SIC
   - Schema: protocolo, statusDemanda, tipoInformacao, responsavel, unidade, etc.
4. **User.model.js** - Usuários do sistema
   - Schema: email, senha (hash), nome, role, etc.
5. **ChatMessage.model.js** - Mensagens de chat
   - Schema: mensagem, resposta, contexto, timestamp, etc.
6. **NotificacaoEmail.model.js** - Notificações por email
   - Schema: protocolo, secretaria, emailSecretaria, tipoNotificacao, dataVencimento, status, messageId, etc.
7. **SecretariaInfo.model.js** - Informações de secretarias
   - Schema: nome, email, telefone, distrito, etc.
8. **AggregationCache.model.js** - Cache de agregações
   - Schema: key, data, expiresAt, etc.
9. **SavedFilter.model.js** - Filtros salvos
   - Schema: nome, filtros, usuario, createdAt, etc.
10. **index.js** - Exportação centralizada de todos os models

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

**Última Atualização:** 12/12/2025

