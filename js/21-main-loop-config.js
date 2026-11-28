/* BOIS.IO · 21-main-loop-config.js — Bucle principal frame(), persistencia de configuración
   Corregido: durante cinemáticas (CIN.on) y el despertar (__boisWakeLock), el mundo ya NO se congela.
   El control del jugador y la sobrescritura de cámara se pausan, pero clima, olas del agua, pasto,
   árboles, sombras, fauna, vida ambiental, audio y animaciones siguen corriendo con normalidad. */
window.__boisMainLoopUnified=true;
const PERF={frame:0,forest:0,life:0,sound:0,win:0,water:0,sky:0,sun:0,shadow:0,cull:0,carNearby:0,photos:0,aux120:0,aux200:0,aux400:0,aux1000:0,worldPaused:false};
let __wlWarned=false;function worldLife(tt){try{if(globalThis.BOIS_LIFE&&PC)BOIS_LIFE(PC,tt)}catch(e){if(!__wlWarned){__wlWarned=true;console.warn('worldLife:',e)}}}
const __srErr={};const __srT={};function __safeRun(k,fn){if((__srErr[k]|0)>=3){if(performance.now()-(__srT[k]||0)<20000)return;__srErr[k]=1}try{fn()}catch(e){__srT[k]=performance.now();__srErr[k]=(__srErr[k]|0)+1;console.warn(k+':',e);if(__srErr[k]>=3)console.warn(k+': desactivado tras 3 errores')}}
let __waterShader=null, __lastSunQ='';
function perfStep(dt){
  PERF.frame++;PERF.forest+=dt;PERF.life+=dt;PERF.sound+=dt;PERF.water+=dt;PERF.sky+=dt;PERF.sun+=dt;PERF.shadow+=dt;PERF.cull+=dt;PERF.carNearby+=dt;PERF.photos+=dt;PERF.aux120+=dt;PERF.aux200+=dt;PERF.aux400+=dt;PERF.aux1000+=dt;PERF.win++;
  return PERF;
}
let __boisCh4Tick=0,__boisLastVhsState=null;
function frame(){
  if(window.__boisStopFrameLoop)return;
  requestAnimationFrame(frame);
  if((__boisCh4Tick+=1)>=12){__boisCh4Tick=0;try{window.__boisChapter4Tick&&window.__boisChapter4Tick()}catch(e){if(!window.__ch4Warned){window.__ch4Warned=1;console.warn('chapter4 tick:',e)}}}
  const vhsActive=!!(S.on&&window.BOIS_VHS_ON);
  if(vhsActive!==__boisLastVhsState){document.body.classList.toggle('vhs-active',vhsActive);__boisLastVhsState=vhsActive}
  const dt=Math.min(cl.getDelta(),.05);perfStep(dt);
  if(document.hidden){typeof carSoundMute==='function'&&carSoundMute();window.__boisSwanBoxPause?.();for(const k in keys)keys[k]=0;jumpQ=false;jv.x=jv.y=0;return}
  const cinActive=(typeof CIN!=='undefined'&&!!CIN.on)||!!window.__boisWakeLock;
  if(cinActive&&typeof CAR!=='undefined'&&CAR.on&&typeof carSoundMute==='function')carSoundMute();
  if(window.__boisGuideOverlayOpen&&!cinActive){typeof carSoundMute==='function'&&carSoundMute();window.__boisSwanBoxPause?.();window.__boisUpdateMinimap?.(performance.now());if(!PERF.worldPaused){drawWorld();PERF.worldPaused=true}return}
  PERF.worldPaused=false;
  // Si el jugador está en el menú/pausa y NO hay cinemática ni despertar activo, no gastar recursos del bucle.
  if(!S.on&&!cinActive){
    typeof carSoundMute==='function'&&carSoundMute();
    window.__boisSwanBoxPause?.();
    window.__boisUpdateMinimap?.(performance.now());
    if(!idleRendered){drawWorld();idleRendered=true}
    return;
  }
  idleRendered=false;

  fa+=dt;fc++;if(fa>2){
    fps=fc/fa;const span=fa;fa=0;fc=0;
    {
      if(fps<50){__fpsLowTime+=span;__fpsHighTime=0}
      else if(fps>59){__fpsHighTime+=span;__fpsLowTime=0}
      else{__fpsLowTime=Math.max(0,__fpsLowTime-span*.5);__fpsHighTime=Math.max(0,__fpsHighTime-span*.5)}
      if(__fpsLowTime>=3&&dpr>.7){dpr=Math.max(.7,Math.round((dpr-.10)*100)/100);__fpsLowTime=0;resize()}
      else if(__fpsHighTime>=12&&dpr<dprMax){dpr=Math.min(dprMax,Math.round((dpr+.10)*100)/100);__fpsHighTime=0;resize()}
    }
  }

  // ---------- Controles del jugador y vehículo (solo activos fuera de cinemáticas) ----------
  if(S.on&&!AP.lock&&!PR.on&&CAR.on){carStep(dt);}
  if(S.on&&!CAR.on&&PERF.carNearby>=.10){PERF.carNearby=0;checkCarNearby();}
  if(S.on)carUiFrame(dt);
  if(S.on&&!AP.lock&&!PR.on&&!CAR.on){
    const px0=S.x,pz0=S.z,sw0=S.sw;
    let fx=window.__boisSitting?0:(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-jv.y,
        sx=window.__boisSitting?0:(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+jv.x;
    const ln=Math.hypot(fx,sx);if(ln>1){fx/=ln;sx/=ln}
    const sp=S.fly?(keys.ShiftLeft?90:30):(S.sw?(keys.ShiftLeft||ln>.95&&touch?4.5:2.8):(keys.ShiftLeft||ln>.95&&touch?9:5));
    const sn=Math.sin(S.yaw),cs=Math.cos(S.yaw);
    const vx=(-sn*fx+cs*sx)*sp*dt,vz=(-cs*fx-sn*sx)*sp*dt;
    if(S.fly){
      S.sw=false;S.x+=vx;S.z+=vz;S.y+=((keys.Space?1:0)-(keys.KeyC?1:0))*sp*.6*dt;
      if(touch&&fx>0)S.y+=Math.sin(S.pitch)*sp*dt*fx;
      S.y=Math.max(S.y,hAt(S.x,S.z)+.5);
    }else{
      const ns=Math.min(4,Math.max(1,Math.ceil(Math.hypot(vx,vz)/.25))),ax_=vx/ns,az_=vz/ns;
      for(let i=0;i<ns;i++){if(!blocked(S.x+ax_,S.y,S.z))S.x+=ax_;if(!blocked(S.x,S.y,S.z+az_))S.z+=az_}
      const g=ground(S.x,S.z,S.y),dep=WL-g;
      if(S.sw?dep>.5:dep>1.3){
        if(!S.sw){S.sw=true;S.vy*=.3;showMsg('Nadando · Espacio sube · C baja')}
        let tv=((keys.Space?1:0)-(keys.KeyC?1:0))*2.4+Math.sin(S.pitch)*fx*sp;
        if(jumpQ)S.vy=Math.max(S.vy,3);
        if(Math.abs(tv)<.05)tv=(WL-1.55-S.y)*1.8;
        S.vy+=(tv-S.vy)*Math.min(1,dt*5);
        S.y=Math.min(Math.max(S.y+S.vy*dt,g+.05),WL-1.45);
      }else{
        S.sw=false;
        if(window.__boisSitting){S.vy=0}else{S.vy-=22*dt;if(jumpQ&&S.y<=g+.08){S.vy=7.2}S.y+=S.vy*dt}
        if(S.y<=g){S.y=g;S.vy=0}
        else if(S.vy<=0&&S.y-g<.35&&S.y-g>0){S.y-=Math.min(S.y-g,12*dt)}
      }
    }
    jumpQ=false;stepFx(px0,pz0,sw0);
  }
  if(S.on&&!PR.on&&S.sw&&S.y<WL-PR.D)PR.enter();
  if(PR.on)PR.step(dt);
  const ch6On=!!(window.__boisCh6&&window.__boisCh6.on);
  const inSubZone=PR.on||ch6On;

  const now=performance.now(),tt=now*.001;
  if(S.on){
    const eye=S.y+(window.__boisSitting?1.02:1.7)+Math.sin(bobT)*bobA*(S.sw||window.__boisSitting||!BOIS_OPT.bob?0:1)+(S.sw?Math.sin(tt*1.6)*.04:0);
    if(CAR.on){
      carCamera(dt);
      setUW(false);
    }else{
      cam.position.set(S.x,eye,S.z);
      setUW(inSubZone?false:(uw?eye<WL+.03:eye<WL-.03));
      cam.rotation.set(S.pitch,S.yaw,0,'YXZ');
    }
    camFx(dt);
  }else{
    if(typeof CIN!=='undefined'&&CIN.on&&!(typeof CH1CAM!=='undefined'&&CH1CAM.on)&&!(typeof CAR!=='undefined'&&CAR.on)){
      window.__boisCinCamStep?.(dt);
    }
    if(!inSubZone){
      setUW(uw?cam.position.y<WL+.03:cam.position.y<WL-.03);
    }
  }

  // ---------- Entorno vivo continuo (se omiten sistemas exclusivos de la isla al entrar en Poolrooms o Capítulo VI) ----------
  const focusX=S.on?S.x:cam.position.x,focusY=S.on?S.y:cam.position.y,focusZ=S.on?S.z:cam.position.z;
  sky.position.copy(cam.position);
  if(!inSubZone){
    water.position.x=focusX;water.position.z=focusZ;
    if(!__waterShader&&waterMat.userData.waterShader)__waterShader=waterMat.userData.waterShader;
    if(__waterShader&&__waterShader.uniforms.uWaterTime)__waterShader.uniforms.uWaterTime.value=tt;
  }
  WX.upd(dt,tt);
  const skyTick=PERF.sky>=.030;
  if(PERF.water>=.033)PERF.water=0;
  if(skyTick){const sdt=PERF.sky;PERF.sky=0;if(!PR.on)skyFrame(sdt,tt);}
  if(PERF.forest>=.033){const ft=PERF.forest;PERF.forest=0;if(!inSubZone){updateForestMood(ft,tt);__safeRun('worldPolish',()=>worldPolishFrame(ft,tt))}}
  if(PERF.life>=.040){const lt=PERF.life;PERF.life=0;if(!inSubZone){lifeFrame(lt,tt);worldLife(tt)}}

  const d=sun.userData.d;
  if(!inSubZone&&d&&PERF.sun>=.033){
    PERF.sun=0;
    const qx=Math.round(focusX/2)*2,qy=Math.round(focusY/2)*2,qz=Math.round(focusZ/2)*2,
          qk=qx+','+qy+','+qz+','+(d.x*50|0)+','+(d.y*50|0)+','+(d.z*50|0);
    if(qk!==__lastSunQ){
      __lastSunQ=qk;
      sun.position.set(qx+d.x*150,qy+d.y*150,qz+d.z*150);
      sun.target.position.set(qx,qy,qz);
      sun.target.updateMatrixWorld();
    }
  }
  if(!inSubZone){
    __safeRun('fauna',()=>fauna(dt,tt));
    if(PC)__safeRun('art',()=>art(dt,tt));
    if(window.__boisKatherinFrame)__safeRun('katherin',()=>window.__boisKatherinFrame(dt,tt));
    if(window.__boisChapter4Ambience)__safeRun('ch4amb',()=>window.__boisChapter4Ambience(dt,tt));
    if(window.__boisGlassesAnim)__safeRun('glassesAnim',()=>window.__boisGlassesAnim(dt,tt));
    __safeRun('life2',()=>window.__life2&&window.__life2(dt,tt));
    if(skyTick)animateAwakeItems(tt);
    if(skyTick)animatePhotos(tt);
    if(PERF.aux200>=.20){PERF.aux200=0;__safeRun('aux200',()=>window.__boisPuppyTick?.())}
  }
  if(PERF.aux120>=.12){PERF.aux120=0;__safeRun('aux120',()=>{window.__boisGlassesTick?.();window.__boisSwanBoxTick?.()})}
  if(PERF.aux400>=.40){PERF.aux400=0;__safeRun('aux400',()=>{window.__boisEmojiTick?.();window.__boisCamFinderUpdate?.()})}
  if(PERF.aux1000>=1.0){PERF.aux1000=0;__safeRun('aux1000',()=>{if(!inSubZone)window.__boisCh7HintTick?.();window.__boisNtbTick?.()})}
  if(ch6On&&typeof window.__boisCh6Step==='function')__safeRun('ch6',()=>window.__boisCh6Step(dt,now));
  if(S.on&&!cinActive){
    if(!inSubZone&&PERF.photos>=.10){PERF.photos=0;checkPhotos();}
    if(typeof bgUpdate==='function')bgUpdate();
    window.__boisUpdateMinimap?.(now);
    if(!inSubZone&&window.__awakeItems){
      const it=window.__awakeItems;
      const dCam=Math.hypot(S.x-it.cam.position.x,S.z-it.cam.position.z);
      const dNb=Math.hypot(S.x-it.nb.position.x,S.z-it.nb.position.z);
      if(dCam<2.5&&!STORY.flags.gotCam){if(!window.__nearCam){window.__nearCam=1;showMsg('Cámara · pulsa E')}}else window.__nearCam=0;
      if(dNb<2.5&&!STORY.flags.gotNb){if(!window.__nearNb){window.__nearNb=1;showMsg('Libreta · pulsa E')}}else window.__nearNb=0;
    }
  }else{
    window.__boisCamFinderClose?.();
    if(typeof bgUpdate==='function')bgUpdate();
    window.__boisUpdateMinimap?.(now);
  }

  cam.updateMatrixWorld();cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  PM.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);FR.setFromProjectionMatrix(PM);
  if(!inSubZone){
    window.__boisCh6TreesHidden=false;
    try{grass(dt,tt)}catch(e){if(!window.__grWarned){window.__grWarned=1;console.warn('grass:',e)}}
    if(PERF.cull>=.050){PERF.cull=0;const tdLim=(QS[qi].td+85)**2,shLim=R.shadowMap.enabled?34225:0;for(const c of treeChunks){const d2=c.s.center.distanceToSquared(cam.position);c.m.visible=(FR.intersectsSphere(c.s)&&d2<tdLim)||(shLim>0&&d2<shLim)}}
  }else if(ch6On&&!window.__boisCh6TreesHidden){
    window.__boisCh6TreesHidden=true;
    for(const c of treeChunks)c.m.visible=false;
  }
  const shTick=qi>=3?.55:qi>=2?.40:.28;
  if(!uw&&!PR.on&&PERF.shadow>=shTick){PERF.shadow=0;R.shadowMap.needsUpdate=true;}
  drawWorld();
  if(shot){
    shot=false;
    const dl=shotDl;shotDl=false;
    try{
      if(typeof window.__boisCapturePhoto==='function'){
        window.__boisCapturePhoto($('c'),dl);
      }else{
        camFlash();dl||showMsg('📷 Foto tomada');
        if(dl)$('c').toBlob(b=>{
          if(!b){showMsg('No se pudo guardar la foto');return}
          const url=URL.createObjectURL(b),a=document.createElement('a');
          a.href=url;a.download='bois-io-'+Date.now()+'.png';a.click();
          setTimeout(()=>URL.revokeObjectURL(url),4000);
          showMsg('📷 Foto guardada');
        });
      }
    }catch(e){console.warn(e)}
  }
  if(msgT>0){msgT-=dt;if(msgT<=0){msgBox.style.opacity='0';msgBox.style.transform='translate(-50%,8px)'}}
  if(PERF.sound>=.10){PERF.sound=0;auUpd();musTick()}
}
// v107: restaurar realmente la configuración persistente y aplicar la calidad una sola vez.
try{
  const c=JSON.parse(localStorage.getItem('bois_cfg')||'{}');
  if(c.mu!==undefined)MU.on=!!c.mu;
  if(c.au!==undefined)AU.on=!!c.au;
  if(Number.isInteger(c.q)&&c.q>=0&&c.q<QS.length)qi=c.q;
  if(Number.isFinite(c.s)&&c.s>0)SENS=c.s;
  if(Number.isFinite(c.v)&&c.v>=0&&c.v<=1)BOIS_OPT.vol=c.v;
  if(typeof c.hb==='boolean')BOIS_OPT.bob=c.hb;
  if(typeof c.iy==='boolean')BOIS_OPT.invY=c.iy;
  setQ(qi,0);
}catch(e){setQ(qi,0)}
let __cfgLast='';
const saveBoisCfg=()=>{
  try{
    const j=JSON.stringify({mu:MU.on,au:AU.on,q:qi,s:SENS,v:BOIS_OPT.vol,hb:BOIS_OPT.bob,iy:BOIS_OPT.invY});
    if(j===__cfgLast)return;__cfgLast=j;localStorage.setItem('bois_cfg',j);
  }catch(e){typeof __bw==='function'&&__bw('21-main-loop-config#1',e)}
};
window.__saveBoisCfg=saveBoisCfg;
setInterval(()=>{if(!document.hidden)saveBoisCfg()},5000);
addEventListener('keydown',e=>{if(e.repeat||!S.on)return;if(e.code==='BracketLeft'||e.code==='BracketRight'){SENS=Math.max(.0008,Math.min(.006,SENS*(e.code==='BracketRight'?1.2:1/1.2)));window.__saveBoisCfg?.();showMsg('Sensibilidad: '+Math.round(SENS/.0022*100)+'%')}});
document.addEventListener('visibilitychange',()=>{const C=AU.ctx;if(C)document.hidden?C.suspend():C.resume()});
