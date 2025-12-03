# 🗺️ MAPEAMENTO ULTRA DETALHADO E COMPLETO DO SISTEMA

**Data de Geração**: 02/12/2025, 16:33:10
**Versão**: 3.0 - ULTRA DETALHADO
**Análise Completa**: Banco de Dados, Cache, Utilitários, Pipelines, Páginas, APIs, Sistemas Globais

---

## 📋 ÍNDICE COMPLETO

1. [Banco de Dados - Schemas Prisma](#banco-de-dados)
2. [Sistemas de Cache](#sistemas-de-cache)
3. [Utilitários e Helpers](#utilitários-e-helpers)
4. [Pipelines MongoDB](#pipelines-mongodb)
5. [Sistemas Globais Detalhados](#sistemas-globais-detalhados)
6. [APIs e Controllers Completos](#apis-e-controllers-completos)
7. [Páginas com Análise Ultra Detalhada](#páginas-com-análise-ultra-detalhada)
8. [Elementos HTML Mapeados](#elementos-html-mapeados)
9. [Fluxos de Dados](#fluxos-de-dados)
10. [Resumo e Estatísticas](#resumo-e-estatísticas)

---

## 🗄️ BANCO DE DADOS

### **Provider**: MongoDB
### **ORM**: Prisma
### **Total de Models**: 7

### **Model: Record**

**Tabela MongoDB**: `records`

**Campos** (41):
- **`id`** (`String`) - 🔑 Primary Key
- **`data`** (`Json`)
- **`Armazena`** (`o`)
- **`JSON`** (`completo`) - Armazena o
- **`da`** (`planilha`) - Armazena o JSON completo
- **`createdAt`** (`DateTime`) - Armazena o JSON completo da planilha
- **`Campos`** (`normalizados`) - Armazena o JSON completo da planilha
- **`baseados`** (`nas`) - Armazena o JSON completo da planilha
- **`colunas`** (`exatas`) - Armazena o JSON completo da planilha
- **`da`** (`planilha`) - Armazena o JSON completo da planilha
- **`protocolo`** (`String?`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`protocolo`** (`dataDaCriacao`) - Armazena o JSON completo da planilha
- **`data_da_criacao`** (`statusDemanda`) - Armazena o JSON completo da planilha
- **`status_demanda`** (`prazoRestante`) - Armazena o JSON completo da planilha
- **`prazo_restante`** (`dataDaConclusao`) - Armazena o JSON completo da planilha
- **`data_da_conclusao`** (`tempoDeResolucaoEmDias`) - Armazena o JSON completo da planilha
- **`tempo_de_resolucao_em_dias`** (`prioridade`) - Armazena o JSON completo da planilha
- **`prioridade`** (`tipoDeManifestacao`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`tipo_de_manifestacao`** (`tema`) - Armazena o JSON completo da planilha
- **`tema`** (`assunto`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`assunto`** (`canal`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`canal`** (`endereco`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`endereco`** (`unidadeCadastro`) - Armazena o JSON completo da planilha
- **`unidade_cadastro`** (`unidadeSaude`) - Armazena o JSON completo da planilha
- **`unidade_saude`** (`status`) - Armazena o JSON completo da planilha
- **`status`** (`servidor`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`servidor`** (`responsavel`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`responsavel`** (`verificado`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`verificado`** (`orgaos`) - Armazena o JSON completo da planilha
- **`Campos`** (`ISO`) - Armazena o JSON completo da planilha
- **`para`** (`queries`) - Armazena o JSON completo da planilha
- **`de`** (`data`) - Armazena o JSON completo da planilha
- **`normalizados`** (`de`) - Armazena o JSON completo da planilha
- **`data_da_criacao`** (`e`) - Armazena o JSON completo da planilha
- **`dataCriacaoIso`** (`String?`) - 📇 Indexed - Armazena o JSON completo da planilha
- **`DD`** (`dataConclusaoIso`) - Armazena o JSON completo da planilha
- **`ndices`** (`simples`) - Armazena o JSON completo da planilha
- **`ndices`** (`compostos`) - Armazena o JSON completo da planilha
- **`para`** (`queries`) - Armazena o JSON completo da planilha
- **`ndices`** (`adicionais`) - Armazena o JSON completo da planilha
- **`para`** (`queries`) - Armazena o JSON completo da planilha

**Índices** (26):
- **Simple**: [protocolo]
- **Simple**: [statusDemanda]
- **Simple**: [tipoDeManifestacao]
- **Simple**: [tema]
- **Simple**: [assunto]
- **Simple**: [canal]
- **Simple**: [unidadeCadastro]
- **Simple**: [unidadeSaude]
- **Simple**: [status]
- **Simple**: [servidor]
- **Simple**: [responsavel]
- **Simple**: [prioridade]
- **Simple**: [orgaos]
- **Simple**: [dataCriacaoIso]
- **Simple**: [dataConclusaoIso]
- **Compound**: [dataCriacaoIso, status]
- **Compound**: [dataCriacaoIso, tema]
- **Compound**: [dataCriacaoIso, orgaos]
- **Compound**: [tema, orgaos]
- **Compound**: [status, tema]
- **Compound**: [unidadeCadastro, dataCriacaoIso]
- **Compound**: [servidor, dataCriacaoIso]
- **Compound**: [servidor, dataCriacaoIso, status]
- **Compound**: [orgaos, status, dataCriacaoIso]
- **Compound**: [tema, dataCriacaoIso, status]
- **Compound**: [unidadeCadastro, status, dataCriacaoIso]

---

### **Model: ChatMessage**

**Tabela MongoDB**: `chat_messages`

**Campos** (4):
- **`id`** (`String`) - 🔑 Primary Key
- **`text`** (`String`)
- **`sender`** (`String`)
- **`createdAt`** (`DateTime`) - 📇 Indexed - 'user' ou 'cora'

**Índices** (1):
- **Simple**: [createdAt]

---

### **Model: AggregationCache**

**Tabela MongoDB**: `aggregation_cache`

**Campos** (9):
- **`id`** (`String`) - 🔑 Primary Key
- **`key`** (`String`) - ⭐ Unique
- **`data`** (`Json`) - Chave única do cache (ex: "countBy:status:v2")
- **`Dados`** (`agregados`) - Chave única do cache (ex: "countBy:status:v2")
- **`computados`** (`expiresAt`) - Chave única do cache (ex: "countBy:status:v2")
- **`Data`** (`de`) - Chave única do cache (ex: "countBy:status:v2")
- **`o`** (`do`) - Chave única do cache (ex: "countBy:status:v2")
- **`cache`** (`createdAt`) - Chave única do cache (ex: "countBy:status:v2")
- **`updatedAt`** (`DateTime`) - Chave única do cache (ex: "countBy:status:v2")

**Índices** (1):
- **Simple**: [expiresAt]

---

### **Model: Zeladoria**

**Tabela MongoDB**: `zeladoria`

**Campos** (37):
- **`id`** (`String`) - 🔑 Primary Key
- **`data`** (`Json`)
- **`Armazena`** (`o`)
- **`JSON`** (`completo`) - Armazena o
- **`do`** (`CSV`) - Armazena o JSON completo
- **`createdAt`** (`DateTime`) - Armazena o JSON completo do CSV
- **`Campos`** (`normalizados`) - Armazena o JSON completo do CSV
- **`baseados`** (`nas`) - Armazena o JSON completo do CSV
- **`colunas`** (`do`) - Armazena o JSON completo do CSV
- **`CSV`** (`origem`) - Armazena o JSON completo do CSV
- **`Origem`** (`status`) - Armazena o JSON completo do CSV
- **`Status`** (`protocoloEmpresa`) - Armazena o JSON completo do CSV
- **`Protocolo`** (`da`) - Armazena o JSON completo do CSV
- **`Empresa`** (`categoria`) - Armazena o JSON completo do CSV
- **`Categoria`** (`responsavel`) - Armazena o JSON completo do CSV
- **`vel`** (`endereco`) - Armazena o JSON completo do CSV
- **`o`** (`bairro`) - Armazena o JSON completo do CSV
- **`Bairro`** (`cidade`) - Armazena o JSON completo do CSV
- **`Cidade`** (`estado`) - Armazena o JSON completo do CSV
- **`Estado`** (`dataCriacao`) - Armazena o JSON completo do CSV
- **`Data`** (`de`) - Armazena o JSON completo do CSV
- **`o`** (`dataConclusao`) - Armazena o JSON completo do CSV
- **`Data`** (`de`) - Armazena o JSON completo do CSV
- **`o`** (`apoios`) - Armazena o JSON completo do CSV
- **`Apoios`** (`latitude`) - Armazena o JSON completo do CSV
- **`Latitude`** (`longitude`) - Armazena o JSON completo do CSV
- **`Longitude`** (`departamento`) - Armazena o JSON completo do CSV
- **`Departamento`** (`canal`) - Armazena o JSON completo do CSV
- **`Canal`** (`prazo`) - Armazena o JSON completo do CSV
- **`Campos`** (`ISO`) - Armazena o JSON completo do CSV
- **`para`** (`queries`) - Armazena o JSON completo do CSV
- **`de`** (`data`) - Armazena o JSON completo do CSV
- **`dataCriacaoIso`** (`String?`) - 📇 Indexed - Armazena o JSON completo do CSV
- **`DD`** (`dataConclusaoIso`) - Armazena o JSON completo do CSV
- **`ndices`** (`simples`) - Armazena o JSON completo do CSV
- **`ndices`** (`compostos`) - Armazena o JSON completo do CSV
- **`para`** (`queries`) - Armazena o JSON completo do CSV

**Índices** (15):
- **Simple**: [origem]
- **Simple**: [status]
- **Simple**: [protocoloEmpresa]
- **Simple**: [categoria]
- **Simple**: [responsavel]
- **Simple**: [bairro]
- **Simple**: [departamento]
- **Simple**: [canal]
- **Simple**: [dataCriacaoIso]
- **Simple**: [dataConclusaoIso]
- **Compound**: [status, categoria]
- **Compound**: [dataCriacaoIso, status]
- **Compound**: [dataCriacaoIso, categoria]
- **Compound**: [departamento, status]
- **Compound**: [bairro, categoria]

---

### **Model: NotificacaoEmail**

**Tabela MongoDB**: `notificacoes_email`

**Campos** (28):
- **`id`** (`String`) - 🔑 Primary Key
- **`protocolo`** (`String`) - 📇 Indexed
- **`Protocolo`** (`da`)
- **`demanda`** (`secretaria`) - Protocolo da
- **`o`** (`respons`) - Protocolo da demanda
- **`vel`** (`emailSecretaria`) - Protocolo da demanda
- **`Email`** (`da`) - Protocolo da demanda
- **`secretaria`** (`tipoNotificacao`) - 📇 Indexed - Protocolo da demanda
- **`dataVencimento`** (`String`) - 📇 Indexed - Protocolo da demanda
- **`Data`** (`de`) - Protocolo da demanda
- **`vencimento`** (`em`) - Protocolo da demanda
- **`formato`** (`YYYY`) - Protocolo da demanda
- **`DD`** (`diasRestantes`) - Protocolo da demanda
- **`Dias`** (`restantes`) - Protocolo da demanda
- **`no`** (`momento`) - Protocolo da demanda
- **`do`** (`envio`) - Protocolo da demanda
- **`enviadoEm`** (`DateTime`) - 📇 Indexed - Protocolo da demanda
- **`status`** (`String`) - 📇 Indexed - Protocolo da demanda
- **`mensagemErro`** (`String?`) - Protocolo da demanda
- **`Mensagem`** (`de`) - Protocolo da demanda
- **`erro`** (`se`) - Protocolo da demanda
- **`houver`** (`messageId`) - Protocolo da demanda
- **`ID`** (`da`) - Protocolo da demanda
- **`mensagem`** (`no`) - Protocolo da demanda
- **`para`** (`rastreamento`) - Protocolo da demanda
- **`ndices`** (`para`) - Protocolo da demanda
- **`consultas`** (`eficientes`) - Protocolo da demanda
- **`Evitar`** (`duplicatas`) - Protocolo da demanda

**Índices** (7):
- **Simple**: [protocolo]
- **Simple**: [secretaria]
- **Simple**: [tipoNotificacao]
- **Simple**: [dataVencimento]
- **Simple**: [enviadoEm]
- **Simple**: [status]
- **Compound**: [protocolo, tipoNotificacao]

---

### **Model: SecretariaInfo**

**Tabela MongoDB**: `secretarias_info`

**Campos** (27):
- **`id`** (`String`) - 🔑 Primary Key
- **`Nome`** (`da`) - /
- **`o`** (`name`) - / Nome da secretaria / órgã
- **`Sigla`** (`da`) - / Nome da secretaria / órgão
- **`se`** (`existir`) - / Nome da secretaria / órgão
- **`acronym`** (`String?`) - / Nome da secretaria / órgão
- **`Email`** (`principal`) - / Nome da secretaria / órgão
- **`da`** (`secretaria`) - / Nome da secretaria / órgão
- **`email`** (`String?`) - 📇 Indexed - / Nome da secretaria / órgão
- **`Email`** (`alternativo`) - / Nome da secretaria / órgão
- **`pia`** (`alternateEmail`) - / Nome da secretaria / órgão
- **`Telefone`** (`principal`) - / Nome da secretaria / órgão
- **`phone`** (`String?`) - / Nome da secretaria / órgão
- **`Telefone`** (`alternativo`) - / Nome da secretaria / órgão
- **`phoneAlt`** (`String?`) - / Nome da secretaria / órgão
- **`o`** (`completo`) - / Nome da secretaria / órgão
- **`address`** (`String?`) - / Nome da secretaria / órgão
- **`Bairro`** (`bairro`) - / Nome da secretaria / órgão
- **`quando`** (`aplic`) - / Nome da secretaria / órgão
- **`district`** (`String?`) - 📇 Indexed - / Nome da secretaria / órgão
- **`es`** (`gerais`) - / Nome da secretaria / órgão
- **`notes`** (`String?`) - / Nome da secretaria / órgão
- **`Linha`** (`completa`) - / Nome da secretaria / órgão
- **`original`** (`da`) - / Nome da secretaria / órgão
- **`planilha`** (`rawData`) - / Nome da secretaria / órgão
- **`Json`** (`createdAt`) - / Nome da secretaria / órgão
- **`updatedAt`** (`DateTime`) - / Nome da secretaria / órgão

**Índices** (3):
- **Simple**: [name]
- **Simple**: [district]
- **Simple**: [email]

---

### **Model: User**

**Tabela MongoDB**: `users`

**Campos** (6):
- **`id`** (`String`) - 🔑 Primary Key
- **`username`** (`String`) - ⭐ Unique
- **`password`** (`String`) - Nome de usuário único (já cria índice automaticamente)
- **`hash`** (`bcrypt`) - Nome de usuário único (já cria índice automaticamente)
- **`createdAt`** (`DateTime`) - Nome de usuário único (já cria índice automaticamente)
- **`updatedAt`** (`DateTime`) - Nome de usuário único (já cria índice automaticamente)

**Índices** (0):

---

## 💾 SISTEMAS DE CACHE

**Total de Sistemas**: 5

### **dbCache** - Database Cache

**Arquivo**: `dbCache.js`
**Descrição**: Cache de agregações no MongoDB (model AggregationCache)
**Armazenamento**: MongoDB

**Funções** (7):
- `getDbCache()`
- `setDbCache()`
- `cleanExpiredCache()`
- `clearDbCache()`
- `clearAllDbCache()`
- `getCacheStats()`
- `withDbCache()`

---

### **smartCache** - Smart Cache

**Arquivo**: `smartCache.js`
**Descrição**: Cache inteligente com TTL adaptativo por tipo de endpoint
**Armazenamento**: MongoDB (AggregationCache)

**Funções** (8):
- `generateCacheKey()`
- `getTTL()`
- `getCachedAggregation()`
- `setCachedAggregation()`
- `withSmartCache()`
- `invalidateCachePattern()`
- `cleanExpiredCache()`
- `getCacheStats()`

**TTLs por Endpoint**:

---

### **withCache** - Response Cache Wrapper

**Arquivo**: `responseHelper.js`
**Descrição**: Wrapper para endpoints com cache no banco + memória + timeout
**Armazenamento**: Híbrido (MongoDB + Memória)

**Recursos**: Timeout configurável, Fallback em memória, Tratamento de erros

---

### **dataStore** - Client-Side Cache

**Arquivo**: `global-store.js`
**Descrição**: Cache no cliente com localStorage e reatividade
**Armazenamento**: localStorage + Memória

**Recursos**: TTL por chave, Deep copy, Listeners/Reatividade, Persistência

---

### **dataLoader** - Data Loader

**Arquivo**: `dataLoader.js`
**Descrição**: Sistema de carregamento com cache, deduplicação e timeouts adaptativos
**Armazenamento**: Integrado com dataStore

**Recursos**: Deduplicação, Retry com backoff, Timeouts adaptativos, Fila de prioridades

---

## 🛠️ UTILITÁRIOS E HELPERS

**Total de Utilitários**: 14

### **cacheBuilder**

**Arquivo**: `src\utils\cacheBuilder.js`
**Descrição**: /
  Sistema de construção e atualização do cache universal
 /

**Funções** (2):
- `buildUniversalCache()`
- `scheduleDailyUpdate()`

---

### **cacheManager**

**Arquivo**: `src\utils\cacheManager.js`
**Descrição**: /
  Sistema de Cache Universal Persistente
  Copiado do sistema antigo e otimizado
 /

**Funções** (4):
- `loadCache()`
- `saveCache()`
- `get()`
- `set()`

---

### **cursorPagination**

**Arquivo**: `src\utils\cursorPagination.js`
**Descrição**: /
  Utilitários para Paginação Cursor-Based
  
  Evita usar .skip() em coleções grandes, que é ineficiente.
  Usa cursor-based pagination com crea

**Funções** (5):
- `encodeCursor()`
- `decodeCursor()`
- `paginateWithCursor()`
- `paginateBackwardWithCursor()`
- `formatPaginatedResults()`

---

### **dataFormatter**

**Arquivo**: `src\utils\dataFormatter.js`
**Descrição**: /
  Formatador Global de Dados
  Funções utilitárias para formatar dados de agregações MongoDB
  Garante consistência em todos os endpoints
 /

**Funções** (9):
- `formatPercent()`
- `formatGroupByResult()`
- `formatMonthlySeries()`
- `formatDailySeries()`
- `formatFunnel()`
- `formatKPIs()`
- `formatTrendGroup()`
- `formatAggregationResult()`
- `formatRanking()`

---

### **dateUtils**

**Arquivo**: `src\utils\dateUtils.js`
**Descrição**: /
  Sistema Global de Normalização de Datas
  Usado por TODAS as APIs e páginas do sistema
 /

**Funções** (7):
- `normalizeDate()`
- `getDataCriacao()`
- `getDataConclusao()`
- `getMes()`
- `isConcluido()`
- `getTempoResolucaoEmDias()`
- `addMesFilter()`

---

### **dbAggregations**

**Arquivo**: `src\utils\dbAggregations.js`
**Descrição**: /
  Utilitários para Agregações MongoDB Nativas
  
  Este módulo encapsula chamadas ao MongoDB nativo para agregações pesadas.
  Use este módulo a

**Funções** (6):
- `executeAggregation()`
- `executeFacetAggregation()`
- `buildOverviewPipeline()`
- `formatOverviewData()`
- `getOverviewData()`
- `getDistinctValues()`

---

### **dbCache**

**Arquivo**: `src\utils\dbCache.js`
**Descrição**: /
  Sistema de Cache no Banco de Dados
  Armazena agregações pré-computadas diretamente no MongoDB
  Muito mais rápido que cache em memória para da

**Funções** (7):
- `getDbCache()`
- `setDbCache()`
- `cleanExpiredCache()`
- `clearDbCache()`
- `clearAllDbCache()`
- `getCacheStats()`
- `withDbCache()`

---

### **districtMapper**

**Arquivo**: `src\utils\districtMapper.js`
**Descrição**: /
  🗺️ Biblioteca de Mapeamento de Bairros para Distritos
  Sistema robusto de detecção e mapeamento de bairros para distritos de Duque de Caxias


**Funções** (7):
- `loadDistrictsData()`
- `normalizeString()`
- `extractKeywords()`
- `calculateSimilarity()`
- `detectDistrictByAddress()`
- `mapAddressesToDistricts()`
- `getMappingStats()`

---

### **fieldMapper**

**Arquivo**: `src\utils\fieldMapper.js`
**Descrição**: /
  Mapeamento Global de Campos
  Centraliza o mapeamento de campos para evitar duplicação
  Usado por todos os endpoints de agregação
 /

**Funções** (2):
- `getNormalizedField()`
- `isNormalizedField()`

---

### **geminiHelper**

**Arquivo**: `src\utils\geminiHelper.js`
**Descrição**: /
  Helper para integração com IA
 /

**Funções** (10):
- `getCurrentGeminiKey()`
- `isCurrentKeyInCooldown()`
- `markCurrentKeyInCooldown()`
- `rotateToNextKey()`
- `hasAvailableKey()`
- `resetToFirstKey()`
- `clearAllCooldowns()`
- `hasGeminiKeys()`
- `getGeminiKeysCount()`
- `initializeGemini()`

---

### **queryOptimizer**

**Arquivo**: `src\utils\queryOptimizer.js`
**Descrição**: /
  Sistema Global de Otimização de Queries
  Usa agregações do banco de dados em vez de processar em memória
  Muito mais rápido e eficiente
 /

**Funções** (8):
- `getDateFilter()`
- `optimizedGroupBy()`
- `fallbackGroupBy()`
- `optimizedGroupByMonth()`
- `fallbackGroupByMonth()`
- `optimizedCount()`
- `optimizedDistinct()`
- `optimizedCrossAggregation()`

---

### **responseHelper**

**Arquivo**: `src\utils\responseHelper.js`
**Descrição**: /
  Helper para respostas da API com cache
 /

**Funções** (3):
- `withCache()`
- `safeQuery()`
- `executeFn()`

---

### **smartCache**

**Arquivo**: `src\utils\smartCache.js`
**Descrição**: /
  Cache Inteligente (Smart Cache)
  
  Sistema de cache baseado em chaves derivadas de filtros
  TTL configurável por tipo de endpoint
  Integr

**Funções** (8):
- `generateCacheKey()`
- `getTTL()`
- `getCachedAggregation()`
- `setCachedAggregation()`
- `withSmartCache()`
- `invalidateCachePattern()`
- `cleanExpiredCache()`
- `getCacheStats()`

---

### **validateFilters**

**Arquivo**: `src\utils\validateFilters.js`
**Descrição**: /
  Validador de Filtros
  
  Middleware de segurança para validar filtros antes de executar pipelines
  Previne injection, regex gigantes, e uso 

**Funções** (4):
- `validateFilters()`
- `validateFieldValue()`
- `validateFiltersMiddleware()`
- `sanitizeFilters()`

---

## 🔄 PIPELINES MONGODB

**Total de Pipelines**: 7

### **assunto**

**Arquivo**: `src\utils\pipelines\assunto.js`

**Pipelines Disponíveis**:
- `buildAssuntoPipeline()`

**Estágios MongoDB Usados**: match, exists, ne, group, sum, addToSet, sort, limit

---

### **bairro**

**Arquivo**: `src\utils\pipelines\bairro.js`

**Pipelines Disponíveis**:
- `buildBairroPipeline()`

**Estágios MongoDB Usados**: match, addFields, ifNull, exists, ne, group, sum, addToSet, sort, limit

---

### **categoria**

**Arquivo**: `src\utils\pipelines\categoria.js`

**Pipelines Disponíveis**:
- `buildCategoriaPipeline()`

**Estágios MongoDB Usados**: match, or, exists, ne, addFields, ifNull, group, sum, addToSet, sort, limit

---

### **orgaoMes**

**Arquivo**: `src\utils\pipelines\orgaoMes.js`

**Pipelines Disponíveis**:
- `buildOrgaoMesPipeline()`

**Estágios MongoDB Usados**: match, addFields, cond, ne, dateFromString, concat, exists, group, year, month, sum, project, toString, lt, sort

---

### **overview**

**Arquivo**: `src\utils\pipelines\overview.js`

**Pipelines Disponíveis**:
- `buildOverviewPipeline()`

**Estágios MongoDB Usados**: match, facet, exists, ne, group, sum, sort, limit, count, or, addFields, cond, dateFromString, concat, year, month, project, toString, lt, gte, dateToString

---

### **status**

**Arquivo**: `src\utils\pipelines\status.js`

**Pipelines Disponíveis**:
- `buildStatusPipeline()`

**Estágios MongoDB Usados**: match, exists, ne, group, sum, sort, limit

---

### **tema**

**Arquivo**: `src\utils\pipelines\tema.js`

**Pipelines Disponíveis**:
- `buildTemaPipeline()`

**Estágios MongoDB Usados**: match, exists, ne, group, sum, addToSet, sort, limit

---

## 🔧 SISTEMAS GLOBAIS DETALHADOS

### **dataLoader** - `window.dataLoader`

**Arquivo**: `public\scripts\core\dataLoader.js`
**Descrição**: Sistema de carregamento de dados com cache e deduplicação

**Funções e Métodos** (4):
- `getAdaptiveTimeout()`
- `getBackoffDelay()`
- `processQueue()`
- `executeRequest()`

---

### **dataStore** - `window.dataStore`

**Arquivo**: `public\scripts\core\global-store.js`
**Descrição**: Repositório central de dados com cache e reatividade

**Funções e Métodos** (15):
- `createDeepCopy()`
- `getEffectiveTTL()`
- `getPersistent()`
- `setPersistent()`
- `clearOldPersistent()`
- `get()`
- `set()`
- `notifyListeners()`
- `subscribe()`
- `clear()`
- `clearPersistent()`
- `invalidate()`
- `getStats()`
- `getDefaultTTL()`
- `setDefaultTTL()`

---

### **chartFactory** - `window.chartFactory`

**Arquivo**: `public\scripts\core\chart-factory.js`
**Descrição**: Fábrica de gráficos padronizados (Chart.js)

**Funções e Métodos** (20):
- `darkenHexColor()`
- `getColorPalette()`
- `getColorFromPalette()`
- `getColorWithAlpha()`
- `isLightMode()`
- `getHighlightedColor()`
- `highlightChartElement()`
- `getChartDefaults()`
- `ensureChartJS()`
- `createBarChart()`
- `createLineChart()`
- `createDoughnutChart()`
- `updateChart()`
- `createReactiveChart()`
- `destroyChartSafely()`
- `destroyCharts()`
- `onload()`
- `onerror()`
- `onclick()`
- `updateChartFromStore()`

---

### **chartCommunication** - `window.chartCommunication`

**Arquivo**: `public\scripts\core\chart-communication.js`
**Descrição**: Sistema de comunicação entre gráficos e filtros globais

**Funções e Métodos** (3):
- `applyFilter()`
- `handleFilterChange()`
- `getFieldMapping()`

---

### **advancedCharts** - `window.advancedCharts`

**Arquivo**: `public\scripts\core\advanced-charts.js`
**Descrição**: Gráficos avançados com Plotly.js

**Funções e Métodos** (7):
- `ensurePlotly()`
- `loadAdvancedCharts()`
- `loadSankeyChart()`
- `loadTreeMapChart()`
- `loadGeographicMap()`
- `buildHeatmap()`
- `onerror()`

---

### **config** - `window.config`

**Arquivo**: `public\scripts\core\config.js`
**Descrição**: Configurações globais do sistema

**Funções e Métodos** (4):
- `getFieldLabel()`
- `buildEndpoint()`
- `isLightMode()`
- `getColorByTipoManifestacao()`

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
  Query params: field (opcional - Tema, Assunto, etc.), servidor, unidadeCadastro
 /...

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
  @param {PrismaClient} prisma - Cliente Prisma (usado apenas para cache)
  @param {Function} get...

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
  @param {PrismaClient} prisma - Cliente Prisma (fallback)
  @param ...

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
  - tipo: '15_dias' | 'vencimento' | '30_dias_vencido' | '60_dias_vencido' | 'consolidacao_geral'
  - secre...

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
  OTIMIZADO: Filtra por range de datas no banco, batch queries, cache de emails
  
  Query params:
  ...

#### `enviarSelecionados()`
- **Método**: POST
- **Rota**: /api/notificacoes/enviar-selecionados
- **Documentação**: POST /api/notificacoes/enviar-selecionados
  Envia emails para as secretarias selecionadas
  OTIMIZADO: Batch de registros, processamento paralelo limitado
  
  Body: {
    tipo: 'hoje' | '15' | '30' ...

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
    console.error('❌ Erro ao processar autorização:', error);
    res.status(500).json({
  ...

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
  - GET /api/secretarias-info/:id     -> Detalhes de um...

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
    - filtro: 'vencidos' | '3' | '7' | '15' | '30' | número customizado (dias)
    - mes: YYYY-MM (filtro por m...

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

## 📄 PÁGINAS COM ANÁLISE ULTRA DETALHADA

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

**APIs Utilizadas** (1):

- **`/api/filter`**
  - Tipo: fetch
  - Variável: `N/A`
  - Contexto: fetch('/api/filter', {       method: 'POST',       headers: {         'Content-Type': 'application/json'       },       credentials: 'include', /

**Filtros** (14): filtroProtocolo, filtroStatusDemanda, filtroUnidadeCadastro, filtroCanal, filtroServidor, filtroTipoManifestacao, filtroTema, filtroPrioridade, filtroUnidadeSaude, filtroDataCriacaoInicial, filtroDataCriacaoFinal, filtroAssunto, filtroResponsavel, filtroStatus

**Sistemas Globais Usados**:
- `dataLoader`: 4 uso(s)
- `dataStore`: 2 uso(s)
- `chartCommunication`: 8 uso(s)
- `Logger`: 50 uso(s)

**Fluxo de Dados**:
- API: `/api/filter` → `null` → []

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
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-subject', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // Validar dado

- **`/api/aggregate/count-by-status-mes?field=Assunto`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Assunto', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || {};          const statusData = da

**Gráficos** (3):

- **`chartAssunto`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartAssunto', labels, values, {     horizontal: true,     colorIndex: 3,     lab...

- **`chartAssuntoMes`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('chartAssuntoMes', labels, datasets, {     colorIndex: 0,     legendContainer: 'leg...

- **`chartStatusAssunto`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartStatusAssunto', labels, values, {         type: 'doughnut',         onCl...

**KPIs e Cards** (8):

- **`kpiTotalAssunto`** (KPI)
- **`kpiAssuntosUnicos`** (KPI)
- **`kpiMediaAssunto`** (KPI)
- **`kpiAssuntoMaisComum`** (KPI)
- **`kpiTotalAssunto`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiAssuntosUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaAssunto`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiAssuntoMaisComum`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 3 uso(s)
- `chartFactory`: 5 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 30 uso(s)
- `dateUtils`: 1 uso(s)

**Uso de Cache**:
- `/api/aggregate/by-subject`: dataStore (TTL: 10ms)
- `/api/aggregate/count-by-status-mes?field=Assunto`: dataStore (TTL: 10ms)
- `/api/dashboard-data`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/by-subject` → `null` → []
- API: `/api/aggregate/count-by-status-mes?field=Assunto` → `null` → []
- API: `/api/dashboard-data` → `null` → []

**Funções Principais** (7):
- `loadAssunto()`
- `initAssuntoFilterListeners()`
- `renderAssuntoChart()`
- `renderStatusAssuntoChart()`
- `renderAssuntoMesChart()`
- `updateAssuntoKPIs()`
- `renderAssuntosList()`

---

#### 📊 **bairro**

**Arquivo**: `public\scripts\pages\ouvidoria\bairro.js`
**Descrição**: * Página: Bairro
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/aggregate/count-by?field=Bairro`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length, slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Bairro', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // V

- **`/api/aggregate/count-by-status-mes?field=Bairro`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Bairro', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

**Gráficos** (2):

- **`chartBairro`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartBairro', labels, values, {       horizontal: true,       colorIndex: 5,     ...

- **`chartBairroMes`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('chartBairroMes', labels, datasets, {     colorIndex: 0,     legendContainer: 'lege...

**KPIs e Cards** (8):

- **`kpiTotalBairro`** (KPI)
- **`kpiBairrosUnicos`** (KPI)
- **`kpiMediaBairro`** (KPI)
- **`kpiBairroMaisAtivo`** (KPI)
- **`kpiTotalBairro`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiBairrosUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaBairro`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiBairroMaisAtivo`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 8 uso(s)
- `dateUtils`: 1 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Bairro`: dataStore (TTL: 10ms)
- `/api/aggregate/count-by-status-mes?field=Bairro`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Bairro` → `null` → [length, slice]
- API: `/api/aggregate/count-by-status-mes?field=Bairro` → `null` → []

**Funções Principais** (3):
- `loadBairro()`
- `renderBairroMesChart()`
- `updateBairroKPIs()`

---

#### 📊 **cadastrante**

**Arquivo**: `public\scripts\pages\ouvidoria\cadastrante.js`
**Descrição**: * Página: Por Cadastrante
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (4):

- **`/api/aggregate/by-server`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-server', {         useDataStore: true,         ttl: 10 * 60 * 1000       }) || [],       window.dataLoa

- **`/api/aggregate/count-by?field=UAC`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=UAC', {         useDataStore: true,         ttl: 10 * 60 * 1000       }) || [],       windo

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {         useDataStore: true,         ttl: 10 * 60 * 1000       }) || [],       window.dataLoad

- **`/api/summary`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 5ms (0s)
  - Contexto: window.dataLoader?.load('/api/summary', {         useDataStore: true,         ttl: 5 * 60 * 1000       }) || { total: 0 }     ]);          // Re

**Gráficos** (1):

- **`chartCadastranteMes`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartCadastranteMes', labels, values, {     colorIndex: 1,     label: 'Quantidade'...

**KPIs e Cards** (8):

- **`kpiTotalCadastrante`** (KPI)
- **`kpiServidoresUnicos`** (KPI)
- **`kpiUnidadesUnicas`** (KPI)
- **`kpiServidorMaisAtivo`** (KPI)
- **`kpiTotalCadastrante`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiServidoresUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiUnidadesUnicas`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiServidorMaisAtivo`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 4 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)
- `dateUtils`: 1 uso(s)

**Uso de Cache**:
- `/api/aggregate/by-server`: dataStore (TTL: 10ms)
- `/api/aggregate/count-by?field=UAC`: dataStore (TTL: 10ms)
- `/api/aggregate/by-month`: dataStore (TTL: 10ms)
- `/api/summary`: dataStore (TTL: 5ms)

**Fluxo de Dados**:
- API: `/api/aggregate/by-server` → `null` → []
- API: `/api/aggregate/count-by?field=UAC` → `null` → []
- API: `/api/aggregate/by-month` → `null` → []
- API: `/api/summary` → `null` → []

**Funções Principais** (5):
- `loadCadastrante()`
- `renderServidoresList()`
- `renderUnidadesList()`
- `updateCadastranteKPIs()`
- `renderCadastranteMesChart()`

---

#### 📊 **canal**

**Arquivo**: `public\scripts\pages\ouvidoria\canal.js`
**Descrição**: * Página: Canais
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Canal`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Canal', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          const

**Gráficos** (1):

- **`chartCanal`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartCanal', labels, values, {       type: 'doughnut',       onClick: true, /...

**KPIs e Cards** (8):

- **`kpiTotalCanal`** (KPI)
- **`kpiCanaisUnicos`** (KPI)
- **`kpiMediaCanal`** (KPI)
- **`kpiCanalMaisUsado`** (KPI)
- **`kpiTotalCanal`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiCanaisUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaCanal`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiCanalMaisUsado`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Canal`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Canal` → `null` → [slice]

**Funções Principais** (2):
- `loadCanal()`
- `updateCanalKPIs()`

---

#### 📊 **categoria**

**Arquivo**: `public\scripts\pages\ouvidoria\categoria.js`
**Descrição**: * Página: Categoria
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/aggregate/count-by?field=Categoria`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length, slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Categoria', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          /

- **`/api/aggregate/count-by-status-mes?field=Categoria`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Categoria', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

**Gráficos** (2):

- **`chartCategoria`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartCategoria', labels, values, {       horizontal: true,       colorIndex: 4,  ...

- **`chartCategoriaMes`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('chartCategoriaMes', labels, datasets, {     colorIndex: 0,     legendContainer: 'l...

**KPIs e Cards** (8):

- **`kpiTotalCategoria`** (KPI)
- **`kpiCategoriasUnicas`** (KPI)
- **`kpiMediaCategoria`** (KPI)
- **`kpiCategoriaMaisComum`** (KPI)
- **`kpiTotalCategoria`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiCategoriasUnicas`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaCategoria`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiCategoriaMaisComum`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 10 uso(s)
- `dateUtils`: 1 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Categoria`: dataStore (TTL: 10ms)
- `/api/aggregate/count-by-status-mes?field=Categoria`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Categoria` → `null` → [length, slice]
- API: `/api/aggregate/count-by-status-mes?field=Categoria` → `null` → []

**Funções Principais** (3):
- `loadCategoria()`
- `renderCategoriaMesChart()`
- `updateCategoriaKPIs()`

---

#### 📊 **cora-chat**

**Arquivo**: `public\scripts\pages\ouvidoria\cora-chat.js`
**Descrição**: * Página: Cora Chat
 * Interface de chat com assistente virtual
 * 
 * Baseado no sistema antigo, adaptado para o modelo novo

**APIs Utilizadas** (3):

- **`/api/chat/messages`**
  - Tipo: fetch
  - Variável: `N/A`
  - Uso: messages
  - Contexto: fetch('/api/chat/messages', {       credentials: 'include' // Enviar cookies de sessão     });     if (response.ok) {       const data = await res

- **`/api/chat/messages`**
  - Tipo: fetch
  - Variável: `N/A`
  - Uso: message, response
  - Contexto: fetch('/api/chat/messages', {       method: 'POST',       headers: { 'Content-Type': 'application/json' },       credentials: 'include', // Enviar

- **`/api/chat/messages`**
  - Tipo: fetch
  - Variável: `N/A`
  - Contexto: fetch('/api/chat/messages', {         method: 'POST',         headers: { 'Content-Type': 'application/json' },         credentials: 'include', // E

**Sistemas Globais Usados**:
- `Logger`: 54 uso(s)

**Fluxo de Dados**:
- API: `/api/chat/messages` → `null` → [messages]
- API: `/api/chat/messages` → `null` → [message, response]
- API: `/api/chat/messages` → `null` → []

**Funções Principais** (6):
- `loadCoraChat()`
- `loadChatMessages()`
- `formatChatTime()`
- `renderMessages()`
- `sendMessage()`
- `initChatPage()`

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

**APIs Utilizadas** (4):

- **`/api/notificacoes?limit=50`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 60ms (0s)
  - Contexto: window.dataLoader?.load('/api/notificacoes?limit=50', {         useDataStore: true,         ttl: 60 * 1000 // 1 minuto       }),       window.dataLoad

- **`/api/notificacoes/stats`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 5ms (0s)
  - Contexto: window.dataLoader?.load('/api/notificacoes/stats', {         useDataStore: true,         ttl: 5 * 60 * 1000 // 5 minutos       }),       window.dataLo

- **`/api/notificacoes/ultima-execucao`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 60ms (0s)
  - Contexto: window.dataLoader?.load('/api/notificacoes/ultima-execucao', {         useDataStore: true,         ttl: 60 * 1000 // 1 minuto       })     ]);      //

- **`/api/notificacoes/enviar-selecionados`**
  - Tipo: fetch
  - Variável: `N/A`
  - Uso: enviados, erros, detalhes
  - Contexto: fetch('/api/notificacoes/enviar-selecionados', {       method: 'POST',       headers: {         'Content-Type': 'application/json'       },       body

**Gráficos** (1):

- **`notificacoes-chart-tipo`** (doughnut)
  - Dados: `tipos`
  - Interativo: ❌ Não
  - Contexto: createDoughnutChart('notificacoes-chart-tipo', tipos, valores, {       colorIndex: 0,       onClick:...

**Sistemas Globais Usados**:
- `dataLoader`: 6 uso(s)
- `chartFactory`: 2 uso(s)
- `Logger`: 10 uso(s)

**Uso de Cache**:
- `/api/notificacoes?limit=50`: dataStore (TTL: 60ms)
- `/api/notificacoes/stats`: dataStore (TTL: 5ms)
- `/api/notificacoes/ultima-execucao`: dataStore (TTL: 60ms)

**Fluxo de Dados**:
- API: `/api/notificacoes?limit=50` → `null` → []
- API: `/api/notificacoes/stats` → `null` → []
- API: `/api/notificacoes/ultima-execucao` → `null` → []
- API: `/api/notificacoes/enviar-selecionados` → `null` → [enviados, erros, detalhes]

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
  - Variável: `N/A`
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {           useDataStore: !forceRefresh,           ttl: 10 * 60 * 1000         }) || [

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Variável: `os`
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {           useDataStore: !forceRefresh,           ttl: 10 * 60 * 1000         }) || [];

- **`/api/aggregate/count-by?field=Orgaos`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Orgaos', {         useDataStore: !forceRefresh,         ttl: 10 * 60 * 1000       }) || [];

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Variável: `dataOrgaos`
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {         useDataStore: !forceRefresh,         ttl: 10 * 60 * 1000       }) || [];              //

- **`/api/filter`**
  - Tipo: fetch
  - Variável: `N/A`
  - Contexto: fetch('/api/filter', {           method: 'POST',           headers: {             'Content-Type': 'application/json'           },           credential

**Gráficos** (2):

- **`chartOrgaoMes`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartOrgaoMes', labels, values, {     horizontal: false, // Gráfico vertical     col...

- **`chartTopOrgaosBar`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartTopOrgaosBar', labels, values, {     horizontal: true,     colorIndex: 2,     l...

**KPIs e Cards** (8):

- **`kpiTotalOrgaos`** (KPI)
- **`kpiOrgaosUnicos`** (KPI)
- **`kpiMediaOrgao`** (KPI)
- **`kpiPeriodo`** (KPI)
- **`kpiTotalOrgaos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiOrgaosUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaOrgao`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiPeriodo`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Filtros** (2): filtroMesOrgaoMes, filtroStatusOrgaoMes

**Sistemas Globais Usados**:
- `dataLoader`: 8 uso(s)
- `dataStore`: 2 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 14 uso(s)
- `Logger`: 68 uso(s)
- `dateUtils`: 5 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Orgaos`: sem cache (TTL: 10ms)
- `/api/aggregate/by-month`: sem cache (TTL: 10ms)
- `/api/aggregate/count-by?field=Orgaos`: sem cache (TTL: 10ms)
- `/api/aggregate/by-month`: sem cache (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Orgaos` → `null` → []
- API: `/api/aggregate/by-month` → `os` → []
- API: `/api/aggregate/count-by?field=Orgaos` → `null` → []
- API: `/api/aggregate/by-month` → `dataOrgaos` → []
- API: `/api/filter` → `null` → []

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

**APIs Utilizadas** (6):

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - TTL: 5ms (0s)
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {           useDataStore: !forceRefresh,           ttl: 5 * 60 * 1000 // 5 minutos ao invés de 5 segu

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - TTL: 5ms (0s)
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {         useDataStore: !forceRefresh,         ttl: 5 * 60 * 1000 // 5 minutos ao invés de 5 segundos

- **`/api/sla/summary`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - TTL: 5ms (0s)
  - Contexto: window.dataLoader?.load('/api/sla/summary', {         useDataStore: !shouldRefresh,         ttl: 5 * 60 * 1000       });     }          if (slaD

- **`/api/ai/insights`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 5ms (0s)
  - Contexto: window.dataLoader?.load('/api/ai/insights', {       useDataStore: true,       ttl: 5 * 60 * 1000 // 5 minutos     }) || {};          const insigh

- **`/api/filter`**
  - Tipo: fetch
  - Variável: `N/A`
  - Contexto: fetch('/api/filter', {           method: 'POST',           headers: {             'Content-Type': 'application/json'           },           crede

- **`/api/filter`**
  - Tipo: fetch
  - Variável: `N/A`
  - Contexto: fetch('/api/filter', {             method: 'POST',             headers: {               'Content-Type': 'application/json'             },

**Gráficos** (10):

- **`chartDailyDistribution`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartDailyDistribution', labels, values, {         colorIndex: 0,         onClick:...

- **`chartTopOrgaos`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartTopOrgaos', labels, values, {         horizontal: true,         colorIndex: 1...

- **`chartTopTemas`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartTopTemas', labels, values, {         horizontal: true,         colorIndex: 2,...

- **`chartUnidadesCadastro`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartUnidadesCadastro', labels, values, {         horizontal: true,         colorI...

- **`chartTrend`** (line)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('chartTrend', labels, values, {         label: 'Manifestações',         colorIndex...

- **`chartFunnelStatus`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartFunnelStatus', labels, values, {         type: 'doughnut',         onCli...

- **`chartTiposManifestacao`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartTiposManifestacao', labels, values, {         field: 'tipoDeManifestacao'...

- **`chartCanais`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartCanais', labels, values, {         onClick: true,         legendContaine...

- **`chartPrioridades`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartPrioridades', labels, values, {         onClick: true,         legendCon...

- **`chartSLA`** (doughnut)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createDoughnutChart('chartSLA', labels, values, {         chartOptions: {           plugins: {   ...

**KPIs e Cards** (6):

- **`kpiTotal`** (KPI)
- **`kpi7`** (KPI)
- **`kpi30`** (KPI)
- **`kpiTotal`** (KPI)
  - Fonte: `(summary.total || 0).to`
  - Variável de dados: `summary`
- **`kpi7`** (KPI)
  - Fonte: `(summary.total || 0).toLocaleString('pt-BR')`
  - Variável de dados: `summary`
- **`kpi30`** (KPI)
  - Fonte: `(summary.total || 0).toLocaleString('pt-BR')`
  - Variável de dados: `summary`

**Sistemas Globais Usados**:
- `dataLoader`: 4 uso(s)
- `dataStore`: 6 uso(s)
- `chartFactory`: 15 uso(s)
- `chartCommunication`: 23 uso(s)
- `Logger`: 100 uso(s)
- `dateUtils`: 3 uso(s)

**Uso de Cache**:
- `/api/dashboard-data`: sem cache (TTL: 5ms)
- `/api/dashboard-data`: sem cache (TTL: 5ms)
- `/api/sla/summary`: sem cache (TTL: 5ms)
- `/api/ai/insights`: dataStore (TTL: 5ms)

**Fluxo de Dados**:
- API: `/api/dashboard-data` → `null` → []
- API: `/api/dashboard-data` → `null` → []
- API: `/api/sla/summary` → `null` → []
- API: `/api/ai/insights` → `null` → []
- API: `/api/filter` → `null` → []
- API: `/api/filter` → `null` → []

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

---

#### 📊 **prioridade**

**Arquivo**: `public\scripts\pages\ouvidoria\prioridade.js`
**Descrição**: * Página: Prioridades
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Prioridade`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Prioridade', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

**Gráficos** (1):

- **`chartPrioridade`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartPrioridade', labels, values, {       type: 'doughnut',       onClick: tr...

**KPIs e Cards** (8):

- **`kpiTotalPrioridade`** (KPI)
- **`kpiPrioridadesUnicas`** (KPI)
- **`kpiMediaPrioridade`** (KPI)
- **`kpiPrioridadeMaisComum`** (KPI)
- **`kpiTotalPrioridade`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiPrioridadesUnicas`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaPrioridade`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiPrioridadeMaisComum`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Prioridade`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Prioridade` → `null` → [slice]

**Funções Principais** (2):
- `loadPrioridade()`
- `updatePrioridadeKPIs()`

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
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {         useDataStore: true,         ttl: 10 * 60 * 1000       }) || [],       window.dataLoader?.

- **`/api/aggregate/by-theme`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-theme', {         useDataStore: true,         ttl: 10 * 60 * 1000       }) || [],       window.dataLoader?.

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {         useDataStore: true,         ttl: 10 * 60 * 1000       }) || {}     ]);          // Extrair ti

**Gráficos** (6):

- **`chartCrescimentoPercentual`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartCrescimentoPercentual', labels, valores, {         colorIndex: 0,         onCli...

- **`chartSazonalidade`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartSazonalidade', labels, valores, {     colorIndex: 2,     onClick: true, // Habi...

- **`chartProjecaoTema`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartProjecaoTema', labels, valoresAtuais, {     colorIndex: 0,     onClick: true, /...

- **`chartProjecaoMensal`** (line)
  - Dados: `todosLabels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('chartProjecaoMensal', todosLabels, datasets, {     fill: true,     tension: 0.4,   ...

- **`chartComparacaoAnual`** (line)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('chartComparacaoAnual', labels, datasets, {     fill: false,     onClick: true, // H...

- **`chartProjecaoTipo`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartProjecaoTipo', labels, valores, {     onClick: true, // Habilitar comunica...

**KPIs e Cards** (2):

- **`kpisProjecao`** (KPI)
- **`kpisProjecao`** (KPI)
  - Fonte: `'<div class="text-slate-400 text-sm">Dados de análise não disponíveis</div>'`

**Sistemas Globais Usados**:
- `dataLoader`: 3 uso(s)
- `chartFactory`: 6 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 12 uso(s)
- `dateUtils`: 2 uso(s)

**Uso de Cache**:
- `/api/aggregate/by-month`: dataStore (TTL: 10ms)
- `/api/aggregate/by-theme`: dataStore (TTL: 10ms)
- `/api/dashboard-data`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/by-month` → `null` → []
- API: `/api/aggregate/by-theme` → `null` → []
- API: `/api/dashboard-data` → `null` → []

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

---

#### 📊 **reclamacoes**

**Arquivo**: `public\scripts\pages\ouvidoria\reclamacoes.js`
**Descrição**: * Página: Reclamações e Denúncias
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/complaints-denunciations`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: assuntos, tipos
  - Contexto: window.dataLoader?.load('/api/complaints-denunciations', {         useDataStore: true,         ttl: 10 * 60 * 1000       }) || { assuntos: [], tipo

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: assuntos, tipos
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {         useDataStore: true,         ttl: 10 * 60 * 1000       }) || []     ]);          con

**Gráficos** (2):

- **`chartReclamacoesTipo`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartReclamacoesTipo', labels, values, {     horizontal: true,     field: 'tipoDeM...

- **`chartReclamacoesMes`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('chartReclamacoesMes', labels, values, {     colorIndex: 4,     label: 'Quantidade'...

**KPIs e Cards** (8):

- **`kpiTotalReclamacoes`** (KPI)
- **`kpiTotalDenuncias`** (KPI)
- **`kpiAssuntosUnicos`** (KPI)
- **`kpiAssuntoMaisComum`** (KPI)
- **`kpiTotalReclamacoes`** (KPI)
  - Fonte: `totalReclamacoes.toLocaleString('pt-BR')`
  - Variável de dados: `totalReclamacoes`
- **`kpiTotalDenuncias`** (KPI)
  - Fonte: `totalReclamacoes.toLocaleString('pt-BR')`
  - Variável de dados: `totalReclamacoes`
- **`kpiAssuntosUnicos`** (KPI)
  - Fonte: `totalReclamacoes.toLocaleString('pt-BR')`
  - Variável de dados: `totalReclamacoes`
- **`kpiAssuntoMaisComum`** (KPI)
  - Fonte: `totalReclamacoes.toLocaleString('pt-BR')`
  - Variável de dados: `totalReclamacoes`

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 2 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 12 uso(s)
- `dateUtils`: 1 uso(s)

**Uso de Cache**:
- `/api/complaints-denunciations`: dataStore (TTL: 10ms)
- `/api/aggregate/by-month`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/complaints-denunciations` → `null` → [assuntos, tipos]
- API: `/api/aggregate/by-month` → `null` → [assuntos, tipos]

**Funções Principais** (5):
- `loadReclamacoes()`
- `renderReclamacoesAssuntosList()`
- `renderTiposChart()`
- `updateReclamacoesKPIs()`
- `renderReclamacoesMesChart()`

---

#### 📊 **responsavel**

**Arquivo**: `public\scripts\pages\ouvidoria\responsavel.js`
**Descrição**: * Página: Responsáveis
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Responsavel`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Responsavel', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

**Gráficos** (1):

- **`chartResponsavel`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartResponsavel', labels, values, {       horizontal: true,       colorIndex: 7,...

**KPIs e Cards** (8):

- **`kpiTotalResponsavel`** (KPI)
- **`kpiResponsaveisUnicos`** (KPI)
- **`kpiMediaResponsavel`** (KPI)
- **`kpiResponsavelMaisAtivo`** (KPI)
- **`kpiTotalResponsavel`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiResponsaveisUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaResponsavel`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiResponsavelMaisAtivo`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Responsavel`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Responsavel` → `null` → [slice]

**Funções Principais** (2):
- `loadResponsavel()`
- `updateResponsavelKPIs()`

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
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Secretaria', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

- **`/api/aggregate/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (dataMes.lengt

**Gráficos** (2):

- **`chartSecretaria`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartSecretaria', labels, values, {       horizontal: true,       colorIndex: 0, ...

- **`chartSecretariaMes`** (bar)
  - Dados: `labelsMes`
  - Interativo: ❌ Não
  - Contexto: createBarChart('chartSecretariaMes', labelsMes, valuesMes, {         colorIndex: 0,         label:...

**KPIs e Cards** (8):

- **`kpiTotalSecretaria`** (KPI)
- **`kpiSecretariasUnicas`** (KPI)
- **`kpiMediaSecretaria`** (KPI)
- **`kpiSecretariaMaisAtiva`** (KPI)
- **`kpiTotalSecretaria`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiSecretariasUnicas`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaSecretaria`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiSecretariaMaisAtiva`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 2 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)
- `dateUtils`: 1 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Secretaria`: dataStore (TTL: 10ms)
- `/api/aggregate/by-month`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Secretaria` → `null` → [slice]
- API: `/api/aggregate/by-month` → `null` → []

**Funções Principais** (2):
- `loadSecretaria()`
- `updateSecretariaKPIs()`

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
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/distritos', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || null;          if (!distritosData) {

**Gráficos** (1):

- **`chartSecretariasDistritos`** (bar)
  - Dados: `distritoLabels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartSecretariasDistritos', distritoLabels, distritoValues, {       colorIndex: 9,...

**KPIs e Cards** (8):

- **`kpiTotalSecretariasDistritos`** (KPI)
- **`kpiTotalDistritos`** (KPI)
- **`kpiTotalBairros`** (KPI)
- **`kpiMediaSecretariasDistrito`** (KPI)
- **`kpiTotalSecretariasDistritos`** (KPI)
  - Fonte: `totalSecretarias.toLocaleString('pt-BR')`
  - Variável de dados: `totalSecretarias`
- **`kpiTotalDistritos`** (KPI)
  - Fonte: `totalSecretarias.toLocaleString('pt-BR')`
  - Variável de dados: `totalSecretarias`
- **`kpiTotalBairros`** (KPI)
  - Fonte: `totalSecretarias.toLocaleString('pt-BR')`
  - Variável de dados: `totalSecretarias`
- **`kpiMediaSecretariasDistrito`** (KPI)
  - Fonte: `totalSecretarias.toLocaleString('pt-BR')`
  - Variável de dados: `totalSecretarias`

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `dataStore`: 2 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)

**Uso de Cache**:
- `/api/distritos`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/distritos` → `null` → []

**Funções Principais** (5):
- `loadSecretariasDistritos()`
- `renderDistritosList()`
- `renderDistritosEstatisticas()`
- `renderSecretariasDistritosChart()`
- `updateSecretariasDistritosKPIs()`

---

#### 📊 **setor**

**Arquivo**: `public\scripts\pages\ouvidoria\setor.js`
**Descrição**: * Página: Setor (Unidade de Cadastro)
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Setor`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Setor', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          const

**Gráficos** (1):

- **`chartSetor`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartSetor', labels, values, {       horizontal: true,       colorIndex: 1,      ...

**KPIs e Cards** (8):

- **`kpiTotalSetor`** (KPI)
- **`kpiSetoresUnicos`** (KPI)
- **`kpiMediaSetor`** (KPI)
- **`kpiSetorMaisAtivo`** (KPI)
- **`kpiTotalSetor`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiSetoresUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaSetor`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiSetorMaisAtivo`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Setor`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Setor` → `null` → [slice]

**Funções Principais** (2):
- `loadSetor()`
- `updateSetorKPIs()`

---

#### 📊 **status**

**Arquivo**: `public\scripts\pages\ouvidoria\status.js`
**Descrição**: * Página: Status
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (2):

- **`/api/aggregate/count-by?field=Status`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 5ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Status', {       useDataStore: true,       ttl: 5 * 60 * 1000     }) || [];          // Va

- **`/api/aggregate/count-by-status-mes?field=Status`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Status', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

**Gráficos** (4):

- **`chartStatusMes`** (bar)
  - Dados: `0`
  - Interativo: ❌ Não
  - Contexto: createBarChart('chartStatusMes', ['Sem dados'], [{ label: 'Sem dados', data: [0] }], {           co...

- **`chartStatusMes`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('chartStatusMes', labels, datasets, {     colorIndex: 0,     legendContainer: 'lege...

- **`chartStatusPage`** (doughnut)
  - Dados: `false`
  - Interativo: ❌ Não
  - Contexto: createDoughnutChart('chartStatusPage', ['Sem dados'], [1], {         type: 'doughnut',         onC...

- **`chartStatusPage`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartStatusPage', labels, values, {         type: 'doughnut',         onClick...

**KPIs e Cards** (8):

- **`kpiTotalStatus`** (KPI)
- **`kpiStatusUnicos`** (KPI)
- **`kpiStatusMaisComum`** (KPI)
- **`kpiTaxaConclusao`** (KPI)
- **`kpiTotalStatus`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiStatusUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiStatusMaisComum`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiTaxaConclusao`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 7 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 10 uso(s)
- `dateUtils`: 1 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Status`: dataStore (TTL: 5ms)
- `/api/aggregate/count-by-status-mes?field=Status`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Status` → `null` → []
- API: `/api/aggregate/count-by-status-mes?field=Status` → `null` → []

**Funções Principais** (4):
- `loadStatusPage()`
- `initStatusFilterListeners()`
- `renderStatusMesChart()`
- `updateStatusKPIs()`

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
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/by-theme', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // Validar dados receb

- **`/api/aggregate/count-by-status-mes?field=Tema`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by-status-mes?field=Tema', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

- **`/api/dashboard-data`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/dashboard-data', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || {};          const statusData = dashboa

**Gráficos** (3):

- **`chartTema`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartTema', labels, values, {     horizontal: true,     colorIndex: 2,     label: 'M...

- **`chartTemaMes`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('chartTemaMes', labels, datasets, {     colorIndex: 0,     legendContainer: 'legendTe...

- **`chartStatusTema`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartStatusTema', labels, values, {         type: 'doughnut',         onClick: ...

**KPIs e Cards** (8):

- **`kpiTotalTema`** (KPI)
- **`kpiTemasUnicos`** (KPI)
- **`kpiMediaTema`** (KPI)
- **`kpiTemaMaisComum`** (KPI)
- **`kpiTotalTema`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiTemasUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaTema`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiTemaMaisComum`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 3 uso(s)
- `chartFactory`: 5 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 30 uso(s)
- `dateUtils`: 1 uso(s)

**Uso de Cache**:
- `/api/aggregate/by-theme`: dataStore (TTL: 10ms)
- `/api/aggregate/count-by-status-mes?field=Tema`: dataStore (TTL: 10ms)
- `/api/dashboard-data`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/by-theme` → `null` → []
- API: `/api/aggregate/count-by-status-mes?field=Tema` → `null` → []
- API: `/api/dashboard-data` → `null` → []

**Funções Principais** (7):
- `loadTema()`
- `initTemaFilterListeners()`
- `renderTemaChart()`
- `renderStatusTemaChart()`
- `renderTemaMesChart()`
- `updateTemaKPIs()`
- `renderTemasList()`

---

#### 📊 **tempo-medio**

**Arquivo**: `public\scripts\pages\ouvidoria\tempo-medio.js`
**Descrição**: * Página: Tempo Médio
 * Análise do tempo médio de atendimento em dias
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/stats/average-time/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 5ms (0s)
  - Contexto: window.dataLoader?.load('/api/stats/average-time/by-month', {       fallback: [], // Fallback para erro 502       useDataStore: true,       ttl: 5

**Gráficos** (6):

- **`chartTempoMedio`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartTempoMedio', labels, values, {           horizontal: true,           colorInd...

- **`chartTempoMedioUnidade`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartTempoMedioUnidade', labels, values, {           horizontal: true,           c...

- **`chartTempoMedioMes`** (line)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('chartTempoMedioMes', labels, values, {           label: 'Tempo Médio (dias)',    ...

- **`chartTempoMedioDia`** (line)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('chartTempoMedioDia', labels, values, {           label: 'Tempo Médio (dias)',    ...

- **`chartTempoMedioSemana`** (line)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('chartTempoMedioSemana', labels, values, {           label: 'Tempo Médio (dias)', ...

- **`chartTempoMedioUnidadeMes`** (line)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('chartTempoMedioUnidadeMes', labels, datasets, {           fill: false,           ...

**Filtros** (1): selectMesTempoMedio

**Sistemas Globais Usados**:
- `dataLoader`: 7 uso(s)
- `dataStore`: 4 uso(s)
- `chartFactory`: 6 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 46 uso(s)
- `dateUtils`: 4 uso(s)

**Uso de Cache**:
- `/api/stats/average-time/by-month`: dataStore (TTL: 5ms)

**Fluxo de Dados**:
- API: `/api/stats/average-time/by-month` → `null` → []

**Funções Principais** (8):
- `destroyChartSafely()`
- `destroyAllTempoMedioCharts()`
- `loadTempoMedio()`
- `popularDropdownMeses()`
- `renderTempoMedioStats()`
- `renderTempoMedioCharts()`
- `renderTempoMedioRanking()`
- `loadSecondaryTempoMedioData()`

---

#### 📊 **tipo**

**Arquivo**: `public\scripts\pages\ouvidoria\tipo.js`
**Descrição**: * Página: Tipos de Manifestação
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=Tipo`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=Tipo', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          const

**Gráficos** (1):

- **`chartTipo`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartTipo', labels, values, {       type: 'pie',       field: 'tipoDeManifest...

**KPIs e Cards** (8):

- **`kpiTotalTipo`** (KPI)
- **`kpiTiposUnicos`** (KPI)
- **`kpiMediaTipo`** (KPI)
- **`kpiTipoMaisComum`** (KPI)
- **`kpiTotalTipo`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiTiposUnicos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaTipo`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiTipoMaisComum`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)
- `config`: 1 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=Tipo`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=Tipo` → `null` → [slice]

**Funções Principais** (2):
- `loadTipo()`
- `updateTipoKPIs()`

---

#### 📊 **uac**

**Arquivo**: `public\scripts\pages\ouvidoria\uac.js`
**Descrição**: * Página: UAC (Unidade de Atendimento ao Cidadão)
 * 
 * Recriada com estrutura otimizada

**APIs Utilizadas** (1):

- **`/api/aggregate/count-by?field=UAC`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: slice
  - Contexto: window.dataLoader?.load('/api/aggregate/count-by?field=UAC', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          const t

**Gráficos** (1):

- **`chartUAC`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartUAC', labels, values, {       horizontal: true,       colorIndex: 6,       l...

**KPIs e Cards** (8):

- **`kpiTotalUAC`** (KPI)
- **`kpiUACsUnicas`** (KPI)
- **`kpiMediaUAC`** (KPI)
- **`kpiUACMaisAtiva`** (KPI)
- **`kpiTotalUAC`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiUACsUnicas`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiMediaUAC`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiUACMaisAtiva`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)

**Uso de Cache**:
- `/api/aggregate/count-by?field=UAC`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/aggregate/count-by?field=UAC` → `null` → [slice]

**Funções Principais** (2):
- `loadUAC()`
- `updateUACKPIs()`

---

#### 📊 **unidades-saude**

**Arquivo**: `public\scripts\pages\ouvidoria\unidades-saude.js`
**Descrição**: * Página: Unidades de Saúde (Unificada)
 * Página única com dropdown para selecionar unidades
 * 
 * Recriada com estrutura otimizada

**KPIs e Cards** (8):

- **`kpiTotalUnidadeSaude`** (KPI)
- **`kpiAssuntosUnicosUnidade`** (KPI)
- **`kpiTiposUnicosUnidade`** (KPI)
- **`kpiAssuntoMaisComumUnidade`** (KPI)
- **`kpiTotalUnidadeSaude`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiAssuntosUnicosUnidade`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiTiposUnicosUnidade`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiAssuntoMaisComumUnidade`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Filtros** (1): selectUnidade

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 14 uso(s)

**Funções Principais** (8):
- `loadUnidadesSaude()`
- `popularDropdown()`
- `mostrarMensagemSelecao()`
- `carregarDadosUnidade()`
- `renderUnidadeAssuntosList()`
- `renderUnidadeTiposChart()`
- `initUnidadesSaudeFilterListeners()`
- `updateUnidadesSaudeKPIs()`

---

#### 📊 **unit**

**Arquivo**: `public\scripts\pages\ouvidoria\unit.js`
**Descrição**: * Página: Unidades de Saúde (Dinâmico)
 * Páginas dinâmicas para cada unidade de saúde
 * 
 * Recriada com estrutura otimizada

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartFactory`: 1 uso(s)
- `chartCommunication`: 5 uso(s)
- `Logger`: 6 uso(s)

**Funções Principais** (3):
- `loadUnit()`
- `renderUnitAssuntosList()`
- `renderUnitTiposChart()`

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

**APIs Utilizadas** (2):

- **`/api/distinct?field=Secretaria`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: secretarias
  - Contexto: window.dataLoader?.load('/api/distinct?field=Secretaria', {         useDataStore: true,         ttl: 10 * 60 * 1000,         fallback: []       }) ||

- **`/api/secretarias`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: secretarias
  - Contexto: window.dataLoader?.load('/api/secretarias', {             useDataStore: true,             ttl: 10 * 60 * 1000,             fallback: { secretarias: []

**KPIs e Cards** (8):

- **`kpiTotalVencimento`** (KPI)
- **`kpiVencidos`** (KPI)
- **`kpiVencendo3`** (KPI)
- **`kpiVencendo7`** (KPI)
- **`kpiTotalVencimento`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiVencidos`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiVencendo3`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`
- **`kpiVencendo7`** (KPI)
  - Fonte: `total.toLocaleString('pt-BR')`
  - Variável de dados: `total`

**Filtros** (3): selectSecretariaVencimento, selectFiltroVencimento, filtroLabelVencimento

**Sistemas Globais Usados**:
- `dataLoader`: 5 uso(s)
- `dataStore`: 3 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 30 uso(s)

**Uso de Cache**:
- `/api/distinct?field=Secretaria`: dataStore (TTL: 10ms)
- `/api/secretarias`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/distinct?field=Secretaria` → `null` → [secretarias]
- API: `/api/secretarias` → `null` → [secretarias]

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

---

#### 📊 **zeladoria-bairro**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-bairro.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (4):

- **`/api/zeladoria/count-by?field=bairro`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=bairro', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // Valida

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (dataMes.length > 0

- **`/api/zeladoria/geographic`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/geographic', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (geoData.length >

- **`/api/zeladoria/count-by?field=origem`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=origem', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // Render

**Gráficos** (2):

- **`zeladoria-bairro-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-bairro-chart', labels, values, {       horizontal: true,       colorIndex:...

- **`zeladoria-bairro-mes-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-bairro-mes-chart', labels, datasets, {     colorIndex: 0,     onClick: tru...

**Sistemas Globais Usados**:
- `dataLoader`: 4 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 14 uso(s)
- `dateUtils`: 2 uso(s)

**Uso de Cache**:
- `/api/zeladoria/count-by?field=bairro`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-month`: dataStore (TTL: 10ms)
- `/api/zeladoria/geographic`: dataStore (TTL: 10ms)
- `/api/zeladoria/count-by?field=origem`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/count-by?field=bairro` → `null` → [length]
- API: `/api/zeladoria/by-month` → `null` → []
- API: `/api/zeladoria/geographic` → `null` → []
- API: `/api/zeladoria/count-by?field=origem` → `null` → []

**Funções Principais** (7):
- `loadZeladoriaBairro()`
- `renderBairroMesChart()`
- `renderBairroRanking()`
- `renderBairroGeoInfo()`
- `renderBairroStats()`
- `loadBairroDadosAdicionais()`
- `updateZeladoriaBairroKPIs()`

---

#### 📊 **zeladoria-canal**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-canal.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/count-by?field=canal`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=canal', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // Validar

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (dataMes.length > 0

**Gráficos** (2):

- **`zeladoria-canal-mes-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-canal-mes-chart', labels, datasets, {     colorIndex: 0,     onClick: true...

- **`zeladoria-canal-chart`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('zeladoria-canal-chart', labels, values, {       onClick: true,       field: 'ca...

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 8 uso(s)
- `dateUtils`: 2 uso(s)

**Uso de Cache**:
- `/api/zeladoria/count-by?field=canal`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-month`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/count-by?field=canal` → `null` → [length]
- API: `/api/zeladoria/by-month` → `null` → []

**Funções Principais** (5):
- `loadZeladoriaCanal()`
- `renderCanalMesChart()`
- `renderCanalRanking()`
- `renderCanalStats()`
- `updateZeladoriaCanalKPIs()`

---

#### 📊 **zeladoria-categoria**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-categoria.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (3):

- **`/api/zeladoria/count-by?field=categoria`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=categoria', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // Val

- **`/api/zeladoria/by-categoria-departamento`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-categoria-departamento', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || {};          if (O

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (dataMes.length > 0

**Gráficos** (3):

- **`zeladoria-categoria-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-categoria-chart', labels, values, {       horizontal: true,       colorInd...

- **`zeladoria-categoria-mes-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-categoria-mes-chart', labels, datasets, {     colorIndex: 0,     onClick: ...

- **`zeladoria-categoria-dept-chart`** (bar)
  - Dados: `departamentos`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-categoria-dept-chart', departamentos, datasets, {     colorIndex: 2,     o...

**Sistemas Globais Usados**:
- `dataLoader`: 3 uso(s)
- `chartFactory`: 5 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 12 uso(s)
- `dateUtils`: 2 uso(s)

**Uso de Cache**:
- `/api/zeladoria/count-by?field=categoria`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-categoria-departamento`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-month`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/count-by?field=categoria` → `null` → [length]
- API: `/api/zeladoria/by-categoria-departamento` → `null` → []
- API: `/api/zeladoria/by-month` → `null` → []

**Funções Principais** (6):
- `loadZeladoriaCategoria()`
- `renderCategoriaMesChart()`
- `renderCategoriaDepartamentoChart()`
- `renderCategoriaRanking()`
- `renderCategoriaStats()`
- `updateZeladoriaCategoriaKPIs()`

---

#### 📊 **zeladoria-colab**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-colab.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (4):

- **`/api/colab/categories?type=post`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/colab/categories?type=post', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || { categories: [] };

- **`/api/colab/categories?type=post`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/colab/categories?type=post', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || { categories: [] };

- **`/api/colab/categories?type=post`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/colab/categories?type=post', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || { categories: [] };

- **`/api/colab/posts`**
  - Tipo: fetch
  - Variável: `N/A`
  - Contexto: fetch('/api/colab/posts', {       method: 'POST',       headers: { 'Content-Type': 'application/json' },       credentials: 'include', // Enviar co

**Gráficos** (2):

- **`chartZeladoriaCategoria`** (bar)
  - Dados: `true`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('chartZeladoriaCategoria',         topCategorias.map(c => c[0]),         topCategor...

- **`chartZeladoriaStatus`** (doughnut)
  - Dados: `statusCounts`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('chartZeladoriaStatus',          Object.keys(statusCounts),          Object.va...

**Sistemas Globais Usados**:
- `dataLoader`: 5 uso(s)
- `chartFactory`: 2 uso(s)
- `chartCommunication`: 5 uso(s)
- `Logger`: 20 uso(s)
- `config`: 2 uso(s)

**Uso de Cache**:
- `/api/colab/categories?type=post`: dataStore (TTL: 10ms)
- `/api/colab/categories?type=post`: dataStore (TTL: 10ms)
- `/api/colab/categories?type=post`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/colab/categories?type=post` → `null` → []
- API: `/api/colab/categories?type=post` → `null` → []
- API: `/api/colab/categories?type=post` → `null` → []
- API: `/api/colab/posts` → `null` → []

**Funções Principais** (5):
- `loadZeladoriaOverview()`
- `loadColabDemandas()`
- `loadZeladoriaColabCriar()`
- `criarDemanda()`
- `loadZeladoriaColabCategorias()`

---

#### 📊 **zeladoria-departamento**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-departamento.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/count-by?field=departamento`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=departamento', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          //

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (dataMes.length > 0

**Gráficos** (2):

- **`zeladoria-departamento-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-departamento-chart', labels, values, {       horizontal: true,       color...

- **`zeladoria-departamento-mes-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-departamento-mes-chart', labels, datasets, {     colorIndex: 0,     onClic...

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 8 uso(s)
- `dateUtils`: 2 uso(s)

**Uso de Cache**:
- `/api/zeladoria/count-by?field=departamento`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-month`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/count-by?field=departamento` → `null` → [length]
- API: `/api/zeladoria/by-month` → `null` → []

**Funções Principais** (5):
- `loadZeladoriaDepartamento()`
- `renderDepartamentoMesChart()`
- `renderDepartamentoRanking()`
- `renderDepartamentoStats()`
- `updateZeladoriaDepartamentoKPIs()`

---

#### 📊 **zeladoria-geografica**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-geografica.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (1):

- **`/api/zeladoria/geographic`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length
  - Contexto: window.dataLoader?.load('/api/zeladoria/geographic', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          const content =

**Sistemas Globais Usados**:
- `dataLoader`: 1 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 1 uso(s)

**Uso de Cache**:
- `/api/zeladoria/geographic`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/geographic` → `null` → [length]

**Funções Principais** (2):
- `loadZeladoriaGeografica()`
- `updateZeladoriaGeograficaKPIs()`

---

#### 📊 **zeladoria-main**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-main.js`
**Descrição**: Sem descrição

**Sistemas Globais Usados**:
- `Logger`: 4 uso(s)

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
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length, map
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (data.length =

- **`/api/zeladoria/by-status-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-status-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || {};          if (Object

**Gráficos** (2):

- **`zeladoria-mensal-status-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-mensal-status-chart', labels, datasets, {     colorIndex: 0,     onClick...

- **`zeladoria-mensal-chart`** (line)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('zeladoria-mensal-chart', labels, values, {       colorIndex: 0,       onClick: tr...

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 8 uso(s)

**Uso de Cache**:
- `/api/zeladoria/by-month`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-status-month`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/by-month` → `null` → [length, map]
- API: `/api/zeladoria/by-status-month` → `null` → []

**Funções Principais** (4):
- `loadZeladoriaMensal()`
- `renderMensalStatusChart()`
- `renderMensalStats()`
- `updateZeladoriaMensalKPIs()`

---

#### 📊 **zeladoria-overview**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-overview.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (5):

- **`/api/zeladoria/stats`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/stats', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || {};          // Atualizar KPIs

- **`/api/zeladoria/count-by?field=status`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=status', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (

- **`/api/zeladoria/count-by?field=categoria`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=categoria', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          i

- **`/api/zeladoria/count-by?field=departamento`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=departamento', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (mensalData.le

**Gráficos** (4):

- **`zeladoria-chart-categoria`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('zeladoria-chart-categoria', labels, values, {         horizontal: true,         co...

- **`zeladoria-chart-departamento`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('zeladoria-chart-departamento', labels, values, {         horizontal: true,        ...

- **`zeladoria-chart-mensal`** (line)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createLineChart('zeladoria-chart-mensal', labels, values, {         colorIndex: 3       });     }...

- **`zeladoria-chart-status`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('zeladoria-chart-status', labels, values, {         onClick: true,         col...

**Sistemas Globais Usados**:
- `dataLoader`: 5 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 1 uso(s)

**Uso de Cache**:
- `/api/zeladoria/stats`: dataStore (TTL: 10ms)
- `/api/zeladoria/count-by?field=status`: dataStore (TTL: 10ms)
- `/api/zeladoria/count-by?field=categoria`: dataStore (TTL: 10ms)
- `/api/zeladoria/count-by?field=departamento`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-month`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/stats` → `null` → []
- API: `/api/zeladoria/count-by?field=status` → `null` → []
- API: `/api/zeladoria/count-by?field=categoria` → `null` → []
- API: `/api/zeladoria/count-by?field=departamento` → `null` → []
- API: `/api/zeladoria/by-month` → `null` → []

**Funções Principais** (1):
- `loadZeladoriaOverview()`

---

#### 📊 **zeladoria-responsavel**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-responsavel.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/count-by?field=responsavel`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=responsavel', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // V

- **`/api/zeladoria/by-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (dataMes.length > 0

**Gráficos** (2):

- **`zeladoria-responsavel-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-responsavel-chart', labels, values, {       horizontal: true,       colorI...

- **`zeladoria-responsavel-mes-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-responsavel-mes-chart', labels, datasets, {     colorIndex: 0,     onClick...

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 8 uso(s)
- `dateUtils`: 2 uso(s)

**Uso de Cache**:
- `/api/zeladoria/count-by?field=responsavel`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-month`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/count-by?field=responsavel` → `null` → [length]
- API: `/api/zeladoria/by-month` → `null` → []

**Funções Principais** (5):
- `loadZeladoriaResponsavel()`
- `renderResponsavelMesChart()`
- `renderResponsavelRanking()`
- `renderResponsavelStats()`
- `updateZeladoriaResponsavelKPIs()`

---

#### 📊 **zeladoria-status**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-status.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (3):

- **`/api/zeladoria/count-by?field=status`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: length
  - Contexto: window.dataLoader?.load('/api/zeladoria/count-by?field=status', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // Valida

- **`/api/zeladoria/by-status-month`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/by-status-month', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          if (dataMes.len

- **`/api/zeladoria/stats`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/stats', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || {};          renderStatusStats(stats,

**Gráficos** (2):

- **`zeladoria-status-mes-chart`** (bar)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createBarChart('zeladoria-status-mes-chart', labels, datasets, {     colorIndex: 0,     onClick: tru...

- **`zeladoria-status-chart`** (doughnut)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createDoughnutChart('zeladoria-status-chart', labels, values, {       onClick: true,       field: 's...

**Sistemas Globais Usados**:
- `dataLoader`: 3 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 8 uso(s)
- `dateUtils`: 2 uso(s)

**Uso de Cache**:
- `/api/zeladoria/count-by?field=status`: dataStore (TTL: 10ms)
- `/api/zeladoria/by-status-month`: dataStore (TTL: 10ms)
- `/api/zeladoria/stats`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/count-by?field=status` → `null` → [length]
- API: `/api/zeladoria/by-status-month` → `null` → []
- API: `/api/zeladoria/stats` → `null` → []

**Funções Principais** (5):
- `loadZeladoriaStatus()`
- `renderStatusMesChart()`
- `renderStatusRanking()`
- `renderStatusStats()`
- `updateZeladoriaStatusKPIs()`

---

#### 📊 **zeladoria-tempo**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-tempo.js`
**Descrição**: Sem descrição

**APIs Utilizadas** (2):

- **`/api/zeladoria/stats`**
  - Tipo: dataLoader
  - Variável: `N/A`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Contexto: window.dataLoader?.load('/api/zeladoria/stats', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || {};          // Carregar série tempora

- **`/api/zeladoria/time-series`**
  - Tipo: dataLoader
  - Variável: `stats`
  - Cache: ✅ Sim
  - TTL: 10ms (0s)
  - Uso: tempoMedio
  - Contexto: window.dataLoader?.load('/api/zeladoria/time-series', {       useDataStore: true,       ttl: 10 * 60 * 1000     }) || [];          // Renderizar KPIs

**Gráficos** (2):

- **`zeladoria-tempo-distribuicao-chart`** (bar)
  - Dados: `labels`
  - Interativo: ❌ Não
  - Contexto: createBarChart('zeladoria-tempo-distribuicao-chart', labels, values, {     colorIndex: 6,     horizo...

- **`zeladoria-tempo-mes-chart`** (line)
  - Dados: `labels`
  - Interativo: ✅ Sim
  - Contexto: createLineChart('zeladoria-tempo-mes-chart', labels, tempoMedio, {     colorIndex: 6,     label: 'Te...

**Sistemas Globais Usados**:
- `dataLoader`: 2 uso(s)
- `chartFactory`: 4 uso(s)
- `chartCommunication`: 3 uso(s)
- `Logger`: 6 uso(s)
- `dateUtils`: 2 uso(s)

**Uso de Cache**:
- `/api/zeladoria/stats`: dataStore (TTL: 10ms)
- `/api/zeladoria/time-series`: dataStore (TTL: 10ms)

**Fluxo de Dados**:
- API: `/api/zeladoria/stats` → `null` → []
- API: `/api/zeladoria/time-series` → `stats` → [tempoMedio]

**Funções Principais** (6):
- `loadZeladoriaTempo()`
- `renderTempoKPIs()`
- `renderTempoMesChart()`
- `renderTempoDistribuicao()`
- `renderTempoAnalises()`
- `updateZeladoriaTempoKPIs()`

---

## 🏗️ ELEMENTOS HTML MAPEADOS

### **home**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **main**

- **KPIs**: 6 (kpiTotal, kpiTotalDelta, kpi7, kpi7Delta, kpi30, kpi30Delta)
- **Gráficos**: 0 ()
- **Cards**: 3
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **orgao-mes**

- **KPIs**: 4 (kpiTotalOrgaos, kpiOrgaosUnicos, kpiMediaOrgao, kpiPeriodo)
- **Gráficos**: 2 (chartOrgaoMes, chartTopOrgaosBar)
- **Cards**: 11
- **Filtros**: 2 (filtroMesOrgaoMes, filtroStatusOrgaoMes)
- **Botões**: 1
- **Inputs**: 1
- **Tabelas**: 0

### **tempo-medio**

- **KPIs**: 0 ()
- **Gráficos**: 6 (chartTempoMedio, chartTempoMedioDia, chartTempoMedioSemana, chartTempoMedioMes, chartTempoMedioUnidade, chartTempoMedioUnidadeMes)
- **Cards**: 11
- **Filtros**: 1 (selectMesTempoMedio)
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **vencimento**

- **KPIs**: 4 (kpiTotalVencimento, kpiVencidos, kpiVencendo3, kpiVencendo7)
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 3 (filtroLabelVencimento, selectFiltroVencimento, selectSecretariaVencimento)
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 1

### **notificacoes**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 8
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **tema**

- **KPIs**: 4 (kpiTotalTema, kpiTemasUnicos, kpiTemaMaisComum, kpiMediaTema)
- **Gráficos**: 3 (chartTema, chartStatusTema, chartTemaMes)
- **Cards**: 8
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **assunto**

- **KPIs**: 4 (kpiTotalAssunto, kpiAssuntosUnicos, kpiAssuntoMaisComum, kpiMediaAssunto)
- **Gráficos**: 3 (chartAssunto, chartStatusAssunto, chartAssuntoMes)
- **Cards**: 8
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **tipo**

- **KPIs**: 4 (kpiTotalTipo, kpiTiposUnicos, kpiTipoMaisComum, kpiMediaTipo)
- **Gráficos**: 1 (chartTipo)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **setor**

- **KPIs**: 4 (kpiTotalSetor, kpiSetoresUnicos, kpiSetorMaisAtivo, kpiMediaSetor)
- **Gráficos**: 1 (chartSetor)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **uac**

- **KPIs**: 4 (kpiTotalUAC, kpiUACsUnicas, kpiUACMaisAtiva, kpiMediaUAC)
- **Gráficos**: 1 (chartUAC)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **responsavel**

- **KPIs**: 4 (kpiTotalResponsavel, kpiResponsaveisUnicos, kpiResponsavelMaisAtivo, kpiMediaResponsavel)
- **Gráficos**: 1 (chartResponsavel)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **canal**

- **KPIs**: 4 (kpiTotalCanal, kpiCanaisUnicos, kpiCanalMaisUsado, kpiMediaCanal)
- **Gráficos**: 1 (chartCanal)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **prioridade**

- **KPIs**: 4 (kpiTotalPrioridade, kpiPrioridadesUnicas, kpiPrioridadeMaisComum, kpiMediaPrioridade)
- **Gráficos**: 1 (chartPrioridade)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **categoria**

- **KPIs**: 4 (kpiTotalCategoria, kpiCategoriasUnicas, kpiCategoriaMaisComum, kpiMediaCategoria)
- **Gráficos**: 2 (chartCategoria, chartCategoriaMes)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **status**

- **KPIs**: 4 (kpiTotalStatus, kpiStatusUnicos, kpiStatusMaisComum, kpiTaxaConclusao)
- **Gráficos**: 2 (chartStatusPage, chartStatusMes)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **bairro**

- **KPIs**: 4 (kpiTotalBairro, kpiBairrosUnicos, kpiBairroMaisAtivo, kpiMediaBairro)
- **Gráficos**: 2 (chartBairro, chartBairroMes)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **cadastrante**

- **KPIs**: 4 (kpiTotalCadastrante, kpiServidoresUnicos, kpiUnidadesUnicas, kpiServidorMaisAtivo)
- **Gráficos**: 1 (chartCadastranteMes)
- **Cards**: 8
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **reclamacoes**

- **KPIs**: 4 (kpiTotalReclamacoes, kpiTotalDenuncias, kpiAssuntosUnicos, kpiAssuntoMaisComum)
- **Gráficos**: 2 (chartReclamacoesTipo, chartReclamacoesMes)
- **Cards**: 7
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **secretaria**

- **KPIs**: 4 (kpiTotalSecretaria, kpiSecretariasUnicas, kpiSecretariaMaisAtiva, kpiMediaSecretaria)
- **Gráficos**: 2 (chartSecretaria, chartSecretariaMes)
- **Cards**: 7
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **secretarias-distritos**

- **KPIs**: 4 (kpiTotalSecretariasDistritos, kpiTotalDistritos, kpiTotalBairros, kpiMediaSecretariasDistrito)
- **Gráficos**: 1 (chartSecretariasDistritos)
- **Cards**: 6
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **projecao-2026**

- **KPIs**: 1 (kpisProjecao)
- **Gráficos**: 6 (chartProjecaoMensal, chartCrescimentoPercentual, chartSazonalidade, chartComparacaoAnual, chartProjecaoTema, chartProjecaoTipo)
- **Cards**: 14
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **filtros-avancados**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 7
- **Filtros**: 14 (filtroProtocolo, filtroStatusDemanda, filtroUnidadeCadastro, filtroCanal, filtroServidor, filtroTipoManifestacao, filtroTema, filtroPrioridade, filtroUnidadeSaude, filtroDataCriacaoInicial...)
- **Botões**: 2
- **Inputs**: 0
- **Tabelas**: 0

### **cora-chat**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 1
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unidades-saude**

- **KPIs**: 4 (kpiTotalUnidadeSaude, kpiAssuntosUnicosUnidade, kpiAssuntoMaisComumUnidade, kpiTiposUnicosUnidade)
- **Gráficos**: 0 ()
- **Cards**: 4
- **Filtros**: 1 (selectUnidade)
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-adao**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-cer-iv**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-hospital-olho**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-hospital-duque**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-hospital-infantil**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-hospital-moacyr**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-maternidade-santa-cruz**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-upa-beira-mar**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-uph-pilar**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-uph-saracuruna**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-uph-xerem**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-hospital-veterinario**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-upa-walter-garcia**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-uph-campos-eliseos**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-uph-parque-equitativa**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-ubs-antonio-granja**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-upa-sarapui**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **unit-uph-imbarie**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-home**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 0
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-overview**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 8
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-status**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-categoria**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-departamento**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-bairro**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-responsavel**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-canal**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-tempo**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-mensal**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

### **zeladoria-geografica**

- **KPIs**: 0 ()
- **Gráficos**: 0 ()
- **Cards**: 5
- **Filtros**: 0 ()
- **Botões**: 0
- **Inputs**: 0
- **Tabelas**: 0

---

## 📊 RESUMO E ESTATÍSTICAS COMPLETAS

### Banco de Dados:
- **Models**: 7
- **Campos Totais**: 152
- **Índices Totais**: 53

### Cache:
- **Sistemas de Cache**: 5
- **Estratégias**: Híbrido (MongoDB + Memória + localStorage)

### Utilitários:
- **Total**: 14

### Pipelines:
- **Total**: 7

### Páginas:
- **Total Analisadas**: 37
- **Total de APIs**: 82
- **Total de Gráficos**: 74
- **Total de KPIs/Cards**: 152
- **Total de Filtros**: 21

### HTML:
- **Páginas Mapeadas**: 54

---

## 📝 NOTAS IMPORTANTES

1. **Este mapeamento foi gerado automaticamente** pelo script `map-ultra-detailed.js`
2. **Para atualizar**: Execute `node maps/map-ultra-detailed.js`
3. **Banco de Dados**: MongoDB com Prisma ORM
4. **Cache**: Sistema híbrido (banco + memória + localStorage)
5. **Pipelines**: Agregações MongoDB otimizadas
6. **Sistemas Globais**: 8 sistemas principais integrados

---

**Fim do Mapeamento Ultra Detalhado**
