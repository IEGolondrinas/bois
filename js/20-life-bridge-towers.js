/* BOIS.IO · 20-life-bridge-towers.js — Vida ambiental, puente y torres gemelas
   (líneas 2078–2146 de BOIS_IO_v119_Optimizado.html) */
/* v53: vida ambiental — luciérnagas (noche), polen e insectos (día) y estrellas fugaces */
// v107: control de resolución adaptativa con histéresis para evitar oscilaciones visibles.
let __fpsLowTime=0,__fpsHighTime=0;
let LIFE=null,LIFE_OFF=false;
function mkLife(){const g=new THREE.Group();scene.add(g);const R_=Math.random;
 const VS='attribute float aP,aK,aOn;uniform float uT,uA,uS,uM;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float b=pow(max(sin(uT*(.8+aK*1.6)+aP*6.283),0.),2.);vA=mix(1.,b,uM)*uA*aOn;gl_PointSize=min(uS*(260./max(-mv.z,1.)),30.);}',
  FS='varying float vA;uniform vec3 uC;void main(){float r=length(gl_PointCoord-.5)*2.;float a=pow(max(1.-r,0.),2.)*vA;gl_FragColor=vec4(uC*a,1.);}';
 const mk=(N,col,size,mode,R,hmin,hmax)=>{const pos=new Float32Array(N*3),P=new Float32Array(N),K=new Float32Array(N),On=new Float32Array(N),S=[];
  for(let i=0;i<N;i++){P[i]=R_();K[i]=R_();S.push({x:0,z:0,h:hmin+R_()*(hmax-hmin),vx:0,vz:0,ph:R_()*6.283,first:true})}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('aP',new THREE.BufferAttribute(P,1));geo.setAttribute('aK',new THREE.BufferAttribute(K,1));const aOn=new THREE.BufferAttribute(On,1);aOn.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('aOn',aOn);
  const mat=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uA:{value:0},uS:{value:size},uM:{value:mode},uC:{value:new THREE.Color(col)}},vertexShader:VS,fragmentShader:FS,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),pts=new THREE.Points(geo,mat);pts.frustumCulled=false;g.add(pts);
  return{pts,geo,pos,On,aOn,S,mat,N,R,spd:mode>.5?1.1:2.2,place(s,i){for(let t=0;t<5;t++){const a=R_()*6.283,d=Math.sqrt(R_())*R;s.x=cam.position.x+Math.cos(a)*d;s.z=cam.position.z+Math.sin(a)*d;if(hAt(s.x,s.z)>WL+.5){On[i]=1;return}}On[i]=0}}};
 const ff=mk(touch?45:90,0xc8ff6a,2.2,1,38,.5,3),po=mk(touch?35:70,0xfff2b0,1.1,.35,34,.8,5);
 const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));lg.setAttribute('color',new THREE.BufferAttribute(new Float32Array([0,0,0,1,1,1]),3));
 const ml=new THREE.Line(lg,new THREE.LineBasicMaterial({vertexColors:true,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));ml.frustumCulled=false;ml.visible=false;g.add(ml);
 let mt=4+R_()*8,m=null;
 const run=(c,dt,tt,A)=>{c.mat.uniforms.uT.value=tt;c.mat.uniforms.uA.value=A;if(A<=.01)return;const cx=cam.position.x,cz=cam.position.z;
  for(let i=0;i<c.N;i++){const s=c.S[i];let dx=s.x-cx,dz=s.z-cz;if(s.first||dx*dx+dz*dz>c.R*c.R){s.first=false;c.place(s,i);dx=s.x-cx;dz=s.z-cz}
   s.vx+=Math.sin(tt*.7+s.ph*3)*dt*c.spd;s.vz+=Math.cos(tt*.6+s.ph*5)*dt*c.spd;s.vx*=1-dt*.8;s.vz*=1-dt*.8;s.x+=s.vx*dt;s.z+=s.vz*dt;
   const y=hAt(s.x,s.z)+s.h+Math.sin(tt*1.3+s.ph*7)*.35;c.pos[i*3]=s.x;c.pos[i*3+1]=y;c.pos[i*3+2]=s.z}
  c.geo.attributes.position.needsUpdate=true;c.aOn.needsUpdate=true};
 return{g,upd(dt,tt){const ov=Math.max(0,1-SKY.ov*1.6),n=PC.night,d=PC.dusk,sp=!!window.__boisSpecialDate;
   run(ff,dt,tt,Math.min(1,n*(sp?1.75:1.4)+d*.35)*ov);run(po,dt,tt,(1-n)*(1-d*.5)*Math.max(0,1-SKY.ov*1.8)*.55);
   mt-=dt;if(!m&&mt<=0){mt=sp?(2.5+R_()*5):(7+R_()*14);if(n>.7&&SKY.ov<.3){const a=R_()*6.283,e=.45+R_()*.5,D=new THREE.Vector3(R_()-.5,-.35-R_()*.3,R_()-.5).normalize();m={t:0,A:new THREE.Vector3(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)),D}}}
   if(m){m.t+=dt;const h=m.A.clone().multiplyScalar(2000).addScaledVector(m.D,m.t*900).add(cam.position),t=h.clone().addScaledVector(m.D,-220),p=lg.attributes.position.array;p[0]=t.x;p[1]=t.y;p[2]=t.z;p[3]=h.x;p[4]=h.y;p[5]=h.z;lg.attributes.position.needsUpdate=true;ml.material.opacity=Math.max(0,1-m.t/.9);ml.visible=true;if(m.t>.9){m=null;ml.visible=false}}}}}
function lifeFrame(dt,tt){if(LIFE_OFF)return;try{if(!LIFE)LIFE=mkLife();const on=!PR.on&&!uw;LIFE.g.visible=on;if(on)LIFE.upd(dt,tt)}catch(e){LIFE_OFF=true;console.error('Vida',e);if(LIFE)LIFE.g.visible=false}}
// ---------- v58: puente. Mejora de la losa negra original ("floor (1)": 141 x 10 m a ras del agua): cubierta de asfalto con marcas,
// bordillos, barandas, farolas, pilares hasta el fondo y dos torres con cables. La losa original se conserva debajo (como viga y como colisión).
{const BR={cx:99,cz:-174.4,ang:.98283,L:140.7,W:9.8,yt:1.97,yb:1.43},hw=BR.W/2,hl=BR.L/2,yt=BR.yt,cs=Math.cos(BR.ang),sn=Math.sin(BR.ang);
 const g=new THREE.Group();g.position.set(BR.cx,0,BR.cz);g.rotation.y=BR.ang;scene.add(g);
 const W2=(x,z)=>[BR.cx+x*cs+z*sn,BR.cz-x*sn+z*cs];   // coordenadas locales (x a lo largo, z a lo ancho) -> mundo
 const stdM=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m||0});
 const add=(geo,mat,x,y,z,sh)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!!sh;m.receiveShadow=true;g.add(m);return m};
 // cubierta: asfalto con ruido, líneas de borde y línea central discontinua
 const dk=canvasTex(2048,256,(x,w,h)=>{x.fillStyle='#2c2e33';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=40+Math.random()*40|0;x.fillStyle=`rgba(${v},${v},${v+3},.35)`;x.fillRect(Math.random()*w,Math.random()*h,2,2)}
  x.fillStyle='#e9e6dc';x.fillRect(0,h*.045,w,5);x.fillRect(0,h*.955-5,w,5);const dl=3/BR.L*w;x.fillStyle='#f0c93a';for(let p=dl*.5;p<w;p+=dl*2)x.fillRect(p,h/2-3,dl,6)});
 add(new THREE.PlaneGeometry(BR.L,BR.W).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:dk,roughness:.92}),0,yt+.03,0);
 // bordillos
 const cm=stdM(0xb9b6ae,.9);for(const s of[-1,1])add(new THREE.BoxGeometry(BR.L,.28,.55),cm,0,yt+.14,s*(hw-.27));
 // barandas: postes instanciados + dos pasamanos
 const sm=stdM(0x8d949a,.45,.6),np=Math.floor(BR.L/3)+1,posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,1.1,.12),sm,np*2),M4=new THREE.Matrix4();
 for(let i=0,k=0;i<np;i++)for(const s of[-1,1])posts.setMatrixAt(k++,M4.makeTranslation(-hl+i*(BR.L/(np-1)),yt+.83,s*(hw-.1)));
 posts.frustumCulled=false;g.add(posts);
 for(const s of[-1,1])for(const y of[.55,1.0])add(new THREE.BoxGeometry(BR.L,.07,.07),sm,0,yt+.28+y,s*(hw-.1));
 // farolas (cabeza emisiva) alternadas a cada lado
 const hm=new THREE.MeshBasicMaterial({color:0xfff0c4}),pm=stdM(0x4b4f55,.5,.5);
 for(let x=-hl+12,i=0;x<hl-8;x+=23,i++){const s=i%2?1:-1,zz=s*(hw-.25);add(new THREE.CylinderGeometry(.07,.09,5.2,8),pm,x,yt+2.88,zz);add(new THREE.BoxGeometry(.1,.08,1.1),pm,x,yt+5.4,zz-s*.5);add(new THREE.BoxGeometry(.24,.12,.5),hm,x,yt+5.33,zz-s*1.0)}
 // pilares de concreto hasta el fondo
 const pc=stdM(0xb2aea5,.95),pier=(x,z,r0,r1)=>{const w=W2(x,z),bed=hAt(w[0],w[1]),h=BR.yb-bed+.4;if(h>.4)add(new THREE.CylinderGeometry(r0,r1,h,10),pc,x,bed-.2+h/2,z,true)};
 for(let x=-hl+10;x<hl-5;x+=18)for(const s of[-1,1])pier(x,s*(hw-1.3),.55,.7);
 // dos torres con cables (atirantado)
 const tw=stdM(0xcfcac0,.9),px2=[-hl*.36,hl*.36],cp=[];
 for(const px of px2){for(const s of[-1,1]){add(new THREE.BoxGeometry(.9,24+yt-BR.yb+1.5,1),tw,px,(BR.yb-1.5+yt+24)/2,s*(hw+.6),true);pier(px,s*(hw+.6),1.1,1.4)}
  add(new THREE.BoxGeometry(.9,.7,2*(hw+.6)+1),tw,px,yt+23.6,0,true);add(new THREE.BoxGeometry(.9,.5,2*(hw+.6)+1),tw,px,yt+14,0,true);
  for(const s of[-1,1])for(let d=6;d<=50;d+=6)for(const q of[-1,1]){const x=px+q*d;if(Math.abs(x)>hl-1)continue;cp.push(px,yt+22.8,s*(hw+.6),x,yt+.4,s*(hw-.1))}}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));const cb=new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:0xe7ebee}));cb.frustumCulled=false;g.add(cb)}
// ---------- v59: torres gemelas del centro: fachada de vidrio con retícula, ventanas que se encienden de noche,
// balizas rojas parpadeantes y haces de luz hacia el cielo. (Las estructuras originales quedan visibles dentro del vidrio.)
{const TWR=[[-46.67, -24.97, -27.23, -6.53, 4.0, 110.17], [-10.09, 11.61, -26.6, -5.9, 4.0, 110.17]],glowM=[],bcM=new THREE.SpriteMaterial({map:sunTex,color:0xff2a1a,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}),
 bmM=new THREE.MeshBasicMaterial({color:0xcfe6ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}),beams=[];
 TWR.forEach((q,k)=>{const [x0,x1,z0,z1,y0,y1_]=q,w=x1-x0,d=z1-z0,h=y1_-y0,cx=(x0+x1)/2,cz=(z0+z1)/2,cy=(y0+y1_)/2,rs=(a=>()=>(a=(a*16807)%2147483647)/2147483647)(97+k*31);
  const gT=canvasTex(256,1024,(x,W,H)=>{const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#b4d9ec');g.addColorStop(1,'#6a9dbd');x.fillStyle=g;x.fillRect(0,0,W,H);for(let r=0;r<17;r++){x.fillStyle='rgba(28,46,64,.5)';x.fillRect(0,r*H/17,W,H/17*.2)}x.strokeStyle='rgba(236,246,252,.8)';x.lineWidth=3;for(let i=0;i<=7;i++){x.beginPath();x.moveTo(i*W/7,0);x.lineTo(i*W/7,H);x.stroke()}}),
  eT=canvasTex(256,1024,(x,W,H)=>{x.fillStyle='#000';x.fillRect(0,0,W,H);for(let c=0;c<7;c++)for(let r=0;r<17;r++)if(rs()>.4){x.fillStyle=rs()>.5?'#ffd89a':'#ffe9bf';x.fillRect(c*W/7+4,r*H/17+4,W/7-8,H/17-8)}});
  const sk=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({map:gT,transparent:true,opacity:.93,roughness:.12,metalness:.3,side:THREE.DoubleSide,depthWrite:false}));sk.position.set(cx,cy,cz);sk.renderOrder=1;scene.add(sk);
  const gm=new THREE.MeshBasicMaterial({map:eT,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0});glowM.push(gm);
  const gl=new THREE.Mesh(new THREE.BoxGeometry(w+.2,h,d+.2),gm);gl.position.set(cx,cy,cz);gl.renderOrder=2;scene.add(gl);
  for(const sx of[-1,1])for(const sz of[-1,1]){const s=new THREE.Sprite(bcM);s.scale.setScalar(16);s.position.set(cx+sx*(w/2-.5),y1_+1,cz+sz*(d/2-.5));scene.add(s)}
  const bm=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,520,16,1,true),bmM);bm.position.set(cx,y1_+260,cz);bm.frustumCulled=false;scene.add(bm);beams.push(bm);
  // v153: estructura y coronación (solo visual): aristas, bandas de pisos, parapeto, remate escalonado y antena
  {const cm=new THREE.MeshStandardMaterial({color:0x56697a,roughness:.4,metalness:.65}),tg=new THREE.MeshStandardMaterial({color:0x9bc9df,roughness:.15,metalness:.3,transparent:true,opacity:.55,depthWrite:false}),
   ad=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);scene.add(m);return m};
   for(const sx of[-1,1])for(const sz of[-1,1])ad(new THREE.BoxGeometry(.7,h,.7),cm,cx+sx*(w/2+.05),cy,cz+sz*(d/2+.05));
   for(let b=1;b<6;b++)ad(new THREE.BoxGeometry(w+.5,.5,d+.5),cm,cx,y0+h*b/6,cz);
   ad(new THREE.BoxGeometry(w+.9,1.1,d+.9),cm,cx,y1_+.55,cz);
   ad(new THREE.BoxGeometry(w*.72,5,d*.72),tg,cx,y1_+3.6,cz);
   ad(new THREE.BoxGeometry(w*.42,4,d*.42),cm,cx,y1_+8.6,cz);
   ad(new THREE.CylinderGeometry(.12,.2,16,8),cm,cx,y1_+18.6,cz)}});

// ---------- v141: pasarela aérea exterior entre las torres gemelas.
// Es arquitectura ambiental: no añade puertas, triggers ni acceso jugable.
// La única entrada narrativa a las torres sigue siendo la puerta del Capítulo VI.
{
 const A=TWR[0],B=TWR[1];
 const ax=A[1],bx=B[0],zA=(A[2]+A[3])/2,zB=(B[2]+B[3])/2;
 const x0=ax-.55,x1=bx+.55,cx=(x0+x1)/2,L=x1-x0,cz=(zA+zB)/2;
 const y=A[4]+(A[5]-A[4])*.57,deckY=y;
 const steel=new THREE.MeshStandardMaterial({color:0x657987,roughness:.38,metalness:.72});
 const darkSteel=new THREE.MeshStandardMaterial({color:0x263642,roughness:.5,metalness:.62});
 const glass=new THREE.MeshPhysicalMaterial({color:0x9bc9df,roughness:.16,metalness:.18,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false});
 const floor=new THREE.MeshStandardMaterial({color:0x273d4a,roughness:.34,metalness:.48});
 const glow=new THREE.MeshBasicMaterial({color:0x9de5f2,transparent:true,opacity:.72});
 const addBridge=(geo,mat,x,y0,z,order=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y0,z);m.castShadow=true;m.receiveShadow=true;m.renderOrder=order;scene.add(m);return m};
 // Viga-cajón inferior y pavimento continuo que entra ligeramente en ambas fachadas.
 addBridge(new THREE.BoxGeometry(L,.5,7.4),darkSteel,cx,deckY-.18,cz);
 addBridge(new THREE.BoxGeometry(L-.25,.12,6.9),floor,cx,deckY+.105,cz);
 addBridge(new THREE.BoxGeometry(L-.8,.035,4.6),glass,cx,deckY+.18,cz,3);
 // Costillas inferiores visibles desde el exterior.
 for(let x=x0+1.1;x<x1-.4;x+=2.1){
  addBridge(new THREE.BoxGeometry(.16,1.25,.16),steel,x,deckY-.72,cz-3.15);
  addBridge(new THREE.BoxGeometry(.16,1.25,.16),steel,x,deckY-.72,cz+3.15);
  addBridge(new THREE.BoxGeometry(2.15,.13,.13),steel,x+.95,deckY-1.25,cz);
 }
 // Laterales acristalados, divididos en módulos para dar escala arquitectónica.
 for(const side of[-1,1]){
  const zz=cz+side*3.48;
  addBridge(new THREE.BoxGeometry(L-.45,2.55,.12),glass,cx,deckY+1.42,zz,2);
  addBridge(new THREE.BoxGeometry(L,.13,.18),steel,cx,deckY+.34,zz);
  addBridge(new THREE.BoxGeometry(L,.16,.2),steel,cx,deckY+2.72,zz);
  for(let x=x0+.5;x<x1-.2;x+=2.25)
   addBridge(new THREE.BoxGeometry(.075,2.5,.1),steel,x,deckY+1.42,zz);
  // línea de luz cálida y discreta bajo el pasamanos
  addBridge(new THREE.BoxGeometry(L-.8,.035,.045),glow,cx,deckY+.48,zz-side*.12,4);
 }
 // Cubierta ligera: dos largueros y lamas superiores, sin cerrar visualmente el puente.
 for(const side of[-1,1]){
  addBridge(new THREE.BoxGeometry(L,.16,.22),darkSteel,cx,deckY+2.92,cz+side*3.45);
 }
 for(let x=x0+1;x<x1-.4;x+=2.25)
  addBridge(new THREE.BoxGeometry(.09,.09,6.8),steel,x,deckY+3.02,cz);
 // Marcos de unión en las fachadas: hacen que el puente parezca anclado a ambas torres.
 for(const x of[ax-.1,bx+.1]){
  addBridge(new THREE.BoxGeometry(.34,3.25,8.05),steel,x,deckY+1.35,cz);
  addBridge(new THREE.BoxGeometry(.48,.12,8.25),glow,x,deckY+2.95,cz,4);
 }
}

 WIN.upd=(p,tt)=>{const n=Math.max(p.night,p.dusk*.55);WIN.u.value=n;WIN.t.value=tt;for(const m of glowM)m.opacity=Math.min(1,n*1.15);bmM.opacity=n*.22;for(const b of beams)b.visible=n>.03;bcM.opacity=.35+.65*(Math.sin(tt*2.4)>.55?1:.18)}}
