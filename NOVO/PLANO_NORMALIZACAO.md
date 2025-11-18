# 📋 Plano de Normalização de Campos

## ✅ O que foi feito

### 1. Schema do Prisma Atualizado
- ✅ Adicionado campo `categoria` (String?)
- ✅ Adicionado campo `bairro` (String?)
- ✅ Adicionados índices para `categoria` e `bairro`

### 2. Código Atualizado
- ✅ `fieldMapper.js` - Mapeamento atualizado para usar campos normalizados
- ✅ `aggregateController.js` - Simplificado para usar apenas campos normalizados
- ✅ Cache versionado para `v4` (invalida cache antigo)

### 3. Script de Migração Criado
- ✅ `scripts/normalizeFields.js` - Script para normalizar dados existentes

---

## 🚀 Como Executar a Normalização

### Passo 1: Atualizar o Schema do Banco
```bash
cd NOVO
npm run prisma:push
```

Isso vai adicionar as novas colunas `categoria` e `bairro` ao banco de dados.

### Passo 2: Normalizar Dados Existentes
```bash
npm run db:normalize
```

Este script vai:
- Buscar todos os registros que têm `categoria` ou `bairro` no JSON
- Extrair esses valores e preencher as novas colunas normalizadas
- Processar em lotes de 10.000 registros
- Mostrar progresso e estatísticas

### Passo 3: Regenerar Prisma Client
```bash
npm run prisma:generate
```

### Passo 4: Reiniciar o Servidor
```bash
npm start
```

---

## 📊 Benefícios da Normalização

### Antes (Campos no JSON):
```javascript
// ❌ LENTO - precisa ler JSON inteiro
const rows = await prisma.record.findMany({
  select: { data: true } // Carrega JSON completo
});

// Processar em memória
for (const r of rows) {
  const categoria = r.data?.Categoria || r.data?.categoria; // Busca no JSON
}
```

### Depois (Campos Normalizados):
```javascript
// ✅ RÁPIDO - acesso direto à coluna indexada
const rows = await prisma.record.findMany({
  select: { categoria: true } // Apenas a coluna necessária
});

// Acesso direto
for (const r of rows) {
  const categoria = r.categoria; // Acesso direto!
}
```

### Performance Esperada:
- ⚡ **10-100x mais rápido** em queries de agregação
- 📊 **Índices otimizados** para filtros e GROUP BY
- 💾 **Menos uso de memória** (não precisa carregar JSON completo)
- 🔍 **Queries mais eficientes** no MongoDB

---

## 🔍 Campos Normalizados Agora

✅ **Todos os campos principais estão normalizados:**
- `status`
- `tema`
- `assunto`
- `categoria` ← **NOVO!**
- `bairro` ← **NOVO!**
- `tipoDeManifestacao`
- `canal`
- `prioridade`
- `orgaos`
- `servidor`
- `responsavel`
- `unidadeCadastro`
- `endereco`

---

## 📝 Notas Importantes

1. **Setor**: Continua mapeado para `unidadeCadastro` (mesmo conceito)
2. **Cache**: Versão atualizada para `v4` - cache antigo será invalidado automaticamente
3. **Compatibilidade**: O JSON original ainda é mantido no campo `data` para referência
4. **Migração**: O script processa em lotes para não sobrecarregar o banco

---

## 🐛 Troubleshooting

### Erro: "Field not found"
- Execute `npm run prisma:generate` para regenerar o Prisma Client

### Erro: "Cannot read property"
- Verifique se executou `npm run prisma:push` primeiro

### Dados não aparecem normalizados
- Execute `npm run db:normalize` para migrar dados existentes
- Verifique logs do script para ver quantos registros foram atualizados

---

## ✨ Próximos Passos (Opcional)

Se quiser normalizar mais campos no futuro:
1. Adicionar campo ao `schema.prisma`
2. Adicionar índice se necessário
3. Atualizar `fieldMapper.js`
4. Criar script de migração similar ao `normalizeFields.js`
5. Executar `prisma:push` e script de migração

