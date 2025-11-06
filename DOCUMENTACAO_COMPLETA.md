# 📚 Documentação Completa do Sistema - Dashboard de Ouvidoria

## 🎯 Visão Geral

O **Dashboard de Ouvidoria de Duque de Caxias** é um sistema completo de análise e visualização de dados de manifestações da Ouvidoria Municipal. O sistema permite importar dados de planilhas Excel, armazená-los em banco de dados SQLite, e visualizá-los através de uma interface web moderna com gráficos interativos, tabelas dinâmicas e análises avançadas.

### Objetivos do Sistema

- **Importação Automática**: Importar dados de planilhas Excel para o banco de dados
- **Armazenamento Flexível**: Armazenar dados em formato JSON com campos normalizados para consultas rápidas
- **Visualização Interativa**: Dashboard web com múltiplas visualizações e análises
- **API REST**: Endpoints para integração com outros sistemas
- **Análises Avançadas**: KPIs, séries temporais, heatmaps, análises por dimensões múltiplas
- **Performance Otimizada**: Cache em memória e índices no banco de dados

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

#### Backend
- **Node.js** (v18+): Runtime JavaScript
- **Express.js**: Framework web para API REST
- **Prisma ORM**: Gerenciamento de banco de dados
- **SQLite**: Banco de dados relacional leve
- **XLSX**: Biblioteca para leitura de arquivos Excel
- **Node-Cache**: Cache em memória para performance

#### Frontend
- **HTML5/CSS3**: Estrutura e estilização
- **Tailwind CSS**: Framework CSS utilitário (via CDN)
- **Chart.js**: Biblioteca de gráficos interativos
- **JavaScript Vanilla**: Lógica do frontend (SPA - Single Page Application)
- **Animate.css**: Animações CSS

### Padrão de Arquitetura

O sistema segue uma arquitetura **MVC simplificada**:

```
┌─────────────────┐
│   Frontend      │  (public/index.html)
│   (SPA)         │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   API Express   │  (src/server.js)
│   (Controllers) │
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│   SQLite DB     │  (prisma/dev.db)
│   (Model)       │
└─────────────────┘
```

---

## 📁 Estrutura de Arquivos

```
Dashboard/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados (Prisma)
│   └── dev.db                  # Banco de dados SQLite
│
├── public/
│   ├── index.html              # Dashboard frontend (SPA)
│   └── dc-logo.png             # Logo da Prefeitura
│
├── scripts/
│   ├── setup.js                # Script de configuração inicial
│   ├── importExcel.js          # Importação de dados do Excel
│   ├── backfillNormalized.js   # Normalização de campos
│   ├── clearDb.js              # Limpar banco de dados
│   ├── resetDb.js              # Resetar banco (recriar schema)
│   ├── checkDb.js              # Verificar estado do banco
│   ├── compareExcelDb.js       # Comparar Excel com banco
│   ├── listExcelColumns.js     # Listar colunas do Excel
│   ├── findExcel.js            # Procurar arquivo Excel
│   ├── analyzeAllDbs.js        # Analisar todos os bancos
│   ├── checkAllDbs.js          # Verificar todos os bancos
│   ├── consolidateDb.js      # Consolidar dados
│   ├── resetAllDbs.js          # Resetar todos os bancos
│   ├── insertSampleData.js     # Inserir dados de exemplo
│   ├── insertDataFromStats.js  # Inserir dados de estatísticas
│   └── testEndpoints.js        # Testar endpoints da API
│
├── src/
│   └── server.js               # Servidor Express + API REST
│
├── .env                        # Variáveis de ambiente
├── package.json                # Dependências e scripts npm
├── package-lock.json           # Lock de versões
├── Procfile                    # Configuração para deploy (Render/Railway)
├── README.md                   # Documentação básica
├── RESUMO_SISTEMA.md          # Resumo do estado atual
└── DOCUMENTACAO_COMPLETA.md   # Este documento
```

---

## 🗄️ Banco de Dados

### Modelo de Dados (Prisma Schema)

O sistema utiliza um modelo híbrido que combina **armazenamento flexível** (JSON) com **campos normalizados** para performance:

```prisma
model Record {
  id        Int      @id @default(autoincrement())
  data      String   // JSON serializado com todos os dados originais
  
  // Campos normalizados para consultas rápidas
  secretaria String?
  setor      String?
  tipo       String?
  categoria  String?
  bairro     String?
  status     String?
  dataIso    String?  // YYYY-MM-DD (formato ISO)
  
  // Campos alinhados com painel Looker Studio
  uac         String?  // Unidade de Atendimento ao Cidadão
  responsavel String?  // Responsável pelo tratamento
  canal       String?  // Canal de entrada
  prioridade  String?  // Prioridade (Alta, Média, Baixa)
  servidor    String?  // Servidor/Cadastrante
  tema        String?  // Tema (ex: Saúde, Educação)
  assunto     String?  // Assunto específico
  dataConclusaoIso String?  // YYYY-MM-DD - Data de conclusão
  
  createdAt DateTime @default(now())
  
  // Índices para otimização
  @@index([secretaria])
  @@index([setor])
  @@index([tipo])
  @@index([categoria])
  @@index([bairro])
  @@index([status])
  @@index([dataIso])
  @@index([uac])
  @@index([responsavel])
  @@index([canal])
  @@index([prioridade])
  @@index([servidor])
  @@index([tema])
  @@index([assunto])
  @@index([dataConclusaoIso])
}
```

### Estrutura de Armazenamento

#### Campo `data` (JSON)
Armazena todos os dados originais da planilha Excel em formato JSON. Isso permite:
- **Flexibilidade**: Aceitar qualquer estrutura de colunas
- **Preservação**: Manter dados originais intactos
- **Extensibilidade**: Adicionar novos campos sem alterar schema

Exemplo:
```json
{
  "Secretaria": "Saúde",
  "Setor": "Hospital Duque",
  "Tipo": "Reclamação",
  "Categoria": "Atendimento",
  "Bairro": "Centro",
  "Status": "Concluída",
  "Data": "15/10/2025",
  "UAC": "UAC - Adão Pereira Nunes",
  ...
}
```

#### Campos Normalizados
Campos extraídos do JSON e armazenados em colunas separadas para:
- **Performance**: Consultas diretas sem parsing de JSON
- **Agregações**: GroupBy e contagens rápidas
- **Filtros**: Buscas eficientes com índices
- **Relatórios**: Dados consistentes e padronizados

### Processo de Normalização

A normalização é feita pelo script `backfillNormalized.js`, que:
1. Lê todos os registros do banco
2. Faz parse do JSON no campo `data`
3. Extrai valores usando aliases (mapeamento de nomes de colunas)
4. Normaliza datas para formato ISO (YYYY-MM-DD)
5. Atualiza os campos normalizados

**Aliases configurados**:
- `Secretaria`: ['Secretaria', 'Órgão', 'Orgao', 'Secretaria/Órgão']
- `Setor`: ['Setor', 'Departamento', 'Unidade']
- `Tipo`: ['Tipo', 'Tipo Manifestação', 'TipoManifestacao']
- `Categoria`: ['Categoria', 'Assunto', 'Tema']
- `Bairro`: ['Bairro', 'Localidade']
- `Status`: ['Status', 'Situação', 'Situacao']
- `Data`: ['Data', 'Data Abertura', 'DataAbertura', 'Abertura']
- E outros...

---

## 🌐 API REST

### Base URL
```
http://localhost:3000/api
```

### Endpoints Disponíveis

#### 1. Health Check
```http
GET /api/health
```
**Resposta:**
```json
{
  "status": "ok"
}
```

#### 2. Resumo (Summary/KPIs)
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
  "topSecretaria": [
    { "key": "Saúde", "count": 10202 }
  ],
  "topSetor": [...],
  "topTipo": [...],
  "topCategoria": [...]
}
```
**Cache**: 300 segundos

#### 3. Listar Registros (Paginado)
```http
GET /api/records?page=1&pageSize=50
```
**Query Parameters:**
- `page` (padrão: 1): Número da página
- `pageSize` (padrão: 50, máximo: 500): Itens por página

**Resposta:**
```json
{
  "total": 14795,
  "page": 1,
  "pageSize": 50,
  "rows": [
    {
      "id": 1,
      "data": { ... },
      "secretaria": "Saúde",
      "setor": "Hospital Duque",
      ...
    }
  ]
}
```

#### 4. Valores Distintos
```http
GET /api/distinct?field=Secretaria
```
**Query Parameters:**
- `field`: Nome do campo no JSON

**Resposta:**
```json
["Saúde", "Educação", "Obras", ...]
```
**Cache**: Indefinido (até invalidação)

#### 5. Agregação por Contagem
```http
GET /api/aggregate/count-by?field=Categoria
```
**Resposta:**
```json
[
  { "key": "Reclamação", "count": 1234 },
  { "key": "Sugestão", "count": 567 }
]
```
**Otimização**: Usa campos normalizados quando disponível

#### 6. Série Temporal
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
**Normalização**: Converte DD/MM/YYYY para YYYY-MM-DD

#### 7. Agregação Mensal (12 meses)
```http
GET /api/aggregate/by-month
```
**Resposta:**
```json
[
  { "ym": "2024-11", "count": 63 },
  { "ym": "2024-12", "count": 2179 }
]
```
**Cache**: 300 segundos

#### 8. Heatmap
```http
GET /api/aggregate/heatmap?dim=Categoria
```
**Query Parameters:**
- `dim`: Dimensão (Secretaria, Setor, Tipo, Categoria, Bairro, Status, UAC, Responsavel, Canal, Prioridade)

**Resposta:**
```json
{
  "labels": ["2024-11", "2024-12", ...],
  "rows": [
    {
      "key": "Reclamação",
      "values": [10, 25, 30, ...]
    }
  ]
}
```
**Limitação**: Top 10 chaves por total

#### 9. Resumo de SLA
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
**Regras SLA**:
- **e-SIC**: >20 dias = atraso
- **Outros**: ≤30 dias = verde, 30-60 dias = amarelo, >60 dias = atraso

**Cache**: 300 segundos

#### 10. Filtro Avançado
```http
POST /api/filter
Content-Type: application/json

{
  "filters": [
    { "field": "Categoria", "op": "eq", "value": "Reclamação" },
    { "field": "Status", "op": "contains", "value": "Aberto" }
  ]
}
```
**Operadores:**
- `eq`: Igual (exato)
- `contains`: Contém (case-insensitive)

**Resposta:**
```json
[
  {
    "id": 1,
    "data": { ... }
  }
]
```

#### 11. Tempo Médio de Atendimento
```http
GET /api/stats/average-time
```
**Resposta:**
```json
[
  { "org": "Hospital Duque", "dias": 15.5 },
  { "org": "UAC - Adão", "dias": 12.3 }
]
```
**Cálculo**: Diferença entre `dataIso` e `dataConclusaoIso`

#### 12. Agregação por Tema
```http
GET /api/aggregate/by-theme
```
**Resposta:**
```json
[
  { "tema": "Saúde", "quantidade": 10202 },
  { "tema": "Educação", "quantidade": 2500 }
]
```

#### 13. Agregação por Assunto
```http
GET /api/aggregate/by-subject
```
**Resposta:**
```json
[
  { "assunto": "Atendimento", "quantidade": 5000 },
  { "assunto": "Marcação de Consulta", "quantidade": 3000 }
]
```

#### 14. Agregação por Servidor/Cadastrante
```http
GET /api/aggregate/by-server
```
**Resposta:**
```json
[
  { "servidor": "João Silva", "quantidade": 500 },
  { "servidor": "Maria Santos", "quantidade": 450 }
]
```

#### 15. Status Geral (Percentuais)
```http
GET /api/stats/status-overview
```
**Resposta:**
```json
{
  "total": 14795,
  "concluida": {
    "quantidade": 10770,
    "percentual": 72.8
  },
  "emAtendimento": {
    "quantidade": 4025,
    "percentual": 27.2
  }
}
```

#### 16. Dados por Unidade
```http
GET /api/unit/:unitName
```
**Parâmetros:**
- `unitName`: Nome da unidade (URL encoded)

**Resposta:**
```json
{
  "assuntos": [
    { "assunto": "Atendimento", "quantidade": 100 }
  ],
  "tipos": [
    { "tipo": "Reclamação", "quantidade": 50 }
  ]
}
```

#### 17. Reclamações e Denúncias
```http
GET /api/complaints-denunciations
```
**Resposta:**
```json
{
  "assuntos": [
    { "assunto": "Atendimento", "quantidade": 500 }
  ],
  "tipos": [
    { "tipo": "Reclamação", "quantidade": 300 },
    { "tipo": "Denúncia", "quantidade": 200 }
  ]
}
```

#### 18. Metadados (Aliases)
```http
GET /api/meta/aliases
```
**Resposta:**
```json
{
  "aliases": {
    "Secretaria": ["Secretaria", "Órgão", "Orgao"],
    "Setor": ["Setor", "Departamento", "Unidade"],
    ...
  }
}
```

### Cache

O sistema utiliza cache em memória (`node-cache`) com:
- **TTL padrão**: 60 segundos
- **TTL para endpoints pesados**: 300 segundos (5 minutos)
- **Headers HTTP**: `Cache-Control: public, max-age=X`

### Performance

- **Índices**: Todos os campos normalizados têm índices
- **Agregações otimizadas**: Usa `groupBy` do Prisma quando possível
- **Cache**: Reduz queries repetidas
- **Paginação**: Limita resultados para evitar sobrecarga

---

## 🎨 Frontend (Dashboard)

### Estrutura

O frontend é uma **Single Page Application (SPA)** construída em um único arquivo HTML (`public/index.html`) com:
- JavaScript inline
- CSS inline (Tailwind via CDN)
- Chart.js para gráficos
- Navegação por seções (sem recarregar página)

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

#### 1. Visão Geral (Main)
- **KPIs**: Total, últimos 7 dias, últimos 30 dias, status principal
- **Gráficos dinâmicos**: Contagem por campo, série temporal
- **Heatmap**: Mês x Dimensão (configurável)
- **Gráficos fixos**: Status (doughnut), Mensal (bar), SLA (bar)
- **Tabela**: Primeiros 50 registros com exportação CSV

#### 2. Por Órgão e Mês
- Lista de órgãos com barras de progresso
- Gráfico de barras horizontais (manifestações por mês)
- KPI total de manifestações

#### 3. Tempo Médio de Atendimento
- Gráfico de barras horizontais (dias por órgão)
- Ranking de órgãos
- Gráfico mensal

#### 4. Por Tema
- Gráfico de barras horizontais (top temas)
- Gráfico de status (doughnut)
- Gráfico mensal

#### 5. Por Assunto
- Gráfico de barras horizontais (top assuntos)
- Gráfico de status (doughnut)
- Lista completa de assuntos

#### 6. Por Cadastrante
- Lista de servidores
- Lista de unidades de cadastro
- Gráfico mensal
- KPI total

#### 7. Reclamações e Denúncias
- Lista de assuntos (filtrado)
- Gráfico de tipos de ação

#### 8. Páginas de Unidades
Páginas específicas para cada unidade:
- ADÃO
- CER IV
- Hospital do Olho
- Hospital Duque
- Hospital Infantil
- Hospital Moacyr
- Maternidade Santa Cruz
- UPA Beira Mar
- UPH Pilar
- UPH Saracuruna
- UPH Xerém
- Hospital Veterinário
- UPA Walter Garcia
- UPH Campos Elíseos
- UPH Parque Equitativa
- UBS Antonio Granja
- UPA Sarapuí
- UPH Imbariê

Cada página mostra:
- Lista de assuntos da unidade
- Gráfico de tipos de ação

#### 9. Páginas de Dimensões
- **Secretarias**: Gráfico e ranking
- **Tipos**: Gráfico pizza e ranking
- **Setores**: Gráfico e ranking
- **Categorias**: Gráfico e heatmap
- **Status**: Gráfico doughnut e heatmap
- **Bairros**: Gráfico e heatmap
- **UACs**: Gráfico, ranking e heatmap
- **Responsáveis**: Gráfico, ranking e heatmap
- **Canais**: Gráfico doughnut, ranking e heatmap
- **Prioridades**: Gráfico, ranking e heatmap

### Funcionalidades do Frontend

#### Navegação
- Menu lateral fixo
- Troca de seções sem recarregar página
- Estado ativo visual

#### Gráficos Interativos
- **Chart.js**: Gráficos responsivos e interativos
- **Tipos**: Bar, Line, Doughnut, Pie
- **Animações**: Transições suaves
- **Tooltips**: Informações ao hover

#### Filtros Dinâmicos
- Campo de texto para contagem por campo
- Campo de texto para série temporal
- Select para dimensão do heatmap

#### Exportação
- Botão "Exportar CSV" na tabela principal
- Gera arquivo CSV com dados visíveis

#### Loading States
- Skeletons durante carregamento
- Animações CSS (Animate.css)

---

## 🔧 Scripts Disponíveis

### Scripts NPM

#### Instalação e Setup
```bash
npm install          # Instala dependências e roda setup automático
npm run setup        # Executa setup manual (Prisma + DB)
```

#### Servidor
```bash
npm start            # Inicia servidor (porta 3000 ou PORT)
npm run dev          # Mesmo que start
```

#### Banco de Dados
```bash
npm run db:reset     # Reseta banco (recria schema)
npm run prisma:generate  # Gera Prisma Client
npm run prisma:migrate    # Aplica migrações
```

#### Importação
```bash
npm run import:excel      # Importa dados do Excel
npm run db:backfill       # Normaliza campos dos registros
```

### Scripts Node (scripts/)

#### Setup e Configuração
- **`setup.js`**: Configuração inicial (gera Prisma Client, cria DB)
- **`checkDb.js`**: Verifica estado do banco de dados
- **`checkAllDbs.js`**: Verifica todos os bancos encontrados
- **`analyzeAllDbs.js`**: Analisa todos os bancos (estatísticas)

#### Importação e Dados
- **`importExcel.js`**: Importa dados do arquivo Excel configurado no `.env`
- **`backfillNormalized.js`**: Preenche campos normalizados dos registros
- **`insertSampleData.js`**: Insere dados de exemplo
- **`insertDataFromStats.js`**: Insere dados de estatísticas

#### Manutenção
- **`clearDb.js`**: Limpa todos os registros (mantém schema)
- **`resetDb.js`**: Reseta banco (recria schema)
- **`resetAllDbs.js`**: Reseta todos os bancos encontrados
- **`consolidateDb.js`**: Consolida dados de múltiplos bancos

#### Utilidades
- **`findExcel.js`**: Procura arquivo Excel no sistema
- **`listExcelColumns.js`**: Lista colunas disponíveis no Excel
- **`compareExcelDb.js`**: Compara dados do Excel com banco
- **`testEndpoints.js`**: Testa endpoints da API

---

## 🔄 Fluxo de Funcionamento

### 1. Inicialização

```
1. npm install
   └─> postinstall: setup.js
       ├─> Gera Prisma Client
       └─> Cria banco de dados (se não existir)

2. npm start
   └─> prestart: setup.js (verificação)
   └─> node src/server.js
       ├─> Carrega .env
       ├─> Inicializa Prisma
       ├─> Inicializa Express
       ├─> Configura middleware (CORS, JSON, Morgan)
       ├─> Serve arquivos estáticos (public/)
       └─> Registra endpoints da API
```

### 2. Importação de Dados

```
1. Preparar arquivo Excel
   └─> Colocar em local acessível
   └─> Configurar EXCEL_FILE no .env

2. Executar importação
   npm run import:excel
   └─> Lê arquivo Excel
   └─> Converte para JSON
   └─> Insere em lotes (500 registros)
   └─> Armazena JSON no campo 'data'

3. Normalizar campos
   npm run db:backfill
   └─> Lê todos os registros
   └─> Faz parse do JSON
   └─> Extrai valores usando aliases
   └─> Normaliza datas
   └─> Atualiza campos normalizados
```

### 3. Requisição do Frontend

```
1. Usuário acessa http://localhost:3000
   └─> Servidor serve index.html

2. Frontend carrega
   └─> Executa JavaScript inline
   └─> Faz requisições para API

3. API processa requisição
   └─> Verifica cache
   └─> Se cache hit: retorna dados em cache
   └─> Se cache miss:
       ├─> Query no banco (Prisma)
       ├─> Processa dados
       ├─> Armazena em cache
       └─> Retorna resposta

4. Frontend renderiza
   └─> Atualiza gráficos (Chart.js)
   └─> Atualiza tabelas
   └─> Atualiza KPIs
```

### 4. Navegação no Dashboard

```
1. Usuário clica em item do menu
   └─> JavaScript detecta clique
   └─> Oculta seção atual
   └─> Mostra seção selecionada
   └─> Chama função loadSection()

2. loadSection() carrega dados
   └─> Faz requisições para API específicas
   └─> Processa respostas
   └─> Renderiza gráficos e listas
```

---

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Banco de dados
DATABASE_URL="file:./prisma/dev.db"

# Servidor
PORT=3000

# Arquivo Excel
EXCEL_FILE="./Dashboard_Duque_de_Caxias_Ouvidoria_Duque_de_Caxias_Tabela_ATUALIZADA.xlsx"
```

### Explicação das Variáveis

- **`DATABASE_URL`**: Caminho do banco SQLite (relativo ao diretório raiz)
  - Formato: `file:./caminho/relativo/ao.db`
  - O sistema converte automaticamente para caminho absoluto se necessário

- **`PORT`**: Porta do servidor Express (padrão: 3000)

- **`EXCEL_FILE`**: Caminho do arquivo Excel para importação
  - Pode ser relativo ou absoluto
  - O sistema procura automaticamente se não encontrar

### Configuração do Banco de Dados

O banco é criado automaticamente pelo `setup.js` usando:
```bash
npx prisma db push
```

Isso aplica o schema definido em `prisma/schema.prisma` sem criar migrations.

---

## 🚀 Deploy

### Render.com

O sistema está configurado para deploy no Render:

1. **Criar novo Web Service**
   - **Name**: `ogdash`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (ou pago)

2. **Variáveis de Ambiente**
   - `DATABASE_URL`: `file:./prisma/dev.db`
   - `NODE_ENV`: `production`
   - `PORT`: (gerenciado pelo Render)

3. **Características**
   - ✅ Setup automático via `postinstall` e `prestart`
   - ✅ Caminho absoluto resolvido automaticamente
   - ✅ Banco commitado no repositório (dados pré-carregados)
   - ✅ Arquivos estáticos servidos corretamente

### Outras Plataformas

#### Railway
- Detecta automaticamente Node.js
- Usa `package.json` para build
- Configura `PORT` automaticamente

#### Fly.io
- Requer Dockerfile ou buildpack Node.js
- Configurar variáveis de ambiente manualmente

#### Heroku
- Usa `Procfile` para start command
- Configurar variáveis via dashboard

### Considerações de Deploy

⚠️ **Banco SQLite em Produção**:
- SQLite funciona bem para até ~100K registros
- Para mais dados, considere migrar para PostgreSQL
- Em plataformas com sistema de arquivos efêmero, use banco externo

💡 **Melhorias para Produção**:
- Substituir cache em memória por Redis
- Adicionar autenticação/autorização
- Configurar CORS restritivo
- Adicionar rate limiting
- Implementar logging estruturado
- Adicionar monitoramento (Sentry, etc.)

---

## 📊 Funcionalidades Principais

### 1. Importação Automática
- Lê planilhas Excel automaticamente
- Suporta qualquer estrutura de colunas
- Importa em lotes para performance
- Preserva dados originais em JSON

### 2. Armazenamento Híbrido
- JSON flexível para dados originais
- Campos normalizados para consultas rápidas
- Índices para otimização
- Suporta evolução de schema sem perda de dados

### 3. Dashboard Interativo
- Múltiplas visualizações
- Gráficos interativos (Chart.js)
- Filtros dinâmicos
- Exportação CSV
- Design moderno e responsivo

### 4. API REST Completa
- 18+ endpoints
- Cache inteligente
- Agregações otimizadas
- Suporte a filtros complexos
- Documentação via metadados

### 5. Análises Avançadas
- KPIs em tempo real
- Séries temporais
- Heatmaps multidimensionais
- Análise de SLA
- Tempo médio de atendimento
- Análises por múltiplas dimensões

### 6. Performance
- Cache em memória
- Índices no banco
- Agregações otimizadas
- Paginação
- Lazy loading no frontend

---

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Erro: "Environment variable not found: DATABASE_URL"
**Solução**: Criar arquivo `.env` com `DATABASE_URL="file:./prisma/dev.db"`

#### 2. Erro: "Unable to open the database file"
**Solução**: 
- Verificar se o banco existe em `prisma/dev.db`
- Executar `npm run setup` para criar o banco
- Verificar permissões do arquivo

#### 3. Banco não carrega dados no deploy
**Solução**: 
- O banco deve estar commitado no repositório
- Ou executar importação após deploy
- Verificar se `DATABASE_URL` está correto

#### 4. Gráficos não aparecem
**Solução**:
- Verificar console do navegador (F12)
- Verificar se API está respondendo (`/api/health`)
- Verificar se dados existem no banco

#### 5. Importação falha
**Solução**:
- Verificar se arquivo Excel existe no caminho configurado
- Verificar formato do arquivo (deve ser .xlsx)
- Verificar permissões de leitura
- Executar `node scripts/findExcel.js` para localizar arquivo

#### 6. Campos normalizados vazios
**Solução**:
- Executar `npm run db:backfill` após importação
- Verificar aliases em `/api/meta/aliases`
- Verificar se nomes de colunas no Excel correspondem aos aliases

### Logs

O sistema mostra logs detalhados:
- `📁 DATABASE_URL`: Caminho do banco configurado
- `✅ Banco de dados encontrado!`: Banco existe
- `🎉 Setup concluído!`: Sistema pronto
- `❌ ERRO`: Erros com descrição

### Verificação de Saúde

```bash
# Verificar se servidor está rodando
curl http://localhost:3000/api/health

# Verificar banco de dados
node scripts/checkDb.js

# Verificar todos os bancos
node scripts/checkAllDbs.js

# Analisar bancos
node scripts/analyzeAllDbs.js
```

---

## 📈 Métricas e Limites

### Capacidade

- **Registros**: Testado com 14.795 registros, suporta até ~100K
- **Tamanho do banco**: ~10-50 MB para 15K registros
- **Performance**: 
  - Queries simples: <100ms
  - Agregações: 200-500ms
  - Com cache: <50ms

### Limitações

- **SQLite**: Não ideal para alta concorrência
- **Cache em memória**: Perdido ao reiniciar servidor
- **Frontend**: SPA simples, sem roteamento avançado
- **Sem autenticação**: Acesso público (adicionar se necessário)

---

## 🔐 Segurança

### Considerações Atuais

- ✅ CORS habilitado (pode restringir em produção)
- ✅ Validação de inputs nos endpoints
- ✅ Sanitização de dados JSON
- ⚠️ Sem autenticação/autorização
- ⚠️ Sem rate limiting
- ⚠️ Sem HTTPS forçado (depende do deploy)

### Recomendações para Produção

1. **Autenticação**: Adicionar JWT ou OAuth
2. **Autorização**: Controle de acesso por roles
3. **HTTPS**: Forçar conexões seguras
4. **Rate Limiting**: Limitar requisições por IP
5. **Validação**: Validar todos os inputs
6. **Sanitização**: Sanitizar dados antes de armazenar
7. **Logging**: Registrar ações sensíveis
8. **Backup**: Backup automático do banco

---

## 🎓 Conceitos Técnicos

### Prisma ORM

Prisma é um ORM (Object-Relational Mapping) que:
- Gera tipos TypeScript automaticamente
- Fornece API type-safe
- Gerencia migrações
- Otimiza queries

### SQLite

SQLite é um banco de dados embutido:
- Arquivo único (`.db`)
- Sem servidor separado
- Ideal para desenvolvimento e pequenos projetos
- Limitações em alta concorrência

### Cache em Memória

Node-Cache armazena dados em memória:
- Reduz queries ao banco
- TTL (Time To Live) configurável
- Perdido ao reiniciar servidor
- Ideal para dados que mudam pouco

### SPA (Single Page Application)

Aplicação web que:
- Carrega uma vez
- Navega sem recarregar página
- Atualiza DOM dinamicamente
- Melhor experiência do usuário

---

## 📝 Notas Finais

### Manutenção

- **Backup**: Fazer backup regular do `prisma/dev.db`
- **Atualizações**: Manter dependências atualizadas (`npm audit`)
- **Logs**: Monitorar logs do servidor
- **Performance**: Monitorar tempo de resposta da API

### Extensões Futuras

Possíveis melhorias:
- Autenticação e autorização
- Dashboard administrativo
- Relatórios em PDF
- Notificações
- Integração com outros sistemas
- Migração para PostgreSQL
- Cache distribuído (Redis)
- API GraphQL
- WebSockets para atualizações em tempo real

---

## 📞 Suporte

Para questões sobre o sistema:
- Consultar este documento
- Verificar `README.md` para guia rápido
- Verificar `RESUMO_SISTEMA.md` para estado atual
- Consultar logs do servidor
- Verificar console do navegador (F12)

---

**Desenvolvido para** Secretaria de Ouvidoria Geral • Duque de Caxias/RJ

**Versão**: 1.0.0  
**Última atualização**: 2025

