# Pipeline Utils - Módulos Compartilhados

Este diretório contém módulos Python compartilhados utilizados tanto pelo `Pipeline/main.py` quanto pelo `.github/workflows/main.py`.

## 📦 Módulos Disponíveis

### normalizacao.py

**Descrição**: Funções de normalização de texto e dados.

**Funções Disponíveis**:

#### `normalizar_nome_coluna(col: str) -> str`
Normaliza nomes de colunas para uso em DataFrames.

**O que faz**:
- Remove acentos
- Substitui espaços/caracteres especiais por underscore
- Converte para minúsculas
- Remove underscores duplicados

**Exemplo**:
```python
from utils.normalizacao import normalizar_nome_coluna

nome = normalizar_nome_coluna("Data de Criação")
# Resultado: "data_de_criacao"
```

---

#### `_clean_whitespace(v) -> str`
Limpa espaços extras **preservando acentuação e capitalização**.

**O que faz**:
- Remove espaços no início e fim
- Substitui múltiplos espaços por um único
- **Preserva** acentos e maiúsculas/minúsculas

**Exemplo**:
```python
from utils.normalizacao import _clean_whitespace

texto = _clean_whitespace("  José   da  Silva  ")
# Resultado: "José da Silva"
```

---

#### `_canon_txt(v) -> str`
Canoniza texto para comparação e agrupamento.

**O que faz**:
- Remove acentos
- Converte para minúsculas
- Limpa espaços extras

**Exemplo**:
```python
from utils.normalizacao import _canon_txt

texto = _canon_txt("São Paulo")
# Resultado: "sao paulo"
```

---

#### `_canon_txt_preserve_case(v) -> str`
Canoniza texto **preservando capitalização**.

**O que faz**:
- Remove acentos
- **Preserva** maiúsculas/minúsculas originais
- Limpa espaços extras

**Exemplo**:
```python
from utils.normalizacao import _canon_txt_preserve_case

texto = _canon_txt_preserve_case("São Paulo")
# Resultado: "Sao Paulo"
```

---

## 📝 Como Usar

### No Pipeline/main.py:

```python
from utils.normalizacao import (
    normalizar_nome_coluna,
    _clean_whitespace,
    _canon_txt,
    _canon_txt_preserve_case
)

# Normalizar colunas do DataFrame
df.columns = [normalizar_nome_coluna(c) for c in df.columns]

# Limpar campos de texto
df['nome'] = df['nome'].apply(_clean_whitespace)

# Canonizar para comparação
df['cidade_canon'] = df['cidade'].apply(_canon_txt)
```

### No .github/workflows/main.py:

```python
import sys
import os

# Adicionar Pipeline ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../Pipeline'))

from utils.normalizacao import (
    normalizar_nome_coluna,
    _clean_whitespace,
    _canon_txt,
    _canon_txt_preserve_case
)

# Usar as funções normalmente
```

---

## ✅ Benefícios

- **Elimina duplicação** de código
- **Manutenção centralizada** - alterações em um lugar
- **Consistência** - mesma lógica em todos os pipelines
- **Testabilidade** - funções isoladas e reutilizáveis

---

## 🔄 Histórico

- **02/12/2025**: Módulo criado para eliminar duplicação entre `Pipeline/main.py` e `.github/workflows/main.py`
- **CÉREBRO X-3**: Consolidação de funções de normalização

---

**Última atualização**: 02/12/2025

