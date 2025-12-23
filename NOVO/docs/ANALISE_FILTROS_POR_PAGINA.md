# 📊 ANÁLISE DE FILTROS POR PÁGINA
## Sugestões de Filtros Adicionais para Cada Página

**Data:** 18/12/2025  
**Autor:** CÉREBRO X-3

---

## 🎯 OBJETIVO

Analisar cada página do sistema e identificar quais filtros adicionais poderiam ser implementados para melhorar a experiência de análise e exploração de dados.

---

## 📋 MÓDULO: OUVIDORIA

### 1. **Página: Overview (Visão Geral)**
**Filtros Atuais:**
- ✅ Mês (filtro de data)
- ✅ Status (via crossfilter)
- ✅ Tema (via crossfilter)
- ✅ Órgãos (via crossfilter)
- ✅ Tipo (via crossfilter)
- ✅ Canal (via crossfilter)
- ✅ Prioridade (via crossfilter)
- ✅ Bairro (via crossfilter)

**Filtros Sugeridos:**
- ⭐ **Assunto** - Filtrar por assunto específico (campo disponível no schema)
- ⭐ **Responsável** - Filtrar por responsável pela demanda
- ⭐ **Unidade de Cadastro** - Filtrar por unidade onde foi cadastrado
- ⭐ **Unidade de Saúde** - Filtrar por unidade de saúde relacionada
- ⭐ **Prazo Restante** - Filtrar por faixas de prazo (ex: "Vencido", "0-5 dias", "6-15 dias", "16-30 dias")
- ⭐ **Tempo de Resolução** - Filtrar por faixas de tempo de resolução (ex: "0-5 dias", "6-15 dias", "16-30 dias", "30+ dias")
- ⭐ **Data de Conclusão** - Filtrar por período de conclusão
- ⭐ **Servidor** - Filtrar por servidor responsável
- ⭐ **Verificado** - Filtrar por status de verificação (sim/não)

---

### 2. **Página: Tema**
**Filtros Atuais:**
- ✅ Mês (filtro de data)
- ✅ Status (via crossfilter)
- ✅ Tema (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Órgãos** - Filtrar temas por órgão responsável
- ⭐ **Tipo de Manifestação** - Filtrar temas por tipo (reclamação, sugestão, elogio, etc.)
- ⭐ **Prioridade** - Filtrar temas por prioridade
- ⭐ **Canal** - Filtrar temas por canal de entrada
- ⭐ **Bairro** - Filtrar temas por localização geográfica
- ⭐ **Assunto** - Filtrar temas por assunto específico
- ⭐ **Responsável** - Filtrar temas por responsável
- ⭐ **Prazo Restante** - Filtrar temas por urgência de prazo

---

### 3. **Página: Status**
**Filtros Atuais:**
- ✅ Status (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar status por período mensal
- ⭐ **Tema** - Filtrar status por tema
- ⭐ **Órgãos** - Filtrar status por órgão responsável
- ⭐ **Tipo de Manifestação** - Filtrar status por tipo
- ⭐ **Prioridade** - Filtrar status por prioridade
- ⭐ **Canal** - Filtrar status por canal de entrada
- ⭐ **Bairro** - Filtrar status por localização
- ⭐ **Prazo Restante** - Filtrar status por urgência
- ⭐ **Data de Conclusão** - Filtrar status concluídos por período

---

### 4. **Página: Bairro**
**Filtros Atuais:**
- ✅ Mês (filtro de data)
- ✅ Status (via crossfilter)
- ✅ Bairro (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Tema** - Filtrar bairros por tema mais comum
- ⭐ **Órgãos** - Filtrar bairros por órgão responsável
- ⭐ **Tipo de Manifestação** - Filtrar bairros por tipo
- ⭐ **Prioridade** - Filtrar bairros por prioridade
- ⭐ **Canal** - Filtrar bairros por canal de entrada
- ⭐ **Status** - Filtrar bairros por status (já existe via crossfilter, mas poderia ter filtro dedicado)
- ⭐ **Unidade de Saúde** - Filtrar bairros próximos a unidades de saúde específicas
- ⭐ **Prazo Restante** - Filtrar bairros por urgência

---

### 5. **Página: Canal**
**Filtros Atuais:**
- ✅ Mês (filtro de data)
- ✅ Canal (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Status** - Filtrar canais por status das demandas
- ⭐ **Tema** - Filtrar canais por tema mais comum
- ⭐ **Órgãos** - Filtrar canais por órgão responsável
- ⭐ **Tipo de Manifestação** - Filtrar canais por tipo
- ⭐ **Prioridade** - Filtrar canais por prioridade
- ⭐ **Bairro** - Filtrar canais por localização geográfica
- ⭐ **Período de Tempo** - Filtrar canais por faixas de tempo (manhã, tarde, noite, fim de semana)

---

### 6. **Página: Tempo Médio**
**Filtros Atuais:**
- ✅ Mês (filtro de data)
- ✅ Status (filtro de status: concluído, em andamento)
- ✅ Órgãos (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Tema** - Filtrar tempo médio por tema
- ⭐ **Tipo de Manifestação** - Filtrar tempo médio por tipo
- ⭐ **Prioridade** - Filtrar tempo médio por prioridade
- ⭐ **Canal** - Filtrar tempo médio por canal de entrada
- ⭐ **Bairro** - Filtrar tempo médio por localização
- ⭐ **Responsável** - Filtrar tempo médio por responsável
- ⭐ **Unidade de Cadastro** - Filtrar tempo médio por unidade
- ⭐ **Faixa de Tempo de Resolução** - Filtrar por faixas (ex: "0-5 dias", "6-15 dias", etc.)
- ⭐ **Período de Criação** - Filtrar por período de criação (trimestre, semestre, ano)

---

### 7. **Página: Responsável**
**Filtros Atuais:**
- ✅ Mês (filtro de data)
- ✅ Responsável (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Status** - Filtrar responsáveis por status das demandas
- ⭐ **Tema** - Filtrar responsáveis por tema
- ⭐ **Órgãos** - Filtrar responsáveis por órgão
- ⭐ **Tipo de Manifestação** - Filtrar responsáveis por tipo
- ⭐ **Prioridade** - Filtrar responsáveis por prioridade
- ⭐ **Canal** - Filtrar responsáveis por canal
- ⭐ **Bairro** - Filtrar responsáveis por localização
- ⭐ **Prazo Restante** - Filtrar responsáveis por urgência
- ⭐ **Tempo de Resolução** - Filtrar responsáveis por performance (tempo médio)

---

### 8. **Página: Órgão/Mês**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtro dedicado de mês (não apenas via crossfilter)
- ⭐ **Status** - Filtrar órgãos/mês por status
- ⭐ **Tema** - Filtrar órgãos/mês por tema
- ⭐ **Tipo de Manifestação** - Filtrar órgãos/mês por tipo
- ⭐ **Prioridade** - Filtrar órgãos/mês por prioridade
- ⭐ **Canal** - Filtrar órgãos/mês por canal
- ⭐ **Bairro** - Filtrar órgãos/mês por localização
- ⭐ **Período** - Filtro de período (trimestre, semestre, ano)

---

### 9. **Página: Prioridade**
**Filtros Atuais:**
- ✅ Prioridade (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar prioridades por período mensal
- ⭐ **Status** - Filtrar prioridades por status
- ⭐ **Tema** - Filtrar prioridades por tema
- ⭐ **Órgãos** - Filtrar prioridades por órgão
- ⭐ **Tipo de Manifestação** - Filtrar prioridades por tipo
- ⭐ **Canal** - Filtrar prioridades por canal
- ⭐ **Bairro** - Filtrar prioridades por localização
- ⭐ **Prazo Restante** - Filtrar prioridades por urgência

---

### 10. **Página: Tipo**
**Filtros Atuais:**
- ✅ Tipo (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar tipos por período mensal
- ⭐ **Status** - Filtrar tipos por status
- ⭐ **Tema** - Filtrar tipos por tema
- ⭐ **Órgãos** - Filtrar tipos por órgão
- ⭐ **Prioridade** - Filtrar tipos por prioridade
- ⭐ **Canal** - Filtrar tipos por canal
- ⭐ **Bairro** - Filtrar tipos por localização
- ⭐ **Responsável** - Filtrar tipos por responsável

---

### 11. **Página: Assunto**
**Filtros Atuais:**
- ✅ Assunto (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar assuntos por período mensal
- ⭐ **Status** - Filtrar assuntos por status
- ⭐ **Tema** - Filtrar assuntos por tema relacionado
- ⭐ **Órgãos** - Filtrar assuntos por órgão
- ⭐ **Tipo de Manifestação** - Filtrar assuntos por tipo
- ⭐ **Prioridade** - Filtrar assuntos por prioridade
- ⭐ **Canal** - Filtrar assuntos por canal
- ⭐ **Bairro** - Filtrar assuntos por localização
- ⭐ **Responsável** - Filtrar assuntos por responsável

---

### 12. **Página: Unidades de Saúde**
**Filtros Atuais:**
- ✅ Unidade de Saúde (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar unidades por período mensal
- ⭐ **Status** - Filtrar unidades por status
- ⭐ **Tema** - Filtrar unidades por tema
- ⭐ **Órgãos** - Filtrar unidades por órgão responsável
- ⭐ **Tipo de Manifestação** - Filtrar unidades por tipo
- ⭐ **Prioridade** - Filtrar unidades por prioridade
- ⭐ **Canal** - Filtrar unidades por canal
- ⭐ **Bairro** - Filtrar unidades por localização do bairro
- ⭐ **Responsável** - Filtrar unidades por responsável

---

### 13. **Página: Vencimento**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Prazo Restante** - Filtrar por faixas de prazo (ex: "Vencido", "0-5 dias", "6-15 dias", "16-30 dias", "30+ dias")
- ⭐ **Status** - Filtrar vencimentos por status
- ⭐ **Tema** - Filtrar vencimentos por tema
- ⭐ **Órgãos** - Filtrar vencimentos por órgão
- ⭐ **Tipo de Manifestação** - Filtrar vencimentos por tipo
- ⭐ **Prioridade** - Filtrar vencimentos por prioridade
- ⭐ **Canal** - Filtrar vencimentos por canal
- ⭐ **Bairro** - Filtrar vencimentos por localização
- ⭐ **Responsável** - Filtrar vencimentos por responsável
- ⭐ **Mês de Criação** - Filtrar vencimentos por mês de criação

---

### 14. **Página: Reclamações**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar reclamações por período mensal
- ⭐ **Status** - Filtrar reclamações por status
- ⭐ **Tema** - Filtrar reclamações por tema
- ⭐ **Órgãos** - Filtrar reclamações por órgão
- ⭐ **Prioridade** - Filtrar reclamações por prioridade
- ⭐ **Canal** - Filtrar reclamações por canal
- ⭐ **Bairro** - Filtrar reclamações por localização
- ⭐ **Responsável** - Filtrar reclamações por responsável
- ⭐ **Prazo Restante** - Filtrar reclamações por urgência

---

### 15. **Página: Cadastrante**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar cadastrantes por período mensal
- ⭐ **Status** - Filtrar cadastrantes por status
- ⭐ **Tema** - Filtrar cadastrantes por tema
- ⭐ **Órgãos** - Filtrar cadastrantes por órgão
- ⭐ **Tipo de Manifestação** - Filtrar cadastrantes por tipo
- ⭐ **Prioridade** - Filtrar cadastrantes por prioridade
- ⭐ **Canal** - Filtrar cadastrantes por canal
- ⭐ **Bairro** - Filtrar cadastrantes por localização

---

### 16. **Página: Projeção 2026**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar projeções por período mensal
- ⭐ **Status** - Filtrar projeções por status
- ⭐ **Tema** - Filtrar projeções por tema
- ⭐ **Órgãos** - Filtrar projeções por órgão
- ⭐ **Tipo de Manifestação** - Filtrar projeções por tipo
- ⭐ **Prioridade** - Filtrar projeções por prioridade
- ⭐ **Canal** - Filtrar projeções por canal
- ⭐ **Bairro** - Filtrar projeções por localização
- ⭐ **Período Base** - Filtrar projeções por período base de cálculo

---

### 17. **Página: Notificações**
**Filtros Atuais:**
- ✅ Mês (filtro de data)

**Filtros Sugeridos:**
- ⭐ **Status** - Filtrar notificações por status
- ⭐ **Tipo de Notificação** - Filtrar por tipo (15 dias antes, vencimento, 30 dias após, etc.)
- ⭐ **Órgãos** - Filtrar notificações por órgão
- ⭐ **Tema** - Filtrar notificações por tema
- ⭐ **Prioridade** - Filtrar notificações por prioridade
- ⭐ **Canal** - Filtrar notificações por canal
- ⭐ **Bairro** - Filtrar notificações por localização
- ⭐ **Responsável** - Filtrar notificações por responsável
- ⭐ **Status de Envio** - Filtrar por status de envio (enviado, pendente, erro)

---

## 📋 MÓDULO: e-SIC

### 18. **Página: e-SIC Overview**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar por período mensal
- ⭐ **Status** - Filtrar por status da solicitação
- ⭐ **Tipo de Informação** - Filtrar por tipo de informação solicitada
- ⭐ **Responsável** - Filtrar por responsável
- ⭐ **Unidade** - Filtrar por unidade responsável
- ⭐ **Canal** - Filtrar por canal de entrada
- ⭐ **Prioridade** - Filtrar por prioridade
- ⭐ **Data de Encerramento** - Filtrar por período de encerramento
- ⭐ **Tempo de Resposta** - Filtrar por faixas de tempo de resposta

---

### 19. **Página: e-SIC Status**
**Filtros Atuais:**
- ✅ Status (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar status por período mensal
- ⭐ **Tipo de Informação** - Filtrar status por tipo
- ⭐ **Responsável** - Filtrar status por responsável
- ⭐ **Unidade** - Filtrar status por unidade
- ⭐ **Canal** - Filtrar status por canal
- ⭐ **Prioridade** - Filtrar status por prioridade
- ⭐ **Data de Encerramento** - Filtrar status por período de encerramento

---

### 20. **Página: e-SIC Tipo de Informação**
**Filtros Atuais:**
- ✅ Tipo de Informação (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar tipos por período mensal
- ⭐ **Status** - Filtrar tipos por status
- ⭐ **Responsável** - Filtrar tipos por responsável
- ⭐ **Unidade** - Filtrar tipos por unidade
- ⭐ **Canal** - Filtrar tipos por canal
- ⭐ **Prioridade** - Filtrar tipos por prioridade
- ⭐ **Tempo de Resposta** - Filtrar tipos por tempo de resposta

---

### 21. **Página: e-SIC Responsável**
**Filtros Atuais:**
- ✅ Responsável (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar responsáveis por período mensal
- ⭐ **Status** - Filtrar responsáveis por status
- ⭐ **Tipo de Informação** - Filtrar responsáveis por tipo
- ⭐ **Unidade** - Filtrar responsáveis por unidade
- ⭐ **Canal** - Filtrar responsáveis por canal
- ⭐ **Prioridade** - Filtrar responsáveis por prioridade
- ⭐ **Tempo de Resposta** - Filtrar responsáveis por performance

---

### 22. **Página: e-SIC Unidade**
**Filtros Atuais:**
- ✅ Unidade (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar unidades por período mensal
- ⭐ **Status** - Filtrar unidades por status
- ⭐ **Tipo de Informação** - Filtrar unidades por tipo
- ⭐ **Responsável** - Filtrar unidades por responsável
- ⭐ **Canal** - Filtrar unidades por canal
- ⭐ **Prioridade** - Filtrar unidades por prioridade
- ⭐ **Tempo de Resposta** - Filtrar unidades por tempo de resposta

---

### 23. **Página: e-SIC Canal**
**Filtros Atuais:**
- ✅ Canal (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar canais por período mensal
- ⭐ **Status** - Filtrar canais por status
- ⭐ **Tipo de Informação** - Filtrar canais por tipo
- ⭐ **Responsável** - Filtrar canais por responsável
- ⭐ **Unidade** - Filtrar canais por unidade
- ⭐ **Prioridade** - Filtrar canais por prioridade
- ⭐ **Tempo de Resposta** - Filtrar canais por tempo de resposta

---

### 24. **Página: e-SIC Mensal**
**Filtros Atuais:**
- ✅ Mês (filtro de data)

**Filtros Sugeridos:**
- ⭐ **Status** - Filtrar análise mensal por status
- ⭐ **Tipo de Informação** - Filtrar análise mensal por tipo
- ⭐ **Responsável** - Filtrar análise mensal por responsável
- ⭐ **Unidade** - Filtrar análise mensal por unidade
- ⭐ **Canal** - Filtrar análise mensal por canal
- ⭐ **Prioridade** - Filtrar análise mensal por prioridade
- ⭐ **Período** - Filtro de período (trimestre, semestre, ano)

---

## 📋 MÓDULO: ZELADORIA

### 25. **Página: Zeladoria Overview**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar por período mensal
- ⭐ **Status** - Filtrar por status da demanda
- ⭐ **Categoria** - Filtrar por categoria
- ⭐ **Departamento** - Filtrar por departamento
- ⭐ **Responsável** - Filtrar por responsável
- ⭐ **Canal** - Filtrar por canal de entrada
- ⭐ **Bairro** - Filtrar por localização geográfica
- ⭐ **Colaborador** - Filtrar por colaborador
- ⭐ **Tempo de Resolução** - Filtrar por faixas de tempo

---

### 26. **Página: Zeladoria Status**
**Filtros Atuais:**
- ✅ Status (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar status por período mensal
- ⭐ **Categoria** - Filtrar status por categoria
- ⭐ **Departamento** - Filtrar status por departamento
- ⭐ **Responsável** - Filtrar status por responsável
- ⭐ **Canal** - Filtrar status por canal
- ⭐ **Bairro** - Filtrar status por localização
- ⭐ **Colaborador** - Filtrar status por colaborador

---

### 27. **Página: Zeladoria Categoria**
**Filtros Atuais:**
- ✅ Categoria (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar categorias por período mensal
- ⭐ **Status** - Filtrar categorias por status
- ⭐ **Departamento** - Filtrar categorias por departamento
- ⭐ **Responsável** - Filtrar categorias por responsável
- ⭐ **Canal** - Filtrar categorias por canal
- ⭐ **Bairro** - Filtrar categorias por localização
- ⭐ **Colaborador** - Filtrar categorias por colaborador

---

### 28. **Página: Zeladoria Departamento**
**Filtros Atuais:**
- ✅ Departamento (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar departamentos por período mensal
- ⭐ **Status** - Filtrar departamentos por status
- ⭐ **Categoria** - Filtrar departamentos por categoria
- ⭐ **Responsável** - Filtrar departamentos por responsável
- ⭐ **Canal** - Filtrar departamentos por canal
- ⭐ **Bairro** - Filtrar departamentos por localização
- ⭐ **Colaborador** - Filtrar departamentos por colaborador

---

### 29. **Página: Zeladoria Responsável**
**Filtros Atuais:**
- ✅ Responsável (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar responsáveis por período mensal
- ⭐ **Status** - Filtrar responsáveis por status
- ⭐ **Categoria** - Filtrar responsáveis por categoria
- ⭐ **Departamento** - Filtrar responsáveis por departamento
- ⭐ **Canal** - Filtrar responsáveis por canal
- ⭐ **Bairro** - Filtrar responsáveis por localização
- ⭐ **Colaborador** - Filtrar responsáveis por colaborador
- ⭐ **Tempo de Resolução** - Filtrar responsáveis por performance

---

### 30. **Página: Zeladoria Canal**
**Filtros Atuais:**
- ✅ Canal (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar canais por período mensal
- ⭐ **Status** - Filtrar canais por status
- ⭐ **Categoria** - Filtrar canais por categoria
- ⭐ **Departamento** - Filtrar canais por departamento
- ⭐ **Responsável** - Filtrar canais por responsável
- ⭐ **Bairro** - Filtrar canais por localização
- ⭐ **Colaborador** - Filtrar canais por colaborador

---

### 31. **Página: Zeladoria Bairro**
**Filtros Atuais:**
- ✅ Bairro (via crossfilter - gráfico principal)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar bairros por período mensal
- ⭐ **Status** - Filtrar bairros por status
- ⭐ **Categoria** - Filtrar bairros por categoria
- ⭐ **Departamento** - Filtrar bairros por departamento
- ⭐ **Responsável** - Filtrar bairros por responsável
- ⭐ **Canal** - Filtrar bairros por canal
- ⭐ **Colaborador** - Filtrar bairros por colaborador

---

### 32. **Página: Zeladoria Mensal**
**Filtros Atuais:**
- ✅ Mês (filtro de data)

**Filtros Sugeridos:**
- ⭐ **Status** - Filtrar análise mensal por status
- ⭐ **Categoria** - Filtrar análise mensal por categoria
- ⭐ **Departamento** - Filtrar análise mensal por departamento
- ⭐ **Responsável** - Filtrar análise mensal por responsável
- ⭐ **Canal** - Filtrar análise mensal por canal
- ⭐ **Bairro** - Filtrar análise mensal por localização
- ⭐ **Colaborador** - Filtrar análise mensal por colaborador
- ⭐ **Período** - Filtro de período (trimestre, semestre, ano)

---

### 33. **Página: Zeladoria Tempo**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar tempo por período mensal
- ⭐ **Status** - Filtrar tempo por status
- ⭐ **Categoria** - Filtrar tempo por categoria
- ⭐ **Departamento** - Filtrar tempo por departamento
- ⭐ **Responsável** - Filtrar tempo por responsável
- ⭐ **Canal** - Filtrar tempo por canal
- ⭐ **Bairro** - Filtrar tempo por localização
- ⭐ **Colaborador** - Filtrar tempo por colaborador
- ⭐ **Faixa de Tempo** - Filtrar por faixas de tempo de resolução

---

### 34. **Página: Zeladoria Geográfica**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar análise geográfica por período mensal
- ⭐ **Status** - Filtrar análise geográfica por status
- ⭐ **Categoria** - Filtrar análise geográfica por categoria
- ⭐ **Departamento** - Filtrar análise geográfica por departamento
- ⭐ **Responsável** - Filtrar análise geográfica por responsável
- ⭐ **Canal** - Filtrar análise geográfica por canal
- ⭐ **Bairro** - Filtrar análise geográfica por bairro específico
- ⭐ **Colaborador** - Filtrar análise geográfica por colaborador
- ⭐ **Raio de Busca** - Filtrar por raio de busca geográfica

---

### 35. **Página: Zeladoria Mapa**
**Filtros Atuais:**
- ✅ Filtros globais (crossfilter)

**Filtros Sugeridos:**
- ⭐ **Mês** - Filtrar mapa por período mensal
- ⭐ **Status** - Filtrar mapa por status
- ⭐ **Categoria** - Filtrar mapa por categoria
- ⭐ **Departamento** - Filtrar mapa por departamento
- ⭐ **Responsável** - Filtrar mapa por responsável
- ⭐ **Canal** - Filtrar mapa por canal
- ⭐ **Bairro** - Filtrar mapa por bairro
- ⭐ **Colaborador** - Filtrar mapa por colaborador
- ⭐ **Zoom** - Controle de zoom do mapa
- ⭐ **Tipo de Mapa** - Alternar entre mapa de calor, pontos, clusters

---

## 🎯 RESUMO GERAL

### Filtros Mais Frequentes (Sugeridos para Múltiplas Páginas):

1. **Mês/Período** - ⭐⭐⭐⭐⭐ (Crítico - presente em quase todas as páginas)
2. **Status** - ⭐⭐⭐⭐⭐ (Crítico - presente em quase todas as páginas)
3. **Tema/Categoria** - ⭐⭐⭐⭐ (Muito importante)
4. **Órgãos/Departamento** - ⭐⭐⭐⭐ (Muito importante)
5. **Tipo de Manifestação** - ⭐⭐⭐ (Importante)
6. **Prioridade** - ⭐⭐⭐ (Importante)
7. **Canal** - ⭐⭐⭐ (Importante)
8. **Bairro** - ⭐⭐⭐ (Importante)
9. **Responsável** - ⭐⭐⭐ (Importante)
10. **Prazo Restante** - ⭐⭐ (Útil para análises de urgência)

### Filtros Específicos por Contexto:

- **Tempo de Resolução** - Para páginas de performance
- **Data de Conclusão** - Para análises de conclusão
- **Unidade de Saúde/Cadastro** - Para análises específicas
- **Assunto** - Para análises detalhadas
- **Servidor** - Para análises de infraestrutura
- **Verificado** - Para análises de qualidade

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

1. **Priorização**: Implementar primeiro os filtros mais frequentes (Mês, Status, Tema, Órgãos)
2. **Reutilização**: Criar componentes reutilizáveis para filtros comuns
3. **Performance**: Considerar cache e otimização de queries para filtros combinados
4. **UX**: Manter consistência visual e comportamental entre filtros
5. **Crossfilter**: Integrar novos filtros ao sistema crossfilter existente

---

**Fim do Documento**

