/* BOIS.IO · 37b-debug.js — monitor de rendimiento para desarrollo (F8)
   Lee directamente los bindings globales del juego (R, S, STORY, qi, QS).
   Importante: esos nombres son const/let de scripts clásicos, por lo que no existen como window.R/window.S.
   No altera la lógica del juego: solo observa el estado.
*/
(function(){
 'use strict';
 const D={on:false,el:null,last:performance.now(),frames:0,fps:0,errors:0,raf:0};
 window.BOIS_DEBUG=D;
 const css=`#boisDebug{position:fixed;right:14px;top:14px;z-index:99990;display:none;min-width:235px;max-width:min(330px,calc(100vw - 28px));padding:11px 12px;background:rgba(7,11,14,.92);border:1px solid rgba(207,225,219,.24);box-shadow:0 10px 30px rgba(0,0,0,.28);color:#e8ece8;font:11px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;pointer-events:none}.boisDebugTitle{display:flex;justify-content:space-between;gap:18px;color:#efe5c9;font-weight:700;letter-spacing:.8px;margin-bottom:7px}.boisDebugGrid{display:grid;grid-template-columns:1fr auto;gap:2px 12px}.boisDebugGrid span:nth-child(even){text-align:right;color:#b9d0c8}.boisDebugWarn{color:#e9c68d}.boisDebugBad{color:#ef9e9e}.boisDebugHint{margin-top:7px;padding-top:6px;border-top:1px solid #ffffff18;color:#8f9b98;font-size:9px}`;
 function init(){
  if(D.el)return;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const el=document.createElement('div');el.id='boisDebug';
  el.innerHTML='<div class="boisDebugTitle"><span>BOIS DEBUG</span><span>F8</span></div><div class="boisDebugGrid" id="boisDebugGrid"></div><div class="boisDebugHint">Solo desarrollo · F8 para ocultar</div>';
  document.body.appendChild(el);D.el=el;
 }
 function esc(v){return String(v==null?'—':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
 function num(v,n=1){return Number.isFinite(v)?v.toFixed(n):'—';}
 function getBinding(name){
  try{
   return name==='R'
    ? (typeof R!=='undefined'?R:null)
    : name==='S'
    ? (typeof S!=='undefined'?S:null)
    : name==='STORY'
    ? (typeof STORY!=='undefined'?STORY:null)
    : name==='qi'
    ? (typeof qi!=='undefined'?qi:null)
    : name==='QS'
    ? (typeof QS!=='undefined'?QS:null)
    : null;
  }catch(_){return null}
 }
 function state(){
   const r=getBinding('R'), s=getBinding('S'), st=getBinding('STORY');
   const p=s&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.z)
     ?`(${num(s.x)}, ${num(s.y)}, ${num(s.z)})`:'—';
   const chapter=st&&st.flags
     ?Object.keys(st.flags).filter(k=>/^ch\d+_(complete|started)$/.test(k)&&st.flags[k]).sort((a,b)=>{
        const na=parseInt(a.match(/\d+/)?.[0]||'0',10),nb=parseInt(b.match(/\d+/)?.[0]||'0',10);return na-nb;
      }).pop()||'base':'—';
   const renderInfo=r&&r.info&&r.info.render?r.info.render:null;
   const memInfo=r&&r.info&&r.info.memory?r.info.memory:null;
   const calls=renderInfo&&Number.isFinite(renderInfo.calls)?renderInfo.calls:null;
   const tris=renderInfo&&Number.isFinite(renderInfo.triangles)?renderInfo.triangles:null;
   const geo=memInfo&&Number.isFinite(memInfo.geometries)?memInfo.geometries:null;
   const tex=memInfo&&Number.isFinite(memInfo.textures)?memInfo.textures:null;
   const qIndex=getBinding('qi'), qs=getBinding('QS');
   const quality=Array.isArray(qs)&&Number.isInteger(qIndex)&&qs[qIndex]
     ?qs[qIndex].n:`${Number.isInteger(qIndex)?'Q'+qIndex:'—'}`;
   const rendererName=r&&r.isWebGLRenderer?'WebGLRenderer':r?'Three renderer':'—';
   return {p,chapter,quality,calls,tris,geo,tex,rendererName};
 }
 function render(){
   if(!D.el)return;
   const q=state();
   const rows=[
     ['FPS',num(D.fps,0)],
     ['Render calls',q.calls],
     ['Triangles',q.tris!=null?Number(q.tris).toLocaleString():'—'],
     ['Geometrías',q.geo],
     ['Texturas',q.tex],
     ['Calidad',q.quality],
     ['Capítulo',q.chapter],
     ['Posición',q.p],
     ['Three / renderer',q.rendererName]
   ];
   document.getElementById('boisDebugGrid').innerHTML=rows.map((r,i)=>`<span>${esc(r[0])}</span><span class="${i===0&&D.fps<30?'boisDebugBad':''}">${esc(r[1])}</span>`).join('');
 }
 function loop(t){
  if(!D.on){D.raf=0;return}
  D.frames++;
  if(t-D.last>=500){
   D.fps=D.frames*1000/(t-D.last);D.frames=0;D.last=t;
   render();
  }
  D.raf=requestAnimationFrame(loop);
 }
 function toggle(){
  init();D.on=!D.on;D.el.style.display=D.on?'block':'none';
  if(D.on){D.frames=0;D.last=performance.now();render();if(!D.raf)D.raf=requestAnimationFrame(loop)}
  else if(D.raf){cancelAnimationFrame(D.raf);D.raf=0}
  if(typeof showMsg==='function')showMsg(D.on?'Monitor de rendimiento activado · F8 para ocultarlo':'Monitor de rendimiento oculto · F8 para mostrarlo');
 }
 window.addEventListener('error',()=>{D.errors++;if(D.on)render()});
 window.addEventListener('unhandledrejection',()=>{D.errors++;if(D.on)render()});
 document.addEventListener('keydown',e=>{if(window.BOIS_DEV===false)return;if(e.code==='F8'&&!e.repeat){e.preventDefault();toggle();}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
