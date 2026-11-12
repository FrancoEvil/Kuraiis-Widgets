const http=require('node:http');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');const widgetAsset=require('./widget-assets');const {defaults}=require('./settings');
const privateKeys=new Set(['autoUpdate','startup','startHidden','minimizeTray','sidebarHidden','schemaVersion']);
const visualKeys=Object.keys(defaults).filter(k=>!privateKeys.has(k)&&!k.startsWith('chat'));
function publicSnapshot(state,cover){
 const media={};for(const key of ['title','artist','album','source','playing','position','duration','sampledAt','timelineUpdatedAt','playbackRate'])if(state.media[key]!==undefined)media[key]=state.media[key];media.cover=cover;
 return {settings:Object.fromEntries(visualKeys.map(k=>[k,state.settings[k]])),media,error:state.error?'El lector multimedia no está disponible.':''};
}
async function createPublicOverlay(getState,{chatHub}={}){
 const token=crypto.randomBytes(24).toString('base64url'),prefix='/s/'+token+'/';let cached={source:'',hash:'',bytes:null,mime:''};
 function image(){const source=getState().media.cover||'';if(source===cached.source)return cached;const match=source.length<6000000&&/^data:(image\/(?:png|jpe?g|webp|gif|svg\+xml));base64,(.+)$/s.exec(source);cached={source,hash:'',bytes:null,mime:''};if(match){cached.bytes=Buffer.from(match[2],'base64');cached.hash=crypto.createHash('sha256').update(cached.bytes).digest('hex').slice(0,24);cached.mime=match[1];}return cached;}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Referrer-Policy','no-referrer');
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  const route=(req.url||'').split('?')[0];if(!route.startsWith(prefix)){res.writeHead(404);return res.end();}
  const relative=route.slice(prefix.length);try{
   if(relative==='snapshot.json'){const cover=image();res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(publicSnapshot(getState(),cover.bytes?'./cover/'+cover.hash:'')));}
   if(relative.startsWith('cover/')){const cover=image();if(!cover.bytes||relative!=='cover/'+cover.hash){res.writeHead(404);return res.end();}res.setHeader('Content-Type',cover.mime);return res.end(cover.bytes);}
   const asset=widgetAsset('/'+relative);if(!asset){res.writeHead(404);return res.end();}
   res.setHeader('Content-Type',asset.type);res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' wss:; base-uri 'none'; form-action 'none'");
   res.end(await fs.promises.readFile(path.join(__dirname,'../ui',asset.file)));
  }catch{res.writeHead(500);res.end();}
 });
 const detachChat=chatHub?.attach(server,{path:prefix+'chat-socket'});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {origin:'http://127.0.0.1:'+server.address().port,widgetPath:prefix+'widget?mode=poll',prefix,close:()=>{detachChat?.();server.closeAllConnections();server.close();}};
}
module.exports={createPublicOverlay,publicSnapshot};
