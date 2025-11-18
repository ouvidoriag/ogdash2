# 🔍 ANÁLISE: PROBLEMAS DE GRÁFICOS NÃO APARECENDO

**Data:** Janeiro 2025  
**Objetivo:** Identificar e corrigir problemas de mapeamento de campos em todas as páginas

---

## 🚨 PROBLEMA IDENTIFICADO

### Problema Principal: Mapeamento de Campos Incorreto

**Sintoma:** Gráficos não aparecem ou mostram dados zerados

**Causa:** Endpoints retornam campos com nomes diferentes do esperado pelo código frontend

**Exemplo (Tempo Médio):**
- ❌ Código esperava: `o.average || o.media`
- ✅ Endpoint retorna: `o.dias`
- ✅ Solução: Usar `o.dias || o.average || o.media`

---

## 📋 PÁGINAS VERIFICADAS

### ✅ Páginas Corrigidas
1. ✅ `tempo-medio.js` - Corrigido mapeamento de `dias`

### ⚠️ Páginas a Verificar

#### 1. `projecao-2026.js`
**Status:** ⚠️ Verificar
- Usa `x.count` - ✅ Correto
- Usa `x.ym || x.month` - ✅ Correto
- Usa `item.theme || item.tema || item._id` - ✅ Correto
- Usa `item.count || item.quantidade` - ✅ Correto

#### 2. `cadastrante.js`
**Status:** ⚠️ Verificar
- Usa `item.quantidade || item.count` - ✅ Correto
- Usa `item.servidor || item.key || item._id` - ✅ Correto
- Usa `x.count` - ✅ Correto
- Usa `x.ym || x.month` - ✅ Correto

#### 3. `orgao-mes.js`
**Status:** ⚠️ Verificar
- Usa `item.count` - ✅ Correto
- Usa `item.key || item.organ || item._id` - ✅ Correto
- Usa `x.count` - ✅ Correto
- Usa `x.ym || x.month` - ✅ Correto

#### 4. `tema.js`
**Status:** ⚠️ Verificar
- Usa `t.theme || t._id` - ✅ Correto
- Usa `t.count` - ✅ Correto
- Usa `status.status || status._id` - ✅ Correto
- Usa `d.theme || d._id` - ✅ Correto
- Usa `d.month || d.ym` - ✅ Correto

#### 5. `assunto.js`
**Status:** ⚠️ Verificar
- Usa `a.subject || a._id` - ✅ Correto
- Usa `a.count` - ✅ Correto
- Usa `d.subject || d._id` - ✅ Correto
- Usa `d.month || d.ym` - ✅ Correto

#### 6. `categoria.js`
**Status:** ⚠️ Verificar
- Usa `x.key || x._id` - ✅ Correto
- Usa `x.count` - ✅ Correto
- Usa `d.categoria || d._id` - ✅ Correto
- Usa `d.month || d.ym` - ✅ Correto

#### 7. `bairro.js`
**Status:** ⚠️ Verificar
- Usa `x.key || x._id` - ✅ Correto
- Usa `x.count` - ✅ Correto
- Usa `d.bairro || d._id` - ✅ Correto
- Usa `d.month || d.ym` - ✅ Correto

#### 8. `status.js`
**Status:** ⚠️ Verificar
- Usa `s.status || s._id` - ✅ Correto
- Usa `s.count` - ✅ Correto
- Usa `d.status || d._id` - ✅ Correto
- Usa `d.month || d.ym` - ✅ Correto

#### 9. `reclamacoes.js`
**Status:** ⚠️ Verificar
- Usa `item.quantidade || item.count` - ✅ Correto
- Usa `item.assunto || item.key || item._id` - ✅ Correto
- Usa `t.tipo || t.key || t._id` - ✅ Correto
- Usa `t.quantidade || t.count` - ✅ Correto
- Usa `x.count` - ✅ Correto

#### 10. `unit.js`
**Status:** ⚠️ Verificar
- Usa `item.quantidade || item.count` - ✅ Correto
- Usa `item.assunto || item.key || item._id` - ✅ Correto
- Usa `t.tipo || t.key || t._id` - ✅ Correto
- Usa `t.quantidade || t.count` - ✅ Correto

#### 11. `overview.js`
**Status:** ⚠️ Verificar
- Usa `m.count` - ✅ Correto
- Usa `s.status || s._id` - ✅ Correto
- Usa `s.count` - ✅ Correto
- Usa `o.organ || o._id` - ✅ Correto
- Usa `o.count` - ✅ Correto
- Usa `t.theme || t._id` - ✅ Correto
- Usa `t.count` - ✅ Correto

---

## 🔧 PADRÕES DE MAPEAMENTO IDENTIFICADOS

### Campos de Contagem
- ✅ `count` - Padrão mais comum
- ✅ `quantidade` - Usado em alguns endpoints
- ✅ Fallback: `count || quantidade || 0`

### Campos de Identificação
- ✅ `key` - Padrão para agregações
- ✅ `_id` - Padrão MongoDB
- ✅ Campos específicos: `theme`, `subject`, `status`, `organ`, etc.
- ✅ Fallback: `campo || key || _id || 'N/A'`

### Campos de Data/Mês
- ✅ `month` - Padrão novo
- ✅ `ym` - Padrão antigo (YYYY-MM)
- ✅ Fallback: `month || ym || ''`

### Campos de Tempo Médio
- ✅ `dias` - Padrão do endpoint `/api/stats/average-time/*`
- ✅ `average` - Fallback
- ✅ `media` - Fallback
- ✅ Fallback: `dias || average || media || 0`

---

## ✅ CHECKLIST DE CORREÇÕES

### Páginas com Gráficos de Tempo Médio
- [x] ✅ `tempo-medio.js` - Corrigido

### Páginas com Gráficos de Múltiplos Datasets
- [ ] ⚠️ `projecao-2026.js` - Verificar se precisa de legenda interativa
- [ ] ⚠️ `tempo-medio.js` - `chartTempoMedioUnidadeMes` precisa de legenda
- [ ] ⚠️ `tema.js` - `chartTemaMes` precisa de legenda
- [ ] ⚠️ `assunto.js` - `chartAssuntoMes` precisa de legenda
- [ ] ⚠️ `categoria.js` - `chartCategoriaMes` precisa de legenda
- [ ] ⚠️ `bairro.js` - `chartBairroMes` precisa de legenda
- [ ] ⚠️ `status.js` - `chartStatusMes` precisa de legenda

### Páginas com Validações Faltando
- [ ] ⚠️ Adicionar validações robustas em todas as páginas
- [ ] ⚠️ Verificar se dados são arrays válidos
- [ ] ⚠️ Verificar se há dados antes de renderizar
- [ ] ⚠️ Adicionar tratamento de erros

---

## 🎯 PRÓXIMOS PASSOS

1. **Adicionar legenda interativa** em gráficos de linha múltipla
2. **Adicionar validações robustas** em todas as páginas
3. **Testar todas as páginas** para garantir que gráficos aparecem
4. **Documentar padrões de mapeamento** para referência futura

---

**Última atualização:** Janeiro 2025  
**Status:** ⚠️ **EM ANÁLISE** - Verificando todas as páginas

