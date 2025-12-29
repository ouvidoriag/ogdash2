# 📊 SISTEMA DE GRÁFICOS

**Data:** 11/12/2025  
**CÉREBRO X-3**

---

## 🎨 CHART FACTORY

**Arquivo:** `core/chart-factory.js`  
**Função:** Biblioteca abstrata para criação de gráficos padronizados

### Tipos de Gráficos Suportados

#### 1. **Barras (Bar Chart)**
```javascript
await window.chartFactory.createBarChart(canvasId, labels, values, {
  horizontal: false,  // true = horizontal, false = vertical
  colorIndex: 0,
  label: 'Manifestações'
});
```

**Uso:** Comparação de valores, rankings, distribuições

#### 2. **Pizza (Pie Chart)**
```javascript
await window.chartFactory.createPieChart(canvasId, labels, values, {
  colorIndex: 1,
  showPercentages: true
});
```

**Uso:** Proporções, distribuições percentuais

#### 3. **Rosca (Doughnut Chart)**
```javascript
await window.chartFactory.createDoughnutChart(canvasId, labels, values, {
  colorIndex: 2
});
```

**Uso:** Similar a pizza, mas com área central

#### 4. **Linha (Line Chart)**
```javascript
await window.chartFactory.createLineChart(canvasId, labels, values, {
  colorIndex: 3,
  fill: true
});
```

**Uso:** Tendências temporais, evolução

---

## 🎨 SISTEMA DE CORES INTELIGENTE

### Cores por Tipo de Manifestação

- **Elogio:** Verde (`#10b981`)
- **Reclamação:** Laranja (`#f97316`)
- **Denúncia:** Vermelho (`#ef4444`)
- **Sugestão:** Azul (`#3b82f6`)
- **E-SIC:** Amarelo (`#eab308`)

### Cores por Status

- **Aberto/Em Andamento:** Azul (`#3b82f6`)
- **Pendente:** Amarelo (`#f59e0b`)
- **Fechado/Concluído:** Verde (`#10b981`)
- **Vencido/Atrasado:** Vermelho (`#ef4444`)
- **Cancelado:** Cinza (`#94a3b8`)

### Cores por Canal

- **Site/Online:** Cyan (`#06b6d4`)
- **E-mail:** Azul (`#3b82f6`)
- **Presencial:** Verde (`#10b981`)
- **Telefone:** Amarelo (`#f59e0b`)
- **WhatsApp:** Verde WhatsApp (`#25d366`)

### Cores por Prioridade

- **Alta/Urgente:** Vermelho (`#ef4444`)
- **Média:** Amarelo (`#f59e0b`)
- **Baixa/Normal:** Verde (`#10b981`)

---

## 📈 GRÁFICOS POR PÁGINA

### 🟧 OUVIDORIA

#### Página: Overview (Visão Geral)

**Gráficos de Pizza/Doughnut:**
- `chartFunnelStatus` - Distribuição por status das demandas
- `chartTiposManifestacao` - Distribuição por tipos de manifestação
- `chartCanais` - Distribuição por canais de atendimento (Top 8)
- `chartPrioridades` - Distribuição por níveis de prioridade
- `chartSLA` - Distribuição por faixas de SLA

**Gráficos de Barra:**
- `chartDailyDistribution` - Distribuição diária (últimos 30 dias) - Vertical
- `chartTopOrgaos` - Top 5 órgãos com mais demandas - Horizontal
- `chartTopTemas` - Top 5 temas mais frequentes - Horizontal
- `chartUnidadesCadastro` - Top 5 unidades de cadastro - Horizontal

#### Página: Status

**Gráficos de Pizza/Doughnut:**
- `chartStatusPage` - Distribuição detalhada por status

**Gráficos de Barra:**
- `chartStatusMes` - Evolução de status ao longo dos meses - Vertical (Multi-dataset)

#### Página: Tipo

**Gráficos de Pizza/Doughnut:**
- `chartTipo` - Distribuição por tipos de manifestação (Top 20)

#### Página: Tema

**Gráficos de Pizza/Doughnut:**
- `chartStatusTema` - Status das demandas filtradas por tema

**Gráficos de Barra:**
- `chartTema` - Distribuição por temas - Horizontal
- `chartTemaMes` - Evolução de temas ao longo dos meses - Vertical (Multi-dataset)

#### Página: Assunto

**Gráficos de Pizza/Doughnut:**
- `chartStatusAssunto` - Status das demandas filtradas por assunto

**Gráficos de Barra:**
- `chartAssunto` - Distribuição por assuntos - Horizontal
- `chartAssuntoMes` - Evolução de assuntos ao longo dos meses - Vertical (Multi-dataset)

#### Página: Bairro

**Gráficos de Barra:**
- `chartBairro` - Distribuição por bairros - Horizontal
- `chartBairroMes` - Evolução de bairros ao longo dos meses - Vertical (Multi-dataset)

#### Página: Canal

**Gráficos de Pizza/Doughnut:**
- `chartCanal` - Distribuição por canais de atendimento

#### Página: Prioridade

**Gráficos de Pizza/Doughnut:**
- `chartPrioridade` - Distribuição por níveis de prioridade

#### Página: Responsável

**Gráficos de Barra:**
- `chartResponsavel` - Distribuição por responsáveis - Horizontal

#### Página: Cadastrante

**Gráficos de Barra:**
- `chartCadastranteMes` - Evolução de cadastrantes ao longo dos meses - Vertical

#### Página: Órgão/Mês

**Gráficos de Barra:**
- `chartOrgaoMes` - Evolução de órgãos ao longo dos meses - Vertical (Multi-dataset)
- `chartTopOrgaosBar` - Top órgãos em formato de barra - Horizontal

#### Página: Tempo Médio

**Gráficos de Barra:**
- `chartTempoMedio` - Tempo médio de resolução por período - Horizontal
- `chartTempoMedioUnidade` - Tempo médio por unidade - Horizontal

#### Página: Projeção 2026

**Gráficos de Pizza/Doughnut:**
- `chartProjecaoTipo` - Projeção por tipo de manifestação

**Gráficos de Barra:**
- `chartCrescimentoPercentual` - Crescimento percentual projetado - Vertical
- `chartSazonalidade` - Padrão de sazonalidade - Vertical
- `chartProjecaoTema` - Projeção por tema - Horizontal

#### Página: Unidades de Saúde

**Gráficos de Pizza/Doughnut:**
- `chartUnidade{UnitName}Tipos` - Tipos de manifestação por unidade (dinâmico)

#### Página: Reclamações

**Gráficos de Barra:**
- `chartReclamacoesTipo` - Distribuição de reclamações por tipo - Horizontal
- `chartReclamacoesMes` - Evolução de reclamações ao longo dos meses - Vertical

#### Página: Notificações

**Gráficos de Pizza/Doughnut:**
- `notificacoes-chart-tipo` - Distribuição por tipo de notificação

### 🟦 E-SIC

#### Página: Overview (Visão Geral)

**Gráficos de Pizza/Doughnut:**
- `esic-chart-status` - Distribuição por status das solicitações

**Gráficos de Barra:**
- `esic-chart-tipo-informacao` - Top 10 tipos de informação solicitada - Horizontal
- `esic-chart-responsavel` - Top 10 responsáveis - Horizontal

#### Página: Status

**Gráficos de Barra:**
- `esic-chart-status-detail` - Distribuição detalhada por status - Horizontal

#### Página: Tipo de Informação

**Gráficos de Barra:**
- `esic-chart-tipo-informacao-detail` - Distribuição detalhada por tipo de informação - Horizontal

#### Página: Canal

**Gráficos de Barra:**
- `esic-chart-canal-detail` - Distribuição por canal de entrada - Horizontal

#### Página: Unidade

**Gráficos de Barra:**
- `esic-chart-unidade-detail` - Distribuição por unidade de contato - Horizontal

#### Página: Responsável

**Gráficos de Barra:**
- `esic-chart-responsavel-detail` - Distribuição detalhada por responsável - Horizontal

### 🟩 ZELADORIA

#### Página: Overview (Visão Geral)

**Gráficos de Pizza/Doughnut:**
- `zeladoria-chart-status` - Distribuição por status das demandas

**Gráficos de Barra:**
- `zeladoria-chart-categoria` - Top 10 categorias de demanda - Horizontal
- `zeladoria-chart-departamento` - Distribuição por departamento responsável - Horizontal

#### Página: Status

**Gráficos de Pizza/Doughnut:**
- `zeladoria-status-chart` - Distribuição detalhada por status

**Gráficos de Barra:**
- `zeladoria-status-mes-chart` - Evolução de status ao longo dos meses - Vertical (Multi-dataset)

#### Página: Categoria

**Gráficos de Barra:**
- `zeladoria-categoria-chart` - Distribuição por categorias - Horizontal
- `zeladoria-categoria-mes-chart` - Evolução de categorias ao longo dos meses - Vertical (Multi-dataset)
- `zeladoria-categoria-dept-chart` - Categorias por departamento - Horizontal (Multi-dataset)

#### Página: Departamento

**Gráficos de Barra:**
- `zeladoria-departamento-chart` - Distribuição por departamentos - Horizontal
- `zeladoria-departamento-mes-chart` - Evolução de departamentos ao longo dos meses - Vertical (Multi-dataset)

#### Página: Bairro

**Gráficos de Barra:**
- `zeladoria-bairro-chart` - Distribuição por bairros - Horizontal
- `zeladoria-bairro-mes-chart` - Evolução de bairros ao longo dos meses - Vertical (Multi-dataset)

#### Página: Canal

**Gráficos de Pizza/Doughnut:**
- `zeladoria-canal-chart` - Distribuição por canais de entrada

**Gráficos de Barra:**
- `zeladoria-canal-mes-chart` - Evolução de canais ao longo dos meses - Vertical (Multi-dataset)

#### Página: Responsável

**Gráficos de Barra:**
- `zeladoria-responsavel-chart` - Top 20 responsáveis - Horizontal
- `zeladoria-responsavel-mes-chart` - Evolução de responsáveis ao longo dos meses (Top 10) - Vertical (Multi-dataset)

#### Página: Mensal

**Gráficos de Barra:**
- `zeladoria-mensal-status-chart` - Evolução mensal por status - Vertical (Multi-dataset)

#### Página: Tempo

**Gráficos de Barra:**
- `zeladoria-tempo-distribuicao-chart` - Distribuição por faixas de tempo de resolução - Horizontal

### 🟣 PAINEL CENTRAL

#### Página: Dashboard Central

**Gráficos de Barra:**
- `chartVolumeSistemas` - Volume comparativo entre sistemas (Zeladoria, Ouvidoria, E-SIC, CORA) - Vertical

---

## 📊 RESUMO ESTATÍSTICO

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

## 🔧 NOTAS TÉCNICAS

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

## 📝 MÉTODOS DE CRIAÇÃO

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

## 🔧 CONFIGURAÇÕES DE PERFORMANCE

```javascript
PERFORMANCE: {
  MAX_POINTS: 100,           // Máximo de pontos em gráficos
  MAX_LABELS: 15,            // Máximo de labels
  ANIMATION_DURATION: 0,     // Duração de animação (0 = desabilitado)
  POINT_RADIUS: 3,          // Raio dos pontos
  POINT_HOVER_RADIUS: 5     // Raio ao passar mouse
}
```

---

## 🎯 DETECÇÃO AUTOMÁTICA DE CATEGORIA

O Chart Factory detecta automaticamente a categoria do gráfico baseado em:
- Nome do campo
- ID do canvas
- Labels do gráfico

Isso permite aplicar cores semânticas automaticamente.

---

## 🌓 MODO CLARO/ESCURO

O sistema suporta ambos os modos:
- **Modo Escuro:** Cores mais claras e vibrantes
- **Modo Claro:** Cores mais escuras para contraste

As cores são ajustadas automaticamente.

---

## 🔄 INTEGRAÇÃO COM FILTROS

Todos os gráficos podem:
- Aplicar filtros ao clicar
- Reagir a filtros aplicados
- Mostrar feedback visual quando filtrados

---

## ✅ CHECKUP DO SISTEMA DE GRÁFICOS

- [x] Chart Factory funcional
- [x] Todos os tipos de gráficos implementados
- [x] Sistema de cores inteligente funcionando
- [x] Detecção automática de categoria
- [x] Modo claro/escuro suportado
- [x] Performance otimizada
- [x] Integração com filtros funcionando

---

**Última Atualização:** 11/12/2025

