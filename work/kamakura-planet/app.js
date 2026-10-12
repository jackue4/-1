import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createSurface,createLand,direction} from './surface.js';
import {createOcean} from './ocean.js';
import {createTown} from './town.js';
import {createRailway} from './railway.js';
import {createPetalRain} from './petals.js';
import {createMarine} from './marine.js';
import {createVoyage} from './voyage.js';
import {createCruises} from './cruises.js';
import {createBeacons} from './beacons.js';
import {createMarineDetails} from './marine-details.js';
import {createLandmarks} from './landmarks.js';
import {createAnimeRenderer} from './anime-render.js';
import {createHarborProps} from './harbor-props.js';
import {createIslandGardens} from './island-gardens.js';
import {createIslandStream} from './island-stream.js';
import {createCoastalNature} from './coastal-nature.js';
import {createShoreLife} from './shore-life.js';
import {createIslandTrails} from './island-trails.js';
import {coastCameraPose,setCameraViewport} from './camera-layout.js';
import {createStorybookSky} from '../twin-planets/storybook-sky.js';

export function mountCoast(document,{preview=false}={}){
const $=id=>document.getElementById(id);
function boot(){
 const host=$('scene'),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','海洋星球，拖动旋转，滚轮缩放');
 const scene=new THREE.Scene(),planet=new THREE.Group();planet.name='Kamakura coastal world';scene.add(planet);
 const camera=new THREE.PerspectiveCamera(37,1,.08,70),anime=createAnimeRenderer(renderer,camera);
 function makeControls(){const c=new OrbitControls(camera,renderer.domElement);c.enableDamping=true;c.dampingFactor=.055;c.enablePan=false;c.rotateSpeed=.45;c.zoomSpeed=.7;c.minDistance=6.6;c.maxDistance=17;return c;}
 let controls=makeControls();
 const rampData=new Uint8Array(16);for(let i=0;i<4;i++){const v=[.39,.59,.80,1][i];rampData.set([v*255,v*255,v*255,255],i*4);}
 const ramp=new THREE.DataTexture(rampData,4,1);ramp.needsUpdate=true;ramp.minFilter=ramp.magFilter=THREE.NearestFilter;
 const palette={ramp,cream:'#f4e5cf',wood:'#85715c',red:'#ac5653',blue:'#536d82'};
 const surface=createSurface(),land=createLand(planet,palette),ocean=createOcean({planet,surface}),town=createTown({planet,surface,palette}),railway=createRailway({planet,surface,palette}),marine=createMarine({planet,surface,palette});
 const petals=createPetalRain({planet,surface,palette,sources:town.root.userData.blossomSources||[]}),voyage=createVoyage({planet,surface,palette}),cruises=createCruises({planet,surface,palette}),beacons=createBeacons({planet,surface,palette}),marineDetails=createMarineDetails({planet,surface,palette}),landmarks=createLandmarks({planet,surface,palette,town});
 const harbor=createHarborProps({planet,surface,palette});
 const gardens=createIslandGardens({planet,surface,palette,town,landmarks});
 const stream=createIslandStream({planet,surface,palette}),nature=createCoastalNature({planet,surface,palette,town,landmarks,gardens});
 const shoreLife=createShoreLife({planet,surface,palette,town,landmarks});
 const trails=createIslandTrails({planet,surface,palette,town,landmarks,beacons});
 const hemi=new THREE.HemisphereLight('#d6e9e1','#828f64',1.05),sun=new THREE.DirectionalLight('#fff0bd',2.4),fill=new THREE.DirectionalLight('#b4d4e5',.38);
 sun.position.set(-4,7,6);sun.castShadow=true;const shadowSize=innerWidth<760?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(sun.shadow.camera,{left:-4.8,right:4.8,top:4.8,bottom:-4.8,near:.5,far:24});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.008;sun.shadow.bias=-.00012;fill.position.set(4,1,-4);scene.add(hemi,sun,fill);
 scene.fog=new THREE.FogExp2('#cfe2d9',.009);
 const rimMat=new THREE.ShaderMaterial({uniforms:{uTint:{value:new THREE.Color('#b1dedd')}},vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vN;varying vec3 vV;uniform vec3 uTint;void main(){float a=pow(1.-abs(dot(normalize(vN),normalize(vV))),4.)*.16;gl_FragColor=vec4(uTint,a);}',transparent:true,depthWrite:false,side:THREE.BackSide});
 const rim=new THREE.Mesh(new THREE.SphereGeometry(surface.R+.024,80,48),rimMat);planet.add(rim);
 let mode='coast',phase='day',last=0,time=0,paused=false,quality=false,travelSpeed=1,running=!document.hidden,raf=0,toastTimer,disposed=false;
 let previewing=false,previewState=null,previewTime=0;
 const env={daylight:1,night:0,dusk:0},targetEnv={...env};
 const fairySky=createStorybookSky({container:$('app'),variant:'night',seed:90518});fairySky.setActive(running);
 const skyEnv={...env,preview:false},sunDay=new THREE.Color('#ffe5b2'),sunDusk=new THREE.Color('#ffb89d'),sunNight=new THREE.Color('#a4d2f4'),hemiDay=new THREE.Color('#b9dcd7'),hemiDusk=new THREE.Color('#d4c4e7'),hemiNight=new THREE.Color('#7eaccb'),groundDay=new THREE.Color('#738f83'),groundDusk=new THREE.Color('#948197'),groundNight=new THREE.Color('#35586d'),fillDay=new THREE.Color('#b4d4e5'),fillDusk=new THREE.Color('#bfb4e8'),fillNight=new THREE.Color('#87c1d2'),fogDay=new THREE.Color('#d9e9e9'),fogDusk=new THREE.Color('#e9c2d0'),fogNight=new THREE.Color('#263e65');
 let skyCssNight=-1,skyCssAtmosphere=-1;
 function updateSky(dt){Object.assign(skyEnv,env);skyEnv.preview=previewing;fairySky.update(dt,skyEnv);const night=previewing?0:env.night,atmosphere=previewing?0:Math.max(env.night,env.dusk);if(night!==skyCssNight){skyCssNight=night;$('app').style.setProperty('--storybook-night',String(night));}if(atmosphere!==skyCssAtmosphere){skyCssAtmosphere=atmosphere;$('app').style.setProperty('--storybook-atmosphere',String(atmosphere));}}
 function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3600);}
 function setPhase(value){phase=value;Object.assign(targetEnv,value==='night'?{daylight:.08,night:1,dusk:0}:value==='dusk'?{daylight:.78,night:.12,dusk:1}:{daylight:1,night:0,dusk:0});document.documentElement.dataset.phase=value;document.querySelectorAll('[data-phase-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.phaseButton===value)));}
 const mainView=direction(.30,.03),cameraHome=new THREE.Vector3();
 function setView(value){
  mode=value;controls.enableDamping=false;controls.update();controls.enableDamping=true;controls.enabled=value!=='train'&&value!=='cruise';controls.autoRotate=false;
  document.documentElement.dataset.view=value;document.querySelectorAll('[data-view-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewButton===value)));
  if(value==='globe'){controls.target.set(0,0,0);camera.up.set(0,1,0);cameraHome.copy(mainView).multiplyScalar(innerWidth<760?13.3:15.2);camera.position.copy(cameraHome);controls.minDistance=7;controls.maxDistance=18;}
  if(value==='coast'){const pose=coastCameraPose(surface);controls.target.copy(pose.target);camera.up.copy(pose.up);camera.position.copy(pose.position);controls.minDistance=2.3;controls.maxDistance=12;}
  if(value==='sea'){const n=direction(-.28,-.32),p=n.clone().multiplyScalar(surface.R-.10),east=new THREE.Vector3(Math.cos(-.32),0,-Math.sin(-.32)),south=new THREE.Vector3().crossVectors(east,n).normalize();controls.target.copy(p);camera.up.copy(n);camera.position.copy(p).addScaledVector(n,1.60).addScaledVector(east,.45).addScaledVector(south,1.05);controls.minDistance=.9;controls.maxDistance=7;}
  if(value==='voyage'){const n=direction(-.36,-.24),p=n.clone().multiplyScalar(surface.R),east=new THREE.Vector3(Math.cos(-.24),0,-Math.sin(-.24)),south=new THREE.Vector3().crossVectors(east,n).normalize();controls.target.copy(p);camera.up.copy(n);camera.position.copy(p).addScaledVector(n,3.6).addScaledVector(east,.7).addScaledVector(south,1.1);controls.minDistance=1.2;controls.maxDistance=10;}
  if(value==='cottage'){const n=direction(.30,-1.13),p=n.clone().multiplyScalar(surface.height(n)+.13),east=new THREE.Vector3(Math.cos(-1.13),0,-Math.sin(-1.13)),south=new THREE.Vector3().crossVectors(east,n).normalize();controls.target.copy(p);camera.up.copy(n);camera.position.copy(p).addScaledVector(n,.80).addScaledVector(east,.58).addScaledVector(south,1.12);controls.minDistance=.55;controls.maxDistance=6;}
  if(['stream','beacon','telephone'].includes(value)){const spec=value==='stream'?[.38,-.20,1.05,.59,1.42]:value==='beacon'?[.52,-1.20,.72,-.36,1.12]:[.17413,-.99709,.47,-.42,.84],n=direction(spec[0],spec[1]),p=n.clone().multiplyScalar(surface.baseHeight(n)+(value==='stream'?.015:.10)),east=new THREE.Vector3(Math.cos(spec[1]),0,-Math.sin(spec[1])),south=new THREE.Vector3().crossVectors(east,n).normalize();controls.target.copy(p);camera.up.copy(n);camera.position.copy(p).addScaledVector(n,spec[2]).addScaledVector(east,spec[3]).addScaledVector(south,spec[4]);controls.minDistance=.42;controls.maxDistance=7;}
  if(value==='town'){const lat=surface.trackLat(-.2),n=direction(lat,-.2),p=direction(lat-.12,-.2).multiplyScalar(surface.R+.015),eye=direction(lat+.20,-.20);controls.target.copy(p);camera.up.copy(n);camera.position.copy(eye).multiplyScalar(surface.height(eye)+1.6);controls.minDistance=.35;controls.maxDistance=8;}
  if(value==='train'){controls.minDistance=.5;controls.maxDistance=9;followTrain(true);}
  if(value==='cruise'){controls.minDistance=.5;controls.maxDistance=9;followCruise(true);}
  const target=controls.target.clone(),min=controls.minDistance,max=controls.maxDistance;controls.dispose();controls=makeControls();controls.target.copy(target);controls.minDistance=min;controls.maxDistance=max;controls.enabled=value!=='train'&&value!=='cruise';controls.update();resize();
 }
 const look=new THREE.Vector3(),desired=new THREE.Vector3(),trainUp=new THREE.Vector3(),side=new THREE.Vector3();
 function followTrain(snap=false,dt=.016){
  railway.train.getWorldPosition(look);trainUp.copy(look).normalize();
  const state=railway.getState(),s=railway.sample(state.progress??state.t??0),tangent=s.tangent.clone().normalize();
  side.crossVectors(trainUp,tangent).normalize();desired.copy(look).addScaledVector(trainUp,.65).addScaledVector(tangent,-1.0).addScaledVector(side,.75);look.addScaledVector(trainUp,.055);
  camera.position.lerp(desired,snap?1:1-Math.exp(-dt*4));controls.target.lerp(look,snap?1:1-Math.exp(-dt*5));camera.up.lerp(trainUp,snap?1:1-Math.exp(-dt*3)).normalize();camera.lookAt(controls.target);
 }
 function followCruise(snap=false,dt=.016){const q=cruises.sample(0,time),look=q.n.clone().multiplyScalar(surface.R+.07),desired=look.clone().addScaledVector(q.n,.85).addScaledVector(q.tangent,-1.0).addScaledVector(q.side,.9);camera.position.lerp(desired,snap?1:1-Math.exp(-dt*4));controls.target.lerp(look,snap?1:1-Math.exp(-dt*5));camera.up.lerp(q.n,snap?1:1-Math.exp(-dt*4)).normalize();camera.lookAt(controls.target);}
 function resize(){const r=host.getBoundingClientRect();if(!setCameraViewport(camera,mode,r.width,r.height))return;renderer.setSize(r.width,r.height,false);}
 function setPreview(value){
  value=!!value;if(disposed||value===previewing)return;
  if(value){
   previewState={mode,phase,env:{...env},targetEnv:{...targetEnv},position:camera.position.clone(),up:camera.up.clone(),target:controls.target.clone(),rotation:planet.quaternion.clone(),enabled:controls.enabled,autoRotate:controls.autoRotate,autoRotateSpeed:controls.autoRotateSpeed,min:controls.minDistance,max:controls.maxDistance};
   previewing=true;previewTime=time;setView('globe');setPhase('day');Object.assign(env,targetEnv);
   // A fixed, full-globe composition independent of the game's current orbit.
   camera.position.copy(direction(.39,-.36)).multiplyScalar(14.6);camera.up.set(0,1,0);controls.target.set(0,0,0);controls.enabled=false;controls.update();
  }else{
   const saved=previewState;previewing=false;setView(saved.mode);setPhase(saved.phase);Object.assign(env,saved.env);Object.assign(targetEnv,saved.targetEnv);
   planet.quaternion.copy(saved.rotation);camera.position.copy(saved.position);camera.up.copy(saved.up);controls.target.copy(saved.target);controls.minDistance=saved.min;controls.maxDistance=saved.max;controls.enabled=saved.enabled;controls.autoRotate=saved.autoRotate;controls.autoRotateSpeed=saved.autoRotateSpeed;controls.update();previewState=null;
  }
  updateSky(0);fairySky.setActive(running&&!previewing);
  document.documentElement.dataset.preview=String(previewing);last=0;resize();
 }
 const observer=new ResizeObserver(resize);observer.observe(host);
 document.querySelectorAll('[data-view-button]').forEach(b=>b.onclick=()=>{setView(b.dataset.viewButton);const menu=b.closest('details');if(menu)menu.open=false;if(mode==='train')toast('陪电车越过一片海，把时间交给海风。');});
 document.querySelectorAll('[data-phase-button]').forEach(b=>b.onclick=()=>setPhase(b.dataset.phaseButton));
 $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▷ 继续旅程':'Ⅱ 暂停片刻';$('pause').setAttribute('aria-pressed',String(paused));};
 $('speed').onclick=()=>{travelSpeed=travelSpeed===1?2:1;$('speed').textContent=travelSpeed===1?'1× 慢慢走':'2× 追风';};
 $('quality').onclick=()=>{quality=!quality;renderer.setPixelRatio(quality?1:Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=!quality;scene.traverse(o=>{if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.needsUpdate=true;}});petals.setLowQuality(quality);marine.setLowQuality?.(quality);cruises.setLowQuality(quality);marineDetails.setLowQuality?.(quality);$('quality').textContent=quality?'画质 · 轻盈':'画质 · 细腻';$('quality').setAttribute('aria-pressed',String(quality));resize();};
 $('home').onclick=e=>{e.preventDefault();setView('coast');};$('about').onclick=()=>$('help').showModal();
 const onVisibilityChange=()=>{running=!document.hidden;fairySky.setActive(running&&!previewing);last=0;};document.addEventListener('visibilitychange',onVisibilityChange);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;fairySky.setActive(false);toast('画面正在休息，请刷新后继续旅程。');});
 setView('coast');setPhase('day');let lastUi=-1;
 function frame(now){
  if(disposed)return;raf=requestAnimationFrame(frame);if(!running){last=0;return;}const dt=last?Math.min((now-last)/1000,.045):0;last=now;
  for(const k of Object.keys(env))env[k]=THREE.MathUtils.damp(env[k],targetEnv[k],1.25,dt);
  updateSky(dt);
  if(previewing){previewTime+=dt;planet.rotation.y+=dt*.027;}else if(!paused)time+=dt;
  const visualTime=previewing?previewTime:time,visualPaused=!previewing&&paused,visualDt=visualPaused?0:dt;
  railway.update(visualDt*(previewing?1:travelSpeed),visualTime,{...env,paused:visualPaused});town.update(visualTime,env);land.update(visualTime);marine.update(visualDt,visualTime,env);beacons.update(visualTime,env);landmarks.update(visualTime,env);harbor.update(visualTime,env);gardens.update(visualTime,env);stream.update(visualTime,env);nature.update(visualTime,{...env,paused:visualPaused});shoreLife.update(visualTime,{...env,paused:visualPaused});trails.update(visualTime,env);marineDetails.update(visualDt,visualTime,env);ocean.update(visualTime,env,sun.position,beacons.getBeams());petals.update(visualDt,visualTime,env);voyage.update(visualDt,visualTime,env);cruises.update(visualDt,visualTime,env);
  const moon=env.night*(1-env.dusk*.9);sun.intensity=1.92*env.daylight+.28+moon*.29;hemi.intensity=.60+.47*env.daylight-moon*.055;sun.color.copy(sunDay).lerp(sunDusk,env.dusk*.9).lerp(sunNight,moon);sun.position.set(-7.5-env.dusk*1.5,5.0-env.dusk*1.7,3.6);
  hemi.color.copy(hemiDay).lerp(hemiDusk,env.dusk).lerp(hemiNight,moon);hemi.groundColor.copy(groundDay).lerp(groundDusk,env.dusk).lerp(groundNight,moon);fill.color.copy(fillDay).lerp(fillDusk,env.dusk).lerp(fillNight,moon);fill.position.set(5,2,6);fill.intensity=.30+.16*env.daylight+moon*.035;renderer.toneMappingExposure=1.08+moon*.035;
  scene.fog.color.copy(fogDay).lerp(fogDusk,env.dusk).lerp(fogNight,moon);
  if(mode==='train')followTrain(false,dt);else if(mode==='cruise')followCruise(false,dt);else controls.update();anime.render(scene,camera,env);
  if(Math.floor(time)!==lastUi){lastUi=Math.floor(time);const s=railway.getState(),p=petals.getState();$('train-status').textContent=s.atStation?'镰仓高校前 · 稍作停留':s.crossing?.active?'道口铃响 · 江之电经过':'江之电 · 沿着湘南海岸';$('floating-count').textContent=p.floating;$('air-count').textContent=p.airborne;}
  if(!$('loading').hidden){$('loading').hidden=true;document.documentElement.dataset.ready='true';}
 }
 window.umiWorld={getState:()=>({world:'island-spring-and-paths-v5',previewing,mode,phase,paused,quality,running,time,fairySky:fairySky.getState(),train:railway.getState(),petals:petals.getState(),town:town.stats,marine:marine.getState?.()||marine.stats,voyage:voyage.getState?.()||voyage.stats,cruises:cruises.getState(),beacons:beacons.getState(),landmarks:landmarks.stats,harbor:{...harbor.stats,...harbor.getState()},gardens:gardens.stats,stream:{...stream.stats,...stream.getState()},nature:nature.stats,shoreLife:shoreLife.stats,trails:{...trails.stats,...trails.getState()},marineDetails:marineDetails.getState(),ocean:ocean.stats,railway:railway.stats,render:anime.getInfo(),camera:camera.position.toArray()}),getScene:()=>scene};
 const dispose=()=>{if(disposed)return;disposed=true;running=false;cancelAnimationFrame(raf);clearTimeout(toastTimer);document.removeEventListener?.('visibilitychange',onVisibilityChange);removeEventListener('pagehide',dispose);observer.disconnect();controls.dispose();fairySky.dispose();renderer.dispose();renderer.domElement.remove();};
 dispose.setPreview=setPreview;setPreview(preview);raf=requestAnimationFrame(frame);addEventListener('pagehide',dispose,{once:true});return dispose;
}
return boot();
}



