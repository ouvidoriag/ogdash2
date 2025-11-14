# 🏛️ Dashboard de Ouvidoria - Duque de Caxias/RJ

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.19-black?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?style=for-the-badge&logo=mongodb)
![Prisma](https://img.shields.io/badge/Prisma-5.20-2D3748?style=for-the-badge&logo=prisma)
![License](https://img.shields.io/badge/License-Internal-red?style=for-the-badge)

**Sistema completo de análise e visualização de dados de manifestações da Ouvidoria Municipal**

[🚀 Começar](#-instalação-rápida) • [📖 Documentação](#-documentação) • [🔧 API](#-api-rest) • [🐛 Problemas](#-troubleshooting)

</div>

---

## 📋 Índice

- [✨ Características](#-características)
- [🎯 Sobre o Projeto](#-sobre-o-projeto)
- [🚀 Instalação Rápida](#-instalação-rápida)
- [⚙️ Configuração](#️-configuração)
- [📊 Funcionalidades](#-funcionalidades)
- [🌐 API REST](#-api-rest)
- [🎨 Frontend](#-frontend)
- [🔧 Scripts Disponíveis](#-scripts-disponíveis)
- [🚀 Deploy](#-deploy)
- [🐛 Troubleshooting](#-troubleshooting)
- [📚 Documentação Adicional](#-documentação-adicional)
- [🤝 Contribuindo](#-contribuindo)

---

## ✨ Características

### 🎯 Principais Funcionalidades

- 📥 **Importação Automática**: Importa dados de planilhas Excel automaticamente
- 💾 **Armazenamento Flexível**: MongoDB Atlas com campos normalizados para performance
- 📊 **Dashboard Interativo**: Interface moderna com gráficos interativos (Chart.js)
- 🔍 **Análises Avançadas**: KPIs, séries temporais, heatmaps, análises multidimensionais
- ⚡ **Performance Otimizada**: Cache em memória e índices no banco de dados
- 🌐 **API REST Completa**: 40+ endpoints para integração
- 📱 **Design Responsivo**: Interface adaptável a diferentes tamanhos de tela
- 🎨 **UI Moderna**: Design futurista com glass morphism e efeitos neon
- 📈 **KPIs Avançados**: Deltas, sparklines e comparações temporais
- 📑 **Visualizações Múltiplas**: Abas, tabelas dinâmicas e gráficos por mês
- ⏱️ **Análise de Tempo**: Tempo médio por órgão, unidade e período

### 🛠️ Stack Tecnológico

**Backend:**
- Node.js 18+ com Express.js
- Prisma ORM para gerenciamento de banco
- MongoDB Atlas (cloud database)
- Node-Cache para cache em memória
- XLSX para leitura de arquivos Excel

**Frontend:**
- HTML5/CSS3 com Tailwind CSS
- Chart.js para gráficos interativos
- JavaScript Vanilla (SPA)
- Animate.css para animações

---

## 🎯 Sobre o Projeto

O **Dashboard de Ouvidoria de Duque de Caxias** é um sistema completo desenvolvido para a **Secretaria de Ouvidoria Geral** do município. O sistema permite:

- ✅ Importar e processar dados de manifestações da Ouvidoria
- ✅ Visualizar dados através de dashboards interativos
- ✅ Analisar tendências e padrões com múltiplas visualizações
- ✅ Monitorar KPIs e métricas em tempo real
- ✅ Gerar relatórios e análises por múltiplas dimensões
- ✅ Integrar com outros sistemas via API REST

### 📈 Casos de Uso

- **Gestores**: Monitorar performance e tendências
- **Analistas**: Analisar dados e gerar insights
- **Desenvolvedores**: Integrar dados via API
- **Cidadãos**: Visualizar transparência (se público)

---

## 🚀 Instalação Rápida

### Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** ou **yarn**
- **MongoDB Atlas** (conta gratuita disponível)

### Passo a Passo

#### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/ouvidoriag/ogdash.git
cd ogdash
```

#### 2️⃣ Instale as Dependências

```bash
npm install
```

> ⚡ **Automático**: O setup roda automaticamente após `npm install` (via `postinstall`)
> 
> O script `postinstall` executa:
> - ✅ Gera o Prisma Client
> - ✅ Verifica/cria o banco de dados SQLite
> - ✅ Prepara o ambiente para rodar

#### 3️⃣ Configure as Variáveis de Ambiente

O arquivo `.env` já está incluído no repositório com as configurações de conexão aos bancos de dados. 

> ✅ **Pronto para usar**: O `.env` já contém as credenciais necessárias para conectar ao MongoDB Atlas e outros serviços.

Se precisar personalizar, você pode:
- Usar o arquivo `.env` existente (já configurado)
- Ou copiar `.env.example` para criar um novo: `cp .env.example .env`

**Variáveis disponíveis:**
```env
MONGODB_ATLAS_URL="..."  # Conexão MongoDB Atlas
PORT=3000                 # Porta do servidor
EXCEL_FILE="..."          # Caminho do arquivo Excel
GEMINI_API_KEY="..."      # Chave API Google Gemini (para IA Cora)
WELLINGTON_DIR=./Wellington  # Diretório de contexto
DATABASE_URL="file:./prisma/dev.db"  # SQLite local (Prisma)
```

#### 4️⃣ Inicie o Servidor

```bash
npm start
```

> ✅ O sistema estará disponível em: **http://localhost:3000**
> 
> O script `prestart` garante que tudo está configurado antes de iniciar o servidor.

### 🎉 Pronto!

O sistema está configurado e rodando. Acesse o dashboard no navegador.

---

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório | Padrão |
|----------|-----------|-------------|--------|
| `MONGODB_ATLAS_URL` | String de conexão do MongoDB Atlas | ✅ Sim | - |
| `PORT` | Porta do servidor Express | ❌ Não | `3000` |
| `EXCEL_FILE` | Caminho do arquivo Excel para importação | ❌ Não | - |
| `GEMINI_API_KEY` | Chave da API Google Gemini (para IA Cora) | ❌ Não | - |
| `WELLINGTON_DIR` | Diretório com contexto adicional para IA | ❌ Não | `./Wellington` |
| `DATABASE_URL` | URL do banco SQLite (Prisma) | ❌ Não | `file:./prisma/dev.db` |

### MongoDB Atlas Setup

1. **Crie uma conta** em [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Crie um cluster** (Free tier disponível)
3. **Configure acesso**:
   - Adicione seu IP ou `0.0.0.0/0` para permitir qualquer IP
   - Crie um usuário de banco de dados
4. **Obtenha a connection string**:
   - Clique em "Connect" → "Connect your application"
   - Copie a string de conexão
   - Substitua `<password>` pela senha do usuário

### Estrutura do Banco de Dados

O sistema usa **MongoDB** com Prisma ORM. O modelo `Record` armazena:

- **JSON flexível**: Campo `data` com todos os dados originais
- **Campos normalizados**: Para consultas rápidas (protocolo, status, tema, etc.)
- **Índices**: Otimizados para agregações e filtros frequentes

---

## 📊 Funcionalidades

### 📥 Importação de Dados

```bash
# Importar dados do Excel
npm run import:excel

# Atualizar dados do Excel
npm run update:excel

# Normalizar campos após importação
npm run db:backfill
```

### 📈 Dashboard Interativo

O dashboard inclui:

- **KPIs Principais**: Total, últimos 7/30 dias com deltas e sparklines
- **Gráficos Dinâmicos**: Barras, linhas, pizza, doughnut
- **Séries Temporais**: Análise por data, dia, semana e mês
- **Heatmaps**: Visualização multidimensional (mês x dimensão)
- **Tabelas Dinâmicas**: Com paginação e exportação CSV
- **Filtros Avançados**: Por múltiplas dimensões (servidor, unidade, mês)
- **Visualizações por Abas**: Múltiplas perspectivas na mesma página

### 🔍 Análises Disponíveis

#### 📊 Visão Geral
- **KPIs com Deltas**: Comparação com períodos anteriores
- **Sparklines**: Visualização de tendências em mini-gráficos
- **Tendência Mensal**: Gráfico de linha com últimos 12 meses
- **Heatmap Interativo**: Seleção de dimensão dinâmica
- **Tabela de Registros**: Com paginação e filtros

#### 🏢 Por Órgão e Mês
- **Lista de Órgãos**: Visual com barras de progresso
- **Gráfico Mensal**: Barras horizontais por mês
- **Tabela Completa**: Dados cruzados por órgão e mês
- **Totais**: Por linha e coluna

#### ⏱️ Tempo Médio
- **Estatísticas Gerais**: Média, mediana, mínimo, máximo
- **Por Órgão**: Gráfico de barras horizontais
- **Por Unidade de Cadastro**: Gráfico de barras horizontais
- **Tendência Diária**: Últimos 30 dias
- **Tendência Semanal**: Últimas 12 semanas
- **Tendência Mensal**: Últimos 12 meses
- **Por Unidade e Mês**: Gráfico de linha com múltiplas séries
- **Filtros Avançados**: Por mês, apenas concluídos, incluir zero

#### 📑 Por Tema
- **Gráfico de Barras**: Todos os temas sem limitação
- **Status Geral**: Distribuição por status
- **Gráfico Mensal**: Evolução por mês
- **Lista Completa**: Ranking completo de temas
- **Filtros Aplicados**: Indicador visual de filtros ativos

#### 📝 Por Assunto
- **Gráfico de Barras**: Todos os assuntos sem limitação
- **Status Geral**: Distribuição por status
- **Lista Completa**: Ranking completo de assuntos
- **Gráfico Mensal**: Evolução por mês

#### 👤 Por Cadastrante / Unidade
- **Filtro por Servidor**: Análise por servidor específico
- **Filtro por Unidade**: Análise por unidade de cadastro
- **Gráficos Dinâmicos**: Atualização em tempo real
- **Indicadores de Filtro**: Exibição de filtros aplicados
- **Gráfico Mensal**: Evolução por mês

#### 🚨 Reclamações e Denúncias
- **Lista de Assuntos**: Ranking completo
- **Gráfico por Tipo**: Tipos de ação
- **Gráfico Mensal**: Evolução por mês

#### 📊 Status (com Abas)
- **Aba Por Status**:
  - Gráfico de rosca com distribuição
  - Heatmap mês x status
  - Gráfico de linha temporal por status
- **Aba Por Tema**:
  - Gráfico de barras por tema
  - Heatmap mês x tema
- **Aba Por Órgão**:
  - Gráfico de barras por órgão
  - Heatmap mês x órgão

#### 🏥 Por Secretaria
- **Gráfico de Barras**: Top secretarias
- **Ranking**: Lista dos top 10
- **Gráfico Mensal**: Evolução por mês

#### 🏘️ Por Bairro
- **Gráfico de Barras**: Top bairros
- **Heatmap**: Mês x bairro
- **Gráfico Mensal**: Evolução por mês

#### 📂 Por Categoria
- **Gráfico de Barras**: Top categorias
- **Heatmap**: Mês x categoria
- **Gráfico Mensal**: Evolução por mês

#### 🏥 Páginas de Unidades
- **18 Unidades Específicas**: Páginas dedicadas para cada unidade
- **Assuntos por Unidade**: Lista completa
- **Tipos de Ação**: Gráfico por tipo

---

## 🌐 API REST

### Base URL

```
http://localhost:3000/api
```

### Endpoints Principais

#### 🏥 Health Check

```http
GET /api/health
```

**Resposta:**
```json
{
  "status": "ok"
}
```

#### 📊 Resumo (KPIs)

```http
GET /api/summary?servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
{
  "total": 14795,
  "last7": 1234,
  "last30": 5678,
  "statusCounts": [
    { "status": "Concluída", "count": 10770 },
    { "status": "Em atendimento", "count": 4025 }
  ],
  "topOrgaos": [
    { "key": "Saúde", "count": 10202 }
  ],
  "topUnidadeCadastro": [...],
  "topTipoManifestacao": [...],
  "topTema": [...]
}
```

**Query Parameters:**
- `servidor` (opcional): Filtrar por servidor
- `unidadeCadastro` (opcional): Filtrar por unidade

**Cache**: 3600 segundos (1 hora)

#### 📅 Dados Diários (Novo)

```http
GET /api/aggregate/by-day?servidor=...&unidadeCadastro=...
```

**Descrição**: Retorna dados diários dos últimos 30 dias para KPIs e sparklines

**Resposta:**
```json
[
  { "date": "2025-01-01", "count": 45 },
  { "date": "2025-01-02", "count": 67 },
  ...
]
```

**Cache**: 300 segundos

#### 📋 Listar Registros (Paginado)

```http
GET /api/records?page=1&pageSize=50
```

**Query Parameters:**
- `page` (padrão: 1): Número da página
- `pageSize` (padrão: 50, máximo: 500): Itens por página

#### 🔍 Valores Distintos

```http
GET /api/distinct?field=tema
```

Retorna valores únicos de um campo específico.

#### 📊 Agregação por Contagem

```http
GET /api/aggregate/count-by?field=tema&servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
[
  { "key": "Saúde", "count": 10202 },
  { "key": "Educação", "count": 2500 }
]
```

#### 📈 Série Temporal

```http
GET /api/aggregate/time-series?field=Data
```

**Resposta:**
```json
[
  { "date": "2025-01-01", "count": 45 },
  { "date": "2025-01-02", "count": 67 }
]
```

#### 📅 Agregação Mensal

```http
GET /api/aggregate/by-month?servidor=...&unidadeCadastro=...
```

Retorna os últimos 12 meses.

**Resposta:**
```json
[
  { "ym": "2024-11", "count": 63 },
  { "ym": "2024-12", "count": 2179 }
]
```

**Cache**: 3600 segundos

#### 📊 Status por Mês (Novo)

```http
GET /api/aggregate/count-by-status-mes?servidor=...&unidadeCadastro=...
```

**Descrição**: Retorna contagem de registros agrupados por status e mês

**Resposta:**
```json
[
  { "status": "Concluída", "month": "2024-11", "count": 50 },
  { "status": "Em atendimento", "month": "2024-11", "count": 13 },
  ...
]
```

**Cache**: 3600 segundos

#### 🏢 Órgão por Mês (Novo)

```http
GET /api/aggregate/count-by-orgao-mes?servidor=...&unidadeCadastro=...
```

**Descrição**: Retorna contagem de registros agrupados por órgão e mês

**Resposta:**
```json
[
  { "orgao": "Saúde", "month": "2024-11", "count": 45 },
  { "orgao": "Educação", "month": "2024-11", "count": 18 },
  ...
]
```

**Cache**: 3600 segundos

#### 🔥 Heatmap

```http
GET /api/aggregate/heatmap?dim=tema&servidor=...&unidadeCadastro=...
```

**Query Parameters:**
- `dim`: Dimensão (tema, orgaos, unidadeCadastro, tipoDeManifestacao, Status, Secretaria, Categoria, Bairro, etc.)

**Resposta:**
```json
{
  "labels": ["2024-11", "2024-12", ...],
  "rows": [
    {
      "key": "Saúde",
      "values": [10, 25, 30, ...]
    }
  ]
}
```

**Cache**: 3600 segundos

#### ⏱️ Tempo Médio de Atendimento

```http
GET /api/stats/average-time?meses=["2024-11","2024-12"]&apenasConcluidos=true&incluirZero=false&servidor=...&unidadeCadastro=...
```

**Query Parameters:**
- `meses` (opcional): Array de meses no formato `YYYY-MM`
- `apenasConcluidos` (opcional): Boolean (true/false)
- `incluirZero` (opcional): Boolean (true/false)
- `servidor` (opcional): Filtrar por servidor
- `unidadeCadastro` (opcional): Filtrar por unidade

**Resposta:**
```json
[
  { "org": "Saúde", "dias": 25.5, "quantidade": 100 },
  { "org": "Educação", "dias": 30.2, "quantidade": 50 }
]
```

#### ⏱️ Estatísticas de Tempo Médio

```http
GET /api/stats/average-time/stats?meses=...&apenasConcluidos=...&incluirZero=...&servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
{
  "media": 28.5,
  "mediana": 25.0,
  "minimo": 1,
  "maximo": 365,
  "total": 150
}
```

#### ⏱️ Tempo Médio por Dia

```http
GET /api/stats/average-time/by-day?meses=...&apenasConcluidos=...&incluirZero=...&servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
[
  { "date": "2025-01-01", "dias": 25.5, "quantidade": 10 },
  { "date": "2025-01-02", "dias": 30.2, "quantidade": 15 }
]
```

#### ⏱️ Tempo Médio por Semana

```http
GET /api/stats/average-time/by-week?meses=...&apenasConcluidos=...&incluirZero=...&servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
[
  { "week": "2025-W40", "dias": 28.3, "quantidade": 120 },
  { "week": "2025-W41", "dias": 32.1, "quantidade": 150 }
]
```

#### ⏱️ Tempo Médio por Mês

```http
GET /api/stats/average-time/by-month?meses=...&apenasConcluidos=...&incluirZero=...&servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
[
  { "month": "2024-11", "dias": 28.5, "quantidade": 200 },
  { "month": "2024-12", "dias": 30.2, "quantidade": 250 }
]
```

#### ⏱️ Tempo Médio por Unidade (Novo)

```http
GET /api/stats/average-time/by-unit?meses=...&apenasConcluidos=...&incluirZero=...&servidor=...&unidadeCadastro=...
```

**Descrição**: Retorna tempo médio agrupado por unidade de cadastro

**Resposta:**
```json
[
  { "unit": "UAC Centro", "dias": 25.5, "quantidade": 100 },
  { "unit": "UAC Vila", "dias": 30.2, "quantidade": 50 }
]
```

#### ⏱️ Tempo Médio por Unidade e Mês (Novo)

```http
GET /api/stats/average-time/by-month-unit?meses=...&apenasConcluidos=...&incluirZero=...&servidor=...&unidadeCadastro=...
```

**Descrição**: Retorna tempo médio agrupado por unidade de cadastro e mês

**Resposta:**
```json
[
  { "unidade": "UAC Centro", "mes": "2024-11", "dias": 25.5, "quantidade": 100 },
  { "unidade": "UAC Centro", "mes": "2024-12", "dias": 28.2, "quantidade": 120 }
]
```

#### ⏱️ Resumo de SLA

```http
GET /api/sla/summary?servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
{
  "esic": {
    "dentro": 100,
    "atraso": 50
  },
  "outros": {
    "verde": 5000,
    "amarelo": 2000,
    "atraso": 1000
  }
}
```

**Regras SLA:**
- **e-SIC**: >20 dias = atraso
- **Outros**: ≤30 dias = verde, 30-60 dias = amarelo, >60 dias = atraso

#### 📊 Agregação por Tema

```http
GET /api/aggregate/by-theme?servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
[
  { "tema": "Saúde", "quantidade": 10202 },
  { "tema": "Educação", "quantidade": 2500 }
]
```

#### 📝 Agregação por Assunto

```http
GET /api/aggregate/by-subject?servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
[
  { "assunto": "Atendimento", "quantidade": 5000 },
  { "assunto": "Infraestrutura", "quantidade": 3000 }
]
```

#### 👤 Agregação por Servidor

```http
GET /api/aggregate/by-server?servidor=...&unidadeCadastro=...
```

#### 🔎 Filtro Avançado

```http
POST /api/filter
Content-Type: application/json

{
  "filters": [
    { "field": "tema", "op": "eq", "value": "Saúde" },
    { "field": "status", "op": "contains", "value": "Concluída" }
  ]
}
```

**Operadores:**
- `eq`: Igual (exato)
- `contains`: Contém (case-insensitive)

#### 🚨 Reclamações e Denúncias

```http
GET /api/complaints-denunciations?servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
{
  "assuntos": [
    { "assunto": "Atendimento", "quantidade": 100 },
    { "assunto": "Infraestrutura", "quantidade": 50 }
  ],
  "tipos": [
    { "tipo": "Reclamação", "quantidade": 80 },
    { "tipo": "Denúncia", "quantidade": 70 }
  ]
}
```

#### 🏥 Dados por Unidade

```http
GET /api/unit/:unitName?servidor=...&unidadeCadastro=...
```

#### 📊 Status Overview

```http
GET /api/stats/status-overview?servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
{
  "concluida": {
    "total": 10770,
    "percentual": 72.8
  },
  "emAtendimento": {
    "total": 4025,
    "percentual": 27.2
  }
}
```

#### 📋 Dados Filtrados

```http
GET /api/aggregate/filtered?servidor=...&unidadeCadastro=...
```

**Resposta:**
```json
{
  "total": 1000,
  "byMonth": [...],
  "byTheme": [...],
  "bySubject": [...],
  "byStatus": [...],
  "unidadesCadastradas": [...],
  "filter": { "type": "servidor", "value": "..." }
}
```

#### 🗺️ Secretarias e Distritos

```http
GET /api/secretarias
GET /api/secretarias/:district
GET /api/distritos
GET /api/distritos/:code
GET /api/distritos/:code/stats
GET /api/aggregate/by-district
```

#### 💬 Chat Cora (IA)

```http
GET /api/chat/messages
POST /api/chat/messages
POST /api/chat/reindex
```

#### 🔧 Cache

```http
POST /api/cache/clear
GET /api/cache/status
```

#### 📤 Exportação

```http
GET /api/export/database
```

#### 🔍 Metadados

```http
GET /api/meta/aliases
```

### 💾 Cache

O sistema utiliza cache em memória (`node-cache`) com:
- **TTL padrão**: 60 segundos
- **TTL para endpoints pesados**: 300-3600 segundos (5 minutos a 1 hora)
- **Headers HTTP**: `Cache-Control: public, max-age=X`

---

## 🎨 Frontend

### Estrutura

O frontend é uma **Single Page Application (SPA)** construída em um único arquivo HTML (`public/index.html`) com:

- ✅ JavaScript inline
- ✅ CSS inline (Tailwind via CDN)
- ✅ Chart.js para gráficos interativos
- ✅ Navegação por seções (sem recarregar página)
- ✅ Sistema de filtros global
- ✅ Abas dinâmicas para múltiplas visualizações

### Design

- **Tema**: Dark mode futurista
- **Cores principais**:
  - Cyan (`#22d3ee`): Primária
  - Violet (`#a78bfa`): Accent
  - Green (`#34d399`): Success
  - Rose (`#fb7185`): Danger
  - Amber (`#f59e0b`): Warning
- **Efeitos**: Glass morphism, neons, gradientes
- **Responsivo**: Grid adaptativo (Tailwind)

### Seções do Dashboard

#### 🏠 Home
- Página inicial com informações gerais

#### 📊 Visão Geral
- **KPIs Principais**: Total, últimos 7/30 dias com deltas e sparklines
- **Tendência Mensal**: Gráfico de linha (12 meses)
- **Top Órgãos**: Gráfico de barras
- **Top Temas**: Gráfico de barras
- **Distribuição por Status**: Gráfico de rosca
- **Funil por Status**: Gráfico de barras
- **Heatmap Interativo**: Seleção de dimensão
- **Tabela de Registros**: Com paginação

#### 🏢 Por Órgão e Mês
- **Lista de Órgãos**: Visual com barras de progresso
- **Gráfico Mensal**: Barras horizontais
- **Tabela Completa**: Dados cruzados por órgão e mês
- **KPI Total**: Total de manifestações

#### ⏱️ Tempo Médio
- **Estatísticas Gerais**: 4 cards (média, mediana, mínimo, máximo)
- **Por Órgão**: Gráfico de barras horizontais
- **Por Unidade de Cadastro**: Gráfico de barras horizontais
- **Tendência Diária**: Gráfico de linha (30 dias)
- **Tendência Semanal**: Gráfico de linha (12 semanas)
- **Tendência Mensal**: Gráfico de barras (12 meses)
- **Por Unidade e Mês**: Gráfico de linha com múltiplas séries
- **Filtros**: Por mês, apenas concluídos, incluir zero

#### 📑 Por Tema
- **Gráfico de Barras**: Todos os temas
- **Status Geral**: Gráfico de rosca
- **Gráfico Mensal**: Evolução por mês
- **Lista Completa**: Ranking completo
- **Filtros Aplicados**: Indicador visual

#### 📝 Por Assunto
- **Gráfico de Barras**: Todos os assuntos
- **Status Geral**: Gráfico de rosca
- **Lista Completa**: Ranking completo
- **Gráfico Mensal**: Evolução por mês

#### 👤 Por Cadastrante / Unidade
- **Filtro por Servidor**: Dropdown com servidores
- **Filtro por Unidade**: Dropdown com unidades
- **Gráficos Dinâmicos**: Atualização em tempo real
- **Indicadores de Filtro**: Exibição de filtros aplicados
- **Gráfico Mensal**: Evolução por mês

#### 🚨 Reclamações e Denúncias
- **Lista de Assuntos**: Ranking completo
- **Gráfico por Tipo**: Tipos de ação
- **Gráfico Mensal**: Evolução por mês

#### 📊 Status (com Abas)
- **Aba Por Status**:
  - Gráfico de rosca
  - Heatmap mês x status
  - Gráfico de linha temporal
- **Aba Por Tema**:
  - Gráfico de barras
  - Heatmap mês x tema
- **Aba Por Órgão**:
  - Gráfico de barras
  - Heatmap mês x órgão

#### 🏥 Por Secretaria
- **Gráfico de Barras**: Top secretarias
- **Ranking**: Lista dos top 10
- **Gráfico Mensal**: Evolução por mês

#### 🏘️ Por Bairro
- **Gráfico de Barras**: Top bairros
- **Heatmap**: Mês x bairro
- **Gráfico Mensal**: Evolução por mês

#### 📂 Por Categoria
- **Gráfico de Barras**: Top categorias
- **Heatmap**: Mês x categoria
- **Gráfico Mensal**: Evolução por mês

#### 🏥 Páginas de Unidades
- **18 Unidades Específicas**: Páginas dedicadas
- **Assuntos por Unidade**: Lista completa
- **Tipos de Ação**: Gráfico por tipo

### 🎯 Funcionalidades do Frontend

#### Sistema de Filtros Global
- **Filtro por Servidor**: Aplicado globalmente
- **Filtro por Unidade**: Aplicado globalmente
- **Filtro por Mês**: Seleção múltipla de meses
- **Indicadores Visuais**: Mostra filtros ativos
- **Atualização Automática**: Todos os gráficos atualizam

#### Interatividade
- **Clique em Gráficos**: Feedback visual
- **Hover em Elementos**: Tooltips informativos
- **Navegação por Abas**: Múltiplas visualizações
- **Paginação**: Tabelas com paginação
- **Scroll Suave**: Animações de scroll

---

## 🔧 Scripts Disponíveis

### Scripts NPM

```bash
# Instalação e Setup
npm install          # Instala dependências e roda setup automático (postinstall)
npm run setup        # Executa setup manual (Prisma + DB)

# Servidor
npm start            # Inicia servidor (porta 3000 ou PORT) - roda prestart automaticamente
npm run dev          # Mesmo que start

# Banco de Dados (Prisma)
npm run prisma:generate  # Gera Prisma Client
npm run prisma:migrate    # Aplica migrações do Prisma
npm run prisma:push       # Faz push do schema para o banco (cria/atualiza)
npm run prisma:studio     # Abre Prisma Studio (interface visual do banco)

# Dados
npm run import:excel      # Importa dados do Excel para MongoDB
npm run update:excel      # Atualiza dados do Excel existentes
npm run db:backfill       # Normaliza campos dos registros no MongoDB
npm run db:reset          # Reseta banco de dados (cuidado!)
npm run db:analyze        # Analisa estrutura do banco de dados
npm run cache:clear       # Limpa cache em memória
```

### Scripts Node (scripts/)

- **`setup.js`**: Configuração inicial (gera Prisma Client, cria DB)
- **`importExcel.js`**: Importa dados do arquivo Excel
- **`updateFromExcel.js`**: Atualiza dados do Excel existentes
- **`backfillNormalized.js`**: Preenche campos normalizados
- **`clearDb.js`**: Limpa todos os registros
- **`checkDb.js`**: Verifica estado do banco de dados
- **`compareExcelDb.js`**: Compara dados do Excel com banco
- **`listExcelColumns.js`**: Lista colunas disponíveis no Excel
- **`testEndpoints.js`**: Testa endpoints da API
- **`testMongoConnection.js`**: Testa conexão MongoDB
- **`clearCache.js`**: Limpa cache em memória

---

## 🚀 Deploy

### Render.com (Recomendado)

1. **Criar novo Web Service**
   - **Name**: `ogdash`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (ou pago)

2. **Variáveis de Ambiente**
   - `MONGODB_ATLAS_URL`: Sua string de conexão
   - `NODE_ENV`: `production`
   - `PORT`: (gerenciado pelo Render)

3. **Características**
   - ✅ Setup automático via `postinstall` e `prestart`
   - ✅ Caminho absoluto resolvido automaticamente
   - ✅ Arquivos estáticos servidos corretamente

### Outras Plataformas

- **Railway**: Detecta automaticamente Node.js
- **Fly.io**: Requer Dockerfile ou buildpack Node.js
- **Heroku**: Usa `Procfile` para start command

### ⚠️ Considerações de Deploy

- **MongoDB Atlas**: Funciona perfeitamente em produção (cloud)
- **Cache**: Cache em memória é perdido ao reiniciar (considere Redis para produção)
- **HTTPS**: Configure HTTPS na plataforma de deploy
- **CORS**: Configure CORS restritivo em produção

---

## 🐛 Troubleshooting

### Problemas Comuns

#### ❌ Erro: "MONGODB_ATLAS_URL não está definido"

**Solução:**
1. Verifique se o arquivo `.env` existe
2. Verifique se `MONGODB_ATLAS_URL` está configurado
3. Reinicie o servidor após alterar `.env`

#### ❌ Erro: "Unable to connect to MongoDB" ou "Server selection timeout"

**Sintomas:**
- `Server selection timeout: No available servers`
- `I/O error: received fatal alert: InternalError`
- `P2010` (Prisma error code)

**Solução:**
1. **Verifique a string de conexão** no `.env`:
   ```env
   MONGODB_ATLAS_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority"
   ```

2. **Verifique o IP na whitelist do MongoDB Atlas**:
   - Acesse MongoDB Atlas → Network Access
   - Adicione `0.0.0.0/0` (qualquer IP) para desenvolvimento
   - Ou adicione o IP específico do servidor em produção

3. **Verifique credenciais**:
   - Usuário e senha corretos
   - Usuário tem permissões no banco

4. **O sistema agora inclui**:
   - ✅ Retry automático (3 tentativas)
   - ✅ Timeouts otimizados (30s)
   - ✅ Fallback para cache quando disponível
   - ✅ Mensagens de erro mais claras

5. **Teste a conexão**:
   ```bash
   node scripts/testMongoConnection.js
   ```

**Nota:** O sistema agora tenta reconectar automaticamente e usa cache quando o banco está temporariamente indisponível.

#### ❌ Gráficos não aparecem

**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros JavaScript
3. Verifique se a API está respondendo: `GET /api/health`
4. Verifique se há dados no banco

#### ❌ KPIs mostram "—" ou valores zerados

**Solução:**
1. Verifique se há dados no banco de dados
2. Verifique se os campos de data estão normalizados: `npm run db:backfill`
3. Verifique se o endpoint `/api/summary` está retornando dados
4. Verifique o console do navegador para erros

#### ❌ Importação falha

**Solução:**
1. Verifique se o arquivo Excel existe no caminho configurado
2. Verifique o formato do arquivo (deve ser `.xlsx`)
3. Verifique permissões de leitura
4. Execute `node scripts/findExcel.js` para localizar arquivo

#### ❌ Campos normalizados vazios

**Solução:**
1. Execute `npm run db:backfill` após importação
2. Verifique aliases em `/api/meta/aliases`
3. Verifique se nomes de colunas no Excel correspondem aos aliases

### 🔍 Verificação de Saúde

```bash
# Verificar se servidor está rodando
curl http://localhost:3000/api/health

# Verificar banco de dados
node scripts/checkDb.js

# Testar conexão MongoDB
node scripts/testMongoConnection.js

# Testar endpoints
node scripts/testEndpoints.js
```

### 📝 Logs

O sistema mostra logs detalhados:
- `📁 MongoDB Atlas conectado`: Conexão estabelecida
- `✅ Banco de dados encontrado!`: Banco existe
- `🎉 Setup concluído!`: Sistema pronto
- `📊 Dados carregados`: Dados processados
- `❌ ERRO`: Erros com descrição

---

## 📚 Documentação Adicional

- **[DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)**: Documentação técnica completa
- **[GUIA_MIGRACAO_MONGODB.md](./GUIA_MIGRACAO_MONGODB.md)**: Guia de migração para MongoDB
- **[HOSPEDAGEM.md](./HOSPEDAGEM.md)**: Guia detalhado de deploy
- **[ANALISE_BANCO_DADOS.md](./ANALISE_BANCO_DADOS.md)**: Análise do banco de dados
- **[DOCUMENTACAO_SISTEMA_DATAS_SLA.md](./DOCUMENTACAO_SISTEMA_DATAS_SLA.md)**: Sistema de datas e SLA
- **[MELHORIAS_PAGINA_TEMPO_MEDIO.md](./MELHORIAS_PAGINA_TEMPO_MEDIO.md)**: Melhorias na página de tempo médio

---

## 🆕 Novidades e Melhorias Recentes

### ✨ Funcionalidades Adicionadas

#### 📊 KPIs Avançados
- ✅ **Deltas Percentuais**: Comparação com períodos anteriores (7 e 30 dias)
- ✅ **Sparklines**: Mini-gráficos de tendência nos cards de KPI
- ✅ **Endpoint Diário**: `/api/aggregate/by-day` para dados diários

#### 📑 Visualizações por Abas
- ✅ **Página Status**: 3 abas (Por Status, Por Tema, Por Órgão)
- ✅ **Navegação Intuitiva**: Sistema de abas com indicadores visuais
- ✅ **Múltiplas Perspectivas**: Mesma página, diferentes análises

#### 📊 Tabelas Dinâmicas
- ✅ **Por Órgão e Mês**: Tabela completa com dados cruzados
- ✅ **Totais por Linha e Coluna**: Cálculos automáticos
- ✅ **Formatação Visual**: Cores e hover effects

#### ⏱️ Tempo Médio Expandido
- ✅ **Por Unidade de Cadastro**: Gráfico de barras horizontais
- ✅ **Por Unidade e Mês**: Gráfico de linha com múltiplas séries
- ✅ **Estatísticas Gerais**: Cards com média, mediana, mínimo, máximo
- ✅ **Tendências**: Diária, semanal e mensal

#### 📈 Gráficos Mensais
- ✅ **Todas as Páginas**: Gráficos mensais adicionados em:
  - Por Assunto
  - Por Bairro
  - Por Secretaria
  - Por Categoria
  - Reclamações e Denúncias
  - Status (na aba Por Status)

#### 🔍 Filtros e Contexto
- ✅ **Indicadores de Filtro**: Exibição visual de filtros aplicados
- ✅ **Filtros por Mês**: Seleção múltipla de meses
- ✅ **Contexto Completo**: Informações de filtro em todas as páginas relevantes

#### 🎯 Rankings Completos
- ✅ **Por Tema**: Todos os temas sem limitação
- ✅ **Por Assunto**: Todos os assuntos sem limitação
- ✅ **Listas Visuais**: Com barras de progresso e rankings

### 🛠️ Endpoints Criados

1. **`GET /api/aggregate/by-day`**: Dados diários (últimos 30 dias)
2. **`GET /api/aggregate/count-by-status-mes`**: Status agrupado por mês
3. **`GET /api/aggregate/count-by-orgao-mes`**: Órgão agrupado por mês

### 🐛 Correções Implementadas

- ✅ **Tendência Mensal**: Corrigido cálculo usando campo `ym`
- ✅ **Gráficos Vazios**: Validação de dados antes de criar gráficos
- ✅ **Heatmap**: Tratamento de erros e validação de dados
- ✅ **Rankings**: Removidas limitações (slice) para mostrar todos os itens
- ✅ **Filtros**: Sistema global de filtros funcionando corretamente

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Pull Request

### 📋 Padrões de Código

- Use **ES6+** (async/await, arrow functions, etc.)
- Siga o padrão de código existente
- Adicione comentários para código complexo
- Teste suas mudanças antes de fazer commit

---

## 📄 Licença

Este projeto é de uso interno da **Secretaria de Ouvidoria Geral de Duque de Caxias**.

---

## 📞 Suporte

Para questões sobre o sistema:

- 📧 **Email**: [seu-email@duquedecaxias.rj.gov.br]
- 📱 **Telefone**: [seu-telefone]
- 🐛 **Issues**: [GitHub Issues](https://github.com/ouvidoriag/ogdash/issues)
- 📖 **Documentação**: Consulte [DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)

---

<div align="center">

**Desenvolvido com ❤️ para Secretaria de Ouvidoria Geral • Duque de Caxias/RJ**

[⬆ Voltar ao topo](#-dashboard-de-ouvidoria---duque-de-caxiasrj)

</div>
