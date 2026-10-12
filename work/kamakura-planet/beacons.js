import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {oceanWave} from './ocean.js';
const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;

export function createBeacons({planet,surface,palette={}}){
 const {R,direction,height,trackLat}=surface,root=new THREE.Group();root.name='Four coastal beacons · irregular night watch';planet.add(root);
 const geometries=new Set(),materials=new Set(),parts=[],lights=[],dummy=new THREE.Object3D(),transform=new THREE.Matrix4();let elapsed=0,power=0;
 const solid=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp??null,side:THREE.DoubleSide}),lamp=new THREE.MeshToonMaterial({color:'#ffebbd',vertexColors:true,emissive:'#ffd08a',emissiveIntensity:.2,gradientMap:palette.ramp??null});materials.add(solid);materials.add(lamp);
 function frame(lat,lon,r){const n=direction(lat,lon),e=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),s=new THREE.Vector3().crossVectors(e,n);return new THREE.Matrix4().makeBasis(e,n,s).setPosition(n.multiplyScalar(r));}
 function add(list,g,color,base,p=[0,0,0],r=[0,0,0]){if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}g.deleteAttribute('uv');const c=new THREE.Color(color),v=g.attributes.position,colors=new Float32Array(v.count*3);for(let i=0;i<v.count;i++){colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));dummy.position.set(...p);dummy.rotation.set(...r);dummy.scale.setScalar(1);dummy.updateMatrix();g.applyMatrix4(transform.multiplyMatrices(base,dummy.matrix));list.push(g);}
 const box=(list,c,b,p,s,r)=>add(list,new THREE.BoxGeometry(...s),c,b,p,r),cyl=(list,c,b,p,rt,rb,h,n=10)=>add(list,new THREE.CylinderGeometry(rt,rb,h,n),c,b,p);
 function rod(c,b,a,z,r=.002){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...z),g=new THREE.CylinderGeometry(r,r,p.distanceTo(q),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,q.clone().sub(p).normalize()));g.translate(...p.add(q).multiplyScalar(.5).toArray());add(parts,g,c,b);}
 const sites=[
  {id:'old-reef',lat:-.56,lon:-.69,base:R-.018,lampY:.446,targetLat:-.83,targetLon:-.62,radius:.068,phase:.4,existing:true},
  {id:'east-bay',lat:-.22,lon:.70,targetLat:-.48,targetLon:.71,radius:.062,phase:2.0,style:0},
  {id:'west-cape',lat:.52,lon:-1.20,targetLat:.48,targetLon:-1.58,radius:.062,phase:3.9,style:1},
  {id:'far-coast',lat:.04,lon:-2.27,targetLat:-.27,targetLon:-2.26,radius:.073,phase:5.4,style:2}
 ];
 for(const s of sites){if(s.existing)continue;const ground=height(direction(s.lat,s.lon)),island=ground>R;s.base=island?ground+.008:R-.016;s.lampY=s.style===1?.42:s.style===2?.285:.35;s.ground=ground;
  if(!island&&R-ground<.08)throw Error('Beacon reef is too close to shore');if(Math.abs(s.lat-trackLat(s.lon))<.10)throw Error('Beacon intersects railway corridor');const base=frame(s.lat,s.lon,s.base);
  if(!island){cyl(parts,'#7a8581',base,[0,.028,0],.097,.138,.076,8);cyl(parts,'#9ca794',base,[0,.070,0],.092,.102,.016,8);}else cyl(parts,'#d8cbae',base,[0,.006,0],.115,.117,.013,10);
  const foot=island?.020:.08;
  if(s.style===0){cyl(parts,'#f4e5c3',base,[0,(foot+s.lampY-.04)/2,0],.032,.047,s.lampY-.04-foot,10);for(const y of[foot+.055,foot+.14])cyl(parts,'#96aaa0',base,[0,y,0],.041,.043,.030,10);}
  else if(s.style===1){cyl(parts,'#f5f1df',base,[0,(foot+s.lampY-.039)/2,0],.044,.068,s.lampY-.039-foot,16);cyl(parts,'#d6d9c6',base,[0,foot+.008,0],.077,.082,.016,16);for(const y of[.115,.223]){box(parts,'#4f7b79',base,[0,y,.055],[.017,.039,.005]);box(parts,'#faf4df',base,[0,y+.023,.055],[.024,.007,.008]);}cyl(parts,'#f8f4e5',base,[0,s.lampY-.061,0],.072,.050,.030,16);}
  else{box(parts,'#ede2c8',base,[0,(foot+s.lampY-.04)/2,0],[.065,s.lampY-.04-foot,.065]);box(parts,'#cba185',base,[0,foot+.068,0],[.068,.026,.068]);}
  cyl(parts,'#658677',base,[0,s.lampY-.035,0],.061,.061,.012,12);cyl(lights,s.style===1?'#ff9660':'#ffffff',base,[0,s.lampY,0],.032,.032,.046,12);
  for(let j=0;j<8;j++){const a=j*TAU/8,x=Math.cos(a)*.042,z=Math.sin(a)*.042;rod('#536f65',base,[x,s.lampY-.032,z],[x,s.lampY+.032,z],.0022);rod('#819b88',base,[x*1.42,s.lampY-.026,z*1.42],[x*1.42,s.lampY-.005,z*1.42],.0016);}
  const ring=new THREE.TorusGeometry(.060,.0017,4,16);add(parts,ring,'#789585',base,[0,s.lampY-.005,0],[Math.PI/2,0,0]);cyl(parts,'#b56e59',base,[0,s.lampY+.043,0],.004,.068,.036,12);rod('#658174',base,[0,s.lampY+.05,0],[0,s.lampY+.09,0],.0018);
  box(parts,'#516d67',base,[0,foot+.034,s.style===1?.064:.047],[.021,.043,.004]);if(s.style===1)cyl(lights,'#ff663d',base,[0,s.lampY+.097,0],.006,.006,.014,8);
 }
 function bake(list,material,name){const geometry=mergeGeometries(list,false);list.forEach(g=>g.dispose());geometries.add(geometry);geometry.computeBoundingSphere();const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=m.receiveShadow=true;root.add(m);return m;}
 const towers=bake(parts,solid,'Three distinct coastal watchtowers'),lamps=bake(lights,lamp,'Three amber lighthouse lantern rooms');
 const plane=new THREE.PlaneGeometry(2,1,1,1);plane.translate(0,.5,0);geometries.add(plane);
 const beams=sites.map(s=>({source:direction(s.lat,s.lon).multiplyScalar(s.base+s.lampY),target:new THREE.Vector3(),power:0,cosInner:Math.cos(.065),cosOuter:Math.cos(.145)}));
 const cones=sites.map((site,i)=>{const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uSource:{value:beams[i].source},uTarget:{value:beams[i].target},uPower:{value:0}},vertexShader:`uniform vec3 uSource;uniform vec3 uTarget;varying vec2 vBeamUv;
 void main(){vBeamUv=uv;vec3 start=(modelMatrix*vec4(uSource,1.)).xyz,end=(modelMatrix*vec4(uTarget,1.)).xyz,axis=normalize(end-start),right=normalize(cross(axis,normalize(cameraPosition-start)));float t=position.y;vec3 world=start+(end-start)*t+right*position.x*(.008+distance(start,end)*.145*t);gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,fragmentShader:`uniform float uPower;varying vec2 vBeamUv;void main(){float across=pow(max(0.,1.-abs(vBeamUv.x*2.-1.)),2.2),along=smoothstep(0.,.045,vBeamUv.y)*(1.-smoothstep(.75,1.,vBeamUv.y));gl_FragColor=vec4(1.,.80,.45,across*along*uPower*.145);}`});materials.add(material);const mesh=new THREE.Mesh(plane,material);mesh.name=`Soft finite beam · ${site.id}`;mesh.renderOrder=11;mesh.frustumCulled=false;root.add(mesh);return mesh;});
 function targetAt(site,t,out){const a=t*(.20+site.phase*.009)+.56*Math.sin(t*.071+site.phase)+.25*Math.sin(t*.193+site.phase*1.7),lat=site.targetLat+Math.sin(a)*site.radius,lon=site.targetLon+Math.cos(a)*site.radius*1.28;out.copy(direction(lat,lon));return out;}
 // Validate the complete sweep envelopes before exposing any illuminated target.
 for(const site of sites)for(let i=0;i<256;i++){const a=i/256*TAU,n=direction(site.targetLat+Math.sin(a)*site.radius,site.targetLon+Math.cos(a)*site.radius*1.28);if(height(n)>R-.03)throw Error(`Beacon ${site.id} would sweep dry land`);}
 function update(time,env={}){elapsed=Number.isFinite(time)?time:0;const amount=THREE.MathUtils.clamp(env.night??1-(env.daylight??1),0,1);power=THREE.MathUtils.smoothstep(amount,.10,.85);lamp.emissiveIntensity=power*3;sites.forEach((site,i)=>{const beam=beams[i];targetAt(site,elapsed,beam.target);beam.target.multiplyScalar(R+oceanWave(beam.target,elapsed)+.002);beam.power=power*(.80+i*.035);cones[i].material.uniforms.uPower.value=beam.power;cones[i].visible=power>.001;});}
 update(0,{daylight:1,night:0});const stats={newLighthouses:3,totalBeacons:4,visibleCones:4,drawCalls:6,triangles:(towers.geometry.attributes.position.count+lamps.geometry.attributes.position.count)/3+8,sites:sites.map(s=>({id:s.id,lat:s.lat,lon:s.lon,existing:!!s.existing,baseRadius:s.base,lampRadius:s.base+s.lampY,terrainRadius:height(direction(s.lat,s.lon)),railClearance:Math.abs(s.lat-trackLat(s.lon))}))};
 return{root,stats,update,getBeams(){return beams;},getState(){return{time:elapsed,power,beams:beams.map((b,i)=>({id:sites[i].id,source:b.source.toArray(),target:b.target.toArray(),power:b.power,waterDepth:R-height(b.target.clone().normalize()),length:b.source.distanceTo(b.target)}))};},dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
