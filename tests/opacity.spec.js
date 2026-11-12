const {test,expect,_electron:electron}=require('@playwright/test');const path=require('node:path');const {pathToFileURL}=require('node:url');const {defaults}=require('../src/settings');
test('la opacidad afecta al fondo completo en todos los estilos, sin atenuar el contenido',async()=>{
 const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#opacity');await page.locator('#opacity').fill('35');await page.locator('#transparent').check();await page.locator('#autoTheme').selectOption('standard');await expect(page.locator('#transparent')).toBeChecked();await expect(page.locator('#opacity')).toHaveValue('35');
 await page.goto(pathToFileURL(path.resolve('ui/widget.html')).href);
 const cover=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#3366cc';x.fillRect(0,0,128,128);return c.toDataURL();});
 const send=async settings=>{await page.evaluate(({settings,cover})=>window.postMessage({settings,media:{cover,source:'Reproductor',title:'Prueba',artist:'Artista',playing:true,position:30,duration:180}},'*'),{settings,cover});await expect(page.locator('#cover')).toHaveJSProperty('complete',true);};
 async function alpha(){const png=await page.locator('#card').screenshot({omitBackground:true});return app.evaluate(({nativeImage},base64)=>{const image=nativeImage.createFromDataURL('data:image/png;base64,'+base64);const {width}=image.getSize();return image.toBitmap()[(30*width+width-20)*4+3];},png.toString('base64'));}
 for(const autoTheme of ['custom','standard','matte-light','matte-dark','artwork']){
  const settings={...defaults,autoColors:true,autoBackground:true,autoTheme};
  await send({...settings,opacity:100});await expect(page.locator('#album-backdrop')).toHaveCSS('opacity','1');expect(await alpha(),autoTheme+' 100%').toBe(255);
  await send({...settings,opacity:50});await expect(page.locator('#album-backdrop')).toHaveCSS('opacity','0.5');expect(await alpha(),autoTheme+' 50%').toBeGreaterThanOrEqual(127);expect(await alpha()).toBeLessThanOrEqual(129);
  await expect(page.locator('#title')).toHaveCSS('opacity','1');await expect(page.locator('#art')).toHaveCSS('opacity','1');
  await send({...settings,opacity:0});await expect(page.locator('#album-backdrop')).toBeHidden();expect(await alpha(),autoTheme+' 0%').toBe(0);
  await send({...settings,opacity:100,transparent:true});await expect(page.locator('#album-backdrop')).toBeHidden();expect(await alpha(),autoTheme+' transparente').toBe(0);
 }
 }finally{await app.close();}
});
