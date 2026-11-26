// Prueba del capítulo VII (v166): solo se activa tras el VI, usa el guion lineal, guarda ch7_complete y respeta la conversación normal.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','js','36g-chapter7.js'),'utf8');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
const sb={THREE:{Vector3:function(x,y,z){this.x=x;this.y=y;this.z=z}},STORY:{flags:{}},S:{on:true,x:0,z:0},CIN:{on:false},AU:{},PR:{on:false},
 storyFlag(k,v){sb.STORY.flags[k]=v},saveStory(){},showMsg(m){sb.msgs.push(m)},msgs:[],played:[],normal:0,
 playCinematic(l,cb,o){sb.played.push({l,cb,o})},
 interactKatherin(){sb.normal++;return true},bgMission(){return{title:'base'}},bgTarget(){return{name:'base'}},console};
sb.window={__katherin:{visible:true,position:{x:1,y:0,z:1}}};sb.setInterval=()=>0;
vm.createContext(sb);vm.runInContext(src+';this.IK=interactKatherin;this.M=bgMission;this.T=bgTarget',sb);
t(sb.M().title==='base'&&sb.T().name==='base','antes del capítulo VI no cambia misión ni brújula');
sb.IK();t(sb.normal===1&&!sb.played.length,'antes del capítulo VI, Katherin conserva su conversación normal');
sb.STORY.flags.ch6_complete=1;
t(/Capítulo VII/.test(sb.M().title)&&sb.T().x===1,'tras el VI, la misión y la brújula apuntan a Katherin');
sb.S.x=20;sb.IK();t(sb.normal===2&&!sb.played.length,'lejos de Katherin no se dispara');
sb.S.x=2;sb.IK();t(sb.played.length===1&&sb.normal===2,'cerca de Katherin se lanza el capítulo VII');
const L=sb.played[0].l,tx=L.filter(x=>x.t).map(x=>x.t).join('\n');
t(/siempre estás a punto de recordar algo/.test(tx)&&/Yo también tengo que irme algún día/.test(tx),'el guion contiene las frases clave de la historia');
t(!/nicho vacío/.test(tx),'sin ch6_vacio no aparece la línea del nicho');
t(L.every(x=>x.pause||x.t),'todas las líneas son texto o pausa');
sb.played[0].cb();t(sb.STORY.flags.ch7_complete===1,'al terminar se guarda ch7_complete');
sb.IK();t(sb.normal===3,'tras completarlo vuelve la conversación normal');
sb.STORY.flags.ch7_complete=0;sb.STORY.flags.ch6_vacio=1;sb.IK();
t(/nicho vacío/.test(sb.played[1].l.map(x=>x.t||'').join()),'con ch6_vacio aparece la línea del nicho');
console.log('\n'+ok+' comprobaciones del capítulo VII superadas.');
// v168: libreta y charlas posteriores
{const k=fs.readFileSync(path.join(__dirname,'..','js','30-katherin.js'),'utf8'),n=fs.readFileSync(path.join(__dirname,'..','js','30f-notebook-pages.js'),'utf8');
 t(/f\.ch7_complete\s*\?\s*5/.test(k)&&/\n\s*5:\s*\[/.test(k),'Katherin tiene etapa 5 con charlas propias tras el capítulo VII');
 t(/id:'ch7'[\s\S]*?cond:\(\)=>!!STORY\.flags\.ch7_complete|id:'ch7'.*ch7_complete/.test(n),'la libreta tiene página del capítulo VII ligada a ch7_complete');}
