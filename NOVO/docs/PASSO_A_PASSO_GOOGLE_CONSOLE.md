# 🎯 PASSO A PASSO: Configurar Google Cloud Console

## ⚠️ PROBLEMA ATUAL

O erro `redirect_uri_mismatch` acontece porque `http://localhost` **NÃO está** na lista de URIs autorizados.

## ✅ SOLUÇÃO (COPIE E COLE)

### 1️⃣ Acessar o Console

1. Abra: https://console.cloud.google.com/
2. Projeto: **agendaouvidoria**
3. Menu lateral: **APIs e Serviços** → **Credenciais**
4. Clique no cliente: `353430763944-tmerll34c4anr8d12vjnpk6bv0c9i3fd`

### 2️⃣ Configurar "Origens JavaScript autorizadas"

**Deve ter APENAS:**
```
http://localhost:3000
```

Se tiver `urn:ietf:wg:oauth:2.0:oob`, **REMOVA** (está no lugar errado e é inválido).

### 3️⃣ Configurar "URIs de redirecionamento autorizados"

**Adicione TODOS estes (um por vez, clique "+ Adicionar URI" para cada):**

**URI 1:**
```
http://localhost
```

**URI 2:**
```
http://localhost:3000/api/notifications/auth/callback
```

**URI 3:**
```
http://localhost:3000
```

### 4️⃣ SALVAR

1. Role até o final da página
2. Clique em **"Salvar"** (botão azul)
3. ⏳ **Aguarde 30-60 segundos**
4. ✅ **NÃO feche a página** até salvar!

### 5️⃣ TESTAR

```bash
npm run gmail:auth
```

---

## 🔍 VERIFICAÇÃO

Após salvar, verifique se:

- ✅ **Origens JavaScript autorizadas** tem: `http://localhost:3000`
- ✅ **URIs de redirecionamento autorizados** tem:
  - `http://localhost`
  - `http://localhost:3000/api/notifications/auth/callback`
  - `http://localhost:3000`
- ✅ **NÃO tem** `urn:ietf:wg:oauth:2.0:oob` em nenhum lugar

---

## 🆘 SE AINDA DER ERRO

1. Verifique se clicou em **"Salvar"**
2. Aguarde mais tempo (até 5 minutos)
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Tente em modo anônimo/incógnito
5. Verifique se está no projeto correto: **agendaouvidoria**

