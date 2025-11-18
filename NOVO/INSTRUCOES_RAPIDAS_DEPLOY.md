# ⚡ INSTRUÇÕES RÁPIDAS - DEPLOY NO CPANEL

## 🎯 RESUMO EM 6 PASSOS

### 1️⃣ **UPLOAD DOS ARQUIVOS**
- Acesse **File Manager** no cPanel
- Crie pasta: `public_html/dashboard`
- Faça upload de **TODOS** os arquivos (exceto `node_modules`)

### 2️⃣ **CRIAR APLICAÇÃO NO APPLICATION MANAGER**
- Acesse **Application Manager** no cPanel
- Clique em **"Register Your Application"**
- Preencha:
  - **Application Name:** `ouvidoria-dashboard`
  - **Deployment Domain:** Selecione seu domínio
  - **Application Path:** `/home/usuario/public_html/dashboard`
  - **Deployment Environment:** `Production` ✅
- Clique em **"Deploy"**

### 3️⃣ **CONFIGURAR VARIÁVEIS DE AMBIENTE**
Na página da aplicação criada, adicione:

```
MONGODB_ATLAS_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority
DATABASE_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority
PORT=3000
NODE_ENV=production
GEMINI_API_KEY=sua_chave_aqui
```

### 4️⃣ **INSTALAR DEPENDÊNCIAS (SSH)**
Acesse o **Terminal** do cPanel e execute:

```bash
cd ~/public_html/dashboard
npm install
npx prisma generate
```

### 5️⃣ **CONFIGURAR STARTUP FILE**
Na página da aplicação:
- **Startup File:** `src/server.js`

### 6️⃣ **INICIAR APLICAÇÃO**
- Clique em **"Start"** ou **"Restart"**
- Aguarde alguns segundos
- Verifique os logs

---

## ✅ TESTE

Acesse: `https://seudominio.com/dashboard`

Teste API: `https://seudominio.com/dashboard/api/health`

---

## 🐛 PROBLEMAS COMUNS

**Erro ao iniciar?**
→ Verifique logs no Application Manager

**"Cannot find module"?**
→ Execute `npm install` novamente

**"Prisma Client not generated"?**
→ Execute `npx prisma generate`

**MongoDB não conecta?**
→ Adicione IP do servidor na whitelist do MongoDB Atlas

---

**📖 Guia completo:** `GUIA_DEPLOY_CPANEL.md`

