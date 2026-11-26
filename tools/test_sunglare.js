// Prueba de la oclusión del resplandor solar (v150): el brillo no debe atravesar paredes, techos ni colinas.
const fs=require('fs'),vm=require('vm'),path=require('path');
const R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
const sh=R('js/36f-shinkai.js'),a=sh.indexOf('// <sun-occlusion>'),b=sh.indexOf('// </sun-occlusion>');
const col=R('js/05-collision.js'),cEnd=col.indexOf('const TA=new Float32Array(T),NA=new Float32Array(N3);')+'const TA=new Float32Array(T),NA=new Float32Array(N3);'.length;
// Malla sólida sintética: un muro vertical (x=10, 20 m de ancho, 8 m de alto) y un techo (y=6) sobre el origen; se construye con el código REAL de 05-collision.js
const V=[10,0,-10, 10,0,10, 10,8,10, 10,0,-10, 10,8,10, 10,8,-10,  -4,6,-4, 4,6,-4, 4,6,4, -4,6,-4, 4,6,4, -4,6,4];
const sb={pos:new Float32Array(V),solid:[[0,1,2,3,4,5,6,7,8,9,10,11]],hAtFlat:()=>0};
vm.createContext(sb);vm.runInContext(col.slice(col.indexOf('const CS=8'),cEnd)+';var __cells=cells,__TA=TA,__CS=CS;',sb);
vm.runInContext(sh.slice(a,b),sb);
const occ=vm.runInContext('sunOccluded',sb),box=vm.runInContext('sunRayBox',sb);
const env=(h=()=>0,bl=[])=>({hAt:h,cells:sb.__cells,TA:sb.__TA,CS:sb.__CS,blockers:bl});
const norm=(x,y,z)=>{const l=Math.hypot(x,y,z);return[x/l,y/l,z/l]};
let d=norm(1,.3,0);
t(occ(env(),0,1.7,0,...d)===true,'un muro entre la cámara y el sol bloquea el resplandor');
d=norm(-1,.3,0);t(occ(env(),0,1.7,40,...d)===false,'cielo abierto: el resplandor se ve');
d=norm(0,1,0);t(occ(env(),0,1.7,0,...d)===true,'dentro de una habitación con techo, el resplandor se oculta');
d=norm(1,.3,0);t(occ(env(),20,1.7,0,...d)===false,'tras el muro, mirando hacia fuera, el resplandor se ve');
d=norm(1,.05,0);t(occ(env(()=>0),-30,1.7,50,...d)===false,'terreno llano y sin edificios en el camino: no hay oclusión');
d=norm(1,.1,0);t(occ(env((x)=>x>20?30:0),0,1.7,50,...d)===true,'una colina entre la cámara y el sol bloquea el resplandor');
d=norm(1,.3,0);t(occ(env(()=>0,[()=>true]),-30,1.7,50,...d)===true,'un bloqueador registrado (edificio del capítulo IV) bloquea el resplandor');
t(occ(env(()=>0,[()=>{throw new Error('x')}]),-30,1.7,50,...d)===false,'un bloqueador defectuoso no rompe el cálculo');
t(box(0,1,0,1,0,0,5,6,0,3,-1,1,90)>0&&box(0,1,0,-1,0,0,5,6,0,3,-1,1,90)<0,'prueba rayo-caja: acierta hacia delante y falla hacia atrás');
// integración
const shn=sh.replace(/\s+/g,'');
t(/sunOccluded(Factor)?\(env,cam\.position\.x/.test(shn)&&/o\*=1-occ/.test(shn),'el resplandor usa la oclusión suavizada');
t(/PR\.on\)(\|\|\(window\.__boisCh6&&window\.__boisCh6\.on\))?\|\|cam\.position\.z<-900\)\{?o=0/.test(shn),'sin resplandor en Poolrooms ni en las torres del capítulo VI');
const c4=R('js/31-chapter4.js');t(/__boisSunBlockers/.test(c4)&&/tragaluz/.test(c4),'el edificio del capítulo IV se registra como bloqueador (con el tragaluz abierto)');
console.log('\n'+ok+' comprobaciones del resplandor solar superadas.');
