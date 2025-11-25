# 📊 Análise Comparativa: Sistema Antigo vs Sistema Novo

## 1. Resumo Executivo

O sistema **NOVO** representa uma refatoração completa do sistema **ANTIGO**, com melhorias significativas em arquitetura, organização de código e funcionalidades. Esta análise detalha as diferenças, melhorias e o que ainda falta migrar.

---

## 2. Arquitetura Backend

### 2.1 Sistema Antigo
- **Monolítico**: Toda a lógica concentrada em `ANTIGO/src/server.js` (mais de 5000 linhas)
- **Rotas inline**: Todas as rotas definidas diretamente no `server.js`
- **Helpers misturados**: Funções de normalização de data, queries, cache tudo no mesmo arquivo
- **Dificuldade de manutenção**: Mudanças em uma rota afetavam todo o arquivo

### 2.2 Sistema Novo
- **Modular**: Rotas organizadas por domínio em `NOVO/src/api/routes/`
  - `aggregate.js` - Agregações
  - `stats.js` - Estatísticas
  - `cache.js` - Gerenciamento de cache
  - `chat.js` - Sistema de chat
  - `ai.js` - Inteligência artificial
  - `data.js` - Dados gerais
  - `geographic.js` - Dados geográficos
  - `zeladoria.js` - Dados de Zeladoria
- **Controllers separados**: Cada rota tem seu controller em `NOVO/src/api/controllers/`
- **Manutenibilidade**: Mudanças isoladas, fácil adicionar novas rotas

**✅ Vantagem**: Código mais limpo, testável e escalável

---

## 3. Modelo de Dados

### 3.1 Sistema Antigo
```prisma
model Record { ... }
model ChatMessage { ... }
model AggregationCache { ... }
```
- Apenas 3 modelos
- Focado apenas em Ouvidoria

### 3.2 Sistema Novo
```prisma
model Record { ... }
model ChatMessage { ... }
model AggregationCache { ... }
model Zeladoria { ... }  // NOVO
```
- 4 modelos (adicionado Zeladoria)
- Suporte completo para segundo dataset
- Campos normalizados e índices otimizados para Zeladoria

**✅ Vantagem**: Sistema preparado para múltiplos datasets

---

## 4. Frontend - Cache e Data Store

### 4.1 Sistema Antigo
- **Cache desabilitado**: `ANTIGO/public/scripts/cache.js` retornava sempre `null`
- **Sem persistência**: Dados recarregados a cada navegação
- **Performance ruim**: Múltiplas requisições desnecessárias

```javascript
// ANTIGO/public/scripts/cache.js
function getCache() { return null; }
function setCache(data) { return false; }
```

### 4.2 Sistema Novo
- **Global Store ativo**: `NOVO/public/scripts/core/global-store.js` funcional
- **Cache persistente**: `localStorage` com TTL configurável
- **Deduplicação**: Evita requisições duplicadas
- **Listeners**: Sistema de notificação quando dados mudam

```javascript
// NOVO/public/scripts/core/global-store.js
const dataStore = {
  dashboardData: null,
  dataCache: new Map(),
  listeners: new Map(),
  defaultTTL: 5000,
  ttlConfig: { /* TTLs por endpoint */ }
};
```

**✅ Vantagem**: Performance muito melhor, menos requisições ao servidor

---

## 5. Sistema de Filtros

### 5.1 Sistema Antigo
- **Filtros desabilitados**: `applyGlobalFilter()` retornava imediatamente
- **Sem feedback visual**: Cliques em gráficos não faziam nada
- **Estrutura mantida**: Código existia mas não funcionava

```javascript
// ANTIGO/public/scripts/filters.js
function applyGlobalFilter(field, value, chartId = null, element = null) {
  // DESABILITADO: Filtros globais removidos
  return; // Não faz nada
}
```

### 5.2 Sistema Novo
- **Filtros funcionais**: `chart-communication.js` implementa sistema completo
- **Event Bus**: Comunicação entre gráficos
- **Feedback visual**: Indicador de filtro ativo com botão para limpar
- **Persistência**: Filtros salvos no `localStorage`

```javascript
// NOVO/public/scripts/core/chart-communication.js
const globalFilters = {
  apply(field, value, chartId, options = {}) {
    // Implementação completa com toggle, clearPrevious, etc.
    eventBus.emit('filter:applied', { field, value, chartId });
  }
};
```

**✅ Vantagem**: Interatividade completa, experiência de usuário muito melhor

---

## 6. Páginas e Funcionalidades

### 6.1 Sistema Antigo
- **Páginas básicas**: Tema, Assunto, Canal, etc.
- **Módulos legados**: Dependência de `data-pages.js` para algumas páginas
- **Sem Zeladoria**: Apenas dados de Ouvidoria

### 6.2 Sistema Novo
- **Páginas expandidas**: 
  - `cora-chat.js` - Chat com IA
  - `orgao-mes.js` - Órgãos por mês
  - `secretaria.js` - Secretarias
  - `secretarias-distritos.js` - Mapeamento geográfico
  - `projecao-2026.js` - Projeções
  - `reclamacoes.js` - Reclamações
  - `tempo-medio.js` - Tempo médio de resolução
- **Zeladoria completa**: 10+ páginas dedicadas
  - `zeladoria-overview.js`
  - `zeladoria-status.js`
  - `zeladoria-categoria.js`
  - `zeladoria-departamento.js`
  - `zeladoria-bairro.js`
  - `zeladoria-geografica.js`
  - E mais...
- **Módulos modernos**: Sem dependência de código legado

**✅ Vantagem**: Cobertura funcional muito maior

---

## 7. O Que FALTA no Sistema Novo

### 7.1 Timer Manager ⚠️
**Sistema Antigo tinha:**
- Gerenciamento centralizado de `setTimeout`/`setInterval`
- Limpeza automática de timers órfãos
- Prevenção de vazamentos de memória
- Métricas de timers ativos

**Sistema Novo:**
- Usa `setTimeout` diretamente
- Sem limpeza automática
- Risco de vazamentos de memória em navegação prolongada

**Impacto**: Médio - Pode causar lentidão após uso prolongado

---

### 7.2 Sistema de Diagnóstico ⚠️
**Sistema Antigo tinha:**
- `diagnostic.js` rastreava carregamento de componentes
- Verificava presença de elementos no DOM
- Gerava relatórios automáticos
- Facilita debugging

**Sistema Novo:**
- Não possui módulo equivalente
- Debugging manual via console

**Impacto**: Baixo - Facilita desenvolvimento mas não é crítico

---

### 7.3 Lazy Loader Genérico ⚠️
**Sistema Antigo tinha:**
- `lazyLoader.js` carregava qualquer script sob demanda
- Suportava módulos personalizados
- Reduzia bundle inicial

**Sistema Novo:**
- Apenas `lazy-libraries.js` (Chart.js, Plotly)
- Não suporta carregamento genérico de módulos

**Impacto**: Baixo - Funcionalidade específica já coberta

---

### 7.4 Legacy Loader ⚠️
**Sistema Antigo tinha:**
- `legacy-loader.js` identificava páginas não migradas
- Carregava `data-pages.js` automaticamente quando necessário
- Compatibilidade com código antigo

**Sistema Novo:**
- Não possui (todas as páginas foram migradas)
- Se houver dependências externas, pode quebrar

**Impacto**: Baixo - Assumindo que tudo foi migrado

---

### 7.5 Controle de Concorrência HTTP ⚠️
**Sistema Antigo tinha:**
- `api.js` limitava requisições simultâneas (MAX_CONCURRENT_REQUESTS = 6)
- Fila de requisições para evitar sobrecarga
- Back-pressure automático

**Sistema Novo:**
- `dataLoader` apenas deduplica por endpoint
- Sem limite de concorrência
- Pode sobrecarregar servidor com muitas páginas abertas

**Impacto**: Médio - Pode causar timeouts/erros 503 em picos de uso

---

### 7.6 Scripts de Análise e Manutenção ⚠️
**Sistema Antigo tinha:**
- `analyzeDbStructure.js` - Análise de estrutura
- `checkAllDbs.js` - Verificação de bancos
- `compareExcelDb.js` - Comparação Excel vs DB
- `resetAllDbs.js` - Reset de bancos
- `checkDateColumns.js` - Verificação de colunas de data
- E mais 10+ scripts utilitários

**Sistema Novo:**
- Apenas scripts específicos de Zeladoria
- `importZeladoria.js`
- `checkZeladoria.js`
- `normalizeFields.js`
- Scripts de restart

**Impacto**: Médio - Perda de ferramentas de auditoria e manutenção

---

## 8. Problemas Identificados (Erros 503)

### 8.1 Erros Observados
```
/api/aggregate/by-theme: HTTP 503
/api/aggregate/count-by-status-mes?field=Tema: HTTP 503
```

### 8.2 Possíveis Causas
1. **Timeout de conexão MongoDB**: Queries muito lentas
2. **Sobrecarga do servidor**: Muitas requisições simultâneas (falta controle de concorrência)
3. **Cache expirado**: Banco de dados pode estar lento
4. **Índices faltando**: Queries sem otimização adequada

### 8.3 Soluções Recomendadas
1. **Implementar controle de concorrência** (item 7.5)
2. **Aumentar timeout** nas queries
3. **Verificar índices** no MongoDB
4. **Implementar retry** com backoff exponencial
5. **Cache mais agressivo** para endpoints pesados

---

## 9. Recomendações

### 9.1 Prioridade ALTA
1. ✅ **Implementar controle de concorrência HTTP** - Resolver erros 503
2. ✅ **Adicionar retry com backoff** - Melhorar resiliência
3. ✅ **Aumentar timeouts** - Evitar falhas em queries lentas

### 9.2 Prioridade MÉDIA
1. ⚠️ **Portar Timer Manager** - Prevenir vazamentos de memória
2. ⚠️ **Portar scripts de análise** - Facilitar manutenção
3. ⚠️ **Adicionar sistema de diagnóstico** - Melhorar debugging

### 9.3 Prioridade BAIXA
1. 📝 **Lazy loader genérico** - Já coberto por funcionalidades específicas
2. 📝 **Legacy loader** - Assumindo migração completa

---

## 10. Conclusão

### 10.1 Melhorias Implementadas ✅
- Arquitetura modular e escalável
- Cache funcional e persistente
- Filtros globais interativos
- Suporte completo a Zeladoria
- Código mais limpo e organizado

### 10.2 O Que Falta ⚠️
- Controle de concorrência HTTP (causa erros 503)
- Timer Manager (prevenção de vazamentos)
- Scripts de análise e manutenção
- Sistema de diagnóstico

### 10.3 Próximos Passos
1. **Imediato**: Resolver erros 503 implementando controle de concorrência
2. **Curto prazo**: Portar Timer Manager e scripts de análise
3. **Longo prazo**: Adicionar sistema de diagnóstico e métricas

---

**Data da Análise**: 2025-01-06  
**Versão Sistema Antigo**: 2.x  
**Versão Sistema Novo**: 3.0

