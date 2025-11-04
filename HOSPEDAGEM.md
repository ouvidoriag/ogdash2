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

### 2. **Render**
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

