import {THREE} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// One toon material and six rigid, vertex-coloured meshes per guest. The
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
const FUR={rabbit:'#fff2df',bear:'#c89764',corgi:'#d59a5c',cat:'#bbb7ce'};
const NAMES={rabbit:'棉棉',bear:'麦麦',corgi:'阿栗',cat:'露露'};
const CREAM='#fff2db',INK='#394944',PINK='#efa4a7';

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
    add(new THREE.SphereGeometry(1,large?12:8,large?8:6),color,position,scale,rotation);
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
  shape.moveTo(-.053,0);shape.lineTo(-.015,.143);shape.quadraticCurveTo(.002,.15,.02,.124);shape.lineTo(.07,.005);shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:1,curveSegments:3});
}

/**
 * +Z is forward; sit origin is the cushion contact and walk origin the soles.
 * `size` scales normalized units. With no accessory, neutral seated heights:
 * rabbit .872, bear .695, corgi .698, cat .698 (before size).
 * `animate` changes only internal rig joints, never the root transform.
 */
export function createParkAnimal({palette,species='rabbit',outfit='#92beb3',pose='walk',size=1,accessory='none'}={}){
  if(!palette)throw new Error('createParkAnimal needs the scene palette');
  if(!FUR[species])species='rabbit';
  const seated=pose==='sit',fur=FUR[species],material=acquireMaterial(palette);
  const root=new THREE.Group();root.name=`${NAMES[species]} · ${species}`;root.userData.dynamic=true;
  root.userData.animal={species,name:NAMES[species],pose:seated?'sit':'walk',accessory};root.scale.setScalar(size);
  const neck=seated?.48:.68,shoulder=seated?.315:.46,bodyCenter=seated?.182:.323;
  const body=builder(),head=builder(),leftArm=builder(),rightArm=builder(),leftFoot=builder(),rightFoot=builder();
  body.ellipsoid(fur,[0,bodyCenter+.02,0],[.167,seated?.192:.224,.135]);
  body.ellipsoid(outfit,[0,bodyCenter,0],[.176,seated?.182:.215,.149]);
  // A cream sailor collar, stitched buttons and a tiny star visitor badge.
  for(const side of [-1,1])body.ellipsoid(CREAM,[side*.052,bodyCenter+.135,.121],[.070,.027,.018],[0,0,side*.32]);
  for(const y of [-.034,.030])body.ellipsoid('#e5bd6c',[0,bodyCenter+y,.150],[.012,.012,.007]);
  body.add(starGeometry(.033),'#ffe4a2',[-.090,bodyCenter+.047,.135],[1,1,1],[0,-.25,-.10]);
  body.ellipsoid(fur,[0,seated?.13:.224,-.157],species==='corgi'?[.075,.065,.07]:species==='cat'?[.055,.11,.08]:[.073,.073,.073],[species==='cat'?-.4:0,0,0]);

  const headScale=species==='corgi'?[.237,.181,.174]:species==='rabbit'?[.224,.192,.181]:[.224,.194,.180];
  head.ellipsoid(fur,[0,0,0],headScale);
  if(species==='rabbit'){
    for(const side of [-1,1]){
      head.ellipsoid(fur,[side*.108,.235,-.006],[.054,.157,.052],[0,0,-side*.105]);
      head.ellipsoid('#f0b4b4',[side*.109,.245,.041],[.029,.119,.010],[0,0,-side*.105]);
    }
  }else if(species==='bear'){
    for(const side of [-1,1]){
      head.ellipsoid(fur,[side*.161,.151,-.012],[.071,.064,.053]);
      head.ellipsoid('#dea683',[side*.161,.151,.035],[.038,.036,.012]);
    }
  }else{
    for(const side of [-1,1]){
      head.add(pointedEar(),fur,[side*.142,.069,-.01],[side,1,1]);
      head.add(pointedEar(),PINK,[side*.142,.083,.034],[side*.55,.66,.18]);
    }
  }
  if(species==='corgi'){
    head.ellipsoid(CREAM,[0,.024,.152],[.052,.131,.039]);
    head.ellipsoid(CREAM,[0,-.063,.153],[.149,.088,.079]);
  }else{
    head.ellipsoid(CREAM,[0,-.072,.161],[.102,.069,.054]);
  }
  // Large clean eyes stay legible from the ride cameras; a single highlight
  // avoids fine texture detail becoming noisy when guests are very small.
  for(const side of [-1,1]){
    head.ellipsoid(INK,[side*.082,.018,.168],[.022,.029,.015]);
    head.ellipsoid('#ffffff',[side*.081-.005,.028,.181],[.007,.008,.004]);
    head.ellipsoid(PINK,[side*.141,-.047,.147],[.038,.018,.012],[0,side*.22,0]);
    head.ellipsoid(fur,[side*.089,.070,.154],[.036,.013,.01],[0,0,-side*.12]);
  }
  head.ellipsoid(INK,[0,-.045,species==='corgi'?.234:.216],[.024,.016,.012]);
  head.ellipsoid(INK,[0,-.081,species==='corgi'?.224:.215],[.007,.018,.005]);
  for(const side of [-1,1])head.ellipsoid(INK,[side*.013,-.097,species==='corgi'?.217:.207],[.017,.005,.005],[0,0,side*.19]);
  // A small bow belongs to the head so it moves with every curious glance.
  if(species==='rabbit'||species==='cat'){
    for(const side of [-1,1])head.ellipsoid(outfit,[.144+side*.030,.157,.082],[.038,.029,.016],[0,0,side*.3]);
    head.ellipsoid('#eabd78',[.144,.157,.101],[.012,.014,.010]);
  }
  for(const [arm,side] of [[leftArm,-1],[rightArm,1]]){
    arm.ellipsoid(outfit,[side*.033,-.035,0],[.067,.081,.067],[0,0,side*.16]);
    arm.ellipsoid(fur,[side*.046,-.105,.022],[.060,.067,.060]);
    arm.ellipsoid(CREAM,[side*.047,-.129,.054],[.035,.027,.020]);
  }
  for(const [foot,side] of [[leftFoot,-1],[rightFoot,1]]){
    foot.ellipsoid(fur,[0,seated?.015:-.043,seated?.054:.019],[.071,seated?.063:.087,seated?.108:.080]);
    foot.ellipsoid(CREAM,[0,seated?.012:-.072,seated?.109:.065],[.055,.038,.041]);
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
    for(const child of root.children)child.geometry?.dispose();
    releaseMaterial(palette);root.removeFromParent();
  }
  return{root,animate,dispose};
}
