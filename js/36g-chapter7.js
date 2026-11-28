/* BOIS.IO · 36g-chapter7.js — Capítulo VII · La diferencia entre saber y creer
   Requiere: capítulo VI completado (ch6_complete). Katherin espera en su banca del Parque de los Cisnes, junto al lago.
   Flujo: acércate a ella (E) → una sola conversación lineal, sin elecciones → capítulo completado y apertura del Epílogo (Presencia).
   Banderas guardadas: ch7_complete (y ch7_started por si se cierra a medias). */
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
 const Lyr=(layer,t,p,stamp)=>[stamp?{layer,stamp,t}:{layer,t},{pause:p||2200}];
 function script(){
  const L=[{pause:800}];
  L.push(...N('Dejas atrás las torres. Aquí, junto al lago, nadie te pide una respuesta.',2200));
  L.push(...N('Katherin está en su banca. No dice nada por un instante.',2200));
  L.push(...Y('¿Por qué siempre apareces cuando estoy a punto de recordar algo?',2200));
  L.push(...Kt('Porque siempre estás a punto de recordar algo.',2300));
  L.push(...Y('Pasé meses intentando leer tus silencios como si escondieran una respuesta exacta.',2400));
  L.push(...Kt('¿Y qué encontraste?',2100));
  L.push(...Lyr('hecho','Katherin dijo que prefería no cambiar de pareja en el ensayo por temas logísticos. En la habitación de Valeria apenas dijo un «hola» suave.',2700,'01 / 11 / 2025 · ENSAYO'));
  L.push(...Lyr('pensaste','«Me está rechazando.» Miraste tus zapatos girando la llave entre los dedos.',2500));
  L.push(...Lyr('hoy','No sé qué pensaba ella ese día. Solo sé lo que sentía yo.',2600,'LO QUE PUEDES SABER HOY'));
  L.push(...Kt('A veces yo simplemente estaba cansada, o distraída.',2600));
  L.push(...N('No buscas más explicaciones. El agua devuelve el cielo tal como está.',2400));
  L.push(...Y('Es fácil juzgar desde lejos al chico de 16 años y preguntarle por qué no dijo más.',2500));
  L.push(...Y('Pero fue al ensayo, hizo la mezcla, prestó su computador y siguió adelante.',2800));
  if(FL().ch6_vacio)L.push(...N('Piensas en el nicho vacío de la torre. Un espacio sin llenar que, aun así, ya no te asusta.',3000));
  L.push(...Y('Tal vez nunca sepa qué significó todo aquello para ella…',2300));
  L.push(...Y('Pero sí sé cuánto significó para mí. Y eso es suficiente.',2700));
  L.push(...Kt('¿Y qué vas a hacer ahora?',2200));
  L.push(...Y('Dejar de esperar una señal en el pasado para empezar a vivir.',2800));
  L.push(...Y('¿Y tú?',1700));
  L.push(...Kt('Yo también tengo que irme algún día.',2900));
  L.push(...N('No hay despedida dramática. Solo dos personas frente al agua.',2900));
  L.push(...N('Siéntate un momento junto al lago, sin tener que analizar nada.',3400));
  return L}
 // ---------- la escena ----------
 function scene(){
  const g=K7();if(!g)return;
  const look=new THREE.Vector3(g.position.x,g.position.y+1.35,g.position.z);
  storyFlag('ch7_started',1);sting([294],SV*.8,3,0);
  playCinematic(script(),()=>{storyFlag('ch7_complete',1);sting([196,294,392],SV,4,.45);
   showMsg('Capítulo VII completado · Siéntate junto al lago (F) para vivir el Epílogo · Presencia')},{lookAt:look,location:'PARQUE DE LOS CISNES · LA DIFERENCIA ENTRE SABER Y CREER'})}
 // ---------- gancho: E junto a Katherin (el resto del tiempo se conserva su conversación normal) ----------
 const oIK=typeof interactKatherin==='function'?interactKatherin:()=>false;
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
 const oM=typeof bgMission==='function'?bgMission:()=>({title:'Explora la isla',clue:''});bgMission=function(){const f=FL();
  if(f.ch7_complete&&f.ch7_presencia)return{title:'Historia completada · Capítulos I–VII y Presencia',clue:'Estabas aprendiendo a vivir. La isla sigue abierta para pasear, mirar la libreta (J), guardar un recuerdo en el parque o quedarte frente al agua.'};
  if(f.ch7_complete)return{title:'Epílogo · Presencia',clue:'Siéntate en la banca del lago (F) o quédate quieto mirando el agua unos segundos, sin buscar ninguna señal.'};
  if(f.ch6_complete)return{title:'Capítulo VII · La diferencia entre saber y creer',clue:'Katherin te espera en su banca, junto al lago, en el Parque de los Cisnes. Acércate y pulsa E.'};
  return oM()};
 const oT=typeof bgTarget==='function'?bgTarget:()=>null;bgTarget=function(){if(active()&&!(typeof PR!=='undefined'&&PR.on)){const g=K7();if(g)return{name:'Katherin · banca junto al lago',x:g.position.x,z:g.position.z}}return oT()};
 // ---------- herramientas de prueba ----------
 if(window.BOIS_DEV){
 window.__boisCh7Unlock=()=>{storyFlag('ch6_complete',1);delete STORY.flags.ch7_complete;delete STORY.flags.ch7_presencia;saveStory();console.log('Capítulo VI marcado como completado. Ve a la banca de Katherin y pulsa E.')};
 window.__boisCh7Reset=()=>{for(const k of['ch7_started','ch7_complete','ch7_presencia'])delete STORY.flags[k];saveStory();told=false;console.log('Capítulo VII y Epílogo reiniciados.')};
 }
})()}catch(__ch7Err){console.error('Capítulo VII no pudo inicializarse; se conserva el juego base:',__ch7Err)}
