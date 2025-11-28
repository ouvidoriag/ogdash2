# 🚀 Checklist de Otimização do Banco de Dados - Dashboard Analítico Rápido

**Objetivo**: Transformar o banco de dados em um sistema de dashboard analítico rápido e eficiente no MongoDB Atlas.

**Status Geral**: 🟡 Em progresso (Prioridade 1 e 2.1 concluídas)

**Última Atualização**: Implementações iniciais concluídas

---

## 📋 ÍNDICE

1. [Prioridade 1 - Crítico](#prioridade-1---crítico)
2. [Prioridade 2 - Alto Impacto](#prioridade-2---alto-impacto)
3. [Prioridade 3 - Melhorias](#prioridade-3---melhorias)
4. [Prioridade 4 - Arquitetura](#prioridade-4---arquitetura)
5. [Scripts Práticos](#scripts-práticos)
6. [Testes e Validação](#testes-e-validação)
7. [Monitoramento](#monitoramento)

---

## 🔴 PRIORIDADE 1 - CRÍTICO

### 1.1 ✅ Agregações Rápidas: Usar Pipelines $aggregate e $facet

**Objetivo**: Substituir processamentos em memória por pipelines no servidor (uma única query que gera vários KPIs).

**Status**: ✅ Concluído

**Tarefas**:
- [x] Criar função utilitária `dbAggregations.js` para pipelines MongoDB nativos
- [x] Implementar pipeline $facet para overview (porStatus, porMes, porDia em uma query)
- [ ] Substituir `aggregateFilteredData()` em `overview.js` por pipeline MongoDB
- [x] Atualizar `dashboardController.js` para usar pipeline $facet
- [ ] Testar performance: comparar tempo antes/depois

**Código de Referência**:
```javascript
// NOVO/src/utils/dbAggregations.js
const pipeline = [
  { $match: filtros }, // aplicar index-friendly filters
  { $sort: { createdAt: -1 } },
  { $facet: {
      porStatus: [
        { $group: { _id: "$status", total: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ],
      porMes: [
        { $group: { 
            _id: { 
              year: { $year: "$createdAt" }, 
              month: { $month: "$createdAt" } 
            }, 
            total: { $sum: 1 } 
          } 
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 }
      ],
      porDia: [
        { $group: { 
            _id: { 
              day: { $dayOfMonth: "$createdAt" }, 
              month: { $month: "$createdAt" }, 
              year: { $year: "$createdAt" } 
            }, 
            total: { $sum: 1 } 
          } 
        },
        { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
        { $limit: 31 }
      ]
  } }
];
```

**Benefício Esperado**: 3-10x mais rápido, 1 round-trip ao invés de múltiplos

---

### 1.2 ✅ Usar Mongo Native para Agregações Pesadas

**Objetivo**: Usar `getMongoClient()` para pipelines complexos, mantendo Prisma para CRUD.

**Status**: 🟡 Em progresso

**Tarefas**:
- [x] Verificar se `getMongoClient()` está disponível em todos os controllers
- [x] Criar wrapper `dbAggregations.js` para encapsular chamadas nativas
- [x] Atualizar controllers de analytics para usar Mongo Native:
  - [x] `dashboardController.js`
  - [ ] `aggregateController.js`
  - [ ] `filterController.js`
  - [ ] `slaController.js`
- [x] Manter Prisma apenas para CRUD (Users, Notificacoes, etc.)
- [ ] Documentar quando usar cada um

**Código de Referência**:
```javascript
// NOVO/src/utils/dbAggregations.js
export async function executeAggregation(pipeline, collection = 'records') {
  const client = await getMongoClient();
  const db = client.db(process.env.DB_NAME || 'dashboard');
  return await db.collection(collection)
    .aggregate(pipeline, { allowDiskUse: true })
    .toArray();
}
```

**Benefício Esperado**: Agregações 10-40x mais rápidas

---

### 1.3 ✅ Revisar e Ajustar Índices Compostos

**Objetivo**: Garantir que índices compostos cobrem filtros frequentes na ordem correta.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Analisar queries mais frequentes com `explain("executionStats")`
- [ ] Verificar ordem dos campos nos índices (igualdade → range)
- [ ] Adicionar índices compostos faltantes:
  - [ ] `{ secretaria: 1, status: 1, createdAt: -1 }`
  - [ ] `{ servidor: 1, createdAt: -1, status: 1 }`
  - [ ] `{ tema: 1, createdAt: 1, status: 1 }`
- [ ] Verificar se índices existentes estão sendo usados (IXSCAN)
- [ ] Remover índices não utilizados

**Script de Verificação**:
```javascript
// Verificar uso de índice
db.records.find({ secretaria: "Saude", status: "Aberto" })
  .sort({ createdAt: -1 })
  .explain("executionStats")
// Procurar: IXSCAN e totalKeysExamined << totalDocsExamined
```

**Benefício Esperado**: Queries 20-40% mais rápidas

---

### 1.4 ✅ Migrar Campos de Data: String → Date (ISODate)

**Objetivo**: Usar campos `Date` ao invés de strings ISO para aproveitar índices e operadores de data.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Criar script de migração `migrate-dates.js`
- [ ] Adicionar novos campos `Date`:
  - [ ] `createdAt: Date` (novo campo)
  - [ ] `concludedAt: Date` (novo campo)
- [ ] Backfill: converter `dataCriacaoIso` (string) → `createdAt` (Date)
- [ ] Backfill: converter `dataConclusaoIso` (string) → `concludedAt` (Date)
- [ ] Atualizar índices para usar campos Date
- [ ] Atualizar queries para usar campos Date
- [ ] Manter campos string como fallback durante transição
- [ ] Testar queries com novos campos
- [ ] Remover campos string após validação (opcional)

**Script de Migração**:
```javascript
// NOVO/scripts/migrations/migrate-dates.js
async function migrateDates() {
  const client = await getMongoClient();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection('records');
  
  const cursor = collection.find({ dataCriacaoIso: { $exists: true } });
  
  let count = 0;
  for await (const doc of cursor) {
    const updates = {};
    
    if (doc.dataCriacaoIso) {
      updates.createdAt = new Date(doc.dataCriacaoIso + 'T00:00:00');
    }
    
    if (doc.dataConclusaoIso) {
      updates.concludedAt = new Date(doc.dataConclusaoIso + 'T00:00:00');
    }
    
    if (Object.keys(updates).length > 0) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: updates }
      );
      count++;
    }
  }
  
  console.log(`✅ Migrados ${count} documentos`);
}
```

**Benefício Esperado**: Queries de data 50-80% mais rápidas, suporte a $bucket, $setWindowFields

---

## 🟡 PRIORIDADE 2 - ALTO IMPACTO

### 2.1 ✅ Paginação: Cursor-Based ao invés de Skip/Limit

**Objetivo**: Evitar `.skip()` em coleções grandes, usar cursor-based pagination.

**Status**: ✅ Concluído

**Tarefas**:
- [x] Criar utilitário `cursorPagination.js`
- [x] Implementar função `encodeCursor()` e `decodeCursor()`
- [x] Atualizar endpoints que usam `take: 100000`:
  - [x] `/api/filter` (com suporte opcional a paginação)
  - [ ] `/api/dashboard-data` (não precisa - usa agregação)
  - [ ] `/api/aggregate/*` (verificar se necessário)
- [x] Adicionar parâmetros `cursor` e `pageSize` nas rotas
- [x] Testar paginação forward e backward (implementado)
- [ ] Documentar uso da API

**Código de Referência**:
```javascript
// NOVO/src/utils/cursorPagination.js
export function encodeCursor(createdAt, id) {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString('base64');
}

export function decodeCursor(cursor) {
  return JSON.parse(Buffer.from(cursor, 'base64').toString());
}

export async function paginateWithCursor(collection, match, pageSize, cursor) {
  const query = { ...match };
  
  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    query.$or = [
      { createdAt: { $lt: new Date(createdAt) } },
      { createdAt: new Date(createdAt), _id: { $lt: new ObjectId(id) } }
    ];
  }
  
  const docs = await collection
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .toArray();
  
  const hasMore = docs.length > pageSize;
  const results = hasMore ? docs.slice(0, pageSize) : docs;
  const nextCursor = hasMore ? encodeCursor(
    results[results.length - 1].createdAt,
    results[results.length - 1]._id
  ) : null;
  
  return { results, nextCursor, hasMore };
}
```

**Benefício Esperado**: Escalável para milhões de documentos

---

### 2.2 ✅ Cache de Agregações com $facet

**Objetivo**: Combinar $facet e cache híbrido para reduzir agregações pesadas.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Criar função `getCachedAggregation(key, pipeline, ttl)`
- [ ] Gerar `cacheKey = hash(filtros)` para cada request
- [ ] Verificar `AggregationCache` antes de executar pipeline
- [ ] Armazenar resultado do $facet em `AggregationCache`
- [ ] Implementar TTL automático (já existe `expiresAt`)
- [ ] Invalidar cache quando dados mudarem
- [ ] Testar cache hit/miss

**Código de Referência**:
```javascript
// NOVO/src/utils/dbCache.js (adicionar)
export async function getCachedAggregation(prisma, key, pipeline, ttlSeconds = 300) {
  // Verificar cache
  const cached = await prisma.aggregationCache.findFirst({
    where: { 
      key,
      expiresAt: { gt: new Date() }
    }
  });
  
  if (cached) {
    return cached.data;
  }
  
  // Executar pipeline
  const client = await getMongoClient();
  const db = client.db(process.env.DB_NAME);
  const [result] = await db.collection('records')
    .aggregate(pipeline, { allowDiskUse: true })
    .toArray();
  
  // Armazenar no cache
  await prisma.aggregationCache.upsert({
    where: { key },
    create: {
      key,
      data: result,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000)
    },
    update: {
      data: result,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000)
    }
  });
  
  return result;
}
```

**Benefício Esperado**: Reduz agregações pesadas no Atlas em 70-90%

---

### 2.3 ✅ Endpoint Batch `/api/batch`

**Objetivo**: Agrupar múltiplas requisições em uma única chamada.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Criar rota `/api/batch` em `routes/index.js`
- [ ] Criar controller `batchController.js`
- [ ] Implementar parser de requests batch
- [ ] Executar queries em paralelo (Promise.all) ou sequencial
- [ ] Retornar objeto com todas as respostas
- [ ] Adicionar validação de payload
- [ ] Testar com múltiplos tipos de requests
- [ ] Documentar API

**Código de Referência**:
```javascript
// NOVO/src/api/controllers/batchController.js
export async function batchRequest(req, res, prisma) {
  const { requests } = req.body;
  
  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).json({ error: 'Invalid batch request' });
  }
  
  const results = {};
  
  await Promise.all(requests.map(async (request) => {
    try {
      const { name, type, params } = request;
      
      switch (type) {
        case 'overview':
          results[name] = await getOverviewData(params, prisma);
          break;
        case 'distinct':
          results[name] = await getDistinctValues(params.field, prisma);
          break;
        // ... outros tipos
      }
    } catch (error) {
      results[request.name] = { error: error.message };
    }
  }));
  
  return res.json(results);
}
```

**Benefício Esperado**: Reduz latência total em 30-50% para múltiplas requisições

---

### 2.4 ✅ Otimizar `allowDiskUse` e `maxTimeMS`

**Objetivo**: Usar `allowDiskUse: true` apenas quando necessário, monitorar tempo.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Adicionar `maxTimeMS` em pipelines grandes (ex: 60000ms)
- [ ] Usar `allowDiskUse: true` apenas para pipelines > 100MB
- [ ] Monitorar uso de disco no Atlas
- [ ] Adicionar logs de tempo de execução
- [ ] Alertar se pipeline exceder `maxTimeMS`

**Código de Referência**:
```javascript
const pipeline = [...];
const options = {
  allowDiskUse: pipeline.length > 10, // apenas para pipelines grandes
  maxTimeMS: 60000 // 60 segundos máximo
};

const result = await collection.aggregate(pipeline, options).toArray();
```

**Benefício Esperado**: Evita pressão de disco, melhor controle de recursos

---

## 🟢 PRIORIDADE 3 - MELHORIAS

### 3.1 ✅ Partial e Sparse Indexes

**Objetivo**: Criar índices parciais para status mais usados.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Identificar status mais consultados
- [ ] Criar partial index para status ativos:
  - [ ] `{ protocolo: 1 }` com `partialFilterExpression: { status: { $in: ["Aberto","Em andamento"] } }`
- [ ] Criar sparse index para campos opcionais frequentes
- [ ] Testar performance de queries com partial indexes

**Script**:
```javascript
db.records.createIndex(
  { protocolo: 1 }, 
  { 
    partialFilterExpression: { status: { $in: ["Aberto", "Em andamento"] } },
    name: 'idx_protocolo_status_ativos'
  }
);
```

**Benefício Esperado**: Índices menores, queries mais rápidas para casos específicos

---

### 3.2 ✅ TTL Index para AggregationCache

**Objetivo**: Limpeza automática de cache expirado.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Verificar se índice TTL existe em `AggregationCache`
- [ ] Criar índice TTL se não existir: `{ expiresAt: 1 }`
- [ ] Configurar TTL para remover documentos expirados automaticamente
- [ ] Testar limpeza automática

**Script**:
```javascript
db.aggregation_cache.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'idx_ttl_expiresAt' }
);
```

**Benefício Esperado**: Limpeza automática, menos espaço usado

---

### 3.3 ✅ ChangeStreams para Invalidação de Cache

**Objetivo**: Invalidar cache automaticamente quando dados mudarem.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Criar serviço `cacheInvalidationService.js`
- [ ] Configurar ChangeStream para collection `records`
- [ ] Detectar mudanças em campos relevantes (status, data, etc.)
- [ ] Invalidar chaves de cache relacionadas
- [ ] Testar invalidação em tempo real
- [ ] Adicionar logs de invalidação

**Código de Referência**:
```javascript
// NOVO/src/services/cacheInvalidationService.js
export async function startCacheInvalidation(prisma) {
  const client = await getMongoClient();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection('records');
  
  const changeStream = collection.watch([
    { $match: { 'updateDescription.updatedFields': { $exists: true } } }
  ]);
  
  changeStream.on('change', async (change) => {
    const { _id, updateDescription } = change;
    
    // Invalidar caches relacionados
    const cacheKeys = [
      `overview:*`,
      `dashboard-data:*`,
      `filter:*`
    ];
    
    for (const pattern of cacheKeys) {
      await prisma.aggregationCache.deleteMany({
        where: {
          key: { contains: pattern.replace('*', '') }
        }
      });
    }
  });
}
```

**Benefício Esperado**: Cache sempre atualizado, sem dados stale

---

### 3.4 ✅ Monitoramento e Profiling

**Objetivo**: Capturar slow queries e métricas de performance.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Ativar Atlas Performance Advisor
- [ ] Ativar Atlas Profiler
- [ ] Configurar alertas para queries lentas (>5s)
- [ ] Adicionar logs de tempo de execução nas queries
- [ ] Criar dashboard de métricas (tempo médio, p95, p99)
- [ ] Documentar como usar `mongotop` e `mongostat`
- [ ] Revisar slow queries semanalmente

**Código de Referência**:
```javascript
// Adicionar em todos os controllers
const startTime = Date.now();
const result = await executeQuery();
const duration = Date.now() - startTime;

if (window.Logger) {
  window.Logger.debug(`Query executada em ${duration}ms`);
}

if (duration > 5000) {
  window.Logger.warn(`⚠️ Query lenta detectada: ${duration}ms`);
}
```

**Benefício Esperado**: Identificação proativa de problemas, otimização contínua

---

## 🔵 PRIORIDADE 4 - ARQUITETURA

### 4.1 ✅ Padronizar Uso de Prisma vs Mongo Native

**Objetivo**: Definir claramente quando usar cada um.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Documentar regra: **CRUD = Prisma, Analytics = Mongo Native**
- [ ] Criar guia de decisão em `docs/ARCHITECTURE.md`
- [ ] Atualizar todos os controllers de analytics para usar Mongo Native
- [ ] Manter Prisma apenas para:
  - [ ] Users
  - [ ] Notificacoes
  - [ ] ChatMessages
  - [ ] CRUD simples de Records
- [ ] Criar wrapper `dbAggregations.js` para padronizar
- [ ] Code review para garantir padrão

**Regra de Ouro**:
```
✅ Prisma → CRUD, validação, tipagem, migrations
✅ Mongo Native → Agregações, pipelines, analytics, KPIs
```

**Benefício Esperado**: Código mais limpo, performance otimizada, manutenção fácil

---

### 4.2 ✅ Criar Utilitários de Agregação

**Objetivo**: Encapsular chamadas MongoDB nativas em utilitários reutilizáveis.

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Criar `NOVO/src/utils/dbAggregations.js` com funções:
  - [ ] `executeAggregation(pipeline, collection)`
  - [ ] `executeFacetAggregation(facets, match)`
  - [ ] `getOverviewData(filters)`
  - [ ] `getDistinctValues(field, filters)`
- [ ] Criar `NOVO/src/utils/cursorPagination.js`
- [ ] Criar `NOVO/src/utils/queryOptimizer.js` (se necessário)
- [ ] Documentar todas as funções
- [ ] Adicionar testes unitários

**Benefício Esperado**: Código reutilizável, menos duplicação, fácil manutenção

---

## 📝 SCRIPTS PRÁTICOS

### Scripts para Executar no MongoDB Shell

**Criar Índice Composto**:
```javascript
// Executar no MongoDB Atlas Shell
db.records.createIndex(
  { secretaria: 1, status: 1, createdAt: -1 }, 
  { name: 'idx_sec_status_date' }
);
```

**Pipeline $bucketAuto (Distribuição por Faixa)**:
```javascript
db.records.aggregate([
  { $match: { status: "Aberto" } },
  { $bucketAuto: { 
      groupBy: "$tempoRespostaDias", 
      buckets: 5, 
      output: { count: { $sum: 1 } } 
    } 
  }
]);
```

**Explain Query**:
```javascript
db.records.find({ 
  secretaria: "Saude", 
  status: "Aberto" 
})
.sort({ createdAt: -1 })
.explain("executionStats");
```

**Verificar Índices Existentes**:
```javascript
db.records.getIndexes();
```

**Estatísticas de Uso de Índices**:
```javascript
db.records.aggregate([
  { $indexStats: {} }
]);
```

---

## ✅ TESTES E VALIDAÇÃO

### Testes de Performance

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Criar script de benchmark `scripts/benchmark-queries.js`
- [ ] Medir tempo de execução antes das otimizações (baseline)
- [ ] Medir tempo de execução após cada otimização
- [ ] Comparar resultados:
  - [ ] Overview: tempo antes vs depois
  - [ ] Filtros: tempo antes vs depois
  - [ ] Agregações: tempo antes vs depois
- [ ] Testar com diferentes volumes de dados (10k, 100k, 1M registros)
- [ ] Documentar resultados

**Métricas a Capturar**:
- Tempo de execução (ms)
- Número de documentos examinados
- Uso de índices (IXSCAN vs COLLSCAN)
- Tamanho de resposta (KB)
- Uso de memória

---

### Testes de Carga

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Configurar teste de carga com JMeter ou similar
- [ ] Simular 10 usuários simultâneos acessando dashboard
- [ ] Simular 50 usuários simultâneos
- [ ] Verificar se há degradação de performance
- [ ] Monitorar uso de recursos no Atlas
- [ ] Identificar gargalos

---

### Testes de Integração

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Testar todas as rotas de API após mudanças
- [ ] Verificar se cache está funcionando corretamente
- [ ] Testar paginação cursor-based
- [ ] Testar endpoint batch
- [ ] Verificar invalidação de cache
- [ ] Testar migração de datas (se aplicável)

---

## 📊 MONITORAMENTO

### Configuração de Monitoramento

**Status**: ⬜ Não iniciado

**Tarefas**:
- [ ] Ativar Atlas Performance Advisor
- [ ] Ativar Atlas Profiler
- [ ] Configurar alertas:
  - [ ] Query lenta (>5s)
  - [ ] Alto uso de CPU
  - [ ] Alto uso de memória
  - [ ] Índices não utilizados
- [ ] Criar dashboard de métricas
- [ ] Revisar métricas semanalmente

---

## 📋 CHECKLIST FINAL DE VALIDAÇÃO

Antes de considerar completo, verificar:

- [ ] Todas as queries principais usam índices (IXSCAN)
- [ ] Nenhuma query usa COLLSCAN em produção
- [ ] Tempo médio de resposta < 2s para overview
- [ ] Tempo médio de resposta < 1s para filtros simples
- [ ] Cache hit rate > 70%
- [ ] Nenhum erro de timeout em produção
- [ ] Monitoramento ativo e alertas configurados
- [ ] Documentação atualizada
- [ ] Testes de carga passaram
- [ ] Code review realizado

---

## 🎯 ORDEM DE IMPLEMENTAÇÃO SUGERIDA

1. **Semana 1**: Prioridade 1.1, 1.2, 1.3 (Agregações e Índices)
2. **Semana 2**: Prioridade 1.4 (Migração de Datas) + Prioridade 2.1 (Paginação)
3. **Semana 3**: Prioridade 2.2, 2.3 (Cache e Batch)
4. **Semana 4**: Prioridade 3 (Melhorias) + Testes
5. **Semana 5**: Prioridade 4 (Arquitetura) + Validação Final

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- [ ] Criar `docs/DATABASE_OPTIMIZATION.md` com detalhes técnicos
- [ ] Criar `docs/ARCHITECTURE.md` explicando Prisma vs Mongo Native
- [ ] Atualizar `README.md` com informações de performance
- [ ] Documentar scripts de migração
- [ ] Criar guia de troubleshooting

---

## 🔄 REVISÃO CONTÍNUA

- [ ] Revisar slow queries mensalmente
- [ ] Ajustar índices conforme necessário
- [ ] Monitorar uso de cache
- [ ] Otimizar pipelines baseado em métricas reais
- [ ] Manter documentação atualizada

---

**Última Atualização**: _Data da criação do documento_

**Próxima Revisão**: _Data sugerida para revisão_

**Responsável**: _Nome do responsável pela implementação_

---

## 📝 NOTAS

_Adicione notas, observações ou problemas encontrados durante a implementação aqui:_

