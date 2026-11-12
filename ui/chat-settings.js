const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const defaults={chatFont:'Segoe UI',chatFontSize:20,chatAccent:'#FF4A7A',chatText:'#F8FAFC',chatBubble:'#13141F',chatBubbleOpacity:0,chatMaxMessages:24,chatFadeSeconds:25,chatShowStatus:true,chatShowAvatars:true,chatShowGifts:true,chatAntiSpam:true,chatMaxEmojis:12,chatCooldown:700,chatReconnect:true};
const ranges=[['chatFontSize',12,40],['chatBubbleOpacity',0,100],['chatMaxMessages',1,80],['chatFadeSeconds',0,300],['chatMaxEmojis',0,40],['chatCooldown',0,10000]];
const visualKeys=['chatFont','chatFontSize','chatAccent','chatText','chatBubble','chatBubbleOpacity','chatMaxMessages','chatFadeSeconds','chatShowStatus','chatShowAvatars','chatShowGifts'];
function visualSettings(settings){return Object.fromEntries(visualKeys.map(k=>[k,settings[k]??defaults[k]]));}
if(typeof module!=='undefined')module.exports={defaults,ranges,visualSettings};
