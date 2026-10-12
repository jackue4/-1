import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.integration-check.bundle.mjs'),modules='C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules';
const checks=[],check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
const H={frameCallbacks:0,renderCalls:0,rendererDisposals:0,controlsDisposals:0,animeDisposals:0,skyDisposals:0,observers:[],renderers:[],controls:[],viewport:{width:900,height:680}};
globalThis.__desertHarness=H;
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
globalThis.matchMedia=query=>({matches:!query.includes('reduced-motion')&&process.argv.includes('--mobile')});globalThis.devicePixelRatio=2;
globalThis.window={};
globalThis.requestAnimationFrame=fn=>{const id=++frame;raf.set(id,fn);return id;};globalThis.cancelAnimationFrame=id=>raf.delete(id);
globalThis.addEventListener=(type,fn)=>{if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);};globalThis.removeEventListener=(type,fn)=>listeners.get(type)?.delete(fn);
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;this.disconnected=false;H.observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
const page=await fs.readFile(path.join(dir,'../desert-planet/page.html'),'utf8'),nodes=new Map();for(const [,id] of page.matchAll(/id="([^"]+)"/g))nodes.set(id,new Element());
const viewButtons=[...page.matchAll(/data-view="([^"]+)"/g)].map(([,value])=>{const e=new Element();e.dataset.view=value;return e;}),phaseButtons=[...page.matchAll(/data-phase="([^"]+)"/g)].filter(([,value])=>['day','dusk','night'].includes(value)).map(([,value])=>{const e=new Element();e.dataset.phase=value;return e;});
const friendButtons=[...page.matchAll(/data-animal="([^"]+)"/g)].map(([,value])=>{const e=new Element();e.dataset.animal=value;return e;});
const document={hidden:false,documentElement:new Element(),events:new Map(),getElementById:id=>nodes.get(id),querySelectorAll:selector=>selector==='[data-view]'?viewButtons:selector==='[data-phase]'?phaseButtons:selector==='[data-animal]'?friendButtons:[],querySelector:selector=>selector==='[data-view="boat"]'?viewButtons.find(b=>b.dataset.view==='boat'):null,addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);},removeEventListener(type,fn){this.events.get(type)?.delete(fn);},emit(type){for(const fn of this.events.get(type)||[])fn();}};
document.createElement=()=>({width:1,height:1,getContext:()=>new Proxy({},{get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}})});globalThis.document=document;
const plugin={name:'node-render-boundary',setup(b){
 b.onResolve({filter:/^three$/},()=>({path:'three',namespace:'park-harness'}));
 b.onResolve({filter:/OrbitControls\.js$/},()=>({path:'controls',namespace:'park-harness'}));
 b.onResolve({filter:/anime-render\.js$/},()=>({path:'anime',namespace:'park-harness'}));
 b.onResolve({filter:/storybook-sky\.js$/},()=>({path:'sky',namespace:'park-harness'}));
 b.onLoad({filter:/.*/,namespace:'park-harness'},({path:name})=>{
  const real=JSON.stringify(path.join(modules,'three/build/three.module.js').replaceAll('\\','/'));
  if(name==='three')return{contents:`export * from ${real};import * as THREE from ${real};import {createRendererMock} from '../snow-polish/renderer-mock.mjs';export class WebGLRenderer{constructor(){const renderer=createRendererMock(THREE,{domElement:globalThis.__desertHarness.createElement(),onDispose(){globalThis.__desertHarness.rendererDisposals++;}});globalThis.__desertHarness.renderers.push(renderer);return renderer;}}`,loader:'js',resolveDir:dir};
  if(name==='controls')return{contents:`import {Vector3} from ${real};export class OrbitControls{constructor(camera){this.camera=camera;this.target=new Vector3();this.handlers=new Map();globalThis.__desertHarness.controls.push(this);}addEventListener(k,fn){this.handlers.set(k,fn);}update(){this.camera.lookAt(this.target);}dispose(){globalThis.__desertHarness.controlsDisposals++;}}`,loader:'js',resolveDir:dir};
  if(name==='anime')return{contents:'export function createAnimeRenderer(){return{render(){globalThis.__desertHarness.renderCalls++;},getInfo(){return{calls:0,triangles:0};},dispose(){globalThis.__desertHarness.animeDisposals++;}};}',loader:'js'};
  return{contents:'export function createStorybookSky(){return{update(dt,env){globalThis.__desertHarness.skyEnv={...env};},setActive(active){globalThis.__desertHarness.skyActive=active;},getState(){return{};},dispose(){globalThis.__desertHarness.skyDisposals++;}};}',loader:'js'};
 });
}};
await build({entryPoints:[path.join(dir,'../desert-planet/app.js')],bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:[modules],plugins:[plugin],logLevel:'silent'});
function step(n=1,dt=1000/60){for(let i=0;i<n;i++){now+=dt;const callbacks=[...raf.values()];raf.clear();callbacks.forEach(fn=>{H.frameCallbacks++;fn(now);});}}
try{
 const {mountDesert}=await import(pathToFileURL(bundle)),dispose=mountDesert(document),api=window.desertWorld;
 step(6);const scene=api.getScene(),planet=scene.getObjectByName('沙海拾光 · Where the dunes meet the sea');
 check('The real desert world mounts before readiness with its nine camera controls',!!planet&&planet.children.length>0&&viewButtons.length===9&&document.documentElement.dataset.ready==='true'&&H.renderCalls>0,{scenery:api.getState().scenery});
 function snapshot(){
  planet.updateMatrixWorld(true);const rows=[];
  const uniformValue=value=>typeof value==='number'||typeof value==='boolean'?value:Array.isArray(value)?value.map(uniformValue):ArrayBuffer.isView(value)?[...value]:value?.toArray&&!value.isTexture?value.toArray():undefined;
  planet.traverse(o=>{
   const row={name:o.name,matrix:[...o.matrix.elements],visible:o.visible};
   if(o.isInstancedMesh)row.instances=[...o.instanceMatrix.array];if(o.isLight){row.intensity=o.intensity;row.color=o.color.toArray();}
   for(const [key,a]of Object.entries(o.geometry?.attributes||{}))if(a.usage===35048)row[key]=[...a.array];
   row.materials=(o.material?(Array.isArray(o.material)?o.material:[o.material]):[]).map(m=>({opacity:m.opacity,emissive:m.emissiveIntensity,uniforms:Object.fromEntries(Object.entries(m.uniforms||{}).map(([k,v])=>[k,uniformValue(v.value)]).filter(([,v])=>v!==undefined))}));rows.push(row);
  });return JSON.stringify(rows);
 }
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const mummyRoot=planet.getObjectByName('月光奇遇 · 会发光的绷带小旅人');
 function visibleMummyDraws(){let count=0;mummyRoot?.traverseVisible(o=>{if(o.isMesh||o.isPoints)count++;});return count;}
 const initialMummies=api.getState().worldState.mummies;
 check('All mummy bodies, ground glows and sparkles are hidden during daylight',!!mummyRoot&&!mummyRoot.visible&&visibleMummyDraws()===0&&!initialMummies.visible&&initialMummies.visibleCount===0&&initialMummies.actors.every(a=>a.alpha===0));
 const cameraViews=[];
 for(const [width,height]of [[1280,800],[390,844],[844,390],[320,568],[568,320]]){
  H.viewport={width,height};H.observers.forEach(o=>o.fn());
  for(const view of viewButtons.map(button=>button.dataset.view)){
   api.setView(view,true);const s=api.getState();cameraViews.push({width,height,view,aspect:s.cameraAspect,finite:[...s.camera,...s.cameraTarget,...s.cameraUp].every(Number.isFinite),distance:Math.hypot(...s.camera.map((v,i)=>v-s.cameraTarget[i]))});
  }
 }
 check('All nine cameras fit finite desktop, portrait and landscape poses',cameraViews.every(v=>v.finite&&Math.abs(v.aspect-v.width/v.height)<1e-12&&v.distance>.35),{views:cameraViews,note:'Camera mathematics only; rendered composition and CSS require browser review.'});
 H.viewport={width:900,height:680};H.observers.forEach(o=>o.fn());api.setPhase('day');step(900);
 api.setView('moon',true);const moonEntry=api.getState();step(900);const moonNight=api.getState();
 check('Choosing the moon encounter camera selects night and reveals its visitors',moonEntry.mode==='moon'&&moonEntry.phase==='night'&&moonNight.env.night===1&&moonNight.worldState.mummies.visible&&moonNight.worldState.mummies.visibleCount>=2&&visibleMummyDraws()>=3,{entryPhase:moonEntry.phase,visibleCount:moonNight.worldState.mummies.visibleCount,visibleEffectBatches:visibleMummyDraws()});
 api.setPhase('day');step(900);const returnedDay=api.getState().worldState.mummies;
 check('Returning from night to day hides every mummy effect',!mummyRoot.visible&&visibleMummyDraws()===0&&!returnedDay.visible&&returnedDay.visibleCount===0&&returnedDay.actors.every(a=>a.alpha===0));
 api.setView('camel',true);step(120);const followStart=api.getState();step(180);const followEnd=api.getState();
 const routeLength=followEnd.worldState.roaming.route.length,pathTravel=(followEnd.worldState.roaming.distance-followStart.worldState.roaming.distance+routeLength)%routeLength;
 check('Camel camera follows the actual moving animal while the simulation runs',followStart.following&&followEnd.following&&pathTravel>.30&&distance(followStart.worldState.roaming.position,followEnd.worldState.roaming.position)>.025&&distance(followStart.cameraTarget,followEnd.cameraTarget)>.025&&distance(followEnd.cameraTarget,followEnd.worldState.roaming.position)<.27,{pathTravel,animalMovement:distance(followStart.worldState.roaming.position,followEnd.worldState.roaming.position),cameraMovement:distance(followStart.cameraTarget,followEnd.cameraTarget),targetDistance:distance(followEnd.cameraTarget,followEnd.worldState.roaming.position)});
 H.controls[0].handlers.get('start')();H.controls[0].handlers.get('change')();step(2);const detached=api.getState();step(120);const afterDrag=api.getState();
 check('Dragging cancels following while the animal keeps walking',!detached.following&&!afterDrag.following&&afterDrag.mode==='camel'&&distance(detached.camera,afterDrag.camera)===0&&distance(detached.cameraTarget,afterDrag.cameraTarget)===0&&distance(detached.worldState.roaming.position,afterDrag.worldState.roaming.position)>.08);
 api.setView('camel',true);step(120);check('Selecting the camel camera again restores following',api.getState().following&&distance(api.getState().cameraTarget,api.getState().worldState.roaming.position)<.27);
 nodes.get('desert-pause').click();step(2);let state=api.getState(),pausedSnapshot=snapshot(),renders=H.renderCalls;const simFrames=state.performance.simulationFrames;step(120);
 check('Pause freezes following, simulation, world transforms, material uniforms, and WebGL rendering',api.getState().time===state.time&&snapshot()===pausedSnapshot&&H.renderCalls===renders&&api.getState().performance.simulationFrames===simFrames&&JSON.stringify(api.getState().camera)===JSON.stringify(state.camera)&&JSON.stringify(api.getState().worldState)===JSON.stringify(state.worldState),{simulationUpdates:api.getState().performance.simulationFrames-simFrames,renders:H.renderCalls-renders});
 const originalCamera=state.camera;api.setView('treasury');step(120);
 check('A camera change remains interactive while paused without advancing world time',api.getState().time===state.time&&JSON.stringify(api.getState().camera)!==JSON.stringify(originalCamera)&&H.renderCalls>renders);
 renders=H.renderCalls;step(40);check('A completed camera move returns to zero WebGL renders while paused',H.renderCalls===renders);
 const phases=[];
 for(const phase of ['dusk','night','day','night']){
  api.setPhase(phase);step(900);const s=api.getState();phases.push({phase,env:s.env,time:s.time,sky:H.skyEnv});
 }
 check('Paused day, dusk and night transitions update both scene and sky without advancing time',phases.every(s=>s.time===state.time&&s.env.preview===false&&s.sky.daylight===s.env.daylight&&s.sky.dusk===s.env.dusk&&s.sky.night===s.env.night)&&phases[0].env.dusk===1&&phases[1].env.night===1&&phases[2].env.daylight===1,{phases});
 renders=H.renderCalls;const settledUpdates=api.getState().performance.simulationFrames;step(60);check('Settled night stops both scene updates and WebGL rendering',H.renderCalls===renders&&api.getState().performance.simulationFrames===settledUpdates);
 api.setView('camel',true);step(2);
 state=api.getState();pausedSnapshot=snapshot();
 dispose.setPreview(true);step(120);
 check('Preview uses daylight and a separate animation clock while preserving game time',api.getState().previewing&&api.getState().time===state.time&&api.getState().env.night===0&&snapshot()!==pausedSnapshot&&H.skyActive===false&&H.skyEnv.preview===true);
 dispose.setPreview(false);const restored=api.getState();
 check('Preview exit immediately restores paused time, following, camera, planet rotation and exact mummy state',!restored.previewing&&restored.paused&&restored.following&&restored.following===state.following&&restored.mode===state.mode&&restored.phase===state.phase&&restored.time===state.time&&JSON.stringify(restored.camera)===JSON.stringify(state.camera)&&JSON.stringify(restored.cameraTarget)===JSON.stringify(state.cameraTarget)&&JSON.stringify(restored.cameraUp)===JSON.stringify(state.cameraUp)&&JSON.stringify(restored.planetRotation)===JSON.stringify(state.planetRotation)&&JSON.stringify(restored.worldState)===JSON.stringify(state.worldState)&&snapshot()===pausedSnapshot);
 H.controls[0].handlers.get('start')();H.controls[0].handlers.get('change')();step(2);const detachedBeforePreview=api.getState(),detachedSnapshot=snapshot();dispose.setPreview(true);step(120);dispose.setPreview(false);const detachedRestored=api.getState();
 check('Preview roundtrip preserves a manually detached camel camera without restarting following',detachedBeforePreview.mode==='camel'&&!detachedBeforePreview.following&&detachedRestored.mode==='camel'&&!detachedRestored.following&&JSON.stringify(detachedRestored.camera)===JSON.stringify(detachedBeforePreview.camera)&&JSON.stringify(detachedRestored.worldState)===JSON.stringify(detachedBeforePreview.worldState)&&snapshot()===detachedSnapshot);
 nodes.get('desert-pause').click();step(4);document.hidden=true;document.emit('visibilitychange');state=api.getState();renders=H.renderCalls;const hiddenSnapshot=snapshot();step(120);
 check('Hidden worlds cancel all pending RAF and perform zero simulation or rendering',raf.size===0&&api.getState().time===state.time&&H.renderCalls===renders&&snapshot()===hiddenSnapshot&&H.skyActive===false);
 document.hidden=false;document.emit('visibilitychange');document.emit('visibilitychange');step(3);
 check('Reactivation queues exactly one RAF and ignores the hidden time gap',raf.size===1&&api.getState().time-state.time<.04&&H.skyActive===true);
 const renderer=H.renderers[0];nodes.get('desert-quality').click();step(2);const low=api.getState();nodes.get('desert-quality').click();step(2);
 check('The explicit quality toggle reduces DPR and shadows then restores them',low.lowQuality&&low.performance.pixelRatio===1&&!api.getState().lowQuality&&renderer.shadowMap.enabled&&renderer.pixelRatio===(process.argv.includes('--mobile')?1.35:1.5));
 api.setView('globe',true);step(220,36);const pressure=api.getState();
 check('Sustained slow frame timing adapts resolution without dropping scene content',pressure.performance.pixelRatio<(process.argv.includes('--mobile')?1.35:1.5)&&pressure.performance.pixelRatio>=.8&&planet.children.length>0,{performance:pressure.performance});
 const oldAspect=pressure.cameraAspect;H.viewport={width:0,height:0};H.observers.forEach(o=>o.fn());check('Hidden zero-size viewport measurements do not invalidate camera or renderer dimensions',api.getState().cameraAspect===oldAspect&&renderer.width>0&&renderer.height>0);H.viewport={width:390,height:844};H.observers.forEach(o=>o.fn());
 renderer.domElement.emit('webglcontextlost',{preventDefault(){}});state=api.getState();renders=H.renderCalls;step(30);const stopped=raf.size===0&&H.renderCalls===renders&&api.getState().time===state.time;renderer.domElement.emit('webglcontextrestored');step(3);
 check('Context loss stops all work and restoration resumes without a time jump',stopped&&raf.size===1&&api.getState().time-state.time<.04);
 nodes.get('desert-pause').click();step(3);renders=H.renderCalls;H.controls[0].handlers.get('change')();step(1);check('Orbit input wakes one render while the world is paused',H.renderCalls===renders+1);
 const geometry=new Map(),materials=new Map(),textures=new Map();
 scene.traverse(o=>{if(o.geometry)geometry.set(o.geometry,0);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.set(m,0);for(const value of Object.values(m))if(value?.isTexture)textures.set(value,0);}});
 for(const map of [geometry,materials,textures])for(const resource of map.keys())resource.addEventListener('dispose',()=>map.set(resource,map.get(resource)+1));
 renders=H.renderCalls;dispose();dispose();step(4);
 check('Disposal is idempotent and releases all live geometry, materials, textures and render boundaries once',raf.size===0&&H.renderCalls===renders&&H.rendererDisposals===1&&H.controlsDisposals===1&&H.skyDisposals===1&&H.animeDisposals===1&&geometry.size>0&&[...geometry.values(),...materials.values(),...textures.values()].every(n=>n===1)&&H.observers.every(o=>o.disconnected),{geometries:geometry.size,materials:materials.size,textures:textures.size,geometryCounts:[...new Set(geometry.values())],materialCounts:[...new Set(materials.values())],textureCounts:[...new Set(textures.values())]});
 H.viewport={width:300,height:250};const first=mountDesert(document,{preview:true}),firstApi=window.desertWorld;step(3);H.viewport={width:390,height:844};first.setPreview(false);const entered=firstApi.getState();
 firstApi.setView('globe',true);const fitted=firstApi.getState();
 check('First entry from selector fits the new full viewport instead of keeping the preview camera',entered.cameraAspect===390/844&&JSON.stringify(entered.camera)===JSON.stringify(fitted.camera));first();
 const report={checkedAt:new Date().toISOString(),passed:checks.every(x=>x.passed),mobileProfile:process.argv.includes('--mobile'),method:'Real production desert app, world, geometry and absolute-time animation. DOM, WebGL, controls and sky rendering are mocked boundaries; actual pixels and physical-device FPS are not verified here.',checks};
 await fs.writeFile(path.join(dir,process.argv.includes('--mobile')?'lifecycle-mobile-report.json':'lifecycle-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:checks.length,failed:checks.filter(x=>!x.passed)},null,2));if(!report.passed)process.exitCode=1;
}finally{await fs.unlink(bundle).catch(()=>{});delete globalThis.__desertHarness;}
