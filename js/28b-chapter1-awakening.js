/* BOIS.IO · 28b-chapter1-awakening.js — Capítulo I · Escenografía, objetos y secuencia de despertar
   (Director de cámara, audio, filtros, estilos y títulos definidos en 28a-ch1-director.js) */

/* ───────── escenografía de la playa ───────── */
function ch1Decal(cx,cz,w,l,rot,tex,opacity,sw,sl){
  const pos=[],uv=[],idx=[];const cs=Math.cos(rot),sn=Math.sin(rot);
  for(let j=0;j<=sl;j++)for(let i=0;i<=sw;i++){
    const u=i/sw,v=j/sl,lx=(u-.5)*w,lz=(v-.5)*l;
    const x=cx+lx*cs+lz*sn,z=cz-lx*sn+lz*cs;
    pos.push(x,hAt(x,z)+.03,z);uv.push(u,1-v);
  }
  for(let j=0;j<sl;j++)for(let i=0;i<sw;i++){const a=j*(sw+1)+i,b=a+1,c=a+sw+1,d=c+1;idx.push(a,c,b,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:tex,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
  m.renderOrder=2;return m;
}
function ch1Dress(){
  if(CH1.dress)return CH1.dress;
  const grp=new THREE.Group();grp.name='ch1Dress';
  const rnd=ch1Rng(1307),{sf,rt}=ch1Dirs(),bx=BEACH[0],bz=BEACH[1];
  const P=(r,l)=>[bx+sf[0]*r+rt[0]*l,bz+sf[1]*r+rt[1]*l];
  /* huellas desde el lado del auto aparcado hasta el lugar del descanso */
  const sx0=bx-6.6,sz0=bz+10.2,tx0=bx-sf[0]*.45,tz0=bz-sf[1]*.45;
  const dxW=tx0-sx0,dzW=tz0-sz0,lenW=Math.hypot(dxW,dzW)||1;
  const uxW=dxW/lenW,uzW=dzW/lenW,rxW=uzW,rzW=-uxW;
  const heading=Math.atan2(uxW,uzW);
  const texFoot=ch1Tex(64,128,(c)=>{c.clearRect(0,0,64,128);c.shadowColor='rgba(24,17,10,.95)';c.shadowBlur=5;c.fillStyle='rgba(38,28,18,.92)';
    c.beginPath();c.ellipse(33,100,12,16,0,0,7);c.fill();
    c.beginPath();c.ellipse(36,66,13,24,.1,0,7);c.fill();
    c.beginPath();c.ellipse(32,46,16,17,0,0,7);c.fill();
    [[46,20,6.5],[37,13,5.5],[28,14,5],[20,19,4.5],[14,28,4]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.fill()});
    c.shadowBlur=0;c.strokeStyle='rgba(255,243,220,.28)';c.lineWidth=2;c.beginPath();c.ellipse(31,64,18,50,.05,0,7);c.stroke()});
  {const pos=[],uv=[],idx=[];let vi=0;const step=.72,n=Math.floor(lenW/step);
    for(let i=0;i<n;i++){
      const d=i*step,left=i%2===0;
      const lat=Math.sin(i*.45)*.22+(left?1:-1)*.18;
      const px=sx0+uxW*d+rxW*lat,pz=sz0+uzW*d+rzW*lat;if(hAt(px,pz)<1.6)continue;
      const rot=heading+Math.sin(i*.7)*.14,W=.15,L=.36,cs=Math.cos(rot),sn=Math.sin(rot);
      const cor=[[-1,-1],[1,-1],[1,1],[-1,1]];
      cor.forEach(([a,b])=>{const lx=a*W/2,lz=b*L/2,x=px+lx*cs+lz*sn,z=pz-lx*sn+lz*cs;pos.push(x,hAt(x,z)+.035,z);
        const uu=a>0?1:0,vv=b>0?1:0;uv.push(left?1-uu:uu,vv)});
      idx.push(vi,vi+1,vi+2,vi,vi+2,vi+3);vi+=4;
    }
    if(vi){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
      const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:texFoot,transparent:true,opacity:.78,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));m.renderOrder=2;grp.add(m)}}
  /* arena removida y manta tejida donde te recostaste frente al mar */
  {const tx=ch1Tex(64,64,(c)=>{c.clearRect(0,0,64,64);for(let k=0;k<80;k++){c.fillStyle='rgba(54,40,26,'+(.15+Math.random()*.3)+')';c.beginPath();c.arc(Math.random()*64,Math.random()*64,.6+Math.random()*1.4,0,7);c.fill()}});grp.add(ch1Decal(bx,bz,3.4,3.4,0,tx,.85,6,6))}
  {const texBlanket=ch1Tex(128,160,(c,w,h)=>{
    c.fillStyle='#c9b694';c.fillRect(0,0,w,h);
    c.fillStyle='#9b4d3a';c.fillRect(0,14,w,12);c.fillRect(0,h-26,w,12);
    c.fillStyle='#4f6468';c.fillRect(0,32,w,6);c.fillRect(0,h-38,w,6);
    c.fillStyle='rgba(45,32,20,.14)';
    for(let y=0;y<h;y+=6)c.fillRect(0,y,w,1);
    for(let x=0;x<w;x+=8)c.fillRect(x,0,1,h);
  });
  const [mx,mz]=P(-.15,.1);
  grp.add(ch1Decal(mx,mz,1.45,1.85,CH1.SEA_YAW+.18,texBlanket,.94,6,8))}
  /* pequeña fogata apagada con brasas suaves y humo tenue */
  {const [fx,fz]=P(2.1,-2.0),fh=hAt(fx,fz);
  if(fh>=1.65){
    const fg=new THREE.Group();fg.position.set(fx,fh,fz);
    const ash=new THREE.Mesh(new THREE.CircleGeometry(.48,14),new THREE.MeshStandardMaterial({color:0x1b1917,roughness:1}));
    ash.rotation.x=-Math.PI/2;ash.position.y=.02;fg.add(ash);
    const stMat=new THREE.MeshStandardMaterial({color:0x5f5c57,roughness:.92,flatShading:true});
    for(let i=0;i<8;i++){const a=i*Math.PI/4+rnd()*.2,r=.46+rnd()*.06;const st=new THREE.Mesh(new THREE.DodecahedronGeometry(.09+rnd()*.04,0),stMat);st.scale.set(1.2,.65,.9);st.position.set(Math.cos(a)*r,.04,Math.sin(a)*r);st.rotation.set(rnd(),a,rnd());fg.add(st)}
    const charMat=new THREE.MeshStandardMaterial({color:0x231d19,roughness:.96,flatShading:true});
    for(let i=0;i<3;i++){const a=i*1.05+.3,lg=new THREE.Mesh(new THREE.CylinderGeometry(.032,.042,.56,6),charMat);lg.position.set(Math.cos(a)*.06,.055,Math.sin(a)*.06);lg.rotation.set(Math.PI/2-.18,a,0);fg.add(lg)}
    const embMat=new THREE.MeshStandardMaterial({color:0x2b1812,emissive:0xff5518,emissiveIntensity:.75,roughness:.8});
    const emb=new THREE.Mesh(new THREE.SphereGeometry(.14,10,6),embMat);emb.scale.set(1.2,.25,1.1);emb.position.y=.03;fg.add(emb);
    const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:ch1GlowTex(),color:0xff7733,transparent:true,opacity:.26,blending:THREE.AdditiveBlending,depthWrite:false}));
    gl.scale.set(1.1,1.1,1);gl.position.y=.12;fg.add(gl);
    // humo sutil ascendente
    const SN=18,sp=new Float32Array(SN*3),sph=new Float32Array(SN);
    for(let i=0;i<SN;i++){sp[i*3]=(rnd()-.5)*.22;sp[i*3+1]=rnd()*2.2;sp[i*3+2]=(rnd()-.5)*.22;sph[i]=rnd()*6.28}
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
    const sm=new THREE.Points(sg,new THREE.PointsMaterial({size:.38,map:ch1GlowTex(),color:0xc8bfb4,transparent:true,opacity:.14,depthWrite:false}));
    sm.position.y=.12;fg.add(sm);
    CH1.smoke={pts:sm,pos:sp,ph:sph,N:SN};
    CH1.ember={mat:embMat,gl};grp.add(fg);
  }}
  /* motas doradas de atardecer flotando sobre la playa */
  {const MN=70,mp=new Float32Array(MN*3),mph=new Float32Array(MN);
    for(let i=0;i<MN;i++){
      const a=rnd()*6.283,d=1+rnd()*18,x=bx+Math.cos(a)*d,z=bz+Math.sin(a)*d;
      mp[i*3]=x;mp[i*3+1]=hAt(x,z)+.4+rnd()*3.6;mp[i*3+2]=z;mph[i]=rnd()*6.283;
    }
    const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(mp,3));
    const motes=new THREE.Points(mg,new THREE.PointsMaterial({size:.11,map:ch1GlowTex(),color:0xffe2b0,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false}));
    motes.frustumCulled=false;grp.add(motes);
    CH1.motes={pts:motes,pos:mp,ph:mph,N:MN};
  }
  /* troncos arrastrados por el mar */
  const bark=new THREE.MeshStandardMaterial({color:0x7a6a58,roughness:.95,flatShading:true});
  const logs=[[11.5,3.6,2.6,.5],[14.4,-3.9,2.0,2.4],[8.6,-6.2,1.6,1.1],[-4.5,3.0,1.2,.2]];
  logs.forEach(([r,l,len,rot])=>{const [x,z]=P(r,l);const h=hAt(x,z);if(h<1.7)return;
    const gg=new THREE.Group(),rad=.08+rnd()*.07;
    const lg=new THREE.Mesh(new THREE.CylinderGeometry(rad*.8,rad,len,7),bark);lg.rotation.z=Math.PI/2;gg.add(lg);
    const br=new THREE.Mesh(new THREE.CylinderGeometry(rad*.25,rad*.5,len*.35,5),bark);br.position.set(len*.1,rad*.8,0);br.rotation.z=.7;gg.add(br);
    gg.position.set(x,h+rad*.55,z);gg.rotation.y=rot;gg.rotation.z=(rnd()-.5)*.08;grp.add(gg)});
  /* rocas */
  const rock=new THREE.MeshStandardMaterial({color:0x6b6863,roughness:.9,flatShading:true});
  [[13,6.5,.55],[15.5,-1.2,.38],[9.5,8.5,.3],[5,-9,.45]].forEach(([r,l,s])=>{const [x,z]=P(r,l);const h=hAt(x,z);if(h<1.7)return;
    const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,0),rock);m.scale.set(1,.55+rnd()*.25,.8+rnd()*.3);m.position.set(x,h+s*.12,z);m.rotation.set(rnd(),rnd()*6,rnd());grp.add(m)});
  /* algas arrastradas */
  const sw=[new THREE.MeshStandardMaterial({color:0x2d3b21,roughness:1}),new THREE.MeshStandardMaterial({color:0x4b3d1f,roughness:1}),new THREE.MeshStandardMaterial({color:0x35472a,roughness:1})];
  for(let k=0;k<9;k++){const [x,z]=P(13.2+rnd()*3.4,(rnd()-.5)*11);const h=hAt(x,z);if(h<1.55)continue;
    for(let q=0;q<3;q++){const m=new THREE.Mesh(new THREE.SphereGeometry(.2+rnd()*.14,6,4),sw[(k+q)%3]);m.scale.set(1.4,.14,.55+rnd()*.3);m.position.set(x+(rnd()-.5)*.5,h+.02,z+(rnd()-.5)*.5);m.rotation.y=rnd()*6;grp.add(m)}}
  /* conchas */
  {const N=34,im=new THREE.InstancedMesh(new THREE.SphereGeometry(.05,6,4),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}),N),mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),col=new THREE.Color();
    const pal=[0xf1e7d3,0xe9c9b6,0xd9d2c4,0xf5efe2,0xc9a98f];let n=0;
    for(let k=0;k<N*3&&n<N;k++){const a=rnd()*6.283,d=1.5+rnd()*13,x=bx+Math.cos(a)*d,z=bz+Math.sin(a)*d,h=hAt(x,z);if(h<1.7||h>3.1)continue;
      e.set(rnd()*.4,rnd()*6,rnd()*.4);q.setFromEuler(e);const s=.7+rnd()*.9;sc.set(s,s*.5,s*.8);ps.set(x,h+.012,z);mt.compose(ps,q,sc);im.setMatrixAt(n,mt);
      if(im.setColorAt){col.setHex(pal[(rnd()*pal.length)|0]);im.setColorAt(n,col)}n++}
    im.count=n;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;grp.add(im)}
  scene.add(grp);CH1.dress=grp;return grp;
}

/* ───────── objetos: cámara y libreta ───────── */
function ch1GlowTex(){if(CH1._glow)return CH1._glow;return CH1._glow=ch1Tex(32,32,(c,w,h)=>{const g=c.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)})}
function ch1StarTex(){if(CH1._star)return CH1._star;return CH1._star=ch1Tex(64,64,(c,w,h)=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
  const hl=c.createLinearGradient(0,0,64,0);hl.addColorStop(0,'rgba(255,255,255,0)');hl.addColorStop(.5,'rgba(255,255,255,.9)');hl.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=hl;c.fillRect(0,30,64,4);
  const vl=c.createLinearGradient(0,0,0,64);vl.addColorStop(0,'rgba(255,255,255,0)');vl.addColorStop(.5,'rgba(255,255,255,.9)');vl.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=vl;c.fillRect(30,0,4,64)})}
function ch1BeamTex(){if(CH1._beam)return CH1._beam;return CH1._beam=ch1Tex(4,128,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,255,255,.28)');g.addColorStop(1,'rgba(255,255,255,.85)');c.fillStyle=g;c.fillRect(0,0,w,h)})}
function ch1Aura(color,beamH){
  const grp=new THREE.Group();
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.5,beamH,18,1,true),new THREE.MeshBasicMaterial({map:ch1BeamTex(),color,transparent:true,opacity:.34,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  beam.position.y=beamH/2;grp.add(beam);
  const N=46,pos=new Float32Array(N*3),ph=new Float32Array(N);
  for(let i=0;i<N;i++){const a=Math.random()*6.283,r=.15+Math.random()*.8;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=Math.random()*2.6;pos[i*3+2]=Math.sin(a)*r;ph[i]=Math.random()*6.283}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.07,map:ch1GlowTex(),color,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));
  pts.frustumCulled=false;grp.add(pts);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:ch1StarTex(),color:0xffffff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
  gl.scale.set(1.1,1.1,1);gl.position.y=.25;grp.add(gl);
  grp.userData={beam,pts,pos,ph,glint:gl,N};return grp;
}
function ch1MakeCamera(){
  const g=new THREE.Group(),m=new THREE.Group();
  const S_=(c,r,me,e,ei)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:me||0,emissive:e||0,emissiveIntensity:ei||0});
  const black=S_(0x1c1d21,.45,.25),silver=S_(0xaaaeb4,.28,.9),leather=S_(0x4b2f1c,.85),glass=S_(0x08161f,.04,.9,0x56b4e4,.6),red=S_(0xb4402c,.4,.3);
  const add=(geo,mat,x,y,z,rx,ry,rz)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);if(rx||ry||rz)o.rotation.set(rx||0,ry||0,rz||0);m.add(o);return o};
  add(new THREE.BoxGeometry(.32,.19,.1),black,0,0,0);
  add(new THREE.BoxGeometry(.335,.05,.106),silver,0,.118,0);
  add(new THREE.BoxGeometry(.07,.2,.116),leather,-.125,0,0);
  add(new THREE.BoxGeometry(.075,.045,.06),black,.07,.165,0);
  add(new THREE.CylinderGeometry(.019,.019,.022,10),red,-.115,.153,0);
  add(new THREE.CylinderGeometry(.075,.08,.1,20),black,.03,0,.1,Math.PI/2);
  add(new THREE.CylinderGeometry(.088,.088,.018,20),silver,.03,0,.158,Math.PI/2);
  add(new THREE.CylinderGeometry(.07,.07,.014,20),silver,.03,0,.19,Math.PI/2);
  add(new THREE.CircleGeometry(.056,20),glass,.03,0,.2);
  [[.03,.012,.2,.45,.07],[.045,-.01,.201,-.9,.045],[.012,-.02,.2005,1.4,.035]].forEach(([x,y,z,rz,l])=>add(new THREE.BoxGeometry(l,.003,.001),S_(0x9fc7dc,.2,.2,0x9fc7dc,.4),x,y,z,0,0,rz));
  const pts=[[-.16,-.075,0],[-.4,-.082,.14],[-.7,-.085,.1],[-1.0,-.083,-.12],[-1.3,-.085,-.1],[-1.55,-.083,.1]].map(p=>new THREE.Vector3(p[0],p[1],p[2]));
  const strap=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),26,.013,5),leather);m.add(strap);
  m.rotation.set(-.1,0,.14);g.add(m);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.5,.68,32),new THREE.MeshBasicMaterial({color:0x66ccff,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=-.08;g.add(ring);
  const aura=ch1Aura(0x7fd0ff,5.5);g.add(aura);
  g.userData={item:'camera',aura};return{g,ring};
}
function ch1MakeNotebook(){
  const g=new THREE.Group(),m=new THREE.Group();
  const S_=(c,r)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
  const leather=S_(0x3a2a20,.75),paper=S_(0xe9ddc2,.95),band=S_(0x7a2020,.6),wood=S_(0xc79a3e,.6);
  const add=(geo,mat,x,y,z,rx,ry,rz)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);if(rx||ry||rz)o.rotation.set(rx||0,ry||0,rz||0);m.add(o);return o};
  add(new THREE.BoxGeometry(.245,.008,.335),leather,0,-.014,0);
  add(new THREE.BoxGeometry(.245,.008,.335),leather,0,.014,0);
  add(new THREE.BoxGeometry(.222,.022,.318),paper,.006,0,0);
  add(new THREE.BoxGeometry(.026,.036,.335),leather,-.12,0,0);
  add(new THREE.BoxGeometry(.012,.038,.338),band,.06,0,0);
  add(new THREE.BoxGeometry(.012,.002,.09),band,.02,-.02,.2,0,0,.04);
  add(new THREE.CylinderGeometry(.0065,.0065,.18,6),wood,.2,-.006,.05,Math.PI/2,0,.3);
  add(new THREE.ConeGeometry(.0065,.022,6),S_(0x2b2420,.6),.19,-.006,-.04,Math.PI/2,0,.3);
  m.position.y=.02;m.rotation.set(0,0,-.05);g.add(m);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.5,32),new THREE.MeshBasicMaterial({color:0xffc068,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.01;g.add(ring);
  const aura=ch1Aura(0xffc070,4.2);g.add(aura);
  g.userData={item:'notebook',dyn:1,aura};return{g,ring};
}
function ch1PlaceItems(hidden){
  if(window.__awakeItems){const o=window.__awakeItems;if(o.cam)scene.remove(o.cam);if(o.nb)scene.remove(o.nb)}
  const {sf,rt}=ch1Dirs(),bx=BEACH[0],bz=BEACH[1];
  const A=ch1MakeCamera(),B=ch1MakeNotebook();
  const cx=bx+sf[0]*6.8+rt[0]*1.3,cz=bz+sf[1]*6.8+rt[1]*1.3;
  A.g.position.set(cx,ground(cx,cz,300)+.13,cz);A.g.rotation.y=.6;A.g.userData.baseY=A.g.position.y;
  const nx=bx-1.8,nz=bz+.8;
  B.g.position.set(nx,ground(nx,nz,300)+.02,nz);B.g.rotation.y=-.3;B.g.userData.baseY=B.g.position.y;
  scene.add(A.g,B.g);
  if(STORY.flags.gotCam)A.g.visible=false;
  if(STORY.flags.gotNb)B.g.visible=false;
  if(hidden){A.g.visible=false;B.g.visible=false}
  window.__awakeItems={cam:A.g,nb:B.g,camRing:A.ring,nbRing:B.ring};
  return window.__awakeItems;
}
function ch1AnimItems(t,dt){
  if(CH1.dress&&CH1.dress.visible){
    if(CH1.ember){
      const p=.65+.35*Math.sin(t*2.1)*.8+.15*Math.sin(t*5.7);
      CH1.ember.mat.emissiveIntensity=.45+.45*p;
      CH1.ember.gl.material.opacity=.14+.16*p;
    }
    if(CH1.smoke){
      const S_=CH1.smoke,a=S_.pos;
      for(let i=0;i<S_.N;i++){
        let y=a[i*3+1]+dt*(.28+.08*Math.sin(S_.ph[i]));
        if(y>2.4){y=0;a[i*3]=(Math.random()-.5)*.18;a[i*3+2]=(Math.random()-.5)*.18}
        a[i*3+1]=y;a[i*3]+=Math.sin(t*.9+S_.ph[i])*dt*.08;a[i*3+2]+=Math.cos(t*.7+S_.ph[i])*dt*.06;
      }
      S_.pts.geometry.attributes.position.needsUpdate=true;
    }
    if(CH1.motes){
      const M_=CH1.motes,a=M_.pos;
      for(let i=0;i<M_.N;i++){
        a[i*3]+=Math.sin(t*.35+M_.ph[i])*dt*.12;
        a[i*3+1]+=Math.cos(t*.45+M_.ph[i])*dt*.05;
        a[i*3+2]+=Math.cos(t*.3+M_.ph[i])*dt*.12;
      }
      M_.pts.geometry.attributes.position.needsUpdate=true;
    }
  }
  const it=window.__awakeItems;if(!it)return;
  [it.cam,it.nb].forEach((g,k)=>{
    if(!g||!g.visible)return;
    if(Math.hypot(S.x-g.position.x,S.z-g.position.z)>140)return;
    const u=g.userData.aura;if(!u)return;const d=u.userData;
    const pulse=.75+.25*Math.sin(t*2.4+k*1.7),fl=Math.max(0,Math.sin(t*5.3+k*2.1))*Math.max(0,Math.sin(t*1.9+k));
    d.beam.material.opacity=.22+.14*pulse;
    d.glint.scale.setScalar(.7+.7*pulse+fl*.9);d.glint.material.opacity=.55+.4*Math.max(pulse*.6,fl);
    const ring=k?it.nbRing:it.camRing;if(ring)ring.material.opacity=.2+.2*pulse;
    const a=d.pos;for(let i=0;i<d.N;i++){let y=a[i*3+1]+dt*(.12+.1*Math.sin(d.ph[i]+t));if(y>2.7)y=0;a[i*3+1]=y;a[i*3]+=Math.sin(t*.8+d.ph[i])*dt*.04;a[i*3+2]+=Math.cos(t*.7+d.ph[i])*dt*.04}
    d.pts.geometry.attributes.position.needsUpdate=true;
    g.position.y=g.userData.baseY+Math.sin(t*1.6+k)*.012;
  });
}
function ch1RevealItems(){
  const it=window.__awakeItems;if(!it)return;
  [it.cam,it.nb].forEach(g=>{if(g&&!(g===it.cam?STORY.flags.gotCam:STORY.flags.gotNb)){g.visible=true;g.scale.setScalar(.01)}});
  CH1.reveal={t:0};
}
function ch1RevealTick(dt){
  const r=CH1.reveal,it=window.__awakeItems;if(!r||!it)return;
  r.t+=dt;const u=Math.min(1,r.t/1.1),s=u<1?1+Math.sin(u*Math.PI)*.18*(1-u)-(1-u)*(1-u)*.99:1;
  [it.cam,it.nb].forEach(g=>{if(g&&g.visible)g.scale.setScalar(Math.max(.01,s))});
  if(u>=1){CH1.reveal=null;[it.cam,it.nb].forEach(g=>g&&g.scale.setScalar(1))}
}
function ch1Collect(g){CH1.col={g,t:0,from:g.position.clone(),py:g.position.y}}
function ch1CollectTick(dt){
  const c=CH1.col;if(!c)return;c.t+=dt;const u=Math.min(1,c.t/.9),e=u*u*(3-u*2);
  const fx=-Math.sin(S.yaw),fz=-Math.cos(S.yaw),tx=S.x+fx*.35,tz=S.z+fz*.35,ty=cam.position.y-.28;
  c.g.position.set(c.from.x+(tx-c.from.x)*e,c.from.y+(ty-c.from.y)*e+Math.sin(u*Math.PI)*.35,c.from.z+(tz-c.from.z)*e);
  c.g.scale.setScalar(Math.max(.02,1-e*.97));c.g.rotation.y+=dt*5;
  if(u>=1){c.g.visible=false;c.g.scale.setScalar(1);c.g.position.copy(c.from);CH1.col=null}
}

/* ───────── secuencia de despertar ───────── */
function ch1Begin(){
  CH1.intro=true;
  S.fly=false;S.sw=false;S.vy=0;S.on=false;
  S.x=BEACH[0];S.z=BEACH[1];CH1.gy=ground(S.x,S.z,300);S.y=CH1.gy;
  S.yaw=CH1.SEA_YAW;S.pitch=0;
  ch1Dress();ch1PlaceItems(true);
  window.__boisWakeLock=true;idleRendered=false;
  const sea=CH1.SEA_YAW;
  const c=CH1CAM.cur;c.x=S.x;c.y=CH1.gy+.27;c.z=S.z;c.yaw=sea+.7;c.pitch=1.18;c.roll=.16;c.fov=58;
  CH1CAM.tws.length=0;CH1CAM.sway=1;CH1CAM.shake=0;CH1CAM.on=true;
  cam.position.set(c.x,c.y,c.z);cam.rotation.set(c.pitch,c.yaw,c.roll,'YXZ');cam.fov=c.fov;cam.updateProjectionMatrix();cam.updateMatrixWorld();
  ch1Bars(true);
  ch1LidsClosed();
  CH1.filtT0=performance.now()+1e9;CH1.filt=false;ch1FilterSet(22,1.55,.85);
  const A=ch1AudioStart(true);if(A){ch1AudioLevel(.0,.1);setTimeout(()=>ch1AudioLevel(.35,3),700)}
  ch1TitleCards(ch1Wake);
}
function ch1Wake(){
  window.__boisWakeLock=false;
  storyFlag('awake',1);
  const sea=CH1.SEA_YAW,gy=CH1.gy;
  ch1AudioLevel(.55,2);
  playCinematic([
    {t:'El sonido de las olas llega primero.',auto:3700,on:()=>{ch1AudioLevel(.9,2.5);ch1Tinnitus(5.5)}},
    {t:'La luz se abre paso entre tus párpados. La imagen todavía está borrosa.',auto:4100,on:()=>{ch1LidsGo();ch1AudioOpen();ch1Pad([146.8,220,329.6,440],9.5,.048,true);ch1CamTo({yaw:sea+.42,pitch:.92,roll:.1},8.6)}},
    {t:'Abres los ojos. Arena bajo las manos. Cielo encima.',auto:4100},
    {t:'No recuerdas cómo regresaste a esta orilla, pero algo dentro de ti reconoce el lugar.',auto:4300,on:()=>{ch1CamTo({yaw:sea+.04,pitch:.17,roll:.07},4.8)}},
    {t:'Solo el viento, el agua y el eco de tu propia respiración.',auto:4500,on:()=>{ch1CamTo({yaw:sea-.55,pitch:.1,roll:.02},5)}},
    {t:'Te incorporas lentamente.',auto:3500,on:()=>{
      ch1HeartStop();ch1AudioLevel(.6,2);ch1SfxSand();ch1CamShake(.016);
      ch1CamTo({y:gy+.8,pitch:.08,roll:0,yaw:sea-.2},2.5,ch1EaseOut);
      setTimeout(()=>{if(CH1.intro){ch1CamShake(.01);ch1CamTo({y:gy+1.7,fov:72},2.4)}},2300)}},
    {t:'Cerca de ti, dos objetos brillan sobre la arena.',auto:3800,on:()=>{
      ch1RevealItems();auChime();
      const it=window.__awakeItems;
      if(it&&it.cam)ch1LookAt(it.cam.position.x,it.cam.position.y+.35,it.cam.position.z,2.6,{fov:68})}}
  ],ch1IntroDone,{location:'PLAYA · ATARDECER'});
}
function ch1IntroDone(){
  CH1.intro=false;
  const c=CH1CAM.cur;
  S.x=BEACH[0];S.z=BEACH[1];S.y=CH1.gy+.02;S.vy=0;S.yaw=c.yaw;S.pitch=Math.max(-1.2,Math.min(1.2,c.pitch));
  CH1CAM.on=false;CH1CAM.tws.length=0;CH1CAM.shake=0;ch1FilterClear();ch1Bars(false);
  const lids=document.getElementById('ch1Lids');if(lids)lids.remove();
  window.__boisWakeLock=false;
  ch1HeartStop();
  cam.position.set(S.x,S.y+1.7,S.z);cam.rotation.set(S.pitch,S.yaw,0,'YXZ');cam.updateMatrixWorld();
  showMsg('Explora. Hay algo cerca.');
  if(!touch&&$('c')&&$('c').requestPointerLock)$('c').requestPointerLock();
}

/* ───────── recoger objetos ───────── */
function ch1Near(g){return g&&g.visible&&Math.hypot(S.x-g.position.x,S.z-g.position.z)<2.5}
function ch1Interact(){
  const it=window.__awakeItems;if(!it||CH1.legacy)return false;
  if(!STORY.flags.gotCam&&ch1Near(it.cam)){ch1PickCamera(it);return true}
  if(!STORY.flags.gotNb&&ch1Near(it.nb)){ch1PickNotebook(it);return true}
  return false;
}
function ch1PickCamera(it){
  storyFlag('gotCam',1);const g=it.cam;
  ch1CamBegin(.45);ch1LookAt(g.position.x,g.position.y+.12,g.position.z,1.1,{fov:48});
  ch1SfxShutter();
  playCinematic([
    {t:'Una cámara fotográfica. La correa está gastada, pero se adapta a tu mano como si siempre hubiera sido tuya.',on:()=>ch1Collect(g)},
    {t:'Dentro quedan cuatro fotografías dañadas. Aunque el tiempo las borró en parte, todavía distinguen su forma:'},
    {t:'Un bosque. Unos edificios. Una piscina. Y una figura humana cuyo rostro se ha perdido.',on:()=>ch1Pad([196,293.7,392,493.9],6.5,.042,true)},
    {t:'El álbum aún tiene espacio. Sientes que hay más escenas dispersas por la isla.',on:()=>ch1CamTo({pitch:-.02,fov:72},2.4)}
  ],()=>{ch1CamEnd();showMsg('Guardaste la cámara. Pulsa V para volver a examinar sus fotografías.');openCameraGallery()},{location:'LA PLAYA'});
}
function ch1NoteEl(){
  let n=document.getElementById('ch1Note');
  if(!n){n=document.createElement('div');n.id='ch1Note';n.innerHTML='<div class="paper"><span class="tape"></span><p></p><em>primera página</em></div>';document.body.appendChild(n)}
  return n;
}
function ch1NoteShow(){CH1.noteOpen=true;const n=ch1NoteEl();n.querySelector('p').textContent='';void n.offsetHeight;n.classList.add('on')}
function ch1NoteWrite(){
  const n=ch1NoteEl(),p=n.querySelector('p'),txt='Si estás leyendo esto, significa que has vuelto.';let i=0;clearInterval(CH1.noteT);
  CH1.noteT=setInterval(()=>{i++;p.textContent=txt.slice(0,i);if(i%3===0)auHit(4200+Math.random()*900,.02,.035,'highpass');if(i>=txt.length)clearInterval(CH1.noteT)},62);
}
function ch1NoteHide(){clearInterval(CH1.noteT);CH1.noteOpen=false;const n=document.getElementById('ch1Note');if(n){n.classList.remove('on');setTimeout(()=>{if(!CH1.noteOpen)n.remove()},1000)}}
function ch1PickNotebook(it){
  storyFlag('gotNb',1);const g=it.nb;
  ch1CamBegin(.45);ch1LookAt(g.position.x,g.position.y+.05,g.position.z,1.1,{fov:50});
  ch1SfxPage();
  playCinematic([
    {t:'Una pequeña libreta. La primera página contiene una frase escrita a mano:',on:()=>{ch1Collect(g);ch1NoteShow()}},
    {t:'«Si estás leyendo esto, significa que has vuelto.»',who:'Libreta',on:()=>ch1NoteWrite()},
    {t:'La caligrafía es tuya. No entiendes todavía por qué regresaste, pero la guardas contigo.',on:()=>{ch1CamTo({pitch:-.02,fov:72},2.4)}}
  ],()=>{ch1NoteHide();ch1CamEnd();showMsg('Guardaste la libreta. Sus páginas se irán revelando al recordar (J).')},{location:'LA PLAYA'});
}

/* ───────── la isla y las dos torres ───────── */
function ch1VistaTick(dt){
  const F=STORY.flags;if(F.ch1_vista||!F.gotCam||!F.gotNb)return;
  if(!S.on||CIN.on||CH1.noteOpen||window.__boisGuideOverlayOpen||(typeof camAlbum!=='undefined'&&camAlbum.style.display!=='none')||(typeof CAR!=='undefined'&&CAR.on))return;
  CH1.vistaT+=dt;if(CH1.vistaT<1.6)return;CH1.vistaT=0;
  if(Math.hypot(S.x-BEACH[0],S.z-BEACH[1])>220){storyFlag('ch1_vista',1);return}
  ch1Vista();
}
function ch1Vista(){
  storyFlag('ch1_vista',1);
  ch1CamBegin(.5);
  const tx=-17,tz=-16.5,dx=tx-S.x,dz=tz-S.z,yaw=Math.atan2(-dx,-dz),dist=Math.hypot(dx,dz);
  const hi=Math.atan2(70-cam.position.y,dist);
  playCinematic([
    {t:'Levantas la vista. Más allá de la arena, la isla se extiende hasta las montañas.',auto:5000,on:()=>{ch1CamTo({yaw:yaw+.38,pitch:.05,fov:68},3.8)}},
    {t:'Bosques. Praderas. Caminos y construcciones entre los árboles.',auto:4200,on:()=>{ch1CamTo({yaw:yaw+.12,pitch:Math.min(.14,hi),fov:56},4.2)}},
    {t:'Y sobre el verde, dos torres de cristal sobresalen como agujas.',auto:5200,on:()=>{ch1CamTo({yaw:yaw,pitch:Math.max(.1,Math.min(.2,hi*1.4)),fov:38},5.6);ch1Pad([73.4,146.8,220,329.6,440],10.5,.055,true)}},
    {t:'La libreta y la cámara esperan llenar sus vacíos. Seis recuerdos quedaron repartidos por la isla.',auto:4400},
    {t:'Cerca de la arena también aguarda tu viejo auto. Recorre este lugar sin prisa.',auto:4600,on:()=>{
      const hasCar=typeof CAR!=='undefined'&&CAR&&CAR.g;
      const cx=hasCar?CAR.x:BEACH[0]-8,cz=hasCar?CAR.z:BEACH[1]+12,cy=hasCar?CAR.y:ground(cx,cz,300);
      if(Math.hypot(cx-S.x,cz-S.z)<65)ch1LookAt(cx,cy+.85,cz,2.8,{fov:64});
      else ch1CamTo({fov:72,pitch:.03},3.6);
    }}
  ],()=>{ch1CamEnd();showMsg('Capítulo I completado · Explora la isla')},{location:'LA ISLA'});
}

/* ───────── bucle (se llama desde drawWorld, también durante cinemáticas) ───────── */
function ch1Frame(){
  try{
    const now=performance.now();let dt=(now-CH1.last)/1000;CH1.last=now;if(!(dt>0)||dt>.1)dt=.016;
    if(typeof PR!=='undefined'&&PR.on)return;
    const t=now*.001;
    if(CH1CAM.on)ch1CamApply(dt,t);
    if(CH1.filt)ch1FilterTick(now);else if(!CH1.intro&&CH1._fSet){ch1FilterClear();CH1._fSet=false}
    if(CH1.dress&&(CH1.visT+=dt)>.5){CH1.visT=0;CH1.dress.visible=Math.hypot(S.x-BEACH[0],S.z-BEACH[1])<300}
    ch1AnimItems(t,dt);ch1RevealTick(dt);ch1CollectTick(dt);
    ch1AmbTick(now);ch1VistaTick(dt);
  }catch(e){ch1Warn('frame',e)}
}
// Partidas guardadas anteriores a la v131 que ya tenían cámara y libreta: no repetir la vista.
if(STORY.flags.gotCam&&STORY.flags.gotNb&&!STORY.flags.ch1_vista)STORY.flags.ch1_vista=1;