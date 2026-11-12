/* Monotonic playback clock: interpolate between actual player snapshots. */
class PlaybackClock {
 constructor(){this.anchor=0;this.at=0;this.correction=0;this.tau=3;this.rate=1;this.playing=false;this.duration=0;this.last=null;this.frozen=false;}
 position(now=performance.now()){
  const elapsed=this.playing?Math.max(0,(now-this.at)/1000):0;
  const value=this.anchor+elapsed*this.rate+this.correction*(1-Math.exp(-elapsed/this.tau));
  return Math.max(0,this.duration>0?Math.min(this.duration,value):value);
 }
 update(media,now=performance.now(),wall=Date.now()){
  const raw=Math.max(0,Number.isFinite(media.position)?media.position:0);
  const rate=Number.isFinite(media.playbackRate)&&media.playbackRate>=0?Math.min(16,media.playbackRate):1;
  const playing=!!media.playing;
  const duration=Number.isFinite(media.duration)?Math.max(0,media.duration):0;
  const key=JSON.stringify([media.source||'',media.title||'',media.artist||'',media.album||'']);
  const stamp=Number(media.timelineUpdatedAt)||Number(media.sampledAt)||wall;
  const age=stamp>0&&stamp<=wall+2000&&stamp>=wall-86400000?Math.max(0,(wall-stamp)/1000):0;
  const observed=raw+(playing?age*rate:0);
  const changed=!this.last||this.last.key!==key;
  const current=this.position(now);
  const rawChanged=!this.last||Math.abs(raw-this.last.raw)>.0001;
  let target=current,snap=false;
  if(changed||this.frozen){target=observed;snap=true;}
  else if(playing!==this.playing){target=rawChanged?observed:current;snap=true;}
  else if(rawChanged){target=observed;snap=!playing||raw<this.last.raw-.2||Math.abs(target-current)>3;}
  else if(rate===this.rate){this.duration=duration;return;}
  this.anchor=snap?target:current;this.at=now;
  this.correction=snap?0:target-current;
  // A small late snapshot slows the clock briefly instead of rewinding it.
  this.tau=Math.max(3,Math.abs(this.correction)/Math.max(.1,rate)*1.25);
  this.playing=playing;this.rate=rate;this.duration=duration;this.frozen=false;
  this.last={key,raw};
 }
 freeze(now=performance.now()){this.anchor=this.position(now);this.at=now;this.correction=0;this.playing=false;this.frozen=true;}
}
if(typeof module!=='undefined')module.exports=PlaybackClock;
