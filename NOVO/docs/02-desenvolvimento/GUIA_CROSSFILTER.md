# 🔄 Guia Completo: Sistema Crossfilter e Filtros

**Sistema:** Dashboard de Ouvidoria  
**Data:** 12/12/2025  
**CÉREBRO X-3**

---

## 📋 Visão Geral

O sistema de filtros do Dashboard Municipal é **multi-dimensional** e **inteligente**, permitindo filtrar dados de múltiplas formas simultaneamente, similar ao Power BI ou Looker.

### Características Principais:

- ✅ **Filtros Multi-dimensionais**: Status + Tema + Órgão + Tipo + etc. simultaneamente
- ✅ **Cross-filter Inteligente**: Clique em gráfico = filtra todo o painel
- ✅ **Seleção Múltipla**: Ctrl+Clique para adicionar/remover filtros
- ✅ **Banner Visual**: Mostra filtros ativos com botão de remoção individual
- ✅ **Bidirecional**: Todos os gráficos reagem aos filtros
- ✅ **Backend Otimizado**: Filtros aplicados no MongoDB (performance)

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │ Crossfilter      │    │ Global Filters   │          │
│  │ Overview         │◄──►│ (chart-comm)     │          │
│  │ (overview.js)    │    │                  │          │
│  └────────┬─────────┘    └────────┬─────────┘          │
│           │                       │                     │
│           │                       │                     │
│  ┌────────▼───────────────────────▼─────────┐          │
│  │        Chart Communication                │          │
│  │        (global-filters.js)                │          │
│  └───────────────────┬───────────────────────┘          │
│                      │                                   │
│                      │ POST /api/filter                  │
│                      ▼                                   │
├─────────────────────────────────────────────────────────┤
│                    BACKEND                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │      filterController.js                 │           │
│  │  (POST /api/filter)                      │           │
│  │                                           │           │
│  │  • Recebe filtros                        │           │
│  │  • Converte para query MongoDB           │           │
│  │  • Aplica filtros                        │           │
│  │  • Retorna dados filtrados               │           │
│  └───────────────┬──────────────────────────┘           │
│                  │                                       │
│                  ▼                                       │
│  ┌──────────────────────────────────────────┐           │
│  │           MongoDB Atlas                  │           │
│  │      (Aplica filtros na query)           │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔀 Tipos de Filtros

### 1. **Crossfilter Overview** (Página Visão Geral)

**Arquivo:** `core/crossfilter-overview.js`  
**Localização:** Página Overview (`overview.js`)

**Funcionalidade:**
- Filtros multi-dimensionais estilo Power BI
- Clique esquerdo = aplica filtro
- Ctrl+Clique = seleção múltipla (adiciona/remove)
- Clique direito = limpa TODOS os filtros
- Banner visual com filtros ativos

**Métodos Disponíveis:**
```javascript
// Aplicar filtros
window.crossfilterOverview.setStatusFilter(status, multiSelect)
window.crossfilterOverview.setTemaFilter(tema, multiSelect)
window.crossfilterOverview.setOrgaosFilter(orgaos, multiSelect)
window.crossfilterOverview.setTipoFilter(tipo, multiSelect)
window.crossfilterOverview.setCanalFilter(canal, multiSelect)
window.crossfilterOverview.setPrioridadeFilter(prioridade, multiSelect)
window.crossfilterOverview.setUnidadeFilter(unidade, multiSelect)
window.crossfilterOverview.setBairroFilter(bairro, multiSelect)

// Limpar filtros
window.crossfilterOverview.clearAllFilters()
window.crossfilterOverview.clearFilter(field)

// Listeners
window.crossfilterOverview.onFilterChange(callback)
window.crossfilterOverview.notifyListeners()
```

### 2. **Global Filters** (Sistema Geral)

**Arquivo:** `core/chart-communication/global-filters.js`  
**Localização:** Usado por todas as páginas

**Funcionalidade:**
- Sistema de filtros global compartilhado
- Permite múltiplos filtros simultâneos
- Integração com gráficos via `chartCommunication`

**Métodos Disponíveis:**
```javascript
// Aplicar filtro
window.chartCommunication.filters.apply(field, value, chartId, options)

// Opções:
// - toggle: true/false (remover se já existe)
// - clearPrevious: true/false (limpar filtros anteriores)
// - operator: 'eq', 'contains', 'gte', 'lte', etc.

// Limpar filtros
window.chartCommunication.filters.clear()
window.chartCommunication.filters.remove(field, value)

// Obter filtros ativos
const activeFilters = window.chartCommunication.filters.filters
```

### 3. **Filtros por Página** (Filtros Específicos)

**Arquivo:** Varia por página (ex: `tempo-medio.js`)  
**Localização:** Cada página específica

**Funcionalidade:**
- Filtros específicos de uma página (ex: filtro por mês)
- Combinam com filtros globais automaticamente
- Coletados via função `coletarFiltros{nomePagina}()`

**Exemplo (Tempo Médio):**
```javascript
// Coletar filtros da página
function coletarFiltrosTempoMedio() {
  const filtros = [];
  const mesFiltro = document.getElementById('filtroMesTempoMedio')?.value;
  
  if (mesFiltro) {
    // Criar filtros de data (gte e lte)
    filtros.push({
      field: 'dataCriacaoIso',
      op: 'gte',
      value: `${mesFiltro}-01`
    });
    filtros.push({
      field: 'dataCriacaoIso',
      op: 'lte',
      value: `${mesFiltro}-31`
    });
  }
  
  return filtros;
}
```

---

## ⚙️ Como Funciona

### Fluxo Completo de Filtragem

```
┌─────────────────────────────────────────────────────────┐
│ PASSO 1: Usuário interage (clique em gráfico ou select)│
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ PASSO 2: Frontend coleta filtro                        │
│ • Crossfilter ou Global Filters aplicam filtro         │
│ • Ou página coleta filtro específico                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ PASSO 3: Combinar filtros                              │
│ • Filtros globais (de outros gráficos)                  │
│ • Filtros da página (específicos)                       │
│ • = activeFilters (array combinado)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ PASSO 4: Fazer requisição ao backend                   │
│ POST /api/filter                                        │
│ {                                                       │
│   filters: activeFilters,                              │
│   originalUrl: '/api/aggregate/count-by?field=status' │
│ }                                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ PASSO 5: Backend processa                              │
│ • Valida filtros                                        │
│ • Converte para query MongoDB                          │
│ • Aplica filtros na query                              │
│ • Retorna dados filtrados                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ PASSO 6: Frontend recebe dados                         │
│ • Atualiza gráficos                                     │
│ • Atualiza KPIs                                         │
│ • Atualiza banner de filtros                           │
│ • Notifica outros componentes                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 Endpoints da API

### 1. **POST /api/filter**

**Descrição:** Aplicar filtros e retornar dados filtrados

**Requisição:**
```javascript
POST /api/filter
Content-Type: application/json

{
  filters: [
    { field: 'statusDemanda', op: 'eq', value: 'Aberto' },
    { field: 'tema', op: 'contains', value: 'Saúde' }
  ],
  originalUrl: '/api/aggregate/count-by?field=status'
}
```

**Resposta:**
```javascript
// Array de dados filtrados no mesmo formato do endpoint original
[
  { status: 'Aberto', count: 150 },
  { status: 'Em Andamento', count: 75 }
]
```

### 2. **POST /api/filter/aggregated**

**Descrição:** Obter dados agregados com filtros aplicados

**Requisição:**
```javascript
POST /api/filter/aggregated
Content-Type: application/json

{
  filters: [...],
  aggregation: {
    groupBy: 'statusDemanda',
    operations: ['count']
  }
}
```

---

## 📊 Campos Filtáveis

### Campos Padronizados (Ouvidoria)

| Campo | Tipo | Operadores | Descrição |
|-------|------|-----------|-----------|
| `statusDemanda` | String | `eq`, `contains` | Status da demanda |
| `tema` | String | `eq`, `contains` | Tema da manifestação |
| `assunto` | String | `eq`, `contains` | Assunto da manifestação |
| `secretaria` | String | `eq`, `contains` | Órgão/Secretaria responsável |
| `tipoDeManifestacao` | String | `eq`, `contains` | Tipo de manifestação |
| `canal` | String | `eq`, `contains` | Canal de entrada |
| `prioridade` | String | `eq`, `contains` | Nível de prioridade |
| `unidadeCadastro` | String | `eq`, `contains` | Unidade de cadastro |
| `bairro` | String | `eq`, `contains` | Bairro |
| `responsavel` | String | `eq`, `contains` | Responsável |
| `dataCriacaoIso` | Date | `gte`, `lte`, `eq` | Data de criação (ISO) |
| `dataConclusaoIso` | Date | `gte`, `lte`, `eq` | Data de conclusão (ISO) |

### Campos Padronizados (Zeladoria)

| Campo | Tipo | Operadores | Descrição |
|-------|------|-----------|-----------|
| `status` | String | `eq`, `contains` | Status da demanda |
| `categoria` | String | `eq`, `contains` | Categoria |
| `departamento` | String | `eq`, `contains` | Departamento |
| `canal` | String | `eq`, `contains` | Canal de entrada |
| `responsavel` | String | `eq`, `contains` | Responsável |
| `bairro` | String | `eq`, `contains` | Bairro |

### Campos Padronizados (E-SIC)

| Campo | Tipo | Operadores | Descrição |
|-------|------|-----------|-----------|
| `status` | String | `eq`, `contains` | Status da solicitação |
| `tipoInformacao` | String | `eq`, `contains` | Tipo de informação |
| `unidadeContato` | String | `eq`, `contains` | Unidade de contato |
| `canal` | String | `eq`, `contains` | Canal de entrada |
| `responsavel` | String | `eq`, `contains` | Responsável |

---

## 💡 Exemplos de Uso

### Exemplo 1: Aplicar Filtro Simples (Crossfilter)

```javascript
// Na página Overview
window.crossfilterOverview.setStatusFilter('Aberto');
window.crossfilterOverview.notifyListeners();
// → Todos os gráficos são atualizados automaticamente
```

### Exemplo 2: Seleção Múltipla (Ctrl+Clique)

```javascript
// Primeiro clique: adiciona filtro
window.crossfilterOverview.setTipoFilter('Reclamação', false);

// Segundo clique com Ctrl: adiciona outro tipo
window.crossfilterOverview.setTipoFilter('Denúncia', true); // multiSelect = true

// Resultado: Filtra por Reclamação OU Denúncia
```

### Exemplo 3: Filtrar por Data (Filtro de Página)

```javascript
// Na página Tempo Médio
function coletarFiltrosTempoMedio() {
  const filtros = [];
  const mesFiltro = document.getElementById('filtroMesTempoMedio')?.value;
  
  if (mesFiltro) {
    filtros.push({
      field: 'dataCriacaoIso',
      op: 'gte',
      value: `${mesFiltro}-01`
    });
    filtros.push({
      field: 'dataCriacaoIso',
      op: 'lte',
      value: `${mesFiltro}-31`
    });
  }
  
  return filtros;
}

// Combinar com filtros globais
const filtrosPagina = coletarFiltrosTempoMedio();
const globalFilters = window.chartCommunication.filters.filters || [];
const activeFilters = [...globalFilters, ...filtrosPagina];

// Aplicar via API
const response = await fetch('/api/filter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filters: activeFilters,
    originalUrl: '/api/stats/tempo-medio'
  })
});
```

### Exemplo 4: Limpar Filtros

```javascript
// Limpar todos os filtros
window.crossfilterOverview.clearAllFilters();
window.crossfilterOverview.notifyListeners();

// Ou via Global Filters
window.chartCommunication.filters.clear();
```

---

## 🔍 Operadores de Filtro

| Operador | Descrição | Exemplo | MongoDB |
|----------|-----------|---------|---------|
| `eq` | Igual | `{ field: 'status', op: 'eq', value: 'Aberto' }` | `{ status: 'Aberto' }` |
| `contains` | Contém | `{ field: 'tema', op: 'contains', value: 'Saúde' }` | `{ tema: /Saúde/i }` |
| `gte` | Maior ou igual | `{ field: 'dataCriacaoIso', op: 'gte', value: '2025-01-01' }` | `{ dataCriacaoIso: { $gte: '2025-01-01' } }` |
| `lte` | Menor ou igual | `{ field: 'dataCriacaoIso', op: 'lte', value: '2025-01-31' }` | `{ dataCriacaoIso: { $lte: '2025-01-31' } }` |
| `gt` | Maior que | `{ field: 'count', op: 'gt', value: 100 }` | `{ count: { $gt: 100 } }` |
| `lt` | Menor que | `{ field: 'count', op: 'lt', value: 50 }` | `{ count: { $lt: 50 } }` |
| `in` | Está em array | `{ field: 'status', op: 'in', value: ['Aberto', 'Em Andamento'] }` | `{ status: { $in: ['Aberto', 'Em Andamento'] } }` |

---

## 📝 Estrutura de Filtro

### Formato Padrão

```javascript
{
  field: 'statusDemanda',      // Nome do campo no banco
  op: 'eq',                    // Operador
  value: 'Aberto',             // Valor do filtro
  chartId: 'chartStatus'       // (Opcional) ID do gráfico que originou
}
```

### Múltiplos Filtros

```javascript
[
  { field: 'statusDemanda', op: 'eq', value: 'Aberto' },
  { field: 'tema', op: 'contains', value: 'Saúde' },
  { field: 'dataCriacaoIso', op: 'gte', value: '2025-01-01' },
  { field: 'dataCriacaoIso', op: 'lte', value: '2025-01-31' }
]
```

**Regra:** Filtros são combinados com `$and` (AND lógico) - TODOS devem ser verdadeiros.

---

## 📊 Status de Implementação

### ✅ Páginas com Crossfilter Implementado

#### Ouvidoria (10 páginas)
- ✅ `tema.js` - addCrossfilterToChart aplicado
- ✅ `assunto.js` - addCrossfilterToChart aplicado
- ✅ `status.js` - addCrossfilterToChart aplicado
- ✅ `tipo.js` - addCrossfilterToChart aplicado
- ✅ `canal.js` - addCrossfilterToChart aplicado
- ✅ `prioridade.js` - addCrossfilterToChart aplicado
- ✅ `bairro.js` - addCrossfilterToChart aplicado
- ✅ `responsavel.js` - addCrossfilterToChart aplicado
- ✅ `reclamacoes.js` - addCrossfilterToChart aplicado
- ✅ `notificacoes.js` - addCrossfilterToChart aplicado
- ✅ `overview.js` - Sistema próprio de crossfilter
- ✅ `tempo-medio.js` - Sistema próprio de crossfilter

#### Zeladoria (9 páginas)
- ✅ `zeladoria-status.js` - addCrossfilterToChart aplicado
- ✅ `zeladoria-categoria.js` - addCrossfilterToChart aplicado
- ✅ `zeladoria-departamento.js` - addCrossfilterToChart aplicado
- ✅ `zeladoria-responsavel.js` - addCrossfilterToChart aplicado
- ✅ `zeladoria-canal.js` - addCrossfilterToChart aplicado
- ✅ `zeladoria-bairro.js` - addCrossfilterToChart aplicado
- ✅ `zeladoria-overview.js` - addCrossfilterToChart aplicado
- ✅ `zeladoria-mensal.js` - addCrossfilterToChart aplicado
- ✅ `zeladoria-tempo.js` - addCrossfilterToChart aplicado

#### E-SIC (7 páginas)
- ✅ `esic-status.js` - addCrossfilterToChart aplicado
- ✅ `esic-canal.js` - addCrossfilterToChart aplicado
- ✅ `esic-responsavel.js` - addCrossfilterToChart aplicado
- ✅ `esic-unidade.js` - addCrossfilterToChart aplicado
- ✅ `esic-tipo-informacao.js` - addCrossfilterToChart aplicado
- ✅ `esic-overview.js` - addCrossfilterToChart aplicado
- ✅ `esic-mensal.js` - addCrossfilterToChart aplicado

#### Central (1 página)
- ✅ `central-dashboard.js` - addCrossfilterToChart aplicado (parcial)

**Total:** 27 páginas com gráficos Chart.js, 26 com crossfilter implementado ✅

---

## 🛠️ Helpers e Utilitários

### 1. `crossfilter-helper.js`
Helper universal para adicionar crossfilter em gráficos Chart.js.

**Funções:**
- `addCrossfilterToChart(chart, dataArray, config)` - Adiciona crossfilter a um gráfico
- `addCrossfilterToCharts(chartsConfig)` - Adiciona a múltiplos gráficos

**Uso:**
```javascript
window.addCrossfilterToChart(chart, dataArray, {
  field: 'tema',
  valueField: 'theme',
  onFilterChange: () => { /* callback */ },
  onClearFilters: () => { /* callback */ }
});
```

### 2. `kpi-filter-helper.js`
Helper para KPIs e cards reagirem aos filtros.

**Funções:**
- `makeKPIsReactive(config)` - Faz KPIs reagirem aos filtros
- `makeCardsClickable(config)` - Torna cards clicáveis
- `checkElementCrossfilter(selector)` - Verifica se elementos têm crossfilter

**Uso:**
```javascript
// KPIs reativos
window.makeKPIsReactive({
  updateFunction: () => updateKPIs(data),
  pageLoadFunction: window.loadPage
});

// Cards clicáveis
window.makeCardsClickable({
  cards: [
    { selector: '.card-item', value: 'valor', field: 'campo' }
  ],
  field: 'campo'
});
```

### 3. `page-filter-helper.js`
Helper para aplicar filtros seguindo o padrão da Overview.

**Funções:**
- `createPageFilterListener()` - Cria listener de filtros
- `convertCrossfilterToAPIFilters()` - Converte filtros para API
- `getActiveFilters()` - Obtém filtros ativos de todas as fontes

---

## 🚀 Como Adicionar Filtro em Nova Página

### Passo 1: Criar Elemento HTML

```html
<select id="filtroMinhaPagina">
  <option value="">Todos</option>
  <option value="valor1">Valor 1</option>
  <option value="valor2">Valor 2</option>
</select>
```

### Passo 2: Criar Função de Coleta

```javascript
function coletarFiltrosMinhaPagina() {
  const filtros = [];
  const valor = document.getElementById('filtroMinhaPagina')?.value;
  
  if (valor) {
    filtros.push({
      field: 'meuCampo',
      op: 'eq',
      value: valor
    });
  }
  
  return filtros;
}
```

### Passo 3: Combinar e Aplicar

```javascript
// Combinar filtros
const filtrosPagina = coletarFiltrosMinhaPagina();
const globalFilters = window.chartCommunication.filters.filters || [];
const activeFilters = [...globalFilters, ...filtrosPagina];

// Aplicar via API
if (activeFilters.length > 0) {
  const response = await fetch('/api/filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: activeFilters,
      originalUrl: '/api/meu-endpoint'
    })
  });
  const data = await response.json();
  // Usar dados filtrados
}
```

---

## ✅ Melhorias Implementadas

### 1. Normalização de Filtros Duplicados ✅
- Remove duplicatas exatas
- Combina ranges de datas
- Unifica operadores do mesmo campo

### 2. Validação de Filtros Conflitantes ✅
- Valida conflitos de igualdade
- Valida conflitos de data
- Retorna erros claros

### 3. Cache Automático de Filtros ✅
- Cache por chave de filtro
- TTL configurável por tipo de endpoint
- Limpeza automática de cache expirado

### 4. Banner Mínimo de Filtros ✅
- Componente reutilizável
- Exibe filtros ativos com badges individuais
- Botão para remover filtro individual
- Botão "Limpar Todos"

### 5. Histórico de Filtros Recentes ✅
- Salva últimos 10 filtros usados (localStorage)
- Favoritos (até 20 salvos)
- Aplicar filtro do histórico com um clique

### 6. Limite para MultiSelect ✅
- Limite máximo de 20 valores por filtro
- Validação automática no backend e frontend

### 7. Otimização de Filtros "contains" com Índices Lowercase ✅
- Campos lowercase indexados no schema
- Performance significativamente melhorada

### 8. Suporte a Filtros Compostos (OR/AND) ✅
- Classe `CompositeFilter` para estruturar filtros compostos
- Conversão para query MongoDB
- Suporte a filtros aninhados

---

## 🧪 Testes

### Checklist de Testes

1. **Aplicar Filtro na Overview e Navegar para Outra Página**
   - Aplicar filtro na Overview
   - Navegar para outra página
   - Verificar se filtros estão aplicados

2. **Aplicar Filtro Diretamente na Página**
   - Abrir página específica
   - Aplicar filtro
   - Verificar se todos os elementos atualizam

3. **Múltiplos Filtros**
   - Aplicar múltiplos filtros
   - Verificar se todos são aplicados

4. **Limpar Filtros**
   - Com filtros aplicados, limpar
   - Verificar se tudo volta ao estado original

5. **Navegação Entre Páginas**
   - Aplicar filtro
   - Navegar entre páginas
   - Verificar se filtros persistem

---

## 📚 Referências

### Documentos Relacionados
- `MAPA_FILTROS.md` - Mapa técnico completo do sistema de filtros
- `SISTEMAS_GLOBAIS.md` - Sistema Crossfilter Overview
- `BACKEND.md` - Endpoints e controllers
- `ARQUITETURA.md` - Arquitetura geral do sistema

### Arquivos de Código
- `NOVO/public/scripts/core/crossfilter-overview.js` - Crossfilter Overview
- `NOVO/public/scripts/core/chart-communication/global-filters.js` - Global Filters
- `NOVO/public/scripts/core/month-filter-helper.js` - Helper de filtros de mês
- `NOVO/src/api/controllers/filterController.js` - Controller de filtros
- `NOVO/src/utils/validateFilters.js` - Validação de filtros

---

**Documento criado por:** CÉREBRO X-3  
**Última atualização:** 12/12/2025  
**Consolidado de:** ANALISE_COMPLETA_CROSSFILTER.md, ANALISE_FILTROS_POR_PAGINA.md, CHECKLIST_CROSSFILTER.md, CONEXAO_COMPLETA_ELEMENTOS.md, EVOLUCAO_CROSSFILTER.md, INTEGRACAO_FILTROS_COMPOSTOS.md, TESTE_FILTROS_PAGINAS.md

