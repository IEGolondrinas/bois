/* BOIS.IO · 17-quality.js — Variables del bucle y calidad gráfica (QS, setQ)
   (líneas 1759–1766 de BOIS_IO_v119_Optimizado.html) */
// ---------- loop
const FR=new THREE.Frustum(),PM=new THREE.Matrix4();const cl=new THREE.Clock();let fa=0,fc=0,fps=60;
// v11: calidad gráfica (tecla Q): resolución, sombras, distancia de dibujo de árboles y niebla
// v184: Ultra conserva el aspecto general, pero limita el coste de sombras y resolución efectiva.
const QS=[{n:'Baja',dpr:.75,sh:0,ms:512,fog:.0016,td:110},{n:'Media',dpr:1,sh:1,ms:1024,fog:.0013,td:160},{n:'Alta',dpr:Math.min(devicePixelRatio||1,1.25),sh:1,ms:1536,fog:.0012,td:200},{n:'Ultra',dpr:Math.min(devicePixelRatio||1,1.25),sh:1,ms:2048,fog:.0011,td:240}];
let qi=touch||(navigator.hardwareConcurrency||8)<=4?1:2,QD=40000;
function setQ(i,say){qi=(i+QS.length)%QS.length;const q=QS[qi],swGl=!!window.__boisIsSoftwareGl;dprMax=swGl?Math.min(q.dpr,1):q.dpr;dpr=dprMax;R.setPixelRatio(dpr);resize();QD=q.td*q.td;spU.uHQ.value=qi;scene.fog.density=q.fog;
 const on=!!q.sh&&!swGl,shToggled=R.shadowMap.enabled!==on;if(shToggled||sun.shadow.mapSize.x!==q.ms){R.shadowMap.enabled=on;sun.castShadow=on;sun.shadow.mapSize.set(q.ms,q.ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}if(shToggled){scene.traverse(o=>{const m=o.material;if(!m)return;const ms=Array.isArray(m)?m:[m];for(const mat of ms)if(mat&&!mat.isMeshBasicMaterial&&!mat.isPointsMaterial&&!mat.isLineBasicMaterial&&!mat.isSpriteMaterial&&!mat.isShaderMaterial)mat.needsUpdate=true})}}
 R.shadowMap.needsUpdate=true;if(say)showMsg('Calidad: '+q.n)}
