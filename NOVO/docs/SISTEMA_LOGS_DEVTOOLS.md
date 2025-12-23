# 📊 Sistema de Logs do DevTools - Documentação Completa

**CÉREBRO X-3**  
**Data:** 17/12/2025  
**Versão:** 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema de Logging](#arquitetura-do-sistema-de-logging)
3. [Tipos de Logs](#tipos-de-logs)
4. [Como os Logs Aparecem no DevTools](#como-os-logs-aparecem-no-devtools)
5. [Configuração e Controle](#configuração-e-controle)
6. [Logs por Módulo](#logs-por-módulo)
7. [Interpretação dos Logs](#interpretação-dos-logs)
8. [Como Ativar/Desativar Logs](#como-ativardesativar-logs)
9. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

O sistema de logging do Dashboard da Ouvidoria utiliza um **Logger centralizado** que controla todos os logs exibidos no console do navegador (Chrome DevTools). Este sistema foi projetado para:

- ✅ Facilitar debugging durante desenvolvimento
- ✅ Reduzir ruído em produção (apenas erros e warnings)
- ✅ Fornecer informações detalhadas sobre operações do sistema
- ✅ Rastrear performance e cache
- ✅ Monitorar requisições de API e armazenamento de dados

---

## 🏗️ Arquitetura do Sistema de Logging

### Localização do Código

O sistema de logging está implementado em:

```
NOVO/public/scripts/utils/logger.js
```

### Estrutura Básica

```javascript
const LOG_CONFIG = {
  environment: 'development' | 'production',
  levels: {
    error: true,
    warn: true,
    info: false,  // Desabilitado em produção
    debug: false, // Desabilitado em produção
    log: false    // Desabilitado em produção
  },
  prefixes: {
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    debug: '🔍',
    log: '📝',
    success: '✅',
    performance: '⚡'
  }
};
```

### Detecção Automática de Ambiente

O sistema detecta automaticamente se está em **desenvolvimento** ou **produção**:

```javascript
environment: window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1' 
  ? 'development' 
  : 'production'
```

**Em desenvolvimento (`localhost`):**
- ✅ Todos os logs são exibidos
- ✅ Logs detalhados de debug, info, success, performance

**Em produção:**
- ✅ Apenas erros e warnings são exibidos
- ❌ Logs de debug, info, log e success são desabilitados

---

## 📝 Tipos de Logs

### 1. **Logger.error()** ❌

**Quando usar:** Erros críticos que impedem o funcionamento

**Exemplo:**
```javascript
window.Logger.error('Erro ao carregar dados:', error);
```

**No DevTools:**
```
❌ Erro ao carregar dados: { message: "...", stack: "..." }
```

**Sempre ativo:** ✅ Sim (em dev e produção)

---

### 2. **Logger.warn()** ⚠️

**Quando usar:** Avisos sobre situações não críticas mas que merecem atenção

**Exemplo:**
```javascript
window.Logger.warn('⚠️ Dados vazios recebidos, ignorando cache');
```

**No DevTools:**
```
⚠️ Dados vazios recebidos, ignorando cache
```

**Sempre ativo:** ✅ Sim (em dev e produção)

---

### 3. **Logger.info()** ℹ️

**Quando usar:** Informações gerais sobre o estado do sistema

**Exemplo:**
```javascript
window.Logger.info('Fila de requisições limpa');
```

**No DevTools:**
```
ℹ️ Fila de requisições limpa
```

**Ativo apenas em:** 🔧 Desenvolvimento

---

### 4. **Logger.debug()** 🔍

**Quando usar:** Informações detalhadas para debugging

**Exemplo:**
```javascript
window.Logger.debug('📅 Meses extraídos: 12', meses);
```

**No DevTools:**
```
🔍 📅 Meses extraídos: 12 ['2025-12', '2025-11', ...]
```

**Ativo apenas em:** 🔧 Desenvolvimento

---

### 5. **Logger.log()** 📝

**Quando usar:** Logs gerais de operações

**Exemplo:**
```javascript
window.Logger.log('Operação concluída');
```

**No DevTools:**
```
📝 Operação concluída
```

**Ativo apenas em:** 🔧 Desenvolvimento

---

### 6. **Logger.success()** ✅

**Quando usar:** Confirmação de operações bem-sucedidas

**Exemplo:**
```javascript
window.Logger.success('/api/dashboard-data: 17601 itens');
```

**No DevTools:**
```
✅ /api/dashboard-data: 17601 itens
```

**Ativo apenas em:** 🔧 Desenvolvimento

---

### 7. **Logger.performance()** ⚡

**Quando usar:** Medição de performance de operações

**Exemplo:**
```javascript
window.Logger.performance('Carregamento de dados', 245.67);
```

**No DevTools:**
```
⚡ Carregamento de dados: 245.67ms
```

**Cores dinâmicas:**
- 🟢 Verde: < 100ms (rápido)
- 🟠 Laranja: 100-500ms (médio)
- 🔴 Vermelho: > 500ms (lento)

**Ativo apenas em:** 🔧 Desenvolvimento

---

## 🖥️ Como os Logs Aparecem no DevTools

### 1. Acessar o DevTools

**Chrome/Edge:**
- `F12` ou `Ctrl+Shift+I` (Windows/Linux)
- `Cmd+Option+I` (Mac)
- Clique direito → "Inspecionar"

### 2. Abrir a Aba Console

No DevTools, clique na aba **"Console"** (ou pressione `Esc` se já estiver aberto)

### 3. Visualizar Logs

Os logs aparecem automaticamente no console conforme o código é executado. Eles são organizados por:

- **Tipo:** error, warn, info, log, debug
- **Timestamp:** Hora de execução
- **Origem:** Arquivo e linha de código (ex: `logger.js:53`)

### 4. Filtrar Logs

No DevTools Console, você pode filtrar por:

- **Nível:** All levels, Errors, Warnings, Info, Verbose
- **Texto:** Buscar por palavras-chave
- **Origem:** Filtrar por arquivo específico

---

## ⚙️ Configuração e Controle

### Modificar Níveis de Log

Para alterar quais logs são exibidos, edite `NOVO/public/scripts/utils/logger.js`:

```javascript
const LOG_CONFIG = {
  levels: {
    error: true,   // Sempre true
    warn: true,    // Sempre true
    info: true,    // Mudar para true para ativar em produção
    debug: true,   // Mudar para true para ativar em produção
    log: true      // Mudar para true para ativar em produção
  }
};
```

### Ativar Logs em Produção (Temporariamente)

Para debug em produção, você pode forçar o ambiente para development:

```javascript
// No início do logger.js (TEMPORÁRIO - REMOVER APÓS DEBUG)
const LOG_CONFIG = {
  environment: 'development', // Forçar desenvolvimento
  // ...
};
```

**⚠️ IMPORTANTE:** Sempre reverter após o debug!

---

## 📦 Logs por Módulo

### 1. **DataLoader** (`dataLoader.js`)

Logs relacionados ao carregamento de dados da API:

#### ✅ Sucesso de Requisição
```
✅ /api/dashboard-data: 17601 itens
✅ /api/aggregate/by-month: 12 itens
✅ /api/summary: 1 itens
```

#### 🔍 Cache Hit
```
🔍 /api/dashboard-data: Dados obtidos do cache (dataStore)
```

#### 🔍 Armazenamento no Cache
```
🔍 /api/dashboard-data: Dados armazenados no dataStore (único cache) (deepCopy)
```

#### ⚠️ Erro de Requisição
```
⚠️ /api/dashboard-data: HTTP 502, retornando fallback
```

#### 🔍 Deduplicação
```
🔍 /api/dashboard-data: Reutilizando requisição em andamento (deduplicação)
```

---

### 2. **Global Store** (`global-store.js`)

Logs relacionados ao armazenamento global de dados:

#### 🔍 Deep Copy
```
🔍 dataStore.createDeepCopy: Dados contêm objetos Chart.js, retornando referência original
```

#### ⚠️ Avisos
```
⚠️ dataStore.set: key deve ser uma string não vazia
⚠️ dataStore.set: Dados contêm objetos não serializáveis (Chart.js?), usando referência original
```

---

### 3. **Cache Config** (`cache-config.js`)

Logs relacionados à configuração de TTL (Time To Live) do cache:

#### 🔍 TTL Aplicado
```
🔍 Cache TTL: /api/aggregate/by-month → 600000ms (endpoint: /api/aggregate/by-month)
🔍 Cache TTL: /api/dashboard-data → 5000ms (padrão)
```

---

### 4. **Filter History** (`filter-history.js`)

Logs relacionados ao histórico de filtros:

#### 🔍 Salvamento
```
🔍 FilterHistory: Filtro salvo no histórico recente { filters: {...}, timestamp: "..." }
```

#### 🔍 Sincronização
```
🔍 FilterHistory: Sincronização concluída { backend: 5, favorites: 2, recent: 3 }
```

#### 🔍 Inicialização
```
🔍 FilterHistory: Sistema de histórico de filtros inicializado
```

---

### 5. **Month Filter Helper** (`month-filter-helper.js`)

Logs relacionados ao filtro de meses:

#### 🔍 Carregamento
```
🔍 📅 Carregando meses do endpoint: /api/aggregate/by-month
```

#### 🔍 Dados Recebidos
```
🔍 📅 Dados recebidos: 12 registros [{ month: "2025-12", ... }, ...]
```

#### 🔍 Meses Extraídos
```
🔍 📅 Meses extraídos: 12 ['2025-12', '2025-11', '2025-10', '2025-09', '2025-08']
```

#### ✅ Sucesso
```
✅ Select filtro-mes populado com 12 meses
```

---

### 6. **Crossfilter** (`crossfilter-core.js`)

Logs relacionados aos filtros multidimensionais:

#### 🔍 Dados Definidos
```
🔍 Crossfilter: Dados brutos definidos { total: 17601 }
```

#### ⚠️ Campo Não Configurado
```
⚠️ Crossfilter: Campo 'status' não está configurado
```

---

### 7. **Main** (`main.js`)

Logs relacionados à inicialização do sistema:

#### 🔍 Menu Inicializado
```
🔍 ✅ 8 itens de menu inicializados
```

#### 🔍 Componentes Carregados
```
🔍 Componentes carregados, escondendo loading...
```

---

### 8. **Chart Factory** (`chart-factory.js`)

Logs relacionados à criação de gráficos:

#### 🔍 Criação de Gráfico
```
🔍 ChartFactory: Criando gráfico 'chartTopOrgaos' do tipo 'bar'
```

#### ⚠️ Avisos de Dados
```
⚠️ chartTopOrgaos: Esperado 10 itens, recebido 12 labels e 12 values
```

---

## 🔍 Interpretação dos Logs

### Sequência Típica de Carregamento

Ao abrir o dashboard, você verá uma sequência como esta:

```
1. 🔍 FilterHistory: Sistema de histórico de filtros inicializado
2. 🔍 ✅ 8 itens de menu inicializados
3. 🔍 📅 Carregando meses do endpoint: /api/aggregate/by-month
4. 🔍 📅 Dados recebidos: 12 registros
5. 🔍 📅 Meses extraídos: 12 ['2025-12', '2025-11', ...]
6. ✅ /api/aggregate/by-month: 12 itens
7. 🔍 /api/dashboard-data: Dados armazenados no dataStore (único cache) (deepCopy)
8. ✅ /api/dashboard-data: 17601 itens
9. 🔍 Componentes carregados, escondendo loading...
10. 🔍 FilterHistory: Sincronização concluída { backend: 5, favorites: 2, recent: 3 }
```

### Logs de Cache

Quando você vê:
```
🔍 /api/dashboard-data: Dados obtidos do cache (dataStore)
```

Isso significa que:
- ✅ Os dados foram encontrados no cache
- ✅ Não houve requisição HTTP ao servidor
- ✅ A resposta foi instantânea

### Logs de Requisição Real

Quando você vê:
```
✅ /api/dashboard-data: 17601 itens
🔍 /api/dashboard-data: Dados armazenados no dataStore (único cache) (deepCopy)
```

Isso significa que:
- ✅ Uma requisição HTTP foi feita ao servidor
- ✅ Os dados foram recebidos e armazenados no cache
- ✅ Próximas requisições usarão o cache (dentro do TTL)

### Logs de Erro

Quando você vê:
```
❌ /api/dashboard-data: HTTP 500: Internal Server Error
```

Isso significa que:
- ❌ O servidor retornou um erro
- ⚠️ O sistema tentará usar fallback (se configurado)
- 🔍 Verifique o backend para mais detalhes

---

## 🎛️ Como Ativar/Desativar Logs

### Método 1: Modificar Logger.js (Permanente)

Edite `NOVO/public/scripts/utils/logger.js`:

```javascript
const LOG_CONFIG = {
  levels: {
    error: true,
    warn: true,
    info: false,  // Mudar para true para ativar
    debug: false, // Mudar para true para ativar
    log: false    // Mudar para true para ativar
  }
};
```

### Método 2: Console do Navegador (Temporário)

No console do DevTools, execute:

```javascript
// Ativar todos os logs
window.Logger = {
  ...window.Logger,
  info: (msg, ...args) => console.info('ℹ️', msg, ...args),
  debug: (msg, ...args) => console.log('🔍', msg, ...args),
  log: (msg, ...args) => console.log('📝', msg, ...args),
  success: (msg, ...args) => console.log('✅', msg, ...args)
};
```

### Método 3: Filtrar no DevTools (Visual)

No DevTools Console:
1. Clique no ícone de filtro (funnel)
2. Selecione os níveis desejados
3. Os logs serão filtrados visualmente (não desativados)

---

## 💡 Exemplos Práticos

### Exemplo 1: Rastrear Carregamento de Dados

**Cenário:** Você quer ver todos os logs relacionados ao carregamento de dados da API.

**O que procurar:**
```
✅ /api/dashboard-data: 17601 itens
🔍 /api/dashboard-data: Dados armazenados no dataStore (único cache) (deepCopy)
```

**Interpretação:**
- 17.601 registros foram carregados
- Dados foram armazenados no cache com deep copy
- Próximas requisições usarão cache por 5 segundos (TTL padrão)

---

### Exemplo 2: Identificar Problemas de Cache

**Cenário:** Você suspeita que o cache não está funcionando.

**O que procurar:**
```
🔍 /api/dashboard-data: Dados obtidos do cache (dataStore)
```

**Se NÃO aparecer:**
- Cache pode estar expirado (TTL vencido)
- Cache pode ter sido limpo
- Primeira requisição (não há cache ainda)

---

### Exemplo 3: Monitorar Performance

**Cenário:** Você quer verificar se alguma operação está lenta.

**O que procurar:**
```
⚡ Carregamento de dados: 245.67ms
```

**Cores:**
- 🟢 Verde (< 100ms): Rápido ✅
- 🟠 Laranja (100-500ms): Aceitável ⚠️
- 🔴 Vermelho (> 500ms): Lento ❌

---

### Exemplo 4: Debug de Filtros

**Cenário:** Você quer ver como os filtros estão sendo aplicados.

**O que procurar:**
```
🔍 FilterHistory: Filtro salvo no histórico recente { filters: {...} }
🔍 Crossfilter: Dados brutos definidos { total: 17601 }
🔍 FilterHistory: Sincronização concluída { backend: 5, favorites: 2, recent: 3 }
```

---

### Exemplo 5: Identificar Erros de API

**Cenário:** Alguma requisição está falhando.

**O que procurar:**
```
❌ /api/dashboard-data: HTTP 500: Internal Server Error
⚠️ /api/dashboard-data: HTTP 502, retornando fallback
```

**Ações:**
1. Verificar se o servidor está rodando
2. Verificar logs do backend
3. Verificar se há problemas de rede

---

## 📚 Referências

### Arquivos Relacionados

- `NOVO/public/scripts/utils/logger.js` - Sistema de logging
- `NOVO/public/scripts/core/dataLoader.js` - Carregamento de dados
- `NOVO/public/scripts/core/global-store.js` - Armazenamento global
- `NOVO/public/scripts/core/cache-config.js` - Configuração de cache
- `NOVO/public/scripts/core/filter-history.js` - Histórico de filtros

### Documentação Adicional

- [Chrome DevTools Console](https://developer.chrome.com/docs/devtools/console/)
- [Console API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Console)

---

## ✅ Checklist de Debug

Ao debugar usando logs:

- [ ] Abrir DevTools Console (F12)
- [ ] Verificar se está em ambiente de desenvolvimento (localhost)
- [ ] Filtrar logs por tipo (se necessário)
- [ ] Procurar por erros (❌) primeiro
- [ ] Verificar avisos (⚠️)
- [ ] Rastrear sequência de logs de inicialização
- [ ] Verificar logs de cache e performance
- [ ] Documentar problemas encontrados

---

## 🎯 Conclusão

O sistema de logs do Dashboard da Ouvidoria fornece informações detalhadas sobre todas as operações do sistema. Em desenvolvimento, todos os logs são exibidos para facilitar o debugging. Em produção, apenas erros e warnings são exibidos para reduzir ruído e melhorar performance.

**Lembre-se:**
- ✅ Logs são automáticos - não precisa fazer nada
- ✅ Em `localhost`, todos os logs aparecem
- ✅ Em produção, apenas erros e warnings aparecem
- ✅ Use filtros no DevTools para focar em tipos específicos
- ✅ Logs ajudam a identificar problemas rapidamente

---

**Documento criado por:** CÉREBRO X-3  
**Última atualização:** 17/12/2025  
**Versão:** 1.0

