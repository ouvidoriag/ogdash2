# Análise de Filtros e Gráficos - Dashboard

## 1. PÁGINAS COM FILTROS FUNCIONANDO ✅

### Páginas da Ouvidoria:

1. **Overview (Main)** - `overview.js`
   - ✅ `chartFunnelStatus` - Status (doughnut)
   - ✅ `chartTopOrgaos` - Órgãos (bar)
   - ✅ `chartTopTemas` - Temas (bar)
   - ✅ `chartTiposManifestacao` - Tipos (doughnut)
   - ✅ `chartCanais` - Canais (doughnut)
   - ✅ `chartPrioridades` - Prioridades (doughnut)
   - ✅ `chartUnidadesCadastro` - Unidades (bar)

2. **Órgão e Mês** - `orgao-mes.js`
   - ✅ `chartOrgaoMes` - Mês (bar)
   - ✅ `chartTopOrgaosBar` - Órgãos (bar)

3. **Tipo** - `tipo.js`
   - ✅ `chartTipo` - Tipos (doughnut/pie)

4. **Status** - `status.js`
   - ✅ `chartStatusPage` - Status (doughnut)
   - ✅ `chartStatusMes` - Mês (bar)

5. **Tema** - `tema.js`
   - ✅ `chartTema` - Temas (bar)
   - ✅ `chartStatusTema` - Status por Tema (doughnut)
   - ✅ `chartTemaMes` - Mês (bar)

6. **Assunto** - `assunto.js`
   - ✅ `chartAssunto` - Assuntos (bar horizontal)
   - ✅ `chartStatusAssunto` - Status por Assunto (doughnut)
   - ✅ `chartAssuntoMes` - Mês (bar)

7. **Bairro** - `bairro.js`
   - ✅ `chartBairro` - Bairros (bar)
   - ✅ `chartBairroMes` - Mês (bar)

8. **Categoria** - `categoria.js`
   - ✅ `chartCategoria` - Categorias (bar)
   - ✅ `chartCategoriaMes` - Mês (bar)

9. **Canal** - `canal.js`
   - ✅ `chartCanal` - Canais (doughnut)

10. **Prioridade** - `prioridade.js`
    - ✅ `chartPrioridade` - Prioridades (doughnut)

11. **Setor** - `setor.js`
    - ✅ `chartSetor` - Setores (bar)

12. **Responsável** - `responsavel.js`
    - ✅ `chartResponsavel` - Responsáveis (bar)

13. **UAC** - `uac.js`
    - ✅ `chartUAC` - UACs (bar)

14. **Secretaria** - `secretaria.js`
    - ✅ `chartSecretaria` - Secretarias (bar)
    - ✅ `chartSecretariaMes` - Mês (bar)

15. **Secretarias e Distritos** - `secretarias-distritos.js`
    - ✅ `chartSecretariasDistritos` - Secretarias por Distrito (bar)

16. **Unidades de Saúde** - `unidades-saude.js`
    - ✅ `chartUnitTipos` - Tipos por Unidade (doughnut) - dinâmico

17. **Reclamações** - `reclamacoes.js`
    - ✅ `chartReclamacoesTipo` - Tipos (bar)
    - ✅ `chartReclamacoesMes` - Mês (bar)

18. **Unidade (dinâmico)** - `unit.js`
    - ✅ `chartUnitTipos` - Tipos por Unidade (doughnut) - dinâmico

### Páginas da Zeladoria:

19. **Zeladoria Overview** - `zeladoria-overview.js`
    - ✅ `zeladoria-chart-status` - Status (doughnut)
    - ✅ `zeladoria-chart-categoria` - Categorias (bar)
    - ✅ `zeladoria-chart-departamento` - Departamentos (bar)
    - ✅ `zeladoria-chart-mensal` - Mensal (line)

20. **Zeladoria Status** - `zeladoria-status.js`
    - ✅ `zeladoria-status-chart` - Status (doughnut)
    - ✅ `zeladoria-status-mes-chart` - Mês (bar)

21. **Zeladoria Categoria** - `zeladoria-categoria.js`
    - ✅ `zeladoria-categoria-chart` - Categorias (bar)
    - ✅ `zeladoria-categoria-mes-chart` - Mês (bar)

22. **Zeladoria Departamento** - `zeladoria-departamento.js`
    - ✅ `zeladoria-departamento-chart` - Departamentos (bar)
    - ✅ `zeladoria-departamento-mes-chart` - Mês (bar)

23. **Zeladoria Bairro** - `zeladoria-bairro.js`
    - ✅ `zeladoria-bairro-chart` - Bairros (bar)
    - ✅ `zeladoria-bairro-mes-chart` - Mês (bar)

24. **Zeladoria Responsável** - `zeladoria-responsavel.js`
    - ✅ `zeladoria-responsavel-chart` - Responsáveis (bar)
    - ✅ `zeladoria-responsavel-mes-chart` - Mês (bar)

25. **Zeladoria Canal** - `zeladoria-canal.js`
    - ✅ `zeladoria-canal-chart` - Canais (doughnut)
    - ✅ `zeladoria-canal-mes-chart` - Mês (bar)

26. **Zeladoria Colab** - `zeladoria-colab.js`
    - ✅ `chartZeladoriaStatus` - Status (doughnut)
    - ✅ `chartZeladoriaCategoria` - Categorias (bar)

---

## 2. GRÁFICOS SEM CONEXÃO DE FILTROS ❌

### Overview (Main) - `overview.js`:

1. ❌ **`chartTrend`** - Tendência Mensal (line)
   - **Problema**: Não tem `onClick: true` e não está no `chartFieldMap`
   - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Data', op: 'contains' }`

2. ❌ **`chartDailyDistribution`** - Distribuição Diária (bar)
   - **Problema**: Não tem `onClick: true` e não está no `chartFieldMap`
   - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Data', op: 'contains' }`

3. ❌ **`chartSLA`** - SLA Overview (doughnut)
   - **Problema**: Não tem `onClick: true` e está mapeado como `{ field: null, op: null }`
   - **Sugestão**: Se não deve filtrar, manter como está. Se deve filtrar, definir campo apropriado.

### Projeção 2026 - `projecao-2026.js`:

4. ❌ **`chartProjecaoMensal`** - Projeção Mensal (line)
   - **Problema**: Tem `onClick: false` mas está no `chartFieldMap` com `{ field: 'Data', op: 'contains' }`
   - **Sugestão**: Se deve filtrar, mudar para `onClick: true`

5. ❌ **`chartCrescimentoPercentual`** - Crescimento Percentual (bar)
   - **Problema**: Não tem `onClick` e não está no `chartFieldMap`
   - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Data', op: 'contains' }`

6. ❌ **`chartComparacaoAnual`** - Comparação Anual (line)
   - **Problema**: Não tem `onClick` e não está no `chartFieldMap`
   - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Data', op: 'contains' }`

7. ❌ **`chartSazonalidade`** - Sazonalidade (bar)
   - **Problema**: Não tem `onClick` e não está no `chartFieldMap`
   - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Data', op: 'contains' }`

8. ❌ **`chartProjecaoTema`** - Projeção por Tema (bar)
   - **Problema**: Não tem `onClick` e não está no `chartFieldMap`
   - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Tema', op: 'eq' }`

9. ❌ **`chartProjecaoTipo`** - Projeção por Tipo (doughnut)
   - **Problema**: Não tem `onClick` e não está no `chartFieldMap`
   - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Tipo', op: 'eq' }`

### Tempo Médio - `tempo-medio.js`:

10. ❌ **`chartTempoMedio`** - Tempo Médio por Órgão (bar)
    - **Problema**: Não tem `onClick: true` mas está no `chartFieldMap` com `{ field: 'Orgaos', op: 'contains' }`
    - **Sugestão**: Adicionar `onClick: true`

11. ❌ **`chartTempoMedioMes`** - Tempo Médio Mensal (line)
    - **Problema**: Não tem `onClick: true` mas está no `chartFieldMap` com `{ field: 'Data', op: 'contains' }`
    - **Sugestão**: Adicionar `onClick: true`

12. ❌ **`chartTempoMedioDia`** - Tempo Médio Diário (line)
    - **Problema**: Não tem `onClick: true` mas está no `chartFieldMap` com `{ field: 'Data', op: 'contains' }`
    - **Sugestão**: Adicionar `onClick: true`

13. ❌ **`chartTempoMedioSemana`** - Tempo Médio Semanal (line)
    - **Problema**: Não tem `onClick: true` mas está no `chartFieldMap` com `{ field: 'Data', op: 'contains' }`
    - **Sugestão**: Adicionar `onClick: true`

14. ❌ **`chartTempoMedioUnidade`** - Tempo Médio por Unidade (bar)
    - **Problema**: Não tem `onClick: true` mas está no `chartFieldMap` com `{ field: 'Unidade', op: 'contains' }`
    - **Sugestão**: Adicionar `onClick: true`

15. ❌ **`chartTempoMedioUnidadeMes`** - Tempo Médio Unidade Mensal (line)
    - **Problema**: Não tem `onClick: true` mas está no `chartFieldMap` com `{ field: 'Data', op: 'contains' }`
    - **Sugestão**: Adicionar `onClick: true`

### Cadastrante - `cadastrante.js`:

16. ❌ **`chartCadastranteMes`** - Cadastrante Mensal (bar)
    - **Problema**: Não tem `onClick: true` mas está no `chartFieldMap` com `{ field: 'Data', op: 'contains' }`
    - **Sugestão**: Adicionar `onClick: true`

### Zeladoria Tempo - `zeladoria-tempo.js`:

17. ❌ **`zeladoria-tempo-mes-chart`** - Tempo Mensal (line)
    - **Problema**: Não tem `onClick: true` e não está no `chartFieldMap`
    - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Data', op: 'contains' }`

18. ❌ **`zeladoria-tempo-distribuicao-chart`** - Distribuição de Tempo (bar)
    - **Problema**: Não tem `onClick: true` e não está no `chartFieldMap`
    - **Sugestão**: Se deve filtrar, adicionar `onClick: true` e mapear campo apropriado

### Zeladoria Mensal - `zeladoria-mensal.js`:

19. ❌ **`zeladoria-mensal-chart`** - Mensal Zeladoria (line)
    - **Problema**: Não tem `onClick: true` mas está no `chartFieldMap` com `{ field: 'Data', op: 'contains' }`
    - **Sugestão**: Adicionar `onClick: true`

### Zeladoria Categoria - `zeladoria-categoria.js`:

20. ❌ **`zeladoria-categoria-dept-chart`** - Categoria por Departamento (bar)
    - **Problema**: Não tem `onClick: true` e não está no `chartFieldMap`
    - **Sugestão**: Adicionar `onClick: true` e mapear para `{ field: 'Departamento', op: 'contains' }`

---

## RESUMO

### Total de Páginas com Filtros: **26 páginas** ✅

### Total de Gráficos sem Filtros: **20 gráficos** ❌

### Distribuição dos Gráficos sem Filtros:
- **Overview**: 3 gráficos
- **Projeção 2026**: 6 gráficos
- **Tempo Médio**: 6 gráficos
- **Cadastrante**: 1 gráfico
- **Zeladoria Tempo**: 2 gráficos
- **Zeladoria Mensal**: 1 gráfico
- **Zeladoria Categoria**: 1 gráfico

---

## PRÓXIMOS PASSOS RECOMENDADOS

1. **Prioridade Alta**: Adicionar filtros aos gráficos de Tempo Médio (6 gráficos)
2. **Prioridade Média**: Adicionar filtros aos gráficos do Overview (3 gráficos)
3. **Prioridade Baixa**: Adicionar filtros aos gráficos de Projeção 2026 (6 gráficos) - podem ser informativos apenas
4. **Verificar**: Se `chartSLA` deve ter filtro ou não (atualmente está como `null`)

