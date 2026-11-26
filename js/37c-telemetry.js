/* BOIS.IO · 37c-telemetry.js — BOIS Telemetry / Modo desarrollador (v184)
   Graba mientras juegas (rendimiento, zonas lentas, tirones, memoria, errores, cambios de historia) y te deja
   dejar notas con una tecla. El informe se genera en texto para pegarlo en el chat o descargarlo.
   · F9  abre/cierra el panel (pausa el mundo, como el mapa) · F10 marca rápida · en táctil: botón «TEL»
   · Todo es local: no hay red ni envío automático. Solo observa; no cambia banderas, posición ni ajustes.
   · Núcleo sin DOM (window.BOIS_TELEMETRY) para poder probarlo en Node: ver tools/test_v184.js */
(function(){
 'use strict';
 const VER='v189',LS_ON='bois_telemetry_on',LS_SNAP='bois_telemetry';
 const HB=[6,9,12,15,18,22,27,33,50,100,Infinity];            // cubos del histograma de frame (ms)
 const CAP={samples:900,events:500,marks:200,errs:60,cells:900};
 const T={ver:VER,on:true,t0:performance.now(),id:Math.random().toString(36).slice(2,8),started:Date.now(),
  st:null,byState:{},cells:{},samples:[],events:[],marks:[],errs:{},flags:null,iv:{n:0,sum:0},
  base:null,max:{calls:0,tris:0,geo:0,tex:0,prog:0,heap:0},heap0:null,lastLow:-1e9,lastHitch:-1e9,hitches:0,
  lastQ:null,lastDpr:null,lastWx:null,lastTm:null,geoStep:0,heapStep:0,prev:null,gpu:null,fpsNow:0};
 T.reset=()=>{T.st=newStats();T.byState={};T.cells={};T.samples=[];T.events=[];T.marks=[];T.errs={};T.flags=null;T.iv={n:0,sum:0};
  T.base=null;T.max={calls:0,tris:0,geo:0,tex:0,prog:0,heap:0};T.heap0=null;T.hitches=0;T.geoStep=0;T.heapStep=0;T.t0=performance.now();T.started=Date.now()};
 function newStats(){return{n:0,sum:0,max:0,maxAt:null,o33:0,o50:0,h:HB.map(()=>0)}}
 T.st=newStats();
 window.BOIS_TELEMETRY=T;
 const now=()=>(performance.now()-T.t0)/1000;
 const r1=(v,n=1)=>Number.isFinite(v)?+v.toFixed(n):null;
 try{T.on=localStorage.getItem(LS_ON)!=='0'}catch(e){}

 // ---------- lectura del estado del juego (los const/let de otros scripts no son propiedades de window)
 function lite(){
  const o={on:false,cin:false,x:0,z:0,st:'—',paused:!!window.__boisGuideOverlayOpen||(typeof document!=='undefined'&&!!document.hidden)};
  try{if(typeof S!=='undefined'){o.on=!!S.on;o.x=S.x;o.z=S.z;o.sw=!!S.sw;o.fly=!!S.fly}}catch(e){}
  try{o.cin=typeof CIN!=='undefined'&&!!CIN.on}catch(e){}
  try{o.car=typeof CAR!=='undefined'&&!!CAR.on}catch(e){}
  try{o.pr=typeof PR!=='undefined'&&!!PR.on}catch(e){}
  o.st=o.cin?'cinemática':o.car?'auto':o.pr?'poolrooms':o.sw?'nadando':o.fly?'vuelo':window.__boisSitting?'sentado':'a pie';
  return o}
 function probe(){
  const o=lite();
  try{if(typeof S!=='undefined'){o.y=S.y;o.yaw=S.yaw}}catch(e){}
  try{if(typeof R!=='undefined'&&R.info){const i=R.info.render||{},m=R.info.memory||{};o.calls=i.calls;o.tris=i.triangles;o.geo=m.geometries;o.tex=m.textures;o.prog=R.info.programs?R.info.programs.length:null}}catch(e){}
  try{if(typeof qi!=='undefined'){o.q=qi;o.qn=typeof QS!=='undefined'&&QS[qi]?QS[qi].n:'Q'+qi}}catch(e){}
  try{if(typeof dpr!=='undefined')o.dpr=dpr;if(typeof dprMax!=='undefined')o.dprMax=dprMax}catch(e){}
  try{if(typeof WX!=='undefined'&&WX.st){o.wx=WX.st.mode;o.wxn=WX.names&&WX.names[WX.st.mode]}}catch(e){}
  try{if(typeof TM!=='undefined'){o.tm=TM.mode;o.tmn=typeof TNAMES!=='undefined'?TNAMES[TM.mode]:TM.mode}if(typeof tod!=='undefined')o.tod=tod}catch(e){}
  try{if(typeof STORY!=='undefined')o.ch=STORY.ch}catch(e){}
  try{if(performance.memory)o.heap=performance.memory.usedJSHeapSize/1e6}catch(e){}
  return o}
 T.lite=lite;T.probe=probe;

 // ---------- eventos y errores
 function ev(k,m,l){const p=l||lite();T.events.push({t:now(),k,m:String(m).slice(0,220),x:r1(p.x,0),z:r1(p.z,0)});if(T.events.length>CAP.events)T.events.shift()}
 function note(kind,msg){const key=kind+'|'+String(msg).slice(0,160);let e=T.errs[key];
  if(!e){if(Object.keys(T.errs).length>=CAP.errs)return;const p=lite();e=T.errs[key]={kind,msg:String(msg).slice(0,300),n:0,first:now(),last:0,x:r1(p.x,0),z:r1(p.z,0)}}
  e.n++;e.last=now()}
 T.ev=ev;T.note=note;
 const fmtArg=a=>{try{if(a instanceof Error)return a.message;if(a&&typeof a==='object'){const s=JSON.stringify(a);return s&&s.length>200?s.slice(0,200)+'…':s}return String(a)}catch(e){return'[objeto]'}};
 function hookConsole(){
  for(const k of['warn','error']){const o=console[k];if(!o||o.__tel)continue;
   const f=function(){try{if(T.on)note(k,Array.prototype.map.call(arguments,fmtArg).join(' '))}catch(e){}return o.apply(console,arguments)};f.__tel=1;console[k]=f}
  addEventListener('error',e=>{if(T.on)note('excepción',(e.message||fmtArg(e.error)||'error')+(e.filename?' · '+String(e.filename).split('/').pop()+':'+e.lineno:''))});
  addEventListener('unhandledrejection',e=>{if(T.on)note('promesa rechazada',fmtArg(e.reason))});
  try{const cv=document.getElementById('c');if(cv){cv.addEventListener('webglcontextlost',()=>{if(T.on)ev('webgl','contexto WebGL perdido')});cv.addEventListener('webglcontextrestored',()=>{if(T.on)ev('webgl','contexto WebGL recuperado')})}}catch(e){}}

 // ---------- cada frame (rAF propio: no toca el bucle del juego)
 function frame(ms,l){
  if(!T.on)return;l=l||lite();
  if(l.paused||(!l.on&&!l.cin)||!(ms>0)||ms>1000)return;
  const s=T.st;s.n++;s.sum+=ms;if(ms>s.max){s.max=ms;s.maxAt=[r1(l.x,0),r1(l.z,0),l.st]}
  if(ms>=33.4)s.o33++;if(ms>=50)s.o50++;
  for(let i=0;i<HB.length;i++)if(ms<=HB[i]){s.h[i]++;break}
  let b=T.byState[l.st];if(!b)b=T.byState[l.st]={n:0,sum:0,o33:0};b.n++;b.sum+=ms;if(ms>=33.4)b.o33++;
  const key=Math.floor(l.x/40)+','+Math.floor(l.z/40);let c=T.cells[key];
  if(!c){if(Object.keys(T.cells).length>=CAP.cells)c=null;else c=T.cells[key]={n:0,sum:0,o33:0}}
  if(c){c.n++;c.sum+=ms;if(ms>=33.4)c.o33++}
  T.iv.n++;T.iv.sum+=ms;
  if(ms>=120){T.hitches++;const t=now();if(t-T.lastHitch>1&&T.hitches<=80){T.lastHitch=t;ev('tirón',Math.round(ms)+' ms · '+l.st,l)}}}
 T.frame=frame;

 // ---------- muestreo cada 2 s (recursos, tendencias, cambios de ajustes e historia)
 function sample(){
  if(!T.on)return;const p=probe();if(p.paused)return;
  const fps=T.iv.n>0&&T.iv.sum>0?1000*T.iv.n/T.iv.sum:0;T.iv={n:0,sum:0};T.fpsNow=fps;
  const rec={t:r1(now(),0),fps:r1(fps,0),heap:r1(p.heap,0),geo:p.geo,tex:p.tex,calls:p.calls,tris:p.tris,x:r1(p.x,0),z:r1(p.z,0),st:p.st};
  if(p.on||p.cin){T.samples.push(rec);if(T.samples.length>CAP.samples)T.samples.shift()}
  const M=T.max;for(const k of['calls','tris','geo','tex','prog','heap'])if(p[k]>M[k])M[k]=p[k];
  if(T.heap0==null&&p.heap)T.heap0=p.heap;
  if(fps>0&&fps<24&&(p.on||p.cin)&&now()-T.lastLow>20){T.lastLow=now();ev('fps bajo',Math.round(fps)+' FPS · '+p.st+(p.qn?' · '+p.qn:''),p)}
  if(!T.base&&T.samples.length>=5&&p.geo!=null)T.base={geo:p.geo,tex:p.tex};
  if(T.base&&p.geo!=null){const g=Math.floor((p.geo-T.base.geo)/100),x=Math.floor((p.tex-T.base.tex)/40);const s=Math.max(g,x);
   if(s>T.geoStep){T.geoStep=s;ev('recursos crecen','geometrías '+T.base.geo+'→'+p.geo+' · texturas '+T.base.tex+'→'+p.tex+' (posible fuga)',p)}}
  if(p.heap&&p.heap>300){const s=Math.floor((p.heap-300)/100)+1;if(s>T.heapStep){T.heapStep=s;ev('memoria JS',Math.round(p.heap)+' MB en uso',p)}}
  if(T.lastDpr!=null&&p.dpr!=null&&Math.abs(p.dpr-T.lastDpr)>=.05)ev('resolución',r1(T.lastDpr,2)+'→'+r1(p.dpr,2)+(p.dpr<T.lastDpr?' (el juego bajó la resolución)':' (subió)'),p);
  if(p.dpr!=null)T.lastDpr=p.dpr;
  if(T.lastQ!=null&&p.q!==T.lastQ)ev('calidad',(T.lastQ)+'→'+p.qn,p);T.lastQ=p.q;
  if(T.lastWx!=null&&p.wx!==T.lastWx)ev('clima',String(p.wxn||p.wx),p);T.lastWx=p.wx;
  if(T.lastTm!=null&&p.tm!==T.lastTm)ev('hora',String(p.tmn||p.tm),p);T.lastTm=p.tm;
  try{if(typeof STORY!=='undefined'&&STORY.flags){const f=STORY.flags;
    if(T.flags){for(const k in f){const v=JSON.stringify(f[k]);if(T.flags[k]!==v){ev('historia',k+' = '+v,p);T.flags[k]=v}}}
    else{T.flags={};for(const k in f)T.flags[k]=JSON.stringify(f[k])}}}catch(e){}}
 T.sample=sample;

 // ---------- marcas y notas
 const CATS={bug:'🐞 Bug',visual:'🎨 Visual',rend:'🐢 Rendimiento',audio:'🔊 Audio',hist:'📖 Historia',idea:'💡 Idea',marca:'🔖 Marca'};
 T.cats=CATS;
 function mark(cat,text){
  const p=probe();const m={id:(T.marks.length?T.marks[T.marks.length-1].id:0)+1,t:r1(now(),0),hora:new Date().toLocaleTimeString('es-CO',{hour12:false}),cat:CATS[cat]?cat:'marca',note:String(text||'').slice(0,600),
   x:r1(p.x,1),y:r1(p.y,1),z:r1(p.z,1),yaw:r1(p.yaw,2),st:p.st,q:p.qn,fps:r1(T.fpsNow,0),ch:p.ch,wx:p.wxn,tm:p.tmn,calls:p.calls,tris:p.tris};
  T.marks.push(m);if(T.marks.length>CAP.marks)T.marks.shift();return m}
 T.mark=mark;

 // ---------- informe
 const pad=n=>String(n).padStart(2,'0'),mmss=s=>pad(Math.floor(s/60))+':'+pad(Math.floor(s%60));
 function pct(q){const s=T.st;let c=0;const t=s.n*q;for(let i=0;i<HB.length;i++){c+=s.h[i];if(c>=t)return HB[i]===Infinity?Math.round(s.max):HB[i]}return Math.round(s.max)}
 const cell=(k)=>{const[a,b]=k.split(',').map(Number);return'('+(a*40+20)+', '+(b*40+20)+')'};
 const esc=s=>String(s).replace(/\|/g,'¦').replace(/\n/g,' '),nf=v=>v!=null&&Number.isFinite(+v)?Number(v).toLocaleString('en-US'):'—';
 function gpu(){if(T.gpu)return T.gpu;try{const gl=R.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');T.gpu=e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}catch(e){T.gpu='n/d'}return T.gpu}
 function report(opt){
  opt=opt||{};const L=[],p=probe(),s=T.st,dur=now();
  L.push('# BOIS Telemetry · '+VER);
  L.push('Generado: '+new Date().toLocaleString('es-CO',{hour12:false})+' · sesión de '+mmss(dur)+' · telemetría '+(T.on?'activa':'DESACTIVADA'));
  L.push('');L.push('## Equipo');
  try{const n=navigator;L.push('- Navegador: '+n.userAgent);L.push('- GPU: '+gpu());
   L.push('- Pantalla: '+screen.width+'×'+screen.height+' · ventana '+innerWidth+'×'+innerHeight+' · núcleos '+(n.hardwareConcurrency||'?')+(n.deviceMemory?' · RAM ~'+n.deviceMemory+' GB':'')+' · táctil: '+(typeof touch!=='undefined'&&touch?'sí':'no'))}catch(e){L.push('- (sin datos del equipo)')}
  L.push('- Calidad: '+(p.qn||'?')+' · resolución efectiva '+(p.dpr!=null?r1(p.dpr,2):'?')+' de máx. '+(p.dprMax!=null?r1(p.dprMax,2):'?'));
  if(T.prev){if(T.prev.clean===false)L.push('- ⚠ La sesión anterior ('+new Date(T.prev.last).toLocaleString('es-CO',{hour12:false})+') terminó SIN cierre limpio: fallo, cierre forzado o el sistema mató la pestaña. Su último informe está al final.');
   else L.push('- Sesión anterior: cierre limpio ('+new Date(T.prev.last).toLocaleString('es-CO',{hour12:false})+')')}
  L.push('');L.push('## Rendimiento');
  if(!s.n)L.push('Sin frames medidos todavía (juega unos segundos con la partida iniciada).');
  else{const avg=s.sum/s.n;
   L.push('- Frames medidos: '+s.n+' ('+mmss(s.sum/1000)+' jugando) · FPS medio '+r1(1000/avg,1)+' · frame medio '+r1(avg,1)+' ms');
   L.push('- Frame p50 ≤ '+pct(.5)+' ms · p95 ≤ '+pct(.95)+' ms · p99 ≤ '+pct(.99)+' ms');
   L.push('- Frames ≥33 ms (menos de 30 FPS): '+r1(100*s.o33/s.n,2)+' % · ≥50 ms: '+r1(100*s.o50/s.n,2)+' % · tirones ≥120 ms: '+T.hitches);
   if(s.maxAt)L.push('- Peor frame: '+Math.round(s.max)+' ms en ('+s.maxAt[0]+', '+s.maxAt[1]+') · '+s.maxAt[2]);
   const st=Object.keys(T.byState).sort((a,b)=>T.byState[b].n-T.byState[a].n);
   if(st.length){L.push('');L.push('| Estado | Frames | FPS medio | ≥33 ms |');L.push('|---|---:|---:|---:|');
    for(const k of st){const b=T.byState[k];L.push('| '+k+' | '+b.n+' | '+r1(1000*b.n/b.sum,0)+' | '+r1(100*b.o33/b.n,1)+' % |')}}
   const cs=Object.keys(T.cells).filter(k=>T.cells[k].n>=60).sort((a,b)=>T.cells[b].sum/T.cells[b].n-T.cells[a].sum/T.cells[a].n).slice(0,8);
   if(cs.length){L.push('');L.push('Zonas más lentas (celdas de 40 m, centro x, z; ≥1 s de datos):');L.push('');L.push('| Centro | FPS medio | ≥33 ms | Frames |');L.push('|---|---:|---:|---:|');
    for(const k of cs){const c=T.cells[k];L.push('| '+cell(k)+' | '+r1(1000*c.n/c.sum,0)+' | '+r1(100*c.o33/c.n,1)+' % | '+c.n+' |')}}}
  const PL=window.__boisPoolroomsLoad;
  if(PL){L.push('');L.push('## Poolrooms · carga inicial');L.push('- Estado: '+(PL.state||'—')+' · total '+(PL.totalMs||0)+' ms');
   if(PL.error)L.push('- Error de carga: '+esc(PL.error));
   if(PL.stages&&PL.stages.length){L.push('');L.push('| Fase | ms | Detalle |');L.push('|---|---:|---|');for(const st of PL.stages){const detail=Object.keys(st).filter(k=>k!=='name'&&k!=='ms').map(k=>k+'='+st[k]).join(' · ');L.push('| '+st.name+' | '+r1(st.ms,2)+' | '+esc(detail)+' |')}}}
  try{const cp=window.__boisCh6&&window.__boisCh6.preloadPerf;if(cp&&cp.state!=='idle'){L.push('');L.push('## Capítulo VI · precarga');L.push('- Estado: '+cp.state+' · build '+(cp.ms||0)+' ms');if(cp.geo0!=null)L.push('- Recursos: geometrías '+cp.geo0+'→'+(cp.geo1==null?'—':cp.geo1)+' · texturas '+cp.tex0+'→'+(cp.tex1==null?'—':cp.tex1));}}catch(e){}
  L.push('');L.push('## Recursos');
  const M=T.max;L.push('- Máximos vistos: '+M.calls+' draw calls · '+nf(M.tris)+' triángulos · '+M.geo+' geometrías · '+M.tex+' texturas · '+M.prog+' programas'+(M.heap?' · heap JS '+Math.round(M.heap)+' MB':''));
  if(T.heap0&&p.heap)L.push('- Heap JS: '+Math.round(T.heap0)+' → '+Math.round(p.heap)+' MB');
  if(T.base)L.push('- Geometrías/texturas: '+T.base.geo+'/'+T.base.tex+' (a los 10 s) → '+p.geo+'/'+p.tex+' (ahora)');
  if(T.samples.length>1){const n=Math.min(14,T.samples.length),rows=[];for(let i=0;i<n;i++)rows.push(T.samples[Math.round(i*(T.samples.length-1)/(n-1))]);
   L.push('');L.push('| t | FPS | heap MB | geo | tex | calls | tris | (x, z) | estado |');L.push('|---:|---:|---:|---:|---:|---:|---:|---|---|');
   for(const r of rows)L.push('| '+mmss(r.t)+' | '+r.fps+' | '+(r.heap==null?'—':r.heap)+' | '+r.geo+' | '+r.tex+' | '+r.calls+' | '+r.tris+' | ('+r.x+', '+r.z+') | '+r.st+' |')}
  const es=Object.values(T.errs).sort((a,b)=>b.n-a.n);
  L.push('');L.push('## Errores y avisos de consola ('+es.length+' distintos)');
  if(!es.length)L.push('Ninguno registrado.');for(const e of es.slice(0,25))L.push('- ['+e.kind+'] ×'+e.n+' · primera vez a '+mmss(e.first)+' cerca de ('+e.x+', '+e.z+'): '+esc(e.msg));
  L.push('');L.push('## Notas y marcas ('+T.marks.length+')');
  if(!T.marks.length)L.push('Ninguna.');
  for(const m of T.marks.slice(-60))L.push('- #'+m.id+' · '+CATS[m.cat]+' · '+m.hora+' (t '+mmss(m.t)+') · pos ('+m.x+', '+m.y+', '+m.z+') yaw '+m.yaw+' · '+m.st+' · '+m.q+' · '+m.fps+' FPS · cap '+m.ch+' · clima '+m.wx+' · hora '+m.tm+' · '+nf(m.calls)+' calls/'+nf(m.tris)+' tris'+(m.note?'\n  > '+esc(m.note):' · (sin texto)'));
  L.push('');L.push('## Cronología (últimos '+Math.min(80,T.events.length)+' de '+T.events.length+')');
  if(!T.events.length)L.push('Sin eventos.');for(const e of T.events.slice(-80))L.push('- '+mmss(e.t)+' · '+e.k+' · '+esc(e.m)+(e.k==='historia'?'':' · ('+e.x+', '+e.z+')'));
  try{if(typeof STORY!=='undefined'&&STORY.flags){const ks=Object.keys(STORY.flags);L.push('');L.push('## Historia (capítulo '+STORY.ch+', '+ks.length+' banderas)');L.push(ks.map(k=>k+'='+JSON.stringify(STORY.flags[k])).join(' · ').slice(0,2500))}}catch(e){}
  let out=L.join('\n');
  if(out.length>26000)out=out.slice(0,26000)+'\n… (informe recortado)';
  if(!opt.noPrev&&T.prev&&T.prev.clean===false&&T.prev.report)out+='\n\n---\n## Último informe de la sesión anterior (terminó sin cierre limpio)\n'+String(T.prev.report).slice(0,9000);
  return out}
 T.report=report;

 // ---------- persistencia (para poder diagnosticar cierres bruscos)
 let __telClosed=false;
 function save(clean){if(!T.on&&!clean)return;try{localStorage.setItem(LS_SNAP,JSON.stringify({ver:VER,id:T.id,start:T.started,last:Date.now(),clean:!!clean,report:report({noPrev:true}).slice(0,18000)}))}catch(e){}}
 T.save=save;
 try{const raw=localStorage.getItem(LS_SNAP);if(raw){const o=JSON.parse(raw);if(o&&typeof o==='object'&&o.id!==T.id)T.prev={clean:o.clean!==false,last:+o.last||0,report:typeof o.report==='string'?o.report:''}}}catch(e){}
 T.setOn=v=>{T.on=!!v;try{localStorage.setItem(LS_ON,T.on?'1':'0')}catch(e){}if(T.on)ev('telemetría','activada')};
 T.clear=()=>{T.reset();ev('telemetría','sesión vaciada')};

 // ---------- panel (se crea la primera vez que se abre)
 const P={open:false,el:null,prevOverlay:false,liveT:0,clearArmed:false,clearT:0};
 function css(){const s=document.createElement('style');s.textContent='#boisTel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99991;width:min(560px,calc(100vw - 20px));max-height:calc(100vh - 20px);overflow:auto;display:none;padding:14px 16px;background:rgba(8,12,15,.94);border:1px solid rgba(207,225,219,.28);box-shadow:0 14px 44px rgba(0,0,0,.45);color:#e8ece8;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}#boisTel.on{display:block}#boisTel .tH{display:flex;align-items:center;gap:10px;margin-bottom:8px}#boisTel .tH b{font-size:14px;letter-spacing:.5px}#boisTel .tH span{opacity:.6;flex:1}#boisTel button,#boisTel select,#boisTel textarea,#boisTel input{font:inherit;color:#e8ece8;background:rgba(255,255,255,.08);border:1px solid rgba(224,190,125,.4);border-radius:0;padding:6px 9px}#boisTel button{cursor:pointer}#boisTel button:hover{background:rgba(224,190,125,.18)}#boisTel textarea{width:100%;box-sizing:border-box;min-height:58px;margin:6px 0;resize:vertical}#boisTel .tLive{padding:7px 9px;margin-bottom:8px;background:rgba(255,255,255,.05);white-space:pre-wrap}#boisTel .tBtns{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#boisTel .tM{display:flex;gap:6px;margin:4px 0;align-items:center}#boisTel .tM small{opacity:.65;white-space:nowrap}#boisTel .tM input{flex:1;min-width:0}#boisTel .tHint{opacity:.6;margin:8px 0 0}#boisTelBtn{position:fixed;left:8px;bottom:8px;z-index:99989;display:none;padding:6px 9px;font:11px ui-monospace,monospace;color:#e8ece8;background:rgba(8,12,15,.55);border:1px solid rgba(207,225,219,.3);opacity:.55}';document.head.appendChild(s)}
 function build(){
  if(P.el)return;css();const el=document.createElement('div');el.id='boisTel';el.setAttribute('role','dialog');el.setAttribute('aria-label','BOIS Telemetry');
  el.innerHTML='<div class="tH"><b>BOIS Telemetry</b><span>'+VER+'</span><button data-a="close" aria-label="Cerrar">×</button></div><div class="tLive" id="tLive"></div>'+
   '<select id="tCat">'+Object.keys(CATS).filter(k=>k!=='marca').map(k=>'<option value="'+k+'">'+CATS[k]+'</option>').join('')+'</select>'+
   '<textarea id="tNote" placeholder="¿Qué viste o qué pasó? Se guarda con posición, hora, FPS y estado."></textarea>'+
   '<div class="tBtns"><button data-a="note">📝 Guardar nota aquí</button></div><div id="tMarks"></div>'+
   '<div class="tBtns"><button data-a="copy">📋 Copiar informe</button><button data-a="dl">⬇ Descargar .md</button><button data-a="view">👁 Ver informe</button><button data-a="toggle" id="tTog"></button><button data-a="clear">🗑 Vaciar sesión</button></div>'+
   '<textarea id="tOut" readonly hidden style="min-height:180px"></textarea><p class="tHint">F9 cierra · F10 marca rápida mientras juegas · Todo se queda en este equipo hasta que tú copies el informe.</p>';
  document.body.appendChild(el);P.el=el;
  el.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-a]');if(b)act(b.dataset.a)});
  el.addEventListener('input',e=>{const t=e.target,id=+t.dataset.mn;if(id){const m=T.marks.find(x=>x.id===id);if(m)m.note=t.value.slice(0,600)}});
  el.addEventListener('change',e=>{const t=e.target,id=+t.dataset.mc;if(id){const m=T.marks.find(x=>x.id===id);if(m&&CATS[t.value])m.cat=t.value}})}
 const $q=id=>document.getElementById(id);
 function marksUI(){const box=$q('tMarks');if(!box)return;box.textContent='';
  for(const m of T.marks.slice(-8).reverse()){const row=document.createElement('div');row.className='tM';
   const sm=document.createElement('small');sm.textContent='#'+m.id+' ('+Math.round(m.x)+', '+Math.round(m.z)+')';
   const sel=document.createElement('select');sel.dataset.mc=m.id;for(const k in CATS){const o=document.createElement('option');o.value=k;o.textContent=CATS[k];if(k===m.cat)o.selected=true;sel.appendChild(o)}
   const inp=document.createElement('input');inp.dataset.mn=m.id;inp.value=m.note;inp.placeholder='nota…';row.append(sm,sel,inp);box.appendChild(row)}}
 function live(){const l=$q('tLive');if(!l)return;const p=probe();
  l.textContent=(T.on?'● grabando':'○ pausada')+' · '+mmss(now())+' · '+Math.round(T.fpsNow)+' FPS · '+(p.qn||'?')+'\n'+p.st+' · pos ('+r1(p.x,0)+', '+r1(p.z,0)+') · cap '+p.ch+' · '+(p.calls!=null?p.calls+' calls · '+nf(p.tris)+' tris · ':'')+(p.heap?Math.round(p.heap)+' MB':'')+'\nMarcas: '+T.marks.length+' · errores distintos: '+Object.keys(T.errs).length+' · tirones: '+T.hitches;
  const tg=$q('tTog');if(tg)tg.textContent=T.on?'⏸ Pausar telemetría':'▶ Reanudar telemetría'}
 function toast(m){try{typeof showMsg==='function'&&showMsg(m)}catch(e){}}
 async function copy(txt){
  try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(txt);return true}}catch(e){}
  try{const o=$q('tOut');o.hidden=false;o.value=txt;o.select();const ok=document.execCommand('copy');return ok}catch(e){return false}}
 function act(a){
  if(a==='close')return close();
  if(a==='note'){const t=$q('tNote'),c=$q('tCat');const m=mark(c.value,t.value);t.value='';marksUI();live();toast('📝 Nota #'+m.id+' guardada')}
  else if(a==='copy'){const txt=report();copy(txt).then(ok=>{if(ok){toast('📋 Informe copiado ('+Math.round(txt.length/1000)+' mil caracteres) · pégalo en el chat')}else{const o=$q('tOut');o.hidden=false;o.value=txt;o.select();toast('Selecciona el texto y copia con Ctrl+C')}})}
  else if(a==='view'){const o=$q('tOut');o.hidden=!o.hidden;if(!o.hidden){o.value=report();o.scrollTop=0}}
  else if(a==='dl'){try{const d=new Date(),n='bois_telemetria_'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'_'+pad(d.getHours())+pad(d.getMinutes())+'.md';
    const u=URL.createObjectURL(new Blob([report()],{type:'text/markdown'})),a2=document.createElement('a');a2.href=u;a2.download=n;document.body.appendChild(a2);a2.click();a2.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('⬇ Informe descargado')}catch(e){toast('No se pudo descargar')}}
  else if(a==='toggle'){T.setOn(!T.on);live()}
  else if(a==='clear'){const btn=P.el&&P.el.querySelector('[data-a="clear"]');if(!P.clearArmed){P.clearArmed=true;clearTimeout(P.clearT);if(btn)btn.textContent='⚠ ¿Confirmar vaciado?';P.clearT=setTimeout(()=>{P.clearArmed=false;if(btn)btn.textContent='🗑 Vaciar sesión'},3500)}else{P.clearArmed=false;clearTimeout(P.clearT);if(btn)btn.textContent='🗑 Vaciar sesión';T.clear();marksUI();live();toast('🗑 Sesión vaciada')}}}
 function releaseKeys(){try{if(typeof keys!=='undefined')for(const k in keys)keys[k]=0;if(typeof jumpQ!=='undefined')jumpQ=false}catch(e){}}
 function open(){
  build();if(P.open)return;P.open=true;P.prevOverlay=!!window.__boisGuideOverlayOpen;
  window.__boisGuideOverlayOpen=true;                                      // pausa el mundo, igual que el mapa y el diario
  if(document.pointerLockElement){window.__boisGuideIgnoreNextUnlock=true;document.exitPointerLock()}
  releaseKeys();P.el.classList.add('on');marksUI();live();P.liveT=setInterval(live,500)}
 function close(){
  if(!P.open)return;P.open=false;P.clearArmed=false;clearTimeout(P.clearT);clearInterval(P.liveT);P.el.classList.remove('on');releaseKeys();
  const cb=P.el&&P.el.querySelector('[data-a="clear"]');if(cb)cb.textContent='🗑 Vaciar sesión';
  let g=false;try{g=!!(BOIS_GUIDE.journal||BOIS_GUIDE.map)}catch(e){}
  window.__boisGuideOverlayOpen=g||P.prevOverlay;
  try{if(S.on&&!touch&&!window.__boisGuideOverlayOpen)document.getElementById('c').requestPointerLock()}catch(e){}}
 const toggle=()=>P.open?close():open();
 function quick(){const m=mark('marca','');toast('🔖 Marca #'+m.id+' guardada · F9 para añadir texto')}
 T.open=open;T.close=close;T.toggle=toggle;T.quick=quick;T._panel=P;

 // ---------- arranque
 function start(){
  hookConsole();
  addEventListener('keydown',e=>{
   if(e.code==='F9'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();toggle();return}
   if(e.code==='F10'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();if(!P.open)quick();return}
   if(P.open){if(e.code==='Escape'){e.preventDefault();close()}e.stopPropagation()}   // el juego no debe reaccionar a lo que escribes
  },true);
  addEventListener('keyup',e=>{if(P.open)e.stopPropagation()},true);
  addEventListener('keypress',e=>{if(P.open)e.stopPropagation()},true);
  try{if(typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches){css();const b=document.createElement('button');b.id='boisTelBtn';b.textContent='TEL';b.style.display='block';b.addEventListener('click',toggle);document.body.appendChild(b)}}catch(e){}
  let last=performance.now();
  const loop=t=>{try{frame(t-last)}catch(e){}last=t;requestAnimationFrame(loop)};requestAnimationFrame(loop);
  setInterval(()=>{try{sample()}catch(e){}},2000);
  setInterval(()=>{try{save(false)}catch(e){}},20000);
  addEventListener('pagehide',()=>{try{__telClosed=true;save(true)}catch(e){}});
  addEventListener('pageshow',()=>{__telClosed=false});
  document.addEventListener('visibilitychange',()=>{try{if(document.hidden&&!__telClosed)save(false)}catch(e){}});
  if(T.prev&&T.prev.clean===false)ev('sesión anterior','terminó sin cierre limpio');
  ev('telemetría','sesión iniciada · '+VER);
  save(false)}                                                  // marca de «sesión en curso»: si la pestaña muere, la próxima vez se sabrá
 // v189: la telemetría (grabación, guardado cada 20 s, F9/F10 y botón TEL) solo corre en modo desarrollador.
if(window.BOIS_DEV!==false){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()}
})();
