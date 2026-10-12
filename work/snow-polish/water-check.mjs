import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRendererMock,snapshotRenderer} from './renderer-mock.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.water-check.bundle.mjs');
await build({stdin:{contents:"export {THREE,R,normal,point} from './core.js';export {groundHeight,landField} from './world.js';export {createJiangnanWater} from './water.js';",resolveDir:path.join(dir,'../snow-planet')},bundle:true,format:'esm',platform:'node',outfile:bundle,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],logLevel:'silent'});
const checks=[],check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
try{
 const {THREE,R,point,groundHeight,landField,createJiangnanWater}=await import(pathToFileURL(bundle));
 const scene=new THREE.Scene(),parent=new THREE.Group();scene.add(parent);scene.background=new THREE.Color('#d1e1e3');
 const water=createJiangnanWater({THREE,parent,radius:R+.006,groundHeight,landField,mobile:false}),mesh=water.mesh;
 let minimum=Infinity,maximum=-Infinity,nonFinite=0,depthMismatch=0;
 const p=mesh.geometry.attributes.position,d=mesh.geometry.attributes.waterDepth;
 for(let i=0;i<p.count;i++){const radius=Math.hypot(p.getX(i),p.getY(i),p.getZ(i)),lat=Math.asin(p.getY(i)/radius),lon=Math.atan2(p.getX(i),p.getZ(i)),actual=d.getX(i),expected=Math.max(0,.006-groundHeight(lat,lon));minimum=Math.min(minimum,actual);maximum=Math.max(maximum,actual);if(!Number.isFinite(actual))nonFinite++;if(Math.abs(actual-expected)>2e-5)depthMismatch++;}
 check('Water samples the current spherical terrain with finite depth and visible shallow/deep variation',nonFinite===0&&depthMismatch===0&&maximum-minimum>.08,{vertices:p.count,minimum,maximum,depthMismatch,nonFinite});
 check('Transparent water allows the underwater scene to remain depth-visible',mesh.material.transparent&&!mesh.material.depthWrite&&mesh.material.depthTest&&mesh.renderOrder>0,{opacitySource:'Custom shader alpha varies by depth, Fresnel and reflection; actual appearance requires GPU review'});
 water.update(37.25,{night:.8,dusk:.2});const state=water.getState();for(let i=0;i<50;i++)water.update(37.25,{night:.8,dusk:.2});check('Paused water clock is deterministic',JSON.stringify(water.getState())===JSON.stringify(state));
 for(let i=0;i<50;i++)water.update(40+i*.05,{night:0,preview:true});water.update(37.25,{night:.8,dusk:.2});check('Water time and night color restore exactly after preview',JSON.stringify(water.getState())===JSON.stringify(state));
 const particle=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial());parent.add(particle);const skipped=new THREE.Group();skipped.userData.skipWaterReflection=true;parent.add(skipped);const alreadyHidden=new THREE.Group();alreadyHidden.visible=false;parent.add(alreadyHidden);
 const camera=new THREE.PerspectiveCamera(37,1.5,.035,100);camera.position.copy(point(.55,-.2,5.2));camera.lookAt(point(.47,-.31));camera.updateProjectionMatrix();parent.rotation.y=.12;scene.updateMatrixWorld(true);
 let captures=0,hiddenInCapture=false,reflectedBehindPlane=false,reflectionTarget=null;
 const renderer=createRendererMock(THREE,{onRender(s,c,r){captures++;hiddenInCapture=!mesh.visible&&!particle.visible&&!skipped.visible&&!alreadyHidden.visible;reflectedBehindPlane=r.clippingPlanes[0].distanceToPoint(c.position)<0;reflectionTarget=r.getRenderTarget();}});
 const before=snapshotRenderer(renderer,scene);water.renderReflection(renderer,scene,camera,{time:37.25});let same;try{assert.deepEqual(snapshotRenderer(renderer,scene),before);same=true;}catch{same=false;}
 check('Reflection uses a reflected camera, hides recursive surfaces and restores every renderer state',captures===1&&hiddenInCapture&&reflectedBehindPlane&&same&&water.getState().reflectionActive,{captures,hiddenInCapture,reflectedBehindPlane,restored:same});
 water.renderReflection(renderer,scene,camera,{preview:true,time:38});check('Selection preview skips reflection work',captures===1&&!water.getState().reflectionActive);
 water.renderReflection(renderer,scene,camera,{lowQuality:true,time:38});check('Light quality skips reflection work',captures===1&&!water.getState().reflectionActive);
 const failure=new Error('intentional render boundary failure'),broken=createRendererMock(THREE,{onRender(){throw failure;}}),beforeFailure=snapshotRenderer(broken,scene);let caught=false;
 try{water.renderReflection(broken,scene,camera,{time:39});}catch(error){caught=error===failure;}
 let restored;try{assert.deepEqual(snapshotRenderer(broken,scene),beforeFailure);restored=true;}catch{restored=false;}
 check('Failed reflection pass restores main scene, visibility, target and clipping state',caught&&restored,{caught,restored});
 let targetDisposals=0,geometryDisposals=0,materialDisposals=0;reflectionTarget.addEventListener('dispose',()=>targetDisposals++);mesh.geometry.addEventListener('dispose',()=>geometryDisposals++);mesh.material.addEventListener('dispose',()=>materialDisposals++);water.dispose();water.dispose();
 check('Reflection render target and water resources dispose exactly once',!parent.children.includes(mesh)&&targetDisposals===1&&geometryDisposals===1&&materialDisposals===1,{targetDisposals,geometryDisposals,materialDisposals});
 const mobileWater=createJiangnanWater({THREE,parent,radius:R+.006,groundHeight,landField,mobile:true});check('Mobile reflection has a smaller render target and geometry budget',mobileWater.stats.reflectionResolution<state.reflectionResolution&&mobileWater.stats.vertices<state.vertices,{desktop:{resolution:state.reflectionResolution,vertices:state.vertices},mobile:{resolution:mobileWater.stats.reflectionResolution,vertices:mobileWater.stats.vertices}});mobileWater.dispose();particle.geometry.dispose();particle.material.dispose();
 const report={checkedAt:new Date().toISOString(),verification:'Actual Three.js geometry, shader uniforms and reflection-camera code against a state-tracking renderer mock. GPU shader compilation and visual quality are not asserted.',passed:checks.every(c=>c.passed),checks};await fs.writeFile(path.join(dir,'water-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
}finally{await fs.unlink(bundle).catch(()=>{});}
