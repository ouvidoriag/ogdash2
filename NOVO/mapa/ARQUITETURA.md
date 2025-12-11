# 🏛️ ARQUITETURA DO SISTEMA

**Data:** 11/12/2025  
**CÉREBRO X-3**

---

## 📋 VISÃO GERAL

Sistema Dashboard para Ouvidoria, Zeladoria e E-SIC da Prefeitura de Duque de Caxias.

**Stack:**
- **Frontend:** SPA Vanilla JS (modular)
- **Backend:** Node.js + Express.js
- **Banco:** MongoDB Atlas (Mongoose)
- **IA:** Google Gemini
- **Email:** Gmail API

---

## 🏗️ ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Páginas    │  │   Gráficos   │  │   Filtros    │ │
│  │   (42)       │  │   Chart.js   │  │   Crossfilter│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Data Loader  │  │ Global Store │  │ Chart Factory│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↕ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (API)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Controllers  │  │   Services   │  │    Utils     │ │
│  │    (26)      │  │   (Email)    │  │   (23)       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Routes    │  │   Models     │  │    Cache     │ │
│  │    (16)      │  │    (9)       │  │   Híbrido    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↕ Mongoose
┌─────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Cloud)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Records    │  │  Zeladoria    │  │     Esic     │ │
│  │  (Ouvidoria) │  │               │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO DE DADOS

### 1. Carregamento de Página

```
Usuário → Clica em página
  ↓
main.js → loadSection(page)
  ↓
page.js → loadPageName()
  ↓
dataLoader.load(endpoint)
  ↓
Verifica cache (dataStore)
  ↓
[Cache Hit] → Retorna dados
[Cache Miss] → Fetch API
  ↓
Backend → Controller → Model → MongoDB
  ↓
Resposta → dataStore.set() → Retorna dados
  ↓
chartFactory.createChart() → Renderiza gráfico
```

### 2. Aplicação de Filtros

```
Usuário → Clica em gráfico/item
  ↓
crossfilterOverview.setFilter(field, value)
  ↓
chartCommunication.filters.apply()
  ↓
eventBus.emit('filter:applied')
  ↓
Todas as páginas escutam → loadPageName(true)
  ↓
dataLoader.load(endpoint, { filters })
  ↓
Backend → /api/filter/aggregated
  ↓
Retorna dados filtrados
  ↓
Gráficos atualizados
```

---

## 🎯 PRINCÍPIOS ARQUITETURAIS

### 1. **Modularidade**
- Cada página é um módulo independente
- Sistemas globais reutilizáveis
- Controllers especializados

### 2. **Separação de Responsabilidades**
- Frontend: Visualização e interação
- Backend: Lógica e dados
- Models: Estrutura de dados

### 3. **Cache Inteligente**
- TTLs por tipo de dado
- Cache híbrido (memória + arquivo + banco)
- Invalidação automática

### 4. **Performance**
- Lazy loading de bibliotecas
- Agregações no banco
- Limite de pontos em gráficos
- Concorrência controlada

### 5. **Escalabilidade**
- MongoDB Atlas (cloud)
- Cache distribuído
- Agregações otimizadas

---

## 🔐 SEGURANÇA

- Autenticação por sessão
- Middleware de autenticação
- Validação de filtros
- Sanitização de inputs

---

## 📊 MONITORAMENTO

- Logs estruturados
- Métricas de performance
- Cache stats
- Error tracking

---

## 🚀 DEPLOY

- **Render.com** (backend)
- **MongoDB Atlas** (banco)
- **Gmail API** (emails)
- **Google Sheets** (fonte de dados)

---

## ✅ CHECKUP ARQUITETURAL

- [x] Arquitetura modular implementada
- [x] Separação de responsabilidades clara
- [x] Cache funcionando
- [x] Performance otimizada
- [x] Escalabilidade garantida
- [x] Segurança implementada
- [x] Monitoramento ativo

---

**Última Atualização:** 11/12/2025

