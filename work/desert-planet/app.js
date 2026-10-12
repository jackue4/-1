import {THREE,normal,createPalette} from './core.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createDesertWorld} from './world.js';
import {createRenderBudget} from '../festival-planet/render-budget.js';
import {createAnimeRenderer} from '../kamakura-planet/anime-render.js';
import {createStorybookSky} from '../twin-planets/storybook-sky.js';

export function mountDesert(document,{preview=false}={}){
 const $=id=>document.getElementById(id),host=$('scene');
 const mobile=matchMedia('(max-width:700px), (max-height:520px)').matches,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const maxRatio=Math.min(devicePixelRatio,mobile?1.35:1.5);
 const renderer=new THREE.WebGLRenderer({antialias:false,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(maxRatio);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','沙海拾光，拖动环游，滚轮或双指缩放');
 const scene=new THREE.Scene(),planet=new THREE.Group();planet.name='沙海拾光 · Where the dunes meet the sea';scene.add(planet);
 const palette=createPalette(),world=createDesertWorld({planet,palette,mobile});
 const camera=new THREE.PerspectiveCamera(38,1,.04,100),anime=createAnimeRenderer(renderer,camera,{samples:2});
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;controls.minDistance=.35;controls.maxDistance=36;controls.rotateSpeed=.45;controls.zoomSpeed=.62;
 const hemi=new THREE.HemisphereLight('#f2ecd6','#9baf9c',1.65),sun=new THREE.DirectionalLight('#fff0ce',2.4),fill=new THREE.DirectionalLight('#bde4e0',.53);
 sun.position.set(-6,8,7);fill.position.set(6,2,-5);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
 Object.assign(sun.shadow.camera,{left:-5.8,right:5.8,top:6.8,bottom:-5.6,near:.5,far:30});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.006;sun.shadow.bias=-.00012;scene.add(hemi,sun,fill);
 const sky=createStorybookSky({container:$('app'),variant:'night',seed:56081}),env={night:0,daylight:1,dusk:0,preview:false},targetEnv={...env};
 const dayColor=new THREE.Color('#fff0ce'),duskColor=new THREE.Color('#ffbb99'),nightColor=new THREE.Color('#b7ccf6');
 const dayHemi=new THREE.Color('#f2ecd6'),duskHemi=new THREE.Color('#d9c3e4'),nightHemi=new THREE.Color('#719cb9');
 const dayGround=new THREE.Color('#9baf9c'),duskGround=new THREE.Color('#9b7d85'),nightGround=new THREE.Color('#3a6476');
 const dayFill=new THREE.Color('#bde4e0'),duskFill=new THREE.Color('#c2b4e9'),nightFill=new THREE.Color('#88ccd3');
 const budget=createRenderBudget({maxRatio,minRatio:Math.min(devicePixelRatio,.8)});
 const views=['globe','cove','camel','moon','treasury','oasis','kasbah','arch','caravan'];
 const captions={camel:'跟着小驼铃，慢慢走过沙堡、绿洲与海岸。拖动可自由看景，点击机位继续跟拍。',moon:'月光叫醒了绷带小精灵，它们带着暖暖的光，来沙海散步。',globe:'拖动环游 · 滚轮 / 双指靠近 · 让风替你翻一页沙与海',cove:'奶油色的悬崖围住一湾浅海，帐篷替你留下一片阴凉。',treasury:'穿过风雕刻的砂岩，停在玫瑰色的古老门廊前。',oasis:'棕榈把影子落进清水里，绿洲把旅途放慢一点。',kasbah:'沿着沙色的小巷，去找一扇亮着暖灯的窗。',arch:'风从石拱下穿过，海面轻轻接住最后一束夕阳。',caravan:'驼铃轻轻摇，热茶慢慢凉。走到这里，就让旅途歇一歇。'};
 let following=false;
 let mode='globe',phase='day',running=!document.hidden,paused=false,previewing=false,enteredPlay=!preview,saved=null,disposed=false,contextLost=false,lowQuality=false;
 let flight=null,time=0,previewTime=0,last=0,frameId=0,viewWidth=0,viewHeight=0,dirty=true,lastShadow=-Infinity,simulationFrames=0,renderFrames=0,shadowRefreshes=0;
 let skyCssNight=-1,skyCssAtmosphere=-1;
 function updateSky(dt){
  sky.update(dt,env);const night=previewing?0:env.night,atmosphere=previewing?0:Math.max(env.night,env.dusk);
  if(night!==skyCssNight){skyCssNight=night;$('app').style.setProperty('--storybook-night',String(night));}
  if(atmosphere!==skyCssAtmosphere){skyCssAtmosphere=atmosphere;$('app').style.setProperty('--storybook-atmosphere',String(atmosphere));}
 }
 function updateLighting(){
  const moon=env.night*(1-env.dusk*.88);
  sun.color.copy(dayColor).lerp(duskColor,env.dusk).lerp(nightColor,moon);sun.intensity=2.10*env.daylight+.32+moon*.18;sun.position.set(-6-env.dusk*2,8-env.dusk*4.8,7);
  hemi.intensity=1.05+.6*env.daylight-moon*.36;fill.intensity=.53-moon*.16;
  hemi.color.copy(dayHemi).lerp(duskHemi,env.dusk).lerp(nightHemi,moon);hemi.groundColor.copy(dayGround).lerp(duskGround,env.dusk).lerp(nightGround,moon);fill.color.copy(dayFill).lerp(duskFill,env.dusk).lerp(nightFill,moon);renderer.toneMappingExposure=1.12-moon*.025;
 }
 function globePose(){
  const half=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
  const target=new THREE.Vector3(0,.14,0),radius=4.7,distance=radius/Math.sin(Math.max(.09,half));
  return{position:normal(.28,.08).multiplyScalar(distance).add(target),target,up:new THREE.Vector3(0,1,0)};
 }
 function poseFor(value){return value==='globe'?globePose():world.getPose(value,camera.aspect)||globePose();}
 function moveTo(pose,immediate=false){
  dirty=true;controls.autoRotate=false;
  flight=immediate||reduced?null:{startPosition:camera.position.clone(),startTarget:controls.target.clone(),startUp:camera.up.clone(),...pose,elapsed:0};
  if(!flight){camera.position.copy(pose.position);controls.target.copy(pose.target);camera.up.copy(pose.up);controls.update();}
 }
 function setView(value,immediate=false){
  if(!views.includes(value)||disposed)return;
  dirty=true;mode=value;following=value==='camel';if(value==='moon'&&!previewing)setPhase('night');document.documentElement.dataset.view=value;camera.fov=camera.aspect<.8?48:38;camera.updateProjectionMatrix();controls.enabled=!previewing;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===value)));$('desert-caption').textContent=captions[value];moveTo(poseFor(value),immediate);
 }
 function setPhase(value){
  if(!['day','dusk','night'].includes(value)||disposed)return;
  dirty=true;phase=value;document.documentElement.dataset.phase=value;
  Object.assign(targetEnv,value==='night'?{night:1,daylight:.18,dusk:0}:value==='dusk'?{night:.10,daylight:.78,dusk:1}:{night:0,daylight:1,dusk:0});
  document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.phase===value)));
  $('desert-poem').textContent=value==='night'?'沙丘睡着了，海湾还有一盏灯。':value==='dusk'?'把落日，留在沙与海的交界。':'风有风的方向，你有你的慢时光。';
 }
 function resize(options){
  const rect=host.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
  const changed=rect.width!==viewWidth||rect.height!==viewHeight;viewWidth=rect.width;viewHeight=rect.height;dirty=true;
  camera.aspect=rect.width/rect.height;camera.fov=camera.aspect<.8?48:38;camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);
  if(changed&&!options?.preservePose)moveTo(poseFor(mode),true);renderer.shadowMap.needsUpdate=true;
 }
 const observer=new ResizeObserver(resize);observer.observe(host);
 function setPreview(value){
  value=!!value;if(value===previewing||disposed)return;
  if(value){
   saved={mode,phase,time,following,env:{...env},targetEnv:{...targetEnv},position:camera.position.clone(),target:controls.target.clone(),up:camera.up.clone(),rotation:planet.quaternion.clone()};
   previewTime=time;previewing=true;env.preview=true;setPhase('day');Object.assign(env,targetEnv);setView('globe',true);controls.enabled=false;
  }else{
   previewing=false;time=saved.time;planet.quaternion.copy(saved.rotation);setPhase(saved.phase);Object.assign(env,saved.env);Object.assign(targetEnv,saved.targetEnv);env.preview=false;
   // Restore the absolute scene state now, even when the destination is paused.
   world.update(time,env);palette.update?.(env.night);setView(saved.mode,true);
   camera.position.copy(saved.position);camera.up.copy(saved.up);controls.target.copy(saved.target);controls.enabled=true;controls.update();following=saved.following;saved=null;
  }
  dirty=true;renderer.shadowMap.needsUpdate=true;document.documentElement.dataset.preview=String(previewing);sky.setActive(running&&!previewing);updateSky(0);updateLighting();last=0;resize({preservePose:!value});
  if(!value&&!enteredPlay){enteredPlay=true;moveTo(poseFor(mode),true);}
 }
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
 document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>setPhase(b.dataset.phase));
 $('desert-pause').onclick=()=>{paused=!paused;$('desert-pause').textContent=paused?'▷':'Ⅱ';$('desert-pause').setAttribute('aria-pressed',String(paused));$('desert-pause').setAttribute('aria-label',paused?'继续沙海拾光':'暂停沙海拾光');last=0;};
 $('desert-quality').onclick=()=>{
  lowQuality=!lowQuality;renderer.setPixelRatio(budget.reset(lowQuality?Math.min(devicePixelRatio,1):maxRatio));renderer.shadowMap.enabled=!lowQuality;renderer.shadowMap.needsUpdate=true;dirty=true;
  $('desert-quality').textContent=lowQuality?'画质 · 轻盈':'画质 · 细腻';$('desert-quality').setAttribute('aria-pressed',String(lowQuality));resize({preservePose:true});
 };
 controls.addEventListener('start',()=>{flight=null;following=false;});controls.addEventListener('change',()=>{dirty=true;});
 function visibility(){
  running=!document.hidden&&!contextLost&&!disposed;last=0;dirty=true;sky.setActive(running&&!previewing);
  if(!running){cancelAnimationFrame(frameId);frameId=0;}else if(!frameId)frameId=requestAnimationFrame(frame);
 }
 function onContextLost(event){event.preventDefault();contextLost=true;visibility();}
 function onContextRestored(){contextLost=false;renderer.shadowMap.needsUpdate=true;visibility();}
 document.addEventListener('visibilitychange',visibility);renderer.domElement.addEventListener('webglcontextlost',onContextLost);renderer.domElement.addEventListener('webglcontextrestored',onContextRestored);
 resize();setPhase('day');setView('globe',true);setPreview(preview);
 function frame(now){
  frameId=0;if(disposed||!running){last=0;return;}frameId=requestAnimationFrame(frame);
  const elapsed=last?now-last:0,dt=Math.min(elapsed/1000,.05);last=now;let environmentMoving=false;
  for(const k of ['night','daylight','dusk']){const delta=Math.abs(env[k]-targetEnv[k]);environmentMoving ||= delta>0;env[k]=delta<.00005?targetEnv[k]:THREE.MathUtils.damp(env[k],targetEnv[k],1.25,dt);}env.preview=previewing;
  if(!paused&&!flight&&!previewing){const ratio=budget.sample(elapsed);if(ratio!==null){renderer.setPixelRatio(ratio);resize({preservePose:true});}}
  if(previewing){previewTime+=dt;planet.rotation.y+=reduced?0:dt*.028;}else if(!paused)time+=dt;
  const visualDt=paused&&!previewing?0:dt,visualTime=previewing?previewTime:time,simulationMoving=!paused||previewing||environmentMoving||dirty;
  if(simulationMoving){
   simulationFrames++;world.update(visualTime,env);palette.update?.(env.night);updateLighting();
  }
  updateSky(environmentMoving?dt:visualDt);
  if(flight){dirty=true;flight.elapsed+=dt;const a=Math.min(1,flight.elapsed/1.65),ease=a*a*(3-2*a);camera.position.lerpVectors(flight.startPosition,flight.position,ease);controls.target.lerpVectors(flight.startTarget,flight.target,ease);camera.up.lerpVectors(flight.startUp,flight.up,ease).normalize();if(a>=1)flight=null;}
  if(following&&!previewing&&!paused&&!flight){const pose=poseFor('camel'),a=1-Math.exp(-dt*3.2);camera.position.lerp(pose.position,a);controls.target.lerp(pose.target,a);camera.up.lerp(pose.up,a).normalize();dirty=true;}
  controls.update();
  if(simulationMoving||dirty||renderer.shadowMap.needsUpdate){
   if(renderer.shadowMap.enabled&&(renderer.shadowMap.needsUpdate||simulationMoving&&now-lastShadow>=(mobile?180:125))){renderer.shadowMap.needsUpdate=true;lastShadow=now;shadowRefreshes++;}
   anime.render(scene,camera,env);renderer.shadowMap.needsUpdate=false;renderFrames++;dirty=false;
   if(!$('loading').hidden){$('loading').hidden=true;document.documentElement.dataset.ready='true';}
  }
 }
 const api={getState:()=>({world:'desert-shores',mode,following,phase,running,paused,previewing,time,env:{...env},scenery:world.stats,worldState:world.getState?.(),render:anime.getInfo(),performance:{...budget.getState(),simulationFrames,renderFrames,shadowRefreshes},fairySky:sky.getState(),camera:camera.position.toArray(),cameraTarget:controls.target.toArray(),cameraUp:camera.up.toArray(),cameraAspect:camera.aspect,planetRotation:planet.quaternion.toArray(),lowQuality}),getScene:()=>scene,setView,setPhase};
 window.desertWorld=api;
 function dispose(){
  if(disposed)return;disposed=true;running=false;cancelAnimationFrame(frameId);frameId=0;observer.disconnect();document.removeEventListener('visibilitychange',visibility);removeEventListener('pagehide',dispose);
  renderer.domElement.removeEventListener('webglcontextlost',onContextLost);renderer.domElement.removeEventListener('webglcontextrestored',onContextRestored);
  controls.dispose();sky.dispose();world.dispose();anime.dispose();sun.shadow.dispose();palette.dispose?.();renderer.dispose();renderer.domElement.remove();if(window.desertWorld===api)delete window.desertWorld;
 }
 dispose.setPreview=setPreview;if(running)frameId=requestAnimationFrame(frame);addEventListener('pagehide',dispose,{once:true});return dispose;
}
