const {test,expect,_electron:electron}=require('@playwright/test');const path=require('node:path');const {defaults,validate}=require('../src/settings');
test('recorta la miniatura de Spotify y permite restaurar la imagen completa',async()=>{
 const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#cropSpotifyCover');const frame=page.locator('#preview').contentFrame();
 // Synthetic thumbnail using the layout delivered by Spotify's Windows session.
 const cover=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=300;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,300,300);x.fillStyle='#d18a72';x.fillRect(33,0,234,234);x.fillStyle='white';x.fillText('Spotify',90,280);return c.toDataURL();});
 const send=async(settings,source)=>page.evaluate(({settings,source,cover})=>document.getElementById('preview').contentWindow.postMessage({settings,media:{source,cover,title:'Prueba',artist:'Artista',playing:true}},'*'),{settings,source,cover});
 await send(defaults,'Spotify.exe');await expect(frame.locator('#art')).toHaveClass('spotify-cropped');await expect(frame.locator('#cover')).toBeVisible();
 await send({...defaults,cropSpotifyCover:false},'Spotify.exe');await expect(frame.locator('#art')).not.toHaveClass('spotify-cropped');
 await send(defaults,'Otro reproductor');await expect(frame.locator('#art')).not.toHaveClass('spotify-cropped');expect(validate({cropSpotifyCover:false}).cropSpotifyCover).toBe(false);
 }finally{await app.close();}
});
