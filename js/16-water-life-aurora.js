/* BOIS.IO · 16-water-life-aurora.js — Ondas, bruma sobre el lago y auroras boreales
   (líneas 1709–1758 de BOIS_IO_v119_Optimizado.html) */
// ---------- v55: agua viva (ondas de cisnes, nado y lluvia) y bruma sobre el lago
const RPN=28,rpM=new THREE.InstancedMesh(new THREE.RingGeometry(.86,1,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}),RPN),rpA=[],rpX=new THREE.Matrix4(),rpQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0)),rpP=new THREE.Vector3(),rpS=new THREE.Vector3(),rpC=new THREE.Color();
for(let i=0;i<RPN;i++){rpA.push({t:9,x:0,z:0,l:3});rpM.setMatrixAt(i,rpX.makeScale(0,0,0));rpM.setColorAt(i,rpC.setRGB(0,0,0))}
rpM.frustumCulled=false;rpM.renderOrder=1;scene.add(rpM);let rpI=0,rpT=0;
const rpAdd=(x,z,l)=>{const r=rpA[rpI++%RPN];r.t=0;r.x=x;r.z=z;r.l=l||3};
function rpFrame(dt,tt){rpT-=dt;
 if(rpT<=0){rpT=.5;
  if(window.__sw)for(const a of window.__sw)if(a.mv&&!a.far&&(a.x-S.x)**2+(a.z-S.z)**2<14400)rpAdd(a.x,a.z,3.2);
  if(S.sw&&(keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||Math.abs(jv.x)+Math.abs(jv.y)>.1))rpAdd(S.x,S.z,2.6);
  const rn=(WX.st&&WX.st.rain)||0;if(rn>.15&&window.__inLake)for(let k=0;k<Math.ceil(rn*5);k++){const x=S.x+(Math.random()-.5)*70,z=S.z+(Math.random()-.5)*70;if(hAt(x,z)<WL-.3&&__inLake(x,z))rpAdd(x,z,1.5)}}
 let any=0;for(let i=0;i<RPN;i++){const r=rpA[i];r.t+=dt;const u=r.t/r.l;
  if(u>=1){if(r.t<r.l+dt*2){rpM.setMatrixAt(i,rpX.makeScale(0,0,0));any=1}continue}
  const s=.5+u*(r.l*2.2);rpX.compose(rpP.set(r.x,WL+.05+waterH(r.x,r.z),r.z),rpQ,rpS.set(s,s,s));rpM.setMatrixAt(i,rpX);const f=Math.pow(1-u,1.6)*.55;rpM.setColorAt(i,rpC.setRGB(.7*f,.92*f,f));any=1}
 if(any){rpM.instanceMatrix.needsUpdate=true;rpM.instanceColor.needsUpdate=true}
 rpM.visible=!uw&&!(typeof PR!=='undefined'&&PR.on)}
const msT=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.5,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t})();
const msA=[];for(let i=0;i<14;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:msT,color:0xcfe3ea,transparent:true,opacity:0,depthWrite:false,fog:false})),a=Math.random()*6.283,r=Math.random()*150,s=70+Math.random()*70;
 sp.userData={x:-15+Math.cos(a)*r,z:-55+Math.sin(a)*r,p:Math.random()*6.28,y:WL+1.2+Math.random()*3};sp.scale.set(s,s*.35,1);sp.renderOrder=1;sp.visible=false;scene.add(sp);msA.push(sp)}
let msV=0;
function msFrame(dt,tt){const st=WX.st||{},rn=st.rain||0,k=Math.max(tod===1?.8:0,tod===3?1:0,(st.aut||0)*.8,st.fog||0)*(1-Math.min(1,rn*1.4)),tg=(uw||(typeof PR!=='undefined'&&PR.on))?0:k;msV+=(tg-msV)*Math.min(1,dt*.3);
 for(const sp of msA){sp.visible=msV>.02;if(!sp.visible)continue;const u=sp.userData;sp.position.set(u.x+Math.sin(tt*.03+u.p)*14,u.y+Math.sin(tt*.2+u.p)*.4,u.z+Math.cos(tt*.025+u.p)*10);sp.material.opacity=msV*.22*(.7+.3*Math.sin(tt*.15+u.p))*(tod===2?.35:1)}}
// ---------- v163: aurora boreal ELIMINADA (volvía el cielo nocturno demasiado brillante y teñía el lago de verde).
// Se retiran la cúpula con su shader y el brillo emisivo que le sumaba al agua. aurFrame se conserva porque art() lo llama
// y porque además avanza las ondas de lluvia (rpFrame) y la bruma del lago (msFrame).
function aurFrame(dt,tt){rpFrame(dt,tt);msFrame(dt,tt);const night=PC?Math.max(0,(PC.night-.12)/.88):0;
 {const wm=water.material;if(wm&&wm.emissive){wm.emissive.setRGB(.03,.16,.2);wm.emissiveIntensity=.1*(1-.65*night)}}}
