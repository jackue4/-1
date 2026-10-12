import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),bundle=path.join(dir,'.rides-clearance-bundle.mjs');
await build({stdin:{contents:"export {THREE,createPalette,R} from './core.js'; export {createFestivalWorld} from './world.js'; export {createCoaster} from './coaster.js'; export {createFestivalRides} from './rides.js';",resolveDir:dir,sourcefile:'rides-clearance-entry.js'},bundle:true,format:'esm',platform:'node',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:bundle,logLevel:'silent'});
try{
  const {THREE,createPalette,createFestivalWorld,createFestivalRides,createCoaster,R}=await import(pathToFileURL(bundle));
  globalThis.document={createElement(){return{width:1,height:1,getContext(){return new Proxy({},{get:()=>()=>{}});}};}};
  const planet=new THREE.Group(),palette=createPalette(),world=createFestivalWorld({planet,palette}),rides=createFestivalRides({planet,palette}),coaster=createCoaster({planet:new THREE.Group(),palette});planet.updateMatrixWorld(true);
  const placed=[];
  [...world.root.children,...rides.root.children].forEach((child,index)=>{
    if(!child.isGroup||child.position.length()<R*.9)return;
    const pos=child.position,lat=Math.asin(pos.y/pos.length()),lon=Math.atan2(pos.x,pos.z),meshes=[];
    child.traverse(o=>{if(o.isMesh&&!o.material.transparent){const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.computeBoundingBox();meshes.push({geometry,box:geometry.boundingBox});}});
    placed.push({name:child.name||`garden-${index}`,lat,lon,meshes});
  });
  const tri=new THREE.Triangle(),closest=new THREE.Vector3(),p=new THREE.Vector3(),up=new THREE.Vector3(),tangent=new THREE.Vector3(),side=new THREE.Vector3(),body=new THREE.Vector3();
  const hits=new Map();let terrainClearance=100,trackMin=100,maxTerrain=0;
  for(let i=0;i<960;i++){
    coaster.curve.getPointAt(i/960,p);coaster.curve.getTangentAt(i/960,tangent);up.copy(p).normalize();side.crossVectors(up,tangent).normalize();up.crossVectors(tangent,side).normalize();body.copy(p).addScaledVector(up,.108);
    const n=p.clone().normalize(),height=.008*Math.sin(n.x*13+n.z*6)*Math.sin(n.y*16)+.006*Math.sin(n.z*21+n.x*8);
    terrainClearance=Math.min(terrainClearance,p.length()-R-height);maxTerrain=Math.max(maxTerrain,height);trackMin=Math.min(trackMin,p.length()-R);
    for(const object of placed)for(const {geometry,box} of object.meshes){
      if(box.distanceToPoint(body)>.093)continue;
      const positions=geometry.attributes.position,indices=geometry.index,count=indices?indices.count:positions.count;
      let min=100;
      for(let k=0;k<count;k+=3){
        tri.a.fromBufferAttribute(positions,indices?indices.getX(k):k);tri.b.fromBufferAttribute(positions,indices?indices.getX(k+1):k+1);tri.c.fromBufferAttribute(positions,indices?indices.getX(k+2):k+2);tri.closestPointToPoint(body,closest);min=Math.min(min,closest.distanceTo(body));
      }
      if(min<.085){const key=object.name;if(!hits.has(key)||hits.get(key).min>min)hits.set(key,{name:key,lat:object.lat,lon:object.lon,min,trackProgress:i/960});}
    }
  }
  const report={baseTerrainTrackClearance:terrainClearance,minimumTrackHeight:trackMin,maxTerrainHeightOnRoute:maxTerrain,nearbyScenery:[...hits.values()].sort((a,b)=>a.min-b.min),checksNote:'960 samples of train-body centre at rail + .108, radius .085 against transformed scenery and ride triangles; base terrain uses actual authored displacement. Water/ripples/flat ground excluded from solid-obstacle list.'};
  await fs.writeFile(path.join(dir,'rides-clearance-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await fs.unlink(bundle).catch(()=>{});}
