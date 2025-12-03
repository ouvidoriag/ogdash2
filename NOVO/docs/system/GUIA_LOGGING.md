# 📚 Guia de Logging do Sistema

**Sistema**: Winston Logger  
**Localização**: `NOVO/src/utils/logger.js`  
**Status**: ✅ Ativo

---

## 🎯 Uso Básico

### Importar o Logger:

```javascript
const logger = require('../utils/logger');
// ou
import logger from '../utils/logger.js';
```

### Níveis de Log:

```javascript
// ❌ Erros críticos (sempre registrados)
logger.error('Erro ao processar dados', { erro: err.message });

// ⚠️ Avisos (problemas não críticos)
logger.warn('Cache expirado, recarregando dados');

// ℹ️ Informações importantes (operações bem-sucedidas)
logger.info('Dados carregados com sucesso', { registros: 1000 });

// 🐛 Debug (detalhes técnicos, apenas em desenvolvimento)
logger.debug('Processando pipeline', { etapa: 1, dados: obj });
```

---

## 🔧 Métodos Especializados

### HTTP Requests:

```javascript
// Registrar requisições HTTP
logger.http('GET', '/api/data', 200, 350);
// Output: HTTP Request { method: 'GET', url: '/api/data', statusCode: 200, responseTime: '350ms' }
```

### Cache:

```javascript
// Cache hit
logger.cache('get', 'overview:2024', true);

// Cache miss
logger.cache('get', 'overview:2024', false);

// Cache set
logger.cache('set', 'overview:2024');
```

### Banco de Dados:

```javascript
// Operação de banco
logger.db('find', 'records', 120);
// Output: Database { operation: 'find', collection: 'records', duration: '120ms' }
```

### Agregações MongoDB:

```javascript
const pipeline = [
  { $match: { status: 'ativo' } },
  { $group: { _id: '$categoria' } }
];

logger.aggregation(pipeline, 'records', 450, 25);
// Output: Aggregation { type: 'aggregation', collection: 'records', stages: 2, duration: '450ms', results: 25 }
```

### Erros com Contexto:

```javascript
try {
  // ... código ...
} catch (error) {
  logger.errorWithContext('Falha ao processar dados', error, {
    usuario: req.user?.id,
    endpoint: '/api/data',
    params: req.query
  });
}
```

---

## 📝 Boas Práticas

### ✅ FAZER:

1. **Usar níveis apropriados**:
   ```javascript
   logger.error('Erro crítico que precisa atenção imediata');
   logger.warn('Problema não crítico, mas atenção necessária');
   logger.info('Operação importante concluída com sucesso');
   logger.debug('Detalhes técnicos para debugging');
   ```

2. **Incluir contexto útil**:
   ```javascript
   logger.info('Dados processados', {
     registros: count,
     tempo: duration,
     usuario: userId
   });
   ```

3. **Registrar início e fim de operações importantes**:
   ```javascript
   logger.info('Iniciando processamento de vencimentos');
   // ... processamento ...
   logger.info('Processamento concluído', { processados: count });
   ```

4. **Usar métodos especializados quando apropriado**:
   ```javascript
   logger.db('aggregate', 'records', 230);
   logger.cache('get', cacheKey, hit);
   ```

### ❌ NÃO FAZER:

1. **Não usar console.log diretamente**:
   ```javascript
   // ❌ ERRADO
   console.log('Dados carregados');
   
   // ✅ CORRETO
   logger.info('Dados carregados');
   ```

2. **Não logar dados sensíveis**:
   ```javascript
   // ❌ ERRADO
   logger.info('Login', { senha: password, token: jwt });
   
   // ✅ CORRETO
   logger.info('Login realizado', { usuario: username });
   ```

3. **Não logar objetos muito grandes**:
   ```javascript
   // ❌ ERRADO
   logger.debug('Dados completos', { dados: arrayComMilhares });
   
   // ✅ CORRETO
   logger.debug('Dados carregados', { total: arrayComMilhares.length });
   ```

4. **Não usar debug em produção para operações frequentes**:
   ```javascript
   // ❌ ERRADO (muito verboso)
   data.forEach(item => logger.debug('Processando', item));
   
   // ✅ CORRETO
   logger.debug('Processando lote', { total: data.length });
   ```

---

## 🌍 Configuração por Ambiente

### Desenvolvimento (`NODE_ENV=development` ou não definido):
- ✅ Todos os logs exibidos no console (error, warn, info, debug)
- ✅ Logs coloridos
- ✅ Erros salvos em `logs/error.log`

### Produção (`NODE_ENV=production`):
- ✅ Apenas erros no console
- ✅ Todos os logs salvos em `logs/combined.log`
- ✅ Erros salvos em `logs/error.log`
- ❌ Debug desabilitado (performance)

---

## 📂 Arquivos de Log

### Localização: `NOVO/logs/`

- **`error.log`** - Apenas erros (rotacionado a cada 5MB, mantém 5 arquivos)
- **`combined.log`** - Todos os logs em produção (rotacionado a cada 5MB)

**Nota**: Arquivos de log são ignorados pelo git (`.gitignore`).

---

## 🔄 Migração de console.log

### Padrão de Substituição:

```javascript
// ❌ ANTES
console.log('Dados carregados:', data.length);
console.error('Erro:', error);
console.warn('Atenção:', message);

// ✅ DEPOIS
logger.info('Dados carregados', { total: data.length });
logger.error('Erro ao carregar dados', { erro: error.message });
logger.warn('Atenção', { mensagem: message });
```

### Exemplo Completo (Controller):

```javascript
// ANTES:
const getData = async (req, res) => {
  console.log('Buscando dados...');
  try {
    const data = await prisma.record.findMany();
    console.log('Dados encontrados:', data.length);
    res.json(data);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// DEPOIS:
const logger = require('../utils/logger');

const getData = async (req, res) => {
  logger.info('Iniciando busca de dados');
  const startTime = Date.now();
  
  try {
    const data = await prisma.record.findMany();
    const duration = Date.now() - startTime;
    
    logger.info('Dados carregados com sucesso', {
      total: data.length,
      duracao: `${duration}ms`
    });
    
    res.json(data);
  } catch (error) {
    logger.errorWithContext('Falha ao buscar dados', error, {
      endpoint: req.originalUrl,
      metodo: req.method
    });
    
    res.status(500).json({ error: 'Erro interno' });
  }
};
```

---

## 📊 Monitoramento

### Ver logs em tempo real:

```bash
# Todos os logs
tail -f NOVO/logs/combined.log

# Apenas erros
tail -f NOVO/logs/error.log

# Filtrar por nível (no terminal)
tail -f NOVO/logs/combined.log | grep "ERROR"
tail -f NOVO/logs/combined.log | grep "WARN"
```

---

## 🎯 Checklist de Migração

- [ ] Importar logger no arquivo
- [ ] Substituir `console.log()` por `logger.info()` ou `logger.debug()`
- [ ] Substituir `console.error()` por `logger.error()` ou `logger.errorWithContext()`
- [ ] Substituir `console.warn()` por `logger.warn()`
- [ ] Adicionar contexto útil aos logs
- [ ] Remover logs desnecessários
- [ ] Testar em desenvolvimento
- [ ] Verificar logs em produção

---

**Última atualização**: 02/12/2025  
**Ver também**: `NOVO/maps/PROGRESSO_LOGGING.md` para acompanhar o progresso da migração

