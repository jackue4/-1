import {THREE} from './core.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {batchScenery} from './optimize.js';

// Front is -Z; the sliding door opens on +X. The tyres touch local Y=0.
// The owner may place this complete model on any of the planet's tangent frames.
export function createCampCamper({palette}){
 const root=new THREE.Group();root.name='奶油青绿房车 · 留一盏回家的灯';
 const painted=palette.m('#ffffff').clone();painted.vertexColors=true;
 const windows=palette.m('#779795').clone();windows.emissive.set('#ffc67e');windows.emissiveIntensity=0;
 const ownGeometry=new Set(),baseGeometry=new Map(),up=new THREE.Vector3(0,1,0),color=new THREE.Color();
 const C={cream:'#f3e8c7',roof:'#fff1d5',teal:'#4a9387',deepTeal:'#316c68',ink:'#334b50',glass:'#426d77',glassLight:'#82a5a6',metal:'#bebda4',rubber:'#39444a',hub:'#c0c6b4',wood:'#ae8560',woodLight:'#d7b68a',seat:'#637b7d',curtain:'#c6bb95',orange:'#dca153',orangeDark:'#ab7948',aqua:'#82babe',strap:'#8b734f',red:'#c87c60'};
 const sources=new Set();let disposed=false,lastTime=0,night=0;
 const geo=g=>(sources.add(g),g);
 function primitive(key,factory){if(!baseGeometry.has(key))baseGeometry.set(key,geo(factory()));return baseGeometry.get(key);}
 function add(geometry,tint,p=[0,0,0],s=[1,1,1],rotation=[0,0,0],glowing=false){
  const g=geometry.clone();g.deleteAttribute('uv');const rgb=new Float32Array(g.attributes.position.count*3);color.set(C[tint]||tint);for(let i=0;i<rgb.length;i+=3){rgb[i]=color.r;rgb[i+1]=color.g;rgb[i+2]=color.b;}if(!glowing)g.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));sources.add(g);
  const mesh=new THREE.Mesh(g,glowing?windows:painted);mesh.position.set(...p);mesh.scale.set(...s);mesh.rotation.set(...rotation);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;
 }
 const cube=primitive('cube',()=>new THREE.BoxGeometry(1,1,1));
 const ballGeo=primitive('sphere',()=>new THREE.SphereGeometry(1,8,6));
 function box(w,h,d,tint,p,rotation=[0,0,0],round=0,glowing=false){
  if(!round)return add(cube,tint,p,[w,h,d],rotation,glowing);
  const r=Math.min(round,w*.45,h*.45,d*.45),key=`r/${w}/${h}/${d}/${r}`,g=primitive(key,()=>{const detail=Math.max(w,h,d)>.35&&r>.009?2:1,raw=new RoundedBoxGeometry(w,h,d,detail,r);raw.deleteAttribute('uv');const indexed=mergeVertices(raw,1e-5);raw.dispose();return indexed;});return add(g,tint,p,[1,1,1],rotation,glowing);
 }
 const ball=(scale,tint,p)=>add(ballGeo,tint,p,scale);
 function cylinder(radius,length,tint,p,rotation=[0,0,0],segments=16){return add(primitive(`c/${radius}/${length}/${segments}`,()=>new THREE.CylinderGeometry(radius,radius,length,segments,1)),tint,p,[1,1,1],rotation);}
 function bar(a,b,r,tint){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);const o=cylinder(r,delta.length(),tint,p.add(q).multiplyScalar(.5).toArray(),[0,0,0],6);o.quaternion.setFromUnitVectors(up,delta.normalize());return o;}
 function curve(points,r,tint,steps=18){return add(geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps,r,5,false)),tint);}

 // A hollow shell and actual door gap preserve a readable lived-in interior.
 box(.377,.039,.922,'ink',[0,.109,0],undefined,.014);
 box(.394,.025,.896,'woodLight',[0,.134,0],undefined,.009);
 for(let i=0;i<11;i++)box(.384,.002,.002,'wood',[0,.148,-.407+i*.077]);
 box(.415,.013,.966,'teal',[0,.155,0],undefined,.005);
 // The doorway cuts the right-side waist, so it is not blocked by a body box.
 // Its low sill remains beneath the walking opening and doubles as a step.
 box(.036,.190,.938,'deepTeal',[-.207,.228,0],undefined,.012);
 for(const [z,length]of[[-.319,.370],[.329,.310]])box(.036,.160,length,'teal',[.208,.238,z],undefined,.012);
 box(.410,.163,.027,'teal',[0,.239,.471],undefined,.013);
 box(.416,.147,.024,'cream',[0,.371,.472],undefined,.009);
 box(.424,.119,.066,'teal',[0,.226,-.461],[-.08,0,0],.020);
 box(.420,.018,.020,'cream',[0,.287,-.493],[-.08,0,0],.008);
 for(const side of [-1,1]){
  if(side===-1)box(.025,.154,.918,'cream',[side*.207,.371,0],undefined,.016);
  for(const [z,length]of side===-1?[[0,.952]]:[[-.322,.367],[.333,.307]])box(.030,.014,length,'cream',[side*.219,.295,z],undefined,.006);
 }
 // The right wall is built as two separate panels, with a header and narrow
 // jambs surrounding clear air. The waist trim also stops at the opening.
 for(const [z,length]of[[-.322,.367],[.333,.307]])box(.025,.154,length,'cream',[.207,.371,z],undefined,.012);
 box(.032,.031,.305,'cream',[.211,.429,.016],undefined,.007);
 for(const z of[-.137,.168])box(.027,.299,.018,'cream',[.213,.282,z],undefined,.004);
 box(.450,.041,.985,'roof',[0,.457,0],undefined,.016);
 box(.457,.010,.986,'metal',[0,.438,0],undefined,.004);
 box(.038,.011,.322,'metal',[.225,.153,.016],undefined,.004);
 box(.096,.017,.286,'metal',[.244,.091,.016],undefined,.005);
 for(let i=0;i<5;i++)box(.067,.003,.004,'ink',[.253,.101,-.085+i*.048]);

 // Cream-framed cab glazing, paired wipers and small enamel mirrors.
 box(.404,.148,.020,'metal',[0,.362,-.478],[-.16,0,0],.009);
 box(.380,.125,.021,'glass',[0,.364,-.490],[-.16,0,0],.012);
 box(.012,.135,.008,'cream',[0,.363,-.505],[-.16,0,0],.003);
 for(const side of[-1,1]){
  box(.012,.089,.159,'ink',[side*.226,.368,-.320],undefined,.007);
  box(.012,.076,.142,'glass',[side*.234,.371,-.320],undefined,.006);
  box(.003,.058,.009,'glassLight',[side*.241,.375,-.369],[.15,0,0]);
  box(.024,.012,.037,'metal',[side*.234,.280,-.247],undefined,.004);
  bar([side*.188,.381,-.426],[side*.266,.362,-.453],.004,'ink');
  box(.031,.041,.013,'cream',[side*.265,.369,-.460],[0,side*.16,0],.006);
  box(.025,.033,.005,'glassLight',[side*.265,.369,-.468],[0,side*.16,0],.004);
  bar([side*.166,.314,-.502],[side*.047,.328,-.508],.003,'ink');
 }
 box(.358,.076,.010,'ink',[0,.219,-.502],undefined,.016);
 for(let i=0;i<4;i++)box(.138,.003,.010,'metal',[0,.194+i*.015,-.509],undefined,.001);
 for(const side of[-1,1]){
  cylinder(.032,.014,'metal',[side*.163,.226,-.509],[Math.PI/2,0,0],18);
  add(primitive('headlamp',()=>new THREE.CylinderGeometry(.026,.026,.015,18,1)),'cream',[side*.163,.226,-.517],[1,1,1],[Math.PI/2,0,0],true);
  box(.052,.018,.014,'orange',[side*.154,.176,-.506],undefined,.005);
  box(.024,.045,.009,'red',[side*.181,.225,.494],undefined,.004);
  box(.027,.010,.010,'cream',[side*.181,.198,.495],undefined,.003);
 }
 box(.450,.027,.034,'metal',[0,.133,-.497],undefined,.011);
 box(.447,.027,.035,'metal',[0,.133,.493],undefined,.011);
 for(const side of[-1,1])for(const z of[-.505,.501])box(.020,.043,.027,'ink',[side*.147,.136,z],undefined,.005);

 function framedWindow(side,z,length,{rear=false,glow=false}={}){
  const x=side===1?.247:side*.229;box(.014,.112,length,'metal',[x,.369,z],undefined,.006);
  box(.014,.094,length-.020,'glass',[x+side*.007,.369,z],undefined,.006,glow);
  for(const end of[-1,1]){
   box(.017,.086,.028,'curtain',[x+side*.015,.369,z+end*(length*.5-.027)],undefined,.004);
   for(let j=0;j<3;j++)box(.0018,.077,.002,'woodLight',[x+side*.0245,.369,z+end*(length*.5-.036)+j*.005]);
  }
  box(.019,.007,length-.024,'woodLight',[x+side*.014,.415,z]);
  if(!rear)box(.008,.002,length*.57,'glassLight',[x+side*.018,.396,z]);
 }
 framedWindow(-1,.033,.268,{glow:true});framedWindow(-1,.330,.210,{rear:true,glow:true});
 // The sliding door is held back on its track; its dark gap is genuinely open.
 box(.018,.146,.294,'deepTeal',[.239,.235,.326],undefined,.007);
 box(.017,.130,.293,'cream',[.239,.373,.326],undefined,.007);
 framedWindow(1,.325,.253,{glow:true});
 for(const y of[.152,.441])bar([.251,y,.159],[.251,y,.485],.004,'metal');
 box(.012,.009,.028,'metal',[.255,.300,.209],undefined,.003);
 box(.012,.030,.047,'ink',[.219,.174,.448],undefined,.004);
 for(let i=0;i<5;i++)box(.003,.002,.036,'metal',[.227,.164+i*.005,.448]);
 box(.302,.106,.012,'metal',[0,.371,.492],undefined,.008);
 box(.278,.083,.014,'glass',[0,.373,.500],undefined,.007,true);
 for(const x of[-.10,-.084,-.068,.068,.084,.10])box(.009,.074,.004,'curtain',[x,.373,.510]);
 box(.066,.008,.012,'metal',[0,.290,.500],undefined,.003);

 // Modest interior furniture catches the camp's warm glow through the door.
 for(const side of[-1,1]){
  box(.117,.051,.143,'seat',[side*.104,.216,-.290],undefined,.012);
  box(.122,.150,.045,'seat',[side*.104,.300,-.208],[-.13,0,0],.012);
  box(.072,.043,.043,'curtain',[side*.104,.379,-.222],undefined,.009);
 }
 bar([-.104,.201,-.393],[-.104,.306,-.403],.005,'ink');
 add(geo(new THREE.TorusGeometry(.031,.0035,6,20)),'ink',[-.104,.314,-.407],[1,1,1],[.61,0,0]);
 box(.323,.027,.063,'ink',[0,.291,-.426],undefined,.006);
 box(.338,.073,.182,'wood',[0,.193,.338],undefined,.012);
 box(.342,.033,.185,'curtain',[0,.246,.340],undefined,.012);
 box(.071,.025,.075,'orange',[.067,.274,.347],[0,.21,0],.009);
 box(.093,.181,.168,'wood',[-.140,.239,.033],undefined,.009);
 box(.106,.012,.178,'woodLight',[-.139,.338,.033],undefined,.004);
 box(.004,.083,.119,'cream',[-.087,.266,.033],undefined,.003);
 box(.006,.009,.026,'metal',[-.082,.290,.063],undefined,.003);
 box(.095,.010,.130,'woodLight',[.025,.256,.061],undefined,.007);
 cylinder(.005,.103,'metal',[.025,.204,.061],[0,0,0],8);
 cylinder(.010,.019,'cream',[-.140,.354,.044],[0,0,0],12);
 box(.028,.003,.046,'teal',[-.139,.347,-.007],[0,.18,0]);
 box(.055,.008,.080,'cream',[0,.429,.040],undefined,.004,true);
 for(let i=0;i<6;i++)box(.040,.002,.011,i%2?'orange':'cream',[.097,.150,-.023+i*.013]);

 // Small tyres with cream wheel hubs. Painted curved fenders wrap their tops.
 for(const side of[-1,1])for(const z of[-.320,.327]){
  cylinder(.082,.040,'rubber',[side*.218,.082,z],[0,0,Math.PI/2],24);
  cylinder(.061,.043,'ink',[side*.222,.082,z],[0,0,Math.PI/2],20);
  cylinder(.052,.047,'hub',[side*.225,.082,z],[0,0,Math.PI/2],20);
  cylinder(.023,.051,'cream',[side*.228,.082,z],[0,0,Math.PI/2],16);
  for(let k=0;k<5;k++){const a=k*Math.PI*2/5;ball([.0027,.004,.004],'ink',[side*.250,.082+Math.cos(a)*.035,z+Math.sin(a)*.035]);}
  const points=[];for(let i=0;i<=20;i++){const a=i/20*Math.PI;points.push([side*.232,.082+Math.sin(a)*.098,z+Math.cos(a)*.098]);}curve(points,.0065,'cream',24);
 }

 // Roof-rack rails and strapped cases repeat the reference's warm/cool accents.
 for(const x of[-.169,.169])for(const z of[-.029,.388])bar([x,.478,z],[x,.497,z],.006,'metal');
 for(let i=0;i<5;i++)box(.358,.009,.011,'metal',[0,.494,-.078+i*.124],undefined,.003);
 for(const x of[-.184,.184])bar([x,.500,-.113],[x,.500,.456],.005,'ink');
 for(const z of[-.112,.456])bar([-.184,.501,z],[.184,.501,z],.005,'metal');
 box(.276,.071,.251,'orangeDark',[0,.538,.246],undefined,.015);
 box(.276,.036,.253,'orange',[0,.556,.246],undefined,.013);
 box(.277,.005,.250,'woodLight',[0,.549,.246],undefined,.002);
 for(const x of[-.085,.085]){
  box(.014,.074,.256,'strap',[x,.540,.246],undefined,.002);
  box(.020,.014,.008,'metal',[x,.540,.378],undefined,.003);
 }
 curve([[-.035,.538,.379],[-.032,.549,.388],[.032,.549,.388],[.035,.538,.379]],.003,'ink',10);
 box(.191,.047,.138,'aqua',[-.016,.575,.126],[0,-.08,0],.009);
 box(.196,.009,.143,'glassLight',[-.016,.595,.126],[0,-.08,0],.004);
 box(.010,.043,.140,'metal',[-.068,.575,.126],[0,-.08,0],.002);
 box(.010,.043,.140,'metal',[.036,.575,.126],[0,-.08,0],.002);
 for(const x of[-.045,.014])bar([x,.568,.047],[x,.580,.044],.002,'ink');
 bar([-.045,.580,.044],[.014,.580,.044],.002,'ink');

 // Tiny geometric registration numerals avoid a texture or an extra draw.
 const digits={0:[0,1,2,4,5,6],7:[0,2,5],2:[0,2,3,4,6],6:[0,1,3,4,5,6]},segments=[[0,.008,.008,.0018],[-.004,.004,.0018,.007],[.004,.004,.0018,.007],[0,0,.008,.0018],[-.004,-.004,.0018,.007],[.004,-.004,.0018,.007],[0,-.008,.008,.0018]];
 for(const z of[-.519,.514]){
  box(.077,.028,.005,'ink',[0,.148,z],undefined,.003);box(.070,.022,.006,'cream',[0,.148,z+Math.sign(z)*.003],undefined,.002);
  for(const [i,d]of[0,7,2,6].entries())for(const k of digits[d]){const [dx,dy,w,h]=segments[k];box(w,h,.001,'ink',[-.023+i*.015+dx,.148+dy,z+Math.sign(z)*.0065]);}
 }

 const before=root.children.length,batching=batchScenery(root,{compact:true});root.userData.dynamic=true;
 root.traverse(o=>{if(o.geometry)ownGeometry.add(o.geometry);});for(const g of sources)if(!ownGeometry.has(g))g.dispose();sources.clear();baseGeometry.clear();
 const stats={campers:1,openDoors:1,interiorSeats:3,roofLuggage:2,wheels:4,unbatchedMeshes:before,drawCalls:0,triangles:0,vertices:0,batching,bodyDimensions:{width:.46,length:1.03,height:.60},door:{side:'+X',zMin:-.128,zMax:.159,sillY:.162},front:'-Z'};
 root.traverse(o=>{if(!o.isMesh)return;stats.drawCalls++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;stats.vertices+=o.geometry.attributes.position.count;});
 const dayColor=new THREE.Color('#779795'),nightColor=new THREE.Color('#c6a57b');
 function update(time,env={}){if(disposed)return;lastTime=Number.isFinite(time)?time:lastTime;night=THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(env.night||0,0,1),.08,.86);windows.color.copy(dayColor).lerp(nightColor,night);windows.emissiveIntensity=night*(.75+.025*Math.sin(lastTime*.47));}
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of ownGeometry)g.dispose();ownGeometry.clear();painted.dispose();windows.dispose();}
 update(0,{night:0});return{root,stats,update,dispose};
}
