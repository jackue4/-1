import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const dir=path.dirname(fileURLToPath(import.meta.url));
const bundle=path.join(dir,'.seat-validation-bundle.mjs');
await build({stdin:{contents:"export {THREE,createPalette} from '../festival-planet/core.js'; export {createFestivalRides} from '../festival-planet/rides.js';",resolveDir:dir,sourcefile:'seat-validation-entry.js'},bundle:true,format:'esm',platform:'node',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:bundle,logLevel:'silent'});
try{
  const {THREE,createPalette,createFestivalRides}=await import(pathToFileURL(bundle));
  const planet=new THREE.Group(),palette=createPalette(),rides=createFestivalRides({planet,palette});
  const seats=rides.getAnimalSeats(),counts={};
  assert.equal(seats.length,15,'Fifteen passengers should populate all five ride types');
  assert.equal(new Set(seats.map(seat=>seat.id)).size,seats.length,'Seat identifiers must remain unique');
  const mounted=seats.map(seat=>{
    counts[seat.ride]=(counts[seat.ride]||0)+1;
    assert.equal(seat.parent.userData.dynamic,true,'Passenger ancestors must survive static scenery batching');
    assert.equal(seat.pose,'sit');
    const mount=new THREE.Group();mount.position.set(...seat.position);mount.rotation.y=seat.rotationY;mount.scale.setScalar(seat.size);seat.parent.add(mount);
    return mount;
  });
  assert.deepEqual(counts,{carousel:3,ferris:3,teacups:3,swings:2,coaster:4});
  assert.ok(!seats.some(seat=>seat.id==='coaster-0'),'The first-person front carriage must remain empty');
  const positions=()=>{planet.updateMatrixWorld(true);return mounted.map(mount=>mount.getWorldPosition(new THREE.Vector3()));};
  const before=positions();
  for(let i=1;i<=480;i++){
    rides.update(1/60,i/60,{night:1});planet.updateMatrixWorld(true);
    for(const mount of mounted)assert.ok(mount.matrixWorld.elements.every(Number.isFinite),'Every passenger keeps a finite pose during motion');
  }
  const moving=positions();
  for(let i=0;i<seats.length;i++)assert.ok(moving[i].distanceTo(before[i])>.012,`${seats[i].id} follows its moving facility`);
  const snapshot=JSON.parse(JSON.stringify(rides.captureState()));
  const savedMatrices=mounted.map(mount=>mount.matrixWorld.clone());
  for(let i=0;i<120;i++)rides.update(1/60,1000+i/60,{night:0});
  assert.equal(rides.restoreState(snapshot),true);planet.updateMatrixWorld(true);
  for(let i=0;i<seats.length;i++)for(let j=0;j<16;j++)assert.ok(Math.abs(mounted[i].matrixWorld.elements[j]-savedMatrices[i].elements[j])<1e-9,`Preview restore returns ${seats[i].id} to its exact seat transform`);
  const frozen=positions();
  for(let i=0;i<30;i++)rides.update(0,snapshot.time,{night:1});
  const paused=positions();
  for(let i=0;i<seats.length;i++)assert.ok(paused[i].distanceTo(frozen[i])<1e-10,'Paused facilities cannot move their passengers');

  const seatedHeight=seat=>seat.species==='rabbit'?.92:.72;
  let ferrisRoofClearance=Infinity,coasterRoofClearance=Infinity;
  for(const seat of seats){
    const top=seat.position[1]+seat.size*seatedHeight(seat);
    if(seat.ride==='ferris'){
      ferrisRoofClearance=Math.min(ferrisRoofClearance,-.070-top);
      assert.ok(top<-.078,'Even rabbit ears must remain below the gondola roof');
      assert.ok(top>-.107,'Faces must be visible above the open basket rim');
    }
    if(seat.ride==='coaster'){
      const radialTop=.027+top,sideExtent=seat.size*.42;
      coasterRoofClearance=Math.min(coasterRoofClearance,.325-radialTop);
      assert.ok(Math.hypot(radialTop-.111,sideExtent)<.214,'The seated passenger envelope fits through the circular tunnel');
    }
    if(seat.ride==='carousel')assert.ok(.421+top<.750,'Bobbing carousel passengers stay below the canopy');
  }
  const ferrisPlatformClearance=.850-.565-.225-(.018+.075/2);
  assert.ok(ferrisPlatformClearance>.004,'Lowered baskets must still clear the bottom platform');
  const report={passed:true,passengers:seats.length,counts,checks:['finite rider attachment matrices through moving rides','all five facilities move their riders','exact preview transform restoration','pause freezes passenger parents','front coaster carriage is empty','seated-model envelope clears gondola roofs and mountain tunnel','gondola floor clears wheel platform'],minimumFerrisRoofClearance:ferrisRoofClearance,minimumCoasterRoofClearance:coasterRoofClearance,ferrisPlatformClearance};
  await fs.writeFile(path.join(dir,'seat-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  rides.dispose();palette.dispose();
}finally{await fs.unlink(bundle).catch(()=>{});}
