import * as THREE from 'three';
export {THREE};
export const R=3.2;
export const normal=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
export const point=(lat,lon,height=0)=>normal(lat,lon).multiplyScalar(R+height);
const UP=new THREE.Vector3(0,1,0);
export function anchor(parent,lat,lon,height=0){const group=new THREE.Group();group.position.copy(point(lat,lon,height));group.quaternion.setFromUnitVectors(UP,normal(lat,lon));parent.add(group);return group;}
export function mesh(parent,geometry,material,position=[0,0,0],rotation=[0,0,0]){const m=new THREE.Mesh(geometry,material);m.position.set(...position);m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function tube(parent,points,radius,material,segments=48){const curve=points.isCurve?points:new THREE.CatmullRomCurve3(points.map(p=>p.isVector3?p:new THREE.Vector3(...p)));return mesh(parent,new THREE.TubeGeometry(curve,segments,radius,6,false),material);}
export function seeded(seed=2026){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function createPalette(){
 const tex=new THREE.DataTexture(new Uint8Array([108,150,204,255]),4,1,THREE.RedFormat);tex.needsUpdate=true;tex.minFilter=tex.magFilter=THREE.NearestFilter;
 const cache=new Map(),lamps=new Map();
 const colors={cream:'#fff0d7',pink:'#ee8ea6',rose:'#c66e8f',mint:'#83c6a9',teal:'#55988d',lavender:'#a89dce',purple:'#75679b',gold:'#e9bd69',water:'#67c8cc',grass:'#97bf81',ink:'#425c59'};
 const m=color=>{if(!cache.has(color))cache.set(color,new THREE.MeshToonMaterial({color,gradientMap:tex}));return cache.get(color);};
 const glow=color=>{if(!lamps.has(color))lamps.set(color,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.15,roughness:.5}));return lamps.get(color);};
 return{m,glow,colors,update(night,pulse=0){for(const mat of lamps.values())mat.emissiveIntensity=.13+night*(1.5+pulse*.55);},dispose(){for(const mat of [...cache.values(),...lamps.values()])mat.dispose();tex.dispose();}};
}
