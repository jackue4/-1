import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {oceanWave} from './ocean.js';
const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;

export function createHarborProps({planet,surface,palette={}}){
 const {R,direction,height,trackLat}=surface,root=new THREE.Group();root.name='A fisher’s morning · moored dinghy and dock gear';planet.add(root);
 const material=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp??null,side:THREE.DoubleSide}),ropeMaterial=new THREE.MeshToonMaterial({color:'#b8b39a',gradientMap:palette.ramp??null});
 const geometries=[],meshes=[],dummy=new THREE.Object3D(),matrix=new THREE.Matrix4(),basis=new THREE.Matrix4(),normal=new THREE.Vector3(),east=new THREE.Vector3(),south=new THREE.Vector3();let timeNow=0;
 const staticParts=[],boatParts=[],identity=new THREE.Matrix4();
 function frame(lat,lon,r){const n=direction(lat,lon),e=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),s=new THREE.Vector3().crossVectors(e,n);return new THREE.Matrix4().makeBasis(e,n,s).setPosition(n.multiplyScalar(r));}
 function add(list,g,c,base=identity,p=[0,0,0],s=[1,1,1],r=[0,0,0]){if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}g.deleteAttribute('uv');const color=new THREE.Color(c),data=new Float32Array(g.attributes.position.count*3);for(let i=0;i<g.attributes.position.count;i++){data[i*3]=color.r;data[i*3+1]=color.g;data[i*3+2]=color.b;}g.setAttribute('color',new THREE.BufferAttribute(data,3));dummy.position.set(...p);dummy.rotation.set(...r);dummy.scale.set(...s);dummy.updateMatrix();g.applyMatrix4(matrix.multiplyMatrices(base,dummy.matrix));list.push(g);}
 const box=(list,c,b,p,s,r)=>add(list,new THREE.BoxGeometry(...s),c,b,p,[1,1,1],r),cyl=(list,c,b,p,rt,rb,h,n=8)=>add(list,new THREE.CylinderGeometry(rt,rb,h,n),c,b,p);
 function rod(list,c,b,a,z,r=.0015){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...z),g=new THREE.CylinderGeometry(r,r,p.distanceTo(q),5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,q.clone().sub(p).normalize()));g.translate(...p.add(q).multiplyScalar(.5).toArray());add(list,g,c,b);}
 function ring(list,c,b,p,r,t=.001){add(list,new THREE.TorusGeometry(r,t,4,16),c,b,p,[1,1,1],[Math.PI/2,0,0]);}
 function curve(list,c,b,points,r=.0007,segments=10){add(list,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,4,false),c,b);}
 function bake(parts,name){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeBoundingSphere();geometries.push(g);const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);meshes.push(mesh);return mesh;}

 const jettyLon=-.67;let shoreLat=.1;for(let i=0;i<90;i++){const lat=.1-i*.004;if(height(direction(lat,jettyLon))<R){shoreLat=lat+.004;break;}}
 const gearLat=shoreLat-.026,gear=frame(gearLat,jettyLon,R+.054),boatLat=shoreLat-.095,boatLon=jettyLon-.072,boatNormal=direction(boatLat,boatLon),boatDepth=R-height(boatNormal);
 if(boatDepth<.1||Math.abs(boatLat-trackLat(boatLon))<.14)throw Error('The fishing dinghy needs a clear, safe berth beside the dock');
 // A woven creel is hollow, with real wicker strips and a folded lid.
 const basket=[.045,.003,-.028],br=.021,bh=.035;
 cyl(staticParts,'#c5a36d',gear,[basket[0],.005,basket[2]],br*.84,br*.87,.004,10);
 for(let j=0;j<6;j++)ring(staticParts,j%2?'#d2b981':'#ac9468',gear,[basket[0],.007+j*.0055,basket[2]],br*(.88+j*.020),.0012);
 for(let j=0;j<14;j++){const a=j*TAU/14;rod(staticParts,'#c9ac76',gear,[basket[0]+Math.sin(a)*br*.86,.007,basket[2]+Math.cos(a)*br*.86],[basket[0]+Math.sin(a)*br,.037,basket[2]+Math.cos(a)*br],.0009);}
 ring(staticParts,'#947b56',gear,[basket[0],.039,basket[2]],br,.0017);box(staticParts,'#ceb482',gear,[basket[0]+.003,.044,basket[2]-.009],[.039,.003,.026],[.25,0,0]);
 curve(staticParts,'#847a5f',gear,[[.027,.030,-.028],[.032,.066,-.029],[.062,.066,-.029],[.066,.030,-.028]],.0013,9);
 // Two wooden buckets occupy the opposite side, leaving the walking axis clear.
 for(let j=0;j<2;j++){const x=-.047,z=.027+j*.041,r=j?.012:.016,h=j?.023:.029;
  cyl(staticParts,'#739b88',gear,[x,h*.5,z],r,r*.80,h,10);cyl(staticParts,'#4b7369',gear,[x,h+.0004,z],r*.76,r*.76,.001,10);
  for(const y of[h*.18,h*.84])ring(staticParts,'#bfc0a4',gear,[x,y,z],r*(.80+y/h*.20),.001);curve(staticParts,'#9bb3a2',gear,[[x-r*.92,h*.79,z],[x-r*.8,h*1.62,z],[x+r*.8,h*1.62,z],[x+r*.92,h*.79,z]],.0008,8);
 }
 // A small net hangs over the east edge, made from actual intersecting cords.
 for(let row=0;row<8;row++){const z=.054+row*.008;curve(staticParts,'#739e98',gear,[[.027,.004,z],[.066,.003,z],[.080,-.026,z+.004]],.00043,5);}
 for(let column=0;column<7;column++){const x=.028+column*.008,y=x<.071?.005:-.020;curve(staticParts,'#8cb2a3',gear,[[x,y,.054],[x+.002,y-.003,.079],[x,y,.110]],.00043,6);}
 for(let j=0;j<5;j++)add(staticParts,new THREE.SphereGeometry(1,7,5),j%2?'#f2d29b':'#d59070',gear,[.072,.003,.057+j*.012],[.0044,.006,.0044]);
 // A compact iron anchor rests against a mooring cleat near the basket.
 const ax=.046,az=-.083;rod(staticParts,'#657f77',gear,[ax,.008,az],[ax,.051,az],.002);rod(staticParts,'#657f77',gear,[ax-.017,.015,az],[ax+.017,.015,az],.002);rod(staticParts,'#657f77',gear,[ax-.017,.015,az],[ax-.022,.025,az],.002);rod(staticParts,'#657f77',gear,[ax+.017,.015,az],[ax+.022,.025,az],.002);add(staticParts,new THREE.TorusGeometry(.004,.0011,4,12),'#778a7d',gear,[ax,.055,az]);
 for(const z of[-.066,.09]){box(staticParts,'#aab09a',gear,[-.061,.006,z],[.022,.005,.006]);cyl(staticParts,'#789287',gear,[-.061,.003,z],.003,.003,.007,6);}
 bake(staticParts,'Wicker creel, buckets, hand-knotted net, floats and small anchor');

 // A true open dinghy, with a cream lip above an old green painted hull.
 const sides=20;
 function hullStrip(lower,upper,color){const p=[],idx=[];for(const [y,w,l]of[lower,upper])for(let i=0;i<sides;i++){const a=i/sides*TAU;p.push(Math.sin(a)*.051*(.89-.15*Math.cos(a))*w,y,Math.cos(a)*.139*l);}for(let i=0;i<sides;i++){const j=(i+1)%sides;idx.push(i,j,i+sides,j,j+sides,i+sides);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();add(boatParts,g,color);}
 hullStrip([-.030,.48,.77],[-.006,.85,.95],'#598f7d');hullStrip([-.006,.85,.95],[.027,1,1],'#e5dfbf');hullStrip([.027,1,1],[.024,.83,.96],'#b5a17d');hullStrip([.024,.83,.96],[-.020,.48,.79],'#b9ad8b');
 for(let j=0;j<5;j++)box(boatParts,j%2?'#b7a280':'#cdbb97',identity,[(j-2)*.010,-.018,0],[.009,.004,.207]);
 for(const z of[-.083,-.010,.065])box(boatParts,'#c6b18b',identity,[0,.020,z],[.079-Math.abs(z)*.17,.006,.025]);
 for(const side of[-1,1]){const points=[];for(let i=0;i<=15;i++){const a=i/15*Math.PI;points.push([side*Math.sin(a)*.051*(.89-.15*Math.cos(a)),.028,Math.cos(a)*.139]);}curve(boatParts,'#a58c69',identity,points,.0022,20);}
 // Two diagonal oars, including flattened spoon blades, lie across the seats.
 for(const side of[-1,1]){rod(boatParts,'#a58b63',identity,[-side*.040,.030,-.100],[side*.052,.033,.116],.0019);box(boatParts,'#c3ad82',identity,[side*.048,.034,.112],[.016,.0027,.047],[0,side*.34,0]);}
 box(boatParts,'#739c8c',identity,[-.013,.027,-.065],[.045,.013,.048],[.08,.10,0]);for(let j=0;j<4;j++)rod(boatParts,'#9cb7a1',identity,[-.033+j*.011,.035,-.088],[-.031+j*.011,.035,-.043],.0010);
 // A small open tool tray carries two silvery catches and a red-brown handle.
 box(boatParts,'#9f865f',identity,[.002,.005,.057],[.042,.003,.038]);for(const x of[-.020,.024])box(boatParts,'#b6a076',identity,[x,.014,.057],[.003,.019,.041]);for(const z of[.038,.076])box(boatParts,'#b6a076',identity,[.002,.014,z],[.046,.019,.003]);
 for(const side of[-1,1])add(boatParts,new THREE.SphereGeometry(1,8,5),'#bec9b5',identity,[side*.010,.012,.056],[.006,.004,.014],[0,side*.22,0]);rod(boatParts,'#bd7c64',identity,[.016,.019,.038],[.006,.023,.072],.0017);
 const boat=bake(boatParts,'Cream and weathered green fishing dinghy with oars and canvas');boat.frustumCulled=false;

 // Two soft mooring lines follow the rocking boat; they remain attached at
 // both ends rather than being static diagonals suspended beside the hull.
 const segments=12,radial=5,ropePositions=new Float32Array(2*(segments+1)*radial*3),ropeIndices=[];
 for(let line=0;line<2;line++)for(let j=0;j<segments;j++)for(let k=0;k<radial;k++){const a=line*(segments+1)*radial+j*radial+k,b=line*(segments+1)*radial+j*radial+(k+1)%radial;ropeIndices.push(a,b,a+radial,b,b+radial,a+radial);}
 const ropeGeo=new THREE.BufferGeometry();ropeGeo.setAttribute('position',new THREE.BufferAttribute(ropePositions,3).setUsage(THREE.DynamicDrawUsage));ropeGeo.setIndex(ropeIndices);geometries.push(ropeGeo);const ropes=new THREE.Mesh(ropeGeo,ropeMaterial);ropes.name='Two attached mooring lines';ropes.castShadow=true;ropes.receiveShadow=true;ropes.frustumCulled=false;root.add(ropes);meshes.push(ropes);
 const moorings=[frame(boatLat+.025,jettyLon,R+.065),frame(boatLat-.024,jettyLon,R+.065)].map(m=>new THREE.Vector3(-.060,0,0).applyMatrix4(m));
 const ropeEnd=new THREE.Vector3(),ropeDir=new THREE.Vector3(),ropeSide=new THREE.Vector3(),ropeNormal=new THREE.Vector3(),ropeP=new THREE.Vector3();
 function update(time,env={}){timeNow=Number.isFinite(time)?time:0;const n=direction(boatLat,boatLon),wave=oceanWave(n,timeNow);basis.copy(frame(boatLat,boatLon,R+wave+.002));basis.decompose(boat.position,boat.quaternion,boat.scale);boat.rotateY(.025*Math.sin(timeNow*.37));boat.rotateZ(.018*Math.sin(timeNow*.74+.5));boat.updateMatrix();
  for(let line=0;line<2;line++){const start=moorings[line];ropeEnd.set(.040,.029,line===0?-.083:.083).applyMatrix4(boat.matrix);ropeDir.subVectors(ropeEnd,start).normalize();ropeNormal.copy(start).normalize();ropeSide.crossVectors(ropeDir,ropeNormal).normalize();ropeNormal.crossVectors(ropeSide,ropeDir).normalize();for(let j=0;j<=segments;j++){const t=j/segments;ropeP.copy(start).lerp(ropeEnd,t).addScaledVector(ropeNormal,-Math.sin(t*Math.PI)*.024);for(let k=0;k<radial;k++){const a=k/radial*TAU,index=(line*(segments+1)*radial+j*radial+k)*3;ropePositions[index]=ropeP.x+(ropeSide.x*Math.cos(a)+ropeNormal.x*Math.sin(a))*.0012;ropePositions[index+1]=ropeP.y+(ropeSide.y*Math.cos(a)+ropeNormal.y*Math.sin(a))*.0012;ropePositions[index+2]=ropeP.z+(ropeSide.z*Math.cos(a)+ropeNormal.z*Math.sin(a))*.0012;}}}
  ropeGeo.attributes.position.needsUpdate=true;ropeGeo.computeVertexNormals();
 }
 update(0,{daylight:1});ropeGeo.computeBoundingSphere();const stats={mooredDinghies:1,oars:2,creels:1,buckets:2,fishingNets:1,floats:5,anchors:1,mooringLines:2,drawCalls:3,triangles:meshes.reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0),berth:{lat:boatLat,lon:boatLon,seabedDepth:boatDepth,railClearance:Math.abs(boatLat-trackLat(boatLon)),jettyEndLat:shoreLat-.18,gearLat},walkwayClearHalfWidth:.020};
 root.userData.boat=boat;root.userData.moorings=moorings;root.userData.berth=stats.berth;
 return{root,stats,update,getState(){return{time:timeNow,berth:stats.berth,boatPosition:boat.position.toArray(),boatQuaternion:boat.quaternion.toArray()};},dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());material.dispose();ropeMaterial.dispose();}};
}
