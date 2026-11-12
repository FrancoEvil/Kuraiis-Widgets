const $=id=>document.getElementById(id);const time=n=>`${Math.floor(Math.max(0,n||0)/60)}:${String(Math.floor(Math.max(0,n||0)%60)).padStart(2,'0')}`;
const playbackClock=new PlaybackClock();
let streamConnected=true;
let latestState=null,paletteCache={cover:'',spotify:false,palette:null};
function render({settings:manual,media:m,error}){latestState={settings:manual,media:m,error};if(error||!streamConnected)playbackClock.freeze();else playbackClock.update(m);refreshAlbumPalette(m);const palette=paletteCache.cover===m.cover&&paletteCache.spotify===/spotify/i.test(m.source||'')?paletteCache.palette:null;const s=AlbumColors.apply(manual,palette);if(s.albumArtwork&&!s.transparent&&s.opacity>0&&s.autoContrast!==false){const maximum=Math.round(255*(1-Math.max(60,s.albumDim??60)/100)).toString(16).padStart(2,'0');const bg='#'+maximum.repeat(3);for(const [enabled,key]of [[s.autoTitle,'text'],[s.autoArtist,'secondary'],[s.autoAccent,'statusColor'],[s.autoOtherText,'sourceColor'],[s.autoOtherText,'timesColor']])if(enabled)s[key]=AlbumColors.readable(s[key],bg);}if(parent!==window){document.documentElement.style.width=s.width+'px';document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';}const card=$('card');card.className=s.layout;Object.assign(card.style,{width:s.width+'px',padding:s.padding+'px',borderRadius:s.radius+'px',fontSize:s.fontSize+'px',fontFamily:s.font,color:s.text,background:'transparent'});applyBackgroundStyles(s);card.hidden=s.hidePaused&&!m.playing;$('art').hidden=!s.showCover;$('art').style.width=$('art').style.height=s.coverSize+'px';$('cover').hidden=!m.cover;updateSpotifyCrop(s,m);if(m.cover&&$('cover').src!==m.cover)$('cover').src=m.cover;$('note').hidden=!!m.cover;$('title').textContent=m.title||'Sin reproducción';$('artist').textContent=m.artist||'Esperando una canción';$('artist').hidden=!s.showArtist;$('artist').style.color=s.secondary;$('source').textContent=m.source||'Windows · multimedia';$('source').hidden=!s.showSource;$('status').textContent=m.playing?'● REPRODUCIENDO':'Ⅱ EN PAUSA';$('status').style.color=s.accent;$('status').hidden=!s.showStatus;$('progress').hidden=!s.showProgress;$('fill').style.background=s.accent;$('note').style.color=s.accent;$('times').hidden=!s.showTime;drawProgress();applyTextStyles(s);if(parent!==window)parent.postMessage({widgetSize:{width:s.width,height:card.hidden?1:Math.ceil(card.getBoundingClientRect().height)+2}},'*');}
if(location.protocol==='http:'){const events=new EventSource('/events');events.onmessage=e=>{streamConnected=true;render(JSON.parse(e.data));};events.onerror=()=>{streamConnected=false;playbackClock.freeze();};}else window.addEventListener('message',e=>{if(e.source===parent&&e.data?.settings)render(e.data);});


// Font loading can change the card height; refit the pinned preview afterwards.
document.fonts.addEventListener('loadingdone',()=>{const card=$('card');if(parent!==window&&!card.hidden)parent.postMessage({widgetSize:{width:parseFloat(card.style.width),height:Math.ceil(card.getBoundingClientRect().height)+2}},'*');});

function applyTextStyles(s){
 for(const part of TEXT_PARTS){
  const p=part.id,el=$(p);Object.assign(el.style,{
   color:s[part.colorKey]||part.color,
   fontFamily:s[p+'Font']&&s[p+'Font']!=='inherit'?s[p+'Font']:s.font,
   fontSize:s[p+'Size']?s[p+'Size']+'px':'',
   fontWeight:s[p+'Weight']||String(part.weight),
   fontStyle:s[p+'Italic']?'italic':'normal',
   letterSpacing:(s[p+'Spacing']||0)+'px',
   webkitTextStrokeWidth:((s[p+'OutlineWidth']||0)*2)+'px',
   webkitTextStrokeColor:s[p+'OutlineColor']||'#000000',
   paintOrder:'stroke fill',
   textShadow:s[p+'Shadow']?'0 2px 4px '+s[p+'ShadowColor']:'none'
  });
 }
}

let cropRequested=false;
function updateSpotifyCrop(s,m){
 cropRequested=s.cropSpotifyCover!==false&&/spotify/i.test(m.source||'');
 applySpotifyCrop();
}
function applySpotifyCrop(){
 const img=$('cover');
 // Spotify's Windows thumbnail contains a square album in the upper 78%,
 // black side margins and a logo below it. Leave ordinary covers untouched.
 const square=img.naturalWidth>=100&&Math.abs(img.naturalWidth-img.naturalHeight)<=1;
 let branded=false;
 if(cropRequested&&square){
  try{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=100;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,100,100);
   const black=(x,y)=>{const p=ctx.getImageData(x,y,1,1).data;return p[0]<20&&p[1]<20&&p[2]<20;};
   branded=[20,40,60,72].every(y=>black(3,y)&&black(96,y))&&black(50,98);
  }catch{branded=false;}
 }
 $('art').classList.toggle('spotify-cropped',branded);
}
$('cover').addEventListener('load',applySpotifyCrop);

function refreshAlbumPalette(m){
 const spotify=/spotify/i.test(m.source||'');
 if(!m.cover){paletteCache={cover:'',spotify,palette:null};notifyPalette(null);return;}
 if(paletteCache.cover===m.cover&&paletteCache.spotify===spotify){notifyPalette(paletteCache.palette);return;}
 const img=$('cover');if(!img.complete||!img.naturalWidth||img.src!==m.cover){notifyPalette(null);return;}
 let palette=null;
 try{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=Math.max(1,Math.round(64*img.naturalHeight/img.naturalWidth));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;palette=AlbumColors.extract(pixels,canvas.width,canvas.height,spotify);if(palette){const framed=spotify&&AlbumColors.spotifyFrame(pixels,canvas.width,canvas.height);canvas.width=canvas.height=128;if(framed)ctx.drawImage(img,img.naturalWidth*.11,0,img.naturalWidth*.78,img.naturalHeight*.78,0,0,128,128);else ctx.drawImage(img,0,0,128,128);palette.artwork=canvas.toDataURL('image/png');}}catch{}
 paletteCache={cover:m.cover,spotify,palette};notifyPalette(palette);
}
function notifyPalette(palette){if(parent!==window)parent.postMessage({albumPalette:palette?{dominant:palette.dominant,vibrant:palette.vibrant}:null},'*');}
$('cover').addEventListener('load',()=>{if(latestState)render(latestState);});
$('cover').addEventListener('error',()=>{paletteCache={cover:'',spotify:false,palette:null};notifyPalette(null);});

function applyBackgroundStyles(s){
 // Composite color, gradient, artwork and dimming first, then apply opacity once.
 // Keep the text and the album cover outside this layer so they stay crisp.
 const opacity=s.transparent?0:Math.max(0,Math.min(1,s.opacity/100));
 const layer=$('album-backdrop'),artwork=!!s.albumArtwork;
 layer.hidden=opacity===0;
 Object.assign(layer.style,{backgroundColor:s.background,backgroundImage:s.albumGradient||'none',opacity:String(opacity)});
 $('album-backdrop-image').hidden=!artwork;
 $('album-backdrop-shade').hidden=!artwork;
 $('album-backdrop-image').style.backgroundImage=artwork?'url("'+s.albumArtwork+'")':'none';
 $('album-backdrop-image').style.filter='blur('+(s.albumBlur??16)+'px)';
 $('album-backdrop-shade').style.backgroundColor='rgba(0,0,0,'+((s.autoContrast===false?(s.albumDim??60):Math.max(60,s.albumDim??60))/100)+')';
 const borderAlpha=Math.max(0,Math.min(100,s.borderOpacity??100))/100;const borderRgb=[1,3,5].map(i=>parseInt((s.borderColor||'#A78BFA').slice(i,i+2),16));
 $('card').style.setProperty('--container-border-width',s.showBorder?(s.borderWidth??1.5)+'px':'0px');
 $('card').style.setProperty('--container-border-color','rgba('+borderRgb.join(',')+','+borderAlpha+')');
 $('card').classList.toggle('artwork-background',artwork&&opacity>0);
}

let displayedSecond=-1,displayedDuration=-1;
function drawProgress(){
 const position=playbackClock.position(),duration=playbackClock.duration;
 const fraction=duration>0?Math.max(0,Math.min(1,position/duration)):0;
 $('fill').style.transform='scaleX('+fraction+')';
 const second=Math.floor(position),end=Math.floor(duration);
 if(second!==displayedSecond){$('elapsed-time').textContent=time(position);displayedSecond=second;}
 if(end!==displayedDuration){$('duration-time').textContent=time(duration);displayedDuration=end;}
}
function animateProgress(){drawProgress();requestAnimationFrame(animateProgress);}
requestAnimationFrame(animateProgress);
