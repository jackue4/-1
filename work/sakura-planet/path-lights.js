import * as THREE from 'three';
import {pathLat,farmReserved,pondReserved} from './layout.js';

// Shared lamp materials and two batched glow layers keep dusk inexpensive.
export function createPathLights({planet,direction,height,R,anchor,mesh,cyl,box,cone,houses}){
  const lens=new THREE.MeshStandardMaterial({color:'#f7dfac',emissive:'#ffc16a',emissiveIntensity:0,roughness:.6,toneMapped:false});
  const pixels=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5),a=Math.pow(Math.max(0,1-r),2.4);pixels.set([255,220,153,Math.round(a*255)],(y*64+x)*4);}
  const texture=new THREE.DataTexture(pixels,64,64);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
  const poolMat=new THREE.MeshBasicMaterial({map:texture,color:'#ffd98a',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
  const positions=[],uvs=[],indices=[],bulbs=[],normals=[];
  const candidates=[-.85,-.51,-.12,.25,.62,.97,...Array.from({length:18},(_,i)=>1.3+i*Math.PI*2/18)];
  for(const lon of candidates){
    const n=direction(pathLat(lon)+.075,lon);
    if(height(n)<R+.08||farmReserved(n,.015)||pondReserved(n,.25)||houses.some(h=>n.distanceTo(direction(h.lat,h.lon))<.25)||normals.some(p=>p.distanceTo(n)<.18))continue;
    normals.push(n);const g=anchor(n);g.name='Warm path lantern';
    mesh(g,cyl,'#b49169',[0,.028,0],[.042,.056,.042]);
    mesh(g,cyl,'#657b64',[0,.192,0],[.014,.33,.014]);
    mesh(g,box,'#64725a',[0,.373,0],[.101,.014,.087]);
    mesh(g,box,lens,[0,.333,0],[.071,.066,.060],false);
    for(const x of [-.042,.042])for(const z of [-.035,.035])mesh(g,cyl,'#657b64',[x,.334,z],[.004,.080,.004],false);
    mesh(g,cone,'#79906b',[0,.402,0],[.082,.049,.072]);
    mesh(g,cyl,'#d6b779',[0,.433,0],[.009,.024,.009],false);
    bulbs.push(...n.clone().multiplyScalar(height(n)+.34).toArray());
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),n),start=positions.length/3;
    // Follow the curved terrain so the pool of light stays glued to the road.
    for(let y=0;y<=8;y++)for(let x=0;x<=8;x++){
      const p=new THREE.Vector3((x/8-.5)*.68,0,(y/8-.5)*.68).applyQuaternion(rotation).add(g.position).normalize();
      positions.push(...p.multiplyScalar(height(p)+.009).toArray());uvs.push(x/8,y/8);
      if(x<8&&y<8){const a=start+y*9+x;indices.push(a,a+1,a+9,a+1,a+10,a+9);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);
  const pools=new THREE.Mesh(geo,poolMat);pools.name='Warm pools on footpath';pools.renderOrder=3;planet.add(pools);
  const haloGeo=new THREE.BufferGeometry();haloGeo.setAttribute('position',new THREE.Float32BufferAttribute(bulbs,3));
  const haloMat=new THREE.PointsMaterial({map:texture,color:'#ffdca0',size:.30,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const halos=new THREE.Points(haloGeo,haloMat);halos.name='Soft lantern halos';planet.add(halos);
  let level=0;
  function update(dt,env){const target=THREE.MathUtils.smoothstep(Math.max(env.night,env.sunset||0),.16,.68);level=THREE.MathUtils.lerp(level,target,1-Math.exp(-Math.max(0,dt)*2));lens.emissiveIntensity=level*2.2;poolMat.opacity=level*.60;haloMat.opacity=level*.60;pools.visible=halos.visible=level>.005;}
  return{normals,pools,halos,update,getState:()=>({count:normals.length,brightness:level,on:level>.5}),dispose(){texture.dispose();}};
}
