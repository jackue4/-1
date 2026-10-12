import * as THREE from 'three';
import {BUILD_DURATION,constructionAt,projectProgress} from './construction.js';
import {random,hash,dateKey} from './ecology.js';

export function createBuildScene({planet,targets,landscape,mesh,box,cyl,anchor,direction,height,R,residentCount=4}){
  const up=new THREE.Vector3(0,1,0),dynamicRoots=[],structures=[];
  for(const target of Object.values(targets)){
    if(target.kind==='path')continue;
    dynamicRoots.push(target.root||target.object);
    const groups=Array.from({length:3},()=>new THREE.Group()),frame=new THREE.Group();
    for(const o of [...target.object.children]){
      let y=o.position.y;
      if(o.geometry){o.geometry.computeBoundingBox();y+=(o.geometry.boundingBox.min.y+o.geometry.boundingBox.max.y)*.5*o.scale.y;}
      const phase=o.userData.buildStage??(target.kind==='dock'?Math.min(2,Math.floor(groups.reduce((n,g)=>n+g.children.length,0)/3)):y<.075?0:y<.4?1:2);
      groups[phase].add(o);
    }
    groups.forEach(g=>target.object.add(g));target.object.add(frame);
    if(target.kind!=='dock'&&target.kind!=='garden'){
      const w=target.kind==='mill'?.18:.22,d=.18,h=target.kind==='mill'?.62:.44;
      for(const x of [-w,w])for(const z of [-d,d])mesh(frame,cyl,'#c9b287',[x,h/2,z],[.011,h,.011]);
      for(const z of [-d,d])mesh(frame,box,'#d9c69d',[0,h,z],[w*2,.02,.019]);
      for(const x of [-w,w])mesh(frame,box,'#c6ab82',[x,h,0],[.019,.02,d*2]);
    }
    structures.push({...target,groups,frame});
  }
  const site=anchor(direction(.29,.08)),supplies=new THREE.Group(),dustRoot=new THREE.Group();planet.add(supplies);site.add(dustRoot);dynamicRoots.push(site,supplies,landscape.path);
  for(let j=0;j<5;j++)mesh(supplies,box,j%2?'#d7c092':'#bfa277',[0,.02+j*.027,0],[.27,.024,.085]);
  mesh(supplies,box,'#91aaa0',[.17,.054,.03],[.105,.105,.10]);
  const dustPositions=new Float32Array(18*3),dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#ffe8bd',size:.018,transparent:true,opacity:.55,depthWrite:false}));dustRoot.add(dust);
  const fenceMeshes=landscape.meshes.filter(m=>m.name.startsWith('fence ')).map(mesh=>({mesh,count:mesh.count}));
  let state=constructionAt(BUILD_DURATION),crewKey='',crew=[];
  function currentCrew(){
    const key=`${dateKey(new Date())}/${state.project.id}/${Math.floor((state.elapsed-state.project.start)/24)}`;
    if(key!==crewKey){const rng=random(hash(key)),ids=Array.from({length:residentCount},(_,i)=>i);for(let j=ids.length-1;j>0;j--){const k=Math.floor(rng()*(j+1));[ids[j],ids[k]]=[ids[k],ids[j]];}crew=ids.slice(0,1+Math.floor(rng()*2));crewKey=key;}
    return state.complete?[]:crew;
  }
  function safeNormal(n,center){for(let j=0;j<10&&height(n)<R+.055;j++)n.lerp(center,.4).normalize();return n;}
  function supplyNormal(target){const n=target.normal,lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z);return safeNormal(direction(lat-.16,lon-.17),n);}
  function setProgress(elapsed){
    state=constructionAt(elapsed);const road=projectProgress('path',state.elapsed);
    landscape.path.geometry.setDrawRange(0,Math.floor(landscape.path.geometry.index.count*road/6)*6);
    fenceMeshes.forEach(f=>f.mesh.count=Math.floor(f.count*road));
    for(const s of structures){
      const p=projectProgress(s.id,state.elapsed);s.object.visible=p>0;
      const spans=s.kind==='dock'?[[0,.3],[.3,.65],[.65,1]]:[[0,.18],[.42,.72],[.72,.96]];
      s.groups.forEach((g,i)=>{const f=THREE.MathUtils.smoothstep(p,...spans[i]);g.visible=f>0;g.scale.y=Math.max(.001,f);});
      s.frame.visible=p>=.18&&p<.72;
    }
    const current=targets[state.project.id];site.visible=supplies.visible=!state.complete;
    if(current){site.position.copy(current.normal).multiplyScalar(height(current.normal));site.quaternion.setFromUnitVectors(up,current.normal);const n=supplyNormal(current);supplies.position.copy(n).multiplyScalar(height(n));supplies.quaternion.setFromUnitVectors(up,n);}
    return state;
  }
  function workerPose(i,paused){
    if(state.complete||paused||!currentCrew().includes(i))return null;
    const target=targets[state.project.id],n=target.normal,lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z),a=i*2.399;
    const work=safeNormal(direction(lat+Math.sin(a)*.125,lon+Math.cos(a)*.125),n),base=supplyNormal(target);
    const supply=safeNormal(direction(Math.asin(base.y)+Math.sin(a)*.07,Math.atan2(base.x,base.z)+Math.cos(a)*.07),n);
    const phase=((state.elapsed-state.project.start+currentCrew().indexOf(i)*4.6)%11)/11;
    let mode=paused?'rest':phase<.35?'carry':phase<.78?'build':'walk';
    const f=paused?0:phase<.35?phase/.35:phase<.78?1:1-(phase-.78)/.22;
    const destination=supply.clone().lerp(work,f).normalize();
    return{normal:safeNormal(destination,n),mode,lookAt:n};
  }
  function update(t,paused){dust.visible=!state.complete&&!paused;for(let i=0;i<18;i++){const f=(t*.7+i/18)%1,a=i*2.399;dustPositions.set([Math.sin(a)*(.12+f*.2),.025+f*.24,Math.cos(a)*(.12+f*.2)],i*3);}dustGeometry.attributes.position.needsUpdate=true;}
  setProgress(BUILD_DURATION);
  return{dynamicRoots,structures,supplies,site,targets,setProgress,workerPose,update,getCrew:()=>[...currentCrew()],getState:()=>state,getFocus:()=>targets[state.project.id].normal.clone(),dispose(){dustGeometry.dispose();dust.material.dispose();}};
}
