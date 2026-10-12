import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.surface-check.bundle.mjs');
await build({stdin:{contents:"export {THREE,R,normal,createPalette} from './core.js'; export {surface,LAGOON,curves,gardenPath,makeSurfaceCurve} from './surface.js'; export {createFestivalWorld} from './world.js'; export {createFestivalRides} from './rides.js'; export {createFestivalAnimals} from './animals.js'; export {batchScenery} from './optimize.js';",resolveDir:path.join(dir,'../festival-planet')},bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});
try{
 const {THREE,R,normal,createPalette,surface,LAGOON,curves,gardenPath,makeSurfaceCurve,createFestivalWorld,createFestivalRides,createFestivalAnimals,batchScenery}=await import(pathToFileURL(bundle));
 // Lettered signs are the only DOM dependency in this geometry-level check.
 // Rendering, shader compilation and actual canvas lettering remain browser QA.
 globalThis.document={createElement(tag){assert.equal(tag,'canvas');return{width:0,height:0,getContext(){return{fillRect(){},strokeRect(){},fillText(){}};}};}};
 const palette=createPalette(),planet=new THREE.Group(),world=createFestivalWorld({planet,palette}),rides=createFestivalRides({planet,palette}),animals=createFestivalAnimals({planet,palette,rides,world});
 assert.equal(world.painted.paths.length,7,'All six main promenades and the rose-garden branch are rendered');
 let minVertexClearance=Infinity,maxVertexClearance=-Infinity,minPathRadialNormal=1,minFaceRadialNormal=1,minRoadLagoonMask=Infinity;const roadFindings=[];
 const point=new THREE.Vector3(),norm=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(const road of world.painted.paths){
  const {position,normal:normals,color}=road.geometry.attributes,indices=road.geometry.index;
  const finding={path:roadFindings.length,minNormal:1,minFace:1,minQ:Infinity,reversedFaces:0,worstNormalVertex:0,worstLakeVertex:0};
  assert.ok(color&&road.material.vertexColors,'Painted road colour layers remain present');
  for(let i=0;i<position.count;i++){
   point.fromBufferAttribute(position,i);norm.fromBufferAttribute(normals,i);assert.ok(point.toArray().every(Number.isFinite),'Every path vertex is finite');
   const radial=point.clone().normalize(),clearance=point.length()-surface.height(radial);
   minVertexClearance=Math.min(minVertexClearance,clearance);maxVertexClearance=Math.max(maxVertexClearance,clearance);minPathRadialNormal=Math.min(minPathRadialNormal,radial.dot(norm));minRoadLagoonMask=Math.min(minRoadLagoonMask,surface.lagoonMask(radial));
   if(radial.dot(norm)<finding.minNormal){finding.minNormal=radial.dot(norm);finding.worstNormalVertex=i;}if(surface.lagoonMask(radial)<finding.minQ){finding.minQ=surface.lagoonMask(radial);finding.worstLakeVertex=i;}
  }
  for(let i=0;i<indices.count;i+=3){a.fromBufferAttribute(position,indices.getX(i));b.fromBufferAttribute(position,indices.getX(i+1));c.fromBufferAttribute(position,indices.getX(i+2));const face=b.sub(a).cross(c.sub(a));if(face.lengthSq()>1e-16){const dot=face.normalize().dot(a.clone().normalize());minFaceRadialNormal=Math.min(minFaceRadialNormal,dot);finding.minFace=Math.min(finding.minFace,dot);if(dot<0)finding.reversedFaces++;}}
  roadFindings.push(finding);
 }
 assert.ok(minVertexClearance>.0059&&maxVertexClearance<.0121,'Road edges and centre sit just above the actual terrain');
 assert.ok(minPathRadialNormal>0&&minFaceRadialNormal>0,`All road top surfaces face outward, including longitude crossings: ${JSON.stringify(roadFindings)}`);
 assert.ok(minRoadLagoonMask>1,'Walking ribbons never go underwater');
 let minCentreLagoonMask=Infinity,maxTangentRadialDot=0,minTangentLength=1;
 for(const curve of [...curves,makeSurfaceCurve(gardenPath)])for(let i=0;i<=1800;i++){
  const n=curve.getPoint(i/1800).normalize(),t=curve.getTangent(i/1800);t.addScaledVector(n,-t.dot(n));minTangentLength=Math.min(minTangentLength,t.length());t.normalize();maxTangentRadialDot=Math.max(maxTangentRadialDot,Math.abs(t.dot(n)));minCentreLagoonMask=Math.min(minCentreLagoonMask,surface.lagoonMask(n));
 }
 assert.ok(minTangentLength>.1&&maxTangentRadialDot<1e-12,'Route directions form nondegenerate tangent frames');
 assert.ok(minCentreLagoonMask>1,'Every main route stays out of the lagoon');
 const centre=normal(LAGOON.lat,LAGOON.lon),depression=LAGOON.level-surface.height(centre);
 assert.ok(depression>.25,'The water covers a real recessed seabed');
 const bed=world.lagoon.root.children.find(o=>o.name.startsWith('Visible sand bed')),water=world.lagoon.root.children.find(o=>o.name.startsWith('Transparent turquoise'));
 assert.ok(!bed.material.transparent&&water.material.transparent&&!water.material.depthWrite&&water.renderOrder>bed.renderOrder,'Opaque bed is drawn before transparent water');
 assert.ok(water.geometry.attributes.aDepth,'Water retains its physical depth input');
 let smallestWaterDepth=Infinity;for(const depth of water.geometry.attributes.aDepth.array)smallestWaterDepth=Math.min(smallestWaterDepth,depth);
 assert.ok(smallestWaterDepth>.015,'The entire water disk is above the bed');
 // All protected custom vertex attributes and animated model transforms must
 // survive the same scenery batching pass used by the real application.
 const protectedMeshes=[];
 planet.traverse(o=>{if(!o.isMesh)return;let protectedObject=o.isInstancedMesh||o.material.transparent;for(let p=o;p;p=p.parent)protectedObject||=!!p.userData.dynamic;if(protectedObject)protectedMeshes.push({object:o,geometry:o.geometry,attributes:{...o.geometry.attributes}});});
 rides.update(1/60,18,{night:0});animals.update(18,{night:0});world.update(18,{daylight:1,night:0});planet.updateMatrixWorld(true);
 const subjects=animals.getSubjects().map(s=>({id:s.id,root:s.root,matrix:s.root.matrixWorld.toArray()})),animalState=animals.getState(),rideState=rides.getState();
 function geometrySummary(){
  planet.updateMatrixWorld(true);const perMaterial=new Map(),extent=new THREE.Box3(),vertex=new THREE.Vector3();let triangles=0,meshes=0,instanced=0;
  planet.traverse(o=>{if(!o.isMesh)return;meshes++;const multiplicity=o.isInstancedMesh?o.count:1,count=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*multiplicity;triangles+=count;const mat=Array.isArray(o.material)?o.material.map(m=>m.uuid).join(','):o.material.uuid;perMaterial.set(mat,(perMaterial.get(mat)||0)+count);
   if(o.isInstancedMesh){instanced++;o.computeBoundingBox();extent.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));return;}
   const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++){vertex.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);assert.ok(vertex.toArray().every(Number.isFinite),'Scene geometry has finite final vertices');extent.expandByPoint(vertex);}
  });return{triangles,meshes,instanced,perMaterial,extent};
 }
 const before=geometrySummary(),batching=batchScenery(planet),after=geometrySummary();
 assert.equal(after.triangles,before.triangles,'Batching preserves every triangle and instance');assert.deepEqual(after.perMaterial,before.perMaterial,'Batching preserves every material triangle count');
 assert.ok(after.extent.min.distanceTo(before.extent.min)<1e-5&&after.extent.max.distanceTo(before.extent.max)<1e-5,'Batching keeps geometry in the same world locations');
 for(const entry of protectedMeshes){assert.equal(entry.object.geometry,entry.geometry,'Dynamic or painted meshes retain geometry ownership');assert.deepEqual(Object.keys(entry.object.geometry.attributes),Object.keys(entry.attributes),'Custom shader attributes survive');for(const [key,attribute]of Object.entries(entry.attributes))assert.equal(entry.object.geometry.attributes[key],attribute,'Custom attributes remain unmodified');}
 for(const subject of subjects)assert.deepEqual(subject.root.matrixWorld.toArray(),subject.matrix,`Animal ${subject.id} stays attached at the same position`);
 assert.deepEqual(animals.getState(),animalState,'Batching preserves animal activity');assert.deepEqual(rides.getState(),rideState,'Batching preserves the ride simulation');
 const result={paths:world.painted.paths.length,minVertexClearance,maxVertexClearance,minPathRadialNormal,minFaceRadialNormal,minRoadLagoonMask,minCentreLagoonMask,maxTangentRadialDot,lagoonDepression:depression,minWaterDepth:smallestWaterDepth,protectedMeshes:protectedMeshes.length,animals:subjects.length,triangles:after.triangles,batching,nature:world.nature.stats,lanterns:world.stats.lanterns,staticBatchAttributesPreserved:true};
 await fs.writeFile(path.join(dir,'surface-report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 animals.dispose();world.dispose();palette.dispose();
}finally{await fs.rm(bundle,{force:true});delete globalThis.document;}
