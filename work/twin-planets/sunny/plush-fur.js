import * as THREE from 'three';
const cache=new Map();
export function plushMaterial(color){
  if(cache.has(color))return cache.get(color);
  const material=new THREE.MeshToonMaterial({color,vertexColors:true});
  const bytes=new Uint8Array(64*4);for(let i=0;i<64;i++){const c=Math.round((.52+.48*THREE.MathUtils.smoothstep(i/63,.03,.97))*255);bytes.set([c,c,c,255],i*4);}
  const ramp=new THREE.DataTexture(bytes,64,1);ramp.minFilter=ramp.magFilter=THREE.LinearFilter;ramp.needsUpdate=true;material.gradientMap=ramp;
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vFurPoint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFurPoint=position;');
    shader.fragmentShader='varying vec3 vFurPoint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float fiber=sin(vFurPoint.x*920.+sin(vFurPoint.y*630.)*2.)*sin(vFurPoint.z*810.+vFurPoint.y*500.);
      float detail=1.-smoothstep(.001,.006,length(fwidth(vFurPoint)));
      diffuseColor.rgb*=1.+fiber*.025*detail;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float velvet=pow(1.-abs(dot(normal,normalize(vViewPosition))),3.);
      outgoingLight+=diffuseColor.rgb*velvet*.14;
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=> 'plush-fur-v1';material.userData.plush=true;cache.set(color,material);return material;
}
export function plushGeometry(segments=20,rings=12){const geo=new THREE.SphereGeometry(1,segments,rings),colors=new Float32Array(geo.attributes.position.count*3).fill(1);geo.setAttribute('color',new THREE.BufferAttribute(colors,3));return geo;}
// Sparse short tufts soften the silhouette. Two curved tapered triangles per
// tuft, smooth radial normals, opaque geometry: no fur-shell transparency stack.
export function createTufts(scale,count,seed=0){
  const positions=[],normals=[],colors=[],uv=[],n=new THREE.Vector3(),t=new THREE.Vector3(),b=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  function vertex(p,normal,shade,u,v){positions.push(...p);normals.push(...normal);colors.push(shade,shade,shade);uv.push(u,v);}
  for(let i=0;i<count;i++){
    const y=1-2*(i+.5)/count,a=i*2.399+seed,r=Math.sqrt(1-y*y);n.set(Math.sin(a)*r,y,Math.cos(a)*r);
    const base=new THREE.Vector3(n.x*scale[0],n.y*scale[1],n.z*scale[2]),normal=new THREE.Vector3(n.x/scale[0],n.y/scale[1],n.z/scale[2]).normalize();
    t.crossVectors(Math.abs(normal.y)>.92?new THREE.Vector3(1,0,0):up,normal).normalize();b.crossVectors(normal,t).normalize();
    const length=.0035+(Math.sin(i*13.17+seed)*.5+.5)*.0045,width=.0013+(i%3)*.00035;
    const left=base.clone().addScaledVector(t,-width),right=base.clone().addScaledVector(t,width),middle=base.clone().addScaledVector(normal,length*.53).addScaledVector(b,-length*.22),tip=base.clone().addScaledVector(normal,length).addScaledVector(b,-length*.54),shade=.97+(i%5)*.012;
    vertex(left,normal,shade,0,0);vertex(right,normal,shade,1,0);vertex(middle,normal,shade,.5,.5);vertex(right,normal,shade,1,0);vertex(tip,normal,1.01,.5,1);vertex(middle,normal,shade,.5,.5);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g;
}
