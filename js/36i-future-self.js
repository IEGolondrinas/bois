/* BOIS.IO · 36i-future-self.js — Recuerdos entre épocas, fechas clave, 5.º nicho y paseo tranquilo */
try {
  (() => {
    const TIME_KEY = 'bois_time_meta';
    const MON_KEY = 'bois_future_monument';
    const BK_META_KEY = 'bois_backup_meta';
    const fsEsc = v => String(v == null ? '' : v).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

    // ---------- 1. Tiempo real transcurrido entre visitas ----------
    function loadTimeMeta() {
      try {
        const o = JSON.parse(localStorage.getItem(TIME_KEY) || 'null');
        if (o && typeof o === 'object' && Number.isFinite(o.firstVisitTs)) return o;
      } catch (e) {}
      return null;
    }
    const nowTs = Date.now();
    let timeMeta = loadTimeMeta();
    const prevVisitTs = timeMeta && Number.isFinite(timeMeta.lastVisitTs) ? timeMeta.lastVisitTs : nowTs;
    if (!timeMeta) {
      timeMeta = { firstVisitTs: nowTs, lastVisitTs: nowTs, visits: 1 };
    } else {
      timeMeta = {
        firstVisitTs: Math.min(timeMeta.firstVisitTs, nowTs),
        lastVisitTs: nowTs,
        visits: (Number(timeMeta.visits) || 1) + 1
      };
    }
    try { localStorage.setItem(TIME_KEY, JSON.stringify(timeMeta)); } catch (e) {}

    function formatElapsed(ms) {
      if (!Number.isFinite(ms) || ms < 86400000) return '';
      const totalDays = Math.floor(ms / 86400000);
      if (totalDays < 30) return totalDays === 1 ? '1 día' : totalDays + ' días';
      const years = Math.floor(totalDays / 365);
      const remDays = totalDays % 365;
      const months = Math.floor(remDays / 30);
      const days = remDays % 30;
      const parts = [];
      if (years > 0) parts.push(years === 1 ? '1 año' : years + ' años');
      if (months > 0) parts.push(months === 1 ? '1 mes' : months + ' meses');
      if (years === 0 && days > 0) parts.push(days === 1 ? '1 día' : days + ' días');
      return parts.join(' y ');
    }

    function formatShortDate(ts) {
      try {
        return new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        return '';
      }
    }

    // Saludo sereno al entrar si pasó al menos 1 día desde la última visita
    let returnGreeted = false;
    const elapsedSinceLast = nowTs - prevVisitTs;
    const elapsedText = formatElapsed(elapsedSinceLast);
    if (elapsedText) {
      const greetTimer = setInterval(() => {
        if (returnGreeted) { clearInterval(greetTimer); return; }
        if (typeof S !== 'undefined' && S.on && !(typeof CIN !== 'undefined' && CIN.on) && !window.__boisWakeLock) {
          returnGreeted = true;
          clearInterval(greetTimer);
          setTimeout(() => {
            if (typeof showMsg === 'function' && S.on) {
              showMsg('Volviste a la isla después de ' + elapsedText);
            }
          }, 1400);
        }
      }, 900);
    }

    window.__boisFutureTimeHTML = () => {
      const m = loadTimeMeta() || timeMeta;
      const sinceFirst = formatElapsed(Date.now() - m.firstVisitTs);
      const firstStr = formatShortDate(m.firstVisitTs);
      return '<div class="bgBlock"><strong>Archivo personal · tu paso por la isla</strong>' +
        '<p class="bgMuted">Primera visita registrada: ' + fsEsc(firstStr || 'Hoy') +
        (sinceFirst ? ' · Hace ' + fsEsc(sinceFirst) : ' · Hoy comenzó este archivo') +
        ' · Visitas: ' + fsEsc(m.visits || 1) + '</p></div>';
    };

    // ---------- 2. Fechas clave silenciosas (8 mar, 10 ago, 22 nov) ----------
    function detectSpecialDate() {
      try {
        const d = new Date();
        const key = (d.getMonth() + 1) + '-' + d.getDate();
        if (key === '3-8') {
          return {
            code: 'birthday',
            title: '8 de marzo',
            wish: 'Feliz cumpleaños. Hoy la isla guarda más estrellas fugaces y luciérnagas junto al lago.'
          };
        }
        if (key === '8-10') {
          return {
            code: 'aug10',
            title: '10 de agosto',
            wish: '10 de agosto. Una fecha para recordar todo lo que lograste sin exigirte de más.'
          };
        }
        if (key === '11-22') {
          return {
            code: 'nov22',
            title: '22 de noviembre',
            wish: '22 de noviembre. Otro año más mirando el agua; algunas palabras siguen vivas aquí.'
          };
        }
      } catch (e) {}
      return null;
    }
    const special = detectSpecialDate();
    window.__boisSpecialDate = special;

    let specialBenchGroup = null;
    let specialBenchShown = false;
    function buildSpecialBenchGlow() {
      if (!special || specialBenchGroup || typeof scene === 'undefined') return;
      const k = window.__katherin;
      if (!k || !k.userData || !k.userData.bench) return;
      const b = k.userData.bench;
      const g = new THREE.Group();
      const count = 14;
      const dots = [];
      const geo = new THREE.SphereGeometry(0.045, 6, 6);
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xffdf94 : 0xc8ff8c,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const m = new THREE.Mesh(geo, mat);
        m.userData = { a: (i / count) * Math.PI * 2, r: 1.4 + (i % 4) * 0.75, h: 0.7 + (i % 5) * 0.35, sp: 0.55 + (i % 3) * 0.25 };
        g.add(m);
        dots.push(m);
      }
      g.position.set(b.x, b.h, b.z);
      g.userData.dots = dots;
      scene.add(g);
      specialBenchGroup = g;
    }

    // ---------- 3. Tu recuerdo en el Parque de los Cisnes (5.º nicho) ----------
    function loadMonument() {
      try {
        const o = JSON.parse(localStorage.getItem(MON_KEY) || 'null');
        if (o && typeof o === 'object' && !Array.isArray(o)) return o;
      } catch (e) {}
      return null;
    }
    function saveMonument(data) {
      try {
        if (!data) { localStorage.removeItem(MON_KEY); return true; }
        localStorage.setItem(MON_KEY, JSON.stringify(data));
        window.__boisMarkBackupDirty?.();
        rebuildMonumentMesh();
        return true;
      } catch (e) {
        return false;
      }
    }
    function loadUserPhotosSafe() {
      try {
        const a = JSON.parse(localStorage.getItem('bois_user_photos') || '[]');
        return Array.isArray(a) ? a.filter(p => p && typeof p.img === 'string') : [];
      } catch (e) {
        return [];
      }
    }

    let easelGroup = null;
    let easelPhotoMesh = null;
    let easelTex = null;
    let easelNear = false;

    function refreshMonumentTexture() {
      if (!easelPhotoMesh) return;
      const mon = loadMonument();
      const photos = loadUserPhotosSafe();
      const chosen = mon && mon.photoId ? photos.find(p => p.id === mon.photoId) : null;
      if (easelTex) { easelTex.dispose(); easelTex = null; }
      if (chosen && chosen.img) {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = 256; c.height = 176;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, 256, 176);
          easelTex = new THREE.CanvasTexture(c);
          easelTex.encoding = THREE.sRGBEncoding;
          easelPhotoMesh.material.map = easelTex;
          easelPhotoMesh.material.color.setHex(0xffffff);
          easelPhotoMesh.material.needsUpdate = true;
        };
        img.src = chosen.img;
      } else {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 176;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#243036';
        ctx.fillRect(0, 0, 256, 176);
        ctx.strokeStyle = '#d4c196';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 236, 156);
        ctx.fillStyle = '#efe6d4';
        ctx.font = 'italic 16px Georgia,serif';
        ctx.textAlign = 'center';
        ctx.fillText('«Todavía cabe»', 128, 86);
        ctx.fillStyle = '#b9ad94';
        ctx.font = '11px system-ui,sans-serif';
        ctx.fillText(mon && mon.date ? mon.date : 'Un recuerdo tuyo', 128, 114);
        easelTex = new THREE.CanvasTexture(c);
        easelTex.encoding = THREE.sRGBEncoding;
        easelPhotoMesh.material.map = easelTex;
        easelPhotoMesh.material.color.setHex(0xffffff);
        easelPhotoMesh.material.needsUpdate = true;
      }
    }

    function rebuildMonumentMesh() {
      const ch7Done = typeof STORY !== 'undefined' && STORY.flags && !!STORY.flags.ch7_complete;
      const mon = loadMonument();
      const shouldShow = ch7Done && !!(mon && (mon.photoId || mon.caption));
      if (!shouldShow) {
        if (easelGroup) easelGroup.visible = false;
        return;
      }
      if (!easelGroup) {
        const k = window.__katherin;
        if (!k || !k.userData || !k.userData.bench || typeof scene === 'undefined') return;
        const b = k.userData.bench;
        const x = b.x + Math.cos(b.a) * 2.55;
        const z = b.z - Math.sin(b.a) * 2.55;
        const y = typeof ground === 'function' ? ground(x, z, 50) : b.h;
        const g = new THREE.Group();
        const wood = new THREE.MeshStandardMaterial({ color: 0x5c402c, roughness: 0.85 });
        const mat = new THREE.MeshStandardMaterial({ color: 0xe6decb, roughness: 0.9 });
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, 0.05), wood);
        legL.position.set(-0.24, 0.54, -0.05); legL.rotation.z = -0.08; legL.rotation.x = 0.1;
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, 0.05), wood);
        legR.position.set(0.24, 0.54, -0.05); legR.rotation.z = 0.08; legR.rotation.x = 0.1;
        const legB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, 0.05), wood);
        legB.position.set(0, 0.52, -0.26); legB.rotation.x = -0.32;
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.54, 0.045), wood);
        board.position.set(0, 1.04, 0.02); board.rotation.x = -0.14;
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.46, 0.02), mat);
        frame.position.set(0, 1.04, 0.048); frame.rotation.x = -0.14;
        const photo = new THREE.Mesh(
          new THREE.PlaneGeometry(0.60, 0.40),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        photo.position.set(0, 1.04, 0.06); photo.rotation.x = -0.14;
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(0.55, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xffe4ad, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        halo.position.set(0, 1.04, 0.08);
        g.add(legL, legR, legB, board, frame, photo, halo);
        g.position.set(x, y, z);
        g.rotation.y = b.a;
        scene.add(g);
        easelGroup = g;
        easelPhotoMesh = photo;
      }
      easelGroup.visible = true;
      refreshMonumentTexture();
    }

    // Modal sereno para contemplar el recuerdo colocado en el parque
    const monModal = document.createElement('div');
    monModal.id = 'boisMonModal';
    monModal.style.cssText = 'position:fixed;inset:0;z-index:34;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(4,7,9,.86);backdrop-filter:blur(8px);color:#eee8d9;font-family:Georgia,serif';
    monModal.innerHTML =
      '<div style="width:min(560px,94vw);background:rgba(16,22,25,.97);border:1px solid rgba(220,205,175,.32);padding:20px;box-shadow:0 22px 80px #000">' +
      '<div style="font:10px system-ui,sans-serif;letter-spacing:2.4px;color:#c0b292;text-transform:uppercase">Parque de los Cisnes · Tu recuerdo</div>' +
      '<img id="bmImg" src="" alt="Recuerdo personal" style="display:none;width:100%;max-height:52vh;object-fit:cover;margin:12px 0;border:5px solid #e4dcc8">' +
      '<p id="bmCap" style="font:italic 17px/1.6 Georgia,serif;color:#f1ead8;margin:12px 0 6px"></p>' +
      '<p id="bmMeta" style="font:12px system-ui,sans-serif;color:#a7a194;margin:0 0 16px"></p>' +
      '<div style="display:flex;justify-content:flex-end"><button type="button" id="bmClose" style="border:1px solid rgba(230,220,200,.32);background:transparent;color:#eee8d9;padding:7px 14px;font:12px system-ui,sans-serif;cursor:pointer">Cerrar</button></div></div>';
    document.body.appendChild(monModal);

    function closeMonModal() {
      if (monModal.style.display === 'none') return;
      monModal.style.display = 'none';
      if (typeof S !== 'undefined') S.on = true;
      if ((typeof touch === 'undefined' || !touch) && !window.__boisGuideOverlayOpen && !(typeof CIN !== 'undefined' && CIN.on)) {
        document.getElementById('c')?.requestPointerLock?.();
      }
    }
    document.getElementById('bmClose').addEventListener('click', closeMonModal);
    monModal.addEventListener('click', e => { if (e.target === monModal) closeMonModal(); });
    document.addEventListener('keydown', e => { if (monModal.style.display !== 'none' && e.code === 'Escape') { e.preventDefault(); closeMonModal(); } });

    function openMonModal() {
      const mon = loadMonument();
      if (!mon) return;
      const photos = loadUserPhotosSafe();
      const ph = mon.photoId ? photos.find(p => p.id === mon.photoId) : null;
      const imgEl = document.getElementById('bmImg');
      if (ph && ph.img) { imgEl.src = ph.img; imgEl.style.display = 'block'; }
      else { imgEl.style.display = 'none'; }
      document.getElementById('bmCap').textContent = mon.caption ? '«' + mon.caption + '»' : 'Un momento guardado junto al lago.';
      document.getElementById('bmMeta').textContent = [ph && ph.place, mon.date].filter(Boolean).join(' · ');
      monModal.style.display = 'flex';
      if (typeof S !== 'undefined') S.on = false;
      if (document.pointerLockElement) {
        window.__boisGuideIgnoreNextUnlock = true;
        document.exitPointerLock?.();
      }
      if (typeof auHit === 'function') auHit(880, 0.03, 0.25);
    }

    window.__boisMonumentInteract = () => {
      if (!easelGroup || !easelGroup.visible || (typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on)) return false;
      const d = Math.hypot(S.x - easelGroup.position.x, S.z - easelGroup.position.z);
      if (d <= 2.3) { openMonModal(); return true; }
      return false;
    };

    window.__boisFutureMonumentHTML = () => {
      if (!(typeof STORY !== 'undefined' && STORY.flags && STORY.flags.ch7_complete)) return '';
      const mon = loadMonument();
      const photos = loadUserPhotosSafe();
      const opts = '<option value="">Solo dedicatoria (sin foto)</option>' + photos.map(p =>
        '<option value="' + fsEsc(p.id) + '"' + (mon && mon.photoId === p.id ? ' selected' : '') + '>' + fsEsc((p.place || 'Foto') + ' · ' + (p.date || '')) + '</option>'
      ).join('');
      return '<div class="bgBlock"><strong>Tu recuerdo en el Parque de los Cisnes (5.º nicho)</strong>' +
        '<p class="bgMuted">El espacio que quedaba libre en las torres ahora vive junto a la banca del lago. Elige una de tus fotos o escribe una dedicatoria sobre este momento de tu vida.</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:9px">' +
        '<select id="bgMonPhoto" style="background:#0f1619;border:1px solid rgba(220,215,195,.28);color:#eee9dd;padding:7px;font:12px system-ui">' + opts + '</select>' +
        '<input id="bgMonCap" type="text" maxlength="140" value="' + fsEsc(mon && mon.caption ? mon.caption : '') + '" placeholder="Una frase o dedicatoria para cuando vuelvas…" style="background:rgba(0,0,0,.35);border:1px solid rgba(220,215,195,.28);color:#eee9dd;padding:7px 9px;font:13px Georgia,serif">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" data-mon="save" style="padding:6px 12px;background:rgba(200,185,142,.18);border:1px solid rgba(200,185,142,.55);color:#f3ecdc;font:11px system-ui;cursor:pointer">Colocar junto al lago</button>' +
        (mon ? '<button type="button" data-mon="clear" style="padding:6px 12px;background:transparent;border:1px solid #ffffff30;color:#c9c2b1;font:11px system-ui;cursor:pointer">Quitar del parque</button>' : '') +
        '</div></div></div>';
    };

    // ---------- 4. Modo Paseo tranquilo (desbloqueado tras Cap. VII) ----------
    const SPOTS = [
      { id: 'beach', label: 'Playa del regreso', x: typeof BEACH !== 'undefined' ? BEACH[0] : 420, z: typeof BEACH !== 'undefined' ? BEACH[1] : -380, yaw: 0.7 },
      { id: 'park', label: 'Parque de los Cisnes', x: -120, z: 74, yaw: 2.3 },
      { id: 'summit', label: 'La cumbre', x: -176, z: -295, yaw: 0.4 },
      { id: 'bridge', label: 'El puente', x: 99, z: -174.4, yaw: 0.98 },
      { id: 'towers', label: 'Torres gemelas', x: -18, z: -34, yaw: 0 }
    ];

    window.__boisFreeRoamHTML = () => {
      if (!(typeof STORY !== 'undefined' && STORY.flags && STORY.flags.ch7_complete)) return '';
      const todBtns = [
        ['auto', 'Automática'], ['3', 'Amanecer'], ['0', 'Mediodía'], ['1', 'Atardecer'], ['2', 'Noche']
      ].map(([v, l]) => '<button type="button" data-fr-tod="' + v + '" style="padding:5px 9px;background:transparent;border:1px solid #ffffff30;color:#e6dfce;font:11px system-ui;cursor:pointer">' + l + '</button>').join('');
      const wxBtns = [
        ['0', 'Automático'], ['1', 'Despejado'], ['3', 'Lluvia'], ['5', 'Niebla'], ['4', 'Tormenta']
      ].map(([v, l]) => '<button type="button" data-fr-wx="' + v + '" style="padding:5px 9px;background:transparent;border:1px solid #ffffff30;color:#e6dfce;font:11px system-ui;cursor:pointer">' + l + '</button>').join('');
      const goBtns = SPOTS.map(s => '<button type="button" data-fr-go="' + s.id + '" style="padding:5px 9px;background:rgba(200,185,142,.12);border:1px solid rgba(200,185,142,.38);color:#eee6d4;font:11px system-ui;cursor:pointer">' + fsEsc(s.label) + '</button>').join('');
      return '<div class="bgBlock"><strong>Paseo tranquilo · elegir momento y lugar</strong>' +
        '<p class="bgMuted">Completaste los 7 capítulos. Puedes ajustar al instante la luz, el clima, volver a tus rincones o sentarte frente al lago sin buscar nada.</p>' +
        '<div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="bgMuted" style="min-width:46px">Hora:</span>' + todBtns + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="bgMuted" style="min-width:46px">Clima:</span>' + wxBtns + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="bgMuted" style="min-width:46px">Ir a:</span>' + goBtns + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:2px"><button type="button" data-fr-presence="1" style="padding:6px 11px;background:rgba(158,194,173,.14);border:1px solid rgba(158,194,173,.48);color:#d7efe0;font:11px system-ui;cursor:pointer">Epílogo · Momento de presencia junto al lago</button></div>' +
        '</div></div>';
    };

    function teleportSpot(id) {
      const sp = SPOTS.find(s => s.id === id);
      if (!sp) return;
      let tx = sp.x, tz = sp.z;
      if (id === 'park' && typeof arSpots !== 'undefined' && arSpots[0]) {
        tx = arSpots[0].x + 5; tz = arSpots[0].z + 5;
      }
      if (typeof CAR !== 'undefined' && CAR.on && typeof exitCar === 'function') exitCar();
      if (typeof PR !== 'undefined' && PR.on && typeof PR.exit === 'function') PR.exit();
      if (window.__boisCh6 && window.__boisCh6.on) return;
      S.x = tx; S.z = tz;
      S.y = typeof ground === 'function' ? ground(tx, tz, 50) + 0.1 : S.y;
      S.vy = 0; S.sw = false; S.yaw = sp.yaw; S.pitch = 0;
      if (typeof bgClose === 'function') bgClose('journal');
      if (typeof showMsg === 'function') showMsg(sp.label);
    }

    // ---------- 5. Aviso amable de copia de seguridad ----------
    function loadBkMeta() {
      try {
        const o = JSON.parse(localStorage.getItem(BK_META_KEY) || 'null');
        return o && typeof o === 'object' ? o : { lastExportTs: 0, dirtySinceExport: false };
      } catch (e) {
        return { lastExportTs: 0, dirtySinceExport: false };
      }
    }
    window.__boisMarkBackupDirty = () => {
      try {
        const m = loadBkMeta();
        m.dirtySinceExport = true;
        localStorage.setItem(BK_META_KEY, JSON.stringify(m));
      } catch (e) {}
    };
    window.__boisMarkBackupClean = () => {
      try {
        localStorage.setItem(BK_META_KEY, JSON.stringify({ lastExportTs: Date.now(), dirtySinceExport: false }));
      } catch (e) {}
    };

    window.__boisBackupReminderHTML = () => {
      const m = loadBkMeta();
      const oldExport = m.lastExportTs && (Date.now() - m.lastExportTs > 14 * 86400000);
      if (!m.dirtySinceExport && !oldExport) return '';
      return '<div class="bgBlock" style="background:rgba(200,185,142,.06);padding:12px;border:1px solid rgba(200,185,142,.24);margin-top:10px">' +
        '<strong>Guarda tus recuerdos nuevos</strong>' +
        '<p class="bgMuted" style="margin-top:4px">Tienes fotos o notas escritas recientemente. Exportar una copia de seguridad te asegura conservarlas si cambias de navegador o computador en el futuro.</p>' +
        '<div style="margin-top:9px"><button type="button" data-bk-now="1" style="padding:6px 12px;background:rgba(200,185,142,.18);border:1px solid rgba(200,185,142,.55);color:#f3ecdc;font:11px system-ui;cursor:pointer">Exportar copia de seguridad (.json)</button></div></div>';
    };

    // ---------- Manejador único dentro del Diario (J) ----------
    document.addEventListener('click', e => {
      const jb = document.getElementById('bgJournal');
      if (!jb || !jb.contains(e.target)) return;

      const repBtn = e.target.closest('[data-ntb-reply]');
      if (repBtn) {
        window.__boisNtbEditing = repBtn.dataset.ntbReply;
        if (typeof bgRenderJournal === 'function') bgRenderJournal();
        const inp = jb.querySelector('[data-ntb-input]');
        if (inp) inp.focus();
        return;
      }
      const cancelBtn = e.target.closest('[data-ntb-cancel]');
      if (cancelBtn) {
        window.__boisNtbEditing = null;
        if (typeof bgRenderJournal === 'function') bgRenderJournal();
        return;
      }
      const saveBtn = e.target.closest('[data-ntb-save]');
      if (saveBtn) {
        const id = saveBtn.dataset.ntbSave;
        const inp = jb.querySelector('[data-ntb-input="' + id + '"]');
        if (inp && typeof window.__boisNtbSaveReply === 'function' && window.__boisNtbSaveReply(id, inp.value)) {
          window.__boisNtbEditing = null;
          if (typeof bgRenderJournal === 'function') bgRenderJournal();
          if (typeof showMsg === 'function') showMsg('Guardado en tu libreta');
        }
        return;
      }
      const delBtn = e.target.closest('[data-ntb-del]');
      if (delBtn) {
        if (typeof window.__boisNtbDeleteReply === 'function') {
          window.__boisNtbDeleteReply(delBtn.dataset.ntbDel, delBtn.dataset.ntbRid);
          if (typeof bgRenderJournal === 'function') bgRenderJournal();
        }
        return;
      }
      const monBtn = e.target.closest('[data-mon]');
      if (monBtn) {
        if (monBtn.dataset.mon === 'clear') {
          saveMonument(null);
          if (typeof bgRenderJournal === 'function') bgRenderJournal();
          if (typeof showMsg === 'function') showMsg('Recuerdo retirado del parque');
        } else {
          const sel = document.getElementById('bgMonPhoto');
          const cap = document.getElementById('bgMonCap');
          const photoId = sel ? sel.value : '';
          const caption = cap ? cap.value.trim().slice(0, 140) : '';
          if (!photoId && !caption) {
            if (typeof showMsg === 'function') showMsg('Elige una foto o escribe una dedicatoria');
            return;
          }
          saveMonument({ photoId, caption, date: formatShortDate(Date.now()) });
          if (typeof bgRenderJournal === 'function') bgRenderJournal();
          if (typeof showMsg === 'function') showMsg('Tu recuerdo ya descansa junto al lago');
        }
        return;
      }
      const todBtn = e.target.closest('[data-fr-tod]');
      if (todBtn && typeof TM !== 'undefined' && typeof setTod === 'function') {
        const v = todBtn.dataset.frTod;
        if (v === 'auto') {
          TM.mode = 0;
          TM.timer = 15;
          if (typeof showMsg === 'function') showMsg('Hora: Automática');
        } else {
          const idx = Number(v);
          TM.mode = idx + 1;
          setTod(idx);
        }
        return;
      }
      const wxBtn = e.target.closest('[data-fr-wx]');
      if (wxBtn && typeof WX !== 'undefined' && WX.setMode) {
        const m = WX.setMode(Number(wxBtn.dataset.frWx));
        if (typeof showMsg === 'function') showMsg('Clima: ' + WX.names[m]);
        return;
      }
      const goBtn = e.target.closest('[data-fr-go]');
      if (goBtn) {
        teleportSpot(goBtn.dataset.frGo);
        return;
      }
      const presBtn = e.target.closest('[data-fr-presence]');
      if (presBtn) {
        if (typeof bgClose === 'function') bgClose('journal');
        teleportSpot('park');
        setTimeout(() => playPresenceEpilogue(false), 320);
        return;
      }
      const bkBtn = e.target.closest('[data-bk-now]');
      if (bkBtn) {
        document.getElementById('bkExport')?.click();
        setTimeout(() => { if (typeof bgRenderJournal === 'function') bgRenderJournal(); }, 150);
      }
    });

    // ---------- 6. Epílogo: Presencia (quedarse quieto mirando el lago tras Cap. VII) ----------
    let presencePlaying = false;
    let stillMs = 0;
    let lastPx = null;
    let lastPz = null;
    let presenceHintShown = false;

    function playPresenceEpilogue(isFirstUnlock) {
      if (presencePlaying || typeof playCinematic !== 'function' || (typeof CIN !== 'undefined' && CIN.on)) return;
      if (typeof CAR !== 'undefined' && CAR.on && typeof exitCar === 'function') exitCar();
      if (typeof PR !== 'undefined' && PR.on) return;
      if (window.__boisCh6 && window.__boisCh6.on) return;
      presencePlaying = true;
      stillMs = 0;
      const ly = typeof ground === 'function' ? ground(-125, 110, 50) + 1.2 : (typeof WL !== 'undefined' ? WL + 0.5 : 2);
      const look = typeof THREE !== 'undefined' && THREE.Vector3 ? new THREE.Vector3(-125, ly, 110) : null;
      if (typeof auHit === 'function') auHit(220, 0.025, 0.5);
      const lines = [
        { pause: 1800 },
        { layer: 'presencia', stamp: 'EL LAGO', t: 'El viento mueve apenas los árboles de la orilla.' },
        { pause: 3200 },
        { layer: 'presencia', t: 'Un cisne cruza despacio el agua.' },
        { pause: 3400 },
        { layer: 'presencia', t: 'No estás buscando ninguna señal.' },
        { pause: 2800 },
        { layer: 'presencia', t: 'Solo estás aquí.' },
        { pause: 3000 },
        { layer: 'hoy', stamp: 'SIN PRISA', t: 'No tenías que resolver toda tu vida para permitirte vivirla. Gracias por llegar hasta aquí, Julián.' },
        { pause: 2200 }
      ];
      playCinematic(lines, () => {
        presencePlaying = false;
        if (isFirstUnlock && typeof storyFlag === 'function' && !(typeof STORY !== 'undefined' && STORY.flags && STORY.flags.ch7_presencia)) {
          storyFlag('ch7_presencia', 1);
          if (typeof auHit === 'function') auHit(330, 0.025, 0.45);
          if (typeof showMsg === 'function') showMsg('Epílogo completado · La isla sigue abierta para volver cuando quieras');
        }
      }, look ? { lookAt: look, location: 'EL LAGO · EPÍLOGO · PRESENCIA' } : { location: 'EL LAGO · EPÍLOGO · PRESENCIA' });
    }
    window.__boisPlayPresenceEpilogue = playPresenceEpilogue;

    document.addEventListener('keydown', e => {
      const jb = document.getElementById('bgJournal');
      if (!jb || !jb.contains(e.target) || !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      e.stopPropagation();
      if (e.code === 'Escape' && window.__boisNtbEditing) {
        e.preventDefault();
        window.__boisNtbEditing = null;
        if (typeof bgRenderJournal === 'function') bgRenderJournal();
      }
    });

    // ---------- Tick suave (easel del parque + luciérnagas en fechas clave + quietud de Presencia) ----------
    setInterval(() => {
      if (document.hidden) return;
      try {
        if (!easelGroup) rebuildMonumentMesh();
        const inSub = (typeof PR !== 'undefined' && PR.on) || !!(window.__boisCh6 && window.__boisCh6.on);
        if (easelGroup && easelGroup.visible && !inSub && typeof S !== 'undefined' && S.on && !(typeof CIN !== 'undefined' && CIN.on)) {
          const d = Math.hypot(S.x - easelGroup.position.x, S.z - easelGroup.position.z);
          const n = d < 2.3;
          if (n && !easelNear && typeof showMsg === 'function') showMsg('Tu recuerdo junto al lago · E: contemplar');
          easelNear = n;
        } else {
          easelNear = false;
        }

        // Epílogo de Presencia: tras Cap. VII, si te sientas en la banca (F) o te quedas quieto mirando el lago
        const fl = typeof STORY !== 'undefined' && STORY.flags ? STORY.flags : null;
        if (fl && fl.ch7_complete && !fl.ch7_presencia && !presencePlaying && !inSub && typeof S !== 'undefined' && S.on && !(typeof CIN !== 'undefined' && CIN.on) && !(typeof CAR !== 'undefined' && CAR.on) && !window.__boisGuideOverlayOpen) {
          const kg = window.__katherin;
          const nearBench = kg && kg.visible && Math.hypot(S.x - kg.position.x, S.z - kg.position.z) < 26;
          const nearLake = nearBench || Math.hypot(S.x + 125, S.z - 110) < 92;
          if (nearLake) {
            if (!presenceHintShown && typeof showMsg === 'function') {
              presenceHintShown = true;
              showMsg('Quédate quieto mirando el lago o siéntate en la banca (F)…');
            }
            const moved = lastPx !== null && Math.hypot(S.x - lastPx, S.z - lastPz) > 0.14;
            lastPx = S.x;
            lastPz = S.z;
            if (moved && !window.__boisSitting) {
              stillMs = 0;
            } else {
              stillMs += 550;
              const needed = window.__boisSitting ? 3850 : 7150;
              if (stillMs >= needed) {
                playPresenceEpilogue(true);
              }
            }
          } else {
            stillMs = 0;
            lastPx = null;
            lastPz = null;
          }
        } else {
          stillMs = 0;
        }

        if (special) {
          if (!specialBenchGroup) buildSpecialBenchGlow();
          if (specialBenchGroup) {
            const night = typeof PC !== 'undefined' && PC ? Math.max(PC.night || 0, (PC.dusk || 0) * 0.55) : 0.4;
            const vis = !inSub && night > 0.15;
            specialBenchGroup.visible = vis;
            if (vis) {
              const t = performance.now() * 0.001;
              for (const m of specialBenchGroup.userData.dots) {
                const u = m.userData;
                const ang = u.a + t * u.sp;
                m.position.set(Math.cos(ang) * u.r, u.h + Math.sin(t * 1.4 + u.a) * 0.25, Math.sin(ang) * u.r);
                m.material.opacity = (0.35 + 0.35 * Math.sin(t * 2.2 + u.a * 3)) * Math.min(1, night * 1.2);
              }
            }
            if (!specialBenchShown && !inSub && typeof S !== 'undefined' && S.on && Math.hypot(S.x - specialBenchGroup.position.x, S.z - specialBenchGroup.position.z) < 12) {
              specialBenchShown = true;
              if (typeof showMsg === 'function') showMsg(special.wish);
            }
          }
        }
      } catch (e) {}
    }, 550);
  })();
} catch (err) {
  console.warn('36i-future-self:', err);
}
