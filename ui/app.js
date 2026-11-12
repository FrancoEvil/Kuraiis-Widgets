const $=id=>document.getElementById(id);let state, timer;const labels={showCover:'Carátula de la canción',cropSpotifyCover:'Ocultar logo de Spotify en la carátula',showArtist:'Nombre del artista',showSource:'Aplicación de origen',showStatus:'Indicador de reproducción',showProgress:'Barra de progreso',showTime:'Tiempo transcurrido y duración',transparent:'Fondo transparente',hidePaused:'Ocultar widget al pausar',startup:'Iniciar con Windows',startHidden:'Iniciar en la bandeja con Windows',minimizeTray:'Minimizar a la bandeja'};
function notice(t){$('message').textContent=t;}
async function persist(){try{state=await api.save(state.settings);notice('Cambios guardados');}catch(e){notice('No se pudo guardar: '+e.message);}}
function field(group,key,label,type,extra={}){const row=document.createElement('label');row.className='field';const text=document.createElement('span');text.textContent=label;row.append(text);let input;if(type==='select'){input=document.createElement('select');for(const [value,title]of extra.options){const option=new Option(title,value);option.style.fontFamily=value;input.add(option);}}else{input=document.createElement('input');input.type=type;Object.assign(input,extra);}input.id=key;input.dataset.setting=key;if(type==='checkbox')input.setAttribute('role','switch');if(type==='range'){const wrap=document.createElement('span');wrap.className='range';const out=document.createElement('output');out.id=key+'-value';wrap.append(input,out);row.append(wrap);}else row.append(input);input.addEventListener('input',()=>{state.settings[key]=type==='checkbox'?input.checked:type==='range'?Number(input.value):input.value;updatePreview();clearTimeout(timer);timer=setTimeout(persist,180);});$(group).append(row);}
for(const k of ['showCover','cropSpotifyCover','showArtist','showSource','showStatus','showProgress','showTime'])field('visibility',k,labels[k],'checkbox');for(const [key,label]of [['accent','Acento'],['background','Fondo']])field('colors',key,label,'color');field('appearance','transparent',labels.transparent,'checkbox');for(const [key,label,min,max]of [['opacity','Opacidad del fondo (%)',0,100],['radius','Esquinas',0,80]])field('appearance',key,label,'range',{min,max});field('composition','layout','Distribución','select',{options:[['horizontal','Horizontal'],['vertical','Vertical'],['minimal','Minimal']]});field('composition','font','Tipografía','select',{options:FONT_CATALOG.map(f=>[f.name,f.name])});for(const [key,label,min,max]of [['width','Ancho',280,1200],['fontSize','Tamaño del título',12,60],['coverSize','Tamaño de carátula',32,180],['padding','Espacio interior',0,80]])field('composition',key,label,'range',{min,max});field('behavior','hidePaused',labels.hidePaused,'checkbox');for(const k of ['startup','startHidden','minimizeTray'])field('system-controls',k,labels[k],'checkbox');
function updatePreview(){if(!state)return;const s=state.settings;for(const el of document.querySelectorAll('[data-setting]')){const value=s[el.dataset.setting];if(el.type==='checkbox')el.checked=value;else el.value=value;if(el.type==='range')$(el.id+'-value').textContent=value;}document.body.classList.toggle('sidebar-hidden',!!s.sidebarHidden);$('toggle-sidebar').setAttribute('aria-label',s.sidebarHidden?'Mostrar menú':'Ocultar menú');$('toggle-sidebar').title=s.sidebarHidden?'Mostrar menú':'Ocultar menú';$('toggle-sidebar').setAttribute('aria-expanded',String(!s.sidebarHidden));updateUpdates();updateAlbumControls();$('demo').checked=s.demo;$('preview').contentWindow.postMessage(state,'*');$('dimensions').textContent=s.width+' px · '+s.layout;$('url').textContent=state.url;$('media-status').textContent=state.error?'Error del lector: '+state.error:s.demo?'Demostración activa · también se muestra en OBS':state.media.title?'Windows conectado · '+state.media.title:'Windows conectado · esperando reproducción';$('startup').disabled=!state.packaged;$('startup').title=state.packaged?'':'Disponible al ejecutar la versión instalada';}
$('demo').onchange=()=>{state.settings.demo=$('demo').checked;updatePreview();persist();};$('preview').onload=updatePreview;api.subscribe(s=>{state=s;updatePreview();});api.get().then(s=>{state=s;updatePreview();});
for(const button of document.querySelectorAll('[data-page]'))button.onclick=()=>{for(const p of document.querySelectorAll('.page'))p.hidden=p.id!==button.dataset.page;for(const b of document.querySelectorAll('[data-page]'))b.classList.toggle('active',b===button);$(button.dataset.page).scrollTop=0;};
const presets={studio:{width:560,padding:24,coverSize:88,fontSize:26,showProgress:true,layout:'horizontal',background:'#13141F',accent:'#FF4A7A',transparent:false,radius:22,showCover:true},glass:{layout:'horizontal',transparent:true,accent:'#FF4A7A',showCover:true},minimal:{layout:'minimal',transparent:false,background:'#090A10',accent:'#ffffff',showCover:false,showProgress:false,radius:8},album:{layout:'vertical',width:320,coverSize:180,showCover:true,transparent:false,background:'#13141F',accent:'#8B5CF6',radius:24}};for(const b of document.querySelectorAll('[data-preset]'))b.onclick=()=>{Object.assign(state.settings,presets[b.dataset.preset]);updatePreview();persist();};$('copy').onclick=async()=>{await api.copy();notice('URL copiada. Pégala en la fuente de navegador de OBS.');};$('hide').onclick=()=>api.hide();$('export').onclick=()=>api.export().catch(e=>notice(e.message));$('import').onclick=async()=>{try{state=await api.import();updatePreview();notice('Perfil cargado');}catch(e){notice(e.message);}};$('reset').onclick=()=>{const system={startup:state.settings.startup,startHidden:state.settings.startHidden,minimizeTray:state.settings.minimizeTray,sidebarHidden:state.settings.sidebarHidden,autoUpdate:state.settings.autoUpdate};state.settings={...system};persist().then(updatePreview);};


// Fit the full widget into the pinned canvas without changing its OBS dimensions.
let widgetSize={width:560,height:240};
function fitPreview(){
 const stage=document.querySelector('.stage'),frame=$('preview');
 const {width,height}=widgetSize;
 if(!width||!height)return;
 const scale=Math.max(0.05,Math.min(1,(stage.clientWidth-32)/width,(stage.clientHeight-24)/height));
 Object.assign(frame.style,{width:width+'px',height:height+'px',left:Math.max(0,(stage.clientWidth-width*scale)/2)+'px',top:Math.max(0,(stage.clientHeight-height*scale)/2)+'px',transform:`scale(${scale})`});
}
window.addEventListener('message',event=>{
 if(event.source!==$('preview').contentWindow||!event.data?.widgetSize)return;
 const {width,height}=event.data.widgetSize;
 if(Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0){widgetSize={width,height};fitPreview();}
});
new ResizeObserver(fitPreview).observe(document.querySelector('.stage'));



for(const part of TEXT_PARTS){
 const p=part.id,details=document.createElement('details');details.className='panel text-editor';details.open=p==='title';
 const summary=document.createElement('summary');summary.textContent=part.label;
 const body=document.createElement('div');body.className='text-editor-body';
 const controls=document.createElement('div');controls.id=p+'-controls';controls.className='text-controls';
 body.append(controls);details.append(summary,body);$('text-editors').append(details);
 field(controls.id,part.colorKey,'Color de letra','color');
 field(controls.id,p+'Font','Tipografía','select',{options:[['inherit','Usar fuente general'],...FONT_CATALOG.map(f=>[f.name,f.name])]});
 field(controls.id,p+'Size','Tamaño · 0 automático','range',{min:0,max:72});
 field(controls.id,p+'Weight','Grosor de letra','select',{options:[['400','Normal'],['700','Negrita'],['900','Extra negrita']]});
 field(controls.id,p+'Italic','Cursiva','checkbox');
 field(controls.id,p+'Spacing','Espaciado entre letras','range',{min:-2,max:8,step:0.25});
 field(controls.id,p+'OutlineColor','Color de borde','color');
 field(controls.id,p+'OutlineWidth','Grosor de borde (px)','range',{min:0,max:4,step:0.25});
 field(controls.id,p+'Shadow','Sombra de texto','checkbox');
 field(controls.id,p+'ShadowColor','Color de sombra','color');
 const quick=document.createElement('div');quick.className='text-quick';const hint=document.createElement('p');hint.textContent='El borde rodea la letra y conserva su color de relleno.';
 const button=document.createElement('button');button.textContent='Blanco con borde negro';button.setAttribute('aria-label','Aplicar blanco con borde negro a '+part.label.toLowerCase());
 button.onclick=()=>{Object.assign(state.settings,{[part.colorKey]:'#FFFFFF',[p+'OutlineColor']:'#000000',[p+'OutlineWidth']:1.5});updatePreview();clearTimeout(timer);persist();};quick.append(hint,button);body.append(quick);
}

$('toggle-sidebar').onclick=()=>{state.settings.sidebarHidden=!state.settings.sidebarHidden;updatePreview();clearTimeout(timer);persist();};

field('album-controls','autoColors','Colores automáticos de la carátula','checkbox');
field('album-controls','autoPalette','Color de la portada','select',{options:[['dominant','Predominante'],['vibrant','Más intenso']]});
for(const [key,label]of [['autoTitle','Aplicar al título'],['autoArtist','Aplicar al artista'],['autoAccent','Aplicar al acento y estado'],['autoBackground','Fondo teñido con la portada'],['autoOtherText','Aplicar al origen y los tiempos'],['autoContrast','Ajustar para mejorar la legibilidad']])field('album-controls',key,label,'checkbox');
window.addEventListener('message',event=>{
 if(event.source!==$('preview').contentWindow||!Object.hasOwn(event.data||{},'albumPalette'))return;
 const palette=event.data.albumPalette;
 for(const [id,color]of [['album-dominant',palette?.dominant],['album-vibrant',palette?.vibrant]]){if(color&&/^#[0-9a-f]{6}$/i.test(color)){$(id).style.background=color;$(id).title=color;$(id).hidden=false;}else $(id).hidden=true;}
 $('album-palette-status').textContent=palette?(state?.settings.autoColors?'Colores de la portada activos':'Paleta disponible · modo manual'):'Sin carátula · usando colores manuales';
});

field('album-controls','autoTheme','Estilo automático','select',{options:[['custom','Personalizado'],['standard','Estándar · degradado'],['matte-light','Mate claro'],['matte-dark','Mate oscuro'],['artwork','Carátula difuminada']]});
field('album-controls','albumBlur','Desenfoque de la carátula','range',{min:0,max:40});
field('album-controls','albumDim','Oscurecer carátula (%)','range',{min:0,max:90});
$('autoTheme').addEventListener('input',()=>{
 if($('autoTheme').value!=='custom')Object.assign(state.settings,{autoColors:true,autoBackground:true,autoTitle:true,autoArtist:true,autoAccent:true,autoOtherText:true});
 updatePreview();clearTimeout(timer);timer=setTimeout(persist,180);
});

$('album-controls').insertBefore($('autoTheme').closest('label'),$('autoPalette').closest('label'));
function updateAlbumControls(){
 const artwork=state?.settings.autoTheme==='artwork';
 $('albumBlur').closest('label').hidden=!artwork;
 $('albumDim').closest('label').hidden=!artwork;if($('albumColorIntensity'))$('albumColorIntensity').closest('label').hidden=state?.settings.autoTheme!=='matte-light';if($('albumLightness'))$('albumLightness').closest('label').hidden=state?.settings.autoTheme!=='matte-light';
}
$('autoTheme').addEventListener('input',updateAlbumControls);

field('album-controls','albumColorIntensity','Intensidad del mate claro','range',{min:0,max:100});
field('album-controls','albumLightness','Luminosidad del mate claro','range',{min:65,max:90});

field('appearance','showBorder','Borde del contenedor','checkbox');
field('appearance','borderColor','Color del borde','color');
field('appearance','borderWidth','Grosor del borde (px)','range',{min:0,max:12,step:0.5});
field('appearance','borderOpacity','Opacidad del borde (%)','range',{min:0,max:100});
const borderHint=document.createElement('p');borderHint.className='hint';borderHint.textContent='El borde sigue las esquinas y tiene su propia opacidad, independiente del fondo y de los colores automáticos.';$('appearance').append(borderHint);

field('update-preferences','autoUpdate','Buscar y descargar actualizaciones automáticamente','checkbox');
function updateUpdates(){
 const u=state?.updates||{status:'unsupported',message:'Disponible en la versión instalada.'};
 $('installed-version').textContent='Versión instalada: '+(state?.version||'1.4.0');
 $('update-status').textContent=u.message+(u.availableVersion?' · v'+u.availableVersion:'');
 $('check-update').disabled=['unsupported','checking','downloading','ready'].includes(u.status);
 $('download-update').hidden=u.status!=='available';$('install-update').hidden=u.status!=='ready';
 $('update-progress').hidden=u.status!=='downloading';$('update-progress').value=u.percent||0;
}
$('check-update').onclick=()=>api.checkUpdate().catch(()=>notice('No se pudo buscar la actualización.'));
$('download-update').onclick=()=>api.downloadUpdate().catch(()=>notice('No se pudo descargar la actualización.'));
$('install-update').onclick=()=>api.installUpdate().catch(()=>notice('No se pudo instalar la actualización.'));
