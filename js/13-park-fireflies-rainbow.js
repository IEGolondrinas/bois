/* BOIS.IO · 13-park-fireflies-rainbow.js — Parque de cisnes, luciérnagas, arcoíris, sonidos de naturaleza
   (líneas 1601–1657 de BOIS_IO_v119_Optimizado.html) */
// ---------- v19: parque de los cisnes, luciérnagas, arcoíris tras la tormenta y música ambiental
const arGlow=canvasTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.3)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h)});
const arNB=(x,z)=>{const i=Math.floor(x/CS),j=Math.floor(z/CS);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)if(cells.has((i+a)*4096+j+b))return true;return false};
const arBox=(w,h,d,x,y,z,c)=>({g:new THREE.BoxGeometry(w,h,d).translate(x,y,z),c:lin(...c)});
const arSpots=[],arLamps=[];
for(let k=0;k<3000&&arSpots.length<7;k++){const x=-15+(hash(k,11.3)*2-1)*280,z=-55+(hash(k,23.9)*2-1)*280,h=hAt(x,z);
 if(h<2.7||h>9||arNB(x,z)||Math.hypot(hAt(x+2,z)-hAt(x-2,z),hAt(x,z+2)-hAt(x,z-2))/4>.3)continue;
 let ang=-1;for(let q=0;q<8&&ang<0;q++){const a=q*.7854,px=x+Math.sin(a)*7,pz=z+Math.cos(a)*7;if(hAt(px,pz)<WL-.3&&__inLake(px,pz))ang=a}
 if(ang<0||arSpots.some(s=>Math.hypot(s.x-x,s.z-z)<28))continue;arSpots.push({x,z,h,a:ang})}
// v193: farolas cálidas también a lo largo de los senderos de la isla
{const trailBits=typeof TRAIL_MASK_B64==='string'?atob(TRAIL_MASK_B64):'';
 const isTrail=(x,z)=>{if(!trailBits)return false;const ix=Math.max(0,Math.min(511,Math.round((500-x)*.511))),iy=Math.max(0,Math.min(511,Math.round((500-z)*.511))),k=iy*512+ix;return (trailBits.charCodeAt(k>>3)&(1<<(k&7)))!==0};
 for(const s of arSpots){const lx=s.x+Math.cos(s.a)*1.7,lz=s.z-Math.sin(s.a)*1.7,lh=hAt(lx,lz);arLamps.push({x:lx,y:lh,z:lz,a:s.a})}
 if(trailBits){
  for(let k=0;k<22000&&arLamps.length<23;k++){
   const x=(hash(k,41.7)*2-1)*430,z=(hash(k,73.1)*2-1)*430;
   if(isTrail(x,z))continue;
   if(!(isTrail(x+2.4,z)||isTrail(x-2.4,z)||isTrail(x,z+2.4)||isTrail(x,z-2.4)))continue;
   const h=hAt(x,z);if(h<2.5||h>36||arNB(x,z))continue;
   if(window.__inLake&&window.__inLake(x,z))continue;
   if(Math.hypot(hAt(x+2,z)-hAt(x-2,z),hAt(x,z+2)-hAt(x,z-2))*.25>.35)continue;
   if(arSpots.some(s=>Math.hypot(s.x-x,s.z-z)<24))continue;
   if(arLamps.some(l=>Math.hypot(l.x-x,l.z-z)<42))continue;
   arLamps.push({x,y:h,z,a:hash(k,91.3)*6.283});
  }
 }
}
const arBulbMat=new THREE.MeshStandardMaterial({color:0x6e7a86,roughness:.28,metalness:.1,emissive:0xffb24d,emissiveIntensity:.04});
const arLights=[];
for(let i=0;i<(touch?2:3);i++){const pl=new THREE.PointLight(0xffb454,0,26,1.4);pl.castShadow=false;pl.userData.dyn=true;scene.add(pl);arLights.push(pl)}
{const wd=[.45,.3,.18],dk=[.12,.12,.14],N=arSpots.length,NL=arLamps.length,M4=new THREE.Matrix4(),Q4=new THREE.Quaternion(),E4=new THREE.Euler(),P4=new THREE.Vector3(),S4=new THREE.Vector3(1,1,1),
 mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true}),
 bI=new THREE.InstancedMesh(merge([arBox(1.7,.08,.5,0,.5,0,wd),arBox(1.7,.5,.06,0,.82,-.22,wd),arBox(.08,.5,.45,-.7,.25,0,dk),arBox(.08,.5,.45,.7,.25,0,dk)]),mat,Math.max(1,N)),
 lI=new THREE.InstancedMesh(merge([arBox(.1,2.7,.1,0,1.35,0,dk),arBox(.34,.08,.34,0,2.76,0,dk)]),mat,Math.max(1,NL)),
 uI=new THREE.InstancedMesh(new THREE.SphereGeometry(.18,10,8),arBulbMat,Math.max(1,NL)),gp=new Float32Array(Math.max(1,NL)*3);
 arSpots.forEach((s,i)=>{E4.set(0,s.a,0);Q4.setFromEuler(E4);M4.compose(P4.set(s.x,s.h,s.z),Q4,S4);bI.setMatrixAt(i,M4)});
 arLamps.forEach((l,i)=>{E4.set(0,l.a,0);Q4.setFromEuler(E4);M4.compose(P4.set(l.x,l.y,l.z),Q4,S4);lI.setMatrixAt(i,M4);M4.compose(P4.set(l.x,l.y+2.62,l.z),Q4,S4);uI.setMatrixAt(i,M4);gp[i*3]=l.x;gp[i*3+1]=l.y+2.62;gp[i*3+2]=l.z});
 bI.count=N;lI.count=NL;uI.count=NL;
 for(const m of[bI,lI,uI]){if(window.__boisComputeInstBounds)window.__boisComputeInstBounds(m);else m.frustumCulled=false;scene.add(m)}bI.castShadow=lI.castShadow=!touch;
 var arGP=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(gp,3)),new THREE.PointsMaterial({map:arGlow,size:8.5,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffca7a,fog:false,opacity:0}));arGP.frustumCulled=false;scene.add(arGP);
 if(N){const s=arSpots[0],tx=canvasTex(512,256,(x,w,h)=>{x.fillStyle='#4a3320';x.fillRect(0,0,w,h);x.strokeStyle='#c9a46a';x.lineWidth=8;x.strokeRect(10,10,w-20,h-20);x.fillStyle='#f3e3c3';x.textAlign='center';x.font='bold 46px Georgia,serif';x.fillText('Parque de los Cisnes',w/2,100);x.font='italic 28px Georgia,serif';x.fillText('Para Exneyder, tester oficial',w/2,160);x.fillText('de Bois.io  ·  2026',w/2,200)}),
  px=s.x-Math.sin(s.a)*3,pz=s.z-Math.cos(s.a)*3,ph=hAt(px,pz),pl=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.3),new THREE.MeshStandardMaterial({map:tx,roughness:.8,side:THREE.DoubleSide})),
  po=new THREE.Mesh(new THREE.BoxGeometry(.14,2.3,.14),new THREE.MeshStandardMaterial({color:0x2a1d12,roughness:.9}));
  // El plano queda en la cara frontal del poste: evita que su volumen opaque el panel 2D.
  pl.rotation.y=s.a+Math.PI;pl.position.set(px-Math.sin(s.a)*.18,ph+1.7,pz-Math.cos(s.a)*.18);po.position.set(px,ph+1.15,pz);po.castShadow=pl.castShadow=!touch;scene.add(pl,po)}}
// arcoíris
const arRing=new THREE.RingGeometry(1700,1770,96,7,0,Math.PI),arRc=[[.55,.2,.8],[.3,.3,.9],[.2,.6,.95],[.3,.85,.4],[.95,.9,.25],[1,.55,.2],[.95,.25,.2],[.95,.25,.2]];
{const n=arRing.attributes.position.count,col=new Float32Array(n*3);for(let i=0;i<n;i++)col.set(arRc[Math.min(7,(i/97)|0)],i*3);arRing.setAttribute('color',new THREE.BufferAttribute(col,3))}
const arRB=new THREE.Mesh(arRing,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,fog:false,toneMapped:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));arRB.renderOrder=-2;arRB.frustumCulled=false;arRB.visible=false;arRB.userData.dyn=1;scene.add(arRB);
let arRT=0,arArm=0,arRA=0,arSeen=0;
const _arNear=[];
function art(dt,tt){aurFrame(dt,tt);const st=WX.st,rain=st.rain||0,dk=Math.max(PC.night,PC.dusk*.72,Math.min(1,Math.max(0,(SKY.ov||0)-.32)*.7+(SKY.sc||0)*.45));
 if(rain>.35)arArm=1;if(arArm&&rain<.08&&SD.y>.05&&!uw){arArm=0;arRT=140;showMsg('🌈 Después de la tormenta… sale el arcoíris')}
 if(arRT>0)arRT-=dt;arRA+=((arRT>0&&rain<.2&&SD.y>.03?1:0)-arRA)*Math.min(1,dt*.5);
 arRB.visible=arRA>.01&&!uw;if(arRB.visible){arRB.material.opacity=.5*arRA;arRB.position.copy(cam.position).addScaledVector(SD,-1900);arRB.lookAt(cam.position)}
 const hideL=uw||(typeof PR!=='undefined'&&PR.on)||(window.__boisCh6&&window.__boisCh6.on);
 const lampK=hideL?0:Math.max(0,Math.min(1,dk*1.05));
 arBulbMat.emissiveIntensity=.04+lampK*2.5;
 arGP.material.opacity=Math.min(.95,lampK*1.1);arGP.visible=lampK>.02&&!uw;
 if(lampK<=.015||!arLamps.length){for(const pl of arLights)pl.intensity=0}
 else{
  _arNear.length=0;const cx=cam.position.x,cz=cam.position.z;
  for(let i=0;i<arLamps.length;i++){const l=arLamps[i],d2=(l.x-cx)*(l.x-cx)+(l.z-cz)*(l.z-cz);if(d2<3600)_arNear.push({l,d2,i})}
  _arNear.sort((a,b)=>a.d2-b.d2);
  for(let k=0;k<arLights.length;k++){
   const pl=arLights[k],hit=_arNear[k];
   if(!hit){pl.intensity=0;continue}
   const fade=Math.max(0,1-Math.sqrt(hit.d2)/58);
   pl.position.set(hit.l.x,hit.l.y+2.52,hit.l.z);
   pl.intensity=2.6*lampK*fade*(.975+.025*Math.sin(tt*2.1+hit.i*1.7));
  }
 }
 if(arSpots[0]){const d=Math.hypot(S.x-arSpots[0].x,S.z-arSpots[0].z);if(!arSeen&&d<10){arSeen=1;showMsg('🦢 Parque de los Cisnes · dedicado a Exneyder')}else if(d>45)arSeen=0}}
// sonidos de naturaleza (J): pájaros de día, grillos y búho de noche (sintetizados, sin archivos)
const MU={on:true,next:0,nc:0,no:0,bus:null};
addEventListener('keydown',e=>{if(e.code==='KeyU'&&!e.repeat&&S.on){MU.on=!MU.on;window.__saveBoisCfg?.();showMsg(MU.on?'🐦 Sonidos de naturaleza activados':'🐦 Sonidos de naturaleza apagados')}});
function musTick(){const C=AU.ctx;if(!C)return;const air=typeof __boisAirFactor==='function'?__boisAirFactor():1;const paused=!S.on&&!(typeof CIN!=='undefined'&&CIN.on);if(!AU.on||!MU.on||uw||paused||(typeof PR!=='undefined'&&PR.on)||(window.__boisCh6&&window.__boisCh6.on)||air<=.001){if(MU.bus)MU.bus.gain.setTargetAtTime(0,C.currentTime,.18);return}const t=C.currentTime,st=WX.st,rn=Math.max(st.rain||0,st.sc||0),nt=PC.night||0;
 if(MU.bus)MU.bus.gain.setTargetAtTime(.7*air,C.currentTime,.18);
 if(!MU.bus){const b=C.createGain(),d=C.createDelay(1),fb=C.createGain(),lp=C.createBiquadFilter();b.gain.value=.7;d.delayTime.value=.14;fb.gain.value=.22;lp.type='lowpass';lp.frequency.value=4500;b.connect(C.destination);b.connect(d);d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(C.destination);MU.bus=b}
 const out=(g,pan)=>{if(C.createStereoPanner){const p=C.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(MU.bus);return p}g.connect(MU.bus);return null};
 const tone=(at,f0,f1,dur,vol,pan)=>{if((typeof PR!=='undefined'&&PR.on)||(window.__boisCh6&&window.__boisCh6.on))return;const o=C.createOscillator(),g=C.createGain(),p=out(g,pan);o.type='sine';o.frequency.setValueAtTime(f0,at);o.frequency.exponentialRampToValueAtTime(f1,at+dur);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(vol,at+Math.min(.015,dur/3));g.gain.exponentialRampToValueAtTime(.0001,at+dur);o.connect(g);o.onended=()=>{o.disconnect();g.disconnect();if(p)p.disconnect()};o.start(at);o.stop(at+dur+.05)};
 if(t>=MU.next){const act=(1-nt)*(1-Math.min(1,rn*1.4));
  if(act>.25){const pan=Math.random()*1.6-.8,b=2200+Math.random()*1800,v=.028+Math.random()*.03,k=Math.random();
   if(k<.35){const n=2+(Math.random()*3|0);for(let i=0;i<n;i++)tone(t+i*.13,b*(1+i*.06),b*(1.35+i*.06),.09,v,pan)}
   else if(k<.6){const n=8+(Math.random()*8|0);for(let i=0;i<n;i++)tone(t+i*.05,b*1.2,b*1.2*(1.05+(i%2)*.12),.035,v*.7,pan)}
   else if(k<.85){tone(t,b*1.5,b,.14,v,pan);tone(t+.2,b*1.4,b*.9,.16,v,pan);if(Math.random()<.5)tone(t+.42,b*1.3,b*.85,.18,v*.9,pan)}
   else{tone(t,520,430,.35,v*1.6,pan);tone(t+.5,520,420,.4,v*1.6,pan)}
   MU.next=t+(1.2+Math.random()*3.5)/Math.max(.25,act)}else MU.next=t+2}
 if(nt>.3&&rn<.7&&t>=MU.nc){const pan=Math.random()*1.4-.7,f=4300+Math.random()*900;for(let i=0;i<3;i++)tone(t+i*.07,f,f*1.02,.05,.012+nt*.012,pan);MU.nc=t+.35+Math.random()*.8}
 if(nt>.5&&rn<.5&&t>=MU.no){const pan=Math.random()-.5;tone(t,420,360,.45,.05,pan);tone(t+.6,400,330,.6,.05,pan);MU.no=t+9+Math.random()*14}}
