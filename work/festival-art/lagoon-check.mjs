import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.lagoon-validation.mjs');
await build({stdin:{contents:"export {THREE,createPalette} from './core.js';export {surface,LAGOON} from './surface.js';export {createFestivalLagoon} from './lagoon.js';",resolveDir:path.join(dir,'../festival-planet')},bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});
try{
 const {THREE,createPalette,surface,LAGOON,createFestivalLagoon}=await import(pathToFileURL(bundle));
 const parent=new THREE.Group(),palette=createPalette(),lagoon=createFestivalLagoon({root:parent,palette,surface});
 let minBed=1,minWater=1,maxQ=0;
 for(let t=0;t<=600;t+=1.25){
  lagoon.update(t,{daylight:1,night:0});const state=lagoon.getState();minBed=Math.min(minBed,state.minSeabedClearance);minWater=Math.min(minWater,state.minSurfaceClearance);
  for(const p of lagoon.root.userData.fishPositions){assert.ok(p.toArray().every(Number.isFinite),'Fish position remains finite');maxQ=Math.max(maxQ,surface.lagoonMask(p.clone().normalize()));}
 }
 assert.ok(minBed>.045,'Fish do not touch the sampled seabed');assert.ok(minWater>.035,'Fish remain submerged');assert.ok(maxQ<.8,'School paths stay inside lagoon');
 for(const item of lagoon.root.userData.planting)assert.ok(item.top<LAGOON.level-.02,'Underwater planting stays below water');
 const water=lagoon.root.children.find(o=>o.name.startsWith('Transparent turquoise'));
 assert.ok(water.material.transparent&&!water.material.depthWrite&&water.renderOrder===10,'Water blends over actual underwater geometry');
 const p=water.geometry.attributes.position,n=water.geometry.attributes.normal;
 for(let i=0;i<p.count;i++)assert.ok(new THREE.Vector3().fromBufferAttribute(p,i).normalize().dot(new THREE.Vector3().fromBufferAttribute(n,i))>.98,'Water front face points outward');
 const snapshot=lagoon.root.userData.fishPositions.map(p=>p.toArray());lagoon.update(800,{daylight:0,night:1});lagoon.update(600,{daylight:1,night:0});assert.deepEqual(lagoon.root.userData.fishPositions.map(p=>p.toArray()),snapshot,'Returning to saved visual time restores exact swimming poses');
 const result={...lagoon.stats,minFishBedClearance:minBed,minFishSurfaceClearance:minWater,maxSchoolQ:maxQ,plantSubmersionVerified:true,pausePreviewDeterminismVerified:true};
 await fs.writeFile(path.join(dir,'lagoon-report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 lagoon.dispose();assert.equal(parent.children.length,0,'Dispose removes only owned lagoon root');palette.dispose();
}finally{await fs.rm(bundle,{force:true});}
