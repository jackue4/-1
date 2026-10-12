import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {enhanceFoliage,createNatureUniforms} from './nature.js';
import {createPaintedLightRamp} from './painted-style.js';

// Reusable, deterministic asset. No downloaded art or runtime canvas is required.
export const TREE_CLUSTER_COUNT=9,TREE_SPRAYS_PER_CLUSTER=6;
const up=new THREE.Vector3(0,1,0);
function random(seed){let a=seed|0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function radius(n){return 1+.075*Math.sin(n.x*3.4+n.y*1.7)*Math.cos(n.z*3.1-.4)+.035*Math.sin(n.z*5+n.y*2.2)+.018*Math.cos(n.x*7-n.z*3);}
export function createOrganicCluster(){
  const geo=new THREE.SphereGeometry(1,20,12),p=geo.attributes.position,normal=geo.attributes.normal,colors=[];
  const n=new THREE.Vector3(),t=new THREE.Vector3(),b=new THREE.Vector3(),pa=new THREE.Vector3(),pb=new THREE.Vector3(),da=new THREE.Vector3(),db=new THREE.Vector3();
  function surface(v){return v.normalize().multiplyScalar(radius(v));}
  for(let i=0;i<p.count;i++){
    n.fromBufferAttribute(p,i).normalize();
    // Differentiate the actual smooth surface: welded-looking seams and poles,
    // independent of triangle tessellation, including after organic deformation.
    t.crossVectors(Math.abs(n.y)>.9?new THREE.Vector3(1,0,0):up,n).normalize();b.crossVectors(n,t).normalize();
    da.copy(surface(pa.copy(n).addScaledVector(t,.001))).sub(surface(pb.copy(n).addScaledVector(t,-.001)));
    db.copy(surface(pa.copy(n).addScaledVector(b,.001))).sub(surface(pb.copy(n).addScaledVector(b,-.001)));
    const smooth=da.cross(db).normalize();normal.setXYZ(i,smooth.x,smooth.y,smooth.z);
    const shade=.95+.025*n.y+.018*Math.sin(n.x*3+n.z*4);colors.push(shade*.985,shade,shade*.967);
    const r=radius(n);p.setXYZ(i,n.x*r,n.y*r,n.z*r);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();return geo;
}

// Bake soft brush patches and leaf-shaped daubs into small mipmapped textures.
// RGB is neutral so the same texture also works for pink and autumn trees.
export function createTreeTexture(kind='crown'){
  const size=kind==='leaf'?128:256,rgba=new Uint8Array(size*size*4),rng=random(kind==='leaf'?923:412);
  const marks=Array.from({length:kind==='leaf'?7:110},(_,i)=>({u:rng(),v:rng(),rx:.040+rng()*.050,ry:.016+rng()*.027,a:-.65+rng()*.8,value:rng()}));
  if(kind==='leaf')marks.splice(0,marks.length,...[[-.19,-.21,.16,.26,-.7],[.17,-.05,.18,.28,.7],[-.13,.19,.17,.27,-.5],[.11,.31,.14,.22,.45],[0,-.37,.11,.18,0]].map(([x,y,rx,ry,a],i)=>({u:x+.5,v:y+.5,rx,ry,a,value:i/5})));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=(x+.5)/size,v=(y+.5)/size;let value=kind==='leaf'?.90:.91+.018*Math.sin(u*6.283*3)*Math.sin(v*6.283*2),alpha=kind==='leaf'?0:1;
    for(const m of marks){let dx=u-m.u,dy=v-m.v;if(kind==='crown'){dx-=Math.round(dx);dy-=Math.round(dy);}const c=Math.cos(m.a),s=Math.sin(m.a),lx=(dx*c-dy*s)/m.rx,ly=(dx*s+dy*c)/m.ry,d=lx*lx+ly*ly;
      if(d<1.7){if(kind==='leaf'){const coverage=1-THREE.MathUtils.smoothstep(d,.83,1.02);if(coverage>alpha){alpha=coverage;value=.82+.14*m.value+.07*(1-d)-.035*Math.exp(-Math.abs(lx)*45);}}else value+=(m.value-.43)*.26*(1-THREE.MathUtils.smoothstep(d,.24,1.30));}
    }
    const i=(y*size+x)*4,gray=Math.round(THREE.MathUtils.clamp(value,0,1)*255);rgba.set([gray,gray,Math.round(gray*.986),Math.round(alpha*255)],i);
  }
  const texture=new THREE.DataTexture(rgba,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.wrapS=texture.wrapT=kind==='crown'?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;texture.needsUpdate=true;texture.name=`Baked painterly ${kind}`;return texture;
}

export function createClusterLayout(seed=1,pink=false){
  const rng=random(seed),d=new THREE.Object3D(),result=[],palette=pink?['#d6a8b4','#e6bdc3','#f1d2cb']:['#629987','#86b37d','#b7cd8a'];
  for(let i=0;i<TREE_CLUSTER_COUNT;i++){
    const upper=i>=6,a=i*2.399+rng()*.26,r=upper?.085+rng()*.035:.17+rng()*.06;
    d.position.set(Math.sin(a)*r,(upper?.70:.51)+rng()*.055,Math.cos(a)*r);
    d.rotation.set((rng()-.5)*.5,a,(rng()-.5)*.4);const s=upper?.17:.18+rng()*.035;
    d.scale.set(s*(1.13+rng()*.17),s*(.82+rng()*.19),s*(1.03+rng()*.16));d.updateMatrix();
    result.push({matrix:d.matrix.clone(),color:new THREE.Color(palette[upper?2:i%2])});
  }return result;
}

export function createPaintedTrunk(){
  const pieces=[];
  function branch(points,radius,segments){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,segments,radius,10,false),pos=g.attributes.position;
    for(let i=0;i<pos.count;i++){const t=Math.floor(i/11)/segments,center=curve.getPointAt(t),v=new THREE.Vector3().fromBufferAttribute(pos,i).sub(center).multiplyScalar(1-t*.68).add(center);pos.setXYZ(i,v.x,v.y,v.z);}
    g.computeVertexNormals();const colors=[];for(let i=0;i<pos.count;i++){const y=pos.getY(i),shade=.93+.055*Math.sin(y*39+pos.getX(i)*16)+.025*Math.sin(pos.getZ(i)*170);colors.push(shade,shade*.98,shade*.92);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));pieces.push(g);
  }
  branch([[0,0,0],[.005,.20,-.018],[.03,.42,0],[.018,.72,.018]],.04,16);
  for(let j=0;j<3;j++){const a=j*2.399;branch([[.012,.25,0],[Math.sin(a)*.07,.40,Math.cos(a)*.07],[Math.sin(a)*.20,.57,Math.cos(a)*.20]],.017,6);}
  const result=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return result;
}

export function createTreeCrownMaterial(gradientMap,uniforms){
  const texture=createTreeTexture(),material=new THREE.MeshToonMaterial({color:'white',vertexColors:true,map:texture,gradientMap});
  const depth=enhanceFoliage(material,uniforms);return{material,depth,texture};
}

export function createTreeLeafGeometry(){
  const p=[0,-.07,0],normals=[0,1,0],uv=[.5,.5],indices=[];
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a),z=Math.sin(a);p.push(x,.03+z*z*.07,z);const n=new THREE.Vector3(-x*.04,1,-z*.13).normalize();normals.push(...n);uv.push(x*.5+.5,z*.5+.5);indices.push(0,(i+1)%8+1,i+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
}

export function createTreeLeafMaterial(gradientMap,uniforms){
  const texture=createTreeTexture('leaf'),material=new THREE.MeshToonMaterial({color:'white',map:texture,gradientMap,alphaTest:.42,alphaToCoverage:true,side:THREE.DoubleSide,transparent:false,depthWrite:true});
  const depth=enhanceFoliage(material,uniforms);depth.map=texture;depth.alphaTest=material.alphaTest;depth.side=THREE.DoubleSide;
  return{material,depth,texture};
}

// Standalone asset API: group + update(time, wind) + dispose(). Three draw calls.
export function createPainterlyTree({seed=1,pink=false,scale=1}={}){
  const group=new THREE.Group(),uniforms=createNatureUniforms(),ramp=createPaintedLightRamp();
  const core=createTreeCrownMaterial(ramp,uniforms),leaf=createTreeLeafMaterial(ramp,uniforms),layout=createClusterLayout(seed,pink);
  const canopy=new THREE.InstancedMesh(createOrganicCluster(),core.material,layout.length),sprays=new THREE.InstancedMesh(createTreeLeafGeometry(),leaf.material,layout.length*TREE_SPRAYS_PER_CLUSTER),trunk=new THREE.Mesh(createPaintedTrunk(),new THREE.MeshToonMaterial({color:'#bca47c',gradientMap:ramp,vertexColors:true}));
  layout.forEach((c,i)=>{canopy.setMatrixAt(i,c.matrix);canopy.setColorAt(i,c.color);});
  populateTreeLeaves(sprays,canopy);canopy.customDepthMaterial=core.depth;sprays.customDepthMaterial=leaf.depth;
  for(const o of [canopy,sprays,trunk]){o.castShadow=o.receiveShadow=true;group.add(o);}group.scale.setScalar(scale);canopy.computeBoundingSphere();sprays.computeBoundingSphere();canopy.boundingSphere.radius+=.08;sprays.boundingSphere.radius+=.08;
  group.name='Painterly broadleaf tree';
  return{group,canopy,sprays,trunk,update(time,wind=.35){uniforms.uNatureTime.value=time;uniforms.uWind.value=wind;},dispose(){for(const o of [canopy,sprays,trunk]){o.dispose?.();o.geometry.dispose();o.material.dispose();}core.depth.dispose();leaf.depth.dispose();core.texture.dispose();leaf.texture.dispose();ramp.dispose();}};
}

// For many trees, instance the whole planting in three batches. The transforms
// are static; use separate spatial batches for large worlds to retain culling.
export function createPainterlyForest(trees){
  if(!Array.isArray(trees)||!trees.length)throw new TypeError('Provide at least one tree transform.');
  const source=createPainterlyTree(),group=new THREE.Group(),count=trees.length;
  const trunks=new THREE.InstancedMesh(source.trunk.geometry,source.trunk.material,count),canopy=new THREE.InstancedMesh(source.canopy.geometry,source.canopy.material,count*TREE_CLUSTER_COUNT),sprays=new THREE.InstancedMesh(source.sprays.geometry,source.sprays.material,count*TREE_CLUSTER_COUNT*TREE_SPRAYS_PER_CLUSTER),transform=new THREE.Object3D();
  trees.forEach((tree,i)=>{transform.position.fromArray(tree.position||[0,0,0]);transform.rotation.set(...(tree.rotation||[0,0,0]));transform.scale.setScalar(tree.scale??1);transform.updateMatrix();trunks.setMatrixAt(i,transform.matrix);createClusterLayout(tree.seed??i+1,tree.pink??false).forEach((cluster,j)=>{canopy.setMatrixAt(i*TREE_CLUSTER_COUNT+j,new THREE.Matrix4().multiplyMatrices(transform.matrix,cluster.matrix));canopy.setColorAt(i*TREE_CLUSTER_COUNT+j,cluster.color);});});
  populateTreeLeaves(sprays,canopy);canopy.customDepthMaterial=source.canopy.customDepthMaterial;sprays.customDepthMaterial=source.sprays.customDepthMaterial;
  for(const mesh of [trunks,canopy,sprays]){mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.08;group.add(mesh);}
  group.name='Instanced painterly grove';return{group,canopy,sprays,trunks,update:source.update,dispose(){for(const mesh of [trunks,canopy,sprays])mesh.dispose();source.dispose();}};
}

export function populateTreeLeaves(leaves,canopy){
  const base=new THREE.Matrix4(),local=new THREE.Object3D(),n=new THREE.Vector3(),color=new THREE.Color();
  for(let i=0;i<canopy.count;i++){canopy.getMatrixAt(i,base);canopy.getColorAt(i,color);
    for(let j=0;j<TREE_SPRAYS_PER_CLUSTER;j++){const y=.94-1.70*(j+.5)/TREE_SPRAYS_PER_CLUSTER,a=j*2.399+i*.71,r=Math.sqrt(1-y*y);n.set(Math.cos(a)*r,y,Math.sin(a)*r);local.position.copy(n).multiplyScalar(radius(n)+.016);local.quaternion.setFromUnitVectors(up,n);local.rotateY(i*.37+j*1.7);local.scale.set(.51,.45,.57);local.updateMatrix();const index=i*TREE_SPRAYS_PER_CLUSTER+j;leaves.setMatrixAt(index,new THREE.Matrix4().multiplyMatrices(base,local.matrix));leaves.setColorAt(index,color.clone().multiplyScalar(1.02+(j%3)*.012));}
  }leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;
}
