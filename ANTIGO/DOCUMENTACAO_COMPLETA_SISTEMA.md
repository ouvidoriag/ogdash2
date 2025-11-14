# 📚 Documentação Completa do Sistema - Dashboard Ouvidoria Duque de Caxias

**Data de Criação:** Janeiro 2025  
**Versão do Sistema:** 2.0  
**Tipo:** Single Page Application (SPA)

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Páginas do Sistema](#páginas-do-sistema)
4. [Gráficos e Visualizações](#gráficos-e-visualizações)
5. [APIs e Endpoints](#apis-e-endpoints)
6. [Funcionalidades Especiais](#funcionalidades-especiais)

---

## 🎯 Visão Geral do Sistema

O Dashboard da Ouvidoria de Duque de Caxias é uma aplicação web moderna que permite visualizar, analisar e gerenciar manifestações da população. O sistema utiliza uma arquitetura SPA (Single Page Application) onde todas as páginas são carregadas dinamicamente sem recarregar a página completa.

### Características Principais:
- ✅ **Interface Moderna**: Design futurista com tema dark e efeitos glassmorphism
- ✅ **Performance Otimizada**: Carregamento em background, cache inteligente e pré-carregamento
- ✅ **Visualizações Avançadas**: Gráficos interativos, heatmaps, diagramas Sankey e TreeMaps
- ✅ **Análise de Dados**: KPIs, tendências, projeções e insights com IA
- ✅ **Filtros Globais**: Sistema de filtros que se aplica a todas as visualizações
- ✅ **Exportação**: Exportação de dados em CSV, Excel e formatos de gráficos

---

## 🏗️ Arquitetura e Tecnologias

### Frontend:
- **HTML5/CSS3**: Estrutura e estilização
- **JavaScript (ES6+)**: Lógica da aplicação
- **Chart.js**: Gráficos interativos
- **Plotly.js**: Gráficos avançados (Sankey, TreeMap)
- **Tailwind CSS**: Framework CSS utilitário

### Backend:
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **Prisma**: ORM para banco de dados
- **SQLite**: Banco de dados

### Estrutura de Arquivos:
```
public/
├── index.html              # Página principal (todas as seções)
├── scripts/
│   ├── main.js            # Orquestrador principal
│   ├── data.js            # Gerenciamento de dados
│   ├── charts.js           # Funções de gráficos
│   ├── filters.js          # Sistema de filtros
│   └── modules/
│       ├── data-overview.js    # Módulo visão geral
│       ├── data-pages.js        # Módulo páginas específicas
│       ├── data-charts.js       # Módulo gráficos avançados
│       ├── data-kpis.js         # Módulo KPIs
│       └── data-tables.js        # Módulo tabelas
```

---

## 📋 Listagem Completa de Páginas e Gráficos

### Resumo Rápido

| Página | ID | Gráficos | Componentes Adicionais |
|--------|-----|----------|------------------------|
| Home | `page-home` | 0 | Página estática |
| Visão Geral | `page-main` | 10+ | KPIs, Insights IA, Status Cards |
| Cora Chat | `page-cora-chat` | 0 | Interface de chat |
| Por Órgão e Mês | `page-orgao-mes` | 1 | Lista de órgãos, Tabela cruzada |
| Tempo Médio | `page-tempo-medio` | 6 | 4 KPIs, Ranking |
| Por Tema | `page-tema` | 3 | Heatmap, Lista completa |
| Por Assunto | `page-assunto` | 3 | Heatmap, Lista completa |
| Por Cadastrante | `page-cadastrante` | 4 | Listas, KPI total |
| Reclamações | `page-reclamacoes` | 2 | Lista de assuntos |
| Projeção 2026 | `page-projecao-2026` | 3 | - |
| Secretarias | `page-secretaria` | 2 | - |
| Secretarias e Distritos | `page-secretarias-distritos` | 1 | - |
| Tipos | `page-tipo` | 1 | - |
| Status | `page-status` | 4 | - |
| Categoria | `page-categoria` | 2 | Heatmap |
| Setor | `page-setor` | 1 | - |
| UAC | `page-uac` | 1 | - |
| Responsáveis | `page-responsavel` | 1 | - |
| Canais | `page-canal` | 1 | - |
| Prioridades | `page-prioridade` | 1 | - |
| Bairro | `page-bairro` | 2 | Heatmap |
| Unidades de Saúde | `page-unit-*` | Variável | Dados específicos |

---

## 📄 Páginas do Sistema

O sistema possui **20+ páginas** organizadas em seções:

### 🏠 Seção: Início

#### 1. **Home** (`page-home`)
- **ID:** `page-home`
- **Função:** Página inicial estática com informações gerais
- **Conteúdo:** Boas-vindas, informações sobre o sistema
- **Gráficos:** Nenhum

#### 2. **Visão Geral** (`page-main`)
- **ID:** `page-main`
- **Função:** Dashboard principal com visão consolidada
- **Carregamento:** `loadOverview()` em `data-overview.js`
- **Gráficos:** 10+ gráficos (ver seção de gráficos)

#### 3. **Cora - Chat** (`page-cora-chat`)
- **ID:** `page-cora-chat`
- **Função:** Interface de chat com assistente virtual
- **Carregamento:** `loadCoraChat()`
- **Gráficos:** Nenhum

---

### 📊 Seção: Análises Principais

#### 4. **Por Órgão e Mês** (`page-orgao-mes`)
- **ID:** `page-orgao-mes`
- **Função:** Análise de manifestações por órgão e período mensal
- **Carregamento:** `loadOrgaoMes()` em `data-pages.js`
- **Gráficos:**
  - `chartOrgaoMes`: Gráfico de barras horizontal mensal
- **Componentes:**
  - Lista visual de órgãos com barras de progresso
  - Tabela cruzada (Órgão × Mês)
  - KPI: Total de manifestações

#### 5. **Tempo Médio** (`page-tempo-medio`)
- **ID:** `page-tempo-medio`
- **Função:** Análise do tempo médio de atendimento em dias
- **Carregamento:** `loadTempoMedio()` em `data-pages.js`
- **KPIs:**
  - Média Geral (dias)
  - Mediana (dias)
  - Mínimo (dias)
  - Máximo (dias)
- **Gráficos:**
  - `chartTempoMedio`: Tempo médio por órgão/unidade (barras horizontal)
  - `chartTempoMedioDia`: Tendência diária (linha)
  - `chartTempoMedioSemana`: Tendência semanal (linha)
  - `chartTempoMedioMes`: Tendência mensal (barras)
  - `chartTempoMedioUnidade`: Por unidade de cadastro (barras horizontal)
  - `chartTempoMedioUnidadeMes`: Por unidade e mês (linha múltipla)
- **Componentes:**
  - Ranking de órgãos/unidades

#### 6. **Por Tema** (`page-tema`)
- **ID:** `page-tema`
- **Função:** Análise de manifestações por tema
- **Carregamento:** `loadTema()` em `data-pages.js`
- **Gráficos:**
  - `chartTema`: Top 15 temas (barras horizontal)
  - `chartStatusTema`: Status por tema (pizza/rosquinha)
  - `chartTemaMes`: Temas por mês (barras)
  - `heatmapTema`: Heatmap Mês × Tema
- **Componentes:**
  - Lista completa de temas

#### 7. **Por Assunto** (`page-assunto`)
- **ID:** `page-assunto`
- **Função:** Análise de manifestações por assunto
- **Carregamento:** `loadAssunto()` em `data-pages.js`
- **Gráficos:**
  - `chartAssunto`: Top 15 assuntos (barras horizontal)
  - `chartStatusAssunto`: Status por assunto (pizza/rosquinha)
  - `chartAssuntoMes`: Assuntos por mês (barras)
  - `heatmapAssunto`: Heatmap Mês × Assunto
- **Componentes:**
  - Lista completa de assuntos

#### 8. **Por Cadastrante** (`page-cadastrante`)
- **ID:** `page-cadastrante`
- **Função:** Análise por servidor/cadastrante e unidade de cadastro
- **Carregamento:** `loadCadastrante()`
- **Gráficos:**
  - `chartCadastranteMes`: Por mês (barras)
  - `chartCadastranteTema`: Por tema (filtrado) - aparece quando há filtro
  - `chartCadastranteAssunto`: Por assunto (filtrado) - aparece quando há filtro
  - `chartCadastranteStatus`: Por status (filtrado) - aparece quando há filtro
- **Componentes:**
  - Lista de servidores
  - Lista de unidades de cadastro
  - KPI: Total de manifestações cadastradas

#### 9. **Reclamações e Denúncias** (`page-reclamacoes`)
- **ID:** `page-reclamacoes`
- **Função:** Análise específica de reclamações e denúncias
- **Carregamento:** `loadReclamacoes()`
- **Gráficos:**
  - `chartReclamacoesTipo`: Por tipo de ação (pizza/rosquinha)
  - `chartReclamacoesMes`: Quantidade por mês (barras)
- **Componentes:**
  - Lista de assuntos relacionados a reclamações

#### 10. **Projeção 2026** (`page-projecao-2026`)
- **ID:** `page-projecao-2026`
- **Função:** Projeções e previsões para 2026
- **Carregamento:** `loadProjecao2026()`
- **Gráficos:**
  - `chartProjecaoMensal`: Projeção mensal (linha)
  - `chartProjecaoTema`: Projeção por tema (barras)
  - `chartProjecaoStatus`: Projeção por status (barras)

---

### 🏛️ Seção: Secretarias e Órgãos

#### 11. **Secretarias** (`page-secretaria`)
- **ID:** `page-secretaria`
- **Função:** Análise por secretarias
- **Carregamento:** `loadSecretaria()`
- **Gráficos:**
  - `chartSecretaria`: Distribuição por secretaria (barras horizontal)
  - `chartSecretariaMes`: Secretarias por mês (barras)

#### 12. **Secretarias e Distritos** (`page-secretarias-distritos`)
- **ID:** `page-secretarias-distritos`
- **Função:** Análise cruzada secretarias × distritos
- **Carregamento:** `loadSecretariasDistritos()`
- **Gráficos:**
  - `chartSecretariasDistritos`: Visualização cruzada (barras agrupadas)

---

### 📋 Seção: Classificações

#### 13. **Tipos de Manifestação** (`page-tipo`)
- **ID:** `page-tipo`
- **Função:** Análise por tipo de manifestação
- **Carregamento:** `loadTipo()`
- **Gráficos:**
  - `chartTipo`: Distribuição por tipo (barras horizontal)

#### 14. **Status** (`page-status`)
- **ID:** `page-status`
- **Função:** Análise por status das manifestações
- **Carregamento:** `loadStatusPage()` em `data-pages.js`
- **Gráficos:**
  - `chartStatus`: Distribuição por status (barras horizontal)
  - `chartStatusMes`: Status por mês (barras)
  - `chartStatusTema`: Status por tema (barras)
  - `chartStatusOrgao`: Status por órgão (barras)

#### 15. **Categoria/Tema** (`page-categoria`)
- **ID:** `page-categoria`
- **Função:** Análise por categoria
- **Carregamento:** `loadCategoria()` em `data-pages.js`
- **Gráficos:**
  - `chartCategoria`: Distribuição por categoria (barras horizontal)
  - `chartCategoriaMes`: Categorias por mês (barras)
  - `heatmapCategoria`: Heatmap Mês × Categoria

#### 16. **Unidade de Cadastro** (`page-setor`)
- **ID:** `page-setor`
- **Função:** Análise por unidade de cadastro (setor)
- **Carregamento:** `loadSetor()`
- **Gráficos:**
  - `chartSetor`: Distribuição por setor (barras horizontal)

#### 17. **UAC** (`page-uac`)
- **ID:** `page-uac`
- **Função:** Análise por UAC (Unidade de Atendimento ao Cidadão)
- **Carregamento:** `loadUAC()` em `data-pages.js`
- **Gráficos:**
  - `chartUAC`: Distribuição por UAC (barras horizontal)

#### 18. **Responsáveis** (`page-responsavel`)
- **ID:** `page-responsavel`
- **Função:** Análise por responsável
- **Carregamento:** `loadResponsavel()` em `data-pages.js`
- **Gráficos:**
  - `chartResponsavel`: Distribuição por responsável (barras horizontal)

#### 19. **Canais** (`page-canal`)
- **ID:** `page-canal`
- **Função:** Análise por canal de entrada
- **Carregamento:** `loadCanal()` em `data-pages.js`
- **Gráficos:**
  - `chartCanal`: Distribuição por canal (barras horizontal)

#### 20. **Prioridades** (`page-prioridade`)
- **ID:** `page-prioridade`
- **Função:** Análise por prioridade
- **Carregamento:** `loadPrioridade()` em `data-pages.js`
- **Gráficos:**
  - `chartPrioridade`: Distribuição por prioridade (barras horizontal)

#### 21. **Bairro** (`page-bairro`)
- **ID:** `page-bairro`
- **Função:** Análise geográfica por bairro
- **Carregamento:** `loadBairro()` em `data-pages.js`
- **Gráficos:**
  - `chartBairro`: Distribuição por bairro (barras horizontal)
  - `chartBairroMes`: Bairros por mês (barras)
  - `heatmapBairro`: Heatmap Mês × Bairro

---

### 🏥 Seção: Unidades de Saúde

O sistema possui páginas dinâmicas para cada unidade de saúde. Cada página segue o padrão `page-unit-{nome-unidade}` e é carregada pela função `loadUnit(nomeUnidade)`.

**Unidades Disponíveis:**
- Hospital Adão (`page-unit-adao`)
- CER IV (`page-unit-cer-iv`)
- Hospital do Olho (`page-unit-hospital-olho`)
- Hospital Duque (`page-unit-hospital-duque`)
- Hospital Infantil (`page-unit-hospital-infantil`)
- Hospital Moacyr (`page-unit-hospital-moacyr`)
- Maternidade Santa Cruz (`page-unit-maternidade-santa-cruz`)
- UPA Beira Mar (`page-unit-upa-beira-mar`)
- UPH Pilar (`page-unit-uph-pilar`)
- UPH Saracuruna (`page-unit-uph-saracuruna`)
- UPH Xerém (`page-unit-uph-xerem`)
- Hospital Veterinário (`page-unit-hospital-veterinario`)
- UPA Walter Garcia (`page-unit-upa-walter-garcia`)
- UPH Campos Elíseos (`page-unit-uph-campos-eliseos`)
- UPH Parque Equitativa (`page-unit-uph-parque-equitativa`)
- UBS Antonio Granja (`page-unit-ubs-antonio-granja`)
- UPA Sarapuí (`page-unit-upa-sarapui`)
- UPH Imbariê (`page-unit-uph-imbarie`)

**Características das Páginas de Unidades:**
- Dados específicos da unidade
- Gráficos personalizados
- Estatísticas locais

---

## 📊 Listagem Detalhada: Páginas e Gráficos

### 🏠 Seção: Início

#### 1. **Home** (`page-home`)
**Gráficos:** Nenhum  
**Componentes:** Página estática com informações gerais

---

#### 2. **Visão Geral** (`page-main`)
**Gráficos:**
1. `chartTrend` - Gráfico de Tendência (Line Chart)
2. `chartTopOrgaos` - Top Órgãos (Bar Chart Horizontal)
3. `chartTopTemas` - Top Temas (Bar Chart Horizontal)
4. `chartFunnelStatus` - Funil por Status (Bar Chart)
5. `sankeyChart` - Diagrama Sankey (Fluxo Tema → Órgão → Status)
6. `treemapChart` - TreeMap (Proporção por Categoria)
7. `mapChart` - Mapa Geográfico (Distribuição por Bairro)
8. `heatmap` - Heatmap Dinâmico (Configurável)
9. Sparklines nos KPIs (gráficos pequenos)

**Componentes Adicionais:**
- 3 KPIs principais (Total, 7 dias, 30 dias)
- Status Overview Cards
- Insights com IA
- Box de insights básicos

---

#### 3. **Cora - Chat** (`page-cora-chat`)
**Gráficos:** Nenhum  
**Componentes:** Interface de chat com assistente virtual

---

### 📊 Seção: Análises Principais

#### 4. **Por Órgão e Mês** (`page-orgao-mes`)
**Gráficos:**
1. `chartOrgaoMes` - Manifestações por Mês (Bar Chart Horizontal)

**Componentes Adicionais:**
- Lista visual de órgãos com barras de progresso
- Tabela cruzada (Órgão × Mês) com totais
- KPI: Total de manifestações
- KPI: Total de órgãos

---

#### 5. **Tempo Médio** (`page-tempo-medio`)
**Gráficos:**
1. `chartTempoMedio` - Tempo Médio por Órgão/Unidade (Bar Chart Horizontal)
2. `chartTempoMedioDia` - Tendência Diária (Line Chart)
3. `chartTempoMedioSemana` - Tendência Semanal (Line Chart)
4. `chartTempoMedioMes` - Tendência Mensal (Bar Chart)
5. `chartTempoMedioUnidade` - Por Unidade de Cadastro (Bar Chart Horizontal)
6. `chartTempoMedioUnidadeMes` - Por Unidade e Mês (Line Chart Múltiplas Linhas)

**Componentes Adicionais:**
- 4 KPIs: Média, Mediana, Mínimo, Máximo
- Ranking de órgãos/unidades

---

#### 6. **Por Tema** (`page-tema`)
**Gráficos:**
1. `chartTema` - Distribuição por Tema (Bar Chart Horizontal - Top 15)
2. `chartStatusTema` - Status por Tema (Doughnut Chart)
3. `chartTemaMes` - Temas por Mês (Bar Chart)

**Componentes Adicionais:**
- `heatmapTema` - Heatmap Mês × Tema
- Lista completa de temas
- Informações de status por tema

---

#### 7. **Por Assunto** (`page-assunto`)
**Gráficos:**
1. `chartAssunto` - Top 15 Assuntos (Bar Chart Horizontal)
2. `chartStatusAssunto` - Status por Assunto (Doughnut Chart)
3. `chartAssuntoMes` - Assuntos por Mês (Bar Chart)

**Componentes Adicionais:**
- `heatmapAssunto` - Heatmap Mês × Assunto
- Lista completa de assuntos
- Informações de status por assunto

---

#### 8. **Por Cadastrante** (`page-cadastrante`)
**Gráficos:**
1. `chartCadastranteMes` - Por Mês (Bar Chart)
2. `chartCadastranteTema` - Por Tema (Filtrado) - aparece quando há filtro
3. `chartCadastranteAssunto` - Por Assunto (Filtrado) - aparece quando há filtro
4. `chartCadastranteStatus` - Por Status (Filtrado) - aparece quando há filtro

**Componentes Adicionais:**
- Lista de servidores
- Lista de unidades de cadastro
- KPI: Total de manifestações cadastradas

---

#### 9. **Reclamações e Denúncias** (`page-reclamacoes`)
**Gráficos:**
1. `chartReclamacoesTipo` - Por Tipo de Ação (Doughnut Chart)
2. `chartReclamacoesMes` - Quantidade por Mês (Bar Chart)

**Componentes Adicionais:**
- Lista de assuntos relacionados a reclamações

---

#### 10. **Projeção 2026** (`page-projecao-2026`)
**Gráficos:**
1. `chartProjecaoMensal` - Projeção Mensal (Line Chart)
2. `chartProjecaoTema` - Projeção por Tema (Bar Chart)
3. `chartProjecaoStatus` - Projeção por Status (Bar Chart)

---

### 🏛️ Seção: Secretarias e Órgãos

#### 11. **Secretarias** (`page-secretaria`)
**Gráficos:**
1. `chartSecretaria` - Distribuição por Secretaria (Bar Chart Horizontal)
2. `chartSecretariaMes` - Secretarias por Mês (Bar Chart)

---

#### 12. **Secretarias e Distritos** (`page-secretarias-distritos`)
**Gráficos:**
1. `chartSecretariasDistritos` - Visualização Cruzada (Bar Chart Agrupado)

---

### 📋 Seção: Classificações

#### 13. **Tipos de Manifestação** (`page-tipo`)
**Gráficos:**
1. `chartTipo` - Distribuição por Tipo (Bar Chart Horizontal)

---

#### 14. **Status** (`page-status`)
**Gráficos:**
1. `chartStatus` - Distribuição por Status (Bar Chart Horizontal)
2. `chartStatusMes` - Status por Mês (Bar Chart)
3. `chartStatusTema` - Status por Tema (Bar Chart)
4. `chartStatusOrgao` - Status por Órgão (Bar Chart)

---

#### 15. **Categoria/Tema** (`page-categoria`)
**Gráficos:**
1. `chartCategoria` - Distribuição por Categoria (Bar Chart Horizontal)
2. `chartCategoriaMes` - Categorias por Mês (Bar Chart)

**Componentes Adicionais:**
- `heatmapCategoria` - Heatmap Mês × Categoria

---

#### 16. **Unidade de Cadastro** (`page-setor`)
**Gráficos:**
1. `chartSetor` - Distribuição por Setor (Bar Chart Horizontal)

---

#### 17. **UAC** (`page-uac`)
**Gráficos:**
1. `chartUAC` - Distribuição por UAC (Bar Chart Horizontal)

---

#### 18. **Responsáveis** (`page-responsavel`)
**Gráficos:**
1. `chartResponsavel` - Distribuição por Responsável (Bar Chart Horizontal)

---

#### 19. **Canais** (`page-canal`)
**Gráficos:**
1. `chartCanal` - Distribuição por Canal (Bar Chart Horizontal)

---

#### 20. **Prioridades** (`page-prioridade`)
**Gráficos:**
1. `chartPrioridade` - Distribuição por Prioridade (Bar Chart Horizontal)

---

#### 21. **Bairro** (`page-bairro`)
**Gráficos:**
1. `chartBairro` - Distribuição por Bairro (Bar Chart Horizontal)
2. `chartBairroMes` - Bairros por Mês (Bar Chart)

**Componentes Adicionais:**
- `heatmapBairro` - Heatmap Mês × Bairro

---

### 🏥 Seção: Unidades de Saúde

#### 22-39. **Unidades de Saúde** (`page-unit-*`)
**Páginas Dinâmicas:** Cada unidade tem sua própria página

**Unidades Disponíveis:**
- Hospital Adão (`page-unit-adao`)
- CER IV (`page-unit-cer-iv`)
- Hospital do Olho (`page-unit-hospital-olho`)
- Hospital Duque (`page-unit-hospital-duque`)
- Hospital Infantil (`page-unit-hospital-infantil`)
- Hospital Moacyr (`page-unit-hospital-moacyr`)
- Maternidade Santa Cruz (`page-unit-maternidade-santa-cruz`)
- UPA Beira Mar (`page-unit-upa-beira-mar`)
- UPH Pilar (`page-unit-uph-pilar`)
- UPH Saracuruna (`page-unit-uph-saracuruna`)
- UPH Xerém (`page-unit-uph-xerem`)
- Hospital Veterinário (`page-unit-hospital-veterinario`)
- UPA Walter Garcia (`page-unit-upa-walter-garcia`)
- UPH Campos Elíseos (`page-unit-uph-campos-eliseos`)
- UPH Parque Equitativa (`page-unit-uph-parque-equitativa`)
- UBS Antonio Granja (`page-unit-ubs-antonio-granja`)
- UPA Sarapuí (`page-unit-upa-sarapui`)
- UPH Imbariê (`page-unit-uph-imbarie`)

**Gráficos:** Variável por unidade (carregados dinamicamente via `loadUnit()`)

---

## 📊 Gráficos e Visualizações

### Tipos de Gráficos Utilizados

#### 1. **Gráficos de Barras (Bar Charts)**
- **Biblioteca:** Chart.js
- **Orientação:** Horizontal ou Vertical
- **Uso:** Comparação de valores entre categorias
- **Exemplos:**
  - Top órgãos, temas, assuntos
  - Distribuição por status, categoria, tipo
  - Dados mensais, semanais

#### 2. **Gráficos de Linha (Line Charts)**
- **Biblioteca:** Chart.js
- **Uso:** Visualização de tendências ao longo do tempo
- **Exemplos:**
  - Tendência mensal de manifestações
  - Tempo médio por dia/semana/mês
  - Projeções futuras

#### 3. **Gráficos de Pizza/Rosquinha (Doughnut Charts)**
- **Biblioteca:** Chart.js
- **Uso:** Distribuição proporcional
- **Exemplos:**
  - Status por tema/assunto
  - Tipos de ação (reclamações)

#### 4. **Heatmaps**
- **Biblioteca:** HTML/CSS customizado
- **Uso:** Visualização de dados cruzados (ex: Mês × Tema)
- **Exemplos:**
  - Heatmap Mês × Tema
  - Heatmap Mês × Assunto
  - Heatmap Mês × Categoria
  - Heatmap Mês × Bairro

#### 5. **Diagrama Sankey**
- **Biblioteca:** Plotly.js
- **Uso:** Visualização de fluxo entre categorias
- **Exemplo:**
  - Fluxo: Tema → Órgão → Status

#### 6. **TreeMap**
- **Biblioteca:** Plotly.js
- **Uso:** Visualização de proporções hierárquicas
- **Exemplo:**
  - Proporção por categoria

#### 7. **Mapa Geográfico**
- **Biblioteca:** Plotly.js ou Chart.js (fallback)
- **Uso:** Distribuição geográfica
- **Exemplo:**
  - Distribuição por bairro

#### 8. **Sparklines**
- **Biblioteca:** Canvas customizado
- **Uso:** Gráficos pequenos para KPIs
- **Exemplo:**
  - Tendência nos cards de KPI

---

### 📈 Detalhamento dos Gráficos por Página

#### **Página: Visão Geral (page-main)**

1. **chartTrend** (Gráfico de Tendência)
   - **Tipo:** Line Chart
   - **Dados:** Manifestações por mês
   - **Função:** Mostra a evolução temporal das manifestações
   - **Eixo X:** Meses formatados (ex: "Jan/2024")
   - **Eixo Y:** Quantidade de manifestações
   - **Características:** Preenchimento com gradiente, pontos interativos

2. **chartTopOrgaos** (Top Órgãos)
   - **Tipo:** Bar Chart (Horizontal)
   - **Dados:** Top 10 órgãos com mais manifestações
   - **Função:** Identifica os órgãos mais demandados
   - **Eixo X:** Quantidade
   - **Eixo Y:** Nome dos órgãos

3. **chartTopTemas** (Top Temas)
   - **Tipo:** Bar Chart (Horizontal)
   - **Dados:** Top 10 temas mais frequentes
   - **Função:** Identifica os temas mais recorrentes
   - **Eixo X:** Quantidade
   - **Eixo Y:** Nome dos temas

4. **chartFunnelStatus** (Funil por Status)
   - **Tipo:** Bar Chart
   - **Dados:** Top 6 status
   - **Função:** Mostra a distribuição das manifestações por status
   - **Cores:** Diferentes para cada status

5. **sankeyChart** (Diagrama Sankey)
   - **Tipo:** Sankey Diagram (Plotly)
   - **Dados:** Fluxo Tema → Órgão → Status
   - **Função:** Visualiza o fluxo de manifestações entre categorias
   - **Características:** Interativo, cores diferenciadas por categoria

6. **treemapChart** (TreeMap)
   - **Tipo:** TreeMap (Plotly)
   - **Dados:** Proporção por categoria/tema
   - **Função:** Mostra proporções visuais hierárquicas
   - **Características:** Cores automáticas, hover interativo

7. **mapChart** (Mapa Geográfico)
   - **Tipo:** Bar Chart Horizontal (Plotly) ou HTML (fallback)
   - **Dados:** Top 15 bairros
   - **Função:** Distribuição geográfica das manifestações
   - **Características:** Responsivo, fallback para Chart.js

8. **heatmap** (Heatmap Dinâmico)
   - **Tipo:** Tabela HTML com cores
   - **Dados:** Configurável por dimensão (Categoria, Tema, etc.)
   - **Função:** Visualização cruzada de duas dimensões
   - **Características:** Seletor de dimensão, cores graduais

9. **KPIs com Sparklines**
   - **Tipo:** Números + Sparklines
   - **Dados:** Total, últimos 7 dias, últimos 30 dias
   - **Função:** Indicadores-chave de performance
   - **Características:** Atualização em tempo real, gráficos pequenos

10. **Status Overview Cards**
    - **Tipo:** Cards HTML
    - **Dados:** Contagem por status
    - **Função:** Visão rápida da distribuição de status
    - **Características:** Cores por status, layout responsivo

---

#### **Página: Por Órgão e Mês (page-orgao-mes)**

1. **chartOrgaoMes** (Gráfico Mensal)
   - **Tipo:** Bar Chart (Horizontal)
   - **Dados:** Manifestações por mês
   - **Função:** Mostra a evolução mensal
   - **Eixo X:** Quantidade
   - **Eixo Y:** Meses

2. **Lista de Órgãos**
   - **Tipo:** Lista HTML com barras de progresso
   - **Dados:** Todos os órgãos com contagem
   - **Função:** Visualização rápida dos órgãos mais demandados
   - **Características:** Barras de progresso, ordenação por quantidade

3. **Tabela Cruzada**
   - **Tipo:** Tabela HTML
   - **Dados:** Órgão × Mês
   - **Função:** Visualização detalhada cruzada
   - **Características:** Totais por linha e coluna, destacamento

---

#### **Página: Tempo Médio (page-tempo-medio)**

1. **chartTempoMedio** (Tempo Médio por Órgão)
   - **Tipo:** Bar Chart (Horizontal)
   - **Dados:** Tempo médio em dias por órgão/unidade
   - **Função:** Identifica órgãos com maior tempo de resposta
   - **Eixo X:** Dias
   - **Eixo Y:** Órgãos/Unidades

2. **chartTempoMedioDia** (Tendência Diária)
   - **Tipo:** Line Chart
   - **Dados:** Tempo médio por dia (últimos 30 dias)
   - **Função:** Mostra variação diária do tempo de resposta
   - **Características:** Preenchimento, linha suave

3. **chartTempoMedioSemana** (Tendência Semanal)
   - **Tipo:** Line Chart
   - **Dados:** Tempo médio por semana (últimas 12 semanas)
   - **Função:** Mostra variação semanal
   - **Características:** Preenchimento, linha suave

4. **chartTempoMedioMes** (Tendência Mensal)
   - **Tipo:** Bar Chart
   - **Dados:** Tempo médio por mês (últimos 12 meses)
   - **Função:** Mostra variação mensal
   - **Eixo X:** Meses
   - **Eixo Y:** Dias

5. **chartTempoMedioUnidade** (Por Unidade de Cadastro)
   - **Tipo:** Bar Chart (Horizontal)
   - **Dados:** Tempo médio por unidade de cadastro
   - **Função:** Compara unidades
   - **Eixo X:** Dias
   - **Eixo Y:** Unidades

6. **chartTempoMedioUnidadeMes** (Por Unidade e Mês)
   - **Tipo:** Line Chart (Múltiplas Linhas)
   - **Dados:** Tempo médio por unidade e mês
   - **Função:** Compara evolução de múltiplas unidades
   - **Características:** Legenda, múltiplas séries

---

#### **Página: Por Tema (page-tema)**

1. **chartTema** (Distribuição por Tema)
   - **Tipo:** Bar Chart (Horizontal)
   - **Dados:** Top 15 temas
   - **Função:** Mostra os temas mais frequentes
   - **Eixo X:** Quantidade
   - **Eixo Y:** Temas

2. **chartStatusTema** (Status por Tema)
   - **Tipo:** Doughnut Chart
   - **Dados:** Distribuição de status para temas
   - **Função:** Mostra proporção de status
   - **Características:** Cores por status, porcentagens

3. **chartTemaMes** (Temas por Mês)
   - **Tipo:** Bar Chart
   - **Dados:** Temas ao longo dos meses
   - **Função:** Evolução temporal dos temas
   - **Eixo X:** Meses
   - **Eixo Y:** Quantidade

4. **heatmapTema** (Heatmap Mês × Tema)
   - **Tipo:** Tabela HTML com cores
   - **Dados:** Cruzamento Mês × Tema
   - **Função:** Visualização cruzada detalhada
   - **Características:** Cores graduais, intensidade proporcional

---

#### **Página: Por Assunto (page-assunto)**

1. **chartAssunto** (Top Assuntos)
   - **Tipo:** Bar Chart (Horizontal)
   - **Dados:** Top 15 assuntos
   - **Função:** Mostra os assuntos mais frequentes
   - **Eixo X:** Quantidade
   - **Eixo Y:** Assuntos

2. **chartStatusAssunto** (Status por Assunto)
   - **Tipo:** Doughnut Chart
   - **Dados:** Distribuição de status para assuntos
   - **Função:** Mostra proporção de status
   - **Características:** Cores por status, porcentagens

3. **chartAssuntoMes** (Assuntos por Mês)
   - **Tipo:** Bar Chart
   - **Dados:** Assuntos ao longo dos meses
   - **Função:** Evolução temporal dos assuntos
   - **Eixo X:** Meses
   - **Eixo Y:** Quantidade

4. **heatmapAssunto** (Heatmap Mês × Assunto)
   - **Tipo:** Tabela HTML com cores
   - **Dados:** Cruzamento Mês × Assunto
   - **Função:** Visualização cruzada detalhada
   - **Características:** Cores graduais, intensidade proporcional

---

#### **Página: Por Cadastrante (page-cadastrante)**

1. **chartCadastranteMes** (Por Mês)
   - **Tipo:** Bar Chart
   - **Dados:** Manifestações cadastradas por mês
   - **Função:** Evolução temporal do cadastramento
   - **Eixo X:** Meses
   - **Eixo Y:** Quantidade

2. **chartCadastranteTema** (Por Tema - Filtrado)
   - **Tipo:** Bar Chart
   - **Dados:** Temas quando há filtro ativo
   - **Função:** Análise específica do cadastrante/unidade filtrada
   - **Visibilidade:** Aparece apenas quando há filtro

3. **chartCadastranteAssunto** (Por Assunto - Filtrado)
   - **Tipo:** Bar Chart
   - **Dados:** Assuntos quando há filtro ativo
   - **Função:** Análise específica do cadastrante/unidade filtrada
   - **Visibilidade:** Aparece apenas quando há filtro

4. **chartCadastranteStatus** (Por Status - Filtrado)
   - **Tipo:** Bar Chart
   - **Dados:** Status quando há filtro ativo
   - **Função:** Análise específica do cadastrante/unidade filtrada
   - **Visibilidade:** Aparece apenas quando há filtro

---

#### **Página: Reclamações e Denúncias (page-reclamacoes)**

1. **chartReclamacoesTipo** (Por Tipo de Ação)
   - **Tipo:** Doughnut Chart
   - **Dados:** Distribuição por tipo de ação
   - **Função:** Mostra proporção de tipos de reclamações/denúncias
   - **Características:** Cores por tipo, porcentagens

2. **chartReclamacoesMes** (Quantidade por Mês)
   - **Tipo:** Bar Chart
   - **Dados:** Reclamações/denúncias por mês
   - **Função:** Evolução temporal
   - **Eixo X:** Meses
   - **Eixo Y:** Quantidade

---

#### **Página: Projeção 2026 (page-projecao-2026)**

1. **chartProjecaoMensal** (Projeção Mensal)
   - **Tipo:** Line Chart
   - **Dados:** Projeção de manifestações por mês em 2026
   - **Função:** Previsão de demanda futura
   - **Características:** Linha de tendência, dados projetados

2. **chartProjecaoTema** (Projeção por Tema)
   - **Tipo:** Bar Chart
   - **Dados:** Projeção por tema
   - **Função:** Previsão de temas mais frequentes
   - **Eixo X:** Temas
   - **Eixo Y:** Quantidade projetada

3. **chartProjecaoStatus** (Projeção por Status)
   - **Tipo:** Bar Chart
   - **Dados:** Projeção por status
   - **Função:** Previsão de distribuição de status
   - **Eixo X:** Status
   - **Eixo Y:** Quantidade projetada

---

#### **Páginas de Classificação (Status, Categoria, Tipo, etc.)**

Todas seguem o mesmo padrão:

1. **chart{Nome}** (Distribuição Principal)
   - **Tipo:** Bar Chart (Horizontal)
   - **Dados:** Top 15 itens
   - **Função:** Mostra distribuição principal
   - **Eixo X:** Quantidade
   - **Eixo Y:** Categorias

2. **chart{Nome}Mes** (Por Mês) - quando disponível
   - **Tipo:** Bar Chart
   - **Dados:** Evolução mensal
   - **Função:** Evolução temporal
   - **Eixo X:** Meses
   - **Eixo Y:** Quantidade

3. **heatmap{Nome}** (Heatmap) - quando disponível
   - **Tipo:** Tabela HTML com cores
   - **Dados:** Cruzamento Mês × Categoria
   - **Função:** Visualização cruzada

---

## 🔌 APIs e Endpoints

### Endpoints Principais:

#### Resumo e Agregações:
- `/api/summary` - Resumo geral (total, últimos 7/30 dias, status)
- `/api/aggregate/by-day` - Dados diários
- `/api/aggregate/by-month` - Dados mensais
- `/api/aggregate/by-theme` - Agregação por tema
- `/api/aggregate/by-subject` - Agregação por assunto
- `/api/aggregate/count-by?field={campo}` - Contagem por campo
- `/api/aggregate/count-by-orgao-mes` - Cruzamento órgão × mês
- `/api/aggregate/heatmap?dim={dimensao}` - Dados para heatmap
- `/api/aggregate/sankey-flow` - Dados para diagrama Sankey

#### Estatísticas:
- `/api/stats/average-time/stats` - Estatísticas de tempo médio
- `/api/stats/average-time/by-month` - Tempo médio por mês
- `/api/stats/average-time/by-day` - Tempo médio por dia
- `/api/stats/average-time/by-week` - Tempo médio por semana
- `/api/stats/average-time/by-unit` - Tempo médio por unidade
- `/api/stats/average-time/by-month-unit` - Tempo médio por unidade e mês
- `/api/stats/status-overview` - Visão geral de status

#### IA e Insights:
- `/api/ai/insights` - Insights gerados por IA

---

## ⚡ Funcionalidades Especiais

### 1. **Sistema de Cache Inteligente**
- Cache com TTL configurável
- Promise compartilhada para evitar requisições duplicadas
- Invalidação automática após tempo determinado

### 2. **Pré-carregamento em Background**
- Carrega outras páginas em background após carregar a atual
- Melhora experiência do usuário ao navegar
- Delay configurável entre pré-carregamentos

### 3. **Sistema de Filtros Globais**
- Filtros aplicáveis a todas as visualizações
- Indicador visual de filtros ativos
- Remoção fácil de filtros

### 4. **Exportação de Dados**
- Exportação em CSV
- Exportação em Excel
- Exportação de dados de gráficos
- Exportação de resumo

### 5. **Insights com IA**
- Análise automática de dados
- Recomendações baseadas em padrões
- Diferentes níveis de severidade
- Fallback para insights básicos se IA indisponível

### 6. **Responsividade**
- Layout adaptável para diferentes tamanhos de tela
- Gráficos responsivos
- Menu lateral colapsável

### 7. **Performance**
- Carregamento assíncrono
- Lazy loading de módulos
- Otimização de requisições
- Animações desabilitadas para melhor performance

---

## 📝 Notas Técnicas

### Carregamento de Páginas:
1. Usuário clica em item do menu
2. `main.js` identifica a página via `getPageLoader()`
3. Função de carregamento específica é chamada
4. Dados são carregados via `window.dataLoader`
5. Gráficos são renderizados após dados chegarem
6. Cache é atualizado

### Gerenciamento de Gráficos:
- Gráficos são destruídos antes de criar novos (evita memory leak)
- Verificação de visibilidade antes de renderizar
- Fallbacks para dados vazios
- Tratamento de erros robusto

### Estrutura de Dados:
- Dados vêm do backend em formato JSON
- Normalização automática de campos
- Validação de dados antes de renderizar
- Formatação de datas e números

---

## 🗄️ Estrutura do Banco de Dados

### Modelo de Dados (Prisma)

#### **Record** (Registros de Manifestações)
- **ID:** String (MongoDB ObjectId)
- **data:** JSON completo da planilha
- **Campos Normalizados:**
  - `protocolo`: Protocolo da manifestação
  - `dataDaCriacao`: Data de criação
  - `statusDemanda`: Status da demanda
  - `prazoRestante`: Prazo restante
  - `dataDaConclusao`: Data de conclusão
  - `tempoDeResolucaoEmDias`: Tempo de resolução
  - `prioridade`: Prioridade
  - `tipoDeManifestacao`: Tipo de manifestação
  - `tema`: Tema
  - `assunto`: Assunto
  - `canal`: Canal de entrada
  - `endereco`: Endereço
  - `unidadeCadastro`: Unidade de cadastro
  - `unidadeSaude`: Unidade de saúde
  - `status`: Status
  - `servidor`: Servidor responsável
  - `responsavel`: Responsável
  - `verificado`: Verificado
  - `orgaos`: Órgãos envolvidos
- **Campos ISO:**
  - `dataCriacaoIso`: Data de criação (YYYY-MM-DD)
  - `dataConclusaoIso`: Data de conclusão (YYYY-MM-DD)
- **Índices:** Múltiplos índices simples e compostos para otimização

#### **ChatMessage** (Mensagens do Chat)
- **ID:** String (MongoDB ObjectId)
- **text:** Texto da mensagem
- **sender:** 'user' ou 'cora'
- **createdAt:** Data de criação
- **Índices:** Data de criação

#### **AggregationCache** (Cache de Agregações)
- **ID:** String (MongoDB ObjectId)
- **key:** Chave única do cache
- **data:** Dados agregados pré-computados (JSON)
- **expiresAt:** Data de expiração
- **createdAt/updatedAt:** Timestamps
- **Índices:** Data de expiração

---

## ⚙️ Sistema de Cache e Performance

### Cache de Funções (`data-utils.js`)

#### **Sistema de Cache Genérico**
- **TTL Padrão:** 5 segundos
- **Armazenamento:** Map em memória
- **Funções:**
  - `getCachedData(functionName, ttl)`: Obtém dados do cache
  - `setCachedData(functionName, data)`: Armazena dados no cache
  - `clearCache(functionName)`: Limpa cache específico ou geral

#### **Sistema de Promises Compartilhadas**
- **Objetivo:** Evitar execuções simultâneas da mesma função
- **Função:** `getOrCreatePromise(functionName, promiseFactory)`
- **Comportamento:** Reutiliza Promise se já existe uma em execução

#### **Otimizador de Loaders**
- **Função:** `createOptimizedLoader(functionName, loaderFn, defaultTtl)`
- **Funcionalidade:** Aplica cache e Promise compartilhada automaticamente

### DataLoader (`dataLoader.js`)

#### **Características:**
- **Deduplicação:** Evita múltiplas requisições simultâneas para o mesmo endpoint
- **Timeout:** Configurável (padrão: 30 segundos)
- **Retries:** Sistema de tentativas (padrão: 1)
- **Fallback:** Valores padrão em caso de erro
- **Logging:** Sistema de logs integrado

#### **Métodos:**
- `load(endpoint, options)`: Carrega dados de um endpoint
- `loadMany(endpoints, options)`: Carrega múltiplos endpoints em paralelo
- `_fetchDirect(endpoint, options)`: Fetch direto com retry

---

## 🔍 Sistema de Filtros

### Estado Global (`filters.js`)
```javascript
window.globalFilters = {
  filters: [],           // Array de filtros ativos
  activeField: null,    // Campo atualmente filtrado
  activeValue: null,     // Valor do filtro ativo
  persist: true          // Persistir em localStorage
}
```

### Mapeamento de Gráficos para Campos
Cada gráfico tem um mapeamento para campo e operador:
- **Operadores:**
  - `eq`: Igual (exato) - para campos enum
  - `contains`: Contém (case-insensitive) - para campos de texto

### Funções Disponíveis:
- `applyGlobalFilter(field, value, chartId, element)`: Aplicar filtro (desabilitado)
- `clearGlobalFilters()`: Limpar todos os filtros
- `clearDateFilters()`: Limpar apenas filtros de data
- `restoreFilters()`: Restaurar filtros do localStorage
- `updateFilterIndicator()`: Atualizar indicador visual
- `updatePageTitle()`: Atualizar título da página

### Campos Filtravels:
- Status, Tema, Categoria, Tipo, Canal, Prioridade (operador: `eq`)
- Órgãos, Secretaria, Assunto, Bairro, Setor, UAC, Responsável (operador: `contains`)
- Data, Mês (operador: `contains`)

---

## 📤 Sistema de Exportação

### Funções de Exportação Disponíveis:

#### 1. **exportCSV()**
- **Formato:** CSV (Comma-Separated Values)
- **Dados:** Registros da tabela atual
- **Limite:** Configurável (padrão: 50, máximo: 10000, opção: "all")
- **Colunas:** Todas as colunas dos registros
- **Encoding:** UTF-8 com BOM para Excel

#### 2. **exportExcel()**
- **Formato:** XLSX (Excel)
- **Biblioteca:** SheetJS (XLSX)
- **Dados:** Registros da tabela atual
- **Limite:** Configurável
- **Características:**
  - Largura de colunas ajustada automaticamente
  - Ordem de colunas priorizada
  - Formatação preservada

#### 3. **exportChartData()**
- **Formato:** JSON ou CSV
- **Dados:** Dados dos gráficos visíveis
- **Conteúdo:** Labels, valores, datasets
- **Uso:** Análise de dados dos gráficos

#### 4. **exportSummary()**
- **Formato:** JSON
- **Dados:** Resumo geral do sistema
- **Conteúdo:**
  - Total de manifestações
  - Últimos 7/30 dias
  - Distribuição por status
  - Estatísticas agregadas

### Interface de Exportação:
- Menu dropdown com opções
- Seletor de limite de registros
- Botões de ação rápida

---

## 🛠️ Utilitários e Helpers

### Formatação (`utils.js`)

#### **Funções de Formatação:**
- `formatDate(date)`: Formata data para pt-BR
- `formatNumber(value)`: Formata número com separadores
- `formatPercentage(value)`: Formata porcentagem
- `formatMonth(ym)`: Formata mês/ano

#### **Funções de Gráficos:**
- `createEnhancedTooltip()`: Cria tooltip customizado
- `createDataLabelsConfig()`: Configura labels de dados
- `gradient(ctx, color1, color2)`: Cria gradiente para gráficos
- `showClickFeedback()`: Feedback visual em cliques

### Datas (`dateUtils.js`)

#### **Funções de Data:**
- `getToday()`: Data atual
- `getCurrentMonth()`: Mês atual
- `getCurrentYear()`: Ano atual
- `getCurrentWeek()`: Semana atual
- `formatDate(date)`: Formata data
- `formatMonthYear(ym)`: Formata mês/ano
- `formatMonthYearShort(ym)`: Formata mês/ano (curto)
- `formatDateShort(date)`: Formata data (curto)
- `daysBetween(date1, date2)`: Calcula dias entre datas
- `getMonthStart(ym)`: Início do mês
- `getMonthEnd(ym)`: Fim do mês
- `isToday(date)`: Verifica se é hoje
- `isCurrentMonth(ym)`: Verifica se é mês atual
- `isValidMonthFormat(ym)`: Valida formato de mês

### Configuração (`config.js`)

#### **Nomes de Campos:**
- Centralização de todos os nomes de campos
- Mapeamento para labels exibidos
- Função `getFieldLabel(field)`

#### **Endpoints de API:**
- Centralização de todos os endpoints
- Função `buildEndpoint(endpoint, params)` para construir URLs

#### **Configurações de Gráficos:**
- **Cores:** Paleta padrão e cores temáticas
- **Performance:** Limites de pontos, labels, animações
- **Tooltip:** Configurações visuais
- **Data Labels:** Configurações de exibição

#### **Configurações de Pesquisa/Filtros:**
- Operadores padrão por tipo de campo
- Campos que suportam busca por texto
- Campos que são enums/listas

#### **Configurações de Formatação:**
- Locale (pt-BR)
- Formatos de data
- Nomes dos meses
- Configurações de número e porcentagem

#### **Configurações de Performance:**
- Limites de requisições concorrentes
- Timeout de requisições
- Número de tentativas
- Limites de dados

---

## 🔬 Sistema de Diagnóstico

### Funcionalidades (`diagnostic.js`)

#### **Rastreamento:**
- Rastreia carregamento de todos os componentes
- Verifica existência de elementos no DOM
- Registra erros com detalhes
- Gera relatórios completos
- Auto-relatório após 10 segundos

#### **Métodos:**
- `start(componentName)`: Inicia rastreamento
- `success(componentName, data)`: Marca como sucesso
- `error(componentName, error, data)`: Registra erro
- `checkElement(elementId, name)`: Verifica elemento
- `showReport()`: Exibe relatório completo

#### **Informações Rastreadas:**
- Status de cada componente (✅ sucesso, ❌ erro, 🟡 carregando)
- Tempo de execução
- Existência de elementos no DOM
- Visibilidade de elementos
- Tamanho de elementos (width/height)
- Display CSS
- Mensagens de erro detalhadas

---

## 💬 Sistema de Chat (Cora)

### Funcionalidades:
- Interface de chat integrada
- Mensagens do usuário e do assistente
- Histórico de conversas
- Integração com IA para respostas

### Endpoints:
- `GET /api/chat/messages`: Obter mensagens
- `POST /api/chat/send`: Enviar mensagem
- `POST /api/chat/reindex`: Reindexar mensagens

### Modelo de Dados:
- **ChatMessage:** Armazena mensagens do chat
- **Campos:** text, sender ('user' ou 'cora'), createdAt

---

## 🔧 Manutenção e Extensibilidade

### Adicionar Nova Página:
1. Adicionar botão no menu (`index.html`)
2. Criar seção HTML (`<section id="page-{nome}">`)
3. Criar função de carregamento (`load{Nome}()`)
4. Adicionar mapeamento em `main.js` → `getPageLoader()`
5. Implementar renderização de gráficos

### Adicionar Novo Gráfico:
1. Adicionar elemento `<canvas>` no HTML
2. Criar função de renderização
3. Chamar função após carregar dados
4. Adicionar ao cache se necessário

### Adicionar Novo Endpoint:
1. Criar rota no backend (`src/server.js`)
2. Implementar lógica de consulta
3. Retornar JSON formatado
4. Usar `window.dataLoader.load()` no frontend

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs no console do navegador
2. Verificar logs do servidor
3. Consultar documentação de APIs
4. Verificar estrutura de dados no banco

---

**Última Atualização:** Janeiro 2025  
**Versão do Documento:** 1.0

