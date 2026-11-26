// v181 · volumen general, comodidad de cámara, sincronía de Configuración y persistencia segura
const fs=require('fs'),path=require('path'),vm=require('vm');let n=0;
const ok=(c,m)=>{if(!c){console.error('FALLA · '+m);process.exit(1)}n++;console.log('OK · '+m)};
const rd=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

// ---------- 1) Audio: nodo maestro sobre un AudioContext simulado
const real={id:'destino-real'};
class Param{constructor(v){this.value=v}setTargetAtTime(v){this.value=v}setValueAtTime(v){this.value=v}exponentialRampToValueAtTime(v){this.value=v}linearRampToValueAtTime(v){this.value=v}}
class Node{constructor(){this.gain=new Param(1);this.frequency=new Param(0);this.Q=new Param(1);this.to=[]}connect(x){this.to.push(x);return x}disconnect(){}}
class Ctx{constructor(){this.sampleRate=8000;this.currentTime=0;Ctx.last=this}get destination(){return real}
 createBuffer(c,l){return{getChannelData:()=>new Float32Array(l)}}createGain(){return new Node}createBiquadFilter(){return new Node}createBufferSource(){const s=new Node;s.start=()=>{};return s}}
const win={AudioContext:Ctx};
const ctxv=vm.createContext({window:win,console,Math,Float32Array,performance:{now:()=>0}});
const src=rd('js/07-audio-discovery.js');
// solo las definiciones nuevas y auInit (el resto del archivo depende del mundo 3D)
const pick=(re,label)=>{const m=src.match(re);ok(!!m,'existe '+label);return m[0]};
const code=[pick(/const BOIS_OPT=\{[^\n]*\n/,'BOIS_OPT'),pick(/function boisVolGain\(\)\{[^\n]*\}\n/,'boisVolGain'),
 pick(/function boisSetVol\(v\)\{[\s\S]*?\n(?=const AU=)/,'boisSetVol'),pick(/const AU=\{ctx:null,on:true\}/,'AU')+';',
 pick(/function auInit\(\)\{[\s\S]*?\n(?=function auHit)/,'auInit')].join('\n');
vm.runInContext(code+';this.BOIS_OPT=BOIS_OPT;this.AU=AU;this.auInit=auInit;this.boisSetVol=boisSetVol;this.boisVolGain=boisVolGain',ctxv);
const {BOIS_OPT,AU,auInit,boisSetVol,boisVolGain}=ctxv;
ok(BOIS_OPT.vol===1&&BOIS_OPT.bob===true&&BOIS_OPT.invY===false,'valores por defecto: volumen 1, balanceo sí, eje normal');
BOIS_OPT.vol=.5;auInit();const C=Ctx.last;
ok(AU.ctx===C&&!!AU.mg,'auInit crea el nodo maestro');
ok(Math.abs(AU.mg.gain.value-.25)<1e-9,'el volumen guardado (0,5) arranca con ganancia 0,25 (curva cuadrática)');
ok(AU.mg.to.includes(real),'el nodo maestro se conecta al destino real');
ok(C.destination===AU.mg,'ctx.destination apunta al nodo maestro: todo el audio existente pasa por el volumen');
ok(AU.wg.to.includes(AU.mg)&&!AU.wg.to.includes(real),'las fuentes existentes ya no van directas al destino real');
boisSetVol(0);ok(AU.mg.gain.value===0,'volumen 0 silencia');
boisSetVol(1);ok(AU.mg.gain.value===1,'volumen 1 = ganancia 1');
boisSetVol(7);ok(BOIS_OPT.vol===1,'un volumen fuera de rango se recorta a 1');
boisSetVol('x');ok(BOIS_OPT.vol===1,'un volumen no numérico se ignora');
let hook=null;win.__boisVolHooks=[g=>{hook=g}];boisSetVol(.6);ok(Math.abs(hook-.36)<1e-9,'los ganchos externos (cajita de música) reciben la ganancia');

// ---------- 2) Caja de música y bucle principal usan las opciones
const swan=rd('js/30e-swanbox.js');
ok(/__boisVolHooks/.test(swan)&&/boisVolGain\(\)/.test(swan),'la cajita de música (elemento Audio) respeta el volumen general');
const loop=rd('js/21-main-loop-config.js');
ok(/!BOIS_OPT\.bob\?0:1/.test(loop),'el balanceo al caminar se puede desactivar');
ok(/v:BOIS_OPT\.vol,hb:BOIS_OPT\.bob,iy:BOIS_OPT\.invY/.test(loop),'volumen, balanceo y eje vertical se guardan en bois_cfg');
ok(/c\.v>=0&&c\.v<=1/.test(loop)&&/typeof c\.hb==='boolean'/.test(loop)&&/typeof c\.iy==='boolean'/.test(loop),'al cargar se validan los tipos de las tres opciones');
ok(/BOIS_OPT\.invY\?-1:1/.test(rd('js/11-player-input.js')),'invertir eje vertical actúa sobre el ratón');

// ---------- 3) Importación de copias: valida las claves nuevas
global.window=global;global.document={getElementById:()=>null};
eval(rd('js/ui/backup.js'));const Cl=window.__bkClean;
const base={bois_story:JSON.stringify({flags:{}})},cfg=o=>Cl({...base,bois_cfg:JSON.stringify(o)}).bois_cfg!==undefined;
ok(cfg({q:2,v:.4,hb:false,iy:true}),'una copia con v, hb e iy válidos se conserva');
ok(cfg({q:2}),'una copia antigua (sin las claves nuevas) sigue siendo válida');
ok(!cfg({v:3}),'volumen fuera de 0..1 se descarta');
ok(!cfg({hb:'si'}),'balanceo que no es booleano se descarta');
ok(!cfg({iy:1}),'eje vertical que no es booleano se descarta');

// ---------- 4) Configuración: se sincroniza al abrir
const mm=rd('js/ui/menu-modals.js');
ok(/id==='settingsModal'&&typeof sync==='function'\)sync\(\)/.test(mm),'abrir Configuración vuelve a leer N, U, clima y demás ajustes');
const html=rd('index.html');
for(const id of['menuVol','menuBob','menuInvY'])ok(html.includes('id="'+id+'"'),'index.html tiene #'+id);
ok(/getElementById\('menuVol'\)/.test(mm)&&/boisSetVol/.test(mm),'el control de volumen llama a boisSetVol');

// ---------- 5) Persistencia: volcado al salir y reinicio limpio
const guide=rd('js/26-guide-map.js'),hard=rd('js/36b-hardening.js'),fj=rd('js/08-fauna-journal.js'),res=rd('js/32-resume-fallbacks.js');
ok(/window\.__bgFlushExplored=bgFlushExplored/.test(guide)&&/__bgFlushExplored&&window\.__bgFlushExplored\(\)/.test(hard),'el mapa explorado se vuelca al cerrar u ocultar la pestaña');
ok(/if\(window\.__boisResetting\)return/.test(hard)&&/__boisResetting/.test(guide)&&/__boisResetting/.test(res),'durante «Nueva partida» ningún volcado reescribe lo borrado');
ok(fj.includes("'bois_story_bak'")&&/window\.__boisResetting=true/.test(fj),'«Nueva partida» borra también el respaldo de la historia');
// el orden importa: la marca debe ponerse ANTES de borrar, y el borrado solo se dispara al confirmar en el modal (data-r="yes")
const iR=fj.indexOf('window.__boisResetting=true'),iD=fj.indexOf("'bois_story_bak'",iR),iM=fj.indexOf('¿Reiniciar el progreso?');
ok(iM>0&&iR>0&&iR<iD,'la marca de reinicio va antes de borrar');
ok(/r\.dataset\.r==='yes'\)doReset\(\)/.test(fj)&&(fj.match(/doReset\(\)/g)||[]).length===1,'doReset solo se invoca al confirmar en el modal «¿Reiniciar el progreso?»');
console.log('\n'+n+' comprobaciones v181 superadas.');
