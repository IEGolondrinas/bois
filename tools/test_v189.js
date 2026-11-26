#!/usr/bin/env node
'use strict';
// v189 · regresión de la ronda de auditoría: build limpio, versión unificada, calidad y herramientas de desarrollo.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),R=f=>fs.readFileSync(path.join(root,f),'utf8');
let n=0;const ok=(c,m)=>{assert(c,m);console.log('OK · '+m);n++};
const html=R('index.html'),tel=R('js/37c-telemetry.js'),q=R('js/17-quality.js'),core=R('js/01-core-renderer.js');
ok(!/_aistudio/.test(html),'index.html no referencia scripts de AI Studio');
// toda referencia local (script/link) existe en disco
const refs=[...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(u=>!/^(https?:)?\/\//.test(u));
const missing=refs.filter(u=>!fs.existsSync(path.join(root,u.split('?')[0])));
ok(missing.length===0,'todas las referencias locales de index.html existen'+(missing.length?' · faltan: '+missing:''));
ok(!fs.existsSync(path.join(root,'js','36e-chapter6.js.bak')),'no hay archivos .bak en js/');
ok(/<title>BOIS\.IO v189 /.test(html)&&/v189 · BOIS Telemetry/.test(html)&&/const VER='v189'/.test(tel),'título, menú y telemetría etiquetados v189');
ok(!/BOIS\.IO v138/.test(R('js/36d-world-polish.js')),'sin etiqueta v138 residual en consola');
ok(/n:'Ultra',dpr:Math\.min\(devicePixelRatio\|\|1,1\.25\)/.test(q),'Ultra limita DPR a 1.25');
ok(/n:'Alta',dpr:Math\.min\(devicePixelRatio\|\|1,1\.25\)/.test(q),'Alta no supera el DPR de Ultra');
ok(/window\.BOIS_DEV=/.test(core)&&/bois_dev/.test(core),'existe la bandera BOIS_DEV (?dev / localStorage bois_dev)');
ok(/e\.code==='F3'&&window\.BOIS_DEV!==false/.test(R('js/26-guide-map.js')),'F3 (herramientas privadas y vuelo) requiere modo desarrollador');
ok(/window\.BOIS_DEV===false\)return/.test(R('js/37b-debug.js')),'F8 requiere modo desarrollador');
ok(/if\(window\.BOIS_DEV!==false\)\{if\(document\.readyState==='loading'\)/.test(tel),'la telemetría (F9/F10/TEL) solo arranca en modo desarrollador');
ok(/html:not\(\.bois-dev\) \.devOnly\{display:none!important\}/.test(R('css/main.css'))&&(html.match(/devOnly/g)||[]).length>=14,'los controles de desarrollo se ocultan en el menú a los jugadores');
console.log('\n'+n+' comprobaciones de v189 superadas.');
