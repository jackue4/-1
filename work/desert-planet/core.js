import * as THREE from 'three';
export {THREE};
export const R=3.2,TAU=Math.PI*2;
export const normal=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
export const point=(lat,lon,height=0)=>normal(lat,lon).multiplyScalar(R+height);
export function frame(lat,lon,radius=R){const n=normal(lat,lon),e=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),s=new THREE.Vector3().crossVectors(e,n);return new THREE.Matrix4().makeBasis(e,n,s).setPosition(n.multiplyScalar(radius));}
export function anchor(parent,lat,lon,height=0){const g=new THREE.Group();frame(lat,lon,R+height).decompose(g.position,g.quaternion,g.scale);parent.add(g);return g;}
export function mesh(parent,geometry,material,position=[0,0,0],rotation=[0,0,0]){const o=new THREE.Mesh(geometry,material);o.position.set(...position);o.rotation.set(...rotation);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
export function tube(parent,points,radius,material,segments=24){const c=points.isCurve?points:new THREE.CatmullRomCurve3(points.map(p=>p.isVector3?p:new THREE.Vector3(...p)));return mesh(parent,new THREE.TubeGeometry(c,segments,radius,5,false),material);}
export function seeded(seed=2026){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function createPalette(){
 const gradient=new THREE.DataTexture(new Uint8Array([119,153,185,219,248]),5,1,THREE.RedFormat);gradient.minFilter=gradient.magFilter=THREE.LinearFilter;gradient.needsUpdate=true;const cache=new Map(),lamps=new Map();
 const m=color=>{if(!cache.has(color))cache.set(color,new THREE.MeshToonMaterial({color,gradientMap:gradient}));return cache.get(color);};
 const glow=color=>{if(!lamps.has(color))lamps.set(color,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.1,roughness:.6}));return lamps.get(color);};
 return{m,glow,gradient,colors:{sand:'#efd4a2',cream:'#fff1d4',terra:'#c7805d',rose:'#d99979',teal:'#2da6a6',ink:'#566660',wood:'#987256',gold:'#e7b768'},update(night){for(const mat of lamps.values())mat.emissiveIntensity=.08+night*1.4;},dispose(){for(const mat of [...cache.values(),...lamps.values()])mat.dispose();gradient.dispose();}};
}

export const COVE={lat:.12,lon:0,raise:.055};
export const SITES={treasury:{lat:.66,lon:-.60,raise:.10},kasbah:{lat:.47,lon:1.18,raise:.10},oasis:{lat:.38,lon:2.8,raise:.04},arch:{lat:.3,lon:-1.7,raise:.08},caravan:{lat:.92,lon:.24,raise:.20}};
