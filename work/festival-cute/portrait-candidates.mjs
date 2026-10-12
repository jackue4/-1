import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.portrait-candidates.mjs');
await build({stdin:{contents:"export {THREE,createPalette} from '../festival-planet/core.js';export {createFestivalWorld} from '../festival-planet/world.js';export {createFestivalRides} from '../festival-planet/rides.js';export {createFestivalAnimals} from '../festival-planet/animals.js';",resolveDir:dir},bundle:true,format:'esm',platform:'node',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:bundle,logLevel:'silent'});
const oldDocument=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
try{
 const {THREE,createPalette,createFestivalWorld,createFestivalRides,createFestivalAnimals}=await import(pathToFileURL(bundle));
 const planet=new THREE.Group(),palette=createPalette(),world=createFestivalWorld({planet,palette}),rides=createFestivalRides({planet,palette}),animals=createFestivalAnimals({planet,palette,rides,world});
 const root=animals.getSubjects().find(s=>!s.ride&&s.root.userData.animal.species==='corgi').root,head=root.getObjectByName('Face and ears'),scenery=[],body=[];
 world.root.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.isInstancedMesh)scenery.push(o);});root.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();body.push(o);}});
 const candidates=[{name:'baseline',up:.17,front:.62,right:.19},{name:'opposite side',up:.17,front:.62,right:-.19},{name:'raised opposite',up:.24,front:.52,right:-.20},{name:'high frontal',up:.29,front:.54,right:-.10},{name:'raised original',up:.26,front:.54,right:.19}];
 for(const c of candidates)Object.assign(c,{blocked:[],maxBoundingBoxNdc:0,minGroundClearance:Infinity});
 const views=[{name:'desktop+landscape',aspect:16/9,fov:38},{name:'portrait',aspect:390/784,fov:48}],camera=new THREE.PerspectiveCamera(38,16/9,.01,100),ray=new THREE.Raycaster(),matrix=new THREE.Matrix4(),v=new THREE.Vector3(),face=new THREE.Vector3();
 for(let time=0;time<=120;time+=5){
  const env={night:time>=60?1:0};world.update(time,env);rides.update(time?5:0,time,env);animals.update(time,env,{active:time>=60});planet.updateMatrixWorld(true);
  const q=root.getWorldQuaternion(new THREE.Quaternion()),up=new THREE.Vector3(0,1,0).applyQuaternion(q),front=new THREE.Vector3(0,0,1).applyQuaternion(q),right=new THREE.Vector3(1,0,0).applyQuaternion(q),target=root.getWorldPosition(new THREE.Vector3()).addScaledVector(up,root.scale.x*.52);head.localToWorld(face.set(0,.020,.196));
  for(const c of candidates)for(const view of views){
   const fit=Math.max(1,.78/view.aspect)*root.scale.x/.22,position=target.clone().addScaledVector(up,c.up*fit).addScaledVector(front,c.front*fit).addScaledVector(right,c.right*fit);
   c.minGroundClearance=Math.min(c.minGroundClearance,position.length()-world.surface.height(position.clone().normalize()));
   camera.fov=view.fov;camera.aspect=view.aspect;camera.position.copy(position);camera.up.copy(up);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
   for(const object of body){matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(object.matrixWorld);const b=object.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){v.set(x,y,z).applyMatrix4(matrix);c.maxBoundingBoxNdc=Math.max(c.maxBoundingBoxNdc,Math.abs(v.x),Math.abs(v.y));}}
   const direction=face.clone().sub(position),distance=direction.length();ray.set(position,direction.normalize());ray.near=.005;ray.far=distance-.004;const hit=ray.intersectObjects(scenery,false)[0];
   if(hit){let anchor=hit.object;for(let o=hit.object;o&&o!==planet;o=o.parent)if(o.parent===world.root)anchor=o;const p=anchor.getWorldPosition(new THREE.Vector3());c.blocked.push({time,view:view.name,mesh:hit.object.name||hit.object.geometry.type,color:hit.object.material.color?.getHexString(),anchorLatitude:Math.asin(p.y/p.length()),anchorLongitude:Math.atan2(p.x,p.z),hitDistance:hit.distance});}
  }
 }
 const report={samples:25,seconds:120,step:5,views,candidates:candidates.map(c=>({...c,blockedCount:c.blocked.length}))};await fs.writeFile(path.join(dir,'portrait-candidates-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));animals.dispose();rides.dispose();world.dispose();palette.dispose();
}finally{globalThis.document=oldDocument;await fs.unlink(bundle).catch(()=>{});}
