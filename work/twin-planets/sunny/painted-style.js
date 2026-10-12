import * as THREE from 'three';
export const PAINT_WASH_GLSL=`
float paintedWash(vec3 p){
  float stroke=sin(dot(p,vec3(4.7,2.9,3.1))+.65*sin(dot(p,vec3(2.1,-3.4,1.8))));
  return smoothstep(-.55,.62,stroke*cos(dot(p,vec3(-2.7,1.8,3.5))));
}
`;
// Four broad painted light values with soft transitions, not faceted normals.
export function createPaintedLightRamp(){
  const pixels=new Uint8Array(64*4);
  for(let i=0;i<64;i++){const x=i/63,v=.40+.26*THREE.MathUtils.smoothstep(x,.13,.34)+.22*THREE.MathUtils.smoothstep(x,.44,.68)+.12*THREE.MathUtils.smoothstep(x,.76,.96);pixels.set([Math.round(v*250),Math.round(v*255),Math.round(v*245),255],i*4);}
  const texture=new THREE.DataTexture(pixels,64,1);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;texture.name='Painted four-value foliage light';return texture;
}
