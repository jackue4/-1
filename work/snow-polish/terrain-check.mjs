import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.terrain-check.bundle.mjs');
await build({stdin:{contents:"export {THREE,R} from './core.js';export {groundHeight,landField,createSnowTerrain} from './terrain.js';export {batchScenery} from '../festival-planet/optimize.js';",resolveDir:path.join(dir,'../snow-planet')},bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});
const checks=[],check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
try{
 const {THREE,R,groundHeight,landField,createSnowTerrain,batchScenery}=await import(pathToFileURL(bundle)),parent=new THREE.Group(),terrain=createSnowTerrain({parent}),g=terrain.mesh.geometry,p=g.attributes.position,n=g.attributes.normal;
 let nonFinite=0,minRadialNormal=1,seamError=0,minHeight=Infinity,maxHeight=-Infinity;for(const a of Object.values(g.attributes))for(const v of a.array)if(!Number.isFinite(v))nonFinite++;
 const referenced=new Set(g.index.array);
 for(let i=0;i<p.count;i++){const position=new THREE.Vector3().fromBufferAttribute(p,i),height=position.length()-R;minHeight=Math.min(minHeight,height);maxHeight=Math.max(maxHeight,height);if(referenced.has(i))minRadialNormal=Math.min(minRadialNormal,position.normalize().dot(new THREE.Vector3().fromBufferAttribute(n,i)));}
 for(let i=-89;i<=89;i++){const lat=i*Math.PI/180;seamError=Math.max(seamError,Math.abs(groundHeight(lat,-Math.PI)-groundHeight(lat,Math.PI)));}
 check('Spherical terrain stays finite, outward-facing and continuous across longitude seam',nonFinite===0&&minRadialNormal>.15&&seamError<1e-8,{vertices:p.count,minRadialNormal,minHeight,maxHeight,nonFinite,seamError});
 let roots=0,maxBoundaryJump=0;for(let lat=-1.3;lat<1.3;lat+=.045)for(let lon=-Math.PI;lon<Math.PI-.04;lon+=.04){const a=landField(lat,lon),b=landField(lat,lon+.04);if(a*b>=0)continue;let lo=lon,hi=lon+.04;for(let j=0;j<25;j++){const m=(lo+hi)/2;if(landField(lat,lo)*landField(lat,m)<=0)hi=m;else lo=m;}const center=(lo+hi)/2,jump=Math.abs(groundHeight(lat,center-1e-6)-groundHeight(lat,center+1e-6));maxBoundaryJump=Math.max(maxBoundaryJump,jump);roots++;}
 check('Snow-to-water shoreline no longer has the old abrupt height step',roots>50&&maxBoundaryJump<.0001,{sampledShoreCrossings:roots,maxBoundaryJump,previousJump:.032});
 const base=THREE.ShaderLib.standard,shader={uniforms:{...base.uniforms},vertexShader:base.vertexShader,fragmentShader:base.fragmentShader};terrain.material.onBeforeCompile(shader);
 check('Powder shading attaches to the actual installed Standard shader with all required values',shader.vertexShader.includes('vSnowCover=aSnowCover;')&&shader.fragmentShader.includes('float powder=')&&shader.fragmentShader.includes('float powderHeight=')&&shader.fragmentShader.includes('outgoingLight+=vSnowCover')&&!!shader.uniforms.uSnowNight,{note:'Shader injection only; GPU compilation is verified in the browser'});
 const geometryBefore=terrain.mesh.geometry,coverBefore=g.attributes.aSnowCover,vertexCountBefore=p.count;const batching=batchScenery(parent);check('Scenery batching preserves the custom snow mask and terrain shader mesh',parent.children.includes(terrain.mesh)&&terrain.mesh.geometry===geometryBefore&&terrain.mesh.geometry.attributes.aSnowCover===coverBefore&&terrain.mesh.geometry.attributes.position.count===vertexCountBefore,{batching});
 terrain.dispose();const report={checkedAt:new Date().toISOString(),verification:'Actual terrain geometry and shoreline convergence in Node. No GPU or visual quality claim.',passed:checks.every(c=>c.passed),checks};await fs.writeFile(path.join(dir,'terrain-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
}finally{await fs.unlink(bundle).catch(()=>{});}
