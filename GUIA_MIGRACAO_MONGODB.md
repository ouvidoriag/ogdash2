# 🚀 Guia de Migração para MongoDB Atlas

## ✅ O que foi configurado

### 1. Schema Prisma atualizado
- ✅ Configurado para MongoDB Atlas
- ✅ Campos mapeados com os nomes exatos da planilha
- ✅ Índices criados para performance

### 2. Connection String configurada
- ✅ MongoDB Atlas: `colabouvidoria.gk8g0dq.mongodb.net`
- ✅ Database: `ouvidoria`
- ✅ Usuário: `ouvidoriadb`

### 3. Scripts atualizados
- ✅ `importExcel.js` - Importa JSON direto (MongoDB)
- ✅ `backfillNormalized.js` - Normaliza campos da planilha atual

---

## 📋 Colunas da Planilha Mapeadas

| Coluna Planilha | Campo Prisma | Tipo |
|----------------|--------------|------|
| `protocolo` | `protocolo` | String |
| `data_da_criacao` | `dataDaCriacao` | String |
| `status_demanda` | `statusDemanda` | String |
| `prazo_restante` | `prazoRestante` | String |
| `data_da_conclusao` | `dataDaConclusao` | String |
| `tempo_de_resolucao_em_dias` | `tempoDeResolucaoEmDias` | String |
| `prioridade` | `prioridade` | String |
| `tipo_de_manifestacao` | `tipoDeManifestacao` | String |
| `tema` | `tema` | String |
| `assunto` | `assunto` | String |
| `canal` | `canal` | String |
| `endereco` | `endereco` | String |
| `unidade_cadastro` | `unidadeCadastro` | String |
| `unidade_saude` | `unidadeSaude` | String |
| `status` | `status` | String |
| `servidor` | `servidor` | String |
| `responsavel` | `responsavel` | String |
| `verificado` | `verificado` | String |
| `orgaos` | `orgaos` | String |

**Campos adicionais normalizados:**
- `dataCriacaoIso` - Data de criação em formato YYYY-MM-DD
- `dataConclusaoIso` - Data de conclusão em formato YYYY-MM-DD

---

## 🔧 Passos para Migração

### Passo 1: Gerar Prisma Client

```bash
npm run prisma:generate
```

**Se der erro de permissão no Windows:**
- Feche o VS Code/Cursor
- Execute como Administrador
- Ou reinicie o computador

### Passo 2: Verificar Conexão com MongoDB

```bash
node -e "import('dotenv/config').then(() => import('@prisma/client')).then(({PrismaClient}) => { const p = new PrismaClient(); p.\$connect().then(() => { console.log('✅ Conectado!'); p.\$disconnect(); }).catch(e => { console.error('❌ Erro:', e.message); }); });"
```

### Passo 3: Importar Dados da Planilha

```bash
npm run import:excel
```

Isso vai:
- Ler a planilha `Dashboard_Duque_de_Caxias_Ouvidoria_Duque_de_Caxias_Tabela_ATUALIZADA (1).xlsx`
- Converter para JSON
- Inserir no MongoDB Atlas

### Passo 4: Normalizar Campos

```bash
npm run db:backfill
```

Isso vai:
- Preencher os campos normalizados
- Converter datas para formato ISO
- Criar índices para performance

### Passo 5: Testar o Servidor

```bash
npm start
```

Acesse: http://localhost:3000

---

## 🔍 Verificações

### Verificar dados no MongoDB Atlas

1. Acesse: https://cloud.mongodb.com
2. Faça login
3. Vá em "Browse Collections"
4. Database: `ouvidoria`
5. Collection: `records`

### Verificar via API

```bash
# Health check
curl http://localhost:3000/api/health

# Contar registros
curl http://localhost:3000/api/summary
```

---

## ⚠️ Mudanças no Código

### IDs agora são Strings (ObjectId)

**Antes (SQLite):**
```javascript
const record = await prisma.record.findUnique({ 
  where: { id: 1 } 
});
```

**Depois (MongoDB):**
```javascript
const record = await prisma.record.findUnique({ 
  where: { id: "507f1f77bcf86cd799439011" } // String ObjectId
});
```

### JSON direto (não precisa serializar)

**Antes (SQLite):**
```javascript
data: JSON.stringify(row)
```

**Depois (MongoDB):**
```javascript
data: row // JSON direto
```

---

## 🐛 Troubleshooting

### Erro: "EPERM: operation not permitted"
**Solução**: 
- Feche o VS Code/Cursor
- Execute o terminal como Administrador
- Ou reinicie o computador

### Erro: "Authentication failed"
**Solução**:
- Verifique usuário e senha no `.env`
- Verifique se o IP está liberado no MongoDB Atlas (Network Access)

### Erro: "Database not found"
**Solução**:
- A connection string deve incluir o nome do database: `...mongodb.net/ouvidoria?...`
- Ou crie o database manualmente no MongoDB Atlas

### Erro: "Collection not found"
**Solução**:
- A collection será criada automaticamente no primeiro insert
- Verifique se o Prisma Client foi gerado corretamente

---

## 📊 Próximos Passos

1. ✅ Schema configurado
2. ✅ Scripts atualizados
3. ⏳ Gerar Prisma Client
4. ⏳ Importar dados
5. ⏳ Normalizar campos
6. ⏳ Atualizar server.js (se necessário)
7. ⏳ Testar dashboard
8. ⏳ Deploy no Render

---

## 🎯 Checklist Final

- [ ] Prisma Client gerado
- [ ] Conexão com MongoDB Atlas testada
- [ ] Dados importados da planilha
- [ ] Campos normalizados
- [ ] Servidor rodando localmente
- [ ] Dashboard funcionando
- [ ] Variável `MONGODB_ATLAS_URL` configurada no Render
- [ ] Deploy realizado

---

**Pronto para começar!** 🚀

Execute os passos na ordem e você terá seu sistema rodando no MongoDB Atlas!

