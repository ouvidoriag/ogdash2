# 🏗️ Setup da Integração Colab - Zeladoria

## ⚠️ Erro 404 nas Rotas

Se você está vendo erros 404 em `/api/colab/*`, o servidor precisa ser **reiniciado** após adicionar as rotas.

## 🔧 Configuração Necessária

### 1. Adicionar Credenciais ao `.env`

Adicione estas variáveis ao arquivo `.env` na raiz do projeto `NOVO`:

```env
# API Colab - Produção
COLAB_API_BASE=https://api.colabapp.com/v2/integration
COLAB_APPLICATION_ID=7cd09fab-f27b-4f7e-866a-f9bb9b5ba419
COLAB_REST_API_KEY=d30234cd-93c9-4fe7-9242-65324a37a4c1
COLAB_ADMIN_USER_AUTH_TICKET=51643b45-bfd7-43cc-82de-13f6ed6cdb1e

# API Colab - Staging (opcional)
COLAB_STAGING_API_BASE=https://stg-api.colabapp.com/v2/integration
COLAB_USE_STAGING=false
```

### 2. Reiniciar o Servidor

**IMPORTANTE:** Após adicionar as credenciais, você **DEVE reiniciar o servidor**:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente:
cd NOVO
npm start
```

### 3. Verificar Rotas

Após reiniciar, teste se as rotas estão funcionando:

```bash
# Testar categorias
curl http://localhost:3000/api/colab/categories?type=post

# Testar demandas (ajuste as datas)
curl "http://localhost:3000/api/colab/posts?start_date=2024-01-01%2000:00:00.0000&end_date=2024-12-31%2023:59:59.9999"
```

## 📍 Acessar Zeladoria

- **Ouvidoria**: http://localhost:3000
- **Zeladoria**: http://localhost:3000/zeladoria

## ✅ Checklist

- [ ] Credenciais adicionadas ao `.env`
- [ ] Servidor reiniciado
- [ ] Rotas `/api/colab/*` respondendo (não mais 404)
- [ ] Página `/zeladoria` carregando corretamente

## 🐛 Troubleshooting

### Erro 404 nas rotas
- ✅ **Solução**: Reiniciar o servidor após adicionar as rotas

### Erro 500 "Credenciais não configuradas"
- ✅ **Solução**: Adicionar variáveis de ambiente no `.env` e reiniciar

### Erro de conexão com API do Colab
- ✅ **Solução**: Verificar se as credenciais estão corretas
- ✅ **Solução**: Verificar se está usando staging ou produção

