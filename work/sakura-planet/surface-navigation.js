import * as THREE from 'three';
const UP=new THREE.Vector3(0,1,0);
export function circleObstacle(normal,radius,id='solid'){return{kind:'circle',normal:normal.clone(),radius,id};}
export function boxObstacle(root,object,scale=1,id='house'){
  const rotation=root.quaternion.clone().multiply(object.quaternion);
  return{kind:'box',normal:root.position.clone().normalize(),origin:root.position.clone(),x:new THREE.Vector3(1,0,0).applyQuaternion(rotation),z:new THREE.Vector3(0,0,1).applyQuaternion(rotation),minX:-.35*scale-.085,maxX:.35*scale+.085,minZ:-.24*scale-.085,maxZ:.51*scale+.085,id};
}

// Static walkability graph on the globe, with continuous clearance checks between
// nodes. Cached routes keep the expensive work out of the per-frame pose update.
export function createSurfaceNavigation({height,R,obstacles}){
  const nodes=[],rows=44,cols=88,grid=new Int32Array((rows-1)*cols).fill(-1),delta=new THREE.Vector3();
  function blocked(n){
    if(height(n)<R+.045)return true;
    for(const o of obstacles){if(n.dot(o.normal)<.86)continue;if(o.kind==='circle'){if(n.distanceToSquared(o.normal)<o.radius*o.radius)return true;}else{delta.copy(n).multiplyScalar(height(n)).sub(o.origin);const x=delta.dot(o.x),z=delta.dot(o.z);if(x>o.minX&&x<o.maxX&&z>o.minZ&&z<o.maxZ)return true;}}
    return false;
  }
  const point=new THREE.Vector3();
  function segmentClear(a,b,solids=obstacles,checkTerrain=true){
    const chord=b.clone().sub(a),length2=chord.lengthSq();
    for(const o of solids){
      if(o.kind==='circle'){
        // Exact closest point on the normalized chord. Discrete samples alone
        // can miss a grazing contact, then strand an animal at the boundary.
        const A=o.normal.dot(a),B=o.normal.dot(chord),D=a.dot(chord),den=B*D-A*length2;
        const f=Math.abs(den)>1e-12?THREE.MathUtils.clamp((A*D-B)/den,0,1):0;
        point.copy(a).addScaledVector(chord,f).normalize();if(point.distanceToSquared(o.normal)<o.radius*o.radius||b.distanceToSquared(o.normal)<o.radius*o.radius)return false;
      }else if(a.dot(o.normal)>.82||b.dot(o.normal)>.82){
        const pa=a.clone().multiplyScalar(height(a)).sub(o.origin),pb=b.clone().multiplyScalar(height(b)).sub(o.origin);let lo=0,hi=1;
        for(const [axis,min,max] of [[o.x,o.minX,o.maxX],[o.z,o.minZ,o.maxZ]]){const start=pa.dot(axis),change=pb.dot(axis)-start;if(Math.abs(change)<1e-10){if(start<=min||start>=max){hi=-1;break;}}else{let t0=(min-start)/change,t1=(max-start)/change;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);}}
        if(lo<hi&&hi>0&&lo<1)return false;
      }
    }
    if(checkTerrain){const steps=Math.max(1,Math.ceil(a.distanceTo(b)/.014));for(let j=1;j<=steps;j++){point.copy(a).lerp(b,j/steps).normalize();if(blocked(point))return false;}}return true;
  }
  for(let row=1;row<rows;row++)for(let col=0;col<cols;col++){const lat=-Math.PI/2+row/rows*Math.PI,lon=col/cols*Math.PI*2,n=new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));if(!blocked(n)){grid[(row-1)*cols+col]=nodes.length;nodes.push({n,row,col,links:[]});}}
  for(const node of nodes)for(const [dy,dx] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]){const r=node.row+dy,c=(node.col+dx+cols)%cols;if(r<=0||r>=rows)continue;const idx=grid[(r-1)*cols+c];if(idx>=0&&segmentClear(node.n,nodes[idx].n))node.links.push(idx);}
  // Tiny pockets between rocks can be walkable but disconnected from the road.
  // Spawn points and destinations must connect to the main island component.
  const visited=new Uint8Array(nodes.length);let main=[];
  for(let i=0;i<nodes.length;i++){if(visited[i])continue;const component=[i];visited[i]=1;for(let k=0;k<component.length;k++)for(const j of nodes[component[k]].links)if(!visited[j]){visited[j]=1;component.push(j);}if(component.length>main.length)main=component;}
  function safeGoal(raw){if(!blocked(raw)&&nearest(raw)>=0)return raw.clone();let best=null,score=Infinity;for(const i of main){const node=nodes[i],d=node.n.distanceToSquared(raw);if(d<score&&!blocked(node.n)){score=d;best=node.n;}}return best?.clone()||raw.clone();}
  function nearest(n){const candidates=[];for(const i of main){const d=nodes[i].n.distanceToSquared(n);if(d<.4)candidates.push({i,d});}candidates.sort((a,b)=>a.d-b.d);return candidates.slice(0,24).find(c=>segmentClear(n,nodes[c.i].n))?.i??-1;}
  function route(start,goal){
    if(segmentClear(start,goal))return[goal.clone()];const first=nearest(start),last=nearest(goal);if(first<0||last<0)return[];
    const costs=new Float64Array(nodes.length).fill(Infinity),parents=new Int32Array(nodes.length).fill(-1),closed=new Uint8Array(nodes.length),heap=[];
    const push=(i,f)=>{heap.push({i,f});let p=heap.length-1;while(p>0){const parent=(p-1)>>1;if(heap[parent].f<=f)break;[heap[parent],heap[p]]=[heap[p],heap[parent]];p=parent;}};
    const pop=()=>{const value=heap[0],tail=heap.pop();if(heap.length){heap[0]=tail;let p=0;while(true){let c=p*2+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[p].f<=heap[c].f)break;[heap[p],heap[c]]=[heap[c],heap[p]];p=c;}}return value.i;};
    costs[first]=0;push(first,0);let found=false;const dynamic=obstacles.filter(o=>o.dynamic&&o.radius>0);
    while(heap.length){const i=pop();if(closed[i])continue;closed[i]=1;if(i===last){found=true;break;}for(const j of nodes[i].links){if(dynamic.length&&!segmentClear(nodes[i].n,nodes[j].n,dynamic,false))continue;const cost=costs[i]+nodes[i].n.distanceTo(nodes[j].n);if(cost<costs[j]){costs[j]=cost;parents[j]=i;push(j,cost+nodes[j].n.distanceTo(goal));}}}
    if(!found)return[];const result=[goal.clone()];for(let i=last;i>=0;i=parents[i]){result.unshift(nodes[i].n.clone());if(i===first)break;}return result;
  }
  function move(actor,rawGoal,dt,time,others=[]){
    if(blocked(actor.normal)){actor.normal.copy(safeGoal(actor.normal));actor.nav=null;}
    if(!actor.navGoal||actor.navRaw.distanceToSquared(rawGoal)>.0001||blocked(actor.navGoal)){actor.navRaw=rawGoal.clone();actor.navGoal=safeGoal(rawGoal);actor.nav=null;}
    const goal=actor.navGoal;let state=actor.nav;
    if(!state||((state.goal.distanceTo(goal)>.065||!state.path.length)&&time-state.at>1.2)){state=actor.nav={goal:goal.clone(),path:route(actor.normal,goal),at:time};}
    while(state.path.length>1&&actor.normal.distanceTo(state.path[0])<.02&&segmentClear(actor.normal,state.path[1]))state.path.shift();
    // Only skip waypoints if the complete intervening segment is clear.
    if(segmentClear(actor.normal,goal)){state.path=[goal];state.goal.copy(goal);}
    const target=state.path[0];if(!target)return{goal,moving:false};
    const distance=actor.normal.distanceTo(target),step=Math.min(distance,Math.max(0,dt)*.085),next=actor.normal.clone().lerp(target,step/Math.max(distance,1e-9)).normalize();
    let occupied=others.some(p=>p!==actor&&next.distanceTo(p.normal)<.10&&next.distanceTo(p.normal)<actor.normal.distanceTo(p.normal));
    if(occupied){const tangent=new THREE.Vector3().crossVectors(actor.normal,target).normalize();for(const sign of [1,-1]){const side=actor.normal.clone().addScaledVector(tangent,step*sign).normalize();if(segmentClear(actor.normal,side)&&!others.some(p=>p!==actor&&side.distanceTo(p.normal)<.10)){next.copy(side);occupied=false;break;}}}
    if(!occupied){if(segmentClear(actor.normal,next))actor.normal.copy(next);else if(time-state.at>.4){state.path=route(actor.normal,goal);state.at=time;}}
    return{goal,moving:distance>.02};
  }
  return{blocked,segmentClear,safeGoal,route,move,nodes,obstacles};
}
