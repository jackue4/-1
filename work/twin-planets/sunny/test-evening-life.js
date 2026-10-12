import assert from 'node:assert/strict';
import {createWorld,direction,terrainHeight} from './world.js';
import {pathLat} from './layout.js';
const w=createWorld(),checks=[],day={rain:0,snow:0,cloud:.2,wind:.3,night:0,mist:0,sunset:0};
let t=0;function frames(count,env){for(let i=0;i<count;i++){t+=1/20;w.update(1/20,t,env);}}
frames(20,day);
assert.ok(w.pathLights.getState().count>=10);assert.equal(w.pathLights.getState().on,false);assert.equal(w.pathLights.pools.parent,w.planet);assert.ok(w.pathLights.pools.geometry.attributes.uv);
const p=w.pathLights.pools.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=direction(0,0).fromBufferAttribute(p,i);assert.ok(Math.abs(v.length()-terrainHeight(v.clone().normalize())-.009)<1e-5);}
frames(70,{...day,sunset:.95});assert.ok(w.pathLights.getState().brightness>.95);checks.push('Shared path lanterns turn on at dusk and their light pools conform to the curved ground');
let walkedOnRoad=0;for(let i=0;i<600;i++){frames(1,day);for(const r of w.residents)if(r.activity==='沿着小路悠闲散步'&&Math.abs(Math.asin(r.normal.y)-pathLat(Math.atan2(r.normal.x,r.normal.z)))<.055)walkedOnRoad++;}
assert.ok(walkedOnRoad>100);assert.ok(w.residents.some(r=>r.activity!=='沿着小路悠闲散步'));checks.push('Some residents stroll on the footpath while other residents retain leisure');
const night={...day,night:1,farmJobs:new Map([[0,{normal:direction(.18,.1),lookAt:direction(.2,.1),kind:'water'}]])};
let openDoor=false;for(let i=0;i<2800;i++){const before=w.residents.map(r=>r.normal.clone());frames(1,night);for(const [j,r] of w.residents.entries()){assert.ok(!w.navigation.blocked(r.normal));assert.ok(r.normal.distanceTo(before[j])<.0044,'night return does not teleport');assert.equal(r.working,false);}openDoor ||= w.cottages.some(c=>c.getState().doorAmount>.8);if(w.homes.getState().inside===4)break;}
assert.equal(w.homes.getState().inside,4,JSON.stringify(w.residents.map(r=>({name:r.name,mode:r.homeState,normal:r.normal.toArray()}))));assert.ok(openDoor);assert.ok(w.residents.every(r=>!r.root.visible));assert.ok(w.pathLights.getState().on);frames(80,night);assert.ok(w.cottages.every(c=>c.getState().doorAmount<.02));checks.push('All four residents stop work, return without penetrating solids, enter homes and close the doors at night');
frames(300,day);assert.equal(w.homes.getState().inside,0);assert.ok(w.residents.every(r=>r.root.visible));assert.equal(w.pathLights.getState().on,false);checks.push('Morning turns lamps off and residents leave their homes in staggered groups');
// Entering a weather preview twice must not permanently hide or duplicate anyone.
frames(1700,night);assert.equal(w.homes.getState().inside,4);frames(300,day);assert.ok(w.residents.every(r=>r.root.visible));checks.push('Repeated morning/night previews recover all four original residents');
w.dispose();console.log(JSON.stringify({passed:checks.length,checks},null,2));
