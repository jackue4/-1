// Execute the actual root switch controller with a deterministic RAF queue.
// World mount functions and DOM nodes are mocks: this is a control-flow check,
// not a browser layout, WebGL, storage, or animation-pause verification.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const sourceURL=new URL('../twin-planets/app.js',import.meta.url);
const source=(await fs.readFile(sourceURL,'utf8')).replace(/^import .*;\r?\n/gm,'');
const frames=[],mounts={coast:0,sunny:0},disposals={coast:0,sunny:0},errors=[],history=[];
const hosts=Object.fromEntries(['coast','sunny'].map(id=>[id,{id:`world-${id}`,hidden:true,inert:true,dataset:{}}]));
const buttons=Object.keys(hosts).map(id=>({dataset:{worldButton:id},attributes:{},setAttribute(name,value){this.attributes[name]=value;}}));
const transitText={textContent:''},transit={hidden:true,querySelector:()=>transitText},status={textContent:''};
const document={
  documentElement:{dataset:{}},title:'',
  getElementById:id=>id==='transit'?transit:id==='journey-status'?status:hosts[id.slice(6)],
  querySelectorAll:selector=>selector==='[data-world-button]'?buttons:[],
};
const makeMount=id=>doc=>{mounts[id]++;doc.host.dataset.ready='true';return()=>{disposals[id]++;};};
const context=vm.createContext({
  console:{log:console.log,error:error=>errors.push(String(error?.stack||error))},Promise,
  document,window:{},location:{hash:'#coast'},
  history:{replaceState(a,b,url){history.push(url);}},
  requestAnimationFrame:callback=>frames.push(callback),
  coast:{markup:'coast',css:''},sunny:{markup:'sunny',css:''},
  mountCoast:makeMount('coast'),mountSunny:makeMount('sunny'),
  installViewport:()=>({getState:()=>({width:852,height:300})}),
  installDisplayControls:()=>({getState:()=>({immersive:false,toolsOpen:false})}),
  createWorldDocument:host=>({host,setActive(active){host.hidden=!active;host.inert=!active;},dispose(){}}),
});
vm.runInContext(source,context,{filename:sourceURL.pathname});
const snapshot=()=>JSON.parse(JSON.stringify(context.window.bloomUniverse.getState()));
const click=id=>buttons.find(button=>button.dataset.worldButton===id).onclick();
async function flushFrame(){const callbacks=frames.splice(0);callbacks.forEach(callback=>callback(16));await Promise.resolve();await Promise.resolve();}
async function settle(){for(let i=0;i<12&&frames.length;i++)await flushFrame();assert.equal(frames.length,0,'Unsettled switch controller');}
function expectActive(id){
  const state=snapshot();assert.equal(state.active,id);assert.equal(transit.hidden,true);
  assert.deepEqual(state.worlds.filter(w=>w.visible).map(w=>w.id),[id]);
  assert.equal(document.documentElement.dataset.world,id);assert.equal(history.at(-1),`#${id}`);
  for(const button of buttons)assert.equal(button.attributes['aria-pressed'],String(button.dataset.worldButton===id));
  return state;
}
const report={scope:'VM execution of actual twin-planets/app.js with mock mounts/DOM and deterministic RAF; no browser layout or GPU proof',checks:[]};
async function check(name,fn){try{const actual=await fn();report.checks.push({name,passed:true,...actual});}catch(error){report.checks.push({name,passed:false,error:error.stack||String(error)});}}

await check('Initial visit mounts only the selected coast world',async()=>{
  await settle();const state=expectActive('coast');assert.deepEqual(mounts,{coast:1,sunny:0});return{state,mounts:{...mounts}};
});
await check('Quick click back to the current world cancels a pending first mount',async()=>{
  click('sunny');assert.equal(transit.hidden,false);click('coast');assert.equal(transit.hidden,true);
  await settle();const state=expectActive('coast');assert.deepEqual(mounts,{coast:1,sunny:0});
  return{clicks:['sunny','coast'],active:state.active,sunnyMounts:mounts.sunny,transitHidden:transit.hidden};
});
await check('Twenty repeated switches reuse both existing world instances',async()=>{
  click('sunny');await settle();expectActive('sunny');
  for(let i=0;i<10;i++){click('coast');await settle();expectActive('coast');click('sunny');await settle();expectActive('sunny');}
  assert.deepEqual(mounts,{coast:1,sunny:1});assert.deepEqual(disposals,{coast:0,sunny:0});
  return{switches:20,mounts:{...mounts},disposals:{...disposals},loaded:snapshot().loaded};
});
await check('Quick cancellation also works after both worlds are cached',async()=>{
  click('coast');click('sunny');await settle();const state=expectActive('sunny');assert.deepEqual(mounts,{coast:1,sunny:1});
  return{clicks:['coast','sunny'],active:state.active,mounts:{...mounts},transitHidden:transit.hidden};
});
await check('Only the latest of three queued choices becomes active',async()=>{
  click('coast');click('sunny');click('coast');await settle();const state=expectActive('coast');assert.deepEqual(mounts,{coast:1,sunny:1});
  return{clicks:['coast','sunny','coast'],active:state.active,mounts:{...mounts},visible:state.worlds.filter(w=>w.visible).map(w=>w.id)};
});
report.errors=errors;report.passed=report.checks.every(c=>c.passed)&&errors.length===0;
report.finalState=snapshot();report.mounts={...mounts};
await fs.writeFile(new URL('switch-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
