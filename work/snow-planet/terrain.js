import {THREE,R,normal} from './core.js';

const islands=[[.75,-.32,.56,1.08],[.10,.61,.85,.32],[.05,1.04,.87,.22],[-.61,-.70,.44,.61],[.4,2.5,.82,.9],[-.7,-2.2,.64,.9]];
const angular=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const fract=x=>x-Math.floor(x),hash=(x,y,z)=>fract(Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453);
function noise(x,y,z){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),u=smooth(0,1,x-a),v=smooth(0,1,y-b),w=smooth(0,1,z-c),mix=(a,b,t)=>a+(b-a)*t;return mix(mix(mix(hash(a,b,c),hash(a+1,b,c),u),mix(hash(a,b+1,c),hash(a+1,b+1,c),u),v),mix(mix(hash(a,b,c+1),hash(a+1,b,c+1),u),mix(hash(a,b+1,c+1),hash(a+1,b+1,c+1),u),v),w);}

export function landField(lat,lon){let value=-8;for(const [a,b,h,w] of islands)value=Math.max(value,1-Math.hypot((lat-a)/h,angular(lon,b)/w));const canal=Math.max((Math.abs(lon-.78)/.085-1)*.19,(Math.abs(lat)/.66-1)*.20),pond=(Math.hypot((lat-.52)/.16,(lon+.32)/.56)-1)*.23,turningPond=(Math.hypot((Math.abs(lat)-.50)/.20,(lon-.78)/.12)-1)*.23;return Math.min(value,canal,pond,turningPond)+Math.sin(lon*23+lat*13)*.013+Math.sin(lat*38-lon*11)*.006;}

// Continuous shore profile: the old 32 mm jump made snow end in sawtooth cliffs.
// The lake datum stays exactly R+.006 so existing boat and bridge clearance holds.
export function groundHeight(lat,lon){const f=landField(lat,lon),n=normal(lat,lon),dry=smooth(.035,.18,f),drift=noise(n.x*13,n.y*13,n.z*13)*.011+noise(n.x*6+2,n.y*6,n.z*6)*.017;return -.13+.158*smooth(-.16,.046,f)+dry*(.056*smooth(.08,.72,f)+drift);}

export function createSnowTerrain({parent,mobile=false}){
 const geometry=new THREE.SphereGeometry(R,mobile?288:384,mobile?192:256),p=geometry.attributes.position,colors=new Float32Array(p.count*3),masks=new Float32Array(p.count),snow=new THREE.Color('#f4f8fa'),blue=new THREE.Color('#d9e6ee'),ice=new THREE.Color('#bdced4'),bed=new THREE.Color('#a1c1b6'),deep=new THREE.Color('#6c9f9c'),earth=new THREE.Color('#98aaa7');
 for(let i=0;i<p.count;i++){const n=new THREE.Vector3().fromBufferAttribute(p,i).normalize(),lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z),f=landField(lat,lon),h=groundHeight(lat,lon),cover=smooth(.004,.061,f),variation=noise(n.x*11,n.y*11,n.z*11),col=h<.003?deep.clone().lerp(bed,smooth(-.13,.0,h)):earth.clone().lerp(ice,smooth(-.005,.025,f));col.lerp(snow.clone().lerp(blue,(1-variation)*.30),cover);n.multiplyScalar(R+h);p.setXYZ(i,n.x,n.y,n.z);col.toArray(colors,i*3);masks[i]=cover;}
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('aSnowCover',new THREE.BufferAttribute(masks,1));geometry.computeVertexNormals();
 const uniforms={uSnowNight:{value:0},uSnowDusk:{value:0}},material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0});
 material.name='柔雪 / 青蓝半影与细粉颗粒';
 const functions=`
 varying vec3 vPowderPosition;varying float vSnowCover;uniform float uSnowNight;uniform float uSnowDusk;
 float powderHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float powderNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(powderHash(i),powderHash(i+vec3(1,0,0)),f.x),mix(powderHash(i+vec3(0,1,0)),powderHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(powderHash(i+vec3(0,0,1)),powderHash(i+vec3(1,0,1)),f.x),mix(powderHash(i+vec3(0,1,1)),powderHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aSnowCover;varying vec3 vPowderPosition;varying float vSnowCover;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPowderPosition=position;vSnowCover=aSnowCover;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+functions).replace('#include <color_fragment>',`#include <color_fragment>
 float powder=powderNoise(vPowderPosition*37.);float brush=powderNoise(vPowderPosition*8.5+vec3(4.1,0.,1.));
 float facing=dot(normalize(vPowderPosition),normalize(vec3(-.5,.8,.5)));
 vec3 coolSnow=mix(vec3(.78,.875,1.),vec3(.90,.95,1.),smoothstep(-.4,.55,facing));
 diffuseColor.rgb*=mix(vec3(1.),coolSnow*(.978+.022*powder+.012*brush),vSnowCover);
 `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition),r1=cross(sy,normal),r2=cross(normal,sx);float det=dot(sx,r1);
 float powderHeight=powder*.00032*vSnowCover;normal=normalize(abs(det)*normal-sign(det)*(dFdx(powderHeight)*r1+dFdy(powderHeight)*r2));
 `).replace('#include <opaque_fragment>',`outgoingLight+=vSnowCover*vec3(.019,.029,.045)*(1.-uSnowNight*.55);
 #include <opaque_fragment>`);};
 const mesh=new THREE.Mesh(geometry,material);mesh.name='绵软积雪与平滑融雪岸';mesh.receiveShadow=true;mesh.castShadow=false;parent.add(mesh);
 // Keep custom snow attributes intact; the generic scenery batcher strips extras.
 mesh.userData.dynamic=true;
 return{mesh,material,uniforms,update(time,env){uniforms.uSnowNight.value=env.night||0;uniforms.uSnowDusk.value=env.dusk||0;},dispose(){geometry.dispose();material.dispose();}};
}
