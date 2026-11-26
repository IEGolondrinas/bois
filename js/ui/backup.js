/* BOIS.IO · ui/backup.js — Copia de seguridad del progreso (v171)
   Exportar: descarga bois_progreso_AAAA-MM-DD.json con la historia, los ajustes, lo explorado y la posición.
   Importar: valida el archivo, lo guarda y recarga el juego. Claves en BK_KEYS. */
(()=>{
 const BK_KEYS=['bois_story','bois_cfg','bois_explored','bois_pos','bois_dev_points','bois_user_photos','bois_notebook_replies','bois_future_monument','bois_time_meta'];

 // v179: valida la forma de cada clave; lo que no cuadra se descarta (se restaura el valor por defecto) en vez de guardarse dañado.
 const bkJ=v=>{try{return JSON.parse(v)}catch(e){return undefined}};
 // v190: cada punto debe ser un objeto con x/z numéricos acotados; se conservan solo campos conocidos (máx. 500 puntos).
 const bkPoints=a=>(Array.isArray(a)?a:[]).filter(p=>p&&typeof p==='object'&&!Array.isArray(p)&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<=520&&Math.abs(p.z)<=520).slice(0,500).map(p=>({name:String(typeof p.name==='string'?p.name:'').slice(0,48),x:p.x,y:Number.isFinite(p.y)?p.y:0,z:p.z,yaw:Number.isFinite(p.yaw)?p.yaw:0,date:typeof p.date==='string'?p.date.slice(0,40):''}));
 const bkUserPhotos=a=>(Array.isArray(a)?a:[]).filter(p=>p&&typeof p==='object'&&!Array.isArray(p)&&typeof p.img==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.img)&&p.img.length<450000).slice(0,30).map(p=>({id:String(typeof p.id==='string'?p.id:'').slice(0,40),img:p.img,place:String(typeof p.place==='string'?p.place:'En la isla').slice(0,80),mood:String(typeof p.mood==='string'?p.mood:'').slice(0,60),date:String(typeof p.date==='string'?p.date:'').slice(0,48),ts:Number.isFinite(p.ts)?p.ts:0,note:String(typeof p.note==='string'?p.note:'').slice(0,120)}));
 const bkReplies=o=>{const out={};if(!o||typeof o!=='object'||Array.isArray(o))return out;for(const k of Object.keys(o).slice(0,24)){if(!/^[a-zA-Z0-9_]{1,32}$/.test(k)||!Array.isArray(o[k]))continue;const list=o[k].filter(r=>r&&typeof r==='object'&&!Array.isArray(r)&&typeof r.text==='string'&&r.text.trim()).slice(-30).map(r=>({id:String(typeof r.id==='string'?r.id:'').slice(0,32),date:String(typeof r.date==='string'?r.date:'').slice(0,48),ts:Number.isFinite(r.ts)?r.ts:0,text:r.text.trim().slice(0,1200)}));if(list.length)out[k]=list}return out};
 const bkMonument=o=>{if(!o||typeof o!=='object'||Array.isArray(o))return null;return{photoId:String(typeof o.photoId==='string'?o.photoId:'').slice(0,40),caption:String(typeof o.caption==='string'?o.caption:'').slice(0,140),date:String(typeof o.date==='string'?o.date:'').slice(0,48)}};
 window.__bkPoints=bkPoints;
 const bkOk={
  bois_story:v=>{const o=bkJ(v);return !!o&&typeof o.flags==='object'&&!Array.isArray(o.flags)},
  bois_cfg:v=>{const o=bkJ(v);return !!o&&typeof o==='object'&&!Array.isArray(o)&&(o.mu===undefined||typeof o.mu==='boolean')&&(o.au===undefined||typeof o.au==='boolean')&&(o.q===undefined||Number.isInteger(o.q)&&o.q>=0&&o.q<=9)&&(o.s===undefined||Number.isFinite(o.s)&&o.s>0&&o.s<10)&&(o.v===undefined||Number.isFinite(o.v)&&o.v>=0&&o.v<=1)&&(o.hb===undefined||typeof o.hb==='boolean')&&(o.iy===undefined||typeof o.iy==='boolean')},
  bois_pos:v=>{const o=bkJ(v);return !!o&&Number.isFinite(o.x)&&Number.isFinite(o.z)&&Math.abs(o.x)<=520&&Math.abs(o.z)<=520&&(o.yaw===undefined||Number.isFinite(o.yaw))},
  bois_explored:v=>/^[01]{2500}$/.test(v),
  bois_dev_points:v=>Array.isArray(bkJ(v)),
  bois_user_photos:v=>Array.isArray(bkJ(v)),
  bois_notebook_replies:v=>{const o=bkJ(v);return !!o&&typeof o==='object'&&!Array.isArray(o)},
  bois_future_monument:v=>{const o=bkJ(v);return !!o&&typeof o==='object'&&!Array.isArray(o)},
  bois_time_meta:v=>{const o=bkJ(v);return !!o&&typeof o==='object'&&!Array.isArray(o)&&Number.isFinite(o.firstVisitTs)}
 };
 const bkClean=d=>{const out={};for(const k of BK_KEYS){const lim=k==='bois_user_photos'?6e6:2e6;if(typeof d[k]==='string'&&d[k].length<lim&&bkOk[k](d[k]))out[k]=k==='bois_dev_points'?JSON.stringify(bkPoints(bkJ(d[k]))):k==='bois_user_photos'?JSON.stringify(bkUserPhotos(bkJ(d[k]))):k==='bois_notebook_replies'?JSON.stringify(bkReplies(bkJ(d[k]))):k==='bois_future_monument'?JSON.stringify(bkMonument(bkJ(d[k]))):d[k]}return out};
 window.__bkClean=bkClean;
 const $=id=>document.getElementById(id),msg=t=>{const m=$('bkMsg');if(m)m.textContent=t};
 const ex=$('bkExport'),im=$('bkImport'),fi=$('bkFile');if(!ex||!im||!fi)return;
 ex.addEventListener('click',()=>{try{
  const data={};for(const k of BK_KEYS){const v=localStorage.getItem(k);if(v!==null)data[k]=v}
  if(!data.bois_story&&!data.bois_user_photos&&!data.bois_notebook_replies){msg('Todavía no hay progreso que guardar.');return}
  const blob=new Blob([JSON.stringify({juego:'BOIS.IO',version:1,fecha:new Date().toISOString(),datos:data})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bois_progreso_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);if(typeof window.__boisMarkBackupClean==='function')window.__boisMarkBackupClean();msg('Progreso exportado.')
 }catch(e){msg('No se pudo exportar.');console.warn('Copia de seguridad:',e)}});
 im.addEventListener('click',()=>fi.click());
 fi.addEventListener('change',()=>{const f=fi.files&&fi.files[0];fi.value='';if(!f)return;
  const r=new FileReader();r.onerror=()=>msg('No se pudo leer el archivo.');
  r.onload=()=>{try{
   const o=JSON.parse(r.result);if(!o||o.juego!=='BOIS.IO'||!o.datos||typeof o.datos!=='object')throw 0;
   const st=JSON.parse(o.datos.bois_story||'null');if(!st||typeof st.flags!=='object'||Array.isArray(st.flags))throw 0;
   const ok=bkClean(o.datos);
   if(!confirm('Esto reemplazará tu progreso actual por el del archivo. ¿Continuar?'))return;
   try{localStorage.removeItem('bois_story_bak')}catch(e){}
   for(const k of BK_KEYS){if(typeof ok[k]==='string')localStorage.setItem(k,ok[k]);else localStorage.removeItem(k)}
   msg('Progreso importado. Recargando…');setTimeout(()=>location.reload(),600)
  }catch(e){msg('Ese archivo no es una copia válida de BOIS.IO.')}};
  r.readAsText(f)});
})();
