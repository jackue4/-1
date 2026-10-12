import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import {createWorld} from './world.js';
const w=createWorld(),day={rain:0,snow:0,cloud:.2,wind:.3,night:0,mist:0,sunset:0};
let t=0;function frames(n,env){for(let i=0;i<n;i++){t+=.05;w.update(.05,t,env);}}
frames(5,day);
assert.equal(w.residents.length,3);assert.equal(w.fishing.getState().seated,true);assert.ok(w.fishing.getState().waterDepth>.04);
assert.ok(!w.navigation.blocked(w.fishing.normal));assert.ok(w.residents[2].limbs[0].rotation.x<-1);assert.ok(w.fishing.normal.distanceTo(w.lakes[0])>1);
assert.ok(w.fishing.root.children.some(o=>o.isGroup));
assert.equal(w.fishing.getState().spotCount,3);
console.log('PASS: existing corgi sits on a stool at another bay; bobber over submerged terrain',w.fishing.getState());
frames(25,{...day,rain:.8});assert.equal(w.fishing.getState().seated,false);assert.equal(w.fishing.bobber.visible,false);
console.log('PASS: rain ends fishing and hides the line and float');
let reached=false;for(let i=0;i<1800;i++){frames(1,day);if(w.fishing.getState().seated){reached=true;break;}}assert.ok(reached,'walks back to the stool');
console.log('PASS: navigates back to fishing without spawning a new villager');
const seen=new Set(),spots=new Set();let last=w.residents[2].normal.clone();
for(let i=0;i<3800;i++){frames(1,day);const f=w.fishing.getState();seen.add(f.animation);if(f.seated)spots.add(f.spot);assert.ok(last.distanceTo(w.residents[2].normal)<.0044,'changing spots must walk');assert.ok(!w.navigation.blocked(w.residents[2].normal));last.copy(w.residents[2].normal);if(i%100===0){const size=new Box3().setFromObject(w.fishing.bobber).getSize(new Vector3());assert.ok(Math.max(size.x,size.y,size.z)<.6,'splash stays small and never obscures the camera');}}
assert.equal(spots.size,3);for(const a of ['cast','wait','bite','reel','cheer','walking'])assert.ok(seen.has(a),a);
assert.equal(w.travelPet.g.visible,false);
console.log('PASS: visits three reachable fishing spots with casting, bite, reel and celebration animation; only three land animals');
let previous=w.residents[2].normal.clone();
for(let i=0;i<3600;i++){frames(1,{...day,night:1});assert.ok(previous.distanceTo(w.residents[2].normal)<.0044);previous.copy(w.residents[2].normal);assert.ok(!w.navigation.blocked(previous));if(w.homes.getState().inside===3)break;}
assert.equal(w.fishing.getState().seated,false);assert.equal(w.homes.getState().inside,3);
console.log('PASS: fisher walks home at night without teleporting or entering solids; all three sleep');
w.dispose();
