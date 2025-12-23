# 📊 Catálogo de Gráficos: Pizza e Barra

**Documento criado em:** 2024-12-09  
**Sistema:** Dashboard Municipal - CÉREBRO X-3  
**Última atualização:** 2024-12-09 - Via análise de código

---

## 📋 Índice

1. [Ouvidoria](#-ouvidoria)
2. [E-SIC](#-e-sic)
3. [Zeladoria](#-zeladoria)
4. [Painel Central](#-painel-central)

---

## 🟧 OUVIDORIA

### 📄 Página: Overview (Visão Geral)

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartFunnelStatus` | Doughnut | Status | `Status` | Distribuição por status das demandas |
| `chartTiposManifestacao` | Doughnut | Tipo | `tipoDeManifestacao` | Distribuição por tipos de manifestação |
| `chartCanais` | Doughnut | Canal | `Canal` | Distribuição por canais de atendimento (Top 8) |
| `chartPrioridades` | Doughnut | Prioridade | `Prioridade` | Distribuição por níveis de prioridade |
| `chartSLA` | Doughnut | SLA | `SLA` | Distribuição por faixas de SLA (Concluídos, Verde, Amarelo, Vermelho) |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartDailyDistribution` | Bar | Temporal | `dataCriacaoIso` | Distribuição diária (últimos 30 dias) | Vertical |
| `chartTopOrgaos` | Bar | Órgão | `secretaria` | Top 5 órgãos com mais demandas | Horizontal |
| `chartTopTemas` | Bar | Tema | `tema` | Top 5 temas mais frequentes | Horizontal |
| `chartUnidadesCadastro` | Bar | Unidade | `unidadeCadastro` | Top 5 unidades de cadastro | Horizontal |

---

### 📄 Página: Status

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartStatusPage` | Doughnut | Status | `statusDemanda` | Distribuição detalhada por status |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartStatusMes` | Bar | Temporal | `dataCriacaoIso` | Evolução de status ao longo dos meses | Vertical (Multi-dataset) |

---

### 📄 Página: Tipo

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartTipo` | Doughnut/Pie | Tipo | `tipoDeManifestacao` | Distribuição por tipos de manifestação (Top 20) |

---

### 📄 Página: Tema

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartStatusTema` | Doughnut | Status | `statusDemanda` | Status das demandas filtradas por tema |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartTema` | Bar | Tema | `tema` | Distribuição por temas | Horizontal |
| `chartTemaMes` | Bar | Temporal | `dataCriacaoIso` | Evolução de temas ao longo dos meses | Vertical (Multi-dataset) |

---

### 📄 Página: Assunto

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartStatusAssunto` | Doughnut | Status | `statusDemanda` | Status das demandas filtradas por assunto |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartAssunto` | Bar | Assunto | `assunto` | Distribuição por assuntos | Horizontal |
| `chartAssuntoMes` | Bar | Temporal | `dataCriacaoIso` | Evolução de assuntos ao longo dos meses | Vertical (Multi-dataset) |

---

### 📄 Página: Bairro

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartBairro` | Bar | Bairro | `bairro` | Distribuição por bairros | Horizontal |
| `chartBairroMes` | Bar | Temporal | `dataCriacaoIso` | Evolução de bairros ao longo dos meses | Vertical (Multi-dataset) |

---

### 📄 Página: Canal

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartCanal` | Doughnut | Canal | `canal` | Distribuição por canais de atendimento |

---

### 📄 Página: Prioridade

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartPrioridade` | Doughnut | Prioridade | `prioridade` | Distribuição por níveis de prioridade |

---

### 📄 Página: Responsável

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartResponsavel` | Bar | Responsável | `responsavel` | Distribuição por responsáveis | Horizontal |

---

### 📄 Página: Cadastrante

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartCadastranteMes` | Bar | Temporal | `dataCriacaoIso` | Evolução de cadastrantes ao longo dos meses | Vertical |

---

### 📄 Página: Órgão/Mês

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartOrgaoMes` | Bar | Temporal | `dataCriacaoIso` | Evolução de órgãos ao longo dos meses | Vertical (Multi-dataset) |
| `chartTopOrgaosBar` | Bar | Órgão | `secretaria` | Top órgãos em formato de barra | Horizontal |

---

### 📄 Página: Tempo Médio

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartTempoMedio` | Bar | Temporal | `dataCriacaoIso` | Tempo médio de resolução por período | Horizontal |
| `chartTempoMedioUnidade` | Bar | Unidade | `unidadeCadastro` | Tempo médio por unidade | Horizontal |

---

### 📄 Página: Projeção 2026

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartProjecaoTipo` | Doughnut | Tipo | `tipoDeManifestacao` | Projeção por tipo de manifestação |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartCrescimentoPercentual` | Bar | Projeção | `projecao` | Crescimento percentual projetado | Vertical |
| `chartSazonalidade` | Bar | Temporal | `mes` | Padrão de sazonalidade | Vertical |
| `chartProjecaoTema` | Bar | Tema | `tema` | Projeção por tema | Horizontal |

---

### 📄 Página: Unidades de Saúde

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartUnidade{UnitName}Tipos` | Doughnut | Tipo | `tipoDeManifestacao` | Tipos de manifestação por unidade (dinâmico) |

---

### 📄 Página: Unidades (Unit)

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `chartUnit{UnitName}Tipos` | Doughnut | Tipo | `tipoDeManifestacao` | Tipos de manifestação por unidade (dinâmico) |

---

### 📄 Página: Reclamações

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartReclamacoesTipo` | Bar | Tipo | `tipoDeManifestacao` | Distribuição de reclamações por tipo | Horizontal |
| `chartReclamacoesMes` | Bar | Temporal | `dataCriacaoIso` | Evolução de reclamações ao longo dos meses | Vertical |

---

### 📄 Página: Notificações

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `notificacoes-chart-tipo` | Doughnut | Tipo | `tipo` | Distribuição por tipo de notificação |

---

## 🟦 E-SIC

### 📄 Página: Overview (Visão Geral)

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `esic-chart-status` | Doughnut | Status | `status` | Distribuição por status das solicitações |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `esic-chart-tipo-informacao` | Bar | Tipo | `tipoInformacao` | Top 10 tipos de informação solicitada | Horizontal |
| `esic-chart-responsavel` | Bar | Responsável | `responsavel` | Top 10 responsáveis | Horizontal |

---

### 📄 Página: Status

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `esic-chart-status-detail` | Bar | Status | `status` | Distribuição detalhada por status | Horizontal |

---

### 📄 Página: Tipo de Informação

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `esic-chart-tipo-informacao-detail` | Bar | Tipo | `tipoInformacao` | Distribuição detalhada por tipo de informação | Horizontal |

---

### 📄 Página: Canal

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `esic-chart-canal-detail` | Bar | Canal | `canal` | Distribuição por canal de entrada | Horizontal |

---

### 📄 Página: Unidade

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `esic-chart-unidade-detail` | Bar | Unidade | `unidadeContato` | Distribuição por unidade de contato | Horizontal |

---

### 📄 Página: Responsável

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `esic-chart-responsavel-detail` | Bar | Responsável | `responsavel` | Distribuição detalhada por responsável | Horizontal |

---

## 🟩 ZELADORIA

### 📄 Página: Overview (Visão Geral)

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `zeladoria-chart-status` | Doughnut | Status | `status` | Distribuição por status das demandas |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-chart-categoria` | Bar | Categoria | `categoria` | Top 10 categorias de demanda | Horizontal |
| `zeladoria-chart-departamento` | Bar | Departamento | `departamento` | Distribuição por departamento responsável | Horizontal |

---

### 📄 Página: Status

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `zeladoria-status-chart` | Doughnut | Status | `status` | Distribuição detalhada por status |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-status-mes-chart` | Bar | Temporal | `dataCriacaoIso` | Evolução de status ao longo dos meses | Vertical (Multi-dataset) |

---

### 📄 Página: Categoria

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-categoria-chart` | Bar | Categoria | `categoria` | Distribuição por categorias | Horizontal |
| `zeladoria-categoria-mes-chart` | Bar | Temporal | `dataCriacaoIso` | Evolução de categorias ao longo dos meses | Vertical (Multi-dataset) |
| `zeladoria-categoria-dept-chart` | Bar | Departamento | `departamento` | Categorias por departamento | Horizontal (Multi-dataset) |

---

### 📄 Página: Departamento

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-departamento-chart` | Bar | Departamento | `departamento` | Distribuição por departamentos | Horizontal |
| `zeladoria-departamento-mes-chart` | Bar | Temporal | `dataCriacaoIso` | Evolução de departamentos ao longo dos meses | Vertical (Multi-dataset) |

---

### 📄 Página: Bairro

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-bairro-chart` | Bar | Bairro | `bairro` | Distribuição por bairros | Horizontal |
| `zeladoria-bairro-mes-chart` | Bar | Temporal | `dataCriacaoIso` | Evolução de bairros ao longo dos meses | Vertical (Multi-dataset) |

---

### 📄 Página: Canal

#### Gráficos de Pizza/Doughnut

| ID do Gráfico | Tipo | Categoria | Campo | Descrição |
|--------------|------|-----------|-------|-----------|
| `zeladoria-canal-chart` | Doughnut | Canal | `canal` | Distribuição por canais de entrada |

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-canal-mes-chart` | Bar | Temporal | `dataCriacaoIso` | Evolução de canais ao longo dos meses | Vertical (Multi-dataset) |

---

### 📄 Página: Responsável

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-responsavel-chart` | Bar | Responsável | `responsavel` | Top 20 responsáveis | Horizontal |
| `zeladoria-responsavel-mes-chart` | Bar | Temporal | `dataCriacaoIso` | Evolução de responsáveis ao longo dos meses (Top 10) | Vertical (Multi-dataset) |

---

### 📄 Página: Mensal

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-mensal-status-chart` | Bar | Temporal | `dataCriacaoIso` | Evolução mensal por status | Vertical (Multi-dataset) |

---

### 📄 Página: Tempo

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `zeladoria-tempo-distribuicao-chart` | Bar | Temporal | `tempoResolucao` | Distribuição por faixas de tempo de resolução | Horizontal |

---

## 🟣 PAINEL CENTRAL

### 📄 Página: Dashboard Central

#### Gráficos de Barra

| ID do Gráfico | Tipo | Categoria | Campo | Descrição | Orientação |
|--------------|------|-----------|-------|-----------|------------|
| `chartVolumeSistemas` | Bar | Sistema | `sistema` | Volume comparativo entre sistemas (Zeladoria, Ouvidoria, E-SIC, CORA) | Vertical |

---

## 📊 Resumo Estatístico

### Total de Gráficos por Sistema

| Sistema | Pizza/Doughnut | Barra | Total |
|---------|---------------|-------|-------|
| **Ouvidoria** | 12 | 25 | 37 |
| **E-SIC** | 1 | 6 | 7 |
| **Zeladoria** | 2 | 14 | 16 |
| **Painel Central** | 0 | 1 | 1 |
| **TOTAL** | **15** | **46** | **61** |

### Categorias Mais Comuns

#### Por Categoria de Dado:

1. **Temporal** (Evolução mensal/sazonal): 18 gráficos
2. **Status**: 8 gráficos
3. **Tipo**: 6 gráficos
4. **Categoria**: 4 gráficos
5. **Responsável**: 5 gráficos
6. **Canal**: 4 gráficos
7. **Órgão/Departamento**: 5 gráficos
8. **Bairro**: 3 gráficos
9. **Unidade**: 3 gráficos
10. **Tema/Assunto**: 5 gráficos

---

## 🔧 Notas Técnicas

### Tipos de Gráfico

- **Doughnut**: Gráfico de rosca (similar a pizza, mas com centro vazio)
- **Pie**: Gráfico de pizza tradicional
- **Bar (Horizontal)**: Gráfico de barras horizontal (categorias no eixo Y)
- **Bar (Vertical)**: Gráfico de barras vertical (categorias no eixo X)
- **Bar (Multi-dataset)**: Gráfico de barras com múltiplos datasets (agrupado ou empilhado)

### Convenções de Nomenclatura

- Gráficos de pizza/doughnut geralmente representam **distribuições proporcionais**
- Gráficos de barra geralmente representam **comparações de valores** ou **evoluções temporais**
- IDs seguem padrão: `{sistema}-chart-{categoria}` ou `chart{Categoria}`
- Gráficos dinâmicos (por unidade) usam: `chart{UnitName}Tipos`

### Filtros e Interatividade

- A maioria dos gráficos possui **cross-filter** habilitado (clique para filtrar)
- Alguns gráficos permitem **multi-select** com Ctrl+Click
- Clique direito (contextmenu) geralmente **limpa todos os filtros**

---

## 📝 Métodos de Criação

Todos os gráficos são criados através do `ChartFactory`:

```javascript
// Pizza/Doughnut
window.chartFactory.createDoughnutChart(canvasId, labels, values, options);

// Barra
window.chartFactory.createBarChart(canvasId, labels, values, options);
```

### Opções Comuns

- `horizontal: true` - Para barras horizontais
- `colorIndex: N` - Índice da paleta de cores
- `field: 'campo'` - Campo para detecção automática de cores
- `onClick: false` - Desabilitar interatividade
- `legendContainer: 'id'` - Container para legenda customizada

---

**Documento gerado automaticamente via análise do código fonte.**  
**Para atualizações, edite os arquivos em `NOVO/public/scripts/pages/` e este documento será atualizado manualmente.**
