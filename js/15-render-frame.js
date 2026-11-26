/* BOIS.IO · 15-render-frame.js — Dibujo del frame (sustituye a 15-retro-postfx.js; el modo retro fue eliminado) */
function drawWorld(){if(typeof ch1Frame==='function')ch1Frame();const SC=PR.on&&PR.scene?PR.scene:scene;if(PR.on)R.toneMappingExposure=1;R.render(SC,cam)}
