import * as THREE from 'three';
import {sampleWater} from './nature.js';

// One existing neighbour owns this quiet shore spot; no extra resident is spawned.
function createFishingSpot({planet,lake,shoreNormal,navigation,height,R,mesh,cyl,box,sphere,stem,spotNormal}){
  const up=new THREE.Vector3(0,1,0);
  const normal=spotNormal;
  const root=new THREE.Group();root.name='Quiet fishing bay';planet.add(root);
  root.position.copy(normal).multiplyScalar(height(normal));root.quaternion.setFromUnitVectors(up,normal);
  const facing=lake.clone().sub(normal).applyQuaternion(root.quaternion.clone().invert());
  const heading=Math.atan2(facing.x,facing.z);root.rotateY(heading);
  const stool=new THREE.Group();root.add(stool);
  mesh(stool,cyl,'#d7b181',[0,.09,0],[.092,.03,.085]);
  for(const x of [-.055,.055])for(const z of [-.05,.05])stem(stool,[x,.077,z],[x*1.18,.002,z*1.18],.012,'#a77a52');
  stem(stool,[-.06,.03,-.05],[.06,.03,-.05],.007,'#bf9769');
  // A small bait box and enamel bucket keep the shore inhabited without clutter.
  mesh(root,box,'#b68f66',[-.22,.039,-.015],[.13,.07,.09]);
  mesh(root,box,'#e0c298',[-.22,.078,-.015],[.14,.014,.10]);
  const bucket=new THREE.Group();bucket.position.set(.21,.005,.045);root.add(bucket);
  mesh(bucket,new THREE.CylinderGeometry(.041,.032,.071,16,1,true),'#8daea4',[0,.038,0]);
  mesh(bucket,cyl,'#b4d6ce',[0,.046,0],[.036,.003,.036],false);
  mesh(bucket,new THREE.TorusGeometry(.043,.004,5,20),'#e5dbc3',[0,.074,0]).rotation.x=Math.PI/2;
  const handle=mesh(bucket,new THREE.TorusGeometry(.04,.003,4,16,Math.PI),'#a3b7ad',[0,.087,0]);
  handle.rotation.z=0;
  const tackle=new THREE.Group();root.add(tackle);
  const rod=new THREE.Group();tackle.add(rod);
  const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(.115,.29,.09),new THREE.Vector3(.11,.65,.43),new THREE.Vector3(.08,.65,.78));
  mesh(rod,new THREE.TubeGeometry(curve,14,.0055,6,false),'#b89058');
  for(const u of [.13,.35,.58,.8])mesh(rod,sphere,'#ead3a0',curve.getPoint(u).toArray(),[.009,.009,.009]);
  mesh(rod,cyl,'#826747',[.115,.30,.11],[.011,.074,.011]).rotation.x=-.5;
  const floatNormal=normal.clone().lerp(lake,.48).normalize();
  const bobber=new THREE.Group();planet.add(bobber);root.userData.floatNormal=floatNormal.toArray();
  mesh(bobber,sphere,'#f4e9cd',[0,.016,0],[.017,.021,.017],false);
  mesh(bobber,sphere,'#d1846b',[0,.032,0],[.013,.012,.013],false);
  mesh(bobber,cyl,'#ba8e59',[0,.06,0],[.002,.035,.002],false);
  const rings=[];
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(.032,.037,32),new THREE.MeshBasicMaterial({color:'#e0f7e5',transparent:true,opacity:.4,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.007;bobber.add(ring);rings.push(ring);}
  const positions=new Float32Array(27),lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:'#f3e8cb',transparent:true,opacity:.82}));line.frustumCulled=false;tackle.add(line);
  const fish=new THREE.Group();tackle.add(fish);
  mesh(fish,sphere,'#aacbc0',[0,0,0],[.037,.022,.018],false);
  const fin=mesh(fish,new THREE.ConeGeometry(.022,.037,8),'#7fae9f',[-.044,0,0],[1,1,.4],false);fin.rotation.z=-Math.PI/2;
  mesh(fish,sphere,'#435b56',[.022,.007,.014],[.004,.004,.003],false);
  const splash=new THREE.Group();bobber.add(splash);const drops=[];
  for(let i=0;i<7;i++)drops.push(mesh(splash,sphere,'#dff4df',[0,0,0],[.008,.011,.008],false));
  let seated=false,available=true,bite=false;
  const tip=new THREE.Vector3(),end=new THREE.Vector3(),point=new THREE.Vector3(),inverse=new THREE.Quaternion();
  function pose(i,env){available=env.night<.58&&env.rain<.35&&env.snow<.35;return i===2&&available?{normal,lookAt:lake,mode:'fishing'}:null;}
  function update(t,actor,active,wind=.7,age=0){
    seated=!!active;const sway=Math.sin(t*.85)*.018;rod.rotation.x=sway;
    tackle.visible=bobber.visible=seated;
    const cycle=age%22,cast=cycle<2,reel=cycle>15&&cycle<18,cheer=cycle>=18&&cycle<20;
    bite=cycle>=13&&cycle<=15;
    const lift=reel?Math.sin((cycle-15)/3*Math.PI)*.42:0;
    rod.rotation.x=sway+(cast?-.48*Math.sin(cycle/2*Math.PI):reel?-.33*Math.sin((cycle-15)/3*Math.PI):0);
    const dip=bite?Math.sin(t*10)*.009:Math.sin(t*2.2)*.002;
    point.copy(floatNormal).multiplyScalar(R);const wave=sampleWater(point,R-height(floatNormal),t,wind);
    bobber.position.copy(floatNormal).multiplyScalar(R+.015+dip+wave);bobber.quaternion.setFromUnitVectors(up,floatNormal);
    if(!seated)return;
    actor.body.position.y=.066;actor.body.rotation.z=Math.sin(t*.7)*.012;actor.body.rotation.y=actor.heading=heading;
    actor.limbs[0].rotation.x=actor.limbs[2].rotation.x=-1.25;
    actor.limbs[1].rotation.x=cheer?-1.5+Math.sin(t*6)*.3:-.8;actor.limbs[3].rotation.x=-1.13+rod.rotation.x;
    if(cheer)actor.body.position.y+=Math.abs(Math.sin(t*5))*.018;
    actor.head.rotation.x=.12+Math.sin(t*.8)*.025;
    tip.copy(curve.v2).applyEuler(rod.rotation);
    inverse.copy(root.quaternion).invert();end.copy(bobber.position).sub(root.position).applyQuaternion(inverse);end.y+=.063+lift;
    if(cast)end.lerp(tip,1-THREE.MathUtils.smoothstep(cycle,0,1.5));
    fish.visible=reel;fish.position.copy(end);fish.rotation.z=Math.sin(t*16)*.4;fish.rotation.y=t*4;
    splash.visible=bite||reel;drops.forEach((d,i)=>{const f=(t*1.4+i/7)%1,a=i*2.399;d.position.set(Math.sin(a)*f*.10,Math.sin(f*Math.PI)*.10,Math.cos(a)*f*.10);d.scale.set(.008,.011,.008).multiplyScalar(1-f*.65);});
    bobber.children.slice(0,3).forEach(o=>o.visible=!reel&&!cast);
    for(let i=0;i<9;i++){const f=i/8;point.copy(tip).lerp(end,f);point.y-=Math.sin(f*Math.PI)*.075;point.toArray(positions,i*3);}lineGeo.attributes.position.needsUpdate=true;
    rings.forEach((r,i)=>{const f=(t*.43+i/3)%1;r.scale.setScalar(1+f*(bite?4:2.4));r.material.opacity=(1-f)*(bite?.6:.28);});
  }
  return{root,bobber,normal,heading,pose,update,getState:()=>({resident:2,bay:1,seated,available,bite,normal:normal.toArray(),waterDepth:R-height(floatNormal)})};
}

export function createFishingBay(args){
  const {planet,shoreNormal,navigation}=args;
  const candidates=Array.from({length:64},(_,i)=>shoreNormal(1,i*Math.PI/32,.065)).filter(n=>!navigation.blocked(n)&&navigation.safeGoal(n).distanceTo(n)<.001&&n.distanceTo(shoreNormal(1,2.4,.09))>.25);
  const first=candidates[0]||navigation.safeGoal(shoreNormal(1,0,.065)),normals=[first];
  for(const n of candidates){if(normals.length===3)break;const d=n.distanceTo(first);if(d>.17&&d<.62&&normals.every(p=>p.distanceTo(n)>.17)&&navigation.route(first,n).length)normals.push(n);}
  const root=new THREE.Group();root.name='Three shore fishing spots';planet.add(root);
  const spots=normals.map(spotNormal=>createFishingSpot({...args,planet:root,spotNormal}));
  let index=0,changes=0,seatedAt=null,available=true,seated=false,age=0;
  const labels={cast:'轻轻抛出鱼线',wait:'坐在小凳子上，等鱼儿咬钩',bite:'浮漂动啦，盯紧一点',reel:'提起鱼竿，鱼儿跃出水面',cheer:'开心地晃晃小爪子',walking:'沿着海岸换个钓点'};
  function animation(){if(!seated)return'walking';const c=age%22;return c<2?'cast':c<13?'wait':c<=15?'bite':c<18?'reel':c<20?'cheer':'wait';}
  return{root,normals,get frame(){return spots[index].root;},get normal(){return spots[index].normal;},get heading(){return spots[index].heading;},get bobber(){return spots[index].bobber;},
    pose(i,env){available=env.night<.58&&env.rain<.35&&env.snow<.35;return i===2&&available?{normal:spots[index].normal,lookAt:args.lake,mode:'fishing'}:null;},
    update(t,actor,active,wind){
      seated=!!active&&available;
      if(seated){if(seatedAt===null)seatedAt=t;age=t-seatedAt;}else{seatedAt=null;age=0;}
      // Move only the goal. The villager walks there through the same collision-aware navigation as homecoming.
      if(seated&&age>44+(changes%3)*7&&spots.length>1){index=(index+1)%spots.length;changes++;seated=false;seatedAt=null;age=0;}
      spots.forEach((s,i)=>s.update(t,actor,seated&&i===index,wind,age));
    },
    getState(){return{...spots[index].getState(),seated,available,spot:index,spotCount:spots.length,changes,animation:animation(),activity:labels[animation()],seatedSeconds:age};}
  };
}
