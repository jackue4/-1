import {THREE,R,normal,point,createPalette} from './core.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createFestivalWorld} from './world.js';
import {createFestivalRides} from './rides.js';
import {createFestivalEffects} from './festival-effects.js';
import {createFestivalAnimals} from './animals.js';
import {createAnimalPortraits} from './animal-portraits.js';
import {batchScenery} from './optimize.js';
import {createAnimeRenderer} from '../kamakura-planet/anime-render.js';
import {createStorybookSky} from '../twin-planets/storybook-sky.js';

export function mountFestival(document,{preview=false}={}){
 const $=id=>document.getElementById(id),host=$('scene'),mobile=matchMedia('(max-width:700px), (max-height:520px)').matches,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','星愿游乐园，拖动旋转或双指缩放');
 const scene=new THREE.Scene(),planet=new THREE.Group();planet.name='The Wishing Park';scene.add(planet);
 const palette=createPalette(),world=createFestivalWorld({planet,palette}),rides=createFestivalRides({planet,palette}),effects=createFestivalEffects({planet,palette}),animals=createFestivalAnimals({planet,palette,rides,world}),batching=batchScenery(planet);
 const camera=new THREE.PerspectiveCamera(38,1,.06,100),anime=createAnimeRenderer(renderer,camera);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=.4;controls.maxDistance=34;controls.rotateSpeed=.48;controls.zoomSpeed=.65;
 const hemi=new THREE.HemisphereLight('#e3eeed','#869d78',1.65),sun=new THREE.DirectionalLight('#ffebc3',2.6),fill=new THREE.DirectionalLight('#cddce9',.55);
 sun.position.set(-5,9,7);fill.position.set(7,3,-4);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:7,bottom:-5,near:.5,far:30});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.006;sun.shadow.bias=-.00012;scene.add(hemi,sun,fill);
 const castleLight=new THREE.PointLight('#ffcfa1',0,9,1.5);castleLight.position.copy(point(.78,.05,2.3));scene.add(castleLight);
 const sky=createStorybookSky({container:$('app'),variant:'night',seed:45813});
 const portraits=createAnimalPortraits(animals);
 let selectedAnimal='rabbit',portraitFollow=false;
 const animalNames={rabbit:'棉棉',bear:'麦麦',corgi:'阿栗'};
 const env={night:0,daylight:1,dusk:0,preview:false},targetEnv={...env};
 let mode='globe',phase='day',running=!document.hidden,paused=false,lowQuality=false,disposed=false,contextLost=false,previewing=false,previewSave=null,flight=null,last=0,time=0,previewTime=0,frameId=0,frameCount=0,uiTime=-1,toastTimer=0,viewWidth=0,viewHeight=0;
 const poses={castle:[.78,.05,.78,1.8,2.7],garden:[.46,-.71,.14,.68,1.12],village:[.08,-.50,.19,.70,1.15],animals:[.23,.40,.16,.85,.95],carousel:[.28,-.28,.42,.82,1.45],ferris:[.5,1.1,.75,1.2,2.25],teacups:[-.13,1.02,.24,.65,1.12],swings:[.15,2.2,.58,1.0,1.65],lagoon:[-.18,.4,-.035,1.15,1.5]};
 const getHome=(show=false)=>{
  const half=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
  const radius=show?5.8:previewing?5.05:camera.aspect<.8?5.05:4.88,distance=radius/Math.sin(Math.max(.09,half))*(previewing?.94:1.03);
  const target=show?normal(.78,.05).multiplyScalar(.95):new THREE.Vector3(0,.23,0);
  return{position:normal(show?.30:.21,show?.20:.22).multiplyScalar(distance).add(target),target,up:new THREE.Vector3(0,1,0)};
 };
 function balloonPose(){const group=world.animalBalloons.hero;group.updateWorldMatrix(true,false);const q=group.getWorldQuaternion(new THREE.Quaternion()),up=new THREE.Vector3(0,1,0).applyQuaternion(q),front=new THREE.Vector3(0,0,1).applyQuaternion(q),right=new THREE.Vector3(1,0,0).applyQuaternion(q),target=group.localToWorld(world.animalBalloons.heroCenter.clone()),fit=Math.max(1,.84/camera.aspect);return{target,up,position:target.clone().addScaledVector(front,1.75*fit).addScaledVector(right,.23*fit).addScaledVector(up,.08*fit)};}
 function poseFor(value){if(value==='balloons')return balloonPose();if(value==='animals')return portraits.getPose(selectedAnimal,camera.aspect);if(value==='globe'||value==='fireworks')return getHome(value==='fireworks');const [lat,lon,raise,upDistance,backDistance]=poses[value]||poses.castle,n=normal(lat,lon),east=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),north=new THREE.Vector3().crossVectors(n,east),target=point(lat,lon,raise);return{target,position:new THREE.Vector3().addScaledVector(n,upDistance).addScaledVector(east,backDistance*.65).addScaledVector(north,-backDistance).multiplyScalar(1.15*Math.max(1,.85/camera.aspect)).add(target),up:n};}
 function moveTo(pose,immediate=false){controls.autoRotate=false;flight=immediate||reduced?null:{startPosition:camera.position.clone(),startTarget:controls.target.clone(),startUp:camera.up.clone(),...pose,elapsed:0};if(!flight){camera.position.copy(pose.position);controls.target.copy(pose.target);camera.up.copy(pose.up);controls.update();}}
 function setView(value,immediate=false){mode=value;portraitFollow=value==='animals';$('park-friends').hidden=value!=='animals';document.documentElement.dataset.view=value;camera.fov=mode==='coaster'?66:camera.aspect<.8?48:38;camera.updateProjectionMatrix();controls.enabled=value!=='coaster'&&!previewing;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===value)));if(value==='coaster'){flight=null;followRide(0,true);}else moveTo(poseFor(value),immediate);}
 function setPhase(value){phase=value;document.documentElement.dataset.phase=value;Object.assign(targetEnv,value==='night'?{night:1,daylight:.14,dusk:0}:value==='dusk'?{night:.08,daylight:.8,dusk:1}:{night:0,daylight:1,dusk:0});document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.phase===value)));}
 function toast(text){$('park-toast').textContent=text;$('park-toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('park-toast').classList.remove('show'),3600);}
 const followPos=new THREE.Vector3(),followTarget=new THREE.Vector3(),followUp=new THREE.Vector3(),followSide=new THREE.Vector3();
 function followRide(dt,snap=false){const p=rides.getRidePose();if(!p)return;followUp.copy(p.up);followSide.crossVectors(p.up,p.tangent).normalize();followPos.copy(p.position).addScaledVector(p.up,.025).addScaledVector(p.tangent,.04);followTarget.copy(p.lookAhead||p.position.clone().addScaledVector(p.tangent,.8).addScaledVector(p.up,-.18));const factor=snap?1:1-Math.exp(-dt*12);camera.position.lerp(followPos,factor);controls.target.lerp(followTarget,factor);camera.up.lerp(followUp,factor).normalize();camera.lookAt(controls.target);}
 function resize(options){const preservePose=options?.preservePose===true;const rect=host.getBoundingClientRect();if(rect.width<1||rect.height<1)return;const sizeChanged=rect.width!==viewWidth||rect.height!==viewHeight;viewWidth=rect.width;viewHeight=rect.height;camera.aspect=rect.width/rect.height;camera.fov=mode==='coaster'?66:camera.aspect<.8?48:38;camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);if(mode!=='coaster'&&!preservePose&&sizeChanged)moveTo(poseFor(mode),true);renderer.shadowMap.needsUpdate=true;}
 const observer=new ResizeObserver(resize);observer.observe(host);
 function setPreview(value){value=!!value;if(value===previewing)return;
  if(value){previewSave={mode,phase,portraitFollow,rideState:rides.captureState?.(),env:{...env},targetEnv:{...targetEnv},position:camera.position.clone(),target:controls.target.clone(),up:camera.up.clone(),rotation:planet.quaternion.clone()};previewing=true;previewTime=time;env.preview=true;setPhase('day');Object.assign(env,targetEnv);setView('globe',true);controls.enabled=false;}
  else{const saved=previewSave;previewing=false;rides.restoreState?.(saved.rideState);planet.quaternion.copy(saved.rotation);setPhase(saved.phase);Object.assign(env,saved.env);Object.assign(targetEnv,saved.targetEnv);env.preview=false;setView(saved.mode,true);portraitFollow=saved.portraitFollow;camera.position.copy(saved.position);camera.up.copy(saved.up);controls.target.copy(saved.target);controls.update();previewSave=null;}
  sky.setActive(running&&!previewing);sky.update(0,previewing?{night:0}:env);document.documentElement.dataset.preview=String(previewing);last=0;resize({preservePose:!value});
 }
 function beginShow(){setPhase('night');setView('fireworks');paused=false;$('park-pause').textContent='Ⅱ';$('park-pause').setAttribute('aria-pressed','false');$('park-pause').setAttribute('aria-label','暂停游乐园');effects.startShow();toast('为你留好了城堡前的位置。烟花正在准备升空。');}
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{setView(b.dataset.view);if(mode==='coaster')toast('坐稳啦，下一站：山洞、花园和会开花的水湾。');});
 function setAnimal(value){if(!animalNames[value])return;selectedAnimal=value;document.querySelectorAll('[data-animal]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.animal===value)));setView('animals');}
 document.querySelectorAll('[data-animal]').forEach(b=>b.onclick=()=>setAnimal(b.dataset.animal));
 document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>setPhase(b.dataset.phase));$('night-show').onclick=beginShow;
 $('park-pause').onclick=()=>{paused=!paused;$('park-pause').textContent=paused?'▷':'Ⅱ';$('park-pause').setAttribute('aria-pressed',String(paused));$('park-pause').setAttribute('aria-label',paused?'继续游乐园':'暂停游乐园');};
 $('park-quality').onclick=()=>{lowQuality=!lowQuality;renderer.setPixelRatio(lowQuality?1:Math.min(devicePixelRatio,mobile?1.35:1.5));renderer.shadowMap.enabled=!lowQuality;renderer.shadowMap.needsUpdate=true;$('park-quality').textContent=lowQuality?'画质 · 轻盈':'画质 · 细腻';$('park-quality').setAttribute('aria-pressed',String(lowQuality));resize();};
 const cancelFlight=()=>{flight=null;portraitFollow=false;};controls.addEventListener('start',cancelFlight);
 function visibility(){running=!document.hidden&&!contextLost;last=0;sky.setActive(running&&!previewing);}
 document.addEventListener('visibilitychange',visibility);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;running=false;sky.setActive(false);toast('画面正在休息，刷新后继续你的旅程。');});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;visibility();renderer.shadowMap.needsUpdate=true;});
 resize();setView('globe',true);setPhase('day');setPreview(preview);
 const dayColor=new THREE.Color('#ffe9bd'),duskColor=new THREE.Color('#ffc3a1'),nightColor=new THREE.Color('#bec5f1');
 function frame(now){if(disposed)return;frameId=requestAnimationFrame(frame);if(!running){last=0;return;}const dt=last?Math.min((now-last)/1000,.05):0;last=now;for(const k of ['night','daylight','dusk'])env[k]=THREE.MathUtils.damp(env[k],targetEnv[k],1.25,dt);env.preview=previewing;
  if(previewing){previewTime+=dt;planet.rotation.y+=reduced?0:dt*.028;}else if(!paused)time+=dt;
  const visualDt=paused&&!previewing?0:dt,visualTime=previewing?previewTime:time;rides.update(visualDt,visualTime,env);effects.update(visualDt,visualTime,env);const effectState=effects.getState(),rideState=rides.getState();world.update(visualTime,env,rideState.events||rideState);animals.update(visualTime,env,effectState);palette.update(env.night,Math.sin(visualTime*1.2)*.15+(effectState.activeParticles>150?.35:0));
  sun.color.copy(dayColor).lerp(duskColor,env.dusk).lerp(nightColor,env.night);sun.intensity=2.2*env.daylight+.35;hemi.intensity=1.05+.6*env.daylight;fill.intensity=.48+env.night*.16;hemi.color.set('#d9f0e7').lerp(new THREE.Color('#b8b5dd'),env.night);hemi.groundColor.set('#889f81').lerp(new THREE.Color('#69718d'),env.night);castleLight.intensity=env.night*(3.2+(effectState.activeParticles>400?.6:0));renderer.toneMappingExposure=1.16+env.night*.04;
  sky.update(dt,previewing?{night:0}:env);$('app').style.setProperty('--storybook-night',String(previewing?0:env.night));
  if(flight){if(mode==='animals'&&portraitFollow)Object.assign(flight,poseFor('animals'));flight.elapsed+=dt;const a=Math.min(1,flight.elapsed/1.65),ease=a*a*(3-2*a);camera.position.lerpVectors(flight.startPosition,flight.position,ease);controls.target.lerpVectors(flight.startTarget,flight.target,ease);camera.up.lerpVectors(flight.startUp,flight.up,ease).normalize();if(a>=1)flight=null;}
  if(mode==='coaster'&&!previewing)followRide(dt);else{if(mode==='animals'&&portraitFollow&&!previewing&&!flight){const p=poseFor('animals'),blend=1-Math.exp(-dt*5);camera.position.lerp(p.position,blend);controls.target.lerp(p.target,blend);camera.up.lerp(p.up,blend).normalize();}controls.update();}if(++frameCount%5===0)renderer.shadowMap.needsUpdate=true;anime.render(scene,camera,env);
  if(Math.floor(now/300)!==uiTime){uiTime=Math.floor(now/300);$('show-card').hidden=previewing||env.night<.5;$('show-chapter').textContent=effectState.chapter||'序曲 · 第一颗星';$('show-progress').style.width=`${(effectState.progress||0)*100}%`;$('ride-caption').textContent=mode==='coaster'?(rideState.event||'环球列车 · 风从耳边轻轻经过'):mode==='animals'?`和${animalNames[selectedAnimal]}一起慢慢逛园。拖动画面，换个角度看朋友。`:mode==='balloons'?'云朵上的兔兔、小熊和柯基，把愿望轻轻带向天空。':mode==='garden'?'沿着野花和青草的小路，慢慢走到童话里。':mode==='lagoon'?'看小鱼穿过摇曳的水草，把一缕阳光留在湖底。':mode==='village'?'窗边开着花，屋檐挂着风铃，小店正在等你经过。':phase==='night'?'小动物仰望烟花，把今晚的星光装进愿望里。':'小动物也来游园啦，坐上木马，把快乐轻轻转一圈。';}
  if(!$('loading').hidden){$('loading').hidden=true;document.documentElement.dataset.ready='true';}
 }
 window.festivalWorld={getState:()=>({world:'wishing-park',mode,phase,selectedAnimal,portraitFollow,previewing,running,paused,time,env:{...env},scenery:world.stats,animals:animals.getState(),rides:rides.getState(),show:effects.getState(),batching,render:anime.getInfo(),fairySky:sky.getState(),camera:camera.position.toArray(),cameraTarget:controls.target.toArray(),cameraAspect:camera.aspect}),getScene:()=>scene,getAnimals:()=>animals.getSubjects(),setView,setAnimal,setPhase,startShow:beginShow};
 function dispose(){if(disposed)return;disposed=true;running=false;cancelAnimationFrame(frameId);clearTimeout(toastTimer);observer.disconnect();document.removeEventListener('visibilitychange',visibility);removeEventListener('pagehide',dispose);controls.dispose();sky.dispose();effects.dispose();anime.dispose();animals.dispose();world.dispose?.();const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});palette.dispose();renderer.dispose();renderer.domElement.remove();}
 dispose.setPreview=setPreview;frameId=requestAnimationFrame(frame);addEventListener('pagehide',dispose,{once:true});return dispose;
}
