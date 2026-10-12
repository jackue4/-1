import * as THREE from 'three';
import {random,hash,dateKey} from './ecology.js';
import {sampleWater,enhanceCaustics} from './nature.js';

const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;

export function createMarine({planet,R,height,lakes,uniforms,gradientMap,mesh,box,cyl,sphere,stem}){
  const root=new THREE.Group();root.name='Lagoon life';planet.add(root);
  const rng=random(hash('little-bloom-coral-gardens')),dummy=new THREE.Object3D(),base=new THREE.Object3D();
  const entries={rock:[],branch:[],plate:[],pearl:[],weed:[]},reefRoots=[];
  function add(type,normal,position,scale,color,rotation=[0,0,0]){
    base.position.copy(normal).multiplyScalar(height(normal));base.quaternion.setFromUnitVectors(UP,normal);base.updateMatrix();
    dummy.position.set(...position);dummy.scale.set(...scale);dummy.rotation.set(...rotation);dummy.updateMatrix();
    entries[type].push({matrix:new THREE.Matrix4().multiplyMatrices(base.matrix,dummy.matrix),color:new THREE.Color(color)});
  }
  const coralColors=['#d894aa','#c0acd3','#e6ba76','#8bc6b0','#89bfc5'];
  lakes.forEach((center,lake)=>{
    const x=new THREE.Vector3().crossVectors(UP,center).normalize(),z=new THREE.Vector3().crossVectors(center,x);
    // Clumps with open sandy gaps, rather than an even underwater carpet.
    for(let cluster=0;cluster<(lake===0?46:26);cluster++){
      const a=rng()*TAU,r=.25+rng()*(lake===0?.22:.15),c=center.clone().addScaledVector(x,Math.cos(a)*r).addScaledVector(z,Math.sin(a)*r).normalize();
      for(let j=0;j<4+Math.floor(rng()*4);j++){
        const n=c.clone().addScaledVector(x,(rng()-.5)*.085).addScaledVector(z,(rng()-.5)*.085).normalize();
        const depth=R-height(n);if(depth<.115)continue;
        const h=Math.min(.075+rng()*.035,depth-.10),w=.021+rng()*.023,color=coralColors[cluster%coralColors.length],kind=(cluster+j)%4;
        reefRoots.push({normal:n.clone(),depth,top:height(n)+h+.013});
        add('rock',n,[0,.009,0],[w*1.45,.017,w*1.3],'#92b6a3',[0,a,0]);
        if(kind===0){
          // Branching antler coral: thick lower stems and smaller colored tips.
          for(let k=0;k<4;k++){const ang=k*2.4;add('branch',n,[Math.sin(ang)*w*.45,h*.4,Math.cos(ang)*w*.45],[w*.18,h*.72,w*.18],color,[Math.cos(ang)*.38,0,Math.sin(ang)*.38]);
            add('pearl',n,[Math.sin(ang)*w*.75,h*.8,Math.cos(ang)*w*.75],[w*.25,h*.14,w*.25],color);}
        }else if(kind===1){
          // Overlapping plate coral reads as a little underwater flower.
          for(let k=0;k<3;k++)add('plate',n,[(k%2-.5)*w*.45,h*(.18+k*.26),0],[w*(1.3-k*.22),h*.08,w*(1.08-k*.17)],color,[.08, k*1.4,.08*Math.sin(k)]);
        }else if(kind===2){
          for(let k=0;k<5;k++)add('pearl',n,[Math.sin(k*2.4)*w*.58,h*.32+(k%2)*h*.23,Math.cos(k*2.4)*w*.58],[w*.55,h*.28,w*.55],k%2?color:'#dfd6a0');
        }
        for(let k=0;k<(kind===3?6:2);k++)add('weed',n,[Math.sin(k*2.4)*w,.004,Math.cos(k*2.4)*w],[w*.55,h*(.65+rng()*.3),w*.55],k%2?'#58aa94':'#91c291',[0,rng()*TAU,0]);
      }
    }
  });
  const weedGeo=new THREE.BufferGeometry(),wp=[],wi=[];
  for(let j=0;j<=5;j++){const u=j/5,w=.34*Math.sin((u*.94+.06)*Math.PI);wp.push(-w,u,.24*u*u,w,u,.24*u*u);if(j<5){const a=j*2;wi.push(a,a+1,a+2,a+1,a+3,a+2);}}
  weedGeo.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));weedGeo.setIndex(wi);weedGeo.computeVertexNormals();
  const geometries={rock:new THREE.IcosahedronGeometry(1,0),branch:new THREE.CylinderGeometry(.68,1,1,6),plate:new THREE.SphereGeometry(1,8,4),pearl:new THREE.SphereGeometry(1,6,4),weed:weedGeo},reefMeshes=[];
  for(const [type,items] of Object.entries(entries)){
    const mat=new THREE.MeshToonMaterial({color:'white',gradientMap,side:type==='weed'?THREE.DoubleSide:THREE.FrontSide});
    enhanceCaustics(mat,uniforms,R);
    if(type==='weed'){
      const previous=mat.onBeforeCompile;
      mat.onBeforeCompile=shader=>{previous(shader);shader.vertexShader='uniform float uNatureTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        transformed.x+=sin(uNatureTime*1.15+dot(instanceMatrix[3].xyz,vec3(7.,4.,8.)))*position.y*position.y*.23;
      `);};mat.customProgramCacheKey=()=> 'lagoon-seagrass-v1';
    }
    const im=new THREE.InstancedMesh(geometries[type],mat,items.length);im.name=`Reef ${type}`;
    items.forEach((item,i)=>{im.setMatrixAt(i,item.matrix);im.setColorAt(i,item.color);});im.receiveShadow=true;im.frustumCulled=false;root.add(im);reefMeshes.push(im);
  }

  // An open wooden hull, with gunwales, floorboards, ribs and a small rudder.
  const boat=new THREE.Group(),body=new THREE.Group(),sails=new THREE.Group();boat.name='Wandering sailboat';root.add(boat);boat.add(body);body.add(sails);
  const hp=[],hi=[],sections=12;
  const width=z=>.115*Math.pow(Math.max(0,1-Math.pow((z+.012)/.25,2)),.62)+.004;
  for(let row=0;row<=3;row++)for(let j=0;j<=sections;j++){
    const z=-.245+j/sections*.48,w=width(z)*(row===0?.38:row===1?.85:1);
    const y=[-.055,-.027,.017,.053][row]+Math.pow(Math.abs(z)/.25,3)*.025;
    hp.push(-w,y,z,w,y,z);
  }
  const stride=(sections+1)*2;
  for(let row=0;row<3;row++)for(let j=0;j<sections;j++)for(let side=0;side<2;side++){
    const a=row*stride+j*2+side,b=a+2,c=a+stride,d=c+2;hi.push(a,c,b,b,c,d);
  }
  const hullGeo=new THREE.BufferGeometry();hullGeo.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));hullGeo.setIndex(hi);hullGeo.computeVertexNormals();
  const hullMat=new THREE.MeshToonMaterial({color:'#b78258',gradientMap,side:THREE.DoubleSide});mesh(body,hullGeo,hullMat);
  for(let j=0;j<9;j++){const z=-.18+j*.043,w=width(z)*1.8;mesh(body,box,j%2?'#edce95':'#daba83',[0,.018,z],[w,.012,.039]);}
  for(const side of [-1,1])for(let j=0;j<12;j++){
    const z=-.245+j*.04,next=z+.04;
    stem(body,[side*width(z),.056+Math.pow(Math.abs(z)/.25,3)*.025,z],[side*width(next),.056+Math.pow(Math.abs(next)/.25,3)*.025,next],.009,'#f2d7a1');
  }
  for(const z of [-.13,.08])mesh(body,box,'#79b7ae',[0,.062,z],[width(z)*1.83,.018,.036]);
  mesh(body,box,'#4d8f88',[0,-.014,-.243],[.018,.095,.057]);
  stem(body,[0,.01,0],[0,.51,0],.009,'#cbab78');stem(body,[0,.13,0],[.235,.13,0],.006,'#cbab78');
  const sailMat=new THREE.MeshToonMaterial({color:'#fff1cf',gradientMap,side:THREE.DoubleSide});
  function sail(a,b,c){
    const positions=[],indices=[],steps=8;
    for(let i=0;i<=steps;i++)for(let j=0;j<=steps;j++){
      const u=i/steps,v=j/steps;const p=a.clone().lerp(b,u).lerp(c,v);
      p.z+=Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.049;positions.push(...p.toArray());
      if(i<steps&&j<steps){const k=i*(steps+1)+j;indices.push(k,k+1,k+steps+1,k+1,k+steps+2,k+steps+1);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(sails,geo,sailMat);
    for(const [p,q] of [[a,b],[b,c],[c,a]])stem(sails,p.toArray(),q.toArray(),.0024,'#d8b98b');
  }
  sail(new THREE.Vector3(.012,.49,0),new THREE.Vector3(.012,.14,0),new THREE.Vector3(.238,.14,0));
  sail(new THREE.Vector3(-.016,.43,0),new THREE.Vector3(-.016,.15,0),new THREE.Vector3(-.14,.15,0));
  for(const z of [-.205,.20])stem(body,[0,.47,0],[0,.06,z],.0018,'#bba77e');
  mesh(body,new THREE.TorusGeometry(.027,.007,5,12),'#f3d5a0',[.07,.062,-.07]).rotation.x=Math.PI/2;
  mesh(body,box,'#e8a993',[-.044,.044,-.15],[.05,.04,.046]);
  const flag=mesh(body,new THREE.ConeGeometry(.026,.08,3),'#e99f89',[.031,.51,0]);flag.rotation.z=-Math.PI/2;

  const routeRng=random(hash(`sailing/${dateKey(new Date())}`)),center=lakes[0],axisX=new THREE.Vector3().crossVectors(UP,center).normalize(),axisZ=new THREE.Vector3().crossVectors(center,axisX);
  let normal=center.clone().addScaledVector(axisX,.13).normalize(),forward=axisZ.clone(),destination=center.clone(),speed=0,routeCount=0,historyClock=0;
  const history=[],wakeGeo=new THREE.BufferGeometry(),wakePos=new Float32Array(64*3*4*3),wakeAlpha=new Float32Array(64*3*4),wakeIndex=[];
  for(let i=0;i<64*3;i++){const a=i*4;wakeIndex.push(a,a+1,a+2,a+1,a+3,a+2);}
  wakeGeo.setAttribute('position',new THREE.BufferAttribute(wakePos,3).setUsage(THREE.DynamicDrawUsage));wakeGeo.setAttribute('wakeAlpha',new THREE.BufferAttribute(wakeAlpha,1).setUsage(THREE.DynamicDrawUsage));wakeGeo.setIndex(wakeIndex);
  const wakeMat=new THREE.MeshBasicMaterial({color:'#f0ffed',transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide});
  wakeMat.onBeforeCompile=shader=>{shader.vertexShader='attribute float wakeAlpha;varying float vWakeAlpha;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWakeAlpha=wakeAlpha;');shader.fragmentShader='varying float vWakeAlpha;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vWakeAlpha;');};wakeMat.customProgramCacheKey=()=> 'boat-wake-v1';
  const wake=new THREE.Mesh(wakeGeo,wakeMat);wake.name='Sailboat wake';wake.frustumCulled=false;wake.renderOrder=3;root.add(wake);
  function safe(n){
    if(R-height(n)<.155)return false;
    const x=new THREE.Vector3().crossVectors(UP,n).normalize(),z=new THREE.Vector3().crossVectors(n,x);
    for(let j=0;j<8;j++)if(R-height(n.clone().addScaledVector(x,Math.cos(j*TAU/8)*.115).addScaledVector(z,Math.sin(j*TAU/8)*.115).normalize())<.105)return false;
    return true;
  }
  function chooseDestination(){
    for(let j=0;j<50;j++){
      const a=routeRng()*TAU,r=.12+routeRng()*.20,candidate=center.clone().addScaledVector(axisX,Math.cos(a)*r).addScaledVector(axisZ,Math.sin(a)*r).normalize();
      if(candidate.distanceTo(normal)<.14||!safe(candidate))continue;
      let valid=true;for(let k=1;k<9;k++)if(!safe(normal.clone().lerp(candidate,k/9).normalize())){valid=false;break;}
      if(valid){destination.copy(candidate);routeCount++;return;}
    }
    destination.copy(center);routeCount++;
  }
  chooseDestination();
  const wakeN=new THREE.Vector3(),wakeP=new THREE.Vector3();
  function update(dt,t,wind){
    dt=Math.min(.1,Math.max(0,dt));
    if(normal.distanceTo(destination)<.035)chooseDestination();
    const desired=destination.clone().addScaledVector(normal,-destination.dot(normal)).normalize();
    forward.addScaledVector(normal,-forward.dot(normal)).normalize();
    const turn=Math.atan2(normal.dot(new THREE.Vector3().crossVectors(forward,desired)),forward.dot(desired));
    forward.applyAxisAngle(normal,THREE.MathUtils.clamp(turn,-dt*.62,dt*.62)).normalize();
    const targetSpeed=(.063+.013*Math.sin(t*.23))*(.22+.78*Math.max(0,forward.dot(desired)));
    speed=THREE.MathUtils.lerp(speed,targetSpeed,1-Math.exp(-dt*1.7));
    const candidate=normal.clone().addScaledVector(forward,speed*dt/R).normalize();
    if(R-height(candidate)>.16&&candidate.distanceTo(center)<.36)normal.copy(candidate);else{speed*=Math.exp(-dt*8);destination.copy(center);}
    const point=normal.clone().multiplyScalar(R),depth=R-height(normal),wave=sampleWater(point,depth,t,wind);
    const right=new THREE.Vector3().crossVectors(normal,forward).normalize();forward.crossVectors(right,normal).normalize();
    boat.position.copy(normal).multiplyScalar(R+.018+wave);boat.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,normal,forward));
    const slope=axis=>(sampleWater(point.clone().addScaledVector(axis,.065),depth,t,wind)-sampleWater(point.clone().addScaledVector(axis,-.065),depth,t,wind))/.13;
    body.rotation.x=THREE.MathUtils.lerp(body.rotation.x,-Math.atan(slope(forward))*.68,1-Math.exp(-dt*4));
    body.rotation.z=THREE.MathUtils.lerp(body.rotation.z,Math.atan(slope(right))*.6+Math.sin(t*1.4)*.018,1-Math.exp(-dt*4));
    sails.rotation.y=.12+Math.sin(t*.85)*.045;flag.rotation.x=Math.sin(t*3)*.14;
    historyClock+=dt;
    if(historyClock>=.095){historyClock%=.095;history.unshift({n:normal.clone().addScaledVector(forward,-.20/R).normalize(),side:right.clone(),at:t,speed});if(history.length>65)history.pop();}
    let quads=0;
    for(let i=0;i<history.length-1;i++)for(let strip=0;strip<3;strip++){
      for(let end=0;end<2;end++){
        const h=history[i+end],age=t-h.at,offset=strip===2?0:(strip?1:-1)*(.071+age*.027),width=strip===2?.017+age*.009:.006+age*.002;
        for(let edge=0;edge<2;edge++){
          const n=wakeN.copy(h.n).addScaledVector(h.side,(offset+(edge?1:-1)*width)/R).normalize(),p=wakeP.copy(n).multiplyScalar(R),depth=R-height(n),index=quads*4+end*2+edge;
          p.copy(n).multiplyScalar(R+.008+sampleWater(p,Math.max(0,depth),t,wind));wakePos[index*3]=p.x;wakePos[index*3+1]=p.y;wakePos[index*3+2]=p.z;
          wakeAlpha[index]=depth>.035?Math.max(0,1-age/6.1)**1.7*Math.min(1,h.speed/.055)*(strip===2?.19:.64)*Math.min(1,age/.25):0;
        }
      }
      quads++;
    }
    wakeGeo.setDrawRange(0,quads*6);wakeGeo.attributes.position.needsUpdate=true;wakeGeo.attributes.wakeAlpha.needsUpdate=true;
  }
  update(0,0,uniforms.uWind.value);
  return{root,boat,body,sails,flag,wake,reefMeshes,reefRoots,update,safe,getState:()=>({speed,routeCount,normal:normal.toArray(),destination:destination.toArray(),wakeSamples:history.length,reefClusters:reefRoots.length}),dispose(){}};
}
