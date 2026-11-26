// Regresión de BOIS Telemetry / modo desarrollador (js/37c-telemetry.js): núcleo, informe, persistencia y panel
const fs=require('fs'),path=require('path'),vm=require('vm');let n=0;
const ok=(c,m)=>{if(!c){console.error('FALLA · '+m);process.exit(1)}n++;console.log('OK · '+m)};
const SRC=fs.readFileSync(path.join(__dirname,'../js/37c-telemetry.js'),'utf8');
function fakeEl(){const el={style:{},dataset:{},classList:{_s:new Set(),add(c){this._s.add(c)},remove(c){this._s.delete(c)},contains(c){return this._s.has(c)}},children:[],value:'',hidden:false,textContent:'',innerHTML:'',
 setAttribute(){},appendChild(c){this.children.push(c);return c},append(){},addEventListener(){},closest(){return null},querySelector(){return null},querySelectorAll(){return []},select(){},remove(){},click(){}};return el}
function load(ls,over){
 const L={},errsOrig=[],sb={performance,Date,Math,JSON,Object,Array,Number,String,Error,Promise,Blob:class{},URL:{createObjectURL:()=>'blob:x',revokeObjectURL(){}},
  localStorage:{getItem:k=>k in ls?ls[k]:null,setItem:(k,v)=>{ls[k]=String(v)},removeItem:k=>{delete ls[k]}},
  navigator:{userAgent:'TestUA/1.0',hardwareConcurrency:8},screen:{width:1920,height:1080},innerWidth:1100,innerHeight:650,
  setInterval:(f)=>{(sb._iv=sb._iv||[]).push(f);return 1},clearInterval(){},setTimeout:(f)=>{(sb._to=sb._to||[]).push(f);return 1},clearTimeout(){},requestAnimationFrame(){return 1},
  addEventListener:(t,f,c)=>{(L[t]=L[t]||[]).push({f,c})},
  document:{readyState:'complete',hidden:false,body:fakeEl(),head:fakeEl(),pointerLockElement:null,exitPointerLock(){sb._exited=true},
   createElement:()=>fakeEl(),getElementById:()=>{const e=fakeEl();e.requestPointerLock=()=>{sb._relock=(sb._relock||0)+1};return e},addEventListener(){}},
  console:{warn(){sb._w=(sb._w||0)+1},error(){sb._e=(sb._e||0)+1},log(){}},touch:false,
  S:{on:true,x:100,y:3,z:100,yaw:.5,sw:false,fly:false},CIN:{on:false},CAR:{on:false},PR:{on:false},keys:{KeyW:1},jumpQ:true,
  STORY:{ch:1,flags:{a:1}},BOIS_GUIDE:{journal:false,map:false},qi:1,QS:[{n:'Baja'},{n:'Media'}],dpr:1,dprMax:1.5};
 sb.window=sb;Object.assign(sb,over||{});vm.createContext(sb);vm.runInContext(SRC,sb);sb._L=L;return sb}

// ---------- 1) carga y estructura
let ls={};let g=load(ls),T=g.window.BOIS_TELEMETRY;
ok(!!T&&T.ver==='v189','el módulo se carga y expone window.BOIS_TELEMETRY');
ok(T.on===true,'la telemetría arranca activa por defecto');
ok(g.console.warn.__tel&&g.console.error.__tel,'console.warn y console.error quedan observados');

// ---------- 2) frames, tirones y percentiles
for(let i=0;i<600;i++)T.frame(16.5);
for(let i=0;i<8;i++)T.frame(40);
T.frame(200);T.frame(200);
let r=T.report();
ok(/Frames medidos: 610 /.test(r),'cuenta 610 frames medidos');
ok(T.hitches===2,'detecta 2 tirones de ≥120 ms');
ok(T.events.filter(e=>e.k==='tirón').length===1,'los tirones seguidos no inundan la cronología (límite 1 por segundo)');
ok(/p50 ≤ 18 ms/.test(r),'el percentil 50 sale del cubo correcto (≤18 ms)');
ok(/≥50 ms: 0\.3[0-9]* %/.test(r),'el porcentaje de frames ≥50 ms es exacto (2 de 610)');
ok(/Peor frame: 200 ms en \(100, 100\)/.test(r),'el peor frame guarda su posición');

// ---------- 3) lo que NO se mide
const before=T.st.n;
g.window.__boisGuideOverlayOpen=true;T.frame(16);g.window.__boisGuideOverlayOpen=false;
g.S.on=false;T.frame(16);g.S.on=true;
g.CIN.on=true;g.S.on=false;T.frame(16);g.CIN.on=false;g.S.on=true;
T.frame(1500);T.frame(-3);T.frame(NaN);
ok(T.st.n===before+1,'ignora panel abierto, menú, frames absurdos y negativos (solo cuenta la cinemática)');
T.on=false;T.frame(16);T.on=true;ok(T.st.n===before+1,'con la telemetría pausada no mide');

// ---------- 4) estados y zonas lentas
g.S.sw=true;for(let i=0;i<30;i++)T.frame(25);g.S.sw=false;
g.S.x=500;g.S.z=500;for(let i=0;i<100;i++)T.frame(50);g.S.x=100;g.S.z=100;
r=T.report();
ok(/\| nadando \| 30 \|/.test(r)&&/\| a pie \|/.test(r),'separa FPS por estado (a pie, nadando…)');
ok(/\| \(500, 500\) \| 20 \|/.test(r),'lista la zona lenta con su centro y FPS medio (20 FPS a 50 ms)');
ok(r.split('Zonas más lentas')[1].indexOf('(500, 500)')<r.split('Zonas más lentas')[1].indexOf('(100, 100)')||!/\(100, 100\)/.test(r.split('Zonas más lentas')[1].split('## Recursos')[0]),'la zona más lenta aparece primero');

// ---------- 5) errores y consola
g.console.error('boom',{a:1});g.console.error('boom',{a:1});g.console.error('boom',{a:1});g.console.warn('aviso');
ok(g._e===3&&g._w===1,'las funciones originales de console siguen llamándose');
let es=Object.values(T.errs);ok(es.find(e=>e.kind==='error'&&e.n===3),'errores iguales se agrupan con su conteo');
(g._L.error||[]).forEach(o=>o.f({message:'Uncaught X',filename:'/a/b/c.js',lineno:7}));
(g._L.unhandledrejection||[]).forEach(o=>o.f({reason:new Error('promesa mala')}));
r=T.report();
ok(/\[excepción\] ×1.*Uncaught X · c\.js:7/.test(r),'captura excepciones no controladas con archivo y línea');
ok(/\[promesa rechazada\] ×1.*promesa mala/.test(r),'captura promesas rechazadas');
ok(/\[error\] ×3/.test(r)&&/\[warn\] ×1/.test(r),'el informe lista errores y avisos con su conteo');

// ---------- 6) muestreo: historia, recursos, ajustes
g.R={info:{render:{calls:120,triangles:500000},memory:{geometries:300,textures:25},programs:new Array(35)}};
for(let i=0;i<6;i++){for(let k=0;k<30;k++)T.frame(16.5);T.sample()}
ok(T.samples.length>=6&&T.base&&T.base.geo===300,'el muestreo guarda tendencias y fija la línea base de recursos');
g.STORY.flags.b=2;g.STORY.flags.a=5;T.sample();
ok(T.events.some(e=>e.k==='historia'&&e.m==='b = 2')&&T.events.some(e=>e.k==='historia'&&e.m==='a = 5'),'detecta banderas de historia nuevas y cambiadas');
const evN=T.events.length;T.sample();ok(T.events.length===evN,'sin cambios no genera eventos repetidos');
g.R.info.memory.geometries=520;T.sample();
ok(T.events.some(e=>e.k==='recursos crecen'&&/300→520/.test(e.m)),'avisa cuando las geometrías crecen (posible fuga)');
g.dpr=.8;T.sample();ok(T.events.some(e=>e.k==='resolución'&&/bajó/.test(e.m)),'registra cuando el juego baja la resolución');
g.qi=0;T.sample();ok(T.events.some(e=>e.k==='calidad'),'registra cambios de calidad');
g.window.__boisGuideOverlayOpen=true;const sn=T.samples.length;T.sample();g.window.__boisGuideOverlayOpen=false;ok(T.samples.length===sn,'no muestrea con el mundo pausado');
r=T.report();ok(/Máximos vistos: 120 draw calls · 500,000 triángulos · 520 geometrías/.test(r),'el informe resume máximos de recursos');
ok(/\| t \| FPS \| heap MB \|/.test(r),'el informe incluye la tabla de tendencias');

// ---------- 7) marcas y notas
const m1=T.mark('bug','se ve un agujero | en la pared\nsegunda línea');
ok(m1.id===1&&m1.cat==='bug'&&m1.x===100&&m1.z===100,'una marca guarda id, categoría y posición');
ok(T.mark('inventada','x').cat==='marca','una categoría inválida cae en «marca»');
r=T.report();
ok(/#1 · 🐞 Bug/.test(r)&&/> se ve un agujero ¦ en la pared segunda línea/.test(r),'la nota sale en el informe sin romper el formato (| y saltos de línea saneados)');
ok(/pos \(100, 3, 100\) yaw 0\.5 · a pie · Baja/.test(r),'la marca incluye posición, yaw, estado y calidad');
T.quick();ok(T.marks.length===3&&T.marks[2].cat==='marca','F10 (marca rápida) crea una marca sin texto');
ok(/sin texto/.test(r)===false&&/\(sin texto\)/.test(T.report()),'las marcas sin texto se señalan para anotarlas luego');

// ---------- 8) límites: el informe no crece sin control
const big=load({}),B=big.window.BOIS_TELEMETRY;
for(let i=0;i<900;i++)B.ev('prueba','evento largo '+'x'.repeat(200)+i);
for(let i=0;i<260;i++)B.mark('idea','n'.repeat(900));
for(let i=0;i<200;i++)B.note('error','mensaje distinto '+i+' '+'y'.repeat(300));
ok(B.events.length<=500&&B.marks.length<=200&&Object.keys(B.errs).length<=60,'eventos, marcas y errores tienen tope');
ok(B.report({noPrev:true}).length<=26100,'el informe tiene tope de tamaño (≈26 mil caracteres)');

// ---------- 9) persistencia y cierre brusco
ls={};let a=load(ls);a.window.BOIS_TELEMETRY.mark('bug','antes del cierre');a.window.BOIS_TELEMETRY.save(false);
let snap=JSON.parse(ls.bois_telemetry);ok(snap.clean===false&&/antes del cierre/.test(snap.report),'se guarda una instantánea con el informe');
let b2=load(ls),T2=b2.window.BOIS_TELEMETRY;
ok(T2.prev&&T2.prev.clean===false,'al reabrir detecta que la sesión anterior no cerró limpio');
r=T2.report();ok(/⚠ La sesión anterior/.test(r)&&/Último informe de la sesión anterior/.test(r)&&/antes del cierre/.test(r),'el informe incluye lo grabado antes del cierre brusco');
ok(T2.events.some(e=>e.k==='sesión anterior'),'y lo anota en la cronología');
ok(JSON.parse(ls.bois_telemetry).id===T2.id,'la sesión nueva marca su propia instantánea desde el primer momento');
T2.save(true);let b3=load(ls);ok(b3.window.BOIS_TELEMETRY.prev.clean===true&&!/⚠ La sesión anterior/.test(b3.window.BOIS_TELEMETRY.report()),'tras un cierre limpio no hay aviso de fallo');
ok(!/Último informe de la sesión anterior/.test(JSON.parse(ls.bois_telemetry).report),'la instantánea no anida el informe previo (no crece en cada sesión)');
ls.bois_telemetry='{no es json';ok(load(ls).window.BOIS_TELEMETRY.prev===null,'una instantánea dañada se ignora');

// ---------- 10) interruptor
ls={};let c=load(ls);c.window.BOIS_TELEMETRY.setOn(false);ok(ls.bois_telemetry_on==='0'&&c.window.BOIS_TELEMETRY.on===false,'pausar la telemetría se guarda');
ok(load(ls).window.BOIS_TELEMETRY.on===false,'y se respeta en la siguiente sesión');
ok(/DESACTIVADA/.test(load(ls).window.BOIS_TELEMETRY.report()),'el informe avisa si estaba desactivada');
const g2=load({}),T3=g2.window.BOIS_TELEMETRY;for(let i=0;i<100;i++)T3.frame(16);T3.clear();ok(T3.st.n===0&&T3.marks.length===0,'«Vaciar sesión» reinicia estadísticas y marcas');

// ---------- 11) panel y teclas
const p=load({}),TP=p.window.BOIS_TELEMETRY,kd=(p._L.keydown||[]).find(o=>o.c===true);
ok(!!kd,'hay un manejador de teclado en fase de captura (antes que el juego)');
const key=code=>{const e={code,repeat:false,pd:0,sp:0,sip:0,preventDefault(){this.pd=1},stopPropagation(){this.sp=1},stopImmediatePropagation(){this.sip=1}};kd.f(e);return e};
p.document.pointerLockElement={};
let e=key('F9');
ok(TP._panel.open&&p.window.__boisGuideOverlayOpen===true,'F9 abre el panel y pausa el mundo (__boisGuideOverlayOpen)');
ok(p._exited===true&&p.window.__boisGuideIgnoreNextUnlock===true,'al abrir libera el puntero SIN que el juego lo tome por una pausa al menú');
ok(p.keys.KeyW===0&&p.jumpQ===false,'al abrir suelta las teclas (no sigues caminando)');
ok(e.pd&&e.sip,'F9 no llega al resto del juego');
e=key('KeyW');ok(e.sp&&!e.pd,'mientras escribes, el juego no recibe las teclas (pero se puede escribir)');
const nm=TP.marks.length;key('F10');ok(TP.marks.length===nm,'F10 no crea marcas con el panel abierto');
key('Escape');ok(!TP._panel.open&&p.window.__boisGuideOverlayOpen===false,'Escape cierra el panel y reanuda el mundo');
ok(p._relock===1,'al cerrar vuelve a capturar el puntero');
p.BOIS_GUIDE.map=true;key('F9');key('F9');ok(p.window.__boisGuideOverlayOpen===true,'si el mapa estaba abierto, cerrar el panel NO reanuda el mundo');
p.BOIS_GUIDE.map=false;const q=key('F10');ok(TP.marks.length===nm+1&&q.pd,'F10 con el panel cerrado crea una marca rápida');
console.log('\n'+n+' comprobaciones de BOIS Telemetry superadas.');
