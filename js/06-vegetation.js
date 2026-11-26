/* BOIS.IO · 06-vegetation.js — Vegetación: árboles remodelados, arbustos, máscara de sendero
   (líneas 646–677 de BOIS_IO_v119_Optimizado.html) */
// ---------- vegetación
function merge(parts){const gs=parts.map(p=>p.g.index?p.g.toNonIndexed():p.g);let np=0;for(const g of gs)np+=g.attributes.position.count;
 const P_=new Float32Array(np*3),N_=new Float32Array(np*3),C_=new Float32Array(np*3);let o=0;
 gs.forEach((g,k)=>{const cnt=g.attributes.position.count,c=parts[k].c;P_.set(g.attributes.position.array,o*3);N_.set(g.attributes.normal.array,o*3);for(let i=0;i<cnt;i++){C_[(o+i)*3]=c.r;C_[(o+i)*3+1]=c.g;C_[(o+i)*3+2]=c.b}o+=cnt});
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P_,3));G.setAttribute('normal',new THREE.BufferAttribute(N_,3));G.setAttribute('color',new THREE.BufferAttribute(C_,3));return G}

{const _up=new THREE.Vector3(0,1,0),_dir=new THREE.Vector3(),_q=new THREE.Quaternion(),_m=new THREE.Matrix4();
 const limb=(x0,y0,z0,x1,y1,z1,r0,r1,segs,col)=>{
  const dx=x1-x0,dy=y1-y0,dz=z1-z0,len=Math.hypot(dx,dy,dz)||.001;
  const g=new THREE.CylinderGeometry(r1,r0,len,segs||6,1);
  _dir.set(dx/len,dy/len,dz/len);_q.setFromUnitVectors(_up,_dir);
  _m.compose(new THREE.Vector3((x0+x1)*.5,(y0+y1)*.5,(z0+z1)*.5),_q,new THREE.Vector3(1,1,1));
  g.applyMatrix4(_m);return{g,c:lin(...col)};
 };
 const sculpt=(g,amp,seed,sy)=>{
  const p=g.attributes.position.array;
  for(let i=0;i<p.length;i+=3){
   const x=Math.round(p[i]*1e4)/1e4,y=Math.round(p[i+1]*1e4)/1e4,z=Math.round(p[i+2]*1e4)/1e4;
   const d1=Math.sin(x*3.7+y*2.3+seed)*Math.cos(z*3.1-y*2.9+seed*.7);
   const d2=Math.sin(z*4.9-x*2.7+seed*1.3)*Math.cos(y*4.1+x*1.9);
   const k=1+(d1*.65+d2*.35)*amp;
   p[i]*=k;p[i+1]*=1+(d2*.5-d1*.3)*amp*(sy||.7);p[i+2]*=k;
  }
  g.computeVertexNormals();return g;
 };
 const foliage=(r,x,y,z,sx,sy,sz,amp,seed,col)=>{
  const g=sculpt(new THREE.IcosahedronGeometry(r,1),amp,seed,.8);
  g.scale(sx||1,sy||1,sz||1).rotateY((seed*1.37)%6.28).translate(x,y,z);
  return{g,c:lin(...col)};
 };
 const pineTier=(rTop,rBot,h,y,ox,oz,tips,flare,seed,col)=>{
  const g=new THREE.CylinderGeometry(rTop,rBot,h,tips*2,2,false);
  const p=g.attributes.position.array,hh=h*.5;
  for(let i=0;i<p.length;i+=3){
   const px=p[i],py=p[i+1],pz=p[i+2],rad=Math.hypot(px,pz);
   if(rad>1e-4){
    const ang=Math.atan2(pz,px),wave=Math.cos(ang*tips+seed);
    const bot=Math.max(0,(hh*.35-py)/h);
    const sc=1+bot*(wave*flare+Math.sin(ang*3-seed)*.08);
    p[i]*=sc;p[i+2]*=sc;
    p[i+1]-=bot*Math.max(0,wave)*.16*h;
   }
  }
  g.translate(ox,y,oz);g.computeVertexNormals();
  return{g,c:lin(...col)};
 };

 // Pinos: raíces acampanadas, fuste curvado y 5 pisos de ramaje festoneado con degradado
 const pBk=[.27,.18,.10],pBkDk=[.20,.13,.07];
 const pine=merge([
  limb(0,0,0, .05,1.4,.04, .30,.21, 6, pBk),
  limb(.05,1.36,.04, -.04,3.1,-.03, .21,.13, 6, pBk),
  limb(-.04,3.05,-.03, .02,5.3,.02, .13,.04, 5, pBk),
  limb(0,.02,0, .44,-.08,.22, .14,.04, 5, pBkDk),
  limb(0,.02,0, -.36,-.08,.34, .14,.04, 5, pBkDk),
  limb(0,.02,0, -.12,-.08,-.45, .13,.04, 5, pBkDk),
  pineTier(.45,2.15, 1.55, 2.05, .04,.02, 5,.26, .4, [.09,.25,.12]),
  pineTier(.38,1.82, 1.48, 3.08, -.03,.03, 5,.24, 1.7, [.11,.30,.14]),
  pineTier(.30,1.48, 1.42, 4.08, .02,-.03, 5,.22, 3.1, [.13,.35,.16]),
  pineTier(.22,1.12, 1.32, 5.02, -.02,.01, 4,.20, 4.5, [.16,.40,.18]),
  pineTier(.02,.76, 1.38, 6.02, .01,0, 4,.16, 5.8, [.19,.45,.20])
 ]);
 var PINE=pine;

 const bh=(i,j,s)=>{const v=Math.sin(i*127.1+j*311.7+s*74.7)*43758.5453;return v-Math.floor(v)},bn=(x,z,s)=>{const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),w=fz*fz*(3-2*fz);return(bh(i,j,s)*(1-u)+bh(i+1,j,s)*u)*(1-w)+(bh(i,j+1,s)*(1-u)+bh(i+1,j+1,s)*u)*w};
 const trailBits=atob(TRAIL_MASK_B64);
 const nearTrail=(x,z)=>{const ix=Math.max(0,Math.min(511,Math.round((500-x)*.511))),iy=Math.max(0,Math.min(511,Math.round((500-z)*.511))),k=iy*512+ix;return (trailBits.charCodeAt(k>>3)&(1<<(k&7)))!==0};
 const trees=[];const treeMax=touch?3000:5200;for(let n=0;n<60000&&trees.length<treeMax;n++){const x=(hash(n,1.7)*2-1)*480,z=(hash(n,9.3)*2-1)*480;if(nearTrail(x,z))continue;const h=hAt(x,z);if(h<2.7)continue;
  if(Math.hypot(hAt(x+2,z)-hAt(x-2,z),hAt(x,z+2)-hAt(x,z-2))/4>(h>40?.35:.62)||(h>44&&hash(n,5.5)<(h-44)/14)||(bn(x/90,z/90,5)<.4&&hash(n,6.6)<.78))continue;
  const ci=Math.floor(x/CS),cj=Math.floor(z/CS);let near=false;for(let a=-1;a<=1&&!near;a++)for(let b=-1;b<=1;b++)if(cells.has((ci+a)*4096+cj+b)){near=true;break}if(!near)trees.push([x,h,z,n])}
 var treeChunks=[];const __tcFr=new THREE.Frustum(),__tcM=new THREE.Matrix4();let __tcF=-1;const mt_=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.86,flatShading:true}),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color(),vp=new THREE.Vector3(),vs=new THREE.Vector3(),ch=new Map();const TW={t:{value:0}};
 mt_.onBeforeCompile=s=>{s.uniforms.uT=TW.t;s.uniforms.uW=GU.w;s.vertexShader="uniform float uT,uW;\n"+s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nmat3 M3=mat3(instanceMatrix);vec3 ip=instanceMatrix[3].xyz;float ph=ip.x*.05+ip.z*.07;float sw=(sin(uT*1.4+ph)+.5*sin(uT*2.9+ph*1.7+1.3))*(.25+uW)*.024;float hh=min(position.y,7.5);hh=hh*hh*.12;transformed+=(transpose(M3)*vec3(sw,0.,sw*.6))/dot(M3[0],M3[0])*hh;")};
  for(const t of trees){const k=Math.floor(t[0]/100)*64+Math.floor(t[2]/100);let a=ch.get(k);if(!a)ch.set(k,a=[]);a.push(t)}

 // Robles: contrafuertes, tronco nudoso con 3 ramas visibles y 6 racimos esculpidos en capas
 const oBk=[.29,.19,.11],oBkDk=[.22,.14,.08];
 const oak=merge([
  limb(0,0,0, .08,1.35,.04, .36,.27, 7, oBk),
  limb(.08,1.32,.04, -.04,2.55,-.05, .27,.19, 6, oBk),
  limb(0,.04,0, .54,-.10,.16, .18,.05, 5, oBkDk),
  limb(0,.04,0, -.42,-.10,.36, .17,.05, 5, oBkDk),
  limb(0,.04,0, -.12,-.10,-.52, .16,.05, 5, oBkDk),
  limb(.02,2.10,0, 1.05,3.25,.42, .15,.06, 5, oBk),
  limb(-.02,2.20,-.02, -.98,3.35,-.50, .14,.06, 5, oBk),
  limb(-.03,2.35,-.04, -.18,3.45,1.02, .13,.05, 5, oBk),
  foliage(1.45, 1.15,3.35,.48, 1.08,.76,1.02, .18, 1.2, [.14,.33,.10]),
  foliage(1.42, -1.08,3.42,-.56, 1.04,.78,1.06, .18, 2.5, [.15,.36,.11]),
  foliage(1.28, -.22,3.55,1.12, 1.02,.76,.96, .17, 3.8, [.16,.38,.12]),
  foliage(1.55, .25,4.15,-.32, 1.12,.82,1.05, .17, 5.1, [.19,.43,.14]),
  foliage(1.32, -.62,4.28,.45, 1.0,.84,.96, .16, 6.4, [.22,.47,.15]),
  foliage(1.12, .10,4.85,.08, 1.05,.78,1.0, .16, 7.9, [.25,.51,.17])
 ]);

 // Abedules: fuste doble esbelto, corteza blanca con anillos oscuros y copa aireada
 const bWh=[.86,.83,.76],bSt=[.78,.75,.68],bMk=[.23,.20,.18];
 const birch=merge([
  limb(-.10,0,0, -.04,1.65,.06, .18,.14, 6, bWh),
  limb(-.04,1.62,.06, .06,3.45,-.04, .14,.09, 6, bWh),
  limb(.06,3.42,-.04, .02,4.85,.02, .09,.04, 5, bWh),
  limb(-.08,0,0, .28,1.45,-.12, .11,.08, 5, bSt),
  limb(.28,1.42,-.12, .56,3.05,-.22, .08,.04, 5, bSt),
  limb(-.07,.72,.02, -.05,.86,.03, .17,.16, 6, bMk),
  limb(.01,2.22,.01, .03,2.34,0, .13,.12, 6, bMk),
  limb(.04,3.10,-.02, .05,3.21,-.03, .10,.09, 6, bMk),
  limb(.02,3.15,-.02, -.62,4.15,.36, .07,.03, 5, bWh),
  limb(.04,3.40,-.03, .65,4.35,.28, .06,.03, 5, bWh),
  foliage(.92, .68,3.28,-.26, 1.05,.74,.96, .20, 1.9, [.29,.50,.15]),
  foliage(1.02, -.68,4.18,.40, 1.08,.76,1.0, .19, 3.2, [.33,.56,.17]),
  foliage(.96, .70,4.38,.32, 1.0,.78,.95, .19, 4.6, [.35,.58,.18]),
  foliage(1.08, -.12,4.82,-.34, 1.12,.80,1.02, .18, 5.9, [.37,.60,.19]),
  foliage(.88, .16,5.42,.10, 1.0,.82,.96, .18, 7.2, [.41,.64,.21])
 ]);

 // Cipreses: tronco firme y llama vertical esculpida (w < 2.2 para detección Shinkai)
 const cyp=merge([
  limb(0,0,0, .02,1.65,0, .21,.14, 6, [.26,.17,.08]),
  limb(0,.02,0, .28,-.06,.16, .10,.03, 5, [.20,.13,.06]),
  limb(0,.02,0, -.26,-.06,-.18, .10,.03, 5, [.20,.13,.06]),
  foliage(.82, 0,2.25,0, .92,1.65,.92, .14, 1.1, [.06,.19,.08]),
  foliage(.88, .04,3.45,-.03, .88,1.80,.88, .14, 2.6, [.08,.23,.10]),
  foliage(.78, -.03,4.65,.04, .82,1.70,.82, .15, 4.1, [.09,.26,.11]),
  foliage(.60, .02,5.75,-.02, .75,1.55,.75, .15, 5.7, [.11,.29,.12]),
  foliage(.38, 0,6.65,0, .66,1.45,.66, .14, 7.3, [.12,.32,.13])
 ]);

 // Cerezos: tronco oscuro retorcido, ramas abiertas y nubes florales en 3 tonos
 const sBk=[.24,.14,.10],sBkDk=[.18,.11,.08];
 const sak=merge([
  limb(0,0,0, -.08,1.25,.06, .31,.23, 7, sBk),
  limb(-.08,1.22,.06, .04,2.25,-.04, .23,.16, 6, sBk),
  limb(0,.04,0, .48,-.08,.18, .16,.04, 5, sBkDk),
  limb(0,.04,0, -.40,-.08,-.32, .15,.04, 5, sBkDk),
  limb(.01,1.95,-.02, 1.02,2.95,.36, .13,.05, 5, sBk),
  limb(.02,2.05,-.03, -.96,3.05,-.44, .12,.05, 5, sBk),
  limb(.04,2.15,-.04, -.12,3.15,.98, .11,.04, 5, sBk),
  foliage(1.30, 1.08,3.02,.40, 1.12,.70,1.02, .18, 1.4, [.86,.44,.58]),
  foliage(1.26, -1.02,3.10,-.48, 1.08,.72,1.04, .18, 2.9, [.89,.48,.62]),
  foliage(1.16, -.16,3.22,1.05, 1.06,.72,.98, .17, 4.3, [.92,.54,.66]),
  foliage(1.42, .18,3.72,-.18, 1.16,.76,1.08, .17, 5.7, [.96,.60,.70]),
  foliage(1.18, -.58,3.88,.42, 1.06,.74,1.0, .16, 7.1, [.98,.66,.75]),
  foliage(1.02, .12,4.36,.04, 1.04,.74,.98, .16, 8.5, [1.0,.74,.80])
 ]);

 const SPG=[pine,oak,birch,cyp,sak],spOf=t=>{const u=hash(t[3],3.3),h=t[1],x=t[0]+(hash(t[3],7.1)-.5)*14,z=t[2]+(hash(t[3],7.7)-.5)*14,B=bn(x/170,z/170,1)*.65+bn(x/70,z/70,2)*.35;
  if(h>34)return u<.9?0:3;
  if(h<12&&bn(x/110,z/110,9)>.75)return u<.85?4:1;
  if(h>16&&hash(t[3],4.4)<(h-16)/22)return 0;
  if(B<.42)return u<.92?0:2;if(B<.58)return u<.85?1:u<.95?2:0;if(B<.7)return u<.88?2:1;return u<.7?3:0};
 for(const a0 of ch.values())for(let sp=0;sp<5;sp++){const a=a0.filter(t=>spOf(t)===sp);if(!a.length)continue;const im=new THREE.InstancedMesh(SPG[sp],mt_,a.length);
   a.forEach((t,i)=>{const s=.8+hash(t[3],4.1)*.9;e.set((hash(t[3],1.1)-.5)*.08,hash(t[3],6.2)*6.28,(hash(t[3],2.7)-.5)*.08);q.setFromEuler(e);m4.compose(vp.set(t[0],t[1]-.20,t[2]),q,vs.set(s,s*(.9+hash(t[3],8.8)*.35),s));im.setMatrixAt(i,m4);const v=.75+hash(t[3],2.2)*.4;c.setRGB(v,v,v);im.setColorAt(i,c)});
   im.frustumCulled=false;im.castShadow=!touch;im.receiveShadow=true;scene.add(im);
   const tc={m:im,s:new THREE.Sphere(new THREE.Vector3(Math.floor(a[0][0]/100)*100+50,25,Math.floor(a[0][2]/100)*100+50),115),a:a,hid:-1};
   /* v162e: el chunk se mantiene .visible (para que proyecte sombra), pero en el pase PRINCIPAL no se dibuja si queda fuera del frustum de la cámara
      (count=0 → three.js omite el draw call; onAfterRender lo restaura antes del siguiente pase de sombras). El pase de sombras no llama a onBeforeRender. */
   im.onBeforeRender=(r_,sc_,cm_)=>{TW.t.value=performance.now()/1000;const fr_=R.info.render.frame;if(fr_!==__tcF){__tcF=fr_;__tcM.multiplyMatrices(cm_.projectionMatrix,cm_.matrixWorldInverse);__tcFr.setFromProjectionMatrix(__tcM)}
    if(!__tcFr.intersectsSphere(tc.s)){tc.hid=im.count;im.count=0}};
   im.onAfterRender=()=>{if(tc.hid>=0){im.count=tc.hid;tc.hid=-1}};
   treeChunks.push(tc)}}