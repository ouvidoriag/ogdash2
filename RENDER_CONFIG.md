# ⚙️ Configuração Manual no Render Dashboard

O `render.yaml` pode não estar sendo usado. Configure manualmente no dashboard:

## 📋 Configurações no Render Dashboard

### 1. Root Directory
**IMPORTANTE:** Deixe **VAZIO** ou coloque apenas `.` (ponto)

❌ **NÃO** coloque: `src/` ou `NOVO/`

### 2. Build Command
```
npm install && npm run build
```

### 3. Start Command
```
npm start
```

### 4. Node Version
- Deixe em branco (vai usar do package.json)
- OU especifique: `18.x` ou `20.x`

---

## 🔧 Se o Root Directory estiver como `src/`

Se você configurou o Root Directory como `src/`, você precisa:

1. **Mudar para `.` (vazio ou ponto)** no dashboard
2. **OU** criar um `package.json` em `src/` que aponte para a raiz

---

## ✅ Verificação

Após configurar, o build deve:
1. Encontrar `package.json` na raiz
2. Executar `npm install` na raiz
3. Executar `npm run build` que vai para `NOVO/`
4. Executar `npm start` que inicia o servidor

---

**Última atualização:** Janeiro 2025

