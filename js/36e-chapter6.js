/* BOIS.IO · 36e-chapter6.js — Capítulo VI Remastered · Las torres: mirar hacia el pasado
   Remasterizado y optimizado:
   - Fusión estática de geometrías por material y escalera instanciada (~90% menos draw calls)
   - Texturas procedurales deterministas con nitidez anisotrópica y generación 4x más rápida
   - Atmósfera sonora respirante sincronizada con el volumen global y activa durante cinemáticas
   - Detalles narrativos y visuales en Torre A (luz cálida/fría, reloj detenido, cuaderno en aislamiento),
     Puente de cristal, Torre B (vapor en soledad, 5.º nicho sereno sin distorsión) y Último Piso
   - Pausa real al ocultar pestaña y reseteo seguro desde cualquier punto */
try {
  (() => {
    if (window.__boisCh6Loaded) return;
    window.__boisCh6Loaded = true;
    const FL = () => STORY.flags;
    const active = () => !!FL().ch5_complete && !FL().ch6_complete;
    const O6 = { x: 0, y: 240, z: -1400 };
    const GAP = { x: -17.5, z: -16.8 };
    let __wxUpd0 = null;
    const RISE = 0.3, RUN = 0.55, NST = 40, TOP = NST * RISE;

    // Zonas caminables (coordenadas locales x0,x1,z0,z1): Torre A, puente, Torre B, escalera, último piso
    const ZONES = [
      [-48, -30, -9, 9],
      [-30, -6, -2.5, 2.5],
      [-6, 12, -9, 9],
      [12, 34, -2.5, 2.5],
      [34, 56, -9, 9],
    ];

    const M6 = {
      on: false,
      built: false,
      g: null,
      pts: [],
      props: [],
      gates: {},
      an: [],
      alc: {},
      look: {},
      near: '',
      raf: 0,
      last: 0,
      hintAt: 0,
      amb: null,
      fade: null,
      exitBtn: null,
      marker: null,
      markerRAF: 0,
      busy: false,
      city: null,
      decorCity: null,
      cityFar: null,
      fogDensity0: null,
      preloadTimer: 0,
      preloadStarted: false,
      preloadPromise: null,
      preloadReady: false,
      preloadWaiters: [],
      intId: 0,
      preloadPerf: { state: 'idle', ms: 0, started: 0, ended: 0, geo0: null, geo1: null, tex0: null, tex1: null },
    };

    const inZone = (x, z) => {
      for (let i = 0; i < ZONES.length; i++) {
        const r = ZONES[i];
        if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return true;
      }
      return false;
    };
    const hitRect = (x, z, r, m) => x > r[0] - m && x < r[1] + m && z > r[2] - m && z < r[3] + m;
    const SMP = [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]];

    function blocked6(x, z) {
      for (let i = 0; i < SMP.length; i++) {
        if (!inZone(x + SMP[i][0], z + SMP[i][1])) return true;
      }
      for (let i = 0; i < M6.props.length; i++) {
        if (hitRect(x, z, M6.props[i], 0.3)) return true;
      }
      for (const k in M6.gates) {
        const G = M6.gates[k];
        if (!G.open && hitRect(x, z, G.r, 0.4)) return true;
      }
      return false;
    }

    function floorY(x, z) {
      if (x >= 12 && x < 34 && Math.abs(z) <= 2.6) {
        const u = Math.max(0, (x - 12) / RUN);
        const k = Math.min(NST - 1, Math.floor(u));
        const f = Math.min(1, u - k);
        return Math.min(TOP, (k + f) * RISE);
      }
      if (x >= 34) return TOP;
      return 0;
    }

    const __g0 = ground, __b0 = blocked, __ss = stepSurface;
    let __hooksOn = false, __bm = null, __bmV = null;

    const __wxWrap = function (dt, tt) {
      if (__wxUpd0) __wxUpd0.call(WX, dt, tt);
      if (M6.on && scene.fog && !uw && !PR.on) {
        const s = WX.st;
        scene.fog.density = QS[qi].fog * (5 + s.fog * 3 + s.rain + s.sc);
      }
      try {
        if (!__bm) {
          __bm = scene.children.filter(
            (o) => o.geometry && o.geometry.parameters && o.geometry.parameters.height === 520 && o.geometry.type === 'CylinderGeometry'
          );
        }
        if (__bmV !== M6.on) {
          __bmV = M6.on;
          for (let i = 0; i < __bm.length; i++) __bm[i].visible = !M6.on;
        }
      } catch (e) {
        typeof __bw === 'function' && __bw('36e-chapter6#1', e);
      }
    };
    const __gWrap = function (x, z, fy) {
      return M6.on ? O6.y + floorY(x - O6.x, z - O6.z) : __g0(x, z, fy);
    };
    const __bWrap = function (x, y, z) {
      return M6.on ? blocked6(x - O6.x, z - O6.z) : __b0(x, y, z);
    };
    const __ssWrap = function () {
      if (M6.on) {
        try {
          auHit(480 + Math.random() * 90, 0.11, 0.05, 'lowpass');
        } catch (e) {
          typeof __bw === 'function' && __bw('36e-chapter6#2', e);
        }
        return;
      }
      return __ss.apply(this, arguments);
    };

    function installHooks() {
      if (__hooksOn) return;
      __hooksOn = true;
      try {
        if (typeof WX !== 'undefined' && WX.upd) {
          if (!__wxUpd0) __wxUpd0 = WX.upd;
          if (WX.upd !== __wxWrap) WX.upd = __wxWrap;
        }
      } catch (e) {
        console.warn('Capítulo VI (clima):', e);
      }
      ground = __gWrap;
      blocked = __bWrap;
      stepSurface = __ssWrap;
    }

    function uninstallHooks() {
      if (!__hooksOn) return;
      __hooksOn = false;
      __bmV = null;
      try {
        if (__bm) for (let i = 0; i < __bm.length; i++) __bm[i].visible = true;
        ground = __g0;
        blocked = __b0;
        stepSurface = __ss;
        if (__wxUpd0 && typeof WX !== 'undefined' && WX.upd === __wxWrap) WX.upd = __wxUpd0;
      } catch (e) {}
    }
    installHooks();

    // ---------- Utilidades de modelado, texturas y fusión estática ----------
    const __BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
    __BOX_GEO.userData.__shared = true;
    const __CYL_GEO = new Map();
    const __DOT_TEX = new Map();
    const __cylGeo = (r0, r1, seg) => {
      const key = r0 + '|' + r1 + '|' + (seg || 14);
      let g = __CYL_GEO.get(key);
      if (!g) {
        g = new THREE.CylinderGeometry(r0, r1, 1, seg || 14);
        g.userData.__shared = true;
        __CYL_GEO.set(key, g);
      }
      return g;
    };

    const maxAniso = () => {
      try {
        return typeof R !== 'undefined' && R && R.capabilities ? Math.min(4, R.capabilities.getMaxAnisotropy()) : 1;
      } catch (e) {
        return 1;
      }
    };

    const stdM = (c, e, o) =>
      new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0.05, emissive: c, emissiveIntensity: e == null ? 0.3 : e }, o || {}));
    const glassM = (c, op) =>
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: op,
        depthWrite: false,
        side: THREE.DoubleSide,
        emissive: c,
        emissiveIntensity: 0.18,
      });
    const basicM = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
    const glowM = (c, op) =>
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });

    const bx = (p, w, h, d, x, y, z, m, dyn) => {
      const o = new THREE.Mesh(__BOX_GEO, m);
      o.position.set(x, y, z);
      o.scale.set(w, h, d);
      if (dyn) o.userData.dyn = true;
      p.add(o);
      return o;
    };
    const cyl = (p, r0, r1, h, x, y, z, m, seg, dyn) => {
      const o = new THREE.Mesh(__cylGeo(r0, r1, seg), m);
      o.position.set(x, y, z);
      o.scale.y = h;
      if (dyn) o.userData.dyn = true;
      p.add(o);
      return o;
    };

    const frust = (p, w, d, w2, d2, h, x, y, z, m) => {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const ps = geo.attributes.position;
      for (let i = 0; i < ps.count; i++) {
        if (ps.getY(i) < 0) ps.setXYZ(i, ps.getX(i) * (w2 / w), ps.getY(i), ps.getZ(i) * (d2 / d));
      }
      geo.computeVertexNormals();
      const o = new THREE.Mesh(geo, m);
      o.scale.set(w, h, d);
      o.position.set(x, y, z);
      p.add(o);
      return o;
    };

    const txtTex = (w, h, fn, rep, sharp) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      fn(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      if ('SRGBColorSpace' in THREE) t.colorSpace = THREE.SRGBColorSpace;
      else t.encoding = THREE.sRGBEncoding;
      if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
      if (sharp) t.anisotropy = maxAniso();
      return t;
    };

    // Fusiona los descendientes estáticos dentro de un grupo por material y orden de dibujo
    function mergeStaticGroup(rootGroup) {
      if (!rootGroup) return;
      rootGroup.updateMatrixWorld(true);
      const buckets = new Map();
      const toRemove = [];
      const rootInv = new THREE.Matrix4().copy(rootGroup.matrixWorld).invert();
      const relMat = new THREE.Matrix4();

      const walk = (node) => {
        if (!node || (node.userData && (node.userData.noMerge || node.userData.dyn))) return;
        for (let i = 0; i < node.children.length; i++) {
          const ch = node.children[i];
          if (!ch) continue;
          if (ch.userData && (ch.userData.noMerge || ch.userData.dyn)) continue;
          if (ch.isMesh && !ch.isInstancedMesh) {
            const mat = ch.material;
            if (!mat || Array.isArray(mat) || !ch.geometry || !ch.geometry.attributes || !ch.geometry.attributes.position) continue;
            // Mantener sin fusionar materiales con mapa que repiten o animan por separado si tuvieran dyn, pero aquí los no-dyn son estáticos
            const hasUV = !!ch.geometry.attributes.uv;
            const key = mat.uuid + '|' + (hasUV ? 1 : 0) + '|' + (ch.renderOrder || 0) + '|' + (ch.frustumCulled ? 1 : 0);
            let b = buckets.get(key);
            if (!b) {
              b = { mat, hasUV, order: ch.renderOrder || 0, cull: ch.frustumCulled, items: [] };
              buckets.set(key, b);
            }
            b.items.push(ch);
            toRemove.push(ch);
          } else if (!ch.isMesh) {
            walk(ch);
          }
        }
      };
      walk(rootGroup);

      for (const b of buckets.values()) {
        if (b.items.length < 2) {
          const only = b.items[0];
          const idx = toRemove.indexOf(only);
          if (idx >= 0) toRemove.splice(idx, 1);
          continue;
        }
        const baked = [];
        let totalVerts = 0;
        for (let i = 0; i < b.items.length; i++) {
          const m = b.items[i];
          relMat.multiplyMatrices(rootInv, m.matrixWorld);
          const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
          geo.applyMatrix4(relMat);
          if (!geo.attributes.normal) geo.computeVertexNormals();
          totalVerts += geo.attributes.position.count;
          baked.push(geo);
        }
        const posArr = new Float32Array(totalVerts * 3);
        const nrmArr = new Float32Array(totalVerts * 3);
        const uvArr = b.hasUV ? new Float32Array(totalVerts * 2) : null;
        let off = 0;
        for (let i = 0; i < baked.length; i++) {
          const g = baked[i];
          const vc = g.attributes.position.count;
          posArr.set(g.attributes.position.array, off * 3);
          nrmArr.set(g.attributes.normal.array, off * 3);
          if (uvArr && g.attributes.uv) uvArr.set(g.attributes.uv.array, off * 2);
          off += vc;
          g.dispose();
        }
        const merged = new THREE.BufferGeometry();
        merged.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        merged.setAttribute('normal', new THREE.BufferAttribute(nrmArr, 3));
        if (uvArr) merged.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
        merged.computeBoundingSphere();

        const mesh = new THREE.Mesh(merged, b.mat);
        mesh.renderOrder = b.order;
        mesh.frustumCulled = b.cull;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        rootGroup.add(mesh);
      }

      for (let i = 0; i < toRemove.length; i++) {
        const old = toRemove[i];
        if (old.parent) old.parent.remove(old);
        if (old.geometry && (!old.geometry.userData || !old.geometry.userData.__shared)) {
          old.geometry.dispose();
        }
      }
    }

    // ---------- Audio del capítulo (sincronizado con volumen global y cinemáticas) ----------
    const volScale = () => (typeof boisVolGain === 'function' ? boisVolGain() : 1);

    function chime(f) {
      try {
        const C = AU.ctx;
        if (!C || !AU.on) return;
        const v = volScale();
        if (v <= 0.001) return;
        const t = C.currentTime;
        const ratios = [1, 1.5, 2.004];
        for (let i = 0; i < ratios.length; i++) {
          const k = ratios[i];
          const o = C.createOscillator();
          const g = C.createGain();
          o.type = i === 2 ? 'triangle' : 'sine';
          o.frequency.value = f * k;
          const peak = (0.045 / (k * 1.1)) * v;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.045);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.85);
          o.connect(g);
          g.connect(C.destination);
          o.onended = () => {
            try {
              o.disconnect();
              g.disconnect();
            } catch (e) {}
          };
          o.start(t);
          o.stop(t + 1.95);
        }
      } catch (e) {
        typeof __bw === 'function' && __bw('36e-chapter6#3', e);
      }
    }

    let __amb = null;
    function ambStart() {
      try {
        const C = AU.ctx;
        if (!C || !AU.on || __amb) return;
        const lp = C.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 340;
        lp.Q.value = 0.7;

        const g = C.createGain();
        const t = C.currentTime;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.026 * volScale(), t + 2.8);

        const o = C.createOscillator();
        const o2 = C.createOscillator();
        const o3 = C.createOscillator();
        o.type = 'sine';
        o.frequency.value = 55;
        o2.type = 'sine';
        o2.frequency.value = 82.6;
        o3.type = 'triangle';
        o3.frequency.value = 110.2;

        const g3 = C.createGain();
        g3.gain.value = 0.18;

        // Modulación suave de filtro para dar sensación de aire en altura
        const lfo = C.createOscillator();
        const lfoGain = C.createGain();
        lfo.frequency.value = 0.08;
        lfoGain.gain.value = 130;
        lfo.connect(lfoGain);
        lfoGain.connect(lp.frequency);

        o.connect(lp);
        o2.connect(lp);
        o3.connect(g3);
        g3.connect(lp);
        lp.connect(g);
        g.connect(C.destination);

        o.start(t);
        o2.start(t);
        o3.start(t);
        lfo.start(t);
        __amb = { o, o2, o3, lfo, lfoGain, g3, lp, g };
      } catch (e) {
        typeof __bw === 'function' && __bw('36e-chapter6#4', e);
      }
    }

    function ambStop() {
      try {
        if (!__amb) return;
        const C = AU.ctx;
        const a = __amb;
        __amb = null;
        const t = C.currentTime;
        const v = Number.isFinite(a.g.gain.value) ? a.g.gain.value : 0;
        a.g.gain.cancelScheduledValues(t);
        a.g.gain.setValueAtTime(v, t);
        a.g.gain.linearRampToValueAtTime(0, t + 1);
        a.o.stop(t + 1.1);
        a.o2.stop(t + 1.1);
        a.o3.stop(t + 1.1);
        a.lfo.stop(t + 1.1);
        setTimeout(() => {
          try {
            a.o.disconnect();
            a.o2.disconnect();
            a.o3.disconnect();
            a.lfo.disconnect();
            a.lfoGain.disconnect();
            a.g3.disconnect();
            a.lp.disconnect();
            a.g.disconnect();
          } catch (e) {}
        }, 1250);
      } catch (e) {
        typeof __bw === 'function' && __bw('36e-chapter6#5', e);
      }
    }

    (window.__boisVolHooks = window.__boisVolHooks || []).push(() => {
      if (__amb && AU.ctx) {
        const activeAudio = AU.on && (S.on || CIN.on) && !window.__boisGuideOverlayOpen && !document.hidden;
        __amb.g.gain.setTargetAtTime(activeAudio ? 0.026 * volScale() : 0, AU.ctx.currentTime, 0.14);
      }
    });

    const safeInstBounds = (im) => {
      if (typeof im.computeBoundingSphere === 'function') {
        im.computeBoundingSphere();
        im.frustumCulled = true;
      } else {
        im.frustumCulled = false;
      }
    };

    const inst = (p, geo, mat, n, fn) => {
      const im = new THREE.InstancedMesh(geo, mat, n);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const sc = new THREE.Vector3(1, 1, 1);
      const ps = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const t = fn(i);
        ps.set(t[0], t[1], t[2]);
        m4.compose(ps, q, sc);
        im.setMatrixAt(i, m4);
      }
      if (im.instanceMatrix) im.instanceMatrix.needsUpdate = true;
      safeInstBounds(im);
      im.updateMatrix();
      im.matrixAutoUpdate = false;
      p.add(im);
      return im;
    };

    // ---------- Figuras humanas sin rostro ----------
    const FG = { geo: null, mat: {}, hm: {}, halo: null, m2: {} };
    const cmat = (c, e) => {
      const k = c + '_' + e;
      return FG.m2[k] || (FG.m2[k] = stdM(c, e));
    };
    function figGeo() {
      if (FG.geo) return FG.geo;
      const C = (a, b, h, sg, y) => {
        const g = new THREE.CylinderGeometry(a, b, h, sg || 10).translate(0, y || 0, 0);
        g.userData.__shared = true;
        return g;
      };
      const Sg = (r, sx, sy, sz, w, h) => {
        const g = new THREE.SphereGeometry(r, w || 12, h || 9).scale(sx, sy, sz);
        g.userData.__shared = true;
        return g;
      };
      const foot = new THREE.BoxGeometry(0.09, 0.05, 0.23).translate(0, -0.025, 0.06);
      foot.userData.__shared = true;
      const hair = new THREE.SphereGeometry(0.128, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.58)
        .scale(0.94, 1.1, 1.04)
        .translate(0, 0.012, -0.012);
      hair.userData.__shared = true;
      const halo = new THREE.PlaneGeometry(1, 1);
      halo.userData.__shared = true;

      return (FG.geo = {
        thigh: C(0.1, 0.072, 0.46, 10, -0.23),
        shin: C(0.068, 0.046, 0.44, 10, -0.22),
        foot,
        pelvis: Sg(0.17, 1.08, 0.62, 0.82),
        torso: C(0.2, 0.14, 0.52, 12, 0.26),
        chest: Sg(0.21, 1.15, 0.5, 0.72, 14, 10),
        collar: C(0.078, 0.115, 0.06, 10, 0.03),
        neck: C(0.042, 0.05, 0.09, 8, 0.045),
        head: Sg(0.12, 0.92, 1.08, 1, 16, 12),
        arm: C(0.048, 0.038, 0.3, 8, -0.15),
        fore: C(0.038, 0.028, 0.28, 8, -0.14),
        hand: Sg(0.036, 1, 1.2, 0.8, 8, 6),
        sho: Sg(0.057, 1, 1, 1, 10, 8),
        hair,
        halo,
      });
    }
    const figMat = (c, op) => {
      const k = c + '_' + op;
      return (
        FG.mat[k] ||
        (FG.mat[k] = new THREE.MeshStandardMaterial({
          color: c,
          emissive: c,
          emissiveIntensity: 0.55,
          roughness: 0.85,
          metalness: 0,
          transparent: true,
          opacity: op,
        }))
      );
    };
    const haloMat = (c) => {
      if (FG.hm[c]) return FG.hm[c];
      if (!FG.halo) {
        FG.halo = txtTex(64, 64, (x, w, h) => {
          const g = x.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
          g.addColorStop(0, 'rgba(255,255,255,.9)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          x.fillStyle = g;
          x.fillRect(0, 0, w, h);
        });
      }
      return (FG.hm[c] = new THREE.MeshBasicMaterial({
        map: FG.halo,
        color: c,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }));
    };

    function figure(p, x, z, h, col, ry, op, pose, isStatic) {
      const G = figGeo();
      const o_ = op == null ? 0.62 : op;
      const m = figMat(col, o_);
      const s = h / 1.72;
      const g = new THREE.Group();
      const b = new THREE.Group();
      const sit = pose === 'sit' || pose === 'sitBow';
      const bow = pose === 'bow' || pose === 'sitBow';
      const curious = pose === 'curious';
      b.scale.setScalar(s);
      g.add(b);
      const hipY = sit ? 0.5 / s : 0.92;
      const put = (parent, geo, px, py, pz, rx, rz) => {
        const o = new THREE.Mesh(geo, m);
        o.position.set(px, py, pz);
        if (rx) o.rotation.x = rx;
        if (rz) o.rotation.z = rz;
        parent.add(o);
        return o;
      };
      put(b, G.pelvis, 0, hipY, 0);
      const upper = new THREE.Group();
      upper.position.set(0, hipY + 0.02, 0);
      if (bow) upper.rotation.x = 0.24;
      b.add(upper);

      put(upper, G.torso, 0, 0, 0);
      put(upper, G.chest, 0, 0.38, 0);
      put(upper, G.collar, 0, 0.48, 0);
      put(upper, G.neck, 0, 0.5, 0);

      const hdGrp = new THREE.Group();
      hdGrp.position.set(0, 0.71, 0.01);
      if (bow) hdGrp.rotation.x = 0.36;
      else if (curious) {
        hdGrp.rotation.x = -0.16;
        hdGrp.rotation.z = 0.14;
      }
      upper.add(hdGrp);
      put(hdGrp, G.head, 0, 0, 0);
      {
        const hr = new THREE.Mesh(G.hair, figMat(new THREE.Color(col).multiplyScalar(0.5).getHex(), o_));
        hdGrp.add(hr);
      }

      for (const sx of [-1, 1]) {
        if (sit) {
          put(b, G.thigh, sx * 0.09, hipY, 0, -Math.PI / 2);
          const sh = put(b, G.shin, sx * 0.09, hipY, 0.46);
          sh.scale.y = Math.max(1, (hipY - 0.025) / 0.44);
          put(b, G.foot, sx * 0.09, 0.05, 0.46);
        } else {
          put(b, G.thigh, sx * 0.09, hipY, 0, 0, sx * 0.03);
          put(b, G.shin, sx * 0.09, hipY - 0.46, 0);
          put(b, G.foot, sx * 0.09, 0.05, 0);
        }
        const sh = new THREE.Group();
        sh.position.set(sx * 0.25, 0.46, 0);
        upper.add(sh);
        sh.add(new THREE.Mesh(G.arm, m));
        sh.add(new THREE.Mesh(G.sho, m));
        const el = new THREE.Group();
        el.position.y = -0.3;
        sh.add(el);
        el.add(new THREE.Mesh(G.fore, m));
        const hd = new THREE.Mesh(G.hand, m);
        hd.position.y = -0.29;
        el.add(hd);
        if (pose === 'write' && sx === 1) {
          sh.rotation.x = -1.55;
          sh.rotation.z = -0.15;
          el.rotation.x = -0.35;
        } else if (curious && sx === 1) {
          sh.rotation.x = -0.58;
          sh.rotation.z = 0.2;
          el.rotation.x = -0.75;
        } else if (pose === 'bow') {
          sh.rotation.x = -0.22;
          sh.rotation.z = -sx * 0.06;
          el.rotation.x = -0.58;
        } else if (sit) {
          sh.rotation.x = -0.45;
          sh.rotation.z = sx * 0.12;
          el.rotation.x = -1.0;
        } else {
          sh.rotation.z = sx * 0.07;
          el.rotation.x = -0.22;
        }
      }
      if (o_ >= 0.45) {
        const hl = new THREE.Mesh(G.halo, haloMat(col));
        hl.rotation.x = -Math.PI / 2;
        hl.position.y = 0.02;
        hl.scale.setScalar(h * 0.95);
        g.add(hl);
      }
      g.position.set(x, 0, z);
      g.rotation.y = ry || 0;
      p.add(g);
      if (isStatic) mergeStaticGroup(g);
      return g;
    }

    function qSprite(p, x, y, z, ch, col) {
      const t = txtTex(96, 96, (c, w, h) => {
        const gr = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.46);
        gr.addColorStop(0, 'rgba(255,244,200,.42)');
        gr.addColorStop(0.55, 'rgba(190,228,255,.16)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr;
        c.fillRect(0, 0, w, h);
        c.shadowColor = col;
        c.shadowBlur = 10;
        c.fillStyle = col;
        c.font = 'bold 50px Georgia,serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(ch, w / 2, h / 2 + 3);
      });
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
      s.scale.set(0.68, 0.68, 1);
      s.position.set(x, y, z);
      p.add(s);
      return s;
    }

    function desk(p, x, z, m1, m2) {
      const g = new THREE.Group();
      bx(g, 0.94, 0.02, 0.64, x, 0.74, z, m1);
      bx(g, 0.9, 0.04, 0.6, x, 0.71, z, m1);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) cyl(g, 0.035, 0.015, 0.71, x + sx * 0.42, 0.355, z + sz * 0.27, m2, 8);
      }
      for (const sz of [-1, 1]) bx(g, 0.84, 0.02, 0.02, x, 0.6, z + sz * 0.27, m2);
      bx(g, 0.02, 0.02, 0.54, x, 0.25, z, m2);
      M6.props.push([x - 0.5, x + 0.5, z - 0.35, z + 0.35]);

      const r = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      const bk = [0x7a3b3b, 0x3b5a7a, 0x6a7a3b, 0xb89a58];
      bx(g, 0.34, 0.1, 0.5, x + 0.22, 0.6, z, m2);
      bx(g, 0.08, 0.018, 0.025, x + 0.22, 0.6, z + 0.26, m2);
      bx(g, 0.2, 0.035, 0.15, x - 0.22, 0.775, z + 0.05, cmat(bk[(r * 4) | 0], 0.25));
      bx(g, 0.18, 0.03, 0.13, x - 0.22, 0.81, z + 0.05, cmat(bk[((r * 7) | 0) % 4], 0.25));
      if (r > 0.4) bx(g, 0.2, 0.004, 0.28, x + 0.15, 0.762, z - 0.04, cmat(0xe9e1cc, 0.3));
      p.add(g);
      return g;
    }

    function chair(p, x, z, ry, m, collide = false) {
      const g = new THREE.Group();
      bx(g, 0.45, 0.03, 0.45, 0, 0.45, 0, m);
      bx(g, 0.42, 0.02, 0.42, 0, 0.475, 0, m);

      const br = new THREE.Group();
      bx(br, 0.04, 0.45, 0.04, -0.18, 0.225, 0, m);
      bx(br, 0.04, 0.45, 0.04, 0.18, 0.225, 0, m);
      bx(br, 0.4, 0.15, 0.03, 0, 0.37, 0, m);
      bx(br, 0.4, 0.08, 0.03, 0, 0.15, 0, m);
      br.position.set(0, 0.46, -0.21);
      br.rotation.x = -0.12;
      g.add(br);

      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const leg = cyl(g, 0.025, 0.012, 0.45, sx * 0.19, 0.225, sz * 0.19, m, 8);
          leg.rotation.z = sx * -0.06;
          leg.rotation.x = sz * 0.06;
        }
      }
      g.position.set(x, 0, z);
      g.rotation.y = ry || 0;
      p.add(g);
      if (collide) M6.props.push([x - 0.28, x + 0.28, z - 0.28, z + 0.28]);
      mergeStaticGroup(g);
      return g;
    }

    function ergoChair(p, x, z, ry, mBase, mCush, collide = false) {
      const g = new THREE.Group();
      cyl(g, 0.03, 0.035, 0.34, 0, 0.24, 0, mBase, 10);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const arm = new THREE.Group();
        arm.rotation.y = a;
        bx(arm, 0.04, 0.035, 0.28, 0, 0.06, 0.14, mBase);
        cyl(arm, 0.026, 0.026, 0.04, 0, 0.025, 0.26, mBase, 8);
        g.add(arm);
      }
      bx(g, 0.48, 0.06, 0.46, 0, 0.45, 0, mCush);
      for (const sx of [-1, 1]) {
        bx(g, 0.03, 0.18, 0.04, sx * 0.26, 0.54, 0.02, mBase);
        bx(g, 0.06, 0.03, 0.22, sx * 0.26, 0.64, 0.04, mCush);
      }
      const bk = new THREE.Group();
      bk.position.set(0, 0.47, -0.22);
      bk.rotation.x = -0.14;
      bx(bk, 0.06, 0.28, 0.035, 0, 0.14, -0.02, mBase);
      bx(bk, 0.44, 0.46, 0.05, 0, 0.39, 0.01, mCush);
      g.add(bk);
      g.position.set(x, 0, z);
      g.rotation.y = ry || 0;
      p.add(g);
      if (collide) M6.props.push([x - 0.32, x + 0.32, z - 0.32, z + 0.32]);
      mergeStaticGroup(g);
      return g;
    }

    // ---------- Decorado de las galerías ----------
    function motes(g, cx, cy, cz, w, h, d, n) {
      const base = new Float32Array(n * 3);
      const ph = new Float32Array(n);
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        base[i * 3] = (Math.random() - 0.5) * w;
        base[i * 3 + 1] = Math.random() * h;
        base[i * 3 + 2] = (Math.random() - 0.5) * d;
        ph[i] = Math.random() * 6.28;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pt = new THREE.Points(
        geo,
        new THREE.PointsMaterial({ size: 0.06, color: 0xfff2d6, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
      );
      pt.position.set(cx, cy, cz);
      pt.frustumCulled = false;
      g.add(pt);
      M6.an.push((t) => {
        for (let i = 0; i < n; i++) {
          const q = ph[i];
          pos[i * 3] = base[i * 3] + Math.sin(t * 0.12 + q) * 0.7;
          pos[i * 3 + 1] = (base[i * 3 + 1] + t * 0.05 * (0.4 + (q % 1))) % h;
          pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.1 + q * 1.3) * 0.7;
        }
        geo.attributes.position.needsUpdate = true;
      });
      return pt;
    }

    const parquetTex = () =>
      txtTex(
        512,
        512,
        (c, w, h) => {
          c.fillStyle = '#2a1c10';
          c.fillRect(0, 0, w, h);
          const rows = 10, rh = h / rows;
          for (let r = 0; r < rows; r++) {
            let x = -((r * 97) % 140);
            while (x < w) {
              const L = 120 + ((x * 7 + r * 53 + 1000) % 90);
              const hue = 26 + ((x + r * 31 + 1000) % 9);
              const l = 34 + ((x * 3 + r * 17 + 1000) % 12);
              c.fillStyle = 'hsl(' + hue + ',42%,' + l + '%)';
              c.fillRect(x + 1, r * rh + 1, L - 2, rh - 2);
              for (let k = 0; k < 9; k++) {
                c.strokeStyle = 'rgba(30,18,8,' + (0.06 + (((k * 13 + x + 1000) % 7) / 70)) + ')';
                c.beginPath();
                const gy = r * rh + 3 + (k * (rh - 6)) / 9;
                c.moveTo(x + 2, gy);
                c.lineTo(x + L - 2, gy + ((k % 3) - 1));
                c.stroke();
              }
              x += L;
            }
          }
        },
        true,
        true
      );

    const tileTex = (base, grout) =>
      txtTex(
        512,
        512,
        (c, w, h) => {
          c.fillStyle = grout;
          c.fillRect(0, 0, w, h);
          const n = 4, sz = w / n;
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              const v = ((i * 7 + j * 13) % 5) * 3;
              c.fillStyle = 'rgb(' + (base[0] + v) + ',' + (base[1] + v) + ',' + (base[2] + v) + ')';
              c.fillRect(i * sz + 2, j * sz + 2, sz - 4, sz - 4);
              const gr = c.createLinearGradient(i * sz, j * sz, i * sz + sz, j * sz + sz);
              gr.addColorStop(0, 'rgba(255,255,255,.10)');
              gr.addColorStop(1, 'rgba(0,0,0,.12)');
              c.fillStyle = gr;
              c.fillRect(i * sz + 2, j * sz + 2, sz - 4, sz - 4);
            }
          }
        },
        true,
        true
      );

    const floorPl = (g, tex, w, d, cx, y, cz, rep, em) => {
      tex.repeat.set(rep[0], rep[1]);
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshStandardMaterial({
          map: tex,
          emissiveMap: tex,
          emissive: 0xffffff,
          emissiveIntensity: em == null ? 0.3 : em,
          roughness: 0.55,
          metalness: 0.1,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(cx, y, cz);
      m.userData.noMerge = true;
      g.add(m);
      return m;
    };

    // ---------- Ventanas de lluvia (Torre del Pasado) ----------
    let WINR = null;
    const winRes = () => {
      if (WINR) return WINR;
      const mkr = (s) => () => (s = (s * 9301 + 49297) % 233280) / 233280;
      const back = [0, 1].map((k) => {
        const r = mkr(31 + k * 17);
        return txtTex(512, 384, (c, w, h) => {
          const gg = c.createLinearGradient(0, 0, 0, h);
          gg.addColorStop(0, '#566a7e');
          gg.addColorStop(0.55, '#8497a8');
          gg.addColorStop(1, '#a9b8c4');
          c.fillStyle = gg;
          c.fillRect(0, 0, w, h);
          for (let i = 0; i < 14; i++) {
            const x = r() * w, y = r() * h * 0.5, q = 60 + r() * 90;
            const gr = c.createRadialGradient(x, y, 0, x, y, q);
            gr.addColorStop(0, 'rgba(210,222,232,.18)');
            gr.addColorStop(1, 'rgba(210,222,232,0)');
            c.fillStyle = gr;
            c.fillRect(x - q, y - q, q * 2, q * 2);
          }
          c.shadowColor = 'rgba(52,66,80,.9)';
          c.shadowBlur = 14;
          let x = -20;
          while (x < w) {
            const bw = 28 + r() * 52, bh = 60 + r() * 130;
            c.fillStyle = 'rgba(58,74,90,' + (0.55 + r() * 0.25) + ')';
            c.fillRect(x, h * 0.78 - bh, bw, bh + h);
            x += bw + r() * 10;
          }
          for (let i = 0; i < 9; i++) {
            c.fillStyle = 'rgba(44,66,58,.75)';
            c.beginPath();
            c.arc(r() * w, h * 0.7 + r() * h * 0.1, 22 + r() * 28, 0, 6.3);
            c.fill();
          }
          c.shadowBlur = 0;
          for (let i = 0; i < 26; i++) {
            const px = r() * w, py = h * (0.45 + r() * 0.4), q = 5 + r() * 11, wm = r() < 0.7;
            const gr = c.createRadialGradient(px, py, 0, px, py, q);
            gr.addColorStop(0, wm ? 'rgba(255,214,150,.75)' : 'rgba(190,225,255,.6)');
            gr.addColorStop(1, 'rgba(255,214,150,0)');
            c.fillStyle = gr;
            c.beginPath();
            c.arc(px, py, q, 0, 6.3);
            c.fill();
          }
          const fg = c.createLinearGradient(0, h * 0.6, 0, h);
          fg.addColorStop(0, 'rgba(200,214,226,0)');
          fg.addColorStop(1, 'rgba(200,214,226,.5)');
          c.fillStyle = fg;
          c.fillRect(0, h * 0.6, w, h * 0.4);
        });
      });
      const rain = txtTex(
        128,
        256,
        (c, w, h) => {
          c.clearRect(0, 0, w, h);
          const r = mkr(9);
          c.lineCap = 'round';
          for (let i = 0; i < 90; i++) {
            const x = r() * w, y = r() * h, len = 18 + r() * 28;
            c.strokeStyle = 'rgba(228,240,252,' + (0.22 + r() * 0.4) + ')';
            c.lineWidth = 1 + r() * 0.7;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x - 2.5, y + len);
            c.stroke();
          }
        },
        true
      );
      const drops = [0, 1].map((k) => {
        const r = mkr(77 + k * 23);
        return txtTex(
          512,
          512,
          (c, w, h) => {
            c.clearRect(0, 0, w, h);
            const cg = c.createLinearGradient(0, h * 0.55, 0, h);
            cg.addColorStop(0, 'rgba(225,238,248,0)');
            cg.addColorStop(1, 'rgba(225,238,248,.22)');
            c.fillStyle = cg;
            c.fillRect(0, h * 0.55, w, h * 0.45);
            for (let i = 0; i < 16; i++) {
              const x = r() * w, y0 = r() * h * 0.7, len = 40 + r() * 130;
              const lg = c.createLinearGradient(0, y0, 0, y0 + len);
              lg.addColorStop(0, 'rgba(235,245,255,0)');
              lg.addColorStop(1, 'rgba(235,245,255,.2)');
              c.strokeStyle = lg;
              c.lineWidth = 1.6 + r() * 1.6;
              c.beginPath();
              c.moveTo(x, y0);
              c.lineTo(x + (r() - 0.5) * 5, y0 + len);
              c.stroke();
            }
            for (let i = 0; i < 140; i++) {
              const x = r() * w, y = r() * h, q = 1.8 + r() * r() * 8, sy = 1.15 + r() * 0.35;
              c.save();
              c.translate(x, y);
              c.scale(1, sy);
              const gr = c.createRadialGradient(-q * 0.3, -q * 0.35, q * 0.1, 0, 0, q);
              gr.addColorStop(0, 'rgba(255,255,255,.55)');
              gr.addColorStop(0.45, 'rgba(200,220,240,.12)');
              gr.addColorStop(1, 'rgba(30,45,60,.34)');
              c.fillStyle = gr;
              c.beginPath();
              c.arc(0, 0, q, 0, 6.283);
              c.fill();
              c.strokeStyle = 'rgba(255,255,255,.5)';
              c.lineWidth = Math.max(0.8, q * 0.14);
              c.beginPath();
              c.arc(0, 0, q * 0.78, 3.6, 4.9);
              c.stroke();
              c.restore();
            }
          },
          true
        );
      });
      const spill = txtTex(64, 64, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, 'rgba(200,225,255,.55)');
        gr.addColorStop(1, 'rgba(200,225,255,0)');
        c.fillStyle = gr;
        c.fillRect(0, 0, w, h);
        const gx = c.createLinearGradient(0, 0, w, 0);
        gx.addColorStop(0, 'rgba(0,0,0,.6)');
        gx.addColorStop(0.2, 'rgba(0,0,0,0)');
        gx.addColorStop(0.8, 'rgba(0,0,0,0)');
        gx.addColorStop(1, 'rgba(0,0,0,.6)');
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = gx;
        c.fillRect(0, 0, w, h);
      });
      const rg = new THREE.CircleGeometry(0.5, 10);
      rg.userData.__shared = true;
      return (WINR = {
        back,
        rain,
        drops,
        spill,
        fr: stdM(0xd5d1c4, 0.2, { roughness: 0.55 }),
        rg,
        rm: new THREE.MeshBasicMaterial({ color: 0xeef6ff, transparent: true, opacity: 0.55, depthWrite: false }),
      });
    };

    function rainWindow(g, w, h, x, y, z, ry, woodM, steelM, k) {
      const R = winRes();
      const G = new THREE.Group();
      G.position.set(x, y, z);
      G.rotation.y = ry;
      g.add(G);

      const frameG = new THREE.Group();
      G.add(frameG);
      const box = (gw, gh, gd, px, py, pz, m) => {
        const o = new THREE.Mesh(__BOX_GEO, m);
        o.position.set(px, py, pz);
        o.scale.set(gw, gh, gd);
        frameG.add(o);
        return o;
      };

      const bk = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: R.back[k % 2], color: 0xdfe6ee }));
      bk.position.z = 0.012;
      bk.userData.dyn = true;
      G.add(bk);

      const layers = [];
      for (const [z0, o, sp, sc] of [[0.02, 0.5, 1.1, 1], [0.03, 0.32, 0.7, 1.7]]) {
        const t = R.rain.clone();
        t.needsUpdate = true;
        t.repeat.set(w / (1.2 * sc), h / (2.4 * sc));
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
        );
        m.position.z = z0;
        m.userData.dyn = true;
        G.add(m);
        layers.push([t, sp, k * 0.37]);
      }

      const dt = R.drops[k % 2].clone();
      dt.needsUpdate = true;
      dt.repeat.set(w / 2.4, h / 2.4);
      const gl = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 0.06, h - 0.06),
        new THREE.MeshStandardMaterial({ map: dt, transparent: true, color: 0xe4effa, emissive: 0x9fb4c8, emissiveIntensity: 0.15, roughness: 0.08, metalness: 0, depthWrite: false })
      );
      gl.position.z = 0.07;
      gl.renderOrder = 2;
      gl.userData.dyn = true;
      G.add(gl);

      const n = Math.max(4, Math.round(w * 2)), dr = [];
      let sd = 11 + k * 29;
      const rr = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(R.rg, R.rm);
        m.position.z = 0.075;
        m.renderOrder = 3;
        m.userData.dyn = true;
        G.add(m);
        dr.push({ m, x: (rr() - 0.5) * (w - 0.3), ph: rr(), sp: 0.025 + rr() * 0.05, s: rr() });
      }
      M6.an.push((t) => {
        for (let i = 0; i < layers.length; i++) layers[i][0].offset.y = -((t * layers[i][1] * 0.45 + layers[i][2]) % 1);
        for (let i = 0; i < dr.length; i++) {
          const d = dr[i];
          const u = (t * d.sp + d.ph) % 1;
          const v = Math.min(1, Math.max(0, u + 0.03 * Math.sin(u * 30 + d.ph * 9)));
          d.m.position.set(d.x + Math.sin(u * 9 + d.ph * 5) * 0.012, h / 2 - 0.1 - v * (h - 0.2), 0.075);
          d.m.scale.set(0.02 + 0.012 * d.s, 0.045 + 0.035 * d.s, 1);
          d.m.visible = u > 0.015 && u < 0.985;
        }
      });

      const fr = R.fr;
      box(w + 0.2, 0.1, 0.16, 0, h / 2 + 0.05, 0.08, fr);
      box(w + 0.2, 0.1, 0.16, 0, -h / 2 - 0.05, 0.08, fr);
      box(0.1, h + 0.2, 0.16, -w / 2 - 0.05, 0, 0.08, fr);
      box(0.1, h + 0.2, 0.16, w / 2 + 0.05, 0, 0.08, fr);
      box(0.06, h, 0.1, 0, 0, 0.07, fr);
      box(w, 0.06, 0.1, 0, h * 0.18, 0.07, fr);
      box(0.05, 0.14, 0.05, 0.07, h * 0.18, 0.14, steelM);
      box(w + 0.5, 0.06, 0.34, 0, -h / 2 - 0.13, 0.17, woodM);
      box(w + 0.34, 0.12, 0.05, 0, -h / 2 - 0.22, 0.04, woodM);
      mergeStaticGroup(frameG);

      const sm = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 1.1, 3.2),
        new THREE.MeshBasicMaterial({ map: R.spill, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
      );
      sm.rotation.x = -Math.PI / 2;
      sm.position.set(0, -y + 0.035, 1.7);
      sm.userData.dyn = true;
      G.add(sm);

      const shaft = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.94, 3.5),
        new THREE.MeshBasicMaterial({ map: R.spill, transparent: true, opacity: 0.085, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
      );
      shaft.rotation.x = -0.62;
      shaft.position.set(0, -y * 0.35 + 0.15, 1.2);
      shaft.userData.dyn = true;
      G.add(shaft);
    }

    const dotTex = (col) => {
      if (__DOT_TEX.has(col)) return __DOT_TEX.get(col);
      const t = txtTex(64, 64, (c) => {
        const gr = c.createRadialGradient(32, 32, 1, 32, 32, 31);
        gr.addColorStop(0, col);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr;
        c.fillRect(0, 0, 64, 64);
      });
      __DOT_TEX.set(col, t);
      return t;
    };

    function decor(g, K) {
      const { wood, steel, warm, cool } = K;
      const decG = new THREE.Group();
      g.add(decG);

      // Luces puntuales interiores (sin sombras para mantener 60 FPS y realzar volumen cinematográfico)
      const ptA = new THREE.PointLight(0xffd29e, 0.95, 26, 1.6);
      if (ptA && ptA.position) { ptA.position.set(-39, 5.2, 0); ptA.userData.dyn = true; g.add(ptA); }
      const ptB = new THREE.PointLight(0x9fe0ff, 0.9, 26, 1.6);
      if (ptB && ptB.position) { ptB.position.set(3, 5.2, 0); ptB.userData.dyn = true; g.add(ptB); }
      const ptC = new THREE.PointLight(0xffebd0, 0.85, 28, 1.6);
      if (ptC && ptC.position) { ptC.position.set(46, TOP + 4.8, 0); ptC.userData.dyn = true; g.add(ptC); }

      // --- Suelos con textura nítida ---
      floorPl(g, parquetTex(), 17.6, 17.6, -39, 0.012, 0, [2.2, 2.2], 0.32);
      floorPl(g, tileTex([150, 162, 172], '#53606a'), 17.6, 17.6, 3, 0.012, 0, [4, 4], 0.3);
      floorPl(g, tileTex([52, 60, 68], '#1b2128'), 21.6, 17.6, 45, TOP + 0.012, 0, [5, 4], 0.34);

      // --- Torre A: boiserías, lámparas con haz cálido, reloj detenido, ventanas, dibujos, escritorio y globo ---
      for (const [L, x, y, z] of [[10.2, -42.4, 0.425, -8.77], [17.6, -39, 0.425, 8.77]]) bx(decG, L, 0.85, 0.06, x, y, z, wood);
      bx(decG, 0.06, 0.85, 17.6, -47.77, 0.425, 0, wood);
      for (const [L, z] of [[6.2, -5.7], [6.2, 5.7]]) bx(decG, 0.06, 0.85, L, -30.23, 0.425, z, wood);
      for (const [L, x, y, z] of [[10.2, -42.4, 0.87, -8.77], [17.6, -39, 0.87, 8.77]]) bx(decG, L, 0.04, 0.09, x, y, z, steel);

      // Reloj de pared detenido en el muro sur de Torre A (con caja física y bisel)
      {
        const clkCase = cyl(decG, 0.46, 0.46, 0.08, -39, 3.85, 8.75, wood, 24);
        clkCase.rotation.x = Math.PI / 2;
        const clkT = txtTex(128, 128, (c, w, h) => {
          c.fillStyle = '#efe8d6';
          c.beginPath();
          c.arc(w / 2, h / 2, 56, 0, 6.283);
          c.fill();
          c.strokeStyle = '#3a3026';
          c.lineWidth = 6;
          c.stroke();
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            c.beginPath();
            c.moveTo(w / 2 + Math.sin(a) * 44, h / 2 - Math.cos(a) * 44);
            c.lineTo(w / 2 + Math.sin(a) * 50, h / 2 - Math.cos(a) * 50);
            c.lineWidth = i % 3 === 0 ? 3 : 1.5;
            c.stroke();
          }
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(w / 2, h / 2);
          c.lineTo(w / 2 + 24, h / 2 - 14);
          c.lineWidth = 4;
          c.stroke();
          c.beginPath();
          c.moveTo(w / 2, h / 2);
          c.lineTo(w / 2 - 8, h / 2 - 36);
          c.lineWidth = 2.5;
          c.stroke();
        });
        const clkM = new THREE.Mesh(new THREE.CircleGeometry(0.41, 24), new THREE.MeshBasicMaterial({ map: clkT }));
        clkM.position.set(-39, 3.85, 8.7);
        clkM.rotation.y = Math.PI;
        clkM.userData.dyn = true;
        g.add(clkM);
      }

      const lampM = cmat(0xe8e2d0, 0.5), bulb = glowM(0xffe2b0, 0.95);
      const coneM = new THREE.MeshBasicMaterial({ color: 0xffe4b8, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const poolM = new THREE.MeshBasicMaterial({ color: 0xffdca0, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
      for (const x of [-44, -39, -34]) {
        for (const z of [-4.5, 4.5]) {
          cyl(decG, 0.012, 0.012, 0.8, x, 6.6, z, steel, 4);
          cyl(decG, 0.14, 0.42, 0.3, x, 6.12, z, lampM, 14);
          const bl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), bulb);
          bl.position.set(x, 6.0, z);
          decG.add(bl);
          // Cono de luz suave y halo en el suelo
          const cn = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 2.2, 5.8, 16, 1, true), coneM);
          cn.position.set(x, 3.1, z);
          cn.userData.dyn = true;
          g.add(cn);
          const pl = new THREE.Mesh(new THREE.CircleGeometry(2.1, 20), poolM);
          pl.rotation.x = -Math.PI / 2;
          pl.position.set(x, 0.025, z);
          pl.userData.dyn = true;
          g.add(pl);
        }
      }

      [-43, -35].forEach((x, i) => rainWindow(g, 3.4, 2.4, x, 2.1, 8.8, Math.PI, wood, steel, i));

      // Dibujos infantiles de clase
      {
        const drw = (i) =>
          txtTex(256, 192, (c, w, h) => {
            let sd = 5 + i * 13;
            const r = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
            c.fillStyle = ['#f6efe0', '#f3ead4', '#efe9f2'][i];
            c.fillRect(0, 0, w, h);
            for (let k = 0; k < 420; k++) {
              c.fillStyle = 'rgba(120,100,70,' + (0.02 + r() * 0.05) + ')';
              c.fillRect(r() * w, r() * h, 1 + r() * 2, 1);
            }
            const fill = (col, x, y, wd, hg, path, lw) => {
              c.save();
              c.beginPath();
              path();
              c.clip();
              c.strokeStyle = col;
              c.lineWidth = lw || 5;
              c.lineCap = 'round';
              for (let k = -hg; k < wd; k += (lw || 5) * 0.7) {
                c.globalAlpha = 0.55 + r() * 0.4;
                c.beginPath();
                c.moveTo(x + k + r() * 3, y + hg + r() * 3);
                c.lineTo(x + k + hg * 0.7 + r() * 3, y - r() * 3);
                c.stroke();
              }
              c.restore();
              c.globalAlpha = 1;
              c.strokeStyle = 'rgba(60,45,35,.55)';
              c.lineWidth = 2;
              c.beginPath();
              path();
              c.stroke();
            };
            const rect = (x, y, a, b) => () => c.rect(x, y, a, b);
            const circ = (x, y, q) => () => c.arc(x, y, q, 0, 6.283);
            if (i === 0) {
              fill('#8cc5e8', 10, 10, w - 20, 100, rect(10, 10, w - 20, 100));
              fill('#ffd45a', 150, 22, 48, 48, circ(174, 46, 22));
              c.strokeStyle = '#f0a830';
              c.lineWidth = 3;
              for (let a = 0; a < 12; a++) {
                c.beginPath();
                c.moveTo(174 + Math.cos(a * 0.524) * 27, 46 + Math.sin(a * 0.524) * 27);
                c.lineTo(174 + Math.cos(a * 0.524) * 39, 46 + Math.sin(a * 0.524) * 39);
                c.stroke();
              }
              fill('#6fa85c', 10, 100, w - 20, 82, () => {
                c.moveTo(10, 182);
                c.lineTo(10, 128);
                c.quadraticCurveTo(90, 84, 150, 126);
                c.quadraticCurveTo(200, 104, w - 10, 122);
                c.lineTo(w - 10, 182);
                c.closePath();
              });
              fill('#b06a48', 70, 104, 70, 52, rect(70, 104, 70, 52));
              fill('#d2553f', 62, 70, 86, 36, () => {
                c.moveTo(62, 106);
                c.lineTo(105, 66);
                c.lineTo(148, 106);
                c.closePath();
              });
              fill('#7a4a2f', 92, 126, 22, 30, rect(92, 126, 22, 30));
              fill('#f4e3a0', 120, 114, 16, 16, rect(120, 114, 16, 16));
            } else if (i === 1) {
              fill('#bfe3f0', 10, 10, w - 20, 120, rect(10, 10, w - 20, 120));
              fill('#7fb85f', 10, 128, w - 20, 54, rect(10, 128, w - 20, 54));
              fill('#8a5a36', 60, 70, 16, 64, rect(60, 70, 16, 64));
              fill('#4f9a4a', 38, 24, 60, 60, circ(68, 52, 30));
              fill('#5fae55', 72, 34, 40, 40, circ(92, 46, 20));
              c.strokeStyle = '#4a3a30';
              c.lineWidth = 3;
              c.lineCap = 'round';
              [[130, '#d2553f'], [168, '#3f7fc0'], [200, '#e0a030']].forEach(([x, col], k) => {
                const hh = k === 2 ? 18 : 30;
                c.beginPath();
                c.arc(x, 112 - hh * 0.6, 9, 0, 6.283);
                c.stroke();
                c.fillStyle = col;
                c.fill();
                c.beginPath();
                c.moveTo(x, 121 - hh * 0.6);
                c.lineTo(x, 150);
                c.moveTo(x - 12, 134);
                c.lineTo(x + 12, 134);
                c.moveTo(x, 150);
                c.lineTo(x - 9, 174);
                c.moveTo(x, 150);
                c.lineTo(x + 9, 174);
                c.stroke();
              });
            } else {
              fill('#2c3e7a', 10, 10, w - 20, 162, rect(10, 10, w - 20, 162), 6);
              c.fillStyle = '#ffe27a';
              for (let k = 0; k < 22; k++) {
                const x = 20 + r() * (w - 40), y = 20 + r() * 130, q = 1.5 + r() * 3;
                c.beginPath();
                c.arc(x, y, q, 0, 6.283);
                c.fill();
              }
              fill('#fff0b0', 160, 22, 40, 40, () => c.arc(180, 42, 18, 0, 6.283), 4);
              fill('#2c3e7a', 170, 16, 40, 40, () => c.arc(190, 38, 16, 0, 6.283), 6);
              fill('#e8e8ee', 96, 52, 34, 84, () => {
                c.moveTo(113, 40);
                c.quadraticCurveTo(134, 70, 130, 136);
                c.lineTo(96, 136);
                c.quadraticCurveTo(92, 70, 113, 40);
                c.closePath();
              });
              fill('#d2553f', 108, 36, 10, 20, () => {
                c.moveTo(113, 30);
                c.lineTo(122, 54);
                c.lineTo(104, 54);
                c.closePath();
              });
              fill('#d2553f', 84, 110, 16, 30, () => {
                c.moveTo(96, 110);
                c.lineTo(84, 140);
                c.lineTo(96, 136);
                c.closePath();
              });
              fill('#d2553f', 126, 110, 16, 30, () => {
                c.moveTo(130, 110);
                c.lineTo(142, 140);
                c.lineTo(130, 136);
                c.closePath();
              });
              fill('#ff9a2e', 102, 136, 22, 28, () => {
                c.moveTo(102, 136);
                c.lineTo(113, 168);
                c.lineTo(124, 136);
                c.closePath();
              });
              fill('#9fd6f0', 104, 76, 18, 18, circ(113, 85, 9), 4);
            }
          });
        const mount = ['#6fa85c', '#c98a54', '#7aa0c8'];
        const pinC = [0xd2553f, 0x3f7fc0, 0xe0a030];
        [[-46.2, 0, 0.03], [-39, 1, -0.025], [-31.8, 2, 0.02]].forEach(([x, i, rz]) => {
          const t = drw(i);
          const P = new THREE.Group();
          P.position.set(x, 2.5, 8.76);
          P.rotation.set(0, Math.PI, rz);
          g.add(P);
          const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.98), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }));
          sh.position.set(-0.035, -0.04, -0.02);
          P.add(sh);
          const mt = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.98, 0.012), stdM(parseInt(mount[i].slice(1), 16), 0.12, { roughness: 0.9 }));
          mt.position.z = -0.008;
          P.add(mt);
          const pp = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.84), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.9, metalness: 0 }));
          pp.position.z = 0.004;
          P.add(pp);
          for (const sx of [-1, 1]) {
            const pn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), stdM(pinC[i], 0.3));
            pn.position.set(sx * 0.5, 0.38, 0.014);
            P.add(pn);
          }
          P.userData.noMerge = true;
        });
      }

      desk(decG, -46.3, -6.2, wood, steel);
      // Lámpara articulada de latón sobre el escritorio del profesor
      {
        const brass = cmat(0xc29e5a, 0.25);
        cyl(decG, 0.085, 0.095, 0.024, -46.66, 0.762, -6.32, brass, 12);
        const st1 = cyl(decG, 0.014, 0.016, 0.28, -46.67, 0.89, -6.32, brass, 6);
        st1.rotation.z = 0.2;
        const st2 = cyl(decG, 0.012, 0.014, 0.22, -46.6, 1.05, -6.3, brass, 6);
        st2.rotation.z = -0.55;
        const shade = cyl(decG, 0.045, 0.11, 0.12, -46.53, 1.06, -6.28, cmat(0x2d4a3a, 0.2), 12);
        shade.rotation.z = 0.35;
        const dkBulb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), glowM(0xffe0a4, 0.95));
        dkBulb.position.set(-46.53, 1.02, -6.28);
        decG.add(dkBulb);
        const dkPool = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), glowM(0xffdca0, 0.2));
        dkPool.rotation.x = -Math.PI / 2;
        dkPool.position.set(-46.48, 0.755, -6.24);
        dkPool.userData.dyn = true;
        g.add(dkPool);
      }
      cyl(decG, 0.03, 0.03, 0.1, -46.3, 0.82, -6.05, steel, 8);
      {
        const gt = txtTex(128, 64, (c, w, h) => {
          c.fillStyle = '#2d5f8a';
          c.fillRect(0, 0, w, h);
          c.fillStyle = '#6f9a58';
          for (const [x, y, r] of [[30, 26, 14], [52, 34, 10], [90, 22, 16], [104, 40, 9], [76, 44, 8]]) {
            c.beginPath();
            c.arc(x, y, r, 0, 6.3);
            c.fill();
          }
        });
        const gb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.6, emissive: 0x203040, emissiveIntensity: 0.4 }));
        gb.position.set(-46.3, 1.08, -6.05);
        gb.rotation.z = 0.4;
        gb.userData.dyn = true;
        g.add(gb);
        cyl(decG, 0.11, 0.13, 0.03, -46.3, 0.775, -6.05, steel, 14);
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.007, 6, 24, Math.PI), steel);
        arc.position.set(-46.3, 1.08, -6.05);
        arc.rotation.z = -Math.PI / 2 + 0.4;
        decG.add(arc);
        M6.an.push((t) => {
          gb.rotation.y = t * 0.4;
        });
      }
      motes(g, -39, 0, 0, 16, 6.6, 16, 75);

      // --- Puente: luz en los bordes del suelo y diagonales ---
      for (const z of [-2.2, 2.2]) bx(decG, 24, 0.03, 0.08, -18, 0.02, z, cool);
      for (let x = -28, i = 0; x <= -8; x += 4, i++) {
        for (const z of [-2.2, 2.2]) {
          const br = bx(decG, 3.2, 0.08, 0.08, x + 2, -0.58, z, steel);
          br.rotation.z = (i % 2 ? 1 : -1) * 0.5;
        }
      }

      // --- Torre B: líneas de luz, astrolabio del tiempo con rosetón, tirantes y brújula en el suelo ---
      for (const z of [-8.7, 8.7]) bx(decG, 17.2, 0.02, 0.1, 3, 0.02, z, cool);
      for (const x of [-5.7, 11.7]) bx(decG, 0.1, 0.02, 17.2, x, 0.02, 0, cool);
      {
        const brass = cmat(0xc29e5a, 0.25);
        const rg = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.35, 48), glowM(0x9fe0ff, 0.35));
        rg.rotation.x = -Math.PI / 2;
        rg.position.set(3, 0.025, 0);
        rg.userData.dyn = true;
        g.add(rg);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const tk = bx(decG, 0.06, 0.015, i % 3 === 0 ? 0.32 : 0.18, 3 + Math.cos(a) * 3.1, 0.026, Math.sin(a) * 3.1, brass);
          tk.rotation.y = -a + Math.PI / 2;
        }
        const rgIn = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.54, 40), glowM(0xffd89a, 0.28));
        rgIn.rotation.x = -Math.PI / 2;
        rgIn.position.set(3, 0.026, 0);
        rgIn.userData.dyn = true;
        g.add(rgIn);

        cyl(decG, 0.28, 0.34, 0.08, 3, 6.96, 0, steel, 16);
        cyl(decG, 0.02, 0.02, 3.2, 3, 5.4, 0, steel, 6);
        for (const sx of [-1, 1]) {
          const cab = cyl(decG, 0.01, 0.01, 3.62, 3 + sx * 0.74, 5.28, 0, steel, 4);
          cab.rotation.z = sx * 0.42;
        }
        const outerGimb = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.025, 8, 48), brass);
        outerGimb.position.set(3, 3.6, 0);
        decG.add(outerGimb);

        const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), glowM(0xfff0c0, 0.95));
        core.position.set(3, 3.6, 0);
        core.userData.dyn = true;
        g.add(core);
        const ndGeo = new THREE.SphereGeometry(0.055, 8, 6);
        const rings = [0, 1, 2].map((i) => {
          const rad = 0.7 + i * 0.28;
          const r = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.025, 8, 52), i === 1 ? glowM(0xffd89a, 0.85) : glowM(0x9fe0ff, 0.85));
          r.position.set(3, 3.6, 0);
          r.userData.dyn = true;
          for (let k = 0; k < 2; k++) {
            const nd = new THREE.Mesh(ndGeo, i === 1 ? glowM(0xfff4d2, 0.95) : glowM(0xdff7ff, 0.95));
            nd.position.set(k === 0 ? rad : -rad, 0, 0);
            r.add(nd);
          }
          g.add(r);
          return r;
        });
        const orbMote = [0, 1].map((i) => {
          const om = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), glowM(i ? 0xffd89a : 0x9fe0ff, 0.95));
          om.userData.dyn = true;
          g.add(om);
          return om;
        });
        M6.an.push((t) => {
          for (let i = 0; i < rings.length; i++) {
            rings[i].rotation.x = t * (0.35 + i * 0.17) + i;
            rings[i].rotation.y = t * (0.22 - i * 0.09) + i * 2;
          }
          for (let i = 0; i < orbMote.length; i++) {
            const a = t * (0.85 + i * 0.4) + i * 3.14;
            orbMote[i].position.set(3 + Math.cos(a) * 1.12, 3.6 + Math.sin(a * 1.3) * 0.45, Math.sin(a) * 1.12);
          }
          core.scale.setScalar(1 + 0.12 * Math.sin(t * 2));
          rgIn.material.opacity = 0.2 + 0.1 * Math.sin(t * 1.4);
        });
      }
      {
        const shaftM = new THREE.MeshBasicMaterial({
          color: 0x9fe0ff,
          transparent: true,
          opacity: 0.05,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: false,
        });
        const shaftGeo = new THREE.CylinderGeometry(1.5, 2.1, 3.6, 20, 1, true);
        for (const id in M6.alc) {
          const A = M6.alc[id];
          const sh = new THREE.Mesh(shaftGeo, shaftM);
          sh.position.set(A.x, 1.8, A.z);
          sh.userData.dyn = true;
          g.add(sh);
        }
      }
      motes(g, 3, 0, 0, 16, 6.6, 16, 75);

      // --- Escalera: luz en cada peldaño, pasamanos y vigas inclinadas inferiores de acero ---
      inst(decG, new THREE.BoxGeometry(0.06, 0.025, 4.9), warm, NST, (i) => [12 + RUN * (i + 1) - 0.04, (i + 1) * RISE + 0.03, 0]);
      for (const sd of [-1, 1]) {
        inst(decG, new THREE.BoxGeometry(RUN, 0.05, 0.05), warm, NST, (i) => [12 + RUN * (i + 0.5), (i + 1) * RISE + 1.0, sd * 2.46]);
        const strLen = Math.hypot(NST * RUN, TOP);
        const strAng = Math.atan2(TOP, NST * RUN);
        const str = bx(decG, strLen, 0.24, 0.16, 12 + (NST * RUN) / 2, TOP / 2 - 0.28, sd * 2.25, steel);
        str.rotation.z = strAng;
        for (const sx of [20, 28]) {
          const hCol = ((sx - 12) / (NST * RUN)) * TOP - 0.25;
          cyl(decG, 0.1, 0.12, hCol, sx, hCol / 2, sd * 2.25, steel, 8);
        }
      }

      // --- Último piso: macetas con árboles interiores ramificados, bancos y medallón luminoso ---
      const leafA = cmat(0x3a6f47, 0.28), leafB = cmat(0x558f5a, 0.3);
      const potM = cmat(0xcdd3d8, 0.25), potB = cmat(0x59636d, 0.25), soil = cmat(0x2a2018, 0.1);
      const barkM = cmat(0x5b4630, 0.2);
      const CANOPY = new THREE.SphereGeometry(0.55, 10, 7).scale(1.15, 0.72, 1.15);
      CANOPY.userData.__shared = true;
      for (const x of [36.5, 53.5]) {
        for (const z of [-7.6, 7.6]) {
          M6.props.push([x - 0.5, x + 0.5, z - 0.5, z + 0.5]);
          frust(decG, 0.9, 0.9, 0.62, 0.62, 0.62, x, TOP + 0.31, z, potM);
          cyl(decG, 0.5, 0.5, 0.07, x, TOP + 0.64, z, potB, 14);
          cyl(decG, 0.42, 0.42, 0.02, x, TOP + 0.66, z, soil, 12);
          cyl(decG, 0.045, 0.07, 1.35, x, TOP + 1.32, z, barkM, 7);
          const rotBase = x * 0.4 + z * 0.3;
          for (let b = 0; b < 3; b++) {
            const ang = rotBase + b * 2.094;
            const br = new THREE.Group();
            br.position.set(x, TOP + 1.68 + b * 0.14, z);
            br.rotation.y = ang;
            const bMesh = cyl(br, 0.025, 0.04, 0.72, 0.18, 0.28, 0, barkM, 6);
            bMesh.rotation.z = -0.58;
            const cf1 = new THREE.Mesh(CANOPY, b % 2 ? leafA : leafB);
            cf1.position.set(0.42, 0.56, 0);
            cf1.scale.setScalar(0.88 + b * 0.08);
            br.add(cf1);
            const cf2 = new THREE.Mesh(CANOPY, b % 2 ? leafB : leafA);
            cf2.position.set(0.2, 0.76, 0.12);
            cf2.scale.setScalar(0.72);
            br.add(cf2);
            decG.add(br);
          }
          const crown = new THREE.Mesh(CANOPY, leafB);
          crown.position.set(x, TOP + 2.55, z);
          crown.scale.setScalar(1.02);
          decG.add(crown);
        }
      }
      for (const z of [-4.5, 4.5]) {
        for (let i = 0; i < 4; i++) bx(decG, 0.11, 0.05, 3, 50.3 + i * 0.135, TOP + 0.46, z, wood);
        for (const dz of [-1.25, 1.25]) {
          for (const dx of [50.3, 50.68]) bx(decG, 0.05, 0.44, 0.05, dx, TOP + 0.22, z + dz, steel);
          bx(decG, 0.46, 0.04, 0.05, 50.49, TOP + 0.12, z + dz, steel);
          bx(decG, 0.46, 0.04, 0.05, 50.49, TOP + 0.44, z + dz, steel);
        }
        for (let i = 0; i < 3; i++) {
          const b = bx(decG, 0.04, 0.1, 3, 50.24 - i * 0.03, TOP + 0.62 + i * 0.15, z, wood);
          b.rotation.z = 0.16;
        }
        for (const dz of [-1.25, 1.25]) {
          const p = bx(decG, 0.05, 0.62, 0.05, 50.26, TOP + 0.78, z + dz, steel);
          p.rotation.z = 0.16;
        }
        M6.props.push([50.2, 50.8, z - 1.6, z + 1.6]);
      }
      {
        const rg = new THREE.Mesh(new THREE.RingGeometry(5.5, 5.62, 56), glowM(0xffe9bd, 0.3));
        rg.rotation.x = -Math.PI / 2;
        rg.position.set(46, TOP + 0.022, 0);
        rg.userData.dyn = true;
        g.add(rg);
        const brassRing = new THREE.Mesh(new THREE.RingGeometry(5.16, 5.24, 56), cmat(0xc29e5a, 0.28));
        brassRing.rotation.x = -Math.PI / 2;
        brassRing.position.set(46, TOP + 0.023, 0);
        brassRing.userData.dyn = true;
        g.add(brassRing);
      }
      motes(g, 45, TOP, 0, 20, 6, 16, 65);

      mergeStaticGroup(decG);

      // --- Ciudad lejana (segunda fila determinista), resplandor dorado del horizonte, balizas rojas y reflejo en el mar ---
      {
        let sd = 17;
        const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
        const n = 70;
        const fw = txtTex(64, 128, (c, w, h) => {
          c.fillStyle = '#10131a';
          c.fillRect(0, 0, w, h);
          for (let r = 0; r < 16; r++) {
            for (let q = 0; q < 7; q++) {
              if (rnd() > 0.55) {
                c.fillStyle = rnd() > 0.5 ? '#ffcf8a' : '#bfe0ff';
                c.fillRect(q * 9 + 2, r * 8 + 2, 4, 3);
              }
            }
          }
        });
        const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: fw, fog: false }), n);
        const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), cc = new THREE.Color(), tops = [];
        for (let i = 0; i < n; i++) {
          const hh = 70 + rnd() * 190 * (1 - Math.abs(i / n - 0.5) * 1.2);
          const w = 20 + rnd() * 36;
          const x = 900 + rnd() * 260;
          const z = -420 + i * 12 + rnd() * 10;
          const y = -O6.y + WL + hh / 2 - 4;
          sc.set(w, hh, w);
          ps.set(x, y, z);
          m4.compose(ps, q0, sc);
          im.setMatrixAt(i, m4);
          cc.setHSL(0.6, 0.2, 0.4 + rnd() * 0.3);
          im.setColorAt(i, cc);
          if (i % 9 === 0) tops.push([x, y + hh / 2 + 3, z]);
        }
        if (im.instanceMatrix) im.instanceMatrix.needsUpdate = true;
        safeInstBounds(im);
        g.add(im);
        M6.decorCity = im;
        M6.cityFar = im;

        const hzTex = txtTex(64, 128, (c, w, h) => {
          const gr = c.createRadialGradient(w / 2, h * 0.78, 2, w / 2, h * 0.78, h * 0.65);
          gr.addColorStop(0, 'rgba(255,212,150,.55)');
          gr.addColorStop(0.55, 'rgba(255,190,120,.2)');
          gr.addColorStop(1, 'rgba(255,180,120,0)');
          c.fillStyle = gr;
          c.fillRect(0, 0, w, h);
        });
        const hzGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(880, 170),
          new THREE.MeshBasicMaterial({ map: hzTex, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
        );
        hzGlow.rotation.y = -Math.PI / 2;
        hzGlow.position.set(840, -O6.y + WL + 72, 0);
        g.add(hzGlow);

        const bm = new THREE.SpriteMaterial({
          map: dotTex('rgba(255,70,50,1)'),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          fog: false,
        });
        for (let i = 0; i < tops.length; i++) {
          const t = tops[i];
          const sp = new THREE.Sprite(bm);
          sp.scale.setScalar(26);
          sp.position.set(t[0], t[1], t[2]);
          g.add(sp);
        }
        M6.an.push((t) => {
          bm.opacity = Math.sin(t * 2.2) > 0.4 ? 1 : 0.15;
        });

        const rf = txtTex(256, 256, (c, w, h) => {
          for (let i = 0; i < 160; i++) {
            const y = rnd() * h;
            const len = 40 + rnd() * 190;
            const gr = c.createLinearGradient(w - len, 0, w, 0);
            gr.addColorStop(0, 'rgba(255,200,130,0)');
            gr.addColorStop(1, 'rgba(255,210,150,' + (0.25 + rnd() * 0.5) + ')');
            c.fillStyle = gr;
            c.fillRect(w - len, y, len, 1 + rnd() * 2);
          }
        });
        const rp = new THREE.Mesh(
          new THREE.PlaneGeometry(500, 800),
          new THREE.MeshBasicMaterial({ map: rf, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
        );
        rp.rotation.x = -Math.PI / 2;
        rp.position.set(560, -O6.y + WL + 0.35, 0);
        rp.renderOrder = 1;
        g.add(rp);
      }
    }

    // ---------- Cuerpos exteriores de las torres hasta el mar ----------
    const facadeDraw = (c, w, h) => {
      const cols = 3, rows = 2, cw = w / cols, rh = h / rows;
      let sd = 11;
      const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
      c.fillStyle = '#6a9dbd';
      c.fillRect(0, 0, w, h);
      for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
          const x = q * cw, y = r * rh, lit = rnd() < 0.16;
          const gr = c.createLinearGradient(0, y, 0, y + rh);
          if (lit) {
            gr.addColorStop(0, '#ffe9bf');
            gr.addColorStop(1, '#ffd08a');
          } else {
            gr.addColorStop(0, '#b4d9ec');
            gr.addColorStop(1, '#6a9dbd');
          }
          c.fillStyle = gr;
          c.fillRect(x, y, cw, rh);
          if (!lit) {
            c.fillStyle = 'rgba(236,246,252,.16)';
            c.beginPath();
            c.moveTo(x + cw * 0.1, y + rh * 0.95);
            c.lineTo(x + cw * 0.55, y + rh * 0.26);
            c.lineTo(x + cw * 0.8, y + rh * 0.26);
            c.lineTo(x + cw * 0.35, y + rh * 0.95);
            c.fill();
          }
          c.fillStyle = 'rgba(28,46,64,.5)';
          c.fillRect(x, y, cw, rh * 0.2);
        }
      }
      c.strokeStyle = 'rgba(236,246,252,.8)';
      c.lineWidth = 3;
      for (let q = 0; q <= cols; q++) {
        const x = Math.min(w - 1.5, Math.max(1.5, q * cw));
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.stroke();
      }
    };

    let FAC = null, FOAM = null;
    const facMat = (rx, ry) => {
      if (!FAC) FAC = txtTex(512, 512, facadeDraw, true, true);
      const t = FAC.clone();
      t.needsUpdate = true;
      t.repeat.set(rx, ry);
      return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.34, roughness: 0.3, metalness: 0.12 });
    };
    const repOf = (L, H) => [Math.max(1, Math.round(L / 9.3)), Math.max(1, Math.round(H / 12.4))];

    function foam(g, cx, cz, w, d) {
      if (!FOAM) {
        FOAM = txtTex(256, 256, (c, W, H) => {
          const gr = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
          gr.addColorStop(0, 'rgba(255,255,255,0)');
          gr.addColorStop(0.45, 'rgba(255,255,255,0)');
          gr.addColorStop(0.6, 'rgba(235,248,255,.6)');
          gr.addColorStop(0.8, 'rgba(220,240,255,.18)');
          gr.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = gr;
          c.fillRect(0, 0, W, H);
        });
      }
      const m = new THREE.MeshBasicMaterial({ map: FOAM, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
      f.rotation.x = -Math.PI / 2;
      f.position.set(cx, WL - O6.y + 0.14, cz);
      f.renderOrder = 1;
      f.userData.dyn = true;
      g.add(f);
      M6.an.push((t) => {
        m.opacity = 0.45 + 0.12 * Math.sin(t * 0.9 + cx * 0.3 + cz);
      });
    }

    function towerBody(g, gStatic, K, cx, cz, SW, SD, yBot) {
      const SEAL = WL - O6.y, top = yBot + 0.02, W = SW - 0.7, D = SD - 0.7, hh = top - SEAL;
      const pod = Math.max(8, Math.min(44, hh * 0.26)), yp = SEAL + pod, yb = SEAL + 8;
      const { concD, trim, cool } = K, cm = K.cm || trim;

      bx(gStatic, SW + 0.5, 0.28, SD + 0.5, cx, yBot - 0.14, cz, trim);
      for (const sz of [-1, 1]) bx(gStatic, SW, 0.05, 0.12, cx, yBot - 0.31, cz + sz * (SD / 2 + 0.2), cool);
      for (const sx of [-1, 1]) bx(gStatic, 0.12, 0.05, SD, cx + sx * (SW / 2 + 0.2), yBot - 0.31, cz, cool);

      const H = top - yp, a = repOf(D, H), b = repOf(W, H), mx = facMat(a[0], a[1]), mz = facMat(b[0], b[1]);
      const sh = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [mx, mx, concD, concD, mz, mz]);
      sh.position.set(cx, yp + H / 2, cz);
      g.add(sh);

      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) bx(gStatic, 0.9, H, 0.9, cx + sx * (W / 2), yp + H / 2, cz + sz * (D / 2), cm);
      }
      const n = Math.max(1, Math.floor(H / 17.7));
      inst(gStatic, new THREE.BoxGeometry(W + 0.5, 0.5, D + 0.5), cm, n, (i) => [cx, yp + (H * (i + 1)) / (n + 1), cz]);

      const PW = W + 3.6, PD = D + 3.6, ph = yp - yb;
      const pa = repOf(PD, ph), pb = repOf(PW, ph), pmx = facMat(pa[0], pa[1]), pmz = facMat(pb[0], pb[1]);
      const pd = new THREE.Mesh(new THREE.BoxGeometry(PW, ph, PD), [pmx, pmx, concD, concD, pmz, pmz]);
      pd.position.set(cx, yb + ph / 2, cz);
      g.add(pd);

      bx(gStatic, PW + 0.8, 0.7, PD + 0.8, cx, yp + 0.1, cz, cm);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) bx(gStatic, 0.9, ph, 0.9, cx + sx * (PW / 2), yb + ph / 2, cz + sz * (PD / 2), cm);
      }
      const fw = W + 9, fd = D + 9;
      frust(gStatic, PW, PD, fw, fd, 13, cx, yb - 6.5, cz, concD);
      foam(g, cx, cz, fw * 1.75, fd * 1.75);
    }

    let TG = null, BCM = null, BMM = null;
    function roofTop(g, gStatic, K, cx, cz, SW, SD, y0) {
      const cm = K.cm || K.trim;
      if (!TG) TG = new THREE.MeshStandardMaterial({ color: 0x9bc9df, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.55, depthWrite: false, emissive: 0x9bc9df, emissiveIntensity: 0.25 });
      if (!BCM) {
        BCM = new THREE.SpriteMaterial({ map: dotTex('rgba(255,70,50,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
        M6.an.push((t) => {
          BCM.opacity = 0.35 + 0.65 * (Math.sin(t * 2.4) > 0.55 ? 1 : 0.18);
        });
      }
      if (!BMM) BMM = new THREE.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });

      bx(gStatic, SW + 0.9, 1.1, SD + 0.9, cx, y0 + 0.55, cz, cm);
      bx(gStatic, SW * 0.72, 5, SD * 0.72, cx, y0 + 3.6, cz, TG);
      bx(gStatic, SW * 0.42, 4, SD * 0.42, cx, y0 + 8.1, cz, cm);
      cyl(gStatic, 0.12, 0.2, 16, cx, y0 + 18.1, cz, cm, 8);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const sp = new THREE.Sprite(BCM);
          sp.scale.setScalar(7);
          sp.position.set(cx + sx * (SW / 2 - 0.3), y0 + 1.7, cz + sz * (SD / 2 - 0.3));
          g.add(sp);
        }
      }
      const tip = new THREE.Sprite(BCM);
      tip.scale.setScalar(5);
      tip.position.set(cx, y0 + 26.4, cz);
      g.add(tip);
      const bm = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 520, 12, 1, true), BMM);
      bm.position.set(cx, y0 + 270, cz);
      bm.frustumCulled = false;
      g.add(bm);
    }

    function bridgeSkin(gStatic, K) {
      const cm = K.cm || K.trim, dk = stdM(0x263642, 0.1, { roughness: 0.5, metalness: 0.62 });
      bx(gStatic, 24.6, 0.5, 5.6, -18, -0.62, 0, dk);
      for (const sd of [-1, 1]) bx(gStatic, 24.4, 0.05, 0.04, -18, -0.62, sd * 2.82, K.cool);
      for (let x = -29; x <= -7; x += 2.2) {
        for (const sd of [-1, 1]) bx(gStatic, 0.16, 1.1, 0.16, x, -1.2, sd * 2.7, cm);
        bx(gStatic, 2.2, 0.13, 0.13, x + 1.1, -1.75, 0, cm);
      }
    }

    function pier(g, gStatic, K, x, z, yTop, wTop) {
      const SEAL = WL - O6.y, { concD } = K, h = yTop - (SEAL - 4);
      if (h < 4) return;
      frust(gStatic, wTop, wTop, wTop + 1.6, wTop + 1.6, h, x, yTop - h / 2, z, concD);
      foam(g, x, z, wTop * 9 + 8, wTop * 9 + 8);
    }

    function trestle(g, gStatic, K, x, yTop, zs, wTop) {
      const SEAL = WL - O6.y, h = yTop - SEAL;
      for (const sz of [-1, 1]) pier(g, gStatic, K, x, sz * zs, yTop - 0.7, wTop);
      bx(gStatic, wTop + 0.6, 0.7, 2 * zs + wTop + 0.6, x, yTop - 0.35, 0, K.concD);
      const n = Math.floor(h / 30);
      if (n > 0) inst(gStatic, new THREE.BoxGeometry(wTop * 0.8, 0.8, 2 * zs), K.trim, n, (i) => [x, yTop - 18 - i * 30, 0]);
    }

    function grounded(g, K0) {
      const K = Object.assign({}, K0, { cm: stdM(0x56697a, 0.12, { roughness: 0.4, metalness: 0.65 }) });
      const gStatic = new THREE.Group();
      g.add(gStatic);

      towerBody(g, gStatic, K, -39, 0, 18, 18, -0.4);
      towerBody(g, gStatic, K, 3, 0, 18, 18, -0.4);
      towerBody(g, gStatic, K, 45, 0, 22, 18, TOP - 0.4);
      roofTop(g, gStatic, K, -39, 0, 18, 18, 7.4);
      roofTop(g, gStatic, K, 3, 0, 18, 18, 7.4);

      const clad = (w, x, y, z, ry) => {
        const r = repOf(w, 7.2), m = facMat(r[0], 0.5), p = new THREE.Mesh(new THREE.PlaneGeometry(w, 7.2), m);
        p.position.set(x, y, z);
        p.rotation.y = ry;
        g.add(p);
      };
      for (const cx of [-39, 3]) {
        for (const sz of [-1, 1]) clad(18.4, cx, 3.6, sz * 9.215, sz > 0 ? 0 : Math.PI);
      }
      clad(18.4, -48.215, 3.6, 0, -Math.PI / 2);

      for (const x of [-24, -12]) trestle(g, gStatic, K, x, -0.55, 1.9, 1.5);
      bridgeSkin(gStatic, K);
      bx(gStatic, 22.6, 0.5, 5.4, 23.2, -0.25, 0, K.concD);
      for (const x of [18, 28]) trestle(g, gStatic, K, x, -0.5, 1.9, 1.5);

      mergeStaticGroup(gStatic);
    }

    // ---------- Niebla marina optimizada (4x más rápida) ----------
    const MIST_MAX = 0.9;
    function mist(g) {
      const SEAL = WL - O6.y, tc = typeof touch !== 'undefined' && touch;
      const base = txtTex(
        256,
        256,
        (c, w, h) => {
          c.clearRect(0, 0, w, h);
          let sd = 7;
          const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
          for (let i = 0; i < 90; i++) {
            const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 55, a = 0.05 + rnd() * 0.14;
            for (const ox of [-w, 0, w]) {
              for (const oy of [-h, 0, h]) {
                const gr = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
                gr.addColorStop(0, 'rgba(255,255,255,' + a + ')');
                gr.addColorStop(1, 'rgba(255,255,255,0)');
                c.fillStyle = gr;
                c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
              }
            }
          }
        },
        true
      );
      const tint = new THREE.Color(), mats = [];

      const fbm = (n, seed) => {
        let sd = seed;
        const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
        const out = new Float32Array(n * n);
        const oct = [[3, 1], [6, 0.55], [12, 0.3], [24, 0.16]];
        let tot = 0;
        for (const [cl, wt] of oct) {
          tot += wt;
          const gr = new Float32Array(cl * cl);
          for (let i = 0; i < gr.length; i++) gr[i] = rnd();
          for (let y = 0; y < n; y++) {
            const fy = (y / n) * cl, iy = Math.floor(fy);
            let ty = fy - iy;
            ty = ty * ty * (3 - 2 * ty);
            const y0 = (iy % cl) * cl, y1 = ((iy + 1) % cl) * cl;
            for (let x = 0; x < n; x++) {
              const fx = (x / n) * cl, ix = Math.floor(fx);
              let tx = fx - ix;
              tx = tx * tx * (3 - 2 * tx);
              const x0 = ix % cl, x1 = (ix + 1) % cl;
              const a = gr[y0 + x0] + (gr[y0 + x1] - gr[y0 + x0]) * tx;
              const b = gr[y1 + x0] + (gr[y1 + x1] - gr[y1 + x0]) * tx;
              out[y * n + x] += wt * (a + (b - a) * ty);
            }
          }
        }
        for (let i = 0; i < out.length; i++) out[i] /= tot;
        return out;
      };

      const cloudTex = (seed, up) => {
        const N = tc ? 96 : 128;
        return txtTex(
          N,
          N,
          (c, w, h) => {
            const nz = fbm(w, seed), im = c.createImageData(w, h), d = im.data;
            const sm = (a, b, x) => {
              x = Math.max(0, Math.min(1, (x - a) / (b - a)));
              return x * x * (3 - 2 * x);
            };
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const i = y * w + x, n = nz[i], lit = 0.5 + (n - nz[((y + 2) % h) * w + ((x + 2) % w)]) * 6, k = i * 4;
                if (up) {
                  const b = 0.74 + 0.26 * n + (lit - 0.5) * 0.22;
                  d[k] = Math.min(255, b * 255);
                  d[k + 1] = Math.min(255, b * 258);
                  d[k + 2] = Math.min(255, b * 262);
                  d[k + 3] = Math.round(sm(0.38, 0.64, n) * 255);
                } else {
                  const b = 0.58 + 0.34 * n + (lit - 0.5) * 0.2;
                  d[k] = Math.min(255, b * 232);
                  d[k + 1] = Math.min(255, b * 242);
                  d[k + 2] = Math.min(255, b * 255);
                  d[k + 3] = 255;
                }
              }
            }
            c.putImageData(im, 0, 0);
          },
          true
        );
      };

      const floorLo = cloudTex(41, false), floorUp = cloudTex(77, true);
      const LAY = tc
        ? [[8, 0.5, 4.5, 0.01], [48, 0.34, 3.5, -0.007], [118, 0.24, 3.0, 0.005], [188, 0.96, 2.6, 0.004], [203, 0.98, 2, -0.003]]
        : [[8, 0.5, 5, 0.01], [32, 0.42, 4, -0.008], [78, 0.28, 3.4, 0.006], [128, 0.22, 3, -0.005], [188, 0.96, 2.6, 0.004], [203, 0.98, 2, -0.003]];
      for (const L of LAY) {
        const op = L[1] > 0.9, lo = L[0] < 195, t = op ? (lo ? floorLo : floorUp) : base.clone(), rp = op ? (lo ? 6 : 5) : L[2];
        t.needsUpdate = true;
        t.repeat.set(rp, rp);
        const m = new THREE.MeshBasicMaterial({ map: t, color: 0xdfe9f0, transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide });
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(4200, 4200), m);
        pl.rotation.x = -Math.PI / 2;
        pl.position.set(300, SEAL + L[0], 100);
        pl.renderOrder = -1;
        pl.frustumCulled = false;
        g.add(pl);
        mats.push({ m, t, o: L[1], v: L[3] });
      }

      const gz = txtTex(8, 256, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.45, 'rgba(255,255,255,.28)');
        gr.addColorStop(1, 'rgba(255,255,255,.95)');
        c.fillStyle = gr;
        c.fillRect(0, 0, w, h);
      });
      const gauze = [];
      for (const [x, o] of [[140, 0.68], [420, 0.78]]) {
        const m = new THREE.MeshBasicMaterial({ map: gz, color: 0xdfe9f0, transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide });
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(1800, 230), m);
        pl.rotation.y = Math.PI / 2;
        pl.position.set(x, SEAL + 105, 0);
        pl.renderOrder = -1;
        pl.frustumCulled = false;
        g.add(pl);
        gauze.push({ m, o });
      }

      const bk = txtTex(8, 256, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.1, 'rgba(255,255,255,.97)');
        gr.addColorStop(1, 'rgba(255,255,255,1)');
        c.fillStyle = gr;
        c.fillRect(0, 0, w, h);
      });
      const bank = [];
      for (const [z, x0, x1] of [[430, -1100, 560], [820, -1400, 900]]) {
        const m = new THREE.MeshBasicMaterial({ map: bk, color: 0xdfe9f0, transparent: true, opacity: 1, depthWrite: true, alphaTest: 0.02, fog: false, side: THREE.DoubleSide });
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 440), m);
        pl.position.set((x0 + x1) / 2, 20 - 220, z);
        pl.renderOrder = -100;
        pl.frustumCulled = false;
        g.add(pl);
        bank.push(m);
      }

      const ct = txtTex(
        512,
        128,
        (c, w, h) => {
          c.clearRect(0, 0, w, h);
          let sd = 23;
          const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
          for (let i = 0; i < 54; i++) {
            const x = rnd() * w, y = h * 0.4 + rnd() * h * 0.26, r = 20 + rnd() * 34, a = 0.1 + rnd() * 0.17;
            for (const ox of [-w, 0, w]) {
              const gr = c.createRadialGradient(x + ox, y, 0, x + ox, y, r);
              gr.addColorStop(0, 'rgba(255,255,255,' + a + ')');
              gr.addColorStop(1, 'rgba(255,255,255,0)');
              c.fillStyle = gr;
              c.fillRect(x + ox - r, y - r, r * 2, r * 2);
            }
          }
        },
        true
      );
      const tops = [];
      for (const [z, o, v, y, rp] of tc ? [[330, 0.5, 0.0035, -6, 4], [390, 0.4, -0.0025, -14, 5]] : [[270, 0.42, 0.0042, 2, 3.5], [390, 0.4, 0.002, -14, 5]]) {
        const t = ct.clone();
        t.needsUpdate = true;
        t.repeat.set(rp, 1);
        const m = new THREE.MeshBasicMaterial({ map: t, color: 0xdfe9f0, transparent: true, opacity: o, depthWrite: false, fog: false, side: THREE.DoubleSide });
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(2400, 76), m);
        pl.position.set(-300, y, z);
        pl.renderOrder = -90;
        pl.frustumCulled = false;
        g.add(pl);
        tops.push({ m, t, o, v });
      }

      const pTex = (sd0) =>
        txtTex(160, 112, (c, w, h) => {
          let sd = sd0;
          const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
          const bl = [];
          for (let i = 0; i < 9; i++) bl.push([w * 0.2 + rnd() * w * 0.6, h * 0.5 + rnd() * h * 0.16 - Math.abs(i - 4) * 3, 18 + rnd() * 20]);
          for (const b of bl) {
            const gr = c.createRadialGradient(b[0], b[1] + 4, 0, b[0], b[1] + 4, b[2] * 1.25);
            gr.addColorStop(0, 'rgba(176,190,212,.85)');
            gr.addColorStop(1, 'rgba(176,190,212,0)');
            c.fillStyle = gr;
            c.fillRect(0, 0, w, h);
          }
          for (const b of bl) {
            const gr = c.createRadialGradient(b[0] - b[2] * 0.18, b[1] - b[2] * 0.3, 0, b[0], b[1], b[2]);
            gr.addColorStop(0, 'rgba(255,255,255,.95)');
            gr.addColorStop(0.6, 'rgba(246,249,255,.6)');
            gr.addColorStop(1, 'rgba(240,245,255,0)');
            c.fillStyle = gr;
            c.fillRect(0, 0, w, h);
          }
        });
      const pm = [11, 29, 53].map((sd0) => new THREE.SpriteMaterial({ map: pTex(sd0), color: 0xffffff, transparent: true, opacity: 0.92, depthWrite: false, fog: false }));
      const pf = [], XMIN = -1200, SPAN = 1720;
      {
        let sd = 5;
        const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
        const PN = tc ? 24 : 48;
        for (let i = 0; i < PN; i++) {
          const x0 = XMIN + rnd() * SPAN, z = -900 + rnd() * 1310, sz = 70 + rnd() * 110;
          if (z > -40 && z < 40 && x0 > -90 && x0 < 100) continue;
          const sp = new THREE.Sprite(pm[i % 3]);
          sp.scale.set(sz, sz * 0.7, 1);
          sp.position.set(x0, -52 + rnd() * 10, z);
          sp.renderOrder = -80;
          sp.frustumCulled = true;
          g.add(sp);
          pf.push({ s: sp, x0, v: 0.6 + rnd() * 1.6 });
        }
      }

      const wh = new THREE.Color(0xffffff);
      M6.an.push((t) => {
        const st = (typeof WX !== 'undefined' && WX.st) || {};
        const nt = (typeof PC !== 'undefined' && PC && PC.night) || 0;
        const f = Math.min(1, MIST_MAX * (0.62 + 0.38 * Math.sin(t * 0.045)) * (1 + (st.fog || 0) * 0.8 + (st.rain || 0) * 0.3) + (st.fog || 0) * 0.25);
        const dk = 1 - nt * 0.35 - (st.sc || 0) * 0.25 + (st.flash || 0) * 0.8;
        if (scene.fog) tint.copy(scene.fog.color).lerp(wh, 0.22);
        else tint.set(0xdfe9f0);
        tint.multiplyScalar(Math.max(0.25, dk));
        for (let i = 0; i < mats.length; i++) {
          const q = mats[i];
          q.m.color.copy(tint);
          q.m.opacity = q.o > 0.9 ? q.o : Math.min(0.85, q.o * f);
          q.t.offset.x = t * q.v;
          q.t.offset.y = t * q.v * 0.6;
        }
        for (let i = 0; i < gauze.length; i++) {
          const q = gauze[i];
          q.m.color.copy(tint);
          q.m.opacity = Math.min(0.92, q.o * (0.55 + 0.45 * f));
        }
        for (let i = 0; i < bank.length; i++) bank[i].color.copy(tint);
        for (let i = 0; i < pm.length; i++) pm[i].color.copy(tint).lerp(wh, 0.35);
        for (let i = 0; i < pf.length; i++) pf[i].s.position.x = XMIN + ((((pf[i].x0 - XMIN + t * pf[i].v) % SPAN) + SPAN) % SPAN);
        for (let i = 0; i < tops.length; i++) {
          const q = tops[i];
          q.m.color.copy(tint);
          q.m.opacity = Math.min(0.85, q.o * (0.75 + 0.4 * f));
          q.t.offset.x = (t * q.v) % 1;
        }
        if (scene.fog) {
          const hz = Math.min(0.7, 0.22 + 0.35 * (st.fog || 0) + 0.15 * (st.rain || 0)) * (1 - nt);
          if (M6.city) M6.city.material.color.setRGB(0.8, 0.82, 0.85).lerp(scene.fog.color, hz);
          if (M6.decorCity) M6.decorCity.material.color.setRGB(0.8, 0.82, 0.85).lerp(scene.fog.color, Math.min(0.82, hz + 0.08));
        }
      });
    }

    // ---------- Construcción y limpieza ----------
    function disposeMat(m, seenTex) {
      if (!m) return;
      const keys = ['map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'metalnessMap', 'normalMap', 'roughnessMap'];
      for (let i = 0; i < keys.length; i++) {
        const t = m[keys[i]];
        if (t && t.dispose && !seenTex.has(t)) {
          seenTex.add(t);
          t.dispose();
        }
      }
      if (m.dispose) m.dispose();
    }

    function disposeChapter() {
      try {
        if (M6.raf) cancelAnimationFrame(M6.raf);
        M6.raf = 0;
        if (M6.markerRAF) {
          cancelAnimationFrame(M6.markerRAF);
          M6.markerRAF = 0;
        }
      } catch (e) {}
      try {
        ambStop();
      } catch (e) {}
      const root = M6.g, geos = new Set(), mats = new Set(), tex = new Set();
      if (root) {
        const visit = (o) => {
          if (!o) return;
          if (o.geometry) geos.add(o.geometry);
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (let i = 0; i < ms.length; i++) if (ms[i]) mats.add(ms[i]);
          if (o.children) for (let i = 0; i < o.children.length; i++) visit(o.children[i]);
        };
        if (typeof root.traverse === 'function') root.traverse(visit);
        else visit(root);
        if (root.parent && typeof root.parent.remove === 'function') root.parent.remove(root);
      }
      for (const m of mats) disposeMat(m, tex);
      for (const g of geos) if (g !== __BOX_GEO && g.dispose) g.dispose();
      for (const t of __DOT_TEX.values()) {
        if (t && t.dispose && !tex.has(t)) {
          tex.add(t);
          t.dispose();
        }
      }
      __DOT_TEX.clear();
      for (const g of __CYL_GEO.values()) if (g.dispose) g.dispose();
      __CYL_GEO.clear();
      uninstallHooks();
      try {
        if (scene.fog && M6.fogDensity0 != null) scene.fog.density = M6.fogDensity0;
      } catch (e) {}
      M6.an = [];
      M6.props = [];
      M6.pts = [];
      M6.gates = {};
      M6.alc = {};
      M6.look = {};
      M6.g = null;
      M6.city = null;
      M6.decorCity = null;
      M6.cityFar = null;
      M6.built = false;
      M6.near = '';
      M6.warned = false;
      M6.kid = null;
      M6.busy = false;
      M6.fogDensity0 = null;
      M6.preloadStarted = false;
      M6.preloadPromise = null;
      M6.preloadReady = false;
      M6.preloadWaiters = [];
      cancelChapterPreload();
      FG.geo = null;
      FG.mat = {};
      FG.hm = {};
      FG.halo = null;
      FG.m2 = {};
      WINR = null;
      FAC = null;
      FOAM = null;
      TG = null;
      BCM = null;
      BMM = null;
    }

    function preloadChapter() {
      if (M6.built || M6.preloadStarted || M6.preloadPromise) return M6.preloadPromise || Promise.resolve();
      M6.preloadStarted = true;
      M6.preloadPerf.state = 'queued';
      M6.preloadPerf.started = performance.now();
      try {
        if (R && R.info && R.info.memory) {
          M6.preloadPerf.geo0 = R.info.memory.geometries;
          M6.preloadPerf.tex0 = R.info.memory.textures;
        }
      } catch (e) {}
      const run = () => {
        M6.preloadPerf.state = 'building';
        const t0 = performance.now();
        try {
          build();
          M6.preloadPerf.ms = +(performance.now() - t0).toFixed(2);
          M6.preloadPerf.ended = performance.now();
          M6.preloadPerf.state = 'ready';
          M6.preloadReady = true;
          const ww = M6.preloadWaiters.splice(0);
          for (let i = 0; i < ww.length; i++) {
            try {
              ww[i]();
            } catch (e) {
              console.warn('Capítulo VI (entrada tras precarga):', e);
            }
          }
          try {
            if (R && R.info && R.info.memory) {
              M6.preloadPerf.geo1 = R.info.memory.geometries;
              M6.preloadPerf.tex1 = R.info.memory.textures;
            }
          } catch (e) {}
        } catch (e) {
          M6.preloadPerf.ms = +(performance.now() - t0).toFixed(2);
          M6.preloadPerf.ended = performance.now();
          M6.preloadPerf.state = 'error';
          M6.preloadStarted = false;
          M6.preloadPromise = null;
          const ww = M6.preloadWaiters.splice(0);
          for (let i = 0; i < ww.length; i++) {
            try {
              ww[i]();
            } catch (_e) {}
          }
          throw e;
        }
      };
      M6.preloadPromise = new Promise((resolve, reject) => {
        const go = () => {
          try {
            run();
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        try {
          if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 1400 });
          else setTimeout(go, 320);
        } catch (e) {
          setTimeout(go, 320);
        }
      });
      return M6.preloadPromise;
    }
    function cancelChapterPreload() {
      if (M6.preloadTimer) {
        clearTimeout(M6.preloadTimer);
        M6.preloadTimer = 0;
      }
    }

    function build() {
      if (M6.built) return;
      M6.pts = [];
      M6.props = [];
      M6.gates = {};
      M6.an = [];
      M6.alc = {};
      M6.look = {};
      M6.near = '';

      const g = new THREE.Group();
      g.position.set(O6.x, O6.y, O6.z);
      scene.add(g);
      M6.g = g;

      const arch = new THREE.Group();
      g.add(arch);

      const conc = stdM(0xcfd3d6, 0.26);
      const concD = stdM(0x9aa2aa, 0.22);
      const floA = stdM(0x8a7458, 0.3);
      const floB = stdM(0x7f8ea0, 0.3);
      const steel = stdM(0x59636d, 0.2);
      const warm = glowM(0xffe2b0, 0.9);
      const cool = glowM(0x9fe0ff, 0.5);
      const gl = glassM(0xbfe3f2, 0.28);
      const glFl = glassM(0x9fd0e8, 0.32);

      const wall = (ax, fx, a0, a1, h, mat, gap) => {
        const segs = gap ? [[a0, gap[0]], [gap[1], a1]] : [[a0, a1]];
        for (const s of segs) {
          const L = s[1] - s[0], c = (s[0] + s[1]) / 2;
          if (L < 0.01) continue;
          if (ax === 'x') bx(arch, L, h, 0.4, c, h / 2, fx, mat);
          else bx(arch, 0.4, h, L, fx, h / 2, c, mat);
        }
        if (gap) {
          const L = gap[1] - gap[0], c = (gap[0] + gap[1]) / 2, dh = h - 3.4;
          if (dh > 0.05) {
            if (ax === 'x') bx(arch, L, dh, 0.4, c, 3.4 + dh / 2, fx, mat);
            else bx(arch, 0.4, dh, L, fx, 3.4 + dh / 2, c, mat);
          }
        }
      };
      const lightStrip = (x, y, z, w, d) => bx(arch, w, 0.06, d, x, y, z, warm);

      // === Torre A · Pasado ===
      bx(arch, 18, 0.4, 18, -39, -0.2, 0, floA);
      bx(arch, 18, 0.4, 18, -39, 7.2, 0, concD);
      wall('x', -9, -48, -30, 7, conc);
      wall('x', 9, -48, -30, 7, conc);
      wall('z', -48, -9, 9, 7, conc);
      wall('z', -30, -9, 9, 7, conc, [-2.5, 2.5]);
      for (const z of [-4, 4]) lightStrip(-39, 7, z, 14, 0.35);

      // === Puente de cristal ===
      bx(arch, 24, 0.25, 5, -18, -0.125, 0, glFl);
      for (const s of [-1, 1]) {
        bx(arch, 24, 0.3, 0.3, -18, -0.4, s * 2.2, steel);
        bx(arch, 24, 3.2, 0.08, -18, 1.6, s * 2.5, gl);
        bx(arch, 24, 0.1, 0.1, -18, 3.2, s * 2.5, steel);
      }
      for (let x = -29; x <= -7; x += 4) {
        for (const s of [-1, 1]) {
          bx(arch, 0.12, 3.2, 0.12, x, 1.6, s * 2.5, steel);
          const gus = bx(arch, 0.08, 0.72, 0.08, x, 2.95, s * 2.24, steel);
          gus.rotation.x = s * 0.78;
        }
        bx(arch, 0.14, 0.14, 5.12, x, 3.22, 0, steel);
      }
      for (let x = -28; x <= -8; x += 2) bx(arch, 0.07, 0.05, 4.9, x, -0.22, 0, steel);
      for (let x = -28; x <= -8; x += 4) {
        const u = (x + 28) / 20;
        const nc = new THREE.Color(0xffd6a0).lerp(new THREE.Color(0x9fe0ff), u).getHex();
        for (const s of [-1, 1]) bx(arch, 0.42, 0.025, 0.07, x, 0.025, s * 2.35, glowM(nc, 0.7));
      }
      bx(arch, 24, 0.12, 5.2, -18, 3.5, 0, gl);
      {
        const pulse = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.025, 0.08), glowM(0xdff7ff, 0.85));
        pulse.position.set(-28, 0.028, 2.2);
        pulse.userData.dyn = true;
        g.add(pulse);
        const pulse2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.025, 0.08), glowM(0xdff7ff, 0.85));
        pulse2.position.set(-28, 0.028, -2.2);
        pulse2.userData.dyn = true;
        g.add(pulse2);
        M6.an.push((t) => {
          const px = -29 + ((t * 3.8) % 22);
          pulse.position.x = px;
          pulse2.position.x = px;
        });
      }

      // === Torre B · Futuros ===
      bx(arch, 18, 0.4, 18, 3, -0.2, 0, floB);
      bx(arch, 18, 0.4, 18, 3, 7.2, 0, concD);
      wall('x', -9, -6, 12, 7, conc);
      wall('x', 9, -6, 12, 7, conc);
      wall('z', -6, -9, 9, 7, conc, [-2.5, 2.5]);
      wall('z', 12, -9, 9, 7, conc, [-2.5, 2.5]);
      for (const z of [-4, 4]) lightStrip(3, 7, z, 14, 0.35);

      // === Escalera de cristal (instanciada en 3 InstancedMesh) ===
      {
        const sA = stdM(0xb7c4cf, 0.26), sB = stdM(0xc9d3dc, 0.26), nose = stdM(0xeaf6ff, 0.5);
        const unitBox = new THREE.BoxGeometry(1, 1, 1);
        const halfN = Math.ceil(NST / 2);
        const imA = new THREE.InstancedMesh(unitBox, sA, NST - halfN);
        const imB = new THREE.InstancedMesh(unitBox, sB, halfN);
        const imN = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.03, 5.02), nose, NST);
        const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ps = new THREE.Vector3(), sc = new THREE.Vector3();
        let ia = 0, ib = 0;
        for (let k = 0; k < NST; k++) {
          const h = (k + 1) * RISE;
          ps.set(12 + RUN * (k + 0.5), h / 2, 0);
          sc.set(RUN, h, 5);
          m4.compose(ps, q, sc);
          if (k % 2) imA.setMatrixAt(ia++, m4);
          else imB.setMatrixAt(ib++, m4);
          ps.set(12 + RUN * (k + 1) - 0.03, h + 0.015, 0);
          sc.set(1, 1, 1);
          m4.compose(ps, q, sc);
          imN.setMatrixAt(k, m4);
        }
        [imA, imB, imN].forEach((im) => {
          if (im.instanceMatrix) im.instanceMatrix.needsUpdate = true;
          safeInstBounds(im);
          im.updateMatrix();
          im.matrixAutoUpdate = false;
          g.add(im);
        });
      }

      // === Detalle arquitectónico ===
      {
        const trim = stdM(0x6e7882, 0.18), beam = stdM(0xb5bcc3, 0.2);
        for (const T of [{ cx: -39, x0: -48, x1: -30 }, { cx: 3, x0: -6, x1: 12 }]) {
          for (const sz of [-1, 1]) bx(arch, 17.2, 0.18, 0.07, T.cx, 0.09, sz * 8.76, trim);
          for (const sx of [T.x0 + 0.22, T.x1 - 0.22]) bx(arch, 0.07, 0.18, 17.2, sx, 0.09, 0, trim);
          for (const sx of [T.x0 + 0.62, T.x1 - 0.62]) {
            for (const sz of [-8.4, 8.4]) cyl(arch, 0.2, 0.24, 6.9, sx, 3.5, sz, conc, 10);
          }
          for (let x = T.x0 + 2; x < T.x1; x += 4) bx(arch, 0.28, 0.3, 17.6, x, 6.85, 0, beam);
          for (const sz of [-1, 1]) bx(arch, 17.4, 0.1, 0.1, T.cx, 6.62, sz * 8.7, warm);
        }
        for (const fx of [-30, -6, 12]) {
          for (const sz of [-1, 1]) bx(arch, 0.5, 3.4, 0.16, fx, 1.7, sz * 2.62, steel);
        }
        for (let x = -28; x <= -8; x += 4) bx(arch, 0.1, 0.1, 5, x, -0.3, 0, steel);
        for (const sz of [-1, 1]) bx(arch, 24, 0.06, 0.06, -18, 3.52, sz * 2.5, warm);
      }

      const pg = new THREE.BoxGeometry(RUN, 3.2, 0.08);
      for (const s of [-1, 1]) {
        inst(arch, pg, gl, NST, (i) => [12 + RUN * (i + 0.5), (i + 1) * RISE + 1.6, s * 2.5]);
        inst(arch, new THREE.BoxGeometry(RUN, 0.1, 0.1), steel, NST, (i) => [12 + RUN * (i + 0.5), (i + 1) * RISE + 3.2, s * 2.5]);
      }
      inst(arch, new THREE.BoxGeometry(RUN, 0.12, 5.2), gl, NST, (i) => [12 + RUN * (i + 0.5), (i + 1) * RISE + 3.5, 0]);

      // === Último piso ===
      bx(arch, 22, 0.4, 18, 45, TOP - 0.2, 0, stdM(0x2a3036, 0.35));
      bx(arch, 22, 0.4, 18, 45, TOP + 6.2, 0, concD);
      wall('z', 34, -9, 9, 6, conc, [-2.5, 2.5]);
      for (const z of [-9, 9]) bx(arch, 22, 6, 0.12, 45, TOP + 3, z, gl);
      for (const z of [-9, 9]) {
        for (let x = 35; x <= 55; x += 5) bx(arch, 0.14, 6, 0.2, x, TOP + 3, z, steel);
      }
      bx(arch, 0.12, 6, 18, 56, TOP + 3, 0, gl);
      for (let z = -9; z <= 9; z += 3) bx(arch, 0.2, 6, 0.14, 56, TOP + 3, z, steel);
      bx(arch, 0.2, 0.16, 18, 56, TOP + 0.1, 0, steel);
      bx(arch, 0.2, 0.16, 18, 56, TOP + 5.9, 0, steel);
      for (const z of [-4, 4]) lightStrip(45, TOP + 6, z, 16, 0.3);

      mergeStaticGroup(arch);

      // Inscripción luminosa en el suelo
      const phrase = txtTex(
        1024,
        256,
        (c, w, h) => {
          c.clearRect(0, 0, w, h);
          c.fillStyle = '#f4efe0';
          c.font = 'italic 46px Georgia,serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('No puedes recordar el futuro', w / 2, h * 0.38);
          c.fillText('porque todavía no ha ocurrido.', w / 2, h * 0.64);
        },
        false,
        true
      );
      const ph = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 2.25),
        new THREE.MeshBasicMaterial({ map: phrase, transparent: true, depthWrite: false, fog: false })
      );
      ph.rotation.x = -Math.PI / 2;
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(46, TOP + 0.03, 0);
      g.add(ph);
      const phGlow = new THREE.Mesh(new THREE.PlaneGeometry(11, 4), glowM(0xffe9bd, 0.14));
      phGlow.rotation.x = -Math.PI / 2;
      phGlow.position.set(46, TOP + 0.02, 0);
      g.add(phGlow);
      M6.an.push((t) => {
        phGlow.material.opacity = 0.11 + 0.04 * Math.sin(t * 1.1);
      });

      // Ciudad lejana al este (determinista)
      {
        let sd = 43;
        const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
        const wt = txtTex(64, 128, (c, w, h) => {
          c.fillStyle = '#1a1d24';
          c.fillRect(0, 0, w, h);
          for (let r = 0; r < 16; r++) {
            for (let q = 0; q < 7; q++) {
              if (rnd() > 0.45) {
                c.fillStyle = rnd() > 0.5 ? '#ffd89a' : '#ffe9bf';
                c.fillRect(q * 9 + 2, r * 8 + 2, 5, 4);
              }
            }
          }
        });
        const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ map: wt, fog: false, color: 0xc9cfd6 }), 110);
        const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), cc = new THREE.Color();
        for (let i = 0; i < 110; i++) {
          const hh = 30 + rnd() * 130 * (1 - Math.abs(i / 110 - 0.5) * 1.1);
          const w = 14 + rnd() * 30;
          const x = 640 + rnd() * 200;
          const z = -380 + i * 7 + rnd() * 6;
          sc.set(w, hh, w);
          ps.set(x, -O6.y + WL + hh / 2 - 2, z);
          m4.compose(ps, q0, sc);
          city.setMatrixAt(i, m4);
          cc.setHSL(0.09 + rnd() * 0.05, 0.25, 0.55 + rnd() * 0.35);
          city.setColorAt(i, cc);
        }
        if (city.instanceMatrix) city.instanceMatrix.needsUpdate = true;
        safeInstBounds(city);
        g.add(city);
        M6.city = city;
      }

      // === Puertas de cristal (compuertas) ===
      const mkGate = (k, x, rect) => {
        const door = bx(g, 0.2, 3.4, 5, x, 1.7, 0, glassM(0x9fe0ff, 0.45), true);
        const frame = bx(g, 0.3, 0.12, 5.2, x, 3.45, 0, glowM(0x9fe0ff, 0.5), true);
        M6.gates[k] = { r: rect, open: false, door, frame, t: 0 };
      };
      mkGate('g1', -30, [-30.4, -29.6, -2.5, 2.5]);
      mkGate('g2', 12, [11.6, 12.4, -2.5, 2.5]);

      // === Torre A: tres escenas ===
      const wood = stdM(0x6b4a2f, 0.2), paper = stdM(0xe9e1cc, 0.3);
      try {
        rainWindow(g, 4.2, 2.4, -47.8, 2.1, 2.5, Math.PI / 2, wood, steel, 0);
      } catch (e) {
        console.warn('Capítulo VI (ventana):', e);
      }

      // 1) Aula reconstruida
      {
        const aulaStatic = new THREE.Group();
        g.add(aulaStatic);
        const T = txtTex(512, 256, (c, w, h) => {
          c.fillStyle = '#1d3a2d';
          c.fillRect(0, 0, w, h);
          c.fillStyle = 'rgba(240,240,225,.75)';
          c.font = '28px Georgia,serif';
          c.fillText('2x + 3 = 11', 34, 70);
          c.fillText('x = ?', 34, 115);
          c.fillText('x = 4', 34, 160);
          c.strokeStyle = 'rgba(240,240,225,.5)';
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(300, 60);
          c.lineTo(470, 60);
          c.moveTo(300, 100);
          c.lineTo(430, 100);
          c.stroke();
        });
        bx(aulaStatic, 6, 2.2, 0.08, -42, 2.2, -8.76, new THREE.MeshBasicMaterial({ map: T }));
        bx(aulaStatic, 6.2, 0.12, 0.16, -42, 1.05, -8.7, wood);
        bx(aulaStatic, 6.2, 0.1, 0.12, -42, 3.35, -8.74, wood);
        for (const sx of [-1, 1]) bx(aulaStatic, 0.1, 2.4, 0.12, -42 + sx * 3.05, 2.2, -8.74, wood);
        bx(aulaStatic, 0.12, 0.025, 0.025, -43.2, 1.12, -8.66, cmat(0xf5f2e8, 0.5));
        bx(aulaStatic, 0.1, 0.025, 0.025, -43.02, 1.12, -8.66, cmat(0xffdf88, 0.5));
        bx(aulaStatic, 0.16, 0.05, 0.07, -40.8, 1.135, -8.66, cmat(0x3a2c20, 0.2));

        const yaws = [-0.14, 0.08, -0.05, 0.12, -0.08, 0.04];
        let ci = 0;
        for (const z of [-2.6, -0.8]) {
          for (const x of [-44.5, -42.5, -40.5]) {
            desk(aulaStatic, x, z, wood, steel);
            chair(aulaStatic, x, z + 0.46, Math.PI + yaws[ci++], wood, false);
          }
        }
        figure(aulaStatic, -44.5, -2.14, 1.25, 0xcfe3f2, Math.PI - 0.1, 0.3, 'sit', true);
        figure(aulaStatic, -40.5, -0.34, 1.28, 0xcfe3f2, Math.PI + 0.08, 0.28, 'sit', true);
        mergeStaticGroup(aulaStatic);

        const gs = [
          figure(g, -43.6, -6.4, 1.7, 0xcfe3f2, 0.5, null, null, true),
          figure(g, -42.2, -6.2, 1.6, 0xcfe3f2, -0.4, null, null, true),
          figure(g, -40.8, -6.5, 1.75, 0xcfe3f2, -0.8, null, null, true),
        ];
        gs.forEach((o, i) =>
          M6.an.push((t) => {
            o.rotation.z = Math.sin(t * 1.3 + i * 2) * 0.03;
            o.position.y = Math.sin(t * 1.7 + i) * 0.015;
          })
        );
        M6.pts.push({ id: 'aula', flag: 'ch6_aula', name: 'Aula reconstruida', x: -42, z: -4.6, r: 3.4, y: 1.6, ok: () => true, run: () => scene_aula() });
      }

      // 2) El niño que preguntaba
      {
        const ninoStatic = new THREE.Group();
        g.add(ninoStatic);
        const shelf = stdM(0x5c452d, 0.2);
        const bkc = [0x7a3b3b, 0x3b5a7a, 0x6a7a3b, 0xb89a58, 0x4a3f6b, 0x8a5a2f, 0x2f5a54];
        bx(ninoStatic, 6, 3.4, 0.06, -34, 1.7, -8.7, shelf);
        for (const sx of [-1, 1]) bx(ninoStatic, 0.08, 3.4, 0.5, -34 + sx * 2.96, 1.7, -8.45, shelf);
        for (let r = 0; r < 5; r++) bx(ninoStatic, 6, 0.05, 0.5, -34, 0.025 + r * 0.82, -8.45, shelf);
        let sd = 7;
        const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
        for (let r = 0; r < 4; r++) {
          let x = -36.8;
          const y0 = 0.05 + r * 0.82;
          while (x < -31.3) {
            const w = 0.16 + rnd() * 0.16, h = 0.46 + rnd() * 0.24;
            if (rnd() < 0.1) {
              x += 0.3;
              continue;
            }
            const bk = bx(ninoStatic, w, h, 0.3, x + w / 2, y0 + h / 2, -8.45, cmat(bkc[(rnd() * 7) | 0], 0.25));
            if (rnd() < 0.07) {
              bk.rotation.z = 0.22;
              bk.position.y -= 0.02;
            }
            x += w + 0.015;
          }
        }
        // Taburete bajo de lectura y libro abierto junto a las estanterías
        cyl(ninoStatic, 0.2, 0.2, 0.04, -35.0, 0.36, -6.65, wood, 14);
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.4;
          const sl = cyl(ninoStatic, 0.022, 0.014, 0.36, -35.0 + Math.cos(a) * 0.12, 0.18, -6.65 + Math.sin(a) * 0.12, wood, 6);
          sl.rotation.z = -Math.cos(a) * 0.12;
          sl.rotation.x = Math.sin(a) * 0.12;
        }
        bx(ninoStatic, 0.34, 0.015, 0.26, -34.95, 0.39, -6.65, cmat(0x523426, 0.2));
        const pgL = bx(ninoStatic, 0.15, 0.01, 0.23, -35.03, 0.405, -6.65, paper);
        pgL.rotation.z = -0.14;
        const pgR = bx(ninoStatic, 0.15, 0.01, 0.23, -34.87, 0.405, -6.65, paper);
        pgR.rotation.z = 0.14;

        figure(ninoStatic, -32.4, -6.0, 1.7, 0xcfe3f2, -1.1, 0.5, null, true);
        mergeStaticGroup(ninoStatic);

        const kid = figure(g, -34, -6.2, 1.15, 0xf7e2a8, 0.15, 0.8, 'curious', true);
        M6.kid = kid;
        const qs = [];
        for (let i = 0; i < 5; i++) qs.push(qSprite(g, -34, 2, -6.2, '?', i % 2 ? '#ffe9a8' : '#cfe9ff'));
        M6.an.push((t) => {
          kid.position.y = Math.abs(Math.sin(t * 3)) * 0.05;
          for (let i = 0; i < qs.length; i++) {
            const a = t * 0.9 + i * 1.2566;
            qs[i].position.set(-34 + Math.cos(a) * 1.15, 1.9 + Math.sin(t * 1.4 + i) * 0.25, -6.2 + Math.sin(a) * 1.15);
          }
        });
        M6.pts.push({ id: 'nino', flag: 'ch6_nino', name: 'Un niño con preguntas', x: -34, z: -4.4, r: 3.0, y: 1.2, ok: () => true, run: () => scene_nino() });
      }

      // 3) Las escenas que se cierran (Incomprensión → Vergüenza → Aislamiento → Silencio)
      {
        const discs = [], cols = [0xbcd2e6, 0x9db4c8, 0x7a8da0, 0x56646f], xs = [-45, -41.5, -38, -34.5];
        const kcol = [0xf7e2a8, 0xd8caa6, 0xb4aa94, 0x8a8578];
        xs.forEach((x, i) => {
          const d = cyl(g, 1.6, 1.6, 0.05, x, 0.03, 6, glowM(cols[i], 0.5 - i * 0.07), 24, true);
          discs.push(d);
        });

        const cierreG = new THREE.Group();
        g.add(cierreG);
        // Incomprensión: dos adultos conversando entre sí, de espaldas al niño
        figure(cierreG, -45.7, 6.0, 1.7, 0xcfe3f2, Math.PI - 0.45, 0.55, null, true);
        figure(cierreG, -44.3, 6.0, 1.7, 0xcfe3f2, Math.PI + 0.45, 0.55, null, true);
        figure(cierreG, -45, 7.0, 1.0, kcol[0], Math.PI, 0.8, null, true);

        // Vergüenza: tres adultos mirando hacia el niño encogido con los pies firmes en el suelo
        figure(cierreG, -41.5, 6.9, 0.95, kcol[1], Math.PI, 0.8, 'bow', true);
        for (const a of [-0.9, 0, 0.9]) figure(cierreG, -41.5 + Math.sin(a) * 1.4, 6 - Math.cos(a) * 1.1 + 0.6, 1.7, 0xcfe3f2, -a * 0.85, 0.5, null, true);

        // Aislamiento: pupitre solitario con cuaderno cerrado, lápiz y postura inclinada
        desk(cierreG, -38, 6.8, wood, steel);
        bx(cierreG, 0.24, 0.015, 0.3, -38.05, 0.76, 6.75, cmat(0x2d4354, 0.2));
        cyl(cierreG, 0.008, 0.008, 0.16, -37.86, 0.76, 6.8, cmat(0xd6b05c, 0.2), 6).rotation.z = Math.PI / 2;
        chair(cierreG, -38, 7.55, Math.PI, wood);
        figure(cierreG, -38, 7.55, 0.9, kcol[2], Math.PI, 0.75, 'sitBow', true);

        // Silencio: silla vacía frente a ventana empotrada con haz cálido oblicuo
        chair(cierreG, -34.5, 7.1, 0.15, wood);
        bx(cierreG, 1.62, 0.1, 0.18, -34.5, 2.58, 8.71, wood);
        bx(cierreG, 1.62, 0.1, 0.18, -34.5, 0.84, 8.71, wood);
        for (const sx of [-1, 1]) bx(cierreG, 0.1, 1.84, 0.18, -34.5 + sx * 0.76, 1.71, 8.71, wood);
        bx(cierreG, 1.42, 1.64, 0.04, -34.5, 1.71, 8.76, warm);
        bx(cierreG, 0.045, 1.64, 0.06, -34.5, 1.71, 8.71, steel);
        bx(cierreG, 1.42, 0.045, 0.06, -34.5, 1.71, 8.71, steel);
        bx(cierreG, 1.78, 0.06, 0.26, -34.5, 0.81, 8.66, wood);
        mergeStaticGroup(cierreG);

        {
          const slBeam = new THREE.Mesh(
            new THREE.PlaneGeometry(1.4, 3.0),
            new THREE.MeshBasicMaterial({ map: winRes().spill, color: 0xffdfa8, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
          );
          slBeam.position.set(-34.5, 1.05, 7.72);
          slBeam.rotation.x = 0.64;
          slBeam.userData.dyn = true;
          g.add(slBeam);
          const slPool = new THREE.Mesh(new THREE.CircleGeometry(1.05, 18), glowM(0xffdfa8, 0.12));
          slPool.rotation.x = -Math.PI / 2;
          slPool.position.set(-34.5, 0.036, 7.1);
          slPool.userData.dyn = true;
          g.add(slPool);
        }

        M6.an.push((t) => {
          for (let i = 0; i < discs.length; i++) discs[i].material.opacity = (0.5 - i * 0.07) * (0.8 + 0.2 * Math.sin(t * 1.1 + i));
        });
        M6.pts.push({
          id: 'cierre',
          flag: 'ch6_cierre',
          name: 'Escenas que se van cerrando',
          x: -39.8,
          z: 3.8,
          r: 6.2,
          y: 1.2,
          ok: () => FL().ch6_aula && FL().ch6_nino,
          run: () => scene_cierre(),
        });
      }

      // === Torre B: cuatro futuros que cambian al mirarlos ===
      const frameM = stdM(0xcfd8e0, 0.4);
      const alcoveFrames = new THREE.Group();
      g.add(alcoveFrames);

      function alcove(id, flag, name, x, side, mk) {
        const z = side * 8.8, f = -side;
        const grp = new THREE.Group();
        grp.position.set(x, 0, z + f * 0.9);
        if (side > 0) grp.rotation.y = Math.PI;
        grp.userData.noMerge = true;
        g.add(grp);

        for (const s of [-1, 1]) bx(alcoveFrames, 0.28, 3.9, 0.4, x + s * 2.3, 1.95, z + f * 0.25, frameM);
        bx(alcoveFrames, 4.9, 0.28, 0.4, x, 3.9, z + f * 0.25, frameM);
        bx(alcoveFrames, 4.2, 0.06, 0.06, x, 3.72, z + f * 0.45, cool);
        bx(alcoveFrames, 4.4, 3.7, 0.05, x, 1.85, z + f * 0.06, stdM(0x0e1419, 0.12));

        const pad = cyl(g, 2.1, 2.1, 0.04, x, 0.03, z + f * 1.7, glowM(0x9fe0ff, 0.14), 24, true);
        const kids = [];
        mk(grp);
        grp.children.forEach((o) => kids.push({ o, p: o.position.clone(), s: o.scale.clone(), r: o.rotation.clone() }));
        M6.alc[id] = { id, x, z: z + f * 1.4, grp, kids, pad, dirty: false };
        M6.props.push([x - 1.9, x + 1.9, Math.min(z, z + f * 2.5), Math.max(z, z + f * 2.5)]);
        M6.look[id] = 0;
        M6.pts.push({
          id,
          flag,
          name,
          x,
          z: z + f * 3.4,
          r: 2.9,
          y: 1.8,
          ok: () => true,
          run: () => ({ fisica: scene_fisica, compu: scene_compu, solo: scene_solo, gente: scene_gente })[id](),
        });
      }

      alcove('fisica', 'ch6_fisica', 'Un futuro: Física', -1, -1, (p) => {
        const t = txtTex(512, 256, (c, w, h) => {
          c.fillStyle = '#14202a';
          c.fillRect(0, 0, w, h);
          c.fillStyle = 'rgba(235,240,230,.85)';
          c.font = 'italic 30px Georgia,serif';
          c.fillText('F = m·a', 28, 56);
          c.fillText('E = h·ν', 28, 104);
          c.fillText('∇·E = ρ / ε₀', 28, 152);
          c.fillText('ψ(x,t)', 28, 200);
          c.strokeStyle = 'rgba(200,225,240,.6)';
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(390, 120, 90, 46, 0.4, 0, 6.3);
          c.stroke();
          c.beginPath();
          c.arc(430, 100, 6, 0, 6.3);
          c.fill();
        });
        bx(p, 3.8, 2.5, 0.1, 0, 2.1, -0.75, wood);
        bx(p, 3.6, 2.3, 0.02, 0, 2.1, -0.69, new THREE.MeshBasicMaterial({ map: t }));
        bx(p, 3.8, 0.08, 0.2, 0, 0.8, -0.65, wood);
        bx(p, 0.08, 0.02, 0.02, -1.5, 0.85, -0.6, stdM(0xffffff, 0.8));
        bx(p, 0.14, 0.04, 0.06, -1.2, 0.86, -0.6, stdM(0x4a3625, 0.2));

        // Taburete lateral con libros apilados
        cyl(p, 0.22, 0.22, 0.04, 1.48, 0.48, -0.2, wood, 12);
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) cyl(p, 0.02, 0.014, 0.46, 1.48 + sx * 0.12, 0.23, -0.2 + sz * 0.12, steel, 6);
        }
        bx(p, 0.28, 0.04, 0.22, 1.48, 0.52, -0.2, cmat(0x3b5a7a, 0.25));
        bx(p, 0.24, 0.035, 0.19, 1.49, 0.56, -0.2, cmat(0x7a3b3b, 0.25));

        figure(p, 0.9, -0.1, 1.7, 0xf7e2a8, Math.PI, 0.7, 'write', true);

        const mg = new THREE.Group();
        const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.028, 8, 36), basicM(0x9fe0ff));
        const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.028, 8, 36), basicM(0xffd89a));
        const r3 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.022, 8, 32), basicM(0xdff7ff));
        r2.rotation.x = Math.PI / 2;
        r3.rotation.y = Math.PI / 3;
        mg.add(r1, r2, r3);
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), glowM(0xfff0c0, 0.9));
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), basicM(0xffffff));
        mg.add(core, orb);
        mg.position.set(-1.3, 1.38, 0.3);
        p.add(mg);
        cyl(p, 0.26, 0.34, 0.08, -1.3, 0.04, 0.3, steel, 14);
        cyl(p, 0.22, 0.28, 0.74, -1.3, 0.43, 0.3, steel, 14);
        cyl(p, 0.24, 0.24, 0.02, -1.3, 0.81, 0.3, glowM(0x9fe0ff, 0.7), 14);

        M6.an.push((t) => {
          mg.rotation.y = t * 0.5;
          mg.rotation.z = t * 0.3;
          orb.position.x = Math.cos(t * 2) * 0.6;
          orb.position.z = Math.sin(t * 2) * 0.6;
        });
      });

      alcove('solo', 'ch6_solo', 'Un futuro: soledad', -1, 1, (p) => {
        chair(p, 0.4, 0, Math.PI - 0.4, wood);
        figure(p, 0.4, 0, 1.25, 0xf7e2a8, Math.PI - 0.4, 0.7, 'sit', true);

        cyl(p, 0.4, 0.4, 0.05, 1.2, 0.6, -0.2, wood, 16);
        cyl(p, 0.04, 0.08, 0.6, 1.2, 0.3, -0.2, steel, 8);
        bx(p, 0.5, 0.04, 0.5, 1.2, 0.02, -0.2, steel);
        // Taza con platillo, libro cerrado y vapor suave ascendente
        cyl(p, 0.08, 0.06, 0.014, 1.1, 0.63, -0.1, stdM(0xd7dee5, 0.2), 12);
        cyl(p, 0.05, 0.05, 0.1, 1.1, 0.68, -0.1, stdM(0xcfd8e0, 0.3), 10);
        bx(p, 0.22, 0.03, 0.16, 1.32, 0.64, -0.32, cmat(0x3b4d63, 0.2));
        const stm = [0, 1, 2].map((i) => {
          const w = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), glowM(0xe6eef6, 0.26));
          w.position.set(1.1, 0.76 + i * 0.1, -0.1);
          p.add(w);
          return w;
        });

        cyl(p, 0.15, 0.15, 0.04, 1.8, 0.02, -0.2, steel, 14);
        cyl(p, 0.02, 0.03, 1.8, 1.8, 0.9, -0.2, steel, 8);
        const sh = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 14, 1, true), stdM(0x2a3036, 0.1));
        sh.position.set(1.8, 1.9, -0.2);
        p.add(sh);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), glowM(0xffd998, 1));
        bulb.position.set(1.8, 1.8, -0.2);
        p.add(bulb);
        const lampBeam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 1.7, 1.85, 16, 1, true),
          new THREE.MeshBasicMaterial({ color: 0xffd998, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
        );
        lampBeam.position.set(1.58, 0.94, -0.16);
        p.add(lampBeam);
        const pool = new THREE.Mesh(new THREE.CircleGeometry(1.9, 24), glowM(0xffd998, 0.2));
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(1.4, 0.03, -0.2);
        p.add(pool);

        // Ventana nocturna enmarcada con luces lejanas en la ciudad
        bx(p, 2.9, 0.1, 0.14, 0, 3.05, -0.73, wood);
        bx(p, 2.9, 0.1, 0.14, 0, 0.75, -0.73, wood);
        for (const sx of [-1, 1]) bx(p, 0.1, 2.4, 0.14, sx * 1.4, 1.9, -0.73, wood);
        bx(p, 0.04, 2.24, 0.08, 0, 1.9, -0.72, steel);
        bx(p, 2.74, 0.04, 0.08, 0, 1.9, -0.72, steel);
        bx(p, 2.72, 2.22, 0.04, 0, 1.9, -0.76, stdM(0x06090f, 0.15));
        for (const [lx, ly] of [[-0.9, 1.4], [-0.45, 1.2], [0.3, 1.5], [0.75, 1.1], [1.0, 1.7], [-0.7, 2.2]]) {
          const ld = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), glowM(0xffcf88, 0.7));
          ld.position.set(lx, ly, -0.735);
          p.add(ld);
        }
        M6.an.push((t) => {
          for (let i = 0; i < stm.length; i++) {
            const u = (t * 0.25 + i * 0.33) % 1;
            stm[i].position.set(1.1 + Math.sin(t * 1.4 + i) * 0.035, 0.76 + u * 0.32, -0.1);
            stm[i].material.opacity = 0.28 * (1 - u);
          }
        });
      });

      alcove('gente', 'ch6_gente', 'Un futuro: compañía', 7, 1, (p) => {
        const plateM = stdM(0xedf2f5, 0.22), napM = stdM(0x9ab0c2, 0.2), brass = cmat(0xc29e5a, 0.3);
        cyl(p, 1.2, 1.2, 0.04, 0, 0.77, 0, wood, 24);
        cyl(p, 1.15, 1.15, 0.04, 0, 0.73, 0, wood, 24);
        cyl(p, 0.2, 0.3, 0.73, 0, 0.365, 0, steel, 14);
        cyl(p, 0.14, 0.18, 0.05, 0, 0.8, 0, brass, 12);
        cyl(p, 0.025, 0.03, 0.22, 0, 0.92, 0, brass, 8);
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2;
          const cx = Math.cos(a) * 0.14, cz = Math.sin(a) * 0.14;
          bx(p, 0.14, 0.02, 0.02, cx * 0.5, 0.96, cz * 0.5, brass);
          const cd = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glowM(0xffd998, 0.95));
          cd.position.set(cx, 1.03, cz);
          p.add(cd);
        }
        const centerHalo = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), glowM(0xffd998, 0.35));
        centerHalo.position.set(0, 1.04, 0);
        p.add(centerHalo);

        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.3, x = Math.cos(a) * 1.65, z = Math.sin(a) * 1.65;
          cyl(p, 0.15, 0.12, 0.015, Math.cos(a) * 0.95, 0.795, Math.sin(a) * 0.95, plateM, 14);
          bx(p, 0.08, 0.014, 0.12, Math.cos(a + 0.2) * 0.92, 0.796, Math.sin(a + 0.2) * 0.92, napM);
          cyl(p, 0.03, 0.03, 0.08, Math.cos(a - 0.18) * 0.8, 0.82, Math.sin(a - 0.18) * 0.8, glassM(0xffffff, 0.4), 8);
          chair(p, x, z, -a - Math.PI / 2, wood);
          if (i === 2) continue;
          const fg = figure(p, x, z, 1.3, [0xcfe3f2, 0xf7e2a8, 0xe8cfe3][i % 3], -a - Math.PI / 2, 0.62, 'sit', true);
          M6.an.push((t) => {
            fg.rotation.z = Math.sin(t * 1.5 + i * 1.7) * 0.05;
          });
        }
      });

      alcove('compu', 'ch6_compu', 'Un futuro: computadoras', 7, -1, (p) => {
        const darkPlastic = stdM(0x111317, 0.2);
        let sd = 29;
        const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
        const code = txtTex(
          256,
          512,
          (c, w, h) => {
            c.fillStyle = '#04121a';
            c.fillRect(0, 0, w, h);
            c.font = '14px monospace';
            const ch = '01{}();=<>';
            for (let y = 14; y < h; y += 18) {
              let l = '';
              const n = 2 + ((rnd() * 16) | 0);
              for (let i = 0; i < n; i++) l += ch[(rnd() * ch.length) | 0];
              c.fillStyle = rnd() < 0.2 ? '#ffe9a8' : '#7fe8ff';
              c.fillText(l, 10 + ((rnd() * 40) | 0), y);
            }
          },
          true
        );
        const screenMat = new THREE.MeshBasicMaterial({ map: code });

        bx(p, 3.2, 0.04, 0.9, 0, 0.75, -0.1, wood);
        for (const sx of [-1, 1]) {
          bx(p, 0.08, 0.75, 0.08, sx * 1.45, 0.375, 0.2, steel);
          bx(p, 0.08, 0.75, 0.08, sx * 1.45, 0.375, -0.4, steel);
          bx(p, 0.06, 0.04, 0.7, sx * 1.45, 0.02, -0.1, steel);
        }

        const makeMonitor = (mx, my, mz, ry) => {
          const mg = new THREE.Group();
          bx(mg, 1.05, 0.7, 0.04, 0, 0.45, 0, darkPlastic);
          bx(mg, 0.98, 0.64, 0.01, 0, 0.45, 0.025, screenMat);
          cyl(mg, 0.03, 0.05, 0.2, 0, 0.1, -0.05, darkPlastic, 8);
          bx(mg, 0.4, 0.02, 0.25, 0, 0, -0.05, darkPlastic);
          mg.position.set(mx, my, mz);
          mg.rotation.y = ry;
          p.add(mg);
        };
        makeMonitor(0, 0.77, -0.5, 0);
        makeMonitor(-1.1, 0.77, -0.35, Math.PI / 8);
        makeMonitor(1.1, 0.77, -0.35, -Math.PI / 8);

        bx(p, 0.95, 0.008, 0.42, 0.1, 0.772, 0.12, cmat(0x1a2630, 0.2));
        bx(p, 0.6, 0.02, 0.2, 0, 0.78, 0.15, darkPlastic);
        bx(p, 0.08, 0.025, 0.12, 0.45, 0.78, 0.15, darkPlastic);
        cyl(p, 0.045, 0.045, 0.095, 0.74, 0.815, 0.12, stdM(0xd7dee5, 0.25), 10);
        const scrGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.65), glowM(0x7fe8ff, 0.14));
        scrGlow.rotation.x = -Math.PI / 2;
        scrGlow.position.set(0, 0.776, 0.02);
        p.add(scrGlow);

        // Torre discreta bajo el escritorio con doble LED
        bx(p, 0.22, 0.46, 0.44, -1.15, 0.23, -0.1, darkPlastic);
        bx(p, 0.04, 0.28, 0.01, -1.15, 0.24, 0.125, cool);
        bx(p, 0.015, 0.03, 0.01, -1.1, 0.4, 0.125, glowM(0xffe9a8, 0.9));

        ergoChair(p, 0, 0.72, Math.PI, steel, darkPlastic);
        figure(p, 0, 0.75, 1.5, 0xf7e2a8, Math.PI, 0.7, 'sit', true);
        M6.an.push((t) => {
          code.offset.y = -((t * 0.12) % 1);
        });
      });

      // === 5.º nicho opcional «lo que aún no conozco» (muro oeste de Torre B, sereno y sin distorsión) ===
      try {
        const xw = -5.74, zc = 5.6, pale = glowM(0xe8eeff, 0.11);
        for (const s2 of [-1, 1]) {
          bx(alcoveFrames, 0.4, 3.9, 0.28, xw + 0.3, 1.95, zc + s2 * 2.0, frameM);
          bx(alcoveFrames, 0.18, 3.62, 0.12, xw + 0.22, 1.88, zc + s2 * 1.82, stdM(0x8a9eb0, 0.25));
        }
        bx(alcoveFrames, 0.4, 0.28, 4.3, xw + 0.3, 3.9, zc, frameM);
        bx(alcoveFrames, 0.18, 0.12, 3.76, xw + 0.22, 3.7, zc, stdM(0x8a9eb0, 0.25));
        bx(alcoveFrames, 0.06, 0.06, 3.7, xw + 0.5, 3.72, zc, glowM(0xe8eeff, 0.42));
        bx(alcoveFrames, 0.05, 3.7, 3.9, xw, 1.85, zc, stdM(0x0b1016, 0.12));
        bx(alcoveFrames, 0.02, 3.5, 3.7, xw + 0.05, 1.85, zc, pale);

        const padV = cyl(g, 1.7, 1.7, 0.04, xw + 1.7, 0.03, zc, glowM(0xe8eeff, 0.12), 24, true);
        const padRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.24, 36), glowM(0xe8eeff, 0.24));
        padRing.rotation.x = -Math.PI / 2;
        padRing.position.set(xw + 1.7, 0.055, zc);
        padRing.userData.dyn = true;
        g.add(padRing);
        const sh = new THREE.Mesh(
          new THREE.CylinderGeometry(1.4, 1.9, 3.6, 20, 1, true),
          new THREE.MeshBasicMaterial({ color: 0xe8eeff, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
        );
        sh.position.set(xw + 1.7, 1.8, zc);
        sh.userData.dyn = true;
        g.add(sh);

        const stars = [];
        const starGeo = new THREE.SphereGeometry(0.032, 6, 5);
        for (let i = 0; i < 20; i++) {
          const m = new THREE.Mesh(starGeo, glowM(i % 4 === 0 ? 0xffeacc : 0xffffff, 0.7));
          m.position.set(xw + 0.08 + (i % 4) * 0.035, 0.4 + ((i * 37) % 29) / 29 * 3.05, zc - 1.65 + ((i * 53) % 31) / 31 * 3.3);
          m.scale.setScalar(0.75 + (i % 3) * 0.28);
          m.userData.dyn = true;
          g.add(m);
          stars.push(m);
        }
        M6.an.push((t) => {
          for (let i = 0; i < stars.length; i++) stars[i].material.opacity = 0.14 + 0.52 * Math.max(0, Math.sin(t * 0.65 + i * 2.1));
          padV.material.opacity = 0.1 + 0.03 * Math.sin(t * 0.8);
          padRing.material.opacity = 0.2 + 0.06 * Math.sin(t * 0.8 + 1);
        });
        M6.props.push([-6, -3.5, zc - 2.1, zc + 2.1]);
        M6.pts.push({
          id: 'vacio',
          flag: 'ch6_vacio',
          name: 'Un futuro: lo que aún no conozco',
          x: -2.4,
          z: zc,
          r: 2.7,
          y: 1.8,
          opt: true,
          ok: () => !!FL().ch6_bridge,
          run: () => scene_vacio(),
        });
      } catch (e) {
        console.warn('Capítulo VI (nicho vacío):', e);
      }

      mergeStaticGroup(alcoveFrames);

      M6.pts.push({ id: 'frase', flag: 'ch6_frase', name: 'Inscripción en el suelo', x: 46, z: 0, r: 3.6, y: TOP + 0.2, ok: () => true, run: () => scene_frase() });
      M6.pts.push({ id: 'ventana', flag: 'ch6_complete', name: 'La ventana al horizonte', x: 53, z: 0, r: 3.2, y: TOP + 1.8, ok: () => !!FL().ch6_frase, run: () => scene_final() });

      try {
        decor(g, { wood, paper, steel, warm, cool, conc });
      } catch (e) {
        console.warn('Capítulo VI (decorado):', e);
      }
      try {
        grounded(g, { conc, concD, trim: steel, cool });
      } catch (e) {
        console.warn('Capítulo VI (cimientos):', e);
      }
      try {
        mist(g);
      } catch (e) {
        console.warn('Capítulo VI (niebla):', e);
      }
      syncGates(true);
      M6.built = true;
    }

    function syncGates(snap) {
      const f = FL();
      const o1 = !!(f.ch6_aula && f.ch6_nino && f.ch6_cierre);
      const o2 = !!(f.ch6_fisica && f.ch6_compu && f.ch6_solo && f.ch6_gente);
      for (const [k, op] of [['g1', o1], ['g2', o2]]) {
        const G = M6.gates[k];
        if (!G) continue;
        if (op && !G.open) {
          G.open = true;
          G.t = snap ? 1 : 0.001;
        }
        if (snap && op) {
          G.door.visible = false;
          G.frame.visible = false;
        }
      }
    }

    const worldOf = (x, y, z) => new THREE.Vector3(O6.x + x, O6.y + y, O6.z + z);

    // ---------- Cinemáticas (guión intacto) ----------
    const cine = (lines, cb, pt, abs) => {
      const loc = cinBox.querySelector('.cin-location'), old = loc ? loc.textContent : '';
      if (loc) loc.textContent = 'LAS TORRES';
      playCinematic(
        lines,
        () => {
          if (loc) loc.textContent = old || 'PARQUE DE LOS CISNES';
          if (cb) cb();
        },
        pt ? { lookAt: abs ? new THREE.Vector3(pt.x, pt.y, pt.z) : worldOf(pt.x, pt.y || 1.6, pt.z) } : {}
      );
    };

    const P = (id) => M6.pts.find((p) => p.id === id);
    const doneMsg = (m) => {
      syncGates();
      showMsg(m);
    };

    function scene_aula() {
      chime(440);
      cine(
        [
          { pause: 800 },
          { t: 'Una sala reconstruida: escritorios en fila, una pizarra, siluetas que conversan sin voz.' },
          { pause: 2000 },
          { t: 'No son recuerdos exactos. Es lo que quedó de ellos: la forma de las cosas, nunca los detalles.' },
          { pause: 2200 },
          { t: 'Reconoces el olor a tiza. Una ventana donde llueve una tarde cualquiera. El murmullo de gente que conversa.' },
          { pause: 2400 },
          { who: 'Tú', t: 'Todo está aquí… pero ninguna cara.' },
          { pause: 2400 },
        ],
        () => {
          storyFlag('ch6_aula', 1);
          doneMsg('Torre del pasado · ' + pastN() + '/3 · hay más escenas');
        },
        P('aula')
      );
    }

    function scene_nino() {
      chime(520);
      cine(
        [
          { pause: 800 },
          { t: 'En medio de la escena hay un niño de pie, rodeado de preguntas que flotan como luciérnagas.' },
          { pause: 2200 },
          { who: 'Niño', t: '¿Y por qué el cielo huele distinto cuando va a llover?' },
          { pause: 2400 },
          { who: 'Niño', t: '¿Y si construimos un barco con eso? ¿Y si no flota? ¿Y por qué flotan las cosas?' },
          { pause: 2800 },
          { t: 'Habla rápido. Se interrumpe a sí mismo para preguntar otra cosa. Imagina mundos enteros mientras camina.' },
          { pause: 2400 },
          { who: 'Tú', t: '¿Ese era yo?' },
          { pause: 2200 },
          { t: 'Curioso. Hablador. Lleno de preguntas.' },
          { pause: 2200 },
        ],
        () => {
          storyFlag('ch6_nino', 1);
          doneMsg('Torre del pasado · ' + pastN() + '/3 · mira las escenas del fondo');
        },
        P('nino')
      );
    }

    function scene_cierre() {
      chime(330);
      cine(
        [
          { pause: 800 },
          { t: 'Al fondo hay otras escenas. A cada una le falta un poco más de luz que a la anterior.' },
          { pause: 2200 },
          { label: 'INCOMPRENSIÓN', t: 'Dos adultos de espaldas. El niño pregunta otra vez, más bajo. Nadie se gira.' },
          { pause: 2800 },
          { label: 'VERGÜENZA', t: 'Un semicírculo de siluetas. El niño encoge los hombros. La pregunta se queda dentro.' },
          { pause: 2800 },
          { label: 'AISLAMIENTO', t: 'Un escritorio al fondo del salón. Una sola silla ocupada.' },
          { pause: 2600 },
          { label: 'SILENCIO', t: 'Una silla vacía junto a una ventana encendida. Ya nadie pregunta nada.' },
          { pause: 3000 },
          { t: 'No ocurrió de repente. Cada escena cerró una puerta pequeña. Ninguna hizo ruido.' },
          { pause: 2600 },
          { who: 'Tú', t: 'Me fui volviendo reservado… como quien aprende a cuidar algo frágil.' },
          { pause: 2800 },
          { t: 'Aquella personalidad callada no apareció de la nada. Fue una manera de protegerse.' },
          { pause: 3200 },
        ],
        () => {
          storyFlag('ch6_cierre', 1);
          syncGates();
          chime(660);
          showMsg('Se abre la puerta del puente de cristal');
        },
        P('cierre')
      );
    }

    function scene_bridge() {
      cine(
        [
          { pause: 900 },
          { t: 'El puente cruza el vacío entre dos maneras de mirar el tiempo.' },
          { pause: 2200 },
          { t: 'Abajo, el mar. Detrás, lo que fue. Delante, lo que podría ser.' },
          { pause: 2400 },
          { who: 'Tú', t: 'Una torre para recordar. La otra… para imaginar.' },
          { pause: 2600 },
        ],
        () => {
          storyFlag('ch6_bridge', 1);
          showMsg('Torre de los futuros · mira cada escena');
        },
        { x: -8, y: 1.6, z: 0 }
      );
    }

    function scene_fisica() {
      chime(560);
      cine(
        [
          { pause: 800 },
          { t: 'Una pizarra llena de ecuaciones. Una versión de ti, de espaldas, escribe sin detenerse.' },
          { pause: 2400 },
          { t: 'Órbitas, ondas, constantes. Todo lo invisible escrito con tiza clara.' },
          { pause: 2200 },
          { t: 'Intentas leer la última línea, y los símbolos se reordenan.' },
          { pause: 2400 },
          { who: 'Tú', t: 'Podría ser este. O dejar de serlo mañana.' },
          { pause: 2400 },
        ],
        () => {
          storyFlag('ch6_fisica', 1);
          doneMsg(left('Un futuro visto'));
        },
        P('fisica')
      );
    }

    function scene_compu() {
      chime(600);
      cine(
        [
          { pause: 800 },
          { t: 'Pantallas encendidas. Líneas de código que corren hacia arriba, como una lluvia al revés.' },
          { pause: 2400 },
          { t: 'La figura sentada no se gira. Teclea con la calma de quien sabe adónde va.' },
          { pause: 2400 },
          { t: 'Cuando intentas leer una línea completa, el texto cambia.' },
          { pause: 2200 },
          { who: 'Tú', t: 'Se ve tranquilo. Pero no sé si lo está.' },
          { pause: 2400 },
        ],
        () => {
          storyFlag('ch6_compu', 1);
          doneMsg(left('Un futuro visto'));
        },
        P('compu')
      );
    }

    function scene_solo() {
      chime(380);
      cine(
        [
          { pause: 800 },
          { t: 'Una habitación con una sola silla y una lámpara encendida. Nadie más.' },
          { pause: 2400 },
          { t: 'La ventana está oscura. La figura mira hacia ella como si esperara que alguien tocara.' },
          { pause: 2400 },
          { who: 'Tú', t: '¿Es esto lo que temo… o lo que me resulta más cómodo?' },
          { pause: 2800 },
          { t: 'Al mirar demasiado, la habitación parece más grande.' },
          { pause: 2200 },
        ],
        () => {
          storyFlag('ch6_solo', 1);
          doneMsg(left('Un futuro visto'));
        },
        P('solo')
      );
    }

    function scene_gente() {
      chime(700);
      cine(
        [
          { pause: 800 },
          { t: 'Una mesa larga. Siluetas alrededor, hablando a la vez, sin que se oiga una sola palabra.' },
          { pause: 2600 },
          { t: 'Hay una silla libre. Quizá es para ti. Quizá no.' },
          { pause: 2400 },
          { t: 'Cuando intentas ver sus caras, la escena se mueve, como si aún no las hubieras conocido.' },
          { pause: 2600 },
          { who: 'Tú', t: 'Tampoco sé si eso me haría feliz.' },
          { pause: 2400 },
        ],
        () => {
          storyFlag('ch6_gente', 1);
          doneMsg(left('Un futuro visto'));
        },
        P('gente')
      );
    }

    function scene_vacio() {
      chime(300);
      cine(
        [
          { pause: 800 },
          { t: 'Un nicho sin nada. Ni figura, ni mesa, ni pantalla. Solo una luz pálida, quieta.' },
          { pause: 2600 },
          { t: 'Lo miras con atención. No se deforma. No vibra. No hay nada que pueda cambiar todavía.' },
          { pause: 2800 },
          { t: 'Los otros futuros temblaban cuando los mirabas demasiado. Este no: nadie ha podido imaginarlo aún.' },
          { pause: 3000 },
          { who: 'Tú', t: 'No sé qué hay aquí. Y, por primera vez, no me incomoda no saberlo.' },
          { pause: 3000 },
          { t: 'Al fondo, algo muy pequeño parpadea, como una luz en una ventana lejana. Después se apaga.' },
          { pause: 2600 },
        ],
        () => {
          storyFlag('ch6_vacio', 1);
          chime(520);
          showMsg('Un futuro sin forma · opcional');
        },
        { x: -5.7, y: 1.8, z: 5.6 }
      );
    }

    const pastN = () => ['ch6_aula', 'ch6_nino', 'ch6_cierre'].filter((k) => FL()[k]).length;
    const futN = () => ['ch6_fisica', 'ch6_compu', 'ch6_solo', 'ch6_gente'].filter((k) => FL()[k]).length;
    function left(m) {
      const n = futN();
      if (n >= 4) {
        chime(660);
        setTimeout(() => showMsg('Se abre la escalera de cristal hacia el último piso'), 700);
        return 'Ninguno de estos futuros es definitivo';
      }
      return m + ' · ' + n + '/4';
    }

    function scene_frase() {
      chime(500);
      cine(
        [
          { pause: 900 },
          { t: 'En el último piso, una frase grabada en el suelo, con letras que parecen hechas de luz:' },
          { pause: 2400 },
          { who: 'Inscripción', t: '«No puedes recordar el futuro porque todavía no ha ocurrido.»' },
          { pause: 3800 },
          { t: 'Al fondo, un ventanal enorme se abre hacia el este.' },
          { pause: 2200 },
        ],
        () => {
          storyFlag('ch6_frase', 1);
          showMsg('Acércate al ventanal · E');
        },
        P('frase')
      );
    }

    function scene_final() {
      chime(440);
      cine(
        [
          { pause: 1000 },
          { t: 'Más allá del cristal, el mar se extiende hasta una ciudad lejana: apenas un temblor de luces en el horizonte.' },
          { pause: 3200 },
          { t: 'Te quedas mirándola. Por primera vez comprendes que llevas mucho tiempo intentando resolver tu vida como si fuera un problema matemático.' },
          { pause: 3600 },
          { t: 'Qué camino elegir. Qué debiste haber hecho. Quién pudiste ser. Qué pensará de ti la versión que todavía no existe.' },
          { pause: 3600 },
          { t: 'La isla no te ofrece ninguna respuesta. Solo te muestra que existen posibilidades.' },
          { pause: 3400 },
          ...(FL().ch6_vacio ? [{ t: 'Junto a tu reflejo en el cristal queda un espacio sin llenar. No sientes que falte algo. Sientes que todavía cabe.' }, { pause: 3400 }] : []),
          { who: 'Tú', t: 'Quizá no hay nada que resolver. Solo algo que seguir mirando.' },
          { pause: 3000 },
          { t: 'Por primera vez, no intentas calcular cuál es la correcta.' },
          { pause: 3000 },
        ],
        () => {
          storyFlag('ch6_complete', 1);
          leave(() => showMsg('Capítulo VI completado · Las torres'));
        },
        { x: 56, y: TOP + 2.2, z: 0 }
      );
    }

    // ---------- Entrada, salida y transiciones ----------
    const fadeEl = () => {
      if (M6.fade) return M6.fade;
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;inset:0;z-index:78;background:#05080c;opacity:0;pointer-events:none;transition:opacity 1.1s ease';
      document.body.appendChild(d);
      return (M6.fade = d);
    };
    const exitBtn = () => {
      if (M6.exitBtn) return M6.exitBtn;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'VOLVER A LA ISLA';
      b.style.cssText = 'position:fixed;top:14px;right:14px;z-index:9;display:none;padding:8px 14px;font:10px system-ui;letter-spacing:2px;color:#cfd8de;background:rgba(10,14,18,.55);border:1px solid rgba(207,216,222,.28);cursor:pointer';
      b.onclick = () => {
        if (M6.on && S.on && !CIN.on) leave();
      };
      document.body.appendChild(b);
      return (M6.exitBtn = b);
    };

    function startPos() {
      const f = FL();
      if (f.ch6_frase) return { x: 40, z: 0, yaw: -Math.PI / 2 };
      if (f.ch6_gente && f.ch6_fisica && f.ch6_compu && f.ch6_solo) return { x: 10, z: 0, yaw: -Math.PI / 2 };
      if (f.ch6_bridge) return { x: -4, z: 0, yaw: -Math.PI / 2 };
      if (f.ch6_cierre) return { x: -29, z: 0, yaw: -Math.PI / 2 };
      return { x: -45, z: 0, yaw: -Math.PI / 2 };
    }

    function begin() {
      if (M6.on || M6.busy || !S.on || CIN.on) return;
      M6.busy = true;
      S.on = false;
      const go = () => {
        S.on = false;
        fadeEl().style.opacity = '1';
        const enter = () => {
          try {
            installHooks();
            if (!M6.built) build();
            M6.g.visible = true;
            syncGates(true);
            const sp = startPos();
            M6.on = true;
            M6.fogDensity0 = scene.fog ? scene.fog.density : null;
            try {
              window.__boisCh6Wx = { prev: WX.st.mode, mine: true };
              WX.setMode(5);
            } catch (e) {
              typeof __bw === 'function' && __bw('36e-chapter6#6', e);
            }
            S.x = O6.x + sp.x;
            S.z = O6.z + sp.z;
            S.y = O6.y + floorY(sp.x, sp.z) + 0.05;
            S.vy = 0;
            S.sw = false;
            S.fly = false;
            S.yaw = sp.yaw;
            S.pitch = 0;
            exitBtn().style.display = 'block';
            ambStart();
            if (!window.__boisMainLoopUnified && !M6.raf) {
              M6.last = performance.now();
              M6.raf = requestAnimationFrame(loop);
            }
            fadeEl().style.opacity = '0';
            S.on = true;
            M6.busy = false;
            M6.hintAt = performance.now() + 6000;
            if (!FL().ch6_started) {
              storyFlag('ch6_started', 1);
              showMsg('Capítulo VI · Las torres · E: examinar');
            } else {
              showMsg('Las torres · E: examinar');
            }
          } catch (err) {
            console.error('Capítulo VI:', err);
            M6.on = false;
            S.on = true;
            M6.busy = false;
            fadeEl().style.opacity = '0';
          }
        };
        if (M6.built || M6.preloadReady) enter();
        else if (M6.preloadStarted) M6.preloadWaiters.push(enter);
        else enter();
      };
      if (!FL().ch6_started) {
        S.on = true;
        cine(
          [
            { pause: 700 },
            { t: 'Las dos torres de cristal se alzan sobre ti, fuera de lugar en esta isla.' },
            { pause: 2200 },
            { t: 'Entre ellas, a gran altura, un puente las une. Y a sus pies, una puerta abierta que no estaba antes.' },
            { pause: 2600 },
            { t: 'Cada una parece medir el tiempo de una manera distinta.' },
            { pause: 2400 },
          ],
          go,
          { x: GAP.x, y: 40, z: -16 },
          true
        );
        M6.preloadTimer = setTimeout(() => {
          M6.preloadTimer = 0;
          preloadChapter().catch((e) => console.warn('Capítulo VI (precarga):', e));
        }, 700);
      } else {
        go();
      }
    }

    function leave(cb) {
      if (!M6.on || M6.busy) return;
      M6.busy = true;
      S.on = false;
      fadeEl().style.opacity = '1';
      setTimeout(() => {
        M6.on = false;
        try {
          const w = window.__boisCh6Wx;
          if (w && w.mine && WX.st.mode === 5) WX.setMode(w.prev);
          window.__boisCh6Wx = null;
        } catch (e) {
          typeof __bw === 'function' && __bw('36e-chapter6#7', e);
        }
        if (M6.g) M6.g.visible = false;
        S.x = GAP.x;
        S.z = GAP.z;
        S.y = __g0(S.x, S.z, 50) + 0.1;
        S.vy = 0;
        S.sw = false;
        S.fly = false;
        S.yaw = Math.PI / 2;
        S.pitch = 0;
        exitBtn().style.display = 'none';
        ambStop();
        M6.near = '';
        fadeEl().style.opacity = '0';
        S.on = true;
        disposeChapter();
        M6.busy = false;
        if (cb) cb();
      }, 1100);
    }

    addEventListener(
      'keydown',
      (e) => {
        if (e.repeat || !S.on || CIN.on || PR.on || M6.busy || (typeof CAR !== 'undefined' && CAR && CAR.on)) return;
        if (e.code === 'Backspace' && M6.on) {
          e.preventDefault();
          leave();
          return;
        }
        if (e.code !== 'KeyE') return;
        if (M6.on) {
          const p = nearPt();
          if (p) {
            e.preventDefault();
            e.stopPropagation();
            p.run();
          }
        } else if (active() && nearGap()) {
          e.preventDefault();
          e.stopPropagation();
          begin();
        }
      },
      true
    );

    // ---------- Proximidad, pistas y bucle de animación ----------
    const nearGap = () => Math.hypot(S.x - GAP.x, S.z - GAP.z) < 6;
    const wx = (p) => O6.x + p.x;
    const wz = (p) => O6.z + p.z;
    const pend = (p) => !FL()[p.flag] && p.ok();
    const nearPt = () => {
      let b = null, bd = 1e9;
      for (let i = 0; i < M6.pts.length; i++) {
        const p = M6.pts[i];
        if (!pend(p)) continue;
        const d = Math.hypot(S.x - wx(p), S.z - wz(p));
        if (d < p.r && d < bd) {
          bd = d;
          b = p;
        }
      }
      return b;
    };
    const dirTxt = (dx, dz) => {
      const sn = Math.sin(S.yaw), cs = Math.cos(S.yaw), a = Math.atan2(dx * cs - dz * sn, -dx * sn - dz * cs), A = Math.abs(a);
      return A < 0.785 ? 'al frente' : A > 2.356 ? 'detrás de ti' : a > 0 ? 'a tu derecha' : 'a tu izquierda';
    };
    const nearestPend = () => {
      let b = null, bd = 1e9;
      for (let i = 0; i < M6.pts.length; i++) {
        const p = M6.pts[i];
        if (!pend(p) || p.opt) continue;
        const d = Math.hypot(S.x - wx(p), S.z - wz(p));
        if (d < bd) {
          bd = d;
          b = p;
        }
      }
      return b;
    };

    function pollCh6() {
      try {
        if (document.hidden) return;
        const isAct = active();
        if (M6.marker) {
          const want = isAct && !M6.on && !PR.on;
          if (M6.marker.visible !== want) M6.marker.visible = want;
          if (want && !M6.markerRAF && typeof M6.startMarkerSpin === 'function') M6.startMarkerSpin();
        }
        if (FL().ch6_complete && !M6.on) {
          if (M6.intId) {
            clearInterval(M6.intId);
            M6.intId = 0;
          }
          return;
        }
        if (!S.on || CIN.on || PR.on || M6.busy) return;
        if (!M6.on) {
          if (isAct && nearGap()) {
            if (!M6.built && !M6.preloadStarted && !M6.busy) preloadChapter().catch((e) => console.warn('Capítulo VI (precarga):', e));
            if (M6.near !== 'gap') {
              M6.near = 'gap';
              showMsg('Torres de cristal · E: entrar');
            }
          } else if (M6.near === 'gap') {
            M6.near = '';
          }
          return;
        }
        if (!FL().ch6_bridge && S.x - O6.x > -20 && S.x - O6.x < -8 && FL().ch6_cierre) {
          scene_bridge();
          return;
        }
        const p = nearPt();
        if (p) {
          if (M6.near !== p.id) {
            M6.near = p.id;
            showMsg(p.name + ' · E: examinar');
          }
        } else {
          M6.near = '';
          if (performance.now() > M6.hintAt) {
            M6.hintAt = performance.now() + 14000;
            const t = nearestPend();
            if (t && !FL().ch6_complete) showMsg('Algo espera ' + dirTxt(wx(t) - S.x, wz(t) - S.z) + ' · ' + Math.round(Math.hypot(wx(t) - S.x, wz(t) - S.z)) + ' m');
          }
        }
      } catch (e) {
        console.warn('Capítulo VI:', e);
      }
    }
    function armCh6Interval() {
      if (M6.intId || (FL().ch6_complete && !M6.on)) return;
      M6.intId = setInterval(pollCh6, 250);
    }
    armCh6Interval();

    const clamp = (v) => Math.max(0, Math.min(1, v));
    function stepCh6(dt, t) {
      if (!M6.on) return;
      M6.last = t;

      if (__amb && AU.ctx) {
        const tg = AU.on && (S.on || CIN.on) && !window.__boisGuideOverlayOpen && !document.hidden ? 0.026 * volScale() : 0;
        __amb.g.gain.setTargetAtTime(tg, AU.ctx.currentTime, 0.18);
      }

      if (document.hidden || (!S.on && !CIN.on)) return;
      const s = t * 0.001;

      try {
        for (let i = 0; i < M6.an.length; i++) M6.an[i](s);

        for (const k in M6.gates) {
          const G = M6.gates[k];
          if (G.open && G.t < 1) {
            G.t = Math.min(1, G.t + dt / 1.4);
            G.door.position.y = 1.7 + G.t * 3.6;
            G.door.material.opacity = 0.45 * (1 - G.t);
            G.frame.material.opacity = 0.5 * (1 - G.t);
            G.frame.material.transparent = true;
            if (G.t >= 1) {
              G.door.visible = false;
              G.frame.visible = false;
            }
          }
        }

        // Los 4 futuros principales tiemblan y se deforman si los observas demasiado tiempo
        const cp = cam.position;
        const fx = -Math.sin(S.yaw) * Math.cos(S.pitch);
        const fy = Math.sin(S.pitch);
        const fz = -Math.cos(S.yaw) * Math.cos(S.pitch);
        for (const id in M6.alc) {
          const A = M6.alc[id];
          const ax = O6.x + A.x - cp.x, ay = O6.y + 1.9 - cp.y, az = O6.z + A.z - cp.z;
          const d = Math.hypot(ax, ay, az);
          const dot = (ax * fx + ay * fy + az * fz) / (d || 1);
          const looking = d < 18 && dot > 0.95 && !CIN.on;
          M6.look[id] = clamp(M6.look[id] + (looking ? dt * 0.45 : -dt * 0.7));
          const k = M6.look[id];
          if (k < 0.02 && !A.dirty) continue;
          A.dirty = k >= 0.02;
          for (let i = 0; i < A.kids.length; i++) {
            const c = A.kids[i];
            const w = Math.sin(s * 2.3 + i * 1.7) * k;
            c.o.position.set(c.p.x + Math.sin(s * 1.9 + i) * 0.1 * k, c.p.y + Math.sin(s * 2.6 + i * 0.9) * 0.14 * k, c.p.z);
            c.o.scale.set(c.s.x * (1 + 0.22 * w), c.s.y * (1 + 0.3 * Math.sin(s * 1.7 + i) * k), c.s.z * (1 + 0.22 * w));
            c.o.rotation.y = c.r.y + Math.sin(s * 1.3 + i) * 0.18 * k;
            c.o.rotation.z = c.r.z + Math.sin(s * 2.1 + i * 2) * 0.06 * k;
          }
          A.pad.material.opacity = 0.14 + 0.3 * k;
        }
      } catch (e) {
        if (!M6.warned) {
          M6.warned = true;
          console.warn('Capítulo VI (animación):', e);
        }
      }
    }
    function loop(t) {
      if (!M6.on) {
        M6.raf = 0;
        return;
      }
      M6.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (t - M6.last) / 1000 || 0.016);
      stepCh6(dt, t);
    }
    window.__boisCh6Step = stepCh6;

    // ---------- Marcador de la puerta de cristal en la isla ----------
    try {
      const mk = new THREE.Group();
      const am = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false };
      const add = (geo, o) => {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial(Object.assign({}, am, o)));
        mk.add(m);
        return m;
      };
      const baseY = __g0(GAP.x, GAP.z, 50);
      add(new THREE.OctahedronGeometry(0.36), { color: 0xe6fbff, opacity: 0.95 });
      const haloRing = add(new THREE.TorusGeometry(0.68, 0.015, 6, 32), { color: 0xffe0a8, opacity: 0.62 });
      haloRing.rotation.x = 0.75;
      add(new THREE.SphereGeometry(1, 16, 12), { color: 0x7fd8ff, opacity: 0.2 });
      const bm = add(new THREE.CylinderGeometry(0.5, 0.5, 160, 14, 1, true), { color: 0x9fe0ff, opacity: 0.16, side: THREE.DoubleSide });
      bm.position.y = 80;
      const ring = add(new THREE.RingGeometry(1.15, 1.35, 32), { color: 0x9fe0ff, opacity: 0.42, side: THREE.DoubleSide });
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -1.25;
      mk.position.set(GAP.x, baseY + 1.3, GAP.z);
      mk.visible = false;
      scene.add(mk);
      M6.marker = mk;

      const spin = (t) => {
        if (!mk.visible || document.hidden) {
          M6.markerRAF = 0;
          return;
        }
        mk.rotation.y = t * 0.0012;
        haloRing.rotation.y = -t * 0.0021;
        haloRing.rotation.z = t * 0.0009;
        mk.position.y = baseY + 1.3 + Math.sin(t * 0.0016) * 0.14;
        ring.position.y = baseY + 0.04 - mk.position.y;
        M6.markerRAF = requestAnimationFrame(spin);
      };
      M6.startMarkerSpin = () => {
        if (mk.visible && !M6.markerRAF && !document.hidden) M6.markerRAF = requestAnimationFrame(spin);
      };
    } catch (e) {
      console.warn('Capítulo VI (marcador):', e);
    }

    // ---------- Misión y brújula ----------
    const stageClue = () => {
      const f = FL();
      if (!f.ch6_bridge && !(f.ch6_aula && f.ch6_nino && f.ch6_cierre)) {
        return f.ch6_aula && f.ch6_nino ? 'Mira las escenas del fondo de la Torre del pasado.' : 'Examina las escenas reconstruidas de la Torre del pasado.';
      }
      if (!f.ch6_bridge) return 'Cruza el puente de cristal.';
      if (futN() < 4) return 'Mira cada uno de los cuatro futuros. Observa cómo cambian. (' + futN() + '/4)';
      if (!f.ch6_frase) return 'Sube la escalera de cristal hasta el último piso.';
      return 'Acércate al ventanal y mira hacia el horizonte.';
    };

    const oM = bgMission;
    bgMission = function () {
      const f = FL();
      if (M6.on) return { title: 'Capítulo VI · Las torres: mirar hacia el pasado', clue: stageClue() + ' · Retroceso: volver a la isla.' };
      if (f.ch6_complete) return { title: 'Capítulo VI completado · Las torres', clue: 'Has visto lo que fuiste y lo que podrías ser. Katherin sigue cerca del lago. El Capítulo VII ya está disponible.' };
      if (f.ch5_complete && !PR.on) {
        return {
          title: 'Capítulo VI · Las torres: mirar hacia el pasado',
          clue: f.ch6_started ? 'Vuelve a la puerta de cristal, entre las dos torres del centro de la isla.' : 'Las dos torres de cristal están en el centro de la isla. Entre ellas hay una puerta.',
        };
      }
      return oM();
    };

    const oT = bgTarget;
    bgTarget = function () {
      if (M6.on) return null;
      if (active() && !PR.on) return { name: 'Torres gemelas · puerta de cristal', x: GAP.x, z: GAP.z };
      return oT();
    };

    // Atajos de prueba: solo con ?dev o bois_dev=1
    if (window.BOIS_DEV) {
    window.__boisCh6Unlock = () => {
      storyFlag('ch4_complete', 1);
      storyFlag('ch5_complete', 1);
      console.log('Capítulo V marcado como completado: ve a la puerta entre las torres (E).');
    };
    window.__boisCh6Reset = () => {
      for (const k of ['ch6_started', 'ch6_aula', 'ch6_nino', 'ch6_cierre', 'ch6_bridge', 'ch6_fisica', 'ch6_compu', 'ch6_solo', 'ch6_gente', 'ch6_vacio', 'ch6_frase', 'ch6_complete']) {
        delete STORY.flags[k];
      }
      saveStory();
      const wasIn = M6.on;
      if (wasIn) {
        M6.on = false;
        try {
          const w = window.__boisCh6Wx;
          if (w && w.mine && WX.st.mode === 5) WX.setMode(w.prev);
          window.__boisCh6Wx = null;
        } catch (e) {}
        S.x = GAP.x;
        S.z = GAP.z;
        S.y = __g0(S.x, S.z, 50) + 0.1;
        S.vy = 0;
        S.sw = false;
        S.fly = false;
        exitBtn().style.display = 'none';
        S.on = true;
      }
      disposeChapter();
      armCh6Interval();
      console.log('Capítulo VI reiniciado.');
    };
    }
    window.__boisCh6 = M6;
    window.__boisCh6Preload = preloadChapter;
  })();
} catch (__ch6Err) {
  console.error('Capítulo VI no pudo inicializarse; se conserva el juego base:', __ch6Err);
}
