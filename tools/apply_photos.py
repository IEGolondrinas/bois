#!/usr/bin/env python3
"""Incrusta tools/photos/*.jpg en data/hidden-photos.js y actualiza títulos, pistas y recuerdos.
Conserva id, posición (x,z,zx,zz) y zona de cada foto, así que las partidas guardadas (flags photo_*) siguen igual.
Uso: python3 tools/apply_photos.py   (después: python3 tools/build.py)"""
import base64, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PH = os.path.join(ROOT, 'tools', 'photos')
FILE = os.path.join(ROOT, 'data', 'hidden-photos.js')

NEW = {
 'window': dict(title='La ventana del aula',
   clue='No muy lejos de la playa donde despertaste, hacia el oeste, un camino de tierra termina frente a un bloque de aulas viejas. Una de sus ventanas conserva la luz.',
   mem=['Un aula vista desde afuera, ya entrada la noche.', 'Recuerdas la calidez de saber que alguien estaba dentro.', 'Desde aquí se ve la luz, no a quien la dejó encendida.', 'Al final del camino, una construcción te produce una tristeza que no sabes explicar.']),
 'horizon': dict(title='Los cerros',
   clue='Baja hacia la costa del este. Hay una loma donde el horizonte parece no terminar, y alguien mira hacia allá.',
   mem=['Alguien de pie en una loma, mirando los cerros.', 'Recuerdas el aire fresco y la calma de un lugar donde creciste.', 'Esperabas. Sin saber exactamente qué.', 'El viento viene del mar. Sientes que ya habías esperado aquí, mirando lo mismo.']),
 'path': dict(title='El camino al colegio',
   clue='En el sur, un sendero largo avanza hasta el borde de la isla. Parece no terminar, pero termina. Al fondo hay un techo rojo muy pequeño.',
   mem=['Un camino de tierra y, al fondo, un techo rojo muy pequeño.', 'Recuerdas haberlo caminado muchas mañanas sin pensar en nada.', 'Cada paso te acercaba a un lugar donde eras otro.', 'Este sendero te recuerda una tarde que no logras identificar.']),
 'empty': dict(title='El perro y el trapo rojo',
   clue='En el suroeste, cerca de las aulas y de un patio con árboles, una fotografía guarda una escena que no quieres dejar desaparecer.',
   mem=['Katherin jugando con un perrito que lleva un trapo rojo.', 'Está saltando, completamente juguetona, mientras el perro corre frente a ella.', 'Hay una alegría sencilla en esa escena que no quieres olvidar.', 'Esta fotografía la vas a archivar para siempre.']),
 'rain': dict(title='Tarde lluviosa',
   clue='En el noroeste, lejos del lago, entre colinas y muros viejos, siempre parece que va a llover. Algo brilla como una pantalla encendida.',
   mem=['Lluvia contra el cristal y un juego que no dejaba de saltar.', 'Bajaste el volumen casi a cero para que nadie lo notara.', 'Recuerdas haber deseado que ese momento no terminara.', 'Huele a lluvia, aunque el cielo esté despejado.']),
}

src = open(FILE, encoding='utf-8').read()
J = lambda s: json.dumps(s, ensure_ascii=False)
for pid, n in NEW.items():
    jpg = os.path.join(PH, pid + '.jpg')
    b64 = base64.b64encode(open(jpg, 'rb').read()).decode()
    pat = re.compile(r"(\{id:'%s',x:[^,]+,z:[^,]+,zx:[^,]+,zz:[^,]+,)title:(?:'[^']*'|\"[^\"]*\"),(zone:\"[^\"]*\",)clue:\"[^\"]*\",img:'[^']*',mem:\[.*?\]\}" % pid, re.S)
    m = pat.search(src)
    if not m:
        raise SystemExit('no encontré la foto ' + pid)
    rep = m.group(1) + 'title:' + J(n['title']) + ',' + m.group(2) + 'clue:' + J(n['clue']) + ",img:'data:image/jpeg;base64," + b64 + "',mem:" + J(n['mem']) + '}'
    src = src[:m.start()] + rep + src[m.end():]
open(FILE, 'w', encoding='utf-8').write(src)
print('OK:', ', '.join(NEW), '→', FILE, round(os.path.getsize(FILE) / 1024), 'KB')
