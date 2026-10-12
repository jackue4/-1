import {THREE,R,TAU,COVE,SITES,normal,frame,seeded} from './core.js';

const WATER=R+.008,FOOTPRINT=.165,STEP=.0235,LON_COUNT=256,LAT_MIN=-1.03,LAT_MAX=1.37;
const clamp=THREE.MathUtils.clamp;
const angle=(a,b)=>Math.acos(clamp(a.dot(b),-1,1));
const coveNormal=normal(COVE.lat,COVE.lon),east=new THREE.Vector3(1,0,0),south=new THREE.Vector3().crossVectors(east,coveNormal);
function localCove(n){const d=n.dot(coveNormal);return{x:n.dot(east)*(R+COVE.raise)/Math.max(.01,d),z:n.dot(south)*(R+COVE.raise)/Math.max(.01,d),d};}

// Keep the routes outside the visible site platforms, including lamps, trees,
// and the two coastal walls. All distances below are measured on the globe.
export function camelObstacles({height,landField}){
 const circles=Object.entries(SITES).map(([id,s])=>({id,kind:'site',n:normal(s.lat,s.lon),radius:({treasury:.83,kasbah:.90,arch:.83,caravan:.66,oasis:1.00})[id]+FOOTPRINT}));
 const camp=SITES.caravan,cb=frame(camp.lat,camp.lon,height(normal(camp.lat,camp.lon))+.025);
 for(const x of [-.70,.70])circles.push({id:`caravan-lamp/${x}`,kind:'lamp',n:new THREE.Vector3(x,0,.43).applyMatrix4(cb).normalize(),radius:FOOTPRINT+.044});
 const reservations=Object.values(SITES).map(s=>normal(s.lat,s.lon));
 for(const [lat,lon,s]of [[.74,-1.15,.35],[.65,1.75,.29],[.70,2.20,.30],[.08,-2.4,.26],[-.6,-1.63,.25],[-.50,.85,.17],[.15,2.03,.23],[-.18,2.94,.23]]){
  const n=normal(lat,lon);if(reservations.some(q=>n.distanceTo(q)*R<.82))continue;
  circles.push({id:`mesa/${lat}/${lon}`,kind:'cliff',n,radius:s*1.23+FOOTPRINT});
 }
 // Replay only nature.js's placement RNG, without constructing its geometry.
 // Eight frond lengths are sampled by each palm before the next placement.
 const rng=seeded(44570),consumePalm=()=>{for(let i=0;i<8;i++)rng();};
 for(let i=0;i<4;i++){rng();consumePalm();}
 for(let i=0;i<15;i++){const a=i/15*TAU;if(Math.cos(a-.7)>.62)continue;rng();consumePalm();}
 const nonOasis=Object.entries(SITES).filter(([id])=>id!=='oasis').map(([,s])=>normal(s.lat,s.lon));
 for(let i=0,accepted=0;i<220&&accepted<26;i++){
  const lat=-.25+rng()*1.25,lon=(rng()-.5)*TAU,n=normal(lat,lon),c=localCove(n);
  if(height(n)<R+.025||landField(n)>.53||nonOasis.some(s=>n.distanceTo(s)*R<.9)||(c.d>.7&&Math.abs(c.x)<1.5&&c.z>-.9&&c.z<1.2))continue;
  const size=.65+rng()*.43;rng();consumePalm();circles.push({id:`palm/${accepted}`,kind:'palm',n,radius:FOOTPRINT+.030*size+.105*size});accepted++;
 }
 return circles;
}

// Precompute a closed tour over the largest genuinely connected dry region.
// There is an ocean gap west of the main continent: the return leg therefore
// uses the eastern land bridge instead of pretending to circumnavigate water.
export function planCamelRoute({height,landField}){
 if(typeof height!=='function'||typeof landField!=='function')throw new TypeError('The roaming camel needs the actual terrain functions.');
 const circles=camelObstacles({height,landField}),tmp=new THREE.Vector3(),e=new THREE.Vector3(),s=new THREE.Vector3();
 function obstacleClearance(n){let minimum=Infinity;for(const o of circles)minimum=Math.min(minimum,angle(n,o.n)*R-o.radius);return minimum;}
 function safe(n,full=true){
  if(height(n)<WATER+.033||landField(n)<.035)return false;
  const c=localCove(n);if(c.d>.64&&Math.abs(c.x)<1.74&&c.z>-1.87&&c.z<1.52)return false;
  for(const o of circles)if(n.dot(o.n)>Math.cos(o.radius/R))return false;
  if(full){
   e.set(n.z,0,-n.x).normalize();s.crossVectors(e,n).normalize();const base=height(n);
   for(const tangent of [e,s])for(const sign of [-1,1]){
    tmp.copy(n).multiplyScalar(R).addScaledVector(tangent,sign*FOOTPRINT).normalize();
    if(height(tmp)<WATER+.021||landField(tmp)<.004)return false;
    if(Math.abs(height(tmp)-base)/FOOTPRINT>.70)return false;
   }
  }
  return true;
 }
 const rows=Math.ceil((LAT_MAX-LAT_MIN)/STEP)+1,count=rows*LON_COUNT,nodes=Array(count),valid=new Uint8Array(count),components=new Int32Array(count).fill(-1),nodeHeight=new Float32Array(count);
 for(let y=0;y<rows;y++)for(let x=0;x<LON_COUNT;x++){const id=y*LON_COUNT+x,n=normal(LAT_MIN+y*(LAT_MAX-LAT_MIN)/(rows-1),-Math.PI+x*TAU/LON_COUNT);nodes[id]=n;if(safe(n)){valid[id]=1;nodeHeight[id]=height(n);}}
 const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]],edgeCache=new Map();
 function neighbors(id,visit){const y=Math.floor(id/LON_COUNT),x=id%LON_COUNT;for(const [dx,dy]of dirs){const yy=y+dy;if(yy<0||yy>=rows)continue;const xx=(x+dx+LON_COUNT)%LON_COUNT,next=yy*LON_COUNT+xx;if(!valid[next])continue;if(dx&&dy&&(!valid[y*LON_COUNT+xx]||!valid[yy*LON_COUNT+x]))continue;const edge=Math.min(id,next)*count+Math.max(id,next);if(!edgeCache.has(edge))edgeCache.set(edge,segmentSafe(nodes[id],nodes[next]));if(edgeCache.get(edge))visit(next);}}
 const queue=new Int32Array(count),sizes=[];
 for(let i=0;i<count;i++)if(valid[i]&&components[i]===-1){const component=sizes.length;let head=0,tail=1;queue[0]=i;components[i]=component;while(head<tail){neighbors(queue[head++],j=>{if(components[j]===-1){components[j]=component;queue[tail++]=j;}});}sizes.push(tail);}
 const largest=sizes.indexOf(Math.max(...sizes));if(largest<0||sizes[largest]<20)throw new Error('No safe connected land tour exists for the little camel.');
 function nearest(lat,lon){const target=normal(lat,lon);let id=-1,best=-Infinity;for(let i=0;i<count;i++)if(components[i]===largest){const score=nodes[i].dot(target);if(score>best){best=score;id=i;}}return id;}
 const requestedStops=[
  ['商队远行',.98,.83],['北部沙丘',1.16,.56],['玫瑰石窟外',.57,-1.04],['风雕石桥外',.01,-1.46],
  ['西侧海岸',-.02,-.68],['临海沙坡',-.12,.74],['赤陶城外',.15,1.51],['东部沙脊',.41,1.89],
  ['月泉南岸',-.01,2.60],['星球背面的海岸',.42,-2.68],['月泉北部沙丘',.86,2.89],['背面的高地',.96,2.24],['东部归途',.95,1.47]
 ].map(([name,lat,lon])=>{const id=nearest(lat,lon);return{name,requested:[lat,lon],id,snapDistance:angle(normal(lat,lon),nodes[id])*R};});
 const stops=requestedStops.filter((stop,i)=>stop.snapDistance<.60&&requestedStops.findIndex(s=>s.id===stop.id)===i);
 function aStar(start,goal){
  const distances=new Float64Array(count).fill(Infinity),previous=new Int32Array(count).fill(-1),closed=new Uint8Array(count),heap=[];distances[start]=0;
  const push=(id,cost)=>{let i=heap.length;heap.push({id,cost});while(i>0){const parent=(i-1)>>1;if(heap[parent].cost<=cost)break;heap[i]=heap[parent];i=parent;}heap[i]={id,cost};};
  const pop=()=>{const result=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){const a=i*2+1,b=a+1;if(a>=heap.length)break;const child=b<heap.length&&heap[b].cost<heap[a].cost?b:a;if(heap[child].cost>=last.cost)break;heap[i]=heap[child];i=child;}heap[i]=last;}return result.id;};
  push(start,0);while(heap.length){const id=pop();if(closed[id])continue;if(id===goal){const path=[];for(let j=goal;j!==-1;j=previous[j])path.push(j);return path.reverse();}closed[id]=1;
   neighbors(id,j=>{if(closed[j])return;const horizontal=angle(nodes[id],nodes[j])*R,dh=Math.abs(nodeHeight[id]-nodeHeight[j]),shorePenalty=1+.035/Math.max(.04,nodeHeight[j]-WATER),cost=distances[id]+Math.hypot(horizontal,dh)*shorePenalty+dh*.85;
    if(cost<distances[j]){distances[j]=cost;previous[j]=id;push(j,cost+angle(nodes[j],nodes[goal])*R);}});
  }
  throw new Error('A safe desert tour segment could not be connected.');
 }
 function segmentSafe(a,b){const steps=Math.max(1,Math.ceil(angle(a,b)*R/.025)),v=new THREE.Vector3();for(let i=0;i<=steps;i++){v.copy(a).lerp(b,i/steps).normalize();if(!safe(v))return false;}return true;}
 let raw=[];const stopNodes=[];
 for(let i=0;i<stops.length;i++){const segment=aStar(stops[i].id,stops[(i+1)%stops.length].id);stopNodes.push({name:stops[i].name,node:raw.length});raw.push(...segment.slice(0,-1).map(id=>nodes[id].clone()));}
 // Corner rounding is accepted only after checking both proposed edges.
 // Keep the dense grid samples: that avoids long shortcuts through dune peaks.
 for(let pass=0;pass<3;pass++){const next=raw.map(v=>v.clone());for(let i=0;i<raw.length;i++){const a=next[(i+next.length-1)%next.length],b=next[(i+1)%next.length],p=next[i].clone().multiplyScalar(.60).addScaledVector(a,.20).addScaledVector(b,.20).normalize();if(segmentSafe(a,p)&&segmentSafe(p,b))next[i].copy(p);}raw=next;}
 const directions=[],positions=[],cumulative=[0],names=[];let length=0,minHeight=Infinity,minClearance=Infinity,minFootHeight=Infinity,maxSlope=0;
 for(let i=0;i<raw.length;i++){
  const a=raw[i],b=raw[(i+1)%raw.length],steps=Math.max(1,Math.ceil(angle(a,b)*R/.014));
  for(let j=0;j<steps;j++){const n=a.clone().lerp(b,j/steps).normalize();if(!safe(n))throw new Error('The rounded camel tour failed its final dry-land clearance check.');const h=height(n),p=n.clone().multiplyScalar(h);
   if(positions.length){length+=p.distanceTo(positions.at(-1));cumulative.push(length);}directions.push(n);positions.push(p);minHeight=Math.min(minHeight,h);minClearance=Math.min(minClearance,obstacleClearance(n));
   e.set(n.z,0,-n.x).normalize();s.crossVectors(e,n).normalize();for(const tangent of [e,s])for(const sign of [-1,1]){tmp.copy(n).multiplyScalar(R).addScaledVector(tangent,sign*FOOTPRINT).normalize();const fh=height(tmp);minFootHeight=Math.min(minFootHeight,fh);maxSlope=Math.max(maxSlope,Math.abs(fh-h)/FOOTPRINT);}
   names.push(stopNodes.reduce((best,stop)=>stop.node<=i?stop.name:best,stopNodes[0].name));
  }
 }
 length+=positions.at(-1).distanceTo(positions[0]);cumulative.push(length);
 const headings=[];
 for(let i=0;i<directions.length;i++){
  const n=directions[i],forward=positions[(i+1)%positions.length].clone().sub(positions[(i+positions.length-1)%positions.length]);
  if(forward.lengthSq()<1e-9)forward.copy(positions[(i+1)%positions.length]).sub(positions[i]);
  e.set(n.z,0,-n.x).normalize();s.crossVectors(e,n).normalize();const yaw=Math.atan2(forward.dot(e),forward.dot(s));
  headings.push(i?headings[i-1]+Math.atan2(Math.sin(yaw-headings[i-1]),Math.cos(yaw-headings[i-1])):yaw);
 }
 const fullTurn=headings.at(-1)-headings[0]+Math.atan2(Math.sin(headings[0]-headings.at(-1)),Math.cos(headings[0]-headings.at(-1)));
 function indexAt(d){let lo=0,hi=cumulative.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(cumulative[m]<=d)lo=m;else hi=m;}return lo;}
 function yawAt(distance){const lap=Math.floor(distance/length),d=distance-lap*length,i=indexAt(d),next=(i+1)%headings.length,f=(d-cumulative[i])/(cumulative[i+1]-cumulative[i]);return THREE.MathUtils.lerp(headings[i],next===0?headings[0]+fullTurn:headings[next],f)+lap*fullTurn;}
 // Shore overlooks can require a reversal. A spatial, cyclic filter makes the
 // tiny camel turn gently over the same absolute-time interval on every visit.
 const smoothHeadings=cumulative.slice(0,-1).map(d=>{let sum=0,weights=0;for(let j=-16;j<=16;j++){const weight=17-Math.abs(j);sum+=yawAt(d+j*.018)*weight;weights+=weight;}return sum/weights;});
 const checkpoints=stops.map(stop=>({name:stop.name,lat:Math.asin(nodes[stop.id].y),lon:Math.atan2(nodes[stop.id].x,nodes[stop.id].z),requested:stop.requested}));
 const latitude=[Math.min(...directions.map(n=>Math.asin(n.y))),Math.max(...directions.map(n=>Math.asin(n.y)))];
 const octants=[...new Set(directions.map(n=>Math.floor((Math.atan2(n.x,n.z)+Math.PI)/(Math.PI/4))))].sort();
 const evidence={closed:true,routeType:'connected-mainland-tour',fullCircumnavigation:false,reason:'西侧大陆之间有海峡，沿东部陆桥往返连接正面和背面的景点。',length,samples:directions.length,gridNodes:count,connectedDryNodes:sizes[largest],dryComponents:sizes.length,checkpoints,omittedWaypoints:requestedStops.filter(s=>s.snapDistance>=.60).map(s=>({name:s.name,nearestConnectedLandDistance:s.snapDistance})),latitude,longitudeOctants:octants,waterRadius:WATER,footprintRadius:FOOTPRINT,minCenterAboveWater:minHeight-WATER,minFootprintAboveWater:minFootHeight-WATER,minObstacleExtraClearance:minClearance,maxFootprintSlope:maxSlope,obstacleCounts:circles.reduce((a,o)=>(a[o.kind]=(a[o.kind]||0)+1,a),{})};
 function sample(distance,target={}){
  const d=((distance%length)+length)%length,lo=indexAt(d);
  const next=(lo+1)%directions.length,span=cumulative[lo+1]-cumulative[lo],fraction=span>0?(d-cumulative[lo])/span:0,n=(target.normal||(target.normal=new THREE.Vector3())).copy(directions[lo]).lerp(directions[next],fraction).normalize();
  (target.position||(target.position=new THREE.Vector3())).copy(n).multiplyScalar(height(n));target.distance=d;target.index=lo;target.location=names[lo];target.heading=THREE.MathUtils.lerp(smoothHeadings[lo],next===0?smoothHeadings[0]+fullTurn:smoothHeadings[next],fraction);return target;
 }
 return{directions,positions,cumulative,length,evidence,sample,isSafe:safe,obstacles:circles};
}
