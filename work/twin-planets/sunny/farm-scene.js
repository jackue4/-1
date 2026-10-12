import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {PLOT_SITES} from './layout.js';
import {createSoftLeaf} from './vegetation.js';
import {enhanceFoliage} from './nature.js';

export function createFarmScene({planet,direction,height,gradientMap,uniforms}){
  const root=new THREE.Group();root.name='Sunny kitchen garden';planet.add(root);
  const up=new THREE.Vector3(0,1,0),box=new THREE.BoxGeometry(1,1,1),ball=new THREE.SphereGeometry(1,8,5),cyl=new THREE.CylinderGeometry(1,1,1,12),materials=new Map(),statics=[];
  function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshToonMaterial({color,gradientMap}));return materials.get(color);}
  function add(parent,geo,color,p,s,rigid=true){const m=new THREE.Mesh(geo,mat(color));m.position.set(...p);m.scale.set(...s);m.castShadow=false;m.receiveShadow=true;parent.add(m);if(rigid)statics.push(m);return m;}
  function anchor(lat,lon){const n=direction(lat,lon),g=new THREE.Group();g.position.copy(n).multiplyScalar(height(n)+.008);g.quaternion.setFromUnitVectors(up,n);root.add(g);return g;}
  const plotRoots=[],soils=[],picks=[],normals=PLOT_SITES.map(s=>direction(s.lat,s.lon));
  for(let i=0;i<18;i++){
    const site=PLOT_SITES[i],g=anchor(site.lat,site.lon);g.userData.plotId=i;plotRoots.push(g);
    const soil=add(g,box,'#a47c55',[0,.012,0],[.229,.028,.255],false);soil.material=mat('#a47c55').clone();soil.userData.plotId=i;soils.push(soil);picks.push(soil);
    // Rounded earth banks and furrows, deliberately low and soft.
    for(let j=0;j<3;j++)add(g,ball,'#b48b62',[(j-1)*.067,.029,0],[.018,.015,.111],false);
    for(let side of [-1,1]){add(g,box,'#ccab79',[side*.12,.019,0],[.012,.034,.267],false);add(g,box,'#ddbc88',[0,.019,side*.132],[.25,.034,.012],false);}
    const peg=add(g,box,'#f2dcaa',[.098,.055,.105],[.024,.041,.008],false);peg.rotation.z=-.12;
  }
  // Keep each plot independently pickable while batching its tiny border details.
  function batchLocal(group,exclude=[]){const pieces=[];for(const m of [...group.children]){if(!m.isMesh||exclude.includes(m))continue;m.updateMatrix();const g=m.geometry.clone().applyMatrix4(m.matrix),c=m.material.color,a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));pieces.push(g);m.removeFromParent();}const mesh=new THREE.Mesh(mergeGeometries(pieces),new THREE.MeshToonMaterial({vertexColors:true,gradientMap}));mesh.receiveShadow=true;group.add(mesh);pieces.forEach(g=>g.dispose());}
  plotRoots.forEach((g,i)=>batchLocal(g,[soils[i]]));
  const ring=new THREE.Mesh(new THREE.RingGeometry(.16,.171,40),new THREE.MeshBasicMaterial({color:'#fff3ac',side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;ring.visible=false;
  // A well and potting shed are immediately available to the gardeners.
  const well=anchor(.11,-.34);
  add(well,cyl,'#d4cbb0',[0,.073,0],[.115,.145,.115]);add(well,cyl,'#758f80',[0,.148,0],[.079,.004,.079]);add(well,cyl,'#a0d6c7',[0,.15,0],[.068,.004,.068]);
  for(const x of [-.115,.115])add(well,box,'#a47d55',[x,.22,0],[.025,.32,.025]);
  for(const side of [-1,1]){const roof=add(well,box,'#719c9a',[side*.082,.395,0],[.185,.026,.27]);roof.rotation.z=-side*.4;}
  add(well,cyl,'#805d41',[0,.265,0],[.01,.24,.01]).rotation.z=Math.PI/2;
  add(well,cyl,'#c6a471',[.17,.04,.02],[.033,.06,.033]);
  const shed=anchor(.54,-.31);
  add(shed,box,'#efdcab',[0,.105,0],[.21,.21,.17]);add(shed,box,'#88a897',[0,.085,.089],[.09,.16,.015]);
  for(const side of [-1,1]){const roof=add(shed,box,'#759c90',[side*.065,.245,0],[.155,.025,.24]);roof.rotation.z=-side*.38;}
  for(let i=0;i<4;i++)add(shed,box,'#d4b580',[-.077+i*.05,.12,.091],[.003,.19,.005]);
  const market=anchor(.16,.55);market.userData.farmPlace='market';
  add(market,box,'#b2875d',[0,.07,0],[.32,.14,.19]);add(market,box,'#edcc92',[0,.15,0],[.36,.025,.23]);
  for(const x of [-.15,.15])add(market,box,'#ac885f',[x,.21,-.065],[.013,.32,.013]);
  for(let i=0;i<6;i++){const awning=add(market,box,i%2?'#f4e6c6':'#df937f',[-.165+i*.066,.365,.009],[.067,.015,.29]);awning.rotation.x=.16;add(market,ball,i%2?'#f4e6c6':'#df937f',[-.165+i*.066,.33,.153],[.034,.03,.012]);}
  for(let i=0;i<9;i++)add(market,ball,i<4?'#e87a61':'#ddc76d',[(i%3-1)*.072,.185,Math.floor(i/3)*.055-.055],[.029,.029,.027]);
  const marketPick=add(market,box,'#b2875d',[0,.15,0],[.36,.31,.26],false);marketPick.material=new THREE.MeshBasicMaterial({visible:false});marketPick.userData.farmPlace='market';picks.push(marketPick);
  // Rounded stepping stones connect the beds to the circular village path.
  for(let row=0;row<4;row++)for(let col=0;col<8;col++){const g=anchor(.112+row*.13,-.245+col*.091);add(g,ball,'#d9c69e',[0,.003,0],[.061,.008,.040]);}
  for(let i=0;i<8;i++){const g=anchor(.54+i*.009,-.12+i*.034);add(g,ball,'#ddcda8',[0,0,0],[.05,.007,.038]);}
  // A real unlockable berry grove beyond the village, with its own collection point.
  const orchard=anchor(.92,.46);orchard.name='Berry orchard';orchard.userData.farmPlace='orchard';
  for(let i=0;i<5;i++){const x=(i%3-1)*.13,z=Math.floor(i/3)*.17;add(orchard,ball,'#79a867',[x,.10,z],[.105,.095,.10],false);for(let j=0;j<4;j++)add(orchard,ball,'#e3838b',[x+Math.sin(j*2.4)*.076,.15,z+Math.cos(j*2.4)*.076],[.024,.025,.024],false);}
  batchLocal(orchard);picks.push(orchard);
  // Static furniture collapses into one vertex-colored draw call.
  root.updateMatrixWorld(true);const pieces=[];
  for(const m of statics){const g=m.geometry.clone().applyMatrix4(m.matrixWorld),c=m.material.color,a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));pieces.push(g);m.removeFromParent();}
  const merged=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());const furniture=new THREE.Mesh(merged,new THREE.MeshToonMaterial({vertexColors:true,gradientMap}));furniture.receiveShadow=true;furniture.castShadow=true;root.add(furniture);
  // All crop leaves and fruit share two instanced draw calls, including wind.
  const leafMat=new THREE.MeshToonMaterial({color:'white',gradientMap,side:THREE.DoubleSide}),fruitMat=new THREE.MeshToonMaterial({color:'white',gradientMap});
  const leafDepth=enhanceFoliage(leafMat,uniforms),leaves=new THREE.InstancedMesh(createSoftLeaf(10,.24),leafMat,18*6*4),fruits=new THREE.InstancedMesh(ball,fruitMat,18*6*2);
  leaves.name='Farm crop leaves';fruits.name='Farm fruit';
  leaves.customDepthMaterial=leafDepth;leaves.receiveShadow=fruits.receiveShadow=true;leaves.frustumCulled=fruits.frustumCulled=false;root.add(leaves,fruits);
  const burst=new THREE.InstancedMesh(ball,new THREE.MeshBasicMaterial({color:'#fff0a4',transparent:true,opacity:0,depthWrite:false}),18);burst.count=0;burst.frustumCulled=false;root.add(burst);
  const local=new THREE.Object3D(),base=new THREE.Matrix4(),color=new THREE.Color();let selected=0,signature='',flash=null;
  function instance(mesh,index,g,p,s,tint,rotation=0){local.position.set(...p);local.scale.set(...s);local.rotation.set(0,rotation,rotation*.25);local.updateMatrix();mesh.setMatrixAt(index,base.multiplyMatrices(g.matrix,local.matrix));mesh.setColorAt(index,color.set(tint));}
  function sync(f){
    const sig=JSON.stringify([f.unlocked,f.plots.map(p=>[p.crop,Math.floor(p.growth*80),p.water>0]),f.orchardAt]);if(sig===signature)return;signature=sig;
    let li=0,fi=0;
    for(let i=0;i<18;i++){
      const p=f.plots[i],g=plotRoots[i];g.visible=i<f.unlocked;g.updateMatrix();soils[i].material.color.set(p.water>0?'#785e45':'#ad885e');
      for(let plant=0;plant<6;plant++){
        const x=(plant%2-.5)*.105,z=(Math.floor(plant/2)-1)*.078,alive=i<f.unlocked&&p.crop,gr=alive?p.growth:0,sz=alive?.3+Math.min(1,gr*1.5)*.7:0;
        const wheat=p.crop==='wheat',h=wheat?.032+gr*.13:.027+gr*.06;
        for(let j=0;j<4;j++){const a=j*Math.PI*.5;instance(leaves,li++,g,[x+Math.sin(a)*.024*sz,.035+h*.5,z+Math.cos(a)*.024*sz],[.015*sz,(wheat?.065:.012)*sz,.038*sz],wheat&&gr>.65?'#d4be6b':j%2?'#81ad68':'#5f9b62',a);}
        for(let j=0;j<2;j++){const ripe=alive&&gr>.45,fs=ripe*(gr-.45)/.55*.024;instance(fruits,fi++,g,[x+(j-1)*.022,.037+h*(wheat?1.4:1),z+(j%2)*.012],[fs*(wheat?.52:1),fs*(wheat?1.9:1.06),fs*(wheat?.65:1)],p.crop==='wheat'?'#edce78':p.crop==='tomato'?(gr>.8?'#e97e59':'#b7be6a'):p.crop==='strawberry'?'#d96580':'#eaa0ac');}
      }
    }
    for(const m of [leaves,fruits]){m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;}
    orchard.visible=f.unlocked===18;
  }
  function select(i){selected=i;plotRoots[i].add(ring);ring.visible=true;}
  function pulse(i,kind,t){flash={i,kind,until:t+1.4};burst.count=18;}
  function update(t){ring.material.opacity=.65+Math.sin(t*3)*.2;ring.material.transparent=true;if(flash){
    const age=1.4-(flash.until-t),wet=flash.kind==='water',g=plotRoots[flash.i];burst.material.color.set(wet?'#b8e4ec':'#f4d68b');burst.material.opacity=Math.max(0,1-age/1.4)*.8;
    for(let j=0;j<18;j++){const a=j*2.399,r=.04+age*.075;local.position.set(Math.sin(a)*r,wet?.025+Math.max(0,.21-age*.17)+j*.002:.04+age*.13,Math.cos(a)*r);local.rotation.set(age*2,a,0);local.scale.set(.004,wet?.010:.005,.004);local.updateMatrix();burst.setMatrixAt(j,base.multiplyMatrices(g.matrix,local.matrix));}burst.instanceMatrix.needsUpdate=true;
    ring.scale.setScalar(1+Math.sin(Math.max(0,flash.until-t)*8)*.035);if(t>flash.until){flash=null;burst.count=0;ring.scale.setScalar(1);}}}
  return {root,picks,plotRoots,normals,leaves,fruits,sync,select,pulse,update,orchard,dispose(){leafDepth.dispose();}};
}
