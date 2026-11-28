/* BOIS.IO · 33-shore-life.js — Ribera viva: vegetación acuática
   (líneas 3545–3629 de BOIS_IO_v119_Optimizado.html) */
// v115 · Ribera viva: vegetación acuática y detalles naturales alrededor del lago.
// InstancedMesh mantiene pocos draw calls; la vegetación es decorativa y no altera colisiones.
{
 try{
  const nearLake=(x,z)=>{
   if(!window.__inLake||window.__inLake(x,z))return false;
   for(let a=0;a<8;a++){
    const ang=a*Math.PI/4;
    if(window.__inLake(x+Math.cos(ang)*7,z+Math.sin(ang)*7))return true;
   }
   return false;
  };
  const plantMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0,side:THREE.DoubleSide});
  const flowerMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0,side:THREE.DoubleSide});
  const stem=(r,h,y)=>new THREE.CylinderGeometry(r*.72,r,h,5).translate(0,y,0);
  const bladeParts=[];
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3,hh=.42+(i%3)*.12,rr=.045+(i%2)*.012;
   const g=new THREE.ConeGeometry(rr,hh,5);
   g.translate(Math.cos(a)*.12,hh*.48,Math.sin(a)*.12);g.rotateZ(-Math.cos(a)*.22);g.rotateX(Math.sin(a)*.22);
   bladeParts.push({g,c:lin(i%2?.22:.16,i%2?.43:.36,i%2?.12:.09)});
  }
  const grassGeo=merge(bladeParts);
  const reedParts=[];
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2,x=Math.cos(a)*.12,z=Math.sin(a)*.12,h=.85+(i%3)*.18;
   const g=stem(.025,h,h/2);g.translate(x,0,z);reedParts.push({g,c:lin(.18,.36,.13)});
   const leaf=new THREE.ConeGeometry(.035,.42,4);leaf.translate(x+Math.cos(a+1)*.10,h*.52,z+Math.sin(a+1)*.10);leaf.rotateZ(-Math.cos(a+1)*.55);leaf.rotateX(Math.sin(a+1)*.55);
   reedParts.push({g:leaf,c:lin(.25,.43,.16)});
  }
  const reedGeo=merge(reedParts);
  const flowerParts=[{g:stem(.018,.38,.19),c:lin(.16,.31,.12)}];
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5,petal=new THREE.SphereGeometry(.055,7,5);
   petal.scale(.8,.45,1.15);petal.translate(Math.cos(a)*.055,.4,Math.sin(a)*.055);
   flowerParts.push({g:petal,c:lin(.92,.72,.63)});
  }
  const flowerCenter=new THREE.SphereGeometry(.035,7,5);flowerCenter.translate(0,.42,0);flowerParts.push({g:flowerCenter,c:lin(.96,.72,.25)});
  const flowerGeo=merge(flowerParts);
  const rockGeo=new THREE.DodecahedronGeometry(1,0);
  const makeInstances=(geo,mat,items)=>{
   if(!items.length)return null;
   const im=new THREE.InstancedMesh(geo,mat,items.length),dummy=new THREE.Object3D(),color=new THREE.Color();
   im.castShadow=false;im.receiveShadow=true;
   items.forEach((it,i)=>{
    dummy.position.set(it.x,it.y,it.z);dummy.rotation.set(it.rx||0,it.ry||0,it.rz||0);dummy.scale.set(it.sx,it.sy,it.sz);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);
    const v=it.tint||1;color.setRGB(v,v,v);im.setColorAt(i,color);
   });
   im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
   if(typeof window.__boisComputeInstBounds==='function')window.__boisComputeInstBounds(im);
   else{if(typeof im.computeBoundingSphere==='function')im.computeBoundingSphere();im.frustumCulled=true;}
   scene.add(im);return im;
  };
  const grass=[],reeds=[],flowers=[],rocks=[];
  const max=touch?1100:2600;
  for(let n=0;n<max*30&&(grass.length+reeds.length+flowers.length+rocks.length)<max;n++){
   const x=(Math.random()*2-1)*475,z=(Math.random()*2-1)*475,h=hAt(x,z);
   if(h<1.48||h>6.8||!nearLake(x,z))continue;
   const slope=Math.hypot(hAt(x+2,z)-hAt(x-2,z),hAt(x,z+2)-hAt(x,z-2))*.25;
   if(slope>.62)continue;
   const ci=Math.floor(x/CS),cj=Math.floor(z/CS);let occupied=false;
   for(let a=-1;a<=1&&!occupied;a++)for(let b=-1;b<=1;b++)if(cells.has((ci+a)*4096+cj+b)){occupied=true;break}
   if(occupied)continue;
   const y=h+.025,r=Math.random();
   if(r<.48)grass.push({x,y,z,rx:(Math.random()-.5)*.12,ry:Math.random()*Math.PI*2,rz:0,sx:.72+Math.random()*.65,sy:.72+Math.random()*.9,sz:.72+Math.random()*.65,tint:.82+Math.random()*.3});
   else if(r<.70)reeds.push({x,y,z,rx:(Math.random()-.5)*.08,ry:Math.random()*Math.PI*2,rz:0,sx:.72+Math.random()*.55,sy:.72+Math.random()*.9,sz:.72+Math.random()*.55,tint:.84+Math.random()*.25});
   else if(r<.80)flowers.push({x,y,z,ry:Math.random()*Math.PI*2,sx:.75+Math.random()*.5,sy:.75+Math.random()*.5,sz:.75+Math.random()*.5,tint:.86+Math.random()*.2});
   else{const pb=Math.random()<.65;rocks.push({x,y:y-.08,z,rx:Math.random()*.4,ry:Math.random()*Math.PI,rz:Math.random()*.3,sx:pb?.05+Math.random()*.1:.22+Math.random()*.38,sy:pb?.03+Math.random()*.06:.12+Math.random()*.23,sz:pb?.05+Math.random()*.1:.2+Math.random()*.35,tint:.72+Math.random()*.35})}
  }
  makeInstances(grassGeo,plantMat,grass);
  makeInstances(reedGeo,plantMat,reeds);
  makeInstances(flowerGeo,flowerMat,flowers);
  const rockMat=new THREE.MeshStandardMaterial({color:0x77766d,roughness:1});makeInstances(rockGeo,rockMat,rocks);
  // Hojas flotantes pequeñas: solo aparecen dentro del contorno real del lago.
  const padGeo=new THREE.CircleGeometry(.58,16,.28,Math.PI*1.78);
  const padMat=new THREE.MeshStandardMaterial({color:0x477b43,roughness:.88,side:THREE.DoubleSide});
  const padCount=touch?70:150,pads=new THREE.InstancedMesh(padGeo,padMat,padCount),pd=new THREE.Object3D(),padPos=[];
  for(let n=0;n<7000&&padPos.length<padCount;n++){
   const x=(Math.random()*2-1)*450,z=(Math.random()*2-1)*450;
   if(!window.__inLake(x,z)||hAt(x,z)>WL-.35)continue;
   if(padPos.some(q=>Math.hypot(q.x-x,q.z-z)<5.5))continue;
   padPos.push({x,z});
  }
  pads.count=padPos.length;pads.castShadow=false;pads.receiveShadow=false;
  padPos.forEach((q,i)=>{pd.position.set(q.x,WL+.17,q.z);pd.rotation.set(-Math.PI/2,Math.random()*Math.PI*2,0);const sc=.72+Math.random()*.65;pd.scale.set(sc,sc,sc);pd.updateMatrix();pads.setMatrixAt(i,pd.matrix)});
  pads.instanceMatrix.needsUpdate=true;
  if(typeof window.__boisComputeInstBounds==='function')window.__boisComputeInstBounds(pads);
  else{if(typeof pads.computeBoundingSphere==='function')pads.computeBoundingSphere();pads.frustumCulled=true;}
  scene.add(pads);
  window.__boisShoreMats={plant:plantMat,pad:padMat};
  window.__boisShoreDecor={grass:grass.length,reeds:reeds.length,flowers:flowers.length,rocks:rocks.length};
 }catch(e){console.warn('v115: decoración de la ribera no disponible',e)}
}
