/* BOIS.IO · 30e-swanbox.js — Caja de música · Capítulo III Remastered
   Una cajita de música sobre la banca de Katherin toca tu mp3 incrustado (data/swan-audio.js).
   Tapa articulada al sonar, temporizador seguro al alejarse y pausa/silencio limpios. */
const sbx = { box: null, playing: false, timer: 0 };

function sbxBuild() {
  const k = window.__katherin;
  if (!k || sbx.box) return;
  const b = k.userData.bench;
  if (!b) return;

  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd6b25e, roughness: 0.35, metalness: 0.62 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.14), wood);
  base.position.y = 0.045;

  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.02, 0.012), gold);
  clasp.position.set(0, 0.085, 0.072);

  // Tapa con bisagra en el borde trasero para abrir suavemente cuando suena
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.09, -0.07);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.14), gold);
  lid.position.set(0, 0.01, 0.07);
  lidPivot.add(lid);

  const key = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 6, 12), gold);
  key.position.set(0.115, 0.05, 0);
  key.rotation.y = Math.PI / 2;
  key.userData.dyn = true;

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe3a8, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.position.y = 0.1;
  glow.userData.dyn = true;

  g.add(base, clasp, lidPivot, key, glow);
  g.userData = { key, glow, lidPivot };
  g.position.set(b.x, b.h + 0.52, b.z);
  g.rotation.y = b.a;
  scene.add(g);
  sbx.box = g;
}

const SL_SEG = 9, SL_AUDIO_VOL = 0.55;
let slAudio = null;
(window.__boisVolHooks = window.__boisVolHooks || []).push((g) => {
  if (slAudio) slAudio.volume = Math.min(1, SL_AUDIO_VOL * g);
});

function sbxPlay() {
  try {
    if ((typeof AU !== 'undefined' && !AU.on) || document.hidden) return SL_SEG;
    if (!slAudio) slAudio = new Audio(SWAN_AUDIO);
    slAudio.muted = false;
    slAudio.volume = Math.min(1, SL_AUDIO_VOL * (typeof boisVolGain === 'function' ? boisVolGain() : 1));
    slAudio.currentTime = 0;
    const p = slAudio.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {
    if (typeof __bw === 'function') __bw('30e-swanbox#1', e);
  }
  return SL_SEG;
}

const SBX_QUIPS = [
  [{ who: 'Katherin', t: 'Esa melodía otra vez…' }, { who: 'Katherin', t: 'Es bonita. Pero me sigue dando un poquito de miedo.' }],
  [{ who: 'Katherin', t: 'Dicen que Odette es un cisne de día y una persona de noche.' }, { who: 'Tú', t: '¿Y eso da miedo?' }, { who: 'Katherin', t: 'Un poco. Vivir entre dos formas.' }],
  [{ t: 'La música se apaga despacio. Los cisnes no se han movido.' }]
];

function interactSwanBox() {
  const k = window.__katherin, b = sbx.box;
  if (!k || !k.visible || !b || !S.on || CIN.on || sbx.playing || (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || (typeof CAR !== 'undefined' && CAR.on) || Math.abs(S.y - b.position.y) >= 4) return false;
  const dB = Math.hypot(S.x - b.position.x, S.z - b.position.z);
  if (dB > 2.6) return false;

  sbx.playing = true;
  if (sbx.timer) clearTimeout(sbx.timer);
  const first = !STORY.flags.swanbox;
  const dur = sbxPlay();
  showMsg('Le das cuerda a la cajita de música…');
  const look = new THREE.Vector3(k.position.x, k.position.y + 1.35, k.position.z);

  sbx.timer = setTimeout(() => {
    sbx.timer = 0;
    if (!sbx.playing) return;
    if (!S.on || CIN.on || (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || (typeof CAR !== 'undefined' && CAR.on) || Math.hypot(S.x - b.position.x, S.z - b.position.z) >= 12 || Math.abs(S.y - b.position.y) >= 5) {
      sbx.playing = false;
      return;
    }
    let lines;
    if (first) {
      storyFlag('swanbox', 1);
      lines = [
        { t: 'Es una melodía que has oído antes. En un ensayo, quizás.' }, { pause: 1800 },
        { who: 'Katherin', t: 'Qué miedo.' }, { pause: 1400 },
        { who: 'Tú', t: '¿La música?' }, { pause: 1200 },
        { who: 'Katherin', t: 'Es de los cisnes. Suena bonita… y a la vez no.' }, { pause: 2000 },
        { t: 'Aun así, no pide que la apagues. Se queda escuchando hasta el final.' }, { pause: 2200 }
      ];
    } else {
      const q = SBX_QUIPS[(STORY.flags.swanbox_n || 0) % SBX_QUIPS.length];
      storyFlag('swanbox_n', (STORY.flags.swanbox_n || 0) + 1);
      lines = [];
      for (const l of q) {
        lines.push(l);
        lines.push({ pause: Math.min(3000, 900 + l.t.length * 30) });
      }
    }
    playCinematic(lines, () => { sbx.playing = false; }, { lookAt: look, location: 'PARQUE DE LOS CISNES · CAJITA DE MÚSICA' });
  }, Math.min(dur, 10) * 1000);
  return true;
}

function sbxHintText(katherinNear) {
  return katherinNear ? 'Katherin · E: hablar · F: sentarte · B: cajita de música' : 'Cajita de música · B: darle cuerda';
}

let sbxNear = false;
function __swanBoxTick() {
  try {
    if (!sbx.box) sbxBuild();
    const b = sbx.box, k = window.__katherin;
    if (!b) return;
    const inPR = typeof PR !== 'undefined' && PR.on;
    const inCh6 = !!(window.__boisCh6 && window.__boisCh6.on);
    const farAway = Math.hypot(S.x - b.position.x, S.z - b.position.z) >= 14 || Math.abs(S.y - b.position.y) >= 5;

    if (inPR || inCh6 || (!CIN.on && farAway)) {
      if (sbx.timer) { clearTimeout(sbx.timer); sbx.timer = 0; }
      sbx.playing = false;
      if (slAudio && !slAudio.paused) {
        slAudio.pause();
        slAudio.currentTime = 0;
      }
    }
    if (slAudio) {
      slAudio.muted = (typeof AU !== 'undefined' && !AU.on) || document.hidden || (!S.on && !CIN.on) || !!window.__boisGuideOverlayOpen || inPR || inCh6;
    }

    b.visible = !!(k && k.visible) && !inPR && !inCh6;
    const t = performance.now() / 1000;
    b.userData.glow.material.opacity = (sbx.playing ? 0.22 : 0.1) + 0.05 * Math.sin(t * 2);
    if (sbx.playing) b.userData.key.rotation.x += 0.08;

    const targetLid = sbx.playing ? -0.42 : 0;
    b.userData.lidPivot.rotation.x += (targetLid - b.userData.lidPivot.rotation.x) * 0.18;

    const n = b.visible && S.on && !CIN.on && !sbx.playing && !(typeof CAR !== 'undefined' && CAR.on) && Math.abs(S.y - b.position.y) < 4 && Math.hypot(S.x - b.position.x, S.z - b.position.z) < 2.6;
    if (n && !sbxNear) showMsg(sbxHintText(!!(k && k.visible && Math.hypot(S.x - k.position.x, S.z - k.position.z) < 3.5)));
    sbxNear = n;
  } catch (e) {
    if (typeof __bw === 'function') __bw('30e-swanbox#2', e);
  }
}
window.__boisSwanBoxTick = __swanBoxTick;
try {
  if (!window.__boisMainLoopUnified) setInterval(__swanBoxTick, 120);
} catch (e) {
  console.warn('Caja de música:', e);
}

addEventListener('keydown', (e) => {
  if (e.code !== 'KeyB' || e.repeat || !S.on || CIN.on || (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || (typeof CAR !== 'undefined' && CAR.on)) return;
  try {
    if (interactSwanBox()) e.preventDefault();
  } catch (err) {
    if (typeof __bw === 'function') __bw('30e-swanbox#3', err);
  }
});
