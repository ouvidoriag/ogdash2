# ✅ PRÓXIMOS PASSOS - APÓS CRIAR APLICAÇÃO NO APPLICATION MANAGER

**Status:** ✅ Aplicação criada com sucesso!

Vejo que você já tem a aplicação registrada:
- **Name:** `dashboard`
- **Domain:** `ogmanalytics.duquedecaxias.rj.gov.br`
- **Path:** `/home/ogmanalytics/public_html/dashboard`
- **Status:** Enabled ✅

---

## 🎯 PRÓXIMOS PASSOS

### **PASSO 1: Configurar Variáveis de Ambiente**

1. **No Application Manager, clique em "Edit"** (ícone de lápis) na aplicação `dashboard`

2. **Procure por "Environment Variables"** ou **"Variables"** na página de edição

3. **Adicione as seguintes variáveis** (uma por vez):

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

   **📝 Variáveis Opcionais (se usar Colab):**
   ```
   COLAB_APPLICATION_ID=7cd09fab-f27b-4f7e-866a-f9bb9b5ba419
   COLAB_REST_API_KEY=d30234cd-93c9-4fe7-9242-65324a37a4c1
   COLAB_ADMIN_USER_AUTH_TICKET=51643b45-bfd7-43cc-82de-13f6ed6cdb1e
   COLAB_USE_STAGING=false
   ```

4. **Salve as variáveis**

**💡 Dica:** Veja o arquivo `CPANEL_VARIAVEIS_ENV.txt` para copiar todas de uma vez.

---

### **PASSO 2: Configurar Startup File**

1. **Na página de edição da aplicação**, procure por:
   - **"Startup File"** ou
   - **"Application Entry Point"** ou
   - **"Start Command"**

2. **Defina como:**
   ```
   src/server.js
   ```

3. **Salve a configuração**

---

### **PASSO 3: Instalar Dependências e Configurar Prisma (SSH)**

1. **Acesse o Terminal do cPanel:**
   - No cPanel, procure por **"Terminal"** em **Advanced**
   - Ou use SSH com suas credenciais

2. **Execute os seguintes comandos:**

   ```bash
   # Navegar até a pasta do projeto
   cd ~/public_html/dashboard
   
   # Instalar dependências
   npm install
   
   # Configurar Prisma
   npx prisma generate
   ```

   ⏱️ Isso pode demorar alguns minutos

3. **Verificar se tudo está OK:**
   ```bash
   # Verificar se node_modules existe
   ls -la node_modules
   
   # Verificar se Prisma foi gerado
   ls -la node_modules/.prisma/client
   ```

---

### **PASSO 4: Reiniciar a Aplicação**

1. **No Application Manager**, na lista de aplicações:
   - Clique em **"Edit"** na aplicação `dashboard`
   - Procure pelo botão **"Restart"** ou **"Reload"**
   - Clique para reiniciar

2. **Ou use o toggle de Status:**
   - Desabilite (toggle OFF)
   - Aguarde alguns segundos
   - Habilite novamente (toggle ON)

---

### **PASSO 5: Verificar Logs**

1. **No Application Manager**, na página da aplicação:
   - Clique em **"View Logs"** ou **"Logs"**
   - Verifique se há erros

2. **Procure por:**
   - ✅ `🚀 Dashboard running on http://localhost:PORT`
   - ✅ `✅ Conexão com MongoDB Atlas estabelecida`
   - ❌ Se houver erros, corrija antes de continuar

---

### **PASSO 6: Testar o Dashboard**

1. **Acesse o dashboard:**
   - URL: `https://ogmanalytics.duquedecaxias.rj.gov.br/dashboard`
   - Ou: `https://ogmanalytics.duquedecaxias.rj.gov.br` (se configurado como raiz)

2. **Teste a API:**
   - `https://ogmanalytics.duquedecaxias.rj.gov.br/dashboard/api/health`
   - Deve retornar: `{"status":"ok","version":"3.0.0"}`

3. **Verifique o console do navegador:**
   - Abra DevTools (F12)
   - Verifique se não há erros críticos

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### **Erro: "Application failed to start"**

**Soluções:**
1. Verifique os logs no Application Manager
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Verifique se `npm install` foi executado
4. Verifique se `npx prisma generate` foi executado
5. Verifique se o Startup File está correto: `src/server.js`

### **Erro: "Cannot find module"**

**Solução:**
```bash
cd ~/public_html/dashboard
npm install
```

### **Erro: "Prisma Client not generated"**

**Solução:**
```bash
cd ~/public_html/dashboard
npx prisma generate
```

### **Erro: "MongoDB connection failed"**

**Soluções:**
1. Verifique se `MONGODB_ATLAS_URL` está configurada
2. Adicione o IP do servidor na whitelist do MongoDB Atlas:
   - MongoDB Atlas → Network Access → Add IP Address
   - Adicione o IP do servidor ou `0.0.0.0/0` (qualquer IP)

### **Página em branco ou erro 404**

**Soluções:**
1. Verifique se a aplicação está com Status "Enabled"
2. Verifique os logs para erros
3. Verifique se o caminho está correto
4. Tente acessar diretamente: `https://ogmanalytics.duquedecaxias.rj.gov.br/dashboard/api/health`

---

## ✅ CHECKLIST FINAL

- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Startup File configurado (`src/server.js`)
- [ ] ✅ Dependências instaladas (`npm install`)
- [ ] ✅ Prisma configurado (`npx prisma generate`)
- [ ] ✅ Aplicação reiniciada
- [ ] ✅ Logs verificados (sem erros críticos)
- [ ] ✅ Dashboard acessível via navegador
- [ ] ✅ API respondendo (`/api/health`)

---

## 🚀 COMANDOS RÁPIDOS (SSH/Terminal)

```bash
# Navegar até a pasta
cd ~/public_html/dashboard

# Instalar dependências
npm install

# Configurar Prisma
npx prisma generate

# Verificar logs (se usar PM2)
pm2 logs dashboard

# Reiniciar (se usar PM2)
pm2 restart dashboard
```

---

## 📞 PRÓXIMOS PASSOS

Depois que tudo estiver funcionando:

1. **Configurar SSL/HTTPS** (se ainda não estiver)
2. **Otimizar performance** (cache, CDN, etc.)
3. **Configurar backup automático**
4. **Monitorar logs regularmente**

---

**Última atualização:** Janeiro 2025  
**Status da Aplicação:** ✅ Criada e habilitada

