# 🚀 Plano de Otimização de Performance

**Data:** Janeiro 2025  
**Objetivo:** Eliminar lentidão e código obsoleto identificados na análise

---

## 🎯 Problemas Críticos Identificados

### 1. ⚠️ Código Obsoleto em `data.js` (CRÍTICO)
- **Tamanho:** ~5068 linhas
- **Funções deprecated:** 19 funções ainda exportadas
- **Impacto:** ~40% do bundle JavaScript é código não utilizado
- **Solução:** Remover funções deprecated

### 2. ⚠️ Timeout de 2 Segundos em `main.js` (CRÍTICO)
- **Localização:** `getPageLoader` função (linha ~140-190)
- **Problema:** Até 20 tentativas (2 segundos) para encontrar funções
- **Impacto:** Atraso de até 2 segundos na inicialização de páginas
- **Solução:** Garantir ordem de carregamento e remover timeout

### 3. ⚠️ Logs de Debug em Produção (MODERADO)
- **Localização:** `data.js` linhas ~2100-2215
- **Problema:** Múltiplos `console.log` e verificações condicionais
- **Impacto:** Overhead de logging e código desnecessário
- **Solução:** Remover logs de debug

### 4. ⚠️ Verificações Redundantes (MODERADO)
- **Localização:** `main.js` `getPageLoader`
- **Problema:** 3 verificações diferentes para cada função
- **Impacto:** CPU desnecessário e complexidade
- **Solução:** Simplificar para uma única verificação

### 5. ⚠️ Polling de Visibilidade (BAIXO)
- **Localização:** `data-overview.js` linha ~33
- **Problema:** `setInterval` para verificar visibilidade
- **Impacto:** Polling desnecessário
- **Solução:** Usar `IntersectionObserver` ou evento de visibilidade

---

## 📋 Plano de Ação Passo a Passo

### Fase 1: Remover Código Obsoleto (Prioridade ALTA) 🔴

#### Passo 1.1: Verificar Dependências
```bash
# Verificar se funções deprecated são usadas em algum lugar
grep -r "window.data.loadCategoria\|window.data.loadStatusPage" public/
grep -r "window.data.loadBairro\|window.data.loadUAC" public/
# ... verificar todas as 19 funções
```

#### Passo 1.2: Remover Funções Deprecated
- Remover 19 funções de `data.js`:
  1. `loadCategoria` (~linha 4282)
  2. `loadStatusPage` (~linha 4371)
  3. `loadBairro` (~linha 4449)
  4. `loadUAC` (~linha 4537)
  5. `loadResponsavel` (~linha 4580)
  6. `loadCanal` (~linha 4608)
  7. `loadPrioridade` (~linha 4675)
  8. `loadTema` (~linha 3363)
  9. `loadAssunto` (~linha 3569)
  10. `loadOrgaoMes` (~linha 1648)
  11. `loadTempoMedio` (~linha 3762)
  12. `loadTipo` (~linha 2215)
  13. `loadSetor` (~linha 2524)
  14. `loadSecretaria` (~linha 2630)
  15. `loadSecretariasDistritos` (~linha 2633)
  16. `loadCadastrante` (~linha 2879)
  17. `loadReclamacoes` (~linha 3083)
  18. `loadProjecao2026` (~linha 3208)
  19. `loadUnit` (~linha 2218)

#### Passo 1.3: Remover Exportações
- Remover funções do objeto `dataExports` (linha ~2154-2165)
- Remover funções do `Object.assign` (linha ~2176-2184)

#### Passo 1.4: Remover Logs de Debug
- Remover logs de debug (linhas ~2100-2215)
- Manter apenas logs essenciais de erro

**Resultado Esperado:**
- Redução de ~2000 linhas (~40% menor)
- Bundle JavaScript ~40% menor
- Carregamento inicial ~30% mais rápido

---

### Fase 2: Otimizar Inicialização (Prioridade ALTA) 🔴

#### Passo 2.1: Garantir Ordem de Carregamento
```html
<!-- index.html - Garantir ordem correta -->
<script src="scripts/config.js"></script>
<script src="scripts/utils/logger.js"></script>
<script src="scripts/utils/timerManager.js"></script>
<script src="scripts/modules/global-store.js"></script>
<script src="scripts/modules/chart-factory.js"></script>
<script src="scripts/dataLoader.js"></script>
<script src="scripts/filters.js"></script>
<!-- Módulos de dados (carregados antes de data.js) -->
<script src="scripts/modules/data-overview.js"></script>
<script src="scripts/modules/data-pages.js"></script>
<!-- data.js por último (fallback) -->
<script src="scripts/data.js"></script>
<script src="scripts/main.js"></script>
```

#### Passo 2.2: Simplificar `getPageLoader`
```javascript
// main.js - Simplificar verificação
function getPageLoader(page) {
  const loaderMap = {
    'main': 'loadOverview',
    'tema': 'loadTema',
    // ... outros
  };
  
  const funcName = loaderMap[page];
  if (!funcName) return null;
  
  // SIMPLIFICADO: Apenas uma verificação
  return () => {
    const func = window.data?.[funcName];
    if (!func) {
      console.warn(`Função ${funcName} não encontrada`);
      return Promise.resolve();
    }
    return func();
  };
}
```

#### Passo 2.3: Remover Timeout de 2 Segundos
- Remover lógica de `maxAttempts` e `checkAndExecute`
- Garantir que módulos estão carregados antes de `main.js`

**Resultado Esperado:**
- Eliminação de atraso de 2 segundos
- Inicialização ~50% mais rápida
- Código mais simples e manutenível

---

### Fase 3: Otimizar Cache e Filtros (Prioridade MÉDIA) 🟡

#### Passo 3.1: Otimizar TTL do Cache
```javascript
// global-store.js
// Aumentar TTL para dados estáticos
const TTL_CONFIG = {
  'dashboardData': 5000,           // 5s - dados dinâmicos
  '/api/distritos': 300000,         // 5min - dados estáticos
  '/api/unit/*': 300000,           // 5min - dados estáticos
  '/api/aggregate/by-month': 10000, // 10s - dados semi-estáticos
};
```

#### Passo 3.2: Adicionar Debounce em Filtros
```javascript
// filters.js
let filterDebounceTimer = null;

function applyGlobalFilter(field, value, chartId, element) {
  // Debounce de 300ms
  clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(() => {
    // Lógica de filtro
  }, 300);
}
```

#### Passo 3.3: Implementar Cache Persistente
```javascript
// dataLoader.js
// Adicionar cache em localStorage para dados estáticos
const CACHE_KEY = 'dashboard_cache_';
const CACHE_TTL = 300000; // 5 minutos

function getPersistentCache(key) {
  try {
    const cached = localStorage.getItem(CACHE_KEY + key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch (e) {}
  return null;
}
```

**Resultado Esperado:**
- Redução de ~50% nas requisições à API
- Melhor experiência do usuário
- Menos carga no servidor

---

### Fase 4: Otimizar Renderização (Prioridade MÉDIA) 🟡

#### Passo 4.1: Otimizar Verificação de Visibilidade
```javascript
// data-overview.js
// Substituir setInterval por IntersectionObserver
async function loadOverview(forceRefresh = false) {
  const pageMain = document.getElementById('page-main');
  if (!pageMain || pageMain.style.display === 'none') {
    // Usar IntersectionObserver em vez de setInterval
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          loadOverview(forceRefresh).then(resolve).catch(resolve);
        }
      });
      observer.observe(pageMain);
      
      // Timeout de segurança (5s)
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 5000);
    });
  }
  // ... resto da função
}
```

#### Passo 4.2: Cleanup de Listeners
```javascript
// main.js
// Adicionar cleanup quando página muda
let currentPageUnsubscribes = [];

function showPage(pageName) {
  // Limpar listeners da página anterior
  currentPageUnsubscribes.forEach(unsub => unsub());
  currentPageUnsubscribes = [];
  
  // ... carregar nova página
}
```

**Resultado Esperado:**
- Prevenção de memory leaks
- Melhor performance em navegação prolongada
- Menos polling desnecessário

---

## 📊 Métricas de Sucesso

### Antes das Otimizações
- **Tamanho do bundle:** ~5068 linhas em `data.js`
- **Tempo de inicialização:** ~2-3 segundos (com timeout)
- **Requisições à API:** Múltiplas por página
- **Uso de memória:** Alto (funções deprecated em memória)

### Depois das Otimizações
- **Tamanho do bundle:** ~3000 linhas em `data.js` (~40% menor)
- **Tempo de inicialização:** ~1 segundo (sem timeout)
- **Requisições à API:** ~50% menos (cache otimizado)
- **Uso de memória:** ~20-30% menor (código limpo)

---

## ⚠️ Riscos e Mitigações

### Risco 1: Quebrar Compatibilidade
- **Mitigação:** Verificar todas as dependências antes de remover
- **Teste:** Testar todas as páginas após remoção

### Risco 2: Ordem de Carregamento
- **Mitigação:** Garantir ordem correta no `index.html`
- **Teste:** Verificar que todos os módulos estão disponíveis

### Risco 3: Cache Desatualizado
- **Mitigação:** Implementar invalidação adequada
- **Teste:** Verificar que dados são atualizados quando necessário

---

## 🎯 Priorização

### Sprint 1 (Imediato) 🔴
1. Remover timeout de 2 segundos em `main.js`
2. Simplificar verificações de disponibilidade
3. Remover logs de debug de `data.js`

### Sprint 2 (Curto Prazo) 🟡
4. Remover 19 funções deprecated de `data.js`
5. Otimizar TTL do cache
6. Adicionar debounce em filtros

### Sprint 3 (Médio Prazo) 🟢
7. Implementar cache persistente
8. Otimizar verificação de visibilidade
9. Cleanup de listeners

---

**Última Atualização:** Janeiro 2025  
**Status:** 📋 **PLANO CRIADO - PRONTO PARA EXECUÇÃO**

