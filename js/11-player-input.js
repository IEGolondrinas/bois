/* BOIS.IO · 11-player-input.js — Jugador S, spawn, teclado/ratón/táctil, resize
   (líneas 1351–1443 de BOIS_IO_v119_Optimizado.html) */
// ---------- player
const S={x:0,y:20,z:0,vy:0,yaw:0,pitch:0,fly:false,on:false};
function spawn(i){const sp=META.spawns[i%META.spawns.length]||[0,0];S.x=sp[0];S.z=sp[1];S.y=ground(S.x,S.z,300)+1.5;S.vy=0;S.sw=false}
const keys={};const jv={x:0,y:0};let jumpQ=false;
const msgBox=document.createElement('div');msgBox.id='storyPrompt';msgBox.style.cssText='position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom));transform:translate(-50%,8px);z-index:6;max-width:min(90vw,560px);padding:9px 16px;border:1px solid rgba(235,230,215,.16);background:rgba(12,16,20,.58);color:#f1eee6;border-radius:3px;text-align:center;font:13px/1.45 Georgia,serif;letter-spacing:.3px;text-shadow:0 1px 5px #000;opacity:0;pointer-events:none;transition:opacity .35s,transform .35s;backdrop-filter:blur(5px)';document.body.appendChild(msgBox);let msgT=0,msg='';function showMsg(m){msg=m;msgBox.textContent=m;msgT=2.8;msgBox.style.opacity='1';msgBox.style.transform='translate(-50%,0)'}
function start(){
  auInit();if(AU.ctx&&AU.ctx.resume)AU.ctx.resume();
  $('ov').style.display='none';
  // v69: primero despertar visual; después comienza el diálogo narrativo.
  if(window.__boisFreshStartPending){
    window.__boisFreshStartPending=false;
    S.fly=false;S.sw=false;S.vy=0;S.on=false;
    S.x=BEACH[0];S.z=BEACH[1];S.y=ground(S.x,S.z,300)+1.5;S.yaw=.4;S.pitch=.15;
    cam.position.set(S.x,S.y+1.7,S.z);cam.rotation.set(S.pitch,S.yaw,0,'YXZ');cam.updateMatrixWorld();
    idleRendered=false;
    // v131: Capítulo I cinematográfico (títulos, párpados, cámara a ras de arena). Si fallara, despertar clásico.
    let ch1ok=false;
    try{ch1Begin();ch1ok=true}catch(e){
      console.warn('Capítulo I: se usa el despertar clásico',e);
      try{CH1.legacy=true;CH1.intro=false;CH1CAM.on=false;ch1FilterClear();['ch1Lids','ch1Title'].forEach(id=>{const n=document.getElementById(id);if(n)n.remove()})}catch(_){typeof __bw==='function'&&__bw('11-player-input#1',_)}
      window.__boisWakeLock=false;
    }
    if(!ch1ok)playWakeOpening(()=>{startAwakening();cam.position.set(S.x,S.y+1.7,S.z);cam.rotation.set(S.pitch,S.yaw,0,'YXZ');cam.updateMatrixWorld()});
    return;
  }
  S.on=!CIN.on;
  if(window.__boisWakePending){window.__boisWakePending=false;playWakeOpening()}
  if(!touch&&!CIN.on)$('c').requestPointerLock?.();
}
function beginFromMenu(){
  let fresh=false;
  try{fresh=sessionStorage.getItem('bois_new_game_pending')==='1'||sessionStorage.getItem('bois_autostart_after_reset')==='1';sessionStorage.removeItem('bois_new_game_pending');sessionStorage.removeItem('bois_autostart_after_reset')}catch(e){typeof __bw==='function'&&__bw('11-player-input#2',e)}
  if(fresh)window.__boisFreshStartPending=true;
  start();
}
addEventListener('keydown',e=>{
if(e.code==='KeyF'&&!e.repeat&&S.on&&!CIN.on&&!(typeof CAR!=='undefined'&&CAR.on)&&!(typeof PR!=='undefined'&&PR.on)&&!(window.__boisCh6&&window.__boisCh6.on)){
  const kg=window.__katherin;
  if(kg&&kg.visible&&Math.hypot(S.x-kg.position.x,S.z-kg.position.z)<4.8&&Math.abs(S.y-kg.position.y)<5){
    if(!window.__boisSitting){
      const b=kg.userData.bench, a=b.a, lx=.58;
      S.x=b.x+Math.cos(a)*lx; S.z=b.z-Math.sin(a)*lx;
      // La superficie del asiento está unos 50 cm sobre el terreno.
      // Elevamos el punto de referencia del jugador para que sus ojos queden
      // a la altura de Katherin, no a la altura de una persona agachada.
      window.__boisSitGroundY=ground(S.x,S.z,S.y);
      S.y=b.h+.60;
      S.yaw=a+Math.PI; S.vy=0; S.fly=false; S.sw=false;
      window.__boisSitting=true;
      showMsg('Te sientas junto a Katherin · F: levantarte');
    }else{
      window.__boisSitting=false;
      S.y=ground(S.x,S.z,window.__boisSitGroundY??S.y);
      delete window.__boisSitGroundY;
      S.vy=0;
      showMsg('Te levantas de la banca');
    }
    e.preventDefault();return;
  }
}
// v117: salir del auto tiene prioridad y no depende del estado S.on / pointer lock.
if(e.code==='KeyE'&&!e.repeat&&CAR&&CAR.on){
  e.preventDefault();e.stopImmediatePropagation();exitCar();return;
}
if(e.code==='KeyE'&&!e.repeat&&S.on){if(interactCar())return;if(interactPhoto())return;if(typeof interactGlasses==="function"&&interactGlasses())return;if(typeof interactEmoji==="function"&&interactEmoji())return;if(interactKatherin())return;   try{if(typeof ch1Interact==='function'&&ch1Interact())return}catch(err){console.warn('ch1Interact',err)}
  const it=window.__awakeItems;
  if((typeof CH1==='undefined'||CH1.legacy)&&it&&it.cam&&Math.hypot(S.x-it.cam.position.x,S.z-it.cam.position.z)<2.5&&!STORY.flags.gotCam){
    storyFlag('gotCam',1);if(window.__awakeItems)window.__awakeItems.cam.visible=false;
    playCinematic([
      {t:'Una cámara fotográfica. La correa está gastada y el objetivo tiene una pequeña grieta.'},
      {t:'Dentro quedan cuatro fotografías. Están dañadas, pero todavía puedes distinguir lo que muestran.'},
      {t:'Un bosque. Unos edificios. Una piscina. Y una figura humana cuyo rostro se ha perdido.'},
      {t:'No sabes quién tomó estas imágenes ni por qué las dejó aquí.'}
    ],()=>{showMsg('Guardaste la cámara. Pulsa V para volver a examinar sus fotografías.');openCameraGallery();});
    return;
  }
  if((typeof CH1==='undefined'||CH1.legacy)&&it&&it.nb&&Math.hypot(S.x-it.nb.position.x,S.z-it.nb.position.z)<2.5&&!STORY.flags.gotNb){
    storyFlag('gotNb',1);if(window.__awakeItems)window.__awakeItems.nb.visible=false;
    playCinematic([
      {t:'Una pequeña libreta. La primera página tiene una frase escrita a mano:'},
      {t:'«Si estás leyendo esto, significa que has vuelto.»',who:'Libreta'},
      {t:'No entiendes qué significa. Pero la guardas.'}
    ],()=>showMsg('Guardaste la libreta.'));
    return;
  }
}
if(e.code==='KeyV'&&!e.repeat&&S.on&&!CIN.on&&STORY.flags.gotCam){openCameraGallery();return;}
if(!S.on)return;keys[e.code==='ShiftRight'?'ShiftLeft':e.code]=1;
 if(e.code==='Space'){jumpQ=true;e.preventDefault()}
 if(!e.repeat){if(e.code==='KeyP'&&S.on){shot=true;shotDl=e.shiftKey}if(e.code==='KeyR'&&S.on&&CAR.on){setRadio();e.preventDefault();}if(e.code==='KeyN'){AU.on=!AU.on;if(!AU.on&&typeof carSoundMute==='function')carSoundMute();window.__saveBoisCfg?.();showMsg(AU.on?'Sonido activado':'Sonido silenciado')}}});
addEventListener('keyup',e=>{keys[e.code==='ShiftRight'?'ShiftLeft':e.code]=0});addEventListener('blur',()=>{for(const k in keys)keys[k]=0;jumpQ=false;jv.x=jv.y=0});document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const k in keys)keys[k]=0;jumpQ=false;jv.x=jv.y=0}});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement&&S.on&&!CIN.on){S.yaw-=e.movementX*SENS*cam.fov/72;S.pitch=Math.max(-1.5,Math.min(1.5,S.pitch-(BOIS_OPT.invY?-1:1)*e.movementY*SENS*cam.fov/72))}});
document.addEventListener('pointerlockchange',()=>{if(window.__boisGuideIgnoreNextUnlock&&!document.pointerLockElement){window.__boisGuideIgnoreNextUnlock=false;return}if(!touch&&S.on&&!document.pointerLockElement&&!window.__boisGuideOverlayOpen){for(const k in keys)keys[k]=0;jumpQ=false;S.on=false;$('go').textContent='Continuar';$('go').disabled=false;$('ov').style.display='flex'}});
$('go').onclick=beginFromMenu;$('c').addEventListener('click',()=>{if(S.on&&!touch&&!document.pointerLockElement)$('c').requestPointerLock()});
if(touch){$('tb').style.display='flex';$('bj').onclick=()=>jumpQ=true;$('be').onclick=()=>{for(const t of['keydown','keyup'])document.dispatchEvent(new KeyboardEvent(t,{code:'KeyE',key:'e',bubbles:true}))};
 const handbrakeButton=$('bh');
 if(handbrakeButton){
  const releaseHandbrake=()=>{keys.Space=0;handbrakeButton.classList.remove('held');};
  handbrakeButton.addEventListener('pointerdown',e=>{if(!CAR.on)return;e.preventDefault();keys.Space=1;handbrakeButton.classList.add('held');try{handbrakeButton.setPointerCapture(e.pointerId)}catch(_){typeof __bw==='function'&&__bw('11-player-input#3',_)}});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>handbrakeButton.addEventListener(type,e=>{e.preventDefault?.();releaseHandbrake()}));
  addEventListener('blur',releaseHandbrake);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseHandbrake()});
 }
 // v122: atajos de teclado accesibles en pantallas táctiles (foto, diario, mapa, álbum, sentarse, radio).
 document.querySelectorAll('#tb [data-k]').forEach(b=>b.onclick=()=>{const code=b.dataset.k;for(const t of['keydown','keyup'])document.dispatchEvent(new KeyboardEvent(t,{code,key:code.slice(3).toLowerCase(),bubbles:true}))});
 let ls=null,rs=null;const st=$('st'),kn=st.firstElementChild;
 document.addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(!S.on||t.target.closest('#tb'))continue;if(t.clientX<innerWidth/2&&!ls){ls={id:t.identifier,x:t.clientX,y:t.clientY};st.style.display='block';st.style.left=t.clientX+'px';st.style.top=t.clientY+'px'}else if(t.clientX>=innerWidth/2&&!rs)rs={id:t.identifier,x:t.clientX,y:t.clientY}}},{passive:true});
 document.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(ls&&t.identifier===ls.id){let dx=t.clientX-ls.x,dy=t.clientY-ls.y;const l=Math.hypot(dx,dy),m=48;if(l>m){dx*=m/l;dy*=m/l}jv.x=dx/m;jv.y=dy/m;kn.style.transform=`translate(${dx}px,${dy}px)`}
  else if(rs&&t.identifier===rs.id){S.yaw-=(t.clientX-rs.x)*.005;S.pitch=Math.max(-1.5,Math.min(1.5,S.pitch-(t.clientY-rs.y)*.005));rs.x=t.clientX;rs.y=t.clientY}}},{passive:true});
 const releaseTouches=e=>{for(const t of e.changedTouches){if(ls&&t.identifier===ls.id){ls=null;jv.x=jv.y=0;st.style.display='none';kn.style.transform=''}if(rs&&t.identifier===rs.id)rs=null}};document.addEventListener('touchend',releaseTouches,{passive:true});document.addEventListener('touchcancel',releaseTouches,{passive:true})}
function resize(){R.setPixelRatio(dpr);R.setSize(innerWidth,innerHeight,false);idleRendered=false;cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}{let __rz=0;addEventListener('resize',()=>{if(__rz)return;__rz=requestAnimationFrame(()=>{__rz=0;resize()})})}resize();
