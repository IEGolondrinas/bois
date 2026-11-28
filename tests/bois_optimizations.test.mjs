import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('CSS hides .mBadge[hidden] and omits live-WebGL backdrop-filter on HUDs', () => {
  const css = read('css/main.css');
  assert.match(css, /\.mBadge\[hidden\]\s*\{\s*display:\s*none;\s*\}/);

  const liveOverlaySelectors = [
    '#carHud',
    '#carPrompt',
    '#tb',
    '.mBadge',
    '.mNav button',
    '#controlsPanel',
  ];
  for (const sel of liveOverlaySelectors) {
    const idx = css.indexOf(sel);
    assert.notEqual(idx, -1, `Missing selector ${sel}`);
    const block = css.slice(idx, css.indexOf('}', idx) + 1);
    assert.equal(/backdrop-filter\s*:/.test(block), false, `${sel} should not use backdrop-filter`);
  }

  for (const file of [
    'js/23-cinematics.js',
    'js/26-guide-map.js',
    'js/28c-chapter2-guide.js',
    'js/11-player-input.js',
    'js/31-chapter4.js',
    'js/37b-debug.js',
  ]) {
    assert.equal(/backdrop-filter/.test(read(file)), false, `${file} should not use backdrop-filter`);
  }
});

test('lerpP mutates existing color arrays in place without per-frame allocation', () => {
  const src = read('js/10-lighting-time.js');
  const match = src.match(/function lerpP\(o,a,b,e\)\{[\s\S]*?\n\}/) || src.match(/function lerpP\(o,a,b,e\)\{[^\n]+\}/);
  assert.ok(match, 'lerpP function not found');
  const ctx = {};
  vm.runInNewContext(match[0], ctx);

  const dirRef = [0, 0, 0];
  const out = { si: 0, dir: dirRef, n: 'old' };
  const a = { si: 1, dir: [0, 1, 0], n: 'A' };
  const b = { si: 3, dir: [1, 0, 1], n: 'B' };

  ctx.lerpP(out, a, b, 0.5);
  assert.equal(out.dir, dirRef, 'lerpP should reuse existing array reference');
  assert.equal(out.si, 2);
  assert.deepEqual(out.dir, [0.5, 0.5, 0.5]);
  assert.equal(out.n, 'B');
});

test('Swanbox audio and countdown pause cleanly when menu/overlay/hidden', () => {
  const sbxSrc = read('js/30e-swanbox.js');
  assert.match(sbxSrc, /window\.__boisSwanBoxPause\s*=\s*__swanBoxPause/);
  assert.match(sbxSrc, /visibilitychange/);
  assert.equal(/\bsbx\.timer\s*=\s*setTimeout/.test(sbxSrc), false, 'Swanbox should use pause-aware frame countdown');

  const loopSrc = read('js/21-main-loop-config.js');
  const pauseCalls = loopSrc.match(/window\.__boisSwanBoxPause\?\.\(\)/g) || [];
  assert.ok(pauseCalls.length >= 3, 'Main loop must call __boisSwanBoxPause on hidden, overlay, and menu pause');
});

test('Weather thunder and frog croaks guard against paused/hidden/muted playback', () => {
  const weather = read('js/12-weather.js');
  assert.match(weather, /if\(AU\.ctx&&AU\.on&&S\.on&&!PR\.on&&!document\.hidden\)/);

  const fauna = read('js/08-fauna-journal.js');
  assert.match(fauna, /AU\.on&&S\.on&&!PR\.on&&!document\.hidden/);
});

test('carStep skips carEvaluateSpot when angular delta dYaw is negligible', () => {
  const carSrc = read('js/28-car-radio.js');
  assert.match(carSrc, /const dYaw = rn \* h, nextYaw = CAR\.yaw \+ dYaw;\s*if \(Math\.abs\(dYaw\) >= 1e-5\)/);
  assert.match(carSrc, /function carWheelWorld\(i, out\)/);
});

test('Chapter VI omits Asperger, avoids duplicate window in Silencio, and upgrades scene models', () => {
  const c6 = read('js/36e-chapter6.js');
  const c6Min = read('js/36e-chapter6.min.js');
  assert.equal(/asperger/i.test(c6), false, 'Chapter VI source should not mention Asperger');
  assert.equal(/asperger/i.test(c6Min), false, 'Chapter VI minified should not mention Asperger');
  assert.match(c6, /\[-43,\s*-34\.5\]\.forEach\(\(x, i\) => rainWindow\(g, 3\.4, 2\.4, x, 2\.1, 8\.8/);
  assert.equal(/bx\(cierreG,\s*1\.62,\s*0\.1,\s*0\.18,\s*-34\.5/.test(c6), false, 'Duplicate hardcoded window box in Silencio must be removed');
});

test('Chapter V frames 14:48/14:53 as a post-school memory (school ended at 1 pm)', () => {
  const c5 = read('js/36c-chapter5.js');
  assert.equal(/te temblaban las piernas/.test(c5), false, 'Chapter V should not say legs were trembling at 14:53');
  assert.match(c5, /7 a\. m\. a 1 p\. m\./);
  assert.match(c5, /volvías en el recuerdo/);
});

test('Chapters IV-VII initialize safely even when bgMission/bgTarget are undefined, and 26-guide-map exposes them', () => {
  const guide = read('js/26-guide-map.js');
  assert.match(guide, /window\.bgMission=bgMission/);
  assert.match(guide, /window\.bgTarget=bgTarget/);

  for (const rel of ['js/31-chapter4.js', 'js/36c-chapter5.js', 'js/36e-chapter6.js', 'js/36e-chapter6.min.js', 'js/36g-chapter7.js']) {
    const src = read(rel);
    assert.match(src, /typeof bgMission\s*===\s*['"]function['"]/, `${rel} must guard typeof bgMission`);
    assert.match(src, /typeof bgTarget\s*===\s*['"]function['"]/, `${rel} must guard typeof bgTarget`);
  }

  // Execute Chapter V and Chapter VII in a sandbox WITHOUT bgMission/bgTarget/interactKatherin
  const makeSb = () => {
    const sb = {
      THREE: { Vector3: function (x, y, z) { this.x = x; this.y = y; this.z = z; } },
      STORY: { flags: {} },
      S: { on: true, x: 0, z: 0 },
      CIN: { on: false },
      AU: {},
      PR: { on: false, step() {}, enter() {}, geo: { PY: 0 } },
      BOIS_CH5_PHOTO: 'data:image/jpeg;base64,',
      hAt: () => 0,
      storyFlag(k, v) { sb.STORY.flags[k] = v; },
      saveStory() {},
      showMsg() {},
      playCinematic() {},
      addEventListener() {},
      setInterval: () => 0,
      setTimeout: () => 0,
      performance: { now: () => 0 },
      console: { error(m, e) { throw e || new Error(m); }, warn() {}, log() {} },
    };
    sb.window = sb;
    return sb;
  };

  const sb5 = makeSb();
  vm.runInNewContext(read('js/36c-chapter5.js'), sb5);
  assert.equal(typeof sb5.bgMission, 'function');
  assert.equal(typeof sb5.bgTarget, 'function');
  assert.equal(typeof sb5.bgMission().title, 'string');
  assert.equal(sb5.bgTarget(), null);

  const sb7 = makeSb();
  vm.runInNewContext(read('js/36g-chapter7.js'), sb7);
  assert.equal(typeof sb7.bgMission, 'function');
  assert.equal(typeof sb7.bgTarget, 'function');
  assert.equal(typeof sb7.bgMission().title, 'string');
  assert.equal(sb7.bgTarget(), null);
});

test('Valeria bedroom has dedicated animated 3D models, reused puppy rig, and multi-shot cinematics', () => {
  const puppySrc = read('js/30c-puppy.js');
  assert.match(puppySrc, /window\.__boisCreatePuppyRig\s*=\s*puCreateRig/);

  const c6 = read('js/36e-chapter6.js');
  assert.match(c6, /window\.__boisCreatePuppyRig/);
  assert.match(c6, /M6\.valState\s*=\s*\{/);
  assert.match(c6, /valKeyPivot/);
  assert.match(c6, /valPhoneScr/);

  // Run Chapter VI in minimal VM, build scene, and execute scene_valeria() shot-by-shot
  const vec = () => {
    const v = {
      x: 0, y: 0, z: 0,
      set(a, b, c) { v.x = a; v.y = b; v.z = c; return v; },
      clone() { const w = vec(); w.x = v.x; w.y = v.y; w.z = v.z; return w; },
      copy(o) { v.x = o.x; v.y = o.y; v.z = o.z; return v; },
    };
    return v;
  };
  class Obj {
    constructor() {
      this.userData = {};
      this.position = vec();
      this.rotation = vec();
      this.scale = Object.assign(vec(), { x: 1, y: 1, z: 1, setScalar(n) { this.x = this.y = this.z = n; return this; } });
      this.children = [];
      this.visible = true;
      this.material = { opacity: 1, transparent: false };
    }
    add(...o) { this.children.push(...o); }
    updateMatrix() {}
    updateMatrixWorld() {}
  }
  const THREE = new Proxy({}, {
    get: (_t, k) => {
      if (k === 'Vector3') return function (x, y, z) { return vec().set(x || 0, y || 0, z || 0); };
      if (k === 'Euler') return function () { return { set() {} }; };
      if (k === 'Quaternion') return function () { return { setFromEuler() {} }; };
      if (k === 'Matrix4') return function () { return { compose() {}, copy() { return this; }, invert() { return this; }, multiplyMatrices() { return this; } }; };
      if (k === 'Color') return function () { const c = new Proxy({}, { get: (_t2, m) => (m === Symbol.toPrimitive ? () => 0 : () => c) }); return c; };
      if (k === 'InstancedMesh') return function () { const o = new Obj(); o.setMatrixAt = () => {}; o.setColorAt = () => {}; return o; };
      if (/Light$/.test(String(k))) return function () { return new Obj(); };
      if (/Geometry$/.test(String(k))) return function () { this.userData = {}; this.translate = () => this; this.scale = () => this; this.rotateX = () => this; this.rotateY = () => this; this.setAttribute = () => {}; this.computeVertexNormals = () => {}; this.attributes = { position: { count: 0, getY: () => 0, getX: () => 0, getZ: () => 0, setXYZ() {} } }; };
      if (/Material$/.test(String(k))) return function (o) { o = o || {}; const m = Object.assign({ opacity: o.opacity == null ? 1 : o.opacity, transparent: !!o.transparent }, o); const c = new Proxy({}, { get: () => () => c }); m.color = c; return m; };
      if (k === 'CanvasTexture') return function () { const t = { offset: { x: 0, y: 0 }, repeat: { set() {} }, clone() { return Object.assign({}, t); } }; return t; };
      if (k === 'Mesh' || k === 'Group' || k === 'Sprite' || k === 'Points') return function (_g, m) { const o = new Obj(); if (m) o.material = Object.assign({ opacity: 1, transparent: false }, m); return o; };
      return 1;
    },
  });
  const canvas = () => ({ width: 0, height: 0, getContext: () => new Proxy(() => {}, { get: (_t, k) => (k === 'createImageData' || k === 'getImageData' ? (w, h) => ({ data: new Uint8ClampedArray((w || 1) * (h || 1) * 4) }) : () => ({ addColorStop() {} })), set: () => true }) });
  const listeners = [];
  const flags = { ch5_complete: 1, ch6_started: 1, ch6_aula: 1, ch6_nino: 1, ch6_cierre: 1 };
  let lastCine = null;
  const ctx = {
    THREE,
    document: { createElement: (t) => (t === 'canvas' ? canvas() : { style: {}, appendChild() {} }), body: { appendChild() {} } },
    STORY: { flags },
    S: { x: 0, y: 240, z: -1400, vy: 0, sw: false, on: true, yaw: 0, pitch: 0 },
    CIN: { on: false },
    cinBox: { querySelector: () => ({ textContent: '' }) },
    PR: { on: false },
    AU: { ctx: null, on: false },
    WL: 1.4,
    console,
    storyFlag: (k, v) => { flags[k] = v; },
    saveStory() {},
    showMsg() {},
    auHit() {},
    playCinematic: (lines, cb, opts) => { lastCine = { lines, cb, opts }; ctx.CIN.on = true; ctx.S.on = false; },
    scene: new Obj(),
    cam: { position: vec() },
    ground: () => 4,
    blocked: () => false,
    stepSurface() {},
    bgMission: () => ({ title: 'base', clue: 'base' }),
    bgTarget: () => ({ name: 'base', x: 0, z: 0 }),
    addEventListener: (t, f, c) => listeners.push({ t, f, c }),
    setTimeout: (f) => f(),
    setInterval: () => 1,
    requestAnimationFrame: () => 1,
    performance: { now: () => 1000 },
    Math, Array, Object, JSON, Number, Date, Float32Array, BOIS_DEV: true, window: null,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(c6, ctx);

  // Trigger chapter entry to build M6
  ctx.S.x = -17.5; ctx.S.z = -16.8;
  for (const l of listeners) if (l.t === 'keydown') l.f({ code: 'KeyE', repeat: false, preventDefault() {}, stopPropagation() {} });
  if (lastCine && lastCine.cb) { ctx.CIN.on = false; ctx.S.on = true; lastCine.cb(); lastCine = null; }

  const M6 = ctx.__boisCh6;
  assert.ok(M6.valState, 'M6.valState must be initialized after build()');
  assert.ok(M6.valState.valDog && M6.valState.valDog.userData.headPivot && M6.valState.valDog.userData.tailPivot, 'valDog rig must have headPivot and tailPivot');
  assert.ok(M6.valState.valKat && M6.valState.valTu && M6.valState.valKeyPivot, 'Valeria room must have Katherin, Tu, and valKeyPivot');

  const valPt = M6.pts.find((p) => p.id === 'valeria');
  assert.ok(valPt, 'valeria interaction point must exist');
  ctx.S.x = valPt.x; ctx.S.z = -1400 + valPt.z;
  valPt.run();
  assert.ok(lastCine, 'valPt.run() must trigger scene_valeria cinematic');
  const textLines = lastCine.lines.filter((l) => !l.pause);
  assert.ok(textLines.length >= 7, 'scene_valeria must have multi-beat lines');
  const uniqueLookAts = new Set(textLines.map((l) => l.lookAt && `${l.lookAt.x.toFixed(2)},${l.lookAt.z.toFixed(2)}`));
  assert.ok(uniqueLookAts.size >= 4, 'scene_valeria must pan camera across multiple distinct lookAt targets');

  const beatsSeen = new Set();
  for (const l of textLines) {
    if (typeof l.on === 'function') l.on();
    beatsSeen.add(M6.valState.beat);
  }
  assert.ok(beatsSeen.has('puppy') && beatsSeen.has('kat') && beatsSeen.has('key') && beatsSeen.has('wide'), 'scene_valeria beats must drive puppy, kat, key, and wide choreography');

  ctx.CIN.on = false; ctx.S.on = true;
  lastCine.cb();
  assert.equal(flags.ch6_valeria, 1, 'ch6_valeria flag must be saved on completion');
  assert.equal(M6.valState.active, false, 'valState.active must reset cleanly after cinematic');
});


