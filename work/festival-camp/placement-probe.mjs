import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
const source=`import {THREE,R,normal} from '../festival-planet/core.js';import {createCoasterCurve} from '../festival-planet/coaster.js';import {surface} from '../festival-planet/surface.js';
const rail=createCoasterCurve().getSpacedPoints(1200),fixtures=[[-.41,2.84,.60,'picnic'],[-.57,-1.83,.36,'flower shop'],[.51,-2.57,.38,'post'],[.15,2.72,.4,'tea'],[.15,2.2,.8,'swings'],[.68,2.78,.4,'observatory']];
for(const [lat,lon] of [[-.80,-2.60],[-.90,-2.55],[-.95,-2.6],[-.85,-2.80]]){const n=normal(lat,lon);console.log(JSON.stringify({lat,lon,rail:Math.min(...rail.map(p=>Math.acos(THREE.MathUtils.clamp(n.dot(p.clone().normalize()),-1,1))*R)),path:surface.pathDistance(n),fixtures:fixtures.map(([a,b,r,name])=>({name,clearance:Math.acos(THREE.MathUtils.clamp(n.dot(normal(a,b)),-1,1))*R-r}))}));}`;
await build({stdin:{contents:source,resolveDir:import.meta.dirname,sourcefile:'placement.js'},nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],bundle:true,format:'esm',platform:'node',outfile:import.meta.dirname+'/.placement.bundle.mjs'});
await import('./.placement.bundle.mjs');await fs.unlink(import.meta.dirname+'/.placement.bundle.mjs');
