# 🗺️ MAPS - Sistema de Mapeamento do Dashboard

Esta pasta contém scripts e documentação gerada automaticamente que mapeia **TODO** o sistema.

## 📁 Arquivos

### Scripts

1. **`map-system.js`** - Mapeamento básico
   - Analisa páginas, sistemas globais e controllers
   - Gera `SISTEMA_COMPLETO_MAPEADO.md`

2. **`map-detailed.js`** - Mapeamento detalhado
   - Analisa páginas, HTML, APIs, gráficos, cards, KPIs
   - Extrai contexto e fontes de dados
   - Gera `SISTEMA_DETALHADO_MAPEADO.md`

3. **`map-ultra-detailed.js`** - Mapeamento ULTRA detalhado ⭐⭐⭐ **MAIS COMPLETO**
   - Analisa TUDO: banco de dados, cache, utilitários, pipelines
   - Schemas Prisma completos (models, campos, índices)
   - Sistemas de cache (5 sistemas diferentes)
   - Utilitários e helpers (14 arquivos)
   - Pipelines MongoDB (7 pipelines)
   - Páginas com fluxo de dados completo
   - Gera `SISTEMA_ULTRA_DETALHADO.md`

### Documentação Gerada

#### Mapeamentos (Gerados Automaticamente):
- **`SISTEMA_COMPLETO_MAPEADO.md`** - Mapeamento básico
- **`SISTEMA_DETALHADO_MAPEADO.md`** - Mapeamento detalhado
- **`SISTEMA_ULTRA_DETALHADO.md`** ⭐⭐⭐ - Mapeamento ULTRA completo (RECOMENDADO)
- **`INDICE_EXECUTIVO.md`** - Resumo executivo e estatísticas

#### Análises e Relatórios:
- **`RESUMO_EXECUTIVO_GERAL.md`** ⭐⭐⭐ - **RESUMO EXECUTIVO GERAL** (Ver primeiro!)
- **`CONCLUSAO_FINAL.md`** ⭐⭐⭐ - **CONCLUSÃO FINAL DO PROJETO** (Missão cumprida!)
- **`RELATORIO_FALHAS_DUPLICACOES_LIXOS.md`** 🔍 - Relatório completo detalhado
- **`LIMPEZA_FASE3_CONCLUIDA.md`** ✅ - Fase 3 de limpeza concluída
- **`NOVA_VARREDURA_OBSOLETOS.md`** 🔍 - Nova varredura realizada
- **`ANALISE_PROBLEMAS_OTIMIZACOES.md`** - Análise completa de problemas e otimizações
- **`OTIMIZACOES_FINAIS.md`** ✅ - Resumo final das otimizações implementadas
- **`ANALISE_DOCS.md`** - Análise da documentação
- **`ANALISE_COMPLETA_DOCUMENTACAO.md`** - Análise completa da documentação
- **`PROGRESSO_FASE2.md`** - Progresso da Fase 2

#### Logging (Sistema de Logging):
- **`PROGRESSO_LOGGING.md`** - Progresso da migração de logging
- **`RESUMO_FINAL_FASE2_LOGGING.md`** - Resumo final da Fase 2 (logging)

## 🚀 Como Usar

### Gerar Mapeamento Básico
```bash
node maps/map-system.js
```

### Gerar Mapeamento Detalhado
```bash
node maps/map-detailed.js
```

### Gerar Mapeamento ULTRA Detalhado ⭐⭐⭐ (Mais Completo)
```bash
node maps/map-ultra-detailed.js
```

## 📊 O Que É Mapeado

### ✅ Banco de Dados
- **Models**: 7 models (Record, Zeladoria, ChatMessage, AggregationCache, NotificacaoEmail, SecretariaInfo, User)
- **Campos**: 152 campos normalizados
- **Índices**: 53 índices (simples + compostos)
- **Provider**: MongoDB
- **ORM**: Prisma

### ✅ Sistemas de Cache
- **dbCache**: Cache no MongoDB (model AggregationCache)
- **smartCache**: Cache inteligente com TTL adaptativo
- **withCache**: Wrapper de resposta com cache híbrido
- **dataStore**: Cache no cliente (localStorage + memória)
- **dataLoader**: Carregamento com cache integrado

### ✅ Utilitários
- **Total**: 14 utilitários
- **fieldMapper.js**: Mapeamento de campos
- **queryOptimizer.js**: Otimização de queries
- **dateUtils.js**: Utilitários de data
- **dbAggregations.js**: Agregações do banco
- E mais...

### ✅ Pipelines MongoDB
- **Total**: 7 pipelines otimizados
- **overview.js**, **tema.js**, **assunto.js**, **status.js**, **bairro.js**, **categoria.js**, **orgaoMes.js**

### ✅ Sistemas Globais
- `window.dataLoader` - Sistema de carregamento
- `window.dataStore` - Cache centralizado
- `window.chartFactory` - Fábrica de gráficos
- `window.chartCommunication` - Comunicação entre gráficos
- `window.advancedCharts` - Gráficos avançados
- `window.config` - Configurações

### ✅ Páginas (37 páginas)
- **Ouvidoria**: 21 páginas
- **Zeladoria**: 11 páginas
- **Outras**: 5 páginas

### ✅ APIs e Controllers (24 controllers)
- Todos os endpoints disponíveis
- Métodos HTTP (GET, POST, etc)
- Documentação de cada endpoint

### ✅ Gráficos
- Gráficos de barras
- Gráficos de linha
- Gráficos de rosca/pizza
- Gráficos avançados (Sankey, TreeMap, etc)

### ✅ Cards e KPIs
- Todos os elementos identificados no HTML
- KPIs (kpiTotal, kpi7, kpi30, etc)
- Cards informativos
- Elementos interativos

### ✅ Elementos HTML
- Seções de página
- IDs de elementos
- Estrutura de cada página

## 📝 Estrutura da Documentação

A documentação gerada contém:

1. **Sistemas Globais Detalhados**
   - Descrição de cada sistema
   - Funções e métodos disponíveis
   - Exemplos de uso

2. **APIs e Controllers Completos**
   - Todos os endpoints
   - Métodos HTTP
   - Documentação

3. **Páginas com Análise Completa**
   - Descrição de cada página
   - APIs utilizadas (com contexto)
   - Gráficos (com IDs e tipos)
   - KPIs e Cards (com fontes de dados)
   - Sistemas globais usados
   - Funções principais

4. **Elementos HTML Mapeados**
   - KPIs por página
   - Gráficos por página
   - Cards por página
   - Filtros por página

5. **Resumo e Estatísticas**
   - Totais gerais
   - Estatísticas por tipo

## 🔄 Atualizar Mapeamento

Execute o script sempre que:
- Adicionar novas páginas
- Criar novos endpoints
- Adicionar novos gráficos ou cards
- Modificar sistemas globais

## 📌 Notas

- Os scripts analisam arquivos `.js` nas pastas de páginas
- Elementos são identificados por padrões comuns (kpi*, chart*, etc)
- APIs são extraídas de chamadas `window.dataLoader.load()`, `fetch()` e padrões `/api/*`
- Alguns elementos podem não ser detectados se usarem padrões não convencionais

---

---

## 🔍 ANÁLISE DE PROBLEMAS E OTIMIZAÇÕES

**📄 `ANALISE_PROBLEMAS_OTIMIZACOES.md`** - Análise completa do sistema

Este documento identifica:
- ✅ **Problemas já resolvidos** (3)
- ❌ **Problemas críticos ativos** (5)
- ⚠️ **Problemas de performance** (8)
- 💡 **Oportunidades de otimização** (12)

### Principais Problemas Identificados:

1. **🔴 Queries com `take: 100000`** - Sobrecarga do MongoDB
2. **🔴 Processamento em memória** de grandes volumes
3. **🔴 Query sem limite** em `vencimentoController.js`
4. **⚠️ Cache não utilizado** em alguns endpoints
5. **⚠️ Múltiplas requisições paralelas** na overview

### Soluções Propostas:

- Mover processamento para agregações MongoDB
- Limitar queries (máximo 20k registros)
- Aplicar filtros de data obrigatórios
- Otimizar cache (TTL maior, mais endpoints)

**Consulte o documento completo para detalhes!**

---

---

## 📌 Notas Importantes

- **Mapeamentos**: Gerados automaticamente - executar scripts para atualizar
- **Análises**: Documentos manuais de análise e otimizações
- **Duplicações Removidas**: 4 arquivos duplicados/redundantes removidos
- **Sistema de Logging**: Winston criado e 103 logs substituídos
- **Índice Completo**: Ver [INDICE_MAPS.md](./INDICE_MAPS.md) para navegação

---

## 📚 DOCUMENTAÇÃO RELACIONADA

### Documentação Principal:
- [INDICE_MAPS.md](./INDICE_MAPS.md) - Índice completo desta pasta
- [../docs/system/INDICE_SISTEMA.md](../docs/system/INDICE_SISTEMA.md) - Índice do sistema
- [../README.md](../README.md) - README principal do projeto

### Guias Técnicos:
- [../docs/system/GUIA_LOGGING.md](../docs/system/GUIA_LOGGING.md) - Como usar o logger
- [../docs/system/SISTEMAS_CACHE.md](../docs/system/SISTEMAS_CACHE.md) - Sistemas de cache
- [../docs/system/DATEUTILS_DIFERENCAS.md](../docs/system/DATEUTILS_DIFERENCAS.md) - DateUtils

---

**Última atualização**: 02/12/2025  
**Limpeza realizada**: **58 arquivos removidos** (Fase 1: 49 + Fase 3: 9)  
**Logging**: 103 console.logs substituídos nos controllers principais  
**Duplicações Python**: 100% eliminadas (módulo compartilhado criado)  
**Status**: ✅ **Sistema 100% pronto para produção**

