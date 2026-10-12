import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {oceanWave} from './ocean.js';

const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;

// Three quiet destinations on the water: a lamplit jetty, two sailing boats,
// and a small lighthouse reef. All seagoing paths are checked against terrain.
export function createVoyage({planet,surface,palette={}}){
 const {R,direction,height,trackLat}=surface,root=new THREE.Group();root.name='Letters from the sea · jetty, white sails and lighthouse';planet.add(root);
 const ownedGeometries=new Set(),ownedMaterials=new Set(),staticPieces=[],lampPieces=[],placements=[],boatPositions=[],lanternPositions=[],meshes=[];
 const dummy=new THREE.Object3D(),matrix=new THREE.Matrix4(),basis=new THREE.Matrix4(),normal=new THREE.Vector3(),east=new THREE.Vector3(),south=new THREE.Vector3();let elapsed=0,night=0;
 const solid=new THREE.MeshToonMaterial({color:'white',vertexColors:true,gradientMap:palette.ramp??null,side:THREE.DoubleSide}),warm=new THREE.MeshToonMaterial({color:'#fff0c9',emissive:'#ffc978',emissiveIntensity:.24,gradientMap:palette.ramp??null,side:THREE.DoubleSide});ownedMaterials.add(solid);ownedMaterials.add(warm);
 const C={wood:'#a79073',end:'#c5b28d',dark:'#536e62',cream:'#f6e8c9',sail:'#fff3d9',blue:'#799fa2',grass:'#91ae76',stone:'#b6bda9'};
 function frame(lat,lon,radius=R){const n=direction(lat,lon),e=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),s=new THREE.Vector3().crossVectors(e,n).normalize();return new THREE.Matrix4().makeBasis(e,n,s).setPosition(n.multiplyScalar(radius));}
 function colorGeometry(geometry,color){const p=geometry.attributes.position,c=new THREE.Color(color),data=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){data[i*3]=c.r;data[i*3+1]=c.g;data[i*3+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(data,3));return geometry;}
 function add(parts,geometry,color,base=new THREE.Matrix4(),p=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){if(geometry.index){const g=geometry.toNonIndexed();geometry.dispose();geometry=g;}geometry.deleteAttribute('uv');colorGeometry(geometry,color);dummy.position.set(...p);dummy.rotation.set(...rotation);dummy.scale.set(...scale);dummy.updateMatrix();geometry.applyMatrix4(matrix.multiplyMatrices(base,dummy.matrix));parts.push(geometry);}
 function box(parts,color,base,p,s,r=[0,0,0]){add(parts,new THREE.BoxGeometry(...s),color,base,p,r);}
 function cylinder(parts,color,base,p,rt,rb,h,sides=10,rotation=[0,0,0]){add(parts,new THREE.CylinderGeometry(rt,rb,h,sides),color,base,p,rotation);}
 function rod(parts,color,base,a,b,r=.0025,sides=6){const x=new THREE.Vector3(...a),y=new THREE.Vector3(...b),g=new THREE.CylinderGeometry(r*.8,r,x.distanceTo(y),sides);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,y.clone().sub(x).normalize()));g.translate(...x.add(y).multiplyScalar(.5).toArray());add(parts,g,color,base);}
 function bake(parts,name,material=solid,instances=0){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingSphere();ownedGeometries.add(geometry);const mesh=instances?new THREE.InstancedMesh(geometry,material,instances):new THREE.Mesh(geometry,material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);meshes.push(mesh);return mesh;}
 function safeWater(lat,lon,margin=.08){const n=direction(lat,lon);return R-height(n)>margin&&Math.abs(lat-trackLat(lon))>.1;}
 function record(type,lat,lon){const n=direction(lat,lon),p={type,lat,lon,seabedDepth:R-height(n),railAngularClearance:Math.abs(lat-trackLat(lon))};placements.push(p);return p;}
 function requireWater(type,lat,lon){if(!safeWater(lat,lon))throw new Error(`${type} must stay offshore and clear of the railway`);return record(type,lat,lon);}

 // The narrow landing follows the curvature of the shore instead of hovering
 // as one long flat rectangle. Its warm timber quietly contrasts the blue sea.
 const jettyLon=-.67;let shoreLat=.10;
 for(let i=0;i<90;i++){const lat=.10-i*.004;if(height(direction(lat,jettyLon))<R){shoreLat=lat+.004;break;}}
 const jettyEnd=shoreLat-.18,planks=28;
 for(let i=0;i<planks;i++){const lat=shoreLat+.020-i/(planks-1)*.20,n=direction(lat,jettyLon),r=Math.max(R+.045,height(n)+.018),base=frame(lat,jettyLon,r);box(staticPieces,i%5?C.wood:C.end,base,[0,0,0],[.148,.014,.020]);
  if(i%5===1){for(const side of[-1,1]){const bed=height(n),h=Math.min(.40,r-bed+.025);cylinder(staticPieces,C.dark,base,[side*.062,-h/2,0],.006,.008,h,7);cylinder(staticPieces,C.end,base,[side*.074,.043,0],.005,.006,.09,7);}}
 }
 const end=frame(jettyEnd,jettyLon,R+.046);
 for(let j=0;j<10;j++)box(staticPieces,j%3?C.wood:C.end,end,[0,.001,(j-4.5)*.018],[.286,.015,.0165]);
 for(const side of[-1,1]){box(staticPieces,C.dark,end,[side*.12,.044,-.005],[.004,.004,.18]);for(const z of[-.086,.076])cylinder(staticPieces,C.end,end,[side*.12,.043,z],.005,.006,.087,7);
  const x=side*.073;box(staticPieces,C.end,end,[x,.050,.009],[.087,.008,.037]);box(staticPieces,C.wood,end,[x,.075,-.010],[.087,.043,.006],[.10,0,0]);for(const dx of[-.031,.031]){box(staticPieces,C.dark,end,[x+dx,.027,.010],[.006,.042,.026]);box(staticPieces,C.dark,end,[x+dx,.069,.014],[.004,.004,.047]);}
  cylinder(staticPieces,C.dark,end,[side*.119,.123,-.072],.004,.006,.246,8);cylinder(staticPieces,C.dark,end,[side*.119,.261,-.072],.019,.020,.010,8);cylinder(lampPieces,'#ffffff',end,[side*.119,.238,-.072],.011,.013,.035,8);cylinder(staticPieces,C.dark,end,[side*.119,.268,-.072],0,.028,.020,8);
 }
 // A little mooring ladder and two tied rope loops.
 for(const x of[-.028,.028])rod(staticPieces,C.end,end,[x,.023,.095],[x,-.118,.117],.003);for(let j=0;j<4;j++)rod(staticPieces,C.end,end,[-.028,-.017-j*.027,.105+j*.003],[.028,-.017-j*.027,.105+j*.003],.0025);
 for(const side of[-1,1]){const loop=new THREE.TorusGeometry(.012,.0017,4,12);add(staticPieces,loop,'#d4c5a5',end,[side*.13,.013,.073],[Math.PI/2,0,0]);}
 record('jetty landing',jettyEnd,jettyLon);

 // A small stepped reef, with an octagonal keeper's tower and glazed lantern.
 const lighthouse={lat:-.56,lon:-.69};requireWater('lighthouse reef',lighthouse.lat,lighthouse.lon);const reef=frame(lighthouse.lat,lighthouse.lon,R-.018);
 for(let tier=0;tier<3;tier++){const g=new THREE.CylinderGeometry(.18-tier*.029,.195-tier*.027,.057,9),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=1+.065*Math.sin(Math.atan2(z,x)*5+tier);p.setXYZ(i,x*r,p.getY(i),z*r);}g.computeVertexNormals();add(staticPieces,g,tier===2?'#c8c5a6':C.stone,reef,[0,tier*.043,0],[0,tier*.32,0]);}
 cylinder(staticPieces,C.grass,reef,[0,.112,0],.111,.140,.018,9);cylinder(staticPieces,C.cream,reef,[0,.261,0],.035,.048,.30,10);cylinder(staticPieces,'#779487',reef,[0,.143,0],.047,.048,.016,10);cylinder(staticPieces,'#779487',reef,[0,.290,0],.039,.040,.035,10);
 for(const y of[.215,.339]){box(staticPieces,'#536f7a',reef,[0,y,.040],[.014,.026,.003]);box(staticPieces,C.end,reef,[0,y+.015,.041],[.019,.003,.004]);}
 box(staticPieces,C.dark,reef,[0,.162,.048],[.025,.056,.006]);box(staticPieces,C.end,reef,[0,.126,.057],[.039,.008,.026]);
 cylinder(staticPieces,C.dark,reef,[0,.416,0],.057,.057,.012,12);cylinder(lampPieces,'#ffffff',reef,[0,.446,0],.031,.031,.047,12);
 for(let j=0;j<8;j++){const a=j*TAU/8,x=Math.cos(a)*.043,z=Math.sin(a)*.043;rod(staticPieces,C.dark,reef,[x,.419,z],[x,.476,z],.0021);rod(staticPieces,C.end,reef,[x*1.31,.422,z*1.31],[x*1.31,.445,z*1.31],.0016);}
 const railRing=new THREE.TorusGeometry(.056,.0018,4,16);add(staticPieces,railRing,C.end,reef,[0,.446,0],[Math.PI/2,0,0]);cylinder(staticPieces,C.dark,reef,[0,.483,0],.060,.061,.008,12);cylinder(staticPieces,C.dark,reef,[0,.503,0],0,.067,.035,12);rod(staticPieces,C.dark,reef,[0,.515,0],[0,.548,0],.0018);box(staticPieces,C.end,reef,[.013,.539,0],[.026,.009,.002]);
 for(let j=0;j<7;j++){const a=2.2+j*.26;box(staticPieces,'#d6d0b8',reef,[Math.sin(a)*.115,.126,Math.cos(a)*.115],[.027,.007,.024],[0,-a,0]);}
 bake(staticPieces,'Curved timber jetty, two benches and lighthouse reef');const staticLamps=bake(lampPieces,'Warm jetty lamps and lighthouse beacon',warm);

 // A pointed planked hull, cabin, boom, spars, and two billowing cloth sails.
 function sailGeometry(side){const p=[],idx=[],segments=7;for(let row=0;row<=segments;row++){const t=row/segments,y=.11+t*.27,width=(1-t)*(side>0?.174:.110),z=side>0?-.008-width:.010+width;for(let j=0;j<=segments-row;j++){const f=(segments-row)?j/(segments-row):0;p.push(Math.sin(f*Math.PI)*Math.sin(t*Math.PI)*.037,y,z+(side>0?width:-width)*f);}}
  let start=0;for(let row=0;row<segments;row++){const n=segments-row+1,next=start+n;for(let j=0;j<n-1;j++){idx.push(start+j,next+j,start+j+1);if(j<n-2)idx.push(start+j+1,next+j,next+j+1);}start=next;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;}
 function boatGeometry(){const parts=[],base=new THREE.Matrix4(),p=[],idx=[],sides=20;
  for(let ring=0;ring<3;ring++)for(let i=0;i<sides;i++){const a=i/sides*TAU,z=Math.cos(a)*.181,x=Math.sin(a)*.061*(.86-.16*Math.cos(a)),width=ring===0?.48:ring===1?.88:1;p.push(x*width,[-.034,-.009,.035][ring],z*(ring===0?.76:1));}
  for(let ring=0;ring<2;ring++)for(let j=0;j<sides;j++){const a=ring*sides+j,b=ring*sides+(j+1)%sides;idx.push(a,b,a+sides,b,b+sides,a+sides);}const hull=new THREE.BufferGeometry();hull.setAttribute('position',new THREE.Float32BufferAttribute(p,3));hull.setIndex(idx);hull.computeVertexNormals();add(parts,hull,C.cream);
  const deck=new THREE.Shape();for(let i=0;i<=sides;i++){const a=i/sides*TAU,x=Math.sin(a)*.061*(.86-.16*Math.cos(a)),z=Math.cos(a)*.181;if(!i)deck.moveTo(x,z);else deck.lineTo(x,z);}const deckGeo=new THREE.ShapeGeometry(deck);deckGeo.rotateX(Math.PI/2);add(parts,deckGeo,'#d5c5a2',base,[0,.036,0]);
  for(const side of[-1,1]){const points=[];for(let j=0;j<=16;j++){const a=j/16*Math.PI;points.push(new THREE.Vector3(side*Math.sin(a)*.061*(.86-.16*Math.cos(a)),.040,Math.cos(a)*.181));}add(parts,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.0028,5,false),C.end);}
  box(parts,C.cream,base,[0,.062,-.058],[.059,.050,.071]);box(parts,C.dark,base,[0,.089,-.058],[.066,.007,.080]);for(const side of[-1,1])box(parts,C.blue,base,[side*.030,.066,-.058],[.0015,.024,.044]);box(parts,C.blue,base,[0,.066,-.021],[.043,.023,.0015]);
  for(const side of[-1,1])for(const z of[-.135,.110]){rod(parts,C.dark,base,[side*.036,.042,z],[side*.036,.066,z],.0013,5);}
  rod(parts,C.dark,base,[0,.034,.016],[0,.415,.016],.0033,7);rod(parts,C.dark,base,[0,.107,.016],[0,.107,-.175],.0028,6);rod(parts,'#d3cbb2',base,[0,.401,.016],[0,.046,.159],.0012,4);rod(parts,'#d3cbb2',base,[0,.401,.016],[0,.045,-.159],.0012,4);
  add(parts,sailGeometry(1),C.sail);add(parts,sailGeometry(-1),'#f0e1bd');box(parts,'#bd8675',base,[.012,.405,.017],[.028,.017,.0015]);
  return parts;
 }
 const boatSpecs=[{lat:-.36,lon:-.28,phase:.1,scale:1.15},{lat:-.41,lon:.16,phase:2.7,scale:.88}],boats=bake(boatGeometry(),'Two cream sailing boats with full rigging',solid,2);
 boatSpecs.forEach(b=>requireWater('sailboat route centre',b.lat,b.lon));
 function boatRoute(index,t){const b=boatSpecs[index],a=t*.021+b.phase,lat=b.lat+Math.sin(a)*.018,lon=b.lon+Math.cos(a)*.025;if(!safeWater(lat,lon,.11))return{lat:b.lat,lon:b.lon};return{lat,lon};}
 function seaPose(lat,lon,t,scale=1,yaw=0,heightOffset=0){normal.copy(direction(lat,lon));east.set(Math.cos(lon),0,-Math.sin(lon));south.crossVectors(east,normal).normalize();basis.makeBasis(east,normal,south);dummy.position.copy(normal).multiplyScalar(R+oceanWave(normal,t)+heightOffset);dummy.quaternion.setFromRotationMatrix(basis);dummy.rotateY(yaw);dummy.scale.setScalar(scale);dummy.updateMatrix();return dummy.matrix;}

 // Small paper water lanterns form one loose crescent, never a uniform carpet.
 const lanternSpecs=[];for(let i=0;i<11;i++){const a=-.9+i*.15,lat=-.32-.12*Math.cos(a),lon=-.64+i*.062+.014*Math.sin(a*2);requireWater('water lantern',lat,lon);lanternSpecs.push({lat,lon,phase:i*1.71});}
 const lanternParts=[],paperParts=[],identity=new THREE.Matrix4();box(lanternParts,C.end,identity,[0,.009,0],[.044,.016,.044]);box(lanternParts,'#c2aa80',identity,[0,.018,0],[.051,.004,.051]);box(paperParts,'#ffffff',identity,[0,.044,0],[.033,.045,.033]);for(const x of[-.018,.018])for(const z of[-.018,.018])rod(lanternParts,C.dark,identity,[x,.020,z],[x,.070,z],.0014,4);box(lanternParts,C.end,identity,[0,.070,0],[.043,.004,.043]);
 const lanterns=bake(lanternParts,'Eleven floating cedar lantern frames',solid,11),papers=bake(paperParts,'Warm rice-paper water lights',warm,11);lanterns.castShadow=false;papers.castShadow=false;
 const glowMaterial=new THREE.ShaderMaterial({uniforms:{uOpacity:{value:.05}},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;vec4 p=instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*p;}',fragmentShader:'uniform float uOpacity;varying vec2 vUv;void main(){float a=pow(1.-smoothstep(.02,.5,length(vUv-.5)),2.);gl_FragColor=vec4(.9,.48,.16,a*uOpacity);}' });ownedMaterials.add(glowMaterial);
 const glowGeo=new THREE.PlaneGeometry(.155,.155);glowGeo.rotateX(-Math.PI/2);ownedGeometries.add(glowGeo);const glows=new THREE.InstancedMesh(glowGeo,glowMaterial,11);glows.name='Small warm reflections under the paper lanterns';glows.renderOrder=12;glows.frustumCulled=false;root.add(glows);meshes.push(glows);

 // A very thin broken wake gives the sails direction without painting stripes
 // across the entire bay. Its geometry is reprojected onto the moving sea.
 const wakePositions=new Float32Array(2*2*19*2*3),wakeIndices=[];for(let boat=0;boat<2;boat++)for(let side=0;side<2;side++)for(let i=0;i<18;i++){if(i%5===4)continue;const a=(boat*2+side)*38+i*2;wakeIndices.push(a,a+1,a+2,a+1,a+3,a+2);}const wakeGeo=new THREE.BufferGeometry();wakeGeo.setAttribute('position',new THREE.BufferAttribute(wakePositions,3).setUsage(THREE.DynamicDrawUsage));wakeGeo.setIndex(wakeIndices);ownedGeometries.add(wakeGeo);const wakeMaterial=new THREE.MeshBasicMaterial({color:'#d9ead1',transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide});ownedMaterials.add(wakeMaterial);const wakes=new THREE.Mesh(wakeGeo,wakeMaterial);wakes.name='Two delicate broken sailing wakes';wakes.renderOrder=12;wakes.frustumCulled=false;root.add(wakes);meshes.push(wakes);

 // Curved wings have visible thickness and a dark tip; all birds travel east.
 const birdParts=[],bp=[],bi=[];
 for(const side of[-1,1]){const off=bp.length/3;for(let j=0;j<=5;j++){const t=j/5,x=side*t*.064,y=Math.sin(t*Math.PI)*.018,z=t*.011,width=.014*(1-t)+.002;bp.push(x,y,z-width,x,y+.001,z+width);}for(let j=0;j<5;j++){const k=off+j*2;bi.push(k,k+2,k+1,k+1,k+2,k+3);}}
 const wing=new THREE.BufferGeometry();wing.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));wing.setIndex(bi);wing.computeVertexNormals();add(birdParts,wing,'#fff5db');add(birdParts,new THREE.SphereGeometry(1,8,5),'#eee9d6',identity,[0,0,0],[0,0,0],[.009,.011,.028]);cylinder(birdParts,'#d7b987',identity,[0,0,-.030],0,.003,.012,5,[Math.PI/2,0,0]);const birds=bake(birdParts,'White seabirds moving together across the bay',solid,12);birds.castShadow=false;birds.receiveShadow=false;
 const birdSpecs=Array.from({length:12},(_,i)=>({lat:-.48+(i%3)*.028,lon:-.61+i*.030,phase:i*.72,scale:.62+i%3*.15}));
 const wakePoint=new THREE.Vector3();
 function update(dt,time,env={}){elapsed=Number.isFinite(time)?time:0;night=THREE.MathUtils.clamp(env.night??1-(env.daylight??1),0,1);warm.emissiveIntensity=.22+night*2.4;glowMaterial.uniforms.uOpacity.value=.018+night*.34;wakeMaterial.opacity=.24-night*.13;
  boatSpecs.forEach((b,i)=>{const route=boatRoute(i,elapsed),next=boatRoute(i,elapsed+1),yaw=Math.atan2((next.lon-route.lon)*Math.cos(route.lat),-(next.lat-route.lat));boats.setMatrixAt(i,seaPose(route.lat,route.lon,elapsed,b.scale,yaw));boats.getMatrixAt(i,matrix);boatPositions[i]={lat:route.lat,lon:route.lon,position:new THREE.Vector3().setFromMatrixPosition(matrix).toArray(),seabedDepth:R-height(direction(route.lat,route.lon)),railAngularClearance:Math.abs(route.lat-trackLat(route.lon))};
   for(let side=0;side<2;side++)for(let k=0;k<=18;k++){const t=k/18,z=-.18-t*.32,width=.014+t*.060,edge=.0025*(1-t*.75);for(let j=0;j<2;j++){wakePoint.set((side?1:-1)*(width+(j?edge:0)),0,z).applyMatrix4(matrix);normal.copy(wakePoint).normalize();wakePoint.copy(normal).multiplyScalar(R+oceanWave(normal,elapsed)+.004);const index=((i*2+side)*38+k*2+j)*3;wakePositions.set(wakePoint.toArray(),index);}}
  });boats.instanceMatrix.needsUpdate=true;boats.frustumCulled=false;wakeGeo.attributes.position.needsUpdate=true;
  lanternSpecs.forEach((l,i)=>{const lat=l.lat+Math.sin(elapsed*.025+l.phase)*.003,lon=l.lon+Math.cos(elapsed*.020+l.phase)*.004;const m=seaPose(lat,lon,elapsed,1,.3*Math.sin(elapsed*.1+l.phase),.002);lanterns.setMatrixAt(i,m);papers.setMatrixAt(i,m);glows.setMatrixAt(i,seaPose(lat,lon,elapsed,1,0,.004));lanternPositions[i]={lat,lon,seabedDepth:R-height(direction(lat,lon)),railAngularClearance:Math.abs(lat-trackLat(lon))};});for(const mesh of[lanterns,papers,glows]){mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;}
  birdSpecs.forEach((b,i)=>{const lon=b.lon+(elapsed*.010)%TAU,lat=b.lat+Math.sin(elapsed*.25+b.phase)*.018;birds.setMatrixAt(i,seaPose(lat,lon,elapsed,b.scale,-Math.PI/2,.28+.035*Math.sin(elapsed*.53+b.phase)));});birds.instanceMatrix.needsUpdate=true;birds.frustumCulled=false;
 }
 update(0,0,{daylight:1,night:0});root.updateMatrixWorld(true);
 for(const mesh of meshes)if(mesh.isInstancedMesh)mesh.computeBoundingSphere();wakeGeo.computeBoundingSphere();
 const stats={focalScenes:3,jettyPlanks:planks,benches:2,jettyLamps:2,sailboats:2,lighthouses:1,waterLanterns:11,seabirds:12,drawCalls:meshes.length,triangles:meshes.reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.attributes.position.count)/3*(m.isInstancedMesh?m.count:1),0),placements};
 root.userData.voyage=stats;root.userData.boatRoute=boatRoute;
 return{root,stats,update,getState(){return{time:elapsed,night,boats:boatPositions.map(p=>({...p})),lanterns:lanternPositions.map(p=>({...p})),placements,emissiveIntensity:warm.emissiveIntensity};},dispose(){root.removeFromParent();for(const mesh of meshes)mesh.dispose?.();ownedGeometries.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());}};
}
