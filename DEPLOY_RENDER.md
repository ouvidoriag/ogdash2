# 🚀 Guia de Deploy no Render

## 📋 Configuração Atual

O projeto está configurado para deploy no Render com:

- **Root Directory:** `.` (raiz do repositório)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

## 🔧 Estrutura do Projeto

```
/
├── package.json          # Package.json da raiz (gerencia NOVO/)
├── render.yaml          # Configuração do Render
├── Procfile             # Alternativa para Heroku/Render
└── NOVO/                # Projeto principal
    ├── package.json      # Package.json do projeto
    ├── src/
    │   └── server.js     # Servidor principal
    ├── public/
    └── prisma/
```

## ⚙️ Configuração no Render Dashboard

### 1. Criar Novo Web Service

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub: `ouvidoriag/ogdash`

### 2. Configurações Básicas

| Campo | Valor |
|-------|-------|
| **Name** | `ogdash` |
| **Environment** | `Node` |
| **Region** | Escolha a mais próxima |
| **Branch** | `main` |
| **Root Directory** | `.` (deixe vazio ou `.`) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### 3. Variáveis de Ambiente

Adicione as seguintes variáveis no Render:

```
NODE_ENV=production
PORT=10000
MONGODB_ATLAS_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority
DATABASE_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority
GEMINI_API_KEY=sua_chave_aqui
```

**⚠️ IMPORTANTE:** 
- Substitua `usuario:senha` e `cluster.mongodb.net` pelas suas credenciais reais
- O Render usa porta dinâmica, mas você pode definir `PORT=10000` como padrão

### 4. Configurações Avançadas (Opcional)

- **Auto-Deploy:** ✅ Habilitado (deploy automático em push)
- **Health Check Path:** `/api/health`
- **Instance Type:** Escolha conforme necessário (Free tier disponível)

## 🔍 Troubleshooting

### Erro: "Could not read package.json"

**Causa:** Render procurando package.json no lugar errado

**Solução:**
1. Verifique se o **Root Directory** está como `.` (vazio ou ponto)
2. Verifique se o `render.yaml` está na raiz do repositório
3. Verifique se o `package.json` está na raiz

### Erro: "Cannot find module"

**Causa:** Dependências não instaladas no diretório correto

**Solução:**
- O build command já instala dependências em `NOVO/`
- Verifique os logs do build para ver se `npm install` executou corretamente

### Erro: "Prisma Client not generated"

**Causa:** Cliente Prisma não foi gerado

**Solução:**
- O build command já inclui `npx prisma generate`
- Verifique os logs do build

### Erro de Conexão MongoDB

**Causa:** IP do Render não está na whitelist do MongoDB Atlas

**Solução:**
1. Acesse MongoDB Atlas
2. Vá em **Network Access**
3. Adicione `0.0.0.0/0` (permitir todos os IPs) OU
4. Adicione o IP específico do Render (verifique nos logs)

## 📝 Comandos de Build

O build executa na seguinte ordem:

1. `npm install` (raiz) - Instala dependências da raiz
2. `npm run build` - Executa:
   - `cd NOVO && npm install` - Instala dependências do NOVO
   - `npx prisma generate` - Gera cliente Prisma
   - `node scripts/setup.js` - Setup do sistema

## 🚀 Comando de Start

O start command executa:

```bash
npm start
```

Que por sua vez executa:
```bash
cd NOVO && node src/server.js
```

## ✅ Checklist de Deploy

- [ ] Repositório conectado no Render
- [ ] Root Directory configurado como `.`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Variáveis de ambiente configuradas
- [ ] MongoDB Atlas com IP do Render liberado
- [ ] Deploy executado com sucesso
- [ ] Health check funcionando: `https://seu-app.onrender.com/api/health`

## 🔗 URLs

Após o deploy, seu app estará disponível em:

- **App URL:** `https://ogdash.onrender.com` (ou nome que você escolheu)
- **Health Check:** `https://ogdash.onrender.com/api/health`
- **Dashboard:** `https://ogdash.onrender.com`

## 📊 Monitoramento

- **Logs:** Acesse "Logs" no dashboard do Render
- **Metrics:** Acesse "Metrics" para ver CPU, memória, etc.
- **Events:** Acesse "Events" para ver histórico de deploys

---

**Última atualização:** Janeiro 2025

