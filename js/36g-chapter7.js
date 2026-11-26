/* BOIS.IO · 36g-chapter7.js — Capítulo VII · Katherin: la conversación que nunca ocurrió
   Requiere: capítulo VI completado (ch6_complete). Katherin espera en su banca del Parque de los Cisnes, junto al lago.
   Flujo: acércate a ella (E) → una sola conversación lineal, sin elecciones → capítulo completado.
   Banderas guardadas: ch7_complete (y ch7_started por si se cierra a medias).
   Texto editable en TXT7 (abajo). El tono sigue docs/Historia_del_juego.md, sección 7. */
try{(()=>{
 const FL=()=>STORY.flags,active=()=>!!FL().ch6_complete&&!FL().ch7_complete;
 const K7=()=>window.__katherin;
 // acento sonoro muy suave (mismo estilo que el capítulo V); se omite si el audio no está activo
 const SV=.03;
 const sting=(freqs,vol,dur,gap)=>{try{const C=AU.ctx;if(!C||!AU.on)return;const t0=C.currentTime;freqs.forEach((f,i)=>{const o=C.createOscillator(),g=C.createGain(),lp=C.createBiquadFilter(),t=t0+i*(gap||.2);
   o.type='sine';o.frequency.value=f;lp.type='lowpass';lp.frequency.value=1800;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
   o.connect(lp);lp.connect(g);g.connect(C.destination);o.onended=()=>{try{o.disconnect();lp.disconnect();g.disconnect()}catch(e){typeof __bw==='function'&&__bw('36g-chapter7#1',e)}};o.start(t);o.stop(t+dur+.1)})}catch(e){typeof __bw==='function'&&__bw('36g-chapter7#2',e)}};
 // ---------- guion (editable) ----------
 const N=(t,p)=>[{t},{pause:p||2000}],Y=(t,p)=>[{who:'Tú',t},{pause:p||1800}],Kt=(t,p)=>[{who:'Katherin',t},{pause:p||2200}];
 function script(){
  const L=[{pause:800}];
  L.push(...N('Dejas atrás las torres. El aire del lago se siente más ancho, más quieto.',2200));
  L.push(...N('Katherin está en su banca. Parece estar esperándote.',2200));
  L.push(...N('Esta vez no hablan de la isla ni de los recuerdos. Hablan de ustedes.',2600));
  L.push(...Y('¿Por qué siempre apareces cuando estoy a punto de recordar algo?',2200));
  L.push(...Kt('Porque siempre estás a punto de recordar algo.',2300));
  L.push(...Y('¿Qué significa eso?',1700));
  L.push(...Kt('Que llevas mucho tiempo buscando una respuesta en lugares donde solamente querías encontrar compañía.',3600));
  L.push(...N('Bajas la mirada. El agua repite el cielo en pedazos pequeños.',2400));
  L.push(...Y('Creo que tuve muchas oportunidades de acercarme a alguien. Pero siempre encontraba una razón para no hacerlo.',3400));
  L.push(...Kt('¿Y ahora te arrepientes?',2000));
  L.push(...Y('No lo sé. A veces pienso en lo que habría pasado.',2600));
  L.push(...N('Katherin observa el lago.',1800));
  L.push(...Kt('¿Y si hubiera pasado algo diferente? ¿Crees que todo habría sido mejor?',3000));
  L.push(...N('No respondes.',2400));
  L.push(...Kt('No puedes saberlo. Solo conoces la historia que imaginaste.',3200));
  L.push(...N('Entonces lo ves. Has construido muchas versiones de cosas que nunca sucedieron: conversaciones que nunca tuvieron lugar, momentos que nunca llegaron, posibilidades que se quedaron suspendidas.',4600));
  if(FL().ch6_vacio)L.push(...N('Piensas en el nicho vacío de la torre. Un espacio sin llenar que, aun así, no te asustó.',3200));
  L.push(...Y('¿Entonces qué debería hacer?',2000));
  L.push(...N('Katherin sonríe ligeramente.',2000));
  L.push(...Kt('No lo sé. Pero no deberías pasar toda tu vida esperando a que alguien vuelva para empezar a vivir.',4200));
  L.push(...Y('¿Y tú?',1700));
  L.push(...Kt('Yo también tengo que irme algún día.',3000));
  L.push(...N('No hay despedida dramática. Solo dos personas sentadas frente al agua.',3000));
  L.push(...N('Por primera vez, no sientes la necesidad de que este momento dure para siempre. Simplemente lo disfrutas.',4200));
  L.push(...N('Miras la orilla, los salones lejanos y el reflejo de las torres sobre el agua. Ahora entiendes qué era esta isla.',4200));
  L.push(...N('No despertaste aquí para resolver un misterio ajeno. Volviste para mirarte sin miedo y soltar lo que ya pesaba demasiado.',4400));
  L.push(...N('La libreta ya no espera respuestas perfectas; solo espacio para lo que decidas vivir desde hoy.',4200));
  return L}
 // ---------- la escena ----------
 function scene(){
  const g=K7();if(!g)return;
  const look=new THREE.Vector3(g.position.x,g.position.y+1.35,g.position.z);
  storyFlag('ch7_started',1);sting([294],SV*.8,3,0);
  playCinematic(script(),()=>{storyFlag('ch7_complete',1);sting([196,294,392],SV,4,.45);
   showMsg('Capítulo VII completado · Has cerrado tu historia en BOIS.IO')},{lookAt:look})}
 // ---------- gancho: E junto a Katherin (el resto del tiempo se conserva su conversación normal) ----------
 const oIK=interactKatherin;
 interactKatherin=function(){
  const g=K7();
  if(active()&&g&&g.visible&&S.on&&!CIN.on&&Math.hypot(S.x-g.position.x,S.z-g.position.z)<=3.5&&!(typeof PR!=='undefined'&&PR.on)){scene();return true}
  return oIK.apply(this,arguments)};
 // aviso al acercarte (la propia Katherin ya muestra «E: hablar»; aquí solo la primera vez por sesión)
 let told=false;
 function __ch7HintTick(){if(told||!active()||!S.on||CIN.on||(typeof PR!=='undefined'&&PR.on))return;const g=K7();
  if(g&&g.visible&&Math.hypot(S.x-g.position.x,S.z-g.position.z)<9){told=true;showMsg('Katherin parece estar esperándote · E: hablar')}}
 window.__boisCh7HintTick=__ch7HintTick;
 if(!window.__boisMainLoopUnified)setInterval(__ch7HintTick,1000);
 // ---------- misión y brújula ----------
 const oM=bgMission;bgMission=function(){const f=FL();
  if(f.ch7_complete)return{title:'Historia completada · Capítulos I–VII',clue:'Has recorrido tus recuerdos de principio a fin. La isla sigue abierta para pasear, conducir, mirar la libreta (J) o descubrir sus secretos.'};
  if(f.ch6_complete)return{title:'Capítulo VII · La conversación que nunca ocurrió',clue:'Katherin te espera en su banca, junto al lago, en el Parque de los Cisnes. Acércate y pulsa E.'};
  return oM()};
 const oT=bgTarget;bgTarget=function(){if(active()&&!(typeof PR!=='undefined'&&PR.on)){const g=K7();if(g)return{name:'Katherin · banca junto al lago',x:g.position.x,z:g.position.z}}return oT()};
 // ---------- herramientas de prueba ----------
 if(window.BOIS_DEV){
 window.__boisCh7Unlock=()=>{storyFlag('ch6_complete',1);delete STORY.flags.ch7_complete;saveStory();console.log('Capítulo VI marcado como completado. Ve a la banca de Katherin y pulsa E.')};
 window.__boisCh7Reset=()=>{for(const k of['ch7_started','ch7_complete'])delete STORY.flags[k];saveStory();told=false;console.log('Capítulo VII reiniciado.')};
 }
})()}catch(__ch7Err){console.error('Capítulo VII no pudo inicializarse; se conserva el juego base:',__ch7Err)}
