/* v192 · escena del menú: parallax suave, reanudación al volver desde pausa,
   estado de ánimo al pasar el cursor y lectura segura del recuerdo guardado. */
(()=>{
 const ov=document.getElementById('ov'),svg=document.getElementById('menuScene');
 if(!ov||!svg)return;

 // Lectura de solo lectura del progreso guardado para mostrar un indicador sutil en el menú
 const badge=document.getElementById('menuProgressBadge');
 if(badge){
  try{
   let st=(typeof STORY!=='undefined'&&STORY&&STORY.flags)?STORY:null;
   if(!st){
    const raw=localStorage.getItem('bois_story')||localStorage.getItem('bois_story_bak');
    if(raw){const parsed=JSON.parse(raw);if(parsed&&typeof parsed==='object'&&parsed.flags)st=parsed}
   }
   if(st&&st.flags&&typeof st.flags==='object'){
    const f=st.flags;
    const photoKeys=Object.keys(f).filter(k=>k.indexOf('photo_')===0&&k!=='photo_puppy'&&f[k]);
    const photos=Math.min(6,photoKeys.length);
    let label='';
    if(f.ch7_presencia)label='Historia y Epílogo completados · Presencia frente al lago';
    else if(f.ch7_complete)label='Capítulo VII completado · Epílogo de Presencia junto al lago';
    else if(f.ch6_complete)label='Capítulo VII disponible · Lago de los Cisnes';
    else if(f.ch5_complete)label='Capítulo VI · Las torres de cristal';
    else if(f.ch4_complete)label='Capítulo V · Bajo el lago';
    else if(f.metKatherin)label='Capítulo IV · Parque de los Cisnes';
    else if(photos>=6)label='6/6 fotografías · Katherin aguarda en el parque';
    else if(photos>0)label='Capítulo II · '+photos+'/6 fotografías recuperadas';
    else if(f.gotCam||f.gotNb)label='Capítulo I · De regreso en la playa';
    if(label){badge.textContent=label;badge.hidden=false}
   }
  }catch(e){}
 }

 // Atmósfera sutil al señalar botones del menú
 const hoverMap={go:'play',resetProgress:'new',menuHistory:'history'};
 for(const id of Object.keys(hoverMap)){
  const btn=document.getElementById(id);
  if(!btn)continue;
  btn.addEventListener('pointerenter',()=>{ov.dataset.hover=hoverMap[id]});
  btn.addEventListener('pointerleave',()=>{if(ov.dataset.hover===hoverMap[id])delete ov.dataset.hover});
  btn.addEventListener('focus',()=>{ov.dataset.hover=hoverMap[id]});
  btn.addEventListener('blur',()=>{if(ov.dataset.hover===hoverMap[id])delete ov.dataset.hover});
 }

 // Parallax suave en capas con data-depth (respeta reducción de movimiento)
 if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 const layers=[...svg.querySelectorAll('[data-depth]')].map(g=>({g,d:+g.getAttribute('data-depth')||0}));
 let tx=0,ty=0,cx=0,cy=0,raf=0;
 const visible=()=>ov.style.display!=='none'&&!document.hidden;
 const step=()=>{
  raf=0;
  if(!visible())return;
  cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
  for(const l of layers)l.g.style.transform='translate('+(-cx*l.d).toFixed(2)+'px,'+(-cy*l.d*.5).toFixed(2)+'px)';
  if(Math.abs(tx-cx)>.002||Math.abs(ty-cy)>.002)raf=requestAnimationFrame(step);
 };
 const kick=()=>{if(!raf&&visible())raf=requestAnimationFrame(step)};
 window.addEventListener('pointermove',e=>{
  if(!visible())return;
  tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;kick();
 },{passive:true});
 window.addEventListener('deviceorientation',e=>{
  if(!visible()||e.gamma==null)return;
  tx=Math.max(-1,Math.min(1,e.gamma/30));ty=Math.max(-1,Math.min(1,(e.beta-45)/30));kick();
 },{passive:true});
 if(typeof MutationObserver==='function'){
  new MutationObserver(()=>{if(visible())kick()}).observe(ov,{attributes:true,attributeFilter:['style','class']});
 }
})();
