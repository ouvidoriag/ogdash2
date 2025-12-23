# 🚨 CONFIGURAÇÃO OBRIGATÓRIA NO GOOGLE CLOUD CONSOLE

## ⚠️ PROBLEMA ATUAL

Os campos estão **VAZIOS** no Google Cloud Console:
- ❌ Origens JavaScript autorizadas
- ❌ URIs de redirecionamento autorizados

**Resultado:** Erro 400 – `redirect_uri_mismatch`

---

## ✅ SOLUÇÃO PASSO A PASSO

### 1️⃣ Acessar o Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Selecione o projeto: **agendaouvidoria**
3. Vá em: **APIs e Serviços** → **Credenciais**
4. Clique no **ID do Cliente OAuth 2.0**: 
   ```
   353430763944-tmerll34c4anr8d12vjnpk6bv0c9i3fd
   ```

### 2️⃣ CONFIGURAR "ORIGENS JAVASCRIPT AUTORIZADAS"

👉 Clique em **"Adicionar URI"** e adicione:

```
http://localhost:3000
```

**Se você usar outra porta (ex: 5173, 8080), adicione também:**
```
http://localhost:5173
```

**Se já tiver domínio de produção:**
```
https://agendaouvidoria.seudominio.com
```

⚠️ **IMPORTANTE:**
- Sem barra final (`/`)
- Sem caminho (só a URL base)
- Use `http://` para localhost
- Use `https://` para produção

### 3️⃣ CONFIGURAR "URIs DE REDIRECIONAMENTO AUTORIZADOS"

👉 Clique em **"Adicionar URI"** e adicione **TODOS** estes (um por vez):

#### Para Scripts CLI (linha de comando):
```
urn:ietf:wg:oauth:2.0:oob
```

#### Para Aplicação Web (callback da API):
```
http://localhost:3000/api/notifications/auth/callback
```

#### Outros (backup):
```
http://localhost:3000
http://localhost
```

**Se já tiver domínio de produção:**
```
https://agendaouvidoria.seudominio.com/api/notifications/auth/callback
```

⚠️ **IMPORTANTE:**
- **EXATAMENTE** como mostrado acima
- Sem espaços extras
- Sem barras finais extras
- Mesma porta que você usa
- Mesmo caminho que o código usa

### 4️⃣ SALVAR E AGUARDAR

1. Clique em **"Salvar"** (no final da página)
2. ⏳ **Aguarde 30-60 segundos** para propagação
3. Não feche a página até salvar!

---

## 🧪 TESTAR APÓS CONFIGURAR

### Teste 1: Script CLI
```bash
npm run gmail:auth
```

### Teste 2: Via API Web
```bash
# Obter URL de autorização
GET http://localhost:3000/api/notifications/auth/url

# Acessar a URL retornada no navegador
# Após autorizar, o Google redirecionará para:
# http://localhost:3000/api/notifications/auth/callback?code=...
```

---

## 🔍 SE AINDA DER ERRO

### Passo 1: Ver o erro exato

Quando aparecer o erro vermelho do Google:
1. Clique em **"Detalhes do erro"**
2. Procure por: `redirect_uri=...`
3. **Copie EXATAMENTE** o URI que aparece lá

### Passo 2: Adicionar o URI exato

1. Volte no Google Cloud Console
2. Em **"URIs de redirecionamento autorizados"**
3. Clique em **"Adicionar URI"**
4. Cole o URI que você copiou
5. Salve

### Passo 3: Verificar o código

O URI deve corresponder **EXATAMENTE** ao que está no código:

**Para scripts CLI:**
- Código usa: `urn:ietf:wg:oauth:2.0:oob`
- Console deve ter: `urn:ietf:wg:oauth:2.0:oob`

**Para web:**
- Código usa: `http://localhost:3000/api/notifications/auth/callback`
- Console deve ter: `http://localhost:3000/api/notifications/auth/callback`

---

## ✅ CHECKLIST FINAL

Antes de testar, confirme:

- [ ] ✅ Tipo do cliente: **Aplicativo da Web** (já está correto)
- [ ] ✅ **Origens JavaScript autorizadas** preenchidas
- [ ] ✅ **URIs de redirecionamento autorizados** preenchidas
- [ ] ✅ Projeto correto selecionado: **agendaouvidoria**
- [ ] ✅ Cliquei em **"Salvar"**
- [ ] ✅ Aguardei 30-60 segundos
- [ ] ✅ Testei novamente

---

## 📋 RESUMO RÁPIDO

**O que colocar:**

1. **Origens JavaScript autorizadas:**
   ```
   http://localhost:3000
   ```

2. **URIs de redirecionamento autorizados:**
   ```
   urn:ietf:wg:oauth:2.0:oob
   http://localhost:3000/api/notifications/auth/callback
   http://localhost:3000
   ```

**Pronto!** 🎉

