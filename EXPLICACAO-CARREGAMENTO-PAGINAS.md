# 📊 Explicação: Como as Páginas Carregam seus Dados

*Data: 13/11/2025*

## 🎯 Visão Geral: Como Funciona o Carregamento

O sistema usa um padrão de **SPA (Single Page Application)** onde todas as páginas são carregadas dinamicamente sem recarregar a página completa. O arquivo `main.js` é o orquestrador principal que decide qual função chamar quando uma página é acessada.

---

## 📄 PÁGINA "VISÃO GERAL" (Overview)

### 🔄 Fluxo de Carregamento

1. **Trigger (Gatilho)**: Usuário clica no botão "Visão Geral" no menu
2. **Orquestrador**: `main.js` → `getPageLoader('main')` → retorna `loadOverview`
3. **Função Principal**: `loadOverview()` em `data-overview.js`

### 📦 Dados Carregados (em PARALELO)

A página carrega **5 endpoints simultaneamente** usando `Promise.all()`:

```javascript
const [summary, byMonth, orgaos, temas, dailyData] = await Promise.all([
  '/api/summary',                    // Resumo geral (total, últimos 7/30 dias, status)
  '/api/aggregate/by-month',        // Dados mensais (tendência)
  '/api/aggregate/count-by?field=Orgaos',  // Top órgãos
  '/api/aggregate/by-theme',        // Top temas
  '/api/aggregate/by-day'           // Dados diários (sparklines)
]);
```

### 🎨 Gráficos Renderizados

Após carregar os dados, a função `renderOverviewData()` renderiza:

1. **KPIs** (Números principais):
   - Total de manifestações
   - Últimos 7 dias
   - Últimos 30 dias
   - Delta vs mês anterior

2. **Gráfico de Tendência** (`chartTrend`):
   - Tipo: Line Chart
   - Dados: `byMonth` (dados mensais)
   - Eixo X: Meses formatados
   - Eixo Y: Quantidade de manifestações

3. **Top Órgãos** (`chartTopOrgaos`):
   - Tipo: Bar Chart (horizontal)
   - Dados: `orgaos` (top 10)
   - Mostra os órgãos com mais manifestações

4. **Top Temas** (`chartTopTemas`):
   - Tipo: Bar Chart (horizontal)
   - Dados: `temas` (top 10)
   - Mostra os temas mais frequentes

5. **Funil por Status** (`chartFunnelStatus`):
   - Tipo: Bar Chart
   - Dados: `summary.statusCounts` (top 6 status)
   - Mostra distribuição por status

6. **Gráficos Avançados** (carregados depois):
   - Sankey Chart (fluxo)
   - TreeMap (proporção por categoria)
   - Mapa Geográfico (distribuição por bairro)
   - Heatmap (configurável por dimensão)

7. **Componentes Adicionais**:
   - Status Overview Cards
   - Insights com IA (em background)
   - Sparklines (gráficos pequenos)

### ⚡ Otimizações

- ✅ **Cache**: TTL de 5 segundos
- ✅ **Promise Compartilhada**: Evita múltiplas execuções simultâneas
- ✅ **Carregamento Paralelo**: Todos os dados em `Promise.all()`
- ✅ **Carregamento em Background**: Insights e gráficos avançados não bloqueiam
- ✅ **Fallbacks**: Dados vazios se API falhar

---

## 📄 PÁGINA "POR ÓRGÃO E MÊS" (OrgaoMes)

### 🔄 Fluxo de Carregamento

1. **Trigger**: Usuário clica no botão "Por Órgão e Mês" no menu
2. **Orquestrador**: `main.js` → `getPageLoader('orgao-mes')` → retorna `loadOrgaoMes`
3. **Função Principal**: `loadOrgaoMes()` em `data.js`

### 📦 Dados Carregados (em SEQUÊNCIA)

A página carrega **3 endpoints em sequência**:

```javascript
// 1. Primeiro: Lista de órgãos
const dataOrgaos = await window.dataLoader.load('/api/aggregate/count-by?field=Secretaria');

// 2. Segundo: Dados mensais (para gráfico)
const dataMensal = await window.dataLoader.load('/api/aggregate/by-month');

// 3. Terceiro: Tabela cruzada (órgão x mês)
const dataOrgaoMes = await window.dataLoader.load('/api/aggregate/count-by-orgao-mes');
```

### 🎨 Componentes Renderizados

1. **Lista de Órgãos** (`listaOrgaos`):
   - Visualização estilo Looker Studio
   - Barras horizontais com gradiente
   - Mostra quantidade por órgão

2. **Gráfico Mensal** (`chartOrgaoMes`):
   - Tipo: Bar Chart (horizontal)
   - Dados: `dataMensal` (dados mensais)
   - Eixo X: Quantidade
   - Eixo Y: Meses formatados

3. **Tabela Cruzada** (`tabelaOrgaoMes`):
   - Linhas: Órgãos
   - Colunas: Meses
   - Células: Quantidade de manifestações
   - Linha de totais no final

4. **KPIs**:
   - Total de órgãos (`totalOrgaos`)
   - Total geral (`totalOrgaoMes`)

### ⚡ Otimizações

- ✅ **Cache**: Verifica cache antes de fazer requisições
- ✅ **Promise Compartilhada**: Usa `getOrCreatePromise()` para evitar duplicação
- ✅ **Verificação de Visibilidade**: Só carrega se a página estiver visível
- ✅ **Renderização com Cache**: Função `renderOrgaoMesData()` para reutilizar dados em cache

---

## 🔍 PRINCIPAIS DIFERENÇAS

| Aspecto | Visão Geral | Por Órgão e Mês |
|---------|-------------|-----------------|
| **Módulo** | `data-overview.js` | `data.js` |
| **Carregamento** | **Paralelo** (Promise.all) | **Sequencial** (await em sequência) |
| **Endpoints** | 5 endpoints simultâneos | 3 endpoints em sequência |
| **Gráficos** | 6+ gráficos diferentes | 1 gráfico + tabela |
| **Complexidade** | Alta (muitos componentes) | Média (foco em tabela) |
| **Cache** | TTL de 5 segundos | Cache genérico |
| **Dependências** | Múltiplas (KPIs, gráficos avançados) | Poucas (apenas dados básicos) |
| **Carregamento em Background** | Sim (insights, gráficos avançados) | Não (tudo carrega junto) |

---

## 🐛 PROBLEMA ATUAL: Por Órgão e Mês

### ❌ O que está acontecendo:

1. **Função não encontrada**: `window.data.loadOrgaoMes` está `undefined`
2. **Logs não aparecem**: Os logs de exportação imediata não aparecem no console
3. **Timeout**: O sistema aguarda 5 segundos mas a função nunca aparece

### 🔍 Possíveis Causas:

1. **Erro de Sintaxe**: Pode haver um erro que impede a execução do código de exportação
2. **Ordem de Carregamento**: O arquivo `data.js` pode não estar sendo executado completamente
3. **Cache do Navegador**: O navegador pode estar usando uma versão antiga do arquivo

### ✅ Soluções Aplicadas:

1. **Exportação Imediata**: Funções exportadas logo após definição (não no final do arquivo)
2. **IIFE com Try-Catch**: Exportações envolvidas em IIFE para capturar erros
3. **Logs de Debug**: Logs adicionados para rastrear a execução

---

## 🧪 Como Verificar o Problema

### 1. Verificar se o arquivo está sendo carregado:
```javascript
// No console do navegador
console.log('data.js carregado:', typeof window.data);
```

### 2. Verificar se a função está definida:
```javascript
// No console do navegador
console.log('loadOrgaoMes definido:', typeof loadOrgaoMes);
```

### 3. Verificar se foi exportado:
```javascript
// No console do navegador
console.log('loadOrgaoMes em window.data:', typeof window.data?.loadOrgaoMes);
```

### 4. Verificar logs de exportação:
Procure no console por:
- `✅ loadOrgaoMes exportado imediatamente após definição`
- `❌ Erro ao exportar loadOrgaoMes: ...`

---

## 📝 Resumo

**Visão Geral**:
- ✅ Carrega tudo em paralelo
- ✅ Múltiplos gráficos e componentes
- ✅ Funciona corretamente

**Por Órgão e Mês**:
- ❌ Carrega em sequência
- ❌ Função não está sendo exportada corretamente
- ❌ Precisa de correção na exportação

---

*Documentação criada em 13/11/2025*

