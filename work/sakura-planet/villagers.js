import * as THREE from 'three';
import {plushMaterial,plushGeometry,createTufts} from './plush-fur.js';
export const VILLAGERS=[
 {name:'棉棉',species:'垂耳兔',fur:'#e7d9c5',shirt:'#91bdb0',job:'园艺师'},
 {name:'麦麦',species:'小熊',fur:'#caa779',shirt:'#ccac71',job:'木匠'},
 {name:'阿栗',species:'柯基',fur:'#e6ab53',shirt:'#be6e57',job:'搬运员'},
];
export function createVillager(i,{mesh,sphere,cyl,cone,box,stem}){
 const identity=VILLAGERS[i],body=new THREE.Group(),head=new THREE.Group(),tail=new THREE.Group(),core=plushGeometry(20,12),puff=plushGeometry(12,8),medium=plushGeometry(14,8),small=new THREE.SphereGeometry(1,12,8),cream='#f2e8d1';
 function fur(parent,color,p,s,count=0){const mat=plushMaterial(color),o=mesh(parent,Math.max(...s)>=.105?core:Math.max(...s)>.072?medium:puff,mat,p,s);if(count){const fringe=mesh(parent,createTufts(s,count,i*.7),mat,p,[1,1,1],false);fringe.userData.fur=true;}return o;}
 // A pear-shaped body, large cheeks and short paws give the animals a plush silhouette.
 fur(body,identity.fur,[0,.175,0],[.115,.145,.091],250);
 fur(body,cream,[0,.163,.065],[.09,.114,.038],100);
 head.position.set(0,.342,.01);body.add(head);
 const face=fur(head,identity.fur,[0,0,0],[.127,.112,.105],280);
 if(i===2){
   const orange=new THREE.Color(identity.fur),white=new THREE.Color(cream),tint=new THREE.Color();
   for(const object of [face,...head.children.filter(o=>o.userData.fur)]){object.geometry=object.geometry.clone();object.material=plushMaterial('#ffffff');const p=object.geometry.attributes.position,c=object.geometry.attributes.color;
     for(let j=0;j<p.count;j++){const x=p.getX(j)/(object===face?1:.127),y=p.getY(j)/(object===face?1:.112),z=p.getZ(j)/(object===face?1:.105),stripe=(1-THREE.MathUtils.smoothstep(Math.abs(x),.12,.24))*THREE.MathUtils.smoothstep(z,.55,.75)*THREE.MathUtils.smoothstep(y,-.18,.05);tint.copy(orange).lerp(white,stripe);c.setXYZ(j,tint.r,tint.g,tint.b);}
   }
 }

 // Cheek volumes sit in front of the head, rather than a flat painted mouth.
 for(const side of [-1,1])fur(head,cream,[side*.041,-.035,.087],[.054,.044,.045],45);
 
 if(i===4)for(const side of [-1,1])mesh(head,small,'#6f7166',[side*.047,.019,.09],[.038,.031,.013]);
 const eyeMaterial=new THREE.MeshStandardMaterial({color:'#302c26',roughness:.22,metalness:0});
 for(const side of [-1,1]){
   mesh(head,small,'#ad9778',[side*.046,.024,.094],[.020,.025,.014],false);
   mesh(head,small,eyeMaterial,[side*.046,.025,.098],[.015,.020,.012]);
   mesh(head,small,'#fffbea',[side*.046-.004,.032,.109],[.0046,.006,.0025],false);
   mesh(head,small,'#f0bdad',[side*.081,-.025,.091],[.017,.008,.005],false);
 }
 const nose=new THREE.MeshStandardMaterial({color:i===0?'#b98985':'#494237',roughness:.5});mesh(head,small,nose,[0,-.026,.136],[i===2?.028:.019,.018,.016]);
 mesh(head,small,'#8e7564',[0,-.055,.122],[.007,.006,.004],false);
 for(const side of [-1,1]){
   const ear=new THREE.Group();head.add(ear);ear.position.set(side*.08,.073,-.01);
   if(i===0){ear.rotation.z=-side*.30;fur(ear,identity.fur,[0,.065,0],[.038,.09,.028],50);fur(ear,'#ddb5ad',[0,.065,.026],[.020,.060,.005]);}
   else if(i===2||i===3){ear.rotation.z=-side*.25;fur(ear,identity.fur,[0,.037,0],[.049,i===2?.062:.051,.032],60);fur(ear,'#ebcead',[0,.040,.028],[.029,i===2?.040:.032,.006]);}
   else {fur(ear,identity.fur,[side*.025,.008,0],[.040,.039,.032],40);fur(ear,'#e4c7a4',[side*.025,.008,.026],[.021,.023,.008]);}
   if(i===5){stem(head,[side*.048,.082,-.035],[side*.060,.157,-.039],.007,'#af9470');stem(head,[side*.056,.124,-.035],[side*.085,.145,-.02],.006,'#af9470');}
 }
 // A small soft collar and round token retain personality without covering fur.
 mesh(body,new THREE.TorusGeometry(.098,.012,6,24),i===2?'#b95749':identity.shirt,[0,.268,.014]).rotation.x=Math.PI/2;
 mesh(body,cyl,'#e9ca79',[0,.249,.122],[.018,.007,.018]).rotation.x=Math.PI/2;
 tail.position.set(0,.13,-.089);body.add(tail);fur(tail,identity.fur,[i===2?.017:0,0,-.024],[i===2?.037:.038,.038,i===4?.081:.042],70);
 if(i===4)for(let j=0;j<3;j++)mesh(tail,small,'#7f8276',[0,0,-.05+j*.034],[.039,.039,.011]);
 const limbs=[];
 for(const side of [-1,1]){
   const leg=new THREE.Group();leg.position.set(side*.060,.08,.003);body.add(leg);fur(leg,identity.fur,[0,-.018,0],[.044,.058,.045],45);fur(leg,cream,[0,-.044,.023],[.045,.029,.052],25);limbs.push(leg);
   const arm=new THREE.Group();arm.position.set(side*.100,.251,0);arm.rotation.z=side*.13;body.add(arm);fur(arm,identity.fur,[side*.014,-.047,.008],[.044,.068,.04],55);fur(arm,cream,[side*.017,-.09,.018],[.039,.036,.04],25);limbs.push(arm);
 }
  const carry=new THREE.Group();carry.position.set(0,.175,.12);body.add(carry);
  for(let j=0;j<3;j++)mesh(carry,box,j%2?'#d2b887':'#bd9d6b',[0,j*.025,0],[.23,.022,.066]);carry.visible=false;
  const hammer=new THREE.Group();limbs[3].add(hammer);
  mesh(hammer,cyl,'#b8a278',[0,-.12,.015],[.009,.10,.009]);mesh(hammer,box,'#8da7a0',[0,-.174,.015],[.078,.034,.038]);hammer.visible=false;
  const umbrella=new THREE.Group();umbrella.position.set(.105,0,0);body.add(umbrella);
  mesh(umbrella,cyl,'#c5b791',[0,.4,0],[.007,.42,.007]);mesh(umbrella,new THREE.SphereGeometry(.205,10,5,0,Math.PI*2,0,Math.PI/2),i%2?'#b1c6b5':'#d8b2a4',[0,.61,0],[1,.4,1]);umbrella.visible=false;
  const farmBall=new THREE.SphereGeometry(1,8,5);
  const watering=new THREE.Group();limbs[3].add(watering);watering.position.set(0,-.12,.06);
  mesh(watering,cyl,'#8ebbb2',[0,0,0],[.033,.046,.032]);stem(watering,[.02,0,0],[.078,.016,.01],.011,'#8ebbb2');mesh(watering,farmBall,'#d4ddbd',[.08,.016,.01],[.019,.008,.017]);watering.visible=false;
  const waterDrops=new THREE.Group();watering.add(waterDrops);for(let j=0;j<5;j++)mesh(waterDrops,farmBall,'#b9e6e4',[.082+j*.004,-.015-j*.018,.01+(j%2)*.01],[.003,.008,.003]);waterDrops.visible=false;
  const basket=new THREE.Group();body.add(basket);basket.position.set(0,.14,.13);mesh(basket,cyl,'#d1ac72',[0,0,0],[.066,.055,.052]);for(let j=0;j<3;j++)mesh(basket,farmBall,'#e6866e',[(j-1)*.032,.033,0],[.023,.025,.025]);basket.visible=false;
  return{...identity,body,head,tail,limbs,carry,hammer,umbrella,watering,waterDrops,basket};
}
