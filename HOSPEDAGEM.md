# Opções de Hospedagem para o Dashboard

## 🎯 Opções Recomendadas

### 1. **Railway** ⭐ (Recomendado - Mais Fácil)
- **URL**: https://railway.app
- **Preço**: Plano gratuito disponível (US$ 5/mês após créditos)
- **Vantagens**:
  - Deploy automático via GitHub
  - Suporta SQLite (seu banco atual)
  - Configuração simples
  - SSL automático
  - Sem configuração de servidor
- **Como fazer**:
  1. Conecte seu repositório GitHub
  2. Railway detecta automaticamente Node.js
  3. Configure variáveis de ambiente (.env)
  4. Deploy automático!

### 2. **Render** ⭐ (Configurado)
- **URL**: https://render.com
- **Preço**: Gratuito (com limitações) ou US$ 7/mês
- **Vantagens**:
  - Deploy automático
  - SSL gratuito
  - Suporta SQLite
  - Free tier disponível
- **Limitações no free tier**:
  - Serviço "dorme" após 15min de inatividade
  - Pode ser lento na primeira requisição

## 🚀 Configuração Detalhada para Render

### ⚡ Resumo Rápido

**Configurações essenciais para copiar/colar no Render:**

| Campo | Valor |
|-------|-------|
| **Name** | `ogdash` |
| **Language** | `Node` |
| **Branch** | `main` |
| **Region** | `Oregon (US West)` |
| **Build Command** | `npm install` |
| **Start Command** | `npm run start` |
| **Instance Type** | `Free` (ou pago) |

**Variáveis de Ambiente (⚠️ OBRIGATÓRIO):**
- `DATABASE_URL` = `file:./prisma/dev.db` **← CONFIGURE ISTO OU O APP NÃO FUNCIONARÁ!**
- `NODE_ENV` = `production`

**🚨 ATENÇÃO**: Se você não configurar `DATABASE_URL`, receberá o erro:
```
Environment variable not found: DATABASE_URL
```
**Veja a seção "Troubleshooting" abaixo para resolver este erro.**

---

### Configuração do Serviço Web

Ao criar um novo Web Service no Render, use as seguintes configurações:

#### Configurações Básicas
- **Name**: `ogdash`
- **Language**: `Node`
- **Branch**: `main`
- **Region**: `Oregon (US West)`
- **Root Directory**: (deixe vazio)

#### Comandos

**⚠️ Importante**: O sistema já está configurado para executar automaticamente:
- `postinstall`: Gera o Prisma Client e cria o banco após `npm install`
- `prestart`: Garante que o Prisma está configurado antes de iniciar

- **Build Command**: 
  ```bash
  npm install
  ```
  *(O script `postinstall` já executa `setup.js` automaticamente, que gera o Prisma Client e inicializa o banco)*

- **Start Command**: 
  ```bash
  npm run start
  ```
  *(O script `prestart` garante que tudo está configurado antes de iniciar o servidor)*

#### Instance Type
- **Free** (US$ 0/mês)
  - 512 MB RAM
  - 0.1 CPU
  - ⚠️ Nota: Serviço pode "dormir" após 15 minutos de inatividade

Para produção, considere:
- **Starter** (US$ 9/mês): 512 MB RAM, 0.5 CPU
- **Standard** (US$ 25/mês): 2 GB RAM, 1 CPU

#### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Render:

| Nome da Variável | Valor | Descrição | Obrigatório? |
|-----------------|-------|-----------|--------------|
| `DATABASE_URL` | `file:./prisma/dev.db` | Caminho do banco SQLite (relativo ao diretório raiz) | ✅ Sim |
| `NODE_ENV` | `production` | Ambiente de produção | ⚠️ Recomendado |
| `PORT` | *(deixe vazio)* | Porta do servidor (Render define automaticamente via `process.env.PORT`) | ❌ Não (Render define) |

**📝 Nota sobre DATABASE_URL**: 
- O caminho `file:./prisma/dev.db` é relativo ao diretório raiz do projeto
- O script `setup.js` já cria o banco automaticamente se não existir
- No Render, o arquivo SQLite será persistido no sistema de arquivos do serviço

**Como adicionar variáveis de ambiente no Render:**

⚠️ **IMPORTANTE**: As variáveis de ambiente DEVEM ser configuradas antes do primeiro deploy, ou você pode adicioná-las depois e fazer um novo deploy.

**Passo a passo detalhado:**

1. No dashboard do Render, vá até seu serviço `ogdash`
2. Clique na aba **Environment** (ou **Settings** → **Environment**)
3. Na seção **Environment Variables**, clique em **Add Environment Variable**
4. Adicione cada variável **uma por vez**:

   **Primeira variável:**
   - **Key**: `DATABASE_URL`
   - **Value**: `file:./prisma/dev.db`
   - Clique em **Save Changes**

   **Segunda variável:**
   - Clique em **Add Environment Variable** novamente
   - **Key**: `NODE_ENV`
   - **Value**: `production`
   - Clique em **Save Changes**

5. Após adicionar as variáveis, o Render fará um **redeploy automático**
6. Aguarde o deploy completar e verifique os logs

**✅ Verificação**: Após adicionar `DATABASE_URL`, você deve ver nos logs:
- `✅ Prisma Client gerado com sucesso!`
- `✅ Banco de dados criado!` ou `✅ Banco de dados encontrado!`
- **NÃO** deve aparecer o erro: `Environment variable not found: DATABASE_URL`

### Passos para Deploy no Render

1. **Criar conta**: https://render.com
2. **Criar novo Web Service**:
   - Clique em **New** → **Web Service**
   - Conecte seu repositório GitHub
   - Selecione o repositório e branch `main`
3. **Configurar o serviço**:
   - **Name**: `ogdash`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: *(deixe vazio)*
   - **Build Command**: `npm install`
     - ⚠️ **Não** use `npm run build` aqui - o `postinstall` já faz tudo automaticamente!
   - **Start Command**: `npm run start`
     - O `prestart` garante que o Prisma está configurado antes de iniciar
   - **Instance Type**: `Free` (ou pago se preferir)
4. **Adicionar variáveis de ambiente** (conforme tabela acima)
5. **Deploy**: Clique em **Create Web Service**
6. **Aguardar deploy**: O Render vai instalar dependências e iniciar o serviço

### Verificações Pós-Deploy

Após o deploy, verifique:

1. **Health Check**: Acesse `https://seu-app.onrender.com/api/health`
   - Deve retornar: `{"status":"ok"}`

2. **Logs**: Verifique os logs no dashboard do Render. Você deve ver:
   - ✅ `🔧 Configurando o sistema...` (do script setup.js)
   - ✅ `1️⃣ Gerando Prisma Client...`
   - ✅ `✅ Prisma Client gerado com sucesso!`
   - ✅ `2️⃣ Verificando banco de dados...`
   - ✅ `✅ Banco de dados criado!` ou `✅ Banco de dados encontrado!`
   - ✅ `🎉 Setup concluído! O sistema está pronto para rodar.`
   - ✅ `Dashboard running on http://localhost:XXXX` (onde XXXX é a porta definida pelo Render)

3. **Primeira requisição**: Se estiver no plano Free, a primeira requisição pode demorar ~30 segundos (serviço "acordando")

### Notas Importantes

#### Como o Sistema Funciona no Render

1. **Durante o Build** (`npm install`):
   - Instala todas as dependências do `package.json`
   - **Automaticamente** executa `postinstall` → `node scripts/setup.js`
   - O `setup.js` carrega variáveis do `.env` (via `dotenv/config`)
   - O `setup.js` gera o Prisma Client (`npx prisma generate`)
   - O `setup.js` verifica/cria o banco SQLite (`npx prisma db push`)

2. **Durante o Start** (`npm run start`):
   - **Automaticamente** executa `prestart` → `node scripts/setup.js` (garantia extra)
   - O `server.js` carrega variáveis do `.env` (via `dotenv/config`)
   - Inicia o servidor Express (`node src/server.js`)
   - O servidor usa `process.env.PORT` (definido pelo Render)

**📝 Sobre variáveis de ambiente:**
- O código usa `dotenv` para carregar o arquivo `.env` automaticamente
- **No Render**, você pode usar **ambos**:
  - Variáveis configuradas no painel do Render (recomendado)
  - OU o arquivo `.env` commitado no repositório
- **Recomendação**: Configure no painel do Render para maior segurança

#### Sobre o Banco de Dados

- **SQLite no Render**: O arquivo `prisma/dev.db` será persistido no sistema de arquivos do serviço
- **⚠️ Limitação**: No plano Free, o banco pode ser perdido se o serviço for reiniciado ou se houver problemas
- **Backups**: Considere fazer backups regulares do banco SQLite
- **Migrações**: O sistema usa `prisma db push` (via setup.js) em vez de migrações tradicionais
  - Se precisar usar migrações, altere o build command para: `npm install && npx prisma generate && npx prisma migrate deploy`

#### Arquivos Estáticos e Banco de Dados

✅ **Logo e Arquivos Estáticos:**
- O logo `dc-logo.png` está na pasta `public/` e está commitado no repositório
- O servidor serve arquivos estáticos da pasta `public/` automaticamente
- O logo está acessível em: `https://seu-app.onrender.com/dc-logo.png`
- Todos os arquivos da pasta `public/` estão sendo rastreados pelo git

✅ **Banco de Dados:**
- O banco de dados `prisma/dev.db` está commitado no repositório
- **Tamanho atual**: ~46 MB (com todos os dados)
- **Os dados serão carregados no deploy** - o banco completo está no repositório
- Quando o Render fizer o deploy, o banco será copiado junto com o código
- ⚠️ **Importante**: No plano Free, se o serviço reiniciar, o banco pode ser perdido, mas será recriado do repositório no próximo deploy

#### Outras Configurações

- **Auto-deploy**: O Render faz deploy automático quando você faz push para a branch `main`
- **Health Check**: O endpoint `/api/health` está disponível para monitoramento
- **Logs**: Acesse os logs em tempo real no dashboard do Render

### 🔧 Troubleshooting - Problemas Comuns

#### ❌ Erro: "Environment variable not found: DATABASE_URL"

**Sintomas:**
```
PrismaClientInitializationError: 
Invalid `prisma.record.groupBy()` invocation:
error: Environment variable not found: DATABASE_URL.
```

**Solução:**
1. Vá no dashboard do Render → Seu serviço → **Environment**
2. Verifique se a variável `DATABASE_URL` está configurada
3. Se não estiver, adicione:
   - **Key**: `DATABASE_URL`
   - **Value**: `file:./prisma/dev.db`
4. Clique em **Save Changes**
5. O Render fará um redeploy automático
6. Aguarde o deploy completar e teste novamente

**⚠️ Verificação rápida:**
- No Render, vá em **Environment**
- Você deve ver `DATABASE_URL` listada com valor `file:./prisma/dev.db`
- Se não estiver lá, **adicione agora** e aguarde o redeploy

#### ❌ Serviço não inicia / Erro no build

**Verifique nos logs:**
- Se o Prisma Client foi gerado: procure por `✅ Prisma Client gerado com sucesso!`
- Se o banco foi criado: procure por `✅ Banco de dados criado!`
- Se há erros de permissão ou caminho

**Solução:**
- Certifique-se de que `DATABASE_URL` está configurada corretamente
- Verifique se o Build Command é apenas `npm install` (sem `npm run build`)
- Verifique se o Start Command é `npm run start`

#### ❌ Banco de dados não persiste

**No plano Free do Render:**
- O banco SQLite pode ser perdido em alguns cenários
- Considere fazer backups regulares
- Para produção, considere migrar para PostgreSQL ou usar um plano pago

### 3. **Fly.io**
- **URL**: https://fly.io
- **Preço**: Plano gratuito generoso
- **Vantagens**:
  - Performance excelente
  - Global (CDN)
  - Suporta SQLite com volumes persistentes
- **Ideal para**: Aplicações que precisam de performance

### 4. **Heroku** (Pago)
- **URL**: https://www.heroku.com
- **Preço**: US$ 7/mês (sem plano gratuito desde 2022)
- **Vantagens**:
  - Muito confiável
  - Documentação excelente
  - Suporta SQLite (mas PostgreSQL é recomendado)

### 5. **VPS (DigitalOcean, AWS, Azure, etc.)**
- **Vantagens**:
  - Controle total
  - Sem limitações de recursos
  - Pode usar PM2 para manter o processo rodando
- **Desvantagens**:
  - Requer conhecimento de servidor
  - Precisa configurar SSL manualmente
  - Precisa manter servidor atualizado
- **Preço**: US$ 5-20/mês

## 📋 Passos para Deploy no Railway (Recomendado)

### 1. Preparar o Projeto

Crie um arquivo `Procfile` (opcional, mas ajuda):
```
web: node src/server.js
```

### 2. Configurar Variáveis de Ambiente

No Railway, configure:
- `DATABASE_URL`: `file:./prisma/dev.db` (ou deixe padrão)
- `PORT`: Railway define automaticamente, mas você pode usar `process.env.PORT || 3000`
- `NODE_ENV`: `production`

### 3. Adicionar Script de Build (se necessário)

No `package.json`, o script `start` já está correto.

### 4. Criar `.railwayignore` (opcional)
```
node_modules
.env
*.log
```

## 🔧 Ajustes Necessários no Código

### Atualizar `src/server.js` para usar PORT do ambiente:

```javascript
const port = Number(process.env.PORT || 3000);
```

(Isso já está correto no seu código!)

### Para SQLite em produção:
- Railway e Render mantêm o arquivo SQLite, mas backups são importantes
- Considere migrar para PostgreSQL em produção (mais robusto)

## 🚀 Deploy Rápido - Railway

1. **Criar conta**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Conectar repositório** do GitHub
4. **Adicionar variáveis de ambiente**:
   - `DATABASE_URL`: `file:./prisma/dev.db`
   - `PORT`: (deixe Railway definir)
5. **Deploy automático!**

## 📝 Nota sobre SQLite

- SQLite funciona bem em Railway/Render
- Para produção com muitos usuários, considere PostgreSQL
- Para migrar para PostgreSQL:
  - Altere `provider = "postgresql"` no `schema.prisma`
  - Use `DATABASE_URL` de um serviço como Railway Postgres ou Supabase

## 🌐 Alternativa: Vercel (Frontend) + API separada

Se quiser separar frontend e backend:
- **Frontend (Vercel)**: Grátis, excelente para estáticos
- **Backend (Railway/Render)**: Para a API Express

## 💡 Recomendação Final

**Para começar rápido**: **Railway** ou **Render**
- Mais fácil de configurar
- Deploy automático
- SSL incluso
- Funciona bem com SQLite

**Para produção séria**: Considere **PostgreSQL** em vez de SQLite
- Mais robusto
- Melhor para múltiplos usuários
- Suporte a transações complexas

