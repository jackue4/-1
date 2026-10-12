import * as THREE from 'three';
export function oceanWave(n,t){return .004*Math.sin(n.x*24+n.z*17-t*.62)+.002*Math.sin(n.y*37-n.z*21+t*.45);}
export function createOcean({planet,surface}){
 const geo=new THREE.SphereGeometry(surface.R,192,128),p=geo.attributes.position,shallow=[];
 const n=new THREE.Vector3();for(let i=0;i<p.count;i++){n.fromBufferAttribute(p,i).normalize();shallow.push(surface.land(n));}
 geo.setAttribute('aShallow',new THREE.Float32BufferAttribute(shallow,1));
 const material=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uDay:{value:1},uDusk:{value:0},uSun:{value:new THREE.Vector3(-.4,.8,.6)}},
 vertexShader:`attribute float aShallow;uniform float uTime;varying vec3 vSea;varying vec3 vWorld;varying vec3 vNormal;varying float vShallow;
 void main(){vSea=position;vShallow=aShallow;vec3 n=normalize(position);float w=.004*sin(n.x*24.+n.z*17.-uTime*.62)+.002*sin(n.y*37.-n.z*21.+uTime*.45);vec3 p=position+n*w;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*n);gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`uniform float uTime;uniform float uDay;uniform float uDusk;uniform vec3 uSun;varying vec3 vSea;varying vec3 vWorld;varying vec3 vNormal;varying float vShallow;
 void main(){
  vec3 N=normalize(vNormal),V=normalize(cameraPosition-vWorld);float ndl=dot(N,normalize(uSun));
  vec3 deep=mix(vec3(.034,.105,.20),vec3(.055,.34,.46),uDay);
  vec3 pale=mix(vec3(.08,.22,.29),vec3(.24,.60,.60),uDay);
  float wash=.5+.5*sin(vSea.x*2.8+sin(vSea.z*3.4))*cos(vSea.y*3.7);
  vec3 color=mix(deep,pale,clamp(vShallow*.90+wash*.14,0.,1.));
  color*=.74+.26*smoothstep(-.6,.8,ndl);
  float fresnel=pow(1.-max(0.,dot(N,V)),3.);color=mix(color,mix(vec3(.16,.19,.30),vec3(.61,.78,.79),uDay),fresnel*.35);
  float band=sin(vSea.x*43.+vSea.z*29.+sin(vSea.y*22.+uTime*.3)-uTime*.7);
  float chop=sin(vSea.z*35.-vSea.y*24.+uTime*.35);
  float line=smoothstep(.965,.998,band)*smoothstep(.25,.85,chop);
  float wide=sin(vSea.x*18.+vSea.z*8.-uTime*.3),brush=smoothstep(.97,.999,wide)*smoothstep(.2,.7,sin(vSea.y*25.+vSea.z*13.));
  color+=vec3(.48,.65,.60)*(line*.12+brush*.07)*(.3+.7*uDay);
  float foam=smoothstep(.20,.34,vShallow)*(1.-smoothstep(.42,.51,vShallow));
  foam*=.5+.5*smoothstep(-.1,.8,sin(vSea.x*39.+vSea.z*33.-uTime*.6));
  color=mix(color,vec3(.71,.83,.76),foam*.55*uDay);
  vec3 H=normalize(V+normalize(uSun));float glimmer=pow(max(0.,dot(N,H)),55.)*(.45+line*.55);
  color+=mix(vec3(.10,.16,.22),vec3(.75,.52,.28),uDusk)*glimmer*.3;
  color=mix(color,color*vec3(1.15,.83,.83),uDusk*.35);
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`,side:THREE.FrontSide});
 const mesh=new THREE.Mesh(geo,material);mesh.name='Painted open sea';planet.add(mesh);
 return {mesh,material,update(t,env,sun){material.uniforms.uTime.value=t;material.uniforms.uDay.value=env.daylight;material.uniforms.uDusk.value=env.dusk;material.uniforms.uSun.value.copy(sun).normalize();}};
}
