# 📊 ÍNDICE EXECUTIVO - MAPEAMENTO COMPLETO DO SISTEMA

**Última Atualização**: ${new Date().toLocaleString('pt-BR')}

---

## 🎯 VISÃO GERAL

Este documento é um **índice executivo** do mapeamento completo do sistema. Para detalhes completos, consulte:

- **`SISTEMA_ULTRA_DETALHADO.md`** ⭐ - Mapeamento mais completo (recomendado)
- **`SISTEMA_DETALHADO_MAPEADO.md`** - Mapeamento detalhado
- **`SISTEMA_COMPLETO_MAPEADO.md`** - Mapeamento básico

---

## 📊 ESTATÍSTICAS GERAIS

### Banco de Dados
- **Models**: 7
  - `Record` - Manifestações/Ouvidoria
  - `Zeladoria` - Dados de Zeladoria
  - `ChatMessage` - Mensagens do chat
  - `AggregationCache` - Cache de agregações
  - `NotificacaoEmail` - Notificações enviadas
  - `SecretariaInfo` - Informações de secretarias
  - `User` - Usuários do sistema
- **Campos Totais**: 152
- **Índices**: 53 (simples + compostos)

### Sistemas de Cache
- **Total**: 5 sistemas
  1. **dbCache** - Cache no MongoDB
  2. **smartCache** - Cache inteligente com TTL adaptativo
  3. **withCache** - Wrapper de resposta com cache híbrido
  4. **dataStore** - Cache no cliente (localStorage + memória)
  5. **dataLoader** - Carregamento com cache integrado

### Utilitários
- **Total**: 14 utilitários
  - `fieldMapper.js` - Mapeamento de campos
  - `queryOptimizer.js` - Otimização de queries
  - `dateUtils.js` - Utilitários de data
  - `dbAggregations.js` - Agregações do banco
  - `dbCache.js` - Cache no banco
  - `smartCache.js` - Cache inteligente
  - `responseHelper.js` - Helpers de resposta
  - `dataFormatter.js` - Formatação de dados
  - `validateFilters.js` - Validação de filtros
  - E mais...

### Pipelines MongoDB
- **Total**: 7 pipelines
  - `overview.js` - Pipeline da visão geral
  - `tema.js` - Pipeline de temas
  - `assunto.js` - Pipeline de assuntos
  - `status.js` - Pipeline de status
  - `bairro.js` - Pipeline de bairros
  - `categoria.js` - Pipeline de categorias
  - `orgaoMes.js` - Pipeline de órgão e mês

### Páginas
- **Total**: 37 páginas
  - **Ouvidoria**: 21 páginas
  - **Zeladoria**: 11 páginas
  - **Outras**: 5 páginas

### APIs e Controllers
- **Total**: 24 controllers
- **Endpoints**: 100+ endpoints

### Sistemas Globais
- **Total**: 6 sistemas principais
  1. `window.dataLoader` - Carregamento de dados
  2. `window.dataStore` - Cache centralizado
  3. `window.chartFactory` - Fábrica de gráficos
  4. `window.chartCommunication` - Comunicação entre gráficos
  5. `window.advancedCharts` - Gráficos avançados
  6. `window.config` - Configurações

### HTML
- **Páginas Mapeadas**: 54 seções
- **KPIs**: 200+
- **Gráficos**: 72+
- **Cards**: 300+
- **Filtros**: 50+

---

## 🗄️ BANCO DE DADOS - RESUMO

### Model: Record (Ouvidoria)
- **Tabela**: `records`
- **Campos**: 35 campos normalizados
- **Índices**: 25 índices (13 simples + 12 compostos)
- **Principais Campos**:
  - `protocolo`, `dataDaCriacao`, `statusDemanda`, `tipoDeManifestacao`
  - `tema`, `assunto`, `canal`, `orgaos`, `status`
  - `dataCriacaoIso`, `dataConclusaoIso` (para queries otimizadas)

### Model: Zeladoria
- **Tabela**: `zeladoria`
- **Campos**: 20 campos normalizados
- **Índices**: 9 índices (7 simples + 2 compostos)

### Model: AggregationCache
- **Tabela**: `aggregation_cache`
- **Função**: Cache de agregações pré-computadas
- **TTL**: Configurável por chave

---

## 💾 CACHE - RESUMO

### Estratégia Híbrida
1. **Cache no Banco** (MongoDB)
   - Model: `AggregationCache`
   - TTL configurável
   - Expiração automática

2. **Cache em Memória** (Node.js)
   - Cache rápido para requisições frequentes
   - Integrado com cache do banco

3. **Cache no Cliente** (localStorage + Memória)
   - `window.dataStore`
   - Persistência em localStorage
   - Reatividade com listeners

4. **Cache no dataLoader**
   - Deduplicação de requisições
   - Cache integrado com dataStore
   - Timeouts adaptativos

---

## 📄 PÁGINAS PRINCIPAIS

### Ouvidoria (21 páginas)
1. `overview.js` - Visão Geral
2. `orgao-mes.js` - Por Órgão e Mês
3. `tempo-medio.js` - Tempo Médio
4. `vencimento.js` - Vencimentos
5. `tema.js` - Por Tema
6. `assunto.js` - Por Assunto
7. `tipo.js` - Tipos de Manifestação
8. `setor.js` - Por Setor
9. `categoria.js` - Por Categoria
10. `status.js` - Status
11. `bairro.js` - Por Bairro
12. `uac.js` - UACs
13. `responsavel.js` - Responsáveis
14. `canal.js` - Canais
15. `prioridade.js` - Prioridades
16. `cadastrante.js` - Cadastrantes
17. `reclamacoes.js` - Reclamações
18. `secretaria.js` - Secretarias
19. `secretarias-distritos.js` - Secretarias e Distritos
20. `projecao-2026.js` - Projeção 2026
21. `notificacoes.js` - Notificações

### Zeladoria (11 páginas)
1. `zeladoria-overview.js` - Visão Geral
2. `zeladoria-status.js` - Status
3. `zeladoria-categoria.js` - Categoria
4. `zeladoria-departamento.js` - Departamento
5. `zeladoria-bairro.js` - Bairro
6. `zeladoria-responsavel.js` - Responsável
7. `zeladoria-canal.js` - Canal
8. `zeladoria-tempo.js` - Tempo
9. `zeladoria-mensal.js` - Mensal
10. `zeladoria-geografica.js` - Geográfica
11. `zeladoria-colab.js` - Colaboração

---

## 🔄 FLUXO DE DADOS TÍPICO

```
1. Usuário acessa página
   ↓
2. Página chama window.dataLoader.load('/api/endpoint')
   ↓
3. dataLoader verifica window.dataStore.get() (cache cliente)
   ↓
4. Se não há cache, faz requisição HTTP
   ↓
5. Backend: withCache() verifica AggregationCache (MongoDB)
   ↓
6. Se não há cache, executa query no banco
   ↓
7. Salva resultado em AggregationCache
   ↓
8. Retorna dados para frontend
   ↓
9. dataLoader armazena em window.dataStore.set()
   ↓
10. Página renderiza com window.chartFactory.create*Chart()
   ↓
11. Gráficos registrados em window.chartCommunication
   ↓
12. Filtros globais atualizam todas as páginas
```

---

## 📌 COMO USAR

### Gerar Mapeamento Básico
```bash
node maps/map-system.js
```

### Gerar Mapeamento Detalhado
```bash
node maps/map-detailed.js
```

### Gerar Mapeamento ULTRA Detalhado ⭐
```bash
node maps/map-ultra-detailed.js
```

---

## 📚 DOCUMENTAÇÃO GERADA

1. **`SISTEMA_ULTRA_DETALHADO.md`** ⭐ (Mais completo)
   - Schemas do banco
   - Sistemas de cache
   - Utilitários
   - Pipelines
   - Páginas com fluxo de dados
   - Tudo!

2. **`SISTEMA_DETALHADO_MAPEADO.md`**
   - Páginas detalhadas
   - APIs com contexto
   - Gráficos e cards

3. **`SISTEMA_COMPLETO_MAPEADO.md`**
   - Mapeamento básico
   - Visão geral

---

**Para mais detalhes, consulte os arquivos de mapeamento!**

