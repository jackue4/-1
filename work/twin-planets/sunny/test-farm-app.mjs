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
vm.runInNewContext(bundle.outputFiles[0].text,context,{timeout:20000});
assert.deepEqual(fatalErrors,[]);assert.ok(window.littleBloom,'Application boot completed');
function frames(count=90){for(let i=0;i<count;i++){now+=33;const fn=frame;frame=null;assert.ok(fn);fn(now);}}
const $=id=>document.getElementById(id);frames();assert.equal(document.documentElement.dataset.ready,'true');

const checks=[];
const snapshot=()=>window.littleBloom.getState().farm;
assert.equal(snapshot().unlocked,6);assert.equal(document.documentElement.dataset.panel,'farm');
$('farm-helpers').click(); // Manual actions must remain meaningful with helpers resting.
$('plot-0').click();$('seed-radish').click();$('farm-plant').click();assert.equal(snapshot().plots[0].crop,'radish');
const seeds=snapshot().seeds.radish;$('farm-plant').click();assert.equal(snapshot().seeds.radish,seeds);$('farm-water').click();assert.equal(snapshot().plots[0].water,100);
now+=60000;frames(20);assert.equal(snapshot().plots[0].growth,1);assert.equal($('farm-harvest').disabled,false);$('farm-harvest').click();assert.equal(snapshot().produce.radish,2);
$('plot-1').click();$('seed-wheat').click();$('farm-plant').click();$('farm-water').click();now+=101000;frames(20);assert.equal(snapshot().plots[1].growth,1);$('farm-harvest').click();
document.querySelector('[data-farm-tab="pantry"]').click();const snacks=window.littleBloom.getState().travel.snacks;$('cook-picnic').click();assert.equal(window.littleBloom.getState().travel.snacks,snacks+2);assert.equal(snapshot().produce.radish,0);assert.equal(snapshot().produce.wheat,1);checks.push('HTML planting, watering, timed growth, harvest and cooking consume real inventory');
document.querySelector('[data-pane="travel"]').click();assert.equal($('farm-panel').hidden,true);assert.equal(document.querySelector('.pet-card').hidden,false);$('travel-button').click();now+=110000;frames(20);assert.equal(snapshot().strawberry,true);assert.equal(snapshot().seeds.strawberry,2);const postcards=window.littleBloom.getState().travel.postcards.length;frames(20);assert.equal(snapshot().seeds.strawberry,2);assert.equal(window.littleBloom.getState().travel.postcards.length,postcards);checks.push('Trip returns a postcard and two special seeds exactly once');
$('farm-focus').click();document.querySelector('[data-farm-tab="garden"]').click();$('plot-0').click();$('seed-strawberry').click();$('farm-plant').click();assert.equal(snapshot().plots[0].crop,'strawberry');checks.push('Returned seeds can immediately be planted; farm focus restores the garden');
$('plot-2').click();$('seed-radish').click();$('farm-plant').click();$('farm-water').click();now+=60000;frames(20);$('farm-harvest').click();document.querySelector('[data-farm-tab="village"]').click();$('farm-order').click();assert.equal(snapshot().orders,1);$('farm-expand').click();assert.equal(snapshot().unlocked,12);$('plot-6').click();assert.ok($('plot-title').textContent.includes('7'));checks.push('Neighbor order funds a real six-plot expansion');
const persisted=JSON.parse(stored.get('little-bloom.ecosystem.v2'));assert.equal(persisted.farm.unlocked,12);assert.equal(persisted.farm.plots[0].crop,'strawberry');assert.equal(persisted.travel.postcards.length,postcards);checks.push('Farming, construction and travel share a preserved persistent save');
// Exercise actual raycasting against a projected soil bed, then reject a dragged click.
$('farm-focus').click();frames(2);
const {Vector3,Quaternion,PerspectiveCamera}=await import("file:///"+realThree);
const state=window.littleBloom.getState(),cam=new PerspectiveCamera(38,980/527,.1,60);cam.position.fromArray(state.cameraPosition);cam.lookAt(0,2.67,0);cam.updateMatrixWorld();
const lat=.44,lon=.136,n=new Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
const pos=n.clone().multiplyScalar(2.45+.14+.05).applyQuaternion(new Quaternion().fromArray(state.orientation)).project(cam),x=(pos.x+1)*490,y=(1-pos.y)*263.5;
const canvas=document.querySelector('#scene canvas');function pointer(type,x,y){const e=new window.Event(type);Object.assign(e,{pointerId:4,clientX:x,clientY:y,pageX:x,pageY:y,pointerType:'mouse',button:0});canvas.dispatchEvent(e);}
pointer('pointerdown',x,y);pointer('pointerup',x,y);assert.ok($('plot-title').textContent.startsWith('第 6 块田'),'3D bed click selects plot 6');const title=$('plot-title').textContent;pointer('pointerdown',x,y);pointer('pointermove',x+30,y+30);pointer('pointerup',x+30,y+30);assert.equal($('plot-title').textContent,title);checks.push('Actual Three raycast selects a visible plot while dragging does not trigger planting');

// Start a genuinely new DOM and application from the saved JSON.
function reloadApp(storage){const {window:w}=parseHTML(template),d=w.document;const create=d.createElement.bind(d);d.createElement=(name,...args)=>{const e=create(name,...args);if(name==='canvas'){e.setPointerCapture=()=>{};e.releasePointerCapture=()=>{};e.clientHeight=527;e.clientWidth=980;e.getContext=()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}});e.getBoundingClientRect=()=>({left:0,top:0,width:980,height:527});}return e;};d.getElementById('scene').getBoundingClientRect=()=>({left:0,top:0,width:980,height:527});const ctx={...context,window:w,document:d,localStorage:storage,addEventListener:w.addEventListener.bind(w),requestAnimationFrame:()=>1};vm.runInNewContext(bundle.outputFiles[0].text,ctx,{timeout:20000});return {w,d};}
const raw=JSON.parse(stored.get('little-bloom.ecosystem.v2'));now+=900000;raw.travel.awayUntil=now-1;raw.travel.destination='珊瑚湾';const beforeSeed=raw.farm.seeds.strawberry;stored.set('little-bloom.ecosystem.v2',JSON.stringify(raw));
const reloaded=reloadApp(storage),restored=reloaded.w.littleBloom.getState();assert.equal(restored.farm.unlocked,12);assert.equal(restored.farm.plots[0].growth,1);assert.equal(restored.farm.seeds.strawberry,beforeSeed+2);assert.equal(restored.travel.awayUntil,0);assert.equal(restored.construction.elapsed,raw.construction.elapsed);checks.push('Full new-app reload preserves the island, settles offline growth and awards an overdue trip once');
const again=reloadApp(storage);assert.equal(again.w.littleBloom.getState().farm.seeds.strawberry,beforeSeed+2);const blocked=reloadApp({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});assert.ok(blocked.w.littleBloom);assert.equal(blocked.w.littleBloom.getState().storageAvailable,false);assert.ok(blocked.d.getElementById('farm-save').textContent.includes('无法保存'));checks.push('Second reload cannot duplicate trip reward; blocked storage shows a visible warning and stays playable');
assert.deepEqual(fatalErrors,[]);console.log(JSON.stringify({passed:checks.length,checks,note:'Real DOM and Three scene; renderer stubbed, not browser GPU validation.'},null,2));

