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

### Overview (Visão Geral)
- Pizza: Status
- Barras: Por mês
- Linha: Por dia (últimos 30 dias)
- Barras horizontais: Top 5 temas
- Barras horizontais: Top 5 órgãos

### Por Órgão e Mês
- Barras verticais: Manifestações por mês
- Barras horizontais: Top 5 órgãos

### Por Tema
- Barras: Top temas
- Linha: Evolução temporal

### Por Status
- Pizza: Distribuição de status
- Linha: Evolução temporal

### Por Tipo
- Pizza: Tipos de manifestação

### Por Canal
- Pizza: Canais de entrada

### Por Prioridade
- Pizza: Distribuição de prioridades

### Tempo Médio
- Linha: Evolução do tempo médio

### Vencimento
- Barras: Vencimentos por mês

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

