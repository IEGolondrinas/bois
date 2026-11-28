/* BOIS.IO · 36f-shinkai.js (v143+) — resplandor solar estilo Makoto Shinkai con oclusión en árboles
   v151: aunque los árboles no tengan colisión física con el jugador, el rayo del resplandor ahora consulta
   directamente treeChunks (tronco sólido + copa con borde suave entre hojas) en tiempo real y sin retraso. */
// <sun-occlusion>
function sunRayBox(px, py, pz, dx, dy, dz, x0, x1, y0, y1, z0, z1, maxT) {
  let tmin = 0, tmax = maxT;
  const o = [px, py, pz], d = [dx, dy, dz], lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < lo[i] || o[i] > hi[i]) return -1;
      continue;
    }
    let a = (lo[i] - o[i]) / d[i], b = (hi[i] - o[i]) / d[i];
    if (a > b) { const t = a; a = b; b = t; }
    if (a > tmin) tmin = a;
    if (b < tmax) tmax = b;
    if (tmin > tmax) return -1;
  }
  return tmin > 0.05 ? tmin : (tmax > 0.05 ? tmax : -1);
}

function sunRayTri(px, py, pz, dx, dy, dz, TA, o) {
  const ax = TA[o], ay = TA[o + 1], az = TA[o + 2];
  const e1x = TA[o + 3] - ax, e1y = TA[o + 4] - ay, e1z = TA[o + 5] - az;
  const e2x = TA[o + 6] - ax, e2y = TA[o + 7] - ay, e2z = TA[o + 8] - az;
  const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x;
  const det = e1x * hx + e1y * hy + e1z * hz;
  if (Math.abs(det) < 1e-9) return -1;
  const f = 1 / det, sx = px - ax, sy = py - ay, sz = pz - az;
  const u = f * (sx * hx + sy * hy + sz * hz);
  if (u < 0 || u > 1) return -1;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
  const v = f * (dx * qx + dy * qy + dz * qz);
  if (v < 0 || u + v > 1) return -1;
  return f * (e2x * qx + e2y * qy + e2z * qz);
}

function sunTreeProfile(geo) {
  if (!geo) return null;
  if (geo.userData && geo.userData.__sunProf) return geo.userData.__sunProf;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (!bb) return null;
  const h = Math.max(1, bb.max.y - bb.min.y);
  const w = Math.max(0.8, bb.max.x - bb.min.x, bb.max.z - bb.min.z);
  const isCypress = h > 5.0 && w < 2.3;
  const prof = {
    trunkR: isCypress ? 0.24 : 0.30,
    trunkH: bb.min.y + h * (isCypress ? 0.48 : 0.44),
    cy: bb.min.y + h * (isCypress ? 0.56 : 0.62),
    crXZ: w * (isCypress ? 0.38 : 0.42),
    crY: h * (isCypress ? 0.44 : 0.35),
  };
  if (geo.userData) geo.userData.__sunProf = prof;
  return prof;
}

// Devuelve oclusión suave de 0 (libre) a 1 (bloqueado por tronco, terreno o edificio).
function sunTreeOcclusion(px, py, pz, dx, dy, dz, maxT) {
  if (typeof treeChunks === 'undefined' || !Array.isArray(treeChunks) || !treeChunks.length) return 0;
  let best = 0;
  const horizLen2 = dx * dx + dz * dz;
  for (let c = 0; c < treeChunks.length; c++) {
    const tc = treeChunks[c];
    if (!tc || !tc.m || !tc.s) continue;
    const sc = tc.s.center, sr = tc.s.radius;
    const ocx = sc.x - px, ocy = sc.y - py, ocz = sc.z - pz;
    const proj = ocx * dx + ocy * dy + ocz * dz;
    if (proj < -sr || proj > maxT + sr) continue;
    if (ocx * ocx + ocy * ocy + ocz * ocz - proj * proj > sr * sr) continue;

    const im = tc.m, prof = sunTreeProfile(im.geometry);
    if (!prof || !im.instanceMatrix || !im.instanceMatrix.array) continue;
    const arr = im.instanceMatrix.array;
    const total = Math.floor(arr.length / 16);

    for (let i = 0; i < total; i++) {
      const o = i * 16;
      const tx = arr[o + 12], ty = arr[o + 13], tz = arr[o + 14];
      const sxRaw = Math.hypot(arr[o], arr[o + 1], arr[o + 2]);
      const syRaw = Math.hypot(arr[o + 4], arr[o + 5], arr[o + 6]);
      if (sxRaw < 0.05 || syRaw < 0.05) continue;
      const sx = sxRaw;
      const sy = syRaw;
      const cy = ty + prof.cy * sy;
      const vx = tx - px, vy = cy - py, vz = tz - pz;
      const t = vx * dx + vy * dy + vz * dz;
      if (t <= 0.3 || t > maxT) continue;

      // 1) Tronco sólido (bloquea el 100%)
      if (horizLen2 > 1e-6) {
        const tTr = ((tx - px) * dx + (tz - pz) * dz) / horizLen2;
        if (tTr > 0.3 && tTr < maxT) {
          const ry = py + dy * tTr;
          if (ry >= ty && ry <= ty + prof.trunkH * sy) {
            const ex = px + dx * tTr - tx, ez = pz + dz * tTr - tz;
            const tr = prof.trunkR * sx;
            if (ex * ex + ez * ez <= tr * tr) return 1;
          }
        }
      }

      // 2) Copa frondosa (bloquea fuerte en el centro, filtración suave en las hojas del borde)
      const crX = Math.max(0.45, prof.crXZ * sx), crY = Math.max(0.55, prof.crY * sy);
      const lx = px + dx * t - tx, ly = py + dy * t - cy, lz = pz + dz * t - tz;
      const q2 = (lx * lx + lz * lz) / (crX * crX) + (ly * ly) / (crY * crY);
      if (q2 < 1.0) {
        if (q2 <= 0.52) {
          best = Math.max(best, 0.94);
        } else {
          const k = (q2 - 0.52) / 0.48;
          const sm = k * k * (3 - 2 * k);
          best = Math.max(best, 0.94 * (1 - sm) + 0.14);
        }
        if (best >= 0.99) return 1;
      }
    }
  }
  return best;
}

const _sunSeenCell = new Set(), _sunSeenTri = new Set();
// env: {hAt, cells, TA, CS, blockers[]}. Devuelve 0..1 (compatibilidad: sigue siendo verdad/falso al usarlo como booleano).
function sunOccludedFactor(env, px, py, pz, dx, dy, dz, maxT) {
  maxT = maxT || 95;
  for (let t = 2; t <= maxT; t += 2.5) {
    if (py + dy * t < env.hAt(px + dx * t, pz + dz * t)) return 1;
  }
  const seenCell = _sunSeenCell, seenTri = _sunSeenTri;
  seenCell.clear(); seenTri.clear();
  for (let t = 0; t <= maxT; t += 2.5) {
    const k = Math.floor((px + dx * t) / env.CS) * 4096 + Math.floor((pz + dz * t) / env.CS);
    if (seenCell.has(k)) continue;
    seenCell.add(k);
    const L = env.cells.get(k);
    if (!L) continue;
    for (const ti of L) {
      if (seenTri.has(ti)) continue;
      seenTri.add(ti);
      const h = sunRayTri(px, py, pz, dx, dy, dz, env.TA, ti * 9);
      if (h > 0.3 && h < maxT) return 1;
    }
  }
  for (const fn of env.blockers) {
    try {
      if (fn(px, py, pz, dx, dy, dz, maxT)) return 1;
    } catch (e) {
      typeof __bw === 'function' && __bw('36f-shinkai#1', e);
    }
  }
  return sunTreeOcclusion(px, py, pz, dx, dy, dz, maxT);
}

function sunOccluded(env, px, py, pz, dx, dy, dz, maxT) {
  return sunOccludedFactor(env, px, py, pz, dx, dy, dz, maxT) >= 0.85;
}
// </sun-occlusion>
window.__boisRayBox = sunRayBox;
window.__boisSunBlockers = window.__boisSunBlockers || [];

try {
  (function () {
    const el = document.createElement('div');
    el.id = 'sunGlare';
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;mix-blend-mode:screen;will-change:opacity,background';
    document.body.appendChild(el);
    const v = new THREE.Vector3(), fw = new THREE.Vector3();
    let last = '', occ = 0, occTarget = 0, lastOccT = -1e9, lastCamX = 1e9, lastCamY = 1e9, lastCamZ = 1e9, lastDot = -2;
    const env = { hAt, cells, TA, CS, blockers: window.__boisSunBlockers };

    function glare(dt) {
      const d = sun && sun.userData.d;
      let o = 0;
      if (d && !uw && S.on) {
        cam.getWorldDirection(fw);
        const k = fw.dot(d);
        if (k > 0.25 && d.y > -0.02) {
          v.copy(d).multiplyScalar(100).add(cam.position).project(cam);
          const night = PC ? PC.night || 0 : 0;
          const cov = Math.min(1, (SKY.ov || 0) + (typeof WX !== 'undefined' && WX.st && WX.st.sc ? WX.st.sc : 0) * 0.85);
          o = Math.pow((k - 0.25) / 0.75, 2.2) * (1 - night) * (1 - cov * 0.85) * Math.min(1, (d.y + 0.05) * 8);

          if ((typeof PR !== 'undefined' && PR.on) || (window.__boisCh6 && window.__boisCh6.on) || cam.position.z < -900) {
            o = 0;
          } else if (o > 0.004) {
            const nowT = performance.now();
            const moved2 = (cam.position.x - lastCamX) ** 2 + (cam.position.y - lastCamY) ** 2 + (cam.position.z - lastCamZ) ** 2;
            if (nowT - lastOccT >= 70 || Math.abs(k - lastDot) > 0.025 || moved2 > 0.2) {
              lastOccT = nowT;
              lastDot = k;
              lastCamX = cam.position.x;
              lastCamY = cam.position.y;
              lastCamZ = cam.position.z;
              occTarget = sunOccludedFactor(env, cam.position.x, cam.position.y, cam.position.z, d.x, d.y, d.z, 95);
            }
            const rate = Math.min(1, (dt || 0.016) * (occTarget > occ ? 22 : 12));
            occ += (occTarget - occ) * rate;
            o *= 1 - occ;
          }

          const x = ((v.x * 0.5 + 0.5) * 100).toFixed(1);
          const y = ((-v.y * 0.5 + 0.5) * 100).toFixed(1);
          const c = PC && PC.sc ? PC.sc : [1, 0.9, 0.7];
          const r = (c[0] * 255) | 0, g = (c[1] * 255) | 0, b = (c[2] * 255) | 0;
          const key = x + '|' + y + '|' + r + '|' + g + '|' + b;
          if (key !== last) {
            last = key;
            el.style.background =
              'radial-gradient(circle at ' + x + '% ' + y + '%,rgba(255,250,235,.95) 0,rgba(' +
              r + ',' + g + ',' + b + ',.55) 7%,rgba(' + r + ',' + g + ',' + b + ',.22) 24%,rgba(' +
              r + ',' + g + ',' + b + ',0) 62%)';
          }
        }
      }
      const s = o.toFixed(2);
      if (el.dataset.o !== s) {
        el.dataset.o = s;
        el.style.opacity = s;
      }
    }

    const _sf = skyFrame;
    skyFrame = function (dt, tt) {
      _sf(dt, tt);
      try {
        glare(dt);
      } catch (e) {
        typeof __bw === 'function' && __bw('36f-shinkai#2', e);
      }
    };
  })();
} catch (e) {
  console.warn('shinkai:', e);
}
