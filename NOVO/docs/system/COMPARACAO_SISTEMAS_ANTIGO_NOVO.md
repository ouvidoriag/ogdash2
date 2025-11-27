# Comparação: Sistema Antigo vs Sistema Novo

## 📋 Resumo Executivo

Este documento detalha os componentes, funcionalidades e scripts que existem no sistema **ANTIGO** mas que **NÃO** foram migrados para o sistema **NOVO**. O objetivo é identificar o que pode estar faltando e o que precisa ser trazido do sistema antigo.

---

## 🔍 1. Scripts de Análise e Manutenção do Banco de Dados

### Scripts que existem no ANTIGO mas não no NOVO:

#### 1.1. `analyzeAllDbs.js`
- **Localização**: `ANTIGO/scripts/analyzeAllDbs.js`
- **Função**: Analisa todos os bancos de dados SQLite encontrados no projeto
- **Funcionalidades**:
  - Verifica tamanho dos arquivos de banco
  - Lista tabelas em cada banco
  - Conta registros na tabela Record
  - Gera relatório comparativo de múltiplos bancos
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil para análise de múltiplos ambientes, mas o NOVO usa MongoDB Atlas (único banco)

#### 1.2. `analyzeDbStructure.js`
- **Localização**: `ANTIGO/scripts/analyzeDbStructure.js`
- **Função**: Analisa a estrutura completa do banco de dados
- **Funcionalidades**:
  - Conta total de registros
  - Mostra exemplo de registro
  - Analisa campos normalizados disponíveis
  - Calcula percentual de preenchimento de cada campo
  - Mostra distribuição por Status, Órgãos, etc.
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: ⚠️ **IMPORTANTE** - Pode ser útil adaptar para MongoDB

#### 1.3. `checkAllDbs.js`
- **Localização**: `ANTIGO/scripts/checkAllDbs.js`
- **Função**: Verifica todos os bancos de dados encontrados
- **Funcionalidades**:
  - Verifica existência de arquivos de banco
  - Mostra tamanho e caminho
  - Lista tabelas
  - Conta registros
  - Mostra exemplos de campos normalizados
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser adaptado para verificar conexões MongoDB

#### 1.4. `checkDb.js`
- **Localização**: `ANTIGO/scripts/checkDb.js`
- **Função**: Verifica estrutura básica do banco de dados
- **Funcionalidades**:
  - Lista tabelas
  - Verifica se tabela Record existe
  - Aplica schema automaticamente se necessário
  - Conta registros
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: ⚠️ **ÚTIL** - Pode ser adaptado para verificar coleções MongoDB

#### 1.5. `checkDateColumns.js`
- **Localização**: `ANTIGO/scripts/checkDateColumns.js`
- **Função**: Verifica colunas de data no banco
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil para validação de dados

#### 1.6. `checkTimeData.js`
- **Localização**: `ANTIGO/scripts/checkTimeData.js`
- **Função**: Verifica dados de tempo/SLA
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil para validação de SLA

#### 1.7. `consolidateDb.js`
- **Localização**: `ANTIGO/scripts/consolidateDb.js`
- **Função**: Consolida múltiplos bancos SQLite em um único banco
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Não necessário (NOVO usa MongoDB único)

#### 1.8. `resetAllDbs.js`
- **Localização**: `ANTIGO/scripts/resetAllDbs.js`
- **Função**: Reseta todos os bancos de dados encontrados
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Não necessário (NOVO usa MongoDB único)

#### 1.9. `resetDb.js`
- **Localização**: `ANTIGO/scripts/resetDb.js`
- **Função**: Reseta um banco de dados específico
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil para desenvolvimento/testes

#### 1.10. `clearDb.js`
- **Localização**: `ANTIGO/scripts/clearDb.js`
- **Função**: Limpa todos os registros do banco
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil para desenvolvimento/testes

#### 1.11. `clearAndImport.js`
- **Localização**: `ANTIGO/scripts/clearAndImport.js`
- **Função**: Limpa banco e importa dados do Excel
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Funcionalidade similar pode ser útil

#### 1.12. `backfillNormalized.js`
- **Localização**: `ANTIGO/scripts/backfillNormalized.js`
- **Função**: Preenche campos normalizados em registros antigos
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: ⚠️ **IMPORTANTE** - Pode ser necessário para migração de dados

#### 1.13. `insertDataFromStats.js`
- **Localização**: `ANTIGO/scripts/insertDataFromStats.js`
- **Função**: Insere dados a partir de estatísticas
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Verificar se necessário

#### 1.14. `insertSampleData.js`
- **Localização**: `ANTIGO/scripts/insertSampleData.js`
- **Função**: Insere dados de exemplo para testes
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil para desenvolvimento

#### 1.15. `compareExcelDb.js`
- **Localização**: `ANTIGO/scripts/compareExcelDb.js`
- **Função**: Compara dados do Excel com o banco de dados
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: ⚠️ **ÚTIL** - Pode ser adaptado para comparar Google Sheets com MongoDB

#### 1.16. `findExcel.js`
- **Localização**: `ANTIGO/scripts/findExcel.js`
- **Função**: Localiza arquivos Excel no projeto
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Não necessário (NOVO usa Google Sheets)

#### 1.17. `listExcelColumns.js`
- **Localização**: `ANTIGO/scripts/listExcelColumns.js`
- **Função**: Lista colunas de um arquivo Excel
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Não necessário (NOVO usa Google Sheets)

#### 1.18. `importExcel.js`
- **Localização**: `ANTIGO/scripts/importExcel.js`
- **Função**: Importa dados do Excel para o banco
- **Status no NOVO**: ❌ Não existe (mas existe `updateFromExcel.js`)
- **Recomendação**: Verificar se `updateFromExcel.js` cobre todas as funcionalidades

#### 1.19. `analyze-project.js`
- **Localização**: `ANTIGO/scripts/analyze-project.js`
- **Função**: Analisa estrutura completa do projeto
- **Funcionalidades**:
  - Analisa todos os arquivos
  - Mapeia dependências
  - Verifica ordem de carregamento
  - Identifica duplicidades
  - Detecta problemas comuns
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: ⚠️ **ÚTIL** - Pode ser útil para manutenção

#### 1.20. `analyze-load-order.js`
- **Localização**: `ANTIGO/scripts/analyze-load-order.js`
- **Função**: Analisa ordem de carregamento de scripts
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil para otimização

#### 1.21. `verificar-fase1.js`
- **Localização**: `ANTIGO/scripts/verificar-fase1.js`
- **Função**: Verifica implementação da Fase 1
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Específico do projeto antigo

---

## 🎨 2. Scripts Frontend (JavaScript)

### 2.1. `renderKpis.js`
- **Localização**: `ANTIGO/public/scripts/renderKpis.js`
- **Função**: Renderização completa de KPIs no dashboard
- **Funcionalidades**:
  - Renderiza KPIs principais (Total, Últimos 7 dias, Últimos 30 dias)
  - Calcula e exibe deltas percentuais
  - Desenha sparklines para tendências
  - Renderiza gráfico de status (doughnut) com legenda interativa
  - Renderiza gráfico mensal (bar)
  - Renderiza gráfico de SLA (bar)
  - Suporta toggle de visibilidade de status
  - Integração com Chart Factory
- **Status no NOVO**: ✅ **IMPLEMENTADO** - Funcionalidade existe em `NOVO/public/scripts/pages/ouvidoria/overview.js` como função `renderKPIs()`
- **Observação**: A funcionalidade foi integrada no módulo `overview.js` do NOVO, não como arquivo separado

### 2.2. Utilitários Frontend

#### 2.2.1. `diagnostic.js`
- **Localização**: `ANTIGO/public/scripts/utils/diagnostic.js`
- **Função**: Sistema de diagnóstico centralizado
- **Funcionalidades**:
  - Rastreia carregamento de componentes
  - Registra erros e sucessos
  - Verifica existência de elementos DOM
  - Gera relatórios de diagnóstico
  - Auto-relatório após 10 segundos
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: ⚠️ **ÚTIL** - Pode ajudar no debug e monitoramento

#### 2.2.2. `legacy-loader.js`
- **Localização**: `ANTIGO/public/scripts/utils/legacy-loader.js`
- **Função**: Carrega módulos legados sob demanda
- **Funcionalidades**:
  - Identifica páginas que precisam de módulos legados
  - Carrega `data-pages.js` apenas quando necessário
  - Evita carregamento desnecessário
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil se houver módulos legados no NOVO

#### 2.2.3. `namespace-wrapper.js`
- **Localização**: `ANTIGO/public/scripts/utils/namespace-wrapper.js`
- **Função**: Organiza módulos em namespace `window.Dashboard`
- **Funcionalidades**:
  - Cria estrutura organizada: `Dashboard.Utils`, `Dashboard.Data`, `Dashboard.Charts`, etc.
  - Mantém compatibilidade com `window.*` existente
  - Reduz poluição do namespace global
- **Status no NOVO**: ❌ Não existe
- **Recomendação**: Pode ser útil para organização do código

### 2.3. Módulos de Páginas

#### Estrutura ANTIGO:
```
ANTIGO/public/scripts/modules/pages/
  - assunto.js
  - bairro.js
  - canal.js
  - categoria.js
  - prioridade.js
  - responsavel.js
  - setor.js
  - tema.js
  - tipo.js
  - uac.js
```

#### Estrutura NOVO:
```
NOVO/public/scripts/pages/ouvidoria/
  - assunto.js
  - bairro.js
  - cadastrante.js (NOVO)
  - canal.js
  - categoria.js
  - cora-chat.js (NOVO)
  - orgao-mes.js (NOVO)
  - overview.js (NOVO)
  - prioridade.js
  - projecao-2026.js (NOVO)
  - reclamacoes.js (NOVO)
  - responsavel.js
  - secretaria.js (NOVO)
  - secretarias-distritos.js (NOVO)
  - setor.js
  - status.js (NOVO)
  - tema.js
  - tempo-medio.js (NOVO)
  - tipo.js
  - uac.js
  - unidades-saude.js (NOVO)
  - unit.js (NOVO)
  - vencimento.js (NOVO)
```

**Status**: ✅ O NOVO tem mais páginas e melhor organização

---

## 📄 3. Páginas HTML

### 3.1. `chat.html`
- **Localização**: `ANTIGO/public/chat.html`
- **Função**: Página dedicada para o chat com Cora (IA)
- **Características**:
  - Interface completa de chat
  - Design futurista com glassmorphism
  - Carregamento de mensagens do banco
  - Envio e recebimento de mensagens
  - Integração com API `/api/chat/messages`
- **Status no NOVO**: ✅ **IMPLEMENTADO** - Chat está integrado no `index.html` como seção `page-cora-chat` e implementado em `NOVO/public/scripts/pages/ouvidoria/cora-chat.js`
- **Observação**: O NOVO não tem página HTML separada, mas a funcionalidade está completa e integrada no sistema principal

### 3.2. `index.html`
- **ANTIGO**: Arquivo muito grande (4246 linhas) com muito código inline
- **NOVO**: Arquivo menor (3146 linhas) com melhor organização
- **Status**: ✅ NOVO está melhor organizado

---

## 🔧 4. Utilitários Backend

### 4.1. Estrutura de Utilitários

#### ANTIGO (`ANTIGO/src/utils/`):
```
- cacheBuilder.js
- cacheManager.js
- dbCache.js
- districtMapper.js
- fieldMapper.js
- queryOptimizer.js
```

#### NOVO (`NOVO/src/utils/`):
```
- cacheBuilder.js
- cacheManager.js
- dateUtils.js (NOVO)
- dbCache.js
- districtMapper.js
- fieldMapper.js
- geminiHelper.js (NOVO)
- queryOptimizer.js
- responseHelper.js (NOVO)
```

**Status**: ✅ NOVO tem mais utilitários (dateUtils, geminiHelper, responseHelper)

---

## 🗄️ 5. Estrutura de API e Rotas

### ANTIGO:
- **Estrutura**: Rotas definidas diretamente no `server.js` (arquivo muito grande - 5849 linhas)
- **Organização**: Monolítico, tudo em um arquivo

### NOVO:
- **Estrutura**: Organizada em controllers e routes
- **Localização**: `NOVO/src/api/`
- **Controllers** (19 arquivos):
  - aggregateController.js
  - aiController.js
  - cacheController.js
  - chatController.js
  - colabController.js
  - complaintsController.js
  - dashboardController.js
  - distinctController.js
  - filterController.js
  - geographicController.js
  - notificationController.js
  - recordsController.js
  - slaController.js
  - statsController.js
  - summaryController.js
  - unitController.js
  - utilsController.js
  - vencimentoController.js
  - zeladoriaController.js
- **Routes** (11 arquivos):
  - aggregate.js
  - ai.js
  - cache.js
  - chat.js
  - colab.js
  - data.js
  - geographic.js
  - index.js
  - notifications.js
  - stats.js
  - zeladoria.js

**Status**: ✅ NOVO tem arquitetura muito melhor organizada

---

## 📦 6. Dependências e Scripts NPM

### package.json - Scripts

#### ANTIGO:
```json
{
  "import:excel": "node scripts/importExcel.js",
  "update:excel": "node scripts/updateFromExcel.js",
  "db:backfill": "node scripts/backfillNormalized.js",
  "db:reset": "node scripts/resetDb.js",
  "db:analyze": "node scripts/analyzeDbStructure.js",
  "cache:clear": "node scripts/clearCache.js",
  "test": "node scripts/run-tests.js",
  "test:all": "node scripts/test-all-pages.js",
  "test:completo": "node scripts/test-completo-real.js",
  "test:real": "node scripts/test-completo-real.js",
  "fix:prisma": "node scripts/fix-prisma.js"
}
```

#### NOVO:
```json
{
  "update:excel": "node scripts/data/updateFromExcel.js",
  "update:sheets": "node scripts/data/updateFromGoogleSheets.js",
  "test:sheets": "node scripts/test/testGoogleSheets.js",
  "pipeline": "node scripts/data/runPipeline.js",
  "setup:python": "node scripts/setup/setup-python.js",
  "clean:old": "node scripts/maintenance/limpar-arquivos-antigos.js",
  "map:system": "node scripts/maintenance/mapear-sistema.js",
  "import:zeladoria": "node scripts/data/importZeladoria.js",
  "test:pages": "node scripts/test/run-page-tests.js",
  "test:all": "node scripts/test/test-all-pages.js",
  "gmail:auth": "node scripts/email/autorizar-gmail.js",
  "email:saude": "node scripts/email/enviar-email-saude.js",
  "email:real": "node scripts/email/enviar-email-real.js"
}
```

**Diferenças**:
- ❌ ANTIGO tem `import:excel` - NOVO não tem (mas tem `update:excel`)
- ❌ ANTIGO tem `db:backfill` - NOVO não tem
- ❌ ANTIGO tem `db:reset` - NOVO não tem
- ❌ ANTIGO tem `db:analyze` - NOVO não tem
- ❌ ANTIGO tem `cache:clear` - NOVO não tem
- ❌ ANTIGO tem `fix:prisma` - NOVO não tem
- ✅ NOVO tem scripts de email (Gmail)
- ✅ NOVO tem scripts de pipeline Python
- ✅ NOVO tem scripts de manutenção organizados

---

## 🎯 7. Funcionalidades Específicas

### 7.1. Sistema de Rotação de Chaves Gemini
- **ANTIGO**: Implementado no `server.js` com array de chaves e rotação automática
- **NOVO**: ⚠️ **VERIFICAR** - Pode estar em `geminiHelper.js`

### 7.2. Sistema de Cache
- **ANTIGO**: `cacheManager.js`, `cacheBuilder.js`, `dbCache.js`
- **NOVO**: Mesmos arquivos existem
- **Status**: ✅ Funcionalidade mantida

### 7.3. Mapeamento de Distritos
- **ANTIGO**: `districtMapper.js`
- **NOVO**: Existe
- **Status**: ✅ Funcionalidade mantida

### 7.4. Normalização de Campos
- **ANTIGO**: `fieldMapper.js`
- **NOVO**: Existe
- **Status**: ✅ Funcionalidade mantida

### 7.5. Otimização de Queries
- **ANTIGO**: `queryOptimizer.js`
- **NOVO**: Existe
- **Status**: ✅ Funcionalidade mantida

---

## 📊 8. Resumo de Funcionalidades Faltantes

### 🔴 CRÍTICO (Deve ser trazido):
1. ~~**`renderKpis.js`**~~ ✅ **JÁ IMPLEMENTADO** - Existe em `overview.js`
2. **`backfillNormalized.js`** - Pode ser necessário para migração de dados
3. **`analyzeDbStructure.js`** - Útil para análise e debug (adaptar para MongoDB)
4. **`checkDb.js`** - Útil para verificação de estrutura (adaptar para MongoDB)

### 🟡 IMPORTANTE (Recomendado trazer):
1. **`diagnostic.js`** - Sistema de diagnóstico pode ajudar no debug
2. **`compareExcelDb.js`** - Adaptar para comparar Google Sheets com MongoDB
3. ~~**`chat.html`**~~ ✅ **JÁ IMPLEMENTADO** - Chat integrado em `cora-chat.js` e `index.html`
4. **Scripts de teste** - `test:completo`, `test:real` do ANTIGO

### 🟢 ÚTIL (Pode ser útil):
1. **`analyze-project.js`** - Para análise de estrutura do projeto
2. **`namespace-wrapper.js`** - Para organização do código frontend
3. **`legacy-loader.js`** - Se houver módulos legados
4. **Scripts de reset/clear** - Para desenvolvimento/testes

### ⚪ NÃO NECESSÁRIO (Específico do ANTIGO):
1. Scripts relacionados a múltiplos bancos SQLite (NOVO usa MongoDB único)
2. Scripts de importação Excel puro (NOVO usa Google Sheets)
3. Scripts específicos de verificação de fase do projeto antigo

---

## 🔄 9. Recomendações de Migração

### Prioridade ALTA:
1. ✅ ~~Verificar se `renderKpis.js` está implementado no NOVO~~ **CONFIRMADO** - Implementado em `overview.js`
2. ✅ Adaptar `analyzeDbStructure.js` para MongoDB
3. ✅ Adaptar `checkDb.js` para MongoDB
4. ✅ ~~Verificar se chat está implementado~~ **CONFIRMADO** - Implementado em `cora-chat.js`

### Prioridade MÉDIA:
1. ⚠️ Trazer `diagnostic.js` para debug
2. ⚠️ Adaptar `compareExcelDb.js` para Google Sheets
3. ⚠️ Trazer scripts de backfill se necessário para migração

### Prioridade BAIXA:
1. 📝 Trazer scripts de análise de projeto
2. 📝 Trazer namespace-wrapper se necessário
3. 📝 Trazer scripts de teste se úteis

---

## 📝 10. Notas Finais

### Pontos Positivos do NOVO:
- ✅ Melhor organização de código (controllers/routes separados)
- ✅ Mais páginas e funcionalidades
- ✅ Integração com Google Sheets
- ✅ Sistema de email (Gmail)
- ✅ Pipeline Python
- ✅ Melhor estrutura de pastas
- ✅ Scripts de manutenção organizados

### Pontos que podem estar faltando:
- ⚠️ Scripts de análise de banco de dados (adaptar para MongoDB)
- ⚠️ Sistema de diagnóstico frontend
- ⚠️ Página de chat separada (verificar se existe)
- ⚠️ Scripts de backfill/normalização de dados

### Próximos Passos:
1. Verificar se funcionalidades críticas estão implementadas de outra forma
2. Adaptar scripts úteis do ANTIGO para arquitetura do NOVO
3. Testar funcionalidades do NOVO para garantir que nada está faltando
4. Documentar diferenças de comportamento se houver

---

**Data de Criação**: 2024
**Última Atualização**: 2024
**Autor**: Análise Automatizada de Comparação de Sistemas

