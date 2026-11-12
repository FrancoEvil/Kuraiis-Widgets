const fonts=require('../ui/fonts');
const files={'/widget':'widget.html','/playback-clock.js':'playback-clock.js','/album-colors.js':'album-colors.js','/text-styles.js':'text-styles.js','/widget.js':'widget.js','/widget.css':'widget.css','/fonts.css':'fonts.css',...Object.fromEntries(fonts.filter(f=>f.file).map(f=>['/fonts/'+f.file,'fonts/'+f.file]))};
module.exports=route=>Object.hasOwn(files,route)?{file:files[route],type:route.endsWith('.ttf')?'font/ttf':route.endsWith('.js')?'text/javascript':route.endsWith('.css')?'text/css':'text/html'}:null;
