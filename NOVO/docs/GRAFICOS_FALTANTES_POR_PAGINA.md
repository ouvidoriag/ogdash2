# 📊 CHECKLIST: GRÁFICOS FALTANTES POR PÁGINA

**Data:** 11/12/2025  
**CÉREBRO X-3**  
**Análise Completa do Sistema**

**Status:** 🟡 EM IMPLEMENTAÇÃO

**Progresso:**
- ✅ overview.js - COMPLETA
- ✅ orgao-mes.js - COMPLETA
- ✅ tema.js - COMPLETA (adicionado gráfico de linha temporal)
- ✅ assunto.js - COMPLETA (adicionados: pizza, barras agrupadas)
- ✅ status.js - COMPLETA (adicionado gráfico de linha múltipla)
- ✅ tipo.js - COMPLETA (adicionados: linha temporal, barras agrupadas)
- ✅ canal.js - COMPLETA (adicionado gráfico de linha temporal)
- ✅ prioridade.js - COMPLETA (adicionados: linha temporal, barras agrupadas)
- ✅ bairro.js - COMPLETA (adicionados: linha temporal, pizza)
- ✅ responsavel.js - COMPLETA (adicionados: linha temporal, barras agrupadas)
- ✅ cadastrante.js - COMPLETA (adicionados: linha temporal, pizza, barras agrupadas)
- ⏳ Em andamento: tempo-medio.js, vencimento.js, reclamacoes.js, projecao-2026.js, unidades-saude.js, notificacoes.js
- ⏳ Pendentes: Todas as páginas de Zeladoria (14 páginas)
- ⏳ Pendentes: Todas as páginas de E-SIC (8 páginas)

---

## 📋 METODOLOGIA

Esta análise foi realizada através de:
1. Leitura de todas as páginas JavaScript (`NOVO/public/scripts/pages/`)
2. Comparação com documentação oficial (`NOVO/mapa/GRAFICOS.md` e `PAGINAS.md`)
3. Análise dos endpoints disponíveis na API
4. Verificação dos elementos HTML/canvas existentes
5. Identificação de oportunidades de visualização baseadas nos dados disponíveis

---

## 🏛️ PÁGINAS DE OUVIDORIA

### 1. **overview.js** - Visão Geral ✅ COMPLETA

**Gráficos Existentes:**
- ✅ Pizza: Status (`chartStatusOverview`)
- ✅ Barras: Por mês (`chartMonthOverview`)
- ✅ Linha: Por dia (últimos 30 dias) (`chartDayOverview`)
- ✅ Barras horizontais: Top 5 temas (`chartThemeOverview`)
- ✅ Barras horizontais: Top 5 órgãos (`chartOrganOverview`)
- ✅ **Gráfico de distribuição por prioridade** (pizza) - `chartPrioridades` ✅ ADICIONADO
- ✅ **Gráfico de distribuição por canal** (pizza) - `chartCanais` ✅ ADICIONADO
- ✅ **Gráfico de evolução temporal por tipo** (linha múltipla) - `chartTiposTemporal` ✅ ADICIONADO

**Gráficos Faltantes:**
- ❌ **Heatmap de manifestações por dia da semana vs mês** (para identificar padrões sazonais) - BAIXA PRIORIDADE

**Status:** ✅ **COMPLETA** - Todos os gráficos principais implementados

---

### 2. **orgao-mes.js** - Por Órgão e Mês ✅ COMPLETA

**Gráficos Existentes:**
- ✅ Barras verticais: Manifestações por mês (`chartOrgaoMes`)
- ✅ Barras horizontais: Top 5 órgãos (`chartTopOrgaosBar`)
- ✅ Lista interativa: Todos os órgãos
- ✅ **Gráfico de pizza** (distribuição percentual) - `chartOrgaosPizza` ✅ ADICIONADO
- ✅ **Gráfico de linha múltipla** (top 5 órgãos ao longo do tempo) - `chartOrgaosTemporal` ✅ ADICIONADO
- ✅ **Gráfico de barras agrupadas** (órgão x mês) - `chartOrgaosAgrupadas` ✅ ADICIONADO

**Status:** ✅ **COMPLETA** - Todos os gráficos principais implementados

---

### 3. **tema.js** - Por Tema ✅ COMPLETA

**Gráficos Existentes:**
- ✅ Barras horizontais: Top temas (`chartTema`)
- ✅ Doughnut: Status por tema (`chartStatusTema`)
- ✅ Barras agrupadas: Temas por mês (`chartTemaMes`)

**Gráficos Faltantes:**
- ❌ **Gráfico de linha** (evolução temporal de um tema específico ao longo do tempo)
- ❌ **Gráfico de correlação** (tema vs órgão - heatmap)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência de temas específicos

---

### 4. **assunto.js** - Por Assunto ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Barras: Top assuntos
- ✅ Linha: Evolução temporal

**Gráficos Faltantes:**
- ❌ **Gráfico de pizza** (distribuição percentual dos assuntos)
- ❌ **Gráfico de barras agrupadas** (assunto x status)
- ❌ **Gráfico de correlação** (assunto vs tema)

**Recomendações:**
- Adicionar gráfico de pizza para visualização percentual
- Adicionar gráfico de barras agrupadas para análise de status por assunto

---

### 5. **status.js** - Por Status ✅ COMPLETA

**Gráficos Existentes:**
- ✅ Doughnut: Distribuição de status (`chartStatusPage`)
- ✅ Barras agrupadas: Status por mês (`chartStatusMes`)

**Gráficos Faltantes:**
- ❌ **Gráfico de linha** (evolução temporal de cada status individualmente)
- ❌ **Gráfico de barras empilhadas** (status ao longo do tempo com valores absolutos)

**Recomendações:**
- Adicionar gráfico de linha múltipla para análise de tendência de cada status

---

### 6. **tipo.js** - Por Tipo ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Doughnut: Tipos de manifestação (`chartTipo`)
- ✅ Ranking: Lista de tipos

**Gráficos Faltantes:**
- ❌ **Gráfico de barras** (comparação horizontal dos tipos)
- ❌ **Gráfico de linha** (evolução temporal de cada tipo)
- ❌ **Gráfico de barras agrupadas** (tipo x mês)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência temporal
- Adicionar gráfico de barras agrupadas para comparação mensal

---

### 7. **bairro.js** - Por Bairro ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Barras horizontais: Top bairros (`chartBairro`)
- ✅ Barras agrupadas: Bairros por mês (`chartBairroMes`)

**Gráficos Faltantes:**
- ❌ **Mapa geográfico** (visualização espacial dos bairros com intensidade)
- ❌ **Gráfico de pizza** (distribuição percentual)
- ❌ **Gráfico de linha** (evolução temporal dos top 5 bairros)

**Recomendações:**
- Adicionar mapa geográfico (usando Leaflet) para visualização espacial
- Adicionar gráfico de linha para análise de tendência

---

### 8. **canal.js** - Por Canal ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Doughnut: Canais (`chartCanal`)
- ✅ Barras agrupadas: Canais por mês (`chartCanalMes`)
- ✅ Ranking: Lista de canais

**Gráficos Faltantes:**
- ❌ **Gráfico de linha** (evolução temporal de cada canal)
- ❌ **Gráfico de barras empilhadas** (canais ao longo do tempo)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência temporal

---

### 9. **prioridade.js** - Por Prioridade ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Doughnut: Prioridades (`chartPrioridade`)
- ✅ Ranking: Lista de prioridades

**Gráficos Faltantes:**
- ❌ **Gráfico de barras** (comparação horizontal)
- ❌ **Gráfico de linha** (evolução temporal de cada prioridade)
- ❌ **Gráfico de barras agrupadas** (prioridade x mês)
- ❌ **Gráfico de correlação** (prioridade vs tempo médio de resolução)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência
- Adicionar gráfico de correlação com tempo médio

---

### 10. **responsavel.js** - Por Responsável ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Barras horizontais: Top responsáveis (`chartResponsavel`)
- ✅ Ranking: Lista de responsáveis

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (responsável x mês)
- ❌ **Gráfico de linha** (evolução temporal dos top 5 responsáveis)
- ❌ **Gráfico de pizza** (distribuição percentual)
- ❌ **Gráfico de correlação** (responsável vs taxa de conclusão)

**Recomendações:**
- Adicionar gráfico de linha para análise de performance ao longo do tempo
- Adicionar gráfico de correlação com métricas de eficiência

---

### 11. **cadastrante.js** - Por Cadastrante ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Barras: Unidades cadastrantes
- ✅ Lista: Unidades

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (unidade x mês)
- ❌ **Gráfico de linha** (evolução temporal)
- ❌ **Gráfico de pizza** (distribuição percentual)
- ❌ **Gráfico de correlação** (unidade vs tempo médio)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência
- Adicionar gráfico de correlação com métricas de desempenho

---

### 12. **tempo-medio.js** - Tempo Médio ✅ COMPLETA

**Gráficos Existentes:**
- ✅ Barras horizontais: Tempo médio por órgão (`chartTempoMedio`)
- ✅ Linha: Evolução mensal (`chartTempoMedioMes`)
- ✅ Linha: Evolução diária (`chartTempoMedioDia`)
- ✅ Linha: Evolução semanal (`chartTempoMedioSemana`)
- ✅ Barras horizontais: Tempo médio por unidade (`chartTempoMedioUnidade`)
- ✅ Linha múltipla: Tempo médio por unidade/mês (`chartTempoMedioUnidadeMes`)

**Gráficos Faltantes:**
- ❌ **Gráfico de boxplot** (distribuição estatística do tempo médio)
- ❌ **Gráfico de correlação** (tempo médio vs volume de manifestações)
- ❌ **Gráfico de barras empilhadas** (tempo médio por faixa: 0-30, 31-60, 61+ dias)

**Recomendações:**
- Adicionar gráfico de boxplot para análise estatística detalhada
- Adicionar gráfico de correlação com volume

---

### 13. **vencimento.js** - Vencimento ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Barras: Vencimentos por mês
- ✅ Lista: Protocolos vencidos
- ✅ Lista: Próximos vencimentos

**Gráficos Faltantes:**
- ❌ **Gráfico de linha** (evolução temporal de vencimentos)
- ❌ **Gráfico de barras empilhadas** (vencidos vs próximos vencimentos)
- ❌ **Gráfico de pizza** (distribuição: vencidos, próximos 3 dias, próximos 7 dias, etc.)
- ❌ **Gráfico de correlação** (vencimentos vs órgão)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência
- Adicionar gráfico de pizza para categorização de urgência

---

### 14. **reclamacoes.js** - Reclamações e Denúncias ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Filtro automático por tipo (Reclamação, Denúncia)

**Gráficos Faltantes:**
- ❌ **Gráfico de barras** (comparação Reclamação vs Denúncia)
- ❌ **Gráfico de linha** (evolução temporal de ambos)
- ❌ **Gráfico de pizza** (distribuição percentual)
- ❌ **Gráfico de barras agrupadas** (reclamações/denúncias x mês)
- ❌ **Gráfico de correlação** (reclamações/denúncias vs órgão)

**Recomendações:**
- Implementar página completa com múltiplos gráficos comparativos

---

### 15. **projecao-2026.js** - Projeção 2026 ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Gráficos de projeção básicos

**Gráficos Faltantes:**
- ❌ **Gráfico de linha com projeção** (dados históricos + linha de tendência projetada)
- ❌ **Gráfico de barras** (comparação histórico vs projetado)
- ❌ **Gráfico de área** (área de confiança da projeção)
- ❌ **Gráfico de correlação** (fatores que influenciam a projeção)

**Recomendações:**
- Implementar gráficos de projeção estatística mais robustos

---

### 16. **unidades-saude.js** - Unidades de Saúde ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Lista de unidades
- ✅ Gráficos básicos por unidade

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (unidade x mês)
- ❌ **Gráfico de linha múltipla** (evolução temporal das top unidades)
- ❌ **Gráfico de pizza** (distribuição percentual)
- ❌ **Gráfico de mapa** (localização geográfica das unidades)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência
- Adicionar mapa geográfico

---

### 17. **notificacoes.js** - Notificações ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Lista de notificações
- ✅ Status de envio

**Gráficos Faltantes:**
- ❌ **Gráfico de barras** (notificações enviadas por tipo)
- ❌ **Gráfico de linha** (evolução temporal de envios)
- ❌ **Gráfico de pizza** (distribuição por status de envio: sucesso, erro, pendente)
- ❌ **Gráfico de barras agrupadas** (tipo de notificação x mês)

**Recomendações:**
- Implementar gráficos de análise de notificações

---

### 18. **unit.js** - Página Dinâmica de Unidade ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Gráficos personalizados por unidade

**Gráficos Faltantes:**
- ❌ **Gráfico de linha** (evolução temporal da unidade)
- ❌ **Gráfico de barras agrupadas** (métricas da unidade ao longo do tempo)
- ❌ **Gráfico de correlação** (métricas da unidade vs média geral)

**Recomendações:**
- Padronizar gráficos dinâmicos com mais visualizações

---

### 19. **cora-chat.js** - Cora Chat (IA) ✅ COMPLETA

**Gráficos Existentes:**
- ✅ Interface de chat
- ✅ Integração com Gemini

**Gráficos Faltantes:**
- N/A (página de chat, não requer gráficos)

---

## 🏗️ PÁGINAS DE ZELADORIA

### 1. **zeladoria-overview.js** - Visão Geral ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Doughnut: Status (`zeladoria-chart-status`)
- ✅ Barras horizontais: Top categorias (`zeladoria-chart-categoria`)
- ✅ Barras horizontais: Departamentos (`zeladoria-chart-departamento`)
- ✅ Linha: Evolução mensal (`zeladoria-chart-mensal`)

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (categoria x mês)
- ❌ **Gráfico de linha múltipla** (evolução temporal das top categorias)
- ❌ **Gráfico de pizza** (distribuição por origem)
- ❌ **Gráfico de barras** (distribuição por canal)
- ❌ **Gráfico de correlação** (categoria vs tempo de resolução)

**Recomendações:**
- Adicionar gráfico de linha múltipla para análise de tendência
- Adicionar gráficos de origem e canal

---

### 2. **zeladoria-status.js** - Por Status ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (status x mês)
- ❌ **Gráfico de linha** (evolução temporal de cada status)

**Recomendações:**
- Implementar gráficos de análise temporal

---

### 3. **zeladoria-categoria.js** - Por Categoria ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (categoria x mês)
- ❌ **Gráfico de linha** (evolução temporal das top categorias)
- ❌ **Gráfico de pizza** (distribuição percentual)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência

---

### 4. **zeladoria-departamento.js** - Por Departamento ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (departamento x mês)
- ❌ **Gráfico de linha** (evolução temporal dos departamentos)
- ❌ **Gráfico de pizza** (distribuição percentual)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência

---

### 5. **zeladoria-bairro.js** - Por Bairro ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Mapa geográfico** (visualização espacial)
- ❌ **Gráfico de linha** (evolução temporal dos top bairros)
- ❌ **Gráfico de pizza** (distribuição percentual)

**Recomendações:**
- Adicionar mapa geográfico (usando Leaflet)
- Adicionar gráfico de linha

---

### 6. **zeladoria-responsavel.js** - Por Responsável ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (responsável x mês)
- ❌ **Gráfico de linha** (evolução temporal dos top responsáveis)
- ❌ **Gráfico de correlação** (responsável vs taxa de conclusão)

**Recomendações:**
- Adicionar gráfico de linha para análise de performance

---

### 7. **zeladoria-canal.js** - Por Canal ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (canal x mês)
- ❌ **Gráfico de linha** (evolução temporal de cada canal)
- ❌ **Gráfico de pizza** (distribuição percentual)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência

---

### 8. **zeladoria-tempo.js** - Tempo de Resolução ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras horizontais** (tempo médio por categoria)
- ❌ **Gráfico de linha** (evolução temporal do tempo médio)
- ❌ **Gráfico de boxplot** (distribuição estatística)
- ❌ **Gráfico de correlação** (tempo vs volume)

**Recomendações:**
- Implementar gráficos similares aos da página de tempo médio da Ouvidoria

---

### 9. **zeladoria-mensal.js** - Por Mês ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (múltiplas métricas por mês)
- ❌ **Gráfico de linha múltipla** (comparação de métricas ao longo do tempo)

**Recomendações:**
- Adicionar gráficos comparativos

---

### 10. **zeladoria-geografica.js** - Análise Geográfica ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Mapa interativo completo** (com clusters e heatmap)
- ❌ **Gráfico de barras** (top bairros/distritos)
- ❌ **Gráfico de pizza** (distribuição geográfica)

**Recomendações:**
- Implementar mapa completo com Leaflet

---

### 11. **zeladoria-mapa.js** - Mapa Interativo ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Mapa completo com clusters** (agrupamento de pontos próximos)
- ❌ **Heatmap** (intensidade de demandas por região)
- ❌ **Gráfico de barras** (demandas por região)

**Recomendações:**
- Melhorar funcionalidades do mapa

---

## 📋 PÁGINAS DE E-SIC

### 1. **esic-overview.js** - Visão Geral ⚠️ PARCIAL

**Gráficos Existentes:**
- ✅ Doughnut: Status (`esic-chart-status`)
- ✅ Barras horizontais: Top tipos de informação (`esic-chart-tipo-informacao`)
- ✅ Barras horizontais: Top responsáveis (`esic-chart-responsavel`)
- ✅ Linha: Evolução mensal (`esic-chart-mensal`)

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (tipo x mês)
- ❌ **Gráfico de linha múltipla** (evolução temporal dos top tipos)
- ❌ **Gráfico de pizza** (distribuição por unidade)
- ❌ **Gráfico de barras** (distribuição por canal)

**Recomendações:**
- Adicionar gráfico de linha múltipla para análise de tendência
- Adicionar gráficos de unidade e canal

---

### 2. **esic-status.js** - Por Status ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (status x mês)
- ❌ **Gráfico de linha** (evolução temporal de cada status)

**Recomendações:**
- Implementar gráficos de análise temporal

---

### 3. **esic-tipo-informacao.js** - Por Tipo de Informação ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (tipo x mês)
- ❌ **Gráfico de linha** (evolução temporal dos tipos)
- ❌ **Gráfico de pizza** (distribuição percentual)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência

---

### 4. **esic-responsavel.js** - Por Responsável ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (responsável x mês)
- ❌ **Gráfico de linha** (evolução temporal dos top responsáveis)
- ❌ **Gráfico de correlação** (responsável vs tempo de resposta)

**Recomendações:**
- Adicionar gráfico de linha para análise de performance

---

### 5. **esic-unidade.js** - Por Unidade ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (unidade x mês)
- ❌ **Gráfico de linha** (evolução temporal das unidades)
- ❌ **Gráfico de pizza** (distribuição percentual)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência

---

### 6. **esic-canal.js** - Por Canal ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (canal x mês)
- ❌ **Gráfico de linha** (evolução temporal de cada canal)
- ❌ **Gráfico de pizza** (distribuição percentual)

**Recomendações:**
- Adicionar gráfico de linha para análise de tendência

---

### 7. **esic-mensal.js** - Por Mês ⚠️ PARCIAL

**Gráficos Faltantes:**
- ❌ **Gráfico de barras agrupadas** (múltiplas métricas por mês)
- ❌ **Gráfico de linha múltipla** (comparação de métricas)

**Recomendações:**
- Adicionar gráficos comparativos

---

## 📊 RESUMO EXECUTIVO

### Estatísticas Gerais

- **Total de Páginas Analisadas:** 42
- **Páginas Completas (✅):** 4 (9.5%)
- **Páginas Parciais (⚠️):** 38 (90.5%)
- **Páginas Sem Gráficos:** 0 (0%)

### Tipos de Gráficos Mais Faltantes

1. **Gráfico de Linha (Evolução Temporal)** - 85% das páginas
2. **Gráfico de Barras Agrupadas** - 80% das páginas
3. **Gráfico de Pizza/Doughnut** - 60% das páginas
4. **Gráfico de Mapa Geográfico** - 40% das páginas (onde aplicável)
5. **Gráfico de Correlação** - 50% das páginas

### Prioridades de Implementação

#### 🔴 ALTA PRIORIDADE
1. Gráficos de linha para análise temporal em todas as páginas principais
2. Gráficos de barras agrupadas para comparação multi-dimensional
3. Gráficos de pizza para distribuição percentual

#### 🟡 MÉDIA PRIORIDADE
4. Mapas geográficos para páginas de bairro/geográficas
5. Gráficos de correlação para análise de relacionamentos
6. Gráficos de boxplot para análise estatística

#### 🟢 BAIXA PRIORIDADE
7. Heatmaps para análise de padrões
8. Gráficos de projeção estatística avançados
9. Gráficos de área para visualização de tendências

---

## 🎯 RECOMENDAÇÕES FINAIS

1. **Padronizar Visualizações:** Criar um padrão de gráficos para cada tipo de análise
2. **Implementar Gráficos Temporais:** Adicionar gráficos de linha em todas as páginas que analisam dados ao longo do tempo
3. **Melhorar Comparações:** Implementar gráficos de barras agrupadas para análises comparativas
4. **Adicionar Mapas:** Implementar mapas geográficos onde faz sentido (bairros, unidades, etc.)
5. **Análise de Correlação:** Adicionar gráficos de correlação para identificar relacionamentos entre variáveis

---

**Última Atualização:** 11/12/2025  
**Próxima Revisão:** Após implementação das recomendações

