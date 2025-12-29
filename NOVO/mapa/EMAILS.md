# 📧 EMAILS - Sistema de Notificações

**Localização:** `NOVO/src/services/email-notifications/`  
**Data:** 12/12/2025  
**CÉREBRO X-3**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Tipos de Notificações](#tipos-de-notificações)
4. [Configuração](#configuração)
5. [Templates](#templates)
6. [Automação](#automação)
7. [API](#api)

---

## 🎯 VISÃO GERAL

Sistema automatizado para envio de emails corporativos para secretarias sobre prazos de vencimento de demandas. Utiliza Gmail API com OAuth 2.0 para envio seguro e profissional.

**Stack:**
- **Gmail API:** Envio de emails
- **OAuth 2.0:** Autenticação
- **Node Cron:** Agendamento automático
- **Mongoose:** Armazenamento de histórico

---

## 🏗️ ARQUITETURA

```
src/services/email-notifications/
├── gmailService.js         # Integração com Gmail API
├── emailConfig.js          # Configuração e templates
├── notificationService.js  # Lógica de notificações
├── scheduler.js            # Agendamento automático
└── README.md              # Documentação
```

### Componentes Principais

1. **gmailService.js**
   - Autenticação OAuth 2.0
   - Envio de emails via Gmail API
   - Renovação automática de tokens
   - Retry automático para erros temporários
   - Tratamento de erros de autenticação

2. **emailConfig.js**
   - Mapeamento de secretarias para emails
   - Templates HTML e texto
   - Configurações de remetente
   - Funções auxiliares de formatação

3. **notificationService.js**
   - Identificação de protocolos vencendo
   - Agrupamento por secretaria
   - Verificação de duplicidade
   - Registro de envios
   - Lógica de prazos

4. **scheduler.js**
   - Agendamento diário (8h)
   - Execução manual
   - Status do scheduler

---

## 📨 TIPOS DE NOTIFICAÇÕES

### 1. **15 Dias Antes do Vencimento** (Alerta Preventivo)
- **Template:** `getTemplate15Dias()`
- **Assunto:** `[15 DIAS] Ouvidoria Geral - X Protocolo(s) Vencendo em 15 Dias`
- **Cor:** Verde (#28a745)
- **Conteúdo:**
  - Lista de protocolos vencendo em 15 dias
  - Total de manifestações não respondidas
  - Tabela com protocolos, datas e prazos

### 2. **No Dia do Vencimento** (Alerta Crítico)
- **Template:** `getTemplateVencimento()`
- **Assunto:** `[VENCIDO HOJE] 🚨 URGENTE - X Manifestação(ões) Vencida(s) Hoje`
- **Cor:** Amarelo/Laranja (#ffc107)
- **Conteúdo:**
  - Lista de protocolos vencidos hoje
  - Alerta de urgência
  - Tabela com protocolos vencidos

### 3. **30 Dias Após Vencimento** (Alerta de Atraso)
- **Template:** `getTemplate30Dias()`
- **Assunto:** `[30 DIAS VENCIDO] ⚠️ ATENÇÃO - X Manifestação(ões) em Atraso`
- **Cor:** Amarelo (#ff9800)
- **Conteúdo:**
  - Lista de protocolos vencidos há 30+ dias
  - Solicitação de priorização
  - Previsão de conclusão

### 4. **60 Dias Após Vencimento** (Alerta de Extrapolação)
- **Template:** `getTemplate60Dias()`
- **Assunto:** `[60+ DIAS VENCIDO] ⚠️ ATENÇÃO - X Manifestação(ões) Extrapolada(s)`
- **Cor:** Vermelho (#721c24)
- **Conteúdo:**
  - Lista de protocolos extrapolados
  - Informação sobre responsabilidade
  - Tabela com dias vencidos

### 5. **Consolidação Geral** (30+ dias)
- **Template:** `getTemplateConsolidacaoGeral()`
- **Assunto:** `Consolidação de Manifestações em Atraso – Prazos Vencidos a partir do dia 30`
- **Cor:** Azul (#2196f3)
- **Conteúdo:**
  - Lista consolidada de protocolos vencidos
  - Organização por secretaria
  - Resumo geral

### 6. **Resumo Diário para Ouvidoria Geral**
- **Template:** `getTemplateResumoOuvidoriaGeral()`
- **Assunto:** `[RESUMO DIÁRIO] 📊 X Manifestação(ões) Vencida(s) Hoje`
- **Cor:** Vermelho (#dc3545)
- **Conteúdo:**
  - Resumo de todas as manifestações vencidas hoje
  - Organização por secretaria
  - Totais e estatísticas

---

## ⚙️ CONFIGURAÇÃO

### Variáveis de Ambiente

```env
EMAIL_REMETENTE=ouvidoria@duquedecaxias.rj.gov.br
NOME_REMETENTE=Ouvidoria Geral de Duque de Caxias
EMAIL_PADRAO_SECRETARIAS=ouvidoria@duquedecaxias.rj.gov.br
EMAIL_OUVIDORIA_GERAL=ouvgeral.gestao@gmail.com,ouvidoria020@gmail.com,dfreitas001.adm@gmail.com
```

### Credenciais Gmail

**Localização:** `NOVO/config/gmail-credentials.json`

**Tipo:** OAuth 2.0 Client ID

**Scopes:**
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.settings.basic`

### Token OAuth

**Localização:** `NOVO/config/gmail-token.json`

**Renovação:** Automática via refresh token

---

## 📝 TEMPLATES

### Estrutura dos Templates

Todos os templates retornam um objeto com:
- `subject`: Assunto do email
- `html`: Corpo HTML do email (CSS inline)
- `text`: Versão texto plano

### Características dos Templates

- **CSS Inline:** Compatibilidade com clientes de email
- **Responsivo:** Layout adaptável
- **Acessível:** Estrutura semântica
- **CTA:** Links para sistema de Ouvidoria
- **Tabelas:** Protocolos organizados em tabelas
- **Cores Semânticas:** Verde (preventivo), Amarelo (crítico), Vermelho (extrapolado)

### Mapeamento de Secretarias

**Fonte:** `emailConfig.js`

- Mapeamento estático em `SECRETARIAS_EMAILS`
- Busca no banco via `SecretariaInfo` model
- Fallback para email padrão

**Estratégia de Busca:**
1. Busca exata no banco
2. Busca parcial (contains)
3. Mapeamento estático
4. Email padrão

---

## 🤖 AUTOMAÇÃO

### Scheduler Automático

**Arquivo:** `scheduler.js`

**Agendamento:**
- **Horário:** Diariamente às 8h (horário de Brasília)
- **Timezone:** `America/Sao_Paulo`
- **Cron:** `0 8 * * *`

**Execução:**
1. Identifica protocolos vencendo (15 dias, hoje, 30 dias, 60 dias)
2. Agrupa por secretaria
3. Verifica duplicidade
4. Envia emails
5. Registra histórico

### Cron de Vencimentos

**Arquivo:** `NOVO/src/cron/vencimentos.cron.js`

**Função:** Execução adicional de verificações de vencimento

---

## 🔌 API

### Endpoints de Notificações

**Rota Base:** `/api/notifications`

#### Autenticação
- `GET /api/notifications/auth/url` - Obter URL de autenticação
- `POST /api/notifications/auth/callback` - Callback de autenticação
- `GET /api/notifications/auth/status` - Status de autenticação

#### Execução
- `POST /api/notifications/execute` - Executar notificações manualmente
- `POST /api/notifications/scheduler/execute` - Executar scheduler manualmente

#### Consulta
- `GET /api/notifications/history` - Histórico de notificações
- `GET /api/notifications/stats` - Estatísticas de notificações
- `GET /api/notifications/config` - Configuração de emails
- `GET /api/notifications/scheduler/status` - Status do scheduler

#### Teste
- `GET /api/notifications/test` - Teste de envio de email

### Endpoints Alternativos (Notificacoes)

**Rota Base:** `/api/notificacoes`

- `GET /api/notificacoes` - Listar notificações com filtros
- `GET /api/notificacoes/meses-disponiveis` - Meses únicos
- `GET /api/notificacoes/stats` - Estatísticas
- `GET /api/notificacoes/ultima-execucao` - Última execução
- `GET /api/notificacoes/vencimentos` - Buscar vencimentos
- `POST /api/notificacoes/enviar-selecionados` - Enviar selecionados
- `POST /api/notificacoes/enviar-extra` - Enviar email extra

---

## 📊 MODELO DE DADOS

### NotificacaoEmail Model

**Collection:** `notificacoesemails`

**Schema:**
- `protocolo`: String (índice)
- `secretaria`: String
- `emailSecretaria`: String
- `tipoNotificacao`: String (15_dias, vencimento, 30_dias, 60_dias, consolidacao, resumo)
- `dataVencimento`: Date
- `status`: String (enviado, erro)
- `messageId`: String (Gmail message ID)
- `threadId`: String (Gmail thread ID)
- `erro`: String (se houver erro)
- `enviadoEm`: Date
- `createdAt`: Date
- `updatedAt`: Date

**Índices:**
- `protocolo`
- `tipoNotificacao`
- `status`
- `enviadoEm`

---

## 🔐 SEGURANÇA

### Autenticação OAuth 2.0

- **Renovação Automática:** Refresh token renovado automaticamente
- **Expiração:** Access token renovado antes de expirar
- **Segurança:** Tokens armazenados localmente (não commitados)

### Validação de Emails

- **Verificação de Duplicidade:** Evita reenvio do mesmo tipo
- **Validação de Destinatários:** Verifica emails válidos
- **Fallback:** Email padrão para secretarias sem email

---

## 📈 MONITORAMENTO

### Logs

- **Console:** Logs estruturados de envio
- **Banco:** Histórico completo em `NotificacaoEmail`
- **Erros:** Registro de erros com detalhes

### Métricas

- Total de emails enviados
- Total de erros
- Distribuição por tipo
- Taxa de sucesso

---

## ✅ CHECKUP DO SISTEMA DE EMAILS

### ✅ Autenticação
- [x] OAuth 2.0 configurado
- [x] Renovação automática funcionando
- [x] Tokens seguros

### ✅ Templates
- [x] Todos os 6 templates implementados
- [x] HTML e texto plano funcionando
- [x] CSS inline aplicado

### ✅ Envio
- [x] Gmail API funcionando
- [x] Retry automático funcionando
- [x] Tratamento de erros funcionando

### ✅ Automação
- [x] Scheduler funcionando (8h diário)
- [x] Cron de vencimentos funcionando
- [x] Execução manual disponível

### ✅ API
- [x] Todos os endpoints funcionando
- [x] Histórico registrado
- [x] Estatísticas disponíveis

---

**Última Atualização:** 12/12/2025

