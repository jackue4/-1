import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWorld,direction,R,terrainHeight} from './world.js';
import {createSurfaceNavigation,circleObstacle} from './surface-navigation.js';
import {POND_SITE,PLOT_SITES} from './layout.js';
const checks=[];function test(name,fn){fn();checks.push(name);}
test('A solid obstacle forces a detour, with continuous non-penetrating motion and eventual arrival',()=>{
 const middle=direction(.28,0),nav=createSurfaceNavigation({height:()=>R+.15,R,obstacles:[circleObstacle(middle,.20,'house')]}),actor={normal:direction(.28,-.40)},goal=direction(.28,.40),path=nav.route(actor.normal,goal);
 assert.ok(path.length>1);let maxDeviation=0;for(let i=0;i<500;i++){const before=actor.normal.clone();nav.move(actor,goal,1/30,i/30);assert.ok(!nav.blocked(actor.normal));assert.ok(before.distanceTo(actor.normal)<.003);maxDeviation=Math.max(maxDeviation,Math.abs(Math.asin(actor.normal.y)-.28));}assert.ok(actor.normal.distanceTo(goal)<.025);assert.ok(maxDeviation>.12);
});
const w=createWorld(),env={rain:0,snow:0,night:0,wind:.3,mist:0,cloud:.2};
test('Relocating construction supplies invalidates an occupied goal and keeps the actor walking safely',()=>{
 const solids=[],nav=createSurfaceNavigation({height:()=>R+.15,R,obstacles:solids}),actor={normal:direction(.3,-.4)},goal=direction(.3,.4),pile=circleObstacle(direction(.3,0),.14,'supplies');pile.dynamic=true;solids.push(pile);
 for(let i=0;i<650;i++){if(i===70)pile.normal.copy(goal);const before=actor.normal.clone();nav.move(actor,goal,1/30,i/30);assert.ok(!nav.blocked(actor.normal));assert.ok(before.distanceTo(actor.normal)<.003);}
 assert.ok(actor.normal.distanceTo(nav.safeGoal(goal))<.025);
});
test('Only two enlarged cottages remain; later saved construction stages produce garden furniture',()=>{
 assert.equal(w.cottages.length,2);assert.ok(w.cottages.every(c=>c.house.scale.x>1.1));for(const id of ['house2','house3','house4'])assert.equal(w.construction.targets[id].kind,'garden');
 assert.ok(terrainHeight(direction(POND_SITE.lat,POND_SITE.lon))<R+.081);assert.ok(w.yard.water.geometry.attributes.position.count>400);
});
test('Blocked destinations are projected outside house porches and pond boundaries',()=>{for(const c of w.cottages){const n=c.root.position.clone().normalize();assert.ok(w.navigation.blocked(n));assert.ok(!w.navigation.blocked(w.navigation.safeGoal(n)));}assert.ok(w.navigation.blocked(w.yard.center));});
test('A gardener can reach every farm work position without crossing scene solids',()=>{
 const actor={normal:w.navigation.safeGoal(direction(.58,.08))};
 for(const site of PLOT_SITES){const target=direction(site.lat-.063,site.lon);assert.ok(!w.navigation.blocked(target),`work target is clear: ${site.col}/${site.row}`);const path=w.navigation.route(actor.normal,target);assert.ok(path.length>0,`farm route exists: ${site.col}/${site.row}`);let from=actor.normal;for(const point of path){assert.ok(w.navigation.segmentClear(from,point));from=point;}actor.normal.copy(target);}
});
test('Actual resident walking and shelter transitions do not penetrate static entities',()=>{
 for(let frame=0;frame<600;frame++){w.update(1/30,frame/30,{...env,rain:frame>360?1:0});for(const p of w.residents)assert.ok(!w.navigation.blocked(p.normal),`${p.name} penetrated at ${frame}`);}
 assert.ok(w.residents.every(p=>p.umbrella.visible));
});
test('All four residents have short-fur geometry and a rounded rig, with distinct original species',()=>{
 assert.equal(new Set(w.residents.map(p=>p.species)).size,4);assert.ok(w.residents.some(p=>p.species==='柯基'));
 for(const p of w.residents){let painted=0,triangles=0;p.root.traverse(o=>{if(o.isMesh){if(o.material.userData.plush)painted++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(painted>=6);assert.ok(triangles<10500);assert.equal(p.limbs.length,4);}
});
w.dispose();console.log(JSON.stringify({passed:checks.length,checks},null,2));
