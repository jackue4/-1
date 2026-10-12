import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const dir=path.dirname(fileURLToPath(import.meta.url));
const bundle=path.join(dir,'.rides-validation-bundle.mjs');
await build({stdin:{contents:"export {THREE,createPalette} from './core.js'; export {createFestivalRides} from './rides.js'; export {createCoaster} from './coaster.js';",resolveDir:dir,sourcefile:'rides-validation-entry.js'},bundle:true,format:'esm',platform:'node',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:bundle,logLevel:'silent'});
try{
  const {THREE,createPalette,createFestivalRides,createCoaster}=await import(pathToFileURL(bundle));
  const planet=new THREE.Group(),palette=createPalette(),rides=createFestivalRides({planet,palette});
  const isolated=createCoaster({planet:new THREE.Group(),palette});
  const curve=isolated.curve;
  assert.ok(curve.getPointAt(0).distanceTo(curve.getPointAt(1))<1e-8,'The complete orbit must close exactly');
  assert.ok(curve.getTangentAt(0).dot(curve.getTangentAt(1))>.999,'The join must have a continuous tangent');
  let shortest=100,longest=0,previous=curve.getPointAt(0);
  for(let i=1;i<=720;i++){
    const next=curve.getPointAt(i/720),step=next.distanceTo(previous);shortest=Math.min(shortest,step);longest=Math.max(longest,step);previous=next;
  }
  assert.ok(longest/shortest<1.02,'Cars must advance at an even speed through all curves');
  const events=new Set();let highest=0,lowest=10,maxOrthogonalityError=0;
  for(let i=0;i<3900;i++){
    const time=i/60;rides.update(1/60,time,{night:i>1800?1:0});
    const pose=rides.getRidePose(),state=rides.getState();events.add(state.event);
    assert.ok([...pose.position.toArray(),...pose.up.toArray(),...pose.tangent.toArray(),...pose.lookAhead.toArray()].every(Number.isFinite),'No NaN pose');
    assert.ok(pose.position.distanceTo(pose.lookAhead)>.55&&pose.position.distanceTo(pose.lookAhead)<1.05,'Look target follows the actual track approximately .82 units ahead');
    assert.ok(pose.lookAhead.clone().sub(pose.position).dot(pose.tangent)>.45,'Look target must remain in front of the train throughout a lap');
    assert.ok(Math.abs(pose.up.length()-1)<1e-9,'Up must remain normalized');
    assert.ok(Math.abs(pose.tangent.length()-1)<1e-9,'Tangent must remain normalized');
    maxOrthogonalityError=Math.max(maxOrthogonalityError,Math.abs(pose.up.dot(pose.tangent)));
    highest=Math.max(highest,pose.position.length());lowest=Math.min(lowest,pose.position.length());
  }
  assert.ok(maxOrthogonalityError<1e-9,'Train orientation must remain orthogonal');
  for(const event of ['月石山的秘密隧道','跃入星光泻湖','云端许愿坡','木马为你点亮','摩天轮的光之回信'])assert.ok(events.has(event),`Missing ride interaction: ${event}`);
  assert.equal(rides.getState().cars,5);assert.equal(rides.getState().horseCount,6);assert.equal(rides.getState().gondolaCount,10);
  rides.setSpeed(999);assert.equal(rides.getState().speed,2.4);rides.setSpeed(.001);assert.equal(rides.getState().speed,.25);
  rides.setSpeed(1);
  let savedTime=65;
  for(let i=0;i<2400;i++){
    savedTime+=1/60;rides.update(1/60,savedTime,{night:1});
    if(rides.getState().event==='跃入星光泻湖'&&rides.getState().splash>.75)break;
  }
  assert.equal(rides.getState().event,'跃入星光泻湖','Capture the live world while it is splashing');
  const snapshot=JSON.parse(JSON.stringify(rides.captureState())),beforePreview=rides.getState(),savedPose=rides.getRidePose();
  for(let i=0;i<300;i++)rides.update(1/60,1000+i/60,{night:0});
  assert.notEqual(rides.getState().progress,beforePreview.progress,'Selector preview must keep moving independently');
  rides.setSpeed(2.1);assert.equal(rides.restoreState(snapshot),true);
  const restored=rides.getState(),restoredPose=rides.getRidePose();
  for(const key of ['progress','speed','elapsed','eventAge','splash','carouselPulse','ferrisPulse','carouselAngle','ferrisAngle'])assert.ok(Math.abs(restored[key]-beforePreview[key])<1e-10,`Snapshot restores ${key}`);
  assert.equal(restored.event,beforePreview.event);
  assert.ok(restoredPose.position.distanceTo(savedPose.position)<1e-10&&restoredPose.lookAhead.distanceTo(savedPose.lookAhead)<1e-10,'Snapshot restores both eye and look-ahead positions');
  assert.equal(rides.captureState().coaster.lastRipple,snapshot.coaster.lastRipple,'Preview cannot leak its clock into the water effect');
  const particleMatrix=new THREE.Matrix4();let liveDrops=0,visibleRipples=0;
  rides.root.traverse(o=>{if(o.isInstancedMesh&&o.userData.dynamic){for(let i=0;i<o.count;i++){o.getMatrixAt(i,particleMatrix);if(particleMatrix.elements[0]!==0)liveDrops++;}}if(o.userData.dynamic&&o.geometry?.type==='RingGeometry'&&o.visible)visibleRipples++;});
  assert.equal(liveDrops,0,'Preview droplets are cleared on return');assert.equal(visibleRipples,0,'Preview ripples are cleared on return');
  for(let i=1;i<=15;i++)rides.update(1/60,savedTime+i/60,{night:1});
  assert.ok(rides.captureState().coaster.lastRipple>snapshot.coaster.lastRipple,'Water ripple emission resumes on the restored play clock');
  let meshCount=0,triangles=0,dynamicGroups=0,invalidMatrices=0;
  planet.updateMatrixWorld(true);
  planet.traverse(object=>{if(object.isMesh){meshCount++;triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3*(object.isInstancedMesh?object.count:1);}if(object.userData.dynamic)dynamicGroups++;if(!object.matrixWorld.elements.every(Number.isFinite))invalidMatrices++;});
  assert.equal(invalidMatrices,0);
  const report={passed:true,checks:['closed orbit','continuous tangent','uniform arc-length speed','finite orthonormal ride poses over 65 seconds','actual-curve look target remains ahead over 65 seconds','all 5 course interactions','5 train cars, 6 horses, 10 cabins','bounded speed controls','serializable snapshot restores pose, clocks, speed, pulses and event','preview droplets/ripples cleared and play-clock water emission resumes','finite scene matrices'],events:[...events],trackLength:isolated.length,nominalLapSeconds:isolated.length/.77,arcStepRatio:longest/shortest,maxOrthogonalityError,rideCameraRadius:[lowest,highest],meshCountBeforeHostStaticMerge:meshCount,triangles,dynamicGroups};
  await fs.writeFile(path.join(dir,'rides-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{await fs.unlink(bundle).catch(()=>{});}
