import {THREE,seeded} from './core.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {batchScenery} from '../festival-planet/optimize.js';

// Original miniature interpretations of rose-sandstone façades, earthen ksars
// and desert rock bridges. Each independent site faces +Z and starts at Y=0.
export function createDesertLandmarks({palette}){
 const root=new THREE.Group();root.name='沙海拾光 · 砂岩古迹';
 const sites={treasury:new THREE.Group(),kasbah:new THREE.Group(),arch:new THREE.Group()};
 sites.treasury.name='玫瑰石窟 · 六柱宝库';sites.kasbah.name='赤陶云阶 · 绿松石内院';sites.arch.name='风雕石桥 · 沙海眺台';Object.values(sites).forEach(s=>root.add(s));
 const painted=palette.m('#ffffff').clone();painted.vertexColors=true;
 const warm=palette.m('#e9be81').clone();warm.emissive.set('#ffc984');warm.emissiveIntensity=0;
 const sourceGeometry=new Set(),ownedGeometry=new Set(),cache=new Map(),color=new THREE.Color(),UP=new THREE.Vector3(0,1,0),rng=seeded(518627);
 const C={rose:'#d59477',roseLight:'#e6b091',rosePale:'#efc5a3',roseDark:'#ad705c',rust:'#be8066',sand:'#ead0a0',cream:'#f4e2bd',shadow:'#784f4e',deep:'#493d42',wood:'#96714f',woodLight:'#c09c71',terra:'#bc805d',terraLight:'#d59c73',terraGold:'#dcb283',ochre:'#d5a650',teal:'#58a8a1',tealDark:'#367979',blue:'#79bfc0',water:'#78bfc0',leaf:'#779477'};
 let disposed=false,lastTime=0,lastNight=0;
 const stats={landmarks:3,treasury:{lowerColumns:6,upperColumns:10,corniceDentils:0},kasbah:{cornerTowers:4,courtyards:1,fountains:1,pottery:0,awnings:2},arch:{stoneBridges:1,actualOpening:true,viewingPlatforms:1},drawCalls:0,triangles:0,vertices:0,siteBudgets:{}};
 function keep(g){sourceGeometry.add(g);return g;}
 function primitive(key,make){if(!cache.has(key))cache.set(key,keep(make()));return cache.get(key);}
 function add(parent,base,tint,p=[0,0,0],s=[1,1,1],r=[0,0,0],glow=false,vertexColor=null){
  const g=base.clone();g.deleteAttribute('uv');if(!glow){const values=new Float32Array(g.attributes.position.count*3);color.set(C[tint]||tint);for(let i=0;i<g.attributes.position.count;i++){if(vertexColor)vertexColor(i,g.attributes.position,color);values.set([color.r,color.g,color.b],i*3);}g.setAttribute('color',new THREE.Float32BufferAttribute(values,3));}sourceGeometry.add(g);
  const o=new THREE.Mesh(g,glow?warm:painted);o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
 }
 const cube=primitive('cube',()=>new THREE.BoxGeometry(1,1,1)),sphere=primitive('sphere',()=>new THREE.SphereGeometry(1,10,7));
 function box(g,w,h,d,tint,p,r=[0,0,0],round=0,glow=false){if(!round)return add(g,cube,tint,p,[w,h,d],r,glow);const radius=Math.min(round,w*.35,h*.35,d*.35),key=`rounded/${w}/${h}/${d}/${radius}`,geo=primitive(key,()=>{const raw=new RoundedBoxGeometry(w,h,d,1,radius);raw.deleteAttribute('uv');const indexed=mergeVertices(raw,1e-5);raw.dispose();return indexed;});return add(g,geo,tint,p,[1,1,1],r,glow);}
 const ball=(g,scale,tint,p)=>add(g,sphere,tint,p,scale);
 function cylinder(g,top,bottom,h,tint,p,segments=16,r=[0,0,0]){return add(g,primitive(`cylinder/${top}/${bottom}/${h}/${segments}`,()=>new THREE.CylinderGeometry(top,bottom,h,segments,1)),tint,p,[1,1,1],r);}
 function bar(g,a,b,r,tint){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p),o=cylinder(g,r,r,v.length(),tint,p.add(q).multiplyScalar(.5).toArray(),6);o.quaternion.setFromUnitVectors(UP,v.normalize());return o;}
 function line(g,points,r,tint,steps=24){return add(g,keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,5,false)),tint);}
 function torus(g,radius,tube,tint,p,r=[Math.PI/2,0,0],steps=20){return add(g,primitive(`torus/${radius}/${tube}/${steps}`,()=>new THREE.TorusGeometry(radius,tube,5,steps)),tint,p,[1,1,1],r);}
 function prism(g,points,depth,tint,p=[0,0,0],bevel=0){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return add(g,keep(new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,curveSegments:12})),tint,p);}
 function archPanel(g,w,h,depth,tint,p,bevel=0){const shape=new THREE.Shape(),a=w*.5;shape.moveTo(-a,0);shape.lineTo(-a,h-a);shape.absarc(0,h-a,a,Math.PI,0,true);shape.lineTo(a,0);shape.closePath();return add(g,keep(new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,curveSegments:12})),tint,p);}
 const leaf=primitive('leaf',()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.22,-.4,.28,0,-.31,.77,0,0,1,0,.31,.77,0,.4,.28,0,0,.46,-.10],3));g.setIndex([0,1,2,0,2,3,0,3,4,0,4,5,0,5,1,6,2,1,6,3,2,6,4,3,6,5,4,6,1,5]);g.computeVertexNormals();return g;});
 function rosette(g,x,y,z,size,tint='rosePale'){for(let i=0;i<6;i++){const a=i*Math.PI/3;add(g,leaf,tint,[x+Math.sin(a)*size*.12,y+Math.cos(a)*size*.12,z],[size*.60,size*.80,size*.36],[0,0,-a]);}ball(g,[size*.18,size*.18,size*.12],'roseLight',[x,y,z+.009]);}
 function lantern(g,x,y,z){bar(g,[x,y-.03,z],[x,y+.04,z],.003,'wood');box(g,.030,.040,.030,'deep',[x,y+.015,z],undefined,.003);box(g,.022,.029,.022,'cream',[x,y+.016,z],undefined,.002,true);cylinder(g,.019,.023,.012,'ochre',[x,y+.042,z],8);}

 // Treasury: a restrained wall of rose rock leaves architectural recesses
 // darker than its six freestanding lower columns and finely cut cornices.
 const treasury=sites.treasury;
 const cliff=new THREE.BoxGeometry(1.36,1.39,.34,10,12,2),cp=cliff.attributes.position;
 for(let i=0;i<cp.count;i++){
  const x=cp.getX(i),y=cp.getY(i)+.695,z=cp.getZ(i),normalized=y/1.39,side=Math.abs(x)/.68;
  cp.setXYZ(i,x*(1-.10*normalized)+.012*Math.sin(y*16+x*8),y*(1-.055*side)+.011*Math.sin(x*15)*normalized,z+Math.sin(y*24+x*6)*.008+side*.024*Math.sin(y*9));
 }cliff.computeVertexNormals();keep(cliff);const sandstone1=new THREE.Color(C.rose),sandstone2=new THREE.Color(C.roseLight),sandstone3=new THREE.Color(C.roseDark);
 add(treasury,cliff,'rose',[0,0,-.223],[1,1,1],undefined,false,(i,p,c)=>{const y=p.getY(i),x=p.getX(i);c.copy(sandstone1).lerp(sandstone2,.12+.10*Math.sin(y*23+x*1.7)).lerp(sandstone3,.09+.06*Math.cos(y*37));});
 for(const side of[-1,1])for(let k=0;k<5;k++){
  const x=side*(.568+k*.016),h=.80+k*.10;box(treasury,.038,h,.045,k%2?'rust':'rose',[x,h*.5,-.008-k*.027],undefined,.012);
 }
 // Dark face of the excavation, framed by lighter rock cheeks.
 box(treasury,1.038,.956,.072,'roseDark',[0,.538,-.045]);
 box(treasury,.931,.467,.019,'rose',[0,.359,.004]);
 for(let i=0;i<5;i++)box(treasury,1.115-i*.016,.022,.40-i*.038,i%2?'roseLight':'rosePale',[0,.011+i*.022,.084+i*.006]);
 archPanel(treasury,.172,.327,.015,'deep',[0,.113,.024],.002);
 box(treasury,.219,.369,.018,'shadow',[0,.292,.010]);
 box(treasury,.163,.316,.016,'deep',[0,.272,.026]);
 for(const side of[-1,1]){
  box(treasury,.019,.366,.055,'rosePale',[side*.111,.292,.048]);
  box(treasury,.030,.396,.027,'roseLight',[side*.133,.294,.024]);
  archPanel(treasury,.107,.192,.009,'shadow',[side*.341,.169,.025]);
  archPanel(treasury,.062,.151,.013,'roseDark',[side*.341,.177,.032]);
  box(treasury,.119,.014,.021,'rosePale',[side*.341,.159,.040]);
  rosette(treasury,side*.341,.415,.040,.039);
 }
 box(treasury,.284,.024,.063,'rosePale',[0,.488,.050]);
 box(treasury,.307,.010,.066,'roseLight',[0,.506,.052]);
 function column(g,x,z,baseY,height,r=.027,ornate=false){
  cylinder(g,r*1.44,r*1.54,.018,'rosePale',[x,baseY+.009,z],16);
  box(g,r*3.05,.010,r*3.05,'roseLight',[x,baseY+.023,z]);
  cylinder(g,r*.89,r,height-.084,'roseLight',[x,baseY+.031+(height-.084)/2,z],20);
  // Narrow sculpted flutes describe the column without texture noise.
  for(let j=0;j<8;j++){const a=j*Math.PI/4;bar(g,[x+Math.sin(a)*r*.92,baseY+.057,z+Math.cos(a)*r*.92],[x+Math.sin(a)*r*.80,baseY+height-.073,z+Math.cos(a)*r*.80],r*.075,'rosePale');}
  cylinder(g,r*1.27,r*.89,.028,'rosePale',[x,baseY+height-.040,z],12);
  box(g,r*3.15,.015,r*2.86,'rosePale',[x,baseY+height-.017,z]);
  if(ornate){for(const side of[-1,1])torus(g,r*.37,r*.105,'rosePale',[x+side*r*.85,baseY+height-.040,z+r*.9],[0,0,0],12);for(let j=0;j<5;j++){const a=(j-2)*.43;add(g,leaf,j%2?'roseLight':'rosePale',[x+Math.sin(a)*r*.92,baseY+height-.066,z+Math.cos(a)*r*.90],[r*.44,r*.97,r*.45],[.20,0,-a*.7]);}}
 }
 for(const x of[-.447,-.296,-.146,.146,.296,.447])column(treasury,x,.115,.111,.431,.026,true);
 for(const [y,w,h,d,tint]of[[.550,1.025,.022,.164,'rosePale'],[.571,1.068,.014,.179,'roseLight'],[.587,1.088,.016,.193,'rosePale'],[.612,1.015,.029,.139,'rose'],[.635,1.062,.014,.172,'roseLight']])box(treasury,w,h,d,tint,[0,y,.084]);
 for(let i=0;i<31;i++){box(treasury,.014,.016,.029,'rosePale',[-.484+i*.0323,.600,.166]);stats.treasury.corniceDentils++;}
 prism(treasury,[[-.312,0],[0,.133],[.312,0]],.034,'roseLight',[0,.646,.079]);
 prism(treasury,[[-.251,.016],[0,.112],[.251,.016]],.008,'roseDark',[0,.650,.116]);
 for(const side of[-1,1])bar(treasury,[side*.324,.646,.135],[0,.793,.135],.009,'rosePale');
 rosette(treasury,0,.706,.138,.038);
 // Upper wings end in deliberately broken pediments around the round tholos.
 for(const side of[-1,1]){
  box(treasury,.258,.283,.037,'rose',[side*.360,.829,.017]);
  archPanel(treasury,.071,.175,.009,'shadow',[side*.358,.719,.044]);
  ball(treasury,[.014,.021,.012],'rosePale',[side*.357,.854,.062]);
  add(treasury,leaf,'roseLight',[side*.357,.751,.067],[.045,.088,.027]);
  for(const x of[.265,.451])column(treasury,side*x,.119,.681,.307,.022,true);
  box(treasury,.260,.021,.140,'rosePale',[side*.359,.991,.087]);
  for(let j=0;j<8;j++)box(treasury,.012,.013,.020,'rosePale',[side*(.250+j*.030),1.010,.160]);
  const points=side===1?[[.227,1.022],[.475,1.022],[.475,1.093],[.366,1.136]]:[[-.475,1.022],[-.227,1.022],[-.366,1.136],[-.475,1.093]];
  prism(treasury,points,.045,'roseLight',[0,0,.071]);
  bar(treasury,[side*.480,1.100,.124],[side*.366,1.147,.124],.008,'rosePale');
  cylinder(treasury,.017,.029,.069,'rosePale',[side*.486,1.153,.092],12);
  ball(treasury,[.015,.019,.015],'roseLight',[side*.486,1.196,.092]);
 }
 cylinder(treasury,.135,.140,.267,'roseDark',[0,.850,.002],24);
 cylinder(treasury,.157,.157,.019,'rosePale',[0,.707,.016],28);
 for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;column(treasury,Math.sin(a)*.142,.020+Math.cos(a)*.142,.718,.274,.017,true);}
 cylinder(treasury,.173,.174,.022,'roseLight',[0,1.004,.017],28);
 cylinder(treasury,.043,.169,.067,'rosePale',[0,1.048,.017],28);
 cylinder(treasury,.029,.043,.019,'roseLight',[0,1.091,.017],16);
 cylinder(treasury,.022,.035,.019,'rosePale',[0,1.110,.017],16);
 const urnPoints=[[.018,0],[.023,.01],[.033,.025],[.037,.051],[.026,.069],[.019,.077],[.029,.082],[.029,.087]].map(p=>new THREE.Vector2(...p));
 add(treasury,keep(new THREE.LatheGeometry(urnPoints,20)),'rosePale',[0,1.118,.017]);
 ball(treasury,[.022,.017,.022],'roseLight',[0,1.214,.017]);
 for(const side of[-1,1])lantern(treasury,side*.493,.109,.207);
 for(const side of[-1,1])for(let j=0;j<8;j++){const y=.10+j*.145;line(treasury,[[side*.583,y,-.065],[side*.649,y+.006,-.10],[side*.674,y-.008,-.139]],.0027,j%2?'roseDark':'roseLight',10);}

 // Ksar: stacked, gently softened earthen cubes around a quiet tiled courtyard.
 const kasbah=sites.kasbah;
 box(kasbah,1.22,.056,1.18,'terraGold',[0,.028,0],undefined,.015);
 box(kasbah,1.138,.014,1.090,'sand',[0,.063,0],undefined,.006);
 function windowsOn(g,x,y,z,count=2,w=.22,front=true){
  for(let row=0;row<count;row++)for(const side of[-1,1]){
   const xx=x+side*w*.23,yy=y+row*.127;
   box(g,.046,.074,.006,'shadow',[xx,yy,z]);box(g,.036,.060,.008,'deep',[xx,yy,z+.004]);
   box(g,.058,.011,.016,'terraGold',[xx,yy+.041,z+.006]);box(g,.056,.009,.019,'wood',[xx,yy-.037,z+.007]);
   if((row+(side===1?1:0))%2===0){box(g,.018,.061,.008,'woodLight',[xx-.012,yy,z+.012]);for(let k=0;k<3;k++)box(g,.016,.003,.002,'wood',[xx-.012,yy-.020+k*.020,z+.017]);}
  }
 }
 function battlements(g,x,y,z,w,d){
  box(g,w+.026,.029,d+.026,'terraLight',[x,y,z],undefined,.005);
  const nx=Math.max(3,Math.round(w/.060)),nz=Math.max(3,Math.round(d/.067));
  for(let i=0;i<nx;i++)for(const sign of[-1,1])box(g,.028,.047,.028,'terraLight',[x-w*.44+i*w*.88/(nx-1),y+.033,z+sign*d*.47],undefined,.004);
  for(let i=1;i<nz-1;i++)for(const sign of[-1,1])box(g,.028,.047,.028,'terraLight',[x+sign*w*.47,y+.033,z-d*.44+i*d*.88/(nz-1)],undefined,.004);
 }
 const towerSpots=[[-.466,-.443,.802],[.466,-.443,.866],[-.466,.443,.612],[.466,.443,.660]];
 for(const [index,[x,z,h]]of towerSpots.entries()){
  box(kasbah,.226,h,.226,index%2?'terra':'terraLight',[x,.069+h/2,z],undefined,.013);
  // Slightly wider feet and pale earthen plaster bands soften the tower mass.
  box(kasbah,.247,.060,.247,'terra',[x,.099,z],undefined,.009);
  for(const y of[.249,h*.62+.08,h+.04])box(kasbah,.233,.016,.233,'terraGold',[x,y,z],undefined,.004);
  battlements(kasbah,x,h+.070,z,.228,.228);
  windowsOn(kasbah,x,.235,z+.116,Math.floor((h-.13)/.13),.22);
  for(let side of[-1,1])for(let row=0;row<3;row++){
   box(kasbah,.006,.055,.026,'shadow',[x+side*.116,.33+row*.16,z]);
   for(const dz of[-.035,.035])box(kasbah,.010,.010,.010,'terraGold',[x+side*.120,h-.084,z+dz],[Math.PI/4,0,Math.PI/4]);
  }
  for(let j=0;j<5;j++){const xx=x-.073+j*.036;box(kasbah,.018,.018,.009,'terraGold',[xx,h-.019,z+.122],[0,0,Math.PI/4]);box(kasbah,.009,.009,.010,'terra',[xx,h-.019,z+.128],[0,0,Math.PI/4]);}
 }
 for(const [i,[x,z,w,d,h]]of [[-.230,-.375,.259,.310,.530],[.047,-.408,.291,.330,.625],[.279,-.300,.177,.425,.464],[-.409,-.030,.206,.367,.333],[.416,-.065,.206,.378,.400],[-.368,.223,.190,.180,.290]].entries()){
  box(kasbah,w,h,d,i%2?'terra':'terraLight',[x,.073+h/2,z],undefined,.012);
  box(kasbah,w+.024,.024,d+.022,'terraGold',[x,.078+h,z],undefined,.005);
  // Parapets border usable, flat roof terraces.
  for(const sign of[-1,1])box(kasbah,.020,.048,d+.007,'terra',[x+sign*w*.48,.115+h,z],undefined,.003);
  box(kasbah,w,.050,.019,'terra',[x,.116+h,z-d*.48],undefined,.003);
  windowsOn(kasbah,x,.211,z+d*.5+.003,Math.max(1,Math.floor((h-.14)/.14)),w);
  if(i===1){box(kasbah,.107,.118,.097,'terraLight',[x-.048,.709,z+.038],undefined,.007);box(kasbah,.126,.018,.114,'sand',[x-.048,.777,z+.038],undefined,.005);}
 }
 // Front entrance: thick side walls and an arch whose visible depth is dark.
 for(const side of[-1,1]){box(kasbah,.266,.235,.071,'terraLight',[side*.268,.187,.491],undefined,.008);for(let i=0;i<4;i++)box(kasbah,.037,.034,.077,'terra',[side*(.170+i*.061),.321,.491],undefined,.004);}
 box(kasbah,.262,.044,.092,'terraGold',[0,.323,.490],undefined,.006);
 archPanel(kasbah,.211,.243,.030,'deep',[0,.073,.515]);
 // A pair of gate leaves remains open toward the square rather than sealing it.
 for(const side of[-1,1]){box(kasbah,.072,.202,.013,'wood',[side*.116,.174,.533],[0,side*.58,0],.004);for(const y of[.115,.219])box(kasbah,.072,.009,.008,'woodLight',[side*.116,y,.544],[0,side*.58,0]);}
 for(let i=0;i<5;i++){const h=.055-i*.010;box(kasbah,.216,h,.054,'sand',[0,h/2,.548+i*.023]);}
 // A small turquoise tile fountain anchors the warm plaster court.
 box(kasbah,.342,.013,.322,'tealDark',[0,.083,.062],undefined,.005);
 box(kasbah,.292,.013,.272,'water',[0,.092,.062],undefined,.004);
 for(const side of[-1,1]){
  box(kasbah,.341,.019,.025,'cream',[0,.101,.062+side*.151],undefined,.005);
  box(kasbah,.025,.019,.278,'cream',[side*.158,.101,.062],undefined,.005);
 }
 for(let i=0;i<9;i++)for(const sign of[-1,1])box(kasbah,.016,.002,.016,i%2?'teal':'ochre',[-.132+i*.033,.112,.062+sign*.151],[0,Math.PI/4,0]);
 cylinder(kasbah,.026,.040,.072,'sand',[0,.129,.062],14);
 cylinder(kasbah,.079,.048,.026,'cream',[0,.175,.062],20);
 cylinder(kasbah,.067,.067,.004,'water',[0,.190,.062],20);
 ball(kasbah,[.013,.021,.013],'cream',[0,.210,.062]);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;line(kasbah,[[Math.sin(a)*.015,.206,.062+Math.cos(a)*.015],[Math.sin(a)*.035,.225,.062+Math.cos(a)*.035],[Math.sin(a)*.054,.194,.062+Math.cos(a)*.054]],.0022,'blue',10);}
 // Courtyard patterned paving, intentionally broad colour blocks, no texture.
 for(let row=0;row<5;row++)for(let col=0;col<7;col++){const x=-.269+col*.089,z=-.165+row*.109;if(Math.abs(x)<.183&&Math.abs(z-.062)<.183)continue;box(kasbah,.065,.002,.063,(row+col)%3===0?'terraGold':'cream',[x,.073,z],[0,(row+col)%2?Math.PI/4:0,0]);}
 // External stairs connect the entrance and the first roof terrace.
 for(let i=0;i<8;i++)box(kasbah,.137,.029+i*.030,.060,'terraGold',[-.262,.073+(.029+i*.030)/2,-.067-i*.047]);
 function pot(g,x,y,z,size,tint){
  const profile=[[.28,0],[.49,.10],[.57,.40],[.46,.65],[.26,.75],[.24,.92],[.32,.96]].map(([r,h])=>new THREE.Vector2(r*size,h*size));
  add(g,keep(new THREE.LatheGeometry(profile,14)),tint,[x,y,z]);cylinder(g,size*.235,size*.235,.003,'shadow',[x,y+size*.93,z],14);torus(g,size*.29,size*.036,'terraGold',[x,y+size*.964,z],undefined,14);stats.kasbah.pottery++;
 }
 for(const [x,y,z,s,tint]of [[-.273,.079,.337,.092,'terra'],[-.244,.079,.269,.065,'ochre'],[.300,.079,.305,.102,'terraLight'],[.270,.079,.381,.062,'teal'],[.235,.079,-.179,.069,'terra'],[-.28,.617,-.371,.071,'ochre'],[-.203,.617,-.307,.052,'terra'],[.142,.711,-.323,.069,'terraLight'],[.165,.079,.420,.058,'ochre']])pot(kasbah,x,y,z,s,tint);
 function canopy(x,z,w,d,height,tint){
  for(const side of[-1,1])bar(kasbah,[x+side*w*.45,.073,z+d*.45],[x+side*w*.45,height-.010,z+d*.45],.006,'wood');
  for(let strip=0;strip<7;strip++){
   const geo=new THREE.BoxGeometry(w/7+.001,.003,d,1,1,8),p=geo.attributes.position;for(let i=0;i<p.count;i++){const f=(p.getZ(i)+d*.5)/d;p.setY(i,p.getY(i)-.026*Math.sin(f*Math.PI)+.016*f);}geo.computeVertexNormals();
   add(kasbah,keep(geo),strip%2?'cream':tint,[x-w*.5+(strip+.5)*w/7,height,z]);
   box(kasbah,w/7+.001,.029,.005,strip%2?'cream':tint,[x-w*.5+(strip+.5)*w/7,height+.001,z+d*.5]);
  }
  bar(kasbah,[x-w*.49,height+.016,z+d*.5],[x+w*.49,height+.016,z+d*.5],.004,'woodLight');
 }
 canopy(.260,.222,.237,.185,.333,'teal');canopy(-.203,-.256,.218,.165,.392,'ochre');
 box(kasbah,.193,.108,.070,'wood',[.263,.128,.242],undefined,.006);box(kasbah,.212,.014,.104,'woodLight',[.263,.188,.242],undefined,.004);
 for(let i=0;i<4;i++){ball(kasbah,[.020,.014,.017],i%2?'ochre':'terraGold',[.194+i*.043,.211,.244]);box(kasbah,.043,.002,.054,'cream',[.194+i*.043,.198,.244]);}
 for(const [x,z]of[[-.160,.38],[.162,.375],[.157,-.189]]){cylinder(kasbah,.029,.032,.060,'wood',[x,.105,z],10);cylinder(kasbah,.036,.034,.010,'woodLight',[x,.141,z],12);}
 for(const [x,y,z]of[[-.159,.290,.528],[.159,.290,.528],[-.248,.485,-.218],[.324,.368,.120]])lantern(kasbah,x,y,z);

 // Stone bridge: one continuous concave extrusion leaves an actual open span.
 const arch=sites.arch,outline=new THREE.Shape();
 outline.moveTo(-.558,0);outline.bezierCurveTo(-.595,.109,-.578,.282,-.533,.386);outline.bezierCurveTo(-.494,.563,-.395,.675,-.247,.709);outline.bezierCurveTo(-.102,.745,.079,.729,.211,.689);outline.bezierCurveTo(.405,.688,.527,.520,.550,.350);outline.bezierCurveTo(.582,.230,.564,.100,.545,0);outline.lineTo(.331,0);outline.bezierCurveTo(.330,.146,.287,.289,.226,.354);outline.bezierCurveTo(.144,.442,-.027,.469,-.137,.423);outline.bezierCurveTo(-.266,.397,-.324,.245,-.342,.129);outline.lineTo(-.351,0);outline.closePath();
 const rock=keep(new THREE.ExtrudeGeometry(outline,{depth:.227,steps:1,curveSegments:25,bevelEnabled:true,bevelThickness:.010,bevelSize:.010,bevelSegments:2}));
 const strataLight=new THREE.Color('#dca276'),strataDark=new THREE.Color('#b87757');
 add(arch,rock,'terraLight',[0,.011,-.1135],[1,1,1],undefined,false,(i,p,c)=>{const y=p.getY(i),x=p.getX(i),wave=Math.sin(y*35+x*2.4)*.5+.5;c.copy(strataLight).lerp(strataDark,.09+wave*.17);});
 // Continuous upper shelves and shorter leg strata never cross the opening.
 for(let row=0;row<5;row++){
  const y=.556+row*.028,xExtent=.414-row*.012,points=[];for(let j=0;j<=14;j++){const x=-xExtent+j*xExtent*2/14;points.push([x,y+.025*Math.cos(x*5)+.005*Math.sin(x*23+row),.127]);}line(arch,points,.0024,row%2?'rosePale':'rust',26);
 }
 for(const side of[-1,1])for(let row=0;row<7;row++){
  const y=.060+row*.059,x=side*(.443+Math.sin(row*.7)*.006);line(arch,[[x-side*.061,y,.129],[x,y+.004,.132],[x+side*.060,y-.006,.128]],.0028,row%2?'terraGold':'rust',10);
 }
 for(const [x,z,s]of[[-.511,.179,.071],[-.419,.188,.048],[.407,.178,.066],[.563,-.130,.039]]){const b=add(arch,primitive('stone',()=>new THREE.IcosahedronGeometry(1,1)),'terraLight',[x,s*.31,z],[s,s*.48,s*.68],[.1,rng(),.17]);b.receiveShadow=true;}
 // A short boardwalk approaches a low lookout alongside the natural arch.
 for(let i=0;i<7;i++)box(arch,.104,.022,.062,'sand',[.439,.022+i*.015,.357-i*.036],undefined,.005);
 box(arch,.234,.028,.244,'wood',[.444,.159,.065],undefined,.006);
 for(let i=0;i<7;i++)box(arch,.232,.009,.030,i%2?'woodLight':'sand',[.444,.178,-.027+i*.031],undefined,.002);
 for(const x of[.333,.555])for(const z of[-.034,.159])bar(arch,[x,.083,z],[x,.329,z],.007,'wood');
 for(const z of[-.034,.159])bar(arch,[.330,.307,z],[.558,.307,z],.005,'woodLight');
 bar(arch,[.558,.307,-.034],[.558,.307,.159],.005,'woodLight');
 lantern(arch,.579,.253,.186);
 // Flat stepping stones pass beneath the opening; the empty span stays readable.
 for(let i=0;i<7;i++)box(arch,.112,.010,.064,i%2?'sand':'terraGold',[Math.sin(i*.7)*.026,.005,.282-i*.092],[0,Math.sin(i*.3)*.11,0],.004);

 // Batch separately so each named site keeps its movable spherical frame.
 for(const [key,site]of Object.entries(sites)){
  const batching=batchScenery(site,{compact:true});let triangles=0,vertices=0,drawCalls=0;site.traverse(o=>{if(!o.geometry)return;ownedGeometry.add(o.geometry);drawCalls++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;vertices+=o.geometry.attributes.position.count;});stats.siteBudgets[key]={triangles,vertices,drawCalls,batching};stats.triangles+=triangles;stats.vertices+=vertices;stats.drawCalls+=drawCalls;site.userData.landmark=key;
 }
 for(const geo of sourceGeometry)if(!ownedGeometry.has(geo))geo.dispose();sourceGeometry.clear();cache.clear();root.userData.dynamic=true;
 function update(time,env={}){if(disposed)return;lastTime=Number.isFinite(time)?time:lastTime;lastNight=THREE.MathUtils.smoothstep(Math.max(0,Math.min(1,env.night||0)),.09,.84);warm.emissiveIntensity=lastNight*(.90+.045*Math.sin(lastTime*.51));}
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const geo of ownedGeometry)geo.dispose();ownedGeometry.clear();painted.dispose();warm.dispose();}
 update(0,{night:0});return{root,sites,stats,update,dispose};
}
