/* BOIS.IO · 28-car-radio.js — Auto procedural pulido, colisión, HUD y radio */
// ===== v113 / v136+ · AUTO + RADIO (Modelo pulido) =====
// Vehículo procedural ligero: sin assets externos, independiente de fauna/Poolrooms.
const CAR = {
  g: null,
  body: null,
  wheels: [],
  frontWheels: [],
  lights: [],
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

function buildCar() {
  if (CAR.modelBuilt || !scene) return;

  CAR.wheels = [];
  CAR.frontWheels = [];
  CAR.wheelPivots = [];
  CAR.lights = [];

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
  const paintDeep = new THREE.MeshStandardMaterial({ color: 0x102c28, roughness: 0.55, metalness: 0.35 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x171b20, roughness: 0.62, metalness: 0.18 });
  const underMat = new THREE.MeshStandardMaterial({ color: 0x0c0e11, roughness: 0.92, metalness: 0.05, side: THREE.DoubleSide });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe6e1d6, roughness: 0.12, metalness: 0.95 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a35a, roughness: 0.28, metalness: 0.78 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x734934, roughness: 0.82, metalness: 0.02 });
  const leatherDark = new THREE.MeshStandardMaterial({ color: 0x4b2e20, roughness: 0.86, metalness: 0.02 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x132b32, roughness: 0.06, metalness: 0.15,
    transparent: true, opacity: 0.44, depthWrite: false, side: THREE.DoubleSide
  });
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
  const gaugeMat = new THREE.MeshStandardMaterial({
    color: 0x122229, emissive: 0x45c4b0, emissiveIntensity: 0.45, roughness: 0.35
  });

  CAR.headMat = headMat;
  CAR.tailMat = tailMat;
  CAR.revMat = revMat;

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

  // --- Carrocería ---
  const profile = new THREE.Shape();
  profile.moveTo(-2.05, 0.36);
  profile.lineTo(-2.05, 0.82);
  profile.quadraticCurveTo(-1.32, 1.03, -0.38, 1.06);
  profile.lineTo(0.96, 1.06);
  profile.quadraticCurveTo(1.52, 1.00, 2.02, 0.78);
  profile.lineTo(2.02, 0.38);
  profile.lineTo(1.66, 0.36);
  profile.quadraticCurveTo(1.17, 1.04, 0.68, 0.38);
  profile.lineTo(-0.67, 0.38);
  profile.quadraticCurveTo(-1.16, 1.04, -1.65, 0.36);
  profile.closePath();

  const shellGeo = new THREE.ExtrudeGeometry(profile, {
    depth: 1.66,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.04,
    bevelSegments: 3,
    curveSegments: 16
  });
  shellGeo.translate(0, 0, -0.83);
  shellGeo.rotateY(-Math.PI / 2);
  shellGeo.computeVertexNormals();
  const shell = new THREE.Mesh(shellGeo, paint);
  shell.castShadow = true;
  shell.receiveShadow = true;
  body.add(shell);

  add(new THREE.BoxGeometry(0.66, 0.036, 0.96), paint, 0, 1.03, -1.16, -0.085, 0, 0, true);
  add(new THREE.BoxGeometry(1.20, 0.08, 3.85), underMat, 0, 0.34, -0.02);
  add(new THREE.BoxGeometry(1.62, 0.10, 1.24), paintDeep, 0, 0.39, 0.01);

  // --- Cabina ---
  const cab = new THREE.Shape();
  cab.moveTo(-0.55, 1.05);
  cab.lineTo(-0.12, 1.49);
  cab.lineTo(0.68, 1.51);
  cab.lineTo(1.12, 1.05);
  cab.closePath();

  const cabGeo = new THREE.ExtrudeGeometry(cab, {
    depth: 1.26,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.022,
    bevelSegments: 2,
    curveSegments: 6
  });
  cabGeo.translate(0, 0, -0.63);
  cabGeo.rotateY(-Math.PI / 2);
  cabGeo.computeVertexNormals();
  const cabMesh = new THREE.Mesh(cabGeo, paint);
  cabMesh.castShadow = true;
  cabMesh.receiveShadow = true;
  body.add(cabMesh);

  // Parabrisas y medallón con marcos
  add(new THREE.BoxGeometry(1.14, 0.59, 0.022), glassMat, 0, 1.28, -0.355, 0.773, 0, 0);
  add(new THREE.BoxGeometry(1.18, 0.035, 0.035), trim, 0, 1.08, -0.54, 0.773, 0, 0);
  add(new THREE.BoxGeometry(1.18, 0.035, 0.035), trim, 0, 1.48, -0.15, 0.773, 0, 0);

  add(new THREE.BoxGeometry(1.10, 0.54, 0.022), glassMat, 0, 1.29, 0.915, -0.737, 0, 0);
  add(new THREE.BoxGeometry(1.14, 0.035, 0.035), trim, 0, 1.08, 1.10, -0.737, 0, 0);
  add(new THREE.BoxGeometry(1.14, 0.035, 0.035), trim, 0, 1.48, 0.71, -0.737, 0, 0);

  // Limpiaparabrisas
  for (const wx of [-0.28, 0.16]) {
    add(new THREE.BoxGeometry(0.42, 0.014, 0.018), trim, wx, 1.095, -0.57, 0.25, 0.14, -0.18);
  }

  // Ventanas laterales, molduras y barras de techo ancladas
  const winShape = new THREE.Shape();
  winShape.moveTo(-0.44, 1.10);
  winShape.lineTo(-0.10, 1.43);
  winShape.lineTo(0.62, 1.45);
  winShape.lineTo(0.98, 1.10);
  winShape.closePath();
  const winGeo = new THREE.ShapeGeometry(winShape);
  winGeo.rotateY(-Math.PI / 2);
  const seamGeo = new THREE.BoxGeometry(0.01, 0.52, 0.014);
  const handleGeo = new THREE.BoxGeometry(0.024, 0.028, 0.13);

  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(winGeo, glassMat);
    w.position.set(sx * 0.656, 0, 0);
    body.add(w);
    add(new THREE.BoxGeometry(0.024, 0.022, 1.46), chrome, sx * 0.658, 1.085, 0.27);
    add(new THREE.BoxGeometry(0.032, 0.37, 0.055), trim, sx * 0.656, 1.27, 0.34);
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

    const spot = new THREE.SpotLight(0xfff0cf, 0, 24, Math.PI / 8, 0.42, 1.35);
    spot.position.set(sx * 0.54, 0.72, -2.16);
    spot.target.position.set(sx * 0.54, 0.35, -14);
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
  add(new THREE.BoxGeometry(1.64, 0.12, 0.09), trim, 0, 0.44, 2.085, 0, 0, 0, true);
  add(new THREE.BoxGeometry(1.70, 0.065, 0.07), chrome, 0, 0.42, 2.125, 0, 0, 0, true);
  add(new THREE.BoxGeometry(0.34, 0.10, 0.28), underMat, 0.50, 0.33, 1.85);
  for (const ex of [0.44, 0.56]) {
    add(new THREE.CylinderGeometry(0.034, 0.034, 0.24, 12), chrome, ex, 0.33, 2.09, Math.PI / 2);
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

  // --- Espejos / antena / interior ---
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.11, 0.036, 0.045), trim, sx * 0.73, 1.11, -0.24);
    add(new THREE.BoxGeometry(0.16, 0.08, 0.095), paint, sx * 0.87, 1.14, -0.25);
    add(new THREE.PlaneGeometry(0.125, 0.058), mirrorGlassMat, sx * 0.87, 1.14, -0.201);
  }
  add(new THREE.CylinderGeometry(0.018, 0.024, 0.03, 8), trim, 0.38, 1.525, 0.54);
  add(new THREE.CylinderGeometry(0.006, 0.01, 0.42, 6), chrome, 0.42, 1.71, 0.62, 0.25, 0, -0.18);

  for (const pair of [[-0.28, 0.22], [0.28, 0.26]]) {
    const sx = pair[0], oz = pair[1];
    add(new THREE.BoxGeometry(0.40, 0.16, 0.42), leather, sx, 0.76, oz);
    add(new THREE.BoxGeometry(0.38, 0.34, 0.08), leather, sx, 0.96, oz + 0.18, 0.14);
    add(new THREE.BoxGeometry(0.20, 0.13, 0.065), leatherDark, sx, 1.19, oz + 0.21, 0.14);
  }
  add(new THREE.BoxGeometry(0.16, 0.18, 0.90), leatherDark, 0, 0.76, 0.02);
  add(new THREE.CylinderGeometry(0.01, 0.012, 0.16, 8), chrome, 0, 0.91, -0.10, -0.18);
  add(new THREE.SphereGeometry(0.026, 12, 10), leather, 0, 0.99, -0.115);

  add(new THREE.BoxGeometry(1.12, 0.11, 0.32), trim, 0, 0.96, -0.45);
  add(new THREE.BoxGeometry(0.34, 0.11, 0.14), trim, -0.28, 1.04, -0.46);
  add(new THREE.PlaneGeometry(0.24, 0.068), gaugeMat, -0.28, 1.04, -0.388);
  add(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 8), trim, -0.28, 1.02, -0.36, Math.PI / 2 - 0.55);
  add(new THREE.TorusGeometry(0.13, 0.015, 10, 20), chrome, -0.28, 1.06, -0.30, 0.55);
  add(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 12), trim, -0.28, 1.06, -0.30, Math.PI / 2 + 0.55);
  add(new THREE.BoxGeometry(0.24, 0.018, 0.012), chrome, -0.28, 1.06, -0.30, 0.55);
  add(new THREE.BoxGeometry(0.18, 0.045, 0.025), trim, 0, 1.40, -0.22);

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
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    spin.add(rim);
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

  // Spawn: cámbialo por tu playa / punto de inicio
  const sx = (typeof BEACH !== 'undefined') ? BEACH[0] - 8 : 0;
  const sz = (typeof BEACH !== 'undefined') ? BEACH[1] + 12 : 0;
  const gy = (typeof ground === 'function') ? ground(sx, sz, 300) : 0;
  g.position.set(sx, gy, sz);
  CAR.x = g.position.x;
  CAR.z = g.position.z;
  CAR.y = g.position.y;
  CAR.yaw = Math.PI;
  CAR.ySm = CAR.y;
  g.rotation.y = CAR.yaw;

  g.scale.set(1.35, 1.35, 1.35);
  scene.add(g);
  CAR.g = g;
  CAR.modelBuilt = true;

  carInitFx();
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
  for (const l of CAR.lights) l.intensity = night ? 2.2 : 0;
  if (CAR.headMat) CAR.headMat.emissiveIntensity = night ? 1.65 : 0.75;
  if (CAR.tailMat && !CAR.on) CAR.tailMat.emissiveIntensity = night ? 0.95 : 0.48;
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
  if (!b) return;
  b.style.display = touch && visible ? 'inline-flex' : 'none';
  b.setAttribute('aria-hidden', visible && touch ? 'false' : 'true');
  if (!visible) {
    b.classList.remove('held');
    keys.Space = 0;
  }
}

function enterCar() {
  if (!CAR.g || CAR.on || !S.on || CIN.on || S.sw || S.fly || (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || Math.abs(S.y - CAR.g.position.y) >= 4) return false;
  const d = Math.hypot(S.x - CAR.g.position.x, S.z - CAR.g.position.z);
  if (d > 4.4) return false;
  CAR.on = true;
  CAR.speed = 0;
  CAR.yaw = CAR.g.rotation.y;
  CAR.radio = CAR.radio < 0 ? 0 : CAR.radio;
  setCarBrakeButton(true);
  carResetDyn();
  CAR.camYaw = CAR.yaw;
  CAR.y = CAR.g.position.y;
  CAR.ySm = CAR.y;
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
    prompt.textContent = 'E · bajar del auto';
  }
  if (typeof STORY !== 'undefined' && STORY.flags && !STORY.flags.car_intro) {
    storyFlag('car_intro', 1);
    showMsg('🚗 Tu viejo auto · aún guarda las emisoras de siempre (R) · WASD conduce · E baja');
  } else {
    showMsg('🚗 Subiste al auto · WASD conduce · Espacio freno de mano · E baja · R radio');
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
  S.x = p.x;
  S.z = p.z;
  S.y = p.y;
  S.vy = 0;
  S.sw = false;
  S.yaw = CAR.yaw;
  S.fly = false;
  S.on = true;
  for (const k in keys) keys[k] = 0;
  jumpQ = false;
  carHudOff();
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
    let h = ground(p[0], p[1], CAR.y + 0.6);
    if (!isFinite(h) || h - CAR.y > 0.9) h = CAR.y;
    __cwh[i] = h;
    sum += h;
  }
  return sum / 4;
}
function carStep(dt) {
  if (!CAR.on || !CAR.g) return;
  dt = Math.min(dt, 0.05);
  if (!(dt > 0)) return;
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
    CAR.speed = un; CAR.v = vn; CAR.r = rn; CAR.yaw += rn * h; ayS += ay;
    const fx = -Math.sin(CAR.yaw), fz = -Math.cos(CAR.yaw);
    dxw += (un * fx + vn * fz) * h;
    dzw += (un * fz - vn * fx) * h;
    if (lockR) spin = false;
  }
  CAR.ax += (((CAR.speed - u0) / dt) - CAR.ax) * Math.min(1, dt * 6);
  CAR.ay += ((ayS / n) - CAR.ay) * Math.min(1, dt * 8);

  const ox = CAR.x, oz = CAR.z;
  let hitN = 0;
  const ns = Math.max(1, Math.ceil(Math.hypot(dxw, dzw) / 0.35));
  for (let i = 0; i < ns; i++) {
    const nx = CAR.x + dxw / ns, nz = CAR.z + dzw / ns;
    if (validCarSpot(nx, nz)) { CAR.x = nx; CAR.z = nz; continue; }
    let hx = false, hz = false;
    if (validCarSpot(nx, CAR.z)) { CAR.x = nx; hz = true; }
    else if (validCarSpot(CAR.x, nz)) { CAR.z = nz; hx = true; }
    else { hx = true; hz = true; }
    const f = carForward(), lx = f.z, lz = -f.x;
    let vx = CAR.speed * f.x + CAR.v * lx, vz = CAR.speed * f.z + CAR.v * lz, imp = 0;
    if (hx) { imp = Math.max(imp, Math.abs(vx)); vx = -vx * 0.12; }
    if (hz) { imp = Math.max(imp, Math.abs(vz)); vz = -vz * 0.12; }
    CAR.speed = (vx * f.x + vz * f.z) * 0.96;
    CAR.v = (vx * lx + vz * lz) * 0.96;
    CAR.r += (Math.random() - 0.5) * Math.min(1.2, imp * 0.05);
    hitN = imp;
    break;
  }
  if (grounded && hitN < 1) {
    const g2 = carWheelGround();
    if (g2 - CAR.y > 0.5 + Math.abs(CAR.speed) * dt * 0.6) {
      CAR.x = ox; CAR.z = oz; hitN = Math.abs(CAR.speed); CAR.speed *= -0.15; CAR.v *= 0.3;
    }
  }
  if (hitN > 2.5) {
    CAR.shake = Math.max(CAR.shake, Math.min(1, hitN / 16));
    CAR.kickP -= Math.min(0.1, hitN * 0.008);
    CAR.kickR += (Math.random() - 0.5) * Math.min(0.12, hitN * 0.01);
    if (typeof auHit === 'function') auHit(130, 0.45, Math.min(0.5, hitN * 0.035), 'lowpass');
    const t = performance.now();
    if (hitN > 9 && t > (CAR.msgT || 0)) {
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
    const vib = Math.sin(performance.now() * 0.001 * CAR.rpm / 60 * 6.283) * 0.0012 * (0.4 + thr);
    CAR.body.position.y = vib;
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
  const dist = 7.6 + Math.min(2, au * 0.055), hgt = 3.1 + Math.min(0.6, au * 0.017);
  const sn = Math.sin(CAR.camYaw), cs = Math.cos(CAR.camYaw);
  cam.position.set(S.x + sn * dist, S.y + hgt - CAR.pitch * 1.5, S.z + cs * dist);
  CAR.shake = Math.max(0, CAR.shake - dt * 1.6);
  const q = CAR.shake * 0.35 + Math.min(1, au / 35) * 0.012 * (CAR.air ? 0 : 1);
  if (q > 0) {
    cam.position.x += (Math.random() - 0.5) * q;
    cam.position.y += (Math.random() - 0.5) * q;
    cam.position.z += (Math.random() - 0.5) * q;
  }
  cam.lookAt(S.x - sn * 1.2, S.y + 0.9, S.z - cs * 1.6);
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
  s.o1.frequency.setTargetAtTime(f0, t, 0.03);
  s.o2.frequency.setTargetAtTime(f0 * 0.5, t, 0.03);
  s.o3.frequency.setTargetAtTime(f0 * 2, t, 0.03);
  s.lp.frequency.setTargetAtTime(350 + rpm * 0.35 + thr * 500, t, 0.05);
  s.mg.gain.setTargetAtTime(on * (0.03 + 0.045 * thr + 0.02 * rpm / 6600) * (CAR.shiftT > 0 ? 0.6 : 1), t, 0.05);
  if (s.wind) {
    s.wind.g.gain.setTargetAtTime(on * Math.min(0.09, Math.pow(au / 35, 2) * 0.12), t, 0.1);
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
  const k = kmh + '|' + rn + '|' + gear + '|' + rp + '|' + (CAR.hb ? 1 : 0);
  if (k === __carHudKey) return;
  __carHudKey = k;
  const a = document.getElementById('carSpeed');
  const b = document.getElementById('carRadioName');
  const c = document.getElementById('carGear');
  const d = document.getElementById('carRpm');
  if (a) a.textContent = kmh;
  if (b) b.textContent = rn;
  if (c) c.textContent = gear + (CAR.hb ? ' · P' : '');
  if (d) { d.style.width = rp + '%'; d.className = rp >= 88 ? 'hot' : ''; }
}

function carHudOff() {
  const hud = document.getElementById('carHud');
  if (hud) hud.classList.remove('on');
  const p = document.getElementById('carPrompt');
  if (p) p.classList.remove('on');
}

buildCar();
const carHud = document.getElementById('carHud'), carPrompt = document.getElementById('carPrompt');
if (carHud) carHud.classList.remove('on');
if (carPrompt) carPrompt.classList.remove('on');
