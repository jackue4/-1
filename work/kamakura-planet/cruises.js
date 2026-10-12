import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {oceanWave} from './ocean.js';

const TAU=Math.PI*2,UP=new THREE.Vector3(0,1,0);
export function createCruises({planet,surface,palette}){
 const {R,direction,height}=surface,root=new THREE.Group();root.name='Bay sightseeing launches and flowing wakes';planet.add(root);
 const bodyParts=[],windowParts=[],geometries=new Set(),materials=new Set(),matrices=[],states=[];
 const dummy=new THREE.Object3D(),tmp=new THREE.Matrix4(),n=new THREE.Vector3(),e=new THREE.Vector3(),s=new THREE.Vector3(),v=new THREE.Vector3();
 let elapsed=0,low=false;
 function part(parts,g,c,p=[0,0,0],scale=[1,1,1],rot=[0,0,0]){if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}g.deleteAttribute('uv');const col=new THREE.Color(c),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)a.set([col.r,col.g,col.b],i);g.setAttribute('color',new THREE.BufferAttribute(a,3));dummy.position.set(...p);dummy.rotation.set(...rot);dummy.scale.set(...scale);dummy.updateMatrix();g.applyMatrix4(dummy.matrix);parts.push(g);}
 const box=(parts,c,p,size,rot)=>part(parts,new THREE.BoxGeometry(...size),c,p,[1,1,1],rot);
 function rod(parts,c,a,b,r=.003){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),g=new THREE.CylinderGeometry(r,r,A.distanceTo(B),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,B.clone().sub(A).normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());part(parts,g,c);}
 const hullP=[],hullI=[],steps=24;
 for(let ring=0;ring<3;ring++)for(let j=0;j<steps;j++){const a=j/steps*TAU,z=Math.cos(a)*.23,x=Math.sin(a)*.084*(1-.24*Math.max(0,Math.cos(a))),q=[.65,.89,1][ring];hullP.push(x*q,[-.031,.010,.062][ring],z*(ring?1:.84));}
 for(let ring=0;ring<2;ring++)for(let j=0;j<steps;j++){const a=ring*steps+j,b=ring*steps+(j+1)%steps;hullI.push(a,b,a+steps,b,b+steps,a+steps);}
 const hull=new THREE.BufferGeometry();hull.setAttribute('position',new THREE.Float32BufferAttribute(hullP,3));hull.setIndex(hullI);hull.computeVertexNormals();part(bodyParts,hull,'#f4e6c9');
 const deck=new THREE.Shape();for(let j=0;j<=steps;j++){const a=j/steps*TAU,x=Math.sin(a)*.083*(1-.24*Math.max(0,Math.cos(a))),z=Math.cos(a)*.23;j?deck.lineTo(x,z):deck.moveTo(x,z);}const dg=new THREE.ShapeGeometry(deck);dg.rotateX(Math.PI/2);part(bodyParts,dg,'#cfa77c',[0,.063,0]);
 box(bodyParts,'#487f78',[0,.11,-.015],[.134,.089,.263]);box(bodyParts,'#f7efdb',[0,.161,-.019],[.156,.012,.293]);
 for(const side of[-1,1])for(let j=0;j<5;j++){box(windowParts,'#a5d3d2',[side*.068,.119,-.117+j*.052],[.002,.044,.037]);box(bodyParts,'#f4e8cf',[side*.070,.090,-.117+j*.052],[.004,.005,.043]);}
 box(windowParts,'#badcd4',[0,.121,.118],[.104,.045,.003]);box(bodyParts,'#486e65',[0,.196,.045],[.102,.065,.089]);box(windowParts,'#beded0',[0,.203,.091],[.079,.032,.003]);
 box(bodyParts,'#efe4c9',[0,.235,.045],[.129,.009,.112]);box(bodyParts,'#da9873',[0,.176,-.100],[.13,.014,.125]);
 for(const x of[-.052,.052])for(const z of[-.16,.015])rod(bodyParts,'#5a7970',[x,.169,z],[x,.204,z],.002);
 for(const x of[-.052,.052])rod(bodyParts,'#eee8cc',[x,.204,-.16],[x,.204,.015],.002);
 for(const z of[-.14,-.083,-.027])box(bodyParts,'#b77c58',[0,.176,z],[.083,.014,.021]);
 rod(bodyParts,'#5c756c',[0,.23,.043],[0,.315,.043],.002);box(bodyParts,'#e49a77',[.023,.299,.043],[.045,.024,.002]);
 for(const side of[-1,1]){const ring=new THREE.TorusGeometry(.018,.004,5,16);part(bodyParts,ring,'#e89064',[side*.075,.108,-.055],[1,1,1],[0,Math.PI/2,0]);for(const z of[-.185,.16])rod(bodyParts,'#e7dfc6',[side*.047,.068,z],[side*.047,.096,z],.002);}
 function bake(parts,material,name){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());geometries.add(g);const m=new THREE.InstancedMesh(g,material,2);m.name=name;m.castShadow=m.receiveShadow=true;m.frustumCulled=false;root.add(m);return m;}
 const hullMat=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:palette.ramp,side:THREE.DoubleSide}),glassMat=new THREE.MeshToonMaterial({vertexColors:true,color:'#c8e2d0',emissive:'#f4b35f',emissiveIntensity:0,gradientMap:palette.ramp});materials.add(hullMat);materials.add(glassMat);
 const boats=bake(bodyParts,hullMat,'Two deck sightseeing launches'),windows=bake(windowParts,glassMat,'Warm launch windows');
 function route(index,t){const a=t*.095+.13*Math.sin(t*.13)+1.25+index*Math.PI;return{lat:-.66+.09*Math.sin(a),lon:-.13+.32*Math.cos(a)};}
 function sample(index,t){const a=route(index,t),b=route(index,t+.03),N=direction(a.lat,a.lon),B=direction(b.lat,b.lon),T=B.clone().sub(N);T.addScaledVector(N,-T.dot(N)).normalize();const side=new THREE.Vector3().crossVectors(N,T).normalize();return{...a,n:N,tangent:T,side,speed:N.distanceTo(B)*R/.03};}
 function pose(q,t){return new THREE.Matrix4().makeBasis(q.side,q.n,q.tangent).setPosition(q.n.clone().multiplyScalar(R+oceanWave(q.n,t)));}
 // Validate the entire route corridor before adding it to the scene.
 let minimumDepth=Infinity;
 for(let t=0;t<200;t+=.25)for(let i=0;i<2;i++){const q=sample(i,t),depth=R-height(q.n);minimumDepth=Math.min(minimumDepth,depth);if(depth<.16||Math.abs(q.lat-surface.trackLat(q.lon))<.13)throw Error('Sightseeing route leaves safe open water');}
 const segments=66,wakeP=new Float32Array(2*3*(segments+1)*2*3),wakeUV=new Float32Array(2*3*(segments+1)*2*2),wakeI=[];
 for(let b=0;b<2;b++)for(let ribbon=0;ribbon<3;ribbon++){const base=(b*3+ribbon)*(segments+1)*2;for(let j=0;j<=segments;j++)for(let k=0;k<2;k++){const v=base+j*2+k;wakeUV.set([k,j/segments],v*2);if(j<segments&&k===0)wakeI.push(v,v+1,v+2,v+1,v+3,v+2);}}
 const wakeG=new THREE.BufferGeometry();wakeG.setAttribute('position',new THREE.BufferAttribute(wakeP,3).setUsage(THREE.DynamicDrawUsage));wakeG.setAttribute('uv',new THREE.BufferAttribute(wakeUV,2));wakeG.setIndex(wakeI);geometries.add(wakeG);
 const wakeM=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uLight:{value:1}},transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float uTime;uniform float uLight;varying vec2 vUv;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}void main(){vec2 uv=vUv;float swirl=noise(vec2(uv.x*7.+sin(uv.y*14.-uTime*.7),uv.y*31.-uTime*.35));float grains=noise(vec2(uv.x*19.,uv.y*104.-uTime*.8));float center=1.-pow(abs(uv.x*2.-1.),1.25);float ripple=sin(uv.y*57.-uTime*2.0+swirl*5.+sin(uv.x*14.+uv.y*19.)*1.7);float fade=pow(1.-uv.y,1.45)*smoothstep(0.,.045,uv.y);float alpha=center*fade*(.17+.50*smoothstep(.05,.85,ripple))*(.20+.80*smoothstep(.20,.66,grains))*(.50+.50*swirl);gl_FragColor=vec4(mix(vec3(.05,.14,.19),vec3(.82,.95,.88),uLight),alpha*.82);}`});materials.add(wakeM);
 const wake=new THREE.Mesh(wakeG,wakeM);wake.name='Curved expanding foam and propeller turbulence';wake.frustumCulled=false;wake.renderOrder=12;root.add(wake);
 const dropG=new THREE.SphereGeometry(1,5,4),dropM=new THREE.MeshBasicMaterial({color:'#d4f1e7',transparent:true,opacity:.72,depthWrite:false});geometries.add(dropG);materials.add(dropM);const spray=new THREE.InstancedMesh(dropG,dropM,112);spray.name='Stern spray droplets';spray.frustumCulled=false;spray.renderOrder=12;root.add(spray);
 function update(dt,time,env){elapsed=time;glassMat.emissiveIntensity=(env.night??0)*1.5;wakeM.uniforms.uTime.value=time;wakeM.uniforms.uLight.value=.14+.86*(env.daylight??1);dropM.opacity=.33+.4*(env.daylight??1);
  for(let i=0;i<2;i++){
   const q=sample(i,time),matrix=pose(q,time);matrices[i]=matrix;boats.setMatrixAt(i,matrix);windows.setMatrixAt(i,matrix);states[i]={position:new THREE.Vector3().setFromMatrixPosition(matrix).toArray(),lat:q.lat,lon:q.lon,speed:q.speed,seabedDepth:R-height(q.n)};
   for(let ribbon=0;ribbon<3;ribbon++)for(let j=0;j<=segments;j++){
    const fraction=j/segments,age=.23+fraction*8.0,Q=sample(i,time-age),speedScale=THREE.MathUtils.clamp(q.speed/.074,.65,1.45),spread=(.038+age*.022)*speedScale,width=ribbon===2?(.022+age*.012):(.014+age*.011),offset=ribbon===2?0:(ribbon?1:-1)*spread;
    for(let k=0;k<2;k++){v.copy(Q.n).multiplyScalar(R).addScaledVector(Q.tangent,-.19).addScaledVector(Q.side,offset+(k?1:-1)*width);n.copy(v).normalize();v.copy(n).multiplyScalar(R+oceanWave(n,time)+.008);wakeP.set(v.toArray(),(((i*3+ribbon)*(segments+1)+j)*2+k)*3);}
   }
  }
  const count=low?56:112;spray.count=count;
  for(let j=0;j<count;j++){const i=j%2,phase=(j*0.61803398875)%1,age=(time*.85+phase)%1,Q=sample(i,time-age*.8),sign=j%4<2?1:-1;n.copy(Q.n).multiplyScalar(R).addScaledVector(Q.tangent,-.215-age*.055).addScaledVector(Q.side,sign*(.035+age*.10));n.normalize();dummy.position.copy(n).multiplyScalar(R+oceanWave(n,time)+.008+Math.sin(age*Math.PI)*(.026+.022*phase));dummy.quaternion.setFromUnitVectors(UP,n);const size=(.003+.003*phase)*Math.sin(Math.PI*age);dummy.scale.set(size,size*1.65,size);dummy.updateMatrix();spray.setMatrixAt(j,dummy.matrix);}
  boats.instanceMatrix.needsUpdate=windows.instanceMatrix.needsUpdate=spray.instanceMatrix.needsUpdate=true;wakeG.attributes.position.needsUpdate=true;
 }
 update(0,0,{daylight:1,night:0});
 const stats={tourBoats:2,wakeRibbons:6,sprayParticles:112,minimumRouteDepth:minimumDepth,drawCalls:4,triangles:boats.geometry.attributes.position.count/3*2+windows.geometry.attributes.position.count/3*2+wakeI.length/3+dropG.index.count/3*112};
 return{root,stats,update,setLowQuality(v){low=v;},sample,route,getState:()=>({...stats,time:elapsed,boats:states.map(s=>({...s})),sprayParticles:spray.count}),dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());boats.dispose();windows.dispose();spray.dispose();}};
}
