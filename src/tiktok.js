const fs=require('node:fs');const path=require('node:path');
const {spawn}=require('node:child_process');const readline=require('node:readline');const {createPublicOverlay}=require('./public-overlay');const {ensureTunnelClient}=require('./tunnel-client');
async function probePublicURL(url){try{const response=await fetch(new URL('snapshot.json',url),{signal:AbortSignal.timeout(8000),cache:'no-store'});if(!response.ok)return false;const data=await response.json();return !!data.media&&!!data.settings;}catch{return false;}}
function createTikTok({getAppState,directory,onChange,createOverlay=createPublicOverlay,ensureClient=ensureTunnelClient,spawnClient=spawn,probe=probePublicURL,probeDelay=12000,onLog=()=>{}}){
 let state={status:'stopped',url:'',chatUrl:'',message:'Crea un enlace HTTPS temporal para LIVE Studio.',percent:0};let controller,child,overlay,timeout,probeTimer,generation=0;
 const set=patch=>{state={...state,...patch};onChange?.();};
 async function stop(){generation++;clearTimeout(timeout);clearTimeout(probeTimer);controller?.abort();controller=null;const old=child;child=null;old?.kill();overlay?.close();overlay=null;set({status:'stopped',url:'',percent:0,message:'Enlace desconectado. La URL anterior ya no está disponible.'});return state;}
 async function start(){
  if(['downloading','connecting','active'].includes(state.status))return state;
  const request=++generation;controller=new AbortController();set({status:'downloading',url:'',chatUrl:'',percent:0,message:'Preparando el componente de conexión de Cloudflare…'});
  try{
   const executable=await ensureClient({directory,signal:controller.signal,onProgress:percent=>{if(request===generation)set({percent,message:'Descargando componente de conexión… '+percent+'%'});}});
   if(request!==generation)return state;
   const created=await createOverlay(getAppState);if(request!==generation){created.close();return state;}overlay=created;
   await fs.promises.mkdir(directory,{recursive:true});const config=path.join(directory,'quick-tunnel.yml');await fs.promises.writeFile(config,'{}\n');if(request!==generation)return state;
   set({status:'connecting',message:'Creando el enlace HTTPS temporal…'});
   const proc=spawnClient(executable,['tunnel','--config',config,'--no-autoupdate','--protocol','http2','--edge-ip-version','4','--url',overlay.origin,'--metrics','127.0.0.1:0','--loglevel','info'],{windowsHide:true});child=proc;let origin='',connected=false,finished=false,verifying=false;
   const ready=()=>{
    if(!origin||!connected||verifying||request!==generation||finished)return;
    verifying=true;set({status:'connecting',message:'Validando el enlace HTTPS antes de compartirlo…'});
    const check=async()=>{if(request!==generation||finished)return;const url=origin+overlay.widgetPath;const available=await probe(url);if(request!==generation||finished)return;if(available){clearTimeout(timeout);set({status:'active',url,chatUrl:url.replace(/widget\?mode=poll$/,'chat'),message:'Enlace activo. Cópialo en una fuente Enlace de LIVE Studio.'});}else probeTimer=setTimeout(check,3000);};
    probeTimer=setTimeout(check,probeDelay);
   };
   const line=text=>{if(request!==generation)return;onLog(text);const match=text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com\b/);if(match)origin=match[0];if(text.includes('Registered tunnel connection'))connected=true;ready();};
   for(const stream of [proc.stdout,proc.stderr])readline.createInterface({input:stream}).on('line',line);
   const failed=message=>{if(request!==generation||finished)return;finished=true;clearTimeout(timeout);clearTimeout(probeTimer);child=null;proc.kill();overlay?.close();overlay=null;set({status:'error',url:'',chatUrl:'',message});};
   proc.on('error',()=>failed('No se pudo iniciar el componente de conexión.'));
   proc.on('exit',()=>failed('La conexión se cerró. Pulsa Crear enlace para volver a conectar.'));
   timeout=setTimeout(()=>failed('No se pudo conectar con Cloudflare. Comprueba tu conexión y vuelve a intentarlo.'),120000);timeout.unref?.();
  }catch(error){if(request===generation){overlay?.close();overlay=null;set({status:'error',url:'',message:error.message||'No se pudo crear el enlace HTTPS.'});}}
  return state;
 }
 return {getState:()=>({...state}),start,stop};
}
module.exports=createTikTok;
