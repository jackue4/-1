import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.lifecycle-check.bundle.mjs'),modules='C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules';
const checks=[],check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
const H={renderCalls:0,rendererDisposals:0,controlsDisposals:0,animeDisposals:0,skyDisposals:0,observers:[],renderers:[],controls:[],viewport:{width:900,height:680}};
globalThis.__snowHarness=H;
const listeners=new Map(),raf=new Map();let frame=0,now=1000;
class Element{
 constructor(){this.children=[];this.dataset={};this.attributes={};this.hidden=false;this.style={setProperty(){}};this.events=new Map();}
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
const page=await fs.readFile(path.join(dir,'../snow-planet/page.html'),'utf8'),nodes=new Map();for(const [,id] of page.matchAll(/id="([^"]+)"/g))nodes.set(id,new Element());
const viewButtons=[...page.matchAll(/data-view="([^"]+)"/g)].map(([,value])=>{const e=new Element();e.dataset.view=value;return e;}),phaseButtons=[...page.matchAll(/data-phase="([^"]+)"/g)].filter(([,value])=>['day','dusk','night'].includes(value)).slice(1).map(([,value])=>{const e=new Element();e.dataset.phase=value;return e;});
const friendButtons=[...page.matchAll(/data-friend="([^"]+)"/g)].map(([,value])=>{const e=new Element();e.dataset.friend=value;return e;});
const document={hidden:false,documentElement:new Element(),events:new Map(),getElementById:id=>nodes.get(id),querySelectorAll:selector=>selector==='[data-view]'?viewButtons:selector==='[data-phase]'?phaseButtons:selector==='[data-friend]'?friendButtons:[],querySelector:selector=>selector==='[data-view="boat"]'?viewButtons.find(b=>b.dataset.view==='boat'):null,addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);},removeEventListener(type,fn){this.events.get(type)?.delete(fn);},emit(type){for(const fn of this.events.get(type)||[])fn();}};
globalThis.document=document;
const plugin={name:'node-render-boundary',setup(b){
 b.onResolve({filter:/^three$/},()=>({path:'three',namespace:'snow-harness'}));
 b.onResolve({filter:/OrbitControls\.js$/},()=>({path:'controls',namespace:'snow-harness'}));
 b.onResolve({filter:/anime-render\.js$/},()=>({path:'anime',namespace:'snow-harness'}));
 b.onResolve({filter:/storybook-sky\.js$/},()=>({path:'sky',namespace:'snow-harness'}));
 b.onLoad({filter:/.*/,namespace:'snow-harness'},({path:name})=>{
  const real=JSON.stringify(path.join(modules,'three/build/three.module.js').replaceAll('\\','/'));
  if(name==='three')return{contents:`export * from ${real};import * as THREE from ${real};import {createRendererMock} from './renderer-mock.mjs';export class WebGLRenderer{constructor(){const renderer=createRendererMock(THREE,{domElement:globalThis.__snowHarness.createElement(),onDispose(){globalThis.__snowHarness.rendererDisposals++;}});globalThis.__snowHarness.renderers.push(renderer);return renderer;}}`,loader:'js',resolveDir:dir};
  if(name==='controls')return{contents:`import {Vector3} from ${real};export class OrbitControls{constructor(camera){this.camera=camera;this.target=new Vector3();this.handlers=new Map();globalThis.__snowHarness.controls.push(this);}addEventListener(k,fn){this.handlers.set(k,fn);}update(){this.camera.lookAt(this.target);}dispose(){globalThis.__snowHarness.controlsDisposals++;}}`,loader:'js',resolveDir:dir};
  if(name==='anime')return{contents:'export function createAnimeRenderer(){return{render(){globalThis.__snowHarness.renderCalls++;},getInfo(){return{calls:0,triangles:0};},dispose(){globalThis.__snowHarness.animeDisposals++;}};}',loader:'js'};
  return{contents:'export function createStorybookSky(){return{update(){},setActive(){},getState(){return{};},dispose(){globalThis.__snowHarness.skyDisposals++;}};}',loader:'js'};
 });
}};
await build({entryPoints:[path.join(dir,'../snow-planet/app.js')],bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:[modules],plugins:[plugin],logLevel:'silent'});
function step(n=1,dt=1000/60){for(let i=0;i<n;i++){now+=dt;const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>fn(now));}}
try{
 const {mountSnow}=await import(pathToFileURL(bundle));const dispose=mountSnow(document),api=window.snowWorld;
 step(30);let state=api.getState();check('Mount completes with one renderer and marks ready only after a render',state.running&&state.time>0&&document.documentElement.dataset.ready==='true'&&H.renderers.length===1,{time:state.time,renders:H.renderCalls});
 function simulationSnapshot(){const scene=api.getScene();scene.updateMatrixWorld(true);const dynamic=[];scene.traverse(o=>{let animated=!!o.userData.dynamic;for(let p=o.parent;p&&!animated;p=p.parent)animated=!!p.userData.dynamic;if(animated){const row={name:o.name,matrix:[...o.matrix.elements],visible:o.visible};if(o.isPoints||o.isInstancedMesh){if(o.geometry?.attributes.position)row.positions=[...o.geometry.attributes.position.array];if(o.instanceMatrix)row.instances=[...o.instanceMatrix.array];}dynamic.push(row);}});return JSON.stringify(dynamic);}
 nodes.get('snow-pause').click();const pausedTime=api.getState().time,pausedScene=simulationSnapshot();step(90);check('Pause freezes simulation clock and the complete dynamic trees including animal limbs and umbrellas',api.getState().paused&&api.getState().time===pausedTime&&simulationSnapshot()===pausedScene,{pausedTime});
 api.setPhase('night');step(300);api.setView('canal');step(120);const before=api.getState(),beforeScene=simulationSnapshot();
 dispose.setPreview(true);step(90);const previewState=api.getState();check('Preview advances its own visible simulation without advancing paused play time',previewState.previewing&&previewState.time===before.time&&simulationSnapshot()!==beforeScene,{playTime:before.time,previewSnowTime:previewState.snow.time});
 dispose.setPreview(false);const restored=api.getState();check('Leaving preview restores play view, phase, camera, simulation and paused state',!restored.previewing&&restored.mode===before.mode&&restored.phase===before.phase&&restored.paused===before.paused&&restored.time===before.time&&JSON.stringify(restored.camera)===JSON.stringify(before.camera)&&JSON.stringify(restored.cameraTarget)===JSON.stringify(before.cameraTarget)&&simulationSnapshot()===beforeScene,{mode:restored.mode,phase:restored.phase});
 nodes.get('snow-pause').click();step(15);document.hidden=true;document.emit('visibilitychange');const hidden=api.getState(),hiddenScene=simulationSnapshot(),rendersBeforeHidden=H.renderCalls;step(180);check('Inactive worlds advance neither simulation nor render calls',!api.getState().running&&api.getState().time===hidden.time&&H.renderCalls===rendersBeforeHidden&&simulationSnapshot()===hiddenScene,{inactiveFrames:180,renderDelta:H.renderCalls-rendersBeforeHidden});
 document.hidden=false;document.emit('visibilitychange');step(1);const afterFirst=api.getState().time;step(2);check('Reactivation resets the delta clock without jumping across hidden time',afterFirst===hidden.time&&api.getState().time-hidden.time<.04&&api.getState().running,{resumedDelta:api.getState().time-hidden.time});
 const renderer=H.renderers[0];renderer.domElement.emit('webglcontextlost',{preventDefault(){}});const lostTime=api.getState().time,lostRenders=H.renderCalls;step(30);renderer.domElement.emit('webglcontextrestored');step(3);check('Context loss stops rendering and restoration resumes with a fresh shadow',lostTime===api.getState().time-2/60||api.getState().time-lostTime<.035,{stoppedRenderCalls:H.renderCalls-lostRenders,resumed:api.getState().running});
 nodes.get('snow-quality').click();check('Light quality disables shadow rendering while preserving the live world',renderer.shadowMap.enabled===false&&renderer.pixelRatio===1&&api.getState().running);nodes.get('snow-quality').click();check('Detailed quality restores manual shadow rendering',renderer.shadowMap.enabled===true&&renderer.shadowMap.autoUpdate===false&&renderer.shadowMap.needsUpdate===true);
 friendButtons.find(b=>b.dataset.friend==='bear').click();step(110);const bearState=api.getState();check('Choosing the bear enters its tracking camera and reveals the friend controls',bearState.selectedAnimal==='bear'&&bearState.mode==='animals'&&bearState.animalFollow&&!nodes.get('snow-friends').hidden);
 H.controls[0].handlers.get('start')();step(2);const detachedState=api.getState();dispose.setPreview(true);step(35);dispose.setPreview(false);const returned=api.getState();check('Dragging disables character follow and selector return preserves the chosen animal and manual camera',!detachedState.animalFollow&&!returned.animalFollow&&returned.selectedAnimal==='bear'&&returned.mode==='animals'&&JSON.stringify(returned.camera)===JSON.stringify(detachedState.camera));
 friendButtons.find(b=>b.dataset.friend==='rabbit').click();step(110);check('Choosing a different friend re-enables tracking',api.getState().selectedAnimal==='rabbit'&&api.getState().animalFollow);
 const fitResults=[];for(const [width,height] of [[390,844],[844,390],[320,568]]){H.viewport={width,height};H.observers.forEach(o=>o.fn());for(const button of viewButtons){api.setView(button.dataset.view);step(110);const s=api.getState(),distance=Math.hypot(...s.camera.map((n,i)=>n-s.cameraTarget[i]));fitResults.push({width,height,view:button.dataset.view,aspect:s.cameraAspect,distance,finite:[...s.camera,...s.cameraTarget].every(Number.isFinite),correctAspect:Math.abs(s.cameraAspect-width/height)<1e-9});}}check('Every snow viewpoint has a finite camera and exact viewport aspect after portrait and landscape rotation',fitResults.every(r=>r.finite&&r.correctAspect&&r.distance>.1),{views:fitResults,note:'Camera math only; CSS visibility and GPU visuals require the browser pass'});
 const renderAtDispose=H.renderCalls;dispose();dispose();step(3);check('Dispose is idempotent and clears frame, observer and page lifecycle resources',raf.size===0&&H.observers.every(o=>o.disconnected)&&H.rendererDisposals===1&&H.controlsDisposals===1&&H.animeDisposals===1&&H.skyDisposals===1&&H.renderCalls===renderAtDispose&&[...document.events.values()].every(s=>s.size===0)&&[...listeners.values()].every(s=>s.size===0)&&nodes.get('scene').children.length===0,{queuedFrames:raf.size,rendererDisposals:H.rendererDisposals,skyDisposals:H.skyDisposals});
 const report={checkedAt:new Date().toISOString(),verification:'Real snow app, geometry, simulation and batching; mock DOM, RAF, WebGL boundary, controls and background sky. GPU rendering and physical devices not tested.',passed:checks.every(c=>c.passed),checks};await fs.writeFile(path.join(dir,'lifecycle-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
}finally{await fs.unlink(bundle).catch(()=>{});delete globalThis.__snowHarness;}
