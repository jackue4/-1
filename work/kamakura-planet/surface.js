import * as THREE from 'three';
export const R=3.15;
export const direction=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const trackLat=lon=>.105+.053*Math.sin(lon*2+.9)+.018*Math.sin(lon*5);
export const islands=[{name:'七里滨 · 镰仓海岸',lat:.46,lon:-.22,radius:.87},{name:'江之岛',lat:-.29,lon:1.16,radius:.30},{name:'远山',lat:.38,lon:3.12,radius:.42}];
islands.forEach(i=>i.center=direction(i.lat,i.lon));
export function coast(n){const lat=Math.asin(THREE.MathUtils.clamp(n.y,-1,1)),lon=Math.atan2(n.x,n.z),x=wrap(lon+.22)*Math.cos(.4)/1.03,y=(lat-.46)/.61;let s=(1-Math.hypot(x,y))*.60;s+=.012*Math.sin(lon*15+lat*9)*Math.sin(lat*13-lon*3);for(const i of islands.slice(1))s=Math.max(s,i.radius-n.distanceTo(i.center));return s;}
export function land(n){return THREE.MathUtils.smoothstep(coast(n),-.025,.095);}
export function baseHeight(n){const s=coast(n),lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z);if(s<0)return R-.013-.67*(1-Math.exp(s*4.1))+.008*Math.sin(n.x*28+n.z*19)*Math.sin(n.y*23);const beach=.008+Math.min(s,.09)*.32,interior=THREE.MathUtils.smoothstep(s,.055,.34),hills=.15+.19*THREE.MathUtils.smoothstep(lat,.28,.88)+.07*Math.sin(lon*5+.7)*Math.sin(lat*7);return R+beach+interior*hills;}
export const STREAM_START=.675,STREAM_END=-.19;
export function streamLon(lat){return -.20+.011*Math.sin((lat+.03)*14)*THREE.MathUtils.smoothstep(lat,.14,.26);}
const profile=[];for(let i=0;i<=320;i++){const lat=THREE.MathUtils.lerp(STREAM_START,STREAM_END,i/320),natural=baseHeight(direction(lat,streamLon(lat)))-.014-.040*Math.exp(-Math.pow((lat-trackLat(-.20))/.027,2))-.025*Math.exp(-Math.pow((lat-(trackLat(-.20)-.075))/.028,2)),prev=profile[i-1]?.water??Infinity;profile.push({lat,water:Math.max(R+.001,Math.min(natural,prev-.00006))});}
export function streamAt(lat){const t=THREE.MathUtils.clamp((STREAM_START-lat)/(STREAM_START-STREAM_END),0,1)*320,i=Math.min(319,Math.floor(t)),water=THREE.MathUtils.lerp(profile[i].water,profile[i+1].water,t-i),pool=Math.exp(-Math.pow((lat-.485)/.033,2))*.031+Math.exp(-Math.pow((lat-.275)/.036,2))*.025,lagoon=Math.exp(-Math.pow((lat+.067)/.066,2))*.177;return{lat,lon:streamLon(lat),water,halfWidth:.047+pool+lagoon,bedDepth:lagoon>.03?.069:.038};}
export function streamDistance(lat,lon){return Math.abs(wrap(lon-streamLon(lat)))*Math.cos(lat)*R;}
export function height(n){const base=baseHeight(n),lat=Math.asin(THREE.MathUtils.clamp(n.y,-1,1));if(lat>STREAM_START+.013||lat<STREAM_END-.018)return base;const lon=Math.atan2(n.x,n.z),s=streamAt(lat),d=streamDistance(lat,lon),blend=(1-THREE.MathUtils.smoothstep(d,s.halfWidth*.67,s.halfWidth*1.85))*THREE.MathUtils.smoothstep(lat,STREAM_END-.018,STREAM_END+.006)*(1-THREE.MathUtils.smoothstep(lat,STREAM_START-.004,STREAM_START+.013));return THREE.MathUtils.lerp(base,Math.min(base,s.water-s.bedDepth),blend);}
export function createSurface(){return{R,direction,trackLat,islands,land,height,baseHeight,coast,streamAt,streamDistance,streamStart:STREAM_START,streamEnd:STREAM_END};}
export function createLand(planet,palette){
 const geometry=new THREE.SphereGeometry(1,512,176),p=geometry.attributes.position,colors=[],n=new THREE.Vector3(),c=new THREE.Color();
 const sand=new THREE.Color('#f0d39a'),wet=new THREE.Color('#bed6b0'),deep=new THREE.Color('#116f87'),grass=new THREE.Color('#70a34d');let dry=0;
 for(let i=0;i<p.count;i++){n.fromBufferAttribute(p,i).normalize();const h=height(n),d=R-h,s=coast(n);p.setXYZ(i,n.x*h,n.y*h,n.z*h);if(d<0)dry++;
  if(d>0)c.copy(wet).lerp(sand,1-THREE.MathUtils.smoothstep(d,0,.14)).lerp(deep,THREE.MathUtils.smoothstep(d,.18,.63)*.72);else c.copy(sand).lerp(grass,THREE.MathUtils.smoothstep(s,.085,.18));
  const lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z),stream=streamAt(lat);if(lat<STREAM_START&&lat>STREAM_END&&streamDistance(lat,lon)<stream.halfWidth*1.5)c.lerp(new THREE.Color('#b9c5a5'),1-THREE.MathUtils.smoothstep(streamDistance(lat,lon),stream.halfWidth*.5,stream.halfWidth*1.5));
  const m=.95+.065*Math.sin(n.x*35+Math.sin(n.z*17))*Math.sin(n.y*31+n.z*14);c.multiplyScalar(m);colors.push(c.r,c.g,c.b);
 }
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const material=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp});material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vGround;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=position;');shader.fragmentShader='varying vec3 vGround;\nuniform float uGroundTime;\n'+shader.fragmentShader;shader.uniforms.uGroundTime={value:0};material.userData.shader=shader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float depth=3.15-length(vGround);float wash=sin(vGround.x*41.+sin(vGround.z*28.))*sin(vGround.y*46.+vGround.z*24.);diffuseColor.rgb*=1.+wash*.032;
 if(depth>.015){float sandRidge=sin(vGround.x*78.+vGround.z*35.+sin(vGround.y*17.+vGround.z*9.)*1.7);float sandShelf=1.-smoothstep(.13,.40,depth);diffuseColor.rgb*=1.+sandRidge*.045*sandShelf;float c=sin(vGround.x*38.+sin(vGround.z*29.+uGroundTime*.28))*sin(vGround.y*42.-vGround.z*15.+uGroundTime*.35);diffuseColor.rgb+=vec3(.14,.20,.12)*smoothstep(.75,.97,c)*(1.-smoothstep(.1,.55,depth));}`);};material.customProgramCacheKey=()=> 'kamakura-bathymetry-v3';
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Sculpted coast, sandy shelf and deep seabed';mesh.receiveShadow=true;planet.add(mesh);return{mesh,update(t){if(material.userData.shader)material.userData.shader.uniforms.uGroundTime.value=t;},stats:{islands:3,vertexLandRatio:dry/p.count}};
}
