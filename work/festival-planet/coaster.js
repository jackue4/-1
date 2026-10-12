import {THREE,R,point,mesh,tube,seeded} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Moving toys are baked independently; their animated parent remains movable.
export function bakeModel(group){
  group.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert(), byMaterial=new Map();
  group.traverse(child=>{
    if(!child.isMesh||child.isInstancedMesh||Array.isArray(child.material))return;
    const geometry=child.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,child.matrixWorld));
    const flat=geometry.index?geometry.toNonIndexed():geometry;
    if(!flat.getAttribute('uv'))flat.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(flat.getAttribute('position').count*2),2));
    const geometries=byMaterial.get(child.material)||[];geometries.push(flat);byMaterial.set(child.material,geometries);
  });
  group.clear();
  for(const [material,geometries] of byMaterial){
    const geometry=mergeGeometries(geometries,false);
    if(geometry)mesh(group,geometry,material);
    geometries.forEach(g=>g.dispose());
  }
  return group;
}

const CONTROL=[
  [-Math.PI,.18,.58],[-2.75,.40,.73],[-2.40,.34,.52],[-2.00,.14,.26],
  [-1.85,.12,.23],[-1.65,.12,.23],[-1.48,.10,.23],[-1.22,-.03,.34],
  [-.90,-.22,.51],[-.56,-.24,.58],[-.22,-.23,.34],[.02,-.23,.16],
  [.18,-.21,.065],[.39,-.20,.018],[.58,-.23,.045],[.78,-.30,.19],
  [1.03,-.33,.36],[1.27,-.26,.47],[1.50,.02,.33],[1.80,.15,.28],
  [2.06,.30,.41],[2.35,.29,.70],[2.55,.40,.92],[2.83,.32,.63]
];
const UP=new THREE.Vector3(0,1,0), TAU=Math.PI*2;
const wrap=t=>(t%1+1)%1;
export function createCoasterCurve(){
  const curve=new THREE.CatmullRomCurve3(CONTROL.map(([lon,lat,height])=>point(lat,lon,height)),true,'centripetal');
  curve.arcLengthDivisions=1800;curve.updateArcLengths();return curve;
}

export function createCoaster({planet,palette}){
  const root=new THREE.Group();root.name='星愿环游列车';planet.add(root);
  const cream=palette.m('#ffebcf'),gold=palette.m('#e9ba70'),rose=palette.m('#d47a94'),
    dark=palette.m('#556266'),white=palette.m('#fff6e3'),teal=palette.m('#6ab7b4');
  const curve=createCoasterCurve();
  const length=curve.getLength(),frameMatrix=new THREE.Matrix4(),matrix=new THREE.Matrix4();
  const p=new THREE.Vector3(),tangent=new THREE.Vector3(),up=new THREE.Vector3(),side=new THREE.Vector3(),v=new THREE.Vector3();
  function frame(u,outP=p,outT=tangent,outU=up,outS=side){
    curve.getPointAt(wrap(u),outP);curve.getTangentAt(wrap(u),outT).normalize();
    outU.copy(outP).normalize();outS.crossVectors(outU,outT).normalize();outU.crossVectors(outT,outS).normalize();
    return outP;
  }
  class RailCurve extends THREE.Curve{
    constructor(offset,vertical=0){super();this.offset=offset;this.vertical=vertical;}
    getPoint(u,target=new THREE.Vector3()){
      frame(u);return target.copy(p).addScaledVector(side,this.offset).addScaledVector(up,this.vertical);
    }
  }
  for(const offset of [-.074,.074])mesh(root,new THREE.TubeGeometry(new RailCurve(offset),700,.012,7,true),rose);
  mesh(root,new THREE.TubeGeometry(new RailCurve(0,-.024),700,.019,6,true),cream);

  const sleeperCount=260,sleepers=new THREE.InstancedMesh(new THREE.BoxGeometry(.195,.021,.033),gold,sleeperCount);
  sleepers.castShadow=true;sleepers.receiveShadow=true;root.add(sleepers);
  for(let i=0;i<sleeperCount;i++){
    frame(i/sleeperCount);frameMatrix.makeBasis(side,up,tangent);frameMatrix.setPosition(v.copy(p).addScaledVector(up,-.009));sleepers.setMatrixAt(i,frameMatrix);
  }
  // Slender cream trestles keep the whole orbit legible without a solid wall.
  const supports=new THREE.Group();root.add(supports);
  for(let i=0;i<91;i++){
    const u=i/91;frame(u);
    const lon=Math.atan2(p.x,p.z),height=p.length()-R;
    if((lon>-1.98&&lon<-1.43)||height<.13)continue;
    const foot=p.clone().normalize().multiplyScalar(R+.032),top=p.clone().addScaledVector(up,-.035),heightVector=top.clone().sub(foot);
    const pole=mesh(supports,new THREE.CylinderGeometry(.013,.022,heightVector.length(),6),cream,foot.clone().add(top).multiplyScalar(.5).toArray());
    pole.quaternion.setFromUnitVectors(UP,heightVector.normalize());
    if(i%3===0){
      const offset=side.clone().multiplyScalar(.075),a=foot.clone().add(offset),b=top.clone().sub(offset);
      tube(supports,[a,b],.009,gold,1);
      tube(supports,[foot.clone().sub(offset),top.clone().add(offset)],.009,gold,1);
    }
  }
  bakeModel(supports);

  // The mountain is a real annular tunnel: an open rock portal and a continuous
  // dark interior surround the same centreline used by the train.
  function atLongitude(target){let best=0,error=100;for(let i=0;i<1600;i++){curve.getPointAt(i/1600,p);const e=Math.abs(Math.atan2(p.x,p.z)-target);if(e<error){error=e;best=i/1600;}}return best;}
  const tunnelStart=atLongitude(-1.96),tunnelEnd=atLongitude(-1.46);
  const mountain=new THREE.Group();mountain.name='月石山中空隧道';root.add(mountain);
  const rings=34,sides=30,outer=[],inner=[],caps=[];
  function tunnelVertex(i,j,isInner){
    const q=i/rings;frame(tunnelStart+(tunnelEnd-tunnelStart)*q);
    const a=j/sides*TAU,bulge=Math.sin(Math.PI*q);
    const radius=isInner?.214:(.335+bulge*.20)*(1+.07*Math.sin(a*5+i*.43));
    return p.clone().addScaledVector(up,.111+Math.sin(a)*radius*(isInner?1:1.14)).addScaledVector(side,Math.cos(a)*radius);
  }
  function quad(array,a,b,c,d,reverse=false){
    if(reverse)array.push(...a.toArray(),...c.toArray(),...b.toArray(),...a.toArray(),...d.toArray(),...c.toArray());
    else array.push(...a.toArray(),...b.toArray(),...c.toArray(),...a.toArray(),...c.toArray(),...d.toArray());
  }
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
    quad(outer,tunnelVertex(i,j,false),tunnelVertex(i+1,j,false),tunnelVertex(i+1,j+1,false),tunnelVertex(i,j+1,false));
    quad(inner,tunnelVertex(i,j,true),tunnelVertex(i+1,j,true),tunnelVertex(i+1,j+1,true),tunnelVertex(i,j+1,true),true);
  }
  for(const i of [0,rings])for(let j=0;j<sides;j++)quad(caps,tunnelVertex(i,j,true),tunnelVertex(i,j,false),tunnelVertex(i,j+1,false),tunnelVertex(i,j+1,true),i===rings);
  for(const [vertices,color] of [[outer,'#9daa91'],[inner,'#4e6464'],[caps,'#c3bfb0']]){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const material=palette.m(color);material.side=THREE.DoubleSide;mesh(mountain,geometry,material);
  }
  for(const u of [tunnelStart,tunnelEnd]){
    frame(u);const portal=new THREE.Group();portal.position.copy(p).addScaledVector(up,.111);portal.quaternion.setFromRotationMatrix(frameMatrix.makeBasis(side,up,tangent));mountain.add(portal);
    mesh(portal,new THREE.TorusGeometry(.225,.025,6,32),cream);
    for(let j=0;j<7;j++){const angle=j/6*Math.PI;mesh(portal,new THREE.BoxGeometry(.035,.035,.045),gold,[Math.cos(angle)*.229,Math.sin(angle)*.229,0],[0,0,angle]);}
    mesh(portal,new THREE.SphereGeometry(.027,8,6),palette.glow('#ffe4a5'),[0,.279,.018]);
  }

  const cars=[],carCount=5,carSpacing=.215,headPose={position:new THREE.Vector3(),up:new THREE.Vector3(),tangent:new THREE.Vector3(),lookAhead:new THREE.Vector3()};
  for(let i=0;i<carCount;i++){
    const car=new THREE.Group();car.name=`星愿车厢${i+1}`;car.userData.dynamic=true;root.add(car);
    const body=palette.m(['#ed91a9','#81c9bb','#e7bf78','#b4a0d3','#ed91a9'][i]);
    mesh(car,new THREE.BoxGeometry(.147,.060,.180),body,[0,.065,0]);
    mesh(car,new THREE.BoxGeometry(.161,.027,.195),cream,[0,.031,0]);
    mesh(car,new THREE.BoxGeometry(.130,.025,.110),palette.m('#cd798d'),[0,.106,-.027]);
    mesh(car,new THREE.BoxGeometry(.134,.07,.025),body,[0,.122,-.080]);
    mesh(car,new THREE.BoxGeometry(.10,.018,.038),gold,[0,.130,.043]);
    for(const x of [-.06,.06])tube(car,[[x,.092,.046],[x,.141,.046]],.006,gold,1);
    for(const x of [-.074,.074])for(const z of [-.056,.056]){
      mesh(car,new THREE.CylinderGeometry(.024,.024,.012,10),dark,[x,.012,z],[0,0,Math.PI/2]);
      mesh(car,new THREE.CylinderGeometry(.011,.011,.014,8),gold,[x*1.02,.012,z],[0,0,Math.PI/2]);
    }
    for(const x of [-.075,.075])mesh(car,new THREE.SphereGeometry(.020,8,6),gold,[x,.075,.015]);
    if(i===0){
      mesh(car,new THREE.SphereGeometry(.069,12,8),body,[0,.083,.085]).scale.set(1,.72,.6);
      mesh(car,new THREE.SphereGeometry(.024,10,8),palette.glow('#fff0bb'),[0,.089,.124]);
      const cloud=mesh(car,new THREE.SphereGeometry(.041,9,6),white,[0,.11,.104]);cloud.scale.set(1,.55,.5);
      for(const x of [-.040,.040])mesh(car,new THREE.SphereGeometry(.022,8,6),white,[x,.115,.094]);
      const badge=new THREE.Shape();
      for(let k=0;k<10;k++){const a=Math.PI/2+k*Math.PI/5,r=k%2?.007:.016;k?badge.lineTo(Math.cos(a)*r,Math.sin(a)*r):badge.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
      badge.closePath();mesh(car,new THREE.ShapeGeometry(badge),gold,[0,.129,.135]);
    }
    bakeModel(car);cars.push(car);
  }
  // Leave the front carriage empty so the existing onboard camera stays clear.
  const animalSeats=cars.slice(1).map((car,i)=>({
    id:`coaster-${i+1}`,ride:'coaster',parent:car,position:[0,.120,-.023],rotationY:0,
    size:[.148,.140,.130,.144][i],species:['bear','corgi','rabbit','bear'][i],pose:'sit',
    outfit:['#82cbbd','#f3b1c3','#f1c477','#b3a4db'][i]
  }));

  // Lightweight instanced droplets are ballistic in the local radial frame.
  const rng=seeded(54017),dropCount=84,dropMaterial=new THREE.MeshBasicMaterial({color:'#d4ffff',transparent:true,opacity:.78,depthWrite:false});
  const drops=new THREE.InstancedMesh(new THREE.SphereGeometry(.012,5,4),dropMaterial,dropCount);drops.userData.dynamic=true;drops.frustumCulled=false;root.add(drops);
  const dropData=Array.from({length:dropCount},()=>({age:99,life:1,visible:false,p:new THREE.Vector3(),v:new THREE.Vector3(),up:new THREE.Vector3()}));
  const dropScale=new THREE.Vector3(),dropQ=new THREE.Quaternion(),zeroScale=new THREE.Vector3(0,0,0);
  for(let i=0;i<dropCount;i++)drops.setMatrixAt(i,matrix.makeScale(0,0,0));
  drops.visible=false;
  const ripples=[],rippleMaterial=new THREE.MeshBasicMaterial({color:'#e4ffff',transparent:true,opacity:.30,depthWrite:false,side:THREE.DoubleSide});
  for(let i=0;i<6;i++){
    const material=rippleMaterial.clone(),ring=mesh(root,new THREE.RingGeometry(.17,.180,38),material);ring.userData.dynamic=true;ring.visible=false;ripples.push({mesh:ring,age:99});
  }
  let distance=length*.48,speed=1,elapsed=0,dropCursor=0,rippleCursor=0,spawnCarry=0,lastRipple=-10,currentEvent='环星慢游',lastEvent='',eventAge=0;
  let splash=0,carouselPulse=0,ferrisPulse=0,lastLon=0;
  const positionScratch=new THREE.Vector3(),ringNormal=new THREE.Vector3(0,0,1);
  let poseInitialized=false;

  function update(dt,time,env={}){
    dt=Math.min(.06,Math.max(0,dt));elapsed=time;distance=(distance+dt*.77*speed)%length;eventAge+=dt;
    if(dt===0&&poseInitialized)return;
    poseInitialized=true;
    for(let i=0;i<carCount;i++){
      const u=(distance-i*carSpacing)/length;frame(u);cars[i].position.copy(p).addScaledVector(up,.027);
      cars[i].quaternion.setFromRotationMatrix(frameMatrix.makeBasis(side,up,tangent));
      if(i===0){headPose.position.copy(p).addScaledVector(up,.205);headPose.up.copy(up);headPose.tangent.copy(tangent);}
    }
    // Follow the actual curved rails ahead instead of staring along the local
    // tangent into the sky. The target stays low enough to reveal the route.
    frame((distance+.82)/length);headPose.lookAhead.copy(p).addScaledVector(up,.072);
    frame(distance/length);const lon=Math.atan2(p.x,p.z),height=p.length()-R;lastLon=lon;
    const inTunnel=wrap(distance/length)>tunnelStart&&wrap(distance/length)<tunnelEnd;
    const inWater=lon>.03&&lon<.77&&height<.098;
    const waveProximity=Math.exp(-Math.pow((lon+.32)/.30,2));
    const wheelProximity=Math.exp(-Math.pow((lon-1.10)/.31,2));
    carouselPulse=Math.max(carouselPulse-dt*.8,waveProximity);ferrisPulse=Math.max(ferrisPulse-dt*.7,wheelProximity);
    splash+=(Number(inWater)-splash)*Math.min(1,dt*7);
    currentEvent=inTunnel?'月石山的秘密隧道':inWater?'跃入星光泻湖':height>.68?'云端许愿坡':waveProximity>.65?'木马为你点亮':wheelProximity>.65?'摩天轮的光之回信':'环星慢游';
    if(currentEvent!==lastEvent){lastEvent=currentEvent;eventAge=0;}
    if(inWater&&dt>0){
      spawnCarry+=dt*82;
      while(spawnCarry>=1){
        spawnCarry--;const d=dropData[dropCursor++%dropCount],sign=rng()<.5?-1:1;
        d.age=0;d.life=.42+rng()*.44;d.up.copy(up);d.p.copy(p).addScaledVector(side,sign*.07).addScaledVector(up,.032);
        d.v.copy(side).multiplyScalar(sign*(.19+rng()*.35)).addScaledVector(up,.3+rng()*.35).addScaledVector(tangent,-.14-rng()*.20);
      }
      if(time-lastRipple>.18){
        lastRipple=time;const ripple=ripples[rippleCursor++%ripples.length];ripple.age=0;ripple.mesh.visible=true;
        ripple.mesh.position.copy(p).normalize().multiplyScalar(R+.052);ripple.mesh.quaternion.setFromUnitVectors(ringNormal,up);
      }
    }else spawnCarry=0;
    let changedDrops=false,liveDrops=0;
    for(let i=0;i<dropCount;i++){
      const d=dropData[i];if(d.age>=d.life&&!d.visible)continue;d.age+=dt;
      if(d.age>=d.life){matrix.compose(positionScratch.set(0,0,0),dropQ,zeroScale);d.visible=false;}
      else{d.visible=true;liveDrops++;d.v.addScaledVector(d.up,-dt*.92);d.p.addScaledVector(d.v,dt);const size=Math.sin(Math.PI*d.age/d.life)*(.75+i%3*.24);dropScale.set(size,size*1.9,size);matrix.compose(d.p,dropQ,dropScale);}
      drops.setMatrixAt(i,matrix);
      changedDrops=true;
    }
    drops.visible=liveDrops>0;if(changedDrops)drops.instanceMatrix.needsUpdate=true;
    for(const ripple of ripples){
      ripple.age+=dt;if(ripple.age>1.05){ripple.mesh.visible=false;continue;}
      ripple.mesh.scale.setScalar(.45+ripple.age*2.2);ripple.mesh.material.opacity=(1-ripple.age/1.05)*.40;
    }
  }
  update(0,0);
  return{
    root,curve,length,update,
    getAnimalSeats:()=>animalSeats,
    captureState(){return{version:1,distance,speed,elapsed,lastRipple,currentEvent,lastEvent,eventAge,splash,carouselPulse,ferrisPulse,lastLon};},
    restoreState(snapshot){
      if(!snapshot||snapshot.version!==1||![snapshot.distance,snapshot.speed,snapshot.elapsed,snapshot.lastRipple].every(Number.isFinite))return false;
      distance=wrap(snapshot.distance/length)*length;speed=THREE.MathUtils.clamp(snapshot.speed,.25,2.4);elapsed=snapshot.elapsed;lastRipple=snapshot.lastRipple;
      currentEvent=snapshot.currentEvent;lastEvent=snapshot.lastEvent;eventAge=snapshot.eventAge;splash=snapshot.splash;carouselPulse=snapshot.carouselPulse;ferrisPulse=snapshot.ferrisPulse;lastLon=snapshot.lastLon;
      spawnCarry=0;dropCursor=0;rippleCursor=0;
      for(const drop of dropData)drop.age=99;
      for(const ripple of ripples){ripple.age=99;ripple.mesh.visible=false;}
      poseInitialized=false;
      update(0,elapsed);return true;
    },
    setSpeed(value){speed=THREE.MathUtils.clamp(Number(value)||1,.25,2.4);},
    getRidePose(out={position:new THREE.Vector3(),up:new THREE.Vector3(),tangent:new THREE.Vector3(),lookAhead:new THREE.Vector3()}){out.position.copy(headPose.position);out.up.copy(headPose.up);out.tangent.copy(headPose.tangent);out.lookAhead.copy(headPose.lookAhead);return out;},
    getState(out={}){out.event=currentEvent;out.eventAge=eventAge;out.progress=distance/length;out.speed=speed;out.lapSeconds=length/(.77*speed);out.cars=carCount;out.splash=splash;out.carouselPulse=carouselPulse;out.ferrisPulse=ferrisPulse;out.longitude=lastLon;out.tunnel??=[tunnelStart,tunnelEnd];out.trackLength=length;return out;},
    landmarks:{coaster:{lat:-.20,lon:.39,height:.13},tunnel:{lat:.12,lon:-1.72,height:.55}}
  };
}
