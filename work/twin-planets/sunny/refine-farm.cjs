const fs=require('fs');const p='work/planet-v2/';
function edit(n,a,b){let s=fs.readFileSync(p+n,'utf8');if(!s.includes(a))throw Error(n+':'+a);fs.writeFileSync(p+n,s.replace(a,b));}
edit('farm-scene.js',"import {enhanceFoliage}","import {createSoftLeaf} from './vegetation.js';\nimport {enhanceFoliage}");
edit('farm-scene.js','new THREE.InstancedMesh(ball,leafMat','new THREE.InstancedMesh(createSoftLeaf(10,.24),leafMat');
edit('farm-scene.js','18*6*3);','18*6*2);');
edit('farm-scene.js','for(let j=0;j<3;j++){const ripe','for(let j=0;j<2;j++){const ripe');
edit('farm-ui.js',"const n=world.farm.normals[index].clone(),normal=n.clone().addScaledVector(world.farm.plotRoots[index].getWorldDirection(n.clone()),0);normal.copy(n); // radial position, then offset toward the lane", "const n=world.farm.normals[index].clone(),normal=n.clone(); // stand in the lane, facing the crop");
edit('vegetation.js','geometry=createSoftLeaf(16)','geometry=createSoftLeaf(12)');
edit('landscape.js','spray=createSoftLeaf(16,.17)','spray=createSoftLeaf(12,.17)');
edit('villagers.js','const watering=new THREE.Group();',"const farmBall=new THREE.SphereGeometry(1,8,5);\n  const watering=new THREE.Group();");
let s=fs.readFileSync(p+'villagers.js','utf8'),idx=s.indexOf('const farmBall=');s=s.slice(0,idx)+s.slice(idx).replaceAll(',sphere,',',farmBall,');fs.writeFileSync(p+'villagers.js',s);
