# 🗺️ Mapa Completo do Sistema de Filtros

**Documento criado em:** 2024-12-09  
**Sistema:** Dashboard Municipal - CÉREBRO X-3  
**Última atualização:** 2025-01-XX  
**Status:** ✅ **10/10 melhorias implementadas (100%)**

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura do Sistema](#-arquitetura-do-sistema)
3. [Tipos de Filtros](#-tipos-de-filtros)
4. [Componentes do Sistema](#-componentes-do-sistema)
5. [Como Funciona](#-como-funciona)
6. [Endpoints da API](#-endpoints-da-api)
7. [Campos Filtáveis](#-campos-filtráveis)
8. [Exemplos de Uso](#-exemplos-de-uso)
9. [Páginas com Filtros](#-páginas-com-filtros)

---

## 🎯 Visão Geral

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

---

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

---

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

## 🧩 Componentes do Sistema

### Frontend

#### 1. **crossfilter-overview.js**
- **Localização:** `NOVO/public/scripts/core/crossfilter-overview.js`
- **Função:** Sistema de filtros multi-dimensionais para página Overview
- **Estado:** Gerencia filtros em objeto `filters` com múltiplas dimensões
- **Features:**
  - Seleção múltipla (Ctrl+Clique)
  - Banner visual de filtros ativos
  - Notificação de mudanças
  - Limpeza de filtros

#### 2. **global-filters.js**
- **Localização:** `NOVO/public/scripts/core/chart-communication/global-filters.js`
- **Função:** Sistema de filtros global compartilhado
- **Estado:** Array de filtros `filters: []`
- **Features:**
  - Aplicação com debounce
  - Toggle automático
  - Múltiplos filtros simultâneos
  - Integração com EventBus

#### 3. **month-filter-helper.js**
- **Localização:** `NOVO/public/scripts/core/month-filter-helper.js`
- **Função:** Helper para filtros de mês
- **Features:**
  - Popular selects com meses disponíveis
  - Coletar filtros de data
  - Aplicar filtros via API

---

### Backend

#### 1. **filterController.js**
- **Localização:** `NOVO/src/api/controllers/filterController.js`
- **Endpoint:** `POST /api/filter`
- **Função:** Aplicar filtros no MongoDB e retornar dados filtrados

**Formato de Requisição:**
```javascript
{
  filters: [
    { field: 'statusDemanda', op: 'eq', value: 'Aberto' },
    { field: 'tema', op: 'contains', value: 'Saúde' },
    { field: 'dataCriacaoIso', op: 'gte', value: '2025-01-01' },
    { field: 'dataCriacaoIso', op: 'lte', value: '2025-01-31' }
  ],
  originalUrl: '/api/aggregate/count-by?field=status'
}
```

**Formato de Resposta:**
```javascript
// Array de registros filtrados (mesmo formato do endpoint original)
[
  { status: 'Aberto', count: 150 },
  { status: 'Em Andamento', count: 75 }
]
```

#### 2. **validateFilters.js**
- **Localização:** `NOVO/src/utils/validateFilters.js`
- **Função:** Validar e converter filtros para query MongoDB
- **Features:**
  - Validação de campos
  - Conversão de operadores
  - Sanitização de valores

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
│ • Ou página coleta filtro específico                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ PASSO 3: Combinar filtros                              │
│ • Filtros globais (de outros gráficos)                 │
│ • Filtros da página (específicos)                      │
│ • = activeFilters (array combinado)                    │
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

## 📄 Páginas com Filtros

### Página: Visão Geral (Overview)

**Sistema:** Crossfilter Overview  
**Filtros Disponíveis:**
- Status
- Tema
- Órgãos/Secretarias
- Tipo de Manifestação
- Canal
- Prioridade
- Unidade
- Bairro

**Como Funciona:**
- Clique em gráfico = aplica filtro
- Ctrl+Clique = seleção múltipla
- Clique direito = limpa filtros
- Banner visual mostra filtros ativos

---

### Página: Tempo Médio

**Sistema:** Filtro por Mês  
**Filtros Disponíveis:**
- Mês (via select)

**Arquivo:** `tempo-medio.js`  
**Função:** `coletarFiltrosTempoMedio()`

**Documentação:** Ver `TEMPO_MEDIO_FILTRO_MES.md`

---

### Página: Por Tema

**Sistema:** Filtros Globais  
**Filtros Disponíveis:**
- Tema (via gráfico ou select)
- Mês (opcional)

---

### Página: Por Assunto

**Sistema:** Filtros Globais  
**Filtros Disponíveis:**
- Assunto
- Status
- Mês (opcional)

---

### Página: Por Órgão e Mês

**Sistema:** Filtros Globais + Filtro por Mês  
**Filtros Disponíveis:**
- Órgão/Secretaria
- Mês

---

### Página: Filtros Avançados

**Sistema:** Filtros Avançados  
**Localização:** `filtros-avancados.js`  
**Função:** Página dedicada para múltiplos filtros simultâneos

**Filtros Disponíveis:**
- Todos os campos principais
- Combinações complexas
- Salvar/Recuperar filtros

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

## 🎨 Interface Visual

### Banner de Filtros Ativos

O banner é renderizado automaticamente quando há filtros ativos na página Overview:

```html
<div id="crossfilterBanner">
  <div class="filter-badge">
    Status: Aberto
    <button onclick="removeFilter('status')">×</button>
  </div>
  <div class="filter-badge">
    Tema: Saúde
    <button onclick="removeFilter('tema')">×</button>
  </div>
  <button onclick="clearAllFilters()">Limpar Todos</button>
</div>
```

### Localização

- **Página Overview:** Banner no topo da página
- **Outras páginas:** Filtros aplicados silenciosamente (sem banner)

---

## 🔧 Implementação Técnica

### Validação de Filtros

**Arquivo:** `NOVO/src/utils/validateFilters.js`

```javascript
function validateAndConvertFilters(filters) {
  // 1. Validar formato
  // 2. Validar campos permitidos
  // 3. Validar operadores
  // 4. Converter para query MongoDB
  // 5. Retornar query válida
}
```

### Conversão para MongoDB

```javascript
// Filtro: { field: 'status', op: 'eq', value: 'Aberto' }
// MongoDB: { status: 'Aberto' }

// Filtro: { field: 'tema', op: 'contains', value: 'Saúde' }
// MongoDB: { tema: /Saúde/i }

// Filtro: { field: 'dataCriacaoIso', op: 'gte', value: '2025-01-01' }
// MongoDB: { dataCriacaoIso: { $gte: '2025-01-01' } }
```

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

## 📚 Referências

### Documentos Relacionados

- `TEMPO_MEDIO_FILTRO_MES.md` - Filtro específico da página Tempo Médio
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

## ✅ Checklist de Filtros por Página

### Página Overview ✅
- [x] Crossfilter Overview implementado
- [x] Banner de filtros ativos
- [x] Seleção múltipla (Ctrl+Clique)
- [x] Limpeza de filtros (clique direito)

### Página Tempo Médio ✅
- [x] Filtro por mês
- [x] Combinação com filtros globais
- [x] Documentação completa

### Página Por Tema ✅
- [x] Filtro por mês implementado (MonthFilterHelper)
- [x] Combinação com filtros globais funcionando
- [x] Aplicação via POST /api/filter
- [x] Interatividade de gráficos (clique para filtrar por tema)
- [x] Listener de mudanças de filtros globais
- **Arquivo:** `NOVO/public/scripts/pages/ouvidoria/tema.js`
- **Elemento HTML:** `filtroMesTema`
- **Endpoint original:** `/api/aggregate/by-theme`
- **Gráficos:** chartTema, chartStatusTema, chartTemaMes

**Fluxo:**
1. Coleta filtros de mês via `MonthFilterHelper.coletarFiltrosMes('filtroMesTema')`
2. Combina com filtros globais de `window.chartCommunication.filters.filters`
3. Se há filtros ativos, faz POST `/api/filter` com `originalUrl: '/api/aggregate/by-theme'`
4. Agrupa dados filtrados manualmente por tema
5. Renderiza gráficos com dados filtrados ou sem filtros
6. Gráfico principal (chartTema) tem onClick para aplicar filtro por tema via global filters

---

### Página Por Assunto ✅
- [x] Filtro por mês implementado (MonthFilterHelper)
- [x] Combinação com filtros globais funcionando
- [x] Aplicação via POST /api/filter
- [x] Listener de mudanças de filtros globais
- **Arquivo:** `NOVO/public/scripts/pages/ouvidoria/assunto.js`
- **Elemento HTML:** `filtroMesAssunto`
- **Endpoint original:** `/api/aggregate/by-subject`
- **Gráficos:** chartAssunto, chartStatusAssunto, chartAssuntoMes

**Fluxo:**
1. Coleta filtros de mês via `MonthFilterHelper.coletarFiltrosMes('filtroMesAssunto')`
2. Combina com filtros globais de `window.chartCommunication.filters.filters`
3. Se há filtros ativos, faz POST `/api/filter` com `originalUrl: '/api/aggregate/by-subject'`
4. Agrupa dados filtrados manualmente por assunto
5. Renderiza gráficos com dados filtrados ou sem filtros
6. Gráficos não têm onClick (interatividade desabilitada por padrão)

---

### Página Filtros Avançados ✅
- [x] Sistema completo de múltiplos filtros simultâneos
- [x] Função `collectFilters()` coletando todos os campos
- [x] Aplicação via POST /api/filter
- [x] Carregamento dinâmico de opções via `/api/distinct?field=...`
- [x] Visualização de resultados em tabela
- [x] Contador de protocolos filtrados vs total
- [x] Botões Aplicar/Limpar filtros
- **Arquivo:** `NOVO/public/scripts/pages/filtros-avancados.js`
- **Função principal:** `collectFilters()` (linhas 472-667)

**Campos Filtráveis Implementados:**
- `protocolo` (contains) - Busca textual
- `StatusDemanda` (eq)
- `UnidadeCadastro` (eq)
- `Canal` (eq)
- `Servidor` (eq)
- `Tipo` (eq) - Tipo de Manifestação
- `Tema` (eq)
- `Prioridade` (eq)
- `unidadeSaude` (eq)
- `dataCriacaoIso` (gte/lte) - Data inicial e final
- `mesCriado` (gte/lte) - Mês de criação (converte para range de datas)
- `mesFinalizado` (gte/lte) - Mês de finalização (converte para range de datas)
- `Assunto` (eq)
- `Responsavel` (eq)
- `Status` (eq)

**Características:**
- **Não combina com filtros globais** (página dedicada, filtros independentes)
- Carrega opções dinamicamente via `/api/distinct?field=...` com cache de 1 hora
- Exibe resultados em tabela paginada (100 resultados por padrão)
- Mostra total de protocolos vs protocolos filtrados
- Toggle para ativar/desativar filtros
- Campo de protocolo aceita Enter para aplicar filtros

**Estrutura:**
```javascript
function collectFilters() {
  const filtros = [];
  // Coleta todos os campos do formulário
  // Retorna array de filtros no formato padrão
  return filtros;
}

async function applyFilters() {
  const filtros = collectFilters();
  const response = await fetch('/api/filter', {
    method: 'POST',
    body: JSON.stringify({
      filters: filtros,
      originalUrl: '/api/records'
    })
  });
  // Renderiza resultados
}
```

---

---

## ✅ Melhorias Implementadas

### 1. Normalização de Filtros Duplicados ✅

**Status:** ✅ Implementado  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/src/utils/normalizeFilters.js`

**Funcionalidades:**
- Remove duplicatas exatas (mesmo field, op e value)
- Combina ranges de datas (gte + lte do mesmo campo)
- Unifica operadores do mesmo campo (múltiplos 'eq' → um único 'in')
- Valida filtros conflitantes antes de enviar ao backend

**Uso:**
```javascript
import { normalizeFilters } from '../../utils/normalizeFilters.js';

// No filterController.js
filters = normalizeFilters(filters);
```

---

### 2. Validação de Filtros Conflitantes ✅

**Status:** ✅ Implementado  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/src/utils/validateFilters.js`

**Funcionalidades:**
- Valida conflitos de igualdade (múltiplos 'eq' com valores diferentes)
- Valida conflitos de data (gte > lte)
- Retorna erros claros para o usuário

**Uso:**
```javascript
import { validateConflictingFilters } from '../../utils/validateFilters.js';

const validation = validateConflictingFilters(filters);
if (!validation.valid) {
  return res.status(400).json({ error: validation.error });
}
```

---

### 3. Cache Automático de Filtros ✅

**Status:** ✅ Implementado  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/public/scripts/core/filter-cache.js`

**Funcionalidades:**
- Cache por chave de filtro (hash dos filtros + endpoint)
- TTL configurável por tipo de endpoint (5-10 minutos)
- Limpeza automática de cache expirado
- Estatísticas de cache (hit rate, entradas, expiradas)

**Uso:**
```javascript
// Verificar cache
const cached = window.filterCache.get(filters, '/api/aggregate/by-theme');
if (cached) {
  return cached;
}

// Salvar no cache após requisição
window.filterCache.set(filters, '/api/aggregate/by-theme', data);
```

**TTLs Configurados:**
- `/api/stats/tempo-medio`: 10 minutos
- `/api/aggregate/by-theme`: 5 minutos
- `/api/aggregate/by-subject`: 5 minutos
- `/api/aggregate/by-month`: 10 minutos
- Padrão: 5 minutos

---

### 4. Banner Mínimo de Filtros ✅

**Status:** ✅ Implementado  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/public/scripts/core/filter-banner.js`

**Funcionalidades:**
- Componente reutilizável para qualquer página
- Exibe filtros ativos com badges individuais
- Botão para remover filtro individual
- Botão "Limpar Todos"
- Atualização automática quando filtros mudam
- Contador de filtros ativos

**Uso:**
```javascript
// Renderizar banner
window.filterBanner.render('page-container', filters, {
  showClearAll: true,
  showCount: true,
  position: 'top'
});

// Atualização automática
window.filterBanner.autoUpdate('page-container');
```

---

### 5. Histórico de Filtros Recentes ✅

**Status:** ✅ Implementado  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/public/scripts/core/filter-history.js`

**Funcionalidades:**
- Salva últimos 10 filtros usados (localStorage)
- Favoritos (até 20 salvos)
- Aplicar filtro do histórico com um clique
- Nomes automáticos ou customizados

**Uso:**
```javascript
// Salvar no histórico
window.filterHistory.saveRecent(filters, 'Meu Filtro');

// Salvar como favorito
window.filterHistory.saveFavorite(filters, 'Reclamações Saúde - Último Mês');

// Aplicar filtro do histórico
window.filterHistory.apply(filters);

// Obter histórico
const recent = window.filterHistory.getRecent();
const favorites = window.filterHistory.getFavorites();
```

---

### 6. Limite para MultiSelect ✅

**Status:** ✅ Implementado  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/src/utils/limitMultiSelect.js`

**Funcionalidades:**
- Limite máximo de 20 valores por filtro
- Validação automática no backend e frontend
- Avisos no log quando arrays são limitados
- Previne queries gigantes e payloads HTTP pesados

**Uso:**
```javascript
import { limitMultiSelect } from '../../utils/limitMultiSelect.js';

// No filterController.js
filters = limitMultiSelect(filters);
```

---

### 7. Otimização de Filtros "contains" com Índices Lowercase ✅

**Status:** ✅ Implementado (Fase 1)  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/src/models/Record.model.js`, `NOVO/src/utils/normalizeLowercase.js`

**Funcionalidades:**
- Campos lowercase indexados no schema (temaLowercase, assuntoLowercase, etc.)
- `filterController.js` usa campos lowercase quando disponível
- Normalização automática na importação de dados
- Performance significativamente melhorada para filtros "contains"

**Uso:**
```javascript
// Automático - filterController detecta e usa campos lowercase
// Filtro: { field: 'tema', op: 'contains', value: 'Saúde' }
// MongoDB: { temaLowercase: { $regex: 'saude', $options: 'i' } }
```

**Campos Otimizados:**
- `temaLowercase`
- `assuntoLowercase`
- `canalLowercase`
- `orgaosLowercase`
- `statusDemandaLowercase`
- `tipoDeManifestacaoLowercase`
- `responsavelLowercase`

---

## 🚀 Melhorias Futuras (Roadmap)

### 1. Suporte a Operadores Compostos (OR, Agrupadores) 🟡

**Status:** 🟡 Estrutura Básica Implementada  
**Prioridade:** Média  
**Complexidade:** Alta  
**Arquivo:** `NOVO/src/utils/compositeFilters.js`

**O que foi implementado:**
- Classe `CompositeFilter` para estruturar filtros compostos
- Conversão para query MongoDB (`toMongoQuery()`)
- Validação de estrutura
- Serialização/deserialização JSON
- Helpers: `createORFilter()`, `createANDFilter()`, `arrayToComposite()`

**Exemplo de uso:**
```javascript
import { CompositeFilter, createORFilter } from '../../utils/compositeFilters.js';

// Criar filtro: (status = 'Aberto' OR status = 'Em Andamento') AND bairro = 'Centro'
const filter = new CompositeFilter('AND', [
  createORFilter([
    { field: 'statusDemanda', op: 'eq', value: 'Aberto' },
    { field: 'statusDemanda', op: 'eq', value: 'Em Andamento' }
  ]),
  { field: 'bairro', op: 'eq', value: 'Centro' }
]);

const mongoQuery = filter.toMongoQuery();
// Resultado: {
//   $and: [
//     { $or: [
//       { statusDemanda: 'Aberto' },
//       { statusDemanda: 'Em Andamento' }
//     ]},
//     { bairro: 'Centro' }
//   ]
// }
```

**Status:** ✅ **IMPLEMENTADO COMPLETAMENTE**

**Implementações Realizadas:**
- ✅ Integração no `filterController.js` para aceitar filtros compostos (OR/AND)
- ✅ UI no frontend para criar grupos de filtros (`composite-filters-ui.js`)
- ✅ Validação completa de filtros compostos
- ✅ Conversão para MongoDB com suporte a campos normalizados
- ✅ Suporte a filtros aninhados (composite dentro de composite)

**Arquivos:**
- `NOVO/src/utils/compositeFilters.js` - Classe CompositeFilter
- `NOVO/src/api/controllers/filterController.js` - Suporte a filtros compostos
- `NOVO/public/scripts/core/composite-filters-ui.js` - UI para construir filtros compostos

**Uso:**
```javascript
// Criar filtro composto
const compositeFilter = {
  operator: 'AND',
  filters: [
    {
      operator: 'OR',
      filters: [
        { field: 'statusDemanda', op: 'eq', value: 'Aberto' },
        { field: 'statusDemanda', op: 'eq', value: 'Em Andamento' }
      ]
    },
    { field: 'bairro', op: 'eq', value: 'Centro' }
  ]
};

// Usar UI para construir
window.compositeFiltersUI.showBuilder((filter) => {
  // Salvar ou aplicar filtro
  console.log('Filtro composto criado:', filter);
});

// Enviar para API
fetch('/api/filter', {
  method: 'POST',
  body: JSON.stringify({ ...compositeFilter })
});
```

---

### 2. Cache Automático de Filtros ✅

**Status:** ✅ Implementado  
**Ver:** Seção "Melhorias Implementadas" acima

---

### 3. Integração com Histórico de Filtros ✅

**Status:** ✅ **IMPLEMENTADO COMPLETAMENTE** (localStorage + UI + Backend)  
**Ver:** Seção "Melhorias Implementadas" acima

**UI Implementada:**
- **Arquivo:** `NOVO/public/scripts/core/filter-history-ui.js`
- Dropdown de histórico
- Modal de histórico
- Botão flutuante (opcional)
- Seções de Favoritos e Recentes
- **Sincronização automática com backend**

**Backend Implementado:**
- **Model:** `NOVO/src/models/SavedFilter.model.js`
- **Controller:** `NOVO/src/api/controllers/savedFiltersController.js`
- **Rotas:** `NOVO/src/api/routes/savedFilters.js`
- **Endpoints:**
  - `GET /api/saved-filters` - Listar filtros salvos
  - `POST /api/saved-filters` - Salvar novo filtro
  - `PUT /api/saved-filters/:id` - Atualizar filtro
  - `DELETE /api/saved-filters/:id` - Deletar filtro
  - `POST /api/saved-filters/:id/use` - Marcar como usado

**Uso:**
```javascript
// Criar dropdown (sincroniza automaticamente com backend)
window.filterHistoryUI.createDropdown('page-container', {
  showRecent: true,
  showFavorites: true,
  position: 'top-right'
});

// Salvar filtro no backend
await window.filterHistory.saveToBackend(
  filters,
  'Nome do Filtro',
  'Descrição opcional',
  true, // isFavorite
  false // isComposite
);

// Carregar do backend
const filters = await window.filterHistory.loadFromBackend({
  favorite: true,
  recent: true,
  limit: 10
});

// Sincronizar automaticamente
await window.filterHistory.syncWithBackend();
```

---

### 4. Expandir Crossfilter para Outras Páginas ✅

**Status:** ✅ **IMPLEMENTADO COMPLETAMENTE**  
**Prioridade:** Média  
**Complexidade:** Média

**Implementações Realizadas:**
- ✅ Extraída lógica do Crossfilter para módulo reutilizável (`crossfilter-core.js`)
- ✅ Criado adaptador genérico (`crossfilter-adapter.js`)
- ✅ Exemplo de integração para página Tema (`tema-crossfilter.js`)
- ✅ Compatibilidade mantida com Global Filters

**Arquivos:**
- `NOVO/public/scripts/core/crossfilter-core.js` - Módulo reutilizável
- `NOVO/public/scripts/core/crossfilter-adapter.js` - Adaptador genérico
- `NOVO/public/scripts/pages/ouvidoria/tema-crossfilter.js` - Exemplo de uso

**Uso:**
```javascript
// Criar adaptador para qualquer página
const adapter = window.createCrossfilterAdapter({
  pageName: 'tema',
  fields: ['status', 'tema', 'orgaos', 'tipo', 'canal'],
  chartSelectors: {
    'chartTema': '#chartTema',
    'chartStatusTema': '#chartStatusTema'
  },
  onDataLoad: (data) => {
    // Recarregar página quando filtros mudarem
    window.loadTema();
  },
  autoApply: true
});

// Inicializar
adapter.init();

// Aplicar filtro manualmente
adapter.applyFilter('tema', 'Saúde', false);

// Limpar filtros
adapter.clearFilters();
```

---

### 5. Normalização de Filtros Duplicados ✅

**Status:** ✅ Implementado  
**Ver:** Seção "Melhorias Implementadas" acima

---

## ⚠️ Problemas Conhecidos e Limitações

### 1. Performance de Filtros "contains" com Regex ✅

**Status:** ✅ Implementado (Fase 1: Campos Lowercase)  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/src/models/Record.model.js`, `NOVO/src/utils/normalizeLowercase.js`

**Solução Implementada:**
- Campos lowercase indexados adicionados ao schema:
  - `temaLowercase`, `assuntoLowercase`, `canalLowercase`, `orgaosLowercase`
  - `statusDemandaLowercase`, `tipoDeManifestacaoLowercase`, `responsavelLowercase`
- `filterController.js` usa campos lowercase quando disponível (muito mais rápido)
- Normalização automática na importação (`updateFromGoogleSheets.js`)

**Comportamento:**
- Filtros `contains` em campos com versão lowercase usam o campo indexado
- Fallback para regex no campo original se lowercase não disponível
- Performance melhorada significativamente para queries `contains`

**Próximos Passos:**
- Script de migração para popular campos lowercase em registros existentes
- Monitoramento de performance (métricas de tempo de query)

---

### 2. MultiSelect com Arrays Muito Grandes ✅

**Status:** ✅ Implementado  
**Data:** 2025-01-XX  
**Arquivo:** `NOVO/src/utils/limitMultiSelect.js`

**Solução Implementada:**
- Limite máximo de 20 valores por filtro
- Validação automática no backend (`filterController.js`)
- Validação no frontend (`global-filters.js`)
- Avisos no log quando arrays são limitados

**Comportamento:**
- Arrays maiores que 20 valores são automaticamente truncados
- Primeiros 20 valores são mantidos
- Aviso é logado para monitoramento

---

### 3. Filtros Conflitantes (Validação) ✅

**Status:** ✅ Implementado  
**Ver:** Seção "Melhorias Implementadas" acima

**Comportamento:**
- Validação ocorre em `normalizeFilters.js` e `validateFilters.js`
- Conflitos são detectados e filtros inválidos são removidos ou unificados
- Backend também valida antes de executar queries

---

### 4. Filtros Invisíveis (Sem Banner) ✅

**Status:** ✅ Resolvido  
**Ver:** Seção "Melhorias Implementadas" acima

**Solução Implementada:**
- Componente `filter-banner.js` reutilizável
- Pode ser adicionado a qualquer página com uma linha de código
- Atualização automática quando filtros mudam
- Banner visual com badges individuais e botão "Limpar Todos"

---

## 📊 Métricas e Monitoramento

### Métricas Recomendadas

1. **Tempo de Query:**
   - Medir tempo de execução de cada filtro
   - Alertar se > 1 segundo

2. **Taxa de Cache Hit:**
   - Monitorar % de requisições servidas do cache

3. **Filtros Mais Usados:**
   - Salvar estatísticas de filtros aplicados
   - Otimizar queries mais comuns

4. **Tamanho de Payload:**
   - Monitorar tamanho de requisições/respostas
   - Alertar se > 1MB

---

## 🎯 Priorização de Melhorias

### Fase 1 (Curto Prazo - 1-2 semanas)
1. ✅ Normalização de filtros duplicados (Baixa complexidade)
2. ✅ Validação de filtros conflitantes (Média complexidade)
3. ✅ Banner mínimo em todas as páginas (Baixa complexidade)

### Fase 2 (Médio Prazo - 1 mês)
1. ✅ Cache automático de filtros (Alta prioridade)
2. ✅ Performance de regex contains (Alta prioridade)
3. ✅ Histórico de filtros recentes (Baixa prioridade)

### Fase 3 (Longo Prazo - 2-3 meses)
1. ✅ Operadores compostos (OR, agrupadores)
2. ✅ Expandir crossfilter para outras páginas
3. ✅ Filtros favoritos e salvos por usuário

---

**Documento atualizado com melhorias futuras e problemas conhecidos.**  
**Para atualizações, consulte os arquivos de código e atualize este documento manualmente.**

