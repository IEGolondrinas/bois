window.addEventListener('load',()=>{(()=>{
 const layer=document.getElementById('menuModalLayer');
 const modals=['settingsModal','historyModal','creditsModal','exitModal'].map(id=>document.getElementById(id));
 const openModal=id=>{if(id==='settingsModal'&&typeof sync==='function')sync();/* v181: refleja cambios hechos en partida (N, U, clima) */modals.forEach(m=>m.classList.toggle('open',m.id===id));layer.classList.add('open');const close=layer.querySelector('#'+id+' .modalClose');close&&close.focus()};
 const closeModal=()=>{layer.classList.remove('open');modals.forEach(m=>m.classList.remove('open'))};
 document.getElementById('menuSettings').addEventListener('click',()=>openModal('settingsModal'));
 document.getElementById('menuHistory').addEventListener('click',()=>openModal('historyModal'));
 document.getElementById('menuCredits').addEventListener('click',()=>openModal('creditsModal'));
 document.getElementById('menuExit').addEventListener('click',()=>openModal('exitModal'));
 layer.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeModal));
 layer.addEventListener('click',e=>{if(e.target===layer)closeModal()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&layer.classList.contains('open')){e.preventDefault();closeModal()}});
 const q=document.getElementById('menuQuality'),sound=document.getElementById('menuSound'),nature=document.getElementById('menuNature');
 const sens=document.getElementById('menuSens'),wxs=document.getElementById('menuWeather'),vol=document.getElementById('menuVol'),bob=document.getElementById('menuBob'),invy=document.getElementById('menuInvY');
 const sync=()=>{if(sens&&typeof SENS==='number')sens.value=String(SENS);if(vol&&typeof BOIS_OPT==='object')vol.value=String(BOIS_OPT.vol);if(bob&&typeof BOIS_OPT==='object')bob.textContent=BOIS_OPT.bob?'Activado':'Desactivado';if(invy&&typeof BOIS_OPT==='object')invy.textContent=BOIS_OPT.invY?'Sí':'No';q.value=String(typeof qi==='number'?qi:2);if(wxs&&typeof WX!=='undefined'&&WX.st)wxs.value=String(WX.st.mode);sound.textContent=AU.on?'Activado':'Silenciado';nature.textContent=MU.on?'Activados':'Silenciados'};
 if(vol)vol.addEventListener('input',()=>{const v=Number(vol.value);if(Number.isFinite(v)&&typeof boisSetVol==='function'){boisSetVol(v);window.__saveBoisCfg?.()}});
 if(bob)bob.addEventListener('click',()=>{BOIS_OPT.bob=!BOIS_OPT.bob;sync();window.__saveBoisCfg?.();if(typeof showMsg==='function')showMsg(BOIS_OPT.bob?'Balanceo al caminar activado':'Balanceo al caminar desactivado')});
 if(invy)invy.addEventListener('click',()=>{BOIS_OPT.invY=!BOIS_OPT.invY;sync();window.__saveBoisCfg?.();if(typeof showMsg==='function')showMsg(BOIS_OPT.invY?'Eje vertical invertido':'Eje vertical normal')});
 if(sens)sens.addEventListener('input',()=>{const v=Number(sens.value);if(Number.isFinite(v)&&v>0){SENS=v;window.__saveBoisCfg?.()}});
 if(wxs)wxs.addEventListener('change',()=>{if(typeof WX!=='undefined'&&WX.setMode){const m=WX.setMode(Number(wxs.value));if(typeof showMsg==='function')showMsg('Clima: '+WX.names[m]+(m===0?' (cambia solo)':''));if(window.__boisCh6Wx)window.__boisCh6Wx.mine=false}});
 q.addEventListener('change',()=>{if(typeof setQ==='function'){setQ(Number(q.value),true);window.__saveBoisCfg?.()}});
 sound.addEventListener('click',()=>{AU.on=!AU.on;sync();window.__saveBoisCfg?.();if(typeof showMsg==='function')showMsg(AU.on?'Sonido activado':'Sonido silenciado')});
 nature.addEventListener('click',()=>{MU.on=!MU.on;sync();window.__saveBoisCfg?.();if(typeof showMsg==='function')showMsg(MU.on?'Sonidos de naturaleza activados':'Sonidos de naturaleza apagados')});
 document.getElementById('confirmExit').addEventListener('click',()=>{
   const hint=document.getElementById('exitHint');
   try{window.close()}catch(e){}
   hint.textContent='El navegador no permitió cerrar la pestaña automáticamente. Ya puedes cerrarla normalmente. ¡Gracias por jugar!';
 });
 sync();
})();});
