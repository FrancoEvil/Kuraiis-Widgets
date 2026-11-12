const {test,expect,_electron:electron}=require('@playwright/test');const fonts=require('../ui/fonts');const {validate}=require('../src/settings');const asset=require('../src/widget-assets');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
test('las 13 fuentes locales cargan y se conservan al guardar perfiles',async()=>{
 const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#font');
 expect(await page.locator('#font option').count()).toBe(17);
 const frame=page.frameLocator('#preview');
 for(const font of fonts.filter(f=>f.file)){
  expect(validate({font:font.name}).font).toBe(font.name);
  await page.locator('#font').selectOption(font.name);
  await expect(frame.locator('#card')).toHaveCSS('font-family',font.name.includes(' ')?`"${font.name}"`:font.name);
  const loaded=await page.locator('#preview').contentFrame().locator('body').evaluate(async(_,name)=>{const faces=await document.fonts.load(`700 26px "${name}"`,'Música Ñáé');return faces.length>0&&faces.every(f=>f.status==='loaded');},font.name);
  expect(loaded,font.name).toBe(true);
  const route=asset('/fonts/'+font.file);expect(route.type).toBe('font/ttf');expect(fs.existsSync(path.join('ui',route.file))).toBe(true);
  expect(fs.existsSync(path.join('ui/fonts',path.dirname(font.file),'OFL.txt'))).toBe(true);
 }
 expect(asset('/fonts/../../package.json')).toBeNull();
 const manifest=JSON.parse(fs.readFileSync('ui/fonts/manifest.json','utf8'));
 for(const entry of manifest.files){expect(crypto.createHash('sha256').update(fs.readFileSync(path.join('ui/fonts',entry.path))).digest('hex')).toBe(entry.sha256);}
 }finally{await app.close();}
});

test('el navegador de OBS recibe las fuentes por HTTP local',async()=>{
 const http=require('node:http');const {defaults}=require('../src/settings');
 const server=http.createServer((req,res)=>{if(req.url==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream'});return res.end(`data: ${JSON.stringify({settings:{...defaults,font:'Fredoka'},media:{title:'Música de prueba',artist:'Artista',playing:true,position:0,duration:60}})}\n\n`);}const item=asset(req.url);if(!item){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':item.type});res.end(fs.readFileSync(path.join('ui',item.file)));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let app;
 try{app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});const page=await app.firstWindow();await page.goto(`http://127.0.0.1:${server.address().port}/widget`);await expect(page.locator('#title')).toHaveText('Música de prueba');
 for(const font of fonts.filter(f=>f.file)){expect(await page.evaluate(async name=>(await document.fonts.load(`700 26px "${name}"`)).length,font.name),font.name).toBeGreaterThan(0);}
 }finally{if(app)await app.close();await new Promise(resolve=>server.close(resolve));}
});
