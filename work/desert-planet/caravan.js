import {THREE} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// A small museum-like oasis vignette. Ground is y=0 and friendly faces look +Z.
export function createDesertCaravan({palette}){
 const root=new THREE.Group();root.name='薄荷绿商队与古井小集';
 const material=palette.m('#ffffff').clone();material.vertexColors=true;material.side=THREE.DoubleSide;
 const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,14,10),detailSphere=new THREE.SphereGeometry(1,10,6),up=new THREE.Vector3(0,1,0),owned=new Set(),camels=[];
 const C={cream:'#f4dfb5',fur:'#d7ae78',light:'#ead0a2',darkFur:'#b98b59',hoof:'#826346',ink:'#453f39',pink:'#d79783',teal:'#539d96',tealLight:'#91c2b3',rose:'#c87c73',ochre:'#d9ae68',wood:'#896243',woodLight:'#bd9062',rope:'#d3b584',stone:'#c3aa83',stoneLight:'#ddc8a4',shade:'#8d8068',hay:'#d9b567',clay:'#b97f60'};
 const stats={camels:3,canopies:1,wells:1,pillarFragments:3,hayTroughs:2,lanterns:1,meshes:0,triangles:0,drawCalls:0};
 let disposed=false;
 const frame=(x,z,yaw=0,y=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(up,yaw),new THREE.Vector3(1,1,1));
 function builder(){
  const parts=[];
  function add(source,color,p=[0,0,0],scale=[1,1,1],rotation=[0,0,0],transform=null){
   const g=source.clone();for(const a of Object.keys(g.attributes))if(!['position','normal'].includes(a))g.deleteAttribute(a);
   if(!g.attributes.normal)g.computeVertexNormals();
   if(!g.index){const indices=new Uint32Array(g.attributes.position.count);for(let i=0;i<indices.length;i++)indices[i]=i;g.setIndex(new THREE.BufferAttribute(indices,1));}
   const m=new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale));if(transform)m.premultiply(transform);g.applyMatrix4(m);g.clearGroups();
   const c=new THREE.Color(color),colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(g);
  }
  const box=(c,p,s,r,f)=>add(cube,c,p,s,r,f),ball=(c,p,s,r,f)=>add(Math.max(...s)<.023?detailSphere:sphere,c,p,s,r,f);
  function cylinder(c,p,top,bottom,height,r=[0,0,0],f=null,n=12){const g=new THREE.CylinderGeometry(top,bottom,height,n);add(g,c,p,[1,1,1],r,f);g.dispose();}
  function bar(c,a,b,r,f=null,n=7){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),m=new THREE.Matrix4().compose(p.add(q).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(up,d.clone().normalize()),new THREE.Vector3(1,1,1));if(f)m.premultiply(f);const g=new THREE.CylinderGeometry(r,r,d.length(),n);add(g,c,[0,0,0],[1,1,1],[0,0,0],m);g.dispose();}
  function tube(c,points,r,f=null,segments=16){const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,6,false);add(g,c,[0,0,0],[1,1,1],[0,0,0],f);g.dispose();}
  function torus(c,p,r,t,rotation=[Math.PI/2,0,0],f=null){const g=new THREE.TorusGeometry(r,t,5,20);add(g,c,p,[1,1,1],rotation,f);g.dispose();}
  function polygon(c,vertices,indices,f=null){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));g.setIndex(indices);g.computeVertexNormals();add(g,c,[0,0,0],[1,1,1],[0,0,0],f);g.dispose();}
  function lathe(c,profile,p,scale=[1,1,1],f=null){const g=new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(...v)),16);add(g,c,p,scale,[0,0,0],f);g.dispose();}
  function finish(name,parent=root){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeBoundingBox();g.computeBoundingSphere();owned.add(g);const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  return{add,box,ball,cylinder,bar,tube,torus,polygon,lathe,finish};
 }
 const scenery=builder();
 const guests=[
  {x:-.365,z:.038,yaw:.10,fur:C.light,blanket:C.teal,accent:C.rose,phase:.4,eats:true},
  {x:-.105,z:.045,yaw:-.08,fur:C.fur,blanket:C.rose,accent:C.tealLight,phase:3.2,eats:true},
  {x:.155,z:.100,yaw:-.17,fur:'#ddb985',blanket:C.tealLight,accent:C.ochre,phase:5.7,eats:false}
 ];
 for(let i=0;i<guests.length;i++){
  const data=guests[i],holder=new THREE.Group();holder.name=`单峰骆驼 ${i+1} · ${data.eats?'慢慢嚼草':'听风的小旅伴'}`;holder.position.set(data.x,0,data.z);holder.rotation.y=data.yaw;root.add(holder);
  const body=new THREE.Group();body.name='柔软的单峰与鞍毯';holder.add(body);const b=builder();
  b.ball(data.fur,[0,.225,-.018],[.068,.073,.115]);
  b.ball(data.fur,[0,.290,-.046],[.052,.084,.061]);
  b.ball(data.fur,[0,.277,.053],[.044,.057,.050]);
  b.ball(C.cream,[0,.206,.066],[.042,.032,.027]);
  for(const x of [-.043,.043])for(const z of [-.085,.055]){
   b.bar(data.fur,[x,.217,z],[x*.96,.112,z-.008],.0155);
   b.ball(data.fur,[x*.96,.112,z-.008],[.017,.022,.018]);
   b.bar(data.fur,[x*.96,.112,z-.008],[x*.99,.025,z+.004],.0105);
   b.ball(C.darkFur,[x*.99,.019,z+.013],[.016,.013,.025]);
   b.bar(C.hoof,[x*.99,.014,z+.024],[x*.99,.018,z+.036],.0015,null,5);
  }
  b.tube(C.darkFur,[[0,.230,-.121],[.008,.191,-.140],[.027,.152,-.136]],.0065);
  b.ball(C.darkFur,[.028,.146,-.135],[.010,.017,.009],[0,0,-.18]);
  // A shaped saddle blanket leaves the single round hump plainly visible.
  for(const side of [-1,1]){
   b.box(data.blanket,[side*.064,.230,-.031],[.008,.093,.135],[0,0,side*.11]);
   for(const z of [-.079,-.036,.007])b.box(data.accent,[side*.069,.228,z],[.002,.076,.011],[0,0,side*.11]);
   b.box(C.cream,[side*.070,.192,-.031],[.002,.007,.131]);
   for(let tassel=0;tassel<5;tassel++)b.bar(C.cream,[side*.066,.182,-.085+tassel*.027],[side*.072,.169,-.082+tassel*.027],.0018,null,5);
   // Rolled woven luggage, held by twin narrow straps.
   b.cylinder(i%2?C.ochre:C.rose,[side*.092,.247,-.047],.021,.021,.085,[Math.PI/2,0,0],null,12);
   for(const z of [-.075,-.021])b.torus(C.rope,[side*.092,.247,z],.0218,.0022,[0,0,0]);
   b.box(C.wood,[side*.088,.209,.021],[.035,.037,.029]);
   b.bar(C.rope,[side*.088,.190,.038],[side*.088,.229,.038],.0018);
  }
  b.box(C.wood,[0,.282,.010],[.070,.012,.036]);
  b.bar(C.wood,[-.038,.284,.014],[.038,.284,.014],.004);
  b.finish(`骆驼 ${i+1} · 身体与织物行囊合批`,body);
  const neck=new THREE.Group();neck.name='低头吃草的脖颈';neck.position.set(0,.249,.051);body.add(neck);const h=builder();
  h.tube(data.fur,[[0,-.008,-.004],[0,.045,.005],[0,.093,.019],[0,.133,.026]],.023,null,18);
  h.ball(data.fur,[0,.143,.031],[.038,.046,.041]);
  h.ball(C.cream,[0,.126,.066],[.033,.025,.041]);
  h.ball(data.fur,[0,.170,.015],[.030,.025,.025]);
  for(const side of [-1,1]){
   h.ball(data.fur,[side*.039,.172,.013],[.012,.030,.013],[0,0,-side*.48]);
   h.ball(C.pink,[side*.041,.174,.024],[.005,.016,.0025],[0,0,-side*.48]);
   h.ball(C.cream,[side*.027,.151,.059],[.010,.013,.005]);
   h.ball(C.ink,[side*.028,.151,.0635],[.006,.009,.003]);
   h.ball('#fff5df',[side*.026,.155,.066],[.0023,.0028,.0014]);
   h.ball(C.pink,[side*.028,.132,.073],[.008,.0037,.0015]);
   h.ball(C.darkFur,[side*.013,.128,.103],[.003,.0026,.0017]);
   h.bar(C.darkFur,[side*.032,.166,.055],[side*.022,.167,.059],.0016);
  }
  h.tube(C.darkFur,[[-.012,.113,.096],[0,.110,.100],[.012,.113,.096]],.0015,null,8);
  for(let tuft=0;tuft<3;tuft++)h.ball(data.fur,[(tuft-1)*.013,.189+Math.sin(tuft)*.006,.021],[.009,.013,.009],[0,0,(tuft-1)*.25]);
  // A soft halter and a little brass charm echo the blanket colors.
  h.torus(data.blanket,[0,.130,.068],.032,.0025,[Math.PI/2-.32,0,0]);
  h.tube(data.blanket,[[-.030,.133,.063],[-.029,.157,.038],[0,.178,.020],[.029,.157,.038],[.030,.133,.063]],.0022);
  h.ball(C.ochre,[0,.104,.097],[.0035,.005,.002]);
  h.finish(`骆驼 ${i+1} · 长颈、表情与缰绳合批`,neck);
  camels.push({...data,holder,body,neck});
 }
 // The slack tether is attached to stationary saddle rails, never a moving jaw.
 scenery.tube(C.rope,[[-.332,.271,.052],[-.245,.214,.082],[-.133,.271,.058]],.0022);
 scenery.tube(C.rope,[[-.071,.271,.054],[.015,.212,.097],[.128,.271,.122]],.0022);
 for(const x of [-.354,-.114]){
  const trough=frame(x,.285);scenery.box(C.wood,[0,.058,0],[.128,.039,.070],[0,0,0],trough);
  scenery.box(C.woodLight,[0,.080,0],[.137,.008,.077],[0,0,0],trough);
  for(const side of [-1,1])scenery.bar(C.wood,[side*.046,.004,0],[side*.046,.050,0],.007,trough);
  scenery.ball(C.hay,[0,.088,0],[.057,.025,.030],[0,0,0],trough);
  for(let k=0;k<11;k++){const x=(k%6-2.5)*.014,z=(Math.floor(k/6)-.5)*.023;scenery.bar(k%2?C.ochre:C.cream,[x-.008,.092,z-.020],[x+.010,.113+Math.sin(k)*.006,z+.018],.0014,trough,5);}
 }
 // Striped desert awning, a curved cloth silhouette instead of a box-shaped roof.
 const canopy=frame(.333,-.186),canopyWidth=.397,canopyDepth=.256;
 for(const x of [-.198,.198])for(const z of [-.124,.124]){
  scenery.bar(C.wood,[x,.005,z],[x,.358,z],.0055,canopy);
  scenery.ball(C.ochre,[x,.369,z],[.009,.011,.009],[0,0,0],canopy);
 }
 scenery.bar(C.wood,[-.207,.355,-.124],[.207,.355,-.124],.004,canopy);
 scenery.bar(C.wood,[-.207,.355,.124],[.207,.355,.124],.004,canopy);
 for(let stripe=0;stripe<8;stripe++){
  const x0=-canopyWidth/2+stripe*canopyWidth/8,x1=x0+canopyWidth/8,vertices=[],indices=[];
  for(let j=0;j<=8;j++){const z=-canopyDepth/2+j*canopyDepth/8,y=.362-.039*Math.sin(j*Math.PI/8);vertices.push([x0,y,z],[x1,y,z]);if(j<8){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  scenery.polygon(stripe%2?C.ochre:C.teal,vertices,indices,canopy);
  scenery.polygon(stripe%2?C.ochre:C.teal,[[x0,.358,.13],[x1,.358,.13],[x1,.335,.131],[(x0+x1)/2,.325,.131],[x0,.335,.131]],[0,1,2,0,2,3,0,3,4],canopy);
 }
 scenery.box(C.rose,[0,.004,0],[.334,.007,.204],[0,0,0],canopy);
 for(const side of [-1,1])scenery.box(C.ochre,[0,.008,side*.082],[.317,.001,.008],[0,0,0],canopy);
 for(let i=-3;i<=3;i++)scenery.box(C.cream,[i*.042,.009,0],[.015,.001,.018],[0,Math.PI/4,0],canopy);
 for(let i=0;i<3;i++){
  const x=-.12+i*.075,z=-.074;scenery.cylinder(i%2?C.teal:C.rose,[x,.025,z],.020,.020,.105,[0,0,Math.PI/2],canopy,14);
  for(const side of [-1,1])scenery.torus(C.cream,[x+side*.032,.025,z],.0208,.0022,[0,Math.PI/2,0],canopy);
 }
 for(const [x,z,s,color]of [[.121,-.053,1,C.clay],[.115,.041,.72,C.teal],[-.116,.056,.64,C.ochre]]){
  scenery.lathe(color,[[0,0],[.025,.003],[.039,.040],[.035,.064],[.019,.082],[.021,.092],[.015,.092],[.014,.080],[.026,.064]], [x,.005,z],[s,s,s],canopy);
  scenery.torus(C.cream,[x,.062*s+.005,z],.035*s,.002*s,[Math.PI/2,0,0],canopy);
 }
 // Old circular well: individual offset stones preserve its round open mouth.
 const well=frame(-.267,-.219);
 for(let row=0;row<3;row++)for(let i=0;i<12;i++){
  const a=i*Math.PI*2/12+row*.12,r=.074;
  scenery.box((i+row)%3?C.stone:C.stoneLight,[Math.sin(a)*r,.018+row*.031,Math.cos(a)*r],[.040,.028,.027],[0,a,0],well);
 }
 scenery.cylinder('#387e7b',[0,.029,0],.059,.059,.002,[0,0,0],well,28);
 for(const side of [-1,1])scenery.bar(C.wood,[side*.079,.084,0],[side*.079,.258,0],.008,well);
 scenery.bar(C.woodLight,[-.096,.258,0],[.096,.258,0],.009,well);
 scenery.torus(C.wood,[0,.242,0],.023,.006,[0,0,0],well);
 scenery.bar(C.rope,[.016,.245,0],[.016,.073,0],.002,well);
 scenery.lathe(C.woodLight,[[.019,0],[.024,.036],[.020,.036],[.016,.006]], [.014,.053,0],[1,1,1],well);
 scenery.torus(C.wood,[.014,.081,0],.022,.002,[Math.PI/2,0,0],well);
 scenery.torus(C.wood,[.014,.060,0],.019,.002,[Math.PI/2,0,0],well);
 scenery.tube(C.wood,[[.001,.089,0],[.001,.111,0],[.027,.111,0],[.027,.089,0]],.002,well,9);
 // Three warm sandstone fragments, with broken tops and shallow fluting.
 for(const [x,z,height,radius,tilt]of [[-.510,-.248,.267,.036,.05],[-.115,-.295,.161,.031,-.06],[.052,-.280,.103,.035,.12]]){
  const f=frame(x,z);scenery.cylinder(C.stoneLight,[0,.010,0],radius*1.34,radius*1.39,.020,[0,0,0],f,12);
  scenery.cylinder(C.stone,[0,height*.49,0],radius*.91,radius,height-.026,[0,0,tilt],f,12);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;scenery.bar(C.stoneLight,[Math.sin(a)*radius,.031,Math.cos(a)*radius],[Math.sin(a)*radius-tilt*height*.7,height-.022,Math.cos(a)*radius*.92],.0025,f,5);}
  const vertices=[[0,height+.005,0]],indices=[];for(let i=0;i<=12;i++){const a=i*Math.PI/6;vertices.push([Math.sin(a)*radius,height+.012*Math.sin(i*2.17),Math.cos(a)*radius]);if(i<12)indices.push(0,i+1,i+2);}scenery.polygon(C.stoneLight,vertices,indices,f);
  scenery.ball(C.stoneLight,[radius*.95,.009,.027],[.017,.011,.020],[0,.3,0],f);
 }
 // Tiny warm lantern under the awning; it adds no realtime light.
 const lanternPosition=new THREE.Vector3(.333,.255,-.113);
 scenery.bar(C.rope,[.333,.322,-.113],[.333,.287,-.113],.0018);
 for(const y of [.230,.280])scenery.cylinder(C.wood,[.333,y,-.113],.018,.018,.007,[0,0,0],null,10);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;scenery.bar(C.wood,[.333+Math.sin(a)*.015,.231,-.113+Math.cos(a)*.015],[.333+Math.sin(a)*.015,.279,-.113+Math.cos(a)*.015],.0018);}
 scenery.torus(C.wood,[.333,.289,-.113],.008,.0018,[0,0,0]);
 const staticMesh=scenery.finish('商队遮阳棚、石井、草料与古石柱 · 合批');staticMesh.matrixAutoUpdate=false;
 const glowGeometry=new THREE.CylinderGeometry(.012,.013,.040,10),glowMaterial=new THREE.MeshStandardMaterial({color:'#f2c879',emissive:'#ffc171',emissiveIntensity:.10,roughness:.55}),lantern=new THREE.Mesh(glowGeometry,glowMaterial);lantern.name='棚下的小暖灯';lantern.position.copy(lanternPosition);root.add(lantern);
 cube.dispose();sphere.dispose();detailSphere.dispose();root.userData.dynamic=true;
 function update(time,env={}){
  if(disposed)return;const t=Number.isFinite(time)?time:0,night=THREE.MathUtils.clamp(Number(env.night)||0,0,1);
  for(const camel of camels){const p=t+camel.phase,eat=camel.eats?Math.pow(Math.max(0,Math.sin(p*.26)),3):0;
   camel.body.scale.y=1+Math.sin(p*1.2)*.005;
   camel.neck.rotation.set(.045+eat*1.48+Math.sin(p*1.7)*eat*.012,Math.sin(p*.31)*.060,Math.sin(p*.52)*.025);
  }
  glowMaterial.emissiveIntensity=.10+night*(1.20+.045*Math.sin(t*2.1));
 }
 update(0);root.traverse(o=>{if(o.isMesh){stats.meshes++;stats.drawCalls++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 return{root,stats,update,dispose(){if(disposed)return;disposed=true;for(const g of owned)g.dispose();glowGeometry.dispose();material.dispose();glowMaterial.dispose();root.removeFromParent();}};
}
