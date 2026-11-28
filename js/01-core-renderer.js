/* BOIS.IO · 01-core-renderer.js — Núcleo: helper $, arranque/errores, decodificador, renderer WebGL
   (líneas 391–426 de BOIS_IO_v119_Optimizado.html) */
// v189: herramientas de desarrollo (F3/F4/F5/G, F8, F9/F10 y botón TEL) solo para quien las pida: añade ?dev a la URL
// o ejecuta localStorage.setItem('bois_dev','1') en la consola (y 'bois_dev' = '0' para quitarlas). Los jugadores no las ven.
window.BOIS_DEV=(function(){try{return /[?&]dev(=1|=true)?(&|$)/.test(location.search)||localStorage.getItem('bois_dev')==='1'}catch(e){return false}})();
if(window.BOIS_DEV)document.documentElement.classList.add('bois-dev');
// v169: aviso único por sitio para errores antes silenciados (catch vacíos). Solo consola; no cambia el flujo del juego.
function __bw(tag,e){try{const w=window.__boisWarned||(window.__boisWarned={});if(w[tag])return;w[tag]=1;console.warn('[BOIS] error ignorado en '+tag,e)}catch(_){}}
let idleRendered=false;
const $=id=>document.getElementById(id);
// v119: requestPointerLock devuelve una promesa que puede rechazarse (p. ej. tras Esc); se absorbe el error.
(()=>{const o=Element.prototype.requestPointerLock;if(!o)return;Element.prototype.requestPointerLock=function(...a){try{const p=o.apply(this,a);if(p&&p.catch)p.catch(()=>{});return p}catch(e){typeof __bw==='function'&&__bw('01-core-renderer#1',e)}}})();
// El menú solo se habilita cuando toda la inicialización del mundo ha terminado.
window.__boisBootReady=false;window.__boisBootFailed=false;
function reportBootFailure(reason){
 console.error('Bois.io no pudo inicializarse:',reason);
 if(window.__boisBootReady||window.__boisBootFailed)return;
 window.__boisBootFailed=true;const go=$('go');if(go){go.disabled=true;go.textContent='Error al iniciar'}
 let panel=$('boisBootError');
 if(!panel&&document.body){panel=document.createElement('div');panel.id='boisBootError';panel.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(5,9,12,.94);color:#eee;font:14px/1.6 system-ui,sans-serif;text-align:center';
  const card=document.createElement('div');card.style.cssText='max-width:560px;padding:28px;border:1px solid rgba(255,255,255,.18);background:#111a20;border-radius:10px';
  const title=document.createElement('h2');title.textContent='No se pudo iniciar Bois.io';title.style.cssText='margin:0 0 12px;font-size:21px';
  const detail=document.createElement('p');detail.textContent='La inicialización encontró un error. Recarga el archivo e inténtalo de nuevo. Si continúa, comparte el error de la consola (F12) para localizarlo.';detail.style.margin='0';card.append(title,detail);panel.appendChild(card);document.body.appendChild(panel)}
}
window.addEventListener('error',e=>{if(e.target===window)reportBootFailure(e.error||e.message||'Error desconocido')});
window.addEventListener('unhandledrejection',e=>reportBootFailure(e.reason||'Promesa rechazada'));
function dec(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer}
const buf=dec(B64),O=META.off,NV=META.nv;
const pos=new Float32Array(buf,O.pos,NV*3),nrm=new Int8Array(buf,O.nrm,NV*3),idx=new Uint16Array(buf,O.idx,META.ni),hts=new Int16Array(buf,O.hts,META.hres*META.hres);
const touch=matchMedia('(pointer:coarse)').matches;
const R=new THREE.WebGLRenderer({canvas:$('c'),antialias:!touch&&(navigator.hardwareConcurrency||8)>4,/* v132: MSAA en escritorio: sin él, briznas y ramas finas parpadean como puntos */powerPreference:'high-performance',stencil:false,depth:true});
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;
let __boisIsSoftwareGl=false;
try{
 const gl=R.getContext();
 if(gl){
  const dbg=gl.getExtension('WEBGL_debug_renderer_info');
  const ren=String((dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'')||gl.getParameter(gl.RENDERER)||'');
  __boisIsSoftwareGl=/swiftshader|llvmpipe|softpipe|warp|microsoft basic render/i.test(ren);
 }
}catch(_){}
window.__boisIsSoftwareGl=__boisIsSoftwareGl;
R.shadowMap.enabled=!__boisIsSoftwareGl;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
let dprMax=Math.min(devicePixelRatio||1,__boisIsSoftwareGl?1:(touch?1.5:2)),dpr=dprMax;R.setPixelRatio(dpr);
// ---------- v31: modo RETRO (baja resolución, paleta reducida, scanlines, CRT)
var SENS=.0022;
$("c").classList.toggle("lite",touch||(navigator.hardwareConcurrency||8)<=4);
// v189: compositor compartido para filtros CSS del lienzo (despertar + gafas de miopía)
window.__boisCanvasFilters=window.__boisCanvasFilters||{};
window.__boisSetCanvasFilter=function(key,val){
 const cv=$("c");if(!cv)return;
 if(val)window.__boisCanvasFilters[key]=val;else delete window.__boisCanvasFilters[key];
 const joined=Object.values(window.__boisCanvasFilters).filter(Boolean).join(' ');
 if(cv.dataset.boisFilter!==joined){cv.dataset.boisFilter=joined;cv.style.filter=joined;}
};
// Cálculo real de esfera envolvente para InstancedMesh en Three.js r128
window.__boisComputeInstBounds=function(im,count){
 if(!im||!im.geometry)return im;
 const geo=im.geometry;
 if(!geo.boundingSphere&&geo.computeBoundingSphere)geo.computeBoundingSphere();
 const bs=geo.boundingSphere;
 const arr=im.instanceMatrix&&im.instanceMatrix.array;
 const n=count!=null?count:(im.count!=null?im.count:(arr?(arr.length/16)|0:0));
 if(!bs||!arr||n<=0){
  im.boundingSphere=new THREE.Sphere(new THREE.Vector3(),0.001);
  im.frustumCulled=true;
  return im;
 }
 const c0x=bs.center.x,c0y=bs.center.y,c0z=bs.center.z,r0=bs.radius;
 let mnX=1e9,mnY=1e9,mnZ=1e9,mxX=-1e9,mxY=-1e9,mxZ=-1e9,any=false;
 for(let i=0;i<n;i++){
  const o=i*16;
  const sx=Math.hypot(arr[o],arr[o+1],arr[o+2]);
  const sy=Math.hypot(arr[o+4],arr[o+5],arr[o+6]);
  const sz=Math.hypot(arr[o+8],arr[o+9],arr[o+10]);
  const ms=Math.max(sx,sy,sz);
  if(ms<1e-4)continue;
  any=true;
  const cx=arr[o]*c0x+arr[o+4]*c0y+arr[o+8]*c0z+arr[o+12];
  const cy=arr[o+1]*c0x+arr[o+5]*c0y+arr[o+9]*c0z+arr[o+13];
  const cz=arr[o+2]*c0x+arr[o+6]*c0y+arr[o+10]*c0z+arr[o+14];
  const ir=r0*ms;
  if(cx-ir<mnX)mnX=cx-ir;if(cx+ir>mxX)mxX=cx+ir;
  if(cy-ir<mnY)mnY=cy-ir;if(cy+ir>mxY)mxY=cy+ir;
  if(cz-ir<mnZ)mnZ=cz-ir;if(cz+ir>mxZ)mxZ=cz+ir;
 }
 if(!any){
  im.boundingSphere=new THREE.Sphere(new THREE.Vector3(),0.001);
  im.frustumCulled=true;
  return im;
 }
 const ccx=(mnX+mxX)*0.5,ccy=(mnY+mxY)*0.5,ccz=(mnZ+mxZ)*0.5;
 let maxR=0;
 for(let i=0;i<n;i++){
  const o=i*16;
  const sx=Math.hypot(arr[o],arr[o+1],arr[o+2]);
  const sy=Math.hypot(arr[o+4],arr[o+5],arr[o+6]);
  const sz=Math.hypot(arr[o+8],arr[o+9],arr[o+10]);
  const ms=Math.max(sx,sy,sz);
  if(ms<1e-4)continue;
  const cx=arr[o]*c0x+arr[o+4]*c0y+arr[o+8]*c0z+arr[o+12];
  const cy=arr[o+1]*c0x+arr[o+5]*c0y+arr[o+9]*c0z+arr[o+13];
  const cz=arr[o+2]*c0x+arr[o+6]*c0y+arr[o+10]*c0z+arr[o+14];
  const d=Math.hypot(cx-ccx,cy-ccy,cz-ccz)+r0*ms;
  if(d>maxR)maxR=d;
 }
 im.boundingSphere=new THREE.Sphere(new THREE.Vector3(ccx,ccy,ccz),maxR+0.25);
 im.frustumCulled=true;
 return im;
};
// Agrupa y fusiona mallas estáticas por material y atributos dentro de un grupo raíz (mantiene noMerge/dyn intactos)
window.__boisMergeStaticGroup=function(rootGroup){
 if(!rootGroup||!THREE.BufferGeometry||!THREE.Matrix4)return 0;
 rootGroup.updateMatrixWorld(true);
 const rootInv=new THREE.Matrix4().copy(rootGroup.matrixWorld).invert();
 const relMat=new THREE.Matrix4(),nrmMat=new THREE.Matrix3();
 const vPos=new THREE.Vector3(),vNrm=new THREE.Vector3();
 const buckets=new Map();
 const isDynOrSkip=o=>{
  let p=o;
  while(p){
   if(p.userData&&(p.userData.noMerge||p.userData.dyn))return true;
   if(p===rootGroup)break;
   p=p.parent;
  }
  return false;
 };
 rootGroup.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh)return;
  if(!o.geometry||!o.material||Array.isArray(o.material))return;
  if(o.onBeforeRender&&o.onBeforeRender.toString().indexOf('function () {}')===-1&&o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return;
  if(isDynOrSkip(o))return;
  const g=o.geometry;
  const a=g.attributes;
  if(!a||!a.position||!a.position.array)return;
  relMat.multiplyMatrices(rootInv,o.matrixWorld);
  if(relMat.determinant()<=1e-8)return;
  const hasN=!!(a.normal&&a.normal.array),hasU=!!(a.uv&&a.uv.array),hasC=!!(a.color&&a.color.array);
  const key=(o.material.uuid||o.material.id)+'|'+(o.renderOrder|0)+'|'+(o.castShadow?1:0)+'|'+(o.receiveShadow?1:0)+'|'+(hasN?1:0)+(hasU?1:0)+(hasC?1:0);
  let b=buckets.get(key);
  if(!b){b={mat:o.material,order:o.renderOrder|0,cast:!!o.castShadow,recv:!!o.receiveShadow,hasN,hasU,hasC,items:[]};buckets.set(key,b)}
  b.items.push({mesh:o,rel:relMat.clone()});
 });
 let mergedMeshes=0;
 buckets.forEach(b=>{
  if(b.items.length<2)return;
  let totalV=0,totalI=0,allIndexed=true;
  for(const it of b.items){
   const g=it.mesh.geometry,vc=g.attributes.position.count;
   totalV+=vc;
   if(g.index)totalI+=g.index.count;else allIndexed=false;
  }
  if(!totalV)return;
  const P=new Float32Array(totalV*3);
  const N=b.hasN?new Float32Array(totalV*3):null;
  const U=b.hasU?new Float32Array(totalV*2):null;
  const C=b.hasC?new Float32Array(totalV*3):null;
  const I=allIndexed?(totalV>65535?new Uint32Array(totalI):new Uint16Array(totalI)):null;
  let vo=0,io=0;
  for(const it of b.items){
   const g=it.mesh.geometry,a=g.attributes,vc=a.position.count,pa=a.position.array;
   const m=it.rel;
   if(N)nrmMat.getNormalMatrix(m);
   for(let i=0;i<vc;i++){
    const o3=(vo+i)*3;
    vPos.set(pa[i*3],pa[i*3+1],pa[i*3+2]).applyMatrix4(m);
    P[o3]=vPos.x;P[o3+1]=vPos.y;P[o3+2]=vPos.z;
    if(N){
     const na=a.normal.array;
     vNrm.set(na[i*3],na[i*3+1],na[i*3+2]).applyMatrix3(nrmMat).normalize();
     N[o3]=vNrm.x;N[o3+1]=vNrm.y;N[o3+2]=vNrm.z;
    }
    if(U){
     const ua=a.uv.array,o2=(vo+i)*2;
     U[o2]=ua[i*2];U[o2+1]=ua[i*2+1];
    }
    if(C){
     const ca=a.color.array;
     C[o3]=ca[i*3];C[o3+1]=ca[i*3+1];C[o3+2]=ca[i*3+2];
    }
   }
   if(I){
    const gi=g.index.array;
    for(let k=0;k<gi.length;k++)I[io+k]=gi[k]+vo;
    io+=gi.length;
   }
   vo+=vc;
  }
  if(!allIndexed){
   // Algunas mallas sin índice: convertir a no-indexado simple si hiciera falta no ocurrió; aquí todas las de Three son indexadas salvo extrusiones rarísimas
   let flatV=0;
   for(const it of b.items){const g=it.mesh.geometry;flatV+=g.index?g.index.count:g.attributes.position.count}
   const FP=new Float32Array(flatV*3),FN=b.hasN?new Float32Array(flatV*3):null,FU=b.hasU?new Float32Array(flatV*2):null,FC=b.hasC?new Float32Array(flatV*3):null;
   let fo=0;
   for(const it of b.items){
    const g=it.mesh.geometry,a=g.attributes,m=it.rel,idxA=g.index?g.index.array:null,cnt=idxA?idxA.length:a.position.count;
    if(FN)nrmMat.getNormalMatrix(m);
    for(let k=0;k<cnt;k++){
     const vi=idxA?idxA[k]:k,o3=(fo+k)*3;
     vPos.set(a.position.array[vi*3],a.position.array[vi*3+1],a.position.array[vi*3+2]).applyMatrix4(m);
     FP[o3]=vPos.x;FP[o3+1]=vPos.y;FP[o3+2]=vPos.z;
     if(FN){vNrm.set(a.normal.array[vi*3],a.normal.array[vi*3+1],a.normal.array[vi*3+2]).applyMatrix3(nrmMat).normalize();FN[o3]=vNrm.x;FN[o3+1]=vNrm.y;FN[o3+2]=vNrm.z}
     if(FU){const o2=(fo+k)*2;FU[o2]=a.uv.array[vi*2];FU[o2+1]=a.uv.array[vi*2+1]}
     if(FC){FC[o3]=a.color.array[vi*3];FC[o3+1]=a.color.array[vi*3+1];FC[o3+2]=a.color.array[vi*3+2]}
    }
    fo+=cnt;
   }
   const mg=new THREE.BufferGeometry();
   mg.setAttribute('position',new THREE.BufferAttribute(FP,3));
   if(FN)mg.setAttribute('normal',new THREE.BufferAttribute(FN,3));
   if(FU)mg.setAttribute('uv',new THREE.BufferAttribute(FU,2));
   if(FC)mg.setAttribute('color',new THREE.BufferAttribute(FC,3));
   mg.computeBoundingSphere();
   const mm=new THREE.Mesh(mg,b.mat);
   mm.castShadow=b.cast;mm.receiveShadow=b.recv;mm.renderOrder=b.order;mm.frustumCulled=true;
   mm.updateMatrix();mm.matrixAutoUpdate=false;
   for(const it of b.items){if(it.mesh.parent)it.mesh.parent.remove(it.mesh)}
   rootGroup.add(mm);mergedMeshes++;
   return;
  }
  const mg=new THREE.BufferGeometry();
  mg.setAttribute('position',new THREE.BufferAttribute(P,3));
  if(N)mg.setAttribute('normal',new THREE.BufferAttribute(N,3));
  if(U)mg.setAttribute('uv',new THREE.BufferAttribute(U,2));
  if(C)mg.setAttribute('color',new THREE.BufferAttribute(C,3));
  mg.setIndex(new THREE.BufferAttribute(I,1));
  mg.computeBoundingSphere();
  const mm=new THREE.Mesh(mg,b.mat);
  mm.castShadow=b.cast;mm.receiveShadow=b.recv;mm.renderOrder=b.order;mm.frustumCulled=true;
  mm.updateMatrix();mm.matrixAutoUpdate=false;
  for(const it of b.items){if(it.mesh.parent)it.mesh.parent.remove(it.mesh)}
  rootGroup.add(mm);mergedMeshes++;
 });
 return mergedMeshes;
};
