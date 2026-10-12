// Fullscreen is optional on mobile Safari; immersive UI remains available.
export function installDisplayControls({document,window}){
 const root=document.documentElement,screen=document.getElementById('screen-toggle'),menu=document.getElementById('tools-toggle'),tip=document.getElementById('screen-tip'),dismiss=document.getElementById('screen-tip-close');
 let immersive=false,toolsOpen=false,busy=false,tipTimer=0,disposed=false;
 const fullscreen=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
 const nativeAvailable=()=>!!(root.requestFullscreen||root.webkitRequestFullscreen)&&document.fullscreenEnabled!==false&&document.webkitFullscreenEnabled!==false;
 const standalone=()=>window.navigator.standalone===true||window.matchMedia?.('(display-mode: standalone)').matches||window.matchMedia?.('(display-mode: fullscreen)').matches;
 const ios=()=>/iPhone|iPad|iPod/.test(window.navigator.userAgent)||window.navigator.platform==='MacIntel'&&window.navigator.maxTouchPoints>1;
 function closeTip(){tip.hidden=true;window.clearTimeout(tipTimer);}
 function render(){
  if(disposed)return;
  root.dataset.immersive=String(immersive);root.dataset.tools=String(toolsOpen);
  for(const host of document.querySelectorAll('.world-host')){host.dataset.immersive=String(immersive);host.dataset.tools=String(toolsOpen);}
  const label=immersive?(fullscreen()?'退出全屏':'退出沉浸'):(nativeAvailable()&&!standalone()?'全屏':'沉浸');
  screen.querySelector('.display-label').textContent=label;screen.setAttribute('aria-label',label);screen.setAttribute('aria-pressed',String(immersive));screen.disabled=busy;
  menu.setAttribute('aria-pressed',String(toolsOpen));menu.setAttribute('aria-label',toolsOpen?'收起工具':'展开工具');menu.querySelector('.display-label').textContent=toolsOpen?'收起':'工具';
 }
 function hint(){
  if(disposed)return;
  tip.querySelector('p').textContent=ios()&&!standalone()?'Safari 全屏：点“分享”→“添加到主屏幕”，再从图标打开，即可隐藏地址栏。':'已收起界面。点“工具”可以切换星球、视角和光照。';
  tip.hidden=false;window.clearTimeout(tipTimer);tipTimer=window.setTimeout(closeTip,12000);
 }
 async function toggleScreen(){
  if(busy||disposed)return;
  if(immersive){
   immersive=false;toolsOpen=false;closeTip();
   if(fullscreen()){busy=true;render();try{const exit=document.exitFullscreen||document.webkitExitFullscreen;await exit?.call(document);}catch{immersive=fullscreen();}finally{busy=false;}}
   render();return;
  }
  immersive=true;toolsOpen=false;closeTip();render();
  if(nativeAvailable()&&!standalone()){
   busy=true;render();
   try{const request=root.requestFullscreen||root.webkitRequestFullscreen;await request.call(root);}catch{hint();}finally{busy=false;render();}
  }else if(!standalone())hint();
 }
 function changed(){if(disposed)return;immersive=fullscreen();toolsOpen=false;closeTip();render();}
 function keydown(event){if(!disposed&&event.key==='Escape'&&immersive&&!fullscreen()){immersive=false;toolsOpen=false;closeTip();render();}}
 screen.onclick=toggleScreen;menu.onclick=()=>{toolsOpen=!toolsOpen;closeTip();render();};dismiss.onclick=closeTip;
 document.addEventListener('fullscreenchange',changed);document.addEventListener('webkitfullscreenchange',changed);document.addEventListener('keydown',keydown);
 render();
 return{getState:()=>({immersive,toolsOpen,nativeFullscreen:fullscreen(),nativeAvailable:nativeAvailable(),standalone:!!standalone()}),dispose(){if(disposed)return;disposed=true;closeTip();screen.onclick=menu.onclick=dismiss.onclick=null;document.removeEventListener('fullscreenchange',changed);document.removeEventListener('webkitfullscreenchange',changed);document.removeEventListener('keydown',keydown);}};
}
