/* BOIS.IO · 30-katherin.js — Capítulo III Remastered · El Parque de los Cisnes
   Remasterizado y optimizado: fusión estática de mallas por material y grupo (~80% menos draw calls),
   pétalos instanciados, pétalos caídos y sombra de contacto en la banca, atmósfera sonora de encuentro,
   rótulo «CAPÍTULO III · EL PARQUE DE LOS CISNES», progresión de etapa y disposeKatherin(). */

function disposeKatherin() {
  const disposeTree = (root) => {
    if (!root) return;
    const geos = new Set();
    const mats = new Set();
    const texs = new Set();
    root.traverse((obj) => {
      if (obj.geometry) geos.add(obj.geometry);
      if (obj.material) {
        const list = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of list) {
          if (!m) continue;
          mats.add(m);
          if (m.map) texs.add(m.map);
          if (m.gradientMap) texs.add(m.gradientMap);
        }
      }
    });
    if (root.parent) root.parent.remove(root);
    geos.forEach((geo) => geo.dispose());
    mats.forEach((m) => m.dispose());
    texs.forEach((t) => t.dispose());
  };

  disposeTree(window.__katherin);
  disposeTree(window.__boisParkSwans);
  disposeTree(window.__boisParkDecor);
  window.__katherin = null;
  window.__boisParkSwans = null;
  window.__boisParkDecor = null;
  window.__boisKatherinFrame = null;
}

function katherinMergeStaticChildren(rootGroup, ownedTemplates = null) {
  if (!rootGroup) return;
  const buckets = new Map();
  const toRemove = [];

  for (let i = 0; i < rootGroup.children.length; i++) {
    const child = rootGroup.children[i];
    if (!child || !child.isMesh || child.userData.dyn || child.isInstancedMesh) continue;
    const mat = child.material;
    if (!mat || Array.isArray(mat) || !child.geometry || !child.geometry.attributes || !child.geometry.attributes.position) continue;
    child.updateMatrix();
    const key = mat.uuid + '_' + (child.castShadow ? 1 : 0) + '_' + (child.receiveShadow ? 1 : 0) + '_' + (child.renderOrder || 0);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { mat, cast: !!child.castShadow, recv: !!child.receiveShadow, order: child.renderOrder || 0, items: [] };
      buckets.set(key, bucket);
    }
    bucket.items.push(child);
    toRemove.push(child);
  }

  for (const bucket of buckets.values()) {
    if (bucket.items.length < 2) {
      const only = bucket.items[0];
      only.updateMatrix();
      only.matrixAutoUpdate = false;
      const idx = toRemove.indexOf(only);
      if (idx >= 0) toRemove.splice(idx, 1);
      continue;
    }

    const baked = [];
    let totalVerts = 0;
    for (const mesh of bucket.items) {
      let geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrix);
      if (!geo.attributes.normal) geo.computeVertexNormals();
      totalVerts += geo.attributes.position.count;
      baked.push(geo);
    }

    const posArr = new Float32Array(totalVerts * 3);
    const nrmArr = new Float32Array(totalVerts * 3);
    let offset = 0;
    for (const geo of baked) {
      const p = geo.attributes.position.array;
      const n = geo.attributes.normal.array;
      posArr.set(p, offset * 3);
      nrmArr.set(n, offset * 3);
      offset += geo.attributes.position.count;
      geo.dispose();
    }

    const mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    mergedGeo.setAttribute('normal', new THREE.BufferAttribute(nrmArr, 3));
    mergedGeo.computeBoundingSphere();

    const mergedMesh = new THREE.Mesh(mergedGeo, bucket.mat);
    mergedMesh.castShadow = bucket.cast;
    mergedMesh.receiveShadow = bucket.recv;
    mergedMesh.renderOrder = bucket.order;
    mergedMesh.updateMatrix();
    mergedMesh.matrixAutoUpdate = false;
    rootGroup.add(mergedMesh);
  }

  for (const oldMesh of toRemove) {
    rootGroup.remove(oldMesh);
    if (oldMesh.geometry && (!ownedTemplates || !ownedTemplates.has(oldMesh.geometry))) {
      oldMesh.geometry.dispose();
    }
  }
}

function buildKatherin() {
  if (window.__katherin || typeof arSpots === 'undefined' || !Array.isArray(arSpots) || !arSpots.length) return;
  if (typeof scene === 'undefined' || !scene) return;

  const isTouch = typeof touch !== 'undefined' && !!touch;
  const waterY = typeof WL !== 'undefined' ? WL : 0;

  const bench = arSpots.reduce(
    (best, q) => (Math.hypot(q.x + 15, q.z + 55) < Math.hypot(best.x + 15, best.z + 55) ? q : best),
    arSpots[0]
  );
  const g = new THREE.Group();

  // ---------- Materiales estilo anime (toon de 4 tonos) ----------
  const gradData = new Uint8Array([
    125, 125, 125, 255,
    182, 182, 182, 255,
    228, 228, 228, 255,
    255, 255, 255, 255
  ]);
  const grad = new THREE.DataTexture(gradData, 4, 1, THREE.RGBAFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter;
  grad.generateMipmaps = false;
  if ('NoColorSpace' in THREE) grad.colorSpace = THREE.NoColorSpace;
  grad.needsUpdate = true;

  const mat = (color) => new THREE.MeshToonMaterial({ color, gradientMap: grad });
  const basic = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x352024, side: THREE.BackSide });

  const skin = mat(0xffdfcc), skinShade = mat(0xf3bba3);
  const hair = mat(0x3b2a36), hairLight = mat(0x73505e), brow = mat(0x4d3641);
  const blouse = mat(0xfbf7ef), blouseShade = mat(0xe3dcd1);
  const navy = mat(0x2d3552), ribbon = mat(0xc9445f);
  const skirt = mat(0x3b4463), skirtLight = mat(0x56628a);
  const sock = mat(0x25283a), shoe = mat(0x56372f), soleMat = mat(0x281a17);
  const eyeWhite = mat(0xfffaf5), iris = mat(0x7d4f38), irisLight = mat(0xf0b265), pupil = mat(0x1b1317);
  const lash = mat(0x20151a), lip = mat(0xe07d78);
  const shine = basic(0xffffff), blushM = basic(0xff8c9a, 0.55);

  // ---------- Ayudantes de construcción ----------
  const SPH_HI = new THREE.SphereGeometry(1, 20, 14);
  const SPH_LO = new THREE.SphereGeometry(1, 12, 9);
  const sharedKTemplates = new Set([SPH_HI, SPH_LO]);
  const UP = new THREE.Vector3(0, 1, 0);
  let cur = g, oy = 0, oz = 0, OL = true, CAST = !isTouch, RECV = !isTouch;

  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y - oy, z - oz);
    o.rotation.set(rx, ry, rz);
    o.castShadow = CAST;
    o.receiveShadow = RECV;
    cur.add(o);
    return o;
  };
  const ball = (m, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, hi = true) => {
    const sph = hi ? SPH_HI : SPH_LO;
    const o = add(sph, m, x, y, z, rx, ry, rz);
    o.scale.set(sx, sy, sz);
    if (OL) {
      const l = new THREE.Mesh(sph, lineMat);
      l.position.copy(o.position);
      l.rotation.copy(o.rotation);
      l.scale.set(sx + 0.0065, sy + 0.0065, sz + 0.0065);
      cur.add(l);
    }
    return o;
  };
  const link = (m, a, b, r1, r2 = r1) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const d = new THREE.Vector3().subVectors(B, A);
    const cylGeo = new THREE.CylinderGeometry(r2, r1, d.length(), 12, 1, true);
    const o = add(cylGeo, m, (A.x + B.x) * 0.5, (A.y + B.y) * 0.5, (A.z + B.z) * 0.5);
    o.quaternion.setFromUnitVectors(UP, d.normalize());
    if (OL) {
      const R = Math.max(r1, r2), l = new THREE.Mesh(cylGeo, lineMat);
      l.position.copy(o.position);
      l.quaternion.copy(o.quaternion);
      l.scale.set((R + 0.006) / R, 1, (R + 0.006) / R);
      cur.add(l);
    }
    return o;
  };

  // ---------- Piernas y mocasines apoyados en el suelo ----------
  for (const s of [-1, 1]) {
    link(skin, [s * 0.095, 0.612, 0.09], [s * 0.105, 0.595, 0.32], 0.068, 0.064);
    link(sock, [s * 0.105, 0.595, 0.29], [s * 0.108, 0.58, 0.40], 0.070, 0.068);
    ball(sock, s * 0.108, 0.578, 0.40, 0.070, 0.070, 0.070, 0, 0, 0, false);
    link(sock, [s * 0.108, 0.57, 0.40], [s * 0.112, 0.088, 0.445], 0.064, 0.048);
    ball(soleMat, s * 0.112, 0.015, 0.49, 0.068, 0.015, 0.126, 0, 0, 0, false);
    ball(shoe, s * 0.112, 0.056, 0.49, 0.066, 0.046, 0.120, 0, 0, s * -0.04, false);
    ball(blouseShade, s * 0.112, 0.098, 0.448, 0.052, 0.018, 0.052, 0, 0, 0, false);
  }

  // ---------- Falda plisada elíptica ----------
  const skirtConeGeo = new THREE.CylinderGeometry(0.175, 0.238, 0.19, 24, 1, false);
  sharedKTemplates.add(skirtConeGeo);
  const skirtMesh = add(skirtConeGeo, skirt, 0, 0.655, 0.035);
  skirtMesh.scale.set(1.0, 1.0, 0.76);
  const skirtOutline = new THREE.Mesh(skirtConeGeo, lineMat);
  skirtOutline.position.set(0, 0.655, 0.035);
  skirtOutline.scale.set(1.028, 1.01, 0.785);
  g.add(skirtOutline);

  const pleatGeo = new THREE.BoxGeometry(0.030, 0.175, 0.024);
  sharedKTemplates.add(pleatGeo);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const pleat = new THREE.Mesh(pleatGeo, skirtLight);
    pleat.position.set(Math.sin(a) * 0.202, 0.65, 0.035 + Math.cos(a) * 0.154);
    pleat.rotation.y = a;
    pleat.rotation.x = -0.22;
    pleat.castShadow = !isTouch;
    g.add(pleat);
  }
  ball(skirt, 0, 0.635, 0.195, 0.225, 0.048, 0.165);
  ball(blouseShade, 0, 0.595, 0.205, 0.23, 0.012, 0.17);

  // ---------- Torso, cuello marinero, moño y brazos ----------
  const torsoG = new THREE.Group();
  torsoG.position.set(0, 0.78, 0.025);
  g.add(torsoG);
  cur = torsoG; oy = 0.78; oz = 0.025;

  ball(blouse, 0, 1.02, 0.015, 0.192, 0.30, 0.135);
  ball(blouse, 0, 0.86, 0.02, 0.16, 0.10, 0.118);
  ball(blouse, -0.056, 1.11, 0.09, 0.08, 0.07, 0.07, 0, 0, 0, false);
  ball(blouse, 0.056, 1.11, 0.09, 0.08, 0.07, 0.07, 0, 0, 0, false);
  ball(navy, 0, 1.265, -0.025, 0.195, 0.048, 0.10, 0, 0, 0, false);
  ball(navy, 0, 1.26, 0.05, 0.20, 0.04, 0.125, 0, 0, 0, false);

  const collarGeo = new THREE.BoxGeometry(0.11, 0.14, 0.024);
  sharedKTemplates.add(collarGeo);
  add(collarGeo, navy, -0.072, 1.195, 0.135, -0.2, 0.22, 0.36);
  add(collarGeo, navy, 0.072, 1.195, 0.135, -0.2, -0.22, -0.36);
  add(new THREE.BoxGeometry(0.06, 0.08, 0.022), blouseShade, 0, 1.155, 0.15, -0.15, 0, 0);

  ball(ribbon, -0.048, 1.16, 0.17, 0.052, 0.032, 0.02, 0, 0, 0.3, false);
  ball(ribbon, 0.048, 1.16, 0.17, 0.052, 0.032, 0.02, 0, 0, -0.3, false);
  ball(ribbon, 0, 1.16, 0.176, 0.024, 0.024, 0.02, 0, 0, 0, false);
  ball(ribbon, -0.02, 1.095, 0.165, 0.018, 0.058, 0.012, 0, 0, 0.15, false);
  ball(ribbon, 0.02, 1.095, 0.165, 0.018, 0.058, 0.012, 0, 0, -0.15, false);

  for (const s of [-1, 1]) {
    ball(blouse, s * 0.185, 1.205, 0.025, 0.058, 0.058, 0.058, 0, 0, 0, false);
    link(blouse, [s * 0.19, 1.195, 0.025], [s * 0.232, 0.915, 0.11], 0.05, 0.044);
    ball(blouse, s * 0.232, 0.915, 0.11, 0.044, 0.044, 0.044, 0, 0, 0, false);
    link(blouse, [s * 0.232, 0.915, 0.11], [s * 0.135, 0.732, 0.275], 0.044, 0.038);
    ball(blouseShade, s * 0.135, 0.732, 0.275, 0.043, 0.043, 0.043, 0, 0, 0, false);
    ball(skin, s * 0.068, 0.705, 0.295, 0.048, 0.032, 0.058, 0.12, s * 0.35, 0, false);
  }
  ball(skin, 0, 1.325, 0.035, 0.058, 0.095, 0.058, 0, 0, 0, false);

  // ---------- Cabeza ----------
  const headG = new THREE.Group();
  headG.position.set(0, 1.34 - 0.78, 0.045 - 0.025);
  torsoG.add(headG);
  cur = headG; oy = 1.34; oz = 0.045; OL = true;

  ball(skin, 0, 1.54, 0.055, 0.178, 0.195, 0.168);
  ball(skin, 0, 1.43, 0.077, 0.122, 0.115, 0.118);
  ball(skinShade, -0.17, 1.495, 0.045, 0.022, 0.038, 0.03, 0, 0, 0, false);
  ball(skinShade, 0.17, 1.495, 0.045, 0.022, 0.038, 0.03, 0, 0, 0, false);

  ball(hair, 0, 1.59, -0.005, 0.198, 0.21, 0.185);
  ball(hair, 0, 1.34, -0.068, 0.205, 0.23, 0.088);
  ball(hairLight, 0, 1.35, -0.152, 0.055, 0.15, 0.02, 0, 0, 0, false);
  for (const s of [-1, 1]) {
    ball(hair, s * 0.186, 1.42, 0.08, 0.044, 0.165, 0.052, 0, 0, s * -0.05, false);
    ball(hairLight, s * 0.202, 1.36, 0.096, 0.02, 0.115, 0.028, 0, 0, 0, false);
    ball(hair, s * 0.18, 1.19, 0.085, 0.044, 0.16, 0.058, -0.1, 0, s * -0.04, false);
  }
  ball(hair, 0, 1.69, 0.105, 0.175, 0.06, 0.09, 0, 0, 0, false);
  ball(hair, 0, 1.658, 0.193, 0.052, 0.055, 0.038, 0, 0, 0, false);
  ball(hair, -0.06, 1.65, 0.187, 0.048, 0.06, 0.038, 0, 0, 0.2, false);
  ball(hair, 0.06, 1.65, 0.187, 0.048, 0.06, 0.038, 0, 0, -0.2, false);
  ball(hairLight, -0.03, 1.662, 0.213, 0.016, 0.044, 0.014, 0, 0, 0.12, false);
  ball(hairLight, 0.04, 1.662, 0.213, 0.016, 0.044, 0.014, 0, 0, -0.12, false);
  ball(hair, -0.145, 1.625, 0.125, 0.04, 0.08, 0.05, 0, 0, 0.3, false);
  ball(hair, 0.145, 1.625, 0.125, 0.04, 0.08, 0.05, 0, 0, -0.3, false);
  ball(hair, 0.01, 1.825, 0.025, 0.012, 0.048, 0.012, 0, 0, 0.5, false);
  ball(hair, 0.045, 1.865, 0.025, 0.01, 0.034, 0.01, 0, 0, 1.05, false);
  ball(ribbon, 0.14, 1.71, 0.025, 0.026, 0.026, 0.026, 0, 0, 0, false);
  ball(ribbon, 0.195, 1.74, 0.025, 0.05, 0.03, 0.02, 0, 0, 0.5, false);
  ball(ribbon, 0.185, 1.68, 0.025, 0.05, 0.03, 0.02, 0, 0, -0.5, false);
  ball(ribbon, 0.165, 1.635, 0.015, 0.015, 0.05, 0.012, 0, 0, 0.2, false);

  // ---------- Rostro (sin contorno ni sombras proyectadas para evitar artefactos) ----------
  OL = false; CAST = false; RECV = false;
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    e.position.set(s * 0.07, 1.51 - 1.34, 0.203 - 0.045);
    e.rotation.y = s * 0.38;
    headG.add(e);
    cur = e; oy = 0; oz = 0;
    ball(eyeWhite, 0, 0, 0, 0.051, 0.059, 0.012, 0, 0, 0, false);
    ball(iris, 0, -0.004, 0.007, 0.037, 0.048, 0.009, 0, 0, 0, false);
    ball(irisLight, 0, -0.02, 0.011, 0.028, 0.022, 0.008, 0, 0, 0, false);
    ball(pupil, 0, -0.004, 0.013, 0.016, 0.026, 0.007, 0, 0, 0, false);
    ball(shine, -s * 0.011, 0.017, 0.02, 0.012, 0.012, 0.005, 0, 0, 0, false);
    ball(shine, s * 0.014, -0.022, 0.02, 0.006, 0.006, 0.004, 0, 0, 0, false);
    ball(lash, 0, 0.051, 0.014, 0.058, 0.011, 0.006, 0, 0, s * 0.15, false);
    ball(lash, s * 0.05, 0.047, 0.014, 0.02, 0.007, 0.005, 0, 0, s * 0.75, false);
    ball(skinShade, 0, -0.055, 0.012, 0.04, 0.004, 0.004, 0, 0, 0, false);
    katherinMergeStaticChildren(e, sharedKTemplates);
    eyes.push(e);

    cur = headG; oy = 1.34; oz = 0.045;
    ball(brow, s * 0.076, 1.588, 0.195, 0.038, 0.007, 0.01, 0, s * 0.38, s * 0.12, false);
    ball(blushM, s * 0.098, 1.452, 0.169, 0.034, 0.017, 0.01, 0, s * 0.55, 0, false);
  }
  cur = headG; oy = 1.34; oz = 0.045;
  ball(skinShade, 0, 1.448, 0.206, 0.008, 0.011, 0.008, 0, 0, 0, false);
  ball(lip, 0, 1.396, 0.199, 0.017, 0.0055, 0.006, 0, 0, 0, false);
  const smileBaseY = 1.403 - oy;
  const smileL = ball(lip, -0.021, 1.403, 0.195, 0.008, 0.004, 0.004, 0, 0, 0.5, false);
  const smileR = ball(lip, 0.021, 1.403, 0.195, 0.008, 0.004, 0.004, 0, 0, -0.5, false);
  smileL.userData.dyn = true;
  smileR.userData.dyn = true;
  OL = true; CAST = !isTouch; RECV = !isTouch; cur = g; oy = 0; oz = 0;

  // ---------- Cuaderno con tapas, lomo y separador sobre el asiento ----------
  {
    const coverMat = mat(0x8a5a44);
    const pageMat = mat(0xf2ead8);
    const coverGeo = new THREE.BoxGeometry(0.19, 0.006, 0.26);
    sharedKTemplates.add(coverGeo);
    const bookG = new THREE.Group();
    bookG.position.set(0.26, 0.54, 0.05);
    bookG.rotation.y = 0.35;

    const backCover = new THREE.Mesh(coverGeo, coverMat);
    backCover.position.y = 0.003;
    backCover.castShadow = !isTouch;
    backCover.receiveShadow = !isTouch;

    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.176, 0.018, 0.246), pageMat);
    pages.position.set(0.004, 0.015, 0);

    const frontCover = new THREE.Mesh(coverGeo, coverMat);
    frontCover.position.y = 0.027;
    frontCover.castShadow = !isTouch;
    frontCover.receiveShadow = !isTouch;

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.03, 0.26), coverMat);
    spine.position.set(-0.092, 0.015, 0);

    const bookmark = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.002, 0.045), ribbon);
    bookmark.position.set(0.02, 0.014, 0.135);
    bookmark.rotation.y = 0.22;

    bookG.add(backCover, pages, frontCover, spine, bookmark);
    katherinMergeStaticChildren(bookG, sharedKTemplates);
    g.add(bookG);
  }

  // Fusionar mallas estáticas de cuerpo inferior, torso y cabeza manteniendo articulaciones vivas
  katherinMergeStaticChildren(headG, sharedKTemplates);
  katherinMergeStaticChildren(torsoG, sharedKTemplates);
  katherinMergeStaticChildren(g, sharedKTemplates);
  sharedKTemplates.forEach((tpl) => tpl.dispose());
  sharedKTemplates.clear();

  // Posición de Katherin en la banca
  g.position.set(bench.x, bench.h, bench.z);
  g.rotation.y = bench.a;
  g.position.x += Math.cos(bench.a) * -0.52;
  g.position.z -= Math.sin(bench.a) * -0.52;
  const canCheckPhotos = typeof bgCollected === 'function' && typeof PHOTOS !== 'undefined' && Array.isArray(PHOTOS);
  g.visible = canCheckPhotos ? bgCollected() >= PHOTOS.length : true;
  g.userData.bench = bench;
  g.userData.near = false;
  scene.add(g);
  window.__katherin = g;

  // ---------- Vectores base de la banca y utilidades de terreno ----------
  const fx = Math.sin(bench.a), fz = Math.cos(bench.a);
  const rx = Math.cos(bench.a), rz = -Math.sin(bench.a);

  const sampleGround = (wx, wz, refY = bench.h + 2) => {
    if (typeof ground === 'function') return ground(wx, wz, refY);
    if (typeof hAt === 'function') return hAt(wx, wz);
    return bench.h;
  };
  const isLakeWater = (wx, wz, minDepth = 0.28) => {
    const h = typeof hAt === 'function' ? hAt(wx, wz) : sampleGround(wx, wz, bench.h);
    const inLk = typeof window.__inLake === 'function' ? window.__inLake(wx, wz) : true;
    return Number.isFinite(h) && h < waterY - minDepth && inLk;
  };
  const isDryLand = (cx, cz) => {
    const gy = sampleGround(cx, cz, bench.h + 2);
    const inLk = typeof window.__inLake === 'function' ? window.__inLake(cx, cz) : false;
    return Number.isFinite(gy) && !inLk && gy >= waterY + 0.45 && Math.abs(gy - bench.h) < 1.2 ? gy : null;
  };

  // ---------- Dos cisnes (mallas fusionadas por parte estática, orientación relativa a la banca) ----------
  const swanGroup = new THREE.Group();
  const swanBodyMat = mat(0xf5f2ea), swanWingMat = mat(0xe0ddd3);
  const swanBeakMat = mat(0xdf892b), swanBlackMat = mat(0x1e1d1b);

  const swanBodyGeo = new THREE.SphereGeometry(1, 18, 12);
  const swanTailGeo = new THREE.ConeGeometry(0.14, 0.34, 8);
  const swanWingGeo = new THREE.SphereGeometry(1, 14, 10);
  const swanNeckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.22, 0.34),
    new THREE.Vector3(0, 0.44, 0.42),
    new THREE.Vector3(0, 0.66, 0.37),
    new THREE.Vector3(0, 0.77, 0.42)
  ]);
  const swanNeckGeo = new THREE.TubeGeometry(swanNeckCurve, 16, 0.068, 9, false);
  const swanHeadGeo = new THREE.SphereGeometry(0.105, 14, 10);
  const swanKnobGeo = new THREE.SphereGeometry(0.036, 9, 7);
  const swanBeakGeo = new THREE.ConeGeometry(0.052, 0.17, 9);
  const swanEyeGeo = new THREE.SphereGeometry(0.019, 8, 6);
  const swanRippleGeo = new THREE.RingGeometry(0.45, 0.53, 24);
  const swanTemplates = new Set([swanBodyGeo, swanTailGeo, swanWingGeo, swanNeckGeo, swanHeadGeo, swanKnobGeo, swanBeakGeo, swanEyeGeo]);

  function makeSwan(px, pz, side) {
    const sw = new THREE.Group();
    const sBody = new THREE.Mesh(swanBodyGeo, swanBodyMat);
    sBody.scale.set(0.32, 0.21, 0.56);
    sBody.position.set(0, 0.20, 0);
    sw.add(sBody);

    const tail = new THREE.Mesh(swanTailGeo, swanBodyMat);
    tail.rotation.x = -Math.PI * 0.38;
    tail.scale.set(1.2, 1, 0.45);
    tail.position.set(0, 0.31, -0.52);
    sw.add(tail);

    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(swanWingGeo, swanWingMat);
      wing.scale.set(0.11, 0.14, 0.42);
      wing.position.set(sx * 0.24, 0.31, -0.06);
      wing.rotation.set(0.08, sx * -0.10, sx * -0.25);
      sw.add(wing);
    }
    sw.add(new THREE.Mesh(swanNeckGeo, swanBodyMat));
    katherinMergeStaticChildren(sw, swanTemplates);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.78, 0.43);
    sw.add(headPivot);

    const head = new THREE.Mesh(swanHeadGeo, swanBodyMat);
    head.scale.set(0.92, 0.94, 1.12);
    headPivot.add(head);

    const knob = new THREE.Mesh(swanKnobGeo, swanBlackMat);
    knob.position.set(0, 0.025, 0.105);
    headPivot.add(knob);

    const beak = new THREE.Mesh(swanBeakGeo, swanBeakMat);
    beak.rotation.x = Math.PI / 2;
    beak.scale.set(1.0, 1.0, 0.62);
    beak.position.set(0, -0.015, 0.165);
    headPivot.add(beak);

    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(swanEyeGeo, swanBlackMat);
      eye.position.set(sx * 0.082, 0.025, 0.045);
      headPivot.add(eye);
    }
    katherinMergeStaticChildren(headPivot, swanTemplates);

    const rMat = new THREE.MeshBasicMaterial({ color: 0xdff4fa, transparent: true, opacity: 0.3, depthWrite: false });
    const ripple = new THREE.Mesh(swanRippleGeo, rMat);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 0.02;
    ripple.userData.dyn = true;
    sw.add(ripple);

    sw.position.set(px, waterY + 0.015, pz);
    const rot0 = bench.a + Math.PI + side * 0.42;
    sw.userData = { x0: px, z0: pz, y0: sw.position.y, rot0, side, headPivot, ripple };
    sw.rotation.y = rot0;
    sw.scale.setScalar(0.9);
    swanGroup.add(sw);
  }

  function findLakeWaterSpot(sideOffset, avoidPos = null) {
    for (const da of [0, 0.25, -0.25, 0.5, -0.5, 0.8, -0.8]) {
      const ang = bench.a + da;
      const sx = Math.sin(ang), sz = Math.cos(ang);
      for (let dist = 5.0; dist <= 24.0; dist += 0.8) {
        const px = bench.x + sx * dist + rx * sideOffset;
        const pz = bench.z + sz * dist + rz * sideOffset;
        if (avoidPos && Math.hypot(px - avoidPos[0], pz - avoidPos[1]) < 1.8) continue;
        if (
          isLakeWater(px, pz) &&
          isLakeWater(px + 0.55, pz) &&
          isLakeWater(px - 0.55, pz) &&
          isLakeWater(px, pz + 0.55) &&
          isLakeWater(px, pz - 0.55)
        ) {
          return [px, pz];
        }
      }
    }
    return [bench.x + fx * 8.5 + rx * sideOffset, bench.z + fz * 8.5 + rz * sideOffset];
  }

  const swPosL = findLakeWaterSpot(-1.1);
  const swPosR = findLakeWaterSpot(1.1, swPosL);
  makeSwan(swPosL[0], swPosL[1], -1);
  makeSwan(swPosR[0], swPosR[1], 1);
  swanTemplates.forEach((tpl) => tpl.dispose());
  swanTemplates.clear();
  swanGroup.userData.isParkSwans = true;
  scene.add(swanGroup);
  window.__boisParkSwans = swanGroup;

  // ---------- Entorno del parque: sombra de contacto, flores, nenúfares, juncos, cerezo y pétalos instanciados ----------
  const parkDecor = new THREE.Group();
  scene.add(parkDecor);
  window.__boisParkDecor = parkDecor;

  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();

  // Sombra suave bajo la banca para anclar visualmente el conjunto al suelo
  {
    const shCv = document.createElement('canvas');
    shCv.width = shCv.height = 64;
    const shCtx = shCv.getContext('2d');
    const gr = shCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
    gr.addColorStop(0, 'rgba(10,16,12,0.44)');
    gr.addColorStop(0.55, 'rgba(10,16,12,0.18)');
    gr.addColorStop(1, 'rgba(10,16,12,0)');
    shCtx.fillStyle = gr;
    shCtx.fillRect(0, 0, 64, 64);
    const shTex = new THREE.CanvasTexture(shCv);
    const shPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 1.35),
      new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    );
    shPlane.rotation.x = -Math.PI / 2;
    shPlane.rotation.z = bench.a;
    shPlane.position.set(bench.x, bench.h + 0.025, bench.z);
    shPlane.updateMatrix();
    shPlane.matrixAutoUpdate = false;
    parkDecor.add(shPlane);
  }

  // 1) Flores silvestres instanciadas (3 draw calls en total)
  const flowerSpecs = [
    [bench.x - rx * 1.45 - fx * 0.35, bench.z - rz * 1.45 - fz * 0.35, 6, 0xff8fab],
    [bench.x + rx * 1.55 - fx * 0.25, bench.z + rz * 1.55 - fz * 0.25, 5, 0xffffff],
    [bench.x - rx * 2.15 + fx * 0.35, bench.z - rz * 2.15 + fz * 0.35, 6, 0xffe066]
  ];
  const flowerEntries = [];
  for (const [cx, cz, count, hex] of flowerSpecs) {
    const gy = isDryLand(cx, cz);
    if (gy === null) continue;
    for (let i = 0; i < count; i++) {
      const ang = i * 2.399, d = 0.08 + (i % 3) * 0.08, h = 0.18 + (i % 4) * 0.045;
      const wx = cx + Math.cos(ang) * d, wz = cz + Math.sin(ang) * d;
      const wy = sampleGround(wx, wz, gy);
      flowerEntries.push({ x: wx, y: Math.abs(wy - gy) < 0.25 ? wy : gy, z: wz, h, hex });
    }
  }
  if (flowerEntries.length) {
    const stemGeo = new THREE.CylinderGeometry(0.008, 0.011, 1, 5);
    const centerGeo = new THREE.SphereGeometry(0.028, 7, 5);
    const petalGeo = new THREE.SphereGeometry(0.042, 7, 5);
    petalGeo.scale(0.65, 0.2, 1.25);

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x2f6d2c, roughness: 0.9 });
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xf4c430, roughness: 0.6 });
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, side: THREE.DoubleSide });

    const stemsIM = new THREE.InstancedMesh(stemGeo, stemMat, flowerEntries.length);
    const centersIM = new THREE.InstancedMesh(centerGeo, centerMat, flowerEntries.length);
    const petalsIM = new THREE.InstancedMesh(petalGeo, petalMat, flowerEntries.length * 5);

    let pIdx = 0;
    flowerEntries.forEach((f, idx) => {
      dummy.position.set(f.x, f.y + f.h * 0.5, f.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, f.h, 1);
      dummy.updateMatrix();
      stemsIM.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(f.x, f.y + f.h, f.z);
      dummy.rotation.set(0.25, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      centersIM.setMatrixAt(idx, dummy.matrix);

      tmpColor.setHex(f.hex);
      for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * Math.PI * 2;
        dummy.position.set(f.x + Math.sin(pa) * 0.042, f.y + f.h, f.z + Math.cos(pa) * 0.042);
        dummy.rotation.set(0.18, pa, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        petalsIM.setMatrixAt(pIdx, dummy.matrix);
        petalsIM.setColorAt(pIdx, tmpColor);
        pIdx++;
      }
    });
    if (petalsIM.instanceColor) petalsIM.instanceColor.needsUpdate = true;
    [stemsIM, centersIM, petalsIM].forEach((im) => {
      im.instanceMatrix.needsUpdate = true;
      if (typeof im.computeBoundingSphere === 'function') im.computeBoundingSphere();
      im.updateMatrix();
      im.matrixAutoUpdate = false;
      parkDecor.add(im);
    });
  }

  // 2) Nenúfares en el agua cercana a la orilla (InstancedMesh)
  const lilySpots = [];
  for (const side of [-3.4, -2.2, 2.3, 3.6]) {
    for (let dist = 2.6; dist <= 9.0; dist += 0.7) {
      const lx = bench.x + fx * dist + rx * side;
      const lz = bench.z + fz * dist + rz * side;
      if (isLakeWater(lx, lz, 0.14)) {
        for (let k = 0; k < 3; k++) {
          const ox = Math.cos(k * 2.1 + side) * (0.35 + k * 0.16);
          const oz = Math.sin(k * 2.1 + side) * (0.35 + k * 0.16);
          if (isLakeWater(lx + ox, lz + oz, 0.10)) {
            lilySpots.push({ x: lx + ox, z: lz + oz, r: 0.18 + (k % 3) * 0.06, rot: k * 1.9 + side, flower: k === 0 });
          }
        }
        break;
      }
    }
  }
  if (lilySpots.length) {
    const padGeo = new THREE.CircleGeometry(1, 14, 0, Math.PI * 1.85);
    padGeo.rotateX(-Math.PI / 2);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x3b7a42, roughness: 0.8, side: THREE.DoubleSide });
    const padsIM = new THREE.InstancedMesh(padGeo, padMat, lilySpots.length);

    const lotusSpots = lilySpots.filter((s) => s.flower);
    const lotusGeo = new THREE.ConeGeometry(0.085, 0.08, 7);
    lotusGeo.rotateX(Math.PI);
    const lotusMat = new THREE.MeshStandardMaterial({ color: 0xffe4ec, roughness: 0.65 });
    const lotusIM = lotusSpots.length ? new THREE.InstancedMesh(lotusGeo, lotusMat, lotusSpots.length) : null;

    let lIdx = 0;
    lilySpots.forEach((s, idx) => {
      dummy.position.set(s.x, waterY + 0.016, s.z);
      dummy.rotation.set(0, s.rot, 0);
      dummy.scale.set(s.r, 1, s.r);
      dummy.updateMatrix();
      padsIM.setMatrixAt(idx, dummy.matrix);
      if (s.flower && lotusIM) {
        dummy.position.set(s.x, waterY + 0.055, s.z);
        dummy.rotation.set(0, s.rot, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        lotusIM.setMatrixAt(lIdx++, dummy.matrix);
      }
    });
    padsIM.instanceMatrix.needsUpdate = true;
    if (typeof padsIM.computeBoundingSphere === 'function') padsIM.computeBoundingSphere();
    padsIM.updateMatrix();
    padsIM.matrixAutoUpdate = false;
    parkDecor.add(padsIM);
    if (lotusIM) {
      lotusIM.instanceMatrix.needsUpdate = true;
      if (typeof lotusIM.computeBoundingSphere === 'function') lotusIM.computeBoundingSphere();
      lotusIM.updateMatrix();
      lotusIM.matrixAutoUpdate = false;
      parkDecor.add(lotusIM);
    }
  }

  // 3) Juncos en la franja de orilla a los costados de la vista (InstancedMesh)
  const reedSpots = [];
  for (const side of [-4.2, -3.0, 3.1, 4.4]) {
    for (let dist = 1.2; dist <= 8.5; dist += 0.5) {
      const jx = bench.x + fx * dist + rx * side;
      const jz = bench.z + fz * dist + rz * side;
      const gy = sampleGround(jx, jz, bench.h + 1);
      if (Number.isFinite(gy) && gy >= waterY - 0.16 && gy <= waterY + 0.32) {
        for (let k = 0; k < 5; k++) {
          const a = k * 1.25 + side;
          const r = 0.08 + (k % 3) * 0.11;
          const h = 0.65 + (k % 4) * 0.14;
          reedSpots.push({
            x: jx + Math.cos(a) * r,
            y: gy,
            z: jz + Math.sin(a) * r,
            h,
            tiltX: Math.sin(a) * 0.08,
            tiltZ: Math.cos(a) * 0.08,
            hasTip: k % 2 === 0
          });
        }
        break;
      }
    }
  }
  if (reedSpots.length) {
    const reedGeo = new THREE.CylinderGeometry(0.011, 0.018, 1, 5);
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x456b34, roughness: 0.9 });
    const reedsIM = new THREE.InstancedMesh(reedGeo, reedMat, reedSpots.length);

    const tipSpots = reedSpots.filter((r) => r.hasTip);
    const tipGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.16, 6);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x5c3a24, roughness: 0.95 });
    const tipsIM = tipSpots.length ? new THREE.InstancedMesh(tipGeo, tipMat, tipSpots.length) : null;

    let tIdx = 0;
    reedSpots.forEach((r, idx) => {
      dummy.position.set(r.x, r.y + r.h * 0.5, r.z);
      dummy.rotation.set(r.tiltX, 0, r.tiltZ);
      dummy.scale.set(1, r.h, 1);
      dummy.updateMatrix();
      reedsIM.setMatrixAt(idx, dummy.matrix);

      if (r.hasTip && tipsIM) {
        dummy.position.set(r.x + r.tiltZ * -0.15, r.y + r.h - 0.1, r.z + r.tiltX * 0.15);
        dummy.rotation.set(r.tiltX, 0, r.tiltZ);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        tipsIM.setMatrixAt(tIdx++, dummy.matrix);
      }
    });
    reedsIM.instanceMatrix.needsUpdate = true;
    if (typeof reedsIM.computeBoundingSphere === 'function') reedsIM.computeBoundingSphere();
    reedsIM.updateMatrix();
    reedsIM.matrixAutoUpdate = false;
    parkDecor.add(reedsIM);
    if (tipsIM) {
      tipsIM.instanceMatrix.needsUpdate = true;
      if (typeof tipsIM.computeBoundingSphere === 'function') tipsIM.computeBoundingSphere();
      tipsIM.updateMatrix();
      tipsIM.matrixAutoUpdate = false;
      parkDecor.add(tipsIM);
    }
  }

  // 4) Cerezo ornamental detrás/al lado de la banca (tronco y copas fusionados)
  const tx = bench.x - rx * 2.7 - fx * 1.5;
  const tz = bench.z - rz * 2.7 - fz * 1.5;
  const ty = isDryLand(tx, tz);
  let sakuraAnchor = null;

  if (ty !== null) {
    sakuraAnchor = new THREE.Vector3(tx, ty, tz);
    const sak = new THREE.Group();
    sak.position.set(tx, ty - 0.06, tz);
    const barkM = new THREE.MeshStandardMaterial({ color: 0x4b3329, roughness: 0.92, flatShading: true });
    const sakM = [
      new THREE.MeshStandardMaterial({ color: 0xf7a8bd, roughness: 0.85, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0xfdc5d4, roughness: 0.85, flatShading: true })
    ];
    const br = (a, b, r0, r1) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const dr = new THREE.Vector3().subVectors(B, A);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, dr.length(), 7), barkM);
      m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(UP, dr.normalize());
      m.castShadow = !isTouch;
      sak.add(m);
    };
    br([0, 0, 0], [0.08, 1.55, -0.05], 0.32, 0.19);
    br([0.08, 1.45, -0.05], [0.92, 2.45, 0.30], 0.15, 0.08);
    br([0.08, 1.48, -0.05], [-0.85, 2.55, -0.28], 0.14, 0.08);

    const canopyGeo = new THREE.IcosahedronGeometry(1, 1);
    const sakTemplates = new Set([canopyGeo]);
    [
      [0.05, 3.2, 0, 1.4, 0.85, 1.3, 0],
      [1.0, 2.65, 0.35, 1.0, 0.68, 0.98, 1],
      [-0.9, 2.7, -0.32, 1.05, 0.7, 1.0, 0]
    ].forEach((p) => {
      const pf = new THREE.Mesh(canopyGeo, sakM[p[6]]);
      pf.position.set(p[0], p[1], p[2]);
      pf.scale.set(p[3], p[4], p[5]);
      pf.castShadow = !isTouch;
      sak.add(pf);
    });
    katherinMergeStaticChildren(sak, sakTemplates);
    canopyGeo.dispose();
    sak.updateMatrix();
    sak.matrixAutoUpdate = false;
    parkDecor.add(sak);
  }

  // 5) Pétalos de cerezo caídos alrededor de la banca + pétalos flotando (ambos en InstancedMesh = 2 draw calls)
  let petalsIM = null;
  const petalStates = [];
  if (sakuraAnchor) {
    const leafMat = new THREE.MeshBasicMaterial({ color: 0xffc6d6, side: THREE.DoubleSide });
    const leafGeo = new THREE.PlaneGeometry(0.068, 0.046);

    const fallenIM = new THREE.InstancedMesh(leafGeo, leafMat, 16);
    for (let i = 0; i < 16; i++) {
      const ang = i * 2.39996;
      const dist = 0.5 + (i % 5) * 0.55;
      const px = bench.x - rx * 0.6 + Math.cos(ang) * dist;
      const pz = bench.z - rz * 0.6 + Math.sin(ang) * dist;
      const py = sampleGround(px, pz, bench.h + 1);
      dummy.position.set(px, Math.max(waterY + 0.02, py + 0.024), pz);
      dummy.rotation.set(-Math.PI / 2, ang * 1.7, 0);
      const sc = 0.75 + (i % 3) * 0.22;
      dummy.scale.set(sc, sc, 1);
      dummy.updateMatrix();
      fallenIM.setMatrixAt(i, dummy.matrix);
    }
    fallenIM.instanceMatrix.needsUpdate = true;
    if (typeof fallenIM.computeBoundingSphere === 'function') fallenIM.computeBoundingSphere();
    fallenIM.updateMatrix();
    fallenIM.matrixAutoUpdate = false;
    parkDecor.add(fallenIM);

    const PETAL_N = 12;
    petalsIM = new THREE.InstancedMesh(leafGeo, leafMat, PETAL_N);
    petalsIM.frustumCulled = false;
    for (let i = 0; i < PETAL_N; i++) {
      petalStates.push({
        ox: (Math.random() - 0.5) * 2.8,
        oz: (Math.random() - 0.5) * 2.8,
        y: Math.random() * 3.1,
        sp: 0.18 + Math.random() * 0.16,
        ph: Math.random() * 6.283
      });
    }
    parkDecor.add(petalsIM);
  }

  // ---------- Animación idle: entorno vivo + Katherin (sin asignaciones de memoria por frame) ----------
  let blinkCooldown = 2.0 + Math.random() * 2.0;
  let blinkProgress = -1;
  let lookY = 0;
  let lastIdleT = 0;
  const _petalDummy = new THREE.Object3D();

  function stepKatherin(dt, t) {
    if (window.__katherin !== g) return;
    const sOk = typeof S !== 'undefined' && !!S;
    const cinOn = typeof CIN !== 'undefined' && !!CIN.on;
    const prOn = typeof PR !== 'undefined' && !!PR.on;
    if (document.hidden || ((!sOk || !S.on) && !cinOn) || prOn) return;

    const stepDt = Math.min(0.05, Math.max(0.001, dt || 0.016));
    const time = Number.isFinite(t) ? t : performance.now() / 1000;
    const distBench = sOk ? Math.hypot(S.x - g.position.x, S.z - g.position.z) : 0;
    const nearBench = !sOk || distBench < 32;

    // Aviso de llegada al Capítulo III al aproximarse al Parque de los Cisnes con las 6 fotos
    if (g.visible && sOk && S.on && !cinOn && distBench < 40) {
      const f = (typeof STORY !== 'undefined' && STORY && STORY.flags) || {};
      if (!f.metKatherin && !f.ch3_arrived && typeof storyFlag === 'function') {
        storyFlag('ch3_arrived', 1);
        if (typeof showMsg === 'function') {
          showMsg(!f.glasses
            ? 'Capítulo III · El Parque de los Cisnes · la vista se empaña cerca de la orilla…'
            : 'Capítulo III · El Parque de los Cisnes · alguien espera junto al lago');
        }
      }
    }

    // 1. Entorno (cisnes y pétalos instanciados)
    if (nearBench) {
      swanGroup.children.forEach((sw, i) => {
        const u = sw.userData;
        const driftPhase = time * 0.22 + i * 2.8;
        const dx = Math.sin(driftPhase) * 0.28;
        const dz = Math.cos(driftPhase * 0.7) * 0.22;
        sw.position.set(u.x0 + dx, u.y0 + Math.sin(time * 1.1 + i * 2) * 0.012, u.z0 + dz);
        sw.rotation.y = u.rot0 + Math.sin(time * 0.35 + i) * 0.14;
        if (u.headPivot) {
          u.headPivot.rotation.y = Math.sin(time * 0.75 + i * 2.4) * 0.16;
          u.headPivot.rotation.x = Math.sin(time * 0.55 + i) * 0.04;
        }
        if (u.ripple) {
          const phase = (time * 0.32 + i * 0.5) % 1;
          const rs = 1 + phase * 0.55;
          u.ripple.scale.set(rs, rs, 1);
          u.ripple.material.opacity = Math.sin(phase * Math.PI) * 0.34;
        }
      });

      if (sakuraAnchor && petalsIM) {
        petalsIM.visible = true;
        for (let i = 0; i < petalStates.length; i++) {
          const u = petalStates[i];
          u.y -= u.sp * stepDt;
          if (u.y < 0.05) u.y = 3.1;
          const fallRatio = 1 - u.y / 3.1;
          _petalDummy.position.set(
            sakuraAnchor.x + u.ox + rx * fallRatio * 1.4 + Math.sin(time * 0.7 + u.ph) * 0.45,
            sakuraAnchor.y + u.y,
            sakuraAnchor.z + u.oz + rz * fallRatio * 1.4 + Math.cos(time * 0.6 + u.ph) * 0.35
          );
          _petalDummy.rotation.set(time * 0.8 + u.ph, time * 0.5, time * 0.3);
          _petalDummy.updateMatrix();
          petalsIM.setMatrixAt(i, _petalDummy.matrix);
        }
        petalsIM.instanceMatrix.needsUpdate = true;
      }
    } else if (petalsIM && petalsIM.visible) {
      petalsIM.visible = false;
    }

    // 2. Personaje (solo cuando es visible)
    if (!g.visible) return;

    const breath = 1 + Math.sin(time * 1.6) * 0.006;
    torsoG.scale.y = breath;
    headG.scale.y = 1 / breath;

    headG.rotation.z = Math.sin(time * 0.5) * 0.02;
    headG.rotation.x = 0.04 + Math.sin(time * 0.7) * 0.01;

    let target = 0;
    if (sOk && (S.on || cinOn) && Number.isFinite(S.x) && Number.isFinite(S.z)) {
      const dx = S.x - g.position.x, dz = S.z - g.position.z;
      if (Math.hypot(dx, dz) < 8) {
        let a = Math.atan2(dx, dz) - g.rotation.y;
        a = Math.atan2(Math.sin(a), Math.cos(a));
        target = Math.max(-0.6, Math.min(0.6, a));
      }
    }
    if (target === 0 && !cinOn) {
      const ph = (time % 14) / 14;
      if (ph > 0.55 && ph < 0.75) {
        target = 0.35 * Math.sin(((ph - 0.55) / 0.2) * Math.PI) * (Math.floor(time / 14) % 2 ? 1 : -1);
      }
    }
    lookY += (target - lookY) * Math.min(1, stepDt * 3.4);
    headG.rotation.y = lookY;

    const met = typeof STORY !== 'undefined' && STORY && STORY.flags && STORY.flags.metKatherin;
    const sm = (met ? 1.25 : 1) + Math.sin(time * 0.3) * 0.06;
    const liftY = met ? 0.0018 : 0;
    smileL.position.y = smileBaseY + liftY;
    smileR.position.y = smileBaseY + liftY;
    smileL.scale.set(0.008 * sm, 0.004 * sm, 0.004);
    smileR.scale.set(0.008 * sm, 0.004 * sm, 0.004);

    if (blinkProgress >= 0) {
      blinkProgress += stepDt;
      const dur = 0.15;
      if (blinkProgress >= dur) {
        blinkProgress = -1;
        blinkCooldown = 2.4 + Math.random() * 3.2;
        for (const e of eyes) e.scale.y = 1;
      } else {
        const sc = Math.max(0.08, Math.abs(1 - blinkProgress / (dur * 0.5)));
        for (const e of eyes) e.scale.y = sc;
      }
    } else {
      blinkCooldown -= stepDt;
      if (blinkCooldown <= 0) blinkProgress = 0;
    }
  }

  window.__boisKatherinFrame = stepKatherin;
  if (!window.__boisMainLoopUnified) {
    (function idle() {
      if (window.__katherin !== g) return;
      requestAnimationFrame(idle);
      const t = performance.now() / 1000;
      const dt = lastIdleT ? t - lastIdleT : 0.016;
      lastIdleT = t;
      stepKatherin(dt, t);
    })();
  }
}

function katherinCh3Pad(freqs, dur, vol) {
  try {
    const C = typeof AU !== 'undefined' && AU.ctx;
    if (!C || !AU.on) return;
    const t = C.currentTime, lp = C.createBiquadFilter(), m = C.createGain();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    m.gain.setValueAtTime(0.0001, t);
    m.gain.linearRampToValueAtTime(vol || 0.032, t + dur * 0.3);
    m.gain.linearRampToValueAtTime(0.0001, t + dur);
    lp.connect(m);
    m.connect(C.destination);
    let left = freqs.length;
    freqs.forEach((f, i) => {
      const o = C.createOscillator();
      o.type = i % 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      o.connect(lp);
      o.onended = () => {
        try {
          o.disconnect();
          if (--left <= 0) {
            lp.disconnect();
            m.disconnect();
          }
        } catch (_) {}
      };
      o.start(t);
      o.stop(t + dur + 0.12);
    });
  } catch (e) {
    if (typeof __bw === 'function') __bw('30-katherin#pad', e);
  }
}

function canInteractWithKatherin() {
  const g = window.__katherin;
  const sOk = typeof S !== 'undefined' && S && S.on;
  const cinOn = typeof CIN !== 'undefined' && !!CIN.on;
  const prOn = typeof PR !== 'undefined' && !!PR.on;
  const ch6On = !!(window.__boisCh6 && window.__boisCh6.on);
  const carOn = typeof CAR !== 'undefined' && !!CAR.on;
  if (!g || !g.visible || !sOk || cinOn || prOn || ch6On || carOn) return null;
  if (Math.abs(S.y - g.position.y) >= 5) return null;
  return g;
}

function checkKatherinNearby() {
  const g = canInteractWithKatherin();
  if (!g) {
    if (window.__katherin) window.__katherin.userData.near = false;
    return;
  }
  const d = Math.hypot(S.x - g.position.x, S.z - g.position.z);
  if (d < 3.5) {
    const sit = !!window.__boisSitting;
    if (!g.userData.near || g.userData.lastSit !== sit) {
      g.userData.near = true;
      g.userData.lastSit = sit;
      const flags = (typeof STORY !== 'undefined' && STORY && STORY.flags) || {};
      const needGlasses = !flags.metKatherin && !flags.glasses && window.__glasses && window.__glasses.visible;
      const prompt = needGlasses
        ? 'Figura en la banca · E: observar'
        : !flags.metKatherin
          ? 'Joven junto al lago · E: acercarte'
          : sit
            ? 'Junto a Katherin · E: hablar · F: levantarte · B: cajita de música'
            : 'Katherin · E: hablar · F: sentarte · B: cajita de música';
      showMsg(prompt);
    }
  } else {
    g.userData.near = false;
  }
}

function katherinContext() {
  let night = 0, rain = 0, tdx = 0;
  try {
    night = (typeof PC !== 'undefined' && PC && PC.night) || 0;
    rain = (typeof WX !== 'undefined' && WX && WX.st && WX.st.rain) || 0;
    tdx = typeof tod !== 'undefined' ? tod : 0;
  } catch (e) {
    if (typeof __bw === 'function') __bw('30-katherin#1', e);
  }
  return { night, rain, tod: tdx };
}

function katherinStage() {
  const f = (typeof STORY !== 'undefined' && STORY && STORY.flags) || {};
  return f.ch7_complete ? 5 : f.ch6_complete ? 4 : f.ch5_complete ? 3 : f.ch4_complete ? 2 : 1;
}

const KATHERIN_OPENERS = {
  rain: [
    { t: 'La lluvia cae despacio sobre el agua. Katherin apoya los codos en las rodillas y observa las ondas.' },
    { who: 'Katherin', t: 'Me gusta cómo suena la lluvia sobre el lago.' }
  ],
  night: [
    { t: 'La banca queda justo al borde de la luz. Katherin mira el reflejo oscuro del agua.' },
    { who: 'Katherin', t: 'De noche todo suena más tranquilo.' }
  ],
  dawn: [{ t: 'La luz clara del amanecer toca el agua. Katherin mira hacia la otra orilla en silencio.' }],
  sunset: [
    { t: 'La tarde tiñe el lago de naranja suave. Ninguno de los dos dice nada durante unos segundos.' },
    { who: 'Katherin', t: 'A esta hora el parque se siente menos pesado.' }
  ]
};

const KATHERIN_TALKS = {
  1: [
    [
      { who: 'Katherin', t: '¿Estabas buscando algo en el parque?' },
      { who: 'Tú', t: 'No estoy seguro… solo sentía que tenía que entender qué pasó aquí.' },
      { who: 'Katherin', t: 'Yo solo vine a sentarme un rato. A veces uno piensa demasiado cuando nadie dice nada.' },
      { type: 'layer', layer: 'hoy', t: 'Su cara era neutral. En 2025 llenabas cada silencio con hipótesis.' }
    ],
    [
      { who: 'Katherin', t: 'Los cisnes llevan rato dando vueltas en el mismo punto.' },
      { who: 'Tú', t: 'Dos. Siempre los cuento.' },
      { who: 'Katherin', t: 'Eso se parece bastante a ti: fijarte en los detalles que los demás pasan por alto.' }
    ],
    [
      { who: 'Katherin', t: 'No hace falta que inventes un tema de conversación.' },
      { who: 'Tú', t: 'Es que cuando hay silencio siento que estoy incomodando.' },
      { who: 'Katherin', t: 'No incomodas. Yo también suelo quedarme callada cuando me gusta estar tranquila.' }
    ]
  ],
  2: [
    [
      { who: 'Katherin', t: 'Toro… así te decían en el salón, ¿no?' },
      { who: 'Tú', t: 'Sí. Aunque a veces sentía que solo me veían cuando resolvía algo.' },
      { who: 'Katherin', t: 'Yo también vi el día que prestaste tu computador e hiciste la mezcla. Todos te lo agradecieron de verdad.' }
    ],
    [
      { who: 'Katherin', t: 'Estuviste en El Colegio.' },
      { who: 'Tú', t: 'Me acordé del bus de las seis y media. Y de esperar un mensaje mirando el reloj.' },
      { who: 'Katherin', t: 'Qué largo se hace esperar cuando uno no sabe qué va a pasar.' }
    ],
    [
      { who: 'Katherin', t: '¿Sigues intentando calcular si hiciste todo perfecto?' },
      { who: 'Tú', t: 'Un poco. Me cuesta creer que valgo si no saco un buen resultado.' },
      { who: 'Katherin', t: 'No todo problema tiene una fórmula, Toro. Tampoco tú.' }
    ],
    [
      { who: 'Katherin', t: 'A veces miras el suelo cuando hablas.' },
      { who: 'Tú', t: 'No es indiferencia. Es que me da pena sostener la mirada demasiado tiempo.' },
      { who: 'Katherin', t: 'Lo sé. Se nota que estabas haciendo tu mejor esfuerzo.' }
    ]
  ],
  3: [
    [
      { who: 'Katherin', t: '¿Te acuerdas de la actividad de Cátedra de Paz?' },
      { who: 'Tú', t: 'Nos dividimos nueve y nueve. Yo pensé que todos iban a poner solo que era bueno en matemáticas.' },
      { who: 'Katherin', t: 'Y escribimos lo que de verdad veíamos en ti. Eso también era real.' }
    ],
    [
      { who: 'Katherin', t: 'Guardaste la hoja del cuaderno.' },
      { who: 'Tú', t: 'Me temblaron las piernas cuando la leí. Cinco palabras me hicieron ruido todo el año.' },
      { who: 'Katherin', t: 'Solo escribí lo que eras: reservado, amable y enfocado. Sin ningún misterio.' }
    ],
    [
      { who: 'Katherin', t: 'A veces confundías un gesto pequeño con un examen.' },
      { who: 'Tú', t: 'Cada vez lo veo más claro. Yo imaginaba una película entera donde tú solo estabas ahí.' },
      { who: 'Katherin', t: 'Y aun así, estar ahí también valía.' }
    ]
  ],
  4: [
    [
      { who: 'Katherin', t: 'Te ves distinto desde que subiste a las torres.' },
      { who: 'Tú', t: 'Estaba mirando cuánto tiempo pasé midiendo mi vida como si fuera una ecuación.' },
      { who: 'Katherin', t: '¿Y encontraste alguna respuesta?' },
      { who: 'Tú', t: 'Que no tenía que hacerlo perfectamente. Tenía dieciséis años y estaba aprendiendo.' }
    ],
    [
      { who: 'Katherin', t: 'Recuerdo aquel ensayo en la casa grande… las dos ventanas.' },
      { who: 'Tú', t: 'Tú mirabas por una y yo me fui a la contraria para no estorbar.' },
      { who: 'Katherin', t: 'Dos personas reservadas mirando el mismo paisaje desde lados opuestos. No estuvo mal.' }
    ],
    [
      { who: 'Katherin', t: 'Gracias por sentarte aquí sin querer resolver nada.' },
      { who: 'Tú', t: 'Hoy solo quería acompañar el silencio.' },
      { t: 'El lago sigue moviéndose frente a ustedes, sin ninguna prisa.' }
    ]
  ],
  5: [
    [
      { who: 'Katherin', t: 'Ya no miras cada gesto mío como si escondiera una clave.' },
      { who: 'Tú', t: 'Creo que entendí la diferencia entre lo que pasa y lo que mi cabeza construye encima.' },
      { who: 'Katherin', t: 'Eso da mucha paz.' }
    ],
    [
      { who: 'Katherin', t: 'Tal vez nunca sepamos exactamente qué pensaba el otro en cada ensayo.' },
      { who: 'Tú', t: 'No necesito saber qué significó para ti para saber cuánto significó para mí.' },
      { who: 'Katherin', t: 'Con eso basta.' }
    ],
    [
      { who: 'Katherin', t: 'Hoy el agua está quieta.' },
      { who: 'Tú', t: 'Y por unos segundos no estoy pensando en qué significa. Solo estoy aquí.' },
      { who: 'Katherin', t: 'Quizá de eso se trataba aprender a estar presente.' }
    ],
    [
      { who: 'Katherin', t: 'Cuando sigas tu camino, no te quedes esperando señales en esta banca.' },
      { who: 'Tú', t: 'Volveré cuando quiera mirar el lago, sin guiones en la cabeza.' },
      { t: 'Sonríe con naturalidad. A lo lejos, los cisnes siguen flotando sobre el agua.' }
    ]
  ]
};

function katherinPickOpener(ctx, n) {
  if (n % 2 === 1) return [];
  if (ctx.rain > 0.3) return KATHERIN_OPENERS.rain;
  if (ctx.night > 0.5) return KATHERIN_OPENERS.night;
  if (ctx.tod === 3) return KATHERIN_OPENERS.dawn;
  if (ctx.tod === 1) return KATHERIN_OPENERS.sunset;
  return [];
}

function interactKatherin() {
  const g = canInteractWithKatherin();
  if (!g || Math.hypot(S.x - g.position.x, S.z - g.position.z) > 3.5) return false;

  const lookAt = new THREE.Vector3(g.position.x, g.position.y + 1.35, g.position.z);
  const ctx = katherinContext();
  const flags = (typeof STORY !== 'undefined' && STORY && STORY.flags) || {};

  if (!flags.metKatherin) {
    if (!flags.glasses && window.__glasses && window.__glasses.visible) {
      playCinematic([
        { pause: 500 },
        { t: 'La figura sentada en la banca se dibuja borrosa, como detrás de un vidrio empañado.' },
        { pause: 1800 },
        { t: 'Algo brilla sobre otra banca cercana del parque… tal vez tus gafas olvidadas.' },
        { pause: 1800 }
      ], () => showMsg('Recoge las gafas en la otra banca antes de acercarte (E)'), { lookAt, location: 'CAPÍTULO III · EL PARQUE DE LOS CISNES' });
      return true;
    }

    storyFlag('metKatherin', 1);
    katherinCh3Pad([220, 277.18, 329.63, 440], 6.5, 0.032);
    const intro = ctx.rain > 0.3
      ? [{ t: 'Llueve despacio. Aun así, hay alguien sentada en uno de los bancos.' }, { pause: 1500 }]
      : [];
    playCinematic(intro.concat([
      { pause: 1100 },
      { t: 'El parque está casi vacío. Dos cisnes avanzan despacio sobre el agua.' },
      { pause: 1700 },
      { t: 'En la banca hay una joven con un cuaderno cerrado a su lado. Su expresión es tranquila, difícil de leer.' },
      { pause: 2100 },
      { t: 'Tus pasos crujen sobre la grava.' },
      { pause: 1100 },
      { t: 'Ella gira apenas la cabeza y hace un gesto pequeño con la mano.' },
      { pause: 1200 },
      { who: 'Katherin', t: 'Hola.' },
      { pause: 1400 },
      { type: 'layer', layer: 'pensaste', t: 'Me quedé en blanco un segundo. Pensé: tengo que responder algo normal para no parecer raro.' },
      { pause: 2200 },
      { who: 'Katherin', t: 'Me llamo Katherin.' },
      { pause: 1400 },
      { who: 'Tú', t: 'Hola… siento que ya había estado en un silencio parecido contigo, pero mi cabeza intenta adivinarlo todo.' },
      { pause: 2300 },
      { who: 'Katherin', t: 'No tienes que adivinar nada. Yo también soy algo callada.' },
      { pause: 2000 },
      { t: 'Por un momento ninguno intenta llenar la pausa. Un pétalo de cerezo cae al agua y sigue su curso.', on: () => katherinCh3Pad([196, 293.7, 392, 493.9], 5.5, 0.030) },
      { pause: 2200 },
      { type: 'layer', layer: 'hoy', t: 'No había enigmas en su mirada. Solo dos personas reservadas coincidiendo junto al agua.' },
      { pause: 2400 },
      { who: 'Katherin', t: 'Si sigues hacia tierra firme, El Colegio vuelve a estar abierto. Puedes sentarte antes, si quieres. (F)' },
      { pause: 2400 },
      { t: 'Te quedas allí, a una distancia cómoda. El lago sigue moviéndose frente a ustedes.' },
      { pause: 2400 }
    ]), () => showMsg('Capítulo III completado · Puedes sentarte (F) o buscar El Colegio'), { lookAt, location: 'CAPÍTULO III · EL PARQUE DE LOS CISNES' });
  } else {
    const stage = katherinStage();
    const pool = KATHERIN_TALKS[stage] || KATHERIN_TALKS[1];
    const totalN = flags.kath_talks | 0;
    const stageKey = 'kath_talks_s' + stage;
    const stageN = flags[stageKey] | 0;

    storyFlag('kath_talks', totalN + 1);
    storyFlag(stageKey, stageN + 1);

    const lines = [{ pause: 800 }].concat(katherinPickOpener(ctx, totalN), pool[stageN % pool.length]);
    const timed = [];
    for (const l of lines) {
      timed.push(l);
      if (l.t) timed.push({ pause: Math.min(3200, 900 + l.t.length * 32) });
    }
    playCinematic(timed, null, { lookAt, location: 'PARQUE DE LOS CISNES' });
  }
  return true;
}

try { buildKatherin(); } catch (e) { console.warn('Katherin: no se pudo construir', e); }
window.addEventListener('pagehide', (e) => { if (!e.persisted) { try { disposeKatherin(); } catch (_) {} } });
