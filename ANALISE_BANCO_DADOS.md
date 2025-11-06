# 🗄️ Análise de Banco de Dados para Integração Planilha + API

## 📋 Contexto

- **Plataforma**: Render.com
- **Fonte de dados**: Planilhas Excel + API (futuro)
- **Sistema atual**: SQLite (local)
- **Necessidade**: Banco gerenciado na nuvem

---

## 🎯 Opções Analisadas

### 1. MongoDB Atlas ⭐ **RECOMENDADO**

#### ✅ Vantagens

**Para Planilhas:**
- **Schema flexível**: Aceita qualquer estrutura de colunas (como JSON)
- **Fácil importação**: Converte planilhas diretamente para documentos
- **Sem migrações**: Adiciona campos sem alterar schema
- **Suporta arrays**: Ideal para dados aninhados

**Para API:**
- **JSON nativo**: API retorna JSON, MongoDB armazena JSON diretamente
- **Agregações poderosas**: Pipeline de agregação muito flexível
- **Índices flexíveis**: Cria índices em qualquer campo facilmente

**Para Render:**
- **Gerenciado**: MongoDB Atlas é totalmente gerenciado (sem servidor para manter)
- **Free tier generoso**: 512MB grátis (suficiente para começar)
- **Escalável**: Cresce conforme necessidade
- **Backup automático**: Backups automáticos incluídos
- **Conectividade**: Conexão segura via connection string

**Técnico:**
- **Prisma suporta**: Prisma tem suporte oficial para MongoDB
- **Performance**: Excelente para leitura (otimizado para analytics)
- **Query language**: MQL (MongoDB Query Language) poderoso

#### ❌ Desvantagens

- **Custo**: Free tier limitado, depois pago (mas barato)
- **Curva de aprendizado**: Diferente de SQL (mas Prisma abstrai)
- **Joins**: Não tem joins nativos (mas pode usar $lookup)

#### 💰 Custo

- **Free**: 512MB storage, shared cluster
- **M0 (Free)**: $0/mês (até 512MB)
- **M10**: ~$9/mês (2GB, melhor performance)
- **Escala**: Paga conforme uso

#### 🔧 Integração com Prisma

```prisma
// schema.prisma
datasource db {
  provider = "mongodb"
  url      = env("MONGODB_ATLAS_URL")
}

model Record {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  data      Json     // Armazena JSON diretamente
  secretaria String?
  setor      String?
  // ... outros campos
  createdAt DateTime @default(now())
  
  @@index([secretaria])
  @@index([setor])
}
```

#### 📊 Exemplo de Uso

```javascript
// Importar planilha
const records = excelData.map(row => ({
  data: row, // JSON direto
  secretaria: row.Secretaria,
  // ...
}));

await prisma.record.createMany({ data: records });
```

---

### 2. PostgreSQL (Render Postgres) ⭐ **ALTERNATIVA SÓLIDA**

#### ✅ Vantagens

**Para Planilhas:**
- **JSONB**: Tipo JSON nativo com índices (melhor que JSON)
- **Relacional**: Mantém integridade referencial
- **SQL**: Query language familiar e poderosa

**Para API:**
- **JSONB**: Armazena e consulta JSON eficientemente
- **Agregações**: SQL com GROUP BY, window functions
- **Joins**: Relacionamentos complexos

**Para Render:**
- **Gerenciado pelo Render**: Integração nativa
- **Free tier**: 90 dias grátis, depois $7/mês
- **Backup automático**: Incluído
- **Connection pooling**: Otimizado

**Técnico:**
- **Prisma nativo**: Suporte completo
- **Performance**: Excelente para analytics
- **ACID**: Transações garantidas

#### ❌ Desvantagens

- **Schema fixo**: Precisa definir colunas (mas JSONB resolve)
- **Migrações**: Precisa de migrações para mudanças
- **Custo**: Mais caro que MongoDB free tier

#### 💰 Custo

- **Free**: 90 dias trial
- **Starter**: $7/mês (1GB storage)
- **Standard**: $20/mês (10GB storage)

#### 🔧 Integração com Prisma

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Render fornece automaticamente
}

model Record {
  id        Int      @id @default(autoincrement())
  data      Json     // JSONB no PostgreSQL
  secretaria String?
  // ...
  
  @@index([secretaria])
}
```

---

### 3. Supabase (PostgreSQL gerenciado)

#### ✅ Vantagens

- **Free tier generoso**: 500MB database, 1GB storage
- **API automática**: Gera REST API automaticamente
- **Real-time**: Subscriptions em tempo real
- **Auth incluído**: Sistema de autenticação
- **Dashboard**: Interface visual para dados

#### ❌ Desvantagens

- **Vendor lock-in**: Mais dependente do Supabase
- **Limitações free**: Algumas limitações no free tier

#### 💰 Custo

- **Free**: $0/mês (500MB)
- **Pro**: $25/mês (8GB)

---

### 4. PlanetScale (MySQL gerenciado)

#### ✅ Vantagens

- **MySQL compatível**: Familiar para muitos
- **Schema branching**: Versionamento de schema
- **Free tier**: 5GB storage grátis
- **Serverless**: Escala automaticamente

#### ❌ Desvantagens

- **MySQL**: Menos flexível que PostgreSQL para JSON
- **Limitações**: Algumas limitações no free tier

---

## 🏆 Recomendação Final

### Para seu caso: **MongoDB Atlas** ⭐

#### Por quê?

1. **Flexibilidade máxima**
   - Planilhas têm estruturas variáveis → MongoDB aceita qualquer estrutura
   - API retorna JSON → MongoDB armazena JSON nativamente
   - Sem necessidade de definir schema rígido

2. **Integração perfeita**
   - Prisma suporta MongoDB oficialmente
   - Código atual precisa de poucas mudanças
   - JSON direto no banco (igual ao SQLite atual)

3. **Custo-benefício**
   - Free tier generoso (512MB)
   - Escala conforme necessidade
   - Sem surpresas de custo

4. **Performance para analytics**
   - Otimizado para leitura e agregações
   - Índices flexíveis
   - Pipeline de agregação poderoso

5. **Render.com**
   - Connection string simples
   - Sem configuração de servidor
   - Backups automáticos

---

## 🚀 Migração do SQLite para MongoDB Atlas

### Passo 1: Criar Cluster no MongoDB Atlas

1. Acesse: https://www.mongodb.com/cloud/atlas
2. Crie conta gratuita
3. Crie cluster (M0 Free)
4. Configure network access (0.0.0.0/0 para Render)
5. Crie usuário de banco
6. Copie connection string

### Passo 2: Atualizar Schema Prisma

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("MONGODB_ATLAS_URL")
}

model Record {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  data      Json     // JSON flexível
  secretaria String?
  setor      String?
  tipo       String?
  categoria  String?
  bairro     String?
  status     String?
  dataIso    String?
  uac         String?
  responsavel String?
  canal       String?
  prioridade  String?
  servidor    String?
  tema        String?
  assunto     String?
  dataConclusaoIso String?
  createdAt DateTime @default(now())
  
  @@index([secretaria])
  @@index([setor])
  @@index([tipo])
  @@index([categoria])
  @@index([bairro])
  @@index([status])
  @@index([dataIso])
  @@index([uac])
  @@index([responsavel])
  @@index([canal])
  @@index([prioridade])
  @@index([servidor])
  @@index([tema])
  @@index([assunto])
  @@index([dataConclusaoIso])
}
```

### Passo 3: Atualizar .env

```env
# Remover SQLite
# DATABASE_URL="file:./prisma/dev.db"

# Adicionar MongoDB Atlas
MONGODB_ATLAS_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/ouvidoria?retryWrites=true&w=majority"
```

### Passo 4: Migrar Dados

```javascript
// scripts/migrateToMongo.js
import { PrismaClient as SQLiteClient } from '@prisma/client';
import { PrismaClient as MongoClient } from '@prisma/client';

const sqlite = new SQLiteClient({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
});

const mongo = new MongoClient({
  datasources: { db: { url: process.env.MONGODB_ATLAS_URL } }
});

async function migrate() {
  const records = await sqlite.record.findMany();
  
  for (const record of records) {
    await mongo.record.create({
      data: {
        data: JSON.parse(record.data),
        secretaria: record.secretaria,
        setor: record.setor,
        // ... outros campos
      }
    });
  }
  
  console.log(`Migrados ${records.length} registros`);
}
```

### Passo 5: Atualizar Código (Mínimo)

**Prisma Client gerencia a diferença**, mas algumas mudanças:

```javascript
// Antes (SQLite)
const record = await prisma.record.findUnique({ where: { id: 1 } });

// Depois (MongoDB)
const record = await prisma.record.findUnique({ 
  where: { id: "507f1f77bcf86cd799439011" } // String ObjectId
});
```

### Passo 6: Deploy no Render

1. Adicionar variável `MONGODB_ATLAS_URL` no Render
2. Deploy automático
3. Pronto! 🎉

---

## 📊 Comparação Rápida

| Característica | MongoDB Atlas | PostgreSQL (Render) | Supabase |
|----------------|--------------|---------------------|----------|
| **Free Tier** | 512MB | 90 dias trial | 500MB |
| **Custo pós-free** | $0 (M0) | $7/mês | $0 (free) |
| **Flexibilidade Schema** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **JSON Nativo** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Prisma Support** | ✅ | ✅ | ✅ |
| **Integração Render** | ✅ | ✅✅ | ✅ |
| **Backup Automático** | ✅ | ✅ | ✅ |
| **Performance Analytics** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Curva Aprendizado** | Média | Baixa | Baixa |

---

## 🎯 Conclusão

**Para seu caso específico (planilhas + API no Render):**

### 🥇 **MongoDB Atlas** - Melhor escolha
- Flexibilidade máxima
- JSON nativo
- Free tier generoso
- Perfeito para analytics

### 🥈 **PostgreSQL (Render)** - Alternativa sólida
- Se preferir SQL
- Integração nativa com Render
- JSONB poderoso

### 🥉 **Supabase** - Se precisar de extras
- Se quiser auth + real-time
- Free tier bom
- API automática

---

## 💡 Dica Final

**Comece com MongoDB Atlas M0 (Free)**:
- Teste com seus dados reais
- Veja se 512MB é suficiente
- Se precisar mais, escala para M10 ($9/mês)
- Migração é simples (Prisma abstrai)

**Vantagem**: Você pode começar grátis e escalar conforme necessidade, sem compromisso inicial! 🚀

