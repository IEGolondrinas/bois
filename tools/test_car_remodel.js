#!/usr/bin/env node
'use strict';

// Pruebas de regresión para el remodelado del auto:
// 1) Cabina hueca (sin bloques macizos tapando el interior) y ancla de ojos + volante animado
// 2) Colisión deslizante con vector de empuje (evita quedar pegado al chocar)
// 3) Persistencia de posición del auto (bois_car_pos) y cambio de vista (1.ª/3.ª persona)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'js/28-car-radio.js'), 'utf8');
let passed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}
function report(name) {
  passed++;
  process.stdout.write(`OK · ${name}\n`);
}

// 1. Verificar que el código del modelo construye cabina abierta, ancla de vista y controles animados
assert(src.includes('frontProfile') && src.includes('sideProfile') && src.includes('rearProfile'), 'La carrocería debe separar frente, costados y trasera para abrir la cabina');
assert(src.includes('CAR.eyeAnchor') && src.includes('CAR.steerPivot') && src.includes('CAR.speedNeedle') && src.includes('CAR.rpmNeedle'), 'Falta ancla de ojos o controles animados del interior');
assert(src.includes("CAR.camMode === 'first'") && src.includes('function toggleCarCamMode('), 'Falta soporte para cámara en primera persona y alternancia');
report('cabina hueca, ancla de conductor, volante y agujas vivas');

// 2. Verificar carEvaluateSpot + carFindNearestValidSpot (push-out y rescate anti-atasco)
{
  const s0 = src.indexOf('const CAR_FOOTPRINT =');
  const e0 = src.indexOf('function validCarSpot(', s0);
  assert(s0 >= 0 && e0 > s0, 'No se encontró carEvaluateSpot/carFindNearestValidSpot');
  const slice = src.slice(s0, e0);
  const ctx = {
    Math, Number, Infinity, WL: 1.4,
    ground: () => 2.0,
    blocked: (x, y, z) => z < -10
  };
  vm.createContext(ctx);
  vm.runInContext(slice + `
    globalThis.evClear = carEvaluateSpot(0, 0, 0, 2.0);
    globalThis.evFront = carEvaluateSpot(0, -8.5, 0, 2.0);
    globalThis.rescued = carFindNearestValidSpot(0, -8.5, 0, 2.0, 6);
  `, ctx);
  assert(ctx.evClear.hits === 0, 'Zona libre debe dar 0 impactos');
  assert(ctx.evFront.hits > 0 && ctx.evFront.frontHit > 0 && ctx.evFront.pushZ > 0.5, 'Choque frontal debe generar empuje hacia atrás (+Z)');
  assert(ctx.rescued && ctx.rescued.z > -8.5, 'Rescate anti-atasco debe sacar el auto del obstáculo');
  report('colisión con vector de empuje y rescate anti-atasco');
}

// 3. Verificar guardado y restauración de posición (bois_car_pos)
{
  const s0 = src.indexOf('function loadSavedCarState(');
  const e0 = src.indexOf('function updateCarGlassMode(', s0);
  assert(s0 >= 0 && e0 > s0, 'No se encontró loadSavedCarState/saveCarState');
  const store = {};
  const ctx = {
    Math, Number, JSON, window: {},
    CAR_POS_KEY: 'bois_car_pos',
    CAR_STATIONS: [{}, {}, {}, {}],
    CAR: { g: {}, x: 123.45, y: 4.5, z: -67.89, yaw: 1.23, radio: 2, camMode: 'third', saveT: 0 },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); }
    }
  };
  vm.createContext(ctx);
  vm.runInContext(src.slice(s0, e0) + `
    saveCarState(true);
    globalThis.loaded = loadSavedCarState();
  `, ctx);
  assert(ctx.loaded && ctx.loaded.ok && Math.abs(ctx.loaded.x - 123.45) < 0.05 && Math.abs(ctx.loaded.z + 67.89) < 0.05, 'No restauró posición del auto');
  assert(ctx.loaded.camMode === 'third' && ctx.loaded.radio === 2, 'No restauró modo de vista o radio');
  report('persistencia y validación de bois_car_pos');
}

process.stdout.write(`\n${passed} pruebas de remodelado del auto superadas.\n`);
