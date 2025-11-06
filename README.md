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
- 🌐 **API REST Completa**: 18+ endpoints para integração
- 📱 **Design Responsivo**: Interface adaptável a diferentes tamanhos de tela
- 🎨 **UI Moderna**: Design futurista com glass morphism e efeitos neon

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

# Normalizar campos após importação
npm run db:backfill
```

### 📈 Dashboard Interativo

O dashboard inclui:

- **KPIs Principais**: Total, últimos 7/30 dias, status
- **Gráficos Dinâmicos**: Barras, linhas, pizza, doughnut
- **Séries Temporais**: Análise por data
- **Heatmaps**: Visualização multidimensional
- **Tabelas Dinâmicas**: Com paginação e exportação CSV
- **Filtros Avançados**: Por múltiplas dimensões

### 🔍 Análises Disponíveis

- ✅ **Por Órgão**: Manifestações por secretaria/órgão
- ✅ **Por Tema**: Agrupamento por tema
- ✅ **Por Assunto**: Detalhamento por assunto
- ✅ **Por Unidade**: Análise por UAC/unidade de saúde
- ✅ **Tempo Médio**: Análise de tempo de atendimento
- ✅ **SLA**: Monitoramento de prazos
- ✅ **Reclamações e Denúncias**: Filtro específico
- ✅ **Por Cadastrante**: Análise por servidor

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
GET /api/summary
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
GET /api/aggregate/count-by?field=tema
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
GET /api/aggregate/by-month
```

Retorna os últimos 12 meses.

#### 🔥 Heatmap

```http
GET /api/aggregate/heatmap?dim=tema
```

**Query Parameters:**
- `dim`: Dimensão (tema, orgaos, unidadeCadastro, tipoDeManifestacao, etc.)

#### ⏱️ Resumo de SLA

```http
GET /api/sla/summary
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

### 📚 Outros Endpoints

- `GET /api/stats/average-time` - Tempo médio de atendimento
- `GET /api/aggregate/by-theme` - Agregação por tema
- `GET /api/aggregate/by-subject` - Agregação por assunto
- `GET /api/aggregate/by-server` - Agregação por servidor
- `GET /api/stats/status-overview` - Status geral (percentuais)
- `GET /api/unit/:unitName` - Dados por unidade
- `GET /api/complaints-denunciations` - Reclamações e denúncias
- `GET /api/meta/aliases` - Metadados (aliases de campos)

### 💾 Cache

O sistema utiliza cache em memória (`node-cache`) com:
- **TTL padrão**: 60 segundos
- **TTL para endpoints pesados**: 300 segundos (5 minutos)
- **Headers HTTP**: `Cache-Control: public, max-age=X`

---

## 🎨 Frontend

### Estrutura

O frontend é uma **Single Page Application (SPA)** construída em um único arquivo HTML (`public/index.html`) com:

- ✅ JavaScript inline
- ✅ CSS inline (Tailwind via CDN)
- ✅ Chart.js para gráficos
- ✅ Navegação por seções (sem recarregar página)

### Design

- **Tema**: Dark mode futurista
- **Cores principais**:
  - Cyan (`#22d3ee`): Primária
  - Violet (`#a78bfa`): Accent
  - Green (`#34d399`): Success
  - Rose (`#fb7185`): Danger
- **Efeitos**: Glass morphism, neons, gradientes
- **Responsivo**: Grid adaptativo (Tailwind)

### Seções do Dashboard

1. **Visão Geral**: KPIs, gráficos dinâmicos, heatmap, tabela
2. **Por Órgão e Mês**: Lista de órgãos com gráficos
3. **Tempo Médio**: Análise de tempo de atendimento
4. **Por Tema**: Agrupamento por tema
5. **Por Assunto**: Detalhamento por assunto
6. **Por Cadastrante**: Análise por servidor/unidade
7. **Reclamações e Denúncias**: Filtro específico
8. **Páginas de Unidades**: Páginas específicas para cada unidade

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
npm run db:backfill       # Normaliza campos dos registros no MongoDB
npm run db:reset          # Reseta banco de dados (cuidado!)
npm run db:analyze        # Analisa estrutura do banco de dados
```

### Scripts Node (scripts/)

- **`setup.js`**: Configuração inicial (gera Prisma Client, cria DB)
- **`importExcel.js`**: Importa dados do arquivo Excel
- **`backfillNormalized.js`**: Preenche campos normalizados
- **`clearDb.js`**: Limpa todos os registros
- **`checkDb.js`**: Verifica estado do banco de dados
- **`compareExcelDb.js`**: Compara dados do Excel com banco
- **`listExcelColumns.js`**: Lista colunas disponíveis no Excel
- **`testEndpoints.js`**: Testa endpoints da API

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
- `❌ ERRO`: Erros com descrição

---

## 📚 Documentação Adicional

- **[DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)**: Documentação técnica completa
- **[GUIA_MIGRACAO_MONGODB.md](./GUIA_MIGRACAO_MONGODB.md)**: Guia de migração para MongoDB
- **[HOSPEDAGEM.md](./HOSPEDAGEM.md)**: Guia detalhado de deploy
- **[ANALISE_BANCO_DADOS.md](./ANALISE_BANCO_DADOS.md)**: Análise do banco de dados

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
