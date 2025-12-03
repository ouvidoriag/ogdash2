"""
Módulo de utilitários compartilhados do Pipeline
"""

from .normalizacao import (
    normalizar_nome_coluna,
    _clean_whitespace,
    _canon_txt,
    _canon_txt_preserve_case
)

__all__ = [
    'normalizar_nome_coluna',
    '_clean_whitespace',
    '_canon_txt',
    '_canon_txt_preserve_case'
]

