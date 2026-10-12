import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.portraits-check-bundle.mjs'),reportPath=path.join(dir,'portraits-report.json');
const checks=[],failures=[];
function check(passed,label,detail){checks.push({label,passed:!!passed,detail});if(!passed)failures.push(label);}
await build({stdin:{contents:"export {THREE,createPalette} from '../festival-planet/core.js'; export {createFestivalWorld} from '../festival-planet/world.js'; export {createFestivalRides} from '../festival-planet/rides.js'; export {createFestivalAnimals,guestJourney} from '../festival-planet/animals.js'; export {createAnimalPortraits} from '../festival-planet/animal-portraits.js';",resolveDir:dir,sourcefile:'portraits-check-entry.js'},bundle:true,format:'esm',platform:'node',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:bundle,logLevel:'silent'});
const oldDocument=globalThis.document;
globalThis.document={createElement:tag=>{if(tag!=='canvas')throw new Error(`Unexpected DOM dependency ${tag}`);return{width:0,height:0,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})};}};
try{
 const {THREE,createPalette,createFestivalWorld,createFestivalRides,createFestivalAnimals,createAnimalPortraits,guestJourney}=await import(pathToFileURL(bundle));
 const planet=new THREE.Group(),palette=createPalette(),world=createFestivalWorld({planet,palette}),rides=createFestivalRides({planet,palette}),animals=createFestivalAnimals({planet,palette,rides,world}),portraits=createAnimalPortraits(animals);
 const subjects=animals.getSubjects().filter(s=>!s.ride).slice(0,3),views=[{name:'desktop',width:1440,height:810,fov:38},{name:'portrait',width:390,height:784,fov:48},{name:'landscape',width:844,height:390,fov:38}];
 const scenery=[];world.root.traverse(o=>{if(o.isMesh&&!o.material.transparent&&!o.isInstancedMesh)scenery.push(o);});
 const camera=new THREE.PerspectiveCamera(38,16/9,.01,100),matrix=new THREE.Matrix4(),v=new THREE.Vector3(),face=new THREE.Vector3(),ray=new THREE.Raycaster(),direction=new THREE.Vector3();
 const metrics=Object.fromEntries(subjects.map(s=>[s.root.userData.animal.species,{id:s.id,minimumGroundClearance:Infinity,maximumSubjectNdc:0,maximumFaceNdc:0,minimumNdcZ:Infinity,maximumNdcZ:-Infinity,movingSamples:0,idleSamples:0,turningSamples:0,facings:new Set(),worstFraming:null}]));
 const clipped=[],occlusions=[];let finite=true;
 for(let time=0;time<=120;time++){
  const env={night:time>=60?1:0,preview:false};world.update(time,env);rides.update(time?1:0,time,env);animals.update(time,env,{active:time>=60});planet.updateMatrixWorld(true);
  for(let i=0;i<subjects.length;i++){
   const subject=subjects[i],species=subject.root.userData.animal.species,metric=metrics[species],journey=guestJourney(time,[4,28,53][i],42);
   if(journey.idle)metric.idleSamples++;else metric.movingSamples++;
   if(journey.turn%1>.01&&journey.turn%1<.99)metric.turningSamples++;
   metric.facings.add(journey.direction);
   const head=subject.root.getObjectByName('Face and ears');head.localToWorld(face.set(0,.020,.196));
   for(const view of views){
    const pose=portraits.getPose(species,view.width/view.height);finite&&=[...pose.position.toArray(),...pose.target.toArray(),...pose.up.toArray()].every(Number.isFinite);
    const groundClearance=pose.position.length()-world.surface.height(pose.position.clone().normalize());metric.minimumGroundClearance=Math.min(metric.minimumGroundClearance,groundClearance);
    camera.fov=view.fov;camera.aspect=view.width/view.height;camera.position.copy(pose.position);camera.up.copy(pose.up);camera.lookAt(pose.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    const faceNdc=face.clone().project(camera);metric.maximumFaceNdc=Math.max(metric.maximumFaceNdc,Math.abs(faceNdc.x),Math.abs(faceNdc.y));
    let maxNdc=0,zMin=Infinity,zMax=-Infinity;
    subject.root.traverse(object=>{
     if(!object.isMesh)return;
     matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(object.matrixWorld);
     const position=object.geometry.attributes.position;
     for(let vertex=0;vertex<position.count;vertex++){
      v.fromBufferAttribute(position,vertex).applyMatrix4(matrix);maxNdc=Math.max(maxNdc,Math.abs(v.x),Math.abs(v.y));zMin=Math.min(zMin,v.z);zMax=Math.max(zMax,v.z);
     }
    });
    if(maxNdc>metric.maximumSubjectNdc){metric.maximumSubjectNdc=maxNdc;metric.worstFraming={time,view:view.name,maxNdc};}
    metric.minimumNdcZ=Math.min(metric.minimumNdcZ,zMin);metric.maximumNdcZ=Math.max(metric.maximumNdcZ,zMax);
    if(maxNdc>=1||zMin<=-1||zMax>=1)clipped.push({time,species,view:view.name,maxNdc,zMin,zMax});
    // Geometry-only sight checks exclude the subject and every other guest.
    // The scene shader's tiny wind offsets are outside this CPU test's scope.
    if(time%5===0){
     direction.subVectors(face,pose.position);const distance=direction.length();ray.set(pose.position,direction.normalize());ray.near=.005;ray.far=distance-.004;
     const hit=ray.intersectObjects(scenery,false)[0];
     if(hit){const objectPath=[];let anchor=hit.object;for(let o=hit.object;o&&o!==planet;o=o.parent){objectPath.unshift((o.name||o.type)+'['+(o.parent?o.parent.children.indexOf(o):-1)+']');if(o.parent===world.root)anchor=o;}const anchorPosition=anchor.getWorldPosition(new THREE.Vector3());occlusions.push({time,species,view:view.name,mesh:objectPath.join(' / '),geometry:hit.object.geometry.type,geometryParameters:hit.object.geometry.parameters,material:hit.object.material.type,color:hit.object.material.color?.getHexString(),anchorLatitude:Math.asin(anchorPosition.y/anchorPosition.length()),anchorLongitude:Math.atan2(anchorPosition.x,anchorPosition.z),distance:hit.distance,faceDistance:distance,hit:hit.point.toArray(),camera:pose.position.toArray(),face:face.toArray()});}
    }
   }
  }
 }
 for(const [species,metric] of Object.entries(metrics)){
  metric.facings=[...metric.facings];
  check(metric.minimumGroundClearance>.08,`${species}: camera stays above the actual terrain`,metric.minimumGroundClearance);
  check(metric.maximumFaceNdc<.85,`${species}: animated face remains comfortably inside all three viewports`,metric.maximumFaceNdc);
  check(metric.maximumSubjectNdc<1&&metric.minimumNdcZ>-1&&metric.maximumNdcZ<1,`${species}: full actual body, ears and accessories stay inside the frustum`,metric.worstFraming);
  check(metric.movingSamples>0&&metric.idleSamples>0&&metric.turningSamples>0&&metric.facings.length===2,`${species}: samples cover walking, idling, turning and both journey directions`,{moving:metric.movingSamples,idle:metric.idleSamples,turning:metric.turningSamples,facings:metric.facings});
 }
 check(finite,'All camera positions, targets and up vectors remain finite');
 const blocked=Object.fromEntries(subjects.map(s=>{const species=s.root.userData.animal.species;return[species,occlusions.filter(hit=>hit.species===species).length];}));
 const report={passed:failures.length===0,checks,failures,metrics,clipped,occlusionSummary:{samplesPerSpecies:views.length*25,blocked,scope:'CPU raycasts against actual opaque world geometry at five-second intervals; animated water, other guests and rides excluded. Occlusions are diagnostics, not automatically failures.'},occlusions,views,sampling:{seconds:120,stepSeconds:1,samples:121,scope:'Actual animated scene geometry; no rasterization or real-device performance claims'}};
 await fs.writeFile(reportPath,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,failures,metrics,occlusionSummary:report.occlusionSummary,firstOcclusions:occlusions.slice(0,12)},null,2));
 animals.dispose();rides.dispose();world.dispose();palette.dispose();if(failures.length)process.exitCode=1;
}catch(error){await fs.writeFile(reportPath,JSON.stringify({passed:false,error:error.stack,checks,failures},null,2));throw error;}
finally{globalThis.document=oldDocument;await fs.unlink(bundle).catch(()=>{});}
