/* BOIS.IO · 35-freeze-matrices.js — Congelar matrices estáticas (una sola vez)
   (líneas 3693–3694 de BOIS_IO_v119_Optimizado.html) */
// Congelar matrices estáticas una sola vez: evita recorrer y actualizar toda la escena en cada frame.
scene.traverse(o=>{if(o.isMesh&&o!==water&&o!==sky&&!o.userData.dyn){o.updateMatrix();o.matrixAutoUpdate=false}});
