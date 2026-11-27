/* BOIS.IO · 25-hidden-photos.js — Fotografías ocultas: colocación, animación, interacción
   (líneas 2414–2488 de BOIS_IO_v119_Optimizado.html) */
// ===== HIDDEN PHOTOGRAPHS =====
// PHOTOS → data/hidden-photos.js
function placePhotos(){
  window.__photos=[];
  const loader=new THREE.TextureLoader();
  for(const p of PHOTOS){
    if(STORY.flags['photo_'+p.id])continue;
    const g=new THREE.Group();
    // v73: fotografía física tipo instantánea, mucho más grande y legible.
    const backing=new THREE.Mesh(new THREE.BoxGeometry(1.08,1.28,.075),new THREE.MeshStandardMaterial({color:0xf0e8d7,roughness:.78,emissive:0xffe7bd,emissiveIntensity:.35}));
    backing.position.y=.86;
    const tex=loader.load(p.img);
    tex.encoding=THREE.sRGBEncoding;
    const image=new THREE.Mesh(new THREE.PlaneGeometry(.91,.91),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
    image.position.set(0,.91,.041);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.48,.64,28),new THREE.MeshBasicMaterial({color:0xffe7bd,transparent:true,opacity:.32,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.025;
    // v133: columna de luz tenue, visible solo a poca distancia: la foto se «anuncia» al llegar a la zona, no desde lejos.
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.05,.2,9,10,1,true),new THREE.MeshBasicMaterial({color:0xffe7bd,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}));
    beam.position.y=4.5;
    g.add(backing,image,ring,beam);
    g.position.set(p.x,ground(p.x,p.z,300)+.08,p.z);
    g.userData.photo=p;
    g.userData.baseY=g.position.y;
    g.userData.ring=ring;
    g.userData.beam=beam;
    scene.add(g);
    window.__photos.push(g);
  }
}
function animatePhotos(t){
  if(!window.__photos)return;
  const bob=Math.sin(t*1.8)*.025;
  const pulse=.24+.16*Math.sin(t*2.5);
  for(const g of window.__photos){
    if(!g.visible)continue;
    g.position.y=g.userData.baseY+bob;
    // La instantánea gira suavemente hacia el jugador para que pueda distinguirse.
    g.rotation.y=Math.atan2(cam.position.x-g.position.x,cam.position.z-g.position.z);
    if(g.userData.ring)g.userData.ring.material.opacity=pulse;
    if(g.userData.beam){const d=Math.hypot(cam.position.x-g.position.x,cam.position.z-g.position.z);g.userData.beam.material.opacity=Math.max(0,Math.min(1,(70-d)/45))*(.16+.07*Math.sin(t*1.6));}
  }
}
function checkPhotos(){
  if(!window.__photos||!S.on||CIN.on)return;
  for(const g of window.__photos){
    if(!g.visible)continue;
    const d=Math.hypot(S.x-g.position.x,S.z-g.position.z);
    if(d<2.2){
      if(!g.userData.near){g.userData.near=1;showMsg('Fotografía · pulsa E')}
    }else g.userData.near=0;
  }
  checkKatherinNearby();
}
function ch2Pad(freqs,dur,vol){
  try{
    const C=typeof AU!=='undefined'&&AU.ctx;if(!C||!AU.on)return;
    const t=C.currentTime,lp=C.createBiquadFilter(),m=C.createGain();
    lp.type='lowpass';lp.frequency.value=1200;
    m.gain.setValueAtTime(.0001,t);m.gain.linearRampToValueAtTime(vol||.038,t+dur*.32);m.gain.linearRampToValueAtTime(.0001,t+dur);
    lp.connect(m);m.connect(C.destination);
    let left=freqs.length;
    freqs.forEach((f,i)=>{
      const o=C.createOscillator();o.type=i%2?'sine':'triangle';o.frequency.value=f;o.detune.value=(i-1)*4;
      o.connect(lp);o.onended=()=>{try{o.disconnect();if(--left<=0){lp.disconnect();m.disconnect()}}catch(_){}};
      o.start(t);o.stop(t+dur+.1);
    });
  }catch(e){typeof __bw==='function'&&__bw('25-hidden-photos#pad',e)}
}
function interactPhoto(){
  if(!window.__photos)return false;
  for(const g of window.__photos){
    if(!g.visible)continue;
    const d=Math.hypot(S.x-g.position.x,S.z-g.position.z);
    if(d<2.5){
      const p=g.userData.photo;
      storyFlag('photo_'+p.id,1);
      g.visible=false;
      const n=bgCollected(),tot=PHOTOS.length;
      if(typeof auHit==='function'){auHit(3400,.06,.08,'highpass');setTimeout(()=>auHit(1700,.05,.04,'bandpass'),75)}
      ch2Pad(n>=tot?[196,293.7,392]:[220+n*12,293.7+n*10,392],4.8,.034);
      // v73: la imagen real acompaña los fragmentos narrativos de esta fotografía.
      window.__boisRevealPhoto={title:p.title,img:p.img,kind:p.kind,kindLabel:p.kindLabel};
      const locLabel='RECUERDO DIRECTO · '+n+'/'+tot+(p.zone?' · '+String(p.zone).toUpperCase():'');
      const lines=typeof window.__boisMemoryLines==='function'?window.__boisMemoryLines(p):p.mem.map(t=>({t}));
      const photoLook=new THREE.Vector3(g.position.x,Math.max(g.position.y+1.1,S.y+1.55),g.position.z);
      playCinematic(lines,()=>{
        if(n>=tot){
          storyFlag('ch2_complete',1);
          if(window.__katherin)window.__katherin.visible=true;
          if(window.__glasses&&!STORY.flags.glasses)window.__glasses.visible=true;
          ch2Pad([196,261.6,329.6,392],7.5,.042);
          const kat=window.__katherin;
          const endLook=kat?new THREE.Vector3(kat.position.x,kat.position.y+1.5,kat.position.z):new THREE.Vector3(-120,ground(-120,74,300)+1.8,74);
          playCinematic([
            {t:'Las seis fotografías vuelven a su sitio en la cámara.'},
            {t:'Todavía no sabes qué significaba todo, pero ya empezaste a separar lo que ocurrió de lo que pensaste.'},
            {t:'Junto al lago, en el Parque de los Cisnes, alguien espera sentada en la banca.'}
          ],()=>{showMsg('Capítulo III · El Parque de los Cisnes · acércate al lago')},{lookAt:endLook,location:'CAPÍTULO II · COMPLETADO'});
        }else{
          showMsg('Cápsula '+n+'/'+tot+' guardada'+(n===3?' · Nueva página en tu libreta (J)':''));
          if(typeof bgGuided==='function'){const gd=bgGuided();if(gd)setTimeout(()=>{if(S.on&&!CIN.on)showMsg('Siguiente pista · '+gd.zone+' · pulsa J o M')},3200)}
        }
      },{lookAt:photoLook,location:locLabel});
      return true;
    }
  }
  return false;
}


