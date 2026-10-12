import {THREE} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Preserve indexed vertices: expanding every flower/roof into triangle soup
// made batching save draw calls while needlessly increasing GPU vertex work.
// The caller owns input geometry/materials; only temporary clones are disposed.
export function batchScenery(root,{compact=false}={}){
 root.updateMatrixWorld(true);
 const inverse=root.matrixWorld.clone().invert(),groups=new Map(),emptied=new Set();
 let before=0,batched=0,prunedGroups=0,sourceVertices=0,mergedVertices=0;
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||Array.isArray(o.material)||o.material.transparent)return;
  before++;
  for(let p=o;p&&p!==root;p=p.parent)if(p.userData.dynamic||!p.visible)return;
  const g=o.geometry,attributes=g.attributes;
  if(!attributes.position||Object.keys(g.morphAttributes).length||g.drawRange.start!==0||g.drawRange.count!==Infinity)return;
  if(o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender||o.onBeforeShadow!==THREE.Object3D.prototype.onBeforeShadow)return;
  if(Object.values(attributes).some(a=>a.isInterleavedBufferAttribute||a.isInstancedBufferAttribute))return;
  // Colours and shader attributes must survive and only combine with the same
  // layout. Normal/UV defaults allow simple primitives to share their old batch.
  const schema=Object.keys(attributes).filter(n=>!['normal','uv'].includes(n)).sort().map(n=>{const a=attributes[n];return`${n}/${a.itemSize}/${a.array.constructor.name}/${a.normalized}/${a.gpuType}`;}).join('|');
  const standardSchema=['normal','uv'].map(n=>{const a=attributes[n];return a?`${n}/${a.itemSize}/${a.array.constructor.name}/${a.normalized}/${a.gpuType}`:`${n}/${n==='uv'?2:3}/Float32Array/false/${THREE.FloatType}`;}).join('|');
  const key=[o.material.uuid,o.castShadow,o.receiveShadow,o.renderOrder,o.layers.mask,o.frustumCulled,schema,standardSchema].join(':');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
 });
 for(const objects of groups.values()){
  if(objects.length<2)continue;
  const geometries=objects.map(o=>{
   const g=o.geometry.clone();
   if(!g.attributes.normal)g.computeVertexNormals();
   if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
   // Non-indexed custom pieces retain their exact vertex seams and normals.
   if(!g.index){const count=g.attributes.position.count,index=count>65535?new Uint32Array(count):new Uint16Array(count);for(let i=0;i<count;i++)index[i]=i;g.setIndex(new THREE.BufferAttribute(index,1));}
   g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));g.clearGroups();return g;
  });
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
  merged.computeBoundingBox();merged.computeBoundingSphere();
  const sample=objects[0],mesh=new THREE.Mesh(merged,sample.material);
  mesh.castShadow=sample.castShadow;mesh.receiveShadow=sample.receiveShadow;mesh.renderOrder=sample.renderOrder;mesh.layers.mask=sample.layers.mask;mesh.frustumCulled=sample.frustumCulled;
  mesh.name='Batched park scenery';mesh.matrixAutoUpdate=false;root.add(mesh);
  for(const o of objects){sourceVertices+=o.geometry.attributes.position.count;emptied.add(o.parent);o.removeFromParent();}
  mergedVertices+=merged.attributes.position.count;batched+=objects.length-1;
 }
 // Opt in only for scenes whose anonymous construction groups have no public
 // identity. Named anchors and every animated hierarchy stay attached.
 if(compact)for(const group of emptied){let o=group;while(o&&o!==root&&o.isGroup&&!o.children.length&&!o.name&&!Object.keys(o.userData).length){const parent=o.parent;o.removeFromParent();prunedGroups++;o=parent;}}
 return{before,batched,remainingStatic:before-batched,prunedGroups,sourceVertices,mergedVertices};
}
