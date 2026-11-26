/* BOIS.IO · 18a-poolrooms-tex.js — Texturas procedurales para Poolrooms (Nivel 37)
   Provee tileSet, wallSet, ceilSet, signAtlas, rippleTex, causticTex y shaftTex
   (y expone window.__boisPoolTex) antes de 18-poolrooms.js. */
(() => {
  const mkCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')];
  };
  const h2 = (x, y) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const mkTex = (c, srgb, rep) => {
    const t = new THREE.CanvasTexture(c);
    if (rep) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
    }
    if (srgb && THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  };

  function tileSet(o) {
    const S = 256;
    const n = o.n || 8;
    const step = S / n;
    const base = o.c || [236, 242, 240];
    const grout = o.g || [186, 200, 202];
    const jit = o.v || 0.05;
    const wet = o.wet || 0;
    const rt = o.rt !== undefined ? o.rt : 80;
    const rg = o.rg !== undefined ? o.rg : 180;

    const [cm, xm] = mkCanvas(S, S);
    const [cb, xb] = mkCanvas(S, S);
    const [cr, xr] = mkCanvas(S, S);

    xm.fillStyle = `rgb(${grout[0]},${grout[1]},${grout[2]})`;
    xm.fillRect(0, 0, S, S);
    xb.fillStyle = 'rgb(70,70,70)';
    xb.fillRect(0, 0, S, S);
    xr.fillStyle = `rgb(${rg},${rg},${rg})`;
    xr.fillRect(0, 0, S, S);

    const pad = Math.max(1, Math.round(step * 0.06));
    for (let iy = 0; iy < n; iy++) {
      for (let ix = 0; ix < n; ix++) {
        const k = 1 + (h2(ix + n * 3, iy + n * 7) * 2 - 1) * jit;
        const r = Math.max(0, Math.min(255, Math.round(base[0] * k)));
        const g = Math.max(0, Math.min(255, Math.round(base[1] * k)));
        const b = Math.max(0, Math.min(255, Math.round(base[2] * k)));
        const x = ix * step + pad;
        const y = iy * step + pad;
        const w = step - pad * 2;

        xm.fillStyle = `rgb(${r},${g},${b})`;
        xm.fillRect(x, y, w, w);

        const bv = Math.round(212 + (h2(ix + 11, iy + 19) - 0.5) * 18);
        xb.fillStyle = `rgb(${bv},${bv},${bv})`;
        xb.fillRect(x, y, w, w);

        const rv = Math.max(18, Math.min(255, Math.round(rt + (h2(ix + 31, iy + 5) - 0.5) * 26 * (1 + wet * 0.35))));
        xr.fillStyle = `rgb(${rv},${rv},${rv})`;
        xr.fillRect(x, y, w, w);
      }
    }

    return {
      map: mkTex(cm, true, true),
      bump: mkTex(cb, false, true),
      rough: mkTex(cr, false, true)
    };
  }

  function wallSet() {
    return tileSet({ c: [238, 244, 242], g: [182, 198, 202], n: 8, v: 0.04, wet: 0.45, rt: 84, rg: 175 });
  }

  function ceilSet() {
    const t = tileSet({ c: [236, 242, 240], g: [204, 214, 216], n: 4, v: 0.025, wet: 0, rt: 195, rg: 220 });
    return { map: t.map, bump: t.bump };
  }

  function signAtlas() {
    const S = 512, H = S / 2;
    const [c, x] = mkCanvas(S, S);
    const labels = [
      ['NIVEL 37', 'DREAM POOLS'],
      ['PROF. 1.65 m', 'NO CORRER'],
      ['SILENCIO', 'ECO DE ATRIO'],
      ['SALIDA ↑', 'VOLVER AL LAGO']
    ];
    for (let idx = 0; idx < 4; idx++) {
      const qx = (idx % 2) * H;
      const qy = (idx >> 1) * H;
      x.fillStyle = '#e7f2f3';
      x.fillRect(qx, qy, H, H);
      x.strokeStyle = '#3c8594';
      x.lineWidth = 8;
      x.strokeRect(qx + 12, qy + 12, H - 24, H - 24);
      x.fillStyle = '#173e47';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.font = 'bold 34px system-ui, sans-serif';
      x.fillText(labels[idx][0], qx + H / 2, qy + H / 2 - 18);
      x.fillStyle = '#336c78';
      x.font = '600 18px system-ui, sans-serif';
      x.fillText(labels[idx][1], qx + H / 2, qy + H / 2 + 22);
    }
    return mkTex(c, true, false);
  }

  function rippleTex() {
    const S = 256;
    const [c, x] = mkCanvas(S, S);
    const img = x.createImageData(S, S);
    const d = img.data;
    const TAU = Math.PI * 2;
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const u = (px / S) * TAU, v = (py / S) * TAU;
        const dx = Math.cos(u * 3 + v * 2) * 0.35 + Math.cos(u * 5 - v * 4) * 0.22 + Math.cos(u * 2 + v * 6) * 0.15;
        const dy = Math.sin(u * 2 + v * 4) * 0.35 + Math.sin(u * 4 - v * 5) * 0.22 + Math.sin(u * 6 + v * 2) * 0.15;
        const idx = (py * S + px) * 4;
        d[idx] = Math.round(128 + dx * 48);
        d[idx + 1] = Math.round(128 + dy * 48);
        d[idx + 2] = 245;
        d[idx + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return mkTex(c, false, true);
  }

  function causticTex() {
    const S = 256;
    const [c, x] = mkCanvas(S, S);
    const img = x.createImageData(S, S);
    const d = img.data;
    const TAU = Math.PI * 2;
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const u = (px / S) * TAU, v = (py / S) * TAU;
        const w1 = Math.abs(Math.sin(u * 3 + Math.sin(v * 2) * 1.1));
        const w2 = Math.abs(Math.sin(v * 3 + Math.cos(u * 2) * 1.1));
        const val = Math.pow(Math.max(0, 1 - Math.min(w1, w2) * 1.35), 2.4);
        const idx = (py * S + px) * 4;
        d[idx] = Math.round(170 * val);
        d[idx + 1] = Math.round(245 * val);
        d[idx + 2] = Math.round(255 * val);
        d[idx + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return mkTex(c, true, true);
  }

  function shaftTex() {
    const W = 64, H = 256;
    const [c, x] = mkCanvas(W, H);
    const gv = x.createLinearGradient(0, 0, 0, H);
    gv.addColorStop(0, 'rgba(255,255,255,0)');
    gv.addColorStop(0.2, 'rgba(255,255,255,0.75)');
    gv.addColorStop(0.85, 'rgba(255,255,255,0.22)');
    gv.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gv;
    x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'destination-in';
    const gh = x.createLinearGradient(0, 0, W, 0);
    gh.addColorStop(0, 'rgba(255,255,255,0)');
    gh.addColorStop(0.5, 'rgba(255,255,255,1)');
    gh.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gh;
    x.fillRect(0, 0, W, H);
    return mkTex(c, true, false);
  }

  window.tileSet = tileSet;
  window.wallSet = wallSet;
  window.ceilSet = ceilSet;
  window.signAtlas = signAtlas;
  window.rippleTex = rippleTex;
  window.causticTex = causticTex;
  window.shaftTex = shaftTex;
  window.__boisPoolTex = { tileSet, wallSet, ceilSet, signAtlas, rippleTex, causticTex, shaftTex };
})();
