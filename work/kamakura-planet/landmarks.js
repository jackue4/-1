import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;

// Small, fully supported destinations tucked into the two empty coast shoulders
// and Enoshima. Nothing in the original town or railway is moved or replaced.
export function createLandmarks({planet,surface,palette={},town}){
 const root=new THREE.Group();root.name='Island afternoons · tea glasshouse, fisherman cottage and shrine';planet.add(root);
 const ownedGeometry=new Set(),ownedMaterial=new Set(),meshes=[],sites=[],plants=[],features=[],batches=new Map();
 const identity=new THREE.Matrix4(),dummy=new THREE.Object3D(),matrix=new THREE.Matrix4();
 const C={cream:'#f0e5c6',white:'#fff0d4',wood:'#a77b53',lightWood:'#cfaa73',darkWood:'#70543d',roof:'#354e50',tile:'#496765',red:'#b86b4c',stone:'#b8bda3',moss:'#8ba666',green:'#528451',leaf:'#70a15b',mint:'#a7cbb3',glass:'#9dc9c2',coral:'#ed9670',rope:'#d7c195',shadow:'#405e4c'};
 function mat(name,extra={}){const material=new THREE.MeshToonMaterial({color:'white',vertexColors:true,gradientMap:palette.ramp??null,side:THREE.DoubleSide,...extra});material.name=name;ownedMaterial.add(material);return material;}
 const solid=mat('Clean warm island architecture'),foliage=mat('Broad tropical leaves'),glass=mat('Pale glasshouse glazing',{transparent:true,opacity:.50,depthWrite:false}),lamps=mat('Warm cottage windows and courtyard lamps',{emissive:'#ffca73',emissiveIntensity:.24});
 foliage.onBeforeCompile=shader=>{shader.uniforms.uIslandTime={value:0};foliage.userData.shader=shader;shader.vertexShader='uniform float uIslandTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat breeze=sin(position.x*23.+position.z*17.+uIslandTime*1.1)*.0022;transformed.x+=breeze;transformed.z+=breeze*.55;');};
 foliage.customProgramCacheKey=()=> 'broad-tropical-leaves-v1';
 function add(g,color,base=identity,p=[0,0,0],r=[0,0,0],scale=[1,1,1],material=solid,group='architecture'){
  if(g.index){const expanded=g.toNonIndexed();g.dispose();g=expanded;}g.deleteAttribute('uv');const c=new THREE.Color(color),v=g.attributes.position,colors=new Float32Array(v.count*3);for(let i=0;i<v.count;i++)colors.set([c.r,c.g,c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  dummy.position.set(...p);dummy.rotation.set(...r);dummy.scale.set(...scale);dummy.updateMatrix();g.applyMatrix4(matrix.multiplyMatrices(base,dummy.matrix));const key=group+'|'+material.id;if(!batches.has(key))batches.set(key,{parts:[],material,name:group});batches.get(key).parts.push(g);
 }
 function box(color,base,p,size,r=[0,0,0],material=solid,group){add(new THREE.BoxGeometry(...size),color,base,p,r,[1,1,1],material,group);}
 function cylinder(color,base,p,top,bottom,h,sides=8,r=[0,0,0],material=solid,group){add(new THREE.CylinderGeometry(top,bottom,h,sides),color,base,p,r,[1,1,1],material,group);}
 function rod(color,base,a,b,r=.003,sides=6,material=solid,group){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),d=to.clone().sub(from),g=new THREE.CylinderGeometry(r*.88,r,d.length(),sides);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,d.normalize()));g.translate(...from.add(to).multiplyScalar(.5).toArray());add(g,color,base,[0,0,0],[0,0,0],[1,1,1],material,group);}
 function sphere(color,base,p,scale,material=solid,group){add(new THREE.SphereGeometry(1,8,5),color,base,p,[0,0,0],scale,material,group);}
 function ring(color,base,p,radius,tube,r=[0,0,0],group){add(new THREE.TorusGeometry(radius,tube,5,16),color,base,p,r,[1,1,1],solid,group);}
 function frame(lat,lon,h){const n=surface.direction(lat,lon),e=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),s=new THREE.Vector3().crossVectors(e,n);return new THREE.Matrix4().makeBasis(e,n,s).setPosition(n.clone().multiplyScalar(h??surface.height(n)));}
 function makeSite(name,lat,lon,width,depth){
  const n=surface.direction(lat,lon),r=surface.height(n),ground=frame(lat,lon,r),samples=[];
  for(const x of[-width/2,0,width/2])for(const z of[-depth/2,0,depth/2]){const nn=new THREE.Vector3(x,0,z).applyMatrix4(ground).normalize(),h=surface.height(nn),point=nn.clone().multiplyScalar(h);samples.push({x,z,normal:nn.toArray(),groundHeight:h,coast:surface.coast(nn),projected:point.dot(n),railClearance:Math.abs(Math.asin(nn.y)-surface.trackLat(Math.atan2(nn.x,nn.z)))*surface.R});}
  const radius=Math.hypot(width,depth)/2,existing=town?.root?.userData?.placements??[],nearest=existing.reduce((v,p)=>Math.min(v,n.distanceTo(surface.direction(p.lat,p.lon))*surface.R-p.radius-radius),Infinity);
  if(samples.some(p=>p.groundHeight<surface.R+.003||p.coast<=0||p.railClearance<.12)||nearest<.02)throw new Error('Landmark footprint intersects coast, railway or town: '+name);
  const deckRadius=Math.max(...samples.map(p=>p.projected))+.021,base=frame(lat,lon,deckRadius),inverse=base.clone().invert(),record={name,lat,lon,width,depth,radius,deckRadius,nearestTownClearance:nearest,foundationSamples:samples,features:[],palms:0,bananas:0};sites.push(record);
  samples.forEach(p=>{const q=new THREE.Vector3(...p.normal).multiplyScalar(p.groundHeight).applyMatrix4(inverse),top=-.008,bottom=q.y-.006,span=top-bottom;p.support={x:q.x,z:q.z,bottom,top,length:span};cylinder(C.darkWood,base,[q.x,(top+bottom)/2,q.z],.008,.010,span,7,[0,0,0],solid,name);box(C.stone,base,[q.x,bottom+.003,q.z],[.037,.018,.037],[0,0,0],solid,name);});
  // Broad planks and beams retain the legible silhouette at globe-view scale.
  const count=18;for(let i=0;i<count;i++)box(i%5===0?C.lightWood:C.wood,base,[(i-(count-1)/2)*width/count,0,0],[width/count-.002,.016,depth],[0,0,0],solid,name);
  for(const z of[-depth*.40,depth*.40])box(C.darkWood,base,[0,-.012,z],[width,.019,.014],[0,0,0],solid,name);
  return{...record,base,record,ground:ground,inverse};
 }
 function mark(s,name){s.record.features.push(name);features.push({site:s.name,name});}
 function roof(s,x,y,z,w,d,rise,color=C.roof){
  const pitch=Math.atan2(rise,d/2),slope=Math.hypot(d/2,rise);for(const side of[-1,1]){box(color,s.base,[x,y+rise/2,z+side*d/4],[w,.012,slope],[side*pitch,0,0],solid,s.name);
   for(let j=0;j<6;j++){const t=j/6,zz=side*d*.5*t,yy=y+rise*(1-t)+.007;box(j%2?color:C.tile,s.base,[x,yy,z+zz],[w+.004,.007,.008],[side*pitch,0,0],solid,s.name);}
  }cylinder(C.tile,s.base,[x,y+rise+.009,z],.008,.008,w+.016,8,[0,0,Math.PI/2],solid,s.name);
 }
 function gable(s,x,y,z,w,d,rise,color){const p=[-w/2,0,-d/2,w/2,0,-d/2,-w/2,rise,0,w/2,rise,0,-w/2,0,d/2,w/2,0,d/2],idx=[0,4,2,1,3,5,0,1,4,1,5,4,0,2,1,1,2,3,2,4,3,3,4,5],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();add(g,color,s.base,[x,y,z],[0,0,0],[1,1,1],solid,s.name);}
 function window(s,x,y,z,w=.052,h=.056){box(C.darkWood,s.base,[x,y,z],[w+.010,h+.010,.006],[0,0,0],solid,s.name);box(C.white,s.base,[x,y,z+.004],[w,h,.005],[0,0,0],lamps,s.name);box(C.cream,s.base,[x,y,z+.008],[.003,h,.004],[0,0,0],solid,s.name);box(C.cream,s.base,[x,y,z+.008],[w,.003,.004],[0,0,0],solid,s.name);}
 function planter(s,x,z,w=.055,flower=true){box(C.red,s.base,[x,.020,z],[w,.037,.032],[0,0,0],solid,s.name);box(C.darkWood,s.base,[x,.041,z],[w+.003,.007,.034],[0,0,0],solid,s.name);for(let j=0;j<4;j++){const xx=x+(j-1.5)*w/4;sphere(j%2?C.green:C.leaf,s.base,[xx,.054,z],[.015,.016,.017],foliage,s.name);if(flower)sphere(j%2?C.coral:'#f2c18a',s.base,[xx,.067,z+.003],[.006,.006,.005],foliage,s.name);}}
 function chair(s,x,z,yaw=0){const base=s.base.clone().multiply(new THREE.Matrix4().makeTranslation(x,0,z)).multiply(new THREE.Matrix4().makeRotationY(yaw));box(C.lightWood,base,[0,.033,0],[.040,.006,.038],[0,0,0],solid,s.name);box(C.wood,base,[0,.059,-.017],[.042,.037,.006],[.08,0,0],solid,s.name);for(const xx of[-.014,.014])for(const zz of[-.012,.012])rod(C.darkWood,base,[xx*.8,.032,zz*.8],[xx,.006,zz],.0025,5,solid,s.name);}
 function table(s,x,z){cylinder(C.lightWood,s.base,[x,.052,z],.041,.041,.007,12,[0,0,0],solid,s.name);cylinder(C.darkWood,s.base,[x,.028,z],.004,.006,.048,6,[0,0,0],solid,s.name);for(const a of[0,2.1,4.2])rod(C.darkWood,s.base,[x,.017,z],[x+Math.sin(a)*.024,.004,z+Math.cos(a)*.024],.0025,5,solid,s.name);cylinder(C.white,s.base,[x-.014,.062,z],.007,.005,.013,8,[0,0,0],solid,s.name);cylinder(C.red,s.base,[x+.012,.062,z+.006],.006,.004,.013,8,[0,0,0],solid,s.name);}
 function lamp(s,x,z){cylinder(C.darkWood,s.base,[x,.047,z],.003,.006,.09,6,[0,0,0],solid,s.name);box(C.white,s.base,[x,.106,z],[.018,.027,.018],[0,0,0],lamps,s.name);box(C.roof,s.base,[x,.122,z],[.027,.005,.026],[0,0,0],solid,s.name);for(const xx of[-.010,.010])rod(C.darkWood,s.base,[x+xx,.092,z],[x+xx,.120,z],.0015,4,solid,s.name);}
 function crate(s,x,z,size=.042){box(C.darkWood,s.base,[x,size/2+.009,z],[size,size,size],[0,0,0],solid,s.name);for(let j=0;j<4;j++){box(j%2?C.wood:C.lightWood,s.base,[x,.016+j*size/4,z+size/2+.001],[size,.006,.003],[0,0,0],solid,s.name);box(C.wood,s.base,[x+size/2+.001,.016+j*size/4,z],[.003,.006,size],[0,0,0],solid,s.name);}rod(C.darkWood,s.base,[x-size/2,.013,z+size/2+.004],[x+size/2,size+.009,z+size/2+.004],.002,5,solid,s.name);}
 function barrel(s,x,z){cylinder(C.wood,s.base,[x,.037,z],.024,.025,.062,10,[0,0,0],solid,s.name);for(const y of[.018,.060])ring(C.darkWood,s.base,[x,y,z],.025,.002,[Math.PI/2,0,0],s.name);cylinder(C.lightWood,s.base,[x,.069,z],.023,.023,.003,10,[0,0,0],solid,s.name);}
 function windChime(s,x,y,z){rod(C.darkWood,s.base,[x,y+.035,z],[x,y,z],.0009,4,solid,s.name);sphere(C.mint,s.base,[x,y,z],[.013,.012,.013],glass,s.name);rod(C.rope,s.base,[x,y-.003,z],[x,y-.039,z],.0009,4,solid,s.name);box(C.white,s.base,[x,y-.046,z],[.013,.025,.0015],[0,0,.10],solid,s.name);}
 function leafGeometry(length,width,angle=0){const p=[],idx=[],sections=7;for(let j=0;j<=sections;j++){const t=j/sections,w=Math.sin(t*Math.PI)*width,yy=Math.sin(t*Math.PI)*length*.20-t*t*length*.17;for(const side of[-1,0,1])p.push(t*length,yy-(Math.abs(side)*w*.20),side*w);}for(let j=0;j<sections;j++)for(let k=0;k<2;k++){const a=j*3+k;idx.push(a,a+3,a+1,a+1,a+3,a+4);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();g.rotateY(angle);return g;}
 function tropical(s,x,z,height=.29,banana=false,turn=0){
  // Ground the plants beside the deck; palms do not grow from the timber floor.
  const world=new THREE.Vector3(x,0,z).applyMatrix4(s.base),n=world.clone().normalize(),lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z),base=frame(lat,lon,surface.height(n)+.002),lean=.027;
  const top=[lean,height,0];for(let j=0;j<5;j++){const t=j/5,next=(j+1)/5;rod(banana?C.green:C.wood,base,[lean*t*t,height*t,0],[lean*next*next,height*next,0],banana?.012:.009-(t*.004),7,solid,s.name);}
  if(!banana)for(let j=0;j<6;j++){const t=(j+.5)/6;cylinder(C.lightWood,base,[lean*t*t,height*t,0],.0068-t*.0017,.007-t*.0017,.006,7,[0,0,-.09],solid,s.name);}
  const count=banana?5:8;for(let j=0;j<count;j++){const a=turn+j/count*TAU,l=(banana?.11:.135)*(1-.12*(j%3)),w=banana?.032:.014;add(leafGeometry(l,w,a),j%3?C.leaf:C.green,base,[top[0],height-(banana?j*.007:0),0],[0,0,banana?.35:.16],[1,1,1],foliage,s.name);if(!banana){for(let k=1;k<=5;k++){const t=k/6,xx=Math.cos(a)*l*t,zz=-Math.sin(a)*l*t;for(const side of[-1,1]){const g=leafGeometry(.030*(1-t*.58),.006,a+side*.82);add(g,j%2?C.leaf:C.green,base,[top[0]+xx,height+Math.sin(t*Math.PI)*l*.20,zz],[0,0,-.07],[1,1,1],foliage,s.name);}}}}
  if(!banana)for(const dx of[-.009,.006])sphere(C.darkWood,base,[lean+dx,height-.009,.008],[.009,.011,.009],solid,s.name);
  plants.push({type:banana?'banana':'palm',lat,lon,groundHeight:surface.height(n),site:s.name});if(banana)s.record.bananas++;else s.record.palms++;
 }
 function vine(s,x,z,y=.17){for(let j=0;j<9;j++){const yy=.035+j*.016,xx=x+Math.sin(j*.95)*.009;rod(C.green,s.base,[xx,yy,z],[x+Math.sin((j+1)*.95)*.009,yy+.016,z],.0018,5,foliage,s.name);sphere(C.leaf,s.base,[xx+(j%2?.01:-.01),yy,z+.004],[.013,.007,.007],foliage,s.name);if(j%3===0)sphere(C.coral,s.base,[xx,yy+.006,z+.009],[.007,.006,.006],foliage,s.name);}}
 function entranceSteps(s,x,z,width=.11){const n=surface.direction(s.lat,s.lon);for(let i=0;i<3;i++){const zz=z+i*.016,groundPoint=new THREE.Vector3(x,0,zz).applyMatrix4(s.base).normalize(),terrain=groundPoint.clone().multiplyScalar(surface.height(groundPoint)).applyMatrix4(s.inverse),top=-.009-i*.015,bottom=Math.min(terrain.y-.005,top-.006);box(C.stone,s.base,[x,(top+bottom)/2,zz],[width,top-bottom,.022],[0,0,0],solid,s.name);}}

 const tea=makeSite('Sea-glass tea room',.315,.70,.60,.46);mark(tea,'glasshouse tea room with cedar veranda');
 // Glasshouse: timber lower walls, green-painted mullions and a glazed roof.
 const tx=-.024,tz=-.064,tw=.324,td=.210,ty=.190;
 box(C.cream,tea.base,[tx,.033,tz],[tw,.058,td],[0,0,0],solid,tea.name);
 for(const x of[tx-tw/2,tx,tx+tw/2])for(const z of[tz-td/2,tz+td/2])box(C.darkWood,tea.base,[x,.123,z],[.008,.186,.008],[0,0,0],solid,tea.name);
 for(const z of[tz-td/2,tz+td/2]){box(C.mint,tea.base,[tx,.125,z],[tw,.124,.002],[0,0,0],glass,tea.name);for(let i=0;i<7;i++)box(C.cream,tea.base,[tx-tw/2+i*tw/6,.127,z+.002],[.005,.13,.006],[0,0,0],solid,tea.name);for(const y of[.065,.150,.190])box(C.cream,tea.base,[tx,y,z+.002],[tw+.014,.006,.006],[0,0,0],solid,tea.name);}
 for(const x of[tx-tw/2,tx+tw/2])box(C.glass,tea.base,[x,.126,tz],[.002,.128,td],[0,0,0],glass,tea.name);
 const rise=.072,slope=Math.hypot(td/2,rise),pitch=Math.atan2(rise,td/2);for(const side of[-1,1]){box(side>0?C.glass:C.mint,tea.base,[tx,ty+rise/2,tz+side*td/4],[tw+.025,.004,slope+.012],[side*pitch,0,0],glass,tea.name);for(let j=0;j<=6;j++)box(C.cream,tea.base,[tx-tw/2+j*tw/6,ty+rise/2+.004,tz+side*td/4],[.005,.006,slope+.018],[side*pitch,0,0],solid,tea.name);}
 box(C.roof,tea.base,[tx,ty+rise+.004,tz],[tw+.030,.009,.011],[0,0,0],solid,tea.name);
 // Visible plants and pottery behind the translucent panels.
 for(let j=0;j<4;j++){planter(tea,tx-.105+j*.067,tz-.04,.035,j%2===0);sphere(j%2?C.green:C.leaf,tea.base,[tx-.105+j*.067,.108,tz-.04],[.021,.033,.021],foliage,tea.name);}
 box(C.wood,tea.base,[tx,.048,tz+.018],[.24,.015,.046],[0,0,0],solid,tea.name);for(const x of[tx-.095,tx+.095])box(C.darkWood,tea.base,[x,.026,tz+.018],[.007,.044,.030],[0,0,0],solid,tea.name);
 table(tea,.077,.132);chair(tea,.021,.117,Math.PI/2);chair(tea,.133,.149,-Math.PI/2);planter(tea,-.107,.078,.10);planter(tea,.192,.036,.052);lamp(tea,-.258,.16);lamp(tea,.263,.173);windChime(tea,.125,.206,.048);entranceSteps(tea,-.085,.21,.12);mark(tea,'tea cups, chairs, planters, wind chime and garden lamps');
 for(const [x,z,h,a]of[[-.238,-.127,.33,0],[.232,-.130,.30,1],[-.242,.059,.26,2]])tropical(tea,x,z,h,false,a);tropical(tea,.235,.095,.19,true,1.8);
 // A simple painted teacup emblem on a small cream sign.
 box(C.darkWood,tea.base,[-.206,.097,.074],[.067,.065,.006],[0,0,-.08],solid,tea.name);box(C.white,tea.base,[-.206,.097,.079],[.059,.057,.003],[0,0,-.08],solid,tea.name);cylinder(C.red,tea.base,[-.206,.094,.083],.012,.009,.018,8,[Math.PI/2,0,0],solid,tea.name);ring(C.red,tea.base,[-.193,.094,.084],.006,.0017,[0,0,0],tea.name);

 const cottage=makeSite('Tidekeeper hillside cottage',.30,-1.13,.60,.46);mark(cottage,'timber cottage with cream plaster and tiled roof');
 const cx=-.025,cz=-.057,cw=.330,cd=.237;
 box(C.cream,cottage.base,[cx,.120,cz],[cw,.220,cd],[0,0,0],solid,cottage.name);gable(cottage,cx,.230,cz,cw,cd,.092,C.cream);
 for(let j=0;j<8;j++){const y=.024+j*.018;box(j%3?C.wood:C.lightWood,cottage.base,[cx,y,cz+cd/2+.002],[cw+.003,.014,.004],[0,0,0],solid,cottage.name);box(j%3?C.wood:C.lightWood,cottage.base,[cx-cw/2-.002,y,cz],[.004,.014,cd],[0,0,0],solid,cottage.name);box(C.wood,cottage.base,[cx+cw/2+.002,y,cz],[.004,.014,cd],[0,0,0],solid,cottage.name);}
 for(const x of[cx-cw/2,cx+cw/2])box(C.darkWood,cottage.base,[x,.123,cz+cd/2+.006],[.010,.235,.010],[0,0,0],solid,cottage.name);
 roof(cottage,cx,.232,cz,cw+.050,cd+.041,.096);window(cottage,cx-.098,.149,cz+cd/2+.007,.062,.065);window(cottage,cx+.096,.149,cz+cd/2+.007,.056,.065);
 box(C.darkWood,cottage.base,[cx,.071,cz+cd/2+.008],[.057,.134,.011],[0,0,0],solid,cottage.name);box(C.cream,cottage.base,[cx,.097,cz+cd/2+.015],[.038,.054,.004],[0,0,0],lamps,cottage.name);sphere(C.red,cottage.base,[cx+.019,.062,cz+cd/2+.021],[.003,.003,.003],solid,cottage.name);
 // Lean-to veranda with open posts leaves the entrance and warm windows visible.
 for(const x of[cx-.167,cx+.167])box(C.darkWood,cottage.base,[x,.090,.178],[.008,.17,.008],[0,0,0],solid,cottage.name);
 box(C.red,cottage.base,[cx,.192,.128],[cw+.047,.008,.121],[.10,0,0],solid,cottage.name);for(let j=0;j<8;j++)box(C.wood,cottage.base,[cx-.163+j*.047,.198,.128],[.005,.005,.119],[.10,0,0],solid,cottage.name);
 // Compact solar panel, short antenna and fish-shaped weather vane.
 box(C.shadow,cottage.base,[cx+.062,.295,cz+.067],[.118,.006,.064],[.55,0,0],solid,cottage.name);for(let j=0;j<4;j++)box('#689699',cottage.base,[cx+.017+j*.029,.299,cz+.067],[.024,.003,.059],[.55,0,0],solid,cottage.name);
 rod(C.darkWood,cottage.base,[cx-.115,.302,cz],[cx-.115,.414,cz],.0025,5,solid,cottage.name);rod(C.roof,cottage.base,[cx-.145,.387,cz],[cx-.085,.387,cz],.0017,5,solid,cottage.name);sphere(C.red,cottage.base,[cx-.100,.413,cz],[.026,.011,.004],solid,cottage.name);add(new THREE.ConeGeometry(.013,.025,3),C.red,cottage.base,[cx-.131,.413,cz],[0,0,Math.PI/2],[1,1,.4],solid,cottage.name);
 // Fishing net hangs from two timber pegs. The sparse grid reads as netting.
 for(const x of[.161,.269])rod(C.darkWood,cottage.base,[x,.012,-.005],[x,.146,-.005],.003,6,solid,cottage.name);
 for(let j=0;j<=6;j++){const x=.166+j*.016;rod(C.rope,cottage.base,[x,.140,-.005],[x,.054-.007*Math.sin(j),.004],.001,4,solid,cottage.name);}
 for(let j=0;j<6;j++)rod(C.rope,cottage.base,[.166,.058+j*.016,.004],[.263,.057+j*.016,-.005],.001,4,solid,cottage.name);
 for(let j=0;j<4;j++)sphere(j%2?C.white:C.coral,cottage.base,[.168+j*.032,.144,-.005],[.005,.007,.005],solid,cottage.name);
 ring(C.white,cottage.base,[.196,.122,.075],.026,.006,[0,.2,0],cottage.name);for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5])sphere(C.red,cottage.base,[.196+Math.cos(a)*.026,.122+Math.sin(a)*.026,.077],[.007,.006,.006],solid,cottage.name);
 crate(cottage,-.199,.160,.045);crate(cottage,-.243,.131,.033);barrel(cottage,.232,.142);ring(C.rope,cottage.base,[.198,.013,.183],.021,.0028,[Math.PI/2,0,0],cottage.name);ring(C.rope,cottage.base,[.198,.018,.183],.017,.0028,[Math.PI/2,0,0],cottage.name);
 table(cottage,.072,.155);chair(cottage,.129,.157,-Math.PI/2);chair(cottage,.02,.159,Math.PI/2);windChime(cottage,-.109,.173,.184);vine(cottage,-.180,.068);planter(cottage,.159,.089,.052);lamp(cottage,-.273,.185);lamp(cottage,.275,.188);entranceSteps(cottage,-.086,.216,.118);
 // A canvas folding lounger on the open left edge of the veranda.
 const lounger=cottage.base.clone().multiply(new THREE.Matrix4().makeTranslation(-.239,0,.008));for(const x of[-.022,.022]){rod(C.darkWood,lounger,[x,.008,-.041],[x,.051,.037],.0022,5,solid,cottage.name);rod(C.darkWood,lounger,[x,.009,.045],[x,.038,-.034],.0022,5,solid,cottage.name);}box(C.white,lounger,[0,.043,0],[.046,.004,.078],[.25,0,0],solid,cottage.name);box(C.mint,lounger,[0,.069,-.051],[.046,.004,.044],[-.83,0,0],solid,cottage.name);
 for(const [x,z,h,a]of[[-.241,-.144,.33,1],[.241,-.126,.31,2],[-.257,.083,.24,.3]])tropical(cottage,x,z,h,false,a);tropical(cottage,.244,.055,.195,true,.5);mark(cottage,'solar roof, fish weather vane, fishing net, crates, barrel, lifebuoy, rope, lounger and tea table');

 const shrine=makeSite('Enoshima sea-breeze shrine',-.27,1.16,.66,.59);mark(shrine,'vermilion torii, lanterns and small island shrine');
 // A mossy stone court overlays the structural platform and its nine footings.
 box(C.stone,shrine.base,[0,.012,0],[.66,.020,.59],[0,0,0],solid,shrine.name);for(let i=0;i<7;i++)box(i%2?'#cbd0b6':'#d8d6bc',shrine.base,[0,.026,.247-i*.064],[.092,.010,.055],[0,0,0],solid,shrine.name);
 const sz=-.137;box(C.stone,shrine.base,[0,.040,sz],[.28,.038,.211],[0,0,0],solid,shrine.name);box(C.darkWood,shrine.base,[0,.078,sz],[.23,.035,.170],[0,0,0],solid,shrine.name);box(C.cream,shrine.base,[0,.169,sz],[.208,.157,.150],[0,0,0],solid,shrine.name);
 for(const x of[-.102,.102])for(const z of[sz-.075,sz+.075])box(C.red,shrine.base,[x,.172,z],[.012,.19,.012],[0,0,0],solid,shrine.name);gable(shrine,0,.247,sz,.212,.164,.073,C.cream);roof(shrine,0,.250,sz,.282,.221,.072);box(C.darkWood,shrine.base,[0,.148,sz+.080],[.092,.102,.008],[0,0,0],solid,shrine.name);for(const x of[-.039,0,.039])box(C.lightWood,shrine.base,[x,.15,sz+.086],[.004,.099,.006],[0,0,0],solid,shrine.name);for(const y of[.13,.17])box(C.lightWood,shrine.base,[0,y,sz+.089],[.085,.004,.004],[0,0,0],solid,shrine.name);
 for(let j=0;j<3;j++)box(C.stone,shrine.base,[0,.037+j*.012,sz+.135-j*.020],[.11,.020,.025],[0,0,0],solid,shrine.name);
 // Torii: subtly tapered posts, extended upper lintel and raised end caps.
 const gate=.160;for(const x of[-.125,.125]){cylinder(C.red,shrine.base,[x,.177,gate],.008,.012,.297,9,[0,0,x>0?.028:-.028],solid,shrine.name);cylinder(C.darkWood,shrine.base,[x,.051,gate],.013,.015,.052,9,[0,0,0],solid,shrine.name);box(C.stone,shrine.base,[x,.031,gate],[.042,.014,.045],[0,0,0],solid,shrine.name);}
 box(C.red,shrine.base,[0,.273,gate],[.310,.018,.020],[0,0,0],solid,shrine.name);box(C.red,shrine.base,[0,.327,gate],[.356,.024,.031],[0,0,0],solid,shrine.name);box(C.roof,shrine.base,[0,.343,gate],[.371,.010,.034],[0,0,0],solid,shrine.name);for(const side of[-1,1])box(C.roof,shrine.base,[side*.179,.348,gate],[.031,.009,.037],[0,0,side*.14],solid,shrine.name);box(C.darkWood,shrine.base,[0,.300,gate+.015],[.031,.042,.008],[0,0,0],solid,shrine.name);box(C.cream,shrine.base,[0,.300,gate+.020],[.017,.028,.002],[0,0,0],solid,shrine.name);
 for(let j=0;j<7;j++){const x=-.094+j*.031;rod(C.rope,shrine.base,[x,.274,gate+.023],[x+.032,.272-Math.sin(j*.5)*.008,gate+.023],.0028,5,solid,shrine.name);if(j%2===0)box(C.white,shrine.base,[x,.253,gate+.025],[.010,.022,.0015],[0,0,j%4?.2:-.2],solid,shrine.name);}
 for(const x of[-.218,.218]){cylinder(C.stone,shrine.base,[x,.095,.028],.016,.023,.134,6,[0,0,0],solid,shrine.name);box(C.white,shrine.base,[x,.174,.028],[.030,.035,.029],[0,0,0],lamps,shrine.name);box(C.stone,shrine.base,[x,.197,.028],[.057,.013,.052],[0,0,0],solid,shrine.name);cylinder(C.roof,shrine.base,[x,.215,.028],0,.040,.028,4,[0,Math.PI/4,0],solid,shrine.name);}
 // Low stone walls, moss, a purification basin, and orange flowers.
 for(const x of[-.306,.306]){box(C.stone,shrine.base,[x,.055,-.050],[.027,.072,.395],[0,0,0],solid,shrine.name);box(C.moss,shrine.base,[x,.094,-.050],[.030,.008,.403],[0,0,0],solid,shrine.name);}
 box(C.stone,shrine.base,[-.211,.052,-.146],[.070,.061,.064],[0,0,0],solid,shrine.name);box(C.glass,shrine.base,[-.211,.084,-.146],[.050,.004,.045],[0,0,0],glass,shrine.name);rod(C.lightWood,shrine.base,[-.248,.087,-.146],[-.174,.087,-.146],.0026,6,solid,shrine.name);sphere(C.lightWood,shrine.base,[-.186,.091,-.14],[.009,.005,.008],solid,shrine.name);
 planter(shrine,.219,-.188,.064);planter(shrine,-.250,.22,.049);planter(shrine,.247,.229,.049);tropical(shrine,-.250,-.221,.31,false,1.3);tropical(shrine,.257,-.214,.335,false,.2);entranceSteps(shrine,0,.29,.12);mark(shrine,'purification basin, shimenawa rope, stone approach and tropical garden');

 for(const {parts,material,name}of batches.values()){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeBoundingSphere();g.computeBoundingBox();ownedGeometry.add(g);const mesh=new THREE.Mesh(g,material);mesh.name=name+' · '+material.name;mesh.castShadow=material!==glass;mesh.receiveShadow=true;if(material===glass)mesh.renderOrder=3;root.add(mesh);meshes.push(mesh);}
 const stats={focalGroups:sites.length,palms:plants.filter(p=>p.type==='palm').length,bananaPlants:plants.filter(p=>p.type==='banana').length,foundationSupports:sites.length*9,drawCalls:meshes.length,triangles:meshes.reduce((sum,m)=>sum+m.geometry.attributes.position.count/3,0),landmarks:sites.map(s=>({name:s.name,lat:s.lat,lon:s.lon,features:s.features})),features:features.length};
 root.userData.landmarks=stats;root.userData.sites=sites;root.userData.plants=plants;
 function update(time=0,env={}){if(foliage.userData.shader)foliage.userData.shader.uniforms.uIslandTime.value=Number.isFinite(time)?time:0;lamps.emissiveIntensity=.14+THREE.MathUtils.clamp(env.night??1-(env.daylight??1),0,1)*1.9;}
 update();root.updateMatrixWorld(true);
 return{root,stats,update,dispose(){root.removeFromParent();ownedGeometry.forEach(g=>g.dispose());ownedMaterial.forEach(m=>m.dispose());}};
}
