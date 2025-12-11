# 📋 Documentação: Filtro por Mês - Página Tempo Médio de Atendimento

**Data de Criação:** Dezembro 2025  
**Sistema:** Dashboard de Ouvidoria  
**Página:** ⏱️ Tempo Médio de Atendimento  
**Arquivo Principal:** `NOVO/public/scripts/pages/ouvidoria/tempo-medio.js`

---

## 📌 Visão Geral

A página **Tempo Médio de Atendimento** permite analisar o tempo médio de resolução das demandas, com a possibilidade de filtrar os dados por mês específico. Este documento explica **como funciona** o sistema de filtragem e **como foi implementado**.

---

## 🎯 Objetivo do Filtro

O filtro por mês permite ao usuário:

1. **Analisar um período específico**: Visualizar dados de um único mês
2. **Comparar períodos**: Alternar entre meses para fazer comparações
3. **Focar em análises temporais**: Entender variações mensais de performance

---

## 🏗️ Arquitetura do Sistema

### 1. **Componentes Envolvidos**

```
Frontend (Browser)
├── tempo-medio.js          → Lógica da página
├── month-filter-helper.js  → Helper para filtros de mês
├── dataLoader.js           → Carregamento de dados com cache
└── chartFactory.js         → Criação de gráficos

Backend (Server)
├── statsController.js      → Endpoint de estatísticas
├── filterController.js     → Endpoint de filtros
└── MongoDB                 → Banco de dados
```

### 2. **Fluxo de Dados**

```
Usuário seleciona mês
    ↓
Frontend coleta filtro
    ↓
Combina com filtros globais
    ↓
Faz requisição ao backend
    ↓
Backend aplica filtros no MongoDB
    ↓
Retorna dados filtrados
    ↓
Frontend renderiza gráficos e estatísticas
```

---

## 📝 Implementação Detalhada

### **PASSO 1: Elemento HTML - Select de Mês**

**Localização:** `NOVO/public/index.html` (linha ~1344)

```html
<label for="filtroMesTempoMedio" class="block text-sm font-medium text-slate-300 mb-2">
  Filtrar por Mês
</label>
<select 
  id="filtroMesTempoMedio" 
  class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200">
  <option value="">Todos os meses</option>
  <!-- Opções são populadas dinamicamente via JavaScript -->
</select>
```

**Características:**
- ID único: `filtroMesTempoMedio`
- Valor padrão: vazio (`""`) = "Todos os meses"
- Opções são populadas dinamicamente pelo JavaScript

---

### **PASSO 2: Popular Select com Meses Disponíveis**

**Função:** `popularSelectMesesTempoMedio()`

**Localização:** `tempo-medio.js` (linhas 877-937)

```javascript
async function popularSelectMesesTempoMedio() {
  const selectMes = document.getElementById('filtroMesTempoMedio');
  if (!selectMes) return;
  
  try {
    // 1. Buscar dados mensais do endpoint
    const dataMes = await window.dataLoader?.load('/api/stats/average-time/by-month', {
      useDataStore: true,      // Usar cache
      ttl: 10 * 60 * 1000,     // Cache de 10 minutos
      fallback: []
    }) || [];
    
    // 2. Extrair meses disponíveis
    const meses = dataMes
      .map(d => d.month || d.ym || d._id)  // Múltiplos formatos possíveis
      .filter(m => m)
      .sort()
      .reverse();  // Mais recente primeiro
    
    // 3. Limpar opções existentes (exceto "Todos os meses")
    while (selectMes.children.length > 1) {
      selectMes.removeChild(selectMes.lastChild);
    }
    
    // 4. Adicionar cada mês como opção
    meses.forEach(mes => {
      const option = document.createElement('option');
      option.value = mes;  // Formato: YYYY-MM (ex: "2025-12")
      
      // Formatar nome amigável (ex: "Dezembro 2025")
      let nomeMes = mes;
      if (mes.match(/^\d{4}-\d{2}$/)) {
        const [ano, mesNum] = mes.split('-');
        const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 
                           'Maio', 'Junho', 'Julho', 'Agosto', 
                           'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        nomeMes = `${mesesNomes[parseInt(mesNum) - 1]} ${ano}`;
      }
      
      option.textContent = nomeMes;
      selectMes.appendChild(option);
    });
    
    // 5. Restaurar seleção anterior se existir
    if (filtroMesTempoMedio) {
      selectMes.value = filtroMesTempoMedio;
    }
  } catch (error) {
    window.errorHandler?.handleError(error, 'popularSelectMesesTempoMedio');
  }
}
```

**Pontos Importantes:**
- Usa cache para evitar requisições repetidas
- Ordena meses do mais recente para o mais antigo
- Formata nomes para exibição amigável
- Preserva seleção anterior do usuário

---

### **PASSO 3: Inicializar Event Listener**

**Função:** `inicializarFiltrosTempoMedio()`

**Localização:** `tempo-medio.js` (linhas 943-971)

```javascript
function inicializarFiltrosTempoMedio() {
  const selectMes = document.getElementById('filtroMesTempoMedio');
  if (!selectMes) return;
  
  // 1. Adicionar listener para mudanças no select
  selectMes.addEventListener('change', async (e) => {
    // 2. Salvar valor selecionado na variável global
    filtroMesTempoMedio = e.target.value || '';
    
    // 3. Log para debug
    if (window.Logger) {
      window.Logger.debug(`⏱️ Filtro de mês alterado para: ${filtroMesTempoMedio || 'Todos'}`);
    }
    
    // 4. Recarregar dados com o novo filtro (forceRefresh = true)
    await loadTempoMedio(true);
  });
  
  // 5. Popular o select ao inicializar
  popularSelectMesesTempoMedio();
}
```

**Características:**
- Listener `change` dispara quando usuário seleciona um mês
- Força refresh completo dos dados (`forceRefresh = true`)
- Mantém valor em variável global para persistência

---

### **PASSO 4: Coletar Filtros da Página**

**Função:** `coletarFiltrosTempoMedio()`

**Localização:** `tempo-medio.js` (linhas 62-91)

```javascript
function coletarFiltrosTempoMedio() {
  const filtros = [];
  
  // 1. Obter valor do select
  const mesFiltro = document.getElementById('filtroMesTempoMedio')?.value?.trim() || '';
  
  // 2. Se um mês foi selecionado (não está vazio)
  if (mesFiltro) {
    // Formato esperado: YYYY-MM (ex: "2025-12")
    const [ano, mes] = mesFiltro.split('-');
    
    if (ano && mes) {
      // 3. Calcular primeiro dia do mês
      const dataInicial = `${mesFiltro}-01`;  // Ex: "2025-12-01"
      
      // 4. Calcular último dia do mês (tratando anos bissextos)
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
      // Explicação: new Date(ano, mes, 0) retorna o último dia do mês anterior
      // Para dezembro de 2025: new Date(2025, 12, 0) = 30 de novembro
      // Corrigido: new Date(2025, 12, 0) retorna último dia de dezembro = 31
      
      const dataFinal = `${mesFiltro}-${ultimoDia}`;  // Ex: "2025-12-31"
      
      // 5. Criar dois filtros (início e fim do mês)
      filtros.push({
        field: 'dataCriacaoIso',
        op: 'gte',  // Greater than or equal
        value: dataInicial
      });
      
      filtros.push({
        field: 'dataCriacaoIso',
        op: 'lte',  // Less than or equal
        value: `${dataFinal}T23:59:59.999Z`  // Incluir até final do dia
      });
    }
  }
  
  // 6. Retornar array de filtros
  return filtros;
}
```

**Como Funciona:**
1. Lê valor do select (formato: `"YYYY-MM"`)
2. Calcula primeiro dia do mês: `"2025-12-01"`
3. Calcula último dia do mês: `"2025-12-31"` (considera anos bissextos)
4. Cria dois filtros:
   - `dataCriacaoIso >= "2025-12-01"`
   - `dataCriacaoIso <= "2025-12-31T23:59:59.999Z"`

**Exemplo de Saída:**
```javascript
// Se selecionado "2025-12":
[
  { field: 'dataCriacaoIso', op: 'gte', value: '2025-12-01' },
  { field: 'dataCriacaoIso', op: 'lte', value: '2025-12-31T23:59:59.999Z' }
]

// Se selecionado "" (Todos os meses):
[]
```

---

### **PASSO 5: Combinar Filtros Globais + Filtros da Página**

**Localização:** `tempo-medio.js` (linhas 126-142)

```javascript
// 1. Coletar filtros específicos da página
const filtrosPagina = coletarFiltrosTempoMedio();

// 2. Obter filtros globais (de outros gráficos/páginas)
let activeFilters = null;
if (window.chartCommunication) {
  const globalFilters = window.chartCommunication.filters?.filters || [];
  
  // 3. COMBINAR filtros globais com filtros da página
  activeFilters = [...globalFilters, ...filtrosPagina];
  
  if (activeFilters.length > 0) {
    window.Logger.debug(`⏱️ ${activeFilters.length} filtro(s) ativo(s)`, activeFilters);
  }
} else if (filtrosPagina.length > 0) {
  // 4. Se não há sistema global, usar apenas filtros da página
  activeFilters = filtrosPagina;
}
```

**Exemplo de Combinação:**
```javascript
// Filtros globais (de outro gráfico):
[
  { field: 'status', op: 'eq', value: 'CONCLUÍDO' }
]

// Filtros da página (por mês):
[
  { field: 'dataCriacaoIso', op: 'gte', value: '2025-12-01' },
  { field: 'dataCriacaoIso', op: 'lte', value: '2025-12-31T23:59:59.999Z' }
]

// Resultado combinado:
[
  { field: 'status', op: 'eq', value: 'CONCLUÍDO' },
  { field: 'dataCriacaoIso', op: 'gte', value: '2025-12-01' },
  { field: 'dataCriacaoIso', op: 'lte', value: '2025-12-31T23:59:59.999Z' }
]
```

---

### **PASSO 6: Aplicar Filtros no Backend**

**Quando há filtros ativos:**

**Localização:** `tempo-medio.js` (linhas 168-223)

```javascript
if (activeFilters && activeFilters.length > 0) {
  try {
    // 1. Preparar requisição POST para endpoint /api/filter
    const filterRequest = {
      filters: activeFilters,  // Array de filtros combinados
      originalUrl: window.location.pathname
    };
    
    // 2. Fazer requisição HTTP POST
    const response = await fetch('/api/filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(filterRequest)
    });
    
    // 3. Processar resposta
    if (response.ok) {
      const filteredData = await response.json();
      
      // 4. Calcular estatísticas dos dados filtrados LOCALMENTE
      if (Array.isArray(filteredData) && filteredData.length > 0) {
        const tempos = filteredData
          .map(record => {
            // Extrair tempo de resolução de diferentes formatos
            const tempo = record.tempoDeResolucaoEmDias || 
                         record.data?.tempoDeResolucaoEmDias ||
                         record.data?.tempo_de_resolucao_em_dias ||
                         null;
            return tempo !== null ? parseFloat(tempo) : null;
          })
          .filter(t => t !== null && !isNaN(t));
        
        // Calcular média, mediana, mínimo, máximo
        if (tempos.length > 0) {
          const sorted = [...tempos].sort((a, b) => a - b);
          const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
          const mediana = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
          const minimo = sorted[0];
          const maximo = sorted[sorted.length - 1];
          
          stats = {
            media: media,
            mediana: mediana,
            minimo: minimo,
            maximo: maximo,
            total: filteredData.length
          };
        }
      }
    }
  } catch (filterError) {
    // Em caso de erro, usar endpoint normal (sem filtros)
    window.Logger.error('Erro ao aplicar filtros:', filterError);
  }
}
```

**Quando NÃO há filtros ativos:**

```javascript
// Usa endpoint normal /api/stats/average-time/stats
const statsRaw = await dataLoader.load('/api/stats/average-time/stats', {
  useDataStore: !forceRefresh,
  ttl: 5 * 60 * 1000,
  fallback: { media: 0, mediana: 0, minimo: 0, maximo: 0, total: 0 }
});
```

---

### **PASSO 7: Backend - Endpoint `/api/filter`**

**Localização:** `NOVO/src/api/controllers/filterController.js` (não mostrado aqui, mas funciona assim)

1. **Recebe:** `{ filters: [...], originalUrl: "/dashboard" }`
2. **Converte filtros para query MongoDB:**
   ```javascript
   // Filtro: { field: 'dataCriacaoIso', op: 'gte', value: '2025-12-01' }
   // Vira: { dataCriacaoIso: { $gte: '2025-12-01' } }
   ```
3. **Executa query no MongoDB:**
   ```javascript
   Record.find({
     dataCriacaoIso: {
       $gte: '2025-12-01',
       $lte: '2025-12-31T23:59:59.999Z'
     }
   }).limit(50000).lean()
   ```
4. **Retorna:** Array de registros filtrados

---

### **PASSO 8: Backend - Endpoint `/api/stats/average-time/by-month`**

**Localização:** `NOVO/src/api/controllers/statsController.js`

Este endpoint retorna dados **agregados por mês** para popular o select e criar o gráfico de evolução:

```javascript
export async function averageTimeByMonth(req, res) {
  // 1. Buscar registros do MongoDB
  const rows = await Record.find({
    dataCriacaoIso: { $ne: null }
  })
  .select('dataCriacaoIso tempoDeResolucaoEmDias')
  .limit(20000)
  .lean();
  
  // 2. Agrupar por mês
  const map = new Map();
  for (const r of rows) {
    // Extrair ano-mês: "2025-12-15" → "2025-12"
    const month = r.dataCriacaoIso.substring(0, 7);
    
    if (!map.has(month)) {
      map.set(month, { total: 0, sum: 0 });
    }
    
    const stats = map.get(month);
    const days = parseFloat(r.tempoDeResolucaoEmDias) || 0;
    stats.total += 1;
    stats.sum += days;
  }
  
  // 3. Calcular médias
  const result = Array.from(map.entries())
    .map(([month, stats]) => ({
      month: month,  // "2025-12"
      average: stats.sum / stats.total,
      count: stats.total
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return result;
}
```

**Formato de Resposta:**
```json
[
  { "month": "2025-10", "average": 15.5, "count": 120 },
  { "month": "2025-11", "average": 18.2, "count": 145 },
  { "month": "2025-12", "average": 16.8, "count": 130 }
]
```

---

### **PASSO 9: Renderizar Gráficos com Dados Filtrados**

**Função:** `renderTempoMedioCharts()`

**Localização:** `tempo-medio.js` (linhas 378-589)

```javascript
async function renderTempoMedioCharts(stats, dataMes, mesSelecionado, forceRefresh, activeFilters) {
  // 1. Buscar dados de tempo médio por órgão
  const dataOrgaoRaw = await dataLoader.load('/api/stats/average-time', {
    useDataStore: !forceRefresh,
    ttl: 5 * 60 * 1000,
    fallback: []
  });
  
  // 2. Se há filtros, aplicar endpoint /api/filter novamente
  let dataOrgao = dataOrgaoRaw;
  if (activeFilters && activeFilters.length > 0) {
    // Fazer requisição POST para /api/filter
    // Calcular médias localmente dos resultados
  }
  
  // 3. Ordenar por tempo médio (crescente ou decrescente)
  dataOrgao.sort((a, b) => {
    return ordenacaoTempoMedio === 'crescente' 
      ? a.average - b.average 
      : b.average - a.average;
  });
  
  // 4. Criar gráfico usando ChartFactory
  await window.chartFactory?.createBarChart('chartTempoMedio', labels, values, {
    label: 'Tempo Médio (dias)',
    // ... configurações do gráfico
  });
}
```

---

## 🔄 Fluxo Completo Resumido

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário seleciona mês no select                         │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Event listener dispara 'change'                         │
│    - Salva valor em filtroMesTempoMedio                    │
│    - Chama loadTempoMedio(true)                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. coletarFiltrosTempoMedio()                              │
│    - Lê valor do select (ex: "2025-12")                    │
│    - Calcula primeiro e último dia do mês                  │
│    - Cria 2 filtros: gte e lte                             │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Combinar filtros                                        │
│    - Filtros globais (de outros gráficos)                  │
│    + Filtros da página (por mês)                           │
│    = activeFilters                                          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Se há filtros:                                          │
│    POST /api/filter                                         │
│    { filters: activeFilters }                               │
│    → Backend aplica filtros no MongoDB                     │
│    → Retorna registros filtrados                           │
│    → Frontend calcula estatísticas localmente              │
│                                                            │
│ 6. Se não há filtros:                                      │
│    GET /api/stats/average-time/stats                       │
│    → Backend calcula e retorna estatísticas                │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Renderizar                                              │
│    - Atualizar cards de estatísticas                       │
│    - Criar gráficos com dados filtrados                    │
│    - Atualizar ranking de órgãos                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Estrutura de Dados

### **Filtro de Mês (Formato)**

```javascript
// Entrada (do select):
"2025-12"  // Formato: YYYY-MM

// Processado em filtros:
[
  {
    field: 'dataCriacaoIso',
    op: 'gte',
    value: '2025-12-01'
  },
  {
    field: 'dataCriacaoIso',
    op: 'lte',
    value: '2025-12-31T23:59:59.999Z'
  }
]
```

### **Estatísticas Calculadas**

```javascript
{
  media: 15.5,        // Média aritmética
  mediana: 14.2,      // Valor central
  minimo: 1,          // Menor valor
  maximo: 45,         // Maior valor
  total: 150          // Quantidade de registros
}
```

---

## 🎨 Visualização

### **Gráficos Afetados pelo Filtro**

1. **Gráfico Principal (Barras)**: Tempo médio por órgão/unidade
2. **Gráfico de Evolução Mensal**: Linha temporal (afetado parcialmente)
3. **Gráfico por Dia**: Últimos 30 dias (se dentro do mês selecionado)
4. **Gráfico por Semana**: Últimas semanas (se dentro do mês)
5. **Gráfico por Unidade**: Tempo médio por unidade de cadastro
6. **Gráfico Unidade x Mês**: Linha temporal por unidade

### **Cards de Estatísticas**

- ✅ Média
- ✅ Mediana
- ✅ Mínimo
- ✅ Máximo
- ✅ Total de registros

---

## 🔍 Pontos Importantes

### **1. Cache**
- Dados mensais: cache de 10 minutos
- Estatísticas: cache de 5 minutos
- Quando `forceRefresh = true`, cache é ignorado

### **2. Performance**
- Limite de 20.000 registros no backend
- Filtros aplicados no MongoDB (rápido)
- Cálculos de estatísticas no frontend (rápido para dados filtrados)

### **3. Tratamento de Erros**
- Fallback para dados vazios em caso de erro
- Logs detalhados para debug
- Notificações ao usuário se necessário

### **4. Compatibilidade**
- Funciona com filtros globais de outros gráficos
- Mantém seleção do usuário ao recarregar página
- Suporta múltiplos formatos de data

---

## 🚀 Como Adicionar um Novo Filtro

Para adicionar outro filtro na mesma página:

1. **Adicionar elemento HTML:**
```html
<select id="filtroNovoFiltro">
  <option value="">Todos</option>
</select>
```

2. **Adicionar coleta no `coletarFiltrosTempoMedio()`:**
```javascript
const novoFiltro = document.getElementById('filtroNovoFiltro')?.value;
if (novoFiltro) {
  filtros.push({
    field: 'campoDoBanco',
    op: 'eq',
    value: novoFiltro
  });
}
```

3. **O resto é automático!** O sistema já combina e aplica os filtros.

---

## 📚 Referências

- **Frontend:** `NOVO/public/scripts/pages/ouvidoria/tempo-medio.js`
- **Backend Stats:** `NOVO/src/api/controllers/statsController.js`
- **Backend Filter:** `NOVO/src/api/controllers/filterController.js`
- **Helper:** `NOVO/public/scripts/core/month-filter-helper.js`

---

## ✅ Checklist de Funcionamento

- [x] Select populado com meses disponíveis
- [x] Event listener configurado
- [x] Filtros coletados corretamente
- [x] Filtros combinados com globais
- [x] Requisição ao backend funcionando
- [x] Estatísticas calculadas corretamente
- [x] Gráficos atualizados com dados filtrados
- [x] Cache funcionando
- [x] Tratamento de erros implementado

---

**Documento criado por:** CÉREBRO X-3  
**Última atualização:** Dezembro 2025

