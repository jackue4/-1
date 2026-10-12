import {THREE,R,TAU,COVE,SITES,normal,frame} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Four little night visitors share one bandage model and one ground-light batch.
// Their appearance, place and pose are functions of absolute world time only.
export function createNightMummies({palette,height,landField,mobile=false}){
 const root=new THREE.Group();root.name='月光奇遇 · 会发光的绷带小旅人';root.userData.dynamic=true;
 const owned=new Set(),materials=new Set(),parts=[],UP=new THREE.Vector3(0,1,0);
 const clamp=THREE.MathUtils.clamp,smooth=THREE.MathUtils.smoothstep;
 const hash=(a,b=0)=>{let n=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+82419)|0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;};
 const sphere=new THREE.SphereGeometry(1,20,12),smallSphere=new THREE.SphereGeometry(1,12,8);
 const cream=['#f3e7ce','#fff1d8','#e4d5b8','#f7ecd4','#eddfc1'],ink='#39434b';
 const geomMatrix=new THREE.Matrix4(),geomRotation=new THREE.Quaternion(),geomPosition=new THREE.Vector3(),geomScale=new THREE.Vector3(),geomEuler=new THREE.Euler();
 function add(source,color,p=[0,0,0],s=[1,1,1],r=[0,0,0],emission=.235,cloth=0,foot=0){
  const g=source.clone();for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);
  if(!g.attributes.normal)g.computeVertexNormals();if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
  geomPosition.set(...p);geomScale.set(...s);geomRotation.setFromEuler(geomEuler.set(...r));geomMatrix.compose(geomPosition,geomRotation,geomScale);g.applyMatrix4(geomMatrix);g.clearGroups();
  const count=g.attributes.position.count,c=new THREE.Color(color),rgb=new Float32Array(count*3),detail=new Float32Array(count*3);
  for(let i=0;i<count;i++){rgb.set([c.r,c.g,c.b],i*3);detail.set([emission,cloth,foot],i*3);}
  g.setAttribute('color',new THREE.BufferAttribute(rgb,3));g.setAttribute('mummyDetail',new THREE.BufferAttribute(detail,3));parts.push(g);
 }
 const ball=(color,p,s,r=[0,0,0],emission=.235,foot=0)=>add(Math.max(...s)<.05?smallSphere:sphere,color,p,s,r,emission,0,foot);
 function band(center,radii,y,width,slant,color,phase=0){
  const pos=[],idx=[],steps=40;
  for(let j=0;j<3;j++)for(let i=0;i<=steps;i++){
   const a=i/steps*TAU,dy=y+(j/2-.5)*width+slant*Math.sin(a)+.002*Math.sin(a*2+phase),lat=clamp(dy/radii[1],-.97,.97),ring=Math.sqrt(1-lat*lat);
   pos.push(center[0]+Math.sin(a)*(radii[0]+.0018)*ring,center[1]+dy,center[2]+Math.cos(a)*(radii[2]+.0018)*ring);
   if(j<2&&i<steps){const k=j*(steps+1)+i;idx.push(k,k+steps+1,k+1,k+1,k+steps+1,k+steps+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();add(g,color);
  // A fine warm seam gives each wrap a soft hand-drawn edge, without black rings.
  const seam=[];for(let i=0;i<=steps;i++){const a=i/steps*TAU,dy=y-width*.49+slant*Math.sin(a)+.002*Math.sin(a*2+phase),lat=clamp(dy/radii[1],-.97,.97),ring=Math.sqrt(1-lat*lat);seam.push(new THREE.Vector3(center[0]+Math.sin(a)*(radii[0]+.0022)*ring,center[1]+dy,center[2]+Math.cos(a)*(radii[2]+.0022)*ring));}
  const seamGeometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam),40,.0008,3,false);add(seamGeometry,'#c9baa0',[0,0,0],[1,1,1],[0,0,0],.025);g.dispose();seamGeometry.dispose();
 }
 function ribbon(points,width,color,cloth=1){
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),pos=[],idx=[],steps=12;
  for(let i=0;i<=steps;i++){const p=path.getPoint(i/steps),w=width*(1-.25*i/steps);for(const side of[-1,1])pos.push(p.x,p.y+side*w*.5,p.z+side*.0015*Math.sin(i*.5));if(i<steps){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();add(g,color,[0,0,0],[1,1,1],[0,0,0],.22,cloth);g.dispose();
 }
 // A large rounded hood frames a dark face; the torso is deliberately tiny.
 ball(cream[2],[0,.130,0],[.064,.089,.048]);ball(cream[0],[0,.268,0],[.108,.094,.087]);
 ball(ink,[0,.273,.070],[.080,.049,.025],[0,0,-.12],.002);
 ball('#273840',[.012,.265,.087],[.061,.034,.013],[0,0,-.12],0);
 // Asymmetric, softly oval eyes and a tiny reflected glint keep the expression kind.
 ball('#fff1bb',[-.030,.278,.099],[.009,.0125,.006],[0,0,-.05],1.35);
 ball('#fff1c8',[.032,.266,.100],[.0085,.012,.006],[0,0,-.05],1.3);
 ball('#ffffff',[-.0315,.282,.104],[.0025,.0035,.0018],[0,0,0],1.55);
 ball('#ffffff',[.030,.270,.105],[.0024,.0032,.0018],[0,0,0],1.55);
 // Wraps pass above and below the eye opening, then wind diagonally around the back.
 for(const [i,y,w,tilt]of [[0,-.071,.028,.004],[1,-.051,.026,-.011],[2,-.036,.021,-.016],[3,.043,.028,-.022],[4,.064,.024,.010],[5,.080,.022,-.005]])band([0,.268,0],[.109,.095,.088],y,w,tilt,cream[i%cream.length],i*.8);
 for(let i=0;i<6;i++)band([0,.132,0],[.065,.087,.049],-.066+i*.024,.026,i%2?.008:-.010,cream[(i+2)%cream.length],i);
 for(const side of[-1,1]){
  ball(cream[2],[side*.074,.138,.003],[.027,.062,.029],[0,0,side*.24]);
  for(let i=0;i<3;i++)band([side*.078,.131,.005],[.028,.047,.030],-.031+i*.028,.022,side*.005,cream[(i+1)%cream.length],i);
  ball(cream[1],[side*.081,.084,.021],[.026,.027,.029],[0,0,side*.12]);
  ball(cream[2],[side*.032,.039,.008],[.025,.034,.031],[0,0,side*.07],.19,side);
  ball(cream[1],[side*.032,.017,.023],[.030,.018,.039],[0,0,side*.035],.235,side);
  ball('#cfbfa3',[side*.032,.008,.027],[.027,.005,.033],[0,0,0],.022,side);
 }
 ribbon([[.083,.310,-.010],[.116,.319,-.008],[.148,.306,-.006],[.164,.315,-.010]],.020,cream[1]);
 ribbon([[.087,.305,-.014],[.116,.303,-.020],[.125,.278,-.028]],.014,cream[2]);
 ribbon([[-.052,.095,.027],[-.078,.067,.036],[-.073,.041,.041],[-.097,.047,.049]],.020,cream[0]);
 ribbon([[.046,.082,-.027],[.067,.054,-.034],[.088,.047,-.019]],.018,cream[1]);
 const model=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());sphere.dispose();smallSphere.dispose();model.computeBoundingBox();model.computeBoundingSphere();owned.add(model);
 const instanceStyle=new THREE.InstancedBufferAttribute(new Float32Array(4*4),4).setUsage(THREE.DynamicDrawUsage);model.setAttribute('mummyStyle',instanceStyle);
 const tick={value:0},night={value:0};
 const material=palette.m('#ffffff').clone();material.vertexColors=true;material.transparent=true;material.opacity=1;material.side=THREE.DoubleSide;material.forceSinglePass=true;material.emissive.set('#000000');materials.add(material);
 material.onBeforeCompile=s=>{
  s.uniforms.mummyTime=tick;s.uniforms.mummyNight=night;
  s.vertexShader='attribute vec3 mummyDetail;attribute vec4 mummyStyle;uniform float mummyTime;varying vec3 vMummyDetail;varying vec4 vMummyStyle;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vMummyDetail=mummyDetail;vMummyStyle=mummyStyle;
   transformed.x+=mummyDetail.y*sin(mummyTime*2.1+position.y*19.+mummyStyle.z)*.003;
   transformed.z+=mummyDetail.y*sin(mummyTime*1.8+position.x*16.+mummyStyle.z)*.002;
   transformed.y+=abs(mummyDetail.z)*max(0.,sin(mummyTime*1.9+mummyStyle.z+mummyDetail.z*1.6))*.004;
  `);
  s.fragmentShader='uniform float mummyNight;varying vec3 vMummyDetail;varying vec4 vMummyStyle;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   diffuseColor.a*=vMummyStyle.x;if(diffuseColor.a<.003)discard;
   vec3 moonTint=mix(vec3(1.,.79,.47),vec3(.56,1.,.86),vMummyStyle.y);
   if(vMummyDetail.x<.5)moonTint=mix(vec3(1.,.92,.75),vec3(.69,1.,.90),vMummyStyle.y);
   totalEmissiveRadiance+=moonTint*vMummyDetail.x*(.78+vMummyStyle.w*.27)*mummyNight;
  `);
 };material.customProgramCacheKey=()=> 'little-bloom-cute-mummy-v1';
 const bodies=new THREE.InstancedMesh(model,material,4);bodies.name='四位圆头小木乃伊 · 绷带与星星眼合批';bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bodies.frustumCulled=false;bodies.castShadow=false;bodies.receiveShadow=true;root.add(bodies);
 // One depth-tested billboard draw adds a gentle aura outside each silhouette.
 // The solid body writes depth first, so its dark face never becomes a glow blob.
 const haloGeometry=new THREE.PlaneGeometry(1,1);haloGeometry.setAttribute('mummyStyle',instanceStyle);owned.add(haloGeometry);
 const haloMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false,vertexShader:`attribute vec4 mummyStyle;varying vec2 vUv;varying vec4 vStyle;void main(){vUv=uv;vStyle=mummyStyle;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);vec2 extent=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));center.xy+=position.xy*extent;gl_Position=projectionMatrix*center;}`,fragmentShader:`varying vec2 vUv;varying vec4 vStyle;void main(){float r=length(vUv-.5)*2.;float alpha=pow(max(0.,1.-r),1.7)*vStyle.x*(.125+vStyle.w*.025);if(alpha<.001)discard;vec3 color=mix(vec3(1.,.77,.43),vec3(.51,1.,.84),vStyle.y);gl_FragColor=vec4(color,alpha);}`});materials.add(haloMaterial);
 const halos=new THREE.InstancedMesh(haloGeometry,haloMaterial,4);halos.name='绷带边缘的呼吸月晕 · 四只共用一层';halos.instanceMatrix.setUsage(THREE.DynamicDrawUsage);halos.frustumCulled=false;halos.renderOrder=1;root.add(halos);

 // Candidates are deliberately outside building platforms and the cove props.
 const candidateGroups=[
  {id:'cove',label:'海湾月光沙地',site:COVE,points:[[-.37,.20],[-.15,.28]],yaw:.05},
  {id:'treasury',label:'玫瑰石城前',site:SITES.treasury,points:[[.20,1.02],[-.23,1.04]],yaw:-.12},
  {id:'kasbah',label:'沙色小巷外',site:SITES.kasbah,points:[[-.13,1.04],[.30,1.04]],yaw:.12},
  {id:'caravan',label:'驼铃驿站旁',site:SITES.caravan,points:[[.14,1.08],[.52,.97]],yaw:-.10},
 ];
 const spots=[],zones=[],rejected=[];
 const probe=new THREE.Vector3(),east=new THREE.Vector3(),south=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3();
 for(const group of candidateGroups){
  const zone=[];const base=frame(group.site.lat,group.site.lon,R+(group.site.raise||0));
  for(let j=0;j<group.points.length;j++){
   const [x,z]=group.points[j],n=new THREE.Vector3(x,0,z).applyMatrix4(base).normalize(),h=height(n),lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z),radialFrame=frame(lat,lon,h),position=n.clone().multiplyScalar(h);
   east.setFromMatrixColumn(radialFrame,0);south.setFromMatrixColumn(radialFrame,2);
   const sample=(dx,dz,out)=>{out.copy(position).addScaledVector(east,dx).addScaledVector(south,dz).normalize();return out.multiplyScalar(height(out));};
   const dx=sample(.016,0,a).clone().sub(sample(-.016,0,b)).normalize(),dz=sample(0,.016,a).clone().sub(sample(0,-.016,b)).normalize(),up=new THREE.Vector3().crossVectors(dz,dx).normalize();
   const sx=dx.clone(),sz=new THREE.Vector3().crossVectors(sx,up).normalize(),groundMatrix=new THREE.Matrix4().makeBasis(sx,up,sz).setPosition(position),inverse=groundMatrix.clone().invert();
   let minDry=Infinity,minField=Infinity,lift=0,maxRipple=0;
   for(let k=0;k<25;k++){const theta=k/24*TAU,r=k===24?0:.135;probe.set(Math.sin(theta)*r,0,Math.cos(theta)*r).applyMatrix4(groundMatrix).normalize();minDry=Math.min(minDry,height(probe)-R);minField=Math.min(minField,landField(probe));probe.multiplyScalar(height(probe)).applyMatrix4(inverse);lift=Math.max(lift,probe.y);maxRipple=Math.max(maxRipple,Math.abs(probe.y));}
   const buildingDistance=Math.min(...Object.entries(SITES).map(([id,s])=>id==='oasis'?Infinity:Math.acos(clamp(n.dot(normal(s.lat,s.lon)),-1,1))*R));
   const safe=minDry>.036&&minField>.07&&maxRipple<.05&&(group.id==='cove'||buildingDistance>.89);
   if(!safe){rejected.push({id:`${group.id}-${j}`,minDry,minField,maxRipple,buildingDistance});continue;}
   const spot={id:`${group.id}-${j}`,label:group.label,index:spots.length,zone:zones.length,lat,lon,position,up,east:sx,south:sz,groundMatrix,quaternion:new THREE.Quaternion().setFromRotationMatrix(groundMatrix),lift:lift+.007,yaw:group.yaw,minDry,minField,maxRipple,buildingDistance};spots.push(spot);zone.push(spot);
  }
  if(zone.length)zones.push(zone);
 }
 if(zones.length!==4)throw new Error(`Night visitors need four safe dry-land zones; found ${zones.length}.`);
 // Each softly feathered light pool follows the actual sand, not a floating disc.
 const poolPositions=[],poolUV=[],poolSlot=[],poolIndices=[],poolCount=spots.length,glowStates=Array.from({length:poolCount},()=>new THREE.Vector4());
 for(const spot of spots){const rings=5,segments=32,start=poolPositions.length/3;for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){const theta=i/segments*TAU,r=j/rings*.205,x=Math.sin(theta)*r,z=Math.cos(theta)*r;probe.set(x,0,z).applyMatrix4(spot.groundMatrix).normalize();probe.multiplyScalar(height(probe)+.0035);poolPositions.push(...probe.toArray());poolUV.push(x/.41+.5,z/.41+.5);poolSlot.push(spot.index);if(j<rings&&i<segments){const k=start+j*(segments+1)+i;poolIndices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}}}
 const poolGeometry=new THREE.BufferGeometry();poolGeometry.setAttribute('position',new THREE.Float32BufferAttribute(poolPositions,3));poolGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(poolUV,2));poolGeometry.setAttribute('mummyPool',new THREE.Float32BufferAttribute(poolSlot,1));poolGeometry.setIndex(poolIndices);poolGeometry.computeBoundingSphere();owned.add(poolGeometry);
 const poolMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false,uniforms:{glowStates:{value:glowStates}},vertexShader:`attribute float mummyPool;varying vec2 vUv;varying float vPool;void main(){vUv=uv;vPool=mummyPool;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform vec4 glowStates[${poolCount}];varying vec2 vUv;varying float vPool;void main(){vec4 style=vec4(0.);for(int i=0;i<${poolCount};i++){if(abs(vPool-float(i))<.5)style=glowStates[i];}float r=length(vUv-.5)*2.;float alpha=pow(max(0.,1.-r),2.6)*style.a;if(alpha<.002)discard;gl_FragColor=vec4(style.rgb,alpha);}`});materials.add(poolMaterial);
 poolMaterial.forceSinglePass=true;const pools=new THREE.Mesh(poolGeometry,poolMaterial);pools.name='贴着沙纹的暖金与薄荷小光池';pools.renderOrder=3;root.add(pools);
 const sparklePositions=new Float32Array(4*3*3),sparkleColors=new Float32Array(sparklePositions.length),sparkleGeometry=new THREE.BufferGeometry();sparkleGeometry.setAttribute('position',new THREE.BufferAttribute(sparklePositions,3).setUsage(THREE.DynamicDrawUsage));sparkleGeometry.setAttribute('color',new THREE.BufferAttribute(sparkleColors,3).setUsage(THREE.DynamicDrawUsage));owned.add(sparkleGeometry);
 const sparkleMaterial=new THREE.PointsMaterial({vertexColors:true,size:mobile?.010:.009,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});materials.add(sparkleMaterial);
 sparkleMaterial.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat r=length(gl_PointCoord-.5)*2.;diffuseColor.a*=pow(max(0.,1.-r),2.);');};sparkleMaterial.customProgramCacheKey=()=> 'mummy-soft-sparkle-v1';
 const sparkles=new THREE.Points(sparkleGeometry,sparkleMaterial);sparkles.name='绷带边的十二粒月光';sparkles.frustumCulled=false;root.add(sparkles);
 const actors=Array.from({length:4},(_,i)=>({id:i,spot:zones[i][0],opacity:0,phase:0,cycle:0,position:new THREE.Vector3(),quaternion:new THREE.Quaternion(),mint:i%2,size:[.87,.94,.86,.90][i]}));
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),euler=new THREE.Euler(),scale=new THREE.Vector3(),offset=new THREE.Vector3(),bodyPosition=new THREE.Vector3(),haloPosition=new THREE.Vector3(),spark=new THREE.Vector3(),tints=[[1,.74,.36],[.51,.98,.79]];
 let disposed=false,lastTime=null,lastNight=-1,lastPreview=false,visibleCount=0;
 const stats={capacity:4,minNightVisitors:2,maxNightVisitors:4,safeSpots:spots.length,zones:4,drawCalls:4,pointLights:0,sharedModels:1,haloDrawCalls:1,bandageEmission:.235,modelTriangles:model.index.count/3,maxBodyTriangles:model.index.count/3*4,groundTriangles:poolIndices.length/3,sparkles:12,reference:'Round head, layered cream bandages, dark face opening and gentle bright eyes',rejectedSpots:rejected};
 function update(time,env={}){
  if(disposed)return;time=Number.isFinite(time)?Math.max(0,time):0;const n=clamp(Number(env.night)||0,0,1),preview=!!env.preview;
  if(time===lastTime&&n===lastNight&&preview===lastPreview)return;lastTime=time;lastNight=n;lastPreview=preview;
  const gate=preview?0:smooth(n,.12,.64);root.visible=gate>.001;visibleCount=0;
  if(!root.visible){for(const actor of actors)actor.opacity=0;return;}
  tick.value=time;night.value=gate;for(const state of glowStates)state.set(0,0,0,0);
  for(let i=0;i<4;i++){
   const actor=actors[i],clock=time/68+i*.25+.18,cycle=Math.floor(clock),phase=clock-cycle,duration=.70+hash(cycle,i+41)*.25;
   const envelope=smooth(phase,0,.045)*(1-smooth(phase,duration-.065,duration)),alpha=gate*envelope;
   const zone=zones[i],spot=zone[Math.floor(hash(cycle,i+719)*zone.length)],pulse=.5+.5*Math.sin(time*1.3+i*1.73),pace=time*1.9+i*1.6;
   actor.spot=spot;actor.opacity=alpha;actor.phase=phase;actor.cycle=cycle;if(alpha>.035)visibleCount++;
   offset.set(Math.sin(time*.48+i)*.014,0,Math.cos(time*.39+i)*.008).applyQuaternion(spot.quaternion);
   bodyPosition.copy(spot.position).add(offset).normalize();bodyPosition.multiplyScalar(height(bodyPosition));bodyPosition.addScaledVector(spot.up,spot.lift+.0015*(1+Math.sin(pace)));
   rotation.setFromEuler(euler.set(Math.sin(time*.82+i)*.025,spot.yaw+Math.sin(time*.36+i)*.15,Math.sin(time*.74+i)*.035));actor.quaternion.copy(spot.quaternion).multiply(rotation);actor.position.copy(bodyPosition);scale.setScalar(actor.size);matrix.compose(bodyPosition,actor.quaternion,scale);bodies.setMatrixAt(i,matrix);instanceStyle.setXYZW(i,alpha,actor.mint,i*1.73,pulse);
   haloPosition.copy(bodyPosition).addScaledVector(spot.up,.18*actor.size);scale.set(.39*actor.size,.52*actor.size,1);matrix.compose(haloPosition,actor.quaternion,scale);halos.setMatrixAt(i,matrix);
   const tint=tints[actor.mint];glowStates[spot.index].set(tint[0],tint[1],tint[2],alpha*(.38+pulse*.14));
   for(let j=0;j<3;j++){const k=i*3+j,angle=time*.46+j*TAU/3+i,speed=.5+.5*Math.sin(time*.92+j*2+i);spark.set(Math.cos(angle)*.113,.17+j*.044+Math.sin(time*.76+j+i)*.018,Math.sin(angle)*.091).applyQuaternion(spot.quaternion).add(bodyPosition);sparklePositions[k*3]=spark.x;sparklePositions[k*3+1]=spark.y;sparklePositions[k*3+2]=spark.z;for(let c=0;c<3;c++)sparkleColors[k*3+c]=tint[c]*alpha*speed*.65;}
  }
  bodies.instanceMatrix.needsUpdate=true;halos.instanceMatrix.needsUpdate=true;instanceStyle.needsUpdate=true;sparkleGeometry.attributes.position.needsUpdate=true;sparkleGeometry.attributes.color.needsUpdate=true;
 }
 function getState(){return{time:lastTime,night:lastNight,preview:lastPreview,visible:root.visible,visibleCount,stats,actors:actors.map(a=>({id:a.id,spot:a.spot.id,label:a.spot.label,visible:a.opacity>.035,alpha:a.opacity,opacity:a.opacity,cycle:a.cycle,phase:a.phase,mint:!!a.mint,position:a.position.toArray(),up:a.spot.up.toArray(),quaternion:a.quaternion.toArray(),size:a.size})),spots:spots.map(s=>({id:s.id,label:s.label,lat:s.lat,lon:s.lon,position:s.position.toArray(),up:s.up.toArray(),minDry:s.minDry,minField:s.minField,maxRipple:s.maxRipple,buildingDistance:s.buildingDistance,lift:s.lift}))};}
 function getPose(aspect=1){
  // Choose once on entry. Even a daytime click anticipates a visitor that will
  // remain present throughout the camera move and the short night transition.
  const time=lastTime||0;let selected=0;
  for(let i=0;i<4;i++){const clock=time/68+i*.25+.18,cycle=Math.floor(clock),phase=clock-cycle,duration=.70+hash(cycle,i+41)*.25;if(phase>.06&&duration-phase>.16){selected=i;break;}}
  const actor=actors[selected],cycle=Math.floor(time/68+selected*.25+.18),zone=zones[selected],spot=zone[Math.floor(hash(cycle,selected+719)*zone.length)];
  const local=spot.position.clone().add(new THREE.Vector3(Math.sin(time*.48+selected)*.014,0,Math.cos(time*.39+selected)*.008).applyQuaternion(spot.quaternion)).normalize();local.multiplyScalar(height(local)).addScaledVector(spot.up,spot.lift+.0015*(1+Math.sin(time*1.9+selected*1.6)));
  root.updateWorldMatrix(true,false);const fit=Math.max(1,.80/Math.max(.25,aspect)),target=local.addScaledVector(spot.up,.17);
  const eye=target.clone().addScaledVector(spot.south,.73*fit).addScaledVector(spot.east,.22*fit).addScaledVector(spot.up,.26*fit);
  return{position:root.localToWorld(eye),target:root.localToWorld(target),up:spot.up.clone().transformDirection(root.matrixWorld),actorId:actor.id,spot:spot.id};
 }
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();bodies.dispose();halos.dispose();for(const g of owned)g.dispose();for(const m of materials)m.dispose();owned.clear();materials.clear();}
 update(0,{night:0});return{root,stats,update,getState,getPose,dispose};
}
