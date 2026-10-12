import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;

// Two composed still lifes. Every ground prop is placed against the live terrain;
// the only moving geometry is the lower edge of three garments on their line.
export function createShoreLife({planet,surface,palette={},town,landmarks}){
 const {R,direction,height,trackLat}=surface,root=new THREE.Group();root.name='Salt, postcards and a quiet beach';planet.add(root);
 const parts={solid:[],glass:[],cloth:[]},meshes=[],geometries=new Set(),materials=new Set(),placements=[],features=[];
 const solid=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp??null,side:THREE.DoubleSide});
 const glass=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp??null,transparent:true,opacity:.23,depthWrite:false,side:THREE.DoubleSide});
 const fabric=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp??null,side:THREE.DoubleSide});
 materials.add(solid);materials.add(glass);materials.add(fabric);
 const C={wood:'#947957',paleWood:'#c0a47d',darkWood:'#685c48',ivory:'#eee0be',teal:'#70958b',dark:'#415c59',rust:'#b18161',red:'#bb6755',green:'#548468',leaf:'#789455',cream:'#edcf8e',sand:'#d4b274',wet:'#b29567',glass:'#90bcb0',iron:'#697971',blue:'#7eabb8',linen:'#e4dabc'};
 const scratch=new THREE.Object3D(),matrix=new THREE.Matrix4();let elapsed=0,disposed=false;
 function frame(lat,lon,r){const n=direction(lat,lon),e=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),s=new THREE.Vector3().crossVectors(e,n);return new THREE.Matrix4().makeBasis(e,n,s).setPosition(n.multiplyScalar(r??height(n)));}
 function offset(lat,lon,x,z){const n=new THREE.Vector3(x,0,z).applyMatrix4(frame(lat,lon)).normalize();return[Math.asin(n.y),Math.atan2(n.x,n.z)];}
 function add(g,color,base,p=[0,0,0],rot=[0,0,0],scale=[1,1,1],batch='solid'){
  if(g.index){const raw=g.toNonIndexed();g.dispose();g=raw;}g.deleteAttribute('uv');
  const rgb=new THREE.Color(color),data=new Float32Array(g.attributes.position.count*3);for(let i=0;i<data.length;i+=3){data[i]=rgb.r;data[i+1]=rgb.g;data[i+2]=rgb.b;}g.setAttribute('color',new THREE.BufferAttribute(data,3));
  scratch.position.set(...p);scratch.rotation.set(...rot);scratch.scale.set(...scale);scratch.updateMatrix();g.applyMatrix4(matrix.multiplyMatrices(base,scratch.matrix));parts[batch].push(g);
 }
 const box=(color,b,p,size,rot=[0,0,0],batch='solid')=>add(new THREE.BoxGeometry(...size),color,b,p,rot,[1,1,1],batch);
 const globe=(color,b,p,size,rot=[0,0,0],batch='solid')=>add(new THREE.SphereGeometry(1,8,5),color,b,p,rot,size,batch);
 const cylinder=(color,b,p,rt,rb,h,sides=8,rot=[0,0,0])=>add(new THREE.CylinderGeometry(rt,rb,h,sides),color,b,p,rot);
 function rod(color,b,a,z,r=.0016,sides=5){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...z),g=new THREE.CylinderGeometry(r,r,p.distanceTo(q),sides);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,q.clone().sub(p).normalize()));g.translate(...p.add(q).multiplyScalar(.5).toArray());add(g,color,b);}
 function curve(color,b,points,r=.001,segments=12,sides=4){add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,sides,false),color,b);}
 function ring(color,b,p,r,t=.0015,rot=[0,0,0]){add(new THREE.TorusGeometry(r,t,5,20),color,b,p,rot);}
 function register(name,group,lat,lon,w,d,yaw=0){
  const n=direction(lat,lon),ground=frame(lat,lon),turn=new THREE.Matrix4().makeRotationY(yaw),initial=ground.clone().multiply(turn),samples=[];
  for(const x of[-w/2,0,w/2])for(const z of[-d/2,0,d/2]){const nn=new THREE.Vector3(x,0,z).applyMatrix4(initial).normalize(),latN=Math.asin(nn.y),lonN=Math.atan2(nn.x,nn.z);samples.push({height:height(nn),projected:height(nn)*nn.dot(n),lat:latN,lon:lonN,coast:surface.coast(nn),railClearance:Math.abs(latN-trackLat(lonN))*R});}
  if(samples.some(s=>s.height<R+.003||s.railClearance<.115||s.lon>-.26&&s.lon<-.14&&s.lat>-.17&&s.lat<.67))throw Error(`Shore-life footprint is not clear of water, railway or stream: ${name}`);
  const top=Math.max(...samples.map(s=>s.projected))+.003,base=frame(lat,lon,top).multiply(turn),radius=Math.hypot(w,d)/2;
  const townClearance=(town?.root?.userData?.placements??[]).reduce((v,p)=>Math.min(v,n.distanceTo(direction(p.lat,p.lon))*R-p.radius-radius),Infinity);
  // Landmark pads are large rectangles. Check their actual local bounds rather
  // than a conservative bounding circle that would discard the cottage's yard.
  let landmarkClearance=Infinity;
  for(const site of landmarks?.root?.userData?.sites??[]){const inv=frame(site.lat,site.lon,site.deckRadius).invert();for(const x of[-w/2,w/2])for(const z of[-d/2,d/2]){const p=new THREE.Vector3(x,0,z).applyMatrix4(base).applyMatrix4(inv);const dx=Math.max(Math.abs(p.x)-site.width/2,0),dz=Math.max(Math.abs(p.z)-site.depth/2,0);landmarkClearance=Math.min(landmarkClearance,Math.hypot(dx,dz));}}
  if(townClearance<.010||landmarkClearance<.012)throw Error(`Shore-life footprint intersects existing architecture: ${name}`);
  const record={name,group,lat,lon,width:w,depth:d,yaw,radius,base:base.clone(),groundRadius:top,groundSamples:samples,townClearance,landmarkClearance};placements.push(record);return base;
 }
 function feature(name){features.push(name);}
 function groundPad(base,w,d,color=C.paleWood){const n=new THREE.Vector3().setFromMatrixPosition(base).normalize();let bottom=Infinity;for(const x of[-w/2,w/2])for(const z of[-d/2,d/2]){const q=new THREE.Vector3(x,0,z).applyMatrix4(base).normalize();bottom=Math.min(bottom,height(q)*q.dot(n)-new THREE.Vector3().setFromMatrixPosition(base).length());}box(color,base,[0,(bottom-.009)/2,0],[w,.009-bottom,d]);}

 // Cottage yard: a purposeful line between the house steps and the old booth.
 const yard={lat:.177,lon:-1.062};
 const [mailLat,mailLon]=offset(yard.lat,yard.lon,-.182,-.073),mail=register('Old cottage mailbox','cottage yard',mailLat,mailLon,.057,.053,.04);
 groundPad(mail,.026,.025,C.wood);box(C.wood,mail,[0,.058,0],[.010,.116,.012]);box(C.red,mail,[0,.128,0],[.044,.035,.034]);box('#cc9274',mail,[0,.148,0],[.051,.007,.042],[.06,0,0]);box(C.dark,mail,[0,.133,.018],[.029,.003,.002]);box(C.ivory,mail,[0,.123,.0185],[.017,.0025,.001]);box(C.ivory,mail,[0,.117,.0185],[.017,.0025,.001]);box(C.ivory,mail,[0,.113,.0185],[.003,.010,.001]);box(C.rust,mail,[-.012,.121,.019],[.005,.004,.001]);feature('A faded red postbox with a letter slot and postal mark');

 const [laundryLat,laundryLon]=offset(yard.lat,yard.lon,.008,-.050),laundry=register('Clothesline and two cotton shirts','cottage yard',laundryLat,laundryLon,.285,.047);
 for(const x of[-.136,.136]){cylinder(C.wood,laundry,[x,.084,0],.004,.005,.168,6);box(C.paleWood,laundry,[x,.168,0],[.025,.005,.013]);}
 curve(C.darkWood,laundry,[[-.14,.164,0],[-.068,.151,.003],[.060,.152,.002],[.14,.164,0]],.0009,18);
 function garment(x,width,length,shirt,color){
  const anchorY=.151+(Math.abs(x)/.14)**2*.010,segments=10,positions=[],indices=[],anchor=[];
  for(let row=0;row<=6;row++)for(let col=0;col<=segments;col++){const v=row/6,u=col/segments,xx=(u-.5)*width,yy=-v*length,shirtWidth=shirt&&v<.37?1.26:1;positions.push(xx*shirtWidth,yy,.003*Math.cos(u*Math.PI*3)*v);anchor.push(v);}
  for(let row=0;row<6;row++)for(let col=0;col<segments;col++){const a=row*(segments+1)+col;indices.push(a,a+segments+1,a+1,a+1,a+segments+1,a+segments+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
  // Direction and pinned-edge weights survive batching for deterministic sway.
  const wind=new THREE.Vector3(0,0,1).transformDirection(laundry),raw=g.toNonIndexed();g.dispose();const weights=[];for(const i of indices)weights.push(wind.x,wind.y,wind.z,anchor[i]);raw.setAttribute('clothSway',new THREE.Float32BufferAttribute(weights,4));add(raw,color,laundry,[x,anchorY,0],[0,0,(x<0?-.06:.035)],[1,1,1],'cloth');
  for(const side of[-1,1])box(C.paleWood,laundry,[x+side*width*.30,anchorY+.002,.001],[.0035,.012,.004]);
 }
 garment(-.082,.053,.061,true,C.ivory);garment(0,.052,.084,false,C.blue);garment(.080,.053,.059,true,C.linen);feature('Pinned cotton laundry on a slack line');

 const [cycleLat,cycleLon]=offset(yard.lat,yard.lon,-.095,.050),cycle=register('Sea-green step-through bicycle','cottage yard',cycleLat,cycleLon,.143,.047,-.16);
 const rear=[-.044,.031,0],front=[.047,.031,0];
 for(const wheel of[rear,front]){ring(C.dark,cycle,wheel,.029,.0025);ring('#b0b7a4',cycle,wheel,.026,.0007);for(let j=0;j<8;j++){const a=j*TAU/8;rod('#b4bbab',cycle,wheel,[wheel[0]+Math.cos(a)*.025,wheel[1]+Math.sin(a)*.025,0],.00055,4);}cylinder(C.iron,cycle,wheel,.003,.003,.014,6,[Math.PI/2,0,0]);}
 const crank=[0,.030,0],seat=[-.019,.068,0],head=[.031,.076,0];for(const [a,b]of[[rear,seat],[seat,crank],[rear,crank],[crank,[.017,.043,0]],[[.017,.043,0],head],[head,front],[seat,[.017,.043,0]]])rod(C.teal,cycle,a,b,.0022,6);
 rod(C.iron,cycle,seat,[-.023,.079,0],.0017);box(C.darkWood,cycle,[-.023,.081,0],[.020,.005,.010]);rod(C.iron,cycle,head,[.033,.088,0],.0018);rod(C.iron,cycle,[.033,.088,-.013],[.033,.088,.013],.0017);for(const side of[-1,1])box(C.dark,cycle,[.036,.088,side*.013],[.008,.003,.004]);
 ring(C.iron,cycle,crank,.008,.001);rod(C.iron,cycle,[-.006,.024,-.006],[.006,.037,.007],.001);box(C.dark,cycle,[-.006,.024,-.010],[.010,.003,.005]);rod(C.iron,cycle,[0,.031,-.003],[-.009,0,-.021],.0016);
 // An open wicker front basket with visible slats, not an opaque cube.
 box(C.paleWood,cycle,[.057,.069,0],[.025,.003,.030]);for(const x of[.045,.069])for(let j=0;j<4;j++)rod(C.wood,cycle,[x,.071,-.013+j*.009],[x,.092,-.013+j*.009],.0009);for(const z of[-.015,.015])for(let j=0;j<4;j++)rod(C.wood,cycle,[.045+j*.008,.071,z],[.045+j*.008,.092,z],.0009);for(const y of[.075,.084,.092]){rod(C.paleWood,cycle,[.044,y,-.016],[.070,y,-.016],.001);rod(C.paleWood,cycle,[.044,y,.016],[.070,y,.016],.001);}feature('Step-through bicycle with spokes, pedals and wicker basket');

 const [bagLat,bagLon]=offset(yard.lat,yard.lon,.032,.053),bag=register('Travel trunk and canvas backpack','cottage yard',bagLat,bagLon,.089,.069,.08);
 groundPad(bag,.077,.061,C.darkWood);box(C.paleWood,bag,[0,.026,0],[.073,.047,.057]);box(C.wood,bag,[0,.052,0],[.078,.008,.061]);for(const x of[-.024,.024]){box(C.darkWood,bag,[x,.031,.030],[.005,.050,.002]);box(C.darkWood,bag,[x,.057,0],[.005,.002,.061]);}box('#c4b187',bag,[0,.035,.031],[.012,.009,.002]);curve(C.darkWood,bag,[[-.013,.041,.034],[-.011,.048,.038],[.011,.048,.038],[.013,.041,.034]],.0017,6);
 globe(C.teal,bag,[-.006,.082,-.002],[.021,.029,.015]);box(C.green,bag,[-.006,.078,.012],[.029,.024,.007]);box(C.linen,bag,[-.006,.105,.002],[.034,.006,.027],[.17,0,0]);for(const x of[-.020,.007])curve(C.darkWood,bag,[[x,.096,-.012],[x-.003,.083,-.024],[x,.063,-.014]],.002,8);feature('Brass-latched travel trunk with an old canvas backpack');

 const [phoneLat,phoneLon]=offset(yard.lat,yard.lon,.204,.008),phone=register('Old Japanese glass telephone booth','cottage yard',phoneLat,phoneLon,.128,.138,-.10);
 groundPad(phone,.118,.116,'#a8ac93');box(C.iron,phone,[0,.009,0],[.108,.014,.108]);
 const w=.094,d=.094,top=.220;
 for(const x of[-w/2,w/2])for(const z of[-d/2,d/2])box('#b8c5ad',phone,[x,.116,z],[.006,.217,.006]);
 for(const y of[.025,.080,.158,.219]){for(const x of[-w/2,w/2])box(C.teal,phone,[x,y,0],[.006,.005,d]);box(C.teal,phone,[0,y,-d/2],[w,.005,.006]);}
 for(const x of[-w/2,w/2])box(C.glass,phone,[x,.123,0],[.001,.185,.082],[0,0,0],'glass');box('#adc8b4',phone,[0,.123,-d/2],[.082,.185,.001],[0,0,0],'glass');
 box(C.green,phone,[0,top+.009,0],[.118,.015,.118]);box(C.teal,phone,[0,top+.019,0],[.110,.010,.110]);box(C.cream,phone,[0,.208,.050],[.062,.021,.004]);
 // Three-dimensional receiver emblem makes the booth readable without fonts.
 curve(C.dark,phone,[[-.016,.211,.053],[-.011,.205,.053],[.011,.205,.053],[.016,.211,.053]],.0025,8,5);globe(C.dark,phone,[-.017,.212,.053],[.005,.003,.002]);globe(C.dark,phone,[.017,.212,.053],[.005,.003,.002]);
 const door=phone.clone().multiply(new THREE.Matrix4().makeTranslation(-w/2,0,d/2)).multiply(new THREE.Matrix4().makeRotationY(-.24));
 for(const x of[0,.089])box('#b5c2ac',door,[x,.113,0],[.005,.205,.005]);for(const y of[.017,.080,.157,.215])box('#a5b7a2',door,[.045,y,0],[.092,.005,.005]);box(C.glass,door,[.045,.119,0],[.080,.186,.001],[0,0,0],'glass');rod(C.dark,door,[.073,.099,.005],[.073,.133,.005],.0022);
 // Green public phone, chrome keypad, coin slots, handset and coiled cord.
 box(C.wood,phone,[0,.095,-.023],[.067,.006,.043]);box('#4c956d',phone,[0,.135,-.027],[.045,.071,.030]);box('#a5b6a2',phone,[.007,.130,-.0105],[.022,.031,.001]);for(let row=0;row<4;row++)for(let col=0;col<3;col++)box(C.dark,phone,[.001+col*.006,.140-row*.006,-.009],[.0035,.0033,.001]);box(C.dark,phone,[.009,.161,-.010],[.015,.002,.001]);box('#aec2a7',phone,[.007,.151,-.010],[.017,.006,.001]);
 curve('#2d5247',phone,[[-.021,.163,-.007],[-.026,.154,-.004],[-.026,.133,-.004],[-.021,.124,-.007]],.0038,8,6);globe('#315a49',phone,[-.019,.164,-.006],[.006,.006,.004]);globe('#315a49',phone,[-.019,.123,-.006],[.006,.006,.004]);const cord=[];for(let j=0;j<=32;j++){const a=j/32*TAU*4;cord.push([-.021+Math.sin(a)*.0018,.124-j/32*.028,-.005+Math.cos(a)*.0018]);}curve(C.dark,phone,cord,.0007,40);
 box(C.ivory,phone,[.025,.178,-.042],[.026,.026,.001]);for(let j=0;j<3;j++)box(C.teal,phone,[.025,.185-j*.006,-.0405],[.020,.001,.001]);
 for(const [x,y,z]of[[-.048,.039,.048],[.045,.070,.049],[-.047,.184,-.047],[.034,.225,.058]])box(C.rust,phone,[x,y,z],[.005,.009,.0015],[0,0,.12]);
 curve(C.green,phone,[[-.056,.016,-.041],[-.052,.050,-.045],[-.055,.085,-.043],[-.048,.116,-.047]],.0014,10);for(let j=0;j<7;j++)globe(j%2?C.green:C.leaf,phone,[-.052+(j%2?.007:-.007),.024+j*.012,-.043],[.009,.004,.005],[.15,j*.9,.25]);feature('Complete old glass phone booth with open door, green payphone, keypad, handset, cord, notice, rust and ivy');

 // Low overhead lines are intentionally confined to this yard, not the railway.
 const [lineLat,lineLon]=offset(yard.lat,yard.lon,.002,-.095),line=register('Two yard poles and perched sparrows','cottage yard',lineLat,lineLon,.505,.036);
 for(const x of[-.247,.247]){cylinder(C.wood,line,[x,.133,0],.0038,.005,.266,7);box(C.darkWood,line,[x,.262,0],[.025,.006,.036]);for(const z of[-.014,.014]){cylinder('#b4bca7',line,[x,.269,z],.003,.003,.008,6);}}
 for(const z of[-.014,.014])curve(C.dark,line,[[-.247,.271,z],[-.125,.251,z+.003],[0,.242,z+.005],[.125,.251,z+.003],[.247,.271,z]],.00085,24);
 function bird(x,y,z,yaw){const b=line.clone().multiply(new THREE.Matrix4().makeTranslation(x,y,z)).multiply(new THREE.Matrix4().makeRotationY(yaw));globe('#9c9276',b,[0,.008,0],[.009,.010,.015]);globe('#6f7464',b,[0,.015,.010],[.007,.007,.007]);globe(C.ivory,b,[0,.006,.008],[.007,.006,.010]);add(new THREE.ConeGeometry(.0025,.007,4),C.cream,b,[0,.015,.019],[Math.PI/2,0,0]);box(C.darkWood,b,[0,.010,-.018],[.008,.002,.019],[-.25,0,0]);for(const side of[-1,1]){rod(C.darkWood,b,[side*.003,0,0],[side*.003,.004,0],.0006);globe(C.dark,b,[side*.006,.017,.013],[.0013,.0013,.0013]);}}
 bird(-.126,.251,-.011,.22);bird(.124,.251,.017,-.35);feature('Two shallow catenary wires with two perched sparrows');

 // Beach finds: one drift line with a log, shells and glass, plus a short trail
 // of footprints. The scene stays well west of the future river mouth.
 const beach={lat:-.084,lon:-.410};
 const beachBase=register('Beachcomber drift line','beach finds',beach.lat,beach.lon,.34,.15,.08);
 // Flat sand marks follow the spherical ground exactly, so they cannot hover.
 function sandOval(x,z,rx,rz,color,yaw=0){const p=new THREE.Vector3(x,0,z).applyMatrix4(beachBase).normalize(),base=frame(Math.asin(p.y),Math.atan2(p.x,p.z),height(p)+.0018);const g=new THREE.CircleGeometry(1,14);g.rotateX(-Math.PI/2);add(g,color,base,[0,0,0],[0,yaw,0],[rx,1,rz]);}
 sandOval(-.068,-.010,.081,.014,C.wet,.23);sandOval(.083,.010,.030,.021,'#ddc28b');
 function beachPose(x,z){const p=new THREE.Vector3(x,0,z).applyMatrix4(beachBase).normalize();return frame(Math.asin(p.y),Math.atan2(p.x,p.z),height(p)+.002);}
 const log=beachPose(-.070,-.014);curve('#b5a181',log,[[-.071,.009,.014],[-.038,.015,.006],[.012,.012,-.002],[.065,.020,-.017]],.010,12,7);curve(C.paleWood,log,[[-.070,.009,.015],[-.028,.020,.007],[.013,.017,-.003],[.064,.023,-.015]],.002,12,4);curve(C.darkWood,log,[[.012,.011,-.002],[.025,.025,.017],[.042,.030,.024]],.004,7,5);for(let j=0;j<3;j++)curve('#927e64',log,[[-.059,.013+j*.001,.006+j*.002],[-.015,.023+j*.001,-.002+j*.002],[.057,.019+j*.001,-.017+j*.002]],.0006,12);feature('Sun-bleached forked driftwood');
 for(let j=0;j<7;j++){const x=.017+(j%4)*.026,z=-.025+Math.floor(j/4)*.038+(j%2)*.009,b=beachPose(x,z),a=j*.91;
  const shape=new THREE.Shape();shape.moveTo(0,0);for(let k=0;k<=8;k++){const t=-.9+k/8*1.8;shape.lineTo(Math.sin(t)*.010,Math.cos(t)*.014);}shape.closePath();const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);add(g,j%3===0?'#e6bba8':C.ivory,b,[0,.001,0],[0,a,0]);for(let k=0;k<5;k++){const t=-.72+k*.36;rod(j%3===0?'#c99e83':'#ccb493',b,[0,.002,0],[Math.sin(t+a)*.009,.003,-Math.cos(t+a)*.013],.0006,4);}}
 feature('Seven ribbed fan shells in a sandy drift line');
 for(const [x,z,color]of[[.117,.008,'#91bdb0'],[.096,.034,'#83aead'],[.122,-.030,'#b7cca9'],[.070,.046,'#82b0b6'],[-.011,.045,'#b7bf94']]){const b=beachPose(x,z);add(new THREE.DodecahedronGeometry(1,0),color,b,[0,.004,0],[.2,x*14,.1],[.009,.004,.006]);}
 const bottle=beachPose(.031,.043);cylinder('#87ad98',bottle,[0,.011,0],.006,.006,.024,8,[0,0,1.22]);cylinder('#80a58e',bottle,[-.014,.016,0],.0027,.004,.009,7,[0,0,1.22]);cylinder(C.wood,bottle,[-.019,.018,0],.0026,.0026,.003,6,[0,0,1.22]);box(C.ivory,bottle,[.001,.017,.004],[.013,.004,.008],[0,0,1.22]);feature('Five tumbled sea-glass pieces and a corked old bottle');
 for(let step=0;step<8;step++){const x=-.131+step*.022,z=.041+(step%2?.009:-.009);sandOval(x,z,.005,.010,'#c6a971',-.36);sandOval(x+.004,z-.008,.003,.003,'#c6a971',-.36);}feature('A short paired footprint trail');

 for(const key of Object.keys(parts)){if(!parts[key].length)continue;const geometry=mergeGeometries(parts[key],false);if(!geometry)throw Error(`Unable to batch shore life: ${key}`);parts[key].forEach(g=>g.dispose());geometry.computeBoundingSphere();geometry.computeBoundingBox();geometries.add(geometry);const mesh=new THREE.Mesh(geometry,key==='glass'?glass:key==='cloth'?fabric:solid);mesh.name=key==='solid'?'Batched cottage keepsakes, telephone, birds and beach finds':key==='glass'?'Thin sea-green telephone glazing':'Three pinned cotton garments';mesh.castShadow=key!=='glass';mesh.receiveShadow=true;if(key==='glass')mesh.renderOrder=5;root.add(mesh);meshes.push(mesh);}
 const cloth=meshes.find(m=>m.material===fabric),rest=cloth.geometry.attributes.position.array.slice(),clothNormal=cloth.geometry.attributes.normal.array.slice(),sway=cloth.geometry.attributes.clothSway.array;
 function update(time,env={}){if(disposed||env.paused)return;if(Number.isFinite(time))elapsed=time;const wind=THREE.MathUtils.clamp(env.wind??.45,0,1.5),position=cloth.geometry.attributes.position;for(let i=0;i<position.count;i++){const weight=sway[i*4+3],amount=Math.sin(elapsed*1.35+rest[i*3]*2.7)*.006*weight*weight*wind;for(let axis=0;axis<3;axis++)position.array[i*3+axis]=rest[i*3+axis]+sway[i*4+axis]*amount;}position.needsUpdate=true;cloth.geometry.attributes.normal.array.set(clothNormal);}
 update(0);root.updateMatrixWorld(true);
 const stats={focalGroups:2,mailboxes:1,clotheslines:1,garments:3,bicycles:1,backpacks:1,trunks:1,telephoneBooths:1,utilityPoles:2,overheadWires:2,perchedBirds:2,shells:7,driftwood:1,seaGlass:5,oldBottles:1,footprintPairs:4,drawCalls:meshes.length,triangles:meshes.reduce((sum,m)=>sum+m.geometry.attributes.position.count/3,0),features,placements:placements.map(({base,...p})=>p)};
 if(stats.drawCalls>6||stats.triangles>30000)throw Error('Shore-life rendering budget exceeded');
 root.userData.placements=placements;root.userData.shoreLife=stats;
 return{root,stats,update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}

