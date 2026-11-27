/* BOIS.IO · 36h-night-train.js — SECRETO: el tren de medianoche (solo en diciembre, de noche)
   No forma parte de la historia: sin misión, sin brújula, sin libreta, sin pistas. Si lo encuentras, es tuyo.
   - Solo existe en diciembre (fecha real) y al anochecer/de noche. En cualquier otro momento no hace nada ni consume nada.
   - La vía se construye la primera vez que hace falta, sobre tierra firme y cerca de donde estés, con farolillos cálidos.
   - Cada 1,5–3 min de noche pasa un tren (locomotora + 4 vagones iluminados) con humo, silbato y traqueteo.
   Pruebas desde la consola: __boisTren() lo lanza ya (aunque no sea diciembre ni de noche) · __boisTren('ruta') rehace la vía
   junto a ti · __boisTren(false) lo detiene y oculta. Ajustes en TRN (abajo). */
try{(()=>{
 const TRN={scale:1.6,speed:20,cars:4,minWait:90,maxWait:180,firstWait:20,dark:.45};
 const K=TRN.scale,STEP=2,rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),inM=(x,z)=>Math.abs(x)<465&&Math.abs(z)<465;
 const isDec=()=>{try{return new Date().getMonth()===11}catch(e){return false}};
 let forced=false,warned=false,last=0;
 let G=null,P=null,L=0,N=0,train=null,smoke=null;
 const ST={mode:'wait',wait:TRN.firstWait,s:0,dir:1,told:false,w1:false,w2:false,chug:0,puff:0};

 // ---------- ruta: tramo recto de tierra firme, suave y largo, cerca del jugador ----------
 function findRoute(){
  const badSpot=(x,z)=>{
   if(typeof arNB==='function'&&arNB(x,z))return true;
   if(typeof arSpots!=='undefined'&&arSpots.some(q=>Math.hypot(q.x-x,q.z-z)<16))return true;
   const c4=window.__boisCh4Bounds;
   if(c4&&Math.abs(x-c4.cx)<=c4.hx+4&&Math.abs(z-c4.cz)<=c4.hz+4)return true;
   return false;
  };
  let best=null;
  for(let n=0;n<600;n++){
   const wide=n>=350,cx=wide?rnd(-380,380):clamp(S.x+rnd(-220,220),-380,380),cz=wide?rnd(-380,380):clamp(S.z+rnd(-220,220),-380,380);
   if(hAt(cx,cz)<WL+.8||badSpot(cx,cz))continue;
   const a=rnd(0,6.283),ux=Math.cos(a),uz=Math.sin(a);
   const walk=sg=>{const o=[];let py=hAt(cx,cz);for(let i=1;i<=175;i++){const x=cx+ux*STEP*i*sg,z=cz+uz*STEP*i*sg;if(!inM(x,z))break;const h=hAt(x,z);if(h<WL+.8||Math.abs(h-py)>.8)break;const lx=x-uz*3.4*K,lz=z+ux*3.4*K,rx=x+uz*3.4*K,rz=z-ux*3.4*K;if(hAt(lx,lz)<WL+.5||hAt(rx,rz)<WL+.5||badSpot(x,z)||badSpot(lx,lz)||badSpot(rx,rz))break;o.push([x,z]);py=h}return o};
   const A=walk(1),B=walk(-1),len=(A.length+B.length)*STEP;
   if(!best||len>best.len)best={len,pts:B.reverse().concat([[cx,cz]],A)};
   if(len>=620)break}
  return best&&best.len>=220?best.pts:null}

 // ---------- vía: raíles, durmientes y farolillos ----------
 function buildTrack(pts){
  if(G){scene.remove(G);G.traverse(o=>{if(o.geometry)o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms)if(m&&m.dispose)m.dispose()})}
  G=new THREE.Group();G.visible=false;
  N=pts.length;P=pts.map(p=>({x:p[0],z:p[1],y:0}));
  for(let i=0;i<N;i++){let s=0,c=0;for(let k=-3;k<=3;k++){const j=i+k;if(j>=0&&j<N){s+=hAt(P[j].x,P[j].z);c++}}P[i].y=s/c+.14}
  L=(N-1)*STEP;
  const dirAt=i=>{const a=P[Math.max(0,i-1)],b=P[Math.min(N-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;return[dx/l,dz/l]};
  // raíles (dos cintas)
  const pos=[],idx=[];
  for(const side of[-1.05*K,1.05*K])for(let i=0;i<N;i++){const[dx,dz]=dirAt(i),nx=-dz,nz=dx,b=pos.length/3;
   for(const w of[-.09*K,.09*K])pos.push(P[i].x+nx*(side+w),P[i].y+.1*K,P[i].z+nz*(side+w));
   if(i<N-1)idx.push(b,b+1,b+2,b+1,b+3,b+2)}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));rg.setIndex(idx);rg.computeVertexNormals();
  const rails=new THREE.Mesh(rg,new THREE.MeshLambertMaterial({color:0x6a7480,emissive:0x15181c,side:THREE.DoubleSide}));rails.frustumCulled=false;G.add(rails);
  // durmientes
  const sl=new THREE.InstancedMesh(new THREE.BoxGeometry(2.7*K,.1*K,.4*K),new THREE.MeshLambertMaterial({color:0x4a3626,emissive:0x120d08}),N),d=new THREE.Object3D();
  for(let i=0;i<N;i++){const[dx,dz]=dirAt(i);d.position.set(P[i].x,P[i].y,P[i].z);d.rotation.set(0,-(Math.atan2(dz,dx)+Math.PI/2),0);d.updateMatrix();sl.setMatrixAt(i,d.matrix)}
  sl.frustumCulled=false;G.add(sl);
  // farolillos cada ~30 m
  const NL=Math.floor(N/15),posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.12*K,2.4*K,.12*K),new THREE.MeshLambertMaterial({color:0x3a2c20,emissive:0x0e0a07}),NL),
   heads=new THREE.InstancedMesh(new THREE.SphereGeometry(.24*K,8,6),new THREE.MeshBasicMaterial({color:0xffd58a}),NL);
  for(let k=0;k<NL;k++){const i=k*15+7,[dx,dz]=dirAt(i),x=P[i].x-dz*2.6*K,z=P[i].z+dx*2.6*K,y=hAt(x,z);
   d.rotation.set(0,0,0);d.position.set(x,y+1.2*K,z);d.updateMatrix();posts.setMatrixAt(k,d.matrix);
   d.position.set(x,y+2.55*K,z);d.updateMatrix();heads.setMatrixAt(k,d.matrix)}
  posts.frustumCulled=heads.frustumCulled=false;G.add(posts,heads);
  scene.add(G);
  console.log('[BOIS] vía secreta construida: de ('+P[0].x.toFixed(0)+', '+P[0].z.toFixed(0)+') a ('+P[N-1].x.toFixed(0)+', '+P[N-1].z.toFixed(0)+'), '+L.toFixed(0)+' m')}

 // ---------- el tren (modelo con más detalle; todo reacciona a la luz salvo ventanas y faros) ----------
 const lam=(c,e)=>new THREE.MeshLambertMaterial({color:c,emissive:e||0x000000}),bas=c=>new THREE.MeshBasicMaterial({color:c});
 const box=(w,h,d,c,x,y,z,glow)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glow?bas(c):lam(c));m.position.set(x,y,z);return m};
 const cyl=(r1,r2,h,c,x,y,z,ax)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,16),lam(c));m.position.set(x,y,z);if(ax==='x')m.rotation.z=Math.PI/2;if(ax==='z')m.rotation.x=Math.PI/2;return m};
 const BRASS=0xb8923f,IRON=0x15171a,GREEN=0x1f4a3a,WINE=0x7a1f1f;
 const wheel=(g,x,z,r)=>{g.add(cyl(r,r,.22,IRON,x,r,z,'z'),cyl(r*.4,r*.4,.26,BRASS,x,r,z,'z'))};
 let glowTex=null;try{const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d'),gr=q.createRadialGradient(32,32,2,32,32,32);
  gr.addColorStop(0,'rgba(255,205,120,.9)');gr.addColorStop(1,'rgba(255,205,120,0)');q.fillStyle=gr;q.fillRect(0,0,64,64);glowTex=new THREE.CanvasTexture(c)}catch(e){}
 const pool=(w,d)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:glowTex,color:glowTex?0xffffff:0xffc878,transparent:true,opacity:glowTex?.4:.08,depthWrite:false,blending:THREE.AdditiveBlending}));
  m.rotation.x=-Math.PI/2;m.position.y=.08;return m};
 function mkCar(len){const g=new THREE.Group();
  g.add(box(len,.35,2.3,IRON,0,.8,0),box(len,1.9,2.7,WINE,0,1.95,0),
   box(len+.04,.14,2.74,BRASS,0,1.05,0),box(len+.04,.14,2.74,BRASS,0,3.0,0));
  const roof=cyl(1.45,1.45,len+.3,0x2e2118,0,3.1,0,'x');roof.scale.set(.3,1,1);g.add(roof);
  const n=5,sp=(len-1.8)/(n-1);
  for(const z of[-1,1])for(let i=0;i<n;i++){const x=-len/2+.9+i*sp;g.add(box(1.05,1.0,.05,0x2b1a12,x,2.25,z*1.36),box(.85,.8,.06,0xffd27a,x,2.25,z*1.38,true))}
  for(const e of[-1,1]){g.add(box(.08,2.0,.9,0x3a2a1d,e*len/2,1.95,0),cyl(.16,.16,.5,IRON,e*(len/2+.2),1.0,.7,'x'),cyl(.16,.16,.5,IRON,e*(len/2+.2),1.0,-.7,'x'),box(1.3,.12,.14,IRON,e*(len/2+.65),.9,0))}
  for(const bx of[-len*.3,len*.3])for(const dx of[-.75,.75])for(const z of[-1.05,1.05])wheel(g,bx+dx,z,.42);
  g.add(pool(len+3,5));g.rotation.order='YZX';return g}
 function mkTender(){const g=new THREE.Group(),L=4.4;
  g.add(box(L,.35,2.3,IRON,0,.8,0),box(L,1.5,2.6,0x15181c,0,1.75,0),box(L+.04,.12,2.64,BRASS,0,2.5,0));
  const coal=new THREE.Mesh(new THREE.SphereGeometry(1.2,10,8),lam(0x0b0c0e));coal.scale.set(1.5,.55,1);coal.position.set(0,2.5,0);g.add(coal);
  for(const dx of[-1.2,1.2])for(const z of[-1.05,1.05])wheel(g,dx,z,.42);
  g.add(box(1.3,.12,.14,IRON,L/2+.65,.9,0),pool(L+2,4));g.rotation.order='YZX';return g}
 function mkLoco(){const g=new THREE.Group();
  g.add(box(7.4,.4,2.5,IRON,.3,.85,0),cyl(1.1,1.1,4.6,GREEN,1.3,2.1,0,'x'));
  for(const x of[.1,1.3,2.5])g.add(cyl(1.14,1.14,.14,BRASS,x,2.1,0,'x'));
  g.add(cyl(1.13,1.13,.7,0x23272d,3.55,2.1,0,'x'),cyl(.9,.9,.06,0x30353b,3.92,2.1,0,'x'),
   cyl(.5,.3,1.1,0x111317,3.0,3.7,0),cyl(.58,.58,.12,BRASS,3.0,4.3,0),cyl(.45,.45,.6,BRASS,1.2,3.3,0),cyl(.25,.25,.5,BRASS,.1,3.3,0));
  g.add(box(2.5,3.0,2.8,GREEN,-2.3,2.4,0),box(3.1,.2,3.2,0x2e2118,-2.3,4.0,0),box(2.54,.14,2.84,BRASS,-2.3,1.1,0));
  for(const z of[-1,1]){g.add(box(1.2,1.0,.05,0x1a120d,-2.3,2.75,z*1.43),box(1.0,.8,.06,0xffd27a,-2.3,2.75,z*1.45,true),box(3.3,.12,.12,0x9aa0a6,.7,1.0,z*1.45))}
  for(const x of[-1.4,.2,1.8])for(const z of[-1.05,1.05])wheel(g,x,z,.8);
  for(const z of[-1.1,1.1])wheel(g,3.1,z,.45);
  const cow=new THREE.Mesh(new THREE.ConeGeometry(1.3,1.5,4),lam(IRON));cow.rotation.set(0,Math.PI/4,-Math.PI/2);cow.scale.set(1,1,.9);cow.position.set(4.6,.75,0);g.add(cow);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),bas(0xfff3c8));lamp.position.set(4.0,2.1,0);g.add(lamp);
  const beam=new THREE.Mesh(new THREE.ConeGeometry(3.2,24,16,1,true),new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  beam.rotation.z=Math.PI/2;beam.position.set(16,2.0,0);g.add(beam);
  g.add(pool(9,5));g.rotation.order='YZX';return g}
 function buildTrain(){
  if(train)return;
  const T=new THREE.Group(),loco=mkLoco(),cars=[],offs=[];T.add(loco);loco.scale.setScalar(K);
  const tender=mkTender();cars.push(tender);offs.push(6.9*K);T.add(tender);
  for(let i=0;i<TRN.cars;i++){const c=mkCar(8.2);cars.push(c);offs.push((14.2+i*9.3)*K);T.add(c)}
  for(const c of cars)c.scale.setScalar(K);
  const tail=box(.3,.3,.3,0xff3030,0,0,0,true);tail.position.set(-4.5,2.2,0);cars[cars.length-1].add(tail);
  T.visible=false;scene.add(T);
  const sm=[],sg=new THREE.SphereGeometry(.55,8,6);
  for(let i=0;i<12;i++){const m=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({color:0xdfe3e8,transparent:true,opacity:0,depthWrite:false}));m.visible=false;m.userData.t=0;m.userData.vx=0;m.userData.vy=0;m.userData.vz=0;scene.add(m);sm.push(m)}
  train={T,loco,cars,offs,len:offs[offs.length-1]+(4.1+4.8)*K};smoke=sm}
 const _trnV=new THREE.Vector3();

 function at(t){t=clamp(t,0,L);const f=t/STEP,i=Math.min(N-2,Math.floor(f)),u=f-i,a=P[i],b=P[i+1];
  return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u,dx:b.x-a.x,dy:b.y-a.y,dz:b.z-a.z}}
 function place(obj,u){ // u = distancia recorrida por este elemento desde el inicio de su sentido
  const t=ST.dir>0?u:L-u;if(u<0||u>L){obj.visible=false;return null}
  obj.visible=true;const p=at(t),s=ST.dir>0?1:-1,dx=p.dx*s,dy=p.dy*s,dz=p.dz*s;
  obj.position.set(p.x,p.y,p.z);obj.rotation.y=-Math.atan2(dz,dx);obj.rotation.z=Math.atan2(dy,Math.hypot(dx,dz));return p}

 // ---------- sonido ----------
 function whistle(vol){try{const C=AU.ctx;if(!C||!AU.on||vol<.02)return;const t0=C.currentTime,g=C.createGain(),lp=C.createBiquadFilter();
  lp.type='lowpass';lp.frequency.value=1500;g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.05*vol,t0+.12);g.gain.setValueAtTime(.05*vol,t0+.7);g.gain.exponentialRampToValueAtTime(.0001,t0+1.5);
  g.connect(lp);lp.connect(C.destination);
  for(const f of[392,494]){const o=C.createOscillator();o.type='triangle';o.frequency.setValueAtTime(f,t0);o.frequency.linearRampToValueAtTime(f*.97,t0+1.4);o.connect(g);o.onended=()=>{try{o.disconnect()}catch(e){}};o.start(t0);o.stop(t0+1.6)}
  setTimeout(()=>{try{g.disconnect();lp.disconnect()}catch(e){}},2200)}catch(e){typeof __bw==='function'&&__bw('36h-night-train#w',e)}}

 // ---------- control ----------
 function stop(){ST.mode='wait';ST.wait=rnd(TRN.minWait,TRN.maxWait);if(train)train.T.visible=false;if(smoke)for(const m of smoke)m.visible=false}
 function ensureRoute(){if(P)return true;const r=findRoute();if(!r){console.warn('[BOIS] no hay tierra firme suficiente para la vía');return false}buildTrack(r);buildTrain();return true}
 function start(){
  if(!ensureRoute()){ST.wait=120;return}
  buildTrain();ST.mode='run';ST.dir=Math.random()<.5?1:-1;ST.s=0;ST.told=false;ST.w1=ST.w2=false;ST.chug=0;ST.puff=0;train.T.visible=true}

 function tick(p,tt){
  if(typeof PR!=='undefined'&&PR.on){if(G)G.visible=false;if(train)train.T.visible=false;return}
  const dt=Math.min(.1,Math.max(0,tt-last));last=tt;if(!dt)return;
  if(!forced&&!isDec()){if(G&&G.visible){G.visible=false;stop()}return}
  const nf=Math.max(p.night||0,(p.dusk||0)*.55),dark=forced||nf>TRN.dark;
  if(G)G.visible=forced||nf>.2;
  if(ST.mode==='wait'){
   if(!S.on||CIN.on||!dark)return;
   if((ST.wait-=dt)<=0)start();
   if(ST.mode==='wait'&&G)G.visible=forced||nf>.2;
   return}
  // --- en marcha ---
  if(!train||!P){stop();return}
  ST.s+=TRN.speed*dt;
  place(train.loco,ST.s);
  for(let i=0;i<train.cars.length;i++)place(train.cars[i],ST.s-train.offs[i]);
  train.loco.updateMatrixWorld();
  const lp=train.loco.position,d=Math.hypot(S.x-lp.x,S.z-lp.z),prox=clamp(1-d/200,0,1);
  if(train.loco.visible){
   if(!ST.w1&&d<320){ST.w1=true;whistle(prox+.25)}
   if(!ST.w2&&d<90){ST.w2=true;whistle(Math.min(1,prox+.3))}
   if(!ST.told&&d<45){ST.told=true;showMsg('Un tren pasa despacio entre los árboles. No sale en ningún mapa.')}
   if((ST.chug-=dt)<=0){ST.chug=.3;if(prox>.05)auHit(260+Math.random()*120,.09,.05*prox*prox)}
   if((ST.puff-=dt)<=0){ST.puff=.22;const m=smoke.find(q=>!q.visible);if(m){const w=train.loco.localToWorld(_trnV.set(3.0,4.5,0));m.position.copy(w);const u=m.userData;u.t=0;u.vx=rnd(-.4,.4);u.vy=rnd(1.6,2.4);u.vz=rnd(-.4,.4);m.scale.setScalar(.6*K);m.visible=true}}}
  for(const m of smoke){if(!m.visible)continue;const u=m.userData;u.t+=dt;if(u.t>4){m.visible=false;continue}
   m.position.x+=u.vx*dt;m.position.y+=u.vy*dt;m.position.z+=u.vz*dt;m.scale.setScalar((.6+u.t*.8)*K);m.material.opacity=.5*(1-u.t/4)}
  if(ST.s>L+train.len+10)stop()}

 const prev=globalThis.BOIS_LIFE;
 globalThis.BOIS_LIFE=(p,tt)=>{if(prev)prev(p,tt);try{tick(p,tt)}catch(e){if(!warned){warned=true;console.warn('Tren de medianoche:',e);try{stop();if(G)G.visible=false}catch(_){}}}};

 window.__boisTren=v=>{
  if(v===false){forced=false;stop();if(G)G.visible=false;console.log('Tren detenido.');return}
  if(v==='ruta'){try{if(G){scene.remove(G);G=null}P=null;ensureRoute()}catch(e){console.warn(e)}return}
  forced=true;warned=false;ST.mode='wait';ST.wait=0;console.log('Tren de medianoche: en camino. Busca la vía (mira la consola) y espera unos segundos.')};
})()}catch(__trnErr){console.error('Tren de medianoche no pudo inicializarse; se conserva el juego base:',__trnErr)}
