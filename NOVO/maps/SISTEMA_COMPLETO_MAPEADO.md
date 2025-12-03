# 🗺️ MAPEAMENTO COMPLETO DO SISTEMA

**Data de Geração**: 02/12/2025, 16:21:52
**Total de Páginas**: 37
**Total de Sistemas Globais**: 6
**Total de Controllers**: 24

---

## 📋 ÍNDICE

1. [Sistemas Globais](#sistemas-globais)
2. [APIs e Controllers](#apis-e-controllers)
3. [Páginas Detalhadas](#páginas-detalhadas)
4. [Resumo de Gráficos](#resumo-de-gráficos)
5. [Resumo de Cards](#resumo-de-cards)

---

## 🔧 SISTEMAS GLOBAIS

### **dataLoader** - `window.dataLoader`

**Arquivo**: `public\scripts\core\dataLoader.js`
**Descrição**: Sistema de carregamento de dados com cache e deduplicação

**Funções Principais**:
- `getAdaptiveTimeout()`
- `getBackoffDelay()`
- `processQueue()`

### **dataStore** - `window.dataStore`

**Arquivo**: `public\scripts\core\global-store.js`
**Descrição**: Repositório central de dados com cache e reatividade

**Funções Principais**:
- `createDeepCopy()`
- `getEffectiveTTL()`
- `getPersistent()`
- `setPersistent()`
- `clearOldPersistent()`
- `get()`
- `set()`
- `notifyListeners()`
- `subscribe()`
- `clear()`
- `clearPersistent()`
- `invalidate()`
- `getStats()`

### **chartFactory** - `window.chartFactory`

**Arquivo**: `public\scripts\core\chart-factory.js`
**Descrição**: Fábrica de gráficos padronizados (Chart.js)

**Funções Principais**:
- `darkenHexColor()`
- `getColorPalette()`
- `getColorFromPalette()`
- `getColorWithAlpha()`
- `isLightMode()`
- `getHighlightedColor()`
- `highlightChartElement()`
- `getChartDefaults()`
- `ensureChartJS()`
- `createBarChart()`
- `createLineChart()`
- `createDoughnutChart()`
- `updateChart()`
- `createReactiveChart()`
- `destroyChartSafely()`
- `destroyCharts()`

### **chartCommunication** - `window.chartCommunication`

**Arquivo**: `public\scripts\core\chart-communication.js`
**Descrição**: Sistema de comunicação entre gráficos e filtros globais

**Funções Principais**:

### **advancedCharts** - `window.advancedCharts`

**Arquivo**: `public\scripts\core\advanced-charts.js`
**Descrição**: Gráficos avançados com Plotly.js (Sankey, TreeMap, etc)

**Funções Principais**:
- `ensurePlotly()`
- `loadAdvancedCharts()`
- `loadSankeyChart()`
- `loadTreeMapChart()`
- `loadGeographicMap()`
- `buildHeatmap()`

### **config** - `window.config`

**Arquivo**: `public\scripts\core\config.js`
**Descrição**: Configurações globais do sistema

**Funções Principais**:
- `getFieldLabel()`
- `buildEndpoint()`
- `isLightMode()`
- `getColorByTipoManifestacao()`

---

## 🌐 APIs E CONTROLLERS

### **aggregateController.js**

**Arquivo**: `src\api\controllers\aggregateController.js`

**Endpoints**:
- `countBy()`
- `timeSeries()`
- `byTheme()`
- `bySubject()`
- `byServer()`
- `byMonth()`
- `byDay()`
- `heatmap()`
- `filtered()`
- `sankeyFlow()`
- `countByStatusMes()`
- `countByOrgaoMes()`
- `byDistrict()`

### **aiController.js**

**Arquivo**: `src\api\controllers\aiController.js`

**Endpoints**:
- `getInsights()`

### **authController.js**

**Arquivo**: `src\api\controllers\authController.js`

**Endpoints**:
- `login()`
- `logout()`
- `getCurrentUser()`

### **batchController.js**

**Arquivo**: `src\api\controllers\batchController.js`

**Endpoints**:
- `batch()`
- `listEndpoints()`

### **cacheController.js**

**Arquivo**: `src\api\controllers\cacheController.js`

**Endpoints**:
- `getCacheStatus()`
- `rebuildCache()`
- `cleanExpired()`
- `clearAll()`
- `clearMemory()`
- `getUniversal()`

### **chatController.js**

**Arquivo**: `src\api\controllers\chatController.js`

**Endpoints**:
- `getMessages()`
- `createMessage()`

### **colabController.js**

**Arquivo**: `src\api\controllers\colabController.js`

**Endpoints**:
- `getCategories()`
- `getPosts()`
- `getPostById()`
- `createPost()`
- `acceptPost()`
- `rejectPost()`
- `solvePost()`
- `createComment()`
- `getComments()`
- `getEventById()`
- `acceptEvent()`
- `solveEvent()`
- `receiveWebhook()`

### **complaintsController.js**

**Arquivo**: `src\api\controllers\complaintsController.js`

**Endpoints**:
- `getComplaints()`

### **dashboardController.js**

**Arquivo**: `src\api\controllers\dashboardController.js`

**Endpoints**:
- `getDashboardData()`

### **distinctController.js**

**Arquivo**: `src\api\controllers\distinctController.js`

**Endpoints**:
- `getDistinct()`

### **filterController.js**

**Arquivo**: `src\api\controllers\filterController.js`

**Endpoints**:
- `filterRecords()`

### **geographicController.js**

**Arquivo**: `src\api\controllers\geographicController.js`

**Endpoints**:
- `getSecretarias()`
- `getSecretariasByDistrict()`
- `getDistritos()`
- `getDistritoByCode()`
- `getBairros()`
- `getUnidadesSaude()`
- `getUnidadesSaudeByDistrito()`
- `getUnidadesSaudeByBairro()`
- `getUnidadesSaudeByTipo()`
- `aggregateByDistrict()`
- `getDistritoStats()`
- `debugDistrictMapping()`
- `debugDistrictMappingBatch()`
- `getSaudeManifestacoes()`
- `getSaudePorDistrito()`
- `getSaudePorTema()`
- `getSaudePorUnidade()`

### **metricsController.js**

**Arquivo**: `src\api\controllers\metricsController.js`

**Endpoints**:
- `getMetrics()`
- `resetMetrics()`

### **notificacoesController.js**

**Arquivo**: `src\api\controllers\notificacoesController.js`

**Endpoints**:
- `getNotificacoes()`
- `getNotificacoesStats()`
- `getUltimaExecucao()`
- `buscarVencimentos()`
- `enviarSelecionados()`

### **notificationController.js**

**Arquivo**: `src\api\controllers\notificationController.js`

**Endpoints**:
- `getAuthUrlEndpoint()`
- `authCallback()`
- `getAuthStatus()`
- `executeNotifications()`
- `getNotificationHistory()`
- `getNotificationStats()`
- `getEmailConfig()`
- `getSchedulerStatus()`
- `executeSchedulerManual()`
- `testEmail()`

### **recordsController.js**

**Arquivo**: `src\api\controllers\recordsController.js`

**Endpoints**:
- `getRecords()`

### **secretariaInfoController.js**

**Arquivo**: `src\api\controllers\secretariaInfoController.js`

**Endpoints**:
- `getSecretariasInfo()`
- `getSecretariaInfoById()`

### **slaController.js**

**Arquivo**: `src\api\controllers\slaController.js`

**Endpoints**:
- `slaSummary()`

### **statsController.js**

**Arquivo**: `src\api\controllers\statsController.js`

**Endpoints**:
- `averageTime()`
- `averageTimeByDay()`
- `averageTimeByWeek()`
- `averageTimeByMonth()`
- `averageTimeStats()`
- `averageTimeByUnit()`
- `averageTimeByMonthUnit()`
- `statusOverview()`

### **summaryController.js**

**Arquivo**: `src\api\controllers\summaryController.js`

**Endpoints**:
- `getSummary()`

### **unitController.js**

**Arquivo**: `src\api\controllers\unitController.js`

**Endpoints**:
- `getUnit()`

### **utilsController.js**

**Arquivo**: `src\api\controllers\utilsController.js`

**Endpoints**:
- `getMetaAliases()`
- `reindexChat()`
- `exportDatabase()`

### **vencimentoController.js**

**Arquivo**: `src\api\controllers\vencimentoController.js`

**Endpoints**:
- `getVencimento()`

### **zeladoriaController.js**

**Arquivo**: `src\api\controllers\zeladoriaController.js`

**Endpoints**:
- `summary()`
- `countBy()`
- `byMonth()`
- `timeSeries()`
- `records()`
- `stats()`
- `byStatusMonth()`
- `byCategoriaDepartamento()`
- `geographic()`

---

## 📄 PÁGINAS DETALHADAS

### 📁 PAGE

#### **filtros-avancados**

**Arquivo**: `public\scripts\pages\filtros-avancados.js`

**APIs Utilizadas** (4):
- `/api/filter`
- `/api/distinct?field=${encodeURIComponent(field)}`,`
- `/api/distinct?field=${encodeURIComponent(field)}`;`
- `/api/summary`

**Cards/Elementos** (27):
- `totalProtocolos`
- `TotalProtocolos`
- `totalFiltradosEl`
- `totalProtocolosFiltrados`
- `page-filtros-avancados`
- `resultadosFiltros`
- `totalProtocolos`
- `btnAplicarFiltros`
- `btnLimparTodos`
- `toggleFiltros`
- `filtroProtocolo`
- `filtroStatusDemanda`
- `filtroUnidadeCadastro`
- `filtroCanal`
- `filtroServidor`
- `filtroTipoManifestacao`
- `filtroTema`
- `filtroPrioridade`
- `filtroUnidadeSaude`
- `filtroDataCriacaoInicial`

**Sistemas Globais Usados**: dataLoader, dataStore, chartCommunication, Logger

**Funções Principais** (23):
- `loadFiltrosAvancados()`
- `initializeFilters()`
- `loadFilterOptions()`
- `loadDistinctValues()`
- `populateSelect()`
- `loadTotalProtocolos()`
- `updateTotalProtocolos()`
- `setupEventListeners()`
- `collectFilters()`
- `applyFilters()`

---

#### **assunto**

**Arquivo**: `public\scripts\pages\ouvidoria\assunto.js`

**APIs Utilizadas** (3):
- `/api/aggregate/by-subject`
- `/api/aggregate/count-by-status-mes?field=Assunto`
- `/api/dashboard-data`

**Gráficos** (3):
- `chartAssunto`
- `chartAssuntoMes`
- `chartStatusAssunto`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalAssunto`
- `kpiUnicos`
- `kpiAssuntosUnicos`
- `kpiMedia`
- `kpiMediaAssunto`
- `kpiMaisComum`
- `kpiAssuntoMaisComum`
- `TotalAssunto`
- `page-assunto`
- `kpiTotalAssunto`
- `kpiAssuntosUnicos`
- `kpiMediaAssunto`
- `kpiAssuntoMaisComum`
- `listaAssuntos`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (7):
- `loadAssunto()`
- `initAssuntoFilterListeners()`
- `renderAssuntoChart()`
- `renderStatusAssuntoChart()`
- `renderAssuntoMesChart()`
- `updateAssuntoKPIs()`
- `renderAssuntosList()`

---

#### **bairro**

**Arquivo**: `public\scripts\pages\ouvidoria\bairro.js`

**APIs Utilizadas** (2):
- `/api/aggregate/count-by?field=Bairro`
- `/api/aggregate/count-by-status-mes?field=Bairro`

**Gráficos** (2):
- `chartBairro`
- `chartBairroMes`

**Cards/Elementos** (15):
- `KPIs`
- `kpiTotal`
- `kpiTotalBairro`
- `kpiUnicos`
- `kpiBairrosUnicos`
- `kpiMedia`
- `kpiMediaBairro`
- `kpiMaisAtivo`
- `kpiBairroMaisAtivo`
- `TotalBairro`
- `page-bairro`
- `kpiTotalBairro`
- `kpiBairrosUnicos`
- `kpiMediaBairro`
- `kpiBairroMaisAtivo`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (3):
- `loadBairro()`
- `renderBairroMesChart()`
- `updateBairroKPIs()`

---

#### **cadastrante**

**Arquivo**: `public\scripts\pages\ouvidoria\cadastrante.js`

**APIs Utilizadas** (4):
- `/api/aggregate/by-server`
- `/api/aggregate/count-by?field=UAC`
- `/api/aggregate/by-month`
- `/api/summary`

**Gráficos** (1):
- `chartCadastranteMes`

**Cards/Elementos** (20):
- `KPIs`
- `kpiTotal`
- `kpiTotalCadastrante`
- `kpiServidores`
- `kpiServidoresUnicos`
- `kpiUnidades`
- `kpiUnidadesUnicas`
- `kpiMaisAtivo`
- `kpiServidorMaisAtivo`
- `totalEl`
- `totalCadastrante`
- `TotalCadastrante`
- `page-cadastrante`
- `totalCadastrante`
- `listaServidores`
- `listaUnidadesCadastro`
- `kpiTotalCadastrante`
- `kpiServidoresUnicos`
- `kpiUnidadesUnicas`
- `kpiServidorMaisAtivo`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (5):
- `loadCadastrante()`
- `renderServidoresList()`
- `renderUnidadesList()`
- `updateCadastranteKPIs()`
- `renderCadastranteMesChart()`

---

#### **canal**

**Arquivo**: `public\scripts\pages\ouvidoria\canal.js`

**APIs Utilizadas** (1):
- `/api/aggregate/count-by?field=Canal`

**Gráficos** (1):
- `chartCanal`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalCanal`
- `kpiUnicos`
- `kpiCanaisUnicos`
- `kpiMedia`
- `kpiMediaCanal`
- `kpiMaisUsado`
- `kpiCanalMaisUsado`
- `TotalCanal`
- `page-canal`
- `rankCanal`
- `kpiTotalCanal`
- `kpiCanaisUnicos`
- `kpiMediaCanal`
- `kpiCanalMaisUsado`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (2):
- `loadCanal()`
- `updateCanalKPIs()`

---

#### **categoria**

**Arquivo**: `public\scripts\pages\ouvidoria\categoria.js`

**APIs Utilizadas** (2):
- `/api/aggregate/count-by?field=Categoria`
- `/api/aggregate/count-by-status-mes?field=Categoria`

**Gráficos** (2):
- `chartCategoria`
- `chartCategoriaMes`

**Cards/Elementos** (15):
- `KPIs`
- `kpiTotal`
- `kpiTotalCategoria`
- `kpiUnicas`
- `kpiCategoriasUnicas`
- `kpiMedia`
- `kpiMediaCategoria`
- `kpiMaisComum`
- `kpiCategoriaMaisComum`
- `TotalCategoria`
- `page-categoria`
- `kpiTotalCategoria`
- `kpiCategoriasUnicas`
- `kpiMediaCategoria`
- `kpiCategoriaMaisComum`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (3):
- `loadCategoria()`
- `renderCategoriaMesChart()`
- `updateCategoriaKPIs()`

---

#### **cora-chat**

**Arquivo**: `public\scripts\pages\ouvidoria\cora-chat.js`

**APIs Utilizadas** (1):
- `/api/chat/messages`

**Cards/Elementos** (5):
- `page-cora-chat`
- `chatMessages`
- `chatInput`
- `chatForm`
- `chatSubmitBtn`

**Sistemas Globais Usados**: Logger

**Funções Principais** (6):
- `loadCoraChat()`
- `loadChatMessages()`
- `formatChatTime()`
- `renderMessages()`
- `sendMessage()`
- `initChatPage()`

---

#### **notificacoes**

**Arquivo**: `public\scripts\pages\ouvidoria\notificacoes.js`

**APIs Utilizadas** (7):
- `/api/notificacoes?limit=50`
- `/api/notificacoes/stats`
- `/api/notificacoes/ultima-execucao`
- `/api/notificacoes/enviar-selecionados`
- `/api/notificacoes?${params.toString()}&limit=50`,`
- `/api/notificacoes?page=${page}&limit=50`,`
- `/api/notificacoes/vencimentos?tipo=${tipo}`,`

**Gráficos** (1):
- `notificacoes-chart-tipo`

**Cards/Elementos** (36):
- `Cards`
- `cardTotal`
- `cardHoje`
- `cardErros`
- `cardUltimaExec`
- `totalEnviados`
- `totalErros`
- `totalPages`
- `totalProtocolos`
- `totalSecretarias`
- `page-notificacoes`
- `notificacoes-total`
- `notificacoes-hoje`
- `notificacoes-erros`
- `notificacoes-ultima-exec`
- `notificacoes-resumo-hoje`
- `notificacoes-table-body`
- `notificacoes-paginacao`
- `notificacoes-filtro-tipo`
- `notificacoes-filtro-secretaria`

**Sistemas Globais Usados**: dataLoader, chartFactory, Logger

**Funções Principais** (13):
- `loadNotificacoes()`
- `renderStats()`
- `renderNotificacoes()`
- `setupFilters()`
- `aplicarFiltros()`
- `carregarNotificacoesPagina()`
- `showError()`
- `setupControleManual()`
- `carregarVencimentos()`
- `renderPainelVencimentos()`

---

#### **orgao-mes**

**Arquivo**: `public\scripts\pages\ouvidoria\orgao-mes.js`

**APIs Utilizadas** (5):
- `/api/aggregate/count-by?field=Orgaos`
- `/api/aggregate/by-month`
- `/api/filter`
- `/api/distinct?field=${encodeURIComponent(field)}`,`
- `/api/distinct?field=${encodeURIComponent(field)}`;`

**Gráficos** (2):
- `chartOrgaoMes`
- `chartTopOrgaosBar`

**Cards/Elementos** (33):
- `KPIs`
- `kpiTotalEl`
- `kpiTotalOrgaos`
- `kpiUnicosEl`
- `kpiOrgaosUnicos`
- `kpiMediaEl`
- `kpiMediaOrgao`
- `kpiPeriodoEl`
- `kpiPeriodo`
- `totalOrgaos`
- `totalMeses`
- `totalEl`
- `TotalEl`
- `TotalOrgaos`
- `informado`
- `infoMensal`
- `informa`
- `page-orgao-mes`
- `searchOrgaos`
- `sortMode`

**Sistemas Globais Usados**: dataLoader, dataStore, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (15):
- `extractFieldValue()`
- `extractDataCriacao()`
- `aggregateFilteredData()`
- `loadOrgaoMes()`
- `renderOrgaosList()`
- `renderOrgaoMesChart()`
- `renderTopOrgaosBarChart()`
- `updateKPIs()`
- `initOrgaoMesFilterListeners()`
- `toggleSortOrgaos()`

---

#### **overview**

**Arquivo**: `public\scripts\pages\ouvidoria\overview.js`

**APIs Utilizadas** (5):
- `/api/dashboard-data`
- `/api/sla/summary`
- `/api/ai/insights`
- `/api/filter`
- `/api/summary`

**Gráficos** (10):
- `chartDailyDistribution`
- `chartTopOrgaos`
- `chartTopTemas`
- `chartUnidadesCadastro`
- `chartTrend`
- `chartFunnelStatus`
- `chartTiposManifestacao`
- `chartCanais`
- `chartPrioridades`
- `chartSLA`

**Cards/Elementos** (38):
- `KPIs`
- `kpiTotal`
- `kpi7`
- `kpi30`
- `kpiTotalContainer`
- `kpi7Container`
- `kpi30Container`
- `KPIsVisualState`
- `totalManifestations`
- `TotalContainer`
- `TotalEl`
- `totalStatus`
- `totalRows`
- `informa`
- `InfoEl`
- `page-main`
- `overview-loading`
- `kpiTotal`
- `kpi7`
- `kpi30`

**Sistemas Globais Usados**: dataLoader, dataStore, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (11):
- `loadOverview()`
- `renderKPIs()`
- `updateKPIsVisualState()`
- `renderSparkline()`
- `renderMainCharts()`
- `renderSLAChart()`
- `addPeakAnnotations()`
- `loadAIInsights()`
- `calculateSLAFromRows()`
- `aggregateFilteredData()`

---

#### **prioridade**

**Arquivo**: `public\scripts\pages\ouvidoria\prioridade.js`

**APIs Utilizadas** (1):
- `/api/aggregate/count-by?field=Prioridade`

**Gráficos** (1):
- `chartPrioridade`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalPrioridade`
- `kpiUnicas`
- `kpiPrioridadesUnicas`
- `kpiMedia`
- `kpiMediaPrioridade`
- `kpiMaisComum`
- `kpiPrioridadeMaisComum`
- `TotalPrioridade`
- `page-prioridade`
- `rankPrioridade`
- `kpiTotalPrioridade`
- `kpiPrioridadesUnicas`
- `kpiMediaPrioridade`
- `kpiPrioridadeMaisComum`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (2):
- `loadPrioridade()`
- `updatePrioridadeKPIs()`

---

#### **projecao-2026**

**Arquivo**: `public\scripts\pages\ouvidoria\projecao-2026.js`

**APIs Utilizadas** (3):
- `/api/aggregate/by-month`
- `/api/aggregate/by-theme`
- `/api/dashboard-data`

**Gráficos** (6):
- `chartCrescimentoPercentual`
- `chartSazonalidade`
- `chartProjecaoTema`
- `chartProjecaoMensal`
- `chartComparacaoAnual`
- `chartProjecaoTipo`

**Cards/Elementos** (18):
- `KPIs`
- `kpisContainer`
- `kpisProjecao`
- `totalHistorico`
- `totalProjetado`
- `totalHistoricoEl`
- `totalProjetadoEl`
- `informativos`
- `page-projecao-2026`
- `totalHistorico`
- `totalProjetado`
- `mediaMensal`
- `crescimentoAnual`
- `tendencia`
- `kpisProjecao`
- `listaTemasProjecao`
- `listaTiposProjecao`
- `listaOrgaosProjecao`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (14):
- `loadProjecao2026()`
- `calcularTendenciaESazonalidade()`
- `gerarProjecao2026()`
- `renderProjecaoChart()`
- `renderCrescimentoPercentual()`
- `renderComparacaoAnual()`
- `renderSazonalidade()`
- `renderProjecaoPorTema()`
- `renderProjecaoPorTipo()`
- `renderEstatisticas()`

---

#### **reclamacoes**

**Arquivo**: `public\scripts\pages\ouvidoria\reclamacoes.js`

**APIs Utilizadas** (2):
- `/api/complaints-denunciations`
- `/api/aggregate/by-month`

**Gráficos** (2):
- `chartReclamacoesTipo`
- `chartReclamacoesMes`

**Cards/Elementos** (19):
- `KPIs`
- `kpiTotal`
- `kpiTotalReclamacoes`
- `kpiDenuncias`
- `kpiTotalDenuncias`
- `kpiAssuntos`
- `kpiAssuntosUnicos`
- `kpiMaisComum`
- `kpiAssuntoMaisComum`
- `totalReclamacoes`
- `totalDenuncias`
- `TotalReclamacoes`
- `TotalDenuncias`
- `page-reclamacoes`
- `listaReclamacoes`
- `kpiTotalReclamacoes`
- `kpiTotalDenuncias`
- `kpiAssuntosUnicos`
- `kpiAssuntoMaisComum`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (5):
- `loadReclamacoes()`
- `renderReclamacoesAssuntosList()`
- `renderTiposChart()`
- `updateReclamacoesKPIs()`
- `renderReclamacoesMesChart()`

---

#### **responsavel**

**Arquivo**: `public\scripts\pages\ouvidoria\responsavel.js`

**APIs Utilizadas** (1):
- `/api/aggregate/count-by?field=Responsavel`

**Gráficos** (1):
- `chartResponsavel`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalResponsavel`
- `kpiUnicos`
- `kpiResponsaveisUnicos`
- `kpiMedia`
- `kpiMediaResponsavel`
- `kpiMaisAtivo`
- `kpiResponsavelMaisAtivo`
- `TotalResponsavel`
- `page-responsavel`
- `rankResponsavel`
- `kpiTotalResponsavel`
- `kpiResponsaveisUnicos`
- `kpiMediaResponsavel`
- `kpiResponsavelMaisAtivo`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (2):
- `loadResponsavel()`
- `updateResponsavelKPIs()`

---

#### **secretaria**

**Arquivo**: `public\scripts\pages\ouvidoria\secretaria.js`

**APIs Utilizadas** (2):
- `/api/aggregate/count-by?field=Secretaria`
- `/api/aggregate/by-month`

**Gráficos** (2):
- `chartSecretaria`
- `chartSecretariaMes`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalSecretaria`
- `kpiUnicas`
- `kpiSecretariasUnicas`
- `kpiMedia`
- `kpiMediaSecretaria`
- `kpiMaisAtiva`
- `kpiSecretariaMaisAtiva`
- `TotalSecretaria`
- `page-secretaria`
- `rankSecretaria`
- `kpiTotalSecretaria`
- `kpiSecretariasUnicas`
- `kpiMediaSecretaria`
- `kpiSecretariaMaisAtiva`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (2):
- `loadSecretaria()`
- `updateSecretariaKPIs()`

---

#### **secretarias-distritos**

**Arquivo**: `public\scripts\pages\ouvidoria\secretarias-distritos.js`

**APIs Utilizadas** (1):
- `/api/distritos`

**Gráficos** (1):
- `chartSecretariasDistritos`

**Cards/Elementos** (24):
- `KPIs`
- `kpiSecretarias`
- `kpiTotalSecretariasDistritos`
- `kpiDistritos`
- `kpiTotalDistritos`
- `kpiBairros`
- `kpiTotalBairros`
- `kpiMedia`
- `kpiMediaSecretariasDistrito`
- `totalSecretarias`
- `totalDistritos`
- `totalBairros`
- `TotalSecretariasDistritos`
- `TotalDistritos`
- `TotalBairros`
- `page-secretarias-distritos`
- `listaDistritos`
- `estatisticasDistritos`
- `chartSecretariasDistritos`
- `distritoSelecionadoNome`

**Sistemas Globais Usados**: dataLoader, dataStore, chartFactory, chartCommunication, Logger

**Funções Principais** (5):
- `loadSecretariasDistritos()`
- `renderDistritosList()`
- `renderDistritosEstatisticas()`
- `renderSecretariasDistritosChart()`
- `updateSecretariasDistritosKPIs()`

---

#### **setor**

**Arquivo**: `public\scripts\pages\ouvidoria\setor.js`

**APIs Utilizadas** (1):
- `/api/aggregate/count-by?field=Setor`

**Gráficos** (1):
- `chartSetor`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalSetor`
- `kpiUnicos`
- `kpiSetoresUnicos`
- `kpiMedia`
- `kpiMediaSetor`
- `kpiMaisAtivo`
- `kpiSetorMaisAtivo`
- `TotalSetor`
- `page-setor`
- `rankSetor`
- `kpiTotalSetor`
- `kpiSetoresUnicos`
- `kpiMediaSetor`
- `kpiSetorMaisAtivo`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (2):
- `loadSetor()`
- `updateSetorKPIs()`

---

#### **status**

**Arquivo**: `public\scripts\pages\ouvidoria\status.js`

**APIs Utilizadas** (2):
- `/api/aggregate/count-by?field=Status`
- `/api/aggregate/count-by-status-mes?field=Status`

**Gráficos** (2):
- `chartStatusMes`
- `chartStatusPage`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalStatus`
- `kpiUnicos`
- `kpiStatusUnicos`
- `kpiMaisComum`
- `kpiStatusMaisComum`
- `kpiTaxa`
- `kpiTaxaConclusao`
- `TotalStatus`
- `page-status`
- `chartStatusMes`
- `kpiTotalStatus`
- `kpiStatusUnicos`
- `kpiStatusMaisComum`
- `kpiTaxaConclusao`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (4):
- `loadStatusPage()`
- `initStatusFilterListeners()`
- `renderStatusMesChart()`
- `updateStatusKPIs()`

---

#### **tema**

**Arquivo**: `public\scripts\pages\ouvidoria\tema.js`

**APIs Utilizadas** (3):
- `/api/aggregate/by-theme`
- `/api/aggregate/count-by-status-mes?field=Tema`
- `/api/dashboard-data`

**Gráficos** (3):
- `chartTema`
- `chartTemaMes`
- `chartStatusTema`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalTema`
- `kpiUnicos`
- `kpiTemasUnicos`
- `kpiMedia`
- `kpiMediaTema`
- `kpiMaisComum`
- `kpiTemaMaisComum`
- `TotalTema`
- `page-tema`
- `kpiTotalTema`
- `kpiTemasUnicos`
- `kpiMediaTema`
- `kpiTemaMaisComum`
- `listaTemas`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (7):
- `loadTema()`
- `initTemaFilterListeners()`
- `renderTemaChart()`
- `renderStatusTemaChart()`
- `renderTemaMesChart()`
- `updateTemaKPIs()`
- `renderTemasList()`

---

#### **tempo-medio**

**Arquivo**: `public\scripts\pages\ouvidoria\tempo-medio.js`

**APIs Utilizadas** (14):
- `/api/stats/average-time/by-month`
- `/api/stats/average-time/stats?meses=${encodeURIComponent(mesSelecionado)}``
- `/api/stats/average-time/stats`
- `/api/stats/average-time/stats?meses=${encodeURIComponent(novoMes)}``
- `/api/stats/average-time?meses=${encodeURIComponent(mesSelecionado)}``
- `/api/stats/average-time`
- `/api/stats/average-time/by-day?meses=${encodeURIComponent(mesSelecionado)}``
- `/api/stats/average-time/by-day`
- `/api/stats/average-time/by-week?meses=${encodeURIComponent(mesSelecionado)}``
- `/api/stats/average-time/by-week`
- `/api/stats/average-time/by-unit?meses=${encodeURIComponent(mesSelecionado)}``
- `/api/stats/average-time/by-unit`
- `/api/stats/average-time/by-month-unit?meses=${encodeURIComponent(mesSelecionado)}``
- `/api/stats/average-time/by-month-unit`

**Gráficos** (6):
- `chartTempoMedio`
- `chartTempoMedioUnidade`
- `chartTempoMedioMes`
- `chartTempoMedioDia`
- `chartTempoMedioSemana`
- `chartTempoMedioUnidadeMes`

**Cards/Elementos** (10):
- `cards`
- `Cards`
- `page-tempo-medio`
- `selectMesTempoMedio`
- `tempoMedioLoading`
- `statMedia`
- `statMediana`
- `statMinimo`
- `statMaximo`
- `listaTempoMedio`

**Sistemas Globais Usados**: dataLoader, dataStore, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (8):
- `destroyChartSafely()`
- `destroyAllTempoMedioCharts()`
- `loadTempoMedio()`
- `popularDropdownMeses()`
- `renderTempoMedioStats()`
- `renderTempoMedioCharts()`
- `renderTempoMedioRanking()`
- `loadSecondaryTempoMedioData()`

---

#### **tipo**

**Arquivo**: `public\scripts\pages\ouvidoria\tipo.js`

**APIs Utilizadas** (1):
- `/api/aggregate/count-by?field=Tipo`

**Gráficos** (1):
- `chartTipo`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalTipo`
- `kpiUnicos`
- `kpiTiposUnicos`
- `kpiMedia`
- `kpiMediaTipo`
- `kpiMaisComum`
- `kpiTipoMaisComum`
- `TotalTipo`
- `page-tipo`
- `rankTipo`
- `kpiTotalTipo`
- `kpiTiposUnicos`
- `kpiMediaTipo`
- `kpiTipoMaisComum`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, config

**Funções Principais** (2):
- `loadTipo()`
- `updateTipoKPIs()`

---

#### **uac**

**Arquivo**: `public\scripts\pages\ouvidoria\uac.js`

**APIs Utilizadas** (1):
- `/api/aggregate/count-by?field=UAC`

**Gráficos** (1):
- `chartUAC`

**Cards/Elementos** (16):
- `KPIs`
- `kpiTotal`
- `kpiTotalUAC`
- `kpiUnicas`
- `kpiUACsUnicas`
- `kpiMedia`
- `kpiMediaUAC`
- `kpiMaisAtiva`
- `kpiUACMaisAtiva`
- `TotalUAC`
- `page-uac`
- `rankUAC`
- `kpiTotalUAC`
- `kpiUACsUnicas`
- `kpiMediaUAC`
- `kpiUACMaisAtiva`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (2):
- `loadUAC()`
- `updateUACKPIs()`

---

#### **unidades-saude**

**Arquivo**: `public\scripts\pages\ouvidoria\unidades-saude.js`

**APIs Utilizadas** (1):
- `/api/unit/${encodeURIComponent(unidade.busca)}`,`

**Cards/Elementos** (19):
- `KPIs`
- `kpiTotal`
- `kpiTotalUnidadeSaude`
- `kpiAssuntos`
- `kpiAssuntosUnicosUnidade`
- `kpiTipos`
- `kpiTiposUnicosUnidade`
- `kpiMaisComum`
- `kpiAssuntoMaisComumUnidade`
- `TotalUnidadeSaude`
- `page-unidades-saude`
- `selectUnidade`
- `unidadeConteudo`
- `unidadeAssuntos`
- `unidadeTiposChart`
- `kpiTotalUnidadeSaude`
- `kpiAssuntosUnicosUnidade`
- `kpiTiposUnicosUnidade`
- `kpiAssuntoMaisComumUnidade`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (8):
- `loadUnidadesSaude()`
- `popularDropdown()`
- `mostrarMensagemSelecao()`
- `carregarDadosUnidade()`
- `renderUnidadeAssuntosList()`
- `renderUnidadeTiposChart()`
- `initUnidadesSaudeFilterListeners()`
- `updateUnidadesSaudeKPIs()`

---

#### **unit**

**Arquivo**: `public\scripts\pages\ouvidoria\unit.js`

**APIs Utilizadas** (1):
- `/api/unit/${encodeURIComponent(searchName)}`,`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (3):
- `loadUnit()`
- `renderUnitAssuntosList()`
- `renderUnitTiposChart()`

---

#### **vencimento**

**Arquivo**: `public\scripts\pages\ouvidoria\vencimento.js`

**APIs Utilizadas** (4):
- `/api/distinct?field=Secretaria`
- `/api/secretarias`
- `/api/vencimento?filtro=${encodeURIComponent(filtro)}`;`
- `/api/vencimento?filtro=${encodeURIComponent(filtroAtual)}`;`

**Cards/Elementos** (20):
- `KPIs`
- `kpiTotal`
- `kpiTotalVencimento`
- `kpiVencidos`
- `kpiVencendo3`
- `kpiVencendo7`
- `cards`
- `TotalVencimento`
- `Informa`
- `page-vencimento`
- `selectSecretariaVencimento`
- `selectFiltroVencimento`
- `tableVencimento`
- `btnCarregarMaisVencimento`
- `kpiTotalVencimento`
- `kpiVencidos`
- `kpiVencendo3`
- `kpiVencendo7`
- `filtroLabelVencimento`
- `counterVencimento`

**Sistemas Globais Usados**: dataLoader, dataStore, chartCommunication, Logger

**Funções Principais** (10):
- `loadVencimento()`
- `renderVencimentoTable()`
- `updateVencimentoCounter()`
- `getFiltroLabel()`
- `formatarData()`
- `truncateText()`
- `escapeHtml()`
- `popularDropdownSecretarias()`
- `initVencimentoListeners()`
- `recarregarVencimentos()`

---

#### **zeladoria-bairro**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-bairro.js`

**APIs Utilizadas** (4):
- `/api/zeladoria/count-by?field=bairro`
- `/api/zeladoria/by-month`
- `/api/zeladoria/geographic`
- `/api/zeladoria/count-by?field=origem`

**Gráficos** (2):
- `zeladoria-bairro-chart`
- `zeladoria-bairro-mes-chart`

**Cards/Elementos** (16):
- `KPIs`
- `cards`
- `totalOrigem`
- `totalEl`
- `Informa`
- `informa`
- `informadas`
- `page-zeladoria-bairro`
- `zeladoria-bairro-ranking`
- `zeladoria-bairro-geo`
- `zeladoria-bairro-stats`
- `zeladoria-bairro-origem`
- `zeladoria-bairro-kpi-total`
- `zeladoria-bairro-kpi-unicos`
- `zeladoria-bairro-kpi-mais-ativo`
- `zeladoria-bairro-kpi-media`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (7):
- `loadZeladoriaBairro()`
- `renderBairroMesChart()`
- `renderBairroRanking()`
- `renderBairroGeoInfo()`
- `renderBairroStats()`
- `loadBairroDadosAdicionais()`
- `updateZeladoriaBairroKPIs()`

---

#### **zeladoria-canal**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-canal.js`

**APIs Utilizadas** (2):
- `/api/zeladoria/count-by?field=canal`
- `/api/zeladoria/by-month`

**Gráficos** (2):
- `zeladoria-canal-mes-chart`
- `zeladoria-canal-chart`

**Cards/Elementos** (10):
- `KPIs`
- `cards`
- `totalEl`
- `page-zeladoria-canal`
- `zeladoria-canal-ranking`
- `zeladoria-canal-stats`
- `zeladoria-canal-kpi-total`
- `zeladoria-canal-kpi-unicos`
- `zeladoria-canal-kpi-mais-usado`
- `zeladoria-canal-kpi-media`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (5):
- `loadZeladoriaCanal()`
- `renderCanalMesChart()`
- `renderCanalRanking()`
- `renderCanalStats()`
- `updateZeladoriaCanalKPIs()`

---

#### **zeladoria-categoria**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-categoria.js`

**APIs Utilizadas** (3):
- `/api/zeladoria/count-by?field=categoria`
- `/api/zeladoria/by-categoria-departamento`
- `/api/zeladoria/by-month`

**Gráficos** (3):
- `zeladoria-categoria-chart`
- `zeladoria-categoria-mes-chart`
- `zeladoria-categoria-dept-chart`

**Cards/Elementos** (10):
- `KPIs`
- `cards`
- `totalEl`
- `page-zeladoria-categoria`
- `zeladoria-categoria-ranking`
- `zeladoria-categoria-stats`
- `zeladoria-categoria-kpi-total`
- `zeladoria-categoria-kpi-unicas`
- `zeladoria-categoria-kpi-mais-comum`
- `zeladoria-categoria-kpi-media`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (6):
- `loadZeladoriaCategoria()`
- `renderCategoriaMesChart()`
- `renderCategoriaDepartamentoChart()`
- `renderCategoriaRanking()`
- `renderCategoriaStats()`
- `updateZeladoriaCategoriaKPIs()`

---

#### **zeladoria-colab**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-colab.js`

**APIs Utilizadas** (10):
- `/api/colab/categories?type=post`
- `/api/colab/posts`
- `/api/colab/posts?start_date=${encodeURIComponent(startDateStr)}&end_date=${encodeURIComponent(endDateStr)}`,`
- `/api/colab/posts?start_date=${encodeURIComponent(startDateStr)}&end_date=${encodeURIComponent(endDateStr)}`;`
- `/api/colab/posts/${id}/accept``
- `/api/colab/events/${id}/accept`;`
- `/api/colab/posts/${id}/solve``
- `/api/colab/events/${id}/solve`;`
- `/api/colab/posts/${id}``
- `/api/colab/events/${id}`;`

**Gráficos** (2):
- `chartZeladoriaCategoria`
- `chartZeladoriaStatus`

**Cards/Elementos** (24):
- `KPIs`
- `totalDemandas`
- `informado`
- `page-zeladoria-overview`
- `totalDemandas`
- `emAtendimento`
- `finalizadas`
- `novas`
- `page-zeladoria-colab-demandas`
- `listaDemandas`
- `filterStatus`
- `filterStartDate`
- `filterEndDate`
- `page-zeladoria-colab-criar`
- `categoriaId`
- `formCriarDemanda`
- `descricao`
- `endereco`
- `bairro`
- `latitude`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, config

**Funções Principais** (5):
- `loadZeladoriaOverview()`
- `loadColabDemandas()`
- `loadZeladoriaColabCriar()`
- `criarDemanda()`
- `loadZeladoriaColabCategorias()`

---

#### **zeladoria-departamento**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-departamento.js`

**APIs Utilizadas** (2):
- `/api/zeladoria/count-by?field=departamento`
- `/api/zeladoria/by-month`

**Gráficos** (2):
- `zeladoria-departamento-chart`
- `zeladoria-departamento-mes-chart`

**Cards/Elementos** (10):
- `KPIs`
- `cards`
- `totalEl`
- `page-zeladoria-departamento`
- `zeladoria-departamento-ranking`
- `zeladoria-departamento-stats`
- `zeladoria-departamento-kpi-total`
- `zeladoria-departamento-kpi-unicos`
- `zeladoria-departamento-kpi-mais-ativo`
- `zeladoria-departamento-kpi-media`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (5):
- `loadZeladoriaDepartamento()`
- `renderDepartamentoMesChart()`
- `renderDepartamentoRanking()`
- `renderDepartamentoStats()`
- `updateZeladoriaDepartamentoKPIs()`

---

#### **zeladoria-geografica**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-geografica.js`

**APIs Utilizadas** (1):
- `/api/zeladoria/geographic`

**Cards/Elementos** (9):
- `KPIs`
- `totalEl`
- `informado`
- `page-zeladoria-geografica`
- `zeladoria-geografica-content`
- `zeladoria-geografica-kpi-bairros`
- `zeladoria-geografica-kpi-total`
- `zeladoria-geografica-kpi-mais-ativo`
- `zeladoria-geografica-kpi-media`

**Sistemas Globais Usados**: dataLoader, chartCommunication, Logger

**Funções Principais** (2):
- `loadZeladoriaGeografica()`
- `updateZeladoriaGeograficaKPIs()`

---

#### **zeladoria-main**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-main.js`

**Cards/Elementos** (1):
- `pages`

**Sistemas Globais Usados**: Logger

**Funções Principais** (3):
- `loadSection()`
- `getPageLoader()`
- `initNavigation()`

---

#### **zeladoria-mensal**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-mensal.js`

**APIs Utilizadas** (2):
- `/api/zeladoria/by-month`
- `/api/zeladoria/by-status-month`

**Gráficos** (2):
- `zeladoria-mensal-status-chart`
- `zeladoria-mensal-chart`

**Cards/Elementos** (9):
- `KPIs`
- `cards`
- `totalEl`
- `page-zeladoria-mensal`
- `zeladoria-mensal-stats`
- `zeladoria-mensal-kpi-total`
- `zeladoria-mensal-kpi-media`
- `zeladoria-mensal-kpi-pico`
- `zeladoria-mensal-kpi-crescimento`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (4):
- `loadZeladoriaMensal()`
- `renderMensalStatusChart()`
- `renderMensalStats()`
- `updateZeladoriaMensalKPIs()`

---

#### **zeladoria-overview**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-overview.js`

**APIs Utilizadas** (5):
- `/api/zeladoria/stats`
- `/api/zeladoria/count-by?field=status`
- `/api/zeladoria/count-by?field=categoria`
- `/api/zeladoria/count-by?field=departamento`
- `/api/zeladoria/by-month`

**Gráficos** (4):
- `zeladoria-chart-categoria`
- `zeladoria-chart-departamento`
- `zeladoria-chart-mensal`
- `zeladoria-chart-status`

**Cards/Elementos** (6):
- `KPIs`
- `page-zeladoria-overview`
- `zeladoria-kpi-total`
- `zeladoria-kpi-fechados`
- `zeladoria-kpi-abertos`
- `zeladoria-kpi-tempo`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger

**Funções Principais** (1):
- `loadZeladoriaOverview()`

---

#### **zeladoria-responsavel**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-responsavel.js`

**APIs Utilizadas** (2):
- `/api/zeladoria/count-by?field=responsavel`
- `/api/zeladoria/by-month`

**Gráficos** (2):
- `zeladoria-responsavel-chart`
- `zeladoria-responsavel-mes-chart`

**Cards/Elementos** (10):
- `KPIs`
- `totalEl`
- `informado`
- `page-zeladoria-responsavel`
- `zeladoria-responsavel-ranking`
- `zeladoria-responsavel-stats`
- `zeladoria-responsavel-kpi-total`
- `zeladoria-responsavel-kpi-unicos`
- `zeladoria-responsavel-kpi-mais-ativo`
- `zeladoria-responsavel-kpi-media`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (5):
- `loadZeladoriaResponsavel()`
- `renderResponsavelMesChart()`
- `renderResponsavelRanking()`
- `renderResponsavelStats()`
- `updateZeladoriaResponsavelKPIs()`

---

#### **zeladoria-status**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-status.js`

**APIs Utilizadas** (3):
- `/api/zeladoria/count-by?field=status`
- `/api/zeladoria/by-status-month`
- `/api/zeladoria/stats`

**Gráficos** (2):
- `zeladoria-status-mes-chart`
- `zeladoria-status-chart`

**Cards/Elementos** (9):
- `KPIs`
- `totalEl`
- `page-zeladoria-status`
- `zeladoria-status-ranking`
- `zeladoria-status-stats`
- `zeladoria-status-kpi-total`
- `zeladoria-status-kpi-fechados`
- `zeladoria-status-kpi-abertos`
- `zeladoria-status-kpi-taxa`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (5):
- `loadZeladoriaStatus()`
- `renderStatusMesChart()`
- `renderStatusRanking()`
- `renderStatusStats()`
- `updateZeladoriaStatusKPIs()`

---

#### **zeladoria-tempo**

**Arquivo**: `public\scripts\pages\zeladoria\zeladoria-tempo.js`

**APIs Utilizadas** (2):
- `/api/zeladoria/stats`
- `/api/zeladoria/time-series`

**Gráficos** (2):
- `zeladoria-tempo-distribuicao-chart`
- `zeladoria-tempo-mes-chart`

**Cards/Elementos** (10):
- `KPIs`
- `kpiEl`
- `kpis`
- `page-zeladoria-tempo`
- `zeladoria-tempo-kpis`
- `zeladoria-tempo-analises`
- `zeladoria-tempo-kpi-medio`
- `zeladoria-tempo-kpi-fechados`
- `zeladoria-tempo-kpi-abertos`
- `zeladoria-tempo-kpi-eficiencia`

**Sistemas Globais Usados**: dataLoader, chartFactory, chartCommunication, Logger, dateUtils

**Funções Principais** (6):
- `loadZeladoriaTempo()`
- `renderTempoKPIs()`
- `renderTempoMesChart()`
- `renderTempoDistribuicao()`
- `renderTempoAnalises()`
- `updateZeladoriaTempoKPIs()`

---

---

## 📊 RESUMO DE GRÁFICOS

**Total de Gráficos Únicos**: 72

- `chartAssunto`
- `chartAssuntoMes`
- `chartBairro`
- `chartBairroMes`
- `chartCadastranteMes`
- `chartCanais`
- `chartCanal`
- `chartCategoria`
- `chartCategoriaMes`
- `chartComparacaoAnual`
- `chartCrescimentoPercentual`
- `chartDailyDistribution`
- `chartFunnelStatus`
- `chartOrgaoMes`
- `chartPrioridade`
- `chartPrioridades`
- `chartProjecaoMensal`
- `chartProjecaoTema`
- `chartProjecaoTipo`
- `chartReclamacoesMes`
- `chartReclamacoesTipo`
- `chartResponsavel`
- `chartSLA`
- `chartSazonalidade`
- `chartSecretaria`
- `chartSecretariaMes`
- `chartSecretariasDistritos`
- `chartSetor`
- `chartStatusAssunto`
- `chartStatusMes`
- `chartStatusPage`
- `chartStatusTema`
- `chartTema`
- `chartTemaMes`
- `chartTempoMedio`
- `chartTempoMedioDia`
- `chartTempoMedioMes`
- `chartTempoMedioSemana`
- `chartTempoMedioUnidade`
- `chartTempoMedioUnidadeMes`
- `chartTipo`
- `chartTiposManifestacao`
- `chartTopOrgaos`
- `chartTopOrgaosBar`
- `chartTopTemas`
- `chartTrend`
- `chartUAC`
- `chartUnidadesCadastro`
- `chartZeladoriaCategoria`
- `chartZeladoriaStatus`
- `notificacoes-chart-tipo`
- `zeladoria-bairro-chart`
- `zeladoria-bairro-mes-chart`
- `zeladoria-canal-chart`
- `zeladoria-canal-mes-chart`
- `zeladoria-categoria-chart`
- `zeladoria-categoria-dept-chart`
- `zeladoria-categoria-mes-chart`
- `zeladoria-chart-categoria`
- `zeladoria-chart-departamento`
- `zeladoria-chart-mensal`
- `zeladoria-chart-status`
- `zeladoria-departamento-chart`
- `zeladoria-departamento-mes-chart`
- `zeladoria-mensal-chart`
- `zeladoria-mensal-status-chart`
- `zeladoria-responsavel-chart`
- `zeladoria-responsavel-mes-chart`
- `zeladoria-status-chart`
- `zeladoria-status-mes-chart`
- `zeladoria-tempo-distribuicao-chart`
- `zeladoria-tempo-mes-chart`
---

## 🎴 RESUMO DE CARDS

**Total de Cards Únicos**: 210

- `Cards`
- `InfoEl`
- `Informa`
- `KPIs`
- `KPIsVisualState`
- `TotalAssunto`
- `TotalBairro`
- `TotalBairros`
- `TotalCadastrante`
- `TotalCanal`
- `TotalCategoria`
- `TotalContainer`
- `TotalDenuncias`
- `TotalDistritos`
- `TotalEl`
- `TotalOrgaos`
- `TotalPrioridade`
- `TotalProtocolos`
- `TotalReclamacoes`
- `TotalResponsavel`
- `TotalSecretaria`
- `TotalSecretariasDistritos`
- `TotalSetor`
- `TotalStatus`
- `TotalTema`
- `TotalTipo`
- `TotalUAC`
- `TotalUnidadeSaude`
- `TotalVencimento`
- `cardErros`
- `cardHoje`
- `cardTotal`
- `cardUltimaExec`
- `cards`
- `dailyInfo`
- `infoMensal`
- `informa`
- `informadas`
- `informado`
- `informativos`
- `kpi30`
- `kpi30Container`
- `kpi7`
- `kpi7Container`
- `kpiAssuntoMaisComum`
- `kpiAssuntoMaisComumUnidade`
- `kpiAssuntos`
- `kpiAssuntosUnicos`
- `kpiAssuntosUnicosUnidade`
- `kpiBairroMaisAtivo`
- `kpiBairros`
- `kpiBairrosUnicos`
- `kpiCanaisUnicos`
- `kpiCanalMaisUsado`
- `kpiCategoriaMaisComum`
- `kpiCategoriasUnicas`
- `kpiDenuncias`
- `kpiDistritos`
- `kpiEl`
- `kpiMaisAtiva`
- `kpiMaisAtivo`
- `kpiMaisComum`
- `kpiMaisUsado`
- `kpiMedia`
- `kpiMediaAssunto`
- `kpiMediaBairro`
- `kpiMediaCanal`
- `kpiMediaCategoria`
- `kpiMediaEl`
- `kpiMediaOrgao`
- `kpiMediaPrioridade`
- `kpiMediaResponsavel`
- `kpiMediaSecretaria`
- `kpiMediaSecretariasDistrito`
- `kpiMediaSetor`
- `kpiMediaTema`
- `kpiMediaTipo`
- `kpiMediaUAC`
- `kpiOrgaosUnicos`
- `kpiPeriodo`
- `kpiPeriodoEl`
- `kpiPrioridadeMaisComum`
- `kpiPrioridadesUnicas`
- `kpiResponsaveisUnicos`
- `kpiResponsavelMaisAtivo`
- `kpiSecretariaMaisAtiva`
- `kpiSecretarias`
- `kpiSecretariasUnicas`
- `kpiServidorMaisAtivo`
- `kpiServidores`
- `kpiServidoresUnicos`
- `kpiSetorMaisAtivo`
- `kpiSetoresUnicos`
- `kpiStatusMaisComum`
- `kpiStatusUnicos`
- `kpiTaxa`
- `kpiTaxaConclusao`
- `kpiTemaMaisComum`
- `kpiTemasUnicos`
- `kpiTipoMaisComum`
- `kpiTipos`
- `kpiTiposUnicos`
- `kpiTiposUnicosUnidade`
- `kpiTotal`
- `kpiTotalAssunto`
- `kpiTotalBairro`
- `kpiTotalBairros`
- `kpiTotalCadastrante`
- `kpiTotalCanal`
- `kpiTotalCategoria`
- `kpiTotalContainer`
- `kpiTotalDenuncias`
- `kpiTotalDistritos`
- `kpiTotalEl`
- `kpiTotalOrgaos`
- `kpiTotalPrioridade`
- `kpiTotalReclamacoes`
- `kpiTotalResponsavel`
- `kpiTotalSecretaria`
- `kpiTotalSecretariasDistritos`
- `kpiTotalSetor`
- `kpiTotalStatus`
- `kpiTotalTema`
- `kpiTotalTipo`
- `kpiTotalUAC`
- `kpiTotalUnidadeSaude`
- `kpiTotalVencimento`
- `kpiUACMaisAtiva`
- `kpiUACsUnicas`
- `kpiUnicas`
- `kpiUnicos`
- `kpiUnicosEl`
- `kpiUnidades`
- `kpiUnidadesUnicas`
- `kpiVencendo3`
- `kpiVencendo7`
- `kpiVencidos`
- `kpis`
- `kpisContainer`
- `kpisProjecao`
- `notificacoes-total`
- `slaInfo`
- `statusInfo`
- `tiposInfo`
- `totalBairros`
- `totalCadastrante`
- `totalDemandas`
- `totalDenuncias`
- `totalDistritos`
- `totalEl`
- `totalEnviados`
- `totalErros`
- `totalFiltradosEl`
- `totalHistorico`
- `totalHistoricoEl`
- `totalManifestations`
- `totalMeses`
- `totalOrgaos`
- `totalOrigem`
- `totalPages`
- `totalProjetado`
- `totalProjetadoEl`
- `totalProtocolos`
- `totalProtocolosFiltrados`
- `totalReclamacoes`
- `totalRows`
- `totalSecretarias`
- `totalStatus`
- `trendTotal`
- `zeladoria-bairro-kpi-mais-ativo`
- `zeladoria-bairro-kpi-media`
- `zeladoria-bairro-kpi-total`
- `zeladoria-bairro-kpi-unicos`
- `zeladoria-canal-kpi-mais-usado`
- `zeladoria-canal-kpi-media`
- `zeladoria-canal-kpi-total`
- `zeladoria-canal-kpi-unicos`
- `zeladoria-categoria-kpi-mais-comum`
- `zeladoria-categoria-kpi-media`
- `zeladoria-categoria-kpi-total`
- `zeladoria-categoria-kpi-unicas`
- `zeladoria-departamento-kpi-mais-ativo`
- `zeladoria-departamento-kpi-media`
- `zeladoria-departamento-kpi-total`
- `zeladoria-departamento-kpi-unicos`
- `zeladoria-geografica-kpi-bairros`
- `zeladoria-geografica-kpi-mais-ativo`
- `zeladoria-geografica-kpi-media`
- `zeladoria-geografica-kpi-total`
- `zeladoria-kpi-abertos`
- `zeladoria-kpi-fechados`
- `zeladoria-kpi-tempo`
- `zeladoria-kpi-total`
- `zeladoria-mensal-kpi-crescimento`
- `zeladoria-mensal-kpi-media`
- `zeladoria-mensal-kpi-pico`
- `zeladoria-mensal-kpi-total`
- `zeladoria-responsavel-kpi-mais-ativo`
- `zeladoria-responsavel-kpi-media`
- `zeladoria-responsavel-kpi-total`
- `zeladoria-responsavel-kpi-unicos`
- `zeladoria-status-kpi-abertos`
- `zeladoria-status-kpi-fechados`
- `zeladoria-status-kpi-taxa`
- `zeladoria-status-kpi-total`
- `zeladoria-tempo-kpi-abertos`
- `zeladoria-tempo-kpi-eficiencia`
- `zeladoria-tempo-kpi-fechados`
- `zeladoria-tempo-kpi-medio`
- `zeladoria-tempo-kpis`
---

## 📝 NOTAS

- Este mapeamento foi gerado automaticamente pelo script `map-system.js`
- Para atualizar, execute: `node maps/map-system.js`
- Alguns elementos podem não ser detectados se usarem padrões não convencionais

---

**Fim do Mapeamento**
