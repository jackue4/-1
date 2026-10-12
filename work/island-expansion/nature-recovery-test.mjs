import {register} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const dependency='file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/three/';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s==='three')return n('${dependency}build/three.module.js',c);if(s.startsWith('three/'))return n('${dependency}'+s.slice(6),c);return n(s,c);}`));
const THREE=await import('three');
const {createSurface,createLand}=await import('../kamakura-planet/surface.js');
const {createTown}=await import('../kamakura-planet/town.js');
const {createLandmarks}=await import('../kamakura-planet/landmarks.js');
const {createIslandGardens}=await import('../kamakura-planet/island-gardens.js');
const {createCoastalNature}=await import('../kamakura-planet/coastal-nature.js');
const planet=new THREE.Group(),surface=createSurface(),land=createLand(planet,{ramp:null}),town=createTown({planet,surface}),landmarks=createLandmarks({planet,surface,town}),gardens=createIslandGardens({planet,surface,town,landmarks}),nature=createCoastalNature({planet,surface,town,landmarks,gardens});
const checks=[];
function check(name,fn){try{checks.push({name,passed:true,details:fn()});}catch(e){checks.push({name,passed:false,error:e.message});}}
check('New foliage builds alongside all current placement reservations with finite geometry',()=>{let triangles=0;nature.root.traverse(o=>{if(o.geometry){for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));triangles+=o.geometry.attributes.position.count/3;}});assert.equal(triangles,nature.stats.triangles);assert.ok(triangles<50000);assert.equal(nature.stats.phoenixTrees,2);assert.equal(nature.stats.banyanTrees,1);return{triangles,drawCalls:nature.stats.drawCalls,placements:nature.stats.placements.length};});
check('Exposed banyan roots contact the rendered curved land mesh',()=>{land.mesh.updateMatrixWorld(true);const ray=new THREE.Raycaster();let minGap=Infinity,maxGap=-Infinity;for(const sample of nature.root.userData.rootSamples){const n=new THREE.Vector3(...sample.normal);ray.set(n.clone().multiplyScalar(surface.R+1),n.clone().negate());const hit=ray.intersectObject(land.mesh,false)[0];assert.ok(hit);const p=new THREE.Vector3(...sample.position),gap=p.length()-hit.point.length();minGap=Math.min(minGap,gap);maxGap=Math.max(maxGap,gap);assert.ok(gap>-sample.radius&&gap<sample.radius+.004,'Detached or buried root: '+gap);}return{samples:nature.root.userData.rootSamples.length,minGap,maxGap};});
check('Time and explicit pause keep breeze uniforms stable',()=>{nature.update(21,{daylight:.6});assert.equal(nature.root.userData.wind.time,21);nature.update(80,{paused:true,daylight:.6});assert.equal(nature.root.userData.wind.time,21);nature.update(21,{daylight:.6});assert.equal(nature.root.userData.wind.time,21);return{frozenTime:21};});
check('Owned geometry and materials are released',()=>{let g=0,m=0;nature.root.traverse(o=>{o.geometry?.addEventListener('dispose',()=>g++);o.material?.addEventListener('dispose',()=>m++);});nature.dispose();assert.equal(nature.root.parent,null);assert.equal(g,3);assert.equal(m,3);return{geometries:g,materials:m};});
const report={scope:'CPU geometry, rendered-mesh raycasts and uniform state only; no GPU appearance proof',passed:checks.every(c=>c.passed),checks};await fs.writeFile(new URL('nature-recovery-report.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
