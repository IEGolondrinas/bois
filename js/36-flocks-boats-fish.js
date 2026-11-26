/* BOIS.IO · 36-flocks-boats-fish.js — Bandadas, veleros y peces saltarines
   (líneas 3695–3738 de BOIS_IO_v119_Optimizado.html) */
// ---- v62: más vida: bandadas de aves, veleros en el lago y peces que saltan ----
{let LIFE=()=>{};try{
 const rnd=(a,b)=>a+Math.random()*(b-a),nf=p=>Math.max(p.night||0,(p.dusk||0)*.55),inM=(x,z)=>Math.abs(x)<470&&Math.abs(z)<470;
 // aves en V (de día)
 const NB=9,bg=new THREE.BufferGeometry(),bp=new Float32Array(NB*18);bg.setAttribute('position',new THREE.BufferAttribute(bp,3));
 const bmat=new THREE.MeshBasicMaterial({color:0x1d2630,side:THREE.DoubleSide,transparent:true,opacity:.85}),bm=new THREE.Mesh(bg,bmat);bm.frustumCulled=false;bm.visible=false;scene.add(bm);
 const fl={x:0,z:0,y:110,d:0,sp:14,wait:rnd(4,12),on:false};
 const launch=()=>{const a=Math.random()*6.283;fl.x=S.x+Math.cos(a)*540;fl.z=S.z+Math.sin(a)*540;fl.y=rnd(70,150);fl.sp=rnd(11,17);fl.d=Math.atan2(S.z-fl.z,S.x-fl.x)+rnd(-.45,.45);fl.on=true};

 // ===================== VELEROS MEJORADOS v3 =====================
 const boats = [];
 const mL = new THREE.MeshBasicMaterial({color:0xffc060, transparent:true, opacity:0});

 {
  const cand = [];
  for(let x=-440; x<=440; x+=14)
   for(let z=-440; z<=440; z+=14){
    if(hAt(x,z) < WL-1.5){
     let ok = true;
     for(let k=0; k<8; k++){
      const a = k*0.785, px = x+Math.cos(a)*30, pz = z+Math.sin(a)*30;
      if(!inM(px,pz) || hAt(px,pz) > WL-0.6){ ok=false; break; }
     }
     if(ok) cand.push([x,z]);
    }
   }
  const picks = [];
  for(let i=0; i<cand.length*3 && picks.length<3; i++){
   const c = cand[Math.floor(Math.random()*cand.length)];
   if(c && picks.every(q => Math.hypot(q[0]-c[0], q[1]-c[1]) > 110)) picks.push(c);
  }

  // Materiales limpios
  const mHull  = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.75 });
  const mDeck  = new THREE.MeshStandardMaterial({ color: 0xF5F0E6, roughness: 0.7 });
  const mCabin = new THREE.MeshStandardMaterial({ color: 0xEDE6D9, roughness: 0.65 });
  const mWood  = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.7 });
  const mSail  = new THREE.MeshStandardMaterial({ color: 0xFFFEF7, roughness: 0.95, side: THREE.DoubleSide });

  // Helper para crear triángulos
  const tri = (a,b,c) => {
   const g = new THREE.BufferGeometry();
   g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c]), 3));
   g.computeVertexNormals();
   return g;
  };

  // Velas
  const mainSailGeo = tri(
   [0, 0.95,  0.3],
   [0, 5.5,   0.15],
   [0, 1.05, -2.4]
  );
  const jibGeo = tri(
   [0, 1.3,  0.5],
   [0, 4.9,  0.25],
   [0, 1.1,  2.6]
  );

  for(const c of picks){
   const g = new THREE.Group();

   // ===== CASCO PRINCIPAL (caja larga y baja) =====
   const hull = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.55, 4.4),
    mHull
   );
   hull.position.set(0, 0.22, 0);
   g.add(hull);

   // ===== PROA AFILADA =====
   const bowGeo = new THREE.BufferGeometry();
   const bowVerts = new Float32Array([
    // triángulo inferior
    -0.9, 0.0,  2.2,
     0.9, 0.0,  2.2,
     0.0, 0.0,  3.3,
    // triángulo superior
    -0.9, 0.55, 2.2,
     0.9, 0.55, 2.2,
     0.0, 0.45, 3.3,
    // lados
    -0.9, 0.0,  2.2,
    -0.9, 0.55, 2.2,
     0.0, 0.0,  3.3,
    -0.9, 0.55, 2.2,
     0.0, 0.45, 3.3,
     0.0, 0.0,  3.3,
     0.9, 0.0,  2.2,
     0.0, 0.0,  3.3,
     0.9, 0.55, 2.2,
     0.9, 0.55, 2.2,
     0.0, 0.45, 3.3,
     0.0, 0.0,  3.3
   ]);
   bowGeo.setAttribute('position', new THREE.BufferAttribute(bowVerts, 3));
   bowGeo.computeVertexNormals();
   const bow = new THREE.Mesh(bowGeo, mHull);
   bow.position.set(0, 0.0, 0);
   g.add(bow);

   // ===== CUBIERTA =====
   const deck = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.07, 4.5),
    mDeck
   );
   deck.position.set(0, 0.52, 0);
   g.add(deck);

   // ===== CABINA =====
   const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.5, 1.5),
    mCabin
   );
   cabin.position.set(0, 0.82, -0.6);
   g.add(cabin);

   // Techo
   const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.08, 1.6),
    mWood
   );
   roof.position.set(0, 1.1, -0.6);
   g.add(roof);

   // ===== MÁSTIL =====
   const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.07, 5.3, 8),
    mWood
   );
   mast.position.set(0, 2.9, 0.2);
   g.add(mast);

   // ===== BOTAVARA =====
   const boom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6),
    mWood
   );
   boom.rotation.x = Math.PI / 2;
   boom.position.set(0, 1.1, -0.95);
   g.add(boom);

   // ===== LÁMPARA =====
   const lan = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 8, 6),
    mL
   );
   lan.position.set(0, 5.5, 0.2);
   g.add(lan);

   // ===== TIMÓN (pegado al casco) =====
   const rudder = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.65, 0.35),
    mHull
   );
   rudder.position.set(0, 0.15, -2.35);
   g.add(rudder);

   // ===== VELAS =====
   g.add(new THREE.Mesh(mainSailGeo, mSail));
   g.add(new THREE.Mesh(jibGeo, mSail));

   // ===== BANDERA =====
   const flag = new THREE.Mesh(
    tri([0,0,0], [0,0.3,0], [0.45,0.15,0]),
    new THREE.MeshBasicMaterial({ color: 0xE67E22, side: THREE.DoubleSide })
   );
   flag.position.set(0, 5.65, 0.2);
   g.add(flag);

   scene.add(g);

   boats.push({
    g,
    x: c[0],
    z: c[1],
    h: Math.random() * 6.283,
    sp: rnd(1.1, 1.8),
    ph: Math.random() * 20,
    td: Math.random() < 0.5 ? 1 : -1
   });
  }
 }

 // peces que saltan + anillos de agua
 const fMat=new THREE.MeshStandardMaterial({color:0xcfe0ea,roughness:.35,metalness:.3}),fGeo=new THREE.SphereGeometry(1,8,6),fish=[],rings=[];
 const rGeo=new THREE.RingGeometry(.1,.16,24);rGeo.rotateX(-Math.PI/2);
 for(let i=0;i<4;i++){const m=new THREE.Mesh(fGeo,fMat);m.scale.set(.1,.09,.3);m.visible=false;scene.add(m);fish.push({m,t:9,x:0,z:0,vx:0,vz:0})}
 for(let i=0;i<8;i++){const m=new THREE.Mesh(rGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));m.visible=false;scene.add(m);rings.push({m,t:9})}
 const ring=(x,z)=>{const r=rings.find(q=>q.t>=1.2)||rings[0];r.t=0;r.m.position.set(x,WL+.04,z);r.m.visible=true};
 let fwait=rnd(2,6),last=0;
 LIFE=(p,tt)=>{if(typeof PR!=='undefined'&&PR.on)return;const dt=Math.min(.1,Math.max(0,tt-last));last=tt;if(!dt)return;const n=nf(p);
  // aves
  if(!fl.on){fl.wait-=dt;if(fl.wait<=0&&n<.4)launch()}else{const cd=Math.cos(fl.d),sd=Math.sin(fl.d);fl.x+=cd*fl.sp*dt;fl.z+=sd*fl.sp*dt;
   for(let i=0;i<NB;i++){const row=(i+1)>>1,sd_=i===0?0:(i%2?1:-1),bk=row*4.6,lt=sd_*row*3.3,fp=tt*7+i*1.7,fa=Math.sin(fp)*.9,
     cx=fl.x-cd*bk-sd*lt,cz=fl.z-sd*bk+cd*lt,cy=fl.y+Math.sin(tt*.7+i)*.6,o=i*18,rx=-sd*1.45,rz=cd*1.45,bx=cd*.75,bz=sd*.75;
    bp.set([cx,cy,cz, cx+rx,cy+fa,cz+rz, cx-bx,cy,cz-bz, cx,cy,cz, cx-rx,cy+fa,cz-rz, cx-bx,cy,cz-bz],o)}
   bg.attributes.position.needsUpdate=true;if(Math.hypot(fl.x-S.x,fl.z-S.z)>700||n>.7){fl.on=false;fl.wait=rnd(25,70)}}
  bm.visible=fl.on&&n<.8;bmat.opacity=.85*(1-n);
  // veleros
  for(const b of boats){const ax=b.x+Math.sin(b.h)*22,az=b.z+Math.cos(b.h)*22,ok=inM(ax,az)&&hAt(ax,az)<WL-.8;
   if(ok){b.h+=Math.sin(tt*.11+b.ph)*.05*dt;b.x+=Math.sin(b.h)*b.sp*dt;b.z+=Math.cos(b.h)*b.sp*dt}else b.h+=b.td*dt*.9;
   const g=b.g;g.position.set(b.x,WL+.05+waterH(b.x,b.z)+Math.sin(tt*1.2+b.ph)*.03,b.z);g.rotation.set(Math.sin(tt*1.1+b.ph)*.03,b.h,Math.sin(tt*.9+b.ph)*.045+(ok?.05:0))}
  mL.opacity=Math.min(1,n*1.3);
  // peces
  fwait-=dt;if(fwait<=0){fwait=rnd(3,9);if(S.y<WL+30){const f=fish.find(q=>q.t>=.9);if(f)for(let k=0;k<12;k++){const a=Math.random()*6.283,r=rnd(10,38),x=S.x+Math.cos(a)*r,z=S.z+Math.sin(a)*r;
    if(inM(x,z)&&hAt(x,z)<WL-.9){f.t=0;f.x=x;f.z=z;const b=Math.random()*6.283;f.vx=Math.cos(b)*1.6;f.vz=Math.sin(b)*1.6;f.m.visible=true;ring(x,z);break}}}}
  for(const f of fish){if(f.t>=.9)continue;f.t+=dt;const u=Math.min(1,f.t/.9);f.x+=f.vx*dt;f.z+=f.vz*dt;f.m.position.set(f.x,WL+Math.sin(Math.PI*u)*1.1,f.z);
   f.m.rotation.set(Math.cos(Math.PI*u)*.9,Math.atan2(f.vx,f.vz),0);if(f.t>=.9){f.m.visible=false;ring(f.x,f.z)}}
  for(const r of rings){if(r.t>=1.2)continue;r.t+=dt;const u=r.t/1.2,s=1+u*9;r.m.scale.set(s,1,s);r.m.material.opacity=.6*(1-u);if(r.t>=1.2)r.m.visible=false}};
 globalThis.BOIS_LIFE=LIFE;
}catch(e){console.warn('v62: detalles de vida no disponibles',e)}}