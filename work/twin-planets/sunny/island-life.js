import * as THREE from 'three';
import {random,hash,dateKey} from './ecology.js';
import {farmReserved,pathLat} from './layout.js';

export function createIslandLife({direction,height,R,construction,houseSites}){
  const plans=new Map();
  function pose(i,t,env,actorNormal){
    if(env.rain>.35||env.snow>.35||env.night>.65){
      const home=houseSites[i%houseSites.length];return{normal:direction(home.lat-.13,home.lon-.035-(i===5?.055:0)),mode:'rest',lookAt:direction(home.lat,home.lon)};
    }
    const state=construction.getState(),slot=Math.floor((t+i*3)/29),key=`${dateKey(new Date())}/${state.project.id}/${slot}/${i}`;
    let plan=plans.get(i);
    if(plan?.key!==key){
      const rng=random(hash(key)),center=state.complete?direction(.29,.10+(i-2.5)*.25):construction.getFocus();
      const a=i*2.399+rng()*.7,r=.20+rng()*.10,x=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),center).normalize(),z=new THREE.Vector3().crossVectors(center,x);
      let n=center.clone().addScaledVector(x,Math.cos(a)*r).addScaledVector(z,Math.sin(a)*r).normalize();
      for(let k=0;k<12&&height(n)<R+.07;k++)n.lerp(center,.3).normalize();
      if(farmReserved(n,.06)){const lon=Math.atan2(n.x,n.z);n=direction(pathLat(lon)+.055,lon);}
      const modes=['wander','rest','flowers','wave','watch'];
      const stroll=(i+Math.floor(t/58))%3===0;
      let startLon=Math.atan2((actorNormal||n).x,(actorNormal||n).z);
      plan={key,normal:n,mode:stroll?'stroll':modes[(i+Math.floor(rng()*5))%5],lookAt:center,x,roadLon:startLon,roadDirection:i%2?1:-1};plans.set(i,plan);
    }
    if(plan.mode==='stroll'){
      let road=direction(pathLat(plan.roadLon),plan.roadLon);
      if(actorNormal&&actorNormal.distanceTo(road)<.048){plan.roadLon+=plan.roadDirection*.065;road=direction(pathLat(plan.roadLon),plan.roadLon);}
      if(height(road)>R+.055)return{...plan,normal:road,lookAt:direction(pathLat(plan.roadLon+plan.roadDirection*.05),plan.roadLon+plan.roadDirection*.05)};
      plan.mode='watch';
    }
    const normal=plan.normal.clone();
    if(plan.mode==='wander')normal.addScaledVector(plan.x,Math.sin(t*.16+i)*.048).normalize();
    if(height(normal)<R+.055)normal.copy(plan.normal);
    if(farmReserved(normal,.035))normal.copy(plan.normal);
    return{...plan,normal};
  }
  return{pose};
}

// Nine arched, feathered fronds, baked into one geometry per palm crown.
export function palmFronds(){
  const positions=[],colors=[],indices=[],baseColor=new THREE.Color('#6dab60'),tipColor=new THREE.Color('#b2d17c');
  function point(x,y,z,a){return new THREE.Vector3(x*Math.cos(a)+z*Math.sin(a),y,z*Math.cos(a)-x*Math.sin(a));}
  function leaf(points,tint){const start=positions.length/3;points.forEach((p,i)=>{positions.push(...p.toArray());const c=baseColor.clone().lerp(tipColor,tint+(i===1?.15:0));colors.push(c.r,c.g,c.b);});indices.push(start,start+1,start+2,start,start+2,start+3);}
  for(let j=0;j<9;j++){
    const a=j*Math.PI*2/9,len=.52+(j%3)*.045,lift=.18+(j%2)*.025;
    const center=u=>[0,lift*Math.sin(u*Math.PI)-u*.11,u*len];
    for(let k=0;k<9;k++){
      const u=k/9,v=(k+1)/9,p=center(u),q=center(v);
      leaf([point(-.006,...p.slice(1),a),point(.006,...p.slice(1),a),point(.003,...q.slice(1),a),point(-.003,...q.slice(1),a)],.35);
    }
    for(let k=1;k<9;k++)for(const side of [-1,1]){
      const u=k/10,p=center(u),span=Math.sin(u*Math.PI)*.16;
      leaf([point(0,p[1],p[2]-.017,a),point(side*span*.60,p[1]-.007,p[2]+.012,a),point(side*span,p[1]-.058,p[2]+.079,a),point(side*span*.38,p[1]-.024,p[2]+.048,a)],.17+j%3*.14+u*.22);
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
