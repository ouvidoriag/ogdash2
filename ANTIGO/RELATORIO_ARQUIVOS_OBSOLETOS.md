# 🗑️ Relatório de Arquivos Obsoletos e Não Utilizados

**Data:** 2025-01-27  
**Sistema:** Dashboard de Ouvidoria - Duque de Caxias

---

## 📋 Resumo Executivo

Este relatório identifica arquivos, scripts e documentos que estão obsoletos, não são mais utilizados ou podem ser removidos do projeto para manter o código limpo e organizado.

---

## 🔴 SCRIPTS NÃO REFERENCIADOS (Pode Remover)

### Scripts de Análise/Refatoração (Temporários)

Estes scripts foram criados para análise e refatoração, mas não são mais necessários:

1. **`scripts/start-refactoring.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Script temporário para iniciar refatoração da Fase 1
   - **Ação:** ✅ **PODE REMOVER** - Refatoração já foi concluída

2. **`scripts/verificar-fase1.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Verificação da Fase 1 de refatoração
   - **Ação:** ✅ **PODE REMOVER** - Fase 1 já foi concluída

3. **`scripts/analyze-load-order.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Análise de ordem de carregamento de scripts
   - **Ação:** ✅ **PODE REMOVER** - Análise já foi concluída

4. **`scripts/analyze-project.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Análise geral do projeto
   - **Ação:** ⚠️ **MANTER SE ÚTIL** - Pode ser útil para análises futuras, mas considerar mover para pasta `scripts/analysis/` ou remover

### Scripts de Teste/Desenvolvimento

5. **`scripts/insertSampleData.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Inserir dados de exemplo/teste
   - **Ação:** ✅ **PODE REMOVER** - Dados reais já estão sendo usados

6. **`scripts/insertDataFromStats.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Inserir dados de estatísticas
   - **Ação:** ⚠️ **VERIFICAR** - Pode ser útil para migração de dados, mas provavelmente não é mais necessário

7. **`scripts/consolidateDb.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Consolidar banco de dados
   - **Ação:** ⚠️ **VERIFICAR** - Pode ser útil para manutenção, mas provavelmente não é mais necessário

### Scripts de Verificação (Possivelmente Obsoletos)

8. **`scripts/checkAllDbs.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Verificar todos os bancos de dados
   - **Ação:** ⚠️ **MANTER SE ÚTIL** - Pode ser útil para diagnóstico, mas considerar consolidar com `checkDb.js`

9. **`scripts/checkTimeData.js`**
   - **Status:** ❌ Não referenciado no package.json
   - **Uso:** Verificar dados de tempo
   - **Ação:** ✅ **PODE REMOVER** - Funcionalidade específica que provavelmente não é mais necessária

10. **`scripts/checkDateColumns.js`**
    - **Status:** ❌ Não referenciado no package.json
    - **Uso:** Verificar colunas de data
    - **Ação:** ✅ **PODE REMOVER** - Funcionalidade específica que provavelmente não é mais necessária

11. **`scripts/analyzeAllDbs.js`**
    - **Status:** ❌ Não referenciado no package.json
    - **Uso:** Analisar todos os bancos de dados
    - **Ação:** ⚠️ **MANTER SE ÚTIL** - Pode ser útil para diagnóstico, mas considerar consolidar com `analyzeDbStructure.js`

---

## 📄 DOCUMENTOS OBSOLETOS OU DUPLICADOS

### Documentos Temporários de Diagnóstico

1. **`DIAGNOSTICO-SISTEMA.md`** (raiz)
   - **Status:** ⚠️ Documento temporário
   - **Uso:** Documentação de sistema de diagnóstico implementado
   - **Ação:** ⚠️ **CONSIDERAR MOVER** para `docs/` ou **REMOVER** se já foi integrado ao README

2. **`EXPLICACAO-CARREGAMENTO-PAGINAS.md`** (raiz)
   - **Status:** ⚠️ Documento temporário
   - **Uso:** Explicação de como as páginas carregam dados
   - **Ação:** ⚠️ **CONSIDERAR MOVER** para `docs/` ou integrar ao README principal

### Documentos em Wellington/docs (Possivelmente Desatualizados)

3. **`Wellington/docs/INDICE_ANALISE_COMPLETA.md`**
   - **Status:** ⚠️ Pode estar desatualizado
   - **Uso:** Índice de análise do sistema Cora Colab Bot
   - **Ação:** ⚠️ **VERIFICAR** se ainda é relevante para o Dashboard atual

4. **`Wellington/docs/INDICE_DOCUMENTACAO.md`**
   - **Status:** ⚠️ Pode estar desatualizado
   - **Uso:** Índice de documentação do sistema Cora Colab Bot
   - **Ação:** ⚠️ **VERIFICAR** se ainda é relevante para o Dashboard atual

5. **Múltiplos documentos em `Wellington/docs/`**
   - **Status:** ⚠️ Muitos documentos podem estar desatualizados
   - **Ação:** ⚠️ **REVISAR** todos os documentos e identificar quais são específicos do bot (não do dashboard)

---

## 🗂️ ARQUIVOS DE BUILD/TEMPORÁRIOS

### Arquivos Compilados

1. **`Wellington/build/`** (diretório inteiro)
   - **Status:** ❌ Arquivos compilados
   - **Conteúdo:** Arquivos `.js` e `.js.map` compilados
   - **Ação:** ✅ **PODE REMOVER** - Arquivos de build devem estar no `.gitignore` e não devem ser versionados

2. **`Wellington/build/historical/`**
   - **Status:** ❌ Arquivos históricos de build
   - **Ação:** ✅ **PODE REMOVER** - Arquivos históricos não são necessários

### Arquivos Batch/Script

3. **`fix-prisma.bat`**
   - **Status:** ⚠️ Script de correção específico
   - **Uso:** Corrigir problemas do Prisma
   - **Ação:** ⚠️ **MANTER** se ainda for útil, mas considerar documentar no README

4. **`stop-all-servers.bat`** e **`stop-all-servers.ps1`**
   - **Status:** ⚠️ Scripts utilitários
   - **Uso:** Parar todos os servidores
   - **Ação:** ⚠️ **MANTER** se forem úteis, mas considerar consolidar em um único script

---

## 📊 ESTATÍSTICAS

### Scripts Identificados
- **Total de scripts analisados:** 28
- **Scripts não referenciados:** 11 (39%)
- **Scripts que podem ser removidos:** 6 (21%)
- **Scripts que devem ser verificados:** 5 (18%)

### Documentos Identificados
- **Documentos temporários na raiz:** 2
- **Documentos em Wellington/docs:** 17+ (precisam revisão)

### Arquivos de Build
- **Diretórios de build:** 1 (`Wellington/build/`)
- **Arquivos compilados:** 20+ arquivos `.js` e `.js.map`

---

## ✅ RECOMENDAÇÕES DE AÇÃO

### Prioridade Alta (Remover Imediatamente)

1. ✅ Remover `scripts/start-refactoring.js`
2. ✅ Remover `scripts/verificar-fase1.js`
3. ✅ Remover `scripts/analyze-load-order.js`
4. ✅ Remover `scripts/checkTimeData.js`
5. ✅ Remover `scripts/checkDateColumns.js`
6. ✅ Remover `scripts/insertSampleData.js`
7. ✅ Remover diretório `Wellington/build/` (adicionar ao `.gitignore` se ainda não estiver)

### Prioridade Média (Verificar e Decidir)

1. ⚠️ Revisar `scripts/analyze-project.js` - manter se útil, caso contrário remover
2. ⚠️ Revisar `scripts/insertDataFromStats.js` - remover se não for mais necessário
3. ⚠️ Revisar `scripts/consolidateDb.js` - remover se não for mais necessário
4. ⚠️ Revisar `scripts/checkAllDbs.js` - consolidar com `checkDb.js` ou remover
5. ⚠️ Revisar `scripts/analyzeAllDbs.js` - consolidar com `analyzeDbStructure.js` ou remover
6. ⚠️ Mover ou remover `DIAGNOSTICO-SISTEMA.md`
7. ⚠️ Mover ou remover `EXPLICACAO-CARREGAMENTO-PAGINAS.md`

### Prioridade Baixa (Organizar)

1. 📁 Revisar todos os documentos em `Wellington/docs/` e identificar quais são específicos do bot vs dashboard
2. 📁 Considerar criar estrutura `docs/` na raiz para documentação do dashboard
3. 📁 Documentar scripts utilitários (`fix-prisma.bat`, `stop-all-servers.*`) no README

---

## 🔍 COMO VERIFICAR ANTES DE REMOVER

Antes de remover qualquer arquivo, verifique:

1. **Buscar referências:**
   ```bash
   grep -r "nome-do-arquivo" .
   ```

2. **Verificar histórico do git:**
   ```bash
   git log --all --full-history -- "caminho/do/arquivo"
   ```

3. **Verificar se está em uso:**
   - Verificar imports/requires
   - Verificar referências em documentação
   - Verificar se é chamado por outros scripts

---

## 📝 CHECKLIST DE LIMPEZA

- [ ] Remover scripts de refatoração concluída
- [ ] Remover scripts de teste não utilizados
- [ ] Remover arquivos de build
- [ ] Revisar e organizar documentos
- [ ] Atualizar `.gitignore` se necessário
- [ ] Atualizar README se scripts foram removidos
- [ ] Fazer commit das mudanças
- [ ] Verificar se o sistema ainda funciona após limpeza

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar este relatório** e confirmar quais arquivos podem ser removidos
2. **Fazer backup** antes de remover (git já faz isso, mas é bom ter certeza)
3. **Remover arquivos** seguindo as recomendações
4. **Testar o sistema** após a limpeza
5. **Atualizar documentação** se necessário

---

**📅 Data do Relatório:** 2025-01-27  
**👤 Gerado por:** Análise automática do sistema

