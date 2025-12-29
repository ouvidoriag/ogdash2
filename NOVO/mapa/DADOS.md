# 💾 DADOS - Modelos e Estrutura

**Localização:** `NOVO/src/models/`  
**Data:** 12/12/2025  
**CÉREBRO X-3**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Modelos Mongoose](#modelos-mongoose)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Normalização](#normalização)
5. [Índices](#índices)

---

## 🎯 VISÃO GERAL

O sistema utiliza **MongoDB Atlas** como banco de dados principal, com **Mongoose** como ODM (Object Document Mapper). Todos os modelos seguem padrões de normalização e indexação para otimização de performance.

**Migração:** Sistema migrado de Prisma para Mongoose (completo)

---

## 📦 MODELOS MONGOOSE

### 1. **Record** - Manifestações de Ouvidoria

**Collection:** `records`  
**Arquivo:** `Record.model.js`

**Campos Principais:**
- `protocolo`: String (único, indexado)
- `dataCriacaoIso`: Date (indexado)
- `dataConclusaoIso`: Date
- `statusDemanda`: String (indexado)
- `tipoDeManifestacao`: String (indexado)
- `tema`: String (indexado)
- `temaLowercase`: String (indexado)
- `assunto`: String (indexado)
- `assuntoLowercase`: String (indexado)
- `categoria`: String
- `secretaria`: String (indexado)
- `bairro`: String
- `orgaos`: String
- `canal`: String
- `prioridade`: String (indexado)
- `tempoDeResolucaoEmDias`: Number
- `data`: Mixed (JSON completo)

**Índices:**
- `protocolo` (único)
- `dataCriacaoIso`
- `statusDemanda`
- `tipoDeManifestacao`
- `tema`
- `temaLowercase`
- `assunto`
- `assuntoLowercase`
- `secretaria`
- `prioridade`

---

### 2. **Zeladoria** - Demandas de Zeladoria

**Collection:** `zeladorias`  
**Arquivo:** `Zeladoria.model.js`

**Campos Principais:**
- `protocolo`: String (único, indexado)
- `statusDemanda`: String (indexado)
- `categoria`: String
- `departamento`: String
- `bairro`: String
- `responsavel`: String
- `canal`: String
- `dataCriacaoIso`: Date (indexado)
- `dataConclusaoIso`: Date
- `tempoDeResolucaoEmDias`: Number

**Índices:**
- `protocolo` (único)
- `statusDemanda`
- `dataCriacaoIso`

---

### 3. **Esic** - Pedidos E-SIC

**Collection:** `esics`  
**Arquivo:** `Esic.model.js`

**Campos Principais:**
- `protocolo`: String (único, indexado)
- `statusDemanda`: String (indexado)
- `tipoInformacao`: String
- `responsavel`: String
- `unidade`: String
- `canal`: String
- `dataCriacaoIso`: Date (indexado)
- `dataConclusaoIso`: Date
- `tempoDeResolucaoEmDias`: Number

**Índices:**
- `protocolo` (único)
- `statusDemanda`
- `dataCriacaoIso`

---

### 4. **User** - Usuários do Sistema

**Collection:** `users`  
**Arquivo:** `User.model.js`

**Campos Principais:**
- `email`: String (único, indexado)
- `senha`: String (hash)
- `nome`: String
- `role`: String
- `createdAt`: Date
- `updatedAt`: Date

**Índices:**
- `email` (único)

---

### 5. **ChatMessage** - Mensagens de Chat

**Collection:** `chatmessages`  
**Arquivo:** `ChatMessage.model.js`

**Campos Principais:**
- `mensagem`: String
- `resposta`: String
- `contexto`: Mixed (JSON)
- `timestamp`: Date (indexado)
- `usuario`: String

**Índices:**
- `timestamp`

---

### 6. **NotificacaoEmail** - Notificações por Email

**Collection:** `notificacoesemails`  
**Arquivo:** `NotificacaoEmail.model.js`

**Campos Principais:**
- `protocolo`: String (indexado)
- `secretaria`: String
- `emailSecretaria`: String
- `tipoNotificacao`: String (indexado)
- `dataVencimento`: Date
- `status`: String (indexado)
- `messageId`: String
- `threadId`: String
- `erro`: String
- `enviadoEm`: Date (indexado)
- `createdAt`: Date
- `updatedAt`: Date

**Índices:**
- `protocolo`
- `tipoNotificacao`
- `status`
- `enviadoEm`

---

### 7. **SecretariaInfo** - Informações de Secretarias

**Collection:** `secretariainfos`  
**Arquivo:** `SecretariaInfo.model.js`

**Campos Principais:**
- `name`: String (indexado)
- `email`: String
- `alternateEmail`: String
- `telefone`: String
- `distrito`: String
- `endereco`: String
- `createdAt`: Date
- `updatedAt`: Date

**Índices:**
- `name`

---

### 8. **AggregationCache** - Cache de Agregações

**Collection:** `aggregationcaches`  
**Arquivo:** `AggregationCache.model.js`

**Campos Principais:**
- `key`: String (único, indexado)
- `data`: Mixed (JSON)
- `expiresAt`: Date (indexado)
- `createdAt`: Date
- `updatedAt`: Date

**Índices:**
- `key` (único)
- `expiresAt` (TTL)

---

### 9. **SavedFilter** - Filtros Salvos

**Collection:** `savedfilters`  
**Arquivo:** `SavedFilter.model.js`

**Campos Principais:**
- `nome`: String
- `filtros`: Mixed (JSON)
- `usuario`: String
- `createdAt`: Date
- `updatedAt`: Date

**Índices:**
- `usuario`

---

## 🔄 ESTRUTURA DE DADOS

### Normalização de Campos

Todos os dados seguem padrões de normalização:

#### Datas
- **Formato:** ISO 8601 (YYYY-MM-DD)
- **Campos:** `dataCriacaoIso`, `dataConclusaoIso`
- **Conversão:** Automática no pipeline Python

#### Textos
- **Canonização:** Lowercase, sem acento
- **Campos:** `temaLowercase`, `assuntoLowercase`
- **Uso:** Otimização de buscas "contains"

#### Protocolos
- **Formato:** Uppercase, strip
- **Validação:** Único por collection
- **Uso:** Identificação única

---

## 📊 CAMPOS PADRÃO

### Campos Obrigatórios (por tipo)

#### Record (Ouvidoria)
- `protocolo` (único)
- `dataCriacaoIso`
- `statusDemanda`

#### Zeladoria
- `protocolo` (único)
- `statusDemanda`
- `dataCriacaoIso`

#### Esic
- `protocolo` (único)
- `statusDemanda`
- `dataCriacaoIso`

---

## 🔍 ÍNDICES

### Índices por Collection

#### records
- `protocolo` (único)
- `dataCriacaoIso`
- `statusDemanda`
- `tipoDeManifestacao`
- `tema`
- `temaLowercase`
- `assunto`
- `assuntoLowercase`
- `secretaria`
- `prioridade`

#### zeladorias
- `protocolo` (único)
- `statusDemanda`
- `dataCriacaoIso`

#### esics
- `protocolo` (único)
- `statusDemanda`
- `dataCriacaoIso`

#### notificacoesemails
- `protocolo`
- `tipoNotificacao`
- `status`
- `enviadoEm`

#### aggregationcaches
- `key` (único)
- `expiresAt` (TTL)

---

## 🔄 SINCRONIZAÇÃO

### Pipeline → MongoDB

**Fluxo:**
1. Pipeline Python escreve na planilha tratada
2. Script Node.js lê planilha tratada
3. Normaliza dados conforme schema
4. Insere/atualiza no MongoDB Atlas

**Script:** `NOVO/scripts/data/updateFromGoogleSheets.js`

---

## 📈 OTIMIZAÇÕES

### Performance

- **Índices:** Criados em campos frequentemente consultados
- **Lowercase Fields:** Otimização de buscas case-insensitive
- **TTL Indexes:** Cache com expiração automática
- **Compound Indexes:** Para queries complexas

### Agregações

- **MongoDB Native:** Agregações pesadas usando driver nativo
- **Cache:** Resultados cacheados em `AggregationCache`
- **Pipelines:** Otimizados por estágio

---

## ✅ CHECKUP DOS DADOS

### ✅ Modelos
- [x] Todos os 9 modelos implementados
- [x] Schemas validados
- [x] Índices criados

### ✅ Normalização
- [x] Datas em formato ISO
- [x] Textos canonizados
- [x] Protocolos padronizados

### ✅ Sincronização
- [x] Pipeline → Planilha Tratada funcionando
- [x] Planilha Tratada → MongoDB funcionando
- [x] Validação de dados funcionando

### ✅ Performance
- [x] Índices otimizados
- [x] Agregações otimizadas
- [x] Cache funcionando

---

**Última Atualização:** 12/12/2025

