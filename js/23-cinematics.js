/* BOIS.IO · 23-cinematics.js — Diálogos cinemáticos y despertar visual
   (líneas 2243–2376 de BOIS_IO_v119_Optimizado.html) */
// ===== CINEMATIC DIALOGUE =====
const CIN={on:false,lines:[],i:0,t:0,cb:null,timer:null,fadeTimer:null,pendingOn:null,oldRotation:null};
const cinBox=document.createElement('div');
cinBox.id='cin';
cinBox.style.cssText='position:fixed;inset:0;z-index:10;display:none;pointer-events:none;background:linear-gradient(transparent 60%,rgba(0,0,0,.7))';
cinBox.style.pointerEvents='auto';
cinBox.innerHTML='<div class="cin-bar cin-bar-top"></div><div class="cin-bar cin-bar-bottom"></div><div class="cin-location">PARQUE DE LOS CISNES</div><div class="cin-dialogue"><div id="cinTxt"></div><div id="cinHint">CLIC O ESPACIO</div></div><div class="cin-grain"></div>';

document.body.appendChild(cinBox);
const cinStyle=document.createElement('style');
cinStyle.textContent=`
#cin{background:linear-gradient(180deg,rgba(3,7,10,.08) 0%,rgba(3,7,10,.02) 35%,rgba(3,7,10,.28) 62%,rgba(3,7,10,.72) 100%);overflow:hidden}
#cin .cin-bar{position:absolute;left:0;width:100%;height:0;background:#050607;z-index:3;transition:height 1s cubic-bezier(.2,.7,.2,1)}
#cin .cin-bar-top{top:0}#cin .cin-bar-bottom{bottom:0}
#cin.active .cin-bar{height:8.5vh}
#cin .cin-location{position:absolute;top:11.5vh;left:0;width:100%;text-align:center;font:10px system-ui;letter-spacing:5px;color:rgba(244,239,224,.65);opacity:0;transition:opacity 1.4s}
#cin.active .cin-location{opacity:1}
#cin .cin-dialogue{position:absolute;z-index:4;left:50%;bottom:11.5vh;transform:translateX(-50%);width:min(760px,88vw);text-align:center;color:#f3eee4;text-shadow:0 2px 14px #000;font:300 clamp(17px,2vw,21px)/1.65 Georgia,serif;letter-spacing:.2px;pointer-events:none}
#cinTxt{min-height:1.65em;opacity:0;transform:translateY(7px);transition:opacity .55s,transform .55s}
#cinTxt.visible{opacity:1;transform:translateY(0)}
#cinTxt b{display:block;font:600 10px system-ui;letter-spacing:3px;margin-bottom:8px;color:#d9c9a9}
#cinHint{margin-top:16px;font:9px system-ui;letter-spacing:3px;color:rgba(240,235,224,.48);transition:opacity .3s}
#cin.pause #cinHint{opacity:.18}
#cin .cin-grain{position:absolute;inset:0;pointer-events:none;z-index:2;opacity:.08;background-image:radial-gradient(rgba(255,255,255,.6) .5px,transparent .7px);background-size:4px 4px;mix-blend-mode:soft-light}
#cin.pause .cin-dialogue{opacity:0;transition:opacity .8s}
#cin::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 46%,transparent 52%,rgba(0,0,0,.5) 100%)}
#cin .cin-grain{animation:cinGrain .5s steps(4) infinite}
@keyframes cinGrain{0%{background-position:0 0}25%{background-position:-2px 1px}50%{background-position:1px -2px}75%{background-position:2px 2px}100%{background-position:0 0}}
#cinTxt .w{display:inline-block;opacity:0;transform:translateY(6px);filter:blur(4px);transition:opacity .75s ease,transform .75s ease,filter .75s ease}
#cinTxt.visible .w{opacity:1;transform:none;filter:none}
@media(prefers-reduced-motion:reduce){#cin .cin-grain{animation:none}#cinTxt .w{transition-duration:1ms}}
@media(max-width:600px){#cin.active .cin-bar{height:7vh}#cin .cin-location{top:9vh;font-size:8px;letter-spacing:3px}#cin .cin-dialogue{bottom:9vh;width:88vw;font-size:17px}}
`;
document.head.appendChild(cinStyle);

const cinPhotoStyle=document.createElement('style');cinPhotoStyle.textContent=`
#cinPhotoReveal{position:absolute;inset:8.5vh 0 8.5vh;display:flex;align-items:center;justify-content:center;pointer-events:none;animation:cinPhotoIn .7s ease both}
#cinPhotoReveal .cin-photo-mat{width:min(430px,72vw);padding:13px 13px 10px;background:#eee7d8;box-shadow:0 16px 48px #0009;transform:rotate(-1deg);color:#39352e}
#cinPhotoReveal img{display:block;width:100%;height:min(34vh,290px);object-fit:cover;filter:sepia(.08) contrast(.96)}
#cinPhotoReveal .cin-photo-caption{text-align:center;padding-top:9px;font:italic 15px Georgia,serif;letter-spacing:.4px}
@keyframes cinPhotoIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:600px){#cinPhotoReveal{inset:7vh 0 7vh}#cinPhotoReveal .cin-photo-mat{width:min(84vw,390px);padding:9px 9px 7px}#cinPhotoReveal img{height:min(29vh,220px)}}
`;document.head.appendChild(cinPhotoStyle);
const cinTxt=$('cinTxt')||cinBox.querySelector('#cinTxt');

// ===== v61: despertar visual (párpados, parpadeos y enfoque) =====
function playWakeOpening(onComplete){
  window.__boisWakeLock=true;
  const layer=document.createElement('div');
  layer.id='wakeOpening';
  layer.innerHTML='<div class="wake-lid wake-top"></div><div class="wake-lid wake-bottom"></div><div class="wake-focus"></div><div class="wake-caption">…</div>';
  document.body.appendChild(layer);
  // Forzar un nuevo ciclo de animación incluso cuando el navegador acaba de recargar el mundo.
  layer.style.animation='none';void layer.offsetHeight;layer.style.animation='';
  const style=document.createElement('style');
  style.textContent=`
  #wakeOpening{position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden;background:transparent;animation:wakeFade .8s ease 4.25s forwards}
  #wakeOpening .wake-lid{position:absolute;left:-4%;width:108%;height:62%;background:#020305;will-change:transform}
  #wakeOpening .wake-top{top:0;border-radius:0 0 48% 48% / 0 0 12% 12%;animation:wakeTop 4.5s cubic-bezier(.5,0,.2,1) forwards}
  #wakeOpening .wake-bottom{bottom:0;border-radius:48% 48% 0 0 / 12% 12% 0 0;animation:wakeBottom 4.5s cubic-bezier(.5,0,.2,1) forwards}
  #wakeOpening .wake-focus{position:absolute;inset:0;background:rgba(8,12,18,.34);backdrop-filter:blur(12px);animation:wakeFocus 4.5s ease forwards}
  #wakeOpening .wake-caption{position:absolute;left:0;right:0;bottom:13%;text-align:center;color:rgba(230,232,225,.0);font:italic 15px Georgia,serif;letter-spacing:2px;text-shadow:0 2px 12px #000;animation:wakeCaption 3.6s ease forwards}
  @keyframes wakeTop{0%,14%{transform:translateY(0)}43%{transform:translateY(-105%)}49%{transform:translateY(0)}57%,100%{transform:translateY(-105%)}}
  @keyframes wakeBottom{0%,14%{transform:translateY(0)}43%{transform:translateY(105%)}49%{transform:translateY(0)}57%,100%{transform:translateY(105%)}}
  @keyframes wakeFocus{0%,38%{opacity:1;backdrop-filter:blur(18px)}55%{opacity:.72;backdrop-filter:blur(9px)}100%{opacity:0;backdrop-filter:blur(0)}}
  @keyframes wakeCaption{0%,12%{color:rgba(230,232,225,0)}25%,48%{color:rgba(230,232,225,.72)}70%,100%{color:rgba(230,232,225,0)}}
  @keyframes wakeFade{to{opacity:0;visibility:hidden}}
  @media(prefers-reduced-motion:reduce){#wakeOpening .wake-lid,#wakeOpening .wake-focus,#wakeOpening .wake-caption{animation-duration:1ms}}
  `;
  document.head.appendChild(style);
  setTimeout(()=>{layer.remove();style.remove();window.__boisWakeLock=false;if(typeof onComplete==='function')onComplete();},5200);
}

function flushCinPending(){
  if(typeof CIN.pendingOn!=='function')return;
  const fn=CIN.pendingOn;CIN.pendingOn=null;
  try{fn()}catch(err){console.warn('cin on:',err)}
}
function playCinematic(lines,cb,opts={}){
  clearTimeout(CIN.timer);clearTimeout(CIN.fadeTimer);CIN.timer=null;CIN.fadeTimer=null;CIN.pendingOn=null;
  CIN.on=true;CIN.lines=lines;CIN.i=0;CIN.t=0;CIN.cb=cb;
  const oldReveal=cinBox.querySelector('#cinPhotoReveal');if(oldReveal)oldReveal.remove();
  if(window.__boisRevealPhoto){
    const r=document.createElement('div');r.id='cinPhotoReveal';
    const __esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),__ph=window.__boisRevealPhoto;
    r.innerHTML='<div class="cin-photo-mat"><img src="'+__esc(__ph.img)+'" alt="'+__esc(__ph.title)+'"><div class="cin-photo-caption">'+__esc(__ph.title)+'</div></div>';
    cinBox.appendChild(r);
  }
  CIN.oldRotation=cam.rotation.clone();
  if(opts.location){const loc=cinBox.querySelector('.cin-location');if(loc){loc.textContent=opts.location;CIN.locSet=true}} // v131: los capítulos IV/V fijan su rótulo por su cuenta
  if(opts.lookAt){
    cam.lookAt(opts.lookAt.x,opts.lookAt.y,opts.lookAt.z);
    cam.updateMatrixWorld();
  }
  cinBox.classList.add('active');
  cinBox.classList.remove('pause');
  cinBox.style.display='block';cinBox.style.opacity='1';cinBox.style.visibility='visible';cinBox.style.zIndex='80';
  requestAnimationFrame(()=>cinBox.classList.add('active'));
  showCinLine();S.on=false;
}
function showCinLine(){
  if(CIN.i>=CIN.lines.length){endCinematic();return}
  const l=CIN.lines[CIN.i],hint=cinBox.querySelector('#cinHint');
  clearTimeout(CIN.timer);CIN.timer=null;
  clearTimeout(CIN.fadeTimer);CIN.fadeTimer=null;
  flushCinPending();
  CIN.pendingOn=typeof l.on==='function'?l.on:null;
  cinTxt.classList.remove('visible');
  // La frase anterior se desvanece antes de cambiar; la nueva entra con el fade-in habitual.
  const renderLine=()=>{
    CIN.fadeTimer=null;
    if(!CIN.on||CIN.lines[CIN.i]!==l)return;
    // v131: l.on = gancho al mostrarse la línea (cámara, audio…); l.auto = avance automático (ms)
    flushCinPending();
    if(l.pause){
      cinBox.classList.add('pause');
      cinTxt.innerHTML='';
      hint.textContent='…';
      CIN.timer=setTimeout(()=>cinAdvance(),l.pause);
      return;
    }
    cinBox.classList.remove('pause');
    const body=/[<&]/.test(l.t)?l.t:l.t.split(' ').map((w,k)=>'<span class="w" style="transition-delay:'+Math.min(k*65,1300)+'ms">'+w+'</span>').join(' ');
    if(l.who==='Katherin')cinTxt.innerHTML='<b>KATHERIN</b>'+body;
    else if(l.who==='Tú')cinTxt.innerHTML='<b>TÚ</b>'+body;
    else if(l.label)cinTxt.innerHTML='<b>'+l.label+'</b>'+body;
    else cinTxt.innerHTML=body;
    hint.textContent='CLIC O ESPACIO';
    if(l.auto)CIN.timer=setTimeout(()=>{if(CIN.on&&CIN.lines[CIN.i]===l)cinAdvance()},l.auto);
    requestAnimationFrame(()=>requestAnimationFrame(()=>cinTxt.classList.add('visible')));
    CIN.t=0;
  };
  CIN.fadeTimer=setTimeout(renderLine,260);
}
function endCinematic(){
  clearTimeout(CIN.timer);clearTimeout(CIN.fadeTimer);CIN.timer=null;CIN.fadeTimer=null;
  flushCinPending();
  CIN.on=false;cinBox.classList.remove('active','pause');cinBox.style.display='none';
  if(CIN.locSet){CIN.locSet=false;const loc=cinBox.querySelector('.cin-location');if(loc)loc.textContent='PARQUE DE LOS CISNES'}
  const reveal=cinBox.querySelector('#cinPhotoReveal');if(reveal)reveal.remove();
  window.__boisRevealPhoto=null;
  if(CIN.oldRotation){cam.rotation.copy(CIN.oldRotation);cam.updateMatrixWorld();CIN.oldRotation=null}
  S.on=true;
  if(CIN.cb)CIN.cb();
}
function cinAdvance(){if(!CIN.on)return;clearTimeout(CIN.timer);CIN.timer=null;flushCinPending();CIN.i++;showCinLine()}
// v74: capturar el clic desde document evita que otras capas del HUD o del mundo
// intercepten el evento antes de que llegue a la caja del diálogo.
document.addEventListener('click',e=>{
  if(!CIN.on||window.__boisWakeLock||e.button!==0)return;
  e.preventDefault();
  e.stopPropagation();
  cinAdvance();
},true);

document.addEventListener('keydown',e=>{if(CIN.on&&!window.__boisWakeLock&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();e.stopPropagation();if(!e.repeat)cinAdvance()}},true);

