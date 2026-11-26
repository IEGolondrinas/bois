/* BOIS.IO · 28a-ch1-director.js — Director de cámara, audio, filtros, estilos y títulos del Capítulo I */
const CH1 = {
  legacy: false,
  intro: false,
  dress: null,
  smoke: null,
  ember: null,
  motes: null,
  reveal: null,
  col: null,
  noteOpen: false,
  noteT: 0,
  vistaT: 0,
  last: performance.now(),
  visT: 0,
  gy: 0,
  SEA_YAW: Math.atan2(BEACH[0], BEACH[1]) + Math.PI,
  filt: false,
  filtT0: 0,
  _fSet: false,
  _glow: null,
  _star: null,
  _beam: null,
  _warned: {},
  _amb: null,
  _ambTarget: 0,
  _heart: null,
};

const CH1CAM = {
  on: false,
  cur: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, fov: 72 },
  tws: [],
  sway: 0,
  shake: 0,
  save: null,
};

function ch1Warn(tag, e) {
  if (CH1._warned[tag]) return;
  CH1._warned[tag] = 1;
  console.warn('Capítulo I (' + tag + '):', e);
}

function ch1Rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function ch1Tex(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  t.needsUpdate = true;
  return t;
}

function ch1Dirs() {
  const a = CH1.SEA_YAW;
  return { sf: [-Math.sin(a), -Math.cos(a)], rt: [Math.cos(a), -Math.sin(a)] };
}

function ch1EaseOut(u) {
  return 1 - Math.pow(1 - u, 3);
}
function ch1EaseIO(u) {
  return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
}

/* ───────── estilos UI del Capítulo I ───────── */
(function ch1InjectCSS() {
  if (typeof document === 'undefined' || document.getElementById('ch1Style')) return;
  const st = document.createElement('style');
  st.id = 'ch1Style';
  st.textContent = `
    #ch1Lids{position:fixed;inset:0;z-index:85;pointer-events:none}
    #ch1Lids .lid{position:absolute;left:0;right:0;height:52vh;background:#040608;transition:transform 2.8s cubic-bezier(.22,.7,.2,1)}
    #ch1Lids .lid.top{top:0;transform:translateY(0)}
    #ch1Lids .lid.bot{bottom:0;transform:translateY(0)}
    #ch1Lids.open .lid.top{transform:translateY(-102%)}
    #ch1Lids.open .lid.bot{transform:translateY(102%)}
    #ch1Title{position:fixed;inset:0;z-index:88;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;background:radial-gradient(circle,rgba(5,8,12,.35),rgba(3,5,8,.82));opacity:0;transition:opacity 1.1s}
    #ch1Title.on{opacity:1}
    #ch1Title small{color:#c9b88e;font:11px/1 system-ui,sans-serif;letter-spacing:4px;text-transform:uppercase;margin-bottom:10px}
    #ch1Title h2{margin:0;color:#f3eee2;font:400 clamp(24px,4vw,42px)/1.2 Georgia,serif;letter-spacing:2px;text-shadow:0 4px 24px #000}
    #ch1Note{position:fixed;inset:0;z-index:84;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transform:translateY(12px) scale(.97);transition:opacity .7s,transform .7s}
    #ch1Note.on{opacity:1;transform:translateY(0) scale(1)}
    #ch1Note .paper{position:relative;width:min(88vw,380px);padding:28px 26px 22px;background:#efe6d1;color:#2e251c;border-radius:3px;box-shadow:0 22px 60px rgba(0,0,0,.62);font:italic 17px/1.6 Georgia,serif}
    #ch1Note .tape{position:absolute;top:-10px;left:50%;width:74px;height:20px;transform:translateX(-50%) rotate(-2deg);background:rgba(220,206,174,.72)}
    #ch1Note p{margin:0 0 10px;min-height:48px}
    #ch1Note em{display:block;text-align:right;font:11px system-ui,sans-serif;color:#7a6b57;letter-spacing:1.2px;text-transform:uppercase}
  `;
  document.head.appendChild(st);
})();

/* ───────── cámara cinematográfica del Capítulo I ───────── */
function ch1CamBegin(fadeSec) {
  CH1CAM.save = {
    x: cam.position.x,
    y: cam.position.y,
    z: cam.position.z,
    yaw: S.yaw,
    pitch: S.pitch,
    fov: cam.fov,
  };
  CH1CAM.cur.x = cam.position.x;
  CH1CAM.cur.y = cam.position.y;
  CH1CAM.cur.z = cam.position.z;
  CH1CAM.cur.yaw = S.yaw;
  CH1CAM.cur.pitch = S.pitch;
  CH1CAM.cur.roll = 0;
  CH1CAM.cur.fov = cam.fov;
  CH1CAM.tws.length = 0;
  CH1CAM.sway = 0;
  CH1CAM.shake = 0;
  CH1CAM.on = true;
}

function ch1CamEnd() {
  CH1CAM.on = false;
  CH1CAM.tws.length = 0;
  CH1CAM.shake = 0;
  if (CH1CAM.save) {
    S.yaw = CH1CAM.cur.yaw;
    S.pitch = Math.max(-1.4, Math.min(1.4, CH1CAM.cur.pitch));
    cam.fov = 72;
    cam.updateProjectionMatrix();
    CH1CAM.save = null;
  }
}

function ch1CamTo(target, dur, easeFn) {
  const from = {};
  for (const k of Object.keys(target)) from[k] = CH1CAM.cur[k];
  CH1CAM.tws.push({ from, to: target, t: 0, dur: Math.max(0.05, dur || 1), ease: easeFn || ch1EaseIO });
}

function ch1LookAt(x, y, z, dur, extra) {
  const dx = x - CH1CAM.cur.x, dy = y - CH1CAM.cur.y, dz = z - CH1CAM.cur.z;
  const dist = Math.hypot(dx, dz) || 1;
  const yaw = Math.atan2(-dx, -dz);
  const pitch = Math.atan2(dy, dist);
  ch1CamTo(Object.assign({ yaw, pitch }, extra || {}), dur || 1.2);
}

function ch1CamShake(amt) {
  CH1CAM.shake = Math.max(CH1CAM.shake, amt || 0.015);
}

function ch1CamApply(dt, t) {
  for (let i = CH1CAM.tws.length - 1; i >= 0; i--) {
    const tw = CH1CAM.tws[i];
    tw.t += dt;
    const u = Math.min(1, tw.t / tw.dur);
    const e = tw.ease(u);
    for (const k of Object.keys(tw.to)) {
      let a = tw.from[k], b = tw.to[k];
      if (k === 'yaw') {
        let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
        if (d < -Math.PI) d += Math.PI * 2;
        CH1CAM.cur.yaw = a + d * e;
      } else {
        CH1CAM.cur[k] = a + (b - a) * e;
      }
    }
    if (u >= 1) CH1CAM.tws.splice(i, 1);
  }
  const c = CH1CAM.cur;
  const sw = CH1CAM.sway ? Math.sin(t * 0.9) * 0.008 * CH1CAM.sway : 0;
  const sk = CH1CAM.shake > 0.0005 ? (Math.random() - 0.5) * CH1CAM.shake : 0;
  CH1CAM.shake *= Math.max(0, 1 - dt * 4);
  cam.position.set(c.x + sk, c.y + sk * 0.5, c.z);
  cam.rotation.set(c.pitch + sw, c.yaw + sk * 0.4, c.roll, 'YXZ');
  if (Math.abs(cam.fov - c.fov) > 0.05) {
    cam.fov = c.fov;
    cam.updateProjectionMatrix();
  }
}

/* ───────── filtros, párpados, barras y títulos ───────── */
function ch1FilterSet(blurPx, bright, sat) {
  CH1._fSet = true;
  if (typeof window.__boisSetCanvasFilter === 'function') {
    window.__boisSetCanvasFilter('ch1', `blur(${blurPx.toFixed(2)}px) brightness(${bright.toFixed(2)}) saturate(${sat.toFixed(2)})`);
  }
}
function ch1FilterTick(now) {
  if (!CH1.filt) return;
  const u = Math.min(1, (now - CH1.filtT0) / 6500);
  const e = ch1EaseOut(u);
  ch1FilterSet(22 * (1 - e), 1.55 - 0.55 * e, 0.85 + 0.15 * e);
  if (u >= 1) ch1FilterClear();
}
function ch1FilterClear() {
  CH1.filt = false;
  CH1._fSet = false;
  if (typeof window.__boisSetCanvasFilter === 'function') window.__boisSetCanvasFilter('ch1', '');
}
function ch1Bars(on) {
  if (typeof cinBox !== 'undefined' && cinBox) cinBox.classList.toggle('ch1-bars', !!on);
}
function ch1LidsClosed() {
  let l = document.getElementById('ch1Lids');
  if (!l) {
    l = document.createElement('div');
    l.id = 'ch1Lids';
    l.innerHTML = '<div class="lid top"></div><div class="lid bot"></div>';
    document.body.appendChild(l);
  }
  l.classList.remove('open');
}
function ch1LidsGo() {
  const l = document.getElementById('ch1Lids');
  if (l) {
    void l.offsetHeight;
    l.classList.add('open');
  }
  CH1.filtT0 = performance.now();
  CH1.filt = true;
}
function ch1TitleCards(cb) {
  let d = document.getElementById('ch1Title');
  if (!d) {
    d = document.createElement('div');
    d.id = 'ch1Title';
    d.innerHTML = '<small>CAPÍTULO I</small><h2>El regreso a la orilla</h2>';
    document.body.appendChild(d);
  }
  requestAnimationFrame(() => d.classList.add('on'));
  setTimeout(() => {
    d.classList.remove('on');
    setTimeout(() => {
      d.remove();
      if (typeof cb === 'function') cb();
    }, 900);
  }, 2400);
}

/* ───────── audio del Capítulo I ───────── */
function ch1AudioStart(heart) {
  const C = typeof AU !== 'undefined' && AU.ctx;
  if (!C || !AU.on) return null;
  if (!CH1._amb && AU.nb) {
    const s = C.createBufferSource();
    s.buffer = AU.nb;
    s.loop = true;
    const f = C.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 380;
    const g = C.createGain();
    g.gain.value = 0;
    s.connect(f);
    f.connect(g);
    g.connect(C.destination);
    s.start();
    CH1._amb = { s, f, g };
  }
  if (heart && !CH1._heart) {
    let alive = true;
    const beat = () => {
      if (!alive || !AU.ctx || !AU.on) return;
      const t = AU.ctx.currentTime;
      [0, 0.24].forEach((off, idx) => {
        const o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(idx ? 52 : 62, t + off);
        o.frequency.exponentialRampToValueAtTime(28, t + off + 0.16);
        g.gain.setValueAtTime(0.0001, t + off);
        g.gain.exponentialRampToValueAtTime(idx ? 0.055 : 0.085, t + off + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.18);
        o.connect(g);
        g.connect(AU.ctx.destination);
        o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (_) {} };
        o.start(t + off);
        o.stop(t + off + 0.2);
      });
    };
    beat();
    CH1._heart = { id: setInterval(beat, 1150), stop() { alive = false; clearInterval(this.id); } };
  }
  return CH1._amb;
}
function ch1AudioLevel(lvl, dur) {
  CH1._ambTarget = lvl;
  const C = typeof AU !== 'undefined' && AU.ctx;
  if (!C || !CH1._amb) return;
  CH1._amb.g.gain.setTargetAtTime(AU.on ? lvl * 0.08 : 0, C.currentTime, Math.max(0.05, (dur || 1) * 0.35));
}
function ch1AudioOpen() {
  const C = typeof AU !== 'undefined' && AU.ctx;
  if (!C || !CH1._amb) return;
  CH1._amb.f.frequency.setTargetAtTime(950, C.currentTime, 1.4);
}
function ch1HeartStop() {
  if (CH1._heart) {
    CH1._heart.stop();
    CH1._heart = null;
  }
  if (CH1._amb && AU.ctx) {
    const a = CH1._amb;
    CH1._amb = null;
    a.g.gain.setTargetAtTime(0, AU.ctx.currentTime, 0.5);
    setTimeout(() => { try { a.s.stop(); a.s.disconnect(); a.f.disconnect(); a.g.disconnect(); } catch (_) {} }, 1800);
  }
}
function ch1AmbTick() {}
function ch1Tinnitus(dur) {
  const C = typeof AU !== 'undefined' && AU.ctx;
  if (!C || !AU.on) return;
  const t = C.currentTime, d = dur || 4.5;
  const o = C.createOscillator(), g = C.createGain();
  o.type = 'sine';
  o.frequency.value = 3450;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.014, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g);
  g.connect(C.destination);
  o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (_) {} };
  o.start(t);
  o.stop(t + d + 0.05);
}
function ch1Pad(freqs, dur, vol) {
  const C = typeof AU !== 'undefined' && AU.ctx;
  if (!C || !AU.on) return;
  const t = C.currentTime, d = dur || 6, v = (vol || 0.04) / Math.max(1, freqs.length);
  freqs.forEach((f) => {
    const o = C.createOscillator(), g = C.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(C.destination);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (_) {} };
    o.start(t);
    o.stop(t + d + 0.05);
  });
}
function ch1SfxSand() {
  if (typeof auHit === 'function') auHit(1400, 0.28, 0.09, 'bandpass');
}
function ch1SfxShutter() {
  if (typeof auHit === 'function') {
    auHit(2600, 0.04, 0.11, 'highpass');
    setTimeout(() => auHit(1600, 0.05, 0.08, 'bandpass'), 55);
  }
}
function ch1SfxPage() {
  if (typeof auHit === 'function') auHit(2100, 0.14, 0.065, 'bandpass');
}
