# 📡 Como Conectar e Testar a API

## ✅ Status da API

A API **já está conectada e configurada**! O endpoint `/api/notificacoes/enviar-extra` foi criado e registrado corretamente.

## 🚀 Como Iniciar o Servidor

### 1. Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env` existe na raiz do projeto `NOVO/` com as seguintes variáveis:

```env
# MongoDB
MONGODB_ATLAS_URL=sua_connection_string_aqui

# Email
EMAIL_REMETENTE=ouvidoria@duquedecaxias.rj.gov.br
NOME_REMETENTE=Ouvidoria Geral de Duque de Caxias
EMAIL_OUVIDORIA_GERAL=ouvgeral.gestao@gmail.com

# Session
SESSION_SECRET=sua_chave_secreta_aqui

# Porta (opcional, padrão: 3000)
PORT=3000
```

### 2. Instalar Dependências (se necessário)

```bash
cd NOVO
npm install
```

### 3. Iniciar o Servidor

```bash
# Desenvolvimento
npm run dev

# Ou produção
npm start
```

O servidor iniciará em: **http://localhost:3000**

## 🔗 Endpoints de Notificações Disponíveis

Todos os endpoints estão protegidos por autenticação (`requireAuth`):

### GET Endpoints

- `GET /api/notificacoes` - Lista todas as notificações
- `GET /api/notificacoes/stats` - Estatísticas de notificações
- `GET /api/notificacoes/ultima-execucao` - Última execução do cron
- `GET /api/notificacoes/vencimentos?tipo=hoje` - Busca vencimentos

### POST Endpoints

- `POST /api/notificacoes/enviar-selecionados` - Envia emails para secretarias selecionadas
- `POST /api/notificacoes/enviar-extra` - **NOVO** - Envia email extra para emails informados

## 🧪 Como Testar o Endpoint de Envio Extra

### Via Frontend (Interface)

1. Acesse: `http://localhost:3000/dashboard`
2. Faça login
3. Navegue até a página **"Verificação de Notificações de Email"**
4. Role até a seção **"Controle Manual de Envio"**
5. Digite os emails no campo **"Envio Extra"** (separados por vírgula)
6. Clique em **"Enviar Extra"**

### Via API Direta (cURL ou Postman)

**Pré-requisito:** Você precisa estar autenticado (sessão ativa).

```bash
# 1. Primeiro, faça login para obter a sessão
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seu_usuario","password":"sua_senha"}' \
  -c cookies.txt

# 2. Enviar email extra
curl -X POST http://localhost:3000/api/notificacoes/enviar-extra \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "emails": [
      "email1@exemplo.com",
      "email2@exemplo.com"
    ]
  }'
```

### Exemplo de Resposta

```json
{
  "enviados": 2,
  "erros": 0,
  "detalhes": [
    {
      "email": "email1@exemplo.com",
      "status": "enviado",
      "messageId": "1234567890"
    },
    {
      "email": "email2@exemplo.com",
      "status": "enviado",
      "messageId": "0987654321"
    }
  ]
}
```

## 🔍 Verificar se a API Está Funcionando

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "version": "3.0.0"
}
```

### 2. Verificar Rotas Registradas

No console do servidor, você verá:
```
🚀 Dashboard running on http://localhost:3000
✅ Total de módulos registrados: X
```

### 3. Verificar Logs

O servidor usa `morgan` para logar todas as requisições. Você verá no console:

```
GET /api/notificacoes 200 45ms
POST /api/notificacoes/enviar-extra 200 1234ms
```

## 🐛 Troubleshooting

### Erro: "Cannot GET /api/notificacoes/enviar-extra"

**Causa:** Endpoint é POST, não GET.

**Solução:** Use `POST` ao invés de `GET`.

### Erro: "Unauthorized" ou 401

**Causa:** Não está autenticado.

**Solução:** 
1. Faça login primeiro em `/login`
2. Ou inclua o cookie de sessão nas requisições

### Erro: "MongoDB connection failed"

**Causa:** String de conexão inválida ou MongoDB inacessível.

**Solução:**
1. Verifique `MONGODB_ATLAS_URL` no `.env`
2. Teste a conexão do MongoDB

### Erro: "Email service not configured"

**Causa:** Gmail OAuth não configurado.

**Solução:**
1. Execute: `npm run gmail:auth`
2. Siga as instruções para autorizar o Gmail

## 📝 Estrutura da API

```
NOVO/src/
├── server.js                    # Servidor principal
├── api/
│   ├── routes/
│   │   ├── index.js            # Router principal (registra todas as rotas)
│   │   └── data.js             # Rotas de dados (inclui /api/notificacoes/*)
│   └── controllers/
│       └── notificacoesController.js  # Controller com todos os endpoints
└── services/
    └── email-notifications/     # Serviços de email
```

## ✅ Checklist de Verificação

- [ ] Servidor iniciado sem erros
- [ ] MongoDB conectado
- [ ] Health check responde `/api/health`
- [ ] Login funcionando
- [ ] Página de notificações carrega
- [ ] Endpoint `/api/notificacoes/enviar-extra` responde

## 🎯 Próximos Passos

1. Teste o envio extra pela interface
2. Verifique os logs do servidor
3. Confira o banco de dados para ver as notificações registradas
4. Teste com múltiplos emails separados por vírgula

---

**CÉREBRO X-3** - Sistema de Notificações por Email  
Documentação atualizada em: 2025-01-XX

