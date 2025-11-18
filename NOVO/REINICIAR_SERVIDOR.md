# 🔄 Reiniciar Servidor - IMPORTANTE

## ⚠️ Erro 404 nas Rotas `/api/colab/*`

As rotas estão retornando **404** porque o servidor precisa ser **reiniciado** após adicionar as novas rotas do Colab.

## ✅ Solução

### 1. Parar o Servidor

No terminal onde o servidor está rodando, pressione:
```
Ctrl + C
```

### 2. Reiniciar o Servidor

```bash
cd NOVO
npm start
```

### 3. Verificar se Funcionou

Após reiniciar, acesse:
- **Zeladoria**: http://localhost:3000/zeladoria
- **API Teste**: http://localhost:3000/api/colab/categories?type=post

Se ainda retornar 404, verifique:
1. Se o arquivo `.env` tem as credenciais do Colab
2. Se não há erros no console do servidor
3. Se as rotas estão sendo registradas (procure por "Rotas do Colab" nos logs)

## 📝 Credenciais Necessárias

Adicione ao `.env`:

```env
COLAB_APPLICATION_ID=7cd09fab-f27b-4f7e-866a-f9bb9b5ba419
COLAB_REST_API_KEY=d30234cd-93c9-4fe7-9242-65324a37a4c1
COLAB_ADMIN_USER_AUTH_TICKET=51643b45-bfd7-43cc-82de-13f6ed6cdb1e
COLAB_USE_STAGING=false
```

## 🎯 Após Reiniciar

As rotas devem funcionar:
- ✅ `GET /api/colab/categories`
- ✅ `GET /api/colab/posts`
- ✅ `POST /api/colab/posts`
- ✅ E todas as outras rotas do Colab

