"""
Módulo compartilhado de Normalização de Dados
Utilizado por Pipeline/main.py e .github/workflows/main.py

Funções:
- normalizar_nome_coluna() - Normaliza nomes de colunas
- _clean_whitespace() - Limpa espaços extras
- _canon_txt() - Canoniza texto (remove acentos, lowercase)
- _canon_txt_preserve_case() - Canoniza preservando case
"""

import re
import unicodedata


def normalizar_nome_coluna(col: str) -> str:
    """
    Normaliza nome de coluna:
    - Remove acentos
    - Substitui espaços/caracteres especiais por underscore
    - Converte para minúsculas
    """
    if col is None:
        return ""
    
    # Converter para string
    col = str(col).strip()
    
    # Remover acentos
    nfd = unicodedata.normalize('NFD', col)
    col = ''.join(ch for ch in nfd if unicodedata.category(ch) != 'Mn')
    
    # Substituir espaços e caracteres especiais por underscore
    col = re.sub(r'[^a-zA-Z0-9]', '_', col)
    
    # Remover underscores duplicados
    col = re.sub(r'_+', '_', col)
    
    # Remover underscores no início e fim
    col = col.strip('_')
    
    # Converter para minúsculas
    col = col.lower()
    
    return col


def _clean_whitespace(v) -> str:
    """
    Limpa apenas espaços extras (início, fim e múltiplos)
    mas PRESERVA acentuação e capitalização.
    """
    if v is None or str(v).strip() == "":
        return ""
    s = str(v).strip()
    s = re.sub(r'\s+', ' ', s)
    return s


def _canon_txt(v) -> str:
    """
    Canonização de texto: converte para string, remove acentos,
    converte para lowercase e limpa espaços.
    
    Usado para campos que serão comparados/agrupados.
    """
    if v is None or str(v).strip() == "":
        return ""
    s = str(v).strip()
    # Remove acentos
    s = unicodedata.normalize('NFD', s)
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    # Lowercase
    s = s.lower()
    # Limpa espaços extras
    s = re.sub(r'\s+', ' ', s)
    return s


def _canon_txt_preserve_case(v) -> str:
    """
    Canoniza texto (remove acentos, limpa espaços),
    MAS PRESERVA A CAPITALIZAÇÃO.
    
    Útil para nomes próprios, endereços, etc.
    """
    if v is None or str(v).strip() == "":
        return ""
    s = str(v).strip()
    # Remove acentos
    s = unicodedata.normalize('NFD', s)
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    # Limpa espaços extras
    s = re.sub(r'\s+', ' ', s)
    return s

