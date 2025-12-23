# 🔐 Guia Completo: Como Conectar as APIs do Google

**Sistema:** Dashboard de Ouvidoria  
**Data:** Dezembro 2025  
**CÉREBRO X-3**

---

## 📋 Visão Geral

O sistema utiliza **duas APIs do Google**:

1. **Google Sheets API** - Para ler dados das planilhas (Service Account)
2. **Gmail API** - Para enviar emails de notificações (OAuth 2.0)

Cada uma tem um processo de configuração diferente. Este guia explica ambos.

---

## 🟦 PARTE 1: Google Sheets API (Service Account)

### **O que é?**
Autenticação via Service Account (conta de serviço) - não requer login manual.

### **Passo 1: Criar Projeto no Google Cloud Console**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **ID do Projeto** (será necessário depois)

### **Passo 2: Ativar Google Sheets API**

1. No menu lateral, vá em **"APIs & Services"** > **"Library"**
2. Busque por **"Google Sheets API"**
3. Clique em **"Enable"** (Ativar)
4. Repita o processo para **"Google Drive API"** (também necessário)

### **Passo 3: Criar Service Account**

1. Vá em **"APIs & Services"** > **"Credentials"**
2. Clique em **"Create Credentials"** > **"Service Account"**
3. Preencha:
   - **Service account name**: `dashboard-ouvidoria` (ou qualquer nome)
   - **Service account ID**: será gerado automaticamente
   - Clique em **"Create and Continue"**
4. Na etapa de **"Grant this service account access to project"**:
   - Role: **"Editor"** (ou "Viewer" se só precisar ler)
   - Clique em **"Continue"** e depois **"Done"**

### **Passo 4: Criar e Baixar Chave JSON**

1. Na lista de Service Accounts, clique na conta criada
2. Vá na aba **"Keys"**
3. Clique em **"Add Key"** > **"Create new key"**
4. Escolha **"JSON"**
5. Clique em **"Create"** - o arquivo será baixado automaticamente

### **Passo 5: Configurar no Sistema**

1. **Renomeie o arquivo baixado** para: `google-credentials.json`
2. **Mova o arquivo** para: `NOVO/config/google-credentials.json`
3. **Configure no `.env`**:
   ```env
   GOOGLE_CREDENTIALS_FILE=config/google-credentials.json
   GOOGLE_SHEET_ID=1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g
   ```

### **Passo 6: Compartilhar Planilha com Service Account**

⚠️ **CRÍTICO:** A planilha precisa ser compartilhada com o email do Service Account!

1. Abra o arquivo `google-credentials.json`
2. Copie o valor do campo **`client_email`** (ex: `dashboard-ouvidoria@projeto-123.iam.gserviceaccount.com`)
3. Abra sua planilha no Google Sheets
4. Clique em **"Compartilhar"** (botão no canto superior direito)
5. Cole o email do Service Account
6. Dê permissão de **"Editor"** ou **"Visualizador"**
7. Clique em **"Enviar"**

### **Passo 7: Testar Conexão**

Execute o script de teste:

```bash
cd NOVO
node scripts/test/testGoogleSheets.js
```

**Resultado esperado:**
```
✅✅✅ TESTE CONCLUÍDO COM SUCESSO ✅✅✅
✅ Conexão com Google Sheets estabelecida!
✅ Planilha acessível!
```

---

## 🟧 PARTE 2: Gmail API (OAuth 2.0)

### **O que é?**
Autenticação via OAuth 2.0 - requer autorização manual uma vez, depois funciona automaticamente.

### **Passo 1: Criar Credenciais OAuth 2.0**

1. No mesmo projeto do Google Cloud Console, vá em **"APIs & Services"** > **"Credentials"**
2. Clique em **"Create Credentials"** > **"OAuth client ID"**
3. Se solicitado, configure a **OAuth consent screen**:
   - **User Type**: "Internal" (se for conta Google Workspace) ou "External"
   - **App name**: "Dashboard Ouvidoria"
   - **User support email**: seu email
   - **Developer contact**: seu email
   - Clique em **"Save and Continue"**
   - Em **"Scopes"**, adicione: `https://www.googleapis.com/auth/gmail.send`
   - Clique em **"Save and Continue"**
   - Em **"Test users"**, adicione seu email (se for "External")
   - Clique em **"Save and Continue"**
4. Configure o OAuth Client:
   - **Application type**: **"Desktop app"**
   - **Name**: "Dashboard Ouvidoria Gmail"
   - Clique em **"Create"**
5. **Baixe o arquivo JSON** de credenciais

### **Passo 2: Configurar no Sistema**

1. **Renomeie o arquivo baixado** para: `gmail-credentials.json`
2. **Mova o arquivo** para: `NOVO/config/gmail-credentials.json`

### **Passo 3: Configurar Redirect URI**

1. No Google Cloud Console, vá em **"APIs & Services"** > **"Credentials"**
2. Clique no OAuth Client criado
3. Em **"Authorized redirect URIs"**, adicione:
   - `http://localhost:3000/api/notifications/auth/callback`
   - `http://localhost/`
   - `urn:ietf:wg:oauth:2.0:oob` (para aplicações desktop)
4. Clique em **"Save"**

### **Passo 4: Autorizar o Aplicativo**

Execute o script de autorização:

```bash
cd NOVO
node scripts/email/autorizar-gmail.js
```

**O script vai:**
1. Gerar uma URL de autorização
2. Você deve abrir essa URL no navegador
3. Fazer login com a conta Gmail que enviará os emails
4. Autorizar o acesso
5. Copiar o código da URL de retorno
6. Colar o código no terminal

**Exemplo de fluxo:**

```
🔐 Autorização do Gmail API

📋 Siga estes passos:

1. Acesse esta URL no navegador:
   https://accounts.google.com/o/oauth2/auth?client_id=...

2. Faça login com a conta Gmail que enviará os emails
3. Autorize o acesso ao Gmail
4. Você será redirecionado para uma página
5. Copie o código da URL (parte após "code=")

   Exemplo de URL:
   http://localhost/?code=4/0AeanS...
   O código é: 4/0AeanS...

Cole o código aqui: [COLE O CÓDIGO AQUI]
```

**Resultado esperado:**
```
✅ Autorização concluída com sucesso!
📁 O token foi salvo em: config/gmail-token.json
🎉 Agora você pode usar o sistema de notificações!
```

### **Passo 5: Testar Envio de Email**

Teste via API:

```bash
# Via curl
curl "http://localhost:3000/api/notifications/test?email=seu_email@gmail.com"

# Ou via navegador
http://localhost:3000/api/notifications/test?email=seu_email@gmail.com
```

---

## 📁 Estrutura de Arquivos

Após configurar, você deve ter:

```
NOVO/
├── config/
│   ├── google-credentials.json    ← Service Account (Google Sheets)
│   ├── gmail-credentials.json     ← OAuth Client (Gmail)
│   └── gmail-token.json           ← Token OAuth (gerado automaticamente)
└── .env                            ← Variáveis de ambiente
```

---

## 🔧 Variáveis de Ambiente (.env)

Adicione ao arquivo `.env` na raiz do projeto:

```env
# Google Sheets API
GOOGLE_CREDENTIALS_FILE=config/google-credentials.json
GOOGLE_SHEET_ID=1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g
GOOGLE_SHEET_RANGE=Dados!A1:Z1000

# Gmail API (não precisa de variáveis, usa arquivos de config)
# O sistema lê automaticamente de config/gmail-credentials.json
```

---

## ✅ Checklist de Configuração

### Google Sheets API
- [ ] Projeto criado no Google Cloud Console
- [ ] Google Sheets API ativada
- [ ] Google Drive API ativada
- [ ] Service Account criada
- [ ] Chave JSON baixada e renomeada para `google-credentials.json`
- [ ] Arquivo movido para `NOVO/config/google-credentials.json`
- [ ] Planilha compartilhada com o email do Service Account
- [ ] Variável `GOOGLE_CREDENTIALS_FILE` configurada no `.env`
- [ ] Teste executado com sucesso

### Gmail API
- [ ] OAuth consent screen configurado
- [ ] OAuth Client ID criado (tipo Desktop app)
- [ ] Arquivo JSON baixado e renomeado para `gmail-credentials.json`
- [ ] Arquivo movido para `NOVO/config/gmail-credentials.json`
- [ ] Redirect URIs configurados
- [ ] Autorização executada via script
- [ ] Token salvo em `config/gmail-token.json`
- [ ] Teste de envio executado com sucesso

---

## 🐛 Problemas Comuns e Soluções

### **Erro: "Arquivo de credenciais não encontrado"**

**Solução:**
- Verifique se o arquivo está em `NOVO/config/google-credentials.json`
- Verifique se a variável `GOOGLE_CREDENTIALS_FILE` está correta no `.env`
- Use caminho relativo: `config/google-credentials.json`

### **Erro: "Permission denied" ao acessar planilha**

**Solução:**
- Compartilhe a planilha com o email do Service Account
- O email está no campo `client_email` do arquivo `google-credentials.json`
- Dê permissão de "Editor" ou "Visualizador"

### **Erro: "API not enabled"**

**Solução:**
- Ative a Google Sheets API no Google Cloud Console
- Ative também a Google Drive API (necessária para acessar planilhas)

### **Erro: "Invalid grant" no Gmail**

**Solução:**
- O token pode ter expirado
- Execute novamente: `node scripts/email/autorizar-gmail.js`
- Certifique-se de usar `access_type: 'offline'` (já está configurado)

### **Erro: "Redirect URI mismatch"**

**Solução:**
- Verifique se o redirect URI está configurado no Google Cloud Console
- Adicione: `http://localhost/` e `urn:ietf:wg:oauth:2.0:oob`

---

## 📚 Scripts Úteis

### Testar Google Sheets
```bash
cd NOVO
node scripts/test/testGoogleSheets.js
```

### Autorizar Gmail
```bash
cd NOVO
node scripts/email/autorizar-gmail.js
```

### Atualizar dados do Google Sheets
```bash
cd NOVO
node scripts/data/updateFromGoogleSheets.js
```

### Testar envio de email
```bash
# Via API
curl "http://localhost:3000/api/notifications/test?email=seu_email@gmail.com"
```

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**

1. **Nunca commite** os arquivos de credenciais no Git:
   - `google-credentials.json`
   - `gmail-credentials.json`
   - `gmail-token.json`

2. **Adicione ao `.gitignore`**:
   ```
   NOVO/config/*-credentials.json
   NOVO/config/*-token.json
   ```

3. **Use variáveis de ambiente** para produção (Render, Heroku, etc.)

4. **Mantenha as credenciais seguras** - elas dão acesso total às suas APIs

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do sistema
2. Execute os scripts de teste
3. Verifique a documentação do Google Cloud Console
4. Consulte os arquivos de README em:
   - `NOVO/src/services/email-notifications/README.md`
   - `NOVO/scripts/test/testGoogleSheets.js`

---

**Documento criado por:** CÉREBRO X-3  
**Última atualização:** Dezembro 2025

