// Prueba de las cápsulas del tiempo de la libreta (v177): páginas que se abren con la fecha real.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','js','30f-notebook-pages.js'),'utf8');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
const make=(iso,flags)=>{const RD=Date;const [y,m,d]=iso.split('-').map(Number);
 class FD extends RD{constructor(...a){a.length?super(...a):super(y,m-1,d,12)}}
 const sb={STORY:{flags:flags||{gotNb:1}},bgCollected:()=>0,S:{on:false},CIN:{on:false},showMsg:()=>{},storyFlag:()=>{},setInterval:()=>0,console,Date:FD,__bw:()=>{}};
 sb.window=sb;vm.createContext(sb);vm.runInContext(src+';this.NTB_PAGES=NTB_PAGES;this.ntbPagesHTML=ntbPagesHTML;this.ntbOpen=ntbOpen;this.ntbToday=ntbToday',sb);return sb};
const P=sb=>sb.NTB_PAGES.find(p=>p.id==='cap20261122');
{const sb=make('2026-11-21');t(P(sb)&&P(sb).from==='2026-11-22','existe la cápsula del 22 de noviembre de 2026');t(!sb.ntbOpen(P(sb)),'un día antes sigue cerrada');t(!sb.ntbPagesHTML().includes('altibajos'),'y su texto no aparece en la libreta')}
{const sb=make('2026-11-22');t(sb.ntbOpen(P(sb)),'el 22 de noviembre se abre');t(sb.ntbPagesHTML().includes('yo del futuro'),'y aparece en la libreta con su texto')}
{const sb=make('2030-01-01');t(sb.ntbOpen(P(sb)),'años después sigue abierta')}
{const sb=make('2026-11-22',{});t(!sb.ntbOpen(P(sb)),'sin haber recogido la libreta no se abre')}
{const sb=make('2026-11-22');t(sb.NTB_PAGES.find(p=>p.id==='hoy').sort===100,'la página final «hoy» sigue siendo la última');
 const fut={id:'x',date:'8 de marzo de 2027',from:'2027-03-08',sort:3.9,sealed:true,cond:()=>true,t:'SECRETO'};sb.NTB_PAGES.push(fut);
 const h=sb.ntbPagesHTML();t(h.includes('Cápsula sellada')&&h.includes('marzo de 2027')&&!h.includes('SECRETO'),'una cápsula futura con sealed muestra «sellada» sin revelar el texto')}
{const sb=make('2026-11-22');const caps=sb.NTB_PAGES.filter(p=>p.from);
 t(caps.length===6,'hay 6 cápsulas (la de hoy y 5 selladas)');
 const fut=caps.filter(p=>p.sealed);t(fut.length===5&&fut.every(p=>p.from>'2026-11-22'),'las 5 futuras están selladas y con fecha posterior');
 const byDate=[...caps].sort((a,b)=>a.from<b.from?-1:1).map(p=>p.id),bySort=[...caps].sort((a,b)=>a.sort-b.sort).map(p=>p.id);
 t(JSON.stringify(byDate)===JSON.stringify(bySort),'el orden de la libreta sigue el orden de las fechas');
 t(caps.every(p=>p.sort<100),'todas quedan antes de la página final');
 const h=sb.ntbPagesHTML();t((h.match(/Cápsula sellada/g)||[]).length===5,'hoy la libreta muestra 5 candados');
 t(!h.includes('Veinticinco años')&&!h.includes('Hoy cumples 18'),'ningún texto futuro aparece antes de su fecha');
 t(caps.every(p=>!/Katherin|Exneyder|Steven|Julián|Golondrinas/.test(p.t)),'sin nombres propios, como el resto de la libreta')}
for(const [d,n] of [['2027-03-08',2],['2027-11-22',4],['2034-03-08',6]]){const sb=make(d);const open=sb.NTB_PAGES.filter(p=>p.from&&sb.ntbOpen(p)).length;t(open===n,d+': '+n+' cápsulas abiertas')}
{const sb=make('2034-03-08');const h=sb.ntbPagesHTML();t(h.includes('Gracias por llegar hasta aquí')&&!h.includes('Cápsula sellada'),'en 2034 todo se ha abierto y no queda ningún candado')}
console.log('\n'+ok+' comprobaciones de las cápsulas superadas.');
