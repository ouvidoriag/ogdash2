# 📁 PASSO A PASSO - FILE MANAGER DO CPANEL

## 🎯 O QUE FAZER AGORA (Baseado na sua tela)

Vejo que você está no File Manager do cPanel, no caminho `/home/ogmanalytics`.

---

## 📋 PASSO 1: CRIAR PASTA PARA O PROJETO

### **Opção A: Dentro de `public_html` (Recomendado)**

1. **Clique na pasta `public_html`** (na lista à direita)
2. **Dentro de `public_html`, crie uma nova pasta:**
   - Clique no botão **"+ Folder"** na barra de ferramentas
   - Nome da pasta: `dashboard` (ou `ouvidoria`)
   - Clique em **"Create"**

**Caminho final será:**
```
/home/ogmanalytics/public_html/dashboard
```

### **Opção B: Fora de `public_html` (Alternativa)**

Se preferir manter fora de `public_html`:

1. **Volte para `/home/ogmanalytics`** (clique em "Home" ou "↑ Up One Level")
2. **Crie uma nova pasta:**
   - Clique em **"+ Folder"**
   - Nome: `dashboard` (ou `ouvidoria`)
   - Clique em **"Create"**

**Caminho final será:**
```
/home/ogmanalytics/dashboard
```

**⚠️ RECOMENDAÇÃO:** Use a **Opção A** (dentro de `public_html`) para facilitar o acesso via web.

---

## 📤 PASSO 2: FAZER UPLOAD DOS ARQUIVOS

1. **Entre na pasta criada** (`dashboard` dentro de `public_html`)

2. **Clique no botão "Upload"** na barra de ferramentas

3. **Selecione todos os arquivos da pasta `NOVO/`** do seu computador:
   - ✅ `src/` (pasta completa)
   - ✅ `public/` (pasta completa)
   - ✅ `prisma/` (pasta completa)
   - ✅ `scripts/` (pasta completa)
   - ✅ `package.json`
   - ✅ `.htaccess`
   - ✅ `.env.example` (se houver)
   - ✅ Outros arquivos de configuração
   - ❌ **NÃO faça upload de `node_modules/`**

4. **Aguarde o upload completar** (pode demorar alguns minutos)

---

## ✅ PASSO 3: VERIFICAR SE OS ARQUIVOS FORAM ENVIADOS

Dentro da pasta `dashboard`, você deve ver:

```
dashboard/
├── src/
├── public/
├── prisma/
├── scripts/
├── package.json
├── .htaccess
└── ... outros arquivos
```

**⚠️ IMPORTANTE:** Verifique se o arquivo `package.json` está presente!

---

## 📝 PASSO 4: COPIAR O CAMINHO COMPLETO

Agora que os arquivos estão na pasta, você precisa do caminho completo:

### **Se você criou dentro de `public_html`:**
```
/home/ogmanalytics/public_html/dashboard
```

### **Se você criou fora de `public_html`:**
```
/home/ogmanalytics/dashboard
```

**💡 Dica:** Você pode verificar o caminho completo:
1. Estar dentro da pasta `dashboard`
2. Olhar na barra de navegação do File Manager
3. Ou ver o caminho completo no topo da interface

---

## 🚀 PASSO 5: VOLTAR AO APPLICATION MANAGER

Agora que você tem o caminho, volte ao **Application Manager** e preencha:

### **Application Name:**
```
ouvidoria-dashboard
```

### **Deployment Domain:**
Selecione no dropdown: `duquedecaxias.rj.gov.br` (ou o domínio desejado)

### **Application Path:**
```
/home/ogmanalytics/public_html/dashboard
```
(Use o caminho que você criou)

### **Deployment Environment:**
Selecione: **Production** ✅

---

## 📋 RESUMO VISUAL

```
1. File Manager → public_html → Criar pasta "dashboard"
2. Entrar na pasta "dashboard"
3. Upload → Selecionar todos os arquivos (exceto node_modules)
4. Aguardar upload
5. Verificar se package.json está presente
6. Copiar caminho: /home/ogmanalytics/public_html/dashboard
7. Application Manager → Preencher formulário com o caminho
8. Deploy → Criar aplicação
```

---

## ⚠️ IMPORTANTE

### **O que FAZER upload:**
- ✅ Toda a pasta `src/`
- ✅ Toda a pasta `public/`
- ✅ Toda a pasta `prisma/`
- ✅ Toda a pasta `scripts/`
- ✅ Arquivo `package.json`
- ✅ Arquivo `.htaccess`
- ✅ Outros arquivos de configuração

### **O que NÃO fazer upload:**
- ❌ Pasta `node_modules/` (será instalada no servidor)
- ❌ Pasta `.git/` (se houver)
- ❌ Arquivos temporários
- ❌ Logs locais

---

## 🔍 VERIFICAÇÃO FINAL

Antes de ir para o Application Manager, verifique:

- [ ] ✅ Pasta `dashboard` criada dentro de `public_html`
- [ ] ✅ Todos os arquivos foram enviados
- [ ] ✅ Arquivo `package.json` está presente
- [ ] ✅ Você sabe o caminho completo: `/home/ogmanalytics/public_html/dashboard`

---

## 🎯 PRÓXIMOS PASSOS

Depois de fazer upload e criar a aplicação no Application Manager:

1. **Configurar Variáveis de Ambiente** (veja `CPANEL_VARIAVEIS_ENV.txt`)
2. **Instalar Dependências** (via SSH/Terminal)
3. **Configurar Prisma** (via SSH/Terminal)
4. **Iniciar Aplicação**

**📖 Guia completo:** `GUIA_DEPLOY_CPANEL.md`

---

**Última atualização:** Janeiro 2025

