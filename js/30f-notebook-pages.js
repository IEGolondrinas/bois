/* BOIS.IO · 30f-notebook-pages.js — Páginas de la libreta con fechas reales (idea 5)
   Se muestran en el diario (J), ordenadas por fecha. Cada una se desbloquea con la historia (cond) y avisa una vez.
   Para cambiar textos o fechas edita NTB_PAGES. La última página usa la fecha real del sistema.
   v177 · CÁPSULAS DEL TIEMPO: una página con from:'AAAA-MM-DD' solo se abre cuando la fecha real del dispositivo llega a ese día
   (y desde entonces queda abierta). Con sealed:true, antes de esa fecha la libreta muestra «Cápsula sellada · se abre el …» sin revelar el texto.
   Las cápsulas usan sort entre 3.8 y 99 (en orden de fecha); la página final «hoy» tiene sort 100 para quedar siempre al final. */
function ntbToday(){const d=new Date(),z=n=>(n<10?'0':'')+n;return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())}
function ntbReached(p){return !p.from||ntbToday()>=p.from}
function ntbOpen(p){try{return ntbReached(p)&&!!p.cond()}catch(e){return false}}
function ntbFromLabel(p){try{const a=p.from.split('-');return new Date(+a[0],+a[1]-1,+a[2]).toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}catch(e){return p.from}}
const NTB_PAGES=[
 {id:'grad',date:'Un descanso de décimo',sort:0.2,cond:()=>!!STORY.flags.photo_bleachers,
  t:'Con Steven podía hablar horas de gameplays. Cuando no estaba, me sentaba en las graderías a mirar el horizonte. Pensé que estaba solo; ahora creo que solo estaba quieto, y que ese también era un buen lugar para estar.'},
 {id:'prof',date:'Antes del examen',sort:0.4,cond:()=>!!STORY.flags.ch4_complete,
  t:'Una profesora estuvo pendiente de mí sin que nadie se lo pidiera. No se lo dije como debía. Si algún día vuelvo a ese pasillo, empiezo por ahí: gracias.'},
 {id:'sep',date:'Septiembre de 2025',sort:1,cond:()=>(typeof bgCollected==='function'?bgCollected():0)>=3,
  t:'Hoy cerré una historia. No hubo pelea: solo acepté que terminó de otro modo del que yo esperaba. Y empecé a fijarme en alguien que quizás siempre estuvo ahí, amable, y yo sin mirar bien.'},
 {id:'oct',date:'29 de octubre de 2025 · Cátedra de Paz',sort:2,cond:()=>!!STORY.flags.ch5_complete||!!STORY.flags.photo_empty,
  t:'Actividad «Sé algo bueno de ti». Yo escribí sobre mí: bueno para las matemáticas, muy analítico, hiper-empático. Y Katherin escribió cinco cosas: inteligente, linda persona, reservado, amable y enfocado. Me temblaban las piernas y me sudaba la frente. No sabía que alguien podía mirar lo que yo no medía con notas.'},
 {id:'nov1',date:'1 de noviembre de 2025 · Posdata de 2026',sort:2.6,cond:()=>!!STORY.flags.photo_rain||!!STORY.flags.ch4_complete,
  t:'Ese día terminé la mezcla a las 10:41, la envié y presté mi computador. El grupo mandó un audio agradeciendo a «Toro», y horas después igual sentí que solo valía si lograba algo. Hoy lo leo distinto: no sería justo juzgar al chico de 16 años con las herramientas que he construido después. Confundía interpretaciones con hechos. Estaba aprendiendo a vivir.'},
 {id:'nov',date:'5 de noviembre de 2025',sort:3,cond:()=>!!STORY.flags.ch4_complete,
  t:'Hoy volvió a sentarse frente a mí. Se acomodó el cabello hacia atrás y quedó tan cerca que no supe dónde poner los ojos. Desde fuera no pasó nada. Para mí pasó todo. Cuando falta, la clase se siente rara.'},
 {id:'ago',date:'10 de agosto de 2025 · 382 en el ICFES',sort:0.5,cond:()=>!!STORY.flags.ch4_complete||!!STORY.flags.photo_path,
  t:'Terminé antes que casi todos y me dijeron que salió bien: 382. Lo guardo como lo que es: una fotografía de un día, no la medida completa de quién soy.'},
 {id:'ano',date:'1 de noviembre de 2026',sort:3.5,cond:()=>!!STORY.flags.ch6_complete,
  t:'Por fin pasó un año. Sigo aquí, mirando el lago, y esta vez no hace falta que nadie vuelva para que yo empiece.'},
 {id:'ch7',date:'2 de noviembre de 2026',sort:3.7,cond:()=>!!STORY.flags.ch7_complete,
  t:'Hablé con ella sin buscar una respuesta. Llevaba tanto tiempo ensayando conversaciones que nunca ocurrieron que olvidé escuchar la que sí estaba pasando. No quiero esperar a que alguien vuelva para empezar. Por primera vez, el momento no tuvo que durar para siempre.'},
 {id:'presencia',date:'Epílogo · Presencia frente al lago',sort:3.75,cond:()=>!!STORY.flags.ch7_presencia,
  t:'Por unos segundos dejé de preguntarme qué significaba cada detalle. Miré el viento sobre el agua, los árboles y el reflejo quieto de las torres. Solo estaba ahí. Quizá eso también cuenta como recordar.'},
 {id:'cap20261122',date:'22 de noviembre de 2026',from:'2026-11-22',sort:3.8,cond:()=>!!STORY.flags.gotNb,
  t:'Ya se cumple un año desde aquel momento en que escribí esas palabras tan profundas y significativas, dándole palabras a lo que llevaba dentro. Aunque nunca envié la carta, sí fue real lo que sentí.<br><br>Quiero decirte, yo del futuro, que si lees esto espero que las condiciones hayan cambiado y que te hayas atrevido a dar el primer paso cuando alguien te guste, o simplemente sea una persona importante para ti.<br><br>Yo todavía sigo aprendiendo. A veces tiendo a tener altibajos, pero voy en camino a ser tú. Gracias por leer.'},
 {id:'cap20270308',date:'8 de marzo de 2027',from:'2027-03-08',sealed:true,sort:3.9,cond:()=>!!STORY.flags.gotNb,
  t:'Hoy cumples 18. Te escribo desde los 17, con un semestre de Física a cuestas, una libreta dentro de un juego y la costumbre de pensar demasiado. No sé si hoy te sientes más adulto. Yo no creo que uno se vuelva adulto de golpe, sino de a pedacitos.<br><br>Solo te pido tres cosas: que hayas dicho «hola» primero aunque te temblaran las piernas, que no hayas confundido estar ocupado con estar bien, y que hoy, aunque sea un rato, no tengas que demostrar nada. Feliz cumpleaños, yo. Gracias por seguir.'},
 {id:'cap20270810',date:'10 de agosto de 2027',from:'2027-08-10',sealed:true,sort:4.0,cond:()=>!!STORY.flags.gotNb,
  t:'Hace dos años cerré un examen y me dijeron que había salido bien. Lo guardé como lo que era: una fotografía de un día. Hoy espero que lo recuerdes igual, con cariño y sin deberle nada.<br><br>Si últimamente algo te salió mal, acuérdate de que ningún número te escogió: lo hiciste tú, con constancia. Pero la constancia no tiene que ser un castigo. Descansa sin pedir permiso.'},
 {id:'cap20271122',date:'22 de noviembre de 2027',from:'2027-11-22',sealed:true,sort:4.05,cond:()=>!!STORY.flags.gotNb,
  t:'Un año después de la última carta, hoy te hago preguntas. No son un examen y nadie las califica: respóndelas despacio, en voz baja o en papel.<br><br>Esto es lo que sé de mí en noviembre de 2026: estudio Física, pero me intriga la psicología. Extraño caminar por un campus. Tengo un amigo con quien las conversaciones fluyen. Hace casi un año empecé a hacer ejercicio. Mi hermana pequeña todavía me dice «mira» cuando quiere que la vea. Y sigo construyendo este lugar para no olvidarme.<br><br>Ahora tú: ¿sigues con Física, o encontraste otra manera de usar tu curiosidad? ¿Quién es hoy tu mejor amigo, y cuándo fue la última vez que se lo dijiste? ¿Alguien te gustó y diste el primer paso, aunque saliera mal? ¿Qué aprendiste que no venía en ningún libro? ¿Qué te pesaba hoy y ya no te pesa? Y la última: ¿qué le preguntarías tú al yo de dentro de diez años?'},
 {id:'cap20290308',date:'8 de marzo de 2029',from:'2029-03-08',sealed:true,sort:4.1,cond:()=>!!STORY.flags.gotNb,
  t:'Veinte años. Hoy tu hermana ya no tiene seis; espero que la hayas mirado cada vez que te dijo «mira», aunque fuera un nivel pequeño de un juego pequeño.<br><br>Ojalá hayas aprendido a ser principiante sin sentir que perdías algo, a pedir ayuda sin pedir perdón, y a dejar que otros cargaran su parte del trabajo. Si todavía abres este juego, mira cuánto cambió el lago. Si ya casi no lo abres, también está bien: significa que has estado afuera, viviendo.'},
 {id:'cap20340308',date:'8 de marzo de 2034',from:'2034-03-08',sealed:true,sort:4.2,cond:()=>!!STORY.flags.gotNb,
  t:'Veinticinco años. Para mí, desde aquí, es difícil imaginarte; supongo que eso significa que la historia siguió sin mí, y eso me alegra.<br><br>No voy a preguntarte qué lograste. Quiero saber otra cosa: ¿tienes alguien con quien compartir silencios? ¿Sigues mirando el horizonte de vez en cuando? ¿Te acuerdas de reír como en las graderías? Si algo de esto falta, todavía hay tiempo. Y si ya lo tienes, cuídalo, que a mí me costó imaginarlo.<br><br>No tenías que resolver toda tu vida para permitirte vivirla. Gracias por llegar hasta aquí.'},
 {id:'hoy',date:null,sort:100,cond:()=>!!STORY.flags.ch7_complete,
  t:'Si estás leyendo esto, significa que volviste, miraste con calma y te permitiste cerrar el círculo. No tenías que resolver toda tu vida para empezar a vivirla.'}
];
const NTB_REPLIES_KEY='bois_notebook_replies';
function ntbEsc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function ntbLoadReplies(){try{if(typeof localStorage==='undefined')return{};const o=JSON.parse(localStorage.getItem(NTB_REPLIES_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch(e){return{}}}
function ntbSaveReply(id,text){try{const clean=String(text||'').trim().slice(0,1200);if(!clean||typeof localStorage==='undefined')return false;const all=ntbLoadReplies(),list=Array.isArray(all[id])?all[id]:[];const now=new Date();let date='';try{date=now.toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}catch(e){date=ntbToday()}list.push({id:'r_'+now.getTime().toString(36)+'_'+Math.random().toString(36).slice(2,5),date,ts:now.getTime(),text:clean});all[id]=list.slice(-30);localStorage.setItem(NTB_REPLIES_KEY,JSON.stringify(all));if(typeof window.__boisMarkBackupDirty==='function')window.__boisMarkBackupDirty();return true}catch(e){return false}}
function ntbDeleteReply(id,rid){try{if(typeof localStorage==='undefined')return false;const all=ntbLoadReplies();if(!Array.isArray(all[id]))return false;all[id]=all[id].filter(r=>r&&r.id!==rid);if(!all[id].length)delete all[id];localStorage.setItem(NTB_REPLIES_KEY,JSON.stringify(all));return true}catch(e){return false}}
window.__boisNtbSaveReply=ntbSaveReply;window.__boisNtbDeleteReply=ntbDeleteReply;window.__boisNtbEditing=null;
function ntbRepliesBlock(id,all,btnLabel){
  const list=Array.isArray(all[id])?all[id]:[];
  const ed=window.__boisNtbEditing===id;
  let s='';
  if(list.length){
    s+=list.map(r=>'<div style="margin:7px 0 0 12px;padding:7px 10px;background:rgba(200,185,142,.08);border-left:2px solid #9ec2ad"><span class="bgMuted" style="font-style:italic">Escrito el '+ntbEsc(r.date)+'</span><button type="button" data-ntb-del="'+ntbEsc(id)+'" data-ntb-rid="'+ntbEsc(r.id)+'" style="float:right;background:transparent;border:none;color:#a59d8d;font:11px system-ui;cursor:pointer;padding:0">Borrar</button><br><span style="color:#e7e1d1;white-space:pre-wrap">'+ntbEsc(r.text)+'</span></div>').join('');
  }
  if(ed){
    s+='<div style="margin:8px 0 0 12px"><textarea data-ntb-input="'+ntbEsc(id)+'" rows="3" maxlength="1200" placeholder="Escríbele algo a tu yo de aquel momento o al de mañana…" style="width:100%;box-sizing:border-box;background:rgba(0,0,0,.35);border:1px solid rgba(200,185,142,.4);color:#eee9dd;padding:8px;font:13px/1.5 Georgia,serif;resize:vertical"></textarea><div style="display:flex;gap:8px;margin-top:6px"><button type="button" data-ntb-save="'+ntbEsc(id)+'" style="padding:5px 11px;background:rgba(200,185,142,.18);border:1px solid rgba(200,185,142,.55);color:#f3ecdc;font:11px system-ui;cursor:pointer">Guardar respuesta</button><button type="button" data-ntb-cancel="1" style="padding:5px 11px;background:transparent;border:1px solid #ffffff30;color:#c9c2b1;font:11px system-ui;cursor:pointer">Cancelar</button></div></div>';
  }else if(typeof document!=='undefined'){
    s+='<div style="margin:6px 0 0 12px"><button type="button" data-ntb-reply="'+ntbEsc(id)+'" style="padding:4px 9px;background:transparent;border:1px solid rgba(200,185,142,.35);color:#d7cbb0;font:11px system-ui;cursor:pointer">'+ntbEsc(btnLabel)+'</button></div>';
  }
  return s;
}
function ntbDate(p){if(p.date)return p.date;try{return new Date().toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}catch(e){return 'Hoy'}}
function ntbVoiceStage(){
  try{
    const F=(typeof STORY!=='undefined'&&STORY.flags)||{};
    const n=typeof bgCollected==='function'?bgCollected():0;
    if(F.ch7_presencia)return {label:'Dejo de buscar una respuesta',note:'Por unos segundos dejé de analizar cada gesto. Estar presente frente al lago también cuenta como recordar.'};
    if(F.ch7_complete)return {label:'Distingo hechos de interpretaciones',note:'Ya puedo separar lo que ocurrió, lo que pensé en 2025 y lo que simplemente no puedo saber.'};
    if(F.ch6_complete)return {label:'Observo las versiones de mí mismo',note:'El inteligente, el útil, el reservado, el que quiere pertenecer: ninguna etiqueta aislada me resume.'};
    if(F.ch5_complete)return {label:'Entro en lo que sentía',note:'Lo que guardaba por dentro tenía eco, no señales ocultas.'};
    if(F.ch4_complete)return {label:'Recuerdo quién era',note:'Un día real: 06:30 en el bus, la pizarra, los suecos y la espera de las 15:43 a las 16:12. Estabas aprendiendo a vivir.'};
    if(F.metKatherin||n>=6)return {label:'Intento entender a los demás',note:'Todavía busco sentido en los silencios ajenos, aunque ya sé que nadie puede leer la mente de otro.'};
    if(n>=1)return {label:'Quiero recordar',note:'Vuelven escenas sueltas de la isla, pero hechos e interpretaciones todavía se sienten mezclados.'};
    return {label:'No recuerdo',note:'Solo sé que guardé esta libreta porque algo de aquella época merecía ser mirado con calma.'};
  }catch(e){return {label:'No recuerdo',note:''}}
}
function ntbPagesHTML(){
  const ok=NTB_PAGES.filter(ntbOpen).sort((a,b)=>a.sort-b.sort);
  const sealed=NTB_PAGES.filter(p=>p.sealed&&p.from&&!ntbReached(p)).sort((a,b)=>a.from<b.from?-1:1);
  const all=ntbLoadReplies();
  const vs=ntbVoiceStage();
  let h='<div class="bgBlock"><strong>Libreta · «'+ntbEsc(vs.label)+'»</strong>';
  if(vs.note)h+='<p class="bgMuted" style="margin:4px 0 8px;font-style:italic">'+ntbEsc(vs.note)+'</p>';
  if(window.__boisSpecialDate)h+='<p style="border-left:2px solid #e4b66f;padding:6px 10px;margin:10px 0;background:rgba(228,182,111,.08);color:#f0dec0">✨ '+ntbEsc(window.__boisSpecialDate.wish)+'</p>';
  if(!ok.length)h+='<p class="bgMuted">La libreta tiene páginas en blanco. Se irán escribiendo a medida que recuerdes.</p>';
  else h+=ok.map(p=>'<div style="border-left:2px solid #c8b98e;padding-left:10px;margin:12px 0"><p style="margin:0"><span class="bgMuted" style="font-style:italic">'+ntbDate(p)+'</span><br>'+p.t+'</p>'+(p.from?ntbRepliesBlock(p.id,all,'Responder a esta carta'):'')+'</div>').join('');
  if(sealed.length)h+=sealed.map(p=>'<p class="bgMuted" style="margin:12px 0">🔒 Cápsula sellada · se abre el '+ntbFromLabel(p)+'</p>').join('');
  if(STORY.flags&&STORY.flags.gotNb&&typeof document!=='undefined'){
    h+='<div style="margin-top:16px;padding-top:12px;border-top:1px dashed rgba(200,185,142,.24)"><strong style="font-size:13px">Páginas libres · para volver cuando quieras</strong><p class="bgMuted" style="margin:4px 0 8px">Escribe cómo estás hoy o deja un mensaje para la próxima vez que regreses a la isla.</p>'+ntbRepliesBlock('free',all,'Escribir en página libre')+'</div>';
  }
  return h+'</div>';
}
function __ntbTick(){try{
  if(!STORY.flags.gotNb||!S.on||CIN.on)return;
  for(const p of NTB_PAGES){if(STORY.flags['ntb_'+p.id]||!ntbOpen(p))continue;storyFlag('ntb_'+p.id,1);showMsg(p.from?'Se abrió una cápsula del tiempo en la libreta · J':'Se escribió una página nueva en la libreta · J');break}
}catch(e){typeof __bw==='function'&&__bw('30f-notebook-pages#1',e)}}
window.__boisNtbTick=__ntbTick;
try{if(!window.__boisMainLoopUnified)setInterval(__ntbTick,1500)}catch(e){console.warn('Libreta:',e)}
