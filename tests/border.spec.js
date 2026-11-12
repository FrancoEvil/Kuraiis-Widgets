const {test,expect,_electron:electron}=require('@playwright/test');const path=require('node:path');const {defaults,validate}=require('../src/settings');
test('el borde personalizable mantiene color y grosor sobre fondos transparentes y automáticos',async()=>{
 const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#showBorder');const frame=page.locator('#preview').contentFrame();await page.locator('#showBorder').check();await page.locator('#borderWidth').fill('3');await page.locator('#borderColor').fill('#ff4a7a');
 const border=()=>frame.locator('#card').evaluate(el=>{const css=getComputedStyle(el,'::after');return {width:css.borderTopWidth,color:css.borderTopColor,radius:css.borderTopLeftRadius};});
 await expect.poll(border).toMatchObject({width:'3px',color:'rgb(255, 74, 122)'});
 await page.locator('#transparent').check();await expect(frame.locator('#album-backdrop')).toBeHidden();await expect.poll(border).toMatchObject({width:'3px',color:'rgb(255, 74, 122)'});
 await page.locator('#autoTheme').selectOption('matte-light');await expect(page.locator('#transparent')).toBeChecked();await expect.poll(border).toMatchObject({width:'3px',color:'rgb(255, 74, 122)'});
 await page.locator('#borderOpacity').fill('50');await expect.poll(border).toMatchObject({color:'rgba(255, 74, 122, 0.5)'});
 await page.locator('#radius').fill('36');await expect.poll(border).toMatchObject({radius:'36px'});
 await page.locator('#borderOpacity').fill('100');await page.locator('#transparent').uncheck();await page.locator('#appearance').scrollIntoViewIfNeeded();await page.screenshot({path:'dist/kuraii-border-settings.png'});await frame.locator('#card').screenshot({path:'dist/kuraii-border.png'});
 await page.locator('#showBorder').uncheck();await expect.poll(border).toMatchObject({width:'0px'});
 }finally{await app.close();}
});
test('los perfiles conservan y validan las opciones del borde',()=>{
 const input={...defaults,showBorder:true,borderColor:'#FF4A7A',borderWidth:3.5,borderOpacity:75};expect(validate(JSON.parse(JSON.stringify(input)))).toEqual(input);
 const invalid=validate({borderWidth:100,borderOpacity:-2,borderColor:'invalid'});expect(invalid.borderWidth).toBe(12);expect(invalid.borderOpacity).toBe(0);expect(invalid.borderColor).toBe(defaults.borderColor);
});
