import {createParkAnimal} from '../festival-planet/animal-model.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {normal,point} from './core.js';

// Two quiet winter visitors. Every pose and stop depends on the scene clock,
// so pausing, previewing another planet and returning cannot advance a walk.
export function createUmbrellaAnimals({THREE,parent,palette,groundHeight,landField}){
 const detailsMaterial=palette.m('#ffffff').clone();detailsMaterial.vertexColors=true;detailsMaterial.side=THREE.DoubleSide;
 const subjects=[],extraGeometry=new Set(),UP=new THREE.Vector3(0,1,0),scratch=new THREE.Vector3();
 function builder(){
  const parts=[];
  function add(source,color,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
   const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();
   g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale)));
   for(const key of Object.keys(g.attributes))if(!['position','normal','color'].includes(key))g.deleteAttribute(key);
   if(!g.attributes.normal)g.computeVertexNormals();
   if(color){const c=new THREE.Color(color),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)c.toArray(a,i);g.setAttribute('color',new THREE.BufferAttribute(a,3));}
   g.clearGroups();parts.push(g);
  }
  const ellipsoid=(color,pos,scale,rotation)=>add(new THREE.SphereGeometry(1,14,10),color,pos,scale,rotation);
  const tube=(pts,radius,color)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),Math.max(6,pts.length*3),radius,5,false),color);
  function finish(name){const geo=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());extraGeometry.add(geo);const out=new THREE.Mesh(geo,detailsMaterial);out.name=name;out.castShadow=true;out.receiveShadow=true;return out;}
  return{add,ellipsoid,tube,finish};
 }
 function paperUmbrella(colors){
  const b=builder(),radius=.70,edge=.79,top=1.035,positions=[],paint=[],panels=18,rings=5,segments=panels*4;
  const height=(x,z)=>{const r=Math.min(1,Math.hypot(x,z)/radius);return edge+(top-edge)*(1-Math.pow(r,1.55));};
  const rim=(a)=>radius*(1-.014*(1-Math.cos(a*panels)));
  const vertex=(r,a)=>[r*Math.cos(a),height(r*Math.cos(a),r*Math.sin(a)),r*Math.sin(a)];
  function triangle(a,b,c,color){positions.push(...a,...b,...c);for(let k=0;k<3;k++)color.toArray(paint,paint.length);}
  for(let i=0;i<segments;i++)for(let j=0;j<rings;j++){
   const a=i/segments*Math.PI*2,a2=(i+1)/segments*Math.PI*2,r=j/rings,r2=(j+1)/rings;
   const color=new THREE.Color(Math.floor(i/4)%2?colors.paper:colors.alternate).lerp(new THREE.Color('#fff0d4'),(1-r)*.06);
   const v0=vertex(r*rim(a),a),v1=vertex(r*rim(a2),a2),v2=vertex(r2*rim(a2),a2),v3=vertex(r2*rim(a),a);
   triangle(v0,v3,v1,color);triangle(v1,v3,v2,color);
  }
  const canopy=new THREE.BufferGeometry();canopy.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));canopy.setAttribute('color',new THREE.Float32BufferAttribute(paint,3));canopy.computeVertexNormals();b.add(canopy);
  // The bamboo spokes can be seen from the low portrait camera under the oilpaper.
  for(let i=0;i<panels;i++){
   const a=i/panels*Math.PI*2,pts=[];for(let j=0;j<=7;j++){const r=j/7*radius;pts.push([Math.cos(a)*r,height(Math.cos(a)*r,Math.sin(a)*r)-.012,Math.sin(a)*r]);}
   b.tube(pts,.006,colors.rib);const end=pts.at(-1);b.ellipsoid(colors.rib,end,[.013,.013,.013]);
  }
  const rimPoints=[];for(let i=0;i<=72;i++){const a=i/72*Math.PI*2,r=radius*(1-.014*(1-Math.cos(a*panels)));rimPoints.push([Math.cos(a)*r,edge-.002,Math.sin(a)*r]);}b.tube(rimPoints,.006,colors.edge);
  b.add(new THREE.CylinderGeometry(.011,.011,top+.055,10),colors.wood,[0,(top-.055)/2,0]);
  b.ellipsoid(colors.wood,[0,top+.028,0],[.022,.041,.022]);
  b.add(new THREE.CylinderGeometry(.030,.023,.047,12),colors.rib,[0,top-.082,0]);
  b.tube([[0,.0,0],[0,-.052,0],[-.018,-.077,0],[-.044,-.070,0],[-.046,-.047,0]],.012,colors.wood);
  // Restrained painted plum blossoms follow the actual curved paper surface.
  function paintPetal(cx,cz,angle,length,width,color){
   const pts=[],col=[],n=10,c=new THREE.Color(color);
   for(let i=0;i<n;i++){const a=i/n*Math.PI*2,a2=(i+1)/n*Math.PI*2;
    for(const q of [[cx,cz],[cx+Math.cos(a)*length*Math.cos(angle)-Math.sin(a)*width*Math.sin(angle),cz+Math.cos(a)*length*Math.sin(angle)+Math.sin(a)*width*Math.cos(angle)],[cx+Math.cos(a2)*length*Math.cos(angle)-Math.sin(a2)*width*Math.sin(angle),cz+Math.cos(a2)*length*Math.sin(angle)+Math.sin(a2)*width*Math.cos(angle)]]){pts.push(q[0],height(...q)+.006,q[1]);c.toArray(col,col.length);}
   }
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.computeVertexNormals();b.add(geo);
  }
  for(let i=0;i<7;i++){
   const a=.20+i*.33,r=.31+(i%3)*.10,x=Math.cos(a)*r,z=Math.sin(a)*r;
   for(let j=0;j<5;j++){const p=j/5*Math.PI*2;paintPetal(x+Math.cos(p)*.029,z+Math.sin(p)*.029,p,.028,.018,colors.flower);}
   paintPetal(x,z,0,.011,.011,'#edc88d');
  }
  // Short scalloped ridges catch fine snow; most of the coloured paper stays visible.
  for(let i=0;i<6;i++){
   const a=i/6*Math.PI*2+.12,pts=[];for(let j=0;j<5;j++){const angle=a+j*.027,r=radius*.955;pts.push([Math.cos(angle)*r,height(Math.cos(angle)*r,Math.sin(angle)*r)+.010,Math.sin(angle)*r]);}b.tube(pts,.010,'#f8f5ed');
  }
  return b.finish('手绘梅花油纸伞 · 竹骨与薄雪');
 }
 const config=[
  {id:'rabbit',name:'棉棉',size:.225,outfit:'#a5b5a8',scarf:'#c77b7b',center:[.912,.047],radii:[.036,.083],phase:.36,period:82,paper:'#c7898b',alternate:'#b97a80',rib:'#e3c5a0',edge:'#ad7277',wood:'#8b665b',flower:'#fff0df'},
  {id:'bear',name:'麦麦',size:.244,outfit:'#8fa4b0',scarf:'#d8b279',center:[-.375,-.465],radii:[.024,.050],phase:3.6,period:96,paper:'#a3c1b7',alternate:'#8cafaa',rib:'#e7d8b7',edge:'#789e95',wood:'#96745f',flower:'#f5e6d9'}
 ];
 for(const cfg of config){
  const anchor=new THREE.Group();anchor.name=`撑伞漫步 · ${cfg.name}`;anchor.userData.dynamic=true;parent.add(anchor);
  const actor=createParkAnimal({palette,species:cfg.id,outfit:cfg.outfit,size:cfg.size,pose:'walk'});anchor.add(actor.root);
  const clothes=builder();
  clothes.add(new THREE.TorusGeometry(.153,.024,8,28),cfg.scarf,[0,.478,.022],[1,1,.78],[Math.PI/2,0,0]);
  for(let i=0;i<5;i++)clothes.ellipsoid(cfg.scarf,[.072,.408-i*.019,.157],[.035,.014,.021],[0,0,-.07]);
  for(const x of [-.017,0,.017])clothes.tube([[.072+x,.320,.159],[.072+x,.306,.166]],.004,'#f4e3cc');
  clothes.ellipsoid('#f9ecda',[-.116,.309,.146],[.029,.033,.010]);
  actor.root.add(clothes.finish('柔软围巾与冬衣'));
  const head=actor.root.getObjectByName('Face and ears'),headwear=builder();
  for(const side of [-1,1]){
   headwear.ellipsoid('#efe8d8',[side*.239,.018,-.008],[.036,.066,.064]);
   headwear.ellipsoid(cfg.scarf,[side*.262,.018,-.003],[.011,.043,.043]);
  }
  // A slender padded band sits behind the face without hiding the animal's ears.
  headwear.tube([[-.239,.04,-.04],[-.21,.13,-.13],[0,.191,-.159],[.21,.13,-.13],[.239,.04,-.04]],.014,cfg.scarf);head.add(headwear.finish('绒绒耳罩'));
  const parasol=new THREE.Group();parasol.name='随步轻摇的纸伞';actor.root.add(parasol);parasol.add(paperUmbrella(cfg));
  const tasselGroup=new THREE.Group();tasselGroup.position.set(-.57,.799,-.34);parasol.add(tasselGroup);const tassel=builder();
  tassel.tube([[0,0,0],[.008,-.060,0],[0,-.107,.003]],.005,'#d5b07e');tassel.ellipsoid('#d6b883',[0,-.109,.002],[.024,.024,.024]);
  for(const x of [-.009,0,.009])tassel.tube([[x,-.133,0],[x+.006,-.171,.006]],.005,cfg.scarf);tasselGroup.add(tassel.finish('纸伞小铃铛'));
  subjects.push({...cfg,root:anchor,actor,parasol,tasselGroup,arm:actor.root.getObjectByName('Right sleeve and paw'),head,lat:0,lon:0,walking:0,ground:0});
 }
 function walkingClock(time,subject){
  // Smooth ease into two pauses per circuit. Integrated analytically: no dt drift.
  const cycle=subject.period,raw=((time+subject.phase*9)%cycle+cycle)%cycle;
  const half=cycle/2,dwell=7,segment=raw<half?0:1,local=raw-segment*half;
  let u=Math.min(1,local/(half-dwell)),rate=local<half-dwell?Math.sin(Math.PI*u):0;
  const eased=.5-.5*Math.cos(Math.PI*u);
  return{angle:subject.phase+Math.PI*(segment+eased),speed:rate,stop:1-rate};
 }
 function sample(subject,time){
  const movement=walkingClock(time,subject),a=movement.angle;
  return{...movement,lat:subject.center[0]+Math.sin(a)*subject.radii[0],lon:subject.center[1]+Math.cos(a)*subject.radii[1]};
 }
 // Flattened paw impressions: a palm and three tiny toes, tinted by age. They
 // are sampled from the same walk function and placed on each foot's terrain
 // height, so rewinding the visual clock restores exactly the same trail.
 const printParts=[];
 for(const [x,z,rx,rz] of [[0,0,.012,.016],[-.009,.017,.0048,.006],[0,.021,.0053,.006],[.009,.017,.0048,.006]]){
  const g=new THREE.CircleGeometry(1,10);g.rotateX(-Math.PI/2);g.scale(rx,1,rz);g.translate(x,0,z);printParts.push(g);
 }
 const printGeometry=mergeGeometries(printParts,false);printParts.forEach(g=>g.dispose());extraGeometry.add(printGeometry);
 const printMaterial=new THREE.MeshBasicMaterial({color:'#829cb2',transparent:true,opacity:.3,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,side:THREE.DoubleSide});
 const prints=new THREE.InstancedMesh(printGeometry,printMaterial,24);prints.name='刚刚走过的雪地小脚印';prints.userData.dynamic=true;prints.castShadow=false;prints.receiveShadow=false;prints.renderOrder=7;prints.frustumCulled=false;parent.add(prints);
 const printMatrix=new THREE.Matrix4(),printQ=new THREE.Quaternion(),printColor=new THREE.Color(),printScale=new THREE.Vector3(),freshPrint=new THREE.Color('#849bad'),oldPrint=new THREE.Color('#e5e9e9');
 function updatePrints(time){
  for(let n=0;n<subjects.length;n++)for(let i=0;i<12;i++){
   const s=subjects[n],step=Math.floor(time/1.65)-i,stamp=step*1.65,p=sample(s,stamp),age=time-stamp,alpha=Math.max(0,1-age/20),side=step%2?1:-1;
   const east=new THREE.Vector3(Math.cos(p.lon),0,-Math.sin(p.lon)),up=normal(p.lat,p.lon),south=new THREE.Vector3().crossVectors(east,up),heading=Math.atan2(-Math.sin(p.angle)*s.radii[1]*Math.cos(p.lat),-Math.cos(p.angle)*s.radii[0]);
   const right=east.clone().multiplyScalar(Math.cos(heading)).addScaledVector(south,-Math.sin(heading)),pos=point(p.lat,p.lon).addScaledVector(right,side*.0205),radial=pos.clone().normalize(),lat=Math.asin(radial.y),lon=Math.atan2(radial.x,radial.z),height=groundHeight(lat,lon)+.0025;
   pos.copy(point(lat,lon,height));printQ.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east,up,south));printQ.multiply(new THREE.Quaternion().setFromAxisAngle(UP,heading));
   const visible=stamp>=0&&p.speed>.12&&landField(lat,lon)>.05&&alpha>0;printScale.setScalar(visible?s.size/.225:0);
   printMatrix.compose(pos,printQ,printScale);prints.setMatrixAt(n*12+i,printMatrix);printColor.copy(freshPrint).lerp(oldPrint,1-alpha);prints.setColorAt(n*12+i,printColor);
  }
  prints.instanceMatrix.needsUpdate=true;if(prints.instanceColor)prints.instanceColor.needsUpdate=true;
 }
 function update(time,env={}){
  const t=Number.isFinite(time)?time:0;
  for(const s of subjects){
   const p=sample(s,t),up=normal(p.lat,p.lon),east=new THREE.Vector3(Math.cos(p.lon),0,-Math.sin(p.lon)),south=new THREE.Vector3().crossVectors(east,up),tangentEast=-Math.sin(p.angle)*s.radii[1]*Math.cos(p.lat),tangentSouth=-Math.cos(p.angle)*s.radii[0],heading=Math.atan2(tangentEast,tangentSouth);
   s.lat=p.lat;s.lon=p.lon;s.walking=p.speed;s.ground=groundHeight(p.lat,p.lon);
   s.root.position.copy(point(p.lat,p.lon,s.ground+.002));s.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east,up,south));s.root.rotateY(heading);
   s.actor.animate(t*.65,{walk:p.speed*.88});
   s.head.rotation.y+=p.stop*Math.sin(t*.42+s.phase)*.19;s.head.rotation.x-=p.stop*.08;
   // The umbrella pole always starts at the actual paw, including its animation.
   s.arm.rotation.set(-.90,0,.22);s.arm.updateMatrix();scratch.set(.046,-.108,.025).applyMatrix4(s.arm.matrix);s.parasol.position.copy(scratch);
   s.parasol.rotation.set(Math.sin(t*1.15+s.phase)*.025,0,Math.sin(t*.91+s.phase)*.025-.06);
   s.tasselGroup.rotation.z=Math.sin(t*1.6+s.phase)*.17;s.tasselGroup.rotation.x=Math.sin(t*1.24+s.phase)*.11;
  }
  updatePrints(t);
 }
 function getPose(id='rabbit',aspect=1){
  const subject=subjects.find(s=>s.id===id)||subjects[0],root=subject.root;root.updateWorldMatrix(true,false);
  // A fixed eastern viewing side keeps the nearby garden roofs behind the
  // visitor. Following the heading would swing the camera through a roof each lap.
  const parentRotation=parent.getWorldQuaternion(new THREE.Quaternion()),up=normal(subject.lat,subject.lon).applyQuaternion(parentRotation),east=new THREE.Vector3(Math.cos(subject.lon),0,-Math.sin(subject.lon)).applyQuaternion(parentRotation),north=new THREE.Vector3().crossVectors(up,east),target=root.getWorldPosition(new THREE.Vector3()).addScaledVector(up,.13),fit=Math.max(1,.65/Math.max(.2,aspect));
  return{position:target.clone().addScaledVector(up,.30*fit).addScaledVector(east,.91*fit).addScaledVector(north,.10*fit),target,up};
 }
 function getState(){return{count:subjects.length,footprintCapacity:24,subjects:subjects.map(s=>{s.root.updateWorldMatrix(true,true);return{id:s.id,name:s.name,lat:s.lat,lon:s.lon,walking:s.walking,ground:s.ground,land:landField(s.lat,s.lon),position:s.root.position.toArray(),scale:s.size,umbrella:true,feet:s.actor.root.children.filter(n=>n.name==='Left foot'||n.name==='Right foot').map(n=>new THREE.Vector3(0,-.130,.02).applyMatrix4(n.matrixWorld).toArray())};})};}
 let disposed=false;
 function dispose(){if(disposed)return;disposed=true;for(const s of subjects){const additions=[];s.actor.root.traverse(o=>{if(o.geometry&&extraGeometry.has(o.geometry))additions.push(o);});for(const addition of additions)addition.removeFromParent();s.actor.dispose();s.root.removeFromParent();}prints.removeFromParent();for(const geo of extraGeometry)geo.dispose();printMaterial.dispose();detailsMaterial.dispose();}
 update(0);
 return{update,getSubjects:()=>subjects,getState,getPose,dispose};
}
