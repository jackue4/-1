import * as THREE from 'three';
import {pathLat,farmReserved,pondReserved} from './layout.js';
import {random,hash} from './ecology.js';
import {enhanceFoliage} from './nature.js';
import {createSoftLeaf} from './vegetation.js';

// Surface-conforming set dressing, batched by material rather than by plant.
export function createLandscape(planet,height,R,houses,uniforms,gradientMap){
  const rng=random(hash('woodland-garden-06')),up=new THREE.Vector3(0,1,0),batches=new Map();
  const dir=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
  const roundBush=new THREE.SphereGeometry(1,8,5),petal=createSoftLeaf(8,.25),leaf=createSoftLeaf(8,.22),spray=createSoftLeaf(12,.17),pollen=createSoftLeaf(8,-.35);
  // Low-frequency lobes soften the volume without adding triangles. Keep the
  // smooth sphere normals, like a broad painted value under the leaf details.
  const bushPositions=roundBush.attributes.position;
  for(let i=0;i<bushPositions.count;i++){const x=bushPositions.getX(i),y=bushPositions.getY(i),z=bushPositions.getZ(i),lobe=1+.10*Math.sin(x*3.2+z*1.8)*Math.cos(y*3.8-z)+.045*Math.sin(z*6.2+y*2);bushPositions.setXYZ(i,x*lobe,y*lobe,z*lobe);}
  roundBush.computeBoundingSphere();
  const sphere=new THREE.IcosahedronGeometry(1,1),stem=new THREE.CylinderGeometry(.72,1,1,5,1,true),box=new THREE.BoxGeometry(1,1,1);
  const base=new THREE.Object3D(),local=new THREE.Object3D();
  const counts={flowers:0,shrubs:0,fencePosts:0,rocks:0};
  function add(kind,geo,n,p,s,color,turn=0,moving=false){
    if(!batches.has(kind))batches.set(kind,{geo,moving,matrices:[],colors:[]});
    base.position.copy(n).multiplyScalar(height(n));base.quaternion.setFromUnitVectors(up,n);base.updateMatrix();
    local.position.set(...p);if(Array.isArray(turn))local.rotation.set(...turn);else local.rotation.set(0,turn,0);local.scale.set(...s);local.updateMatrix();
    const b=batches.get(kind);b.matrices.push(new THREE.Matrix4().multiplyMatrices(base.matrix,local.matrix));b.colors.push(new THREE.Color(color));
  }
  const houseNormals=houses.map(h=>dir(h.lat,h.lon));
  function dry(n,clearance=.12){return !farmReserved(n,.035)&&!pondReserved(n,.5)&&height(n)>R+.105&&!houseNormals.some(h=>h.distanceTo(n)<Math.max(clearance,.19));}
  const greens=['#5d9066','#76a45a','#91b764','#b0c979','#a0bf6e'];
  // A continuous winding path; extra transverse vertices follow the globe.
  const positions=[],colors=[],indices=[];
  for(let i=0;i<=720;i++){
    const lon=i/720*Math.PI*2,width=.043+.006*Math.sin(lon*21)+.003*Math.sin(lon*57);
    for(let j=0;j<5;j++){
      const n=dir(pathLat(lon)+(j/4-.5)*width*2,lon),p=n.clone().multiplyScalar(height(n)+.0035);
      positions.push(...p.toArray());const edge=j===0||j===4;
      const c=new THREE.Color(edge?'#b4bf93':'#e2c8bd');c.multiplyScalar(.94+.06*Math.sin(lon*17+j));colors.push(c.r,c.g,c.b);
      if(i<720&&j<4){const a=i*5+j;indices.push(a,a+5,a+1,a+1,a+5,a+6);}
    }
  }
  const pathGeo=new THREE.BufferGeometry();pathGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));pathGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));pathGeo.setIndex(indices);pathGeo.computeVertexNormals();
  const path=new THREE.Mesh(pathGeo,new THREE.MeshToonMaterial({vertexColors:true,gradientMap,side:THREE.DoubleSide}));path.name='Winding earthen footpath';path.receiveShadow=true;planet.add(path);
  function shrub(n,size){
    counts.shrubs++;
    for(let k=0;k<5;k++){
      const a=k*2.399+counts.shrubs*.41,r=k<4?size*(.39+.12*Math.sin(a)):size*.08,y=k<4?size*(.25+.08*Math.sin(a*2)):size*.54;
      add('shrub leaves',roundBush,n,[Math.sin(a)*r,y,Math.cos(a)*r],[size*(.68+.08*Math.sin(a)),size*(.43+.05*Math.cos(a)),size*.68],greens[k<4?(k%3?1:0):2],a,true);
    }
    for(let j=0;j<30;j++){
      const y=1-(j+.5)/30*1.55,a=j*2.399+counts.shrubs*.61,r=Math.sqrt(1-y*y),nn=new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r),reach=1+.10*Math.sin(j*1.7+counts.shrubs);
      const e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up,nn));
      add('shrub leaf sprays',spray,n,[nn.x*size*.98*reach,size*(.32+nn.y*.57),nn.z*size*.92*reach],[size*(.18+.055*Math.sin(a)),size*.21,size*(.26+.05*Math.cos(a))],greens[y>.65?(j%3?2:3):y>0?1:0],[e.x+.18*Math.sin(a),e.y+.24*Math.cos(a*2),e.z],true);
    }
  }
  // Shrubs form banks beside the path, with gaps for house entrances.
  for(let i=0;i<145;i++){
    const lon=i*2.399,side=i%2?1:-1,n=dir(pathLat(lon)+side*(.105+rng()*.07),lon);
    if(dry(n,.18))shrub(n,.105+rng()*.095);
  }
  // Split-rail fences in short groups. Gates interrupt the ribbon naturally.
  for(let i=0;i<96;i++){
    if(i%8>2)continue;
    const lon=i/96*Math.PI*2,lat=pathLat(lon)+.087,n=dir(lat,lon);
    if(!dry(n,.2))continue;counts.fencePosts++;
    add('fence timber',box,n,[0,.117,0],[.031,.255,.032],'#a57b50',.12);
    add('fence caps',box,n,[0,.251,0],[.039,.014,.038],'#e1b87d');
    if(i%8===2)continue;
    const next=dir(pathLat(lon+Math.PI*2/96)+.087,lon+Math.PI*2/96);
    if(!dry(next,.2))continue;
    // Rails use world-space endpoints to follow curved terrain accurately.
    for(const lift of [.10,.20]){
      const a=n.clone().multiplyScalar(height(n)+lift),b=next.clone().multiplyScalar(height(next)+lift),delta=b.clone().sub(a);
      if(!batches.has('fence rails'))batches.set('fence rails',{geo:box,moving:false,matrices:[],colors:[]});
      const mat=new THREE.Matrix4().compose(a.add(b).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(up,delta.clone().normalize()),new THREE.Vector3(.019,delta.length()+.018,.025));
      batches.get('fence rails').matrices.push(mat);batches.get('fence rails').colors.push(new THREE.Color('#d3a471'));
    }
  }
  const petalColors=['#fff0e7','#f3f0da','#d2c4e9','#edb5cb','#eecfd3'];
  // Small, related color drifts sit inside the grass. Their varied stems and
  // slightly offset petals avoid a repeated, evenly spaced garden-bed look.
  for(let patch=0;patch<230;patch++){
    const lon=rng()*6.283,lat=patch<145?pathLat(lon)+(patch%2?1:-1)*(.055+rng()*.13):Math.asin(rng()*2-1);
    const c=dir(lat,lon);if(!dry(c,.14))continue;
    const q=new THREE.Quaternion().setFromUnitVectors(up,c);
    for(let k=0;k<9;k++){
      const a=k*2.399+patch*.73,r=Math.sqrt(rng())*.062,n=c.clone().add(new THREE.Vector3(Math.sin(a)*r,0,Math.cos(a)*r).applyQuaternion(q)).normalize();
      if(!dry(n)||Math.abs(Math.asin(n.y)-pathLat(Math.atan2(n.x,n.z)))<.047)continue;
      const h=.067+rng()*.078+(patch%7===0?.025:0),palette=petalColors[patch%5],bloom=.78+rng()*.44,turn=rng()*6.283;counts.flowers++;
      add('flower stems',stem,n,[0,h*.5,0],[.0022,h,.0022],'#527d51');
      for(let j=0;j<2;j++)add('flower leaves',leaf,n,[Math.sin(j*3+turn)*.014,h*(.27+j*.24),Math.cos(j*3+turn)*.014],[.015,.026,.033],'#7aa45e',[.28,j*3+turn,.22],true);
      for(let j=0;j<5;j++){const a=j*6.283/5+turn,offset=.011*bloom;add('wildflower petals',petal,n,[Math.sin(a)*offset,h+Math.sin(a*2)*.002,Math.cos(a)*offset],[.015*bloom,.023,.021*bloom],palette,[.10*Math.sin(a),a,.09*Math.cos(a)]);}
      add('pollen',pollen,n,[0,h+.004,0],[.0055*bloom,.004,.0055*bloom],'#d5aa52');
    }
  }
  // Angular mossy rocks soften the boundary between grass and sand.
  for(let i=0;i<420;i++){
    const n=dir(Math.asin(rng()*2-1),rng()*6.283),h=height(n);if(h<R+.025||h>R+.112||!dry(n,0)&&h>R+.105)continue;
    if(houseNormals.some(p=>p.distanceTo(n)<.16))continue;
    const s=.06+rng()*.09;counts.rocks++;
    add('shore boulders',sphere,n,[0,s*.32,0],[s,s*.65,s*.82],i%2?'#799389':'#9caa98',rng()*6.28);
    add('rock moss',sphere,n,[0,s*.77,0],[s*.82,s*.16,s*.68],'#79a05b',rng()*6.28);
  }
  const meshes=[],depths=[];
  for(const [name,b] of batches){
    const material=new THREE.MeshToonMaterial({color:'white',gradientMap,side:['wildflower petals','flower leaves','shrub leaf sprays','pollen'].includes(name)?THREE.DoubleSide:THREE.FrontSide});
    const im=new THREE.InstancedMesh(b.geo,material,b.matrices.length);im.name=name;
    b.matrices.forEach((m,i)=>{im.setMatrixAt(i,m);im.setColorAt(i,b.colors[i]);});im.castShadow=['fence timber','fence rails','shore boulders'].includes(name);im.receiveShadow=true;im.frustumCulled=false;
    if(b.moving){const depth=enhanceFoliage(material,uniforms);im.customDepthMaterial=depth;depths.push(depth);}
    if(name==='wildflower petals'){
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,uniforms);shader.vertexShader='varying vec2 vPetalUV;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPetalUV=uv;');
        shader.fragmentShader='uniform float uSnow;varying vec2 vPetalUV;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          float rim=smoothstep(.06,.47,length(vPetalUV-.5));
          diffuseColor.rgb*=mix(vec3(.87,.89,.94),vec3(1.06,1.04,.98),rim);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.87,.92,.86),uSnow*.58);
        `);
      };material.customProgramCacheKey=()=> 'painted-wildflower-petals-v1';
    }

    planet.add(im);meshes.push(im);
  }
  return{counts,path,meshes,dispose(){depths.forEach(d=>d.dispose());}};
}
