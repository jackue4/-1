const fs=require('fs'),p='work/planet-v2/';let s=fs.readFileSync(p+'villagers.js','utf8');const tools=s.slice(s.indexOf('  const carry=new THREE.Group();'));const top=`import * as THREE from 'three';
import {plushMaterial,plushGeometry,createTufts} from './plush-fur.js';
export const VILLAGERS=[
 {name:'棉棉',species:'垂耳兔',fur:'#e7d9c5',shirt:'#91bdb0',job:'园艺师'},
 {name:'麦麦',species:'小熊',fur:'#caa779',shirt:'#ccac71',job:'木匠'},
 {name:'阿栗',species:'柯基',fur:'#e6ab53',shirt:'#be6e57',job:'搬运员'},
 {name:'桃桃',species:'奶油猫',fur:'#ddc7ad',shirt:'#c3939f',job:'花艺师'},
 {name:'团团',species:'小浣熊',fur:'#b2aea0',shirt:'#92a47b',job:'建筑师'},
 {name:'小枝',species:'小鹿',fur:'#c9a27d',shirt:'#a2aeca',job:'油漆匠'},
];
export function createVillager(i,{mesh,sphere,cyl,cone,box,stem}){
 const identity=VILLAGERS[i],body=new THREE.Group(),head=new THREE.Group(),tail=new THREE.Group(),core=plushGeometry(),small=new THREE.SphereGeometry(1,12,8),cream='#f2e8d1';
 function fur(parent,color,p,s,count=0){const mat=plushMaterial(color),o=mesh(parent,core,mat,p,s);if(count){const fringe=mesh(parent,createTufts(s,count,i*.7),mat,p,[1,1,1],false);fringe.userData.fur=true;}return o;}
 // A pear-shaped body, large cheeks and short paws give the animals a plush silhouette.
 fur(body,identity.fur,[0,.175,0],[.115,.145,.091],250);
 fur(body,cream,[0,.163,.065],[.09,.114,.038],100);
 head.position.set(0,.342,.01);body.add(head);
 fur(head,identity.fur,[0,0,0],[.127,.112,.105],280);
 // Cheek volumes sit in front of the head, rather than a flat painted mouth.
 for(const side of [-1,1])fur(head,cream,[side*.041,-.035,.087],[.054,.044,.045],45);
 if(i===2){fur(head,cream,[0,.037,.095],[.029,.076,.016],30);}
 if(i===4)for(const side of [-1,1])mesh(head,small,'#6f7166',[side*.047,.019,.09],[.038,.031,.013]);
 const eyeMaterial=new THREE.MeshStandardMaterial({color:'#302c26',roughness:.22,metalness:0});
 for(const side of [-1,1]){
   mesh(head,small,'#ad9778',[side*.046,.024,.094],[.020,.025,.014],false);
   mesh(head,small,eyeMaterial,[side*.046,.025,.105],[.015,.020,.012]);
   mesh(head,small,'#fffbea',[side*.046-.004,.032,.116],[.0046,.006,.0025],false);
   mesh(head,small,'#f0bdad',[side*.081,-.025,.091],[.017,.008,.005],false);
 }
 const nose=new THREE.MeshStandardMaterial({color:i===0?'#b98985':'#494237',roughness:.5});mesh(head,small,nose,[0,-.026,.136],[i===2?.028:.019,.018,.016]);
 mesh(head,small,'#8e7564',[0,-.055,.122],[.007,.006,.004],false);
 for(const side of [-1,1]){
   const ear=new THREE.Group();head.add(ear);ear.position.set(side*.08,.073,-.01);
   if(i===0){ear.rotation.z=-side*.30;fur(ear,identity.fur,[0,.065,0],[.038,.09,.028],50);fur(ear,'#ddb5ad',[0,.065,.026],[.020,.060,.005]);}
   else if(i===2||i===3){ear.rotation.z=-side*.25;fur(ear,identity.fur,[0,.04,0],[.041,.075,.031],60);fur(ear,'#ebcead',[0,.044,.026],[.025,.049,.008]);}
   else {fur(ear,identity.fur,[side*.025,.008,0],[.040,.039,.032],40);fur(ear,'#e4c7a4',[side*.025,.008,.026],[.021,.023,.008]);}
   if(i===5){stem(head,[side*.048,.082,-.035],[side*.060,.157,-.039],.007,'#af9470');stem(head,[side*.056,.124,-.035],[side*.085,.145,-.02],.006,'#af9470');}
 }
 // A small soft collar and round token retain personality without covering fur.
 mesh(body,new THREE.TorusGeometry(.071,.012,6,24),identity.shirt,[0,.284,.016]).rotation.x=Math.PI/2;
 mesh(body,cyl,'#e9ca79',[0,.275,.094],[.018,.007,.018]).rotation.x=Math.PI/2;
 tail.position.set(0,.13,-.089);body.add(tail);fur(tail,identity.fur,[i===2?.017:0,0,-.024],[i===2?.037:.038,.038,i===4?.081:.042],70);
 if(i===4)for(let j=0;j<3;j++)mesh(tail,small,'#7f8276',[0,0,-.05+j*.034],[.039,.039,.011]);
 const limbs=[];
 for(const side of [-1,1]){
   const leg=new THREE.Group();leg.position.set(side*.060,.08,.003);body.add(leg);fur(leg,identity.fur,[0,-.018,0],[.044,.058,.045],45);fur(leg,cream,[0,-.044,.023],[.045,.029,.052],25);limbs.push(leg);
   const arm=new THREE.Group();arm.position.set(side*.100,.251,0);arm.rotation.z=side*.13;body.add(arm);fur(arm,identity.fur,[side*.014,-.047,.008],[.044,.068,.04],55);fur(arm,cream,[side*.017,-.09,.018],[.039,.036,.04],25);limbs.push(arm);
 }
`;
fs.writeFileSync(p+'villagers.js',top+tools);
