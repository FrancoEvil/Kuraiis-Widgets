const {visualSettings}=require('../ui/chat-settings');const avatar=require('../ui/chat-avatar');const crypto=require('node:crypto');
const clean=(value,max)=>Array.from(String(value??'').replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,'')).slice(0,max).join('');
const segmenter=new Intl.Segmenter('es',{granularity:'grapheme'});const emojiPattern=/\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]\ufe0f?\u20e3/u;
const username=value=>{const text=String(value||'').trim().replace(/^@/,'');if(!/^[A-Za-z0-9_.]{1,32}$/.test(text))throw Error('Escribe el usuario de TikTok sin la URL del directo.');return text;};
function normalizeEvent(data){
 const user=data.user||data,first=values=>values.find(v=>v!==undefined&&v!==null&&String(v)!==''&&String(v)!=='0');
 return {msgId:first([data.msgId,data.common?.msgId])||'',user:{userId:first([user.userId,user.idStr,user.id,user.uniqueId,user.displayId])||user.nickname||'',nickname:user.nickname||user.nickName||user.uniqueId||user.displayId||'Anónimo',avatarUrl:avatar.fromUser(user)},comment:typeof data.comment==='string'?data.comment:typeof data.content==='string'?data.content:'',giftDetails:{giftType:data.giftDetails?.giftType??data.giftType??(data.gift?.combo?1:data.gift?.type??0),giftName:data.giftDetails?.giftName||data.gift?.name||data.extendedGiftInfo?.name||data.giftName||'Regalo'},repeatCount:data.repeatCount,repeatEnd:data.repeatEnd===true||Number(data.repeatEnd)===1};
}
class SpamFilter{
 constructor(){this.seen=new Map();this.users=new Map();this.tokens=60;this.at=Date.now();}
 prune(now){for(const [key,time]of this.seen)if(now-time>30000)this.seen.delete(key);for(const [key,time]of this.users)if(now-time>30000)this.users.delete(key);for(const map of [this.seen,this.users])while(map.size>2048)map.delete(map.keys().next().value);}
 accept(type,data,settings,now=Date.now()){
  this.prune(now);this.tokens=Math.min(60,this.tokens+Math.max(0,now-this.at)*.03);this.at=now;if(this.tokens<1)return false;
  const id=clean(data.msgId||data.common?.msgId||'',100),user=clean(data.user?.userId||data.user?.uniqueId||data.userId||data.uniqueId||data.user?.nickname||data.nickname||'anónimo',80);
  if(id&&this.seen.has(type+':'+id))return false;
  const comment=String(data.comment||'');if(type==='chat'){
   if(!comment.trim()||comment.length>2000)return false;
   if(settings.chatAntiSpam){const normalized=clean(comment,320).normalize('NFKC').toLocaleLowerCase().replace(/[\u200b-\u200f\ufe0e\ufe0f]/g,'').replace(/\s+/g,' ').trim();if(!normalized)return false;const key='text:'+user+':'+normalized;
    if(this.seen.has(key))return false;
    let emoji=0;for(const {segment}of segmenter.segment(comment))if(emojiPattern.test(segment)&&++emoji>settings.chatMaxEmojis)return false;
    if(now-(this.users.get(user)??-Infinity)<settings.chatCooldown)return false;
    this.seen.set(key,now);this.users.set(user,now);
   }
  }
  if(id)this.seen.set(type+':'+id,now);this.tokens--;this.prune(now);return true;
 }
 clear(){this.seen.clear();this.users.clear();this.tokens=60;this.at=Date.now();}
}
async function createConnector(name,key=''){
 const sdk=await import('tiktok-live-connector');
 sdk.SignConfig.apiKey=key||undefined;sdk.SignConfig.cachedInstance=undefined;
 try{const eulerApiInstance=sdk.createEulerClient();return new sdk.TikTokLiveConnection(name,{processInitialData:false,enableExtendedGiftInfo:false,authenticateWs:false,eulerApiInstance,webClientOptions:{timeout:{request:15000}},wsClientOptions:{handshakeTimeout:15000}});}
 finally{sdk.SignConfig.apiKey=undefined;sdk.SignConfig.cachedInstance=undefined;}
}
function createChat({getSettings,onChange=()=>{},factory=createConnector}){
 let state={status:'disconnected',username:'',message:'Sin conexión a un directo.',accepted:0,blocked:0},client=null,generation=0,retryTimer,attempt=0,credential='',counter=0,epoch=crypto.randomBytes(8).toString('hex');const events=[],servers=new Set(),filter=new SpamFilter();
 const emit=(name,data)=>{for(const io of servers)(name==='chat:message'?io.to('live'):io).emit(name,data);};
 const set=patch=>{state={...state,...patch};emit('chat:state',state);onChange();};
 function ingest(type,data){
  data=normalizeEvent(data);const settings=getSettings();if(type==='gift'&&(!settings.chatShowGifts||(Number(data.giftDetails?.giftType??data.giftType)===1&&!data.repeatEnd)))return;
  if(!filter.accept(type,data,settings)){state.blocked++;return;}
  const user=data.user||data,nickname=clean(user.nickname||user.nickName||user.uniqueId||'Anónimo',64);
  const event={id:epoch+':'+(++counter),type,nickname,avatarUrl:user.avatarUrl||'',createdAt:Date.now()};
  if(type==='chat')event.comment=clean(data.comment,320);else{event.giftName=clean(data.giftDetails?.giftName||data.extendedGiftInfo?.name||data.giftName||'Regalo',80);event.count=Math.max(1,Math.min(9999,Number(data.repeatCount)||1));}
  events.push(event);while(events.length>200)events.shift();state.accepted++;emit('chat:message',event);return event;
 }
 function clear(){events.length=0;filter.clear();epoch=crypto.randomBytes(8).toString('hex');emit('chat:reset',{epoch});}
 function release(){const old=client;client=null;if(old){old.removeAllListeners();try{Promise.resolve(old.disconnect()).catch(()=>{});}catch{}}}
 function schedule(token){if(token!==generation||retryTimer||!getSettings().chatReconnect||attempt>=5)return;const delay=Math.min(30000,2000*2**attempt++);set({status:'reconnecting',message:'Conexión interrumpida. Reintentando…'});retryTimer=setTimeout(()=>{retryTimer=null;void establish(token);},delay);retryTimer.unref?.();}
 async function establish(token){
  release();try{const next=await factory(state.username,credential);if(token!==generation){try{await next.disconnect();}catch{}return;}client=next;
   next.on('chat',data=>{if(token===generation)ingest('chat',data);});next.on('gift',data=>{if(token===generation)ingest('gift',data);});
   next.on('error',()=>{if(token===generation)set({status:'error',message:'TikTok o el servicio de firma no está disponible. Revisa el usuario y la clave si corresponde.'});});
   next.on('disconnected',()=>{if(token===generation){set({status:'disconnected',message:'Se perdió la conexión con el directo.'});schedule(token);}});
   next.on('streamEnd',()=>{if(token===generation){generation++;clearTimeout(retryTimer);retryTimer=null;credential='';release();set({status:'ended',message:'El directo terminó.'});}});
   await next.connect();if(token!==generation){next.removeAllListeners();try{await next.disconnect();}catch{}return;}attempt=0;clearTimeout(retryTimer);retryTimer=null;set({status:'connected',message:'Conectado a @'+state.username});
  }catch(error){if(token!==generation)return;release();const description=String(error?.name)+' '+String(error?.message),offline=/offline|not.?live/i.test(description),limited=/rate.?limit|too many|429/i.test(description),auth=/business|premium|api.?key|unauthoriz|plan required/i.test(description);set({status:'error',message:offline?'Esa cuenta no está en directo. Puedes usar el modo mock mientras tanto.':limited?'El servicio de firma alcanzó su límite. Espera antes de volver a conectar.':auth?'El servicio de firma pide autorización para esta conexión. Revisa tu clave; el modo mock no la necesita.':'No se pudo conectar. Revisa el usuario, la conexión o la clave de firma de Euler Stream.'});if(!offline&&!limited&&!auth)schedule(token);}
 }
 async function connect(name,key=''){const normalized=username(name);await disconnect();credential=String(key||'').trim().slice(0,512);attempt=0;clear();set({status:'connecting',username:normalized,accepted:0,blocked:0,message:'Conectando a @'+normalized+'…'});await establish(generation);return {...state};}
 async function disconnect(){generation++;clearTimeout(retryTimer);credential='';attempt=0;release();set({status:'disconnected',message:'Sin conexión a un directo.'});return {...state};}
 function attach(server,{path='/chat-socket'}={}){const {Server}=require('socket.io');const io=new Server(server,{path,serveClient:false,maxHttpBufferSize:16384,transports:['websocket','polling'],cors:{origin:false}});servers.add(io);io.use((socket,next)=>{if(io.engine.clientsCount>32)return next(Error('Too many connections'));next();});io.on('connection',socket=>{const mock=socket.handshake.auth?.mock===true;if(!mock)socket.join('live');socket.emit('chat:initial',{settings:visualSettings(getSettings()),events:mock?[]:[...events],state:{...state},epoch});});return ()=>{servers.delete(io);io.close();};}
 return {getState:()=>({...state}),connect,disconnect,ingest,clear,attach,preferencesChanged:()=>emit('chat:config',visualSettings(getSettings())),dispose(){void disconnect();for(const io of servers)io.close();servers.clear();}};
}
module.exports={createChat,createConnector,normalizeEvent,SpamFilter,clean,username};
