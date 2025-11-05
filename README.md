# 🏛️ Ouvidoria - Duque de Caxias/RJ - Dashboard

Dashboard interativo para visualização e análise de dados da Ouvidoria de Duque de Caxias. Sistema desenvolvido com Node.js, Express, Prisma e SQLite.

## 📋 Sobre o Projeto

Este sistema permite:
- **Importar dados** de planilhas Excel automaticamente
- **Visualizar dados** em dashboards interativos com gráficos e tabelas
- **Analisar dados** com agregações, filtros e séries temporais
- **API REST** completa para integração com outros sistemas
- **Cache inteligente** para melhor performance
- **Deploy automático** em plataformas cloud (Render, Railway, etc.)

## 🚀 Instalação e Uso Rápido

### Pré-requisitos

- **Node.js** 18+ (recomendado: 20+)
- **npm** ou **yarn**

### Instalação Automática (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/ouvidoriag/ogdash.git
cd ogdash

# 2. Instale as dependências (setup automático roda após npm install)
npm install

# 3. Inicie o sistema
npm start
```

O sistema estará disponível em: **http://localhost:3000**

### O que acontece automaticamente:

1. **Durante `npm install`**:
   - Instala todas as dependências
   - Executa `postinstall` → `scripts/setup.js`
   - Gera o Prisma Client automaticamente
   - Cria o banco de dados SQLite se não existir

2. **Durante `npm start`**:
   - Executa `prestart` → `scripts/setup.js` (garantia extra)
   - Verifica se tudo está configurado
   - Inicia o servidor Express na porta configurada

## ⚙️ Configuração

### Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto (ou copie de `.env.example`):

```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
EXCEL_FILE="./Dashboard_Duque_de_Caxias_Ouvidoria_Duque_de_Caxias_Tabela_ATUALIZADA.xlsx"
```

**Variáveis de ambiente:**
- `DATABASE_URL`: Caminho do banco SQLite (relativo ao diretório raiz)
- `PORT`: Porta do servidor (padrão: 3000)
- `EXCEL_FILE`: Caminho do arquivo Excel para importação

### Estrutura do Banco de Dados

O sistema usa **SQLite** com Prisma ORM. O modelo `Record` armazena:
- **JSON flexível**: Cada registro pode ter qualquer estrutura de colunas
- **Campos normalizados**: Secretaria, Setor, Tipo, Categoria, Bairro, Status, Data (para consultas rápidas)
- **Índices**: Otimizados para agregações e filtros frequentes

## 📊 Scripts Disponíveis

### Scripts Principais

```bash
npm start          # Inicia o servidor (configura automaticamente se necessário)
npm run dev        # Modo desenvolvimento (mesmo que start)
npm run setup      # Executa setup manual (gera Prisma Client e cria banco)
```

### Scripts de Importação

```bash
npm run import:excel     # Importa dados do arquivo Excel definido no .env
npm run db:backfill      # Preenche campos normalizados dos registros existentes
```

### Scripts de Gerenciamento do Banco

```bash
npm run db:reset         # Reseta o banco (recria schema)
npm run prisma:generate  # Gera Prisma Client manualmente
npm run prisma:migrate    # Aplica migrações (se usando migrations)
```

### Scripts de Utilidade

Os seguintes scripts estão disponíveis em `scripts/`:
- `clearDb.js`: Limpa todos os registros do banco
- `compareExcelDb.js`: Compara dados do Excel com o banco
- `listExcelColumns.js`: Lista colunas disponíveis no Excel

## 🌐 API Endpoints

### Endpoints de Dados

#### `GET /api/health`
Verifica se o servidor está funcionando.

**Resposta:**
```json
{ "status": "ok" }
```

#### `GET /api/summary`
Retorna KPIs e insights críticos do dashboard.

**Resposta:**
```json
{
  "total": 42630,
  "last7": 1234,
  "last30": 5678,
  "statusCounts": [...],
  "topSecretaria": [...],
  "topSetor": [...],
  "topTipo": [...],
  "topCategoria": [...]
}
```

#### `GET /api/records`
Lista registros paginados.

**Query Parameters:**
- `page` (padrão: 1): Número da página
- `pageSize` (padrão: 50, máximo: 500): Itens por página

**Exemplo:**
```
GET /api/records?page=1&pageSize=50
```

#### `GET /api/distinct?field=NomeCampo`
Retorna valores únicos de um campo específico.

**Exemplo:**
```
GET /api/distinct?field=Bairro
```

#### `GET /api/aggregate/count-by?field=Categoria`
Conta registros agrupados por um campo.

**Exemplo:**
```
GET /api/aggregate/count-by?field=Categoria
```

**Resposta:**
```json
[
  { "key": "Reclamação", "count": 1234 },
  { "key": "Sugestão", "count": 567 }
]
```

#### `GET /api/aggregate/time-series?field=Data`
Série temporal de registros por data.

**Exemplo:**
```
GET /api/aggregate/time-series?field=Data
```

**Resposta:**
```json
[
  { "date": "2024-01-01", "count": 45 },
  { "date": "2024-01-02", "count": 67 }
]
```

#### `GET /api/aggregate/by-month`
Série mensal dos últimos 12 meses.

#### `GET /api/aggregate/heatmap?dim=Categoria`
Heatmap por mês (últimos 12) x dimensão.

**Query Parameters:**
- `dim`: Dimensão (Secretaria, Setor, Tipo, Categoria, Bairro, Status)

#### `GET /api/sla/summary`
Resumo de SLA (e-SIC >20 dias = atraso; outros: <=30 verde, 30-60 amarelo, >60 vermelho).

#### `POST /api/filter`
Filtra registros com múltiplos critérios.

**Body:**
```json
{
  "filters": [
    { "field": "Categoria", "op": "eq", "value": "Reclamação" },
    { "field": "Status", "op": "contains", "value": "Aberto" }
  ]
}
```

**Operadores:**
- `eq`: Igual
- `contains`: Contém (case-insensitive)

#### `GET /api/meta/aliases`
Retorna aliases de campos para mapeamento de colunas.

## 🎨 Frontend

O dashboard está em `public/index.html` e inclui:

- **Interface moderna** com design futurista
- **Gráficos interativos** (Chart.js)
- **Tabelas dinâmicas** (DataTables)
- **Filtros avançados**
- **Visualizações**:
  - KPIs principais
  - Gráficos de barras/pizza
  - Séries temporais
  - Heatmaps
  - Tabelas paginadas

**Arquivos estáticos** servidos de `public/`:
- Logo: `/dc-logo.png`
- HTML: `/` (index.html)

## 🔧 Arquitetura e Funcionamento

### Como Funciona

1. **Importação de Dados**:
   - Lê arquivo Excel usando `xlsx`
   - Converte cada linha em JSON
   - Armazena no banco SQLite via Prisma
   - Normaliza campos comuns (Secretaria, Setor, etc.)

2. **Armazenamento**:
   - **JSON flexível**: Campo `data` armazena toda a estrutura original
   - **Campos normalizados**: Para consultas rápidas e agregações
   - **Índices**: Otimizam buscas por campos frequentes

3. **API**:
   - Express.js com endpoints RESTful
   - Cache em memória (node-cache) para melhor performance
   - Middleware CORS habilitado
   - Logs com Morgan

4. **Cache**:
   - Cache automático de 60 segundos (configurável)
   - Headers HTTP Cache-Control
   - Reduz carga no banco de dados

### Estrutura de Arquivos

```
Dashboard/
├── prisma/
│   ├── schema.prisma      # Modelo Prisma
│   └── dev.db             # Banco SQLite (commitado no repo)
├── public/
│   ├── index.html         # Dashboard frontend
│   └── dc-logo.png        # Logo Duque de Caxias
├── scripts/
│   ├── setup.js           # Setup automático (Prisma + DB)
│   ├── importExcel.js     # Importação de Excel
│   ├── clearDb.js         # Limpar banco
│   ├── backfillNormalized.js  # Preencher campos normalizados
│   └── ...
├── src/
│   └── server.js          # Servidor Express + API
├── .env                   # Variáveis de ambiente (commitado)
├── package.json
├── Procfile               # Para deploy (Railway/Render)
└── README.md
```

## 🚀 Deploy em Produção

### Render (Configurado)

O projeto está configurado para deploy no Render. Veja instruções detalhadas em [HOSPEDAGEM.md](./HOSPEDAGEM.md).

**Configuração rápida:**
- **Name**: `ogdash`
- **Language**: `Node`
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm run start`
- **Instance Type**: `Free` (ou pago)

**Variáveis de ambiente no Render:**
- `DATABASE_URL`: `file:./prisma/dev.db`
- `NODE_ENV`: `production`

### Outras Plataformas

- **Railway**: Detecta automaticamente Node.js
- **Fly.io**: Requer configuração de Docker ou buildpack
- **Heroku**: Usa Procfile

### Características do Deploy

✅ **Setup automático**: `postinstall` e `prestart` configuram tudo  
✅ **Caminho absoluto**: Resolução automática de caminhos do banco  
✅ **Variáveis de ambiente**: Suporte a `.env` e variáveis do sistema  
✅ **Banco commitado**: Dados pré-carregados no repositório  
✅ **Logo e estáticos**: Todos os arquivos públicos commitados  

## 🔍 Troubleshooting

### Problemas Comuns

#### Erro: "Environment variable not found: DATABASE_URL"
**Solução**: Configure `DATABASE_URL` no `.env` ou nas variáveis de ambiente.

#### Erro: "Unable to open the database file"
**Solução**: O código já resolve caminhos relativos automaticamente. Verifique se o banco existe em `prisma/dev.db`.

#### Banco não carrega dados no deploy
**Solução**: O banco está commitado no repositório. Se precisar recriar, execute `npm run db:reset`.

### Logs

O sistema mostra logs detalhados:
- `📁 DATABASE_URL`: Caminho do banco configurado
- `✅ Banco de dados encontrado!`: Banco existe
- `🎉 Setup concluído!`: Sistema pronto

## 📝 Notas Técnicas

### Performance

- **Cache em memória**: Reduz queries ao banco
- **Índices Prisma**: Otimizam agregações
- **Campos normalizados**: Evitam parsing de JSON em queries frequentes

### Segurança

- CORS habilitado (pode restringir em produção)
- Validação de inputs nos endpoints
- Sanitização de dados JSON

### Escalabilidade

- SQLite funciona bem para até ~100K registros
- Para mais dados, considere migrar para PostgreSQL
- Cache pode ser substituído por Redis em produção

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de uso interno da Secretaria de Ouvidoria Geral de Duque de Caxias.

## 📞 Suporte

Para questões sobre o sistema, consulte:
- [HOSPEDAGEM.md](./HOSPEDAGEM.md) - Guia de deploy
- Issues do GitHub
- Documentação do Prisma: https://www.prisma.io/docs

---

**Desenvolvido para** Secretaria de Ouvidoria Geral • Duque de Caxias/RJ
