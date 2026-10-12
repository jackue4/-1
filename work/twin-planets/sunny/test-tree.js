import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPainterlyTree,createPainterlyForest,createClusterLayout} from './tree-asset.js';
const tree=createPainterlyTree({seed:1004}),checks=[];
function test(name,fn){fn();checks.push(name);}
test('Organic canopy has smooth outward unit normals and no visible seam discontinuities',()=>{
 const g=tree.canopy.geometry,p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),normal=new THREE.Vector3(),seams=new Map();let min=Infinity,max=0;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);normal.fromBufferAttribute(n,i);assert.ok(Math.abs(normal.length()-1)<1e-5);assert.ok(v.clone().normalize().dot(normal)>.85);min=Math.min(min,v.length());max=Math.max(max,v.length());const key=v.toArray().map(x=>x.toFixed(5)).join(',');if(seams.has(key))assert.ok(seams.get(key).distanceTo(normal)<.001);seams.set(key,normal.clone());}assert.ok(max-min>.1);assert.equal(g.index.count/3,440);
});
test('Paint maps are mipmapped; leaf cutouts and depth shadows use the same mask',()=>{
 const m=tree.sprays.material,d=tree.sprays.customDepthMaterial;assert.equal(m.transparent,false);assert.ok(m.alphaTest>0);assert.equal(m.map,d.map);assert.equal(m.alphaTest,d.alphaTest);assert.equal(m.side,d.side);assert.ok(m.map.generateMipmaps);assert.equal(m.map.minFilter,THREE.LinearMipmapLinearFilter);
 const pixels=m.map.image.data,alpha=Array.from(pixels).filter((_,i)=>i%4===3);assert.ok(alpha.some(a=>a===0)&&alpha.some(a=>a===255));assert.ok(alpha.filter(a=>a>107).length/alpha.length<.7);
 assert.ok(tree.canopy.geometry.attributes.color);assert.ok(new Set(tree.canopy.geometry.attributes.color.array).size>30);
});
test('Tree variation is deterministic and every crown contains nine overlapping volumes',()=>{
 const a=createClusterLayout(8),b=createClusterLayout(8),c=createClusterLayout(9);assert.deepEqual(a.map(x=>x.matrix.toArray()),b.map(x=>x.matrix.toArray()));assert.notDeepEqual(a.map(x=>x.matrix.toArray()),c.map(x=>x.matrix.toArray()));assert.equal(a.length,9);
 const pa=new THREE.Vector3(),pb=new THREE.Vector3();for(let i=0;i<a.length;i++){pa.setFromMatrixPosition(a[i].matrix);assert.ok(a.some((v,j)=>j!==i&&pa.distanceTo(pb.setFromMatrixPosition(v.matrix))<.35));}
});
test('One tree and a 40-tree forest each use three mesh batches with shared geometry and textures',()=>{
 const forest=createPainterlyForest(Array.from({length:40},(_,i)=>({position:[i%8*1.3,0,Math.floor(i/8)*1.3],seed:i,scale:.8+i%3*.1})));
 assert.equal(tree.group.children.length,3);assert.equal(forest.group.children.length,3);assert.ok(forest.group.children.every(o=>o.isInstancedMesh));assert.equal(forest.canopy.count,360);assert.equal(forest.sprays.count,2160);for(const mesh of forest.group.children){assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));assert.ok(Number.isFinite(mesh.boundingSphere.radius));}
 forest.update(12,.6);forest.dispose();
});
let triangles=0;tree.group.traverse(o=>{if(o.isMesh)triangles+=o.geometry.index.count/3*(o.isInstancedMesh?o.count:1);});
assert.ok(triangles<5200);tree.dispose();console.log(JSON.stringify({passed:checks.length,checks,treeTriangles:triangles,treeDrawCalls:3,notes:'Draw calls exclude shadow passes; no real GPU frame-time measurement.'},null,2));
