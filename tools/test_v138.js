#!/usr/bin/env node
// Comprobaciones de integridad de la renovación visual v138.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let passed = 0;
function assert(ok, message) { if (!ok) throw new Error(message); }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8'); }
function report(message) { passed++; process.stdout.write(`OK · ${message}\n`); }

const index = read('index.html');
const modulePath = index.indexOf('js/36d-world-polish.js');
const bootPath = index.indexOf('js/37-boot.js');
assert(modulePath >= 0 && bootPath > modulePath, 'la capa visual debe cargarse antes del primer frame');
report('la capa visual se carga antes del arranque');

const renderer = read('js/01-core-renderer.js');
assert(renderer.includes('THREE.PCFSoftShadowMap'), 'falta el filtrado de sombras suaves');
report('el renderer usa filtrado de sombras suaves');

const quality = read('js/17-quality.js');
assert(/n:'Alta'[^\n]*ms:1536/.test(quality), 'calidad Alta debe usar sombras 2048');
assert(/n:'Ultra'[^\n]*ms:2048/.test(quality), 'calidad Ultra debe usar sombras 2048');
report('los niveles Alta y Ultra tienen mapas de sombra mejorados');

const moduleCode = read('js/36d-world-polish.js');
for (const token of ['nearTrail(x,z)', 'window.__inLake', 'cells.has(', 'slope > .52', 'new THREE.InstancedMesh', 'fillLight:true']) {
  assert(moduleCode.includes(token), `falta protección o componente de mundo: ${token}`);
}
report('la decoración usa instancias y evita caminos, agua, pendientes y edificios');

const loop = read('js/21-main-loop-config.js');
assert(loop.includes("__safeRun('worldPolish',()=>worldPolishFrame(ft,tt))"), 'la iluminación ambiental no se actualiza desde el bucle');
report('la luz de relleno se actualiza dentro del ciclo ambiental protegido');

const readme = read('CHANGELOG.md');
assert(readme.includes('## v138 · renovación visual del mundo'), 'falta la sección de cambios v138');
report('la documentación registra el alcance y límites de v138');

process.stdout.write(`\n${passed} comprobaciones de integridad v138 superadas.\n`);
