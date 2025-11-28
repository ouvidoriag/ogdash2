# 📋 LISTA COMPLETA: FILTROS E APIs DO SISTEMA

## 🔍 FILTROS DISPONÍVEIS

### Campos que podem ser filtrados:

#### **Campos Principais**
1. **`protocolo`** - Protocolo da manifestação
   - Operação: `contains` (busca parcial)
   - Exemplo: `{ field: 'protocolo', op: 'contains', value: '2024' }`

2. **`Status`** / **`StatusDemanda`** - Status da demanda
   - Operação: `eq` (igual)
   - Exemplo: `{ field: 'Status', op: 'eq', value: 'Concluído' }`

3. **`Tipo`** / **`TipoManifestacao`** - Tipo de manifestação
   - Operação: `eq`
   - Exemplo: `{ field: 'Tipo', op: 'eq', value: 'Reclamação' }`

4. **`Tema`** - Tema da manifestação
   - Operação: `eq`
   - Exemplo: `{ field: 'Tema', op: 'eq', value: 'Saúde' }`

5. **`Assunto`** - Assunto específico
   - Operação: `eq`
   - Exemplo: `{ field: 'Assunto', op: 'eq', value: 'Atendimento' }`

6. **`Categoria`** - Categoria (mapeado para `tema`)
   - Operação: `eq`
   - Exemplo: `{ field: 'Categoria', op: 'eq', value: 'Infraestrutura' }`

#### **Campos de Organização**
7. **`Orgaos`** / **`Secretaria`** - Órgão/Secretaria responsável
   - Operação: `contains` ou `eq`
   - Exemplo: `{ field: 'Orgaos', op: 'contains', value: 'Secretaria' }`

8. **`UnidadeCadastro`** / **`Setor`** / **`UAC`** - Unidade de cadastro
   - Operação: `eq`
   - Exemplo: `{ field: 'UnidadeCadastro', op: 'eq', value: 'UAC Centro' }`

9. **`unidadeSaude`** / **`UnidadeSaude`** - Unidade de saúde
   - Operação: `eq`
   - Exemplo: `{ field: 'unidadeSaude', op: 'eq', value: 'UBS X' }`

10. **`Servidor`** - Servidor responsável
    - Operação: `eq`
    - Exemplo: `{ field: 'Servidor', op: 'eq', value: 'João Silva' }`

11. **`Responsavel`** - Responsável pelo tratamento
    - Operação: `eq`
    - Exemplo: `{ field: 'Responsavel', op: 'eq', value: 'Maria Santos' }`

#### **Campos Geográficos**
12. **`Bairro`** - Bairro (mapeado para `endereco`)
    - Operação: `contains`
    - Exemplo: `{ field: 'Bairro', op: 'contains', value: 'Centro' }`

#### **Campos de Atendimento**
13. **`Canal`** - Canal de atendimento
    - Operação: `eq`
    - Exemplo: `{ field: 'Canal', op: 'eq', value: 'Telefone' }`

14. **`Prioridade`** - Prioridade da manifestação
    - Operação: `eq`
    - Exemplo: `{ field: 'Prioridade', op: 'eq', value: 'Alta' }`

#### **Campos de Data**
15. **`Data`** / **`dataDaCriacao`** - Data de criação
    - Operação: `contains` (busca por mês YYYY-MM)
    - Exemplo: `{ field: 'Data', op: 'contains', value: '2024-01' }`

#### **Campos de Verificação**
16. **`verificado`** - Status de verificação
    - Operação: `eq`
    - Exemplo: `{ field: 'verificado', op: 'eq', value: 'Sim' }`

---

## 🌐 APIS DISPONÍVEIS

### 📊 **DADOS GERAIS** (`/api/*`)

#### Resumo e Dashboard
- **`GET /api/summary`**
  - Resumo geral com KPIs principais
  - Query params: `servidor`, `unidadeCadastro`
  - Retorna: total, por status, por tipo, etc.

- **`GET /api/dashboard-data`**
  - Dados completos para dashboard (agregações paralelas)
  - Query params: `servidor`, `unidadeCadastro`
  - Retorna: múltiplas agregações em paralelo

#### Registros
- **`GET /api/records`**
  - Lista paginada de registros
  - Query params: `page`, `pageSize`, `servidor`, `unidadeCadastro`, `status`, `tema`, `assunto`
  - Retorna: `{ data, total, page, pageSize, totalPages }`

- **`POST /api/filter`**
  - Filtro dinâmico de registros
  - Body: `{ filters: [{ field, op, value }], originalUrl }`
  - Retorna: Array de registros filtrados

#### Valores Distintos
- **`GET /api/distinct`**
  - Valores distintos de um campo
  - Query params: `field`, `servidor`, `unidadeCadastro`
  - Retorna: Array de valores únicos

#### Unidades
- **`GET /api/unit/:unitName`**
  - Dados de uma unidade específica (UAC, Responsável, Órgãos, Unidade de Saúde)
  - Params: `unitName` - Nome da unidade
  - Retorna: Dados agregados da unidade

#### Reclamações e Denúncias
- **`GET /api/complaints-denunciations`**
  - Reclamações e denúncias agregadas
  - Retorna: Agregação por tipo

#### SLA
- **`GET /api/sla/summary`**
  - Resumo de SLA (concluídos, verde claro 0-30, amarelo 31-60, vermelho 61+)
  - Query params: `servidor`, `unidadeCadastro`, `meses`
  - Retorna: Distribuição por faixas de tempo

#### Vencimentos
- **`GET /api/vencimento`**
  - Protocolos próximos de vencer ou já vencidos
  - Query params: `filtro` (vencidos, 3, 7, 15, 30), `servidor`, `unidadeCadastro`
  - Retorna: Lista de protocolos com prazo

#### Utilitários
- **`GET /api/meta/aliases`**
  - Metadados e aliases de campos do sistema
  - Retorna: Mapeamento de campos

- **`POST /api/chat/reindex`**
  - Reindexar contexto do chat para busca semântica
  - Body: `{ force: boolean }`

- **`GET /api/export/database`**
  - Exportar dados do banco de dados
  - Retorna: Arquivo de exportação

---

### 📈 **AGREGAÇÕES** (`/api/aggregate/*`)

- **`GET /api/aggregate/count-by`**
  - Contagem de registros agrupados por campo
  - Query params: `field`, `servidor`, `unidadeCadastro`
  - Retorna: `{ [valor]: count }`

- **`GET /api/aggregate/time-series`**
  - Série temporal de registros
  - Query params: `servidor`, `unidadeCadastro`, `startDate`, `endDate`
  - Retorna: Array de `{ date, count }`

- **`GET /api/aggregate/by-theme`**
  - Agregação por tema
  - Query params: `servidor`, `unidadeCadastro`
  - Retorna: Agregação por tema

- **`GET /api/aggregate/by-subject`**
  - Agregação por assunto
  - Query params: `servidor`, `unidadeCadastro`
  - Retorna: Agregação por assunto

- **`GET /api/aggregate/by-server`**
  - Agregação por servidor
  - Query params: `servidor`
  - Retorna: Agregação por servidor

- **`GET /api/aggregate/by-month`**
  - Agregação por mês
  - Query params: `servidor`, `unidadeCadastro`, `meses`
  - Retorna: Array de `{ month, count }`

- **`GET /api/aggregate/by-day`**
  - Agregação por dia
  - Query params: `servidor`, `unidadeCadastro`, `startDate`, `endDate`
  - Retorna: Array de `{ date, count }`

- **`GET /api/aggregate/heatmap`**
  - Dados para heatmap (mês x dimensão)
  - Query params: `dim` (Secretaria, Setor, Tipo, Categoria, etc.), `servidor`, `unidadeCadastro`
  - Retorna: Matriz de dados para heatmap

- **`GET /api/aggregate/filtered`**
  - Agregação com filtros customizados
  - Query params: `filters` (JSON), `servidor`, `unidadeCadastro`
  - Retorna: Agregação filtrada

- **`GET /api/aggregate/sankey-flow`**
  - Dados para diagrama Sankey (fluxo entre dimensões)
  - Query params: `from`, `to`, `servidor`, `unidadeCadastro`
  - Retorna: Dados para Sankey

- **`GET /api/aggregate/count-by-status-mes`**
  - Contagem de status por mês
  - Query params: `servidor`, `unidadeCadastro`, `meses`
  - Retorna: Matriz status x mês

- **`GET /api/aggregate/count-by-orgao-mes`**
  - Contagem de órgão por mês
  - Query params: `servidor`, `unidadeCadastro`, `meses`
  - Retorna: Matriz órgão x mês

- **`GET /api/aggregate/by-district`**
  - Agregação por distrito (geográfico)
  - Query params: `servidor`, `unidadeCadastro`
  - Retorna: Agregação por distrito

---

### 📊 **ESTATÍSTICAS** (`/api/stats/*`)

- **`GET /api/stats/average-time`**
  - Tempo médio de resolução de manifestações
  - Query params: `servidor`, `unidadeCadastro`, `meses`, `apenasConcluidos`, `incluirZero`
  - Retorna: Tempo médio em dias

- **`GET /api/stats/average-time/by-day`**
  - Tempo médio agrupado por dia
  - Query params: `servidor`, `unidadeCadastro`, `startDate`, `endDate`
  - Retorna: Array de `{ date, averageTime }`

- **`GET /api/stats/average-time/by-week`**
  - Tempo médio agrupado por semana
  - Query params: `servidor`, `unidadeCadastro`, `startDate`, `endDate`
  - Retorna: Array de `{ week, averageTime }`

- **`GET /api/stats/average-time/by-month`**
  - Tempo médio agrupado por mês
  - Query params: `servidor`, `unidadeCadastro`, `meses`
  - Retorna: Array de `{ month, averageTime }`

- **`GET /api/stats/average-time/stats`**
  - Estatísticas completas de tempo (média, mediana, min, max, desvio padrão)
  - Query params: `servidor`, `unidadeCadastro`, `meses`, `apenasConcluidos`
  - Retorna: `{ mean, median, min, max, stdDev }`

- **`GET /api/stats/average-time/by-unit`**
  - Tempo médio agrupado por unidade
  - Query params: `servidor`, `unidadeCadastro`, `meses`, `apenasConcluidos`
  - Retorna: Array de `{ unit, averageTime }`

- **`GET /api/stats/average-time/by-month-unit`**
  - Tempo médio agrupado por mês e unidade (matriz)
  - Query params: `servidor`, `unidadeCadastro`, `meses`, `apenasConcluidos`
  - Retorna: Matriz mês x unidade

- **`GET /api/stats/status-overview`**
  - Visão geral de status com distribuição
  - Query params: `servidor`, `unidadeCadastro`
  - Retorna: Distribuição de status

---

### 🗺️ **GEOGRÁFICAS** (`/api/*`)

#### Secretarias
- **`GET /api/secretarias`**
  - Listar todas as secretarias
  - Retorna: Array de secretarias

- **`GET /api/secretarias/:district`**
  - Secretarias filtradas por distrito
  - Params: `district` - Nome ou código do distrito
  - Retorna: Array de secretarias do distrito

#### Distritos
- **`GET /api/distritos`**
  - Listar todos os distritos com estatísticas
  - Retorna: Array de distritos com stats

- **`GET /api/distritos/:code`**
  - Informações de um distrito específico
  - Params: `code` - Código do distrito
  - Retorna: Dados do distrito

- **`GET /api/distritos/:code/stats`**
  - Estatísticas detalhadas de um distrito
  - Params: `code` - Código do distrito
  - Retorna: Estatísticas do distrito

#### Bairros
- **`GET /api/bairros`**
  - Listar bairros
  - Query params: `distrito` (opcional) - Filtrar por distrito
  - Retorna: Array de bairros

#### Unidades de Saúde
- **`GET /api/unidades-saude`**
  - Listar unidades de saúde
  - Query params: `distrito`, `tipo`, `bairro` (opcionais)
  - Retorna: Array de unidades

- **`GET /api/unidades-saude/por-distrito`**
  - Agrupar unidades de saúde por distrito
  - Retorna: Agregação por distrito

- **`GET /api/unidades-saude/por-bairro`**
  - Agrupar unidades de saúde por bairro
  - Query params: `distrito` (opcional) - Filtrar por distrito
  - Retorna: Agregação por bairro

- **`GET /api/unidades-saude/por-tipo`**
  - Agrupar unidades de saúde por tipo
  - Retorna: Agregação por tipo

#### Saúde
- **`GET /api/saude/manifestacoes`**
  - Manifestações relacionadas a saúde
  - Retorna: Lista de manifestações de saúde

- **`GET /api/saude/por-distrito`**
  - Manifestações de saúde agrupadas por distrito
  - Retorna: Agregação por distrito

- **`GET /api/saude/por-tema`**
  - Manifestações de saúde agrupadas por tema
  - Retorna: Agregação por tema

- **`GET /api/saude/por-unidade`**
  - Manifestações de saúde agrupadas por unidade
  - Retorna: Agregação por unidade

#### Debug
- **`GET /api/debug/district-mapping`**
  - Testar mapeamento de endereço para distrito
  - Query params: `endereco` (obrigatório)
  - Retorna: Resultado do mapeamento

- **`POST /api/debug/district-mapping-batch`**
  - Testar mapeamento de múltiplos endereços
  - Body: `{ enderecos: string[] }`
  - Retorna: Array de resultados

---

### 🧹 **ZELADORIA** (`/api/zeladoria/*`)

- **`GET /api/zeladoria/summary`**
  - Resumo geral de dados de Zeladoria
  - Retorna: Resumo com KPIs

- **`GET /api/zeladoria/count-by`**
  - Contagem por campo
  - Query params: `field` (status, categoria, departamento, etc.)
  - Retorna: `{ [valor]: count }`

- **`GET /api/zeladoria/by-month`**
  - Agregação por mês
  - Retorna: Array de `{ month, count }`

- **`GET /api/zeladoria/time-series`**
  - Série temporal
  - Query params: `startDate`, `endDate` (opcional)
  - Retorna: Array de `{ date, count }`

- **`GET /api/zeladoria/records`**
  - Lista de registros com paginação
  - Query params: `page`, `limit`, `status`, `categoria`, `departamento`
  - Retorna: `{ data, total, page, pageSize }`

- **`GET /api/zeladoria/stats`**
  - Estatísticas gerais
  - Retorna: Estatísticas diversas

- **`GET /api/zeladoria/by-status-month`**
  - Status por mês
  - Retorna: Matriz status x mês

- **`GET /api/zeladoria/by-categoria-departamento`**
  - Categoria por Departamento
  - Retorna: Matriz categoria x departamento

- **`GET /api/zeladoria/geographic`**
  - Dados geográficos (bairros com coordenadas)
  - Retorna: Array de `{ bairro, lat, lng, count }`

---

### 🤖 **INTELIGÊNCIA ARTIFICIAL** (`/api/ai/*`)

- **`GET /api/ai/insights`**
  - Gerar insights inteligentes usando IA (Gemini)
  - Query params: `servidor`, `unidadeCadastro`
  - Retorna: `{ insights: [], patterns: [], geradoPorIA: boolean }`

---

### 💬 **CHAT** (`/api/chat/*`)

- **`GET /api/chat/messages`**
  - Listar todas as mensagens do chat
  - Query params: `limit` (opcional, padrão: 500)
  - Retorna: Array de mensagens

- **`POST /api/chat/messages`**
  - Criar nova mensagem no chat
  - Body: `{ text: string, sender: 'user' | 'assistant' }`
  - Retorna: Mensagem criada

---

### 💾 **CACHE** (`/api/cache/*`)

- **`GET /api/cache/status`**
  - Status completo do cache (memória, banco de dados, universal)
  - Retorna: Status detalhado do cache

- **`GET /api/cache/universal`**
  - Cache universal (desabilitado por padrão)
  - Retorna: Cache universal

- **`POST /api/cache/rebuild`**
  - Reconstruir cache universal manualmente
  - Retorna: Status da reconstrução

- **`POST /api/cache/clean-expired`**
  - Limpar entradas de cache expiradas
  - Retorna: Quantidade de entradas limpas

- **`POST /api/cache/clear-all`**
  - Limpar todo o cache (memória + banco de dados)
  - Retorna: Status da limpeza

- **`POST /api/cache/clear`**
  - Limpar cache em memória (compatibilidade)
  - Retorna: Status da limpeza

---

### 📧 **NOTIFICAÇÕES** (`/api/notifications/*`)

#### Autenticação
- **`GET /api/notifications/auth/url`**
  - Obter URL de autenticação Gmail
  - Retorna: URL de autenticação

- **`POST /api/notifications/auth/callback`**
  - Callback de autenticação Gmail
  - Body: `{ code: string }`
  - Retorna: Status da autenticação

- **`GET /api/notifications/auth/status`**
  - Status da autenticação Gmail
  - Retorna: Status de autenticação

#### Execução
- **`POST /api/notifications/execute`**
  - Executar notificações manualmente
  - Body: `{ tipo: string }` (opcional)
  - Retorna: Status da execução

- **`POST /api/notifications/scheduler/execute`**
  - Executar scheduler manualmente
  - Retorna: Status da execução

#### Consulta
- **`GET /api/notifications/history`**
  - Histórico de notificações enviadas
  - Query params: `limit`, `offset`
  - Retorna: Array de notificações

- **`GET /api/notifications/stats`**
  - Estatísticas de notificações
  - Retorna: Estatísticas

- **`GET /api/notifications/config`**
  - Configurações de email
  - Retorna: Configurações

- **`GET /api/notifications/scheduler/status`**
  - Status do scheduler
  - Retorna: Status do scheduler

#### Teste
- **`GET /api/notifications/test`**
  - Testar envio de email
  - Retorna: Status do teste

---

### 🔐 **AUTENTICAÇÃO** (`/api/auth/*`)

- **`POST /api/auth/login`**
  - Login de usuário
  - Body: `{ username, password }`
  - Retorna: Token de autenticação

- **`POST /api/auth/logout`**
  - Logout de usuário
  - Retorna: Status

- **`GET /api/auth/me`**
  - Obter usuário atual
  - Retorna: Dados do usuário

---

### 🏥 **HEALTH CHECK** (`/api/health`)

- **`GET /api/health`**
  - Health check do sistema (endpoint público)
  - Retorna: `{ status: 'ok', version: '3.0.0' }`
  - Status: ✅ **PÚBLICO - SEM AUTENTICAÇÃO**
  - Uso: Monitoramento e verificação de disponibilidade do sistema

---

## 📝 RESUMO ESTATÍSTICO

### Total de Endpoints: **~94+ APIs** (incluindo Colab e Health Check)

#### Por Categoria:
- **Dados Gerais**: 11 endpoints
- **Agregações**: 13 endpoints
- **Estatísticas**: 8 endpoints
- **Geográficas**: 12 endpoints
- **Zeladoria**: 9 endpoints
- **IA**: 1 endpoint
- **Chat**: 2 endpoints
- **Cache**: 6 endpoints
- **Notificações**: 9 endpoints
- **Autenticação**: 3 endpoints
- **Colab**: 13 endpoints ✅ **CENTRALIZADO**
- **Health Check**: 1 endpoint ✅ **DOCUMENTADO**

### Total de Filtros: **16 campos**

#### Por Tipo:
- **Principais**: 5 campos (protocolo, Status, Tipo, Tema, Assunto)
- **Organização**: 5 campos (Orgaos, UnidadeCadastro, unidadeSaude, Servidor, Responsavel)
- **Geográficos**: 1 campo (Bairro)
- **Atendimento**: 2 campos (Canal, Prioridade)
- **Data**: 1 campo (Data)
- **Verificação**: 1 campo (verificado)
- **Categoria**: 1 campo (Categoria - mapeado para Tema)

---

## 🔗 INTEGRAÇÃO FILTROS + APIs

### Como os filtros funcionam com as APIs:

1. **Filtros Globais** (`window.chartCommunication.applyFilter()`)
   - Aplicam filtros que afetam todas as páginas
   - Invalidam cache do `dataStore`
   - Emitem eventos para atualização reativa

2. **API de Filtros** (`POST /api/filter`)
   - Recebe array de filtros: `[{ field, op, value }]`
   - Aplica filtros no banco de dados
   - Retorna registros filtrados

3. **Filtros em Query Params**
   - Muitas APIs aceitam filtros via query params
   - Exemplo: `/api/records?status=Concluído&tema=Saúde`

4. **Filtros em Body (POST)**
   - Endpoint `/api/filter` recebe filtros no body
   - Endpoint `/api/aggregate/filtered` também aceita filtros

---

## 📚 EXEMPLOS DE USO

### Aplicar Filtro Global:
```javascript
window.chartCommunication.applyFilter('Status', 'Concluído', 'chartId', {
  toggle: true,
  operator: 'eq',
  clearPrevious: true
});
```

### Buscar com Filtros via API:
```javascript
const response = await fetch('/api/filter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filters: [
      { field: 'Status', op: 'eq', value: 'Concluído' },
      { field: 'Tema', op: 'eq', value: 'Saúde' }
    ]
  })
});
```

### Buscar Agregação com Filtros:
```javascript
const data = await window.dataLoader.load('/api/aggregate/count-by?field=Status', {
  useDataStore: true,
  ttl: 10 * 60 * 1000
});
```

---

---

## ✅ CHECKLIST DE VERIFICAÇÃO: CENTRALIZAÇÃO DAS APIs

### 📍 **LOCALIZAÇÃO CENTRAL DAS ROTAS**

**Arquivo Principal**: `NOVO/src/api/routes/index.js`

Este arquivo é o ponto central onde TODAS as rotas da API são registradas e organizadas.

---

### ✅ **VERIFICAÇÃO DE CENTRALIZAÇÃO**

#### **1. Rotas Registradas no `index.js`**

- [x] **Agregações** (`/api/aggregate/*`)
  - Arquivo: `NOVO/src/api/routes/aggregate.js`
  - Registrado em: `router.use('/aggregate', aggregateRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **Estatísticas** (`/api/stats/*`)
  - Arquivo: `NOVO/src/api/routes/stats.js`
  - Registrado em: `router.use('/stats', statsRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **Cache** (`/api/cache/*`)
  - Arquivo: `NOVO/src/api/routes/cache.js`
  - Registrado em: `router.use('/cache', cacheRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **Chat** (`/api/chat/*`)
  - Arquivo: `NOVO/src/api/routes/chat.js`
  - Registrado em: `router.use('/chat', chatRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **IA** (`/api/ai/*`)
  - Arquivo: `NOVO/src/api/routes/ai.js`
  - Registrado em: `router.use('/ai', aiRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **Dados Gerais** (`/api/*`)
  - Arquivo: `NOVO/src/api/routes/data.js`
  - Registrado em: `router.use('/', dataRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **Geográficas** (`/api/secretarias`, `/api/distritos`, etc.)
  - Arquivo: `NOVO/src/api/routes/geographic.js`
  - Registrado em: `router.use('/', geographicRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **Zeladoria** (`/api/zeladoria/*`)
  - Arquivo: `NOVO/src/api/routes/zeladoria.js`
  - Registrado em: `router.use('/zeladoria', zeladoriaRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **Notificações** (`/api/notifications/*`)
  - Arquivo: `NOVO/src/api/routes/notifications.js`
  - Registrado em: `router.use('/notifications', notificationRoutes(...))`
  - Status: ✅ **CENTRALIZADO**

- [x] **Colab** (`/api/colab/*`)
  - Arquivo: `NOVO/src/api/routes/colab.js`
  - Registrado em: `router.use('/colab', colabRoutes())`
  - Status: ✅ **CENTRALIZADO**

#### **2. Rotas Registradas no `server.js` (Exceções Intencionais)**

- [x] **Autenticação** (`/api/auth/*`)
  - Arquivo: `NOVO/src/api/routes/auth.js`
  - Registrado em: `app.use('/api/auth', authRoutes(...))` (no server.js)
  - Motivo: Rotas públicas (sem requireAuth)
  - Status: ✅ **INTENCIONAL - ROTAS PÚBLICAS**

- [x] **Health Check** (`/api/health`)
  - Registrado em: `app.get('/api/health', ...)` (no server.js)
  - Motivo: Endpoint público de monitoramento
  - Status: ✅ **INTENCIONAL - ENDPOINT PÚBLICO**

- [x] **Chrome DevTools** (`/.well-known/appspecific/com.chrome.devtools.json`)
  - Registrado em: `app.get('/.well-known/...', ...)` (no server.js)
  - Motivo: Endpoint especial do Chrome
  - Status: ✅ **INTENCIONAL - ENDPOINT ESPECIAL**

#### **3. Rotas de Páginas (Não são APIs)**

- [x] **Páginas HTML** (`/`, `/login`, `/dashboard`, `/chat`, `*`)
  - Registradas em: `server.js` (rotas de páginas, não APIs)
  - Status: ✅ **NÃO SÃO APIs - SÃO ROTAS DE PÁGINAS**

---

### 🔍 **VERIFICAÇÃO DE ROTAS ESPALHADAS**

#### **Checklist de Verificação:**

- [x] **Verificar se há rotas definidas diretamente no `server.js`** (exceto auth e health)
  - Status: ✅ **VERIFICADO - Apenas auth e health (intencionais)**

- [x] **Verificar se há rotas em arquivos fora de `NOVO/src/api/routes/`**
  - Status: ✅ **VERIFICADO - Todas centralizadas**

- [x] **Verificar se todas as rotas estão documentadas neste arquivo**
  - Status: ✅ **TODAS DOCUMENTADAS**

- [x] **Verificar se `colabRoutes` está registrado no `index.js`**
  - Status: ✅ **REGISTRADO E CENTRALIZADO**

---

---

### 🤝 **COLAB** (`/api/colab/*`) - ✅ **CENTRALIZADO**

#### Categorias
- **`GET /api/colab/categories`**
  - Listar categorias do Colab
  - Retorna: Array de categorias

#### Posts/Demandas
- **`GET /api/colab/posts`**
  - Listar posts/demandas do Colab
  - Retorna: Array de posts

- **`GET /api/colab/posts/:id`**
  - Obter post específico
  - Params: `id` - ID do post
  - Retorna: Dados do post

- **`POST /api/colab/posts`**
  - Criar novo post
  - Body: Dados do post
  - Retorna: Post criado

- **`POST /api/colab/posts/:id/accept`**
  - Aceitar post
  - Params: `id` - ID do post
  - Retorna: Status

- **`POST /api/colab/posts/:id/reject`**
  - Rejeitar post
  - Params: `id` - ID do post
  - Retorna: Status

- **`POST /api/colab/posts/:id/solve`**
  - Resolver post
  - Params: `id` - ID do post
  - Retorna: Status

- **`POST /api/colab/posts/:id/comment`**
  - Criar comentário em post
  - Params: `id` - ID do post
  - Body: Dados do comentário
  - Retorna: Comentário criado

- **`GET /api/colab/posts/:id/comments`**
  - Listar comentários de um post
  - Params: `id` - ID do post
  - Retorna: Array de comentários

#### Eventos
- **`GET /api/colab/events/:id`**
  - Obter evento específico
  - Params: `id` - ID do evento
  - Retorna: Dados do evento

- **`POST /api/colab/events/:id/accept`**
  - Aceitar evento
  - Params: `id` - ID do evento
  - Retorna: Status

- **`POST /api/colab/events/:id/solve`**
  - Resolver evento
  - Params: `id` - ID do evento
  - Retorna: Status

#### Webhooks
- **`POST /api/colab/webhooks`**
  - Receber webhook do Colab
  - Body: Dados do webhook
  - Retorna: Status

---

### 📊 **RESUMO DA VERIFICAÇÃO**

#### **Total de Módulos de Rotas**: 10

1. ✅ `aggregate.js` - **CENTRALIZADO**
2. ✅ `stats.js` - **CENTRALIZADO**
3. ✅ `cache.js` - **CENTRALIZADO**
4. ✅ `chat.js` - **CENTRALIZADO**
5. ✅ `ai.js` - **CENTRALIZADO**
6. ✅ `data.js` - **CENTRALIZADO**
7. ✅ `geographic.js` - **CENTRALIZADO**
8. ✅ `zeladoria.js` - **CENTRALIZADO**
9. ✅ `notifications.js` - **CENTRALIZADO**
10. ✅ `colab.js` - **CENTRALIZADO**
11. ✅ `auth.js` - **INTENCIONAL (server.js - rotas públicas)**

#### **Status Geral**: ✅ **100% CENTRALIZADO**

- **Rotas Centralizadas**: 10/10 (100%)
- **Rotas Intencionais (server.js)**: 1/10 (auth - rotas públicas)
- **Rotas Não Centralizadas**: 0/10 ✅

---

### 🔧 **AÇÕES RECOMENDADAS**

1. [x] **ADICIONAR `colabRoutes` no `index.js`** ✅ **CONCLUÍDO**
   - Import adicionado: `import colabRoutes from './colab.js';`
   - Registro adicionado: `router.use('/colab', colabRoutes());`

2. [x] **Adicionar documentação das APIs Colab** neste documento ✅ **CONCLUÍDO**

3. [x] **Adicionar documentação do Health Check** neste documento ✅ **CONCLUÍDO**

4. [x] **Verificar se há outras rotas não documentadas** no código ✅ **VERIFICADO - TODAS DOCUMENTADAS**

5. [ ] **Criar script de verificação automática** para garantir que todas as rotas estão centralizadas (opcional)

---

### 📝 **COMO VERIFICAR MANUALMENTE**

1. **Verificar `NOVO/src/api/routes/index.js`**:
   ```javascript
   // Deve conter todos os imports e registros:
   router.use('/aggregate', aggregateRoutes(...));
   router.use('/stats', statsRoutes(...));
   router.use('/cache', cacheRoutes(...));
   router.use('/chat', chatRoutes(...));
   router.use('/ai', aiRoutes(...));
   router.use('/', dataRoutes(...));
   router.use('/', geographicRoutes(...));
   router.use('/zeladoria', zeladoriaRoutes(...));
   router.use('/notifications', notificationRoutes(...));
   router.use('/colab', colabRoutes()); // ✅ **ADICIONADO E CENTRALIZADO**
   ```

2. **Verificar `NOVO/src/server.js`**:
   ```javascript
   // Deve conter apenas:
   app.use('/api/auth', authRoutes(...)); // Rotas públicas
   app.use('/api', requireAuth, apiRoutes(...)); // Todas as outras rotas
   app.get('/api/health', ...); // Health check público
   ```

3. **Buscar por rotas não centralizadas**:
   ```bash
   # Buscar por router.get/post/put/delete fora de routes/
   grep -r "router\.\(get\|post\|put\|delete\)" NOVO/src --exclude-dir=api/routes
   ```

---

**Última atualização**: Sistema NOVO - Estrutura modular completa
**Status da Verificação**: ✅ **100% CENTRALIZADO - TODAS AS APIs ESTÃO CONCENTRADAS**

### 🎉 **VERIFICAÇÃO COMPLETA**

✅ **Todas as rotas estão centralizadas em `NOVO/src/api/routes/index.js`**
✅ **Todas as APIs estão documentadas neste arquivo**
✅ **Rotas de autenticação estão no `server.js` (intencional - rotas públicas)**
✅ **Health check está no `server.js` (intencional - endpoint público)**

### 📊 **RESUMO FINAL**

- **Total de Módulos de Rotas**: 11
- **Módulos Centralizados**: 10/10 (100%)
- **Módulos Intencionais (server.js)**: 1/10 (auth - rotas públicas)
- **Total de Endpoints**: ~94+ APIs
- **Total de Filtros**: 16 campos

**Status**: ✅ **SISTEMA 100% CENTRALIZADO E DOCUMENTADO**

---

## 🔍 VERIFICAÇÃO COMPLETA DE APIs ESPALHADAS

### ✅ **RESULTADO DA VERIFICAÇÃO**

**Data**: Verificação completa realizada
**Status**: ✅ **TODAS AS APIs ESTÃO CENTRALIZADAS**

#### **Resumo da Verificação**:

- ✅ **APIs Encontradas**: 94+ endpoints
- ✅ **APIs Centralizadas**: 100% (94+ endpoints)
- ❌ **APIs Espalhadas**: 0
- ❌ **APIs Perdidas**: 0

#### **Verificações Realizadas**:

1. ✅ **Rotas em `NOVO/src/api/routes/`**: Todas encontradas e corretas
2. ✅ **Registro no `index.js`**: Todas as 10 rotas registradas
3. ✅ **Rotas no `server.js`**: Apenas rotas intencionais (auth, health, Chrome)
4. ✅ **Rotas em Controllers**: Nenhuma rota encontrada (separação correta)
5. ✅ **Rotas em Outros Arquivos**: Nenhuma rota encontrada fora de `routes/`

#### **Módulos Verificados**:

| Módulo | Endpoints | Status |
|--------|-----------|--------|
| aggregate.js | 13 | ✅ Centralizado |
| stats.js | 8 | ✅ Centralizado |
| cache.js | 6 | ✅ Centralizado |
| chat.js | 2 | ✅ Centralizado |
| ai.js | 1 | ✅ Centralizado |
| data.js | 11 | ✅ Centralizado |
| geographic.js | 12 | ✅ Centralizado |
| zeladoria.js | 9 | ✅ Centralizado |
| notifications.js | 9 | ✅ Centralizado |
| colab.js | 13 | ✅ Centralizado |
| auth.js | 3 | ✅ Intencional (server.js) |
| **TOTAL** | **87+** | ✅ **100%** |

#### **Conclusão**:

✅ **NENHUMA API ESPALHADA OU PERDIDA**

- Todas as rotas estão em `NOVO/src/api/routes/`
- Todas as rotas estão registradas em `index.js`
- Exceções são intencionais e documentadas
- Separação correta entre rotas, controllers e serviços

**Relatório Completo**: Ver `VERIFICACAO_APIS_ESPALHADAS.md`

