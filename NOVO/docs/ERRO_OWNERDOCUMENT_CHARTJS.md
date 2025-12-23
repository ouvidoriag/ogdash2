# 🔴 Erro "Cannot read properties of null (reading 'ownerDocument')" — Explicação Completa

## 📋 Resumo Executivo

O erro:

```
Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
```

Indica que o código está tentando acessar alguma propriedade de um elemento que está **nulo**, ou seja, um elemento que **não existe no momento da execução**.

Esse problema é muito comum em aplicações que usam **Chart.js** ou outras bibliotecas que manipulam o DOM, quando o código tenta manipular ou acessar o DOM antes do elemento existir, ou quando a referência está sendo atribuída no momento errado.

---

## 🔍 Principais Causas Desse Erro

### 1. Query Selectors Retornando Null

**Exemplo problemático:**

```javascript
const el = document.getElementById('canvas-chart');
el.ownerDocument; // ❌ se el for null → erro
```

**Causa:** O elemento `canvas-chart` não existe no DOM quando o código tenta acessá-lo.

### 2. Canvas Removido do DOM Antes do Chart.js Terminar

**Cenário comum:**

```javascript
const canvas = document.getElementById('chart');
const chart = new Chart(canvas, config); // Chart.js inicia processamento

// Enquanto Chart.js processa internamente...
canvas.remove(); // ❌ Canvas removido do DOM

// Chart.js tenta acessar canvas.ownerDocument → null → erro
```

### 3. Condição de Corrida (Race Condition)

**Problema:**

```javascript
// Verificação passa
const canvas = document.getElementById('chart');
if (canvas) { // ✅ Canvas existe aqui
  // Mas entre esta linha e a próxima, o canvas pode ser removido
  const chart = new Chart(canvas, config); // ❌ Canvas já foi removido
}
```

### 4. Renderização Condicional

O código acessa um elemento que só existe após certa condição:

```javascript
{isOpen && <canvas id="chart"></canvas>}
```

Se o script tentar acessar o canvas antes de `isOpen` ser `true` → `null`.

### 5. Problemas de Layout Causando DOM Quebrado

Como você já enfrenta um problema de layout (container com `min-h-screen`), é possível que algum container esteja retornando `null` porque a estrutura visual está sendo montada de forma incorreta, fazendo com que os canvas fiquem fora do escopo esperado.

### 6. Chart.js Acessando Elementos Internamente

O Chart.js pode tentar acessar `ownerDocument` internamente durante:

- Inicialização do gráfico
- Atualização de dados
- Redimensionamento (resize)
- Destruição do gráfico

Se o canvas foi removido ou não existe, o erro ocorre.

---

## 🎯 Erro Específico no Projeto

### Localização do Erro

Baseado nos logs do console:

```
chart.umd.min.js:19  Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
index.umd.ts:50      Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
```

O erro está ocorrendo dentro do **Chart.js** (`chart.umd.min.js`) e possivelmente em algum código TypeScript compilado (`index.umd.ts`).

### Contexto do Erro

Pelos logs, o erro ocorre durante:

1. **Renderização de gráficos** após carregar dados
2. **Navegação entre páginas** (destruição/criação de gráficos)
3. **Carregamento de filtros avançados**

### Possíveis Pontos de Falha

1. **`chart-factory.js`** — Funções `createBarChart`, `createDoughnutChart`, `createLineChart`
2. **`overview.js`** — Renderização de múltiplos gráficos em paralelo
3. **`global-filters.js`** — Acesso a instâncias do Chart.js via canvas

---

## ✅ Como Resolver

### Solução 1: Verificar Canvas Antes de Usar (Já Implementado Parcialmente)

**Arquivo:** `NOVO/public/scripts/core/chart-factory.js`

O código já verifica se o canvas existe:

```javascript
const canvas = document.getElementById(canvasId);
if (!canvas) {
  if (window.Logger) {
    window.Logger.warn(`Canvas ${canvasId} não encontrado`);
  }
  return null;
}
```

**Melhoria necessária:** Adicionar verificação adicional antes de passar para Chart.js:

```javascript
const canvas = document.getElementById(canvasId);
if (!canvas || !canvas.ownerDocument) {
  if (window.Logger) {
    window.Logger.warn(`Canvas ${canvasId} não encontrado ou removido do DOM`);
  }
  return null;
}

// Verificar se o canvas ainda está no DOM antes de criar o gráfico
if (!document.body.contains(canvas)) {
  if (window.Logger) {
    window.Logger.warn(`Canvas ${canvasId} não está mais no DOM`);
  }
  return null;
}
```

### Solução 2: Aguardar DOM Estar Pronto

**Problema:** Scripts executando antes do DOM estar completamente carregado.

**Solução:** Garantir que o código só execute após o DOM estar pronto:

```javascript
async function createChart(canvasId, labels, values, options = {}) {
  // Aguardar DOM estar pronto
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  const canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.ownerDocument) {
    return null;
  }
  
  // ... resto do código
}
```

### Solução 3: Destruir Gráficos Antes de Remover Canvas

**Problema:** Canvas sendo removido do DOM enquanto Chart.js ainda está processando.

**Solução:** Sempre destruir o gráfico antes de remover o canvas:

```javascript
// ❌ ERRADO
canvas.remove(); // Canvas removido
if (chart) chart.destroy(); // Chart.js tenta acessar canvas.ownerDocument → erro

// ✅ CORRETO
if (chart) {
  chart.destroy(); // Destruir primeiro
  chart = null;
}
canvas.remove(); // Agora pode remover com segurança
```

### Solução 4: Usar Try-Catch em Todas as Operações do Chart.js

**Arquivo:** `NOVO/public/scripts/core/chart-factory.js`

Adicionar try-catch robusto:

```javascript
async function createBarChart(canvasId, labels, values, options = {}) {
  try {
    await ensureChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.ownerDocument) {
      if (window.Logger) {
        window.Logger.warn(`Canvas ${canvasId} não encontrado ou inválido`);
      }
      return null;
    }
    
    // Verificar se canvas ainda está no DOM
    if (!document.body.contains(canvas)) {
      if (window.Logger) {
        window.Logger.warn(`Canvas ${canvasId} não está mais no DOM`);
      }
      return null;
    }
    
    // Verificar se Chart.js está disponível
    if (!window.Chart) {
      if (window.Logger) {
        window.Logger.warn('Chart.js não está carregado');
      }
      return null;
    }
    
    // Destruir gráfico existente de forma segura
    if (window[canvasId] instanceof window.Chart) {
      try {
        window[canvasId].destroy();
      } catch (e) {
        // Ignorar erros ao destruir (pode já estar destruído)
        if (window.Logger) {
          window.Logger.debug(`Erro ao destruir gráfico ${canvasId}:`, e);
        }
      }
      window[canvasId] = null;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (window.Logger) {
        window.Logger.warn(`Não foi possível obter contexto 2D do canvas ${canvasId}`);
      }
      return null;
    }
    
    // Criar gráfico com proteção adicional
    let chart;
    try {
      chart = new window.Chart(ctx, config);
    } catch (error) {
      if (window.Logger) {
        window.Logger.error(`Erro ao criar gráfico ${canvasId}:`, error);
      }
      return null;
    }
    
    return chart;
    
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro geral ao criar gráfico de barra ${canvasId}:`, error);
    }
    return null;
  }
}
```

### Solução 5: Verificar Antes de Acessar Instâncias do Chart.js

**Arquivo:** `NOVO/public/scripts/core/chart-communication/global-filters.js`

Ao iterar sobre canvas para acessar instâncias do Chart.js:

```javascript
// ❌ ERRADO
document.querySelectorAll('canvas').forEach(canvas => {
  const chart = Chart.getChart(canvas);
  chart.update(); // Pode ser null
});

// ✅ CORRETO
document.querySelectorAll('canvas').forEach(canvas => {
  // Verificar se canvas ainda está no DOM
  if (!canvas || !canvas.ownerDocument || !document.body.contains(canvas)) {
    return; // Pular canvas inválido
  }
  
  try {
    const chart = Chart.getChart(canvas);
    if (chart && chart.canvas && chart.canvas.ownerDocument) {
      chart.update();
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.debug('Erro ao atualizar gráfico:', error);
    }
  }
});
```

### Solução 6: Corrigir Problema de Layout (Relacionado)

Como mencionado no documento `PROBLEMA_LAYOUT_DASHBOARD.md`, o problema de layout pode estar causando canvas fora do escopo esperado.

**Solução:** Corrigir o container principal removendo `min-h-screen`:

```html
<!-- ANTES -->
<div class="min-h-screen grid grid-cols-12 gap-6 p-6">

<!-- DEPOIS -->
<div class="grid grid-cols-12 gap-6 p-6">
```

Isso pode eliminar o erro automaticamente, pois os canvas estarão no local correto do DOM.

---

## 🧪 Testes para Diagnosticar

### Teste 1: Verificar Canvas no Console

Abra o console do navegador (F12) e execute:

```javascript
// Verificar todos os canvas
document.querySelectorAll('canvas').forEach((canvas, index) => {
  console.log(`Canvas ${index}:`, {
    id: canvas.id,
    exists: !!canvas,
    inDOM: document.body.contains(canvas),
    hasOwnerDocument: !!canvas.ownerDocument,
    parent: canvas.parentElement?.tagName
  });
});
```

### Teste 2: Verificar Instâncias do Chart.js

```javascript
// Verificar instâncias do Chart.js
if (window.Chart) {
  document.querySelectorAll('canvas').forEach(canvas => {
    const chart = Chart.getChart(canvas);
    if (chart) {
      console.log(`Chart ${canvas.id}:`, {
        exists: !!chart,
        canvasExists: !!chart.canvas,
        hasOwnerDocument: !!chart.canvas?.ownerDocument
      });
    }
  });
}
```

### Teste 3: Monitorar Remoção de Canvas

```javascript
// Observar remoção de elementos
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.removedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.tagName === 'CANVAS') {
        console.warn('⚠️ Canvas removido do DOM:', node.id);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

---

## 📊 Conclusão

O erro `Cannot read properties of null (reading 'ownerDocument')` ocorre quando:

1. ✅ **Canvas não existe** no DOM quando o código tenta acessá-lo
2. ✅ **Canvas foi removido** do DOM enquanto Chart.js ainda está processando
3. ✅ **Condição de corrida** entre verificação e uso do canvas
4. ✅ **Problema de layout** fazendo canvas ficar fora do escopo esperado

### Resumo das Soluções

1. **Verificar canvas antes de usar** — Adicionar `canvas.ownerDocument` e `document.body.contains(canvas)`
2. **Aguardar DOM estar pronto** — Garantir que scripts executem após DOMContentLoaded
3. **Destruir gráficos antes de remover canvas** — Ordem correta de operações
4. **Try-catch robusto** — Proteger todas as operações do Chart.js
5. **Verificar instâncias antes de acessar** — Validar Chart.getChart() retorna valor válido
6. **Corrigir layout** — Remover `min-h-screen` do container principal

### Próximos Passos

1. Implementar verificações adicionais no `chart-factory.js`
2. Adicionar proteção em `global-filters.js` ao iterar sobre canvas
3. Corrigir problema de layout (remover `min-h-screen`)
4. Testar em diferentes cenários de navegação
5. Monitorar logs para identificar padrões do erro

---

## 📝 Notas Técnicas

- **Arquivos afetados:**
  - `NOVO/public/scripts/core/chart-factory.js`
  - `NOVO/public/scripts/core/chart-communication/global-filters.js`
  - `NOVO/public/scripts/pages/ouvidoria/overview.js`
  - `NOVO/public/index.html` (layout)

- **Biblioteca:** Chart.js 4.4.3 (via CDN)

- **Impacto:** Erro não quebra funcionalidade, mas polui console e pode causar gráficos não renderizados

- **Prioridade:** Alta (afeta UX e estabilidade)

---

**Documento criado por:** CÉREBRO X-3  
**Data:** 2025-12-12  
**Versão:** 1.0

