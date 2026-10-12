import {register} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dep='file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/three/';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s==='three')return n('${dep}build/three.module.js',c);if(s.startsWith('three/'))return n('${dep}'+s.slice(6),c);return n(s,c);}`));
const THREE=await import('three');
const {createSurface,direction}=await import('../kamakura-planet/surface.js');
const {coastCameraPose,setCameraViewport}=await import('../kamakura-planet/camera-layout.js');
const {createTown}=await import('../kamakura-planet/town.js');
const surface=createSurface(),camera=new THREE.PerspectiveCamera(43,1,.08,70),pose=coastCameraPose(surface);
camera.position.copy(pose.position);camera.up.copy(pose.up);camera.lookAt(pose.target);camera.updateMatrixWorld();
const town=createTown({planet:new THREE.Group(),surface});
const landmarks=[
 ['school',.835,-.55,.26],['station',town.root.userData.station.lat,town.root.userData.station.lon,.12],
 ['crossing',surface.trackLat(-.2),-.2,.12],['lagoon',-.067,-.20,0],['beach',-.1,.03,0],
 ['west shore',.2,-.95,.04],['east shore',.2,.48,.04],['tea room',.315,.7,.20],['cottage',.3,-1.13,.20],['lighthouse',.52,-1.2,.36]
].map(([name,lat,lon,alt])=>{const n=direction(lat,lon);return{name,point:n.multiplyScalar(Math.max(surface.R,surface.baseHeight(n))+alt)};});
const checks=[];
function check(name,run){try{checks.push({name,passed:true,details:run()})}catch(e){checks.push({name,passed:false,error:e.message})}}
const bounds=points=>points.reduce((b,p)=>({minX:Math.min(b.minX,p.x),maxX:Math.max(b.maxX,p.x),minY:Math.min(b.minY,p.y),maxY:Math.max(b.maxY,p.y)}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
const round=b=>Object.fromEntries(Object.entries(b).map(([key,value])=>[key,+value.toFixed(4)]));
for(const [width,height] of [[390,700],[852,300],[932,360],[568,260]])check(`Coast landmarks and town geometry fit ${width}x${height}`,()=>{
 assert.ok(setCameraViewport(camera,'coast',width,height));
 const projected=landmarks.map(p=>({...p,ndc:p.point.clone().project(camera)})),b=bounds(projected.map(p=>p.ndc));
 for(const p of projected){assert.ok(Math.abs(p.ndc.x)<.95,`${p.name} outside horizontal composition: ${p.ndc.x}`);assert.ok(Math.abs(p.ndc.y)<.9,`${p.name} outside vertical composition: ${p.ndc.y}`);assert.ok(p.ndc.z>-1&&p.ndc.z<1,`${p.name} depth clipped`);}
 const townPoints=[],point=new THREE.Vector3();town.root.traverse(o=>{if(o.geometry){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){point.fromBufferAttribute(a,i).project(camera);townPoints.push({x:point.x,y:point.y});}}});
 const townBounds=bounds(townPoints);assert.ok(townBounds.minX>-1&&townBounds.maxX<1,'Town cropped horizontally');assert.ok(townBounds.minY>-1&&townBounds.maxY<1,'Town cropped vertically');
 return{fov:+camera.fov.toFixed(3),landmarks:round(b),town:round(townBounds),vertices:townPoints.length};
});
check('Portrait to landscape and back restores projection without resetting the orbit',()=>{
 camera.position.add(new THREE.Vector3(.4,-.2,.3));camera.lookAt(pose.target.clone().addScalar(.13));camera.updateMatrixWorld();
 const original={position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),up:camera.up.toArray()};
 setCameraViewport(camera,'coast',390,700);const projection=camera.projectionMatrix.toArray();
 for(const [w,h] of[[852,300],[932,360],[568,260],[390,700]]){
  setCameraViewport(camera,'coast',w,h);
  assert.deepEqual(camera.position.toArray(),original.position);assert.deepEqual(camera.quaternion.toArray(),original.quaternion);assert.deepEqual(camera.up.toArray(),original.up);
 }
 assert.deepEqual(camera.projectionMatrix.toArray(),projection);return{resizes:4,orbitPreserved:true,projectionRestored:true};
});
check('Hidden hosts keep their last valid lens; near-square rotation stays continuous',()=>{
 const saved=camera.projectionMatrix.toArray();assert.equal(setCameraViewport(camera,'coast',0,0),false);assert.equal(setCameraViewport(camera,'coast',NaN,700),false);assert.deepEqual(camera.projectionMatrix.toArray(),saved);
 setCameraViewport(camera,'coast',700,700);const square=camera.projectionMatrix.toArray();setCameraViewport(camera,'coast',699,700);
 const difference=Math.max(...camera.projectionMatrix.toArray().map((v,i)=>Math.abs(v-square[i])));assert.ok(difference<.005);return{maxMatrixChange:difference};
});
check('Detail, train, cruise and globe lenses keep aspect adaptation and have no coast offset',()=>{
 for(const mode of['town','sea','voyage','cottage','stream','beacon','telephone','train','cruise','globe'])for(const [w,h]of[[390,700],[852,300]]){
  const position=camera.position.toArray(),quaternion=camera.quaternion.toArray();setCameraViewport(camera,mode,w,h);assert.equal(camera.aspect,w/h);assert.ok(camera.projectionMatrix.elements.every(Number.isFinite));assert.ok(!camera.view?.enabled);assert.deepEqual(camera.position.toArray(),position);assert.deepEqual(camera.quaternion.toArray(),quaternion);
 }return{modes:10,viewportPairs:2};
});
town.dispose();const report={passed:checks.every(c=>c.passed),scope:'CPU perspective projection only; not browser or GPU rendering',checks};
await fs.writeFile(new URL('./camera-report.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
