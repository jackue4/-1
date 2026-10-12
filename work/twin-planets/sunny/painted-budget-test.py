from pathlib import Path
p=Path('work/planet-v2/test.js');s=p.read_text(encoding='utf-8');needle="let time=0;"
s=s.replace(needle,'''test('Animation style stays inside the geometry and shadow budgets',()=>{
  world.update(1/60,0,{rain:0,snow:0,cloud:.2,wind:.3,night:0,mist:0});let triangles=0,shadowTriangles=0;
  world.planet.traverseVisible(o=>{if(!o.isMesh)return;const n=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);triangles+=n;if(o.castShadow)shadowTriangles+=n;});
  assert.ok(triangles<650000,`scene triangle budget: ${triangles}`);assert.ok(shadowTriangles<200000,`shadow triangle budget: ${shadowTriangles}`);
  assert.ok(world.canopy.isInstancedMesh);assert.ok(world.canopy.count>400);assert.equal(world.canopy.material.type,'MeshToonMaterial');
  results.push({renderBudget:{triangles,shadowTriangles}});
});
let time=0;''')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/check-meadow.js');s=p.read_text(encoding='utf-8');s=s.replace("im.name==='Wind meadow'?35:im.count>100?4:1", "im.name==='Wind meadow'?12:im.count>2000?4:1");p.write_text(s,encoding='utf-8')
