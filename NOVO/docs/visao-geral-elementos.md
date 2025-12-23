# 📊 Lista Completa de Elementos Visuais - Página Visão Geral

## 1. CARDS DE KPI (Key Performance Indicators)
### 1.1. Total de Manifestações
- **ID do elemento**: `kpiTotal`
- **Tipo**: Número grande com sparkline
- **Sparkline ID**: `sparkTotal`
- **Dados**: `summary.total`
- **Gráfico**: Linha (últimos 12 meses)

### 1.2. Últimos 7 dias
- **ID do elemento**: `kpi7`
- **Tipo**: Número grande com sparkline
- **Sparkline ID**: `spark7`
- **Dados**: `summary.last7`
- **Gráfico**: Linha (últimos 7 dias)

### 1.3. Últimos 30 dias
- **ID do elemento**: `kpi30`
- **Tipo**: Número grande com sparkline
- **Sparkline ID**: `spark30`
- **Dados**: `summary.last30`
- **Gráfico**: Linha (últimos 30 dias)

---

## 2. CARDS DE STATUS ATUAL
### 2.1. Status Overview Cards
- **Container ID**: `statusOverviewCards`
- **Tipo**: Cards de status individuais
- **Dados**: `/api/summary` → `statusCounts`
- **Renderização**: `renderStatusOverview()`

---

## 3. GRÁFICOS DE ANÁLISE TEMPORAL

### 3.1. Tendência Mensal (Line Chart)
- **ID do gráfico**: `chartTrend`
- **Tipo**: Gráfico de linha (Line Chart)
- **Dados**: `byMonth` (últimos 12 meses)
- **Estatísticas exibidas**:
  - Média: `trendMedia`
  - Total: `trendTotal`
  - Máximo: `trendMax`
  - Mínimo: `trendMin`
- **Recursos**: Anotações de picos, crossfilter habilitado

### 3.2. Distribuição Diária (Bar Chart)
- **ID do gráfico**: `chartDailyDistribution`
- **Tipo**: Gráfico de barras (Bar Chart)
- **Dados**: `byDay` (últimos 30 dias)
- **Recursos**: Crossfilter habilitado

---

## 4. GRÁFICOS DE DISTRIBUIÇÃO (Doughnut Charts)

### 4.1. Status (Funnel)
- **ID do gráfico**: `chartFunnelStatus`
- **Tipo**: Gráfico de rosca (Doughnut Chart)
- **Dados**: `manifestationsByStatus`
- **Legenda**: `legendFunnelStatus`
- **Recursos**: Crossfilter habilitado

### 4.2. Tipos de Manifestação
- **ID do gráfico**: `chartTiposManifestacao`
- **Tipo**: Gráfico de rosca (Doughnut Chart)
- **Dados**: `manifestationsByType`
- **Legenda**: `legendTiposManifestacao`
- **Recursos**: Crossfilter habilitado

### 4.3. Canais de Atendimento
- **ID do gráfico**: `chartCanais`
- **Tipo**: Gráfico de rosca (Doughnut Chart)
- **Dados**: `manifestationsByChannel`
- **Legenda**: `legendCanais`
- **Recursos**: Crossfilter habilitado

### 4.4. Prioridades
- **ID do gráfico**: `chartPrioridades`
- **Tipo**: Gráfico de rosca (Doughnut Chart)
- **Dados**: `manifestationsByPriority`
- **Legenda**: `legendPrioridades`
- **Recursos**: Crossfilter habilitado

### 4.5. SLA (Service Level Agreement)
- **ID do gráfico**: `chartSLA`
- **Tipo**: Gráfico de rosca (Doughnut Chart)
- **Dados**: `/api/sla/summary`
- **Legenda**: `legendSLA`
- **Categorias**: Dentro do prazo, Vencido, Crítico

---

## 5. GRÁFICOS DE RANKING (Bar Charts - TOP 5)

### 5.1. Top Órgãos
- **ID do gráfico**: `chartTopOrgaos`
- **Tipo**: Gráfico de barras horizontais (Bar Chart)
- **Dados**: `manifestationsByOrgan` (TOP 5)
- **Info Box**: `infoBoxTopOrgaos`
- **Recursos**: Crossfilter habilitado

### 5.2. Top Temas
- **ID do gráfico**: `chartTopTemas`
- **Tipo**: Gráfico de barras horizontais (Bar Chart)
- **Dados**: `manifestationsByTheme` (TOP 5)
- **Info Box**: `infoBoxTopTemas`
- **Recursos**: Crossfilter habilitado

### 5.3. Unidades de Cadastro
- **ID do gráfico**: `chartUnidadesCadastro`
- **Tipo**: Gráfico de barras horizontais (Bar Chart)
- **Dados**: `manifestationsByUnit` (TOP 5)
- **Info Box**: `infoBoxUnidadesCadastro`
- **Recursos**: Crossfilter habilitado

---

## 6. RESUMO ESTATÍSTICO

### 6.1. Estatísticas da Tendência Mensal
- **Média**: `trendMedia`
- **Total**: `trendTotal`
- **Máximo**: `trendMax`
- **Mínimo**: `trendMin`

---

## 7. FILTROS DISPONÍVEIS

### 7.1. Filtro por Mês
- **ID do select**: `filtroMesOverview`
- **Endpoint para popular**: `/api/aggregate/by-month`
- **Helper**: `PageFiltersHelper.coletarFiltrosMesStatus('Overview')`

### 7.2. Filtro por Status
- **ID do select**: `filtroStatusOverview`
- **Valores**: `concluido`, `em-andamento`, `Todos`
- **Helper**: `PageFiltersHelper.coletarFiltrosMesStatus('Overview')`

---

## 8. ENDPOINTS UTILIZADOS

### 8.1. Dados Principais
- `/api/dashboard-data` - Dados completos do dashboard
- `/api/filter/aggregated` - Dados filtrados e agregados
- `/api/summary` - Resumo com statusCounts
- `/api/sla/summary` - Dados de SLA

### 8.2. Dados Agregados
- `/api/aggregate/by-month` - Dados por mês
- `/api/aggregate/by-day` - Dados por dia
- `/api/aggregate/by-theme` - Dados por tema
- `/api/aggregate/by-organ` - Dados por órgão
- `/api/aggregate/by-status` - Dados por status

---

## 9. FUNÇÕES DE RENDERIZAÇÃO

### 9.1. `renderKPIs(summary, dailyData, byMonth)`
- Renderiza os 3 cards principais de KPI
- Renderiza sparklines nos cards

### 9.2. `renderStatusOverview()`
- Renderiza cards de status individual

### 9.3. `renderMainCharts(summary, byMonth, byDay, byTheme, byOrgan, byType, byChannel, byPriority, byUnit, forceRefresh)`
- Renderiza todos os gráficos principais:
  - chartTrend (tendência mensal)
  - chartFunnelStatus (status)
  - chartDailyDistribution (distribuição diária)
  - chartTopOrgaos (TOP 5 órgãos)
  - chartTopTemas (TOP 5 temas)
  - chartTiposManifestacao (tipos)
  - chartCanais (canais)
  - chartPrioridades (prioridades)
  - chartUnidadesCadastro (unidades)
  - chartSLA (SLA)

---

## 10. TOTAL DE ELEMENTOS VISUAIS

- **3 Cards de KPI** (com sparklines)
- **N Cards de Status** (dinâmicos)
- **11 Gráficos principais**:
  - 1 Line Chart (tendência)
  - 1 Bar Chart (diário)
  - 5 Doughnut Charts (status, tipos, canais, prioridades, SLA)
  - 3 Bar Charts horizontais (órgãos, temas, unidades)
- **3 Sparklines** (nos cards de KPI)
- **Múltiplas legendas e info boxes**

**TOTAL: ~20+ elementos visuais interativos**

