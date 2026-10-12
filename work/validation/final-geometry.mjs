import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWorld} from './final-shader-world.mjs';
const world=createWorld();
const env={rain:0,snow:0,cloud:.2,wind:.4,night:0,mist:0};
world.update(1/30,2,env);world.planet.updateMatrixWorld(true);
let meshes=0,instanced=0,attributes=0,instances=0;
world.planet.traverse(object=>{
  assert.ok(object.matrixWorld.elements.every(Number.isFinite),`${object.name}: finite transform`);
  if(object.isMesh)meshes++;
  if(object.geometry)for(const [name,attr] of Object.entries(object.geometry.attributes)){
    assert.ok(attr.array.every(Number.isFinite),`${object.name}: finite ${name}`);attributes++;
  }
  if(object.isInstancedMesh){instanced++;instances+=object.count;assert.ok(object.instanceMatrix.array.every(Number.isFinite),`${object.name}: finite instance transforms`);}
});
const leaves=world.canopyDetail.leaves;
assert.equal(leaves.material.map,leaves.customDepthMaterial.map);
assert.equal(leaves.material.alphaTest,leaves.customDepthMaterial.alphaTest);
assert.equal(leaves.material.side,leaves.customDepthMaterial.side);
assert.equal(leaves.count,world.canopy.count*world.canopyDetail.perClump);
const report={passed:true,meshes,instanced,instances,attributes,leafInstances:leaves.count,leavesPerCrown:world.canopyDetail.perClump,checks:['All scene geometry attributes and object/instance transforms finite','Leaf cutout/shadow mask and sides match','Leaf count agrees with current crown layout'],note:'CPU geometry validation, not GPU frame timing or visual review.'};
world.dispose();fs.writeFileSync(new URL('./final-geometry-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
