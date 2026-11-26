/* BOIS.IO · 10-lighting-time.js — Luz, atmósfera del bosque, ciclo día/noche
   (líneas 1238–1350 de BOIS_IO_v119_Optimizado.html) */
const hemi=new THREE.HemisphereLight(0xffffff,0x555544,.6),sun=new THREE.DirectionalLight(0xffffff,2);
sun.castShadow=true;sun.shadow.mapSize.set(touch?1024:2048,touch?1024:2048);const sc=sun.shadow.camera;sc.left=sc.bottom=-72;sc.right=sc.top=72;sc.near=1;sc.far=400;sun.shadow.bias=-.00025;sun.shadow.normalBias=.12;sun.shadow.radius=2.2;

scene.add(hemi,sun,sun.target);scene.fog=new THREE.FogExp2(0xbcd3e6,.0012);
// v91 — atmósfera viva: haces de sol suaves y polvo suspendido en el aire.
// Son efectos ligeros, independientes del mapa y con intensidad adaptativa.
const forestMood=new THREE.Group();scene.add(forestMood);
const dustN=touch?65:150,dustPos=new Float32Array(dustN*3),dustVel=[];
for(let i=0;i<dustN;i++){
 dustPos[i*3]=(Math.random()-.5)*34;dustPos[i*3+1]=(Math.random()-.5)*17;
 dustPos[i*3+2]=(Math.random()-.5)*34;
 dustVel.push([(Math.random()-.5)*.16,Math.random()*.10+.015,(Math.random()-.5)*.16]);
}
const dustGeo=new THREE.BufferGeometry(),dustAttr=new THREE.BufferAttribute(dustPos,3);
dustAttr.setUsage(THREE.DynamicDrawUsage);dustGeo.setAttribute('position',dustAttr);
const dustMat=new THREE.PointsMaterial({color:0xffe7bd,size:touch?.075:.095,transparent:true,opacity:0,
 depthWrite:false,sizeAttenuation:true,fog:false});
const forestDust=new THREE.Points(dustGeo,dustMat);forestDust.frustumCulled=false;forestMood.add(forestDust);
let birdWait=9+Math.random()*9;
function forestBirds(dt){
 if(!AU.ctx||!AU.on||!S.on||uw||!PC||PR.on||(window.__boisCh6&&window.__boisCh6.on))return;
 const rain=(WX.st&&WX.st.rain)||0,storm=(WX.st&&WX.st.sc)||0;
 const activity=Math.max(0,1-PC.night*1.35)*(1-rain*.92)*(1-storm*.85);
 birdWait-=dt*activity;
 if(birdWait>0)return;
 birdWait=11+Math.random()*17;
 const C=AU.ctx,now=C.currentTime,root=C.createGain();
 root.gain.setValueAtTime(.0001,now);root.gain.linearRampToValueAtTime(.012+Math.random()*.009,now+.035);
 root.gain.exponentialRampToValueAtTime(.0001,now+.48);
 root.connect(C.destination);
 const notes=2+(Math.random()*2|0),start=now;
 for(let i=0;i<notes;i++){
  const osc=C.createOscillator(),g=C.createGain(),t=start+i*(.105+Math.random()*.045);
  osc.type='sine';osc.frequency.setValueAtTime(1900+Math.random()*1000,t);
  osc.frequency.exponentialRampToValueAtTime(1250+Math.random()*900,t+.085);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(1,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.105);
  osc.connect(g);g.connect(root);osc.start(t);osc.stop(t+.12);
  osc.onended=()=>{osc.disconnect();g.disconnect()};
 }
 setTimeout(()=>{try{root.disconnect()}catch(e){typeof __bw==='function'&&__bw('10-lighting-time#1',e)}},800);
}
function updateForestMood(dt,tt){
 if(!PC||uw||PR.on||(window.__boisCh6&&window.__boisCh6.on)){forestMood.visible=false;return}
 forestMood.visible=true;forestMood.position.set(cam.position.x,0,cam.position.z);
 const st=WX.st||{},night=Math.max(0,Math.min(1,PC.night||0));
 const arr=dustGeo.attributes.position.array,wind=(st.wind||0)*.18;
 const visibility=Math.max(0,1-night*.72)*(1-(st.rain||0)*.75)*(1-(st.sc||0)*.8);
 dustMat.opacity=(.16+.08*Math.sin(tt*.35))*visibility;
 for(let i=0;i<dustN;i++){
  const k=i*3,v=dustVel[i];
  arr[k]+= (v[0]+wind)*dt;arr[k+1]+=v[1]*dt;arr[k+2]+=v[2]*dt;
  if(arr[k]>17)arr[k]=-17;if(arr[k]<-17)arr[k]=17;
  if(arr[k+1]>9)arr[k+1]=-8;
  if(arr[k+2]>17)arr[k+2]=-17;if(arr[k+2]<-17)arr[k+2]=17;
 }
 dustGeo.attributes.position.needsUpdate=true;
 forestBirds(dt);
}

const P=[
 {n:'Mediodía',sd:[-.45,.8,.4],md:[-.4,-.45,-.5],dir:[-.45,.8,.4],sc:[1,.94,.79],si:2.35,hs:[.72,.84,1],hg:[.4,.42,.32],hi:.75,top:[.035,.23,.78],mid:[.16,.50,.97],hor:[.72,.90,1],fog:[.70,.84,.95],ex:1,dusk:0,night:0,mk:0,cc:[1,1,1]},
 {n:'Atardecer',sd:[-.8,.11,.35],md:[.8,.09,-.35],dir:[-.8,.18,.35],sc:[1,.48,.22],si:2.65,hs:[.95,.7,.55],hg:[.3,.26,.3],hi:.55,top:[.05,.065,.28],mid:[.42,.16,.53],hor:[1,.28,.16],fog:[1,.52,.34],ex:1.05,dusk:1,night:.12,mk:.55,cc:[1,.72,.58]},
 {n:'Noche',sd:[-.5,-.35,.4],md:[.3,.5,-.6],dir:[.3,.5,-.6],sc:[.50,.62,1],si:.42,hs:[.2,.27,.5],hg:[.06,.07,.1],hi:.45,top:[.002,.006,.028],mid:[.009,.02,.085],hor:[.035,.075,.16],fog:[.055,.09,.18],ex:1.1,dusk:0,night:1,mk:1,cc:[.20,.26,.42]},
 {n:'Amanecer',sd:[.8,.13,.35],md:[-.8,.1,-.35],dir:[.8,.2,.35],sc:[1,.62,.48],si:2.25,hs:[.85,.78,.85],hg:[.32,.3,.3],hi:.55,top:[.095,.15,.45],mid:[.52,.30,.67],hor:[1,.48,.43],fog:[1,.68,.61],ex:1.02,dusk:1,night:.3,mk:.6,cc:[1,.80,.76]}];
// v25: ciclo de día automático. TM.mode 0 = Automático (el día avanza solo), 1-4 = fase fija elegida a mano.
// HOLD = segundos que se mantiene cada fase (mediodía, atardecer, noche, amanecer); entre fases el cielo se funde durante 45 s.
let tod=0,PC=null,trF=null,trT=1,trD=3.2;const TM={mode:0,timer:0},HOLD=[150,50,100,50],TNAMES=['Automático','Mediodía','Atardecer','Noche','Amanecer'];const SD=new THREE.Vector3(),MD=new THREE.Vector3(),SKY={ov:0},cp_=p=>JSON.parse(JSON.stringify(p));
function lerpP(o,a,b,e){for(const k in b){const x=a[k],y=b[k];if(typeof y==='number')o[k]=x+(y-x)*e;else if(Array.isArray(y))o[k]=y.map((v,i)=>x[i]+(v-x[i])*e);else o[k]=y}}
function skyStep(dt){if(!scene.background)scene.background=new THREE.Color();if(TM.mode===0){TM.timer-=dt;if(TM.timer<=0)setTod((tod+1)%P.length,true)} if(trT<1){trT=Math.min(1,trT+dt/trD);lerpP(PC,trF,P[tod],trT*trT*(3-2*trT))}
 if(!sun.userData.d)sun.userData.d=new THREE.Vector3();sun.userData.d.set(...PC.dir).normalize();if(!uw)scene.background.setRGB(...PC.fog).convertSRGBToLinear();return PC}
const SCP={top:[.15,.10,.26],mid:[.31,.40,.33],hor:[.62,.68,.42]};// paleta supercélula: violeta profundo / gris verdoso / resplandor amarillo-verde
function scMix(a,k,nl,c){return a.map((v,i)=>v+(c[i]*nl-v)*k)}
function skyFrame(dt,tt){const u=sky.material.uniforms,p=PC;SD.set(...p.sd).normalize();MD.set(...p.md).normalize();
 u.uSun.value.copy(SD);u.uMoon.value.copy(MD);{const k=Math.min(1,(SKY.sc||0)*1.05),nl=1-p.night*.82;u.uTop.value.set(...(k>.001?scMix(p.top,k,nl,SCP.top):p.top));u.uMid.value.set(...(k>.001?scMix(p.mid,k,nl,SCP.mid):p.mid));u.uHor.value.set(...(k>.001?scMix(p.hor,k,nl,SCP.hor):p.hor))}u.uSc.value.set(...p.sc);u.uDusk.value=p.dusk;u.uNight.value=p.night;u.uMoonK.value=p.mk;u.uOv.value=SKY.ov;u.uCs.value=SKY.sc||0;if(WIN.upd&&PERF.win>=3){WIN.upd(p,tt);PERF.win=0}u.uTime.value=tt;
 const su=stars.material.uniforms;stars.position.copy(cam.position);su.uT.value=tt;su.uD.value=R.getPixelRatio();su.uA.value=Math.min(1,p.night*1.25)*Math.max(0,1-SKY.ov*1.8-(SKY.sc||0)*.9);
 for(const c of clouds){const k=c.userData;k.az+=dt*k.sp;const ce=Math.cos(k.el),sx=Math.sin(k.az)*ce,sy=Math.sin(k.el),sz=Math.cos(k.az)*ce;c.position.set(cam.position.x+sx*1800,cam.position.y+sy*1800,cam.position.z+sz*1800);
  const sunDot=sx*SD.x+sy*SD.y+sz*SD.z,lf=Math.pow(Math.max(0,sunDot),1.35),dk=p.dusk;const shadow=Math.max(.42,Math.min(1.18,.62+lf*.7-dk*.12+Math.max(-sunDot,0)*.08)),warm=dk*(.12+lf*.22);c.material.color.setRGB(shadow+warm,shadow*.985+warm*.3,shadow*.98+lf*.05).multiply(cloudMat.color);c.material.opacity=Math.min(1,cloudMat.opacity*k.k)}}
function setTod(i,slow){if(!scene.background)scene.background=new THREE.Color();if(uw&&!slow)setUW(false);tod=i%P.length;trD=slow?45:3.2;TM.timer=trD+HOLD[tod];if(!PC){PC=cp_(P[tod]);trT=1}else{trF=cp_(PC);trT=0}if(!sun.userData.d)sun.userData.d=new THREE.Vector3();sun.userData.d.set(...PC.dir).normalize();showMsg(P[tod].n)}
// H / botón Hora: recorre Automático → Mediodía → Atardecer → Noche → Amanecer. Elegir una fase la deja fija; Automático reanuda el ciclo.
function todCycle(){TM.mode=(TM.mode+1)%TNAMES.length;if(TM.mode===0){TM.timer=Math.max(15,HOLD[tod]*.6);showMsg('Hora: Automático (el día avanza solo)')}else{setTod(TM.mode-1);showMsg('Hora: '+TNAMES[TM.mode]+' (fija)')}}
let uw=false;const UWC=lin(.07,.42,.5),uwF=new THREE.Color(),uwB=new THREE.Color();
function setUW(v){if(v===uw)return;uw=v;$('uwv').style.display=v?'block':'none';
 if(v){uwF.copy(scene.fog.color);uwB.copy(scene.background);scene.fog.color.copy(UWC);scene.background.copy(UWC);scene.fog.density=.035}
 else{scene.fog.color.copy(uwF);scene.background.copy(uwB);scene.fog.density=.0012}
 cam.far=v?160:2600;cam.updateProjectionMatrix();sky.visible=sunSpr.visible=!v;for(const c of clouds)c.visible=!v;stars.visible=!v&&!!PC&&PC.night>.02}
