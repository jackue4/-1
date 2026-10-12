import assert from 'node:assert/strict';
import {pathLat,PLOT_SITES,farmReserved} from './layout.js';
import * as THREE from 'three';
import {makeDay,dateKey,weatherAt,lightAt,random,hash,chooseEvent,eventDelay,restore,persist,STORAGE_KEY,WEATHER,EVENTS} from './ecology.js';
import {createWorld,terrainHeight,R,direction} from './world.js';
import {BUILD_DURATION,PROJECTS,constructionAt,restoreConstruction,advanceConstruction} from './construction.js';
import {sampleWater,windAt} from './nature.js';

const results=[];
function test(name,fn){fn();results.push({name,passed:true});}
test('Daily weather is stable on reload, varies by date, and changes exactly at scheduled minutes',()=>{
  let previous;
  for(let d=1;d<=366;d++){
    const date=new Date(2026,0,d,12),day=makeDay(date);assert.deepEqual(day,makeDay(new Date(date)));
    assert.equal(day.key,dateKey(date));assert.equal(day.slots.length,5);
    if(previous)assert.notDeepEqual(day.slots,previous.slots);
    for(let i=0;i<day.slots.length;i++){const slot=day.slots[i];assert.ok(WEATHER[slot.type]);assert.ok(Number.isFinite(slot.temperature));if(i)assert.ok(slot.minute>day.slots[i-1].minute);const at=new Date(date);at.setHours(0,slot.minute,0,0);assert.deepEqual(weatherAt(day,at),slot);if(i){at.setMinutes(at.getMinutes()-1);assert.deepEqual(weatherAt(day,at),day.slots[i-1]);}}
    previous=day;
  }
});
test('Night, noon and sunrise have different light levels',()=>{assert.equal(lightAt(0).daylight,0);assert.equal(lightAt(12).daylight,1);assert.ok(lightAt(6.5).sunset>.9);assert.equal(lightAt(23).daylight,0);});
test('Random encounters respect weather, avoid immediate repeats and have irregular delays',()=>{
  for(const type of Object.keys(WEATHER)){const rng=random(hash(type)),seen=new Set();let last='';for(let i=0;i<100;i++){const id=chooseEvent(type,false,last,rng);assert.ok(EVENTS[id]);assert.notEqual(id,last);if(type==='rain')assert.ok(['rainDance','sprouts','breeze'].includes(id));if(type==='snow')assert.ok(['snowfall','breeze','gathering'].includes(id));seen.add(id);last=id;const delay=eventDelay(rng);assert.ok(delay>=35000&&delay<=75000);}assert.ok(seen.size>=3);}
  for(let i=0;i<50;i++)assert.ok(['fireflies','breeze','gathering'].includes(chooseEvent('clear',true,'',random(i))));
});
test('Storage restores today, rolls over at midnight, clamps growth and survives corrupt / denied storage',()=>{
  let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>{assert.equal(k,STORAGE_KEY);raw=v;}};const now=new Date(2026,8,16,23,59,50),initial=restore(storage,now);assert.equal(initial.visits,1);
  initial.growth=4;initial.counter=9;initial.history=[{id:'apple',at:now.getTime()}];initial.nextAt=now.getTime()+50000;assert.equal(persist(storage,initial),true);
  const same=restore(storage,new Date(now.getTime()+1000));assert.equal(same.counter,9);assert.equal(same.growth,4);assert.equal(same.history[0].id,'apple');assert.equal(same.visits,1);
  const tomorrow=restore(storage,new Date(2026,8,17,0,0,5));assert.equal(tomorrow.day,'2026-09-17');assert.equal(tomorrow.visits,2);assert.equal(tomorrow.growth,4);assert.equal(tomorrow.history.length,0);assert.equal(tomorrow.counter,0);
  raw='{broken';assert.equal(restore(storage,now).growth,0);raw=JSON.stringify({...initial,growth:999,history:[{},null,{id:'nope',at:0}]});assert.equal(restore(storage,now).growth,12);assert.equal(restore(storage,now).history.length,0);
  const blocked={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}};assert.equal(restore(blocked,now).growth,0);assert.equal(persist(blocked,initial),false);
});

const world=createWorld(2),dt=1/30;
test('Meadow has broad instanced blades, dry anchored roots, no grass shadow pass and adjustable quality',()=>{
  const m=world.meadow;assert.ok(m.count>12000&&m.count<20000);assert.equal(m.blades.castShadow,false);
  for(const root of m.roots){const n=root.clone().normalize();assert.ok(terrainHeight(n)>R+.11);assert.ok(Math.abs(root.length()-(terrainHeight(n)-.002))<1e-6);}
  m.setLowQuality(true);assert.ok(m.blades.count<m.count*.5);assert.equal(m.blades.castShadow,false);m.setLowQuality(false);assert.equal(m.blades.count,m.count);assert.equal(m.blades.castShadow,false);
  results.push({nature:{grassBlades:m.count,grassTriangles:m.count*m.blades.geometry.index.count/3,waterVertices:world.ocean.geometry.attributes.position.count}});
});
test('Wind travels in space and time; multi-wave water moves, damps at shore and reacts to stronger wind',()=>{
  const p=new THREE.Vector3(.6,-.3,2.1);assert.notEqual(windAt(p,0,1),windAt(p,1,1));assert.notEqual(windAt(p,1,1),windAt(p.clone().addScalar(.5),1,1));
  const heights=Array.from({length:120},(_,i)=>sampleWater(p,.2,i*.1,.8));assert.ok(Math.max(...heights)-Math.min(...heights)>.04);
  for(let i=0;i<40;i++){assert.ok(Math.abs(sampleWater(p,0,i,1))<1e-12);assert.ok(Math.abs(sampleWater(p,.2,i,1))>=Math.abs(sampleWater(p,.2,i,.1)));assert.ok(Math.abs(sampleWater(p,.2,i,1))<.055);}
});
test('Ocean redesign keeps houses and the walking loop on dry land',()=>{
  for(let i=0;i<720;i++){const lon=i/720*Math.PI*2;assert.ok(terrainHeight(direction(pathLat(lon),lon))>R+.01,`path remains dry at ${lon}`);}
  for(const h of world.houseSites)assert.ok(terrainHeight(direction(h.lat,h.lon))>R+.06);
  assert.equal(world.land.material.type,'MeshToonMaterial');assert.equal(world.surf.length,9);
  assert.ok(world.ocean.geometry.attributes.seaDepth.array.some(d=>d>.2));
  assert.ok(world.ocean.geometry.attributes.seaDepth.array.some(d=>d>0&&d<.03));
});
test('World has populated terrain, water basins, paths, residents and instanced plants',()=>{
  assert.equal(world.residents.length,4);assert.ok(world.stats.trees>=12&&world.stats.trees<=20);assert.ok(world.stats.flowers>=70);assert.ok(world.lakes.every(n=>terrainHeight(n)<R));
  let instanced=0,meshCount=0;world.planet.traverse(o=>{if(o.isInstancedMesh)instanced++;if(o.isMesh)meshCount++;if(o.geometry){for(const key of ['position','normal']){const attr=o.geometry.attributes[key];if(attr)assert.ok(attr.array.every(Number.isFinite),`${key} has finite values`);}}});assert.ok(instanced>=6);results.push({geometry:{meshCount,instanced,...world.stats}});
});
test('Landscape keeps continuous paths anchored and dense flower banks off the walking corridor',()=>{
  const l=world.landscape;assert.ok(l.counts.flowers>1000);assert.ok(l.counts.shrubs>90);assert.ok(l.counts.fencePosts>20);assert.ok(l.counts.rocks>20);
  const positions=l.path.geometry.attributes.position;for(let i=0;i<positions.count;i++){const p=new THREE.Vector3().fromBufferAttribute(positions,i);assert.ok(Math.abs(p.length()-terrainHeight(p.clone().normalize())-.0035)<1e-5);}
  const petals=l.meshes.find(m=>m.name==='wildflower petals');assert.ok(petals.count>5000);
  const leaves=l.meshes.find(m=>m.name==='shrub leaves');assert.ok(leaves.customDepthMaterial);assert.ok(leaves.count>500);assert.ok(l.meshes.find(m=>m.name==='shrub leaf sprays').count>3000);
  results.push({landscape:l.counts});
});
test('Animation style stays inside the geometry and shadow budgets',()=>{
  world.update(1/60,0,{rain:0,snow:0,cloud:.2,wind:.3,night:0,mist:0});let triangles=0,shadowTriangles=0;
  world.planet.traverseVisible(o=>{if(!o.isMesh)return;const n=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);triangles+=n;if(o.castShadow)shadowTriangles+=n;});
  assert.ok(triangles<650000,`scene triangle budget: ${triangles}`);assert.ok(shadowTriangles<200000,`shadow triangle budget: ${shadowTriangles}`);
  assert.ok(world.canopy.isInstancedMesh);assert.ok(world.canopy.count>=100&&world.canopy.count<=160);assert.equal(world.canopy.material.type,'MeshToonMaterial');
  results.push({renderBudget:{triangles,shadowTriangles}});
});
let time=0;
function run(env,seconds=12){for(let i=0;i<seconds/dt;i++){time+=dt;world.update(dt,time,env);}world.planet.updateMatrixWorld(true);world.planet.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));assert.ok(o.scale.toArray().every(s=>Number.isFinite(s)&&s>0));});}
const clear={rain:0,snow:0,cloud:.2,wind:.4,night:0,mist:0};
test('Residents walk on the surface with animated legs and valid normals',()=>{
  const positions=world.residents.map(p=>p.root.position.clone());run(clear,9);assert.ok(world.residents.some((p,i)=>p.root.position.distanceTo(positions[i])>.01));assert.ok(world.residents.some(p=>Math.abs(p.limbs[0].rotation.x)>.01));world.residents.forEach(p=>{assert.ok(Math.abs(p.normal.length()-1)<1e-7);assert.ok(Math.abs(p.root.position.length()-terrainHeight(p.normal))<.005);});
});
test('Surf follows the shoreline, advances over time and the sailboat floats',()=>{
  run(clear,1);const wave=world.surf[0],first=wave.positions.slice();run(clear,1);assert.notDeepEqual(first,wave.positions);
  for(const frame of world.shoreFrames)for(const sample of frame.samples){const n=frame.center.clone().multiplyScalar(Math.cos(sample.r)).addScaledVector(sample.tangent,Math.sin(sample.r));assert.ok(Math.abs(terrainHeight(n)-R)<.0001);}
  assert.ok(world.boat.position.length()>R);assert.ok(terrainHeight(world.boat.position.clone().normalize())<R);
  assert.equal(world.natureUniforms.uNatureTime.value,time);assert.ok(world.natureUniforms.uActors.value.every(p=>p.length()>R));
  for(const s of world.surf){assert.ok(s.wave.geometry.attributes.uv);assert.ok(s.positions.every(Number.isFinite));}
});
test('Rain enables particles, umbrellas and shelter behavior; snow and night update scene state',()=>{
  run({...clear,rain:1,cloud:1},15);assert.equal(world.rain.visible,true);assert.ok(world.residents.every(p=>p.umbrella.visible));assert.equal(world.snow.visible,false);
  run({...clear,snow:1,cloud:.8},3);assert.equal(world.rain.visible,false);assert.equal(world.snow.visible,true);assert.ok(world.residents.every(p=>!p.umbrella.visible));
  run({...clear,night:1},15);assert.ok(world.glowMaterials.every(m=>m.emissiveIntensity>1));
});
test('All visible encounter effects can run; growth actually increases in the garden',()=>{
  for(const event of Object.values(EVENTS)){world.trigger(event.effect,4);run(clear,2);}
  run(clear,8);assert.ok(world.growthPlants.slice(0,4).every(g=>g.scale.x>.95));assert.ok(world.growthPlants.slice(4).every(g=>g.scale.x<.05));
  world.trigger('growth',12);run(clear,8);assert.ok(world.growthPlants.every(g=>g.scale.x>.95));world.trigger('harvest',3);run(clear,8);assert.ok(world.growthPlants.slice(0,3).every(g=>g.scale.x>.95));assert.ok(world.growthPlants.slice(3).every(g=>g.scale.x<.05));
});
test('Construction reveals actual foundations, frames, walls and roofs in order',()=>{
  const build=world.construction,house=build.structures.find(s=>s.id==='house0'),job=PROJECTS.find(p=>p.id==='house0');
  build.setProgress(0);assert.ok(build.structures.every(s=>!s.object.visible));assert.equal(world.landscape.path.geometry.drawRange.count,0);
  build.setProgress(11);assert.ok(world.landscape.path.geometry.drawRange.count>0);assert.ok(world.landscape.path.geometry.drawRange.count<world.landscape.path.geometry.index.count);
  for(const [fraction,foundation,frame,walls,roof] of [[.1,true,false,false,false],[.3,true,true,false,false],[.6,true,true,true,false],[.85,true,false,true,true]]){
    build.setProgress(job.start+job.duration*fraction);assert.equal(house.groups[0].visible,foundation);assert.equal(house.frame.visible,frame);assert.equal(house.groups[1].visible,walls);assert.equal(house.groups[2].visible,roof);
  }
  let sawCarry=false,sawHammer=false;for(const elapsed of [23,27]){build.setProgress(elapsed);for(const p of world.residents){const pose=build.workerPose(p.i,false);if(pose){p.normal.copy(world.navigation.safeGoal(pose.normal));p.nav=null;p.navGoal=null;}}run(clear,.5);sawCarry ||= world.residents.some(p=>p.carry.visible);sawHammer ||= world.residents.some(p=>p.hammer.visible);}assert.ok(sawCarry);assert.ok(sawHammer);assert.equal(new Set(world.residents.map(p=>p.species)).size,4);
  run({...clear,buildPaused:true},1);assert.ok(world.residents.every(p=>!p.hammer.visible&&!p.carry.visible));
  for(let elapsed=0;elapsed<=BUILD_DURATION;elapsed+=7){build.setProgress(elapsed);for(let i=0;i<4;i++){const pose=build.workerPose(i,false);if(pose){assert.ok(pose.normal.toArray().every(Number.isFinite));assert.ok(Math.abs(pose.normal.length()-1)<1e-7);assert.ok(terrainHeight(pose.normal)>R+.01);}}}
  build.setProgress(BUILD_DURATION);assert.equal(build.getState().complete,true);assert.equal(build.workerPose(0,false),null);assert.ok(build.structures.every(s=>s.object.visible&&!s.frame.visible&&s.groups.every(g=>g.visible&&g.scale.y===1)));
});
test('Construction saves across dates, respects pause and speed, and migrates older saves safely',()=>{
  assert.equal(restoreConstruction({elapsed:Infinity}).elapsed,0);assert.equal(restoreConstruction({elapsed:99999}).elapsed,BUILD_DURATION);
  const b=restoreConstruction();advanceConstruction(b,.1);assert.equal(b.elapsed,.1);b.paused=true;advanceConstruction(b,.1);assert.equal(b.elapsed,.1);b.paused=false;b.speed=3;advanceConstruction(b,.1);assert.ok(Math.abs(b.elapsed-.4)<1e-8);advanceConstruction(b,20,false);assert.ok(Math.abs(b.elapsed-.4)<1e-8);
  let raw;const store={getItem:()=>raw,setItem:(k,v)=>{raw=v;}};const old=restore(store,new Date(2026,8,17));old.construction={elapsed:81,paused:true,speed:3};old.travel.clovers=23;persist(store,old);
  const next=restore(store,new Date(2026,8,18));assert.deepEqual(next.construction,old.construction);assert.equal(next.travel.clovers,23);
  delete old.construction;raw=JSON.stringify(old);assert.equal(restore(store,new Date(2026,8,18)).construction.elapsed,0);assert.equal(constructionAt(BUILD_DURATION).complete,true);
});
test('Daily crew has one or two stable members, rotates shifts and keeps leisure villagers dry',()=>{
  const seen=new Set(),build=world.construction,modes=new Set();
  for(let elapsed=1;elapsed<BUILD_DURATION;elapsed+=12){
    build.setProgress(elapsed);const crew=build.getCrew();assert.ok(crew.length===1||crew.length===2);assert.deepEqual(build.getCrew(),crew);seen.add(crew.join('/'));
    assert.equal(world.residents.filter(p=>build.workerPose(p.i,false)).length,crew.length);
    assert.ok(world.residents.every(p=>build.workerPose(p.i,true)===null));
    for(let i=0;i<4;i++){
      const pose=world.islandLife.pose(i,elapsed,clear);assert.ok(terrainHeight(pose.normal)>R+.05);modes.add(pose.mode);
      assert.equal(world.islandLife.pose(i,elapsed,clear).key,pose.key);
      assert.equal(world.islandLife.pose(i,elapsed,{...clear,rain:1}).mode,'rest');
    }
  }
  assert.ok(seen.size>5);assert.equal(modes.size,6);assert.ok(modes.has('stroll'));build.setProgress(BUILD_DURATION);assert.deepEqual(build.getCrew(),[]);
});
test('Transparent lagoon and instanced reef stay below the water with correct drawing order',()=>{
  assert.equal(world.waterMat.transparent,true);assert.equal(world.waterMat.depthWrite,false);assert.equal(world.ocean.renderOrder,1);
  const marine=world.marine;assert.ok(marine.reefRoots.length>300);assert.equal(marine.reefMeshes.length,5);
  const matrix=new THREE.Matrix4(),p=new THREE.Vector3();let highest=0;
  for(const im of marine.reefMeshes){
    assert.equal(im.castShadow,false);
    for(let i=0;i<im.count;i++){im.getMatrixAt(i,matrix);for(let j=0;j<im.geometry.attributes.position.count;j++){p.fromBufferAttribute(im.geometry.attributes.position,j).applyMatrix4(matrix);highest=Math.max(highest,p.length());assert.ok(p.length()<R-.054,`reef must stay submerged: ${p.length()}`);}}
  }
  assert.ok(marine.wake.renderOrder>world.ocean.renderOrder);results.push({coast:{reefPatches:marine.reefRoots.length,highestReef:highest}});
});
test('Sailboat chooses new routes, remains afloat and produces fading wake along its actual path',()=>{
  const marine=world.marine,first=marine.getState(),positions=new Set();let last=world.boat.position.clone(),maxStep=0;
  for(let i=0;i<3600;i++){
    const t=time+i/15,wind=.77;marine.update(1/15,t,wind);const state=marine.getState(),n=new THREE.Vector3(...state.normal);
    assert.ok(terrainHeight(n)<R-.15);assert.ok(n.distanceTo(world.lakes[0])<.365);assert.ok(state.speed>=0&&state.speed<.09);
    const expected=R+.018+sampleWater(n.clone().multiplyScalar(R),R-terrainHeight(n),t,wind);assert.ok(Math.abs(world.boat.position.length()-expected)<1e-6);
    if(i>1)maxStep=Math.max(maxStep,last.distanceTo(world.boat.position));last.copy(world.boat.position);
    if(i%150===0)positions.add(state.destination.map(v=>v.toFixed(3)).join('/'));
  }
  const state=marine.getState();assert.ok(state.routeCount-first.routeCount>=3);assert.ok(positions.size>=4);assert.ok(maxStep<.035);
  assert.equal(state.wakeSamples,65);assert.ok(marine.wake.geometry.drawRange.count>0);
  const alpha=marine.wake.geometry.attributes.wakeAlpha.array;assert.ok(alpha.some(a=>a>.2));assert.ok(alpha.every(a=>Number.isFinite(a)&&a>=0&&a<=1));assert.ok(marine.wake.geometry.attributes.position.array.every(Number.isFinite));
  assert.ok(alpha[240*3]<alpha[12*3]+.15);results.push({sailing:{routes:state.routeCount,waypoints:positions.size,maxFrameStep:maxStep}});
});
test('Cottages reveal by stage, open for a visit, close afterward and keep detail batched',()=>{
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  assert.equal(world.cottages.length,2);assert.equal(new Set(world.cottages.map(c=>c.name)).size,2);
  for(const c of world.cottages){
    const job=PROJECTS.find(p=>p.id===c.id);
    world.construction.setProgress(job.start+job.duration*.12);c.update(.1,0,clear,world.construction.getState().elapsed,[]);
    assert.equal(visible(c.door),false);assert.equal(visible(c.chime),false);assert.equal(c.visit().ready,false);
    world.construction.setProgress(job.start+job.duration*.65);assert.equal(visible(c.door),true);assert.equal(visible(c.chime),false);
    world.construction.setProgress(BUILD_DURATION);c.update(.1,1,clear,BUILD_DURATION,[]);assert.equal(visible(c.chime),true);assert.equal(c.visit().ready,true);
    for(let i=0;i<60;i++)c.update(1/30,1+i/30,clear,BUILD_DURATION,[]);
    assert.ok(c.getState().doorAmount>.98);assert.ok(c.door.rotation.y<-.9);
    for(let i=0;i<60;i++)c.update(1/30,20+i/30,clear,BUILD_DURATION,[]);
    assert.ok(c.getState().doorAmount<.02);
    for(let i=0;i<60;i++)c.update(1/30,25+i/30,clear,BUILD_DURATION,[{working:false,normal:c.entryNormal}]);
    assert.ok(c.getState().doorAmount>.98,'nearby idle resident opens the door');
    let count=0;c.house.traverseVisible(o=>{if(o.isMesh)count++;});assert.ok(count<24,`batched cottage meshes ${count}`);
    assert.ok(Number.isFinite(c.chime.rotation.z));
  }
});
test('Soft vegetation keeps rounded leaves attached to crowns and batches dense outlines',()=>{
  const leafMesh=world.canopyDetail.leaves,sprays=world.landscape.meshes.find(m=>m.name==='shrub leaf sprays');
  assert.equal(leafMesh.material.gradientMap,world.vegetationRamp);assert.equal(world.vegetationRamp.magFilter,THREE.LinearFilter);
  const ramp=world.vegetationRamp.image.data,values=Array.from(ramp).filter((_,i)=>i%4===0);assert.ok(new Set(values).size>20);assert.ok(values.every((v,i)=>!i||(v>=values[i-1]&&v-values[i-1]<10)),'painted light bands retain smooth transitions');
  assert.equal(leafMesh.count,world.canopy.count*world.canopyDetail.perClump);assert.ok(sprays.count>3000);assert.ok(leafMesh.customDepthMaterial);assert.equal(leafMesh.material.transparent,false);
  const matrix=new THREE.Matrix4(),base=new THREE.Matrix4(),a=new THREE.Vector3(),b=new THREE.Vector3();
  for(let i=0;i<leafMesh.count;i++){leafMesh.getMatrixAt(i,matrix);world.canopy.getMatrixAt(Math.floor(i/world.canopyDetail.perClump),base);a.setFromMatrixPosition(matrix);b.setFromMatrixPosition(base);assert.ok(a.distanceTo(b)<.26&&a.distanceTo(b)>.05);}
  for(const im of [leafMesh,sprays,world.landscape.meshes.find(m=>m.name==='flower leaves'),world.landscape.meshes.find(m=>m.name==='wildflower petals')]){
    const geo=im.geometry,normal=geo.attributes.normal;assert.equal(im.material.side,THREE.DoubleSide);
    for(let i=0;i<normal.count;i++){a.fromBufferAttribute(normal,i);assert.ok(Math.abs(a.length()-1)<1e-5);}
    assert.ok(geo.attributes.position.getY(0)<geo.attributes.position.getY(1),'leaf surface has a gentle cup');
  }
});
world.dispose();console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,results},null,2));

