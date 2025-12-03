# 💾 SISTEMAS DE CACHE - GUIA DE USO

**Data**: 02/12/2025  
**Status**: Documentação dos sistemas de cache disponíveis

---

## 📊 RESUMO

O sistema possui **8 sistemas de cache diferentes**, cada um com seu propósito específico. Este documento explica quando usar cada um.

---

## 🗄️ SISTEMAS DE CACHE

### 1. **dbCache** (`NOVO/src/utils/dbCache.js`)
**Tipo**: Cache no MongoDB (AggregationCache)  
**Persistência**: ✅ Sim (banco de dados)  
**TTL**: Configurável por chave  
**Uso**: Agregações pré-computadas, dados grandes

**Quando usar**:
- ✅ Dados que não mudam frequentemente
- ✅ Agregações complexas e pesadas
- ✅ Dados que precisam persistir entre reinicializações
- ✅ Quando o cache em memória não é suficiente

**Exemplo**:
```javascript
import { getDbCache, setDbCache } from '../utils/dbCache.js';

const cached = await getDbCache(prisma, 'my-key');
if (!cached) {
  const data = await expensiveQuery();
  await setDbCache(prisma, 'my-key', data, 3600); // 1 hora
}
```

---

### 2. **smartCache** (`NOVO/src/utils/smartCache.js`)
**Tipo**: Cache inteligente com TTL adaptativo  
**Persistência**: ✅ Sim (integra com dbCache)  
**TTL**: Configurável por tipo de endpoint  
**Uso**: Cache automático baseado em filtros

**Quando usar**:
- ✅ Endpoints que recebem filtros
- ✅ Quando precisa de TTL diferente por tipo de endpoint
- ✅ Cache automático baseado em chaves derivadas de filtros

**TTL por tipo**:
- `overview`: 5 segundos
- `status`, `tema`, `assunto`, `categoria`, `bairro`: 15 segundos
- `orgaoMes`: 30 segundos
- `distinct`: 300 segundos (5 minutos)
- `sla`: 60 segundos
- `default`: 15 segundos

**Exemplo**:
```javascript
import { getSmartCache, setSmartCache } from '../utils/smartCache.js';

const key = generateCacheKey('status', filters);
const cached = await getSmartCache(prisma, key, 'status');
```

---

### 3. **withCache()** (`NOVO/src/utils/responseHelper.js`)
**Tipo**: Wrapper de resposta com cache híbrido  
**Persistência**: ✅ Sim (usa dbCache)  
**TTL**: Configurável  
**Uso**: **RECOMENDADO** - Wrapper padrão para endpoints

**Quando usar**:
- ✅ **SEMPRE** em controllers de API
- ✅ Endpoints que retornam JSON
- ✅ Quando precisa de timeout automático
- ✅ Quando precisa de tratamento de erros padronizado

**Exemplo**:
```javascript
import { withCache } from '../../utils/responseHelper.js';

export async function meuEndpoint(req, res, prisma) {
  return withCache('meu-endpoint-key', 3600, res, async () => {
    // Sua lógica aqui
    return { dados: [...] };
  }, prisma);
}
```

---

### 4. **dataStore** (`NOVO/public/scripts/core/global-store.js`)
**Tipo**: Cache no cliente (localStorage + memória)  
**Persistência**: ✅ Sim (localStorage)  
**TTL**: Configurável  
**Uso**: Frontend - cache de dados no navegador

**Quando usar**:
- ✅ Cache de dados no frontend
- ✅ Quando precisa de reatividade (listeners)
- ✅ Quando precisa persistir entre sessões
- ✅ Cache de respostas de API no cliente

**Exemplo**:
```javascript
// Armazenar
window.dataStore.set('meus-dados', dados, true);

// Obter
const dados = window.dataStore.get('meus-dados', 60000); // 1 minuto

// Inscrever-se para mudanças
window.dataStore.subscribe('meus-dados', (newData) => {
  atualizarUI(newData);
});
```

---

### 5. **dataLoader** (`NOVO/public/scripts/core/dataLoader.js`)
**Tipo**: Carregamento com cache integrado  
**Persistência**: ✅ Sim (usa dataStore)  
**TTL**: Configurável  
**Uso**: Frontend - carregamento unificado de dados

**Quando usar**:
- ✅ **SEMPRE** para carregar dados de API no frontend
- ✅ Quando precisa de deduplicação de requisições
- ✅ Quando precisa de cache automático
- ✅ Quando precisa de timeouts adaptativos

**Exemplo**:
```javascript
const data = await window.dataLoader.load('/api/meu-endpoint', {
  useDataStore: true,
  ttl: 10 * 60 * 1000 // 10 minutos
});
```

---

### 6. **cacheManager** (`NOVO/src/utils/cacheManager.js`)
**Tipo**: Cache em arquivo (persistente)  
**Persistência**: ✅ Sim (arquivo)  
**TTL**: Configurável  
**Uso**: Cache persistente entre reinicializações do servidor

**Quando usar**:
- ✅ Dados que precisam persistir entre reinicializações
- ✅ Quando não quer usar banco de dados para cache
- ✅ Cache de configurações ou dados estáticos

**Exemplo**:
```javascript
import { CacheManager } from '../utils/cacheManager.js';

const cache = new CacheManager();
await cache.set('key', data, 3600);
const cached = await cache.get('key');
```

---

### 7. **cacheBuilder** (`NOVO/src/utils/cacheBuilder.js`)
**Tipo**: Construtor de cache  
**Persistência**: Depende da implementação  
**Uso**: Utilitário para construir sistemas de cache customizados

**Quando usar**:
- ⚠️ Raramente - apenas para casos muito específicos
- ⚠️ Quando precisa de cache customizado

---

### 8. **AggregationCache** (Prisma Model)
**Tipo**: Model do banco de dados  
**Persistência**: ✅ Sim (MongoDB)  
**Uso**: Usado internamente por `dbCache` e `smartCache`

**Quando usar**:
- ⚠️ Não usar diretamente - usar através de `dbCache` ou `smartCache`
- ⚠️ Apenas para consultas diretas ao banco se necessário

---

## 🎯 RECOMENDAÇÕES DE USO

### Backend (Controllers):
```javascript
// ✅ RECOMENDADO - Use sempre
import { withCache } from '../../utils/responseHelper.js';

export async function meuEndpoint(req, res, prisma) {
  return withCache('chave-cache', 3600, res, async () => {
    // Sua lógica aqui
    return { dados: [...] };
  }, prisma);
}
```

### Frontend (Páginas):
```javascript
// ✅ RECOMENDADO - Use sempre
const data = await window.dataLoader.load('/api/endpoint', {
  useDataStore: true,
  ttl: 10 * 60 * 1000
});
```

### Cache Específico:
- **Dados grandes/agregações**: Use `dbCache` diretamente
- **Cache com TTL adaptativo**: Use `smartCache`
- **Cache persistente em arquivo**: Use `cacheManager`
- **Cache no cliente**: Use `dataStore` ou `dataLoader`

---

## 📋 COMPARAÇÃO RÁPIDA

| Sistema | Persistência | TTL | Uso Principal | Quando Usar |
|---------|--------------|-----|---------------|-------------|
| `withCache()` | ✅ Sim | Configurável | **Controllers** | ✅ **SEMPRE** |
| `dataLoader` | ✅ Sim | Configurável | **Frontend** | ✅ **SEMPRE** |
| `dbCache` | ✅ Sim | Configurável | Agregações | Dados grandes |
| `smartCache` | ✅ Sim | Adaptativo | Filtros | TTL por tipo |
| `dataStore` | ✅ Sim | Configurável | Frontend | Cache cliente |
| `cacheManager` | ✅ Sim | Configurável | Arquivo | Persistência |
| `cacheBuilder` | Depende | Depende | Customizado | Casos raros |
| `AggregationCache` | ✅ Sim | Configurável | Interno | Não usar direto |

---

## ⚠️ NOTAS IMPORTANTES

1. **Sempre use `withCache()` em controllers** - É o padrão recomendado
2. **Sempre use `dataLoader` no frontend** - É o padrão recomendado
3. **Não use múltiplos sistemas para a mesma coisa** - Escolha um e seja consistente
4. **TTL adequado**: Dados dinâmicos (5-15s), dados estáticos (5-60min)
5. **Invalidar cache quando necessário**: Use `invalidateCache()` quando dados mudarem

---

## 🔄 FLUXO RECOMENDADO

```
Frontend:
  window.dataLoader.load('/api/endpoint')
    ↓
Backend:
  withCache('key', ttl, res, async () => {
    // Verifica dbCache primeiro
    // Se não houver, executa query
    // Salva em dbCache
    return dados;
  })
    ↓
Frontend:
  window.dataStore.set('key', dados)
    ↓
Próxima requisição:
  Usa cache do dataStore (se válido)
```

---

**Última atualização**: 02/12/2025

