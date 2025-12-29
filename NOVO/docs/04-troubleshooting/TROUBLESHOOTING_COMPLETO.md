# 🔍 Troubleshooting Completo do Sistema

**Sistema:** Dashboard de Ouvidoria, Zeladoria e E-SIC  
**Data:** 12/12/2025  
**CÉREBRO X-3**

---

## 📋 Resumo Executivo

Este documento consolida todos os problemas identificados e suas soluções no sistema. Os problemas são categorizados por área: **Dashboard/Layout**, **Erros do Console**, **Duplicatas de Dados**, **Chart.js/DOM**, e **Configuração Google API**.

**Problemas principais identificados:**

1. **Layout CSS** — Conteúdo empurrado para baixo por `min-h-screen` no container principal
2. **Erro DOM** — `Cannot read properties of null (reading 'ownerDocument')` no Chart.js
3. **Duplicatas no Banco** — Protocolos duplicados por normalização inconsistente
4. **Erros do Console** — Funções inexistentes e gráficos inválidos
5. **Configuração Google API** — URIs de redirecionamento não salvos corretamente

---

## 📑 Índice

1. [Problemas de Dashboard e Layout](#problemas-de-dashboard-e-layout)
2. [Erros do Console JavaScript](#erros-do-console-javascript)
3. [Duplicatas no Banco de Dados](#duplicatas-no-banco-de-dados)
4. [Erro ownerDocument no Chart.js](#erro-ownerdocument-no-chartjs)
5. [Configuração Google API](#configuração-google-api)

---

## 1. Problemas de Dashboard e Layout

### ✅ Status dos Módulos do Sistema

### Módulos Funcionando Corretamente

O log do console mostra que **todos os sistemas estão inicializados e operacionais**:

- ✅ **Sistema de tratamento de erros** ativo
- ✅ **Sistema de validação de dados** inicializado
- ✅ **Sistema de loading states** inicializado
- ✅ **Page Helper** inicializado
- ✅ **Timer Manager** inicializado
- ✅ **Cache Config** inicializado (TTLs centralizados)
- ✅ **Filtros do localStorage** limpos (sistema local por página)
- ✅ **Global Data Store** inicializado (com cache persistente)
- ✅ **Sistema de Comunicação entre Gráficos** inicializado (modularizado)
- ✅ **Sistema Crossfilter Overview** inicializado
- ✅ **Chart Factory** inicializado
- ✅ **Página Overview** carregada
- ✅ **Listeners de filtro** inicializados para todos os módulos
- ✅ **Endpoints respondendo** com cache HIT
- ✅ **Dropdowns populados** corretamente
- ✅ **Service Worker** registrado
- ✅ **Gráficos renderizados** com sucesso

### Conclusão sobre Módulos

**Não há erro operacional no backend ou na lógica de negócio.** Todos os sistemas estão funcionando corretamente. O problema é **100% visual e estrutural**, relacionado ao DOM e CSS.

---

### 🔴 Problema 1.1: Conteúdo Sendo Empurrado para Baixo

### Descrição do Problema

O layout renderiza o conteúdo principal **muito abaixo da área visível**, como se houvesse um grande espaço invisível no topo.

**Sintomas:**
- A página carrega apenas o menu lateral
- O conteúdo principal (dashboard / home) aparece vazio na primeira visualização
- Só se vê um grande bloco escuro no centro
- Ao rolar a página, o conteúdo aparece normalmente
- É como se algo grande (invisível) estivesse empurrando tudo para baixo

### Causa Identificada

**Causa raiz encontrada:** No arquivo `NOVO/public/index.html`, linha 671:

```html
<div class="min-h-screen grid grid-cols-12 gap-6 p-6">
```

A classe `min-h-screen` (equivalente a `min-height: 100vh`) está forçando o container principal a ter uma altura mínima de 100% da viewport, mesmo quando o conteúdo não precisa de todo esse espaço.

### Por Que Isso Causa o Problema

1. O container principal recebe `min-height: 100vh`
2. O conteúdo real (dashboard/home) é menor que 100vh
3. O navegador cria um espaço vazio no topo para "preencher" os 100vh
4. O conteúdo visível fica empurrado para baixo, fora da área visível inicial

### Evidências

- Menu lateral funciona corretamente (não afetado)
- Conteúdo existe e está renderizado (visível ao rolar a página)
- APIs respondem normalmente
- Apenas o posicionamento visual está incorreto

---

### 🔴 Problema 1.2: Erro "Cannot read properties of null (reading 'ownerDocument')"

### Descrição do Erro

```
Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
```

Ocorre quando o JavaScript tenta acessar um elemento que **ainda não existe no DOM** ou foi **removido do DOM**.

### Causas Identificadas

Esse erro geralmente acontece em três cenários:

1. **O elemento está sendo selecionado antes de existir no HTML**
   - Script executa antes do DOM estar completamente carregado
   - Canvas é buscado antes de ser renderizado

2. **O componente foi desmontado, mas ainda existe código tentando manipulá-lo**
   - Canvas removido do DOM enquanto Chart.js ainda está processando
   - Navegação entre páginas destrói canvas antes do Chart.js terminar

3. **Bibliotecas de UI (Chart.js) tentam usar ownerDocument em um nó que não está montado**
   - Chart.js acessa `canvas.ownerDocument` internamente
   - Canvas não existe ou foi removido

### Relação com o Problema de Layout

**Como o layout está desalinhado, é muito possível que algum script esteja buscando elementos que foram empurrados para fora da hierarquia esperada, retornando `null`.**

Cenário provável:

1. Container principal com `min-h-screen` empurra conteúdo para baixo
2. Canvas ficam fora do escopo esperado ou são renderizados em posições inesperadas
3. Scripts tentam acessar canvas que não estão no local esperado
4. `document.getElementById()` retorna `null`
5. Chart.js tenta acessar `canvas.ownerDocument` → erro

### Localização do Erro

Baseado nos logs do console:

```
chart.umd.min.js:19  Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
index.umd.ts:50      Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
```

O erro está ocorrendo dentro do **Chart.js** durante:

- Renderização de gráficos após carregar dados
- Navegação entre páginas (destruição/criação de gráficos)
- Carregamento de filtros avançados

---

### 🔗 Relação Entre os Problemas de Layout

### Problema 1 → Problema 2

O problema de layout **pode estar causando** o erro de `ownerDocument`:

1. ✅ Container com `min-h-screen` empurra conteúdo para baixo
2. ✅ Canvas são renderizados em posições inesperadas
3. ✅ Scripts buscam canvas que não estão no local esperado
4. ✅ `document.getElementById()` retorna `null`
5. ✅ Chart.js tenta acessar `canvas.ownerDocument` → erro

### Problema 2 → Problema 1 (menos provável)

O erro de `ownerDocument` **não causa** o problema de layout, mas pode agravá-lo se gráficos não renderizarem corretamente.

---

### 🛠️ Soluções para Problemas de Layout

### Solução 1: Ajustar Container Principal

**Arquivo:** `NOVO/public/index.html` (linha 671)

**Antes:**
```html
<div class="min-h-screen grid grid-cols-12 gap-6 p-6">
```

**Depois:**
```html
<div class="grid grid-cols-12 gap-6 p-6">
```

Ou, se precisar manter altura mínima:

```html
<div class="min-h-0 grid grid-cols-12 gap-6 p-6">
```

### Solução 2: Verificar Seção de Páginas

**Arquivo:** `NOVO/public/index.html` (procurar por `id="pages"`)

Verificar se a seção que contém as páginas não possui:

```html
<section id="pages" style="min-height: 100vh;">  <!-- REMOVER -->
```

Ou:

```html
<section id="pages" class="min-h-screen">  <!-- REMOVER -->
```

### Solução 3: Ajustar CSS Global

Se o problema persistir, adicionar no `<style>` do `index.html`:

```css
#pages {
  min-height: auto !important;
  height: auto !important;
}

#page-home {
  min-height: auto !important;
  height: auto !important;
}
```

### Solução 4: Verificar JavaScript que Modifica Estilos

Verificar se algum script está aplicando estilos inline problemáticos:

```javascript
// PROCURAR POR:
element.style.minHeight = '100vh';
element.style.height = '100vh';
element.style.marginTop = '...';
```

### Solução 5: Garantir que Canvas Existe Antes de Criar Gráfico

**Arquivo:** `NOVO/public/scripts/core/chart-factory.js` ou páginas individuais

**Antes de criar gráfico:**
```javascript
const canvas = document.getElementById(canvasId);
if (!canvas) {
  console.warn(`Canvas ${canvasId} não encontrado. Aguardando...`);
  return;
}

// Verificar se canvas está no DOM
if (!canvas.ownerDocument || !canvas.ownerDocument.body.contains(canvas)) {
  console.warn(`Canvas ${canvasId} não está no DOM. Aguardando...`);
  return;
}

// Criar gráfico
const chart = new Chart(canvas, config);
```

---

## 🧪 Como Diagnosticar o Problema

### Passo 1: Abrir o DevTools

1. Pressione `F12` para abrir o DevTools
2. Acesse a aba **Elements** (Elementos)

### Passo 2: Inspecionar Containers Principais

1. Passe o mouse sobre os containers `<div>` principais
2. Você verá algum deles com:
   - **Altura gigante** (enorme bloco azul claro no inspector)
   - **Padding/Margin exagerado**

Provavelmente algo como:

```html
<div class="content-wrapper">  <!-- ou -->
<main>                         <!-- ou -->
<div id="pages">               <!-- ou -->
<div class="min-h-screen">    <!-- <-- SUSPEITO PRINCIPAL -->
```

### Passo 3: Desativar Propriedades Suspeitas

No painel **Styles** (Estilos), tente desmarcar:

- `height: 100vh`
- `min-height: 100vh`
- `margin-top: ...`
- `padding-top: ...`
- `flex: 1`

**Resultado esperado:** O conteúdo deve subir imediatamente à posição correta.

### Passo 4: Teste Rápido via Console

Abra o console do navegador (F12) e execute:

```javascript
// Teste 1: Desabilitar min-h-screen
document.querySelector('.min-h-screen')?.classList.remove('min-h-screen');

// Teste 2: Inspecionar altura real
const container = document.querySelector('.min-h-screen');
if (container) {
  console.log('Altura:', container.offsetHeight);
  console.log('Altura da viewport:', window.innerHeight);
  console.log('Diferença:', container.offsetHeight - window.innerHeight);
}
```

Se `offsetHeight` for muito maior que `innerHeight`, confirma o problema.

---

## 📊 Causas Prováveis (CSS)

O problema está relacionado a propriedades CSS que fazem um container ocupar mais espaço do que deveria. Isso normalmente acontece por conta de:

### 1. Propriedades de Altura Excessivas

```css
height: 100vh;
min-height: 100vh;
```

### 2. Margens e Padding Excessivos

```css
margin-top: 500px;  /* muito comum pegar padding de tema sem querer */
padding-top: 400px;
```

### 3. Classes Tailwind Problemáticas

```html
<div class="h-screen">      <!-- altura fixa de 100vh -->
<div class="min-h-screen">  <!-- altura mínima de 100vh -->
```

### 4. Flexbox com Comportamento Incorreto

```css
.container {
  display: flex;
  flex-direction: column;
  flex: 1;  /* pode causar expansão indevida */
}
```

### 5. Position Relative com Top Excessivo

```css
position: relative;
top: 400px;
```

---

## ✅ Checklist de Verificação

### Verificar Layout

- [ ] Container principal não possui `min-h-screen` ou `h-screen`
- [ ] Seção `#pages` não possui altura fixa ou mínima excessiva
- [ ] Não há margens ou padding excessivos no topo
- [ ] Flexbox não está causando expansão indevida
- [ ] Position relative não está empurrando conteúdo para baixo

### Verificar Chart.js

- [ ] Canvas existe no DOM antes de criar gráfico
- [ ] Verificação de `canvas.ownerDocument` antes de usar
- [ ] Gráficos são destruídos antes de navegar para outra página
- [ ] Aguardar DOM estar pronto antes de criar gráficos

### Verificar JavaScript

- [ ] Scripts não aplicam estilos inline problemáticos
- [ ] Não há `setTimeout` ou `setInterval` modificando layout
- [ ] Event listeners são removidos ao desmontar componentes

---

## 📝 Notas Técnicas

- **Arquivo afetado:** `NOVO/public/index.html`
- **Linha suspeita:** 671 (`min-h-screen`)
- **Tecnologia:** Tailwind CSS (via CDN)
- **Impacto:** Visual apenas — funcionalidade não afetada
- **Prioridade:** Média (afeta UX, mas não quebra funcionalidade)

---

## 🎯 Conclusão

O erro percebido **não é de carregamento, API ou falha de renderização**, mas sim um **problema de CSS/layout**, causado por algum container com altura ou margens indevidas.

### Resumo da Causa

- ✅ Conteúdo está sendo renderizado corretamente
- ❌ Container principal possui altura mínima excessiva (`min-h-screen`)
- ❌ Isso empurra o conteúdo para fora da área visível inicial
- ✅ Ajustar propriedades CSS resolverá o problema visual do dashboard

### Próximos Passos

1. Remover ou ajustar `min-h-screen` do container principal
2. Verificar seções de páginas por propriedades de altura excessivas
3. Adicionar verificações de DOM antes de criar gráficos Chart.js
4. Testar em diferentes resoluções de tela
5. Validar que o conteúdo aparece corretamente após ajustes

---

---

## 2. Erros do Console JavaScript

**Data:** 18/12/2025

### ✅ Erros Corrigidos

#### 2.1 ❌ `window.chartCommunication.filters.getAll is not a function`

**Problema:**  
A função `getAll()` não existe no objeto `filters`. O correto é usar `filters.filters` diretamente, que é um array.

**Arquivo:** `NOVO/public/scripts/pages/ouvidoria/tempo-medio.js`

**Correção:**
```javascript
// ANTES (ERRADO):
const globalFilters = window.chartCommunication.filters.getAll() || [];

// DEPOIS (CORRETO):
const globalFilters = window.chartCommunication.filters.filters || [];
```

**Linhas corrigidas:**
- Linha 186: `loadTempoMedio()`
- Linha 1198: `loadSecondaryTempoMedioData()`

---

#### 2.2 ⚠️ `addCrossfilterToChart: gráfico inválido`

**Problema:**  
O gráfico estava sendo passado para `addCrossfilterToChart` antes de estar completamente criado, ou o canvas não estava mais no DOM.

**Arquivo:** `NOVO/public/scripts/pages/ouvidoria/orgao-mes.js`

**Correção:**
1. Adicionar verificação de `ownerDocument` no helper
2. Adicionar `setTimeout` para garantir que o gráfico foi criado completamente

**Arquivo:** `NOVO/public/scripts/utils/crossfilter-helper.js`

**Correção no helper:**
```javascript
// Verificar se o canvas ainda está no DOM
if (!chart.canvas.ownerDocument || !chart.canvas.parentElement) {
  if (window.Logger) {
    window.Logger.warn('addCrossfilterToChart: canvas não está no DOM');
  }
  return;
}
```

**Correção nas páginas:**
```javascript
// Aguardar um pouco para garantir que o gráfico foi criado completamente
if (chart && dataMensal && window.addCrossfilterToChart) {
  setTimeout(() => {
    if (chart && chart.canvas && chart.canvas.ownerDocument) {
      window.addCrossfilterToChart(chart, dataMensal, {
        field: 'month',
        valueField: 'ym',
        onFilterChange: () => {
          if (window.loadOrgaoMes) setTimeout(() => window.loadOrgaoMes(), 100);
        }
      });
    }
  }, 100);
}
```

**Linhas corrigidas:**
- `orgao-mes.js` linha 766-777: `renderOrgaoMesChart()`
- `orgao-mes.js` linha 871-900: `renderTopOrgaosBarChart()`

---

#### 2.3 ⚠️ `Cannot read properties of null (reading 'ownerDocument')`

**Problema:**  
Chart.js tentando acessar `ownerDocument` de um elemento que foi removido do DOM.

**Solução:**  
A verificação adicionada no `crossfilter-helper.js` previne esse erro ao verificar se o canvas ainda está no DOM antes de adicionar event listeners.

---

#### 2.4 ⚠️ `popularSelectMeses: meses não é um array`

**Status:** **JÁ CORRIGIDO** (não é um erro crítico)

**Explicação:**  
Este aviso aparece quando a função `popularSelectMeses` é chamada antes dos dados serem carregados. A função já tem validação para isso e retorna silenciosamente. É um comportamento esperado durante o carregamento inicial.

**Arquivo:** `NOVO/public/scripts/pages/filtros-avancados.js`

**Validação existente:**
```javascript
if (!Array.isArray(meses)) {
  if (window.Logger) {
    window.Logger.warn(`popularSelectMeses: meses não é um array para ${selectId}:`, meses);
  }
  return;
}
```

---

### 📊 Resumo das Correções

| Erro | Status | Arquivo(s) | Linha(s) |
|------|--------|------------|----------|
| `filters.getAll is not a function` | ✅ Corrigido | `tempo-medio.js` | 186, 1198 |
| `addCrossfilterToChart: gráfico inválido` | ✅ Corrigido | `orgao-mes.js`, `crossfilter-helper.js` | 766-777, 871-900, 25-40 |
| `Cannot read properties of null (reading 'ownerDocument')` | ✅ Prevenido | `crossfilter-helper.js` | 33-40 |
| `popularSelectMeses: meses não é um array` | ✅ Já tratado | `filtros-avancados.js` | 289-294 |

---

### 🎯 Resultado

Todos os erros críticos foram corrigidos. Os avisos restantes são esperados durante o carregamento inicial e não afetam a funcionalidade do sistema.

**Status: ✅ TODOS OS ERROS CRÍTICOS CORRIGIDOS**

---

## 3. Duplicatas no Banco de Dados

### 📊 Análise do Problema

#### Problema Identificado
Foram encontradas **154 duplicatas** no banco de dados, onde o mesmo protocolo aparecia múltiplas vezes.

#### Causa Raiz
1. **Normalização Inconsistente de Protocolos**
   - O protocolo era normalizado na função `normalizeRecordData` usando `cleanString` (que faz `trim()`)
   - Mas na busca de registros existentes, apenas `String(record.protocolo)` era usado, sem normalização
   - Isso causava problemas quando protocolos tinham espaços extras ou variações

2. **Falta de Verificação Antes de Inserir**
   - O script não verificava se o protocolo já existia no banco antes de inserir
   - Mesmo com `insertMany` com `ordered: false`, duplicatas podiam ser inseridas se houvesse race conditions

3. **Falta de Índice Único**
   - O campo `protocolo` não tinha índice único, permitindo duplicatas no banco

### ✅ Correções Aplicadas

#### 3.1 Função de Normalização de Protocolo
```javascript
function normalizeProtocolo(protocolo) {
  if (!protocolo) return null;
  // Converter para string, remover espaços extras, trim
  return String(protocolo).trim().replace(/\s+/g, '') || null;
}
```

#### 3.2 Normalização Consistente na Busca
- Agora todos os protocolos são normalizados antes de serem usados nos mapas
- Garante comparação consistente entre planilha e banco

#### 3.3 Verificação Antes de Inserir
- Adicionada verificação dupla antes de inserir:
  1. Verifica se já existe no lote atual (evita duplicatas na planilha)
  2. Verifica se já existe no banco (evita race conditions)

#### 3.4 Índice Único no Campo Protocolo
- Adicionado índice único com `sparse: true` no modelo `Record`
- Previne duplicatas futuras no nível do banco de dados

#### 3.5 Script de Remoção de Duplicatas
- Criado script `removerDuplicatas.js` para limpar duplicatas existentes
- Mantém apenas o registro mais recente de cada protocolo duplicado

### 📋 Scripts Criados

1. **`analisarNovosRegistros.js`** - Analisa novos registros inseridos
2. **`analisarCausaDuplicatas.js`** - Analisa a causa das duplicatas
3. **`removerDuplicatas.js`** - Remove duplicatas existentes
4. **`aplicarIndiceUnicoProtocolo.js`** - Aplica índice único no campo protocolo

### 🔒 Proteções Implementadas

1. **Normalização Consistente**: Todos os protocolos são normalizados da mesma forma
2. **Verificação Dupla**: Verifica duplicatas na planilha E no banco antes de inserir
3. **Índice Único**: Previne duplicatas no nível do banco de dados
4. **Tratamento de Erros**: Captura e trata erros de duplicatas durante inserção

### 📊 Resultado

- ✅ **154 duplicatas removidas** do banco
- ✅ **Índice único aplicado** no campo protocolo
- ✅ **Normalização consistente** implementada
- ✅ **Verificação dupla** antes de inserir
- ✅ **Banco limpo e protegido** contra duplicatas futuras

### 🚀 Próximos Passos

1. Executar `npm run update:sheets` para testar as correções
2. Monitorar logs para garantir que não há mais duplicatas sendo inseridas
3. Executar `removerDuplicatas.js` periodicamente se necessário (mas não deveria ser necessário com o índice único)

### 📝 Notas Técnicas

- O índice único usa `sparse: true` para permitir múltiplos registros com `protocolo: null`
- A normalização remove todos os espaços do protocolo para garantir comparação consistente
- A verificação dupla adiciona uma pequena sobrecarga, mas garante integridade dos dados

---

## 4. Erro ownerDocument no Chart.js

### 📋 Resumo Executivo

O erro:
```
Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
```

Indica que o código está tentando acessar alguma propriedade de um elemento que está **nulo**, ou seja, um elemento que **não existe no momento da execução**.

Esse problema é muito comum em aplicações que usam **Chart.js** ou outras bibliotecas que manipulam o DOM, quando o código tenta manipular ou acessar o DOM antes do elemento existir, ou quando a referência está sendo atribuída no momento errado.

### 🔍 Principais Causas Desse Erro

#### 4.1 Query Selectors Retornando Null

**Exemplo problemático:**
```javascript
const el = document.getElementById('canvas-chart');
el.ownerDocument; // ❌ se el for null → erro
```

**Causa:** O elemento `canvas-chart` não existe no DOM quando o código tenta acessá-lo.

#### 4.2 Canvas Removido do DOM Antes do Chart.js Terminar

**Cenário comum:**
```javascript
const canvas = document.getElementById('chart');
const chart = new Chart(canvas, config); // Chart.js inicia processamento

// Enquanto Chart.js processa internamente...
canvas.remove(); // ❌ Canvas removido do DOM

// Chart.js tenta acessar canvas.ownerDocument → null → erro
```

#### 4.3 Condição de Corrida (Race Condition)

**Problema:**
```javascript
// Verificação passa
const canvas = document.getElementById('chart');
if (canvas) { // ✅ Canvas existe aqui
  // Mas entre esta linha e a próxima, o canvas pode ser removido
  const chart = new Chart(canvas, config); // ❌ Canvas já foi removido
}
```

#### 4.4 Renderização Condicional

O código acessa um elemento que só existe após certa condição:
```javascript
{isOpen && <canvas id="chart"></canvas>}
```

Se o script tentar acessar o canvas antes de `isOpen` ser `true` → `null`.

#### 4.5 Problemas de Layout Causando DOM Quebrado

Como você já enfrenta um problema de layout (container com `min-h-screen`), é possível que algum container esteja retornando `null` porque a estrutura visual está sendo montada de forma incorreta, fazendo com que os canvas fiquem fora do escopo esperado.

#### 4.6 Chart.js Acessando Elementos Internamente

O Chart.js pode tentar acessar `ownerDocument` internamente durante:
- Inicialização do gráfico
- Atualização de dados
- Redimensionamento (resize)
- Destruição do gráfico

Se o canvas foi removido ou não existe, o erro ocorre.

### 🎯 Erro Específico no Projeto

#### Localização do Erro

Baseado nos logs do console:
```
chart.umd.min.js:19  Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
index.umd.ts:50      Uncaught TypeError: Cannot read properties of null (reading 'ownerDocument')
```

O erro está ocorrendo dentro do **Chart.js** (`chart.umd.min.js`) e possivelmente em algum código TypeScript compilado (`index.umd.ts`).

#### Contexto do Erro

Pelos logs, o erro ocorre durante:
1. **Renderização de gráficos** após carregar dados
2. **Navegação entre páginas** (destruição/criação de gráficos)
3. **Carregamento de filtros avançados**

#### Possíveis Pontos de Falha

1. **`chart-factory.js`** — Funções `createBarChart`, `createDoughnutChart`, `createLineChart`
2. **`overview.js`** — Renderização de múltiplos gráficos em paralelo
3. **`global-filters.js`** — Acesso a instâncias do Chart.js via canvas

### ✅ Como Resolver

#### Solução 1: Verificar Canvas Antes de Usar (Já Implementado Parcialmente)

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

#### Solução 2: Aguardar DOM Estar Pronto

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

#### Solução 3: Destruir Gráficos Antes de Remover Canvas

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

#### Solução 4: Usar Try-Catch em Todas as Operações do Chart.js

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

#### Solução 5: Verificar Antes de Acessar Instâncias do Chart.js

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

#### Solução 6: Corrigir Problema de Layout (Relacionado)

Como mencionado na seção "Problemas de Dashboard e Layout" deste documento, o problema de layout pode estar causando canvas fora do escopo esperado.

**Solução:** Corrigir o container principal removendo `min-h-screen`:
```html
<!-- ANTES -->
<div class="min-h-screen grid grid-cols-12 gap-6 p-6">

<!-- DEPOIS -->
<div class="grid grid-cols-12 gap-6 p-6">
```

Isso pode eliminar o erro automaticamente, pois os canvas estarão no local correto do DOM.

### 🧪 Testes para Diagnosticar

#### Teste 1: Verificar Canvas no Console

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

#### Teste 2: Verificar Instâncias do Chart.js

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

#### Teste 3: Monitorar Remoção de Canvas

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

### 📊 Conclusão

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

### 📝 Notas Técnicas

- **Arquivos afetados:**
  - `NOVO/public/scripts/core/chart-factory.js`
  - `NOVO/public/scripts/core/chart-communication/global-filters.js`
  - `NOVO/public/scripts/pages/ouvidoria/overview.js`
  - `NOVO/public/index.html` (layout)

- **Biblioteca:** Chart.js 4.4.3 (via CDN)

- **Impacto:** Erro não quebra funcionalidade, mas polui console e pode causar gráficos não renderizados

- **Prioridade:** Alta (afeta UX e estabilidade)

---

## 5. Configuração Google API

### ✅ VERIFICAÇÃO: Você Salvou as Configurações?

#### 🔍 CHECKLIST RÁPIDO

Olhando na imagem do Google Cloud Console, vejo que os URIs estão configurados, mas preciso confirmar:

#### ❓ Você clicou em "Salvar"?

Na parte inferior da página do Google Cloud Console, há botões:
- **"Salvar"** (azul)
- **"Cancelar"**

**IMPORTANTE:** Você precisa clicar em **"Salvar"** para que as mudanças sejam aplicadas!

#### ⏳ Aguardou a Propagação?

Após salvar, a nota diz:
> "Observação: pode levar de cinco minutos a algumas horas para que as configurações entrem em vigor"

**Solução:** Aguarde pelo menos 2-3 minutos após salvar antes de testar.

---

### ✅ CONFIGURAÇÃO ATUAL (PELA IMAGEM)

Vejo que você tem:

**Origens JavaScript autorizadas:**
- ✅ `http://localhost:3000` (correto)

**URIs de redirecionamento autorizados:**
- ✅ `http://localhost` (correto - este é o que o script usa)
- ✅ `http://localhost:3000/api/notifications/auth/callback` (correto)
- ✅ `http://localhost:3000` (correto)

**Tudo está correto!** ✅

---

### 🚨 SE AINDA DER ERRO APÓS SALVAR

#### 1. Verificar se Salvou

- Volte na página do Google Cloud Console
- Veja se os URIs ainda estão lá
- Se não estiverem, você não salvou - adicione novamente e **SALVE**

#### 2. Aguardar Mais Tempo

- Aguarde 5-10 minutos após salvar
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Tente em modo anônimo/incógnito

#### 3. Verificar o Código Extraído

Quando colar o código, o script deve mostrar:
```
✅ Código extraído: 4/0ATX87lOEy3JDBb6bMKH4yo...
   Tamanho do código: XX caracteres
```

Se não mostrar isso, o código pode estar sendo extraído incorretamente.

#### 4. Testar com Código Limpo

Em vez de colar a URL completa, tente colar **apenas o código**:
```
4/0ATX87lOEy3JDBb6bMKH4yoDuGh09d3Hr4hUcjAkyalSGcB4fK7-pkA61grqENnCqoqN66A
```

(Sem o `http://localhost/?code=` e sem o `&scope=...`)

---

### 🎯 PRÓXIMOS PASSOS

1. ✅ **Confirme que clicou em "Salvar"**
2. ⏳ **Aguarde 2-3 minutos**
3. 🧪 **Teste novamente:** `npm run gmail:auth`
4. 📋 **Cole apenas o código** (sem a URL completa)

Se ainda der erro, me avise e vamos investigar mais!

---

## 📝 Notas Finais

**Documento criado por:** CÉREBRO X-3  
**Última atualização:** 12/12/2025  
**Consolidado de:** 
- `DIAGNOSTICO_COMPLETO_DASHBOARD.md`
- `PROBLEMA_LAYOUT_DASHBOARD.md`
- `CORRECAO_DUPLICATAS.md`
- `CORRECOES_ERROS_CONSOLE.md`
- `ERRO_OWNERDOCUMENT_CHARTJS.md`
- `VERIFICAR_SE_SALVOU.md`

