# 📄 PÁGINAS DO SISTEMA

**Localização:** `NOVO/public/scripts/pages/`  
**Data:** 11/12/2025  
**CÉREBRO X-3**

---

## 📋 ÍNDICE

1. [Páginas de Ouvidoria](#páginas-de-ouvidoria) (20 páginas)
2. [Páginas de Zeladoria](#páginas-de-zeladoria) (14 páginas)
3. [Páginas de E-SIC](#páginas-de-e-sic) (8 páginas)
4. [Páginas Auxiliares](#páginas-auxiliares)

---

## 🏛️ PÁGINAS DE OUVIDORIA

**Localização:** `pages/ouvidoria/`  
**Total:** 20 páginas

### 1. **overview.js** - Visão Geral
**Arquivo:** `ouvidoria/overview.js`  
**Função:** Dashboard principal com visão geral de todas as manifestações

**O que faz:**
- Exibe KPIs principais (total, últimos 7/30 dias)
- Gráficos por status, mês, dia, tema, órgão
- Sistema de filtros crossfilter
- Banner de filtros ativos
- Cards de resumo

**Gráficos:**
- Pizza: Status
- Barras: Por mês
- Linha: Por dia (últimos 30 dias)
- Barras horizontais: Top 5 temas
- Barras horizontais: Top 5 órgãos

**Integrações:**
- Usa: `crossfilter-overview.js` (filtros)
- Usa: `chart-factory.js` (gráficos)
- Usa: `dataLoader.js` (dados)
- Endpoint: `/api/dashboard-data`

---

### 2. **orgao-mes.js** - Por Órgão e Mês
**Arquivo:** `ouvidoria/orgao-mes.js`  
**Função:** Análise de manifestações por órgão e período mensal

**O que faz:**
- Lista de órgãos com contagem
- Gráfico de barras por mês
- Gráfico de barras horizontais (top 5 órgãos)
- KPIs: Total, Órgãos únicos, Média, Período
- Busca e ordenação de órgãos
- Filtros por órgão e mês

**Gráficos:**
- Barras verticais: Manifestações por mês
- Barras horizontais: Top 5 órgãos
- Lista interativa: Todos os órgãos

**Integrações:**
- Usa: Sistema global de filtros
- Endpoints: `/api/aggregate/count-by?field=Orgaos`, `/api/aggregate/by-month`

---

### 3. **tema.js** - Por Tema
**Arquivo:** `ouvidoria/tema.js`  
**Função:** Análise de manifestações por tema

**O que faz:**
- Lista de temas com contagem
- Gráfico de barras por tema
- Gráfico de linha temporal (tema por mês)
- Filtros por tema

**Gráficos:**
- Barras: Top temas
- Linha: Evolução temporal por tema

---

### 4. **assunto.js** - Por Assunto
**Arquivo:** `ouvidoria/assunto.js`  
**Função:** Análise de manifestações por assunto

**O que faz:**
- Lista de assuntos
- Gráfico de barras
- Evolução temporal

---

### 5. **status.js** - Por Status
**Arquivo:** `ouvidoria/status.js`  
**Função:** Análise de manifestações por status

**O que faz:**
- Cards de status (Aberto, Fechado, Pendente, etc.)
- Gráfico de pizza
- Evolução temporal por status
- Filtros por status

---

### 6. **tipo.js** - Por Tipo
**Arquivo:** `ouvidoria/tipo.js`  
**Função:** Análise por tipo de manifestação (Elogio, Reclamação, Denúncia, etc.)

**O que faz:**
- Lista de tipos
- Gráfico de pizza
- Cores semânticas (verde=elogio, laranja=reclamação, vermelho=denúncia)

---

### 7. **bairro.js** - Por Bairro
**Arquivo:** `ouvidoria/bairro.js`  
**Função:** Análise geográfica por bairro

**O que faz:**
- Lista de bairros
- Gráfico de barras
- Evolução temporal

---

### 8. **canal.js** - Por Canal
**Arquivo:** `ouvidoria/canal.js`  
**Função:** Análise por canal de entrada

**O que faz:**
- Lista de canais (Site, E-mail, Presencial, Telefone, etc.)
- Gráfico de pizza
- Cores por canal

---

### 9. **prioridade.js** - Por Prioridade
**Arquivo:** `ouvidoria/prioridade.js`  
**Função:** Análise por prioridade

**O que faz:**
- Lista de prioridades (Alta, Média, Baixa)
- Gráfico de pizza
- Cores semânticas

---

### 10. **responsavel.js** - Por Responsável
**Arquivo:** `ouvidoria/responsavel.js`  
**Função:** Análise por responsável

**O que faz:**
- Lista de responsáveis
- Gráfico de barras
- Contagem por responsável

---

### 11. **cadastrante.js** - Por Cadastrante
**Arquivo:** `ouvidoria/cadastrante.js`  
**Função:** Análise por unidade cadastrante (UAC)

**O que faz:**
- Lista de unidades cadastrantes
- Gráfico de barras
- Filtros por unidade

---

### 12. **tempo-medio.js** - Tempo Médio
**Arquivo:** `ouvidoria/tempo-medio.js`  
**Função:** Análise de tempo médio de resolução

**O que faz:**
- Estatísticas de tempo médio
- Gráfico de linha temporal
- Comparação por período
- Endpoint: `/api/stats/average-time/stats`

---

### 13. **vencimento.js** - Vencimento
**Arquivo:** `ouvidoria/vencimento.js`  
**Função:** Análise de protocolos vencidos e próximos vencimentos

**O que faz:**
- Lista de protocolos vencidos
- Lista de próximos vencimentos
- Gráfico de barras (vencimentos por mês)
- Filtros por status e data
- Endpoint: `/api/vencimento`

---

### 14. **protocolos-demora.js** - Protocolos com Maior Demora
**Arquivo:** `ouvidoria/protocolos-demora.js`  
**Função:** Lista dos protocolos com maior tempo de demora

**O que faz:**
- Tabela de protocolos
- Ordenação por tempo de demora
- Filtros
- Endpoint: `/api/aggregate/top-protocolos-demora`

---

### 15. **notificacoes.js** - Notificações de Email
**Arquivo:** `ouvidoria/notificacoes.js`  
**Função:** Visualização de notificações de email enviadas

**O que faz:**
- Lista de notificações
- Status de envio
- Filtros por tipo e data
- Endpoint: `/api/notificacoes`

---

### 16. **reclamacoes.js** - Reclamações e Denúncias
**Arquivo:** `ouvidoria/reclamacoes.js`  
**Função:** Análise específica de reclamações e denúncias

**O que faz:**
- Filtro automático por tipo (Reclamação, Denúncia)
- Gráficos específicos
- Análise comparativa

---

### 17. **projecao-2026.js** - Projeção 2026
**Arquivo:** `ouvidoria/projecao-2026.js`  
**Função:** Projeções e previsões para 2026

**O que faz:**
- Gráficos de projeção
- Análise de tendências
- Previsões baseadas em dados históricos

---

### 18. **unidades-saude.js** - Unidades de Saúde
**Arquivo:** `ouvidoria/unidades-saude.js`  
**Função:** Análise por unidades de saúde

**O que faz:**
- Lista de unidades
- Gráficos por unidade
- Filtros

---

### 19. **unit.js** - Página Dinâmica de Unidade
**Arquivo:** `ouvidoria/unit.js`  
**Função:** Página dinâmica para análise de unidades específicas

**O que faz:**
- Carrega dados de uma unidade específica
- Gráficos personalizados
- Endpoint: `/api/unit/:name`

---

### 20. **cora-chat.js** - Cora Chat (IA)
**Arquivo:** `ouvidoria/cora-chat.js`  
**Função:** Chat com IA para análise de dados

**O que faz:**
- Interface de chat
- Integração com Gemini
- Análise inteligente de dados
- Endpoint: `/api/chat`

---

## 🏗️ PÁGINAS DE ZELADORIA

**Localização:** `pages/zeladoria/`  
**Total:** 14 páginas

### 1. **zeladoria-main.js** - Página Principal
**Função:** Dashboard principal de Zeladoria

### 2. **zeladoria-overview.js** - Visão Geral
**Função:** Visão geral de demandas de Zeladoria

### 3. **zeladoria-status.js** - Por Status
**Função:** Análise por status de demanda

### 4. **zeladoria-categoria.js** - Por Categoria
**Função:** Análise por categoria

### 5. **zeladoria-departamento.js** - Por Departamento
**Função:** Análise por departamento

### 6. **zeladoria-bairro.js** - Por Bairro
**Função:** Análise geográfica

### 7. **zeladoria-responsavel.js** - Por Responsável
**Função:** Análise por responsável

### 8. **zeladoria-canal.js** - Por Canal
**Função:** Análise por canal

### 9. **zeladoria-tempo.js** - Tempo de Resolução
**Função:** Análise de tempo

### 10. **zeladoria-mensal.js** - Por Mês
**Função:** Análise mensal

### 11. **zeladoria-geografica.js** - Análise Geográfica
**Função:** Visualização geográfica avançada

### 12. **zeladoria-mapa.js** - Mapa Interativo
**Função:** Mapa com Leaflet

### 13. **zeladoria-colab.js** - Colaboração
**Função:** Sistema de colaboração

### 14. **zeladoria-cora-chat.js** - Chat IA
**Função:** Chat com IA para Zeladoria

---

## 📋 PÁGINAS DE E-SIC

**Localização:** `pages/esic/`  
**Total:** 8 páginas

### 1. **esic-main.js** - Página Principal
**Função:** Dashboard principal de E-SIC

### 2. **esic-overview.js** - Visão Geral
**Função:** Visão geral de pedidos E-SIC

### 3. **esic-status.js** - Por Status
**Função:** Análise por status

### 4. **esic-tipo-informacao.js** - Por Tipo de Informação
**Função:** Análise por tipo

### 5. **esic-responsavel.js** - Por Responsável
**Função:** Análise por responsável

### 6. **esic-unidade.js** - Por Unidade
**Função:** Análise por unidade

### 7. **esic-canal.js** - Por Canal
**Função:** Análise por canal

### 8. **esic-mensal.js** - Por Mês
**Função:** Análise mensal

---

## 🔧 PÁGINAS AUXILIARES

### **filtros-avancados.js**
**Função:** Página de filtros avançados

---

## 📊 PADRÃO DE ESTRUTURA DAS PÁGINAS

Todas as páginas seguem um padrão similar:

```javascript
// 1. Função de carregamento principal
async function loadPageName(forceRefresh = false) {
  // Verificar se página está visível
  // Coletar filtros
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

## 🔗 INTEGRAÇÕES COMUNS

Todas as páginas usam:

- **dataLoader:** Carregamento de dados
- **chartFactory:** Criação de gráficos
- **chartCommunication:** Sistema de filtros
- **config:** Configurações e cores
- **globalStore:** Cache de dados

---

## ✅ CHECKUP DAS PÁGINAS

### ✅ Ouvidoria (20 páginas)
- [x] overview.js - Funcional
- [x] orgao-mes.js - Funcional (KPIs corrigidos)
- [x] tema.js - Funcional
- [x] assunto.js - Funcional
- [x] status.js - Funcional
- [x] tipo.js - Funcional
- [x] bairro.js - Funcional
- [x] canal.js - Funcional
- [x] prioridade.js - Funcional
- [x] responsavel.js - Funcional
- [x] cadastrante.js - Funcional
- [x] tempo-medio.js - Funcional
- [x] vencimento.js - Funcional
- [x] protocolos-demora.js - Funcional
- [x] notificacoes.js - Funcional
- [x] reclamacoes.js - Funcional
- [x] projecao-2026.js - Funcional
- [x] unidades-saude.js - Funcional
- [x] unit.js - Funcional
- [x] cora-chat.js - Funcional

### ✅ Zeladoria (14 páginas)
- [x] Todas as páginas implementadas
- [x] Integração com backend funcionando

### ✅ E-SIC (8 páginas)
- [x] Todas as páginas implementadas
- [x] Integração com backend funcionando

---

**Última Atualização:** 11/12/2025

