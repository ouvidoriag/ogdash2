# 🚀 COMO RODAR O SISTEMA NO CPANEL

**Guia Resumido em Português**

---

## 📋 RESUMO RÁPIDO

Para rodar este sistema no cPanel, você precisa:

1. ✅ **Fazer upload dos arquivos** para o servidor
2. ✅ **Criar aplicação** no Application Manager
3. ✅ **Configurar variáveis de ambiente** (MongoDB, etc.)
4. ✅ **Instalar dependências** via SSH/Terminal
5. ✅ **Iniciar a aplicação**

---

## 🎯 PASSO A PASSO DETALHADO

### **1️⃣ PREPARAR E ENVIAR ARQUIVOS**

#### Via File Manager do cPanel:

1. Acesse o **File Manager** no cPanel
2. Navegue até `public_html`
3. Crie uma pasta: `dashboard` (ou outro nome)
4. Entre na pasta criada
5. Faça upload de **TODOS** os arquivos da pasta `NOVO/`:
   - ✅ `src/` (código backend)
   - ✅ `public/` (arquivos frontend)
   - ✅ `prisma/` (schema do banco)
   - ✅ `scripts/` (scripts de setup)
   - ✅ `package.json`
   - ❌ **NÃO** faça upload de `node_modules/` (será instalado no servidor)

**Estrutura final no servidor:**
```
/home/seu_usuario/public_html/dashboard/
├── src/
├── public/
├── prisma/
├── scripts/
├── package.json
└── ... outros arquivos
```

---

### **2️⃣ CRIAR APLICAÇÃO NO APPLICATION MANAGER**

1. No cPanel, procure por **"Application Manager"** (geralmente em **Software**)
2. Clique em **"Register Your Application"** ou **"Create Application"**
3. Preencha o formulário:

   | Campo | Valor |
   |-------|-------|
   | **Application Name** | `ouvidoria-dashboard` |
   | **Deployment Domain** | Selecione seu domínio |
   | **Application Path** | `/home/seu_usuario/public_html/dashboard` |
   | **Deployment Environment** | `Production` ✅ |

4. Clique em **"Deploy"**

---

### **3️⃣ CONFIGURAR VARIÁVEIS DE AMBIENTE**

Na página da aplicação criada, procure por **"Environment Variables"** e adicione:

```
MONGODB_ATLAS_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority
```

```
DATABASE_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority
```

```
PORT=3000
```

```
NODE_ENV=production
```

```
GEMINI_API_KEY=sua_chave_gemini_aqui
```

**💡 Dica:** Substitua `usuario:senha` e `cluster.mongodb.net` pelas suas credenciais reais do MongoDB Atlas.

---

### **4️⃣ CONFIGURAR STARTUP FILE**

Na página de edição da aplicação, procure por **"Startup File"** ou **"Application Entry Point"** e defina:

```
src/server.js
```

---

### **5️⃣ INSTALAR DEPENDÊNCIAS (SSH/Terminal)**

1. Acesse o **Terminal** do cPanel (em **Advanced**) ou use SSH
2. Execute os comandos:

```bash
# Navegar até a pasta do projeto
cd ~/public_html/dashboard

# Instalar dependências (pode demorar alguns minutos)
npm install

# Configurar Prisma
npx prisma generate
```

---

### **6️⃣ INICIAR A APLICAÇÃO**

1. No Application Manager, na página da aplicação:
   - Clique em **"Start"** ou **"Restart"**
   - Ou use o toggle para habilitar

2. Aguarde alguns segundos

3. Verifique os logs:
   - Clique em **"View Logs"** ou **"Logs"**
   - Procure por: `🚀 Dashboard running on http://localhost:PORT`

---

### **7️⃣ TESTAR O SISTEMA**

1. Acesse o dashboard:
   - `https://seudominio.com/dashboard`
   - Ou: `https://dashboard.seudominio.com` (se usar subdomínio)

2. Teste a API:
   - `https://seudominio.com/dashboard/api/health`
   - Deve retornar: `{"status":"ok","version":"3.0.0"}`

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### **❌ Erro: "Application failed to start"**

**Soluções:**
- Verifique os logs no Application Manager
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se executou `npm install` e `npx prisma generate`

### **❌ Erro: "Cannot find module"**

**Solução:**
```bash
cd ~/public_html/dashboard
npm install
```

### **❌ Erro: "Prisma Client not generated"**

**Solução:**
```bash
cd ~/public_html/dashboard
npx prisma generate
```

### **❌ Erro: "MongoDB connection failed"**

**Soluções:**
1. Verifique se `MONGODB_ATLAS_URL` está configurada corretamente
2. Adicione o IP do servidor na whitelist do MongoDB Atlas:
   - MongoDB Atlas → Network Access → Add IP Address
   - Adicione o IP do servidor ou `0.0.0.0/0` (permite qualquer IP)

### **❌ Página em branco ou erro 404**

**Soluções:**
1. Verifique se a aplicação está com Status "Enabled"
2. Verifique os logs para erros
3. Verifique se o caminho da aplicação está correto
4. Tente acessar: `https://seudominio.com/dashboard/api/health`

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy completo, verifique:

- [ ] ✅ Arquivos enviados para o servidor
- [ ] ✅ Aplicação criada no Application Manager
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Startup File configurado (`src/server.js`)
- [ ] ✅ Dependências instaladas (`npm install`)
- [ ] ✅ Prisma configurado (`npx prisma generate`)
- [ ] ✅ Aplicação iniciada e rodando
- [ ] ✅ Logs verificados (sem erros críticos)
- [ ] ✅ Dashboard acessível via navegador
- [ ] ✅ API respondendo (`/api/health`)

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes, consulte:

- **`GUIA_DEPLOY_CPANEL.md`** - Guia completo e detalhado
- **`INSTRUCOES_RAPIDAS_DEPLOY.md`** - Resumo em 6 passos
- **`COMO_CONFIGURAR_APLICACAO_EDIT.md`** - Como configurar na página de edição
- **`PROXIMOS_PASSOS_APOS_CRIAR_APLICACAO.md`** - Próximos passos após criar aplicação

---

## 🚀 COMANDOS RÁPIDOS (SSH/Terminal)

```bash
# Navegar até a pasta
cd ~/public_html/dashboard

# Instalar dependências
npm install

# Configurar Prisma
npx prisma generate

# Verificar se node_modules existe
ls -la node_modules

# Verificar se Prisma foi gerado
ls -la node_modules/.prisma/client
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verifique os logs** no Application Manager
2. **Verifique as variáveis de ambiente**
3. **Verifique se Node.js >= 18.0.0** está instalado no servidor
4. **Entre em contato com o suporte** do seu provedor de hospedagem

---

**Última atualização:** Janeiro 2025  
**Versão do Sistema:** 3.0.0

