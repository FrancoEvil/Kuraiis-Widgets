const {app,BrowserWindow}=require('electron');const path=require('node:path');
app.whenReady().then(()=>{const win=new BrowserWindow({width:1280,height:900,webPreferences:{sandbox:false,preload:path.join(__dirname,'layout-preload.cjs'),contextIsolation:true}});win.loadFile(path.resolve(__dirname,'../../ui/index.html'));});app.on('window-all-closed',()=>app.quit());
