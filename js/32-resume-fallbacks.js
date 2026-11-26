/* BOIS.IO · 32-resume-fallbacks.js — Reanudar posición y respaldo si falla un shader
   (líneas 3533–3544 de BOIS_IO_v119_Optimizado.html) */
if(typeof WX!=='undefined'&&WX.st){/* v193: clima automático por defecto (modo 0 = Automático; inicia despejado y cambia solo) */WX.st.mode=0;WX.st.auto=0;WX.st.timer=75;WX.st.rain=0;WX.st.fog=.03;WX.st.sc=0;WX.st.rainT=0;WX.st.fogT=.03;WX.st.scT=0}
// ---- v60: reanudar posición sin brújula ni HUD ----
{let __lastPos='';const __savePos=()=>{try{if(window.__boisResetting||!S.on||S.y<-50)return;if(typeof PR!=='undefined'&&PR.on)return;
  if(Math.abs(S.x)>520||Math.abs(S.z)>520)return;const v=JSON.stringify({x:+S.x.toFixed(1),z:+S.z.toFixed(1),yaw:+S.yaw.toFixed(3)});if(v===__lastPos)return;__lastPos=v;localStorage.setItem('bois_pos',v)}catch(e){typeof __bw==='function'&&__bw('32-resume-fallbacks#1',e)}};setInterval(__savePos,3000);window.__savePos=__savePos;
 try{const p=JSON.parse(localStorage.getItem('bois_pos')||'null');
  if(p&&isFinite(p.x)&&isFinite(p.z)&&Math.abs(p.x)<=520&&Math.abs(p.z)<=520){S.x=p.x;S.z=p.z;S.y=ground(S.x,S.z,300)+1.5;S.vy=0;S.sw=false;if(isFinite(p.yaw))S.yaw=p.yaw}}catch(e){typeof __bw==='function'&&__bw('32-resume-fallbacks#2',e)}}

setTimeout(()=>{try{const bad=()=>R.info.programs.some(p=>p.diagnostics&&p.diagnostics.runnable===false);
 if(bad()){let off=0;for(const k in GM){const m=GM[k];if(m&&m.userData.win){m.onBeforeCompile=function(){};m.needsUpdate=true;off++}}
  const terr=()=>{console.warn('v12: el shader del terreno no compiló; se usa el anterior');TER.m.material=terrMatOld();TER.m.material.needsUpdate=true};
  if(off){console.warn('v59.1: el shader de ventanas no compiló; los edificios se dibujan sin ventanas procedurales');WIN.u.value=0;setTimeout(()=>{try{if(bad())terr()}catch(e){typeof __bw==='function'&&__bw('32-resume-fallbacks#3',e)}},1800)}else terr()}}catch(e){typeof __bw==='function'&&__bw('32-resume-fallbacks#4',e)}},2500);
if($('ld')&&$('ld').firstElementChild)$('ld').firstElementChild.style.width='100%';
