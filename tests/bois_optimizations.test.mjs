import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('CSS hides .mBadge[hidden] and omits live-WebGL backdrop-filter on HUDs', () => {
  const css = read('css/main.css');
  assert.match(css, /\.mBadge\[hidden\]\s*\{\s*display:\s*none;\s*\}/);

  const liveOverlaySelectors = [
    '#carHud',
    '#carPrompt',
    '#tb',
    '.mBadge',
    '.mNav button',
    '#controlsPanel',
  ];
  for (const sel of liveOverlaySelectors) {
    const idx = css.indexOf(sel);
    assert.notEqual(idx, -1, `Missing selector ${sel}`);
    const block = css.slice(idx, css.indexOf('}', idx) + 1);
    assert.equal(/backdrop-filter\s*:/.test(block), false, `${sel} should not use backdrop-filter`);
  }

  for (const file of [
    'js/23-cinematics.js',
    'js/26-guide-map.js',
    'js/28c-chapter2-guide.js',
    'js/11-player-input.js',
    'js/31-chapter4.js',
    'js/37b-debug.js',
  ]) {
    assert.equal(/backdrop-filter/.test(read(file)), false, `${file} should not use backdrop-filter`);
  }
});

test('lerpP mutates existing color arrays in place without per-frame allocation', () => {
  const src = read('js/10-lighting-time.js');
  const match = src.match(/function lerpP\(o,a,b,e\)\{[\s\S]*?\n\}/) || src.match(/function lerpP\(o,a,b,e\)\{[^\n]+\}/);
  assert.ok(match, 'lerpP function not found');
  const ctx = {};
  vm.runInNewContext(match[0], ctx);

  const dirRef = [0, 0, 0];
  const out = { si: 0, dir: dirRef, n: 'old' };
  const a = { si: 1, dir: [0, 1, 0], n: 'A' };
  const b = { si: 3, dir: [1, 0, 1], n: 'B' };

  ctx.lerpP(out, a, b, 0.5);
  assert.equal(out.dir, dirRef, 'lerpP should reuse existing array reference');
  assert.equal(out.si, 2);
  assert.deepEqual(out.dir, [0.5, 0.5, 0.5]);
  assert.equal(out.n, 'B');
});

test('Swanbox audio and countdown pause cleanly when menu/overlay/hidden', () => {
  const sbxSrc = read('js/30e-swanbox.js');
  assert.match(sbxSrc, /window\.__boisSwanBoxPause\s*=\s*__swanBoxPause/);
  assert.match(sbxSrc, /visibilitychange/);
  assert.equal(/\bsbx\.timer\s*=\s*setTimeout/.test(sbxSrc), false, 'Swanbox should use pause-aware frame countdown');

  const loopSrc = read('js/21-main-loop-config.js');
  const pauseCalls = loopSrc.match(/window\.__boisSwanBoxPause\?\.\(\)/g) || [];
  assert.ok(pauseCalls.length >= 3, 'Main loop must call __boisSwanBoxPause on hidden, overlay, and menu pause');
});

test('Weather thunder and frog croaks guard against paused/hidden/muted playback', () => {
  const weather = read('js/12-weather.js');
  assert.match(weather, /if\(AU\.ctx&&AU\.on&&S\.on&&!PR\.on&&!document\.hidden\)/);

  const fauna = read('js/08-fauna-journal.js');
  assert.match(fauna, /AU\.on&&S\.on&&!PR\.on&&!document\.hidden/);
});

test('carStep skips carEvaluateSpot when angular delta dYaw is negligible', () => {
  const carSrc = read('js/28-car-radio.js');
  assert.match(carSrc, /const dYaw = rn \* h, nextYaw = CAR\.yaw \+ dYaw;\s*if \(Math\.abs\(dYaw\) >= 1e-5\)/);
  assert.match(carSrc, /function carWheelWorld\(i, out\)/);
});

test('Chapter VI omits Asperger, avoids duplicate window in Silencio, and upgrades scene models', () => {
  const c6 = read('js/36e-chapter6.js');
  const c6Min = read('js/36e-chapter6.min.js');
  assert.equal(/asperger/i.test(c6), false, 'Chapter VI source should not mention Asperger');
  assert.equal(/asperger/i.test(c6Min), false, 'Chapter VI minified should not mention Asperger');
  assert.match(c6, /\[-43,\s*-34\.5\]\.forEach\(\(x, i\) => rainWindow\(g, 3\.4, 2\.4, x, 2\.1, 8\.8/);
  assert.equal(/bx\(cierreG,\s*1\.62,\s*0\.1,\s*0\.18,\s*-34\.5/.test(c6), false, 'Duplicate hardcoded window box in Silencio must be removed');
});

test('Chapter V frames 14:48/14:53 as a post-school memory (school ended at 1 pm)', () => {
  const c5 = read('js/36c-chapter5.js');
  assert.equal(/te temblaban las piernas/.test(c5), false, 'Chapter V should not say legs were trembling at 14:53');
  assert.match(c5, /7 a\. m\. a 1 p\. m\./);
  assert.match(c5, /volvías en el recuerdo/);
});

