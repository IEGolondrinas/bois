/* BOIS.IO · 12-weather.js — Clima WX: lluvia, niebla, tormenta, supercélula, otoño
   (líneas 1444–1600 de BOIS_IO_v119_Optimizado.html) */
// ---------- v13: clima (lluvia, niebla, tormenta con relámpagos) y estación (otoño)
// Todo es procedural. Lluvia y hojas son partículas CPU (LineSegments/Points) que se reciclan alrededor de la cámara.
const WX=(()=>{
const NAMES=['Automático','Despejado','Supercélula','Lluvia','Tormenta','Niebla'];
const TG=[[0,.03,0],[.05,.14,1],[.62,.22,.3],[1,.4,.45],[.04,1,0]];// [lluvia, niebla, supercélula] por estado: despejado, supercélula, lluvia, tormenta, niebla // [lluvia, niebla] por estado: despejado, lluvia, tormenta, niebla
const st={mode:0,auto:0,timer:110,rain:0,fog:0,rainT:0,fogT:0,sc:0,scT:0,nextFlick:14,aut:0,autT:0,applied:0,flash:0,pulses:[],nextBolt:8,shake:0,tt:0,ra:null,wind:0,stormAge:0,stormGust:0}; // v162: verano como estación inicial (la escena base ya es verano, por eso applied:0 no requiere aplicar nada)
const c1=new THREE.Color(),c2=new THREE.Color(),c3=new THREE.Color(),camV=new THREE.Vector3(),camP=new THREE.Vector3(),rV=new THREE.Vector3(),rel=new THREE.Vector3();let camInit=false;
const lum=c=>c.r*.3+c.g*.55+c.b*.15,bolts=[],LF=$('lfl');
// --- niebla: cúpula translúcida (el cielo ignora la niebla de escena, así el horizonte se funde con el terreno;
// incluye dispersión solar para que el sol siga viéndose difuso a través de la niebla)
const dome=new THREE.Mesh(new THREE.SphereGeometry(2250,24,14),new THREE.ShaderMaterial({
 uniforms:{uColor:{value:new THREE.Color()},uOpacity:{value:0},uSunDir:{value:new THREE.Vector3(0,1,0)},uSunCol:{value:new THREE.Color(1,.95,.85)},uSunVis:{value:0}},
 vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`varying vec3 vD;
uniform vec3 uColor,uSunDir,uSunCol;
uniform float uOpacity,uSunVis;
void main(){
 vec3 d=normalize(vD);
 float cy=1.0-(asin(clamp(d.y,-1.0,1.0))/3.14159265+0.5);
 float g=cy<0.42?mix(0.20,0.75,cy/0.42):mix(0.75,1.0,clamp((cy-0.42)/0.08,0.0,1.0));
 float sd=dot(d,normalize(uSunDir));
 float ang=sqrt(max(2.0*(1.0-sd),0.0));
 float halo=exp(-ang*3.0)*0.36+exp(-ang*9.5)*0.56;
 float orb=smoothstep(0.085,0.016,ang);
 float mask=smoothstep(-0.04,0.03,d.y)*uSunVis;
 vec3 sCol=mix(vec3(1.0,0.98,0.92),uSunCol,0.45);
 vec3 col=mix(uColor,sCol*1.35,clamp((halo*0.55+orb*0.85)*mask,0.0,0.92));
 float a=clamp(g*uOpacity,0.0,1.0);
 a=max(a,clamp((halo*0.35+orb*0.7)*mask,0.0,0.92));
 gl_FragColor=vec4(col,a);
 #include <encodings_fragment>
}`,
 side:THREE.BackSide,transparent:true,depthWrite:false,fog:false,toneMapped:false
}));
dome.renderOrder=-2.5;dome.frustumCulled=false;dome.userData.dyn=true;dome.visible=false;scene.add(dome);
// --- nubes de tormenta (capa alta, grande y oscura)
const stormTex=canvasTex(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,.78)');g.addColorStop(.45,'rgba(240,245,255,.42)');g.addColorStop(.78,'rgba(220,230,245,.12)');g.addColorStop(1,'rgba(220,230,245,0)');x.fillStyle=g;x.fillRect(0,0,w,h)});
const stormMat=new THREE.SpriteMaterial({map:stormTex,transparent:true,depthWrite:false,fog:false,toneMapped:false,opacity:0}),storm=[];
for(let i=0;i<20;i++){const s=new THREE.Sprite(stormMat),w=1300+hash(i,11)*1200;s.scale.set(w,w*.42,1);s.renderOrder=-1;s.frustumCulled=false;s.userData={az:hash(i,13)*6.283,el:.26+hash(i,17)*.62};storm.push(s);scene.add(s)}
// --- lluvia: rayas que se estiran según la velocidad relativa cámara/gota (se adapta al movimiento de la cámara)
const NR=touch?1000:2100,HX=24,HY=15,rp=new Float32Array(NR*6),rd=new Float32Array(NR*3);
for(let i=0;i<NR;i++){rd[i*3]=(Math.random()*2-1)*HX;rd[i*3+1]=(Math.random()*2-1)*HY;rd[i*3+2]=(Math.random()*2-1)*HX}
const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rp,3));rg.setDrawRange(0,0);
const rm=new THREE.LineBasicMaterial({color:0xaec2d6,transparent:true,opacity:.42,depthWrite:false,fog:false});
const rainL=new THREE.LineSegments(rg,rm);rainL.frustumCulled=false;rainL.visible=false;rainL.renderOrder=5;rainL.userData.dyn=true;scene.add(rainL);
// --- salpicaduras en el suelo / agua
const NS=36,sp=new Float32Array(NS*3),scl=new Float32Array(NS*3),sl=new Float32Array(NS);
for(let i=0;i<NS;i++)sl[i]=Math.random();
const sgm=new THREE.BufferGeometry();sgm.setAttribute('position',new THREE.BufferAttribute(sp,3));sgm.setAttribute('color',new THREE.BufferAttribute(scl,3));
const ringT=canvasTex(64,64,(x,w,h)=>{x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=3;x.beginPath();x.arc(32,32,20,0,7);x.stroke();x.strokeStyle='rgba(255,255,255,.4)';x.lineWidth=2;x.beginPath();x.arc(32,32,11,0,7);x.stroke()});
const splash=new THREE.Points(sgm,new THREE.PointsMaterial({map:ringT,size:1.1,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,sizeAttenuation:true}));
splash.frustumCulled=false;splash.visible=false;splash.userData.dyn=true;scene.add(splash);
// --- hojas de otoño
const NL=touch?120:260,lp=new Float32Array(NL*3),lc=new Float32Array(NL*3),lph=new Float32Array(NL),LPAL=[[.85,.4,.06],[.9,.62,.1],[.62,.14,.06],[.5,.28,.08],[.95,.75,.2]];
for(let i=0;i<NL;i++){lp[i*3]=(Math.random()*2-1)*HX;lp[i*3+1]=(Math.random()*2-1)*HY;lp[i*3+2]=(Math.random()*2-1)*HX;lph[i]=Math.random()*6.28;const c=LPAL[i%5],v=.8+Math.random()*.4;lc[i*3]=c[0]*v;lc[i*3+1]=c[1]*v;lc[i*3+2]=c[2]*v}
const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(lp,3));lg.setAttribute('color',new THREE.BufferAttribute(lc,3));
const leafT=canvasTex(32,32,(x,w,h)=>{x.fillStyle='#fff';x.beginPath();x.ellipse(16,16,12,7,.6,0,7);x.fill();x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1.2;x.beginPath();x.moveTo(5,23);x.lineTo(27,9);x.stroke()});
const leaves=new THREE.Points(lg,new THREE.PointsMaterial({map:leafT,size:.55,vertexColors:true,transparent:true,alphaTest:.35,depthWrite:false,sizeAttenuation:true,opacity:0}));
leaves.frustumCulled=false;leaves.visible=false;leaves.userData.dyn=true;scene.add(leaves);
const wrap=(v,c,H)=>{const d=((v-c+H)%(2*H)+2*H)%(2*H)-H;return c+d};
// --- relámpagos: rayo en zigzag (cinta aditiva) + destello de cielo + trueno retrasado según la distancia
function jag(a,b,disp,dp,out){if(dp===0){out.push(a,b);return}
 const m=[(a[0]+b[0])/2+(Math.random()-.5)*disp,(a[1]+b[1])/2+(Math.random()-.5)*disp*.35,(a[2]+b[2])/2+(Math.random()-.5)*disp];jag(a,m,disp*.55,dp-1,out);jag(m,b,disp*.55,dp-1,out)}
function strike(){const cp=cam.position,far=Math.random()<.3,ang=Math.random()*6.283,dist=far?1100+Math.random()*900:260+Math.random()*700;
 let x=cp.x+Math.cos(ang)*dist,z=cp.z+Math.sin(ang)*dist,ey=Math.max(hAt(x,z),WL),roof=false;
 if(!far&&Math.random()<.65){if(!st.ck)st.ck=Array.from(cells.keys());
  for(let t=0;t<30;t++){const k=st.ck[Math.random()*st.ck.length|0],ci=Math.round(k/4096),cj=k-ci*4096,qx=(ci+.5)*CS,qz=(cj+.5)*CS,d=Math.hypot(qx-cp.x,qz-cp.z);
   if(d<180||d>950)continue;const gy=ground(qx,qz,500);if(gy-hAt(qx,qz)>14){x=qx;z=qz;ey=gy;roof=true;break}}}
 const dx=x-cp.x,dz=z-cp.z,d=Math.hypot(dx,dz),top=[x+(Math.random()-.5)*120,440+Math.random()*80,z+(Math.random()-.5)*120],end=[x,ey,z],segs=[];
 if(!far){jag(top,end,70,6,segs);for(let b=0;b<3;b++){const i=2*(Math.random()*(segs.length/2-4)|0)+2,p=segs[i],e=[p[0]+(Math.random()-.5)*160,Math.max(ey,p[1]-90-Math.random()*160),p[2]+(Math.random()-.5)*160];jag(p,e,45,4,segs)}
  const pos=[],w=1.6+d*.0055;for(let i=0;i<segs.length;i+=2){const a=segs[i],b=segs[i+1],mx=(a[0]+b[0])/2-cp.x,my=(a[1]+b[1])/2-cp.y,mz=(a[2]+b[2])/2-cp.z,ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2];
   let sx=uy*mz-uz*my,sy=uz*mx-ux*mz,sz=ux*my-uy*mx;const l=Math.hypot(sx,sy,sz)||1;sx=sx/l*w;sy=sy/l*w;sz=sz/l*w;
   pos.push(a[0]-sx,a[1]-sy,a[2]-sz,a[0]+sx,a[1]+sy,a[2]+sz,b[0]+sx,b[1]+sy,b[2]+sz,a[0]-sx,a[1]-sy,a[2]-sz,b[0]+sx,b[1]+sy,b[2]+sz,b[0]-sx,b[1]-sy,b[2]-sz)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xd7e4ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false,side:THREE.DoubleSide,opacity:1}));
  m.frustumCulled=false;m.renderOrder=6;scene.add(m);bolts.push({m,t:0});
  if(roof&&AP.dmg)AP.dmg([x,ey,z],[0,1,0],.5,1.2)}
 const k=far?.35:Math.max(.55,1.2-d/1100);st.pulses=[{t:0,i:k},{t:.11,i:k*.55},{t:.24,i:k*.9},{t:.4,i:k*.4}];st.pt=0;if(d<420)st.shake=.35;
 setTimeout(()=>{if(AU.ctx&&AU.on&&S.on&&!PR.on&&!document.hidden){const v=Math.max(.2,Math.min(1,1.15-d/1900));auHit(90,3.2,v,'lowpass');setTimeout(()=>{if(AU.ctx&&AU.on&&S.on&&!PR.on&&!document.hidden)auHit(200,1.8,v*.6,'lowpass')},500);if(d<500)auHit(1800,.3,v*.5,'highpass')}},Math.min(5500,d/340*1000))}
// --- estación: otoño (terreno, pinos, árboles y arbustos del mapa)
let SI=null;
function seasonInit(){if(SI||!TER)return;const tc=TER.tc,tc0=tc.slice(),n=HR*HR,tg=new Float32Array(n),tk=new Float32Array(n*3);
 for(let j=0;j<HR;j++)for(let i=0;i<HR;i++){const k=j*HR+i,r=tc0[k*3],g=tc0[k*3+1],t=hash(i>>1,j>>1)*.55+hash(i>>3,j>>3)*.45;
  tg[k]=Math.max(0,Math.min(1,(g-r-.03)/.1));tk[k*3]=1.9+.9*t;tk[k*3+1]=.95-.3*t;tk[k*3+2]=.5-.15*t}
 const pc=PINE.attributes.color.array,pg0=pc.slice(),pa=new Float32Array(pc.length),pf=[];
 for(let i=0;i<pc.length/3;i++){const r=pg0[i*3],g=pg0[i*3+1],b=pg0[i*3+2];if(g>r*1.25&&g>b){const l=r*.3+g*.59+b*.11;pa[i*3]=l*2.6;pa[i*3+1]=l*1.15;pa[i*3+2]=l*.28;pf.push(i)}}
 const mats=[['Tree',lin(.78,.36,.07)],['Green',lin(.62,.52,.2)]].map(a=>GM[a[0]]?{m:GM[a[0]],c0:GM[a[0]].color.clone(),c1:a[1]}:null).filter(Boolean);
 if(window.__boisShoreMats){
  if(window.__boisShoreMats.plant)mats.push({m:window.__boisShoreMats.plant,c0:window.__boisShoreMats.plant.color.clone(),c1:new THREE.Color(1.38,.88,.45)});
  if(window.__boisShoreMats.pad)mats.push({m:window.__boisShoreMats.pad,c0:window.__boisShoreMats.pad.color.clone(),c1:lin(.58,.46,.16)});
 }
 if(window.__boisPolishMats&&window.__boisPolishMats.shrub){
  mats.push({m:window.__boisPolishMats.shrub,c0:window.__boisPolishMats.shrub.color.clone(),c1:new THREE.Color(1.35,.84,.42)});
 }
 SI={tg,tk,tc0,pg0,pa,pf,mats}}
const TINT=[[1.05,1.25,1.5],[1,1,1],[1.05,.65,.8],[.8,.85,.9]];
function applySeason(a){seasonInit();if(!SI)return;const tc=TER.tc,{tg,tk,tc0,pg0,pa,pf,mats}=SI;
 for(let k=0;k<tg.length;k++){const f=tg[k];if(f<=.001)continue;for(let c=0;c<3;c++){const K=tk[k*3+c];tc[k*3+c]=tc0[k*3+c]*(1+f*(K-1)*a)}}
 TER.g.attributes.color.needsUpdate=true;
 const pc=PINE.attributes.color.array;for(const i of pf)for(let c=0;c<3;c++)pc[i*3+c]=pg0[i*3+c]+(pa[i*3+c]-pg0[i*3+c])*a;PINE.attributes.color.needsUpdate=true;
 const cc=new THREE.Color();for(const ch of treeChunks){const im=ch.m;ch.a.forEach((t,i)=>{const v=.8+hash(t[3],2.2)*.35,h=hash(t[3],5.5),T=TINT[h<.25?0:h<.6?1:h<.8?2:3];im.setColorAt(i,cc.setRGB(v*(1+(T[0]-1)*a),v*(1+(T[1]-1)*a),v*(1+(T[2]-1)*a)))});im.instanceColor.needsUpdate=true}
 for(const o of mats)o.m.color.copy(o.c0).lerp(o.c1,a);
 st.applied=a;document.body.classList.toggle('aut',a>.5)}
// --- ciclo automático de estados del clima
// v24: lo normal es el cielo despejado; la lluvia es rara y casi siempre llega precedida por una supercélula.
// Estados: 0 despejado · 1 supercélula · 2 lluvia · 3 tormenta · 4 niebla (probabilidad de pasar al siguiente según el actual)
function pick(){
 const c=st.auto;
 // Tras una supercélula, lo habitual es que descargue: lluvia fuerte o tormenta.
 const W=c===1?[.12,.02,.50,.29,.07]:c===2||c===3?[.66,.2,.05,.03,.06]:[.64,.16,.04,.02,.14];
 let r=Math.random()*W.reduce((a,b)=>a+b,0),i=0;while(i<4&&r>W[i]){r-=W[i];i++}
 st.auto=i;
 // La supercélula permanece el tiempo suficiente para que el jugador perciba su llegada.
 st.timer=i===1?78+Math.random()*38:[130+Math.random()*150,0,55+Math.random()*35,42+Math.random()*28,65+Math.random()*55][i];
 if(i!==1)st.timer=Math.max(35,st.timer);
 st.stormAge=0;st.stormGust=0;
}
function targets(){const g=TG[st.mode===0?st.auto:st.mode-1];st.rainT=g[0];st.fogT=g[1];st.scT=g[2]}
function stepRain(dt,k){const n=Math.floor(NR*Math.min(1,k*1.1));rg.setDrawRange(0,n*2);if(n<1)return;
 const cx=cam.position.x,cy=cam.position.y,cz=cam.position.z;
 rV.set(st.wind*1.2,-17-4*k,st.wind*.6);rel.copy(rV).sub(camV);const rl=rel.length()||1,L=Math.min(2.8,Math.max(.5,rl*.024)),iv=L/rl;
 for(let i=0;i<n;i++){let x=rd[i*3]+rV.x*dt,y=rd[i*3+1]+rV.y*dt,z=rd[i*3+2]+rV.z*dt;
  x=wrap(x,cx,HX);y=wrap(y,cy,HY);z=wrap(z,cz,HX);rd[i*3]=x;rd[i*3+1]=y;rd[i*3+2]=z;
  const o=i*6;rp[o]=x;rp[o+1]=y;rp[o+2]=z;rp[o+3]=x-rel.x*iv;rp[o+4]=y-rel.y*iv;rp[o+5]=z-rel.z*iv}
 rg.attributes.position.needsUpdate=true}
function stepSplash(dt,k){const cx=cam.position.x,cy=cam.position.y,cz=cam.position.z,ok=k>.08&&cy-hAt(cx,cz)<35;
 for(let i=0;i<NS;i++){sl[i]-=dt*3.2;if(sl[i]<=0){if(ok){const a=Math.random()*6.283,r=3+Math.random()*17,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;sp[i*3]=x;sp[i*3+1]=Math.max(hAt(x,z),WL)+.07;sp[i*3+2]=z;sl[i]=1}else sl[i]=0}
  const v=sl[i]>0?sl[i]*sl[i]*.5*k:0;scl[i*3]=v;scl[i*3+1]=v;scl[i*3+2]=v*1.1}
 sgm.attributes.position.needsUpdate=true;sgm.attributes.color.needsUpdate=true}
function stepLeaves(dt,k){const cx=cam.position.x,cy=cam.position.y,cz=cam.position.z,n=Math.floor(NL*Math.min(1,k*1.2)),tt=st.tt;lg.setDrawRange(0,n);
 for(let i=0;i<n;i++){const ph=lph[i];let x=lp[i*3]+(Math.sin(tt*.9+ph)*1.3+1.1+st.wind*.52)*dt,y=lp[i*3+1]-(1.1+Math.sin(tt*1.7+ph)*.35)*dt,z=lp[i*3+2]+Math.cos(tt*.8+ph*1.3)*1.1*dt;
  x=wrap(x,cx,HX);y=wrap(y,cy,HY);z=wrap(z,cz,HX);lp[i*3]=x;lp[i*3+1]=y;lp[i*3+2]=z}
 lg.attributes.position.needsUpdate=true}
const api={
 cycle(){st.mode=(st.mode+1)%NAMES.length;if(st.mode===0)pick();targets();showMsg('Clima: '+NAMES[st.mode]+(st.mode===0?' (cambia solo)':''));if(AU.ctx&&AU.on&&st.mode>0)auHit(500,.25,.12,'bandpass')},
 setMode(i){st.mode=((i|0)%NAMES.length+NAMES.length)%NAMES.length;if(st.mode===0)pick();targets();return st.mode},names:NAMES,
 season(){st.autT=st.autT>.5?0:1;showMsg('Estación: '+(st.autT?'Otoño 🍂':'Verano ☀')+'')},
 // para pruebas y para el HUD
 st,tag(){const r=st.rain,f=st.fog,nm=r>.8?'⛈ Tormenta':r>.25?'🌧 Lluvia':f>.4?'🌫 Niebla':st.sc>.4?'🟣 Supercélula':PC.night>.6?'🌙 Despejado':'☀ Despejado';return nm+' · '+(st.autT?'Otoño':'Verano')+(st.mode===0?' (auto)':'')},
 strike,
 upd(dt,tt){st.tt=tt;
  if(st.mode===0){st.timer-=dt;if(st.timer<=0)pick()}targets();
  // La supercélula crece en tres actos: cielo que se cierra, ráfagas y descarga.
  if(st.scT>.2||st.sc>.2){
   st.stormAge+=dt;
   const build=Math.min(1,st.stormAge/34);
   const gustTarget=Math.max(0,Math.sin(st.stormAge*.19-1.1))*build;
   st.stormGust+=(gustTarget-st.stormGust)*(1-Math.exp(-dt/2.8));
  }else{st.stormAge=0;st.stormGust+=(0-st.stormGust)*(1-Math.exp(-dt/5))}
  st.rain+=(st.rainT-st.rain)*(1-Math.exp(-dt/(st.rainT>st.rain?7:4)));st.fog+=(st.fogT-st.fog)*(1-Math.exp(-dt/(st.fogT>st.fog?9:6)));
  if(st.rain<.01&&st.rainT===0)st.rain=0;st.sc+=(st.scT-st.sc)*(1-Math.exp(-dt/(st.scT>st.sc?10:6)));if(st.sc<.004&&st.scT===0)st.sc=0;
  st.aut+=(st.autT-st.aut)*(1-Math.exp(-dt/1.3));if(Math.abs(st.aut-st.autT)<.004)st.aut=st.autT;
  st.sa=(st.sa||0)-dt;if(st.sa<=0&&(Math.abs(st.aut-st.applied)>.02||(st.aut===st.autT&&st.applied!==st.aut))){st.sa=.12;applySeason(st.aut)}
  st.wind=(Math.sin(tt*.13)+Math.sin(tt*.31+2))*(.8+st.rain*3.2+st.sc*1.8)+st.stormGust*(2.2+1.8*Math.sin(tt*.9));
  // relámpagos
  const el=Math.max(0,(st.rain-.55)/.45);
  if(el>.05){st.nextBolt-=dt;if(st.nextBolt<=0){strike();st.nextBolt=(5+Math.random()*12)/Math.max(.35,el)}}else st.nextBolt=Math.max(st.nextBolt,6);
  // v24: relámpagos secos dentro de la nube (sin rayo a tierra) y trueno lejano durante la supercélula
  if(st.sc>.6&&st.rain<.45){st.nextFlick-=dt;if(st.nextFlick<=0){st.pulses=[{t:0,i:.5},{t:.13,i:.85},{t:.3,i:.45}];st.pt=0;st.nextFlick=9+Math.random()*16;if(AU.ctx&&AU.on&&S.on&&!document.hidden)setTimeout(()=>{if(AU.ctx&&AU.on&&S.on&&!PR.on&&!document.hidden)auHit(70,2.2,.26,'lowpass')},600+Math.random()*1400)}}else st.nextFlick=Math.max(st.nextFlick,8);
  let fl=0;if(st.pulses.length){st.pt+=dt;for(const p of st.pulses)if(st.pt>=p.t)fl=Math.max(fl,p.i*Math.exp(-(st.pt-p.t)*13));if(st.pt>1.2)st.pulses=[]}
  st.flash=fl;LF.style.opacity=(fl*.42).toFixed(3);
  for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.t+=dt;const f=b.t<.12?1:b.t<.2?.15:b.t<.34?.85:Math.max(0,1-(b.t-.34)/.2);b.m.material.opacity=f;
   if(b.t>.56){scene.remove(b.m);b.m.geometry.dispose();b.m.material.dispose();bolts.splice(i,1)}}
  if(st.shake>0){st.shake=Math.max(0,st.shake-dt*.7);const q=st.shake*.5;cam.position.x+=(Math.random()-.5)*q;cam.position.y+=(Math.random()-.5)*q;cam.position.z+=(Math.random()-.5)*q}
  // atmósfera: luz, cielo, niebla, nubes
  const p=skyStep(dt),ov=Math.min(1,st.rain*.9+st.fog*.3),au=st.aut,sm=Math.max(.1,1-.8*ov-.5*st.sc);if(waterMat.userData.waterShader){const wu=waterMat.userData.waterShader.uniforms;wu.uWaterNight.value=p.night;wu.uWaterStorm.value=st.sc;wu.uWaterRain.value=st.rain;}
  sun.intensity=p.si*sm*(1-.08*au);sun.color.setRGB(p.sc[0]*(1+.06*au),p.sc[1]*(1-.04*au),p.sc[2]*(1-.2*au));sun.color.lerp(c3.setRGB(.84,.96,.60),st.sc*.5);
  hemi.intensity=p.hi*(1-.3*ov-.22*st.sc)+fl*2.6;hemi.color.setRGB(p.hs[0]*(1+.05*au),p.hs[1]*(1-.02*au),p.hs[2]*(1-.14*au));hemi.groundColor.setRGB(p.hg[0]*(1+.2*au),p.hg[1]*(1+.05*au),p.hg[2]);hemi.color.lerp(c3.setRGB(.52,.60,.78),st.sc*.55);hemi.groundColor.lerp(c3.setRGB(.2,.22,.2),st.sc*.5);
  R.toneMappingExposure=p.ex*(1-.07*ov)*(1-.03*au)*(1-.12*st.sc);
  c1.setRGB(...p.fog).convertSRGBToLinear();const lm=lum(c1);c2.setRGB(lm*.78,lm*.83,lm*.92);c1.lerp(c2,Math.min(1,ov*1.15));c1.r*=1+.07*au;c1.b*=1-.12*au;c1.lerp(c3.setRGB(.10,.15,.09).multiplyScalar(1-p.night*.8),Math.min(1,st.sc*.8));c1.lerp(c3.setRGB(1,1,1),fl*.5);
  if(!uw&&!PR.on)scene.fog.color.copy(c1);
  if(!uw&&!PR.on)scene.fog.density=QS[qi].fog*(1+st.rain*1.6+st.fog*10+st.sc*1.1);
  const fo=Math.min(.92,st.fog*.9+st.rain*.22+st.sc*.18);dome.visible=!uw&&fo>.01;
  if(dome.visible){const du=dome.material.uniforms;du.uOpacity.value=fo;du.uColor.value.copy(c1);du.uSunDir.value.set(p.sd[0],p.sd[1],p.sd[2]).normalize();du.uSunCol.value.setRGB(p.sc[0],p.sc[1],p.sc[2]).convertSRGBToLinear();du.uSunVis.value=Math.max(0,Math.min(1,st.fog*(1-p.night)*Math.max(0,1-st.rain*1.1-st.sc*1.2)));}
  dome.position.copy(cam.position);
  const sk=(1-.46*ov)*(1-.16*st.sc),fb=1+fl*3.2;sky.material.color.setRGB(sk*(.965+fl*.035)*fb,sk*(.985+fl*.02)*fb,sk*(1.015+fl*.045)*fb);
  SKY.ov=ov;SKY.sc=st.sc;sunSpr.material.opacity=Math.max(0,1-ov*1.4-st.sc*1.3);
  c2.setRGB(...p.cc).convertSRGBToLinear();const cl=lum(c2)*.36;c2.lerp(c3.setRGB(cl,cl*1.03,cl*1.1),ov);c2.lerp(c3.setRGB(.13,.14,.18),st.sc*.72);c2.lerp(c3.setRGB(1,1,1),fl*.6);cloudMat.color.copy(c2);cloudMat.opacity=Math.min(1,(.92-.24*p.night)+ov*.25);
  stormMat.color.copy(c2).multiplyScalar(.75);stormMat.color.lerp(c3.setRGB(.10,.09,.15),st.sc*.55);stormMat.opacity=Math.max(0,Math.min(.97,Math.max((ov-.12)*1.3,st.sc*(.68+.22*Math.min(1,st.stormAge/38)))))*(uw?0:1);
  for(const c of storm){const u=c.userData;u.az+=dt*(.004+st.sc*.009+st.stormGust*.003);const ce=Math.cos(u.el);c.position.set(cam.position.x+Math.sin(u.az)*ce*1750,cam.position.y+Math.sin(u.el)*1750,cam.position.z+Math.cos(u.az)*ce*1750);c.visible=stormMat.opacity>.01}
  if(!uw)stars.visible=p.night>.02&&ov<.55;
  // partículas
  if(!camInit||camP.distanceToSquared(cam.position)>2500){camP.copy(cam.position);camV.set(0,0,0);camInit=true}
  else{rel.copy(cam.position).sub(camP).multiplyScalar(1/Math.max(dt,.001));if(rel.length()>140)rel.set(0,0,0);camV.lerp(rel,.25);camP.copy(cam.position)}
  const rk=uw?0:st.rain;rainL.visible=rk>.02;if(rainL.visible){rm.color.copy(c1).multiplyScalar(1.7).lerp(c3.setRGB(.7,.78,.88),.35);rm.opacity=.3+.2*rk;stepRain(dt,rk)}
  splash.visible=rk>.08;if(splash.visible)stepSplash(dt,rk);
  const lk=uw?0:au*(1-st.rain*.7);leaves.visible=lk>.05;if(leaves.visible){leaves.material.opacity=Math.min(1,lk*1.4);stepLeaves(dt,lk)}
  // sonido de lluvia
  if(AU.ctx&&AU.nb){if(!st.ra){const C=AU.ctx,s=C.createBufferSource(),hp=C.createBiquadFilter(),lpf=C.createBiquadFilter(),g=C.createGain();s.buffer=AU.nb;s.loop=true;hp.type='highpass';hp.frequency.value=900;lpf.type='lowpass';lpf.frequency.value=6500;g.gain.value=0;s.connect(hp);hp.connect(lpf);lpf.connect(g);g.connect(C.destination);s.start();st.ra=g}
   st.ra.gain.setTargetAtTime(AU.on&&S.on&&!uw&&!PR.on?Math.min(.22,st.rain*.2)*(1-(typeof __boisAudioZoneMute==='function'?__boisAudioZoneMute():0)):0,AU.ctx.currentTime,.3)}}};
return api})();
