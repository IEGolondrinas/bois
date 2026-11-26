#!/usr/bin/env python3
"""Descarga three.js r128 a vendor/three.min.js (una sola vez, con red) y muestra su hash SRI.
Después, `python3 tools/build.py` lo incrusta en dist/BOIS_IO.html y el juego deja de depender del CDN.

Uso:  python3 tools/fetch_three.py
"""
import base64, hashlib, os, sys, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URLS = ["https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
        "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"]
dest = os.path.join(ROOT, "vendor", "three.min.js")
data = None
for u in URLS:
    try:
        with urllib.request.urlopen(u, timeout=30) as r:
            data = r.read()
        print("Descargado de", u); break
    except Exception as e:
        print("Falló", u, "→", e)
if not data: sys.exit("No se pudo descargar three.js. Revisa tu conexión.")
txt = data.decode("utf-8", "replace")
if 'REVISION="128"' not in txt.replace(" ", "") and "REVISION='128'" not in txt:
    # r128 define REVISION = '128'; si no aparece, no es la versión esperada
    if "128" not in txt[:2000]: sys.exit("El archivo descargado no parece three.js r128; no se guarda.")
if "</script" in txt.lower(): sys.exit("El archivo contiene '</script'; no se puede incrustar tal cual.")
os.makedirs(os.path.dirname(dest), exist_ok=True)
open(dest, "wb").write(data)
h = base64.b64encode(hashlib.sha384(data).digest()).decode()
print(f"OK → {dest}  ({len(data)/1e3:.0f} KB)\nSRI: sha384-{h}")
