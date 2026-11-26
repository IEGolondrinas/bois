#!/usr/bin/env node
'use strict';
// Verificaciones estructurales heredadas de la pasarela exterior v141; la entrega actual es v189.
// No sustituyen una inspección visual en navegador.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/20-life-bridge-towers.js'),'utf8');
const ch6=fs.readFileSync(path.join(root,'js/36e-chapter6.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const block=src.slice(src.indexOf('v141: pasarela aérea'),src.indexOf('WIN.upd=(p,tt)=>'));
assert(block.includes('new THREE.BoxGeometry(L,.5,7.4)'),'falta la viga continua'); console.log('OK · viga continua');
assert(block.includes('new THREE.BoxGeometry(L-.45,2.55,.12)'),'faltan paneles de vidrio laterales'); console.log('OK · laterales acristalados');
assert(block.includes('for(const x of[ax-.1,bx+.1])'),'faltan marcos de anclaje a ambas torres'); console.log('OK · anclaje a las dos fachadas');
assert(block.includes('deckY=A[4]+(A[5]-A[4])*.57') || block.includes('const y=A[4]+(A[5]-A[4])*.57'),'la altura debe derivarse de la torre'); console.log('OK · altura relativa a las torres');
assert(!/addEventListener|storyFlag|M6\.pts|onclick|keydown/i.test(block),'la pasarela no debe crear interacción ni progreso'); console.log('OK · pasarela puramente ambiental');
assert(/S\.x\s*-\s*O6\.x\s*>\s*-20\s*&&\s*S\.x\s*-\s*O6\.x\s*<\s*-8/.test(ch6) && ch6.includes("scene_bridge()"),'se alteró el acceso narrativo del capítulo VI'); console.log('OK · acceso narrativo del capítulo VI conservado');
assert(html.includes('v189 · BOIS Telemetry y modo desarrollador'),'versión de menú no actualizada'); console.log('OK · etiqueta de versión');
console.log('\\n7 comprobaciones estructurales superadas.');
