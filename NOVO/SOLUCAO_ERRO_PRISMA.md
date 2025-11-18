# 🔧 Solução: Erro de Permissão do Prisma Client

## ❌ Erro Encontrado

```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp...' -> 'query_engine-windows.dll.node'
```

## 🔍 Causa

Este erro acontece quando o **servidor está rodando** e está usando o arquivo `query_engine-windows.dll.node` do Prisma Client. O Windows não permite renomear arquivos que estão em uso.

## ✅ Solução

### Passo 1: Parar o Servidor

**No PowerShell, pressione `Ctrl+C` para parar o servidor que está rodando.**

Ou feche o terminal onde o servidor está rodando.

### Passo 2: Verificar Processos Node

Se ainda não funcionar, verifique se há processos Node rodando:

```powershell
# Ver processos Node
Get-Process node -ErrorAction SilentlyContinue

# Se encontrar processos, pare-os:
Stop-Process -Name node -Force
```

### Passo 3: Gerar Prisma Client

Depois de parar o servidor:

```bash
cd NOVO
npm run prisma:generate
```

### Passo 4: Aplicar Schema ao Banco

```bash
npm run prisma:push
```

### Passo 5: Normalizar Dados

```bash
npm run db:normalize
```

### Passo 6: Reiniciar Servidor

```bash
npm start
```

---

## 🎯 Resumo dos Comandos (em ordem)

```bash
# 1. Parar servidor (Ctrl+C no terminal onde está rodando)

# 2. Gerar Prisma Client
npm run prisma:generate

# 3. Aplicar schema ao banco
npm run prisma:push

# 4. Normalizar dados existentes
npm run db:normalize

# 5. Reiniciar servidor
npm start
```

---

## 💡 Dica

Se o erro persistir mesmo após parar o servidor:

1. Feche todos os terminais PowerShell/CMD
2. Feche o VS Code/Cursor se estiver aberto
3. Abra um novo terminal
4. Execute os comandos novamente

---

## 🔄 Alternativa: Usar --skip-generate

Se precisar aplicar o schema sem gerar o client:

```bash
npx prisma db push --skip-generate
```

Depois, quando o servidor estiver parado:

```bash
npm run prisma:generate
```

