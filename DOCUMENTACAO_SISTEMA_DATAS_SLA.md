# 📅 Documentação Completa: Sistema de Datas, SLA e Banco de Dados

## 📋 Índice

1. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
2. [Sistema de Datas](#sistema-de-datas)
3. [Sistema de SLA (Service Level Agreement)](#sistema-de-sla)
4. [Status de Manifestações](#status-de-manifestações)
5. [Páginas e Cards que Usam Datas](#páginas-e-cards-que-usam-datas)
6. [APIs Relacionadas a Datas](#apis-relacionadas-a-datas)
7. [Filtros e Configurações](#filtros-e-configurações)

---

## 🗄️ Estrutura do Banco de Dados

### Modelo Record (Prisma Schema)

```prisma
model Record {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  data      Json     // Armazena o JSON completo da planilha Excel
  
  // Campos normalizados baseados nas colunas exatas da planilha
  protocolo              String? // protocolo
  dataDaCriacao          String? // data_da_criacao (formato ISO: "2025-01-06T03:00:28.000Z")
  statusDemanda          String? // status_demanda
  prazoRestante          String? // prazo_restante
  dataDaConclusao        String? // data_da_conclusao (formato ISO: "2025-01-06T03:00:28.000Z")
  tempoDeResolucaoEmDias String? // tempo_de_resolucao_em_dias (string: "0", "15", "30", etc.)
  
  // Campos ISO para queries de data (normalizados de data_da_criacao e data_da_conclusao)
  dataCriacaoIso    String? // YYYY-MM-DD (normalmente NULL - não populado)
  dataConclusaoIso  String? // YYYY-MM-DD (normalmente NULL - não populado)
  
  // Outros campos...
  orgaos             String?
  responsavel        String?
  unidadeCadastro    String?
  servidor           String?
  status             String?
  // ...
}
```

### Campos de Data no Banco

#### 1. **dataDaCriacao** (String)
- **Formato no banco**: String ISO completa: `"2025-01-06T03:00:28.000Z"`
- **Disponibilidade**: 100% dos registros têm este campo
- **Uso**: Campo principal para filtros e agregações por data
- **Normalização**: Extrai apenas a parte da data (`YYYY-MM-DD`) usando regex

#### 2. **dataDaConclusao** (String)
- **Formato no banco**: String ISO completa: `"2025-01-06T03:00:28.000Z"`
- **Disponibilidade**: Presente quando o registro foi concluído
- **Uso**: Determina se um registro está concluído e calcula tempo de resolução

#### 3. **tempoDeResolucaoEmDias** (String)
- **Formato no banco**: String numérica: `"0"`, `"15"`, `"30"`, `"45"`, etc.
- **Disponibilidade**: 99% dos registros têm este campo
- **Uso**: Campo prioritário para calcular tempo médio de atendimento
- **Observação**: Mesmo sendo string, é convertido para número com `parseFloat()`

#### 4. **dataCriacaoIso** (String)
- **Formato esperado**: `YYYY-MM-DD` (ex: `"2025-01-06"`)
- **Disponibilidade**: 0% dos registros (campo não populado)
- **Uso**: Campo de fallback, não é usado atualmente

#### 5. **dataConclusaoIso** (String)
- **Formato esperado**: `YYYY-MM-DD` (ex: `"2025-01-06"`)
- **Disponibilidade**: <1% dos registros
- **Uso**: Campo de fallback para calcular tempo de resolução

### Estrutura do Campo `data` (JSON)

O campo `data` armazena o JSON completo da planilha Excel original:

```json
{
  "protocolo": "12345",
  "data_da_criacao": "2025-01-06T03:00:28.000Z",
  "data_da_conclusao": "2025-01-06T03:00:28.000Z",
  "tempo_de_resolucao_em_dias": 0,
  "status_demanda": "Concluída",
  "orgaos": "Secretaria de Saúde",
  "responsavel": "João Silva",
  "unidade_cadastro": "UAC Centro",
  // ... outros campos
}
```

---

## 📅 Sistema de Datas

### ⚠️ IMPORTANTE: Sistema Global de Datas

**TODAS as APIs e páginas agora usam um sistema global de funções para processar datas.**  
Consulte `SISTEMA_GLOBAL_DATAS.md` para documentação completa do sistema global.

**Funções globais principais:**
- `getDataCriacao(record)` - Obtém data de criação (prioriza `dataDaCriacao` - 100% disponível)
- `getDataConclusao(record)` - Obtém data de conclusão
- `getTempoResolucaoEmDias(record, incluirZero)` - Calcula tempo de resolução
- `isConcluido(record)` - Verifica se está concluído
- `getMes(record)` - Obtém mês (YYYY-MM)
- `addMesFilter(where, meses)` - Adiciona filtro de meses

### Normalização de Datas

O sistema possui uma função global `normalizeDate()` que converte diferentes formatos de data para `YYYY-MM-DD`:

```javascript
const normalizeDate = (dateInput) => {
  // 1. Se for objeto Date
  if (dateInput instanceof Date) {
    return dateInput.toISOString().slice(0, 10);
  }
  
  // 2. Se for objeto (MongoDB Date)
  if (typeof dateInput === 'object' && dateInput !== null) {
    const date = new Date(dateInput);
    return date.toISOString().slice(0, 10);
  }
  
  // 3. Se for string ISO: "2025-01-06T03:00:28.000Z"
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1]; // Retorna "2025-01-06"
  
  // 4. Se for formato DD/MM/YYYY
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  
  // 5. Se já estiver em YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  
  return null;
};
```

### Cálculo de Tempo de Resolução

O sistema calcula o tempo de resolução em dias usando a função global `getTempoResolucaoEmDias()` com a seguinte prioridade:

1. **Prioridade 1**: Campo `tempoDeResolucaoEmDias` (99% disponível) ⭐ **Principal**
2. **Prioridade 2**: Diferença entre `getDataCriacao()` e `getDataConclusao()`
3. **Prioridade 3**: Diferença entre `normalizeDate(data.data_da_criacao)` e `normalizeDate(data.data_da_conclusao)`

**Nota**: Todas as APIs usam `getTempoResolucaoEmDias()` que implementa esta lógica de forma consistente.

**Filtros aplicados**:
- Valores negativos são ignorados
- Valores > 1000 dias são ignorados (outliers)
- Valores zero podem ser incluídos ou excluídos conforme configuração

---

## ⏱️ Sistema de SLA (Service Level Agreement)

### Regras de SLA

O sistema classifica os pedidos em **4 categorias** baseadas no tempo de resolução:

#### 1. **Concluídos** (Verde Escuro)
- **Cor**: `#059669` (emerald-600)
- **Critério**: Registros que têm `dataDaConclusao` ou `dataConclusaoIso` preenchidos
- **Uso**: Indica que o pedido foi finalizado

#### 2. **Verde Claro** (0-30 dias)
- **Cor**: `#86efac` (emerald-300)
- **Critério**: Pedidos com tempo de resolução entre **0 e 30 dias**
- **Status**: Dentro do prazo ideal

#### 3. **Amarelo** (31-60 dias)
- **Cor**: `#fbbf24` (amber-400)
- **Critério**: Pedidos com tempo de resolução entre **31 e 60 dias**
- **Status**: Aproximando-se do limite

#### 4. **Vermelho** (61+ dias)
- **Cor**: `#fb7185` (rose-400)
- **Critério**: Pedidos com tempo de resolução de **61 dias ou mais**
- **Status**: Fora do prazo, requer atenção

### Prazo Padrão

- **Prazo inicial**: 30 dias para resposta
- **Aviso amarelo**: 31-60 dias (próximo do limite)
- **Atraso vermelho**: 61+ dias (fora do prazo)

### Lógica de Cálculo de SLA

```javascript
// Para cada registro:
if (temDataConclusao) {
  categoria = "Concluídos";
} else if (tempoResolucao <= 30) {
  categoria = "Verde Claro (0-30d)";
} else if (tempoResolucao <= 60) {
  categoria = "Amarelo (31-60d)";
} else {
  categoria = "Vermelho (61+d)";
}
```

---

## 📊 Status de Manifestações

### Status Possíveis

1. **Concluída**
   - Tem `dataDaConclusao` ou `dataConclusaoIso` preenchidos
   - Pode ter `tempoDeResolucaoEmDias` calculado

2. **Em Andamento**
   - Tem `dataDaCriacao` mas não tem `dataDaConclusao`
   - Tempo de resolução é calculado a partir da data atual (se aplicável)

3. **Pendente**
   - Registro criado mas sem processamento iniciado

### Filtro "Apenas Concluídos"

Quando o filtro "Apenas concluídos" está ativo:
- Apenas registros com `dataDaConclusao` ou `dataConclusaoIso` são considerados
- Registros em andamento são excluídos das análises

---

## 📄 Páginas e Cards que Usam Datas

### 1. **Página: Visão Geral (Overview)**

#### Cards/Elementos:
- **KPIs Principais**
  - Total de manifestações (usa `dataDaCriacao` para contagem)
  - Manifestações do mês (filtra por mês atual)
  
- **Gráfico: Tendência Mensal (12M)**
  - **API**: `/api/aggregate/count-by-month`
  - **Campo usado**: `dataDaCriacao`
  - **Agregação**: Conta registros por mês dos últimos 12 meses
  
- **Gráfico: SLA Geral**
  - **API**: `/api/sla/summary`
  - **Campos usados**: `tempoDeResolucaoEmDias`, `dataDaConclusao`, `dataCriacaoIso`, `dataConclusaoIso`
  - **Classificação**: Concluídos, Verde Claro (0-30d), Amarelo (31-60d), Vermelho (61+d)
  
- **Gráfico: Top Órgãos (Top 10)**
  - **API**: `/api/aggregate/count-by?field=orgaos`
  - **Campo usado**: `orgaos` (indiretamente relacionado a datas para filtros)
  
- **Gráfico: Top Temas**
  - **API**: `/api/aggregate/count-by?field=tema`
  - **Campo usado**: `tema`

### 2. **Página: Tempo Médio de Atendimento**

#### Cards/Elementos:
- **Estatísticas Gerais**
  - **Média Geral**: Média de dias de resolução
  - **Mediana**: Mediana de dias de resolução
  - **Mínimo**: Menor tempo de resolução
  - **Máximo**: Maior tempo de resolução
  - **API**: `/api/stats/average-time/stats`
  - **Campos usados**: `tempoDeResolucaoEmDias`, `dataDaCriacao`, `dataDaConclusao`, `dataCriacaoIso`, `dataConclusaoIso`
  
- **Gráfico: Tempo Médio por Órgão/Unidade**
  - **API**: `/api/stats/average-time`
  - **Campos usados**: `tempoDeResolucaoEmDias`, `dataDaCriacao`, `dataDaConclusao`
  - **Agregação**: Agrupa por `orgaos`, `responsavel` ou `unidadeCadastro` e calcula média
  
- **Ranking de Tempo Médio**
  - **API**: `/api/stats/average-time`
  - **Campos usados**: Mesmos do gráfico acima
  
- **Gráfico: Tendência Diária (Últimos 30 dias)**
  - **API**: `/api/stats/average-time/by-day`
  - **Campos usados**: `dataDaCriacao`, `tempoDeResolucaoEmDias`, `dataDaConclusao`
  - **Agregação**: Média de tempo de resolução por dia
  
- **Gráfico: Tendência Semanal (Últimas 12 semanas)**
  - **API**: `/api/stats/average-time/by-week`
  - **Campos usados**: `dataDaCriacao`, `tempoDeResolucaoEmDias`, `dataDaConclusao`
  - **Agregação**: Média de tempo de resolução por semana
  
- **Gráfico: Tendência Mensal (Últimos 12 meses)**
  - **API**: `/api/stats/average-time/by-month`
  - **Campos usados**: `dataDaCriacao`, `tempoDeResolucaoEmDias`, `dataDaConclusao`
  - **Agregação**: Média de tempo de resolução por mês
  
- **Filtros de Período**
  - **Seleção de Mês(es)**: Filtra por `dataDaCriacao` usando `startsWith` no formato `YYYY-MM`
  - **Apenas Concluídos**: Filtra por presença de `dataDaConclusao` ou `dataConclusaoIso`
  - **Incluir Tempo Zero**: Inclui ou exclui registros com `tempoDeResolucaoEmDias = 0`

### 3. **Página: Por Órgão/Mês**

#### Cards/Elementos:
- **Gráfico: Distribuição por Órgão e Mês**
  - **API**: `/api/aggregate/count-by-orgao-mes`
  - **Campo usado**: `dataDaCriacao` (agrupa por mês), `orgaos`
  - **Agregação**: Conta registros por órgão e mês
  
- **Tabela: Detalhamento por Órgão/Mês**
  - **API**: `/api/aggregate/count-by-orgao-mes`
  - **Campo usado**: `dataDaCriacao`, `orgaos`

### 4. **Página: Por Tema**

#### Cards/Elementos:
- **Gráfico: Distribuição por Tema**
  - **API**: `/api/aggregate/count-by?field=tema`
  - **Campo usado**: `tema` (indiretamente relacionado a datas para filtros)
  
- **Heatmap: Mês x Tema**
  - **API**: `/api/aggregate/heatmap?dim=Tema`
  - **Campo usado**: `dataDaCriacao` (para agrupar por mês), `tema`

### 5. **Página: Por Assunto**

#### Cards/Elementos:
- **Gráfico: Distribuição por Assunto**
  - **API**: `/api/aggregate/count-by?field=assunto`
  - **Campo usado**: `assunto` (indiretamente relacionado a datas para filtros)
  
- **Heatmap: Mês x Assunto**
  - **API**: `/api/aggregate/heatmap?dim=Assunto`
  - **Campo usado**: `dataDaCriacao` (para agrupar por mês), `assunto`

### 6. **Página: Por Canal**

#### Cards/Elementos:
- **Gráfico: Distribuição por Canal**
  - **API**: `/api/aggregate/count-by?field=canal`
  - **Campo usado**: `canal` (indiretamente relacionado a datas para filtros)
  
- **Heatmap: Mês x Canal**
  - **API**: `/api/aggregate/heatmap?dim=Canal`
  - **Campo usado**: `dataDaCriacao` (para agrupar por mês), `canal`

### 7. **Página: Por Prioridade**

#### Cards/Elementos:
- **Gráfico: Distribuição por Prioridade**
  - **API**: `/api/aggregate/count-by?field=Prioridade`
  - **Campo usado**: `prioridade` (indiretamente relacionado a datas para filtros)
  
- **Heatmap: Mês x Prioridade**
  - **API**: `/api/aggregate/heatmap?dim=Prioridade`
  - **Campo usado**: `dataDaCriacao` (para agrupar por mês), `prioridade`

### 8. **Página: Por Cadastrante**

#### Cards/Elementos:
- **Gráfico: Distribuição por Cadastrante**
  - **API**: `/api/aggregate/count-by?field=servidor`
  - **Campo usado**: `servidor` (indiretamente relacionado a datas para filtros)

### 9. **Página: Reclamações**

#### Cards/Elementos:
- **Gráfico: Reclamações por Tipo**
  - **API**: `/api/aggregate/count-by?field=tipoDeManifestacao`
  - **Campo usado**: `tipoDeManifestacao` (indiretamente relacionado a datas para filtros)

### 10. **Página: Status**

#### Cards/Elementos:
- **Gráfico: Distribuição por Status**
  - **API**: `/api/aggregate/count-by?field=status`
  - **Campo usado**: `status` (relacionado a `dataDaConclusao` para determinar se está concluído)
  
- **Gráfico: Status ao Longo do Tempo**
  - **API**: `/api/aggregate/count-by-status-mes`
  - **Campo usado**: `dataDaCriacao` (para agrupar por mês), `status`

---

## 🔌 APIs Relacionadas a Datas

### APIs de Tempo Médio

#### 1. `/api/stats/average-time`
- **Descrição**: Tempo médio de atendimento por órgão/unidade
- **Campos usados**: `tempoDeResolucaoEmDias`, `dataDaCriacao`, `dataDaConclusao`, `dataCriacaoIso`, `dataConclusaoIso`
- **Parâmetros de query**:
  - `meses`: Array de meses no formato `YYYY-MM` (ex: `["2025-01", "2025-02"]`)
  - `apenasConcluidos`: Boolean (true/false)
  - `incluirZero`: Boolean (true/false)
  - `servidor`: Filtro por servidor
  - `unidadeCadastro`: Filtro por unidade de cadastro
- **Retorno**: Array de objetos `{ org: string, dias: number, quantidade: number }`

#### 2. `/api/stats/average-time/stats`
- **Descrição**: Estatísticas gerais (média, mediana, mínimo, máximo)
- **Campos usados**: Mesmos do endpoint acima
- **Parâmetros de query**: Mesmos do endpoint acima
- **Retorno**: `{ media: number, mediana: number, minimo: number, maximo: number, total: number }`

#### 3. `/api/stats/average-time/by-day`
- **Descrição**: Tendência diária dos últimos 30 dias
- **Campos usados**: `dataDaCriacao`, `tempoDeResolucaoEmDias`, `dataDaConclusao`
- **Parâmetros de query**: Mesmos do endpoint `/api/stats/average-time`
- **Retorno**: Array de objetos `{ date: string (YYYY-MM-DD), dias: number, quantidade: number }`

#### 4. `/api/stats/average-time/by-week`
- **Descrição**: Tendência semanal das últimas 12 semanas
- **Campos usados**: Mesmos do endpoint acima
- **Parâmetros de query**: Mesmos do endpoint `/api/stats/average-time`
- **Retorno**: Array de objetos `{ week: string (YYYY-WXX), dias: number, quantidade: number }`

#### 5. `/api/stats/average-time/by-month`
- **Descrição**: Tendência mensal dos últimos 12 meses
- **Campos usados**: Mesmos do endpoint acima
- **Parâmetros de query**: Mesmos do endpoint `/api/stats/average-time`
- **Retorno**: Array de objetos `{ month: string (YYYY-MM), dias: number, quantidade: number }`

### APIs de SLA

#### 6. `/api/sla/summary`
- **Descrição**: Resumo de SLA (classificação por tempo de resolução)
- **Campos usados**: `tempoDeResolucaoEmDias`, `dataDaConclusao`, `dataCriacaoIso`, `dataConclusaoIso`
- **Parâmetros de query**:
  - `servidor`: Filtro por servidor
  - `unidadeCadastro`: Filtro por unidade de cadastro
- **Retorno**: Objeto com contagens por categoria:
  ```json
  {
    "concluidos": number,
    "verdeClaro": number,
    "amarelo": number,
    "vermelho": number,
    "total": number
  }
  ```

### APIs de Agregação

#### 7. `/api/aggregate/count-by-month`
- **Descrição**: Contagem de registros por mês (últimos 12 meses)
- **Campo usado**: `dataDaCriacao`
- **Retorno**: Array de objetos `{ month: string (YYYY-MM), count: number }`

#### 8. `/api/aggregate/count-by-orgao-mes`
- **Descrição**: Contagem de registros por órgão e mês
- **Campos usados**: `dataDaCriacao`, `orgaos`
- **Retorno**: Array de objetos `{ orgao: string, month: string (YYYY-MM), count: number }`

#### 9. `/api/aggregate/count-by-status-mes`
- **Descrição**: Contagem de registros por status e mês
- **Campos usados**: `dataDaCriacao`, `status`
- **Retorno**: Array de objetos `{ status: string, month: string (YYYY-MM), count: number }`

#### 10. `/api/aggregate/heatmap?dim={dimensao}`
- **Descrição**: Heatmap de mês x dimensão (Tema, Assunto, Canal, Prioridade)
- **Campos usados**: `dataDaCriacao` (para agrupar por mês), campo da dimensão especificada
- **Parâmetros de query**: `dim` (Tema, Assunto, Canal, Prioridade)
- **Retorno**: Objeto com `labels` (meses) e `rows` (dados do heatmap)

---

## ⚙️ Filtros e Configurações

### Filtros Globais

O sistema possui filtros globais que afetam todas as páginas:

1. **Filtro por Servidor/Cadastrante**
   - Campo: `servidor`
   - Aplicado em todas as APIs via query parameter `servidor`

2. **Filtro por Unidade de Cadastro**
   - Campo: `unidadeCadastro`
   - Aplicado em todas as APIs via query parameter `unidadeCadastro`

### Filtros Específicos da Página "Tempo Médio"

1. **Seleção de Mês(es)**
   - **Tipo**: Múltipla seleção
   - **Formato**: `YYYY-MM` (ex: `"2025-01"`)
   - **Implementação**: Filtra `dataDaCriacao` usando `startsWith` no MongoDB
   - **Uso**: Permite analisar períodos específicos

2. **Apenas Concluídos**
   - **Tipo**: Checkbox
   - **Implementação**: Filtra registros que têm `dataDaConclusao` ou `dataConclusaoIso`
   - **Uso**: Exclui registros em andamento das análises

3. **Incluir Tempo Zero**
   - **Tipo**: Checkbox (padrão: marcado)
   - **Implementação**: Inclui ou exclui registros com `tempoDeResolucaoEmDias = 0`
   - **Uso**: Permite analisar apenas registros com tempo de resolução > 0

### Cache

Todas as APIs de tempo médio usam cache com chaves baseadas nos filtros:
- **Duração**: 1 hora (3600 segundos)
- **Chave**: Inclui versão da API, filtros aplicados (servidor, unidade, meses, etc.)
- **Exemplo**: `avgTimeByDay:meses:2025-01,2025-02:v4`

---

## 🔍 Resumo de Campos por Funcionalidade

### Campos Usados para Filtros de Data
- `dataDaCriacao` (100% disponível) - **Principal**
- `dataCriacaoIso` (0% disponível) - Fallback
- `data.data_da_criacao` (no JSON) - Fallback

### Campos Usados para Cálculo de Tempo
- `tempoDeResolucaoEmDias` (99% disponível) - **Principal**
- Diferença entre `dataDaCriacao` e `dataDaConclusao` - Fallback
- Diferença entre `dataCriacaoIso` e `dataConclusaoIso` - Fallback

### Campos Usados para Determinar Status
- `dataDaConclusao` - Indica se está concluído
- `dataConclusaoIso` - Fallback para conclusão
- `status` - Status textual da demanda

### Campos Usados para SLA
- `tempoDeResolucaoEmDias` - Classifica em categorias (0-30, 31-60, 61+)
- `dataDaConclusao` - Determina se está "Concluído"

---

## 📝 Notas Importantes

1. **Campo Principal de Data**: `dataDaCriacao` é o campo mais confiável (100% dos registros)
2. **Formato de Data no Banco**: Strings ISO completas (`"2025-01-06T03:00:28.000Z"`)
3. **Normalização**: Sempre normalizar para `YYYY-MM-DD` antes de usar em cálculos
4. **Tempo de Resolução**: Priorizar `tempoDeResolucaoEmDias`, calcular das datas apenas como fallback
5. **SLA**: Baseado em tempo de resolução, não em data de conclusão (exceto categoria "Concluídos")
6. **Filtros de Mês**: Usar `startsWith` no MongoDB para filtrar por `YYYY-MM`
7. **Cache**: Cache keys incluem versão e filtros para garantir invalidação correta

---

## 🚀 Melhorias Futuras Sugeridas

1. **Popular `dataCriacaoIso` e `dataConclusaoIso`**: Criar script de backfill para normalizar datas
2. **Índices**: Adicionar índices em `dataDaCriacao` para melhorar performance de filtros
3. **Validação**: Validar formato de datas na importação
4. **Timezone**: Considerar timezone ao normalizar datas ISO
5. **Histórico**: Manter histórico de mudanças de status e datas

---

**Última atualização**: Janeiro 2025  
**Versão do documento**: 1.0

