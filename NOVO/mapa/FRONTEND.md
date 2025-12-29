# 🟧 FRONTEND - SPA Modular

**Localização:** `NOVO/public/scripts/`  
**Data:** 12/12/2025  
**CÉREBRO X-3**

---

## 📋 ÍNDICE

1. [Estrutura Geral](#estrutura-geral)
2. [Sistemas Globais (Core)](#sistemas-globais-core)
3. [Páginas do Sistema](#páginas-do-sistema)
4. [Módulos Auxiliares](#módulos-auxiliares)
5. [Integrações](#integrações)

---

## 🏗️ ESTRUTURA GERAL

```
public/scripts/
├── core/                    # Sistemas globais
│   ├── chart-communication/ # Sistema de comunicação entre gráficos
│   ├── chart-factory.js     # Factory de gráficos Chart.js
│   ├── dataLoader.js        # Carregador de dados
│   ├── global-store.js      # Store global de dados
│   ├── crossfilter-*.js     # Sistema de filtros crossfilter
│   └── ...
├── pages/                   # Páginas do dashboard
│   ├── ouvidoria/          # 20 páginas de Ouvidoria
│   ├── zeladoria/          # 14 páginas de Zeladoria
│   ├── esic/               # 8 páginas de E-SIC
│   ├── central/            # Painel central
│   └── configuracoes.js   # Página de configurações
├── modules/                 # Módulos auxiliares
└── utils/                   # Utilitários frontend
```

---

## 🎯 SISTEMAS GLOBAIS (CORE)

### 1. **ChartFactory** - `core/chart-factory.js`
**Função:** Factory para criação de gráficos Chart.js

**Recursos:**
- Criação automática de gráficos (pizza, barras, linha, etc.)
- Sistema de cores inteligente
- Lazy loading de Chart.js
- Responsividade automática
- Integração com filtros

**Métodos principais:**
- `createChart(type, canvasId, data, options)` - Criar gráfico
- `updateChart(chartId, data)` - Atualizar gráfico existente
- `destroyChart(chartId)` - Destruir gráfico

---

### 2. **DataLoader** - `core/dataLoader.js`
**Função:** Carregamento inteligente de dados da API

**Recursos:**
- Cache automático
- Retry em caso de falha
- Suporte a filtros
- Loading states
- Error handling

**Métodos principais:**
- `load(endpoint, options)` - Carregar dados
- `clearCache()` - Limpar cache
- `getCache(key)` - Obter do cache

---

### 3. **GlobalStore** - `core/global-store.js`
**Função:** Store global de dados compartilhados

**Recursos:**
- Armazenamento centralizado
- Invalidação automática
- TTL por chave
- Eventos de mudança

**Métodos principais:**
- `set(key, value, ttl)` - Armazenar valor
- `get(key)` - Obter valor
- `has(key)` - Verificar existência
- `clear()` - Limpar store

---

### 4. **Crossfilter** - `core/crossfilter-*.js`
**Função:** Sistema de filtros multi-dimensionais

**Componentes:**
- `crossfilter-overview.js` - Filtros principais
- `crossfilter-core.js` - Core do sistema
- `crossfilter-adapter.js` - Adaptador para gráficos

**Recursos:**
- Filtros compostos
- Histórico de filtros
- Banner de filtros ativos
- Integração com todas as páginas

---

### 5. **Chart Communication** - `core/chart-communication/`
**Função:** Sistema de comunicação entre gráficos

**Componentes:**
- `auto-connect.js` - Conexão automática
- `chart-registry.js` - Registro de gráficos
- `event-bus.js` - Barramento de eventos
- `global-filters.js` - Filtros globais

**Recursos:**
- Auto-detecção de gráficos
- Comunicação bidirecional
- Filtros sincronizados
- Eventos customizados

---

### 6. **Filter Banner** - `core/filter-banner.js`
**Função:** Banner visual de filtros ativos

**Recursos:**
- Exibição de filtros ativos
- Remoção individual de filtros
- Limpar todos os filtros
- Contador de filtros

---

### 7. **Config** - `core/config.js`
**Função:** Configurações globais do sistema

**Recursos:**
- Cores padrão
- Configurações de gráficos
- URLs da API
- Constantes do sistema

---

## 📄 PÁGINAS DO SISTEMA

### 🏛️ OUVIDORIA (20 páginas)

**Localização:** `pages/ouvidoria/`

1. **overview.js** - Visão Geral
   - KPIs principais
   - Gráficos: Status, Mês, Dia, Tema, Órgão
   - Sistema de filtros crossfilter

2. **orgao-mes.js** - Por Órgão e Mês
   - Lista de órgãos
   - Gráfico por mês
   - Top 5 órgãos

3. **tema.js** - Por Tema
   - Lista de temas
   - Gráfico de barras
   - Evolução temporal

4. **assunto.js** - Por Assunto
   - Lista de assuntos
   - Gráfico de barras
   - Evolução temporal

5. **status.js** - Por Status
   - Cards de status
   - Gráfico de pizza
   - Evolução temporal

6. **tipo.js** - Por Tipo
   - Lista de tipos
   - Gráfico de pizza
   - Cores semânticas

7. **bairro.js** - Por Bairro
   - Lista de bairros
   - Gráfico de barras
   - Evolução temporal

8. **canal.js** - Por Canal
   - Lista de canais
   - Gráfico de pizza

9. **prioridade.js** - Por Prioridade
   - Lista de prioridades
   - Gráfico de pizza

10. **responsavel.js** - Por Responsável
    - Lista de responsáveis
    - Gráfico de barras

11. **cadastrante.js** - Por Cadastrante
    - Lista de unidades cadastrantes
    - Gráfico de barras

12. **tempo-medio.js** - Tempo Médio
    - Estatísticas de tempo
    - Gráfico de linha temporal

13. **vencimento.js** - Vencimento
    - Protocolos vencidos
    - Próximos vencimentos
    - Gráfico por mês

14. **protocolos-demora.js** - Protocolos com Maior Demora
    - Tabela de protocolos
    - Ordenação por demora

15. **notificacoes.js** - Notificações de Email
    - Lista de notificações
    - Status de envio
    - Filtros

16. **reclamacoes.js** - Reclamações e Denúncias
    - Filtro automático por tipo
    - Gráficos específicos

17. **projecao-2026.js** - Projeção 2026
    - Gráficos de projeção
    - Análise de tendências

18. **unidades-saude.js** - Unidades de Saúde
    - Lista de unidades
    - Gráficos por unidade

19. **unit.js** - Página Dinâmica de Unidade
    - Dados de unidade específica
    - Gráficos personalizados

20. **cora-chat.js** - Cora Chat (IA)
    - Interface de chat
    - Integração com Gemini

**Páginas Crossfilter:**
- `assunto-crossfilter.js`
- `responsavel-crossfilter.js`
- `status-crossfilter.js`
- `tema-crossfilter.js`

---

### 🏗️ ZELADORIA (14 páginas)

**Localização:** `pages/zeladoria/`

1. **zeladoria-main.js** - Router Principal
2. **zeladoria-overview.js** - Visão Geral
3. **zeladoria-status.js** - Por Status
4. **zeladoria-categoria.js** - Por Categoria
5. **zeladoria-departamento.js** - Por Departamento
6. **zeladoria-bairro.js** - Por Bairro
7. **zeladoria-responsavel.js** - Por Responsável
8. **zeladoria-canal.js** - Por Canal
9. **zeladoria-tempo.js** - Tempo de Resolução
10. **zeladoria-mensal.js** - Por Mês
11. **zeladoria-geografica.js** - Análise Geográfica
12. **zeladoria-mapa.js** - Mapa Interativo (Leaflet)
13. **zeladoria-colab.js** - Integração Colab
14. **zeladoria-cora-chat.js** - Chat IA

---

### 📋 E-SIC (8 páginas)

**Localização:** `pages/esic/`

1. **esic-main.js** - Router Principal
2. **esic-overview.js** - Visão Geral
3. **esic-status.js** - Por Status
4. **esic-tipo-informacao.js** - Por Tipo de Informação
5. **esic-responsavel.js** - Por Responsável
6. **esic-unidade.js** - Por Unidade
7. **esic-canal.js** - Por Canal
8. **esic-mensal.js** - Por Mês

---

### 🎛️ PAINEL CENTRAL

**Localização:** `pages/central/`

1. **central-dashboard.js** - Dashboard Principal
   - KPIs consolidados
   - Visão geral de todos os sistemas
   - Gráficos comparativos

---

### ⚙️ CONFIGURAÇÕES

**Localização:** `pages/`

1. **configuracoes.js** - Página de Configurações
   - Configurações de cache
   - Configurações de notificações
   - Configurações de SLA
   - Gerenciamento de secretarias

2. **filtros-avancados.js** - Filtros Avançados
   - Interface de filtros compostos
   - Salvamento de filtros

---

## 🔧 MÓDULOS AUXILIARES

**Localização:** `modules/`

- Módulos específicos para funcionalidades isoladas
- Integrações com bibliotecas externas
- Helpers e utilitários específicos

---

## 🛠️ UTILS FRONTEND

**Localização:** `utils/`

- Utilitários de formatação
- Helpers de data
- Funções auxiliares
- Validadores

---

## 🔗 INTEGRAÇÕES

### Chart.js
- Lazy loading automático
- Versão: 4.x
- Tipos: pizza, barras, linha, radar

### Leaflet
- Lazy loading para mapas
- Usado em: zeladoria-mapa.js

### Gemini API
- Integração via backend
- Endpoint: `/api/chat`
- Reindexação: `/api/chat/reindex`

---

## 📊 PADRÃO DE ESTRUTURA DAS PÁGINAS

Todas as páginas seguem um padrão similar:

```javascript
// 1. Função de carregamento principal
async function loadPageName(forceRefresh = false) {
  // Verificar se página está visível
  // Coletar filtros globais
  // Carregar dados (com ou sem filtros)
  // Normalizar dados
  // Renderizar gráficos
  // Atualizar KPIs
  // Renderizar listas/tabelas
}

// 2. Funções de renderização
function renderChart(data) { }
function renderList(data) { }
function updateKPIs(data) { }

// 3. Funções de filtros
function initFilterListeners() { }
function applyFilter(field, value) { }
function clearFilters() { }

// 4. Exportação
window.loadPageName = loadPageName;
```

---

## ✅ CHECKUP DO FRONTEND

### ✅ Sistemas Globais
- [x] ChartFactory funcionando
- [x] DataLoader funcionando
- [x] GlobalStore funcionando
- [x] Crossfilter funcionando
- [x] Chart Communication funcionando
- [x] Filter Banner funcionando

### ✅ Páginas
- [x] Todas as 20 páginas de Ouvidoria funcionando
- [x] Todas as 14 páginas de Zeladoria funcionando
- [x] Todas as 8 páginas de E-SIC funcionando
- [x] Painel Central funcionando
- [x] Página de Configurações funcionando

### ✅ Integrações
- [x] Chart.js integrado
- [x] Leaflet integrado
- [x] Gemini API integrado
- [x] Backend API integrado

---

**Última Atualização:** 12/12/2025

