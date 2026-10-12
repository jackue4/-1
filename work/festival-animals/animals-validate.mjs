import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const bundle=path.join(dir,'.animals-validation-bundle.mjs');
const reportPath=path.join(dir,'animals-report.json');
const checks=[],failures=[];
function check(condition,label,detail){checks.push({label,passed:!!condition,...(detail===undefined?{}:{detail})});if(!condition)failures.push(label);}
await build({stdin:{contents:"export {THREE,R,normal,createPalette} from '../festival-planet/core.js'; export {createFestivalWorld} from '../festival-planet/world.js'; export {createFestivalRides} from '../festival-planet/rides.js'; export {createFestivalAnimals} from '../festival-planet/animals.js'; export {createParkAnimal} from '../festival-planet/animal-model.js'; export {batchScenery} from '../festival-planet/optimize.js';",resolveDir:dir,sourcefile:'animals-validation-entry.js'},bundle:true,format:'esm',platform:'node',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:bundle,logLevel:'silent'});
const oldDocument=globalThis.document;
globalThis.document={createElement:tag=>{if(tag!=='canvas')throw new Error(`Unexpected DOM dependency ${tag}`);return{width:0,height:0,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})};}};
try{
 const {THREE,R,normal,createPalette,createFestivalWorld,createFestivalRides,createFestivalAnimals,createParkAnimal,batchScenery}=await import(pathToFileURL(bundle));
 const planet=new THREE.Group(),palette=createPalette(),world=createFestivalWorld({planet,palette}),rides=createFestivalRides({planet,palette}),animals=createFestivalAnimals({planet,palette,rides,world});
 const subjects=animals.getSubjects(),state=animals.getState(),seats=new Map(rides.getAnimalSeats().map(s=>[s.id,s]));
 check(state.total===22&&state.riders===15&&state.roaming===7,'22 animals: 15 ride passengers and 7 garden visitors',state);
 check(JSON.stringify(state.byRide)===JSON.stringify({carousel:3,ferris:3,teacups:3,swings:2,coaster:4}),'Every ride type has visible passengers',state.byRide);
 check(!subjects.some(s=>s.id==='coaster-0'),'Front coaster carriage remains empty for the onboard camera');
 const promenade=subjects.filter(s=>!s.ride).slice(0,3),garden=subjects.filter(s=>!s.ride).slice(3,5),spectators=subjects.filter(s=>!s.ride).slice(5);
 const firstPath=world.painted.paths[0];
 if(!firstPath)throw new Error('The real main promenade geometry could not be located');
 const apron=world.guestPaths.roseGarden.children.find(o=>o.geometry?.attributes.position.count===58&&o.geometry.index?.count===168);
 if(!apron)throw new Error('Garden apron geometry could not be located');
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),cross=new THREE.Vector3();
 let minimumApronNormalY=Infinity;
 for(let i=0;i<apron.geometry.index.count;i+=3){a.fromBufferAttribute(apron.geometry.attributes.position,apron.geometry.index.getX(i));b.fromBufferAttribute(apron.geometry.attributes.position,apron.geometry.index.getX(i+1));c.fromBufferAttribute(apron.geometry.attributes.position,apron.geometry.index.getX(i+2));cross.crossVectors(b.sub(a),c.sub(a)).normalize();minimumApronNormalY=Math.min(minimumApronNormalY,cross.y);}
 check(minimumApronNormalY>.999999,'Garden apron triangle winding points outwards (+Y)',minimumApronNormalY);
 const joints=subjects.flatMap(s=>{const objects=[];s.root.traverse(o=>objects.push({id:s.id,name:o.name,object:o,parent:o.parent}));return objects;});
 const batching=batchScenery(planet);planet.updateMatrixWorld(true);
 check(joints.every(j=>j.object.parent===j.parent),'Static batching preserves every animal root and animated joint',joints.length);
 let normalTriangles=0,backwardsTriangles=0;
 const corgi=subjects.find(s=>s.root.userData.animal.species==='corgi').root;
 const headGeometry=corgi.getObjectByName('Face and ears').geometry,pos=headGeometry.attributes.position,norm=headGeometry.attributes.normal;
 for(let i=0;i<pos.count;i+=3){a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1);c.fromBufferAttribute(pos,i+2);cross.crossVectors(b.sub(a),c.sub(a));if(cross.lengthSq()<1e-16)continue;const avg=new THREE.Vector3().fromBufferAttribute(norm,i).add(new THREE.Vector3().fromBufferAttribute(norm,i+1)).add(new THREE.Vector3().fromBufferAttribute(norm,i+2));normalTriangles++;if(cross.dot(avg)<-1e-9)backwardsTriangles++;}
 check(backwardsTriangles===0,'Mirrored corgi ears retain outward winding and matching normals',{normalTriangles,backwardsTriangles});
 const v=new THREE.Vector3(),w=new THREE.Vector3(),axis=new THREE.Vector3(),matrix=new THREE.Matrix4(),inverse=new THREE.Matrix4(),ray=new THREE.Raycaster();
 function eachVertex(root,toSpace,visitor,filter=()=>true){root.traverse(o=>{if(!o.isMesh||!filter(o))return;matrix.multiplyMatrices(toSpace,o.matrixWorld);const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);visitor(v);}});}
 const identity=new THREE.Matrix4();
 function projectedBounds(subject,axis){let min=Infinity,max=-Infinity;eachVertex(subject.root,identity,p=>{const d=p.dot(axis);min=Math.min(min,d);max=Math.max(max,d);});return[min,max];}
 function separation(first,second){first.root.getWorldPosition(a);second.root.getWorldPosition(b);axis.copy(b).sub(a).normalize();const one=projectedBounds(first,axis),two=projectedBounds(second,axis);return Math.max(two[0]-one[1],one[0]-two[1]);}
 let finite=true,minDet=Infinity,ferrisClearance=Infinity,coasterClearance=Infinity,promenadeSeparation=Infinity,gardenSeparation=Infinity;
 let pathGapMin=Infinity,pathGapMax=-Infinity,promenadeRadialError=0,gardenRootError=0,spectatorRadialError=0,minWalkingSole=Infinity,minGardenSole=Infinity,missingPathHits=0;
 const samples=481,step=.25;
 for(let sample=0;sample<samples;sample++){
  const time=sample*step,env={night:sample%2,preview:false};rides.update(sample?step:0,time,env);animals.update(time,env,{active:sample%3===0});planet.updateMatrixWorld(true);
  for(const j of joints){finite&&=j.object.matrixWorld.elements.every(Number.isFinite);minDet=Math.min(minDet,j.object.matrixWorld.determinant());}
  for(const subject of subjects){
   if(subject.ride==='ferris'||subject.ride==='coaster'){
    inverse.copy(seats.get(subject.id).parent.matrixWorld).invert();
    eachVertex(subject.root,inverse,p=>{if(subject.ride==='ferris')ferrisClearance=Math.min(ferrisClearance,-.070-p.y);else coasterClearance=Math.min(coasterClearance,.214-Math.hypot(p.x,p.y+.027-.111));},o=>subject.ride==='coaster'||o.userData.animalHeadPart===true);
   }
  }
  for(let i=0;i<promenade.length;i++){
   const s=promenade[i];s.root.parent.getWorldPosition(w);promenadeRadialError=Math.max(promenadeRadialError,Math.abs(w.length()-(world.surface.pathHeight(w.clone().normalize())+.001)));
   const normal=w.clone().normalize();ray.set(w.clone().addScaledVector(normal,.030),normal.clone().negate());ray.near=0;ray.far=.08;const hit=ray.intersectObject(firstPath,false)[0];
   if(!hit)missingPathHits++;else{const gap=hit.distance-.030;pathGapMin=Math.min(pathGapMin,gap);pathGapMax=Math.max(pathGapMax,gap);}
   eachVertex(s.root,identity,p=>{minWalkingSole=Math.min(minWalkingSole,p.length()-world.surface.pathHeight(p.clone().normalize()));},o=>o.name.endsWith('foot'));
   for(let j=i+1;j<promenade.length;j++)promenadeSeparation=Math.min(promenadeSeparation,separation(s,promenade[j]));
  }
  inverse.copy(world.guestPaths.roseGarden.matrixWorld).invert();
  for(const s of garden){s.root.parent.getWorldPosition(w).applyMatrix4(inverse);gardenRootError=Math.max(gardenRootError,Math.abs(w.y-.074),Math.abs(Math.hypot(w.x,w.z)-.435));eachVertex(s.root,inverse,p=>{minGardenSole=Math.min(minGardenSole,p.y-.072);},o=>o.name.endsWith('foot'));}
  gardenSeparation=Math.min(gardenSeparation,separation(garden[0],garden[1]));
  for(const s of spectators){s.root.getWorldPosition(w);spectatorRadialError=Math.max(spectatorRadialError,Math.abs(w.length()-(world.surface.height(w.clone().normalize())+.003)));}
 }
 check(finite&&minDet>0,'All animal joint matrices stay finite and unmirrored across 120 seconds',{samples,minimumDeterminant:minDet});
 check(ferrisClearance>.005,'Animated ears stay clear of the actual gondola roof',ferrisClearance);
 check(coasterClearance>.01,'Animated heads and raised paws fit the circular mountain tunnel',coasterClearance);
 check(promenadeSeparation>0&&gardenSeparation>0,'All full visitor meshes remain spatially separated on their shared paths',{promenadeSeparation,gardenSeparation});
 check(promenadeRadialError<1e-9&&missingPathHits===0&&pathGapMin>=-.003&&pathGapMax<.003&&minWalkingSole>-.003,'Promenade feet follow the actual curved walkway',{promenadeRadialError,missingPathHits,pathGapMin,pathGapMax,minWalkingSole});
 check(gardenRootError<1e-9&&minGardenSole>-.004,'Garden visitors stay grounded on the raised apron',{gardenRootError,minGardenSole});
 check(spectatorRadialError<1e-9,'Flying-chair spectators are grounded on the sphere',spectatorRadialError);
 const faceCoverage=subjects.map(s=>{const face=s.root.getObjectByName('Face and ears'),headMeshes=[];face.traverse(o=>{if(o.isMesh)headMeshes.push(o);});return{id:s.id,meshes:headMeshes.length,allTested:headMeshes.every(o=>o.userData.animalHeadPart===true)};});
 check(faceCoverage.every(s=>s.meshes===2&&s.allTested),'Roof clearance includes the whole head rig, ears, bows and blinking eyes',faceCoverage);
 const blinkProbe=createParkAnimal({palette,species:'rabbit'}),eye=blinkProbe.root.getObjectByName('Blinking eyes');
 blinkProbe.animate(.15-.1*1.37);const blinkClosed=eye.scale.y;blinkProbe.animate(1);const blinkOpen=eye.scale.y;
 check(blinkClosed<.1&&blinkOpen===1,'Brief deterministic blinks close and reopen both eyes',{blinkClosed,blinkOpen});blinkProbe.dispose();
 function matrices(){planet.updateMatrixWorld(true);return joints.map(j=>j.object.matrixWorld.elements.slice());}
 function maxError(previous){const current=matrices();let error=0;for(let i=0;i<current.length;i++)for(let j=0;j<16;j++)error=Math.max(error,Math.abs(current[i][j]-previous[i][j]));return error;}
 const savedTime=120,savedEnv={night:1,preview:false},savedShow={active:true};rides.update(0,savedTime,savedEnv);animals.update(savedTime,savedEnv,savedShow);const saved=matrices(),snapshot=JSON.parse(JSON.stringify(rides.captureState())),rotation=planet.quaternion.clone();
 for(let i=0;i<20;i++){rides.update(0,savedTime,savedEnv);animals.update(savedTime,savedEnv,savedShow);}
 const pauseError=maxError(saved);check(pauseError<1e-10,'Repeated paused time freezes every animal joint',pauseError);
 for(let i=1;i<=90;i++){planet.rotation.y=.8*i/90;rides.update(1/30,savedTime+i/30,{night:0,preview:true});animals.update(savedTime+i/30,{night:0,preview:true},{active:false});}
 const previewChanged=maxError(saved)>1e-4;rides.restoreState(snapshot);planet.quaternion.copy(rotation);animals.update(savedTime,savedEnv,savedShow);const restoreError=maxError(saved);
 check(previewChanged&&restoreError<1e-9,'Preview and play restore every passenger, visitor and animated joint exactly',{previewChanged,restoreError});
 const geometries=new Set(),materials=new Set();for(const s of subjects)s.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
 let geometryDisposals=0,materialDisposals=0,gradientDisposals=0;for(const g of geometries)g.addEventListener('dispose',()=>geometryDisposals++);for(const m of materials)m.addEventListener('dispose',()=>materialDisposals++);
 const gradient=palette.m('#ffffff').gradientMap;gradient.addEventListener('dispose',()=>gradientDisposals++);
 animals.dispose();animals.dispose();
 check(geometryDisposals===geometries.size&&materialDisposals===materials.size&&gradientDisposals===0,'Animal cleanup is idempotent and retains the scene-owned toon gradient',{geometries:geometries.size,geometryDisposals,materials:materials.size,materialDisposals,gradientDisposals});
 check(subjects.every(s=>s.root.parent===null)&&animals.root.parent===null,'Cleanup detaches all passengers and park visitors');
 const fresh=createParkAnimal({palette,species:'corgi',size:.2});check(!materials.has(fresh.root.children[0].material),'A new visitor after cleanup acquires a live material');fresh.dispose();
 rides.dispose();palette.dispose();check(gradientDisposals===1,'Palette cleanup releases its gradient once after all animals');
 const report={passed:failures.length===0,failures,checks,sampling:{durationSeconds:120,stepSeconds:step,samples,scope:'Actual animated geometry; Node scene validation without rasterization or device performance claims'},batching};
 await fs.writeFile(reportPath,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
}catch(error){await fs.writeFile(reportPath,JSON.stringify({passed:false,error:error.stack,checks,failures},null,2));throw error;}
finally{globalThis.document=oldDocument;await fs.unlink(bundle).catch(()=>{});}
