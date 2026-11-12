const {test,expect,_electron:electron}=require('@playwright/test');const {defaults,validate,migrateLegacy}=require('../src/settings');
test("contornos y estilos independientes, menú plegable y paleta Kuraii's Widgets",async()=>{
 const app=await electron.launch({args:[require('node:path').resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#toggle-sidebar');
 await expect(page).toHaveTitle("Kuraii's Widgets");expect(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(9, 10, 16)');
 const before=await page.locator('main').boundingBox();await page.locator('#toggle-sidebar').click();await expect(page.locator('#sidebar')).toHaveCSS('width','64px');await expect(page.locator('.nav-label').first()).toBeHidden();await expect(page.locator('#toggle-sidebar')).toHaveAttribute('aria-expanded','false');expect((await page.locator('main').boundingBox()).width).toBeGreaterThan(before.width);await page.locator('#toggle-sidebar').click();await expect(page.locator('#sidebar')).toBeVisible();
 await page.locator('[data-page="typography"]').click();await page.getByRole('button',{name:'Aplicar blanco con borde negro a título de la canción',exact:true}).click();
 const frame=page.frameLocator('#preview');await expect(frame.locator('#title')).toHaveCSS('color','rgb(255, 255, 255)');await expect(frame.locator('#title')).toHaveCSS('-webkit-text-stroke-width','3px');await expect(frame.locator('#title')).toHaveCSS('-webkit-text-stroke-color','rgb(0, 0, 0)');await expect(frame.locator('#title')).toHaveCSS('paint-order','stroke');await expect(frame.locator('#artist')).toHaveCSS('-webkit-text-stroke-width','0px');
 await page.locator('#titleItalic').check();await page.locator('#titleShadow').check();await page.locator('#titleFont').selectOption('Poppins');await page.locator('#titleSize').fill('32');await expect(frame.locator('#title')).toHaveCSS('font-style','italic');await expect(frame.locator('#title')).toHaveCSS('font-size','32px');
 await page.getByText('Artista',{exact:true}).click();await page.getByRole('button',{name:'Aplicar blanco con borde negro a artista',exact:true}).click();await expect(frame.locator('#artist')).toHaveCSS('-webkit-text-stroke-width','3px');await expect(frame.locator('#source')).toHaveCSS('-webkit-text-stroke-width','0px');
 await page.locator('#toggle-sidebar').click();await page.screenshot({path:'dist/wildtune-text.png'});
 }finally{await app.close();}
});
test('perfiles anteriores conservan personalización y validan nuevos estilos',()=>{
 const legacy=migrateLegacy({background:'#141a17',accent:'#b8fa73',text:'#ffffff',font:'Fredoka',width:700});const migrated=validate(legacy);expect(migrated.background).toBe('#13141F');expect(migrated.accent).toBe('#FF4A7A');expect(migrated.font).toBe('Fredoka');expect(migrated.width).toBe(700);
 expect(validate(migrateLegacy({accent:'#123456'})).accent).toBe('#123456');
 const input={...defaults,titleFont:'Shrikhand',titleOutlineWidth:1.5,artistOutlineWidth:2,sourceItalic:true,sidebarHidden:true};expect(validate(JSON.parse(JSON.stringify(input)))).toEqual(input);
 expect(validate({titleOutlineWidth:900,titleFont:'unknown',titleOutlineColor:'invalid',titleSize:-10}).titleOutlineWidth).toBe(4);expect(validate({titleSize:-10}).titleSize).toBe(0);expect(validate({titleFont:'unknown'}).titleFont).toBe('inherit');
});
