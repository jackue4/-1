import {THREE} from './core.js';

// A portrait follows an existing walking visitor; it never relocates a guest
// or changes the park's simulation clock. Local +Z is the face direction.
export function createAnimalPortraits(animals){
 const subjects=animals.getSubjects().filter(subject=>!subject.ride);
 const friends=Object.fromEntries(['rabbit','bear','corgi'].map(species=>[species,subjects.find(s=>s.root.userData.animal.species===species)?.root]));
 function getPose(species,aspect=1){
  const root=friends[species]||friends.rabbit;
  root.updateWorldMatrix(true,false);
  const q=root.getWorldQuaternion(new THREE.Quaternion()),up=new THREE.Vector3(0,1,0).applyQuaternion(q),front=new THREE.Vector3(0,0,1).applyQuaternion(q),right=new THREE.Vector3(1,0,0).applyQuaternion(q);
  const size=root.scale.x,target=root.getWorldPosition(new THREE.Vector3()).addScaledVector(up,size*.52),fit=Math.max(1,.78/aspect)*size/.22;
  const position=target.clone().addScaledVector(up,(species==='corgi'?.26:.17)*fit).addScaledVector(front,(species==='rabbit'?.72:species==='corgi'?.54:.62)*fit).addScaledVector(right,.19*fit);
  return{position,target,up};
 }
 return{getPose};
}
