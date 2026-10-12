import {TREE_SPRAYS_PER_CLUSTER,createTreeLeafGeometry,createTreeLeafMaterial,populateTreeLeaves} from './tree-asset.js';
import * as THREE from 'three';
import {createPaintedLightRamp} from './painted-style.js';

// A continuous painted-light ramp, independent of the buildings' toon bands.
export function createVegetationRamp(){
  return createPaintedLightRamp();
}

// A rounded, cupped brush-stroke leaf in the XZ plane. An asymmetric outline
// keeps both blossom petals and shrub leaves from reading as perfect discs.
// Real geometry stays legible from either side; no transparent foliage sorting.
export function createSoftLeaf(segments=8,cup=.19){
  const positions=[0,-cup*.36,0],normals=[0,1,0],uv=[.5,.5],indices=[];
  for(let j=0;j<segments;j++){
    const a=j/segments*Math.PI*2,z=Math.sin(a),width=.91+.09*z+.035*Math.sin(a*3+.6),x=Math.cos(a)*width,y=cup*(.26+.48*z*z+.06*x);
    positions.push(x,y,z);const n=new THREE.Vector3(-cup*(x*.67+.06),1,-cup*z*.98).normalize();normals.push(...n.toArray());uv.push(x*.5+.5,z*.5+.5);
    indices.push(0,(j+1)%segments+1,j+1);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);return geo;
}

// Elliptical leaves overlap the crown outline; the smooth core supplies density.
export function createCanopyLeaves(planet,canopy,uniforms,gradientMap){
  const asset=createTreeLeafMaterial(gradientMap,uniforms),leaves=new THREE.InstancedMesh(createTreeLeafGeometry(),asset.material,canopy.count*TREE_SPRAYS_PER_CLUSTER);
  populateTreeLeaves(leaves,canopy);leaves.name='Soft canopy leaf sprays';leaves.castShadow=true;leaves.receiveShadow=true;leaves.customDepthMaterial=asset.depth;leaves.frustumCulled=false;planet.add(leaves);
  return{leaves,perClump:TREE_SPRAYS_PER_CLUSTER,dispose(){asset.depth.dispose();asset.texture.dispose();}};
}
