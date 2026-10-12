import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url));
const code=`
import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {createSurface} from '../kamakura-planet/surface.js';import {oceanWave} from '../kamakura-planet/ocean.js';
import {createBeacons} from '../kamakura-planet/beacons.js';import {createMarineDetails} from '../kamakura-planet/marine-details.js';
const report={scope:'CPU geometry and animation validation; shader/browser verification is separate',passed:false,checks:[]};
let beacons,marine;try{
 const surface=createSurface(),planet=new THREE.Group();beacons=createBeacons({planet,surface});marine=createMarineDetails({planet,surface});
 report.beacons=beacons.stats;report.marine=marine.stats;report.totalTriangles=beacons.stats.triangles+marine.stats.triangles;report.totalDrawCalls=beacons.stats.drawCalls+marine.stats.drawCalls;
 assert.ok(report.totalTriangles<=60000&&report.totalDrawCalls<=24);assert.equal(beacons.getBeams().length,4);
 for(const root of[beacons.root,marine.root])root.traverse(mesh=>{if(!mesh.isMesh)return;for(const a of Object.values(mesh.geometry.attributes))assert.ok(a.array.every(Number.isFinite));if(mesh.isInstancedMesh)assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));});
 report.checks.push('All initial geometry and instance transforms are finite; both modules meet combined budget.');
 const old=beacons.getBeams()[0];assert.ok(old.source.distanceTo(surface.direction(-.56,-.69).multiplyScalar(surface.R+.428))<1e-9);
 beacons.update(0,{daylight:1,night:0});assert.ok(beacons.getBeams().every(b=>b.power===0));assert.ok(beacons.root.children.filter(m=>m.renderOrder===11).every(m=>!m.visible));
 let minTargetDepth=Infinity,minRayDown=Infinity,maxBeamStep=0,maxBeamWaveError=0,previous=null;
 for(let t=0;t<=900;t+=.5){beacons.update(t,{daylight:.1,night:1});const beams=beacons.getBeams();for(let i=0;i<beams.length;i++){const b=beams[i],n=b.target.clone().normalize(),depth=surface.R-surface.height(n),down=b.source.clone().normalize().dot(b.source.clone().sub(b.target));assert.ok(depth>.03&&b.power>0);assert.ok(b.cosInner>b.cosOuter);minTargetDepth=Math.min(minTargetDepth,depth);minRayDown=Math.min(minRayDown,down);maxBeamWaveError=Math.max(maxBeamWaveError,Math.abs(b.target.length()-(surface.R+oceanWave(n,t)+.002)));if(previous)maxBeamStep=Math.max(maxBeamStep,b.target.distanceTo(previous[i]));}previous=beams.map(b=>b.target.clone());}
 assert.ok(minRayDown>.05&&maxBeamStep<.055&&maxBeamWaveError<1e-6);report.lightMetrics={minTargetDepth,minRayDown,maxBeamStep,maxBeamWaveError};
 const nightState=beacons.getState();beacons.update(900,{daylight:.1,night:1});assert.deepEqual(beacons.getState(),nightState);report.checks.push('Four light targets stay over actual sea, point downward, follow waves, move smoothly, switch off by day and freeze at unchanged time.');
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),n=new THREE.Vector3();let minAnimalBed=Infinity,maxAnimalRadius=0,maxStaticRadius=0,minStaticBed=Infinity,minBubbleBed=Infinity,maxBubbleRadius=0;
 const animals=marine.root.children.slice(0,3),staticMeshes=marine.root.children.slice(3,6),bubbles=marine.root.children[6];
 for(const mesh of staticMeshes)for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);for(let j=0;j<mesh.geometry.attributes.position.count;j++){p.fromBufferAttribute(mesh.geometry.attributes.position,j).applyMatrix4(matrix);maxStaticRadius=Math.max(maxStaticRadius,p.length());minStaticBed=Math.min(minStaticBed,p.length()-surface.height(n.copy(p).normalize()));assert.ok(p.length()<surface.R-.012);}}
 for(let t=0;t<=600;t+=2){marine.update(.016,t,{daylight:1});for(const mesh of animals)for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);for(let j=0;j<mesh.geometry.attributes.position.count;j++){p.fromBufferAttribute(mesh.geometry.attributes.position,j);if(mesh.name.startsWith('Two blue'))p.y+=Math.sin(t*1.6+p.x*14+matrix.elements[12]*2.1+matrix.elements[13]*3.4+matrix.elements[14]*1.3)*Math.abs(p.x)*.20;p.applyMatrix4(matrix);const r=p.length(),bed=surface.height(n.copy(p).normalize());minAnimalBed=Math.min(minAnimalBed,r-bed);maxAnimalRadius=Math.max(maxAnimalRadius,r);assert.ok(r>bed+.005&&r<surface.R-.012,JSON.stringify({time:t,mesh:mesh.name,instance:i,vertex:j,radius:r,bed}));}}
  for(let i=0;i<bubbles.count;i++){bubbles.getMatrixAt(i,matrix);for(let j=0;j<bubbles.geometry.attributes.position.count;j++){p.fromBufferAttribute(bubbles.geometry.attributes.position,j).applyMatrix4(matrix);const r=p.length(),bed=surface.height(n.copy(p).normalize());minBubbleBed=Math.min(minBubbleBed,r-bed);maxBubbleRadius=Math.max(maxBubbleRadius,r);assert.ok(r>bed+.008&&r<surface.R-.014);}}
 }
 assert.ok(minStaticBed>0,'Static seabed clearance '+minStaticBed);report.marineMetrics={minAnimalBed,maxAnimalRadius,maxStaticRadius,minStaticBed,minBubbleBed,maxBubbleRadius};report.checks.push('600-second checks cover every animal, animated fin/ray vertex and bubble; all stay underwater and above the seabed.');
 const before=marine.root.children.map(m=>Array.from(m.instanceMatrix.array));marine.update(0,600,{daylight:1});assert.deepEqual(marine.root.children.map(m=>Array.from(m.instanceMatrix.array)),before);marine.setLowQuality(true);marine.update(0,600,{});assert.equal(marine.getState().bubbles,12);marine.setLowQuality(false);marine.update(0,600,{});assert.equal(marine.getState().bubbles,24);
 report.checks.push('Unchanged time preserves poses; light quality mode reduces bubbles and restores full count.');
 beacons.dispose();marine.dispose();assert.equal(planet.children.length,0);report.checks.push('Disposal detaches both complete modules.');report.passed=true;
}catch(e){report.error=e.message.slice(0,1500);process.exitCode=1;}
fs.writeFileSync(process.env.HARBOR_REPORT_PATH,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
`;
const outfile=path.join(directory,'beacons-marine-test-bundle.mjs');
await build({stdin:{contents:code,resolveDir:directory},outfile,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],bundle:true,platform:'node',format:'esm'});
process.env.HARBOR_REPORT_PATH=path.join(directory,'beacons-marine-report.json');
await import(pathToFileURL(outfile).href);
