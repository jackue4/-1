import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import {writeFile,unlink} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const bundle=path.resolve('work/festival-snacks/.layout.bundle.mjs');
await build({stdin:{contents:"export {THREE,R,normal,createPalette} from './core.js';export {createFestivalWorld} from './world.js';export {createFestivalRides} from './rides.js';export {surface} from './surface.js';export {createCoasterCurve} from './coaster.js';export {FOOD_COURT,CANDY_SPOTS} from './snack-layout.js';",resolveDir:path.resolve('work/festival-planet')},bundle:true,format:'esm',platform:'node',nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:bundle,logLevel:'silent'});
try{
const {THREE,R,normal,surface,createCoasterCurve,FOOD_COURT,CANDY_SPOTS,createPalette,createFestivalWorld,createFestivalRides}=await import(pathToFileURL(bundle));
globalThis.document={createElement(){return{width:1,height:1,getContext(){return new Proxy({},{get:()=>()=>{}});}};}};
const palette=createPalette(),planet=new THREE.Group(),world=createFestivalWorld({planet,palette}),rides=createFestivalRides({planet,palette});planet.updateMatrixWorld(true);
const track=createCoasterCurve().getSpacedPoints(1000),placements=[{...FOOD_COURT,type:'food'},...CANDY_SPOTS.map(s=>({...s,type:'candy'}))];
const spots=placements.map((s,index)=>{const n=normal(s.lat,s.lon),point=n.clone().multiplyScalar(surface.height(n)),localHeight=s.type==='food'?.60:.43*s.scale;let trackMin=Infinity;for(const p of track){const normalDelta=p.clone().sub(point),h=normalDelta.dot(n);if(h>localHeight+.22)continue;trackMin=Math.min(trackMin,normalDelta.addScaledVector(n,-h).length());}return{index,...s,lagoon:surface.lagoonMask(n),path:surface.pathDistance(n),stream:surface.streamDistance(n),trackMin};});
const report={spots};await writeFile('work/festival-snacks/layout-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await unlink(bundle);}
