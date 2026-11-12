const {test,expect,_electron:electron}=require('@playwright/test');const path=require('node:path');const Colors=require('../ui/album-colors');const {defaults,validate}=require('../src/settings');
function pixels(color){const data=new Uint8ClampedArray(32*32*4);for(let i=0;i<data.length;i+=4)data.set([...color,255],i);return data;}
test('extrae el color de la portada y conserva colores manuales y legibilidad',()=>{
 const blue=Colors.extract(pixels([20,65,200]),32,32);expect(blue.dominant).toBe('#1441c8');
 const input={...defaults,autoColors:true};const s=Colors.apply(input,blue);expect(s.text).not.toBe(defaults.text);expect(Colors.contrast(s.text,s.background)).toBeGreaterThanOrEqual(4.5);expect(input.text).toBe(defaults.text);
 expect(Colors.apply({...input,autoColors:false},blue).text).toBe(defaults.text);expect(Colors.apply(input,null).text).toBe(defaults.text);
 const light=Colors.apply({...input,autoBackground:true,autoTheme:'matte-light'},blue);const dark=Colors.apply({...input,autoBackground:true,autoTheme:'matte-dark'},blue);expect(light.background).not.toBe(dark.background);expect(Colors.contrast(light.text,light.background)).toBeGreaterThanOrEqual(4.5);expect(Colors.contrast(dark.text,dark.background)).toBeGreaterThanOrEqual(4.5);
 expect(validate({autoPalette:'invalid',autoTheme:'invalid'}).autoTheme).toBe('custom');
});
test('cambia el widget al cambiar de álbum, aplica los estilos y restaura el modo manual',async()=>{
 const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#autoColors');const frame=page.locator('#preview').contentFrame();
 const makeCover=color=>page.evaluate(color=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,128,128);return canvas.toDataURL();},color);
 const blue=await makeCover('#1441c8'),red=await makeCover('#cc2233');
 const send=async(settings,cover)=>{await page.evaluate(({settings,cover})=>document.getElementById('preview').contentWindow.postMessage({settings,media:{cover,source:'Spotify.exe',title:'Álbum de prueba',artist:'Artista',playing:true,position:30,duration:180}},'*'),{settings,cover});await expect(frame.locator('#cover')).toHaveJSProperty('complete',true);};
 const manual={...defaults,autoColors:true,autoTitle:true,autoArtist:false,autoAccent:true};
 await send(manual,blue);await expect(frame.locator('#title')).not.toHaveCSS('color','rgb(248, 250, 252)');const blueColor=await frame.locator('#title').evaluate(el=>getComputedStyle(el).color);await expect(frame.locator('#artist')).toHaveCSS('color','rgb(148, 163, 184)');
 await send(manual,red);await expect.poll(()=>frame.locator('#title').evaluate(el=>getComputedStyle(el).color)).not.toBe(blueColor);
 await send({...manual,autoColors:false},red);await expect(frame.locator('#title')).toHaveCSS('color','rgb(248, 250, 252)');
 await send({...manual,autoBackground:true,autoTheme:'matte-light'},blue);await expect(frame.locator('#album-backdrop')).not.toHaveCSS('background-color','rgb(19, 20, 31)');
 await send({...manual,autoBackground:true,autoTheme:'artwork',albumDim:0},blue);await expect(frame.locator('#album-backdrop')).toBeVisible();await expect(frame.locator('#album-backdrop-shade')).toHaveCSS('background-color','rgba(0, 0, 0, 0.6)');
 await send({...manual,autoBackground:true,autoTheme:'matte-dark'},blue);await expect(frame.locator('#album-backdrop-image')).toBeHidden();
 for(const theme of ['standard','matte-light','matte-dark','artwork']){await send({...manual,autoBackground:true,autoArtist:true,autoOtherText:true,autoTheme:theme},blue);await page.waitForTimeout(80);await frame.locator('#card').screenshot({path:'dist/album-'+theme+'.png'});}
 await send(manual,'');await expect(frame.locator('#title')).toHaveCSS('color','rgb(248, 250, 252)');
 }finally{await app.close();}
});

test('mate claro conserva familias de color diferentes y admite ajustar su intensidad',()=>{
 const opts={...defaults,autoColors:true,autoBackground:true,autoTheme:'matte-light'};
 const colors=[[160,115,35],[20,65,200],[40,160,70],[205,35,55]].map(c=>Colors.apply(opts,Colors.extract(pixels(c),32,32)).background);
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const gold=rgb(colors[0]);expect(gold[0]-gold[2]).toBeGreaterThan(70);expect(gold[1]-gold[2]).toBeGreaterThan(30);
 for(let i=0;i<colors.length;i++)for(let j=i+1;j<colors.length;j++)expect(rgb(colors[i]).reduce((sum,v,k)=>sum+Math.abs(v-rgb(colors[j])[k]),0)).toBeGreaterThan(65);
 const palette=Colors.extract(pixels([160,115,35]),32,32);const muted=rgb(Colors.apply({...opts,albumColorIntensity:0},palette).background);expect(Math.max(...muted)-Math.min(...muted)).toBeLessThan(2);
 const normal=Colors.apply(opts,palette);expect(Colors.contrast(normal.text,normal.background)).toBeGreaterThanOrEqual(4.5);
});

test('la portada de Los Tres produce un fondo dorado en vez de gris beige',async()=>{
 const fs=require('node:fs');test.skip(!fs.existsSync(path.resolve('tests/fixtures/covers/los-tres.png')),'La referencia visual personal solo se prueba localmente.');const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.waitForSelector('#autoColors');const frame=page.locator('#preview').contentFrame();const cover='data:image/png;base64,'+fs.readFileSync(path.resolve('tests/fixtures/covers/los-tres.png')).toString('base64');
 const settings={...defaults,autoColors:true,autoBackground:true,autoTheme:'matte-light',autoTitle:true,autoArtist:true,autoAccent:true,autoOtherText:true,showSource:false,showStatus:false,font:'DynaPuff',fontSize:28};
 await page.evaluate(({settings,cover})=>document.getElementById('preview').contentWindow.postMessage({settings,media:{cover,source:'Spotify.exe',title:'Déjate Caer',artist:'Los Tres',playing:true,position:12,duration:201}},'*'),{settings,cover});
 await expect(frame.locator('#cover')).toHaveJSProperty('complete',true);
 await expect.poll(()=>frame.locator('#album-backdrop').evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe('rgb(19, 20, 31)');
 const c=await frame.locator('#album-backdrop').evaluate(el=>getComputedStyle(el).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number));expect(c[0]-c[2]).toBeGreaterThan(65);expect(c[1]-c[2]).toBeGreaterThan(25);
 await page.waitForTimeout(100);await frame.locator('#card').screenshot({path:'dist/los-tres-matte-light.png'});
 }finally{await app.close();}
});

test('agrupa tonos parecidos por cobertura y no confunde una muestra aislada con el color principal',()=>{
 const data=new Uint8ClampedArray(100*100*4);const colors=[[136,95,28],[166,118,38],[186,145,54],[198,154,71],[30,65,190]];
 for(let i=0;i<10000;i++){const color=colors[i<6000?Math.floor(i/1500):4];data.set([...color,255],i*4);}
 const palette=Colors.extract(data,100,100);const c=[1,3,5].map(i=>parseInt(palette.dominant.slice(i,i+2),16));expect(c[0]).toBeGreaterThan(c[1]);expect(c[1]).toBeGreaterThan(c[2]);expect(Colors.extract(data,100,100)).toEqual(palette);
 const gray=Colors.extract(pixels([120,120,120]),32,32);const surface=Colors.apply({...defaults,autoColors:true,autoBackground:true,autoTheme:'matte-light'},gray).background;const g=[1,3,5].map(i=>parseInt(surface.slice(i,i+2),16));expect(Math.max(...g)-Math.min(...g)).toBeLessThan(2);
});
