# 📊 ANÁLISE COMPLETA DO SISTEMA - REFATORAÇÃO PRISMA → MONGOOSE

**Data**: 03/12/2025  
**Analista**: CÉREBRO X-3  
**Objetivo**: Documentar estado completo antes da refatoração total

---

## 🎯 VISÃO GERAL

Este documento consolida **TODA** a análise do sistema atual para servir de base para a refatoração total de Prisma para Mongoose + MongoDB Native.

---

## 📊 ESTATÍSTICAS GERAIS

### Código
- **Controllers**: 24 arquivos
- **Páginas**: 37 arquivos (24 Ouvidoria + 12 Zeladoria + 1 outras)
- **Gráficos**: 72 gráficos únicos
- **Utilitários**: 23 arquivos
- **Pipelines**: 7 pipelines MongoDB
- **Models Prisma**: 7 models
- **Collections MongoDB**: 7 collections

### Banco de Dados
- **Campos Totais**: 152 campos normalizados
- **Índices**: 53 índices (simples + compostos)
- **Registros**: Potencialmente milhões
- **Provider**: MongoDB Atlas
- **ORM Atual**: Prisma

### Frontend
- **Sistemas Globais**: 6 sistemas principais
- **APIs consumidas**: 100+ endpoints
- **KPIs**: 200+ elementos
- **Cards**: 300+ elementos

---

## 📋 MAPEAMENTO DETALHADO

### 🗄️ Models Prisma (7)

#### 1. Record (Ouvidoria - Principal)
**Collection**: `records`
**Campos**: 35 campos + `data` JSON
**Principais**:
- `protocolo` (String?) - Protocolo único
- `dataCriacaoIso` (String?) - Data criação ISO (indexed)
- `dataConclusaoIso` (String?) - Data conclusão ISO (indexed)
- `statusDemanda` (String?) - Status da demanda (indexed)
- `tipoDeManifestacao` (String?) - Tipo (indexed)
- `tema` (String?) - Tema (indexed)
- `assunto` (String?) - Assunto (indexed)
- `canal` (String?) - Canal de entrada (indexed)
- `orgaos` (String?) - Órgãos responsáveis (indexed)
- `servidor` (String?) - Servidor cadastrante (indexed)
- `responsavel` (String?) - Responsável (indexed)
- `unidadeCadastro` (String?) - Unidade cadastro (indexed)
- `unidadeSaude` (String?) - Unidade saúde (indexed)
- `status` (String?) - Status atual (indexed)
- `prioridade` (String?) - Prioridade (indexed)
- `data` (Json) - JSON completo da planilha

**Índices Compostos** (12):
- `[dataCriacaoIso, status]`
- `[dataCriacaoIso, tema]`
- `[dataCriacaoIso, orgaos]`
- `[tema, orgaos]`
- `[status, tema]`
- `[unidadeCadastro, dataCriacaoIso]`
- `[servidor, dataCriacaoIso]`
- `[servidor, dataCriacaoIso, status]`
- `[orgaos, status, dataCriacaoIso]`
- `[tema, dataCriacaoIso, status]`
- `[unidadeCadastro, status, dataCriacaoIso]`
- `[bairro, categoria]`

#### 2. Zeladoria
**Collection**: `zeladoria`
**Campos**: 20 campos + `data` JSON
**Principais**:
- `origem` (String?)
- `status` (String?)
- `protocoloEmpresa` (String?)
- `categoria` (String?)
- `responsavel` (String?)
- `bairro` (String?)
- `departamento` (String?)
- `canal` (String?)
- `dataCriacaoIso` (String?)
- `dataConclusaoIso` (String?)
- `data` (Json)

**Índices Compostos** (5):
- `[status, categoria]`
- `[dataCriacaoIso, status]`
- `[dataCriacaoIso, categoria]`
- `[departamento, status]`
- `[bairro, categoria]`

#### 3. ChatMessage
**Collection**: `chat_messages`
**Campos**: 4 campos
- `id` (String)
- `text` (String)
- `sender` (String) - 'user' ou 'cora'
- `createdAt` (DateTime)

**Índices**: 1 (`createdAt`)

#### 4. AggregationCache
**Collection**: `aggregation_cache`
**Campos**: 6 campos
- `id` (String)
- `key` (String) - UNIQUE
- `data` (Json) - Dados cachados
- `expiresAt` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Índices**: 1 (`expiresAt`)

#### 5. NotificacaoEmail
**Collection**: `notificacoes_email`
**Campos**: 11 campos
- `id` (String)
- `protocolo` (String)
- `secretaria` (String)
- `emailSecretaria` (String)
- `tipoNotificacao` (String) - '15_dias', 'vencimento', '60_dias_vencido'
- `dataVencimento` (String) - YYYY-MM-DD
- `diasRestantes` (Int)
- `enviadoEm` (DateTime)
- `status` (String) - 'enviado', 'erro', 'pendente'
- `mensagemErro` (String?)
- `messageId` (String?) - ID Gmail

**Índices Compostos** (1):
- `[protocolo, tipoNotificacao]` - Evitar duplicatas

#### 6. SecretariaInfo
**Collection**: `secretarias_info`
**Campos**: 13 campos
- `id` (String)
- `name` (String?)
- `acronym` (String?)
- `email` (String?)
- `alternateEmail` (String?)
- `phone` (String?)
- `phoneAlt` (String?)
- `address` (String?)
- `bairro` (String?)
- `district` (String?)
- `notes` (String?)
- `rawData` (Json)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Índices**: 3 (`name`, `district`, `email`)

#### 7. User
**Collection**: `users`
**Campos**: 5 campos
- `id` (String)
- `username` (String) - UNIQUE
- `password` (String) - Hash bcrypt
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Índices**: 1 (automático em `username` - unique)

---

### 🌐 Controllers (24)

#### Prioridade CRÍTICA (4):
1. **recordsController.js**
   - Listagem paginada de registros
   - Endpoint: `GET /api/records`
   - Queries: `findMany`, `count`

2. **dashboardController.js**
   - Dashboard principal com agregações
   - Endpoint: `GET /api/dashboard-data`
   - Usa pipelines MongoDB Native

3. **aggregateController.js**
   - Todas as agregações principais
   - Endpoints múltiplos (`/api/aggregate/*`)
   - Heavy use de `findMany` com take: 20000
   - **CRÍTICO**: Precisa migrar para agregações nativas

4. **filterController.js**
   - Sistema de filtros dinâmicos
   - Endpoint: `POST /api/filter`
   - Já usa MongoDB Native parcialmente

#### Prioridade ALTA (4):
5. **statsController.js** - Estatísticas de tempo médio
6. **summaryController.js** - Resumo geral
7. **vencimentoController.js** - Vencimentos (critical path)
8. **zeladoriaController.js** - Zeladoria principal

#### Prioridade MÉDIA (6):
9. **geographicController.js** - Dados geográficos
10. **notificacoesController.js** - Sistema de notificações
11. **notificationController.js** - Envio de emails
12. **secretariaInfoController.js** - Informações secretarias
13. **slaController.js** - SLA
14. **distinctController.js** - Valores distintos

#### Prioridade BAIXA (10):
15-24. Demais controllers (aiController, chatController, etc.)

---

### 📄 Páginas (37)

#### Ouvidoria (24):
1. **overview.js** - Dashboard principal
2. **orgao-mes.js** - Por órgão e mês
3. **tempo-medio.js** - Tempo médio de resolução
4. **vencimento.js** - Controle de vencimentos
5. **tema.js** - Análise por tema
6. **assunto.js** - Análise por assunto
7. **tipo.js** - Tipos de manifestação
8. **setor.js** - Por setor
9. **categoria.js** - Por categoria
10. **status.js** - Por status
11. **bairro.js** - Por bairro
12. **uac.js** - UACs
13. **responsavel.js** - Responsáveis
14. **canal.js** - Canais
15. **prioridade.js** - Prioridades
16. **cadastrante.js** - Cadastrantes
17. **reclamacoes.js** - Reclamações
18. **secretaria.js** - Secretarias
19. **secretarias-distritos.js** - Secretarias e Distritos
20. **projecao-2026.js** - Projeção 2026
21. **notificacoes.js** - Notificações
22. **unidades-saude.js** - Unidades de Saúde
23. **unit.js** - Unidade específica
24. **cora-chat.js** - Chat IA
25. **filtros-avancados.js** - Filtros avançados

#### Zeladoria (12):
1. **zeladoria-overview.js** - Visão geral
2. **zeladoria-status.js** - Por status
3. **zeladoria-categoria.js** - Por categoria
4. **zeladoria-departamento.js** - Por departamento
5. **zeladoria-bairro.js** - Por bairro
6. **zeladoria-responsavel.js** - Por responsável
7. **zeladoria-canal.js** - Por canal
8. **zeladoria-tempo.js** - Análise de tempo
9. **zeladoria-mensal.js** - Análise mensal
10. **zeladoria-geografica.js** - Análise geográfica
11. **zeladoria-colab.js** - Colaboração
12. **zeladoria-main.js** - Router principal

---

### 📊 Gráficos (72 únicos)

**Tipos**:
- **Bar Charts**: ~30 gráficos
- **Line Charts**: ~20 gráficos
- **Doughnut/Pie**: ~15 gráficos
- **Avançados** (Sankey, TreeMap, Mapas): ~7 gráficos

**Principais IDs**:
- `chartOverview`, `chartTrend`, `chartTopOrgaos`, `chartTopTemas`
- `chartStatus`, `chartTema`, `chartAssunto`, `chartBairro`
- `chartCategoria`, `chartTempo`, `chartSLA`, `chartFunnelStatus`
- Ver `NOVO/maps/SISTEMA_COMPLETO_MAPEADO.md` para lista completa

---

### 🔧 Utilitários (23)

#### Cache (5):
- `dbCache.js` - Cache no MongoDB (usa AggregationCache model)
- `smartCache.js` - Cache inteligente com TTL adaptativo
- `cacheBuilder.js` - Builder de cache
- `cacheManager.js` - Gerenciador de cache em arquivo
- `responseHelper.js` - withCache() wrapper

#### Query/DB (6):
- `dbAggregations.js` - Agregações MongoDB
- `queryOptimizer.js` - Otimizador de queries
- `cursorPagination.js` - Paginação cursor-based
- `fieldMapper.js` - Mapeamento de campos
- `districtMapper.js` - Mapeamento de distritos
- `validateFilters.js` - Validação de filtros

#### Data (3):
- `dataFormatter.js` - Formatação de dados
- `dateUtils.js` - Utilitários de data
- `geminiHelper.js` - Helper IA Gemini

#### Outros (2):
- `logger.js` - Sistema de logging Winston
- **(Pipelines separados abaixo)**

#### Pipelines MongoDB (7):
1. `pipelines/overview.js` - Pipeline dashboard overview
2. `pipelines/tema.js` - Pipeline por tema
3. `pipelines/assunto.js` - Pipeline por assunto
4. `pipelines/status.js` - Pipeline por status
5. `pipelines/bairro.js` - Pipeline por bairro
6. `pipelines/categoria.js` - Pipeline por categoria
7. `pipelines/orgaoMes.js` - Pipeline órgão/mês

---

### 🌟 Sistemas Globais Frontend (6)

1. **window.dataLoader**
   - Carregamento unificado de dados
   - Cache integrado
   - Deduplicação de requisições
   - Timeouts adaptativos

2. **window.dataStore**
   - Cache no cliente (localStorage + memória)
   - Reatividade com listeners
   - TTL configurável
   - Persistência entre sessões

3. **window.chartFactory**
   - Fábrica de gráficos padronizados
   - Chart.js wrapper
   - Lazy loading
   - Gestão de instâncias

4. **window.chartCommunication**
   - Comunicação entre gráficos
   - Cross-filtering
   - Eventos globais
   - Sincronização de filtros

5. **window.advancedCharts**
   - Gráficos avançados (Plotly.js)
   - Sankey, TreeMap, Mapas
   - Lazy loading de bibliotecas

6. **window.config**
   - Configurações globais
   - Mapeamentos
   - Constantes

---

## 🔍 ANÁLISE DE PROBLEMAS ATUAIS

### 🔴 Problemas Críticos

1. **Queries com take: 20000**
   - Localizações: aggregateController, statsController, slaController
   - Impacto: Alto consumo de memória, queries lentas
   - Solução: Substituir por agregações nativas

2. **Processamento em memória**
   - Buscar todos registros e processar em JS
   - Impacto: CPU, memória, timeouts
   - Solução: Mover lógica para MongoDB

3. **Uso do Prisma**
   - Overhead do ORM
   - Limitações em agregações complexas
   - Solução: Mongoose + MongoDB Native

### ⚠️ Problemas de Performance

1. **Cache subutilizado** em alguns endpoints
2. **Múltiplas requisições paralelas** sem controle
3. **Deep copy** em dataStore
4. **Campos `data` JSON** completos sendo buscados

### 💡 Oportunidades de Otimização

1. **Lazy loading de gráficos** (IntersectionObserver)
2. **Virtual scrolling** em tabelas
3. **Connection pooling otimizado**
4. **Índices compostos adicionais**
5. **Query explain** para validar índices

---

## 📊 IMPACTO DA MIGRAÇÃO

### Benefícios Esperados:

#### Performance:
- ✅ **20-50% mais rápido** (agregações nativas)
- ✅ **30-40% menos memória** (sem overhead Prisma)
- ✅ **Queries otimizadas** (controle total)

#### Arquitetura:
- ✅ **Conformidade 100%** com Regra Suprema
- ✅ **Código mais limpo** e direto
- ✅ **Maior controle** sobre queries
- ✅ **Pipelines nativos** otimizados

#### Manutenibilidade:
- ✅ **Código mais próximo** do MongoDB
- ✅ **Debug mais fácil** (queries nativas)
- ✅ **Menos dependências** (sem Prisma)
- ✅ **Maior flexibilidade**

### Riscos:

1. **Tempo de desenvolvimento**: 9 semanas (mitigado com priorização)
2. **Breaking changes**: Mitigado com testes completos
3. **Performance**: Mitigado com benchmarks
4. **Bugs**: Mitigado com deploy gradual

---

## 🎯 ESTRATÉGIA DE MIGRAÇÃO

### Abordagem: **Incremental e Testada**

1. ✅ **Criar schemas Mongoose** (Fase 1)
2. ✅ **Migrar utilitários** (Fase 2)
3. ✅ **Migrar controllers** por prioridade (Fase 3)
4. ✅ **Otimizar e testar** (Fases 4-5)
5. ✅ **Deploy gradual** (Fase 6)

### Priorização:

**Semana 1**: Fundação (schemas, config)
**Semanas 2-6**: Controllers (críticos → baixa prioridade)
**Semana 7**: Otimizações
**Semana 8**: Testes completos
**Semana 9**: Deploy e validação

---

## 📚 DOCUMENTOS DE REFERÊNCIA

### Mapeamento:
- `NOVO/maps/SISTEMA_ULTRA_DETALHADO.md` ⭐⭐⭐
- `NOVO/maps/SISTEMA_COMPLETO_MAPEADO.md`
- `NOVO/maps/INDICE_EXECUTIVO.md`

### Análise:
- `NOVO/maps/ANALISE_PROBLEMAS_OTIMIZACOES.md`
- `NOVO/maps/RESUMO_EXECUTIVO_GERAL.md`
- `NOVO/maps/CONCLUSAO_FINAL.md`

### Planejamento:
- `NOVO/docs/system/PLANO_REFATORACAO_MONGOOSE.md` ⭐

### Técnico:
- `NOVO/docs/system/SISTEMAS_CACHE.md`
- `NOVO/docs/system/GUIA_LOGGING.md`
- `NOVO/prisma/schema.prisma` (referência Prisma)

---

## ✅ CONCLUSÃO

O sistema está **completamente mapeado e analisado**. Todos os 37 páginas, 72 gráficos, 24 controllers e 7 models estão documentados.

A refatoração de Prisma para Mongoose + MongoDB Native é:
- ✅ **Necessária** (Regra Suprema)
- ✅ **Viável** (planejamento completo)
- ✅ **Benéfica** (performance e arquitetura)
- ✅ **Controlada** (mitigação de riscos)

**Status**: 🚀 PRONTO PARA INICIAR FASE 1

---

**CÉREBRO X-3**  
**Data**: 03/12/2025  
**Análise Completa**: ✅  
**Planejamento**: ✅  
**Próximo**: **INICIAR REFATORAÇÃO**

