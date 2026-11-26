/* BOIS.IO · 34-lake-postcard.js — Postal del Parque de los Cisnes (Mejorado)
   Escena vegetal, flores, nenúfares con hoja y detalles de orilla. */
{
  try {
    const parkBench = window.__katherin?.userData?.bench;
    const decoMat = (color, roughness = 0.88, flatShading = false) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, flatShading });

    // Paleta de materiales compartidos
    const MAT = {
      bark: decoMat(0x5c3e2b, 0.95),
      woodInner: decoMat(0xc4a47c, 0.9),
      moss: decoMat(0x4b6e3a, 0.92),
      leafA: decoMat(0x2f5938, 0.85, true),
      leafB: decoMat(0x4d7845, 0.85, true),
      leafC: decoMat(0x739457, 0.85, true),
      lilyPad: decoMat(0x2d613b, 0.72),
      blossomPink: decoMat(0xf2bfd0, 0.78),
      blossomCream: decoMat(0xf7ecd5, 0.78),
      blossomCoral: decoMat(0xe89ca4, 0.78),
      stamen: decoMat(0xf5c242, 0.7),
      stoneA: decoMat(0x8a8579, 0.95, true),
      stoneB: decoMat(0x747067, 0.95, true)
    };

    const addStatic = (geo, mat, x, y, z, scale = 1, rotY = 0) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(scale);
      mesh.rotation.y = rotY;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    // -------------------------------------------------------------------------
    // 1. ÁRBOLES DE ENMARCADO (con raíces, ramas y copa frondosa con flores)
    // -------------------------------------------------------------------------
    const buildParkTree = (x, y, z, seed) => {
      const tree = new THREE.Group();
      tree.position.set(x, y, z);
      tree.rotation.y = seed * 1.1;

      // Tronco principal con ligera inclinación orgánica
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 4.5, 8), MAT.bark);
      trunk.position.y = 2.2;
      trunk.rotation.z = (seed % 2 === 0 ? 1 : -1) * 0.04;
      tree.add(trunk);

      // Raíces superficiales en la base
      for (let r = 0; r < 4; r++) {
        const ra = r * (Math.PI / 2) + seed * 0.5;
        const root = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.9, 5), MAT.bark);
        root.position.set(Math.cos(ra) * 0.28, 0.18, Math.sin(ra) * 0.28);
        root.rotation.z = -Math.cos(ra) * 1.05;
        root.rotation.x = Math.sin(ra) * 1.05;
        tree.add(root);
      }

      // Ramas y cúmulos de follaje
      const leafMats = [MAT.leafA, MAT.leafB, MAT.leafC];
      const crownGeo = new THREE.IcosahedronGeometry(1, 1);

      for (let k = 0; k < 8; k++) {
        const ang = (k * Math.PI * 2) / 8 + seed * 0.4;
        const len = 1.35 + (k % 3) * 0.3;
        const heightY = 3.15 + (k % 2) * 0.35;

        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, len, 5), MAT.bark);
        branch.position.set(Math.cos(ang) * 0.52, heightY, Math.sin(ang) * 0.52);
        branch.rotation.z = -Math.cos(ang) * 0.55;
        branch.rotation.x = Math.sin(ang) * 0.55;
        tree.add(branch);

        // Follaje principal de la rama
        const radius = 1.05 + (k % 3) * 0.18;
        const crown = new THREE.Mesh(crownGeo, leafMats[k % 3]);
        crown.position.set(Math.cos(ang) * 1.15, heightY + 0.65, Math.sin(ang) * 1.15);
        crown.scale.set(radius * 1.18, radius * 0.72, radius * 1.08);
        crown.rotation.set(k * 0.3, ang, k * 0.2);
        tree.add(crown);

        // Pequeños brotes de flores en las puntas exteriores
        if (k % 2 === 0) {
          const bloom = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.22, 0),
            k % 4 === 0 ? MAT.blossomPink : MAT.blossomCream
          );
          bloom.position.set(Math.cos(ang) * 1.75, heightY + 0.55, Math.sin(ang) * 1.75);
          tree.add(bloom);
        }
      }

      // Cúpula superior del árbol
      const topCrown = new THREE.Mesh(crownGeo, MAT.leafB);
      topCrown.position.set(0, 4.45, 0);
      topCrown.scale.set(1.55, 1.05, 1.45);
      tree.add(topCrown);

      const topAccent = new THREE.Mesh(crownGeo, MAT.leafC);
      topAccent.position.set(0.35, 4.85, -0.25);
      topAccent.scale.set(0.95, 0.68, 0.95);
      tree.add(topAccent);

      tree.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = false;
          obj.receiveShadow = true;
        }
      });

      scene.add(tree);
    };

    // -------------------------------------------------------------------------
    // 2. MACIZOS DE FLORES (arbusto base + flores de múltiples pétalos)
    // -------------------------------------------------------------------------
    const buildFlowerBed = (cx, cz) => {
      const bushGeo = new THREE.IcosahedronGeometry(0.32, 1);
      const stemGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.36, 4);
      const petalGeo = new THREE.SphereGeometry(0.065, 6, 5);
      const centerGeo = new THREE.SphereGeometry(0.04, 6, 5);

      // Base verde de arbustos bajos
      for (let b = 0; b < 4; b++) {
        const ba = b * 1.57 + 0.3;
        const bx = cx + Math.cos(ba) * 0.38;
        const bz = cz + Math.sin(ba) * 0.38;
        const by = hAt(bx, bz);
        if (by < WL + 1 || window.__inLake(bx, bz)) continue;
        const bush = addStatic(bushGeo, b % 2 ? MAT.leafA : MAT.leafB, bx, by + 0.12, bz, 0.9 + (b % 2) * 0.25, ba);
        bush.scale.y *= 0.65;
      }

      // Flores individuales
      const flowerMats = [MAT.blossomPink, MAT.blossomCream, MAT.blossomCoral];
      for (let j = 0; j < 10; j++) {
        const ang = j * 2.399; // ángulo áureo para distribución natural
        const dist = 0.22 + (j % 4) * 0.2;
        const px = cx + Math.cos(ang) * dist;
        const pz = cz + Math.sin(ang) * dist;
        const py = hAt(px, pz);
        if (py < WL + 1 || window.__inLake(px, pz)) continue;

        const flowerGroup = new THREE.Group();
        flowerGroup.position.set(px, py, pz);
        flowerGroup.rotation.y = ang;
        flowerGroup.rotation.z = (Math.random() - 0.5) * 0.22;

        const stem = new THREE.Mesh(stemGeo, MAT.leafA);
        stem.position.y = 0.18;
        flowerGroup.add(stem);

        const fMat = flowerMats[j % flowerMats.length];
        for (let p = 0; p < 5; p++) {
          const pa = (p * Math.PI * 2) / 5;
          const petal = new THREE.Mesh(petalGeo, fMat);
          petal.scale.set(0.75, 0.45, 1.25);
          petal.position.set(Math.cos(pa) * 0.065, 0.37, Math.sin(pa) * 0.065);
          petal.rotation.y = Math.PI / 2 - pa; // Orientación radial correcta
          flowerGroup.add(petal);
        }

        const core = new THREE.Mesh(centerGeo, MAT.stamen);
        core.position.y = 0.385;
        flowerGroup.add(core);

        flowerGroup.scale.setScalar(0.85 + Math.random() * 0.35);
        flowerGroup.traverse(o => {
          if (o.isMesh) {
            o.castShadow = false;
            o.receiveShadow = true;
          }
        });
        scene.add(flowerGroup);
      }
    };

    // -------------------------------------------------------------------------
    // 3. NENÚFARES EN EL LAGO (hoja con muesca + flor bien orientada en InstancedMesh)
    // -------------------------------------------------------------------------
    const buildWaterLilies = () => {
      const lilyTemplate = new THREE.Group();

      // Hoja flotante con la clásica muesca en "V" (thetaLength < 2*PI)
      const padGeo = new THREE.CylinderGeometry(0.46, 0.44, 0.025, 18, 1, false, 0, Math.PI * 1.84);
      const pad = new THREE.Mesh(padGeo, MAT.lilyPad);
      pad.position.y = 0.0;
      lilyTemplate.add(pad);

      // Capa exterior de pétalos (6 pétalos abiertos, apuntando radialmente hacia afuera)
      const outerPetalGeo = new THREE.SphereGeometry(0.095, 7, 5);
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI * 2) / 6;
        const petal = new THREE.Mesh(outerPetalGeo, k % 2 ? MAT.blossomPink : MAT.blossomCream);
        petal.scale.set(0.58, 0.28, 1.45);
        petal.position.set(Math.cos(a) * 0.13, 0.045, Math.sin(a) * 0.13);
        petal.rotation.order = 'YXZ';
        petal.rotation.y = Math.PI / 2 - a; // Alinea el eje Z del pétalo hacia afuera
        petal.rotation.x = -0.22;           // Levanta suavemente la punta del pétalo
        lilyTemplate.add(petal);
      }

      // Capa interior de pétalos (6 pétalos más pequeños y erguidos, intercalados)
      const innerPetalGeo = new THREE.SphereGeometry(0.072, 7, 5);
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI * 2) / 6 + Math.PI / 6;
        const petal = new THREE.Mesh(innerPetalGeo, MAT.blossomCream);
        petal.scale.set(0.55, 0.3, 1.3);
        petal.position.set(Math.cos(a) * 0.075, 0.075, Math.sin(a) * 0.075);
        petal.rotation.order = 'YXZ';
        petal.rotation.y = Math.PI / 2 - a;
        petal.rotation.x = -0.58;           // Más cerrados hacia el centro
        lilyTemplate.add(petal);
      }

      // Centro dorado (estambres)
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), MAT.stamen);
      center.scale.set(1, 0.65, 1);
      center.position.y = 0.065;
      lilyTemplate.add(center);

      // Búsqueda de posiciones válidas en agua profunda
      const flowerCount = touch ? 10 : 22;
      const flowerPositions = [];
      for (let n = 0; n < 9000 && flowerPositions.length < flowerCount; n++) {
        const x = (Math.random() * 2 - 1) * 440;
        const z = (Math.random() * 2 - 1) * 440;
        if (!window.__inLake(x, z) || hAt(x, z) > WL - 1.15) continue;
        if (flowerPositions.some(q => Math.hypot(q.x - x, q.z - z) < 14)) continue;
        flowerPositions.push({ x, z });
      }

      if (!flowerPositions.length) return 0;

      // Agrupación por material para renderizar en pocos InstancedMesh
      const buckets = new Map();
      lilyTemplate.children.forEach(child => {
        child.updateMatrix();
        const geom = child.geometry.toNonIndexed().applyMatrix4(child.matrix);
        if (!buckets.has(child.material)) buckets.set(child.material, []);
        buckets.get(child.material).push(geom);
      });

      const dummy = new THREE.Object3D();
      const placements = flowerPositions.map(q => ({
        x: q.x,
        z: q.z,
        ry: Math.random() * Math.PI * 2,
        scale: 0.78 + Math.random() * 0.42
      }));

      for (const [mat, geoms] of buckets) {
        let totalVerts = 0;
        for (const g of geoms) totalVerts += g.attributes.position.count;

        const positions = new Float32Array(totalVerts * 3);
        const normals = new Float32Array(totalVerts * 3);
        let offset = 0;

        for (const g of geoms) {
          positions.set(g.attributes.position.array, offset * 3);
          normals.set(g.attributes.normal.array, offset * 3);
          offset += g.attributes.position.count;
          g.dispose();
        }

        const mergedGeo = new THREE.BufferGeometry();
        mergedGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

        const instMesh = new THREE.InstancedMesh(mergedGeo, mat, placements.length);
        placements.forEach((p, i) => {
          dummy.position.set(p.x, WL + 0.04, p.z); // Altura corregida a ras del agua
          dummy.rotation.set(0, p.ry, 0);
          dummy.scale.setScalar(p.scale);
          dummy.updateMatrix();
          instMesh.setMatrixAt(i, dummy.matrix);
        });

        instMesh.instanceMatrix.needsUpdate = true;
        instMesh.frustumCulled = false;
        instMesh.receiveShadow = true;
        scene.add(instMesh);
      }

      return flowerPositions.length;
    };

    // -------------------------------------------------------------------------
    // 4. DETALLES DE ORILLA (grupos de piedras y tronco caído con musgo)
    // -------------------------------------------------------------------------
    const buildShoreDetails = (bench) => {
      const a = bench.a;
      const fx = Math.sin(a), fz = Math.cos(a);
      const rx = Math.cos(a), rz = -Math.sin(a);
      const rockGeo = new THREE.DodecahedronGeometry(1, 0);

      // Pequeños grupos de piedras planas
      for (let i = 0; i < 7; i++) {
        const side = i % 2 ? 1 : -1;
        const d = 7 + (i % 3) * 2.2;
        const x = bench.x + fx * d + rx * side * (5 + (i % 3) * 1.5);
        const z = bench.z + fz * d + rz * side * (5 + (i % 3) * 1.5);
        const h = hAt(x, z);
        if (h < WL + 0.25 || h > WL + 3.5 || window.__inLake(x, z)) continue;

        const mainScale = 0.26 + Math.random() * 0.2;
        const rock = addStatic(rockGeo, i % 2 ? MAT.stoneA : MAT.stoneB, x, h + 0.06, z, mainScale, Math.random() * 6.28);
        rock.scale.y *= 0.45;

        // Piedra acompañante más pequeña
        const ox = x + (Math.random() - 0.5) * 0.55;
        const oz = z + (Math.random() - 0.5) * 0.55;
        const oh = hAt(ox, oz);
        if (oh > WL + 0.2 && !window.__inLake(ox, oz)) {
          const pebble = addStatic(rockGeo, MAT.stoneB, ox, oh + 0.04, oz, mainScale * 0.55, Math.random() * 6.28);
          pebble.scale.y *= 0.5;
        }
      }

      // Tronco caído con corteza, madera interior, rama rota y musgo
      const lx = bench.x - fx * 7 - rx * 5;
      const lz = bench.z - fz * 7 - rz * 5;
      const lh = hAt(lx, lz);
      if (lh > WL + 1 && !window.__inLake(lx, lz)) {
        const logGroup = new THREE.Group();
        logGroup.position.set(lx, lh + 0.11, lz);
        logGroup.rotation.y = a + 0.45;

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.2, 8), MAT.bark);
        body.rotation.z = Math.PI / 2;
        logGroup.add(body);

        // Extremos cortados más claros
        const capA = new THREE.Mesh(new THREE.CircleGeometry(0.095, 8), MAT.woodInner);
        capA.position.x = 1.105;
        capA.rotation.y = Math.PI / 2;
        logGroup.add(capA);

        const capB = new THREE.Mesh(new THREE.CircleGeometry(0.135, 8), MAT.woodInner);
        capB.position.x = -1.105;
        capB.rotation.y = -Math.PI / 2;
        logGroup.add(capB);

        // Rama rota sobresaliendo
        const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.55, 5), MAT.bark);
        stub.position.set(0.35, 0.16, 0.08);
        stub.rotation.set(0.35, 0, -0.55);
        logGroup.add(stub);

        // Parches de musgo sobre el tronco
        for (let m = 0; m < 3; m++) {
          const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), MAT.moss);
          moss.position.set(-0.55 + m * 0.55, 0.11, (m % 2 ? 1 : -1) * 0.03);
          moss.scale.set(1.4, 0.45, 0.9);
          logGroup.add(moss);
        }

        logGroup.traverse(o => {
          if (o.isMesh) {
            o.castShadow = false;
            o.receiveShadow = true;
          }
        });
        scene.add(logGroup);
      }
    };

    // -------------------------------------------------------------------------
    // EJECUCIÓN DE LA ESCENA
    // -------------------------------------------------------------------------
    if (parkBench) {
      const a = parkBench.a;
      const fx = Math.sin(a), fz = Math.cos(a);
      const rx = Math.cos(a), rz = -Math.sin(a);

      const treeCandidates = [
        { x: parkBench.x - fx * 5 + rx * 13, z: parkBench.z - fz * 5 + rz * 13 },
        { x: parkBench.x - fx * 10 - rx * 11, z: parkBench.z - fz * 10 - rz * 11 }
      ];

      treeCandidates.forEach((pos, idx) => {
        const h = hAt(pos.x, pos.z);
        if (h >= WL + 1.7 && h <= WL + 9 && !window.__inLake(pos.x, pos.z)) {
          buildParkTree(pos.x, h, pos.z, idx);
        }
      });

      for (const side of [-1, 1]) {
        const fxPos = parkBench.x + rx * side * 4.4 - fx * 1.8;
        const fzPos = parkBench.z + rz * side * 4.4 - fz * 1.8;
        const h = hAt(fxPos, fzPos);
        if (h >= WL + 1.25 && !window.__inLake(fxPos, fzPos)) {
          buildFlowerBed(fxPos, fzPos);
        }
      }

      buildShoreDetails(parkBench);
    }

    const totalFlowers = buildWaterLilies();
    window.__boisLakePostcard = { flowerCount: totalFlowers, treeArea: !!parkBench };
  } catch (e) {
    console.warn('v116: detalles de paisaje no disponibles', e);
  }
}