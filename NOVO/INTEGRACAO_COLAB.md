# 🏗️ Integração com API do Colab - Zeladoria

## 📋 Resumo

Integração completa com a API do Colab para a seção **Zeladoria** do dashboard. Esta integração permite gerenciar demandas do Colab diretamente no sistema.

**Documentação da API:** https://public-api-doc.colabapp.com/

---

## ✅ O que foi implementado

### 1. Backend (API)

#### Controller: `src/api/controllers/colabController.js`
- ✅ `getCategories()` - Listar categorias
- ✅ `getPosts()` - Listar demandas (com filtros de data, status, categoria)
- ✅ `getPostById()` - Consultar demanda específica (tipo post)
- ✅ `createPost()` - Criar nova demanda
- ✅ `acceptPost()` - Aceitar demanda
- ✅ `rejectPost()` - Rejeitar demanda
- ✅ `solvePost()` - Finalizar demanda
- ✅ `createComment()` - Criar comentário
- ✅ `getComments()` - Listar comentários
- ✅ `getEventById()` - Consultar demanda (tipo event)
- ✅ `acceptEvent()` - Aceitar evento
- ✅ `solveEvent()` - Finalizar evento
- ✅ `receiveWebhook()` - Receber webhooks do Colab

#### Rotas: `src/api/routes/colab.js`
Todas as rotas estão disponíveis em `/api/colab/*`:
- `GET /api/colab/categories` - Listar categorias
- `GET /api/colab/posts` - Listar demandas
- `GET /api/colab/posts/:id` - Consultar demanda
- `POST /api/colab/posts` - Criar demanda
- `POST /api/colab/posts/:id/accept` - Aceitar
- `POST /api/colab/posts/:id/reject` - Rejeitar
- `POST /api/colab/posts/:id/solve` - Finalizar
- `POST /api/colab/posts/:id/comment` - Comentar
- `GET /api/colab/posts/:id/comments` - Listar comentários
- `GET /api/colab/events/:id` - Consultar evento
- `POST /api/colab/events/:id/accept` - Aceitar evento
- `POST /api/colab/events/:id/solve` - Finalizar evento
- `POST /api/colab/webhooks` - Receber webhooks

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# API Colab - Produção
COLAB_API_BASE=https://api.colabapp.com/v2/integration
COLAB_APPLICATION_ID=seu-application-id
COLAB_REST_API_KEY=sua-rest-api-key
COLAB_ADMIN_USER_AUTH_TICKET=seu-auth-ticket

# API Colab - Staging (opcional)
COLAB_STAGING_API_BASE=https://stg-api.colabapp.com/v2/integration
COLAB_USE_STAGING=false
```

### 2. Credenciais do Colab

As credenciais devem ser fornecidas pelo time de suporte do Colab:
- **Application ID**: Identificador da aplicação
- **Rest API Key**: Chave de API REST
- **Admin User Auth Ticket**: Ticket de autenticação do usuário admin

**Contato:** technology@colab.re

---

## 📱 Frontend (Próximos Passos)

### Páginas a criar:

1. **Página de Demandas** (`zeladoria-colab-demandas`)
   - Lista de demandas com filtros
   - Status, categoria, data
   - Ações: aceitar, rejeitar, finalizar

2. **Página de Criação** (`zeladoria-colab-criar`)
   - Formulário para criar nova demanda
   - Seleção de categoria
   - Upload de imagens
   - Localização (lat/lng)

3. **Página de Detalhes** (`zeladoria-colab-detalhes`)
   - Detalhes da demanda
   - Comentários
   - Histórico de ações
   - Anexos

### Menu Lateral

Adicionar ao `sideMenuZeladoria` no `index.html`:

```html
<nav id="sideMenuZeladoria" class="space-y-3 text-sm" style="display: none;">
  <div class="space-y-1">
    <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">🏠 Início</div>
    <div data-page="zeladoria-home" class="active px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">🏠 Home Zeladoria</div>
    <div data-page="zeladoria-overview" class="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">📊 Visão Geral</div>
  </div>
  
  <!-- NOVO: Submenu Colab -->
  <div class="space-y-1">
    <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">🏗️ Colab</div>
    <div data-page="zeladoria-colab-demandas" class="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">📋 Demandas</div>
    <div data-page="zeladoria-colab-criar" class="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">➕ Criar Demanda</div>
    <div data-page="zeladoria-colab-categorias" class="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">🏷️ Categorias</div>
  </div>
</nav>
```

---

## 🔔 Webhooks

### Configuração no Colab GOV

Configure os webhooks na área administrativa do Colab GOV para apontar para:

```
https://seu-dominio.com/api/colab/webhooks
```

### Eventos Suportados:

- `CREATE_POST` - Nova demanda criada
- `ACCEPT_POST` - Demanda aceita
- `ATTEND_POST` - Demanda em atendimento
- `FINISH_POST` - Demanda finalizada
- `REOPEN_POST` - Demanda reaberta
- `POST_PRIORITY_UPDATE` - Prioridade alterada
- `CHANGE_POST_CATEGORY` - Categoria alterada
- `CHANGE_POST_RESPONSIBLE` - Responsável alterado
- `CREATE_POST_COMMENT` - Novo comentário
- `POST_ATTACHMENT_ADDITION` - Novo anexo

---

## 🧪 Testes

### Testar Listagem de Categorias:

```bash
curl -X GET "http://localhost:3000/api/colab/categories?type=post" \
  -H "Content-Type: application/json"
```

### Testar Listagem de Demandas:

```bash
curl -X GET "http://localhost:3000/api/colab/posts?start_date=2024-01-01%2000:00:00.0000&end_date=2024-12-31%2023:59:59.9999" \
  -H "Content-Type: application/json"
```

### Testar Criação de Demanda:

```bash
curl -X POST "http://localhost:3000/api/colab/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Teste de demanda",
    "address": "Rua Teste, 123",
    "neighborhood": "Centro",
    "lat": -22.7855,
    "lng": -43.3093,
    "postCategoryId": 1
  }'
```

---

## 📝 Status dos Status

O Colab usa os seguintes status:
- `NOVO` - Demanda nova
- `ABERTO` - Demanda aberta
- `ATENDIMENTO` - Em atendimento
- `ATENDIDO` - Atendido
- `FECHADO` - Fechado/Resolvido
- `RECUSADO` - Rejeitado

---

## 🚀 Próximos Passos

1. ✅ Backend completo
2. ⏳ Criar páginas frontend
3. ⏳ Adicionar menu no HTML
4. ⏳ Criar scripts JavaScript para as páginas
5. ⏳ Testar integração completa
6. ⏳ Configurar webhooks no Colab

---

## 📚 Referências

- [Documentação Oficial do Colab](https://public-api-doc.colabapp.com/)
- Suporte: technology@colab.re

