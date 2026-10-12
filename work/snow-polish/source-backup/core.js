import * as THREE from 'three';
export {THREE};
export const R=3.2;
export const normal=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
export const point=(lat,lon,h=0)=>normal(lat,lon).multiplyScalar(R+h);
export function anchor(parent,lat,lon,h=0,turn=0){const g=new THREE.Group(),up=normal(lat,lon),east=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),south=new THREE.Vector3().crossVectors(east,up);g.position.copy(point(lat,lon,h));g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east,up,south));g.rotateY(turn);parent.add(g);return g;}
export function mesh(parent,geo,mat,pos=[0,0,0],scale){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function seeded(seed=1309){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function createPalette(){const ramp=new THREE.DataTexture(new Uint8Array([130,180,222,255]),4,1,THREE.RedFormat);ramp.needsUpdate=true;ramp.minFilter=ramp.magFilter=THREE.NearestFilter;const cache=new Map();return{m(c){if(!cache.has(c))cache.set(c,new THREE.MeshToonMaterial({color:c,gradientMap:ramp}));return cache.get(c);},dispose(){ramp.dispose();cache.forEach(m=>m.dispose());}};}
