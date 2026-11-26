/* BOIS.IO · 28-car-radio.js — Auto remodelado (cabina abierta + 1.ª/3.ª persona), colisión deslizante, persistencia y radio */
const CAR_POS_KEY = 'bois_car_pos';
const CAR = {
  g: null,
  body: null,
  wheels: [],
  frontWheels: [],
  lights: [],
  wipers: [],
  eyeAnchor: null,
  steerPivot: null,
  speedNeedle: null,
  rpmNeedle: null,
  shifterPivot: null,
  hbPivot: null,
  domeLight: null,
  glassMat: null,
  radioLedMat: null,
  on: false,
  speed: 0,
  yaw: 0,
  x: 0, y: 0, z: 0,
  radio: -1,
  nextRadio: 0,
  radioStep: 0,
  near: false,
  modelBuilt: false,
  headMat: null,
  tailMat: null,
  revMat: null,
  camMode: 'first',
  lookYaw: 0,
  lookPitch: 0,
  lookIdle: 0,
  saveT: 0,
  wiperPhase: 0,
  // estado dinámico
  v: 0, r: 0, delta: 0, gear: 1, rpm: 900, ax: 0, ay: 0, vy: 0, air: false, slip: 0,
  shake: 0, shiftT: 0, thr: 0, brk: 0, hb: 0, pitch: 0, roll: 0, kickP: 0, kickR: 0,
  ySm: 0, camYaw: 0, wheelPivots: [], snd: null, skid: null, smoke: null, blob: null, msgT: 0
};
const CAR_STATIONS = [
  { name: 'Radio apagada', short: 'OFF', style: 0 },
  { name: 'Brisa FM', short: 'BRISA FM', style: 1 },
  { name: 'Noche Sintética', short: 'NOCHE', style: 2 },
  { name: 'Carretera 89', short: '89', style: 3 }
];

const _carEyePos = new THREE.Vector3();
const _carTargetPos = new THREE.Vector3();
const _carQuat = new THREE.Quaternion();
const _carLookQuat = new THREE.Quaternion();
const _carLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _carFlatEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _carUp = new THREE.Vector3(0, 1, 0);

function createCarTireGeometry(outerR, width) {
  const halfW = width * 0.5;
  const innerR = outerR - 0.125;
  const shoulderR = outerR - 0.018;
  const pts = [
    new THREE.Vector2(innerR, -halfW * 0.86),
    new THREE.Vector2(outerR - 0.055, -halfW),
    new THREE.Vector2(shoulderR, -halfW * 0.84),
    new THREE.Vector2(outerR, -halfW * 0.52),
    new THREE.Vector2(outerR, halfW * 0.52),
    new THREE.Vector2(shoulderR, halfW * 0.84),
    new THREE.Vector2(outerR - 0.055, halfW),
    new THREE.Vector2(innerR, halfW * 0.86)
  ];
  const geo = new THREE.LatheGeometry(pts, 32);
  geo.rotateZ(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function createCarGaugeTexture() {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#091317';
  ctx.fillRect(0, 0, 512, 256);

  // Marco sutil del cuadro de instrumentos
  ctx.strokeStyle = '#254a4d';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 240);

  const drawDial = (cx, cy, r, ticks, redFrom, labels) => {
    ctx.fillStyle = '#0e1d22';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4cb8aa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, Math.PI * 0.78, Math.PI * 2.22);
    ctx.stroke();

    for (let i = 0; i <= ticks; i++) {
      const f = i / ticks;
      const a = Math.PI * 0.78 + f * (Math.PI * 1.44);
      const isRed = redFrom >= 0 && i >= redFrom;
      const major = i % 2 === 0;
      ctx.strokeStyle = isRed ? '#ff644c' : (major ? '#e8f5f1' : '#85aba3');
      ctx.lineWidth = major ? 3.2 : 1.6;
      const r0 = r - (major ? 18 : 11);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5));
      ctx.stroke();
    }

    if (labels && labels.length) {
      ctx.fillStyle = '#e7f2ee';
      ctx.font = '700 13px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < labels.length; i++) {
        const f = i / (labels.length - 1);
        const a = Math.PI * 0.78 + f * (Math.PI * 1.44);
        const lr = r - 30;
        ctx.fillStyle = (redFrom >= 0 && i === labels.length - 1) ? '#ff7c66' : '#dceee9';
        ctx.fillText(labels[i], cx + Math.cos(a) * lr, cy + Math.sin(a) * lr);
      }
    }

    ctx.fillStyle = '#e0ca98';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  };

  drawDial(142, 136, 92, 14, 11, ['0', '1', '2', '3', '4', '5', '6', '7']);
  drawDial(370, 136, 92, 14, -1, ['0', '20', '40', '60', '80', '100', '120', '140']);

  ctx.fillStyle = '#9fd6cc';
  ctx.font = '700 16px system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RPM', 142, 198);
  ctx.fillText('KM/H', 370, 198);

  ctx.fillStyle = '#142a2f';
  ctx.fillRect(216, 174, 80, 26);
  ctx.strokeStyle = '#3d7d76';
  ctx.lineWidth = 2;
  ctx.strokeRect(216, 174, 80, 26);
  ctx.fillStyle = '#ebd49d';
  ctx.font = '700 13px Georgia,serif';
  ctx.fillText('BOIS · 89', 256, 191);

  const tex = new THREE.CanvasTexture(cv);
  if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  return tex;
}

function loadSavedCarState() {
  try {
    const raw = localStorage.getItem(CAR_POS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    const ok = Number.isFinite(o.x) && Number.isFinite(o.z) && Math.abs(o.x) <= 495 && Math.abs(o.z) <= 495;
    return {
      ok,
      x: ok ? o.x : null,
      y: Number.isFinite(o.y) ? o.y : null,
      z: ok ? o.z : null,
      yaw: Number.isFinite(o.yaw) ? o.yaw : Math.PI,
      radio: Number.isInteger(o.radio) && o.radio >= -1 && o.radio < CAR_STATIONS.length ? o.radio : -1,
      camMode: o.camMode === 'third' ? 'third' : 'first'
    };
  } catch (e) {
    return null;
  }
}

function saveCarState(force) {
  if (typeof window !== 'undefined' && window.__boisResetting) return;
  if (!CAR.g || !Number.isFinite(CAR.x) || !Number.isFinite(CAR.z)) return;
  if (!force && CAR.saveT < 2.2) return;
  CAR.saveT = 0;
  try {
    localStorage.setItem(CAR_POS_KEY, JSON.stringify({
      x: +CAR.x.toFixed(2),
      y: +CAR.y.toFixed(2),
      z: +CAR.z.toFixed(2),
      yaw: +CAR.yaw.toFixed(4),
      radio: CAR.radio,
      camMode: CAR.camMode === 'third' ? 'third' : 'first'
    }));
  } catch (e) {
    typeof __bw === 'function' && __bw('28-car-radio#save', e);
  }
}

function updateCarGlassMode() {
  if (!CAR.glassMat) return;
  const inCabin = CAR.on && CAR.camMode === 'first';
  CAR.glassMat.opacity = inCabin ? 0.11 : 0.30;
  if (CAR.domeLight) {
    const night =
      (typeof PC !== 'undefined' && PC && PC.night > 0.45) ||
      (typeof tod !== 'undefined' && tod === 2);
    CAR.domeLight.intensity = inCabin ? (night ? 0.65 : 0.16) : 0;
  }
}

function buildCar() {
  if (CAR.modelBuilt || !scene) return;

  CAR.wheels = [];
  CAR.frontWheels = [];
  CAR.wheelPivots = [];
  CAR.lights = [];
  CAR.wipers = [];

  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  CAR.body = body;

  const paintMatCtor = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
  const paintOpts = { color: 0x1c6d64, roughness: 0.24, metalness: 0.58 };
  if (THREE.MeshPhysicalMaterial) {
    paintOpts.clearcoat = 0.85;
    paintOpts.clearcoatRoughness = 0.12;
  }
  const paint = new paintMatCtor(paintOpts);
  const paintDeep = new THREE.MeshStandardMaterial({ color: 0x102c28, roughness: 0.58, metalness: 0.32 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x171b20, roughness: 0.65, metalness: 0.16 });
  const cabinWallMat = new THREE.MeshStandardMaterial({ color: 0x202429, roughness: 0.88, metalness: 0.04 });
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0x16191d, roughness: 0.96, metalness: 0.02 });
  const headlinerMat = new THREE.MeshStandardMaterial({ color: 0x34373a, roughness: 0.94, metalness: 0.02 });
  const walnutMat = new THREE.MeshStandardMaterial({ color: 0x5d3924, roughness: 0.42, metalness: 0.06 });
  const underMat = new THREE.MeshStandardMaterial({ color: 0x0c0e11, roughness: 0.92, metalness: 0.05, side: THREE.DoubleSide });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe6e1d6, roughness: 0.14, metalness: 0.92 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a35a, roughness: 0.28, metalness: 0.78 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x7a4e36, roughness: 0.78, metalness: 0.02 });
  const leatherDark = new THREE.MeshStandardMaterial({ color: 0x452b1e, roughness: 0.85, metalness: 0.02 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x18343c, roughness: 0.06, metalness: 0.12,
    transparent: true, opacity: 0.30, depthWrite: false, side: THREE.DoubleSide
  });
  CAR.glassMat = glassMat;
  const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0xd9e8ec, roughness: 0.05, metalness: 0.96 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.94, metalness: 0.02 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd0cabd, roughness: 0.20, metalness: 0.90 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xdcc88a, roughness: 0.26, metalness: 0.78 });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e8, emissive: 0xfff0c2, emissiveIntensity: 0.75, roughness: 0.14, metalness: 0.04
  });
  const headLensMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0x991f1a, emissive: 0xff281e, emissiveIntensity: 0.5, roughness: 0.24, metalness: 0.08
  });
  const amberMat = new THREE.MeshStandardMaterial({
    color: 0xd9701c, emissive: 0xff8d24, emissiveIntensity: 0.55, roughness: 0.26, metalness: 0.05
  });
  const revMat = new THREE.MeshStandardMaterial({
    color: 0xd6dde0, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.2, metalness: 0.05
  });
  const gaugeTex = createCarGaugeTexture();
  const gaugeMat = new THREE.MeshStandardMaterial({
    map: gaugeTex,
    emissive: 0x62d4c2,
    emissiveMap: gaugeTex,
    emissiveIntensity: 0.92,
    roughness: 0.22
  });
  const needleMat = new THREE.MeshStandardMaterial({
    color: 0xff7048, emissive: 0xff5a36, emissiveIntensity: 1.15, roughness: 0.25
  });
  const radioLedMat = new THREE.MeshStandardMaterial({
    color: 0x152326, emissive: 0xebb663, emissiveIntensity: 0, roughness: 0.35
  });

  CAR.headMat = headMat;
  CAR.tailMat = tailMat;
  CAR.revMat = revMat;
  CAR.radioLedMat = radioLedMat;

  function add(geo, mat, x, y, z, rx, ry, rz, cast) {
    if (rx === undefined) rx = 0;
    if (ry === undefined) ry = 0;
    if (rz === undefined) rz = 0;
    if (cast === undefined) cast = false;
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x, y, z);
    o.rotation.set(rx, ry, rz);
    o.castShadow = cast;
    o.receiveShadow = cast;
    body.add(o);
    return o;
  }

  function addPillar(x1, y1, z1, x2, y2, z2, w, d, mat) {
    const p1 = new THREE.Vector3(x1, y1, z1);
    const p2 = new THREE.Vector3(x2, y2, z2);
    const dir = p2.clone().sub(p1);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, d), mat);
    m.position.copy(p1).add(p2).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    m.castShadow = true;
    m.receiveShadow = true;
    body.add(m);
    return m;
  }

  // --- Carrocería remodelada con cabina realmente hueca ---
  // 1. Sección frontal (capó + guardabarros delanteros, z = -2.05..-0.48)
  const frontProfile = new THREE.Shape();
  frontProfile.moveTo(-2.05, 0.36);
  frontProfile.lineTo(-2.05, 0.82);
  frontProfile.quadraticCurveTo(-1.32, 1.03, -0.48, 1.055);
  frontProfile.lineTo(-0.48, 0.38);
  frontProfile.lineTo(-0.67, 0.38);
  frontProfile.quadraticCurveTo(-1.16, 1.04, -1.65, 0.36);
  frontProfile.closePath();

  const frontGeo = new THREE.ExtrudeGeometry(frontProfile, {
    depth: 1.66, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.04, bevelSegments: 3, curveSegments: 16
  });
  frontGeo.translate(0, 0, -0.83);
  frontGeo.rotateY(-Math.PI / 2);
  frontGeo.computeVertexNormals();
  const frontMesh = new THREE.Mesh(frontGeo, paint);
  frontMesh.castShadow = true;
  frontMesh.receiveShadow = true;
  body.add(frontMesh);

  // 2. Costados exteriores / puertas + guardabarros traseros (z = -0.50..+2.02, huecos en medio)
  const sideProfile = new THREE.Shape();
  sideProfile.moveTo(-0.50, 0.38);
  sideProfile.lineTo(-0.50, 1.055);
  sideProfile.lineTo(0.96, 1.055);
  sideProfile.quadraticCurveTo(1.52, 1.00, 2.02, 0.78);
  sideProfile.lineTo(2.02, 0.38);
  sideProfile.lineTo(1.66, 0.36);
  sideProfile.quadraticCurveTo(1.17, 1.04, 0.68, 0.38);
  sideProfile.closePath();

  const sideGeo = new THREE.ExtrudeGeometry(sideProfile, {
    depth: 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.025, bevelSegments: 2, curveSegments: 14
  });
  sideGeo.translate(0, 0, -0.07);
  sideGeo.rotateY(-Math.PI / 2);
  sideGeo.computeVertexNormals();
  for (const sx of [-1, 1]) {
    const sm = new THREE.Mesh(sideGeo, paint);
    sm.position.set(sx * 0.76, 0, 0);
    sm.castShadow = true;
    sm.receiveShadow = true;
    body.add(sm);
  }

  // 3. Baúl / bloque trasero entre los dos costados (z = +0.88..+2.02)
  const rearProfile = new THREE.Shape();
  rearProfile.moveTo(0.88, 0.38);
  rearProfile.lineTo(0.88, 1.055);
  rearProfile.lineTo(0.96, 1.055);
  rearProfile.quadraticCurveTo(1.52, 1.00, 2.02, 0.78);
  rearProfile.lineTo(2.02, 0.38);
  rearProfile.closePath();
  const rearGeo = new THREE.ExtrudeGeometry(rearProfile, {
    depth: 1.38, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 2, curveSegments: 12
  });
  rearGeo.translate(0, 0, -0.69);
  rearGeo.rotateY(-Math.PI / 2);
  rearGeo.computeVertexNormals();
  const rearMesh = new THREE.Mesh(rearGeo, paint);
  rearMesh.castShadow = true;
  rearMesh.receiveShadow = true;
  body.add(rearMesh);

  // Capó elevado, emblema, chasis inferior, piso de cabina y mamparos
  add(new THREE.BoxGeometry(0.66, 0.036, 0.96), paint, 0, 1.03, -1.16, -0.085, 0, 0, true);
  add(new THREE.BoxGeometry(0.035, 0.014, 0.72), paintDeep, -0.22, 1.01, -1.18, -0.085, 0, 0);
  add(new THREE.BoxGeometry(0.035, 0.014, 0.72), paintDeep, 0.22, 1.01, -1.18, -0.085, 0, 0);
  add(new THREE.BoxGeometry(0.06, 0.014, 0.045), chrome, 0, 0.848, -1.96, -0.1, 0, 0);
  add(new THREE.BoxGeometry(1.20, 0.07, 3.85), underMat, 0, 0.34, -0.02);
  add(new THREE.BoxGeometry(1.42, 0.06, 1.40), cabinWallMat, 0, 0.40, 0.20, 0, 0, 0, true);
  add(new THREE.BoxGeometry(1.32, 0.015, 1.32), carpetMat, 0, 0.435, 0.20);
  add(new THREE.BoxGeometry(1.42, 0.62, 0.06), cabinWallMat, 0, 0.73, -0.49);
  add(new THREE.BoxGeometry(1.42, 0.62, 0.06), cabinWallMat, 0, 0.73, 0.87);
  add(new THREE.BoxGeometry(1.36, 0.04, 0.22), cabinWallMat, 0, 1.03, 0.96);

  // Paneles interiores de las puertas (apoyabrazos, moldura y manijas internas)
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.035, 0.56, 1.28), cabinWallMat, sx * 0.68, 0.73, 0.19);
    add(new THREE.BoxGeometry(0.055, 0.05, 0.44), leatherDark, sx * 0.648, 0.72, 0.14);
    add(new THREE.BoxGeometry(0.022, 0.025, 0.88), walnutMat, sx * 0.658, 0.93, 0.18);
    add(new THREE.BoxGeometry(0.024, 0.022, 0.09), chrome, sx * 0.652, 0.89, -0.06);
  }

  // --- Techo, pilares esbeltos y cristales reales ---
  add(new THREE.BoxGeometry(1.28, 0.048, 0.84), paint, 0, 1.495, 0.28, 0, 0, 0, true);
  add(new THREE.BoxGeometry(1.20, 0.018, 0.78), headlinerMat, 0, 1.466, 0.28);
  add(new THREE.BoxGeometry(1.24, 0.035, 0.05), trim, 0, 1.48, -0.14);
  add(new THREE.BoxGeometry(1.24, 0.035, 0.05), trim, 0, 1.48, 0.70);
  // Parasoles delanteros
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.42, 0.018, 0.13), leatherDark, sx * 0.30, 1.435, -0.13, 0.22, 0, 0);
  }
  // Pilares A, B y C
  for (const sx of [-1, 1]) {
    addPillar(sx * 0.61, 1.04, -0.52, sx * 0.60, 1.48, -0.12, 0.042, 0.048, trim);
    addPillar(sx * 0.625, 1.04, 0.26, sx * 0.615, 1.48, 0.26, 0.038, 0.052, trim);
    addPillar(sx * 0.615, 1.04, 1.04, sx * 0.60, 1.48, 0.68, 0.044, 0.062, paint);
    add(new THREE.BoxGeometry(0.028, 0.032, 0.84), trim, sx * 0.61, 1.48, 0.28);
  }

  // Parabrisas y medallón
  add(new THREE.BoxGeometry(1.18, 0.60, 0.016), glassMat, 0, 1.26, -0.325, 0.76, 0, 0);
  add(new THREE.BoxGeometry(1.20, 0.032, 0.032), trim, 0, 1.065, -0.525, 0.76, 0, 0);
  add(new THREE.BoxGeometry(1.14, 0.56, 0.016), glassMat, 0, 1.27, 0.87, -0.73, 0, 0);
  add(new THREE.BoxGeometry(1.16, 0.032, 0.032), trim, 0, 1.065, 1.05, -0.73, 0, 0);

  // Limpiaparabrisas articulados (se mueven con la lluvia)
  for (const wx of [-0.26, 0.18]) {
    const wp = new THREE.Group();
    wp.position.set(wx, 1.075, -0.55);
    wp.rotation.set(0.76, 0, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.015, 0.018), trim);
    arm.position.set(0.18, 0.02, 0.01);
    wp.add(arm);
    body.add(wp);
    CAR.wipers.push(wp);
  }

  // Ventanas laterales, molduras y barras de techo
  const winShape = new THREE.Shape();
  winShape.moveTo(-0.46, 1.08);
  winShape.lineTo(-0.12, 1.44);
  winShape.lineTo(0.64, 1.44);
  winShape.lineTo(0.98, 1.08);
  winShape.closePath();
  const winGeo = new THREE.ShapeGeometry(winShape);
  winGeo.rotateY(-Math.PI / 2);
  const seamGeo = new THREE.BoxGeometry(0.01, 0.52, 0.014);
  const handleGeo = new THREE.BoxGeometry(0.024, 0.028, 0.13);

  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(winGeo, glassMat);
    w.position.set(sx * 0.618, 0, 0);
    body.add(w);
    add(new THREE.BoxGeometry(0.026, 0.024, 1.50), chrome, sx * 0.658, 1.07, 0.26);
    add(new THREE.BoxGeometry(0.022, 0.026, 2.58), gold, sx * 0.874, 0.99, 0.0);
    for (const z of [-0.48, 0.34, 1.02]) add(seamGeo, trim, sx * 0.873, 0.69, z);
    add(handleGeo, chrome, sx * 0.886, 0.89, 0.08);
    add(handleGeo, chrome, sx * 0.886, 0.89, 0.62);
    add(new THREE.BoxGeometry(0.055, 0.075, 1.26), trim, sx * 0.865, 0.39, 0.01);
    add(new THREE.CylinderGeometry(0.014, 0.014, 0.98, 8), chrome, sx * 0.32, 1.565, 0.28, Math.PI / 2);
    for (const rz of [-0.14, 0.70]) {
      add(new THREE.BoxGeometry(0.028, 0.055, 0.045), trim, sx * 0.32, 1.535, rz);
    }
  }

  // --- Frente ---
  add(new THREE.BoxGeometry(0.64, 0.22, 0.05), chrome, 0, 0.70, -2.085);
  add(new THREE.BoxGeometry(0.58, 0.18, 0.055), trim, 0, 0.70, -2.09);
  for (let i = 0; i < 4; i++) {
    add(new THREE.BoxGeometry(0.54, 0.014, 0.018), chrome, 0, 0.635 + i * 0.042, -2.118);
  }
  add(new THREE.BoxGeometry(0.04, 0.16, 0.02), chrome, 0, 0.70, -2.12);

  const lampGeo = new THREE.SphereGeometry(0.084, 18, 14);
  const bezelGeo = new THREE.TorusGeometry(0.105, 0.018, 10, 22);
  const bucketGeo = new THREE.CylinderGeometry(0.105, 0.112, 0.065, 22);
  const lensGeo = new THREE.SphereGeometry(0.095, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);

  for (const sx of [-1, 1]) {
    add(bucketGeo, trim, sx * 0.54, 0.70, -2.085, Math.PI / 2, 0, 0);
    const lamp = add(lampGeo, headMat, sx * 0.54, 0.70, -2.105);
    lamp.scale.set(1, 0.88, 0.42);
    add(bezelGeo, chrome, sx * 0.54, 0.70, -2.118);
    const lens = add(lensGeo, headLensMat, sx * 0.54, 0.70, -2.112, -Math.PI / 2, 0, 0);
    lens.scale.set(1, 0.42, 0.9);
    add(new THREE.BoxGeometry(0.16, 0.058, 0.036), trim, sx * 0.72, 0.53, -2.10);
    add(new THREE.BoxGeometry(0.135, 0.042, 0.038), amberMat, sx * 0.72, 0.53, -2.108);

    const spot = new THREE.SpotLight(0xfff0cf, 0, 28, Math.PI / 7, 0.42, 1.25);
    spot.position.set(sx * 0.54, 0.72, -2.16);
    spot.target.position.set(sx * 0.54, 0.35, -16);
    body.add(spot);
    body.add(spot.target);
    CAR.lights.push(spot);
  }

  add(new THREE.BoxGeometry(1.58, 0.13, 0.09), trim, 0, 0.44, -2.115, 0, 0, 0, true);
  add(new THREE.BoxGeometry(1.66, 0.065, 0.07), chrome, 0, 0.42, -2.155, 0, 0, 0, true);
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.055, 0.13, 0.055), trim, sx * 0.44, 0.44, -2.165);
  }
  add(new THREE.BoxGeometry(1.52, 0.045, 0.14), paintDeep, 0, 0.345, -2.07);

  // --- Trasera ---
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.56, 0.13, 0.045), trim, sx * 0.46, 0.71, 2.065);
    add(new THREE.BoxGeometry(0.32, 0.095, 0.05), tailMat, sx * 0.55, 0.71, 2.072);
    add(new THREE.BoxGeometry(0.11, 0.095, 0.05), amberMat, sx * 0.32, 0.71, 2.072);
    add(new THREE.BoxGeometry(0.11, 0.055, 0.048), revMat, sx * 0.58, 0.59, 2.072);
  }
  add(new THREE.BoxGeometry(0.38, 0.024, 0.03), chrome, 0, 0.805, 2.035);
  add(new THREE.BoxGeometry(1.36, 0.032, 0.11), paint, 0, 0.825, 1.98, 0.18, 0, 0, true);
  add(new THREE.BoxGeometry(1.64, 0.12, 0.09), trim, 0, 0.44, 2.085, 0, 0, 0, true);
  add(new THREE.BoxGeometry(1.70, 0.065, 0.07), chrome, 0, 0.42, 2.125, 0, 0, 0, true);
  add(new THREE.BoxGeometry(0.34, 0.10, 0.28), underMat, 0.50, 0.33, 1.85);
  for (const ex of [0.44, 0.56]) {
    add(new THREE.CylinderGeometry(0.034, 0.034, 0.24, 12), chrome, ex, 0.33, 2.09, Math.PI / 2);
    add(new THREE.CylinderGeometry(0.024, 0.024, 0.25, 10), underMat, ex, 0.33, 2.095, Math.PI / 2);
  }

  // --- Matrícula ---
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 128;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#f4f0e4';
  cx.fillRect(0, 0, 256, 128);
  cx.strokeStyle = '#1b2e2b';
  cx.lineWidth = 10;
  cx.strokeRect(8, 8, 240, 112);
  cx.fillStyle = '#143f3b';
  cx.font = '700 64px Georgia,serif';
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.fillText('BOIS', 128, 52);
  cx.fillStyle = '#8a5a28';
  cx.font = '600 22px Georgia,serif';
  cx.fillText('ISLA VIVA', 128, 100);
  const plateTex = new THREE.CanvasTexture(cv);
  if ('colorSpace' in plateTex && THREE.SRGBColorSpace) plateTex.colorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) plateTex.encoding = THREE.sRGBEncoding;
  add(new THREE.BoxGeometry(0.47, 0.23, 0.022), trim, 0, 0.59, 2.068);
  add(new THREE.PlaneGeometry(0.44, 0.20), new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.65 }), 0, 0.59, 2.082);
  add(new THREE.BoxGeometry(0.24, 0.022, 0.03), chrome, 0, 0.71, 2.078);

  // --- Espejos, antena e interior detallado e interactivo ---
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.11, 0.034, 0.042), trim, sx * 0.73, 1.10, -0.24);
    add(new THREE.BoxGeometry(0.16, 0.08, 0.095), paint, sx * 0.87, 1.13, -0.25, 0, -sx * 0.14, 0);
    add(new THREE.PlaneGeometry(0.125, 0.058), mirrorGlassMat, sx * 0.87, 1.13, -0.200, 0, -sx * 0.14, 0);
  }
  add(new THREE.CylinderGeometry(0.018, 0.024, 0.03, 8), trim, 0.38, 1.525, 0.54);
  add(new THREE.CylinderGeometry(0.006, 0.01, 0.42, 6), chrome, 0.42, 1.71, 0.62, 0.25, 0, -0.18);

  // Asientos delanteros esculpidos + banca trasera
  for (const pair of [[-0.30, 0.18], [0.30, 0.20]]) {
    const sx = pair[0], oz = pair[1];
    add(new THREE.BoxGeometry(0.42, 0.14, 0.44), leather, sx, 0.65, oz);
    add(new THREE.BoxGeometry(0.39, 0.38, 0.09), leather, sx, 0.88, oz + 0.19, 0.14);
    for (const bx of [-0.18, 0.18]) {
      add(new THREE.BoxGeometry(0.06, 0.34, 0.08), leatherDark, sx + bx, 0.86, oz + 0.16, 0.14);
    }
    add(new THREE.BoxGeometry(0.19, 0.12, 0.065), leatherDark, sx, 1.13, oz + 0.23, 0.14);
  }
  add(new THREE.BoxGeometry(1.18, 0.15, 0.36), leather, 0, 0.64, 0.66);
  add(new THREE.BoxGeometry(1.18, 0.38, 0.10), leatherDark, 0, 0.86, 0.81, 0.14);

  // Consola central, palanca de cambios animada, freno de mano animado y radio
  add(new THREE.BoxGeometry(0.17, 0.22, 0.94), leatherDark, 0, 0.58, 0.02);
  add(new THREE.BoxGeometry(0.15, 0.03, 0.32), leather, 0, 0.70, 0.26);
  const shifterPivot = new THREE.Group();
  shifterPivot.position.set(0, 0.68, -0.10);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.17, 8), chrome);
  stick.position.set(0, 0.08, 0);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), walnutMat);
  knob.position.set(0, 0.165, 0);
  shifterPivot.add(stick, knob);
  body.add(shifterPivot);
  CAR.shifterPivot = shifterPivot;

  const hbPivot = new THREE.Group();
  hbPivot.position.set(-0.06, 0.68, 0.04);
  const hbBar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.024, 0.18), trim);
  hbBar.position.set(0, 0.01, -0.07);
  hbPivot.add(hbBar);
  body.add(hbPivot);
  CAR.hbPivot = hbPivot;

  // Tablero esculpido y despejado: la parte superior se detiene detrás del cuadro para no taparlo
  add(new THREE.BoxGeometry(1.24, 0.14, 0.24), trim, 0, 0.915, -0.45);
  add(new THREE.BoxGeometry(1.24, 0.028, 0.26), leatherDark, 0, 1.002, -0.47);
  add(new THREE.BoxGeometry(0.58, 0.12, 0.09), trim, 0.28, 0.925, -0.32);
  add(new THREE.BoxGeometry(0.54, 0.058, 0.024), walnutMat, 0.28, 0.935, -0.272);
  add(new THREE.BoxGeometry(0.045, 0.012, 0.012), chrome, 0.28, 0.935, -0.258);
  add(new THREE.BoxGeometry(0.16, 0.068, 0.05), trim, 0, 0.87, -0.27);
  add(new THREE.PlaneGeometry(0.115, 0.030), radioLedMat, 0, 0.87, -0.243);
  for (const vx of [-0.045, 0.045]) {
    add(new THREE.BoxGeometry(0.055, 0.036, 0.018), underMat, vx, 0.96, -0.325);
  }

  // Cuadro de instrumentos elevado e inclinado hacia los ojos del conductor (sin obstrucciones)
  const clusterGroup = new THREE.Group();
  clusterGroup.position.set(-0.30, 1.074, -0.338);
  clusterGroup.rotation.set(-0.20, 0, 0);
  body.add(clusterGroup);

  const addCluster = (geo, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    clusterGroup.add(m);
    return m;
  };
  addCluster(new THREE.BoxGeometry(0.33, 0.128, 0.06), trim, 0, 0, -0.034);
  addCluster(new THREE.BoxGeometry(0.35, 0.022, 0.12), leatherDark, 0, 0.068, -0.015);
  addCluster(new THREE.BoxGeometry(0.022, 0.12, 0.095), trim, -0.164, 0.004, -0.012);
  addCluster(new THREE.BoxGeometry(0.022, 0.12, 0.095), trim, 0.164, 0.004, -0.012);
  addCluster(new THREE.BoxGeometry(0.34, 0.018, 0.075), trim, 0, -0.065, -0.018);

  addCluster(new THREE.PlaneGeometry(0.285, 0.115), gaugeMat, 0, 0, 0.001);
  const dialRingGeo = new THREE.TorusGeometry(0.044, 0.0035, 8, 28);
  addCluster(dialRingGeo, chrome, -0.063, -0.004, 0.003);
  addCluster(dialRingGeo, chrome, 0.063, -0.004, 0.003);

  const makeNeedle = (cx) => {
    const piv = new THREE.Group();
    piv.position.set(cx, -0.004, 0.006);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.037, 0.003), needleMat);
    bar.position.y = 0.014;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.005, 10), chrome);
    cap.rotation.x = Math.PI / 2;
    piv.add(bar, cap);
    clusterGroup.add(piv);
    return piv;
  };
  CAR.rpmNeedle = makeNeedle(-0.063);
  CAR.speedNeedle = makeNeedle(0.063);

  // Columna y volante deportivo de 3 radios bajos (mitad superior abierta hacia el velocímetro)
  add(new THREE.CylinderGeometry(0.024, 0.028, 0.17, 10), trim, -0.30, 0.905, -0.315, Math.PI / 2 - 0.40);
  const steerPivot = new THREE.Group();
  steerPivot.position.set(-0.30, 0.935, -0.245);
  steerPivot.rotation.set(-0.40, 0, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.116, 0.013, 12, 26), leatherDark);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.022, 14), trim);
  hub.rotation.x = Math.PI / 2;
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.025, 12), gold);
  badge.rotation.x = Math.PI / 2;
  const spL = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.018, 0.011), chrome);
  spL.position.set(-0.056, -0.016, 0);
  spL.rotation.z = 0.28;
  const spR = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.018, 0.011), chrome);
  spR.position.set(0.056, -0.016, 0);
  spR.rotation.z = -0.28;
  const spB = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.092, 0.011), chrome);
  spB.position.set(0, -0.058, 0);
  steerPivot.add(rim, hub, badge, spL, spR, spB);
  body.add(steerPivot);
  CAR.steerPivot = steerPivot;

  // Retrovisor interior con superficie reflectante
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8), trim, 0, 1.44, -0.18);
  add(new THREE.BoxGeometry(0.19, 0.048, 0.024), trim, 0, 1.40, -0.18);
  add(new THREE.PlaneGeometry(0.172, 0.036), mirrorGlassMat, 0, 1.40, -0.167);

  // Punto exacto de los ojos del conductor (por encima del volante, vista directa al cuadro)
  const eyeAnchor = new THREE.Object3D();
  eyeAnchor.position.set(-0.30, 1.255, 0.105);
  body.add(eyeAnchor);
  CAR.eyeAnchor = eyeAnchor;

  const domeLight = new THREE.PointLight(0xffdfb0, 0, 2.8, 1.8);
  domeLight.position.set(0, 1.38, 0.12);
  body.add(domeLight);
  CAR.domeLight = domeLight;

  // --- Ruedas y pasos de rueda hundidos ---
  const R = 0.32;
  const wheelGeo = createCarTireGeometry(R, 0.22);
  const rimGeo = new THREE.CylinderGeometry(0.195, 0.195, 0.175, 24);
  const capGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.028, 14);
  const spokeGeo = new THREE.BoxGeometry(0.028, 0.18, 0.036);
  const discGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 22);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x7a7e82, roughness: 0.38, metalness: 0.88 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xb9261d, roughness: 0.36, metalness: 0.28 });
  const caliperGeo = new THREE.BoxGeometry(0.048, 0.095, 0.14);
  const linerArchGeo = new THREE.CylinderGeometry(R + 0.10, R + 0.10, 0.26, 24, 1, true, 0, Math.PI);
  const linerBackGeo = new THREE.CircleGeometry(R + 0.10, 24, 0, Math.PI);
  const flareGeo = new THREE.TorusGeometry(R + 0.098, 0.036, 10, 26, Math.PI);

  function makeWheel(sx) {
    const spin = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.castShadow = true;
    spin.add(tire);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.z = Math.PI / 2;
    spin.add(rimMesh);
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = -sx * 0.055;
    spin.add(disc);
    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Mesh(spokeGeo, rimMat);
      sp.rotation.x = (i / 5) * Math.PI * 2;
      sp.position.x = sx * 0.075;
      spin.add(sp);
    }
    const cap = new THREE.Mesh(capGeo, hubMat);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = sx * 0.102;
    spin.add(cap);
    return spin;
  }

  function addWheel(sx, sz, front) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.85, R, sz);
    const spin = makeWheel(sx);
    pivot.add(spin);
    const cal = new THREE.Mesh(caliperGeo, caliperMat);
    cal.position.set(-sx * 0.06, 0.095, front ? -0.05 : 0.05);
    pivot.add(cal);
    g.add(pivot);
    CAR.wheels.push(spin);
    if (front) CAR.frontWheels.push(pivot);
    CAR.wheelPivots.push({ p: pivot, sx: sx, sz: sz, y: R, front: front });
    add(linerArchGeo, underMat, sx * 0.74, R, sz, 0, 0, Math.PI / 2);
    add(linerBackGeo, underMat, sx * 0.61, R, sz, 0, sx * Math.PI / 2, 0);
    add(flareGeo, paint, sx * 0.872, R, sz, 0, Math.PI / 2, 0, true);
  }

  addWheel(-1, -1.16, true);
  addWheel(1, -1.16, true);
  addWheel(-1, 1.17, false);
  addWheel(1, 1.17, false);

  // Sombra de contacto bajo el auto
  const bc = document.createElement('canvas');
  bc.width = bc.height = 128;
  const bx = bc.getContext('2d');
  const gr = bx.createRadialGradient(64, 64, 6, 64, 64, 62);
  gr.addColorStop(0, 'rgba(0,0,0,.62)');
  gr.addColorStop(0.55, 'rgba(0,0,0,.32)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  bx.fillStyle = gr;
  bx.fillRect(0, 0, 128, 128);
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 4.7),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(bc),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.025;
  blob.renderOrder = 1;
  g.add(blob);
  CAR.blob = blob;

  // Posición inicial: restaurar donde quedó estacionado si existe guardado válido
  let sx = (typeof BEACH !== 'undefined') ? BEACH[0] - 8 : 0;
  let sz = (typeof BEACH !== 'undefined') ? BEACH[1] + 12 : 0;
  let syaw = Math.PI;
  let refY = 300;
  const saved = loadSavedCarState();
  if (saved) {
    if (saved.camMode) CAR.camMode = saved.camMode;
    if (saved.radio >= 0) CAR.radio = saved.radio;
    if (saved.ok) {
      sx = saved.x;
      sz = saved.z;
      syaw = saved.yaw;
      if (saved.y !== null) refY = saved.y + 2.5;
    }
  }

  let gy = (typeof ground === 'function') ? ground(sx, sz, refY) : 0;
  if (!Number.isFinite(gy) || gy < WL - 0.35) {
    sx = (typeof BEACH !== 'undefined') ? BEACH[0] - 8 : 0;
    sz = (typeof BEACH !== 'undefined') ? BEACH[1] + 12 : 0;
    syaw = Math.PI;
    gy = (typeof ground === 'function') ? ground(sx, sz, 300) : 0;
  }

  CAR.x = sx;
  CAR.z = sz;
  CAR.y = gy;
  CAR.yaw = syaw;

  // Asegurar que no aparezca atascado en un árbol/roca al recargar
  const safeSpot = carFindNearestValidSpot(CAR.x, CAR.z, CAR.yaw, CAR.y, 7);
  if (safeSpot) {
    CAR.x = safeSpot.x;
    CAR.z = safeSpot.z;
    CAR.y = safeSpot.y;
  }

  g.position.set(CAR.x, CAR.y, CAR.z);
  CAR.ySm = CAR.y;
  g.rotation.y = CAR.yaw;
  g.scale.set(1.35, 1.35, 1.35);
  scene.add(g);
  CAR.g = g;
  CAR.modelBuilt = true;

  // Si el jugador recargó estando dentro del auto, desplazarlo junto a la puerta para no aparecer dentro del cristal
  if (typeof S !== 'undefined' && S && Math.hypot(S.x - CAR.x, S.z - CAR.z) < 2.2 && Math.abs(S.y - CAR.y) < 3) {
    const f = carForward(), side = { x: -f.z, z: f.x };
    const exitOpts = [
      [CAR.x - side.x * 2.9, CAR.z - side.z * 2.9],
      [CAR.x + side.x * 2.9, CAR.z + side.z * 2.9],
      [CAR.x + f.x * 3.2, CAR.z + f.z * 3.2],
      [CAR.x - f.x * 3.2, CAR.z - f.z * 3.2]
    ];
    for (const c of exitOpts) {
      const cy = typeof ground === 'function' ? ground(c[0], c[1], CAR.y + 2.2) : CAR.y;
      if (Number.isFinite(cy) && cy >= WL - 0.35 && Math.abs(cy - CAR.y) <= 2.2 && (typeof blocked !== 'function' || !blocked(c[0], cy + 0.05, c[1]))) {
        S.x = c[0];
        S.z = c[1];
        S.y = cy + 0.05;
        break;
      }
    }
  }

  carInitFx();
  updateCarGlassMode();
  if (typeof updateCarLights === 'function') updateCarLights();
}

function carInitFx() {
  if (CAR.skid || !scene) return;
  const geo = new THREE.PlaneGeometry(0.2, 0.55);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x0a0a0a, transparent: true, opacity: 0.4, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
  });
  const N = 480, im = new THREE.InstancedMesh(geo, mat, N);
  im.frustumCulled = false;
  im.renderOrder = 1;
  const z = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < N; i++) im.setMatrixAt(i, z);
  im.instanceMatrix.needsUpdate = true;
  scene.add(im);
  CAR.skid = { im: im, N: N, i: 0, d: new THREE.Object3D(), last: [null, null] };
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,.9)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c), arr = [];
  for (let i = 0; i < 20; i++) {
    const sm = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, color: 0xd0d3d2 });
    const sp = new THREE.Sprite(sm);
    sp.visible = false;
    scene.add(sp);
    arr.push({ sp: sp, life: 0, max: 1, vx: 0, vy: 0, vz: 0 });
  }
  CAR.smoke = { arr: arr, i: 0, t: 0 };
}

function updateCarLights() {
  if (!CAR.g) return;
  const night =
    (typeof PC !== 'undefined' && PC && PC.night > 0.52) ||
    (typeof tod !== 'undefined' && tod === 2);
  for (const l of CAR.lights) l.intensity = night ? 2.5 : 0;
  if (CAR.headMat) CAR.headMat.emissiveIntensity = night ? 1.75 : 0.75;
  if (CAR.tailMat && !CAR.on) CAR.tailMat.emissiveIntensity = night ? 0.95 : 0.48;
  updateCarGlassMode();
}

const CAR_FOOTPRINT = [
  [0, 0],
  [0, -2.70],
  [0, 2.70],
  [-1.12, 0],
  [1.12, 0],
  [-1.02, -2.38],
  [1.02, -2.38],
  [-1.02, 2.38],
  [1.02, 2.38]
];

function carEvaluateSpot(x, z, yaw, yRef) {
  let hits = 0, pushX = 0, pushZ = 0, frontHit = 0, rearHit = 0, leftHit = 0, rightHit = 0;
  if (Math.abs(x) > 488 || Math.abs(z) > 488) {
    return {
      hits: 4,
      pushX: x > 488 ? -1 : x < -488 ? 1 : 0,
      pushZ: z > 488 ? -1 : z < -488 ? 1 : 0,
      frontHit: 1, rearHit: 1, leftHit: 1, rightHit: 1
    };
  }
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const gyFn = typeof ground === 'function' ? ground : null;
  const blFn = typeof blocked === 'function' ? blocked : null;
  for (let i = 0; i < CAR_FOOTPRINT.length; i++) {
    const lx = CAR_FOOTPRINT[i][0], lz = CAR_FOOTPRINT[i][1];
    const wx = lx * c + lz * s;
    const wz = -lx * s + lz * c;
    const qx = x + wx, qz = z + wz;
    let bad = Math.abs(qx) > 490 || Math.abs(qz) > 490;
    if (!bad && gyFn) {
      const surface = gyFn(qx, qz, yRef + 0.85);
      if (!Number.isFinite(surface) || surface < WL - 0.35 || surface - yRef > 1.15) bad = true;
    }
    if (!bad && blFn && blFn(qx, yRef, qz)) bad = true;
    if (bad) {
      hits++;
      if (lz < -0.5) frontHit++;
      if (lz > 0.5) rearHit++;
      if (lx < -0.3) leftHit++;
      if (lx > 0.3) rightHit++;
      const d = Math.hypot(wx, wz);
      if (d > 0.05) {
        pushX -= wx / d;
        pushZ -= wz / d;
      }
    }
  }
  const pl = Math.hypot(pushX, pushZ);
  if (pl > 1e-4) { pushX /= pl; pushZ /= pl; }
  return { hits, pushX, pushZ, frontHit, rearHit, leftHit, rightHit };
}

function carFindNearestValidSpot(x, z, yaw, yRef, maxRadius) {
  const gyFn = typeof ground === 'function' ? ground : null;
  const eval0 = carEvaluateSpot(x, z, yaw, yRef);
  if (eval0.hits === 0) {
    const gy = gyFn ? gyFn(x, z, yRef + 1.5) : yRef;
    return { x, z, y: Number.isFinite(gy) ? gy : yRef };
  }
  const rMax = maxRadius || 6;
  for (let r = 0.4; r <= rMax; r += 0.55) {
    for (let a = 0; a < 12; a++) {
      const th = (a / 12) * Math.PI * 2;
      const cx = x + Math.cos(th) * r, cz = z + Math.sin(th) * r;
      const gy = gyFn ? gyFn(cx, cz, yRef + 2.2) : yRef;
      if (!Number.isFinite(gy) || gy < WL - 0.35) continue;
      if (Math.abs(gy - yRef) > 3.2) continue;
      if (carEvaluateSpot(cx, cz, yaw, gy).hits === 0) {
        return { x: cx, z: cz, y: gy };
      }
    }
  }
  return null;
}

function validCarSpot(x, z) {
  if (Math.abs(x) > 490 || Math.abs(z) > 490) return false;
  const f = carForward(), px = -f.z, pz = f.x, y = CAR.y;
  const pts = [
    [0, 0], [f.x * 2.8, f.z * 2.8], [-f.x * 2.8, -f.z * 2.8],
    [px * 1.2, pz * 1.2], [-px * 1.2, -pz * 1.2],
    [f.x * 2.4 + px * 1.0, f.z * 2.4 + pz * 1.0],
    [f.x * 2.4 - px * 1.0, f.z * 2.4 - pz * 1.0],
    [-f.x * 2.4 + px * 1.0, -f.z * 2.4 + pz * 1.0],
    [-f.x * 2.4 - px * 1.0, -f.z * 2.4 - pz * 1.0]
  ];
  for (const p of pts) {
    const qx = x + p[0], qz = z + p[1], surface = ground(qx, qz, y + 0.65);
    if (!Number.isFinite(surface) || surface < WL - 0.35) return false;
    if (blocked(qx, y, qz)) return false;
  }
  return true;
}

function carForward() {
  return { x: -Math.sin(CAR.yaw), z: -Math.cos(CAR.yaw) };
}

function setCarBrakeButton(visible) {
  const b = document.getElementById('bh');
  if (b) {
    b.style.display = touch && visible ? 'inline-flex' : 'none';
    b.setAttribute('aria-hidden', visible && touch ? 'false' : 'true');
    if (!visible) {
      b.classList.remove('held');
      keys.Space = 0;
    }
  }
  const bc = document.getElementById('bc');
  if (bc) {
    bc.style.display = touch && visible ? 'inline-flex' : 'none';
    bc.setAttribute('aria-hidden', visible && touch ? 'false' : 'true');
  }
}

function carLookDelta(dx, dy) {
  if (!CAR.on) return;
  CAR.lookIdle = 0;
  const limY = CAR.camMode === 'first' ? 1.95 : Math.PI;
  let ny = CAR.lookYaw + dx;
  if (CAR.camMode === 'first') ny = Math.max(-limY, Math.min(limY, ny));
  else ny = Math.atan2(Math.sin(ny), Math.cos(ny));
  CAR.lookYaw = ny;
  const minP = CAR.camMode === 'first' ? -0.55 : -0.30;
  const maxP = CAR.camMode === 'first' ? 0.72 : 0.65;
  CAR.lookPitch = Math.max(minP, Math.min(maxP, CAR.lookPitch + dy));
}

function toggleCarCamMode() {
  if (!CAR.on) return;
  CAR.camMode = CAR.camMode === 'first' ? 'third' : 'first';
  CAR.lookYaw = 0;
  CAR.lookPitch = CAR.camMode === 'first' ? -0.02 : 0;
  CAR.lookIdle = 0;
  updateCarGlassMode();
  saveCarState(true);
  __carHudKey = '';
  if (typeof showMsg === 'function') {
    showMsg(CAR.camMode === 'first' ? '🚗 Vista interior (primera persona) · mueve el ratón para mirar · C cambia' : '🚗 Vista exterior (tercera persona) · C cambia');
  }
}

window.__boisSummonCarNearPlayer = function () {
  if (!CAR.g || typeof S === 'undefined' || !S.on) return false;
  if (CAR.on || (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || (typeof CIN !== 'undefined' && CIN.on)) return false;
  const gyFn = typeof ground === 'function' ? ground : null;
  const f = { x: -Math.sin(S.yaw), z: -Math.cos(S.yaw) };
  for (let r = 6; r <= 26; r += 3) {
    for (let a = 0; a < 12; a++) {
      const th = S.yaw + (a / 12) * Math.PI * 2;
      const cx = S.x + Math.sin(th) * r, cz = S.z + Math.cos(th) * r;
      const gy = gyFn ? gyFn(cx, cz, S.y + 4) : S.y;
      if (!Number.isFinite(gy) || gy < WL - 0.2) continue;
      if (Math.abs(gy - S.y) > 5.5) continue;
      const yaw = Math.atan2(-(S.x - cx), -(S.z - cz)) + Math.PI * 0.5;
      if (carEvaluateSpot(cx, cz, yaw, gy).hits === 0) {
        CAR.x = cx; CAR.z = cz; CAR.y = gy; CAR.ySm = gy; CAR.yaw = yaw;
        CAR.speed = 0; carResetDyn();
        CAR.g.position.set(CAR.x, CAR.y, CAR.z);
        CAR.g.rotation.y = CAR.yaw;
        saveCarState(true);
        if (typeof showMsg === 'function') showMsg('🚗 Tu auto apareció estacionado cerca de ti');
        return true;
      }
    }
  }
  const dirSpot = carFindNearestValidSpot(S.x + f.x * 7, S.z + f.z * 7, S.yaw, S.y, 12);
  if (dirSpot) {
    CAR.x = dirSpot.x; CAR.z = dirSpot.z; CAR.y = dirSpot.y; CAR.ySm = dirSpot.y; CAR.yaw = S.yaw;
    CAR.speed = 0; carResetDyn();
    CAR.g.position.set(CAR.x, CAR.y, CAR.z);
    CAR.g.rotation.y = CAR.yaw;
    saveCarState(true);
    if (typeof showMsg === 'function') showMsg('🚗 Tu auto apareció estacionado cerca de ti');
    return true;
  }
  if (typeof showMsg === 'function') showMsg('No hay espacio despejado cerca para estacionar el auto.');
  return false;
};

function enterCar() {
  if (!CAR.g || CAR.on || !S.on || CIN.on || S.sw || S.fly || (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || Math.abs(S.y - CAR.g.position.y) >= 4) return false;
  const d = Math.hypot(S.x - CAR.g.position.x, S.z - CAR.g.position.z);
  if (d > 4.4) return false;
  CAR.on = true;
  CAR.speed = 0;
  CAR.yaw = CAR.g.rotation.y;
  CAR.radio = CAR.radio < 0 ? 0 : CAR.radio;
  CAR.lookYaw = 0;
  CAR.lookPitch = CAR.camMode === 'first' ? -0.02 : 0;
  CAR.lookIdle = 0;
  setCarBrakeButton(true);
  carResetDyn();
  CAR.camYaw = CAR.yaw;
  CAR.y = CAR.g.position.y;
  CAR.ySm = CAR.y;
  updateCarGlassMode();
  carSoundOn();
  S.x = CAR.g.position.x;
  S.z = CAR.g.position.z;
  S.y = CAR.g.position.y + 1.05;
  S.vy = 0;
  S.sw = false;
  const hud = document.getElementById('carHud');
  if (hud) hud.classList.add('on');
  const prompt = document.getElementById('carPrompt');
  if (prompt) {
    prompt.classList.add('on');
    prompt.textContent = 'E · bajar · C · vista';
  }
  __carHudKey = '';
  saveCarState(true);
  if (typeof STORY !== 'undefined' && STORY.flags && !STORY.flags.car_intro) {
    storyFlag('car_intro', 1);
    showMsg('🚗 Tu viejo auto · C cambia interior/exterior · R radio · WASD conduce · E baja');
  } else {
    showMsg('🚗 Subiste al auto · C interior/exterior · R radio · Espacio freno · E baja');
  }
  CAR.near = false;
  return true;
}

function exitCar() {
  if (!CAR || !CAR.on || !CAR.g || !CAR.g.position) return false;
  const f = carForward(), side = { x: -f.z, z: f.x };
  const gx = CAR.g.position.x, gz = CAR.g.position.z;
  const candidates = [
    [gx + side.x * 2.9, gz + side.z * 2.9],
    [gx - side.x * 2.9, gz - side.z * 2.9],
    [gx - f.x * 3.0, gz - f.z * 3.0],
    [gx + f.x * 3.0, gz + f.z * 3.0]
  ];
  let p = null, bestScore = Infinity;
  for (const c of candidates) {
    if (Math.abs(c[0]) > 490 || Math.abs(c[1]) > 490) continue;
    const gy = ground(c[0], c[1], CAR.g.position.y + 2.2);
    if (!Number.isFinite(gy) || gy < WL - 0.35) continue;
    if (Math.abs(gy - CAR.g.position.y) > 2.2) continue;
    if (blocked(c[0], gy + 0.05, c[1])) continue;
    const score = Math.hypot(c[0] - gx, c[1] - gz) + Math.abs(gy - CAR.g.position.y) * 0.35;
    if (score < bestScore) {
      bestScore = score;
      p = { x: c[0], z: c[1], y: gy + 0.05 };
    }
  }
  if (!p) {
    showMsg('No hay espacio seguro para bajar. Mueve el auto a una zona despejada.');
    return false;
  }
  CAR.on = false;
  CAR.speed = 0;
  carResetDyn();
  carSoundOff();
  setCarBrakeButton(false);
  if (typeof updateCarGlassMode === 'function') updateCarGlassMode();
  S.x = p.x;
  S.z = p.z;
  S.y = p.y;
  S.vy = 0;
  S.sw = false;
  S.yaw = CAR.yaw;
  S.pitch = 0;
  S.fly = false;
  S.on = true;
  for (const k in keys) keys[k] = 0;
  jumpQ = false;
  carHudOff();
  if (typeof saveCarState === 'function') saveCarState(true);
  showMsg('Bajaste del auto · E para volver a subir');
  return true;
}

function interactCar() {
  if (CAR.on) {
    exitCar();
    return true;
  }
  return enterCar();
}

function checkCarNearby() {
  const cp = typeof carPrompt !== 'undefined' && carPrompt ? carPrompt : document.getElementById('carPrompt');
  if (CAR.on || !S.on || CIN.on || !CAR.g || (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || Math.abs(S.y - CAR.g.position.y) >= 4) {
    if (CAR.near) { if (cp) cp.classList.remove('on'); CAR.near = false; }
    return;
  }
  const d = Math.hypot(S.x - CAR.g.position.x, S.z - CAR.g.position.z);
  const near = d < 4.8;
  if (near && !CAR.near) {
    if (cp) {
      cp.classList.add('on');
      cp.textContent = 'E · subir al auto';
    }
    CAR.near = true;
  } else if (!near && CAR.near) {
    if (cp) cp.classList.remove('on');
    CAR.near = false;
  }
}

function radioTone(freq, dur, vol, type = 'triangle', filter = 1800) {
  const C = AU.ctx;
  if (!C || !AU.on) return;
  const o = C.createOscillator(), fl = C.createBiquadFilter(), g = C.createGain(), t = C.currentTime;
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  fl.type = 'lowpass';
  fl.frequency.value = filter;
  fl.Q.value = 0.7;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t + 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl);
  fl.connect(g);
  g.connect(C.destination);
  o.onended = () => {
    try { o.disconnect(); fl.disconnect(); g.disconnect(); } catch (_) {}
  };
  o.start(t);
  o.stop(t + dur + 0.03);
}

function setRadio() {
  if (!CAR.on) return;
  CAR.radio = (CAR.radio + 1) % CAR_STATIONS.length;
  saveCarState(true);
  if (CAR.radio === 0) {
    showMsg('📻 Radio apagada');
    return;
  }
  showMsg('📻 ' + CAR_STATIONS[CAR.radio].name);
}

function radioFrame() {
  if (!CAR.on || CAR.radio <= 0 || !AU.ctx || !AU.on) return;
  const t = AU.ctx.currentTime;
  if (t < CAR.nextRadio) return;
  CAR.nextRadio = t + 0.22;
  const seqs = [
    [196, 247, 294, 247, 220, 330, 294, 247],
    [110, 147, 165, 196, 147, 220, 165, 247],
    [220, 262, 330, 294, 247, 330, 392, 330]
  ];
  const seq = seqs[CAR.radio - 1] || seqs[0], i = CAR.radioStep++ % seq.length, f = seq[i];
  if (CAR.radio === 1) {
    radioTone(f, 0.16, 0.018, 'sine', 1100);
    if (i % 4 === 0) radioTone(f * 0.5, 0.32, 0.013, 'triangle', 750);
  } else if (CAR.radio === 2) {
    radioTone(f, 0.18, 0.028, 'sawtooth', 2200);
    if (i % 2 === 0) radioTone(f * 2, 0.09, 0.010, 'square', 2800);
  } else {
    radioTone(f, 0.28, 0.022, 'triangle', 1600);
    if (i === 0 || i === 4) radioTone(f * 0.5, 0.48, 0.012, 'sine', 900);
  }
}

const CAR_CFG = {
  m: 1100, Iz: 1650, a: 1.15, b: 1.19, L: 2.34, h: 0.52, R: 0.32, Cf: 64000, Cr: 72000,
  idle: 900, redline: 6600, eff: 0.85, gears: [0, 13.5, 9.0, 6.6, 5.4, 4.5], rev: 11, vmax: 35, revMax: 9,
  kd: 0.52, rr: 0.018, brakeG: 8.6
};
function carTorque(rpm) {
  const x = (rpm - 4200) / 4200;
  return 150 * Math.max(0.3, 1 - 0.55 * x * x);
}
function carSurface(x, z) {
  let mu = 0.92, rr = CAR_CFG.rr;
  if (hAt(x, z) < WL + 0.55) { mu = 0.72; rr = 0.045; }
  const w = (typeof WX !== 'undefined' && WX.st && WX.st.rain) || 0;
  if (w > 0) mu *= 1 - 0.3 * Math.min(1, w);
  return { mu: mu, rr: rr, sand: rr > 0.03 };
}
function carResetDyn() {
  CAR.v = 0; CAR.r = 0; CAR.delta = 0; CAR.vy = 0; CAR.air = false; CAR.gear = 1; CAR.rpm = CAR_CFG.idle;
  CAR.ax = 0; CAR.ay = 0; CAR.slip = 0; CAR.thr = 0; CAR.brk = 0; CAR.shake = 0; CAR.kickP = 0; CAR.kickR = 0; CAR.shiftT = 0;
}
const __cw = [[-1.148, -1.566], [1.148, -1.566], [-1.148, 1.580], [1.148, 1.580]], __cwh = [0, 0, 0, 0];
function carWheelWorld(i) {
  const c = Math.cos(CAR.yaw), s = Math.sin(CAR.yaw), lx = __cw[i][0], lz = __cw[i][1];
  return [CAR.x + lx * c + lz * s, CAR.z - lx * s + lz * c];
}
function carWheelGround() {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const p = carWheelWorld(i);
    let h = ground(p[0], p[1], CAR.y + 0.75);
    if (!isFinite(h) || h - CAR.y > 1.05) h = CAR.y;
    __cwh[i] = h;
    sum += h;
  }
  return sum / 4;
}

function carStep(dt) {
  if (!CAR.on || !CAR.g) return;
  dt = Math.min(dt, 0.05);
  if (!(dt > 0)) return;
  CAR.saveT += dt;
  CAR.lookIdle += dt;

  const C = CAR_CFG, m = C.m, g9 = 9.81;
  const fwdIn = Math.max(-1, Math.min(1, (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - jv.y));
  const strIn = Math.max(-1, Math.min(1, (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - jv.x));
  const hb = keys.Space ? 1 : 0;

  let thr = 0, brk = 0;
  const u0 = CAR.speed, au0 = Math.abs(u0);
  if (fwdIn > 0.05) {
    if (u0 < -0.8) brk = fwdIn;
    else { thr = fwdIn; if (CAR.gear < 1) CAR.gear = 1; }
  } else if (fwdIn < -0.05) {
    if (u0 > 0.8) brk = -fwdIn;
    else { thr = -fwdIn; CAR.gear = -1; }
  }
  CAR.thr = thr; CAR.brk = brk; CAR.hb = hb;

  const sf = carSurface(CAR.x, CAR.z);
  const gAvg = carWheelGround();
  const pitchT = Math.atan2((__cwh[0] + __cwh[1]) / 2 - (__cwh[2] + __cwh[3]) / 2, C.L * 1.35);
  const rollT = Math.atan2((__cwh[1] + __cwh[3]) / 2 - (__cwh[0] + __cwh[2]) / 2, 2.30);

  if (!CAR.air && CAR.y + CAR.vy * dt - gAvg > 0.35 && CAR.vy > -3) CAR.air = true;
  if (CAR.air) {
    CAR.vy -= 24 * dt; CAR.y += CAR.vy * dt;
    if (CAR.y <= gAvg) {
      const imp = -CAR.vy; CAR.y = gAvg; CAR.air = false; CAR.vy = 0;
      if (imp > 3) {
        CAR.kickP -= Math.min(0.09, imp * 0.008);
        CAR.shake = Math.max(CAR.shake, Math.min(0.8, imp / 14));
        if (imp > 6) {
          CAR.speed *= 0.94;
          if (typeof auHit === 'function') auHit(90, 0.4, Math.min(0.4, imp * 0.03), 'lowpass');
        }
      }
    }
  } else {
    const need = Math.max(-18, Math.min(18, (gAvg - CAR.y) / dt));
    CAR.vy += (need - CAR.vy) * Math.min(1, dt * 10);
    CAR.y = gAvg;
  }
  const grounded = !CAR.air;

  if (CAR.shiftT > 0) CAR.shiftT -= dt;
  else if (CAR.gear > 0) {
    const gs = C.gears;
    if (CAR.rpm > (thr > 0.8 ? 5300 : 4700) && CAR.gear < 5) { CAR.gear++; CAR.shiftT = 0.22; }
    else if (CAR.gear > 1 && au0 > 1 && (CAR.rpm < 2100 || (thr > 0.85 && CAR.rpm < 3000 && CAR.rpm * gs[CAR.gear - 1] / gs[CAR.gear] < 5800))) {
      CAR.gear--; CAR.shiftT = 0.12;
    }
  }

  const dMax = 0.6 / (1 + Math.pow(au0 / 7, 2)) * (1 + 0.15 * hb), dTar = strIn * dMax;
  const dRate = (Math.abs(dTar) > Math.abs(CAR.delta) && dTar * CAR.delta >= 0) ? 3.2 : 5;
  CAR.delta += Math.max(-dRate * dt, Math.min(dRate * dt, dTar - CAR.delta));

  const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
  let dxw = 0, dzw = 0, ayS = 0, spin = false, slipMax = 0;
  for (let k = 0; k < n; k++) {
    const u = CAR.speed, v = CAR.v, r = CAR.r, au = Math.abs(u);
    const dl = CAR.delta, cd = Math.cos(dl), sd = Math.sin(dl);
    const ratio = CAR.gear < 0 ? C.rev : C.gears[Math.max(1, CAR.gear)];
    const rpmW = au / C.R * ratio * 9.5493, launch = C.idle + thr * 2300 * Math.max(0, 1 - au / 5);
    CAR.rpm += (Math.max(rpmW, launch) - CAR.rpm) * Math.min(1, h * (thr > 0 ? 14 : 8));
    CAR.rpm = Math.max(C.idle * 0.95, Math.min(C.redline + 300, CAR.rpm));
    let Fd = 0;
    if (thr > 0 && CAR.shiftT <= 0 && CAR.rpm < C.redline) {
      const gov = CAR.gear < 0 ? Math.max(0, Math.min(1, (C.revMax - au) / 3)) : Math.max(0, Math.min(1, (C.vmax - u) / 6));
      Fd = carTorque(CAR.rpm) * thr * ratio * C.eff / C.R * gov * (CAR.gear < 0 ? -0.8 : 1);
    }
    const Fzf = Math.max(m * g9 * 0.18, m * g9 * C.b / C.L - m * CAR.ax * C.h / C.L);
    const Fzr = Math.max(m * g9 * 0.18, m * g9 * C.a / C.L + m * CAR.ax * C.h / C.L);
    const Fmf = sf.mu * Fzf, Fmr = sf.mu * Fzr;
    let Fxr = Fd;
    if (Math.abs(Fxr) > Fmr * 0.96) { Fxr = Math.sign(Fxr) * Fmr * 0.88; spin = true; }
    const FbT = brk * C.brakeG * m, shR = 0.85 * Fzr / (Fzf + Fzr);
    const Fbf = Math.min(FbT * (1 - shR), Fmf * 0.97);
    let Fbr = Math.min(FbT * shR, Fmr * 0.97);
    const lockR = hb && au > 1.5;
    if (hb) Fbr = Fmr;
    const Lr = Math.min(Fmr * 0.999, Math.max(Math.abs(Fxr), Fbr));
    const capF = Math.max(Fmf * 0.2, Math.sqrt(Math.max(0, Fmf * Fmf - Fbf * Fbf)));
    const capR = Math.max(Fmr * 0.2, Math.sqrt(Math.max(0, Fmr * Fmr - Lr * Lr)));
    let Fyf = 0, Fyr = 0;
    if (grounded) {
      const ue = Math.max(au, 1.2);
      const af = Math.atan2((v + C.a * r) * cd - u * sd, ue), ar = Math.atan2(v - C.b * r, ue);
      Fyf = -capF * Math.tanh(C.Cf * af / capF);
      const latR = v - C.b * r;
      Fyr = lockR ? -Fmr * latR / Math.hypot(latR, Math.max(au, 0.8)) : -capR * Math.tanh(C.Cr * ar / capR);
      slipMax = Math.max(slipMax, Math.abs(ar), Math.abs(af) * 0.8);
    }
    const drag = C.kd * u * au, slope = grounded ? m * g9 * Math.sin(pitchT) : 0;
    const aU = ((grounded ? Fxr : 0) - drag - slope - Fyf * sd) / m + v * r;
    const dec = (grounded ? ((Fbf + Fbr) + sf.rr * m * g9) : 0) / m * h;
    const uNB = u + aU * h;
    let un = Math.abs(uNB) <= dec ? 0 : uNB - Math.sign(uNB) * dec;
    const ay = (Fyf * cd + Fyr) / m;
    let vn = v + (ay - u * r) * h;
    let rn = r + ((C.a * Fyf * cd - C.b * Fyr) / C.Iz - r * 0.25) * h;
    if (grounded && thr === 0 && Math.abs(un) < 0.25 && Math.abs(Math.sin(pitchT)) < 0.22) { un = 0; vn = 0; rn = 0; }

    // Proteger contra giros que enclavan una esquina en la pared
    const nextYaw = CAR.yaw + rn * h;
    const yawEval = carEvaluateSpot(CAR.x, CAR.z, nextYaw, CAR.y);
    if (yawEval.hits > 0) {
      const curEval = carEvaluateSpot(CAR.x, CAR.z, CAR.yaw, CAR.y);
      if (yawEval.hits > curEval.hits) {
        const nxP = CAR.x + yawEval.pushX * 0.14, nzP = CAR.z + yawEval.pushZ * 0.14;
        if (carEvaluateSpot(nxP, nzP, nextYaw, CAR.y).hits <= curEval.hits) {
          CAR.x = nxP; CAR.z = nzP;
          CAR.yaw = nextYaw;
        } else {
          rn *= 0.2;
        }
      } else {
        CAR.yaw = nextYaw;
      }
    } else {
      CAR.yaw = nextYaw;
    }

    CAR.speed = un; CAR.v = vn; CAR.r = rn; ayS += ay;
    const fx = -Math.sin(CAR.yaw), fz = -Math.cos(CAR.yaw);
    dxw += (un * fx + vn * fz) * h;
    dzw += (un * fz - vn * fx) * h;
    if (lockR) spin = false;
  }
  CAR.ax += (((CAR.speed - u0) / dt) - CAR.ax) * Math.min(1, dt * 6);
  CAR.ay += ((ayS / n) - CAR.ay) * Math.min(1, dt * 8);

  // Colisión deslizante con empuje suave hacia afuera (nunca se queda pegado)
  const ox = CAR.x, oz = CAR.z;
  let hitN = 0;
  let curEv = carEvaluateSpot(CAR.x, CAR.z, CAR.yaw, CAR.y);
  if (curEv.hits > 0) {
    const pX = CAR.x + curEv.pushX * 0.28, pZ = CAR.z + curEv.pushZ * 0.28;
    const evP = carEvaluateSpot(pX, pZ, CAR.yaw, CAR.y);
    if (evP.hits < curEv.hits) {
      CAR.x = pX; CAR.z = pZ;
      curEv = evP;
    } else if (thr > 0) {
      const resc = carFindNearestValidSpot(CAR.x, CAR.z, CAR.yaw, CAR.y, 4.5);
      if (resc) { CAR.x = resc.x; CAR.z = resc.z; CAR.y = resc.y; curEv = { hits: 0, pushX: 0, pushZ: 0 }; }
    }
  }

  const ns = Math.max(1, Math.ceil(Math.hypot(dxw, dzw) / 0.30));
  const stepX = dxw / ns, stepZ = dzw / ns;
  for (let i = 0; i < ns; i++) {
    const nx = CAR.x + stepX, nz = CAR.z + stepZ;
    const ev = carEvaluateSpot(nx, nz, CAR.yaw, CAR.y);
    if (ev.hits === 0) {
      CAR.x = nx; CAR.z = nz;
      curEv = ev;
      continue;
    }
    // Permite salir si nos alejamos de un contacto previo
    if (curEv.hits > 0 && ev.hits < curEv.hits) {
      CAR.x = nx; CAR.z = nz;
      curEv = ev;
      continue;
    }

    // Intentar deslizar tangencialmente a la normal de choque + pequeño empuje hacia afuera
    const pnx = ev.pushX, pnz = ev.pushZ;
    const stepDot = stepX * pnx + stepZ * pnz;
    const slideX = stepX - Math.min(0, stepDot) * pnx;
    const slideZ = stepZ - Math.min(0, stepDot) * pnz;
    let moved = false;

    const trySlide = (tx, tz) => {
      const e = carEvaluateSpot(tx, tz, CAR.yaw, CAR.y);
      if (e.hits === 0 || (curEv.hits > 0 && e.hits < curEv.hits)) {
        CAR.x = tx; CAR.z = tz; curEv = e; return true;
      }
      return false;
    };

    if (trySlide(CAR.x + slideX + pnx * 0.08, CAR.z + slideZ + pnz * 0.08)) moved = true;
    else if (trySlide(CAR.x + slideX, CAR.z + slideZ)) moved = true;
    else if (trySlide(nx, CAR.z)) moved = true;
    else if (trySlide(CAR.x, nz)) moved = true;

    const f = carForward(), lx = f.z, lz = -f.x;
    let vx = CAR.speed * f.x + CAR.v * lx, vz = CAR.speed * f.z + CAR.v * lz;
    let imp = 0;
    if (Math.hypot(pnx, pnz) > 0.1) {
      const vn = vx * pnx + vz * pnz;
      if (vn < 0) {
        imp = -vn;
        vx -= vn * 1.12 * pnx;
        vz -= vn * 1.12 * pnz;
      }
    } else {
      imp = Math.hypot(vx, vz);
      vx *= -0.15; vz *= -0.15;
    }
    CAR.speed = (vx * f.x + vz * f.z) * (moved ? 0.92 : 0.72);
    CAR.v = (vx * lx + vz * lz) * (moved ? 0.85 : 0.5);
    hitN = Math.max(hitN, imp);
    if (!moved) {
      if (pnx !== 0 || pnz !== 0) {
        const nudge = carEvaluateSpot(CAR.x + pnx * 0.12, CAR.z + pnz * 0.12, CAR.yaw, CAR.y);
        if (nudge.hits <= curEv.hits) { CAR.x += pnx * 0.12; CAR.z += pnz * 0.12; }
      }
      break;
    }
  }

  if (grounded && hitN < 1) {
    const g2 = carWheelGround();
    if (g2 - CAR.y > 0.95 + Math.abs(CAR.speed) * dt * 0.85) {
      CAR.x = ox; CAR.z = oz; hitN = Math.abs(CAR.speed); CAR.speed *= -0.18; CAR.v *= 0.3;
    }
  }
  if (hitN > 3.2) {
    CAR.shake = Math.max(CAR.shake, Math.min(1, hitN / 16));
    CAR.kickP -= Math.min(0.08, hitN * 0.006);
    CAR.kickR += (Math.random() - 0.5) * Math.min(0.10, hitN * 0.008);
    if (typeof auHit === 'function') auHit(130, 0.45, Math.min(0.45, hitN * 0.03), 'lowpass');
    const t = performance.now();
    if (hitN > 10 && t > (CAR.msgT || 0)) {
      CAR.msgT = t + 2500;
      if (typeof showMsg === 'function') showMsg('💥 ¡Choque!');
    }
  }

  const kS = Math.min(1, dt * 7);
  CAR.pitch += (((CAR.air ? Math.atan2(CAR.vy, Math.max(4, Math.abs(CAR.speed))) * 0.9 : pitchT) + Math.max(-0.11, Math.min(0.09, CAR.ax * 0.0095)) + CAR.kickP) - CAR.pitch) * kS;
  CAR.roll += (((CAR.air ? 0 : rollT) + Math.max(-0.12, Math.min(0.12, -CAR.ay * 0.0085)) + CAR.kickR) - CAR.roll) * kS;
  CAR.kickP *= Math.max(0, 1 - dt * 5);
  CAR.kickR *= Math.max(0, 1 - dt * 5);
  if (Math.abs(CAR.y - CAR.ySm) > 0.9) CAR.ySm = CAR.y;
  else CAR.ySm += (CAR.y - CAR.ySm) * Math.min(1, dt * 20);
  CAR.g.position.set(CAR.x, CAR.ySm, CAR.z);
  CAR.g.rotation.y = CAR.yaw;
  if (CAR.body) {
    CAR.body.rotation.x = CAR.pitch;
    CAR.body.rotation.z = CAR.roll;
    const vib = Math.sin(performance.now() * 0.001 * CAR.rpm / 60 * 6.283) * 0.0011 * (0.4 + thr);
    CAR.body.position.y = vib;
  }

  // Animación interior: volante, agujas alineadas a las escalas del cuadro, palanca, freno y limpiaparabrisas
  if (CAR.steerPivot) CAR.steerPivot.rotation.z = CAR.delta * 4.5;
  if (CAR.speedNeedle) {
    const kmh = Math.min(140, Math.abs(CAR.speed) * 3.6);
    CAR.speedNeedle.rotation.z = 2.26 - (kmh / 140) * 4.52;
  }
  if (CAR.rpmNeedle) {
    const rN = Math.max(0, Math.min(1, (CAR.rpm - 700) / (CAR_CFG.redline - 700)));
    CAR.rpmNeedle.rotation.z = 2.26 - rN * 4.52;
  }
  if (CAR.shifterPivot) {
    const tgtSh = CAR.gear < 0 ? 0.24 : -0.18;
    CAR.shifterPivot.rotation.x += (tgtSh - CAR.shifterPivot.rotation.x) * Math.min(1, dt * 12);
  }
  if (CAR.hbPivot) {
    const tgtHb = hb ? -0.45 : 0;
    CAR.hbPivot.rotation.x += (tgtHb - CAR.hbPivot.rotation.x) * Math.min(1, dt * 14);
  }
  if (CAR.radioLedMat) {
    CAR.radioLedMat.emissiveIntensity = CAR.radio > 0 ? 0.95 : 0;
  }
  if (CAR.wipers.length) {
    const rain = (typeof WX !== 'undefined' && WX.st && WX.st.rain) || 0;
    if (rain > 0.15) {
      CAR.wiperPhase += dt * (2.6 + rain * 2.2);
      const ang = (Math.sin(CAR.wiperPhase) * 0.5 + 0.5) * 0.85;
      for (const wp of CAR.wipers) wp.rotation.z = ang;
    } else if (Math.abs(CAR.wipers[0].rotation.z) > 0.01) {
      for (const wp of CAR.wipers) wp.rotation.z *= Math.max(0, 1 - dt * 6);
    }
  }

  const spinRate = CAR.speed / (C.R * 1.35), au = Math.abs(CAR.speed);
  for (let i = 0; i < CAR.wheelPivots.length; i++) {
    const w = CAR.wheelPivots[i];
    const tgt = CAR.air ? C.R - 0.12 : C.R + Math.max(-0.22, Math.min(0.2, __cwh[i] - CAR.ySm));
    w.y += (tgt - w.y) * Math.min(1, dt * (CAR.air ? 4 : 22));
    w.p.position.y = w.y;
    const sp = CAR.wheels[i];
    if (!w.front && hb && au > 1.5) {}
    else if (!w.front && spin) sp.rotation.x -= 30 * dt * (CAR.gear < 0 ? -1 : 1);
    else sp.rotation.x -= spinRate * dt;
    if (w.front) w.p.rotation.y = CAR.delta;
  }
  if (CAR.tailMat) CAR.tailMat.emissiveIntensity = (brk > 0 || hb) ? 2.6 : 0.5;
  if (CAR.revMat) CAR.revMat.emissiveIntensity = (CAR.gear < 0 && thr > 0) ? 1.8 : 0;

  let sl = 0;
  if (grounded) {
    sl = Math.max(0, Math.min(1, (slipMax - 0.12) * 5));
    if (spin) sl = Math.max(sl, 0.75);
    if (hb && au > 2.5) sl = 1;
    if (brk > 0.9 && au0 > 12) sl = Math.max(sl, 0.5);
  }
  CAR.slip += (sl - CAR.slip) * Math.min(1, dt * 10);
  carFxStep(dt, sf);

  S.x = CAR.x; S.z = CAR.z; S.y = CAR.ySm + 1.05; S.yaw = CAR.yaw;
  saveCarState(false);
  radioFrame();
  carSoundFrame(dt);
}

function carFxStep(dt, sf) {
  const K = CAR.skid, SM = CAR.smoke;
  if (!K || !SM) return;
  const on = CAR.slip > 0.22 && !CAR.air;
  const f = carForward(), vx = CAR.speed * f.x + CAR.v * f.z, vz = CAR.speed * f.z - CAR.v * f.x;
  const th = Math.hypot(vx, vz) > 1 ? Math.atan2(-vx, -vz) : CAR.yaw;
  for (let wi = 0; wi < 2; wi++) {
    const p = carWheelWorld(2 + wi);
    if (on) {
      const L = K.last[wi];
      if (!L || Math.hypot(p[0] - L[0], p[1] - L[1]) > 0.3) {
        const d = K.d;
        d.position.set(p[0], __cwh[2 + wi] + 0.04, p[1]);
        d.rotation.set(0, th, 0);
        d.scale.set(1, 1, 1);
        d.updateMatrix();
        K.im.setMatrixAt(K.i, d.matrix);
        K.i = (K.i + 1) % K.N;
        K.im.instanceMatrix.needsUpdate = true;
        K.last[wi] = [p[0], p[1]];
      }
    } else K.last[wi] = null;
  }
  SM.t -= dt;
  if (on && CAR.slip > 0.3 && SM.t <= 0) {
    SM.t = 0.05;
    const p = carWheelWorld(2 + (Math.random() < 0.5 ? 0 : 1)), q = SM.arr[SM.i];
    SM.i = (SM.i + 1) % SM.arr.length;
    q.sp.position.set(p[0], __cwh[2] + 0.25, p[1]);
    q.sp.material.color.setHex(sf.sand ? 0xd8c79a : 0xcfd3d2);
    q.life = 0; q.max = 0.9 + Math.random() * 0.5;
    q.vx = (Math.random() - 0.5) * 0.8 + vx * 0.1;
    q.vy = 0.5 + Math.random() * 0.5;
    q.vz = (Math.random() - 0.5) * 0.8 + vz * 0.1;
    q.sp.visible = true;
  }
  for (const q of SM.arr) {
    if (!q.sp.visible) continue;
    q.life += dt;
    const t = q.life / q.max;
    if (t >= 1) { q.sp.visible = false; q.sp.material.opacity = 0; continue; }
    q.sp.position.x += q.vx * dt;
    q.sp.position.y += q.vy * dt;
    q.sp.position.z += q.vz * dt;
    const s = 0.5 + t * 2.2;
    q.sp.scale.set(s, s, s);
    q.sp.material.opacity = (1 - t) * 0.42;
  }
}

function carCamera(dt) {
  const u = CAR.speed, au = Math.abs(u), f = carForward();
  CAR.shake = Math.max(0, CAR.shake - dt * 1.6);

  // Recentrar suavemente solo si llevas rato conduciendo rápido sin mover el ratón
  if (CAR.lookIdle > 2.2 && au > 4) {
    const rec = Math.min(1, dt * 1.6);
    CAR.lookYaw += (0 - CAR.lookYaw) * rec;
    CAR.lookPitch += ((CAR.camMode === 'first' ? -0.02 : 0) - CAR.lookPitch) * rec;
  }

  if (CAR.camMode === 'first' && CAR.eyeAnchor && CAR.g) {
    CAR.g.updateMatrixWorld(true);
    CAR.eyeAnchor.getWorldPosition(_carEyePos);
    cam.position.copy(_carEyePos);
    const qShake = CAR.shake * 0.08 + Math.min(1, au / 35) * 0.004 * (CAR.air ? 0 : 1);
    if (qShake > 0) {
      cam.position.x += (Math.random() - 0.5) * qShake;
      cam.position.y += (Math.random() - 0.5) * qShake;
      cam.position.z += (Math.random() - 0.5) * qShake;
    }
    _carFlatEuler.set(CAR.pitch * 0.48, CAR.yaw, -CAR.roll * 0.45, 'YXZ');
    _carQuat.setFromEuler(_carFlatEuler);
    _carLookEuler.set(CAR.lookPitch, CAR.lookYaw, 0, 'YXZ');
    _carLookQuat.setFromEuler(_carLookEuler);
    cam.quaternion.copy(_carQuat).multiply(_carLookQuat);
    return;
  }

  // Tercera persona con órbita libre del ratón y anti-clipping contra colinas
  const vx = u * f.x + CAR.v * f.z, vz = u * f.z - CAR.v * f.x;
  let target = CAR.yaw;
  if (au > 4 && u > 0) {
    let d = Math.atan2(-vx, -vz) - CAR.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    target = CAR.yaw + Math.max(-0.7, Math.min(0.7, d)) * 0.5;
  }
  let dy = target - CAR.camYaw;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  CAR.camYaw += dy * Math.min(1, dt * (3 + Math.min(3, au * 0.08)));

  const orbitYaw = CAR.camYaw + CAR.lookYaw;
  const dist = 7.6 + Math.min(2, au * 0.055);
  const hgt = 3.0 + Math.min(0.6, au * 0.017) - Math.sin(CAR.lookPitch) * 2.4;
  const sn = Math.sin(orbitYaw), cs = Math.cos(orbitYaw);
  const cx = S.x + sn * dist, cz = S.z + cs * dist;
  let cy = S.y + hgt - CAR.pitch * 1.4;
  if (typeof ground === 'function') {
    const cg = ground(cx, cz, S.y + 4);
    if (Number.isFinite(cg)) cy = Math.max(cy, cg + 0.65);
  }
  cam.position.set(cx, cy, cz);

  const q = CAR.shake * 0.35 + Math.min(1, au / 35) * 0.012 * (CAR.air ? 0 : 1);
  if (q > 0) {
    cam.position.x += (Math.random() - 0.5) * q;
    cam.position.y += (Math.random() - 0.5) * q;
    cam.position.z += (Math.random() - 0.5) * q;
  }
  _carTargetPos.set(S.x - sn * 1.2, S.y + 0.9 + Math.sin(CAR.lookPitch) * 1.8, S.z - cs * 1.6);
  cam.lookAt(_carTargetPos);
}

function carSoundOn() {
  if (CAR.snd || !AU.ctx || !AU.on) return;
  const C = AU.ctx, t = C.currentTime;
  const mk = ty => { const o = C.createOscillator(); o.type = ty; return o; };
  const gn = v => { const g = C.createGain(); g.gain.value = v; return g; };
  const o1 = mk('sawtooth'), o2 = mk('square'), o3 = mk('triangle'), lp = C.createBiquadFilter(), mg = gn(0);
  lp.type = 'lowpass'; lp.Q.value = 2.2;
  const a = gn(0.5), b = gn(0.2), c = gn(0.6);
  o1.connect(a); o2.connect(b); o3.connect(c); a.connect(lp); b.connect(lp); c.connect(lp); lp.connect(mg); mg.connect(C.destination);
  o1.start(t); o2.start(t); o3.start(t);
  const S_ = { o1: o1, o2: o2, o3: o3, a: a, b: b, c: c, lp: lp, mg: mg, src: [] };
  if (AU.nb) {
    const nz = (fr, q) => {
      const s = C.createBufferSource(); s.buffer = AU.nb; s.loop = true;
      const f = C.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = q;
      const g = gn(0); s.connect(f); f.connect(g); g.connect(C.destination); s.start(t); S_.src.push(s);
      return { f: f, g: g };
    };
    S_.wind = nz(500, 0.6); S_.sq = nz(1800, 8);
  }
  CAR.snd = S_;
}

function carSoundMute() {
  const s = CAR.snd;
  if (!s || !AU.ctx) return;
  const t = AU.ctx.currentTime;
  try {
    s.mg.gain.setTargetAtTime(0, t, 0.03);
    if (s.wind) { s.wind.g.gain.setTargetAtTime(0, t, 0.03); s.sq.g.gain.setTargetAtTime(0, t, 0.03); }
  } catch (e) {}
}

function carSoundFrame() {
  if (!CAR.on) return;
  if (!CAR.snd) { carSoundOn(); if (!CAR.snd) return; }
  const s = CAR.snd, C = AU.ctx;
  if (!C) return;
  const t = C.currentTime, on = (AU.on && S.on && !CIN.on && !document.hidden && !window.__boisGuideOverlayOpen) ? 1 : 0, rpm = CAR.rpm, f0 = rpm / 30, thr = CAR.thr, au = Math.abs(CAR.speed);
  const cabinDamp = CAR.camMode === 'first' ? 0.72 : 1.0;
  s.o1.frequency.setTargetAtTime(f0, t, 0.03);
  s.o2.frequency.setTargetAtTime(f0 * 0.5, t, 0.03);
  s.o3.frequency.setTargetAtTime(f0 * 2, t, 0.03);
  s.lp.frequency.setTargetAtTime((350 + rpm * 0.35 + thr * 500) * (CAR.camMode === 'first' ? 0.82 : 1), t, 0.05);
  s.mg.gain.setTargetAtTime(on * (0.03 + 0.045 * thr + 0.02 * rpm / 6600) * (CAR.shiftT > 0 ? 0.6 : 1) * cabinDamp, t, 0.05);
  if (s.wind) {
    s.wind.g.gain.setTargetAtTime(on * Math.min(0.09, Math.pow(au / 35, 2) * 0.12) * cabinDamp, t, 0.1);
    s.wind.f.frequency.setTargetAtTime(300 + au * 40, t, 0.1);
    s.sq.g.gain.setTargetAtTime(on * CAR.slip * 0.06, t, 0.05);
    s.sq.f.frequency.setTargetAtTime(1400 + CAR.slip * 600, t, 0.05);
  }
}

function carSoundOff() {
  const s = CAR.snd;
  CAR.snd = null;
  if (!s || !AU.ctx) return;
  const C = AU.ctx, t = C.currentTime;
  try {
    s.mg.gain.setTargetAtTime(0, t, 0.05);
    if (s.wind) { s.wind.g.gain.setTargetAtTime(0, t, 0.05); s.sq.g.gain.setTargetAtTime(0, t, 0.05); }
    const stop = () => {
      try {
        s.o1.stop(); s.o2.stop(); s.o3.stop();
        s.o1.disconnect(); s.o2.disconnect(); s.o3.disconnect();
        if (s.a) s.a.disconnect();
        if (s.b) s.b.disconnect();
        if (s.c) s.c.disconnect();
        s.lp.disconnect(); s.mg.disconnect();
        s.src.forEach(x => { x.stop(); x.disconnect(); });
        if (s.wind) { s.wind.f.disconnect(); s.wind.g.disconnect(); }
        if (s.sq) { s.sq.f.disconnect(); s.sq.g.disconnect(); }
      }
      catch (e) { typeof __bw === 'function' && __bw('28-car-radio#1', e); }
    };
    setTimeout(stop, 400);
  } catch (e) {
    typeof __bw === 'function' && __bw('28-car-radio#2', e);
  }
}

let __carHudKey = '', __carLightT = 0;
function carUiFrame(dt) {
  __carLightT -= dt;
  if (__carLightT <= 0) { __carLightT = 1; updateCarLights(); }
  if (!CAR.on) return;
  const kmh = Math.round(Math.abs(CAR.speed) * 3.6);
  const rn = CAR.radio > 0 ? CAR_STATIONS[CAR.radio].name : 'Radio apagada';
  const gear = (Math.abs(CAR.speed) < 0.4 && CAR.thr === 0) ? 'N' : (CAR.gear < 0 ? 'R' : String(CAR.gear));
  const rp = Math.round(Math.max(0, Math.min(1, (CAR.rpm - 800) / (CAR_CFG.redline - 800))) * 50) * 2;
  const vm = CAR.camMode === 'first' ? 'CABINA (C)' : 'EXTERIOR (C)';
  const k = kmh + '|' + rn + '|' + gear + '|' + rp + '|' + (CAR.hb ? 1 : 0) + '|' + vm;
  if (k === __carHudKey) return;
  __carHudKey = k;
  const a = document.getElementById('carSpeed');
  const b = document.getElementById('carRadioName');
  const c = document.getElementById('carGear');
  const d = document.getElementById('carRpm');
  const e = document.getElementById('carViewMode');
  if (a) a.textContent = kmh;
  if (b) b.textContent = rn;
  if (c) c.textContent = gear + (CAR.hb ? ' · P' : '');
  if (d) { d.style.width = rp + '%'; d.className = rp >= 88 ? 'hot' : ''; }
  if (e) e.textContent = vm;
}

function carHudOff() {
  const hud = document.getElementById('carHud');
  if (hud) hud.classList.remove('on');
  const p = document.getElementById('carPrompt');
  if (p) p.classList.remove('on');
}

window.addEventListener('pagehide', () => saveCarState(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) saveCarState(true); });

buildCar();
const carHud = document.getElementById('carHud'), carPrompt = document.getElementById('carPrompt');
if (carHud) carHud.classList.remove('on');
if (carPrompt) carPrompt.classList.remove('on');
