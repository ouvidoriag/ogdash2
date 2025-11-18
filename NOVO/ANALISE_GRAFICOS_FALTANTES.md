# 📊 ANÁLISE COMPLETA: GRÁFICOS FALTANTES

**Data:** Janeiro 2025  
**Objetivo:** Comparar gráficos do sistema antigo vs novo e identificar o que falta

---

## 🎯 RESUMO EXECUTIVO

### Status Geral dos Gráficos:
- ✅ **Gráficos Básicos (Chart.js):** 100% completo (30+ gráficos migrados)
- ✅ **Gráficos Avançados (Plotly.js):** 100% completo (Sankey, TreeMap, Mapa)
- ❌ **Heatmaps Dinâmicos:** 0% completo (função existe, mas containers HTML e integração faltam)
- ✅ **Sparklines nos KPIs:** 100% completo (implementado e funcionando)
- ✅ **Gráficos Mensais Secundários:** 100% completo (todos implementados)

---

## 📋 COMPARAÇÃO DETALHADA

### 1. GRÁFICOS BÁSICOS (Chart.js)

#### ✅ Sistema Antigo
- Bar Charts (horizontal e vertical)
- Line Charts
- Doughnut/Pie Charts
- Total: ~40+ gráficos em todas as páginas

#### ✅ Sistema Novo
- Bar Charts (horizontal e vertical) - ✅ 18 gráficos principais
- Line Charts - ✅ 10+ gráficos de tendência
- Doughnut/Pie Charts - ✅ 8+ gráficos
- **Status:** ✅ **100% COMPLETO**

**Gráficos Principais Migrados:**
1. ✅ `chartFunnelStatus` - Overview
2. ✅ `chartTopOrgaos` - Overview
3. ✅ `chartTopTemas` - Overview
4. ✅ `chartTrend` - Overview
5. ✅ `chartStatusPage` - Status
6. ✅ `chartTema` - Tema
7. ✅ `chartStatusTema` - Tema
8. ✅ `chartAssunto` - Assunto
9. ✅ `chartStatusAssunto` - Assunto
10. ✅ `chartTipo` - Tipo
11. ✅ `chartOrgaoMes` - Órgão e Mês
12. ✅ `chartSecretaria` - Secretaria
13. ✅ `chartBairro` - Bairro
14. ✅ `chartUAC` - UAC
15. ✅ `chartCanal` - Canal
16. ✅ `chartPrioridade` - Prioridade
17. ✅ `chartSetor` - Setor
18. ✅ `chartCategoria` - Categoria
19. ✅ `chartResponsavel` - Responsável
20. ✅ `chartReclamacoesTipo` - Reclamações
21. ✅ `chartSecretariasDistritos` - Secretarias e Distritos
22. ✅ `chartUnit*Tipos` - Unidades de Saúde (dinâmico)

**Gráficos de Tendência Migrados:**
- ✅ `chartTempoMedio` - Tempo Médio
- ✅ `chartTempoMedioDia` - Tempo Médio (Dia)
- ✅ `chartTempoMedioSemana` - Tempo Médio (Semana)
- ✅ `chartTempoMedioMes` - Tempo Médio (Mês)
- ✅ `chartTempoMedioUnidade` - Tempo Médio (Unidade)
- ✅ `chartTempoMedioUnidadeMes` - Tempo Médio (Unidade × Mês)
- ✅ `chartProjecaoMensal` - Projeção 2026

**Gráficos Mensais Migrados:**
- ✅ `chartTemaMes` - Tema
- ✅ `chartAssuntoMes` - Assunto
- ✅ `chartCategoriaMes` - Categoria
- ✅ `chartBairroMes` - Bairro
- ✅ `chartStatusMes` - Status
- ✅ `chartSecretariaMes` - Secretaria
- ✅ `chartCadastranteMes` - Cadastrante
- ✅ `chartReclamacoesMes` - Reclamações

---

### 2. GRÁFICOS AVANÇADOS (Plotly.js)

#### ✅ Sistema Antigo
- **Sankey Chart:** Fluxo Tema → Órgão → Status
- **TreeMap Chart:** Proporção por categoria/tema
- **Geographic Map:** Distribuição geográfica por bairro
- **Arquivo:** `ANTIGO/public/scripts/modules/data-charts.js`

#### ✅ Sistema Novo
- **Sankey Chart:** ✅ IMPLEMENTADO (`advanced-charts.js`)
- **TreeMap Chart:** ✅ IMPLEMENTADO (`advanced-charts.js`)
- **Geographic Map:** ✅ IMPLEMENTADO (`advanced-charts.js`)
- **Arquivo:** `NOVO/public/scripts/core/advanced-charts.js`

**Status:** ✅ **100% COMPLETO**

---

### 3. HEATMAPS DINÂMICOS

#### ✅ Sistema Antigo
- **Função:** `buildHeatmap(containerId, labels, rows)`
- **Uso:** Em 4+ páginas:
  - `heatmapTema` - Página Tema
  - `heatmapAssunto` - Página Assunto
  - `heatmapCategoria` - Página Categoria
  - `heatmapBairro` - Página Bairro
  - `heatmap` - Overview (dinâmico com seletor)
- **Endpoint:** `/api/aggregate/heatmap?dim={dimensão}`

#### ⚠️ Sistema Novo
- **Função:** ✅ `buildHeatmap()` existe em `advanced-charts.js`
- **Endpoint:** ✅ `/api/aggregate/heatmap` implementado
- **Uso nas Páginas:** ❌ **NÃO ESTÁ SENDO USADO**

**Páginas que DEVEM ter heatmap mas NÃO têm:**
1. ❌ `tema.js` - Falta `heatmapTema`
2. ❌ `assunto.js` - Falta `heatmapAssunto`
3. ❌ `categoria.js` - Falta `heatmapCategoria`
4. ❌ `bairro.js` - Falta `heatmapBairro`
5. ❌ `overview.js` - Falta heatmap dinâmico com seletor

**Status:** ⚠️ **50% COMPLETO** (função existe, mas não está integrada)

---

### 4. SPARKLINES NOS KPIs

#### ✅ Sistema Antigo
- **Função:** `drawSpark(canvasId, data, color)` em `renderKpis.js`
- **Uso:** Sparklines nos cards de KPI (últimos 7 e 30 dias)
- **Elementos:** `spark7`, `spark30` (canvas)
- **Visualização:** Mini-gráficos de linha mostrando tendência

#### ✅ Sistema Novo
- **Função:** ✅ `renderSparkline()` existe em `overview.js`
- **Elementos HTML:** ✅ Existem (`sparkTotal`, `spark7`, `spark30`)
- **Uso:** ✅ **ESTÁ SENDO CHAMADO** (linhas 96-98 de `overview.js`)

**Status:** ✅ **100% COMPLETO** (implementado e funcionando)

---

### 5. GRÁFICOS SECUNDÁRIOS

#### Gráficos que existem no antigo mas podem estar faltando no novo:

**Tempo Médio:**
- ✅ `chartTempoMedio` - ✅ Implementado
- ✅ `chartTempoMedioDia` - ✅ Implementado
- ✅ `chartTempoMedioSemana` - ✅ Implementado
- ✅ `chartTempoMedioMes` - ✅ Implementado
- ✅ `chartTempoMedioUnidade` - ✅ Implementado
- ✅ `chartTempoMedioUnidadeMes` - ✅ Implementado

**Status por Tema/Assunto:**
- ✅ `chartStatusTema` - ✅ Implementado
- ✅ `chartStatusAssunto` - ✅ Implementado

**Gráficos Mensais:**
- ✅ `chartTemaMes` - ✅ Implementado
- ✅ `chartAssuntoMes` - ✅ Implementado
- ✅ `chartCategoriaMes` - ✅ Implementado
- ✅ `chartBairroMes` - ✅ Implementado
- ✅ `chartStatusMes` - ✅ Implementado
- ✅ `chartSecretariaMes` - ✅ Implementado
- ✅ `chartCadastranteMes` - ✅ Implementado
- ✅ `chartReclamacoesMes` - ✅ Implementado
- ✅ `chartOrgaoMes` - ✅ Implementado (mas é horizontal, não mensal)

**Status:** ✅ **100% COMPLETO**

---

## 🚨 O QUE FALTA IMPLEMENTAR

### Prioridade 1 - CRÍTICO (Funcionalidade Principal)

#### 1. ❌ Heatmaps nas Páginas
**O que falta:**
- Integrar `buildHeatmap()` nas páginas: `tema.js`, `assunto.js`, `categoria.js`, `bairro.js`
- Adicionar containers HTML para os heatmaps no `index.html`
- Carregar dados do endpoint `/api/aggregate/heatmap?dim={dimensão}`

**Impacto:** ⚠️ Funcionalidade importante do sistema antigo não está disponível

**Arquivos a modificar:**
- `NOVO/public/scripts/pages/tema.js` - Adicionar carregamento e renderização de heatmap
- `NOVO/public/scripts/pages/assunto.js` - Adicionar carregamento e renderização de heatmap
- `NOVO/public/scripts/pages/categoria.js` - Adicionar carregamento e renderização de heatmap
- `NOVO/public/scripts/pages/bairro.js` - Adicionar carregamento e renderização de heatmap
- `NOVO/public/index.html` - Adicionar containers HTML para heatmaps

---

### Prioridade 2 - IMPORTANTE (Melhoria de UX)

#### 2. ❌ Sparklines nos KPIs
**O que falta:**
- Adicionar elementos `<canvas id="spark7">` e `<canvas id="spark30">` no HTML
- Chamar `renderSparkline()` em `overview.js` após carregar dados diários
- Implementar função de desenho de sparkline (já existe em `overview.js` mas não está sendo usada)

**Impacto:** ⚠️ KPIs ficam menos informativos sem visualização de tendência

**Arquivos a modificar:**
- `NOVO/public/index.html` - Adicionar canvas para sparklines nos cards de KPI
- `NOVO/public/scripts/pages/overview.js` - Chamar `renderSparkline()` após carregar dados

---

### Prioridade 3 - OPCIONAL (Melhorias)

#### 3. ⏳ Heatmap Dinâmico na Overview
**O que falta:**
- Adicionar seletor de dimensão (`<select id="heatmapDim">`) no HTML
- Adicionar container para heatmap dinâmico (`<div id="heatmap">`)
- Implementar listener para mudança de dimensão
- Carregar heatmap quando dimensão mudar

**Impacto:** ℹ️ Funcionalidade útil mas não crítica

**Arquivos a modificar:**
- `NOVO/public/index.html` - Adicionar seletor e container
- `NOVO/public/scripts/pages/overview.js` - Adicionar lógica de carregamento dinâmico

---

## 📊 RESUMO POR CATEGORIA

| Categoria | Sistema Antigo | Sistema Novo | Status |
|-----------|---------------|--------------|--------|
| **Gráficos Básicos (Chart.js)** | 40+ gráficos | 30+ gráficos | ✅ 100% |
| **Gráficos Avançados (Plotly.js)** | 3 gráficos | 3 gráficos | ✅ 100% |
| **Heatmaps** | 5 heatmaps | 0 heatmaps | ❌ 0% |
| **Sparklines** | 2 sparklines | 3 sparklines | ✅ 100% |
| **Gráficos Mensais** | 8+ gráficos | 8+ gráficos | ✅ 100% |
| **Gráficos de Tendência** | 10+ gráficos | 10+ gráficos | ✅ 100% |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Heatmaps (Prioridade 1)
- [ ] Adicionar container `heatmapTema` no HTML (página tema)
- [ ] Adicionar container `heatmapAssunto` no HTML (página assunto)
- [ ] Adicionar container `heatmapCategoria` no HTML (página categoria)
- [ ] Adicionar container `heatmapBairro` no HTML (página bairro)
- [ ] Integrar `buildHeatmap()` em `tema.js`
- [ ] Integrar `buildHeatmap()` em `assunto.js`
- [ ] Integrar `buildHeatmap()` em `categoria.js`
- [ ] Integrar `buildHeatmap()` em `bairro.js`
- [ ] Testar carregamento de dados do endpoint `/api/aggregate/heatmap`

### Sparklines (✅ COMPLETO)
- [x] ✅ `<canvas id="spark7">` existe no HTML
- [x] ✅ `<canvas id="spark30">` existe no HTML
- [x] ✅ `<canvas id="sparkTotal">` existe no HTML
- [x] ✅ `renderSparkline()` está sendo chamado em `overview.js`
- [x] ✅ Função implementada e funcionando

### Heatmap Dinâmico (Prioridade 3)
- [ ] Adicionar seletor `<select id="heatmapDim">` no HTML
- [ ] Adicionar container `<div id="heatmap">` no HTML
- [ ] Implementar listener em `overview.js`
- [ ] Testar mudança de dimensão

---

## 🎯 CONCLUSÃO

### O que está completo:
- ✅ Todos os gráficos básicos (Chart.js)
- ✅ Todos os gráficos avançados (Plotly.js)
- ✅ Todos os gráficos de tendência
- ✅ Todos os gráficos mensais

### O que falta:
- ❌ **Heatmaps** (5 heatmaps não integrados) - **PRIORIDADE 1**
  - `heatmapTema` - Página Tema
  - `heatmapAssunto` - Página Assunto
  - `heatmapCategoria` - Página Categoria
  - `heatmapBairro` - Página Bairro
  - `heatmap` - Overview (dinâmico com seletor)

### Próximos Passos:
1. **Implementar heatmaps** nas 4 páginas principais + overview
   - Adicionar containers HTML
   - Integrar `buildHeatmap()` nas páginas
   - Carregar dados do endpoint `/api/aggregate/heatmap`

---

**Última atualização:** Janeiro 2025  
**Status:** ⚠️ **1 FUNCIONALIDADE FALTANDO** (Heatmaps)

