/* BOIS.IO · 23-cinematics.js — Diálogos cinemáticos y despertar visual
   (líneas 2243–2376 de BOIS_IO_v119_Optimizado.html) */
// ===== CINEMATIC DIALOGUE =====
const CIN={on:false,lines:[],i:0,t:0,cb:null,timer:null,fadeTimer:null,pendingOn:null,oldRotation:null,camTarget:null,curYaw:0,curPitch:0,curRoll:0,goalYaw:null,goalPitch:null,camSpeed:4.2,hadLook:false,restoreLook:false,pitchBias:0.035,unclampedPitch:false};
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
#cinTxt .cin-meta{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:9px;font:600 10px/1.2 system-ui;letter-spacing:2.4px;text-transform:uppercase}
#cinTxt .cin-layer{padding:3px 9px;border:1px solid rgba(217,201,169,.38);color:#e7dcc2;background:rgba(12,17,20,.45)}
#cinTxt .cin-layer.l-hecho{border-color:rgba(243,238,228,.45);color:#f3eee4}
#cinTxt .cin-layer.l-pensaste{border-color:rgba(228,182,111,.6);color:#f2ce8d;background:rgba(68,46,18,.32)}
#cinTxt .cin-layer.l-hoy{border-color:rgba(158,194,173,.6);color:#b7dec7;background:rgba(22,46,38,.34)}
#cinTxt .cin-layer.l-presencia{border-color:rgba(205,220,235,.5);color:#dce8f2;background:rgba(24,36,48,.34)}
#cinTxt .cin-stamp{color:rgba(220,212,194,.68);font-weight:500;letter-spacing:2px}
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
#cinPhotoReveal .cin-photo-kind{display:inline-block;margin:8px auto 0;padding:2px 7px;font:600 9px/1.3 system-ui,sans-serif;letter-spacing:1.6px;text-transform:uppercase;border:1px solid rgba(57,53,46,.35);color:#4c463d;background:rgba(57,53,46,.07)}
#cinPhotoReveal .cin-photo-kind.k-hecho{border-color:#2c5646;color:#214537;background:rgba(44,86,70,.1)}
#cinPhotoReveal .cin-photo-kind.k-simbolo{border-color:#785b35;color:#5d4423;background:rgba(120,91,53,.1)}
#cinPhotoReveal .cin-photo-caption{text-align:center;padding-top:6px;font:italic 15px Georgia,serif;letter-spacing:.4px}
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
  #wakeOpening .wake-focus{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(16,22,28,.48),rgba(4,7,10,.86));will-change:opacity;animation:wakeFocus 4.5s ease forwards}
  #wakeOpening .wake-caption{position:absolute;left:0;right:0;bottom:13%;text-align:center;color:rgba(230,232,225,.0);font:italic 15px Georgia,serif;letter-spacing:2px;text-shadow:0 2px 12px #000;animation:wakeCaption 3.6s ease forwards}
  @keyframes wakeTop{0%,14%{transform:translateY(0)}43%{transform:translateY(-105%)}49%{transform:translateY(0)}57%,100%{transform:translateY(-105%)}}
  @keyframes wakeBottom{0%,14%{transform:translateY(0)}43%{transform:translateY(105%)}49%{transform:translateY(0)}57%,100%{transform:translateY(105%)}}
  @keyframes wakeFocus{0%,38%{opacity:1}55%{opacity:.62}100%{opacity:0}}
  @keyframes wakeCaption{0%,12%{color:rgba(230,232,225,0)}25%,48%{color:rgba(230,232,225,.72)}70%,100%{color:rgba(230,232,225,0)}}
  @keyframes wakeFade{to{opacity:0;visibility:hidden}}
  @media(prefers-reduced-motion:reduce){#wakeOpening .wake-lid,#wakeOpening .wake-focus,#wakeOpening .wake-caption{animation-duration:1ms}}
  `;
  document.head.appendChild(style);
  setTimeout(()=>{layer.remove();style.remove();window.__boisWakeLock=false;if(typeof onComplete==='function')onComplete();},5200);
}

function cinWrapAngle(a){
  let d=a%(Math.PI*2);
  if(d>Math.PI)d-=Math.PI*2;
  if(d<-Math.PI)d+=Math.PI*2;
  return d;
}
function cinComputeGoal(target,opts){
  if(!target||typeof cam==='undefined')return null;
  const tx=target.x,ty=target.y,tz=target.z;
  if(!Number.isFinite(tx)||!Number.isFinite(ty)||!Number.isFinite(tz))return null;
  const dx=tx-cam.position.x,dy=ty-cam.position.y,dz=tz-cam.position.z;
  const horiz=Math.hypot(dx,dz);
  const yaw=horiz>=0.35?Math.atan2(-dx,-dz):CIN.curYaw;
  const effDist=Math.max(horiz,(opts&&opts.minDist)||2.1);
  let pitch=Math.atan2(dy,effDist);
  if(dy<-0.2&&!(opts&&opts.noBias))pitch+=(opts&&opts.pitchBias!=null?opts.pitchBias:CIN.pitchBias);
  if(!(opts&&opts.unclampedPitch))pitch=Math.max(-0.48,Math.min(0.68,pitch));
  else pitch=Math.max(-1.25,Math.min(1.25,pitch));
  return{yaw,pitch};
}
function cinSetLookAt(target,opts){
  if(!target){CIN.camTarget=null;return}
  CIN.camTarget={x:target.x,y:target.y,z:target.z};
  if(opts&&opts.camSpeed)CIN.camSpeed=opts.camSpeed;
  const g=cinComputeGoal(CIN.camTarget,opts);
  if(!g)return;
  CIN.goalYaw=g.yaw;CIN.goalPitch=g.pitch;CIN.hadLook=true;
  if(opts&&opts.snap&&typeof cam!=='undefined'){
    CIN.curYaw=g.yaw;CIN.curPitch=g.pitch;
    cam.rotation.set(CIN.curPitch,CIN.curYaw,0,'YXZ');cam.updateMatrixWorld();
  }
}
window.__boisCinLookAt=cinSetLookAt;
window.__boisCinCamStep=function(dt){
  if(!CIN.on||typeof cam==='undefined')return;
  if(typeof CH1CAM!=='undefined'&&CH1CAM.on)return;
  if(typeof CAR!=='undefined'&&CAR.on)return;
  if(CIN.camTarget){
    const g=cinComputeGoal(CIN.camTarget,CIN.camOpts);
    if(g){CIN.goalYaw=g.yaw;CIN.goalPitch=g.pitch}
  }
  if(CIN.goalYaw===null||CIN.goalPitch===null)return;
  const k=1-Math.exp(-Math.max(1.2,CIN.camSpeed||4.2)*Math.min(dt||0.016,0.05));
  CIN.curYaw+=cinWrapAngle(CIN.goalYaw-CIN.curYaw)*k;
  CIN.curPitch+=(CIN.goalPitch-CIN.curPitch)*k;
  CIN.curRoll+=(0-CIN.curRoll)*k;
  cam.rotation.set(CIN.curPitch,CIN.curYaw,CIN.curRoll,'YXZ');
};

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
    const __kCls=__ph.kind==='simbolo'?'k-simbolo':__ph.kind==='hecho'?'k-hecho':'';
    const __kTxt=__ph.kindLabel||(__ph.kind==='simbolo'?'MEMORIA SIMBÓLICA':__ph.kind==='hecho'?'RECUERDO DIRECTO':'');
    r.innerHTML='<div class="cin-photo-mat"><img src="'+__esc(__ph.img)+'" alt="'+__esc(__ph.title)+'">'+(__kTxt?'<div style="text-align:center"><span class="cin-photo-kind '+__kCls+'">'+__esc(__kTxt)+'</span></div>':'')+'<div class="cin-photo-caption">'+__esc(__ph.title)+'</div></div>';
    cinBox.appendChild(r);
  }
  const ch1Owns=typeof CH1CAM!=='undefined'&&!!CH1CAM.on;
  CIN.oldRotation=cam.rotation.clone();
  CIN.camOpts=opts;CIN.camTarget=null;CIN.goalYaw=null;CIN.goalPitch=null;
  CIN.hadLook=false;CIN.restoreLook=!!opts.restoreLook;CIN.camSpeed=opts.camSpeed||4.2;
  if(opts.location){const loc=cinBox.querySelector('.cin-location');if(loc){loc.textContent=opts.location;CIN.locSet=true}} // v131: los capítulos IV/V fijan su rótulo por su cuenta
  if(!ch1Owns&&typeof cam!=='undefined'){
    cam.rotation.order='YXZ';
    CIN.curYaw=cam.rotation.y;
    CIN.curPitch=Math.max(-1.35,Math.min(1.35,cam.rotation.x));
    CIN.curRoll=cam.rotation.z||0;
    if(opts.lookAt){
      cinSetLookAt(opts.lookAt,opts);
    }else{
      CIN.goalYaw=CIN.curYaw;
      CIN.goalPitch=Math.max(-0.42,Math.min(0.42,CIN.curPitch));
    }
  }
  cinBox.classList.add('active');
  cinBox.classList.remove('pause');
  cinBox.style.display='block';cinBox.style.opacity='1';cinBox.style.visibility='visible';cinBox.style.zIndex='80';
  requestAnimationFrame(()=>cinBox.classList.add('active'));
  showCinLine();S.on=false;
}
function showCinLine(){
  if(CIN.i>=CIN.lines.length){endCinematic();return}
  const raw=CIN.lines[CIN.i],hint=cinBox.querySelector('#cinHint');
  if(!raw||(typeof raw!=='object'&&typeof raw!=='string')){CIN.i++;showCinLine();return}
  const l=typeof raw==='string'?{t:raw}:raw;
  clearTimeout(CIN.timer);CIN.timer=null;
  clearTimeout(CIN.fadeTimer);CIN.fadeTimer=null;
  flushCinPending();
  CIN.pendingOn=typeof l.on==='function'?l.on:null;
  if(l.lookAt&&!(typeof CH1CAM!=='undefined'&&CH1CAM.on))cinSetLookAt(l.lookAt,l);
  cinTxt.classList.remove('visible');
  // La frase anterior se desvanece antes de cambiar; la nueva entra con el fade-in habitual.
  const renderLine=()=>{
    CIN.fadeTimer=null;
    if(!CIN.on||CIN.lines[CIN.i]!==raw)return;
    // v131: l.on = gancho al mostrarse la línea (cámara, audio…); l.auto = avance automático (ms)
    flushCinPending();
    if(l.pause){
      cinBox.classList.add('pause');
      cinTxt.innerHTML='';
      hint.textContent='…';
      CIN.timer=setTimeout(()=>cinAdvance(),l.pause);
      return;
    }
    const text=l.t!=null?String(l.t):(l.text!=null?String(l.text):'');
    if(!text&&!l.layer&&!l.stamp){cinAdvance();return}
    cinBox.classList.remove('pause');
    const body=!text?'':(/[<&]/.test(text)?text:text.split(' ').map((w,k)=>'<span class="w" style="transition-delay:'+Math.min(k*65,1300)+'ms">'+w+'</span>').join(' '));
    const memStage=typeof window.__boisMemoryStage==='function'?window.__boisMemoryStage():'sep';
    const layerNames=memStage==='mixed'
      ? {hecho:'HECHO (APARENTE)',pensaste:'HECHO + INTERPRETACIÓN · 2025',hoy:'LO QUE PUEDES SABER HOY',presencia:'PRESENCIA'}
      : memStage==='quiet'
        ? {hecho:'HECHO',pensaste:'LO QUE PENSASTE · 2025',hoy:'LO QUE SABES HOY · SIN PRISA',presencia:'PRESENCIA'}
        : {hecho:'HECHO',pensaste:'LO QUE PENSASTE · 2025',hoy:'LO QUE SABES HOY',presencia:'PRESENCIA'};
    const escCin=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    let head='';
    if(l.layer||l.stamp){
      head+='<div class="cin-meta">';
      if(l.stamp)head+='<span class="cin-stamp">'+escCin(l.stamp)+'</span>';
      if(l.layer)head+='<span class="cin-layer l-'+escCin(l.layer)+'">'+escCin(l.layerLabel||layerNames[l.layer]||l.layer)+'</span>';
      head+='</div>';
    }
    if(l.who==='Katherin')cinTxt.innerHTML=head+'<b>KATHERIN</b>'+body;
    else if(l.who==='Tú')cinTxt.innerHTML=head+'<b>TÚ</b>'+body;
    else if(l.label)cinTxt.innerHTML=head+'<b>'+escCin(l.label)+'</b>'+body;
    else cinTxt.innerHTML=head+body;
    hint.textContent='CLIC O ESPACIO';
    if(l.auto)CIN.timer=setTimeout(()=>{if(CIN.on&&CIN.lines[CIN.i]===raw)cinAdvance()},l.auto);
    requestAnimationFrame(()=>requestAnimationFrame(()=>cinTxt.classList.add('visible')));
    CIN.t=0;
  };
  CIN.fadeTimer=setTimeout(renderLine,260);
}
function endCinematic(){
  clearTimeout(CIN.timer);clearTimeout(CIN.fadeTimer);CIN.timer=null;CIN.fadeTimer=null;
  flushCinPending();
  const ch1Owns=typeof CH1CAM!=='undefined'&&!!CH1CAM.on;
  const keepFramed=!ch1Owns&&!CIN.restoreLook&&CIN.hadLook;
  const endYaw=CIN.curYaw,endPitch=CIN.curPitch;
  CIN.on=false;CIN.camTarget=null;CIN.goalYaw=null;CIN.goalPitch=null;CIN.hadLook=false;
  cinBox.classList.remove('active','pause');cinBox.style.display='none';
  if(CIN.locSet){CIN.locSet=false;const loc=cinBox.querySelector('.cin-location');if(loc)loc.textContent='PARQUE DE LOS CISNES'}
  const reveal=cinBox.querySelector('#cinPhotoReveal');if(reveal)reveal.remove();
  window.__boisRevealPhoto=null;
  if(!ch1Owns&&typeof cam!=='undefined'){
    if(keepFramed&&typeof S!=='undefined'){
      S.yaw=endYaw;
      S.pitch=Math.max(-1.25,Math.min(1.25,endPitch));
      cam.rotation.set(S.pitch,S.yaw,0,'YXZ');
      cam.updateMatrixWorld();
    }else if(CIN.oldRotation){
      cam.rotation.copy(CIN.oldRotation);
      cam.updateMatrixWorld();
    }
  }
  CIN.oldRotation=null;
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
window.__boisMemoryStage=function(){
  try{
    const F=(typeof STORY!=='undefined'&&STORY&&STORY.flags)||{};
    if(F.ch7_presencia)return'quiet';
    if(F.ch7_complete||F.ch6_complete||F.ch4_complete||F.metKatherin)return'sep';
    return'mixed';
  }catch(e){return'sep'}
};
window.__boisMemoryLines=function(p){
  if(p&&p.layers){
    const L=p.layers,out=[],st=window.__boisMemoryStage();
    const isSym=p.kind==='simbolo';
    if(L.fact)out.push({layer:'hecho',stamp:L.stamp||'',layerLabel:isSym?'SÍMBOLO':(st==='mixed'?'HECHO':'HECHO'),t:L.fact});
    if(L.thought2025)out.push({layer:'pensaste',t:L.thought2025});
    if(L.insight2026)out.push({layer:'hoy',t:L.insight2026});
    if(L.echo)out.push({t:L.echo});
    return out;
  }
  return Array.isArray(p&&p.mem)?p.mem.map(t=>typeof t==='string'?{t}:t):[];
};

