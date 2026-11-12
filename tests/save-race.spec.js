const {test,expect,_electron:electron}=require('@playwright/test');const path=require('node:path');
test('una actualización multimedia no descarta los cambios locales que están pendientes de guardarse',async()=>{
 const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});try{const page=await app.firstWindow();await page.waitForSelector('#showCover');const old=await page.evaluate(()=>api.get());await page.locator('#showCover').uncheck();await page.evaluate(old=>api.emitTestState(old),old);await expect(page.locator('#showCover')).not.toBeChecked();await expect.poll(()=>page.evaluate(async()=>(await api.get()).settings.showCover)).toBe(false);}finally{await app.close();}
});
