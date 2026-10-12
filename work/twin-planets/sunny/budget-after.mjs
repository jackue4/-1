import fs from 'node:fs';
import {createWorld} from './nature-world-test.mjs';
const w=createWorld();w.update(1/60,5,{rain:0,snow:0,cloud:.2,wind:.3,night:0,mist:0});
let calls=0,triangles=0,shadowTriangles=0;
w.planet.traverseVisible(o=>{if(!o.isMesh)return;const count=o.isInstancedMesh?o.count:1;const n=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*count;calls++;triangles+=n;if(o.castShadow)shadowTriangles+=n;});
const report={meshes:calls,triangles,shadowTriangles,grassCount:w.meadow.count,grassTriangles:w.meadow.count*w.meadow.blades.geometry.index.count/3};
fs.writeFileSync('work/planet-v2/budget-after.json',JSON.stringify(report,null,2));console.log(report);w.dispose();

