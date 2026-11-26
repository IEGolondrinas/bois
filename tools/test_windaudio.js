// Prueba del audio del viento (v151): sin saltos de volumen en alturas extremas ni en estructuras aisladas.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','js','07-audio-discovery.js'),'utf8');
const a=src.indexOf('// <wind-audio>'),b=src.indexOf('// </wind-audio>');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
const sb={S:{z:0,y:0},PR:{on:false}};vm.createContext(sb);vm.runInContext(src.slice(a,b),sb);
const wp=vm.runInContext('boisWindParams',sb),zm=vm.runInContext('__boisAudioZoneMute',sb);
const orig=h=>Math.min(.4,.04+h*.003)*.4;           // fórmula anterior
t(Math.abs(wp(0,false,0).gain-orig(0))<1e-9,'a nivel del suelo el viento suena igual que antes');
t(Math.abs(wp(15,false,0).gain-orig(15))<.012,'a 15 m (colinas de la isla) casi igual que antes');
t(wp(240,false,0).gain<orig(240)*.75&&wp(240,false,0).gain<=.12,'a 240 m (torres) el volumen queda muy por debajo del máximo anterior');
t(wp(5000,false,0).gain<=(.04+.2)*.4+1e-9,'ninguna altura extrema supera el techo');
let mono=true,prev=-1;for(let y=0;y<=400;y+=5){const g=wp(y,false,0).gain;if(g<prev-1e-12)mono=false;prev=g}t(mono,'el volumen crece con la altura sin saltos ni caídas');
t(wp(-300,false,0).gain===wp(0,false,0).gain,'bajo el nivel del mar (Poolrooms a −300) no depende de la profundidad');
t(wp(240,false,0).freq<=1100&&wp(1e5,false,0).freq<=1100,'el filtro tiene techo (sin siseo agudo en las alturas)');
t(wp(240,false,.88).gain<wp(240,false,0).gain*.13,'con la zona aislada el viento se reduce más de un 85 %');
t(wp(240,false,1).gain===0,'aislamiento total: silencio');
t(wp(10,true,0).gain>wp(10,false,0).gain,'volar sigue haciendo el viento más fuerte');
sb.S.z=0;sb.PR.on=false;t(zm()===0,'en la isla no se atenúa');
sb.PR.on=true;t(zm()===1,'en Poolrooms el viento se silencia');
sb.PR.on=false;sb.S.z=-1400;t(zm()>=.8&&zm()<1,'en las torres del capítulo VI se atenúa casi del todo');
sb.S.z=-1000;t(zm()>0,'también en la zona de aproximación a las torres');
const w=fs.readFileSync(path.join(__dirname,'..','js','12-weather.js'),'utf8');
t(/__boisAudioZoneMute/.test(w),'la lluvia también se atenúa en las zonas aisladas');
console.log('\n'+ok+' comprobaciones del audio del viento superadas.');
