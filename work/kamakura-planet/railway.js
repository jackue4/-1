import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU=Math.PI*2,UP=new THREE.Vector3(0,1,0),STATION_LON=-.52,CROSSING_LON=-.20;
const wrap=(x,length)=>((x%length)+length)%length;

/**
 * One fresh, closed seaside railway. sample(t) uses normalized arc length:
 * t=0 is the station, t=1 completes a lap; negative values wrap naturally.
 * train is the leading car's anchor, suitable for getWorldPosition / follow.
 * All carriage centres follow this exact same arc-length lookup table.
 */
export function createRailway({planet,surface,palette={}}){
  const {R,direction,height,trackLat}=surface,root=new THREE.Group();root.name='Enoden coast railway and Kamakura crossing';planet.add(root);
  const geometryOwned=new Set(),materialOwned=new Set(),cars=[],lampMaterials=[];
  const createMat=options=>{const m=new THREE.MeshToonMaterial({gradientMap:palette.ramp??null,...options});materialOwned.add(m);return m;};
  const colored=createMat({color:'white',vertexColors:true}),glass=createMat({color:'#5d8089',emissive:'#eed3a4',emissiveIntensity:.03});
  const warmLamp=createMat({color:'#fff6d4',emissive:'#ffcc80',emissiveIntensity:.55});lampMaterials.push(warmLamp);
  const tailLamp=createMat({color:'#dd7b67',emissive:'#e46655',emissiveIntensity:.22});lampMaterials.push(tailLamp);
  const cream=palette.trainCream||'#f6df9f',red=palette.trainRed||'#216956',roofColor='#657570',underframe='#344d4c',wood='#ae9575',steel='#adb9b1';
  const matrix=new THREE.Matrix4(),basis=new THREE.Matrix4(),dummy=new THREE.Object3D(),right=new THREE.Vector3(),up=new THREE.Vector3();
  const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,8),cyl=new THREE.CylinderGeometry(1,1,1,10);
  const N=768,points=[],lengths=new Float64Array(N+1);let totalLength=0;
  for(let i=0;i<=N;i++){
    const lon=STATION_LON+i/N*TAU,n=direction(trackLat(lon),lon).normalize(),p=n.clone().multiplyScalar(Math.max(R+.063,(surface.baseHeight??height)(n)+.025));
    points.push(p);if(i){totalLength+=p.distanceTo(points[i-1]);lengths[i]=totalLength;}
  }
  // Smooth terrain values are sampled densely, and the arc-length lookup is
  // shared by rail geometry and wheels: a car cannot cut across the ocean curve.
  const tangents=points.slice(0,N).map((p,i)=>points[(i+1)%N].clone().sub(points[(i+N-1)%N]).normalize());tangents.push(tangents[0].clone());
  function pose(){return{position:new THREE.Vector3(),normal:new THREE.Vector3(),tangent:new THREE.Vector3()};}
  function atDistance(distance,out){
    const d=wrap(distance,totalLength);let lo=0,hi=N;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(lengths[mid]<=d)lo=mid;else hi=mid;}
    const f=(d-lengths[lo])/(lengths[lo+1]-lengths[lo]);out.position.copy(points[lo]).lerp(points[lo+1],f);out.normal.copy(out.position).normalize();out.tangent.copy(tangents[lo]).lerp(tangents[lo+1],f).normalize();return out;
  }
  function orient(object,p,offset=0){
    right.crossVectors(p.normal,p.tangent).normalize();up.crossVectors(p.tangent,right).normalize();basis.makeBasis(right,up,p.tangent);
    object.position.copy(p.position).addScaledVector(p.normal,offset);object.quaternion.setFromRotationMatrix(basis);return object;
  }
  function mesh(geometry,material,name){geometryOwned.add(geometry);const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=m.receiveShadow=true;root.add(m);return m;}
  function partsBuilder(){
    const pieces=[];
    function add(geometry,color,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
      dummy.position.set(...position);dummy.rotation.set(...rotation);dummy.scale.set(...scale);dummy.updateMatrix();
      let g=geometry.clone().applyMatrix4(dummy.matrix);if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}g.deleteAttribute('uv');
      const colors=new Float32Array(g.attributes.position.count*3),c=new THREE.Color(color);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));pieces.push(g);
    }
    function rod(a,b,r,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),q=new THREE.Quaternion().setFromUnitVectors(UP,end.clone().sub(start).normalize()),euler=new THREE.Euler().setFromQuaternion(q);add(cyl,color,start.clone().add(end).multiplyScalar(.5).toArray(),[r,start.distanceTo(end),r],[euler.x,euler.y,euler.z]);}
    function bake(parent,name,material=colored){if(!pieces.length)return null;const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());geometryOwned.add(geometry);const object=new THREE.Mesh(geometry,material);object.name=name;object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;}
    return{add,rod,bake};
  }
  function instance(geometry,material,name,transforms,colors){const object=new THREE.InstancedMesh(geometry,material,transforms.length);geometryOwned.add(geometry);object.name=name;transforms.forEach((m,i)=>{object.setMatrixAt(i,m);if(colors)object.setColorAt(i,colors[i]);});object.instanceMatrix.needsUpdate=true;if(colors)object.instanceColor.needsUpdate=true;object.castShadow=true;object.receiveShadow=true;object.computeBoundingSphere();root.add(object);return object;}
  const railPoints=[[],[]],stationPose=pose();
  for(let i=0;i<N;i++){
    right.crossVectors(points[i].clone().normalize(),tangents[i]).normalize();
    railPoints[0].push(points[i].clone().addScaledVector(right,-.05));railPoints[1].push(points[i].clone().addScaledVector(right,.05));
  }
  const railParts=railPoints.map(rail=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail,true,'catmullrom',.3),N,.005,5,true));
  const rails=mergeGeometries(railParts,false);railParts.forEach(g=>g.dispose());mesh(rails,createMat({color:steel}),'Two continuous steel rails');
  const sleepers=[],sleepColors=[],beds=[],bedColors=[],piers=[],pierColors=[],p=pose();
  const sleeperCount=Math.ceil(totalLength/.078),step=totalLength/sleeperCount;
  for(let i=0;i<sleeperCount;i++){
    atDistance(i*step,p);orient(dummy,p,-.009);dummy.scale.set(.172,.013,.022);dummy.updateMatrix();sleepers.push(dummy.matrix.clone());sleepColors.push(new THREE.Color(i%5===0?'#c9a285':wood));
    const ground=height(p.normal),overWater=ground<R+.015;
    orient(dummy,p,-.029);dummy.scale.set(overWater?.185:.195,overWater?.025:.023,step*1.025);dummy.updateMatrix();beds.push(dummy.matrix.clone());bedColors.push(new THREE.Color(overWater?'#b1bdb5':i%4?'#d0c7ad':'#c1c2a8'));
    if(overWater&&i%4===0){
      const top=p.position.length()-.042,bottom=R-.045,h=top-bottom;
      for(const side of [-1,1]){
        orient(dummy,p,-.042-h/2);dummy.position.addScaledVector(right,side*.057);dummy.scale.set(.017,h,.017);dummy.updateMatrix();piers.push(dummy.matrix.clone());pierColors.push(new THREE.Color('#9aaea6'));
      }
    }
  }
  const trackMaterial=createMat({color:'white'});
  instance(box.clone(),trackMaterial,'Weathered timber sleepers',sleepers,sleepColors);
  instance(box.clone(),trackMaterial,'Low seaside railway foundation',beds,bedColors);
  instance(new THREE.CylinderGeometry(1,1,1,7),trackMaterial,'Short sea bridge feet',piers,pierColors);

  function roundedShell(){
    const shape=new THREE.Shape(),w=.128,h=.125,r=.018,x=-w/2,y=.043;
    shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
    const g=new THREE.ExtrudeGeometry(shape,{depth:.200,bevelEnabled:false,curveSegments:4,steps:1});g.translate(0,0,-.100);return g;
  }
  const shell=roundedShell();
  for(let index=0;index<3;index++){
    const car=new THREE.Group();car.name=index===0?'Umi tram · leading car':`Umi tram · carriage ${index+1}`;root.add(car);cars.push(car);
    const body=partsBuilder(),windows=partsBuilder(),lights=partsBuilder(),tail=partsBuilder();
    body.add(shell,cream);
    body.add(box,underframe,[0,.033,0],[.101,.025,.184]);
    body.add(box,'#826a63',[0,.022,0],[.067,.018,.159]);
    // Wine-red lower sides and waistline, warm cream above; the silhouette is
    // rounded by the shell and low domed roof instead of a flat rectangular bus.
    for(const side of [-1,1]){
      body.add(box,red,[side*.0643,.073,0],[.0025,.052,.178]);
      body.add(box,'#d29983',[side*.066,.101,0],[.002,.003,.176]);
      for(const z of [-.068,-.024,.024,.068]){
        windows.add(box,'#ffffff',[side*.0658,.131,z],[.0025,.043,.031]);
        body.add(box,'#fbeed2',[side*.0675,.152,z],[.002,.002,.032]);
        body.add(box,'#adc7c4',[side*.0675,.128,z-.010],[.001,.032,.003]);
        if((Math.round((z+.07)*100)+index)%3===0){body.add(sphere,'#74605b',[side*.068,.118,z],[.002,.007,.006]);body.add(sphere,index%2?'#ce976c':'#849b8c',[side*.0675,.109,z],[.002,.005,.009]);}
      }
      // Narrow cream door seams and hand grips quietly establish carriage scale.
      for(const z of [-.046,.046])body.add(box,'#dbcca9',[side*.067,.111,z],[.001,.066,.0015]);
      body.add(box,'#6d7771',[side*.068,.101,.047],[.001,.010,.002]);
      for(const z of [-.064,.064]){
        body.add(cyl,'#35434a',[side*.050,.024,z],[.021,.012,.021],[0,0,Math.PI/2]);
        body.add(cyl,'#7d8b8a',[side*.057,.024,z],[.012,.002,.012],[0,0,Math.PI/2]);
      }
    }
    for(const end of [-1,1]){
      body.add(box,red,[0,.074,end*.101],[.102,.048,.002]);
      body.add(box,'#dab7a0',[0,.101,end*.103],[.099,.003,.001]);
      for(const x of [-.028,.028]){
        windows.add(box,'#ffffff',[x,.133,end*.102],[.043,.043,.002]);
        body.add(box,'#c4d6c9',[x-.014,.134,end*.104],[.003,.032,.001]);
      }
      body.add(box,'#69716d',[0,.155,end*.103],[.053,.010,.003]);
      for(let j=0;j<4;j++)body.add(box,'#e3d8b4',[(j-1.5)*.009,.155,end*.105],[.006,.003,.001]);
      body.add(box,'#677572',[0,.046,end*.113],[.096,.009,.018]);
      body.add(box,'#415156',[0,.028,end*.115],[.027,.010,.028]);
    }
    body.add(sphere,roofColor,[0,.169,0],[.069,.016,.112]);
    body.add(box,'#8d9690',[0,.183,-.031],[.041,.008,.041]);body.add(box,'#8d9690',[0,.183,.035],[.041,.008,.029]);
    if(index===1){
      for(const x of [-.021,.021]){body.rod([x,.182,-.046],[x,.226,-.012],.0022,'#596a6b');body.rod([x,.226,-.012],[x,.198,.041],.0022,'#596a6b');body.rod([x,.182,.041],[x,.226,.011],.0022,'#596a6b');body.rod([x,.226,.011],[x,.198,-.046],.0022,'#596a6b');}
      body.add(box,'#526366',[0,.227,0],[.078,.004,.016]);
    }
    if(index===0)for(const x of [-.043,.043]){body.add(sphere,'#d5baa0',[x,.075,.106],[.012,.011,.006]);lights.add(sphere,'#ffffff',[x,.075,.111],[.008,.008,.004]);}
    if(index===2)for(const x of [-.043,.043])tail.add(sphere,'#ffffff',[x,.075,-.107],[.006,.006,.004]);
    body.bake(car,'Painted tram shell, trim and steel wheels');windows.bake(car,'Tram passenger glazing',glass);lights.bake(car,'Twin warm headlamps',warmLamp);tail.bake(car,'Rear red markers',tailLamp);
  }
  const crossingDistance=lengths[Math.round((CROSSING_LON-STATION_LON)/TAU*N)],crossPose=pose(),crossing=new THREE.Group();atDistance(crossingDistance,crossPose);orient(crossing,crossPose);crossing.name='Kamakurakokomae level crossing';root.add(crossing);
  const crossingParts=partsBuilder(),gateArms=[],crossLights=[];
  crossingParts.add(box,'#7f8f89',[0,-.006,0],[.44,.018,.32]);
  for(const z of [-.155,.155])crossingParts.add(box,'#e9debc',[0,.005,z],[.44,.002,.009]);
  for(const side of [-1,1]){
   const x=side*.175,z=side*.175;
   crossingParts.add(cyl,'#384b44',[x,.125,z],[.01,.25,.01]);
   for(let k=0;k<6;k++)crossingParts.add(cyl,k%2?'#edc763':'#3b4944',[x,.025+k*.034,z],[.0105,.019,.0105]);
   for(const angle of [-.77,.77]){crossingParts.add(box,'#ebc46c',[x,.278,z],[.014,.155,.025],[angle,0,0]);for(const k of [-1,1])crossingParts.add(box,'#354640',[x,.278+Math.cos(angle)*k*.047,z+Math.sin(angle)*k*.047],[.015,.03,.026],[angle,0,0]);}
   crossingParts.add(box,'#45504a',[x,.205,z],[.022,.042,.105]);
   const lightMat=createMat({color:'#ed5b48',emissive:'#ff4330',emissiveIntensity:.3}),lightParts=partsBuilder();
   for(const face of [-1,1])for(const dz of [-.034,.034])lightParts.add(sphere,'#ffffff',[x+face*.017,.208,z+dz],[.012,.014,.014]);
   lightParts.bake(crossing,'Alternating red crossing lamps',lightMat);crossLights.push(lightMat);
   const arm=new THREE.Group();arm.position.set(x,.092,z);crossing.add(arm);const pieces=partsBuilder();
   for(let k=0;k<10;k++)pieces.add(box,k%2?'#ead27b':'#344b45',[0,0,-side*(.016+k*.030)],[.014,.014,.031]);
   pieces.bake(arm,'Striped lifting barrier');gateArms.push({arm,side});
  }
  crossingParts.bake(crossing,'Crossing pavement and warning signs');
  const poles=partsBuilder(),wirePoints=[];
  for(let i=0;i<9;i++){
   const lon=-.95+i*.18,nn=direction(trackLat(lon),lon),ground=Math.max(R+.063,height(nn)+.025),east=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),north=new THREE.Vector3().crossVectors(nn,east).normalize();
   const foot=nn.clone().multiplyScalar(ground).addScaledVector(north,.14),top=foot.clone().addScaledVector(nn,.33),tip=nn.clone().multiplyScalar(ground+.33).addScaledVector(north,-.05);
   poles.rod(foot.toArray(),top.toArray(),.0045,'#728477');poles.rod(top.toArray(),tip.toArray(),.004,'#728477');wirePoints.push(nn.clone().multiplyScalar(ground+.33));
  }
  for(let i=1;i<wirePoints.length;i++)poles.rod(wirePoints[i-1].toArray(),wirePoints[i].toArray(),.0012,'#60746e');poles.bake(root,'Enoden catenary beside the coastal road');
  shell.dispose();box.dispose();sphere.dispose();cyl.dispose();
  const train=cars[0],carSpacing=.224,carPoses=cars.map(()=>pose()),glassDay=new THREE.Color('#5d8089'),glassNight=new THREE.Color('#e5c791');
  const cruiseSpeed=.34,acceleration=.14,braking=.17,dwellDuration=5;
  let distance=0,lapDistance=0,loops=0,speed=0,dwellRemaining=dwellDuration,stationary=true,lastTime=0,gateOpen=1,crossingActive=false;
  function positionCars(){cars.forEach((car,index)=>orient(car,atDistance(lapDistance-index*carSpacing,carPoses[index]),.003));}
  positionCars();atDistance(0,stationPose);
  function update(dt,time,env={}){
    lastTime=time;let remaining=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,1));
    // Small bounded steps handle station arrival exactly and avoid a frame-size
    // dependent overshoot. Ordinary 60 Hz frames execute this loop once.
    while(remaining>1e-7){const stepTime=Math.min(remaining,.05);remaining-=stepTime;
      if(stationary){dwellRemaining=Math.max(0,dwellRemaining-stepTime);speed=0;if(dwellRemaining<=0)stationary=false;continue;}
      const left=totalLength-lapDistance,target=Math.min(cruiseSpeed,Math.sqrt(Math.max(0,2*braking*left)));
      speed=THREE.MathUtils.clamp(target,speed-braking*stepTime,speed+acceleration*stepTime);
      const moved=Math.min(left,Math.max(speed*stepTime,.000001));lapDistance+=moved;distance+=moved;
      if(left<.0015||lapDistance>=totalLength-1e-6){distance+=totalLength-lapDistance;lapDistance=0;loops++;speed=0;stationary=true;dwellRemaining=dwellDuration;}
    }
    positionCars();const ahead=wrap(crossingDistance-lapDistance,totalLength),behind=wrap(lapDistance-crossingDistance,totalLength);crossingActive=ahead<.95||behind<carSpacing*2+.29;gateOpen=THREE.MathUtils.damp(gateOpen,crossingActive?0:1,3.4,Math.max(0,dt));for(const {arm,side} of gateArms)arm.rotation.x=side*gateOpen*1.48;crossLights.forEach((m,i)=>m.emissiveIntensity=crossingActive?(Math.sin(time*7+i*Math.PI)>.0?1.5:.15):.04);
    const night=THREE.MathUtils.clamp(env.night||0,0,1),rain=THREE.MathUtils.clamp(env.rain||0,0,1);
    glass.emissiveIntensity=.02+night*.47;glass.color.copy(glassDay).lerp(glassNight,night*.40);
    warmLamp.emissiveIntensity=.55+night*1.3+rain*.2;tailLamp.emissiveIntensity=.22+night*.5;
  }
  function onLand(n){return height(n)>=R;}
  function getState(){return{status:stationary?'station':'moving',atStation:stationary,dwellRemaining:Number(dwellRemaining.toFixed(3)),stationLongitude:STATION_LON,stationProgress:0,crossing:{active:crossingActive,open:gateOpen,distance:crossingDistance,longitude:CROSSING_LON},loops,distance:Number(distance.toFixed(4)),lapDistance:Number(lapDistance.toFixed(4)),trackLength:Number(totalLength.toFixed(4)),progress:lapDistance/totalLength,speed:Number(speed.toFixed(4)),time:lastTime,carriages:cars.map((car,index)=>({index,position:car.position.toArray(),progress:wrap(lapDistance-index*carSpacing,totalLength)/totalLength,terrain:onLand(carPoses[index].normal)?'land':'water',land:onLand(carPoses[index].normal)}))};}
  let triangles=0,drawCalls=0;root.traverse(o=>{if(o.isMesh){drawCalls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  const stats={trackLength:totalLength,trackSegments:N,sleepers:sleepers.length,piers:piers.length,carriages:3,trainLength:carSpacing*2+.224,drawCalls,triangles,stationLongitude:STATION_LON};
  root.userData.railway=stats;
  return{root,train,update,getState,sample(t){return atDistance(t*totalLength,pose());},stats,dispose(){root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geometryOwned.forEach(g=>g.dispose());materialOwned.forEach(m=>m.dispose());}};
}

