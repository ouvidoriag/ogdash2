# 🏙️ PAINEL CENTRAL – GESTÃO INTEGRADA MUNICIPAL

**Data de Criação:** 12/12/2025  
**Versão:** 4.0.0  
**CÉREBRO X-3**

---

## 📋 VISÃO GERAL

O **Painel Central** é uma visão unificada dos quatro principais sistemas municipais:
1. 🧹 **Zeladoria Municipal** - Gestão de Serviços Urbanos
2. 📣 **Ouvidoria Municipal** - Atendimento ao Cidadão
3. 📋 **E-SIC** - Sistema Eletrônico de Informações ao Cidadão
4. 🛰️ **CORA** - Central de Operações e Resposta Ágil (NOVO)

---

## 🎯 OBJETIVOS

### 1. Visão Unificada
- Indicadores consolidados de todos os sistemas
- Volumes, tempos de resposta e distribuição em um só lugar
- Comparação entre sistemas

### 2. Gestão Integrada
- Monitoramento em tempo real
- Alertas e indicadores críticos
- Fluxos entre secretarias

### 3. Transparência
- Acesso claro e organizado
- Métricas em tempo real
- Histórico e evolução

---

## 🏗️ ARQUITETURA DO PAINEL CENTRAL

### Estrutura de Páginas

```
Painel Central (painel-central.html)
├── Dashboard Principal
│   ├── KPIs Consolidados (4 sistemas)
│   ├── Gráficos Comparativos
│   ├── Alertas e Indicadores Críticos
│   └── Timeline de Eventos
│
├── Módulo Zeladoria
│   ├── Resumo Executivo
│   ├── Status Atual
│   ├── Análise Geográfica
│   └── Tempo de Resolução
│
├── Módulo Ouvidoria
│   ├── Resumo Executivo
│   ├── Tipos de Manifestação
│   ├── Tempo de Resposta
│   └── Transparência e Controle
│
├── Módulo E-SIC
│   ├── Resumo Executivo
│   ├── Status e Tipos
│   ├── Métricas em Tempo Real
│   └── Transparência
│
└── Módulo CORA (NOVO)
    ├── Monitoramento em Tempo Real
    ├── Integração entre Sistemas
    ├── Alertas e Indicadores
    └── Fluxos entre Secretarias
```

---

## 📊 COMPONENTES DO PAINEL CENTRAL

### 1. Dashboard Principal

#### KPIs Consolidados
- **Total de Demandas** (Zeladoria + Ouvidoria + E-SIC)
- **Em Atendimento** (todos os sistemas)
- **Concluídas** (todos os sistemas)
- **Tempo Médio de Resposta** (consolidado)
- **Taxa de Resolução** (por sistema)

#### Gráficos Comparativos
- **Volume por Sistema** (barras comparativas)
- **Evolução Temporal** (linha com 4 séries)
- **Status Consolidado** (pizza com todos os status)
- **Distribuição por Secretaria** (todos os sistemas)

#### Alertas e Indicadores Críticos
- **Demandas Urgentes** (vencidas ou próximas do vencimento)
- **Gargalos Operacionais** (tempo médio acima do esperado)
- **Volume Anormal** (picos ou quedas significativas)
- **Equipes Acionadas** (CORA)

#### Timeline de Eventos
- Eventos recentes de todos os sistemas
- Ações tomadas
- Mudanças de status importantes

---

### 2. Módulo Zeladoria

#### Resumo Executivo
- Total de demandas
- Status atual (NOVO, ABERTO, ATENDIMENTO, FECHADO)
- Categorias principais
- Departamentos envolvidos

#### Análise Geográfica
- Mapeamento por bairro
- Densidade de ocorrências
- Hotspots de demanda

#### Tempo de Resolução
- Média geral
- Por categoria
- Por departamento
- Tendências temporais

---

### 3. Módulo Ouvidoria

#### Resumo Executivo
- Total de manifestações
- Tipos (Reclamação, Denúncia, Elogio, Sugestão)
- Status atual
- Secretarias envolvidas

#### Tipos de Manifestação
- Distribuição por tipo
- Evolução temporal
- Categorias e temas

#### Tempo de Resposta
- Média de atendimento
- Prazos e SLA
- Gargalos identificados

#### Transparência e Controle
- Ações tomadas
- Evolução das respostas
- Monitoramento de prazos

---

### 4. Módulo E-SIC

#### Resumo Executivo
- Total de solicitações
- Status atual
- Tipos de informação solicitados
- Responsáveis

#### Métricas em Tempo Real
- Tempo médio de resposta
- Volume diário/mensal
- Performance geral
- Taxa de atendimento

#### Transparência
- Solicitações atendidas
- Informações disponibilizadas
- Histórico completo

---

### 5. Módulo CORA (NOVO)

#### Monitoramento em Tempo Real
- Ocorrências ativas
- Status operacional
- Equipes em campo
- Recursos disponíveis

#### Integração entre Sistemas
- Fluxo Zeladoria → Ouvidoria → E-SIC
- Demandas compartilhadas
- Ações coordenadas
- Histórico de integração

#### Alertas e Indicadores
- Situações urgentes
- Prioridade de atendimento
- Equipes acionadas
- Recursos necessários

#### Fluxos entre Secretarias
- Transferências de demanda
- Colaboração inter-secretarias
- Tempo de resposta entre setores
- Eficiência dos fluxos

---

## 🔄 FLUXO DE DADOS

### Endpoints Necessários

#### Backend - Novos Endpoints

```javascript
// Painel Central - Dados Consolidados
GET /api/central/dashboard
  - Retorna KPIs consolidados de todos os sistemas
  - Volumes, status, tempos médios

GET /api/central/comparative
  - Dados comparativos entre sistemas
  - Evolução temporal consolidada

GET /api/central/alerts
  - Alertas e indicadores críticos
  - Demandas urgentes
  - Gargalos operacionais

GET /api/central/timeline
  - Timeline de eventos recentes
  - Ações e mudanças de status

// CORA - Novos Endpoints
GET /api/cora/status
  - Status operacional
  - Ocorrências ativas
  - Equipes em campo

GET /api/cora/integration
  - Fluxos entre sistemas
  - Demandas compartilhadas
  - Ações coordenadas

GET /api/cora/alerts
  - Alertas críticos
  - Prioridades
  - Recursos necessários

GET /api/cora/flows
  - Fluxos entre secretarias
  - Transferências
  - Eficiência
```

---

## 🎨 INTERFACE DO PAINEL CENTRAL

### Layout Principal

```
┌─────────────────────────────────────────────────────────┐
│  🏙️ PAINEL CENTRAL – GESTÃO INTEGRADA MUNICIPAL         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Zeladoria│ │ Ouvidoria│ │  E-SIC   │ │   CORA   │  │
│  │  1.234   │ │  5.678   │ │   890    │ │   45     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  📊 KPIs CONSOLIDADOS                             │  │
│  │  Total: 7.847 | Em Atendimento: 1.234 | ...      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────┐ ┌──────────────────┐             │
│  │ Volume por       │ │ Evolução         │             │
│  │ Sistema          │ │ Temporal         │             │
│  └──────────────────┘ └──────────────────┘             │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🚨 ALERTAS E INDICADORES CRÍTICOS                │  │
│  │  • 23 demandas vencidas                           │  │
│  │  • 5 gargalos operacionais                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  📅 TIMELINE DE EVENTOS                           │  │
│  │  [Eventos recentes de todos os sistemas]         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Navegação

- **Menu Lateral:** Acesso rápido aos módulos
- **Breadcrumb:** Navegação hierárquica
- **Filtros Globais:** Aplicar filtros em todos os sistemas
- **Atualização em Tempo Real:** Auto-refresh configurável

---

## 🚀 IMPLEMENTAÇÃO

### Fase 1: Estrutura Base
- [ ] Criar `painel-central.html`
- [ ] Criar `pages/central/central-dashboard.js`
- [ ] Criar endpoints backend `/api/central/*`
- [ ] Criar modelo CORA (se necessário)

### Fase 2: Dashboard Principal
- [ ] KPIs consolidados
- [ ] Gráficos comparativos
- [ ] Sistema de alertas
- [ ] Timeline de eventos

### Fase 3: Módulos Individuais
- [ ] Módulo Zeladoria
- [ ] Módulo Ouvidoria
- [ ] Módulo E-SIC
- [ ] Módulo CORA

### Fase 4: Integração e Refinamento
- [ ] Filtros globais
- [ ] Atualização em tempo real
- [ ] Performance e otimização
- [ ] Testes completos

---

## 📝 NOTAS TÉCNICAS

### Modelo CORA (se necessário)

```javascript
// Modelo CORA
{
  ocorrenciaId: String,
  tipo: String, // 'zeladoria', 'ouvidoria', 'esic', 'integrado'
  status: String, // 'ativa', 'em_atendimento', 'resolvida', 'arquivada'
  prioridade: String, // 'baixa', 'media', 'alta', 'critica'
  secretariaOrigem: String,
  secretariaDestino: String,
  equipeAcionada: String,
  recursosNecessarios: [String],
  tempoResposta: Number,
  dataCriacao: Date,
  dataAtualizacao: Date,
  integracao: {
    sistemas: [String],
    demandas: [String]
  }
}
```

### Cache e Performance

- **TTL Consolidado:** 5 segundos (dados dinâmicos)
- **TTL Comparativo:** 10 minutos (dados históricos)
- **TTL Alertas:** 30 segundos (dados críticos)
- **Agregações:** No backend (MongoDB pipelines)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Criar `controllers/centralController.js`
- [ ] Criar `controllers/coraController.js`
- [ ] Criar `routes/central.js`
- [ ] Criar `routes/cora.js`
- [ ] Criar `models/Cora.model.js` (se necessário)
- [ ] Implementar endpoints consolidados
- [ ] Implementar sistema de alertas
- [ ] Implementar timeline de eventos

### Frontend
- [ ] Criar `painel-central.html`
- [ ] Criar `pages/central/central-dashboard.js`
- [ ] Criar `pages/central/zeladoria-module.js`
- [ ] Criar `pages/central/ouvidoria-module.js`
- [ ] Criar `pages/central/esic-module.js`
- [ ] Criar `pages/central/cora-module.js`
- [ ] Integrar com sistemas globais
- [ ] Implementar filtros globais
- [ ] Implementar atualização em tempo real

### Integração
- [ ] Integrar com Zeladoria
- [ ] Integrar com Ouvidoria
- [ ] Integrar com E-SIC
- [ ] Criar sistema CORA
- [ ] Testar fluxos entre sistemas
- [ ] Validar performance

---

**Última Atualização:** 12/12/2025  
**Status:** 🚧 Em Planejamento

