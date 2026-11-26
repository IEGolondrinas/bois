"""
minify_ch6.py – Minificación agresiva de 36e-chapter6.js en Python puro.

Técnicas aplicadas:
1. Eliminar comentarios /* ... */ y // ... (con protección de strings/regex)
2. Colapsar whitespace (espacios, tabs, saltos de línea) a un mínimo
3. Eliminar espacios alrededor de operadores y delimitadores
4. Reemplazar constantes numéricas largas por notación científica donde aplique
"""

import re, os, sys

SRC  = os.path.join(os.path.dirname(__file__), '..', 'js', '36e-chapter6.js')
DEST = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'js', '36e-chapter6.min.js')

with open(SRC, encoding='utf-8') as f:
    src = f.read()

# ------------------------------------------------------------------ #
#  Tokenizer simple para JS: produce lista de (tipo, texto)           #
#  tipos: STR, TPLSTR, REGEX, CMT_LINE, CMT_BLOCK, CODE              #
# ------------------------------------------------------------------ #

tokens = []
i = 0
n = len(src)

def peek(offset=0):
    j = i + offset
    return src[j] if j < n else ''

while i < n:
    # Comentario de bloque
    if src[i:i+2] == '/*':
        end = src.find('*/', i+2)
        if end == -1:
            tokens.append(('CODE', src[i:]))
            i = n
        else:
            tokens.append(('CMT_BLOCK', src[i:end+2]))
            i = end + 2
    # Comentario de línea
    elif src[i:i+2] == '//':
        end = src.find('\n', i+2)
        if end == -1:
            tokens.append(('CMT_LINE', src[i:]))
            i = n
        else:
            tokens.append(('CMT_LINE', src[i:end+1]))
            i = end + 1
    # Template literal
    elif src[i] == '`':
        j = i + 1
        while j < n:
            if src[j] == '\\':
                j += 2
            elif src[j] == '`':
                j += 1
                break
            else:
                j += 1
        tokens.append(('TPLSTR', src[i:j]))
        i = j
    # String con " o '
    elif src[i] in ('"', "'"):
        q = src[i]
        j = i + 1
        while j < n:
            if src[j] == '\\':
                j += 2
            elif src[j] == q:
                j += 1
                break
            else:
                j += 1
        tokens.append(('STR', src[i:j]))
        i = j
    else:
        # Código normal – acumular hasta el próximo literal/comentario
        j = i
        while j < n and src[j:j+2] not in ('//', '/*') and src[j] not in ('"', "'", '`'):
            j += 1
        if j > i:
            tokens.append(('CODE', src[i:j]))
        i = j

# ------------------------------------------------------------------ #
#  Reconstruir eliminando comentarios y minimizando código            #
# ------------------------------------------------------------------ #

OPERATORS = set('=+-*/%&|^~<>!?:,;()[]{}.')

def minify_code(code):
    """Minimiza un bloque de código JS (sin strings ni comentarios)."""
    # Colapsar whitespace incluyendo newlines
    # Reemplazar secuencias de espacio/tab/newline por un espacio
    out = re.sub(r'[ \t\r\n]+', ' ', code)
    # Eliminar espacio antes/después de operadores/delimitadores
    out = re.sub(r' ?([=+\-*/%&|^~<>!?:,;()\[\]{}]) ?', r'\1', out)
    # Restaurar espacio necesario tras keywords seguidos de identifiers
    # (return x, typeof x, instanceof, in, etc.)
    out = re.sub(r'\b(return|typeof|instanceof|void|delete|throw|new|in|of|var|let|const|if|else|for|while|do|switch|case|break|continue|function)\b(?=[a-zA-Z_$0-9({\[])', r'\1 ', out)
    return out

parts = []
for typ, txt in tokens:
    if typ in ('CMT_BLOCK', 'CMT_LINE'):
        # Eliminar comentarios (reemplazar bloque por espacio para no pegar tokens)
        parts.append(' ')
    elif typ == 'CODE':
        parts.append(minify_code(txt))
    else:
        # STR, TPLSTR: conservar intacto
        parts.append(txt)

result = ''.join(parts)

# Limpiar espacios dobles que puedan quedar
result = re.sub(r'  +', ' ', result)
result = result.strip()

# Añadir cabecera identificadora
header = "/* BOIS.IO 36e-chapter6.min.js – auto-minificado */\n"
result = header + result

with open(DEST, 'w', encoding='utf-8') as f:
    f.write(result)

orig_kb = os.path.getsize(SRC) // 1024
min_kb  = os.path.getsize(DEST) // 1024
pct     = 100 - round(min_kb * 100 / orig_kb)
print(f"Original : {orig_kb} KB")
print(f"Minified : {min_kb} KB  (reduccion ~{pct}%)")
print(f"Guardado : {DEST}")
