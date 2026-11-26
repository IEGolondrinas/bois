// Prueba del audio de los Poolrooms y del capítulo V (v152): ambiente bajo, sin errores y sin nodos huérfanos.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const pr=fs.readFileSync(path.join(root,'js','18-poolrooms.js'),'utf8'),c5=fs.readFileSync(path.join(root,'js','36c-chapter5.js'),'utf8');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
// ---- 1) ejecución real de ambOn / ambOff / dripSnd con un AudioContext simulado
const a=pr.indexOf('const A={nodes'),b=pr.indexOf('// ---------- Iluminación dinámica');
const log={targets:[],started:0,stopped:0,created:0};
const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(v){log.targets.push(v)}});
const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),pan:param(),delayTime:{value:0},Q:{value:0},start(){log.started++},stop(){log.stopped++},set onended(f){}});
const ctx={currentTime:0,sampleRate:44100,createGain:()=>{log.created++;return node()},createBiquadFilter:node,createDelay:node,createOscillator:node,createStereoPanner:node,createBufferSource:node,destination:{}};
const sb={AU:{ctx,on:true,nb:{}},setTimeout:(f)=>f(),Math,S:{x:0,z:0,on:true},P:{on:true},document:{hidden:false},window:{}};vm.createContext(sb);
vm.runInContext(pr.slice(a,b)+';this.A=A;this.PRV=PRV;this.ambOn=ambOn;this.ambOff=ambOff;this.dripSnd=dripSnd;',sb);
t(sb.PRV>0&&sb.PRV<=.2,'volumen maestro del ambiente ≤ .2 (antes .55): PRV='+sb.PRV);
sb.ambOn();t(!!sb.A.nodes,'el ambiente se crea sin errores');
t(Math.max(...log.targets)<=.2,'el volumen objetivo al entrar es bajo ('+Math.max(...log.targets)+')');
t(log.started===4,'zumbido (2 senos), ruido y vaivén lento arrancan ('+log.started+' fuentes)');
for(let i=0;i<20;i++)sb.dripSnd();t(true,'20 gotas seguidas sin errores');
sb.ambOn();const c0=log.created;sb.ambOn();t(log.created===c0,'llamar dos veces a ambOn no duplica el ambiente');
const before=log.stopped;sb.ambOff();t(log.stopped-before>=4&&sb.A.nodes===null,'al salir se detienen zumbido, ruido y vaivén lento');
sb.AU.on=false;sb.dripSnd();t(true,'con el sonido apagado (N) la gota no suena ni falla');
// ---- 2) valores concretos (para que nadie los vuelva a subir sin darse cuenta)
t(/\.026\/\(1\+k\*1\.9\)/.test(pr),'la gota llega como máximo a .026 (antes .09)');
t(/nf\.frequency\.value=320/.test(pr)&&/ng\.gain\.value=\.16/.test(pr),'rumor de agua más grave (320 Hz) y bajo (.16; antes 520 Hz y .5)');
t(/og\.gain\.value=\.0045/.test(pr)&&!/o2\.type='triangle'/.test(pr),'zumbido más bajo y sin el triángulo áspero');
t(/auHit\(900,\.26,\.06,'bandpass'\)/.test(pr)&&/auHit\(520,\.14,\.07,'lowpass'\)/.test(pr),'pasos más suaves (agua y suelo seco)');
t(/CIN\.on\)\?\.45:1/.test(pr)&&/PRV\*duck/.test(pr),'el ambiente baja al 45 % durante las cinemáticas y sigue a la tecla N');
// ---- 3) capítulo V
const sv=+(/const SV=\.(\d+)/.exec(c5)||[])[1];t(sv>0&&sv<=40,'acentos del capítulo V ≤ .04 (SV=.0'+sv+')');
t(/beaconOff\(\)/.test(c5)&&/__boisCh5Exit=.*beaconOff\(\)/.test(c5),'la señal de la luz se apaga al salir de los Poolrooms');
t(/'Recuerdo '\+n\+'\/3/.test(c5)&&/roomsN\(\)\+'\/3\)/.test(c5),'el progreso n/3 aparece al terminar una sala y en las pistas');
t(/userData\.fade/.test(c5)&&/refresh\(true\)/.test(c5),'las luces azules se desvanecen (≈1 s) al examinarlas');
t(/hintAt=performance\.now\(\)\+14000/.test(c5),'la pista de distancia ya no se repite cada 9 s (ahora 14 s)');
t(c5.includes('las torres gemelas te esperan')&&/ch5_complete/.test(c5)&&['ch5_entered','ch5_empty','ch5_small','ch5_sky','ch5_photo'].every(f=>c5.includes(f)),'banderas y mensaje final del capítulo V conservados (el capítulo VI sigue desbloqueándose)');
console.log('\n'+ok+' comprobaciones del audio de Poolrooms / capítulo V superadas.');
