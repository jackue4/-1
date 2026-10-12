import {THREE,R,anchor} from './core.js';
import {createParkAnimal} from './animal-model.js';

const UP=new THREE.Vector3(0,1,0);
const smooth=x=>x*x*(3-2*x);
// A round trip contains two walks and two unhurried pauses. It depends only on
// the world's visual clock, so a selector preview can never consume play time.
export function guestJourney(time,offset=0,period=72){
 const phase=((time+offset)%period+period)%period/period;
 let fraction,walk,direction,turn;
 if(phase<.4){fraction=smooth(phase/.4);walk=Math.sin(phase/.4*Math.PI);direction=1;turn=0;}
 else if(phase<.5){fraction=1;walk=0;direction=1;turn=smooth((phase-.4)/.1);}
 else if(phase<.9){fraction=1-smooth((phase-.5)/.4);walk=Math.sin((phase-.5)/.4*Math.PI);direction=-1;turn=1;}
 else{fraction=0;walk=0;direction=-1;turn=1+smooth((phase-.9)/.1);}
 return {fraction,walk,direction,turn,idle:walk<.03};
}

export function createFestivalAnimals({planet,palette,rides,world}){
 const root=new THREE.Group();root.name='今天来游园的小动物';root.userData.dynamic=true;planet.add(root);
 const riders=[],guests=[],species=['rabbit','bear','corgi'],outfits=['#eaa4b8','#9abfc9','#b3a2d4'];
 const n=new THREE.Vector3(),p=new THREE.Vector3(),tangent=new THREE.Vector3(),side=new THREE.Vector3(),basis=new THREE.Matrix4(),yaw=new THREE.Quaternion();
 let lastTime=0,night=0,showActive=false;
 for(const [i,seat] of rides.getAnimalSeats().entries()){
  const animal=createParkAnimal({palette,species:seat.species||species[i%3],outfit:seat.outfit||outfits[i%3],pose:'sit',size:seat.size});
  animal.root.position.set(...seat.position);animal.root.rotation.y=seat.rotationY||0;animal.root.name=`游园乘客 · ${seat.id}`;seat.parent.add(animal.root);riders.push({animal,seat,phase:i*.73});
 }
 function addGuest({id,kind='promenade',species:kindOfAnimal,offset=0,size=.20,accessory='none',position,angle=0}){
  const holder=new THREE.Group();holder.name=id;holder.userData.dynamic=true;root.add(holder);
  const animal=createParkAnimal({palette,species:kindOfAnimal,outfit:outfits[guests.length%3],pose:'walk',size,accessory});holder.add(animal.root);
  const guest={id,kind,animal,holder,offset,position,angle,zone:guests.length,state:'散步'};guests.push(guest);return guest;
 }
 addGuest({id:'棉棉 · 湖边散步',species:'rabbit',offset:4,accessory:'balloon',size:.22});
 addGuest({id:'麦麦 · 慢慢逛园',species:'bear',offset:28,accessory:'icecream',size:.22});
 addGuest({id:'阿栗 · 追着风走',species:'corgi',offset:53,size:.205});
 addGuest({id:'棉棉 · 玫瑰花园',kind:'garden',species:'rabbit',offset:0,size:.185});
 addGuest({id:'麦麦 · 玫瑰花园',kind:'garden',species:'bear',offset:19,size:.19,accessory:'icecream'});
 // A pair of spectators waits just outside the flying chairs' swept envelope.
 for(let i=0;i<2;i++){
  const g=addGuest({id:i?'阿栗 · 给朋友挥手':'棉棉 · 等下一趟飞椅',kind:'spectator',species:i?'corgi':'rabbit',offset:i*7,size:.19,position:[.65,.065,i*.20-.10],angle:-Math.PI/2});
  const stand=anchor(root,.15,2.2,.055);stand.add(g.holder);
  const [x,,z]=g.position,y=Math.sqrt((R+.024)**2-x*x-z*z)-(R+.055);
  g.holder.position.set(x,y,z);g.holder.quaternion.setFromUnitVectors(UP,new THREE.Vector3(x,R+.055+y,z).normalize());g.holder.rotateY(g.angle);
 }
 function placeOnPromenade(guest,j){
  // Separate strolls leave room to turn and wave without guests walking
  // through each other on the narrow model-scale footpath.
  const zones=[[.375,.495],[.536,.650],[.690,.779]],range=zones[guest.zone];
  const curve=world.guestPaths.promenade,u=range[0]+j.fraction*(range[1]-range[0]);
  curve.getPoint(u,p);n.copy(p).normalize();p.copy(n).multiplyScalar(R+.112);
  curve.getTangent(u,tangent);tangent.addScaledVector(n,-tangent.dot(n)).normalize();
  side.crossVectors(n,tangent).normalize();basis.makeBasis(side,n,tangent);
  guest.holder.position.copy(p);guest.holder.quaternion.setFromRotationMatrix(basis);
  yaw.setFromAxisAngle(UP,j.turn*Math.PI);guest.holder.quaternion.multiply(yaw);
 }
 function placeInGarden(guest,j,index){
  // Two disjoint arcs keep friends apart and clear of the lamps and benches.
  const angle=(index===0?-.50:.14)+j.fraction*.36;
  p.set(Math.sin(angle)*.435,.074,Math.cos(angle)*.435);
  world.guestPaths.roseGarden.updateWorldMatrix(true,false);
  p.applyMatrix4(world.guestPaths.roseGarden.matrixWorld);root.worldToLocal(p);guest.holder.position.copy(p);
  guest.holder.quaternion.copy(world.guestPaths.roseGarden.quaternion);
  yaw.setFromAxisAngle(UP,Math.PI/2+angle+j.turn*Math.PI);guest.holder.quaternion.multiply(yaw);
 }
 function update(time,env={},show={}){
  lastTime=time;night=env.night||0;showActive=!!show.active&&!env.preview;
  for(const {animal,seat,phase} of riders){
   const wave=seat.ride==='coaster'?.5:seat.ride==='ferris'?.65:seat.ride==='swings'?.28:.18;
   animal.animate(time+phase,{walk:0,wave,cheer:seat.ride==='coaster'?.72:showActive?.30:0});
  }
  let gardenIndex=0;
  for(const guest of guests){
   const j=guestJourney(time,guest.offset,guest.kind==='garden'?46:42);
   if(guest.kind==='promenade')placeOnPromenade(guest,j);
   else if(guest.kind==='garden')placeInGarden(guest,j,gardenIndex++);
   const stationary=guest.kind==='spectator'||j.idle;
   guest.state=showActive&&stationary?'抬头看烟花':stationary?'停下来挥手':guest.kind==='garden'?'看花散步':'沿湖散步';
   guest.animal.animate(time+guest.offset,{walk:stationary?0:j.walk,wave:stationary?.8:.05,cheer:showActive&&stationary?.9:0});
  }
 }
 function getState(){return {total:riders.length+guests.length,riders:riders.length,roaming:guests.length,time:lastTime,night,showActive,byRide:riders.reduce((a,{seat})=>(a[seat.ride]=(a[seat.ride]||0)+1,a),{}),guests:guests.map(g=>({id:g.id,activity:g.state,position:g.holder.position.toArray()}))};}
 update(0);
 return{root,update,getState,getSubjects:()=>[...riders.map(r=>({id:r.seat.id,ride:r.seat.ride,root:r.animal.root})),...guests.map(g=>({id:g.id,ride:null,root:g.animal.root}))],dispose(){for(const {animal} of [...riders,...guests]){animal.root.removeFromParent();animal.dispose?.();}root.removeFromParent();}};
}
