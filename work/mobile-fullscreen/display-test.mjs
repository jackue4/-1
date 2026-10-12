import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const source=await fs.readFile(new URL('../twin-planets/display-controls.js',import.meta.url),'utf8');
const {installDisplayControls}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const results=[];

function node(){
 const children=new Map();return{dataset:{},attributes:{},hidden:false,disabled:false,textContent:'',onclick:null,
  setAttribute(k,v){this.attributes[k]=String(v);},
  querySelector(k){if(!children.has(k))children.set(k,node());return children.get(k);}};
}
function fixture({native=true,webkit=false,ios=false,standalone=false,standaloneMedia=false}={}){
 const root=node(),screen=node(),menu=node(),tip=node(),dismiss=node(),hosts=[node(),node()],listeners=new Map(),timers=new Map();
 const elements={'screen-toggle':screen,'tools-toggle':menu,'screen-tip':tip,'screen-tip-close':dismiss};tip.hidden=true;
 let tid=0,requests=0,exits=0,requestImpl,exitImpl;
 const document={documentElement:root,fullscreenElement:null,webkitFullscreenElement:null,
  getElementById:id=>elements[id],querySelectorAll:selector=>selector==='.world-host'?hosts:[],
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
  emit(type,event={}){for(const fn of listeners.get(type)??[])fn(event);}};
 function setFullscreen(enabled){
  document[webkit?'webkitFullscreenElement':'fullscreenElement']=enabled?root:null;
  document.emit(webkit?'webkitfullscreenchange':'fullscreenchange');
 }
 if(native){
  document[webkit?'webkitFullscreenEnabled':'fullscreenEnabled']=true;
  root[webkit?'webkitRequestFullscreen':'requestFullscreen']=async function(){assert.equal(this,root);requests++;if(requestImpl)return requestImpl();setFullscreen(true);};
  document[webkit?'webkitExitFullscreen':'exitFullscreen']=async function(){assert.equal(this,document);exits++;if(exitImpl)return exitImpl();setFullscreen(false);};
 }
 const window={navigator:{userAgent:ios?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)':'Chrome Desktop',platform:ios?'iPhone':'Win32',maxTouchPoints:ios?5:0,standalone},
  matchMedia:q=>({matches:standaloneMedia&&q==='(display-mode: standalone)'}),
  setTimeout(fn){const id=++tid;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)};
 const controls=installDisplayControls({document,window});
 return{root,screen,menu,tip,dismiss,hosts,document,window,controls,listeners,timers,setFullscreen,
  setRequest(fn){requestImpl=fn;},setExit(fn){exitImpl=fn;},get requests(){return requests;},get exits(){return exits;}};
}
function assertSynced(f,immersive,tools){
 for(const element of [f.root,...f.hosts]){assert.equal(element.dataset.immersive,String(immersive));assert.equal(element.dataset.tools,String(tools));}
 assert.equal(f.screen.attributes['aria-pressed'],String(immersive));assert.equal(f.menu.attributes['aria-pressed'],String(tools));
}
async function check(name,run){try{await run();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});}}

await check('Native fullscreen enters and exits with fullscreenchange and both world hosts stay synchronized',async()=>{
 const f=fixture();assertSynced(f,false,false);assert.equal(f.screen.querySelector('.display-label').textContent,'全屏');
 await f.screen.onclick();assertSynced(f,true,false);assert.equal(f.controls.getState().nativeFullscreen,true);assert.equal(f.screen.querySelector('.display-label').textContent,'退出全屏');
 f.menu.onclick();assertSynced(f,true,true);f.menu.onclick();assertSynced(f,true,false);
 await f.screen.onclick();assertSynced(f,false,false);assert.equal(f.requests,1);assert.equal(f.exits,1);assert.equal(f.controls.getState().nativeFullscreen,false);assert.equal(f.screen.disabled,false);f.controls.dispose();
});
await check('Browser-originated exit restores ordinary controls',async()=>{
 const f=fixture();await f.screen.onclick();f.menu.onclick();f.setFullscreen(false);assertSynced(f,false,false);assert.equal(f.screen.querySelector('.display-label').textContent,'全屏');f.controls.dispose();
});
await check('Unsupported iPhone uses immersive view, Home Screen hint, and Escape restore',async()=>{
 const f=fixture({native:false,ios:true});assert.equal(f.screen.querySelector('.display-label').textContent,'沉浸');await f.screen.onclick();assertSynced(f,true,false);assert.equal(f.requests,0);assert.equal(f.tip.hidden,false);assert.match(f.tip.querySelector('p').textContent,/添加到主屏幕/);assert.equal(f.timers.size,1);
 f.menu.onclick();assertSynced(f,true,true);assert.equal(f.tip.hidden,true);assert.equal(f.timers.size,0);
 f.document.emit('keydown',{key:'Escape'});assertSynced(f,false,false);f.controls.dispose();
});
await check('Rejected native request falls back without breaking subsequent exit',async()=>{
 const f=fixture();f.setRequest(async()=>{throw new Error('Permission denied');});await f.screen.onclick();assertSynced(f,true,false);assert.equal(f.controls.getState().nativeFullscreen,false);assert.equal(f.screen.disabled,false);assert.equal(f.tip.hidden,false);assert.equal(f.screen.querySelector('.display-label').textContent,'退出沉浸');
 await f.screen.onclick();assertSynced(f,false,false);assert.equal(f.tip.hidden,true);assert.equal(f.timers.size,0);f.controls.dispose();
});
await check('Standalone launch skips native fullscreen and installation hint',async()=>{
 for(const config of [{standalone:true},{standaloneMedia:true}]){
  const f=fixture(config);assert.equal(f.controls.getState().standalone,true);await f.screen.onclick();assertSynced(f,true,false);assert.equal(f.requests,0);assert.equal(f.tip.hidden,true);assert.equal(f.timers.size,0);await f.screen.onclick();assertSynced(f,false,false);f.controls.dispose();
 }
});
await check('WebKit prefixed entry and exit work with the legacy fullscreen event',async()=>{
 const f=fixture({webkit:true});await f.screen.onclick();assertSynced(f,true,false);assert.equal(f.controls.getState().nativeFullscreen,true);await f.screen.onclick();assertSynced(f,false,false);assert.equal(f.exits,1);f.controls.dispose();
});
await check('Pending native requests disable the button and ignore duplicate clicks',async()=>{
 const f=fixture();let resolve;f.setRequest(()=>new Promise(r=>{resolve=r;}));const operation=f.screen.onclick();assert.equal(f.screen.disabled,true);assert.equal(f.requests,1);await f.screen.onclick();assert.equal(f.requests,1);
 f.setFullscreen(true);resolve();await operation;assert.equal(f.screen.disabled,false);assertSynced(f,true,false);f.controls.dispose();
});
await check('Tools can expand controls for both worlds outside and inside immersive mode',async()=>{
 const f=fixture({native:false});f.menu.onclick();assertSynced(f,false,true);assert.equal(f.menu.attributes['aria-label'],'收起工具');await f.screen.onclick();assertSynced(f,true,false);f.menu.onclick();assertSynced(f,true,true);await f.screen.onclick();assertSynced(f,false,false);f.controls.dispose();
});
await check('Dismiss and dispose remove hint timers and all event handlers',async()=>{
 const f=fixture({native:false});await f.screen.onclick();assert.equal(f.timers.size,1);f.dismiss.onclick();assert.equal(f.tip.hidden,true);assert.equal(f.timers.size,0);await f.screen.onclick();await f.screen.onclick();assert.equal(f.timers.size,1);f.controls.dispose();
 assert.equal(f.timers.size,0);assert.equal(f.screen.onclick,null);assert.equal(f.menu.onclick,null);assert.equal(f.dismiss.onclick,null);assert.equal([...f.listeners.values()].reduce((n,s)=>n+s.size,0),0);f.controls.dispose();
});
await check('Rejected native exit retains the Exit fullscreen control so the user can retry',async()=>{
 const f=fixture();await f.screen.onclick();f.setExit(async()=>{throw new Error('Exit interrupted');});await f.screen.onclick();assert.equal(f.controls.getState().nativeFullscreen,true);assertSynced(f,true,false);assert.equal(f.screen.querySelector('.display-label').textContent,'退出全屏');assert.equal(f.screen.disabled,false);
 f.setExit(undefined);await f.screen.onclick();assertSynced(f,false,false);assert.equal(f.controls.getState().nativeFullscreen,false);f.controls.dispose();
});
await check('Disposing during an unresolved native request cannot create a later hint timer',async()=>{
 const f=fixture();let reject;f.setRequest(()=>new Promise((_,r)=>{reject=r;}));const operation=f.screen.onclick();assert.equal(f.screen.disabled,true);f.controls.dispose();const before=JSON.stringify(f.root.dataset);reject(new Error('View was closed'));await operation;
 assert.equal(f.tip.hidden,true);assert.equal(f.timers.size,0);assert.equal(JSON.stringify(f.root.dataset),before);assert.equal(f.screen.onclick,null);
});

const passed=results.filter(r=>r.passed).length;
console.log(JSON.stringify({passed,total:results.length,verification:'mock DOM state machine; no browser or device rendering claim',results},null,2));
if(passed!==results.length)process.exitCode=1;
