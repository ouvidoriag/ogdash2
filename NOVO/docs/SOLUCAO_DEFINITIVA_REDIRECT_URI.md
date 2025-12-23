# 🚨 SOLUÇÃO DEFINITIVA: redirect_uri_mismatch

## 🔍 PASSO 1: Descobrir Qual URI Está Sendo Usado

Execute este comando para ver EXATAMENTE qual URI o código está usando:

```bash
npm run gmail:debug
```

Isso vai mostrar o `redirect_uri` exato que está sendo enviado para o Google.

---

## ✅ PASSO 2: Adicionar o URI no Google Cloud Console

### 2.1 Acessar o Console

1. Acesse: https://console.cloud.google.com/
2. Projeto: **agendaouvidoria**
3. **APIs e Serviços** → **Credenciais**
4. Clique no cliente: `353430763944-tmerll34c4anr8d12vjnpk6bv0c9i3fd`

### 2.2 Adicionar URIs

#### A) Origens JavaScript autorizadas

Clique em **"Adicionar URI"** e adicione:

```
http://localhost:3000
```

#### B) URIs de redirecionamento autorizados

Clique em **"Adicionar URI"** e adicione **TODOS** estes (um por vez):

**1. Para Scripts CLI (OBRIGATÓRIO):**
```
urn:ietf:wg:oauth:2.0:oob
```

**2. Para Callback da API:**
```
http://localhost:3000/api/notifications/auth/callback
```

**3. Backup 1:**
```
http://localhost:3000
```

**4. Backup 2:**
```
http://localhost
```

### 2.3 Salvar

1. ✅ Clique em **"Salvar"** (no final da página)
2. ⏳ **Aguarde 30-60 segundos** (propagação)
3. ✅ **NÃO feche a página** até salvar!

---

## 🧪 PASSO 3: Testar

```bash
npm run gmail:auth
```

---

## 🆘 SE AINDA DER ERRO

### Opção 1: Ver o Erro Detalhado

Quando aparecer o erro vermelho do Google:

1. Clique em **"Detalhes do erro"** ou **"Saiba mais sobre o erro"**
2. Procure por algo como: `redirect_uri=http://...` ou `redirect_uri=urn:...`
3. **Copie EXATAMENTE** o URI que aparece lá
4. Volte no Google Cloud Console
5. Adicione esse URI exato em **"URIs de redirecionamento autorizados"**
6. Salve e aguarde

### Opção 2: Verificar a URL Gerada

Quando executar `npm run gmail:auth`, a URL gerada terá o `redirect_uri` na query string.

Exemplo de URL:
```
https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&...
```

O `redirect_uri` está codificado. Para decodificar:
- `urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob` = `urn:ietf:wg:oauth:2.0:oob`

**Adicione o URI decodificado no Google Cloud Console!**

---

## ✅ CHECKLIST FINAL

Antes de testar, confirme:

- [ ] ✅ Executei `npm run gmail:debug` e vi qual URI está sendo usado
- [ ] ✅ Adicionei **TODOS** os URIs no Google Cloud Console
- [ ] ✅ Adicionei a origem JavaScript: `http://localhost:3000`
- [ ] ✅ Cliquei em **"Salvar"**
- [ ] ✅ Aguardei 30-60 segundos
- [ ] ✅ Testei novamente com `npm run gmail:auth`

---

## 📋 URIs QUE DEVEM ESTAR NO CONSOLE

**Origens JavaScript autorizadas:**
- `http://localhost:3000`

**URIs de redirecionamento autorizados:**
- `urn:ietf:wg:oauth:2.0:oob` ⭐ **MAIS IMPORTANTE**
- `http://localhost:3000/api/notifications/auth/callback`
- `http://localhost:3000`
- `http://localhost`

---

## 💡 DICA IMPORTANTE

O Google é **MUITO RÍGIDO** com URIs. Eles devem ser **EXATAMENTE** iguais:

- ❌ `http://localhost:3000/` (com barra final) ≠ `http://localhost:3000` (sem barra)
- ❌ `http://localhost:3000` ≠ `http://localhost:3000/api/notifications/auth/callback`
- ✅ Use **EXATAMENTE** como está no código

---

## 🎯 SOLUÇÃO RÁPIDA (TL;DR)

1. Execute: `npm run gmail:debug`
2. Copie o `redirect_uri` mostrado
3. Vá no Google Cloud Console
4. Adicione esse URI em **"URIs de redirecionamento autorizados"**
5. Adicione `http://localhost:3000` em **"Origens JavaScript autorizadas"**
6. Salve e aguarde 30-60 segundos
7. Teste: `npm run gmail:auth`

