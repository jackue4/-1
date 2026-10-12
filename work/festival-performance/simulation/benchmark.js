import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {THREE,createPalette} from '../../festival-planet/core.js';
import {createFestivalEffects} from '../../festival-planet/festival-effects.js';
import {createFestivalRides} from '../../festival-planet/rides.js';
globalThis.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
const palette=createPalette(),planet=new THREE.Group(),rides=createFestivalRides({planet,palette}),effects=createFestivalEffects({planet,palette});
const report={method:'CPU-only deterministic production simulation; no GPU or FPS claim.',scenarios:[],snapshots:[]};
function uploads(){let versions=0,bytes=0;planet.traverse(o=>{for(const a of [...Object.values(o.geometry?.attributes||{}),...(o.instanceMatrix?[o.instanceMatrix]:[])]){versions+=a.version;bytes+=a.version*a.array.byteLength;}});return{versions,fullBufferEquivalentBytes:bytes};}
function snapshot(label){const hash=createHash('sha256');planet.updateMatrixWorld(true);planet.traverse(o=>{const dormantSplash=o.isInstancedMesh&&o.count===84&&o.geometry.parameters?.radius===.012;hash.update(JSON.stringify({name:o.name,p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),visible:dormantSplash?true:o.visible}));if(o.isPoints){for(const a of Object.values(o.geometry.attributes))hash.update(Buffer.from(a.array.buffer));}if(o.isInstancedMesh)hash.update(Buffer.from(o.instanceMatrix.array.buffer));});report.snapshots.push({label,hash:hash.digest('hex'),rides:rides.getState(),effects:effects.getState()});}
const attributes=[];planet.traverse(o=>{attributes.push(...Object.values(o.geometry?.attributes||{}));if(o.instanceMatrix)attributes.push(o.instanceMatrix);});const versions=new Map();
function consumedBytes(){let bytes=0;for(const a of attributes)if(versions.get(a)!==a.version){if(versions.has(a))bytes+=a.updateRanges.length?a.updateRanges.reduce((sum,r)=>sum+r.count*a.array.BYTES_PER_ELEMENT,0):a.array.byteLength;versions.set(a,a.version);a.clearUpdateRanges();}return bytes;}consumedBytes();
let time=0;
for(const [label,frames,dt,night] of [['day',7200,1/60,0],['night-show',5400,1/60,1],['paused',1800,0,1],['preview',600,1/60,0],['return',1,0,1]]){
 const before=uploads(),timings=[];let uploadBytes=0;const env={night,preview:label==='preview'};
 for(let i=0;i<frames;i++){time+=dt;const start=performance.now();rides.update(dt,time,env);effects.update(dt,time,env);timings.push(performance.now()-start);uploadBytes+=consumedBytes();}
 const after=uploads();timings.sort((a,b)=>a-b);report.scenarios.push({label,frames,totalMs:timings.reduce((a,b)=>a+b,0),medianMs:timings[Math.floor(frames*.5)],p95Ms:timings[Math.floor(frames*.95)],attributeUpdates:after.versions-before.versions,fullBufferEquivalentBytes:after.fullBufferEquivalentBytes-before.fullBufferEquivalentBytes,requestedBufferUploadBytes:uploadBytes});snapshot(label);
}
fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));console.log(JSON.stringify(report.scenarios));
