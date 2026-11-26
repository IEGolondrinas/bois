/* BOIS.IO · 36c-chapter5.js — Capítulo V Remastered · Lo que permanece debajo (Poolrooms)
   Requiere: capítulo IV completado (ch4_complete) y bucear hasta los Poolrooms.
   Flujo: llegada → tres salas extrañas (vacía, piscina pequeña, cielo reflejado) → mesa con la fotografía → Katherin.
   Banderas guardadas: ch5_entered, ch5_empty, ch5_small, ch5_sky, ch5_photo, ch5_complete. */
try{(()=>{
 const FL=()=>STORY.flags,active=()=>!!FL().ch4_complete&&!FL().ch5_complete;
 const hs=(a,b)=>{const s=Math.sin(a*127.1+b*311.7+7.7)*43758.5453;return s-Math.floor(s)};
 const C5={pts:[],built:false,cbAdded:false,tx:0,tz:0,near:'',markers:[],rings:[],roomProps:[],buoy:null,skyDisc:null,tg:null,lampGlow:null,shaft:null,kat:null,enterTimer:0};
 const cine=(lines,cb,opts)=>{const loc=cinBox.querySelector('.cin-location'),old=loc?loc.textContent:'';if(loc)loc.textContent='CAPÍTULO V · BAJO EL LAGO';
  playCinematic(lines,()=>{if(loc)loc.textContent=old||'PARQUE DE LOS CISNES';if(cb)cb()},opts||{})};
 const ROOMS=['ch5_empty','ch5_small','ch5_sky'],roomsN=()=>ROOMS.filter(f=>FL()[f]).length;
 const roomsDone=()=>roomsN()===3;
 // ---------- v152 · sonido del capítulo (acentos MUY suaves; el ambiente de fondo vive en 18-poolrooms.js) ----------
 const SV=.03;
 const sting=(freqs,vol,dur,gap)=>{try{const C=AU.ctx;if(!C||!AU.on||!PR.on)return;const t0=C.currentTime;freqs.forEach((f,i)=>{const o=C.createOscillator(),g=C.createGain(),lp=C.createBiquadFilter(),t=t0+i*(gap||.2);
   o.type='sine';o.frequency.value=f;lp.type='lowpass';lp.frequency.value=1800;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
   o.connect(lp);lp.connect(g);g.connect(C.destination);o.onended=()=>{try{o.disconnect();lp.disconnect();g.disconnect()}catch(e){typeof __bw==='function'&&__bw('36c-chapter5#1',e)}};o.start(t);o.stop(t+dur+.1)})}catch(e){typeof __bw==='function'&&__bw('36c-chapter5#2',e)}};
 // señal de la luz activa más cercana: batido lento que crece al acercarte; se apaga sola al salir
 const BC={n:null,offTimer:0};
 function beaconSnd(d){const C=AU.ctx;if(!C)return;const want=AU.on&&PR.on&&S.on&&!CIN.on&&!window.__boisGuideOverlayOpen&&!window.__boisEmojiOpen&&!document.hidden&&isFinite(d)&&d<28?SV*.7*Math.pow(1-d/28,2):0;
  if(!BC.n){if(want<.0005)return;if(BC.offTimer){clearTimeout(BC.offTimer);BC.offTimer=0}const g=C.createGain(),lp=C.createBiquadFilter(),os=[392,394.2,588].map(f=>{const o=C.createOscillator();o.type='sine';o.frequency.value=f;o.connect(lp);o.start();return o});
   g.gain.value=0;lp.type='lowpass';lp.frequency.value=1100;lp.connect(g);g.connect(C.destination);BC.n={g,lp,os}}
  BC.n.g.gain.setTargetAtTime(want,C.currentTime,.35)}
 function beaconOff(){const n=BC.n,C=AU.ctx;if(!n||!C)return;BC.n=null;n.g.gain.setTargetAtTime(0,C.currentTime,.2);if(BC.offTimer)clearTimeout(BC.offTimer);BC.offTimer=setTimeout(()=>{BC.offTimer=0;try{n.os.forEach(o=>o.stop());n.g.disconnect();n.lp.disconnect()}catch(e){typeof __bw==='function'&&__bw('36c-chapter5#3',e)}},900)}
 // ---------- elección de salas según la arquitectura generada ----------
 function pickCells(){const g=PR.geo,L=[];
  for(let i=0;i<g.N;i++)for(let j=0;j<g.N;j++){if((i===5&&j===5)||(i===5&&j===4))continue;L.push({i,j,k:g.ty(i,j),d:Math.max(Math.abs(i-5),Math.abs(j-5))*100+Math.hypot(i-5,j-5)})}
  L.sort((a,b)=>a.d-b.d);const used=new Set();
  const pick=(...ps)=>{for(const f of ps){const c=L.find(c=>!used.has(c)&&f(c));if(c){used.add(c);return c}}const c=L.find(c=>!used.has(c));used.add(c);return c};
  const sky=c=>c.k===3&&hs(c.i+11,c.j+17)>.75;
  return{empty:pick(c=>c.k===0&&!(hs(c.i+11,c.j+17)>.75)),small:pick(c=>c.k===1,c=>c.k===2),sky:pick(sky,c=>c.k===3),table:pick(c=>c.k===0&&c.d>=200,c=>c.k===0)}}
 window.__boisCh5Pts=C5.pts;
 const OFF=[[0,0],[2.6,0],[-2.6,0],[0,2.6],[0,-2.6],[3.8,3.8],[-3.8,3.8],[3.8,-3.8],[-3.8,-3.8],[6,0],[-6,0],[0,6],[0,-6]];
 function centre(c){const g=PR.geo,x=g.O+c.i*g.CW+g.CW/2,z=g.O+c.j*g.CW+g.CW/2;for(const o of OFF)if(!g.hit(x+o[0],z+o[1]))return{x:x+o[0],z:z+o[1]};return{x,z}}
 // ---------- fotografía: Katherin y tú, en el salón (foto restaurada) ----------
 const PHOTO_DATA=BOIS_CH5_PHOTO;
 let PHOTO_IMG=null,PHOTO_CANVAS=null,PHOTO_TEX=null;
 function photoCanvas(){
  if(PHOTO_CANVAS)return PHOTO_CANVAS;
  const w=480,h=360,c=document.createElement('canvas');c.width=w;c.height=h;PHOTO_CANVAS=c;
  const x=c.getContext('2d');x.fillStyle='#efe6d2';x.fillRect(0,0,w,h);
  x.fillStyle='#b8a58e';x.fillRect(18,18,w-36,h-36);
  PHOTO_IMG=new Image();
  PHOTO_IMG.onload=()=>{x.clearRect(0,0,w,h);x.drawImage(PHOTO_IMG,0,0,w,h);if(PHOTO_TEX)PHOTO_TEX.needsUpdate=true};
  PHOTO_IMG.src=PHOTO_DATA;
  return c;
 }
 function ensureKat(){
  if(C5.kat||!PR.scene||!window.__katherin)return;
  const k=window.__katherin.clone(true),rm=[];
  k.traverse(o=>{if(o!==k&&o.userData&&o.userData.isBenchBook)rm.push(o)});
  for(const o of rm)o.parent&&o.parent.remove(o);
  const bm=new THREE.MeshStandardMaterial({color:0xf1f5f6,roughness:.38,metalness:.06}),lgm=new THREE.MeshStandardMaterial({color:0x4b585c,roughness:.5,metalness:.3});
  const bench=new THREE.Mesh(new THREE.BoxGeometry(1.16,.12,.48),bm);bench.position.set(0,.48,0);k.add(bench);
  const legGeo=new THREE.BoxGeometry(.08,.44,.42);
  for(const sx of[-.48,.48]){const l=new THREE.Mesh(legGeo,lgm);l.position.set(sx,.22,0);k.add(l)}
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.76,16),new THREE.MeshBasicMaterial({color:0x050b0d,transparent:true,opacity:.32,depthWrite:false}));
  sh.rotation.x=-Math.PI/2;sh.position.set(0,.012,.14);k.add(sh);
  k.visible=false;PR.scene.add(k);C5.kat=k;
 }
 // ---------- construcción de la escena (una sola vez, durante precarga) ----------
 function build(){if(C5.built||!PR.geo||!PR.scene)return;C5.built=true;
  const g=PR.geo,sc=PR.scene,cells=pickCells(),def=[['empty','ch5_empty','Sala vacía'],['small','ch5_small','Piscina diminuta'],['sky','ch5_sky','Reflejo extraño']];
  // geometrías y materiales compartidos para los 3 marcadores azules
  const ad={transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false};
  const mCoreGeo=new THREE.OctahedronGeometry(.32),mHaloGeo=new THREE.SphereGeometry(.86,14,10),mBeamGeo=new THREE.CylinderGeometry(.22,.22,g.WH,12,1,true),mRingGeo=new THREE.RingGeometry(.48,.66,24);
  const mCoreMat=new THREE.MeshBasicMaterial({color:0xe8fcff,fog:false}),mHaloMat=new THREE.MeshBasicMaterial(Object.assign({color:0x7fd8ff,opacity:.22},ad)),mBeamMat=new THREE.MeshBasicMaterial(Object.assign({color:0x7fd8ff,opacity:.2,side:THREE.DoubleSide},ad)),mRingMat=new THREE.MeshBasicMaterial(Object.assign({color:0xa8ebff,opacity:.38,side:THREE.DoubleSide},ad));
  for(const[k,flag,name]of def){
   const p=centre(cells[k]),fy=g.fyAt(p.x,p.z),gr=new THREE.Group();
   gr.add(new THREE.Mesh(mCoreGeo,mCoreMat),new THREE.Mesh(mHaloGeo,mHaloMat));
   const bm=new THREE.Mesh(mBeamGeo,mBeamMat);bm.position.y=-1.4+g.WH*.5;gr.add(bm);
   const rg=new THREE.Mesh(mRingGeo,mRingMat);rg.rotation.x=-Math.PI/2;rg.position.y=-1.34;gr.add(rg);C5.rings.push(rg);
   gr.position.set(p.x,fy+1.4,p.z);gr.userData={y0:fy+1.4,ph:Math.random()*6,flag};
   sc.add(gr);C5.markers.push(gr);C5.pts.push({id:k,flag,name,x:p.x,z:p.z,m:gr,run:()=>room(k)});
  }
  // detalles ambientales sutiles en las 3 salas extrañas
  {const ep=centre(cells.empty),efy=g.fyAt(ep.x,ep.z),es=new THREE.Mesh(new THREE.CircleGeometry(2.1,24),new THREE.MeshBasicMaterial({color:0x9bdde8,transparent:true,opacity:.09,blending:THREE.AdditiveBlending,depthWrite:false}));
   es.rotation.x=-Math.PI/2;es.position.set(ep.x,efy+.012,ep.z);sc.add(es);C5.roomProps.push(es)}
  {const cx=g.O+cells.small.i*g.CW+g.CW*.5,cz=g.O+cells.small.j*g.CW+g.CW*.5,wy=g.PY-.43;
   const buoy=new THREE.Mesh(new THREE.TorusGeometry(.42,.11,10,22),new THREE.MeshStandardMaterial({color:0x96d2e4,roughness:.35,metalness:.05}));
   buoy.rotation.x=Math.PI/2;buoy.position.set(cx,wy,cz);buoy.userData.y0=wy;sc.add(buoy);C5.buoy=buoy;C5.roomProps.push(buoy)}
  {const sp=centre(cells.sky),cx=g.O+cells.sky.i*g.CW+g.CW*.5,cz=g.O+cells.sky.j*g.CW+g.CW*.5,wy=g.PY-.435;
   const sg=new THREE.Group(),d1=new THREE.Mesh(new THREE.CircleGeometry(2.6,24),new THREE.MeshBasicMaterial({color:0xffbe82,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false})),d2=new THREE.Mesh(new THREE.RingGeometry(1.4,2.8,24),new THREE.MeshBasicMaterial({color:0xff9666,transparent:true,opacity:.09,blending:THREE.AdditiveBlending,depthWrite:false}));
   d1.rotation.x=-Math.PI/2;d2.rotation.x=-Math.PI/2;d2.position.y=.005;sg.add(d1,d2);sg.position.set(cells.sky.k===3?cx:sp.x,wy,cells.sky.k===3?cz:sp.z);sc.add(sg);C5.skyDisc=sg;C5.roomProps.push(sg)}
  // mesa con la fotografía, sillas con cojines, lámpara cálida y sombra de contacto
  const t=centre(cells.table),fy=g.fyAt(t.x,t.z),tg=new THREE.Group();tg.position.set(t.x,fy,t.z);C5.tx=t.x;C5.tz=t.z;C5.tg=tg;
  const wood=new THREE.MeshStandardMaterial({color:0x6b4a2f,roughness:.82}),cush=new THREE.MeshStandardMaterial({color:0x2b3c42,roughness:.9}),brass=new THREE.MeshStandardMaterial({color:0xc9a35b,roughness:.32,metalness:.75}),shadeMat=new THREE.MeshStandardMaterial({color:0xffe6b3,emissive:0xffc978,emissiveIntensity:.75,roughness:.4});
  const bx=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat||wood);m.position.set(x,y,z);tg.add(m);return m};
  bx(2.2,.08,1.1,0,.82,0);for(const sx of[-1,1])for(const sz of[-1,1])bx(.08,.8,.08,sx*1.02,.4,sz*.47);
  for(const cx of[-.55,.55]){bx(.5,.06,.5,cx,.46,1.15);bx(.44,.04,.44,cx,.50,1.15,cush);bx(.5,.5,.05,cx,.74,1.4);bx(.06,.44,.06,cx-.2,.22,1.3);bx(.06,.44,.06,cx+.2,.22,1.3)}
  const tsh=new THREE.Mesh(new THREE.CircleGeometry(1.55,20),new THREE.MeshBasicMaterial({color:0x050b0d,transparent:true,opacity:.28,depthWrite:false}));tsh.rotation.x=-Math.PI/2;tsh.position.set(0,.01,.28);tg.add(tsh);
  // pequeña lámpara de mesa en la esquina derecha
  const lb=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,.04,14),brass);lb.position.set(.74,.88,-.24);
  const ls=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,.28,10),brass);ls.position.set(.74,1.02,-.24);
  const lsh=new THREE.Mesh(new THREE.CylinderGeometry(.1,.17,.16,14,1,true),shadeMat);lsh.position.set(.74,1.16,-.24);
  tg.add(lb,ls,lsh);
  // marco polaroid y fotografía restaurada
  const tex=new THREE.CanvasTexture(photoCanvas());tex.encoding=THREE.sRGBEncoding;PHOTO_TEX=tex;
  const frame=new THREE.Mesh(new THREE.BoxGeometry(.56,.014,.44),new THREE.MeshStandardMaterial({color:0xf0e7d6,roughness:.75}));frame.rotation.y=.18;frame.position.set(0,.864,.05);tg.add(frame);
  const ph=new THREE.Mesh(new THREE.PlaneGeometry(.49,.365),new THREE.MeshBasicMaterial({map:tex}));ph.rotation.set(-Math.PI/2,0,.18);ph.position.set(0,.873,.05);tg.add(ph);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.05),new THREE.MeshBasicMaterial({color:0xffe3a8,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));gl.rotation.x=-Math.PI/2;gl.position.set(.12,.862,.02);tg.add(gl);C5.lampGlow=gl;
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,g.WH-.4,16,1,true),new THREE.MeshBasicMaterial({color:0xffd998,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));sh.position.set(0,(g.WH-.4)/2,0);tg.add(sh);C5.shaft=sh;
  sc.add(tg);
  ensureKat();
  C5.pts.push({id:'table',flag:'ch5_complete',name:'Mesa',x:t.x,z:t.z,fy,run:()=>table(t,fy)});refresh()}
 window.__boisCh5Preload=()=>{try{build();refresh();return !!C5.built}catch(e){typeof __bw==='function'&&__bw('36c-chapter5#preload',e);return false}};
 function refresh(fade){
  const unlocked=!!FL().ch4_complete,open=roomsDone();
  if(C5.tg)C5.tg.visible=unlocked;
  for(const o of C5.roomProps)if(o)o.visible=unlocked;
  if(unlocked&&!C5.cbAdded&&PR.geo){C5.cbAdded=true;PR.geo.CB.push([C5.tx-1.15,C5.tx+1.15,C5.tz-.6,C5.tz+.6])}
  for(const p of C5.pts)if(p.m){const done=!unlocked||!!FL()[p.flag];
   if(done&&fade&&p.m.visible&&!p.m.userData.fade)p.m.userData.fade=1;
   else if(!p.m.userData.fade){p.m.visible=!done;p.m.scale.setScalar(1)}}
  if(C5.shaft)C5.shaft.visible=unlocked&&open&&!FL().ch5_complete;
  if(C5.lampGlow)C5.lampGlow.visible=unlocked&&(open||!!FL().ch5_complete);
  if(C5.kat&&!unlocked)C5.kat.visible=false}
 // ---------- escenas ----------
 const TXT={
  empty:[{t:'Una habitación completamente vacía.'},{pause:1600},{t:'Ni un objeto. Ni una marca en las paredes. Solo el silencio de dos personas que no saben cómo empezar a hablar.'},{pause:2300},{who:'Tú',t:'A veces me quedaba tan callado para no incomodar… que desaparecía del cuarto.'},{pause:2400}],
  small:[{t:'Una piscina demasiado pequeña para el tamaño de la sala.'},{pause:1800},{t:'Alrededor sobra espacio, como cuando encoges los hombros o miras al suelo creyendo que no eres suficiente.'},{pause:2400},{who:'Tú',t:'Siempre pensé que valía solo si hacía algo perfecto.'},{pause:2400}],
  sky:[{t:'El agua refleja un cielo que no existe.'},{pause:1800},{t:'Nubes lentas, una luz cálida. Levantas la vista y solo hay baldosas.'},{pause:2300},{who:'Tú',t:'A veces confundía lo que imaginaba por dentro con lo que de verdad estaba pasando afuera.'},{pause:2500}]};
 function room(k){const p=C5.pts.find(p=>p.id===k);
  cine(TXT[k],()=>{storyFlag(p.flag,1);refresh(true);const n=roomsN();
   if(roomsDone()){sting([262,330,392,523],SV*1.1,3.2,.32);showMsg('Recuerdo 3/3 · al fondo se enciende una luz cálida · busca la mesa')}
   else{sting([392,587],SV,2.2,.28);showMsg('Recuerdo '+n+'/3 · algo se movió en el agua… aún hay luces azules')}},{lookAt:new THREE.Vector3(p.x,PR.geo.fyAt(p.x,p.z)+1.2,p.z)})}
 function table(t,fy){
  window.__boisRevealPhoto={img:PHOTO_DATA,title:'Cátedra de Paz · Cinco palabras en tu cuaderno',layers:{stamp:'29 / 10 / 2025 · 14:48 · 9 y 9',fact:'Actividad «Sé algo bueno de ti». Te cambiaste de subgrupo para quedar 9 y 9. Katherin escribió cinco palabras en tu cuaderno.',thought2025:'Me sudaron frío las axilas y fingí calma para no parecer raro. Pensé que valía solo por mi 382 y que ella me vería insuficiente.',insight2026:'Por primera vez alguien nombró «linda persona, reservado, amable y enfocado» antes que tus notas. Tu valor no dependía de un logro.'}};
  sting([220,330],SV,3.6,.5);
  cine([{pause:900},{t:'Una mesa. Sobre ella, iluminada por la lámpara, la hoja de un cuaderno.'},{pause:1900},{t:'29 de octubre de 2025. Cátedra de Paz: «Sé algo bueno de ti».'},{pause:2300},{t:'Dieciocho compañeros divididos en dos grupos de nueve. Tú mismo te pasaste al otro grupo para que quedaran pares.'},{pause:2500},
   {t:'Habías escrito de ti mismo: «bueno para las matemáticas, muy analítico, hiper-empático».'},{pause:2400},{t:'Pero alguien más escribió cinco palabras que no eran solo un promedio ni un puntaje del ICFES:'},{pause:2200},
   {t:'«Lo mejor de ti es que eres muy inteligente, linda persona, reservado, amable y enfocado.»'},{pause:3600},
   {type:'layer',layer:'pensaste',t:'A las 14:53 te temblaban las piernas y sudabas frío, fingiendo que no te importaba para que no se notara el nudo en el pecho.'},{pause:2800},
   {type: 'layer',layer:'hoy',t:'Y al mismo tiempo, el resto del salón te daba las gracias: «Oye Toro, gracias por la mezcla y por prestar tu computador».'},{pause:2800},
   {who:'Tú',t:'Quizá las personas también veían quién era yo… incluso cuando yo no hacía nada excepcional.'},{pause:3000}],
   ()=>{storyFlag('ch5_photo',1);katherin(t,fy)},{lookAt:new THREE.Vector3(t.x,fy+.85,t.z)})}
 function katherin(t,fy){
  ensureKat();
  let look=new THREE.Vector3(S.x,fy+1.5,S.z);
  if(C5.kat){const k=C5.kat;let kx=S.x+Math.sin(S.yaw)*3.2,kz=S.z+Math.cos(S.yaw)*3.2,found=false;
   for(const d of [3.2,2.6,3.8,2.1]){for(const da of [0,.6,-.6,1.2,-1.2]){const qx=S.x+Math.sin(S.yaw+da)*d,qz=S.z+Math.cos(S.yaw+da)*d;if(!PR.geo.hit(qx,qz)&&(Math.abs(qx-t.x)>1.5||Math.abs(qz-t.z)>1.0)&&PR.geo.fyAt(qx,qz)>=-0.35){kx=qx;kz=qz;found=true;break}}if(found)break}
   k.position.set(kx,PR.geo.fyAt(kx,kz),kz);k.rotation.set(0,Math.atan2(S.x-kx,S.z-kz),0);k.visible=true;look=new THREE.Vector3(kx,k.position.y+1.5,kz)}
  sting([294],SV*.8,3,0);
  cine([{pause:700},{t:'Un paso suave suena detrás de ti sobre las baldosas húmedas.'},{pause:1600},{who:'Katherin',t:'¿Te acuerdas de esa clase?'},{pause:1700},{t:'Te giras. No hay enigmas en su rostro; solo la calma tranquila de siempre.'},{pause:1600},{who:'Tú',t:'Por fuera me quedé quieto. Por dentro sentía que mi cuerpo no podía sostener lo que estaba sintiendo.'},{pause:2400},{t:'Katherin mira la hoja sobre la mesa.'},{pause:1500},{who:'Katherin',t:'Yo solo escribí lo que veía en ti ese día.'},{pause:2200},
   {type:'layer',layer:'hoy',t:'Tal vez nunca sepas todo lo que pasaba por su cabeza cuando escribió esas líneas.'},{pause:2400},{who:'Tú',t:'Pero sí sé cuánto significó para mí. Y eso ya es suficiente.'},{pause:2800}],
   ()=>{if(C5.kat)C5.kat.visible=false;storyFlag('ch5_complete',1);refresh(true);sting([196,294,392],SV,4,.45);showMsg('Capítulo V completado · Lo que permanece debajo · Retroceso para salir')},{lookAt:look})}
 // ---------- interacción, pistas y actualización sincronizada con PR.step ----------
 const nearPt=()=>{let b=null,bd=3.2;for(const p of C5.pts){if(FL()[p.flag]||(p.id==='table'&&!roomsDone()))continue;const d=Math.hypot(S.x-p.x,S.z-p.z);if(d<bd){bd=d;b=p}}return b};
 addEventListener('keydown',e=>{if(e.code!=='KeyE'||e.repeat||!PR.on||!S.on||CIN.on||window.__boisGuideOverlayOpen||window.__boisEmojiOpen||!active())return;const p=nearPt();if(p){e.preventDefault();e.stopPropagation();p.run()}},true);
 let hintAt=0,hintAccum=0,bcAccum=0,ch5Time=0;
 const dirTxt=(dx,dz)=>{const sn=Math.sin(S.yaw),cs=Math.cos(S.yaw),a=Math.atan2(dx*cs-dz*sn,-dx*sn-dz*cs),A=Math.abs(a);return A<.785?'al frente':A>2.356?'detrás de ti':a>0?'a tu derecha':'a tu izquierda'};
 const nearestAct=()=>{let b=null,bd=1e9;for(const p of C5.pts){if(FL()[p.flag]||(p.id==='table'&&!roomsDone()))continue;const d=Math.hypot(S.x-p.x,S.z-p.z);if(d<bd){bd=d;b=p}}return b};
 function ch5Tick(dt){
  if(!PR.on||!C5.built)return;
  ch5Time+=dt;
  for(let i=0;i<C5.markers.length;i++){const m=C5.markers[i];if(!m.visible)continue;m.rotation.y=ch5Time*1.2;m.position.y=m.userData.y0+Math.sin(ch5Time*1.6+m.userData.ph)*.12;
   const rg=C5.rings[i];if(rg){const p=1+.14*Math.sin(ch5Time*2.1+m.userData.ph);rg.scale.set(p,p,1)}
   if(m.userData.fade>0){m.userData.fade-=dt;const k=Math.max(0,m.userData.fade);m.scale.setScalar(.2+.8*k);if(k<=0){m.visible=false;m.userData.fade=0;m.scale.setScalar(1)}}}
  if(C5.shaft&&C5.shaft.visible)C5.shaft.material.opacity=.07+.025*Math.sin(ch5Time*1.1);
  if(C5.buoy&&C5.buoy.visible)C5.buoy.position.y=C5.buoy.userData.y0+Math.sin(ch5Time*1.4)*.025;
  if(C5.skyDisc&&C5.skyDisc.visible)C5.skyDisc.rotation.y=ch5Time*.08;
  bcAccum+=dt;if(bcAccum>=.15){bcAccum=0;const a=active()?nearestAct():null;beaconSnd(a?Math.hypot(a.x-S.x,a.z-S.z):Infinity)}
  hintAccum+=dt;if(hintAccum>=.25){hintAccum=0;
   if(!S.on||CIN.on||window.__boisGuideOverlayOpen||window.__boisEmojiOpen||!active())return;
   const p=nearPt();
   if(!p&&performance.now()>hintAt){hintAt=performance.now()+14000;const t=nearestAct();if(t)showMsg((t.id==='table'?'Luz cálida de la mesa':'Luz azul más cercana ('+roomsN()+'/3)')+': '+Math.round(Math.hypot(t.x-S.x,t.z-S.z))+' m, '+dirTxt(t.x-S.x,t.z-S.z))}
   if(p&&C5.near!==p.id){C5.near=p.id;showMsg(p.id==='table'?'Una mesa · E: acercarte':p.name+' · E: examinar')}else if(!p)C5.near=''}
 }
 if(typeof PR!=='undefined'&&PR){
  const _step=PR.step;PR.step=function(dt){_step.apply(this,arguments);ch5Tick(dt)};
 }
 window.__boisCh5Exit=()=>{if(C5.enterTimer){clearTimeout(C5.enterTimer);C5.enterTimer=0}C5.near='';if(C5.kat)C5.kat.visible=false;beaconOff()};
 // ---------- entrada a los Poolrooms ----------
 const _en=PR.enter;PR.enter=function(){const was=PR.on;_en.apply(this,arguments);if(was||!PR.on)return;
  try{hintAt=performance.now()+7000;C5.near='';build();ensureKat();refresh();
   if(C5.enterTimer){clearTimeout(C5.enterTimer);C5.enterTimer=0}
   if(active()&&!FL().ch5_entered)C5.enterTimer=setTimeout(()=>{C5.enterTimer=0;if(!PR.on||!S.on||CIN.on||FL().ch5_entered)return;
    cine([{pause:600},{t:'Al salir del agua, el aire huele a cloro y a humedad antigua.'},{pause:2000},{t:'Piscinas de distintas profundidades. Pasillos con arcos curvos. Pilares cilíndricos. Escaleras que no conducen a ninguna parte.'},{pause:2600},
     {t:'No hay ventanas. No hay relojes. No hay animales.'},{pause:1800},{t:'Solo agua, luces fluorescentes y el eco de tus propios movimientos.'},{pause:2400},{t:'El lugar parece no tener límites.'},{pause:2200},
     {who:'Tú',t:'Todo esto estaba aquí abajo… esperando.'},{pause:2400}],()=>{storyFlag('ch5_entered',1);showMsg('Capítulo V · Busca luces azules flotando · E: examinar')},{})},1700)}catch(e){console.warn('Capítulo V:',e)}};
 // ---------- misión y brújula ----------
 let lk=null;const lakePt=()=>{if(lk)return lk;let b=1e9,bx=0,bz=0;for(let x=-480;x<=480;x+=16)for(let z=-480;z<=480;z+=16){const h=hAt(x,z);if(h<b){b=h;bx=x;bz=z}}return lk={x:bx,z:bz}};
 const oM=bgMission;bgMission=function(){const f=FL();
  if(f.ch5_complete)return{title:'Capítulo V completado · Lo que permanece debajo',clue:PR.on?'Has recordado algo concreto. Sal de los Poolrooms (Retroceso): las torres gemelas te esperan en el centro de la isla.':'Has recordado algo concreto. Las torres gemelas te esperan en el centro de la isla.'};
  if(f.ch4_complete)return{title:'Capítulo V · Lo que permanece debajo',clue:PR.on?(roomsDone()?'Una luz cálida se ve al fondo. Busca la mesa.':'Explora las salas. Busca las luces azules flotando.'):'Hay una abertura bajo el lago. Sumérgete hasta el fondo.'};
  return oM()};
 const oT=bgTarget;bgTarget=function(){if(FL().ch4_complete&&!FL().ch5_complete){if(!PR.on){const p=lakePt();return{name:'Lago · abertura sumergida',x:p.x,z:p.z}}if(C5.built){const t=nearestAct();if(t)return{name:t.id==='table'?'Mesa con fotografía':t.name,x:t.x,z:t.z}}}return oT()};
 // Atajos de prueba: solo con ?dev o bois_dev=1
 if(window.BOIS_DEV){
 window.__boisCh5Unlock=()=>{storyFlag('ch4_complete',1);build();ensureKat();refresh();console.log('Capítulo IV marcado como completado. Si no estás en los Poolrooms, sumérgete en el lago; si ya estás, las luces aparecen ahora.')};
 window.__boisCh5Reset=()=>{for(const k of['ch5_entered','ch5_empty','ch5_small','ch5_sky','ch5_photo','ch5_complete'])delete STORY.flags[k];saveStory();for(const m of C5.markers)m.userData.fade=0;if(C5.kat)C5.kat.visible=false;refresh();console.log('Capítulo V reiniciado.')};
 }
})()}catch(__ch5Err){console.error('Capítulo V no pudo inicializarse; se conserva el juego base:',__ch5Err)}
