import {THREE} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Indexed, vertex-painted scenery is authored once and rendered in one batch.
export function createPaintBatch(palette){
 const parts=[],geometries=[],material=palette.m('#ffffff').clone();material.vertexColors=true;
 const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,8),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),pos=new THREE.Vector3();
 function add(source,color,position=[0,0,0],size=[1,1,1],euler=[0,0,0],base=null,paint=null){
  rotation.setFromEuler(new THREE.Euler(...euler));pos.set(...position);scale.set(...size);matrix.compose(pos,rotation,scale);if(base)matrix.premultiply(base);
  const g=source.clone(),p=g.attributes.position,c=new THREE.Color(color),rgb=new Float32Array(p.count*3),v=new THREE.Vector3();for(let i=0;i<p.count;i++){const col=paint?paint(v.fromBufferAttribute(p,i),c,i):c;rgb.set([col.r,col.g,col.b],i*3);}g.setAttribute('color',new THREE.BufferAttribute(rgb,3));
  if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(p.count*2),2));if(!g.index)g.setIndex(Array.from({length:p.count},(_,i)=>i));g.applyMatrix4(matrix);parts.push(g);return g;
 }
 const box=(color,p,s,r=[0,0,0],base=null)=>add(cube,color,p,s,r,base);
 const ball=(color,p,s,r=[0,0,0],base=null)=>add(sphere,color,p,s,r,base);
 function cylinder(color,p,top,bottom,h,r=[0,0,0],base=null,segments=10){const g=new THREE.CylinderGeometry(top,bottom,h,segments);add(g,color,p,[1,1,1],r,base);g.dispose();}
 function line(color,points,r=.005,base=null,segments=12){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,segments,r,4,false);add(g,color,[0,0,0],[1,1,1],[0,0,0],base);g.dispose();}
 function finish(parent,name='Painted desert scenery'){if(!parts.length)return null;const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());parts.length=0;g.computeBoundingSphere();geometries.push(g);const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 return{material,add,box,ball,cylinder,line,finish,dispose(){parts.forEach(g=>g.dispose());parts.length=0;geometries.forEach(g=>g.dispose());geometries.length=0;cube.dispose();sphere.dispose();material.dispose();}};
}
