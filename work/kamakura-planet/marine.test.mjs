// CPU geometry / bathymetry validation. This does not substitute for WebGL QA.
import assert from 'node:assert/strict';
import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const directory=path.dirname(fileURLToPath(import.meta.url));
const source=`
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSurface} from './surface.js';
import {createMarine} from './marine.js';
const surface=createSurface(),planet=new THREE.Group(),marine=createMarine({planet,surface,palette:{}});
const p=new THREE.Vector3(),matrix=new THREE.Matrix4();
let highestPlant=-Infinity,minimumFishClearance=Infinity,highestFish=-Infinity;
assert.equal(marine.stats.fish,80);assert.equal(marine.stats.schools,5);assert.ok(marine.stats.vegetation>=200);
assert.ok(marine.stats.drawCalls<=10);assert.ok(marine.stats.triangles<130000);
for(const mesh of marine.root.children){
 for(const attribute of Object.values(mesh.geometry.attributes))assert.ok(attribute.array.every(Number.isFinite));
 assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));assert.ok(Number.isFinite(mesh.boundingSphere.radius));
 assert.equal(mesh.material.transparent,false);
}
for(const mesh of marine.root.children.slice(0,7))for(let i=0;i<mesh.count;i++){
 mesh.getMatrixAt(i,matrix);
 for(let k=0;k<mesh.geometry.attributes.position.count;k++){
  p.fromBufferAttribute(mesh.geometry.attributes.position,k).applyMatrix4(matrix);
  highestPlant=Math.max(highestPlant,p.length());assert.ok(p.length()<surface.R-.014);
 }
}
for(const planted of marine.root.userData.planting)assert.ok(Math.abs(surface.height(planted.normal)-planted.bed)<1e-7);
// Ten minutes of animated fish, including complete body and fin geometry.
for(let time=0;time<=600;time+=5){
 marine.update(.016,time,{daylight:1});
 for(const mesh of marine.root.children.slice(7))for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,matrix);
  for(let k=0;k<mesh.geometry.attributes.position.count;k++){
   p.fromBufferAttribute(mesh.geometry.attributes.position,k).applyMatrix4(matrix);
   const radius=p.length(),bed=surface.height(p.clone().normalize());
   minimumFishClearance=Math.min(minimumFishClearance,radius-bed);highestFish=Math.max(highestFish,radius);
   assert.ok(radius<surface.R-.012&&radius>bed+.001);
  }
 }
}
marine.setLowQuality(true);assert.equal(marine.getState().visibleFish,52);
marine.setLowQuality(false);assert.equal(marine.getState().visibleFish,80);
console.log(JSON.stringify({passed:true,stats:marine.stats,highestPlant,minimumFishClearance,highestFish,waterRadius:surface.R},null,2));
marine.dispose();assert.equal(planet.children.length,0);
`;
const result=await build({stdin:{contents:source,resolveDir:directory},nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],bundle:true,platform:'node',format:'esm',write:false});
assert.equal(result.errors.length,0);
try{await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));}catch(error){console.error(error.message);process.exitCode=1;}
