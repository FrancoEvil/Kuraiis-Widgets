const {test,expect}=require('@playwright/test');
const {execFileSync}=require('node:child_process');
test('lector WinRT entrega JSON y carátula válida cuando está disponible',()=>{
 test.skip(!!process.env.CI,'El lector WinRT necesita una sesión multimedia de escritorio real.');
 const script=process.env.NOWPLAYING_MEDIA_SCRIPT || require('node:path').resolve('scripts/media.ps1');
 const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script,'-Once'],{encoding:'utf8',timeout:20000,windowsHide:true});
 const media=JSON.parse(output.trim());
 expect(media.error).toBeUndefined();
 expect(typeof media.title).toBe('string');
 expect(typeof media.playing).toBe('boolean');
 if(media.cover){expect(media.cover).toMatch(/^data:image\/[\w.+-]+;base64,/);expect(Buffer.from(media.cover.split(',')[1],'base64').length).toBeGreaterThan(0);}
});
