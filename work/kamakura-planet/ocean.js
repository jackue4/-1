import * as THREE from 'three';
export function oceanWave(n,t){return .003*Math.sin(n.x*24+n.z*17-t*.62)+.0015*Math.sin(n.y*37-n.z*21+t*.45);}
export function createOcean({planet,surface}){
 const geo=new THREE.SphereGeometry(surface.R,224,160),p=geo.attributes.position,depth=[],n=new THREE.Vector3();
 for(let i=0;i<p.count;i++){n.fromBufferAttribute(p,i).normalize();depth.push(surface.R-surface.height(n));}
 geo.setAttribute('aDepth',new THREE.Float32BufferAttribute(depth,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,uniforms:{uTime:{value:0},uDay:{value:1},uDusk:{value:0},uSun:{value:new THREE.Vector3(-.4,.8,.6)},uBeamSource:{value:Array.from({length:4},()=>new THREE.Vector3())},uBeamTarget:{value:Array.from({length:4},()=>new THREE.Vector3())},uBeamConfig:{value:Array.from({length:4},()=>new THREE.Vector3(0,.99,.96))}},
 vertexShader:`attribute float aDepth;uniform float uTime;varying vec3 vSea;varying vec3 vWorld;varying vec3 vNormal;varying float vDepth;
 void main(){vSea=position;vDepth=aDepth;vec3 n=normalize(position);float w=.003*sin(n.x*24.+n.z*17.-uTime*.62)+.0015*sin(n.y*37.-n.z*21.+uTime*.45);vec3 p=position+n*w;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*n);gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`uniform float uTime;uniform float uDay;uniform float uDusk;uniform vec3 uSun;uniform vec3 uBeamSource[4];uniform vec3 uBeamTarget[4];uniform vec3 uBeamConfig[4];varying vec3 vSea;varying vec3 vWorld;varying vec3 vNormal;varying float vDepth;
 void main(){
  vec3 N=normalize(vNormal),V=normalize(cameraPosition-vWorld);float d=max(0.,vDepth),fresnel=pow(1.-max(0.,dot(N,V)),3.);
  vec3 shallow=vec3(.105,.48,.40),middle=vec3(.014,.25,.29),deep=vec3(.004,.085,.19);
  vec3 color=mix(shallow,middle,smoothstep(.03,.36,d));color=mix(color,deep,smoothstep(.33,.67,d));
  float wash=sin(vSea.x*5.+sin(vSea.z*4.))*sin(vSea.y*6.+vSea.z*3.);color*=.96+wash*.035;
  color*=.67+.33*smoothstep(-.7,.65,dot(N,normalize(uSun)));
  color=mix(color*.46*vec3(.58,.76,1.1),color,uDay);color=mix(color,color*vec3(1.14,.93,.84),uDusk*.5);
  color=mix(color,vec3(.44,.70,.69)*(.35+.65*uDay),fresnel*.28);
  float ripple=sin(vSea.x*68.+vSea.z*41.+sin(vSea.y*23.+uTime*.3)-uTime*.8);
  float broken=smoothstep(.65,.94,sin(vSea.z*51.-vSea.y*17.));
  float shine=smoothstep(.982,.999,ripple)*broken*smoothstep(.65,.94,sin(vSea.y*94.+vSea.x*47.));
  vec3 H=normalize(V+normalize(uSun));float glint=pow(max(0.,dot(N,H)),90.);
  color+=vec3(.4,.52,.40)*shine*.038*(.4+.6*uDay);color+=vec3(.38,.33,.20)*glint*.2;
  float shimmer=pow(max(0.,dot(N,H)),24.)*smoothstep(.65,.98,ripple);
  color+=mix(vec3(.18,.30,.34),vec3(.72,.36,.16),uDusk)*shimmer*(.05+uDusk*.19);
  for(int i=0;i<4;i++){if(uBeamConfig[i].x>.001){vec3 delta=vWorld-uBeamSource[i];vec3 axis=normalize(uBeamTarget[i]-uBeamSource[i]);float dist=length(delta);float focus=smoothstep(uBeamConfig[i].z,uBeamConfig[i].y,dot(normalize(delta),axis));float incidence=max(.12,dot(N,-normalize(delta)));float illumination=focus*uBeamConfig[i].x*incidence/(1.+dist*dist*.4);color+=vec3(.94,.63,.27)*illumination*1.4;}}
  float washOut=.010+.008*sin(vSea.x*33.+vSea.z*29.+uTime*.8);float foam=(1.-smoothstep(.013+washOut,.042+washOut,d))*smoothstep(-.02,.009,vDepth);
  foam*=.6+.4*smoothstep(-.5,.8,sin(vSea.y*90.+vSea.x*51.+uTime*.7));
  color=mix(color,vec3(.83,.87,.69),foam*.74*uDay);
  float shelf=smoothstep(.10,.19,d)*(1.-smoothstep(.40,.53,d));
  float crest=smoothstep(.965,.997,sin(d*64.+uTime*.27+wash*.11));
  float stroke=smoothstep(-.12,.42,sin(vSea.x*13.+vSea.z*8.+sin(vSea.y*7.)));
  color=mix(color,vec3(.61,.79,.70),crest*stroke*shelf*.095*uDay);
  float opacity=.18+.24*smoothstep(.025,.42,d)+.56*smoothstep(.36,.68,d);opacity=min(.985,opacity+fresnel*.18+foam*.27);opacity*=smoothstep(-.013,.004,vDepth);
  gl_FragColor=vec4(color,opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geo,material);mesh.name='Translucent turquoise sea over living seabed';mesh.renderOrder=10;planet.add(mesh);
 return{mesh,material,stats:{transparent:true,depthWrite:false,nearOpacity:.18,deepOpacity:.98},update(t,env,sun,beams=[]){material.uniforms.uTime.value=t;material.uniforms.uDay.value=env.daylight;material.uniforms.uDusk.value=env.dusk;material.uniforms.uSun.value.copy(sun).normalize();for(let i=0;i<4;i++){const b=beams[i];material.uniforms.uBeamConfig.value[i].set(b?.power??0,b?.cosInner??.99,b?.cosOuter??.96);if(b){material.uniforms.uBeamSource.value[i].copy(b.source);material.uniforms.uBeamTarget.value[i].copy(b.target);}}}};
}

