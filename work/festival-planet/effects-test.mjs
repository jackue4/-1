import assert from 'node:assert/strict';
import fs from 'node:fs';
import {THREE,normal,createPalette} from './core.js';
import {createFestivalEffects} from './festival-effects.js';

const report={tests:[],peakParticles:0,bursts:0};
function test(name,run){run();report.tests.push({name,passed:true});}
function make({mobile=false,reduced=false}={}){
  let removed=0;
  globalThis.matchMedia=query=>({matches:query.includes('reduced-motion')?reduced:mobile,addEventListener(){},removeEventListener(){removed++;}});
  const planet=new THREE.Group(),palette=createPalette(),effect=createFestivalEffects({planet,palette});
  return{planet,palette,effect,removed:()=>removed};
}
const host=make(),{planet,palette,effect}=host;
test('All kite and balloon rigs are mounted; particle counts start empty',()=>{
  const s=effect.getState();assert.equal(s.kites,5);assert.equal(s.hotAirBalloons,3);assert.equal(s.tetheredBalloons,16);assert.equal(s.activeParticles,0);assert.equal(planet.children.length,1);
});
test('Daylight never launches fireworks',()=>{
  effect.startShow();for(let i=0;i<120;i++)effect.update(.05,i*.05,{night:0});
  const s=effect.getState();assert.equal(s.active,false);assert.equal(s.activeParticles,0);assert.equal(s.activeRockets,0);
});
const shapes=new Set();
test('An entire 84 second score and repeat remain finite within budget',()=>{
  const mainPoints=effect.root.children.find(x=>x.name==='Choreographed fireworks');
  for(let i=0;i<1800;i++){
    effect.update(.05,i*.05,{night:1});
    const s=effect.getState();report.peakParticles=Math.max(report.peakParticles,s.activeParticles);shapes.add(s.chapter);
    assert.ok(s.activeParticles<=s.particleBudget);assert.ok(s.activeRockets<10);
    if(i%40===0){
      for(const p of mainPoints.geometry.attributes.position.array)assert.ok(Number.isFinite(p));
      for(const alpha of mainPoints.geometry.attributes.aOpacity.array)assert.ok(Number.isFinite(alpha)&&alpha>=0&&alpha<=1.001);
    }
  }
  const s=effect.getState();assert.equal(s.cycle,1);assert.ok(s.bursts>=32);assert.ok(report.peakParticles>500);assert.equal(shapes.size,7);report.bursts=s.bursts;
});
test('Replaying returns to the opening cue without stale sparks',()=>{
  effect.startShow();const s=effect.getState();assert.equal(s.showTime,0);assert.equal(s.bursts,0);assert.equal(s.activeParticles,0);
  for(let i=0;i<60;i++)effect.update(.05,i*.05,{night:1});assert.equal(effect.getState().bursts,1);
});
test('A paused launch freezes its particle buffers and cannot fill the pool',()=>{
  effect.startShow();for(let i=0;i<20;i++)effect.update(.05,i*.05,{night:1});
  const before=effect.getState();assert.ok(before.activeRockets>0);
  const points=effect.root.children.find(x=>x.name==='Choreographed fireworks');
  const positions=points.geometry.attributes.position.array.slice(),opacity=points.geometry.attributes.aOpacity.array.slice();
  for(let i=0;i<300;i++)effect.update(0,1,{night:1});
  assert.deepEqual(points.geometry.attributes.position.array,positions);assert.deepEqual(points.geometry.attributes.aOpacity.array,opacity);
  const after=effect.getState();assert.equal(after.activeParticles,before.activeParticles);assert.equal(after.showTime,before.showTime);assert.equal(after.activeRockets,before.activeRockets);
});
test('Rigid baking preserves color attributes and removes redundant draw calls',()=>{
  const s=effect.getState();assert.ok(s.rigidDrawCallsSaved>=80);let baked=0,instances=0;
  effect.root.traverse(o=>{if(o.name==='Baked pastel balloon or kite'){baked++;assert.equal(o.material.vertexColors,true);assert.equal(o.geometry.attributes.color.count,o.geometry.attributes.position.count);}if(o.isInstancedMesh)instances++;});
  assert.equal(baked,24);assert.equal(instances,5);report.rigidDrawCallsSaved=s.rigidDrawCallsSaved;
});
test('Paused chapter two survives daylight preview and returns to the exact frozen frame',()=>{
  effect.startShow();for(let i=0;i<258;i++)effect.update(.05,i*.05,{night:1});
  const before=effect.getState();assert.ok(before.chapter.startsWith('第二幕'));assert.ok(before.activeParticles>0);
  const points=effect.root.children.find(x=>x.name==='Choreographed fireworks'),light=effect.root.children.find(x=>x.name==='Soft firework reflection');
  const positions=points.geometry.attributes.position.array.slice(),opacity=points.geometry.attributes.aOpacity.array.slice();
  for(let i=0;i<80;i++)effect.update(.05,12.9+i*.05,{night:0,preview:true});
  const hidden=effect.getState();assert.equal(hidden.active,false);assert.equal(hidden.suspended,true);assert.equal(points.visible,false);assert.equal(light.intensity,0);
  for(const key of ['showTime','chapter','progress','cycle','bursts','lightPulse','activeParticles','activeRockets'])assert.equal(hidden[key],before[key]);
  assert.deepEqual(points.geometry.attributes.position.array,positions);assert.deepEqual(points.geometry.attributes.aOpacity.array,opacity);
  effect.update(0,12.9,{night:1,preview:false});const restored=effect.getState();
  assert.equal(restored.active,true);assert.equal(restored.suspended,false);assert.equal(points.visible,true);
  for(const key of ['showTime','chapter','progress','cycle','bursts','lightPulse','activeParticles','activeRockets'])assert.equal(restored[key],before[key]);
  assert.deepEqual(points.geometry.attributes.position.array,positions);assert.deepEqual(points.geometry.attributes.aOpacity.array,opacity);
  effect.update(.05,12.95,{night:1});assert.ok(effect.getState().showTime>before.showTime);
});
test('Night to day clears all particle buffers and active rockets',()=>{
  for(let i=0;i<70;i++)effect.update(.05,i*.05,{night:1});effect.update(.05,4,{night:.1});
  const s=effect.getState();assert.equal(s.active,false);assert.equal(s.activeParticles,0);assert.equal(s.activeRockets,0);
  const points=effect.root.children.find(x=>x.name==='Choreographed fireworks');assert.ok(points.geometry.attributes.aOpacity.array.every(value=>value===0));
});
test('Dispose releases only owned resources and is idempotent',()=>{
  let sharedDisposed=0,ownDisposed=0;palette.m('#ccb99b').addEventListener('dispose',()=>sharedDisposed++);
  const geometry=effect.root.children.find(x=>x.name==='Choreographed fireworks').geometry;geometry.addEventListener('dispose',()=>ownDisposed++);
  effect.dispose();effect.dispose();effect.update(.1,0,{night:1});
  assert.equal(planet.children.length,0);assert.equal(sharedDisposed,0);assert.equal(ownDisposed,1);assert.equal(host.removed(),1);assert.equal(effect.getState().disposed,true);assert.equal(effect.startShow(),false);palette.dispose();
});
test('Phone mode budgets 2400 particles; reduced motion slows and thins the score',()=>{
  const low=make({mobile:true,reduced:true});
  for(let i=0;i<500;i++)low.effect.update(.05,i*.05,{night:1});
  const s=low.effect.getState();assert.equal(s.particleBudget,2400);assert.equal(s.reducedMotion,true);assert.ok(s.showTime>16&&s.showTime<17);assert.ok(s.bursts<5);low.effect.dispose();low.palette.dispose();
});
test('The full show fits the lowered desktop and portrait show camera',()=>{
  const host=make(),state=host.effect;
  const views=[{name:'desktop',aspect:16/9,fov:38},{name:'portrait',aspect:390/844,fov:48}].map(view=>{
    const half=Math.min(THREE.MathUtils.degToRad(view.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(view.fov/2))*view.aspect));
    const camera=new THREE.PerspectiveCamera(view.fov,view.aspect,.06,100),target=normal(.78,.05).multiplyScalar(.95);
    camera.position.copy(normal(.30,.20).multiplyScalar(5.8/Math.sin(half)*1.03)).add(target);camera.lookAt(target);camera.updateMatrixWorld(true);
    return{...view,camera,minY:1,maxY:-1,maxAbsX:0};
  });
  const points=state.root.children.find(x=>x.name==='Choreographed fireworks'),positions=points.geometry.attributes.position.array,opacity=points.geometry.attributes.aOpacity.array,p=new THREE.Vector3();
  for(let i=0;i<1680;i++){
    state.update(.05,i*.05,{night:1});
    if(i%3)continue;
    for(let j=0;j<opacity.length;j++)if(opacity[j]>.16){
      for(const view of views){p.fromArray(positions,j*3).project(view.camera);view.maxAbsX=Math.max(view.maxAbsX,Math.abs(p.x));view.maxY=Math.max(view.maxY,p.y);view.minY=Math.min(view.minY,p.y);}
    }
  }
  report.cameraBounds=views.map(({name,minY,maxY,maxAbsX})=>({name,minY,maxY,maxAbsX}));
  for(const view of views){assert.ok(view.maxAbsX<.94,JSON.stringify(report.cameraBounds));assert.ok(view.maxY<.96,JSON.stringify(report.cameraBounds));}
  state.dispose();host.palette.dispose();
});
fs.writeFileSync(new URL('./effects-report.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
