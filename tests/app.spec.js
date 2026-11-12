const {test,expect,_electron:electron}=require('@playwright/test');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
test('editor, widget local, persistencia y bandeja',async()=>{
 const prefix=path.resolve(os.tmpdir(),'kuraii-test-');const profile=fs.mkdtempSync(prefix);
 let app;try{
 const args=['--user-data-dir='+profile,'--widget-port=0'];app=await electron.launch(process.env.NOWPLAYING_EXE?{executablePath:process.env.NOWPLAYING_EXE,args}:{args:['.',...args]});
 const page=await app.firstWindow();await page.waitForSelector('#width');await expect(page.locator('h1')).toContainText('stream');await page.locator('#demo').check();await expect(page.frameLocator('#preview').locator('#title')).toHaveText('Midnight City');await page.locator('#showCover').uncheck();await expect(page.frameLocator('#preview').locator('#art')).toBeHidden();await page.waitForTimeout(600);
 const url=await page.locator('#url').textContent();expect((await page.request.get(url)).status()).toBe(200);
 const settings=JSON.parse(fs.readFileSync(path.join(profile,'settings.json'),'utf8'));expect(settings.showCover).toBe(false);
 await page.locator('#showCover').check();await page.locator('#demo').uncheck();await page.waitForTimeout(600);await page.screenshot({path:'dist/panel.png',fullPage:true});await page.locator('#hide').click();expect(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isVisible())).toBe(false);expect((await page.request.get(url)).status()).toBe(200);
 }finally{if(app)await app.close();if(path.resolve(profile).startsWith(prefix))fs.rmSync(profile,{recursive:true,force:true});}
});
