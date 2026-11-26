// Regresiones específicas de la corrección de césped v139.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const grass = read('js/14-grass.js');
const terrain = read('js/02-terrain-material.js');
const readme = read('CHANGELOG.md');
const checks = [
  [grass.includes('uGrassMask={value:spU.uSp.value}'), 'el césped reutiliza el mapa de superficies del terreno'],
  [grass.includes('vGrassUv=vec2((500.-ip.x)/1000.,(ip.z+500.)/1000.)'), 'la máscara usa las mismas coordenadas UV que el terreno'],
  [grass.includes('if(grassWeight<.46)discard'), 'briznas descartadas en arena, tierra y caminos'],
  [grass.includes('if(h<3.25||h>54'), 'la playa baja queda libre de briznas'],
  [grass.includes('GN=touch?360:1050'), 'densidad de césped reducida'],
  [terrain.includes('tgV(P*22.)'), 'micrograno de arena suavizado'],
  [readme.includes('## v139 · césped coherente con el terreno'), 'documentación de v139 añadida']
];
for (const [ok,label] of checks) { if(!ok) throw new Error(label); process.stdout.write('OK · '+label+'\n'); }
process.stdout.write(`\n${checks.length}/${checks.length} comprobaciones v139 superadas.\n`);
