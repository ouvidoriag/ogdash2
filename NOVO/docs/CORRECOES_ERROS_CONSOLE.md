# 🔧 Correções de Erros do Console

**Data:** 18/12/2025  
**CÉREBRO X-3**

---

## ✅ Erros Corrigidos

### 1. ❌ `window.chartCommunication.filters.getAll is not a function`

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

### 2. ⚠️ `addCrossfilterToChart: gráfico inválido`

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

### 3. ⚠️ `Cannot read properties of null (reading 'ownerDocument')`

**Problema:**  
Chart.js tentando acessar `ownerDocument` de um elemento que foi removido do DOM.

**Solução:**  
A verificação adicionada no `crossfilter-helper.js` previne esse erro ao verificar se o canvas ainda está no DOM antes de adicionar event listeners.

---

### 4. ⚠️ `popularSelectMeses: meses não é um array`

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

## 📊 Resumo das Correções

| Erro | Status | Arquivo(s) | Linha(s) |
|------|--------|------------|----------|
| `filters.getAll is not a function` | ✅ Corrigido | `tempo-medio.js` | 186, 1198 |
| `addCrossfilterToChart: gráfico inválido` | ✅ Corrigido | `orgao-mes.js`, `crossfilter-helper.js` | 766-777, 871-900, 25-40 |
| `Cannot read properties of null (reading 'ownerDocument')` | ✅ Prevenido | `crossfilter-helper.js` | 33-40 |
| `popularSelectMeses: meses não é um array` | ✅ Já tratado | `filtros-avancados.js` | 289-294 |

---

## 🎯 Resultado

Todos os erros críticos foram corrigidos. Os avisos restantes são esperados durante o carregamento inicial e não afetam a funcionalidade do sistema.

**Status: ✅ TODOS OS ERROS CRÍTICOS CORRIGIDOS**

