# ⚙️ COMO CONFIGURAR APLICAÇÃO - PÁGINA DE EDIÇÃO

## 🎯 PÁGINA DE EDIÇÃO DA APLICAÇÃO

Você está na página "Edit Your Application" do Application Manager. Vejo que os campos básicos já estão preenchidos:

- ✅ **Application Name:** `dashboard`
- ✅ **Deployment Domain:** `ogmanalytics.duquedecaxias.rj.gov.br`
- ✅ **Base Application URL:** `ogmanalytics.duquedecaxias.rj.gov.br /`
- ✅ **Application Path:** `/home/ogmanalytics/public_html/dashboard`
- ✅ **Deployment Environment:** `Production` ✅

---

## 📝 O QUE FAZER NESTA PÁGINA

### **1. Verificar/Configurar Startup File**

Procure na página por:
- **"Startup File"** ou
- **"Application Entry Point"** ou
- **"Start Command"** ou
- **"Node.js Startup File"**

**Defina como:**
```
src/server.js
```

**💡 Se não encontrar este campo:**
- Pode estar em outra seção da página
- Role a página para baixo
- Procure por abas ou seções como "Advanced", "Settings", "Configuration"

---

### **2. Configurar Variáveis de Ambiente**

Procure na página por:
- **"Environment Variables"** ou
- **"Variables"** ou
- **"Env Variables"** ou
- **"Environment"**

**Se encontrar, adicione:**

```
MONGODB_ATLAS_URL=mongodb+srv://ouvidoriadb:f7tgqnD46RV3lVg3@colabouvidoria.gk8g0dq.mongodb.net/ouvidoria?retryWrites=true&w=majority
```

```
DATABASE_URL=mongodb+srv://ouvidoriadb:f7tgqnD46RV3lVg3@colabouvidoria.gk8g0dq.mongodb.net/ouvidoria?retryWrites=true&w=majority
```

```
PORT=3000
```

```
NODE_ENV=production
```

```
GEMINI_API_KEY=AIzaSyBmawLDceBQNgaqh7JSGamDGhxtBNtJikQ
```

**💡 Se NÃO encontrar a seção de variáveis:**
- Pode estar em outra página/aba
- Alguns cPanels têm variáveis em uma seção separada
- Procure por "Settings" ou "Configuration" na página da aplicação

---

### **3. Salvar Configurações**

1. **Após configurar tudo**, clique no botão **"Deploy"** (azul) no final da página
2. **Ou procure por "Save"** ou **"Update"**

---

## 🔍 ONDE ENCONTRAR AS CONFIGURAÇÕES

### **Opção A: Na mesma página (role para baixo)**

Algumas versões do Application Manager têm tudo na mesma página. Role para baixo e procure por:
- Seção "Environment Variables"
- Seção "Startup File"
- Seção "Advanced Settings"

### **Opção B: Em abas/seções**

Procure por abas ou botões como:
- **"Settings"**
- **"Environment"**
- **"Advanced"**
- **"Configuration"**

### **Opção C: Na página de gerenciamento**

Após salvar, na lista de aplicações:
- Clique em **"Edit"** novamente
- Pode haver uma seção separada para variáveis de ambiente
- Ou um botão **"Manage"** ou **"Configure"**

---

## 📋 CHECKLIST DESTA PÁGINA

- [ ] ✅ Application Name: `dashboard` (já preenchido)
- [ ] ✅ Deployment Domain: `ogmanalytics.duquedecaxias.rj.gov.br` (já preenchido)
- [ ] ✅ Application Path: `/home/ogmanalytics/public_html/dashboard` (já preenchido)
- [ ] ✅ Deployment Environment: `Production` (já selecionado)
- [ ] ⏳ Startup File: `src/server.js` (verificar se há campo)
- [ ] ⏳ Variáveis de Ambiente: (adicionar se houver seção)

---

## 🚀 APÓS SALVAR NESTA PÁGINA

Depois de clicar em "Deploy" ou "Save":

1. **Instalar Dependências (SSH/Terminal):**
   ```bash
   cd ~/public_html/dashboard
   npm install
   npx prisma generate
   ```

2. **Reiniciar Aplicação:**
   - Volte para a lista de aplicações
   - Clique em "Restart" ou desabilite/habilite o toggle

3. **Verificar Logs:**
   - Clique em "View Logs" ou "Logs"
   - Verifique se há erros

4. **Testar:**
   - Acesse: `https://ogmanalytics.duquedecaxias.rj.gov.br/dashboard`
   - Teste API: `https://ogmanalytics.duquedecaxias.rj.gov.br/dashboard/api/health`

---

## 💡 DICAS IMPORTANTES

### **Se não encontrar campos de variáveis:**

Alguns cPanels têm variáveis em locais diferentes:
1. **Procure na página principal** da aplicação (não na edição)
2. **Procure por "Manage"** ou **"Configure"** na lista de aplicações
3. **Alguns usam arquivo `.env`** - você pode criar manualmente via File Manager

### **Se não encontrar Startup File:**

Alguns cPanels detectam automaticamente:
- Se houver `package.json` com `"main": "src/server.js"`, pode funcionar automaticamente
- Ou pode estar em outra seção da página

---

## 📞 PRÓXIMOS PASSOS

1. **Salvar esta página** (botão "Deploy")
2. **Instalar dependências** via SSH
3. **Configurar variáveis** (se não encontrou na página)
4. **Reiniciar aplicação**
5. **Testar acesso**

**📖 Guia completo:** `PROXIMOS_PASSOS_APOS_CRIAR_APLICACAO.md`

---

**Última atualização:** Janeiro 2025

