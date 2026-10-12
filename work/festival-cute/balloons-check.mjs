import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.balloon-validation.mjs');
await build({stdin:{contents:"export {THREE,R,anchor,createPalette} from './core.js';export {createAnimalBalloons} from './animal-balloons.js';export {batchScenery} from './optimize.js';",resolveDir:path.join(dir,'../festival-planet')},bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});
try{
 const {THREE,R,anchor,createPalette,createAnimalBalloons,batchScenery}=await import(pathToFileURL(bundle));
 const parent=new THREE.Group(),palette=createPalette(),system=createAnimalBalloons({palette});
 system.addBunch(anchor(parent,.26,.66,.065),{position:[0,.13,0],count:7,phase:1});
 system.addBunch(anchor(parent,-.41,2.84,.044),{position:[.43,.08,.1],count:4,phase:2});
 for(const [i,[lat,lon]]of [[.84,-.62],[.82,1.66],[.18,2.86],[-.18,-2.54]].entries())system.addBunch(anchor(parent,lat,lon,i===0?.64:.67),{sky:true,hero:i===0,phase:i*1.3});
 const objects=[];parent.traverse(o=>{if(o.isMesh)objects.push({o,parent:o.parent,geometry:o.geometry,material:o.material});});
 assert.equal(system.stats.animals,15);assert.equal(system.stats.ordinary,10);assert.equal(system.stats.skyGroups,4);assert.equal(system.stats.groundGroups,2);
 const sharedMaterial=objects[0].material,uniqueGeometry=new Set(objects.map(o=>o.geometry));assert.equal(new Set(objects.map(o=>o.material)).size,1,'All balloons share one material');
 let geometryDisposals=0,materialDisposals=0;for(const geo of uniqueGeometry)geo.addEventListener('dispose',()=>geometryDisposals++);sharedMaterial.addEventListener('dispose',()=>materialDisposals++);
 batchScenery(parent);assert.ok(objects.every(({o,parent:p,geometry:g})=>o.parent===p&&o.geometry===g&&!!g.attributes.color),'Batching preserves balloon colours and animation joints');
 const p=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();let backwards=0,triangles=0,minSkyRadius=Infinity,maxSkyRadius=0,maxLocalRadius=0;
 for(const geo of uniqueGeometry){const pos=geo.attributes.position,norm=geo.attributes.normal;assert.equal(pos.count,geo.attributes.color.count);for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i);assert.ok(p.toArray().every(Number.isFinite));maxLocalRadius=Math.max(maxLocalRadius,p.length());}for(let i=0;i<pos.count;i+=3){a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1).sub(a);c.fromBufferAttribute(pos,i+2).sub(a);n.fromBufferAttribute(norm,i).add(new THREE.Vector3().fromBufferAttribute(norm,i+1)).add(new THREE.Vector3().fromBufferAttribute(norm,i+2));if(b.cross(c).lengthSq()<1e-18)continue;if(b.dot(n)<-1e-10)backwards++;triangles++;}}
 assert.equal(backwards,0,'Animal and string geometry have matching normals and outward winding');
 const skyMeshes=objects.filter(({o})=>{let cur=o;while(cur){if(cur.name.includes('cloud animal friends')||cur.name==='Cloud animal friends hero')return true;cur=cur.parent;}return false;});
 for(let t=0;t<=240;t+=.5){system.update(t);parent.updateMatrixWorld(true);for(const {o}of objects)assert.ok(o.matrixWorld.elements.every(Number.isFinite));for(const {o}of skyMeshes){const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i+=23){p.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);minSkyRadius=Math.min(minSkyRadius,p.length());maxSkyRadius=Math.max(maxSkyRadius,p.length());}}}
 assert.ok(minSkyRadius>R+.4,'Flying balloons and ribbons stay above the planet');assert.ok(maxSkyRadius<R+2,'Flying animals remain close enough to read with the park');
 const saved=system.getState().poses;system.update(700);system.update(240);assert.deepEqual(system.getState().poses,saved,'Restoring visual time exactly restores balloon motion');system.update(240);assert.deepEqual(system.getState().poses,saved,'Paused visual time keeps every balloon still');
 const heroBounds=new THREE.Box3().setFromObject(system.hero);const report={...system.stats,uniqueGeometry:uniqueGeometry.size,uniqueTriangles:triangles,backwardsTriangles:backwards,minSkyHeight:minSkyRadius-R,maxSkyHeight:maxSkyRadius-R,hero:{lat:.84,lon:-.62,anchorHeight:.64,localTarget:system.heroCenter.toArray(),worldBounds:heroBounds.getSize(new THREE.Vector3()).toArray()},pauseAndRestoreVerified:true,batchingVerified:true};
 system.dispose();system.dispose();assert.equal(geometryDisposals,uniqueGeometry.size,'Every owned GPU geometry is disposed exactly once');assert.equal(materialDisposals,1,'Owned shared material is disposed once');assert.equal(system.getState().total,0);assert.ok(!system.hero.parent,'Disposal detaches the hero group');report.disposalVerified=true;palette.dispose();
 await fs.writeFile(path.join(dir,'balloons-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await fs.rm(bundle,{force:true});}
