"""Funções para tornar a saída de terminal legível em widgets de texto."""

import re


_ANSI_ESCAPE = re.compile(
    r"\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\)|[@-_])"
)


def strip_ansi(text: str) -> str:
    """Remove sequências ANSI CSI/OSC e outros controles de escape comuns."""
    return _ANSI_ESCAPE.sub("", text).replace("\r", "")
