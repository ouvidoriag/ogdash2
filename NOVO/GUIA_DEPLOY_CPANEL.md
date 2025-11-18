# 🚀 GUIA COMPLETO - DEPLOY NO CPANEL APPLICATION MANAGER

**Data:** Janeiro 2025  
**Versão do Sistema:** 3.0.0  
**Método:** Application Manager (Phusion Passenger)

---

## 📋 PRÉ-REQUISITOS

- ✅ cPanel com **Application Manager** disponível
- ✅ Acesso ao **File Manager** ou **FTP/SFTP**
- ✅ Acesso ao **Terminal/SSH** (recomendado)
- ✅ Node.js >= 18.0.0 no servidor
- ✅ Credenciais do MongoDB Atlas

---

## 🎯 PASSO A PASSO COMPLETO

### **PASSO 1: Preparar Arquivos Localmente**

Antes de fazer upload, prepare os arquivos:

1. **Excluir arquivos desnecessários:**
   - ❌ `node_modules/` (será instalado no servidor)
   - ❌ `.git/` (se houver)
   - ❌ Arquivos temporários
   - ❌ Logs locais

2. **Verificar arquivos essenciais:**
   - ✅ `package.json`
   - ✅ `src/` (todo o código backend)
   - ✅ `public/` (arquivos frontend)
   - ✅ `prisma/` (schema do banco)
   - ✅ `.env.example` (para referência)
   - ✅ `.htaccess` (configuração Apache)

3. **Criar arquivo `.gitignore` (se não existir):**
   ```
   node_modules/
   .env
   .DS_Store
   *.log
   .prisma/
   ```

---

### **PASSO 2: Fazer Upload dos Arquivos**

**Opção A: Via File Manager do cPanel (Recomendado)**

1. Acesse o **File Manager** no cPanel
2. Navegue até `public_html` (ou a pasta do seu domínio)
3. Crie uma pasta para o projeto:
   - Exemplo: `dashboard` ou `ouvidoria`
   - **Caminho completo:** `/home/usuario/public_html/dashboard`
4. Entre na pasta criada
5. Faça upload de **TODOS** os arquivos do projeto:
   - Selecione todos os arquivos da pasta `NOVO/`
   - Faça upload (pode demorar alguns minutos)
   - **⚠️ NÃO faça upload da pasta `node_modules`**

**Opção B: Via FTP/SFTP**

1. Use um cliente FTP (FileZilla, WinSCP, etc.)
2. Conecte-se ao servidor com suas credenciais
3. Navegue até `public_html/dashboard` (ou pasta criada)
4. Faça upload de todos os arquivos
5. **⚠️ NÃO faça upload da pasta `node_modules`**

**Estrutura final no servidor:**
```
/home/usuario/public_html/dashboard/
├── src/
├── public/
├── prisma/
├── scripts/
├── package.json
├── .env (será criado)
├── .htaccess
└── ... outros arquivos
```

---

### **PASSO 3: Configurar Application Manager no cPanel**

1. **Acesse o Application Manager:**
   - No cPanel, procure por **"Application Manager"** na seção **Software**
   - Ou acesse diretamente: `cPanel → Software → Application Manager`

2. **Criar Nova Aplicação:**
   - Clique em **"Register Your Application"** ou **"Create Application"**
   - Preencha o formulário:

   **📝 Campos do Formulário:**

   | Campo | Valor |
   |-------|-------|
   | **Application Name** | `ouvidoria-dashboard` (ou outro nome) |
   | **Deployment Domain** | Selecione o domínio/subdomínio |
   | **Application Path** | `/home/usuario/public_html/dashboard` (ajuste conforme sua estrutura) |
   | **Deployment Environment** | `Production` ✅ |

3. **Clique em "Deploy"**

---

### **PASSO 4: Configurar Variáveis de Ambiente**

Após criar a aplicação, configure as variáveis de ambiente:

1. **Na página da aplicação criada, procure por:**
   - **"Environment Variables"** ou
   - **"Variables"** ou
   - **"Settings" → "Environment Variables"**

2. **Adicione as seguintes variáveis (uma por vez):**

   ```
   MONGODB_ATLAS_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority
   DATABASE_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority
   PORT=3000
   NODE_ENV=production
   GEMINI_API_KEY=sua_chave_gemini_aqui
   ```

   **📝 Variáveis Opcionais (se usar Colab):**
   ```
   COLAB_APPLICATION_ID=seu_application_id
   COLAB_REST_API_KEY=sua_api_key
   COLAB_ADMIN_USER_AUTH_TICKET=seu_auth_ticket
   COLAB_USE_STAGING=false
   ```

3. **Salve as variáveis**

---

### **PASSO 5: Instalar Dependências e Configurar**

**Via Terminal/SSH (Recomendado):**

1. **Acesse o Terminal do cPanel:**
   - No cPanel, procure por **"Terminal"** em **Advanced**
   - Ou use SSH com suas credenciais

2. **Navegue até a pasta do projeto:**
   ```bash
   cd ~/public_html/dashboard
   # ou
   cd /home/usuario/public_html/dashboard
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```
   ⏱️ Isso pode demorar alguns minutos

4. **Configure o Prisma:**
   ```bash
   npx prisma generate
   ```

5. **Verifique se tudo está OK:**
   ```bash
   ls -la
   # Deve mostrar node_modules, src, public, etc.
   ```

---

### **PASSO 6: Configurar Arquivo de Inicialização**

O Application Manager precisa saber qual arquivo iniciar:

1. **No Application Manager, na página da aplicação:**
   - Procure por **"Startup File"** ou **"Application Entry Point"**
   - Defina como: `src/server.js`

2. **Ou crie um arquivo `start.js` na raiz:**
   ```javascript
   // start.js
   import './src/server.js';
   ```
   - E defina o Startup File como: `start.js`

---

### **PASSO 7: Iniciar a Aplicação**

1. **No Application Manager:**
   - Procure pelo botão **"Start"** ou **"Restart"**
   - Clique para iniciar a aplicação

2. **Aguarde alguns segundos** para a aplicação iniciar

3. **Verifique os logs:**
   - Clique em **"View Logs"** ou **"Logs"**
   - Procure por: `🚀 Dashboard running on http://localhost:PORT`
   - Se houver erros, corrija antes de continuar

---

### **PASSO 8: Verificar se Está Funcionando**

1. **Acesse o dashboard:**
   - URL: `https://seudominio.com/dashboard` (ou o caminho configurado)
   - Ou: `https://dashboard.seudominio.com` (se usar subdomínio)

2. **Teste os endpoints:**
   - `https://seudominio.com/dashboard/api/health`
   - Deve retornar: `{"status":"ok","version":"3.0.0"}`

3. **Verifique o console do navegador:**
   - Abra as DevTools (F12)
   - Verifique se não há erros de carregamento

---

## 🔧 CONFIGURAÇÕES ADICIONAIS

### **Configurar Subdomínio (Opcional)**

1. No cPanel, acesse **"Subdomains"**
2. Crie um subdomínio: `dashboard.seudominio.com`
3. Aponte para: `public_html/dashboard`
4. Configure a aplicação no Application Manager para usar esse subdomínio

### **Configurar SSL/HTTPS**

1. No cPanel, acesse **"SSL/TLS Status"**
2. Instale um certificado SSL (Let's Encrypt é gratuito)
3. Force HTTPS (já configurado no código)

### **Configurar .htaccess (Se Necessário)**

O arquivo `.htaccess` já está incluído no projeto. Ele:
- Redireciona requisições para o Node.js
- Configura cache de arquivos estáticos
- Adiciona headers de segurança

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### **Erro: "Application failed to start"**

**Soluções:**
1. Verifique os logs no Application Manager
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Verifique se `npm install` foi executado
4. Verifique se `npx prisma generate` foi executado

### **Erro: "Cannot find module"**

**Soluções:**
```bash
cd ~/public_html/dashboard
npm install
```

### **Erro: "Prisma Client not generated"**

**Soluções:**
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
1. Verifique se os arquivos estão na pasta correta
2. Verifique se o Application Path está correto
3. Verifique os logs do Application Manager
4. Verifique se a aplicação está rodando (Status: Running)

### **Aplicação não responde**

**Soluções:**
1. Reinicie a aplicação no Application Manager
2. Verifique se a porta está correta
3. Verifique os logs para erros

---

## 📝 CHECKLIST FINAL

Antes de considerar o deploy completo, verifique:

- [ ] ✅ Arquivos enviados para o servidor
- [ ] ✅ Aplicação criada no Application Manager
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Dependências instaladas (`npm install`)
- [ ] ✅ Prisma configurado (`npx prisma generate`)
- [ ] ✅ Startup File configurado (`src/server.js`)
- [ ] ✅ Aplicação iniciada e rodando
- [ ] ✅ Logs verificados (sem erros críticos)
- [ ] ✅ Dashboard acessível via navegador
- [ ] ✅ API respondendo (`/api/health`)
- [ ] ✅ SSL/HTTPS configurado (recomendado)

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

# Reiniciar aplicação (se usar PM2)
pm2 restart dashboard
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verifique os logs** no Application Manager
2. **Verifique as variáveis de ambiente**
3. **Verifique se Node.js >= 18.0.0**
4. **Entre em contato com o suporte** do seu provedor de hospedagem

---

## ✅ RESUMO RÁPIDO

1. **Upload** → Envie arquivos para `public_html/dashboard`
2. **Application Manager** → Crie aplicação com caminho correto
3. **Variáveis** → Configure `MONGODB_ATLAS_URL`, `PORT`, etc.
4. **SSH** → Execute `npm install` e `npx prisma generate`
5. **Start** → Inicie a aplicação no Application Manager
6. **Teste** → Acesse `https://seudominio.com/dashboard`

---

**Última atualização:** Janeiro 2025  
**Versão do Sistema:** 3.0.0

