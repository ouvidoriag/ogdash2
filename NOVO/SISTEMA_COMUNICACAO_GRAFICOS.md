# 📡 SISTEMA GLOBAL DE COMUNICAÇÃO ENTRE GRÁFICOS

**Data:** Janeiro 2025  
**Status:** ✅ **IMPLEMENTADO**

---

## 🎯 Objetivo

Criar um sistema global que permita que todos os gráficos do dashboard se comuniquem entre si, compartilhem filtros, atualizem-se reativamente e respondam a eventos globais.

---

## 🏗️ Arquitetura

### Componentes Principais

1. **Event Bus** - Sistema de eventos global para comunicação
2. **Global Filters** - Sistema de filtros globais compartilhados
3. **Chart Registry** - Registro centralizado de todos os gráficos
4. **Feedback System** - Sistema de feedback visual
5. **Chart Field Map** - Mapeamento de campos de gráficos

---

## 📦 Estrutura do Sistema

### 1. Event Bus

Sistema de eventos pub/sub para comunicação entre gráficos.

```javascript
// Registrar listener
const unsubscribe = window.chartCommunication.on('filter:applied', (data) => {
  console.log('Filtro aplicado:', data);
});

// Emitir evento
window.chartCommunication.emit('chart:updated', { chartId: 'chartStatus' });

// Remover listener
unsubscribe();
```

**Eventos Disponíveis:**
- `filter:applied` - Filtro aplicado
- `filter:cleared` - Filtros limpos
- `filter:removed` - Filtro removido
- `chart:registered` - Gráfico registrado
- `chart:unregistered` - Gráfico desregistrado
- `chart:updated` - Gráfico atualizado
- `chart:clicked` - Gráfico clicado

### 2. Global Filters

Sistema de filtros globais que todos os gráficos podem usar.

```javascript
// Aplicar filtro
window.chartCommunication.applyFilter('Status', 'Concluído', 'chartStatus');

// Verificar se filtro está ativo
const isActive = window.chartCommunication.isFilterActive('Status', 'Concluído');

// Limpar todos os filtros
window.chartCommunication.clearFilters();

// Remover filtro específico
window.chartCommunication.removeFilter('Status', 'Concluído');
```

**Funcionalidades:**
- ✅ Toggle de filtros (clicar novamente remove)
- ✅ Persistência em localStorage
- ✅ Invalidação automática de dados no dataStore
- ✅ Atualização automática de UI (indicadores, títulos, realces)

### 3. Chart Registry

Registro centralizado de todos os gráficos.

```javascript
// Registrar gráfico
window.chartCommunication.registerChart('chartStatus', {
  type: 'doughnut',
  field: 'Status',
  operator: 'eq'
});

// Obter gráfico
const chart = window.chartCommunication.getChart('chartStatus');

// Obter todos os gráficos
const allCharts = window.chartCommunication.getAllCharts();

// Obter gráficos por campo
const statusCharts = window.chartCommunication.getChartsByField('Status');
```

### 4. Feedback System

Sistema de feedback visual para interações.

```javascript
// Mostrar feedback de clique
window.chartCommunication.showFeedback('chartStatus', 'Concluído', 150);
```

### 5. Chart Field Map

Mapeamento de campos de gráficos para filtros.

```javascript
// Obter mapeamento de campo
const mapping = window.chartCommunication.getFieldMapping('chartStatus');
// { field: 'Status', op: 'eq' }
```

---

## 🔗 Integração com Chart Factory

O `chart-factory.js` foi atualizado para integrar automaticamente com o sistema de comunicação:

1. **Registro Automático**: Todos os gráficos criados são automaticamente registrados
2. **Handlers de Clique**: Cliques em gráficos são automaticamente capturados
3. **Aplicação de Filtros**: Filtros são aplicados automaticamente baseados no mapeamento de campos
4. **Feedback Visual**: Feedback visual é mostrado automaticamente

---

## 📋 Mapeamento de Campos

O sistema inclui um mapeamento pré-definido de campos:

```javascript
const chartFieldMap = {
  'chartStatus': { field: 'Status', op: 'eq' },
  'chartTema': { field: 'Tema', op: 'eq' },
  'chartAssunto': { field: 'Assunto', op: 'contains' },
  'chartOrgaoMes': { field: 'Orgaos', op: 'contains' },
  // ... mais mapeamentos
};
```

---

## 🎨 Uso em Páginas

### Exemplo Básico

```javascript
// Criar gráfico com comunicação automática
await window.chartFactory.createBarChart('chartStatus', labels, values, {
  onClick: (evt, elements, chart) => {
    // Callback customizado (opcional)
    console.log('Gráfico clicado!');
  }
});

// O sistema automaticamente:
// 1. Registra o gráfico
// 2. Adiciona handler de clique
// 3. Aplica filtros quando clicado
// 4. Mostra feedback visual
// 5. Emite eventos para outros gráficos
```

### Exemplo com Filtros Customizados

```javascript
// Escutar eventos de filtro
window.chartCommunication.on('filter:applied', (data) => {
  if (data.field === 'Status') {
    // Atualizar outros gráficos baseado no filtro
    updateRelatedCharts(data.value);
  }
});
```

---

## 🔄 Fluxo de Comunicação

1. **Usuário clica em um gráfico**
   ↓
2. **Chart Factory captura o clique**
   ↓
3. **Sistema de comunicação:**
   - Mostra feedback visual
   - Aplica filtro global (se mapeamento existir)
   - Emite evento `filter:applied`
   ↓
4. **Outros gráficos escutam o evento**
   ↓
5. **Gráficos relacionados se atualizam automaticamente**

---

## ✅ Benefícios

1. **Comunicação Centralizada**: Todos os gráficos se comunicam através de um único sistema
2. **Filtros Globais**: Filtros aplicados em um gráfico afetam todos os outros
3. **Atualização Reativa**: Gráficos se atualizam automaticamente quando dados mudam
4. **Feedback Visual**: Feedback visual consistente em todas as interações
5. **Fácil Extensão**: Fácil adicionar novos tipos de eventos e comunicação

---

## 📝 Próximos Passos

- [ ] Migrar todos os gráficos existentes para usar o novo sistema
- [ ] Adicionar mais tipos de eventos
- [ ] Implementar sincronização de zoom/pan entre gráficos relacionados
- [ ] Adicionar suporte a filtros complexos (AND/OR)
- [ ] Implementar histórico de filtros

---

**Última Atualização:** Janeiro 2025

