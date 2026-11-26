/* BOIS.IO · 24-camera-album.js — Álbum de la cámara (V)
   (líneas 2377–2413 de BOIS_IO_v119_Optimizado.html) */
// ===== v59: álbum de la cámara (cuatro fotografías narrativas independientes) =====
// CAM_PHOTOS → data/camera-photos.js
const camAlbum=document.createElement('div');
camAlbum.id='camAlbum';
camAlbum.style.cssText='position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;padding:clamp(12px,3vw,34px);background:rgba(5,8,10,.82);backdrop-filter:blur(9px);color:#eee8d9;font-family:Georgia,serif;';
camAlbum.innerHTML='<section class="cam-sheet"><header class="cam-head"><div><div class="cam-kicker">ARCHIVO FOTOGRÁFICO · 04 IMÁGENES</div><h2>Cámara fotográfica</h2><p>Cuatro recuerdos velados por el tiempo, aún reconocibles.</p></div><button class="cam-close" type="button" aria-label="Cerrar álbum">× <span>Cerrar</span></button></header><div class="cam-grid"></div><footer class="cam-foot"><span>«Fragmentos de una isla que todavía me reconoce...»</span><kbd>V</kbd> volver a abrir · <kbd>ESC</kbd> cerrar</footer></section>';
document.body.appendChild(camAlbum);
const camStyle=document.createElement('style');camStyle.textContent=`
#camAlbum .cam-sheet{width:min(100%,1040px);max-height:94vh;overflow:auto;background:linear-gradient(145deg,rgba(29,31,30,.98),rgba(12,15,17,.98));border:1px solid rgba(218,202,166,.32);box-shadow:0 24px 90px #000;padding:clamp(18px,3vw,32px);}
#camAlbum .cam-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(218,202,166,.2);padding-bottom:16px;margin-bottom:20px}
#camAlbum .cam-kicker{font:10px/1.4 system-ui,sans-serif;letter-spacing:2.5px;color:#b9a98a}
#camAlbum h2{font:clamp(25px,4vw,36px)/1.1 Georgia,serif;font-weight:400;margin:7px 0;color:#f0e8d8}
#camAlbum .cam-head p{margin:0;color:#b9b4a8;font:13px/1.5 system-ui,sans-serif}
#camAlbum .cam-close{border:1px solid rgba(230,220,200,.3);background:transparent;color:#eee8d9;padding:8px 12px;cursor:pointer;font:13px system-ui,sans-serif;white-space:nowrap}
#camAlbum .cam-close:hover{background:rgba(255,255,255,.1)}
#camAlbum .cam-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
#camAlbum .cam-photo{min-width:0;background:rgba(255,255,255,.035);border:1px solid rgba(220,205,175,.16);padding:9px;}
#camAlbum .cam-photo img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;filter:sepia(.12) contrast(.94);border:5px solid #c6b99f;box-shadow:0 4px 14px #0008}
#camAlbum .cam-photo h3{font:18px Georgia,serif;font-weight:400;margin:12px 2px 6px;color:#e9dfca}
#camAlbum .cam-photo p{font:12px/1.55 system-ui,sans-serif;color:#c5c0b4;margin:0 2px 6px}
#camAlbum .cam-photo small{display:block;font:italic 11px/1.45 Georgia,serif;color:#938d80;margin:0 2px 2px}
#camAlbum .cam-foot{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:20px;padding-top:14px;border-top:1px solid rgba(218,202,166,.2);font:italic 13px Georgia,serif;color:#bdb4a4;text-align:center}
#camAlbum kbd{font:11px system-ui,sans-serif;color:#eee5d4;border:1px solid #817866;padding:2px 6px;border-radius:2px}
/* v131: las fotografías se "revelan" una a una y muestran su deterioro */
#camAlbum .cam-photo{position:relative;animation:camDevelop 2.2s ease both}
#camAlbum .cam-photo:nth-child(2){animation-delay:.55s}#camAlbum .cam-photo:nth-child(3){animation-delay:1.1s}#camAlbum .cam-photo:nth-child(4){animation-delay:1.65s}
@keyframes camDevelop{0%{opacity:0;filter:blur(12px) brightness(2.2) sepia(1)}45%{opacity:.85;filter:blur(5px) brightness(1.4) sepia(.7)}100%{opacity:1;filter:none}}
#camAlbum .cam-photo::after{content:'';position:absolute;top:14px;left:14px;right:14px;aspect-ratio:4/3;pointer-events:none;mix-blend-mode:multiply;opacity:.8}
#camAlbum .cam-photo:nth-child(1)::after{background:radial-gradient(ellipse at 100% 0%,rgba(70,40,10,.75),transparent 46%),linear-gradient(115deg,transparent 60%,rgba(120,90,50,.28) 61%,transparent 62%)}
#camAlbum .cam-photo:nth-child(2)::after{background:radial-gradient(ellipse at 0% 100%,rgba(60,70,60,.65),transparent 42%),radial-gradient(circle at 70% 30%,rgba(110,95,60,.35),transparent 24%)}
#camAlbum .cam-photo:nth-child(3)::after{background:linear-gradient(80deg,transparent 48%,rgba(30,25,20,.55) 48.4%,transparent 49%),linear-gradient(100deg,transparent 52%,rgba(30,25,20,.35) 52.3%,transparent 52.8%),radial-gradient(ellipse at 50% 120%,rgba(60,45,30,.5),transparent 50%)}
#camAlbum .cam-photo:nth-child(4)::after{background:radial-gradient(ellipse at 50% 50%,rgba(210,200,180,.0) 30%,rgba(200,190,170,.55) 100%)}
@media(prefers-reduced-motion:reduce){#camAlbum .cam-photo{animation-duration:1ms;animation-delay:0s!important}}
@media(max-width:620px){#camAlbum .cam-photo::after{aspect-ratio:16/9}}
@media(max-width:620px){#camAlbum .cam-grid{grid-template-columns:1fr;gap:12px}#camAlbum .cam-sheet{max-height:92vh}#camAlbum .cam-photo img{aspect-ratio:16/9}}
`;
document.head.appendChild(camStyle);
const camEsc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
camAlbum.querySelector('.cam-grid').innerHTML=CAM_PHOTOS.map((p,i)=>'<article class="cam-photo"><img loading="lazy" src="'+camEsc(p.img)+'" alt="Fotografía dañada: '+camEsc(p.title)+'"><h3>'+(i+1)+'. '+camEsc(p.title)+'</h3><p>'+camEsc(p.desc)+'</p><small>'+camEsc(p.damage)+'</small></article>').join('');
function openCameraGallery(){if(!STORY.flags.gotCam)return;camAlbum.style.display='flex';S.on=false;if(document.pointerLockElement){window.__boisGuideIgnoreNextUnlock=true;document.exitPointerLock?.();}}
function closeCameraGallery(){if(camAlbum.style.display==='none')return;camAlbum.style.display='none';S.on=true;if(!touch&&!window.__boisGuideOverlayOpen&&!(typeof CIN!=='undefined'&&CIN.on))document.getElementById('c')?.requestPointerLock?.();}
camAlbum.querySelector('.cam-close').addEventListener('click',closeCameraGallery);
camAlbum.addEventListener('click',e=>{if(e.target===camAlbum)closeCameraGallery()});
document.addEventListener('keydown',e=>{if(camAlbum.style.display!=='none'&&(e.code==='Escape'||(e.code==='KeyV'&&!e.repeat))){e.preventDefault();closeCameraGallery()}});


