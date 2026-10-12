import {THREE} from './core.js';
import {createParkAnimal} from '../festival-planet/animal-model.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// The little camp is authored on the cove's level sandy terrace. +Z faces sea.
export function createDesertBeachLife({palette}){
 const root=new THREE.Group();root.name='沙湾里的蓝帐篷、独木舟与小小营火';
 const painted=palette.m('#ffffff').clone();painted.vertexColors=true;painted.side=THREE.DoubleSide;
 const owned=new Set(),props=[],animals=[],cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,8),UP=new THREE.Vector3(0,1,0);
 const C={blue:'#828eb9',blueLight:'#a0abd0',blueShade:'#616e9b',teal:'#398e95',tealDark:'#347179',cream:'#f7e7bc',wood:'#a47750',woodLight:'#d5ac71',bark:'#74543f',rope:'#d7c296',rock:'#a18e76',rockLight:'#beaa87',coral:'#d97963',ochre:'#d5a457',sand:'#ddba81',ink:'#4e6059',steel:'#acb9b2',sage:'#8caa93'};
 const stats={tents:1,canoes:1,paddles:1,animals:2,chairs:2,stools:1,fireLights:1,embers:12,staticMeshes:1,meshes:0,triangles:0,drawCalls:0};
 let disposed=false,lastTime=0;
 function builder(){
  const parts=[];
  function add(source,color,p=[0,0,0],s=[1,1,1],r=[0,0,0],f=null){
   const g=source.clone();for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);if(!g.attributes.normal)g.computeVertexNormals();
   if(!g.index){const idx=new Uint32Array(g.attributes.position.count);for(let i=0;i<idx.length;i++)idx[i]=i;g.setIndex(new THREE.BufferAttribute(idx,1));}
   const m=new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),new THREE.Vector3(...s));if(f)m.premultiply(f);g.applyMatrix4(m);g.clearGroups();
   const c=new THREE.Color(color),rgb=new Float32Array(g.attributes.position.count*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(rgb,3));parts.push(g);
  }
  const box=(c,p,s,r,f)=>add(cube,c,p,s,r,f),ball=(c,p,s,r,f)=>add(sphere,c,p,s,r,f);
  function cylinder(c,p,top,bottom,h,r=[0,0,0],f=null,n=12){const g=new THREE.CylinderGeometry(top,bottom,h,n);add(g,c,p,[1,1,1],r,f);g.dispose();}
  function bar(c,a,b,r,f=null,n=7){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p),m=new THREE.Matrix4().compose(p.add(q).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,v.clone().normalize()),new THREE.Vector3(1,1,1));if(f)m.premultiply(f);const g=new THREE.CylinderGeometry(r,r,v.length(),n);add(g,c,[0,0,0],[1,1,1],[0,0,0],m);g.dispose();}
  function torus(c,p,r,t,rotation=[Math.PI/2,0,0],f=null){const g=new THREE.TorusGeometry(r,t,5,18);add(g,c,p,[1,1,1],rotation,f);g.dispose();}
  function polygon(c,vertices,indices,f=null){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));g.setIndex(indices);g.computeVertexNormals();add(g,c,[0,0,0],[1,1,1],[0,0,0],f);g.dispose();}
  function finish(name,parent=root){const g=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());g.computeBoundingBox();g.computeBoundingSphere();owned.add(g);const mesh=new THREE.Mesh(g,painted);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  return{add,box,ball,cylinder,bar,torus,polygon,finish};
 }
 const scenery=builder();
 const frame=(x,z,yaw=0,y=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(UP,yaw),new THREE.Vector3(1,1,1));
 const tent=frame(.37,-.38);
 // Genuine open A-frame: two roof slopes, rear triangle and narrow tied flaps.
 scenery.polygon(C.blueShade,[[-.20,.012,-.24],[0,.33,-.24],[0,.33,.24],[-.20,.012,.24]],[0,1,2,0,2,3],tent);
 scenery.polygon(C.blue,[[.20,.012,-.24],[0,.33,-.24],[0,.33,.24],[.20,.012,.24]],[0,2,1,0,3,2],tent);
 scenery.polygon(C.tealDark,[[-.194,.013,-.235],[.194,.013,-.235],[0,.322,-.235]],[0,1,2],tent);
 scenery.box(C.teal,[0,.012,0],[.378,.008,.465],[0,0,0],tent);
 scenery.polygon(C.teal,[[-.19,.016,.238],[0,.315,.238],[-.097,.022,.246]],[0,1,2],tent);
 scenery.polygon(C.blueLight,[[.20,.013,.242],[0,.33,.242],[.123,.021,.247]],[0,2,1],tent);
 for(const side of [-1,1]){
  scenery.bar(C.blueLight,[side*.2,.014,-.24],[0,.332,-.24],.0028,tent);
  scenery.bar(C.blueLight,[side*.2,.014,.243],[0,.332,.243],.003,tent);
  scenery.bar(C.blueShade,[side*.2,.014,-.24],[side*.2,.014,.24],.0025,tent);
  for(const z of [-.235,.232]){const x=side*.2,stakeX=side>0?.286:-.272,stakeZ=z>0?.295:-.300;scenery.bar(C.rope,[x,.063,z],[stakeX,.006,stakeZ],.0018,tent,5);scenery.bar(C.wood,[stakeX,.001,stakeZ],[stakeX+side*.003,.027,stakeZ+.008],.0025,tent);}
 }
 scenery.bar(C.cream,[0,.334,-.245],[0,.334,.245],.003,tent);scenery.bar(C.rope,[0,.326,-.24],[0,.008,-.307],.0018,tent);scenery.bar(C.wood,[0,.001,-.307],[.003,.022,-.301],.0025,tent);
 scenery.box('#819c9c',[0,.026,-.02],[.134,.019,.322],[0,0,0],tent);scenery.ball(C.cream,[0,.050,-.138],[.056,.018,.032],[0,0,0],tent);scenery.box(C.sage,[0,.040,.025],[.126,.009,.154],[0,0,0],tent);
 for(let i=0;i<4;i++)scenery.box(C.cream,[0,.045,.065+i*.017],[.121,.001,.003],[0,0,0],tent);
 scenery.box(C.sand,[.37,.004,-.089],[.174,.004,.070]);for(let i=-3;i<=3;i++)scenery.box(C.teal,[.37+i*.022,.0063,-.089],[.005,.001,.068]);
 // A hollow lapstrake canoe: open interior, raised ends, separate gunwales.
 const boat=frame(.29,.20,-.4),N=40;
 const ring=(i,sx,sz,y)=>{const a=i/N*Math.PI*2;return[Math.sin(a)*.080*sx,y+Math.pow(Math.abs(Math.cos(a)),5)*.025,Math.cos(a)*.25*sz];};
 const profile=[[.10,.58,.012],[.73,.95,.025],[1,1,.078],[.84,.98,.078],[.61,.91,.030],[.12,.60,.022]];
 for(let r=0;r<profile.length-1;r++){const vertices=[],indices=[];for(let i=0;i<=N;i++){vertices.push(ring(i,...profile[r]),ring(i,...profile[r+1]));if(i<N){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}scenery.polygon([C.coral,C.coral,C.ochre,C.ochre,C.woodLight][r],vertices,indices,boat);}
 const floorVertices=[[0,.025,0]],floorIndices=[];for(let i=0;i<=N;i++){floorVertices.push(ring(i,...profile[5]));if(i<N)floorIndices.push(0,i+1,i+2);}scenery.polygon(C.woodLight,floorVertices,floorIndices,boat);
 for(const side of [-1,1]){const points=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;points.push(new THREE.Vector3(Math.sin(a)*.080*side,.079+Math.pow(Math.abs(Math.cos(a)),5)*.025,Math.cos(a)*.25));}const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.0033,5,false);scenery.add(g,C.cream,[0,0,0],[1,1,1],[0,0,0],boat);g.dispose();}
 for(const z of [-.105,.103])scenery.box(C.wood,[0,.064,z],[.120,.012,.028],[0,0,0],boat);
 scenery.bar(C.bark,[.101,.040,-.226],[.101,.04,.172],.0035,boat);scenery.ball(C.ochre,[.101,.040,.205],[.022,.005,.050],[0,0,0],boat);scenery.box(C.cream,[.101,.046,.205],[.003,.001,.086],[0,0,0],boat);
 // Fire stones are irregular rounded forms, with three crossed split logs.
 const FIRE=new THREE.Vector3(-.13,0,-.20);
 for(let i=0;i<11;i++){const a=i*Math.PI*2/11,r=.087;scenery.ball(i%3?C.rock:C.rockLight,[FIRE.x+Math.cos(a)*r,.015,FIRE.z+Math.sin(a)*r],[.018,.015+.003*(i%2),.014],[0,-a,.09*Math.sin(i)]);}
 for(let i=0;i<3;i++){const f=frame(FIRE.x,FIRE.z,i*Math.PI/3);scenery.cylinder(C.bark,[0,.025,0],.012,.014,.126,[Math.PI/2,0,0],f,9);for(const side of [-1,1]){scenery.cylinder(C.woodLight,[0,.025,side*.064],.010,.010,.0018,[Math.PI/2,0,0],f,10);scenery.bar(C.wood,[.010,.030,-.046],[.010,.029,.045],.0015,f);}}
 // An extra little stool sits on the sea-facing side of the fire.
 function stool(f,color,size=1){for(const side of [-1,1]){scenery.bar(C.wood,[side*.052*size,.004,-.042*size],[side*.052*size,.064*size,.042*size],.0045*size,f);scenery.bar(C.wood,[side*.052*size,.004,.042*size],[side*.052*size,.064*size,-.042*size],.0045*size,f);}scenery.box(color,[0,.066*size,0],[.12*size,.006*size,.099*size],[0,0,0],f);}
 stool(frame(.027,-.111,-.2),C.cream,.8);
 function animalChair(f){stool(f,C.sage,.9);scenery.box(C.sage,[0,.113,-.046],[.108,.074,.005],[-.12,0,0],f);for(const side of [-1,1])scenery.bar(C.wood,[side*.055,.053,-.039],[side*.055,.153,-.054],.0043,f);scenery.bar(C.wood,[-.061,.153,-.054],[.061,.153,-.054],.004,f);}
 const friends=[{species:'rabbit',name:'棉棉',x:-.36,z:-.20,yaw:1.01,phase:.3,outfit:'#c6ae9b'},{species:'corgi',name:'阿栗',x:-.08,z:-.51,yaw:-.12,phase:2.7,outfit:'#9badad'}];
 for(const friend of friends){const f=frame(friend.x,friend.z,friend.yaw);animalChair(f);const holder=new THREE.Group();holder.name=`${friend.name} · 听海的小伙伴`;holder.position.set(friend.x,.069,friend.z);holder.rotation.y=friend.yaw;root.add(holder);const actor=createParkAnimal({palette,species:friend.species,outfit:friend.outfit,pose:'sit',size:.19});holder.add(actor.root);const paw=actor.root.getObjectByName('Right sleeve and paw'),head=actor.root.getObjectByName('Face and ears'),prop=builder();
  if(friend.species==='rabbit'){prop.cylinder(C.cream,[.046,-.068,.089],.046,.039,.071,[0,0,0],null,14);prop.cylinder('#865d40',[.046,-.031,.089],.037,.037,.001,[0,0,0],null,14);prop.torus(C.teal,[.046,-.032,.089],.043,.003);prop.torus(C.cream,[.093,-.068,.089],.022,.006,[0,0,0]);}
  else{prop.box(C.wood,[.046,-.04,.09],[.137,.158,.030],[0,0,.10]);prop.box('#edc990',[.046,-.04,.108],[.111,.130,.010],[0,0,.10]);prop.box('#f3de96',[.041,-.03,.116],[.040,.034,.006],[0,0,-.2]);}
  props.push(prop.finish(friend.species==='rabbit'?'棉棉的搪瓷热可可杯':'阿栗的黄油面包',paw));animals.push({...friend,holder,actor,paw,head});
 }
 // Backpack, a wood crate with a moka pot, cooler and a tidy firewood stack.
 scenery.ball(C.ochre,[-.48,.066,-.535],[.049,.063,.035]);scenery.box(C.wood,[-.48,.065,-.500],[.067,.043,.009]);scenery.box(C.cream,[-.48,.103,-.5],[.075,.018,.008]);for(const side of [-1,1])scenery.bar(C.bark,[-.48+side*.026,.015,-.503],[-.48+side*.026,.11,-.503],.0026);scenery.torus(C.bark,[-.48,.128,-.535],.015,.003,[0,0,0]);
 const crate=frame(-.505,-.40);scenery.box(C.wood,[0,.041,0],[.104,.078,.085],[0,0,0],crate);for(let i=-1;i<=1;i++)scenery.box(C.woodLight,[i*.032,.082,0],[.028,.007,.088],[0,0,0],crate);for(const y of [.024,.057])scenery.box(C.bark,[0,y,.044],[.106,.003,.002],[0,0,0],crate);
 scenery.cylinder(C.steel,[0,.106,0],.017,.025,.044,[0,0,0],crate,6);scenery.cylinder(C.steel,[0,.148,0],.025,.015,.043,[0,0,0],crate,6);scenery.cylinder(C.ink,[0,.172,0],.025,.023,.006,[0,0,0],crate,6);scenery.ball(C.ink,[0,.181,0],[.005,.006,.005],[0,0,0],crate);scenery.torus(C.ink,[.031,.142,0],.018,.004,[0,0,0],crate);scenery.bar(C.steel,[-.018,.144,0],[-.036,.158,0],.005,crate);
 const cooler=frame(.047,-.606,-.03);scenery.box(C.teal,[0,.040,0],[.115,.078,.085],[0,0,0],cooler);scenery.box(C.cream,[0,.083,0],[.122,.012,.090],[0,0,0],cooler);scenery.box(C.ink,[0,.066,.045],[.019,.023,.006],[0,0,0],cooler);scenery.bar(C.wood,[-.038,.105,0],[.038,.105,0],.004,cooler);for(const side of [-1,1])scenery.bar(C.steel,[side*.04,.085,0],[side*.04,.105,0],.0025,cooler);
 for(let i=0;i<5;i++){const x=-.505+(i%3-1)*.022,y=.014+Math.floor(i/3)*.023,z=-.061;scenery.cylinder(C.bark,[x,y,z],.011,.012,.119,[0,0,Math.PI/2],null,8);scenery.cylinder(C.woodLight,[x+.060,y,z],.010,.010,.002,[0,0,Math.PI/2],null,8);}
 scenery.cylinder(C.cream,[.031,.013,-.294],.014,.011,.026);scenery.torus(C.teal,[.031,.027,-.294],.013,.0015);scenery.torus(C.cream,[.047,.014,-.294],.007,.002,[0,0,0]);
 const staticMesh=scenery.finish('蓝色帐篷、空心独木舟与露营生活细节 · 合批');staticMesh.matrixAutoUpdate=false;cube.dispose();sphere.dispose();
 // One instanced flame draw, twelve sparks, one soft ground wash, one light.
 const flameGeometry=new THREE.SphereGeometry(1,12,10),fp=flameGeometry.attributes.position;for(let i=0;i<fp.count;i++){const y=fp.getY(i),t=(y+1)*.5,s=1-t*.60;fp.setXYZ(i,fp.getX(i)*s+Math.pow(t,3)*.23,y,fp.getZ(i)*s);}flameGeometry.computeVertexNormals();
 const flameMaterial=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),flame=new THREE.InstancedMesh(flameGeometry,flameMaterial,7);flame.name='营火 · 七片柔软的火舌';flame.instanceMatrix.setUsage(THREE.DynamicDrawUsage);flame.frustumCulled=false;root.add(flame);for(let i=0;i<7;i++)flame.setColorAt(i,new THREE.Color(i<4?'#f39c49':i<6?'#ffd375':'#fff1ad'));
 const glowMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uStrength:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uStrength;void main(){float d=length(vUv-.5)*2.;float a=pow(max(0.,1.-d),2.0)*uStrength;gl_FragColor=vec4(1.,.49,.15,a);}'}),glowGeometry=new THREE.CircleGeometry(.23,40),glow=new THREE.Mesh(glowGeometry,glowMaterial);glow.name='营火投在沙上的暖光';glow.position.set(FIRE.x,.0015,FIRE.z);glow.rotation.x=-Math.PI/2;root.add(glow);
 const emberGeometry=new THREE.BufferGeometry(),emberPos=new Float32Array(36),emberColors=new Float32Array(36);emberGeometry.setAttribute('position',new THREE.BufferAttribute(emberPos,3));emberGeometry.setAttribute('color',new THREE.BufferAttribute(emberColors,3));const emberMaterial=new THREE.PointsMaterial({color:'#ffe8b6',size:.006,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),embers=new THREE.Points(emberGeometry,emberMaterial);embers.name='十二枚慢慢升起的小火星';embers.frustumCulled=false;root.add(embers);
 const light=new THREE.PointLight('#ffb66d',0,1.30,2);light.name='沙湾营火暖光';light.position.set(FIRE.x,.15,FIRE.z);light.castShadow=false;root.add(light);
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),scale=new THREE.Vector3();
 function update(time,env={}){
  if(disposed)return;lastTime=Number.isFinite(time)?time:0;const night=THREE.MathUtils.clamp(Number(env.night)||0,0,1),dusk=THREE.MathUtils.clamp(Number(env.dusk??env.sunset)||0,0,1),warm=Math.max(night,dusk*.55),pulse=.93+.07*Math.sin(lastTime*4.1)+.025*Math.sin(lastTime*7.3);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/4,t=lastTime*(2.1+i*.11)+i*.91,inner=i>=4,r=inner?.012:.027;p.set(FIRE.x+Math.cos(a)*r+Math.sin(t)*.003,inner?.068:.086,FIRE.z+Math.sin(a)*r);scale.set(inner?.017:.024,(inner?.044:.065)*(1+Math.sin(t)*.12),inner?.014:.021);q.setFromEuler(new THREE.Euler(.07*Math.sin(t*.7),a,.1*Math.sin(t)));matrix.compose(p,q,scale);flame.setMatrixAt(i,matrix);}flame.instanceMatrix.needsUpdate=true;
  glowMaterial.uniforms.uStrength.value=(.04+warm*.52)*pulse;light.intensity=(.025+warm*.58)*pulse;
  for(let i=0;i<12;i++){const age=((lastTime*.19+i/12)%1+1)%1,a=i*2.4+lastTime*.25;emberPos[i*3]=FIRE.x+Math.sin(a)*(.012+age*.039);emberPos[i*3+1]=.076+age*.25;emberPos[i*3+2]=FIRE.z+Math.cos(a*.83)*(.013+age*.029);const glow=(1-age)**2*(.26+warm*.74);emberColors[i*3]=glow;emberColors[i*3+1]=glow*.66;emberColors[i*3+2]=glow*.20;}emberGeometry.attributes.position.needsUpdate=true;emberGeometry.attributes.color.needsUpdate=true;
  for(const a of animals){const t=lastTime+a.phase,bite=Math.pow(Math.max(0,Math.sin(t*.58)),2);a.actor.animate(t,{walk:0,wave:0,cheer:0});a.paw.rotation.set(-.68-bite*.63,0,.12);a.head.rotation.x+=bite*.035;if(a.species==='rabbit')a.head.rotation.y-=.13;}
 }
 root.userData.dynamic=true;update(0);root.traverse(o=>{if(o.isMesh){stats.meshes++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}if(o.isMesh||o.isPoints)stats.drawCalls++;});
 return{root,stats,update,dispose(){if(disposed)return;disposed=true;for(const prop of props)prop.removeFromParent();for(const a of animals)a.actor.dispose();for(const g of owned)g.dispose();flame.dispose();for(const g of[flameGeometry,glowGeometry,emberGeometry])g.dispose();for(const m of[painted,flameMaterial,glowMaterial,emberMaterial])m.dispose();root.removeFromParent();}};
}
