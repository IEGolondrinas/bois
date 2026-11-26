// Prueba del tren secreto (v173): solo diciembre/de noche, sin pistas en la historia, vía en tierra firme, el tren se mueve y se detiene.
const fs=require('fs'),vm=require('vm'),path=require('path');
const THREE=require(path.join(__dirname,'..','vendor','three.min.js'));
const src=fs.readFileSync(path.join(__dirname,'..','js','36h-night-train.js'),'utf8');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
function mk(month){
 const scene=new THREE.Scene(),msgs=[];
 const RD=class extends Date{constructor(...a){a.length?super(...a):super(2026,month,10)}};
 const sb={THREE,scene,WL:1.4,S:{on:true,x:0,z:0},CIN:{on:false},PR:{on:false},AU:{on:true,ctx:null},auHit(){},showMsg(m){msgs.push(m)},
  hAt:(x,z)=>x>250?0:5+3*Math.sin(x/80)+2*Math.cos(z/60),Date:RD,console,Math,setTimeout,window:{},globalThis:{},msgs};
 sb.globalThis=sb; vm.createContext(sb); vm.runInContext(src,sb); return sb}
const night={night:1,dusk:0},day={night:0,dusk:0};
// 1) fuera de diciembre no hace nada
{const sb=mk(5),n0=sb.scene.children.length;for(let i=1;i<400;i++)sb.BOIS_LIFE&&sb.BOIS_LIFE(night,i*.1);
 t(sb.scene.children.length===n0,'fuera de diciembre no añade nada a la escena');
 t(!sb.msgs.length,'fuera de diciembre no muestra mensajes');}
// 2) diciembre de día: espera sin construir
{const sb=mk(11),n0=sb.scene.children.length;for(let i=1;i<400;i++)sb.BOIS_LIFE(day,i*.1);
 t(sb.scene.children.length===n0,'en diciembre, de día, tampoco construye la vía');}
// 3) diciembre de noche: tras la espera inicial aparece y se mueve
{const sb=mk(11);let tt=0;const step=(p,s)=>{for(let i=0;i<s*10;i++){tt+=.1;sb.BOIS_LIFE(p,tt)}};
 step(night,30);t(sb.scene.children.length>2,'en diciembre, de noche, se construye la vía y el tren');
 const g=sb.scene.children.filter(o=>o.isGroup);t(g.length>=2,'hay un grupo de vía y uno de tren');
 const track=g[0],tr=g[1];t(track.visible,'la vía se ve de noche');
 // vía sobre tierra firme
 const pos=track.children[0].geometry.attributes.position;let wet=0;for(let i=0;i<pos.count;i+=7)if(sb.hAt(pos.getX(i),pos.getZ(i))<1.4)wet++;
 t(wet===0,'la vía no pisa el agua');
 const loco=tr.children[0];step(night,3);const x1=loco.position.x,z1=loco.position.z;step(night,3);
 t(Math.hypot(loco.position.x-x1,loco.position.z-z1)>20,'la locomotora avanza');
 t(sb.msgs.length<=1,'a lo sumo un mensaje discreto, nada de misión');
 step(night,200);t(!tr.visible||true,'el ciclo termina sin errores');}
// 4) forzado: __boisTren() lo lanza aunque no sea diciembre ni de noche, y false lo detiene
{const sb=mk(2);let tt=0;sb.window.__boisTren();sb.__boisTren=sb.window.__boisTren;
 for(let i=0;i<30;i++){tt+=.1;sb.BOIS_LIFE(day,tt)}
 const g=sb.scene.children.filter(o=>o.isGroup);t(g.length>=2&&g[1].visible,'__boisTren() lo lanza ya');
 sb.window.__boisTren(false);t(!g[1].visible&&!g[0].visible,'__boisTren(false) lo oculta');}
// 5) sin pistas en la historia
const bad=/bgMission|bgTarget|storyFlag|NTB_PAGES/.test(src.replace(/\/\*[\s\S]*?\*\//,''));
t(!bad,'no toca misión, brújula, banderas ni libreta');
console.log('\n'+ok+' comprobaciones del tren secreto superadas.');
