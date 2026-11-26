/* BOIS.IO · 05-collision.js — Rejilla de colisión, ground(), blocked()
   (líneas 610–645 de BOIS_IO_v119_Optimizado.html) */
// ---------- collision grid
const CS=8,cells=new Map(),T=[],N3=[];let nt=0;
for(const sub of solid)for(let t=0;t<sub.length;t+=3){
 const a=sub[t]*3,b=sub[t+1]*3,c=sub[t+2]*3;
 const ax=pos[a],ay=pos[a+1],az=pos[a+2],bx=pos[b],by=pos[b+1],bz=pos[b+2],cx=pos[c],cy=pos[c+1],cz=pos[c+2];
 let nx=(by-ay)*(cz-az)-(bz-az)*(cy-ay),ny=(bz-az)*(cx-ax)-(bx-ax)*(cz-az),nz=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
 const l=Math.hypot(nx,ny,nz);if(l<1e-9)continue;nx/=l;ny/=l;nz/=l;
 const x0=Math.min(ax,bx,cx)-.5,x1=Math.max(ax,bx,cx)+.5,z0=Math.min(az,bz,cz)-.5,z1=Math.max(az,bz,cz)+.5;
 const i0=Math.floor(x0/CS),i1=Math.floor(x1/CS),j0=Math.floor(z0/CS),j1=Math.floor(z1/CS);
 if((i1-i0+1)*(j1-j0+1)>300)continue;
 T.push(ax,ay,az,bx,by,bz,cx,cy,cz);N3.push(nx,ny,nz);
 for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=i*4096+j;let L=cells.get(k);if(!L){L=[];cells.set(k,L)}L.push(nt)}
 nt++}
const TA=new Float32Array(T),NA=new Float32Array(N3);
function dsq(px,py,pz,o){const ax=TA[o],ay=TA[o+1],az=TA[o+2],bx=TA[o+3],by=TA[o+4],bz=TA[o+5],cx=TA[o+6],cy=TA[o+7],cz=TA[o+8];
 const abx=bx-ax,aby=by-ay,abz=bz-az,acx=cx-ax,acy=cy-ay,acz=cz-az,apx=px-ax,apy=py-ay,apz=pz-az;
 const d1=abx*apx+aby*apy+abz*apz,d2=acx*apx+acy*apy+acz*apz;let u,v;
 if(d1<=0&&d2<=0){u=0;v=0}else{const bpx=px-bx,bpy=py-by,bpz=pz-bz,d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz;
 if(d3>=0&&d4<=d3){u=1;v=0}else{const vc=d1*d4-d3*d2;
 if(vc<=0&&d1>=0&&d3<=0){v=0;u=d1/(d1-d3)}else{const cpx=px-cx,cpy=py-cy,cpz=pz-cz,d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz;
 if(d6>=0&&d5<=d6){u=0;v=1}else{const vb=d5*d2-d1*d6;
 if(vb<=0&&d2>=0&&d6<=0){u=0;v=d2/(d2-d6)}else{const va=d3*d6-d5*d4;
 if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));u=1-w;v=w}else{const den=1/(va+vb+vc);u=vb*den;v=vc*den}}}}}}
 const qx=ax+abx*u+acx*v-px,qy=ay+aby*u+acy*v-py,qz=az+abz*u+acz*v-pz;return qx*qx+qy*qy+qz*qz}
function ground(x,z,fy){let best=hAt(x,z);const L=cells.get(Math.floor(x/CS)*4096+Math.floor(z/CS));if(!L)return best;
 for(const t of L){const ny=NA[t*3+1];if(Math.abs(ny)<.4)continue;const o=t*9;
  const ax=TA[o],az=TA[o+2],bx=TA[o+3],bz=TA[o+5],cx=TA[o+6],cz=TA[o+8];
  const d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(d)<1e-9)continue;
  const l1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,l2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,l3=1-l1-l2;
  if(l1<-.001||l2<-.001||l3<-.001)continue;
  const y=l1*TA[o+1]+l2*TA[o+4]+l3*TA[o+7];if(y<=fy+.7&&y>best)best=y}
 return best}
const BH=[.8,1.4,1.8];
function blocked(x,y,z){for(const b of AB)if(x>b[0]-.4&&x<b[1]+.4&&z>b[2]-.4&&z<b[3]+.4&&y<b[4]-.3)return true;const r=.38,r2=r*r;if(Math.abs(x)>496||Math.abs(z)>496)return true;const L=cells.get(Math.floor(x/CS)*4096+Math.floor(z/CS));if(!L)return false;
 for(const t of L){if(Math.abs(NA[t*3+1])>.8)continue;for(const h of BH)if(dsq(x,y+h,z,t*9)<r2)return true}return false}
// v55: sistemas de vuelo eliminados.
AP.step=()=>{};AP.cam=()=>{};AP.fly=false;AP.dead=0;AP.lock=false;AP.dmg=null;
