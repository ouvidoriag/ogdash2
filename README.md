Ouvidoria - Duque de Caxias/RJ - Dashboard
===========================================

Requisitos:
- Node.js 18+

## 🚀 Instalação e Uso Rápido

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

### Configuração Manual (Opcional)

Se precisar importar dados do Excel:

```bash
npm run import:excel  # importa a planilha definida no .env
```

### Scripts Disponíveis

- `npm start` - Inicia o servidor (configura automaticamente se necessário)
- `npm run dev` - Modo desenvolvimento
- `npm run setup` - Executa setup manual (gera Prisma Client e cria banco)
- `npm run import:excel` - Importa dados do arquivo Excel
- `npm run db:reset` - Reseta o banco de dados

Arquivos importantes:
- `.env`: configura `DATABASE_URL`, `PORT` e `EXCEL_FILE` (já aponta para a planilha na pasta).
- `prisma/schema.prisma`: modelo genérico com JSON por linha (`Record`).
- `scripts/importExcel.js`: lê a planilha e insere como JSON.
- `src/server.js`: API Express + endpoints de agregação.
- `public/index.html`: dashboard simples (tabela + gráficos).

Notas:
- O modelo usa JSON para aceitar qualquer estrutura de colunas da planilha.
- Endpoints úteis:
  - `GET /api/records?page=1&pageSize=50`
  - `GET /api/aggregate/count-by?field=Categoria`
  - `GET /api/aggregate/time-series?field=Data`
  - `GET /api/distinct?field=Bairro`
  - `POST /api/filter` com `{ filters: [{ field: "Categoria", op: "eq", value: "..." }] }`

Opcional (Redis):
- O cache padrão usa memória (`node-cache`). Podemos trocar para Redis facilmente em produção.

## 🚀 Hospedagem

Para informações detalhadas sobre onde hospedar o sistema, consulte o arquivo [HOSPEDAGEM.md](./HOSPEDAGEM.md).

**Opções recomendadas:**
- **Railway** (mais fácil): https://railway.app
- **Render**: https://render.com
- **Fly.io**: https://fly.io

O sistema está pronto para deploy e já inclui:
- ✅ `Procfile` para Railway/Render
- ✅ Suporte a variável `PORT` do ambiente
- ✅ Configuração de produção


