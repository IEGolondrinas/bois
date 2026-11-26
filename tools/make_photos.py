#!/usr/bin/env python3
"""Genera las fotografías personales del capítulo II (504x504, sin rostros) y las guarda en tools/photos/.

Uso:  python3 tools/make_photos.py          (requiere Pillow y numpy)
Luego: python3 tools/apply_photos.py        (las incrusta en data/hidden-photos.js)

Escenas: window (el aula desde afuera), horizon (cerros de Montebello), path (camino al colegio),
empty (salón vacío en el descanso), rain (tarde lluviosa con un juego en la pantalla).
Cada escena es una función independiente: edítala o sustitúyela por tu propia foto (504x504 JPEG).
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageFont

W = 504
SS = 2
N = W * SS
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'photos')
os.makedirs(OUT, exist_ok=True)


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    a, b = hexc(c1) if isinstance(c1, str) else c1, hexc(c2) if isinstance(c2, str) else c2
    return tuple(int(lerp(a[i], b[i], t)) for i in range(3))


def vgrad(stops, h=N, w=N):
    ys = np.linspace(0, 1, h)
    cols = [hexc(c) for _, c in stops]
    pos = [p for p, _ in stops]
    arr = np.zeros((h, w, 3))
    for k in range(3):
        arr[:, :, k] = np.interp(ys, pos, [c[k] for c in cols])[:, None]
    return Image.fromarray(arr.astype('uint8'), 'RGB')


def glow(img, xy, r, color, strength=1.0):
    layer = Image.new('RGB', img.size, (0, 0, 0))
    d = ImageDraw.Draw(layer)
    c = tuple(int(v * strength) for v in hexc(color))
    d.ellipse([xy[0] - r, xy[1] - r, xy[0] + r, xy[1] + r], fill=c)
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.55))
    return ImageChops.add(img, layer)


def alpha_poly(img, pts, color, alpha, blur=0):
    layer = Image.new('L', img.size, 0)
    ImageDraw.Draw(layer).polygon(pts, fill=int(255 * alpha))
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    solid = Image.new('RGB', img.size, color if not isinstance(color, str) else hexc(color))
    return Image.composite(solid, img, layer)


def ridge(img, base, amp, color, seed, freq=1.0, mist=None, mist_t=0.0, x_shift=0.0):
    rng = np.random.default_rng(seed)
    ph = rng.uniform(0, 6.28, 4)
    xs = np.arange(0, N + 4, 4)
    ys = []
    for x in xs:
        u = x / N * freq + x_shift
        v = (math.sin(u * 5.1 + ph[0]) * .5 + math.sin(u * 11.3 + ph[1]) * .28 +
             math.sin(u * 23.7 + ph[2]) * .12 + math.sin(u * 47 + ph[3]) * .05)
        ys.append(base - amp * v)
    pts = list(zip(xs, ys)) + [(N, N), (0, N)]
    col = hexc(color) if isinstance(color, str) else color
    if mist:
        col = mix(col, mist, mist_t)
    ImageDraw.Draw(img).polygon(pts, fill=col)
    return img


def finish(img, name, grain=7.0, vign=.5, warm=(1.02, 1.0, .96), soft=1.1, fade=.0):
    img = img.filter(ImageFilter.GaussianBlur(soft))
    img = img.resize((W, W), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32)
    # tono cálido tipo película
    for k in range(3):
        a[:, :, k] *= warm[k]
    # velo (foto envejecida): sube negros
    if fade:
        a = a * (1 - fade) + 255 * fade * .35
    # viñeta
    yy, xx = np.mgrid[0:W, 0:W]
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - W / 2) / (W / 2)) ** 2)
    a *= (1 - vign * np.clip(r - .45, 0, 1) ** 1.6)[:, :, None]
    # grano
    rng = np.random.default_rng(3)
    a += rng.normal(0, grain, (W, W, 1))
    a = np.clip(a, 0, 255).astype('uint8')
    Image.fromarray(a).save(os.path.join(OUT, name + '.jpg'), quality=80, optimize=True)


def grass(img, y0, y1, colors, count, seed, hmin=6, hmax=22, lean=.35):
    rng = np.random.default_rng(seed)
    d = ImageDraw.Draw(img)
    for _ in range(count):
        x = rng.uniform(0, N)
        y = rng.uniform(y0, y1)
        h = rng.uniform(hmin, hmax) * (0.6 + (y - y0) / max(1, (y1 - y0)))
        dx = rng.normal(0, lean) * h
        c = colors[int(rng.integers(len(colors)))]
        d.line([(x, y), (x + dx, y - h)], fill=c, width=2)


def font(size):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


# ---------------------------------------------------------------- 1 · el aula, vista desde afuera
def scene_window():
    img = vgrad([(0, '#0d1a2c'), (.3, '#1f3a54'), (.6, '#5a6f7e'), (1, '#8a8a80')])
    img = glow(img, (N * .5, N * .22), N * .35, '#7a5a40', .35)
    d = ImageDraw.Draw(img)
    # muro del bloque de aulas
    wall_top, wall_bot = int(N * .17), int(N * .82)
    d.rectangle([0, wall_top, N, wall_bot], fill=(34, 38, 42))
    rng = np.random.default_rng(11)
    for _ in range(900):  # textura del muro
        x, y = rng.uniform(0, N), rng.uniform(wall_top, wall_bot)
        v = int(rng.normal(36, 6))
        d.rectangle([x, y, x + rng.uniform(6, 26), y + 2], fill=(v, v + 4, v + 8))
    # alero
    d.polygon([(0, wall_top - 34), (N, wall_top - 34), (N, wall_top + 6), (0, wall_top + 6)], fill=(20, 22, 26))
    d.rectangle([0, wall_top + 6, N, wall_top + 16], fill=(52, 56, 60))
    # base / sobrecimiento
    d.rectangle([0, int(N * .74), N, wall_bot], fill=(58, 60, 58))
    # ventanas
    wins = [(.07, .27), (.37, .57), (.67, .87)]
    wy0, wy1 = int(N * .29), int(N * .60)
    for i, (a, b) in enumerate(wins):
        x0, x1 = int(N * a), int(N * b)
        d.rectangle([x0 - 8, wy0 - 8, x1 + 8, wy1 + 8], fill=(96, 100, 100))  # marco
        if i == 1:  # la que conserva la luz
            for yy in range(wy0, wy1):
                t = (yy - wy0) / (wy1 - wy0)
                d.line([(x0, yy), (x1, yy)], fill=mix('#ffe2a0', '#f09a4a', t))
            # pizarrón, pupitres y sillas al fondo (sin personas)
            d.rectangle([x0 + 10, wy0 + 12, x0 + (x1 - x0) * .62, wy0 + 62], fill=(62, 84, 68))
            for k in range(3):
                bx = x0 + 18 + k * 26
                d.rectangle([bx, wy1 - 52, bx + 18, wy1 - 20], fill=(150, 96, 46))
                d.rectangle([bx - 2, wy1 - 62, bx + 20, wy1 - 52], fill=(120, 74, 34))
            d.rectangle([x0 + (x1 - x0) * .66, wy0 + 20, x1 - 8, wy1 - 6], fill=(214, 124, 70))  # cortina
            for k in range(4):
                cx = x0 + (x1 - x0) * .66 + k * 12
                d.line([(cx, wy0 + 20), (cx - 3, wy1 - 6)], fill=(176, 96, 52), width=3)
        else:
            for yy in range(wy0, wy1):
                t = (yy - wy0) / (wy1 - wy0)
                d.line([(x0, yy), (x1, yy)], fill=mix('#2c4258', '#10202f', t))
            # reflejo tenue
            d.polygon([(x0 + 14, wy1), (x0 + 60, wy0), (x0 + 84, wy0), (x0 + 38, wy1)], fill=(52, 76, 98))
        # parteluz y travesaño
        mx = (x0 + x1) // 2
        d.rectangle([mx - 4, wy0, mx + 4, wy1], fill=(104, 108, 106))
        d.rectangle([x0, (wy0 + wy1) // 2 - 4, x1, (wy0 + wy1) // 2 + 4], fill=(104, 108, 106))
        d.rectangle([x0 - 14, wy1 + 8, x1 + 14, wy1 + 20], fill=(120, 122, 118))  # alféizar
    img = glow(img, (int(N * .47), int((wy0 + wy1) / 2)), N * .26, '#ff9b3a', .85)
    d = ImageDraw.Draw(img)
    # piso y pasto delante
    d.rectangle([0, wall_bot, N, N], fill=(14, 22, 18))
    grass(img, wall_bot, N, [(24, 44, 30), (34, 58, 36), (18, 34, 24)], 1400, 4, 8, 34)
    # arbusto y árbol oscuros en primer plano
    for (cx, cy, r) in [(N * .06, N * .78, 110), (N * .96, N * .80, 130), (N * .85, N * .86, 90)]:
        d.ellipse([cx - r, cy - r * .7, cx + r, cy + r * .7], fill=(10, 18, 14))
    d.polygon([(N * .90, 0), (N * .94, 0), (N * .955, N * .8), (N * .905, N * .8)], fill=(8, 12, 10))
    for (cx, cy, r) in [(N * .93, N * .06, 150), (N * .82, N * .02, 110)]:
        d.ellipse([cx - r, cy - r * .6, cx + r, cy + r * .6], fill=(9, 16, 13))
    # camino de tierra hacia la ventana
    d.polygon([(N * .36, wall_bot), (N * .6, wall_bot), (N * .78, N), (N * .18, N)], fill=(50, 40, 32))
    img = glow(img, (int(N * .48), int(N * .9)), N * .32, '#ff9b3a', .22)
    finish(img, 'window', grain=8, warm=(1.04, 1.0, .93), fade=.03)


# ---------------------------------------------------------------- 2 · los cerros de Montebello
def scene_horizon():
    img = vgrad([(0, '#2c3a73'), (.22, '#6a5d99'), (.42, '#d58a8e'), (.56, '#fbb274'), (.64, '#ffe0a6'), (1, '#ffe0a6')])
    sun = (N * .60, N * .575)
    img = glow(img, sun, N * .30, '#ffb25a', .9)
    img = glow(img, sun, N * .09, '#fff0c8', 1.0)
    d = ImageDraw.Draw(img)
    # nubes alargadas
    rng = np.random.default_rng(5)
    for _ in range(14):
        cx, cy = rng.uniform(0, N), rng.uniform(N * .18, N * .50)
        w, h = rng.uniform(120, 340), rng.uniform(6, 14)
        img = alpha_poly(img, [(cx - w, cy), (cx - w * .3, cy - h), (cx + w * .4, cy - h * .8), (cx + w, cy), (cx + w * .3, cy + h * .7)],
                         (250, 170, 140), .35, blur=5)
    haze = '#f6b98a'
    ridge(img, N * .60, N * .05, '#7d7aa6', 1, 1.0, haze, .35)
    ridge(img, N * .64, N * .06, '#5f6794', 2, 1.1, haze, .25, .3)
    ridge(img, N * .69, N * .07, '#46567f', 3, 1.2, haze, .15, .6)
    # neblina de valle
    img = alpha_poly(img, [(0, N * .66), (N, N * .64), (N, N * .74), (0, N * .76)], (246, 186, 150), .35, blur=18)
    ridge(img, N * .76, N * .06, '#2f4468', 4, 1.3, haze, .05, .9)
    # loma cercana con pasto
    d = ImageDraw.Draw(img)
    pts = [(0, N * .86), (N * .25, N * .80), (N * .5, N * .79), (N * .8, N * .84), (N, N * .92), (N, N), (0, N)]
    d.polygon(pts, fill=(26, 48, 40))
    grass(img, int(N * .80), N, [(40, 74, 52), (58, 96, 62), (24, 46, 36), (92, 120, 70)], 2600, 8, 10, 40)
    img = glow(img, (N * .58, N * .86), N * .35, '#ffb25a', .18)
    d = ImageDraw.Draw(img)
    # cerca de alambre
    post_x = [N * .02, N * .22, N * .45, N * .72, N * .98]
    post_y = [N * .95, N * .90, N * .875, N * .905, N * .97]
    for x, y in zip(post_x, post_y):
        d.line([(x, y), (x, y - N * .13)], fill=(26, 20, 20), width=6)
    for k in (.05, .095):
        d.line([(x, y - N * k) for x, y in zip(post_x, post_y)], fill=(40, 34, 36), width=2)
    # figura (de espaldas, sin rostro)
    fx, fy = N * .34, N * .865
    col = (16, 22, 30)
    d.ellipse([fx - 9, fy - 78, fx + 9, fy - 59], fill=col)
    d.polygon([(fx - 16, fy - 58), (fx + 16, fy - 58), (fx + 19, fy - 18), (fx - 19, fy - 18)], fill=col)
    d.rectangle([fx - 15, fy - 20, fx - 3, fy + 2], fill=col)
    d.rectangle([fx + 3, fy - 20, fx + 15, fy + 2], fill=col)
    # pájaros
    for (bx, by, s) in [(N * .22, N * .30, 12), (N * .27, N * .27, 9), (N * .74, N * .35, 10)]:
        d.arc([bx - s, by - s * .5, bx, by + s * .5], 200, 340, fill=(40, 40, 70), width=3)
        d.arc([bx, by - s * .5, bx + s, by + s * .5], 200, 340, fill=(40, 40, 70), width=3)
    finish(img, 'horizon', grain=7, warm=(1.03, 1.0, .95), fade=.02)


# ---------------------------------------------------------------- 3 · el camino al colegio
def scene_path():
    img = vgrad([(0, '#6f9fb4'), (.3, '#a9c9c6'), (.46, '#e8dcb8'), (1, '#e8dcb8')])
    vp = (N * .5, N * .46)
    img = glow(img, vp, N * .30, '#fff2c8', .45)
    ridge(img, N * .47, N * .05, '#a7bfae', 21, 1.0, '#f4e8c6', .35)
    ridge(img, N * .50, N * .06, '#7fa58b', 22, 1.2, '#f4e8c6', .25, .5)
    img = alpha_poly(img, [(0, N * .44), (N, N * .44), (N, N * .56), (0, N * .56)], (244, 232, 198), .45, blur=16)
    d = ImageDraw.Draw(img)
    # pastizales a ambos lados (suelo)
    d.rectangle([0, N * .5, N, N], fill=(74, 118, 80))
    for yy in range(int(N * .5), N):
        t = (yy - N * .5) / (N * .5)
        d.line([(0, yy), (N, yy)], fill=mix('#9bbf8a', '#2f5a3a', t))
    # camino de tierra en perspectiva
    road = [(vp[0] - 5, vp[1] + 6), (vp[0] + 5, vp[1] + 6), (N * .98, N), (N * .08, N)]
    d.polygon(road, fill=(142, 108, 74))
    img = alpha_poly(img, [(vp[0] - 4, vp[1] + 6), (vp[0] + 4, vp[1] + 6), (N * .72, N), (N * .30, N)], (178, 140, 98), .5, blur=6)
    # huellas de llanta
    for off in (-.10, .10):
        d.polygon([(vp[0] + off * 4, vp[1] + 8), (vp[0] + off * 5, vp[1] + 8), (N * (.5 + off * 2.6) + 14, N), (N * (.5 + off * 2.6) - 14, N)],
                  fill=(112, 84, 58))
    grass(img, int(N * .52), N, [(60, 100, 66), (96, 140, 84), (44, 80, 54)], 2200, 31, 8, 40)
    d = ImageDraw.Draw(img)
    # colegio diminuto al fondo
    sx, sy = vp[0] + 2, vp[1] + 2
    d.rectangle([sx - 20, sy - 10, sx + 20, sy + 4], fill=(240, 232, 214))
    d.polygon([(sx - 23, sy - 10), (sx + 23, sy - 10), (sx + 16, sy - 18), (sx - 16, sy - 18)], fill=(168, 84, 66))
    for k in (-12, -2, 8):
        d.rectangle([sx + k, sy - 6, sx + k + 6, sy], fill=(255, 214, 130))
    # árboles a la derecha
    trees = [(.80, .54, 26), (.90, .60, 50), (.72, .515, 16), (1.0, .72, 100)]
    for (tx, ty, r) in trees:
        cx, cy = N * tx, N * ty
        d.rectangle([cx - r * .12, cy, cx + r * .12, cy + r * 1.6], fill=(52, 38, 30))
        d.ellipse([cx - r, cy - r * 1.2, cx + r, cy + r * .6], fill=(38, 74, 52))
        d.ellipse([cx - r * .7, cy - r * 1.1, cx + r * .5, cy], fill=(58, 98, 64))
    # cerca de postes a la izquierda
    for i in range(1, 9):
        t = (i / 9.0) ** 1.8
        px = lerp(vp[0] - 14, N * .02, t)
        py = lerp(vp[1] + 8, N * .96, t)
        hh = lerp(8, N * .28, t)
        d.line([(px, py), (px, py - hh)], fill=(88, 66, 48), width=int(lerp(2, 9, t)))
    for k in (.30, .62):
        pts = []
        for i in range(1, 9):
            t = (i / 9.0) ** 1.8
            pts.append((lerp(vp[0] - 14, N * .02, t), lerp(vp[1] + 8, N * .96, t) - lerp(8, N * .28, t) * k))
        d.line(pts, fill=(70, 56, 46), width=2)
    img = glow(img, vp, N * .16, '#fff2c8', .18)
    finish(img, 'path', grain=7, warm=(1.02, 1.01, .94), fade=.04)


# ---------------------------------------------------------------- 4 · el salón vacío en el descanso
def scene_empty():
    BX0, BX1, BY0, BY1 = N * .26, N * .74, N * .22, N * .62       # pared del fondo
    FX0, FX1, FY0, FY1 = -N * .45, N * 1.45, -N * .35, N * 1.35    # marco cercano (fuera de cuadro)

    def P(u, v, dd):
        return (lerp(BX0 + u * (BX1 - BX0), FX0 + u * (FX1 - FX0), dd),
                lerp(BY0 + v * (BY1 - BY0), FY0 + v * (FY1 - FY0), dd))

    img = Image.new('RGB', (N, N), (200, 184, 150))
    d = ImageDraw.Draw(img)
    # techo, suelo, paredes
    d.polygon([P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)], fill=(214, 204, 180))
    d.polygon([P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)], fill=(150, 108, 66))
    d.polygon([P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)], fill=(176, 160, 128))
    d.polygon([P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)], fill=(222, 204, 166))
    d.polygon([P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)], fill=(208, 192, 158))
    # tablas del piso
    for k in range(1, 12):
        u = k / 12
        d.line([P(u, 1, 0), P(u, 1, 1)], fill=(128, 90, 54), width=2)
    for k in range(1, 14):
        dd = (k / 14) ** 1.6
        d.line([P(0, 1, dd), P(1, 1, dd)], fill=(132, 94, 58), width=2)
    # pizarrón con la ecuación que faltaba
    bx0, bx1 = P(.22, .20, 0)[0], P(.78, .20, 0)[0]
    by0, by1 = P(.22, .20, 0)[1], P(.22, .62, 0)[1]
    d.rectangle([bx0 - 5, by0 - 5, bx1 + 5, by1 + 5], fill=(94, 66, 40))
    d.rectangle([bx0, by0, bx1, by1], fill=(48, 72, 58))
    f = font(22)
    d.text((bx0 + 14, by0 + 10), 'x = -2', fill=(214, 224, 214), font=f)
    for k in range(3):
        d.line([(bx0 + 14, by0 + 44 + k * 14), (bx0 + 90 + k * 22, by0 + 44 + k * 14)], fill=(150, 170, 156), width=2)
    # ventanas (pared derecha) y haces de luz
    for (v0, v1, a0, a1) in [(.18, .66, .12, .34), (.18, .66, .44, .66), (.18, .66, .76, .94)]:
        quad = [P(1, v0, a0), P(1, v0, a1), P(1, v1, a1), P(1, v1, a0)]
        d.polygon(quad, fill=(255, 244, 214))
        img = glow(img, ((quad[0][0] + quad[2][0]) / 2, (quad[0][1] + quad[2][1]) / 2), N * .12, '#ffe2a8', .6)
        d = ImageDraw.Draw(img)
        mid = (a0 + a1) / 2
        d.line([P(1, v0, mid), P(1, v1, mid)], fill=(120, 96, 70), width=5)
        d.line([P(1, (v0 + v1) / 2, a0), P(1, (v0 + v1) / 2, a1)], fill=(120, 96, 70), width=5)
        d.polygon(quad, outline=(110, 84, 58))
        # haz sobre el piso
        beam = [P(1, 1, a0), P(1, 1, a1), P(.12, 1, min(1.0, a1 + .13)), P(.12, 1, min(1.0, a0 + .13))]
        img = alpha_poly(img, beam, (255, 226, 168), .42, blur=5)
        d = ImageDraw.Draw(img)
    # pupitres (de atrás hacia adelante)
    def desk(u, dd, bag=False):
        top = [P(u - .075, .70, dd), P(u + .075, .70, dd), P(u + .075, .70, dd + .06), P(u - .075, .70, dd + .06)]
        for lu in (u - .07, u + .07):
            for ld in (dd + .005, dd + .055):
                d.line([P(lu, .70, ld), P(lu, 1.0, ld)], fill=(60, 56, 54), width=3)
        d.polygon(top, fill=(186, 134, 78))
        d.line([top[2], top[3]], fill=(120, 80, 44), width=3)
        # silla delante (hacia el espectador)
        sd = dd + .12
        d.polygon([P(u - .06, .84, sd), P(u + .06, .84, sd), P(u + .06, .84, sd + .05), P(u - .06, .84, sd + .05)], fill=(140, 98, 58))
        d.polygon([P(u - .06, .70, sd + .05), P(u + .06, .70, sd + .05), P(u + .06, .84, sd + .05), P(u - .06, .84, sd + .05)], fill=(120, 82, 48))
        for lu in (u - .055, u + .055):
            d.line([P(lu, .84, sd + .04), P(lu, 1.0, sd + .04)], fill=(60, 56, 54), width=3)
        if bag:
            bag_pts = [P(u - .05, .66, sd + .055), P(u + .05, .66, sd + .055), P(u + .05, .80, sd + .055), P(u - .05, .80, sd + .055)]
            d.polygon(bag_pts, fill=(66, 92, 140))
            d.rectangle([bag_pts[0][0] + 6, bag_pts[0][1] + 8, bag_pts[1][0] - 6, bag_pts[0][1] + 18], fill=(48, 70, 112))

    for dd in (.10, .26, .44, .62):
        for u in (.18, .36, .54, .72, .88):
            if dd == .44 and u == .54:
                continue
            desk(u, dd)
    # el pupitre del medio, con mochila (alguien salió al descanso)
    desk(.54, .44, bag=True)
    # polvo en la luz
    rng = np.random.default_rng(9)
    for _ in range(160):
        x, y = rng.uniform(N * .5, N * .98), rng.uniform(N * .2, N * .92)
        r = rng.uniform(1.2, 2.6)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 238, 200))
    finish(img, 'empty', grain=6, warm=(1.04, 1.01, .94), fade=.02, soft=1.3)


# ---------------------------------------------------------------- 5 · tarde lluviosa con un juego de saltos
def scene_rain():
    img = vgrad([(0, '#aeb9b6'), (.45, '#8c9b94'), (1, '#4d5a52')])
    rng = np.random.default_rng(14)
    d = ImageDraw.Draw(img)
    # árboles desenfocados detrás del cristal
    for _ in range(28):
        cx, cy, r = rng.uniform(0, N), rng.uniform(N * .30, N * .72), rng.uniform(40, 110)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(int(rng.uniform(70, 96)), int(rng.uniform(104, 128)), int(rng.uniform(86, 104))))
    img = img.filter(ImageFilter.GaussianBlur(26))
    d = ImageDraw.Draw(img)
    # gotas en el cristal
    for _ in range(320):
        x, y = rng.uniform(0, N), rng.uniform(0, N * .86)
        r = rng.uniform(3, 8)
        d.ellipse([x - r * .8, y - r * 1.2, x + r * .8, y + r * 1.2], fill=(196, 208, 206))
        d.ellipse([x - r * .35, y - r * .8, x + r * .15, y - r * .2], fill=(244, 248, 246))
        if rng.random() < .25:
            d.line([(x, y + r), (x + rng.normal(0, 2), y + r + rng.uniform(20, 70))], fill=(170, 184, 182), width=2)
    # marco de la ventana a la derecha
    d.rectangle([N * .92, 0, N, N], fill=(54, 42, 34))
    # escritorio
    d.rectangle([0, N * .83, N, N], fill=(110, 76, 44))
    for k in range(10):
        yy = N * .83 + k * 22
        d.line([(0, yy), (N, yy + rng.uniform(-3, 3))], fill=(94, 64, 38), width=2)
    # computador portátil: pantalla
    sx0, sy0, sx1, sy1 = N * .14, N * .13, N * .86, N * .74
    d.rounded_rectangle([sx0 - 16, sy0 - 16, sx1 + 16, sy1 + 16], radius=18, fill=(20, 22, 26))
    # contenido: carrera de saltos (cubo + picos), dibujado propio
    scr = vgrad([(0, '#3b2bb8'), (.6, '#8a37d6'), (1, '#c14fc9')], int(sy1 - sy0), int(sx1 - sx0))
    sd = ImageDraw.Draw(scr)
    sw, sh = scr.size
    for _ in range(26):
        x, y, s = rng.uniform(0, sw), rng.uniform(0, sh * .68), rng.uniform(24, 70)
        sd.rectangle([x, y, x + s, y + s], outline=(150, 110, 235), width=2)
    gy = int(sh * .74)
    sd.rectangle([0, gy, sw, sh], fill=(18, 14, 70))
    sd.line([(0, gy), (sw, gy)], fill=(120, 230, 255), width=5)
    for k in range(0, sw, 70):
        sd.rectangle([k, gy + 22, k + 34, gy + 56], outline=(60, 50, 150), width=2)
    for sx in (sw * .50, sw * .535, sw * .78):
        sd.polygon([(sx - 22, gy), (sx, gy - 52), (sx + 22, gy)], fill=(8, 8, 24), outline=(200, 240, 255))
    cx, cy = sw * .30, gy - 112   # cubo en pleno salto
    for k in range(1, 7):
        tx, ty, ts = cx - 40 - k * 24, cy + k * 5, max(6, 22 - k * 3)
        sd.rectangle([tx - ts, ty - ts, tx + ts, ty + ts], fill=(255, 227 - k * 12, 74))
    sd.rectangle([cx - 28, cy - 28, cx + 28, cy + 28], fill=(255, 227, 74), outline=(10, 10, 20), width=5)
    sd.rectangle([cx - 15, cy - 10, cx - 5, cy + 2], fill=(10, 10, 20))
    sd.rectangle([cx + 5, cy - 10, cx + 15, cy + 2], fill=(10, 10, 20))
    sd.rectangle([cx - 12, cy + 12, cx + 12, cy + 18], fill=(10, 10, 20))
    # control de volumen casi en silencio (esquina inferior izquierda)
    vx, vy = 26, sh - 40
    sd.polygon([(vx, vy - 6), (vx + 10, vy - 6), (vx + 22, vy - 16), (vx + 22, vy + 16), (vx + 10, vy + 6), (vx, vy + 6)], fill=(235, 235, 245))
    sd.rectangle([vx + 40, vy - 3, vx + 160, vy + 3], fill=(90, 80, 150))
    sd.rectangle([vx + 40, vy - 3, vx + 50, vy + 3], fill=(235, 235, 245))
    sd.ellipse([vx + 44, vy - 8, vx + 60, vy + 8], fill=(255, 255, 255))
    img.paste(scr, (int(sx0), int(sy0)))
    d = ImageDraw.Draw(img)
    img = glow(img, (N * .5, N * .45), N * .55, '#6a3ed0', .22)
    d = ImageDraw.Draw(img)
    # base del portátil
    d.polygon([(sx0 - 40, sy1 + 16), (sx1 + 40, sy1 + 16), (sx1 + 70, N * .90), (sx0 - 70, N * .90)], fill=(52, 54, 60))
    d.rectangle([N * .43, sy1 + 22, N * .57, sy1 + 30], fill=(36, 38, 42))
    # taza con vapor
    d.rectangle([N * .02, N * .80, N * .09, N * .88], fill=(220, 214, 200))
    img = alpha_poly(img, [(N * .035, N * .79), (N * .055, N * .79), (N * .06, N * .66), (N * .03, N * .66)], (235, 235, 235), .25, blur=8)
    finish(img, 'rain', grain=7, warm=(1.0, 1.0, 1.0), fade=.03, soft=.9)


if __name__ == '__main__':
    only = sys.argv[1:]
    for name, fn in [('window', scene_window), ('horizon', scene_horizon), ('path', scene_path), ('empty', scene_empty), ('rain', scene_rain)]:
        if only and name not in only:
            continue
        fn()
        p = os.path.join(OUT, name + '.jpg')
        print(name, os.path.getsize(p) // 1024, 'KB')
