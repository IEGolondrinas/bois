/* BOIS.IO · 24-camera-album.js — Modo visor y álbum personal (P / V) */
(() => {
  const PHOTO_KEY = 'bois_user_photos';
  const MAX_PHOTOS = 30;
  const ZOOM_STEPS = [1, 1.35, 1.75, 2.25];
  const camEsc = v => String(v == null ? '' : v).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  // ---------- Detección de lugar y atmósfera ----------
  function camDetectPlace() {
    try {
      if (typeof PR !== 'undefined' && PR.on) return 'Poolrooms (bajo el lago)';
      if (window.__boisCh6 && window.__boisCh6.on) return 'Torres de cristal (Cap. VI)';
      if (typeof uw !== 'undefined' && uw) return 'Bajo el agua';
      const x = typeof S !== 'undefined' ? S.x : 0;
      const y = typeof S !== 'undefined' ? S.y : 0;
      const z = typeof S !== 'undefined' ? S.z : 0;
      const inCar = typeof CAR !== 'undefined' && CAR.on;
      const suffix = inCar ? ' · desde el auto' : '';
      const c4 = window.__boisCh4Bounds;
      if (c4 && Math.abs(x - c4.cx) <= c4.hx + 8 && Math.abs(z - c4.cz) <= c4.hz + 8) return 'Edificio sin nombre' + suffix;
      if (typeof arSpots !== 'undefined' && arSpots[0] && Math.hypot(x - arSpots[0].x, z - arSpots[0].z) < 44) return 'Parque de los Cisnes' + suffix;
      if (Math.hypot(x - 99, z + 174.4) < 76) return 'El puente sobre el mar' + suffix;
      if (Math.hypot(x + 18, z + 34) < 52) return 'Torres gemelas' + suffix;
      if (typeof BEACH !== 'undefined' && Math.hypot(x - BEACH[0], z - BEACH[1]) < 68) return 'Playa del regreso' + suffix;
      if (Math.hypot(x + 176, z + 295) < 72 || y > 38) return 'La cumbre' + suffix;
      if ((typeof window.__inLake === 'function' && window.__inLake(x, z)) || Math.hypot(x + 125, z - 110) < 95) return 'El lago' + suffix;
      if (typeof hAt === 'function' && typeof WL !== 'undefined' && hAt(x, z) < WL + 2.5) return 'Orilla del mar' + suffix;
      return (inCar ? 'Camino de la isla' : 'Senderos de la isla') + suffix;
    } catch (e) {
      return 'En algún lugar de la isla';
    }
  }

  function camDetectMood() {
    try {
      if (typeof PR !== 'undefined' && PR.on) return 'Galería sumergida';
      if (window.__boisCh6 && window.__boisCh6.on) return 'Entre dos torres';
      const parts = [];
      if (typeof PC !== 'undefined' && PC && PC.n) parts.push(PC.n);
      if (typeof WX !== 'undefined' && WX.st) {
        const s = WX.st;
        if (s.sc > 0.35) parts.push('Supercélula');
        else if (s.rain > 0.72) parts.push('Tormenta');
        else if (s.rain > 0.2) parts.push('Lluvia');
        else if (s.fog > 0.45) parts.push('Niebla');
        else parts.push('Despejado');
      }
      return parts.join(' · ') || 'Isla';
    } catch (e) {
      return 'Isla';
    }
  }

  function camFormatDate(d) {
    try {
      return d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return d.toISOString().slice(0, 16).replace('T', ' ');
    }
  }

  // ---------- Almacenamiento personal (localStorage) ----------
  function loadUserPhotos() {
    try {
      const raw = localStorage.getItem(PHOTO_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(p => p && typeof p === 'object' && typeof p.img === 'string' && p.img.indexOf('data:image/') === 0).slice(0, MAX_PHOTOS);
    } catch (e) {
      return [];
    }
  }

  let userPhotos = loadUserPhotos();
  let preferredTab = 'story';
  let activeTab = 'story';
  let editingId = null;
  let confirmDeleteId = null;
  let confirmDeleteTimer = 0;
  let lightIndex = -1;

  function saveUserPhotos() {
    try {
      localStorage.setItem(PHOTO_KEY, JSON.stringify(userPhotos));
      return true;
    } catch (e) {
      if (typeof showMsg === 'function') showMsg('Espacio lleno: descarga o borra alguna foto del álbum');
      return false;
    }
  }

  window.__boisUserPhotoCount = () => userPhotos.length;

  // ---------- Estilos (Visor + Álbum + Lightbox) ----------
  const camStyle = document.createElement('style');
  camStyle.textContent = `
body.cam-finder-active #bgHud,body.cam-finder-active #bgCompass,body.cam-finder-active #carPrompt,body.cam-finder-active #tb{opacity:0!important;pointer-events:none!important;transition:opacity .2s ease}
#camFinder{position:fixed;inset:0;z-index:14;display:none;pointer-events:none;color:#f3ecdc;font-family:system-ui,sans-serif;user-select:none}
#camFinder.on{display:block}
#camFinder .cf-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 56%,rgba(4,7,9,.52) 100%)}
#camFinder .cf-frame{position:absolute;inset:clamp(18px,4vw,42px);border:1px solid rgba(240,232,212,.14)}
#camFinder .cf-grid-h,#camFinder .cf-grid-v{position:absolute;inset:0;pointer-events:none;opacity:.14}
#camFinder .cf-grid-h::before,#camFinder .cf-grid-h::after{content:'';position:absolute;left:0;right:0;height:1px;background:#f3ecdc}
#camFinder .cf-grid-h::before{top:33.33%}#camFinder .cf-grid-h::after{top:66.66%}
#camFinder .cf-grid-v::before,#camFinder .cf-grid-v::after{content:'';position:absolute;top:0;bottom:0;width:1px;background:#f3ecdc}
#camFinder .cf-grid-v::before{left:33.33%}#camFinder .cf-grid-v::after{left:66.66%}
#camFinder .cf-corner{position:absolute;width:22px;height:22px;border-color:rgba(245,236,214,.78);border-style:solid}
#camFinder .cf-tl{top:-1px;left:-1px;border-width:2px 0 0 2px}
#camFinder .cf-tr{top:-1px;right:-1px;border-width:2px 2px 0 0}
#camFinder .cf-bl{bottom:-1px;left:-1px;border-width:0 0 2px 2px}
#camFinder .cf-br{bottom:-1px;right:-1px;border-width:0 2px 2px 0}
#camFinder .cf-ret{position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border:1px solid rgba(245,236,214,.55);border-radius:50%}
#camFinder .cf-ret::after{content:'';position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px;border-radius:50%;background:rgba(245,236,214,.85)}
#camFinder .cf-top{position:absolute;top:12px;left:14px;right:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;text-shadow:0 1px 6px #000}
#camFinder .cf-place{display:flex;align-items:center;gap:8px;background:rgba(8,12,15,.55);padding:5px 10px;border:1px solid rgba(240,230,205,.18)}
#camFinder .cf-dot{width:7px;height:7px;border-radius:50%;background:#e4b66f;box-shadow:0 0 8px #e4b66f}
#camFinder .cf-meta{background:rgba(8,12,15,.55);padding:5px 10px;border:1px solid rgba(240,230,205,.18);color:#dcd3be}
#camFinder .cf-bot{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;background:rgba(8,12,15,.72);border:1px solid rgba(240,230,205,.22);padding:7px 14px;font-size:11px;color:#ded6c3;white-space:nowrap;max-width:92vw}
#camFinder .cf-touch{display:none;pointer-events:auto;gap:8px;align-items:center}
#camFinder.is-touch .cf-desk{display:none}
#camFinder.is-touch .cf-touch{display:flex}
#camFinder .cf-btn{border:1px solid rgba(240,230,205,.35);background:rgba(255,255,255,.07);color:#f5eedc;padding:6px 11px;font:12px system-ui,sans-serif;cursor:pointer}
#camFinder .cf-btn.cf-shoot{background:rgba(228,182,111,.25);border-color:#e4b66f;font-weight:600}

#camAlbum{position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;padding:clamp(12px,3vw,34px);background:rgba(5,8,10,.84);backdrop-filter:blur(9px);color:#eee8d9;font-family:Georgia,serif}
#camAlbum .cam-sheet{width:min(100%,1040px);max-height:94vh;overflow:auto;background:linear-gradient(145deg,rgba(29,31,30,.98),rgba(12,15,17,.98));border:1px solid rgba(218,202,166,.32);box-shadow:0 24px 90px #000;padding:clamp(18px,3vw,32px)}
#camAlbum .cam-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(218,202,166,.2);padding-bottom:16px;margin-bottom:16px}
#camAlbum .cam-kicker{font:10px/1.4 system-ui,sans-serif;letter-spacing:2.5px;color:#b9a98a}
#camAlbum h2{font:clamp(25px,4vw,36px)/1.1 Georgia,serif;font-weight:400;margin:7px 0;color:#f0e8d8}
#camAlbum .cam-head p{margin:0;color:#b9b4a8;font:13px/1.5 system-ui,sans-serif}
#camAlbum .cam-close{border:1px solid rgba(230,220,200,.3);background:transparent;color:#eee8d9;padding:8px 12px;cursor:pointer;font:13px system-ui,sans-serif;white-space:nowrap}
#camAlbum .cam-close:hover{background:rgba(255,255,255,.1)}
#camAlbum .cam-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
#camAlbum .cam-tab{border:1px solid rgba(220,205,175,.22);background:rgba(255,255,255,.03);color:#c6bead;padding:8px 14px;cursor:pointer;font:13px system-ui,sans-serif;transition:background .2s,border-color .2s,color .2s}
#camAlbum .cam-tab:hover{background:rgba(255,255,255,.08)}
#camAlbum .cam-tab.on{background:rgba(228,182,111,.16);border-color:rgba(228,182,111,.65);color:#f6eedc}
#camAlbum .cam-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
#camAlbum .cam-photo{min-width:0;position:relative;background:rgba(255,255,255,.035);border:1px solid rgba(220,205,175,.16);padding:9px;animation:camDevelop 2.2s ease both}
#camAlbum .cam-photo:nth-child(2){animation-delay:.55s}#camAlbum .cam-photo:nth-child(3){animation-delay:1.1s}#camAlbum .cam-photo:nth-child(4){animation-delay:1.65s}
#camAlbum .cam-photo img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;filter:sepia(.12) contrast(.94);border:5px solid #c6b99f;box-shadow:0 4px 14px #0008}
#camAlbum .cam-photo h3{font:18px Georgia,serif;font-weight:400;margin:12px 2px 6px;color:#e9dfca}
#camAlbum .cam-photo p{font:12px/1.55 system-ui,sans-serif;color:#c5c0b4;margin:0 2px 6px}
#camAlbum .cam-photo small{display:block;font:italic 11px/1.45 Georgia,serif;color:#938d80;margin:0 2px 2px}
#camAlbum .cam-photo::after{content:'';position:absolute;top:14px;left:14px;right:14px;aspect-ratio:4/3;pointer-events:none;mix-blend-mode:multiply;opacity:.8}
#camAlbum .cam-photo:nth-child(1)::after{background:radial-gradient(ellipse at 100% 0%,rgba(70,40,10,.75),transparent 46%),linear-gradient(115deg,transparent 60%,rgba(120,90,50,.28) 61%,transparent 62%)}
#camAlbum .cam-photo:nth-child(2)::after{background:radial-gradient(ellipse at 0% 100%,rgba(60,70,60,.65),transparent 42%),radial-gradient(circle at 70% 30%,rgba(110,95,60,.35),transparent 24%)}
#camAlbum .cam-photo:nth-child(3)::after{background:linear-gradient(80deg,transparent 48%,rgba(30,25,20,.55) 48.4%,transparent 49%),linear-gradient(100deg,transparent 52%,rgba(30,25,20,.35) 52.3%,transparent 52.8%),radial-gradient(ellipse at 50% 120%,rgba(60,45,30,.5),transparent 50%)}
#camAlbum .cam-photo:nth-child(4)::after{background:radial-gradient(ellipse at 50% 50%,rgba(210,200,180,.0) 30%,rgba(200,190,170,.55) 100%)}

#camAlbum .cam-mine-card{min-width:0;background:rgba(255,255,255,.035);border:1px solid rgba(220,205,175,.18);padding:10px;display:flex;flex-direction:column;gap:8px}
#camAlbum .cam-mine-card img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;border:4px solid #ded5c0;box-shadow:0 4px 16px #0008;cursor:zoom-in}
#camAlbum .cam-mine-title{font:17px Georgia,serif;color:#efe6d4;margin:2px 0 0}
#camAlbum .cam-mine-meta{font:11px/1.45 system-ui,sans-serif;color:#a8a295}
#camAlbum .cam-mine-note{font:italic 13px/1.5 Georgia,serif;color:#d6ceb8;background:rgba(255,255,255,.025);border-left:2px solid rgba(228,182,111,.45);padding:5px 9px}
#camAlbum .cam-note-edit{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#camAlbum .cam-note-edit input{flex:1;min-width:150px;background:rgba(0,0,0,.35);border:1px solid rgba(230,220,200,.28);color:#f3ecdc;padding:6px 8px;font:12px system-ui,sans-serif}
#camAlbum .cam-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:auto;padding-top:4px}
#camAlbum .cam-btn{border:1px solid rgba(230,220,200,.26);background:rgba(255,255,255,.03);color:#ded6c3;padding:5px 9px;font:11px system-ui,sans-serif;cursor:pointer}
#camAlbum .cam-btn:hover{background:rgba(255,255,255,.1)}
#camAlbum .cam-btn.danger{border-color:rgba(215,110,95,.42);color:#ecc0b6}
#camAlbum .cam-empty{grid-column:1/-1;padding:28px 18px;text-align:center;border:1px dashed rgba(220,205,175,.24);color:#c3bcac;font:14px/1.6 Georgia,serif}
#camAlbum .cam-foot{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:20px;padding-top:14px;border-top:1px solid rgba(218,202,166,.2);font:italic 13px Georgia,serif;color:#bdb4a4;text-align:center}
#camAlbum kbd{font:11px system-ui,sans-serif;color:#eee5d4;border:1px solid #817866;padding:2px 6px;border-radius:2px}

#camLight{position:fixed;inset:0;z-index:35;display:none;align-items:center;justify-content:center;padding:clamp(14px,3vw,36px);background:rgba(4,7,9,.94);color:#eee8d9;font-family:Georgia,serif}
#camLight.on{display:flex}
#camLight .cl-wrap{width:min(100%,980px);max-height:94vh;display:flex;flex-direction:column;gap:12px}
#camLight img{display:block;max-width:100%;max-height:70vh;margin:0 auto;object-fit:contain;border:5px solid #e4dcc8;box-shadow:0 18px 60px #000}
#camLight .cl-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
#camLight .cl-info h3{margin:0 0 3px;font:20px Georgia,serif;font-weight:400;color:#f3ecdc}
#camLight .cl-info p{margin:0;font:12px/1.5 system-ui,sans-serif;color:#b2ab9d}
#camLight .cl-note{font:italic 14px/1.5 Georgia,serif;color:#e0d7c2;margin-top:4px}
#camLight .cl-btns{display:flex;gap:8px;flex-wrap:wrap}
#camLight button{border:1px solid rgba(230,220,200,.32);background:rgba(255,255,255,.05);color:#f2ebda;padding:7px 12px;font:12px system-ui,sans-serif;cursor:pointer}
#camLight button:hover{background:rgba(255,255,255,.12)}

@keyframes camDevelop{0%{opacity:0;filter:blur(12px) brightness(2.2) sepia(1)}45%{opacity:.85;filter:blur(5px) brightness(1.4) sepia(.7)}100%{opacity:1;filter:none}}
@media(prefers-reduced-motion:reduce){#camAlbum .cam-photo{animation-duration:1ms;animation-delay:0s!important}}
@media(max-width:620px){#camAlbum .cam-photo::after{aspect-ratio:16/9}#camAlbum .cam-grid{grid-template-columns:1fr;gap:12px}#camAlbum .cam-sheet{max-height:92vh}#camAlbum .cam-photo img{aspect-ratio:16/9}}
`;
  document.head.appendChild(camStyle);

  // ---------- Modo Visor ----------
  const finderEl = document.createElement('div');
  finderEl.id = 'camFinder';
  finderEl.setAttribute('aria-hidden', 'true');
  finderEl.innerHTML =
    '<div class="cf-vig"></div>' +
    '<div class="cf-frame">' +
    '<div class="cf-grid-h"></div><div class="cf-grid-v"></div>' +
    '<i class="cf-corner cf-tl"></i><i class="cf-corner cf-tr"></i><i class="cf-corner cf-bl"></i><i class="cf-corner cf-br"></i>' +
    '<div class="cf-ret"></div>' +
    '<div class="cf-top"><span class="cf-place"><i class="cf-dot"></i><b id="cfPlace">Isla</b></span><span class="cf-meta" id="cfMeta">1.35×</span></div>' +
    '<div class="cf-bot">' +
    '<span class="cf-desk">Clic o P · fotografiar · Rueda o +/- · zoom · Mayús+P · descargar PNG · Clic der. · cerrar</span>' +
    '<span class="cf-touch">' +
    '<button type="button" class="cf-btn" data-cf="zout">−</button>' +
    '<span id="cfZoomTxt">1.4×</span>' +
    '<button type="button" class="cf-btn" data-cf="zin">+</button>' +
    '<button type="button" class="cf-btn cf-shoot" data-cf="shoot">📷 Fotografiar</button>' +
    '<button type="button" class="cf-btn" data-cf="close">Cerrar</button>' +
    '</span></div></div>';
  document.body.appendChild(finderEl);

  const finder = { on: false, zoomIdx: 1, zoom: ZOOM_STEPS[1] };
  window.__boisCamFinder = finder;

  function updateFinderUI() {
    if (!finder.on) return;
    const pl = document.getElementById('cfPlace');
    const mt = document.getElementById('cfMeta');
    const zt = document.getElementById('cfZoomTxt');
    const zLabel = finder.zoom.toFixed(1) + '×';
    if (pl) pl.textContent = camDetectPlace();
    if (mt) mt.textContent = zLabel + ' · ' + camDetectMood();
    if (zt) zt.textContent = zLabel;
  }

  function openFinder() {
    if (finder.on || (typeof S !== 'undefined' && !S.on) || (typeof CIN !== 'undefined' && CIN.on) || window.__boisGuideOverlayOpen) return;
    finder.on = true;
    finder.zoomIdx = 1;
    finder.zoom = ZOOM_STEPS[1];
    finderEl.classList.toggle('is-touch', typeof touch !== 'undefined' && !!touch);
    finderEl.classList.add('on');
    finderEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cam-finder-active');
    updateFinderUI();
    if (typeof auHit === 'function') auHit(1650, 0.04, 0.06);
  }

  function closeFinder() {
    if (!finder.on) return;
    finder.on = false;
    finderEl.classList.remove('on');
    finderEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cam-finder-active');
  }

  function stepFinderZoom(dir) {
    if (!finder.on) return;
    const next = Math.max(0, Math.min(ZOOM_STEPS.length - 1, finder.zoomIdx + (dir > 0 ? 1 : -1)));
    if (next === finder.zoomIdx) return;
    finder.zoomIdx = next;
    finder.zoom = ZOOM_STEPS[next];
    updateFinderUI();
    if (typeof auHit === 'function') auHit(1250 + next * 220, 0.025, 0.05);
  }

  window.__boisCamFinderOpen = openFinder;
  window.__boisCamFinderClose = closeFinder;
  window.__boisCamFinderZoom = stepFinderZoom;
  window.__boisCamFinderUpdate = updateFinderUI;

  finderEl.addEventListener('click', e => {
    const b = e.target.closest('[data-cf]');
    if (!b) return;
    e.stopPropagation();
    const act = b.dataset.cf;
    if (act === 'zin') stepFinderZoom(1);
    else if (act === 'zout') stepFinderZoom(-1);
    else if (act === 'close') closeFinder();
    else if (act === 'shoot') {
      if (typeof shot !== 'undefined') { shot = true; shotDl = false; }
    }
  });

  // ---------- Captura síncrona en el frame de render ----------
  function downloadCanvasPng(canvas, filename) {
    canvas.toBlob(b => {
      if (!b) { if (typeof showMsg === 'function') showMsg('No se pudo descargar la foto'); return; }
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, 'image/png');
  }

  function downloadDataUrlPng(dataUrl, filename) {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 800;
      c.height = img.naturalHeight || 500;
      c.getContext('2d').drawImage(img, 0, 0);
      downloadCanvasPng(c, filename);
    };
    img.src = dataUrl;
  }

  window.__boisCapturePhoto = (canvas, downloadPng) => {
    let saved = false;
    try {
      const w = Math.min(800, canvas.width || 800);
      const h = Math.max(1, Math.round((canvas.height || 500) * (w / (canvas.width || 800))));
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const ctx = off.getContext('2d');
      ctx.drawImage(canvas, 0, 0, w, h);
      const dataUrl = off.toDataURL('image/jpeg', 0.82);
      const now = new Date();
      const entry = {
        id: 'ph_' + now.getTime().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        img: dataUrl,
        place: camDetectPlace(),
        mood: camDetectMood(),
        date: camFormatDate(now),
        ts: now.getTime(),
        note: ''
      };
      if (userPhotos.length >= MAX_PHOTOS) userPhotos.pop();
      userPhotos.unshift(entry);
      saved = saveUserPhotos();
      if (saved) { preferredTab = 'mine'; if (typeof window.__boisMarkBackupDirty === 'function') window.__boisMarkBackupDirty(); }
    } catch (e) {
      console.warn('Captura personal:', e);
    }

    if (downloadPng) {
      try {
        downloadCanvasPng(canvas, 'bois-io-' + Date.now() + '.png');
      } catch (e) {
        console.warn('Descarga PNG:', e);
      }
    }

    closeFinder();
    if (typeof window.camFlash === 'function') window.camFlash();
    if (typeof showMsg === 'function') {
      if (downloadPng && saved) showMsg('📷 Foto guardada en tu álbum y descargada · V');
      else if (downloadPng) showMsg('📷 Foto descargada');
      else if (saved) showMsg('📷 Recuerdo guardado en tu álbum · V');
      else showMsg('📷 Foto tomada');
    }
  };

  // ---------- Modal del Álbum ----------
  const camAlbum = document.createElement('div');
  camAlbum.id = 'camAlbum';
  camAlbum.innerHTML =
    '<section class="cam-sheet">' +
    '<header class="cam-head"><div><div class="cam-kicker">ARCHIVO FOTOGRÁFICO · BOIS.IO</div><h2>Álbum de la cámara</h2><p id="camSubtitle">Cuatro recuerdos velados por el tiempo y tus propias fotografías de la isla.</p></div><button class="cam-close" type="button" aria-label="Cerrar álbum">× <span>Cerrar</span></button></header>' +
    '<div class="cam-tabs" role="tablist"><button type="button" class="cam-tab" data-tab="story" role="tab">Cámara antigua (4)</button><button type="button" class="cam-tab" data-tab="mine" role="tab">Mis fotos de la isla (<span id="camMineCount">0</span>)</button></div>' +
    '<div class="cam-grid" id="camGrid"></div>' +
    '<footer class="cam-foot"><span>«Fragmentos de una isla que todavía me reconoce...»</span><kbd>P</kbd> visor y foto · <kbd>V</kbd> volver a abrir · <kbd>ESC</kbd> cerrar</footer>' +
    '</section>';
  document.body.appendChild(camAlbum);
  window.camAlbum = camAlbum;

  // ---------- Lightbox para ver fotos personales en grande ----------
  const lightEl = document.createElement('div');
  lightEl.id = 'camLight';
  lightEl.innerHTML =
    '<div class="cl-wrap">' +
    '<img id="clImg" src="" alt="Fotografía personal de BOIS.IO">' +
    '<div class="cl-bar"><div class="cl-info"><h3 id="clPlace"></h3><p id="clMeta"></p><div class="cl-note" id="clNote"></div></div>' +
    '<div class="cl-btns"><button type="button" id="clPrev">← Anterior</button><button type="button" id="clNext">Siguiente →</button><button type="button" id="clDl">Descargar PNG</button><button type="button" id="clClose">Cerrar</button></div></div></div>';
  document.body.appendChild(lightEl);

  function renderLightbox() {
    if (lightIndex < 0 || lightIndex >= userPhotos.length) {
      lightEl.classList.remove('on');
      lightIndex = -1;
      return;
    }
    const p = userPhotos[lightIndex];
    document.getElementById('clImg').src = p.img;
    document.getElementById('clPlace').textContent = p.place || 'En algún lugar de la isla';
    document.getElementById('clMeta').textContent = [p.date, p.mood].filter(Boolean).join(' · ');
    const nEl = document.getElementById('clNote');
    nEl.textContent = p.note ? '«' + p.note + '»' : '';
    nEl.style.display = p.note ? 'block' : 'none';
    document.getElementById('clPrev').disabled = lightIndex <= 0;
    document.getElementById('clNext').disabled = lightIndex >= userPhotos.length - 1;
    lightEl.classList.add('on');
  }

  function closeLightbox() {
    lightIndex = -1;
    lightEl.classList.remove('on');
  }

  document.getElementById('clPrev').addEventListener('click', () => { if (lightIndex > 0) { lightIndex--; renderLightbox(); } });
  document.getElementById('clNext').addEventListener('click', () => { if (lightIndex < userPhotos.length - 1) { lightIndex++; renderLightbox(); } });
  document.getElementById('clDl').addEventListener('click', () => {
    const p = userPhotos[lightIndex];
    if (p) downloadDataUrlPng(p.img, 'bois-recuerdo-' + (p.ts || Date.now()) + '.png');
  });
  document.getElementById('clClose').addEventListener('click', closeLightbox);
  lightEl.addEventListener('click', e => { if (e.target === lightEl) closeLightbox(); });

  function renderAlbum() {
    const grid = document.getElementById('camGrid');
    const countEl = document.getElementById('camMineCount');
    const subEl = document.getElementById('camSubtitle');
    if (countEl) countEl.textContent = String(userPhotos.length);
    camAlbum.querySelectorAll('.cam-tab').forEach(b => {
      const on = b.dataset.tab === activeTab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    if (activeTab === 'story') {
      if (subEl) subEl.textContent = 'Cuatro recuerdos velados por el tiempo, aún reconocibles.';
      if (typeof STORY !== 'undefined' && !STORY.flags.gotCam) {
        grid.innerHTML = '<div class="cam-empty">Todavía no has recogido la cámara antigua en la playa del despertar.</div>';
        return;
      }
      grid.innerHTML = (typeof CAM_PHOTOS !== 'undefined' ? CAM_PHOTOS : []).map((p, i) =>
        '<article class="cam-photo"><img loading="lazy" src="' + camEsc(p.img) + '" alt="Fotografía dañada: ' + camEsc(p.title) + '"><h3>' + (i + 1) + '. ' + camEsc(p.title) + '</h3><p>' + camEsc(p.desc) + '</p><small>' + camEsc(p.damage) + '</small></article>'
      ).join('');
      return;
    }

    if (subEl) subEl.textContent = 'Tus propias capturas de la isla (' + userPhotos.length + '/' + MAX_PHOTOS + '), guardadas en este navegador.';
    if (!userPhotos.length) {
      grid.innerHTML = '<div class="cam-empty">Todavía no has guardado fotografías propias.<br>Mientras caminas o conduces, pulsa <b>P</b> para abrir el visor y tomar tu primera foto.</div>';
      return;
    }

    grid.innerHTML = userPhotos.map((p, idx) => {
      const isEditing = editingId === p.id;
      const isConfirmDel = confirmDeleteId === p.id;
      const noteBlock = isEditing
        ? '<div class="cam-note-edit"><input type="text" maxlength="120" value="' + camEsc(p.note || '') + '" placeholder="Escribe un recuerdo de este momento…" data-note-input="' + camEsc(p.id) + '"><button type="button" class="cam-btn" data-act="save-note" data-id="' + camEsc(p.id) + '">Guardar</button><button type="button" class="cam-btn" data-act="cancel-note">Cancelar</button></div>'
        : (p.note
          ? '<div class="cam-mine-note">«' + camEsc(p.note) + '»</div>'
          : '');
      return '<article class="cam-mine-card">' +
        '<img loading="lazy" src="' + camEsc(p.img) + '" alt="Foto personal en ' + camEsc(p.place) + '" data-act="view" data-idx="' + idx + '">' +
        '<div class="cam-mine-title">' + camEsc(p.place || 'En la isla') + '</div>' +
        '<div class="cam-mine-meta">' + camEsc([p.date, p.mood].filter(Boolean).join(' · ')) + '</div>' +
        noteBlock +
        '<div class="cam-actions">' +
        '<button type="button" class="cam-btn" data-act="view" data-idx="' + idx + '">Ver grande</button>' +
        '<button type="button" class="cam-btn" data-act="edit-note" data-id="' + camEsc(p.id) + '">' + (p.note ? 'Editar nota' : 'Añadir nota') + '</button>' +
        '<button type="button" class="cam-btn" data-act="dl" data-idx="' + idx + '">Descargar PNG</button>' +
        '<button type="button" class="cam-btn danger" data-act="del" data-id="' + camEsc(p.id) + '">' + (isConfirmDel ? '¿Seguro? Borrar' : 'Borrar') + '</button>' +
        '</div></article>';
    }).join('');

    if (editingId) {
      const inp = grid.querySelector('input[data-note-input]');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
  }

  camAlbum.querySelectorAll('.cam-tab').forEach(b => {
    b.addEventListener('click', () => {
      activeTab = b.dataset.tab;
      preferredTab = activeTab;
      editingId = null;
      confirmDeleteId = null;
      renderAlbum();
    });
  });

  document.getElementById('camGrid').addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const id = el.dataset.id;
    const idx = Number(el.dataset.idx);
    if (act === 'view' && Number.isInteger(idx)) {
      lightIndex = idx;
      renderLightbox();
    } else if (act === 'dl' && Number.isInteger(idx) && userPhotos[idx]) {
      const p = userPhotos[idx];
      downloadDataUrlPng(p.img, 'bois-recuerdo-' + (p.ts || Date.now()) + '.png');
    } else if (act === 'edit-note' && id) {
      editingId = id;
      confirmDeleteId = null;
      renderAlbum();
    } else if (act === 'cancel-note') {
      editingId = null;
      renderAlbum();
    } else if (act === 'save-note' && id) {
      const inp = camAlbum.querySelector('input[data-note-input]');
      const p = userPhotos.find(x => x.id === id);
      if (p && inp) {
        p.note = inp.value.trim().slice(0, 120);
        saveUserPhotos();
      }
      editingId = null;
      renderAlbum();
    } else if (act === 'del' && id) {
      if (confirmDeleteId !== id) {
        confirmDeleteId = id;
        clearTimeout(confirmDeleteTimer);
        confirmDeleteTimer = setTimeout(() => { if (confirmDeleteId === id) { confirmDeleteId = null; if (camAlbum.style.display !== 'none') renderAlbum(); } }, 3200);
        renderAlbum();
      } else {
        confirmDeleteId = null;
        userPhotos = userPhotos.filter(x => x.id !== id);
        saveUserPhotos();
        renderAlbum();
      }
    }
  });

  document.getElementById('camGrid').addEventListener('keydown', e => {
    if (!e.target.matches('input[data-note-input]')) return;
    e.stopPropagation();
    if (e.code === 'Enter') {
      e.preventDefault();
      const id = e.target.dataset.noteInput;
      const p = userPhotos.find(x => x.id === id);
      if (p) {
        p.note = e.target.value.trim().slice(0, 120);
        saveUserPhotos();
      }
      editingId = null;
      renderAlbum();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      editingId = null;
      renderAlbum();
    }
  });

  function openCameraGallery(tab) {
    const hasCam = typeof STORY !== 'undefined' && !!STORY.flags.gotCam;
    if (!hasCam && userPhotos.length === 0) return;
    closeFinder();
    if (tab === 'story' || tab === 'mine') activeTab = tab;
    else if (!hasCam) activeTab = 'mine';
    else activeTab = preferredTab || 'story';
    editingId = null;
    confirmDeleteId = null;
    renderAlbum();
    camAlbum.style.display = 'flex';
    if (typeof S !== 'undefined') S.on = false;
    if (document.pointerLockElement) {
      window.__boisGuideIgnoreNextUnlock = true;
      document.exitPointerLock?.();
    }
  }

  function closeCameraGallery() {
    if (camAlbum.style.display === 'none') return;
    closeLightbox();
    editingId = null;
    confirmDeleteId = null;
    camAlbum.style.display = 'none';
    if (typeof S !== 'undefined') S.on = true;
    if ((typeof touch === 'undefined' || !touch) && !window.__boisGuideOverlayOpen && !(typeof CIN !== 'undefined' && CIN.on)) {
      document.getElementById('c')?.requestPointerLock?.();
    }
  }

  window.openCameraGallery = openCameraGallery;
  window.closeCameraGallery = closeCameraGallery;

  camAlbum.querySelector('.cam-close').addEventListener('click', closeCameraGallery);
  camAlbum.addEventListener('click', e => { if (e.target === camAlbum) closeCameraGallery(); });
  document.addEventListener('keydown', e => {
    if (lightEl.classList.contains('on')) {
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); closeLightbox(); return; }
      if (e.code === 'ArrowLeft' && lightIndex > 0) { e.preventDefault(); lightIndex--; renderLightbox(); return; }
      if (e.code === 'ArrowRight' && lightIndex < userPhotos.length - 1) { e.preventDefault(); lightIndex++; renderLightbox(); return; }
    }
    if (camAlbum.style.display !== 'none') {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.code === 'Escape' || (e.code === 'KeyV' && !e.repeat)) {
        e.preventDefault();
        closeCameraGallery();
      }
    }
  });
})();
