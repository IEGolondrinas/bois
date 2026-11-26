/* BOIS.IO · 31-chapter4.js — Capítulo IV Remastered · El edificio de los salones («Lo que fuimos»)
   Remasterizado y optimizado: eliminación de fugas de geometría tras la fusión estática, bounding spheres,
   colisiones completas (estantería, casilleros, columnas), iluminación interior cálida y haces del tragaluz/ventanal,
   detalles narrativos visibles para los 4 fragmentos opcionales, casillero entreabierto con bufanda y libreta,
   foley de tiza/papel/atmósfera de salón, y brújula/misión guiada paso a paso hacia el Capítulo V. */

const CH4_FRAGMENTS = [
  {
    id: 'shelf',
    name: 'Cátedra de Paz · Cinco palabras',
    loc: [-10, -9.2],
    r: 2.9,
    lines: [
      { layer: 'hecho', stamp: '29 / 10 / 2025 · CÁTEDRA DE PAZ', t: 'Actividad «Sé algo bueno de ti». Dieciocho estudiantes en dos grupos; te cambiaste para equilibrar nueve y nueve.' },
      { layer: 'hecho', t: 'Sobre ti escribiste: «bueno para las matemáticas, muy analítico, hiper-empático».' },
      { layer: 'hecho', t: 'Y Katherin escribió en tu hoja: «Lo mejor de ti es que eres muy inteligente, linda persona, reservado, amable y enfocado».' },
      { layer: 'pensaste', t: 'Sudor frío, piernas temblando. «Esto es bonito, pero me abruma.»' },
      { layer: 'hoy', t: 'Quizás las personas también te veían por quién eras, no solo por lo que sabías calcular.' }
    ]
  },
  {
    id: 'board',
    name: 'Cartelera · 382 en el ICFES',
    loc: [11.7, 10.0],
    r: 2.9,
    lines: [
      { layer: 'hecho', stamp: '10 / 08 / 2025 · Y DESPUÉS', t: 'Al llegar al ensayo con las chicas de Golondrinas, la mamá de Sara te abrazó y te felicitó por tus 382 en el ICFES.' },
      { layer: 'pensaste', t: 'Sentías que solo valías si alcanzabas un logro o resolvías lo que otros no podían.' },
      { layer: 'hoy', t: 'El 382 fue real, pero tu valor no empezaba ni terminaba en una nota.' }
    ]
  },
  {
    id: 'pc',
    name: 'La mezcla y el audio para «Toro»',
    loc: [9, -1],
    r: 3.1,
    lines: [
      { layer: 'hecho', stamp: '01 / 11 / 2025 · 10:41 A. M.', t: 'Secaste tu portátil, terminaste la mezcla del baile a las 10:41, se la enviaste a Valeria y prestaste tu computador.' },
      { layer: 'hecho', t: 'Más tarde llegó un audio del grupo agradeciendo a «Toro» por ayudar.' },
      { layer: 'pensaste', t: 'Esa misma noche te rompiste dudando de si de verdad encajabas.' },
      { layer: 'hoy', t: 'No solo mirabas desde lejos: ibas, ayudabas al grupo y te quedabas.' }
    ]
  },
  {
    id: 'lockers',
    name: 'El espejo medio abierto',
    loc: [-11.5, 9.6],
    r: 2.9,
    lines: [
      { layer: 'hecho', stamp: '29 / 10 / 2025 · 15:43 – 16:12', t: 'Con los suecos puestos, tocando un pedacito de piel del dedo mientras sonaba vallenato afuera.' },
      { layer: 'hecho', t: 'Miraste un espejo medio abierto y el reloj —3:43, 3:48, 3:51— hasta que Sara escribió a las 4:12: «Ya puedes subir».' },
      { layer: 'pensaste', t: 'Esperar en silencio cansaba como si estuvieras rindiendo otro examen.' },
      { layer: 'hoy', t: 'No estabas haciendo nada mal. Solo estabas esperando que empezara la tarde.' }
    ]
  }
];

function ch4FragmentNear(flags, lx, lz, pad = 0) {
  for (const f of CH4_FRAGMENTS) {
    if (flags['ch4_f_' + f.id]) continue;
    if (Math.hypot(lx - f.loc[0], lz - f.loc[1]) < f.r + pad) return f;
  }
  return null;
}

function ch4FragmentCount(flags) {
  let n = 0;
  for (const f of CH4_FRAGMENTS) if (flags['ch4_f_' + f.id]) n++;
  return n;
}

try {
  (() => {
    if (window.__boisChapter4Building) return;

    const isTouch = typeof touch !== 'undefined' && !!touch;
    const chapter4 = {
      group: new THREE.Group(),
      spot: null,
      base: 0,
      entered: !!STORY.flags.ch4_entered,
      near: '',
      collisionAdded: false,
      glints: [],
      chalkDrop: null
    };
    const dist = (x, z) => Math.hypot(S.x - x, S.z - z);

    // 1) Buscar una zona llana, seca y apartada de las construcciones existentes.
    let best = null;
    let bestScore = Infinity;
    for (let x = -280; x <= 280; x += 8) {
      for (let z = -280; z <= 280; z += 8) {
        const h = hAt(x, z);
        if (h < 2.8 || h > 14 || (window.__inLake && window.__inLake(x, z)) || arNB(x, z)) continue;
        const slope = Math.hypot(hAt(x + 3, z) - hAt(x - 3, z), hAt(x, z + 3) - hAt(x, z - 3)) / 6;
        if (slope > 0.075) continue;
        let rMin = 1e9, rMax = -1e9;
        for (let dx = -15; dx <= 15; dx += 3) {
          for (let dz = -13; dz <= 13; dz += 3) {
            const v = hAt(x + dx, z + dz);
            if (v < rMin) rMin = v;
            if (v > rMax) rMax = v;
          }
        }
        const relief = rMax - rMin;
        if (relief > 0.9) continue;
        if (arSpots.some((q) => Math.hypot(q.x - x, q.z - z) < 48)) continue;
        if (Math.hypot(x - 420, z + 380) < 100) continue;
        let ov = 0;
        if (typeof treeChunks !== 'undefined') {
          for (const tc of treeChunks) {
            if (Math.abs(tc.s.center.x - x) < 70 && Math.abs(tc.s.center.z - z) < 70) {
              for (const t of tc.a) {
                if (Math.abs(t[0] - x) < 16 && Math.abs(t[2] - z) < 15) ov++;
              }
            }
          }
        }
        const score = Math.hypot(x - 145, z - 105) + slope * 500 + relief * 70 + ov * 12;
        if (score < bestScore) {
          bestScore = score;
          best = { x, z, h };
        }
      }
    }

    chapter4.spot = best || { x: 145, z: 105, h: hAt(145, 105) };
    const { x: cx, z: cz, h: by0 } = chapter4.spot;
    window.__boisCh4Bounds = { cx, cz, hx: 16, hz: 15 };

    if (typeof treeChunks !== 'undefined') {
      const zm = new THREE.Matrix4().makeScale(0, 0, 0);
      for (const tc of treeChunks) {
        let chg = false;
        for (let i = 0; i < tc.a.length; i++) {
          const t = tc.a[i];
          if (Math.abs(t[0] - cx) < 16.5 && Math.abs(t[2] - cz) < 15.5) {
            tc.m.setMatrixAt(i, zm);
            chg = true;
          }
        }
        if (chg) tc.m.instanceMatrix.needsUpdate = true;
      }
    }

    let hMaxIn = -1e9, hMinOut = 1e9;
    for (let dx = -13.5; dx <= 13.5; dx += 1.5) {
      for (let dz = -11.5; dz <= 11.5; dz += 1.5) {
        hMaxIn = Math.max(hMaxIn, hAt(cx + dx, cz + dz));
      }
    }
    for (let dx = -14.5; dx <= 14.5; dx += 1.5) {
      for (let dz = -12.5; dz <= 12.5; dz += 1.5) {
        hMinOut = Math.min(hMinOut, hAt(cx + dx, cz + dz));
      }
    }
    const by = Math.min(Math.max(by0, hMaxIn + 0.03), by0 + 0.6);
    chapter4.base = by;

    const g = chapter4.group;
    g.position.set(cx, by - 0.43, cz);
    g.visible = !!STORY.flags.metKatherin;
    scene.add(g);

    // Utilidades de materiales y texturas con espacio de color y nitidez
    const maxAniso = Math.min(8, (typeof R !== 'undefined' && R?.capabilities?.getMaxAnisotropy?.()) || 4);
    const setColorTex = (tex) => {
      if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      else tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = maxAniso;
      return tex;
    };
    const mat = (color, roughness = 0.9, metalness = 0, extra = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

    const concrete = mat(0x77766e);
    const oldWall = mat(0xb8b3a5);
    const dark = mat(0x343b3a);
    const wood = mat(0x634b35, 0.86);
    const wood2 = mat(0x806346, 0.8);
    const metal = mat(0x42494a, 0.6, 0.42);
    const glass = mat(0x9bb9bb, 0.18, 0.06, { transparent: true, opacity: 0.32, side: THREE.DoubleSide });
    const paper = mat(0xe5dcc5, 0.92);
    const stickyMat = mat(0xebd272, 0.85, 0, { emissive: 0x3b3112, emissiveIntensity: 0.12 });
    const screen = mat(0x263438, 0.32, 0.08, { emissive: 0x101b20, emissiveIntensity: 0.22 });
    const plaster = mat(0xbdb6a4);
    const trim = mat(0xd6cfbd, 0.85);
    const base = mat(0x5e5d56, 0.95);
    const green = mat(0x4a5a4e, 0.82);
    const cork = mat(0x9a7b52, 0.9);
    const locker = mat(0x4f6a66, 0.5, 0.42);
    const brass = mat(0x9c8450, 0.38, 0.58);
    const scarfMat = mat(0x38486e, 0.88);
    const ribbonMat = mat(0xb64a58, 0.8);
    const lockerCoverMat = mat(0x5a3e2c, 0.85);
    const lampGlow = mat(0xe9dcae, 0.35, 0, { emissive: 0xffd98a, emissiveIntensity: 0.42 });
    const bulbMat = mat(0xc4b78d, 0.35, 0, { emissive: 0x4b4024, emissiveIntensity: 0.22 });

    // Geometrías unitarias compartidas (luego fusionadas y liberadas de memoria)
    const chapterBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cylCache = new Map();
    const getCylGeo = (r1, r2, seg = 10) => {
      const k = r1 + '_' + r2 + '_' + seg;
      let cg = cylCache.get(k);
      if (!cg) {
        cg = new THREE.CylinderGeometry(r1, r2, 1, seg);
        cylCache.set(k, cg);
      }
      return cg;
    };
    const addBox = (w, h, d, x, y, z, m, cast = true) => {
      const o = new THREE.Mesh(chapterBoxGeometry, m);
      o.position.set(x, y, z);
      o.scale.set(w, h, d);
      o.castShadow = cast && !isTouch;
      o.receiveShadow = true;
      g.add(o);
      return o;
    };
    const addCylinder = (r1, r2, h, x, y, z, m, seg = 10) => {
      const o = new THREE.Mesh(getCylGeo(r1, r2, seg), m);
      o.position.set(x, y, z);
      o.scale.set(1, h, 1);
      o.castShadow = !isTouch;
      o.receiveShadow = true;
      g.add(o);
      return o;
    };

    // ===== Modelo arquitectónico del edificio (28 × 24 m, entrada al sur +z) =====
    const CH4_ROOF_SHADOW = true;
    const F = 0.43, wb = 0.30, wallTop = 6.4, TW = 0.48, WX = 13.76, WZ = 11.76, IX = 13.52, IZ = 11.52;
    const dropY = Math.max(0, by - hMinOut) + 0.8;

    // Cimentación, zócalo y losa
    {
      const top = wb, bot = F - dropY;
      addBox(28.8, top - bot, 24.8, 0, (top + bot) / 2, 0, base, false);
    }
    addBox(27.04, 0.3, 23.04, 0, F - 0.15, 0, concrete, false);

    // Suelo de baldosas desgastadas
    {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      const c2 = cv.getContext('2d');
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          c2.fillStyle = (i + j) % 2 ? '#868a7d' : '#a39f8b';
          c2.fillRect(i * 128, j * 128, 128, 128);
        }
      }
      c2.strokeStyle = 'rgba(30,30,24,.38)';
      c2.lineWidth = 3;
      c2.strokeRect(1, 1, 254, 254);
      c2.beginPath();
      c2.moveTo(128, 0); c2.lineTo(128, 256);
      c2.moveTo(0, 128); c2.lineTo(256, 128);
      c2.stroke();
      for (let k = 0; k < 320; k++) {
        c2.fillStyle = 'rgba(' + (k % 2 ? '255,255,240' : '30,30,24') + ',' + (0.03 + hash(k, 3.1) * 0.05) + ')';
        c2.fillRect(hash(k, 7.7) * 256, hash(k, 1.9) * 256, 2 + hash(k, 5.5) * 12, 1 + hash(k, 9.1) * 3);
      }
      const tx = setColorTex(new THREE.CanvasTexture(cv));
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      tx.repeat.set(13.5, 11.5);
      const fl = new THREE.Mesh(
        new THREE.PlaneGeometry(27, 23),
        new THREE.MeshStandardMaterial({ map: tx, roughness: 0.82, metalness: 0 })
      );
      fl.rotation.x = -Math.PI / 2;
      fl.position.set(0, F + 0.012, 0);
      fl.receiveShadow = true;
      g.add(fl);
    }

    // Muros y ventanales con alféizar, dintel y repisa interior
    const wallRun = (axis, fixed, lo, hi, openings, m = oldWall) => {
      const seg = (a, b, y0, y1) => {
        const len = b - a, h = y1 - y0;
        if (len <= 0.001 || h <= 0.001) return;
        const mid = (a + b) / 2, ym = (y0 + y1) / 2;
        if (axis === 'x') addBox(len, h, TW, mid, ym, fixed, m);
        else addBox(TW, h, len, fixed, ym, mid, m);
      };
      let cur = lo;
      for (const [a, b, sill, head] of openings.slice().sort((p, q) => p[0] - q[0])) {
        seg(cur, a, wb, wallTop);
        seg(a, b, wb, sill);
        seg(a, b, head, wallTop);
        cur = b;
      }
      seg(cur, hi, wb, wallTop);
    };
    const P = (axis, fixed, out, along, y, off, w, hh, d, m, c = false) =>
      axis === 'x' ? addBox(w, hh, d, along, y, fixed + out * off, m, c) : addBox(d, hh, w, fixed + out * off, y, along, m, c);
    const windowAt = (axis, fixed, out, a, b, sill, head, cols = 3, rows = 2) => {
      const len = b - a, mid = (a + b) / 2, h = head - sill, ym = (sill + head) / 2;
      P(axis, fixed, out, mid, ym, 0, len - 0.05, h - 0.05, 0.05, glass, false);
      P(axis, fixed, out, mid, sill + 0.04, 0, len, 0.08, 0.14, metal);
      P(axis, fixed, out, mid, head - 0.04, 0, len, 0.08, 0.14, metal);
      P(axis, fixed, out, a + 0.04, ym, 0, 0.08, h, 0.14, metal);
      P(axis, fixed, out, b - 0.04, ym, 0, 0.08, h, 0.14, metal);
      for (let i = 1; i < cols; i++) P(axis, fixed, out, a + (len * i) / cols, ym, 0, 0.06, h, 0.12, metal);
      for (let j = 1; j < rows; j++) P(axis, fixed, out, mid, sill + (h * j) / rows, 0, len, 0.06, 0.12, metal);
      P(axis, fixed, out, mid, sill - 0.06, 0.34, len + 0.5, 0.12, 0.3, trim);
      P(axis, fixed, out, mid, head + 0.10, 0.29, len + 0.3, 0.20, 0.10, trim);
      P(axis, fixed, out, mid, sill - 0.03, -0.30, len + 0.2, 0.07, 0.22, wood2);
    };
    const pilaster = (axis, fixed, out, at) => P(axis, fixed, out, at, (wb + wallTop) / 2, 0.36, 0.55, wallTop - wb, 0.24, plaster);

    const SIDE_W = [[-8.1, -4.9], [-1.6, 1.6], [4.9, 8.1]];
    const FRONT_W = [[-9.4, -5.4], [5.4, 9.4]];
    const BACK_W = [4.4, 11.6];
    const winSill = 2.05, winHead = 5.1;

    wallRun('x', -WZ, -14, 14, [[BACK_W[0], BACK_W[1], 2.2, 5.5]]);
    windowAt('x', -WZ, -1, BACK_W[0], BACK_W[1], 2.2, 5.5, 6, 2);

    for (const side of [-1, 1]) {
      wallRun('z', side * WX, -IZ, IZ, SIDE_W.map(([a, b]) => [a, b, winSill, winHead]));
      for (const [a, b] of SIDE_W) windowAt('z', side * WX, side, a, b, winSill, winHead, 3, 2);
    }

    wallRun('x', WZ, -14, 14, [[-2.3, 2.3, wb, 3.8], ...FRONT_W.map(([a, b]) => [a, b, winSill, 4.7])]);
    for (const [a, b] of FRONT_W) windowAt('x', WZ, 1, a, b, winSill, 4.7, 3, 2);

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) addBox(0.64, wallTop - wb, 0.64, sx * 13.88, (wb + wallTop) / 2, sz * 11.88, plaster);
    }
    for (const side of [-1, 1]) for (const at of [-9.8, -3.25, 3.25, 9.8]) pilaster('z', side * WX, side, at);
    for (const at of [-9, -4.5, 0, 12.9]) pilaster('x', -WZ, -1, at);
    for (const at of [-12, -3.85, 3.85, 12]) pilaster('x', WZ, 1, at);

    // Base exterior de hormigón
    for (const sx of [-1, 1]) addBox(0.5, 1.15, 24.24, sx * 13.87, wb + 0.575, 0, base);
    addBox(27.24, 1.15, 0.5, 0, wb + 0.575, -11.87, base);
    for (const sx of [-1, 1]) addBox(11.3, 1.15, 0.5, sx * 7.96, wb + 0.575, 11.87, base);

    // Puerta de doble hoja abierta y placa vacía sin nombre sobre el dintel
    for (const sx of [-1, 1]) {
      addBox(0.2, 3.8 - F, 0.42, sx * 2.2, (3.8 + F) / 2, WZ, wood2);
      addBox(2.0, 3.35, 0.07, sx * 3.4, F + 1.675, 11.40, wood);
      addBox(1.5, 1.2, 0.03, sx * 3.4, F + 2.45, 11.36, wood2);
      addBox(1.5, 1.2, 0.03, sx * 3.4, F + 0.95, 11.36, wood2);
    }
    addBox(4.8, 0.22, 0.42, 0, 3.7, WZ, wood2);
    addBox(2.4, 0.56, 0.08, 0, 5.15, WZ + 0.26, plaster, false); // placa vacía sin rótulo

    // Marquesina, columnas y farolas de entrada
    addBox(7.4, 0.2, 2.3, 0, 4.5, 13.05, trim);
    addBox(7.4, 0.12, 0.16, 0, 4.28, 14.12, concrete);
    for (const sx of [-1, 1]) {
      addCylinder(0.085, 0.095, 4.3 - F, sx * 3.2, (4.4 + F) / 2, 13.7, metal);
      addBox(0.26, 0.38, 0.2, sx * 2.75, 3.0, 12.1, metal);
      addBox(0.18, 0.26, 0.04, sx * 2.75, 3.0, 12.21, lampGlow, false);
    }

    // Descansillo y escalones exteriores
    const gDoor = hAt(cx, cz + 15);
    const rise = Math.max(0, by - gDoor);
    const nSteps = rise > 0.08 ? Math.ceil(rise / 0.2) : 0;
    const stepR = nSteps ? rise / nSteps : 0;
    {
      const bot = F - rise - 0.8;
      addBox(6.8, F - bot, 2.0, 0, (F + bot) / 2, 13.0, concrete, false);
      for (let k = 1; k < nSteps; k++) {
        const t = F - k * stepR;
        addBox(5.2, t - bot, 0.7, 0, (t + bot) / 2, 14.0 + (k - 0.5) * 0.7, concrete, false);
      }
    }

    // Techo con voladizo y tragaluz central abierto
    const RC = CH4_ROOF_SHADOW, rT = 6.4, rH = 0.38, rY = rT + rH / 2, rTop = rT + rH;
    addBox(29.2, rH, 9.1, 0, rY, -8.05, concrete, RC);
    addBox(29.2, rH, 11.1, 0, rY, 7.05, concrete, RC);
    addBox(10.6, rH, 5, -9.3, rY, -1, concrete, RC);
    addBox(10.6, rH, 5, 9.3, rY, -1, concrete, RC);
    addBox(29.2, 0.55, 0.26, 0, rTop + 0.275, -12.47, concrete);
    addBox(29.2, 0.55, 0.26, 0, rTop + 0.275, 12.47, concrete);
    for (const sx of [-1, 1]) addBox(0.26, 0.55, 24.68, sx * 14.47, rTop + 0.275, 0, concrete);
    for (const sx of [-1, 1]) addBox(0.2, 0.5, 5.4, sx * 4.1, rTop + 0.25, -1, concrete);
    addBox(8.4, 0.5, 0.2, 0, rTop + 0.25, -3.6, concrete);
    addBox(8.4, 0.5, 0.2, 0, rTop + 0.25, 1.6, concrete);
    addBox(8.4, 0.06, 5.4, 0, rTop + 0.53, -1, glass, false);
    for (const x of [-2.1, 0, 2.1]) addBox(0.07, 0.07, 5.4, x, rTop + 0.58, -1, metal);
    addBox(8.4, 0.07, 0.07, 0, rTop + 0.58, -1, metal);
    addBox(2.2, 0.8, 1.4, -9, rTop + 0.4, -6, metal);
    addBox(1.8, 0.6, 1.2, 9.5, rTop + 0.3, 6, metal);
    addCylinder(0.25, 0.25, 0.9, -6.4, rTop + 0.45, -6.2, metal);
    addCylinder(0.2, 0.2, 0.7, 6.5, rTop + 0.35, 5.4, metal);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) addCylinder(0.06, 0.06, wallTop - wb - 0.3, sx * 14.08, (wb + wallTop) / 2, sz * 11.0, metal);
    }

    // Vigas interiores y tubos fluorescentes
    for (const z of [-9, -6.2, 4.5, 7.5, 10.5]) addBox(27, 0.4, 0.35, 0, wallTop - 0.2, z, base);
    for (const x of [-6.5, 6.5]) addBox(0.35, 0.36, 23, x, wallTop - 0.18, 0, base);
    for (const [lx, lz] of [[-8, -7.6], [0, -7.6], [8, -7.6], [-8, 6], [0, 6], [8, 6]]) {
      for (const dz of [-0.12, 0.12]) addCylinder(0.015, 0.015, 0.35, lx, 6.2, lz + dz, metal, 6);
      addBox(1.3, 0.1, 0.42, lx, 5.98, lz, metal, false);
      addBox(1.1, 0.035, 0.2, lx, 5.9, lz, bulbMat, false);
    }

    // Zócalo verde con moldura, radiadores, casilleros (con el 4º entreabierto) y reloj detenido
    const wH = 1.45, wy = F + wH / 2;
    for (const sx of [-1, 1]) {
      addBox(0.06, wH, 23.0, sx * (IX - 0.03), wy, 0, green, false);
      addBox(0.1, 0.07, 23.0, sx * (IX - 0.05), F + wH + 0.03, 0, wood2, false);
    }
    addBox(27.0, wH, 0.06, 0, wy, -IZ + 0.03, green, false);
    addBox(27.0, 0.07, 0.1, 0, F + wH + 0.03, -IZ + 0.05, wood2, false);
    for (const [a, b] of [[-13.46, -2.3], [2.3, 13.46]]) {
      addBox(b - a, wH, 0.06, (a + b) / 2, wy, IZ - 0.03, green, false);
      addBox(b - a, 0.07, 0.1, (a + b) / 2, F + wH + 0.03, IZ - 0.05, wood2, false);
    }
    for (const sx of [-1, 1]) {
      for (const [a, b] of SIDE_W) addBox(0.16, 0.62, 2.2, sx * (IX - 0.14), F + 0.45, (a + b) / 2, metal);
    }

    // Casilleros (el nº 3 en x = -11.45 queda entreabierto con bufanda y libreta dentro)
    for (let i = 0; i < 6; i++) {
      const lx = -12.95 + i * 0.5;
      if (i === 3) {
        addBox(0.46, 2.3, 0.05, lx, F + 1.15, 11.45, locker);
        for (const sx of [-0.21, 0.21]) addBox(0.04, 2.3, 0.48, lx + sx, F + 1.15, 11.22, locker);
        addBox(0.46, 0.05, 0.48, lx, F + 2.28, 11.22, locker);
        addBox(0.46, 0.05, 0.48, lx, F + 0.03, 11.22, locker);
        addBox(0.42, 0.04, 0.42, lx, F + 1.18, 11.22, locker, false); // repisa interior
        // Bufanda doblada, libreta y pequeño espejo entreabierto dentro del casillero
        addBox(0.28, 0.09, 0.28, lx - 0.04, F + 1.245, 11.16, scarfMat, false);
        addBox(0.16, 0.035, 0.22, lx + 0.08, F + 1.22, 11.12, lockerCoverMat, false);
        addBox(0.14, 0.025, 0.2, lx + 0.08, F + 1.25, 11.12, paper, false);
        const mFrame = addBox(0.18, 0.28, 0.025, lx - 0.11, F + 1.56, 11.08, wood2, false);
        mFrame.rotation.y = 0.34;
        const mGlass = addBox(0.14, 0.24, 0.012, lx - 0.105, F + 1.56, 11.068, glass, false);
        mGlass.rotation.y = 0.34;
        // Puerta entreabierta rotada desde la bisagra derecha
        const doorPivot = new THREE.Group();
        doorPivot.position.set(lx + 0.22, F + 1.15, 10.97);
        doorPivot.rotation.y = 0.48;
        const dm1 = new THREE.Mesh(chapterBoxGeometry, locker);
        dm1.position.set(-0.22, 0, 0); dm1.scale.set(0.44, 2.24, 0.04); dm1.castShadow = !isTouch;
        const dm2 = new THREE.Mesh(chapterBoxGeometry, brass);
        dm2.position.set(-0.36, 0.04, -0.025); dm2.scale.set(0.04, 0.12, 0.03);
        const dm3 = new THREE.Mesh(chapterBoxGeometry, dark);
        dm3.position.set(-0.22, 0.84, -0.025); dm3.scale.set(0.28, 0.04, 0.02);
        doorPivot.add(dm1, dm2, dm3);
        g.add(doorPivot);
      } else {
        addBox(0.46, 2.3, 0.5, lx, F + 1.15, 11.22, locker);
        addBox(0.02, 2.2, 0.03, lx + 0.24, F + 1.15, 10.96, dark, false);
        addBox(0.3, 0.04, 0.02, lx, F + 2.0, 10.96, dark, false);
        addBox(0.05, 0.12, 0.03, lx + 0.14, F + 1.2, 10.96, brass, false);
      }
    }

    // Reloj de pared detenido
    {
      const ck = addCylinder(0.38, 0.38, 0.06, -8.5, 5.3, -11.48, dark, 16);
      ck.rotation.x = Math.PI / 2;
      const cf = addCylinder(0.33, 0.33, 0.04, -8.5, 5.3, -11.45, paper, 16);
      cf.rotation.x = Math.PI / 2;
      addBox(0.025, 0.26, 0.02, -8.5, 5.41, -11.42, dark, false);
      addBox(0.18, 0.025, 0.02, -8.43, 5.3, -11.42, dark, false);
    }

    // Pizarra principal con tizas y borrador
    addBox(7.8, 3.0, 0.22, 0, 3.05, -11.35, dark);
    addBox(8.2, 0.13, 0.34, 0, 1.48, -11.25, metal);
    addBox(8.1, 0.14, 0.3, 0, 4.62, -11.33, wood2);
    for (const sx of [-1, 1]) addBox(0.14, 3.0, 0.3, sx * 3.97, 3.05, -11.33, wood2);
    for (let i = 0; i < 3; i++) addBox(0.22 + i * 0.05, 0.025, 0.05, -3.2 + i * 0.35, 1.56, -11.2, paper, false);

    // Textura proporcional de la pizarra (7.55 × 2.75)
    const BW = 1208, BH = 440;
    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = BW;
    boardCanvas.height = BH;
    const bc = boardCanvas.getContext('2d');
    bc.fillStyle = '#18312e';
    bc.fillRect(0, 0, BW, BH);
    bc.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      bc.globalAlpha = 0.05 + hash(i, 2.3) * 0.05;
      bc.strokeStyle = '#cfd6c8';
      bc.lineWidth = 26 + hash(i, 4.1) * 30;
      bc.beginPath();
      const y0 = 30 + hash(i, 6.7) * (BH - 60);
      bc.moveTo(30 + hash(i, 1.3) * 200, y0);
      bc.quadraticCurveTo(BW * 0.5, y0 + (hash(i, 8.8) - 0.5) * 50, BW - 30 - hash(i, 3.9) * 200, y0 + (hash(i, 5.2) - 0.5) * 40);
      bc.stroke();
    }
    bc.fillStyle = '#e6ebdf';
    bc.strokeStyle = '#e6ebdf';
    bc.lineWidth = 3;
    bc.font = 'italic 44px Georgia';
    bc.globalAlpha = 0.4;
    bc.fillText('x² + 4x + 4 = 0', 100, 110);
    bc.fillText('f(x) = ?', 700, 215);
    bc.beginPath();
    bc.moveTo(100, 140); bc.lineTo(520, 140);
    bc.moveTo(700, 245); bc.lineTo(1030, 245);
    bc.stroke();
    bc.globalAlpha = 0.88;
    bc.fillText('(x + 2)² = 0', 100, 240);
    bc.fillText('x =', 100, 320);
    bc.beginPath();
    bc.moveTo(170, 330); bc.lineTo(290, 330);
    bc.stroke();

    const boardTex = setColorTex(new THREE.CanvasTexture(boardCanvas));
    const boardFace = new THREE.Mesh(
      new THREE.PlaneGeometry(7.55, 2.75),
      new THREE.MeshStandardMaterial({
        map: boardTex,
        roughness: 0.94,
        metalness: 0,
        emissive: 0xffffff,
        emissiveMap: boardTex,
        emissiveIntensity: 0.14
      })
    );
    boardFace.position.set(0, 3.05, -11.215);
    boardFace.receiveShadow = true;
    g.add(boardFace);
    addBox(0.2, 0.04, 0.09, 2.7, 1.565, -11.2, wood2, false);
    addBox(0.2, 0.03, 0.09, 2.7, 1.6, -11.2, dark, false);

    // Tiza caída en el suelo (aparece al activarse el recuerdo de la pizarra)
    {
      const chalkDropGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.11, 8);
      const chalkDropMesh = new THREE.Mesh(chalkDropGeo, paper);
      chalkDropMesh.rotation.set(Math.PI / 2, 0.25, 0.4);
      chalkDropMesh.position.set(-1.35, F + 0.025, -10.65);
      chalkDropMesh.visible = !!STORY.flags.ch4_chalk;
      chalkDropMesh.userData.dyn = true;
      g.add(chalkDropMesh);
      chapter4.chalkDrop = chalkDropMesh;
    }

    chapter4.boardDone = () => {
      if (!chapter4.boardFilled) {
        chapter4.boardFilled = true;
        bc.save();
        bc.globalAlpha = 0.95;
        bc.fillStyle = '#f4f7ee';
        bc.font = 'italic 44px Georgia';
        bc.fillText('−2', 182, 318);
        bc.globalAlpha = 0.72;
        bc.font = 'italic 26px Georgia';
        bc.fillText('No todo problema', 700, 300);
        bc.fillText('tiene una fórmula.', 700, 336);
        bc.restore();
        boardTex.needsUpdate = true;
      }
      if (chapter4.chalkDrop) chapter4.chalkDrop.visible = true;
    };

    // Escritorio del profesor, pupitres individuales y sillas
    const bookMats = [0x6e5140, 0x56645b, 0x6b6252, 0x77715e].map((color) => mat(color));
    const chair = (x, z, dir = 1) => {
      addBox(0.95, 0.12, 0.9, x, 1.0, z, wood);
      addBox(0.95, 0.86, 0.1, x, 1.43, z + 0.42 * dir, wood);
      for (const sx of [-0.42, 0.42]) {
        for (const sz of [-0.38, 0.38]) addBox(0.08, 0.94, 0.08, x + sx, 0.5, z + sz, metal);
      }
    };
    addBox(2.6, 0.16, 1.1, 2.8, 1.45, -9.3, wood2);
    addBox(0.1, 1.3, 1.0, 1.6, 0.8, -9.3, wood);
    addBox(0.1, 1.3, 1.0, 4.0, 0.8, -9.3, wood);
    addBox(2.4, 0.9, 0.04, 2.8, 0.95, -8.82, wood);
    chair(2.8, -10.55, -1);
    addBox(0.4, 0.2, 0.3, 3.6, 1.63, -9.3, paper, false);
    addBox(0.38, 0.12, 0.28, 3.62, 1.77, -9.3, wood);
    addBox(0.12, 0.14, 0.12, 2.0, 1.6, -9.1, brass);

    for (const [dx, dz] of [[-7, -5], [-1, -5], [5, -5], [-7, 1], [-1, 1], [5, 1], [-7, 7], [-1, 7], [5, 7]]) {
      addBox(2.35, 0.16, 1.25, dx, 1.45, dz, wood2);
      for (const sx of [-0.95, 0.95]) {
        for (const sz of [-0.45, 0.45]) addBox(0.12, 1.35, 0.12, dx + sx, 0.72, dz + sz, wood);
      }
      chair(dx, dz + 1.55);
      if (hash(dx, dz) > 0.35) {
        const bk = addBox(0.5, 0.07, 0.38, dx - 0.5, 1.57, dz, bookMats[Math.abs(dx * 3 + dz) % 4]);
        bk.rotation.y = hash(dz, dx) * 0.8 - 0.4;
      }
      if (hash(dz, dx + 2) > 0.55) addBox(0.22, 0.025, 0.3, dx + 0.6, 1.54, dz + 0.1, paper, false);
    }

    // Mesa principal con cuaderno abierto y lápiz
    addBox(2.8, 0.18, 1.55, -5, 1.55, 2.8, wood2);
    for (const sx of [-1.15, 1.15]) {
      for (const sz of [-0.58, 0.58]) addBox(0.13, 1.45, 0.13, -5 + sx, 0.75, 2.8 + sz, wood);
    }
    const TT = 1.64;
    const notebook = new THREE.Group();
    notebook.position.set(-5, TT, 2.65);
    notebook.rotation.y = 0.18;
    g.add(notebook);
    const coverMat = mat(0x665744, 0.8), spineMat = mat(0x4d4234, 0.8);
    const nbBox = (w, h, d, x, y, z, m, cast) => {
      const o = new THREE.Mesh(chapterBoxGeometry, m);
      o.position.set(x, y, z);
      o.scale.set(w, h, d);
      o.castShadow = !!cast && !isTouch;
      o.receiveShadow = true;
      notebook.add(o);
      return o;
    };
    nbBox(1.16, 0.03, 0.98, 0, 0.015, 0, coverMat, true);
    nbBox(0.07, 0.05, 0.98, 0, 0.025, 0, spineMat, false);
    nbBox(0.52, 0.035, 0.9, -0.29, 0.0475, 0, paper, false);
    nbBox(0.52, 0.028, 0.9, 0.29, 0.044, 0, paper, false);
    nbBox(0.035, 0.008, 0.22, 0.02, 0.062, 0.42, ribbonMat, false); // cinta marcapáginas

    const pageTex = (left) => {
      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 640;
      const c = cv.getContext('2d');
      c.fillStyle = '#e8dfc9';
      c.fillRect(0, 0, 512, 640);
      c.strokeStyle = 'rgba(70,95,125,.28)';
      c.lineWidth = 1.5;
      for (let y = 96; y < 620; y += 34) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke();
      }
      c.strokeStyle = 'rgba(160,70,60,.45)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(left ? 466 : 46, 0);
      c.lineTo(left ? 466 : 46, 640);
      c.stroke();
      const tx = '#4a4a5c', rd = '#9a4a3c';
      c.fillStyle = tx;
      c.font = 'italic 26px Georgia';
      c.fillText(left ? 'Ejercicios · Álgebra' : 'Corrección', left ? 56 : 76, 66);
      c.font = 'italic 22px Georgia';
      const rows = left
        ? ['x² + 2x + 1 = 0', '(x + 1)² = 0', 'x = −1', 'x² − 9 = 0', '(x − 3)(x + 3) = 0', 'x = 3   ó   x = −3', '2x + 6 = 14', 'x = 4']
        : ['x² + 4x + 4 = 0', '(x + 2)² = 0', 'x = −2', '3x − 5 = 10', 'x = 5', 'x² + x − 6 = 0', '(x + 3)(x − 2) = 0'];
      rows.forEach((s, i) => {
        const y = 130 + i * 34;
        c.fillStyle = tx;
        c.fillText(s, left ? 56 : 76, y);
        if (left && i === 5) {
          c.strokeStyle = rd; c.lineWidth = 2.5;
          c.beginPath(); c.moveTo(52, y - 8); c.lineTo(250, y - 9); c.stroke();
          c.fillStyle = rd; c.font = 'italic 17px Georgia';
          c.fillText('revisar', 300, y - 2);
          c.font = 'italic 22px Georgia';
        }
        if (!left && i === 3) {
          c.fillStyle = rd; c.font = 'italic 17px Georgia';
          c.fillText('← ojo con el signo', 250, y - 2);
          c.font = 'italic 22px Georgia';
        }
      });
      if (!left) {
        c.fillStyle = '#625b4e';
        c.font = 'italic 17px Georgia';
        c.fillText('Si puedo resolver esto,', 250, 556);
        c.fillText('entonces puedo resolver lo demás.', 250, 577);
        c.font = 'italic 13px Georgia';
        c.fillText('No debería conformarme con hacerlo bien.', 250, 606);
        c.fillText('Podría hacerlo mejor.', 250, 622);
      }
      return setColorTex(new THREE.CanvasTexture(cv));
    };

    for (const left of [true, false]) {
      const t = pageTex(left);
      const pm = new THREE.MeshStandardMaterial({
        map: t,
        roughness: 0.94,
        metalness: 0,
        emissive: 0xffffff,
        emissiveMap: t,
        emissiveIntensity: 0.14
      });
      const pf = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.86), pm);
      pf.rotation.x = -Math.PI / 2;
      pf.position.set(left ? -0.29 : 0.29, left ? 0.067 : 0.06, 0);
      pf.receiveShadow = true;
      notebook.add(pf);
    }

    const pencil = addCylinder(0.035, 0.035, 0.72, -4.6, TT + 0.035, 3.38, mat(0xb58b4e));
    pencil.rotation.z = Math.PI / 2;
    const pTip = addCylinder(0, 0.035, 0.13, -4.6 - 0.425, TT + 0.035, 3.38, mat(0xd9c39a));
    pTip.rotation.z = Math.PI / 2;
    const pEnd = addCylinder(0.037, 0.037, 0.06, -4.6 + 0.39, TT + 0.035, 3.38, mat(0xa8584f));
    pEnd.rotation.z = Math.PI / 2;
    addBox(0.55, 0.025, 0.35, -5.9, TT + 0.0125, 3.2, paper, false);

    // Estantería trasera (un libro sin título ligeramente salido)
    addBox(4.2, 3.8, 0.45, -10, 2.35, -11.3, wood);
    for (const yy of [1.0, 2.0, 3.0]) addBox(4.0, 0.12, 0.65, -10, yy, -10.95, wood2);
    for (const sx of [-1, 1]) addBox(0.12, 3.8, 0.7, -10 + sx * 2.1, 2.35, -10.95, wood);
    addBox(4.4, 0.12, 0.75, -10, 4.3, -10.95, wood);
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 7; i++) {
        const isUntitled = row === 1 && i === 3;
        const bm = isUntitled ? paper : bookMats[(i + row) % bookMats.length];
        const bh = 0.62 + (i % 3) * 0.11;
        const book = addBox(0.28, bh, 0.35, -11.65 + i * 0.53, 1.06 + row + bh / 2, isUntitled ? -10.7 : -10.82, bm);
        book.rotation.z = isUntitled ? 0 : i % 2 ? 0.04 : -0.035;
      }
    }

    // Tres puestos de computadores apagados (nota amarilla en el puesto central)
    const keysMat = mat(0x596060, 0.7);
    for (const [dx, dz] of [[9, -5], [9, -1], [9, 3]]) {
      const TOP = 1.53, mz = dz - 0.22;
      addBox(1.8, 0.16, 1.0, dx, 1.45, dz, wood2);
      for (const sx of [-0.8, 0.8]) addBox(0.1, 1.35, 0.9, dx + sx, 0.72, dz, wood);
      addBox(0.4, 0.03, 0.28, dx, TOP + 0.015, mz, metal);
      addBox(0.08, 0.2, 0.05, dx, TOP + 0.13, mz - 0.01, metal);
      addBox(1.05, 0.64, 0.07, dx, TOP + 0.52, mz, metal);
      addBox(0.62, 0.4, 0.06, dx, TOP + 0.52, mz - 0.06, metal);
      addBox(0.95, 0.54, 0.012, dx, TOP + 0.52, mz + 0.035, screen, false);
      if (dz === -1) addBox(0.14, 0.14, 0.01, dx + 0.35, TOP + 0.7, mz + 0.045, stickyMat, false); // «Terminar antes de la cena»
      addBox(0.62, 0.03, 0.2, dx - 0.05, TOP + 0.015, dz + 0.2, dark, false);
      addBox(0.56, 0.014, 0.14, dx - 0.05, TOP + 0.037, dz + 0.2, keysMat, false);
      addBox(0.08, 0.03, 0.12, dx + 0.45, TOP + 0.015, dz + 0.22, dark, false);
      addBox(0.22, 0.46, 0.46, dx + 0.5, F + 0.23, dz - 0.12, dark);
      addBox(0.14, 0.03, 0.01, dx + 0.5, F + 0.38, dz + 0.115, metal, false);
      addBox(0.03, 0.03, 0.012, dx + 0.5, F + 0.12, dz + 0.115, metal, false);
      chair(dx, dz + 1.2);
    }

    // Cartelera junto a la entrada con papeles viejos y nota amarilla apurada
    addBox(2.8, 1.9, 0.1, 11.7, 3.2, IZ - 0.07, wood);
    addBox(2.6, 1.7, 0.03, 11.7, 3.2, IZ - 0.13, cork, false);
    for (let i = 0; i < 5; i++) {
      const sheet = addBox(0.45, 0.6, 0.02, 10.7 + i * 0.5, 3.2 + ((i % 2) * 0.18 - 0.05), IZ - 0.16, i === 4 ? stickyMat : paper, false);
      sheet.rotation.z = (i - 2) * 0.05;
    }

    // Fusionar mallas estáticas por material y sombras, y liberar TODAS las geometrías intermedias
    {
      g.updateMatrixWorld(true);
      const invG = new THREE.Matrix4().copy(g.matrixWorld).invert();
      const bk = new Map();
      const toRemove = [];
      g.traverse((o) => {
        if (!o.isMesh || o.userData.dyn || (o.material && o.material.map)) return;
        const k = o.material.uuid + (o.castShadow ? 'c' : 'n') + (o.receiveShadow ? 'r' : 'n');
        let b = bk.get(k);
        if (!b) bk.set(k, (b = { m: o.material, c: o.castShadow, r: o.receiveShadow, gs: [] }));
        const ng = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        ng.applyMatrix4(o.matrixWorld);
        if (!ng.attributes.normal) ng.computeVertexNormals();
        b.gs.push(ng);
        toRemove.push(o);
      });

      for (const b of bk.values()) {
        let n = 0;
        for (const x of b.gs) n += x.attributes.position.count;
        const PArr = new Float32Array(n * 3);
        const NArr = new Float32Array(n * 3);
        let off = 0;
        for (const x of b.gs) {
          x.applyMatrix4(invG);
          PArr.set(x.attributes.position.array, off * 3);
          NArr.set(x.attributes.normal.array, off * 3);
          off += x.attributes.position.count;
          x.dispose();
        }
        const mg = new THREE.BufferGeometry();
        mg.setAttribute('position', new THREE.BufferAttribute(PArr, 3));
        mg.setAttribute('normal', new THREE.BufferAttribute(NArr, 3));
        mg.computeBoundingSphere();
        const mm = new THREE.Mesh(mg, b.m);
        mm.castShadow = b.c;
        mm.receiveShadow = b.r;
        g.add(mm);
      }

      for (const old of toRemove) {
        if (old.parent) old.parent.remove(old);
      }
      // Liberar plantillas unitarias
      chapterBoxGeometry.dispose();
      cylCache.forEach((cg) => cg.dispose());
      cylCache.clear();
    }

    // Congelar matrices de la arquitectura estática
    g.traverse((o) => {
      if (o !== g && !o.userData.dyn) {
        o.updateMatrix();
        o.matrixAutoUpdate = false;
      }
    });
    g.updateMatrix();
    g.matrixAutoUpdate = false;

    // Iluminación interior suave (sin sombras extras para mantener 60 FPS sin recompilar shaders)
    const roomLight = new THREE.PointLight(0xffdfad, 0, 28, 1.45);
    roomLight.position.set(0, 5.2, -0.5);
    roomLight.castShadow = false;
    g.add(roomLight);

    // Haces tenues de luz del tragaluz central y del ventanal panorámico
    const beamMatSky = new THREE.MeshBasicMaterial({
      color: 0xffebc2,
      transparent: true,
      opacity: 0.045,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const skylightBeam = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 4.3, 6.1, 16, 1, true), beamMatSky);
    skylightBeam.position.set(-0.4, 3.45, -0.6);
    skylightBeam.rotation.z = -0.14;
    skylightBeam.rotation.x = 0.1;
    skylightBeam.userData.dyn = true;
    g.add(skylightBeam);

    const beamMatWin = beamMatSky.clone();
    beamMatWin.opacity = 0.032;
    const windowBeam = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 5.2), beamMatWin);
    windowBeam.position.set(8.0, 3.2, -9.2);
    windowBeam.rotation.x = -0.58;
    windowBeam.userData.dyn = true;
    g.add(windowBeam);

    // Sutiles destellos para los 4 fragmentos opcionales (desaparecen al descubrir cada uno)
    {
      const glintGeo = new THREE.OctahedronGeometry(0.085, 0);
      const glintMat = new THREE.MeshBasicMaterial({
        color: 0xffe4a8,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glintHeight = { shelf: 2.3, board: 3.1, pc: 2.25, lockers: 2.15 };
      for (const f of CH4_FRAGMENTS) {
        const gm = new THREE.Mesh(glintGeo, glintMat);
        const y0 = F + (glintHeight[f.id] || 1.8);
        gm.position.set(f.loc[0], y0, f.loc[1]);
        gm.userData = { dyn: true, id: f.id, y0, ph: hash(f.loc[0], f.loc[1]) * 6.28 };
        gm.visible = !!chapter4.entered && !STORY.flags['ch4_f_' + f.id];
        g.add(gm);
        chapter4.glints.push(gm);
      }
    }

    // Colisiones completas (muros, escritorio profesor, pupitres, mesa cuaderno, PCs, estantería, casilleros y columnas)
    const bx0 = cx - 14, bx1 = cx + 14, bz0 = cz - 12, bz1 = cz + 12;
    const addCol = (a, b, c, d) => AB.push([a, b, c, d, g.position.y + wallTop]);
    const addDesk = (a, b, c, d) => AB.push([a, b, c, d, g.position.y + 2.4]);
    chapter4.addCollision = () => {
      if (chapter4.collisionAdded) return;
      addCol(bx0 - 0.35, bx1 + 0.35, bz0 - 0.35, bz0 + 0.35);
      addCol(bx0 - 0.35, bx0 + 0.35, bz0 - 0.35, bz1 + 0.35);
      addCol(bx1 - 0.35, bx1 + 0.35, bz0 - 0.35, bz1 + 0.35);
      addCol(bx0 - 0.35, cx - 2.35, bz1 - 0.35, bz1 + 0.35);
      addCol(cx + 2.35, bx1 + 0.35, bz1 - 0.35, bz1 + 0.35);
      // Columnas del pórtico exterior
      for (const sx of [-1, 1]) addCol(cx + sx * 3.2 - 0.22, cx + sx * 3.2 + 0.22, cz + 13.7 - 0.22, cz + 13.7 + 0.22);
      // Escritorio del profesor y pupitres
      addDesk(cx + 1.4, cx + 4.2, cz - 9.9, cz - 8.7);
      for (const [dx, dz] of [[-7, -5], [-1, -5], [5, -5], [-7, 1], [-1, 1], [5, 1], [-7, 7], [-1, 7], [5, 7]]) {
        addDesk(cx + dx - 1.2, cx + dx + 1.2, cz + dz - 0.65, cz + dz + 0.65);
      }
      // Mesa del cuaderno y puestos de PC
      addDesk(cx - 6.4, cx - 3.6, cz + 2.0, cz + 3.6);
      for (const dz of [-5, -1, 3]) addDesk(cx + 8.0, cx + 10.0, cz + dz - 0.55, cz + dz + 0.55);
      // Estantería trasera y casilleros
      addCol(cx - 12.2, cx - 7.8, cz - 11.55, cz - 10.55);
      addCol(cx - 13.3, cx - 10.1, cz + 10.85, cz + 11.55);
      chapter4.collisionAdded = true;
    };
    if (STORY.flags.metKatherin) chapter4.addCollision();

    // Suelo y escalones transitables
    chapter4.walk = [[cx - 13.4, cx + 13.4, cz - 11.4, cz + 11.4, by], [cx - 3.4, cx + 3.4, cz + 11.4, cz + 14, by]];
    for (let k = 1; k < nSteps; k++) {
      chapter4.walk.push([cx - 2.6, cx + 2.6, cz + 14 + (k - 1) * 0.7, cz + 14 + k * 0.7, by - k * stepR]);
    }
    const __ground0 = ground;
    ground = function (x, z, fy) {
      let b = __ground0(x, z, fy);
      if (g.visible) {
        for (const r of chapter4.walk) {
          if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3] && r[4] <= fy + 0.7 && r[4] > b) b = r[4];
        }
      }
      return b;
    };

    if (STORY.flags.ch4_chalk) chapter4.boardDone();
    chapter4.door = { x: cx, z: cz + 10.2 };
    chapter4.notebook = { x: cx - 5, z: cz + 2.6 };
    chapter4.board = { x: cx, z: cz - 8.5 };
    chapter4.window = { x: cx + 8, z: cz - 8.8 };

    // Bloqueador del resplandor solar (deja pasar la luz por el tragaluz abierto)
    (window.__boisSunBlockers = window.__boisSunBlockers || []).push((px, py, pz, dx, dy, dz, maxT) => {
      if (!g.visible || !window.__boisRayBox) return false;
      const gy = g.position.y, RBox = window.__boisRayBox;
      const th = RBox(px, py, pz, dx, dy, dz, cx - 14.6, cx + 14.6, gy + 6.4, gy + 6.78, cz - 12.5, cz + 12.5, maxT);
      if (th > 0) {
        const lx = px + dx * th - cx, lz = pz + dz * th - cz;
        if (!(Math.abs(lx) < 4.2 && lz > -3.7 && lz < 1.7)) return true;
      }
      const y0 = gy - 1, y1 = gy + 6.4;
      return (
        RBox(px, py, pz, dx, dy, dz, cx - 14.1, cx + 14.1, y0, y1, cz - 12, cz - 11.5, maxT) > 0 ||
        RBox(px, py, pz, dx, dy, dz, cx - 14.1, cx - 13.5, y0, y1, cz - 12, cz + 12, maxT) > 0 ||
        RBox(px, py, pz, dx, dy, dz, cx + 13.5, cx + 14.1, y0, y1, cz - 12, cz + 12, maxT) > 0 ||
        RBox(px, py, pz, dx, dy, dz, cx - 14.1, cx - 2.3, y0, y1, cz + 11.5, cz + 12, maxT) > 0 ||
        RBox(px, py, pz, dx, dy, dz, cx + 2.3, cx + 14.1, y0, y1, cz + 11.5, cz + 12, maxT) > 0
      );
    });
    window.__boisChapter4Building = chapter4;

    // ---------- Audio procedural de Capítulo IV (tiza, papel, llegada y zumbido leve) ----------
    const chalkSound = () => {
      try {
        if (!AU.ctx || !AU.on) return;
        const c = AU.ctx, t0 = c.currentTime;
        // Roce de tiza
        const o = c.createOscillator(), v = c.createGain(), f = c.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(1850, t0);
        o.frequency.exponentialRampToValueAtTime(700, t0 + 0.28);
        f.type = 'highpass'; f.frequency.value = 650;
        v.gain.setValueAtTime(0.0001, t0);
        v.gain.exponentialRampToValueAtTime(0.028, t0 + 0.02);
        v.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.30);
        o.connect(f); f.connect(v); v.connect(c.destination);
        o.onended = () => { try { o.disconnect(); f.disconnect(); v.disconnect(); } catch (_) {} };
        o.start(t0); o.stop(t0 + 0.32);

        // Doble golpecito seco de tiza cayendo sobre la baldosa
        for (const [dt, amp, freq] of [[0.36, 0.045, 520], [0.46, 0.02, 610]]) {
          const t = t0 + dt;
          const ko = c.createOscillator(), kv = c.createGain();
          ko.type = 'triangle';
          ko.frequency.setValueAtTime(freq, t);
          ko.frequency.exponentialRampToValueAtTime(160, t + 0.045);
          kv.gain.setValueAtTime(0.0001, t);
          kv.gain.exponentialRampToValueAtTime(amp, t + 0.004);
          kv.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
          ko.connect(kv); kv.connect(c.destination);
          ko.onended = () => { try { ko.disconnect(); kv.disconnect(); } catch (_) {} };
          ko.start(t); ko.stop(t + 0.075);
        }
      } catch (e) {
        typeof __bw === 'function' && __bw('31-chapter4#1', e);
      }
    };

    const pageSound = () => {
      try {
        if (!AU.ctx || !AU.on) return;
        const c = AU.ctx, dur = 0.14;
        const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
        const src = c.createBufferSource(), bp = c.createBiquadFilter(), gN = c.createGain();
        src.buffer = buf;
        bp.type = 'bandpass'; bp.frequency.value = 1750; bp.Q.value = 1.4;
        const t = c.currentTime;
        gN.gain.setValueAtTime(0.0001, t);
        gN.gain.exponentialRampToValueAtTime(0.025, t + 0.02);
        gN.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(bp); bp.connect(gN); gN.connect(c.destination);
        src.onended = () => { try { src.disconnect(); bp.disconnect(); gN.disconnect(); } catch (_) {} };
        src.start(t);
      } catch (e) {
        typeof __bw === 'function' && __bw('31-chapter4#2', e);
      }
    };

    const enterCh4Chord = () => {
      try {
        if (!AU.ctx || !AU.on) return;
        const c = AU.ctx, t0 = c.currentTime;
        [220, 329.63, 493.88].forEach((freq, i) => {
          const o = c.createOscillator(), gN = c.createGain(), lp = c.createBiquadFilter();
          o.type = 'sine'; o.frequency.value = freq;
          lp.type = 'lowpass'; lp.frequency.value = 1200;
          const t = t0 + i * 0.12;
          gN.gain.setValueAtTime(0.0001, t);
          gN.gain.exponentialRampToValueAtTime(0.022, t + 0.18);
          gN.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
          o.connect(lp); lp.connect(gN); gN.connect(c.destination);
          o.onended = () => { try { o.disconnect(); lp.disconnect(); gN.disconnect(); } catch (_) {} };
          o.start(t); o.stop(t + 2.5);
        });
      } catch (e) {
        typeof __bw === 'function' && __bw('31-chapter4#3', e);
      }
    };

    const humState = { node: null };
    const setCh4Hum = (wantLevel) => {
      try {
        const c = AU.ctx;
        if (!c) return;
        const want = wantLevel > 0.0005 ? wantLevel : 0;
        if (!humState.node) {
          if (want <= 0) return;
          const o = c.createOscillator(), gH = c.createGain(), lp = c.createBiquadFilter();
          o.type = 'triangle';
          o.frequency.value = 120;
          lp.type = 'lowpass'; lp.frequency.value = 240;
          gH.gain.value = 0;
          o.connect(lp); lp.connect(gH); gH.connect(c.destination);
          o.start();
          humState.node = { o, gH, lp };
        }
        humState.node.gH.gain.setTargetAtTime(want, c.currentTime, 0.35);
      } catch (e) {
        typeof __bw === 'function' && __bw('31-chapter4#4', e);
      }
    };

    const lookVec = new THREE.Vector3();
    const look = (p, y = 2) => lookVec.set(p.x, p.y != null ? p.y : by + y, p.z).clone();
    const chapterCine = (lines, cb, point, loc) => {
      playCinematic(lines, cb, {
        location: loc || 'CAPÍTULO IV · EL COLEGIO',
        lookAt: look(point, 2.0)
      });
    };

    // ---------- Micro-viñeta 1: Bus de las 06:27 -> 06:30 ----------
    let ch4Vignette = null;
    const closeCh4Vignette = () => {
      if (!ch4Vignette) return;
      try { ch4Vignette.stop(); } catch (_) {}
      ch4Vignette = null;
    };
    const startBusVignette = () => {
      closeCh4Vignette();
      const wrap = document.createElement('div');
      wrap.id = 'ch4BusVignette';
      wrap.style.cssText = 'position:fixed;inset:0;z-index:72;pointer-events:none;background:#070a0f;display:flex;align-items:center;justify-content:center';
      const cv = document.createElement('canvas');
      cv.width = 960;
      cv.height = 540;
      cv.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
      const clk = document.createElement('div');
      clk.style.cssText = 'position:fixed;top:15vh;left:50%;transform:translateX(-50%);padding:6px 14px;background:rgba(7,10,14,.68);border:1px solid rgba(232,220,190,.28);color:#e9dfc9;font:600 13px/1.2 ui-monospace,Consolas,monospace;letter-spacing:3px';
      clk.textContent = '06:27 · PARADERO';
      wrap.appendChild(cv);
      wrap.appendChild(clk);
      document.body.appendChild(wrap);
      const ctx = cv.getContext('2d');
      let raf = 0, dead = false, moving = false, speed = 0, scroll = 0, last = performance.now();
      const draw = (now) => {
        if (dead) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        speed += ((moving ? 140 : 0) - speed) * Math.min(1, dt * 2.2);
        scroll += speed * dt;
        const w = cv.width, h = cv.height;
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
        sky.addColorStop(0, '#101828');
        sky.addColorStop(0.58, '#363b5a');
        sky.addColorStop(1, '#c98e70');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        // Lomas lejanas
        ctx.fillStyle = '#1b2232';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.7);
        for (let x = 0; x <= w; x += 24) {
          const y = h * 0.54 + Math.sin((x + scroll * 0.14) * 0.008) * 26 + Math.cos((x + scroll * 0.14) * 0.02) * 10;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        // Casas, árboles y postes pasando tras la ventana
        ctx.fillStyle = '#0e131c';
        for (let i = 0; i < 16; i++) {
          const rx = ((i * 110 - (scroll * 0.85)) % (w + 180) + (w + 180)) % (w + 180) - 90;
          const bh = 42 + ((i * 37) % 68);
          ctx.fillRect(rx, h * 0.72 - bh, 56, bh + 40);
          if (i % 3 === 0) {
            ctx.fillStyle = 'rgba(255,214,142,.48)';
            ctx.fillRect(rx + 14, h * 0.72 - bh + 14, 10, 12);
            ctx.fillStyle = '#0e131c';
          }
        }
        for (let i = 0; i < 6; i++) {
          const lx = ((i * 220 - (scroll * 1.6)) % (w + 220) + (w + 220)) % (w + 220) - 110;
          ctx.fillStyle = '#090c11';
          ctx.fillRect(lx, h * 0.34, 5, h * 0.42);
          ctx.fillStyle = 'rgba(255,220,155,.55)';
          ctx.beginPath();
          ctx.arc(lx + 2, h * 0.34, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        // Marco interior de la ventana del bus
        ctx.fillStyle = '#080a0d';
        ctx.fillRect(0, 0, w, 64);
        ctx.fillRect(0, h * 0.72, w, h * 0.28);
        ctx.fillRect(0, 0, 68, h);
        ctx.fillRect(w - 68, 0, 68, h);
        ctx.fillRect(w * 0.52, 64, 18, h * 0.66);
        ctx.strokeStyle = 'rgba(210,220,230,.12)';
        ctx.lineWidth = 2;
        ctx.strokeRect(70, 66, w - 140, h * 0.65);
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
      ch4Vignette = {
        depart: () => {
          moving = true;
          clk.textContent = '06:30 · EN MARCHA';
          try { if (typeof auHit === 'function') auHit(110, 0.35, 0.04, 'lowpass'); } catch (_) {}
        },
        stop: () => {
          dead = true;
          cancelAnimationFrame(raf);
          wrap.remove();
        }
      };
    };

    // ---------- Micro-viñeta 2: Espejo medio abierto y espera (15:43 -> 16:12) ----------
    const startWaitVignette = () => {
      closeCh4Vignette();
      const wrap = document.createElement('div');
      wrap.id = 'ch4WaitVignette';
      wrap.style.cssText = 'position:fixed;inset:0;z-index:72;pointer-events:none;background:radial-gradient(circle at 50% 44%,rgba(28,32,36,.88),rgba(8,11,14,.96));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding-bottom:14vh';
      wrap.innerHTML =
        '<div id="ch4WaitClock" style="padding:6px 15px;border:1px solid rgba(232,220,190,.28);background:rgba(10,14,17,.7);color:#ebe1cc;font:600 15px/1.2 ui-monospace,Consolas,monospace;letter-spacing:3px">15:43</div>' +
        '<svg viewBox="0 0 260 190" style="width:min(300px,68vw);opacity:.92" aria-hidden="true">' +
        '<rect x="18" y="14" width="224" height="162" rx="3" fill="#181f24" stroke="#464d52" stroke-width="2"/>' +
        '<polygon points="48,26 154,26 140,164 48,164" fill="#2c3a42" stroke="#98a8b0" stroke-width="1.5"/>' +
        '<polygon points="56,34 114,34 86,156 56,156" fill="rgba(225,235,245,0.09)"/>' +
        '<circle cx="106" cy="86" r="14" fill="rgba(235,228,210,0.22)"/>' +
        '<path d="M84,132 Q106,104 128,132" fill="rgba(235,228,210,0.18)"/>' +
        '<line x1="154" y1="26" x2="178" y2="34" stroke="#7d6448" stroke-width="3"/>' +
        '<line x1="140" y1="164" x2="164" y2="156" stroke="#7d6448" stroke-width="3"/>' +
        '</svg>' +
        '<div id="ch4SaraMsg" style="opacity:0;transform:translateY(8px);transition:opacity .6s,transform .6s;padding:10px 16px;background:rgba(28,54,44,.9);border:1px solid rgba(158,194,173,.55);color:#e6f2ea;font:13.5px/1.45 system-ui,sans-serif;max-width:min(320px,84vw);text-align:left"><small style="display:block;font-size:10px;letter-spacing:1.6px;color:#a8d5bc;margin-bottom:3px">SARA · 4:12 P. M.</small>Ya puedes subir · Ya llegaron</div>';
      document.body.appendChild(wrap);
      const clockEl = wrap.querySelector('#ch4WaitClock');
      const saraEl = wrap.querySelector('#ch4SaraMsg');
      ch4Vignette = {
        setTime: (txt, notify) => {
          if (clockEl) clockEl.textContent = txt;
          if (notify && saraEl) {
            saraEl.style.opacity = '1';
            saraEl.style.transform = 'none';
            try { if (typeof auChime === 'function') auChime(); } catch (_) {}
          }
        },
        stop: () => { wrap.remove(); }
      };
    };

    const canInteractCh4 = () =>
      !!STORY.flags.metKatherin &&
      S.on &&
      !CIN.on &&
      !PR.on &&
      !window.__boisGuideOverlayOpen &&
      !(typeof CAR !== 'undefined' && CAR.on) &&
      !(window.__boisCh6 && window.__boisCh6.on) &&
      Math.abs(S.y - by) < 8;

    const triggerEnterCh4 = (point) => {
      if (chapter4.entered) return;
      chapter4.entered = true;
      storyFlag('ch4_entered', 1);
      enterCh4Chord();
      startBusVignette();
      chapterCine(
        [
          { layer: 'hecho', stamp: '29 / 10 / 2025 · 06:27', t: 'Estás sentado junto a la ventana del bus. Todavía hace frío de madrugada.' },
          { pause: 1500 },
          { layer: 'hecho', stamp: '06:30', t: 'El bus arranca puntual. La ciudad pasa afuera sin música épica: solo el motor y una mañana normal de tu vida.', on: () => { if (ch4Vignette && ch4Vignette.depart) ch4Vignette.depart(); } },
          { pause: 1900 },
          { t: 'Cuando la imagen del bus se desvanece, ya estás dentro del salón.', on: () => closeCh4Vignette() },
          { pause: 1400 },
          { t: 'Pupitres, pizarra, un casillero con espejo, los computadores. No es un edificio anónimo: es tu colegio.' },
          { pause: 1700 }
        ],
        () => {
          closeCh4Vignette();
          showMsg('Capítulo IV · El Colegio · busca el cuaderno abierto y los 4 recuerdos del salón');
        },
        { x: cx, y: by + 2.3, z: cz - 6 },
        'CAPÍTULO IV · EL BUS DE LAS 6:30'
      );
    };

    function chapter4Interact() {
      if (!canInteractCh4()) return false;
      const dDoor = dist(chapter4.door.x, chapter4.door.z);
      const dNote = dist(chapter4.notebook.x, chapter4.notebook.z);
      const dBoard = dist(chapter4.board.x, chapter4.board.z);
      const dWin = dist(chapter4.window.x, chapter4.window.z);

      if (!chapter4.entered && dDoor < 4.5) {
        triggerEnterCh4(chapter4.door);
        return true;
      }
      if (dNote < 3.2 && !STORY.flags.ch4_notebook) {
        if (!chapter4.entered) {
          chapter4.entered = true;
          storyFlag('ch4_entered', 1);
        }
        pageSound();
        chapterCine(
          [
            { pause: 700 },
            { layer: 'hecho', stamp: 'CUADERNO DE ÁLGEBRA', t: 'El cuaderno está abierto sobre la mesa: ejercicios resueltos, márgenes ordenados y correcciones en rojo.' },
            { pause: 1600 },
            { layer: 'pensaste', t: '«Si puedo resolver esto, entonces puedo resolver lo demás. No debería conformarme con hacerlo bien.»' },
            { pause: 2100 },
            { layer: 'hoy', t: 'Durante mucho tiempo usaste el estudio y los resultados para sentirte seguro. Pero no todo en la vida se deja despejar como una ecuación.' },
            { pause: 1900 }
          ],
          () => {
            storyFlag('ch4_notebook', 1);
            showMsg('Recuerdo guardado · acércate ahora a la pizarra');
          },
          { x: cx - 5, y: by + 1.65, z: cz + 2.65 }
        );
        return true;
      }
      if (dBoard < 3.8 && !STORY.flags.ch4_chalk) {
        if (!STORY.flags.ch4_notebook) {
          showMsg('Hay una ecuación sin terminar en la pizarra… revisa primero el cuaderno abierto.');
          return true;
        }
        chalkSound();
        chapterCine(
          [
            { pause: 650 },
            { layer: 'hecho', stamp: 'PIZARRA DEL SALÓN', t: 'Una ecuación queda a medio resolver. Una tiza cae al suelo con un golpe seco.' },
            { pause: 1500 },
            { t: 'En el eco del pasillo alguien te llama por tu apodo: «Toro, ¿ya tienes la mezcla?»' },
            { pause: 1800 },
            { layer: 'hoy', t: 'Había preguntas —como qué pensaban los demás o qué sentía Katherin— para las que no existía fórmula ni dato suficiente.' },
            { pause: 1900 }
          ],
          () => {
            storyFlag('ch4_chalk', 1);
            chapter4.boardDone();
            showMsg('Acércate ahora al ventanal del fondo (también quedan fragmentos en los rincones)');
          },
          { x: cx, y: by + 2.8, z: cz - 11.2 }
        );
        return true;
      }
      if (dWin < 4.2 && !STORY.flags.ch4_complete) {
        if (!STORY.flags.ch4_chalk) {
          showMsg('Afuera espera la tarde… revisa primero el cuaderno y la pizarra.');
          return true;
        }
        const nFrag = ch4FragmentCount(STORY.flags);
        const all = nFrag >= CH4_FRAGMENTS.length;
        const night = (typeof PC !== 'undefined' && PC && PC.night) > 0.5;
        startWaitVignette();
        const lines = [
          { pause: 650 },
          { layer: 'hecho', stamp: '29 / 10 / 2025 · 15:43', t: 'Con los suecos puestos, mirando un espejo medio abierto mientras afuera suena un vallenato suave.', on: () => { if (ch4Vignette) ch4Vignette.setTime('15:43', false); } },
          { pause: 1500 },
          { layer: 'pensaste', stamp: '15:48 · 15:51', t: '«No estoy haciendo nada. Solo estoy esperando.» El reloj avanza despacio.', on: () => { if (ch4Vignette) ch4Vignette.setTime('15:51', false); } },
          { pause: 1600 },
          { layer: 'hecho', stamp: '16:12 · MENSAJE RECIBIDO', t: 'A las 4:12 p. m. llega por fin el mensaje de Sara: «Ya puedes subir · Ya llegaron».', on: () => { if (ch4Vignette) ch4Vignette.setTime('16:12 · YA PUEDES SUBIR', true); } },
          { pause: 2100 },
          {
            t: night
              ? 'El espejo se cierra y vuelves al ventanal del salón. Afuera, el bosque descansa a oscuras.'
              : 'El espejo se cierra y vuelves al ventanal del salón. La luz de la tarde entra despacio entre el polvo.',
            on: () => closeCh4Vignette()
          },
          { pause: 1700 }
        ];
        if (all) {
          lines.push(
            { layer: 'hoy', t: 'Recordaste las cinco palabras de Cátedra de Paz, el 382, la mezcla para el grupo y la espera de las 4:12.' },
            { pause: 2200 },
            { layer: 'hoy', t: 'Ese chico de 16 años iba a los ensayos, prestaba su computador y ayudaba en silencio. No era ridículo: estaba aprendiendo a vivir.' },
            { pause: 2200 }
          );
        } else if (nFrag > 0) {
          lines.push(
            { layer: 'hoy', t: 'Aún quedan recuerdos pequeños en los rincones del salón, pero empiezas a mirar a aquel chico con menos dureza.' },
            { pause: 2000 }
          );
        } else {
          lines.push(
            { layer: 'hoy', t: 'Por primera vez miras el paisaje sin exigirte tener todas las respuestas.' },
            { pause: 1900 }
          );
        }
        chapterCine(
          lines,
          () => {
            closeCh4Vignette();
            storyFlag('ch4_complete', 1);
            showMsg('Capítulo IV completado · Algo espera bajo la superficie del lago' + (all ? ' (4/4 recuerdos)' : ''));
          },
          { x: cx + 8, y: by + 2.4, z: cz - 24 },
          'CAPÍTULO IV · EL ESPEJO Y LAS 4:12 P. M.'
        );
        return true;
      }
      if (chapter4.entered) {
        const fr = ch4FragmentNear(STORY.flags, S.x - cx, S.z - cz);
        if (fr) {
          pageSound();
          const timed = [{ pause: 550 }];
          for (const l of fr.lines) {
            timed.push(l, { pause: Math.min(2700, 850 + l.t.length * 26) });
          }
          const fragLook = {
            shelf: { x: cx - 10, y: by + 2.2, z: cz - 11.0 },
            board: { x: cx + 11.7, y: by + 2.9, z: cz + 11.4 },
            pc: { x: cx + 9.0, y: by + 1.9, z: cz - 1.22 },
            lockers: { x: cx - 11.45, y: by + 1.45, z: cz + 11.2 }
          }[fr.id] || { x: cx + fr.loc[0], y: by + 1.8, z: cz + fr.loc[1] };
          chapterCine(
            timed,
            () => {
              storyFlag('ch4_f_' + fr.id, 1);
              const n = ch4FragmentCount(STORY.flags);
              showMsg(
                n >= CH4_FRAGMENTS.length
                  ? 'Reuniste los 4 recuerdos del colegio (' + n + '/' + CH4_FRAGMENTS.length + ')'
                  : 'Recuerdo del colegio (' + n + '/' + CH4_FRAGMENTS.length + ')'
              );
            },
            fragLook,
            'CAPÍTULO IV · ' + fr.name.toUpperCase()
          );
          return true;
        }
      }
      return false;
    }

    addEventListener(
      'keydown',
      (e) => {
        if (e.code === 'KeyE' && !e.repeat && chapter4Interact()) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    // Pistas contextuales y entrada automática al cruzar la puerta
    window.__boisChapter4Tick = () => {
      if (!canInteractCh4()) {
        chapter4.near = '';
        return;
      }
      // Si el jugador entra caminando al salón sin pulsar E en el umbral, activa la entrada automáticamente
      const insideRoom = Math.abs(S.x - cx) < 12.6 && S.z > cz - 11.2 && S.z < cz + 9.4 && Math.abs(S.y - by) < 3.5;
      if (!chapter4.entered && insideRoom) {
        triggerEnterCh4(chapter4.door);
        return;
      }

      const dDoor = dist(chapter4.door.x, chapter4.door.z);
      const dNote = dist(chapter4.notebook.x, chapter4.notebook.z);
      const dBoard = dist(chapter4.board.x, chapter4.board.z);
      const dWin = dist(chapter4.window.x, chapter4.window.z);
      let next = '', msg = '';
      if (!chapter4.entered && dDoor < 8.5) {
        next = 'door';
        msg = 'El Colegio · E: entrar';
      } else if (chapter4.entered && !STORY.flags.ch4_notebook && dNote < 4.2) {
        next = 'note';
        msg = 'Cuaderno de álgebra · E: examinar';
      } else if (STORY.flags.ch4_notebook && !STORY.flags.ch4_chalk && dBoard < 5.0) {
        next = 'board';
        msg = 'Pizarra · E: acercarte';
      } else if (STORY.flags.ch4_chalk && !STORY.flags.ch4_complete && dWin < 5.2) {
        next = 'window';
        msg = 'Ventanal · E: mirar y esperar';
      }
      if (!next && chapter4.entered) {
        const fr = ch4FragmentNear(STORY.flags, S.x - cx, S.z - cz, 1.2);
        if (fr) {
          next = 'f_' + fr.id;
          msg = fr.name + ' · E: examinar';
        }
      }
      if (next && chapter4.near !== next) {
        chapter4.near = next;
        showMsg(msg);
      } else if (!next) {
        chapter4.near = '';
      }
    };

    // Ambiente interior: motas de polvo, parpadeo leve de tubos, luz interior, haces y zumbido suave
    {
      const N = isTouch ? 90 : 150;
      const posArr = new Float32Array(N * 3);
      const seed = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        posArr[i * 3] = (hash(i, 1.7) - 0.5) * 25;
        posArr[i * 3 + 1] = F + 0.6 + hash(i, 4.3) * 5.2;
        posArr[i * 3 + 2] = (hash(i, 8.1) - 0.5) * 21;
        seed[i] = hash(i, 2.9) * 6.28;
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      const dustMat = new THREE.PointsMaterial({
        color: 0xfff1cf,
        size: 0.048,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        sizeAttenuation: true
      });
      const dust = new THREE.Points(dg, dustMat);
      dust.userData.dyn = true;
      dust.frustumCulled = false;
      dust.visible = false;
      g.add(dust);

      const baseGlow = bulbMat.emissiveIntensity;
      let nextFlick = performance.now() / 1000 + 6;

      function __ch4Ambience(dt, tt) {
        const activeState = g.visible && !document.hidden && !PR.on && !(window.__boisCh6 && window.__boisCh6.on);
        const inside = activeState && S.on && Math.abs(S.x - cx) < 13.8 && Math.abs(S.z - cz) < 11.8 && Math.abs(S.y - by) < 6.5;
        setCh4Hum(inside && AU.on && !window.__boisGuideOverlayOpen ? 0.0045 : 0);

        if (!activeState || (!S.on && !CIN.on)) {
          dust.visible = false;
          roomLight.intensity = 0;
          return;
        }

        const dPlayer = Math.hypot(S.x - cx, S.z - cz);
        const near = dPlayer < 28;
        dust.visible = near;
        skylightBeam.visible = near;
        windowBeam.visible = near;
        if (!near) {
          roomLight.intensity = 0;
          return;
        }

        const t = tt || performance.now() / 1000;
        const a = dg.attributes.position.array;
        const step = Math.min(2.5, Math.max(0.2, (dt || 0.016) * 60));
        for (let i = 0; i < N; i++) {
          a[i * 3] += Math.sin(t * 0.2 + seed[i]) * 0.0012 * step;
          a[i * 3 + 1] += (Math.sin(t * 0.13 + seed[i] * 2) * 0.0008 - 0.0003) * step;
          a[i * 3 + 2] += Math.cos(t * 0.17 + seed[i]) * 0.0012 * step;
          if (a[i * 3 + 1] < F + 0.4) a[i * 3 + 1] = F + 5.8;
        }
        dg.attributes.position.needsUpdate = true;

        // Parpadeo ocasional de las lámparas y luz interior suave adaptada a la hora del día
        const night = typeof PC !== 'undefined' && PC ? PC.night || 0 : 0;
        const weatherDim =
          typeof WX !== 'undefined' && WX.st ? Math.max(0.25, 1 - (WX.st.rain || 0) * 0.55 - (WX.st.sc || 0) * 0.65) : 1;
        const f = t - nextFlick;
        let flickFactor = 1;
        if (f > 0 && f < 0.35) {
          flickFactor = 0.35 + 0.65 * Math.abs(Math.sin(f * 38));
        } else if (f >= 0.35) {
          nextFlick = t + 9 + Math.random() * 14;
        }
        bulbMat.emissiveIntensity = baseGlow * flickFactor;
        lampGlow.emissiveIntensity = 0.32 + night * 0.68;
        roomLight.intensity = (0.58 + night * 0.55) * (0.75 + 0.25 * flickFactor);

        const beamAlpha = Math.max(0.18, 1 - night * 0.62) * weatherDim;
        beamMatSky.opacity = 0.042 * beamAlpha;
        beamMatWin.opacity = 0.028 * beamAlpha;

        // Actualizar destellos de fragmentos opcionales pendientes
        for (const gm of chapter4.glints) {
          const show = !!chapter4.entered && !STORY.flags['ch4_f_' + gm.userData.id];
          gm.visible = show;
          if (show) {
            gm.position.y = gm.userData.y0 + Math.sin(t * 2.0 + gm.userData.ph) * 0.08;
            gm.rotation.y = t * 1.4 + gm.userData.ph;
          }
        }
      }

      window.__boisChapter4Ambience = __ch4Ambience;
      if (!window.__boisMainLoopUnified) {
        (function ambience() {
          requestAnimationFrame(ambience);
          __ch4Ambience(0.016);
        })();
      }
    }

    // Misión y brújula paso a paso dentro del Capítulo IV
    const oldMission = bgMission;
    bgMission = function () {
      if (STORY.flags.metKatherin && bgCollected() >= PHOTOS.length && !STORY.flags.ch4_complete) {
        if (!STORY.flags.ch4_entered) {
          return {
            title: 'Capítulo IV · El Colegio (06:30 a. m.)',
            clue: 'Sigue la brújula hacia El Colegio en el bosque.'
          };
        }
        if (!STORY.flags.ch4_notebook) {
          return {
            title: 'Capítulo IV · El Colegio',
            clue: 'Explora el salón. Un cuaderno de álgebra descansa abierto sobre la mesa (E).'
          };
        }
        if (!STORY.flags.ch4_chalk) {
          return {
            title: 'Capítulo IV · El Colegio',
            clue: 'Acércate a la pizarra del frente; hay una ecuación sin terminar (E).'
          };
        }
        return {
          title: 'Capítulo IV · El Colegio',
          clue: 'Mira hacia el bosque por el ventanal del fondo (E). También quedan 4 recuerdos en el salón.'
        };
      }
      if (STORY.flags.ch4_complete) {
        return {
          title: 'Capítulo IV completado',
          clue: 'Empezaste a mirar a tu yo de 16 años sin juzgarlo. Algo espera bajo la superficie del lago.'
        };
      }
      return oldMission();
    };

    const oldTarget = bgTarget;
    bgTarget = function () {
      if (STORY.flags.metKatherin && bgCollected() >= PHOTOS.length && !STORY.flags.ch4_complete) {
        if (!STORY.flags.ch4_entered) return { name: 'El Colegio', x: cx, z: cz };
        if (!STORY.flags.ch4_notebook) return { name: 'Cuaderno abierto', x: chapter4.notebook.x, z: chapter4.notebook.z };
        if (!STORY.flags.ch4_chalk) return { name: 'La pizarra', x: chapter4.board.x, z: chapter4.board.z };
        return { name: 'Ventanal y espera', x: chapter4.window.x, z: chapter4.window.z };
      }
      return oldTarget();
    };

    // Hacer visible el edificio y activar sus colisiones al conocer a Katherin
    const oldInteractK = interactKatherin;
    interactKatherin = function () {
      const r = oldInteractK();
      if (STORY.flags.metKatherin) {
        g.visible = true;
        chapter4.addCollision();
      }
      return r;
    };

    // Limpieza opcional de recursos del Capítulo IV
    window.__boisDisposeChapter4 = () => {
      setCh4Hum(0);
      const geos = new Set(), mats = new Set(), texs = new Set();
      g.traverse((o) => {
        if (o.geometry) geos.add(o.geometry);
        if (o.material) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) {
            if (!m) continue;
            mats.add(m);
            if (m.map) texs.add(m.map);
            if (m.emissiveMap) texs.add(m.emissiveMap);
          }
        }
      });
      if (g.parent) g.parent.remove(g);
      geos.forEach((geo) => geo.dispose());
      mats.forEach((m) => m.dispose());
      texs.forEach((t) => t.dispose());
      window.__boisChapter4Building = null;
    };
  })();
} catch (__boisCh4Error) {
  console.error('Capítulo IV no pudo inicializarse; se conserva el juego base:', __boisCh4Error);
}
