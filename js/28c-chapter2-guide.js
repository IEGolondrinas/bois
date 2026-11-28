/* BOIS.IO · 28c-chapter2-guide.js — Guía del Capítulo II (v133)
   Tras el despertar (Capítulo I) enseña al jugador qué hacer (buscar las fotografías) y los controles clave (M mapa, J diario…).
   No bloquea el juego: es una tarjeta que avanza sola o cuando el jugador hace lo que se le pide. Enter la omite. Se guarda en el flag ch2_intro. */
const CH2G={el:null,i:-1,t:0,idle:0,seen:false,timer:null,on:false};
function ch2gKey(k){if(touch){return{E:'<b>Interactuar</b>',M:'<b>Mapa</b>',J:'<b>Diario</b>',P:'<b>📷</b>',V:'<b>Álbum</b>'}[k]||k}return'<kbd>'+k+'</kbd>'}
function ch2gSteps(){const k=ch2gKey;return[
 {tag:'CAPÍTULO II · OBJETIVO',h:'Encuentra las <b>6 fotografías</b> escondidas en la isla.',s:'Cada una completa un vacío de la cámara y despierta un recuerdo. Están lejos unas de otras; puedes ir a pie o en tu auto. Cuando una brille, acércate y pulsa '+k('E')+'.',ms:11000},
 {tag:'MAPA',h:touch?'Abre el '+k('M')+' (botón de abajo).':'Pulsa '+k('M')+' para abrir el mapa.',s:'Se va revelando a medida que exploras. Las zonas punteadas con «?» indican dónde buscar la siguiente fotografía.',open:'map',to:40000},
 {tag:'DIARIO',h:touch?'Abre el '+k('J')+'.':'Pulsa '+k('J')+' para abrir el diario.',s:'Guarda tus pistas, las páginas de la libreta y las fotografías recuperadas. Léelo cuando no sepas hacia dónde ir.',open:'journal',to:40000},
 {tag:'CONTROLES',h:touch?'Joystick para moverte · deslizar para mirar.':'<kbd>W A S D</kbd> moverte · <kbd>Shift</kbd> correr · <kbd>Espacio</kbd> saltar',s:touch?'Botones: '+k('E')+' objetos y auto · '+k('P')+' fotografiar · '+k('V')+' álbum de la cámara.':k('E')+' interactuar o subir al auto · '+k('R')+' radio · '+k('P')+' fotografiar · '+k('V')+' álbum · '+k('N')+' sonido. Todo queda en el diario (J).',ms:13500}
]}
function ch2gUI(){if(CH2G.el)return;const st=document.createElement('style');st.textContent='#ch2g{position:fixed;left:50%;top:max(96px,calc(env(safe-area-inset-top) + 88px));transform:translate(-50%,-6px);z-index:7;width:min(430px,92vw);padding:13px 17px 15px;background:rgba(10,16,19,.86);border:1px solid rgba(232,220,190,.28);color:#eee9dd;font:14px/1.5 Georgia,serif;opacity:0;pointer-events:none;transition:opacity .45s,transform .45s}#ch2g.on{opacity:1;transform:translate(-50%,0)}#ch2g small{display:block;color:#c8b98e;font:10px system-ui;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px}#ch2g p{margin:6px 0 0;color:#c5c1b5;font-size:12.5px}#ch2g kbd{display:inline-block;min-width:20px;padding:1px 7px;margin:0 1px;border:1px solid #e4b66f;border-bottom-width:3px;border-radius:4px;color:#f3dfae;font:600 12px system-ui;text-align:center}#ch2g i{display:block;height:2px;margin-top:10px;background:linear-gradient(90deg,#e4b66f var(--p,0%),#ffffff22 0)}#ch2g em{display:block;margin-top:7px;color:#8f9a95;font:10px system-ui;letter-spacing:1px;font-style:normal}';document.head.appendChild(st);const d=document.createElement('div');d.id='ch2g';document.body.appendChild(d);CH2G.el=d}
const ch2gEsc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function ch2gShow(){const st=ch2gSteps()[CH2G.i];if(!st){ch2gEnd();return}CH2G.t=0;CH2G.seen=false;const n=ch2gSteps().length;CH2G.el.innerHTML='<small>'+ch2gEsc(st.tag)+' · '+(CH2G.i+1)+'/'+n+'</small><div>'+st.h+'</div><p>'+st.s+'</p><i></i>'+(touch?'':'<em>ENTER · OMITIR GUÍA</em>');CH2G.el.classList.add('on')}
function ch2gEnd(){CH2G.on=false;CH2G.i=-1;if(CH2G.timer){clearInterval(CH2G.timer);CH2G.timer=null}if(CH2G.el)CH2G.el.classList.remove('on');storyFlag('ch2_intro',1)}
function ch2gStart(){ch2gUI();CH2G.on=true;CH2G.i=0;ch2gShow()}
function ch2gTick(){if(document.hidden)return;
 try{const F=STORY.flags;if(F.ch2_intro){if(CH2G.timer){clearInterval(CH2G.timer);CH2G.timer=null}return}if(!F.gotCam||!F.gotNb||!F.ch1_vista)return;
  const busy=!S.on||CIN.on||(typeof PR!=='undefined'&&PR.on)||(typeof CAR!=='undefined'&&CAR.on)||(typeof camAlbum!=='undefined'&&camAlbum.style.display!=='none');
  if(!CH2G.on){
   if(typeof bgCollected==='function'&&bgCollected()>0){storyFlag('ch2_intro',1);return} // partida avanzada: no repetir
   CH2G.idle=busy?0:CH2G.idle+.25;if(CH2G.idle>=2.5)ch2gStart();return}
  if(busy){CH2G.el.classList.remove('on');return}
  const st=ch2gSteps()[CH2G.i];if(!st)return;
  if(st.open){ // espera a que el jugador abra y vuelva a cerrar el panel (o a que pase el tiempo)
   const gOpen=typeof BOIS_GUIDE!=='undefined'&&!!BOIS_GUIDE[st.open];
   if(gOpen)CH2G.seen=true;
   if(!gOpen&&(window.__boisGuideOverlayOpen)){return}
   CH2G.el.classList.add('on');CH2G.t+=.25;
   if(CH2G.seen&&!gOpen){CH2G.i++;ch2gShow();return}
   if(CH2G.t*1000>=st.to){CH2G.i++;ch2gShow()}
   CH2G.el.querySelector('i').style.setProperty('--p',Math.min(100,CH2G.t*1000/st.to*100)+'%');return}
  CH2G.el.classList.add('on');CH2G.t+=.25;CH2G.el.querySelector('i').style.setProperty('--p',Math.min(100,CH2G.t*1000/st.ms*100)+'%');
  if(CH2G.t*1000>=st.ms){CH2G.i++;ch2gShow()}
 }catch(e){if(!window.__ch2gWarn){window.__ch2gWarn=1;console.warn('ch2g',e)}}}
addEventListener('keydown',e=>{if(e.code==='Enter'&&CH2G.on&&S.on){ch2gEnd();showMsg('Guía omitida · pulsa J para releer los controles')}});
CH2G.timer=setInterval(ch2gTick,250);
