# 🔧 Troubleshooting - Gmail API

## Erro 403: access_denied - Aplicativo em Modo de Teste

### ❌ Problema

```
Acesso bloqueado: o app teste-gmail não concluiu o processo de verificação do Google
Erro 403: access_denied
```

### ✅ Solução: Adicionar Email como Testador

Quando um aplicativo OAuth está em modo de teste, apenas emails adicionados como testadores podem autorizar o acesso.

#### Passo 1: Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Selecione o projeto: **peak-argon-475717-j7**
3. Vá em **APIs & Services** > **OAuth consent screen**

#### Passo 2: Adicionar Testadores

1. Na seção **Test users**, clique em **+ ADD USERS**
2. Adicione os emails que precisam acessar:
   - `ouvidoria020@gmail.com` (seu email)
   - `ouvgeral.gestao@gmail.com` (email que receberá notificações)
   - Qualquer outro email que precisar usar o sistema
3. Clique em **ADD**

#### Passo 3: Tentar Novamente

Após adicionar os emails como testadores:

1. Execute novamente:
```bash
npm run gmail:auth
```

2. Ou acesse a URL de autorização:
```bash
GET http://localhost:3000/api/notifications/auth/url
```

3. Faça login com um dos emails adicionados como testador

### 📋 Lista de Emails para Adicionar

Adicione estes emails como testadores:

- ✅ `ouvidoria020@gmail.com` - Email de desenvolvimento/teste
- ✅ `ouvgeral.gestao@gmail.com` - Email da Secretaria de Saúde (receberá notificações)

### 🔄 Alternativa: Publicar o Aplicativo (Não Recomendado para Testes)

Se quiser que qualquer pessoa possa autorizar (não recomendado para desenvolvimento):

1. No **OAuth consent screen**, mude de **Testing** para **In production**
2. **ATENÇÃO**: Isso requer verificação do Google e pode levar dias
3. Para desenvolvimento, é melhor usar testadores

### 🎯 Verificar Status dos Testadores

Para verificar se os emails foram adicionados:

1. Google Cloud Console > APIs & Services > OAuth consent screen
2. Role até a seção **Test users**
3. Verifique se os emails estão listados

### 📝 Passo a Passo Visual

```
Google Cloud Console
  └─ APIs & Services
      └─ OAuth consent screen
          └─ Test users (aba)
              └─ + ADD USERS
                  └─ Adicionar emails
                      └─ ADD
```

### ⚠️ Importante

- **Apenas emails adicionados como testadores** podem autorizar o aplicativo
- Se você adicionar um novo email depois, ele precisará ser adicionado como testador
- O aplicativo pode ter até **100 testadores** no modo de teste

### 🧪 Testar Após Adicionar Testadores

1. Certifique-se de que o email foi adicionado como testador
2. Aguarde alguns minutos (pode levar até 5 minutos para propagar)
3. Tente autorizar novamente:
```bash
npm run gmail:auth
```

4. Use um dos emails adicionados como testador para fazer login

### 🔍 Verificar se Funcionou

Após autorizar com sucesso:

```bash
GET http://localhost:3000/api/notifications/auth/status
```

Deve retornar:
```json
{
  "success": true,
  "authorized": true,
  "email": "ouvidoria020@gmail.com",
  "message": "Serviço autorizado e funcionando"
}
```

### 📚 Outros Erros Comuns

#### Erro: "redirect_uri_mismatch"

**Solução**: Adicione a URL de redirecionamento no Google Cloud Console:
- APIs & Services > Credentials > Seu OAuth Client
- Em "Authorized redirect URIs", adicione:
  - `http://localhost`
  - `http://localhost:3000`

#### Erro: "invalid_grant"

**Solução**: O código expirou. Obtenha uma nova URL de autorização e tente novamente.

#### Erro: "Token expirado"

**Solução**: O sistema renova automaticamente. Se persistir, execute a autorização novamente.

### ✅ Checklist de Resolução

- [ ] Acessei o Google Cloud Console
- [ ] Selecionei o projeto correto (peak-argon-475717-j7)
- [ ] Fui em OAuth consent screen > Test users
- [ ] Adicionei `ouvidoria020@gmail.com` como testador
- [ ] Adicionei `ouvgeral.gestao@gmail.com` como testador
- [ ] Aguardei alguns minutos para propagar
- [ ] Tentei autorizar novamente com um email de testador
- [ ] Verifiquei o status: `GET /api/notifications/auth/status`

### 🆘 Ainda com Problemas?

1. Verifique se está usando o projeto correto no Google Cloud Console
2. Verifique se a Gmail API está habilitada
3. Verifique se as credenciais OAuth estão corretas
4. Tente criar um novo OAuth Client ID se necessário
5. Verifique os logs do servidor para mais detalhes

