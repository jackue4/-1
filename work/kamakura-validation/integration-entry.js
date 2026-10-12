import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createSurface} from '../kamakura-planet/surface.js';
import {createRailway} from '../kamakura-planet/railway.js';
import {createPetalRain} from '../kamakura-planet/petals.js';
import {oceanWave} from '../kamakura-planet/ocean.js';
import {createMarine} from '../kamakura-planet/marine.js';
import {createTown} from '../kamakura-planet/town.js';

const surface=createSurface(),planet=new THREE.Group(),palette={ramp:null},report={scope:'CPU integration; no rendered-image or GPU proof',checks:[],findings:[]};
function check(name,fn){try{const detail=fn();report.checks.push({name,passed:true,...detail});}catch(e){const error=e.message.slice(0,800);report.checks.push({name,passed:false,error});report.findings.push({name,error});}}
const railway=createRailway({planet,surface,palette}),petals=createPetalRain({planet,surface,palette,sources:[surface.direction(.32,-.35)]}),marine=createMarine({planet,surface,palette});
const day={daylight:1,night:0,dusk:0},matrix=new THREE.Matrix4(),position=new THREE.Vector3();
check('Closed railway sampling and carriage placement',()=>{
 assert.ok(railway.sample(0).position.distanceTo(railway.sample(1).position)<1e-8);
 assert.ok(railway.sample(-.02).position.distanceTo(railway.sample(.98).position)<1e-8);
 let minClearance=Infinity,landSamples=0,waterSamples=0;
 for(let i=0;i<1000;i++){const p=railway.sample(i/1000);assert.ok([...p.position,...p.normal,...p.tangent].every(Number.isFinite));assert.ok(Math.abs(p.normal.length()-1)<1e-6);assert.ok(Math.abs(p.tangent.length()-1)<1e-6);const h=surface.height(p.normal);if(h>=surface.R)landSamples++;else waterSamples++;minClearance=Math.min(minClearance,p.position.length()-h);}
 assert.ok(landSamples>0&&waterSamples>0);assert.ok(minClearance>.018);
 for(const car of railway.getState().carriages){const p=railway.sample(car.progress).position;assert.ok(new THREE.Vector3(...car.position).distanceTo(p)<.0031);}
 return{trackLength:railway.stats.trackLength,minTrackBedClearance:minClearance,landSamples,waterSamples};
});
check('Station departure, complete lap, dwell and crossing protection',()=>{
 const dt=1/30,L=railway.stats.trackLength,mod=(d)=>((d%L)+L)%L;
 let time=0,firstDeparture=null,firstReturn=null,secondDeparture=null,initialActive=null,firstClosed=null,firstOccupied=null,lastOccupied=null,firstReopen=null,occupiedFrames=0,violations=[],lastStation=true,lastActive=false,loops=0,maxClosedAngle=0;
 for(let frame=0;frame<Math.ceil(150/dt);frame++){
  time+=dt;railway.update(dt,time,day);const s=railway.getState();
  if(lastStation&&!s.atStation){if(firstDeparture===null)firstDeparture=time;else if(firstReturn!==null){secondDeparture=time;break;}}
  if(!lastStation&&s.atStation&&s.loops>0&&firstReturn===null)firstReturn=time;
  if(s.crossing.active&&!lastActive&&initialActive===null)initialActive={time,ahead:mod(s.crossing.distance-s.lapDistance),open:s.crossing.open};
  if(s.crossing.open<.02&&firstClosed===null)firstClosed=time;
  const occupied=s.carriages.some(c=>{const d=mod(c.progress*L-s.crossing.distance+L/2)-L/2;return Math.abs(d)<.112+.16;});
  if(occupied){occupiedFrames++;firstOccupied??=time;lastOccupied=time;maxClosedAngle=Math.max(maxClosedAngle,s.crossing.open);if(!s.crossing.active||s.crossing.open>.04)violations.push({time,open:s.crossing.open,active:s.crossing.active,carriages:s.carriages});}
  if(lastOccupied!==null&&!occupied&&!s.crossing.active&&s.crossing.open>.98&&firstReopen===null)firstReopen=time;
  lastStation=s.atStation;lastActive=s.crossing.active;loops=s.loops;
 }
 assert.ok(firstDeparture>=4.95&&firstDeparture<=5.1,`Departure at ${firstDeparture}`);
 assert.ok(firstReturn!==null&&loops>=1,'Train never completed a lap');assert.ok(secondDeparture-firstReturn>=4.95&&secondDeparture-firstReturn<=5.1);
 assert.ok(initialActive.ahead>.9,'Gate did not warn before approach');assert.ok(firstClosed<firstOccupied,'Barrier not shut before train occupancy');assert.ok(occupiedFrames>30);assert.deepEqual(violations,[],'Gate open while a carriage occupied crossing');assert.ok(firstReopen>lastOccupied,'Barrier never reopened after tail clearance');
 report.railway={firstDeparture,firstReturn,secondDeparture,firstStationDwell:secondDeparture-firstReturn,crossingWarning:initialActive,firstClosed,firstOccupied,lastOccupied,firstReopen,occupiedFrames,maxOpenWhileOccupied:maxClosedAngle,violations};
 return report.railway;
});
check('Application pause (dt=0 and unchanged elapsed time) freezes train and gate',()=>{
 let s=railway.getState();for(let i=0;i<600&&!s.crossing.active;i++){railway.update(1/30,s.time+1/30,day);s=railway.getState();}
 const before=railway.getState();for(let i=0;i<60;i++)railway.update(0,before.time,{...day,paused:true});const after=railway.getState();assert.deepEqual(after,before);
 return{pausedAt:before.time,crossingActive:before.crossing.active,gateOpen:before.crossing.open};
});
check('Petals fall into water and stay on the exact shared ocean wave',()=>{
 const forced=petals.particles[0];forced.n.copy(surface.direction(-.45,0));assert.ok(surface.height(forced.n)<surface.R-.05);forced.state='air';forced.alt=.0001;forced.speed=.06;
 let maxWaveError=0,waterChecks=0;
 for(let frame=0;frame<900;frame++){const t=(frame+1)/30;petals.update(1/30,t,day);if(frame===0)assert.equal(forced.state,'water');if(frame%30===0){for(let i=0;i<petals.particles.length;i++){const p=petals.particles[i];if(p.state!=='water')continue;petals.mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);const expected=surface.R+oceanWave(p.n,t)+.007;maxWaveError=Math.max(maxWaveError,Math.abs(position.length()-expected));waterChecks++;}}}
 const state=petals.getState();assert.ok(state.waterLandings>100);assert.ok(state.floating>100);assert.ok(state.airborne>100);assert.ok(maxWaveError<.000001);
 const before=Array.from(petals.mesh.instanceMatrix.array),states=petals.particles.map(p=>[p.n.clone(),p.alt,p.age,p.state]);petals.update(0,state.time,day);assert.deepEqual(Array.from(petals.mesh.instanceMatrix.array),before);petals.particles.forEach((p,i)=>{assert.ok(p.n.distanceTo(states[i][0])<1e-12);assert.equal(p.alt,states[i][1]);assert.equal(p.age,states[i][2]);assert.equal(p.state,states[i][3]);});
 petals.setLowQuality(true);petals.update(0,state.time,day);assert.equal(petals.getState().total,825);petals.setLowQuality(false);petals.update(0,state.time,day);assert.equal(petals.getState().total,1500);
 return{...state,maxWaveError,waterChecks};
});
check('Ocean dominates surface area and mainland rises inland',()=>{
 let dry=0,minHeight=Infinity,maxHeight=-Infinity;const count=40000,angle=Math.PI*(3-Math.sqrt(5));
 for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,a=i*angle,n=new THREE.Vector3(Math.cos(a)*Math.sqrt(1-y*y),y,Math.sin(a)*Math.sqrt(1-y*y)),h=surface.height(n);assert.ok(Number.isFinite(h));if(h>=surface.R)dry++;minHeight=Math.min(minHeight,h);maxHeight=Math.max(maxHeight,h);}
 const landFraction=dry/count,profile=[-.25,-.15,-.05,.05,.15,.30,.45,.60,.75,.90].map(lat=>({lat,coast:surface.coast(surface.direction(lat,-.22)),altitude:surface.height(surface.direction(lat,-.22))-surface.R}));
 assert.ok(landFraction>.08&&landFraction<.30,`Unexpected land fraction ${landFraction}`);assert.ok(profile.find(p=>p.lat===.60).altitude>profile.find(p=>p.lat===.15).altitude+.08);assert.ok(profile.find(p=>p.lat===-.25).altitude<0);
 report.surface={sampleMethod:'equal-area Fibonacci sphere, 40000 directions',landFraction,waterFraction:1-landFraction,minHeight,maxHeight,mainlandProfile:profile};return report.surface;
});
check('Marine integration advances ten seconds below surface',()=>{
 for(let frame=0;frame<300;frame++){marine.update(1/30,(frame+1)/30,day);const s=marine.getState();assert.ok(s.minFishSeabedClearance>.05);assert.ok(s.highestFishRadius<surface.R-.05);}
 assert.ok(marine.root.children.every(m=>m.renderOrder<10&&m.material.transparent===false));return marine.getState();
});
check('Hillside town geometry, coastal placement and open street axis',()=>{
 const town=createTown({planet,surface,palette}),placements=town.root.userData.placements;let vertices=0,minHouseTrackDistance=Infinity,minHouseAxisDistance=Infinity,minLandClearance=Infinity;
 try{
  report.town={...town.stats};assert.ok(town.stats.houses>=25);assert.ok(town.stats.cherryTrees>0);assert.ok(town.stats.evergreenTrees>0);assert.equal(town.stats.stations,1);assert.equal(town.stats.schoolBuildings,2);
  town.root.traverse(mesh=>{if(!mesh.isMesh)return;for(const attribute of Object.values(mesh.geometry.attributes))assert.ok(attribute.array.every(Number.isFinite));assert.ok(Number.isFinite(mesh.geometry.boundingSphere.radius));vertices+=mesh.geometry.attributes.position.count;});
  for(const p of placements){const n=surface.direction(p.lat,p.lon);assert.ok(Math.abs(surface.height(n)-p.groundHeight)<1e-8);minLandClearance=Math.min(minLandClearance,p.groundHeight-surface.R);if(p.type==='house'){minHouseTrackDistance=Math.min(minHouseTrackDistance,p.trackDistance-p.radius/surface.R);assert.ok(p.trackDistance>.09+p.radius/surface.R);if(p.lat<.67){minHouseAxisDistance=Math.min(minHouseAxisDistance,Math.abs(p.lon+.20)-p.radius/surface.R);assert.ok(Math.abs(p.lon+.20)>.055+p.radius/surface.R);}}}
  assert.ok(minLandClearance>0);assert.ok(town.root.userData.blossomSources.every(v=>[...v].every(Number.isFinite)));
  town.update(0,{daylight:1});town.update(10,{daylight:.1});return{...town.stats,vertices,placements:placements.length,blossomSources:town.root.userData.blossomSources.length,minLandClearance,minHouseTrackDistance,minHouseAxisDistance};
 }finally{town.dispose();}
});
report.passed=report.checks.every(c=>c.passed);report.stats={marine:marine.stats,railway:railway.stats};
railway.dispose();marine.dispose();petals.dispose();
fs.writeFileSync(process.env.KAMAKURA_TEST_REPORT,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(!report.passed)process.exitCode=1;
