# 📊 CARDS DE INFORMAÇÃO - VISÃO GERAL (Overview)

## Resumo: **11 Cards de Informação**

---

## 📋 LISTA COMPLETA DE CARDS

### ✅ SEÇÃO 1: RESUMO EXECUTIVO (3 cards principais)

1. **📈 Total de Manifestações** (`kpiTotal`)
   - Valor principal: Total geral
   - Delta: `kpiTotalDelta` (variação)
   - Sparkline: `sparkTotal` (gráfico pequeno)
   - **Interativo**: ✅ Sim - Limpa todos os filtros ao clicar

2. **📅 Últimos 7 dias** (`kpi7`)
   - Valor principal: Manifestações nos últimos 7 dias
   - Delta: `kpi7Delta` (variação)
   - Sparkline: `spark7` (gráfico pequeno)
   - **Interativo**: ✅ Sim - Filtra por últimos 7 dias ao clicar

3. **📊 Últimos 30 dias** (`kpi30`)
   - Valor principal: Manifestações nos últimos 30 dias
   - Delta: `kpi30Delta` (variação)
   - Sparkline: `spark30` (gráfico pequeno)
   - **Interativo**: ✅ Sim - Filtra por últimos 30 dias ao clicar

---

### ✅ SEÇÃO 2: DISTRIBUIÇÕES E CATEGORIAS (3 cards informativos)

4. **📝 Tipos de Manifestação** (`tiposInfo`)
   - Card informativo dentro do gráfico de tipos
   - Mostra informações sobre tipos de manifestação
   - Localização: Dentro do card do gráfico `chartTiposManifestacao`

5. **📞 Canais de Atendimento**
   - Card do gráfico `chartCanais`
   - Não tem card de informação adicional (apenas gráfico)

6. **⚡ Prioridades**
   - Card do gráfico `chartPrioridades`
   - Não tem card de informação adicional (apenas gráfico)

---

### ✅ SEÇÃO 3: STATUS E SLA (2 cards informativos)

7. **📊 Status Info** (`statusInfo`)
   - Card informativo dentro do gráfico de status
   - Mostra: "Status mais comum" com percentual
   - Localização: Dentro do card do gráfico `chartFunnelStatus`

8. **⏱️ SLA Info** (`slaInfo`)
   - Card informativo dentro do gráfico de SLA
   - Mostra informações sobre status de SLA
   - Localização: Dentro do card do gráfico `chartSLA`

---

### ✅ SEÇÃO 4: ANÁLISE TEMPORAL (4 cards informativos)

9. **📊 Tendência - Média** (`trendMedia`)
   - Card dentro do gráfico de tendência mensal
   - Mostra média de manifestações

10. **📊 Tendência - Total** (`trendTotal`)
    - Card dentro do gráfico de tendência mensal
    - Mostra total de manifestações

11. **📊 Tendência - Maior** (`trendMax`)
    - Card dentro do gráfico de tendência mensal
    - Mostra maior valor e mês correspondente

12. **📊 Tendência - Menor** (`trendMin`)
    - Card dentro do gráfico de tendência mensal
    - Mostra menor valor e mês correspondente

13. **📅 Distribuição Diária Info** (`dailyInfo`)
    - Card informativo dentro do gráfico de distribuição diária
    - Mostra informações sobre distribuição diária
    - Localização: Dentro do card do gráfico `chartDailyDistribution`

---

### ✅ SEÇÃO 5: STATUS ATUAL (cards dinâmicos)

14. **📊 Status Overview Cards** (`statusOverviewCards`)
    - Container para cards dinâmicos de status
    - Cards são gerados dinamicamente baseados nos dados
    - Quantidade varia conforme os status disponíveis

---

## 📊 RESUMO POR TIPO

### Cards Principais (KPIs) - 3 cards:
1. Total de Manifestações
2. Últimos 7 dias
3. Últimos 30 dias

### Cards Informativos (dentro de gráficos) - 5 cards:
4. Tipos Info
5. Status Info
6. SLA Info
7. Daily Info
8. Status Overview Cards (dinâmico)

### Cards de Estatísticas (tendência) - 4 cards:
9. Trend Media
10. Trend Total
11. Trend Max
12. Trend Min

---

## 🎯 TOTAL: **12 Cards de Informação**

### Distribuição:
- **3 KPIs Principais** (interativos)
- **5 Cards Informativos** (dentro de gráficos)
- **4 Cards de Estatísticas** (tendência)
- **Cards Dinâmicos** (statusOverviewCards - quantidade variável)

---

## ✅ FUNCIONALIDADES DOS CARDS

### Cards Interativos (3):
- ✅ **kpiTotal**: Limpa todos os filtros ao clicar
- ✅ **kpi7**: Filtra por últimos 7 dias ao clicar
- ✅ **kpi30**: Filtra por últimos 30 dias ao clicar

### Cards Informativos (9):
- Mostram informações complementares aos gráficos
- Atualizam automaticamente quando filtros são aplicados
- Integrados ao sistema de comunicação global

---

## 📝 OBSERVAÇÕES

1. **Sparklines** (sparkTotal, spark7, spark30) não são cards, são gráficos pequenos dentro dos KPIs
2. **Status Overview Cards** é um container dinâmico que pode ter múltiplos cards
3. Todos os cards são atualizados automaticamente quando filtros são aplicados
4. Os 3 KPIs principais são interativos e podem aplicar/limpar filtros

