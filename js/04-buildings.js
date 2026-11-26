/* BOIS.IO · 04-buildings.js — Edificios remodelados, ventanas/puertas 3D exactas, señalización iluminada y parqueadero */
// ---------- buildings
const gp=new THREE.BufferAttribute(pos,3),gn=new THREE.BufferAttribute(nrm,3,true),wmRaw=new Uint8Array(buf,O.wm,NV),gwm=new THREE.BufferAttribute(wmRaw,1,true);
const BUILDING_WINDOWS=false;
const gwr=null;
var WIN={n:0,u:{value:0},t:{value:0},upd:null};
function winMat(){}

// Detalle procedural de fachadas, ladrillo, madera y tejas (sin afectar grupos especiales)
function detailMat(mat,brick,wood){
 mat.customProgramCacheKey=()=>'bd2_'+brick+'_'+wood;
 mat.onBeforeCompile=sh=>{
  sh.vertexShader=sh.vertexShader
   .replace('#include <common>','#include <common>\nvarying vec3 vBdP;varying vec3 vBdN;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvBdP=(modelMatrix*vec4(position,1.)).xyz;vBdN=normalize(mat3(modelMatrix)*normal);');
  sh.fragmentShader=sh.fragmentShader
   .replace('#include <common>','#include <common>\nvarying vec3 vBdP;varying vec3 vBdN;float bdH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}')
   .replace('#include <map_fragment>',['#include <map_fragment>',
    '{vec3 wp=vBdP;vec3 wn=normalize(vBdN);float bh=bdH(floor(wp.xz/14.));',
    ' diffuseColor.rgb*=.92+.16*bh;',
    ' if(abs(wn.y)<.5){',
    '  float u=wp.x*abs(wn.z)+wp.z*abs(wn.x);float row=floor(wp.y*4.2);',
    '  float g=bdH(floor(vec2(u*5.,wp.y*5.)));diffuseColor.rgb*=.94+.10*g;',
    (brick?'  float ml=max(step(.9,fract(wp.y*4.2)),step(.955,fract(u*2.2+row*.5)));diffuseColor.rgb*=1.-.18*ml;diffuseColor.rgb*=.9+.2*bdH(vec2(floor(u*2.2+row*.5),row));':''),
    (wood?'  float pl=step(.92,fract(u*3.2));diffuseColor.rgb*=1.-.22*pl;':''),
    '  float zocalo=1.-.14*(1.-smoothstep(.0,.55,fract(wp.y*.25)));diffuseColor.rgb*=zocalo;',
    '  diffuseColor.rgb*=1.-.12*step(.968,fract(wp.y/3.2));',
    ' }else if(wn.y>.55){',
    '  float r=step(.88,fract((wp.x+wp.z*.6)*2.6));float g=bdH(floor(vec2(wp.x*2.6+wp.z*1.5,wp.z*2.)));',
    '  diffuseColor.rgb*=(1.-.18*r)*(.9+.15*g);}',
    '}'].join('\n'));
 };
}

const special={pizzaLogo:[.78,.22,.18],medicine_logo:[.22,.62,.38],igunlogo:[.17,.23,.42],Billboard_1:[.93,.93,.9]};
const solid=[],GM={};
for(const G of META.groups){
 const g=new THREE.BufferGeometry();g.setAttribute('position',gp);g.setAttribute('normal',gn);
 const sub=idx.subarray(G.start,G.start+G.count);g.setIndex(new THREE.BufferAttribute(sub,1));
 const col=special[G.name]||G.color;let mat;
 if(G.name==='Default-Diffuse'){mat=new THREE.MeshStandardMaterial({color:lin(.72,.86,.96),roughness:.06,metalness:.55,envMapIntensity:1.25,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide})}
 else if(G.name==='Tree'){mat=new THREE.MeshStandardMaterial({color:lin(.2,.42,.17),roughness:.95,side:THREE.DoubleSide})}
 else{mat=G.name==='metal'?new THREE.MeshStandardMaterial({color:lin(.36,.39,.44),roughness:.38,metalness:.55}):new THREE.MeshStandardMaterial({color:lin(col[0],col[1],col[2]),roughness:.80,metalness:.03});}
 if(!['Default-Diffuse','Tree','igunlogo','medicine_logo','pizzaLogo','Billboard_1','metal'].includes(G.name)){
  detailMat(mat,G.name==='Red'||G.name==='Orange'?1:0,G.name==='wood'?1:0);
 }
 GM[G.name]=mat;const m=new THREE.Mesh(g,mat);m.frustumCulled=false;if(G.name!=='Default-Diffuse'){m.castShadow=true;m.receiveShadow=true}scene.add(m);
 if(G.name!=='Default-Diffuse'&&G.name!=='Tree')solid.push(sub);
}

// ============================================================================
// REMODELACIÓN ARQUITECTÓNICA, VENTANAS/PUERTAS ALINEADAS Y PARQUEADERO EXACTO
// ============================================================================
(function remodelBoisCity(){
 const cityGrp=new THREE.Group();cityGrp.name='BOIS_CITY_REMODEL';scene.add(cityGrp);
 const glowRegs=[];
 const regGlow=(mat,base,night)=>{glowRegs.push({mat,base,night});mat.emissiveIntensity=base;return mat};

 // Controlador nocturno ligero sincronizado con WIN.u.value (sin shaders custom extra)
 let lastW=-1;
 const watcher=new THREE.Mesh(new THREE.BoxGeometry(.02,.02,.02),new THREE.MeshBasicMaterial({color:0x000000}));
 watcher.position.set(0,-120,0);watcher.frustumCulled=false;
 watcher.onBeforeRender=()=>{
  const w=WIN&&WIN.u?WIN.u.value:0;
  if(Math.abs(w-lastW)>.005){lastW=w;for(let i=0;i<glowRegs.length;i++)glowRegs[i].mat.emissiveIntensity=glowRegs[i].base+glowRegs[i].night*w}
 };
 cityGrp.add(watcher);

 const signTex=(w,h,draw)=>{const t=canvasTex(w,h,draw);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t};
 const mkSignMat=(tex,base=.08,night=1.40)=>regGlow(new THREE.MeshStandardMaterial({
  map:tex,emissiveMap:tex,emissive:new THREE.Color(0xffffff),roughness:.40,metalness:.05
 }),base,night);

 // --- Texturas de letreros y marcas viales ---
 const texPizza=signTex(768,256,(x,w,h)=>{
  x.fillStyle='#241513';x.fillRect(0,0,w,h);
  x.fillStyle='#1d8a4e';x.fillRect(14,14,w-28,18);
  x.fillStyle='#c93428';x.fillRect(14,h-32,w-28,18);
  x.strokeStyle='#f7cf73';x.lineWidth=6;x.strokeRect(14,14,w-28,h-28);
  x.save();x.translate(106,h/2+6);
  x.fillStyle='#f4b749';x.beginPath();x.moveTo(0,-48);x.lineTo(48,38);x.lineTo(-48,38);x.closePath();x.fill();
  x.fillStyle='#cf6220';x.fillRect(-52,32,104,14);
  x.fillStyle='#b82924';
  [[0,-10],[-14,15],[15,16]].forEach(([px,py])=>{x.beginPath();x.arc(px,py,9,0,Math.PI*2);x.fill()});
  x.restore();
  x.fillStyle='#fff6e2';x.font='bold 84px sans-serif';x.textAlign='left';x.textBaseline='middle';
  x.fillText('PIZZERÍA',186,h/2-14);
  x.fillStyle='#ffd166';x.font='bold 30px sans-serif';x.fillText('HORNO ARTESANAL · BOIS.IO',188,h/2+46);
 });

 const texMed=signTex(768,256,(x,w,h)=>{
  x.fillStyle='#f4faf9';x.fillRect(0,0,w,h);
  x.fillStyle='#0e7c7b';x.fillRect(0,0,w,24);x.fillRect(0,h-24,w,24);
  x.strokeStyle='#18a397';x.lineWidth=6;x.strokeRect(12,12,w-24,h-24);
  x.fillStyle='#d62828';x.fillRect(72,68,38,120);x.fillRect(31,109,120,38);
  x.fillStyle='#0d3b3e';x.font='bold 74px sans-serif';x.textAlign='left';x.textBaseline='middle';
  x.fillText('ENFERMERÍA',184,h/2-14);
  x.fillStyle='#0e7c7b';x.font='bold 28px sans-serif';x.fillText('PRIMEROS AUXILIOS · 24H',188,h/2+44);
 });

 const texGun=signTex(768,224,(x,w,h)=>{
  x.fillStyle='#162131';x.fillRect(0,0,w,h);
  x.strokeStyle='#e09f3e';x.lineWidth=7;x.strokeRect(12,12,w-24,h-24);
  x.fillStyle='#e09f3e';x.fillRect(40,52,74,120);
  x.fillStyle='#162131';x.beginPath();x.arc(77,112,26,0,Math.PI*2);x.fill();
  x.strokeStyle='#162131';x.lineWidth=6;x.beginPath();x.moveTo(77,72);x.lineTo(77,152);x.moveTo(37,112);x.lineTo(117,112);x.stroke();
  x.fillStyle='#f3f5f8';x.font='bold 62px sans-serif';x.textAlign='left';x.textBaseline='middle';
  x.fillText('SUMINISTROS',148,h/2-16);
  x.fillStyle='#e09f3e';x.font='bold 28px sans-serif';x.fillText('EQUIPO · ARMERÍA BOIS.IO',150,h/2+40);
 });

 const texPark=signTex(768,224,(x,w,h)=>{
  x.fillStyle='#10243b';x.fillRect(0,0,w,h);
  x.strokeStyle='#5fb3ff';x.lineWidth=8;x.strokeRect(12,12,w-24,h-24);
  x.fillStyle='#1d6fd9';x.fillRect(34,34,154,156);
  x.strokeStyle='#ffffff';x.lineWidth=7;x.strokeRect(34,34,154,156);
  x.fillStyle='#ffffff';x.font='bold 116px sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('P',111,h/2+6);
  x.textAlign='left';x.font='bold 60px sans-serif';x.fillText('PARQUEADERO',214,h/2-18);
  x.fillStyle='#ffd166';x.font='bold 28px sans-serif';x.fillText('4 NIVELES · ACCESO LIBRE',216,h/2+40);
 });

 const texBillboard=signTex(640,256,(x,w,h)=>{
  const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0f2f49');g.addColorStop(1,'#1c5c69');
  x.fillStyle=g;x.fillRect(0,0,w,h);
  x.strokeStyle='#7bd3e8';x.lineWidth=8;x.strokeRect(12,12,w-24,h-24);
  x.fillStyle='#ffffff';x.font='bold 48px sans-serif';x.textAlign='center';x.fillText('CARTELERA · BOIS.IO',w/2,84);
  x.fillStyle='#ffd166';x.font='bold 26px sans-serif';x.fillText('Pizzería · Enfermería · Parqueadero · Mirador',w/2,146);
  x.fillStyle='#a8e6cf';x.font='23px sans-serif';x.fillText('GUÍA E INFORMACIÓN DE LA ISLA',w/2,196);
 });

 const texCafe=signTex(640,192,(x,w,h)=>{
  x.fillStyle='#3d2415';x.fillRect(0,0,w,h);
  x.strokeStyle='#e8ba74';x.lineWidth=6;x.strokeRect(10,10,w-20,h-20);
  x.fillStyle='#ffe7ba';x.font='bold 56px sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('CAFÉ · POSADA',w/2,h/2-14);
  x.fillStyle='#e8ba74';x.font='bold 25px sans-serif';x.fillText('DESCANSO Y BEBIDAS',w/2,h/2+40);
 });

 const texStop=signTex(640,160,(x,w,h)=>{
  x.fillStyle='#7e1f1c';x.fillRect(0,0,w,h);
  x.strokeStyle='#f8d58c';x.lineWidth=5;x.strokeRect(8,8,w-16,h-16);
  x.fillStyle='#ffffff';x.font='bold 52px sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('PARADA · BOIS.IO',w/2,h/2);
 });

 const texHangar=signTex(768,192,(x,w,h)=>{
  x.fillStyle='#1f2d27';x.fillRect(0,0,w,h);
  x.strokeStyle='#f2be38';x.lineWidth=8;x.strokeRect(12,12,w-24,h-24);
  x.fillStyle='#f2be38';x.fillRect(24,24,42,h-48);x.fillRect(w-66,24,42,h-48);
  x.fillStyle='#f3f6f4';x.font='bold 56px sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('ALMACÉN · HANGAR ESTE',w/2,h/2-12);
  x.fillStyle='#9cdbb3';x.font='bold 26px sans-serif';x.fillText('ZONA LOGÍSTICA Y CARGA',w/2,h/2+42);
 });

 const texTower=signTex(512,160,(x,w,h)=>{
  x.fillStyle='#2b313a';x.fillRect(0,0,w,h);
  x.strokeStyle='#d6c5a3';x.lineWidth=5;x.strokeRect(8,8,w-16,h-16);
  x.fillStyle='#f5efe2';x.font='bold 48px sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillText('MIRADOR',w/2,h/2);
 });

 // Textura exacta para las alas laterales (Oeste/Este) del Parqueadero: cajones perpendiculares al pasillo
 const texWingStalls=signTex(128,512,(x,w,h)=>{
  x.clearRect(0,0,w,h);
  x.fillStyle='rgba(242,190,56,.90)';x.fillRect(8,8,6,h-16);
  x.fillStyle='rgba(244,247,250,.86)';
  for(let i=0;i<=10;i++){const y=14+i*((h-28)/10);x.fillRect(10,y-2,w-18,4)}
 });

 // Textura exacta para cada medio-patio central (21m x 17.5m): carril + cajones internos + flechas
 const texCenterBay=signTex(512,512,(x,w,h)=>{
  x.clearRect(0,0,w,h);
  x.strokeStyle='rgba(242,190,56,.88)';x.lineWidth=6;x.strokeRect(16,16,w-32,h-32);
  x.fillStyle='rgba(244,247,250,.82)';
  for(let i=0;i<=5;i++){
   const px=96+i*64;
   x.fillRect(px-3,22,6,86);
   x.fillRect(px-3,h-108,6,86);
  }
  // Línea amarilla central discontinua del carril de circulación
  x.fillStyle='rgba(242,190,56,.90)';
  for(let lx=56;lx<w-56;lx+=48)x.fillRect(lx,h/2-3,26,6);
  // Flechas direccionales en ambos carriles
  [168,344].forEach((cy,idx)=>{
   const dir=idx===0?1:-1;
   x.fillStyle='rgba(255,255,255,.78)';x.beginPath();
   const cx=w/2;
   x.moveTo(cx+dir*42,cy);x.lineTo(cx+dir*10,cy-18);x.lineTo(cx+dir*10,cy-7);
   x.lineTo(cx-dir*36,cy-7);x.lineTo(cx-dir*36,cy+7);x.lineTo(cx+dir*10,cy+7);x.lineTo(cx+dir*10,cy+18);
   x.closePath();x.fill();
  });
 });

 // --- Materiales compartidos ---
 const mPizzaSign=mkSignMat(texPizza,.12,1.45);
 const mMedSign=mkSignMat(texMed,.12,1.40);
 const mGunSign=mkSignMat(texGun,.12,1.40);
 const mParkSign=mkSignMat(texPark,.14,1.50);
 const mBillSign=mkSignMat(texBillboard,.14,1.35);
 const mCafeSign=mkSignMat(texCafe,.12,1.40);
 const mStopSign=mkSignMat(texStop,.14,1.45);
 const mHangarSign=mkSignMat(texHangar,.12,1.35);
 const mTowerSign=mkSignMat(texTower,.08,1.10);

 const mDarkSteel=new THREE.MeshStandardMaterial({color:lin(.14,.17,.21),roughness:.45,metalness:.55});
 const mWoodTrim=new THREE.MeshStandardMaterial({color:lin(.38,.22,.11),roughness:.78});
 const mDoorWood=new THREE.MeshStandardMaterial({color:lin(.48,.27,.14),roughness:.72});
 const mConcrete=new THREE.MeshStandardMaterial({color:lin(.62,.64,.66),roughness:.85});
 const mBrickRed=new THREE.MeshStandardMaterial({color:lin(.58,.20,.16),roughness:.82});
 const mTealTrim=new THREE.MeshStandardMaterial({color:lin(.08,.42,.36),roughness:.65});
 const mYellowSafety=new THREE.MeshStandardMaterial({color:lin(.92,.68,.12),roughness:.48});
 const mWinGlass=regGlow(new THREE.MeshStandardMaterial({
  color:lin(.14,.25,.36),emissive:new THREE.Color(1.,.72,.35),roughness:.14,metalness:.48
 }),.04,1.25);
 const mBulb=regGlow(new THREE.MeshStandardMaterial({
  color:lin(1.,.95,.82),emissive:new THREE.Color(1.,.78,.42),roughness:.25
 }),.12,1.90);
 const mCrossRed=regGlow(new THREE.MeshStandardMaterial({
  color:lin(.92,.22,.22),emissive:new THREE.Color(1.,.24,.24),roughness:.30
 }),.18,1.50);
 const mWingDecal=new THREE.MeshStandardMaterial({
  map:texWingStalls,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,roughness:.85
 });
 const mBayDecal=new THREE.MeshStandardMaterial({
  map:texCenterBay,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,roughness:.85
 });

 const addBox=(parent,w,h,d,x,y,z,mat,ry=0,rx=0,rz=0,cast=true)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  mesh.position.set(x,y,z);if(ry)mesh.rotation.y=ry;if(rx)mesh.rotation.x=rx;if(rz)mesh.rotation.z=rz;
  if(cast)mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };

 const addSignBoard=(w,h,cx,cy,cz,nx,nz,mat,backMat=mDarkSteel)=>{
  const ry=Math.atan2(nx,nz);
  const g=new THREE.Group();g.position.set(cx+nx*.12,cy,cz+nz*.12);g.rotation.y=ry;
  addBox(g,w+.16,h+.16,.12,0,0,-.04,backMat,0,0,0,true);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  face.position.z=.025;g.add(face);
  cityGrp.add(g);return g;
 };

 // 1) LETREROS UV-MAPEADOS EN LAS FACHADAS ORIGINALES (sin cajas flotando en el aire)
 const logoCfg={
  pizzaLogo:{mat:mPizzaSign,back:mDarkSteel,pad:.12},
  medicine_logo:{mat:mMedSign,back:mTealTrim,pad:.14},
  igunlogo:{mat:mGunSign,back:mDarkSteel,pad:.12},
  Billboard_1:{mat:mBillSign,back:mDarkSteel,pad:.08}
 };
 for(const G of META.groups){
  const cfg=logoCfg[G.name];if(!cfg)continue;
  for(let q=0;q<G.count;q+=6){
   let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9,mnZ=1e9,mxZ=-1e9,nx=0,nz=0;
   for(let k=0;k<6;k++){
    const vi=idx[G.start+q+k],vx=pos[vi*3],vy=pos[vi*3+1],vz=pos[vi*3+2];
    if(vx<mnX)mnX=vx;if(vx>mxX)mxX=vx;if(vy<mnY)mnY=vy;if(vy>mxY)mxY=vy;if(vz<mnZ)mnZ=vz;if(vz>mxZ)mxZ=vz;
    nx+=nrm[vi*3];nz+=nrm[vi*3+2];
   }
   const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;
   const cx=(mnX+mxX)/2,cz=(mnZ+mxZ)/2;
   let cy=(mnY+mxY)/2;
   const w=Math.max(1.2,Math.hypot(mxX-mnX,mxZ-mnZ)),h=Math.max(.8,mxY-mnY);
   // En Enfermerías Centro/Este el quad original estaba enterrado a Y~3.57; subirlo limpio a la cornisa del techo
   if(G.name==='medicine_logo'&&cy<5.0)cy=cx<0?7.95:7.55;
   addSignBoard(w+cfg.pad,h+cfg.pad,cx,cy,cz,nx,nz,cfg.mat,cfg.back);

   const ry=Math.atan2(nx,nz);
   if(G.name==='medicine_logo'){
    const mg=new THREE.Group();mg.position.set(cx+nx*.14,cy+h*.5+.62,cz+nz*.14);mg.rotation.y=ry;
    addBox(mg,.28,.85,.12,0,0,0,mCrossRed,0,0,0,false);
    addBox(mg,.85,.28,.12,0,0,0,mCrossRed,0,0,0,false);
    cityGrp.add(mg);
   }else if(G.name==='Billboard_1'){
    const bg=new THREE.Group();bg.position.set(cx,cy,cz);bg.rotation.y=ry;
    addBox(bg,.12,2.5,.16,-w/2-.14,-1.05,-.02,mDarkSteel,0,0,0,true);
    addBox(bg,.12,2.5,.16,w/2+.14,-1.05,-.02,mDarkSteel,0,0,0,true);
    addBox(bg,w*.7,.08,.12,0,h/2+.12,.14,mBulb,0,0,0,false);
    cityGrp.add(bg);
   }else{
    // Luz cálida bajo la cornisa del letrero
    const lg=new THREE.Group();lg.position.set(cx-nx*.35,cy-h*.5-.22,cz-nz*.35);lg.rotation.y=ry;
    addBox(lg,w*.85,.08,.16,0,0,0,mBulb,0,0,0,false);
    cityGrp.add(lg);
   }
  }
 }

 // 2) PARQUEADERO (C#3: X[34.5..69.7] Y[4.3..18.4] Z[-18.5..33.0]) AJUSTADO A LOSAS REALES
 {
  const px=52.1,pz=7.25;
  addSignBoard(10.8,2.6,34.35,12.2,pz,-1,0,mParkSign,mDarkSteel);
  addSignBoard(10.8,2.6,px,12.2,-18.6,0,-1,mParkSign,mDarkSteel);
  addSignBoard(10.8,2.6,px,12.2,33.1,0,1,mParkSign,mDarkSteel);
  addBox(cityGrp,.4,3.4,.4,45.8,20.1,-16.8,mDarkSteel);
  addBox(cityGrp,.4,3.4,.4,58.4,20.1,-16.8,mDarkSteel);
  addSignBoard(12.2,2.7,px,21.4,-16.7,0,1,mParkSign,mDarkSteel);
  addSignBoard(12.2,2.7,px,21.4,-16.9,0,-1,mParkSign,mDarkSteel);

  const addDecal=(w,l,x,y,z,mat,ry=0)=>{
   const dec=new THREE.Mesh(new THREE.PlaneGeometry(w,l),mat);
   dec.rotation.x=-Math.PI/2;if(ry)dec.rotation.z=ry;
   dec.position.set(x,y,z);dec.receiveShadow=true;cityGrp.add(dec);
  };

  // Patios centrales exactos (Norte Z[-10.8..6.4] y Sur Z[7.8..25.0], dentro de X[42.0..62.2], sin cruzar rampas!)
  [4.38,9.08,13.78,18.46].forEach((dy,lv)=>{
   addDecal(19.6,16.8,52.1,dy,-2.2,mBayDecal);
   addDecal(19.6,16.8,52.1,dy,16.4,mBayDecal);
   if(lv<3){
    for(const lz of [-6,2,12,20]){
     addBox(cityGrp,3.4,.08,.22,47.5,dy+3.92,lz,mBulb,0,0,0,false);
     addBox(cityGrp,3.4,.08,.22,56.7,dy+3.92,lz,mBulb,0,0,0,false);
    }
   }
  });

  // Alas laterales Oeste (X[35.2..41.0]) y Este (X[63.1..69.0]) en niveles 2 y 3 (Y=9.05 y 13.76)
  [9.05,13.76].forEach(dy=>{
   addDecal(5.4,44.0,38.1,dy,6.2,mWingDecal,0);
   addDecal(5.4,44.0,66.05,dy,8.5,mWingDecal,Math.PI);
  });

  for(let z=-12;z<=28;z+=6)addBox(cityGrp,.24,.95,.24,33.6,4.82,z,mYellowSafety);
 }

 // 3) DETECCIÓN EXACTA DE HUECOS EN LAS 62 CASAS + ESTRUCTURAS SECUNDARIAS
 const vKey=i=>`${Math.round(pos[i*3]*20)},${Math.round(pos[i*3+1]*20)},${Math.round(pos[i*3+2]*20)}`;
 const tris=[];
 for(const G of META.groups){
  if(G.name==='Tree'||G.name==='Default-Diffuse'||logoCfg[G.name])continue;
  for(let k=0;k<G.count;k+=3)tris.push({g:G.name,a:idx[G.start+k],b:idx[G.start+k+1],c:idx[G.start+k+2]});
 }
 const par=new Int32Array(tris.length);for(let i=0;i<tris.length;i++)par[i]=i;
 const find=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x};
 const vmap=new Map();
 for(let t=0;t<tris.length;t++){
  const tr=tris[t];
  for(const vi of [tr.a,tr.b,tr.c]){
   const k=vKey(vi),p=vmap.get(k);
   if(p!==undefined){const ra=find(t),rb=find(p);if(ra!==rb)par[ra]=rb}else vmap.set(k,t);
  }
 }
 const comps=new Map();
 for(let t=0;t<tris.length;t++){
  const r=find(t);let c=comps.get(r);if(!c){c=[];comps.set(r,c)}c.push(tris[t]);
 }

 const winMatrices=[],frameMatrices=[],sillMatrices=[],mullVMatrices=[],mullHMatrices=[];
 const doorMatrices=[],doorFrameMatrices=[],doorGlassMatrices=[],doorStepMatrices=[],porchLampMatrices=[],chimneyMatrices=[];
 const dummy=new THREE.Object3D();

 for(const h of comps.values()){
  // --- A) 62 CASAS RESIDENCIALES (Gray:118) ---
  if(h.length===118&&h[0].g==='Gray'){
   let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9,mnZ=1e9,mxZ=-1e9;
   for(const t of h)for(const vi of [t.a,t.b,t.c]){
    const vx=pos[vi*3],vy=pos[vi*3+1],vz=pos[vi*3+2];
    if(vx<mnX)mnX=vx;if(vx>mxX)mxX=vx;if(vy<mnY)mnY=vy;if(vy>mxY)mxY=vy;if(vz<mnZ)mnZ=vz;if(vz>mxZ)mxZ=vz;
   }
   // Chimenea sobresaliendo limpiamente por la cumbrera del techo (mxY + 2.45)
   dummy.position.set((mnX+mxX)/2,mxY+2.45,(mnZ+mxZ)/2);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
   chimneyMatrices.push(dummy.matrix.clone());

   const htris=[];
   for(const t of h){
    const ny=(nrm[t.a*3+1]+nrm[t.b*3+1]+nrm[t.c*3+1])/381;
    const y=(pos[t.a*3+1]+pos[t.b*3+1]+pos[t.c*3+1])/3;
    if(Math.abs(ny)>.85&&y>mnY+.1&&y<mxY-.1)htris.push({t,ny,y});
   }
   const hp=new Int32Array(htris.length);for(let i=0;i<htris.length;i++)hp[i]=i;
   const hf=x=>{while(hp[x]!==x){hp[x]=hp[hp[x]];x=hp[x]}return x};
   const hmap=new Map();
   for(let i=0;i<htris.length;i++){
    const {t,ny,y}=htris[i],dir=ny>0?'U':'D',yq=Math.round(y*10);
    for(const vi of [t.a,t.b,t.c]){
     const k=`${dir}_${yq}_${vKey(vi)}`,p=hmap.get(k);
     if(p!==undefined){const ra=hf(i),rb=hf(p);if(ra!==rb)hp[ra]=rb}else hmap.set(k,i);
    }
   }
   const qMap=new Map();
   for(let i=0;i<htris.length;i++){
    const r=hf(i);let q=qMap.get(r);if(!q){q={up:htris[i].ny>0,pts:[]};qMap.set(r,q)}
    for(const vi of [htris[i].t.a,htris[i].t.b,htris[i].t.c])q.pts.push([pos[vi*3],pos[vi*3+1],pos[vi*3+2]]);
   }
   const rects=[];
   for(const q of qMap.values()){
    const u=[];for(const p of q.pts)if(!u.some(e=>Math.hypot(e[0]-p[0],e[2]-p[2])<.02))u.push(p);
    let sx=0,sy=0,sz=0;for(const p of u){sx+=p[0];sy+=p[1];sz+=p[2]}
    const rcx=sx/u.length,rcz=sz/u.length;
    // Ordenar vértices en círculo alrededor del centro para medir LADOS DEL PERÍMETRO (¡no diagonales!)
    u.sort((a,b)=>Math.atan2(a[2]-rcz,a[0]-rcx)-Math.atan2(b[2]-rcz,b[0]-rcx));
    let bestD=0,ux=1,uz=0;
    for(let i=0;i<u.length;i++){
     const p0=u[i],p1=u[(i+1)%u.length],dx=p1[0]-p0[0],dz=p1[2]-p0[2],d=Math.hypot(dx,dz);
     if(d>bestD){bestD=d;ux=dx/d;uz=dz/d}
    }
    rects.push({up:q.up,x:rcx,y:sy/u.length,z:rcz,w:bestD,ang:Math.atan2(-uz,ux)});
   }
   const hcx=(mnX+mxX)/2,hcz=(mnZ+mxZ)/2;
   for(const dn of rects){
    if(dn.up)continue;
    const sill=rects.find(u=>u.up&&Math.hypot(u.x-dn.x,u.z-dn.z)<.28&&dn.y>u.y+.5);
    if(sill){
     // Ventana 100% paralela al muro (0° de error) encajada dentro del hueco exacto
     const cy=(sill.y+dn.y)/2,vh=Math.max(.9,dn.y-sill.y),vw=Math.max(.75,dn.w);
     dummy.position.set(dn.x,cy,dn.z);dummy.rotation.set(0,dn.ang,0);
     dummy.scale.set(vw-.06,vh-.06,1);dummy.updateMatrix();winMatrices.push(dummy.matrix.clone());
     dummy.scale.set(vw+.04,vh+.04,1);dummy.updateMatrix();frameMatrices.push(dummy.matrix.clone());
     dummy.scale.set(1,vh-.06,1);dummy.updateMatrix();mullVMatrices.push(dummy.matrix.clone());
     dummy.scale.set(vw-.06,1,1);dummy.updateMatrix();mullHMatrices.push(dummy.matrix.clone());
     dummy.position.set(dn.x,sill.y-.01,dn.z);dummy.scale.set(vw+.14,1,1);dummy.updateMatrix();
     sillMatrices.push(dummy.matrix.clone());
    }else{
     // Puerta 100% paralela al muro + vidrio superior + escalón + farol exterior
     const vh=Math.max(2.0,dn.y-mnY),vw=Math.max(1.1,dn.w);
     const nx=Math.sin(dn.ang),nz=Math.cos(dn.ang);
     const tx=Math.cos(dn.ang),tz=-Math.sin(dn.ang);
     const sign=((dn.x-hcx)*nx+(dn.z-hcz)*nz)>=0?1:-1;
     dummy.position.set(dn.x,mnY+vh/2,dn.z);dummy.rotation.set(0,dn.ang,0);
     dummy.scale.set(vw-.06,vh-.04,1);dummy.updateMatrix();doorMatrices.push(dummy.matrix.clone());
     dummy.scale.set(vw+.05,vh+.04,1);dummy.updateMatrix();doorFrameMatrices.push(dummy.matrix.clone());
     dummy.position.set(dn.x,mnY+vh*.68,dn.z);dummy.scale.set(vw*.52,vh*.26,1);dummy.updateMatrix();
     doorGlassMatrices.push(dummy.matrix.clone());
     dummy.position.set(dn.x+nx*sign*.34,mnY+.06,dn.z+nz*sign*.34);dummy.scale.set(vw+.22,1,1);dummy.updateMatrix();
     doorStepMatrices.push(dummy.matrix.clone());
     dummy.position.set(dn.x+nx*sign*.20+tx*(vw*.52),mnY+vh-.18,dn.z+nz*sign*.20+tz*(vw*.52));
     dummy.scale.set(1,1,1);dummy.updateMatrix();porchLampMatrices.push(dummy.matrix.clone());
    }
   }
   continue;
  }

  let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9,mnZ=1e9,mxZ=-1e9;
  for(const t of h)for(const vi of [t.a,t.b,t.c]){
   const vx=pos[vi*3],vy=pos[vi*3+1],vz=pos[vi*3+2];
   if(vx<mnX)mnX=vx;if(vx>mxX)mxX=vx;if(vy<mnY)mnY=vy;if(vy>mxY)mxY=vy;if(vz<mnZ)mnZ=vz;if(vz>mxZ)mxZ=vz;
  }
  const sx=mxX-mnX,sy=mxY-mnY,sz=mxZ-mnZ,cx=(mnX+mxX)/2,cz=(mnZ+mxZ)/2;

  // --- B) PARADAS DE BUS CUBIERTAS ---
  if(h.length===12&&h[0].g==='Red'&&sx>9&&sx<11&&sz>6.8&&sz<8.4&&sy<1.2){
   addSignBoard(5.8,1.15,cx,mnY+.45,mxZ+.08,0,1,mStopSign,mDarkSteel);
   addSignBoard(5.8,1.15,cx,mnY+.45,mnZ-.08,0,-1,mStopSign,mDarkSteel);
   addBox(cityGrp,3.4,.14,.62,cx,hAt(cx,cz)+.45,cz,mWoodTrim);
   addBox(cityGrp,2.4,.08,.22,cx,mnY-.08,cz,mBulb,0,0,0,false);
  }
  // --- C) HANGAR / ALMACÉN ESTE ---
  else if(h[0].g==='Green'&&sx>60&&sz>80){
   addSignBoard(22,4.6,cx,mxY-6.5,mnZ-.2,0,-1,mHangarSign,mDarkSteel);
   addSignBoard(22,4.6,cx,mxY-6.5,mxZ+.2,0,1,mHangarSign,mDarkSteel);
   for(let z=mnZ+18;z<mxZ-16;z+=22){
    addBox(cityGrp,.18,2.2,11.5,mnX-.10,mnY+16.5,z,mWinGlass,0,0,0,false);
    addBox(cityGrp,.18,2.2,11.5,mxX+.10,mnY+16.5,z,mWinGlass,0,0,0,false);
    addBox(cityGrp,.35,.28,1.4,mnX-.18,mnY+14.2,z,mBulb,0,0,0,false);
    addBox(cityGrp,.35,.28,1.4,mxX+.18,mnY+14.2,z,mBulb,0,0,0,false);
   }
  }
  // --- D) TORRES MIRADOR (Gray:92) ---
  else if(h.length===92&&h[0].g==='Gray'){
   const fz=sz<sx;
   addSignBoard(3.0,.85,cx,mxY-.75,fz?mxZ+.12:cz,fz?0:1,fz?1:0,mTowerSign,mDarkSteel);
   addBox(cityGrp,.42,.26,.42,cx,mxY+.16,cz,mBulb,0,0,0,false);
  }
 }

 const makeInst=(geo,mat,mats,cast=false)=>{
  if(!mats.length)return;
  const im=new THREE.InstancedMesh(geo,mat,mats.length);
  for(let i=0;i<mats.length;i++)im.setMatrixAt(i,mats[i]);
  im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;
  im.castShadow=cast;im.receiveShadow=true;cityGrp.add(im);
 };
 // Profundidad calibrada respecto a los 0.26m exactos de muro en mesh-data:
 makeInst(new THREE.BoxGeometry(1,1,.29),mWinGlass,winMatrices,false);
 makeInst(new THREE.BoxGeometry(1,1,.27),mWoodTrim,frameMatrices,true);
 makeInst(new THREE.BoxGeometry(.05,1,.305),mWoodTrim,mullVMatrices,false);
 makeInst(new THREE.BoxGeometry(1,.05,.305),mWoodTrim,mullHMatrices,false);
 makeInst(new THREE.BoxGeometry(1,.09,.36),mConcrete,sillMatrices,true);
 makeInst(new THREE.BoxGeometry(1,1,.28),mDoorWood,doorMatrices,true);
 makeInst(new THREE.BoxGeometry(1,1,.27),mWoodTrim,doorFrameMatrices,true);
 makeInst(new THREE.BoxGeometry(1,1,.30),mWinGlass,doorGlassMatrices,false);
 makeInst(new THREE.BoxGeometry(1,.12,.68),mConcrete,doorStepMatrices,true);
 makeInst(new THREE.BoxGeometry(.20,.24,.18),mBulb,porchLampMatrices,false);
 makeInst(new THREE.BoxGeometry(.62,1.10,.62),mBrickRed,chimneyMatrices,true);

 // 4) ESTRUCTURAS COMERCIALES SIN ETIQUETAR (alineadas estrictamente a sus cornisas)
 // 4a) 4ª Enfermería en Pueblo SO (C#15: X[-411.7..-399.3] Z[374.7..387.2])
 addSignBoard(4.2,1.35,-399.2,9.2,381.0,1,0,mMedSign,mTealTrim);
 addSignBoard(4.2,1.35,-405.5,9.2,374.6,0,-1,mMedSign,mTealTrim);
 addBox(cityGrp,.2,.95,.32,-399.1,10.3,381.0,mCrossRed,0,0,0,false);
 addBox(cityGrp,.2,.32,.95,-399.1,10.3,381.0,mCrossRed,0,0,0,false);

 // 4b) Cafés / Posadas con cornisa de madera (Centro, SO y NE)
 [[-30.8,7.9,3.6,1,0],[-381.5,9.2,347.1,1,0],[309.7,9.0,-471.3,-1,0]].forEach(([cx,cy,cz,nx,nz])=>{
  addSignBoard(4.8,1.35,cx+nx*6.15,cy,cz,nx,nz,mCafeSign,mWoodTrim);
  addBox(cityGrp,.16,.10,4.2,cx+nx*5.8,cy-.85,cz,mBulb,0,0,0,false);
 });

 // 4c) Pizzería NE Sur sin logo (283.55, 9.4, -390.55)
 addSignBoard(5.4,1.55,283.55+6.15,9.4,-390.55,1,0,mPizzaSign,mDarkSteel);
 addBox(cityGrp,.16,.10,4.4,283.55+5.8,8.4,-390.55,mBulb,0,0,0,false);
})();
