# 🧪 Como Executar os Testes do Sistema Crossfilter

## 🚀 Execução Rápida

### 1. Abrir o Dashboard
Acesse o dashboard no navegador: `http://localhost:3000`

### 2. Abrir o Console
Pressione **F12** ou **Ctrl+Shift+I** (Windows/Linux) ou **Cmd+Option+I** (Mac)

### 3. Executar Testes

Cole e execute os comandos abaixo no console:

```javascript
// Teste completo (recomendado)
testCrossfilterComplete.run();

// Teste básico
testCrossfilter.runAll();

// Teste interativo
testCrossfilterInteractive.run();

// Verificar elemento específico
checkElementCrossfilter('.rank-item');
```

## 📊 Tipos de Testes

### 1. Teste Completo (`testCrossfilterComplete.run()`)
**O que testa:**
- ✅ Gráficos de pizza (doughnut/pie)
- ✅ Gráficos de barras
- ✅ Rankings clicáveis
- ✅ Listas clicáveis
- ✅ KPIs reativos
- ✅ Cards clicáveis
- ✅ Integração completa

**Resultado:**
- Relatório completo por categoria
- Contagem de elementos testados
- Status de cada elemento

### 2. Teste Básico (`testCrossfilter.runAll()`)
**O que testa:**
- ✅ Helper carregado
- ✅ Sistemas de filtros disponíveis
- ✅ Gráficos com handlers
- ✅ Aplicação de filtros
- ✅ Limpeza de filtros

**Resultado:**
- Lista de testes executados
- Status de cada teste
- Resumo final

### 3. Teste Interativo (`testCrossfilterInteractive.run()`)
**O que faz:**
- 🖱️ Lista gráficos disponíveis
- 📊 Mostra estado atual dos filtros
- 🧪 Simula cliques em gráficos
- 🧹 Testa limpeza de filtros

**Resultado:**
- Tabela de gráficos disponíveis
- Estado dos filtros antes/depois
- Simulação de interações

### 4. Verificar Elemento (`checkElementCrossfilter(selector)`)
**O que faz:**
- 🔍 Verifica elementos por seletor CSS
- ✅ Valida se são clicáveis
- ✅ Verifica se têm data attributes
- ✅ Mostra tabela de resultados

**Exemplos:**
```javascript
// Verificar rankings
checkElementCrossfilter('.rank-item');

// Verificar temas
checkElementCrossfilter('.tema-item');

// Verificar assuntos
checkElementCrossfilter('.assunto-item');

// Verificar cards de status
checkElementCrossfilter('.status-card');
```

## 📋 Exemplos de Uso

### Exemplo 1: Teste Completo em Página Específica

```javascript
// 1. Navegar para a página (via interface)
// 2. Aguardar carregamento
setTimeout(() => {
  // 3. Executar teste completo
  testCrossfilterComplete.run();
}, 2000);
```

### Exemplo 2: Testar Gráfico Específico

```javascript
// Testar gráfico de tema
testCrossfilter.testChart('chartTema');

// Testar gráfico de status
testCrossfilter.testChart('chartStatusPage');
```

### Exemplo 3: Simular Cliques

```javascript
// Simular clique no gráfico de tema
testCrossfilterInteractive.click('chartTema', 0, false);

// Simular clique com Ctrl (seleção múltipla)
testCrossfilterInteractive.click('chartTema', 1, true);

// Verificar estado após clique
setTimeout(() => {
  testCrossfilterInteractive.checkState();
}, 500);
```

### Exemplo 4: Verificar Múltiplos Elementos

```javascript
// Verificar todos os rankings
['.rank-item', '.tema-item', '.assunto-item'].forEach(selector => {
  console.log(`\nVerificando: ${selector}`);
  checkElementCrossfilter(selector);
});
```

## 🎯 Interpretação dos Resultados

### ✅ Teste Passou
- Elemento está configurado corretamente
- Nenhuma ação necessária

### ❌ Teste Falhou
- Problema detectado
- Verificar console para detalhes
- Verificar se elemento foi renderizado

### ⚠️ Aviso
- Situação não crítica
- Pode ser comportamento esperado
- Exemplo: gráfico não renderizado ainda

## 🔍 Troubleshooting

### "testCrossfilter is not defined"
**Causa:** Scripts de teste não foram carregados  
**Solução:** 
1. Verificar se scripts estão no HTML
2. Recarregar a página
3. Verificar console para erros de carregamento

### "Gráfico não encontrado"
**Causa:** Gráfico ainda não foi renderizado  
**Solução:**
1. Aguardar carregamento da página
2. Navegar para a página específica
3. Aguardar alguns segundos antes de testar

### "Helper não disponível"
**Causa:** Helpers não foram carregados  
**Solução:**
1. Verificar se `crossfilter-helper.js` está no HTML
2. Verificar se `kpi-filter-helper.js` está no HTML
3. Recarregar a página

## 📊 Checklist de Testes

Antes de considerar completo, verificar:

- [ ] `testCrossfilter.runAll()` executa sem erros
- [ ] `testCrossfilterInteractive.run()` executa sem erros
- [ ] `testCrossfilterComplete.run()` executa sem erros
- [ ] `checkElementCrossfilter('.rank-item')` retorna resultados
- [ ] Todos os gráficos são detectados
- [ ] Todos os rankings são clicáveis
- [ ] Todos os KPIs reagem aos filtros
- [ ] Cards são clicáveis

## 🚀 Execução Automática

Para auto-executar testes ao carregar a página, adicione à URL:

```
http://localhost:3000/?test=crossfilter
```

Isso executará `testCrossfilter.runAll()` automaticamente.

---

**CÉREBRO X-3**  
Data: 18/12/2025

