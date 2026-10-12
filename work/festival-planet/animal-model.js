import {THREE} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// One toon material and seven vertex-coloured meshes per guest. The
// palette's gradient texture remains owned by the scene, never by a guest.
const materials=new WeakMap();
function acquireMaterial(palette){
  let entry=materials.get(palette);
  if(!entry){
    const material=palette.m('#ffffff').clone();
    material.vertexColors=true;
    entry={material,count:0};materials.set(palette,entry);
  }
  entry.count++;return entry.material;
}
function releaseMaterial(palette){
  const entry=materials.get(palette);
  if(entry&&!--entry.count){entry.material.dispose();materials.delete(palette);}
}
const FUR={rabbit:'#fff1e1',bear:'#d5a477',corgi:'#dfa469',cat:'#c5bfd9'};
const NAMES={rabbit:'棉棉',bear:'麦麦',corgi:'阿栗',cat:'露露'};
const CREAM='#fff3df',INK='#35413f',PINK='#eea6ae';

function builder(){
  const parts=[];
  function add(source,color,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
    const geometry=source.index?source.toNonIndexed():source;
    if(geometry!==source)source.dispose();
    geometry.applyMatrix4(new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...scale)));
    for(const key of Object.keys(geometry.attributes))if(!['position','normal'].includes(key))geometry.deleteAttribute(key);
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    if(scale[0]*scale[1]*scale[2]<0){
      // Baking a mirrored ear also needs its triangle winding mirrored.
      for(const attribute of Object.values(geometry.attributes)){
        const a=attribute.array,n=attribute.itemSize;
        for(let i=0;i<attribute.count;i+=3)for(let j=0;j<n;j++){
          const one=(i+1)*n+j,two=(i+2)*n+j,value=a[one];a[one]=a[two];a[two]=value;
        }
      }
    }
    const c=new THREE.Color(color),rgb=new Float32Array(geometry.attributes.position.count*3);
    for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}
    geometry.setAttribute('color',new THREE.BufferAttribute(rgb,3));
    geometry.clearGroups();parts.push(geometry);
  }
  const ellipsoid=(color,position,scale,rotation)=>{
    const large=Math.max(...scale)>=.14;
    add(new THREE.SphereGeometry(1,large?20:12,large?14:8),color,position,scale,rotation);
  };
  function finish(material,name){
    const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
    const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  return{add,ellipsoid,finish};
}

function starGeometry(radius=.042){
  const shape=new THREE.Shape();
  for(let i=0;i<10;i++){
    const angle=Math.PI/2+i*Math.PI/5,r=i%2?radius*.45:radius;
    if(i===0)shape.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);
    else shape.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);
  }
  shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.006,bevelEnabled:false});
}

function pointedEar(){
  const shape=new THREE.Shape();
  shape.moveTo(-.057,0);shape.quadraticCurveTo(-.049,.069,-.015,.140);shape.quadraticCurveTo(.001,.162,.021,.130);shape.quadraticCurveTo(.073,.049,.070,.007);shape.quadraticCurveTo(.015,-.015,-.057,0);shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:true,bevelThickness:.007,bevelSize:.007,bevelSegments:2,curveSegments:5});
}

function stitch(points,radius=.004){
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),10,radius,5,false);
}

/**
 * +Z is forward; sit origin is the cushion contact and walk origin the soles.
 * `size` scales normalized units. Rounded cheeks grow sideways; the shorter
 * neck and ears keep the seated silhouette inside the original ride envelope.
 * `animate` changes only internal rig joints, never the root transform.
 */
export function createParkAnimal({palette,species='rabbit',outfit='#92beb3',pose='walk',size=1,accessory='none'}={}){
  if(!palette)throw new Error('createParkAnimal needs the scene palette');
  if(!FUR[species])species='rabbit';
  const seated=pose==='sit',fur=FUR[species],material=acquireMaterial(palette);
  const root=new THREE.Group();root.name=`${NAMES[species]} · ${species}`;root.userData.dynamic=true;
  root.userData.animal={species,name:NAMES[species],pose:seated?'sit':'walk',accessory};root.scale.setScalar(size);
  const neck=seated?.457:.628,shoulder=seated?.300:.420,bodyCenter=seated?.180:.297;
  const body=builder(),head=builder(),eyes=builder(),leftArm=builder(),rightArm=builder(),leftFoot=builder(),rightFoot=builder();
  body.ellipsoid(fur,[0,bodyCenter+.02,0],[.172,seated?.185:.201,.141]);
  body.ellipsoid(outfit,[0,bodyCenter,0],[.187,seated?.180:.200,.157]);
  // Small outfit silhouettes remain readable from the paths and ride cameras.
  for(const side of [-1,1])body.ellipsoid(CREAM,[side*.052,bodyCenter+.119,.127],[.070,.027,.019],[0,0,side*.32]);
  if(species==='bear'){
    for(const side of [-1,1]){
      body.ellipsoid(CREAM,[side*.079,bodyCenter+.048,.138],[.015,.076,.012],[0,0,-side*.10]);
      body.ellipsoid('#e5bd6c',[side*.076,bodyCenter+.049,.155],[.012,.012,.007]);
    }
    body.ellipsoid('#e8d7b5',[0,bodyCenter-.035,.153],[.057,.037,.012]);
    body.add(starGeometry(.022),'#f1ba69',[0,bodyCenter-.026,.167]);
  }else if(species==='corgi'){
    for(const side of [-1,1])body.ellipsoid('#719eaa',[side*.060,bodyCenter+.109,.146],[.048,.009,.011],[0,0,side*.32]);
    for(const side of [-1,1])body.ellipsoid('#df9f9e',[side*.022,bodyCenter+.084,.160],[.032,.023,.013],[0,0,side*.30]);
    body.ellipsoid('#eac277',[0,bodyCenter+.086,.173],[.012,.012,.008]);
  }else{
    for(const y of [-.025,.026])body.ellipsoid('#e5bd6c',[0,bodyCenter+y,.158],[.011,.011,.007]);
    for(const side of [-1,1])body.ellipsoid(CREAM,[side*.111,bodyCenter-.100,.108],[.047,.016,.015],[0,0,side*.20]);
  }
  body.add(starGeometry(.030),'#ffe4a2',[-.113,bodyCenter+.020,.129],[1,1,1],[0,-.3,-.10]);
  body.ellipsoid(fur,[0,seated?.13:.224,-.157],species==='corgi'?[.075,.065,.07]:species==='cat'?[.055,.11,.08]:[.073,.073,.073],[species==='cat'?-.4:0,0,0]);

  const headScale=species==='corgi'?[.251,.197,.184]:species==='rabbit'?[.244,.204,.188]:[.246,.204,.186];
  head.ellipsoid(fur,[0,0,0],headScale);
  for(const side of [-1,1])head.ellipsoid(fur,[side*.122,-.058,.046],[.126,.109,.141]);
  if(species==='rabbit'){
    for(const side of [-1,1]){
      head.ellipsoid(fur,[side*.111,.231,-.006],[.063,.151,.056],[0,0,-side*.17]);
      head.ellipsoid('#efb5bd',[side*.113,.243,.043],[.032,.111,.012],[0,0,-side*.17]);
      head.ellipsoid('#f7d1d0',[side*.116,.280,.051],[.018,.053,.005],[0,0,-side*.17]);
    }
  }else if(species==='bear'){
    for(const side of [-1,1]){
      head.ellipsoid(fur,[side*.178,.145,-.012],[.077,.073,.057]);
      head.ellipsoid('#b77d61',[side*.178,.150,.036],[.044,.041,.013]);
      head.ellipsoid('#eac4a4',[side*.178,.146,.047],[.027,.027,.009]);
    }
  }else{
    for(const side of [-1,1]){
      head.add(pointedEar(),fur,[side*.142,.069,-.01],[side,1,1]);
      head.add(pointedEar(),PINK,[side*.142,.083,.034],[side*.55,.66,.18]);
    }
  }
  if(species==='corgi'){
    head.ellipsoid(CREAM,[0,.030,.163],[.053,.135,.033]);
    // Keep the fluffy white cheeks below the full eye silhouette. A small
    // central snout joins the nose and smile to the cheeks in side views.
    for(const side of [-1,1])head.ellipsoid(CREAM,[side*.063,-.082,.156],[.110,.075,.076]);
    head.ellipsoid(CREAM,[0,-.070,.189],[.070,.050,.043]);
  }else{
    head.ellipsoid(CREAM,[0,-.076,.169],[.116,.066,.050]);
  }
  // Eye centers form their own rigid batch so blinking costs one draw call.
  // The gloss dots and warm lower reflection share the same squash transform.
  for(const side of [-1,1]){
    eyes.ellipsoid(INK,[side*.090,0,.180],[.025,.033,.017]);
    eyes.ellipsoid('#aa9474',[side*.090,-.013,.194],[.013,.010,.003]);
    eyes.ellipsoid('#fffdf3',[side*.090-.007,.011,.196],[.009,.011,.004]);
    eyes.ellipsoid('#fff5dc',[side*.090+.009,-.009,.196],[.004,.005,.002]);
    head.ellipsoid(PINK,[side*.151,-.049,.164],[.046,.024,.013],[0,side*.30,0]);
    head.ellipsoid('#f8c1c4',[side*.156-.009,-.043,.176],[.017,.005,.002],[0,side*.30,0]);
    head.ellipsoid(fur,[side*.092,.081,.163],[.038,.014,.010],[0,0,-side*.12]);
  }
  const muzzleZ=species==='corgi'?.234:.222;
  head.ellipsoid(species==='rabbit'?'#c38c95':INK,[0,-.043,muzzleZ],[.019,.014,.010]);
  head.ellipsoid('#e9c5b0',[-.005,-.039,muzzleZ+.008],[.006,.004,.002]);
  head.add(stitch([[0,-.052,muzzleZ],[0,-.075,muzzleZ-.002]],.0035),INK);
  for(const side of [-1,1])head.add(stitch([[0,-.074,muzzleZ-.002],[side*.014,-.083,muzzleZ-.005],[side*.026,-.074,muzzleZ-(species==='corgi'?.006:.009)]],.0035),INK);
  // A small bow belongs to the head so it moves with every curious glance.
  if(species==='rabbit'||species==='cat'){
    for(const side of [-1,1])head.ellipsoid(outfit,[.149+side*.034,.159,.087],[.042,.032,.020],[0,0,side*.35]);
    head.ellipsoid('#f3d198',[.149,.159,.109],[.014,.016,.010]);
    for(const side of [-1,1])head.ellipsoid(outfit,[.149+side*.018,.131,.094],[.014,.029,.010],[0,0,side*.40]);
  }
  for(const [arm,side] of [[leftArm,-1],[rightArm,1]]){
    arm.ellipsoid(outfit,[side*.033,-.032,0],[.073,.075,.070],[0,0,side*.16]);
    arm.ellipsoid(CREAM,[side*.043,-.069,.011],[.065,.013,.063],[0,0,side*.16]);
    arm.ellipsoid(fur,[side*.046,-.108,.025],[.065,.065,.064]);
    arm.ellipsoid('#edb7b3',[side*.047,-.123,.080],[.028,.025,.009]);
    for(const x of [-.026,0,.026])arm.ellipsoid(CREAM,[side*.047+x,-.092,.079],[.010,.013,.010]);
  }
  for(const [foot,side] of [[leftFoot,-1],[rightFoot,1]]){
    foot.ellipsoid(fur,[0,seated?.015:-.043,seated?.054:.019],[.077,seated?.063:.087,seated?.108:.080]);
    foot.ellipsoid(CREAM,[0,seated?.012:-.072,seated?.109:.065],[.058,.038,.041]);
    if(seated){
      foot.ellipsoid('#e7b0aa',[0,.008,.151],[.026,.024,.005]);
      for(const x of [-.025,0,.025])foot.ellipsoid('#e7b0aa',[x,.038,.145],[.009,.010,.005]);
    }
  }
  if(accessory==='icecream'){
    rightArm.add(new THREE.ConeGeometry(.033,.084,8),'#d6a674',[.046,-.074,.114],[1,1,1],[Math.PI,0,0]);
    rightArm.ellipsoid('#f3b4bf',[.046,-.019,.114],[.047,.046,.047]);
    rightArm.ellipsoid('#fff0d2',[.054,.012,.117],[.030,.024,.030]);
  }else if(accessory==='balloon'){
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.207,shoulder-.102,.035),new THREE.Vector3(-.28,.67,.04),new THREE.Vector3(-.31,1.01,.02)]);
    body.add(new THREE.TubeGeometry(curve,9,.003,3,false),'#eee4cf');
    body.ellipsoid('#efa8bd',[-.31,1.177,.02],[.128,.172,.112]);
    body.ellipsoid('#ffe6d4',[-.356,1.226,.106],[.027,.047,.009],[0,0,-.28]);
    body.add(new THREE.ConeGeometry(.018,.03,6),'#df91af',[-.31,.999,.02]);
  }
  const torso=body.finish(material,'Coat and tail');
  const headMesh=head.finish(material,'Face and ears');headMesh.position.y=neck;
  const eyeMesh=eyes.finish(material,'Blinking eyes');eyeMesh.position.y=species==='corgi'?.030:.020;headMesh.add(eyeMesh);
  headMesh.userData.animalHeadPart=eyeMesh.userData.animalHeadPart=true;
  const armL=leftArm.finish(material,'Left sleeve and paw'),armR=rightArm.finish(material,'Right sleeve and paw');
  armL.position.set(-.154,shoulder,0);armR.position.set(.154,shoulder,0);
  const footL=leftFoot.finish(material,'Left foot'),footR=rightFoot.finish(material,'Right foot');
  footL.position.set(-.084,seated?.066:.133,seated?.064:0);footR.position.set(.084,seated?.066:.133,seated?.064:0);
  root.add(torso,headMesh,armL,armR,footL,footR);
  let disposed=false;
  const phase={rabbit:.1,bear:1.9,corgi:3.4,cat:4.8}[species];
  function animate(time,{walk=0,wave=0,cheer=0}={}){
    const t=Number.isFinite(time)?time:0;
    walk=THREE.MathUtils.clamp(walk,0,1);wave=THREE.MathUtils.clamp(wave,0,1);cheer=THREE.MathUtils.clamp(cheer,0,1);
    const stride=Math.sin(t*7.2+phase)*walk,breathe=Math.sin(t*1.7+phase)*.004;
    torso.position.y=seated||accessory==='balloon'?0:breathe;
    headMesh.position.y=neck+breathe+Math.abs(stride)*.014;
    headMesh.rotation.set(Math.sin(t*1.9+phase)*.028-cheer*.24,Math.sin(t*.83+phase)*(.08+wave*.10),Math.sin(t*1.23+phase)*.035);
    // A short double blink every few seconds, derived solely from visual time.
    // No timers or random state can drift while paused or in selector preview.
    const blinkTime=((t+phase*1.37)%5.7+5.7)%5.7;
    const blink=Math.max(0,1-Math.abs(blinkTime-.15)/.105,1-Math.abs(blinkTime-.40)/.08);
    eyeMesh.scale.y=1-.92*blink;
    const waving=wave*(1.45+Math.sin(t*5.3)*.22),celebrating=cheer*(1.34+Math.sin(t*6.4)*.12);
    // Blend simultaneous greetings and cheers into a natural raised-paw arc.
    // A balloon guest holds the tether with the left paw and waves the right.
    if(accessory==='balloon')armL.rotation.set(-.12,0,-.065);
    else armL.rotation.set(stride*.35-cheer*.38,0,-.065-Math.min(1.8,waving+celebrating));
    armR.rotation.set(-stride*.35-cheer*.38-(accessory==='icecream'?.40:0),0,.065+Math.min(1.8,cheer*(1.34+Math.sin(t*6.4+1)*.12)+(accessory==='balloon'?waving:0)));
    footL.rotation.x=seated?Math.sin(t*2.2+phase)*.095:stride*.42;
    footR.rotation.x=seated?Math.sin(t*2.2+phase+1.2)*.095:-stride*.42;
  }
  function dispose(){
    if(disposed)return;disposed=true;
    root.traverse(child=>child.geometry?.dispose());
    releaseMaterial(palette);root.removeFromParent();
  }
  return{root,animate,dispose};
}
