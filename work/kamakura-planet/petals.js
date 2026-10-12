import * as THREE from 'three';
import {oceanWave} from './ocean.js';
const UP=new THREE.Vector3(0,1,0);
function random(seed){let v=seed;return()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};}
function petalGeometry(){
 const edge=[[-.08,-.50],[-.32,-.25],[-.43,.03],[-.34,.32],[-.13,.48],[0,.34],[.13,.48],[.34,.31],[.42,.03],[.30,-.28],[.06,-.5]],positions=[0,.035,0],colors=[1,.66,.73],indices=[];
 edge.forEach(([x,z],i)=>{positions.push(x,.04+x*x*.15,z);colors.push(1,.80+z*.13,.83+z*.09);indices.push(0,i+1,(i+1)%edge.length+1);});
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
export function createPetalRain({planet,surface,palette,sources=[]}){
 const rng=random(86109),count=1500,geo=petalGeometry(),mat=new THREE.MeshToonMaterial({color:'#f5c4d2',vertexColors:true,gradientMap:palette.ramp,side:THREE.DoubleSide});
 const mesh=new THREE.InstancedMesh(geo,mat,count);mesh.name='Petal rain and floating blossoms';mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;planet.add(mesh);
 const colors=['#ffe5e6','#f9c6d6','#f0b2c6','#fff2e7'].map(c=>new THREE.Color(c));
 const particles=[],dummy=new THREE.Object3D(),sway=new THREE.Vector3(),wind=new THREE.Vector3(),scratch=new THREE.Vector3();
 let floatCount=0,airCount=0,landCount=0,landings=0,waterLandings=0,elapsed=0,lowQuality=false;
 function spawn(p,initial=false,index=0){
  if(sources.length&&rng()<.29){p.n.copy(sources[Math.floor(rng()*sources.length)]).add(new THREE.Vector3((rng()-.5)*.22,(rng()-.5)*.22,(rng()-.5)*.22)).normalize();p.alt=.25+rng()*.4;}else{const y=rng()*2-1,a=rng()*Math.PI*2;p.n.set(Math.sin(a)*Math.sqrt(1-y*y),y,Math.cos(a)*Math.sqrt(1-y*y));p.alt=.3+rng()*.85;}
  p.phase=rng()*6.28;p.speed=.046+rng()*.038;p.spin=rng()*6.28;p.size=.022+rng()*.028;p.lifetime=18+rng()*22;p.age=0;p.state='air';
  if(initial&&index%3===0&&surface.height(p.n)<surface.R-.015){p.state='water';p.age=rng()*p.lifetime*.7;p.alt=0;}else if(initial)p.alt*=rng();
 }
 for(let i=0;i<count;i++){const p={n:new THREE.Vector3()};spawn(p,true,i);particles.push(p);mesh.setColorAt(i,colors[i%colors.length]);}
 function update(dt,t,env){
  elapsed=t;floatCount=airCount=landCount=0;const active=lowQuality?Math.floor(count*.55):count;mesh.count=active;
  for(let i=0;i<active;i++){
   const p=particles[i];wind.set(.75,.15,.42).addScaledVector(p.n,-(.75*p.n.x+.15*p.n.y+.42*p.n.z)).normalize();
   if(p.state==='air'){
    sway.crossVectors(p.n,wind);p.n.addScaledVector(wind,dt*(.006+.005*Math.sin(t*.4+p.phase))).addScaledVector(sway,dt*.007*Math.sin(t*.65+p.phase)).normalize();p.alt-=dt*p.speed;
    if(p.alt<=0){p.state=surface.height(p.n)<surface.R?'water':'land';p.age=0;p.alt=0;landings++;if(p.state==='water')waterLandings++;}
   }else{
    p.age+=dt;
    if(p.state==='water'){
     scratch.copy(p.n).addScaledVector(wind,dt*.0028).normalize();if(surface.height(scratch)<surface.R-.003)p.n.copy(scratch);
    }
    if(p.age>p.lifetime){spawn(p);}
   }
   if(p.state==='water')floatCount++;else if(p.state==='land')landCount++;else airCount++;
   let h;
   if(p.state==='water')h=surface.R+oceanWave(p.n,t)+.007;
   else h=Math.max(surface.R+oceanWave(p.n,t),surface.height(p.n))+p.alt+.006;
   dummy.position.copy(p.n).multiplyScalar(h);dummy.quaternion.setFromUnitVectors(UP,p.n);dummy.rotateY(p.spin+t*(p.state==='air'?.45:.035));
   if(p.state==='air'){dummy.rotateX(Math.sin(t*1.8+p.phase)*.9);dummy.rotateZ(Math.sin(t*.8+p.phase)*.65);}else dummy.rotateX(Math.sin(t*.6+p.phase)*.035);
   const fade=p.state==='air'?Math.min(1,.25+p.alt*12):Math.min(1,(p.lifetime-p.age)*.45);dummy.scale.setScalar(p.size*Math.max(.05,fade));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;mat.color.set(env.daylight<.2?'#e7c1e4':'#f9cdd8');
 }
 update(0,0,{daylight:1});
 return{mesh,particles,update,setLowQuality(v){lowQuality=v;},getState:()=>({total:mesh.count,airborne:airCount,floating:floatCount,landed:landCount,waterLandings,totalLandings:landings,time:elapsed}),dispose(){geo.dispose();mat.dispose();mesh.dispose();}};
}
