import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {enhanceFoliage,createNatureUniforms} from './nature.js';
import {createPaintedLightRamp} from './painted-style.js';

// Reusable, deterministic asset. No downloaded art or runtime canvas is required.
export const TREE_CLUSTER_COUNT=9,TREE_SPRAYS_PER_CLUSTER=12;
const up=new THREE.Vector3(0,1,0);
function random(seed){let a=seed|0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function radius(n){return 1+.092*Math.sin(n.x*3.1+n.y*1.7)*Math.cos(n.z*2.8-.4)+.034*Math.sin(n.z*4.5+n.y*2.2)+.015*Math.cos(n.x*6-n.z*3);}
export function createOrganicCluster(){
  const geo=new THREE.SphereGeometry(1,18,12),p=geo.attributes.position,normal=geo.attributes.normal,colors=[];
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
    // Broad blue-green underpainting gives each bough weight without outlining
    // every leaf. The continuous normals keep the nine volumes from reading as
    // low-poly stones, while the dappled texture supplies the brushwork.
    const lit=THREE.MathUtils.smoothstep(n.y,-.75,.65),shade=.87+.11*lit+.024*Math.sin(n.x*3+n.z*4);
    colors.push(shade*(.91+.09*lit),shade,shade*(1.02-.14*lit));
    const r=radius(n);p.setXYZ(i,n.x*r,n.y*r,n.z*r);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();return geo;
}

// Bake soft brush patches and leaf-shaped daubs into small mipmapped textures.
// RGB is neutral so the same texture also works for pink and autumn trees.
export function createTreeTexture(kind='crown'){
  const size=kind==='leaf'?128:256,rgba=new Uint8Array(size*size*4),rng=random(kind==='leaf'?923:412);
  const marks=Array.from({length:kind==='leaf'?9:145},()=>({u:rng(),v:rng(),rx:.027+rng()*.060,ry:.011+rng()*.022,a:-.85+rng()*1.2,value:rng()}));
  if(kind==='leaf')marks.splice(0,marks.length,...[
    [-.23,-.23,.115,.205,-.80],[.10,-.27,.105,.19,.49],[-.29,.00,.13,.18,-.88],
    [.21,-.02,.13,.22,.76],[-.20,.23,.12,.19,-.65],[.15,.23,.105,.18,.60],
    [-.03,.38,.08,.13,.14],[-.015,-.08,.12,.21,-.08],[.035,.11,.085,.18,.12]
  ].map(([x,y,rx,ry,a],i)=>({u:x+.5,v:y+.5,rx,ry,a,value:(i*3%9)/8})));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=(x+.5)/size,v=(y+.5)/size;let value=kind==='leaf'?.91:.91+.026*Math.sin(u*6.283*3)*Math.sin(v*6.283*2),alpha=kind==='leaf'?0:1;
    for(const m of marks){let dx=u-m.u,dy=v-m.v;if(kind==='crown'){dx-=Math.round(dx);dy-=Math.round(dy);}const c=Math.cos(m.a),s=Math.sin(m.a),lx=(dx*c-dy*s)/m.rx,ly=(dx*s+dy*c)/m.ry,d=lx*lx+ly*ly;
      if(d<1.7){if(kind==='leaf'){
        // An almond-shaped brush mark, not a round dot or triangular card. Nine
        // overlapping leaves form one spray; varied orientations break repeats.
        const width=Math.pow(Math.max(0,1-Math.abs(ly)**1.5),.68),edge=Math.abs(lx)/(width+.0001);
        const coverage=(1-THREE.MathUtils.smoothstep(edge,.84,1.03))*(1-THREE.MathUtils.smoothstep(Math.abs(ly),.94,1.01));
        if(coverage>alpha){alpha=coverage;value=.82+.13*m.value+.045*(1-Math.abs(lx))+.025*ly;}
      }else value+=(m.value-.44)*.32*(1-THREE.MathUtils.smoothstep(d,.18,1.24));}
    }
    const i=(y*size+x)*4,gray=Math.round(THREE.MathUtils.clamp(value,0,1)*255);rgba.set([gray,gray,Math.round(gray*.986),Math.round(alpha*255)],i);
  }
  const texture=new THREE.DataTexture(rgba,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.wrapS=texture.wrapT=kind==='crown'?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;texture.needsUpdate=true;texture.name=`Baked painterly ${kind}`;return texture;
}

export function createClusterLayout(seed=1,pink=false){
  const rng=random(seed),d=new THREE.Object3D(),result=[],palette=pink?['#bf91a7','#ddb0bc','#f3d2cf']:['#5e8862','#81a44f','#b0c766'];
  const lean=(rng()-.5)*.09,phase=rng()*Math.PI*2;
  for(let i=0;i<TREE_CLUSTER_COUNT;i++){
    const upper=i>=5,top=i===8,a=i*2.399+phase+rng()*.45,r=top?.045:upper?.09+rng()*.055:.18+rng()*.07;
    d.position.set(Math.sin(a)*r+lean,(top?.76:upper?.66:.51)+rng()*.04,Math.cos(a)*r);
    d.rotation.set((rng()-.5)*.30,a,(rng()-.5)*.36);const s=top?.18:upper?.20:.19+rng()*.037;
    // A staggered umbrella of broad, flat boughs. Different axes and offsets
    // overlap into one living crown rather than a ring of identical spheres.
    d.scale.set(s*(1.24+rng()*.19),s*(.59+rng()*.18),s*(1.04+rng()*.19));d.updateMatrix();
    const color=new THREE.Color(palette[upper?1:0]).lerp(new THREE.Color(palette[upper?2:1]),upper?.45+rng()*.45:.42+rng()*.42);
    result.push({matrix:d.matrix.clone(),color});
  }return result;
}

export function createPaintedTrunk(){
  const pieces=[];
  function branch(points,radius,segments,sides=6){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,segments,radius,sides,false),pos=g.attributes.position;
    for(let i=0;i<pos.count;i++){const t=Math.floor(i/(sides+1))/segments,center=curve.getPointAt(t),v=new THREE.Vector3().fromBufferAttribute(pos,i).sub(center).multiplyScalar((1-t*.73)*(1+.17*Math.exp(-t*9))).add(center);pos.setXYZ(i,v.x,v.y,v.z);}
    g.computeVertexNormals();const colors=[];for(let i=0;i<pos.count;i++){const y=pos.getY(i),shade=.81+.10*Math.sin(y*11+pos.getX(i)*18)+.035*Math.sin(pos.getZ(i)*112+y*17);colors.push(shade*1.03,shade*.97,shade*.82);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));pieces.push(g);
  }
  branch([[0,0,0],[-.018,.16,-.013],[.014,.34,-.012],[.043,.55,.012],[.016,.77,.025]],.043,15,8);
  for(let j=0;j<3;j++){const a=j*2.399+.15;branch([[.001,.22+j*.025,-.009],[Math.sin(a)*.080,.35,Math.cos(a)*.08],[Math.sin(a)*.22,.55+j*.012,Math.cos(a)*.22]],.022,6);}
  for(let j=0;j<2;j++){const a=j*3.1+.5;branch([[.027,.45,0],[Math.sin(a)*.11,.56,Math.cos(a)*.12],[Math.sin(a)*.14,.70,Math.cos(a)*.14]],.012,3,5);}
  for(let j=0;j<4;j++){const a=j*1.57+.4;branch([[0,.065,0],[Math.sin(a)*.038,.019,Math.cos(a)*.038],[Math.sin(a)*.09,.003,Math.cos(a)*.09]],.022,2,5);}
  const result=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return result;
}

export function createTreeCrownMaterial(gradientMap,uniforms){
  const texture=createTreeTexture(),material=new THREE.MeshToonMaterial({color:'white',vertexColors:true,map:texture,gradientMap});
  const depth=enhanceFoliage(material,uniforms);return{material,depth,texture};
}

export function createTreeLeafGeometry(){
  const p=[0,.02,0],normals=[0,1,0],uv=[.5,.5],indices=[];
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a),z=Math.sin(a);p.push(x,-.025+z*z*.035,z);const n=new THREE.Vector3(x*.065,1,-z*.055).normalize();normals.push(...n);uv.push(x*.5+.5,z*.5+.5);indices.push(0,(i+1)%8+1,i+1);}
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
    for(let j=0;j<TREE_SPRAYS_PER_CLUSTER;j++){
      const y=.94-1.72*(j+.5)/TREE_SPRAYS_PER_CLUSTER,a=j*2.399+i*.71,r=Math.sqrt(1-y*y);n.set(Math.cos(a)*r,y,Math.sin(a)*r);
      // Sprays sit partly within their branch volume. They soften the contour
      // instead of floating above it as a halo of separate paper cutouts.
      local.position.copy(n).multiplyScalar(radius(n)-.025);local.quaternion.setFromUnitVectors(up,n);local.rotateY(i*.37+j*1.7);
      const spread=.59+.065*Math.sin(i*1.31+j*2.7);local.scale.set(spread,.30,spread*(1.12+.08*Math.cos(i+j)));local.updateMatrix();
      const index=i*TREE_SPRAYS_PER_CLUSTER+j;leaves.setMatrixAt(index,new THREE.Matrix4().multiplyMatrices(base,local.matrix));leaves.setColorAt(index,color.clone().multiplyScalar(.99+(j%3)*.025));
    }
  }leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;
}
