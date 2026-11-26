/* BOIS.IO · 03-terrain-heights.js — Mapa de alturas suavizado, triangulación adaptativa, hAt(), espuma costera
   (líneas 514–566 de BOIS_IO_v119_Optimizado.html) */
// ---------- terrain
const HR=META.hres,TS=META.tscale,HS=META.hscale;let TER=null;
const hAdj=new Float32Array(HR*HR),hD=new Float32Array(HR*HR);
for(let k=0;k<HR*HR;k++){hAdj[k]=hts[k]*HS;hD[k]=hAdj[k]>=1.4?0:1e9}
for(let i=0;i<HR;i++)for(let j=0;j<HR;j++){const k=i*HR+j;let d=hD[k];
 if(i>0){d=Math.min(d,hD[k-HR]+1);if(j>0)d=Math.min(d,hD[k-HR-1]+1.41);if(j<HR-1)d=Math.min(d,hD[k-HR+1]+1.41)}
 if(j>0)d=Math.min(d,hD[k-1]+1);hD[k]=d}
for(let i=HR-1;i>=0;i--)for(let j=HR-1;j>=0;j--){const k=i*HR+j;let d=hD[k];
 if(i<HR-1){d=Math.min(d,hD[k+HR]+1);if(j>0)d=Math.min(d,hD[k+HR-1]+1.41);if(j<HR-1)d=Math.min(d,hD[k+HR+1]+1.41)}
 if(j<HR-1)d=Math.min(d,hD[k+1]+1);hD[k]=d}
for(let k=0;k<HR*HR;k++)if(hD[k]>0)hAdj[k]-=Math.min(8,Math.max(0,hD[k]-.35)*TS*.105);

// Máscara de anclaje bajo edificios fijos para suavizar picos sin enterrar ni dejar flotando construcciones.
{const pin=new Float32Array(HR*HR),h0=hAdj.slice(),tmp=new Float32Array(HR*HR);
 if(typeof META!=='undefined'&&META.groups&&typeof idx!=='undefined'&&typeof pos!=='undefined'){
  for(const G of META.groups){
   if(G.name==='Default-Diffuse'||G.name==='Tree')continue;
   const end=G.start+G.count;
   for(let t=G.start;t<end;t++){
    const vi=idx[t]*3,ci=Math.round((500-pos[vi])/TS),cj=Math.round((pos[vi+2]+500)/TS);
    for(let di=-4;di<=4;di++){const ii=ci+di;if(ii<0||ii>=HR)continue;
     for(let dj=-4;dj<=4;dj++){const jj=cj+dj;if(jj<0||jj>=HR)continue;
      const d=Math.hypot(di,dj);if(d>4.2)continue;
      const w=d<=2.0?1:1-(d-2.0)/2.2,k=ii*HR+jj;if(w>pin[k])pin[k]=w;
     }
    }
   }
  }
 }
 const clampShore=(k,v)=>{const o=h0[k];if(o>=1.44&&v<1.44)return 1.44;if(o<=1.36&&v>1.36)return 1.36;return v};
 // 1) Des-picado (trimmed mean 6 de 8 vecinos) para eliminar pinchos aislados de 1–2 celdas.
 for(let pass=0;pass<2;pass++){
  tmp.set(hAdj);
  for(let i=1;i<HR-1;i++)for(let j=1;j<HR-1;j++){
   const k=i*HR+j,f=1-pin[k];if(f<=.02)continue;
   let sum=0,mn=1e9,mx=-1e9;
   for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
    if(!di&&!dj)continue;const nv=tmp[(i+di)*HR+(j+dj)];sum+=nv;if(nv<mn)mn=nv;if(nv>mx)mx=nv;
   }
   const avg=(sum-mn-mx)/6,cur=tmp[k];
   if(cur>mx+.18||cur<mn-.18||Math.abs(cur-avg)>.55){
    hAdj[k]=clampShore(k,cur+(avg-cur)*(.88*f));
   }
  }
 }
 // 2) Suavizado gaussiano + realce Taubin acotado para conservar la altura de colinas sin aristas duras.
 for(let pass=0;pass<4;pass++){
  tmp.set(hAdj);
  for(let i=1;i<HR-1;i++)for(let j=1;j<HR-1;j++){
   const k=i*HR+j,f=1-pin[k];if(f<=.02)continue;
   const g=(tmp[k]*4+2*(tmp[k-1]+tmp[k+1]+tmp[k-HR]+tmp[k+HR])+tmp[k-HR-1]+tmp[k-HR+1]+tmp[k+HR-1]+tmp[k+HR+1])/16;
   hAdj[k]=clampShore(k,tmp[k]+(g-tmp[k])*(.56*f));
  }
 }
 tmp.set(hAdj);
 for(let i=1;i<HR-1;i++)for(let j=1;j<HR-1;j++){
  const k=i*HR+j,f=1-pin[k];if(f<=.02)continue;
  let mn=1e9,mx=-1e9;
  for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){if(di||dj){const v=tmp[(i+di)*HR+(j+dj)];if(v<mn)mn=v;if(v>mx)mx=v}}
  const g=(tmp[k]*4+2*(tmp[k-1]+tmp[k+1]+tmp[k-HR]+tmp[k+HR])+tmp[k-HR-1]+tmp[k-HR+1]+tmp[k+HR-1]+tmp[k+HR+1])/16;
  const lifted=Math.max(mn,Math.min(mx,tmp[k]+(tmp[k]-g)*(.28*f)));
  hAdj[k]=clampShore(k,lifted);
 }
}

const hRaw=(i,j)=>hAdj[Math.min(HR-1,Math.max(0,i))*HR+Math.min(HR-1,Math.max(0,j))];
function hAt(x,z){const fx=(500-x)/TS,fz=(z+500)/TS;if(fx<0||fz<0||fx>HR-1||fz>HR-1)return 0;const i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j;
 return (hRaw(i,j)*(1-u)+hRaw(i+1,j)*u)*(1-v)+(hRaw(i,j+1)*(1-u)+hRaw(i+1,j+1)*u)*v}
const hash=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s)};
// v132: ruido de valor SUAVE (interpolado) para el tinte del terreno: el ruido blanco por vértice (cada ~3,9 m) dibujaba parches triangulares/puntos en el pasto.
const vN=(x,y)=>{const i=Math.floor(x),j=Math.floor(y);let u=x-i,v=y-j;u=u*u*(3-2*u);v=v*v*(3-2*v);return(hash(i,j)*(1-u)+hash(i+1,j)*u)*(1-v)+(hash(i,j+1)*(1-u)+hash(i+1,j+1)*u)*v};
const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
// v55: terreno original restaurado, sin zona de aeropuerto.
const AB=[],AP={lock:false,fly:false,dead:0,step(){},cam(){}};
{const tu=new Float32Array(HR*HR*2),tp=new Float32Array(HR*HR*3),tc=new Float32Array(HR*HR*3);
 for(let j=0;j<HR;j++)for(let i=0;i<HR;i++){const k=j*HR+i,h=hRaw(i,j);tp[k*3]=500-i*TS;tp[k*3+1]=h;tp[k*3+2]=-500+j*TS;tu[k*2]=tp[k*3]/7;tu[k*2+1]=tp[k*3+2]/7;
  const sl=Math.hypot(hRaw(i+1,j)-hRaw(i-1,j),hRaw(i,j+1)-hRaw(i,j-1))/(2*TS);
  const nSm=.02+.22*(vN(i/9+3.1,j/9+7.7)*.6+vN(i/3.5+11.3,j/3.5+1.9)*.4);
  const nR=.04+.16*vN(i/4.2+2.3,j/4.2+5.9);
  const sandT=1-sm(1.75,2.95,h),rockT=sm(.52,.92,sl)*(1-sandT*.75),peakT=sm(45,56,h)*(1-rockT*.35);
  const dp=Math.min(1,Math.max(0,1.4-h)/6),g=Math.min(1,Math.max(0,h)/30);
  const n=nSm*(1-rockT)+nR*rockT;
  const cSand=[.74-.34*dp,.67-.14*dp,.47];
  const cGrass=[.27+.11*g+nSm*.38,.52-.03*g+nSm*.34,.20+.03*g+nSm*.20];
  const cRock=[.46,.43,.40];
  const cPeak=[.61,.61,.57];
  let r=cGrass[0]+(cSand[0]-cGrass[0])*sandT;
  let grn=cGrass[1]+(cSand[1]-cGrass[1])*sandT;
  let b=cGrass[2]+(cSand[2]-cGrass[2])*sandT;
  r+=(cRock[0]-r)*rockT;grn+=(cRock[1]-grn)*rockT;b+=(cRock[2]-b)*rockT;
  r+=(cPeak[0]-r)*peakT;grn+=(cPeak[1]-grn)*peakT;b+=(cPeak[2]-b)*peakT;
  const v=.90+n*.33,rk=1-sm(.48,.92,sl)*.28;
  // Conservar compatibilidad directa con el factor de tono utilizado por 12-weather en el terreno.
  tc[k*3]=Math.max(.05,Math.min(1.25,(v-.32*dp)*rk*(1+(r-.45)*.28)));
  tc[k*3+1]=Math.max(.05,Math.min(1.25,(v-.14*dp)*rk*(1+(grn-.45)*.28)));
  tc[k*3+2]=Math.max(.05,Math.min(1.25,(v-.06*dp)*rk*(1+(b-.45)*.28)))}
 const ti=new Uint32Array((HR-1)*(HR-1)*6);let p=0;
 for(let j=0;j<HR-1;j++)for(let i=0;i<HR-1;i++){
  const a=j*HR+i,b=a+1,c=a+HR,d=c+1;
  if(Math.abs(hRaw(i+1,j)-hRaw(i,j+1))<=Math.abs(hRaw(i,j)-hRaw(i+1,j+1))){ti[p++]=a;ti[p++]=b;ti[p++]=c;ti[p++]=b;ti[p++]=d;ti[p++]=c}
  else{ti[p++]=a;ti[p++]=b;ti[p++]=d;ti[p++]=a;ti[p++]=d;ti[p++]=c}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(tp,3));g.setAttribute('color',new THREE.BufferAttribute(tc,3));g.setAttribute('uv',new THREE.BufferAttribute(tu,2));g.setIndex(new THREE.BufferAttribute(ti,1));g.computeVertexNormals();
 const m=new THREE.Mesh(g,terrMat());m.receiveShadow=true;scene.add(m);TER={g,tp,tc,m}}
// v107 · Costuras de espuma + persistencia/configuración + resolución adaptativa estabilizada:
// v106 · Costuras de espuma: una línea costera muy sutil ayuda a leer la separación
// entre tierra y agua desde lejos. Se genera una sola geometría estática.
{
 const level=1.50,foamPos=[];
 const edgePoint=(i0,j0,i1,j1,a,b)=>{
   const den=b-a,t=Math.abs(den)<1e-8?.5:Math.max(0,Math.min(1,(level-a)/den));
   return [500-(i0+(i1-i0)*t)*TS,1.60,-500+(j0+(j1-j0)*t)*TS];
 };
 for(let j=0;j<HR-1;j++)for(let i=0;i<HR-1;i++){
   const a=hRaw(i,j),b=hRaw(i+1,j),c=hRaw(i+1,j+1),d=hRaw(i,j+1),pts=[];
   if((a<level)!==(b<level))pts.push(edgePoint(i,j,i+1,j,a,b));
   if((b<level)!==(c<level))pts.push(edgePoint(i+1,j,i+1,j+1,b,c));
   if((c<level)!==(d<level))pts.push(edgePoint(i+1,j+1,i,j+1,c,d));
   if((d<level)!==(a<level))pts.push(edgePoint(i,j+1,i,j,d,a));
   if(pts.length===2)foamPos.push(...pts[0],...pts[1]);
   else if(pts.length===4)foamPos.push(...pts[0],...pts[1],...pts[2],...pts[3]);
 }
 if(foamPos.length){
   const fg=new THREE.BufferGeometry();
   fg.setAttribute('position',new THREE.Float32BufferAttribute(foamPos,3));
   const fm=new THREE.LineBasicMaterial({color:0xd8eee9,transparent:true,opacity:.16,depthWrite:false});
   const coastFoam=new THREE.LineSegments(fg,fm);coastFoam.frustumCulled=false;coastFoam.renderOrder=2;scene.add(coastFoam);
 }
}
