# 🧪 INSTRUÇÕES: Como Executar Testes

**Data**: 03/12/2025  
**CÉREBRO X-3**

---

## 📋 PRÉ-REQUISITOS

1. Instalar dependências:
```bash
cd NOVO
npm install
```

2. Verificar se as dependências foram instaladas:
```bash
npm list typescript vitest @vitest/ui jsdom
```

---

## 🚀 EXECUTAR TESTES

### Todos os Testes

```bash
npm test
```

### Com UI Interativa

```bash
npm run test:ui
```

Abre interface web no navegador para visualizar testes em tempo real.

### Com Coverage

```bash
npm run test:coverage
```

Gera relatório de cobertura de código. Verifica se está acima de 70%.

### Type Checking

```bash
npm run typecheck
```

Verifica erros de tipo TypeScript sem compilar.

---

## 📊 ESTRUTURA DE TESTES

```
NOVO/public/scripts/core/chart-communication/__tests__/
├── event-bus.test.js          ✅ Event Bus completo
├── global-filters.test.js     ✅ Global Filters completo
├── chart-registry.test.js     ✅ Chart Registry completo
└── auto-connect.test.js       ✅ Auto-Connect completo
```

---

## ✅ COVERAGE MÍNIMO

**Alvo**: 70% de cobertura

**Thresholds**:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

---

## 🔍 VERIFICAR COVERAGE

Após executar `npm run test:coverage`, verifique:

1. **Terminal**: Mostra resumo de coverage
2. **HTML Report**: Abre automaticamente no navegador
3. **Arquivo**: `coverage/index.html`

---

## 🐛 TROUBLESHOOTING

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "window is not defined"

Os testes usam `jsdom` para simular ambiente browser. Se houver problemas:

1. Verificar se `vitest.config.js` tem `environment: 'jsdom'`
2. Verificar se `jsdom` está instalado: `npm list jsdom`

### Testes não encontram módulos

Verificar se os arquivos de teste estão em `__tests__/` ou terminam com `.test.js` ou `.spec.js`.

---

## 📝 ADICIONAR NOVOS TESTES

1. Criar arquivo `*.test.js` na pasta `__tests__/`
2. Importar módulo a testar
3. Usar `describe()` e `it()` do Vitest
4. Executar: `npm test`

### Exemplo

```javascript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Meu Módulo', () => {
  beforeEach(() => {
    // Setup antes de cada teste
  });

  it('deve fazer algo', () => {
    expect(true).toBe(true);
  });
});
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Testes unitários para todos os módulos - **CONCLUÍDO**
2. ⏳ Testes de integração
3. ⏳ Testes E2E
4. ⏳ CI/CD com testes automáticos

---

**CÉREBRO X-3**  
**Última atualização**: 03/12/2025

