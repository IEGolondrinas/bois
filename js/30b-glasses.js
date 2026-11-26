/* BOIS.IO · 30b-glasses.js — Miopía · Capítulo III Remastered
   Cuando Katherin aparece (6 fotos), la vista se empaña al acercarse al parque. Unas gafas vintage
   descansan sobre otra banca cercana; al recogerlas, un destello sonoro aclara la vista y revela el parque. */
const GL_BLUR = 3.2, GL_DIST = [26, 5];

function glassesActive() {
  const k = window.__katherin;
  return !!(k && k.visible && !STORY.flags.glasses && !STORY.flags.metKatherin && window.__glasses);
}

function buildGlasses() {
  const k = window.__katherin;
  if (!k || window.__glasses) return;
  const b = k.userData.bench;
  if (!b || !Array.isArray(arSpots)) return;

  // En otra banca del parque, la más cercana a la de Katherin (≥ 20 m)
  const o = arSpots
    .filter((q) => Math.hypot(q.x - b.x, q.z - b.z) > 20)
    .sort((p, q) => Math.hypot(p.x - b.x, p.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z))[0] || arSpots[0];

  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3b2c23, roughness: 0.28, metalness: 0.72 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xd4ecff,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.34,
    depthWrite: false
  });

  // Aros redondos, cristales y puente nasal
  const rimGeo = new THREE.TorusGeometry(0.044, 0.0055, 8, 20);
  const lensGeo = new THREE.CircleGeometry(0.041, 18);
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(rimGeo, frameMat);
    r.position.set(s * 0.052, 0, 0);
    g.add(r);

    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(s * 0.052, 0, 0);
    g.add(lens);

    // Patillas plegadas hacia atrás
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.0055, 0.0055, 0.155), frameMat);
    arm.position.set(s * 0.094, 0.004, -0.075);
    arm.rotation.y = s * -0.08;
    g.add(arm);
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.024, 6), frameMat);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.006, 0);
  g.add(bridge);

  // Anillo suave luminoso y destello vertical sutil para localizarlas entre el desenfoque
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.14, 0.22, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -0.055;
  g.add(halo);

  const glint = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe9a6, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  g.add(glint);

  g.position.set(o.x, o.h + 0.60, o.z);
  g.rotation.y = o.a;
  scene.add(g);
  window.__glasses = g;
  g.userData.base = g.position.y;
  g.userData.halo = halo;
  g.userData.glint = glint;
  g.visible = false;

  const anim = (dt, t) => {
    if (document.hidden || !g.visible) return;
    const tm = t || performance.now() / 1000;
    g.position.y = g.userData.base + Math.sin(tm * 1.6) * 0.015;
    g.rotation.y += dt ? dt * 0.35 : 0.01;
    halo.material.opacity = 0.22 + 0.12 * Math.sin(tm * 2.2);
    glint.material.opacity = 0.11 + 0.07 * Math.sin(tm * 2.6 + 1);
  };
  window.__boisGlassesAnim = anim;
  if (!window.__boisMainLoopUnified) {
    const _glAnimId = setInterval(() => {
      if (typeof STORY !== 'undefined' && STORY.flags && (STORY.flags.glasses || STORY.flags.metKatherin)) {
        clearInterval(_glAnimId);
        return;
      }
      anim(0.033);
    }, 33);
  }
}

function glassesDist() {
  const g = window.__glasses;
  return g ? Math.hypot(S.x - g.position.x, S.z - g.position.z) : 1e9;
}

function glassesSoundChime() {
  try {
    if (typeof auChime === 'function') auChime();
    const C = typeof AU !== 'undefined' && AU.ctx;
    if (!C || !AU.on) return;
    const t = C.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = C.createOscillator(), g = C.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.04, t + i * 0.07 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.65);
      o.connect(g);
      g.connect(C.destination);
      o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (_) {} };
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 0.7);
    });
  } catch (e) {
    if (typeof __bw === 'function') __bw('30b-glasses#chime', e);
  }
}

let glNear = false;
function glassesUpdate() {
  const c = document.getElementById('c');
  if (!c) return;
  const k = window.__katherin, g = window.__glasses;
  if (g) g.visible = !!(k && k.visible && !STORY.flags.glasses && !STORY.flags.metKatherin);
  let px = 0;
  const active = S.on && glassesActive() && !(typeof PR !== 'undefined' && PR.on) && !(window.__boisCh6 && window.__boisCh6.on);
  if (active) {
    const d = glassesDist();
    const u = Math.max(0, Math.min(1, (d - GL_DIST[1]) / (GL_DIST[0] - GL_DIST[1])));
    px = GL_BLUR * u * u * (3 - 2 * u);
    if (d < 2.6) {
      if (!glNear) {
        glNear = true;
        if (!CIN.on) showMsg('Gafas sobre la banca · E: recoger');
      }
    } else {
      glNear = false;
      if (!window.__glHint || performance.now() > window.__glHint) {
        window.__glHint = performance.now() + 15000;
        if (!CIN.on) showMsg('Todo se ve borroso… algo brilla sobre otra banca del parque');
      }
    }
  } else {
    glNear = false;
  }

  const v = px > 0.15 ? 'blur(' + px.toFixed(2) + 'px)' : '';
  if (c.dataset.gl !== v) {
    c.dataset.gl = v;
    if (!c.dataset.glTr) {
      c.dataset.glTr = '1';
      c.style.transition = 'filter 0.8s ease';
    }
    if (typeof window.__boisSetCanvasFilter === 'function') window.__boisSetCanvasFilter('gl', v);
    else c.style.filter = v;
  }
}

function interactGlasses() {
  const g = window.__glasses;
  if (!g || !g.visible || !S.on || CIN.on || glassesDist() > 2.6) return false;
  storyFlag('glasses', 1);
  g.visible = false;
  glNear = false;
  glassesSoundChime();
  const lookAt = new THREE.Vector3(g.position.x, g.position.y, g.position.z);
  playCinematic([
    { t: 'Unas gafas. Las lentes tienen un leve tono de miopía.' },
    { pause: 1600 },
    { t: 'Te las pones. El parque se aclara de golpe: las ramas del cerezo, el agua, los dos cisnes.', on: () => glassesUpdate() },
    { pause: 2100 },
    { t: 'Quizás nada había cambiado. Quizás siempre estuvo ahí, y tú no mirabas con suficiente atención.' },
    { pause: 2500 }
  ], () => {
    glassesUpdate();
    showMsg('Vista enfocada · Acércate a la joven en la banca junto al lago (E)');
  }, { lookAt, location: 'CAPÍTULO III · ENFOQUE' });
  return true;
}

function __glassesTick() {
  try {
    if (document.hidden) return;
    if (!window.__glasses) buildGlasses();
    glassesUpdate();
  } catch (e) {
    if (typeof __bw === 'function') __bw('30b-glasses#1', e);
  }
}
window.__boisGlassesTick = __glassesTick;
try {
  buildGlasses();
  if (!window.__boisMainLoopUnified) setInterval(__glassesTick, 120);
} catch (e) {
  console.warn('Gafas:', e);
}
