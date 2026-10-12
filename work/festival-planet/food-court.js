import {THREE,R,normal,point} from './core.js';
import {createFoodStalls} from './food-stalls.js';
import {createFoodGuests} from './food-guests.js';
import {batchScenery} from './optimize.js';
import {FOOD_COURT} from './snack-layout.js';

// The little terrace occupies the clearing beside the west garden path.
export {FOOD_COURT} from './snack-layout.js';
export function createFoodCourt({planet,palette,surface}){
 const {lat,lon}=FOOD_COURT,up=normal(lat,lon),east=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),south=new THREE.Vector3().crossVectors(east,up);
 const root=new THREE.Group();root.name='热狗与冰淇淋 · 林间小吃广场';root.position.copy(up).multiplyScalar(surface.height(up)+.006);root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east,up,south));planet.add(root);root.updateWorldMatrix(true,false);
 const positions=[],colors=[],indices=[],segments=72,rings=9,centerZ=.27,rx=.96,rz=.87;
 const cream=new THREE.Color('#efdfba'),rose=new THREE.Color('#dab995'),earth=new THREE.Color('#a6b97b'),c=new THREE.Color(),v=new THREE.Vector3();
 // Flat paving meets a sloping grass bank; no floating disc around the globe.
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,f=j/rings,x=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),1/3)*rx*f,z=centerZ+Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),1/3)*rz*f;
  v.set(x,0,z).applyMatrix4(root.matrixWorld).normalize().multiplyScalar(surface.height(v.clone().normalize())+.002);root.worldToLocal(v);
  const edge=THREE.MathUtils.smoothstep(f,.90,1),y=THREE.MathUtils.lerp(.007,v.y,edge);positions.push(x,y,z);
  c.copy(cream).lerp(rose,(Math.floor((x+.91)*20)+Math.floor((z+.62)*22))%2===0?.13:.02).lerp(earth,edge);c.toArray(colors,colors.length);
  if(j<rings&&i<segments){const k=j*(segments+1)+i;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
 const mat=palette.m('#ffffff').clone();mat.vertexColors=true;mat.side=THREE.DoubleSide;const ground=new THREE.Mesh(g,mat);ground.name='林间小吃铺的奶油石砖台地';ground.receiveShadow=true;ground.userData.dynamic=true;root.add(ground);
 // Fine paving joints add scale without a noisy image texture.
 const joints=new THREE.Group();joints.name='细石砖缝';root.add(joints);const jointMat=palette.m('#d8c8a8');
 for(let row=-3;row<=6;row++){const z=row*.115;for(let col=-7;col<=7;col++){const x=col*.12+(row%2)*.06;if((x/rx)**6+((z-centerZ)/rz)**6>.51)continue;const seam=new THREE.Mesh(new THREE.BoxGeometry(.115,.0014,.0018),jointMat);seam.position.set(x,.009,z);joints.add(seam);if(col%2===0){const short=new THREE.Mesh(new THREE.BoxGeometry(.0018,.0014,.11),jointMat);short.position.set(x-.058,.009,z-.056);joints.add(short);}}}
 const stalls=createFoodStalls({THREE,palette,parent:root}),guests=createFoodGuests({THREE,palette,parent:root});
 const batching=batchScenery(root);root.userData.dynamic=true;
 function getPose(aspect=1){root.updateWorldMatrix(true,false);const fit=Math.max(1,.86/aspect),target=root.localToWorld(new THREE.Vector3(.04,.19,.20)),position=root.localToWorld(new THREE.Vector3(.04-.88*fit,.19+.50*fit,.20+2.25*fit));return{target,position,up:up.clone().transformDirection(planet.matrixWorld)};}
 let disposed=false;
 return{root,guests,stalls,getPose,update(time,env){stalls.update?.(time,env);guests.update(time,env);},getState:()=>({location:FOOD_COURT,stalls:stalls.stats,guests:guests.getState(),batching}),dispose(){if(disposed)return;disposed=true;guests.dispose();stalls.dispose?.();const geometry=new Set();root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);});geometry.forEach(x=>x.dispose());mat.dispose();root.removeFromParent();}};
}
