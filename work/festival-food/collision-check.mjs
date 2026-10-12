import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.collision-check.bundle.mjs');
globalThis.document={createElement(){return{width:1,height:1,getContext(){return new Proxy({},{get:()=>()=>{}});}};}};
await build({stdin:{contents:"export {THREE,createPalette} from '../festival-planet/core.js';export {createFoodStalls} from '../festival-planet/food-stalls.js';export {createFoodGuests} from '../festival-planet/food-guests.js';",resolveDir:dir},bundle:true,format:'esm',platform:'node',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:bundle,logLevel:'silent'});
try{
 const {THREE,createPalette,createFoodStalls,createFoodGuests}=await import(pathToFileURL(bundle)),palette=createPalette(),root=new THREE.Group(),stalls=createFoodStalls({THREE,palette,parent:root}),guests=createFoodGuests({THREE,palette,parent:root});root.updateMatrixWorld(true);
 function ancestry(o){const parts=[];for(let p=o;p&&p!==root;p=p.parent)if(p.name)parts.unshift(p.name);return parts.join(' / ');}
 const solids=[];stalls.root.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();let dynamic=false;for(let p=o;p&&p!==root;p=p.parent)dynamic||=!!p.userData.dynamic;solids.push({name:ancestry(o),o,dynamic,source:o.geometry.boundingBox.clone(),box:o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)});}});
 const guestParts=[];guests.root.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();guestParts.push({o,source:o.geometry.boundingBox.clone(),box:new THREE.Box3(),name:ancestry(o)});}});
 const overlaps=new Map(),closest=new Map();let samples=0,minStaticDistance=Infinity,maxContactY=-Infinity,minContactY=Infinity,minGuestDistance=Infinity,maxStep=0,previous;
 const a=new THREE.Vector3(),b=new THREE.Vector3();
 function boxDistance(a,b){return Math.hypot(Math.max(0,a.min.x-b.max.x,b.min.x-a.max.x),Math.max(0,a.min.y-b.max.y,b.min.y-a.max.y),Math.max(0,a.min.z-b.max.z,b.min.z-a.max.z));}
 function state(){root.updateMatrixWorld(true);const out=[];guests.root.traverse(o=>out.push([o.name,o.visible,o.matrix.toArray()]));return JSON.stringify(out);}
 for(let sample=0;sample<=2560;sample++){
  const time=sample*.05;guests.update(time);stalls.update(time);root.updateMatrixWorld(true);samples++;for(const solid of solids)if(solid.dynamic)solid.box.copy(solid.source).applyMatrix4(solid.o.matrixWorld);
  for(const part of guestParts){if(!part.o.visible)continue;part.box.copy(part.source).applyMatrix4(part.o.matrixWorld);
   for(const solid of solids){const distance=boxDistance(part.box,solid.box);minStaticDistance=Math.min(minStaticDistance,distance);if(distance<.02){const key=part.name+' <> '+solid.name;if(!closest.has(key)||closest.get(key).distance>distance)closest.set(key,{guest:part.name,solid:solid.name,time,distance});}if(!part.box.intersectsBox(solid.box))continue;
    const key=part.name+' <> '+solid.name;a.copy(part.box.min).max(solid.box.min);b.copy(part.box.max).min(solid.box.max);const depth=b.sub(a).toArray();if(depth.some(n=>n<.0001))continue;if(!overlaps.has(key))overlaps.set(key,{guest:part.name,solid:solid.name,time,overlapDimensions:depth});
   }
  }
  const subjects=guests.getSubjects(),current=subjects.map(s=>s.root.position.clone());
  for(let i=0;i<subjects.length;i++)for(let j=i+1;j<subjects.length;j++)minGuestDistance=Math.min(minGuestDistance,current[i].distanceTo(current[j]));
  if(previous)for(let i=0;i<subjects.length;i++)maxStep=Math.max(maxStep,current[i].distanceTo(previous[i]));previous=current;
  if(sample%10===0)for(const s of subjects){let lowest=Infinity;for(const name of ['Left foot','Right foot']){const mesh=s.actor.getObjectByName(name),p=mesh.geometry.attributes.position;for(let j=0;j<p.count;j++){a.fromBufferAttribute(p,j).applyMatrix4(mesh.matrixWorld);lowest=Math.min(lowest,a.y);}}minContactY=Math.min(minContactY,lowest);maxContactY=Math.max(maxContactY,lowest);}
 }
 guests.update(17.4);const saved=state();guests.update(887);guests.update(17.4);const exactTimeRestore=state()===saved;guests.update(17.4);const pauseStable=state()===saved;
 const geometries=new Map();guests.root.traverse(o=>{if(o.geometry&&!geometries.has(o.geometry)){geometries.set(o.geometry,0);o.geometry.addEventListener('dispose',()=>geometries.set(o.geometry,geometries.get(o.geometry)+1));}});guests.dispose();guests.dispose();const exactlyOnceDisposal=[...geometries.values()].every(n=>n===1);stalls.dispose();palette.dispose();
 const report={checkedAt:new Date().toISOString(),passed:overlaps.size===0&&minGuestDistance>.17&&maxStep<.012&&exactTimeRestore&&pauseStable&&exactlyOnceDisposal,samples,seconds:128,method:'Per-part world-space bounding boxes of the actual transformed static meshes against all real animated guest parts including head, ears, paws and held food. Disjoint boxes prove geometry separation; any overlapping boxes are conservatively reported for inspection. No renderer or image claim.',staticParts:solids.length,guestParts:guestParts.length,overlaps:[...overlaps.values()],minimumBoxDistance:minStaticDistance,nearPairs:[...closest.values()].sort((a,b)=>a.distance-b.distance).slice(0,15),minimumGuestCenterDistance:minGuestDistance,maxStepPer50ms:maxStep,actualLowestFootVertexRange:[minContactY,maxContactY],floorY:.014,exactTimeRestore,pauseStable,exactlyOnceDisposal};await fs.writeFile(path.join(dir,'collision-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
}finally{await fs.unlink(bundle).catch(()=>{});}
