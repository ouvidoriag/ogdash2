# 📁 COMO USAR FILE MANAGER - cPanel

## 🎯 ACESSANDO O FILE MANAGER

Você está na seção **"Tools"** do cPanel. Para acessar o File Manager:

1. **Na seção "Files"**, clique em **"File Manager"** (ícone de pessoa com pasta)
2. Ou acesse diretamente via URL: `duquedecaxias.rj.gov.br:2083/cpsess.../frontend/jupiter/filemanager/index.html`

---

## 📂 ESTRUTURA DO PROJETO

O projeto deve estar em:
```
/home/ogmanalytics/public_html/dashboard
```

**Estrutura esperada:**
```
dashboard/
├── src/
│   ├── server.js
│   ├── config/
│   ├── api/
│   └── utils/
├── public/
│   ├── index.html
│   └── scripts/
├── prisma/
│   └── schema.prisma
├── package.json
├── .env
├── .htaccess
└── node_modules/ (será criado após npm install)
```

---

## 🚀 PASSO A PASSO - UPLOAD DOS ARQUIVOS

### **OPÇÃO 1: Upload via File Manager (Recomendado para arquivos individuais)**

1. **Acesse o File Manager**
   - Clique em **"File Manager"** na seção "Files"

2. **Navegue até a pasta**
   - Vá para: `/home/ogmanalytics/public_html/`
   - Se a pasta `dashboard` não existir, crie:
     - Clique em **"+ Folder"** ou **"New Folder"**
     - Nome: `dashboard`
     - Clique em **"Create"**

3. **Entre na pasta `dashboard`**
   - Clique duas vezes na pasta `dashboard`

4. **Upload dos arquivos**
   - Clique em **"Upload"** (botão no topo)
   - Arraste os arquivos ou clique em **"Select Files"**
   - **Selecione TODOS os arquivos** da pasta `NOVO` (exceto `node_modules`)
   - Aguarde o upload completar

5. **Verificar estrutura**
   - Confirme que as pastas `src/`, `public/`, `prisma/` estão presentes
   - Confirme que `package.json`, `.env`, `.htaccess` estão presentes

---

### **OPÇÃO 2: Upload via ZIP (Mais rápido para muitos arquivos)**

1. **No seu computador:**
   - Vá para a pasta `NOVO`
   - Selecione TODOS os arquivos e pastas (exceto `node_modules`)
   - Crie um arquivo ZIP:
     - Windows: Botão direito → "Enviar para" → "Pasta compactada (em zip)"
     - Nome: `dashboard.zip`

2. **No File Manager:**
   - Acesse `/home/ogmanalytics/public_html/`
   - Clique em **"Upload"**
   - Faça upload do arquivo `dashboard.zip`
   - Após upload, clique com botão direito no `dashboard.zip`
   - Selecione **"Extract"** ou **"Extrair"**
   - Confirme a extração

3. **Limpar:**
   - Delete o arquivo `dashboard.zip` após extrair

---

## ⚙️ CONFIGURAÇÕES IMPORTANTES NO FILE MANAGER

### **1. Mostrar Arquivos Ocultos**

Alguns arquivos importantes começam com `.` (ponto):
- `.env`
- `.htaccess`
- `.gitignore`

**Para ver arquivos ocultos:**
1. No File Manager, procure por **"Settings"** ou **"Preferences"**
2. Marque **"Show Hidden Files"** ou **"Mostrar arquivos ocultos"**
3. Clique em **"Save"**

---

### **2. Criar/Editar Arquivo .env**

Se o arquivo `.env` não foi enviado ou precisa ser editado:

1. **No File Manager:**
   - Navegue até `/home/ogmanalytics/public_html/dashboard/`
   - Clique em **"+ File"** ou **"New File"**
   - Nome: `.env`
   - Clique em **"Create"**

2. **Editar o arquivo:**
   - Clique duas vezes no arquivo `.env`
   - Cole o conteúdo (veja `CPANEL_VARIAVEIS_ENV.txt`):
   ```
   MONGODB_ATLAS_URL=mongodb+srv://ouvidoriadb:f7tgqnD46RV3lVg3@colabouvidoria.gk8g0dq.mongodb.net/ouvidoria?retryWrites=true&w=majority
   DATABASE_URL=mongodb+srv://ouvidoriadb:f7tgqnD46RV3lVg3@colabouvidoria.gk8g0dq.mongodb.net/ouvidoria?retryWrites=true&w=majority
   PORT=3000
   NODE_ENV=production
   GEMINI_API_KEY=AIzaSyBmawLDceBQNgaqh7JSGamDGhxtBNtJikQ
   ```
   - Salve o arquivo

---

### **3. Verificar Permissões**

Alguns arquivos precisam de permissões específicas:

1. **Selecionar arquivo/pasta:**
   - Clique com botão direito no arquivo
   - Selecione **"Change Permissions"** ou **"Alterar Permissões"**

2. **Permissões recomendadas:**
   - **Pastas:** `755` (rwxr-xr-x)
   - **Arquivos:** `644` (rw-r--r--)
   - **Scripts executáveis:** `755` (rwxr-xr-x)

3. **Aplicar:**
   - Marque as permissões desejadas
   - Clique em **"Change Permissions"**

---

## 🔧 APÓS UPLOAD - INSTALAR DEPENDÊNCIAS

Após fazer upload de todos os arquivos, você precisa instalar as dependências:

### **OPÇÃO A: Via Terminal/SSH (Recomendado)**

1. **Acesse o Terminal:**
   - No cPanel, procure por **"Terminal"** em **"Advanced"**
   - Ou use SSH com suas credenciais

2. **Execute:**
   ```bash
   cd ~/public_html/dashboard
   npm install
   npx prisma generate
   ```

### **OPÇÃO B: Via File Manager (Se não tiver SSH)**

Alguns cPanels permitem executar comandos via interface:
- Procure por **"Node.js Selector"** ou **"Setup Node.js App"**
- Ou use o **"Terminal"** do cPanel

---

## ✅ CHECKLIST - FILE MANAGER

- [ ] ✅ Pasta `dashboard` criada em `/home/ogmanalytics/public_html/`
- [ ] ✅ Todos os arquivos enviados (via upload ou ZIP)
- [ ] ✅ Estrutura verificada (`src/`, `public/`, `prisma/`)
- [ ] ✅ Arquivo `.env` criado e configurado
- [ ] ✅ Arquivo `.htaccess` presente
- [ ] ✅ Arquivo `package.json` presente
- [ ] ✅ Arquivos ocultos visíveis (se necessário)
- [ ] ✅ Permissões verificadas
- [ ] ✅ Dependências instaladas (`npm install`)
- [ ] ✅ Prisma configurado (`npx prisma generate`)

---

## 🐛 PROBLEMAS COMUNS

### **Erro: "Permission Denied"**

**Solução:**
1. Verifique permissões da pasta `dashboard`
2. Deve ser `755` para pastas
3. Use **"Change Permissions"** no File Manager

### **Erro: "File too large"**

**Solução:**
1. Use upload via ZIP
2. Ou aumente o limite de upload no cPanel
3. Ou use FTP para arquivos grandes

### **Erro: "Cannot find module" após npm install**

**Solução:**
1. Verifique se `node_modules/` foi criado
2. Execute `npm install` novamente via Terminal
3. Verifique se `package.json` está correto

### **Arquivo .env não aparece**

**Solução:**
1. Ative **"Show Hidden Files"** nas configurações do File Manager
2. Ou crie manualmente via **"+ File"**

---

## 📋 ARQUIVOS ESSENCIAIS PARA UPLOAD

**✅ OBRIGATÓRIOS:**
- `package.json`
- `src/` (pasta completa)
- `public/` (pasta completa)
- `prisma/` (pasta completa)
- `.env` (criar se não enviar)
- `.htaccess`

**❌ NÃO ENVIAR:**
- `node_modules/` (será criado via `npm install`)
- `.git/` (se houver)
- Arquivos temporários
- Documentação `.md` (opcional, pode enviar)

---

## 🚀 PRÓXIMOS PASSOS

Após fazer upload e instalar dependências:

1. **Voltar ao Application Manager**
2. **Verificar configurações** da aplicação
3. **Reiniciar aplicação**
4. **Testar acesso:**
   - `https://ogmanalytics.duquedecaxias.rj.gov.br/dashboard`
   - `https://ogmanalytics.duquedecaxias.rj.gov.br/dashboard/api/health`

---

**📖 Guias relacionados:**
- `PROXIMOS_PASSOS_APOS_CRIAR_APLICACAO.md`
- `COMO_CONFIGURAR_APLICACAO_EDIT.md`
- `GUIA_CPANEL.md`

---

**Última atualização:** Janeiro 2025

