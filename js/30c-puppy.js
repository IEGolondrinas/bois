/* BOIS.IO · 30c-puppy.js — El cachorro de pañoleta roja · Capítulo III Remastered
   Un perrito con pañoleta roja juega y descansa cerca de Katherin. Si te quedas quieto mirándolo desde
   lejos (PU_WATCH s), la cámara guarda una fotografía especial, intacta, en el álbum (V). */
const PU_WATCH = 7.5, PU_DIST = [4, 38];
const PU_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f7fb0"/><stop offset=".55" stop-color="#f3b48a"/><stop offset="1" stop-color="#ffd9a8"/></linearGradient><linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9a97f"/><stop offset="1" stop-color="#5d6f94"/></linearGradient></defs><rect width="400" height="300" fill="url(#s)"/><circle cx="300" cy="150" r="26" fill="#fff0c9" opacity=".85"/><rect y="150" width="400" height="70" fill="url(#l)"/><path d="M0 220Q120 205 240 222T400 214V300H0Z" fill="#46583d"/><path d="M0 240Q150 228 400 244V300H0Z" fill="#364a31"/><g fill="#2a2430"><circle cx="128" cy="200" r="15"/><path d="M110 258Q108 212 128 212Q150 214 152 258Z"/><path d="M112 224Q150 236 168 252L162 258Q140 246 112 238Z"/><path d="M112 190Q112 170 130 170Q148 170 146 192Q132 182 112 190Z"/></g><g fill="#c89b66"><ellipse cx="236" cy="248" rx="26" ry="14"/><circle cx="212" cy="236" r="12"/><ellipse cx="204" cy="226" rx="5" ry="10" fill="#8f6a3f" transform="rotate(-20 204 226)"/><path d="M214 242L228 246L218 258Z" fill="#c83737"/><rect x="218" y="256" width="6" height="14"/><rect x="246" y="256" width="6" height="14"/><path d="M258 240Q276 224 272 214L266 216Q268 226 254 238Z"/></g><circle cx="207" cy="234" r="1.8" fill="#222"/></svg>';
const PU_PHOTO = {
  kind: 'hecho',
  kindLabel: 'PRESENCIA · RECUERDO DIRECTO',
  title: 'El cachorro y la pañoleta roja',
  desc: 'Archivo guardado. No pasó nada extraordinario: solo miraste sin buscar un significado escondido.',
  damage: 'Intacta. «Esta es una escena que debo archivar para siempre.»',
  layers: {
    stamp: 'PRESENCIA · 29 / 10 / 2025',
    fact: 'El cachorro de pañoleta roja corre frente a ti junto al lago.',
    thought2025: 'Solo intuiste que querías guardar ese momento.',
    insight2026: 'Por unos segundos no pensaste en nada. Solo miraste.'
  },
  img: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PU_SVG)
};

const puEsc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function puRenderAlbum() {
  if (!STORY.flags.photo_puppy || CAM_PHOTOS.includes(PU_PHOTO)) return;
  CAM_PHOTOS.push(PU_PHOTO);
  if (typeof window.__boisRefreshAlbum === 'function') {
    window.__boisRefreshAlbum();
  } else if (typeof camAlbum !== 'undefined' && camAlbum) {
    const grid = camAlbum.querySelector('.cam-grid');
    if (grid) {
      grid.innerHTML = CAM_PHOTOS.map((p, i) =>
        '<article class="cam-photo"><img loading="lazy" src="' + puEsc(p.img) + '" alt="Fotografía: ' + puEsc(p.title) + '"><h3>' + (i + 1) + '. ' + puEsc(p.title) + '</h3><p>' + puEsc(p.desc) + '</p><small>' + puEsc(p.damage) + '</small></article>'
      ).join('');
    }
  }
}

function puCreateRig(opts) {
  const o = opts || {};
  const m = (c, r = 0.88) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const fur = m(o.furColor != null ? o.furColor : 0xc89b66);
  const cream = m(o.creamColor != null ? o.creamColor : 0xf0dfc4);
  const dk = m(o.dkColor != null ? o.dkColor : 0x7d5935);
  const nose = m(0x1c1517, 0.25);
  const cloth = m(o.collarColor != null ? o.collarColor : 0xc83737, 0.78);
  const g = new THREE.Group(), S1 = new THREE.SphereGeometry(1, 10, 8);
  const part = (mt, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, parent = g) => {
    const mesh = new THREE.Mesh(S1, mt);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    parent.add(mesh);
    return mesh;
  };

  // Sombra suave de contacto en el suelo
  const sh = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 16),
    new THREE.MeshBasicMaterial({ color: 0x0b120e, transparent: true, opacity: o.shadowOpacity != null ? o.shadowOpacity : 0.28, depthWrite: false })
  );
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.02;
  g.add(sh);

  // Cuerpo y pecho crema
  part(fur, 0, 0.26, 0, 0.145, 0.125, 0.23);
  part(cream, 0, 0.24, 0.14, 0.105, 0.095, 0.105);

  // Cabeza animada para girar hacia Katherin o el jugador
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.36, 0.22);
  g.add(headPivot);
  part(fur, 0, 0, 0, 0.105, 0.10, 0.105, 0, 0, 0, headPivot);
  part(cream, 0, -0.025, 0.085, 0.055, 0.042, 0.055, 0, 0, 0, headPivot);
  part(nose, 0, -0.005, 0.132, 0.017, 0.014, 0.016, 0, 0, 0, headPivot);
  for (const s of [-1, 1]) {
    part(nose, s * 0.045, 0.028, 0.088, 0.013, 0.015, 0.012, 0, 0, 0, headPivot);
    part(dk, s * 0.082, 0.015, -0.01, 0.028, 0.072, 0.042, 0.1, 0, s * 0.18, headPivot);
  }

  // Pañoleta roja y nudo
  part(cloth, 0, 0.30, 0.16, 0.112, 0.048, 0.082, 0.2, 0, 0);
  part(cloth, 0, 0.23, 0.22, 0.058, 0.072, 0.024, -0.15, 0, 0);

  // Cola en pivote para que menee de lado a lado con naturalidad
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.32, -0.21);
  g.add(tailPivot);
  part(fur, 0, 0.05, -0.06, 0.028, 0.028, 0.095, 0.65, 0, 0, tailPivot);

  const legs = [];
  for (const [x, z] of [[-0.072, 0.14], [0.072, 0.14], [-0.072, -0.14], [0.072, -0.14]]) {
    const l = part(dk, x, 0.095, z, 0.034, 0.095, 0.034);
    l.userData.dyn = true;
    legs.push(l);
  }
  if (o.scale && o.scale !== 1) g.scale.setScalar(o.scale);
  g.userData = { headPivot, tailPivot, legs, sh };
  return g;
}
window.__boisCreatePuppyRig = puCreateRig;

function puBuildDog() {
  const k = window.__katherin;
  if (!k || window.__puppy) return;
  const g = puCreateRig();

  // Centro de juego: el lado de la banca con el terreno más parejo (evita el agua)
  const b = k.userData.bench;
  let best = null;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, cx = k.position.x + Math.cos(a) * 2.6, cz = k.position.z + Math.sin(a) * 2.6;
    let v = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) v += Math.abs(hAt(cx + dx, cz + dz) - b.h);
    if (!best || v < best.v) best = { v, cx, cz };
  }
  g.userData.c = best;
  scene.add(g);
  window.__puppy = g;
}

function puFlash() {
  try {
    if (typeof ch1SfxShutter === 'function') ch1SfxShutter();
    else if (typeof auHit === 'function') auHit(3200, 0.05, 0.07, 'highpass');
  } catch (_) {}
  const f = document.createElement('div');
  f.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:.9;z-index:40;pointer-events:none;transition:opacity 1.2s';
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => (f.style.opacity = '0')));
  setTimeout(() => f.remove(), 1500);
}

const _puLookVec = new THREE.Vector3();
let puAcc = 0, puLX = 0, puLZ = 0, puMsg = false, puLastNow = 0;

function puTick() {
  const k = window.__katherin;
  if (!k) return;
  if (!window.__puppy) puBuildDog();
  const d = window.__puppy;
  if (!d) return;

  const inOther = (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || (typeof CAR !== 'undefined' && CAR.on);
  const distFromPlayer = typeof S !== 'undefined' && S ? Math.hypot(S.x - k.position.x, S.z - k.position.z) : 0;
  d.visible = !!k.visible && !inOther && distFromPlayer < 52;
  if (!d.visible) {
    puAcc = 0;
    puLastNow = 0;
    return;
  }

  const nowMs = performance.now();
  const dt = puLastNow ? Math.min(0.4, Math.max(0.02, (nowMs - puLastNow) / 1000)) : 0.2;
  puLastNow = nowMs;
  const t = nowMs / 1000, c = d.userData.c;

  // Alterna trote juguetón alrededor de Katherin con pequeñas pausas para mirar y mover la cola
  const cycle = t % 11;
  const isResting = cycle > 8.2;
  const moveT = isResting ? Math.floor(t / 11) * 8.2 + 8.2 : Math.floor(t / 11) * 8.2 + cycle;
  const a = moveT * 0.72;
  const x = c.cx + Math.cos(a) * 1.18, z = c.cz + Math.sin(a * 1.3) * 0.96;
  const gy = hAt(x, z);

  if (isResting) {
    d.position.set(x, gy, z);
    // Mira hacia el jugador si está cerca, o hacia Katherin
    const targetX = distFromPlayer < 6 ? S.x : k.position.x;
    const targetZ = distFromPlayer < 6 ? S.z : k.position.z;
    d.rotation.y = Math.atan2(targetX - x, targetZ - z);
    d.userData.tailPivot.rotation.y = Math.sin(t * 16) * 0.52;
    d.userData.headPivot.rotation.z = Math.sin(t * 2.2) * 0.14;
    d.userData.legs.forEach((l) => (l.position.y = 0.095));
  } else {
    const bob = Math.sin(t * 14);
    d.position.set(x, gy + Math.abs(bob) * 0.025, z);
    d.rotation.y = Math.atan2(-Math.sin(a) * 0.72 * 1.18, Math.cos(a * 1.3) * 1.3 * 0.72 * 0.96);
    d.userData.tailPivot.rotation.y = Math.sin(t * 18) * 0.4;
    d.userData.headPivot.rotation.z = 0;
    d.userData.legs.forEach((l, i) => (l.position.y = 0.095 + (i % 2 ? bob : -bob) * 0.025));
  }

  // --- Cápsula de presencia (solo quedarte quieto mirando sin prisa) ---
  const F = STORY.flags;
  if (F.photo_puppy || !F.gotCam || !(F.glasses || F.metKatherin) || !S.on || CIN.on || window.__boisSitting || Math.abs(S.y - k.position.y) >= 12) {
    puAcc = 0;
    return;
  }

  const moved = Math.hypot(S.x - puLX, S.z - puLZ) > 0.12;
  puLX = S.x;
  puLZ = S.z;

  // Comprueba que la cámara mire hacia el cachorro o la banca
  let lookingAtPuppy = true;
  if (typeof cam !== 'undefined' && cam && cam.getWorldDirection) {
    cam.getWorldDirection(_puLookVec);
    const toDx = d.position.x - S.x, toDz = d.position.z - S.z;
    const len = Math.hypot(toDx, toDz) || 1;
    const dot = (_puLookVec.x * toDx + _puLookVec.z * toDz) / len;
    lookingAtPuppy = dot > 0.52;
  }

  if (distFromPlayer < PU_DIST[0] || distFromPlayer > PU_DIST[1] || moved || !lookingAtPuppy) {
    puAcc = 0;
    puMsg = false;
    return;
  }

  puAcc += dt;
  if (puAcc > 2.4 && !puMsg) {
    puMsg = true;
    showMsg('Te quedas quieto unos segundos, mirando sin pensar en nada…');
  }
  if (puAcc >= PU_WATCH) {
    puAcc = 0;
    puMsg = false;
    storyFlag('photo_puppy', 1);
    puFlash();
    const lookAt = new THREE.Vector3(d.position.x, d.position.y + 0.35, d.position.z);
    window.__boisRevealPhoto = { title: PU_PHOTO.title, img: PU_PHOTO.img, kind: PU_PHOTO.kind, kindLabel: PU_PHOTO.kindLabel };
    playCinematic([
      { pause: 1400 },
      { layer: 'presencia', stamp: '29 / 10 / 2025', t: 'No pasó nada extraordinario.' },
      { pause: 2400 },
      { t: 'El cachorro de pañoleta roja corre un momento frente a ti.' },
      { pause: 2600 },
      { layer: 'presencia', t: 'Solo miraste.' },
      { pause: 2200 },
      { label: 'ARCHIVO GUARDADO', t: '«Esta es una escena que debo archivar para siempre.»' },
      { pause: 2000 }
    ], () => {
      puRenderAlbum();
      showMsg('Archivo guardado en tu álbum · V para volver a verlo');
    }, { lookAt, location: 'PRESENCIA · ARCHIVO GUARDADO' });
  }
}

function __puppyTick() {
  try {
    if (document.hidden) return;
    puTick();
  } catch (e) {
    if (typeof __bw === 'function') __bw('30c-puppy#1', e);
  }
}
window.__boisPuppyTick = __puppyTick;
try {
  puRenderAlbum();
  if (!window.__boisMainLoopUnified) setInterval(__puppyTick, 200);
} catch (e) {
  console.warn('Perrito:', e);
}
