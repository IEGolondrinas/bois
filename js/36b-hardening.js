/* BOIS.IO · 36b-hardening.js (v124) — guardado al salir/ocultar y avisos de contexto WebGL */
{const flush=()=>{if(window.__boisResetting)return;try{window.__saveBoisCfg&&window.__saveBoisCfg();window.__savePos&&window.__savePos();window.__bgFlushExplored&&window.__bgFlushExplored()}catch(e){typeof __bw==='function'&&__bw('36b-hardening#1',e)}};
 addEventListener('pagehide',flush);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
 const cv=R.domElement;
 cv.addEventListener('webglcontextlost',ev=>{try{ev.preventDefault()}catch(e){typeof __bw==='function'&&__bw('36b-hardening#2',e)}try{showMsg('Gráficos pausados: el dispositivo liberó la GPU. Esperando…')}catch(e){typeof __bw==='function'&&__bw('36b-hardening#3',e)}},false);
 cv.addEventListener('webglcontextrestored',()=>{try{showMsg('Gráficos recuperados');idleRendered=false;R.shadowMap.needsUpdate=true}catch(e){typeof __bw==='function'&&__bw('36b-hardening#4',e)}},false)}
