# 📅 DATEUTILS - ANÁLISE DE DIFERENÇAS

**Data**: 02/12/2025  
**Status**: ✅ Não são duplicações - são complementares

---

## 📊 RESUMO

Existem **2 arquivos `dateUtils.js`** no sistema, mas **NÃO são duplicações**. Eles têm propósitos diferentes e complementares:

1. **Backend** (`NOVO/src/utils/dateUtils.js`) - Normalização de dados do banco
2. **Frontend** (`NOVO/public/scripts/utils/dateUtils.js`) - Formatação para UI

---

## 🔍 BACKEND: `NOVO/src/utils/dateUtils.js`

### Propósito:
Normalização e extração de datas de **registros do banco de dados** (Prisma)

### Funções Principais:
- `normalizeDate(dateInput)` - Normaliza qualquer formato para YYYY-MM-DD
- `getDataCriacao(record)` - Extrai data de criação de um registro
- `getDataConclusao(record)` - Extrai data de conclusão de um registro
- `getMes(record)` - Extrai mês (YYYY-MM) de um registro
- `isConcluido(record)` - Verifica se registro está concluído
- `getTempoResolucaoEmDias(record)` - Calcula tempo de resolução
- `addMesFilter(where, meses)` - Adiciona filtro de mês ao Prisma

### Características:
- ✅ Trabalha com objetos do Prisma/banco
- ✅ Normaliza dados brutos do banco
- ✅ Lida com múltiplos formatos de data
- ✅ Extrai dados de campos normalizados e não normalizados

### Exemplo de Uso:
```javascript
import { getDataCriacao, getMes } from '../utils/dateUtils.js';

const dataCriacao = getDataCriacao(record); // "2025-12-02"
const mes = getMes(record); // "2025-12"
```

---

## 🎨 FRONTEND: `NOVO/public/scripts/utils/dateUtils.js`

### Propósito:
Formatação e cálculos de datas para **exibição na interface do usuário**

### Funções Principais:
- `getToday()` - Data de hoje (com cache)
- `getTodayTimestamp()` - Timestamp de hoje
- `getCurrentMonth()` - Mês atual (YYYY-MM)
- `getCurrentYear()` - Ano atual
- `formatDate(dateInput)` - Formata data para pt-BR (DD/MM/YYYY)
- `formatMonthYear(ym)` - Formata mês/ano (ex: "dez. de 2025")
- `formatMonthYearShort(ym)` - Formata mês/ano curto (ex: "12/25")
- `formatDateShort(dateInput)` - Formata data curta (DD/MM)
- `formatNumber(num)` - Formata número (pt-BR)
- `formatPercentage(num)` - Formata porcentagem

### Características:
- ✅ Trabalha com formatação para UI
- ✅ Cache de valores calculados (performance)
- ✅ Formatação localizada (pt-BR)
- ✅ Funções de formatação de números e porcentagens

### Exemplo de Uso:
```javascript
const hoje = window.dateUtils.getToday();
const mesFormatado = window.dateUtils.formatMonthYear('2025-12'); // "dez. de 2025"
const dataFormatada = window.dateUtils.formatDate('2025-12-02'); // "02/12/2025"
```

---

## 🔄 COMPARAÇÃO

| Aspecto | Backend | Frontend |
|---------|---------|----------|
| **Propósito** | Normalização de dados do banco | Formatação para UI |
| **Entrada** | Objetos Prisma/registros | Strings/datas formatadas |
| **Saída** | Datas normalizadas (YYYY-MM-DD) | Strings formatadas (pt-BR) |
| **Foco** | Extração e normalização | Formatação e exibição |
| **Cache** | Não usa cache | Usa cache (1 minuto) |
| **Localização** | Não aplicável | pt-BR |

---

## ✅ CONCLUSÃO

**NÃO são duplicações** - são arquivos complementares:

- **Backend**: Extrai e normaliza dados do banco
- **Frontend**: Formata dados para exibição

**Recomendação**: ✅ **MANTER AMBOS** - cada um tem seu propósito específico

---

## 📝 NOTAS

1. **Não consolidar** - São para propósitos diferentes
2. **Manter separados** - Backend e frontend têm necessidades diferentes
3. **Documentar diferenças** - Este documento serve para esclarecer

---

**Última atualização**: 02/12/2025

