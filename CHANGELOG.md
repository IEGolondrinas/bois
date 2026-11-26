# BOIS.IO · Historial de cambios

(Antes este archivo era el README. La guía de uso está ahora en `README.md`.)

## Revisión posterior a la auditoría (sobre v189)

- **Atajos de prueba protegidos:** `__boisCh5/6/7Unlock` y `__boisCh5/6/7Reset` (saltar o reiniciar capítulos desde la consola) solo existen con `?dev` o `localStorage.setItem('bois_dev','1')`, igual que el resto de herramientas de desarrollo. `test_v140.js` activa `BOIS_DEV` en su contexto simulado.
- **Sincronía del Capítulo VI comprobada:** `tools/verify.py` regenera la minificación de `js/36e-chapter6.js` y falla si `js/36e-chapter6.min.js` (el que carga `index.html`) no coincide. `tools/minify_ch6.py` acepta una ruta de salida opcional.
- **Importación de puntos más estricta:** al importar una copia de seguridad, `bois_dev_points` se normaliza: se descartan elementos que no sean objetos con `x`/`z` numéricos dentro del mapa, se conservan solo `name`, `x`, `y`, `z`, `yaw` y `date`, y se limita a 500 puntos. Los puntos guardados en `localStorage` se normalizan igual al cargar. Nuevas pruebas en `tools/test_backup.js`.
- **Paquete más limpio:** el antiguo `README.md` (historial de versiones) pasa a `CHANGELOG.md` y hay un `README.md` nuevo y corto; se eliminó `js/LEEME_INSTALACION.txt` (instrucciones de otra época); `JUGAR.bat` detecta `py`, `python` o `python3`, espera a que el servidor arranque y avisa si no hay Python.

---

## Auditoría posterior (v189)

- **dist recompilado:** `dist/BOIS_IO.html` estaba desactualizado y no incluía los cambios del Capítulo I (temblor de cámara, tinnitus, sfx de arena/obturador/página, paneo estéreo, barras de cine) ni de Katherin (`canInteractWithKatherin`, `findLakeWaterSpot`).
- **test_katherin.js:** el recorte del código ahora empieza en `canInteractWithKatherin`; `verify.py` vuelve a pasar completo (25 tests).
- **disposeKatherin():** ahora se llama en `pagehide` (si la página no queda en bfcache).

---

## Auditoría y correcciones (v189)

- **Build:** se eliminó el `<script src="/_aistudio-iframe.js">` residual de `index.html`, que rompía `tools/build.py` y `tools/verify.py`. `dist/BOIS_IO.html` se recompiló desde las fuentes actuales.
- **Versión unificada en v189:** `<title>`, pie del menú, telemetría (`VER`) y cabecera del capítulo VI. Se quitó la etiqueta «v138» de los mensajes de consola de `36d-world-polish.js`.
- **Calidad gráfica:** Ultra limita el DPR a 1.25 (como documentaba v189) y Alta también a 1.25, para que Ultra nunca renderice a menos resolución que Alta. Ultra se distingue por sombras 2048, mayor distancia de dibujo y niebla.
- **Herramientas de desarrollo ocultas por defecto:** F3/F4/F5/G (herramientas privadas y vuelo), F8 (monitor), F9/F10 y botón «TEL» (telemetría) solo se activan con `?dev` en la URL o `localStorage.setItem('bois_dev','1')`. Sin la bandera, la telemetría no graba ni guarda en `localStorage`, y esas teclas no aparecen en «Controles». Para quitarlas: `localStorage.removeItem('bois_dev')`.
- **Paquete:** se eliminó `js/36e-chapter6.js.bak`.
- **Tests:** los 24 pasan. Se actualizaron los que dependían del formato del código, de etiquetas de versión o de comportamiento antiguo (reinicio con modal, precarga de Poolrooms en el boot, guion de Katherin, `S.y` como altura de los pies al bajar del auto) y se completaron los sandboxes de `test_capsules` y `test_v182`. Se añadió `tools/test_v189.js`.
- **Sin cambios (a propósito):** la recuperación de resolución adaptativa (<50 FPS baja, >59 FPS sube tras 12 s). En equipos limitados a 30 FPS puede quedarse en DPR 0.7; ajustarlo requiere datos de dispositivos reales.

---

# BOIS.IO v189 · optimización guiada por telemetría

La telemetría real de v183 mostró dos cuellos de botella principales: la construcción inicial de Poolrooms (hitch de ~600 ms) y el coste sostenido de render/sombras. v185 los ataca sin cambiar la lógica narrativa.

- **Poolrooms precargados:** se construyen durante la pantalla de arranque mediante `requestIdleCallback`; `P.enter()` conserva una ruta de respaldo por seguridad.
- **Sombras adaptativas:** la actualización del shadow map se desacopla del frame y baja su frecuencia en Alta/Ultra.
- **Resolución adaptativa más útil:** si el rendimiento sostenido cae por debajo de 50 FPS, reduce DPR en pasos de 0.10; recupera lentamente por encima de 59 FPS.
- **Ultra más eficiente:** DPR máximo 1.25 y shadow map 2048; Alta pasa a 1536 (y DPR máximo 1.25).
- **Telemetría:** conserva F9/F10 y los perfiles de v183; el informe identifica ahora el efecto de estas optimizaciones en sesiones posteriores.

---

# BOIS.IO v185 · Poolrooms load barrier

La telemetría de v184 demostró que el Poolrooms funcionaba bien después de cargar, pero la primera entrada todavía sufría un hitch de ~0.5–0.6 s. v185 mueve esa carga al arranque, antes de habilitar «Comenzar», y registra cada fase de construcción para medirla.

- La precarga prioritaria usa una promesa de disponibilidad y bloquea el botón de inicio hasta terminar.
- `18-poolrooms.js` registra `geometry_generation`, `texture_material_setup`, `mesh_build`, `decor_geometry`, `water_fx`, `lighting_fx` y `complete`.
- La telemetría incluye la sección «Poolrooms · carga inicial» incluso cuando la carga ocurrió antes de iniciar la sesión de juego.

---

# BOIS.IO v182 · BOIS Telemetry / modo desarrollador

Para poder depurar partidas reales sin tener que describirlas de memoria: el juego graba lo que pasa y genera un informe de texto que se pega en el chat.

- **F9** abre el panel (pausa el mundo como el mapa): estado en vivo, notas con categoría (🐞 Bug, 🎨 Visual, 🐢 Rendimiento, 🔊 Audio, 📖 Historia, 💡 Idea), **Copiar informe**, **Descargar .md**, ver el informe, pausar la telemetría y vaciar la sesión.
- **F10** deja una **marca rápida** mientras juegas (posición, hora, FPS, calidad, estado); luego se anota en F9. En pantallas táctiles hay un botón «TEL».
- **Graba solo:** FPS medio y percentiles de frame (p50/p95/p99), % de frames lentos, tirones ≥120 ms, FPS por estado (a pie, nadando, auto, Poolrooms, cinemática…), **zonas más lentas del mapa** (celdas de 40 m), recursos de render (draw calls, triángulos, geometrías, texturas, heap JS) con tendencia y aviso de posible fuga, bajadas de resolución automáticas, cambios de calidad/clima/hora, banderas de historia que cambian, y errores/avisos de consola agrupados con su conteo.
- **Cierres bruscos:** guarda una instantánea cada 20 s; si la pestaña muere, la siguiente sesión lo avisa e incluye el último informe.
- Todo es local (sin red). Solo observa: no cambia banderas, posición ni ajustes. El panel suelta las teclas y no deja que el juego reaccione a lo que escribes.
- Prueba nueva: `tools/test_v182.js` (59 comprobaciones sobre el módulo real).

# BOIS.IO v181 · volumen general, comodidad de cámara y guardado más seguro

Auditoría de v180 (verify + 17 suites en verde, arranque real en Chromium sin errores de consola, heap de JS estable en 40 s: sin fugas). Cambios:

- **Nuevo · Volumen general** (Configuración): un solo control para todo el audio. Se aplica con un nodo maestro (`ctx.destination` del único `AudioContext` apunta a él), así que ambiente, pasos, radio, capítulos y tren lo respetan sin tocar cada módulo; la cajita de música (elemento `Audio`) se engancha por `window.__boisVolHooks`. Curva cuadrática para que la mitad del control suene a «mitad».
- **Nuevo · Balanceo al caminar** (sí/no) por si la cámara marea, e **Invertir eje vertical** (ratón). Ambos persisten.
- **Arreglo · Configuración desactualizada:** el panel solo se leía al cargar, así que tras pulsar N o U en partida mostraba el estado anterior. Ahora se sincroniza cada vez que se abre.
- **Arreglo · Mapa explorado:** se guardaba con hasta 6 s de retraso y el volcado al cerrar no lo incluía; cerrar la pestaña justo después de explorar perdía ese tramo. Ahora `pagehide`/`visibilitychange` lo vuelcan.
- **Arreglo · Nueva partida:** no borraba `bois_story_bak` (la copia de respaldo de v176) y, al recargar, el volcado de salida podía reescribir la posición o el mapa recién borrados (sobre todo al reiniciar con el botón «Reiniciar» en partida). Se añade la marca `__boisResetting`.
- Importar copias valida `v` (0–1), `hb` e `iy` (booleanos); las copias antiguas siguen siendo válidas.
- Prueba nueva: `tools/test_v181.js` (35 comprobaciones; el volumen se prueba ejecutando `auInit` real sobre un `AudioContext` simulado).

# BOIS.IO v180 · auditoría, monitor F8 y distribución offline

- **Arreglo:** al acercarte a la banca, el aviso de la cajita de música (B) aparecía justo después y tapaba el de Katherin (E: hablar). Ahora, si Katherin está cerca, el aviso dice «Katherin · E: hablar · F: sentarte · B: cajita de música»; lejos de ella no cambia nada.
- Prueba nueva: `tools/test_swanhint.js` (7 comprobaciones).

# BOIS.IO v179 · importación de copias validada (js/ui/backup.js)

- **Importar** ahora comprueba la forma de cada dato antes de guardarlo: historia (`flags` como objeto), ajustes (`mu`, `au`, `q`, `s` con su tipo), posición (números dentro del mapa), mapa explorado (exactamente 2500 caracteres 0/1) y puntos de desarrollo (arreglo). Lo que no cuadra se descarta y el juego usa su valor por defecto, en vez de guardarse dañado.
- Si la historia en sí no es válida, el archivo se rechaza completo y no se toca nada.
- Prueba nueva: `tools/test_backup.js` (12 comprobaciones).

# BOIS.IO v178 · cápsulas del tiempo completas (idea 1 terminada)

- Cinco cápsulas selladas nuevas en `NTB_PAGES` (`js/30f-notebook-pages.js`), todas con `sealed:true`: **8 de marzo de 2027** (18 años), **10 de agosto de 2027** (dos años del examen), **22 de noviembre de 2027** (un año después: lo que sé de mí hoy y seis preguntas para responder), **8 de marzo de 2029** (20 años) y **8 de marzo de 2034** (25 años).
- Hasta que llega cada fecha, la libreta solo muestra «🔒 Cápsula sellada · se abre el …». Sin nombres propios, como el resto de la libreta.
- Las cápsulas van en `sort` 3.8 a 4.2 en orden de fecha; para agregar otra, copia una entrada y cambia `id`, `date`, `from` y `sort`.
- La carpeta del proyecto pasa a llamarse `BOIS_IO_v178` (antes decía v167).
- `tools/test_capsules.js` sube a 20 comprobaciones (orden, candados, textos ocultos, apertura por fecha, sin nombres propios).

# BOIS.IO v177 · cápsulas del tiempo en la libreta (js/30f-notebook-pages.js)

- **Cápsulas:** una página de `NTB_PAGES` con `from:'AAAA-MM-DD'` solo se abre cuando la fecha real del dispositivo llega a ese día; después queda abierta para siempre. Al abrirse avisa: «Se abrió una cápsula del tiempo en la libreta · J».
- **Selladas:** con `sealed:true`, antes de la fecha la libreta muestra «🔒 Cápsula sellada · se abre el …» sin revelar el texto.
- **Primera cápsula:** «22 de noviembre de 2026», un año después de la carta que nunca se envió (texto propio).
- La página final «hoy» pasa a `sort:100` para seguir siendo la última; las cápsulas usan `sort` entre 3.8 y 99.
- Lista de ideas por completar: `docs/Historia_del_juego.md` (sección «Lista de tareas»).
- Prueba nueva: `tools/test_capsules.js` (9 comprobaciones).

# BOIS.IO v176 · guardado de la historia más resistente (js/22-story-state.js)

- **Revisión de rendimiento:** el camino de cada frame ya estaba bien (los objetos de THREE se crean una vez y se reutilizan), así que no se tocó.
- **Respaldo automático:** antes de cada guardado, la versión anterior de la historia se conserva en `bois_story_bak`.
- **Carga validada:** si el guardado principal está cortado, dañado o con la forma incorrecta, el juego recupera el respaldo (y avisa una vez en consola) en vez de empezar de cero y sobrescribir tu progreso.
- Al **importar** una copia de seguridad se borra el respaldo viejo para que no restaure un estado anterior.
- Prueba nueva: `tools/test_storysave.js` (10 comprobaciones).
- Para el caso de perder todos los datos del navegador sigue valiendo **Configuración → Copia de seguridad → Exportar**.

# BOIS.IO v175 · tren secreto más grande

- Tren y vía a **escala 1,6** (`TRN.scale` en `js/36h-night-train.js`): raíles, durmientes, farolillos, humo y separación entre vagones crecen juntos para que todo siga encajando. Las ruedas de la locomotora ya apoyan sobre los raíles.
- Velocidad de 15 a 20 m/s para que el tren más grande no se sienta lento.
- Si aún lo ves pequeño, sube `TRN.scale` (prueba 2 o 2,4); si va lento o rápido, cambia `TRN.speed`.

# BOIS.IO v174 · tren secreto: luz y más detalle (js/36h-night-train.js)

- **Luz:** raíles, durmientes, postes y todo el cuerpo del tren ahora usan materiales que reaccionan a la iluminación de la escena (antes eran planos y brillaban igual de noche). Solo siguen brillando por sí solos las ventanas, los faroles y el faro.
- **Modelo:** locomotora con caldera con bandas de latón, cúpula, chimenea con aro, ruedas con bujes y bielas, cabina con ventanas, limpiavías y faro; ténder con carbón; vagones con franjas doradas, techo curvo, 5 ventanas por lado con marco, puertas, topes, enganches, bogies con 4 ruedas y farol rojo en el último.
- **Charcos de luz cálida** bajo cada elemento del tren.
- Nota: probado fuera de diciembre con `__boisTren()`; de noche real se verá más oscuro que de día.

# BOIS.IO v173 · secreto: el tren de medianoche (js/36h-night-train.js)

- **Solo en diciembre (fecha real) y de noche.** No forma parte de la historia: sin misión, brújula, libreta ni pistas. Fuera de diciembre el módulo no hace nada ni consume nada.
- La primera vez que hace falta, se construye una **vía de 200–700 m sobre tierra firme y cerca de donde estés**, con raíles, durmientes y farolillos cálidos. Cada 1,5–3 min de noche pasa un tren (locomotora verde + 4 vagones granate con ventanas iluminadas, faro, humo, silbato y traqueteo).
- Diseño propio, sin nombres ni elementos de ninguna película.
- Ajustes en `TRN` (velocidad, vagones, esperas, oscuridad mínima).
- **Pruebas (consola):** `__boisTren()` lo lanza ya aunque no sea diciembre ni de noche · `__boisTren('ruta')` rehace la vía junto a ti · `__boisTren(false)` lo detiene. La consola indica dónde queda la vía.
- Prueba automática: `tools/test_nighttrain.js`.

# BOIS.IO v172 · detalles más personales (rápidos)

- **Katherin (etapa 2):** una charla nueva en la que dice tu apodo, «Toro» (`KATHERIN_TALKS[2]`, `js/30-katherin.js`).
- **Libreta:** dos páginas nuevas en `NTB_PAGES`: «Un descanso de décimo» (Steven y las graderías; se escribe al recuperar la foto de la Gradería) y «Antes del examen» (el agradecimiento a la profesora; al terminar el capítulo IV). Sin nombres propios.
- **Pantalla de carga:** «Cargando el paisaje» pasa a «Mirando el horizonte».
- **Créditos:** línea «Dedicado a — Quien escribió cinco palabras en mi cuaderno · y a las graderías».
- Se dejaron fuera a propósito datos de salud, familia, notas y finanzas.

# BOIS.IO v171 · copia de seguridad del progreso (js/ui/backup.js)

- **Configuración → Copia de seguridad:** **Exportar** descarga `bois_progreso_AAAA-MM-DD.json` (historia, ajustes, lo explorado, posición); **Importar** valida el archivo, pide confirmación, lo restaura y recarga.
- Motivo: todo el progreso vive en el `localStorage` del navegador y se pierde si se borran los datos del sitio o se cambia de navegador/equipo.
- Claves incluidas en `BK_KEYS`. Un archivo que no sea de BOIS.IO se rechaza sin tocar nada.

# BOIS.IO v170 · temporizadores en pausa con la pestaña oculta

- Los cinco temporizadores más frecuentes (gafas ×2, perrito, emoji, guía del capítulo II: de 120 a 250 ms) ahora no hacen nada mientras la pestaña está oculta, igual que ya hacía el bucle de frames. Menos consumo en segundo plano; al volver, todo sigue donde estaba.
- No se tocaron los de baja frecuencia (guardado, libreta, capítulos V–VII): su coste es mínimo y algunos deben seguir corriendo.

# BOIS.IO v169 · errores ya no silenciosos (js/01-core-renderer.js)

- Los 57 `catch(e){}` vacíos de `js/*.js` ahora llaman a `__bw('archivo#n', e)`: muestra en consola **un solo aviso por sitio** (`[BOIS] error ignorado en …`) y el juego sigue exactamente igual. Si algo falla en silencio, ahora deja rastro con su archivo y número.
- Llamada protegida con `typeof __bw==='function'`, así los módulos siguen funcionando en las pruebas de Node sin el núcleo.
- No se tocó el `catch` de `js/ui/menu-modals.js` (se carga antes que el núcleo).

# BOIS.IO v168 · Capítulo VII cerrado: libreta y charlas de Katherin

- **Libreta (`js/30f-notebook-pages.js`):** nueva página «2 de noviembre de 2026» que se escribe al completar el capítulo VII (`ch7_complete`). Editable en `NTB_PAGES` (id `ch7`).
- **Katherin (`js/30-katherin.js`):** tras el capítulo VII pasa a la etapa 5 de `katherinStage()` con cuatro charlas propias en `KATHERIN_TALKS[5]`, más calmadas y sin preguntas sobre la isla. Antes de completarlo no cambia nada.
- Aviso de libreta y misión final ya existían; se mantienen.
- Menú y título actualizados a v168 (el título aún decía v165).

# BOIS.IO v167 · el día avanza solo

- El juego ya no se queda fijo en el atardecer: empieza en el atardecer (75 s) y luego el ciclo sigue solo: noche → amanecer → mediodía → atardecer…, con fundidos de 45 s entre fases. Un ciclo completo dura unos 10 min.
- Ajuste: `HOLD` en `js/10-lighting-time.js` (segundos de cada fase: mediodía, atardecer, noche, amanecer) y `TM.timer` en `js/29-awakening-init.js` (duración del primer atardecer).
- **H** (o el botón Hora) sigue funcionando: elige una hora fija o vuelve a «Automático».

# BOIS.IO v166 · Capítulo VII: la conversación que nunca ocurrió (js/36g-chapter7.js)

- Al terminar el capítulo VI, Katherin espera en su banca del Parque de los Cisnes. Acércate (3,5 m) y pulsa **E**: una sola conversación lineal, sin elecciones, siguiendo la sección 7 de la historia. Al terminar se guarda `ch7_complete`.
- Si viste el nicho vacío del capítulo VI (`ch6_vacio`), aparece una línea extra que lo recuerda.
- Se engancha a `interactKatherin` (como el capítulo IV) y a `bgMission`/`bgTarget`: la misión y la brújula apuntan a Katherin. Antes de completarlo, sus charlas normales no cambian; después, vuelven a ser las de siempre.
- Texto editable en `script()` (funciones `N` narración, `Y` Tú, `Kt` Katherin; el segundo número es la pausa en ms).
- Pruebas desde la consola: `__boisCh7Unlock()` (marca el VI como hecho) y `__boisCh7Reset()`.
- **Cajita de música:** ahora se activa con **B** (antes E), para no confundirla con hablar con Katherin. Aviso, ayuda de controles y `js/30e-swanbox.js` actualizados; la cadena de E en `11-player-input.js` ya no la llama.
- Pendiente: página de libreta para el capítulo VII y que Katherin tenga charlas propias tras completarlo.

# BOIS.IO v165 · auditoría: limpieza, libreta y documentación

- **Limpieza (`js/30e-swanbox.js`):** se eliminan la melodía sintetizada de la cajita (`SL_NOTES`, `SL_BPM`, `SL_VOL`, `sbxNote`), sin uso desde que suena tu mp3.
- **Libreta (`js/30f-notebook-pages.js`):** dos páginas nuevas con fecha. «10 de agosto de 2025» (se escribe al terminar el capítulo IV) y «1 de noviembre de 2026» (al terminar el capítulo VI). Editables en `NTB_PAGES`.
- **Documentación:** nuevo `docs/Historia_del_juego.md` con los 10 capítulos, su estado, de dónde viene cada detalle personal y las ideas pendientes. La historia completa está documentada en `docs/Historia_del_juego.md`. La arquitectura y las pruebas están separadas en `docs/ARQUITECTURA.md` y `docs/TESTING.md`.
- **Auditoría:** sintaxis correcta en todos los módulos, sin funciones duplicadas y compilación reproducible. Quedan abiertas las decisiones de la lista de pendientes de la conversación (guardado, herramientas privadas, créditos).

# BOIS.IO v164 · el nicho vacío de la Torre de los futuros (js/36e-chapter6.js)

- Quinto nicho, **opcional**, en el muro oeste de la Torre B: «Un futuro: lo que aún no conozco». No tiene figura, mesa ni pantalla: solo una luz pálida y quieta con unas pocas estrellas que titilan. A diferencia de los otros cuatro, **no se deforma ni vibra al mirarlo**.
- **No cuenta para abrir la escalera** (siguen siendo 4/4) y no aparece en las pistas «Algo espera…». Bandera nueva: `ch6_vacio`.
- Si lo viste, el final del capítulo añade una línea sobre el espacio sin llenar junto al reflejo en el cristal.
- Ajustes: posición `zc` y `xw` en el bloque «v164 · nicho opcional»; textos en `scene_vacio()` y en `scene_final()`. `__boisCh6Reset()` también borra la bandera.

# BOIS.IO v163 · fotografías más personales (capítulo II)

- Cinco de las seis fotografías ocultas cambian por escenas dibujadas por código, sin rostros: **La ventana del aula**, **Los cerros**, **El camino al colegio**, **El salón en el descanso** (con la ecuación del pizarrón y una mochila) y **Tarde lluviosa** (un juego de saltos con el volumen casi en cero). La **Gradería** se conserva.
- Se mantienen `id`, posiciones, zonas y banderas `photo_*`: las partidas guardadas y la cadena de pistas siguen igual. Cambian solo `title`, `clue`, `mem` e `img` en `data/hidden-photos.js`.
- Herramientas: `tools/make_photos.py` genera las imágenes (cada escena es una función editable) y `tools/apply_photos.py` las incrusta en `data/hidden-photos.js`. Para usar fotos reales, deja JPEG de 504×504 en `tools/photos/` con los nombres `window`, `horizon`, `path`, `empty`, `rain` y ejecuta `apply_photos.py`.
- Textos editables en el diccionario `NEW` de `tools/apply_photos.py`.

# BOIS.IO v162 · caja de música con tu mp3 (data/swan-audio.js)

- La cajita ahora reproduce tu `cines.mp3` (22 s), incrustado en base64 en `data/swan-audio.js`; el juego sigue siendo un solo .html (4,76 MB).
- Ajuste en `js/30e-swanbox.js`: `SL_SEG` (segundo en que entra Katherin) y `SL_AUDIO_VOL`. La melodía sintetizada ya no se usa.

# BOIS.IO v162 · idea 5: páginas de la libreta con fechas (js/30f-notebook-pages.js)

- El diario (J) muestra un bloque «Libreta · páginas con fecha», ordenado por fecha: septiembre de 2025 (3 fotos), 29 de octubre de 2025 (cap. V), 5 de noviembre de 2025 (cap. IV) y una última con la fecha real del sistema (cap. VI).
- Cada página avisa una vez al desbloquearse (flags `ntb_*`). Gancho: una línea en `bgRenderJournal` (js/26-guide-map.js).
- Edita textos, fechas y condiciones en `NTB_PAGES`.

# BOIS.IO v162 · idea 3: caja de música (js/30e-swanbox.js)

- Una cajita de música sobre la banca de Katherin toca (WebAudio) una versión simplificada del tema de «El lago de los cisnes»; E la activa si estás más cerca de la caja que de ella (si no, E sigue siendo hablar).
- Primera vez: Katherin dice «Qué miedo». Después, frases distintas. Flags `swanbox`, `swanbox_n`.
- Ajuste: `SL_NOTES` (melodía, hecha de oído), `SL_VOL`, `SL_BPM`.

# BOIS.IO v162 · idea 8: emoji diferente (js/30d-emoji.js)

- Un tablero con emojis en los Poolrooms (cerca de la entrada, celda 5,4); E abre una cuadrícula de 7×10 con un emoji casi idéntico.
- 3 tableros (flag `emoji_n`), parejas de `EJ_PAIRS`; botón «Rendirme» y Esc para cerrar. Opcional: no bloquea la historia.
- Ajuste: `EJ_PAIRS` (cuanto más parecidos, más difícil) y `EJ_COLS`/`EJ_ROWS`.

# BOIS.IO v162 · idea 2: el perrito (js/30c-puppy.js)

- Un perrito (modelo simple, anima cola y patas) juega cerca de la banca de Katherin cuando ella es visible.
- Si ya tienes la cámara y las gafas (o ya hablaste con Katherin), y te quedas quieto 9 s a 9–36 m de ella, se guarda una foto especial en el álbum (V), sin daño. Flag `photo_puppy`.
- Ajuste: `PU_WATCH`, `PU_DIST` al inicio del archivo. La imagen es un SVG (`PU_SVG`); puedes cambiarla por tu propio dibujo.

# BOIS.IO v162 · idea 1: miopía y gafas (js/30b-glasses.js)

- Al aparecer Katherin (6 fotos) el mundo se desenfoca (CSS blur en el canvas, `GL_BLUR`=3,2 px).
- Unas gafas brillan en otra banca del parque; al acercarte (26 m → 5 m) el foco mejora y con E las recoges.
- Flag `glasses` guardado en la partida. Partidas que ya hablaron con Katherin no se ven afectadas.
- Ajuste: `GL_BLUR` y `GL_DIST` al inicio del archivo.

# BOIS.IO v162 — Capítulo VI: las torres

## v162e · optimización de render (sin cambios visuales)

- **Árboles fuera de cámara:** los chunks de árboles (`js/06-vegetation.js`) se mantienen `visible` para proyectar sombra, pero en el pase principal ya no se dibujan si quedan fuera del frustum (`count=0` en `onBeforeRender`, restaurado en `onAfterRender`; el pase de sombras no llama a `onBeforeRender`). Medido con tiempo y azar congelados en 5 vistas: imagen **idéntica píxel a píxel**, **−33 % a −59 % de triángulos** y **−23 % a −47 % de draw calls** por frame.
- **Césped:** `gOnTrail` ya no crea un array por brizna candidata (constante `gTO`).
- Revisión de errores: sin excepciones en consola en 8 climas, 4 fases horarias, 4 calidades, teclas de juego, modo móvil y reanudación en capítulos 3 y 6; las 12 suites de `tools/` y `verify.py` pasan.

## v162d · sin aurora boreal

- **Eliminada** la aurora de la noche (`js/16-water-life-aurora.js`): se quitan la cúpula de cielo con su shader aditivo y la variable `AUR`. Hacían el cielo nocturno demasiado brillante.
- **Lago:** ya no recibe el brillo emisivo verde de la aurora. El agua conserva su emisivo base de noche (`.1*(1-.65*noche)`).
- `aurFrame()` se mantiene con ese nombre porque `art()` la llama y además avanza las ondas de lluvia y la bruma del lago.

## v162c · agua del lago más realista

- **Causa del patrón rojo/azul en filas:** la textura de normales `waterN` era la suma de solo 4 senoides alineadas (enrejado regular) y con 3,5 y 5,5 ciclos por tile (costuras). Ahora se genera con ~34 ondas de vector de onda entero (pavimenta sin costuras), direcciones y fases pseudoaleatorias y espectro decreciente (2–14 ciclos/tile). Pendiente rms ≈ 0,5 como antes.
- **Color:** `wSh/wMi/wDp` más apagados y verdosos, y teñidos por el color del cielo medio (`wSA`): al atardecer el agua pierde el azul fijo y toma tonos cálidos. Ajuste: peso `.7` del tinte y los tres colores.
- **Reflejo:** el Fresnel se promedia con el de la superficie plana (`.45`) y las normales de detalle se atenúan al mirar rasante, para que el reflejo del cielo sea continuo. Detalle fino filtrado por distancia y ángulo (`wA1..wA3`) y lóbulo ancho del sol para agua rugosa.
- No incluye reflejo real de árboles/orillas (no hay reflexión planar).

## v162b · terreno marrón sin ruido

- **Causa 1:** el hash `tgH` del shader perdía precisión en float32 lejos del origen (a ±400 m y alta frecuencia quedaban ~15 valores distintos) → rayas y granulado.
- **Causa 2:** el suelo de bosque rotaba las coordenadas con un ángulo variable (frecuencia × distancia al origen). Ahora usa dos ángulos fijos con mezcla suave, como el pasto.
- **Causa 3:** detalles finos (camino, roca, playa, bump) que no se apagaban con la distancia. Nuevo `tgAA(f)`: apaga cada detalle según los metros de terreno por píxel (`tgPw`).
- El pasto no cambia. Ajuste: umbrales de `tgAA` (.08,.38) y escalas de `nF`/`nH` en `TG_BODY`.

## v162 · valores por defecto: atardecer, niebla y verano

- **Hora:** arranca en **Atardecer fijo** (`setTod(1);TM.mode=2` en `js/29-awakening-init.js`). Antes: amanecer con ciclo automático. `H` sigue recorriendo las fases; «Automático» reanuda el ciclo.
- **Clima:** arranca en **Niebla** (`WX.st.mode=5`, `js/32-resume-fallbacks.js`), ya con la niebla puesta desde el primer fotograma. Antes: Despejado. Se cambia en Configuración › Clima.
- **Estación:** arranca en **Verano** (`aut:0,autT:0,applied:0` en `js/12-weather.js`; la escena base ya es verano, no hay que aplicar nada). `O` alterna con otoño.
- La rotulación de la apertura pasa a «PLAYA · ATARDECER». Versión del menú y del título: v162.

## v161 · menú principal en HTML real (auditoría)

- **Sin imagen:** se eliminó el JPG del menú (≈330 KB en `css/assets.css`, que lo traía con la etiqueta antigua «v56 · Story Edition» dibujada). La escena (atardecer, lago, torres, figura, cámara y fotos) es ahora un SVG en `index.html` (`#menuScene`).
- **Texto y botones reales:** Comenzar/Continuar, Nueva partida, Configuración, Controles, Historia, Créditos y Salir son botones con texto visible (accesibles, seleccionables por teclado y traducibles). Se eliminaron las zonas invisibles con porcentajes y los bloques CSS `!important` de v57, v62 y v67.
- **Etiqueta coherente:** el menú y el título muestran la versión real (v161). `verify.py` y `test_labels.js` esperan ahora «v161 · Capítulo VI: las torres».
- **Primer botón:** muestra «Continuar» si hay progreso guardado (`bois_story`/`bois_pos`) y «Comenzar» si no; al pausar con Esc sigue diciendo «Continuar».
- **Panel de controles:** ahora se abre a la derecha en escritorio y como hoja inferior en móvil; el botón alterna «Controles» / «Ocultar controles».
- `dist/BOIS_IO.html` pasa de 4,64 a 4,19 MB. Ajuste visual: colores y formas del SVG en `index.html`; disposición en el bloque «v161» de `css/main.css`.

## v160 · three.js sin depender del CDN (auditoría, punto 1)

- **`tools/fetch_three.py`**: descarga three.js r128 a `vendor/three.min.js` (con red, una vez), comprueba que es la versión esperada y muestra su hash SRI.
- **`tools/build.py`**: si existe `vendor/three.min.js`, lo **incrusta** en `dist/BOIS_IO.html` y el juego funciona sin conexión; si no, deja el CDN y avisa por consola.
- **Respaldo en `index.html`**: si el CDN falla, se intenta el espejo jsDelivr (three@0.128.0); si tampoco, aparece un aviso claro («No se pudo cargar el motor 3D») en vez de una pantalla en blanco.
- Estado actual: el zip incluye `vendor/three.min.js`; `index.html` y `dist/` pueden funcionar sin conexión. Si necesitas regenerar el vendor, usa `python3 tools/fetch_three.py` y después `python3 tools/build.py`.

## v159 · el mar de nubes ahora parece nubes

La capa blanca que se veía desde el puente era el suelo de nubes con una textura casi sin contraste. Ahora:
- **Relieve:** las dos capas opacas usan una textura de ruido fractal sin costuras (`cloudTex`, `fbm`) con luz arriba-izquierda: crestas claras y huecos azulados. La de abajo es opaca y más sombría; la de arriba tiene huecos (alfa) por donde se ve la de abajo, así hay profundidad y paralaje al moverte.
- **Cúmulos que asoman** (`pf`): 84 sprites (38 en móvil) con luz arriba y sombra abajo, a la deriva a 0,6–2,2 m/s, repartidos delante del banco de niebla (z<420) y fuera de la zona de la ciudad. Siguen el color de la niebla.
- Ajuste: contraste en `cloudTex` (`.74+.26*n`, `.58+.34*n`), huecos `sm(.38,.64,n)`, repetición (6 y 5), cantidad y tamaño de los cúmulos.

## v158 · crestas de nubes en el horizonte del capítulo VI

- **Cúmulos sobre el banco de niebla** (`tops` en `mist()`): 3 capas (2 en móvil) de nubes suaves que derivan despacio en sentidos distintos, justo en el borde superior del banco, para que el horizonte hacia la isla no sea una pared lisa. Siguen el color de la niebla del mundo (hora, clima, relámpagos) y se espesan con la niebla y la lluvia.
- Ajuste: opacidades, alturas (`y`), distancias (`z`) y repetición de la textura en la lista de `tops`.

## v157 · pulido del capítulo VI

- **Ciudad con bruma:** su material ignora la niebla de escena, así que ahora se tiñe hacia el color de la niebla según el clima (más con niebla y lluvia) y por el día; de noche conserva sus luces. Variable `M6.city`.
- **Haces de las torres de la ciudad:** confirmados como decoración intencional del capítulo (`roofTop()`); no son los de la isla.
- **Prueba `test_chapter6models.js`:** esperaba 18 piezas en la figura de pie y son 21; actualizada. Ahora `verify.py` debería pasar completo.

## v156 · el banco de niebla ahora sí tapa la isla

En v155 el banco de niebla era transparente sin escribir profundidad, y el agua (también transparente, dibujada después) lo pisaba: la isla seguía viéndose. Ahora usa `depthWrite:true` + `alphaTest` y `renderOrder:-100`, así lo que queda detrás (agua, isla) no se dibuja sobre él.

## v155 · la isla ya no se ve desde las torres del capítulo VI

Todo es visual; la historia, las banderas y las zonas caminables no cambian.
- **Isla oculta:** hacia el sur (el lado de la isla) hay ahora un **banco de niebla opaco** (`mist()`, variable `bank`) que va del fondo hasta poco por debajo de los ojos y se difumina hacia el horizonte. Cubre toda la isla y el mar; el color sigue al de la niebla del mundo (hora, clima, relámpagos).
- **Ciudad visible:** el material de la ciudad lejana (este) ahora ignora la niebla de escena (`fog:false`), que antes la borraba por completo a más de 600 m; sigue tapada por abajo por los telones y asoman sus luces y balizas. El banco de niebla no cubre el este.
- **Haces de luz de las torres de la isla** (520 m de alto, sin niebla) se ocultan mientras estás en el capítulo VI y vuelven al salir.
- **Niebla de escena** algo más densa (base ×5 en vez de ×4).
- Limitación: no pude abrirlo en un navegador (sin red para three.js); está verificado por código y por las pruebas. Si ves un borde duro del banco, ajusta el degradado `bk` o las posiciones `[430,…],[820,…]` en `mist()`.


## v154 · torres y niebla marina del capítulo VI

Todo es visual: la historia, las banderas, las zonas caminables y los accesos no cambian.
- **Torres como las de la isla** (`js/36e-chapter6.js`): fachada de muro cortina azul con montantes blancos y franjas de forjado, aristas de acero oscuro, bandas de pisos, coronación escalonada con antena, balizas rojas y haz de luz, y viga-cajón con costillas bajo el puente de cristal.
- **Niebla marina** (`mist()`): 5 capas de bruma bajo la galería (3 en móvil) y 2 telones entre las torres y la ciudad, que se hunde por abajo mientras sus luces y balizas asoman. Ciclo lento de unos 2 minutos.
- **Integrada con el juego:** el color sigue la niebla del mundo; se espesa con la niebla y la lluvia del clima, se oscurece de noche y con tormenta, y destella con los relámpagos. Ajuste: `MIST_MAX`.
- **El clima vuelve a poder usarse:** `WX.cycle()` existía pero nada lo activaba y el arranque lo dejaba fijo en «Despejado». Ahora el menú tiene un selector **Clima** (Automático, Despejado, Supercélula, Lluvia, Tormenta, Niebla) mediante `WX.setMode(i)`.
- **Ventanas de la Torre del pasado rehechas** (`rainWindow()`): antes eran planos de rayas que se desplazaban (parecían pantallas). Ahora tienen marco pintado con volumen, travesaño, montante, pestillo y alféizar de madera; un fondo de tarde gris con edificios, árboles y luces desenfocadas; lluvia lejana en dos capas; cristal con gotas, rastros y condensación; gotas que resbalan a tirones; y luz fría sobre el suelo. Se aíslan con `try/catch`.
- **Dibujos de clase rehechos:** hojas con fibra de papel y trazos de crayón (sol y casa, árbol y familia, cohete y estrellas) sobre cartulina, con chinchetas, sombra e inclinación. Se movieron para no tapar las ventanas del sur.
- **Niebla más espesa:** la niebla de escena ya no deja ver lo lejano (visibilidad ≈ 250 m), hay un suelo de nubes opaco bajo la galería que oculta el mar, y los telones sobre la ciudad son más densos.
- **Capítulo VI con niebla por defecto:** al entrar pasa a «Niebla» y al salir recupera el clima anterior (salvo que lo hayas cambiado tú en el menú). Dentro de la galería la niebla de escena es más suave con tiempo despejado (se ve más la isla lejana) y crece con niebla, lluvia y tormenta.

## v153 · modelos 3D del capítulo VI

La historia, las banderas, las zonas caminables y el acceso a las torres no cambian. Todo lo nuevo es visual salvo lo que se indica.

**Errores corregidos**
- **Alcobas duplicadas:** «soledad» y «compañía» se construían dos veces (una versión detallada y otra simple), una encima de otra: sillas y siluetas dobles, parpadeos de superficies solapadas y dos interacciones iguales. Se eliminó la versión simple.
- **Siluetas sentadas de pie:** las figuras «sentadas» en sillas, escritorios y mesa estaban de pie atravesando el mueble; las de la mesa de «compañía» miraban hacia fuera. Ahora se sientan de verdad y miran a la mesa.
- **El niño del escritorio** (escena «escenas que se van cerrando») no tenía silla.

**Figuras (`figure()`, `js/36e-chapter6.js`)**: pasan de 9 piezas sueltas (cilindros y esferas) a una silueta articulada de 17 piezas (pelvis, torso, pecho, cuello, cabeza alargada, muslos y pantorrillas, pies, brazos con codo y manos), con tres poses (de pie, sentada y escribiendo en la pizarra) y un halo suave en el suelo. Las geometrías y materiales se **comparten** entre todas las figuras, así que no cuestan memoria extra.

**Torre del pasado (aula):** parquet con vetas y juntas, boiserías con barandilla en las paredes, seis lámparas colgantes, dos ventanas más con lluvia y alféizar, tres dibujos de clase, escritorio del profesor con un globo terráqueo giratorio, y los escritorios ahora con cajón, libros y hojas. Polvo flotando en el aire.

**Puente:** luz en los bordes del suelo y diagonales estructurales bajo la pasarela.

**Torre de los futuros:** baldosa pulida con líneas de luz en el suelo, un haz de luz sobre cada alcoba y, en el centro, unos **anillos de tiempo** giratorios que cuelgan del techo a 3,6 m (a propósito sobre la cabeza y sin colisión: una primera versión con pedestal cerraba el pasillo recto entre el puente y la escalera; lo detectó `test_v140.js`).

**Escalera y último piso:** luz en cada peldaño y en el pasamanos; macetas, dos bancos hacia el ventanal y un anillo de luz alrededor de la inscripción (con colisión en macetas y bancos); pizarra oscura en el suelo.

**Ciudad del horizonte:** segunda fila de edificios más altos y lejanos, balizas rojas parpadeantes y el reflejo de las luces en el mar.

**Torres exteriores (`js/20-life-bridge-towers.js`):** aristas verticales, cinco bandas de pisos, parapeto, remate escalonado de cristal y antena.

**Otros:** la galería se **oculta** al salir de las torres (no cuesta nada en la isla); la torre del pasado muestra el progreso **n/3**; la pista «Algo espera…» se repite cada 14 s (antes 9 s). El decorado va aislado en `try/catch`: si algo fallara, la galería base sigue.

**Verificación:** `tools/test_chapter6models.js` (49 comprobaciones: ejecuta `figure()` y `decor()` con un `THREE` simulado, comprueba que no queden alcobas duplicadas y que la historia siga intacta), integrada en `verify.py`. Se ampliaron los simuladores de `THREE` de `test_v140.js` (`translate`, `Points`, `setScalar`, `repeat`, degradados), que ahora recorre la historia completa con el decorado incluido. **No se pudo probar el render:** revisa en el juego el aspecto de las figuras, el parquet, los anillos, la ciudad y el rendimiento en móvil (el juego tiene ~30 figuras; si bajaran los fotogramas, el lugar a tocar es `figure()`).


## v152 · audio de los Poolrooms más bajo + mejoras del capítulo V

**Causa del volumen:** en `js/18-poolrooms.js` el ambiente tenía un volumen maestro de **.55** (el viento exterior ronda .03–.1), un rumor de agua de ruido a .5 con filtro en 520 Hz, un zumbido con onda triangular (armónicos ásperos), gotas de hasta .09 con tres ecos y pasos de hasta .13. Además el volumen solo se leía al crear el ambiente: la tecla **N** no lo cambiaba dentro de los Poolrooms.

**Audio (`js/18-poolrooms.js`)**
- Volumen maestro `PRV = .15` (antes .55, ≈ −11 dB). Es la única cifra a tocar si lo quieres más alto o más bajo.
- Rumor de agua más grave y bajo (300 Hz, .16) con un vaivén lentísimo (≈14 s) para que «respire» en vez de sonar plano; zumbido solo con senos y a .005; todo pasa por un filtro paso-bajo suave (1,6 kHz) y la reverberación es más corta y con menos realimentación.
- Gotas: máximo .026 (antes .09), filtradas, 2 ecos en vez de 3, en un lado aleatorio del estéreo y más espaciadas (2,4–8 s).
- Pasos: aproximadamente a la mitad.
- El volumen **sigue a la tecla N** y **baja al 45 % durante las cinemáticas**, para que el texto se lea con calma.

**Capítulo V (`js/36c-chapter5.js`)** — la historia, las banderas y el desbloqueo del capítulo VI no cambian.
- **Progreso visible:** «Recuerdo 1/3, 2/3, 3/3» al terminar cada sala y en la pista de distancia.
- **Las luces azules se apagan poco a poco** (≈1 s, encogiéndose) en vez de desaparecer de golpe.
- **Sonido propio, muy suave** (`SV = .03`): un zumbido de dos notas casi iguales que crece al acercarte a la luz activa más cercana (se oye hasta ~28 m y se apaga al salir), y acentos al terminar cada sala, al completar las tres, al llegar a la mesa, con Katherin y al cerrar el capítulo.
- La pista «luz azul más cercana: N m, dirección» se repite cada **14 s** (antes 9 s): con la señal sonora ya no hace falta tanta insistencia.
- `__boisCh5Reset()` también restablece el desvanecimiento.

**Verificación:** `tools/test_poolaudio.js` (19 comprobaciones; ejecuta el código real del ambiente con un `AudioContext` simulado), integrada en `verify.py`. **No se pudo oír en un navegador:** confirma en el juego que el nivel te parece bien (ajusta `PRV` y `SV`), que el desvanecimiento de las luces se ve limpio y que la señal sonora no resulta molesta.


## v151 · audio del viento en estructuras extremas

**Causa:** en `js/07-audio-discovery.js` el volumen del viento crecía con la altitud absoluta (`h·0,003`, sin saturación suave) y el filtro se abría sin límite (`450 + h·7` Hz). Las torres del capítulo VI están a y≈240, así que el viento sonaba al volumen máximo y con un siseo agudo. Además `auUpd()` no tenía en cuenta los espacios cerrados: solo la rama submarina se silenciaba.

**Corrección**
- La contribución de la altura se **satura** (`0,2·(1−e^(−h/60))`): cerca del suelo suena prácticamente igual que antes, pero ninguna altura supera el techo. A 240 m queda por debajo del 30 % del máximo anterior.
- El filtro tiene **techo de 1100 Hz**.
- Nueva función `__boisAudioZoneMute()`: Poolrooms silencia el viento por completo y las torres (z < −900) lo reducen un 88 % (el puente de cristal sigue siendo exterior, así que conserva un susurro). La lluvia sonora usa la misma atenuación.
- Afinar: `.2` y `/60` en `boisWindParams` (carácter del viento en altura), `.88` en `__boisAudioZoneMute` (cuánto se oye en las torres).

**Verificación:** `tools/test_windaudio.js` (15 comprobaciones), integrada en `verify.py`. No se pudo oír en un navegador: confirma el volumen en las torres, en el puente y en lo alto de la isla.


## v150 · el resplandor del sol ya no atraviesa paredes

**Causa:** el brillo al mirar al sol (`js/36f-shinkai.js`) es una capa a pantalla completa que solo comparaba hacia dónde mira la cámara con la dirección del sol; no comprobaba si había algo en medio, así que se veía a través de edificios, techos y colinas.

**Corrección:** cada 3 fotogramas (y solo cuando el brillo sería visible) se lanza un rayo desde la cámara hacia el sol y se comprueba contra: el terreno, la malla sólida de todos los edificios (la misma rejilla que usa la colisión) y «bloqueadores» registrables (`window.__boisSunBlockers`). El edificio del capítulo IV, que no está en esa rejilla, se registra como bloqueador: techo (con el tragaluz abierto, por donde sí entra la luz) y cuatro muros. El resultado se suaviza para que el brillo se apague y vuelva sin saltos. En Poolrooms y en las torres del capítulo VI el resplandor se desactiva.

**Límites conocidos:** las ventanas cuentan como muro (por prudencia no se ve el resplandor a través del cristal), y los troncos de árboles incluidos en la malla sólida pueden atenuarlo un instante. **Verificación:** `tools/test_sunglare.js` (12 comprobaciones, usando el código real de la rejilla de colisión), integrada en `verify.py`. No se pudo probar en un navegador: confirma en el juego, dentro y fuera de edificios y mirando al sol desde varios ángulos.


## v149 · remasterización del capítulo IV (Lo que fuimos)

Archivo: `js/31-chapter4.js`. La ruta principal (puerta → cuaderno → pizarra → ventana) y sus banderas no cambian, así que los capítulos V y VI siguen funcionando igual.

- **Cuatro fragmentos opcionales** dentro del edificio (estantería, cartelera, computadores apagados y casilleros). No bloquean la historia. Se examinan con **E**, aparece una pista al acercarte, cuentan «n/4» y se guardan como `ch4_f_shelf`, `ch4_f_board`, `ch4_f_pc` y `ch4_f_lockers`.
- **La ventana reacciona:** si reuniste los cuatro, la escena final incluye el recuerdo de los cisnes dibujados en los márgenes; de noche cambia la descripción del bosque.
- **La pizarra se completa:** tras el eco de la tiza aparece escrito el resultado que faltaba (`x = −2`), también al reanudar una partida.
- **Ambiente:** 150 motas de polvo flotando en el aire y parpadeo ocasional de las lámparas. Solo se animan con el jugador a menos de 26 m; con el edificio oculto o en pausa no cuestan nada.
- **Verificación:** `tools/test_chapter4.js` (40 comprobaciones: fragmentos, que ninguno invada las zonas de interacción originales, que no se solapen, banderas conservadas y que los capítulos V y VI no dependan de ellos), integrada en `verify.py`. **No se pudo probar el render:** el polvo, el parpadeo y la letra del resultado en la pizarra deben revisarse en tu equipo. Textos editables en `CH4_FRAGMENTS`, al inicio del archivo.


## v148 · remasterización del capítulo III (Katherin)

Archivo: `js/30-katherin.js`. El modelo y el primer encuentro se conservan; cambia lo que ocurre después.

- **Conversaciones por etapas:** tras conocerla, Katherin habla según tu progreso (antes del IV, tras el IV, tras el V y tras el VI). Cada etapa tiene tres conversaciones que se suceden en orden, sin repetirse seguidas (contador `kath_talks`).
- **Contexto:** en visitas alternas comenta la lluvia, la noche, el amanecer o el atardecer.
- **Ritmo de lectura:** las pausas de cada línea se ajustan a su longitud.
- **Vida en la escena:** mira hacia el lago y los cisnes cuando estás lejos, su sonrisa se ensancha tras el primer encuentro, hay un cuaderno en la banca y caen unas pocas hojas cerca (solo se animan si estás a menos de 30 m).
- **Robustez:** la construcción va en `try/catch`; el asiento (F), la banca y los cisnes funcionan igual.
- **Verificación:** `tools/test_katherin.js` (12 comprobaciones de diálogo, etapas, contexto y primer encuentro), integrada en `verify.py`. **No se pudo probar el render:** la apariencia del cuaderno y las hojas, y el tono de los textos, deben revisarse en tu equipo.


## v147 · versión de consolidación

Sin cambios de jugabilidad. Solo orden, higiene y seguridad:

- La foto restaurada del capítulo V (197 KB en base64) sale de `js/36c-chapter5.js` a `data/chapter5-photo.js`; el módulo pasó de 210 KB a ~13 KB.
- El revelado de foto de `23-cinematics.js` escapa título e imagen antes de usar `innerHTML`.
- Versión unificada en título, menú, README y pruebas. `tools/test_v141.js` pasa a llamarse `tools/test_labels.js`.
- Pendiente (requiere probar en navegador): `dispose()` al salir de torres/poolrooms, registro de `catch` vacíos, three.js local en `vendor/`.


El juego original era **un solo HTML de 3,6 MB / 3.766 líneas**; ~3,2 MB eran datos incrustados
(malla 3D, texturas y fotos en base64). Aquí está separado en datos, estilos y ~40 módulos de código.

## v143 · Capítulo VI · Las torres: mirar hacia el pasado

Nuevo módulo `js/36e-chapter6.js` (aislado en try/catch, como los capítulos IV y V). Se activa al completar el **capítulo V**. Sigue el apartado 6 de `docs/Historia_del_juego.md`.

**Por qué una galería propia:** se analizó la malla del mapa. Las torres del mapa original son cascarones con escaleras que no se pueden recorrer desde la puerta y no tienen puente transitable, así que el interior se construye por código en el mismo escenario, muy lejos de la isla (`O6 = (0, 240, -1400)`), con su propio suelo y colisión mientras dura la visita. `ground()` y `blocked()` se envuelven y solo actúan mientras `M6.on` es verdadero; fuera de las torres se comportan igual que antes.

**Flujo**
1. **La puerta:** al terminar el capítulo V aparece una columna de luz entre las dos torres (−17,5; −16,8). La misión, el mapa y la brújula la señalan. **E** → cinemática de entrada y fundido al interior.
2. **Torre del pasado** (3 escenas, la tercera exige las dos primeras): el *aula reconstruida* (escritorios, pizarra, siluetas sin rostro, ventana con lluvia); *el niño que preguntaba* (curioso, hablador, rodeado de «?» que orbitan); y las *escenas que se van cerrando* (incomprensión, vergüenza, aislamiento, silencio; cada una con menos luz). Al terminar, la compuerta del puente se abre.
3. **Puente de cristal** sobre el mar: al cruzarlo, una reflexión («una torre para recordar, la otra para imaginar»), una sola vez.
4. **Torre de los futuros** (4 nichos): Física, computadoras, soledad y compañía. **Cambian si los miras demasiado tiempo** (se deforman y vibran mientras el ángulo y la distancia de la mirada lo mantienen) y vuelven a su forma al apartar la vista. Los cuatro abren la escalera.
5. **Escalera de cristal** (40 peldaños de 0,3 m) hasta el **último piso** (+12 m): la frase del suelo, «No puedes recordar el futuro porque todavía no ha ocurrido», y el ventanal con la ciudad lejana. En la ventana, el protagonista comprende que trataba su vida como un problema matemático; la isla solo le muestra posibilidades. Fin del capítulo y regreso a la puerta.

**Controles y robustez:** **E** examina; **Retroceso** (o el botón «VOLVER A LA ISLA») sale en cualquier momento; el progreso se guarda por banderas y se reanuda donde corresponde (torre del pasado, puente, torre de los futuros o último piso). Los pasos suenan a cristal y hay un zumbido ambiental suave. Los materiales son autoiluminados (no añaden luces a la escena), de modo que se ven igual de día y de noche.

Banderas: `ch6_started`, `ch6_aula`, `ch6_nino`, `ch6_cierre`, `ch6_bridge`, `ch6_fisica`, `ch6_compu`, `ch6_solo`, `ch6_gente`, `ch6_frase`, `ch6_complete`. Atajos de consola: `__boisCh6Unlock()` (marca los capítulos IV y V como completos) y `__boisCh6Reset()`.

**Otros cambios:** la misión final del capítulo V ya no dice que la historia termina; el menú indica «capítulos I–VI disponibles»; el panel de controles menciona la salida de las torres; título y versión a v143.

**Verificación (`tools/test_v141.js`, 22 comprobaciones):** ejecuta el módulo real con un THREE y un DOM simulados y recorre la historia completa (entrada, escenas, compuertas, puente, mirada que deforma los futuros, escalera, frase, ventana, regreso, reanudación y salida con Retroceso), comprobando suelo, colisiones, altura de peldaños, banderas y misión. **No se pudo probar el render en un navegador:** el aspecto, la escala de las piezas, los colores y la sensación de la mirada deben revisarse en tu equipo. Ajustes rápidos: textos en las funciones `scene_*`; tamaños y posiciones en `ZONES`, `build()` y `alcove()`; sensibilidad de la mirada en `loop()` (`dot>.95`, `dt*.45`).

## v139 · césped coherente con el terreno

- Las briznas instanciadas consultan el mismo mapa de superficies que el shader del terreno. Solo se dibujan donde el canal azul identifica césped; se descartan sobre caminos, tierra y zonas no verdes.
- Se retira el césped 3D de la franja de playa baja (umbral de altura elevado de 2,8 a 3,25).
- Menor densidad de matas para reducir el punteado y mejor lectura de cada brizna; se aclaran ligeramente sus tonos para evitar puntos casi negros.
- Se reduce el grano de alta frecuencia de la arena para disminuir el aliasing a distancia.
- Se conserva la iluminación ambiental y la decoración añadidas en v138.

## Cómo usarlo

- **Jugar/desarrollar:** abre `index.html` (doble clic funciona; también con cualquier servidor estático).
  Requiere internet solo para `three.js r128` (CDN). Para jugar sin conexión, descarga ese archivo
  a `vendor/three.min.js` y cambia la ruta en `index.html`.
- **Generar un único HTML para distribuir:** `python3 tools/build.py` → `dist/BOIS_IO.html`.
  El build fusiona datos + módulos en **un solo `<script>`**, por lo que se comporta igual que el v120 original.
- **Verificar la entrega:** `python3 tools/verify.py` comprueba referencias locales, sintaxis JavaScript, regresiones de v137 y cambios visuales de v138, corrección de césped v139 y reproducibilidad del HTML (requiere Node.js).


## v138 · renovación visual del mundo

Esta versión conserva la estructura y la jugabilidad de v137, pero comienza una pasada visual centrada en PC.

- **Sombras más suaves:** el renderer usa PCFSoftShadowMap. Se ajustaron el sesgo y el área de la cámara de sombras para reducir sombras excesivamente separadas y conservar detalle cerca del jugador.
- **Relleno ambiental dinámico:** una luz direccional secundaria, sin sombras propias, sigue al jugador y cambia suavemente según la hora y el clima. Su función es recuperar detalle en las zonas que quedan demasiado oscuras, sin reemplazar la luz solar.
- **Suelo con más vida:** se añadieron arbustos bajos, grupos pequeños de hongos, troncos caídos y piedras. Son mallas instanciadas para limitar las llamadas de dibujo; su colocación excluye el agua, las rutas marcadas, pendientes pronunciadas y las inmediaciones de edificios.
- **Calidad:** el modo Alta usa un mapa de sombras de 2048 px y Ultra 2560 px. Los modos Baja y Media conservan tamaños más modestos.

**Alcance de verificación:** se validan sintaxis, referencias, orden de carga, compilación y pruebas de regresión. El render WebGL y el coste real en FPS deben observarse en tu PC; no se afirma una mejora visual medida sin esa prueba. Si el rendimiento cae, usa calidad Media o Alta y compara.

## v137 · consolidación y correcciones

Esta versión prioriza estabilidad y coherencia sobre la incorporación de contenido nuevo.

- **Arranque:** el menú ya no se habilita antes de que el primer `frame()` termine correctamente. Si el primer render lanza un error, se detiene el bucle RAF que pudiera haberse programado y se muestra el panel de fallo.
- **Conducción sobre el puente:** la validación del auto consulta `ground()` para comprobar la superficie transitable y no solo la altura del terreno bajo el agua; esto permite usar la cubierta del puente cuando está presente en la malla de colisión.
- **Vehículo en móvil:** se incorpora un botón táctil «Freno» que activa el freno de mano mientras se mantiene pulsado. Se libera al levantar el dedo, cancelar el puntero, perder el foco o cambiar de pestaña.
- **Salida del vehículo:** se prueban cuatro posiciones; solo se permite bajar si la posición está sobre suelo o una plataforma válida, a una altura coherente con el auto y sin colisiones. Si todas fallan, el jugador permanece en el auto y recibe una indicación para moverlo.
- **Reinicio:** ahora también se elimina `bois_explored`, de modo que el mapa vuelve a estar sin explorar. Se conservan `bois_cfg` (ajustes) y `bois_dev_points` (marcadores privados de desarrollo).
- **Historia:** el objetivo tras completar el capítulo V ya no afirma que las torres inicien un capítulo jugable. El menú aclara que los capítulos I–VII están disponibles y que VIII–X son contenido previsto.
- **Interfaz:** título y versión visibles actualizados a v137; controles de conducción y nota táctil documentados.

**Verificación de esta entrega:** compilación del HTML distribuible, validación sintáctica de módulos y bundle, revisión de referencias locales y pruebas automatizadas de los cambios de control/estado. El render WebGL, los FPS y el uso táctil deben confirmarse también en navegadores y dispositivos reales; no se deben interpretar las pruebas estáticas como certificación visual.

## v136 · auto realista (modelo 3D + física)

**Modelo:** ventanas laterales reales con pilar B, juntas de puertas y manijas, faldones, defensas cromadas, escape,
arcos de rueda oscuros con molduras de guardabarros, discos de freno con pinzas rojas, luces de reversa, sombra de contacto.

**Física** (`js/28-car-radio.js`, constantes en `CAR_CFG`): modelo de bicicleta con neumáticos saturables (subviraje /
sobreviraje / derrape), motor con curva de par, caja automática de 5 marchas + reversa (RPM y marcha en el HUD),
transferencia de peso, frenos con ABS y reparto dinámico, **freno de mano (Espacio)**, tracción trasera con patinaje,
resistencia del aire y rodadura, pendientes (sube más lento), suavizado vertical individual de las ruedas (suspensión visual simplificada), inclinación según
terreno y aceleración, saltos por crestas/precipicios, menos agarre en arena y bajo lluvia, choques con rebote,
sacudida de cámara y sonido de impacto.

**Efectos:** marcas de neumáticos, humo/polvo al derrapar o patinar, sonido de motor por RPM, viento y chirrido de llantas,
cámara que sigue la dirección de marcha, se aleja y abre el FOV con la velocidad.

Ajustes rápidos: `CAR_CFG.vmax` (velocidad punta, m/s), `Cf`/`Cr` (agarre), `brakeG`, torque en `carTorque()`.

**Precisión técnica añadida en v137:** el frenado limita la fuerza según la adherencia disponible y reparte la carga entre ejes; no implementa un ABS con control individual de deslizamiento por rueda. El movimiento vertical de cada rueda se suaviza por separado para dar respuesta visual al terreno; no es una simulación completa de suspensión independiente.

## v135 · se elimina la mecánica del diario antiguo (B)

Con la nueva historia el diario de campo antiguo ya no tenía sentido (ninguna tecla lo abría). Se quitó por completo:

- **Diario (`DIA`)**: ventana, página de especies, «Historia de la isla» (`CAP`), fichas (`SPD`), lista (`LOGN`) y sus atajos de teclado/rueda.
- **Registro de especies**: `DSC`, `SEEN`, `registrar()`, `discover()`, avisos «👁 Avistado» / «📷 Fotografiaste», celebración de «todas las especies» y la detección de criaturas en el encuadre.
- **Notas sueltas** (`NT`, `TXT`, `showNote`, brillo `GMt`): ya no se generaban en ningún sitio.
- Claves de `localStorage` `bois_dsc`, `bois_seen`, `bois_dfoto` y `bois_notes`: ya no se escriben; «Reiniciar» las sigue borrando para limpiar partidas antiguas.

**Se conserva:** la cámara (**P**): ahora es una foto simple con flash y sonido de obturador (`window.camFlash`, en `08-fauna-journal.js`); **Mayús+P** descarga la imagen. Los animales, el diario nuevo (**J**) y las fotografías ocultas no cambian.

## v134 · los animales vuelven + limpieza de código muerto

**Por qué no se veían los animales:** en `21-main-loop-config.js` el bucle principal solo tenía un comentario (`/* fauna frozen */ … /* living nature static */`) donde antes se actualizaban los animales. **Nadie llamaba** a `fauna()`, `__life2()` ni `art()`, así que las instancias de los animales nunca recibían posición (quedaban amontonadas en el origen del mapa) y nada se movía. Mismo tipo de fallo que el césped en v132.

**Qué vuelve a funcionar** (ahora se llaman cada frame, aisladas con `__safeRun`):
- `fauna()` (`08-fauna-journal.js`): ciervos, ovejas, conejos, zorros (cazan conejos), cangrejos, cisnes del lago, bandadas de aves y cardúmenes de peces; huyen o se alertan según te acerques, duermen de noche. No corre dentro de los Poolrooms.
- `__life2()` (`08-fauna-journal.js`): tortugas y ranas de la orilla (las ranas cantan de noche), mariposas de día, lechuzas de noche y las medusas de los Poolrooms.
- `art()` (`13-park-fireflies-rainbow.js`): también estaba congelada. Con ella vuelven las **ondas** que dejan cisnes, nado y lluvia en el lago, la **bruma**, las **auroras**, el **arcoíris** tras la tormenta y el aviso del Parque de los Cisnes.
- `__safeRun(nombre, fn)`: ejecuta cada sistema en su `try/catch`; si uno falla 3 veces se desactiva solo ese y el resto del juego sigue (aviso en consola).

**Limpieza (todo invisible en pantalla, sin cambiar el aspecto):**
- Bloque de arranque de `08-fauna-journal.js` que buscaba 10 posiciones con hasta 6000 intentos para notas «antiguas desactivadas» y nunca las usaba; función `mkNote` y `tg` (stub vacío).
- Funciones sin ninguna llamada: `hdg` (+ `DIRS`), `storySeen`, `carMat`, `radioAnnounce`.
- Variables, constantes y cálculos sin uso: `spi`, `pulse` (se calculaba un seno por frame en el clima), `hudT`, `cullTick`, `IN`, `PIT`, `solid`, `MC`, `SGN` (Poolrooms), `chalk` (material del Cap. IV), `__newGamePending`, un `bgNearestPhoto()` sin usar en `26-guide-map.js`, `{sf}` en el Cap. I, y el resultado sin usar de un cilindro en el Cap. IV (el cilindro se sigue dibujando).
- Panel de controles: se quitaron las teclas **N** y **U** repetidas; título y menú decían v126.
- Se comprobó que no hay imágenes incrustadas duplicadas.

**Verificación:** análisis estático de todo el bundle (TypeScript `checkJs` + `noUnusedLocals`): 0 símbolos sin uso; los únicos avisos que quedan son accesos protegidos a `window.*`. Además, el código real de `fauna()`, `__life2()` y `art()` se ejecutó en Node con un `THREE` mínimo y un terreno sintético durante 3000 y 1800 fotogramas (día, noche y lluvia): 0 errores, ninguna posición NaN, todas las especies colocadas. **No se pudo probar el render en un navegador**: revisa el aspecto, la escala y el rendimiento en tu equipo.

**Nota (histórico):** el diario de campo antiguo (B) se eliminó en v135; ver la sección v135.

## v133 · Capítulo II remasterizado: «La isla, un lugar que parece conocerte»

**Objetivo:** que encontrar las seis fotografías sea una invitación a recorrer el mapa y no una vuelta alrededor del lago.
Antes, 4 de las 6 estaban en la orilla del lago (y las otras dos a <150 m). Ahora cada una vive en una región distinta, la más cercana al lago a 135 m de la orilla.

| # | Foto | Región | x, z | Lugar |
|---|---|---|---|---|
| 1 | Ventana iluminada | Norte, cerca de la playa de inicio | 269, −402 | final de un camino frente a los edificios viejos |
| 2 | El horizonte | Costa este | 450, −48 | borde de la costa mirando al mar |
| 3 | Camino sin fin | Sur-sureste | 365, 447 | extremo del sendero más largo, junto al borde de la isla |
| 4 | Gradería | Costa sur | −24, 406 | campo abierto entre las casas del sur |
| 5 | Habitación vacía | Suroeste | −382, 348 | final de un camino, junto a la construcción abandonada |
| 6 | Tarde lluviosa | Noroeste | −349, −312 | entre colinas y muros viejos, lejos del lago |

Las posiciones se eligieron analizando el terreno (tierra firme, pendiente suave, sin árboles encima, no sobre el agua). El mapa del juego usa x→este, z→sur.

**Cómo funciona ahora**
- **Pistas encadenadas** (`data/hidden-photos.js`, el orden del arreglo es la cadena): al empezar solo se conoce la pista de la 1.ª; cada fotografía recuperada revela la de la siguiente. Las pistas describen el paisaje, no dan coordenadas. Se leen en el HUD («Lo que sigue») y en el diario (J → «Pistas»).
- **Mapa (M):** cada pista conocida dibuja una **zona punteada** aproximada (radio 70 u, centro desplazado con `zx,zz`) con un «?»; el punto exacto sigue oculto. Al recuperar la foto aparece el punto.
- **Brújula:** ya no apunta a la foto más cercana desde cualquier lugar. Solo se activa a ≤ `BG_NEAR` (120 u, en `26-guide-map.js`) con el texto «Algo está cerca…». Para volver al comportamiento anterior pon `BG_NEAR` en `Infinity`.
- **Columna de luz tenue** sobre cada fotografía, visible solo a ~70 m o menos (`25-hidden-photos.js`).
- **Eco del lugar:** cada recuerdo termina con una línea sobre la sensación del sitio (la historia habla de lugares «familiares»: la construcción que da tristeza, el sendero de una tarde, la espera).
- Se pueden encontrar en cualquier orden; si una foto se halla por casualidad, su pista siguiente se desbloquea igual. Las partidas guardadas conservan las fotos ya recogidas (los flags `photo_*` no cambian).

**Guía tras el despertar (v133, `js/28c-chapter2-guide.js`):** al terminar el Capítulo I (cámara + libreta + vista a la isla) aparece una tarjeta no bloqueante de 4 pasos: 1) objetivo (6 fotografías, E para recogerlas), 2) «Pulsa M» (espera a que el jugador abra y cierre el mapa), 3) «Pulsa J» (diario y pistas), 4) controles básicos (WASD, Shift, Espacio, E, P, V, N). Avanza sola por tiempo si el jugador no actúa; **Enter** la omite; en móvil muestra los nombres de los botones. Se guarda en el flag `ch2_intro` y no se repite; las partidas que ya tenían fotos recogidas la saltan. Los textos están en `ch2gSteps()`.

**Mapa remasterizado (v133, `js/26-guide-map.js`):** ya no es una cuadrícula con un óvalo. Se dibuja el terreno real a 800×800 (relieve con sombreado, mar y lago por profundidad, playas, pasto y roca, senderos, construcciones y torres), con **niebla de exploración** (celdas de 20 m, se guarda en `localStorage` → `bois_explored`; radio de descubrimiento 75 m), **nombres de lugares** (Playa del despertar y Torres gemelas siempre; El lago, La cumbre y Parque de los Cisnes al explorarlos), **flecha del jugador con su orientación**, rosa de los vientos, escala de 100 m, leyenda completa y las zonas de pista sobre la niebla. El diario (J) y el panel de controles del menú listan ahora todas las teclas (P, V, N, U, O, H…).

**Césped negro (v133):** las briznas 3D usaban verdes más oscuros que el propio terreno y, con la luz, se veían casi negras. Ahora `b0`/`b1` en `14-grass.js` son verdes más vivos y el material tiene un piso de luz verde (`emissive`) para que nunca queden negras, ni en sombra ni de noche. El pasto del terreno (`02-terrain-material.js`, `cG*1.55`) es más claro y verde. Si lo quieres más/menos brillante: esos tres valores.

**Ajustes rápidos:** posiciones y textos en `data/hidden-photos.js`; radio de la zona en `bgZone()` y distancia de la brújula en `BG_NEAR` (`26-guide-map.js`).

## v132 · césped realista (sin ruido ni puntos)

**Problema:** el pasto se veía con mucho ruido y puntos (arena, roca y demás terrenos estaban bien). Tenía cuatro causas:

1. **Color de vértices con ruido blanco** (`03-terrain-heights.js`): cada vértice (cada ~3,9 m) llevaba un tinte aleatorio → parches triangulares/«granos» grandes en el pasto. Ahora, en pasto/suelo, el tinte es ruido de valor **suave** (escalas ~35 m y ~14 m, misma media). Playa y roca conservan el cálculo anterior.
2. **Shader del pasto** (`02-terrain-material.js`):
   - el «peinado» rotaba las coordenadas por un ángulo variable en el espacio → la frecuencia crecía con la distancia al origen y producía ruido/aliasing lejos del punto de inicio. Ahora mezcla dos orientaciones **fijas** con un campo suave;
   - se eliminaron las **florecillas** (puntos amarillos/blancos) y la mota del `detail` sobre el pasto;
   - el pasto base (`t2`) se muestrea con `tgG`: promedio de dos muestras no correlacionadas (sin la mezcla estocástica que subía el contraste), conserva el color medio pero sin granulado ni repetición visible;
   - variación de tono por **tufos de ~1 m y parches de ~3 m**, y peinado fino de bajo contraste (±11 %) que solo se ve a menos de ~18 m.
3. **Briznas 3D** (`14-grass.js`): la punta era ~5× más clara que el suelo y la base ~3× más oscura → cada brizna brillaba como un punto. Ahora los colores están calibrados al albedo del terreno (base ≈ suelo, punta algo más clara y amarillenta, variación por brizna), y las briznas heredan el **mismo tono macro** del terreno (`gMac` = `tgMac`) para fundirse con él.
4. **Sombras:** las briznas no recibían sombra y brillaban dentro de la sombra de los árboles. Ahora `receiveShadow` (solo escritorio).

**Otros cambios del césped:** tufos más pequeños y numerosos (`GN` 1500 escritorio / 520 móvil, 7 briznas por tufo; antes 1100/380 y 9) → cobertura más pareja, mismo número de triángulos. Altura media algo menor (≈ 0,30–0,72 m base). Briznas un poco más anchas (menos aliasing).

**Ajustes rápidos:** altura de las briznas → `h=` en `14-grass.js`; densidad → `GN`/`NB`; contraste del peinado → `(bl-.5)*.22*gF` en el bloque `// ───── PASTO` del shader; colores de brizna → `b0`/`b1`.

### v132 · auditoría general (rendimiento y errores)

- **Error corregido: el césped 3D no se dibujaba.** `grass()` (14-grass.js) no se llamaba desde `frame()`; solo quedaba el comentario `/* grass static */`. Ahora se llama tras actualizar el frustum, protegido con `try/catch` (avisa una vez en consola).
- **Culling del césped por celda:** de las 25 celdas se dibujan solo las que están dentro del radio de desvanecido y del frustum (≈ la mitad), y no se actualiza en la piscina (`PR.on`).
- **Shader del terreno (GPU):** cada superficie procedural (camino, pasto, suelo, playa, roca) se evalúa solo si su peso en ese píxel es > 0,4 %; antes se calculaban las cinco en todos los píxeles a menos de 100 m. El Voronoi (el bloque más caro) se salta en pasto puro. Mismo aspecto, bastante menos ALU en prados y playas.
- **Antialiasing (MSAA) en escritorio** con más de 4 núcleos (`01-core-renderer.js`): sin él, las briznas finas y las ramas parpadeaban como puntos. En móvil/equipos modestos sigue desactivado.
- **Colisiones a pocos FPS:** el movimiento se divide en subpasos de ≤ 0,25 m (máx. 4). Antes, con `dt` alto (hasta 0,05 s) y sprint, el paso llegaba a 0,45 m y se podían atravesar paredes finas.
- Revisión estática (TypeScript `checkJs`) del bundle: sin variables sin declarar ni usos antes de asignar (los 7 avisos restantes son accesos a `window.*` protegidos).

## v131 · Capítulo I rehecho: «El despertar» (cinematográfico)

Nuevo módulo `js/28b-chapter1-awakening.js` (aislado en try/catch: si fallara, `29-awakening-init.js` vuelve al despertar clásico, que se conserva como `…Legacy`).

**Secuencia (solo en partida nueva, ~45 s, se puede avanzar con clic/Espacio):**
1. **Títulos** sobre negro: epígrafe de la historia («Hay lugares que no recuerdas haber visitado…») y tarjeta *CAPÍTULO I · El despertar*. Clic para omitir.
2. **Despertar a ras de arena** (cámara a 0,27 m, mirando al cielo, ladeada): párpados con borde suave y parpadeos, visión desenfocada que se aclara (filtro sobre el lienzo), sobreexposición cálida del amanecer, viñeta, respiración y pulso de cámara en mano.
3. **Audio de la playa** (sintetizado, sin música, como pide la historia): oleaje irregular, siseo de espuma, viento, **latido** y **respiración** apagados por un filtro que se abre al «abrir los ojos», y gaviotas lejanas. Al terminar queda un oleaje suave que se desvanece con la distancia a la playa (≈240 m).
4. La cámara gira hacia el mar —donde se ven las **huellas** que salen del agua, se vuelven torpes y terminan en un **surco de arrastre** y la **silueta del cuerpo** en la arena—, luego se **incorpora** (sentado → de pie) y mira hacia **algo que brilla**.
5. **Escenografía**: huellas alternadas izquierda/derecha adaptadas al relieve, troncos arrastrados, rocas, algas, ~34 conchas (instanciadas) y arena removida.
6. **Objetos nuevos**: cámara con correa, grieta en el objetivo y destello; libreta de cuero con goma, cinta y lápiz. Ambos con haz de luz, motas flotantes y reflejo en estrella. Aparecen con un pequeño «pop» al final de la escena.
7. **Recoger**: la cámara de juego se inclina a mirar el objeto y este vuela hacia ti; la libreta muestra su **primera página manuscrita** que se escribe letra a letra. El álbum de la cámara ahora **revela** las fotos una a una y las muestra con daños (quemadura, mancha de agua, grieta, desvanecido).
8. **La isla** (se dispara sola al tener cámara y libreta, una vez): panorámica lenta hacia las dos torres con zoom y acorde suave: «No tienes una misión. No sabes qué buscas…».

**Mejoras generales del motor de cinemáticas** (`23-cinematics.js`): viñeta, grano animado, aparición palabra a palabra, `auto:ms` (avance automático), `on:()=>{}` (gancho al mostrar una línea, usado para cámara/audio) y `opts.location` (rótulo de lugar; se restablece al terminar). Los capítulos IV y V no cambian.

**Ajustes rápidos** (todo en `28b-chapter1-awakening.js`): `CH1.SEA_YAW` (dirección del mar desde `BEACH`), tiempos de las tarjetas en `ch1TitleCards`, textos y tiempos `auto` en `ch1Wake()`, posiciones de los objetos en `ch1PlaceItems()`, escenografía en `ch1Dress()`.

**Otros cambios mínimos:** `15-render-frame.js` llama a `ch1Frame()` desde `drawWorld()` (así la cámara y los brillos funcionan también durante las cinemáticas); `11-player-input.js` usa `ch1Begin()` / `ch1Interact()` (con respaldo clásico); las partidas guardadas que ya tenían cámara y libreta no repiten la vista a la isla.

**Nota de pruebas:** la lógica se validó con una simulación por consola (línea de tiempo completa, recogida de objetos, vista final, audio simulado) y con comprobación de sintaxis del bundle; el aspecto visual y el audio real deben revisarse en el navegador.

## v126 · arreglos del modelo 3D de los Poolrooms + luces del Capítulo V

Comprobado con un test automático de normales/orientación de triángulos (antes: 470 caras invertidas; ahora: 0).
- **Fluorescentes y tragaluces:** sus paneles brillantes tenían las caras al revés y no se dibujaban desde abajo (solo se veía la carcasa gris). Ahora brillan, y ya no hacen z-fighting con la carcasa.
- **Arcos:** eran 20 bloques escalonados; ahora tienen intradós curvo continuo (24 tramos, con menos triángulos).
- **Paredes de las salas con agua poco profunda:** no llegaban al suelo (hueco de 0,7 m); ahora bajan hasta el fondo.
- **Pilares** de las salas con agua flotaban 0,9 m; los de las galerías no llegaban al techo. Corregido.
- **Carteles:** colgaban medio en el vano de las puertas; ahora van sobre el tramo macizo de la pared.
- **Escaleras:** eran losas flotantes y atravesables. Ahora son macizas y **transitables** (se sube por los peldaños hasta el descanso o hasta donde acaban) y ya no se cruzan con los pilares centrales.
- **Podio con peldaños:** el suelo "caminable" estaba desplazado respecto al modelo (se podía atravesar el podio y flotar en otro sitio). Ahora coincide.
- **Capítulo V:** las luces azules ahora son un orbe con halo y un **haz de suelo a techo** visible de lejos (sin niebla), y cada ~9 s el juego indica distancia y dirección de la más cercana. Si el Capítulo IV no está completado no aparecen: en la consola del navegador escribe `__boisCh5Unlock()` (y `__boisCh5Reset()` para repetir el capítulo).

## v125 · Capítulo V · Lo que permanece debajo (Poolrooms)

`js/36c-chapter5.js` (aislado en try/catch: si fallara, el juego base sigue). Requiere **capítulo IV completado** y bucear hasta los Poolrooms (bajo el lago).

1. **Llegada:** cinemática de entrada (sin ventanas, relojes ni animales; solo agua, fluorescentes y eco). La misión y la brújula señalan el punto más profundo del lago.
2. **Tres salas extrañas** (luces azules flotantes, **E** para examinar), elegidas según la arquitectura generada: sala vacía, piscina demasiado pequeña, agua que refleja un cielo que no existe.
3. **La mesa:** tras las tres salas aparece un haz de luz cálido. La mesa tiene la fotografía (dibujada por código, sin rostros); se muestra en la cinemática con la frase del papel escolar.
4. **Katherin** aparece detrás: «¿Lo recuerdas?» … «Alguien que no quieres olvidar.» Fin del capítulo; Retroceso para salir.
- Banderas guardadas: `ch5_entered`, `ch5_empty`, `ch5_small`, `ch5_sky`, `ch5_photo`, `ch5_complete`.
- Cambios mínimos en otros módulos: `18-poolrooms.js` expone `PR.geo`; `31-chapter4.js` ya no reacciona dentro de los Poolrooms.
- Ajustes rápidos: textos en el objeto `TXT` y en `table()`/`katherin()`; radio de interacción en `nearPt` (3,2 m).

## v124 · robustez

- `js/36b-hardening.js`: la posición y los ajustes se guardan también al cerrar/ocultar la pestaña (antes hasta 3–5 s de retraso); avisos en pantalla si el navegador pierde/recupera el contexto WebGL.
- El tick del Capítulo IV ya no traga errores en silencio (avisa una vez en consola).

## v123 · terrenos con textura propia y senderos visibles

**Problema:** el sendero usaba la textura gris original (`t1`), muy oscura una vez iluminada y multiplicada por el detalle (≈ 0,06 de albedo): en el juego se leía como una franja casi negra, y suelo/pasto solo se distinguían por el tono.

**Solución** (todo en `js/02-terrain-material.js`, shader del terreno; sin imágenes nuevas, el peso del juego no cambia):

| Superficie | Antes | Ahora |
|---|---|---|
| **Sendero** | gris casi negro | tierra compactada marrón con **guijarros** (y sombra de contacto), **rodadas** paralelas al trazado, centro pisado/claro y bordes sueltos oscuros, hojarasca; el borde con el pasto es irregular |
| **Pasto** | mancha verde | briznas orientadas, macollas, puntas soleadas y **florecillas** amarillas/blancas |
| **Suelo de bosque** | mancha marrón | manto de **hojas** (ocre, óxido, oliva), agujas de pino y piedrecitas |
| **Playa** (h < ~3 m, incluye el punto de inicio) | igual que el suelo | **arena** con ondulaciones, grano y conchas |
| **Roca** (pendiente > ~0,6) | gris liso | estratos, grietas y musgo |

- **Relieve (bump mapping)** con derivadas en pantalla (solo WebGL2): los guijarros, rodadas y hojas reaccionan a la luz del sol.
- Detalle fino solo cerca del jugador (se desvanece entre 9 y 44 m) para evitar parpadeos lejos y ahorrar GPU.
- Respeta la calidad gráfica (`uHQ`): **Baja** = sin guijarros/Voronoi ni bump (solo texturas de ruido); **Media/Alta/Ultra** = detalle completo. En WebGL1 funciona sin bump.
- Brillo global parecido al original (≈ ×1,2 en pasto/suelo).
- Si el shader no compilara, sigue activo el respaldo `terrMatOld` (`32-resume-fallbacks.js`).
- Ajustes rápidos: colores del camino en el bloque `// ───── CAMINO` (variables `e` y `pc`); altura de la playa en `float sw=`; tamaño de guijarros en `rr`.

**Ajuste del pasto (v123b):** se quitó el ruido fino (briznas de alta frecuencia, florecillas diminutas y la mota del detalle) que producía "granito" al caminar. Ahora el pasto usa tufos grandes y suaves con peinado de viento; el detalle cercano se apaga entre 3 y 20 m.

**Pasto peludo (v123c):** `14-grass.js` — matas 3D mucho más densas (1100 por celda de 16 m en escritorio, 380 en móvil; antes 150/100), 9 briznas por mata (antes 6) más altas y variadas, base más oscura y puntas claras. Radio de 2 celdas (~28 m) para compensar el coste. No crece sobre el sendero (usa la máscara `TRAIL_MASK_B64`). Si va pesado: baja `GN`.

**Optimización y revisión (v123d):**
- Auditoría estática de todo el código (TypeScript `checkJs` sobre el bundle): sin variables sin declarar ni usos antes de asignar; los avisos restantes son de tipos (falsos positivos) y los 3 monkey-patches ya documentados.
- **Shader del terreno:** a más de ~100 m se salta el cálculo de las 5 superficies procedurales y se usa el color medio (fundido suave 100–150 m); bajo el agua tampoco se calcula detalle fino. Menos GPU en la zona más grande de la pantalla.
- **Césped:** las celdas nuevas se rellenan como máximo 2 por frame (antes hasta 5 de golpe → tirón al cruzar de celda).
- `worldLife()` ya no traga errores en silencio: avisa una vez en consola.

**Pasos según superficie (v123e):** `07-audio-discovery.js` — crujido seco de grava en el sendero, roce suave en la arena y pisada sorda en pasto/tierra, con ligera variación de tono en cada paso.

## v122 · accesibilidad y pulido

- **Controles táctiles completos**: antes en móvil solo existían Saltar e Interactuar; ahora hay botones para Foto (P), Diario (J), Mapa (M), Álbum (V), Sentarse (F) y Radio (R). Los atajos de J/M escuchan en `document`, por eso los botones despachan el evento ahí.
- **Sensibilidad de cámara en Configuración** (deslizador). Se guarda junto al resto de ajustes y sigue funcionando `[` / `]`.
- Versión unificada en título y menú.
- **Edificio del Capítulo IV rehecho** (`31-chapter4.js`, ~500 piezas fusionadas en ~37 mallas):
  - Se corrigieron fallos del modelo anterior: huecos abiertos en los muros laterales y en el trasero (el ventanal estaba desplazado respecto al muro), una rendija entre muros y techo, y una cartelera flotando en mitad de la sala.
  - Fachadas con relieve: zócalo y base de hormigón, esquinas reforzadas, pilastras, ventanas con marcos, travesaños, alféizares y dinteles, marquesina de entrada con farolas, bajantes y antepecho de azotea.
  - Techo con **tragaluz realmente abierto** (curb, vidrio y barras) y voladizo. El techo proyecta sombra: el interior queda más atmosférico. Si lo prefieres más luminoso, pon `CH4_ROOF_SHADOW=false`.
  - Interior: suelo de baldosas desgastadas, zócalo verde con moldura, vigas, lámparas colgantes, radiadores, casilleros, reloj, escritorio del profesor, sillas con respaldo, estantería contra el muro, cartelera de corcho y puertas de doble hoja abiertas.
  - **Parcela**: ahora la búsqueda penaliza el desnivel de toda la planta (antes solo miraba el centro y el muro oeste quedaba contra una colina). El suelo se eleva sobre un zócalo y, si hace falta, se generan escalones; `ground()` se amplía para poder caminar sobre suelo y peldaños.
  - El punto de interacción de la ventana se movió a `cx+8` para coincidir con el ventanal.

## v121 · correcciones

- **Bug real corregido** (`36-flocks-boats-fish.js`): el material `mL` (luz de los faroles de los veleros) estaba declarado dentro de un bloque `{}` y se usaba fuera; lanzaba `ReferenceError` en cada frame, silenciado por el `try/catch` de `worldLife()`. Efecto: los faroles nunca se encendían y **los peces saltarines y los anillos de agua nunca se actualizaban**. Ahora `mL` se declara en el ámbito correcto.
- Katherin (`30-katherin.js`): modelo estilo anime con toon shading, parpadeo, respiración y mirada al jugador; la animación idle se suspende en pausa, menú y Poolrooms.
- **Ventanas de las casas desactivadas** (`04-buildings.js`, flag `BUILDING_WINDOWS=false`): el shader pintaba ventanas también en edificios que no las tienen. Las torres gemelas no se tocan: usan sus propias texturas de vidrio y luces nocturnas en `20-life-bridge-towers.js`. Cambia el flag a `true` para reactivarlas.
- **Agua del lago renovada** (`09-sky.js`): malla radial densa alrededor del jugador (de 0,5 m cerca a ~100 m lejos, hasta 3,4 km), 6 olas direccionales con crestas picudas en el vértice (olas 3D reales), normales de detalle a 3 escalas, reflejo Fresnel del cielo con los colores reales del cielo del juego, brillo del sol/luna, color por profundidad (textura generada del mapa de alturas: turquesa en la orilla, azul profundo en el centro), transparencia suave y espuma en la orilla, espuma en crestas con tormenta y ondas de gotas de lluvia. Las olas crecen con tormenta/lluvia y se amortiguan en aguas poco profundas. `waterH(x,z)` da la altura de la superficie para anillos y veleros.
- Versión actualizada en título y menú; `dist/BOIS_IO.html` regenerado.

## v120 · auditoría de rendimiento y estabilidad

- Se eliminó una llamada duplicada a `skyStep()` en el bucle principal: el sistema de clima ya actualiza el cielo una vez por frame.
- El cielo, culling de árboles, sombras dinámicas, detección de fotografías y prompt del auto usan frecuencias desacopladas para reducir CPU sin cambiar la jugabilidad perceptible.
- El agua conserva su malla subdividida optimizada (`128 × 128`), sigue al jugador y actualiza offsets/tiempo a una frecuencia estable de ~30 Hz.
- El shader de ondas del agua tiene fallback: si algún marcador de Three.js cambia, el material base del agua sigue funcionando.
- La persistencia de posición evita escribir en `localStorage` cuando la posición no cambió.
- Se eliminaron parches experimentales que no aportaban funcionalidad real al runtime.

## Estructura

```
index.html            markup del juego + <script> en orden
css/assets.css        imagen de fondo del menú (data-URI) como variable --menu-bg-img
css/main.css          todos los estilos
data/                 datos pesados (se cargan primero; son solo `const`)
js/ui/                pestañas, panel de controles, modales del menú
js/NN-nombre.js       código del juego, en orden de ejecución
tools/build.py        compila a un solo HTML
```

## Módulos de código (orden = orden de carga)

| Archivo | Líneas | Contenido |
|---|---|---|
| `01-core-renderer.js` | 36 | Núcleo: helper $, arranque/errores, decodificador, renderer WebGL, modo retro (RT) |
| `02-terrain-material.js` | 89 | Escena, cámara, texturas procedurales y shader del terreno |
| `03-terrain-heights.js` | 53 | Mapa de alturas, hAt(), espuma costera |
| `04-buildings.js` | 43 | Edificios del mapa original y ventanas procedurales |
| `05-collision.js` | 36 | Rejilla de colisión, ground(), blocked() |
| `06-vegetation.js` | 32 | Vegetación: árboles, arbustos, máscara de sendero |
| `07-audio-discovery.js` | 22 | Audio sintetizado, descubrimientos, brújula |
| `08-fauna-journal.js` | 232 | Fauna, criaturas, vida de los Poolrooms, flash de cámara |
| `09-sky.js` | 306 | Cielo por shader, nubes, estrellas, agua |
| `10-lighting-time.js` | 113 | Luz, atmósfera del bosque, ciclo día/noche |
| `11-player-input.js` | 93 | Jugador S, spawn, teclado/ratón/táctil, resize |
| `12-weather.js` | 157 | Clima WX: lluvia, niebla, tormenta, supercélula, otoño |
| `13-park-fireflies-rainbow.js` | 57 | Parque de cisnes, luciérnagas, arcoíris, sonidos de naturaleza |
| `14-grass.js` | 30 | Césped instanciado con viento |
| `15-render-frame.js` | 4 | Render por frame |
| `16-water-life-aurora.js` | 50 | Ondas, bruma sobre el lago y auroras boreales |
| `17-quality.js` | 8 | Variables del bucle y calidad gráfica (QS, setQ) |
| `18-poolrooms.js` | 239 | Poolrooms: escena propia, iluminación, medusas, sonido |
| `20-life-bridge-towers.js` | 69 | Vida ambiental, puente y torres gemelas |
| `21-main-loop-config.js` | 89 | Bucle principal frame(), persistencia de configuración |
| `22-story-state.js` | 7 | Estado de la historia STORY y autoguardado |
| `23-cinematics.js` | 134 | Diálogos cinemáticos y despertar visual |
| `24-camera-album.js` | 34 | Álbum de la cámara (V) |
| `25-hidden-photos.js` | 68 | Fotografías ocultas: colocación, animación, interacción |
| `26-guide-map.js` | 89 | Guía personal: brújula, diario de misión, mapa, modo dev (F3) |
| `27-world-constants.js` | 3 | Constantes del mundo (BEACH) |
| `28-car-radio.js` | 512 | Auto procedural, colisión, HUD y radio |
| `28b-chapter1-awakening.js` | ~400 | Capítulo I cinematográfico (v131) |
| `29-awakening-init.js` | 80 | Fachada del despertar (+ versión clásica de respaldo) e inicio de partida |
| `30-katherin.js` | 197 | Katherin · Capítulo III |
| `31-chapter4.js` | 170 | Capítulo IV · Lo que fuimos |
| `32-resume-fallbacks.js` | 12 | Reanudar posición y respaldo si falla un shader |
| `33-shore-life.js` | 85 | Ribera viva: vegetación acuática |
| `34-lake-postcard.js` | 63 | Postal del Parque de los Cisnes |
| `35-freeze-matrices.js` | 2 | Congelar matrices estáticas (una sola vez) |
| `36-flocks-boats-fish.js` | 44 | Bandadas, veleros y peces saltarines |
| `36e-chapter6.js` | ~300 | Capítulo VI · Las torres (galería propia, escenas, compuertas, escalera) |
| `37-boot.js` | 27 | Filtro VHS (F6), pantalla de arranque y primer frame() |

## Reglas importantes (léelas antes de editar)

1. **El orden de los `<script>` en `index.html` importa.** Todos los archivos comparten el mismo ámbito
   global (`S`, `scene`, `R`, `cam`, `STORY`, `PR`, `WX`, `CAR`…), igual que en el archivo original.
   No cambies el orden ni muevas un `const` a un archivo posterior a donde se usa a nivel superior.
2. Los `const` de `data/` deben cargarse **antes** que el código.
3. Un archivo nuevo = crea `js/NN-nombre.js` y añade su `<script>` en `index.html` en el lugar correcto.
   `build.py` lo recogerá solo.
4. Si una función de un archivo se invoca durante la carga desde otro archivo anterior, fallará en modo
   desarrollo (en un solo script no, por el *hoisting*). Hoy no ocurre: todas las llamadas "hacia adelante"
   están dentro de funciones/handlers que se ejecutan después.

## Qué cambió respecto al v119 (y qué no)

- El código es **idéntico**; de 3.375 líneas solo cambian 3: `TEXD` y `TRAIL_MASK_B64` se movieron a `data/`
  y la función vacía `spLoaded()` se movió a `02-terrain-material.js` junto a su único uso
  (evita una condición de carrera entre la carga de la imagen y la del archivo).
- `CAM_PHOTOS` y `PHOTOS` (con sus JPEG) viven ahora en `data/`.
- La imagen de fondo del menú pasó del CSS a `css/assets.css` como variable CSS.

## Siguiente fase (ES modules reales): por qué no se hizo todavía

Pasar a `import/export` es posible pero es una refactorización, no un corte de archivos. Bloqueos concretos:

- **Reasignación de funciones globales** (monkey-patching) en `31-chapter4.js`: `bgMission=function…`,
  `bgTarget=function…`, `interactKatherin=function…`. Los imports de ES modules son de solo lectura.
- **Estado compartido mutable** usado en casi todos los archivos (`S`, `STORY`, `PR`, `WX`, `CAR`, `CIN`, `tod`, `qi`…).
- **Cierres enormes**: `fauna` (08, ~230 líneas), `PR` Poolrooms (18, ~240), `WX` clima (12, ~160) son IIFE
  con estado interno que otros módulos leen vía `typeof PR!=='undefined'`.
- Muchos flags en `window.__bois*`.
- Los ES modules no cargan desde `file://`; hará falta un servidor local.

Orden sugerido: (1) `config.js` con constantes, (2) `utils.js` (`$`, `hash`, `lin`, `canvasTex`, `merge`),
(3) un `state.js` con `S`, `STORY`, `CIN`…, (4) sustituir los 3 monkey-patches por hooks/eventos,
(5) convertir sistemas hoja (clima, cielo, audio, auto) a módulos uno a uno.


## v143 — pasarela exterior entre las torres
- Se añadió una pasarela aérea acristalada y estructural que conecta visualmente las fachadas interiores de las dos torres.
- La pasarela es arquitectura ambiental: no incorpora puertas, triggers ni interacciones.
- La única entrada narrativa a las torres continúa siendo la puerta del Capítulo VI a nivel del suelo.
- La pasarela no modifica el sistema de colisiones ni la progresión del capítulo.
