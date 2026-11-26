/* BOIS.IO · 02-terrain-material.js — Escena, cámara, texturas procedurales y shader del terreno
   (líneas 427–513 de BOIS_IO_v119_Optimizado.html) */
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(72,1,.1,2600);
const lin=(r,g,b)=>new THREE.Color(r,g,b).convertSRGBToLinear();
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=R.capabilities.getMaxAnisotropy();return t}
const detail=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#d9d9d9';x.fillRect(0,0,w,h);for(let i=0;i<6000;i++){const v=140+Math.random()*115|0;x.fillStyle=`rgba(${v},${v},${v},.4)`;const s=1+Math.random()*3;x.fillRect(Math.random()*w,Math.random()*h,s,s)}});
// v11: capas de textura ORIGINALES del terreno (suelo / camino / pasto) y su mapa de mezcla, recuperadas de sharedassets0 del juego
// TEXD → data/terrain-textures.js
const spU={uT0:{value:null},uT1:{value:null},uT2:{value:null},uSp:{value:null},uOn:{value:0},uHQ:{value:1}};
function spLoaded(im){} // movida desde 07-audio-discovery: la usa el onload de las texturas de abajo
{let left=4;const mk=(src,key,rep)=>{const im=new Image(),t=new THREE.Texture(im);t.wrapS=t.wrapT=rep?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;t.anisotropy=R.capabilities.getMaxAnisotropy();t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
  im.onload=()=>{t.needsUpdate=true;if(--left===0)spU.uOn.value=1;if(key==='uSp')spLoaded(im)};im.src=src;spU[key].value=t};
 mk(TEXD.t0,'uT0',1);mk(TEXD.t1,'uT1',1);mk(TEXD.t2,'uT2',1);mk(TEXD.sp,'uSp',0)}
const terrMatOld=()=>{const m=new THREE.MeshStandardMaterial({vertexColors:true,map:detail,roughness:1,metalness:0});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,spU);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vSp;varying vec2 vWp;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSp=vec2((500.-position.x)/1000.,(position.z+500.)/1000.);vWp=position.xz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uT0,uT1,uT2,uSp;uniform float uOn;varying vec2 vSp;varying vec2 vWp;')
   .replace('#include <map_fragment>','#include <map_fragment>\n{vec3 s=texture2D(uSp,vSp).rgb;float rd=smoothstep(.3,.7,s.g);s.g=rd;s.r*=1.-rd;s.b*=1.-rd;s/=max(s.r+s.g+s.b,.001);\n vec3 c0=pow(texture2D(uT0,vWp*.5).rgb,vec3(2.2)),c1=pow(texture2D(uT1,vWp*.5).rgb,vec3(2.2)),c2=pow(texture2D(uT2,vWp*.2).rgb,vec3(2.2));\n diffuseColor.rgb*=mix(vec3(1.),(c0*s.r+c1*s.g+c2*s.b)*1.2,uOn);}')};return m};
// v132 (optimización): cada superficie procedural solo se evalúa donde su peso es > 0,4 % (un prado ya no paga camino+suelo+playa+roca).
// v123: terreno con TEXTURA propia por tipo de superficie (no solo color):
//  · CAMINO  → tierra compactada y grava: guijarros con sombra de contacto, rodadas paralelas al sendero,
//              centro pisado y claro, bordes sueltos y oscuros, hojarasca. (antes: gris casi negro)
//  · PASTO   → (v132) césped continuo y suave: tufos grandes, parches de tono y peinado fino de bajo contraste; sin florecillas.
//  · SUELO   → manto de hojas de colores, agujas de pino y piedrecitas.
//  · PLAYA   → arena con ondulaciones, grano y conchas.
//  · ROCA    → en pendientes: estratos, grietas, musgo.
// El relieve se simula con bump mapping (solo WebGL2) y el detalle fino se desvanece con la distancia.
// Todo es procedural (sin imágenes nuevas) y respeta los niveles de calidad (uHQ: 0 Baja … 3 Ultra).
const TG_HEAD=`uniform sampler2D uT0,uT1,uT2,uSp,uDt;uniform float uOn,uHQ;varying vec2 vSp;varying vec2 vWp;varying float vSl;varying float vHt;
float tgBmp=0.;
/* v163: tgPw = metros de terreno por píxel; tgAA(f) apaga un detalle de f ciclos/m cuando se acerca a la frecuencia de Nyquist (evita el centelleo) */
float tgPw=0.;
float tgAA(float f){return 1.-smoothstep(.08,.38,tgPw*f);}
/* v163: hash estable en float32. El anterior (p*456.21) perdía precisión lejos del origen: a ±400 m y frecuencia alta salían ~15 valores distintos y rayas. */
float tgH(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float tgV(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(tgH(i),tgH(i+vec2(1.,0.)),f.x),mix(tgH(i+vec2(0.,1.)),tgH(i+vec2(1.,1.)),f.x),f.y);}
float tgF(vec2 p){return tgV(p)*.6+tgV(p*2.13+vec2(7.7,3.1))*.4;}
vec2 tgH2(vec2 p){return vec2(tgH(p+vec2(1.7,9.2)),tgH(p+vec2(8.3,2.8)));}
float tgSq(float x){return x*x;}
// celdas de Voronoi: x = distancia al punto más cercano, y = id (0..1) de esa celda
vec2 tgVor(vec2 p){vec2 i=floor(p),f=fract(p);float md=9.,id=0.;
 for(int a=-1;a<=1;a++)for(int b=-1;b<=1;b++){vec2 g=vec2(float(a),float(b));vec2 d=g+tgH2(i+g)*.8+.1-f;float dd=dot(d,d);if(dd<md){md=dd;id=tgH(i+g+vec2(5.1,2.3));}}
 return vec2(sqrt(md),id);}
vec2 tgRot(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
#ifdef TG_W2
#define TGG(v) (uHQ<.5||(v)>.01)
vec2 tgO(vec2 c){return vec2(tgH(c+vec2(3.3,1.7)),tgH(c+vec2(17.1,31.7)));}
vec3 tgS(sampler2D t,vec2 uv,vec2 dx,vec2 dy,vec3 mu){
 vec2 i=floor(uv),f=fract(uv),w=f*f*(3.-2.*f);
 float w00=(1.-w.x)*(1.-w.y),w10=w.x*(1.-w.y),w01=(1.-w.x)*w.y,w11=w.x*w.y;
 vec3 m=w00*textureGrad(t,uv+tgO(i),dx,dy).rgb+w10*textureGrad(t,uv+tgO(i+vec2(1.,0.)),dx,dy).rgb
       +w01*textureGrad(t,uv+tgO(i+vec2(0.,1.)),dx,dy).rgb+w11*textureGrad(t,uv+tgO(i+vec2(1.,1.)),dx,dy).rgb;
 return mu+(m-mu)/max(sqrt(w00*w00+w10*w10+w01*w01+w11*w11),.5);}
vec3 tgN(sampler2D t,vec2 uv,vec2 dx,vec2 dy,float k){
 float q=k*8.,i=floor(q),f=fract(q);
 vec2 oa=sin(vec2(3.,7.)*i),ob=sin(vec2(3.,7.)*(i+1.));
 vec3 a=textureGrad(t,uv+oa,dx,dy).rgb,b=textureGrad(t,uv+ob,dx,dy).rgb;
 return mix(a,b,smoothstep(.2,.8,f-.1*dot(a-b,vec3(1.))));}
#else
#define TGG(v) true
#endif
vec3 tgL(sampler2D t,float sc,vec2 dA,vec2 dB,float k,float dist){
 float wm=1.-smoothstep(10.,58.,dist);
 vec2 u0=vWp*sc;
 vec3 r;
#ifdef TG_W2
 if(uHQ>.5){
  vec3 mu=textureGrad(t,u0,dA*(sc*64.),dB*(sc*64.)).rgb;
  r=(1.-wm)*mu;
  if(wm>.003){
   if(uHQ>1.5)r+=wm*max(tgS(t,u0,dA*sc,dB*sc,mu),vec3(0.));
   else r+=wm*tgN(t,u0,dA*sc,dB*sc,k);
  }
 }else
#endif
 r=wm*texture2D(t,u0).rgb+(1.-wm)*texture2D(t,u0,8.).rgb;
return pow(r,vec3(2.2));}
// v132: pasto base SIN ruido: promedio de dos muestras no correlacionadas (rotadas y a distinta escala) → no se nota la repetición
// y se evita el contraste "granulado" que dejaba la mezcla estocástica (tgS/tgN) en el césped.
vec3 tgG(vec2 dA,vec2 dB){
 vec2 u1=vWp*.2,u2=tgRot(vWp,.9)*.083+vec2(.37,.61);
#ifdef TG_W2
 vec3 a=textureGrad(uT2,u1,dA*.2,dB*.2).rgb,b=textureGrad(uT2,u2,tgRot(dA,.9)*.083,tgRot(dB,.9)*.083).rgb;
#else
 vec3 a=texture2D(uT2,u1).rgb,b=texture2D(uT2,u2).rgb;
#endif
 return pow((a+b)*.5,vec3(2.2));}
vec3 tgMac(float sg){
 float m1=tgF(vWp*.0105+vec2(11.3,4.1)),m2=tgF(vWp*.041+vec2(2.7,9.9)),m3=tgF(vWp*.17+vec2(23.1,6.4));
 float b=mix(.74,1.32,m1)*mix(.88,1.12,m2)*mix(.9,1.1,m3);
 vec3 tn=mix(vec3(1.07,1.02,.88),vec3(.92,1.,1.1),tgV(vWp*.018+vec2(40.,13.)));
 return mix(b*tn,vec3(1.),sg*.75);}
`,TG_BODY=`{
 float dist=length(vViewPosition);
 vec2 P=vWp;
#ifdef TG_W2
 vec2 dA=dFdx(vWp),dB=dFdy(vWp);
 tgPw=max(length(dA),length(dB));
#else
 vec2 dA=vec2(0.),dB=vec2(0.);
 tgPw=dist*.0016;
#endif
 vec3 sp=texture2D(uSp,vSp).rgb;
 float sg=sp.g;
 float nz=tgF(P*.05+vec2(5.5,1.3));
 // bordes del camino irregulares y orgánicos (el mapa de mezcla es de baja resolución)
 float rd=smoothstep(.3,.62,sg+(nz-.5)*.3+(tgF(P*1.7+vec2(2.2,8.8))-.5)*.3*tgAA(3.6));
 sp.g=rd;sp.r*=1.-rd;sp.b*=1.-rd;
 float jb=(nz-.5)*.4*(1.-rd);
 sp.r=max(sp.r-jb,0.);sp.b=max(sp.b+jb,0.);
 sp/=max(sp.r+sp.g+sp.b,.001);

 float kk=tgV(vWp*.011+vec2(3.7,8.1));
 vec3 cS=vec3(0.),cR=vec3(0.),cG=vec3(0.);
 if(TGG(sp.r))cS=tgL(uT0,.5,dA,dB,kk,dist);
 if(TGG(sp.g))cR=tgL(uT1,.5,dA,dB,kk,dist);
 if(TGG(sp.b))cG=tgG(dA,dB);
 float nD=(1.-smoothstep(9.,44.,dist))*smoothstep(.8,1.5,vHt);
 float nF=nD*tgAA(8.),nH=nD*tgAA(30.);
 float mF=1.-smoothstep(28.,130.,dist);
 float sw=1.-smoothstep(2.35,3.15,vHt+(nz-.5)*.6);/* v132: antes de V (lo usa su condición) */
 vec2 V=vec2(1.,0.);
 if(uHQ>.5&&nF>0.&&(sp.b<.99||sw>.004))V=tgVor((P+(vec2(tgV(P*5.+vec2(1.3,2.1)),tgV(P*5.+vec2(7.7,3.3)))-.5)*.09)*6.);
 float vz=V.y;
 // lo que cambia por tipo de terreno: playa y roca
 float rkw=smoothstep(.5,.85,vSl+(tgF(P*.3+vec2(4.,2.))-.5)*.25)*(1.-sw);

 vec3 A=vec3(0.);float bm=0.;
 float fz=smoothstep(100.,150.,dist);
 if(fz<1.){
 // ───── CAMINO: tierra compactada con grava ─────
 float ctr=smoothstep(.55,1.,sg);
 float rr=.23+.2*fract(vz*7.13);
 float pbm=(1.-smoothstep(rr*.7,rr,V.x))*step(.38,fract(vz*5.3));
 vec3 aR=vec3(0.);float bR=0.;
 if(sp.g>.004){
  float m=tgF(P*1.9+vec2(3.1,7.7)),med=tgV(P*8.+vec2(11.,4.)),fn=tgV(P*34.);
  vec3 e=mix(vec3(.105,.07,.04),vec3(.17,.12,.07),m);
  e*=(.8+.4*mix(.5,med,tgAA(8.)))*(.92+.16*fn*nH);
  e*=mix(.62,1.15,ctr);
  float pb=pbm*nF*mix(1.,.3,ctr*.85);
  vec3 pc=mix(vec3(.11,.1,.09),vec3(.24,.17,.1),fract(vz*3.7))*(.7+.6*fract(vz*11.3));
  e*=1.-.35*smoothstep(rr*1.5,rr*.95,V.x)*(1.-pb)*nF*step(.38,fract(vz*5.3));
  aR=mix(e,pc,pb);
  float rut=exp(-tgSq((sg-.7)/.1))*mF;
  aR*=1.-.3*rut;
  float lf=smoothstep(.74,.82,tgV(P*13.+vec2(2.,9.)))*mF*tgAA(13.);
  aR=mix(aR,vec3(.07,.04,.02),lf*.5*(1.-ctr*.5));
  bR=pb*.045*sqrt(max(1.-tgSq(V.x/rr),0.))-rut*.035+(med-.5)*.01*nF;
 }

 // ───── PASTO ───── (v132: césped continuo y suave. Tufos de ~1 m, parches de tono y un peinado fino de bajo contraste
 // que solo se ve cerca. Sin florecillas ni remolinos: rotar por un ángulo variable multiplicaba la frecuencia por la distancia al origen → ruido)
 vec3 aG=vec3(0.);float bG=0.;
 if(sp.b>.004){
  float gF=1.-smoothstep(3.,18.,dist);
  float gM=1.-smoothstep(30.,110.,dist);
  float wv=smoothstep(.35,.65,tgF(P*.07+vec2(9.1,2.7)));
  vec2 q0=tgRot(P,.35),q1=tgRot(P,1.9);
  float b0=tgV(vec2(q0.x*4.,q0.y*.7))*.6+tgV(vec2(q0.x*9.,q0.y*1.4)+vec2(4.,1.))*.4;
  float b1=tgV(vec2(q1.x*4.,q1.y*.7)+vec2(2.,7.))*.6+tgV(vec2(q1.x*9.,q1.y*1.4)+vec2(6.,3.))*.4;
  float bl=mix(b0,b1,wv);
  float tuft=tgF(P*.9+vec2(7.,2.));
  float cl=tgF(P*.3+vec2(1.,5.));
  vec3 tint=mix(vec3(.9,.97,.88),vec3(1.09,1.05,.9),tgF(P*.12+vec2(3.,8.)));
  vec3 g=cG*1.55*tint*vec3(.96,1.04,.94);/* v133: pasto del suelo más claro y verde */
  g*=.84+.32*mix(cl,tuft,.35+.25*gF);
  g*=1.+(bl-.5)*.22*gF;
  g=mix(g,g*vec3(.82,.92,.8),smoothstep(.5,.2,tuft)*gM*.45);
  g=mix(g,g*vec3(1.08,1.07,.93),smoothstep(.55,.85,tuft)*gM*.35);
  aG=g;
  bG=(tuft-.5)*.03*gF;
 }

 // ───── SUELO DE BOSQUE: hojarasca y agujas ─────
 vec3 aS=vec3(0.);float bS=0.;
 if(sp.r>.004){
  vec2 qa=tgRot(P,.35),qb=tgRot(P,1.9);/* v163: dos ángulos fijos y mezcla suave (antes un ángulo variable → ruido blanco lejos del origen) */
  float wq=smoothstep(.35,.65,tgF(P*.22+vec2(1.,6.)));
  float nd=mix(tgV(vec2(qa.x*30.,qa.y*2.4)),tgV(vec2(qb.x*30.,qb.y*2.4)),wq);
  float leaf=mix(smoothstep(.5,.64,tgV(vec2(qa.x*11.,qa.y*6.)+vec2(vz*9.,vz*5.))),smoothstep(.5,.64,tgV(vec2(qb.x*11.,qb.y*6.)+vec2(vz*9.,vz*5.))),wq);
  float ph=fract(vz*5.7);
  vec3 lc=ph<.25?vec3(.05,.03,.015):ph<.5?vec3(.2,.105,.035):ph<.75?vec3(.26,.075,.028):vec3(.13,.1,.03);
  vec3 s=cS*1.3*(.78+.44*tgF(P*2.6+vec2(5.,1.)));
  s=mix(s,lc*(.8+.4*fract(vz*9.1)),leaf*.75*nF);
  s=mix(s,s*vec3(1.35,1.2,.9),smoothstep(.62,.9,nd)*nH*.5);
  float st=step(.9,fract(vz*17.3))*(1.-smoothstep(.1,.17,V.x))*nF;
  aS=mix(s,vec3(.15,.14,.125)*(.7+.6*fract(vz*3.1)),st);
  bS=leaf*.012*(fract(vz*9.1)+.2)*nF+st*.035+(nd-.5)*.008*nH;
 }

 // ───── PLAYA ─────
 vec3 aD=vec3(0.);float bD=0.;
 if(sw>.004){
  float w=tgF(P*.25)*9.;
  float rp=sin(dot(P,vec2(.8,.6))*7.5+w*2.)*.5+.5;
  vec3 d=mix(vec3(.27,.205,.12),vec3(.36,.285,.175),tgF(P*.7+vec2(2.,2.)));
  d*=(.9+.2*rp*mF*tgAA(2.5))*(.95+.10*tgV(P*22.)*nH);
  float sh=step(.9,fract(vz*7.7))*(1.-smoothstep(.07,.12,V.x))*nF;
  aD=mix(d,vec3(.34,.31,.27)*(.7+.5*fract(vz*3.3)),sh);
  bD=rp*.022*mF*tgAA(2.5)+sh*.03;
 }

 // ───── ROCA (pendientes) ─────
 vec3 aK=vec3(0.);float bK=0.;
 if(rkw>.004){
  vec2 rp=vec2(P.x*.8+P.y*.6,vHt*1.7);
  float stt=mix(.5,sin((vHt*3.3+tgF(P*.5)*3.)*2.)*.5+.5,tgAA(1.1+1.6*vSl));
  vec3 k=mix(vec3(.085,.078,.07),vec3(.17,.155,.135),tgF(rp*1.3+vec2(1.,3.)));
  k*=.8+.4*stt;
  float cr=(1.-smoothstep(0.,.045,abs(tgF(rp*2.1+vec2(1.,5.))-.5)))*tgAA(6.);
  k*=1.-.55*cr*mF;
  k*=.88+.24*tgV(P*28.)*nH;
  float ms=smoothstep(.6,.8,tgF(P*.55+vec2(4.,9.)))*(1.-smoothstep(.65,.95,vSl));
  aK=mix(k,vec3(.04,.075,.022),ms*.7);
  bK=-cr*.05+stt*.03+(tgV(P*9.)-.5)*.03*nF;
 }

 A=aS*sp.r+aG*sp.b+aR*sp.g;
 bm=bS*sp.r+bG*sp.b+bR*sp.g;
 A=mix(A,aD,sw);bm=mix(bm,bD,sw);
 A=mix(A,aK,rkw);bm=mix(bm,bK,rkw);
 }
 // a más de ~100 m basta el color medio de cada superficie (mucho menos ruido y GPU)
 if(fz>0.){vec3 Af=cS*1.3*sp.r+cG*1.3*sp.b+vec3(.14,.1,.06)*sp.g;Af=mix(Af,vec3(.3,.23,.14),sw);Af=mix(Af,vec3(.12,.11,.1),rkw);A=mix(A,Af,fz);bm*=1.-fz;}
 A*=tgMac(max(rd,rkw));
 tgBmp=bm*mix(.25,1.,nF)*(1.-smoothstep(.012,.05,tgPw))*step(.5,uHQ);
 float dt2=pow((texture2D(uDt,vWp/5.3).r+texture2D(uDt,vWp/13.7+vec2(.37,.11)).r)*.5,2.2)*1.2;
 dt2=mix(dt2,.84,sp.b);
 diffuseColor.rgb*=dt2*mix(vec3(1.),A*1.2,uOn);
}
`,TG_BUMP=`
#ifdef TG_W2
{vec2 dH=vec2(dFdx(tgBmp),dFdy(tgBmp));vec3 q0=dFdx(-vViewPosition),q1=dFdy(-vViewPosition);
 vec3 R1=cross(q1,normal),R2=cross(normal,q0);float fDet=dot(q0,R1);
 if(abs(fDet)>1e-12)normal=normalize(abs(fDet)*normal-sign(fDet)*(dH.x*R1+dH.y*R2));}
#endif
`;
const terrMat=()=>{const w2=!!R.capabilities.isWebGL2,m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,spU);sh.uniforms.uDt={value:detail};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vSp;varying vec2 vWp;varying float vSl;varying float vHt;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSp=vec2((500.-position.x)/1000.,(position.z+500.)/1000.);vWp=position.xz;vHt=position.y;vSl=sqrt(max(1.-normal.y*normal.y,0.))/max(normal.y,.2);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+(w2?'#define TG_W2\n':'')+TG_HEAD).replace('#include <map_fragment>','#include <map_fragment>\n'+TG_BODY).replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+TG_BUMP)};return m};
