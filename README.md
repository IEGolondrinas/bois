# BOIS.IO · Lago de los Cisnes (v189)

Juego narrativo de exploración en 3D que corre en el navegador (three.js r128, sin dependencias externas).

## Jugar

- **Un solo archivo:** abre `dist/BOIS_IO.html` en el navegador. No necesita servidor ni internet.
- **Desde las fuentes:** ejecuta `JUGAR.bat` (Windows) o, en cualquier sistema, `python3 -m http.server 8000` en esta carpeta y abre `http://localhost:8000/index.html`.

Controles principales: WASD moverse · Shift correr · Espacio saltar · ratón mirar · E interactuar · J diario · M mapa · Q calidad gráfica · F6 filtro VHS. La lista completa está en el panel «Controles» del menú.

## Guardado y copias de seguridad

El progreso se guarda solo en el navegador (`localStorage`). Desde el menú puedes exportar e importar una copia de seguridad (`.json`); la importación valida el archivo antes de aplicarlo.

## Estructura

| Carpeta / archivo | Contenido |
|---|---|
| `index.html` | Página de desarrollo; carga los scripts en orden |
| `js/` | Código del juego, un archivo por sistema o capítulo |
| `js/ui/` | Menú, pestañas y copia de seguridad |
| `data/` | Fotos, audio, mallas y texturas incrustadas como datos |
| `vendor/` | three.js local |
| `dist/BOIS_IO.html` | Compilación autocontenida (generada) |
| `tools/` | Build, verificación y pruebas |

Nota: `index.html` carga `js/36e-chapter6.min.js`, generado a partir de `js/36e-chapter6.js`. **La fuente que se edita es el `.js`.**

## Desarrollo

Requiere Python 3 y Node.js.

```
python3 tools/minify_ch6.py   # solo si cambiaste js/36e-chapter6.js
python3 tools/build.py        # regenera dist/BOIS_IO.html
python3 tools/verify.py       # sintaxis, tests y que dist/min estén al día
```

Herramientas de desarrollo (vuelo, puntos de mapa, monitor F8, telemetría, atajos de capítulos desde la consola): ocultas para los jugadores; se activan con `?dev` en la URL o `localStorage.setItem('bois_dev','1')`, y se quitan con `localStorage.removeItem('bois_dev')`.

El historial de versiones está en `CHANGELOG.md`.
