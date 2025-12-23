# ✅ CORREÇÃO FINAL: URIs para Google Cloud Console

## 🚨 PROBLEMA IDENTIFICADO

O Google **descontinuou** o URI `urn:ietf:wg:oauth:2.0:oob` (out-of-band).  
Ele não funciona mais e dá erro: **"Redirecionamento inválido: é preciso haver um domínio."**

## ✅ SOLUÇÃO

### 1️⃣ REMOVER do Google Cloud Console

❌ **Remova** `urn:ietf:wg:oauth:2.0:oob` de **"URIs de redirecionamento autorizados"**

### 2️⃣ ADICIONAR no Google Cloud Console

#### A) Origens JavaScript autorizadas

Deve ter apenas:
```
http://localhost:3000
```

#### B) URIs de redirecionamento autorizados

Adicione **TODOS** estes (um por vez):

**1. Para Scripts CLI:**
```
http://localhost
```

**2. Para Callback da API:**
```
http://localhost:3000/api/notifications/auth/callback
```

**3. Backup:**
```
http://localhost:3000
```

### 3️⃣ SALVAR

1. Clique em **"Salvar"**
2. Aguarde 30-60 segundos
3. Teste: `npm run gmail:auth`

---

## 📋 RESUMO FINAL

**Origens JavaScript autorizadas:**
- ✅ `http://localhost:3000`

**URIs de redirecionamento autorizados:**
- ✅ `http://localhost` ⭐ **Para scripts CLI**
- ✅ `http://localhost:3000/api/notifications/auth/callback` ⭐ **Para web**
- ✅ `http://localhost:3000` (backup)

**❌ NÃO usar:**
- ❌ `urn:ietf:wg:oauth:2.0:oob` (descontinuado pelo Google)

---

## 🧪 COMO FUNCIONA AGORA

Quando executar `npm run gmail:auth`:

1. Você acessa a URL fornecida
2. Autoriza o acesso
3. Google redireciona para: `http://localhost/?code=4/0AeanS...`
4. Você copia o código da URL (parte após `code=`)
5. Cola no terminal

**Nota:** A página `http://localhost` pode não carregar, mas o código estará na barra de endereço do navegador!

