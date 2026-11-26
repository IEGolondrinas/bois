// Prueba del capítulo IV remasterizado (v149): fragmentos opcionales, geometría de interacción y compatibilidad.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','js','31-chapter4.js'),'utf8');
const a=src.indexOf('const CH4_FRAGMENTS'),b=src.indexOf('\ntry {');
if(a<0||b<0)throw new Error('faltan marcadores de fragmentos');
let ok=0;const t=(c,m)=>{if(!c){console.error('FALLO',m);process.exit(1)}console.log('OK ·',m);ok++};
const sb={};vm.createContext(sb);vm.runInContext(src.slice(a,b),sb);
const FR=vm.runInContext('CH4_FRAGMENTS',sb);
t(FR.length===4&&new Set(FR.map(f=>f.id)).size===4,'cuatro fragmentos con identificadores únicos');
t(FR.every(f=>f.lines.length>=3&&f.lines.every(l=>l.t&&l.t.length>3)),'cada fragmento tiene texto completo');
// puntos de interacción originales (locales) y su radio
const OLD=[['puerta',0,10.2,4.2],['cuaderno',-5,2.6,3.0],['pizarra',0,-8.5,3.6],['ventana',8,-8.8,4.0]];
for(const f of FR){
  t(Math.abs(f.loc[0])<13.2&&Math.abs(f.loc[1])<11.2,'«'+f.name+'» está dentro del edificio');
  for(const [n,x,z,r] of OLD)t(Math.hypot(f.loc[0]-x,f.loc[1]-z)>r+.5,'«'+f.name+'» no invade la zona de '+n);
}
for(let i=0;i<FR.length;i++)for(let j=i+1;j<FR.length;j++)t(Math.hypot(FR[i].loc[0]-FR[j].loc[0],FR[i].loc[1]-FR[j].loc[1])>FR[i].r+FR[j].r-1.5,'«'+FR[i].name+'» y «'+FR[j].name+'» no se solapan');
const near=vm.runInContext('ch4FragmentNear',sb),count=vm.runInContext('ch4FragmentCount',sb);
const fl={};t(near(fl,-10,-9.2).id==='shelf','se detecta la estantería junto a ella');
t(near(fl,0,0)===null,'en el centro del salón no hay fragmento');
fl.ch4_f_shelf=1;t(near(fl,-10,-9.2)===null,'un fragmento ya encontrado no se repite');
t(count(fl)===1,'el contador cuenta lo encontrado');
for(const f of FR)fl['ch4_f_'+f.id]=1;t(count(fl)===4,'se pueden reunir los cuatro');
// compatibilidad con los capítulos siguientes: las banderas de la historia se conservan y los fragmentos no las exigen
for(const k of ['ch4_entered','ch4_notebook','ch4_chalk','ch4_complete'])t(src.includes("'"+k+"'")||src.includes('.'+k),'se conserva la bandera '+k);
const others=['js/36c-chapter5.js','js/36e-chapter6.js','js/26-guide-map.js'].map(f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8')).join('\n');
t(!/ch4_f_|ch4_all|ch4_frags/.test(others),'ningún capítulo posterior depende de los fragmentos opcionales');
t(/window\.__boisChapter4Building\s*=\s*chapter4/.test(src)&&/__boisChapter4Tick/.test(src),'se conservan los ganchos públicos del capítulo');
t(/ch4FragmentCount\(STORY\.flags\)/.test(src)&&/CH4_FRAGMENTS\.length/.test(src),'la ventana reacciona si reuniste todos los fragmentos');
console.log('\n'+ok+' comprobaciones del capítulo IV superadas.');
