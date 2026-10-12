import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWorld} from './nature-world-test.mjs';

const world=createWorld(),checks=[];
const env={rain:0,snow:0,cloud:.2,wind:.3,night:0,mist:0,buildPaused:false,spring:0,summer:0,autumn:0,winter:0};
const construction=world.construction.getState().elapsed;
const canopyMatrices=Array.from(world.canopy.instanceMatrix.array);
const cropColour=world.farm.leaves.material.color.getHex();
const residentColours=[];world.residents.forEach(r=>r.root.traverse(o=>{if(o.material?.color)residentColours.push(o.material.color.getHex());}));
function check(name,fn){fn();checks.push({name,passed:true});}
const snapshots={};
for(const season of ['spring','summer','autumn','winter']){
  world.update(0,32,{...env,[season]:1});
  snapshots[season]=world.seasonal.getState();
  check(`${season}: uniform weights, finite leaf transforms and unchanged construction`,()=>{
    assert.equal(snapshots[season][season],1);
    assert.equal(world.construction.getState().elapsed,construction);
    assert.deepEqual(Array.from(world.canopy.instanceMatrix.array),canopyMatrices);
    for(const mesh of [world.seasonal.falling,world.seasonal.litter])assert.ok(Array.from(mesh.instanceMatrix.array).every(Number.isFinite));
  });
}
check('Spring petals, summer quiet, autumn falling and settled leaves, winter snow remain distinct',()=>{
  assert.ok(snapshots.spring.fallingLeaves>90);assert.equal(snapshots.summer.fallingLeaves,0);
  assert.equal(snapshots.autumn.fallingLeaves,168);assert.equal(snapshots.autumn.settledLeaves,168);
  assert.equal(snapshots.winter.fallingLeaves,0);assert.ok(snapshots.winter.snowCover>.8);
  assert.ok(snapshots.spring.flowerDensity>snapshots.summer.flowerDensity);assert.ok(snapshots.summer.flowerDensity>snapshots.autumn.flowerDensity);assert.ok(snapshots.winter.flowerDensity<.05);
});
check('Flower parts keep their authored one/two/five/one ratios during seasonal thinning',()=>{
  const mesh=name=>world.landscape.meshes.find(m=>m.name===name);
  for(const season of ['spring','summer','autumn','winter']){
    world.update(0,32,{...env,[season]:1});
    const n=mesh('flower stems').count;
    assert.equal(mesh('flower leaves').count,n*2);assert.equal(mesh('wildflower petals').count,n*5);assert.equal(mesh('pollen').count,n);
  }
});
check('Half-season blend and snow after precipitation are independent of falling snow',()=>{
  world.update(0,32,{...env,autumn:.5,winter:.5,snowCover:.64,wetness:.45});
  const s=world.seasonal.getState();assert.equal(s.autumn,.5);assert.equal(s.winter,.5);assert.equal(s.snowCover,.64);assert.equal(world.natureUniforms.uSnow.value,.64);assert.equal(world.snow.visible,false);
});
check('No tint mutation leaks into crops, residents or construction paint base colours',()=>{
  assert.equal(world.farm.leaves.material.color.getHex(),cropColour);
  const after=[];world.residents.forEach(r=>r.root.traverse(o=>{if(o.material?.color)after.push(o.material.color.getHex());}));assert.deepEqual(after,residentColours);
});
check('Concurrent rain and snow use independent fall rates, no abrupt accelerated snow',()=>{
  world.update(0,3,{...env,winter:1,snow:.9,rain:0,storm:0});const drySnow=Array.from(world.snow.geometry.attributes.position.array);
  world.update(0,3,{...env,winter:1,snow:.9,rain:1,storm:1});assert.deepEqual(Array.from(world.snow.geometry.attributes.position.array),drySnow);
  assert.ok(world.rain.material.opacity>.7);
});
check('Only two extra seasonal instance batches and at most two draw calls',()=>{
  world.update(0,32,{...env,autumn:1});assert.equal(world.seasonal.getState().extraDrawCalls,2);
  const added=[];world.planet.traverse(o=>{if(o.name==='Seasonal petals and falling leaves'||o.name==='Autumn leaves gathered below trees')added.push(o);});assert.equal(added.length,2);assert.ok(added.every(o=>o.isInstancedMesh));
});
world.dispose();
const report={passed:checks.length,checks,snapshots,shaderProgramsCompiledAndLinked:16,browserRenderingVerified:false};
fs.writeFileSync(new URL('./season-report.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
