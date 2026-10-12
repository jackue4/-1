import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createSurface,createLand,direction} from './surface.js';
import {createOcean} from './ocean.js';
import {createTown} from './town.js';
import {createRailway} from './railway.js';
import {createPetalRain} from './petals.js';
import {createMarine} from './marine.js';
import {createVoyage} from './voyage.js';

export function mountCoast(document){
const $=id=>document.getElementById(id);
function boot(){
 const host=$('scene'),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','海洋星球，拖动旋转，滚轮缩放');
 const scene=new THREE.Scene(),planet=new THREE.Group();planet.name='Kamakura coastal world';scene.add(planet);
 const camera=new THREE.PerspectiveCamera(37,1,.08,70);
 function makeControls(){const c=new OrbitControls(camera,renderer.domElement);c.enableDamping=true;c.dampingFactor=.055;c.enablePan=false;c.rotateSpeed=.45;c.zoomSpeed=.7;c.minDistance=6.6;c.maxDistance=17;return c;}
 let controls=makeControls();
 const rampData=new Uint8Array(128);for(let i=0;i<32;i++){const x=i/31,v=.30+.32*THREE.MathUtils.smoothstep(x,.10,.35)+.25*THREE.MathUtils.smoothstep(x,.46,.70)+.13*THREE.MathUtils.smoothstep(x,.8,.99);rampData.set([v*255,v*255,v*255,255],i*4);}
 const ramp=new THREE.DataTexture(rampData,32,1);ramp.needsUpdate=true;ramp.minFilter=ramp.magFilter=THREE.LinearFilter;
 const palette={ramp,cream:'#f4e5cf',wood:'#85715c',red:'#ac5653',blue:'#536d82'};
 const surface=createSurface(),land=createLand(planet,palette),ocean=createOcean({planet,surface}),town=createTown({planet,surface,palette}),railway=createRailway({planet,surface,palette}),marine=createMarine({planet,surface,palette});
 const petals=createPetalRain({planet,surface,palette,sources:town.root.userData.blossomSources||[]}),voyage=createVoyage({planet,surface,palette});
 const hemi=new THREE.HemisphereLight('#d6e9e1','#828f64',1.05),sun=new THREE.DirectionalLight('#fff0bd',2.4),fill=new THREE.DirectionalLight('#b4d4e5',.38);
 sun.position.set(-4,7,6);sun.castShadow=true;const shadowSize=innerWidth<760?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(sun.shadow.camera,{left:-4.8,right:4.8,top:4.8,bottom:-4.8,near:.5,far:24});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.008;sun.shadow.bias=-.00012;fill.position.set(4,1,-4);scene.add(hemi,sun,fill);
 scene.fog=new THREE.FogExp2('#cfe2d9',.009);
 const rimMat=new THREE.ShaderMaterial({uniforms:{uTint:{value:new THREE.Color('#b1dedd')}},vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vN;varying vec3 vV;uniform vec3 uTint;void main(){float a=pow(1.-abs(dot(normalize(vN),normalize(vV))),4.)*.16;gl_FragColor=vec4(uTint,a);}',transparent:true,depthWrite:false,side:THREE.BackSide});
 const rim=new THREE.Mesh(new THREE.SphereGeometry(surface.R+.024,80,48),rimMat);planet.add(rim);
 let mode='coast',phase='day',last=0,time=0,paused=false,quality=false,travelSpeed=1,running=!document.hidden,raf=0,toastTimer,disposed=false;
 const env={daylight:1,night:0,dusk:0},targetEnv={...env};
 function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3600);}
 function setPhase(value){phase=value;Object.assign(targetEnv,value==='night'?{daylight:.08,night:1,dusk:0}:value==='dusk'?{daylight:.78,night:.12,dusk:1}:{daylight:1,night:0,dusk:0});document.documentElement.dataset.phase=value;document.querySelectorAll('[data-phase-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.phaseButton===value)));}
 const mainView=direction(.30,.03),cameraHome=new THREE.Vector3();
 function setView(value){
  mode=value;controls.enableDamping=false;controls.update();controls.enableDamping=true;controls.enabled=value!=='train';controls.autoRotate=false;
  document.documentElement.dataset.view=value;document.querySelectorAll('[data-view-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewButton===value)));
  if(value==='globe'){controls.target.set(0,0,0);camera.up.set(0,1,0);cameraHome.copy(mainView).multiplyScalar(innerWidth<760?13.3:15.2);camera.position.copy(cameraHome);controls.minDistance=7;controls.maxDistance=18;}
  if(value==='coast'){const n=direction(-.06,-.25),p=n.clone().multiplyScalar(surface.R+.02),east=new THREE.Vector3(Math.cos(-.25),0,-Math.sin(-.25)),south=new THREE.Vector3().crossVectors(east,n).normalize();controls.target.copy(p);camera.up.copy(n);camera.position.copy(p).addScaledVector(n,4.5).addScaledVector(east,1.45).addScaledVector(south,1.9);controls.minDistance=2.3;controls.maxDistance=12;}
  if(value==='sea'){const n=direction(-.28,-.32),p=n.clone().multiplyScalar(surface.R-.10),east=new THREE.Vector3(Math.cos(-.32),0,-Math.sin(-.32)),south=new THREE.Vector3().crossVectors(east,n).normalize();controls.target.copy(p);camera.up.copy(n);camera.position.copy(p).addScaledVector(n,1.60).addScaledVector(east,.45).addScaledVector(south,1.05);controls.minDistance=.9;controls.maxDistance=7;}
  if(value==='voyage'){const n=direction(-.36,-.24),p=n.clone().multiplyScalar(surface.R),east=new THREE.Vector3(Math.cos(-.24),0,-Math.sin(-.24)),south=new THREE.Vector3().crossVectors(east,n).normalize();controls.target.copy(p);camera.up.copy(n);camera.position.copy(p).addScaledVector(n,3.6).addScaledVector(east,.7).addScaledVector(south,1.1);controls.minDistance=1.2;controls.maxDistance=10;}
  if(value==='town'){const lat=surface.trackLat(-.2),n=direction(lat,-.2),p=direction(lat-.12,-.2).multiplyScalar(surface.R+.015),eye=direction(lat+.20,-.20);controls.target.copy(p);camera.up.copy(n);camera.position.copy(eye).multiplyScalar(surface.height(eye)+1.6);controls.minDistance=.35;controls.maxDistance=8;}
  if(value==='train'){controls.minDistance=.5;controls.maxDistance=9;followTrain(true);}
  const target=controls.target.clone(),min=controls.minDistance,max=controls.maxDistance;controls.dispose();controls=makeControls();controls.target.copy(target);controls.minDistance=min;controls.maxDistance=max;controls.enabled=value!=='train';controls.update();resize();
 }
 const look=new THREE.Vector3(),desired=new THREE.Vector3(),trainUp=new THREE.Vector3(),side=new THREE.Vector3();
 function followTrain(snap=false,dt=.016){
  railway.train.getWorldPosition(look);trainUp.copy(look).normalize();
  const state=railway.getState(),s=railway.sample(state.progress??state.t??0),tangent=s.tangent.clone().normalize();
  side.crossVectors(trainUp,tangent).normalize();desired.copy(look).addScaledVector(trainUp,.65).addScaledVector(tangent,-1.0).addScaledVector(side,.75);look.addScaledVector(trainUp,.055);
  camera.position.lerp(desired,snap?1:1-Math.exp(-dt*4));controls.target.lerp(look,snap?1:1-Math.exp(-dt*5));camera.up.lerp(trainUp,snap?1:1-Math.exp(-dt*3)).normalize();camera.lookAt(controls.target);
 }
 function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;camera.aspect=r.width/r.height;const base=mode==='globe'?37:mode==='town'?55:mode==='coast'?43:48;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(base)/2)/Math.min(1,Math.max(.44,camera.aspect))));camera.clearViewOffset();if(r.width<760&&r.height>r.width&&mode==='coast')camera.setViewOffset(r.width,r.height,0,r.height*.07,r.width,r.height);camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);}
 const observer=new ResizeObserver(resize);observer.observe(host);
 document.querySelectorAll('[data-view-button]').forEach(b=>b.onclick=()=>{setView(b.dataset.viewButton);if(mode==='train')toast('陪电车越过一片海，把时间交给海风。');});
 document.querySelectorAll('[data-phase-button]').forEach(b=>b.onclick=()=>setPhase(b.dataset.phaseButton));
 $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▷ 继续旅程':'Ⅱ 暂停片刻';$('pause').setAttribute('aria-pressed',String(paused));};
 $('speed').onclick=()=>{travelSpeed=travelSpeed===1?2:1;$('speed').textContent=travelSpeed===1?'1× 慢慢走':'2× 追风';};
 $('quality').onclick=()=>{quality=!quality;renderer.setPixelRatio(quality?1:Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=!quality;scene.traverse(o=>{if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.needsUpdate=true;}});petals.setLowQuality(quality);marine.setLowQuality?.(quality);$('quality').textContent=quality?'画质 · 轻盈':'画质 · 细腻';$('quality').setAttribute('aria-pressed',String(quality));resize();};
 $('home').onclick=e=>{e.preventDefault();setView('coast');};$('about').onclick=()=>$('help').showModal();
 document.addEventListener('visibilitychange',()=>{running=!document.hidden;last=0;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;toast('画面正在休息，请刷新后继续旅程。');});
 setView('coast');setPhase('day');let lastUi=-1;
 function frame(now){
  if(disposed)return;raf=requestAnimationFrame(frame);if(!running){last=0;return;}const dt=last?Math.min((now-last)/1000,.045):0;last=now;
  for(const k of Object.keys(env))env[k]=THREE.MathUtils.damp(env[k],targetEnv[k],1.25,dt);
  if(!paused)time+=dt;railway.update(paused?0:dt*travelSpeed,time,{...env,paused});town.update(time,env);land.update(time);marine.update(paused?0:dt,time,env);ocean.update(time,env,sun.position);petals.update(paused?0:dt,time,env);voyage.update(paused?0:dt,time,env);
  sun.intensity=2.05*env.daylight+.30;hemi.intensity=.48+.46*env.daylight;sun.color.set('#fff1ca').lerp(new THREE.Color('#ffbc97'),env.dusk*.7).lerp(new THREE.Color('#a4bad7'),env.night*.72);sun.position.set(-4-env.dusk*2,7-env.dusk*3.5,6);
  hemi.color.set('#d7eafa').lerp(new THREE.Color('#b7a9d5'),env.night);renderer.toneMappingExposure=1.06+env.night*.08;
  scene.fog.color.set('#d9e9e9').lerp(new THREE.Color('#ecd1c4'),env.dusk).lerp(new THREE.Color('#343f63'),env.night);
  if(mode==='train')followTrain(false,dt);else controls.update();renderer.render(scene,camera);
  if(Math.floor(time)!==lastUi){lastUi=Math.floor(time);const s=railway.getState(),p=petals.getState();$('train-status').textContent=s.atStation?'镰仓高校前 · 稍作停留':s.crossing?.active?'道口铃响 · 江之电经过':'江之电 · 沿着湘南海岸';$('floating-count').textContent=p.floating;$('air-count').textContent=p.airborne;}
  if(!$('loading').hidden){$('loading').hidden=true;document.documentElement.dataset.ready='true';}
 }
 window.umiWorld={getState:()=>({world:'kamakura-romantic-voyage-v3',mode,phase,paused,quality,running,time,train:railway.getState(),petals:petals.getState(),town:town.stats,marine:marine.getState?.()||marine.stats,voyage:voyage.getState?.()||voyage.stats,ocean:ocean.stats,railway:railway.stats,render:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},camera:camera.position.toArray()}),getScene:()=>scene};
 raf=requestAnimationFrame(frame);addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);clearTimeout(toastTimer);observer.disconnect();controls.dispose();},{once:true});
}
return boot();
}



