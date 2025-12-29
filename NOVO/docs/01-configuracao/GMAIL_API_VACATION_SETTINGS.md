# Gmail API - Vacation Settings (Resposta Automática de Férias)

## 📋 Visão Geral

Este documento explica como usar a API do Gmail para verificar e gerenciar configurações de resposta automática de férias.

## 🔑 Escopos Necessários

Para usar a API `users.settings.getVacation`, você precisa de um dos seguintes escopos OAuth:

- `https://www.googleapis.com/auth/gmail.settings.basic` ✅ **Recomendado** (menos permissivo)
- `https://mail.google.com/` (acesso completo ao Gmail)
- `https://www.googleapis.com/auth/gmail.modify` (modificar emails)
- `https://www.googleapis.com/auth/gmail.readonly` (apenas leitura)

## ✅ Configuração Atual

### Credenciais Atualizadas

As credenciais foram atualizadas em `NOVO/config/gmail-credentials.json`:

```json
{
  "web": {
    "client_id": "SEU_CLIENT_ID_AQUI",
    "project_id": "agendaouvidoria",
    "client_secret": "SEU_CLIENT_SECRET_AQUI"
  }
}
```

> ⚠️ **IMPORTANTE**: Nunca commite credenciais reais no repositório. Use variáveis de ambiente ou arquivos de configuração locais que estejam no `.gitignore`.

### Escopos Configurados

O sistema agora está configurado com os seguintes escopos:

```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',           // Enviar emails
  'https://www.googleapis.com/auth/gmail.settings.basic'  // Verificar vacation settings
];
```

## 🚀 Como Usar

### 1. Reautorizar o Gmail (IMPORTANTE)

Como adicionamos um novo escopo, você **DEVE reautorizar** o Gmail:

```bash
npm run gmail:auth
```

Ou execute manualmente:

```bash
node NOVO/scripts/email/autorizar-gmail.js
```

### 2. Verificar Configurações de Férias

```javascript
import { getVacationSettings } from './src/services/email-notifications/gmailService.js';

// Obter configurações de férias
const settings = await getVacationSettings('me');

console.log('Resposta automática ativa:', settings.enabled);
console.log('Assunto:', settings.subject);
console.log('Mensagem:', settings.message);
console.log('Período:', settings.startTime, 'até', settings.endTime);
```

### 3. Verificar se Está de Férias

```javascript
import { isOnVacation } from './src/services/email-notifications/gmailService.js';

// Verificar se o remetente está de férias
const onVacation = await isOnVacation('me');

if (onVacation) {
  console.log('⚠️ Remetente está de férias - considerar não enviar emails');
} else {
  console.log('✅ Remetente não está de férias - pode enviar emails normalmente');
}
```

### 4. Integrar no Sistema de Notificações

Você pode integrar a verificação de férias no sistema de envio de emails:

```javascript
import { sendEmail, isOnVacation } from './src/services/email-notifications/gmailService.js';

async function sendEmailWithVacationCheck(to, subject, htmlBody, textBody) {
  // Verificar se está de férias antes de enviar
  const onVacation = await isOnVacation('me');
  
  if (onVacation) {
    console.warn('⚠️ Remetente está de férias - email não será enviado');
    return {
      skipped: true,
      reason: 'Remetente está de férias'
    };
  }
  
  // Enviar email normalmente
  return await sendEmail(to, subject, htmlBody, textBody);
}
```

## 📡 Endpoint da API

### GET /api/gmail/vacation

Endpoint para verificar configurações de férias via API REST:

```bash
GET http://localhost:3000/api/gmail/vacation
Authorization: Bearer <token>
```

**Resposta:**

```json
{
  "success": true,
  "enabled": false,
  "subject": "",
  "message": "",
  "startTime": null,
  "endTime": null,
  "restrictToContacts": false,
  "restrictToDomain": false
}
```

## 🔍 Estrutura da Resposta

A API retorna um objeto com as seguintes propriedades:

- `enabled` (boolean): Se a resposta automática está ativa
- `subject` (string): Assunto da resposta automática
- `message` (string): Mensagem da resposta automática
- `startTime` (number|null): Timestamp de início (em milissegundos)
- `endTime` (number|null): Timestamp de fim (em milissegundos)
- `restrictToContacts` (boolean): Se restringe apenas a contatos
- `restrictToDomain` (boolean): Se restringe apenas ao domínio
- `raw` (object): Resposta completa da API do Gmail

## ⚠️ Observações Importantes

1. **Reautorização Obrigatória**: Após adicionar novos escopos, você DEVE reautorizar o Gmail
2. **Token Expira**: Se o token expirar, você precisará reautorizar novamente
3. **Permissões**: O usuário precisa autorizar os novos escopos no consentimento OAuth
4. **Erro 403**: Se receber erro 403, significa que o escopo não foi autorizado

## 🧪 Testando

### Teste Manual

```javascript
// No console Node.js ou script de teste
import { getVacationSettings, isOnVacation } from './src/services/email-notifications/gmailService.js';

// Testar obtenção de configurações
const settings = await getVacationSettings();
console.log('Configurações:', settings);

// Testar verificação de férias
const onVacation = await isOnVacation();
console.log('Está de férias?', onVacation);
```

## 📚 Referências

- [Gmail API - Vacation Settings](https://developers.google.com/gmail/api/reference/rest/v1/users.settings/getVacation)
- [Gmail API - OAuth Scopes](https://developers.google.com/gmail/api/auth/scopes)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

