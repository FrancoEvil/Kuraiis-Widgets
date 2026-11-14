const CHAT_SETTINGS=require('../ui/chat-settings');
const FONT_CATALOG=require('../ui/fonts');
const TEXT_PARTS=require('../ui/text-styles');
const defaults = {schemaVersion:2,autoUpdate:true,showBorder:false,borderColor:'#A78BFA',borderWidth:1.5,borderOpacity:100,autoColors:false,albumColorIntensity:85,albumLightness:80,autoTheme:'custom',albumBlur:16,albumDim:60,autoPalette:'dominant',autoTitle:true,autoArtist:true,autoAccent:true,autoBackground:false,autoOtherText:false,autoContrast:true,sidebarHidden:false,accent:'#FF4A7A',background:'#13141F',text:'#F8FAFC',secondary:'#94A3B8',opacity:94,radius:22,width:560,padding:24,fontSize:26,coverSize:88,font:'Segoe UI',layout:'horizontal',showCover:true,cropSpotifyCover:true,showArtist:true,showSource:true,showStatus:true,showProgress:true,showTime:true,hidePaused:false,transparent:false,startup:false,startHidden:false,minimizeTray:true,demo:false};
Object.assign(defaults,CHAT_SETTINGS.defaults);
const ranges=[...CHAT_SETTINGS.ranges,['borderWidth',0,12],['borderOpacity',0,100],['albumColorIntensity',0,100],['albumLightness',65,90],['albumBlur',0,40],['albumDim',0,90],['opacity',0,100],['radius',0,80],['width',280,1200],['padding',0,80],['fontSize',12,60],['coverSize',32,180]];
const colorKeys=['chatBorderColor','chatAccent','chatText','chatBubble','borderColor','accent','background','text','secondary'];
for(const part of TEXT_PARTS){
 const p=part.id;Object.assign(defaults,{[part.colorKey]:part.color,[p+'Font']:'inherit',[p+'Size']:0,[p+'Weight']:String(part.weight),[p+'Italic']:false,[p+'Spacing']:0,[p+'OutlineColor']:'#000000',[p+'OutlineWidth']:0,[p+'Shadow']:false,[p+'ShadowColor']:'#000000'});
 ranges.push([p+'Size',0,72],[p+'Spacing',-2,8],[p+'OutlineWidth',0,4]);colorKeys.push(part.colorKey,p+'OutlineColor',p+'ShadowColor');
}
function migrateLegacy(input){
 const out={...input};if(!input?.schemaVersion){const old={accent:['#b8fa73','#FF4A7A'],background:['#141a17','#13141F'],text:['#ffffff','#F8FAFC'],secondary:['#abb8ad','#94A3B8']};for(const [key,[before,after]]of Object.entries(old))if(out[key]?.toLowerCase()===before)out[key]=after;}return out;
}
function validate(input){
 const out={...defaults};for(const k of Object.keys(out)){const v=input?.[k];if(typeof out[k]==='boolean'&&typeof v==='boolean')out[k]=v;if(typeof out[k]==='string'&&typeof v==='string'&&v.length<100)out[k]=v;}
 for(const [k,min,max]of ranges)if(Number.isFinite(input?.[k]))out[k]=Math.max(min,Math.min(max,input[k]));
 for(const k of colorKeys)if(!/^#[0-9a-f]{6}$/i.test(out[k]))out[k]=defaults[k];
 if(!['auto','circle','rounded','square'].includes(out.chatAvatarShape))out.chatAvatarShape='auto';
 if(!require('../ui/chat-styles').some(style=>style.id===out.chatStyle))out.chatStyle='classic';if(!['left','right'].includes(out.chatAlign))out.chatAlign='left';
 if(!['custom','standard','matte-light','matte-dark','artwork'].includes(out.autoTheme))out.autoTheme='custom';
 if(!['dominant','vibrant'].includes(out.autoPalette))out.autoPalette='dominant';
 if(!['horizontal','vertical','minimal'].includes(out.layout))out.layout='horizontal';if(!FONT_CATALOG.some(f=>f.name===out.font))out.font='Segoe UI';if(!FONT_CATALOG.some(f=>f.name===out.chatFont))out.chatFont='Segoe UI';
 for(const {id:p}of TEXT_PARTS){if(out[p+'Font']!=='inherit'&&!FONT_CATALOG.some(f=>f.name===out[p+'Font']))out[p+'Font']='inherit';if(!['400','700','900'].includes(out[p+'Weight']))out[p+'Weight']=defaults[p+'Weight'];}
 return out;
}
module.exports={defaults,validate,migrateLegacy};
