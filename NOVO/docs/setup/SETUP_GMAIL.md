# 🚀 Configuração Rápida do Gmail API

## ✅ Passo 1: Credenciais Configuradas

O arquivo `gmail-credentials.json` já foi criado com suas credenciais!

## 🔐 Passo 2: Adicionar Testadores (IMPORTANTE!)

⚠️ **ANTES de autorizar, você precisa adicionar seu email como testador!**

O aplicativo está em modo de teste, então apenas emails adicionados como testadores podem autorizar.

### Como Adicionar Testadores:

1. **Acesse o Google Cloud Console:**
   - https://console.cloud.google.com/
   - Selecione o projeto: **peak-argon-475717-j7**

2. **Vá em OAuth consent screen:**
   - Menu lateral: **APIs & Services** > **OAuth consent screen**

3. **Adicione testadores:**
   - Role até a seção **Test users**
   - Clique em **+ ADD USERS**
   - Adicione estes emails:
     - `ouvidoria020@gmail.com` (seu email)
     - `ouvgeral.gestao@gmail.com` (email que receberá notificações)
   - Clique em **ADD**

4. **Aguarde alguns minutos** para propagar

📚 **Guia completo:** Veja `TROUBLESHOOTING_GMAIL.md` para mais detalhes

## 🔐 Passo 3: Autorizar o Aplicativo

### Opção 1: Via Script (Recomendado)

```bash
cd NOVO
npm run gmail:auth
```

### Opção 2: Via API

1. **Inicie o servidor:**
```bash
cd NOVO
npm start
```

2. **Obtenha a URL de autorização:**
```bash
GET http://localhost:3000/api/notifications/auth/url
```

Ou acesse diretamente no navegador:
```
http://localhost:3000/api/notifications/auth/url
```

3. **Copie a URL retornada** e abra no navegador

4. **Faça login** com um dos emails adicionados como testador

5. **Autorize o acesso** (você verá uma tela pedindo permissão)

6. **Copie o código** da URL de retorno (parece com: `4/0AeanS...`)

7. **Envie o código via POST:**
```bash
POST http://localhost:3000/api/notifications/auth/callback
Content-Type: application/json

{
  "code": "CODIGO_COPIADO_AQUI"
}
```

Ou use curl:
```bash
curl -X POST http://localhost:3000/api/notifications/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"CODIGO_COPIADO_AQUI"}'
```

### Opção 2: Via Script Node.js

Crie um arquivo `autorizar-gmail.js` na raiz do projeto NOVO:

```javascript
import { getAuthUrl, authorize } from './src/services/email-notifications/gmailService.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Autorização do Gmail API\n');

// Obter URL de autorização
const authUrl = getAuthUrl();
console.log('1. Acesse esta URL no navegador:');
console.log(authUrl);
console.log('\n2. Faça login e autorize o acesso');
console.log('3. Copie o código da URL de retorno\n');

rl.question('Cole o código aqui: ', async (code) => {
  try {
    await authorize(code);
    console.log('\n✅ Autorização concluída com sucesso!');
    console.log('O token foi salvo em gmail-token.json');
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
  rl.close();
});
```

Execute:
```bash
node autorizar-gmail.js
```

## ✅ Passo 4: Verificar Autorização

```bash
GET http://localhost:3000/api/notifications/auth/status
```

Deve retornar:
```json
{
  "success": true,
  "authorized": true,
  "email": "seu_email@gmail.com",
  "message": "Serviço autorizado e funcionando"
}
```

## 🧪 Passo 5: Testar Envio

```bash
GET http://localhost:3000/api/notifications/test?email=seu_email@gmail.com
```

Se funcionar, você receberá um email de teste! 🎉

## 📝 Informações Importantes

### Credenciais Criadas

- **Arquivo:** `NOVO/gmail-credentials.json`
- **Client ID:** `482004433133-kb8hp13d18dv65tu06fb5a31p03iioj7.apps.googleusercontent.com`
- **Project ID:** `peak-argon-475717-j7`

### Arquivos Gerados

Após a autorização, será criado:
- `NOVO/gmail-token.json` - Token de acesso (não compartilhe!)

### Segurança

⚠️ **IMPORTANTE:**
- Os arquivos `gmail-credentials.json` e `gmail-token.json` já estão no `.gitignore`
- **NÃO compartilhe** esses arquivos
- **NÃO faça commit** desses arquivos no Git

### Troubleshooting

#### Erro 403: "access_denied" - Aplicativo em Modo de Teste

**Este é o erro mais comum!** O aplicativo está em modo de teste.

**Solução:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em "APIs & Services" > "OAuth consent screen"
3. Role até "Test users" e clique em "+ ADD USERS"
4. Adicione seu email (`ouvidoria020@gmail.com`) e outros emails necessários
5. Aguarde alguns minutos e tente novamente

📚 **Veja o guia completo:** `TROUBLESHOOTING_GMAIL.md`

#### Erro: "redirect_uri_mismatch"

Se aparecer este erro, você precisa adicionar a URL de redirecionamento no Google Cloud Console:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em "APIs & Services" > "Credentials"
3. Clique no seu OAuth 2.0 Client ID
4. Em "Authorized redirect URIs", adicione:
   - `http://localhost`
   - `http://localhost:3000`
5. Salve e tente novamente

#### Erro: "invalid_grant"

O código expirou. Obtenha uma nova URL de autorização e tente novamente.

#### Token expirado

O sistema renova automaticamente. Se persistir, execute a autorização novamente.

## 🎯 Próximos Passos

Após autorizar:

1. ✅ Configure os emails das secretarias em `emailConfig.js`
2. ✅ Teste o envio: `GET /api/notifications/test`
3. ✅ O sistema automático já está rodando (executa às 8h diariamente)

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `NOVO/src/services/email-notifications/README.md`
- `NOVO/src/cron/README.md`

