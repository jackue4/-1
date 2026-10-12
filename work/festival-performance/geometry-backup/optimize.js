import {THREE} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Preserve animated hierarchies; batch only opaque scenery that never moves.
export function batchScenery(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();let before=0,batched=0;
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.transparent)return;before++;
  for(let p=o;p&&p!==root;p=p.parent)if(p.userData.dynamic)return;
  if(!o.geometry.attributes.position)return;
  const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
 });
 for(const objects of groups.values()){
  if(objects.length<2)continue;
  const geometries=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);g.clearGroups();return g;});
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
  const sample=objects[0],mesh=new THREE.Mesh(merged,sample.material);mesh.castShadow=sample.castShadow;mesh.receiveShadow=sample.receiveShadow;mesh.name='Batched park scenery';root.add(mesh);objects.forEach(o=>o.removeFromParent());batched+=objects.length-1;
 }
 return{before,batched,remainingStatic:before-batched};
}
