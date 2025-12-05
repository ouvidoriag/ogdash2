# 🗺️ MAPEAMENTO DETALHADO E COMPLETO DO SISTEMA

**Data de Geração**: 02/12/2025, 16:24:18
**Versão**: 2.0 - Detalhado

---

## 📋 ÍNDICE

1. [Sistemas Globais Detalhados](#sistemas-globais-detalhados)
2. [APIs e Controllers Completos](#apis-e-controllers-completos)
3. [Páginas com Análise Completa](#páginas-com-análise-completa)
4. [Elementos HTML Mapeados](#elementos-html-mapeados)
5. [Resumo e Estatísticas](#resumo-e-estatísticas)

---

## 🔧 SISTEMAS GLOBAIS DETALHADOS

> 📚 **Documentação Completa**: Ver [`../docs/system/SISTEMAS_GLOBAIS_COMPLETO.md`](../docs/system/SISTEMAS_GLOBAIS_COMPLETO.md)

### **dataLoader** - `window.dataLoader`

**Arquivo**: `public/scripts/core/dataLoader.js`  
**Descrição**: Sistema unificado de carregamento de dados com cache, deduplicação, controle de concorrência e retry automático.

**Funcionalidades**:
- ✅ Controle de concorrência (máx. 6 requisições simultâneas)
- ✅ Timeouts adaptativos por tipo de endpoint
- ✅ Retry com backoff exponencial
- ✅ Deduplicação de requisições
- ✅ Integração com dataStore
- ✅ Fallback automático

**API Principal**: `window.dataLoader.load(endpoint, options)`

**Exemplo de Uso**:
```javascript
const data = await window.dataLoader.load('/api/dashboard-data', {
  useDataStore: true,
  ttl: 5000,
  retries: 2,
  fallback: []
});
```

---

### **dataStore** - `window.dataStore`

**Arquivo**: `public/scripts/core/global-store.js`  
**Descrição**: Repositório central de dados com cache em memória e localStorage, sistema de listeners e TTL configurável.

**Funcionalidades**:
- ✅ Cache em memória (Map)
- ✅ Cache persistente (localStorage)
- ✅ TTL configurável por endpoint
- ✅ Sistema de listeners
- ✅ Deep copy automático
- ✅ Invalidação de cache

**API Principal**: `window.dataStore.get(key, ttl)`, `window.dataStore.set(key, data, ttl)`

**Exemplo de Uso**:
```javascript
// Obter dados (com cache)
const data = window.dataStore.get('/api/dashboard-data', 5000);

// Armazenar dados
window.dataStore.set('/api/dashboard-data', data, 5000);

// Inscrever-se em mudanças
window.dataStore.subscribe('/api/dashboard-data', (newData) => {
  updateCharts(newData);
});
```

---

### **chartFactory** - `window.chartFactory`

**Arquivo**: `public/scripts/core/chart-factory.js`  
**Descrição**: Fábrica de gráficos padronizados usando Chart.js com configurações centralizadas, paleta de cores e suporte a modo claro/escuro.

**Funcionalidades**:
- ✅ Gráficos padronizados (Bar, Line, Doughnut, Pie, etc.)
- ✅ Paleta de cores centralizada
- ✅ Lazy loading do Chart.js
- ✅ Destruição segura (previne memory leaks)
- ✅ Atualização reativa via dataStore
- ✅ Tooltips customizados

**API Principal**: `window.chartFactory.createBarChart()`, `window.chartFactory.createLineChart()`, etc.

**Exemplo de Uso**:
```javascript
const chart = window.chartFactory.createBarChart('chartStatus',
  ['Aberto', 'Em Andamento', 'Concluído'],
  [100, 50, 200],
  { title: 'Status das Manifestações' }
);

// Destruir gráfico
window.chartFactory.destroyChartSafely('chartStatus');
```

---

### **chartCommunication** - `window.chartCommunication`

**Arquivo**: `public/scripts/core/chart-communication.js`  
**Descrição**: Sistema de comunicação entre gráficos, filtros globais e atualização reativa de componentes.

**Funcionalidades**:
- ✅ Event Bus global
- ✅ Filtros globais compartilhados
- ✅ Atualização reativa de gráficos
- ✅ Auto-connect de páginas
- ✅ Mapeamento automático de campos
- ✅ Feedback visual de interações

**API Principal**: `window.chartCommunication.applyFilter()`, `window.chartCommunication.on()`, `window.chartCommunication.emit()`

**Exemplo de Uso**:
```javascript
// Aplicar filtro
window.chartCommunication.applyFilter('Status', 'Aberto', 'equals');

// Escutar mudanças
window.chartCommunication.on('filter:changed', (filters) => {
  loadData();
});
```

---

### **advancedCharts** - `window.advancedCharts`

**Arquivo**: `public/scripts/core/advanced-charts.js`  
**Descrição**: Gráficos avançados usando Plotly.js (Sankey, TreeMap, Mapas Geográficos, Heatmaps).

**Funcionalidades**:
- ✅ Lazy loading do Plotly.js
- ✅ Sankey Charts (diagramas de fluxo)
- ✅ TreeMap Charts (mapas de árvore)
- ✅ Mapas Geográficos interativos
- ✅ Heatmaps

**API Principal**: `window.advancedCharts.loadSankeyChart()`, `window.advancedCharts.loadGeographicMap()`, etc.

**Exemplo de Uso**:
```javascript
await window.advancedCharts.loadSankeyChart('sankeyChart', {
  nodes: [...],
  links: [...]
});
```

---

### **config** - `window.config`

**Arquivo**: `public/scripts/core/config.js`  
**Descrição**: Configurações globais centralizadas (nomes de campos, endpoints, cores, formatos).

**Funcionalidades**:
- ✅ Nomes de campos centralizados
- ✅ Endpoints centralizados
- ✅ Paleta de cores e mapeamento por tipo
- ✅ Configurações de formato (data, número, etc.)
- ✅ Configurações de performance

**API Principal**: `window.config.getFieldLabel()`, `window.config.buildEndpoint()`, `window.config.getColorByTipoManifestacao()`

**Exemplo de Uso**:
```javascript
const label = window.config.getFieldLabel('Status');
const url = window.config.buildEndpoint('/api/aggregate/count-by', { field: 'Status' });
const color = window.config.getColorByTipoManifestacao('reclamação');
```

---

## 🌐 APIs E CONTROLLERS COMPLETOS

### **aggregateController.js**

**Arquivo**: `src\api\controllers\aggregateController.js`

**Endpoints** (13):
#### `countBy()`
- **Método**: GET
- **Rota**: /api/aggregate/count-by
- **Documentação**: GET /api/aggregate/count-by
  Contagem por campo
 /...

#### `timeSeries()`
- **Método**: GET
- **Rota**: /api/aggregate/time-series
- **Documentação**: GET /api/aggregate/time-series
  Série temporal por campo de data
 /...

#### `byTheme()`
- **Método**: GET
- **Rota**: /api/aggregate/by-theme
- **Documentação**: GET /api/aggregate/by-theme
  Agregação por tema
  OTIMIZAÇÃO: Usa pipeline MongoDB nativo com cache inteligente
 /...

#### `bySubject()`
- **Método**: GET
- **Rota**: /api/aggregate/by-subject
- **Documentação**: GET /api/aggregate/by-subject
  Agregação por assunto
  OTIMIZAÇÃO: Usa pipeline MongoDB nativo com cache inteligente
 /...

#### `byServer()`
- **Método**: GET
- **Rota**: /api/aggregate/by-server
- **Documentação**: GET /api/aggregate/by-server
  Agregação por servidor/cadastrante
 /...

#### `byMonth()`
- **Método**: GET
- **Rota**: /api/aggregate/by-month
- **Documentação**: GET /api/aggregate/by-month
  Agregação por mês
 /...

#### `byDay()`
- **Método**: GET
- **Rota**: /api/aggregate/by-day
- **Documentação**: GET /api/aggregate/by-day
  Agregação por dia (últimos 30 dias)
 /...

#### `heatmap()`
- **Método**: GET
- **Rota**: /api/aggregate/heatmap
- **Documentação**: GET /api/aggregate/heatmap
  Heatmap por mês x dimensão
 /...

#### `filtered()`
- **Método**: GET
- **Rota**: /api/aggregate/filtered
- **Documentação**: GET /api/aggregate/filtered
  Dados filtrados por servidor ou unidade
 /...

#### `sankeyFlow()`
- **Método**: GET
- **Rota**: /api/aggregate/sankey-flow
- **Documentação**: GET /api/aggregate/sankey-flow
  Dados cruzados para Sankey: Tema → Órgão → Status
 /...

#### `countByStatusMes()`
- **Método**: GET
- **Rota**: /api/aggregate/count-by-status-mes
- **Documentação**: GET /api/aggregate/count-by-status-mes
  Status por mês ou campo por mês (se field for especificado)
  Query params: field (opcional - Tema, Assunto...

#### `countByOrgaoMes()`
- **Método**: GET
- **Rota**: /api/aggregate/count-by-orgao-mes
- **Documentação**: GET /api/aggregate/count-by-orgao-mes
  Órgão por mês
  OTIMIZAÇÃO: Usa pipeline MongoDB nativo com cache inteligente
 /...

#### `byDistrict()`
- **Método**: GET
- **Rota**: /api/aggregate/by-district
- **Documentação**: GET /api/aggregate/by-district
  Agregação por distrito
 /...

---

### **aiController.js**

**Arquivo**: `src\api\controllers\aiController.js`

**Endpoints** (1):
#### `getInsights()`
- **Método**: GET
- **Rota**: /api/ai/insights
- **Documentação**: GET /api/ai/insights
  Gera insights com IA
 /...

---

### **authController.js**

**Arquivo**: `src\api\controllers\authController.js`

**Endpoints** (3):
#### `login()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controller de Autenticação
  Gerencia login, logout e verificação de sessão
 /...

#### `logout()`
- **Método**: POST
- **Rota**: /api/auth/logout
- **Documentação**: POST /api/auth/logout
  Encerra a sessão do usuário
 /...

#### `getCurrentUser()`
- **Método**: GET
- **Rota**: /api/auth/me
- **Documentação**: GET /api/auth/me
  Retorna informações do usuário autenticado
  Não requer autenticação - apenas verifica se está autenticado
 /...

---

### **batchController.js**

**Arquivo**: `src\api\controllers\batchController.js`

**Endpoints** (2):
#### `batch()`
- **Método**: POST
- **Rota**: /api/batch
- **Documentação**: POST /api/batch
  Executar múltiplas requisições em uma única chamada
 /...

#### `listEndpoints()`
- **Método**: GET
- **Rota**: /api/batch/endpoints
- **Documentação**: GET /api/batch/endpoints
  Listar endpoints disponíveis para batch
 /...

---

### **cacheController.js**

**Arquivo**: `src\api\controllers\cacheController.js`

**Endpoints** (6):
#### `getCacheStatus()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controllers de Cache
  /api/cache/
 /...

#### `rebuildCache()`
- **Método**: GET
- **Rota**: /api/cache/status
- **Documentação**: GET /api/cache/status
  Status do cache
 /...

#### `cleanExpired()`
- **Método**: POST
- **Rota**: /api/cache/clean-expired
- **Documentação**: POST /api/cache/clean-expired
  Limpar cache expirado
 /...

#### `clearAll()`
- **Método**: POST
- **Rota**: /api/cache/clean-expired
- **Documentação**: POST /api/cache/clean-expired
  Limpar cache expirado
 /...

#### `clearMemory()`
- **Método**: POST
- **Rota**: /api/cache/clear-all
- **Documentação**: POST /api/cache/clear-all
  Limpar todo o cache
 /...

#### `getUniversal()`
- **Método**: GET
- **Rota**: /api/cache/universal
- **Documentação**: GET /api/cache/universal
  Cache universal (desabilitado por padrão)
 /...

---

### **chatController.js**

**Arquivo**: `src\api\controllers\chatController.js`

**Endpoints** (2):
#### `getMessages()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controllers de Chat
  /api/chat/
  
  Baseado no sistema antigo, adaptado para o modelo novo
 /...

#### `createMessage()`
- **Método**: POST
- **Rota**: /api/chat/messages
- **Documentação**: POST /api/chat/messages
  Criar nova mensagem e obter resposta da IA
 /...

---

### **colabController.js**

**Arquivo**: `src\api\controllers\colabController.js`

**Endpoints** (13):
#### `getCategories()`
- **Método**: GET
- **Rota**: /api/colab/categories
- **Documentação**: GET /api/colab/categories
  Listar categorias do Colab
 /...

#### `getPosts()`
- **Método**: GET
- **Rota**: /api/colab/posts
- **Documentação**: GET /api/colab/posts
  Retorna as demandas para a entidade
 /...

#### `getPostById()`
- **Método**: GET
- **Rota**: /api/colab/posts/:id
- **Documentação**: GET /api/colab/posts/:id
  Consultar uma demanda específica (tipo post)
 /...

#### `createPost()`
- **Método**: POST
- **Rota**: /api/colab/posts
- **Documentação**: POST /api/colab/posts
  Cria uma nova demanda a partir da Central de Ocorrências
 /...

#### `acceptPost()`
- **Método**: POST
- **Rota**: /api/colab/posts/:id/accept
- **Documentação**: POST /api/colab/posts/:id/accept
  Aceitar uma demanda
 /...

#### `rejectPost()`
- **Método**: POST
- **Rota**: /api/colab/posts/:id/reject
- **Documentação**: POST /api/colab/posts/:id/reject
  Rejeitar demanda
 /...

#### `solvePost()`
- **Método**: POST
- **Rota**: /api/colab/posts/:id/solve
- **Documentação**: POST /api/colab/posts/:id/solve
  Finalizar demanda
 /...

#### `createComment()`
- **Método**: POST
- **Rota**: /api/colab/posts/:id/comment
- **Documentação**: POST /api/colab/posts/:id/comment
  Criar comentário na demanda
 /...

#### `getComments()`
- **Método**: GET
- **Rota**: /api/colab/posts/:id/comments
- **Documentação**: GET /api/colab/posts/:id/comments
  Listar comentários da demanda
 /...

#### `getEventById()`
- **Método**: GET
- **Rota**: /api/colab/events/:id
- **Documentação**: GET /api/colab/events/:id
  Consultar uma demanda específica (tipo event)
 /...

#### `acceptEvent()`
- **Método**: POST
- **Rota**: /api/colab/events/:id/accept
- **Documentação**: POST /api/colab/events/:id/accept
  Aceitar demanda (tipo event)
 /...

#### `solveEvent()`
- **Método**: POST
- **Rota**: /api/colab/events/:id/solve
- **Documentação**: POST /api/colab/events/:id/solve
  Finalizar demanda (tipo event)
 /...

#### `receiveWebhook()`
- **Método**: POST
- **Rota**: /api/colab/webhooks
- **Documentação**: POST /api/colab/webhooks
  Endpoint para receber webhooks do Colab
 /...

---

### **complaintsController.js**

**Arquivo**: `src\api\controllers\complaintsController.js`

**Endpoints** (1):
#### `getComplaints()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controller para /api/complaints-denunciations
  Reclamações e denúncias
 /...

---

### **dashboardController.js**

**Arquivo**: `src\api\controllers\dashboardController.js`

**Endpoints** (1):
#### `getDashboardData()`
- **Método**: GET
- **Rota**: /api/dashboard-data
- **Documentação**: GET /api/dashboard-data
  @param {Object} req - Request object
  @param {Object} res - Response object
  @param {PrismaClient} prisma - Cliente Prisma...

---

### **distinctController.js**

**Arquivo**: `src\api\controllers\distinctController.js`

**Endpoints** (1):
#### `getDistinct()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controller para /api/distinct
  Valores distintos de um campo
 /...

---

### **filterController.js**

**Arquivo**: `src\api\controllers\filterController.js`

**Endpoints** (1):
#### `filterRecords()`
- **Método**: POST
- **Rota**: /api/filter
- **Documentação**: POST /api/filter
  Filtro dinâmico de registros
  @param {Object} req - Request object
  @param {Object} res - Response object
  @param {PrismaCli...

---

### **geographicController.js**

**Arquivo**: `src\api\controllers\geographicController.js`

**Endpoints** (17):
#### `getSecretarias()`
- **Método**: GET
- **Rota**: /api/secretarias
- **Documentação**: GET /api/secretarias
  Listar todas secretarias
 /...

#### `getSecretariasByDistrict()`
- **Método**: GET
- **Rota**: /api/secretarias
- **Documentação**: GET /api/secretarias
  Listar todas secretarias
 /...

#### `getDistritos()`
- **Método**: GET
- **Rota**: /api/distritos
- **Documentação**: GET /api/distritos
  Listar todos distritos
 /...

#### `getDistritoByCode()`
- **Método**: GET
- **Rota**: /api/distritos/:code
- **Documentação**: GET /api/distritos/:code
  Distrito por código
 /...

#### `getBairros()`
- **Método**: GET
- **Rota**: /api/bairros
- **Documentação**: GET /api/bairros
  Listar bairros (com filtro opcional por distrito)
 /...

#### `getUnidadesSaude()`
- **Método**: GET
- **Rota**: /api/unidades-saude
- **Documentação**: GET /api/unidades-saude
  Listar unidades de saúde (com filtros)
 /...

#### `getUnidadesSaudeByDistrito()`
- **Método**: GET
- **Rota**: /api/unidades-saude/por-distrito
- **Documentação**: GET /api/unidades-saude/por-distrito
  Agrupar unidades por distrito
 /...

#### `getUnidadesSaudeByBairro()`
- **Método**: GET
- **Rota**: /api/unidades-saude/por-bairro
- **Documentação**: GET /api/unidades-saude/por-bairro
  Agrupar unidades por bairro
 /...

#### `getUnidadesSaudeByTipo()`
- **Método**: GET
- **Rota**: /api/unidades-saude/por-tipo
- **Documentação**: GET /api/unidades-saude/por-tipo
  Agrupar unidades por tipo
 /...

#### `aggregateByDistrict()`
- **Método**: GET
- **Rota**: /api/aggregate/by-district
- **Documentação**: GET /api/aggregate/by-district
  Agregação por distrito
 /...

#### `getDistritoStats()`
- **Método**: GET
- **Rota**: /api/distritos/:code/stats
- **Documentação**: GET /api/distritos/:code/stats
  Estatísticas de distrito
 /...

#### `debugDistrictMapping()`
- **Método**: GET
- **Rota**: /api/debug/district-mapping
- **Documentação**: GET /api/debug/district-mapping
  Testar mapeamento de endereços
 /...

#### `debugDistrictMappingBatch()`
- **Método**: POST
- **Rota**: /api/debug/district-mapping-batch
- **Documentação**: POST /api/debug/district-mapping-batch
  Testar mapeamento em lote
 /...

#### `getSaudeManifestacoes()`
- **Método**: GET
- **Rota**: /api/saude/manifestacoes
- **Documentação**: GET /api/saude/manifestacoes
  Manifestações relacionadas a saúde
 /...

#### `getSaudePorDistrito()`
- **Método**: GET
- **Rota**: /api/saude/por-distrito
- **Documentação**: GET /api/saude/por-distrito
  Saúde por distrito
 /...

#### `getSaudePorTema()`
- **Método**: GET
- **Rota**: /api/saude/por-tema
- **Documentação**: GET /api/saude/por-tema
  Saúde por tema
 /...

#### `getSaudePorUnidade()`
- **Método**: GET
- **Rota**: /api/saude/por-unidade
- **Documentação**: GET /api/saude/por-unidade
  Saúde por unidade
 /...

---

### **metricsController.js**

**Arquivo**: `src\api\controllers\metricsController.js`

**Endpoints** (2):
#### `getMetrics()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Calcular percentis
 /...

#### `resetMetrics()`
- **Método**: GET
- **Rota**: /api/metrics/reset
- **Documentação**: GET /api/metrics/reset
  Resetar métricas (apenas em desenvolvimento)
 /...

---

### **notificacoesController.js**

**Arquivo**: `src\api\controllers\notificacoesController.js`

**Endpoints** (5):
#### `getNotificacoes()`
- **Método**: GET
- **Rota**: /api/notificacoes
- **Documentação**: GET /api/notificacoes
  Lista todas as notificações com filtros opcionais
  
  Query params:
  - tipo: '15_dias' | 'vencimento' | '30_dias_vencido' | ...

#### `getNotificacoesStats()`
- **Método**: GET
- **Rota**: /api/notificacoes/stats
- **Documentação**: GET /api/notificacoes/stats
  Estatísticas de notificações
 /...

#### `getUltimaExecucao()`
- **Método**: GET
- **Rota**: /api/notificacoes/ultima-execucao
- **Documentação**: GET /api/notificacoes/ultima-execucao
  Verifica última execução do cron e quantos emails foram enviados hoje
 /...

#### `buscarVencimentos()`
- **Método**: GET
- **Rota**: /api/notificacoes/vencimentos
- **Documentação**: GET /api/notificacoes/vencimentos
  Busca vencimentos sem enviar emails (apenas para visualização)
  OTIMIZADO: Filtra por range de datas no banco, ba...

#### `enviarSelecionados()`
- **Método**: POST
- **Rota**: /api/notificacoes/enviar-selecionados
- **Documentação**: POST /api/notificacoes/enviar-selecionados
  Envia emails para as secretarias selecionadas
  OTIMIZADO: Batch de registros, processamento paralelo lim...

---

### **notificationController.js**

**Arquivo**: `src\api\controllers\notificationController.js`

**Endpoints** (10):
#### `getAuthUrlEndpoint()`
- **Método**: GET
- **Rota**: /api/notifications/auth/url
- **Documentação**: GET /api/notifications/auth/url
  Obter URL de autorização do Gmail
 /...

#### `authCallback()`
- **Método**: POST
- **Rota**: /api/notifications/auth/callback
- **Documentação**: POST /api/notifications/auth/callback
  Processar callback de autorização
 /...

#### `getAuthStatus()`
- **Método**: GET
- **Rota**: /api/notifications/auth/status
- **Documentação**: ' : null,
        refresh_token: tokens.refresh_token ? '' : null
      }
    });
  } catch (error) {
    console.error('❌ Erro ao processar auto...

#### `executeNotifications()`
- **Método**: POST
- **Rota**: /api/notifications/execute
- **Documentação**: POST /api/notifications/execute
  Executar notificações manualmente
 /...

#### `getNotificationHistory()`
- **Método**: GET
- **Rota**: /api/notifications/history
- **Documentação**: GET /api/notifications/history
  Obter histórico de notificações
 /...

#### `getNotificationStats()`
- **Método**: GET
- **Rota**: /api/notifications/stats
- **Documentação**: GET /api/notifications/stats
  Obter estatísticas de notificações
 /...

#### `getEmailConfig()`
- **Método**: GET
- **Rota**: /api/notifications/config
- **Documentação**: GET /api/notifications/config
  Obter configuração de emails
 /...

#### `getSchedulerStatus()`
- **Método**: GET
- **Rota**: /api/notifications/scheduler/status
- **Documentação**: GET /api/notifications/scheduler/status
  Obter status do scheduler
 /...

#### `executeSchedulerManual()`
- **Método**: POST
- **Rota**: /api/notifications/scheduler/execute
- **Documentação**: POST /api/notifications/scheduler/execute
  Executar verificação manual do scheduler
 /...

#### `testEmail()`
- **Método**: GET
- **Rota**: /api/notifications/test
- **Documentação**: GET /api/notifications/test
  Testar envio de email manualmente
 /...

---

### **recordsController.js**

**Arquivo**: `src\api\controllers\recordsController.js`

**Endpoints** (1):
#### `getRecords()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controller para /api/records
  Listagem paginada de registros
 /...

---

### **secretariaInfoController.js**

**Arquivo**: `src\api\controllers\secretariaInfoController.js`

**Endpoints** (2):
#### `getSecretariasInfo()`
- **Método**: GET
- **Rota**: /api/secretarias-info
- **Documentação**: Controller: Informações de Secretarias
  
  Endpoints:
  - GET /api/secretarias-info         -> Lista todas as secretarias com dados básicos
  - G...

#### `getSecretariaInfoById()`
- **Método**: GET
- **Rota**: /api/secretarias-info/:id
- **Documentação**: GET /api/secretarias-info/:id
  Retorna os detalhes completos de uma secretaria
 /...

---

### **slaController.js**

**Arquivo**: `src\api\controllers\slaController.js`

**Endpoints** (1):
#### `slaSummary()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controller de SLA
  /api/sla/summary
 /...

---

### **statsController.js**

**Arquivo**: `src\api\controllers\statsController.js`

**Endpoints** (8):
#### `averageTime()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controllers de Estatísticas
  /api/stats/
 /...

#### `averageTimeByDay()`
- **Método**: GET
- **Rota**: /api/stats/average-time/by-day
- **Documentação**: GET /api/stats/average-time/by-day
  Tempo médio por dia (últimos 30 dias)
 /...

#### `averageTimeByWeek()`
- **Método**: GET
- **Rota**: /api/stats/average-time/by-week
- **Documentação**: GET /api/stats/average-time/by-week
  Tempo médio por semana (últimas 12 semanas)
 /...

#### `averageTimeByMonth()`
- **Método**: GET
- **Rota**: /api/stats/average-time/by-month
- **Documentação**: GET /api/stats/average-time/by-month
  Tempo médio por mês
 /...

#### `averageTimeStats()`
- **Método**: GET
- **Rota**: /api/stats/average-time/stats
- **Documentação**: GET /api/stats/average-time/stats
  Estatísticas gerais de tempo (média, mediana, min, max)
 /...

#### `averageTimeByUnit()`
- **Método**: GET
- **Rota**: /api/stats/average-time/by-unit
- **Documentação**: GET /api/stats/average-time/by-unit
  Tempo médio por unidade de cadastro
 /...

#### `averageTimeByMonthUnit()`
- **Método**: GET
- **Rota**: /api/stats/average-time/by-month-unit
- **Documentação**: GET /api/stats/average-time/by-month-unit
  Tempo médio por mês e unidade
 /...

#### `statusOverview()`
- **Método**: GET
- **Rota**: /api/stats/status-overview
- **Documentação**: GET /api/stats/status-overview
  Visão geral de status (percentuais)
  OTIMIZAÇÃO: Usa pipeline MongoDB nativo com cache inteligente
 /...

---

### **summaryController.js**

**Arquivo**: `src\api\controllers\summaryController.js`

**Endpoints** (1):
#### `getSummary()`
- **Método**: GET
- **Rota**: /api/summary
- **Documentação**: GET /api/summary
 /...

---

### **unitController.js**

**Arquivo**: `src\api\controllers\unitController.js`

**Endpoints** (1):
#### `getUnit()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controller para /api/unit/:unitName
  Dados filtrados por unidade (UAC ou Responsável)
 /...

---

### **utilsController.js**

**Arquivo**: `src\api\controllers\utilsController.js`

**Endpoints** (3):
#### `getMetaAliases()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controllers de Utilitários
  Meta, Export, Reindex
 /...

#### `reindexChat()`
- **Método**: POST
- **Rota**: /api/chat/reindex
- **Documentação**: POST /api/chat/reindex
  Reindexar contexto do chat
 /...

#### `exportDatabase()`
- **Método**: POST
- **Rota**: /api/chat/reindex
- **Documentação**: POST /api/chat/reindex
  Reindexar contexto do chat
 /...

---

### **vencimentoController.js**

**Arquivo**: `src\api\controllers\vencimentoController.js`

**Endpoints** (1):
#### `getVencimento()`
- **Método**: GET
- **Rota**: /api/vencimento
- **Documentação**: GET /api/vencimento
  Busca protocolos próximos de vencer ou já vencidos
  Query params:
    - filtro: 'vencidos' | '3' | '7' | '15' | '30' | número c...

---

### **zeladoriaController.js**

**Arquivo**: `src\api\controllers\zeladoriaController.js`

**Endpoints** (9):
#### `summary()`
- **Método**: GET
- **Rota**: N/A
- **Documentação**: Controllers de Zeladoria
  /api/zeladoria/
 /...

#### `countBy()`
- **Método**: GET
- **Rota**: /api/zeladoria/count-by
- **Documentação**: GET /api/zeladoria/count-by
  Contagem por campo
 /...

#### `byMonth()`
- **Método**: GET
- **Rota**: /api/zeladoria/by-month
- **Documentação**: GET /api/zeladoria/by-month
  Agregação por mês
 /...

#### `timeSeries()`
- **Método**: GET
- **Rota**: /api/zeladoria/time-series
- **Documentação**: GET /api/zeladoria/time-series
  Série temporal
 /...

#### `records()`
- **Método**: GET
- **Rota**: /api/zeladoria/records
- **Documentação**: GET /api/zeladoria/records
  Lista de registros com paginação
 /...

#### `stats()`
- **Método**: GET
- **Rota**: /api/zeladoria/stats
- **Documentação**: GET /api/zeladoria/stats
  Estatísticas gerais
 /...

#### `byStatusMonth()`
- **Método**: GET
- **Rota**: /api/zeladoria/by-status-month
- **Documentação**: GET /api/zeladoria/by-status-month
  Status por mês
 /...

#### `byCategoriaDepartamento()`
- **Método**: GET
- **Rota**: /api/zeladoria/by-categoria-departamento
- **Documentação**: GET /api/zeladoria/by-categoria-departamento
  Categoria por Departamento
 /...

#### `geographic()`
- **Método**: GET
- **Rota**: /api/zeladoria/geographic
- **Documentação**: GET /api/zeladoria/geographic
  Dados geográficos (bairros com coordenadas)
 /...

---

## 📄 PÁGINAS COM ANÁLISE COMPLETA

### 📁 PAGE

#### 📊 **filtros-avancados**

**Arquivo**: `public\scripts\pages\filtros-avancados.js`
**Descrição**: * Página: Filtros Avançados
 * Sistema completo de filtros avançados para protocolos
 * 
 * Funcionalidades:
 * - Múltiplos filtros simultâneos
 * - Carregamento dinâmico de opções de filtro
 * - Aplicação de filtros via API /api/filter
 * - Visualização de resultados em tempo real
 * - Integração com sistema global de filtros

**APIs Utilizadas** (4):

- **`/api/filter`**
  - Tipo: fetch
  - Contexto: fetch('/api/filter', {
       method: 'POST',
       headers: {
         'Conten...

- **`/api/distinct?field=${encodeURIComponent(field)}`,`**
  - Tipo: direct
  - Variável: `values`
  - Contexto: /api/distinct?field=${encodeURIComponent(field)}`, {
         useDataStore: true...

- **`/api/distinct?field=${encodeURIComponent(field)}`;`**
  - Tipo: direct
  - Contexto: /api/distinct?field=${encodeURIComponent(field)}`;
       const cached = window....

- **`/api/summary`**
  - Tipo: direct
  - Variável: `summary`
  - Contexto: /api/summary', {
         useDataStore: true,
         ttl: 5 * 60 * 1000 // Cac...

**KPIs e Cards** (2):

- **`totalProtocolos`** (Element)
- **`totalProtocolosFiltrados`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `dataStore`, `chartCommunication`, `Logger`

**Funções Principais** (23):
- `loadFiltrosAvancados()`
- `initializeFilters()`
- `loadFilterOptions()`
- `loadDistinctValues()`
- `populateSelect()`
- `loadTotalProtocolos()`
- `updateTotalProtocolos()`
- `setupEventListeners()`
- `collectFilters()`
- `applyFilters()`
- `applyFiltersAPI()`
- `displayResults()`
- `showLoading()`
- `clearResults()`
- `showError()`

**Fontes de Dados**:
- API: `/api/filter` → `N/A`
- API: `/api/distinct?field=${encodeURIComponent(field)}`,` → `values`
- API: `/api/distinct?field=${encodeURIComponent(field)}`;` → `N/A`
- API: `/api/summary` → `summary`

---

#### 📊 **assunto**

**Arquivo**: `public\scripts\pages\ouvidoria\assunto.js`
**Descrição**: * Página: Por Assunto
 * Análise de manifestações por assunto
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (3):

- **`/api/aggregate/by-subject`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-subject', {
       useDataStore: true...

- **`/api/aggregate/count-by-status-mes?field=Assunto`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Assunto', {
  ...

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {
       useDataStore: true,
    ...

**Gráficos** (3):

- **`chartAssunto`** (bar)
  - Dados: `labels`

- **`chartAssuntoMes`** (bar)
  - Dados: `labels`

- **`chartStatusAssunto`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalAssunto`** (KPI)
- **`kpiAssuntosUnicos`** (KPI)
- **`kpiMediaAssunto`** (KPI)
- **`kpiAssuntoMaisComum`** (KPI)
- **`kpiTotalAssunto`** (KPI)
  - Fonte do valor: `total.toLocaleStri`
- **`kpiAssuntosUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaAssunto`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiAssuntoMaisComum`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (7):
- `loadAssunto()`
- `initAssuntoFilterListeners()`
- `renderAssuntoChart()`
- `renderStatusAssuntoChart()`
- `renderAssuntoMesChart()`
- `updateAssuntoKPIs()`
- `renderAssuntosList()`

**Fontes de Dados**:
- API: `/api/aggregate/by-subject` → `N/A`
- API: `/api/aggregate/count-by-status-mes?field=Assunto` → `N/A`
- API: `/api/dashboard-data` → `N/A`

---

#### 📊 **bairro**

**Arquivo**: `public\scripts\pages\ouvidoria\bairro.js`
**Descrição**: * Página: Bairro
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/aggregate/count-by?field=Bairro`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Bairro', {
       useData...

- **`/api/aggregate/count-by-status-mes?field=Bairro`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Bairro', {
   ...

**Gráficos** (2):

- **`chartBairro`** (bar)
  - Dados: `labels`

- **`chartBairroMes`** (bar)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalBairro`** (KPI)
- **`kpiBairrosUnicos`** (KPI)
- **`kpiMediaBairro`** (KPI)
- **`kpiBairroMaisAtivo`** (KPI)
- **`kpiTotalBairro`** (KPI)
  - Fonte do valor: `total.toLocaleString('`
- **`kpiBairrosUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaBairro`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiBairroMaisAtivo`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (3):
- `loadBairro()`
- `renderBairroMesChart()`
- `updateBairroKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Bairro` → `N/A`
- API: `/api/aggregate/count-by-status-mes?field=Bairro` → `N/A`

---

#### 📊 **cadastrante**

**Arquivo**: `public\scripts\pages\ouvidoria\cadastrante.js`
**Descrição**: * Página: Por Cadastrante
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (4):

- **`/api/aggregate/by-server`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-server', {
         useDataStore: tru...

- **`/api/aggregate/count-by?field=UAC`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=UAC', {
         useDataS...

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {
         useDataStore: true...

- **`/api/summary`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/summary', {
         useDataStore: true,
         ...

**Gráficos** (1):

- **`chartCadastranteMes`** (bar)
  - Dados: `labels`

**KPIs e Cards** (9):

- **`kpiTotalCadastrante`** (KPI)
- **`kpiServidoresUnicos`** (KPI)
- **`kpiUnidadesUnicas`** (KPI)
- **`kpiServidorMaisAtivo`** (KPI)
- **`kpiTotalCadastrante`** (KPI)
  - Fonte do valor: `to`
- **`kpiServidoresUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiUnidadesUnicas`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiServidorMaisAtivo`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`totalCadastrante`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (5):
- `loadCadastrante()`
- `renderServidoresList()`
- `renderUnidadesList()`
- `updateCadastranteKPIs()`
- `renderCadastranteMesChart()`

**Fontes de Dados**:
- API: `/api/aggregate/by-server` → `N/A`
- API: `/api/aggregate/count-by?field=UAC` → `N/A`
- API: `/api/aggregate/by-month` → `N/A`
- API: `/api/summary` → `N/A`

---

#### 📊 **canal**

**Arquivo**: `public\scripts\pages\ouvidoria\canal.js`
**Descrição**: * Página: Canais
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Canal`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Canal', {
       useDataS...

**Gráficos** (1):

- **`chartCanal`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalCanal`** (KPI)
- **`kpiCanaisUnicos`** (KPI)
- **`kpiMediaCanal`** (KPI)
- **`kpiCanalMaisUsado`** (KPI)
- **`kpiTotalCanal`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-B`
- **`kpiCanaisUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaCanal`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiCanalMaisUsado`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (2):
- `loadCanal()`
- `updateCanalKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Canal` → `N/A`

---

#### 📊 **categoria**

**Arquivo**: `public\scripts\pages\ouvidoria\categoria.js`
**Descrição**: * Página: Categoria
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/aggregate/count-by?field=Categoria`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Categoria', {
       useD...

- **`/api/aggregate/count-by-status-mes?field=Categoria`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Categoria', {
...

**Gráficos** (2):

- **`chartCategoria`** (bar)
  - Dados: `labels`

- **`chartCategoriaMes`** (bar)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalCategoria`** (KPI)
- **`kpiCategoriasUnicas`** (KPI)
- **`kpiMediaCategoria`** (KPI)
- **`kpiCategoriaMaisComum`** (KPI)
- **`kpiTotalCategoria`** (KPI)
  - Fonte do valor: `total.toLo`
- **`kpiCategoriasUnicas`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaCategoria`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiCategoriaMaisComum`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (3):
- `loadCategoria()`
- `renderCategoriaMesChart()`
- `updateCategoriaKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Categoria` → `N/A`
- API: `/api/aggregate/count-by-status-mes?field=Categoria` → `N/A`

---

#### 📊 **cora-chat**

**Arquivo**: `public\scripts\pages\ouvidoria\cora-chat.js`
**Descrição**: * Página: Cora Chat
 * Interface de chat com assistente virtual
 * 
 * Baseado no sistema antigo, adaptado para o modelo novo

**APIs Utilizadas** (1):

- **`/api/chat/messages`**
  - Tipo: fetch
  - Contexto: fetch('/api/chat/messages', {
       credentials: 'include' // Enviar cookies de...

**Sistemas Globais Usados**: `Logger`

**Funções Principais** (6):
- `loadCoraChat()`
- `loadChatMessages()`
- `formatChatTime()`
- `renderMessages()`
- `sendMessage()`
- `initChatPage()`

**Fontes de Dados**:
- API: `/api/chat/messages` → `N/A`

---

#### 📊 **notificacoes**

**Arquivo**: `public\scripts\pages\ouvidoria\notificacoes.js`
**Descrição**: * Página: Verificação de Notificações de Email
 * 
 * Exibe:
 * - Lista de emails enviados
 * - Filtros por tipo, secretaria, status, data
 * - Estatísticas gerais
 * - Última execução do cron

**APIs Utilizadas** (7):

- **`/api/notificacoes?limit=50`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/notificacoes?limit=50', {         useDataStore: tr...

- **`/api/notificacoes/stats`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/notificacoes/stats', {         useDataStore: true,...

- **`/api/notificacoes/ultima-execucao`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/notificacoes/ultima-execucao', {         useDataSt...

- **`/api/notificacoes/enviar-selecionados`**
  - Tipo: fetch
  - Contexto: fetch('/api/notificacoes/enviar-selecionados', {       method: 'POST',       hea...

- **`/api/notificacoes?${params.toString()}&limit=50`,`**
  - Tipo: direct
  - Variável: `data`
  - Contexto: /api/notificacoes?${params.toString()}&limit=50`, {       useDataStore: false, /...

- **`/api/notificacoes?page=${page}&limit=50`,`**
  - Tipo: direct
  - Variável: `data`
  - Contexto: /api/notificacoes?page=${page}&limit=50`, {       useDataStore: false,       ttl...

- **`/api/notificacoes/vencimentos?tipo=${tipo}`,`**
  - Tipo: direct
  - Variável: `data`
  - Contexto: /api/notificacoes/vencimentos?tipo=${tipo}`, {       useDataStore: false, // Sem...

**Gráficos** (1):

- **`notificacoes-chart-tipo`** (doughnut)
  - Dados: `tipos`

**KPIs e Cards** (1):

- **`notificacoes-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `Logger`

**Funções Principais** (13):
- `loadNotificacoes()`
- `renderStats()`
- `renderNotificacoes()`
- `setupFilters()`
- `aplicarFiltros()`
- `carregarNotificacoesPagina()`
- `showError()`
- `setupControleManual()`
- `carregarVencimentos()`
- `renderPainelVencimentos()`
- `renderListaEmails()`
- `atualizarContadorSelecionados()`
- `enviarEmailsSelecionados()`

**Fontes de Dados**:
- API: `/api/notificacoes?limit=50` → `N/A`
- API: `/api/notificacoes/stats` → `N/A`
- API: `/api/notificacoes/ultima-execucao` → `N/A`
- API: `/api/notificacoes/enviar-selecionados` → `N/A`
- API: `/api/notificacoes?${params.toString()}&limit=50`,` → `data`
- API: `/api/notificacoes?page=${page}&limit=50`,` → `data`
- API: `/api/notificacoes/vencimentos?tipo=${tipo}`,` → `data`

---

#### 📊 **orgao-mes**

**Arquivo**: `public\scripts\pages\ouvidoria\orgao-mes.js`
**Descrição**: * Página: Por Órgão e Mês
 * Análise de manifestações por órgão e período mensal
 * 
 * Refatorada para usar o sistema global de filtros

**APIs Utilizadas** (5):

- **`/api/aggregate/count-by?field=Orgaos`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {           useD...

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {           useDataStore: !fo...

- **`/api/filter`**
  - Tipo: fetch
  - Contexto: fetch('/api/filter', {           method: 'POST',           headers: {           ...

- **`/api/distinct?field=${encodeURIComponent(field)}`,`**
  - Tipo: direct
  - Variável: `values`
  - Contexto: /api/distinct?field=${encodeURIComponent(field)}`, {         useDataStore: true,...

- **`/api/distinct?field=${encodeURIComponent(field)}`;`**
  - Tipo: direct
  - Contexto: /api/distinct?field=${encodeURIComponent(field)}`;       const cached = window.d...

**Gráficos** (2):

- **`chartOrgaoMes`** (bar)
  - Dados: `labels`

- **`chartTopOrgaosBar`** (bar)
  - Dados: `labels`

**KPIs e Cards** (10):

- **`kpiTotalOrgaos`** (KPI)
- **`kpiOrgaosUnicos`** (KPI)
- **`kpiMediaOrgao`** (KPI)
- **`kpiPeriodo`** (KPI)
- **`kpiTotalOrgaos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiOrgaosUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaOrgao`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiPeriodo`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`infoMensal`** (Element)
- **`totalOrgaos`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `dataStore`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (15):
- `extractFieldValue()`
- `extractDataCriacao()`
- `aggregateFilteredData()`
- `loadOrgaoMes()`
- `renderOrgaosList()`
- `renderOrgaoMesChart()`
- `renderTopOrgaosBarChart()`
- `updateKPIs()`
- `initOrgaoMesFilterListeners()`
- `toggleSortOrgaos()`
- `collectPageFilters()`
- `loadDistinctValues()`
- `loadMonths()`
- `populateSelect()`
- `loadFilterOptions()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Orgaos` → `N/A`
- API: `/api/aggregate/by-month` → `N/A`
- API: `/api/filter` → `N/A`
- API: `/api/distinct?field=${encodeURIComponent(field)}`,` → `values`
- API: `/api/distinct?field=${encodeURIComponent(field)}`;` → `N/A`

---

#### 📊 **overview**

**Arquivo**: `public\scripts\pages\ouvidoria\overview.js`
**Descrição**: * Página: Visão Geral (Overview)
 * Dashboard principal com visão consolidada
 * 
 * Recriada com estrutura otimizada:
 * - Usa dataLoader para carregar dados
 * - Usa dataStore para cache
 * - Usa chartFactory para gráficos
 * - Estrutura modular e limpa

**APIs Utilizadas** (5):

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {
           useDataStore: !force...

- **`/api/sla/summary`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/sla/summary', {
         useDataStore: !shouldRefr...

- **`/api/ai/insights`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/ai/insights', {
       useDataStore: true,
       ...

- **`/api/filter`**
  - Tipo: fetch
  - Contexto: fetch('/api/filter', {
           method: 'POST',
           headers: {
        ...

- **`/api/summary`**
  - Tipo: direct
  - Contexto: /api/summary'
         ]);
       }
       
       // Recarregar overview com re...

**Gráficos** (10):

- **`chartDailyDistribution`** (bar)
  - Dados: `labels`

- **`chartTopOrgaos`** (bar)
  - Dados: `labels`

- **`chartTopTemas`** (bar)
  - Dados: `labels`

- **`chartUnidadesCadastro`** (bar)
  - Dados: `labels`

- **`chartTrend`** (line)
  - Dados: `labels`

- **`chartFunnelStatus`** (doughnut)
  - Dados: `labels`

- **`chartTiposManifestacao`** (doughnut)
  - Dados: `labels`

- **`chartCanais`** (doughnut)
  - Dados: `labels`

- **`chartPrioridades`** (doughnut)
  - Dados: `labels`

- **`chartSLA`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (6):

- **`kpiTotal`** (KPI)
- **`kpi7`** (KPI)
- **`kpi30`** (KPI)
- **`kpiTotal`** (KPI)
- **`kpi7`** (KPI)
- **`kpi30`** (KPI)

**Sistemas Globais Usados**: `dataLoader`, `dataStore`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (11):
- `loadOverview()`
- `renderKPIs()`
- `updateKPIsVisualState()`
- `renderSparkline()`
- `renderMainCharts()`
- `renderSLAChart()`
- `addPeakAnnotations()`
- `loadAIInsights()`
- `calculateSLAFromRows()`
- `aggregateFilteredData()`
- `initOverviewFilterListeners()`

**Fontes de Dados**:
- API: `/api/dashboard-data` → `N/A`
- API: `/api/sla/summary` → `N/A`
- API: `/api/ai/insights` → `N/A`
- API: `/api/filter` → `N/A`
- API: `/api/summary` → `N/A`

---

#### 📊 **prioridade**

**Arquivo**: `public\scripts\pages\ouvidoria\prioridade.js`
**Descrição**: * Página: Prioridades
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Prioridade`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Prioridade', {
       use...

**Gráficos** (1):

- **`chartPrioridade`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalPrioridade`** (KPI)
- **`kpiPrioridadesUnicas`** (KPI)
- **`kpiMediaPrioridade`** (KPI)
- **`kpiPrioridadeMaisComum`** (KPI)
- **`kpiTotalPrioridade`** (KPI)
  - Fonte do valor: `total.`
- **`kpiPrioridadesUnicas`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaPrioridade`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiPrioridadeMaisComum`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (2):
- `loadPrioridade()`
- `updatePrioridadeKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Prioridade` → `N/A`

---

#### 📊 **projecao-2026**

**Arquivo**: `public\scripts\pages\ouvidoria\projecao-2026.js`
**Descrição**: * Página: Projeção 2026
 * Projeções e previsões para 2026 baseadas em análise de tendências históricas
 * 
 * Recriada com:
 * - Análise de tendência de crescimento real
 * - Cálculo de sazonalidade mensal
 * - Projeções mais precisas
 * - Múltiplos gráficos informativos
 * - KPIs detalhados

**APIs Utilizadas** (3):

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {         useDataStore: true,...

- **`/api/aggregate/by-theme`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-theme', {         useDataStore: true,...

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {         useDataStore: true,    ...

**Gráficos** (6):

- **`chartCrescimentoPercentual`** (bar)
  - Dados: `labels`

- **`chartSazonalidade`** (bar)
  - Dados: `labels`

- **`chartProjecaoTema`** (bar)
  - Dados: `labels`

- **`chartProjecaoMensal`** (line)
  - Dados: `todosLabels`

- **`chartComparacaoAnual`** (line)
  - Dados: `labels`

- **`chartProjecaoTipo`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (4):

- **`kpisProjecao`** (KPI)
- **`kpisProjecao`** (KPI)
  - Fonte do valor: `'<div class="te`
- **`totalHistorico`** (Element)
- **`totalProjetado`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (14):
- `loadProjecao2026()`
- `calcularTendenciaESazonalidade()`
- `gerarProjecao2026()`
- `renderProjecaoChart()`
- `renderCrescimentoPercentual()`
- `renderComparacaoAnual()`
- `renderSazonalidade()`
- `renderProjecaoPorTema()`
- `renderProjecaoPorTipo()`
- `renderEstatisticas()`
- `renderProjecaoKPIs()`
- `renderTopTemas()`
- `renderTopTipos()`
- `renderTopOrgaos()`

**Fontes de Dados**:
- API: `/api/aggregate/by-month` → `N/A`
- API: `/api/aggregate/by-theme` → `N/A`
- API: `/api/dashboard-data` → `N/A`

---

#### 📊 **reclamacoes**

**Arquivo**: `public\scripts\pages\ouvidoria\reclamacoes.js`
**Descrição**: * Página: Reclamações e Denúncias
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/complaints-denunciations`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/complaints-denunciations', {
         useDataStore...

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {
         useDataStore: true...

**Gráficos** (2):

- **`chartReclamacoesTipo`** (bar)
  - Dados: `labels`

- **`chartReclamacoesMes`** (bar)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalReclamacoes`** (KPI)
- **`kpiTotalDenuncias`** (KPI)
- **`kpiAssuntosUnicos`** (KPI)
- **`kpiAssuntoMaisComum`** (KPI)
- **`kpiTotalReclamacoes`** (KPI)
  - Fonte do valor: `totalR`
- **`kpiTotalDenuncias`** (KPI)
  - Fonte do valor: `totalReclamacoes.toLocaleString('pt-BR')`
- **`kpiAssuntosUnicos`** (KPI)
  - Fonte do valor: `totalReclamacoes.toLocaleString('pt-BR')`
- **`kpiAssuntoMaisComum`** (KPI)
  - Fonte do valor: `totalReclamacoes.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (5):
- `loadReclamacoes()`
- `renderReclamacoesAssuntosList()`
- `renderTiposChart()`
- `updateReclamacoesKPIs()`
- `renderReclamacoesMesChart()`

**Fontes de Dados**:
- API: `/api/complaints-denunciations` → `N/A`
- API: `/api/aggregate/by-month` → `N/A`

---

#### 📊 **responsavel**

**Arquivo**: `public\scripts\pages\ouvidoria\responsavel.js`
**Descrição**: * Página: Responsáveis
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Responsavel`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Responsavel', {
       us...

**Gráficos** (1):

- **`chartResponsavel`** (bar)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalResponsavel`** (KPI)
- **`kpiResponsaveisUnicos`** (KPI)
- **`kpiMediaResponsavel`** (KPI)
- **`kpiResponsavelMaisAtivo`** (KPI)
- **`kpiTotalResponsavel`** (KPI)
  - Fonte do valor: `to`
- **`kpiResponsaveisUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaResponsavel`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiResponsavelMaisAtivo`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (2):
- `loadResponsavel()`
- `updateResponsavelKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Responsavel` → `N/A`

---

#### 📊 **secretaria**

**Arquivo**: `public\scripts\pages\ouvidoria\secretaria.js`
**Descrição**: * Página: Secretarias
 * Análise por secretarias
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/aggregate/count-by?field=Secretaria`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Secretaria', {
       use...

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {
       useDataStore: true,
...

**Gráficos** (2):

- **`chartSecretaria`** (bar)
  - Dados: `labels`

- **`chartSecretariaMes`** (bar)
  - Dados: `labelsMes`

**KPIs e Cards** (8):

- **`kpiTotalSecretaria`** (KPI)
- **`kpiSecretariasUnicas`** (KPI)
- **`kpiMediaSecretaria`** (KPI)
- **`kpiSecretariaMaisAtiva`** (KPI)
- **`kpiTotalSecretaria`** (KPI)
  - Fonte do valor: `total.`
- **`kpiSecretariasUnicas`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaSecretaria`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiSecretariaMaisAtiva`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (2):
- `loadSecretaria()`
- `updateSecretariaKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Secretaria` → `N/A`
- API: `/api/aggregate/by-month` → `N/A`

---

#### 📊 **secretarias-distritos**

**Arquivo**: `public\scripts\pages\ouvidoria\secretarias-distritos.js`
**Descrição**: * Página: Secretarias e Distritos
 * Análise cruzada secretarias × distritos
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/distritos`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/distritos', {
       useDataStore: true,
       tt...

**Gráficos** (1):

- **`chartSecretariasDistritos`** (bar)
  - Dados: `distritoLabels`

**KPIs e Cards** (8):

- **`kpiTotalSecretariasDistritos`** (KPI)
- **`kpiTotalDistritos`** (KPI)
- **`kpiTotalBairros`** (KPI)
- **`kpiMediaSecretariasDistrito`** (KPI)
- **`kpiTotalSecretariasDistritos`** (KPI)
- **`kpiTotalDistritos`** (KPI)
  - Fonte do valor: `totalSecretarias.toLocaleString('pt-BR')`
- **`kpiTotalBairros`** (KPI)
  - Fonte do valor: `totalSecretarias.toLocaleString('pt-BR')`
- **`kpiMediaSecretariasDistrito`** (KPI)
  - Fonte do valor: `totalSecretarias.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `dataStore`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (5):
- `loadSecretariasDistritos()`
- `renderDistritosList()`
- `renderDistritosEstatisticas()`
- `renderSecretariasDistritosChart()`
- `updateSecretariasDistritosKPIs()`

**Fontes de Dados**:
- API: `/api/distritos` → `N/A`

---

#### 📊 **setor**

**Arquivo**: `public\scripts\pages\ouvidoria\setor.js`
**Descrição**: * Página: Setor (Unidade de Cadastro)
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Setor`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Setor', {
       useDataS...

**Gráficos** (1):

- **`chartSetor`** (bar)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalSetor`** (KPI)
- **`kpiSetoresUnicos`** (KPI)
- **`kpiMediaSetor`** (KPI)
- **`kpiSetorMaisAtivo`** (KPI)
- **`kpiTotalSetor`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-`
- **`kpiSetoresUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaSetor`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiSetorMaisAtivo`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (2):
- `loadSetor()`
- `updateSetorKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Setor` → `N/A`

---

#### 📊 **status**

**Arquivo**: `public\scripts\pages\ouvidoria\status.js`
**Descrição**: * Página: Status
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/aggregate/count-by?field=Status`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Status', {
       useData...

- **`/api/aggregate/count-by-status-mes?field=Status`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Status', {
   ...

**Gráficos** (2):

- **`chartStatusMes`** (bar)
  - Dados: `0`

- **`chartStatusPage`** (doughnut)
  - Dados: `false`

**KPIs e Cards** (8):

- **`kpiTotalStatus`** (KPI)
- **`kpiStatusUnicos`** (KPI)
- **`kpiStatusMaisComum`** (KPI)
- **`kpiTaxaConclusao`** (KPI)
- **`kpiTotalStatus`** (KPI)
  - Fonte do valor: `total.toLocaleString('`
- **`kpiStatusUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiStatusMaisComum`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiTaxaConclusao`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (4):
- `loadStatusPage()`
- `initStatusFilterListeners()`
- `renderStatusMesChart()`
- `updateStatusKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Status` → `N/A`
- API: `/api/aggregate/count-by-status-mes?field=Status` → `N/A`

---

#### 📊 **tema**

**Arquivo**: `public\scripts\pages\ouvidoria\tema.js`
**Descrição**: * Página: Por Tema
 * Análise de manifestações por tema
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (3):

- **`/api/aggregate/by-theme`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/by-theme', {       useDataStore: true,  ...

- **`/api/aggregate/count-by-status-mes?field=Tema`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Tema', {      ...

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {       useDataStore: true,      ...

**Gráficos** (3):

- **`chartTema`** (bar)
  - Dados: `labels`

- **`chartTemaMes`** (bar)
  - Dados: `labels`

- **`chartStatusTema`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalTema`** (KPI)
- **`kpiTemasUnicos`** (KPI)
- **`kpiMediaTema`** (KPI)
- **`kpiTemaMaisComum`** (KPI)
- **`kpiTotalTema`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiTemasUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaTema`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiTemaMaisComum`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (7):
- `loadTema()`
- `initTemaFilterListeners()`
- `renderTemaChart()`
- `renderStatusTemaChart()`
- `renderTemaMesChart()`
- `updateTemaKPIs()`
- `renderTemasList()`

**Fontes de Dados**:
- API: `/api/aggregate/by-theme` → `N/A`
- API: `/api/aggregate/count-by-status-mes?field=Tema` → `N/A`
- API: `/api/dashboard-data` → `N/A`

---

#### 📊 **tempo-medio**

**Arquivo**: `public\scripts\pages\ouvidoria\tempo-medio.js`
**Descrição**: * Página: Tempo Médio
 * Análise do tempo médio de atendimento em dias
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (14):

- **`/api/stats/average-time/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/stats/average-time/by-month', {
       fallback: [...

- **`/api/stats/average-time/stats?meses=${encodeURIComponent(mesSelecionado)}``**
  - Tipo: direct
  - Contexto: /api/stats/average-time/stats?meses=${encodeURIComponent(mesSelecionado)}`
     ...

- **`/api/stats/average-time/stats`**
  - Tipo: direct
  - Contexto: /api/stats/average-time/stats';
     
     if (window.Logger) {
       window.Lo...

- **`/api/stats/average-time/stats?meses=${encodeURIComponent(novoMes)}``**
  - Tipo: direct
  - Contexto: /api/stats/average-time/stats?meses=${encodeURIComponent(novoMes)}`
         : '...

- **`/api/stats/average-time?meses=${encodeURIComponent(mesSelecionado)}``**
  - Tipo: direct
  - Contexto: /api/stats/average-time?meses=${encodeURIComponent(mesSelecionado)}`
       : '/...

- **`/api/stats/average-time`**
  - Tipo: direct
  - Contexto: /api/stats/average-time';
     
     const dataOrgao = await window.dataLoader?....

- **`/api/stats/average-time/by-day?meses=${encodeURIComponent(mesSelecionado)}``**
  - Tipo: direct
  - Contexto: /api/stats/average-time/by-day?meses=${encodeURIComponent(mesSelecionado)}`
    ...

- **`/api/stats/average-time/by-day`**
  - Tipo: direct
  - Contexto: /api/stats/average-time/by-day';
     
     const dataDia = await window.dataLoa...

- **`/api/stats/average-time/by-week?meses=${encodeURIComponent(mesSelecionado)}``**
  - Tipo: direct
  - Contexto: /api/stats/average-time/by-week?meses=${encodeURIComponent(mesSelecionado)}`
   ...

- **`/api/stats/average-time/by-week`**
  - Tipo: direct
  - Contexto: /api/stats/average-time/by-week';
     
     const dataSemana = await window.dat...

- **`/api/stats/average-time/by-unit?meses=${encodeURIComponent(mesSelecionado)}``**
  - Tipo: direct
  - Contexto: /api/stats/average-time/by-unit?meses=${encodeURIComponent(mesSelecionado)}`
   ...

- **`/api/stats/average-time/by-unit`**
  - Tipo: direct
  - Contexto: /api/stats/average-time/by-unit';
     
     const dataUnidade = await window.da...

- **`/api/stats/average-time/by-month-unit?meses=${encodeURIComponent(mesSelecionado)}``**
  - Tipo: direct
  - Contexto: /api/stats/average-time/by-month-unit?meses=${encodeURIComponent(mesSelecionado)...

- **`/api/stats/average-time/by-month-unit`**
  - Tipo: direct
  - Contexto: /api/stats/average-time/by-month-unit';
     
     const dataUnidadeMes = await ...

**Gráficos** (6):

- **`chartTempoMedio`** (bar)
  - Dados: `labels`

- **`chartTempoMedioUnidade`** (bar)
  - Dados: `labels`

- **`chartTempoMedioMes`** (line)
  - Dados: `labels`

- **`chartTempoMedioDia`** (line)
  - Dados: `labels`

- **`chartTempoMedioSemana`** (line)
  - Dados: `labels`

- **`chartTempoMedioUnidadeMes`** (line)
  - Dados: `labels`

**Sistemas Globais Usados**: `dataLoader`, `dataStore`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (8):
- `destroyChartSafely()`
- `destroyAllTempoMedioCharts()`
- `loadTempoMedio()`
- `popularDropdownMeses()`
- `renderTempoMedioStats()`
- `renderTempoMedioCharts()`
- `renderTempoMedioRanking()`
- `loadSecondaryTempoMedioData()`

**Fontes de Dados**:
- API: `/api/stats/average-time/by-month` → `N/A`
- API: `/api/stats/average-time/stats?meses=${encodeURIComponent(mesSelecionado)}`` → `N/A`
- API: `/api/stats/average-time/stats` → `N/A`
- API: `/api/stats/average-time/stats?meses=${encodeURIComponent(novoMes)}`` → `N/A`
- API: `/api/stats/average-time?meses=${encodeURIComponent(mesSelecionado)}`` → `N/A`
- API: `/api/stats/average-time` → `N/A`
- API: `/api/stats/average-time/by-day?meses=${encodeURIComponent(mesSelecionado)}`` → `N/A`
- API: `/api/stats/average-time/by-day` → `N/A`
- API: `/api/stats/average-time/by-week?meses=${encodeURIComponent(mesSelecionado)}`` → `N/A`
- API: `/api/stats/average-time/by-week` → `N/A`
- API: `/api/stats/average-time/by-unit?meses=${encodeURIComponent(mesSelecionado)}`` → `N/A`
- API: `/api/stats/average-time/by-unit` → `N/A`
- API: `/api/stats/average-time/by-month-unit?meses=${encodeURIComponent(mesSelecionado)}`` → `N/A`
- API: `/api/stats/average-time/by-month-unit` → `N/A`

---

#### 📊 **tipo**

**Arquivo**: `public\scripts\pages\ouvidoria\tipo.js`
**Descrição**: * Página: Tipos de Manifestação
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Tipo`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Tipo', {
       useDataSt...

**Gráficos** (1):

- **`chartTipo`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalTipo`** (KPI)
- **`kpiTiposUnicos`** (KPI)
- **`kpiMediaTipo`** (KPI)
- **`kpiTipoMaisComum`** (KPI)
- **`kpiTotalTipo`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiTiposUnicos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaTipo`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiTipoMaisComum`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `config`

**Funções Principais** (2):
- `loadTipo()`
- `updateTipoKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=Tipo` → `N/A`

---

#### 📊 **uac**

**Arquivo**: `public\scripts\pages\ouvidoria\uac.js`
**Descrição**: * Página: UAC (Unidade de Atendimento ao Cidadão)
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=UAC`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=UAC', {
       useDataSto...

**Gráficos** (1):

- **`chartUAC`** (bar)
  - Dados: `labels`

**KPIs e Cards** (8):

- **`kpiTotalUAC`** (KPI)
- **`kpiUACsUnicas`** (KPI)
- **`kpiMediaUAC`** (KPI)
- **`kpiUACMaisAtiva`** (KPI)
- **`kpiTotalUAC`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiUACsUnicas`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiMediaUAC`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiUACMaisAtiva`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (2):
- `loadUAC()`
- `updateUACKPIs()`

**Fontes de Dados**:
- API: `/api/aggregate/count-by?field=UAC` → `N/A`

---

#### 📊 **unidades-saude**

**Arquivo**: `public\scripts\pages\ouvidoria\unidades-saude.js`
**Descrição**: * Página: Unidades de Saúde (Unificada)
 * Página única com dropdown para selecionar unidades
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/unit/${encodeURIComponent(unidade.busca)}`,`**
  - Tipo: direct
  - Variável: `data`
  - Contexto: /api/unit/${encodeURIComponent(unidade.busca)}`, {
       useDataStore: true,
  ...

**KPIs e Cards** (8):

- **`kpiTotalUnidadeSaude`** (KPI)
- **`kpiAssuntosUnicosUnidade`** (KPI)
- **`kpiTiposUnicosUnidade`** (KPI)
- **`kpiAssuntoMaisComumUnidade`** (KPI)
- **`kpiTotalUnidadeSaude`** (KPI)
- **`kpiAssuntosUnicosUnidade`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiTiposUnicosUnidade`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiAssuntoMaisComumUnidade`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (8):
- `loadUnidadesSaude()`
- `popularDropdown()`
- `mostrarMensagemSelecao()`
- `carregarDadosUnidade()`
- `renderUnidadeAssuntosList()`
- `renderUnidadeTiposChart()`
- `initUnidadesSaudeFilterListeners()`
- `updateUnidadesSaudeKPIs()`

**Fontes de Dados**:
- API: `/api/unit/${encodeURIComponent(unidade.busca)}`,` → `data`

---

#### 📊 **unit**

**Arquivo**: `public\scripts\pages\ouvidoria\unit.js`
**Descrição**: * Página: Unidades de Saúde (Dinâmico)
 * Páginas dinâmicas para cada unidade de saúde
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/unit/${encodeURIComponent(searchName)}`,`**
  - Tipo: direct
  - Variável: `data`
  - Contexto: /api/unit/${encodeURIComponent(searchName)}`, {
       useDataStore: true,
     ...

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (3):
- `loadUnit()`
- `renderUnitAssuntosList()`
- `renderUnitTiposChart()`

**Fontes de Dados**:
- API: `/api/unit/${encodeURIComponent(searchName)}`,` → `data`

---

#### 📊 **vencimento**

**Arquivo**: `public\scripts\pages\ouvidoria\vencimento.js`
**Descrição**: * Página: Vencimento
 * Protocolos próximos de vencer ou já vencidos
 * 
 * Mostra protocolos com:
 * - Protocolo
 * - Setor
 * - Informações (o que é)
 * - Secretaria
 * - Data de vencimento
 * - Dias restantes
 * 
 * Filtros disponíveis:
 * - Vencidos
 * - 3 dias, 7 dias, 15 dias, 30 dias
 * - Prazo customizado
 * - Filtro por secretaria

**APIs Utilizadas** (4):

- **`/api/distinct?field=Secretaria`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/distinct?field=Secretaria', {         useDataStore...

- **`/api/secretarias`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/secretarias', {             useDataStore: true,   ...

- **`/api/vencimento?filtro=${encodeURIComponent(filtro)}`;`**
  - Tipo: direct
  - Contexto: /api/vencimento?filtro=${encodeURIComponent(filtro)}`;     if (secretariaFiltro)...

- **`/api/vencimento?filtro=${encodeURIComponent(filtroAtual)}`;`**
  - Tipo: direct
  - Contexto: /api/vencimento?filtro=${encodeURIComponent(filtroAtual)}`;     if (secretariaFi...

**KPIs e Cards** (8):

- **`kpiTotalVencimento`** (KPI)
- **`kpiVencidos`** (KPI)
- **`kpiVencendo3`** (KPI)
- **`kpiVencendo7`** (KPI)
- **`kpiTotalVencimento`** (KPI)
- **`kpiVencidos`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR`
- **`kpiVencendo3`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`
- **`kpiVencendo7`** (KPI)
  - Fonte do valor: `total.toLocaleString('pt-BR')`

**Sistemas Globais Usados**: `dataLoader`, `dataStore`, `chartCommunication`, `Logger`

**Funções Principais** (10):
- `loadVencimento()`
- `renderVencimentoTable()`
- `updateVencimentoCounter()`
- `getFiltroLabel()`
- `formatarData()`
- `truncateText()`
- `escapeHtml()`
- `popularDropdownSecretarias()`
- `initVencimentoListeners()`
- `recarregarVencimentos()`

**Fontes de Dados**:
- API: `/api/distinct?field=Secretaria` → `N/A`
- API: `/api/secretarias` → `N/A`
- API: `/api/vencimento?filtro=${encodeURIComponent(filtro)}`;` → `N/A`
- API: `/api/vencimento?filtro=${encodeURIComponent(filtroAtual)}`;` → `N/A`

---

#### 📊 **zeladoria-bairro**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-bairro.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (4):

- **`/api/zeladoria/count-by?field=bairro`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=bairro', {       useDataS...

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,  ...

- **`/api/zeladoria/geographic`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/geographic', {       useDataStore: true,...

- **`/api/zeladoria/count-by?field=origem`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=origem', {       useDataS...

**Gráficos** (2):

- **`zeladoria-bairro-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-bairro-mes-chart`** (bar)
  - Dados: `labels`

**KPIs e Cards** (1):

- **`zeladoria-bairro-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (7):
- `loadZeladoriaBairro()`
- `renderBairroMesChart()`
- `renderBairroRanking()`
- `renderBairroGeoInfo()`
- `renderBairroStats()`
- `loadBairroDadosAdicionais()`
- `updateZeladoriaBairroKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/count-by?field=bairro` → `N/A`
- API: `/api/zeladoria/by-month` → `N/A`
- API: `/api/zeladoria/geographic` → `N/A`
- API: `/api/zeladoria/count-by?field=origem` → `N/A`

---

#### 📊 **zeladoria-canal**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-canal.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/count-by?field=canal`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=canal', {       useDataSt...

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,  ...

**Gráficos** (2):

- **`zeladoria-canal-mes-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-canal-chart`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (1):

- **`zeladoria-canal-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (5):
- `loadZeladoriaCanal()`
- `renderCanalMesChart()`
- `renderCanalRanking()`
- `renderCanalStats()`
- `updateZeladoriaCanalKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/count-by?field=canal` → `N/A`
- API: `/api/zeladoria/by-month` → `N/A`

---

#### 📊 **zeladoria-categoria**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-categoria.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (3):

- **`/api/zeladoria/count-by?field=categoria`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=categoria', {       useDa...

- **`/api/zeladoria/by-categoria-departamento`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-categoria-departamento', {       useD...

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,  ...

**Gráficos** (3):

- **`zeladoria-categoria-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-categoria-mes-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-categoria-dept-chart`** (bar)
  - Dados: `departamentos`

**KPIs e Cards** (1):

- **`zeladoria-categoria-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (6):
- `loadZeladoriaCategoria()`
- `renderCategoriaMesChart()`
- `renderCategoriaDepartamentoChart()`
- `renderCategoriaRanking()`
- `renderCategoriaStats()`
- `updateZeladoriaCategoriaKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/count-by?field=categoria` → `N/A`
- API: `/api/zeladoria/by-categoria-departamento` → `N/A`
- API: `/api/zeladoria/by-month` → `N/A`

---

#### 📊 **zeladoria-colab**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-colab.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (10):

- **`/api/colab/categories?type=post`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/colab/categories?type=post', {
       useDataStore...

- **`/api/colab/posts`**
  - Tipo: fetch
  - Contexto: fetch('/api/colab/posts', {
       method: 'POST',
       headers: { 'Content-Ty...

- **`/api/colab/posts?start_date=${encodeURIComponent(startDateStr)}&end_date=${encodeURIComponent(endDateStr)}`,`**
  - Tipo: direct
  - Variável: `demandas`
  - Contexto: /api/colab/posts?start_date=${encodeURIComponent(startDateStr)}&end_date=${encod...

- **`/api/colab/posts?start_date=${encodeURIComponent(startDateStr)}&end_date=${encodeURIComponent(endDateStr)}`;`**
  - Tipo: direct
  - Contexto: /api/colab/posts?start_date=${encodeURIComponent(startDateStr)}&end_date=${encod...

- **`/api/colab/posts/${id}/accept``**
  - Tipo: direct
  - Contexto: /api/colab/posts/${id}/accept` : `/api/colab/events/${id}/accept`;
     const re...

- **`/api/colab/events/${id}/accept`;`**
  - Tipo: direct
  - Contexto: /api/colab/events/${id}/accept`;
     const response = await fetch(endpoint, { m...

- **`/api/colab/posts/${id}/solve``**
  - Tipo: direct
  - Contexto: /api/colab/posts/${id}/solve` : `/api/colab/events/${id}/solve`;
     const resp...

- **`/api/colab/events/${id}/solve`;`**
  - Tipo: direct
  - Contexto: /api/colab/events/${id}/solve`;
     const response = await fetch(endpoint, {
  ...

- **`/api/colab/posts/${id}``**
  - Tipo: direct
  - Contexto: /api/colab/posts/${id}` : `/api/colab/events/${id}`;
     const response = await...

- **`/api/colab/events/${id}`;`**
  - Tipo: direct
  - Contexto: /api/colab/events/${id}`;
     const response = await fetch(endpoint);
     
   ...

**Gráficos** (2):

- **`chartZeladoriaCategoria`** (bar)
  - Dados: `true`

- **`chartZeladoriaStatus`** (doughnut)
  - Dados: `statusCounts`

**KPIs e Cards** (1):

- **`totalDemandas`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `config`

**Funções Principais** (5):
- `loadZeladoriaOverview()`
- `loadColabDemandas()`
- `loadZeladoriaColabCriar()`
- `criarDemanda()`
- `loadZeladoriaColabCategorias()`

**Fontes de Dados**:
- API: `/api/colab/categories?type=post` → `N/A`
- API: `/api/colab/posts` → `N/A`
- API: `/api/colab/posts?start_date=${encodeURIComponent(startDateStr)}&end_date=${encodeURIComponent(endDateStr)}`,` → `demandas`
- API: `/api/colab/posts?start_date=${encodeURIComponent(startDateStr)}&end_date=${encodeURIComponent(endDateStr)}`;` → `N/A`
- API: `/api/colab/posts/${id}/accept`` → `N/A`
- API: `/api/colab/events/${id}/accept`;` → `N/A`
- API: `/api/colab/posts/${id}/solve`` → `N/A`
- API: `/api/colab/events/${id}/solve`;` → `N/A`
- API: `/api/colab/posts/${id}`` → `N/A`
- API: `/api/colab/events/${id}`;` → `N/A`

---

#### 📊 **zeladoria-departamento**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-departamento.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/count-by?field=departamento`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=departamento', {       us...

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,  ...

**Gráficos** (2):

- **`zeladoria-departamento-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-departamento-mes-chart`** (bar)
  - Dados: `labels`

**KPIs e Cards** (1):

- **`zeladoria-departamento-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (5):
- `loadZeladoriaDepartamento()`
- `renderDepartamentoMesChart()`
- `renderDepartamentoRanking()`
- `renderDepartamentoStats()`
- `updateZeladoriaDepartamentoKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/count-by?field=departamento` → `N/A`
- API: `/api/zeladoria/by-month` → `N/A`

---

#### 📊 **zeladoria-geografica**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-geografica.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (1):

- **`/api/zeladoria/geographic`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/geographic', {
       useDataStore: true...

**KPIs e Cards** (1):

- **`zeladoria-geografica-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartCommunication`, `Logger`

**Funções Principais** (2):
- `loadZeladoriaGeografica()`
- `updateZeladoriaGeograficaKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/geographic` → `N/A`

---

#### 📊 **zeladoria-main**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-main.js`
**Descrição**: Sem descrição

**Sistemas Globais Usados**: `Logger`

**Funções Principais** (3):
- `loadSection()`
- `getPageLoader()`
- `initNavigation()`

---

#### 📊 **zeladoria-mensal**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-mensal.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {
       useDataStore: true,
...

- **`/api/zeladoria/by-status-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-status-month', {
       useDataStore:...

**Gráficos** (2):

- **`zeladoria-mensal-status-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-mensal-chart`** (line)
  - Dados: `labels`

**KPIs e Cards** (1):

- **`zeladoria-mensal-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (4):
- `loadZeladoriaMensal()`
- `renderMensalStatusChart()`
- `renderMensalStats()`
- `updateZeladoriaMensalKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/by-month` → `N/A`
- API: `/api/zeladoria/by-status-month` → `N/A`

---

#### 📊 **zeladoria-overview**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-overview.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (5):

- **`/api/zeladoria/stats`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/stats', {
       useDataStore: true,
   ...

- **`/api/zeladoria/count-by?field=status`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=status', {
       useData...

- **`/api/zeladoria/count-by?field=categoria`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=categoria', {
       useD...

- **`/api/zeladoria/count-by?field=departamento`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=departamento', {
       u...

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {
       useDataStore: true,
...

**Gráficos** (4):

- **`zeladoria-chart-categoria`** (bar)
  - Dados: `labels`

- **`zeladoria-chart-departamento`** (bar)
  - Dados: `labels`

- **`zeladoria-chart-mensal`** (line)
  - Dados: `labels`

- **`zeladoria-chart-status`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (1):

- **`zeladoria-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`

**Funções Principais** (1):
- `loadZeladoriaOverview()`

**Fontes de Dados**:
- API: `/api/zeladoria/stats` → `N/A`
- API: `/api/zeladoria/count-by?field=status` → `N/A`
- API: `/api/zeladoria/count-by?field=categoria` → `N/A`
- API: `/api/zeladoria/count-by?field=departamento` → `N/A`
- API: `/api/zeladoria/by-month` → `N/A`

---

#### 📊 **zeladoria-responsavel**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-responsavel.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/count-by?field=responsavel`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=responsavel', {       use...

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,  ...

**Gráficos** (2):

- **`zeladoria-responsavel-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-responsavel-mes-chart`** (bar)
  - Dados: `labels`

**KPIs e Cards** (1):

- **`zeladoria-responsavel-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (5):
- `loadZeladoriaResponsavel()`
- `renderResponsavelMesChart()`
- `renderResponsavelRanking()`
- `renderResponsavelStats()`
- `updateZeladoriaResponsavelKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/count-by?field=responsavel` → `N/A`
- API: `/api/zeladoria/by-month` → `N/A`

---

#### 📊 **zeladoria-status**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-status.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (3):

- **`/api/zeladoria/count-by?field=status`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=status', {       useDataS...

- **`/api/zeladoria/by-status-month`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-status-month', {       useDataStore: ...

- **`/api/zeladoria/stats`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/stats', {       useDataStore: true,     ...

**Gráficos** (2):

- **`zeladoria-status-mes-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-status-chart`** (doughnut)
  - Dados: `labels`

**KPIs e Cards** (1):

- **`zeladoria-status-kpi-total`** (Element)

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (5):
- `loadZeladoriaStatus()`
- `renderStatusMesChart()`
- `renderStatusRanking()`
- `renderStatusStats()`
- `updateZeladoriaStatusKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/count-by?field=status` → `N/A`
- API: `/api/zeladoria/by-status-month` → `N/A`
- API: `/api/zeladoria/stats` → `N/A`

---

#### 📊 **zeladoria-tempo**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-tempo.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/stats`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/stats', {       useDataStore: true,     ...

- **`/api/zeladoria/time-series`**
  - Tipo: dataLoader
  - Contexto: window.dataLoader?.load('/api/zeladoria/time-series', {       useDataStore: true...

**Gráficos** (2):

- **`zeladoria-tempo-distribuicao-chart`** (bar)
  - Dados: `labels`

- **`zeladoria-tempo-mes-chart`** (line)
  - Dados: `labels`

**Sistemas Globais Usados**: `dataLoader`, `chartFactory`, `chartCommunication`, `Logger`, `dateUtils`

**Funções Principais** (6):
- `loadZeladoriaTempo()`
- `renderTempoKPIs()`
- `renderTempoMesChart()`
- `renderTempoDistribuicao()`
- `renderTempoAnalises()`
- `updateZeladoriaTempoKPIs()`

**Fontes de Dados**:
- API: `/api/zeladoria/stats` → `N/A`
- API: `/api/zeladoria/time-series` → `N/A`

---

## 🏗️ ELEMENTOS HTML MAPEADOS

### **home**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **main**

- **KPIs**: 6 (kpiTotal, kpiTotalDelta, kpi7, kpi7Delta, kpi30...)
- **Gráficos**: 0 ()
- **Cards**: 3
- **Filtros**: 0 ()

### **orgao-mes**

- **KPIs**: 4 (kpiTotalOrgaos, kpiOrgaosUnicos, kpiMediaOrgao, kpiPeriodo)
- **Gráficos**: 2 (chartOrgaoMes, chartTopOrgaosBar)
- **Cards**: 11
- **Filtros**: 2 (filtroMesOrgaoMes, filtroStatusOrgaoMes)

### **tempo-medio**

- **KPIs**: 0 ()
- **Gráficos**: 6 (chartTempoMedio, chartTempoMedioDia, chartTempoMedioSemana, chartTempoMedioMes, chartTempoMedioUnidade...)
- **Cards**: 11
- **Filtros**: 1 (selectMesTempoMedio)

### **vencimento**

- **KPIs**: 4 (kpiTotalVencimento, kpiVencidos, kpiVencendo3, kpiVencendo7)
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 3 (filtroLabelVencimento, selectFiltroVencimento, selectSecretariaVencimento)

### **notificacoes**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 8
- **Filtros**: 0 ()

### **tema**

- **KPIs**: 4 (kpiTotalTema, kpiTemasUnicos, kpiTemaMaisComum, kpiMediaTema)
- **Gráficos**: 3 (chartTema, chartStatusTema, chartTemaMes)
- **Cards**: 8
- **Filtros**: 0 ()

### **assunto**

- **KPIs**: 4 (kpiTotalAssunto, kpiAssuntosUnicos, kpiAssuntoMaisComum, kpiMediaAssunto)
- **Gráficos**: 3 (chartAssunto, chartStatusAssunto, chartAssuntoMes)
- **Cards**: 8
- **Filtros**: 0 ()

### **tipo**

- **KPIs**: 4 (kpiTotalTipo, kpiTiposUnicos, kpiTipoMaisComum, kpiMediaTipo)
- **Gráficos**: 1 (chartTipo)
- **Cards**: 6
- **Filtros**: 0 ()

### **setor**

- **KPIs**: 4 (kpiTotalSetor, kpiSetoresUnicos, kpiSetorMaisAtivo, kpiMediaSetor)
- **Gráficos**: 1 (chartSetor)
- **Cards**: 6
- **Filtros**: 0 ()

### **uac**

- **KPIs**: 4 (kpiTotalUAC, kpiUACsUnicas, kpiUACMaisAtiva, kpiMediaUAC)
- **Gráficos**: 1 (chartUAC)
- **Cards**: 6
- **Filtros**: 0 ()

### **responsavel**

- **KPIs**: 4 (kpiTotalResponsavel, kpiResponsaveisUnicos, kpiResponsavelMaisAtivo, kpiMediaResponsavel)
- **Gráficos**: 1 (chartResponsavel)
- **Cards**: 6
- **Filtros**: 0 ()

### **canal**

- **KPIs**: 4 (kpiTotalCanal, kpiCanaisUnicos, kpiCanalMaisUsado, kpiMediaCanal)
- **Gráficos**: 1 (chartCanal)
- **Cards**: 6
- **Filtros**: 0 ()

### **prioridade**

- **KPIs**: 4 (kpiTotalPrioridade, kpiPrioridadesUnicas, kpiPrioridadeMaisComum, kpiMediaPrioridade)
- **Gráficos**: 1 (chartPrioridade)
- **Cards**: 6
- **Filtros**: 0 ()

### **categoria**

- **KPIs**: 4 (kpiTotalCategoria, kpiCategoriasUnicas, kpiCategoriaMaisComum, kpiMediaCategoria)
- **Gráficos**: 2 (chartCategoria, chartCategoriaMes)
- **Cards**: 6
- **Filtros**: 0 ()

### **status**

- **KPIs**: 4 (kpiTotalStatus, kpiStatusUnicos, kpiStatusMaisComum, kpiTaxaConclusao)
- **Gráficos**: 2 (chartStatusPage, chartStatusMes)
- **Cards**: 6
- **Filtros**: 0 ()

### **bairro**

- **KPIs**: 4 (kpiTotalBairro, kpiBairrosUnicos, kpiBairroMaisAtivo, kpiMediaBairro)
- **Gráficos**: 2 (chartBairro, chartBairroMes)
- **Cards**: 6
- **Filtros**: 0 ()

### **cadastrante**

- **KPIs**: 4 (kpiTotalCadastrante, kpiServidoresUnicos, kpiUnidadesUnicas, kpiServidorMaisAtivo)
- **Gráficos**: 1 (chartCadastranteMes)
- **Cards**: 8
- **Filtros**: 0 ()

### **reclamacoes**

- **KPIs**: 4 (kpiTotalReclamacoes, kpiTotalDenuncias, kpiAssuntosUnicos, kpiAssuntoMaisComum)
- **Gráficos**: 2 (chartReclamacoesTipo, chartReclamacoesMes)
- **Cards**: 7
- **Filtros**: 0 ()

### **secretaria**

- **KPIs**: 4 (kpiTotalSecretaria, kpiSecretariasUnicas, kpiSecretariaMaisAtiva, kpiMediaSecretaria)
- **Gráficos**: 2 (chartSecretaria, chartSecretariaMes)
- **Cards**: 7
- **Filtros**: 0 ()

### **secretarias-distritos**

- **KPIs**: 4 (kpiTotalSecretariasDistritos, kpiTotalDistritos, kpiTotalBairros, kpiMediaSecretariasDistrito)
- **Gráficos**: 1 (chartSecretariasDistritos)
- **Cards**: 6
- **Filtros**: 0 ()

### **projecao-2026**

- **KPIs**: 1 (kpisProjecao)
- **Gráficos**: 6 (chartProjecaoMensal, chartCrescimentoPercentual, chartSazonalidade, chartComparacaoAnual, chartProjecaoTema...)
- **Cards**: 14
- **Filtros**: 0 ()

### **filtros-avancados**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 7
- **Filtros**: 14 (filtroProtocolo, filtroStatusDemanda, filtroUnidadeCadastro, filtroCanal, filtroServidor...)

### **cora-chat**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 1
- **Filtros**: 0 ()

### **unidades-saude**

- **KPIs**: 4 (kpiTotalUnidadeSaude, kpiAssuntosUnicosUnidade, kpiAssuntoMaisComumUnidade, kpiTiposUnicosUnidade)
- **Gráficos**: 0 ()
- **Cards**: 4
- **Filtros**: 1 (selectUnidade)

### **unit-adao**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-cer-iv**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-hospital-olho**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-hospital-duque**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-hospital-infantil**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-hospital-moacyr**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-maternidade-santa-cruz**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-upa-beira-mar**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-uph-pilar**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-uph-saracuruna**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-uph-xerem**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-hospital-veterinario**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-upa-walter-garcia**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-uph-campos-eliseos**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-uph-parque-equitativa**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-ubs-antonio-granja**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-upa-sarapui**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **unit-uph-imbarie**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **zeladoria-home**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()

### **zeladoria-overview**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 8
- **Filtros**: 0 ()

### **zeladoria-status**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

### **zeladoria-categoria**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

### **zeladoria-departamento**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

### **zeladoria-bairro**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

### **zeladoria-responsavel**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

### **zeladoria-canal**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

### **zeladoria-tempo**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

### **zeladoria-mensal**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

### **zeladoria-geografica**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()

---

## 📊 RESUMO E ESTATÍSTICAS

### Totais:
- **Páginas Analisadas**: 37
- **Sistemas Globais**: 6
- **Controllers**: 24
- **Total de APIs**: 108
- **Total de Gráficos**: 72
- **Total de KPIs/Cards**: 170

### Por Tipo de Página:
- **page**: 37 páginas
---

## 📝 NOTAS IMPORTANTES

1. **Este mapeamento foi gerado automaticamente** pelo script `map-detailed.js`
2. **Para atualizar**: Execute `node maps/map-detailed.js`
3. **Alguns elementos podem não ser detectados** se usarem padrões não convencionais
4. **APIs são extraídas** de chamadas `window.dataLoader.load()`, `fetch()` e padrões `/api/*`
5. **Gráficos são identificados** por IDs de canvas e chamadas de criação de gráficos
6. **KPIs são identificados** por IDs que começam com `kpi` e elementos com classes `glass`

---

**Fim do Mapeamento Detalhado**
