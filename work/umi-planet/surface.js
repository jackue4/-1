import * as THREE from 'three';
export const R=3.15;
export const direction=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
export const trackLat=lon=>.12+.12*Math.sin(lon*2-.6)+.075*Math.sin(lon*3+1.4);
export const islands=[
 {name:'花海町',lat:.27,lon:-.28,radius:.60},
 {name:'汐見島',lat:-.10,lon:1.78,radius:.36},
 {name:'青葉岬',lat:.40,lon:3.20,radius:.46},
 {name:'夕凪島',lat:-.65,lon:-2,radius:.35},
];
islands.forEach(i=>{i.center=direction(i.lat,i.lon);});
export function land(n){
 let value=0;for(const i of islands){const d=n.distanceTo(i.center),shore=1+.048*Math.sin(n.x*18+n.z*9)*Math.sin(n.y*16+n.x*5);value=Math.max(value,THREE.MathUtils.smoothstep(1-d/(i.radius*shore),0,.28));}return value;
}
export function height(n){
 const l=land(n),hill=.027*Math.sin(n.x*12+n.y*8)*Math.cos(n.z*11-n.y*6)+.021*Math.sin(n.z*17+n.x*4);
 return R-.085+l*(.21+hill);
}
export function createSurface(){return{R,direction,trackLat,islands,land,height};}

export function createLand(planet,palette){
 const geometry=new THREE.SphereGeometry(1,176,112),p=geometry.attributes.position,colors=[];
 const n=new THREE.Vector3(),c=new THREE.Color(),sand=new THREE.Color('#e9d5a7'),grass=new THREE.Color('#8dac76'),deep=new THREE.Color('#619e9b');
 let exposed=0;
 for(let i=0;i<p.count;i++){
  n.fromBufferAttribute(p,i).normalize();const h=height(n),l=land(n);p.setXYZ(i,n.x*h,n.y*h,n.z*h);
  if(h>R)exposed++;
  if(l<.43)c.copy(deep).lerp(sand,THREE.MathUtils.smoothstep(l,.16,.43));else c.copy(sand).lerp(grass,THREE.MathUtils.smoothstep(l,.48,.82));
  const wash=.95+.055*Math.sin(n.x*13+n.z*9)*Math.sin(n.y*17-n.x*4);c.multiplyScalar(wash);colors.push(c.r,c.g,c.b);
 }
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const material=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp});
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vPaintGround;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPaintGround=position;');
  shader.fragmentShader='varying vec3 vPaintGround;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float wash=sin(dot(vPaintGround,vec3(11.,7.,9.))+sin(vPaintGround.z*17.));
   diffuseColor.rgb*=1.+wash*.035;
  `);
 };material.customProgramCacheKey=()=> 'umi-island-pigment-v1';
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Four sculpted coastal islands';mesh.receiveShadow=true;planet.add(mesh);
 return {mesh,stats:{islands:4,vertexLandRatio:exposed/p.count}};
}
