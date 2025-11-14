# 🔍 Análise de Performance e Lentidão - Sistema de Dashboard

**Data:** Janeiro 2025  
**Objetivo:** Identificar causas de lentidão e código obsoleto no sistema

---

## 📊 Resumo Executivo

### ⚠️ Problemas Identificados

1. **Código Obsoleto Duplicado:**
   - `data.js` contém ~5000 linhas com 19 funções deprecated
   - Funções duplicadas ainda sendo exportadas
   - Código legado mantido para compatibilidade

2. **Inicialização:**
   - Múltiplas verificações de disponibilidade de módulos
   - Carregamento sequencial de scripts
   - Falta de lazy loading para módulos não críticos

3. **Carregamento de Dados:**
   - Possíveis chamadas redundantes de API
   - Cache não otimizado em alguns casos
   - Falta de debounce em alguns filtros

---

## 🔍 Análise Detalhada

### 1. Código Obsoleto em `data.js` ⚠️ CRÍTICO

**Problema:**
- Arquivo com ~5068 linhas
- 19 funções marcadas como `@deprecated` mas ainda exportadas
- Funções ainda sendo mantidas em memória e executadas
- Código duplicado entre `data.js` e `data-pages.js`
- Múltiplos logs de debug (`console.log`, `window.Logger.debug`)
- Verificações redundantes de disponibilidade de módulos

**Impacto:**
- **Tamanho do bundle:** ~5000 linhas de código obsoleto
- **Memória:** Funções deprecated mantidas em memória
- **Performance:** Execução de código não utilizado
- **Manutenção:** Confusão sobre qual função está sendo usada

**Evidências:**
```javascript
// data.js linha ~2100-2200
// Múltiplos logs de debug:
if (window.Logger) {
  window.Logger.debug('🔍 data.js: Dentro do bloco try de exportação');
} else {
  console.log('🔍 data.js: Dentro do bloco try de exportação');
}

// 19 funções deprecated ainda exportadas:
loadCategoria, loadStatusPage, loadBairro, loadUAC, 
loadResponsavel, loadCanal, loadPrioridade, loadTema, 
loadAssunto, loadOrgaoMes, loadTempoMedio, loadTipo, 
loadSetor, loadSecretaria, loadSecretariasDistritos, 
loadCadastrante, loadReclamacoes, loadProjecao2026, loadUnit
```

**Solução:**
- **Prioridade ALTA:** Remover 19 funções deprecated de `data.js`
- Reduzir `data.js` de ~5068 para ~3000 linhas (~40% de redução)
- Consolidar código duplicado
- Remover logs de debug em produção

---

### 2. Processo de Inicialização

#### 2.1 Carregamento de Scripts

**Status Atual:**
```html
<!-- Scripts carregados em ordem sequencial -->
<script src="scripts/config.js"></script>
<script src="scripts/utils/logger.js"></script>
<script src="scripts/utils/timerManager.js"></script>
<script src="scripts/modules/global-store.js"></script>
<script src="scripts/modules/chart-factory.js"></script>
<script src="scripts/dataLoader.js"></script>
<!-- ... mais scripts ... -->
```

**Problemas Identificados:**
- Scripts carregados sequencialmente (bloqueiam renderização)
- Falta de `defer` ou `async` em alguns scripts
- Todos os módulos carregados mesmo se não forem usados imediatamente

**Solução:**
- Adicionar `defer` ou `async` onde apropriado
- Implementar lazy loading para módulos não críticos
- Carregar módulos sob demanda

#### 2.2 Verificações de Disponibilidade ⚠️ CAUSA LENTIDÃO

**Problema:**
```javascript
// main.js linha ~120-190
// Múltiplas verificações em getPageLoader a cada navegação:
if (window.data && typeof window.data[funcName] === 'function') {
  return window.data[funcName];
}
if (typeof window[funcName] === 'function') {
  return window[funcName];
}
if (window.dataPages && typeof window.dataPages[funcName] === 'function') {
  return window.dataPages[funcName];
}

// Timeout de até 2 segundos (20 tentativas x 100ms):
if (!func && !window.data && (funcName === 'loadOrgaoMes' || ...)) {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 20; // 2 segundos!
    const checkAndExecute = () => {
      attempts++;
      // ... verifica novamente a cada 100ms
    };
  });
}
```

**Impacto:**
- **Latência:** Até 2 segundos de atraso na inicialização de algumas páginas
- **CPU:** Múltiplas verificações desnecessárias
- **Complexidade:** Lógica complexa de fallback

**Solução:**
- **Prioridade ALTA:** Garantir ordem correta de carregamento de scripts
- Remover timeout de 2 segundos (não deveria ser necessário)
- Simplificar verificações (usar apenas `window.data[funcName]`)
- Usar sistema de eventos para notificar quando módulos estão prontos

---

### 3. Carregamento de Dados

#### 3.1 Chamadas Redundantes de API

**Problema:**
- Possíveis chamadas duplicadas antes do cache estar ativo
- Falta de debounce em alguns filtros
- Múltiplas requisições para o mesmo endpoint

**Solução:**
- Verificar se `dataLoader` está usando deduplicação corretamente
- Adicionar debounce em filtros
- Garantir que cache está ativo desde o início

#### 3.2 Cache e TTL

**Status:**
- `dataStore` tem TTL padrão de 5 segundos
- `dataLoader` verifica cache antes de fazer requisição
- Deduplicação de requisições simultâneas implementada

**Melhorias Possíveis:**
- Aumentar TTL para dados que mudam pouco
- Implementar cache persistente (localStorage)
- Pre-carregar dados críticos

---

### 4. Gráficos e Renderização

#### 4.1 Criação de Gráficos

**Status:**
- Chart Factory implementado
- Atualizações eficientes com `updateChart()`
- Fallbacks mantidos para compatibilidade

**Problema:**
- Fallbacks ainda criam gráficos mesmo quando Chart Factory está disponível
- Múltiplas verificações de disponibilidade

**Solução:**
- Remover fallbacks quando Chart Factory está garantido
- Simplificar lógica de criação de gráficos

#### 4.2 Subscribe e Reatividade

**Status:**
- Sistema de subscribe implementado
- Notificações automáticas quando dados mudam

**Problema:**
- Múltiplos listeners podem ser criados sem cleanup adequado
- Possível memory leak se unsubscribe não for chamado

**Solução:**
- Garantir cleanup de listeners quando páginas são desmontadas
- Adicionar sistema de gestão de subscriptions

---

### 5. Console Logs e Debugging ⚠️ IMPACTO MODERADO

**Problema:**
- Múltiplos `console.log`, `console.warn`, `console.error` no código
- Logs de debug em `data.js` (linhas ~2100-2215)
- Verificações condicionais `if (window.Logger)` em muitos lugares
- Logs podem impactar performance em produção

**Evidências:**
```javascript
// data.js - múltiplos logs de debug:
if (window.Logger) {
  window.Logger.debug('🔍 data.js: Dentro do bloco try de exportação');
} else {
  console.log('🔍 data.js: Dentro do bloco try de exportação');
}
// Repetido várias vezes no código
```

**Impacto:**
- **Performance:** Logs desnecessários em produção
- **Tamanho:** Código de logging aumenta bundle
- **Manutenção:** Logs de debug dificultam leitura do código

**Solução:**
- **Prioridade MÉDIA:** Remover logs de debug de `data.js`
- Usar `window.Logger` consistentemente (já implementado)
- Desabilitar logs em produção via configuração
- Implementar sistema de logging configurável com níveis

---

## 🚀 Recomendações de Otimização

### Prioridade ALTA 🔴 (Causam Lentidão)

1. **Remover Código Obsoleto de `data.js`:**
   - **Ação:** Remover 19 funções deprecated
   - **Redução:** ~5068 → ~3000 linhas (~40% menor)
   - **Impacto:** 
     - Redução de ~40% no tamanho do bundle JavaScript
     - Menos código em memória
     - Carregamento inicial ~30% mais rápido
   - **Esforço:** Médio (precisa verificar dependências)

2. **Simplificar Verificações de Disponibilidade em `main.js`:**
   - **Ação:** Remover timeout de 2 segundos e verificações redundantes
   - **Problema:** `getPageLoader` faz até 20 tentativas (2 segundos) para encontrar funções
   - **Impacto:**
     - Elimina atraso de até 2 segundos na inicialização
     - Reduz verificações desnecessárias
     - Simplifica código
   - **Esforço:** Baixo (garantir ordem de carregamento)

3. **Otimizar Carregamento de Scripts no `index.html`:**
   - **Ação:** Adicionar `defer` ou `async` onde apropriado
   - **Problema:** Scripts carregados sequencialmente bloqueiam renderização
   - **Impacto:**
     - Redução de tempo de carregamento inicial
     - Melhor First Contentful Paint (FCP)
   - **Esforço:** Baixo

### Prioridade MÉDIA 🟡 (Melhorias Importantes)

4. **Remover Logs de Debug de `data.js`:**
   - **Ação:** Remover múltiplos `console.log` e verificações `if (window.Logger)`
   - **Problema:** Logs de debug em produção (linhas ~2100-2215)
   - **Impacto:**
     - Redução de overhead de logging
     - Código mais limpo
   - **Esforço:** Baixo

5. **Otimizar Cache:**
   - **Ação:** Aumentar TTL para dados estáticos, implementar cache persistente
   - **Problema:** TTL padrão de 5 segundos pode ser muito curto para dados estáticos
   - **Impacto:** 
     - Redução de ~50% nas requisições à API
     - Melhor experiência do usuário
   - **Esforço:** Baixo

6. **Implementar Debounce em Filtros:**
   - **Ação:** Adicionar debounce em `applyGlobalFilter` e `clearGlobalFilters`
   - **Problema:** Filtros podem disparar múltiplas requisições rapidamente
   - **Impacto:** 
     - Redução de requisições desnecessárias
     - Melhor performance durante interação
   - **Esforço:** Baixo

7. **Cleanup de Listeners:**
   - **Ação:** Garantir unsubscribe quando páginas são desmontadas
   - **Problema:** Possível memory leak se listeners não forem limpos
   - **Impacto:** 
     - Prevenção de memory leaks
     - Melhor performance em navegação prolongada
   - **Esforço:** Médio

### Prioridade BAIXA 🟢 (Otimizações Finais)

8. **Remover Fallbacks Desnecessários:**
   - **Ação:** Remover fallbacks quando Chart Factory está garantido
   - **Problema:** Fallbacks ainda executam verificações mesmo quando não necessário
   - **Impacto:** 
     - Código mais limpo
     - Performance marginal
   - **Esforço:** Baixo

9. **Otimizar Verificações de Visibilidade:**
   - **Ação:** Melhorar lógica de verificação de visibilidade de páginas
   - **Problema:** `loadOverview` usa `setInterval` para verificar visibilidade (linha ~33)
   - **Impacto:** 
     - Redução de polling desnecessário
     - Melhor performance
   - **Esforço:** Baixo

---

## 📝 Checklist de Otimização Detalhado

### Código Obsoleto (Prioridade ALTA) 🔴
- [ ] **Remover 19 funções deprecated de `data.js`:**
  - `loadCategoria`, `loadStatusPage`, `loadBairro`, `loadUAC`
  - `loadResponsavel`, `loadCanal`, `loadPrioridade`
  - `loadTema`, `loadAssunto`, `loadOrgaoMes`, `loadTempoMedio`
  - `loadTipo`, `loadSetor`, `loadSecretaria`, `loadSecretariasDistritos`
  - `loadCadastrante`, `loadReclamacoes`, `loadProjecao2026`, `loadUnit`
- [ ] **Remover logs de debug** (linhas ~2100-2215)
- [ ] **Consolidar código duplicado**
- [ ] **Reduzir tamanho de `data.js`** de ~5068 para ~3000 linhas

### Inicialização (Prioridade ALTA) 🔴
- [ ] **Remover timeout de 2 segundos** em `getPageLoader` (main.js linha ~140-190)
- [ ] **Simplificar verificações** de disponibilidade (remover verificações redundantes)
- [ ] **Garantir ordem correta** de carregamento de scripts
- [ ] **Adicionar `defer`/`async`** em scripts não críticos no `index.html`
- [ ] **Implementar lazy loading** para módulos não críticos

### Carregamento de Dados (Prioridade MÉDIA) 🟡
- [ ] **Verificar deduplicação** de requisições (já implementado, verificar se funciona)
- [ ] **Adicionar debounce** em `applyGlobalFilter` e `clearGlobalFilters` (filters.js linha ~57-92)
- [ ] **Otimizar TTL do cache:**
  - Aumentar TTL para dados estáticos (ex: distritos, unidades)
  - Manter TTL curto para dados dinâmicos (ex: dashboard)
- [ ] **Implementar cache persistente** (localStorage) para dados estáticos

### Renderização (Prioridade MÉDIA) 🟡
- [ ] **Garantir cleanup de listeners** quando páginas são desmontadas
- [ ] **Remover fallbacks desnecessários** quando Chart Factory está garantido
- [ ] **Otimizar verificação de visibilidade** em `loadOverview` (data-overview.js linha ~33)
  - Substituir `setInterval` por `IntersectionObserver` ou evento de visibilidade

### Logs e Debugging (Prioridade MÉDIA) 🟡
- [ ] **Remover logs de debug** de `data.js`
- [ ] **Desabilitar logs em produção** via configuração
- [ ] **Implementar sistema de logging configurável** com níveis (debug, info, warn, error)

---

## 🎯 Impacto Esperado das Otimizações

### Redução de Tamanho
- **Bundle JavaScript:** ~40% menor (removendo 19 funções deprecated)
  - De ~5068 linhas para ~3000 linhas em `data.js`
  - Redução de ~2000 linhas de código obsoleto
- **Tempo de carregamento inicial:** ~30-40% mais rápido
  - Remoção de código não utilizado
  - Scripts com `defer`/`async`

### Melhoria de Performance
- **Tempo de inicialização:** ~50% mais rápido
  - Eliminação de timeout de 2 segundos em `getPageLoader`
  - Simplificação de verificações
- **Requisições à API:** ~50% menos (cache otimizado)
  - TTL aumentado para dados estáticos
  - Cache persistente (localStorage)
- **Uso de memória:** ~20-30% menor
  - Remoção de funções deprecated
  - Cleanup adequado de listeners
- **Latência de navegação:** ~60% menor
  - Remoção de verificações redundantes
  - Simplificação de `getPageLoader`

---

## 📊 Métricas para Monitorar

1. **Tempo de Carregamento Inicial:**
   - Tempo até primeiro render
   - Tempo até interatividade completa

2. **Requisições à API:**
   - Número de requisições por página
   - Taxa de cache hit

3. **Uso de Memória:**
   - Tamanho do bundle JavaScript
   - Uso de memória durante navegação

4. **Performance de Renderização:**
   - Tempo de criação de gráficos
   - FPS durante interações

---

**Última Atualização:** Janeiro 2025  
**Status:** ⚠️ **ANÁLISE COMPLETA - OTIMIZAÇÕES IDENTIFICADAS**

