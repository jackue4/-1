import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createWeatherEffects} from './weather-effects.js';

const report={tests:[],projection:[],peakMeteors:0,physicalDeviceVerified:false};
const test=(name,run)=>{run();report.tests.push({name,passed:true});};
const direction=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
const lakes=[direction(-.32,.72),direction(-.45,-2.1),direction(-.8,2.7)],radius=2.45;
const height=n=>radius+.145-.37*Math.exp(-Math.pow(n.distanceTo(lakes[0])/.57,4))-.37*Math.exp(-Math.pow(n.distanceTo(lakes[1])/.43,4))-.37*Math.exp(-Math.pow(n.distanceTo(lakes[2])/.47,4));
function make({mobile=false,reduced=false}={}){
  let removed=0;globalThis.matchMedia=query=>({matches:query.includes('reduced-motion')?reduced:mobile,addEventListener(){},removeEventListener(){removed++;}});
  const scene=new THREE.Scene(),planet=new THREE.Group();scene.add(planet);
  const camera=new THREE.PerspectiveCamera(38,16/9,.1,60);camera.position.set(.45,5.95,2.15);camera.lookAt(0,2.67,0);camera.updateMatrixWorld(true);planet.quaternion.setFromUnitVectors(direction(.38,.06),new THREE.Vector3(0,1,0));
  return{scene,planet,camera,effect:createWeatherEffects({scene,planet,height,radius}),removed:()=>removed};
}
const host=make(),{scene,planet,camera,effect}=host;
function step(env,frames=80){for(let i=0;i<frames;i++)effect.update(.05,i*.05,env,camera,1);scene.updateMatrixWorld(true);}
function checkFinite(){scene.traverse(o=>{if(o.geometry)for(const attribute of Object.values(o.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value),`${o.name} has non-finite attribute`);if(o.instanceMatrix)for(const value of o.instanceMatrix.array)assert.ok(Number.isFinite(value));});}

test('Day suppresses all meteors even when meteor weather is requested',()=>{
  step({meteorShower:1,night:0});assert.equal(effect.getState().activeMeteors,0);assert.equal(effect.getState().meteorVisibility,0);checkFinite();
});
test('Tornado and seven colour rainbow grow softly and use actual radial anchors',()=>{
  effect.update(.05,0,{tornado:1,rainbow:1},camera);const transition=effect.getState();assert.ok(transition.intensity.tornado>0&&transition.intensity.tornado<.2);
  step({tornado:1,rainbow:1});const state=effect.getState();assert.equal(state.rainbowBands,7);assert.equal(state.tornadoVisible,true);assert.equal(state.rainbowVisible,true);
  const funnel=effect.root.getObjectByName('Cotton tornado'),normal=direction(.44,-.51),up=new THREE.Vector3(0,1,0).applyQuaternion(funnel.quaternion);assert.ok(up.distanceTo(normal)<1e-6);assert.ok(Math.abs(funnel.position.length()-height(normal)-.012)<1e-6);checkFinite();
});
test('Both initial garden and globe cameras include a readable rainbow crown',()=>{
  const arc=effect.root.getObjectByName('Rainbow band 1'),position=arc.geometry.attributes.position,p=new THREE.Vector3();
  const cameras=[{name:'garden',position:new THREE.Vector3(.45,5.95,2.15),target:new THREE.Vector3(0,2.67,0)},{name:'globe',position:new THREE.Vector3(.45,3.28,2.15).normalize().multiplyScalar(9.6),target:new THREE.Vector3()}];
  for(const view of cameras){
    camera.position.copy(view.position);camera.lookAt(view.target);camera.updateMatrixWorld(true);effect.update(0,0,{rainbow:1},camera);scene.updateMatrixWorld(true);
    let visible=0,crown=0,total=0,minY=1,maxY=-1;
    for(let i=0;i<position.count;i++){p.fromBufferAttribute(position,i);if(p.y<.70)continue;crown++;p.applyMatrix4(arc.matrixWorld).project(camera);total++;minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);if(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1)visible++;}
    assert.ok(visible/crown>.55,`${view.name}: only ${visible}/${crown} crown vertices fit`);report.projection.push({view:view.name,visible,total,minY,maxY});
  }
});
test('Heavy storm has finite streaks and impacts only below the real waterline',()=>{
  step({storm:1,wind:1});const state=effect.getState();assert.equal(state.stormVisible,true);assert.equal(state.waterRipples,42);
  const ripples=effect.root.getObjectByName('Rain rings over the actual bays'),matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  for(let i=0;i<ripples.count;i++){ripples.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);assert.ok(Math.abs(position.length()-(radius+.012))<1e-5);assert.ok(height(position.normalize())<radius-.025);}
  checkFinite();
});
test('Night shower contains several concurrent streaks and remains bounded for 80 seconds',()=>{
  for(let i=0;i<1600;i++){effect.update(.05,i*.05,{meteorShower:1,night:1},camera);const state=effect.getState();report.peakMeteors=Math.max(report.peakMeteors,state.activeMeteors);assert.ok(state.activeMeteors<=state.meteorBudget);if(i%80===0)checkFinite();}
  assert.ok(report.peakMeteors>=4);assert.ok(effect.getState().meteorsSeen>50);
});
test('A paused frame cannot advance simulation, append meteors or mutate particle data',()=>{
  const meteor=effect.sky.getObjectByName('Wishful multicolour meteor shower'),positions=meteor.geometry.attributes.position.array.slice(),before=effect.getState();
  for(let i=0;i<100;i++)effect.update(0,999,{meteorShower:1,night:1},camera);
  assert.equal(effect.getState().elapsed,before.elapsed);assert.equal(effect.getState().meteorsSeen,before.meteorsSeen);assert.deepEqual(meteor.geometry.attributes.position.array,positions);
});
test('Planet selection suspends all effect timing and restores the exact meteor frame',()=>{
  const meteor=effect.sky.getObjectByName('Wishful multicolour meteor shower'),positions=meteor.geometry.attributes.position.array.slice(),before=effect.getState();
  for(let i=0;i<100;i++)effect.update(.05,999,{preview:true,night:0,meteorShower:0},camera);
  assert.equal(effect.getState().suspended,true);assert.equal(effect.getState().activeMeteors,0);assert.equal(effect.getState().elapsed,before.elapsed);assert.equal(effect.root.visible,false);
  effect.update(0,0,{night:1,meteorShower:1},camera);const after=effect.getState();assert.equal(after.suspended,false);assert.equal(after.activeMeteors,before.activeMeteors);assert.deepEqual(meteor.geometry.attributes.position.array,positions);assert.deepEqual(after.intensity,before.intensity);
});
test('Weather exit fades continuously instead of disappearing immediately',()=>{
  step({tornado:1,rainbow:1,storm:1});effect.update(.05,0,{},camera);const state=effect.getState();assert.ok(state.intensity.tornado>.80&&state.intensity.tornado<1);assert.equal(state.tornadoVisible,true);step({},100);assert.equal(effect.getState().tornadoVisible,false);assert.equal(effect.getState().rainbowVisible,false);assert.equal(effect.getState().stormVisible,false);
});
test('Phone and reduced motion profiles use lower bounded particle pools',()=>{
  const phone=make({mobile:true,reduced:true});for(let i=0;i<100;i++)phone.effect.update(.05,i*.05,{storm:1,tornado:1,meteorShower:1,night:1},phone.camera);
  const s=phone.effect.getState();assert.equal(s.reducedMotion,true);assert.equal(s.mobile,true);assert.equal(s.stormStreaks,380);assert.equal(s.puffBudget,76);assert.equal(s.meteorBudget,7);assert.ok(s.activeMeteors<=4);phone.effect.dispose();
});
test('Dispose owns its resources only, detaches both roots and is idempotent',()=>{
  let released=0;effect.root.getObjectByName('Spiralling cotton clouds').geometry.addEventListener('dispose',()=>released++);effect.dispose();effect.dispose();assert.equal(effect.getState().disposed,true);assert.equal(released,1);assert.equal(host.removed(),1);assert.equal(planet.children.length,0);assert.equal(scene.children.length,1);effect.update(.1,99,{},camera);
});
fs.writeFileSync(new URL('./weather-effects-report.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
