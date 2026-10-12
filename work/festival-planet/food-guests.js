import {createParkAnimal} from './animal-model.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const PERIOD=64,FLOOR=.014;
const clamp=x=>Math.min(1,Math.max(0,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
const angleMix=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const modulo=(a,b)=>(a%b+b)%b;

/** Four guests share two disjoint, timed queue loops. All motion comes from
 * absolute visual time, including the food, blinks and the waiting gestures. */
export function createFoodGuests({THREE,palette,parent}){
 const root=new THREE.Group();root.name='小吃广场 · 排队与尝鲜';root.userData.dynamic=true;parent.add(root);
 const material=palette.m('#ffffff').clone();material.vertexColors=true;
 const guests=[],foodMeshes=[];
 let lastTime=0,disposed=false;
 function food(kind){
  const parts=[];
  function add(source,color,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
   const geometry=source.index?source.toNonIndexed():source;if(geometry!==source)source.dispose();
   geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale)));
   for(const key of Object.keys(geometry.attributes))if(!['position','normal'].includes(key))geometry.deleteAttribute(key);
   const rgb=new Float32Array(geometry.attributes.position.count*3),c=new THREE.Color(color);
   for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}
   geometry.setAttribute('color',new THREE.BufferAttribute(rgb,3));geometry.clearGroups();parts.push(geometry);
  }
  const ball=(color,p,s)=>add(new THREE.SphereGeometry(1,14,10),color,p,s);
  if(kind==='hotdog'){
   // The base is a paper sleeve; the two buns leave the sausage and mustard
   // visible from the normal raised-paw viewing angle.
   ball('#fff1d9',[0,-.015,0],[.114,.036,.066]);
   for(const z of [-.037,.037])ball('#edb975',[0,.014,z],[.116,.044,.030]);
   ball('#b95f4c',[0,.038,0],[.124,.031,.026]);
   const mustard=[];
   for(let i=0;i<=16;i++)mustard.push(new THREE.Vector3(-.092+i*.0115,.067,Math.sin(i*Math.PI*.5)*.014));
   add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mustard),32,.006,5,false),'#f9d576');
   for(let i=0;i<8;i++)ball('#fff0bc',[-.083+(i%4)*.050,.048,i<4?-.047:.047],[.008,.004,.004]);
   add(new THREE.BoxGeometry(.078,.037,.127),'#e6aaa5',[0,-.020,0]);
  }else{
   add(new THREE.ConeGeometry(.043,.133,12),'#d7a169',[0,.021,0],[1,1,1],[Math.PI,0,0]);
   add(new THREE.TorusGeometry(.040,.006,5,14),'#f1c996',[0,.081,0],[1,1,1],[Math.PI/2,0,0]);
   ball('#f3b4c3',[0,.113,0],[.063,.061,.060]);
   ball('#fff0da',[.012,.160,.002],[.047,.044,.047]);
   for(let i=0;i<7;i++){const a=i*2.4;ball(i%2?'#e8a862':'#bd85b5',[Math.cos(a)*.033,.191-Math.sin(i)*.010,Math.sin(a)*.031],[.006,.004,.005]);}
   ball('#d57687',[.009,.201,.005],[.013,.013,.013]);
  }
  const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  const mesh=new THREE.Mesh(geometry,material);mesh.name=kind==='hotdog'?'爪心里的芝士热狗':'爪心里的双球冰淇淋';mesh.castShadow=true;mesh.receiveShadow=true;
  // Both props are authored around the gripping center of the actual paw.
  mesh.position.set(.046,-.091,.092);foodMeshes.push(mesh);return mesh;
 }
 const lanes={
  hotdog:{x:-.12,z:.35,side:-.40,offset:11,label:'热狗车'},
  icecream:{x:.47,z:.32,side:.75,offset:13,label:'冰淇淋摊'},
 };
 for(const [kind,lane] of Object.entries(lanes)){
  lane.exit=new THREE.CatmullRomCurve3([
   new THREE.Vector3(lane.x,0,lane.z),new THREE.Vector3(mix(lane.x,lane.side,.60),0,lane.z+.045),new THREE.Vector3(lane.side,0,.45),new THREE.Vector3(lane.side,0,.62),
  ],false,'centripetal');
  lane.back=new THREE.CatmullRomCurve3([
   new THREE.Vector3(lane.side,0,.62),new THREE.Vector3(lane.side,0,.80),new THREE.Vector3(mix(lane.side,lane.x,.48),0,.875),new THREE.Vector3(lane.x,0,.84),new THREE.Vector3(lane.x,0,.69),
  ],false,'centripetal');
  const pair=kind==='hotdog'?[['rabbit','棉棉','#e9adc4',.235],['bear','麦麦','#8dbdaa',.24]]:[['corgi','阿栗','#a9bad5',.232],['cat','露露','#ccb0d0',.232]];
  for(const [i,[species,name,outfit,size]] of pair.entries()){
   const holder=new THREE.Group();holder.name=`${name} · ${lane.label}顾客`;root.add(holder);
   const actor=createParkAnimal({palette,species,outfit,pose:'walk',size});holder.add(actor.root);
   const paw=actor.root.getObjectByName('Right sleeve and paw'),head=actor.root.getObjectByName('Face and ears');
   const prop=food(kind);paw.add(prop);
   const feet=['Left foot','Right foot'].map(n=>actor.root.getObjectByName(n));
   // A 129-entry support table keeps the lowest sole on the paving as the
   // existing rig swings its feet. This avoids geometry scans every frame.
   const soleTables=feet.map(foot=>{
    const pos=foot.geometry.attributes.position,table=new Float32Array(129);
    for(let j=0;j<table.length;j++){const a=-.42+j*.84/128,c=Math.cos(a),s=Math.sin(a);let min=Infinity;for(let k=0;k<pos.count;k++)min=Math.min(min,pos.getY(k)*c-pos.getZ(k)*s);table[j]=min+foot.position.y;}
    return table;
   });
   guests.push({id:`food-${species}`,name,species,kind,lane,actor,holder,paw,head,prop,feet,soleTables,size,offset:lane.offset+i*PERIOD/2,phase:0,activity:'排队等候',walk:0,food:false});
  }
 }
 const p=new THREE.Vector3(),tangent=new THREE.Vector3();
 function sample(guest,time){
  const lane=guest.lane,phase=modulo(time+guest.offset,PERIOD);let yaw=Math.PI,walk=0,activity='排队等候',wave=0;
  p.set(lane.x,FLOOR,.69);
  if(phase<6){
   // A small glance toward the counter makes the back of the line feel alive.
   yaw=Math.PI+Math.sin(phase*.65)*Math.sin(phase/6*Math.PI)**2*.10;
  }else if(phase<11){
   const u=(phase-6)/5;p.z=mix(.69,lane.z,smooth(u));walk=Math.sin(u*Math.PI)*.8;activity='往前挪一步';
  }else if(phase<17){
   p.z=lane.z;activity=phase<14?'挥手点单':'接过点心';wave=phase<14?Math.sin((phase-11)/3*Math.PI)*.74:0;
   // Face the exit before starting to walk, while the feet are stationary.
   const turn=smooth((phase-15.2)/1.8);lane.exit.getTangent(0,tangent);yaw=angleMix(Math.PI,Math.atan2(tangent.x,tangent.z),turn);
  }else if(phase<24){
   const u=(phase-17)/7;lane.exit.getPoint(smooth(u),p);p.y=FLOOR;lane.exit.getTangent(smooth(u),tangent);yaw=Math.atan2(tangent.x,tangent.z);walk=Math.sin(u*Math.PI)*.85;activity='带着点心走到一旁';
  }else if(phase<34){
   p.set(lane.side,FLOOR,.62);yaw=0;activity=phase<32?'开心地尝一口':'收好包装';
  }else if(phase<42){
   const u=(phase-34)/8;lane.back.getPoint(smooth(u),p);p.y=FLOOR;lane.back.getTangent(smooth(u),tangent);yaw=Math.atan2(tangent.x,tangent.z);walk=Math.sin(u*Math.PI)*.8;activity='沿外圈回到队尾';
  }
  const foodScale=smooth((phase-14)/1.0)*(1-smooth((phase-31.5)/2.0));
  return{phase,yaw,walk,activity,wave,foodScale,position:p};
 }
 function soleHeight(guest,index){
  const table=guest.soleTables[index],u=clamp((guest.feet[index].rotation.x+.42)/.84)*128,i=Math.min(127,Math.floor(u));return mix(table[i],table[i+1],u-i);
 }
 function update(time,env={}){
  lastTime=Number.isFinite(time)?time:0;
  for(const guest of guests){
   const pose=sample(guest,lastTime);guest.phase=pose.phase;guest.activity=pose.activity;guest.walk=pose.walk;guest.food=pose.foodScale>.01;
   guest.holder.position.copy(pose.position);guest.holder.rotation.set(0,pose.yaw,0);
   guest.actor.animate(lastTime+guest.offset,{walk:pose.walk,wave:pose.wave,cheer:0});
   const eating=smooth((pose.phase-24)/1.5)*(1-smooth((pose.phase-31)/1)),bite=(.5+.5*Math.sin(lastTime*1.8+guest.offset))*eating;
   const hold=smooth((pose.phase-13.4)/1.5)*(1-smooth((pose.phase-32.5)/1.2));
   guest.paw.rotation.x=mix(guest.paw.rotation.x,-.72-bite*.38,hold);
   guest.paw.rotation.z=mix(guest.paw.rotation.z,.13,hold);
   guest.head.rotation.x+=bite*.07;guest.head.rotation.z+=eating*Math.sin(lastTime*1.3)*.055;
   guest.prop.visible=guest.food;guest.prop.scale.setScalar(pose.foodScale);
   // Dynamic roots retain exact ground contact even with the inherited stride.
   guest.actor.root.position.y=-Math.min(soleHeight(guest,0),soleHeight(guest,1))*guest.size;
  }
 }
 function getState(){return{time:lastTime,total:guests.length,period:PERIOD,queues:{hotdog:2,icecream:2},guests:guests.map(g=>({id:g.id,name:g.name,species:g.species,queue:g.kind,phase:g.phase,activity:g.activity,holdingFood:g.food,walking:g.walk>.015,position:g.holder.position.toArray(),yaw:g.holder.rotation.y}))};}
 update(0);
 return{root,update,getState,getSubjects:()=>guests.map(g=>({id:g.id,name:g.name,species:g.species,queue:g.kind,root:g.holder,actor:g.actor.root})),dispose(){
  if(disposed)return;disposed=true;
  // Detach module-owned props before the actors recursively release their rigs.
  for(const prop of foodMeshes){prop.removeFromParent();prop.geometry.dispose();}
  for(const guest of guests)guest.actor.dispose();material.dispose();root.removeFromParent();
 }};
}
