/* Updater state stays in the main process; no credentials are shipped to clients. */
function createUpdates({app,updater,getSettings,onChange,isPortable=false}){
 const supported=app.isPackaged&&!isPortable;
 let state={status:supported?'idle':'unsupported',version:app.getVersion(),availableVersion:'',percent:0,message:supported?'Busca nuevas versiones en GitHub Releases.':isPortable?'Las actualizaciones automáticas requieren la versión instalada.':'Disponible en la versión instalada.'};
 let checking=false,downloading=false,disposed=false,scheduled,interval;
 const listeners=[];
 const set=patch=>{state={...state,...patch};onChange?.(state);};
 const listen=(event,handler)=>{updater.on(event,handler);listeners.push([event,handler]);};
 updater.autoDownload=false;updater.autoInstallOnAppQuit=true;updater.allowPrerelease=false;
 listen('checking-for-update',()=>set({status:'checking',message:'Buscando actualizaciones…'}));
 listen('update-not-available',()=>set({status:'current',availableVersion:'',message:'Tienes la versión más reciente.'}));
 listen('update-available',info=>{set({status:'available',availableVersion:info.version,message:'Hay una nueva versión disponible.'});if(getSettings().autoUpdate)void download();});
 listen('download-progress',p=>set({status:'downloading',percent:Math.round(p.percent),message:'Descargando actualización…'}));
 listen('update-downloaded',info=>{downloading=false;set({status:'ready',availableVersion:info.version,percent:100,message:'Lista para instalar. Se instalará al salir o cuando pulses «Instalar y reiniciar».'});});
 listen('error',()=>{downloading=false;set({status:'error',message:'No se pudo actualizar. Revisa tu conexión y vuelve a intentarlo.'});});
 async function check(){
  if(!supported||checking||downloading||state.status==='ready'||disposed)return state;
  checking=true;try{await updater.checkForUpdates();}catch{set({status:'error',message:'No se pudo buscar una actualización. Inténtalo de nuevo más tarde.'});}finally{checking=false;}return state;
 }
 async function download(){
  if(!supported||downloading||state.status!=='available'||disposed)return state;
  downloading=true;set({status:'downloading',percent:0,message:'Descargando actualización…'});
  try{await updater.downloadUpdate();}catch{downloading=false;set({status:'error',message:'No se pudo descargar la actualización. Vuelve a buscar para reintentar.'});}return state;
 }
 function preferencesChanged(){if(getSettings().autoUpdate){if(state.status==='available')void download();else if(state.status==='idle')void check();}}
 function install(){if(state.status!=='ready'||!supported)return false;app.emit('prepare-update');updater.quitAndInstall(false,true);return true;}
 if(supported){scheduled=setTimeout(()=>{if(getSettings().autoUpdate)void check();},8000);scheduled.unref?.();interval=setInterval(()=>{if(getSettings().autoUpdate)void check();},4*60*60*1000);interval.unref?.();}
 return {getState:()=>({...state}),check,download,install,preferencesChanged,dispose(){disposed=true;clearTimeout(scheduled);clearInterval(interval);for(const [event,handler]of listeners)updater.removeListener(event,handler);}};
}
module.exports=createUpdates;
