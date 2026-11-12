const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const manifest=require('../assets/cloudflared/manifest.json');
async function digest(file){const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');}
async function ensureTunnelClient({directory,signal,onProgress=()=>{}}){
 await fs.promises.mkdir(directory,{recursive:true});
 const file=path.join(directory,`cloudflared-${manifest.version}.exe`),temp=file+'.'+crypto.randomBytes(6).toString('hex')+'.download';
 if(fs.existsSync(file)&&await digest(file)===manifest.sha256)return file;
 const response=await fetch(manifest.url,{signal:AbortSignal.any([signal,AbortSignal.timeout(180000)])});
 if(!response.ok)throw Error('No se pudo descargar el componente de conexión.');
 let handle;try{
  handle=await fs.promises.open(temp,'w');const hash=crypto.createHash('sha256');let total=0;
  for await(const chunk of response.body){signal.throwIfAborted();total+=chunk.length;if(total>manifest.size)throw Error('El componente descargado tiene un tamaño incorrecto.');hash.update(chunk);await handle.writeFile(chunk);onProgress(Math.floor(total/manifest.size*100));}
  if(total!==manifest.size||hash.digest('hex')!==manifest.sha256)throw Error('No se pudo verificar el componente de conexión.');
  signal.throwIfAborted();await handle.close();handle=null;if(fs.existsSync(file))await fs.promises.unlink(file);await fs.promises.rename(temp,file);return file;
 }finally{await handle?.close();if(fs.existsSync(temp))await fs.promises.unlink(temp);}
}
module.exports={ensureTunnelClient};
