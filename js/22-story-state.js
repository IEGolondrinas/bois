/* BOIS.IO · 22-story-state.js — Estado de la historia STORY y autoguardado
   (líneas 2236–2242 de BOIS_IO_v119_Optimizado.html) */
// ===== STORY PROGRESS (auto-save) =====
const STORY={ch:0,seen:{},flags:{}};
// v176: carga validada con copia de respaldo. Si el guardado principal está dañado o incompleto, se recupera 'bois_story_bak'
// (la versión anterior a la última escritura) en vez de empezar de cero y sobrescribir el progreso.
let __storyGood=null;
function __storyParse(raw){try{const s=raw?JSON.parse(raw):null;if(s&&typeof s==='object'&&s.flags&&typeof s.flags==='object'&&!Array.isArray(s.flags))return s}catch(e){}return null}
function storyChapterSync(){
 try{
  const f=STORY.flags||{};
  const allPhotos=typeof PHOTOS!=='undefined'&&Array.isArray(PHOTOS)&&PHOTOS.length>0&&PHOTOS.every(p=>!!f['photo_'+p.id]);
  let ch=STORY.ch|0;
  if(f.awake||f.gotCam||f.gotNb)ch=Math.max(ch,1);
  if(f.ch1_vista||f.ch2_intro||Object.keys(f).some(k=>k.indexOf('photo_')===0&&k!=='photo_puppy'&&f[k]))ch=Math.max(ch,2);
  if(allPhotos||f.ch2_complete||f.ch3_arrived||f.glasses||f.metKatherin||f.photo_puppy||f.swanbox)ch=Math.max(ch,3);
  if(f.ch4_entered||f.ch4_notebook||f.ch4_chalk||f.ch4_complete)ch=Math.max(ch,4);
  if(f.ch5_entered||f.ch5_small||f.ch5_empty||f.ch5_sky||f.ch5_photo||f.ch5_complete)ch=Math.max(ch,5);
  if(f.ch6_started||f.ch6_complete)ch=Math.max(ch,6);
  if(f.ch7_started||f.ch7_complete)ch=Math.max(ch,7);
  STORY.ch=ch;
 }catch(e){}
}
try{
 let raw=localStorage.getItem('bois_story'),s=__storyParse(raw);
 if(!s&&raw){const bak=localStorage.getItem('bois_story_bak'),sb=__storyParse(bak);
  if(sb){s=sb;raw=bak;typeof __bw==='function'&&__bw('22-story-state#recuperado','guardado principal dañado: se restauró la copia de respaldo')}}
 if(s){STORY.ch=+s.ch||0;STORY.seen=(s.seen&&typeof s.seen==='object')?s.seen:{};STORY.flags=s.flags;storyChapterSync();__storyGood=raw}
}catch(e){typeof __bw==='function'&&__bw('22-story-state#1',e)}
function saveStory(){try{
 storyChapterSync();
 const cur=JSON.stringify({ch:STORY.ch,seen:STORY.seen,flags:STORY.flags});
 if(__storyGood&&__storyGood!==cur)try{localStorage.setItem('bois_story_bak',__storyGood)}catch(e){}
 localStorage.setItem('bois_story',cur);__storyGood=cur}catch(e){typeof __bw==='function'&&__bw('22-story-state#2',e)}}
function storyFlag(k,v){STORY.flags[k]=v;saveStory()}


