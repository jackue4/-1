import * as THREE from 'three';

// Object-space washes remain attached to the globe during surface dragging.
// Broad pigment masses carry the image; tiny marks fade before they can shimmer.
export const GROUND_PAINT_GLSL = `
float groundHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float groundPigment(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(groundHash(i),groundHash(i+vec3(1,0,0)),f.x),
                 mix(groundHash(i+vec3(0,1,0)),groundHash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(groundHash(i+vec3(0,0,1)),groundHash(i+vec3(1,0,1)),f.x),
                 mix(groundHash(i+vec3(0,1,1)),groundHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
`;

export function paintGround(material, snowUniform, radius){
  material.onBeforeCompile=shader=>{
    shader.uniforms.uGroundSnow=snowUniform;
    shader.vertexShader='varying vec3 vGroundPaint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvGroundPaint=position;');
    shader.fragmentShader=GROUND_PAINT_GLSL+'uniform float uGroundSnow;varying vec3 vGroundPaint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float grassland=smoothstep(${(radius+.067).toFixed(3)},${(radius+.112).toFixed(3)},length(vGroundPaint));
      float wash=groundPigment(vGroundPaint*4.4);
      float pigment=groundPigment(vGroundPaint*18.0+vec3(1.7,3.1,.6));
      vec3 meadowTint=mix(vec3(.73,.91,.87),vec3(1.17,1.105,.80),smoothstep(.20,.82,wash));
      diffuseColor.rgb*=mix(vec3(1.025,1.01,.96),meadowTint,grassland);
      diffuseColor.rgb*=1.+(pigment-.5)*.105;
      float paper=groundPigment(vGroundPaint*110.);
      float detailFade=1.-smoothstep(.018,.052,length(fwidth(vGroundPaint)));
      diffuseColor.rgb*=1.+(paper-.5)*.045*detailFade;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.82,.87,.83),uGroundSnow*.75);
    `);
  };
  material.customProgramCacheKey=()=> 'europa-ground-washes-v1';
}

// A sparse, camera-independent atmosphere: drifting pollen, never a screen filter.
export function createMeadowPollen(planet,height,radius){
  const count=64,positions=new Float32Array(count*3),seeds=[];
  for(let i=0;i<count;i++){
    const y=1-2*(i+.5)/count,a=i*2.399963,normal=new THREE.Vector3(Math.sin(a)*Math.sqrt(1-y*y),y,Math.cos(a)*Math.sqrt(1-y*y));
    seeds.push({normal,phase:i*1.713});
    positions.set(normal.clone().multiplyScalar(height(normal)+.14).toArray(),i*3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  const material=new THREE.ShaderMaterial({
    uniforms:{uPollenLight:{value:1},uPollenTime:{value:0},uPollenSize:{value:1.6}},
    vertexShader:`uniform float uPollenTime;uniform float uPollenSize;varying float vPollen;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.);vPollen=.38+.30*sin(uPollenTime*.7+position.x*18.);
      gl_Position=projectionMatrix*p;gl_PointSize=clamp(uPollenSize*2.7/max(.7,-p.z),1.,3.);}`,
    fragmentShader:`uniform float uPollenLight;varying float vPollen;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.1,1.,r))*vPollen*uPollenLight;if(a<.01)discard;gl_FragColor=vec4(1.,.92,.68,a);}`,
    transparent:true,depthWrite:false,toneMapped:false
  });
  const points=new THREE.Points(geometry,material);points.name='Sunlit meadow pollen';points.frustumCulled=false;planet.add(points);
  return {points,update(time,env){
    material.uniforms.uPollenTime.value=time;
    material.uniforms.uPollenLight.value=(1-env.night)*(1-env.rain)*(1-env.snow)*.68;
    points.visible=material.uniforms.uPollenLight.value>.02;
    if(!points.visible)return;
    seeds.forEach(({normal,phase},i)=>{
      const h=height(normal),dry=THREE.MathUtils.smoothstep(h,radius+.08,radius+.12);
      const p=normal.clone().multiplyScalar(h+.12+(.5+.5*Math.sin(time*.25+phase))*.20);
      const tangent=new THREE.Vector3(normal.z,0,-normal.x).normalize();
      p.addScaledVector(tangent,Math.sin(time*.19+phase)*.065);
      if(dry<.1)p.multiplyScalar(0);positions.set(p.toArray(),i*3);
    });geometry.attributes.position.needsUpdate=true;
  }};
}
