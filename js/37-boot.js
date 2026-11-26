/* BOIS.IO v187 · 37-boot.js — Filtro VHS (F6), pantalla de arranque y primer frame()
   (líneas 3739–3765 de BOIS_IO_v119_Optimizado.html) */
// v60: VHS activado por defecto; F6 permite alternarlo durante la partida.
window.BOIS_VHS_ON=true;
document.addEventListener('keydown',e=>{
 if(e.code==='F6'&&!e.repeat){e.preventDefault();window.BOIS_VHS_ON=!window.BOIS_VHS_ON;
  document.body.classList.toggle('vhs-active',!!(S.on&&window.BOIS_VHS_ON));__boisLastVhsState=!!(S.on&&window.BOIS_VHS_ON);
  if(typeof showMsg==='function')showMsg(window.BOIS_VHS_ON?'Filtro VHS activado · F6 para quitarlo':'Filtro VHS desactivado · F6 para activarlo');}
});
// El arranque solo se declara exitoso después de que el primer frame haya dibujado sin lanzar errores.
// Si falla, se detiene el RAF que frame() ya pudo haber programado y se muestra el panel de error.
if(window.__boisBootFailed){
 window.__boisStopFrameLoop=true;
}else{
 try{
  frame();
  if(!window.__boisBootFailed){
   window.__boisBootReady=true;
   const go=$('go');if(go){go.disabled=true;go.textContent='Preparando Poolrooms…'}
   (async()=>{
    try{
     if(typeof PR!=='undefined'&&PR&&PR.preload)await PR.preload({priority:true});
     window.__boisPoolPreloadReady=true;
    }catch(e){
     window.__boisPoolPreloadReady=true;window.__boisPoolPreloadError=String(e&&e.message||e);console.warn('Poolrooms preload:',e);
    }
    if(!window.__boisBootFailed){
     if(go){go.disabled=false;go.textContent=(()=>{try{return localStorage.getItem('bois_story')||localStorage.getItem('bois_pos')?'Continuar':'Comenzar'}catch(e){return'Comenzar'}})()}
     if($('ld'))$('ld').style.display='none';
    }
   })();
  }else window.__boisStopFrameLoop=true;
 }catch(e){
  window.__boisStopFrameLoop=true;
  reportBootFailure(e);
 }
}
(()=>{
 const screen=document.getElementById('bootScreen'),bar=document.getElementById('bootProgress'),
       pct=document.getElementById('bootPercent'),stage=document.getElementById('bootStage');
 if(!screen||!bar||!pct)return;
 if(window.__boisBootFailed)return;
 const stages=[['Preparando la isla',18],['Mirando el horizonte',38],['Despertando el bosque',58],['Afinando la atmósfera',74],['Preparando los Poolrooms',92],['Todo está listo',100]];
 let n=0;
 const step=()=>{
  if(window.__boisBootFailed)return;
  const [label,target]=stages[n++];
  if(stage)stage.textContent=label;
  bar.style.width=target+'%';pct.textContent=target+'%';
  if(n<stages.length-1){setTimeout(step,170);return}
  const wait=()=>{
   if(window.__boisBootFailed)return;
   if(!window.__boisPoolPreloadReady){setTimeout(wait,70);return}
   const final=stages[stages.length-1];if(stage)stage.textContent=final[0];bar.style.width=final[1]+'%';pct.textContent=final[1]+'%';
   setTimeout(()=>{if(window.__boisBootFailed)return;screen.classList.add('done');setTimeout(()=>screen.remove(),700)},380);
  };
  wait();
 };
 requestAnimationFrame(()=>requestAnimationFrame(step));
})();

