/* BOIS.IO · 29-awakening-init.js — Escena del despertar e inicio de partida
   (líneas 3093–3165 de BOIS_IO_v119_Optimizado.html) */
function startAwakeningLegacy(){
  S.x=BEACH[0];S.z=BEACH[1];S.y=ground(S.x,S.z,300)+1.5;S.yaw=0.4;S.pitch=0.15;
  storyFlag('awake',1);
  window.__boisWakePending=false;
  playCinematic([
    {t:'...'},
    {t:'El sonido de las olas llega primero.'},
    {t:'La luz se abre paso entre tus párpados. La imagen todavía está borrosa.'},
    {t:'Abres los ojos. Arena bajo las manos. Cielo encima.'},
    {t:'No recuerdas cómo regresaste a esta orilla, pero algo dentro de ti reconoce el lugar.'},
    {t:'Solo el viento, el agua y el eco de tu propia respiración.'},
    {t:'A lo lejos, la isla. Bosques. Construcciones. Dos torres.'},
    {t:'Te incorporas lentamente.'},
    {t:'Cerca de ti, dos objetos brillan sobre la arena.'}
  ],()=>{
    showMsg('Explora. Hay algo cerca.');
    // Place camera and notebook nearby
    placeAwakeningItems();
  });
}
function placeAwakeningItemsLegacy(){
  // Camera with glow
  const camG=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.4,.28,.18),new THREE.MeshStandardMaterial({color:0x333340,roughness:.3,emissive:0x4488aa,emissiveIntensity:.4}));
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.12,12),new THREE.MeshStandardMaterial({color:0x222230,metalness:.7,emissive:0x66ccff,emissiveIntensity:.6}));
  lens.rotation.x=Math.PI/2;lens.position.z=.12;
  camG.add(body,lens);
  // Glow light
  // Glow ring
  const ring=new THREE.Mesh(new THREE.RingGeometry(.5,.7,24),new THREE.MeshBasicMaterial({color:0x66ccff,transparent:true,opacity:.4,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.02;
  camG.add(ring);
  camG.position.set(BEACH[0]+2.5,ground(BEACH[0]+2.5,BEACH[1]+1,300)+.15,BEACH[1]+1);
  camG.rotation.y=0.6;
  camG.userData.item='camera';
  camG.userData.baseY=camG.position.y;
  scene.add(camG);
  // Notebook with glow
  const nb=new THREE.Mesh(new THREE.BoxGeometry(.22,.03,.28),new THREE.MeshStandardMaterial({color:0xaa8855,roughness:.5,emissive:0xcc9944,emissiveIntensity:.5}));
  const nbRing=new THREE.Mesh(new THREE.RingGeometry(.35,.5,24),new THREE.MeshBasicMaterial({color:0xcc9944,transparent:true,opacity:.35,side:THREE.DoubleSide}));
  nbRing.rotation.x=-Math.PI/2;nbRing.position.y=.01;
  nb.add(nbRing);
  nb.position.set(BEACH[0]-1.8,ground(BEACH[0]-1.8,BEACH[1]+.8,300)+.02,BEACH[1]+.8);
  nb.rotation.y=-0.3;
  nb.userData.item='notebook';nb.userData.dyn=1;
  nb.userData.baseY=nb.position.y;
  scene.add(nb);
  if(STORY.flags.gotCam)camG.visible=false;
  if(STORY.flags.gotNb)nb.visible=false;
  window.__awakeItems={cam:camG,nb:nb,camRing:ring,nbRing:nbRing};
}
// Animate the glow (call from frame)
function animateAwakeItemsLegacy(t){
  if(!window.__awakeItems)return;
  const it=window.__awakeItems;
  const bob=Math.sin(t*2)*.04;
  const pulse=.4+.2*Math.sin(t*3);
  if(it.cam&&it.cam.visible){it.cam.position.y=it.cam.userData.baseY+bob;if(it.camRing)it.camRing.material.opacity=pulse}
  if(it.nb&&it.nb.visible){it.nb.position.y=it.nb.userData.baseY+bob*.7;if(it.nbRing)it.nbRing.material.opacity=pulse*.8}
}

/* v131: el Capítulo I vive en 28b-chapter1-awakening.js. Estas tres funciones son la fachada
   que usa el resto del juego; si el módulo nuevo falla, se recurre a las versiones clásicas (…Legacy). */
function startAwakening(){
  try{if(CH1.legacy)throw new Error('legacy');ch1Begin()}
  catch(e){CH1.legacy=true;window.__boisWakeLock=false;startAwakeningLegacy()}
}
function placeAwakeningItems(){
  try{if(CH1.legacy)throw new Error('legacy');ch1Dress();ch1PlaceItems(false)}
  catch(e){CH1.legacy=true;placeAwakeningItemsLegacy()}
}
// Los objetos se animan desde ch1Frame() (llamado por drawWorld), así también brillan durante las cinemáticas.
function animateAwakeItems(t){if(CH1.legacy)animateAwakeItemsLegacy(t)}

// v69: preparar la primera partida sin lanzar diálogos detrás del menú.
if(!STORY.flags.awake){window.__boisFreshStartPending=true;}
else{
  spawn(0);
  if(!STORY.flags.gotCam||!STORY.flags.gotNb)placeAwakeningItems();
  else{try{ch1Dress()}catch(e){console.warn('Capítulo I (escenografía):',e)}}
}
setTod(1);TM.mode=0;TM.timer=75; /* v167: se empieza en el atardecer, pero el día AVANZA solo (antes quedaba fijo; H elige una hora fija o vuelve a «Automático») */
placePhotos();

