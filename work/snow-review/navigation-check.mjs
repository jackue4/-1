import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.navigation-check.bundle.mjs');
await build({stdin:{contents:"export {THREE,R,normal,createPalette} from './core.js';export {createSnowWorld,groundHeight,landField} from './world.js';",resolveDir:path.join(dir,'../snow-planet')},bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});
try{
 const {THREE,R,createPalette,createSnowWorld,groundHeight}=await import(pathToFileURL(bundle));
 const planet=new THREE.Group(),palette=createPalette(),world=createSnowWorld({planet,palette});planet.updateMatrixWorld(true);
 const bridges=[];planet.traverse(o=>{if(o.userData.kind==='bridge')bridges.push({object:o,inverse:o.matrixWorld.clone().invert(),center:o.getWorldPosition(new THREE.Vector3()),length:o.userData.length,width:o.userData.width,rise:o.userData.height-.235,opening:o.userData.opening/2,collisionSamples:0,minClearance:Infinity,firstCollision:null});});
 // All actual boat vertices, deduplicated after material batching. No box-corner false positives.
 const boatSamples=world.boats.map(({model})=>{model.updateWorldMatrix(true,true);const inverse=model.matrixWorld.clone().invert(),points=[],seen=new Set();model.traverse(o=>{if(!o.isMesh)return;const matrix=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld),p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix),key=v.toArray().map(n=>n.toFixed(6)).join(',');if(!seen.has(key)){seen.add(key);points.push(v);}}});return points;});
 const results=world.boats.map((b,i)=>({boat:i,vertices:boatSamples[i].length,minTerrainClearance:Infinity,minWaterDepth:Infinity,minForwardAlignment:1,worstTime:0}));
 const p=new THREE.Vector3(),bridgePoint=new THREE.Vector3(),front=new THREE.Vector3(),q=new THREE.Quaternion();
 for(let time=0;time<=240;time+=.25){
  world.update(time,{night:0});planet.updateMatrixWorld(true);const centers=world.boats.map(b=>b.g.position.clone()),quats=world.boats.map(b=>b.model.getWorldQuaternion(new THREE.Quaternion()));
  for(let i=0;i<world.boats.length;i++){
   const boat=world.boats[i],r=results[i],nearby=bridges.filter(b=>b.center.distanceTo(centers[i])<b.length*.5+.6);
   for(const local of boatSamples[i]){p.copy(local).applyMatrix4(boat.model.matrixWorld);const radius=p.length(),lat=Math.asin(p.y/radius),lon=Math.atan2(p.x,p.z),bed=groundHeight(lat,lon),clearance=radius-(R+bed);if(clearance<r.minTerrainClearance){r.minTerrainClearance=clearance;r.worstTime=time;}if(.006-bed<r.minWaterDepth){r.minWaterDepth=.006-bed;r.shallowestPoint={time,lat,lon,local:local.toArray()};}
    for(const b of nearby){bridgePoint.copy(p).applyMatrix4(b.inverse);const {x,y,z}=bridgePoint;if(Math.abs(z)>b.width/2+.003||Math.abs(x)>b.length/2)continue;const lower=Math.abs(x)<b.opening?.018+b.rise*.71*Math.sqrt(Math.max(0,1-(x/b.opening)**2)):0,upper=.075+b.rise*Math.cos(x/(b.length/2)*Math.PI/2);if(Math.abs(x)<b.opening)b.minClearance=Math.min(b.minClearance,lower-y);if(y>lower+.001&&y<upper&&y>0){b.collisionSamples++;b.firstCollision??={time,boat:i,point:bridgePoint.toArray(),underside:lower,deck:upper};}}
   }
  }
  world.update(time+.001,{night:0});world.boats.forEach((b,i)=>{const delta=b.g.position.clone().sub(centers[i]);if(delta.lengthSq()>1e-12){front.set(-1,0,0).applyQuaternion(quats[i]);results[i].minForwardAlignment=Math.min(results[i].minForwardAlignment,front.dot(delta.normalize()));}});
 }
 const bridgeResults=bridges.map((b,i)=>({bridge:i,center:b.center.toArray(),rise:b.rise,collisionSamples:b.collisionSamples,minClearance:Number.isFinite(b.minClearance)?b.minClearance:null,firstCollision:b.firstCollision}));
 const report={checkedAt:new Date().toISOString(),seconds:240,samples:961,verification:'Every actual deduplicated boat vertex versus analytic terrain and actual arched bridge section; no browser rendering claim.',passed:results.every(b=>b.minTerrainClearance>0&&b.minWaterDepth>0&&b.minForwardAlignment>.94)&&bridgeResults.every(b=>b.collisionSamples===0),boats:results,bridges:bridgeResults};await fs.writeFile(path.join(dir,'navigation-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));world.dispose();palette.dispose();if(!report.passed)process.exitCode=1;
}finally{await fs.unlink(bundle).catch(()=>{});}
