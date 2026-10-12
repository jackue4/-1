import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url));
const source=`
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createSurface} from '../kamakura-planet/surface.js';
import {createVoyage} from '../kamakura-planet/voyage.js';
import {oceanWave} from '../kamakura-planet/ocean.js';
const surface=createSurface(),planet=new THREE.Group(),voyage=createVoyage({planet,surface,palette:{}});
const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),normal=new THREE.Vector3();
const report={scope:'CPU geometry and behavior; no GPU or rendered-image proof',passed:false,stats:voyage.stats,checks:[],samplingSeconds:3600,samplingStepSeconds:5};
let minWaterDepth=Infinity,minRailClearance=Infinity,minHullSeabedClearance=Infinity,maxOceanFollowError=0,minBoatSeparation=Infinity;
const boats=voyage.root.children.find(mesh=>mesh.name.startsWith('Two cream'));
try{
 assert.ok(voyage.stats.triangles<60000&&voyage.stats.drawCalls<=30);
 assert.equal(voyage.stats.sailboats,2);assert.equal(voyage.stats.waterLanterns,11);assert.equal(voyage.stats.benches,2);
 for(const mesh of voyage.root.children){
  for(const attribute of Object.values(mesh.geometry.attributes))assert.ok(attribute.array.every(Number.isFinite));
  assert.ok(Number.isFinite(mesh.geometry.boundingSphere.radius));
  if(mesh.isInstancedMesh)assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
 }
 report.checks.push('All initial geometry attributes, bounds and instance transforms are finite; mesh and triangle budgets pass.');
 for(const placement of voyage.stats.placements){assert.ok(placement.seabedDepth>.08&&placement.railAngularClearance>.1);}
 report.checks.push('Jetty endpoint, lighthouse reef, boat route centres and lantern centres clear land and rail.');
 for(let time=0;time<=report.samplingSeconds;time+=report.samplingStepSeconds){
  voyage.update(.016,time,{daylight:1,night:0});const state=voyage.getState();
  for(const object of [...state.boats,...state.lanterns]){
   minWaterDepth=Math.min(minWaterDepth,object.seabedDepth);minRailClearance=Math.min(minRailClearance,object.railAngularClearance);
   assert.ok(object.seabedDepth>.08&&object.railAngularClearance>.1);
  }
  minBoatSeparation=Math.min(minBoatSeparation,new THREE.Vector3(...state.boats[0].position).distanceTo(new THREE.Vector3(...state.boats[1].position)));
  for(const boat of state.boats){
   normal.copy(surface.direction(boat.lat,boat.lon));const expected=surface.R+oceanWave(normal,time);
   maxOceanFollowError=Math.max(maxOceanFollowError,Math.abs(new THREE.Vector3(...boat.position).length()-expected));
  }
  for(let i=0;i<boats.count;i++){
   boats.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));
   for(let vertex=0;vertex<boats.geometry.attributes.position.count;vertex++){
    point.fromBufferAttribute(boats.geometry.attributes.position,vertex).applyMatrix4(matrix);
    const radius=point.length();normal.copy(point).normalize();const bed=surface.height(normal);
    minHullSeabedClearance=Math.min(minHullSeabedClearance,radius-bed);assert.ok(radius>bed+.03);
   }
  }
 }
 assert.ok(maxOceanFollowError<1e-6);assert.ok(minBoatSeparation>.48);
 report.checks.push('All boat body, sail, rigging and deck vertices remain above seabed over a one-hour route sample.');
 report.checks.push('Boats and drifting lanterns remain offshore and clear railway; boats stay separated and exactly follow the shared ocean wave.');
 const birds=voyage.root.children.find(mesh=>mesh.name.startsWith('White seabirds'));birds.geometry.computeBoundingBox();
 const size=birds.geometry.boundingBox.getSize(new THREE.Vector3());assert.ok(size.x<.14&&size.y<.04&&size.z<.09);report.birdGeometrySize=size.toArray();
 voyage.update(0,0,{daylight:1,night:0});const dayEmission=voyage.getState().emissiveIntensity;
 voyage.update(0,0,{daylight:.1,night:1});const nightEmission=voyage.getState().emissiveIntensity;assert.ok(nightEmission>dayEmission*4);
 const before=voyage.root.children.filter(m=>m.isInstancedMesh).map(m=>Array.from(m.instanceMatrix.array));
 voyage.update(0,0,{daylight:.1,night:1});const after=voyage.root.children.filter(m=>m.isInstancedMesh).map(m=>Array.from(m.instanceMatrix.array));assert.deepEqual(after,before);
 report.lamps={dayEmission,nightEmission};report.checks.push('Bird body scale is correct; warm lights brighten at night; unchanged elapsed time freezes dynamic transforms.');
 report.metrics={minWaterDepth,minRailClearance,minHullSeabedClearance,maxOceanFollowError,minBoatSeparation};
 voyage.dispose();assert.equal(planet.children.length,0);report.checks.push('Disposal detaches the complete module.');report.passed=true;
}catch(error){report.error=error.message.slice(0,1800);process.exitCode=1;}
fs.writeFileSync(process.env.VOYAGE_REPORT_PATH,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
`;
const outfile=path.join(directory,'voyage-test-bundle.mjs');
await build({stdin:{contents:source,resolveDir:directory},outfile,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],bundle:true,platform:'node',format:'esm'});
process.env.VOYAGE_REPORT_PATH=path.join(directory,'voyage-report.json');
await import(pathToFileURL(outfile).href);
