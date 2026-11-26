// Prueba de los modelos del capítulo VI (v153): figuras articuladas, sin alcobas duplicadas, decorado aislado y historia intacta.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const c6=fs.readFileSync(path.join(root,'js','36e-chapter6.js'),'utf8'),tw=fs.readFileSync(path.join(root,'js','20-life-bridge-towers.js'),'utf8');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
const count=(re,s)=>(s.match(re)||[]).length;
// ---- 1) ejecución real de figure() con un THREE simulado
const mkGeo=function(){this.userData={};this.translate=()=>this;this.scale=()=>this};
class Obj{constructor(){this.children=[];this.position={set(){}};this.rotation={x:0,y:0,z:0};this.scale={y:1,setScalar(){}}}add(o){this.children.push(o);return o}}
class Mesh extends Obj{constructor(g,m){super();this.geometry=g;this.material=m}}
const mat=function(o){Object.assign(this,o||{})};
const Col=function(){const c=new Proxy({},{get:(t,m)=>m===Symbol.toPrimitive?()=>0:()=>c});return c};
const THREE={Color:Col,CylinderGeometry:mkGeo,SphereGeometry:mkGeo,BoxGeometry:mkGeo,PlaneGeometry:mkGeo,Group:Obj,Mesh,MeshStandardMaterial:mat,MeshBasicMaterial:mat,CanvasTexture:mat,AdditiveBlending:2,sRGBEncoding:1,RepeatWrapping:3};
const canvas={getContext:()=>new Proxy({},{get:(_,k)=>k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true})};
const a=c6.indexOf('const FG = { geo: null')>=0?c6.indexOf('const FG = { geo: null'):c6.indexOf('const FG={geo:null'),b=c6.indexOf('function qSprite(');
const sb={THREE,document:{createElement:()=>Object.assign({},canvas)},Object};vm.createContext(sb);
vm.runInContext('const stdM=(c,e)=>new THREE.MeshStandardMaterial({color:c,emissive:e||0});const txtTex=(w,h,fn)=>{const c=document.createElement("canvas");c.width=w;c.height=h;fn(c.getContext("2d"),w,h);return new THREE.CanvasTexture(c)};\n'+c6.slice(a,b)+';this.figure=figure;',sb);
const all=o=>[o,...o.children.flatMap(all)],meshes=o=>all(o).filter(x=>x instanceof Mesh);
const P=new Obj();
const st=sb.figure(P,0,0,1.7,0xcfe3f2,0,.62);
t(P.children.includes(st),'figure() añade el grupo al padre y lo devuelve');
t(meshes(st).length===22,'figura de pie: 22 piezas (pelvis, torso, pecho, cuello, cabeza, pelo, piernas, pies, brazos con codo y mano, halo) = '+meshes(st).length);
const st2=sb.figure(P,1,0,1.2,0xf7e2a8,0,.8,'sit');
t(meshes(st2).length===meshes(st).length,'la figura sentada tiene las mismas piezas');
const head=m=>meshes(m).find(x=>x.geometry===meshes(st)[4].geometry);
t(meshes(st)[4].geometry===meshes(st2)[4].geometry,'las geometrías se comparten entre figuras (no se crean 28 copias)');
t(meshes(st)[0].material===sb.figure(P,2,0,1.5,0xcfe3f2,0,.62).children[0].children[0].material,'mismo color y opacidad → mismo material');
t(meshes(st)[0].material!==meshes(st2)[0].material,'otro color → otro material');
const thighSit=meshes(st2).slice(0,-1).filter(x=>Math.abs(x.rotation.x+Math.PI/2)<1e-9);
t(thighSit.length===2,'sentada: los dos muslos quedan horizontales');
t(meshes(st).slice(0,-1).filter(x=>Math.abs(x.rotation.x+Math.PI/2)<1e-9).length===0,'de pie: ningún muslo horizontal');
const shins=meshes(st2).filter(x=>x.scale.y>1);
t(shins.length===2,'sentada y más baja que la silla: las pantorrillas se alargan para llegar al suelo');
const wr=sb.figure(P,3,0,1.7,0xf7e2a8,0,.7,'write');
const armsUp=all(wr).filter(x=>x.rotation&&Math.abs(x.rotation.x+1.55)<1e-9);
t(armsUp.length===1,'pose "write": un solo brazo alzado hacia la pizarra');
t(meshes(sb.figure(P,4,0,1.7,0xcfe3f2,0,.3)).length===21,'las siluetas muy tenues (<.45) no llevan halo');
// ---- 1b) regresiones de rendimiento/limpieza del decorado
 t(/__BOX_GEO/.test(c6)&&/o\.scale\.set\(w,\s*h,\s*d\)/.test(c6),'bx reutiliza una geometría compartida y escala el mesh');
 t(/__cylGeo/.test(c6)&&/__CYL_GEO/.test(c6),'cyl reutiliza geometrías cacheadas por perfil');
 t(/__DOT_TEX/.test(c6)&&/const dotTex\s*=/.test(c6),'las texturas de puntos se comparten');
 t(/function disposeChapter/.test(c6)&&/root\.parent\s*&&\s*typeof root\.parent\.remove\s*===\s*'function'/.test(c6),'el capítulo tiene cleanup de recursos y elimina su raíz');
 t(/ground\s*=\s*__g0/.test(c6)&&/stepSurface\s*=\s*__ss/.test(c6)&&/WX\.upd\s*=\s*__wxUpd0/.test(c6),'los wrappers base se restauran al salir');
 t(/function floorY\(x,\s*z\)[\s\S]*?\(k\s*\+\s*f\)\s*\*\s*RISE/.test(c6),'la primera parte de la escalera tiene transición progresiva');
 t(/function chair\(p,\s*x,\s*z,\s*ry,\s*m,\s*collide\s*=\s*false\)/.test(c6)&&/if\s*\(collide\)\s*M6\.props\.push/.test(c6),'la colisión de sillas es opcional');
 t(/M6\.decorCity\s*=\s*im/.test(c6)&&/M6\.decorCity\.material\.color/.test(c6),'la segunda fila de ciudad recibe atenuación de niebla');
 t(/const gauze\s*=[\s\S]*?\[140,\s*0?\.68\][\s\S]*?\[420,\s*0?\.78\]/.test(c6),'se reducen las capas verticales de niebla');
 t(/const PN\s*=\s*tc\s*\?\s*24\s*:\s*48/.test(c6),'se reduce el número de nubes móviles');
 t(/M6\.markerRAF/.test(c6)&&/startMarkerSpin/.test(c6),'el marcador no mantiene un RAF infinito');
 t(/setValueAtTime\(0,\s*t\)/.test(c6)&&/setValueAtTime\(v,\s*t\)/.test(c6),'el audio ambiente evita ramps desde un valor indefinido');
// ---- 2) estructura del módulo
for(const id of['fisica','compu','solo','gente'])t(count(new RegExp("alcove\\('"+id+"'"),c6)===1,'la alcoba «'+id+'» se construye una sola vez (antes solo y gente estaban duplicadas, una encima de otra)');
t(count(/'sit(Bow)?'/g,c6)>=4&&c6.includes("'write'"),'las figuras sentadas (escritorio, silla, mesa, computadora) usan la pose sentada');
t(/chair\((g|cierreG),\s*-38,\s*7\.55,\s*Math\.PI,\s*wood\)/.test(c6),'el niño del escritorio ya tiene silla');
t(/try\s*\{\s*decor\(g,\s*\{/.test(c6)&&/Capítulo VI \(decorado\)/.test(c6),'el decorado va aislado en try/catch: si fallara, la galería base sigue');
t(/M6\.g\.visible\s*=\s*true/.test(c6)&&/M6\.g\.visible\s*=\s*false/.test(c6),'la galería se oculta al salir (no cuesta nada en la isla)');
t(/pastN\(\)\s*\+\s*'\/3/.test(c6),'el progreso de la torre del pasado (n/3) se muestra');
for(const f of['ch6_started','ch6_aula','ch6_nino','ch6_cierre','ch6_bridge','ch6_fisica','ch6_compu','ch6_solo','ch6_gente','ch6_frase','ch6_complete'])t(c6.includes(f),'bandera conservada: '+f);
for(const fn of['scene_aula','scene_nino','scene_cierre','scene_bridge','scene_fisica','scene_compu','scene_solo','scene_gente','scene_frase','scene_final'])t(c6.includes('function '+fn),'escena conservada: '+fn);
t(/S\.x\s*-\s*O6\.x\s*>\s*-20\s*&&\s*S\.x\s*-\s*O6\.x\s*<\s*-8/.test(c6)&&/const ZONES\s*=/.test(c6),'zonas caminables y acceso narrativo sin cambios');
t(!/props\.push\(\[2\.3,\s*3\.7,\s*-0?\.7,\s*0?\.7\]\)/.test(c6)&&/glowM\(0xfff0c0,\s*0?\.95\)\);\s*core\.position\.set\(3,\s*3\.6,\s*0\)/.test(c6),'la pieza central de la Torre B cuelga a 3,6 m y no bloquea el pasillo recto');
// ---- 3) torres exteriores
t(/v153: estructura y coronación/.test(tw)&&/CylinderGeometry\(\.12,\.2,16,8\)/.test(tw),'las torres exteriores tienen coronación, aristas, bandas y antena');
t(!/addEventListener|storyFlag|onclick|keydown/.test(tw.slice(tw.indexOf('v153: estructura'),tw.indexOf('v153: estructura')+1200)),'la coronación es solo visual (sin interacción)');
console.log('\n'+ok+' comprobaciones de los modelos del capítulo VI superadas.');
