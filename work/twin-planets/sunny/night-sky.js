import * as THREE from 'three';
import {random} from './ecology.js';

export function createNightSky(seed=73417){
  const rng=random(seed),root=new THREE.Group(),positions=[],sizes=[],phases=[],colors=[],strengths=[];
  const palette=['#fff1c6','#d9e7ff','#ffd9bd','#eef1ff'];
  for(let i=0;i<1100;i++){
    const a=rng()*Math.PI*2,y=i<820?rng()*2-1:(rng()+rng()+rng()-1.5)*.22,n=new THREE.Vector3(Math.cos(a)*Math.sqrt(1-y*y),y,Math.sin(a)*Math.sqrt(1-y*y));
    if(i>=820)n.applyAxisAngle(new THREE.Vector3(0,0,1),.65);
    positions.push(...n.multiplyScalar(28).toArray());sizes.push(i%37===0?4.4:1.1+rng()*1.65);phases.push(rng()*Math.PI*2);strengths.push(i>=820?.28:.52+rng()*.48);colors.push(...new THREE.Color(palette[i%4]).toArray());
  }
  const geometry=new THREE.BufferGeometry();for(const [name,array,size] of [['position',positions,3],['aSize',sizes,1],['aPhase',phases,1],['aStrength',strengths,1],['color',colors,3]])geometry.setAttribute(name,new THREE.Float32BufferAttribute(array,size));
  const starMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uVisibility:{value:0},uPixelRatio:{value:1}},vertexShader:`attribute float aSize;attribute float aPhase;attribute float aStrength;attribute vec3 color;uniform float uTime;uniform float uPixelRatio;varying vec3 vTint;varying float vGlow;varying float vLarge;void main(){vTint=color;vGlow=aStrength*(.76+.24*sin(uTime*(.38+aPhase*.025)+aPhase));vLarge=step(3.,aSize);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uPixelRatio;}`,fragmentShader:`uniform float uVisibility;varying vec3 vTint;varying float vGlow;varying float vLarge;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;float core=1.-smoothstep(.12,1.,r);float rays=(exp(-abs(p.x)*38.)+exp(-abs(p.y)*38.))*max(0.,1.-r)*.24*vLarge;float alpha=(core*core+rays)*vGlow*uVisibility;if(alpha<.005)discard;gl_FragColor=vec4(vTint,alpha);}`,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false});
  const stars=new THREE.Points(geometry,starMaterial);stars.name='Twinkling painted stars';stars.frustumCulled=false;root.add(stars);
  const segments=28,trailPos=new Float32Array((segments+1)*6),trailUv=[],trailIndex=[];
  for(let i=0;i<=segments;i++){trailUv.push(i/segments,0,i/segments,1);if(i<segments){const j=i*2;trailIndex.push(j,j+1,j+2,j+1,j+3,j+2);}}
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(trailPos,3).setUsage(THREE.DynamicDrawUsage));trailGeo.setAttribute('uv',new THREE.Float32BufferAttribute(trailUv,2));trailGeo.setIndex(trailIndex);
  const trailMat=new THREE.ShaderMaterial({uniforms:{uOpacity:{value:0}},vertexShader:'varying vec2 vTrail;void main(){vTrail=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vTrail;uniform float uOpacity;void main(){float edge=pow(max(0.,1.-abs(vTrail.y*2.-1.)),1.6);float fade=pow(1.-vTrail.x,1.6);vec3 tint=mix(vec3(1.,.94,.75),vec3(.61,.76,1.),vTrail.x);gl_FragColor=vec4(tint,edge*fade*uOpacity);}',transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
  const meteor=new THREE.Mesh(trailGeo,trailMat);meteor.name='Occasional shooting star';meteor.frustumCulled=false;meteor.visible=false;root.add(meteor);
  const start=new THREE.Vector3(),travel=new THREE.Vector3(),side=new THREE.Vector3(),head=new THREE.Vector3(),p=new THREE.Vector3();
  let darkTime=0,nextMeteor=9+rng()*8,age=0,duration=1.5,active=false,emitted=0,visibility=0;
  function update(dt,time,env,camera,pixelRatio=1){
    root.position.copy(camera.position);starMaterial.uniforms.uTime.value=time;starMaterial.uniforms.uPixelRatio.value=pixelRatio;
    visibility=THREE.MathUtils.smoothstep(env.night,.35,.94)*(1-(env.cloud||0)*.52)*(1-(env.rain||0)*.90)*(1-(env.snow||0)*.85);
    starMaterial.uniforms.uVisibility.value=visibility;stars.visible=visibility>.005;
    const clearNight=env.night>.72&&(env.rain||0)<.25&&(env.snow||0)<.25&&(env.cloud||0)<.82;
    if(clearNight){darkTime+=dt;if(!active&&darkTime>=nextMeteor){
      active=true;age=0;duration=1.25+rng()*.65;emitted++;
      // A camera-relative upper-sky arc stays visible in globe and garden views.
      const distance=24,halfHeight=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*distance,halfWidth=halfHeight*camera.aspect;
      start.set((- .65+rng()*.45)*halfWidth,(.42+rng()*.40)*halfHeight,-distance).applyQuaternion(camera.quaternion);
      travel.set((.52+rng()*.26)*halfWidth,-(.26+rng()*.20)*halfHeight,0).applyQuaternion(camera.quaternion);
      const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);side.copy(right).multiplyScalar(-travel.dot(up)).addScaledVector(up,travel.dot(right)).normalize();
    }}else if(env.night<.3){darkTime=0;nextMeteor=9+rng()*8;active=false;}
    if(active){age+=dt;const progress=age/duration;if(progress>=1){active=false;nextMeteor=darkTime+22+rng()*31;}else{
      head.copy(start).addScaledVector(travel,progress);const length=Math.min(1,progress*5);
      for(let i=0;i<=segments;i++){const u=i/segments,width=.025*(1-u)+.003;p.copy(head).addScaledVector(travel,-u*.36*length);for(let edge=0;edge<2;edge++){const v=p.clone().addScaledVector(side,width*(edge?1:-1));trailPos.set(v.toArray(),(i*2+edge)*3);}}
      trailGeo.attributes.position.needsUpdate=true;trailMat.uniforms.uOpacity.value=Math.min(1,age/.16,(duration-age)/.28)*visibility;
    }}meteor.visible=active&&visibility>.01;
  }
  return{root,stars,meteor,update,getState:()=>({stars:1100,visibility,meteorActive:meteor.visible,meteorsSeen:emitted,nextMeteorIn:Math.max(0,nextMeteor-darkTime)}),dispose(){geometry.dispose();starMaterial.dispose();trailGeo.dispose();trailMat.dispose();}};
}
