# 🔍 Análise Comparativa: Painel Looker Studio vs Dashboard Atual

## 📊 Diagnóstico do Sistema e Dados Detectados

### Estrutura do Painel Looker Studio (Oficial)

O painel oficial mostra 4 visualizações principais:

1. **TOTAL POR UNIDADE DE ATENDIMENTO AO CIDADÃO - UAC**
   - Gráfico de barras horizontais
   - Mostra: UAC - Adão Pereira Nunes (2.419), Cidadão (1.526), UAC - Hospital Duque (922), etc.

2. **RESPONSÁVEIS PELO TRATAMENTO DA DEMANDA**
   - Gráfico de barras horizontais
   - Mostra: Ouvidoria Setorial da Saúde (9.687), Ouvidoria Geral (4.146), etc.

3. **TOTAL DE MANIFESTAÇÕES CADASTRADAS**
   - KPI numérico: **14.795**

4. **CADASTROS POR OUVIDORIA**
   - Gráfico de barras horizontais
   - Mostra distribuição por tipo de ouvidoria

### Campos Identificados nos Dados

Analisando os dados do sistema, encontramos:
- ✅ `unidade_cadastro` → equivalente a "UAC - Unidade de Atendimento ao Cidadão"
- ✅ `responsavel` → "Responsáveis pelo Tratamento da Demanda"
- ✅ `status_demanda` → Status das demandas
- ✅ `tipo_de_manifestacao` → Tipo de manifestação
- ✅ `tema` / `assunto` → Categorias
- ✅ `orgaos` → Secretarias/Órgãos

## 🗂️ Estrutura dos Campos Normalizados

### Campos Atuais no Schema Prisma

```prisma
model Record {
  secretaria String?  // Pode mapear para "orgaos"
  setor      String?  // Pode mapear para "unidade_cadastro"
  tipo       String?  // Mapeia para "tipo_de_manifestacao"
  categoria  String?  // Mapeia para "tema" ou "assunto"
  bairro     String?
  status     String?  // Mapeia para "status_demanda"
  dataIso    String?
}
```

### Campos Faltantes Identificados

Para alinhar com o painel Looker Studio, precisamos adicionar:

1. **`uac`** ou **`unidadeAtendimento`**: Mapear de `unidade_cadastro`
2. **`responsavel`**: Mapear de `responsavel` (Ouvidorias setoriais)
3. **`canal`**: Mapear de `canal` (Presencial, Telefone, etc.)
4. **`prioridade`**: Mapear de `prioridade` (Alta, Média, Baixa)

## 📊 Segmentos e Visualizações Sugeridas

### Segmentos Existentes (✅ Já Implementados)

1. ✅ **Total de Manifestações** - KPI principal
2. ✅ **Últimos 7 e 30 dias** - KPIs de tendência
3. ✅ **Por Secretaria** - Gráficos de barras
4. ✅ **Por Setor** - Gráficos de barras
5. ✅ **Por Categoria** - Gráficos e heatmaps
6. ✅ **Por Status** - Gráficos de pizza
7. ✅ **Por Bairro** - Análise geográfica
8. ✅ **Série Temporal** - Gráficos de linha
9. ✅ **Heatmap Mensal** - Visualização matricial
10. ✅ **SLA Summary** - Indicadores de prazo

### Segmentos Faltantes (❌ Não Implementados)

1. ❌ **Total por UAC (Unidade de Atendimento ao Cidadão)**
   - Visualização: Gráfico de barras horizontais
   - Endpoint necessário: `/api/aggregate/count-by?field=UAC`
   - Campo a normalizar: `uac` ou usar `setor` com alias

2. ❌ **Responsáveis pelo Tratamento da Demanda**
   - Visualização: Gráfico de barras horizontais
   - Endpoint necessário: `/api/aggregate/count-by?field=Responsavel`
   - Campo a normalizar: `responsavel`

3. ❌ **Cadastros por Ouvidoria**
   - Visualização: Gráfico de barras horizontais
   - Similar ao de Responsáveis, mas agrupa por tipo de ouvidoria
   - Endpoint necessário: `/api/aggregate/count-by?field=Ouvidoria`

4. ❌ **Manifestações por Canal**
   - Visualização: Gráfico de pizza ou barras
   - Endpoint necessário: `/api/aggregate/count-by?field=Canal`
   - Campo a normalizar: `canal`

5. ❌ **Manifestações por Prioridade**
   - Visualização: Gráfico de barras ou pizza
   - Endpoint necessário: `/api/aggregate/count-by?field=Prioridade`
   - Campo a normalizar: `prioridade`

## 🧩 Ajustes Necessários no Dashboard

### 1. Atualizar Schema Prisma

Adicionar campos normalizados:

```prisma
model Record {
  // ... campos existentes ...
  uac         String?  // Unidade de Atendimento ao Cidadão
  responsavel String?  // Responsável pelo tratamento
  canal       String?  // Canal de entrada (Presencial, Telefone, etc.)
  prioridade  String?  // Prioridade (Alta, Média, Baixa)
  
  @@index([uac])
  @@index([responsavel])
  @@index([canal])
  @@index([prioridade])
}
```

### 2. Atualizar Script de Backfill

Em `scripts/backfillNormalized.js`, adicionar mapeamento:

```javascript
// Mapeamento de UAC
const uacMap = {
  'unidade_cadastro': 'uac',
  'Unidade de Atendimento': 'uac',
  'UAC': 'uac'
};

// Mapeamento de Responsável
const responsavelMap = {
  'responsavel': 'responsavel',
  'Responsável': 'responsavel',
  'Ouvidoria': 'responsavel'
};

// Mapeamento de Canal
const canalMap = {
  'canal': 'canal',
  'Canal': 'canal'
};

// Mapeamento de Prioridade
const prioridadeMap = {
  'prioridade': 'prioridade',
  'Prioridade': 'prioridade'
};
```

### 3. Atualizar Aliases no Server.js

Em `src/server.js`, adicionar aliases:

```javascript
app.get('/api/meta/aliases', (_req, res) => {
  res.json({
    aliases: {
      // ... aliases existentes ...
      UAC: ['UAC', 'Unidade de Atendimento', 'unidade_cadastro', 'Unidade Cadastro'],
      Responsavel: ['Responsável', 'responsavel', 'Ouvidoria Responsável'],
      Canal: ['Canal', 'canal', 'Canal de Entrada'],
      Prioridade: ['Prioridade', 'prioridade']
    }
  });
});
```

### 4. Adicionar Novas Páginas no Dashboard

No `public/index.html`, adicionar:

```html
<!-- Menu lateral -->
<div data-page="uac" class="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
  Unidades de Atendimento (UAC)
</div>
<div data-page="responsavel" class="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
  Responsáveis
</div>
<div data-page="canal" class="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
  Canais
</div>
<div data-page="prioridade" class="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
  Prioridades
</div>
```

### 5. Criar Visualizações Específicas

#### Painel UAC (Unidades de Atendimento)
- Gráfico de barras horizontais (como no Looker Studio)
- Ranking das top 10 unidades
- KPI: Total de atendimentos por UAC

#### Painel Responsáveis
- Gráfico de barras horizontais
- Agrupamento por Ouvidorias Setoriais
- Comparação: Ouvidoria Geral vs Setoriais

#### Painel Canais
- Gráfico de pizza mostrando distribuição
- Comparação temporal de canais
- Tendência de uso de cada canal

#### Painel Prioridades
- Gráfico de barras por prioridade
- Análise de SLA por prioridade
- Distribuição de demandas críticas

## 💡 Insights e Observações Úteis

### Dados Identificados no Looker Studio

1. **Total de Manifestações**: 14.795
   - Nosso dashboard já mostra esse KPI

2. **Distribuição por UAC**:
   - UAC - Adão Pereira Nunes: 2.419 (maior)
   - Cidadão: 1.526
   - UAC - Hospital Duque: 922
   - UAC - Hospital Infantil: 834
   - UAC - UPA Beira Mar: 784

3. **Distribuição por Responsável**:
   - Ouvidoria Setorial da Saúde: 9.687 (67% do total)
   - Ouvidoria Geral: 4.146 (28% do total)
   - Outras ouvidorias setoriais: menores proporções

4. **Padrões Identificados**:
   - Saúde é a área com mais demandas
   - UACs hospitalares concentram grande volume
   - Canais presenciais dominam

### Recomendações de Implementação

**Prioridade ALTA:**
1. ✅ Adicionar campo `uac` normalizado
2. ✅ Adicionar campo `responsavel` normalizado
3. ✅ Criar visualização "Total por UAC"
4. ✅ Criar visualização "Responsáveis pelo Tratamento"

**Prioridade MÉDIA:**
5. ✅ Adicionar campo `canal` normalizado
6. ✅ Adicionar campo `prioridade` normalizado
7. ✅ Criar visualizações de Canais e Prioridades

**Prioridade BAIXA:**
8. Melhorar comparação com dados do Looker Studio
9. Adicionar exportação de relatórios
10. Implementar filtros combinados avançados

## 🔄 Próximos Passos

1. **Atualizar Schema**: Adicionar campos `uac`, `responsavel`, `canal`, `prioridade`
2. **Atualizar Backfill**: Mapear campos do Excel para normalizados
3. **Criar Endpoints**: Garantir que `/api/aggregate/count-by` funcione com novos campos
4. **Atualizar Frontend**: Adicionar páginas e visualizações específicas
5. **Testar**: Validar que os dados correspondem ao Looker Studio
6. **Documentar**: Atualizar README com novas funcionalidades

---

**Status**: Análise completa - Pronto para implementação

**Data**: 05/11/2025

