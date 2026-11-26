#!/usr/bin/env node
'use strict';

// Pruebas aisladas de regresión para las correcciones de BOIS.IO v137.
// Extraen las funciones reales del código fuente y las ejecutan con dependencias simuladas.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}
function report(name) {
  passed++;
  process.stdout.write(`OK · ${name}\n`);
}
function vmRun(source, globals = {}) {
  const context = { ...globals, Math, Number, Infinity };
  vm.createContext(context);
  vm.runInContext(source, context, { timeout: 3000 });
  return context;
}

// 1. La salida del auto nunca teletransporta al jugador a agua, un obstáculo o una altura ajena.
{
  const src = read('js/28-car-radio.js');
  const start = src.indexOf('function carForward(');
  const mid = src.indexOf('function setCarBrakeButton(', start);
  const exitStart = src.indexOf('function exitCar(');
  const exitEnd = src.indexOf('function interactCar(', exitStart);
  assert(start >= 0 && mid > start && exitStart > mid && exitEnd > exitStart, 'No se encontró carForward/exitCar');
  const actual = src.slice(start, mid) + '\n' + src.slice(exitStart, exitEnd);

  function runExit(name, ground, blocked, expected) {
    const setup = `
      const CAR={on:true,g:{position:{x:0,y:1.5,z:0}},yaw:0,speed:12};
      const S={x:0,y:2.5,z:0,on:true,sw:false,fly:false,vy:0,yaw:0};
      const keys={Space:1,KeyW:1}; let jumpQ=true; const WL=1.4;
      let message='',brakeVisible=true,hudOff=false,soundOff=false,reset=0;
      const ground=${ground}; const blocked=${blocked};
      function carResetDyn(){reset++} function carSoundOff(){soundOff=true} function carHudOff(){hudOff=true}
      function setCarBrakeButton(v){brakeVisible=v;if(!v)keys.Space=0} function showMsg(m){message=m}
    `;
    const ctx = vmRun(setup + actual + `
      globalThis.result=exitCar();
      globalThis.state={on:CAR.on,y:S.y,space:keys.Space,brakeVisible,hudOff,message,reset,soundOff};
    `);
    assert(ctx.result === expected, `${name}: unexpected result`);
    if (expected) {
      assert(!ctx.state.on, `${name}: car should be exited`);
      assert(ctx.state.y >= 1.8 && ctx.state.y <= 2.0, `${name}: player feet should be placed on the ground (S.y es la altura de los pies; el ojo es S.y+1.7)`);
      assert(ctx.state.space === 0 && ctx.state.brakeVisible === false, `${name}: brake should release`);
      assert(ctx.state.hudOff && ctx.state.reset === 1 && ctx.state.soundOff, `${name}: car state should reset`);
    } else {
      assert(ctx.state.on && ctx.state.reset === 0, `${name}: unsafe exit must preserve car state`);
      assert(ctx.state.message.includes('No hay espacio seguro'), `${name}: missing safe-exit message`);
    }
    report(name);
  }

  runExit('salida del auto sobre suelo libre', '(x,z)=>1.8', '(x,z)=>false', true);
  runExit('salida alternativa cuando la primera está bloqueada', '(x,z)=>1.8', '(x,z)=>x>2.5', true);
  runExit('el auto no permite salir al agua', '(x,z)=>1.0', '(x,z)=>false', false);
  runExit('el auto no permite salir si todo está obstruido', '(x,z)=>1.8', '(x,z)=>true', false);
  runExit('el auto rechaza una diferencia de altura incompatible', '(x,z)=>4.0', '(x,z)=>false', false);
}

// 2. La colisión del auto consulta la superficie transitable (incluida la cubierta del puente).
{
  const src = read('js/28-car-radio.js');
  const start = src.indexOf('function validCarSpot(');
  const end = src.indexOf('function setCarBrakeButton(', start);
  assert(start >= 0 && end > start, 'No se encontró validCarSpot');
  const actual = src.slice(start, end);
  function runSpot(name, x, ground, blocked, expected) {
    const setup = `const CAR={yaw:0,y:1.97};const WL=1.4;const ground=${ground};const blocked=${blocked};`;
    const ctx = vmRun(setup + actual + `globalThis.result=validCarSpot(${x},0);`);
    assert(ctx.result === expected, `${name}: unexpected result`);
    report(name);
  }
  runSpot('el auto puede circular sobre la plataforma del puente', 0, '(x,z,fy)=>1.43', '()=>false', true);
  runSpot('el auto rechaza agua sin plataforma', 0, '(x,z,fy)=>0.4', '()=>false', false);
  runSpot('el auto rechaza obstáculos', 0, '(x,z,fy)=>1.97', '()=>true', false);
  runSpot('el auto respeta los límites del mapa', 491, '(x,z,fy)=>1.97', '()=>false', false);
}

// 3. El freno táctil funciona como una tecla mantenida y siempre se libera correctamente.
{
  const src = read('js/11-player-input.js');
  const start = src.indexOf(' const handbrakeButton=$(');
  const end = src.indexOf(' // v122:', start);
  assert(start >= 0 && end > start, 'No se encontró el bloque del freno táctil');
  const actual = src.slice(start, end);
  const handlers = {};
  const classes = new Set();
  const button = {
    classList: { add: (v) => classes.add(v), remove: (v) => classes.delete(v) },
    addEventListener: (name, fn) => { (handlers[name] ||= []).push(fn); },
    setPointerCapture: (id) => { button.captured = id; }
  };
  const windowHandlers = {};
  const ctx = vmRun(actual + `globalThis.state={};`, {
    CAR: { on: true }, keys: { Space: 0 }, touch: true,
    $: (id) => id === 'bh' ? button : null,
    document: { addEventListener: () => {} },
    addEventListener: (name, fn) => { windowHandlers[name] = fn; }
  });
  const event = { pointerId: 7, preventDefault() {} };
  handlers.pointerdown[0](event);
  assert(ctx.keys.Space === 1 && classes.has('held') && button.captured === 7, 'pointerdown no mantiene el freno');
  handlers.pointerup[0](event);
  assert(ctx.keys.Space === 0 && !classes.has('held'), 'pointerup no suelta el freno');
  handlers.pointerdown[0](event); handlers.pointercancel[0](event);
  assert(ctx.keys.Space === 0, 'pointercancel no suelta el freno');
  handlers.pointerdown[0](event); windowHandlers.blur();
  assert(ctx.keys.Space === 0, 'blur no suelta el freno');
  ctx.CAR.on = false; handlers.pointerdown[0](event);
  assert(ctx.keys.Space === 0, 'el freno no debe activarse fuera del auto');
  report('freno táctil: mantener, soltar, cancelar, perder foco y no activar a pie');
}

// 4. El menú solo se habilita después de un primer frame correcto y no tapa fallos previos.
{
  const src = read('js/37-boot.js');
  const start = src.indexOf('if(window.__boisBootFailed){');
  const end = src.indexOf('\n(()=>{', start);
  assert(start >= 0 && end > start, 'No se encontró la compuerta de arranque');
  const actual = src.slice(start, end);
  function runBoot(name, setup, assertion) {
    const ctx = vmRun(setup + actual + `globalThis.snapshot={ready:window.__boisBootReady,failed:window.__boisBootFailed,stop:window.__boisStopFrameLoop,goDisabled:go.disabled,goText:go.textContent,calls};`);
    assert(assertion(ctx.snapshot), `${name}: boot state incorrect`);
    report(name);
  }
  runBoot('arranque exitoso habilita el menú tras frame()', `
    const window={__boisBootFailed:false};let calls=0;function frame(){calls++}
    function reportBootFailure(){window.__boisBootFailed=true}
    const go={disabled:true,textContent:'Cargando'};function $(id){return id==='go'?go:{style:{display:'block'}}}
  `, (s) => s.ready && !s.failed && !s.goDisabled && s.goText === 'Comenzar' && s.calls === 1);
  runBoot('fallo del primer frame bloquea el menú', `
    const window={__boisBootFailed:false};let calls=0;function frame(){calls++;throw Error('draw failed')}
    function reportBootFailure(e){window.__boisBootFailed=true;window.reason=e.message}
    const go={disabled:true,textContent:'Cargando'};function $(id){return id==='go'?go:{style:{display:'block'}}}
  `, (s) => !s.ready && s.failed && s.stop && s.goDisabled && s.calls === 1);
  runBoot('un error previo no se sobrescribe como arranque exitoso', `
    const window={__boisBootFailed:true};let calls=0;function frame(){calls++}
    function reportBootFailure(){window.__boisBootFailed=true}
    const go={disabled:true,textContent:'Cargando'};function $(id){return id==='go'?go:{style:{display:'block'}}}
  `, (s) => !s.ready && s.failed && s.stop && s.goDisabled && s.calls === 0);
}

process.stdout.write(`\n${passed} pruebas v137 superadas.\n`);
