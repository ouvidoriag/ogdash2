# 🧪 TESTES DO SISTEMA - DOCUMENTAÇÃO COMPLETA

## 📋 Visão Geral

Este documento descreve todos os testes disponíveis no sistema e como executá-los.

**Data:** 12/12/2025  
**CÉREBRO X-3**

---

## 🚀 Teste Completo do Sistema

### Executar Todos os Testes

```bash
npm run test:completo
```

Este comando executa:
1. ✅ Validação de sintaxe de todos os arquivos JavaScript
2. ✅ Teste de todas as APIs
3. ✅ Teste de KPIs
4. ✅ Teste de Filtros
5. ✅ Teste de Scripts Node.js
6. ✅ Validação do Pipeline Python
7. ✅ Teste de Páginas Frontend
8. ✅ Teste de Integrações (Crossfilter, Agregações)

**Resultado:** Gera relatório completo em `NOVO/test-results.json`

---

## 📡 Testes de APIs

### Teste Completo de APIs

```bash
npm run test:apis
```

Testa:
- ✅ Conectividade do servidor
- ✅ GET /api/dashboard-data
- ✅ GET /api/summary
- ✅ POST /api/filter/aggregated (sem filtros)
- ✅ POST /api/filter/aggregated (com filtros)
- ✅ POST /api/filter
- ✅ GET /api/records
- ✅ Performance e comparações

### Teste de KPIs

```bash
npm run test:kpis
```

Testa:
- ✅ Total de manifestações
- ✅ Últimos 7 e 30 dias
- ✅ Agregações por status, tema, órgão, tipo, canal, prioridade
- ✅ Dados mensais e diários
- ✅ Consistência entre endpoints

### Teste de Filtros

```bash
npm run test:filters
```

Testa:
- ✅ Filtros simples (Status, Canal, Tipo, etc.)
- ✅ Filtros múltiplos simultâneos
- ✅ Filtros com operadores diferentes (eq, contains)
- ✅ Comparação entre /api/filter e /api/filter/aggregated
- ✅ Validação de estrutura de dados

### Teste de Todos os Endpoints

```bash
npm run test:all-endpoints
```

Executa em sequência:
1. `test:validate`
2. `test:apis`
3. `test:kpis`
4. `test:filters`

---

## 🎨 Testes de Frontend

### Teste de Páginas

```bash
npm run test:pages
```

Testa todas as páginas do sistema e verifica se os gráficos são renderizados corretamente.

### Teste de Todas as Páginas

```bash
npm run test:all
```

Teste completo de todas as páginas (Ouvidoria, Zeladoria, E-SIC).

---

## 🔗 Testes de Integrações

### Teste Crossfilter

```bash
npm run test:crossfilter
```

Testa o sistema de filtros crossfilter.

### Teste de Estrutura Crossfilter

```bash
npm run test:crossfilter:structure
```

Valida a estrutura do sistema crossfilter.

### Teste de Agregações

```bash
npm run test:aggregation
```

Testa agregações automáticas.

### Teste de Agregações Simuladas

```bash
npm run test:aggregation:simulated
```

Testa agregações com dados simulados.

---

## 📜 Testes de Scripts Node.js

### Teste de Conexão MongoDB

```bash
node scripts/test/test-mongoose-connection.js
```

Valida a conexão com MongoDB Atlas.

### Teste de Google Sheets

```bash
npm run test:sheets
```

Testa a integração com Google Sheets.

### Teste de Chaves Gemini

```bash
node scripts/test/testGeminiKeys.js
```

Valida as chaves da API Gemini.

### Teste de Endpoints E-SIC

```bash
npm run test:esic
```

Testa todos os endpoints do E-SIC.

---

## 🐍 Teste de Pipeline Python

O pipeline Python é validado automaticamente no teste completo. Para validar manualmente:

1. Verificar se Python está instalado:
```bash
python --version
```

2. Verificar se o arquivo existe:
```bash
ls Pipeline/main.py
```

3. Executar o pipeline (requer configuração):
```bash
npm run pipeline
```

---

## 🔍 Validação de Sintaxe

### Validação Automática

A validação de sintaxe é executada automaticamente no `test:completo`.

Valida todos os arquivos JavaScript em:
- `NOVO/src/`
- `NOVO/public/scripts/`
- `NOVO/scripts/`

### Validação Manual

Para validar um arquivo específico:

```bash
node --check caminho/para/arquivo.js
```

---

## 📊 Testes Unitários (Vitest)

### Executar Testes Unitários

```bash
npm test
```

### Interface de Testes

```bash
npm run test:ui
```

Abre interface web para visualizar e executar testes.

### Coverage

```bash
npm run test:coverage
```

Gera relatório de cobertura de código.

---

## 📝 Estrutura de Testes

```
NOVO/
├── scripts/test/
│   ├── test-completo-sistema.js    # 🆕 Teste master completo
│   ├── test-all-apis.js            # Teste de APIs
│   ├── test-kpis.js                # Teste de KPIs
│   ├── test-filters.js             # Teste de Filtros
│   ├── test-all-pages.js           # Teste de páginas
│   ├── test-crossfilter.js         # Teste crossfilter
│   ├── test-mongoose-connection.js  # Teste MongoDB
│   ├── testGoogleSheets.js          # Teste Google Sheets
│   └── ...
├── public/scripts/test/
│   ├── test-crossfilter-browser.js
│   ├── test-dataloader-datastore.js
│   └── ...
└── public/scripts/core/chart-communication/__tests__/
    ├── auto-connect.test.js
    ├── chart-registry.test.js
    ├── event-bus.test.js
    └── global-filters.test.js
```

---

## 📈 Relatórios de Testes

### Relatório JSON

Após executar `test:completo`, um relatório é gerado em:

```
NOVO/test-results.json
```

Contém:
- Total de testes
- Testes que passaram
- Testes que falharam
- Testes pulados
- Detalhes de cada teste
- Duração total

### Relatório de Coverage

Após executar `test:coverage`, relatório HTML é gerado em:

```
NOVO/coverage/index.html
```

---

## ✅ Checklist de Testes

### Antes de Deploy

- [ ] Executar `npm run test:completo`
- [ ] Verificar que todos os testes passaram
- [ ] Verificar relatório de coverage
- [ ] Testar manualmente as funcionalidades críticas
- [ ] Verificar logs de erro

### Após Mudanças

- [ ] Executar testes relacionados à mudança
- [ ] Executar `npm run test:all-endpoints` se mudanças em APIs
- [ ] Executar `npm run test:pages` se mudanças no frontend
- [ ] Validar sintaxe: `node --check arquivo.js`

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"

**Solução:**
```bash
npm install
```

### Erro: "ECONNREFUSED"

**Solução:**
1. Verificar se o servidor está rodando: `npm start`
2. Verificar se a porta está correta (padrão: 3000)

### Erro: "Timeout"

**Solução:**
- Verificar performance do servidor
- Verificar conexão com banco de dados
- Aumentar timeout nos scripts de teste

### Testes falhando

**Solução:**
1. Verificar logs do servidor
2. Verificar conexão com MongoDB
3. Verificar se há dados no banco
4. Verificar variáveis de ambiente

---

## 📚 Referências

- [README de Testes](NOVO/scripts/test/README.md)
- [README de Testes de Páginas](NOVO/scripts/test/TESTE_PAGINAS_README.md)
- [Documentação Vitest](https://vitest.dev/)

---

**Última atualização:** 12/12/2025  
**Versão:** 1.0  
**CÉREBRO X-3**

