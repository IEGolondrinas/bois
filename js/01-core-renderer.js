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
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
let dprMax=Math.min(devicePixelRatio||1,touch?1.5:2),dpr=dprMax;R.setPixelRatio(dpr);
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
