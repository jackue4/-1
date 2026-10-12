// A shallow, unfrozen Jiangnan lake. Depth is sampled from the same shore that
// shapes the island; one small reflection target supplies real roof/branch echoes.
export function createJiangnanWater({THREE,parent,radius=3.206,groundHeight,landField,mobile=false}){
 const baseRadius=radius-.006,geometry=new THREE.SphereGeometry(radius,mobile?128:192,mobile?80:112),positions=geometry.attributes.position,depths=new Float32Array(positions.count);
 for(let i=0;i<positions.count;i++){const y=positions.getY(i)/radius,lat=Math.asin(Math.max(-1,Math.min(1,y))),lon=Math.atan2(positions.getX(i),positions.getZ(i));depths[i]=Math.max(0,radius-baseRadius-groundHeight(lat,lon));}
 geometry.setAttribute('waterDepth',new THREE.BufferAttribute(depths,1));
 const resolution=mobile?256:512,target=new THREE.WebGLRenderTarget(resolution,resolution,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false});target.texture.colorSpace=THREE.LinearSRGBColorSpace;target.texture.generateMipmaps=false;
 const uniforms={uTime:{value:0},uNight:{value:0},uDusk:{value:0},uShallow:{value:new THREE.Color('#8ecfcb')},uDeep:{value:new THREE.Color('#448d9d')},uNightShallow:{value:new THREE.Color('#4e889b')},uNightDeep:{value:new THREE.Color('#264b6a')},uReflection:{value:target.texture},uReflectionMatrix:{value:new THREE.Matrix4()},uReflectionCenter:{value:new THREE.Vector3()},uReflectionNormal:{value:new THREE.Vector3(0,1,0)},uReflectionValid:{value:0},uReflectionPixel:{value:1/resolution}};
 Object.assign(uniforms,{uBoatCenters:{value:Array.from({length:3},()=>new THREE.Vector3())},uBoatForwards:{value:Array.from({length:3},()=>new THREE.Vector3(0,0,1))},uBoatCount:{value:0}});let boats=[];
 const material=new THREE.ShaderMaterial({name:'Jiangnan / translucent jade water',transparent:true,depthWrite:false,uniforms,
  vertexShader:`attribute float waterDepth;varying float vDepth;varying vec3 vPosition;varying vec3 vWorld;varying vec3 vNormal;
   void main(){vDepth=waterDepth;vPosition=position;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader:`uniform float uTime,uNight,uDusk,uReflectionValid,uReflectionPixel,uBoatCount;uniform vec3 uShallow,uDeep,uNightShallow,uNightDeep;uniform sampler2D uReflection;uniform mat4 uReflectionMatrix;uniform vec3 uReflectionCenter,uReflectionNormal,uBoatCenters[3],uBoatForwards[3];varying float vDepth;varying vec3 vPosition,vWorld,vNormal;
   void main(){
    vec3 view=normalize(cameraPosition-vWorld),normal=normalize(vNormal);float facing=clamp(dot(normal,view),0.,1.);
    float shallow=1.-smoothstep(.023,.133,vDepth),fresnel=pow(1.-facing,3.);
    vec3 shallowColor=mix(uShallow,uNightShallow,uNight),deepColor=mix(uDeep,uNightDeep,uNight);
    float broad=.5+.5*sin(vPosition.x*3.6+vPosition.z*2.2)*sin(vPosition.y*3.1-vPosition.z*1.4);
    vec3 water=mix(deepColor,shallowColor,clamp(shallow*.83+broad*.13,0.,1.));
    water=mix(water,vec3(.63,.76,.78),fresnel*(.20-.09*uNight));
    // Restrained narrow brush strokes; the lake never becomes a noisy normal map.
    float waveA=sin(vPosition.x*38.+vPosition.z*17.+sin(vPosition.y*7.)*1.6+uTime*.57);
    float waveB=sin(vPosition.y*31.-vPosition.z*22.+sin(vPosition.x*8.1)*1.4-uTime*.41);
    float strokes=smoothstep(.955,.998,waveA*waveB)*(.022+.026*shallow)*(1.-uNight*.65);
    water+=vec3(.65,.84,.83)*strokes;
    float shore=(1.-smoothstep(.003,.028,vDepth))*smoothstep(.0005,.004,vDepth);
    water=mix(water,mix(vec3(.55,.77,.74),vec3(.21,.4,.45),uNight),shore*.38);
    // A reflected camera sees the actual architecture. Project onto its tangent
    // plane, then fade before the sphere's curvature makes the mapping diverge.
    vec3 planeOffset=vWorld-uReflectionCenter;float planeHeight=dot(planeOffset,uReflectionNormal);
    vec3 onPlane=vWorld-planeHeight*uReflectionNormal;
    vec4 reflected=uReflectionMatrix*vec4(onPlane,1.);vec2 uv=reflected.xy/max(.00001,reflected.w);
    uv+=vec2(waveA,waveB)*(.00065+fresnel*.0010);
    vec2 blur=vec2(uReflectionPixel*1.15,0.);vec4 mirror=texture2D(uReflection,uv)*.5;
    mirror+=(texture2D(uReflection,uv+blur)+texture2D(uReflection,uv-blur))*.25;
    float edge=smoothstep(0.,.04,uv.x)*smoothstep(0.,.04,uv.y)*(1.-smoothstep(.96,1.,uv.x))*(1.-smoothstep(.96,1.,uv.y));
    float tangentDistance=length(onPlane-uReflectionCenter);
    float reflectionMask=uReflectionValid*edge*(1.-smoothstep(.6,1.8,tangentDistance))*step(0.,reflected.w);
    vec3 reflectionColor=mirror.rgb/max(mirror.a,.001);
    reflectionColor=mix(reflectionColor,water,.15);
    float reflectionWeight=reflectionMask*mirror.a*(.43+fresnel*.28);
    water=mix(water,reflectionColor,reflectionWeight);
    vec3 rippleNormal=normalize(normal+vec3(waveA*.021,waveB*.014,(waveA-waveB)*.012));
    vec3 sunlight=normalize(vec3(-5.,8.,5.));float glint=pow(max(dot(reflect(-sunlight,rippleNormal),view),0.),95.);
    water+=mix(vec3(.56,.57,.40),vec3(.35,.40,.48),uNight)*glint*(.22-.09*uNight);
    water+=vec3(.065,.037,.013)*uDusk*(.18+glint);
    float wake=0.;for(int i=0;i<3;i++){if(float(i)>=uBoatCount)continue;vec3 offset=vPosition-uBoatCenters[i],boatUp=normalize(uBoatCenters[i]);offset-=boatUp*dot(offset,boatUp);float behind=-dot(offset,uBoatForwards[i]),lateral=length(offset+uBoatForwards[i]*behind);
     float width=.055+max(0.,behind)*.26,wing=exp(-pow((lateral-width)/.013,2.));float stern=smoothstep(.08,.18,behind)*(1.-smoothstep(.32,.70,behind));
     float side=exp(-pow((lateral-.082)/.014,2.))*(1.-smoothstep(.10,.24,abs(behind)));
     float broken=.62+.38*sin(behind*26.-uTime*2.0+float(i)*2.);wake=max(wake,(wing*stern*.18+side*.09)*broken);
    }
    water=mix(water,mix(vec3(.73,.87,.84),vec3(.29,.48,.57),uNight),wake);
    float alpha=clamp(.38+(1.-shallow)*.13+fresnel*.19+reflectionWeight*.20,.35,.78);
    gl_FragColor=vec4(water,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const mesh=new THREE.Mesh(geometry,material);mesh.name='青玉冬水 / 透水深浅与曲廊倒影';mesh.castShadow=false;mesh.receiveShadow=false;mesh.renderOrder=4;mesh.userData.skipWaterReflection=true;parent.add(mesh);
 mesh.onBeforeRender=()=>{for(let i=0;i<boats.length;i++){const boat=boats[i].g||boats[i];uniforms.uBoatCenters.value[i].copy(boat.position);uniforms.uBoatForwards.value[i].set(0,0,1).applyQuaternion(boat.quaternion).normalize();}};
 const mirrorCamera=new THREE.PerspectiveCamera(),biasMatrix=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),inverseParent=new THREE.Matrix4(),center=new THREE.Vector3(),localEye=new THREE.Vector3(),localDir=new THREE.Vector3(),direction=new THREE.Vector3(),sphere=new THREE.Sphere(new THREE.Vector3(),radius),ray=new THREE.Ray(),hit=new THREE.Vector3(),localAnchor=new THREE.Vector3(),planeNormal=new THREE.Vector3(),planePoint=new THREE.Vector3(),clipPlane=new THREE.Plane(),reflectionPlane=new THREE.Plane(),reflectedEye=new THREE.Vector3(),reflectedTarget=new THREE.Vector3(),lookTarget=new THREE.Vector3(),reflectedUp=new THREE.Vector3(),viewport=new THREE.Vector4(),scissor=new THREE.Vector4(),clearColor=new THREE.Color(),previousPosition=new THREE.Vector3(Infinity,Infinity,Infinity),previousQuaternion=new THREE.Quaternion(),previousParent=new THREE.Matrix4();
 const stats={style:'clear-jade-water',reflectionResolution:resolution,reflectionCaptures:0,depthRange:[Infinity,-Infinity],vertices:positions.count};for(const value of depths){stats.depthRange[0]=Math.min(stats.depthRange[0],value);stats.depthRange[1]=Math.max(stats.depthRange[1],value);}
 let disposed=false,lastTime=-Infinity,lastNight=-1,callCount=0,lastProjection='',lastCaptureState='pending';
 function update(time,env={}){uniforms.uTime.value=time;uniforms.uNight.value=env.night||0;uniforms.uDusk.value=env.dusk||0;}
 function renderReflection(renderer,scene,camera,{preview=false,lowQuality=false,time=uniforms.uTime.value}={}){
  if(disposed)return;if(preview||lowQuality){uniforms.uReflectionValid.value=0;lastCaptureState=preview?'preview-skipped':'quality-skipped';return;}
  camera.updateMatrixWorld();parent.updateWorldMatrix(true,false);callCount++;
  const projection=camera.projectionMatrix.elements.join(','),moved=previousPosition.distanceToSquared(camera.position)>.000006||1-Math.abs(previousQuaternion.dot(camera.quaternion))>.000001||!previousParent.equals(parent.matrixWorld)||lastProjection!==projection;
  const interval=mobile?4:3;if(uniforms.uReflectionValid.value>0&&callCount%interval!==0)return;
  if(!moved&&Math.abs(time-lastTime)<(mobile?.18:.11)&&Math.abs(uniforms.uNight.value-lastNight)<.025)return;
  // Find the water nearest the camera's focal ray, not a fixed world-up plane.
  inverseParent.copy(parent.matrixWorld).invert();localEye.copy(camera.position).applyMatrix4(inverseParent);camera.getWorldDirection(direction);localDir.copy(direction).transformDirection(inverseParent);ray.set(localEye,localDir);
  if(!ray.intersectSphere(sphere,hit)){hit.copy(localEye).normalize().multiplyScalar(radius);}
  const focusLat=Math.asin(THREE.MathUtils.clamp(hit.y/radius,-1,1)),focusLon=Math.atan2(hit.x,hit.z);let selectedLat=focusLat,selectedLon=focusLon,best=Infinity;
  if(landField&&landField(focusLat,focusLon)>-.016){for(let ring=1;ring<=5;ring++)for(let i=0;i<16;i++){const angle=i/16*Math.PI*2,lat=THREE.MathUtils.clamp(focusLat+Math.sin(angle)*ring*.035,-1.5,1.5),lon=focusLon+Math.cos(angle)*ring*.045;if(landField(lat,lon)>-.01)continue;const score=(lat-focusLat)**2+(lon-focusLon)**2*Math.cos(lat)**2;if(score<best){best=score;selectedLat=lat;selectedLon=lon;}}}
  localAnchor.set(Math.cos(selectedLat)*Math.sin(selectedLon),Math.sin(selectedLat),Math.cos(selectedLat)*Math.cos(selectedLon));planeNormal.copy(localAnchor).transformDirection(parent.matrixWorld);planePoint.copy(localAnchor).multiplyScalar(radius).applyMatrix4(parent.matrixWorld);parent.getWorldPosition(center);
  reflectionPlane.setFromNormalAndCoplanarPoint(planeNormal,planePoint);clipPlane.copy(reflectionPlane);clipPlane.constant+=.022;
  reflectedEye.copy(camera.position).addScaledVector(planeNormal,-2*reflectionPlane.distanceToPoint(camera.position));lookTarget.copy(camera.position).add(direction);reflectedTarget.copy(lookTarget).addScaledVector(planeNormal,-2*reflectionPlane.distanceToPoint(lookTarget));reflectedUp.copy(camera.up).reflect(planeNormal);
  mirrorCamera.copy(camera,false);mirrorCamera.position.copy(reflectedEye);mirrorCamera.up.copy(reflectedUp);mirrorCamera.lookAt(reflectedTarget);mirrorCamera.updateMatrixWorld();mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);mirrorCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  uniforms.uReflectionMatrix.value.copy(biasMatrix).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);uniforms.uReflectionCenter.value.copy(planePoint);uniforms.uReflectionNormal.value.copy(planeNormal);
  const priorTarget=renderer.getRenderTarget(),priorClipping=renderer.clippingPlanes,priorAutoClear=renderer.autoClear,priorBackground=scene.background,priorAlpha=renderer.getClearAlpha(),priorShadowAuto=renderer.shadowMap.autoUpdate,priorShadowNeeds=renderer.shadowMap.needsUpdate,priorXR=renderer.xr.enabled,priorScissorTest=renderer.getScissorTest(),hidden=[];renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(clearColor);
  scene.traverse(o=>{if(o.visible&&(o===mesh||o.isPoints||o.userData.skipWaterReflection)){hidden.push(o);o.visible=false;}});
  try{scene.background=null;renderer.clippingPlanes=[clipPlane];renderer.autoClear=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;renderer.xr.enabled=false;renderer.setRenderTarget(target);renderer.setViewport(0,0,resolution,resolution);renderer.setScissorTest(false);renderer.setClearColor(0x000000,0);renderer.clear(true,true,true);renderer.render(scene,mirrorCamera);uniforms.uReflectionValid.value=1;stats.reflectionCaptures++;lastCaptureState='captured';lastTime=time;lastNight=uniforms.uNight.value;previousPosition.copy(camera.position);previousQuaternion.copy(camera.quaternion);previousParent.copy(parent.matrixWorld);lastProjection=projection;
  }finally{hidden.forEach(o=>o.visible=true);scene.background=priorBackground;renderer.clippingPlanes=priorClipping;renderer.autoClear=priorAutoClear;renderer.shadowMap.autoUpdate=priorShadowAuto;renderer.shadowMap.needsUpdate=priorShadowNeeds;renderer.xr.enabled=priorXR;renderer.setRenderTarget(priorTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(priorScissorTest);renderer.setClearColor(clearColor,priorAlpha);}
 }
 return{mesh,update,renderReflection,stats,setBoats(values){boats=values.slice(0,3);uniforms.uBoatCount.value=boats.length;},getState:()=>({...stats,depthRange:[...stats.depthRange],boats:boats.length,time:uniforms.uTime.value,night:uniforms.uNight.value,reflectionActive:uniforms.uReflectionValid.value>0,reflectionState:lastCaptureState}),dispose(){if(disposed)return;disposed=true;parent.remove(mesh);geometry.dispose();material.dispose();target.dispose();}};
}
