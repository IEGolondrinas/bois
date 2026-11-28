/* BOIS.IO · 08-fauna-journal.js — Fauna, criaturas, vida de los Poolrooms, flash de cámara
   (líneas 700–931 de BOIS_IO_v119_Optimizado.html) */
const fauna=(()=>{
const E=new THREE.Euler(0,0,0,'YXZ'),Q=new THREE.Quaternion(),M=new THREE.Matrix4(),V=new THREE.Vector3(),W=new THREE.Vector3(),ZM=new THREE.Matrix4().makeScale(0,0,0),TC=new THREE.Color(),U={value:0};
const nearB=(x,z)=>{const i=Math.floor(x/CS),j=Math.floor(z/CS);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)if(cells.has((i+a)*4096+j+b))return true;return false};
const bx=(w,h,d,x,y,z,c,l)=>({g:new THREE.BoxGeometry(w,h,d).translate(x,y,z),c:lin(...c),l,t:y+h/2});
const lg=(x,z,h,t,c)=>[[-x,z,1],[x,z,-1],[-x,-z,-1],[x,-z,1]].map(a=>bx(t,h,t,a[0],h/2,a[1],c,a[2]));
const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,flatShading:true});
mat.onBeforeCompile=s=>{s.uniforms.uT=U;s.vertexShader='uniform float uT;attribute float aSp;attribute vec2 aLeg;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nif(aLeg.y<-1.5){transformed.x+=sin(uT*13.)*.3*max(0.,-position.z);}else if(aLeg.y<0.){transformed.y+=sin(uT*14.)*abs(position.x)*.8;}else{transformed.z+=aLeg.x*sin(uT*10.)*aSp*.22*max(0.,aLeg.y-position.y);}')};
function build(parts,n,fly){const g=merge(parts),L=new Float32Array(g.attributes.position.count*2);let o=0;
 for(const p of parts){const c=p.g.index?p.g.index.count:p.g.attributes.position.count;if(p.l)for(let i=0;i<c;i++){L[(o+i)*2]=p.l;L[(o+i)*2+1]=fly||p.t}o+=c}
 g.setAttribute('aLeg',new THREE.BufferAttribute(L,2));const as=new THREE.InstancedBufferAttribute(new Float32Array(n),1);g.setAttribute('aSp',as);
 const im=new THREE.InstancedMesh(g,mat,n);im.frustumCulled=false;im.castShadow=!touch;scene.add(im);return{im,as}}
const g1=[.5,.34,.2],lt=[.85,.78,.65],dk=[.12,.09,.07],wh=[.93,.93,.9],og=[.78,.38,.12],rd=[.8,.25,.15],gy=[.6,.5,.4];
const LK=new Uint8Array(HR*HR),lq=[27865];LK[27865]=1;
while(lq.length){const k=lq.pop(),i=(k/HR)|0,j=k-i*HR;for(const n of[k+HR,k-HR,j<HR-1?k+1:-1,j>0?k-1:-1])if(n>=0&&n<HR*HR&&!LK[n]&&hAdj[n]<1.4){LK[n]=1;lq.push(n)}}
const inLake=(x,z)=>{const i=Math.round((500-x)/TS),j=Math.round((z+500)/TS);return i>=0&&j>=0&&i<HR&&j<HR&&LK[i*HR+j]===1};window.__inLake=inLake;
const og2=[.95,.45,.1];
const SP=[
{p:[bx(.5,.55,1.2,0,1.15,0,g1),bx(.2,.65,.22,0,1.65,.55,g1),bx(.24,.26,.42,0,2.05,.75,g1),bx(.05,.5,.05,-.1,2.45,.72,dk),bx(.05,.5,.05,.1,2.45,.72,dk),bx(.12,.15,.1,0,1.25,-.62,lt),...lg(.17,.45,.9,.11,g1)],G:6,M:4,h0:5,h1:60,sl:.5,v:1.6,r:7,fd:22,s:[.9,1.15],yo:0,col:'#d9964f'},
{p:[bx(.75,.65,.95,0,.85,0,wh),bx(.25,.3,.32,0,1.05,.6,[.2,.17,.15]),...lg(.22,.32,.5,.1,[.2,.17,.15])],G:5,M:5,h0:2.8,h1:25,sl:.3,v:.9,r:5,fd:9,s:[.9,1.1],yo:0,col:'#ffffff'},
{p:[bx(.22,.22,.4,0,.25,0,gy),bx(.17,.17,.18,0,.38,.25,gy),bx(.04,.2,.04,-.04,.55,.22,gy),bx(.04,.2,.04,.04,.55,.22,gy),bx(.08,.08,.08,0,.3,-.22,wh),...lg(.08,.12,.15,.06,gy)],G:12,M:2,h0:2.8,h1:35,sl:.5,v:2.2,r:5,fd:12,s:[.9,1.1],yo:0,hop:1,col:'#c9b28a'},
{p:[bx(.3,.3,.8,0,.55,0,og),bx(.22,.2,.28,0,.7,.52,og),bx(.1,.1,.15,0,.65,.72,dk),bx(.14,.14,.5,0,.6,-.62,og),bx(.15,.15,.15,0,.6,-.92,wh),...lg(.1,.28,.4,.08,dk)],G:6,M:1,h0:4,h1:50,sl:.5,v:2,r:7,fd:16,s:[.9,1.1],yo:0,col:'#ff7a1a'},
{p:[bx(.32,.1,.22,0,.1,0,rd),bx(.1,.08,.12,-.2,.14,.14,rd),bx(.1,.08,.12,.2,.14,.14,rd)],G:5,M:4,h0:1.55,h1:2.2,hx:.6,sl:.6,v:.5,r:2,fd:4,s:[.9,1.2],yo:1.5708,col:'#e0452a'},
{p:[bx(.55,.4,.95,0,.35,0,wh),bx(.3,.25,.3,0,.5,-.55,wh),bx(.1,.3,.6,-.3,.5,-.05,wh),bx(.1,.3,.6,.3,.5,-.05,wh),bx(.16,.4,.16,0,.75,.42,wh),bx(.14,.35,.16,0,1.05,.5,wh),bx(.16,.16,.26,0,1.3,.58,wh),bx(.12,.08,.1,0,1.31,.7,dk),bx(.09,.07,.18,0,1.27,.8,og2)],G:3,M:3,h0:-12,h1:.5,hx:.5,sl:.6,v:.8,r:9,fd:10,s:[1.1,1.35],yo:0,lk:1,c:[-15,-55,260],wy:1.4,col:'#ffffff'}];
SP.forEach((s,i)=>s.id=i);const FN=[];
for(const sp of SP){sp.nm=NM[SP.indexOf(sp)];sp.a=[];const G=Math.ceil(sp.G*(touch?.6:1));
 for(let gi=0;gi<G;gi++){let x,z,ok=0;for(let k=0;k<300&&!ok;k++){x=(sp.c?sp.c[0]:0)+(Math.random()*2-1)*(sp.c?sp.c[2]:460);z=(sp.c?sp.c[1]:0)+(Math.random()*2-1)*(sp.c?sp.c[2]:460);const h=hAt(x,z),s=Math.hypot(hAt(x+2,z)-hAt(x-2,z),hAt(x,z+2)-hAt(x,z-2))/4;ok=h>=sp.h0&&h<=sp.h1+(sp.hx||0)&&s<sp.sl&&!nearB(x,z)&&(!sp.lk||inLake(x,z))}
  if(!ok)continue;const g={x,z};
  for(let m=0;m<sp.M;m++){const ax=x+(Math.random()-.5)*6,az=z+(Math.random()-.5)*6;if(hAt(ax,az)<sp.h0||nearB(ax,az)||(sp.lk&&!inLake(ax,az)))continue;sp.a.push({sp,g,x:ax,z:az,hd:Math.random()*6.28,tx:ax,tz:az,tmr:Math.random()*5,mv:0,ph:Math.random()*6.28,sc:sp.s[0]+Math.random()*(sp.s[1]-sp.s[0]),far:0,i:sp.a.length})}}
 const o=build(sp.p,Math.max(1,sp.a.length));sp.im=o.im;sp.as=o.as;sp.im.count=sp.a.length;
 for(const a of sp.a){const v=.85+Math.random()*.3;sp.im.setColorAt(a.i,TC.setRGB(v,v,v));FN.push(a)}}
window.__sw=SP[5]&&SP[5].a;const bp=c=>[bx(.18,.14,.4,0,0,0,c),bx(.1,.1,.1,0,.05,.24,c),bx(.04,.04,.08,0,.04,.32,[.9,.65,.2]),bx(.5,.03,.25,-.38,.03,0,c,1),bx(.5,.03,.25,.38,.03,0,c,1)];
const BD=[],NF=touch?3:5;for(let f=0;f<NF;f++){const cx=(Math.random()*2-1)*350,cz=(Math.random()*2-1)*350,y=45+Math.random()*30;for(let m=0;m<6;m++)BD.push({cx,cz,y,f,r:25+Math.random()*35,a:Math.random()*6.28,w:.15+Math.random()*.08,ph:Math.random()*6.28,i:f*6+m,t:f%2?.3:1})}
const bb=build(bp([1,1,1]),BD.length,-1);for(const b of BD){const v=b.t*(.9+Math.random()*.2);bb.im.setColorAt(b.i,TC.setRGB(v,v,v))}
const fp=c=>[bx(.12,.14,.4,0,0,0,c),bx(.02,.1,.14,0,.1,0,c),bx(.03,.15,.16,0,0,-.27,c,1)];
const FS=[],FH=[],NS=touch?8:14,PAL=[[1,.55,.2],[.75,.85,.95],[.3,.6,1],[1,.85,.3]];
for(let s=0;s<NS;s++){let x,z,ok=0;for(let k=0;k<400&&!ok;k++){x=(Math.random()*2-1)*440;z=(Math.random()*2-1)*440;ok=hAt(x,z)<WL-1.6}
 if(!ok)continue;const sc={x,z,dir:Math.random()*6.28,tmr:0,y:WL-1.2-Math.random()*1.5,far:0,t:PAL[s%4]};FS.push(sc);
 for(let m=0;m<8;m++)FH.push({s:sc,r:1+Math.random()*3,a:Math.random()*6.28,w:.6+Math.random()*.6,ph:Math.random()*6.28,i:FH.length,h:0})}
const fb=build(fp([.95,.95,.95]),Math.max(1,FH.length),-2);fb.im.count=FH.length;fb.im.castShadow=false;
for(const b of FH){const v=.85+Math.random()*.3;fb.im.setColorAt(b.i,TC.setRGB(b.s.t[0]*v,b.s.t[1]*v,b.s.t[2]*v))}
// ---------- Cámara (P): foto simple con flash. El diario de campo antiguo (B), el registro de especies y las notas sueltas se eliminaron con la nueva historia.
{const st=document.createElement('style');st.textContent='#dflash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:9}';document.head.appendChild(st)}
const dfl=document.createElement('div');dfl.id='dflash';document.body.appendChild(dfl);
window.camFlash=()=>{dfl.style.transition='none';dfl.style.opacity=.75;requestAnimationFrame(()=>requestAnimationFrame(()=>{dfl.style.transition='opacity .45s ease-out';dfl.style.opacity=0}));auHit(3200,.04,.2);auHit(1100,.07,.14)};
{const tb=document.getElementById('tb');if(tb){
  const doReset=()=>{
    window.__boisResetting=true;/* v181: los volcados al cerrar/ocultar no deben reescribir lo que se acaba de borrar */
    try{['bois_story','bois_story_bak','bois_pos','bois_car_pos','bois_notes','bois_dsc','bois_seen','bois_dfoto','bois_explored'].forEach(k=>localStorage.removeItem(k))}catch(e){typeof __bw==='function'&&__bw('08-fauna-journal#1',e)}
    // v69: volver al menú. La nueva partida comienza únicamente al pulsar Comenzar.
    try{sessionStorage.removeItem('bois_autostart_after_reset');sessionStorage.setItem('bois_new_game_pending','1')}catch(e){typeof __bw==='function'&&__bw('08-fauna-journal#2',e)}
    location.reload();
  };
  let resetModal=null;
  const clearProgress=()=>{
    if(resetModal){resetModal.style.display='flex';window.__boisGuideOverlayOpen=true;if(document.pointerLockElement){window.__boisGuideIgnoreNextUnlock=true;document.exitPointerLock?.()}return}
    const md=document.createElement('div');md.id='boisResetModal';
    md.style.cssText='position:fixed;inset:0;z-index:99992;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,7,10,.92);font-family:Georgia,serif;color:#eee9dd';
    md.innerHTML='<div style="width:min(420px,94vw);background:rgba(17,23,26,.97);border:1px solid rgba(220,215,195,.24);padding:22px;box-shadow:0 18px 60px #000a"><h3 style="margin:0 0 8px;font:400 20px Georgia,serif">¿Reiniciar el progreso?</h3><p style="margin:0 0 18px;font:13px/1.55 system-ui,sans-serif;color:#c1c0b7">Se borrarán la historia, las fotografías recuperadas, el mapa explorado y la última posición guardada. Tus ajustes de calidad y sonido se conservarán.</p><div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" data-r="no" style="padding:7px 14px;background:transparent;color:#c9c2b1;border:1px solid #ffffff35;font:12px system-ui;cursor:pointer">Cancelar</button><button type="button" data-r="yes" style="padding:7px 14px;background:rgba(165,62,48,.35);color:#f3e5dc;border:1px solid rgba(220,120,100,.55);font:12px system-ui;cursor:pointer">Sí, reiniciar</button></div></div>';
    const closeMd=()=>{md.style.display='none';try{window.__boisGuideOverlayOpen=!!(typeof BOIS_GUIDE!=='undefined'&&(BOIS_GUIDE.journal||BOIS_GUIDE.map))}catch(e){window.__boisGuideOverlayOpen=false}if(S.on&&!touch&&!window.__boisGuideOverlayOpen)document.getElementById('c')?.requestPointerLock?.()};
    md.addEventListener('click',e=>{const r=e.target.closest&&e.target.closest('[data-r]');if(e.target===md||(r&&r.dataset.r==='no'))closeMd();else if(r&&r.dataset.r==='yes')doReset()});
    document.body.appendChild(md);resetModal=md;window.__boisGuideOverlayOpen=true;if(document.pointerLockElement){window.__boisGuideIgnoreNextUnlock=true;document.exitPointerLock?.()}
  };
  const b=document.createElement('button');b.textContent='Reiniciar';b.title='Borrar progreso y volver al inicio';
  b.onclick=clearProgress;
  tb.appendChild(b);
  const resetMenu=document.getElementById('resetProgress');
  if(resetMenu){resetMenu.addEventListener('click',clearProgress)}
}}
// criaturas nuevas del mapa
const CR=window.__CR=[],rnd=Math.random,B=(w,h,d,x,y,z,c)=>({g:new THREE.BoxGeometry(w,h,d).translate(x,y,z),c:lin(c[0],c[1],c[2])}),
 cm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true});
const gTu=merge([B(.7,.28,.9,0,.22,0,[.25,.45,.22]),B(.5,.18,.6,0,.4,0,[.32,.58,.27]),B(.2,.16,.26,0,.2,.6,[.5,.6,.35]),B(.16,.12,.16,-.3,.08,.3,[.45,.55,.3]),B(.16,.12,.16,.3,.08,.3,[.45,.55,.3]),B(.16,.12,.16,-.3,.08,-.3,[.45,.55,.3]),B(.16,.12,.16,.3,.08,-.3,[.45,.55,.3])]),
 gFr=merge([B(.3,.2,.4,0,.15,0,[.25,.6,.25]),B(.26,.16,.2,0,.2,.28,[.3,.68,.28]),B(.07,.07,.07,-.09,.31,.32,[.95,.9,.4]),B(.07,.07,.07,.09,.31,.32,[.95,.9,.4]),B(.1,.1,.26,-.18,.08,-.12,[.2,.5,.2]),B(.1,.1,.26,.18,.08,-.12,[.2,.5,.2])]),
 gOw=merge([B(.5,.7,.45,0,.35,0,[.45,.35,.25]),B(.46,.36,.4,0,.85,.02,[.52,.42,.3]),B(.36,.2,.05,0,.86,.22,[.95,.9,.7]),B(.1,.1,.06,-.1,.9,.25,[1,.8,.1]),B(.1,.1,.06,.1,.9,.25,[1,.8,.1]),B(.08,.14,.08,-.17,1.1,0,[.4,.3,.2]),B(.08,.14,.08,.17,1.1,0,[.4,.3,.2])]),
 gBf=[[.95,.5,.2],[.35,.6,.95],[.95,.85,.25]].map(c=>merge([B(.3,.01,.24,-.17,0,0,c),B(.3,.01,.24,.17,0,0,c),B(.04,.04,.2,0,0,0,[.15,.12,.1])])),
 gSt=merge([B(.9,1.3,.9,0,.65,0,[.42,.42,.4]),B(.7,.3,.7,0,1.4,0,[.5,.5,.47])]);
const shoreP=[];for(let k=0;k<3000&&shoreP.length<40;k++){const x=(rnd()*2-1)*470,z=(rnd()*2-1)*470,h=hAt(x,z);if(h<WL-.1||h>WL+1.5||nearB(x,z))continue;if([[9,0],[-9,0],[0,9],[0,-9]].some(a=>inLake(x+a[0],z+a[1])))shoreP.push([x,z])}
const land=()=>{for(let k=0;k<400;k++){const x=(rnd()*2-1)*440,z=(rnd()*2-1)*440;if(hAt(x,z)>WL+2&&!nearB(x,z))return[x,z]}return null};
const mk=(g,nm,k,x,z,o)=>{const m=new THREE.Mesh(g,cm);m.userData.dyn=true;m.castShadow=true;scene.add(m);const c=Object.assign({nm,m,k,x,z,hd:rnd()*6.28,t:rnd()*5,ph:rnd()*6.28,b:1,pr:0},o);m.position.set(x,hAt(x,z),z);CR.push(c);return c};
for(let i=0;i<5&&i<shoreP.length;i++)mk(gTu,'Tortuga','tu',shoreP[i][0],shoreP[i][1],{b:1.3,sq:1,mv:0,rg:25,sg:12});
for(let i=0;i<7&&i+5<shoreP.length+5;i++){const p=shoreP[(i*3+2)%Math.max(1,shoreP.length)];if(p)mk(gFr,'Rana','fr',p[0],p[1],{b:1.5,hp:0,yo:0,cr:0,rg:16,sg:8,x0:0,z0:0,x1:0,z1:0})}
for(let i=0;i<10;i++){const p=land();if(p)mk(gBf[i%3],'Mariposa','bf',p[0],p[1],{b:1.6,ax:p[0],az:p[1],a:rnd()*6.28,w:.5+rnd()*.5,r:2.5+rnd()*3,rg:22,sg:10})}
for(let i=0;i<4;i++){const p=land();if(!p)continue;const st=new THREE.Mesh(gSt,cm);st.position.set(p[0],hAt(p[0],p[1]),p[1]);st.castShadow=st.receiveShadow=true;scene.add(st);const c=mk(gOw,'Lechuza','ow',p[0],p[1],{b:1.2,rg:45,sg:20});c.m.position.y=hAt(p[0],p[1])+1.55*1;c.m.scale.setScalar(1.2);c.m.position.y=hAt(p[0],p[1])+1.4}
// Medusas y notas de los Poolrooms (se crean al entrar por primera vez)
window.__prInit=sc=>{if(sc.__med)return;sc.__med=1;const PYy=-300,bm=new THREE.MeshBasicMaterial({color:0x9fe8ff,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:true}),tm=new THREE.MeshBasicMaterial({color:0x6fd0ff,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}),bellGeo=new THREE.SphereGeometry(.9,12,7,0,6.283,0,1.75),tentGeo=new THREE.BoxGeometry(.06,1.7,.06).translate(0,-.85,0);
 for(let k=0;k<4;k++){const g=new THREE.Group();g.add(new THREE.Mesh(bellGeo,bm));const tn=[];for(let t=0;t<7;t++){const a=t/7*6.283,m=new THREE.Mesh(tentGeo,tm);m.position.set(Math.cos(a)*.55,0,Math.sin(a)*.55);g.add(m);tn.push(m)}
  const x=k===0?10:(rnd()*2-1)*100,z=k===0?-9:(rnd()*2-1)*100,y=PYy+2.6+rnd()*1.6;g.position.set(x,y,z);g.scale.setScalar(1.4);sc.add(g);CR.push({nm:'Medusa',m:g,k:'me',tn,x,z,y0:y,hd:rnd()*6.28,ph:rnd()*6.28,pr:1,rg:40,sg:16})}
 };
window.__life2=(dt,tt)=>{const pr=typeof PR!=='undefined'&&PR.on,nt=(typeof PC!=='undefined'&&PC&&PC.night)||0,rn=(WX.st&&WX.st.rain)||0;
 for(const c of CR){if(!!c.pr!==pr)continue;const p=c.m.position,dx=(c.k==='me'?p.x:c.x)-S.x,dz=(c.k==='me'?p.z:c.z)-S.z,d2=dx*dx+dz*dz;
  if(c.k==='me'){c.hd+=Math.sin(tt*.2+c.ph)*dt*.5;p.x+=Math.sin(c.hd)*.9*dt;p.z+=Math.cos(c.hd)*.9*dt;if(Math.abs(p.x)>118||Math.abs(p.z)>118)c.hd+=3.14*dt*2;p.y=c.y0+Math.sin(tt*.6+c.ph)*.5;c.m.scale.y=1.4*(1+.12*Math.sin(tt*2+c.ph));for(let i=0;i<c.tn.length;i++){const m=c.tn[i];m.rotation.x=Math.sin(tt*1.6+i)*.25;m.rotation.z=Math.cos(tt*1.3+i*1.7)*.25}continue}
  if(d2>40000){c.m.visible=false;continue}c.m.visible=true;
  if(c.k==='tu'){c.t-=dt;if(c.t<=0){c.t=4+rnd()*8;c.hd+=(rnd()-.5)*2.4;c.mv=rnd()<.65}c.sq+=((d2<16?.55:1)-c.sq)*Math.min(1,dt*4);const sp=d2<16?0:c.mv?.35:0;
   if(sp){const nx=c.x+Math.sin(c.hd)*sp*dt,nz=c.z+Math.cos(c.hd)*sp*dt,h=hAt(nx,nz);if(h>WL-.5&&h<WL+2.4&&!nearB(nx,nz)){c.x=nx;c.z=nz}else c.hd+=1.7}
   p.set(c.x,Math.max(hAt(c.x,c.z),WL-.25)+.03,c.z);c.m.rotation.y=c.hd;c.m.scale.set(c.b,c.b*c.sq,c.b)}
  else if(c.k==='fr'){if(c.hp>0){c.hp-=dt/.5;const u=1-Math.max(0,c.hp);c.x=c.x0+(c.x1-c.x0)*u;c.z=c.z0+(c.z1-c.z0)*u;c.yo=Math.sin(Math.PI*u)*.8;c.hd=Math.atan2(c.x1-c.x0,c.z1-c.z0)}
   else{c.yo=0;c.t-=dt;if(c.t<=0||d2<20){c.t=3+rnd()*7;const an=d2<20?Math.atan2(c.x-S.x,c.z-S.z):rnd()*6.28,L=d2<20?5:2+rnd()*3,nx=c.x+Math.sin(an)*L,nz=c.z+Math.cos(an)*L,h=hAt(nx,nz);if(h>WL-.1&&h<WL+1.6&&!nearB(nx,nz)){c.x0=c.x;c.z0=c.z;c.x1=nx;c.z1=nz;c.hp=1}}
    if(nt>.4&&d2<1600&&tt>c.cr&&AU.on&&S.on&&!PR.on&&!document.hidden&&!(typeof CIN!=='undefined'&&CIN.on)&&!(window.__boisCh6&&window.__boisCh6.on)){c.cr=tt+2.5+rnd()*3;const v=.12*(1-Math.sqrt(d2)/40);auHit(240,.1,v);setTimeout(()=>{if(AU.on&&S.on&&!PR.on&&!document.hidden&&!(typeof CIN!=='undefined'&&CIN.on)&&!(window.__boisCh6&&window.__boisCh6.on))auHit(330,.12,v*.9)},140)}}
   p.set(c.x,Math.max(hAt(c.x,c.z),WL-.2)+.02+c.yo,c.z);c.m.rotation.y=c.hd;c.m.scale.setScalar(c.b)}
  else if(c.k==='bf'){const vis=nt<.35&&rn<.5;c.m.visible=vis;if(!vis)continue;c.a+=dt*c.w;const px=p.x,pz=p.z,x=c.ax+Math.cos(c.a)*c.r+Math.sin(c.a*2.3)*1.3,z=c.az+Math.sin(c.a*1.3)*c.r;c.x=x;c.z=z;p.set(x,hAt(x,z)+1.3+Math.sin(c.a*3)*.5,z);if(Math.abs(x-px)+Math.abs(z-pz)>1e-4)c.m.rotation.y=Math.atan2(x-px,z-pz);c.m.scale.set(c.b*(.35+.65*Math.abs(Math.sin(tt*16+c.ph))),c.b,c.b)}
  else if(c.k==='ow'){const vis=nt>.45&&rn<.7;c.m.visible=vis;if(!vis)continue;const tg=Math.atan2(S.x-c.x,S.z-c.z),dd=Math.atan2(Math.sin(tg-c.hd),Math.cos(tg-c.hd));c.hd+=dd*Math.min(1,dt*(d2<2500?2.2:.4));c.m.rotation.y=c.hd}
  }};


let ppx=0,ppz=0,psp=0,first=1,bdT=0;
 const f=(dt,tt)=>{U.value=tt;let near=0;if(first){ppx=S.x;ppz=S.z;first=0}{const dm=Math.hypot(S.x-ppx,S.z-ppz)/Math.max(dt,.001);psp+=(Math.min(dm,40)-psp)*Math.min(1,dt*4);ppx=S.x;ppz=S.z}
  const nt=(typeof PC!=="undefined"&&PC&&PC.night)||0;let thx=S.x,thz=S.z,fdm=psp>7?1.5:psp<3?.6:1;
 for(const a of FN){const sp=a.sp,dx=a.x-S.x,dz=a.z-S.z,d2=dx*dx+dz*dz;
  if(d2>90000){if(!a.far){a.far=1;a._idleDone=0;sp.im.setMatrixAt(a.i,ZM);sp.dirty=1}continue}
  const wasFar=a.far;a.far=0;if(d2<3600)near++;
     if(a.sv===undefined){a.sv=0;a.st=1;a.al=0;a.ft=0;a.rs=0;a.pp=0;a.sq=1;a.fj=(Math.random()-.5)*1.1}
   if(a.dead>0){a._idleDone=0;a.dead-=dt;if(a.dead<=0){a.dead=0;a.x=a.g.x+(Math.random()-.5)*4;a.z=a.g.z+(Math.random()-.5)*4;a.st=0;a.tmr=2;a.sv=0}else{sp.im.setMatrixAt(a.i,ZM);sp.dirty=1;continue}}
   let tx_=thx,tz_=thz;
   if(sp.id===2)for(const fx of SP[3].a){const q=(fx.x-a.x)**2+(fx.z-a.z)**2;if(q<196&&q<(a.x-tx_)**2+(a.z-tz_)**2){tx_=fx.x;tz_=fx.z}}
   const ex=a.x-tx_,ez=a.z-tz_,dd=Math.sqrt(ex*ex+ez*ez)||1,fol=(tx_!==thx||tz_!==thz)?1:0,rs=a.rs,fl0=sp.fd*(fol?1:fdm);
   let fR=fl0*(rs?.6:1),aR=fl0*1.7*(rs?.5:1);
   if((Math.sin(a.hd)*-ex+Math.cos(a.hd)*-ez)/dd<-.3){fR*=.75;aR*=.6}
   const alarm=a.g.at!==undefined&&tt-a.g.at<2.2&&dd<fl0*3.5;
   if(dd<fR||alarm){if(a.st!==3){a.g.at=tt;a.fj=(Math.random()-.5)*1.1}a.st=3;a.ft=2.2+Math.random();a.rs=0}
   else if(a.st!==3&&dd<aR&&sp.id!==4){a.al+=dt;if(a.st!==2){a.st=2;a.rs=0}if(a.al>1.4+sp.id*.15){a.st=3;a.ft=2.2;a.g.at=tt;a.al=0}}
   else{if(a.st===2){a.st=0;a.tmr=1+Math.random()*2}a.al=Math.max(0,a.al-dt*.5)}
   if(a.st===3){a.ft-=dt;if(a.ft<=0){if(dd>fR*1.2){a.st=1;a.tmr=2+Math.random()*3}else a.ft=.3}}
   let hunt=0;
   if(sp.id===3&&a.st!==3&&a.st!==4){
    if(a.pr&&(a.pr.dead>0||tt>a.pe))a.pr=null;
    if(!a.pr&&tt>(a.nx||0)){a.nx=tt+1.5;let b=2000;for(const r of SP[2].a){if(r.dead>0||r.far||r.rs)continue;const q=(r.x-a.x)**2+(r.z-a.z)**2;if(q<b){b=q;a.pr=r}}if(a.pr)a.pe=tt+10}
    if(a.pr){const q=(a.pr.x-a.x)**2+(a.pr.z-a.z)**2;if(q<2){if(Math.random()<.6){a.pr.dead=30;a.st=0;a.tmr=6;a.rs=0}else{a.pr.ft=3;a.pr.st=3}a.pr=null;a.nx=tt+4}else{a.tx=a.pr.x;a.tz=a.pr.z;hunt=1;a.st=5}}}
   if(a.st!==3&&!hunt){if(a.st===5)a.st=1;
    if(a.st!==2){a.tmr-=dt;if(a.tmr<=0){a.tmr=3+Math.random()*6;const sl=sp.id===3?(nt<.25&&Math.random()<.55):(nt>.65&&Math.random()<.85);
     if(sp.id<4&&sl){a.st=4;a.rs=1;a.tmr=10+Math.random()*20;a.tx=a.x;a.tz=a.z}
     else{a.rs=0;if(Math.random()<.4){a.st=0;a.tx=a.x;a.tz=a.z;a.hd+=(Math.random()-.5)*1.2;a._idleDone=0}else{a.st=1;const an=Math.random()*6.283,r=Math.random()*sp.r;a.g.x+=(Math.random()-.5)*2;a.g.z+=(Math.random()-.5)*2;a.tx=a.g.x+Math.cos(an)*r;a.tz=a.g.z+Math.sin(an)*r}}}}}
   let v=0,tgH=null;
   if(a.st===3){tgH=Math.atan2(ex,ez)+a.fj;v=sp.v*3.4;a.g.x+=(a.x-a.g.x)*Math.min(1,dt*.6);a.g.z+=(a.z-a.g.z)*Math.min(1,dt*.6)}
   else if(a.st===5){tgH=Math.atan2(a.tx-a.x,a.tz-a.z);v=sp.v*2.6}
   else if(a.st===2)tgH=Math.atan2(-ex,-ez);
   else if(a.st===1){const mx=a.tx-a.x,mz=a.tz-a.z;if(Math.hypot(mx,mz)>.5){tgH=Math.atan2(mx,mz);v=sp.v}else{a.st=0;a.tmr=2+Math.random()*3}}
   a.mv=0;a.sv+=(v-a.sv)*Math.min(1,dt*(v>a.sv?4:7));
   if(tgH!==null){let dh=tgH-a.hd;dh=Math.atan2(Math.sin(dh),Math.cos(dh));a.hd+=dh*Math.min(1,dt*(a.st===3?10:a.st===2?6:4));
    if(a.sv>.12&&Math.abs(dh)<1.2){const step=a.sv*dt;let ok=0;for(const o of[0,.7,-.7,1.4,-1.4]){const hh=a.hd+o,nx=a.x+Math.sin(hh)*step,nz=a.z+Math.cos(hh)*step,h=hAt(nx,nz);
      if(h>=sp.h0-.3&&h<=sp.h1+(sp.hx||10)&&!nearB(nx,nz)&&(!sp.lk||inLake(nx,nz))){a.x=nx;a.z=nz;a.mv=1;if(o)a.hd+=o*.25;ok=1;break}}
     if(!ok){a.sv=0;if(a.st===1){a.tx=a.x;a.tz=a.z;a.tmr=.5}}}}
const y=sp.wy!==undefined?sp.wy:hAt(a.x,a.z),hp=sp.wy!==undefined?Math.sin(tt*1.3+a.ph)*.03:a.mv?(sp.hop?Math.abs(Math.sin(tt*9+a.ph))*.35:Math.sin(tt*10+a.ph)*.03):0;
  const gz=a.st===0&&sp.id<4?(sp.id<2?.42:.18):a.st===2?-.1:0;a.pp+=(gz-a.pp)*Math.min(1,dt*5);a.sq+=((a.st===4?.6:1)-a.sq)*Math.min(1,dt*3);
   if(!wasFar&&!a.mv&&sp.wy===undefined&&a.sv<.01&&a.st===4&&Math.abs(a.sq-.6)<.005&&Math.abs(a.pp)<.005&&a._idleDone)continue;
   a._idleDone=(a.st===4&&!a.mv&&sp.wy===undefined&&a.sv<.01&&Math.abs(a.sq-.6)<.005&&Math.abs(a.pp)<.005)?1:0;
   E.set(a.pp,a.hd+sp.yo,0);Q.setFromEuler(E);M.compose(V.set(a.x,y+hp,a.z),Q,W.set(a.sc,a.sc*a.sq,a.sc));sp.im.setMatrixAt(a.i,M);sp.as.array[a.i]=a.mv?Math.min(2.2,a.sv/sp.v):0;sp.dirty=1}
 for(const sp of SP)if(sp.dirty){sp.dirty=0;sp.im.instanceMatrix.needsUpdate=true;sp.as.needsUpdate=true}
 bdT+=dt;if(bdT>=.033){const bdt=bdT;bdT=0;for(const b of BD){b.a+=bdt*b.w;const x=b.cx+Math.sin(tt*.03+b.f)*90+Math.cos(b.a)*b.r,z=b.cz+Math.cos(tt*.027+b.f)*90+Math.sin(b.a)*b.r;
  E.set(0,Math.atan2(-Math.sin(b.a),Math.cos(b.a)),-.4);Q.setFromEuler(E);M.compose(V.set(x,b.y+Math.sin(tt*.6+b.ph)*3,z),Q,W.set(1.8,1.8,1.8));bb.im.setMatrixAt(b.i,M)}
 bb.im.instanceMatrix.needsUpdate=true}
 for(const s of FS){const sd=(s.x-S.x)**2+(s.z-S.z)**2;s.far=sd>22500;if(s.far)continue;s.tmr-=dt;if(s.tmr<=0){s.tmr=3+Math.random()*5;s.dir+=(Math.random()-.5)*2}if(sd<144&&S.y<WL+.5){s.dir=Math.atan2(s.z-S.z,s.x-S.x);s.bt=1.5}s.bt=(s.bt||0)-dt;
  const nx=s.x+Math.cos(s.dir)*(s.bt>0?3.2:.9)*dt,nz=s.z+Math.sin(s.dir)*(s.bt>0?3.2:.9)*dt;if(hAt(nx,nz)<WL-1.6&&Math.abs(nx)<470&&Math.abs(nz)<470){s.x=nx;s.z=nz}else s.dir+=2.5*dt+.05}
 let fd=0;for(const b of FH){const s=b.s;
  if(s.far){if(!b.h){b.h=1;fb.im.setMatrixAt(b.i,ZM);fd=1}continue}
  b.h=0;fd=1;b.a+=dt*b.w;const x=s.x+Math.cos(b.a)*b.r,z=s.z+Math.sin(b.a)*b.r,fl=hAt(x,z);
  if(fl>WL-.8){fb.im.setMatrixAt(b.i,ZM);continue}
  E.set(0,Math.atan2(-Math.sin(b.a),Math.cos(b.a)),0);Q.setFromEuler(E);M.compose(V.set(x,Math.min(WL-.35,Math.max(fl+.3,s.y+Math.sin(tt*.7+b.ph)*.5)),z),Q,W.set(1.6,1.6,1.6));fb.im.setMatrixAt(b.i,M)}
 if(fd)fb.im.instanceMatrix.needsUpdate=true;

 f.near=near};
f.near=0;return f})();
