/* BOIS.IO · 30d-emoji.js — «Encuentra el emoji diferente» en los Poolrooms (idea 8)
   Un tablero en los Poolrooms abre una cuadrícula de 7×10 con UN emoji casi idéntico a los demás.
   Opcional (no bloquea la historia). 3 tableros; flag emoji_n. Ajuste: EJ_PAIRS (más parecidos = más difícil). */
const EJ_PAIRS=[['😀','😃'],['🕐','🕜'],['🌕','🌖'],['😄','😁'],['😶','😐'],['🌗','🌓'],['🕓','🕟'],['🙂','☺️']];
const EJ_COLS=7,EJ_ROWS=10;
const ej={board:null,open:false,n:0,t0:0,ans:-1,pair:null,winTimer:0,tx:null,cv:null};
const ejEl=document.createElement('div');ejEl.id='ejOv';
ejEl.style.cssText='position:fixed;inset:0;z-index:31;display:none;align-items:center;justify-content:center;background:rgba(4,10,14,.92);backdrop-filter:blur(6px);color:#e8e2d2;font-family:Georgia,serif;flex-direction:column;gap:12px;padding:12px';
ejEl.innerHTML='<div style="width:min(96vw,520px);padding:16px 14px;background:rgba(12,24,28,.94);border:1px solid rgba(159,232,255,.22);box-shadow:0 18px 60px rgba(0,0,0,.65);display:flex;flex-direction:column;align-items:center;gap:10px"><div id="ejTop" style="font:13px/1.45 system-ui,sans-serif;letter-spacing:.6px;color:#cfe7ea;text-align:center"></div><div id="ejGrid" style="display:grid;grid-template-columns:repeat('+EJ_COLS+',1fr);gap:3px;width:min(90vw,calc(72vh*'+EJ_COLS+'/'+EJ_ROWS+'),460px);user-select:none"></div><div style="display:flex;gap:10px;margin-top:4px"><button id="ejGive" style="padding:7px 14px;background:transparent;color:#e8e2d2;border:1px solid rgba(220,215,195,.35);cursor:pointer;font:12px system-ui">Rendirme</button><button id="ejClose" style="padding:7px 14px;background:transparent;color:#e8e2d2;border:1px solid rgba(220,215,195,.35);cursor:pointer;font:12px system-ui">Cerrar · Esc</button></div></div>';
document.body.appendChild(ejEl);
const ejGrid=ejEl.querySelector('#ejGrid'),ejTop=ejEl.querySelector('#ejTop');
function ejDone(){return STORY.flags.emoji_n||0}
function ejTone(freq,dur,vol){try{const C=AU.ctx;if(!C||!AU.on)return;const o=C.createOscillator(),g=C.createGain(),t=C.currentTime;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(C.destination);o.onended=()=>{try{o.disconnect();g.disconnect()}catch(e){}};o.start(t);o.stop(t+dur+.05)}catch(e){}}
function ejPaintBoard(){
  if(!ej.cv||!ej.tx)return;
  const cx=ej.cv.getContext('2d'),n=ejDone();
  cx.fillStyle='#f2ead6';cx.fillRect(0,0,280,400);
  cx.strokeStyle='rgba(107,74,47,.32)';cx.lineWidth=4;cx.strokeRect(8,8,264,384);
  cx.font='26px sans-serif';cx.textAlign='center';cx.textBaseline='middle';
  for(let i=0;i<EJ_COLS;i++)for(let j=0;j<9;j++)cx.fillText((n>=3&&i===3&&j===4)?'✨':'😀',22+i*39,26+j*37);
  cx.fillStyle='#4b3826';cx.font='bold 15px system-ui,sans-serif';
  cx.fillText(n>=3?'3/3 completados':'Tableros: '+n+'/3',140,378);
  ej.tx.needsUpdate=true;
}
function ejStart(){
  ej.n=ejDone();if(ej.n>=3){ejTop.textContent='Ya encontraste los tres emojis diferentes.';ejGrid.innerHTML='';return}
  ej.pair=EJ_PAIRS[(Math.random()*EJ_PAIRS.length)|0];ej.ans=(Math.random()*EJ_COLS*EJ_ROWS)|0;ej.t0=performance.now();
  ejTop.textContent='Tablero '+(ej.n+1)+'/3 · un emoji es distinto. Sin pistas, sin prisa.';
  let h='';for(let i=0;i<EJ_COLS*EJ_ROWS;i++)h+='<div data-i="'+i+'" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:clamp(16px,min(7.5vw,5vh),32px);cursor:pointer;background:rgba(255,255,255,.045);border-radius:4px;transition:background .15s">'+ej.pair[i===ej.ans?1:0]+'</div>';
  ejGrid.innerHTML=h;
}
function ejShow(){if(ej.open)return;ej.open=true;window.__boisEmojiOpen=true;ejEl.style.display='flex';S.on=false;if(document.pointerLockElement){window.__boisGuideIgnoreNextUnlock=true;document.exitPointerLock?.()}ejStart()}
function ejHide(){if(!ej.open)return;if(ej.winTimer){clearTimeout(ej.winTimer);ej.winTimer=0}ej.open=false;window.__boisEmojiOpen=false;ejEl.style.display='none';S.on=true;if(!touch&&!window.__boisGuideOverlayOpen)document.getElementById('c')?.requestPointerLock?.()}
function ejWin(){
  const n=ejDone()+1,s=Math.round((performance.now()-ej.t0)/1000);storyFlag('emoji_n',n);ejPaintBoard();
  ejTone(523,.18,.04);setTimeout(()=>ejTone(659,.28,.045),110);
  ejTop.textContent='¡Lo encontraste! ('+s+' s)';
  if(ej.winTimer)clearTimeout(ej.winTimer);
  ej.winTimer=setTimeout(()=>{ej.winTimer=0;ejHide();
    if(n>=3){
      const fy=ej.board&&typeof PR!=='undefined'&&PR.geo?PR.geo.fyAt(ej.board.x,ej.board.z):0;
      const look=ej.board?new THREE.Vector3(ej.board.x,fy+1.45,ej.board.z):undefined;
      playCinematic([{t:'Tres tableros, tres diferencias casi invisibles.'},{pause:2200},{t:'Mirar con atención también es una forma de cuidar — igual que quien se fijó en esos detalles tuyos.'},{pause:2800},{t:'Quizás por eso notas lo que otros pasan por alto.'},{pause:2500}],null,look?{lookAt:look,location:'LOS POOLROOMS · ATENCIÓN'}:{location:'LOS POOLROOMS · ATENCIÓN'});
    }
    else showMsg('Tablero '+n+'/3 resuelto · queda otro en los Poolrooms (E)');
  },1300);
}
ejGrid.addEventListener('click',e=>{
  const c=e.target.closest('[data-i]');if(!c||ej.ans<0||ejDone()>=3)return;
  if(+c.dataset.i===ej.ans){c.style.background='rgba(120,220,160,.45)';ej.ans=-1;ejWin()}
  else{ejTone(185,.12,.022);c.style.background='rgba(220,90,90,.35)';setTimeout(()=>{if(c.isConnected)c.style.background='rgba(255,255,255,.045)'},350)}
});
ejEl.querySelector('#ejGive').onclick=()=>{if(ej.ans>=0){const c=ejGrid.children[ej.ans];if(c)c.style.background='rgba(240,200,90,.5)';ejTop.textContent='Era este. Cierra y vuelve a intentarlo cuando quieras.';ej.ans=-1}};
ejEl.querySelector('#ejClose').onclick=ejHide;
document.addEventListener('keydown',e=>{if(ej.open&&e.code==='Escape'){e.preventDefault();e.stopPropagation();ejHide()}});
function ejBuild(){
  if(ej.board||typeof PR==='undefined'||!PR.geo||!PR.scene)return;
  const g=PR.geo,c={i:5,j:4};let x=g.O+c.i*g.CW+g.CW/2,z=g.O+c.j*g.CW+g.CW/2;
  const nearCh5=(px,pz)=>Array.isArray(window.__boisCh5Pts)&&window.__boisCh5Pts.some(p=>Math.hypot(px-p.x,pz-p.z)<6);
  const O=[[0,0],[2.6,0],[-2.6,0],[0,2.6],[0,-2.6],[4,4],[-4,4]];for(const o of O)if(!g.hit(x+o[0],z+o[1])&&!nearCh5(x+o[0],z+o[1])){x+=o[0];z+=o[1];break}
  const fy=g.fyAt(x,z),cv=document.createElement('canvas');cv.width=280;cv.height=400;
  const tx=new THREE.CanvasTexture(cv);tx.encoding=THREE.sRGBEncoding;ej.cv=cv;ej.tx=tx;ejPaintBoard();
  const grp=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:0x6b4a2f,roughness:.85}),legGeo=new THREE.BoxGeometry(.06,.82,.06);
  const pan=new THREE.Mesh(new THREE.PlaneGeometry(.84,1.2),new THREE.MeshBasicMaterial({map:tx}));pan.position.set(0,1.45,.045);
  const bk=new THREE.Mesh(new THREE.BoxGeometry(.94,1.3,.07),wood);bk.position.y=1.45;
  const gl=new THREE.Mesh(new THREE.SphereGeometry(.9,12,10),new THREE.MeshBasicMaterial({color:0xffe3a8,transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false}));gl.position.y=1.45;
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.52,14),new THREE.MeshBasicMaterial({color:0x050b0d,transparent:true,opacity:.32,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.01;
  for(const sx of[-.4,.4]){const l=new THREE.Mesh(legGeo,wood);l.position.set(sx,.4,-.05);grp.add(l)}
  grp.add(sh,bk,pan,gl);grp.position.set(x,fy,z);grp.rotation.y=Math.atan2(g.O+5*g.CW+g.CW/2-x,g.O+5*g.CW+g.CW/2-z);
  grp.traverse(o=>{if(o.isMesh){o.updateMatrix();o.matrixAutoUpdate=false}});grp.updateMatrix();grp.matrixAutoUpdate=false;
  PR.scene.add(grp);g.CB.push([x-.5,x+.5,z-.3,z+.3]);ej.board={x,z,grp};
}
window.__boisEmojiPreload=()=>{try{ejBuild()}catch(e){typeof __bw==='function'&&__bw('30d-emoji#preload',e)}};
window.__boisEmojiExit=()=>{if(ej.open)ejHide();ejNear=false};
function interactEmoji(){
  const b=ej.board;if(!b||!PR.on||!S.on||CIN.on||window.__boisGuideOverlayOpen||ej.open||Math.hypot(S.x-b.x,S.z-b.z)>3)return false;
  ejShow();return true;
}
let ejNear=false;
function __emojiTick(){try{if(document.hidden||ej.open)return;if(!ej.board&&PR.on)ejBuild();const b=ej.board;if(!b||!PR.on||!S.on||CIN.on||window.__boisGuideOverlayOpen){ejNear=false;return}
  const d=Math.hypot(S.x-b.x,S.z-b.z)<3;if(d&&!ejNear)showMsg('Un tablero de emojis · E: observar');ejNear=d}catch(e){typeof __bw==='function'&&__bw('30d-emoji#1',e)}}
window.__boisEmojiTick=__emojiTick;
try{if(!window.__boisMainLoopUnified)setInterval(__emojiTick,400)}catch(e){console.warn('Emoji:',e)}
