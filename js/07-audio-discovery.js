/* BOIS.IO · 07-audio-discovery.js — Audio sintetizado, descubrimientos, brújula
   (líneas 678–699 de BOIS_IO_v119_Optimizado.html) */
// ---------- minimapa

// spLoaded() → ahora en 02-terrain-material.js
// ---------- fauna
// ---------- v5: extras
// v181: opciones de comodidad y volumen general (se guardan en bois_cfg como v, hb, iy). vol 0..1 (curva cuadrática en el nodo maestro).
const BOIS_OPT={vol:1,bob:true,invY:false};
function boisVolGain(){return BOIS_OPT.vol*BOIS_OPT.vol}
function boisSetVol(v){v=Math.max(0,Math.min(1,+v));if(!Number.isFinite(v))return;BOIS_OPT.vol=v;const g=boisVolGain();
 try{const C=AU.ctx;if(C&&AU.mg)AU.mg.gain.setTargetAtTime(g,C.currentTime,.03)}catch(e){typeof __bw==='function'&&__bw('07-audio-discovery#vol',e)}
 for(const f of(window.__boisVolHooks||[])){try{f(g)}catch(e){typeof __bw==='function'&&__bw('07-audio-discovery#volhook',e)}}}
const AU={ctx:null,on:true},NM=['Ciervo','Oveja','Conejo','Zorro','Cangrejo','Cisne'];var shotDl=false;let shot=false,bobT=0,bobA=0,stAcc=0;
function auInit(){if(AU.ctx)return;try{const C=new(window.AudioContext||window.webkitAudioContext)(),b=C.createBuffer(1,C.sampleRate*2,C.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){l=l*.96+(Math.random()*2-1)*.04;d[i]=l*4}
 /* v181: nodo maestro; ctx.destination apunta a él, así todo el audio existente respeta el volumen general */
 const mg=C.createGain();mg.gain.value=boisVolGain();mg.connect(C.destination);AU.mg=mg;Object.defineProperty(C,'destination',{get:()=>mg,configurable:true});
 const s=C.createBufferSource();s.buffer=b;s.loop=true;AU.wf=C.createBiquadFilter();AU.wf.type='lowpass';AU.wf.frequency.value=500;AU.wg=C.createGain();AU.wg.gain.value=0;s.connect(AU.wf);AU.wf.connect(AU.wg);AU.wg.connect(C.destination);s.start();AU.nb=b;AU.ctx=C}catch(e){typeof __bw==='function'&&__bw('07-audio-discovery#1',e)}}
function auHit(f,dur,vol,type){const C=AU.ctx;if(!C||!AU.on||!AU.nb)return;const s=C.createBufferSource(),fl=C.createBiquadFilter(),g=C.createGain(),t=C.currentTime;s.buffer=AU.nb;fl.type=type||'bandpass';fl.frequency.value=f;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(C.destination);s.onended=()=>{s.disconnect();fl.disconnect();g.disconnect()};s.start(t,Math.random()*1.5,dur+.05)}
function auChime(){const C=AU.ctx;if(!C||!AU.on)return;[660,990].forEach((f,i)=>{const o=C.createOscillator(),g=C.createGain(),t=C.currentTime+i*.12;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(g);g.connect(C.destination);o.onended=()=>{o.disconnect();g.disconnect()};o.start(t);o.stop(t+.4)})}
function __boisAirFactor(){
 const eye=S.y+(window.__boisSitting?1.02:1.7);
 if(typeof PR!=='undefined'&&PR.on)return 0;
 // Al bajar al lago, el sonido de la superficie se amortigua progresivamente.
 // A ~8 m bajo el agua ya no queda prácticamente aire exterior.
 const depth=Math.max(0,WL-eye);
 const q=Math.max(0,Math.min(1,depth/8));
 return 1-q*q*(3-2*q);
}
// v151 · viento: el volumen dependía de la altitud absoluta sin tope (h*.003), así que en las torres del capítulo VI
// (y≈240) sonaba al máximo, y no se silenciaba en espacios cerrados. Ahora la contribución de la altura se satura,
// el filtro tiene un techo y las zonas aisladas (Poolrooms, torres) atenúan el viento.
// <wind-audio>
function boisWindParams(y,fly,mute){
  const h=Math.max(0,y),alt=.2*(1-Math.exp(-h/60));          // ≈ .0033/m cerca del suelo (como antes), nunca pasa de .2
  return{gain:Math.min(.4,.04+(fly?.12:0)+alt)*.4*(1-mute),freq:Math.min(1100,450+h*7)};
}
// 0 = al aire libre · 1 = totalmente aislado. Poolrooms está cerrado; las torres (z<-900) lo están casi del todo (el puente sigue siendo exterior).
function __boisAudioZoneMute(){
  try{if(typeof PR!=='undefined'&&PR.on)return 1;if(S.z<-900)return .88}catch(e){typeof __bw==='function'&&__bw('07-audio-discovery#2',e)}
  return 0;
}
// </wind-audio>
function auUpd(){if(!AU.wg)return;const C=AU.ctx,t=C.currentTime,air=__boisAirFactor(),wp=boisWindParams(S.y,S.fly,__boisAudioZoneMute());
 const base=AU.on&&S.on?(uw?Math.min(.03,air*.03)*.4:wp.gain):0;
 AU.wg.gain.setTargetAtTime(base,t,.22);
 AU.wf.frequency.setTargetAtTime(uw?150+air*90:wp.freq,t,.35)}
// v123: el sonido de los pasos depende de la superficie (grava del sendero, arena, pasto).
const __stTB=atob(TRAIL_MASK_B64),__stTrail=(x,z)=>{const ix=Math.max(0,Math.min(511,Math.round((500-x)*.511))),iy=Math.max(0,Math.min(511,Math.round((500-z)*.511))),k=iy*512+ix;return(__stTB.charCodeAt(k>>3)&(1<<(k&7)))!==0};
function stepSurface(){const h=hAt(S.x,S.z),rv=.88+Math.random()*.24;
 if(__stTrail(S.x,S.z)){auHit(3000*rv,.07,.1);setTimeout(()=>auHit(4200*rv,.04,.05),38)}      // grava: crujido seco
 else if(h<3.1)auHit(1900*rv,.13,.09);                                                         // arena: roce suave
 else auHit(650*rv,.09,.07)}                                                                   // pasto/tierra: pisada sorda
function stepFx(px,pz,sw0){const d=Math.hypot(S.x-px,S.z-pz),run=keys.ShiftLeft,lim=S.sw?1.6:run?2.3:1.6,gr=!S.fly&&(S.sw||S.vy===0);
 if(S.sw&&!sw0)auHit(800,.5,.3);bobT+=d*6.283/lim;bobA+=((gr&&d>.002?(run?.07:.045):0)-bobA)*.15;
 if(!gr)return;stAcc+=d;if(stAcc>lim){stAcc=0;if(S.sw)auHit(1400,.28,.07);else stepSurface()}}
function camFx(dt){const mv=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD,cf=window.__boisCamFinder,tf=(cf&&cf.on)?(uw?72:72/(cf.zoom||1)):(typeof CAR!=='undefined'&&CAR.on)?(CAR.camMode==='first'?72+Math.min(8,Math.abs(CAR.speed)*.24):72+Math.min(16,Math.abs(CAR.speed)*.42)):keys.KeyZ?(uw?72:28):S.fly&&keys.ShiftLeft?88:(keys.ShiftLeft&&mv&&!S.sw)?80:72,nf=cam.fov+(tf-cam.fov)*Math.min(1,dt*8);if(Math.abs(nf-cam.fov)>.01){cam.fov=nf;cam.updateProjectionMatrix()}}
const WL=1.4;
