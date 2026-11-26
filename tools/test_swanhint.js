// v180 · el aviso junto a la banca debe incluir «E: hablar» cuando Katherin está cerca
const fs=require('fs'),path=require('path');let n=0;
const ok=(c,m)=>{if(!c){console.error('FALLA · '+m);process.exit(1)}n++;console.log('OK · '+m)};
const src=fs.readFileSync(path.join(__dirname,'../js/30e-swanbox.js'),'utf8');
const m=src.match(/function sbxHintText\([^)]*\)\s*\{[\s\S]*?\n\}/);ok(!!m,'existe sbxHintText');
const f=new Function(m[0]+';return sbxHintText')();
ok(/E: hablar/.test(f(true)),'con Katherin cerca el aviso incluye E: hablar');
ok(f(true).indexOf('E: hablar')<f(true).indexOf('B:'),'E: hablar va antes que B');
ok(/F: sentarte/.test(f(true)),'con Katherin cerca también incluye F: sentarte');
ok(/B: /.test(f(true)),'con Katherin cerca sigue mostrando B (caja)');
ok(f(false)==='Cajita de música · B: darle cuerda','sin Katherin cerca el aviso de la caja no cambia');
ok(/showMsg\(sbxHintText\(/.test(src),'el intervalo usa sbxHintText y no el texto fijo');
console.log('\n'+n+' comprobaciones del aviso junto a la banca superadas.');
