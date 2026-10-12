import {THREE,R,COVE,SITES,normal,seeded} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const LEVEL=R+.008,TAU=Math.PI*2,UP=new THREE.Vector3(0,1,0);
// One translucent water skin and modest underwater instanced life. No offscreen
// reflection render, RAF, shared-material disposal, or accumulated simulation.
export function createDesertWater({planet,palette,height,landField,mobile=false}){
 if(typeof height!=='function')throw new TypeError('Desert water needs the actual terrain height function.');
 const root=new THREE.Group();root.name='青玉潮湾 · 透水鱼群与珊瑚草甸';root.userData.dynamic=true;planet.add(root);
 const geometries=new Set(),materials=new Set(),instances=[],rng=seeded(285116),clock={value:0},day={value:1},night={value:0},dusk={value:0};
 const ownedGeo=g=>(geometries.add(g),g),ownedMat=m=>(materials.add(m),m);
 const uniforms={uTime:clock,uDay:day,uNight:night,uDusk:dusk,uSun:{value:new THREE.Vector3(-.4,.82,.5).normalize()},uShallow:{value:new THREE.Color('#4dc9b0')},uDeep:{value:new THREE.Color('#169f9e')},uSky:{value:new THREE.Color('#abe0d6')},uFoam:{value:new THREE.Color('#f5efce')}};
 const direction=new THREE.Vector3();
 function sphere(w,h,bed=false){
  const g=ownedGeo(new THREE.SphereGeometry(LEVEL,w,h)),p=g.attributes.position,depth=new Float32Array(p.count);
  for(let i=0;i<p.count;i++){direction.fromBufferAttribute(p,i).normalize();const floor=height(direction);depth[i]=LEVEL-floor;if(bed)p.setXYZ(i,direction.x*(floor+.0028),direction.y*(floor+.0028),direction.z*(floor+.0028));}
  g.setAttribute('shoreDepth',new THREE.Float32BufferAttribute(depth,1));if(bed)g.computeVertexNormals();g.computeBoundingSphere();return g;
 }
 const vertex=`attribute float shoreDepth;varying float vDepth;varying vec3 vLocal;varying vec3 vWorld;varying vec3 vNormal;
 void main(){vDepth=shoreDepth;vLocal=position;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`;
 const waterMaterial=ownedMat(new THREE.ShaderMaterial({name:'Desert / translucent jade coast',uniforms,transparent:true,depthWrite:false,side:THREE.FrontSide,vertexShader:vertex,fragmentShader:`
 uniform float uTime,uDay,uNight,uDusk;uniform vec3 uShallow,uDeep,uSky,uFoam,uSun;varying float vDepth;varying vec3 vLocal,vWorld,vNormal;
 void main(){
  if(vDepth<-.001)discard;
  float depth=max(vDepth,0.),deep=smoothstep(.020,.205,depth);vec3 N=normalize(vNormal),V=normalize(cameraPosition-vWorld);
  float fresnel=pow(1.-clamp(dot(N,V),0.,1.),3.6);
  float w1=sin(dot(vLocal,vec3(17.,9.,22.))+sin(dot(vLocal,vec3(7.,5.,-9.)))*1.3-uTime*.49);
  float w2=sin(dot(vLocal,vec3(-14.,25.,9.))+sin(dot(vLocal,vec3(5.,-6.,11.)))*1.1+uTime*.37);
  float brush=sin(dot(vLocal,vec3(2.2,3.7,1.3)))*sin(dot(vLocal,vec3(-2.7,1.4,3.0)));
  vec3 tint=mix(uShallow,uDeep,deep*.83+brush*.04);
  float lit=.79+.21*smoothstep(-.45,.75,dot(N,uSun));tint*=lit;
  tint=mix(tint*vec3(.24,.43,.58),tint,uDay);tint=mix(tint,tint*vec3(1.10,.96,.85),uDusk*.33);
  vec3 sky=mix(uSky,vec3(.13,.23,.39),uNight);sky=mix(sky,vec3(.69,.43,.41),uDusk*.42);
  float reflectionBand=smoothstep(.36,.91,sin(dot(N,vec3(6.2,8.4,-3.1))+uTime*.034)*.5+.5);
  tint=mix(tint,sky,fresnel*(.17+reflectionBand*.10));
  // Fine broken strokes stay transparent, leaving the sand and fish readable.
  float stroke=smoothstep(.978,.999,w1*w2)*(.009+.014*(1.-deep))*(.25+.75*uDay);
  vec3 ripple=normalize(N+vec3(w1*.014,w2*.013,(w1-w2)*.010));
  float glint=pow(max(dot(reflect(-uSun,ripple),V),0.),72.);tint+=uFoam*(stroke+glint*.024*uDay);
  // Separate scalloped breakers read as two soft foam ribbons, rather than a
  // hard white coastline. The measured depth confines both to shallow water.
  float curl=dot(vLocal,vec3(24.,8.,-16.))+sin(dot(vLocal,vec3(5.,11.,7.)))*1.6;
  float scallop=sin(curl-uTime*.42)*.0039+sin(curl*1.87+uTime*.18)*.0011;
  float tide=depth+scallop+sin(uTime*.53)*.0015;
  float wave1=1.-smoothstep(.0030,.0082,abs(tide-.0135));
  float wave2=(1.-smoothstep(.0021,.0069,abs(tide-.0430)))*.71;
  float broken=.52+.48*smoothstep(-.35,.64,sin(dot(vLocal,vec3(12.,23.,15.))+sin(dot(vLocal,vec3(-8.,3.,7.)))));
  float flecks=(1.-smoothstep(.0007,.0020,abs(tide-.027)))*smoothstep(.81,.97,sin(curl*2.9+uTime*.27))*.18;
  float foam=clamp((wave1+wave2)*broken+flecks,0.,1.)*smoothstep(.001,.006,depth);
  tint=mix(tint,uFoam*(.27+.73*uDay),foam*.80);
  // Looking down through shallow water reveals the real plants and sand.
  // Greater optical depth and grazing views preserve the jade silhouette.
  float alpha=(.180+.145*deep+.155*fresnel+foam*.20)*smoothstep(-.001,.005,depth);
  gl_FragColor=vec4(tint,clamp(alpha,0.,.66));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }` }));
 const water=new THREE.Mesh(sphere(mobile?128:160,mobile?96:100),waterMaterial);water.name='通透青玉水面 · 沿真实海岸的奶油细浪';water.renderOrder=10;water.userData.noShadow=true;root.add(water);
 const causticMaterial=ownedMat(new THREE.ShaderMaterial({name:'Desert / faint bed caustics',uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:vertex,fragmentShader:`
 uniform float uTime,uDay;varying float vDepth;varying vec3 vLocal,vWorld,vNormal;
 void main(){
  if(vDepth<.012)discard;
  float a=sin(dot(vLocal,vec3(38.,9.,17.))+sin(dot(vLocal,vec3(8.,25.,-14.))+uTime*.32)*1.3+uTime*.21);
  float b=sin(dot(vLocal,vec3(-18.,31.,22.))+sin(dot(vLocal,vec3(23.,4.,13.))-uTime*.23)*1.2-uTime*.17);
  float stroke=pow(1.-abs(a),17.)+pow(1.-abs(b),19.);
  float visible=smoothstep(.012,.035,vDepth)*(1.-smoothstep(.18,.26,vDepth));
  gl_FragColor=vec4(vec3(.35,.54,.31),min(stroke,1.25)*visible*(.012+.085*uDay));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }` }));
 const bed=new THREE.Mesh(sphere(mobile?96:112,mobile?64:72,true),causticMaterial);bed.name='砂床上缓缓游动的柔光水纹';bed.renderOrder=1;bed.userData.noShadow=true;root.add(bed);

 function painted(g,low,high){const a=new THREE.Color(low),b=new THREE.Color(high),c=new THREE.Color(),p=g.attributes.position,colors=new Float32Array(p.count*3);g.computeBoundingBox();const y0=g.boundingBox.min.y,range=Math.max(.001,g.boundingBox.max.y-y0);for(let i=0;i<p.count;i++){c.copy(a).lerp(b,THREE.MathUtils.clamp((p.getY(i)-y0)/range,0,1));colors.set([c.r,c.g,c.b],i*3);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.deleteAttribute('uv');return g;}
 function geometry(p,indices,colors){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;}
 function grassGeometry(){
  const p=[],idx=[],rgb=[],bottom=new THREE.Color('#275f51'),tip=new THREE.Color('#a6d578'),c=new THREE.Color();
  for(let blade=0;blade<6;blade++){
   const a=blade*2.399,h=.62+rng()*.38,width=.042+rng()*.018,bend=.16+rng()*.15,offset=p.length/3;
   for(let j=0;j<=6;j++){const t=j/6,w=width*Math.sin(Math.PI*Math.pow(t,.77))+.001*(1-t);for(const side of[-1,1]){const x=side*w,z=bend*t*t;p.push(Math.cos(a)*x+Math.sin(a)*z,t*h,-Math.sin(a)*x+Math.cos(a)*z);c.copy(bottom).lerp(tip,Math.pow(t,.72)*.94);rgb.push(c.r,c.g,c.b);}if(j<6){const k=offset+j*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  }return geometry(p,idx,rgb);
 }
 function coralGeometry(){
  const parts=[];for(let branch=0;branch<7;branch++){
   const a=branch*2.399,h=.40+(branch%3)*.14,r=branch? .17:.02,points=[new THREE.Vector3(0,.02,0),new THREE.Vector3(Math.sin(a)*r,.18,Math.cos(a)*r),new THREE.Vector3(Math.sin(a)*r*1.35,h,Math.cos(a)*r*1.35)];
   parts.push(painted(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),7,.038,5,false),'#c78585','#edb69e'));const tip=painted(new THREE.SphereGeometry(.039,8,5),'#e9ab95','#f6d3b1');tip.translate(...points[2].toArray());parts.push(tip);
  }const result=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());return result;
 }
 function fishGeometry(){
  const parts=[],body=painted(new THREE.SphereGeometry(1,10,6),'#78b7b5','#f4e4b8');body.scale(.76,.25,.21);parts.push(body);
  for(const side of[-1,1]){const eye=painted(new THREE.SphereGeometry(.052,6,4),'#315963','#315963');eye.translate(.46,.065,side*.194);parts.push(eye);}
  const p=[-.59,0,0,-1.14,.30,.015,-.95,0,.04,-1.14,-.30,.015,-.22,.22,0,-.38,.43,0,.32,.23,0,.08,-.015,.18,-.26,-.13,.36,.28,-.03,.18,.08,-.015,-.18,-.26,-.13,-.36,.28,-.03,-.18],idx=[0,1,2,0,2,3,4,5,6,7,8,9,10,12,11],rgb=[],c=new THREE.Color('#e9cd8d');for(let i=0;i<p.length/3;i++)rgb.push(c.r,c.g,c.b);const fins=geometry(p,idx,rgb);
  // Thin fins have two faces; the shared fish material can retain front culling.
  const reverse=fins.index.array.slice();fins.setIndex([...fins.index.array,...Array.from({length:reverse.length/3},(_,i)=>[reverse[i*3+2],reverse[i*3+1],reverse[i*3]]).flat()]);parts.push(fins);
  const result=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());return result;
 }
 function marineMaterial(kind){
  const mat=ownedMat(palette.m('#ffffff').clone());mat.vertexColors=true;mat.emissive.set('#214740');mat.emissiveIntensity=.11;if(kind==='grass')mat.side=THREE.DoubleSide;
  if(kind==='grass'||kind==='fish'){
   mat.onBeforeCompile=shader=>{shader.uniforms.uDesertMarineTime=clock;shader.vertexShader='uniform float uDesertMarineTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float phase=dot(instanceMatrix[3].xyz,vec3(5.1,2.3,7.8));
    ${kind==='grass'?'float bend=position.y*position.y;transformed.x+=sin(uDesertMarineTime*.61+phase+position.y*2.)*.085*bend;transformed.z+=cos(uDesertMarineTime*.47+phase)*.050*bend;':'float tail=1.-smoothstep(-1.1,-.42,position.x);transformed.z+=sin(uDesertMarineTime*6.7+phase+position.x*2.0)*.20*tail;'}`);};mat.customProgramCacheKey=()=>`desert-marine-${kind}-v1`;
  }return mat;
 }
 function batch(name,g,items,kind){
  const mesh=new THREE.InstancedMesh(ownedGeo(g),marineMaterial(kind),Math.max(1,items.length));mesh.count=items.length;mesh.name=name;mesh.castShadow=mesh.receiveShadow=false;mesh.userData.noShadow=true;items.forEach((item,i)=>{mesh.setMatrixAt(i,item.matrix);mesh.setColorAt(i,item.color||new THREE.Color('#ffffff'));});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();if(mesh.boundingSphere)mesh.boundingSphere.radius+=.045;root.add(mesh);instances.push(mesh);return mesh;
 }

 const tangent=new THREE.Vector3(),north=new THREE.Vector3(),n=new THREE.Vector3(),scratch=new THREE.Vector3(),future=new THREE.Vector3(),forward=new THREE.Vector3(),side=new THREE.Vector3(),matrix=new THREE.Matrix4(),dummy=new THREE.Object3D();
 function basis(center){const east=new THREE.Vector3().crossVectors(UP,center);if(east.lengthSq()<.01)east.set(1,0,0).cross(center);east.normalize();return{center:center.clone(),east,north:new THREE.Vector3().crossVectors(center,east).normalize()};}
 function loopNormal(s,phase,out){return out.copy(s.center).addScaledVector(s.east,Math.cos(phase)*s.rx).addScaledVector(s.north,Math.sin(phase)*s.ry).normalize();}
 // Authored foreground candidates first, then a deterministic global search.
 const candidates=[[-.25,0],[-.49,.30],[-.55,-.48],[.38,2.8],[-.38,1.30],[-.57,-.92],[-.77,.21],[.01,-1.21]].map(([a,b])=>normal(a,b));
 for(let i=0;i<900;i++){const y=1-2*(i+.5)/900,angle=i*2.39996323;candidates.push(new THREE.Vector3(Math.cos(angle)*Math.sqrt(1-y*y),y,Math.sin(angle)*Math.sqrt(1-y*y)));}
 const schools=[];
 for(const center of candidates){
  if(schools.length===6)break;if(LEVEL-height(center)<.145||schools.some(s=>s.center.dot(center)>.974))continue;
  const school={...basis(center),rx:.055,ry:.033,index:schools.length,speed:.10+schools.length*.011};let safe=true,minDepth=1;
  for(let i=0;i<64&&safe;i++)for(const width of[0,.020,-.020]){
   loopNormal(school,i/64*TAU,n);n.addScaledVector(school.north,width).normalize();const d=LEVEL-height(n);minDepth=Math.min(minDepth,d);if(d<.125){safe=false;break;}
  }if(safe){school.minDepth=minDepth;schools.push(school);}
 }
 // Terrain can be authored unusually dry; in that case report the actual safe
 // count instead of placing visible fish in land or through the surface.
 const fish=[];for(const s of schools)for(let j=0;j<7;j++)fish.push({school:s,phase:j*TAU/7+s.index*.71,size:.035+(j%3)*.003,color:new THREE.Color(['#fff3ce','#d9eef0','#f2d2b3'][s.index%3])});
 const bodies=batch('六队悠游的小鱼 · 42尾细摆尾鳍',fishGeometry(),fish.map(f=>({matrix:new THREE.Matrix4(),color:f.color})),'fish');bodies.frustumCulled=false;

 const gardenCandidates=[],coveFrame=basis(normal(COVE.lat,COVE.lon)),oasisFrame=basis(normal(SITES.oasis.lat,SITES.oasis.lon));
 // Readable patches are deliberately reserved for both featured water views.
 // Phyllotaxis supplies short/medium/tall tufts with open sand between them.
 for(const [x,z]of[[-.31,1.10],[.28,1.26],[-.42,1.68],[.43,1.88]]){
  const center=coveFrame.center.clone().multiplyScalar(R+COVE.raise).addScaledVector(coveFrame.east,x).addScaledVector(coveFrame.north,-z).normalize(),local=basis(center);
  for(let i=0;i<16;i++){const a=i*2.399,spread=.012+Math.sqrt(i/15)*.039;gardenCandidates.push({center:center.clone().addScaledVector(local.east,Math.cos(a)*spread).addScaledVector(local.north,Math.sin(a)*spread*.8).normalize(),zone:'cove'});}
 }
 for(let i=0;i<44;i++){const a=i*2.399,spread=Math.sqrt((i+.5)/44)*.065;gardenCandidates.push({center:oasisFrame.center.clone().addScaledVector(oasisFrame.east,Math.cos(a)*spread).addScaledVector(oasisFrame.north,Math.sin(a)*spread*.80).normalize(),zone:'oasis'});}
 for(const s of schools)for(let i=0;i<12;i++)gardenCandidates.push({center:s.center.clone().addScaledVector(s.east,Math.cos(i*2.399)*.10).addScaledVector(s.north,Math.sin(i*2.399)*.07).normalize(),zone:'sea'});
 gardenCandidates.push(...candidates.map(center=>({center,zone:'sea'})));
 const grass=[],coral=[],shells=[],gardens=[],plantClearances=[],coralCenters=[],stoneCenters=[],gardenZones={cove:0,oasis:0,sea:0},gardenLimits={cove:30,oasis:18,sea:16};
 for(const {center,zone}of gardenCandidates){
  if(grass.length===64)break;if(gardenZones[zone]>=gardenLimits[zone])continue;const floor=height(center),depth=LEVEL-floor;if(depth<.078||depth>.240||gardens.some(p=>p.dot(center)>.99988))continue;
  const tier=grass.length%3,scale=Math.min(.164,.081+tier*.027+rng()*.015,(depth-.037)/1.075),widthScale=scale*(tier===0?.87:tier===2?1.10:1);
  if(scale<.034)continue;dummy.position.copy(center).multiplyScalar(floor+.003);dummy.quaternion.setFromUnitVectors(UP,center);dummy.rotateY(rng()*TAU);dummy.scale.set(widthScale,scale,widthScale);dummy.updateMatrix();grass.push({matrix:dummy.matrix.clone(),color:new THREE.Color(tier===0?'#e3efd0':tier===2?'#d1e6ba':'#ffffff')});gardens.push(center.clone());gardenZones[zone]++;plantClearances.push(depth-.003-scale*1.04);
 }
 // Reef pieces decorate the outside of the grass patches. Never place a
 // coral or pale stone at the same centre as a tuft and hide its silhouette.
 for(const [index,center]of gardens.entries()){
  const local=basis(center);
  for(let attempt=0;attempt<6&&(coral.length<14||shells.length<18);attempt++){
   const a=index*2.399+attempt*1.047,offset=.032+attempt*.004,point=center.clone().addScaledVector(local.east,Math.cos(a)*offset).addScaledVector(local.north,Math.sin(a)*offset).normalize(),floor=height(point),depth=LEVEL-floor;
   if(depth<.095||depth>.240||gardens.some(p=>p.distanceTo(point)*R<.085))continue;
   dummy.position.copy(point).multiplyScalar(floor+.004);dummy.quaternion.setFromUnitVectors(UP,point);dummy.rotateY(a);
   if(coral.length<14&&!coralCenters.some(p=>p.distanceTo(point)*R<.105)){
    const scale=Math.min(.125,(depth-.039)/.80);dummy.scale.setScalar(scale);dummy.updateMatrix();coral.push({matrix:dummy.matrix.clone(),color:new THREE.Color(coral.length%3?'#e4d6c0':'#ddc8e2')});coralCenters.push(point.clone());plantClearances.push(depth-.004-scale*.75);
   }else if(shells.length<18&&!stoneCenters.some(p=>p.distanceTo(point)*R<.07)&&!coralCenters.some(p=>p.distanceTo(point)*R<.073)){
    dummy.scale.set(.039,.014,.031);dummy.updateMatrix();shells.push({matrix:dummy.matrix.clone(),color:new THREE.Color(shells.length%3?'#c6c8a8':'#aac4b1')});stoneCenters.push(point.clone());
   }
  }
 }
 batch('海床上64丛高低错落的柔软水草',grassGeometry(),grass,'grass');batch('草甸外围的小枝珊瑚',coralGeometry(),coral,'coral');
 const shell=painted(new THREE.SphereGeometry(1,10,6),'#6e9587','#c7c8a9');shell.translate(0,.45,0);batch('草甸外围的低矮石贝',shell,shells,'stone');
 const stats={waterRadius:LEVEL,fish:fish.length,schools:schools.length,grassClusters:grass.length,gardenZones,coralClusters:coral.length,seabedStones:shells.length,drawCalls:0,triangles:0,surfaceAlphaRange:[.180,.66],reflectionPasses:0};root.traverse(o=>{if(!o.isMesh)return;stats.drawCalls++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});
 let disposed=false,lastTime=0,minFishBed=Infinity,minFishSurface=Infinity;
 const fishPositions=fish.map(()=>new THREE.Vector3());
 function sampleFish(f,time,out){const angle=time*f.school.speed+f.phase;loopNormal(f.school,angle,n);const radius=LEVEL-.078+Math.sin(angle*.93+f.phase)*.007;return out.copy(n).multiplyScalar(radius);}
 function update(time,env={}){
  if(disposed)return;lastTime=Number.isFinite(time)?time:0;clock.value=lastTime;night.value=THREE.MathUtils.clamp(env.night||0,0,1);day.value=THREE.MathUtils.clamp(env.daylight??1-night.value,0,1);dusk.value=THREE.MathUtils.clamp(env.dusk||0,0,1);minFishBed=minFishSurface=Infinity;
  for(let i=0;i<fish.length;i++){
   const f=fish[i],position=sampleFish(f,lastTime,fishPositions[i]);sampleFish(f,lastTime+.035,future);n.copy(position).normalize();forward.subVectors(future,position).addScaledVector(n,-forward.dot(n)).normalize();side.crossVectors(forward,n).normalize();north.crossVectors(side,forward).normalize();matrix.makeBasis(forward,north,side);
   dummy.position.copy(position);dummy.quaternion.setFromRotationMatrix(matrix);dummy.scale.setScalar(f.size);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);
   const radius=position.length(),extent=f.size*.35;minFishBed=Math.min(minFishBed,radius-height(n)-extent);minFishSurface=Math.min(minFishSurface,LEVEL-radius-extent);
  }bodies.instanceMatrix.needsUpdate=true;
 }
 function getState(){return{...stats,time:lastTime,night:night.value,daylight:day.value,dusk:dusk.value,disposed,minFishBedClearance:Number.isFinite(minFishBed)?minFishBed:null,minFishSurfaceClearance:Number.isFinite(minFishSurface)?minFishSurface:null,minPlantSurfaceClearance:plantClearances.length?Math.min(...plantClearances):null,schoolCenters:schools.map(s=>({normal:s.center.toArray(),minRouteDepth:s.minDepth})),fishPositions:fishPositions.map(p=>p.toArray())};}
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of instances)mesh.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();instances.length=0;geometries.clear();materials.clear();}
 update(0,{night:0,daylight:1});return{root,stats,update,getState,dispose};
}
