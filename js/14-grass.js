/* BOIS.IO · 14-grass.js — Césped instanciado con viento
   (líneas 1658–1687 de BOIS_IO_v119_Optimizado.html) */
// ---------- v23: césped (matas instanciadas por celdas de 16 m, con viento y desvanecido en el borde)
// v123: césped denso y peludo: más matas por celda, más briznas por mata, radio más corto pero lleno.
const CSZ=16,GR=2,GN=touch?360:1050,gGeo=new THREE.BufferGeometry(),GU={t:{value:0},w:{value:.7},r:{value:GR*CSZ-4}};
{const P=[],C=[],N=[],R_=Math.random,NB=7,
 // v132: colores calibrados al albedo del suelo (≈ .04,.11,.01 lineal). Antes la punta era ~5× más clara que el terreno y la base ~3× más oscura:
 // cada brizna fina brillaba como un "punto". Ahora base ≈ suelo y punta solo un poco más clara/amarillenta.
 b0=new THREE.Color().setRGB(.26,.44,.16).convertSRGBToLinear(),b1=new THREE.Color().setRGB(.47,.68,.24).convertSRGBToLinear()/* v133: verdes más vivos: antes (.16,.29,.085)/(.33,.5,.16) quedaban ~negros con la iluminación */,c0=new THREE.Color(),c1=new THREE.Color();
 for(let k=0;k<NB;k++){const an=k*(6.283/NB)+R_()*.7,r=.02+R_()*.12,bx=Math.cos(an)*r,bz=Math.sin(an)*r,th=R_()*6.283,hw=.038+R_()*.024,px=-Math.sin(th)*hw,pz=Math.cos(th)*hw,
   h=.3+Math.pow(R_(),1.6)*.42,l=.05+R_()*.2,tx=bx+Math.cos(an)*l,tz=bz+Math.sin(an)*l,tv=.92+R_()*.16,ye=R_();
  c0.copy(b0).multiplyScalar(tv);c1.copy(b1).multiplyScalar(tv);c1.r*=1+ye*.25;c1.b*=1-ye*.3; // variación por brizna (algunas más amarillentas)
  const L=[bx+px,0,bz+pz],Rr=[bx-px,0,bz-pz],T=[tx,h,tz];
  for(const tri of[[L,Rr,T],[Rr,L,T]])for(const v of tri){P.push(...v);const c=v[1]>0?c1:c0;C.push(c.r,c.g,c.b);N.push(0,1,0)}}
 gGeo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));gGeo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));gGeo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3))}
const gMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,emissive:new THREE.Color(.016,.040,.008)/* v133: piso de luz verde: ni en sombra ni de noche se ven negras */});
// v132: el tono macro (manchas grandes claras/oscuras, tgMac del terreno) también se aplica a las briznas: se funden con el suelo en vez de verse como motas sueltas.
const G_FN=`uniform float uT,uW,uR;varying vec3 vGm;varying vec2 vGrassUv;
float gH(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float gV(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gH(i),gH(i+vec2(1.,0.)),f.x),mix(gH(i+vec2(0.,1.)),gH(i+vec2(1.,1.)),f.x),f.y);}
float gF(vec2 p){return gV(p)*.6+gV(p*2.13+vec2(7.7,3.1))*.4;}
vec3 gMac(vec2 P){float m1=gF(P*.0105+vec2(11.3,4.1)),m2=gF(P*.041+vec2(2.7,9.9)),m3=gF(P*.17+vec2(23.1,6.4));
 float b=mix(.74,1.32,m1)*mix(.88,1.12,m2)*mix(.9,1.1,m3);
 return b*mix(vec3(1.07,1.02,.88),vec3(.92,1.,1.1),gV(P*.018+vec2(40.,13.)));}
`;
gMat.onBeforeCompile=s=>{s.uniforms.uT=GU.t;s.uniforms.uW=GU.w;s.uniforms.uR=GU.r;s.uniforms.uGrassMask={value:spU.uSp.value};
 s.vertexShader=G_FN+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 ip=instanceMatrix[3].xyz;vGm=gMac(ip.xz);vGrassUv=vec2((500.-ip.x)/1000.,(ip.z+500.)/1000.);float ph=ip.x*.7+ip.z*.9;float sw=(sin(uT*1.7+ph)+.5*sin(uT*3.3+ph*1.9))*uW*.1;transformed.x+=sw*position.y;transformed.z+=sw*.6*position.y;transformed*=1.-smoothstep(uR-14.,uR,length(ip.xz-cameraPosition.xz));');
 s.fragmentShader='uniform sampler2D uGrassMask;varying vec2 vGrassUv;varying vec3 vGm;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec3 gm=texture2D(uGrassMask,vGrassUv).rgb;float pathMask=smoothstep(.30,.62,gm.g);float remain=1.-pathMask;float grassWeight=gm.b*remain/(gm.r*remain+gm.b*remain+pathMask+.001);if(grassWeight<.46)discard;diffuseColor.rgb*=vGm;')};
const gPool=[],gE=new THREE.Euler(),gQ=new THREE.Quaternion(),gM=new THREE.Matrix4(),gP=new THREE.Vector3(),gS=new THREE.Vector3(),gC=new THREE.Color();
for(let i=0;i<(2*GR+1)**2;i++){const m=new THREE.InstancedMesh(gGeo,gMat,GN);m.count=0;m.frustumCulled=false;m.visible=false;m.receiveShadow=!touch;m.setColorAt(0,gC.setRGB(1,1,1));scene.add(m);gPool.push({m,k:null,ax:0,az:0,cy:0})}
const gNB=arNB;
const gTB=atob(TRAIL_MASK_B64),gTO=[[0,0],[1.6,0],[-1.6,0],[0,1.6],[0,-1.6]]/* v162e: constante hoisted (antes se creaba un array por brizna candidata) */,gOnTrail=(x,z)=>{for(const o of gTO){const ix=Math.max(0,Math.min(511,Math.round((500-x-o[0])*.511))),iy=Math.max(0,Math.min(511,Math.round((500-z-o[1])*.511))),k=iy*512+ix;if(gTB.charCodeAt(k>>3)&(1<<(k&7)))return true}return false};
function gFill(m,cx,cz){let n=0;const ca=AP.cr||[],ch4=window.__boisCh4Bounds;
 for(let i=0;i<GN;i++){const k=((cx*73856+cz*19349)%100003)+i*83,x=(cx+hash(k,1.3))*CSZ,z=(cz+hash(k,2.7))*CSZ,h=hAt(x,z);
  if(h<3.25||h>54||gNB(x,z)||gOnTrail(x,z))continue;
  if(ch4&&Math.abs(x-ch4.cx)<=ch4.hx&&Math.abs(z-ch4.cz)<=ch4.hz)continue;
  if(Math.abs(hAt(x+1.5,z)-h)+Math.abs(hAt(x,z+1.5)-h)>1.8)continue;
  let bad=0;for(const c of ca)if((x-c[0])**2+(z-c[1])**2<144){bad=1;break}if(bad)continue;
  const s=.85+hash(k,3.9)*.35;gE.set(0,hash(k,5.1)*6.28,0);gQ.setFromEuler(gE);gM.compose(gP.set(x,h-.03,z),gQ,gS.set(s,s*(.85+hash(k,6.3)*.3),s));m.setMatrixAt(n,gM);
  const v=.92+hash(k,7.7)*.16;m.setColorAt(n,gC.setRGB(v,v*(.97+hash(k,8.3)*.06),v*(.9+hash(k,9.1)*.14)));n++}
 m.count=n;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true}
let gcx=1e9,gcz=1e9,gLc=null,gVis=false;
const gSph=new THREE.Sphere();
/* v139: las briznas se descartan en el shader si el splat map no indica césped; ya no invaden arena, tierra ni caminos.
   v132: grass() NO se llamaba desde el bucle principal (solo quedaba el comentario "grass static"): las matas 3D no se dibujaban.
   Se reactiva, ahora con culling por celda (frustum + radio de desvanecido) para dibujar solo ~la mitad de las 25 celdas. */
function grass(dt,tt){GU.t.value=tt;GU.w.value=.7+(WX.st.rain||0)*1.6+(WX.st.sc||0)*1.1;const au=WX.st.aut||0;gMat.color.setRGB(1+.5*au,1-.12*au,1-.5*au);
 if(AP.lock||uw||PR.on||S.y-Math.max(hAt(S.x,S.z),WL)>28||qi===0){if(gVis){for(const p of gPool)p.m.visible=false;gVis=false;gcx=1e9}return}
 const cx=Math.floor(S.x/CSZ),cz=Math.floor(S.z/CSZ),ca=AP.cr||[],lc=ca[ca.length-1];
 if(!(gVis&&cx===gcx&&cz===gcz&&lc===gLc)){
  const force=lc!==gLc;gLc=lc;gcx=cx;gcz=cz;gVis=true;const have=new Set(),free=[];
  for(const p of gPool){if(p.k!==null&&(force||Math.abs(p.ax-cx)>GR||Math.abs(p.az-cz)>GR))p.k=null;if(p.k===null)free.push(p);else have.add(p.k)}
  let nFill=0,pend=false;/* v123: máx. 2 celdas por frame para evitar tirones al cruzar de celda */
  for(let dz=-GR;dz<=GR;dz++)for(let dx=-GR;dx<=GR;dx++){const ax=cx+dx,az=cz+dz,key=ax+','+az;if(have.has(key))continue;if(nFill>=2){pend=true;continue}const p=free.pop();if(!p)continue;p.k=key;p.ax=ax;p.az=az;p.cy=hAt((ax+.5)*CSZ,(az+.5)*CSZ);gFill(p.m,ax,az);nFill++}
  if(pend)gcx=1e9}
 // culling por celda cada frame (barato: 25 esferas)
 const px=cam.position.x,pz=cam.position.z,lim=(GU.r.value+12)**2;
 for(const p of gPool){let v=p.k!==null&&p.m.count>0;
  if(v){const dx=(p.ax+.5)*CSZ-px,dz=(p.az+.5)*CSZ-pz,d2=dx*dx+dz*dz;
   if(d2>lim)v=false;else if(d2>400){gSph.center.set(px+dx,p.cy,pz+dz);gSph.radius=17;v=FR.intersectsSphere(gSph)}}
  p.m.visible=v}}
// v52: mecánica del DeLorean retirada; se conserva el mundo y su ambientación.
