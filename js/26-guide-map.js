/* BOIS.IO · 26-guide-map.js — Guía personal: brújula, diario de misión, mapa, modo dev (F3)
   (líneas 2489–2577 de BOIS_IO_v119_Optimizado.html) */
// ===== v53: archivo personal de exploracion, diario de misiones y mapa =====
// Este conjunto esta pensado como una guia privada para volver a recorrer la isla.
const BOIS_GUIDE={dev:false,map:false,journal:false,showPhotoCoords:false,lastUI:0,points:[]};
try{BOIS_GUIDE.points=JSON.parse(localStorage.getItem('bois_dev_points')||'[]');if(!Array.isArray(BOIS_GUIDE.points))BOIS_GUIDE.points=[];else if(typeof window.__bkPoints==='function')BOIS_GUIDE.points=window.__bkPoints(BOIS_GUIDE.points)}catch(e){BOIS_GUIDE.points=[]}
const guideStyle=document.createElement('style');guideStyle.textContent=`
#bgHud{position:fixed;left:18px;top:18px;z-index:7;max-width:min(360px,calc(100vw - 36px));padding:12px 15px;background:rgba(10,16,19,.62);border:1px solid rgba(230,225,205,.18);backdrop-filter:blur(8px);color:#eee9dd;font:13px/1.45 Georgia,serif;pointer-events:none;opacity:0;transform:translateY(-5px);transition:opacity .35s,transform .35s}
#bgHud.on{opacity:1;transform:none}#bgHud small{display:block;color:#c4b99d;font:10px/1.4 system-ui;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}#bgHud b{font-weight:500}
.bgPanel{position:fixed;inset:0;z-index:12;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,7,10,.72);backdrop-filter:blur(7px);touch-action:auto}
.bgPanel.open{display:flex}.bgCard{width:min(620px,96vw);max-height:min(82vh,760px);overflow:auto;background:rgba(17,23,26,.96);border:1px solid rgba(220,215,195,.2);padding:22px;color:#eee9dd;box-shadow:0 18px 70px #0009;touch-action:pan-y}
.bgCard h2{font:300 24px Georgia,serif;letter-spacing:1px;margin:0 0 6px}.bgSub{color:#b8b6aa;font:12px/1.5 system-ui;margin:0 0 18px}.bgClose{float:right;width:auto;padding:5px 10px;background:transparent;color:#c9c2b1;border:1px solid #ffffff30;border-radius:0;font-size:11px}.bgBlock{padding:13px 0;border-top:1px solid #ffffff18}.bgBlock strong{font:14px Georgia,serif;color:#eee9dd}.bgBlock p{font:13px/1.55 Georgia,serif;color:#c1c0b7;margin:5px 0 0}.bgMuted{color:#9da49f;font:12px/1.5 system-ui}.bgProgress{height:4px;background:#ffffff20;margin-top:10px}.bgProgress i{display:block;height:100%;background:#cbb78a}.bgControls{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.bgControls button{width:auto;padding:8px 12px;background:transparent;border:1px solid #ffffff30;color:#e6dfce;border-radius:0;font-size:11px}.bgMapWrap{background:#10191c;border:1px solid #ffffff20;padding:8px;margin-top:12px}.bgMapWrap canvas{position:relative;inset:auto;width:100%;height:auto;display:block;aspect-ratio:1}.bgLegend{display:flex;gap:14px;flex-wrap:wrap;color:#aeb7b2;font:11px system-ui;margin-top:10px}.bgDot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:#e9d7a9}.bgDev{position:fixed;left:16px;bottom:16px;z-index:11;display:none;max-width:min(390px,calc(100vw - 32px));padding:12px;background:rgba(8,13,17,.9);border:1px solid #9db6c044;color:#e5e7e3;font:12px/1.5 ui-monospace,Consolas,monospace;backdrop-filter:blur(8px);pointer-events:auto}.bgDev.on{display:block}.bgDev button{width:auto;padding:6px 9px;margin:6px 5px 0 0;background:transparent;border:1px solid #ffffff40;color:#eee;border-radius:0;font-size:10px}.bgDev .bgDevList{max-height:110px;overflow:auto;color:#aebbb5;font-size:10px;margin-top:6px}
@media(max-width:600px){#bgHud{left:10px;top:10px;padding:9px 11px;font-size:12px}.bgCard{padding:16px}.bgDev{left:8px;bottom:8px}}
`;document.head.appendChild(guideStyle);
const compassStyle=document.createElement('style');compassStyle.textContent=`
#bgCompass{position:fixed;right:18px;top:18px;z-index:7;display:none;align-items:center;gap:11px;padding:10px 13px;background:rgba(10,16,19,.68);border:1px solid rgba(230,225,205,.2);backdrop-filter:blur(9px);color:#eee9dd;pointer-events:none;min-width:174px}
#bgCompass.on{display:flex}
#bgCompass .bgDial{position:relative;width:62px;height:62px;flex:none;border:1px solid rgba(232,220,190,.65);border-radius:50%;background:radial-gradient(circle,rgba(220,210,180,.12),rgba(0,0,0,.25));box-shadow:inset 0 0 0 4px rgba(255,255,255,.035),0 3px 12px #0006}
#bgCompass .bgRose{position:absolute;inset:0;transform-origin:50% 50%;pointer-events:none}
#bgCompass .bgCardinal{position:absolute;font:700 9px system-ui;color:#e6d6ae;line-height:1}
#bgCompass .bgCardinal.n{top:4px;left:50%;transform:translateX(-50%)}
#bgCompass .bgCardinal.s{bottom:4px;left:50%;transform:translateX(-50%);color:#c6c0b2}
#bgCompass .bgCardinal.e{right:5px;top:50%;transform:translateY(-50%);color:#c6c0b2}
#bgCompass .bgCardinal.w{left:5px;top:50%;transform:translateY(-50%);color:#c6c0b2}
#bgCompass .bgTick{position:absolute;left:50%;top:50%;width:1px;height:5px;background:#c7c0aa;transform-origin:50% 0}
#bgCompass .bgNeedle{position:absolute;left:50%;top:50%;width:3px;height:23px;margin-left:-1.5px;margin-top:-20px;background:linear-gradient(to top,#b7b5a7 0 48%,#e4b66f 50% 100%);clip-path:polygon(50% 0,100% 100%,50% 82%,0 100%);transform-origin:50% 20px;filter:drop-shadow(0 1px 2px #000)}
#bgCompass .bgHub{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#f0e4c5;border:1px solid #554b38}
#bgCompass .bgCompText{min-width:0}
#bgCompass small{display:block;color:#c8b98e;font:9px system-ui;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:3px}
#bgCompass strong{display:block;font:14px Georgia,serif;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
#bgCompass span{display:block;color:#b8c0b9;font:10px system-ui;margin-top:3px}
@media(max-width:600px){#bgCompass{right:9px;top:9px;min-width:0;padding:7px 9px;gap:7px}#bgCompass .bgDial{width:48px;height:48px}#bgCompass .bgNeedle{height:18px;margin-top:-15px;transform-origin:50% 15px}#bgCompass strong{font-size:12px;max-width:105px}}
`;document.head.appendChild(compassStyle);
const bgPhotoStyle=document.createElement('style');bgPhotoStyle.textContent=`
.bgPhotoGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:11px;margin-top:10px}
.bgPhotoCard{padding:7px;background:rgba(255,255,255,.045);border:1px solid rgba(220,215,195,.16)}
.bgPhotoCard img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;filter:sepia(.08) contrast(.97);border:4px solid #e4dbc8;box-shadow:0 3px 10px #0007}
.bgPhotoCard span{display:block;margin-top:7px;font:13px Georgia,serif;color:#e9dfca}
`;document.head.appendChild(bgPhotoStyle);
const bgHud=document.createElement('div');bgHud.id='bgHud';bgHud.innerHTML='<small>BOIS.IO · LO QUE SIGUE</small><b id="bgObjective">Explora la isla</b><div id="bgClue" style="color:#c5c1b5;margin-top:3px"></div>';document.body.appendChild(bgHud);
const bgCompass=document.createElement('div');bgCompass.id='bgCompass';bgCompass.innerHTML='<div class="bgDial"><div class="bgRose" id="bgRose"><b class="bgCardinal n">N</b><b class="bgCardinal e">E</b><b class="bgCardinal s">S</b><b class="bgCardinal w">O</b></div><i class="bgNeedle" id="bgNeedle"></i><i class="bgHub"></i></div><div class="bgCompText"><small>BRÚJULA · NORTE Y PISTA</small><strong id="bgCompassTarget">Explora</strong><span id="bgCompassInfo">Buscando dirección…</span></div>';document.body.appendChild(bgCompass);
const bgJournal=document.createElement('div');bgJournal.className='bgPanel';bgJournal.id='bgJournal';bgJournal.innerHTML='<section class="bgCard"><button class="bgClose" data-close="journal">CERRAR · J</button><h2>Diario de exploración</h2><p class="bgSub">No todo lo que encuentres tendrá una explicación. Algunas cosas merecen quedarse contigo.</p><div id="bgJournalBody"></div><div class="bgControls"><button data-open="map">CONSULTAR MAPA · M</button></div></section>';document.body.appendChild(bgJournal);
const bgMap=document.createElement('div');bgMap.className='bgPanel';bgMap.id='bgMap';bgMap.innerHTML='<section class="bgCard"><button class="bgClose" data-close="map">CERRAR · M</button><h2>Mapa de la isla</h2><p class="bgSub">El mapa se revela a medida que recorres la isla. Las zonas punteadas con «?» son pistas aproximadas: la fotografía está en algún punto dentro de ellas.</p><div class="bgMapWrap"><canvas id="bgMapCanvas" width="800" height="800"></canvas></div><div class="bgLegend"><span><i class="bgDot" style="background:#fff4d4"></i>Tú (la flecha marca hacia dónde miras)</span><span><i class="bgDot" style="background:#8fd0b0"></i>Fotografía recuperada</span><span><i class="bgDot" style="background:#ffcc76"></i>Zona de pista</span><span><i class="bgDot" style="background:#96463a"></i>Construcciones</span><span><i class="bgDot" style="background:#b89868"></i>Senderos</span><span><i class="bgDot" style="background:#d2a36f"></i>Punto personal (modo desarrollador)</span></div><p class="bgMuted" style="margin-top:12px">Norte arriba · Lo oscuro aún no lo has recorrido · M o Esc para cerrar · J abre el diario con las pistas.</p></section>';document.body.appendChild(bgMap);
const bgDev=document.createElement('div');bgDev.className='bgDev';bgDev.id='bgDev';bgDev.innerHTML='<div><b>BOIS.IO · HERRAMIENTAS PRIVADAS</b></div><div id="bgCoords">X: 0 · Y: 0 · Z: 0</div><div style="margin-top:6px;color:#c8d5ce">G · Activar/desactivar vuelo</div><div style="color:#aebbb5">WASD · desplazarse · Espacio subir · C bajar · Shift acelerar</div><div class="bgControls"><button id="bgSavePoint">GUARDAR ESTE LUGAR · F4</button><button id="bgShowPhotos">VER FOTOS · F5</button></div><div class="bgDevList" id="bgDevList"></div>';document.body.appendChild(bgDev);
function bgCollected(){return PHOTOS.filter(p=>!!STORY.flags['photo_'+p.id]).length}
function bgDirection(dx,dz){const a=(Math.atan2(dx,-dz)+Math.PI*2)%(Math.PI*2),dirs=['norte','noreste','este','sureste','sur','suroeste','oeste','noroeste'];return dirs[Math.round(a/(Math.PI/4))%8]}
function bgDistance(d){return d<65?'relativamente cerca':d<190?'a cierta distancia':'lejos de aquí'}
function bgNearestPhoto(){let best=null,bd=Infinity;for(const p of PHOTOS){if(STORY.flags['photo_'+p.id])continue;const d=Math.hypot(p.x-S.x,p.z-S.z);if(d<bd){bd=d;best=p}}return best?{p:best,d:bd}:null}
// v133 · Capítulo II remasterizado: pistas encadenadas por el orden de PHOTOS. Una foto es «conocida» (su pista visible y su zona
// aproximada en el mapa) si es la primera, si la anterior ya se recuperó, o si ya se recuperó ella misma.
const BG_NEAR=120;
const bgIsKnown=i=>i===0||!!STORY.flags['photo_'+PHOTOS[i-1].id]||!!STORY.flags['photo_'+PHOTOS[i].id];
function bgKnownPending(){return PHOTOS.filter((p,i)=>!STORY.flags['photo_'+p.id]&&bgIsKnown(i))}
function bgGuided(){return bgKnownPending()[0]||null}
function bgZone(p){return{x:p.x+(p.zx||0),z:p.z+(p.zz||0),r:70}}
function bgMission(){
 if(!STORY.flags.gotCam||!STORY.flags.gotNb){const it=window.__awakeItems;let targets=[];if(it&&!STORY.flags.gotCam)targets.push({name:'la cámara',x:it.cam.position.x,z:it.cam.position.z});if(it&&!STORY.flags.gotNb)targets.push({name:'la libreta',x:it.nb.position.x,z:it.nb.position.z});targets.sort((a,b)=>Math.hypot(a.x-S.x,a.z-S.z)-Math.hypot(b.x-S.x,b.z-S.z));const t=targets[0];return {title:'Capítulo I · Regreso a la orilla',clue:t?'Busca '+t.name+' '+bgDirection(t.x-S.x,t.z-S.z)+'. Está '+bgDistance(Math.hypot(t.x-S.x,t.z-S.z))+'.':'Explora la playa a la que regresaste.'}}
 const n=bgCollected();if(n>=PHOTOS.length){
  if(STORY.flags.metKatherin)return{title:'Capítulo III · El Parque de los Cisnes',clue:'Katherin permanece junto al lago. Puedes sentarte con ella (F) o seguir explorando la isla.'};
  if(!STORY.flags.glasses&&window.__glasses&&window.__glasses.visible)return{title:'Capítulo III · El Parque de los Cisnes',clue:'Al acercarte al parque la vista se empaña. Busca tus gafas sobre otra banca cercana (E).'};
  return{title:'Capítulo III · El Parque de los Cisnes',clue:'Acércate a la joven sentada junto al lago en el Parque de los Cisnes (E).'};
 }
 return {title:'Encuentra las fotografías · '+n+'/'+PHOTOS.length,clue:bgGuided()?bgGuided().clue:'Sigue explorando.'}
}
function bgTarget(){
 const it=window.__awakeItems,targets=[];
 if(it&&!STORY.flags.gotCam&&it.cam&&it.cam.visible)targets.push({name:'La cámara',x:it.cam.position.x,z:it.cam.position.z});
 if(it&&!STORY.flags.gotNb&&it.nb&&it.nb.visible)targets.push({name:'La libreta',x:it.nb.position.x,z:it.nb.position.z});
 if(targets.length){targets.sort((a,b)=>Math.hypot(a.x-S.x,a.z-S.z)-Math.hypot(b.x-S.x,b.z-S.z));return targets[0]}
 const next=bgNearestPhoto();if(next)return next.d<=BG_NEAR?{name:'Algo está cerca…',x:next.p.x,z:next.p.z}:null;
 if(!STORY.flags.metKatherin){
  if(!STORY.flags.glasses&&window.__glasses&&window.__glasses.visible)return {name:'Gafas en la banca',x:window.__glasses.position.x,z:window.__glasses.position.z};
  if(window.__katherin)return {name:'Joven junto al lago',x:window.__katherin.position.x,z:window.__katherin.position.z};
 }
 return null;
}
const bgEsc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function bgRenderJournal(){const el=document.getElementById('bgJournalBody');if(!el)return;const m=bgMission(),n=bgCollected(),pct=Math.round(n/PHOTOS.length*100);const ch4N=(STORY.flags.ch4_entered&&typeof ch4FragmentCount==='function'&&typeof CH4_FRAGMENTS!=='undefined')?ch4FragmentCount(STORY.flags):null;const ch5On=!!(STORY.flags.ch5_entered||STORY.flags.ch5_empty||STORY.flags.ch5_small||STORY.flags.ch5_sky||STORY.flags.ch5_complete);const ch5N=ch5On?['ch5_empty','ch5_small','ch5_sky'].filter(k=>STORY.flags[k]).length:null;const ejN=STORY.flags.emoji_n?Math.min(3,STORY.flags.emoji_n):0;let html='<div class="bgBlock"><strong>Objetivo actual</strong><p>'+bgEsc(m.title)+'</p><p>'+bgEsc(m.clue)+'</p><div class="bgProgress"><i style="width:'+pct+'%"></i></div><p class="bgMuted">Fotografías recuperadas: '+n+' de '+PHOTOS.length+(ch4N!==null?' · Recuerdos del edificio: '+ch4N+' de '+CH4_FRAGMENTS.length:'')+(ch5N!==null?' · Poolrooms: '+ch5N+' de 3 recuerdos':'')+(ejN>0?' · Tableros: '+ejN+'/3':'')+'</p></div>';
 html+='<div class="bgBlock"><strong>Fotografías recuperadas</strong>';const found=PHOTOS.filter(p=>STORY.flags['photo_'+p.id]);html+=(found.length?'<div class="bgPhotoGrid">'+found.map(p=>'<article class="bgPhotoCard"><img src="'+bgEsc(p.img)+'" alt="'+bgEsc(p.title)+'"><span>'+bgEsc(p.title)+'</span></article>').join('')+'</div>':'<p class="bgMuted">Todavía no has recuperado ninguna fotografía.</p>')+'</div>';
 const pend=bgKnownPending();if(pend.length)html+='<div class="bgBlock"><strong>Pistas</strong>'+pend.map(p=>'<p><span class="bgMuted">'+bgEsc(p.zone)+'</span><br>'+bgEsc(p.clue)+'</p>').join('')+'<p class="bgMuted">La brújula apunta hacia una fotografía cuando entras en su zona cercana. El resto depende de ti.</p></div>';
 html+='<div class="bgBlock"><strong>Primeros pasos</strong><p>Explora sin prisa, a pie o en tu auto. Acércate a los objetos y pulsa E para interactuar. Las seis fotografías se encuentran en distintos puntos de la isla.</p></div><div class="bgBlock"><strong>Controles</strong><p>WASD · moverse o conducir · Shift · correr · Espacio · saltar<br>Ratón · mirar · E · interactuar o subir/bajar del auto · R · radio del auto<br>P · abrir visor de cámara / fotografiar (Mayús+P descarga PNG) · V · álbum y tus fotos<br>M · mapa (se revela al explorar) · J · diario y libreta<br>Brújula · señala la fotografía cuando entras en su zona cercana<br>N · sonido · U · sonidos de la naturaleza · O · estación · H · hora<br>F3 · herramientas privadas de desarrollo</p></div>';
 if(typeof ntbPagesHTML==="function")try{html+=ntbPagesHTML()}catch(e){typeof __bw==='function'&&__bw('26-guide-map#1',e)}
 if(typeof window.__boisFutureMonumentHTML==='function')try{html+=window.__boisFutureMonumentHTML()}catch(e){}
 if(typeof window.__boisFreeRoamHTML==='function')try{html+=window.__boisFreeRoamHTML()}catch(e){}
 if(typeof window.__boisFutureTimeHTML==='function')try{html+=window.__boisFutureTimeHTML()}catch(e){}
 if(typeof window.__boisBackupReminderHTML==='function')try{html+=window.__boisBackupReminderHTML()}catch(e){}
 el.innerHTML=html;
}
// ═══ v133 · Mapa remasterizado: terreno real (relieve, lago, mar, playas, senderos, construcciones), niebla de exploración,
// nombres de lugares, flecha del jugador con su orientación, rosa de los vientos y escala. ═══
const BGM={base:null,W:400,exp:new Uint8Array(2500),dirty:false,last:0,seeded:false,fog:null};
(function scheduleMapBase(delay){
 const run=()=>{
  if(BGM.base)return;
  if(document.hidden||(typeof CIN!=='undefined'&&CIN.on)||window.__boisWakeLock){scheduleMapBase(3500);return}
  try{BGM.base=bgBuildBase()}catch(e){}
 };
 setTimeout(()=>{
  if(BGM.base)return;
  if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:3000});
  else run();
 },delay);
})(5500);
try{const q=localStorage.getItem('bois_explored');if(q&&q.length===2500)for(let i=0;i<2500;i++)BGM.exp[i]=q.charCodeAt(i)===49?1:0}catch(e){typeof __bw==='function'&&__bw('26-guide-map#2',e)}
function bgExploreMark(x,z,r){let ch=false;const c=Math.ceil(r/20),ci=Math.floor((x+500)/20),cj=Math.floor((z+500)/20);for(let a=-c;a<=c;a++)for(let b=-c;b<=c;b++){const i=ci+a,j=cj+b;if(i<0||j<0||i>49||j>49)continue;const dx=(i+.5)*20-500-x,dz=(j+.5)*20-500-z;if(dx*dx+dz*dz<=r*r&&!BGM.exp[j*50+i]){BGM.exp[j*50+i]=1;ch=true}}if(ch)BGM.dirty=true}
function bgExplored(x,z){const i=Math.floor((x+500)/20),j=Math.floor((z+500)/20);return i>=0&&j>=0&&i<50&&j<50&&!!BGM.exp[j*50+i]}
function bgExploreTick(){if(!S.on)return;if(!BGM.seeded){BGM.seeded=true;if(!BGM.exp.some(v=>v))bgExploreMark(BEACH[0],BEACH[1],110)}bgExploreMark(S.x,S.z,75);const n=performance.now();if(BGM.dirty&&n-BGM.last>6000)bgFlushExplored()}
/* v181: volcado inmediato del mapa explorado (también al cerrar u ocultar la pestaña; antes se perdían hasta 6 s de exploración) */
function bgFlushExplored(){if(!BGM.dirty||window.__boisResetting)return;BGM.dirty=false;BGM.last=performance.now();try{localStorage.setItem('bois_explored',Array.from(BGM.exp,v=>v?'1':'0').join(''))}catch(e){typeof __bw==='function'&&__bw('26-guide-map#3',e)}}
window.__bgFlushExplored=bgFlushExplored;
function bgBuildBase(){
 const W=BGM.W,k=1000/W,c=document.createElement('canvas');c.width=c.height=W;const x=c.getContext('2d'),im=x.createImageData(W,W),d=im.data,H=new Float32Array(W*W);
 for(let j=0;j<W;j++)for(let i=0;i<W;i++)H[j*W+i]=hAt((i+.5)*k-500,(j+.5)*k-500);
 const tb=atob(TRAIL_MASK_B64),trail=(X,Z)=>{const ix=Math.max(0,Math.min(511,Math.round((500-X)*.511))),iy=Math.max(0,Math.min(511,Math.round((500-Z)*.511))),q=iy*512+ix;return(tb.charCodeAt(q>>3)&(1<<(q&7)))!==0};
 const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 for(let j=0;j<W;j++)for(let i=0;i<W;i++){
  const X=(i+.5)*k-500,Z=(j+.5)*k-500,h=H[j*W+i],o=(j*W+i)*4;
  const hx=H[j*W+Math.min(W-1,i+1)]-H[j*W+Math.max(0,i-1)],hz=H[Math.min(W-1,j+1)*W+i]-H[Math.max(0,j-1)*W+i];
  const sh=Math.max(-.35,Math.min(.35,(-hx-hz)*.07));let c3;
  if(h<WL){const t=Math.min(1,(WL-h)/8),lake=window.__inLake&&window.__inLake(X,Z);c3=lake?mix([66,128,156],[26,66,102],t):mix([70,118,152],[36,80,120],t)}
  else{
   if(h<3)c3=mix([222,208,158],[160,170,110],Math.max(0,(h-2.2)/.8));
   else{const g=Math.min(1,(h-3)/32);c3=mix([88,132,72],[126,142,98],g);if(h>38)c3=mix(c3,[146,138,124],Math.min(1,(h-38)/10))}
   if(h>=3&&trail(X,Z))c3=mix(c3,[184,152,104],.8);
   c3=c3.map(v=>v*(1+sh));
   const e=H[j*W+Math.min(W-1,i+2)]<WL||H[j*W+Math.max(0,i-2)]<WL||H[Math.min(W-1,j+2)*W+i]<WL||H[Math.max(0,j-2)*W+i]<WL;if(e)c3=mix(c3,[246,242,228],.55)}
  d[o]=c3[0];d[o+1]=c3[1];d[o+2]=c3[2];d[o+3]=255}
 x.putImageData(im,0,0);
 const P=v=>(v+500)/k;
 x.fillStyle='rgba(150,70,55,.95)';x.strokeStyle='rgba(60,25,20,.8)';x.lineWidth=.6;
 for(let v=0;v<NV;v++){if(wmRaw[v]<248)continue;const bx=P(pos[v*3]),bz=P(pos[v*3+2]);x.fillRect(bx-1.6,bz-1.6,3.4,3.4)}
 x.fillStyle='rgba(205,232,238,.95)';x.strokeStyle='#27414a';x.lineWidth=1.5;for(const t of[[-46.67,-24.97,-27.23,-6.53],[-10.09,11.61,-26.6,-5.9]]){x.fillRect(P(t[0]),P(t[2]),(t[1]-t[0])/k,(t[3]-t[2])/k);x.strokeRect(P(t[0]),P(t[2]),(t[1]-t[0])/k,(t[3]-t[2])/k)}
 x.strokeStyle='rgba(255,255,255,.07)';x.lineWidth=1;for(let g=100;g<1000;g+=100){x.beginPath();x.moveTo(g/k,0);x.lineTo(g/k,W);x.moveTo(0,g/k);x.lineTo(W,g/k);x.stroke()}
 return c}
function bgDrawMap(){const c=document.getElementById('bgMapCanvas');if(!c)return;const x=c.getContext('2d'),w=c.width;
 if(!BGM.base){try{BGM.base=bgBuildBase()}catch(e){console.warn('mapa',e)}}
 x.clearRect(0,0,w,w);if(BGM.base)x.drawImage(BGM.base,0,0,w,w);else{x.fillStyle='#142126';x.fillRect(0,0,w,w)}
 const px=v=>((v+500)/1000)*w,py=px;
 // niebla de exploración (suavizada al escalar)
 if(!BGM.fog){BGM.fog=document.createElement('canvas');BGM.fog.width=BGM.fog.height=50}
 {const f=BGM.fog.getContext('2d'),im=f.createImageData(50,50);for(let q=0;q<2500;q++){im.data[q*4]=14;im.data[q*4+1]=22;im.data[q*4+2]=27;im.data[q*4+3]=BGM.exp[q]?0:236}f.putImageData(im,0,0);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(BGM.fog,0,0,w,w)}
 // nombres de lugares: los fijos siempre; el resto cuando la zona ya fue explorada
 const sw=w/800,lab=(t,X,Z,always)=>{if(!always&&!bgExplored(X,Z))return;x.font=(15*sw*1.25)+'px Georgia';x.textAlign='center';x.lineWidth=4;x.strokeStyle='rgba(8,14,16,.85)';x.fillStyle='#f2e9cf';const hw=x.measureText(t).width/2+6,cx=Math.max(hw,Math.min(w-hw,px(X)));x.strokeText(t,cx,py(Z));x.fillText(t,cx,py(Z))};
 lab('Playa del regreso',BEACH[0],BEACH[1]+26,true);lab('Torres gemelas',-18,-34,true);lab('El lago',-125,110,false);lab('La cumbre',-176,-295,false);
 if(typeof arSpots!=='undefined'&&arSpots[0])lab('Parque de los Cisnes',arSpots[0].x,arSpots[0].z-14,false);
 if(STORY.flags.metKatherin&&window.__boisCh4Bounds&&(STORY.flags.ch4_entered||bgExplored(window.__boisCh4Bounds.cx,window.__boisCh4Bounds.cz))){const c4=window.__boisCh4Bounds;x.fillStyle='rgba(150,70,55,.95)';x.strokeStyle='rgba(60,25,20,.85)';x.lineWidth=1.2;const bw=28*w/1000,bd=24*w/1000;x.fillRect(px(c4.cx)-bw/2,py(c4.cz)-bd/2,bw,bd);x.strokeRect(px(c4.cx)-bw/2,py(c4.cz)-bd/2,bw,bd);lab('Edificio sin nombre',c4.cx,c4.cz-16,true)}
 x.textAlign='left';
 // zonas de pista (siempre visibles sobre la niebla) y fotografías recuperadas
 x.save();x.setLineDash([8,6]);x.lineWidth=2.4;for(const p of bgKnownPending()){const z=bgZone(p);x.strokeStyle='rgba(255,204,118,.95)';x.fillStyle='rgba(255,204,118,.14)';x.beginPath();x.arc(px(z.x),py(z.z),z.r*w/1000,0,Math.PI*2);x.fill();x.stroke();x.setLineDash([]);x.fillStyle='#ffd58a';x.font='bold 26px Georgia';x.textAlign='center';x.strokeStyle='rgba(8,14,16,.9)';x.lineWidth=4;x.strokeText('?',px(z.x),py(z.z)+9);x.fillText('?',px(z.x),py(z.z)+9);x.setLineDash([8,6])}x.restore();
 for(const p of PHOTOS){if(!STORY.flags['photo_'+p.id])continue;x.fillStyle='#8fd0b0';x.beginPath();x.arc(px(p.x),py(p.z),8,0,Math.PI*2);x.fill();x.strokeStyle='#fff';x.lineWidth=2.5;x.stroke();x.fillStyle='#14302a';x.fillRect(px(p.x)-3.5,py(p.z)-2.5,7,5)}
 if(BOIS_GUIDE.dev){for(const p of BOIS_GUIDE.points){x.fillStyle='#d2a36f';x.beginPath();x.rect(px(p.x)-5,py(p.z)-5,10,10);x.fill()}if(BOIS_GUIDE.showPhotoCoords){for(const p of PHOTOS){x.strokeStyle='#d2a36f';x.lineWidth=2;x.beginPath();x.arc(px(p.x),py(p.z),12,0,Math.PI*2);x.stroke()}}}
 // jugador: flecha con su orientación
 cam.getWorldDirection(_bgVd);const hd=Math.atan2(_bgVd.x,-_bgVd.z);
 x.save();x.translate(px(S.x),py(S.z));x.rotate(hd);x.fillStyle='#fff4d4';x.strokeStyle='#14211f';x.lineWidth=2.5;x.beginPath();x.moveTo(0,-15);x.lineTo(10,11);x.lineTo(0,5);x.lineTo(-10,11);x.closePath();x.fill();x.stroke();x.restore();
 // rosa de los vientos y escala (100 m)
 x.save();x.translate(w-46,46);x.strokeStyle='rgba(240,232,205,.85)';x.fillStyle='rgba(10,16,19,.6)';x.lineWidth=1.5;x.beginPath();x.arc(0,0,26,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#e4b66f';x.beginPath();x.moveTo(0,-22);x.lineTo(6,0);x.lineTo(-6,0);x.closePath();x.fill();x.fillStyle='#d7d8cb';x.beginPath();x.moveTo(0,22);x.lineTo(6,0);x.lineTo(-6,0);x.closePath();x.fill();x.font='bold 13px Georgia';x.textAlign='center';x.fillStyle='#f2e9cf';x.fillText('N',0,-31);x.restore();
 x.fillStyle='rgba(10,16,19,.6)';x.fillRect(14,w-34,w*.1+16,22);x.strokeStyle='#f2e9cf';x.lineWidth=2;x.beginPath();x.moveTo(22,w-16);x.lineTo(22,w-22);x.lineTo(22+w*.1,w-22);x.lineTo(22+w*.1,w-16);x.stroke();x.fillStyle='#f2e9cf';x.font='11px system-ui';x.fillText('100 m',26,w-26);
}
const _bgVd=new THREE.Vector3(),_bgViewDir=new THREE.Vector3();
function bgOpen(which){window.__boisGuideOverlayOpen=true;if(document.pointerLockElement)window.__boisGuideIgnoreNextUnlock=true;if(which==='journal'){bgRenderJournal();bgJournal.classList.add('open');BOIS_GUIDE.journal=true}else{bgDrawMap();bgMap.classList.add('open');BOIS_GUIDE.map=true}if(document.pointerLockElement)document.exitPointerLock()}
function bgClose(which){if(which==='journal'){bgJournal.classList.remove('open');BOIS_GUIDE.journal=false}else{bgMap.classList.remove('open');BOIS_GUIDE.map=false}window.__boisGuideOverlayOpen=BOIS_GUIDE.journal||BOIS_GUIDE.map;if(S.on&&!touch&&!window.__boisGuideOverlayOpen)document.getElementById('c').requestPointerLock?.()}
function bgUpdate(){const now=performance.now();if(now-BOIS_GUIDE.lastUI<450)return;BOIS_GUIDE.lastUI=now;if(!S.on){bgHud.classList.remove('on');bgCompass.classList.remove('on');return}try{bgExploreTick()}catch(e){typeof __bw==='function'&&__bw('26-guide-map#4',e)}const m=bgMission();document.getElementById('bgObjective').textContent=m.title;document.getElementById('bgClue').textContent=m.clue;bgHud.classList.add('on');const target=bgTarget();if(target){const dx=target.x-S.x,dz=target.z-S.z,dist=Math.hypot(dx,dz),bearing=Math.atan2(dx,-dz);cam.getWorldDirection(_bgViewDir);const heading=Math.atan2(_bgViewDir.x,-_bgViewDir.z);document.getElementById('bgRose').style.transform='rotate('+(-heading)+'rad)';let rel=bearing-heading;while(rel>Math.PI)rel-=Math.PI*2;while(rel<-Math.PI)rel+=Math.PI*2;document.getElementById('bgNeedle').style.transform='rotate('+rel+'rad)';document.getElementById('bgCompassTarget').textContent=target.name;document.getElementById('bgCompassInfo').textContent=bgDirection(dx,dz)+' · '+Math.round(dist)+' u';bgCompass.classList.add('on')}else bgCompass.classList.remove('on');const ae=document.activeElement,jBusy=!!window.__boisNtbEditing||(ae&&bgJournal.contains(ae)&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName));if(BOIS_GUIDE.journal&&!jBusy)bgRenderJournal();if(BOIS_GUIDE.map)bgDrawMap();if(BOIS_GUIDE.dev){document.getElementById('bgCoords').textContent='X: '+S.x.toFixed(1)+' · Y: '+S.y.toFixed(1)+' · Z: '+S.z.toFixed(1)+(S.fly?' · VUELO':'');document.getElementById('bgDevList').textContent=BOIS_GUIDE.points.map((p,i)=>(i+1)+'. '+p.name+' ['+p.x+', '+p.z+']').join('\n')||'Sin puntos guardados.'}}
let bgPromptEl=null;
function bgSavePoint(){
 if(bgPromptEl){bgPromptEl.querySelector('input').focus();return}
 window.__boisGuideOverlayOpen=true;if(document.pointerLockElement){window.__boisGuideIgnoreNextUnlock=true;document.exitPointerLock?.()}
 const box=document.createElement('div');box.style.cssText='margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.15);display:flex;gap:6px;flex-wrap:wrap;align-items:center';
 box.innerHTML='<input type="text" value="Nuevo recuerdo" maxlength="48" style="flex:1;min-width:140px;padding:5px 7px;background:rgba(255,255,255,.08);border:1px solid #ffffff40;color:#eee;font:11px system-ui"><button type="button" data-ok="1" style="margin:0">Guardar</button><button type="button" data-ok="0" style="margin:0">Cancelar</button>';
 bgDev.appendChild(box);bgPromptEl=box;
 const inp=box.querySelector('input');inp.focus();inp.select();
 const finish=save=>{box.remove();bgPromptEl=null;window.__boisGuideOverlayOpen=BOIS_GUIDE.journal||BOIS_GUIDE.map;
  if(save){const name=inp.value.trim();if(name){const p={name:name.slice(0,48),x:+S.x.toFixed(1),y:+S.y.toFixed(1),z:+S.z.toFixed(1),yaw:+S.yaw.toFixed(3),date:new Date().toISOString()};BOIS_GUIDE.points.push(p);try{localStorage.setItem('bois_dev_points',JSON.stringify(BOIS_GUIDE.points))}catch(e){typeof __bw==='function'&&__bw('26-guide-map#5',e)}bgUpdate();showMsg('Lugar guardado: '+p.name)}}
  if(S.on&&!touch&&!window.__boisGuideOverlayOpen)document.getElementById('c').requestPointerLock?.()};
 box.addEventListener('click',e=>{const b=e.target.closest('button');if(b)finish(b.dataset.ok==='1')});
 inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Enter'){e.preventDefault();finish(true)}else if(e.code==='Escape'){e.preventDefault();finish(false)}});
}
document.getElementById('bgSavePoint').addEventListener('click',bgSavePoint);
document.getElementById('bgShowPhotos').addEventListener('click',()=>{BOIS_GUIDE.showPhotoCoords=!BOIS_GUIDE.showPhotoCoords;document.getElementById('bgShowPhotos').textContent=BOIS_GUIDE.showPhotoCoords?'OCULTAR FOTOS · F5':'VER FOTOS · F5';bgDrawMap()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-close],[data-open]');if(!b)return;if(b.dataset.close)bgClose(b.dataset.close);if(b.dataset.open){bgJournal.classList.remove('open');BOIS_GUIDE.journal=false;bgOpen(b.dataset.open)}});
document.addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='F3'&&window.BOIS_DEV!==false){e.preventDefault();BOIS_GUIDE.dev=!BOIS_GUIDE.dev;bgDev.classList.toggle('on',BOIS_GUIDE.dev);if(BOIS_GUIDE.dev)showMsg('Herramientas privadas activadas · G activa el vuelo');else{if(S.fly){S.fly=false;S.vy=0}showMsg('Herramientas privadas ocultas')}}
 if(e.code==='F4'&&BOIS_GUIDE.dev){e.preventDefault();bgSavePoint()}
 if(e.code==='F5'&&BOIS_GUIDE.dev){e.preventDefault();BOIS_GUIDE.showPhotoCoords=!BOIS_GUIDE.showPhotoCoords;document.getElementById('bgShowPhotos').textContent=BOIS_GUIDE.showPhotoCoords?'OCULTAR FOTOS · F5':'VER FOTOS · F5';bgDrawMap()}
 if(!S.on||CIN.on)return;if(e.code==='KeyG'&&BOIS_GUIDE.dev&&!PR.on&&!(window.__boisCh6&&window.__boisCh6.on)){e.preventDefault();S.fly=!S.fly;S.sw=false;S.vy=0;showMsg(S.fly?'✈ Vuelo de desarrollador activado · Espacio sube · C baja':'Vuelo de desarrollador desactivado')}if(e.code==='KeyO'){e.preventDefault();WX.season()}if(e.code==='KeyH'){e.preventDefault();todCycle()}if(e.code==='KeyJ'){e.preventDefault();if(BOIS_GUIDE.journal)bgClose('journal');else bgOpen('journal')}
 if(e.code==='KeyM'){e.preventDefault();if(BOIS_GUIDE.map)bgClose('map');else bgOpen('map')}
 if(e.code==='Escape'){if(BOIS_GUIDE.journal)bgClose('journal');if(BOIS_GUIDE.map)bgClose('map')}});

