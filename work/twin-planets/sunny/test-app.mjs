// DOM integration with a renderer stub. This does NOT validate WebGL rendering.
import {build} from 'esbuild';
import {parseHTML} from 'linkedom';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const dir=path.dirname(fileURLToPath(import.meta.url));
const realThree=path.resolve(dir,'../node_modules/three/build/three.module.js').replaceAll('\\','/');
const mock=`export * from ${JSON.stringify(realThree)};
import {Texture,Color} from ${JSON.stringify(realThree)};
export class WebGLRenderer {
 constructor(){this.domElement=document.createElement('canvas');this.shadowMap={enabled:false};this.info={render:{calls:0,triangles:0}};}
 setPixelRatio(){} setClearColor(){} setSize(){} dispose(){}
 render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);this.info.render.calls++;}
}
export class PMREMGenerator { constructor(){} fromScene(){return {texture:new Texture(),dispose(){}};} dispose(){} }
`;
const bundle=await build({entryPoints:[path.join(dir,'app.js')],bundle:true,format:'iife',write:false,plugins:[{name:'test-renderer-stub',setup(b){b.onResolve({filter:/^three$/},()=>({path:'three-stub',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:mock,loader:'js',resolveDir:dir}));}}]});
const template=await fs.readFile(path.join(dir,'page.html'),'utf8'),{window}=parseHTML(template),{document}=window;
let now=new Date(2026,8,16,12,0,0).getTime(),frame=null,stored=new Map(),fatalErrors=[];
const RealDate=Date;class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const create=document.createElement.bind(document);document.createElement=(name,...args)=>{const el=create(name,...args);if(name==='canvas'){el.setPointerCapture=()=>{};el.releasePointerCapture=()=>{};el.clientHeight=527;el.clientWidth=980;el.getContext=()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}});el.getBoundingClientRect=()=>({left:0,top:0,width:980,height:527});}return el;};
document.getElementById('scene').getBoundingClientRect=()=>({left:150,top:78,width:980,height:527});
const storage={getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)};
const context={window,document,localStorage:storage,Date:FakeDate,performance:{now:()=>now},console:{log:console.log,warn:console.warn,error:(...v)=>fatalErrors.push(v)},devicePixelRatio:1,matchMedia:()=>({matches:false}),ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}},requestAnimationFrame:fn=>(frame=fn,1),cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},addEventListener:window.addEventListener.bind(window),location:{reload(){}},Float32Array,Uint32Array,Uint16Array,Int32Array,Uint8Array,ArrayBuffer,DataView,Math,Map,Set,WeakMap,WeakSet,Promise};
vm.runInNewContext(bundle.outputFiles[0].text,context,{timeout:45000});
assert.deepEqual(fatalErrors,[]);assert.ok(window.littleBloom,'Application boot completed');
function frames(count=90){for(let i=0;i<count;i++){now+=33;const fn=frame;frame=null;assert.ok(fn);fn(now);}}
const $=id=>document.getElementById(id);frames();assert.equal(document.documentElement.dataset.ready,'true');
const checks=[];assert.equal(window.littleBloom.getState().viewMode,'meadow');assert.equal(window.littleBloom.getState().preview,true);assert.ok(window.littleBloom.getState().cameraDistance<5);$('globe-view').click();assert.equal(window.littleBloom.getState().viewMode,'globe');assert.ok(window.littleBloom.getState().cameraDistance>8);$('meadow-view').click();assert.equal(window.littleBloom.getState().viewMode,'meadow');assert.ok(window.littleBloom.getState().cameraDistance<5);assert.equal(window.littleBloom.getState().style,'painted-animation');assert.ok(window.littleBloom.getState().grassBlades<20000);assert.equal(window.littleBloom.getState().shadowResolution,1024);checks.push('Meadow and globe cameras switch with safe zoom bounds');checks.push('DOM boot, scene construction, animation loop');
$('sunny-view').click();frames(120);assert.equal(window.littleBloom.getState().weather,'clear');assert.ok(window.littleBloom.getState().night<.1);assert.equal($('time-value').textContent,'08:30');checks.push('Sunny coast shortcut opens bright morning preview');
const canvas=document.querySelector('#scene canvas');
function pointer(type,id,x,y,pointerType='mouse'){const e=new window.Event(type);Object.assign(e,{pointerId:id,clientX:x,clientY:y,pageX:x,pageY:y,pointerType,button:0});canvas.dispatchEvent(e);}
function orientation(){return [...window.littleBloom.getState().orientation];}
function dot(a,b){return Math.abs(a.reduce((v,n,i)=>v+n*b[i],0));}
const original=orientation(),cameraBefore=[...window.littleBloom.getState().cameraPosition];
pointer('pointerdown',1,200,240);
for(let i=1;i<=12;i++){pointer('pointermove',1,200+527*i/12,240);if(i===6)assert.ok(dot(original,orientation())<.01,'half turn reveals opposite hemisphere');}
pointer('pointerup',1,727,240);assert.ok(dot(original,orientation())>.99999,'horizontal full revolution returns to start');
pointer('pointerdown',2,200,240);
for(let i=1;i<=12;i++){pointer('pointermove',2,200,240+527*i/12);if(i===6)assert.ok(dot(original,orientation())<.01,'vertical drag passes the old polar limit');}
pointer('pointerup',2,200,767);assert.ok(dot(original,orientation())>.99999);assert.deepEqual([...window.littleBloom.getState().cameraPosition],cameraBefore);
pointer('pointerdown',3,200,240);pointer('pointercancel',3,200,240);pointer('pointermove',3,400,400);assert.ok(dot(original,orientation())>.99999);
pointer('pointerdown',4,200,240,'touch');pointer('pointerdown',5,280,240,'touch');const distanceBefore=window.littleBloom.getState().cameraDistance;
pointer('pointermove',5,360,240,'touch');assert.ok(dot(original,orientation())>.99999,'two fingers do not also rotate surface');assert.ok(window.littleBloom.getState().cameraDistance<distanceBefore,'pinch still zooms');
pointer('pointerup',5,360,240,'touch');pointer('pointerup',4,200,240,'touch');$('home-view').click();
checks.push('Mouse and touch roam through both hemispheres, cancel cleanly and preserve pinch zoom');
const backgrounds=new Set();
for(const [hour,phase] of [[8.5,'morning'],[17.5,'dusk'],[22,'night']]){
  document.querySelector(`[data-time="${hour}"]`).click();frames(120);assert.equal(document.documentElement.dataset.phase,phase);assert.equal(window.littleBloom.getState().timeHour,hour);assert.equal(document.querySelector(`[data-time="${hour}"]`).getAttribute('aria-pressed'),'true');backgrounds.add(document.body.style.backgroundColor);
  if(phase==='dusk'){assert.ok(window.littleBloom.getState().sunset>.95);assert.equal(window.littleBloom.getState().streetLights.on,true);}if(phase==='night'){assert.ok(window.littleBloom.getState().night>.95);assert.equal(window.littleBloom.getState().streetLights.on,true);assert.equal(window.littleBloom.getState().homes.bedtime,true);assert.ok(window.littleBloom.getState().nightSky.visibility>.5);assert.equal(window.littleBloom.getState().nightSky.stars,1100);}
}
assert.equal(backgrounds.size,3);$('natural-time').click();frames();assert.equal(window.littleBloom.getState().preview,false);assert.equal($('natural-time').getAttribute('aria-pressed'),'true');$('sunny-view').click();frames();
checks.push('Morning, dusk and night presets change light and sky; natural time restores live weather');
for(const type of ['clear','cloudy','rain','mist','snow']){document.querySelector(`[data-weather="${type}"]`).click();frames();assert.equal(window.littleBloom.getState().weather,type);assert.equal(window.littleBloom.getState().preview,true);assert.equal($('weather-mode').textContent,'预览中');}
checks.push('All five preview weather controls update scene and UI state');
$('time-range').value='0';$('time-range').dispatchEvent(new window.Event('input'));frames(120);assert.ok(window.littleBloom.getState().night>.9);assert.equal($('phase-label').textContent,'月光时刻');
$('time-range').value='12';$('time-range').dispatchEvent(new window.Event('input'));frames(120);assert.ok(window.littleBloom.getState().night<.1);checks.push('Day / night slider drives lighting state');
$('return-live').click();frames();assert.equal(window.littleBloom.getState().preview,false);assert.equal(window.littleBloom.getState().weather,window.littleBloom.getState().naturalWeather);checks.push('Return to today clears both weather and time overrides');
$('encounter').click();frames();assert.ok(window.littleBloom.getState().history.length>=1);assert.ok($('event-title').textContent.length>0);$('diary-toggle').click();assert.equal($('diary').hidden,false);assert.ok($('diary-list').children.length>0);$('diary-close').click();assert.equal($('diary').hidden,true);checks.push('Encounter, persisted event log and diary controls');
const oldDate=window.littleBloom.getState().date;now=new RealDate(2026,8,17,0,0,1).getTime();frames(2);assert.notEqual(window.littleBloom.getState().date,oldDate);assert.equal(window.littleBloom.getState().date,'2026-09-17');assert.equal(window.littleBloom.getState().history.length,0);checks.push('Open page rolls weather and diary over at midnight');
now+=80000;frames(2);assert.ok(window.littleBloom.getState().history.length>0);checks.push('Scheduled encounter happens while page is open');
$('return-live').click();frames();$('travel-button').click();frames(2);let travel=window.littleBloom.getState().travel;assert.equal(travel.away,true);assert.equal($('travel-button').disabled,true);assert.equal($('pet-status').textContent.startsWith('正在前往'),true);now+=110000;frames(2);travel=window.littleBloom.getState().travel;assert.equal(travel.away,false);assert.equal(travel.postcards.length,1);assert.equal($('postcard-count').textContent,'1');checks.push('Pet packs, leaves the island, returns with a postcard and persists the trip');
$('sunny-view').click();$('build-replay').click();frames(40);assert.equal(window.littleBloom.getState().shadowEveryFrame,true);
let building=window.littleBloom.getState().construction;assert.ok(building.elapsed>0);assert.equal(new Set(building.workers.map(p=>p.species)).size,4);
$('build-pause').click();const pausedAt=window.littleBloom.getState().construction.elapsed;frames(60);assert.equal(window.littleBloom.getState().construction.elapsed,pausedAt);
$('build-pause').click();$('build-speed').click();frames(60);assert.ok(window.littleBloom.getState().construction.elapsed-pausedAt>5);
const previewAt=window.littleBloom.getState().construction.elapsed;$('build-preview').click();frames(45);assert.equal(window.littleBloom.getState().construction.elapsed,previewAt);assert.equal(window.littleBloom.getState().construction.complete,true);$('build-preview').click();frames(2);assert.equal(window.littleBloom.getState().construction.complete,false);
Object.defineProperty(document,'hidden',{value:true,writable:true,configurable:true});document.dispatchEvent(new window.Event('visibilitychange'));const hiddenAt=window.littleBloom.getState().construction.elapsed;frames(60);assert.equal(window.littleBloom.getState().construction.elapsed,hiddenAt);document.hidden=false;document.dispatchEvent(new window.Event('visibilitychange'));
document.querySelector('[data-weather="rain"]').click();const rainAt=window.littleBloom.getState().construction.elapsed;frames(40);assert.equal(window.littleBloom.getState().construction.elapsed,rainAt);document.querySelector('[data-time="22"]').click();frames(40);assert.equal(window.littleBloom.getState().construction.elapsed,rainAt);
$('sunny-view').click();frames(3400);assert.equal(window.littleBloom.getState().construction.complete,true);assert.equal($('build-pause').disabled,true);assert.equal($('build-progress').getAttribute('aria-valuenow'),'100');
const tripBefore=JSON.stringify(window.littleBloom.getState().travel);$('build-replay').click();assert.equal(window.littleBloom.getState().construction.elapsed,0);assert.equal(JSON.stringify(window.littleBloom.getState().travel),tripBefore);assert.equal(JSON.parse(stored.get('little-bloom.ecosystem.v2')).construction.elapsed,0);
checks.push('Construction pause, speed, preview, hidden-tab pause, weather rest, completion and isolated replay');
$('rotate-toggle').click();assert.equal($('rotate-toggle').getAttribute('aria-pressed'),'true');assert.equal(window.littleBloom.getState().viewMode,'globe');$('rotate-toggle').click();assert.equal($('rotate-toggle').getAttribute('aria-pressed'),'false');$('quality-toggle').click();assert.equal($('quality-toggle').getAttribute('aria-pressed'),'true');$('home-view').click();frames();checks.push('Rotation, quality and home view controls');
$('coast-view').click();const coastOrientation=orientation();frames(60);assert.equal(window.littleBloom.getState().viewMode,'meadow');assert.equal($('coast-view').getAttribute('aria-pressed'),'true');assert.ok(dot(coastOrientation,orientation())>.9999,'construction follow must not hijack the coast view');assert.ok(window.littleBloom.getState().cameraDistance<4);$('meadow-view').click();assert.equal($('coast-view').getAttribute('aria-pressed'),'false');checks.push('Coral bay shortcut preserves free surface controls and disables construction camera following');
const savedConstruction=window.littleBloom.getState().construction.elapsed;
$('build-preview').click();frames(2);$('cottage-view').click();frames(30);
assert.equal(window.littleBloom.getState().viewMode,'meadow');assert.ok(window.littleBloom.getState().cameraDistance<3);
assert.ok($('toast').textContent.includes('海风小屋'));const cottageOrientation=orientation();frames(30);assert.ok(dot(cottageOrientation,orientation())>.9999);
pointer('pointerdown',88,490,263);pointer('pointerup',88,490,263);frames(60);
assert.ok(window.littleBloom.getCottages().some(c=>c.welcoming&&c.doorAmount>.9),'click on visible cottage opens its door');
$('cottage-view').click();assert.ok($('toast').textContent.includes('薄荷邮局'));assert.equal(window.littleBloom.getState().construction.elapsed,savedConstruction);
$('build-preview').click();checks.push('Cottage tour cycles completed homes, actual raycast opens door, preview preserves build save');
assert.equal(window.littleBloom.getState().cottages,2);
const animalNames=new Set();for(let i=0;i<4;i++){$('animal-view').click();frames(12);const state=window.littleBloom.getState();assert.ok(state.focusedAnimal);animalNames.add(state.focusedAnimal);assert.ok(state.cameraDistance<1.6);assert.equal($('animal-view').getAttribute('aria-pressed'),'true');}
assert.equal(animalNames.size,4);pointer('pointerdown',91,300,250);pointer('pointermove',91,360,265);pointer('pointerup',91,360,265);assert.equal(window.littleBloom.getState().focusedAnimal,null);assert.equal($('animal-view').getAttribute('aria-pressed'),'false');$('animal-view').click();$('globe-view').click();assert.equal(window.littleBloom.getState().focusedAnimal,null);
checks.push('Two-home layout and four-animal close-up tour; dragging and globe view exit follow mode');
assert.deepEqual(fatalErrors,[]);console.log(JSON.stringify({passed:checks.length,checks,note:'Headless DOM integration; WebGL renderer was stubbed.'},null,2));
