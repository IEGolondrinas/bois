/* BOIS.IO · 18-poolrooms.js — Poolrooms Remastered (Nivel 37 · Dream Pools)
   Arquitectura surrealista y liminal: mega-atrios de 48×48 m con bóvedas de 10.6 m, galerías de columnatas
   inundadas, pasillos estrechos laberínticos, piscinas escalonadas estilo baño romano, tobogán/chute acuático,
   puentes sobre el agua, escaleras imposibles, tragaluces solares dorados y neblina turquesa luminosa.
   Optimizado: pilares instanciados (3 llamadas), agua/cáusticas/haces por chunk, culling espacial,
   selección de luces sin asignaciones y precarga completa sin tirones. */
const PR=(()=>{
 const PY=-300,CW=24,N=11,O=-N*CW/2,WH=5.8,WH_ATRIUM=10.6,WH_GALLERY=7.2,WH_CORR=3.9,TW=.45,K=touch?3:6;
 const hs=(a,b)=>{const s=Math.sin(a*127.1+b*311.7+7.7)*43758.5453;return s-Math.floor(s)};
 // Mega-atrios (2×2 celdas abiertas) y galerías largas (2×1 o 1×2 celdas abiertas)
 const atriumId=(i,j)=>(i>=2&&i<=3&&j>=2&&j<=3)?'NW':(i>=7&&i<=8&&j>=7&&j<=8)?'SE':null;
 const galleryId=(i,j)=>((i===3||i===4)&&j===5)?'GW':((i===6||i===7)&&j===5)?'GE':(i===5&&(j===2||j===3))?'GN':null;
 const macroId=(i,j)=>atriumId(i,j)||galleryId(i,j)||null;
 const roomH=(i,j)=>atriumId(i,j)?WH_ATRIUM:galleryId(i,j)?WH_GALLERY:(ty(i,j)===4?WH_CORR:WH);
 // Tipos: 0=sala seca/paseo, 1=piscina escalonada baja, 2=piscina profunda/tobogán, 3=columnata inundada, 4=pasillo estrecho, 5=plataforma escalonada
 const ty=(i,j)=>{
  if(i===5&&j===5)return 0;
  if(i===5&&j===4)return 0;
  if(atriumId(i,j))return 3;
  const g=galleryId(i,j);
  if(g==='GW'||g==='GN')return 3;
  if(g==='GE')return 1;
  const r=hs(i+2,j+5);
  return r<.17?0:r<.41?1:r<.60?2:r<.77?3:r<.90?4:5;
 };
 const INS=[0,3.2,2.2],DEP=[0,1.65,2.75];
 const skyRoom=(i,j,t)=>{
  if(i===5&&j===5)return true;
  if(atriumId(i,j))return true;
  if(galleryId(i,j))return true;
  return (t===0||t===3)&&hs(i+11,j+17)>.72;
 };
 const P={on:false,D:6.5,ret:[0,0],scene:null,built:false,loadState:'idle',loadPromise:null,chunks:[],pillars:null};
 const loadLog=window.__boisPoolroomsLoad=window.__boisPoolroomsLoad||{version:'v194',state:'idle',stages:[],started:0,ended:0,totalMs:0,error:null};
 const loadMark=(name,ms,extra)=>{const e={name,ms:+ms.toFixed(2)};if(extra&&typeof extra==='object')Object.assign(e,extra);loadLog.stages.push(e);return e};

 // ---------- Texturas procedurales cargadas desde 18a-poolrooms-tex.js (window.__boisPoolTex)
 const getTex=()=>window.__boisPoolTex||{};

 // ---------- Construcción arquitectónica
 const G={},CB=[],WT=[],FXS=[],SKY=[],CYL=[],STP=[],keyOf=(ci,cj)=>ci+'_'+cj;
 const grpOf=(ci,cj,k)=>{const kk=keyOf(ci,cj);let c=G[kk];if(!c)c=G[kk]={ci,cj,g:{}};let g=c.g[k];if(!g)g=c.g[k]={p:[],n:[],u:[],c:[]};return g};
 const chunkOf=(x,z)=>[Math.max(0,Math.min(2,Math.floor((x-O)/(3*CW)))),Math.max(0,Math.min(2,Math.floor((z-O)/(3*CW))))];
 let curY=PY;
 const stp=(x0,x1,z0,z1,top)=>STP.push([x0,x1,z0,z1,top]);
 const ts=2,vw=y=>(y-PY)/4;
 const quad=(g,A,B,C,D,nx,ny,nz,uv,col)=>{
  for(const i of[A,B,C,A,C,D]){g.p.push(i[0],i[1],i[2]);g.n.push(nx,ny,nz)}
  for(const i of[0,1,2,0,2,3])g.u.push(uv[i][0],uv[i][1]);
  if(col)for(let i=0;i<6;i++)g.c.push(col[0],col[1],col[2]);
 };
 function box(f,x0,y0,z0,x1,y1,z1,wall,col,mid){
  const c=mid||[(x0+x1)/2,(z0+z1)/2],[ci,cj]=chunkOf(c[0],c[1]);
  if(typeof f==='string')f={t:f,s:f,b:f};
  const V=y=>wall?vw(y):y/ts,gs=grpOf(ci,cj,f.s),gt=grpOf(ci,cj,f.t),gb=grpOf(ci,cj,f.b);
  quad(gs,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],1,0,0,[[z1/ts,V(y0)],[z0/ts,V(y0)],[z0/ts,V(y1)],[z1/ts,V(y1)]],col);
  quad(gs,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],-1,0,0,[[z0/ts,V(y0)],[z1/ts,V(y0)],[z1/ts,V(y1)],[z0/ts,V(y1)]],col);
  quad(gs,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],0,0,1,[[x0/ts,V(y0)],[x1/ts,V(y0)],[x1/ts,V(y1)],[x0/ts,V(y1)]],col);
  quad(gs,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],0,0,-1,[[x1/ts,V(y0)],[x0/ts,V(y0)],[x0/ts,V(y1)],[x1/ts,V(y1)]],col);
  quad(gt,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0,1,0,[[x0/ts,z1/ts],[x1/ts,z1/ts],[x1/ts,z0/ts],[x0/ts,z0/ts]],col);
  quad(gb,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],0,-1,0,[[x0/ts,z0/ts],[x1/ts,z0/ts],[x1/ts,z1/ts],[x0/ts,z1/ts]],col);
 }
 const col_=(a,b,c,d)=>CB.push([a,b,c,d]);
 const rimk={t:'rim',s:'rim',b:'rim'};
 const pil=(cx,cz,top,base,r)=>{const rr=r||.56;CYL.push({x:cx,z:cz,top,r:rr,base:base===undefined?PY:base});col_(cx-rr-.14,cx+rr+.14,cz-rr-.14,cz+rr+.14)};
 const mbox=(x0,y0,z0,x1,y1,z1,c)=>box('m',x0,y0,z0,x1,y1,z1,false,c);
 const sign=(x,y,z,face,idx)=>{
  const[ci,cj]=chunkOf(x,z),g=grpOf(ci,cj,'sg'),w=.92,h=.24,u0=(idx%2)*.5,v0=1-(1+(idx>>1))*.5,uv=[[u0,v0],[u0+.5,v0],[u0+.5,v0+.5],[u0,v0+.5]];
  if(face==='z+')quad(g,[x-w,y-h,z],[x+w,y-h,z],[x+w,y+h,z],[x-w,y+h,z],0,0,1,uv);
  else if(face==='z-')quad(g,[x+w,y-h,z],[x-w,y-h,z],[x-w,y+h,z],[x+w,y+h,z],0,0,-1,uv);
  else if(face==='x+')quad(g,[x,y-h,z+w],[x,y-h,z-w],[x,y+h,z-w],[x,y+h,z+w],1,0,0,uv);
  else quad(g,[x,y-h,z-w],[x,y-h,z+w],[x,y+h,z+w],[x,y+h,z-w],-1,0,0,uv);
 };

 function archSeg(ax,u0,y0,u1,y1,top,w0,w1,mid){
  const[ci,cj]=chunkOf(mid[0],mid[1]),g=grpOf(ci,cj,'w'),du=u1-u0,dy=y1-y0,P3=(u,y,w)=>ax?[u,y,w]:[w,y,u],V=y=>(y-PY)/4;
  const q=(A,B,C,D,n,uv)=>ax?quad(g,A,B,C,D,n[0],n[1],n[2],uv):quad(g,A,D,C,B,n[0],n[1],n[2],[uv[0],uv[3],uv[2],uv[1]]);
  q(P3(u0,y0,w1),P3(u1,y1,w1),P3(u1,top,w1),P3(u0,top,w1),ax?[0,0,1]:[1,0,0],[[u0/ts,V(y0)],[u1/ts,V(y1)],[u1/ts,V(top)],[u0/ts,V(top)]]);
  q(P3(u1,y1,w0),P3(u0,y0,w0),P3(u0,top,w0),P3(u1,top,w0),ax?[0,0,-1]:[-1,0,0],[[u1/ts,V(y1)],[u0/ts,V(y0)],[u0/ts,V(top)],[u1/ts,V(top)]]);
  const l=Math.hypot(du,dy)||1,nu=dy/l,ny=-du/l;
  q(P3(u0,y0,w0),P3(u1,y1,w0),P3(u1,y1,w1),P3(u0,y0,w1),ax?[nu,ny,0]:[0,ny,nu],[[u0/ts,0],[u1/ts,0],[u1/ts,(w1-w0)/ts],[u0/ts,(w1-w0)/ts]]);
 }

 function archX(a,b,zc,mid,topH,rad,rise,springY){
  const z0=zc-TW/2,z1=zc+TW/2,m=(a+b)/2,r=rad||5.0,spring=PY+(springY||2.65),top=PY+(topH||WH),rs=rise||1.65,n=22;
  const F=u=>spring+rs*Math.sqrt(Math.max(0,1-Math.pow((u-m)/r,2)));
  if(m-r>a+.05){box('w',a,PY-3.2,z0,m-r,top,z1,true,null,mid);col_(a,m-r,z0-.1,z1+.1)}
  if(b>m+r+.05){box('w',m+r,PY-3.2,z0,b,top,z1,true,null,mid);col_(m+r,b,z0-.1,z1+.1)}
  for(let q=0;q<n;q++){const u0=m-r+2*r*q/n,u1=m-r+2*r*(q+1)/n;archSeg(true,u0,F(u0),u1,F(u1),top,z0,z1,mid)}
 }
 function archZ(a,b,xc,mid,topH,rad,rise,springY){
  const x0=xc-TW/2,x1=xc+TW/2,m=(a+b)/2,r=rad||5.0,spring=PY+(springY||2.65),top=PY+(topH||WH),rs=rise||1.65,n=22;
  const F=u=>spring+rs*Math.sqrt(Math.max(0,1-Math.pow((u-m)/r,2)));
  if(m-r>a+.05){box('w',x0,PY-3.2,a,x1,top,m-r,true,null,mid);col_(x0-.1,x1+.1,a,m-r)}
  if(b>m+r+.05){box('w',x0,PY-3.2,m+r,x1,top,b,true,null,mid);col_(x0-.1,x1+.1,m+r,b)}
  for(let q=0;q<n;q++){const u0=m-r+2*r*q/n,u1=m-r+2*r*(q+1)/n;archSeg(false,u0,F(u0),u1,F(u1),top,x0,x1,mid)}
 }
 // Arcada doble (dos arcos elegantes con pilar central) para variar los umbrales
 function twinArchX(a,b,zc,mid,topH){
  const z0=zc-TW/2,z1=zc+TW/2,m=(a+b)/2,top=PY+(topH||WH),r=2.8,sp=PY+2.4,rs=1.35,n=14;
  box('w',a,PY-3.2,z0,m-6.4,top,z1,true,null,mid);col_(a,m-6.4,z0-.1,z1+.1);
  box('w',m-.8,PY-3.2,z0,m+.8,top,z1,true,null,mid);col_(m-.8,m+.8,z0-.1,z1+.1);
  box('w',m+6.4,PY-3.2,z0,b,top,z1,true,null,mid);col_(m+6.4,b,z0-.1,z1+.1);
  for(const c of[m-3.6,m+3.6]){const F=u=>sp+rs*Math.sqrt(Math.max(0,1-Math.pow((u-c)/r,2)));for(let q=0;q<n;q++){const u0=c-r+2*r*q/n,u1=c-r+2*r*(q+1)/n;archSeg(true,u0,F(u0),u1,F(u1),top,z0,z1,mid)}}
 }
 function twinArchZ(a,b,xc,mid,topH){
  const x0=xc-TW/2,x1=xc+TW/2,m=(a+b)/2,top=PY+(topH||WH),r=2.8,sp=PY+2.4,rs=1.35,n=14;
  box('w',x0,PY-3.2,a,x1,top,m-6.4,true,null,mid);col_(x0-.1,x1+.1,a,m-6.4);
  box('w',x0,PY-3.2,m-.8,x1,top,m+.8,true,null,mid);col_(x0-.1,x1+.1,m-.8,m+.8);
  box('w',x0,PY-3.2,m+6.4,x1,top,b,true,null,mid);col_(x0-.1,x1+.1,m+6.4,b);
  for(const c of[m-3.6,m+3.6]){const F=u=>sp+rs*Math.sqrt(Math.max(0,1-Math.pow((u-c)/r,2)));for(let q=0;q<n;q++){const u0=c-r+2*r*q/n,u1=c-r+2*r*(q+1)/n;archSeg(false,u0,F(u0),u1,F(u1),top,x0,x1,mid)}}
 }

 // Piscina escalonada reutilizable (3 peldaños concéntricos de baño romano hacia el fondo)
 function buildTerracedPool(x0,x1,z0,z1,a,b,c,e,P_,mid,isWide){
  const dk={t:'fd',s:'pw',b:'pw'};
  box(dk,x0,PY-P_-.3,z0,x1,PY,c,false,null,mid);
  box(dk,x0,PY-P_-.3,e,x1,PY,z1,false,null,mid);
  box(dk,x0,PY-P_-.3,c,a,PY,e,false,null,mid);
  box(dk,b,PY-P_-.3,c,x1,PY,e,false,null,mid);
  // 3 escalones perimetrales dentro de la piscina
  const sw=1.15,st=Math.min(3,Math.floor(Math.min(b-a,e-c)/(sw*3)));
  let ia=a,ib=b,ic=c,ie=e;
  for(let s=0;s<st;s++){
   const yTop=PY-.38*(s+1),yBot=PY-P_-.3;
   if(yTop<=PY-P_+.18)break;
   const na=ia+sw,nb=ib-sw,nc=ic+sw,ne=ie-sw;
   if(nb-na<2.5||ne-nc<2.5)break;
   const m={t:'pb',s:'pb',b:'pb'};
   box(m,ia,yBot,ic,ib,yTop,nc,false,null,mid);
   box(m,ia,yBot,ne,ib,yTop,ie,false,null,mid);
   box(m,ia,yBot,nc,na,yTop,ne,false,null,mid);
   box(m,nb,yBot,nc,ib,yTop,ne,false,null,mid);
   ia=na;ib=nb;ic=nc;ie=ne;
  }
  box({t:'pb',s:'pb',b:'pb'},ia,PY-P_-.35,ic,ib,PY-P_,ie,false,null,mid);
  WT.push([(a+b)/2,(c+e)/2,b-a,e-c,PY-P_,isWide?1:2]);
  box(rimk,a-.34,PY,c-.34,b+.34,PY+.06,c,false,null,mid);
  box(rimk,a-.34,PY,e,b+.34,PY+.06,e+.34,false,null,mid);
  box(rimk,a-.34,PY,c,a,PY+.06,e,false,null,mid);
  box(rimk,b,PY,c,b+.34,PY+.06,e,false,null,mid);
 }

 // Tragaluz en el techo con pozo vertical y haz solar
 function buildSkylight(x0,x1,z0,z1,cx,cz,ch,hw,warm,mid){
  const a=cx-hw,b=cx+hw,c=cz-hw,e=cz+hw;
  box('c',x0,PY+ch,z0,x1,PY+ch+.35,c,false,null,mid);
  box('c',x0,PY+ch,e,x1,PY+ch+.35,z1,false,null,mid);
  box('c',x0,PY+ch,c,a,PY+ch+.35,e,false,null,mid);
  box('c',b,PY+ch,c,x1,PY+ch+.35,e,false,null,mid);
  for(const[ax,ay,bx,by]of[[a,c,b,c+.25],[a,e-.25,b,e],[a,c,a+.25,e],[b-.25,c,b,e]])box('w',ax,PY+ch+.35,ay,bx,PY+ch+2.4,by,false,null,mid);
  const g=grpOf(...chunkOf(cx,cz),'l'),y=PY+ch+2.15;
  quad(g,[a,y,c],[b,y,c],[b,y,e],[a,y,e],0,-1,0,[[0,0],[1,0],[1,1],[0,1]],warm?[1.0,.96,.86]:[.86,.97,1.05]);
  SKY.push({x:cx,z:cz,y:PY+ch,h:ch,w:hw*1.9});
  FXS.push({x:cx,y:PY+ch-.25,z:cz,col:warm?0xfff1d4:0xc8efff,int:warm?2.0:1.75,sky:true,f:1,dead:false,flick:false});
 }

 // Mega-atrio 2×2 (48×48 m, techo de 10.6 m, gran piscina escalonada con isla central y pasarelas)
 function buildAtrium(i0,j0){
  const x0=O+i0*CW,x1=x0+2*CW,z0=O+j0*CW,z1=z0+2*CW,cx=(x0+x1)/2,cz=(z0+z1)/2,mid=[cx,cz],ch=WH_ATRIUM;
  const I=10,P_=1.65,a=x0+I,b=x1-I,c=z0+I,e=z1-I;
  buildTerracedPool(x0,x1,z0,z1,a,b,c,e,P_,mid,true);
  // Isla central elevada con puente norte y sur (walkable con stp)
  box({t:'fd',s:'rim',b:'rim'},cx-3.4,PY-P_-.3,cz-3.4,cx+3.4,PY+.08,cz+3.4,false,null,mid);
  stp(cx-3.4,cx+3.4,cz-3.4,cz+3.4,PY+.08);
  // Dos pasarelas de losa blanca cruzando la piscina (Norte y Sur hacia la isla)
  box({t:'fd',s:'rim',b:'rim'},cx-1.6,PY-.12,c-.4,cx+1.6,PY+.05,cz-3.4,false,null,mid);
  stp(cx-1.6,cx+1.6,c-.4,cz-3.4,PY+.05);
  box({t:'fd',s:'rim',b:'rim'},cx-1.6,PY-.12,cz+3.4,cx+1.6,PY+.05,e+.4,false,null,mid);
  stp(cx-1.6,cx+1.6,cz+3.4,e+.4,PY+.05);
  // Columnata monumental perimetral (12 pilares altos de 10.6 m)
  for(const px of[cx-17,cx-7,cx+7,cx+17])for(const pz of[cz-17,cz+17])pil(px,pz,PY+ch,PY,.84);
  for(const pz of[cz-7,cz+7])for(const px of[cx-17,cx+17])pil(px,pz,PY+ch,PY,.84);
  // Pilares sumergidos flanqueando la isla central
  for(const sx of[-3.1,3.1])for(const sz of[-3.1,3.1])pil(cx+sx,cz+sz,PY+ch,PY+.08,.52);
  // Galería alta decorativa (cornisa inalcanzable a 6.4 m)
  for(const[ax,az,bx,bz]of[[x0,z0,x1,z0+1.1],[x0,z1-1.1,x1,z1],[x0,z0+1.1,x0+1.1,z1-1.1],[x1-1.1,z0+1.1,x1,z1-1.1]]){
   box('rim',ax,PY+6.3,az,bx,PY+6.65,bz,false,null,mid);
  }
  // Tragaluz gigantesco de 14×14 m con luz solar dorada
  buildSkylight(x0,x1,z0,z1,cx,cz,ch,7,true,mid);
  // Focos extra en los cuatro cuadrantes del atrio
  for(const sx of[-13,13])for(const sz of[-13,13])FXS.push({x:cx+sx,y:PY+ch-.4,z:cz+sz,col:0xeef9ff,int:1.45,sky:true,f:1,dead:false,flick:false});
 }

 // Galerías largas de 2 celdas (48×24 m)
 function buildGallery(id,i0,j0){
  const horiz=(id==='GW'||id==='GE');
  const x0=O+i0*CW,x1=x0+(horiz?2:1)*CW,z0=O+j0*CW,z1=z0+(horiz?1:2)*CW,cx=(x0+x1)/2,cz=(z0+z1)/2,mid=[cx,cz],ch=WH_GALLERY;
  if(id==='GW'||id==='GN'){
   // Columnata inundada espejada (agua poco profunda y dos filas de pilares altos)
   box({t:'fw',s:'fw',b:'fw'},x0,PY-1.2,z0,x1,PY-.9,z1,false,null,mid);
   WT.push([cx,cz,x1-x0,z1-z0,PY-.9,3]);
   if(horiz){
    for(const px of[-18,-9,0,9,18])for(const pz of[-5.8,5.8])pil(cx+px,cz+pz,PY+ch,PY-.9,.64);
    buildSkylight(x0,x1,z0,z1,cx,cz,ch,4.2,false,mid);
   }else{
    for(const pz of[-18,-9,0,9,18])for(const px of[-5.8,5.8])pil(cx+px,cz+pz,PY+ch,PY-.9,.64);
    buildSkylight(x0,x1,z0,z1,cx,cz,ch,4.2,true,mid);
   }
  }else{
   // Galería Este: piscina olímpica escalonada de 40 m + trampolín y corcheras
   const a=x0+3.5,b=x1-3.5,c=z0+4.2,e=z1-4.2;
   buildTerracedPool(x0,x1,z0,z1,a,b,c,e,1.75,mid,true);
   for(const rx of[cz-2.4,cz+2.4])for(let x=a+2.2;x<b-2.2;x+=.85)mbox(x-.13,PY-.55,rx-.13,x+.13,PY-.32,rx+.13,((x/.85|0)%2)?[.95,.97,.98]:[.18,.72,.82]);
   for(const px of[x0+2,cx,x1-2])for(const pz of[z0+2,z1-2])pil(px,pz,PY+ch,PY,.56);
   buildSkylight(x0,x1,z0,z1,cx,cz,ch,4.5,true,mid);
  }
  for(const off of[-14,14])FXS.push({x:horiz?cx+off:cx,y:PY+ch-.35,z:horiz?cz:cz+off,col:0xeaf9ff,int:1.4,sky:true,f:1,dead:false,flick:false});
 }

 function geometry(){
  const doneMacro=new Set();
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
   const mac=macroId(i,j);
   if(mac){
    if(!doneMacro.has(mac)){
     doneMacro.add(mac);
     const at=atriumId(i,j);
     if(at)buildAtrium(i,j);else buildGallery(mac,i,j);
    }
    continue;
   }
   const x0=O+i*CW,x1=x0+CW,z0=O+j*CW,z1=z0+CW,cx=(x0+x1)/2,cz=(z0+z1)/2,t=ty(i,j),sk=skyRoom(i,j,t),ch=roomH(i,j),mid=[cx,cz];
   if(t===1||t===2){
    const I=INS[t],P_=DEP[t],a=x0+I,b=x1-I,c=z0+I,e=z1-I;
    buildTerracedPool(x0,x1,z0,z1,a,b,c,e,P_,mid,t===1);
    const lx=cx+3.2;
    for(const dx of[-.32,.32])mbox(lx+dx-.03,PY-P_*.55,c+.02,lx+dx+.03,PY+.95,c+.08,[.84,.88,.9]);
    for(let s=0;s<3;s++)mbox(lx-.32,PY-.25-s*.5,c+.02,lx+.32,PY-.2-s*.5,c+.14,[.84,.88,.9]);
    mbox(cx-.3,PY-P_-.28,cz-.3,cx+.3,PY-P_-.24,cz+.3,[.08,.18,.22]);
    sign(cx-7.5,PY+2.15,z0+TW/2+.01,'z+',t===1?0:1);
    if(t===2){
     // Trampolín o chute/tobogán escalonado a un lado (dejando el centro libre para la boya del Cap. V)
     mbox(cx-4.2,PY,c-1.7,cx-2.8,PY+.85,c-.5,[.85,.88,.92]);
     mbox(cx-3.75,PY+.85,c-1.55,cx-3.25,PY+.95,c+2.3,[.26,.72,.86]);
     // Pequeño tobogán curvo de cerámica en el borde derecho que desciende hacia el agua
     if(hs(i+19,j+23)>.45){
      const sx=b-1.8;
      for(let st=0;st<7;st++){const zz=z0+.30+st*.26,yy=PY+.16+st*.22;mbox(sx-.55,PY,zz,sx+.55,yy+.22,zz+.28,[.9,.93,.92]);stp(sx-.55,sx+.55,zz,zz+.28,yy+.22)}
      for(let chs=0;chs<7;chs++){const zz=c+chs*.42,yy=PY+1.56-chs*.27;mbox(sx-.55,yy-.16,zz,sx+.55,yy,zz+.46,[.28,.76,.86]);stp(sx-.55,sx+.55,zz,zz+.46,yy)}
     }
     for(const rx of[-2.2,2.2])for(let z=c+1.6;z<e-1.4;z+=.68)mbox(cx+rx-.12,PY-.55,z-.12,cx+rx+.12,PY-.31,z+.12,((z/.68|0)%2)?[.95,.97,.98]:[.18,.72,.82]);
    }
   }else if(t===3){
    box({t:'fw',s:'fw',b:'fw'},x0,PY-1.2,z0,x1,PY-.9,z1,false,null,mid);
    WT.push([cx,cz,CW,CW,PY-.9,3]);
    for(const[dx,dz]of[[-6.2,-6.2],[6.2,-6.2],[-6.2,6.2],[6.2,6.2],[-3.2,0],[3.2,0],[0,-3.2],[0,3.2]])pil(cx+dx,cz+dz,PY+ch,PY-.9);
   }else if(t===4){
    // Pasillos estrechos laberínticos: bloques cerámicos en las 4 esquinas formando pasadizos de 5.2 m de ancho y techos bajos
    box('fd',x0,PY-.3,z0,x1,PY,z1,false,null,mid);
    const cw=2.8;
    for(const[bx0,bx1,bz0,bz1]of[
     [x0+.2,cx-cw,z0+.2,cz-cw],[cx+cw,x1-.2,z0+.2,cz-cw],
     [x0+.2,cx-cw,cz+cw,z1-.2],[cx+cw,x1-.2,cz+cw,z1-.2]
    ]){
     box('w',bx0,PY,bz0,bx1,PY+ch,bz1,true,null,mid);
     col_(bx0-.08,bx1+.08,bz0-.08,bz1+.08);
    }
    if(hs(i+7,j+13)>.5)pil(cx,cz,PY+ch,PY,.45);
   }else{
    box('fd',x0,PY-.3,z0,x1,PY,z1,false,null,mid);
    if(t===5){
     // Pirámide escalonada de azulejos con baño superior
     box({t:'fd',s:'rim',b:'rim'},cx-3.4,PY-.3,cz-3.4,cx+3.4,PY+1.2,cz+3.4,false,null,mid);
     stp(cx-3.4,cx+3.4,cz-3.4,cz+3.4,PY+1.2);
     for(let s=0;s<4;s++){const sx0=cx-3.4-.45*(s+1),sy=PY+.3*(s+1)-.04;box('rim',sx0,PY-.3,cz-3.4,cx-3.4,sy,cz+3.4,false,null,mid);stp(sx0,cx-3.4,cz-3.4,cz+3.4,sy)}
    }else if(i===5&&j===5){
     // Sala de llegada (0,0): 4 pilares en esquina y reborde de agua ornamental sutil en el perímetro
     for(const[px,pz]of[[-5.8,-5.8],[5.8,-5.8],[-5.8,5.8],[5.8,5.8]])pil(cx+px,cz+pz,PY+ch,PY,.62);
    }else if(!(i===5&&j===4)&&hs(i+9,j+3)>.60&&!(i>0&&i<N-1&&j>0&&j<N-1&&hs(i+47,j+83)>.82)){
     pil(cx,cz,PY+ch,PY,.58);
    }
    if(t===0&&!(i===5&&j===5)&&!(i===5&&j===4)&&hs(i+31,j+19)>.72){
     // Escaleras monumentales imposibles que suben hacia el techo o pared ciega
     for(let st=0;st<10;st++){const xx=x0+1.6+st*.6,yy=PY+.16+st*.26;mbox(xx,PY,cz-1.6,xx+.68,yy+.26,cz+1.6,[.88,.91,.90]);stp(xx,xx+.68,cz-1.6,cz+1.6,yy+.26)}
    }
   }

   // Techo: tragaluz abierto o paneles luminosos empotrados
   if(sk){
    buildSkylight(x0,x1,z0,z1,cx,cz,ch,(i===5&&j===5)?3.8:3.1,hs(i+3,j+9)>.45,mid);
   }else{
    box('c',x0,PY+ch,z0,x1,PY+ch+.3,z1,false,null,mid);
    for(let q=0;q<2;q++){
     const lx=x0+CW*(q?.7:.3),ly=PY+ch-.08,g=grpOf(...chunkOf(cx,cz),'l'),hx=1.7,hz=.55,c0=hs(i*13+q,j*7+3),dead=c0>.96,flick=!dead&&c0>.89,base=dead?[.22,.26,.28]:[1.0,.99,.92],st=g.p.length/3;
     quad(g,[lx-hx,ly-.012,cz-hz],[lx+hx,ly-.012,cz-hz],[lx+hx,ly-.012,cz+hz],[lx-hx,ly-.012,cz+hz],0,-1,0,[[0,0],[1,0],[1,1],[0,1]],base);
     mbox(lx-hx-.1,ly,cz-hz-.1,lx+hx+.1,ly+.1,cz+hz+.1,[.82,.86,.86]);
     FXS.push({x:lx,y:PY+ch-.35,z:cz,col:q?0xfff6e0:0xecfaff,int:dead?0:1.25,sky:false,f:1,dead,flick,ck:chunkOf(cx,cz),st,base,pt:0,on:1});
    }
   }
  }

  // Paredes y arcos entre celdas (se omiten dentro de mega-atrios y galerías!)
  for(let i=0;i<=N;i++)for(let j=0;j<N;j++){
   if(i>0&&i<N){const m1=macroId(i-1,j),m2=macroId(i,j);if(m1&&m1===m2)continue}
   const out=i===0||i===N,xc=O+i*CW,a=O+j*CW,b=a+CW,mid=[xc,(a+b)/2];
   const hL=i>0?roomH(i-1,j):WH,hR=i<N?roomH(i,j):WH,topH=Math.max(hL,hR),minH=Math.min(hL,hR);
   const open=!out&&(hs(i*3+1,j*7+2)>.08||i===5||j===5||(i>0&&macroId(i-1,j))||(i<N&&macroId(i,j)));
   if(!open){box('w',xc-TW/2,PY-3.2,a,xc+TW/2,PY+topH,b,true,null,mid);col_(xc-TW/2-.1,xc+TW/2+.1,a,b)}
   else if(minH<=WH_CORR)archZ(a,b,xc,mid,topH,2.7,1.05,2.35);
   else if(hs(i*11+3,j*5+1)>.62&&hL>=WH&&hR>=WH&&i!==5&&j!==5)twinArchZ(a,b,xc,mid,topH);
   else archZ(a,b,xc,mid,topH,topH>7?5.6:4.8,topH>7?2.1:1.55);
  }
  for(let j=0;j<=N;j++)for(let i=0;i<N;i++){
   if(j>0&&j<N){const m1=macroId(i,j-1),m2=macroId(i,j);if(m1&&m1===m2)continue}
   const out=j===0||j===N,zc=O+j*CW,a=O+i*CW,b=a+CW,mid=[(a+b)/2,zc];
   const hD=j>0?roomH(i,j-1):WH,hU=j<N?roomH(i,j):WH,topH=Math.max(hD,hU),minH=Math.min(hD,hU);
   const open=!out&&(hs(i*5+4,j*3+9)>.08||i===5||j===5||(j>0&&macroId(i,j-1))||(j<N&&macroId(i,j)));
   if(!open){box('w',a,PY-3.2,zc-TW/2,b,PY+topH,zc+TW/2,true,null,mid);col_(a,b,zc-TW/2-.1,zc+TW/2+.1)}
   else if(minH<=WH_CORR)archX(a,b,zc,mid,topH,2.7,1.05,2.35);
   else if(hs(i*7+2,j*13+4)>.62&&hD>=WH&&hU>=WH&&i!==5&&j!==5)twinArchX(a,b,zc,mid,topH);
   else archX(a,b,zc,mid,topH,topH>7?5.6:4.8,topH>7?2.1:1.55);
  }

  // Detalles interiores en salas amplias que no son macro-zonas ni pasillos
  for(let i=1;i<N-1;i++)for(let j=1;j<N-1;j++){
   if(macroId(i,j))continue;
   const x=O+i*CW+CW/2,z=O+j*CW+CW/2,t=ty(i,j),seed=hs(i+47,j+83);
   if(t===0&&seed>.52&&!(i===5&&j===5)&&!(i===5&&j===4)){
    if(seed>.76)archX(x-8.4,x+8.4,z-4.4,[x,z-4.4],WH,4.2,1.5);
    else archZ(z-8.4,z+8.4,x+4.4,[x+4.4,z],WH,4.2,1.5);
   }
   if((t===0||t===3)&&seed>.64&&!(i===5&&j===5)){
    pil(x-7.2,z+6.8,PY+WH,t===3?PY-.9:PY);
    pil(x+7.2,z+6.8,PY+WH,t===3?PY-.9:PY);
   }
  }
  sign(-6.4,PY+2.45,O+5*CW+TW/2+.02,'z+',3);
 }

 function build(){
  if(P.built)return;
  loadLog.state='building';loadLog.started=performance.now();loadLog.ended=0;loadLog.totalMs=0;loadLog.error=null;loadLog.stages=[];
  try{
  const sc=new THREE.Scene();P.scene=sc;
  // Atmósfera Nivel 37: neblina turquesa-niebla luminosa y limpia, nunca cueva oscura
  sc.background=new THREE.Color(0x6398a4);
  sc.fog=new THREE.FogExp2(0x6398a4,.0155);
  let t0=performance.now();geometry();loadMark('geometry_generation',performance.now()-t0,{rooms:N*N});
  t0=performance.now();
  const T={
   f:tileSet({c:[240,244,242],g:[186,200,202],n:8,v:.05,wet:.8,rt:76,rg:180}),
   fw:tileSet({c:[206,236,238],g:[142,188,194],n:8,v:.06,wet:1.2,rt:45,rg:155}),
   pb:tileSet({c:[108,214,226],g:[215,244,248],n:8,v:.08,wet:.4,rt:42,rg:130}),
   rim:tileSet({c:[246,244,236],g:[198,196,184],n:4,v:.04,wet:.4,rt:92,rg:175}),
   w:wallSet(),c:ceilSet()
  };
  const mk=(t,o)=>new THREE.MeshStandardMaterial(Object.assign({map:t.map,bumpMap:t.bump,bumpScale:.75,roughnessMap:t.rough||null,roughness:1,metalness:0},o||{}));
  const M={
   w:mk(T.w,{bumpScale:.85}),fd:mk(T.f),fw:mk(T.fw),pb:mk(T.pb,{bumpScale:.95}),pw:mk(T.pb,{bumpScale:.95}),rim:mk(T.rim),
   c:new THREE.MeshStandardMaterial({map:T.c.map,bumpMap:T.c.bump,bumpScale:.55,roughness:.85,metalness:0}),
   m:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.26,metalness:.55}),
   l:new THREE.MeshBasicMaterial({vertexColors:true}),
   sg:new THREE.MeshStandardMaterial({map:signAtlas(),roughness:.45,metalness:0,emissive:0x1c3a44,emissiveIntensity:.45})
  };
  loadMark('texture_material_setup',performance.now()-t0);
  P.M=M;const meshes=[],chunkMap={};P.chunks=[];t0=performance.now();
  const getChunk=(ci,cj)=>{const kk=keyOf(ci,cj);let ck=chunkMap[kk];if(!ck){ck=chunkMap[kk]={ci,cj,cx:O+(ci*3+1.5)*CW,cz:O+(cj*3+1.5)*CW,meshes:[]};P.chunks.push(ck)}return ck};
  for(const kk in G){const c=G[kk],ck=getChunk(c.ci,c.cj);for(const k in c.g){const g=c.g[k],geo=new THREE.BufferGeometry();
   geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(g.p),3));
   geo.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(g.n),3));
   geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.u),2));
   if(g.c.length)geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(g.c),3));
   geo.computeBoundingSphere();const m=new THREE.Mesh(geo,M[k]);
   m.castShadow=(k==='w'||k==='m'||k==='rim');m.receiveShadow=(k!=='l'&&k!=='c');m.updateMatrix();m.matrixAutoUpdate=false;
   sc.add(m);meshes.push(m);ck.meshes.push(m);g.geo=geo;
  }}
  loadMark('mesh_build',performance.now()-t0,{meshes:meshes.length});t0=performance.now();
  if(CYL.length){
   const cylGeo=new THREE.CylinderGeometry(1,1,1,18,1,false),imPlinth=new THREE.InstancedMesh(cylGeo,M.w,CYL.length),imShaft=new THREE.InstancedMesh(cylGeo,M.w,CYL.length),imCap=new THREE.InstancedMesh(cylGeo,M.w,CYL.length),m4=new THREE.Matrix4(),q4=new THREE.Quaternion(),p3=new THREE.Vector3(),s3=new THREE.Vector3();
   for(let idx=0;idx<CYL.length;idx++){const c=CYL[idx],r=c.r,rc=r*1.26,sh=Math.max(.1,c.top-c.base-.48);
    m4.compose(p3.set(c.x,c.base+.24,c.z),q4,s3.set(rc,.48,rc));imPlinth.setMatrixAt(idx,m4);
    m4.compose(p3.set(c.x,(c.base+.48+c.top)*.5,c.z),q4,s3.set(r,sh,r));imShaft.setMatrixAt(idx,m4);
    m4.compose(p3.set(c.x,c.top-.21,c.z),q4,s3.set(rc,.42,rc));imCap.setMatrixAt(idx,m4);
   }
   for(const im of[imPlinth,imShaft,imCap]){im.instanceMatrix.needsUpdate=true;im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;im.updateMatrix();im.matrixAutoUpdate=false;sc.add(im)}
   P.pillars=[imPlinth,imShaft,imCap];
  }
  loadMark('decor_geometry',performance.now()-t0);t0=performance.now();
  for(const f of FXS)if(!f.sky&&f.ck){f.attr=G[keyOf(f.ck[0],f.ck[1])].g.l.geo.attributes.color}
  for(const k in G)delete G[k];CYL.length=0;

  // Agua cristalina aguamarina + cáusticas luminosas + haces solares agrupados por chunk
  const rip=rippleTex();rip.repeat.set(4,4);P.rip=rip;
  const wm=new THREE.MeshStandardMaterial({color:0x42cedc,transparent:true,opacity:.44,roughness:.05,metalness:.12,normalMap:rip,normalScale:new THREE.Vector2(.45,.45),depthWrite:false});
  const ca=causticTex(),cb=ca.clone();ca.repeat.set(2.5,2.5);cb.repeat.set(3.5,3.5);cb.needsUpdate=true;P.ca=ca;P.cb=cb;
  const cm=[new THREE.MeshBasicMaterial({map:ca,color:0xaef6ff,transparent:true,opacity:.36,blending:THREE.AdditiveBlending,depthWrite:false}),new THREE.MeshBasicMaterial({map:cb,color:0x76e2ef,transparent:true,opacity:.26,blending:THREE.AdditiveBlending,depthWrite:false})];
  const st=shaftTex(),sm=new THREE.MeshBasicMaterial({map:st,color:0xe8fbff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});P.sm=sm;
  const WG={},wGrpOf=(ci,cj,k)=>{const kk=keyOf(ci,cj);let c=WG[kk];if(!c)c=WG[kk]={ci,cj,g:{}};let g=c.g[k];if(!g)g=c.g[k]={p:[],n:[],u:[],c:[]};return g};
  for(const w of WT){
   const[ci,cj]=chunkOf(w[0],w[1]),x0=w[0]-w[2]*.5,x1=w[0]+w[2]*.5,z0=w[1]-w[3]*.5,z1=w[1]+w[3]*.5,wy=PY-.45;
   quad(wGrpOf(ci,cj,'wt'),[x0,wy,z1],[x1,wy,z1],[x1,wy,z0],[x0,wy,z0],0,1,0,[[0,0],[1,0],[1,1],[0,1]]);
   if(w[5]!==3){
    const y0=w[4]+.015,y1=w[4]+.019;
    quad(wGrpOf(ci,cj,'c0'),[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0],0,1,0,[[0,0],[1,0],[1,1],[0,1]]);
    quad(wGrpOf(ci,cj,'c1'),[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0,1,0,[[0,0],[1,0],[1,1],[0,1]]);
   }
  }
  for(const s of SKY){
   const[ci,cj]=chunkOf(s.x,s.z),g=wGrpOf(ci,cj,'sk'),y0=PY,y1=PY+s.h+1.4,hw=(s.w||5.6)*.5;
   quad(g,[s.x-hw,y0,s.z],[s.x+hw,y0,s.z],[s.x+hw,y1,s.z],[s.x-hw,y1,s.z],0,0,1,[[0,0],[1,0],[1,1],[0,1]]);
   quad(g,[s.x,y0,s.z-hw],[s.x,y0,s.z+hw],[s.x,y1,s.z+hw],[s.x,y1,s.z-hw],1,0,0,[[0,0],[1,0],[1,1],[0,1]]);
  }
  const wMats={wt:wm,c0:cm[0],c1:cm[1],sk:sm},wOrders={wt:2,c0:1,c1:1,sk:3};
  for(const kk in WG){const c=WG[kk],ck=getChunk(c.ci,c.cj);for(const k in c.g){const g=c.g[k],geo=new THREE.BufferGeometry();
   geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(g.p),3));
   geo.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(g.n),3));
   geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.u),2));
   geo.computeBoundingSphere();const m=new THREE.Mesh(geo,wMats[k]);m.renderOrder=wOrders[k];if(k==='wt')m.receiveShadow=true;m.updateMatrix();m.matrixAutoUpdate=false;sc.add(m);ck.meshes.push(m);
  }}
  for(const k in WG)delete WG[k];
  loadMark('water_fx',performance.now()-t0);WT.length=0;SKY.length=0;t0=performance.now();

  // Iluminación Nivel 37: luz ambiente celeste-turquesa que llena la cerámica blanca + focos con sombra
  const hm=new THREE.HemisphereLight(0xe4f9ff,0x357c8a,.72);sc.add(hm);P.hm=hm;P.L=[];
  for(let i=0;i<K;i++){const l=new THREE.SpotLight(0xfff6e2,0,40,1.02,.82,1.15);l.castShadow=true;l.shadow.mapSize.set(touch?256:512,touch?256:512);l.shadow.camera.near=.4;l.shadow.camera.far=40;l.shadow.bias=-.0006;l.shadow.normalBias=.04;sc.add(l,l.target);P.L.push({l,fx:-1})}

  const NDU=touch?55:130,dp=new Float32Array(NDU*3);for(let i=0;i<NDU*3;i++)dp[i]=(Math.random()*2-1)*(i%3===1?2.6:19);P.du=dp;const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
  const du=new THREE.Points(dg,new THREE.PointsMaterial({size:.055,color:0xf2fdff,transparent:true,opacity:.32,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));du.frustumCulled=false;sc.add(du);P.dust=du;P.dg=dg;
  loadMark('lighting_fx',performance.now()-t0);
  P.built=true;P.shOn=typeof R!=='undefined'?R.shadowMap.enabled:true;loadLog.state='built';loadLog.ended=performance.now();loadLog.totalMs=+(loadLog.ended-loadLog.started).toFixed(2);loadLog.resources={
   geometries:R&&R.info&&R.info.memory?R.info.memory.geometries:null,
   textures:R&&R.info&&R.info.memory?R.info.memory.textures:null,
   programs:R&&R.info&&R.info.programs?R.info.programs.length:null
  };loadMark('build_complete',loadLog.totalMs,loadLog.resources);
  }catch(err){loadLog.state='error';loadLog.ended=performance.now();loadLog.totalMs=+(loadLog.ended-loadLog.started).toFixed(2);loadLog.error=String(err&&err.message||err);throw err}
 }

 function warmup(){
  if(!P.scene||typeof R==='undefined'||!cam)return;
  const t0=performance.now();
  try{
   const save={x:cam.position.x,y:cam.position.y,z:cam.position.z,rx:cam.rotation.x,ry:cam.rotation.y,rz:cam.rotation.z,far:cam.far,near:cam.near};
   cam.position.set(0,PY+2.6,0);cam.near=.05;cam.far=500;cam.lookAt(0,PY+2.5,1);cam.updateProjectionMatrix();
   try{if(R.compile)R.compile(P.scene,cam)}catch(e){}
   R.shadowMap.needsUpdate=true;
   let rt=null;
   try{rt=new THREE.WebGLRenderTarget(24,24,{depthBuffer:true,stencilBuffer:false});R.setRenderTarget(rt);R.render(P.scene,cam)}finally{if(R.setRenderTarget)R.setRenderTarget(null);if(rt&&rt.dispose)rt.dispose()}
   cam.position.set(save.x,save.y,save.z);cam.rotation.set(save.rx,save.ry,save.rz);cam.near=save.near;cam.far=save.far;cam.updateProjectionMatrix();
   loadMark('gpu_warmup',performance.now()-t0,{target:'24x24'});
  }catch(e){
   try{R.setRenderTarget(null)}catch(_){}
   loadMark('gpu_warmup',performance.now()-t0,{error:String(e&&e.message||e)});
  }
 }

 // ---------- Altura del suelo y colisiones (fiel a atrios escalonados, galerías y piscinas)
 const fy0=(x,z)=>{
  const i=Math.floor((x-O)/CW),j=Math.floor((z-O)/CW);
  if(i<0||j<0||i>=N||j>=N)return PY;
  const at=atriumId(i,j);
  if(at){
   const acx=at==='NW'?O+3*CW:O+8*CW,acz=at==='NW'?O+3*CW:O+8*CW;
   const dx=Math.abs(x-acx),dz=Math.abs(z-acz),I=10,hw=CW-I; // 14 m radio interno de la piscina del atrio
   const d=Math.min(hw-dx,hw-dz);
   return d<=0?PY:d<1.15?PY-.38:d<2.30?PY-.76:d<3.45?PY-1.14:PY-1.65;
  }
  const g=galleryId(i,j);
  if(g==='GW'||g==='GN')return PY-.9;
  if(g==='GE'){
   const x0=O+6*CW,x1=O+8*CW,z0=O+5*CW,z1=O+6*CW,d=Math.min(x-(x0+3.5),(x1-3.5)-x,z-(z0+4.2),(z1-4.2)-z);
   return d<=0?PY:d<1.15?PY-.38:d<2.30?PY-.76:d<3.45?PY-1.14:PY-1.75;
  }
  const k=ty(i,j),lx=x-(O+i*CW),lz=z-(O+j*CW);
  if(k===1||k===2){
   const ins=INS[k],d=Math.min(lx-ins,CW-ins-lx,lz-ins,CW-ins-lz);
   if(d<=0)return PY;
   if(d<1.15)return PY-.38;
   if(d<2.30)return PY-.76;
   if(d<3.45&&DEP[k]>1.5)return PY-1.14;
   return PY-DEP[k];
  }
  if(k===3)return PY-.9;
  if(k===5&&Math.abs(lz-12)<3.4){
   const dx=lx-12;if(Math.abs(dx)<3.4)return PY+1.2;
   const d=-3.4-dx;if(d>0&&d<1.8)return PY+1.16-.3*Math.floor(d/.45);
  }
  return PY;
 };
 const fyAt=(x,z)=>{let f=fy0(x,z);for(const s of STP)if(x>=s[0]&&x<=s[1]&&z>=s[2]&&z<=s[3]&&s[4]>f&&s[4]<=curY+.6)f=s[4];return f};
 const hit=(x,z)=>{for(const b of CB)if(x>b[0]-.36&&x<b[1]+.36&&z>b[2]-.36&&z<b[3]+.36)return true;for(const s of STP)if(s[4]>curY+.6&&x>s[0]-.36&&x<s[1]+.36&&z>s[2]-.36&&z<s[3]+.36)return true;return false};

 // ---------- Transición y botón de salida
 const fd=document.createElement('div');fd.style.cssText='position:fixed;inset:0;background:#0a2228;opacity:0;pointer-events:none;z-index:9';document.body.appendChild(fd);
 const flash=(dark)=>{fd.style.background=dark?'#0a2228':'#e9fffb';fd.style.transition='none';fd.style.opacity=1;requestAnimationFrame(()=>requestAnimationFrame(()=>{fd.style.transition='opacity '+(dark?1.8:1.2)+'s';fd.style.opacity=0}))};
 const eb=document.createElement('button');eb.textContent='Salir de los Poolrooms';eb.style.cssText='position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:8;display:none;width:auto;padding:10px 16px;font-size:13px;background:rgba(16,32,38,.78);border:1px solid rgba(185,238,245,.28);color:#f0fafb';document.body.appendChild(eb);

 // ---------- Sonido ambiente (eco cavernoso de atrio, rumor de agua, goteo estéreo)
 const A={nodes:null,drip:0,step:0,lx:0,lz:0,gt:0,offTimer:0},PRV=.15;
 function ambOn(){
  const C=AU.ctx;if(!C||A.nodes||!AU.nb)return;
  if(A.offTimer){clearTimeout(A.offTimer);A.offTimer=0}
  const g=C.createGain(),sm=C.createBiquadFilter(),echo=C.createDelay(1),fb=C.createGain(),wet=C.createGain();g.gain.value=0;
  sm.type='lowpass';sm.frequency.value=1650;sm.Q.value=.3;g.connect(sm);sm.connect(C.destination);
  echo.delayTime.value=.34;fb.gain.value=.25;wet.gain.value=.19;sm.connect(echo);echo.connect(fb);fb.connect(echo);echo.connect(wet);wet.connect(C.destination);
  const o1=C.createOscillator(),o2=C.createOscillator(),og=C.createGain();o1.type='sine';o1.frequency.value=50;o2.type='sine';o2.frequency.value=100.4;og.gain.value=.0045;o1.connect(og);o2.connect(og);og.connect(g);o1.start();o2.start();
  const ns=C.createBufferSource(),nf=C.createBiquadFilter(),ng=C.createGain(),lf=C.createOscillator(),lg=C.createGain(),lq=C.createGain();ns.buffer=AU.nb;ns.loop=true;nf.type='lowpass';nf.frequency.value=320;ng.gain.value=.16;ns.connect(nf);nf.connect(ng);ng.connect(g);
  lf.type='sine';lf.frequency.value=.06;lg.gain.value=.04;lq.gain.value=48;lf.connect(lg);lg.connect(ng.gain);lf.connect(lq);lq.connect(nf.frequency);lf.start();ns.start();
  A.nodes={g,sm,echo,fb,wet,o1,o2,ns,lf};A.gt=0;g.gain.setTargetAtTime(AU.on&&S.on?PRV:0,C.currentTime,1.5);
 }
 function ambOff(){
  const C=AU.ctx;if(!A.nodes||!C)return;const n=A.nodes;A.nodes=null;n.g.gain.setTargetAtTime(0,C.currentTime,.3);
  if(A.offTimer)clearTimeout(A.offTimer);
  A.offTimer=setTimeout(()=>{A.offTimer=0;try{n.o1.stop();n.o2.stop();n.ns.stop();n.lf.stop();n.g.disconnect();n.sm.disconnect();n.echo.disconnect();n.fb.disconnect();n.wet.disconnect()}catch(e){typeof __bw==='function'&&__bw('18-poolrooms#1',e)}},1200);
 }
 function dripSnd(){
  const C=AU.ctx;if(!C||!AU.on||!P.on||!S.on||document.hidden||window.__boisGuideOverlayOpen||window.__boisEmojiOpen)return;
  const f=1150+Math.random()*950,t=C.currentTime,pan=C.createStereoPanner?C.createStereoPanner():null,out=C.createGain(),lp=C.createBiquadFilter();
  lp.type='lowpass';lp.frequency.value=2600;out.gain.value=1;
  if(pan){pan.pan.value=Math.random()*1.4-.7;lp.connect(out);out.connect(pan);pan.connect(C.destination)}else{lp.connect(out);out.connect(C.destination)}
  for(let k=0;k<2;k++){
   const o=C.createOscillator(),g=C.createGain();o.type='sine';o.frequency.setValueAtTime(f*(1-k*.04),t+k*.28);o.frequency.exponentialRampToValueAtTime(f*.55,t+k*.28+.09);
   g.gain.setValueAtTime(.0001,t+k*.28);g.gain.exponentialRampToValueAtTime(.026/(1+k*1.9),t+k*.28+.006);g.gain.exponentialRampToValueAtTime(.0001,t+k*.28+.15);
   o.connect(g);g.connect(lp);o.start(t+k*.28);o.stop(t+k*.28+.18);
   if(k===1)o.onended=()=>{try{lp.disconnect();out.disconnect();if(pan)pan.disconnect()}catch(e){typeof __bw==='function'&&__bw('18-poolrooms#2',e)}};
  }
 }

 // ---------- Iluminación dinámica sin asignaciones por cuadro (top-K con histéresis)
 const _topD=new Float64Array(K),_topI=new Int32Array(K),_keep=new Uint8Array(K),_taken=new Uint8Array(K);
 function lights(force){
  const px=S.x,pz=S.z;
  for(let i=0;i<K;i++){_topD[i]=1e18;_topI[i]=-1;_keep[i]=0;_taken[i]=0}
  for(let i=0;i<FXS.length;i++){
   const f=FXS[i],dx=f.x-px,dz=f.z-pz,d=dx*dx+dz*dz+(f.dead?1e5:0);
   if(d>=_topD[K-1])continue;
   let p=K-1;while(p>0&&d<_topD[p-1]){_topD[p]=_topD[p-1];_topI[p]=_topI[p-1];p--}_topD[p]=d;_topI[p]=i;
  }
  let changed=!!force;
  for(let j=0;j<P.L.length;j++){const L=P.L[j];if(L.fx<0)continue;for(let i=0;i<K;i++)if(_topI[i]===L.fx){_keep[j]=1;_taken[i]=1;break}}
  let ti=0;
  for(let j=0;j<P.L.length;j++){
   if(_keep[j])continue;
   while(ti<K&&(_taken[ti]||_topI[ti]<0))ti++;
   const L=P.L[j];
   if(ti>=K){if(L.fx!==-1){L.fx=-1;L.l.intensity=0;changed=true}continue}
   const fi=_topI[ti++];_taken[ti-1]=1;L.fx=fi;const f=FXS[fi];
   L.l.position.set(f.x,f.y,f.z);L.l.target.position.set(f.x,PY-1,f.z);L.l.color.setHex(f.col);L.l.angle=f.sky?1.12:1.0;changed=true;
  }
  if(changed)R.shadowMap.needsUpdate=true;
 }
 function cullChunks(){const px=S.x,pz=S.z,R2=168*168;for(let i=0;i<P.chunks.length;i++){const c=P.chunks[i],dx=c.cx-px,dz=c.cz-pz,vis=(dx*dx+dz*dz)<R2;for(let j=0;j<c.meshes.length;j++)if(c.meshes[j].visible!==vis)c.meshes[j].visible=vis}}
 const setPanel=(f,k)=>{if(!f.attr)return;const a=f.attr.array,s=f.st*3,b=f.base;for(let i=0;i<6;i++){a[s+i*3]=b[0]*k;a[s+i*3+1]=b[1]*k;a[s+i*3+2]=b[2]*k}f.attr.needsUpdate=true};

 let lt_=0,tt_=0;
 P.upd=dt=>{
  tt_+=dt;lt_-=dt;
  if(P.shOn!==R.shadowMap.enabled){P.shOn=R.shadowMap.enabled;P.scene.traverse(o=>{const m=o.material;if(!m)return;const ms=Array.isArray(m)?m:[m];for(const mat of ms)if(mat&&!mat.isMeshBasicMaterial)mat.needsUpdate=true});for(const L of P.L)L.l.castShadow=P.shOn;lights(true)}
  if(lt_<=0){lt_=.35;lights(false);cullChunks()}
  for(const f of FXS){if(f.dead||f.sky||!f.flick)continue;f.pt-=dt;if(f.pt<=0){const burst=Math.random()<.35;f.on=burst?(Math.random()<.5?0:1):(Math.random()<.9?1:0);f.pt=burst?.03+Math.random()*.09:.4+Math.random()*3.5;setPanel(f,f.on?1:.22)}f.f=f.on?1:.08}
  for(const L of P.L){if(L.fx<0)continue;const f=FXS[L.fx];L.l.intensity=f.dead?0:f.int*(f.sky?(1+.04*Math.sin(tt_*.6)):f.f)}
  P.rip.offset.x+=dt*.012;P.rip.offset.y+=dt*.006;P.ca.offset.x+=dt*.02;P.ca.offset.y+=dt*.013;P.cb.offset.x-=dt*.015;P.cb.offset.y+=dt*.019;P.sm.opacity=.19+.04*Math.sin(tt_*.5);
  const dp=P.du,cx=S.x,cz=S.z;for(let i=0;i<dp.length/3;i++){let x=dp[i*3]+Math.sin(tt_*.3+i)*.05*dt*10,y=dp[i*3+1]-.03*dt*10,z=dp[i*3+2]+Math.cos(tt_*.27+i*1.3)*.05*dt*10;if(y<-.4)y=WH-.6;if(x>19)x-=38;else if(x<-19)x+=38;if(z>19)z-=38;else if(z<-19)z+=38;dp[i*3]=x;dp[i*3+1]=y;dp[i*3+2]=z}
  P.dust.position.set(cx,PY+.3,cz);P.dg.attributes.position.needsUpdate=true;
  const muted=document.hidden||!!window.__boisGuideOverlayOpen||!!window.__boisEmojiOpen;
  if(AU.ctx&&AU.on&&!muted){if(!A.nodes)ambOn();A.drip-=dt;if(A.drip<=0){A.drip=2.4+Math.random()*5.6;dripSnd()}}
  if(A.nodes&&AU.ctx){A.gt-=dt;if(A.gt<=0){A.gt=.25;const duck=(typeof CIN!=='undefined'&&CIN&&CIN.on)?.45:1;A.nodes.g.gain.setTargetAtTime(AU.on&&S.on&&!muted?PRV*duck:0,AU.ctx.currentTime,.35)}}
  const mv=Math.hypot(S.x-A.lx,S.z-A.lz);A.lx=S.x;A.lz=S.z;A.step+=mv;
  if(A.step>1.9){A.step=0;const wet=fyAt(S.x,S.z)<PY-.44;if(wet){auHit(900,.26,.06,'bandpass');auHit(2800,.1,.015,'highpass')}else auHit(520,.14,.07,'lowpass')}
 };

 let preloadQueued=false,preloadStarted=false;
 P.preload=(opts)=>{
  opts=opts||{};
  if(P.built){loadLog.state='ready';return Promise.resolve(loadLog)}
  if(P.loadPromise)return P.loadPromise;
  P.loadState='queued';preloadQueued=true;
  P.loadPromise=new Promise((resolve,reject)=>{
   const run=()=>{preloadQueued=false;if(P.built){P.loadState='ready';resolve(loadLog);return}if(preloadStarted)return;preloadStarted=true;P.loadState='building';try{
    build();
    try{if(typeof window.__prInit==='function')window.__prInit(P.scene)}catch(e){__bw('18-poolrooms#preload-medusa',e)}
    try{if(typeof window.__boisCh5Preload==='function')window.__boisCh5Preload()}catch(e){__bw('18-poolrooms#preload-ch5',e)}
    try{if(typeof window.__boisEmojiPreload==='function')window.__boisEmojiPreload()}catch(e){__bw('18-poolrooms#preload-emoji',e)}
    warmup();
    loadLog.ended=performance.now();loadLog.totalMs=+(loadLog.ended-loadLog.started).toFixed(2);loadLog.state='ready';
    loadLog.resources={
      geometries:R&&R.info&&R.info.memory?R.info.memory.geometries:null,
      textures:R&&R.info&&R.info.memory?R.info.memory.textures:null,
      programs:R&&R.info&&R.info.programs?R.info.programs.length:null
    };
    loadMark('complete',loadLog.totalMs,loadLog.resources);
    P.loadState='ready';resolve(loadLog);
   }catch(e){preloadStarted=false;P.loadState='error';loadLog.state='error';loadLog.error=String(e&&e.message||e);reject(e)}};
   try{
    if(opts.priority)setTimeout(run,0);
    else if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:1200});
    else setTimeout(run,180);
   }catch(e){setTimeout(run,0)}
  });
  return P.loadPromise;
 };

 P.enter=()=>{
  if(P.on)return;if(!P.built){build()}
  window.__boisSitting=false;for(const k in keys)keys[k]=0;jumpQ=false;
  P.on=true;P.ret=[S.x,S.z];S.x=0;S.z=0;S.y=PY+.02;S.vy=0;S.sw=false;S.fly=false;A.lx=S.x;A.lz=S.z;A.step=0;
  try{if(typeof window.__prInit==='function')window.__prInit(P.scene);if(typeof window.__boisCh5Preload==='function')window.__boisCh5Preload();if(typeof window.__boisEmojiPreload==='function')window.__boisEmojiPreload()}catch(e){typeof __bw==='function'&&__bw('18-poolrooms#enter-init',e)}
  cam.far=115;cam.updateProjectionMatrix();eb.style.display='block';flash(true);
  try{if(AU.wg&&AU.ctx)AU.wg.gain.setTargetAtTime(0,AU.ctx.currentTime,.12);if(AU.wf&&AU.ctx)AU.wf.frequency.setTargetAtTime(180,AU.ctx.currentTime,.2)}catch(e){typeof __bw==='function'&&__bw('18-poolrooms#3',e)}
  showMsg('🏊 Nivel 37 · Poolrooms · silencio, eco y galerías infinitas · Retroceso para salir');
  cullChunks();lights(true);
 };

 P.exit=()=>{
  if(!P.on)return;P.on=false;S.x=P.ret[0];S.z=P.ret[1];S.y=WL-1.6;S.vy=0;S.sw=true;
  cam.far=2600;cam.updateProjectionMatrix();eb.style.display='none';flash(false);showMsg('De vuelta en el lago');ambOff();
  try{window.__boisCh5Exit&&window.__boisCh5Exit();window.__boisEmojiExit&&window.__boisEmojiExit()}catch(e){typeof __bw==='function'&&__bw('18-poolrooms#5',e)}
  try{if(AU.wg&&AU.ctx)AU.wg.gain.setTargetAtTime(0,AU.ctx.currentTime,.35)}catch(e){typeof __bw==='function'&&__bw('18-poolrooms#4',e)}
 };

 P.step=dt=>{
  curY=S.y;const sp=(keys.ShiftLeft?7.2:4.3)*(fyAt(S.x,S.z)<PY-.44?.72:1);
  let fx=window.__boisSitting?0:(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-jv.y,sx=window.__boisSitting?0:(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+jv.x;
  const L=Math.hypot(fx,sx);if(L>1){fx/=L;sx/=L}
  const sn=Math.sin(S.yaw),cs=Math.cos(S.yaw),vx=(-sn*fx+cs*sx)*sp*dt,vz=(-cs*fx-sn*sx)*sp*dt;
  if(!hit(S.x+vx,S.z))S.x+=vx;if(!hit(S.x,S.z+vz))S.z+=vz;
  const f=fyAt(S.x,S.z);if(jumpQ&&S.y<=f+.05)S.vy=6.5;jumpQ=false;
  if(S.y<f-.01&&S.vy<=0)S.y+=(f-S.y)*Math.min(1,dt*10);else{S.vy-=22*dt;S.y+=S.vy*dt;if(S.y<=f){S.y=f;S.vy=0}}
  if(P.built)P.upd(dt);
 };

 eb.onclick=()=>P.exit();
 addEventListener('keydown',e=>{if(e.code==='Backspace'&&P.on){e.preventDefault();P.exit()}});
 P.geo={O,CW,N,PY,WH,ty,fyAt,hit,CB};return P;
})();
