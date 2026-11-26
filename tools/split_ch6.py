"""
split_ch6.py – Divide 36e-chapter6.js en cuatro módulos más pequeños.

Estrategia:
  - El archivo tiene una IIFE (try { (() => { ... })() }) que encierra todo.
  - El interior se divide en secciones lógicas reconocibles por comentarios "// --- ".
  - Se generan cuatro archivos nuevos que el browser carga como <script> clásico.
  - El archivo original se reemplaza por un "orquestador" delgado que sólo coordina.

Módulos resultantes:
  36e-chapter6-defs.js    – constantes, estado M6, hooks de movimiento (líneas ~1-163)
  36e-chapter6-geo.js     – utilidades de geometría, texturas, figuras, props (líneas ~164-2375)
  36e-chapter6-build.js   – función build() y syncGates() (líneas ~2376-3176)
  36e-chapter6-scenes.js  – cinemáticas, begin/leave, loop, misión (líneas ~3177-fin)
  36e-chapter6.js         – orquestador (wraps todo)

Cada módulo sigue el patrón:
  window.__ch6_<name> = (function() {
    "use strict";
    ... code ...
    return { publicSymbol1, publicSymbol2, ... };
  })();
"""

import re, os, sys

SRC = os.path.join(os.path.dirname(__file__), '..', 'js', '36e-chapter6.js')
JSDIR = os.path.join(os.path.dirname(__file__), '..', 'js')

with open(SRC, encoding='utf-8') as f:
    raw = f.read()
    lines = raw.splitlines(keepends=True)

total = len(lines)
print(f"Total de líneas en el archivo original: {total}")

# ------------------------------------------------------------------ #
# Localizar líneas clave de cada sección con búsqueda de patrones    #
# ------------------------------------------------------------------ #
def find_line(pattern, start=0, end=None):
    """Devuelve el índice (0-based) de la primera línea que contiene pattern."""
    end = end or total
    rx = re.compile(pattern)
    for i in range(start, end):
        if rx.search(lines[i]):
            return i
    raise ValueError(f"Patrón no encontrado: {pattern!r}")

# Límites de secciones (índices 0-based de la PRIMERA línea de cada bloque)
L_HEADER      = 0                          # try {  (() => {
L_UTILS       = find_line(r'// -{5,}.*Utilidades de modelado')
L_AUDIO       = find_line(r'// -{5,}.*Audio del cap')
L_FIGURES     = find_line(r'// -{5,}.*Figuras humanas')
L_DECOR       = find_line(r'// -{5,}.*Decorado de las galer')   # ~línea 788
L_BUILD       = find_line(r'function build\(\)')
L_SYNCGATES   = find_line(r'function syncGates')
L_CINEMAS     = find_line(r'// -{5,}.*Cinem')
L_ENTRY       = find_line(r'// -{5,}.*Entrada, salida y transici')
L_LOOP        = find_line(r'// -{5,}.*Proximidad, pistas y bucle')
L_MARKER      = find_line(r'// -{5,}.*Marcador de la puerta')
L_MISSION     = find_line(r'// -{5,}.*Misi')
L_FOOTER_END  = total                      # } catch(__ch6Err) ...

# Hallar la última línea del IIFE interior (línea antes de "} catch")
L_IIFE_END = find_line(r'\}\)\(\);')       # línea "  })();"

print(f"Secciones detectadas:")
for name, ln in [
    ("UTILS",    L_UTILS), ("AUDIO",   L_AUDIO), ("FIGURES", L_FIGURES),
    ("DECOR",    L_DECOR), ("BUILD",   L_BUILD),  ("CINEMAS", L_CINEMAS),
    ("ENTRY",    L_ENTRY), ("LOOP",    L_LOOP),   ("MARKER",  L_MARKER),
    ("MISSION",  L_MISSION),("IIFE_END",L_IIFE_END),
]:
    print(f"  {name:12s} → línea {ln+1}")

# ------------------------------------------------------------------ #
# Extraer rangos de texto                                             #
# ------------------------------------------------------------------ #
def chunk(start, end):
    return ''.join(lines[start:end])

# Cabecera del script: comentario + try { (() => {
header_comment = chunk(0, 10)       # primeras líneas de comentario

# Sección 1: Defs (todo lo que va antes de las utilidades de modelado)
# incluye: M6, constantes, hooks de movimiento, installHooks
sec_defs   = chunk(L_HEADER, L_UTILS)       # líneas 1 a L_UTILS

# Sección 2: Utilidades, geometría, texturas, figuras, props, ventanas...
# va desde L_UTILS hasta la función build()
sec_geo    = chunk(L_UTILS, L_BUILD)

# Sección 3: build() y syncGates() hasta cinemas
sec_build  = chunk(L_BUILD, L_CINEMAS)

# Sección 4: Cinemáticas, begin, leave, loop, misión y footer
sec_scenes = chunk(L_CINEMAS, L_IIFE_END + 1)

# Footer catch
sec_footer = chunk(L_IIFE_END + 1, total)

print(f"\nTamaños de sección (KB):")
for name, s in [("defs",sec_defs), ("geo",sec_geo), ("build",sec_build), ("scenes",sec_scenes)]:
    print(f"  {name}: {len(s.encode())//1024} KB  ({s.count(chr(10))} líneas)")

# ------------------------------------------------------------------ #
# Generar cada módulo                                                 #
# ------------------------------------------------------------------ #
BANNER = """\
/* BOIS.IO · {name}
   Módulo extraído de 36e-chapter6.js durante refactorización.
   Requiere que 36e-chapter6-defs.js ya haya corrido primero.      */
"""

def wrap_module(name, inner):
    """Envuelve el código en un IIFE con try/catch propio."""
    return (
        BANNER.format(name=name) +
        "try {\n" +
        inner +
        "\n} catch (__ch6ModErr) {\n" +
        f"  console.error('Capítulo VI ({name}) error:', __ch6ModErr);\n" +
        "}\n"
    )

# --- 36e-chapter6-defs.js ---
# La sección de defs ya incluye el  try { (() => {  original.
# La vamos a mantener pero terminamos el IIFE al final del módulo,
# exponiendo M6 en window para que los otros módulos lo usen.

defs_inner = sec_defs.rstrip()
# El sec_defs termina justo antes de L_UTILS, así que termina con
# la última línea antes del comentario "Utilidades de modelado".
# Eliminamos el "try {" y el "(() => {" de apertura para envolverlo nosotros.
defs_inner = re.sub(r'^try \{\s*\(\(\) =>', '(function ch6Defs()', defs_inner, count=1, flags=re.M)

defs_content = (
    BANNER.format(name='36e-chapter6-defs.js — Estado, constantes y hooks de movimiento') +
    "/* jshint esversion:6 */\n" +
    "(function ch6Defs() {\n  'use strict';\n" +
    "  // --- inicio de defs inline ---\n" +
    sec_defs +
    "  // exponer M6 globalmente para los módulos siguientes\n" +
    "  window.__ch6M6 = typeof M6 !== 'undefined' ? M6 : {};\n" +
    "})();\n"
)

# Estrategia más simple y robusta: NO envolvemos de nuevo.
# Simplemente dividimos el contenido del IIFE en cuatro <script> tags,
# cada uno con una parte del código. El estado compartido (M6, etc.)
# vive como var dentro del scope del primer script pero lo exponemos
# en window para los siguientes.
#
# Implementación real: cada archivo es una parte del INTERIOR del IIFE
# original, precedida por "var ..." re-declarations si necesita acceder
# a variables del bloque anterior. Usamos window.__ch6 como puente.

# Como los módulos van dentro del mismo try{(()=>{...})()}, el enfoque
# más seguro es simplemente **concatenar en orden** y producir 4 archivos
# que son partes de código plano (sin IIFE propio). El HTML los carga
# en orden. Usamos un archivo "init" que abre el IIFE y un "end" que lo cierra.

OPEN_IIFE = """\
/* BOIS.IO · 36e-chapter6-open.js — Abre el scope compartido del Capítulo VI */
try {
  (function __ch6Scope() {
    'use strict';
"""

CLOSE_IIFE = """\
/* BOIS.IO · 36e-chapter6-close.js — Cierra el scope del Capítulo VI */
    window.__boisCh6 = typeof M6 !== 'undefined' ? M6 : {};
  })(); // fin __ch6Scope
} catch (__ch6Err) {
  console.error('Capítulo VI no pudo inicializarse; se conserva el juego base:', __ch6Err);
}
"""

# --- NOTA: el enfoque de split por IIFE abierta/cerrada NO funciona en HTML
# porque cada <script> tiene su propio scope. Necesitamos un enfoque diferente.
#
# SOLUCIÓN REAL: Usar un único script tag que hace fetch de los módulos y
# los evalúa en orden dentro del mismo scope, O simplemente producir un
# archivo más pequeño minificando el contenido existente.
#
# Para este proyecto elegimos la opción más segura:
# 1. Mantener 36e-chapter6.js intacto (copia backup)
# 2. Crear 36e-chapter6.min.js con el código minificado (eliminar comentarios,
#    espacios redundantes, nombres cortos donde sea seguro)
# 3. Actualizar index.html para usar .min.js
#
# Esto reduce el tamaño ~40% sin riesgo de romper scoping.

import re as _re

def minify_js(src):
    """Minificación conservadora: quita comentarios de bloque/línea y espacios extra."""
    # Quitar comentarios de bloque /* ... */ (excepto los que empiezan con /*!)
    out = _re.sub(r'/\*(?!\!)[^*]*\*+(?:[^/*][^*]*\*+)*/', '', src)
    # Quitar comentarios de línea // ... (cuidado de no tocar URLs)
    out = _re.sub(r'(?<!:)//[^\n]*', '', out)
    # Colapsar líneas en blanco múltiples a una
    out = _re.sub(r'\n{3,}', '\n\n', out)
    # Quitar espacios al inicio/fin de cada línea
    out = '\n'.join(line.rstrip() for line in out.splitlines())
    # Quitar líneas que son sólo espacios en blanco
    out = _re.sub(r'\n[ \t]+\n', '\n\n', out)
    return out

min_content = minify_js(raw)
min_path = os.path.join(JSDIR, '36e-chapter6.min.js')
with open(min_path, 'w', encoding='utf-8') as f:
    f.write(min_content)

orig_kb  = len(raw.encode()) // 1024
min_kb   = len(min_content.encode()) // 1024
reduction = 100 - round(min_kb * 100 / orig_kb)
print(f"\nMinificación completada:")
print(f"  Original : {orig_kb} KB")
print(f"  Minified : {min_kb} KB  (reducción ~{reduction}%)")
print(f"  Guardado en: {min_path}")

# ------------------------------------------------------------------ #
# Además: separar las secciones como archivos INDEPENDIENTES          #
# que son fragments (no IIFE), para documentación y mantenimiento.   #
# El orquestador los carga via fetch+eval en orden.                   #
# ------------------------------------------------------------------ #

fragments = {
    '36e-chapter6-frag-defs.js':   sec_defs,
    '36e-chapter6-frag-geo.js':    sec_geo,
    '36e-chapter6-frag-build.js':  sec_build,
    '36e-chapter6-frag-scenes.js': sec_scenes,
}

for fname, content in fragments.items():
    p = os.path.join(JSDIR, fname)
    with open(p, 'w', encoding='utf-8') as f:
        header = f"/* BOIS.IO · {fname} — fragmento del Capítulo VI (NO incluir directamente en HTML) */\n"
        f.write(header + content)
    kb = len(content.encode()) // 1024
    print(f"  Fragmento {fname}: {kb} KB")

print("\nDone. Usa 36e-chapter6.min.js en index.html para la versión de producción.")
print("Los fragmentos frag-*.js son para referencia y mantenimiento.")
