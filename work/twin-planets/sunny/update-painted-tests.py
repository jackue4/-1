from pathlib import Path
p=Path('work/planet-v2/test.js');s=p.read_text(encoding='utf-8')
s=s.replace('dense instanced blades, dry anchored roots, matching animated shadow and adjustable quality','broad instanced blades, dry anchored roots, no grass shadow pass and adjustable quality')
s=s.replace('assert.ok(m.count>65000);assert.ok(m.blades.customDepthMaterial);assert.ok(m.blades.castShadow);','assert.ok(m.count>12000&&m.count<20000);assert.equal(m.blades.castShadow,false);')
s=s.replace('assert.equal(m.blades.castShadow,true)','assert.equal(m.blades.castShadow,false)')
s=s.replace("assert.equal(world.land.material.type,'MeshStandardMaterial')","assert.equal(world.land.material.type,'MeshToonMaterial')")
s=s.replace('assert.ok(leaves.count>5000)','assert.ok(leaves.count>600)')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/test-shaders.mjs');s=p.read_text(encoding='utf-8')
a=s.index('const checks=');b=s.index('let failures=0;',a)
s=s[:a]+'''const instanced='#define USE_INSTANCING\\n#define USE_INSTANCING_COLOR\\n';
const shrub=world.landscape.meshes.find(m=>m.name==='shrub leaves');
const checks=[
  ['water',world.waterMat,'toon','#define USE_COLOR\\n'],
  ['grass',world.meadow.blades.material,'toon',instanced+'#define DOUBLE_SIDED\\n'],
  ['shore-foam',world.surf[0].wave.material,'basic','#define DOUBLE_SIDED\\n'],
  ['ground',world.land.material,'toon','#define USE_COLOR\\n'],
  ['shrub',shrub.material,'toon',instanced],
  ['canopy',world.canopy.material,'toon',instanced],
  ['canopy-depth',world.canopy.customDepthMaterial,'depth','#define USE_INSTANCING\\n#define DEPTH_PACKING 3201\\n']
];
''' +s[b:]
s=s.replace('#define USE_FOG','#define USE_GRADIENTMAP\n#define USE_FOG')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/test-app.mjs');s=p.read_text(encoding='utf-8').replace("checks.push('Meadow and globe cameras switch with safe zoom bounds');", "assert.equal(window.littleBloom.getState().style,'painted-animation');assert.ok(window.littleBloom.getState().grassBlades<20000);assert.equal(window.littleBloom.getState().shadowResolution,1024);checks.push('Meadow and globe cameras switch with safe zoom bounds');")
p.write_text(s,encoding='utf-8')
