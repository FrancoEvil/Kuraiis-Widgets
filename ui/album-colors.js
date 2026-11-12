/* Local album palette extraction, shared by the preview and the OBS widget. */
const AlbumColors=(()=>{
 const clamp=(v,min=0,max=255)=>Math.max(min,Math.min(max,v));
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const hex=c=>'#'+c.map(v=>Math.round(clamp(v)).toString(16).padStart(2,'0')).join('');
 const mix=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
 function luminance(c){const n=c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return n[0]*.2126+n[1]*.7152+n[2]*.0722;}
 function contrast(a,b){const x=luminance(rgb(a)),y=luminance(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 function readable(color,background,minimum=4.5){
  if(contrast(color,background)>=minimum)return color;
  const start=rgb(color),white=[255,255,255],black=[0,0,0];
  const target=contrast('#ffffff',background)>=contrast('#000000',background)?white:black;
  for(let i=1;i<=100;i++){const candidate=hex(mix(start,target,i/100));if(contrast(candidate,background)>=minimum)return candidate;}
  return hex(target);
 }
 function spotifyFrame(data,width,height){
  if(Math.abs(width-height)>1||width<16)return false;
  const black=(x,y)=>{const i=(Math.min(height-1,Math.floor(y*height))*width+Math.min(width-1,Math.floor(x*width)))*4;return data[i+3]>200&&data[i]<20&&data[i+1]<20&&data[i+2]<20;};
  return [.2,.4,.6,.72].every(y=>black(.03,y)&&black(.96,y))&&black(.5,.98);
 }

 // Oklab distances group visually similar shades even when lighting splits them
 // into different RGB buckets. All calculations stay local and deterministic.
 function toLab(c){const [r,g,b]=c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),n=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);return [.2104542553*l+.793617785*m-.0040720468*n,1.9779984951*l-2.428592205*m+.4505937099*n,.0259040371*l+.7827717662*m-.808675766*n];}
 function linearRgb([L,a,b]){const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,n=(L-.0894841775*a-1.291485548*b)**3;return [4.0767416621*l-3.3077115913*m+.2309699292*n,-1.2684380046*l+2.6097574011*m-.3413193965*n,-.0041960863*l-.7034186147*m+1.707614701*n];}
 function fromLch(L,C,H){
  const radians=H*Math.PI/180,convert=c=>linearRgb([L,c*Math.cos(radians),c*Math.sin(radians)]);
  let linear=convert(C);
  if(linear.some(v=>v<-.00001||v>1.00001)){let low=0,high=C;for(let i=0;i<16;i++){const mid=(low+high)/2;if(convert(mid).every(v=>v>=0&&v<=1))low=mid;else high=mid;}linear=convert(low);}
  return hex(linear.map(v=>255*(v<=.0031308?12.92*v:1.055*Math.max(0,v)**(1/2.4)-.055)));
 }
 function labHex(lab){return fromLch(lab[0],Math.hypot(lab[1],lab[2]),Math.atan2(lab[2],lab[1])*180/Math.PI);}
 const distance=(a,b)=>a.reduce((sum,v,i)=>sum+(v-b[i])**2,0);
 const hueDistance=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
 function extract(data,width,height,isSpotify=false){
  const framed=isSpotify&&spotifyFrame(data,width,height);
  const x0=framed?Math.ceil(width*.11):0,x1=framed?Math.floor(width*.89):width,y1=framed?Math.floor(height*.78):height;
  const buckets=new Map();
  for(let y=0;y<y1;y++)for(let x=x0;x<x1;x++){
   const i=(y*width+x)*4;if(data[i+3]<128)continue;
   const c=[data[i],data[i+1],data[i+2]],key=c.map(v=>Math.floor(v/24)).join(',');const bucket=buckets.get(key)||{sum:[0,0,0],count:0};bucket.count++;for(let j=0;j<3;j++)bucket.sum[j]+=c[j];buckets.set(key,bucket);
  }
  if(!buckets.size)return null;
  const points=[...buckets.values()].map(b=>{const lab=toLab(b.sum.map(v=>v/b.count)),C=Math.hypot(lab[1],lab[2]);let weight=C<.025?.5:1;if(lab[0]<.15)weight*=.12;else if(lab[0]>.96&&C<.025)weight*=.4;return {lab,mass:b.count*weight};});
  const total=points.reduce((sum,p)=>sum+p.mass,0);
  const seeds=[[...points].sort((a,b)=>b.mass-a.mass)[0].lab.slice()];
  while(seeds.length<Math.min(6,points.length)){
   let next=null,best=0;for(const p of points){const score=Math.min(...seeds.map(seed=>distance(p.lab,seed)))*Math.sqrt(p.mass);if(score>best){best=score;next=p;}}
   if(!next||best<.00001)break;seeds.push(next.lab.slice());
  }
  let clusters=[];
  for(let iteration=0;iteration<10;iteration++){
   clusters=seeds.map(lab=>({lab,mass:0,sum:[0,0,0]}));
   for(const p of points){let nearest=0;for(let i=1;i<seeds.length;i++)if(distance(p.lab,seeds[i])<distance(p.lab,seeds[nearest]))nearest=i;const c=clusters[nearest];c.mass+=p.mass;for(let j=0;j<3;j++)c.sum[j]+=p.lab[j]*p.mass;}
   for(let i=0;i<clusters.length;i++)if(clusters[i].mass){seeds[i]=clusters[i].sum.map(v=>v/clusters[i].mass);clusters[i].lab=seeds[i];}
  }
  const colors=clusters.filter(c=>c.mass>total*.005).map(c=>({...c,chroma:Math.hypot(c.lab[1],c.lab[2]),hue:(Math.atan2(c.lab[2],c.lab[1])*180/Math.PI+360)%360})).sort((a,b)=>b.mass-a.mass);
  const chromatic=colors.filter(c=>c.chroma>.035&&c.mass>=total*.04);
  const candidates=chromatic.reduce((sum,c)=>sum+c.mass,0)>=total*.35?chromatic:colors;
  // Merge coverage across related hues, instead of picking one tiny RGB bin.
  const families=candidates.map(seed=>{const members=seed.chroma>.035?candidates.filter(c=>c.chroma>.035&&hueDistance(c.hue,seed.hue)<28):[seed];const mass=members.reduce((sum,c)=>sum+c.mass,0);return {mass,lab:[0,1,2].map(i=>members.reduce((sum,c)=>sum+c.lab[i]*c.mass,0)/mass)};});
  const dominant=families.sort((a,b)=>b.mass-a.mass)[0];
  const vibrant=[...(chromatic.length?chromatic:colors)].sort((a,b)=>Math.pow(b.mass,.65)*Math.max(.01,b.chroma)-Math.pow(a.mass,.65)*Math.max(.01,a.chroma))[0];
  return {dominant:labHex(dominant.lab),vibrant:labHex(vibrant.lab),swatches:colors.map(c=>labHex(c.lab))};
 }

 function hsl(color){const [r,g,b]=rgb(color).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0;if(d){if(max===r)h=((g-b)/d+(g<b?6:0))/6;else if(max===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;}return [h,d?d/(1-Math.abs(2*l-1)):0,l];}
 function fromHsl(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h*6)%2-1)),m=l-c/2;const n=Math.floor(h*6)%6;const values=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][n];return hex(values.map(v=>(v+m)*255));}
 function apply(settings,palette){
  if(!settings.autoColors||!palette)return settings;
  const s={...settings},color=palette[s.autoPalette==='vibrant'?'vibrant':'dominant'];
  const [h,saturation]=hsl(color),theme=s.autoTheme||'custom';
  if(s.autoBackground){
   if(theme==='matte-light'){
    const lab=toLab(rgb(color)),C=Math.hypot(lab[1],lab[2]),H=Math.atan2(lab[2],lab[1])*180/Math.PI;
    const intensity=(s.albumColorIntensity??85)/100;
    const lightness=clamp((s.albumLightness??80)/100+(lab[0]-.55)*.12,.62,.92);
    s.background=fromLch(lightness,Math.min(.19,C*intensity*1.6),H);
   }else s.background=fromHsl(h,Math.min(.85,saturation*.8),theme==='matte-dark'?.12:.10);
   if(theme==='standard')s.albumGradient='linear-gradient(115deg,'+fromHsl(h,saturation*.65,.19)+','+s.background+')';
   if(theme==='artwork')s.albumArtwork=palette.artwork;
  }
  const text=s.autoContrast===false?color:readable(color,s.background);
  const accent=s.autoContrast===false?color:readable(color,s.background,3);
  if(s.autoTitle)s.text=text;
  if(s.autoArtist)s.secondary=text;
  if(s.autoAccent){s.accent=accent;s.statusColor=text;}
  if(s.autoOtherText){s.sourceColor=text;s.timesColor=text;}
  return s;
 }
 return {extract,apply,contrast,readable,spotifyFrame};
})();
if(typeof module!=='undefined')module.exports=AlbumColors;
