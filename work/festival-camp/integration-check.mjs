import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.integration-check.bundle.mjs'),modules='C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules';
const checks=[],check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
const H={frameCallbacks:0,renderCalls:0,rendererDisposals:0,controlsDisposals:0,animeDisposals:0,skyDisposals:0,observers:[],renderers:[],controls:[],viewport:{width:900,height:680}};
globalThis.__parkHarness=H;
const listeners=new Map(),raf=new Map();let frame=0,now=1000;
class Element{
 constructor(){this.children=[];this.dataset={};this.attributes={};this.hidden=false;this.style={setProperty(){}};this.events=new Map();this.classList={add(){},remove(){}};}
 append(child){this.children.push(child);child.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
 setAttribute(k,v){this.attributes[k]=String(v);}
 addEventListener(k,fn){if(!this.events.has(k))this.events.set(k,new Set());this.events.get(k).add(fn);}
 removeEventListener(k,fn){this.events.get(k)?.delete(fn);}
 emit(k,event={}){for(const fn of this.events.get(k)||[])fn(event);}
 click(){this.onclick?.();this.emit('click');}
 getBoundingClientRect(){return{...H.viewport,left:0,top:0};}
}
H.createElement=()=>new Element();
globalThis.matchMedia=()=>({matches:false});globalThis.devicePixelRatio=1;
globalThis.window={};
globalThis.requestAnimationFrame=fn=>{const id=++frame;raf.set(id,fn);return id;};globalThis.cancelAnimationFrame=id=>raf.delete(id);
globalThis.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);};globalThis.removeEventListener=(type,fn)=>listeners.get(type)?.delete(fn);
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;this.disconnected=false;H.observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
const page=await fs.readFile(path.join(dir,'../festival-planet/page.html'),'utf8'),nodes=new Map();for(const [,id] of page.matchAll(/id="([^"]+)"/g))nodes.set(id,new Element());
const viewButtons=[...page.matchAll(/data-view="([^"]+)"/g)].map(([,value])=>{const e=new Element();e.dataset.view=value;return e;}),phaseButtons=[...page.matchAll(/data-phase="([^"]+)"/g)].filter(([,value])=>['day','dusk','night'].includes(value)).map(([,value])=>{const e=new Element();e.dataset.phase=value;return e;});
const friendButtons=[...page.matchAll(/data-animal="([^"]+)"/g)].map(([,value])=>{const e=new Element();e.dataset.animal=value;return e;});
const document={hidden:false,documentElement:new Element(),events:new Map(),getElementById:id=>nodes.get(id),querySelectorAll:selector=>selector==='[data-view]'?viewButtons:selector==='[data-phase]'?phaseButtons:selector==='[data-animal]'?friendButtons:[],querySelector:selector=>selector==='[data-view="boat"]'?viewButtons.find(b=>b.dataset.view==='boat'):null,addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);},removeEventListener(type,fn){this.events.get(type)?.delete(fn);},emit(type){for(const fn of this.events.get(type)||[])fn();}};
document.createElement=()=>({width:1,height:1,getContext:()=>new Proxy({},{get:()=>()=>{}})});globalThis.document=document;
const plugin={name:'node-render-boundary',setup(b){
 b.onResolve({filter:/^three$/},()=>({path:'three',namespace:'park-harness'}));
 b.onResolve({filter:/OrbitControls\.js$/},()=>({path:'controls',namespace:'park-harness'}));
 b.onResolve({filter:/anime-render\.js$/},()=>({path:'anime',namespace:'park-harness'}));
 b.onResolve({filter:/storybook-sky\.js$/},()=>({path:'sky',namespace:'park-harness'}));
 b.onLoad({filter:/.*/,namespace:'park-harness'},({path:name})=>{
  const real=JSON.stringify(path.join(modules,'three/build/three.module.js').replaceAll('\\','/'));
  if(name==='three')return{contents:`export * from ${real};import * as THREE from ${real};import {createRendererMock} from '../snow-polish/renderer-mock.mjs';export class WebGLRenderer{constructor(){const renderer=createRendererMock(THREE,{domElement:globalThis.__parkHarness.createElement(),onDispose(){globalThis.__parkHarness.rendererDisposals++;}});globalThis.__parkHarness.renderers.push(renderer);return renderer;}}`,loader:'js',resolveDir:dir};
  if(name==='controls')return{contents:`import {Vector3} from ${real};export class OrbitControls{constructor(camera){this.camera=camera;this.target=new Vector3();this.handlers=new Map();globalThis.__parkHarness.controls.push(this);}addEventListener(k,fn){this.handlers.set(k,fn);}update(){this.camera.lookAt(this.target);}dispose(){globalThis.__parkHarness.controlsDisposals++;}}`,loader:'js',resolveDir:dir};
  if(name==='anime')return{contents:'export function createAnimeRenderer(){return{render(){globalThis.__parkHarness.renderCalls++;},getInfo(){return{calls:0,triangles:0};},dispose(){globalThis.__parkHarness.animeDisposals++;}};}',loader:'js'};
  return{contents:'export function createStorybookSky(){return{update(){},setActive(){},getState(){return{};},dispose(){globalThis.__parkHarness.skyDisposals++;}};}',loader:'js'};
 });
}};
await build({entryPoints:[path.join(dir,'../festival-planet/app.js')],bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:[modules],plugins:[plugin],logLevel:'silent'});
function step(n=1,dt=1000/60){for(let i=0;i<n;i++){now+=dt;const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>{H.frameCallbacks++;fn(now);});}}
try{
 const {mountFestival}=await import(pathToFileURL(bundle)),dispose=mountFestival(document),api=window.festivalWorld;
 step(10);const scene=api.getScene(),campRoot=scene.getObjectByName('林间露营 · 星光营地');
 check('The real campsite is mounted before first render and available through public state and one view button',!!campRoot&&!!api.getState().camp&&viewButtons.filter(b=>b.dataset.view==='camp').length===1&&document.documentElement.dataset.ready==='true',{camp:api.getState().camp});
 if(!campRoot)throw new Error('The integrated campsite root must be named 林间露营 · 星光营地');
 function snapshot(){scene.updateMatrixWorld(true);const rows=[];campRoot.traverse(o=>{const row={name:o.name,matrix:[...o.matrix.elements],visible:o.visible};if(o.isInstancedMesh)row.instances=[...o.instanceMatrix.array];if(o.isLight){row.intensity=o.intensity;row.color=o.color.toArray();}for(const [key,a] of Object.entries(o.geometry?.attributes||{}))if(a.usage===35048)row[key]=[...a.array];const mats=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];row.materials=mats.map(m=>({opacity:m.opacity,emissive:m.emissiveIntensity,uniforms:Object.fromEntries(Object.entries(m.uniforms||{}).filter(([,v])=>typeof v.value==='number').map(([k,v])=>[k,v.value]))}));rows.push(row);});return JSON.stringify(rows);}
 const cameraViews=[];for(const [width,height]of [[900,680],[390,844],[844,390],[320,568]]){H.viewport={width,height};H.observers.forEach(o=>o.fn());api.setView('camp');step(115);const s=api.getState();cameraViews.push({width,height,aspect:s.cameraAspect,finite:[...s.camera,...s.cameraTarget].every(Number.isFinite),distance:Math.hypot(...s.camera.map((n,i)=>n-s.cameraTarget[i]))});}
 check('The campsite camera is finite and fitted to desktop, narrow portrait and landscape viewports',cameraViews.every(v=>v.finite&&Math.abs(v.aspect-v.width/v.height)<1e-10&&v.distance>.4),{views:cameraViews,note:'Camera math only; GPU visuals and CSS are checked separately.'});
 check('The campsite view hides animal-only controls and publishes its daytime caption',nodes.get('park-friends').hidden&&api.getState().mode==='camp'&&nodes.get('ride-caption').textContent.includes('露营日'));
 nodes.get('park-pause').click();step(2);const paused=api.getState(),pausedSnap=snapshot(),pausedCamp=JSON.stringify(paused.camp),pauseRenders=H.renderCalls;step(120);
 check('Pause freezes all campsite geometry, uniforms, lights and simulation without scheduling WebGL renders',api.getState().time===paused.time&&snapshot()===pausedSnap&&JSON.stringify(api.getState().camp)===pausedCamp&&H.renderCalls===pauseRenders);
 api.setPhase('night');step(900);const night=api.getState(),nightSnap=snapshot(),nightState=JSON.stringify(night.camp);check('A paused phase change updates campsite lighting while keeping animation time fixed',night.env.night===1&&night.time===paused.time&&nightSnap!==pausedSnap&&nodes.get('ride-caption').textContent.includes('篝火'),{camp:night.camp});
 const nightRenders=H.renderCalls;step(60);check('Converged night returns to the existing zero-render paused schedule',H.renderCalls===nightRenders&&snapshot()===nightSnap);
 dispose.setPreview(true);step(120);check('Selector preview has its own campsite animation and daylight while preserving paused game time',api.getState().previewing&&api.getState().time===night.time&&snapshot()!==nightSnap);
 dispose.setPreview(false);const restored=api.getState();check('Preview exit restores the campsite immediately, before another RAF, including night, camera and all dynamic transforms',!restored.previewing&&restored.mode==='camp'&&restored.phase==='night'&&restored.paused&&restored.time===night.time&&JSON.stringify(restored.camera)===JSON.stringify(night.camera)&&JSON.stringify(restored.camp)===nightState&&snapshot()===nightSnap);
 nodes.get('park-pause').click();step(4);document.hidden=true;document.emit('visibilitychange');const hidden=api.getState(),hiddenSnap=snapshot(),hiddenRenders=H.renderCalls;step(90);check('A hidden campsite queues no RAF and advances neither simulation nor rendering',raf.size===0&&api.getState().time===hidden.time&&H.renderCalls===hiddenRenders&&snapshot()===hiddenSnap);
 document.hidden=false;document.emit('visibilitychange');step(3);check('Reactivation resumes without adding the hidden interval to campsite time',api.getState().time-hidden.time<.04&&raf.size===1);
 const renderer=H.renderers[0];renderer.domElement.emit('webglcontextlost',{preventDefault(){}});const lost=api.getState().time,lostRenders=H.renderCalls;step(8);const stopped=H.renderCalls===lostRenders&&api.getState().time===lost;renderer.domElement.emit('webglcontextrestored');step(4);check('Context restoration retains the camp and resumes without a simulation jump',stopped&&api.getState().camp&&api.getState().time-lost<.06);
 const geometries=new Map(),materials=new Map(),textures=new Map();scene.traverse(o=>{if(o.geometry)geometries.set(o.geometry,0);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.set(m,0);for(const value of Object.values(m))if(value?.isTexture)textures.set(value,0);}});for(const map of [geometries,materials,textures])for(const resource of map.keys())resource.addEventListener('dispose',()=>map.set(resource,map.get(resource)+1));
 const campGeometries=new Set();campRoot.traverse(o=>{if(o.geometry)campGeometries.add(o.geometry);});const renders=H.renderCalls;dispose();dispose();step(3);check('Disposal frees all live campsite geometry exactly once, detaches its root, and keeps lifecycle disposal idempotent',campGeometries.size>0&&[...campGeometries].every(g=>geometries.get(g)===1)&&campRoot.parent===null&&raf.size===0&&H.renderCalls===renders&&H.rendererDisposals===1&&H.skyDisposals===1,{campGeometries:campGeometries.size,campDisposeCounts:[...new Set([...campGeometries].map(g=>geometries.get(g)))],rendererDisposals:H.rendererDisposals});
 const report={checkedAt:new Date().toISOString(),passed:checks.every(x=>x.passed),method:'Real production festival app, campsite geometry, batching, material uniforms and absolute-time animation. DOM, WebGL, controls and background sky are boundaries; actual pixels and physical devices are not verified by this script.',checks};await fs.writeFile(path.join(dir,'integration-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
}finally{await fs.unlink(bundle).catch(()=>{});delete globalThis.__parkHarness;}
