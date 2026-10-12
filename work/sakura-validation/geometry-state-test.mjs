import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWorld,R} from './final-shader-world.mjs';
import * as THREE from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/three/build/three.module.js';

const world=createWorld(),env={rain:0,snow:0,cloud:.2,wind:.4,night:0,mist:0,petAway:0},checks=[];
const flying=world.sakuraGarden.root.getObjectByName('Cherry petals · continuous windfall'),fallen=world.sakuraGarden.root.getObjectByName('Grounded cherry petal drifts');
let meshes=0,instanced=0,attributes=0,instances=0,allTriangles=0,visibleTriangles=0,visibleMeshBatches=0;
function geometryCheck(){world.planet.updateMatrixWorld(true);world.planet.traverse(object=>{
  assert.ok(object.matrixWorld.elements.every(Number.isFinite),`${object.name}: finite world transform`);
  if(object.geometry)for(const [name,attr] of Object.entries(object.geometry.attributes)){assert.ok(attr.array.every(Number.isFinite),`${object.name}: finite ${name}`);attributes++;}
  if(object.isInstancedMesh){assert.ok(object.instanceMatrix.array.every(Number.isFinite),`${object.name}: finite instance transforms`);instanced++;instances+=object.count;}
  if(object.isMesh){meshes++;const triangles=(object.geometry.index?.count??object.geometry.attributes.position.count)/3*(object.isInstancedMesh?object.count:1);allTriangles+=triangles;let visible=true;for(let p=object;p;p=p.parent)if(!p.visible)visible=false;if(visible){visibleTriangles+=triangles;visibleMeshBatches++;}}
});}
world.update(1/30,0,env);geometryCheck();checks.push('Every geometry attribute and object/instance transform is finite');
assert.equal(world.canopy.count,153);assert.equal(world.sakuraGarden.stats.sourceClusters,world.canopy.count);assert.equal(world.sakuraGarden.stats.decks,1);assert.equal(world.sakuraGarden.stats.lanterns,4);assert.equal(world.sakuraGarden.stats.drawCalls,5);checks.push('153 live tree crown clusters feed the 5-batch spring garden');
const leaves=world.canopyDetail.leaves;
assert.equal(leaves.material.map,leaves.customDepthMaterial.map);assert.equal(leaves.material.alphaTest,leaves.customDepthMaterial.alphaTest);assert.equal(leaves.material.side,leaves.customDepthMaterial.side);assert.equal(leaves.count,world.canopy.count*world.canopyDetail.perClump);checks.push('Petal-edge foliage uses matching cutout and depth masks');
const matrix=new THREE.Matrix4(),p=new THREE.Vector3();let lowestClearance=Infinity,lowestDryHeight=Infinity;
for(let i=0;i<fallen.count;i++){fallen.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix);const radial=p.length(),ground=world.terrainHeight(p.clone().normalize());lowestClearance=Math.min(lowestClearance,radial-ground);lowestDryHeight=Math.min(lowestDryHeight,ground-R);assert.ok(radial>ground+.001);assert.ok(ground>R+.05);}
checks.push('All 570 ground petals sit above dry terrain');
assert.equal(flying.count,380);const before=flying.instanceMatrix.array.slice();world.update(1/30,1,env);assert.ok(flying.instanceMatrix.array.some((v,i)=>Math.abs(v-before[i])>.00001));checks.push('Continuous petals move across time');
world.trigger('petals');world.update(1/30,1.1,env);assert.equal(flying.count,660);world.update(1/30,14,env);assert.equal(flying.count,380);checks.push('Wish rises to 660 petals and returns to 380 after eleven seconds');
const weatherCounts={day:flying.count};
for(const [key,next]of [['night',{night:1}],['rain',{rain:1}],['snow',{snow:1}],['storm',{rain:1,snow:1,night:1}]]){world.update(1/30,20,{...env,...next});weatherCounts[key]=flying.count;assert.ok(flying.count<weatherCounts.day);assert.ok(flying.instanceMatrix.array.every(Number.isFinite));}
assert.equal(fallen.visible,false);world.update(1/30,25,env);assert.equal(fallen.visible,true);assert.equal(flying.count,380);checks.push('Night, rain and snow reduce falling petals; snow hides ground petals and clear weather restores them');
world.sakuraGarden.update(40,{...env,wind:0});const calm=flying.instanceMatrix.array.slice();world.natureUniforms.uWind.value=2;world.sakuraGarden.update(40,{...env,wind:0});assert.ok(flying.instanceMatrix.array.some((v,i)=>Math.abs(v-calm[i])>.00001));checks.push('Petals respond to the shared world wind uniform');
for(const t of [60,180,360]){world.update(1/30,t,env);world.planet.updateMatrixWorld(true);world.planet.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isInstancedMesh)assert.ok(o.instanceMatrix.array.every(Number.isFinite));});}
checks.push('World animation remains finite at 60, 180 and 360 seconds');
const report={passed:checks.length,checks,meshes,instanced,instances,attributes,allTriangles,visibleTriangles,visibleMeshBatches,treeCrownClusters:world.canopy.count,leafInstances:leaves.count,garden:world.sakuraGarden.stats,weatherCounts,lowestGroundPetalClearance:lowestClearance,lowestDryGroundHeight:lowestDryHeight,note:'CPU scene and geometry checks. Triangle and mesh-batch totals include no GPU culling, shadows or driver timing.'};
world.dispose();fs.writeFileSync(new URL('./geometry-state-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
