/* BOIS.IO · 36d-world-polish.js — Iluminación de rebote y detalles del suelo
   v138: una capa ambiental ligera para que el bosque se sienta más habitado sin recargar el mapa. */
let __boisWorldPolishFrame = ()=>{};
try {
  // Luz de relleno celeste: no proyecta sombras; suaviza el lado oscuro de árboles, rocas y edificios.
  const skyFill = new THREE.DirectionalLight(0xb8d2e9, .2);
  skyFill.castShadow = false;
  skyFill.position.set(0,80,0);
  skyFill.target.position.set(0,0,0);
  scene.add(skyFill, skyFill.target);
  const fillWarm = new THREE.Color(0xe8bda0), fillCool = new THREE.Color(0xa9c8e5);
  const fillPoint = new THREE.Vector3();

  __boisWorldPolishFrame = (dt, tt)=>{
    if (!PC || !cam || !WX || !WX.st || uw || PR.on) {
      skyFill.intensity = 0;
      return;
    }
    const p = PC, d = p.dir || [0,1,0], st = WX.st;
    const x = cam.position.x, y = cam.position.y, z = cam.position.z;
    // El relleno llega desde el lado opuesto al sol, pero siempre desde arriba del horizonte.
    skyFill.position.set(x - d[0]*115, y + Math.max(34, Math.abs(d[1])*72), z - d[2]*115);
    fillPoint.set(x, y - 2.2, z);
    skyFill.target.position.copy(fillPoint);
    skyFill.target.updateMatrixWorld();
    skyFill.color.copy(fillCool).lerp(fillWarm, Math.max(0, Math.min(1, (p.dusk||0)*.24)));
    const weather = Math.min(1, (st.rain||0)*.65 + (st.fog||0)*.35 + (st.sc||0)*.25);
    skyFill.intensity = .19 + (p.night||0)*.065 + weather*.075;
  };

  // Máscara de senderos: evita colocar decoración nueva encima de los caminos existentes.
  const trailBits = atob(TRAIL_MASK_B64);
  const nearTrail = (x,z)=>{
    const ix = Math.max(0,Math.min(511,Math.round((500-x)*.511)));
    const iy = Math.max(0,Math.min(511,Math.round((500-z)*.511)));
    const k = iy*512+ix;
    return (trailBits.charCodeAt(k>>3) & (1<<(k&7))) !== 0;
  };

  const reserved = new Set();
  const canPlace = (x,z,h)=>{
    if (h < 2.45 || h > 43 || Math.abs(x)>474 || Math.abs(z)>474) return false;
    if (window.__inLake && window.__inLake(x,z)) return false;
    if (nearTrail(x,z)) return false;
    const ch4 = window.__boisCh4Bounds;
    if (ch4 && Math.abs(x-ch4.cx)<=ch4.hx && Math.abs(z-ch4.cz)<=ch4.hz) return false;
    const ci = Math.floor(x/CS), cj = Math.floor(z/CS);
    // Mantiene una separación prudente respecto de edificios y estructuras del mapa.
    for (let a=-1;a<=1;a++) for (let b=-1;b<=1;b++) {
      if (cells.has((ci+a)*4096+cj+b)) return false;
    }
    const slope = Math.hypot(hAt(x+2,z)-hAt(x-2,z),hAt(x,z+2)-hAt(x,z-2))*.25;
    if (slope > .52) return false;
    return true;
  };
  const sample = (count, seed, spacing)=>{
    const out=[];
    for(let n=0;n<90000 && out.length<count;n++){
      const x=(hash(n+seed,17.31)*2-1)*474;
      const z=(hash(n+seed,83.17)*2-1)*474;
      const h=hAt(x,z);
      if(!canPlace(x,z,h)) continue;
      const gx=Math.floor(x/spacing), gz=Math.floor(z/spacing), key=gx+':'+gz;
      if(reserved.has(key)) continue;
      reserved.add(key);
      out.push({x,z,y:h,n});
    }
    return out;
  };
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  const addInstances = (geo,mat,items,transform,seed)=>{
    if(!items.length) return null;
    const mesh = new THREE.InstancedMesh(geo,mat,items.length);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    items.forEach((it,i)=>{
      transform(dummy,it,i);
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      const tint=.86+hash(i+seed,3.91)*.24;
      color.setRGB(tint,tint,tint);
      mesh.setColorAt(i,color);
    });
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
    if(typeof mesh.computeBoundingSphere==='function') mesh.computeBoundingSphere();
    mesh.frustumCulled = true;
    scene.add(mesh);
    return mesh;
  };

  // Arbustos bajos de varias copas; se mantienen por debajo de la línea de visión.
  const shrubGeo = merge([
    {g:new THREE.IcosahedronGeometry(.46,1).scale(1.0,.78,.95).translate(-.28,.42,0),c:lin(.17,.34,.14)},
    {g:new THREE.IcosahedronGeometry(.52,1).scale(.9,.8,.9).translate(.24,.48,-.04),c:lin(.22,.40,.16)},
    {g:new THREE.IcosahedronGeometry(.38,1).scale(1,.86,1).translate(0,.68,.24),c:lin(.28,.45,.18)}
  ]);
  const shrubMat = new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98,flatShading:true});
  window.__boisPolishMats = { shrub: shrubMat };
  const shrubs = sample(touch?145:290, 101, 8.5);
  addInstances(shrubGeo,shrubMat,shrubs,(o,p,i)=>{
    const s=.72+hash(i,19.1)*.62;
    o.position.set(p.x,p.y,p.z);o.rotation.set(0,hash(i,27.4)*Math.PI*2,0);o.scale.set(s,s,s);
  },101);

  // Pequeños grupos de hongos de tonos terrosos, visibles solo al acercarse.
  const mushroomGeo = merge([
    {g:new THREE.CylinderGeometry(.025,.037,.15,6).translate(-.12,.075,0),c:lin(.72,.62,.45)},
    {g:new THREE.SphereGeometry(.092,8,6).scale(1,.52,1).translate(-.12,.16,0),c:lin(.62,.25,.18)},
    {g:new THREE.CylinderGeometry(.022,.032,.12,6).translate(.12,.06,.08),c:lin(.72,.62,.45)},
    {g:new THREE.SphereGeometry(.075,8,6).scale(1,.5,1).translate(.12,.125,.08),c:lin(.72,.48,.28)},
    {g:new THREE.CylinderGeometry(.018,.027,.095,6).translate(.015,.047,-.14),c:lin(.72,.62,.45)},
    {g:new THREE.SphereGeometry(.06,8,6).scale(1,.5,1).translate(.015,.1,-.14),c:lin(.62,.25,.18)}
  ]);
  const mushroomMat = new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,flatShading:true});
  const mushrooms = sample(touch?38:82, 307, 12);
  addInstances(mushroomGeo,mushroomMat,mushrooms,(o,p,i)=>{
    const s=.7+hash(i,31.2)*.55;
    o.position.set(p.x,p.y+.015,p.z);o.rotation.set(0,hash(i,34.7)*Math.PI*2,0);o.scale.set(s,s,s);
  },307);

  // Troncos caídos y piedras pequeñas rompen la repetición del suelo sin bloquear el paso.
  const logGeo = new THREE.CylinderGeometry(.105,.15,1.45,7);
  const logMat = new THREE.MeshStandardMaterial({color:0x76543a,roughness:1});
  const logs = sample(touch?24:54, 509, 15);
  const up = new THREE.Vector3(0,1,0);
  addInstances(logGeo,logMat,logs,(o,p,i)=>{
    const a=hash(i,47.2)*Math.PI*2;
    o.position.set(p.x,p.y+.13,p.z);
    o.quaternion.setFromUnitVectors(up,new THREE.Vector3(Math.cos(a),0,Math.sin(a)));
    const s=.72+hash(i,49.8)*.7;o.scale.set(s,s,s);
  },509);

  const rockGeo = new THREE.DodecahedronGeometry(1,0);
  const rockMat = new THREE.MeshStandardMaterial({color:0x77796d,roughness:1,flatShading:true});
  const rocks = sample(touch?62:126, 701, 6.8);
  addInstances(rockGeo,rockMat,rocks,(o,p,i)=>{
    o.position.set(p.x,p.y+.08,p.z);
    o.rotation.set(hash(i,61)*.45,hash(i,63)*Math.PI*2,hash(i,67)*.35);
    const sx=.12+hash(i,71)*.19, sy=.08+hash(i,73)*.13, sz=.12+hash(i,79)*.2;
    o.scale.set(sx,sy,sz);
  },701);

  window.__boisWorldPolish = {
    shrubs:shrubs.length, mushrooms:mushrooms.length, logs:logs.length, rocks:rocks.length,
    fillLight:true
  };
  console.info('BOIS.IO · entorno añadido',window.__boisWorldPolish);
} catch (e) {
  console.warn('BOIS.IO · la capa de detalle ambiental no se pudo crear:',e);
}
function worldPolishFrame(dt,tt){
  try { __boisWorldPolishFrame(dt,tt); }
  catch(e){ if(!window.__boisWorldPolishWarned){window.__boisWorldPolishWarned=true;console.warn('worldPolishFrame:',e);} }
}
