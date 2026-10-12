import * as THREE from 'three';
import {pathLat,farmReserved,pondReserved} from './layout.js';
import {random,hash} from './ecology.js';
import {PAINT_WASH_GLSL} from './painted-style.js';

// A shared travelling wind field drives water, grass and tree crowns. These are
// procedural surface dynamics, not a Navier–Stokes fluid simulation.
export const WIND_GLSL = `
uniform float uNatureTime;
uniform float uWind;
float windField(vec3 p){
  float gust=pow(.5+.5*sin(dot(p,vec3(2.1,.65,1.35))-uNatureTime*.56),2.);
  return (.18+.72*gust+.06*sin(dot(p,vec3(3.1,-1.2,2.8))-uNatureTime*1.05))*uWind;
}
`;
export function windAt(p,time,strength){const gust=(.5+.5*Math.sin(p.x*2.1+p.y*.65+p.z*1.35-time*.56))**2;return(.18+.72*gust+.06*Math.sin(p.x*3.1-p.y*1.2+p.z*2.8-time*1.05))*strength;}
const WAVES = [[1.7,.5,1.2,4.7,1.15,.020],[-.8,1.3,1.7,8.2,1.65,.010],[1.2,-.7,1.4,14.3,2.25,.0045]];
export const WATER_GLSL = WIND_GLSL + `
float oceanHeight(vec3 p,float depth){
  float shore=smoothstep(0.,.08,depth);
  float swell=sin(dot(p,vec3(1.7,.5,1.2))*4.7-uNatureTime*1.15)*.020
    +sin(dot(p,vec3(-.8,1.3,1.7))*8.2-uNatureTime*1.65)*.010
    +sin(dot(p,vec3(1.2,-.7,1.4))*14.3-uNatureTime*2.25)*.0045;
  return swell*shore*(.6+uWind*.9);
}
`;
export function sampleWater(p,depth,time,strength){let sum=0;for(const [x,y,z,k,speed,a] of WAVES)sum+=Math.sin((p.x*x+p.y*y+p.z*z)*k-time*speed)*a;return sum*THREE.MathUtils.smoothstep(depth,0,.08)*(.6+strength*.9);}
export function createNatureUniforms(){return{uNatureTime:{value:0},uWind:{value:.6},uDaylight:{value:1},uSnow:{value:0},uActors:{value:Array.from({length:6},()=>new THREE.Vector3(100,100,100))}};}

export function enhanceWater(material,uniforms){
  material.transparent=true;material.depthWrite=false;
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=WATER_GLSL+'\nattribute float seaDepth;varying vec3 vOceanPos;varying float vDepth;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vDepth=seaDepth;vOceanPos=position;transformed+=normalize(position)*oceanHeight(position,seaDepth);
    `);
    shader.fragmentShader='uniform float uNatureTime;uniform float uDaylight;varying vec3 vOceanPos;varying float vDepth;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float flow=sin(dot(vOceanPos,vec3(18.,8.,13.))-uNatureTime*.65+sin(vOceanPos.y*12.+uNatureTime*.3));
      float crossFlow=sin(dot(vOceanPos,vec3(-12.,17.,19.))+uNatureTime*.47);
      float line=smoothstep(.86,.98,flow)*smoothstep(-.10,.72,crossFlow);
      float shallow=1.-smoothstep(.02,.20,vDepth);
      float waterWash=.5+.5*sin(dot(vOceanPos,vec3(3.7,2.4,-4.1))+crossFlow*.24);
      diffuseColor.rgb*=mix(vec3(.82,.94,1.02),vec3(1.04,1.06,.89),waterWash*.64);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.44,.75,.68),line*(.10+shallow*.15));
      float edge=(1.-smoothstep(.008,.055,vDepth))*smoothstep(.25,.85,sin(vDepth*140.-uNatureTime*1.5));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.98,.87),edge*.62);
      vec3 surfaceN=normalize(cross(dFdx(vViewPosition),dFdy(vViewPosition)));
      float fresnel=pow(1.-abs(dot(surfaceN,normalize(vViewPosition))),3.);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.65,.82,.77),fresnel*.28+line*.07);
      diffuseColor.a=clamp(.19+smoothstep(.015,.26,vDepth)*.39+fresnel*.29+edge*.14+line*.08,.18,.88);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`// Broad painted sky glints, deliberately broken into moving strokes.
      vec3 skyWash=mix(vec3(.055,.10,.18),vec3(.53,.76,.80),smoothstep(.2,1.,uDaylight));
      outgoingLight=mix(outgoingLight,skyWash,fresnel*.22);
      float glint=line*smoothstep(.20,.78,waterWash)*uDaylight;
      outgoingLight+=vec3(.32,.34,.25)*glint*.10;
      #include <opaque_fragment>`);
  };material.customProgramCacheKey=()=> 'painted-lagoon-v8';
}

// Shared, gently moving light ribbons on the seabed and opaque coral geometry.
export function enhanceCaustics(material,uniforms,radius){
  const before=material.onBeforeCompile.bind(material);
  material.onBeforeCompile=shader=>{
    before(shader);Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='varying vec3 vReefPoint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vReefPoint=position;
      #ifdef USE_INSTANCING
        vReefPoint=(instanceMatrix*vec4(position,1.)).xyz;
      #endif
    `);
    shader.fragmentShader='uniform float uNatureTime;uniform float uDaylight;varying vec3 vReefPoint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float under=1.-smoothstep(${(radius-.025).toFixed(4)},${radius.toFixed(4)},length(vReefPoint));
      float ca=sin(dot(vReefPoint,vec3(48.,23.,31.))+sin(vReefPoint.z*22.-uNatureTime*.6)+uNatureTime*.8);
      float cb=sin(dot(vReefPoint,vec3(-27.,43.,36.))+sin(vReefPoint.x*19.+uNatureTime*.5));
      float caustic=pow(max(0.,1.-abs(ca+cb)*1.9),6.);
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.71,.91,.89),under*.45);
      totalEmissiveRadiance+=vec3(.55,.75,.53)*caustic*under*uDaylight*.23;
    `);
  };material.customProgramCacheKey=()=> 'lagoon-caustics-v1';
}

export function enhanceFoliage(material,uniforms){
  function deform(shader){
    Object.assign(shader.uniforms,uniforms);shader.vertexShader=WIND_GLSL+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 root=instanceMatrix[3].xyz;
      vec3 outward=normalize(root),wind=vec3(.8,.1,.45);wind-=outward*dot(wind,outward);
      vec3 delta=wind*windField(root)*.018;
      transformed+=vec3(dot(instanceMatrix[0].xyz,delta)/dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,delta)/dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,delta)/dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
    `);
  }
  material.onBeforeCompile=shader=>{
    deform(shader);shader.vertexShader='varying vec3 vPaintPoint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPaintPoint=position;');
    shader.fragmentShader=PAINT_WASH_GLSL+'uniform float uSnow;varying vec3 vPaintPoint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float brush=paintedWash(vPaintPoint*.72);
      vec3 cool=diffuseColor.rgb*vec3(.79,.97,1.04);
      vec3 warm=diffuseColor.rgb*vec3(1.12,1.08,.85);
      diffuseColor.rgb=mix(cool,warm,.22+brush*.52+smoothstep(-.35,.9,vPaintPoint.y)*.20);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.95,.85),uSnow*smoothstep(.3,.9,vPaintPoint.y)*.65);
    `);
  };material.customProgramCacheKey=()=> 'painted-foliage-v7';
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});depth.onBeforeCompile=deform;depth.customProgramCacheKey=()=> 'painted-foliage-depth-v6';return depth;
}

export function enhanceFoam(material,uniforms){
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='varying vec2 vFoamUV;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFoamUV=uv;');
    shader.fragmentShader='uniform float uNatureTime;varying vec2 vFoamUV;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float edge=sin(clamp(vFoamUV.y,0.,1.)*3.14159265);
      float lace=.52+.25*sin(vFoamUV.x*91.+uNatureTime*.8)+.22*sin(vFoamUV.x*187.-uNatureTime*.5+vFoamUV.y*8.);
      diffuseColor.a*=pow(max(edge,0.),.6)*smoothstep(.06,.6,lace);
    `);
  };material.customProgramCacheKey=()=> 'bloom-foam-v4';
}

const GRASS_GLSL=WIND_GLSL+`
uniform vec3 uActors[6];
vec3 grassBend(vec3 p){
  vec3 root=instanceMatrix[3].xyz;
  vec3 outward=normalize(root);
  vec3 windDir=normalize(vec3(.8,.12,.5)-outward*dot(vec3(.8,.12,.5),outward)+vec3(.00001));
  vec3 localWind=vec3(dot(windDir,normalize(instanceMatrix[0].xyz)),0.,dot(windDir,normalize(instanceMatrix[2].xyz)));
  float bend=windField(root)*.38+.012*sin(dot(root,vec3(8.,4.,7.))+uNatureTime*1.25)*uWind;
  float tip=p.y*p.y;
  vec3 push=vec3(0.);
  for(int i=0;i<6;i++){
    vec3 delta=root-uActors[i];float distanceTo=length(delta);
    vec3 away=delta/max(distanceTo,.01);float weight=1.-smoothstep(.035,.23,distanceTo);
    push+=vec3(dot(away,normalize(instanceMatrix[0].xyz)),0.,dot(away,normalize(instanceMatrix[2].xyz)))*weight*.75;
  }
  p+=localWind*bend*tip+push*tip;
  p.y-=tip*min(.27,bend*.13+length(push)*.12);
  return p;
}
`;
export function createMeadow(planet,terrainHeight,radius,houseSites,uniforms,gradientMap){
  const rng=random(hash('painted-meadow-drifts-01')),up=new THREE.Vector3(0,1,0),positions=[],normals=[],uv=[],indices=[];
  // Six triangles per broad curved leaf: soft brush-like silhouettes retain a
  // readable meadow at globe scale without adding noisy, needle-thin geometry.
  const rows=[[0,.22],[.28,.31],[.66,.205],[1,.002]];
  rows.forEach(([h,width],row)=>{const sweep=.38*h*h,lateral=.16*h*h;positions.push(-width+lateral,h,sweep,width+lateral,h,sweep);uv.push(0,h,1,h);for(const side of [-1,1]){const n=new THREE.Vector3(side*.20,.52+.32*h,1).normalize();normals.push(...n.toArray());}if(row<3){const a=row*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  const transforms=[],shades=[],roots=[],dummy=new THREE.Object3D(),normal=new THREE.Vector3();
  const houseNormals=houseSites.map(h=>new THREE.Vector3(Math.cos(h.lat)*Math.sin(h.lon),Math.sin(h.lat),Math.cos(h.lat)*Math.cos(h.lon)));
  function valid(n){const lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z);return !farmReserved(n,.016)&&!pondReserved(n,.5)&&terrainHeight(n)>radius+.111&&Math.abs(lat-pathLat(lon))>.046&&!houseNormals.some(h=>n.distanceTo(h)<.20)&&n.distanceTo(new THREE.Vector3(0,.03,1).normalize())>.092;}
  const rootShade=new THREE.Color('#78a95a'),sunShade=new THREE.Color('#b5cd70'),coolShade=new THREE.Color('#659770');
  function drift(n){return .5+.5*Math.sin(n.x*9.5+Math.sin(n.z*6.2)*1.7)*Math.cos(n.y*8.3-n.z*2.1);}
  for(let attempt=0,clusters=0;attempt<24000&&clusters<3150;attempt++){
    const y=rng()*2-1,a=rng()*Math.PI*2;normal.set(Math.sqrt(1-y*y)*Math.sin(a),y,Math.sqrt(1-y*y)*Math.cos(a));if(!valid(normal))continue;
    const patch=drift(normal);if(rng()>.29+patch*.68)continue;clusters++;
    const x=new THREE.Vector3().crossVectors(Math.abs(y)>.95?new THREE.Vector3(1,0,0):up,normal).normalize(),z=new THREE.Vector3().crossVectors(normal,x);
    const spread=.020+patch*.036,turn=rng()*6.283,tall=clusters%7===0;
    for(let j=0;j<5;j++){
      const angle=j*2.399+turn,distance=Math.sqrt(rng())*spread,bladeN=normal.clone().addScaledVector(x,Math.sin(angle)*distance).addScaledVector(z,Math.cos(angle)*distance).normalize();if(!valid(bladeN))continue;
      dummy.position.copy(bladeN).multiplyScalar(terrainHeight(bladeN)-.002);dummy.quaternion.setFromUnitVectors(up,bladeN);dummy.rotateY(turn+j*1.24+(rng()-.5)*.6);
      const h=.036+rng()*.031+patch*.029+(tall?.025:0);dummy.scale.set(h*(1.48+rng()*.72),h,h*(.85+rng()*.30));dummy.updateMatrix();transforms.push(dummy.matrix.clone());roots.push(dummy.position.clone());
      shades.push(rootShade.clone().lerp(sunShade,patch*.66+rng()*.12).lerp(coolShade,(1-patch)*.18));
    }
  }
  const material=new THREE.MeshToonMaterial({color:'#ffffff',gradientMap,side:THREE.DoubleSide});
  const blades=new THREE.InstancedMesh(geometry,material,transforms.length);blades.name='Wind meadow';
  transforms.forEach((matrix,i)=>{blades.setMatrixAt(i,matrix);blades.setColorAt(i,shades[i]);});blades.instanceMatrix.needsUpdate=true;blades.instanceColor.needsUpdate=true;blades.castShadow=false;blades.receiveShadow=true;blades.frustumCulled=false;planet.add(blades);
  function deform(shader){Object.assign(shader.uniforms,uniforms);shader.vertexShader=GRASS_GLSL+'\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=grassBend(position);');}
  material.onBeforeCompile=shader=>{deform(shader);shader.vertexShader='varying float vBladeHeight;varying vec3 vMeadowRoot;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBladeHeight=position.y;vMeadowRoot=instanceMatrix[3].xyz;');shader.fragmentShader='uniform float uSnow;uniform float uDaylight;varying float vBladeHeight;varying vec3 vMeadowRoot;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float wash=.5+.5*sin(dot(vMeadowRoot,vec3(5.8,2.7,4.1))+vBladeHeight*.7);
    float tip=smoothstep(.05,.98,vBladeHeight);
    diffuseColor.rgb*=mix(vec3(.68,.86,.78),vec3(1.18,1.12,.81),tip);
    diffuseColor.rgb*=.95+wash*.09;
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.93,.83),uSnow*smoothstep(.4,1.,vBladeHeight)*.85);
  `);shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*.022*vBladeHeight*uDaylight;');};
  material.customProgramCacheKey=()=> 'painted-meadow-drifts-v9';

  const count=transforms.length;
  return{blades,roots,count,setLowQuality(low){blades.count=low?Math.floor(count*.42):count;blades.castShadow=false;},dispose(){}};
}
