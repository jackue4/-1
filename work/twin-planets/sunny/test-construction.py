from pathlib import Path
p=Path('work/planet-v2/build-scene.js');s=p.read_text(encoding='utf-8').replace('let state=constructionAt(BUILD_DURATION),localTime=0;','let state=constructionAt(BUILD_DURATION);').replace('localTime=t;','')
s=s.replace("const work=safeNormal(direction(lat+Math.sin(a)*.125,lon+Math.cos(a)*.125),n),supply=supplyNormal(target);", "const work=safeNormal(direction(lat+Math.sin(a)*.125,lon+Math.cos(a)*.125),n),base=supplyNormal(target);\n    const supply=safeNormal(direction(Math.asin(base.y)+Math.sin(a)*.07,Math.atan2(base.x,base.z)+Math.cos(a)*.07),n);")
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/test.js');s=p.read_text(encoding='utf-8')
s=s.replace("import {sampleWater,windAt}","import {BUILD_DURATION,PROJECTS,constructionAt,restoreConstruction,advanceConstruction} from './construction.js';\nimport {sampleWater,windAt}")
a=s.index('world.dispose();')
s=s[:a]+'''test('Construction reveals actual foundations, frames, walls and roofs in order',()=>{
  const build=world.construction,house=build.structures.find(s=>s.id==='house0'),job=PROJECTS.find(p=>p.id==='house0');
  build.setProgress(0);assert.ok(build.structures.every(s=>!s.object.visible));assert.equal(world.landscape.path.geometry.drawRange.count,0);
  build.setProgress(11);assert.ok(world.landscape.path.geometry.drawRange.count>0);assert.ok(world.landscape.path.geometry.drawRange.count<world.landscape.path.geometry.index.count);
  for(const [fraction,foundation,frame,walls,roof] of [[.1,true,false,false,false],[.3,true,true,false,false],[.6,true,true,true,false],[.85,true,false,true,true]]){
    build.setProgress(job.start+job.duration*fraction);assert.equal(house.groups[0].visible,foundation);assert.equal(house.frame.visible,frame);assert.equal(house.groups[1].visible,walls);assert.equal(house.groups[2].visible,roof);
  }
  build.setProgress(30);run(clear,2);assert.ok(world.residents.some(p=>p.carry.visible));assert.ok(world.residents.some(p=>p.hammer.visible));assert.equal(new Set(world.residents.map(p=>p.species)).size,6);
  run({...clear,buildPaused:true},1);assert.ok(world.residents.every(p=>!p.hammer.visible&&!p.carry.visible));
  for(let elapsed=0;elapsed<=BUILD_DURATION;elapsed+=7){build.setProgress(elapsed);for(let i=0;i<6;i++){const pose=build.workerPose(i,false);if(pose){assert.ok(pose.normal.toArray().every(Number.isFinite));assert.ok(Math.abs(pose.normal.length()-1)<1e-7);assert.ok(terrainHeight(pose.normal)>R+.01);}}}
  build.setProgress(BUILD_DURATION);assert.equal(build.getState().complete,true);assert.equal(build.workerPose(0,false),null);assert.ok(build.structures.every(s=>s.object.visible&&!s.frame.visible&&s.groups.every(g=>g.visible&&g.scale.y===1)));
});
test('Construction saves across dates, respects pause and speed, and migrates older saves safely',()=>{
  assert.equal(restoreConstruction({elapsed:Infinity}).elapsed,0);assert.equal(restoreConstruction({elapsed:99999}).elapsed,BUILD_DURATION);
  const b=restoreConstruction();advanceConstruction(b,.1);assert.equal(b.elapsed,.1);b.paused=true;advanceConstruction(b,.1);assert.equal(b.elapsed,.1);b.paused=false;b.speed=3;advanceConstruction(b,.1);assert.ok(Math.abs(b.elapsed-.4)<1e-8);advanceConstruction(b,20,false);assert.ok(Math.abs(b.elapsed-.4)<1e-8);
  let raw;const store={getItem:()=>raw,setItem:(k,v)=>{raw=v;}};const old=restore(store,new Date(2026,8,17));old.construction={elapsed:81,paused:true,speed:3};old.travel.clovers=23;persist(store,old);
  const next=restore(store,new Date(2026,8,18));assert.deepEqual(next.construction,old.construction);assert.equal(next.travel.clovers,23);
  delete old.construction;raw=JSON.stringify(old);assert.equal(restore(store,new Date(2026,8,18)).construction.elapsed,0);assert.equal(constructionAt(BUILD_DURATION).complete,true);
});
''' +s[a:]
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/test-app.mjs');s=p.read_text(encoding='utf-8')
needle="$('rotate-toggle').click();assert.equal($('rotate-toggle').getAttribute('aria-pressed'),'true');"
a=s.index(needle)
s=s[:a]+'''$('sunny-view').click();$('build-replay').click();frames(40);assert.equal(window.littleBloom.getState().shadowEveryFrame,true);
let building=window.littleBloom.getState().construction;assert.ok(building.elapsed>0);assert.equal(new Set(building.workers.map(p=>p.species)).size,6);
$('build-pause').click();const pausedAt=window.littleBloom.getState().construction.elapsed;frames(60);assert.equal(window.littleBloom.getState().construction.elapsed,pausedAt);
$('build-pause').click();$('build-speed').click();frames(60);assert.ok(window.littleBloom.getState().construction.elapsed-pausedAt>5);
const previewAt=window.littleBloom.getState().construction.elapsed;$('build-preview').click();frames(45);assert.equal(window.littleBloom.getState().construction.elapsed,previewAt);assert.equal(window.littleBloom.getState().construction.complete,true);$('build-preview').click();frames(2);assert.equal(window.littleBloom.getState().construction.complete,false);
Object.defineProperty(document,'hidden',{value:true,writable:true,configurable:true});document.dispatchEvent(new window.Event('visibilitychange'));const hiddenAt=window.littleBloom.getState().construction.elapsed;frames(60);assert.equal(window.littleBloom.getState().construction.elapsed,hiddenAt);document.hidden=false;document.dispatchEvent(new window.Event('visibilitychange'));
document.querySelector('[data-weather="rain"]').click();const rainAt=window.littleBloom.getState().construction.elapsed;frames(40);assert.equal(window.littleBloom.getState().construction.elapsed,rainAt);document.querySelector('[data-time="22"]').click();frames(40);assert.equal(window.littleBloom.getState().construction.elapsed,rainAt);
$('sunny-view').click();frames(3400);assert.equal(window.littleBloom.getState().construction.complete,true);assert.equal($('build-pause').disabled,true);assert.equal($('build-progress').getAttribute('aria-valuenow'),'100');
const tripBefore=JSON.stringify(window.littleBloom.getState().travel);$('build-replay').click();assert.equal(window.littleBloom.getState().construction.elapsed,0);assert.equal(JSON.stringify(window.littleBloom.getState().travel),tripBefore);assert.equal(JSON.parse(stored.get('little-bloom.ecosystem.v2')).construction.elapsed,0);
checks.push('Construction pause, speed, preview, hidden-tab pause, weather rest, completion and isolated replay');
''' +s[a:]
p.write_text(s,encoding='utf-8')
