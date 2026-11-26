// Prueba del capítulo III remasterizado (v148): diálogo por etapas, contexto y primer encuentro.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','js','30-katherin.js'),'utf8');
const a=Math.min(...['function canInteractWithKatherin(','function katherinContext('].map(k=>src.indexOf(k)).filter(i=>i>=0)),b=src.search(/try\s*\{\s*buildKatherin\(\)/);
if(a<0||b<0)throw new Error('no se encontró el bloque de conversación');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
const sb={THREE:{Vector3:function(x,y,z){this.x=x;this.y=y;this.z=z}},STORY:{flags:{}},PC:{night:0},WX:{st:{rain:0}},tod:0,
  S:{on:true,x:0,z:0},CIN:{on:false},storyFlag(k,v){sb.STORY.flags[k]=v},showMsg(){},katherinCh3Pad(){},played:[],
  playCinematic(l,cb){sb.played.push(l)}};
sb.window={__katherin:{visible:true,position:{x:1,y:0,z:1}}};
vm.createContext(sb);vm.runInContext(src.slice(a,b),sb);
const texts=l=>l.filter(x=>x.t).map(x=>x.t);
t(sb.interactKatherin()===true && sb.STORY.flags.metKatherin===1,'el primer encuentro marca metKatherin');
t(sb.played[0].some(x=>x.t==='Me llamo Katherin.'),'el guion del primer encuentro incluye la presentación de Katherin');
const seen=new Set();
for(let i=0;i<3;i++){sb.interactKatherin();seen.add(texts(sb.played[sb.played.length-1]).join('|'))}
t(seen.size===3,'tres visitas seguidas dan conversaciones distintas');
t(sb.STORY.flags.kath_talks===3,'el contador de visitas se guarda');
for(const [st,fl] of [[1,{}],[2,{ch4_complete:1}],[3,{ch4_complete:1,ch5_complete:1}],[4,{ch6_complete:1}],[5,{ch7_complete:1}]]){
  sb.STORY.flags={metKatherin:1,...fl};t(sb.katherinStage()===st,'etapa '+st+' según el progreso')}
sb.STORY.flags={metKatherin:1,kath_talks:0};sb.WX.st.rain=.8;sb.played.length=0;sb.interactKatherin();
t(texts(sb.played[0]).some(x=>x.includes('lluvia')),'con lluvia aparece el comentario de la lluvia');
sb.WX.st.rain=0;sb.PC.night=.9;sb.STORY.flags.kath_talks=0;sb.played.length=0;sb.interactKatherin();
t(texts(sb.played[0]).some(x=>x.includes('noche')||x.includes('luz')),'de noche aparece el comentario nocturno');
let bad=0;for(const st of Object.values(vm.runInContext('KATHERIN_TALKS',sb)))for(const p of st)for(const l of p)if(!l.t||l.t.length<2)bad++;
t(bad===0,'ninguna línea de diálogo vacía');
sb.CIN.on=true;t(sb.interactKatherin()===false,'no interrumpe una cinemática en curso');
console.log('\n'+ok+' comprobaciones de Katherin superadas.');
