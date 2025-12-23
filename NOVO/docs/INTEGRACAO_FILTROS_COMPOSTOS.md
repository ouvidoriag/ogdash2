# 🔗 Integração de Filtros Compostos

**Data:** 2025-01-XX  
**CÉREBRO X-3**

---

## 📋 Status

**Status:** 🟡 Estrutura Básica Implementada + Integração Inicial

### O que foi implementado:

1. ✅ Classe `CompositeFilter` (`NOVO/src/utils/compositeFilters.js`)
2. ✅ Conversão para MongoDB (`toMongoQuery()`)
3. ✅ Validação de estrutura
4. ✅ Serialização/deserialização JSON
5. ✅ Detecção básica no `filterController.js`
6. ✅ Script de migração para campos lowercase

### O que falta:

1. 🔴 UI no frontend para criar grupos de filtros
2. 🔴 Testes de integração completos
3. 🔴 Suporte completo em `filterAndAggregate`

---

## 🎯 Como Usar (Backend)

### Exemplo 1: Filtro OR Simples

```javascript
// POST /api/filter
{
  "operator": "OR",
  "filters": [
    { "field": "statusDemanda", "op": "eq", "value": "Aberto" },
    { "field": "statusDemanda", "op": "eq", "value": "Em Andamento" }
  ]
}

// MongoDB resultante:
// { $or: [
//   { statusDemanda: "Aberto" },
//   { statusDemanda: "Em Andamento" }
// ]}
```

### Exemplo 2: Filtro Composto (OR + AND)

```javascript
// POST /api/filter
{
  "operator": "AND",
  "filters": [
    {
      "operator": "OR",
      "filters": [
        { "field": "statusDemanda", "op": "eq", "value": "Aberto" },
        { "field": "statusDemanda", "op": "eq", "value": "Em Andamento" }
      ]
    },
    { "field": "bairro", "op": "eq", "value": "Centro" }
  ]
}

// MongoDB resultante:
// { $and: [
//   { $or: [
//     { statusDemanda: "Aberto" },
//     { statusDemanda: "Em Andamento" }
//   ]},
//   { bairro: "Centro" }
// ]}
```

### Exemplo 3: Usando a Classe no Backend

```javascript
import { CompositeFilter, createORFilter } from '../../utils/compositeFilters.js';

// Criar filtro composto
const filter = new CompositeFilter('AND', [
  createORFilter([
    { field: 'statusDemanda', op: 'eq', value: 'Aberto' },
    { field: 'statusDemanda', op: 'eq', value: 'Em Andamento' }
  ]),
  { field: 'bairro', op: 'eq', value: 'Centro' }
]);

// Converter para MongoDB
const mongoQuery = filter.toMongoQuery();

// Usar na query
const results = await Record.find(mongoQuery);
```

---

## 🔧 Script de Migração

### Popular Campos Lowercase

```bash
# Executar migração
node NOVO/scripts/maintenance/migrate-lowercase-fields.js
```

**O que faz:**
- Popula campos `temaLowercase`, `assuntoLowercase`, etc. em registros existentes
- Cria índices nos campos lowercase
- Processa em lotes de 1000 registros
- Mostra progresso em tempo real

**Saída esperada:**
```
🚀 Iniciando migração de campos lowercase...
✅ Conectado ao MongoDB
📊 Total de registros: 50000
🔄 Processando registros...
📦 Processados: 1000/50000 (2%) | Atualizados: 850 | Ignorados: 150
...
✅ Migração concluída!
```

---

## 🚀 Próximos Passos

### 1. UI no Frontend

Criar componente para construção de filtros compostos:

```javascript
// Exemplo de UI proposta
const filterBuilder = {
  addGroup(operator = 'AND') {
    // Adicionar grupo de filtros
  },
  addFilter(field, op, value) {
    // Adicionar filtro ao grupo atual
  },
  toJSON() {
    // Converter para formato CompositeFilter
  }
};
```

### 2. Integração Completa

- Suporte em `filterAndAggregate`
- Validação de filtros compostos em `validateFilters.js`
- Normalização de filtros compostos em `normalizeFilters.js`

### 3. Testes

- Testes unitários para `CompositeFilter`
- Testes de integração para endpoints
- Testes de performance

---

## 📝 Notas Técnicas

### Limitações Atuais

1. **Conversão Simplificada**: A conversão de filtros simples para MongoDB é simplificada. Filtros complexos podem precisar de ajustes.

2. **Validação Parcial**: A validação verifica estrutura, mas não valida campos ou valores.

3. **Performance**: Filtros compostos com muitos níveis podem ser mais lentos. Monitorar performance.

### Melhorias Futuras

1. **Otimização de Queries**: Combinar filtros simples quando possível (ex: múltiplos `eq` do mesmo campo → `$in`)

2. **Cache**: Suporte a cache para filtros compostos

3. **Validação Avançada**: Validar campos e valores antes de executar query

---

**Documento criado para facilitar integração futura de filtros compostos.**

