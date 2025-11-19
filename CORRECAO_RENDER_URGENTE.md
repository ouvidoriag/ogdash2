# 🚨 CORREÇÃO URGENTE - Render Dashboard

## ❌ Problema Identificado

O Render está procurando `package.json` em:
```
/opt/render/project/src/package.json
```

Mas o `package.json` está em:
```
/opt/render/project/package.json
```

**Isso significa que o Root Directory está configurado como `src/` no dashboard do Render.**

---

## ✅ SOLUÇÃO IMEDIATA

### Passo 1: Acessar o Dashboard do Render

1. Acesse: https://dashboard.render.com
2. Entre no seu serviço `ogdash`

### Passo 2: Ajustar Root Directory

1. Clique em **"Settings"** (Configurações)
2. Procure por **"Root Directory"** ou **"Working Directory"**
3. **ALTERE de `src/` para `.` (ponto) ou deixe VAZIO**
4. **Salve as alterações**

### Passo 3: Verificar Build Command

Na mesma página de Settings, verifique:

**Build Command deve ser:**
```
npm install && npm run build
```

**Start Command deve ser:**
```
npm start
```

### Passo 4: Verificar se está usando o commit mais recente

1. Na página do serviço, veja qual commit está sendo usado
2. Se estiver usando commit antigo (`c4547eeb...`), clique em **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🔄 Alternativa: Se não conseguir mudar Root Directory

Se o Render não permitir mudar o Root Directory, você pode:

### Opção A: Criar um package.json em `src/` que redirecione

Crie o arquivo `src/package.json`:

```json
{
  "name": "ouvidoria-dashboard-redirect",
  "version": "1.0.0",
  "scripts": {
    "install": "cd .. && npm install",
    "build": "cd .. && npm run build",
    "start": "cd .. && npm start"
  }
}
```

### Opção B: Mover tudo para `src/`

Mover toda a estrutura do projeto para dentro de `src/` (não recomendado, mas funciona)

---

## 📋 Checklist de Verificação

Após fazer as alterações:

- [ ] Root Directory está como `.` (ponto) ou vazio
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Commit mais recente está sendo usado
- [ ] Variáveis de ambiente configuradas
- [ ] Novo deploy iniciado

---

## 🎯 Resultado Esperado

Após corrigir, o build deve:

1. ✅ Encontrar `package.json` na raiz
2. ✅ Executar `npm install` com sucesso
3. ✅ Executar `npm run build` que vai para `NOVO/`
4. ✅ Executar `npm start` que inicia o servidor

---

**⚠️ IMPORTANTE:** O `render.yaml` pode não estar sendo usado se você configurou manualmente no dashboard. Sempre verifique as configurações no dashboard primeiro!

