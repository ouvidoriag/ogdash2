# 🔥 PLANO DE REFATORAÇÃO TOTAL: PRISMA → MONGOOSE + MONGODB NATIVE

**Data de Criação**: 03/12/2025  
**Executado por**: CÉREBRO X-3  
**Status**: 🚧 EM PLANEJAMENTO  
**Complexidade**: 🔴 **CRÍTICA** - Refatoração Total do Backend

---

## 🎯 OBJETIVO

Refatorar **completamente** o sistema de banco de dados de **Prisma** para **Mongoose + MongoDB Native Driver**, conforme a **REGRA SUPREMA** do CÉREBRO X-3.

---

## 📊 ANÁLISE COMPLETA DO SISTEMA

### Sistema Atual (Mapeado)

#### 📁 **Banco de Dados (Prisma)**
- **Models**: 7 (Record, Zeladoria, ChatMessage, AggregationCache, NotificacaoEmail, SecretariaInfo, User)
- **Campos Totais**: 152 campos normalizados
- **Índices**: 53 índices (simples + compostos)
- **Collections MongoDB**:
  - `records` (principal - Ouvidoria)
  - `zeladoria` (Zeladoria)
  - `chat_messages` (Chat IA)
  - `aggregation_cache` (Cache)
  - `notificacoes_email` (Notificações)
  - `secretarias_info` (Secretarias)
  - `users` (Autenticação)

#### 🌐 **Controllers (24 arquivos)**
1. aggregateController.js
2. aiController.js
3. authController.js
4. batchController.js
5. cacheController.js
6. chatController.js
7. colabController.js
8. complaintsController.js
9. dashboardController.js
10. distinctController.js
11. filterController.js
12. geographicController.js
13. metricsController.js
14. notificacoesController.js
15. notificationController.js
16. recordsController.js
17. secretariaInfoController.js
18. slaController.js
19. statsController.js
20. summaryController.js
21. unitController.js
22. utilsController.js
23. vencimentoController.js
24. zeladoriaController.js

#### 📄 **Páginas (37 arquivos)**

**Ouvidoria (24 páginas)**:
- assunto.js
- bairro.js
- cadastrante.js
- canal.js
- categoria.js
- cora-chat.js
- filtros-avancados.js
- notificacoes.js
- orgao-mes.js
- overview.js
- prioridade.js
- projecao-2026.js
- reclamacoes.js
- responsavel.js
- secretaria.js
- secretarias-distritos.js
- setor.js
- status.js
- tema.js
- tempo-medio.js
- tipo.js
- uac.js
- unidades-saude.js
- unit.js
- vencimento.js

**Zeladoria (12 páginas)**:
- zeladoria-bairro.js
- zeladoria-canal.js
- zeladoria-categoria.js
- zeladoria-colab.js
- zeladoria-departamento.js
- zeladoria-geografica.js
- zeladoria-main.js
- zeladoria-mensal.js
- zeladoria-overview.js
- zeladoria-responsavel.js
- zeladoria-status.js
- zeladoria-tempo.js

#### 📊 **Gráficos (72 gráficos únicos)**
- Ver `NOVO/maps/SISTEMA_COMPLETO_MAPEADO.md` para lista completa

#### 🔧 **Utilitários (23 arquivos)**
- cacheBuilder.js
- cacheManager.js
- cursorPagination.js
- dataFormatter.js
- dateUtils.js
- dbAggregations.js
- dbCache.js
- districtMapper.js
- fieldMapper.js
- geminiHelper.js
- logger.js
- queryOptimizer.js
- responseHelper.js
- smartCache.js
- validateFilters.js
- **+ 7 pipelines** (overview, tema, assunto, status, bairro, categoria, orgaoMes)

---

## 🚀 ESTRATÉGIA DE MIGRAÇÃO

### Fase 1: Preparação e Fundação (Semana 1)

#### 1.1 Criar Schemas Mongoose
- ✅ Criar `NOVO/src/models/` (nova pasta)
- ✅ Implementar schemas completos:
  - `Record.model.js` (principal)
  - `Zeladoria.model.js`
  - `ChatMessage.model.js`
  - `AggregationCache.model.js`
  - `NotificacaoEmail.model.js`
  - `SecretariaInfo.model.js`
  - `User.model.js`
- ✅ Manter **TODOS os índices** existentes
- ✅ Adicionar validações Mongoose
- ✅ Adicionar métodos e virtuals úteis

#### 1.2 Configurar Mongoose
- ✅ Refatorar `NOVO/src/config/database.js`
- ✅ Configurar connection pooling otimizado
- ✅ Configurar opções de performance
- ✅ Manter MongoDB Native Client para agregações pesadas

#### 1.3 Atualizar Server.js
- ✅ Substituir `PrismaClient` por `mongoose.connect()`
- ✅ Manter MongoDB Native para pipelines avançados
- ✅ Configurar listeners de conexão
- ✅ Implementar graceful shutdown

---

### Fase 2: Refatoração de Utilitários (Semana 2)

#### 2.1 Atualizar Helpers de Cache
- ✅ `dbCache.js` - Adaptar para Mongoose (model AggregationCache)
- ✅ `smartCache.js` - Compatibilizar com Mongoose
- ✅ `responseHelper.js` (withCache) - Adaptar

#### 2.2 Atualizar Helpers de Query
- ✅ `dbAggregations.js` - Converter para MongoDB Native + Mongoose
- ✅ `fieldMapper.js` - Manter (compatível)
- ✅ `queryOptimizer.js` - Adaptar filtros para Mongoose
- ✅ `cursorPagination.js` - Testar compatibilidade

#### 2.3 Atualizar Pipelines MongoDB
- ✅ Converter 7 pipelines para MongoDB Native:
  - `overview.js`
  - `tema.js`
  - `assunto.js`
  - `status.js`
  - `bairro.js`
  - `categoria.js`
  - `orgaoMes.js`

---

### Fase 3: Refatoração de Controllers (Semanas 3-6)

#### Prioridade CRÍTICA (Semana 3):
1. **recordsController.js** - Listagem principal
2. **dashboardController.js** - Dashboard overview
3. **aggregateController.js** - Agregações principais
4. **filterController.js** - Sistema de filtros

#### Prioridade ALTA (Semana 4):
5. **statsController.js** - Estatísticas
6. **summaryController.js** - Resumos
7. **vencimentoController.js** - Vencimentos
8. **zeladoriaController.js** - Zeladoria principal

#### Prioridade MÉDIA (Semana 5):
9. **geographicController.js** - Geográfico
10. **notificacoesController.js** - Notificações
11. **notificationController.js** - Sistema de emails
12. **secretariaInfoController.js** - Secretarias
13. **slaController.js** - SLA
14. **distinctController.js** - Valores únicos

#### Prioridade BAIXA (Semana 6):
15. **aiController.js** - IA/Chat
16. **chatController.js** - Chat
17. **colabController.js** - Colaboração
18. **complaintsController.js** - Reclamações
19. **unitController.js** - Unidades
20. **utilsController.js** - Utilitários
21. **batchController.js** - Batch
22. **metricsController.js** - Métricas
23. **cacheController.js** - Cache (admin)
24. **authController.js** - Autenticação

---

### Fase 4: Otimizações e Pipelines Avançados (Semana 7)

#### 4.1 Substituir Queries Pesadas
- ✅ Substituir todos `prisma.record.findMany({ take: 20000 })` por agregações
- ✅ Implementar pipelines nativos para:
  - Contagens (`$group`)
  - Agregações temporais (`$bucket`, `$facet`)
  - Rankings (`$sort + $limit`)

#### 4.2 Implementar Paginação Avançada
- ✅ Usar cursor-based pagination em todos endpoints de listagem
- ✅ Implementar scroll infinito onde apropriado

#### 4.3 Otimizar Performance
- ✅ Connection pooling otimizado
- ✅ Índices compostos estratégicos
- ✅ Query explain para validar índices
- ✅ Monitoramento de queries lentas

---

### Fase 5: Testes e Validação (Semana 8)

#### 5.1 Testes Unitários
- ✅ Testar cada model Mongoose
- ✅ Testar cada controller refatorado
- ✅ Validar payloads de resposta

#### 5.2 Testes de Integração
- ✅ Testar fluxo completo: frontend → backend → MongoDB
- ✅ Validar todos os 37 páginas
- ✅ Validar todos os 72 gráficos
- ✅ Testar cross-filtering

#### 5.3 Testes de Performance
- ✅ Benchmarks: Prisma vs Mongoose
- ✅ Testes de carga
- ✅ Análise de memória
- ✅ Profiling de queries

---

### Fase 6: Migração e Deploy (Semana 9)

#### 6.1 Preparação
- ✅ Backup completo do banco de dados
- ✅ Documentação de rollback
- ✅ Checklist de validação

#### 6.2 Deploy Gradual
- ✅ Deploy em ambiente de staging
- ✅ Validação completa
- ✅ Deploy em produção (gradual)
- ✅ Monitoramento 24/7

#### 6.3 Pós-Deploy
- ✅ Remover código Prisma antigo
- ✅ Remover `prisma/schema.prisma`
- ✅ Atualizar documentação
- ✅ Celebrar! 🎉

---

## 📋 CHECKLIST DE REFATORAÇÃO POR CONTROLLER

### Padrão de Refatoração:

Para cada controller, seguir:

```javascript
// ❌ ANTES (Prisma)
const records = await prisma.record.findMany({
  where: { status: 'aberto' },
  select: { id: true, protocolo: true },
  take: 100
});

// ✅ DEPOIS (Mongoose)
const records = await Record.find({ status: 'aberto' })
  .select('id protocolo')
  .limit(100)
  .lean(); // Para performance

// ✅ MELHOR (MongoDB Native para agregações)
const records = await Record.collection.aggregate([
  { $match: { status: 'aberto' } },
  { $project: { id: 1, protocolo: 1 } },
  { $limit: 100 }
]).toArray();
```

### Substituições Comuns:

| Prisma | Mongoose | MongoDB Native |
|--------|----------|----------------|
| `findMany()` | `find()` | `collection.find()` |
| `findUnique()` | `findById()` ou `findOne()` | `collection.findOne()` |
| `count()` | `countDocuments()` | `collection.countDocuments()` |
| `create()` | `create()` | `collection.insertOne()` |
| `update()` | `updateOne()` | `collection.updateOne()` |
| `delete()` | `deleteOne()` | `collection.deleteOne()` |
| `groupBy()` | **Agregação** | `collection.aggregate()` |

---

## 🛠️ FERRAMENTAS E RECURSOS

### Dependências a Instalar:
```bash
npm install mongoose
# Prisma pode ser mantido inicialmente para migração gradual
# Remover depois: npm uninstall @prisma/client prisma
```

### Scripts Úteis:
```bash
# Testar conexão Mongoose
node scripts/test-mongoose-connection.js

# Migrar um controller
node scripts/migrate-controller.js <controller-name>

# Validar schemas
node scripts/validate-mongoose-schemas.js

# Benchmark Prisma vs Mongoose
node scripts/benchmark-db.js
```

---

## 📊 MÉTRICAS DE SUCESSO

### Performance:
- ✅ Queries 20-50% mais rápidas (agregações nativas)
- ✅ Uso de memória reduzido em 30-40%
- ✅ Redução de overhead do Prisma

### Arquitetura:
- ✅ 100% compatível com Regra Suprema
- ✅ Código mais limpo e direto
- ✅ Maior controle sobre queries
- ✅ Pipelines MongoDB nativos

### Qualidade:
- ✅ Todos os testes passando
- ✅ Zero breaking changes no frontend
- ✅ Documentação completa atualizada

---

## ⚠️ RISCOS E MITIGAÇÕES

### Riscos Identificados:

1. **Risco: Breaking changes nos endpoints**
   - **Mitigação**: Testes de integração completos
   - **Plano B**: Deploy gradual com rollback

2. **Risco: Performance degradada**
   - **Mitigação**: Benchmarks antes/depois
   - **Plano B**: Otimização de índices

3. **Risco: Incompatibilidade de dados**
   - **Mitigação**: Validação de schemas
   - **Plano B**: Scripts de correção

4. **Risco: Tempo de desenvolvimento longo**
   - **Mitigação**: Priorização por criticidade
   - **Plano B**: Migração híbrida temporária

---

## 📝 NOTAS IMPORTANTES

### Durante a Migração:
- ✅ Manter Prisma e Mongoose em paralelo temporariamente
- ✅ Migrar controller por controller
- ✅ Testar cada mudança imediatamente
- ✅ Documentar todas as decisões

### Pós-Migração:
- ✅ Remover Prisma completamente
- ✅ Atualizar toda documentação
- ✅ Treinar equipe no novo padrão
- ✅ Monitorar performance

---

## 🎯 CRONOGRAMA RESUMIDO

| Fase | Duração | Descrição |
|------|---------|-----------|
| **Fase 1** | Semana 1 | Schemas Mongoose + Config |
| **Fase 2** | Semana 2 | Utilitários + Pipelines |
| **Fase 3** | Semanas 3-6 | 24 Controllers |
| **Fase 4** | Semana 7 | Otimizações |
| **Fase 5** | Semana 8 | Testes |
| **Fase 6** | Semana 9 | Deploy |
| **TOTAL** | **9 semanas** | **Refatoração Completa** |

---

## 📚 DOCUMENTOS RELACIONADOS

- `NOVO/maps/SISTEMA_ULTRA_DETALHADO.md` - Mapeamento completo do sistema
- `NOVO/maps/ANALISE_PROBLEMAS_OTIMIZACOES.md` - Problemas atuais
- `NOVO/docs/system/SISTEMAS_CACHE.md` - Sistemas de cache
- `NOVO/prisma/schema.prisma` - Schema Prisma atual (referência)

---

## ✅ PRÓXIMOS PASSOS IMEDIATOS

1. ✅ Criar pasta `NOVO/src/models/`
2. ✅ Implementar primeiro schema: `Record.model.js`
3. ✅ Configurar Mongoose em `database.js`
4. ✅ Testar conexão básica
5. ✅ Refatorar primeiro controller de teste
6. ✅ Validar funcionamento end-to-end

---

**CÉREBRO X-3**  
**Status**: 🚧 PLANEJAMENTO COMPLETO  
**Próximo**: INICIAR FASE 1  
**Complexidade**: 🔴 CRÍTICA  
**Duração Estimada**: 9 semanas  
**Arquivos a Refatorar**: ~80+ arquivos

---

**🔥 REFATORAÇÃO TOTAL AUTORIZADA - INICIANDO FASE 1**

