import * as THREE from 'three';
export const R=3.15;
export const direction=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const trackLat=lon=>.105+.053*Math.sin(lon*2+.9)+.018*Math.sin(lon*5);
export const islands=[{name:'七里滨 · 镰仓海岸',lat:.46,lon:-.22,radius:.87},{name:'江之岛',lat:-.29,lon:1.16,radius:.30},{name:'远山',lat:.38,lon:3.12,radius:.42}];
islands.forEach(i=>i.center=direction(i.lat,i.lon));
export function coast(n){const lat=Math.asin(THREE.MathUtils.clamp(n.y,-1,1)),lon=Math.atan2(n.x,n.z),x=wrap(lon+.22)*Math.cos(.4)/1.03,y=(lat-.46)/.61;let s=(1-Math.hypot(x,y))*.60;s+=.012*Math.sin(lon*15+lat*9)*Math.sin(lat*13-lon*3);for(const i of islands.slice(1))s=Math.max(s,i.radius-n.distanceTo(i.center));return s;}
export function land(n){return THREE.MathUtils.smoothstep(coast(n),-.025,.095);}
export function height(n){const s=coast(n),lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z);if(s<0)return R-.013-.67*(1-Math.exp(s*4.1))+.008*Math.sin(n.x*28+n.z*19)*Math.sin(n.y*23);const beach=.008+Math.min(s,.09)*.32,interior=THREE.MathUtils.smoothstep(s,.055,.34),hills=.15+.19*THREE.MathUtils.smoothstep(lat,.28,.88)+.07*Math.sin(lon*5+.7)*Math.sin(lat*7);return R+beach+interior*hills;}
export function createSurface(){return{R,direction,trackLat,islands,land,height,coast};}
export function createLand(planet,palette){
 const geometry=new THREE.SphereGeometry(1,256,176),p=geometry.attributes.position,colors=[],n=new THREE.Vector3(),c=new THREE.Color();
 const sand=new THREE.Color('#edcd89'),wet=new THREE.Color('#b9d5a3'),deep=new THREE.Color('#116f87'),grass=new THREE.Color('#70a34d');let dry=0;
 for(let i=0;i<p.count;i++){n.fromBufferAttribute(p,i).normalize();const h=height(n),d=R-h,s=coast(n);p.setXYZ(i,n.x*h,n.y*h,n.z*h);if(d<0)dry++;
  if(d>0)c.copy(wet).lerp(sand,1-THREE.MathUtils.smoothstep(d,0,.14)).lerp(deep,THREE.MathUtils.smoothstep(d,.18,.63)*.72);else c.copy(sand).lerp(grass,THREE.MathUtils.smoothstep(s,.085,.18));
  const m=.95+.065*Math.sin(n.x*35+Math.sin(n.z*17))*Math.sin(n.y*31+n.z*14);c.multiplyScalar(m);colors.push(c.r,c.g,c.b);
 }
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const material=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp});material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vGround;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=position;');shader.fragmentShader='varying vec3 vGround;\nuniform float uGroundTime;\n'+shader.fragmentShader;shader.uniforms.uGroundTime={value:0};material.userData.shader=shader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float depth=3.15-length(vGround);float wash=sin(vGround.x*41.+sin(vGround.z*28.))*sin(vGround.y*46.+vGround.z*24.);diffuseColor.rgb*=1.+wash*.032;
 if(depth>.015){float c=sin(vGround.x*38.+sin(vGround.z*29.+uGroundTime*.28))*sin(vGround.y*42.-vGround.z*15.+uGroundTime*.35);diffuseColor.rgb+=vec3(.14,.20,.12)*smoothstep(.75,.97,c)*(1.-smoothstep(.1,.55,depth));}`);};material.customProgramCacheKey=()=> 'kamakura-bathymetry-v2';
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Sculpted coast, sandy shelf and deep seabed';mesh.receiveShadow=true;planet.add(mesh);return{mesh,update(t){if(material.userData.shader)material.userData.shader.uniforms.uGroundTime.value=t;},stats:{islands:3,vertexLandRatio:dry/p.count}};
}
