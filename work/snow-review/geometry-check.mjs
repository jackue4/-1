import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.geometry-check.bundle.mjs');
await build({stdin:{contents:"export {THREE,R,normal,createPalette} from './core.js';export {createSnowWorld,landField,groundHeight} from './world.js';export {createSnowfall} from './nature.js';export {batchScenery} from '../festival-planet/optimize.js';",resolveDir:path.join(dir,'../snow-planet')},bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});
const checks=[],check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
try{
 const {THREE,R,createPalette,createSnowWorld,landField,groundHeight,createSnowfall,batchScenery}=await import(pathToFileURL(bundle));
 const planet=new THREE.Group(),palette=createPalette(),world=createSnowWorld({planet,palette}),snow=createSnowfall({THREE,parent:planet,radius:R,mobile:true});
 let samples=0,lo=Infinity,hi=-Infinity,bad=0;
 for(let la=-90;la<=90;la++)for(let ln=-180;ln<=180;ln++){const lat=la*Math.PI/180,lon=ln*Math.PI/180,h=groundHeight(lat,lon),field=landField(lat,lon);samples++;if(!Number.isFinite(h)||!Number.isFinite(field))bad++;lo=Math.min(lo,h);hi=Math.max(hi,h);}
 check('Globe terrain is finite at every one-degree sample including poles and longitude seam',bad===0&&lo>-.3&&hi<.5,{samples,minHeight:lo,maxHeight:hi,bad});
 let meshes=0,vertices=0,nonFinite=0;const geometries=new Set(),materials=new Set();
 planet.traverse(o=>{if(!o.isMesh&&!o.isPoints)return;meshes++;if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 for(const g of geometries)for(const a of Object.values(g.attributes)){if(a===g.attributes.position)vertices+=a.count;for(const v of a.array)if(!Number.isFinite(v))nonFinite++;}
 check('All generated geometry and custom attributes contain finite values',nonFinite===0,{meshes,uniqueGeometries:geometries.size,vertices,nonFinite});
 const base=THREE.ShaderLib.phong,shader={uniforms:{...base.uniforms},vertexShader:base.vertexShader,fragmentShader:base.fragmentShader};world.water.material.onBeforeCompile(shader);
 check('Lake shader patches both actual Three Phong stages and binds animation uniforms',shader.vertexShader.includes('vLakePosition=position;')&&shader.fragmentShader.includes('float ripple=')&&shader.fragmentShader.includes('uNight*.58')&&shader.uniforms.uTime&&shader.uniforms.uNight,{vertexInjection:shader.vertexShader.includes('vLakePosition=position;'),fragmentInjection:shader.fragmentShader.includes('float ripple='),note:'Source injection check, not GPU shader compilation'});
 const bridges=[];planet.updateMatrixWorld(true);planet.traverse(o=>{if(o.userData.kind==='bridge')bridges.push(o);});
 const bridgeFindings=bridges.map(b=>{const center=b.getWorldPosition(new THREE.Vector3()),lat=Math.asin(center.y/center.length()),lon=Math.atan2(center.x,center.z),endpoints=[-1,1].map(sign=>{const p=b.localToWorld(new THREE.Vector3(sign*b.userData.length/2,0,0)),a=Math.asin(p.y/p.length()),l=Math.atan2(p.x,p.z);return{lat:a,lon:l,land:landField(a,l),height:groundHeight(a,l)};});return{lat,lon,length:b.userData.length,ends:endpoints,canal:Math.abs(lon-.78)<.1&&Math.abs(lat)<.65};});
 const canalBridges=bridgeFindings.filter(b=>b.canal);check('Canal stone bridges cross from one bank to the other',canalBridges.every(b=>Math.min(...b.ends.map(e=>e.lon))<.71&&Math.max(...b.ends.map(e=>e.lon))>.85),{bridges:bridgeFindings});
 const heading=world.boats.map(()=>({minAxisAlignment:1,maxYawChange:0,minimumWaterDepth:1,minHullClearance:1})),lastQuaternions=[];
 for(let time=0;time<=240;time+=.25){
  world.update(time,{night:0});planet.updateMatrixWorld(true);const positions=world.boats.map(b=>b.g.position.clone()),quats=world.boats.map(b=>b.model.getWorldQuaternion(new THREE.Quaternion()));
  world.update(time+.001,{night:0});planet.updateMatrixWorld(true);
  world.boats.forEach((b,i)=>{const delta=b.g.position.clone().sub(positions[i]);if(delta.lengthSq()>1e-12){const axis=new THREE.Vector3(1,0,0).applyQuaternion(quats[i]);heading[i].minAxisAlignment=Math.min(heading[i].minAxisAlignment,Math.abs(axis.dot(delta.normalize())));}if(lastQuaternions[i])heading[i].maxYawChange=Math.max(heading[i].maxYawChange,lastQuaternions[i].angleTo(quats[i]));lastQuaternions[i]=quats[i];const n=positions[i].clone().normalize(),lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z);heading[i].minimumWaterDepth=Math.min(heading[i].minimumWaterDepth,.006-groundHeight(lat,lon));});
 }
 check('Boat hull longitudinal axes follow the actual trajectories',heading.every(b=>b.minAxisAlignment>.94),{seconds:240,samplesPerBoat:961,boats:heading});
 check('All boat centerlines remain over lake or canal water',heading.every(b=>b.minimumWaterDepth>.02),{minimumDepths:heading.map(b=>b.minimumWaterDepth)});
 function animatedSnapshot(){planet.updateMatrixWorld(true);return{boats:world.boats.map(b=>[...b.g.matrix.elements,...b.model.matrix.elements]),snow:[...snow.points.geometry.attributes.position.array],fade:[...snow.points.geometry.attributes.aFade.array],waterTime:shader.uniforms.uTime.value};}
 world.update(27,{night:1});snow.update(0,27,{night:1,intensity:.6});const saved=animatedSnapshot();for(let n=0;n<80;n++){world.update(27,{night:1});snow.update(0,27,{night:1,intensity:.6});}check('Absolute-time boat, lake and snow updates remain exact while paused',JSON.stringify(saved)===JSON.stringify(animatedSnapshot()));
 for(let n=1;n<80;n++){world.update(27+n/20,{night:0,preview:true});snow.update(.05,27+n/20,{night:0,intensity:.6});}world.update(27,{night:1});snow.update(0,27,{night:1,intensity:.6});check('Restoring play time restores boat, lake and snow state after preview exactly',JSON.stringify(saved)===JSON.stringify(animatedSnapshot()));
 const protectedBefore=animatedSnapshot(),countsBefore={triangles:0,meshes:0};const tally=()=>{let triangles=0,meshes=0;planet.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});return{triangles,meshes};};Object.assign(countsBefore,tally());const batching=batchScenery(world.staticRoot),countsAfter=tally();
 check('Static batching preserves triangle count and all moving transforms',countsBefore.triangles===countsAfter.triangles&&JSON.stringify(protectedBefore)===JSON.stringify(animatedSnapshot()),{before:countsBefore,after:countsAfter,batching});
 let disposedGeometries=0,disposedMaterials=0;for(const g of geometries)g.addEventListener('dispose',()=>disposedGeometries++);for(const m of materials)m.addEventListener('dispose',()=>disposedMaterials++);world.dispose();snow.dispose();palette.dispose();
 const report={checkedAt:new Date().toISOString(),verification:'Real Three.js geometry and deterministic simulation in Node. GPU rendering and browser layout not tested.',passed:checks.every(c=>c.passed),checks,scenery:world.stats,explicitCleanupEvents:{geometries:disposedGeometries,materials:disposedMaterials}};
 await fs.writeFile(path.join(dir,'geometry-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
}finally{await fs.unlink(bundle).catch(()=>{});}
