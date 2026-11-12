const {test,expect,_electron:electron}=require('@playwright/test');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const {EventEmitter}=require('node:events');const {PassThrough}=require('node:stream');const {defaults}=require('../src/settings');const {createPublicOverlay}=require('../src/public-overlay');const createTikTok=require('../src/tiktok');
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
function state(){return {settings:{...defaults,startup:true,autoUpdate:true,sidebarHidden:true},media:{title:'Canción pública',artist:'Artista',source:'Spotify.exe',playing:true,position:63,duration:180,cover:image},error:''};}
test('el enlace público solo expone el widget y requiere la ruta secreta',async()=>{
 const data=state();const overlay=await createPublicOverlay(()=>data);try{
 for(const url of ['/','/events','/snapshot.json','/settings.json','/s/incorrecto/widget',overlay.prefix+'../settings.json'])expect((await fetch(overlay.origin+url)).status).toBe(404);
 expect((await fetch(overlay.origin+overlay.prefix+'snapshot.json',{method:'POST'})).status).toBe(405);
 const response=await fetch(overlay.origin+overlay.prefix+'snapshot.json');const snapshot=await response.json();expect(snapshot.settings.startup).toBeUndefined();expect(snapshot.settings.autoUpdate).toBeUndefined();expect(snapshot.settings.sidebarHidden).toBeUndefined();expect(snapshot.settings.borderColor).toBe(defaults.borderColor);expect(snapshot.media.title).toBe('Canción pública');expect(snapshot.media.cover).toMatch(/^\.\/cover\//);
 const cover=await fetch(overlay.origin+overlay.prefix+snapshot.media.cover.slice(2));expect(cover.headers.get('content-type')).toBe('image/png');expect(cover.status).toBe(200);
 data.error='C:/private/config/path';const error=await(await fetch(overlay.origin+overlay.prefix+'snapshot.json')).json();expect(error.error).not.toContain('private');
 const html=await fetch(overlay.origin+overlay.widgetPath);expect(html.status).toBe(200);expect(html.headers.get('content-security-policy')).toContain("connect-src 'self'");
 }finally{overlay.close();}
});
test('el modo HTTPS consulta snapshots y mantiene el progreso entre consultas',async()=>{
 const data=state();data.media.cover='';const overlay=await createPublicOverlay(()=>data);let app;
 try{app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});const page=await app.firstWindow();await page.goto(overlay.origin+overlay.widgetPath);await expect(page.locator('#title')).toHaveText('Canción pública');await expect(page.locator('#elapsed-time')).toHaveText('1:03');await expect(page.locator('#elapsed-time')).toHaveText('1:04',{timeout:3000});data.media={...data.media,title:'Otra canción',position:12};await expect(page.locator('#title')).toHaveText('Otra canción',{timeout:5000});
 }finally{if(app)await app.close();overlay.close();}
});
test('el túnel muestra el enlace solo cuando conecta y lo cierra al desconectar',async()=>{
 const prefix=path.resolve(os.tmpdir(),'kuraii-tunnel-test-'),directory=fs.mkdtempSync(prefix);let process,closed=0;
 const tiktok=createTikTok({getAppState:state,directory,onChange:()=>{},probe:async()=>true,probeDelay:0,ensureClient:async()=> 'client.exe',createOverlay:async()=>({origin:'http://127.0.0.1:1234',widgetPath:'/s/secret/widget?mode=poll',close:()=>closed++}),spawnClient:()=>{process=new EventEmitter();process.stdout=new PassThrough();process.stderr=new PassThrough();process.kill=()=>{};return process;}});
 try{await tiktok.start();expect(tiktok.getState().status).toBe('connecting');process.stderr.write('Your tunnel: https://example-widget.trycloudflare.com\n');process.stderr.write('Registered tunnel connection\n');await expect.poll(()=>tiktok.getState().status).toBe('active');expect(tiktok.getState().url).toBe('https://example-widget.trycloudflare.com/s/secret/widget?mode=poll');await tiktok.stop();expect(tiktok.getState().url).toBe('');expect(closed).toBe(1);
 }finally{await tiktok.stop();if(path.resolve(directory).startsWith(prefix))fs.rmSync(directory,{recursive:true,force:true});}
});
