import {THREE} from './core.js';
import {createParkAnimal} from './animal-model.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// This group stays level with the campsite terrace. Its center is reserved for
// the fire authored by the campsite; all chairs and dishes remain outside it.
export function createCampGathering({palette}){
 const root=new THREE.Group();root.name='营火边 · 棉棉麦麦阿栗的晚餐';
 const material=palette.m('#ffffff').clone();material.vertexColors=true;
 const owned=new Set(),props=[],guests=[];
 const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,8),up=new THREE.Vector3(0,1,0);
 const C={wood:'#b98b62',edge:'#ddbc89',darkWood:'#785b47',canvas:'#ebe0bd',sage:'#8eaa91',blue:'#8ba8ad',coral:'#c68e79',brass:'#c6a773',steel:'#b7c0b7',ink:'#4d635e',cream:'#fff3d6',red:'#c97b68',mint:'#b8cbbb',coffee:'#775441'};
 const stats={animals:3,foldingChairs:3,mealTables:1,picnicBlankets:1,coolers:1,thermoses:1,staticMeshes:1,meshes:0,triangles:0};
 let disposed=false,lastTime=0,night=0;
 function builder(){
  const pieces=[];
  function add(source,color,p=[0,0,0],s=[1,1,1],r=[0,0,0],frame=null){
   const g=source.clone();for(const a of Object.keys(g.attributes))if(!['position','normal'].includes(a))g.deleteAttribute(a);
   if(!g.index){const index=new Uint32Array(g.attributes.position.count);for(let i=0;i<index.length;i++)index[i]=i;g.setIndex(new THREE.BufferAttribute(index,1));}
   const m=new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),new THREE.Vector3(...s));if(frame)m.premultiply(frame);g.applyMatrix4(m);
   const col=new THREE.Color(color),rgb=new Float32Array(g.attributes.position.count*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=col.r;rgb[i+1]=col.g;rgb[i+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(rgb,3));g.clearGroups();pieces.push(g);
  }
  const box=(color,p,s,r,frame)=>add(cube,color,p,s,r,frame),ball=(color,p,s,r,frame)=>add(sphere,color,p,s,r,frame);
  function cylinder(color,p,top,bottom,height,r=[0,0,0],frame=null,segments=12){const g=new THREE.CylinderGeometry(top,bottom,height,segments);add(g,color,p,[1,1,1],r,frame);g.dispose();}
  function bar(color,a,b,r,frame=null){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),m=new THREE.Matrix4().compose(p.add(q).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(up,d.normalize()),new THREE.Vector3(1,1,1));if(frame)m.premultiply(frame);const g=new THREE.CylinderGeometry(r,r,new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b)),7);add(g,color,[0,0,0],[1,1,1],[0,0,0],m);g.dispose();}
  function torus(color,p,r,t,rotation=[Math.PI/2,0,0],frame=null){const g=new THREE.TorusGeometry(r,t,5,18);add(g,color,p,[1,1,1],rotation,frame);g.dispose();}
  function finish(name,parent){const g=mergeGeometries(pieces,false);pieces.forEach(p=>p.dispose());g.computeBoundingBox();g.computeBoundingSphere();owned.add(g);const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  return{add,box,ball,cylinder,bar,torus,finish};
 }
 const scenery=builder();
 function frame(x,z,yaw=0,y=0){return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(up,yaw),new THREE.Vector3(1,1,1));}
 function chair(fabric,f){
  // Broad canvas seat, slightly leaning back, exposed crossed wooden legs.
  scenery.box(fabric,[0,.083,0],[.136,.008,.125],[0,0,0],f);
  scenery.box(fabric,[0,.145,-.061],[.133,.091,.008],[-.12,0,0],f);
  for(const side of [-1,1]){
   const x=side*.076;
   scenery.bar(C.wood,[x,.010,-.061],[x,.096,.058],.0065,f);
   scenery.bar(C.wood,[x,.010,.061],[x,.184,-.071],.0065,f);
   scenery.box(C.edge,[x,.128,.004],[.018,.011,.102],[.02,0,0],f);
   scenery.bar(C.darkWood,[x,.091,.039],[x,.124,.039],.0045,f);
   scenery.ball(C.brass,[x+side*.007,.061,.002],[.004,.004,.005],[0,0,0],f);
   scenery.bar(C.edge,[side*.061,.084,-.062],[side*.061,.084,.062],.0022,f);
   scenery.bar(C.edge,[side*.058,.104,-.057],[side*.058,.183,-.067],.0016,f);
  }
  for(const z of [-.061,.061])scenery.bar(C.darkWood,[-.076,.018,z],[.076,.018,z],.004,f);
  scenery.bar(C.wood,[-.083,.187,-.067],[.083,.187,-.067],.006,f);
  // A little stitched label and three restrained seams make the canvas legible.
  scenery.box(C.cream,[.042,.171,-.053],[.019,.009,.0015],[0,0,0],f);
  for(const x of [-.044,0,.044])scenery.bar(C.canvas,[x,.109,-.055],[x,.176,-.063],.0009,f);
 }
 const positions=[
  {species:'rabbit',name:'棉棉',x:-.20,z:-.38,yaw:.49,fabric:C.canvas,outfit:'#a5b99b',phase:.2,activity:'慢慢转一转烤棉花糖'},
  {species:'bear',name:'麦麦',x:.38,z:-.19,yaw:-.626,fabric:C.sage,outfit:'#e1ad88',phase:2.3,activity:'捧着热汤喝一小口'},
  // The front chair shifts left so its sitter shows a three-quarter face,
  // rather than the back of its head, in the campsite's main camera.
  {species:'corgi',name:'阿栗',x:-.38,z:.29,yaw:1.803,fabric:C.blue,outfit:'#9eb5ca',phase:4.7,activity:'吃一口抹了黄油的吐司'},
 ];
 function bowl(b,p,s=1,f=null){
  const profile=[[0,-.013],[.044,-.013],[.079,.011],[.09,.052],[.08,.058],[.071,.017],[.035,.002],[0,.002]].map(v=>new THREE.Vector2(...v)),g=new THREE.LatheGeometry(profile,18);b.add(g,C.cream,p,[s,s,s],[0,0,0],f);g.dispose();
  b.ball('#d6a366',[p[0],p[1]+.035*s,p[2]],[.070*s,.009*s,.070*s],[0,0,0],f);
  b.torus(C.red,[p[0],p[1]+.050*s,p[2]],.085*s,.004*s,[Math.PI/2,0,0],f);
  for(let i=0;i<5;i++){const a=i*2.4;b.ball(i%2?'#97a777':'#e2be76',[p[0]+Math.cos(a)*.046*s,p[1]+.044*s,p[2]+Math.sin(a)*.035*s],[.012*s,.004*s,.009*s],[0,0,0],f);}
 }
 function attachProp(actor,nodeName,name,paint){const b=builder();paint(b);const mesh=b.finish(name,actor.root.getObjectByName(nodeName));props.push(mesh);return mesh;}
 for(const data of positions){
  const f=frame(data.x,data.z,data.yaw);chair(data.fabric,f);
  const seat=new THREE.Group();seat.name=`${data.name} · 折叠椅上的晚餐`;seat.position.set(data.x,.089,data.z);seat.rotation.y=data.yaw;seat.userData.dynamic=true;root.add(seat);
  const actor=createParkAnimal({palette,species:data.species,outfit:data.outfit,pose:'sit',size:.24});seat.add(actor.root);
  const left=actor.root.getObjectByName('Left sleeve and paw'),right=actor.root.getObjectByName('Right sleeve and paw'),head=actor.root.getObjectByName('Face and ears');
  if(data.species==='rabbit')attachProp(actor,'Right sleeve and paw','棉棉手里的烤棉花糖',b=>{
   b.bar(C.darkWood,[.046,-.109,.049],[.046,-.074,.62],.009);
   b.cylinder('#f7e8d0',[.046,-.070,.607],.045,.048,.091,[0,0,Math.PI/2],null,14);
   b.ball('#cfae82',[.034,-.039,.632],[.022,.009,.011]);b.ball('#dbc096',[.061,-.046,.635],[.014,.008,.012]);
  });
  else if(data.species==='bear'){
   attachProp(actor,'Left sleeve and paw','麦麦捧着的暖汤碗',b=>bowl(b,[-.046,-.09,.106],.89));
   attachProp(actor,'Right sleeve and paw','麦麦手里的木汤匙',b=>{b.bar(C.wood,[.046,-.108,.046],[.046,.089,.115],.009);b.ball(C.edge,[.046,.119,.125],[.026,.039,.011],[-.25,0,0]);});
  }else attachProp(actor,'Right sleeve and paw','阿栗手里的黄油吐司',b=>{
   const s=new THREE.Shape();s.moveTo(-.080,-.086);s.lineTo(.080,-.086);s.lineTo(.080,.055);s.bezierCurveTo(.112,.117,.011,.139,0,.110);s.bezierCurveTo(-.018,.143,-.113,.117,-.080,.055);s.closePath();
   const g=new THREE.ExtrudeGeometry(s,{depth:.037,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.005,bevelThickness:.004,curveSegments:5});b.add(g,'#ba845c',[.046,-.043,.083]);b.add(g,'#f3d49a',[.046,-.044,.112],[.81,.80,.30]);g.dispose();
   b.box('#f5de91',[.039,-.034,.131],[.041,.031,.009],[0,0,-.18]);
   for(const [x,y]of [[-.024,-.066],[.069,.002],[.084,-.088]])b.ball('#d7ae7a',[x,y,.134],[.006,.004,.002]);
  });
  guests.push({...data,seat,actor,left,right,head,bite:0});
 }
 // Slatted camp table remains to the right of the fire and outside the chairs.
 const table=frame(.64,.14,-.08),tableY=.116;
 for(let i=0;i<5;i++){const z=(i-2)*.036;scenery.box(C.wood,[0,tableY,z],[.284,.012,.032],[0,0,0],table);scenery.bar(C.edge,[-.135,tableY+.0065,z-.007],[.132,tableY+.0065,z-.007],.0009,table);}
 for(const x of [-.114,.114]){scenery.bar(C.darkWood,[x,.008,-.076],[x,.11,.065],.006,table);scenery.bar(C.darkWood,[x,.008,.076],[x,.11,-.065],.006,table);scenery.ball(C.brass,[x,.058,0],[.004,.004,.004],[0,0,0],table);}
 scenery.bar(C.wood,[-.114,.029,0],[.114,.029,0],.004,table);
 bowl(scenery,[-.066,.130,-.008],.24,table);
 scenery.cylinder(C.cream,[.029,.129,.021],.027,.025,.005,[0,0,0],table,22);scenery.torus(C.blue,[.029,.132,.021],.022,.0012,[Math.PI/2,0,0],table);
 scenery.box('#eacb8e',[.027,.135,.021],[.031,.006,.026],[0,.12,0],table);scenery.box('#f2deaa',[.027,.139,.021],[.023,.002,.019],[0,.12,0],table);
 // Brushed enamel thermos, cups, lid and the folded napkin.
 scenery.cylinder(C.blue,[.101,.166,-.041],.015,.017,.079,[0,0,0],table,14);scenery.cylinder(C.steel,[.101,.208,-.041],.014,.014,.009,[0,0,0],table,14);scenery.cylinder(C.cream,[.101,.216,-.041],.015,.015,.009,[0,0,0],table,14);
 for(const [x,z]of [[-.033,.052],[.079,.041]]){scenery.cylinder(C.cream,[x,.142,z],.013,.011,.027,[0,0,0],table,14);scenery.cylinder(C.coffee,[x,.156,z],.010,.010,.001,[0,0,0],table,12);scenery.torus(C.cream,[x+.014,.145,z],.007,.0023,[0,0,0],table);}
 scenery.box(C.canvas,[-.089,.129,.052],[.039,.002,.026],[0,-.23,0],table);scenery.bar(C.steel,[-.020,.131,-.057],[.023,.131,-.057],.0014,table);
 // A woven picnic rug and a compact cooler echo the quiet lived-in reference.
 const rug=frame(.51,.48,.03);scenery.box(C.canvas,[0,.002,0],[.275,.004,.247],[0,0,0],rug);
 for(let i=-4;i<=4;i++){scenery.box(i%2?C.sage:C.coral,[i*.028,.0044,0],[.009,.0007,.238],[0,0,0],rug);scenery.box(C.sage,[0,.0048,i*.025],[.266,.0007,.005],[0,0,0],rug);}
 for(const side of [-1,1])for(let i=-6;i<=6;i++)scenery.bar(C.canvas,[i*.019,.003,side*.124],[i*.019+.003,.002,side*.137],.0011,rug);
 const cooler=frame(.70,.37,-.1);scenery.box(C.sage,[0,.049,0],[.153,.089,.105],[0,0,0],cooler);scenery.box(C.cream,[0,.096,0],[.166,.013,.116],[0,0,0],cooler);scenery.box(C.edge,[0,.018,0],[.153,.015,.105],[0,0,0],cooler);
 for(const x of [-.044,.044]){scenery.box(C.ink,[x,.083,.055],[.011,.023,.007],[0,0,0],cooler);scenery.ball(C.brass,[x,.079,.060],[.0025,.0025,.002],[0,0,0],cooler);}
 scenery.bar(C.steel,[-.051,.096,-.023],[-.051,.123,-.023],.003,cooler);scenery.bar(C.steel,[.051,.096,-.023],[.051,.123,-.023],.003,cooler);scenery.bar(C.darkWood,[-.051,.123,-.023],[.051,.123,-.023],.004,cooler);
 scenery.box(C.cream,[.019,.103,.015],[.055,.003,.037],[0,.15,0],cooler);
 const furniture=scenery.finish('折叠椅、木餐桌、帆布野餐毯与保冷箱 · 合批',root);furniture.matrixAutoUpdate=false;
 cube.dispose();sphere.dispose();root.userData.dynamic=true;
 function update(time,env={}){
  if(disposed)return;lastTime=Number.isFinite(time)?time:0;night=THREE.MathUtils.clamp(Number(env.night)||0,0,1);
  for(const g of guests){
   const t=lastTime+g.phase,bite=Math.pow(Math.max(0,Math.sin(t*.62)),2);g.bite=bite;g.actor.animate(t,{walk:0,wave:0,cheer:0});
   if(g.species==='rabbit'){g.right.rotation.set(-.20-bite*.17,.055*Math.sin(t*.7),.12);g.left.rotation.set(-.18,0,-.08);g.head.rotation.x+=.035*Math.sin(t*.7);}
   else if(g.species==='bear'){g.left.rotation.set(-.57,0,-.16);g.right.rotation.set(-.53-bite*.96,0,.10);g.head.rotation.x+=bite*.075;g.head.rotation.y+=.14;}
   else{g.right.rotation.set(-.70-bite*.65,0,.13);g.left.rotation.set(-.16,0,-.08);g.head.rotation.y-=.15;g.head.rotation.z+=bite*.045;}
  }
 }
 root.traverse(o=>{if(o.isMesh){stats.meshes++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});update(0);
 return{root,stats,update,getState:()=>({time:lastTime,night,disposed,...stats,guests:guests.map(g=>({name:g.name,species:g.species,activity:g.activity,bite:g.bite,position:g.seat.position.toArray()}))}),dispose(){
  if(disposed)return;disposed=true;
  for(const prop of props)prop.removeFromParent();for(const g of guests)g.actor.dispose();for(const geometry of owned)geometry.dispose();material.dispose();root.removeFromParent();
 }};
}
