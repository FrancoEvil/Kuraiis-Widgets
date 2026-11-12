const {test,expect,_electron:electron}=require('@playwright/test');const path=require('node:path');const {pathToFileURL}=require('node:url');const Clock=require('../ui/playback-clock');const {defaults}=require('../src/settings');
const wall=100000;const sample=(position,extra={})=>({source:'Spotify.exe',title:'Canción',artist:'Artista',duration:180,playing:true,position,timelineUpdatedAt:wall,sampledAt:wall,playbackRate:1,...extra});
test('el reloj interpola muestras repetidas y sincroniza el salto de 1:03 a 1:07',()=>{
 const clock=new Clock();clock.update(sample(63),0,wall);expect(clock.position(1000)).toBe(64);
 clock.update(sample(63,{sampledAt:wall+1200}),1200,wall+1200);expect(clock.position(2000)).toBe(65);
 clock.update(sample(63,{sampledAt:wall+2400}),2400,wall+2400);expect(clock.position(3000)).toBe(66);
 clock.update(sample(67,{timelineUpdatedAt:wall+4000,sampledAt:wall+4000}),4000,wall+4000);expect(clock.position(4000)).toBe(67);expect(clock.position(4500)).toBe(67.5);
});
test('el reloj respeta pausa, reanudación, velocidad, búsquedas y cambio de canción',()=>{
 const c=new Clock();c.update(sample(63),0,wall);c.update(sample(63,{playing:false}),2000,wall+2000);expect(c.position(7000)).toBe(65);
 c.update(sample(63,{playing:true}),8000,wall+8000);expect(c.position(9000)).toBe(66);
 c.update(sample(120,{timelineUpdatedAt:wall+10000}),10000,wall+10000);expect(c.position(10000)).toBe(120);
 c.update(sample(10,{timelineUpdatedAt:wall+11000}),11000,wall+11000);expect(c.position(11000)).toBe(10);
 c.update(sample(1,{title:'Otra canción',timelineUpdatedAt:wall+12000,playbackRate:2}),12000,wall+12000);expect(c.position(14000)).toBe(5);
 c.freeze(14000);expect(c.position(30000)).toBe(5);
 c.update(sample(179,{title:'Final',timelineUpdatedAt:wall+30000}),30000,wall+30000);expect(c.position(60000)).toBe(180);
});
test('compensa la antigüedad de la muestra y corrige retrasos pequeños sin retroceder',()=>{
 const c=new Clock();c.update(sample(63,{timelineUpdatedAt:wall-2000}),0,wall);expect(c.position(0)).toBe(65);
 c.update(sample(64,{timelineUpdatedAt:wall+1000}),1000,wall+1000);let previous=c.position(1000);
 for(let t=1100;t<7000;t+=100){const next=c.position(t);expect(next).toBeGreaterThanOrEqual(previous);previous=next;}
});
test('el widget anima la barra continuamente y actualiza los segundos entre muestras',async()=>{
 const app=await electron.launch({args:[path.resolve('tests/fixtures/layout-main.cjs')]});
 try{const page=await app.firstWindow();await page.clock.install({time:new Date(wall)});await page.goto(pathToFileURL(path.resolve('ui/widget.html')).href);
 const send=async m=>page.evaluate(({media,settings})=>window.postMessage({settings,media},'*'),{settings:defaults,media:m});
 await send(sample(63,{timelineUpdatedAt:0,sampledAt:0}));await expect(page.locator('#elapsed-time')).toHaveText('1:03');
 const scale=()=>page.locator('#fill').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
 let previous=await scale();for(let i=0;i<5;i++){await page.clock.runFor(250);const next=await scale();expect(next).toBeGreaterThan(previous);previous=next;}
 await expect(page.locator('#elapsed-time')).toHaveText('1:04');await send(sample(63,{timelineUpdatedAt:0,sampledAt:0}));await page.clock.runFor(1000);await expect(page.locator('#elapsed-time')).toHaveText('1:05');
 await send(sample(65,{playing:false,timelineUpdatedAt:0,sampledAt:0}));await page.clock.runFor(2000);await expect(page.locator('#elapsed-time')).toHaveText('1:05');
 await send(sample(100,{timelineUpdatedAt:0,sampledAt:0}));await expect(page.locator('#elapsed-time')).toHaveText('1:40');
 }finally{await app.close();}
});
