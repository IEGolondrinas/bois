// Prueba del guardado de la historia (v176): carga validada, copia de respaldo y recuperación ante datos dañados.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','js','22-story-state.js'),'utf8');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
const run=store=>{const w=[];const sb={localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)}},__bw:(a,b)=>w.push(a),console,JSON};
 vm.createContext(sb);vm.runInContext(src+';this.STORY=STORY;this.saveStory=saveStory;this.storyFlag=storyFlag',sb);sb.w=w;return sb};
const good=JSON.stringify({ch:5,seen:{a:1},flags:{ch4_complete:1,ch5_complete:1}});
{const st={bois_story:good},sb=run(st);t(sb.STORY.ch===5&&sb.STORY.flags.ch5_complete===1,'un guardado válido se carga igual que antes');
 sb.storyFlag('x',1);t(JSON.parse(st.bois_story).flags.x===1,'storyFlag guarda');t(st.bois_story_bak===good,'antes de sobrescribir se conserva la versión anterior como respaldo');}
{const st={bois_story:'{"ch":3,"flags":',bois_story_bak:good},sb=run(st);
 t(sb.STORY.flags.ch5_complete===1,'con el principal dañado se recupera el respaldo');t(sb.w.includes('22-story-state#recuperado'),'avisa en consola de la recuperación');}
{const st={bois_story:JSON.stringify({ch:1,flags:[1,2]}),bois_story_bak:good},sb=run(st);t(sb.STORY.flags.ch5_complete===1,'flags con tipo incorrecto se tratan como dañado');}
{const st={bois_story:'basura'},sb=run(st);t(Object.keys(sb.STORY.flags).length===0&&sb.STORY.ch===0,'sin respaldo y con basura, empieza limpio sin romper');
 sb.storyFlag('a',1);t(JSON.parse(st.bois_story).flags.a===1,'y vuelve a guardar bien');}
{const st={},sb=run(st);t(sb.STORY.ch===0,'partida nueva sin datos funciona');sb.storyFlag('a',1);sb.storyFlag('b',1);
 t(JSON.parse(st.bois_story_bak).flags.a===1&&!JSON.parse(st.bois_story_bak).flags.b,'el respaldo va una escritura por detrás');}
console.log('\n'+ok+' comprobaciones del guardado superadas.');
