/* BOIS.IO · 09-sky.js — Cielo por shader mejorado, nubes multicapa, estrellas, agua */
// ---------- sky, water, light
const lt_=t=>{t.encoding=THREE.LinearEncoding;t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;return t};

// Cielo nocturno limpio con estrellas y Luna (sin textura de Vía Láctea)

// Textura procedural de la Luna
const moonTex=lt_(canvasTex(256,256,(x,w,h)=>{
 const c=128,R_=Math.random,C=(px,py,r)=>{x.beginPath();x.arc(px,py,r,0,7)};
 x.fillStyle='rgba(120,130,165,.16)';C(c,c,c-6);x.fill();
 const g=x.createRadialGradient(c-20,c-20,8,c,c,c-6);
 g.addColorStop(0,'#fffaf0');g.addColorStop(.7,'#e6ddcb');g.addColorStop(1,'#b9b09e');
 x.fillStyle=g;C(c,c,c-6);x.fill();x.save();C(c,c,c-6);x.clip();
 for(const[mx,my,mr]of[[-30,-25,34],[20,-40,26],[-45,15,22],[10,20,30],[40,5,20],[-5,55,24]]){
  x.fillStyle='rgba(98,104,122,.42)';C(c+mx,c+my,mr);x.fill();
 }
 for(let i=0;i<46;i++){
  const px=c+(R_()-.5)*200,py=c+(R_()-.5)*200,r=2+R_()*7;
  x.strokeStyle='rgba(70,72,84,.35)';x.lineWidth=1.2;C(px,py,r);x.stroke();
  x.strokeStyle='rgba(255,255,245,.3)';C(px-1,py-1,r);x.stroke();
 }
 const t=x.createLinearGradient(c+10,0,c+c,0);t.addColorStop(0,'rgba(6,8,22,0)');t.addColorStop(1,'rgba(6,8,22,.88)');
 x.fillStyle=t;x.fillRect(0,0,w,h);
 const l=x.createRadialGradient(c,c,c*.7,c,c,c-6);l.addColorStop(0,'rgba(0,0,0,0)');l.addColorStop(1,'rgba(20,20,30,.5)');
 x.fillStyle=l;x.fillRect(0,0,w,h);x.restore();
 x.globalCompositeOperation='destination-in';
 const e=x.createRadialGradient(c,c,c-12,c,c,c-5);e.addColorStop(0,'#fff');e.addColorStop(1,'rgba(255,255,255,0)');
 x.fillStyle=e;x.fillRect(0,0,w,h);
}));
moonTex.wrapS=moonTex.wrapT=THREE.ClampToEdgeWrapping;

const skyTint=new THREE.Color(1,1,1);
const sky=new THREE.Mesh(new THREE.SphereGeometry(2300,64,48),new THREE.ShaderMaterial({uniforms:{
 uSun:{value:new THREE.Vector3(0,1,0)},uMoon:{value:new THREE.Vector3(0,-1,0)},
 uTop:{value:new THREE.Vector3()},uMid:{value:new THREE.Vector3()},uHor:{value:new THREE.Vector3()},
 uSc:{value:new THREE.Vector3()},uTint:{value:skyTint},uDusk:{value:0},uNight:{value:0},uMoonK:{value:0},
 uOv:{value:0},uCs:{value:0},uTime:{value:0},uMoonTex:{value:moonTex}
},
vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
fragmentShader:`varying vec3 vD;
uniform vec3 uSun,uMoon,uTop,uMid,uHor,uSc,uTint;
uniform float uDusk,uNight,uMoonK,uOv,uTime,uCs;
uniform sampler2D uMoonTex;

float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){
 vec2 i=floor(p),f=fract(p);
 f=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);
}
// Rotación entre octavas para eliminar patrones cuadrados en las nubes
const mat2 fbmRot=mat2(0.80,-0.60,0.60,0.80);
float fbm(vec2 p){
 float a=0.5,s=0.0;
 for(int i=0;i<5;i++){
  s+=a*vn(p);
  p=fbmRot*p*2.04+vec2(17.1,9.3);
  a*=0.5;
 }
 return s;
}
// Ruido billowy (bordes esponjosos tipo algodón para cúmulos)
float billow(vec2 p){
 float a=0.5,s=0.0;
 for(int i=0;i<4;i++){
  float n=abs(vn(p)*2.0-1.0);
  s+=a*(1.0-n);
  p=fbmRot*p*2.07+vec2(13.7,29.1);
  a*=0.5;
 }
 return s;
}

void main(){
 vec3 d=normalize(vD);
 float y=d.y,t=clamp(y,0.,1.);
 float ovs=clamp(uOv+uCs*.85,0.,1.);
 float h=smoothstep(0.,.55,t),z=smoothstep(.28,1.,t);
 vec3 col=mix(uHor,uMid,pow(h,.82));
 col=mix(col,uTop,pow(z,.82));
 col+=uHor*pow(max(1.-abs(y),0.),2.7)*.055;
 if(y<0.)col=mix(col,uHor*.46,clamp(-y*4.5,0.,1.));

 // Atmósfera y dispersión solar
 float s=dot(d,uSun),sunMask=smoothstep(-.15,.28,s);
 float sa=sqrt(max(2.*(1.-s),0.)),dusk=clamp(uDusk,0.,1.);
 float sunHalo=exp(-sa*2.75),sunCore=exp(-sa*18.);
 col+=uSc*(sunHalo*(.14+.30*dusk)+sunCore*(.60+.45*dusk)+exp(-sa*1.05)*(.07+.10*dusk)+exp(-sa*52.)*1.4)*sunMask*(1.-ovs*.72);
 col+=vec3(1.,.82,.55)*smoothstep(.55,.0,abs(sa-.34))*.035*(1.-uNight)*sunMask*(1.-ovs);

 vec2 hdir=normalize(d.xz+1e-4),sdir=normalize(uSun.xz+1e-4);
 float az=dot(hdir,sdir),opp=max(-az,0.),horizonGate=smoothstep(0.,.48,1.-abs(y));
 col=mix(col,vec3(1.0,.37,.58),opp*horizonGate*dusk*(1.-uNight)*.16);
 col=mix(col,vec3(.18,.22,.48),opp*pow(max(1.-t,0.),1.7)*dusk*.18);

 // Cinturón rosado encima del horizonte en el crepúsculo
 float band=smoothstep(0.,.11,t)*(1.-smoothstep(.12,.28,t));
 col+=vec3(1.0,.26,.42)*band*dusk*(1.-uNight)*.11;

 // Degradado atmosférico enriquecido de día y atardecer
 float dayk=(1.-uNight)*(1.-uDusk)*(1.-ovs);
 col=mix(col,vec3(.55,.86,1.),pow(1.-t,3.4)*.30*dayk);
 col=mix(col,vec3(.04,.20,.80),smoothstep(.45,1.,t)*.32*dayk);
 float du=uDusk*(1.-ovs*.8);
 vec3 tw=mix(vec3(1.,.66,.28),vec3(.98,.40,.58),smoothstep(0.,.16,t));
 tw=mix(tw,vec3(.46,.30,.72),smoothstep(.12,.42,t));
 tw=mix(tw,vec3(.12,.16,.46),smoothstep(.38,.95,t));
 float az2=max(dot(normalize(vec3(d.x,0.,d.z)+1e-4),normalize(vec3(uSun.x,0.,uSun.z)+1e-4)),0.);
 col=mix(col,tw,du*(.30+.45*az2)*smoothstep(-.04,.05,y));

 // Sol y Luna detrás de las nubes para que las nubes los tapen de forma realista
 float disk=smoothstep(.028,.020,sa)*smoothstep(-.012,.012,y);
 col=mix(col,mix(uSc,vec3(1.),.68)*1.4,disk*(1.-ovs*1.35)*sunMask);

 float m=max(dot(d,uMoon),0.),mg=smoothstep(-.045,.025,y)*uMoonK*(1.-ovs*.86);
 col+=vec3(.42,.58,1.)*(pow(m,8.)*.07+pow(m,34.)*.14+pow(m,180.)*.2)*mg;
 vec3 mr=normalize(cross(uMoon,vec3(0.,1.,0.))),mu=cross(mr,uMoon);
 vec2 q=vec2(dot(d,mr),dot(d,mu))/.04;
 if(dot(d,uMoon)>0.&&length(q)<1.){
  vec4 mt=texture2D(uMoonTex,q*.5+.5);
  col=mix(col,mt.rgb*1.08,mt.a*mg);
 }

 // Brillo tenue del horizonte nocturno (las estrellas se dibujan limpias aparte)
 col+=vec3(.025,.055,.09)*uNight*pow(1.-t,2.7)*(1.-ovs);

 // CAPA 1: Cirros altos fibrosos unificados (sin duplicados)
 if(y>-0.01){
  float yy=max(y,0.0);
  vec2 cp=d.xz/(yy+0.14);
  vec2 wv=vec2(uTime*0.009,uTime*0.0035);
  float warp=vn(cp*0.65+3.1)*1.4;
  vec2 q1=vec2(cp.x*0.55+warp*0.35,cp.y*2.5)+wv;
  float f1=fbm(q1);
  float f2=fbm(vec2(q1.x*2.1-warp,q1.y*2.3)+7.3);
  float fib=smoothstep(0.48,0.82,f1*0.68+f2*0.32);
  float msk=smoothstep(0.36,0.72,fbm(cp*0.38+11.0+wv*0.4));
  float cir=fib*msk*smoothstep(0.0,0.18,y);
  float sdd=max(dot(d,uSun),0.0);
  vec3 cirCol=mix(vec3(0.95,0.97,1.0),uSc*1.18,uDusk*0.82)*(0.58+0.85*pow(sdd,4.5))*(1.0-uNight*0.78)+vec3(0.11,0.14,0.25)*uNight;
  cirCol*=0.88+0.24*f2;
  col=mix(col,cirCol,cir*0.58*(1.0-ovs*0.90));
 }

 // CAPA 2: Cúmulos volumétricos con sombreado direccional corregido y fundido suave al horizonte
 if(y>-0.02){
  float yy=max(y,0.0);
  // Proyección esférica suavizada para evitar estiramiento en el horizonte
  float proj=yy+0.18+0.06*(1.0-yy);
  vec2 cp=d.xz/proj;
  vec2 wind=vec2(uTime*0.0042,uTime*0.0016);

  float base=fbm(cp*0.44+wind);
  float puff=billow(cp*1.18+wind*1.5+2.3);
  float detail=fbm(cp*2.9+wind*2.2+5.1);
  float dens=base*0.58+puff*0.30+detail*0.12;

  // Cobertura dinámica según clima (despejado -> nublado)
  float cov=mix(0.50,0.24,ovs);
  float den=smoothstep(cov,cov+0.19,dens);

  // Sombreado direccional corregido: muestrea hacia el sol para calcular auto-sombra real
  vec2 sunStep=normalize(uSun.xz+1e-4)*0.28;
  float densSun=fbm((cp+sunStep)*0.44+wind)*0.65+billow((cp+sunStep)*1.18+wind*1.5+2.3)*0.35;
  float shadow=clamp((dens-densSun)*5.5+0.55,0.0,1.0);
  // Las partes altas de la nube reciben más luz que la base
  float heightLit=smoothstep(cov,cov+0.24,dens);
  float lit=clamp(shadow*0.65+heightLit*0.45,0.0,1.0);

  float sdd=max(dot(d,uSun),0.0);
  vec3 sunCol=mix(vec3(1.0,0.97,0.93),uSc*1.28,uDusk*0.85);
  vec3 ambientCol=mix(vec3(0.42,0.58,0.88),vec3(0.54,0.34,0.62),uDusk);
  vec3 deepShade=mix(vec3(0.26,0.39,0.68),vec3(0.36,0.22,0.46),uDusk);

  vec3 cloudCol=mix(deepShade,ambientCol,heightLit);
  cloudCol=mix(cloudCol,sunCol,lit);
  cloudCol=cloudCol*(1.0-uNight*0.76)+vec3(0.07,0.10,0.20)*uNight;

  // Silver lining (borde brillante cuando el sol está detrás de la nube)
  float rim=smoothstep(cov,cov+0.07,dens)*(1.0-smoothstep(cov+0.07,cov+0.20,dens));
  cloudCol+=sunCol*rim*(0.35+1.45*pow(sdd,2.6))*(1.0-uNight*0.85);
  // Dispersión frontal cálida
  cloudCol+=sunCol*pow(sdd,7.0)*den*0.30*(1.0-uNight);

  // Fundido suave hacia el horizonte para que las nubes se integren con la bruma
  float horizonFade=smoothstep(-0.01,0.14,y);
  float alpha=den*horizonFade*mix(0.94,0.75,ovs);
  vec3 horizonFog=mix(uHor,vec3(0.72,0.76,0.82),ovs*0.6);
  cloudCol=mix(horizonFog,cloudCol,smoothstep(0.0,0.22,y));

  col=mix(col,cloudCol*(1.0-ovs*0.28),alpha);
 }

 // Supercélula de tormenta
 if(uCs>.002){
  vec2 q0=d.xz/(max(y,0.)+.30);float rr=length(q0),a0=uTime*.010+rr*.50;
  mat2 rot=mat2(cos(a0),-sin(a0),sin(a0),cos(a0));vec2 pp=rot*q0;
  float n1=fbm(pp*.85+vec2(uTime*.006,0.)),n2=fbm(pp*2.4-vec2(0.,uTime*.013)+4.7),n3=vn(pp*6.+uTime*.02);
  float cov=smoothstep(.28,.62,n1*.78+n2*.30+.10);
  vec3 dk=mix(vec3(.060,.045,.115),vec3(.175,.205,.150),smoothstep(.2,.8,n2));
  float under=pow(clamp(1.-t,0.,1.),1.9);
  vec3 lt=vec3(.56,.64,.34)*under*(.35+.65*(1.-n1));
  vec3 cl=dk+lt*(.55+.45*n2)+vec3(.05,.03,.09)*n3*(1.-under)*.6;
  cl*=.82+.36*n3*n2;
  float vis=smoothstep(-.03,.10,y);
  col=mix(col,cl,clamp(cov*1.15,0.,1.)*uCs*vis);
 }

 // Profundidad azul del cenit y gradación de color
 float zen=smoothstep(.25,1.,t);
 col+=vec3(.02,.035,.075)*zen*(1.-uNight)*.7;

 col=clamp(col,0.,1.);
 col=pow(col,vec3(.92,.95,1.04));
 col=mix(vec3(dot(col,vec3(.2126,.7152,.0722))),col,1.25);
 col=mix(col,col*col*(3.-2.*col),.16);
 float zenK=smoothstep(.3,1.,t)*(1.-uNight);
 col=mix(col,col*vec3(0.86,1.04,1.32),zenK*0.20);

 // Lavado por lluvia/niebla + dithering triangular para cero banding
 col=mix(col,vec3(dot(col,vec3(.28,.52,.20)))*.9,uOv*.72);
 float dither=(h21(gl_FragCoord.xy)+h21(gl_FragCoord.xy+vec2(17.0,31.0))-1.0)*(2.2/255.0);
 col+=dither;
 gl_FragColor=vec4(clamp(col*uTint,0.,1.),1.);
}`,side:THREE.BackSide,depthWrite:false,fog:false}));
sky.material.color=skyTint;sky.renderOrder=1000;sky.frustumCulled=false;scene.add(sky);

const sunTex=canvasTex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.9)');g.addColorStop(.4,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h)});
const sunSpr=new THREE.Sprite(new THREE.SpriteMaterial({visible:false,transparent:true}));
const cloudTex=canvasTex(64,64,(x,w,h)=>{x.clearRect(0,0,w,h)});
const cloudMat=new THREE.SpriteMaterial({map:cloudTex,transparent:true,depthWrite:false,fog:false,toneMapped:false,opacity:0,visible:false});

// Sprites heredados ocultos para mantener compatibilidad con otros scripts sin duplicar nubes
const clouds=[];

// v16: estrellas de distinto brillo y color, con titileo
const NST=touch?1800:3200,stP=new Float32Array(NST*3),stS=new Float32Array(NST),stC=new Float32Array(NST*3),stH=new Float32Array(NST);
for(let i=0;i<NST;i++){
 const u=hash(i,1.3)*6.283,y=.03+hash(i,2.9)*.97,r=Math.sqrt(1-y*y),s=Math.pow(hash(i,5.1),5),k=hash(i,7.7);
 stP[i*3]=Math.cos(u)*r*2200;stP[i*3+1]=y*2200;stP[i*3+2]=Math.sin(u)*r*2200;
 stS[i]=s;stC[i*3]=.75+.25*k;stC[i*3+1]=.85-.05*k;stC[i*3+2]=1-.35*k;stH[i]=hash(i,3.3)*6.283;
}
const starG=new THREE.BufferGeometry();
starG.setAttribute('position',new THREE.BufferAttribute(stP,3));
starG.setAttribute('aS',new THREE.BufferAttribute(stS,1));
starG.setAttribute('aC',new THREE.BufferAttribute(stC,3));
starG.setAttribute('aH',new THREE.BufferAttribute(stH,1));
const stars=new THREE.Points(starG,new THREE.ShaderMaterial({
 uniforms:{uA:{value:1},uT:{value:0},uD:{value:1}},
 vertexShader:'attribute float aS,aH;attribute vec3 aC;varying vec3 vC;varying float vA;uniform float uT,uD;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);float tw=.82+.18*sin(uT*(1.4+aH*.5)+aH*37.);gl_PointSize=(1.3+aS*3.2)*uD*tw;vC=aC*(.55+.65*aS);vA=tw*(.55+.45*aS)*smoothstep(.03,.2,normalize(position).y);}',
 fragmentShader:'varying vec3 vC;varying float vA;uniform float uA;void main(){float r=length(gl_PointCoord-.5)*2.;float a=pow(max(1.-r,0.),2.)*vA*uA;gl_FragColor=vec4(vC*a,1.);}',
 transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false
}));
stars.visible=false;stars.frustumCulled=false;stars.renderOrder=-3;scene.add(stars);

const wtex={offset:new THREE.Vector2(),repeat:new THREE.Vector2(),wrapS:0,wrapT:0,minFilter:0};
const waterN=canvasTex(256,256,(x,w,h)=>{
 let sd=20260;const rnd=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
 const WV=[];for(let n=0;n<34;n++){const m=2*Math.pow(7,rnd()),t=rnd()*6.2832,kx=Math.round(Math.cos(t)*m),ky=Math.round(Math.sin(t)*m);if(!kx&&!ky)continue;
  const k=Math.hypot(kx,ky);WV.push([kx,ky,Math.pow(k,-1.45)*(.7+.6*rnd()),rnd()*6.2832])}
 let s2=0;for(const q of WV){const g=q[2]*6.2832*Math.hypot(q[0],q[1]);s2+=g*g*.5}
 const SC=.5/Math.sqrt(s2);
 const W=w,H=h,img=x.createImageData(W,H),d=img.data;
 for(let py=0;py<H;py++)for(let px=0;px<W;px++){
   const u=px/W,v=py/H;let gx=0,gz=0;
   for(const q of WV){const c=Math.cos(6.2832*(q[0]*u+q[1]*v)+q[3])*q[2]*6.2832*SC;gx+=c*q[0];gz+=c*q[1]}
   const inv=1/Math.hypot(gx,1,gz),i=(py*W+px)*4;
   d[i]=Math.round((-gx*inv*.5+.5)*255);d[i+1]=Math.round((inv*.5+.5)*255);d[i+2]=Math.round((-gz*inv*.5+.5)*255);d[i+3]=255;
 }
 x.putImageData(img,0,0);
});
wtex.wrapS=wtex.wrapT=THREE.RepeatWrapping;wtex.repeat.set(420,420);
wtex.minFilter=THREE.LinearMipmapLinearFilter;
waterN.wrapS=waterN.wrapT=THREE.RepeatWrapping;waterN.repeat.set(900,900);waterN.minFilter=THREE.LinearMipmapLinearFilter;

const wdTex=(()=>{const d=new Uint8Array(HR*HR*4);
 for(let j=0;j<HR;j++)for(let i=0;i<HR;i++){const v=Math.max(0,Math.min(1,(WL-hRaw(i,j)+1.5)/9.5)),k=(j*HR+i)*4;d[k]=d[k+1]=d[k+2]=Math.round(v*255);d[k+3]=255}
 const t=new THREE.DataTexture(d,HR,HR,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.LinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.generateMipmaps=false;t.needsUpdate=true;return t})();

const waterGeo=(()=>{const N=200,A=192,pos=new Float32Array((N+1)*(A+1)*3),nor=new Float32Array((N+1)*(A+1)*3),idx=new Uint16Array(N*A*6);let p=0;
 for(let i=0;i<=N;i++){const r=i===0?0:19.23*(Math.exp(.026*i)-1);for(let a=0;a<=A;a++){const t=a/A*Math.PI*2,k=(i*(A+1)+a)*3;pos[k]=Math.cos(t)*r;pos[k+2]=Math.sin(t)*r;nor[k+1]=1}}
 for(let i=0;i<N;i++)for(let a=0;a<A;a++){const q=i*(A+1)+a,w=q+A+1;idx[p++]=q;idx[p++]=q+1;idx[p++]=w;idx[p++]=q+1;idx[p++]=w+1;idx[p++]=w}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setIndex(new THREE.BufferAttribute(idx,1));return g})();

const waterMat=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.06,metalness:0,transparent:true,opacity:1,side:THREE.DoubleSide,depthWrite:false,emissive:lin(.012,.055,.075),emissiveIntensity:.1});
waterMat.userData.waterShader=null;
waterMat.onBeforeCompile=(shader)=>{
 const su=sky.material.uniforms;
 Object.assign(shader.uniforms,{uWaterTime:{value:0},uWaterOff:{value:new THREE.Vector2(0,0)},uWaterNight:{value:0},uWaterStorm:{value:0},uWaterRain:{value:0},
  uWDepth:{value:wdTex},uWDepthV:{value:wdTex},uWN:{value:waterN},uWTS:{value:new THREE.Vector2(TS,HR)},uWTSV:{value:new THREE.Vector2(TS,HR)},
  uSkyTop:su.uTop,uSkyMid:su.uMid,uSkyHor:su.uHor,uSunD:su.uSun,uMoonD:su.uMoon,uSkyNight:su.uNight,uSkyOv:su.uOv,uSkyDusk:su.uDusk,uSkySc:su.uSc,uSkyCs:su.uCs});
 shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
uniform float uWaterTime;uniform float uWaterStorm;uniform float uWaterRain;uniform highp sampler2D uWDepthV;uniform vec2 uWTSV;
varying vec3 vWP;varying vec2 vWG;varying float vWH;
void wvA(vec2 p,float ang,float L,float A,float sp,float amp,inout float h,inout vec2 g,inout vec2 ds){
 float fd=smoothstep(sp*2.2,sp*5.5,L);
 if(fd<.002)return;
 float k=6.2831853/L;vec2 d=vec2(cos(ang),sin(ang));
 float ph=dot(d,p)*k-sqrt(9.81*k)*.7*uWaterTime;
 float s=sin(ph),c=cos(ph),a=A*amp*fd;
 h+=a*s;g+=d*(a*k*c);ds+=d*(a*4.*c);
}`).replace('#include <begin_vertex>',`#include <begin_vertex>
vec3 wpW=(modelMatrix*vec4(position,1.)).xyz;
float wsp=.5+.026*length(position.xz);
float wam=.58+uWaterStorm*1.35+uWaterRain*.60;
vec2 wuvV=vec2(((500.-wpW.x)/uWTSV.x+.5)/uWTSV.y,((wpW.z+500.)/uWTSV.x+.5)/uWTSV.y);
float wdV=texture2D(uWDepthV,wuvV).r*9.5-1.5;
wam*=mix(.1,1.,smoothstep(0.,2.6,wdV));
float wh=0.;vec2 wg=vec2(0.);vec2 wds=vec2(0.);
wvA(wpW.xz,.35,40.,.28,wsp,wam,wh,wg,wds);
wvA(wpW.xz,1.25,22.,.15,wsp,wam,wh,wg,wds);
wvA(wpW.xz,-.55,12.5,.085,wsp,wam,wh,wg,wds);
wvA(wpW.xz,2.3,7.,.045,wsp,wam,wh,wg,wds);
wvA(wpW.xz,-1.5,3.8,.024,wsp,wam,wh,wg,wds);
wvA(wpW.xz,.9,2.2,.012,wsp,wam,wh,wg,wds);
transformed.y+=wh;transformed.xz+=wds;
vWP=wpW+vec3(wds.x,wh,wds.y);vWG=wg;vWH=wh;`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
uniform float uWaterTime;uniform float uWaterNight;uniform float uWaterStorm;uniform float uWaterRain;
uniform sampler2D uWDepth;uniform sampler2D uWN;uniform vec2 uWTS;
uniform vec3 uSkyTop;uniform vec3 uSkyMid;uniform vec3 uSkyHor;uniform vec3 uSunD;uniform vec3 uMoonD;uniform float uSkyNight;uniform float uSkyOv;uniform float uSkyDusk;uniform vec3 uSkySc;uniform float uSkyCs;
varying vec3 vWP;varying vec2 vWG;varying float vWH;
float wHs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wNs(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wHs(i),wHs(i+vec2(1.,0.)),f.x),mix(wHs(i+vec2(0.,1.)),wHs(i+vec2(1.,1.)),f.x),f.y);}
vec2 wDet(vec2 p,float t,float sc,vec2 vel,float rot){
 float c=cos(rot);float s=sin(rot);
 vec2 q=vec2(c*p.x-s*p.y,s*p.x+c*p.y)*sc+vel*t;
 vec3 n=texture2D(uWN,q).rgb*2.-1.;
 return n.xz/max(n.y,.25);
}
vec3 wSky(vec3 r){
 float y=max(r.y,0.);
 vec3 c=mix(uSkyHor,uSkyMid,smoothstep(0.,.38,y));
 c=mix(c,uSkyTop,smoothstep(.26,.95,y));
 float sunAz=max(dot(normalize(vec3(r.x,0.,r.z)+1e-4),normalize(vec3(uSunD.x,0.,uSunD.z)+1e-4)),0.);
 float duskGlow=uSkyDusk*(1.-uSkyNight)*(1.-uSkyOv*.75);
 c=mix(c,mix(uSkySc,vec3(1.,.55,.45),.35),duskGlow*pow(sunAz,2.2)*exp(-y*5.5)*.48);
 float mistK=clamp(uSkyOv*.75+uSkyCs*.45,0.,1.);
 vec3 mistC=vec3(dot(c,vec3(.28,.52,.20)))*mix(.95,.65,uSkyCs);
 c=mix(c,mistC,mistK*.62);
 return pow(max(c,vec3(0.)),vec3(1.55));
}
vec2 wRip(vec2 p,float t){
 vec2 q=p/2.2;vec2 id=floor(q);vec2 f=fract(q)-.5;
 float h1=wHs(id);float h2=wHs(id+7.3);
 vec2 c=(vec2(h1,h2)-.5)*.3;
 vec2 dv=(f-c)*2.2;float d=length(dv);
 float cyc=t*.55*(.7+h1*.6)+h2;
 float ph=fract(cyc);float r=ph*.7;
 float e=(d-r)*14.;float w=exp(-e*e);
 float on=step(.35,wHs(id+3.1+floor(cyc)));
 return normalize(dv+vec2(1e-4))*w*(1.-ph)*(1.-ph)*on*sin((d-r)*45.);
}`).replace('#include <map_fragment>',`#include <map_fragment>
vec3 wV=normalize(cameraPosition-vWP);
float wdist=length(cameraPosition-vWP);
float wFront=gl_FrontFacing?1.:0.;
vec2 wuv=vec2(((500.-vWP.x)/uWTS.x+.5)/uWTS.y,((vWP.z+500.)/uWTS.x+.5)/uWTS.y);
float wDep=texture2D(uWDepth,wuv).r*9.5-1.5;
float wDe=max(wDep,0.);
float wpw=wdist*.0011/max(wV.y,.08);
float wA1=1.-smoothstep(.15,.5,wpw*.16),wA2=1.-smoothstep(.15,.5,wpw*.42),wA3=1.-smoothstep(.15,.5,wpw*1.05);
float wfar=1.-smoothstep(45.,400.,wdist);
float wfar2=1.-smoothstep(25.,150.,wdist);
float wRough=.78+uWaterStorm*1.45+uWaterRain*.65;
vec2 wg=vWG*(1.-.55*smoothstep(60.,320.,wdist));
wg+=wDet(vWP.xz,uWaterTime,.031,vec2(.012,.007),.3)*.22*wRough*(.35+.65*wfar)*wA1;
wg+=wDet(vWP.xz,uWaterTime,.083,vec2(-.021,.015),1.1)*.14*wRough*wfar*wA2;
wg+=wDet(vWP.xz,uWaterTime,.21,vec2(.03,-.026),-.8)*.08*wRough*wfar2*wA3;
if(uWaterRain>.02){wg+=wRip(vWP.xz,uWaterTime)*.36*uWaterRain*(1.-smoothstep(10.,45.,wdist));}
wg*=mix(.45,1.,smoothstep(.05,.5,wV.y));
vec3 wN=normalize(vec3(-wg.x,1.,-wg.y));
if(!gl_FrontFacing)wN=-wN;
float wNV=clamp(dot(wN,wV),0.,1.);
wNV=mix(wNV,abs(wV.y),.42);
float wFr=(.02+.98*pow(1.-wNV,5.))*wFront*mix(.38,1.,smoothstep(0.,.45,wDe));
vec3 wSh=vec3(.14,.42,.36);vec3 wMi=vec3(.035,.19,.23);vec3 wDp=vec3(.012,.065,.11);
vec3 wc=mix(wSh,wMi,smoothstep(0.,2.1,wDe));
wc=mix(wc,wDp,smoothstep(1.4,6.4,wDe));
vec3 wSA=wSky(vec3(0.,.55,.83));float wSL=dot(wSA,vec3(.299,.587,.114));
wc*=mix(vec3(1.),clamp(wSA/max(wSL,.01),.5,1.4),.72);
wc=mix(wc,wc*.55+vec3(.04,.065,.075),clamp(uWaterStorm*.7+uWaterRain*.3,0.,1.));
float wt=uWaterTime;
float wn1=wNs(vWP.xz*1.7+vec2(wt*.12,-wt*.09));
float wn2=wNs(vWP.xz*4.3-vec2(wt*.07,wt*.1));
float wnz=wn1*.6+wn2*.4;
float wc1=wNs(vWP.xz*2.1+vec2(wt*.22,-wt*.18));
float wc2=wNs(vWP.xz*2.7-vec2(wt*.17,wt*.21));
float wCaust=pow(clamp(wc1*wc2*2.25,0.,1.),2.4)*(1.-smoothstep(.12,2.2,wDe))*(1.-uSkyNight)*(1.-uSkyOv*.75)*wFront;
wc+=vec3(.12,.22,.20)*wCaust*.65;
wc+=vec3(.03,.16,.13)*smoothstep(.08,.36,vWH)*(1.-uSkyNight)*clamp(wc*3.2,vec3(.35),vec3(1.));
float wsw=.5+.5*sin(wt*1.05+vWP.x*.31+vWP.z*.23);
float wFoamS=1.-smoothstep(0.,.30+.14*wsw,wDe+(wnz-.5)*.32);
float wFoamC=smoothstep(.30-.12*uWaterStorm,.58,vWH)*smoothstep(.48,.74,wnz)*(.22+uWaterStorm);
float wFoam=clamp(max(wFoamS*(.45+.55*wnz),wFoamC),0.,1.)*wFront;
diffuseColor.rgb=mix(wc,vec3(.92,.96,.97),wFoam);
float wAl=mix(.22,.94,smoothstep(0.,1.45,wDe));
diffuseColor.a=max(wAl,wFoam);`).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
roughnessFactor=clamp(.045+wFoam*.55+uWaterStorm*.06,.035,.7);`).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
normal=normalize((viewMatrix*vec4(wN,0.)).xyz);`).replace('#include <tonemapping_fragment>',`{
 vec3 wR=reflect(-wV,wN);
 if(wR.y<0.)wR.y=-wR.y*.5;
 vec3 wS=wSky(wR);
 float wSunUp=smoothstep(-.05,.12,uSunD.y);
 float wOvC=1.-uSkyOv*.72-uSkyCs*.45;wOvC=max(wOvC,0.);
 vec3 wSunC=mix(uSkySc,vec3(1.,.96,.86),.35);
 float wsd=max(dot(wR,uSunD),0.);
 vec3 wGl=wSunC*(pow(wsd,820.)*9.5+pow(wsd,85.)*.75+pow(wsd,12.)*.13+pow(wsd,28.)*.18*(1.-wA2))*wSunUp*wOvC*(1.-uSkyNight);
 float wmd=max(dot(wR,uMoonD),0.);
 wGl+=vec3(.74,.84,1.)*(pow(wmd,620.)*4.2+pow(wmd,52.)*.28)*uSkyNight*step(0.,uMoonD.y)*wOvC;
 float wRF=wFr*(1.-wFoam);
 gl_FragColor.rgb=gl_FragColor.rgb*(1.-wRF)+wS*wRF+wGl*(wFr*1.45+.03)*(1.-wFoam);
 gl_FragColor.a=clamp(gl_FragColor.a+wRF*.72+dot(wGl,vec3(.33))*wFr*.5,0.,1.);
}
#include <tonemapping_fragment>`);
 waterMat.userData.waterShader=shader;
};
const water=new THREE.Mesh(waterGeo,waterMat);
water.frustumCulled=false;water.position.y=1.4;scene.add(water);

const WVJ=[[.35,40,.28],[1.25,22,.15],[-.55,12.5,.085]];
function waterH(x,z){
 const tt=performance.now()*.001,dp=WL-hAt(x,z),k0=Math.max(0,Math.min(1,dp/2.6)),dm=.1+.9*k0*k0*(3-2*k0),st=(typeof WX!=='undefined'&&WX.st)||{},am=(.58+(st.sc||0)*1.35+(st.rain||0)*.60)*dm;let h=0;
 for(const w of WVJ){const k=6.2831853/w[1];h+=w[2]*am*Math.sin((Math.cos(w[0])*x+Math.sin(w[0])*z)*k-Math.sqrt(9.81*k)*.7*tt)}
 return h;
}