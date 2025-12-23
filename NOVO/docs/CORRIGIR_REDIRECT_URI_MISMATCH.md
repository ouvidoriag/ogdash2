# Como Corrigir o Erro redirect_uri_mismatch

## 🔴 Erro

```
Erro 400: redirect_uri_mismatch
Acesso bloqueado: a solicitação desse app é inválida
```

## 🔍 Causa

O `redirect_uri` usado na solicitação de autorização não corresponde a nenhum dos URIs de redirecionamento autorizados configurados no Google Cloud Console.

## ✅ Solução

### Passo 1: Verificar URIs no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto: **agendaouvidoria**
3. Vá em **APIs e Serviços** → **Credenciais**
4. Clique no **ID do Cliente OAuth 2.0**: `353430763944-tmerll34c4anr8d12vjnpk6bv0c9i3fd`
5. Verifique a seção **URIs de redirecionamento autorizados**

### Passo 2: Adicionar URIs Corretos

Adicione **TODOS** estes URIs na lista de URIs de redirecionamento autorizados:

```
http://localhost:3000
http://localhost:3000/api/notifications/auth/callback
http://localhost
urn:ietf:wg:oauth:2.0:oob
```

**⚠️ IMPORTANTE:**
- Para scripts CLI, use `urn:ietf:wg:oauth:2.0:oob` (out-of-band)
- Para aplicações web, use `http://localhost:3000` ou seu domínio
- **NÃO** adicione barras finais extras (`/`)
- **NÃO** adicione espaços
- Use **exatamente** como mostrado acima

### Passo 3: Salvar e Aguardar

1. Clique em **Salvar**
2. Aguarde alguns minutos para a propagação (pode levar até 5 minutos)

### Passo 4: Testar Novamente

Execute novamente:

```bash
npm run gmail:auth
```

## 🔧 Alternativa: Usar URI Específico para Scripts CLI

Se você estiver executando apenas scripts CLI (não uma aplicação web), pode usar apenas:

```
urn:ietf:wg:oauth:2.0:oob
```

E ajustar o código para usar esse URI especificamente.

## 📋 Checklist

- [ ] Acessei o Google Cloud Console
- [ ] Selecionei o projeto correto (agendaouvidoria)
- [ ] Encontrei o cliente OAuth 2.0 correto
- [ ] Adicionei todos os URIs de redirecionamento
- [ ] Salvei as alterações
- [ ] Aguardei alguns minutos
- [ ] Testei novamente o comando `npm run gmail:auth`

## 🆘 Se Ainda Não Funcionar

1. **Verifique se está usando o cliente OAuth correto:**
   - ID do Cliente: `353430763944-tmerll34c4anr8d12vjnpk6bv0c9i3fd.apps.googleusercontent.com`

2. **Verifique se o arquivo de credenciais está correto:**
   - Caminho: `NOVO/config/gmail-credentials.json`
   - Deve conter o `client_id` e `client_secret` corretos

3. **Limpe o cache do navegador** e tente novamente

4. **Use modo anônimo/incógnito** do navegador para testar

## 📚 Referências

- [Google OAuth 2.0 - redirect_uri_mismatch](https://developers.google.com/identity/protocols/oauth2/web-server#redirect-uri-validation)
- [Regras de validação de URI de redirecionamento](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation)

