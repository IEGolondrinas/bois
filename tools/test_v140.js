#!/usr/bin/env node
'use strict';
// Pruebas del Capítulo VI (js/36e-chapter6.js): ejecutan el módulo real con un THREE/DOM simulados y recorren
// la historia completa: entrada, tres escenas del pasado, puente, cuatro futuros, escalera, frase y ventana.
// Comprueban lógica, colisión, suelo y banderas; NO verifican el aspecto en un navegador real.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'js/36e-chapter6.js'), 'utf8');
let passed = 0;
const assert = (c, m) => { if (!c) throw new Error(m || 'fallo'); };
const ok = n => { passed++; process.stdout.write('OK · ' + n + '\n'); };

// ---- THREE mínimo ----
const vec = () => { const v = { x: 0, y: 0, z: 0, set(a, b, c) { v.x = a; v.y = b; v.z = c; return v }, clone() { const w = vec(); w.x = v.x; w.y = v.y; w.z = v.z; return w }, copy(o) { v.x = o.x; v.y = o.y; v.z = o.z; return v } }; return v };
class Obj { constructor() { this.userData = {}; this.position = vec(); this.rotation = vec(); this.scale = Object.assign(vec(), { x: 1, y: 1, z: 1, setScalar(n) { this.x = this.y = this.z = n; return this } }); this.children = []; this.visible = true; this.material = { opacity: 1, transparent: false } }
  add(...o) { this.children.push(...o) } updateMatrix() {} updateMatrixWorld() {} }
const THREE = new Proxy({}, { get: (t, k) => {
  if (k === 'Vector3') return function (x, y, z) { const v = vec(); v.set(x || 0, y || 0, z || 0); return v };
  if (k === 'Euler') return function () { return { set() {} } };
  if (k === 'Quaternion') return function () { return { setFromEuler() {} } };
  if (k === 'Matrix4') return function () { return { compose() {}, copy() { return this }, invert() { return this }, multiplyMatrices() { return this } } };
  if (k === 'Color') return function () { const c = new Proxy({}, { get: (t, m) => m === Symbol.toPrimitive ? () => 0 : () => c }); return c };
  if (k === 'InstancedMesh') return function () { const o = new Obj(); o.setMatrixAt = () => {}; o.setColorAt = () => {}; return o };
  if (/Light$/.test(String(k))) return function () { const o = new Obj(); o.castShadow = false; return o };
  if (/Geometry$/.test(String(k))) return function () { this.userData = {}; this.translate = () => this; this.scale = () => this; this.rotateX = () => this; this.rotateY = () => this; this.setAttribute = () => {}; this.computeVertexNormals = () => {}; this.attributes = { position: { count: 0, getY() { return 0 }, getX() { return 0 }, getZ() { return 0 }, setXYZ() {} } } };   // v153: los métodos que el THREE real sí tiene
  if (/Material$/.test(String(k))) return function (o) { o = o || {}; const m = Object.assign({ opacity: o.opacity == null ? 1 : o.opacity, transparent: !!o.transparent }, o); const c = new Proxy({}, { get: (t, q) => q === Symbol.toPrimitive ? () => 0 : () => c }); m.color = c; return m };
  if (k === 'CanvasTexture') return function () { const t = { offset: { x: 0, y: 0 }, repeat: { set() {} }, clone() { return Object.assign({}, t) } }; return t };
  if (k === 'Mesh' || k === 'Group' || k === 'Sprite' || k === 'Points') return function (g, m) { const o = new Obj(); if (m) o.material = Object.assign({ opacity: 1, transparent: false }, m); return o };
  return k === 'AdditiveBlending' || k === 'DoubleSide' || k === 'sRGBEncoding' || k === 'RepeatWrapping' ? 1 : function () {};
} });
const canvas = () => ({ width: 0, height: 0, getContext: () => { const ctx = new Proxy(function () {}, { get: (t,k) => { if(k==='createImageData') return (w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}); if(k==='getImageData') return (x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}); if(k==='putImageData') return ()=>{}; return () => ({ addColorStop() {} }); }, set: () => true }); return ctx; } });
const body = { appendChild() {} };
const document = { createElement: t => t === 'canvas' ? canvas() : { style: {}, appendChild() {}, set onclick(f) { this._c = f }, get onclick() { return this._c } }, body };

// ---- estado del juego simulado ----
const listeners = [], timers = [], intervals = [];
const flags = {}; const STORY = { flags };
const S = { x: 0, y: 4, z: 0, vy: 0, sw: false, on: true, yaw: 0, pitch: 0 };
const CIN = { on: false }; let pending = null; const msgs = [];
const cinBox = { querySelector: () => ({ textContent: 'PARQUE DE LOS CISNES' }) };
const ctx = {
  THREE, document, STORY, S, CIN, cinBox, PR: { on: false }, AU: { ctx: null, on: false }, WL: 1.4, console,
  storyFlag: (k, v) => { flags[k] = v }, saveStory() {}, showMsg: m => msgs.push(m), auHit() {},
  playCinematic: (lines, cb, opts) => { assert(Array.isArray(lines) && lines.length > 2, 'cinemática sin líneas'); for (const l of lines) assert(l.pause || (typeof l.t === 'string' && l.t.length > 3), 'línea inválida'); CIN.on = true; S.on = false; pending = { lines, cb, opts } },
  scene: new Obj(), cam: { position: vec() },
  ground: (x, z) => 4, blocked: () => false, stepSurface() {},
  bgMission: () => ({ title: 'base', clue: 'base' }), bgTarget: () => ({ name: 'base', x: 0, z: 0 }),
  addEventListener: (t, f, c) => listeners.push({ t, f, c }),
  setTimeout: (f, ms) => timers.push(f), setInterval: (f, ms) => { intervals.push(f); return 1 },
  requestAnimationFrame: f => { ctx.__raf = f; return 1 }, performance: { now: () => ctx.__now },
  Math, Array, Object, JSON, Number, Date, Float32Array, __now: 1000, BOIS_DEV: true, window: null
};
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(src, ctx, { filename: '36e-chapter6.js' });
const M6 = ctx.__boisCh6; assert(M6, 'el módulo no expuso __boisCh6');
const runTimers = () => { let n = 0; while (timers.length && n++ < 50) timers.shift()() };
const endCine = () => { assert(pending, 'no hay cinemática pendiente'); const p = pending; pending = null; CIN.on = false; S.on = true; if (p.cb) p.cb(); runTimers(); return p };
const tick = () => { ctx.__now += 300; for (const f of intervals) f() };
const key = code => { for (const l of listeners) if (l.t === 'keydown') l.f({ code, repeat: false, preventDefault() {}, stopPropagation() {} }) };
const frames = n => { for (let i = 0; i < n; i++) { ctx.__now += 16; if (ctx.__raf) { const f = ctx.__raf; ctx.__raf = null; f(ctx.__now) } } };
const O = { x: 0, y: 240, z: -1400 };
const place = (lx, lz) => { S.x = O.x + lx; S.z = O.z + lz; S.y = O.y };
const at = id => { const p = M6.pts.find(q => q.id === id); place(p.x, p.z); return p };
const walk = (x0, z0, x1, z1, label) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / .25); let py = null;
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; assert(!ctx.blocked(O.x + x, 0, O.z + z), label + ': bloqueado en ' + x.toFixed(2) + ',' + z.toFixed(2));
    const y = ctx.ground(O.x + x, O.z + z, 999); if (py !== null) assert(y - py <= .7 && y >= py - 14, label + ': salto de altura ' + (y - py)); py = y } return py };

// 1) misión y brújula antes de empezar
flags.ch4_complete = 1;
assert(ctx.bgMission().title === 'base', 'sin capítulo V la misión no cambia'); ok('sin capítulo V la misión original se conserva');
flags.ch5_complete = 1;
assert(/Capítulo VI/.test(ctx.bgMission().title) && ctx.bgTarget().x === -17.5, 'misión VI'); ok('al terminar el capítulo V, la misión y la brújula apuntan a la puerta entre las torres');
// 2) entrada
S.x = -17.5; S.z = -16.8; tick(); assert(msgs.some(m => /E: entrar/.test(m)), 'aviso de entrada'); ok('cerca de la puerta aparece el aviso «E: entrar»');
S.x = 100; S.z = 100; key('KeyE'); assert(!pending, 'E lejos no debe iniciar'); ok('E lejos de la puerta no hace nada');
S.x = -17.5; S.z = -16.8; key('KeyE'); assert(pending && /torres/i.test(pending.lines.map(l => l.t || '').join(' ')), 'cinemática de entrada'); endCine();
assert(M6.on && flags.ch6_started, 'debió entrar'); assert(Math.abs(S.x - (O.x - 45)) < 1e-6 && S.y > O.y, 'posición inicial'); ok('la cinemática de entrada lleva al jugador a la Torre del pasado');
assert(ctx.ground(S.x, S.z, 0) === O.y && ctx.blocked(S.x, S.y, S.z) === false, 'suelo/colisión de la galería'); ok('dentro de la galería ground() y blocked() usan la geometría propia');
assert(/Torre del pasado/.test(ctx.bgMission().clue) && ctx.bgTarget() === null, 'misión interior'); ok('la misión interior guía según el progreso');
// 3) escenas del pasado y compuerta
at('cierre'); key('KeyE'); assert(!pending, 'cierre no debe estar disponible sin las otras escenas'); ok('las escenas del fondo exigen ver antes el aula y al niño');
at('aula'); key('KeyE'); endCine(); assert(flags.ch6_aula, 'aula'); at('nino'); key('KeyE'); endCine(); assert(flags.ch6_nino, 'niño');
assert(ctx.blocked(O.x - 30, 0, O.z) === true, 'la compuerta debe estar cerrada'); ok('la puerta del puente sigue cerrada hasta terminar las tres escenas');
at('cierre'); key('KeyE'); const lc = endCine(); assert(lc.lines.some(l => l.label === 'SILENCIO') && lc.lines.some(l => l.label === 'INCOMPRENSIÓN'), 'etiquetas'); assert(flags.ch6_cierre, 'cierre');
assert(ctx.blocked(O.x - 30, 0, O.z) === false, 'la compuerta debe abrirse'); ok('terminar la Torre del pasado abre el puente');
// 4) puente
walk(-45, 0, -29, 0, 'torre A → puente'); S.x = O.x - 15; S.z = O.z; tick(); assert(pending, 'cinemática del puente'); endCine(); assert(flags.ch6_bridge, 'puente'); ok('cruzar el puente dispara la reflexión una sola vez');
S.x = O.x - 14; tick(); assert(!pending, 'no repetir'); walk(-29, 0, 0, 0, 'puente → torre B'); ok('el recorrido puente → Torre de los futuros es transitable');
// 5) futuros: alcoves, morph, compuerta 2
assert(ctx.blocked(O.x + 12, 0, O.z) === true, 'segunda compuerta cerrada'); 
const ids = ['fisica', 'compu', 'solo', 'gente'];
// el cambio al mirar: simular mirada directa hacia un nicho durante varios segundos
const A = M6.alc.fisica; place(-1, -4); ctx.cam.position.set(S.x, S.y + 1.7, S.z);
const dx = (O.x + A.x) - S.x, dy = (O.y + 1.9) - ctx.cam.position.y, dz = (O.z + A.z) - S.z, d = Math.hypot(dx, dy, dz);
S.yaw = Math.atan2(-dx, -dz); S.pitch = Math.asin(dy / d); frames(1); frames(200);
assert(M6.look.fisica > .8, 'mirar un nicho debe cargar el cambio (' + M6.look.fisica + ')');
S.yaw += Math.PI; frames(300); assert(M6.look.fisica < .05, 'al apartar la vista el futuro vuelve a su forma'); ok('un futuro cambia si lo miras fijamente y se calma al apartar la vista');
for (const id of ids) { const p = at(id); assert(Math.hypot(S.x - (O.x + p.x), S.z - (O.z + p.z)) < p.r, 'radio ' + id); assert(!ctx.blocked(S.x, 0, S.z), 'el punto de ' + id + ' debe ser transitable'); key('KeyE'); endCine(); assert(flags['ch6_' + id], id); }
assert(ctx.blocked(O.x + 12, 0, O.z) === false, 'la escalera debe abrirse'); ok('los cuatro futuros abren la escalera de cristal');
// 6) escalera y último piso
const top = walk(3, 0, 40, 0, 'escalera'); assert(Math.abs(top - (O.y + 12)) < 1e-6, 'altura del último piso ' + top); ok('la escalera es transitable (peldaños de 0,3 m) y llega al último piso a +12 m');
walk(40, 0, 53, 0, 'último piso'); assert(ctx.blocked(O.x + 57.5, 0, O.z) === true && ctx.blocked(O.x + 45, 0, O.z - 9.6) === true, 'el ventanal y los muros deben contener al jugador'); ok('el ventanal y los muros del último piso contienen al jugador');
at('ventana'); key('KeyE'); assert(!pending, 'la ventana exige leer antes la inscripción'); ok('la ventana exige leer antes la inscripción');
at('frase'); key('KeyE'); endCine(); assert(flags.ch6_frase); at('ventana'); key('KeyE'); const fin = pending.lines.map(l => l.t || '').join(' '); assert(/problema matemático/.test(fin) && /posibilidades/.test(fin), 'texto final'); endCine();
assert(flags.ch6_complete && !M6.on, 'debe terminar y volver a la isla'); assert(S.x === -17.5 && S.z === -16.8 && ctx.ground(S.x, S.z, 0) === 4, 'regreso a la isla'); ok('la escena final completa el capítulo y devuelve al jugador a la isla');
assert(/completado/.test(ctx.bgMission().title) && ctx.bgTarget().name === 'base', 'misión final'); S.x = -17.5; S.z = -16.8; tick(); const nm = msgs.length; key('KeyE'); assert(!pending, 'no repetir'); ok('con el capítulo terminado la puerta ya no se reactiva');
// 7) reanudación y reinicio
ctx.__boisCh6Reset(); assert(!flags.ch6_complete && !flags.ch6_started); flags.ch6_bridge = 1; flags.ch6_cierre = 1; flags.ch6_aula = 1; flags.ch6_nino = 1; flags.ch6_started = 1;
S.x = -17.5; S.z = -16.8; key('KeyE'); runTimers(); assert(M6.on && Math.abs(S.x - (O.x - 4)) < 1e-6, 'reanuda en la torre B: ' + (S.x - O.x)); ok('con progreso guardado se reanuda al otro lado del puente');
key('Backspace'); runTimers(); assert(!M6.on && S.x === -17.5, 'Retroceso vuelve a la isla'); ok('Retroceso permite volver a la isla en cualquier momento');
// 8) estructura del texto
assert((src.match(/storyFlag\('ch6_/g) || []).length >= 10, 'banderas'); assert(!/localStorage/.test(src), 'sin acceso directo a localStorage'); ok('el módulo guarda su progreso solo mediante storyFlag');
process.stdout.write(`\n${passed} pruebas v140 superadas.\n`);
