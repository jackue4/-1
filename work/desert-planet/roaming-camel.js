import {THREE,R,TAU} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {planCamelRoute} from './camel-route.js';

const SPEED=.105,UP=new THREE.Vector3(0,1,0);

/** A single baby dromedary, with no independent clock or animation loop. */
export function createRoamingCamel({palette,height,landField}){
 const route=planCamelRoute({height,landField});
 const root=new THREE.Group();root.name='小沙 · 巡游沙海的小骆驼';root.userData.dynamic=true;
 const walker=new THREE.Group();walker.name='沿真实陆地巡游';root.add(walker);
 const material=palette.m('#ffffff').clone();material.vertexColors=true;
 const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,16,11),detailSphere=new THREE.SphereGeometry(1,10,7),owned=new Set(),legs=[];
 const C={fur:'#e4bf87',light:'#efcf9d',cream:'#fff0cf',caramel:'#c59868',hoof:'#987351',ink:'#4b4541',pink:'#e9aaa1',mint:'#83b9ad',mintDark:'#549d98',rose:'#d89491',gold:'#dfb35e',wood:'#a78357'};
 function builder(){
  const pieces=[];
  function add(source,color,p=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
   const g=source.clone();for(const a of Object.keys(g.attributes))if(!['position','normal'].includes(a))g.deleteAttribute(a);if(!g.attributes.normal)g.computeVertexNormals();
   if(!g.index){const index=new Uint32Array(g.attributes.position.count);for(let i=0;i<index.length;i++)index[i]=i;g.setIndex(new THREE.BufferAttribute(index,1));}
   g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale)));g.clearGroups();
   const c=new THREE.Color(color),rgb=new Float32Array(g.attributes.position.count*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(rgb,3));pieces.push(g);
  }
  const ball=(color,p,s,r)=>add(Math.max(...s)<.022?detailSphere:sphere,color,p,s,r),box=(color,p,s,r)=>add(cube,color,p,s,r);
  function bar(color,a,b,r){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),g=new THREE.CylinderGeometry(r,r,d.length(),9),m=new THREE.Matrix4().compose(p.add(q).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,d.normalize()),new THREE.Vector3(1,1,1));g.applyMatrix4(m);add(g,color);g.dispose();}
  function line(color,points,r,segments=12){const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,6,false);add(g,color);g.dispose();}
  function torus(color,p,r,t,rotation=[Math.PI/2,0,0]){const g=new THREE.TorusGeometry(r,t,5,16);add(g,color,p,[1,1,1],rotation);g.dispose();}
  function finish(name,parent){const g=mergeGeometries(pieces,false);pieces.forEach(p=>p.dispose());g.computeBoundingSphere();g.computeBoundingBox();owned.add(g);const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  return{add,ball,box,bar,line,torus,finish};
 }
 const bodyRig=new THREE.Group();bodyRig.name='小小单峰与薄荷鞍毯';walker.add(bodyRig);const body=builder();
 body.ball(C.fur,[0,.150,-.018],[.052,.048,.083]);
 body.ball(C.light,[0,.199,-.035],[.037,.055,.046]);
 body.ball(C.cream,[0,.135,.039],[.037,.028,.040]);
 body.ball(C.fur,[0,.180,.037],[.033,.037,.040]);
 // Delicate rolled blanket, scalloped trim, tiny side satchel and tassels.
 for(const side of [-1,1]){
  body.box(C.mint,[side*.050,.152,-.021],[.008,.068,.103],[0,0,side*.16]);
  body.box(C.cream,[side*.055,.126,-.021],[.002,.008,.099],[0,0,side*.16]);
  for(const z of [-.052,-.021,.010])body.box(C.rose,[side*.055,.157,z],[.002,.050,.007],[0,0,side*.16]);
  for(let k=0;k<5;k++){body.bar(C.cream,[side*.052,.117,-.064+k*.022],[side*.058,.106,-.062+k*.022],.0015);body.ball(C.rose,[side*.058,.106,-.062+k*.022],[.002,.003,.002]);}
 }
 body.box(C.wood,[0,.195,.012],[.043,.009,.026]);body.bar(C.wood,[-.025,.202,.015],[.025,.202,.015],.003);
 body.ball(C.rose,[-.067,.151,-.034],[.019,.024,.027]);body.box(C.cream,[-.083,.155,-.034],[.002,.006,.043]);body.box(C.gold,[-.085,.150,-.025],[.002,.007,.006]);
 body.line(C.caramel,[[0,.157,-.098],[.009,.127,-.112],[.020,.108,-.106]],.004);body.ball(C.caramel,[.021,.103,-.106],[.007,.012,.007]);
 body.finish('圆润的身体、单峰、流苏和小旅行包',bodyRig);
 const headRig=new THREE.Group();headRig.name='好奇地看向旅途';headRig.position.set(0,.179,.048);bodyRig.add(headRig);const head=builder();
 head.line(C.light,[[0,-.006,-.003],[0,.029,.005],[0,.054,.018]],.019,14);
 head.ball(C.fur,[0,.072,.021],[.039,.040,.039]);head.ball(C.cream,[0,.057,.050],[.031,.023,.032]);
 for(const side of [-1,1]){
  head.ball(C.fur,[side*.039,.100,.009],[.010,.024,.012],[0,0,-side*.52]);
  head.ball(C.pink,[side*.041,.102,.019],[.004,.014,.002],[0,0,-side*.52]);
  head.ball(C.cream,[side*.026,.076,.052],[.012,.015,.005]);
  head.ball(C.ink,[side*.027,.076,.056],[.0075,.010,.003]);
  head.ball('#fff9ed',[side*.025,.081,.059],[.0027,.0032,.0015]);
  head.ball(C.pink,[side*.028,.057,.071],[.0085,.004,.0016]);
  head.ball(C.caramel,[side*.011,.056,.080],[.0026,.0024,.0016]);
  head.bar(C.caramel,[side*.032,.092,.047],[side*.022,.094,.051],.0013);
 }
 for(let i=0;i<3;i++)head.ball(C.light,[(i-1)*.010,.113+Math.sin(i)*.004,.018],[.008,.012,.008],[0,0,(i-1)*.32]);
 head.line(C.caramel,[[-.010,.044,.074],[0,.041,.078],[.010,.044,.074]],.0013,8);
 head.torus(C.mintDark,[0,.019,.006],.022,.003,[Math.PI/2-.20,0,0]);
 head.ball(C.gold,[0,.002,.030],[.006,.007,.005]);head.torus(C.cream,[0,-.002,.030],.0055,.0012);head.ball(C.caramel,[0,-.008,.030],[.0018,.002,.0018]);
 head.finish('大眼睛、小耳朵与会轻摇的铃铛',headRig);
 for(const x of [-.036,.036])for(const z of [-.064,.043]){
  const pivot=new THREE.Group();pivot.name=`${x<0?'左':'右'}${z<0?'后':'前'}腿`;pivot.position.set(x,.139,z);walker.add(pivot);const leg=builder();
  leg.bar(C.fur,[0,0,0],[0,-.060,-.005],.011);leg.ball(C.fur,[0,-.061,-.005],[.013,.016,.013]);
  leg.bar(C.light,[0,-.063,-.005],[0,-.119,.003],.0075);leg.ball(C.hoof,[0,-.129,.010],[.012,.010,.020]);
  leg.bar(C.caramel,[0,-.132,.019],[0,-.128,.029],.0013);leg.finish('柔软的小腿与分瓣脚掌',pivot);
  legs.push({pivot,x,z,phase:(x<0?0:Math.PI)+(z<0?Math.PI:0)});
 }
 cube.dispose();sphere.dispose();detailSphere.dispose();
 const current={normal:new THREE.Vector3(),position:new THREE.Vector3()},soleProbes=[[0,-.139,.010],[0,-.1377,.020],[0,-.1377,0],[-.0085,-.1361,.010],[.0085,-.1361,.010],[0,-.129,.030]];
 const up=new THREE.Vector3(),east=new THREE.Vector3(),south=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),v=new THREE.Vector3(),right=new THREE.Vector3(),forward=new THREE.Vector3(),surfaceEast=new THREE.Vector3(),surfaceSouth=new THREE.Vector3(),matrix=new THREE.Matrix4(),inverse=new THREE.Matrix4(),one=new THREE.Vector3(1,1,1);
 let disposed=false,time=0,night=0;
 function groundAt(n,tangent,offset,target){target.copy(n).multiplyScalar(R).addScaledVector(tangent,offset).normalize();return target.multiplyScalar(height(target));}
 function update(value,env={}){
  if(disposed)return;time=Number.isFinite(value)?value:0;night=THREE.MathUtils.clamp(Number(env.night)||0,0,1);const distance=time*SPEED;
  route.sample(distance,current);
  const n=current.normal;east.set(n.z,0,-n.x).normalize();south.crossVectors(east,n).normalize();
  groundAt(n,east,.025,a);groundAt(n,east,-.025,b);surfaceEast.subVectors(a,b);
  groundAt(n,south,.025,a);groundAt(n,south,-.025,b);surfaceSouth.subVectors(a,b);
  up.crossVectors(surfaceSouth,surfaceEast).normalize();if(up.dot(n)<0)up.negate();
  forward.copy(east).multiplyScalar(Math.sin(current.heading)).addScaledVector(south,Math.cos(current.heading));forward.addScaledVector(up,-forward.dot(up)).normalize();
  right.crossVectors(up,forward).normalize();forward.crossVectors(right,up).normalize();
  walker.position.copy(current.position).addScaledVector(up,.003);matrix.makeBasis(right,up,forward);walker.quaternion.setFromRotationMatrix(matrix);
  const stride=distance/.130*TAU;bodyRig.position.y=.002*(1+Math.sin(stride*2));bodyRig.rotation.z=Math.sin(stride)*.018;headRig.rotation.set(.02+Math.sin(stride+.4)*.028,Math.sin(time*.47)*.075,Math.sin(time*.63)*.025);
  matrix.compose(walker.position,walker.quaternion,one);inverse.copy(matrix).invert();
  for(const leg of legs){const phase=stride+leg.phase,swing=Math.sin(phase),lift=Math.max(0,swing)*.011,rotation=swing*.31;
   leg.pivot.rotation.x=rotation;
   // Each paw follows the actual dune under its swinging contact position.
   const footZ=leg.z+Math.sin(rotation)*.129+.010*Math.cos(rotation);v.set(leg.x,0,footZ).applyMatrix4(matrix).normalize();v.multiplyScalar(height(v)).applyMatrix4(inverse);
   leg.pivot.scale.y=THREE.MathUtils.clamp((.139-v.y-lift)/(.139*Math.cos(rotation)),.65,1.35);
   for(let pass=0;pass<2;pass++){
    let clearance=Infinity;const sin=Math.sin(rotation),cos=Math.cos(rotation);
    for(const [x,y,z]of soleProbes){const sy=y*leg.pivot.scale.y;v.set(leg.x+x,.139+sy*cos-z*sin,leg.z+sy*sin+z*cos).applyMatrix4(matrix);const radius=v.length();v.divideScalar(radius);clearance=Math.min(clearance,radius-height(v));}
    leg.pivot.scale.y=THREE.MathUtils.clamp(leg.pivot.scale.y+(clearance-(.002+lift))/(.139*cos*Math.max(.65,up.dot(n))),.55,1.5);
   }
  }
 }
 const stats={animals:1,species:'baby-dromedary',name:'小沙',drawCalls:0,meshes:0,triangles:0,speed:SPEED,cycleSeconds:route.length/SPEED,route:route.evidence};
 root.traverse(o=>{if(o.isMesh){stats.meshes++;stats.drawCalls++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 function getPose(aspect=1){
  walker.updateWorldMatrix(true,false);const fit=Math.max(1,.85/Math.max(.2,aspect)),target=walker.localToWorld(new THREE.Vector3(0,.16,.025)),position=walker.localToWorld(new THREE.Vector3(.43*fit,.16+.47*fit,.025+.80*fit));
  return{position,target,up:new THREE.Vector3(0,1,0).transformDirection(walker.matrixWorld)};
 }
 update(0);
 return{root,stats,update,getPose,getRouteNormals:()=>route.directions.map(n=>n.clone()),getState:()=>({name:'小沙',time,night,disposed,location:current.location,progress:current.distance/route.length,distance:current.distance,speed:SPEED,lat:Math.asin(current.normal.y),lon:Math.atan2(current.normal.x,current.normal.z),position:walker.position.toArray(),quaternion:walker.quaternion.toArray(),route:route.evidence}),dispose(){if(disposed)return;disposed=true;for(const geometry of owned)geometry.dispose();material.dispose();root.removeFromParent();}};
}
