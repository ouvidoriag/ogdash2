# 🛰️ CORA - Documentação Completa

**Central de Operações e Resposta Ágil**

---

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Funcionalidades](#funcionalidades)
4. [Integração com IA (Gemini)](#integração-com-ia-gemini)
5. [Contextos e Módulos](#contextos-e-módulos)
6. [API e Endpoints](#api-e-endpoints)
7. [Modelo de Dados](#modelo-de-dados)
8. [Interface do Usuário](#interface-do-usuário)
9. [Fluxo de Conversação](#fluxo-de-conversação)
10. [Fallback e Resiliência](#fallback-e-resiliência)
11. [Configuração e Variáveis](#configuração-e-variáveis)
12. [Troubleshooting](#troubleshooting)

---

## 📖 Visão Geral

### O que é a CORA?

A **CORA (Central de Operações e Resposta Ágil)** é uma assistente virtual inteligente especializada em análises de dados da Prefeitura de Duque de Caxias. Ela permite que gestores municipais façam perguntas em linguagem natural sobre os dados de Ouvidoria, Zeladoria e E-SIC, recebendo respostas precisas baseadas em informações reais do banco de dados.

### Características Principais

- ✅ **Linguagem Natural**: Entende perguntas em português, sem necessidade de termos técnicos
- ✅ **Dados em Tempo Real**: Acessa dados reais do MongoDB Atlas
- ✅ **Múltiplos Contextos**: Funciona em Ouvidoria, Zeladoria e Painel Central
- ✅ **IA Avançada**: Integração com Google Gemini AI para respostas inteligentes
- ✅ **Fallback Inteligente**: Sistema de backup quando a IA não está disponível
- ✅ **Histórico Persistente**: Todas as conversas são salvas no banco de dados
- ✅ **Análises Estatísticas**: Realiza cálculos matemáticos, percentuais, médias e rankings
- ✅ **Personalidade Humana**: Respostas naturais, empáticas e variadas
- ✅ **Reconhecimento Emocional**: Detecta urgência, preocupação, gratidão e adapta respostas
- ✅ **Memória e Aprendizado**: Aprende preferências do usuário ao longo do tempo
- ✅ **Proatividade**: Faz perguntas de follow-up e sugere análises complementares

### Objetivo

Facilitar o acesso a informações estratégicas do sistema de gestão municipal, permitindo que gestores obtenham insights rapidamente através de conversas naturais, sem precisar navegar por múltiplas telas ou entender a estrutura técnica do banco de dados.

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  cora-chat.js (Interface Unificada)                  │  │
│  │  - Detecta contexto automaticamente                  │  │
│  │  - Renderiza mensagens                               │  │
│  │  - Gerencia formulário de envio                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  chatController.js                                    │  │
│  │  - Recebe mensagens do usuário                       │  │
│  │  - Busca dados relevantes do MongoDB                 │  │
│  │  - Formata dados para IA                            │  │
│  │  - Chama Gemini API                                  │  │
│  │  - Implementa fallback inteligente                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                           │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  chat_messages  │  │  records         │                  │
│  │  (MongoDB)      │  │  zeladoria       │                  │
│  │                 │  │  esic            │                  │
│  └──────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL API                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Google Gemini API                                    │  │
│  │  - Gera respostas inteligentes                       │  │
│  │  - Rotação de chaves API                             │  │
│  │  - Tratamento de quota/rate limit                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Usuário envia mensagem** → Frontend (`cora-chat.js`)
2. **Frontend faz POST** → `/api/chat/messages` (Backend)
3. **Backend salva mensagem** → MongoDB (`chat_messages`)
4. **Backend busca dados relevantes** → MongoDB (`records`, `zeladoria`, `esic`)
5. **Backend formata dados** → Prepara contexto para IA
6. **Backend chama Gemini API** → Gera resposta inteligente
7. **Backend salva resposta** → MongoDB (`chat_messages`)
8. **Backend retorna resposta** → Frontend
9. **Frontend renderiza** → Interface do usuário

---

## ⚙️ Funcionalidades

### 1. Análise de Dados em Linguagem Natural

A CORA entende perguntas como:
- "Quantas reclamações sobre saúde tivemos em janeiro?"
- "Qual o bairro com mais ocorrências de zeladoria?"
- "Mostre os top 5 temas da ouvidoria"
- "Qual a média de tempo de atendimento?"

### 2. Cálculos Matemáticos

A CORA realiza automaticamente:
- **Somas**: Total de manifestações, ocorrências, etc.
- **Médias**: Tempo médio de atendimento, média por mês, etc.
- **Percentuais**: Distribuição percentual, crescimento, etc.
- **Rankings**: Top 10 secretarias, bairros, temas, etc.

### 3. Análises Contextuais

A CORA adapta suas respostas baseado no contexto:
- **Ouvidoria**: Foca em manifestações, secretarias, temas, assuntos
- **Zeladoria**: Foca em categorias, departamentos, bairros, canais
- **Central**: Visão consolidada de todos os sistemas

### 4. Formatação Inteligente

As respostas são formatadas com:
- **Markdown**: Negrito, listas, tabelas
- **Emojis**: Ícones contextuais (📊, 🏥, 📈, etc.)
- **Números formatados**: Separadores de milhar (10.339)
- **Hierarquia visual**: Títulos, subtítulos, seções

### 5. Histórico de Conversas

- Todas as mensagens são salvas no banco
- Histórico carregado automaticamente ao abrir o chat
- Persistência entre sessões
- Limite configurável (padrão: 500 mensagens)

---

## 🤖 Integração com IA (Gemini)

### Sistema de Rotação de Chaves

A CORA implementa um sistema robusto de rotação de chaves API para o Gemini:

```javascript
// Múltiplas chaves API configuradas
GEMINI_API_KEY_1=...
GEMINI_API_KEY_2=...
GEMINI_API_KEY_3=...
```

**Comportamento:**
- Tenta a primeira chave disponível
- Se der erro 429 (rate limit), rotaciona para próxima chave
- Se quota excedida, usa fallback imediatamente
- Máximo de 3 tentativas (ou número de chaves disponíveis)

### Prompt System

A CORA usa um prompt system instruction detalhado:

```
Você é a Cora, especialista em análises de [ouvidoria/zeladoria] da Prefeitura de Duque de Caxias.

IMPORTANTE: Você receberá dados reais do banco de dados em tempo real. USE ESSES DADOS para responder.
NÃO invente números ou informações. Use APENAS os dados fornecidos.

FORMATAÇÃO DAS RESPOSTAS:
- Use formatação Markdown para melhorar a legibilidade
- Use **negrito** para destacar números importantes e títulos
- Use listas numeradas ou com bullets para organizar informações
- Quando apresentar rankings ou listas, use formatação clara e hierárquica
- Adicione emojis relevantes quando apropriado (📊, 🏥, 📈, etc.)
- Use tabelas quando apresentar dados comparativos
- Sempre inclua o total e percentuais quando relevante
- Organize as informações de forma lógica e fácil de ler

INSTRUÇÕES:
1. SEMPRE use os dados reais fornecidos na seção "DADOS REAIS DO BANCO DE DADOS"
2. Cite números exatos dos dados fornecidos, formatados com separadores de milhar (ex: 10.339)
3. FAÇA CÁLCULOS MATEMÁTICOS quando necessário: somas, subtrações, médias, percentuais, etc.
4. Quando apresentar listas/rankings, organize de forma clara e hierárquica
5. Responda de forma direta e objetiva, citando os números exatos dos dados
6. Seja profissional mas amigável, sempre se referindo ao usuário como "Gestor Municipal"
7. NÃO diga "preciso acessar os dados" ou "não posso fazer cálculos" - você JÁ TEM os dados e PODE fazer qualquer cálculo necessário
8. Quando o Gestor Municipal pedir cálculos, percentuais, somas, médias, etc., FAÇA os cálculos usando os dados fornecidos
9. Você tem total liberdade para realizar operações matemáticas, análises estatísticas e qualquer tipo de cálculo solicitado
10. Sempre apresente os dados de forma visualmente atraente e organizada
11. Quando apresentar rankings, inclua o número de posição e destaque os valores principais
```

### Payload da API Gemini

```javascript
{
  system_instruction: {
    parts: [{ text: systemPrompt }]
  },
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
  ],
  generationConfig: {
    temperature: 0.7
  },
  contents: [
    { 
      role: 'user', 
      parts: [{ 
        text: `[DADOS FORMATADOS]\n\nPERGUNTA DO GESTOR MUNICIPAL: ${text}\n\nINSTRUÇÕES PARA RESPOSTA:...` 
      }] 
    }
  ]
}
```

---

## 🎯 Contextos e Módulos

### Contexto: Ouvidoria

**Detecção:** Página `page-cora-chat` ou contexto não especificado

**Dados Disponíveis:**
- Manifestações (records)
- Secretarias/Órgãos
- Temas
- Assuntos
- Tipos de manifestação (reclamação, elogio, denúncia, sugestão)
- Status
- Tempos médios

**Mensagem Inicial:**
```
Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de ouvidoria. Como posso ajudar você hoje?
```

### Contexto: Zeladoria

**Detecção:** Página `page-zeladoria-cora-chat` ou contexto `zeladoria`

**Dados Disponíveis:**
- Ocorrências (zeladoria)
- Categorias
- Departamentos
- Bairros
- Canais
- Status

**Mensagem Inicial:**
```
Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de zeladoria. Como posso ajudar você hoje?
```

### Contexto: Central

**Detecção:** Página `page-central-cora` ou contexto `central`

**Dados Disponíveis:**
- Todos os dados de Ouvidoria
- Todos os dados de Zeladoria
- Dados de E-SIC
- Visão consolidada

**Mensagem Inicial:**
```
Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual. Posso ajudar com análises de Ouvidoria, Zeladoria e e-SIC. Como posso ajudar você hoje?
```

### Detecção Automática de Contexto

O sistema detecta automaticamente o contexto baseado em:
1. ID da página ativa (`page-cora-chat`, `page-zeladoria-cora-chat`, `page-central-cora`)
2. Parâmetro `context` enviado na requisição
3. Fallback para `ouvidoria` se não detectado

---

## 🔌 API e Endpoints

### GET `/api/chat/messages`

**Descrição:** Lista mensagens do chat

**Query Parameters:**
- `limit` (opcional): Número máximo de mensagens (padrão: 100)
- `context` (opcional): Contexto da conversa (ouvidoria, zeladoria, esic, central)
- `suggestions` (opcional): Incluir sugestões de perguntas (true/false)

**Resposta:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "text": "Quantas reclamações tivemos em janeiro?",
    "sender": "user",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "text": "Em janeiro, tivemos **1.234 reclamações**...",
    "sender": "cora",
    "createdAt": "2025-01-15T10:30:05.000Z"
  }
]
```

### POST `/api/chat/messages`

**Descrição:** Cria nova mensagem e obtém resposta da CORA

**Body:**
```json
{
  "text": "Quantas reclamações tivemos em janeiro?",
  "sender": "user",
  "context": "ouvidoria"
}
```

**Parâmetros:**
- `text` (obrigatório): Texto da mensagem
- `sender` (opcional): `"user"` ou `"cora"` (padrão: `"user"`)
- `context` (opcional): `"ouvidoria"`, `"zeladoria"` ou `"central"` (padrão: `"ouvidoria"`)

**Resposta:**
```json
{
  "message": {
    "id": "507f1f77bcf86cd799439011",
    "text": "Quantas reclamações tivemos em janeiro?",
    "sender": "user",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "response": "Em janeiro, tivemos **1.234 reclamações**..."
}
```

**Códigos de Status:**
- `200`: Sucesso
- `400`: Texto da mensagem é obrigatório
- `401`: Sessão expirada (requer login)
- `500`: Erro interno do servidor

### GET `/api/chat/export`

**Descrição:** Exportar conversas do usuário

**Query Parameters:**
- `context` (opcional): Contexto específico para exportar (ouvidoria, zeladoria, esic, central)
- `format` (opcional): Formato de exportação (json, csv, txt) - padrão: json

**Resposta:**
- **JSON**: Objeto com todas as mensagens
- **CSV**: Arquivo CSV com colunas: Data, Hora, Remetente, Mensagem
- **TXT**: Arquivo de texto formatado

**Códigos de Status:**
- `200`: Sucesso
- `401`: Sessão expirada (requer login)
- `500`: Erro interno do servidor

---

## 💾 Modelo de Dados

### Collection: `chat_messages`

**Schema (Mongoose):**

```javascript
{
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'cora']
  },
  createdAt: Date,  // Timestamp automático
  updatedAt: Date   // Timestamp automático
}
```

**Índices:**
- `createdAt: -1` (para queries ordenadas)

**Métodos Estáticos:**
- `ChatMessage.findBySender(sender)`: Busca mensagens por remetente
- `ChatMessage.findRecent(limit)`: Busca mensagens recentes

**Métodos de Instância:**
- `message.toAPIFormat()`: Formata para resposta da API

### Estrutura de Dados Buscados

#### Para Contexto Ouvidoria:

```javascript
{
  estatisticasGerais: {
    total: 12345,
    porStatus: [
      { status: "Concluído", count: 8000 },
      { status: "Em Andamento", count: 3000 },
      ...
    ]
  },
  topOrgaos: [
    { orgaos: "Secretaria de Saúde", _count: { _all: 1500 } },
    ...
  ],
  topTemas: [
    { tema: "Saúde", _count: { _all: 2000 } },
    ...
  ],
  topAssuntos: [...],
  topTiposManifestacao: [...]
}
```

#### Para Contexto Zeladoria:

```javascript
{
  estatisticasGerais: {
    total: 5678,
    porStatus: [...]
  },
  topCategorias: [
    { categoria: "Limpeza Urbana", _count: { _all: 1200 } },
    ...
  ],
  topDepartamentos: [...],
  topBairros: [...],
  topCanais: [...]
}
```

---

## 🎨 Interface do Usuário

### Componentes Principais

#### 1. Container de Mensagens

```html
<div id="chatMessages" class="space-y-4 max-h-96 overflow-y-auto">
  <!-- Mensagens renderizadas aqui -->
</div>
```

#### 2. Formulário de Envio

```html
<form id="chatForm">
  <input 
    type="text" 
    id="chatInput" 
    placeholder="Digite sua pergunta..."
  />
  <button type="button" id="chatSubmitBtn">
    Enviar
  </button>
</form>
```

#### 3. Renderização de Mensagens

**Mensagem do Usuário:**
- Alinhada à direita
- Fundo: `bg-cyan-500/20`
- Avatar: "Você"

**Mensagem da CORA:**
- Alinhada à esquerda
- Fundo: `bg-slate-800/60`
- Avatar: "C" (gradiente roxo/rosa)
- Título: "Cora" (texto roxo)

### Estilos e Cores

- **Cora Avatar**: Gradiente `from-purple-500 to-pink-500`
- **Cora Texto**: `text-purple-300`
- **Usuário Avatar**: `bg-slate-700`
- **Timestamps**: `text-slate-500`, tamanho `text-xs`

### Formatação de Tempo

- `< 1 minuto`: "Agora"
- `< 60 minutos`: "Xmin atrás"
- `< 24 horas`: "Xh atrás"
- `>= 24 horas`: "DD/MM HH:mm"

---

## 🔄 Fluxo de Conversação

### 1. Inicialização

```javascript
loadCoraChat() → detectChatConfig() → loadChatMessages() → renderMessages() → initChat()
```

### 2. Envio de Mensagem

```javascript
sendMessage(text) → 
  Adiciona mensagem do usuário → 
  Renderiza → 
  POST /api/chat/messages → 
  Recebe resposta → 
  Adiciona resposta da CORA → 
  Renderiza → 
  Salva resposta no banco
```

### 3. Tratamento de Erros

- **Erro 401**: Mostra mensagem de sessão expirada
- **Erro de rede**: Mostra mensagem genérica de erro
- **Erro ao salvar**: Loga warning, mas não interrompe o fluxo

### 4. Prevenção de Submit Duplo

- Formulário com `onsubmit="return false;"`
- Botão com `type="button"`
- Event listeners com `preventDefault()` e `stopPropagation()`
- Handlers armazenados para possível remoção

---

## 🛡️ Fallback e Resiliência

### Sistema de Fallback Inteligente

Quando a API Gemini não está disponível (quota excedida, rate limit, erro de rede), a CORA usa um sistema de fallback que:

1. **Busca dados reais do banco** (sempre)
2. **Formata dados de forma inteligente**
3. **Cria resposta baseada nos dados**

### Tipos de Fallback

#### 1. Fallback com Dados Formatados

Se dados foram buscados e formatados:
```
📊 **Análise baseada nos dados da ouvidoria:**

[DADOS FORMATADOS]

💡 *Nota: Resposta gerada com base nos dados reais do banco de dados.*
```

#### 2. Fallback para Saudação

Se pergunta é uma saudação:
```
Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de ouvidoria. Como posso ajudar você hoje?

💡 *Nota: No momento, estou usando respostas baseadas em dados diretos do banco. Para análises mais avançadas, a integração com IA será restaurada em breve.*
```

#### 3. Fallback para Perguntas sobre Dados

Se pergunta menciona dados/estatísticas:
```
📊 **Dados da Ouvidoria:**

[DADOS FORMATADOS]

💡 *Resposta baseada em dados reais do banco.*
```

#### 4. Fallback Genérico

Se não se encaixa em nenhum padrão:
```
Certo! Tenho acesso aos dados da ouvidoria. Me diga o recorte específico (órgão/tema/assunto/período) e retorno os principais achados baseados nos dados reais.

💡 *No momento, estou usando dados diretos do banco. Para análises mais avançadas, a integração com IA será restaurada em breve.*
```

### Tratamento de Quota/Rate Limit

```javascript
if (resp.status === 429) {
  // Rate limit temporário
  if (numChaves > 1) {
    rotateToNextKey();  // Tenta próxima chave
    await delay(2000); // Aguarda 2 segundos
  } else {
    usarFallback();     // Usa fallback se só tem 1 chave
  }
}

if (errorText.includes('quota')) {
  // Quota excedida - usar fallback imediatamente
  usarFallback();
}
```

---

## ⚙️ Configuração e Variáveis

### Variáveis de Ambiente

```env
# Gemini AI
GEMINI_API_KEY=chave_api_1
GEMINI_API_KEY_2=chave_api_2  # Opcional
GEMINI_API_KEY_3=chave_api_3  # Opcional

# MongoDB (já configurado)
MONGODB_ATLAS_URL=mongodb+srv://...
```

### Configuração do Frontend

**Arquivo:** `NOVO/public/scripts/core/config.js`

```javascript
API_ENDPOINTS = {
  CHAT_MESSAGES: '/api/chat/messages'
}
```

### Configuração do Backend

**Arquivo:** `NOVO/src/utils/geminiHelper.js`

- Gerencia rotação de chaves
- Tratamento de erros
- Reset de chaves

---

## 🔧 Troubleshooting

### Problema: Chat não carrega mensagens

**Sintomas:**
- Container de mensagens vazio
- Erro no console: "Container de mensagens não encontrado"

**Soluções:**
1. Verificar se a página HTML tem o elemento `chatMessages`
2. Verificar se `loadCoraChat()` está sendo chamado
3. Verificar logs do backend para erros de banco

### Problema: Mensagens não são enviadas

**Sintomas:**
- Botão "Enviar" não funciona
- Formulário faz submit da página

**Soluções:**
1. Verificar se `initChat()` foi chamado
2. Verificar se event listeners estão corretos
3. Verificar se formulário tem `onsubmit="return false;"`

### Problema: CORA não responde (sempre fallback)

**Sintomas:**
- Todas as respostas são do tipo fallback
- Logs mostram "Usando FALLBACK INTELIGENTE"

**Soluções:**
1. Verificar se `GEMINI_API_KEY` está configurada
2. Verificar se chave API é válida
3. Verificar quota da API Gemini
4. Verificar logs do backend para erros específicos

### Problema: Respostas incorretas ou inventadas

**Sintomas:**
- CORA inventa números que não existem
- Respostas não correspondem aos dados reais

**Soluções:**
1. Verificar se `fetchRelevantData()` está buscando dados corretos
2. Verificar se dados estão sendo formatados corretamente
3. Verificar se prompt system está sendo enviado corretamente
4. Considerar ajustar o prompt para ser mais restritivo

### Problema: Contexto errado detectado

**Sintomas:**
- CORA responde sobre zeladoria quando está em ouvidoria
- Dados buscados são do contexto errado

**Soluções:**
1. Verificar se `detectChatConfig()` está detectando corretamente
2. Verificar se parâmetro `context` está sendo enviado na requisição
3. Verificar IDs das páginas HTML

### Problema: Performance lenta

**Sintomas:**
- Respostas demoram muito (> 10 segundos)
- Interface trava ao enviar mensagem

**Soluções:**
1. Verificar se queries MongoDB estão otimizadas (índices)
2. Verificar se há muitas mensagens sendo carregadas (reduzir `limit`)
3. Verificar timeout da API Gemini
4. Considerar implementar cache para dados frequentes

---

## 📚 Arquivos Principais

### Frontend

- `NOVO/public/scripts/pages/ouvidoria/cora-chat.js` - Interface unificada do chat
- `NOVO/public/scripts/pages/central/central-dashboard.js` - Integração no Painel Central
- `NOVO/public/index.html` - Páginas HTML do chat

### Backend

- `NOVO/src/api/controllers/chatController.js` - Controller principal
- `NOVO/src/api/routes/chat.js` - Rotas da API
- `NOVO/src/models/ChatMessage.model.js` - Modelo Mongoose
- `NOVO/src/utils/geminiHelper.js` - Helper para Gemini API
- `NOVO/src/utils/coraCache.js` - Sistema de cache de respostas
- `NOVO/src/utils/coraSuggestions.js` - Sistema de sugestões de perguntas
- `NOVO/src/utils/coraInsights.js` - Sistema de insights automáticos
- `NOVO/src/utils/coraPersonality.js` - Sistema de personalidade e humanização
- `NOVO/src/utils/coraMemory.js` - Sistema de memória e aprendizado do usuário
- `NOVO/src/utils/nlpHelper.js` - Helper de processamento de linguagem natural

### Configuração

- `NOVO/public/scripts/core/config.js` - Configurações globais
- `.env` - Variáveis de ambiente

---

## 🚀 Melhorias Implementadas (Dezembro 2025)

### ✅ Implementadas

- [x] **Cache de respostas frequentes** - Sistema inteligente de cache baseado em similaridade de perguntas
- [x] **Sugestões de perguntas** - Sugestões contextuais baseadas em dados reais do sistema
- [x] **Análises comparativas melhoradas** - Comparações período a período com dados reais
- [x] **Sistema de insights automáticos** - Detecção automática de padrões, anomalias e tendências
- [x] **Exportação de conversas** - Exportação em JSON, CSV ou TXT
- [x] **Otimização de prompt system** - Prompts mais eficientes e contextualizados
- [x] **Sistema de Personalidade e Humanização** - CORA agora é mais humana, empática e natural
  - Variações de linguagem para evitar repetição
  - Reconhecimento emocional (urgência, preocupação, gratidão)
  - Respostas empáticas baseadas no tom do usuário
  - Referências a conversas anteriores
  - Perguntas de follow-up proativas
  - Celebração de sucessos e reconhecimento de preocupações
- [x] **Sistema de Memória e Aprendizado** - CORA aprende preferências do usuário
  - Análise de padrões de uso
  - Adaptação de respostas ao estilo do usuário
  - Sugestões personalizadas baseadas no histórico
  - Preferências de detalhamento e formato

### Planejadas

- [ ] Suporte a anexos/imagens
- [ ] Busca no histórico (implementação parcial)
- [ ] Integração com mais fontes de dados
- [ ] Análises preditivas
- [ ] Alertas automáticos baseados em padrões

### Em Consideração

- [ ] Suporte a múltiplos idiomas
- [ ] Voice input/output
- [ ] Integração com outros sistemas municipais
- [ ] Dashboard de métricas da CORA (uso, perguntas mais frequentes, etc.)

---

## 📝 Notas Técnicas

### Segurança

- Mensagens são salvas no banco sem sanitização adicional (Mongoose já faz validação)
- API requer autenticação (sessão) para POST
- Chaves API Gemini nunca são expostas ao frontend

### Performance

- Queries MongoDB usam índices (`createdAt: -1`)
- Limite padrão de 500 mensagens para evitar carregamento excessivo
- Dados são buscados sob demanda (não pré-carregados)

### Escalabilidade

- Sistema suporta múltiplas chaves API (rotação)
- Fallback garante disponibilidade mesmo sem IA
- Arquitetura modular permite fácil extensão

---

## 📞 Suporte

Para problemas ou dúvidas sobre a CORA:

1. Consulte esta documentação
2. Verifique os logs do backend (`NOVO/logs/`)
3. Revise o código fonte nos arquivos listados acima
4. Consulte a documentação do Google Gemini API

---

**CÉREBRO X-3**  
**Sistema CORA - Prefeitura de Duque de Caxias**  
**Última atualização: Dezembro 2025**


