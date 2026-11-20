const normalize=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufe0e\ufe0f]/g,'').replace(/\s+/gu,' ').trim();
function sanitizeList(value){return typeof value==='string'?value.slice(0,10100).replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').split('\n').slice(0,100).map(line=>Array.from(line).slice(0,100).join('')).join('\n'):'';}
const wordChar=/[\p{L}\p{N}_]/u;
// Simulate a small glob automaton; stars consume non-space characters only.
// Work is bounded by pattern length × message length, without regex backtracking.
function glob(pattern,text,words=text.map(c=>wordChar.test(c)),spaces=text.map(c=>/\s/u.test(c))){
 let states=new Uint8Array(pattern.length+1),next=new Uint8Array(pattern.length+1);
 for(let i=0;i<=text.length;i++){
  if(i===0||!words[i-1])states[0]=1;
  for(let j=0;j<pattern.length;j++)if(states[j]&&pattern[j]==='*')states[j+1]=1;
  if(states[pattern.length]&&(i===text.length||!words[i]))return true;
  if(i===text.length)break;next.fill(0);
  for(let j=0;j<pattern.length;j++)if(states[j]){if(pattern[j]==='*'){if(!spaces[i])next[j]=1;}else if(pattern[j]===text[i])next[j+1]=1;}
  const old=states;states=next;next=old;
 }
 return false;
}
class WordFilter{
 constructor(){this.source=null;this.patterns=[];}
 matches(comment,settings){
  if(settings.chatWordFilter===false)return false;
  const source=settings.chatBlockedWords||'';if(source!==this.source){this.source=source;this.patterns=[...new Set(sanitizeList(source).split('\n').map(normalize).map(p=>p.replace(/\*+/g,'*')).filter(p=>p&&p!=='*'))].map(p=>({chars:Array.from(p),literals:p.split('*').filter(Boolean)}));}
  if(!this.patterns.length)return false;const text=normalize(String(comment??'').slice(0,2000)),chars=Array.from(text),words=chars.map(c=>wordChar.test(c)),spaces=chars.map(c=>/\s/u.test(c));
  for(const pattern of this.patterns)if(pattern.literals.every(literal=>text.includes(literal))&&glob(pattern.chars,chars,words,spaces))return true;
  return false;
 }
}
module.exports={WordFilter,sanitizeList,normalize,glob};
