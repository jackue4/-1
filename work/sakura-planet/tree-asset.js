import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {enhanceFoliage,createNatureUniforms} from './nature.js';
import {createPaintedLightRamp} from './painted-style.js';

// Reusable, deterministic asset. No downloaded art or runtime canvas is required.
export const TREE_CLUSTER_COUNT=9,TREE_SPRAYS_PER_CLUSTER=12;
const up=new THREE.Vector3(0,1,0);
function random(seed){let a=seed|0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function radius(n){return 1+.095*Math.sin(n.x*3.1+n.y*1.7)*Math.cos(n.z*2.8-.4)+.046*Math.sin(n.z*6.5+n.x*2.2)*Math.sin(n.y*4.2+.7)+.025*Math.cos(n.x*9-n.z*5);}
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
    // Pale peach at the top, mauve in the fold of each flowering bough. Smooth
    // lobes support the small blossom silhouettes without a polygonal shell.
    const lit=THREE.MathUtils.smoothstep(n.y,-.75,.65),shade=.89+.09*lit+.018*Math.sin(n.x*3+n.z*4);
    colors.push(shade,shade*(.91+.09*lit),shade*(.98-.015*lit));
    const r=radius(n);p.setXYZ(i,n.x*r,n.y*r,n.z*r);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();return geo;
}

// Five rounded petals, a tiny cleft at each tip and a rose-gold flower centre.
// Baking this into the existing small maps preserves the three-batch asset.
function blossomSample(x,y,turn){
  const d=Math.hypot(x,y),a=Math.atan2(y,x)-turn,petal=Math.cos(a*5);
  const tip=Math.pow(Math.max(0,(petal-.78)/.22),2),edge=.79+.21*petal-.068*tip;
  const coverage=1-THREE.MathUtils.smoothstep(d,edge-.045,edge+.024);
  const centre=1-THREE.MathUtils.smoothstep(d,.085,.235),vein=Math.pow(.5+.5*Math.cos(a*10),10)*(1-THREE.MathUtils.smoothstep(d,.18,.64));
  return{coverage,centre,vein,d};
}

// The opaque crown carries broad gouache washes; seven independently oriented
// five-petal blossoms on each small spray make its outer silhouette flowering.
export function createTreeTexture(kind='crown'){
  const size=kind==='leaf'?128:256,rgba=new Uint8Array(size*size*4),rng=random(kind==='leaf'?923:412);
  const marks=Array.from({length:kind==='leaf'?7:110},()=>({u:rng(),v:rng(),rx:.020+rng()*.043,ry:.021+rng()*.038,a:rng()*6.283,value:rng()}));
  if(kind==='leaf')marks.splice(0,marks.length,...[
    [-.22,-.21,.178,.171,-.80],[.10,-.28,.163,.151,.49],[-.30,.065,.153,.167,-.88],
    [.265,-.005,.171,.153,.76],[-.10,.26,.176,.163,-.65],[.205,.245,.145,.148,.60],
    [-.035,-.005,.185,.178,.14]
  ].map(([x,y,rx,ry,a],i)=>({u:x+.5,v:y+.5,rx,ry,a,value:(i*3%7)/6})));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=(x+.5)/size,v=(y+.5)/size,wash=.935+.035*Math.sin(u*18.8496+.6)*Math.sin(v*12.5664);
    let red=wash,green=wash*.96,blue=wash*.982,alpha=kind==='leaf'?0:1;
    for(const m of marks){let dx=u-m.u,dy=v-m.v;if(kind==='crown'){dx-=Math.round(dx);dy-=Math.round(dy);}const lx=dx/m.rx,ly=dy/m.ry;if(lx*lx+ly*ly>1.08)continue;
      const flower=blossomSample(lx,ly,m.a);
      if(kind==='leaf'){
        if(flower.coverage>alpha){
          alpha=flower.coverage;const edgeWarm=.012*Math.sin(lx*16+ly*9),lit=.93+.05*m.value+.015*ly;
          red=lit;green=lit-.016-.035*(1-m.value)-flower.centre*.25-flower.vein*.048+edgeWarm;
          blue=lit-.018-flower.centre*.14-flower.vein*.023;
        }
      }else{
        const stroke=(m.value-.46)*.125*flower.coverage;
        red+=stroke;green+=stroke-flower.centre*.042*flower.coverage;blue+=stroke-flower.centre*.020*flower.coverage;
      }
    }
    const i=(y*size+x)*4;rgba.set([red,green,blue,alpha].map(c=>Math.round(THREE.MathUtils.clamp(c,0,1)*255)),i);
  }
  const texture=new THREE.DataTexture(rgba,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.wrapS=texture.wrapT=kind==='crown'?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;texture.needsUpdate=true;texture.name=`Painted sakura ${kind==='leaf'?'seven-flower spray':'blossom wash'}`;return texture;
}

export function createClusterLayout(seed=1,pink=false){
  const rng=random(seed),d=new THREE.Object3D(),result=[],palette=pink?['#d689ad','#f4b7cb','#fff0df']:['#5e8862','#81a44f','#b0c766'];
  const lean=(rng()-.5)*.08,phase=rng()*Math.PI*2;
  for(let i=0;i<TREE_CLUSTER_COUNT;i++){
    const upper=i>=5,top=i===8,a=i*2.399+phase+rng()*.45,r=top?.025:upper?.11+rng()*.045:.215+rng()*.07;
    d.position.set(Math.sin(a)*r+lean,(top?.715:upper?.625:.485)+rng()*.045,Math.cos(a)*r);
    d.rotation.set((rng()-.5)*.20,a,upper?(rng()-.5)*.15:.11+(rng()-.5)*.15);const s=top?.18:upper?.205:.198+rng()*.032;
    // Mature cherry branches open sideways into a low, asymmetric parasol.
    // A few hanging outer pillows break the contour without becoming spheres.
    d.scale.set(s*(1.32+rng()*.21),s*(upper?.65:.68)+rng()*.018,s*(1.08+rng()*.21));d.updateMatrix();
    const color=new THREE.Color(palette[upper?1:0]).lerp(new THREE.Color(palette[upper?2:1]),upper?.45+rng()*.45:.42+rng()*.42);
    result.push({matrix:d.matrix.clone(),color});
  }return result;
}

export function createPaintedTrunk(){
  const pieces=[];
  function branch(points,radius,segments,sides=6){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,segments,radius,sides,false),pos=g.attributes.position;
    for(let i=0;i<pos.count;i++){const t=Math.floor(i/(sides+1))/segments,center=curve.getPointAt(t),v=new THREE.Vector3().fromBufferAttribute(pos,i).sub(center).multiplyScalar((1-t*.73)*(1+.17*Math.exp(-t*9))).add(center);pos.setXYZ(i,v.x,v.y,v.z);}
    g.computeVertexNormals();const colors=[];for(let i=0;i<pos.count;i++){const y=pos.getY(i),band=Math.pow(.5+.5*Math.sin(y*126+pos.getX(i)*8),14),shade=.88+.055*Math.sin(y*11+pos.getX(i)*18)-band*.12;colors.push(shade,shade*.94,shade*.99);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));pieces.push(g);
  }
  branch([[0,0,0],[-.025,.15,-.01],[-.01,.30,-.016],[.044,.48,.007],[.075,.685,.021]],.043,15,8);
  for(let j=0;j<3;j++){const a=j*2.399+.15;branch([[-.004,.22+j*.025,-.012],[Math.sin(a)*.10,.35,Math.cos(a)*.10],[Math.sin(a)*.255,.475+j*.015,Math.cos(a)*.255]],.023,6);}
  for(let j=0;j<2;j++){const a=j*3.1+.5;branch([[.027,.42,0],[Math.sin(a)*.12,.54,Math.cos(a)*.13],[Math.sin(a)*.185,.615,Math.cos(a)*.18]],.014,3,5);}
  for(let j=0;j<4;j++){const a=j*1.57+.4;branch([[0,.065,0],[Math.sin(a)*.038,.019,Math.cos(a)*.038],[Math.sin(a)*.09,.003,Math.cos(a)*.09]],.022,2,5);}
  const result=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return result;
}

export function createTreeCrownMaterial(gradientMap,uniforms){
  const texture=createTreeTexture(),material=new THREE.MeshToonMaterial({color:'white',vertexColors:true,map:texture,gradientMap});
  const depth=enhanceSakura(material,uniforms);return{material,depth,texture};
}

// Keep the shared animated shadow and snow path, but cherry blossoms need warm
// ivory light and lilac half-tones rather than the green foliage underpainting.
function enhanceSakura(material,uniforms){
  const depth=enhanceFoliage(material,uniforms),before=material.onBeforeCompile;
  material.onBeforeCompile=shader=>{before(shader);shader.fragmentShader=shader.fragmentShader.replace('vec3(.79,.97,1.04)','vec3(.86,.83,1.025)').replace('vec3(1.12,1.08,.85)','vec3(1.055,1.035,.99)').replace('vec3(.9,.95,.85)','vec3(.99,.95,.94)');};
  material.customProgramCacheKey=()=> 'painted-sakura-blossom-v1';return depth;
}

export function createTreeLeafGeometry(){
  const p=[0,.02,0],normals=[0,1,0],uv=[.5,.5],indices=[];
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a),z=Math.sin(a);p.push(x,-.025+z*z*.035,z);const n=new THREE.Vector3(x*.065,1,-z*.055).normalize();normals.push(...n);uv.push(x*.5+.5,z*.5+.5);indices.push(0,(i+1)%8+1,i+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);return g;
}

export function createTreeLeafMaterial(gradientMap,uniforms){
  const texture=createTreeTexture('leaf'),material=new THREE.MeshToonMaterial({color:'white',map:texture,gradientMap,alphaTest:.42,alphaToCoverage:true,side:THREE.DoubleSide,transparent:false,depthWrite:true});
  const depth=enhanceSakura(material,uniforms);depth.map=texture;depth.alphaTest=material.alphaTest;depth.side=THREE.DoubleSide;
  return{material,depth,texture};
}

// Standalone asset API: group + update(time, wind) + dispose(). Three draw calls.
export function createPainterlyTree({seed=1,pink=true,scale=1}={}){
  const group=new THREE.Group(),uniforms=createNatureUniforms(),ramp=createPaintedLightRamp();
  const core=createTreeCrownMaterial(ramp,uniforms),leaf=createTreeLeafMaterial(ramp,uniforms),layout=createClusterLayout(seed,pink);
  const canopy=new THREE.InstancedMesh(createOrganicCluster(),core.material,layout.length),sprays=new THREE.InstancedMesh(createTreeLeafGeometry(),leaf.material,layout.length*TREE_SPRAYS_PER_CLUSTER),trunk=new THREE.Mesh(createPaintedTrunk(),new THREE.MeshToonMaterial({color:'#907880',gradientMap:ramp,vertexColors:true}));
  layout.forEach((c,i)=>{canopy.setMatrixAt(i,c.matrix);canopy.setColorAt(i,c.color);});
  populateTreeLeaves(sprays,canopy);canopy.customDepthMaterial=core.depth;sprays.customDepthMaterial=leaf.depth;
  for(const o of [canopy,sprays,trunk]){o.castShadow=o.receiveShadow=true;group.add(o);}group.scale.setScalar(scale);canopy.computeBoundingSphere();sprays.computeBoundingSphere();canopy.boundingSphere.radius+=.08;sprays.boundingSphere.radius+=.08;
  group.name='Hand-painted flowering cherry';
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
      // Flower bunches bridge the crown surface and its silhouette. The 12
      // sprays keep distinct five-petal edges even when the inner wash merges.
      local.position.copy(n).multiplyScalar(radius(n)-.016);local.quaternion.setFromUnitVectors(up,n);local.rotateY(i*.37+j*1.7);
      const spread=.65+.07*Math.sin(i*1.31+j*2.7);local.scale.set(spread,.33,spread*(1.05+.08*Math.cos(i+j)));local.updateMatrix();
      const index=i*TREE_SPRAYS_PER_CLUSTER+j;leaves.setMatrixAt(index,new THREE.Matrix4().multiplyMatrices(base,local.matrix));leaves.setColorAt(index,color.clone().lerp(new THREE.Color('#fff1e6'),.10+(j%3)*.035));
    }
  }leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;
}
