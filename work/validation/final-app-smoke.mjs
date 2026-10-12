// DOM integration with a renderer stub. This does NOT validate WebGL rendering.
import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import {parseHTML} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/linkedom/esm/index.js';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const dir='C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/planet-v2';
const realThree=path.resolve(dir,'../node_modules/three/build/three.module.js').replaceAll('\\','/');
const mock=`export * from ${JSON.stringify(realThree)};
import {Texture,Color} from ${JSON.stringify(realThree)};
export class WebGLRenderer {
 constructor(){this.domElement=document.createElement('canvas');this.shadowMap={enabled:false};this.info={render:{calls:0,triangles:0}};}
 setPixelRatio(){} setClearColor(){} setSize(){} dispose(){}
 render(scene,camera){window.__validationScene=scene;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);this.info.render.calls++;}
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
const checks=[];assert.equal(window.littleBloom.getState().viewMode,'meadow');assert.equal(window.littleBloom.getState().preview,true);assert.ok(window.littleBloom.getState().cameraDistance<5);$('globe-view').click();assert.equal(window.littleBloom.getState().viewMode,'globe');assert.ok(window.littleBloom.getState().cameraDistance>8);$('meadow-view').click();assert.equal(window.littleBloom.getState().viewMode,'meadow');assert.ok(window.littleBloom.getState().cameraDistance<5);assert.equal(window.littleBloom.getState().style,'painted-animation');assert.ok(window.littleBloom.getState().grassBlades<20000);assert.equal(window.littleBloom.getState().shadowResolution,2048);checks.push('Meadow and globe cameras switch with safe zoom bounds');checks.push('DOM boot, scene construction, animation loop');
$('sunny-view').click();frames(120);assert.equal(window.littleBloom.getState().weather,'clear');assert.ok(window.littleBloom.getState().night<.1);assert.equal($('time-value').textContent,'08:30');checks.push('Sunny coast shortcut opens bright morning preview');
for(const type of ['clear','cloudy','rain','mist','snow']) {
 document.querySelector(`[data-weather="${type}"]`).click(); frames(120);
 assert.equal(window.littleBloom.getState().weather,type);
 assert.equal(window.littleBloom.getState().preview,true);
 const pollen=window.__validationScene.getObjectByName('Sunlit meadow pollen');
 assert.ok(pollen.geometry.attributes.position.array.every(Number.isFinite));
 assert.ok(Number.isFinite(pollen.material.uniforms.uPollenLight.value));
 if(type==='rain'||type==='snow') assert.equal(pollen.visible,false);
}
checks.push('All weather states update with finite pollen data; rain and snow hide pollen');
$('sunny-view').click();frames(120);
const pollen=window.__validationScene.getObjectByName('Sunlit meadow pollen');assert.equal(pollen.visible,true);
document.querySelector('[data-time="22"]').click();frames(120);assert.ok(window.littleBloom.getState().night>.95);assert.equal(pollen.visible,false);
$('sunny-view').click();frames(120);assert.equal(pollen.visible,true);
const fullGrass=window.littleBloom.getState().renderProfile.grassCount;$('quality-toggle').click();frames(2);assert.ok(window.littleBloom.getState().renderProfile.grassCount<fullGrass*.5);$('quality-toggle').click();frames(2);assert.equal(window.littleBloom.getState().renderProfile.grassCount,fullGrass);
checks.push('Night hides pollen; daylight restores pollen; quality toggle reduces and restores grass');
assert.deepEqual(fatalErrors,[]);
console.log(JSON.stringify({passed:checks.length,checks,shadowResolution:window.littleBloom.getState().shadowResolution,residents:window.littleBloom.getState().residents,note:'Headless DOM and CPU scene integration only; renderer is a stub.'},null,2));
