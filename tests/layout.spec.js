const {test,expect,_electron:electron}=require('@playwright/test');
test('la vista previa permanece visible al editar al final del panel',async()=>{
 const app=await electron.launch({args:[require('node:path').resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#padding');
 for(const size of [{width:1280,height:900},{width:960,height:700}]){
  await page.setViewportSize(size);await page.locator('#padding').scrollIntoViewIfNeeded();
  const before=await page.locator('.preview').boundingBox();expect(before.y).toBeGreaterThanOrEqual(0);expect(before.y+before.height).toBeLessThan(size.height);
  await page.locator('#padding').fill('60');await page.locator('#padding').dispatchEvent('input');
  await expect(page.frameLocator('#preview').locator('#card')).toHaveCSS('padding','60px');
  const after=await page.locator('.preview').boundingBox();expect(after.y).toBe(before.y);expect(await page.evaluate(()=>window.scrollY)).toBe(0);
  await page.locator('[data-preset="album"]').click();await expect(page.frameLocator('#preview').locator('#card')).toHaveClass('vertical');
  await page.waitForTimeout(100);const frame=await page.locator('#preview').boundingBox(),stage=await page.locator('.stage').boundingBox();expect(frame.y).toBeGreaterThanOrEqual(stage.y);expect(frame.y+frame.height).toBeLessThanOrEqual(stage.y+stage.height+1);
  await page.locator('[data-preset="studio"]').click();
 }
 await page.setViewportSize({width:1280,height:900});await page.locator('[data-preset="studio"]').click();await page.locator('#padding').scrollIntoViewIfNeeded();await page.waitForTimeout(150);await page.screenshot({path:'dist/panel-layout.png'});
 }finally{await app.close();}
});
