#!/usr/bin/env python3
"""Verificación local de BOIS.IO v189. Requiere Python 3 y Node.js."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent


class HTMLAssets(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.local_refs: list[str] = []
        self.inline_scripts: list[str] = []
        self.ids: list[str] = []
        self._in_script = False
        self._script_src = False
        self._script_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "link" and attrs.get("href"):
            self.local_refs.append(attrs["href"])
        elif tag == "script":
            self._in_script = True
            self._script_src = bool(attrs.get("src"))
            self._script_parts = []

    def handle_data(self, data: str) -> None:
        if self._in_script and not self._script_src:
            self._script_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_script:
            if not self._script_src:
                self.inline_scripts.append("".join(self._script_parts))
            self._in_script = False
            self._script_src = False
            self._script_parts = []


def fail(message: str) -> None:
    print("FAIL:", message, file=sys.stderr)
    raise SystemExit(1)


def node_check(node: str, code: str, label: str) -> None:
    result = subprocess.run([node, "--check"], input=code, text=True, capture_output=True)
    if result.returncode:
        fail(f"sintaxis JavaScript en {label}:\n{result.stderr}")


def main() -> None:
    node = shutil.which("node")
    if not node:
        fail("Node.js no está instalado o no está en PATH.")

    index_path = ROOT / "index.html"
    parser = HTMLAssets()
    parser.feed(index_path.read_text(encoding="utf-8"))

    missing = []
    for ref in parser.local_refs:
        if ref.startswith(("https://", "http://", "data:")):
            continue
        if not (ROOT / ref).is_file():
            missing.append(ref)
    for src in re.findall(r'<script\s+src="([^"]+)"\s*>', index_path.read_text(encoding="utf-8"), re.I):
        if src.startswith(("https://", "http://", "data:")):
            continue
        if not (ROOT / src).is_file():
            missing.append(src)
    if missing:
        fail("referencias locales ausentes: " + ", ".join(sorted(set(missing))))
    duplicates = sorted({value for value in parser.ids if parser.ids.count(value) > 1})
    if duplicates:
        fail("IDs HTML duplicados: " + ", ".join(duplicates))
    print(f"OK · referencias locales e IDs únicos de index.html ({len(parser.ids)} IDs)")

    js_files = sorted((ROOT / "js").rglob("*.js")) + sorted((ROOT / "data").rglob("*.js"))
    for path in js_files:
        result = subprocess.run([node, "--check", str(path)], text=True, capture_output=True)
        if result.returncode:
            fail(f"sintaxis JavaScript en {path.relative_to(ROOT)}:\n{result.stderr}")
    print(f"OK · sintaxis de {len(js_files)} archivos JavaScript")

    dist = ROOT / "dist" / "BOIS_IO.html"
    if not dist.is_file():
        fail("falta dist/BOIS_IO.html; ejecuta primero tools/build.py.")
    dist_parser = HTMLAssets()
    dist_parser.feed(dist.read_text(encoding="utf-8"))
    for i, code in enumerate(dist_parser.inline_scripts):
        if code.strip():
            node_check(node, code, f"dist/BOIS_IO.html · script inline {i + 1}")
    print(f"OK · sintaxis de {len(dist_parser.inline_scripts)} scripts inline del HTML distribuible")

    required = {
        "index.html": ["v189 · BOIS Telemetry y modo desarrollador", 'id="bh"', 'js/36d-world-polish.js', 'js/36e-chapter6.min.js'],
        "js/08-fauna-journal.js": ["bois_explored"],
        "js/11-player-input.js": ["pointerdown", "pointerup", "pointercancel"],
        "js/28-car-radio.js": ["No hay espacio seguro", "Math.abs(gy-CAR.g.position.y)>2.2"],
        "js/37-boot.js": ["window.__boisBootReady=true", "window.__boisStopFrameLoop=true"],
        "js/36c-chapter5.js": ["las torres gemelas te esperan"],
        "js/36e-chapter6.min.js": ["ch6_complete", "__boisCh6Unlock", "scene_final"],
        "js/36d-world-polish.js": ["new THREE.DirectionalLight", "const shrubs = sample", "const mushrooms = sample", "function worldPolishFrame"],
        "js/21-main-loop-config.js": ["worldPolishFrame(ft,tt)"],
        "js/01-core-renderer.js": ["THREE.PCFSoftShadowMap"],
        "js/20-life-bridge-towers.js": ["v141: pasarela aérea exterior", "new THREE.BoxGeometry(L,.5,7.4)", "for(const x of[ax-.1,bx+.1])"],
        "js/37c-telemetry.js": ["window.BOIS_TELEMETRY", "__boisGuideOverlayOpen", "bois_telemetry"],
        "js/37b-debug.js": ["BOIS DEBUG", "F8", "r.info&&r.info.render", "r.info&&r.info.memory", "window.BOIS_DEBUG"],
    }
    for relative, needles in required.items():
        content = (ROOT / relative).read_text(encoding="utf-8")
        compact = re.sub(r"\s+", "", content)  # tolera cambios de formato (espacios/saltos de línea)
        for needle in needles:
            if needle not in content and re.sub(r"\s+", "", needle) not in compact:
                fail(f"falta una corrección esperada en {relative}: {needle}")
    print("OK · comprobaciones estructurales de v189 y regresiones históricas")

    # js/36e-chapter6.min.js es lo que carga index.html; debe ser exactamente la minificación de js/36e-chapter6.js.
    with tempfile.TemporaryDirectory(prefix="bois-ch6min-") as tmp:
        fresh = Path(tmp) / "36e-chapter6.min.js"
        subprocess.run([sys.executable, str(ROOT / "tools" / "minify_ch6.py"), str(fresh)], check=True, stdout=subprocess.DEVNULL)
        shipped = (ROOT / "js" / "36e-chapter6.min.js").read_text(encoding="utf-8")
        if fresh.read_text(encoding="utf-8") != shipped:
            fail("js/36e-chapter6.min.js está desactualizado respecto a js/36e-chapter6.js; ejecuta python3 tools/minify_ch6.py y luego tools/build.py.")
    print("OK · 36e-chapter6.min.js está sincronizado con su fuente")

    # Ejecuta TODOS los tests de tools/ (no una lista fija), para que ninguno quede olvidado.
    for test in sorted((ROOT / "tools").glob("test_*.js")):
        subprocess.run([node, str(test)], check=True, stdout=subprocess.DEVNULL)
        print(f"OK · {test.name}")

    # Verify that the checked-in distributable is exactly reproducible from the source.
    with tempfile.TemporaryDirectory(prefix="bois-v189-") as tmp:
        rebuilt = Path(tmp) / "BOIS_IO.html"
        subprocess.run([sys.executable, str(ROOT / "tools" / "build.py"), str(rebuilt)], check=True)
        if rebuilt.read_bytes() != dist.read_bytes():
            fail("dist/BOIS_IO.html no coincide con la compilación actual de los archivos fuente.")
    print("OK · dist/BOIS_IO.html es reproducible byte por byte")
    print("\nBOIS.IO v189: todas las verificaciones automatizadas pasaron.")


if __name__ == "__main__":
    main()
