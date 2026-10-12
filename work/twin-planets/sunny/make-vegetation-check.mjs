import fs from 'node:fs';
const file='work/planet-v2/check-cottage-depth.js';
let code=fs.readFileSync(file,'utf8');
code=code.replace("import {createWorld} from './world.js';","import {createWorld,terrainHeight} from './world.js';");
const setup=`const world=createWorld(),asset=new THREE.Group(),up=new THREE.Vector3(0,1,0);
function specimen(im,first,count,offset,pivot){
  const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),tint=new THREE.Color();
  im.getMatrixAt(first,matrix);point.setFromMatrixPosition(matrix);const normal=point.clone().normalize();
  const base=pivot||new THREE.Matrix4().compose(normal.clone().multiplyScalar(terrainHeight(normal)),new THREE.Quaternion().setFromUnitVectors(up,normal),new THREE.Vector3(1,1,1)).invert();
  for(let i=first;i<first+count;i++){im.getMatrixAt(i,matrix);matrix.premultiply(base);im.getColorAt(i,tint);const mat=new THREE.MeshToonMaterial({color:tint});const mesh=new THREE.Mesh(im.geometry,mat);matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.position.add(offset);asset.add(mesh);}return base;
}
const pivot=specimen(world.canopy,10,10,new THREE.Vector3());
specimen(world.canopyDetail.leaves,150,150,new THREE.Vector3(),pivot);
const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.019,.028,.39,12),new THREE.MeshToonMaterial({color:'#b2a080'}));trunk.position.y=.17;asset.add(trunk);
const shrub=world.landscape.meshes.find(m=>m.name==='shrub leaves'),sprays=world.landscape.meshes.find(m=>m.name==='shrub leaf sprays');
const bushPivot=specimen(shrub,0,5,new THREE.Vector3(.39,0,.18));specimen(sprays,0,30,new THREE.Vector3(.39,0,.18),bushPivot);
asset.updateMatrixWorld(true);`;
code=code.replace(/const world=createWorld\(\),asset=world\.cottages\[0\]\.root;[^\n]+/,setup);
code=code.replace('camera.position.set(1.0,1.06,1.65);camera.lookAt(0,.35,.04)','camera.position.set(.93,.73,1.35);camera.lookAt(.09,.29,.02)');
code=code.replace('cottage-depth-check.png','vegetation-depth-check.png');
fs.writeFileSync('work/planet-v2/check-vegetation-depth.js',code);
