# 🚀 Guia de Configuração no Render

## ❌ Problema: Render não carrega os dados

O servidor precisa de variáveis de ambiente obrigatórias que não estão configuradas no Render.

## ✅ Solução: Configurar Variáveis de Ambiente

### Variáveis OBRIGATÓRIAS no Render:

1. **`MONGODB_ATLAS_URL`** ⚠️ **CRÍTICO - SEM ISSO O SERVIDOR NÃO INICIA**
   - Valor: Sua connection string do MongoDB Atlas
   - Formato: `mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority`
   - **Onde encontrar**: MongoDB Atlas → Clusters → Connect → Connect your application

2. **`PORT`** (Opcional - Render define automaticamente)
   - O Render define automaticamente via `process.env.PORT`
   - Não precisa configurar manualmente

3. **`NODE_ENV`** (Recomendado)
   - Valor: `production`

4. **`WELLINGTON_DIR`** (Opcional)
   - Valor: `./Wellington`
   - Já tem valor padrão no código

### 📋 Passo a Passo para Configurar no Render

1. **Acesse o Dashboard do Render**
   - Vá para: https://dashboard.render.com
   - Selecione seu serviço

2. **Vá para a aba Environment**
   - No menu lateral, clique em **Environment** ou **Settings** → **Environment Variables**

3. **Adicione a variável MONGODB_ATLAS_URL**
   - Clique em **Add Environment Variable**
   - **Key**: `MONGODB_ATLAS_URL`
   - **Value**: Cole sua connection string do MongoDB Atlas
     - Exemplo: `mongodb+srv://ouvidoriadb:senha@colabouvidoria.gk8g0dq.mongodb.net/ouvidoria?retryWrites=true&w=majority`
   - Clique em **Save Changes**

4. **Adicione NODE_ENV (opcional mas recomendado)**
   - Clique em **Add Environment Variable** novamente
   - **Key**: `NODE_ENV`
   - **Value**: `production`
   - Clique em **Save Changes**

5. **Aguarde o Redeploy Automático**
   - O Render fará um redeploy automático após salvar as variáveis
   - Aguarde o deploy completar (pode levar 2-5 minutos)

6. **Verifique os Logs**
   - Vá para a aba **Logs** no Render
   - Você deve ver:
     ```
     ✅ Conexão com MongoDB Atlas estabelecida com sucesso!
     💬 Mensagens no banco de dados: X mensagens
     Dashboard running on http://localhost:XXXX
     ```

## 🔍 Verificar se os Dados Estão no Banco

### Opção 1: Verificar via Logs do Servidor

Nos logs do Render, você deve ver:
```
💬 Mensagens no banco de dados: X mensagens
```

### Opção 2: Verificar via API

Após o deploy, acesse:
```
https://seu-app.onrender.com/api/stats
```

Deve retornar estatísticas com o total de registros.

### Opção 3: Verificar no MongoDB Atlas

1. Acesse: https://cloud.mongodb.com
2. Vá para seu cluster
3. Clique em **Browse Collections**
4. Selecione o database `ouvidoria`
5. Verifique a collection `records`
6. Deve ter ~14.210 registros (ou o total que você importou)

## ❌ Se os Dados Não Estiverem no Banco

Se o banco estiver vazio, você precisa importar os dados:

### Opção 1: Importar Localmente e Fazer Push

1. **No seu computador local**, configure o `.env`:
   ```env
   MONGODB_ATLAS_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority"
   EXCEL_FILE="./Dashboard_Duque_de_Caxias_Ouvidoria_Duque_de_Caxias_Tabela_ATUALIZADA (2).xlsx"
   ```

2. **Importe os dados**:
   ```bash
   npm run import:excel
   npm run db:backfill
   ```

3. **Os dados estarão no MongoDB Atlas** e o Render acessará automaticamente

### Opção 2: Criar Script de Importação no Render (Avançado)

Você pode criar um script que importa dados automaticamente no primeiro deploy, mas isso é mais complexo.

## 🔧 Troubleshooting

### Erro: "MONGODB_ATLAS_URL não está definido!"

**Sintoma:**
```
❌ ERRO: MONGODB_ATLAS_URL não está definido!
Configure a variável MONGODB_ATLAS_URL no .env ou nas variáveis de ambiente
```

**Solução:**
- Adicione a variável `MONGODB_ATLAS_URL` no Render (veja passo a passo acima)
- Aguarde o redeploy automático

### Erro: "Server selection timeout" ou "fatal alert: InternalError"

**Sintoma:**
```
❌ Erro de conexão com MongoDB: Server selection timeout
Kind: I/O error: received fatal alert: InternalError
```

**Causa:** Problema de conexão SSL/TLS ou IP não autorizado no MongoDB Atlas.

**Solução:**
1. **⚠️ CRÍTICO: Adicione o IP do Render na whitelist do MongoDB Atlas:**
   - Acesse: https://cloud.mongodb.com
   - Vá em **Network Access** (ou **Security** → **Network Access**)
   - Clique em **Add IP Address**
   - **Opção 1 (Recomendado para desenvolvimento):** Adicione `0.0.0.0/0` (permite todos os IPs)
   - **Opção 2 (Produção):** Adicione o IP específico do Render
     - Para descobrir o IP do Render, verifique os logs ou use um serviço de IP lookup
   - Clique em **Confirm**
   - ⚠️ **Aguarde 1-2 minutos** para a mudança propagar

2. **Verifique as credenciais:**
   - MongoDB Atlas → Database Access
   - Verifique se o usuário tem permissões de leitura/escrita no banco `ouvidoria`

3. **Verifique se o cluster está ativo:**
   - MongoDB Atlas → Clusters
   - Certifique-se de que o cluster não está pausado
   - Se estiver pausado, clique em **Resume** e aguarde alguns minutos

4. **Teste a conexão:**
   - Após adicionar o IP na whitelist, aguarde 1-2 minutos
   - O Render fará um redeploy automático ou você pode fazer manualmente
   - Verifique os logs novamente

### Erro: "Não foi possível conectar ao MongoDB Atlas"

**Solução:**
1. Verifique se a connection string está correta
2. Verifique se o IP está na whitelist
3. Verifique se o usuário tem permissões
4. Verifique se o cluster está ativo no MongoDB Atlas

### Servidor inicia mas não carrega dados

**Possíveis causas:**
1. Banco de dados está vazio (não há dados importados)
2. Collection não existe
3. Nome do database está incorreto

**Solução:**
- Verifique se os dados foram importados (veja seção "Verificar se os Dados Estão no Banco")
- Importe os dados se necessário (veja seção "Se os Dados Não Estiverem no Banco")

## 📝 Checklist de Configuração

Antes de considerar o problema resolvido, verifique:

- [ ] Variável `MONGODB_ATLAS_URL` configurada no Render
- [ ] Variável `NODE_ENV` configurada como `production` (recomendado)
- [ ] **⚠️ IP do Render adicionado na whitelist do MongoDB Atlas (Network Access)**
- [ ] Cluster MongoDB Atlas está ativo (não pausado)
- [ ] Redeploy concluído com sucesso
- [ ] Logs mostram: "✅ Conexão com MongoDB Atlas estabelecida com sucesso!"
- [ ] **NÃO aparecem erros de "Server selection timeout" ou "fatal alert: InternalError"**
- [ ] API `/api/stats` retorna dados
- [ ] Dashboard carrega os dados corretamente

## 🎯 Resumo Rápido - SOLUÇÃO PARA ERRO SSL/TLS

**⚠️ PROBLEMA ATUAL:** Erro "fatal alert: InternalError" - IP do Render não está autorizado no MongoDB Atlas

**O que fazer AGORA (PRIORIDADE):**

1. **Adicione o IP do Render na whitelist do MongoDB Atlas:**
   - Acesse: https://cloud.mongodb.com
   - Vá em **Network Access** (ou **Security** → **Network Access**)
   - Clique em **Add IP Address**
   - Adicione `0.0.0.0/0` (permite todos os IPs) - **RECOMENDADO**
   - OU adicione o IP específico do Render
   - Clique em **Confirm**
   - ⚠️ **Aguarde 1-2 minutos** para a mudança propagar

2. **Verifique se o cluster está ativo:**
   - MongoDB Atlas → Clusters
   - Se estiver pausado, clique em **Resume**

3. **No Render:**
   - Vá em **Environment**
   - Verifique se `MONGODB_ATLAS_URL` está configurada
   - Adicione `NODE_ENV` = `production` (se ainda não tiver)

4. **Faça um redeploy no Render:**
   - Vá em **Manual Deploy** → **Deploy latest commit**
   - OU aguarde o redeploy automático

5. **Verifique os logs:**
   - Deve aparecer: "✅ Conexão com MongoDB Atlas estabelecida com sucesso!"
   - **NÃO deve aparecer:** "Server selection timeout" ou "fatal alert: InternalError"

6. **Teste a API:**
   - Acesse: `https://seu-app.onrender.com/api/stats`
   - Deve retornar dados JSON

**Se ainda não funcionar:**
- Verifique se os dados estão no MongoDB Atlas (collection `records`)
- Importe os dados se necessário usando `npm run import:excel` localmente
- Verifique as credenciais do MongoDB Atlas

