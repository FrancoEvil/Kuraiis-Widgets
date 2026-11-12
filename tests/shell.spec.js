const {test,expect,_electron:electron}=require('@playwright/test');const path=require('node:path');
test('menú con iconos, interruptores accesibles y diseño compacto',async()=>{
 const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#toggle-sidebar');await expect(page).toHaveTitle("Kuraii's Playing");
 expect(await page.locator('#sidebar #toggle-sidebar').count()).toBe(1);expect(await page.locator('header #toggle-sidebar').count()).toBe(0);expect(await page.locator('#toggle-sidebar svg').count()).toBe(1);
 const input=page.locator('#showCover');await input.focus();await expect(input).toBeChecked();await page.keyboard.press('Space');await expect(input).not.toBeChecked();await expect(page.frameLocator('#preview').locator('#art')).toBeHidden();await page.keyboard.press('Space');await expect(input).toBeChecked();await expect(page.frameLocator('#preview').locator('#art')).toBeVisible();
 await expect(input).toHaveCSS('appearance','none');await expect(input).toHaveAttribute('role','switch');
 await page.screenshot({path:'dist/kuraii-expanded.png'});
 await page.getByRole('button',{name:'Ocultar menú',exact:true}).click();await expect(page.locator('#sidebar')).toHaveCSS('width','64px');await expect(page.getByRole('button',{name:'Mostrar menú',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Aplicación',exact:true}).click();await expect(page.locator('#system')).toBeVisible();await page.getByRole('button',{name:'Diseño del widget',exact:true}).click();await expect(page.locator('#design')).toBeVisible();
 await page.screenshot({path:'dist/kuraii-compact.png'});
 await page.setViewportSize({width:960,height:700});await expect(page.getByRole('button',{name:'Mostrar menú',exact:true})).toBeVisible();await page.getByRole('button',{name:'Mostrar menú',exact:true}).click();await expect(page.locator('#sidebar .brand')).toBeVisible();await expect(page.locator('.nav-label').first()).toBeVisible();
 expect(await page.locator('#sidebar').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 }finally{await app.close();}
});
