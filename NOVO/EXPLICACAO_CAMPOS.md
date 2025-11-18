# 📚 Explicação: Campos Normalizados vs Campos no JSON

## 🔍 Diferença Conceitual

### ✅ **Campos Normalizados (Mapeados)**
São campos que foram **extraídos do JSON** e colocados como **colunas separadas** no schema do Prisma.

**Exemplo no Schema:**
```prisma
model Record {
  id        String   @id
  data      Json     // JSON completo da planilha
  
  // ✅ CAMPOS NORMALIZADOS (colunas separadas)
  status    String?  // Extraído do JSON e indexado
  tema      String?  // Extraído do JSON e indexado
  assunto   String?  // Extraído do JSON e indexado
  orgaos    String?  // Extraído do JSON e indexado
}
```

**Vantagens:**
- ⚡ **Queries mais rápidas** - Prisma pode usar índices
- 🔍 **Filtros eficientes** - `WHERE status = 'Concluída'`
- 📊 **Agregações otimizadas** - `GROUP BY status`
- 🎯 **Acesso direto** - `record.status` (sem precisar ler JSON)

**Como usar:**
```javascript
// Acesso direto - MUITO RÁPIDO
const status = record.status;  // ✅ Campo normalizado
```

---

### 📦 **Campos no JSON**
São campos que **permanecem apenas dentro** do campo `data` (JSON) do banco.

**Exemplo no Schema:**
```prisma
model Record {
  id        String   @id
  data      Json     // JSON completo da planilha
  
  // ❌ NÃO EXISTEM como colunas separadas:
  // categoria  - está apenas no JSON
  // setor      - está apenas no JSON  
  // bairro     - está apenas no JSON
}
```

**Desvantagens:**
- 🐌 **Queries mais lentas** - Precisa ler e processar JSON
- ❌ **Sem índices** - Não pode criar índices diretos
- 🔄 **Processamento em memória** - Precisa carregar JSON primeiro

**Como usar:**
```javascript
// Acesso via JSON - MAIS LENTO
const categoria = record.data?.Categoria || record.data?.categoria;  // ❌ Campo no JSON
```

---

## 📊 Comparação Prática

### Exemplo de Registro no Banco:

```javascript
{
  id: "507f1f77bcf86cd799439011",
  data: {
    // JSON completo da planilha original
    "Protocolo": "12345",
    "Status": "Concluída",
    "Tema": "Saúde",
    "Categoria": "Urgente",      // ⚠️ Só no JSON
    "Setor": "Administração",     // ⚠️ Só no JSON
    "Bairro": "Centro"            // ⚠️ Só no JSON
  },
  
  // ✅ Campos normalizados (extraídos do JSON)
  status: "Concluída",           // ✅ Coluna separada
  tema: "Saúde",                  // ✅ Coluna separada
  assunto: "Atendimento médico",  // ✅ Coluna separada
  
  // ❌ Campos NÃO normalizados (só no JSON)
  // categoria: NÃO EXISTE como coluna
  // setor: NÃO EXISTE como coluna
  // bairro: NÃO EXISTE como coluna
}
```

---

## 🔧 Como o Sistema Decide?

### No código `countByStatusMes`:

```javascript
const fieldMap = {
  'Status': 'status',        // ✅ Normalizado - usar coluna
  'Tema': 'tema',            // ✅ Normalizado - usar coluna
  'Assunto': 'assunto',      // ✅ Normalizado - usar coluna
  'Categoria': null,        // ❌ NÃO normalizado - buscar do JSON
  'Setor': null,            // ❌ NÃO normalizado - buscar do JSON
  'Bairro': null            // ❌ NÃO normalizado - buscar do JSON
};

// Se normalizado:
if (isNormalized) {
  fieldValue = record.status;  // ✅ Acesso direto (RÁPIDO)
}

// Se não normalizado:
else {
  fieldValue = record.data?.Categoria || record.data?.categoria;  // ❌ Acesso via JSON (LENTO)
}
```

---

## 📋 Lista de Campos Normalizados

✅ **Campos que EXISTEM como colunas no Prisma:**
- `status`
- `tema`
- `assunto`
- `tipoDeManifestacao`
- `canal`
- `prioridade`
- `orgaos`
- `servidor`
- `responsavel`
- `unidadeCadastro`
- `endereco`
- `protocolo`
- `dataDaCriacao`
- `dataDaConclusao`

❌ **Campos que NÃO EXISTEM como colunas (só no JSON):**
- `categoria` - buscar de `data.Categoria` ou `data.categoria`
- `setor` - buscar de `data.Setor` ou `data.setor` ou `data["Unidade de Cadastro"]`
- `bairro` - buscar de `data.Bairro` ou `data.bairro`

---

## 🎯 Por que essa diferença?

1. **Performance**: Campos normalizados permitem queries muito mais rápidas
2. **Índices**: Apenas campos normalizados podem ter índices no banco
3. **Otimização**: Agregações (`GROUP BY`, `COUNT`) são muito mais eficientes
4. **Compatibilidade**: Alguns campos da planilha original não foram normalizados ainda

---

## 💡 Resumo

| Aspecto | Normalizado ✅ | JSON ❌ |
|---------|--------------|---------|
| **Acesso** | `record.status` | `record.data?.Categoria` |
| **Velocidade** | ⚡ Muito rápido | 🐌 Mais lento |
| **Índices** | ✅ Sim | ❌ Não |
| **Queries** | ✅ Otimizadas | ❌ Processamento em memória |
| **Exemplos** | status, tema, assunto | categoria, setor, bairro |

