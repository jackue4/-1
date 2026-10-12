import fs from 'node:fs';
let s=fs.readFileSync('work/planet-v2/check-cottage-depth.js','utf8');
s=s.replace("import {createWorld} from './world.js';","import {createWorld,direction} from './world.js';\nimport {restoreFarm} from './farming.js';");
s=s.replace(/const world=createWorld\(\),asset=world\.cottages\[0\]\.root;[^\n]+/,`const world=createWorld(),asset=world.planet,farm=restoreFarm(null,Date.now());
farm.unlocked=18;farm.plots.forEach((p,i)=>Object.assign(p,{crop:['radish','wheat','tomato','strawberry'][i%4],growth:.15+(i%6)*.17,water:i%2?60:0}));world.farm.sync(farm);
world.planet.userData.closeView=true;world.update(0,4,{rain:0,snow:0,night:0,wind:.35,cloud:.2,mist:0});
asset.quaternion.setFromUnitVectors(direction(.38,.06),new THREE.Vector3(0,1,0));asset.updateMatrixWorld(true);`);
s=s.replace('const W=720,H=720','const W=1000,H=800');
s=s.replace('new THREE.PerspectiveCamera(35,W/H,.1,20);camera.position.set(1.0,1.06,1.65);camera.lookAt(0,.35,.04)','new THREE.PerspectiveCamera(38,W/H,.1,20);camera.position.set(.45,5.95,2.15);camera.lookAt(0,2.67,0)');
s=s.replace('asset.traverseVisible(o=>{','function draw(o){');
s=s.replace("  if(!o.isMesh)return;","  if(!o.isMesh||!o.geometry.attributes.normal||!o.material.color||o.material.visible===false)return;");
s=s.replace('});\nfunction crc',`}
asset.traverseVisible(o=>{if(!o.isMesh)return;if(!o.isInstancedMesh){draw(o);return;}const matrix=new THREE.Matrix4(),tint=new THREE.Color();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);const pos=new THREE.Vector3().setFromMatrixPosition(matrix).project(camera);if(pos.x< -1.15||pos.x>1.15||pos.y< -1.15||pos.y>1.15)continue;const material=o.material.clone();if(o.instanceColor){o.getColorAt(i,tint);material.color.multiply(tint);}draw({isMesh:true,geometry:o.geometry,material,matrixWorld:matrix});}});
function crc`);
s=s.replace('cottage-depth-check.png','farm-layout-check.png');
fs.writeFileSync('work/planet-v2/check-farm-depth.js',s);

