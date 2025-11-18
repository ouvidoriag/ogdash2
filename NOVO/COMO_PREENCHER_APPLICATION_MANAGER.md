# 📝 COMO PREENCHER O APPLICATION MANAGER - PASSO A PASSO

## 🎯 FORMULÁRIO DO APPLICATION MANAGER

### **1. Application Name** (Nome da Aplicação)

**O que preencher:**
```
ouvidoria-dashboard
```

**Explicação:**
- Nome de exibição da aplicação no cPanel
- Pode ser qualquer nome descritivo
- Exemplos: `dashboard`, `ouvidoria`, `dashboard-ouvidoria`

---

### **2. Deployment Domain** (Domínio de Deploy)

**O que preencher:**
- **Selecione no dropdown** o domínio ou subdomínio onde a aplicação rodará

**Opções comuns:**
- `duquedecaxias.rj.gov.br` (domínio principal)
- `dashboard.duquedecaxias.rj.gov.br` (subdomínio - se já criado)
- `ouvidoria.duquedecaxias.rj.gov.br` (subdomínio - se já criado)

**💡 Dica:**
- Se quiser usar um subdomínio específico, primeiro crie-o em **"Subdomains"** no cPanel
- Depois selecione no dropdown

---

### **3. Application Path** (Caminho da Aplicação)

**O que preencher:**
```
/home/usuario/public_html/dashboard
```

**⚠️ IMPORTANTE:**
- Substitua `usuario` pelo seu usuário do cPanel
- O caminho deve apontar para a pasta onde você fez upload dos arquivos

**Como descobrir seu usuário:**
1. No cPanel, veja o canto superior direito (geralmente mostra o usuário)
2. Ou veja o caminho completo no File Manager quando estiver na pasta

**Exemplos de caminhos:**
```
/home/ogmanalytics/public_html/dashboard
/home/seu_usuario/public_html/dashboard
/home/ogmanalytics/public_html/ouvidoria
```

**📁 Estrutura esperada:**
```
/home/usuario/public_html/dashboard/
├── src/
├── public/
├── prisma/
├── package.json
├── .env
└── ... outros arquivos
```

**💡 Como verificar:**
1. Acesse **File Manager** no cPanel
2. Navegue até a pasta onde fez upload
3. Veja o caminho completo na barra de endereço
4. Copie esse caminho e cole no campo **Application Path**

---

### **4. Deployment Environment** (Ambiente de Deploy)

**O que selecionar:**
- ✅ **Production** (RECOMENDADO para produção)

**Explicação:**
- **Development:** Para desenvolvimento/testes (mais logs, menos otimizações)
- **Production:** Para produção (otimizado, menos logs, melhor performance)

**Sempre selecione:** `Production` ✅

---

## ✅ RESUMO DO PREENCHIMENTO

| Campo | Valor Exemplo | Observação |
|-------|---------------|------------|
| **Application Name** | `ouvidoria-dashboard` | Qualquer nome descritivo |
| **Deployment Domain** | `duquedecaxias.rj.gov.br` | Selecione no dropdown |
| **Application Path** | `/home/usuario/public_html/dashboard` | ⚠️ Ajuste o usuário |
| **Deployment Environment** | `Production` ✅ | Sempre Production |

---

## 🔍 COMO DESCOBRIR O CAMINHO CORRETO

### **Método 1: Via File Manager**

1. Acesse **File Manager** no cPanel
2. Navegue até a pasta onde você fez upload (ex: `dashboard`)
3. **Veja o caminho completo** na barra de endereço do File Manager
4. **Copie o caminho completo** e cole no campo **Application Path**

**Exemplo:**
- Se você está em: `public_html/dashboard`
- O caminho completo será: `/home/seu_usuario/public_html/dashboard`

### **Método 2: Via Terminal/SSH**

1. Acesse **Terminal** no cPanel
2. Execute:
   ```bash
   pwd
   ```
3. Isso mostrará o caminho completo do diretório atual
4. Navegue até a pasta do projeto:
   ```bash
   cd ~/public_html/dashboard
   pwd
   ```
5. Copie o caminho mostrado

---

## ⚠️ ERROS COMUNS

### **Erro: "Application path does not exist"**

**Solução:**
1. Verifique se o caminho está correto
2. Verifique se você fez upload dos arquivos para essa pasta
3. Use o File Manager para confirmar o caminho exato

### **Erro: "Invalid application path"**

**Solução:**
- O caminho deve começar com `/home/`
- Não use `~` ou `$HOME` - use o caminho completo
- Exemplo correto: `/home/usuario/public_html/dashboard`
- Exemplo errado: `~/public_html/dashboard`

### **Erro: "No package.json found"**

**Solução:**
1. Verifique se fez upload do arquivo `package.json`
2. Verifique se está na pasta correta
3. Use o File Manager para confirmar que `package.json` existe

---

## 📋 CHECKLIST ANTES DE CLICAR EM "DEPLOY"

- [ ] ✅ Arquivos já foram enviados para o servidor (via File Manager ou FTP)
- [ ] ✅ Você sabe qual é o caminho completo da pasta (verificou no File Manager)
- [ ] ✅ O arquivo `package.json` está na pasta
- [ ] ✅ O domínio/subdomínio está selecionado corretamente
- [ ] ✅ Environment está como `Production`

---

## 🚀 APÓS CLICAR EM "DEPLOY"

Depois de criar a aplicação, você precisará:

1. **Configurar Variáveis de Ambiente** (na página da aplicação criada)
2. **Instalar Dependências** (via SSH: `npm install`)
3. **Configurar Prisma** (via SSH: `npx prisma generate`)
4. **Definir Startup File** (`src/server.js`)
5. **Iniciar a Aplicação** (botão Start/Restart)

**📖 Veja o guia completo:** `GUIA_DEPLOY_CPANEL.md`

---

## 💡 EXEMPLO COMPLETO

**Cenário:** Você fez upload dos arquivos para `public_html/dashboard`

**Preenchimento:**

```
Application Name: ouvidoria-dashboard
Deployment Domain: duquedecaxias.rj.gov.br (selecionado no dropdown)
Application Path: /home/ogmanalytics/public_html/dashboard
Deployment Environment: Production ✅
```

**⚠️ Lembre-se:** Substitua `ogmanalytics` pelo seu usuário real do cPanel!

---

**Última atualização:** Janeiro 2025

