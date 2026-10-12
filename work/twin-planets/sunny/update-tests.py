from pathlib import Path
p=Path('work/planet-v2/landscape.js');s=p.read_text(encoding='utf-8').replace('transformed+=transpose(mat3(instanceMatrix))*delta/max(dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),.00001);','transformed+=vec3(dot(instanceMatrix[0].xyz,delta)/dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,delta)/dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,delta)/dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/test.js');s=p.read_text(encoding='utf-8').replace("assert.equal(world.land.material.type,'MeshToonMaterial')","assert.equal(world.land.material.type,'MeshStandardMaterial')")
s=s.replace('assert.ok(m.count>20000)','assert.ok(m.count>65000)')
s=s.replace("let time=0;",'''test('Landscape keeps continuous paths anchored and dense flower banks off the walking corridor',()=>{
  const l=world.landscape;assert.ok(l.counts.flowers>1000);assert.ok(l.counts.shrubs>90);assert.ok(l.counts.fencePosts>30);assert.ok(l.counts.rocks>20);
  const positions=l.path.geometry.attributes.position;for(let i=0;i<positions.count;i++){const p=new THREE.Vector3().fromBufferAttribute(positions,i);assert.ok(Math.abs(p.length()-terrainHeight(p.clone().normalize())-.0035)<1e-5);}
  const petals=l.meshes.find(m=>m.name==='wildflower petals');assert.ok(petals.count>5000);
  const leaves=l.meshes.find(m=>m.name==='shrub leaves');assert.ok(leaves.customDepthMaterial);assert.ok(leaves.count>5000);
  results.push({landscape:l.counts});
});
let time=0;''')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/test-app.mjs');s=p.read_text(encoding='utf-8').replace("$('rotate-toggle').click();assert.equal($('rotate-toggle').getAttribute('aria-pressed'),'false');", "$('rotate-toggle').click();assert.equal($('rotate-toggle').getAttribute('aria-pressed'),'true');assert.equal(window.littleBloom.getState().viewMode,'globe');$('rotate-toggle').click();assert.equal($('rotate-toggle').getAttribute('aria-pressed'),'false');")
s=s.replace("const checks=[];", "const checks=[];assert.equal(window.littleBloom.getState().viewMode,'meadow');assert.equal(window.littleBloom.getState().preview,true);assert.ok(window.littleBloom.getState().cameraDistance<5);$('globe-view').click();assert.equal(window.littleBloom.getState().viewMode,'globe');assert.ok(window.littleBloom.getState().cameraDistance>8);$('meadow-view').click();assert.equal(window.littleBloom.getState().viewMode,'meadow');assert.ok(window.littleBloom.getState().cameraDistance<5);checks.push('Meadow and globe cameras switch with safe zoom bounds');")
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/test-shaders.mjs');s=p.read_text(encoding='utf-8');s=s.replace('let failures=0;', '''const shrub=world.landscape.meshes.find(m=>m.name==='shrub leaves');
checks.push(['ground',world.land.material,'standard','#define USE_COLOR\\n'],['shrub',shrub.material,'standard','#define USE_INSTANCING\\n#define USE_INSTANCING_COLOR\\n'],['shrub-depth',shrub.customDepthMaterial,'depth','#define USE_INSTANCING\\n#define DEPTH_PACKING 3201\\n']);
let failures=0;''')
p.write_text(s,encoding='utf-8')
